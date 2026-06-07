import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentCustomer } from "@/lib/auth";
import { buildPricingContext, priceFor } from "@/lib/pricing";
import { buildFreightContext, resolveFreightCost } from "@/lib/freight";
import { formatBRL } from "@/lib/format";

const bodySchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    document: z.string().optional(),
  }),
  shipping: z
    .object({
      zipCode: z.string().min(8, "Informe o CEP."),
      street: z.string().min(2, "Informe o endereço."),
      number: z.string().min(1, "Informe o número."),
      complement: z.string().optional(),
      district: z.string().min(2, "Informe o bairro."),
      city: z.string().min(2, "Informe a cidade."),
      state: z.string().min(2, "Informe o estado."),
      cost: z.number().nonnegative().optional(),
    }),
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        sku: z.string(),
        price: z.number().nonnegative(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const sessionCustomer = await getCurrentCustomer();
  if (!sessionCustomer) {
    return NextResponse.json(
      { error: "Você precisa estar logado para finalizar o pedido." },
      { status: 401 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { customer, items, shipping, notes } = parsed.data;

  // Recalcula os preços no servidor conforme o tipo do cliente (PF/PJ) e
  // promoções ativas — nunca confia no preço enviado pelo cliente.
  const pricing = await buildPricingContext();
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.id) } },
    select: { id: true, name: true, sku: true, price: true, categoryId: true },
  });
  const productById = new Map(dbProducts.map((p) => [p.id, p]));

  const pricedItems = items.map((i) => {
    const product = productById.get(i.id);
    const unitPrice = product
      ? priceFor(
          { id: product.id, price: Number(product.price), categoryId: product.categoryId },
          pricing,
        ).price
      : i.price;
    return {
      productId: product ? product.id : null,
      name: product?.name ?? i.name,
      sku: product?.sku ?? i.sku,
      quantity: i.quantity,
      unitPrice,
    };
  });

  const subtotal = pricedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  // Pedido mínimo para clientes de atacado (PJ).
  if (pricing.isB2B && pricing.minOrder > 0 && subtotal < pricing.minOrder) {
    return NextResponse.json(
      {
        error: `Pedido mínimo para atacado (CNPJ) é de ${formatBRL(pricing.minOrder)}. Seu subtotal é ${formatBRL(subtotal)}.`,
      },
      { status: 400 },
    );
  }

  const shippingCost =
    shipping?.cost != null && shipping.cost > 0
      ? resolveFreightCost(shipping.cost, subtotal, await buildFreightContext())
      : 0;
  const total = subtotal + shippingCost;

  try {
    // Pedido sempre vinculado à conta da sessão (ignora e-mail vindo do corpo).
    // Salva o endereço informado como endereço padrão do cliente.
    const dbCustomer = await prisma.customer.update({
      where: { id: sessionCustomer.id },
      data: {
        name: customer.name,
        phone: customer.phone,
        document: customer.document,
        zipCode: shipping.zipCode.replace(/\D/g, ""),
        street: shipping.street,
        number: shipping.number,
        complement: shipping.complement || null,
        district: shipping.district || null,
        city: shipping.city,
        state: shipping.state,
      },
    });

    const order = await prisma.order.create({
      data: {
        customerId: dbCustomer.id,
        status: "PENDING",
        subtotal,
        shippingCost,
        total,
        notes,
        items: {
          create: pricedItems.map((i) => ({
            productId: i.productId,
            name: i.name,
            sku: i.sku,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
        shipment: {
          create: {
            carrier: "JT_EXPRESS",
            zipCode: shipping.zipCode.replace(/\D/g, ""),
            street: shipping.street,
            number: shipping.number,
            complement: shipping.complement || null,
            district: shipping.district || null,
            city: shipping.city,
            state: shipping.state,
            cost: shippingCost,
          },
        },
      },
      select: { id: true, number: true, total: true },
    });

    return NextResponse.json({ ok: true, order });
  } catch (err) {
    console.error("Erro ao criar pedido", err);
    return NextResponse.json(
      { error: "Não foi possível criar o pedido. Verifique se o banco está configurado." },
      { status: 500 },
    );
  }
}
