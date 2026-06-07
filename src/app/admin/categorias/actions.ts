"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

function str(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").trim();
}

export async function createCategory(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) redirect("/admin/categorias?err=Nome+obrigat%C3%B3rio");

  try {
    await prisma.category.create({
      data: {
        name,
        slug: slugify(name) || `categoria-${Date.now()}`,
        description: str(formData.get("description")) || null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar";
    redirect(`/admin/categorias?err=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/admin/categorias");
  redirect("/admin/categorias?ok=created");
}

export async function updateCategory(id: string, formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) redirect(`/admin/categorias/${id}?err=Nome+obrigat%C3%B3rio`);

  try {
    await prisma.category.update({
      where: { id },
      data: {
        name,
        slug: slugify(name) || `categoria-${Date.now()}`,
        description: str(formData.get("description")) || null,
        active: formData.get("active") === "on",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar";
    redirect(`/admin/categorias/${id}?err=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/");
  redirect("/admin/categorias?ok=updated");
}

export async function deleteCategory(id: string) {
  try {
    // desvincula produtos antes de remover a categoria
    await prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    await prisma.category.delete({ where: { id } });
  } catch {
    // ignora falha
  }
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}
