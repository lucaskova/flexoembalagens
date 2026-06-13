import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/format";
import { deleteProduct } from "./actions";

export default async function AdminProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; q?: string; count?: string }>;
}) {
  const { ok, q, count } = await searchParams;
  const query = q?.trim() ?? "";

  let products: Awaited<
    ReturnType<typeof prisma.product.findMany<{ include: { category: true } }>>
  > = [];
  try {
    products = await prisma.product.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { sku: { contains: query, mode: "insensitive" } },
            ],
          }
        : {},
      orderBy: { updatedAt: "desc" },
      include: { category: true },
    });
  } catch {
    // banco offline
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-slate-600">{products.length} itens no catálogo</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/produtos/importar"
            className="rounded-xl border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Importar do Bling
          </Link>
          <Link
            href="/admin/produtos/novo"
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            + Cadastrar produto
          </Link>
        </div>
      </header>

      {ok && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          {ok === "created"
            ? "Produto criado."
            : ok === "updated"
              ? "Produto atualizado."
              : ok === "imported"
                ? `${count ?? 0} produto(s) importado(s) do Bling.`
                : "Pronto."}
        </p>
      )}

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Buscar por nome ou SKU"
          className="input max-w-xs"
        />
        <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
          Buscar
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {products.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Nenhum produto. Cadastre manualmente ou sincronize do Bling.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Estoque</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-400">
                      SKU {p.sku} {p.featured && "· ⭐ destaque"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{formatBRL(Number(p.price))}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/produtos/${p.id}`}
                        className="text-emerald-700 hover:underline"
                      >
                        Editar
                      </Link>
                      <form action={deleteProduct.bind(null, p.id)}>
                        <button className="text-rose-600 hover:underline">Excluir</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: "Ativo", cls: "bg-emerald-100 text-emerald-800" },
    OUT_OF_STOCK: { label: "Sem estoque", cls: "bg-amber-100 text-amber-800" },
    DRAFT: { label: "Rascunho", cls: "bg-slate-200 text-slate-600" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
  );
}
