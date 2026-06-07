import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import { createProduct } from "../actions";

export default async function NovoProdutoPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;

  let categories: { id: string; name: string }[] = [];
  try {
    categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  } catch {
    // banco offline
  }

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/produtos" className="text-sm text-emerald-700 hover:underline">
          ← Produtos
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Cadastrar produto</h1>
      </header>

      {err && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          {decodeURIComponent(err)}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <ProductForm action={createProduct} categories={categories} submitLabel="Salvar produto" />
      </div>
    </div>
  );
}
