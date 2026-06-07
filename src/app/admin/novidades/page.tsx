import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteNews } from "./actions";

export default async function AdminNovidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;

  let news: Awaited<ReturnType<typeof prisma.news.findMany>> = [];
  try {
    news = await prisma.news.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    // banco offline
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Novidades</h1>
          <p className="text-sm text-slate-600">Anúncios e posts exibidos na loja</p>
        </div>
        <Link
          href="/admin/novidades/nova"
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          + Nova novidade
        </Link>
      </header>

      {ok && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          {ok === "created" ? "Novidade criada." : "Novidade atualizada."}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {news.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Nenhuma novidade ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Criada em</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {news.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{n.title}</div>
                    {n.excerpt && <div className="text-xs text-slate-400">{n.excerpt}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        n.published
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {n.published ? "Publicada" : "Rascunho"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(n.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/novidades/${n.id}`}
                        className="text-emerald-700 hover:underline"
                      >
                        Editar
                      </Link>
                      <form action={deleteNews.bind(null, n.id)}>
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
