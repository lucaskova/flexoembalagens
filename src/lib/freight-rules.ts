export type FreightContext = {
  isB2B: boolean;
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  b2bMinFreight: number;
  b2bFreeShippingEnabled: boolean;
  b2bFreeShippingThreshold: number;
};

export function resolveFreightCost(
  quotedValue: number | null | undefined,
  subtotal: number,
  ctx: FreightContext,
): number {
  if (ctx.isB2B) {
    if (
      ctx.b2bFreeShippingEnabled &&
      ctx.b2bFreeShippingThreshold > 0 &&
      subtotal >= ctx.b2bFreeShippingThreshold
    ) {
      return 0;
    }
    // Sem cotação ainda (checkout “frete após confirmação”) — não aplica piso.
    if (quotedValue == null) return 0;
    if (ctx.b2bMinFreight > 0) {
      return Math.max(quotedValue, ctx.b2bMinFreight);
    }
    return quotedValue;
  }

  if (
    ctx.freeShippingEnabled &&
    ctx.freeShippingThreshold > 0 &&
    subtotal >= ctx.freeShippingThreshold
  ) {
    return 0;
  }

  return quotedValue ?? 0;
}

export function qualifiesFreeShipping(subtotal: number, ctx: FreightContext): boolean {
  if (ctx.isB2B) {
    return (
      ctx.b2bFreeShippingEnabled &&
      ctx.b2bFreeShippingThreshold > 0 &&
      subtotal >= ctx.b2bFreeShippingThreshold
    );
  }
  return (
    ctx.freeShippingEnabled &&
    ctx.freeShippingThreshold > 0 &&
    subtotal >= ctx.freeShippingThreshold
  );
}

export function freeShippingThreshold(ctx: FreightContext): number | null {
  if (ctx.isB2B) {
    return ctx.b2bFreeShippingEnabled && ctx.b2bFreeShippingThreshold > 0
      ? ctx.b2bFreeShippingThreshold
      : null;
  }
  return ctx.freeShippingEnabled && ctx.freeShippingThreshold > 0
    ? ctx.freeShippingThreshold
    : null;
}

export function freeShippingActive(ctx: FreightContext): boolean {
  if (ctx.isB2B) return ctx.b2bFreeShippingEnabled;
  return ctx.freeShippingEnabled;
}
