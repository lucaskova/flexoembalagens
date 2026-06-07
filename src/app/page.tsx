import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StoreHeader from "@/components/StoreHeader";
import SiteFooter from "@/components/SiteFooter";
import BenefitsBar from "@/components/BenefitsBar";
import ProductCard from "@/components/ProductCard";
import FeaturedCarousel, { type FeaturedItem } from "@/components/FeaturedCarousel";
import { buildPricingContext, priceFor } from "@/lib/pricing";
import { getPublicSettings } from "@/lib/settings";

export default async function HomePage() {
  const settings = await getPublicSettings();
  const storeName = settings.name;

  let products: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  let featured: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  let news: Awaited<ReturnType<typeof prisma.news.findMany>> = [];
  try {
    products = await prisma.product.findMany({
      where: { status: { in: ["ACTIVE", "OUT_OF_STOCK"] } },
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      take: 12,
    });
  } catch {
    // Banco ainda não configurado — loja exibe layout estático
  }

  try {
    if (settings.featuredCarouselEnabled) {
      featured = await prisma.product.findMany({
        where: { status: { in: ["ACTIVE", "OUT_OF_STOCK"] }, featured: true },
        orderBy: { updatedAt: "desc" },
        take: 12,
      });
    }
  } catch {
    // banco offline
  }

  try {
    news = await prisma.news.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    });
  } catch {
    // banco offline
  }

  const pricing = await buildPricingContext();

  const heroTitle =
    settings.heroTitle ?? "Equipamentos de pesca com estoque sincronizado e frete J&T Express";
  const heroSubtitle =
    settings.heroSubtitle ??
    "Loja própria com produtos vindos do Bling. Você gerencia no ERP, a vitrine atualiza automaticamente.";
  const heroCtaLabel = settings.heroCtaLabel ?? "Ver produtos";

  const featuredItems: FeaturedItem[] = featured.map((p) => {
    const priced = priceFor(
      { id: p.id, price: Number(p.price), categoryId: p.categoryId },
      pricing,
    );
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      stock: p.stock,
      imageUrl: p.imageUrl,
      price: priced.price,
      originalPrice: priced.originalPrice,
      discountLabel: priced.discountLabel,
    };
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fa] text-slate-900">
      <StoreHeader storeName={storeName} />

      {settings.heroEnabled && (
        <section className="relative overflow-hidden bg-gradient-to-br from-[#082b4d] via-[#0f4c81] to-[#0a3a63] text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-2xl"
          />
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-12 sm:flex-row sm:justify-between sm:py-16">
            <div className="z-10 max-w-xl">
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                Distribuidora B2B de embalagens
              </span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                {heroTitle}
              </h1>
              <p className="mt-4 max-w-md text-sm text-white/80 sm:text-base">{heroSubtitle}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/produtos"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0f4c81] shadow-lg transition hover:bg-slate-100"
                >
                  {heroCtaLabel}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
                <Link
                  href="/produtos"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Ver Catálogo
                </Link>
              </div>
            </div>
            <div className="z-10 w-64 overflow-hidden rounded-3xl bg-white p-5 shadow-2xl sm:w-80 lg:w-[26rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-boxes-white.png"
                alt="Caixas de papelão empilhadas"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </section>
      )}

      <BenefitsBar />

      <main className="mx-auto w-full max-w-7xl px-4 py-10">
        {pricing.isB2B && (
          <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Você está vendo <strong>preços de atacado</strong> (conta Pessoa Jurídica).
          </p>
        )}
        {settings.featuredCarouselEnabled && (
          <FeaturedCarousel title={settings.featuredTitle ?? "Destaques"} items={featuredItems} />
        )}

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Produtos</h2>
          {products.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">
              Nenhum produto ainda. Conecte o <strong>Bling</strong> no{" "}
              <Link href="/admin" className="font-semibold text-emerald-700 underline">
                painel admin
              </Link>{" "}
              e sincronize o catálogo.
            </p>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        </section>

        {news.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold">Novidades</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((n) => (
                <li
                  key={n.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {n.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={n.imageUrl} alt={n.title} className="h-40 w-full object-cover" />
                  )}
                  <div className="p-4">
                    <p className="text-xs text-slate-400">
                      {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString("pt-BR") : ""}
                    </p>
                    <h3 className="mt-1 font-semibold">{n.title}</h3>
                    {n.excerpt && <p className="mt-1 text-sm text-slate-600">{n.excerpt}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <SiteFooter storeName={storeName} />
    </div>
  );
}
