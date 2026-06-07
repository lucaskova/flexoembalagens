"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function str(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").trim();
}

function num(raw: FormDataEntryValue | null): number {
  const value = str(raw).replace(/\./g, "").replace(",", ".");
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function date(raw: FormDataEntryValue | null): Date | null {
  const value = str(raw);
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildData(formData: FormData) {
  const scope = str(formData.get("scope")) || "PRODUCT";
  return {
    title: str(formData.get("title")) || "Promoção",
    description: str(formData.get("description")) || null,
    discountType: str(formData.get("discountType")) || "PERCENT",
    discountValue: num(formData.get("discountValue")),
    scope,
    productId: scope === "PRODUCT" ? str(formData.get("productId")) || null : null,
    categoryId: scope === "CATEGORY" ? str(formData.get("categoryId")) || null : null,
    active: formData.get("active") === "on",
    startsAt: date(formData.get("startsAt")),
    endsAt: date(formData.get("endsAt")),
  };
}

export async function createPromotion(formData: FormData) {
  try {
    await prisma.promotion.create({ data: buildData(formData) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar";
    redirect(`/admin/promocoes/nova?err=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/admin/promocoes");
  revalidatePath("/");
  redirect("/admin/promocoes?ok=created");
}

export async function updatePromotion(id: string, formData: FormData) {
  try {
    await prisma.promotion.update({ where: { id }, data: buildData(formData) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar";
    redirect(`/admin/promocoes/${id}?err=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/admin/promocoes");
  revalidatePath("/");
  redirect("/admin/promocoes?ok=updated");
}

export async function togglePromotion(id: string, active: boolean) {
  try {
    await prisma.promotion.update({ where: { id }, data: { active } });
  } catch {
    // ignora
  }
  revalidatePath("/admin/promocoes");
  revalidatePath("/");
}

export async function deletePromotion(id: string) {
  try {
    await prisma.promotion.delete({ where: { id } });
  } catch {
    // ignora
  }
  revalidatePath("/admin/promocoes");
  revalidatePath("/");
}
