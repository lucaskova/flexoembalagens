"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

function str(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").trim();
}

function num(raw: FormDataEntryValue | null): number {
  const n = Number(String(raw ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 100);
}

export async function createSeller(formData: FormData) {
  const name = str(formData.get("name"));
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));

  if (!name) redirect("/admin/vendedores?err=Informe+o+nome");
  if (!email) redirect("/admin/vendedores?err=Informe+o+e-mail");
  if (password.length < 6) redirect("/admin/vendedores?err=Senha+deve+ter+ao+menos+6+caracteres");

  try {
    const existing = await prisma.seller.findUnique({ where: { email } });
    if (existing) redirect("/admin/vendedores?err=J%C3%A1+existe+um+vendedor+com+este+e-mail");

    const passwordHash = await hashPassword(password);
    await prisma.seller.create({
      data: {
        name,
        email,
        passwordHash,
        phone: str(formData.get("phone")) || null,
        commissionPercent: num(formData.get("commissionPercent")),
      },
    });
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    const msg = e instanceof Error ? e.message : "Erro ao salvar";
    redirect(`/admin/vendedores?err=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/admin/vendedores");
  redirect("/admin/vendedores?ok=created");
}

export async function toggleSeller(id: string, active: boolean) {
  try {
    await prisma.seller.update({ where: { id }, data: { active } });
    if (!active) {
      await prisma.sellerSession.deleteMany({ where: { sellerId: id } });
    }
  } catch {
    // ignora
  }
  revalidatePath("/admin/vendedores");
}

export async function updateSellerCommission(id: string, formData: FormData) {
  try {
    await prisma.seller.update({
      where: { id },
      data: { commissionPercent: num(formData.get("commissionPercent")) },
    });
  } catch {
    // ignora
  }
  revalidatePath("/admin/vendedores");
  redirect("/admin/vendedores?ok=commission");
}

export async function resetSellerPassword(id: string, formData: FormData) {
  const password = str(formData.get("password"));
  if (password.length < 6) redirect("/admin/vendedores?err=Senha+deve+ter+ao+menos+6+caracteres");
  try {
    const passwordHash = await hashPassword(password);
    await prisma.seller.update({ where: { id }, data: { passwordHash } });
    await prisma.sellerSession.deleteMany({ where: { sellerId: id } });
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirect("/admin/vendedores?err=N%C3%A3o+foi+poss%C3%ADvel+atualizar+a+senha");
  }
  revalidatePath("/admin/vendedores");
  redirect("/admin/vendedores?ok=password");
}
