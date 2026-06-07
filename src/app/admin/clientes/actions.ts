"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

function str(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").trim();
}

export async function createCustomer(formData: FormData) {
  const name = str(formData.get("name"));
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));
  const type = str(formData.get("type")) === "PF" ? "PF" : "PJ";

  if (!name) redirect("/admin/clientes?err=Informe+o+nome");
  if (!email) redirect("/admin/clientes?err=Informe+o+e-mail");
  if (password.length < 6) redirect("/admin/clientes?err=Senha+deve+ter+ao+menos+6+caracteres");

  try {
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing?.passwordHash) {
      redirect("/admin/clientes?err=J%C3%A1+existe+um+cliente+com+este+e-mail");
    }

    const passwordHash = await hashPassword(password);
    const data = {
      name,
      email,
      passwordHash,
      type,
      phone: str(formData.get("phone")) || null,
      document: str(formData.get("document")) || null,
      zipCode: str(formData.get("zipCode")).replace(/\D/g, "") || null,
      street: str(formData.get("street")) || null,
      number: str(formData.get("number")) || null,
      complement: str(formData.get("complement")) || null,
      district: str(formData.get("district")) || null,
      city: str(formData.get("city")) || null,
      state: str(formData.get("state")) || null,
    };

    if (existing) {
      await prisma.customer.update({ where: { id: existing.id }, data });
    } else {
      await prisma.customer.create({ data });
    }
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // re-throw redirect
    const msg = e instanceof Error ? e.message : "Erro ao salvar";
    redirect(`/admin/clientes?err=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes?ok=created");
}

export async function resetCustomerPassword(id: string, formData: FormData) {
  const password = str(formData.get("password"));
  if (password.length < 6) redirect("/admin/clientes?err=Senha+deve+ter+ao+menos+6+caracteres");
  try {
    const passwordHash = await hashPassword(password);
    await prisma.customer.update({ where: { id }, data: { passwordHash } });
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirect("/admin/clientes?err=N%C3%A3o+foi+poss%C3%ADvel+atualizar+a+senha");
  }
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes?ok=password");
}
