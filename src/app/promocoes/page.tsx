import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StoreHeader from "@/components/StoreHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";
import { getActivePromotions, applyBestPromotion } from "@/lib/promotions";

export default async function PromocoesPage() {
  type ProductWithCategory = Awaited<
    ReturnType<typeof prisma.product.findMany<{ include: { category: true } }>>
  >[number];

  let products: ProductWithCategory[] = [];
  try {
    products = await prisma.product.findMany({
      where: { status: { in: ["ACTIVE", "OUT_OF_STOCK"] } },
      orderBy: { name: "asc" },
      include: { category: true },
    });
  } catch {
    // banco offline
  }

  const promotions = await getActivePromotions();

  const onSale = products
    .map((p) => ({
      product: p,
      priced: applyBestPromotion(
        { id: p.id, price: Number(p.price), categoryId: p.categoryId },
        promotions,
      ),
    }))
    .filter((x) => x.priced.originalPrice != null);

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
      <StoreHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Promoções</h1>
        <p className="mb-6 text-sm text-slate-600">
          Produtos com desconto ativo na loja.
        </p>

        {onSale.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-slate-600">Nenhuma promoção ativa no momento.</p>
            <Link
              href="/produtos"
              className="mt-4 inline-flex rounded-xl bg-[#0f4c81] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c3c64]"
            >
              Ver todos os produtos
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {onSale.map(({ product: p, priced }) => (
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
            ))}
          </ul>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
