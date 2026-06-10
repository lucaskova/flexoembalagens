import { NextRequest, NextResponse } from "next/server";
import { quoteJtExpress } from "@/lib/integrations/jt-express";
import { buildFreightContext, resolveFreightCost } from "@/lib/freight";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  toCep: z.string().min(8).max(9),
  subtotal: z.number().nonnegative().optional(),
  items: z
    .array(
      z.object({
        sku: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

// Peso padrão por item até termos peso real cadastrado no produto.
const DEFAULT_ITEM_WEIGHT_GRAMS = 500;

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ value: null, error: "Dados inválidos" }, { status: 400 });
  }

  // Busca peso/dimensões reais dos produtos cadastrados (fallback no padrão).
  const skus = parsed.data.items.map((i) => i.sku);
  let products: Array<{
    sku: string;
    weightGrams: number | null;
    widthCm: number | null;
    heightCm: number | null;
    lengthCm: number | null;
  }> = [];
  try {
    products = await prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { sku: true, weightGrams: true, widthCm: true, heightCm: true, lengthCm: true },
    });
  } catch {
    // banco offline: segue com peso padrão
  }
  const bySku = new Map(products.map((p) => [p.sku, p]));

  let weightGrams = 0;
  for (const item of parsed.data.items) {
    const p = bySku.get(item.sku);
    const itemWeight = p?.weightGrams ?? DEFAULT_ITEM_WEIGHT_GRAMS;
    weightGrams += itemWeight * item.quantity;
  }
  weightGrams = Math.max(weightGrams, 300);

  const quote = await quoteJtExpress({
    destinationZipCode: parsed.data.toCep.replace(/\D/g, ""),
    weightGrams,
    insuredAmount: parsed.data.subtotal,
  });

  if (!quote) {
    return NextResponse.json({
      value: null,
      message:
        "Frete J&T indisponível. Verifique JT_API_ACCOUNT, JT_PRIVATE_KEY, JT_CUSTOMER_CODE e JT_ORIGIN_ZIP_CODE.",
    });
  }

  const ctx = await buildFreightContext();
  const subtotal = parsed.data.subtotal ?? 0;
  const rawValue = quote.cost;
  const finalValue = resolveFreightCost(rawValue, subtotal, ctx);

  return NextResponse.json({
    value: finalValue,
    rawValue,
    minFreightApplied: ctx.isB2B && ctx.b2bMinFreight > 0 && finalValue > rawValue,
    deadlineDays: quote.estimatedDays,
    carrier: quote.service,
  });
}
