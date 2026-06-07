import Link from "next/link";
import NewsForm from "@/components/admin/NewsForm";
import { createNews } from "../actions";

export default async function NovaNovidadePage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/novidades" className="text-sm text-emerald-700 hover:underline">
          ← Novidades
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Nova novidade</h1>
      </header>

      {err && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(err)}</p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <NewsForm action={createNews} submitLabel="Salvar novidade" />
      </div>
    </div>
  );
}
