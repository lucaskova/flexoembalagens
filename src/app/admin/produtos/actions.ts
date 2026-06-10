"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

function parsePrice(raw: FormDataEntryValue | null): number {
  const value = String(raw ?? "").replace(/\./g, "").replace(",", ".");
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function str(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").trim();
}

function intOrNull(raw: FormDataEntryValue | null): number | null {
  const v = str(raw);
  if (!v) return null;
  const n = Math.trunc(Number(v.replace(",", ".")));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function floatOrNull(raw: FormDataEntryValue | null): number | null {
  const v = str(raw);
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function createProduct(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) redirect("/admin/produtos/novo?err=Nome+obrigat%C3%B3rio");

  const sku = str(formData.get("sku")) || `SKU-${Date.now()}`;
  const stock = Math.max(0, Math.trunc(Number(formData.get("stock")) || 0));
  const categoryId = str(formData.get("categoryId"));

  try {
    await prisma.product.create({
      data: {
        name,
        slug: slugify(name) || `produto-${Date.now()}`,
        sku,
        description: str(formData.get("description")) || null,
        price: parsePrice(formData.get("price")),
        stock,
        imageUrl: str(formData.get("imageUrl")) || null,
        featured: formData.get("featured") === "on",
        status: stock > 0 ? str(formData.get("status")) || "ACTIVE" : "OUT_OF_STOCK",
        categoryId: categoryId || null,
        weightGrams: intOrNull(formData.get("weightGrams")),
        widthCm: floatOrNull(formData.get("widthCm")),
        heightCm: floatOrNull(formData.get("heightCm")),
        lengthCm: floatOrNull(formData.get("lengthCm")),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar";
    redirect(`/admin/produtos/novo?err=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/");
  redirect("/admin/produtos?ok=created");
}

export async function updateProduct(id: string, formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) redirect(`/admin/produtos/${id}?err=Nome+obrigat%C3%B3rio`);

  const stock = Math.max(0, Math.trunc(Number(formData.get("stock")) || 0));
  const categoryId = str(formData.get("categoryId"));
  const statusRaw = str(formData.get("status")) || "ACTIVE";

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        slug: slugify(name) || `produto-${Date.now()}`,
        sku: str(formData.get("sku")),
        description: str(formData.get("description")) || null,
        price: parsePrice(formData.get("price")),
        stock,
        imageUrl: str(formData.get("imageUrl")) || null,
        featured: formData.get("featured") === "on",
        status: stock > 0 ? statusRaw : "OUT_OF_STOCK",
        categoryId: categoryId || null,
        weightGrams: intOrNull(formData.get("weightGrams")),
        widthCm: floatOrNull(formData.get("widthCm")),
        heightCm: floatOrNull(formData.get("heightCm")),
        lengthCm: floatOrNull(formData.get("lengthCm")),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar";
    redirect(`/admin/produtos/${id}?err=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/");
  redirect("/admin/produtos?ok=updated");
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
  } catch {
    // produto pode ter pedidos vinculados; ignora falha
  }
  revalidatePath("/admin/produtos");
  revalidatePath("/");
}
