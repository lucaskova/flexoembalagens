import { prisma } from "@/lib/prisma";
import { fetchBlingProducts, type BlingProduct } from "@/lib/integrations/bling";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function upsertCategory(blingCat?: { id: number; descricao: string }) {
  if (!blingCat) return null;
  const slug = slugify(blingCat.descricao);
  return prisma.category.upsert({
    where: { blingId: String(blingCat.id) },
    update: { name: blingCat.descricao, slug },
    create: {
      name: blingCat.descricao,
      slug,
      blingId: String(blingCat.id),
    },
  });
}

async function upsertProduct(p: BlingProduct, categoryId: string | null) {
  const slug = slugify(p.nome);
  const sku = p.codigo || `BLING-${p.id}`;
  const stock = p.estoque?.saldoVirtualTotal ?? 0;
  const imageUrl = p.midia?.imagens?.externas?.[0]?.link ?? null;
  const active = p.situacao === "A";

  await prisma.product.upsert({
    where: { blingId: String(p.id) },
    update: {
      name: p.nome,
      slug,
      sku,
      price: p.preco,
      stock,
      imageUrl,
      categoryId,
      status: active && stock > 0 ? "ACTIVE" : stock <= 0 ? "OUT_OF_STOCK" : "HIDDEN",
      syncedAt: new Date(),
    },
    create: {
      name: p.nome,
      slug,
      sku,
      price: p.preco,
      stock,
      imageUrl,
      blingId: String(p.id),
      categoryId,
      status: active && stock > 0 ? "ACTIVE" : "OUT_OF_STOCK",
      syncedAt: new Date(),
    },
  });
}

/** Sincroniza produtos e categorias do Bling para o banco local. */
export async function syncProductsFromBling(accessToken: string): Promise<number> {
  let page = 1;
  let total = 0;

  for (;;) {
    const { data } = await fetchBlingProducts(accessToken, page);
    if (!data?.length) break;

    for (const item of data) {
      const cat = await upsertCategory(item.categoria);
      await upsertProduct(item, cat?.id ?? null);
      total += 1;
    }

    if (data.length < 100) break;
    page += 1;
  }

  await prisma.integration.update({
    where: { provider: "BLING" },
    data: { lastSyncAt: new Date(), lastError: null, status: "CONNECTED" },
  });

  return total;
}

export type BlingListItem = {
  id: number;
  nome: string;
  codigo: string;
  preco: number;
  situacao: string;
  imageUrl: string | null;
  categoria: string | null;
  alreadyImported: boolean;
};

/** Lista todos os produtos do Bling para a tela de importação seletiva. */
export async function listAllBlingProducts(accessToken: string): Promise<BlingListItem[]> {
  const items: BlingProduct[] = [];
  let page = 1;

  for (;;) {
    const { data } = await fetchBlingProducts(accessToken, page);
    if (!data?.length) break;
    items.push(...data);
    if (data.length < 100) break;
    page += 1;
    if (page > 50) break; // trava de segurança
  }

  const existing = await prisma.product.findMany({
    where: { blingId: { in: items.map((p) => String(p.id)) } },
    select: { blingId: true },
  });
  const importedIds = new Set(existing.map((e) => e.blingId));

  return items.map((p) => ({
    id: p.id,
    nome: p.nome,
    codigo: p.codigo || `BLING-${p.id}`,
    preco: p.preco,
    situacao: p.situacao,
    imageUrl: p.midia?.imagens?.externas?.[0]?.link ?? null,
    categoria: p.categoria?.descricao ?? null,
    alreadyImported: importedIds.has(String(p.id)),
  }));
}

/** Importa apenas os produtos selecionados (por blingId). */
export async function importBlingProductsByIds(
  accessToken: string,
  blingIds: string[],
): Promise<number> {
  if (blingIds.length === 0) return 0;

  const wanted = new Set(blingIds.map(String));
  let page = 1;
  let imported = 0;

  for (;;) {
    const { data } = await fetchBlingProducts(accessToken, page);
    if (!data?.length) break;

    for (const item of data) {
      if (!wanted.has(String(item.id))) continue;
      const cat = await upsertCategory(item.categoria);
      await upsertProduct(item, cat?.id ?? null);
      imported += 1;
    }

    if (data.length < 100 || imported >= wanted.size) break;
    page += 1;
    if (page > 50) break;
  }

  await prisma.integration.update({
    where: { provider: "BLING" },
    data: { lastSyncAt: new Date(), lastError: null, status: "CONNECTED" },
  });

  return imported;
}
