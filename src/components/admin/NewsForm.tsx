import Link from "next/link";

type NewsValues = {
  title?: string;
  excerpt?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  published?: boolean;
};

type Props = {
  action: (formData: FormData) => void;
  news?: NewsValues;
  submitLabel: string;
};

export default function NewsForm({ action, news, submitLabel }: Props) {
  const n = news ?? {};
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Título *</span>
        <input name="title" defaultValue={n.title ?? ""} className="input" required />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Resumo</span>
        <input
          name="excerpt"
          defaultValue={n.excerpt ?? ""}
          placeholder="Frase curta exibida na vitrine"
          className="input"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Conteúdo</span>
        <textarea name="content" defaultValue={n.content ?? ""} rows={6} className="input" />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">URL da imagem</span>
        <input
          name="imageUrl"
          defaultValue={n.imageUrl ?? ""}
          placeholder="https://..."
          className="input"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="published"
          defaultChecked={n.published ?? false}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600"
        />
        <span className="text-sm font-medium text-slate-700">Publicar na loja</span>
      </label>

      <div className="flex gap-2 pt-2">
        <button className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
          {submitLabel}
        </button>
        <Link
          href="/admin/novidades"
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
