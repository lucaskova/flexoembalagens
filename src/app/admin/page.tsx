import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBlingAuthUrl } from "@/lib/integrations/bling";
import { syncProductsFromBling } from "@/lib/integrations/sync-bling";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const { ok, err } = await searchParams;

  let bling = null;
  let jt = null;
  let productCount = 0;
  let categoryCount = 0;
  let activePromos = 0;
  let publishedNews = 0;

  try {
    [bling, jt, productCount, categoryCount, activePromos, publishedNews] = await Promise.all([
      prisma.integration.findUnique({ where: { provider: "BLING" } }),
      prisma.integration.findUnique({ where: { provider: "JT_EXPRESS" } }),
      prisma.product.count(),
      prisma.category.count(),
      prisma.promotion.count({ where: { active: true } }),
      prisma.news.count({ where: { published: true } }),
    ]);
  } catch {
    // banco offline
  }

  async function connectBling() {
    "use server";
    const url = getBlingAuthUrl("lambari");
    const { redirect } = await import("next/navigation");
    redirect(url);
  }

  async function syncBling() {
    "use server";
    const integration = await prisma.integration.findUnique({ where: { provider: "BLING" } });
    if (!integration?.accessToken) throw new Error("Bling não conectado.");
    const total = await syncProductsFromBling(integration.accessToken);
    const { redirect } = await import("next/navigation");
    redirect(`/admin?ok=sync&n=${total}`);
  }

  const stats = [
    { label: "Produtos", value: productCount, href: "/admin/produtos" },
    { label: "Categorias", value: categoryCount, href: "/admin/categorias" },
    { label: "Promoções ativas", value: activePromos, href: "/admin/promocoes" },
    { label: "Novidades publicadas", value: publishedNews, href: "/admin/novidades" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Painel</h1>
        <p className="text-sm text-slate-600">Visão geral da loja e integrações</p>
      </header>

      {ok === "bling" && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Bling conectado!</p>
      )}
      {ok === "sync" && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          Sincronização concluída.
        </p>
      )}
      {err && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          Erro: {decodeURIComponent(err)}
        </p>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow"
          >
            <p className="text-3xl font-bold text-slate-900">{s.value}</p>
            <p className="mt-1 text-sm text-slate-500">{s.label}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/produtos/novo"
          className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-5 text-emerald-800 transition hover:bg-emerald-100"
        >
          <p className="font-semibold">+ Cadastrar produto</p>
          <p className="mt-1 text-sm text-emerald-700">Adicione um item manualmente ao catálogo.</p>
        </Link>
        <Link
          href="/admin/promocoes/nova"
          className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-5 text-amber-800 transition hover:bg-amber-100"
        >
          <p className="font-semibold">+ Criar promoção</p>
          <p className="mt-1 text-sm text-amber-700">Descontos por produto, categoria ou loja.</p>
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Bling (produtos e estoque)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Status: <span className="font-medium">{bling?.status ?? "DISCONNECTED"}</span>
          {bling?.lastSyncAt && (
            <> · Última sync: {new Date(bling.lastSyncAt).toLocaleString("pt-BR")}</>
          )}
        </p>
        {bling?.lastError && <p className="mt-2 text-sm text-rose-600">{bling.lastError}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={connectBling}>
            <button
              type="submit"
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Conectar Bling
            </button>
          </form>
          <form action={syncBling}>
            <button
              type="submit"
              disabled={!bling?.accessToken}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Sincronizar produtos
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold">J&amp;T Express (frete)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Status: <span className="font-medium">{jt?.status ?? "DISCONNECTED"}</span>
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Configure <code className="rounded bg-slate-100 px-1">JT_CUSTOMER_CODE</code>,{" "}
          <code className="rounded bg-slate-100 px-1">JT_API_ACCOUNT</code> e{" "}
          <code className="rounded bg-slate-100 px-1">JT_PRIVATE_KEY</code> no{" "}
          <code className="rounded bg-slate-100 px-1">.env.local</code>.
        </p>
      </section>
    </div>
  );
}
