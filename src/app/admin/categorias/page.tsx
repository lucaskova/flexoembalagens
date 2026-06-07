import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createCategory, deleteCategory } from "./actions";

export default async function AdminCategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const { ok, err } = await searchParams;

  let categories: Awaited<
    ReturnType<typeof prisma.category.findMany<{ include: { _count: { select: { products: true } } } }>>
  > = [];
  try {
    categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
  } catch {
    // banco offline
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Categorias</h1>
        <p className="text-sm text-slate-600">{categories.length} categorias</p>
      </header>

      {ok && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          {ok === "created" ? "Categoria criada." : "Categoria atualizada."}
        </p>
      )}
      {err && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(err)}</p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Nova categoria</h2>
        <form action={createCategory} className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <input name="name" placeholder="Nome *" className="input" required />
          <input name="description" placeholder="Descrição (opcional)" className="input" />
          <button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
            Adicionar
          </button>
        </form>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {categories.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Nenhuma categoria ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Produtos</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{c.name}</div>
                    {c.description && (
                      <div className="text-xs text-slate-400">{c.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c._count.products}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {c.active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/categorias/${c.id}`}
                        className="text-emerald-700 hover:underline"
                      >
                        Editar
                      </Link>
                      <form action={deleteCategory.bind(null, c.id)}>
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
