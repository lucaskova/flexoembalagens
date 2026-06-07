import { NextRequest, NextResponse } from "next/server";
import { quoteJtExpress } from "@/lib/integrations/jt-express";
import { buildFreightContext, resolveFreightCost } from "@/lib/freight";
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

  const totalQuantity = parsed.data.items.reduce((sum, i) => sum + i.quantity, 0);
  const weightGrams = Math.max(totalQuantity * DEFAULT_ITEM_WEIGHT_GRAMS, 300);

  const quote = await quoteJtExpress({
    zipCode: parsed.data.toCep.replace(/\D/g, ""),
    weightGrams,
  });

  if (!quote) {
    return NextResponse.json({
      value: null,
      message: "Frete J&T não configurado. Configure as credenciais no admin.",
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
