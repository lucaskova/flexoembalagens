import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PromotionForm from "@/components/admin/PromotionForm";
import { updatePromotion } from "../actions";

export default async function EditarPromocaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  const { id } = await params;
  const { err } = await searchParams;

  const [promotion, products, categories] = await Promise.all([
    prisma.promotion.findUnique({ where: { id } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!promotion) notFound();

  const action = updatePromotion.bind(null, id);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/promocoes" className="text-sm text-emerald-700 hover:underline">
          ← Promoções
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Editar promoção</h1>
      </header>

      {err && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(err)}</p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <PromotionForm
          action={action}
          products={products}
          categories={categories}
          submitLabel="Salvar alterações"
          promotion={{
            title: promotion.title,
            description: promotion.description,
            discountType: promotion.discountType,
            discountValue: promotion.discountValue,
            scope: promotion.scope,
            productId: promotion.productId,
            categoryId: promotion.categoryId,
            active: promotion.active,
            startsAt: promotion.startsAt,
            endsAt: promotion.endsAt,
          }}
        />
      </div>
    </div>
  );
}
