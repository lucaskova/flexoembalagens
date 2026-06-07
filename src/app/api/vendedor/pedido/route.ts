import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSeller } from "@/lib/seller-auth";
import { buildPricingContextForType, priceFor } from "@/lib/pricing";
import { formatBRL } from "@/lib/format";

const schema = z.object({
  customerId: z.string().min(1, "Selecione o cliente."),
  items: z
    .array(z.object({ id: z.string(), quantity: z.number().int().positive() }))
    .min(1, "Adicione ao menos um produto."),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const seller = await getCurrentSeller();
  if (!seller) {
    return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const { customerId, items, notes } = parsed.data;

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  const sellerRecord = await prisma.seller.findUnique({
    where: { id: seller.id },
    select: { commissionPercent: true },
  });
  const commissionPercent = sellerRecord?.commissionPercent ?? 0;

  const pricing = await buildPricingContextForType(customer.type);
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.id) } },
    select: { id: true, name: true, sku: true, price: true, categoryId: true },
  });
  const productById = new Map(dbProducts.map((p) => [p.id, p]));

  const pricedItems = items
    .map((i) => {
      const product = productById.get(i.id);
      if (!product) return null;
      const unitPrice = priceFor(
        { id: product.id, price: Number(product.price), categoryId: product.categoryId },
        pricing,
      ).price;
      return {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: i.quantity,
        unitPrice,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (pricedItems.length === 0) {
    return NextResponse.json({ error: "Nenhum produto válido no pedido." }, { status: 400 });
  }

  const subtotal = pricedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  if (pricing.isB2B && pricing.minOrder > 0 && subtotal < pricing.minOrder) {
    return NextResponse.json(
      {
        error: `Pedido mínimo para atacado é de ${formatBRL(pricing.minOrder)}. Subtotal atual: ${formatBRL(subtotal)}.`,
      },
      { status: 400 },
    );
  }

  try {
    const sellerCommission = Number(((subtotal * commissionPercent) / 100).toFixed(2));

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        sellerId: seller.id,
        sellerCommission,
        status: "PENDING",
        subtotal,
        shippingCost: 0,
        total: subtotal,
        notes: notes ? `[Vendedor: ${seller.name}] ${notes}` : `[Vendedor: ${seller.name}]`,
        items: {
          create: pricedItems.map((i) => ({
            productId: i.productId,
            name: i.name,
            sku: i.sku,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
        shipment: customer.zipCode
          ? {
              create: {
                carrier: "JT_EXPRESS",
                zipCode: customer.zipCode,
                street: customer.street,
                number: customer.number,
                complement: customer.complement,
                district: customer.district,
                city: customer.city,
                state: customer.state,
                cost: 0,
              },
            }
          : undefined,
      },
      select: { id: true, number: true, total: true },
    });

    return NextResponse.json({ ok: true, order });
  } catch {
    return NextResponse.json({ error: "Não foi possível criar o pedido." }, { status: 500 });
  }
}
