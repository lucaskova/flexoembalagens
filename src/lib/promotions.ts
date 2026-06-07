import { prisma } from "@/lib/prisma";
import type { Promotion } from "@prisma/client";

export type PricedProduct = {
  price: number;
  originalPrice: number | null;
  discountLabel: string | null;
  promotionTitle: string | null;
};

// Promoções ativas e dentro da janela de datas.
export async function getActivePromotions(): Promise<Promotion[]> {
  try {
    const now = new Date();
    const promos = await prisma.promotion.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });
    return promos.filter((p) => {
      if (p.startsAt && p.startsAt > now) return false;
      if (p.endsAt && p.endsAt < now) return false;
      return true;
    });
  } catch {
    return [];
  }
}

function promoApplies(
  promo: Promotion,
  product: { id: string; categoryId: string | null },
): boolean {
  if (promo.scope === "STORE") return true;
  if (promo.scope === "PRODUCT") return promo.productId === product.id;
  if (promo.scope === "CATEGORY")
    return !!product.categoryId && promo.categoryId === product.categoryId;
  return false;
}

function discountedPrice(price: number, promo: Promotion): number {
  if (promo.discountType === "FIXED") {
    return Math.max(0, price - promo.discountValue);
  }
  // PERCENT
  const pct = Math.min(Math.max(promo.discountValue, 0), 100);
  return Math.max(0, price * (1 - pct / 100));
}

function label(promo: Promotion): string {
  if (promo.discountType === "FIXED") {
    return `-${promo.discountValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}`;
  }
  return `-${Math.round(promo.discountValue)}%`;
}

// Aplica a melhor promoção (menor preço final) a um produto.
export function applyBestPromotion(
  product: { id: string; price: number; categoryId: string | null },
  promotions: Promotion[],
): PricedProduct {
  let best: { price: number; promo: Promotion } | null = null;

  for (const promo of promotions) {
    if (!promoApplies(promo, product)) continue;
    const final = discountedPrice(product.price, promo);
    if (final < product.price && (!best || final < best.price)) {
      best = { price: final, promo };
    }
  }

  if (!best) {
    return {
      price: product.price,
      originalPrice: null,
      discountLabel: null,
      promotionTitle: null,
    };
  }

  return {
    price: Number(best.price.toFixed(2)),
    originalPrice: product.price,
    discountLabel: label(best.promo),
    promotionTitle: best.promo.title,
  };
}
