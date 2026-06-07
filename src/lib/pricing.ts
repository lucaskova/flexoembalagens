import type { Promotion } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActivePromotions, applyBestPromotion, type PricedProduct } from "@/lib/promotions";
import { getCurrentCustomer } from "@/lib/auth";

export type B2BSettings = {
  enabled: boolean;
  discountPercent: number;
  minOrder: number;
};

export async function getB2BSettings(): Promise<B2BSettings> {
  try {
    const s = await prisma.storeSettings.findUnique({ where: { id: "default" } });
    return {
      enabled: s?.b2bEnabled ?? false,
      discountPercent: s?.b2bDiscountPercent ?? 0,
      minOrder: s?.b2bMinOrder ?? 0,
    };
  } catch {
    return { enabled: false, discountPercent: 0, minOrder: 0 };
  }
}

export type PricingContext = {
  promotions: Promotion[];
  isB2B: boolean;
  b2bDiscountPercent: number;
  minOrder: number;
};

// Monta o contexto de precificação para a requisição atual,
// considerando promoções ativas e o tipo do cliente logado (PF/PJ).
export async function buildPricingContext(): Promise<PricingContext> {
  const [promotions, b2b, customer] = await Promise.all([
    getActivePromotions(),
    getB2BSettings(),
    getCurrentCustomer(),
  ]);
  const isB2B = b2b.enabled && customer?.type === "PJ";
  return {
    promotions,
    isB2B,
    b2bDiscountPercent: b2b.discountPercent,
    minOrder: b2b.minOrder,
  };
}

// Preço final para um produto: aplica a melhor promoção e, para clientes
// de atacado (PJ), o desconto B2B sobre o preço já promocional.
export function priceFor(
  product: { id: string; price: number; categoryId: string | null },
  ctx: PricingContext,
): PricedProduct {
  const list = product.price;
  const promo = applyBestPromotion(product, ctx.promotions);

  let finalPrice = promo.price;
  let discountLabel = promo.discountLabel;
  let promotionTitle = promo.promotionTitle;

  if (ctx.isB2B && ctx.b2bDiscountPercent > 0) {
    const pct = Math.min(Math.max(ctx.b2bDiscountPercent, 0), 100);
    finalPrice = Number((finalPrice * (1 - pct / 100)).toFixed(2));
    discountLabel = "Atacado";
    promotionTitle = "Preço de atacado";
  }

  const originalPrice = finalPrice < list ? list : null;

  return { price: finalPrice, originalPrice, discountLabel, promotionTitle };
}
