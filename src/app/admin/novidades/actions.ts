"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

function str(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").trim();
}

function buildData(formData: FormData) {
  const published = formData.get("published") === "on";
  const title = str(formData.get("title")) || "Novidade";
  return {
    title,
    excerpt: str(formData.get("excerpt")) || null,
    content: str(formData.get("content")) || null,
    imageUrl: str(formData.get("imageUrl")) || null,
    published,
    publishedAt: published ? new Date() : null,
  };
}

export async function createNews(formData: FormData) {
  const title = str(formData.get("title"));
  if (!title) redirect("/admin/novidades/nova?err=T%C3%ADtulo+obrigat%C3%B3rio");

  try {
    await prisma.news.create({
      data: {
        ...buildData(formData),
        slug: `${slugify(title) || "novidade"}-${Date.now().toString(36)}`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar";
    redirect(`/admin/novidades/nova?err=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/admin/novidades");
  revalidatePath("/");
  redirect("/admin/novidades?ok=created");
}

export async function updateNews(id: string, formData: FormData) {
  const title = str(formData.get("title"));
  if (!title) redirect(`/admin/novidades/${id}?err=T%C3%ADtulo+obrigat%C3%B3rio`);

  try {
    const current = await prisma.news.findUnique({ where: { id } });
    const data = buildData(formData);
    // mantém a data de publicação original se já estava publicada
    if (current?.published && data.published) {
      data.publishedAt = current.publishedAt;
    }
    await prisma.news.update({ where: { id }, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar";
    redirect(`/admin/novidades/${id}?err=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/admin/novidades");
  revalidatePath("/");
  redirect("/admin/novidades?ok=updated");
}

export async function deleteNews(id: string) {
  try {
    await prisma.news.delete({ where: { id } });
  } catch {
    // ignora
  }
  revalidatePath("/admin/novidades");
  revalidatePath("/");
}
