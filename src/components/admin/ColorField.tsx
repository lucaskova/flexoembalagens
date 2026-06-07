"use client";

import { useState } from "react";

const DEFAULT_COLOR = "#047857";

type Props = {
  name: string;
  defaultValue?: string | null;
};

export default function ColorField({ name, defaultValue }: Props) {
  const initial = defaultValue && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(defaultValue)
    ? defaultValue
    : "";
  const [value, setValue] = useState(initial);

  const swatch = value || DEFAULT_COLOR;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={swatch}
          onChange={(e) => setValue(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
          aria-label="Escolher cor da marca"
        />
        <input
          type="text"
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`${DEFAULT_COLOR} (padrão)`}
          className="input max-w-[160px]"
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="text-sm font-medium text-slate-500 hover:text-rose-600"
          >
            Restaurar padrão
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-5 w-5 rounded-full border border-slate-300"
          style={{ backgroundColor: swatch }}
        />
        <span className="text-xs text-slate-500">
          Cor principal da loja (botões, links e destaques). Vazio = verde padrão.
        </span>
      </div>
    </div>
  );
}
