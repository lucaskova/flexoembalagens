import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "default";

export type PublicSettings = {
  name: string;
  description: string | null;
  logoUrl: string | null;
  themeColor: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  announcement: string | null;
  announcementEnabled: boolean;
  freeShippingEnabled: boolean;
  freeShippingThreshold: number | null;
  b2bEnabled: boolean;
  b2bDiscountPercent: number | null;
  b2bMinOrder: number | null;
  b2bMinFreight: number | null;
  b2bFreeShippingEnabled: boolean;
  b2bFreeShippingThreshold: number | null;
  heroEnabled: boolean;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroCtaLabel: string | null;
  featuredCarouselEnabled: boolean;
  featuredTitle: string | null;
};

const FALLBACK: PublicSettings = {
  name: process.env.NEXT_PUBLIC_STORE_NAME ?? "Lambari Pesca",
  description: null,
  logoUrl: null,
  themeColor: null,
  whatsapp: null,
  email: null,
  instagram: null,
  announcement: null,
  announcementEnabled: false,
  freeShippingEnabled: false,
  freeShippingThreshold: null,
  b2bEnabled: false,
  b2bDiscountPercent: null,
  b2bMinOrder: null,
  b2bMinFreight: null,
  b2bFreeShippingEnabled: false,
  b2bFreeShippingThreshold: null,
  heroEnabled: true,
  heroTitle: null,
  heroSubtitle: null,
  heroCtaLabel: null,
  featuredCarouselEnabled: true,
  featuredTitle: null,
};

// Garante que sempre exista o registro único de configurações.
export async function getSettings() {
  return prisma.storeSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
}

// Versão tolerante a falhas, para componentes da loja (banco offline -> fallback).
export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const s = await getSettings();
    return {
      name: s.name,
      description: s.description,
      logoUrl: s.logoUrl,
      themeColor: s.themeColor,
      whatsapp: s.whatsapp,
      email: s.email,
      instagram: s.instagram,
      announcement: s.announcement,
      announcementEnabled: s.announcementEnabled,
      freeShippingEnabled: s.freeShippingEnabled,
      freeShippingThreshold: s.freeShippingThreshold,
      b2bEnabled: s.b2bEnabled,
      b2bDiscountPercent: s.b2bDiscountPercent,
      b2bMinOrder: s.b2bMinOrder,
      b2bMinFreight: s.b2bMinFreight,
      b2bFreeShippingEnabled: s.b2bFreeShippingEnabled,
      b2bFreeShippingThreshold: s.b2bFreeShippingThreshold,
      heroEnabled: s.heroEnabled,
      heroTitle: s.heroTitle,
      heroSubtitle: s.heroSubtitle,
      heroCtaLabel: s.heroCtaLabel,
      featuredCarouselEnabled: s.featuredCarouselEnabled,
      featuredTitle: s.featuredTitle,
    };
  } catch {
    return FALLBACK;
  }
}
