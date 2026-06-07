import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PromotionForm from "@/components/admin/PromotionForm";
import { createPromotion } from "../actions";

export default async function NovaPromocaoPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;

  let products: { id: string; name: string }[] = [];
  let categories: { id: string; name: string }[] = [];
  try {
    [products, categories] = await Promise.all([
      prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    ]);
  } catch {
    // banco offline
  }

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/promocoes" className="text-sm text-emerald-700 hover:underline">
          ← Promoções
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Criar promoção</h1>
      </header>

      {err && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(err)}</p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <PromotionForm
          action={createPromotion}
          products={products}
          categories={categories}
          submitLabel="Criar promoção"
        />
      </div>
    </div>
  );
}
