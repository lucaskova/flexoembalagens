"use client";

import Link from "next/link";
import { useState } from "react";

type Option = { id: string; name: string };

type PromotionValues = {
  title?: string;
  description?: string | null;
  discountType?: string;
  discountValue?: number;
  scope?: string;
  productId?: string | null;
  categoryId?: string | null;
  active?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

type Props = {
  action: (formData: FormData) => void;
  products: Option[];
  categories: Option[];
  promotion?: PromotionValues;
  submitLabel: string;
};

function toLocalInput(d?: Date | null): string {
  if (!d) return "";
  const date = new Date(d);
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function PromotionForm({
  action,
  products,
  categories,
  promotion,
  submitLabel,
}: Props) {
  const p = promotion ?? {};
  const [scope, setScope] = useState(p.scope ?? "PRODUCT");

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Título *</span>
          <input name="title" defaultValue={p.title ?? ""} className="input" required />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Descrição</span>
          <input name="description" defaultValue={p.description ?? ""} className="input" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Tipo de desconto</span>
          <select name="discountType" defaultValue={p.discountType ?? "PERCENT"} className="input">
            <option value="PERCENT">Percentual (%)</option>
            <option value="FIXED">Valor fixo (R$)</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Valor do desconto</span>
          <input
            name="discountValue"
            defaultValue={p.discountValue != null ? String(p.discountValue).replace(".", ",") : ""}
            inputMode="decimal"
            placeholder="Ex.: 10 (10% ou R$ 10)"
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Aplicar em</span>
          <select
            name="scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="input"
          >
            <option value="PRODUCT">Um produto</option>
            <option value="CATEGORY">Uma categoria</option>
            <option value="STORE">Loja inteira</option>
          </select>
        </label>

        {scope === "PRODUCT" && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Produto</span>
            <select name="productId" defaultValue={p.productId ?? ""} className="input">
              <option value="">Selecione...</option>
              {products.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {scope === "CATEGORY" && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Categoria</span>
            <select name="categoryId" defaultValue={p.categoryId ?? ""} className="input">
              <option value="">Selecione...</option>
              {categories.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Início (opcional)</span>
          <input
            type="datetime-local"
            name="startsAt"
            defaultValue={toLocalInput(p.startsAt)}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Fim (opcional)</span>
          <input
            type="datetime-local"
            name="endsAt"
            defaultValue={toLocalInput(p.endsAt)}
            className="input"
          />
        </label>

        <label className="flex items-center gap-2 self-end pb-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={p.active ?? true}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
          />
          <span className="text-sm font-medium text-slate-700">Ativa</span>
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
          {submitLabel}
        </button>
        <Link
          href="/admin/promocoes"
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
