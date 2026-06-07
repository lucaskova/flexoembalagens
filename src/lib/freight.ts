import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";
import {
  type FreightContext,
  resolveFreightCost,
  qualifiesFreeShipping,
  freeShippingThreshold,
  freeShippingActive,
} from "@/lib/freight-rules";

export type { FreightContext };
export { resolveFreightCost, qualifiesFreeShipping, freeShippingThreshold, freeShippingActive };

export async function buildFreightContext(): Promise<FreightContext & { b2bEnabled: boolean }> {
  try {
    const [s, customer] = await Promise.all([
      prisma.storeSettings.findUnique({ where: { id: "default" } }),
      getCurrentCustomer(),
    ]);
    const b2bEnabled = s?.b2bEnabled ?? false;
    const isB2B = b2bEnabled && customer?.type === "PJ";
    return {
      b2bEnabled,
      isB2B,
      freeShippingEnabled: s?.freeShippingEnabled ?? false,
      freeShippingThreshold: s?.freeShippingThreshold ?? 0,
      b2bMinFreight: s?.b2bMinFreight ?? 0,
      b2bFreeShippingEnabled: s?.b2bFreeShippingEnabled ?? false,
      b2bFreeShippingThreshold: s?.b2bFreeShippingThreshold ?? 0,
    };
  } catch {
    return {
      b2bEnabled: false,
      isB2B: false,
      freeShippingEnabled: false,
      freeShippingThreshold: 0,
      b2bMinFreight: 0,
      b2bFreeShippingEnabled: false,
      b2bFreeShippingThreshold: 0,
    };
  }
}
