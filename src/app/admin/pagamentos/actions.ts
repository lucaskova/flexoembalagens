"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function str(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").trim();
}

function int(raw: FormDataEntryValue | null): number {
  const n = parseInt(String(raw ?? "0"), 10);
  return Number.isFinite(n) ? n : 0;
}

export async function createPaymentMethod(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) redirect("/admin/pagamentos?err=Informe+o+nome");

  try {
    await prisma.paymentMethod.create({
      data: {
        name,
        instructions: str(formData.get("instructions")) || null,
        sortOrder: int(formData.get("sortOrder")),
      },
    });
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    const msg = e instanceof Error ? e.message : "Erro ao salvar";
    redirect(`/admin/pagamentos?err=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/admin/pagamentos");
  redirect("/admin/pagamentos?ok=created");
}

export async function updatePaymentMethod(id: string, formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) redirect("/admin/pagamentos?err=Informe+o+nome");

  try {
    await prisma.paymentMethod.update({
      where: { id },
      data: {
        name,
        instructions: str(formData.get("instructions")) || null,
        sortOrder: int(formData.get("sortOrder")),
        active: formData.get("active") === "on",
      },
    });
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirect("/admin/pagamentos?err=N%C3%A3o+foi+poss%C3%ADvel+atualizar");
  }

  revalidatePath("/admin/pagamentos");
  redirect("/admin/pagamentos?ok=updated");
}

export async function togglePaymentMethod(id: string, active: boolean) {
  try {
    await prisma.paymentMethod.update({ where: { id }, data: { active } });
  } catch {
    // ignora
  }
  revalidatePath("/admin/pagamentos");
}

export async function deletePaymentMethod(id: string) {
  try {
    await prisma.paymentMethod.delete({ where: { id } });
  } catch {
    // ignora
  }
  revalidatePath("/admin/pagamentos");
}
