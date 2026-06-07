import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NewsForm from "@/components/admin/NewsForm";
import { updateNews } from "../actions";

export default async function EditarNovidadePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  const { id } = await params;
  const { err } = await searchParams;

  const news = await prisma.news.findUnique({ where: { id } });
  if (!news) notFound();

  const action = updateNews.bind(null, id);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/novidades" className="text-sm text-emerald-700 hover:underline">
          ← Novidades
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Editar novidade</h1>
      </header>

      {err && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(err)}</p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <NewsForm
          action={action}
          submitLabel="Salvar alterações"
          news={{
            title: news.title,
            excerpt: news.excerpt,
            content: news.content,
            imageUrl: news.imageUrl,
            published: news.published,
          }}
        />
      </div>
    </div>
  );
}
