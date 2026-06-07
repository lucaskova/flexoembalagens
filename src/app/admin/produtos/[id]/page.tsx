import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import { updateProduct } from "../actions";

export default async function EditarProdutoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  const { id } = await params;
  const { err } = await searchParams;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const action = updateProduct.bind(null, id);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/produtos" className="text-sm text-emerald-700 hover:underline">
          ← Produtos
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Editar produto</h1>
      </header>

      {err && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          {decodeURIComponent(err)}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <ProductForm
          action={action}
          categories={categories}
          submitLabel="Salvar alterações"
          product={{
            name: product.name,
            sku: product.sku,
            price: Number(product.price),
            stock: product.stock,
            description: product.description,
            imageUrl: product.imageUrl,
            featured: product.featured,
            status: product.status,
            categoryId: product.categoryId,
          }}
        />
      </div>
    </div>
  );
}
