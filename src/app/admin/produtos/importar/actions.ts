"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { importBlingProductsByIds } from "@/lib/integrations/sync-bling";

export async function importSelectedBlingProducts(formData: FormData) {
  const ids = formData.getAll("blingId").map((v) => String(v)).filter(Boolean);

  if (ids.length === 0) {
    redirect("/admin/produtos/importar?err=Selecione+ao+menos+um+produto");
  }

  const integration = await prisma.integration.findUnique({ where: { provider: "BLING" } });
  if (!integration?.accessToken) {
    redirect("/admin/produtos/importar?err=Bling+n%C3%A3o+conectado");
  }

  try {
    const count = await importBlingProductsByIds(integration!.accessToken!, ids);
    revalidatePath("/admin/produtos");
    revalidatePath("/");
    redirect(`/admin/produtos?ok=imported&count=${count}`);
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    const msg = e instanceof Error ? e.message : "Erro ao importar";
    redirect(`/admin/produtos/importar?err=${encodeURIComponent(msg)}`);
  }
}
