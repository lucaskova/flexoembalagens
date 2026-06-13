"use client";

import { useMemo, useState } from "react";
import { importSelectedBlingProducts } from "@/app/admin/produtos/importar/actions";
import { formatBRL } from "@/lib/format";

type BlingListItem = {
  id: number;
  nome: string;
  codigo: string;
  preco: number;
  situacao: string;
  imageUrl: string | null;
  categoria: string | null;
  alreadyImported: boolean;
};

export default function BlingImportList({ products }: { products: BlingListItem[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [hideImported, setHideImported] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (hideImported && p.alreadyImported) return false;
      if (!q) return true;
      return (
        p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
      );
    });
  }, [products, query, hideImported]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((p) => next.add(p.id));
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  return (
    <form action={importSelectedBlingProducts} className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou código"
          className="input max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={hideImported}
            onChange={(e) => setHideImported(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
          />
          Ocultar já importados
        </label>
        <button
          type="button"
          onClick={selectAllFiltered}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        >
          Selecionar todos ({filtered.length})
        </button>
        <button
          type="button"
          onClick={clearSelection}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        >
          Limpar
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm">
        <span className="font-medium text-slate-700">{selected.size} selecionado(s)</span>
        <button
          type="submit"
          disabled={selected.size === 0}
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-40"
        >
          Importar selecionados
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Nenhum produto encontrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const checked = selected.has(p.id);
                return (
                  <tr
                    key={p.id}
                    className={`cursor-pointer hover:bg-slate-50 ${checked ? "bg-emerald-50" : ""}`}
                    onClick={() => toggle(p.id)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(p.id)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                      {checked && <input type="hidden" name="blingId" value={p.id} />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imageUrl}
                            alt={p.nome}
                            className="h-10 w-10 rounded object-contain"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-slate-100" />
                        )}
                        <div>
                          <div className="font-medium text-slate-900">{p.nome}</div>
                          <div className="text-xs text-slate-400">
                            {p.codigo}
                            {p.alreadyImported && (
                              <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">
                                já importado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.categoria ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">{formatBRL(Number(p.preco))}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.situacao === "A"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {p.situacao === "A" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </form>
  );
}
