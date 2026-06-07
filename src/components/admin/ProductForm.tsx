import Link from "next/link";
import ImageUploadField from "@/components/admin/ImageUploadField";

type Category = { id: string; name: string };

type ProductValues = {
  name?: string;
  sku?: string;
  price?: number;
  stock?: number;
  description?: string | null;
  imageUrl?: string | null;
  featured?: boolean;
  status?: string;
  categoryId?: string | null;
};

type Props = {
  action: (formData: FormData) => void;
  categories: Category[];
  product?: ProductValues;
  submitLabel: string;
};

export default function ProductForm({ action, categories, product, submitLabel }: Props) {
  const p = product ?? {};
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Nome *</span>
          <input name="name" defaultValue={p.name ?? ""} className="input" required />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">SKU</span>
          <input
            name="sku"
            defaultValue={p.sku ?? ""}
            placeholder="Gerado automaticamente se vazio"
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Categoria</span>
          <select name="categoryId" defaultValue={p.categoryId ?? ""} className="input">
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Preço (R$)</span>
          <input
            name="price"
            defaultValue={p.price != null ? String(p.price).replace(".", ",") : ""}
            inputMode="decimal"
            placeholder="0,00"
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Estoque</span>
          <input
            name="stock"
            type="number"
            min={0}
            defaultValue={p.stock ?? 0}
            className="input"
          />
        </label>

        <ImageUploadField name="imageUrl" defaultValue={p.imageUrl} />

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Descrição</span>
          <textarea name="description" defaultValue={p.description ?? ""} rows={4} className="input" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
          <select name="status" defaultValue={p.status ?? "ACTIVE"} className="input">
            <option value="ACTIVE">Ativo</option>
            <option value="DRAFT">Rascunho (oculto)</option>
          </select>
        </label>

        <label className="flex items-center gap-2 self-end pb-2">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={p.featured ?? false}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
          />
          <span className="text-sm font-medium text-slate-700">Destaque na home</span>
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          {submitLabel}
        </button>
        <Link
          href="/admin/produtos"
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
