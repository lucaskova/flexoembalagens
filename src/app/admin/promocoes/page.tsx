import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { togglePromotion, deletePromotion } from "./actions";

function discountLabel(type: string, value: number): string {
  if (type === "FIXED") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return `${Math.round(value)}%`;
}

const SCOPE_LABEL: Record<string, string> = {
  PRODUCT: "Produto",
  CATEGORY: "Categoria",
  STORE: "Loja inteira",
};

export default async function AdminPromocoesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;

  let promotions: Awaited<ReturnType<typeof prisma.promotion.findMany>> = [];
  try {
    promotions = await prisma.promotion.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    // banco offline
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Promoções</h1>
          <p className="text-sm text-slate-600">Descontos por produto, categoria ou loja</p>
        </div>
        <Link
          href="/admin/promocoes/nova"
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          + Criar promoção
        </Link>
      </header>

      {ok && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          {ok === "created" ? "Promoção criada." : "Promoção atualizada."}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {promotions.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Nenhuma promoção criada.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Promoção</th>
                <th className="px-4 py-3">Desconto</th>
                <th className="px-4 py-3">Aplica em</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {promotions.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{p.title}</div>
                    {p.description && <div className="text-xs text-slate-400">{p.description}</div>}
                  </td>
                  <td className="px-4 py-3 font-medium text-emerald-700">
                    {discountLabel(p.discountType, p.discountValue)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {SCOPE_LABEL[p.scope] ?? p.scope}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {p.active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <form action={togglePromotion.bind(null, p.id, !p.active)}>
                        <button className="text-slate-600 hover:underline">
                          {p.active ? "Desativar" : "Ativar"}
                        </button>
                      </form>
                      <Link
                        href={`/admin/promocoes/${p.id}`}
                        className="text-emerald-700 hover:underline"
                      >
                        Editar
                      </Link>
                      <form action={deletePromotion.bind(null, p.id)}>
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
