import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCategory } from "../actions";

export default async function EditarCategoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  const { id } = await params;
  const { err } = await searchParams;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  const action = updateCategory.bind(null, id);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/categorias" className="text-sm text-emerald-700 hover:underline">
          ← Categorias
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Editar categoria</h1>
      </header>

      {err && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(err)}</p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <form action={action} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Nome *</span>
            <input name="name" defaultValue={category.name} className="input" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Descrição</span>
            <textarea
              name="description"
              defaultValue={category.description ?? ""}
              rows={3}
              className="input"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="active"
              defaultChecked={category.active}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            <span className="text-sm font-medium text-slate-700">Categoria ativa</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
              Salvar alterações
            </button>
            <Link
              href="/admin/categorias"
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
