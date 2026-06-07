import { prisma } from "@/lib/prisma";
import StoreHeader from "@/components/StoreHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";
import { buildPricingContext, priceFor } from "@/lib/pricing";

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  type ProductWithCategory = Awaited<
    ReturnType<
      typeof prisma.product.findMany<{ include: { category: true } }>
    >
  >[number];

  const { q, categoria } = await searchParams;
  const query = q?.trim() ?? "";
  const categorySlug = categoria?.trim() ?? "";

  let products: ProductWithCategory[] = [];
  let categoryName = "";
  try {
    if (categorySlug) {
      const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
      categoryName = cat?.name ?? "";
    }

    products = await prisma.product.findMany({
      where: {
        status: { in: ["ACTIVE", "OUT_OF_STOCK"] },
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { sku: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      include: { category: true },
    });
  } catch {
    // banco offline
  }

  const pricing = await buildPricingContext();

  const heading = query
    ? `Resultados para “${query}”`
    : categoryName
      ? categoryName
      : categorySlug
        ? "Categoria"
        : "Catálogo";

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
      <StoreHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">{heading}</h1>
        {pricing.isB2B && (
          <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Você está vendo <strong>preços de atacado</strong> (conta Pessoa Jurídica).
          </p>
        )}
        {products.length === 0 ? (
          <p className="text-slate-600">
            {query
              ? `Nenhum produto encontrado para “${query}”.`
              : categorySlug
                ? "Nenhum produto nesta categoria."
                : "Catálogo vazio. Sincronize produtos do Bling no admin."}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => {
              const priced = priceFor(
                { id: p.id, price: Number(p.price), categoryId: p.categoryId },
                pricing,
              );
              return (
                <ProductCard
                  key={p.id}
                  product={{
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    sku: p.sku,
                    stock: p.stock,
                    imageUrl: p.imageUrl,
                    featured: p.featured,
                  }}
                  price={priced.price}
                  originalPrice={priced.originalPrice}
                  discountLabel={priced.discountLabel}
                />
              );
            })}
          </ul>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
