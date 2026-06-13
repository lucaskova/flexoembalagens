import { prisma } from "@/lib/prisma";
import {
  fetchBlingProducts,
  fetchBlingCategories,
  type BlingProduct,
} from "@/lib/integrations/bling";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Cria/atualiza uma categoria a partir dos dados do Bling, evitando colisão de slug. */
async function upsertCategoryRecord(blingId: number, descricao: string) {
  const name = descricao.trim() || `Categoria ${blingId}`;
  const baseSlug = slugify(name) || `categoria-${blingId}`;

  const conflict = await prisma.category.findUnique({ where: { slug: baseSlug } });
  const slug =
    conflict && conflict.blingId !== String(blingId) ? `${baseSlug}-${blingId}` : baseSlug;

  return prisma.category.upsert({
    where: { blingId: String(blingId) },
    update: { name, slug },
    create: { name, slug, blingId: String(blingId) },
  });
}

/**
 * Sincroniza TODAS as categorias de produtos do Bling.
 * Retorna um mapa blingCategoriaId -> categoriaId local.
 */
export async function syncBlingCategories(accessToken: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let page = 1;

  for (;;) {
    const { data } = await fetchBlingCategories(accessToken, page);
    if (!data?.length) break;

    for (const c of data) {
      if (!c?.id || !c.descricao) continue;
      const rec = await upsertCategoryRecord(c.id, c.descricao);
      map.set(String(c.id), rec.id);
    }

    if (data.length < 100) break;
    page += 1;
    if (page > 50) break;
  }

  return map;
}

/** Resolve o categoryId local de um produto do Bling. */
async function resolveCategoryId(
  p: BlingProduct,
  catMap?: Map<string, string>,
): Promise<string | null> {
  const blingCatId = p.categoria?.id;
  if (!blingCatId) return null;

  const fromMap = catMap?.get(String(blingCatId));
  if (fromMap) return fromMap;

  const existing = await prisma.category.findUnique({
    where: { blingId: String(blingCatId) },
    select: { id: true },
  });
  if (existing) return existing.id;

  if (p.categoria?.descricao) {
    const rec = await upsertCategoryRecord(blingCatId, p.categoria.descricao);
    return rec.id;
  }

  return null;
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
  const catMap = await syncBlingCategories(accessToken);
  let page = 1;
  let total = 0;

  for (;;) {
    const { data } = await fetchBlingProducts(accessToken, page);
    if (!data?.length) break;

    for (const item of data) {
      const categoryId = await resolveCategoryId(item, catMap);
      await upsertProduct(item, categoryId);
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
  const catMap = await syncBlingCategories(accessToken);
  let page = 1;
  let imported = 0;

  for (;;) {
    const { data } = await fetchBlingProducts(accessToken, page);
    if (!data?.length) break;

    for (const item of data) {
      if (!wanted.has(String(item.id))) continue;
      const categoryId = await resolveCategoryId(item, catMap);
      await upsertProduct(item, categoryId);
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
