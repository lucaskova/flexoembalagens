"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function str(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").trim();
}

function num(raw: FormDataEntryValue | null): number | null {
  const value = str(raw).replace(/\./g, "").replace(",", ".");
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Aceita só cores hex válidas (#RGB ou #RRGGBB); senão volta ao padrão (null).
function normalizeHex(raw: string): string | null {
  const v = raw.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return v.toLowerCase();
  return null;
}

export async function updateSettings(formData: FormData) {
  const data = {
    name: str(formData.get("name")) || "Lambari Pesca",
    description: str(formData.get("description")) || null,
    logoUrl: str(formData.get("logoUrl")) || null,
    themeColor: normalizeHex(str(formData.get("themeColor"))),
    whatsapp: str(formData.get("whatsapp")) || null,
    email: str(formData.get("email")) || null,
    instagram: str(formData.get("instagram")) || null,
    announcement: str(formData.get("announcement")) || null,
    announcementEnabled: formData.get("announcementEnabled") === "on",
    freeShippingEnabled: formData.get("freeShippingEnabled") === "on",
    freeShippingThreshold: num(formData.get("freeShippingThreshold")),
    b2bEnabled: formData.get("b2bEnabled") === "on",
    b2bDiscountPercent: num(formData.get("b2bDiscountPercent")),
    b2bMinOrder: num(formData.get("b2bMinOrder")),
    b2bMinFreight: num(formData.get("b2bMinFreight")),
    b2bFreeShippingEnabled: formData.get("b2bFreeShippingEnabled") === "on",
    b2bFreeShippingThreshold: num(formData.get("b2bFreeShippingThreshold")),
    heroEnabled: formData.get("heroEnabled") === "on",
    heroTitle: str(formData.get("heroTitle")) || null,
    heroSubtitle: str(formData.get("heroSubtitle")) || null,
    heroCtaLabel: str(formData.get("heroCtaLabel")) || null,
    featuredCarouselEnabled: formData.get("featuredCarouselEnabled") === "on",
    featuredTitle: str(formData.get("featuredTitle")) || null,
  };

  try {
    await prisma.storeSettings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar";
    redirect(`/admin/configuracoes?err=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/admin/configuracoes");
  revalidatePath("/");
  redirect("/admin/configuracoes?ok=1");
}
