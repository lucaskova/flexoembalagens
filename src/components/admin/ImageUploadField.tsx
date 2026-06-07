"use client";

import { useRef, useState } from "react";

type Props = {
  name: string;
  defaultValue?: string | null;
  label?: string;
  contain?: boolean;
};

export default function ImageUploadField({
  name,
  defaultValue,
  label = "Imagem do produto",
  contain = false,
}: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Falha no upload.");
        return;
      }
      setUrl(data.url);
    } catch {
      setError("Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="block sm:col-span-2">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>

      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 p-1">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="Pré-visualização"
              className={`h-full w-full ${contain ? "object-contain" : "object-cover"}`}
            />
          ) : (
            <span className="px-2 text-center text-xs text-slate-400">Sem imagem</span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {uploading ? "Enviando..." : "Enviar foto"}
            </button>
            {url && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Remover
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />

          <input
            type="text"
            name={name}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="ou cole uma URL: https://..."
            className="input"
          />
          <p className="text-xs text-slate-500">
            Envie um arquivo (JPG, PNG, WEBP, até 5 MB) ou cole uma URL de imagem.
          </p>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
