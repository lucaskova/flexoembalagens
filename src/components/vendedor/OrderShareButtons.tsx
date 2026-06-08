"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";

export type ShareOrder = {
  number: string;
  total: number;
  createdAt: string;
  paymentMethod: string | null;
  customer: { name: string; document: string | null; phone: string | null };
  seller: { name: string };
  items: Array<{ name: string; sku: string; quantity: number; unitPrice: number }>;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildOrderText(o: ShareOrder): string {
  const date = new Date(o.createdAt).toLocaleString("pt-BR");
  const itemsTxt = o.items
    .map(
      (i) =>
        `• ${i.quantity}x ${i.name} (${i.sku}) — ${formatBRL(i.unitPrice)} = ${formatBRL(
          i.unitPrice * i.quantity,
        )}`,
    )
    .join("\n");
  return [
    `PEDIDO #${o.number.slice(-6)}`,
    `Data: ${date}`,
    `Cliente: ${o.customer.name}${o.customer.document ? ` (${o.customer.document})` : ""}`,
    `Vendedor: ${o.seller.name}`,
    o.paymentMethod ? `Pagamento: ${o.paymentMethod}` : null,
    ``,
    `ITENS:`,
    itemsTxt,
    ``,
    `TOTAL: ${formatBRL(o.total)}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

export default function OrderShareButtons({
  order,
  variant = "full",
}: {
  order: ShareOrder;
  variant?: "full" | "compact";
}) {
  const [copied, setCopied] = useState(false);

  async function copyOrder() {
    const text = buildOrderText(order);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o pedido:", text);
    }
  }

  function sendWhatsApp() {
    const text = buildOrderText(order);
    const phone = (order.customer.phone ?? "").replace(/\D/g, "");
    const target = phone ? `55${phone}` : "";
    const url = `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function downloadPdf() {
    const o = order;
    const date = new Date(o.createdAt).toLocaleString("pt-BR");
    const rows = o.items
      .map(
        (i) => `<tr>
          <td>${i.quantity}</td>
          <td>${escapeHtml(i.name)}</td>
          <td>${escapeHtml(i.sku)}</td>
          <td style="text-align:right">${formatBRL(i.unitPrice)}</td>
          <td style="text-align:right">${formatBRL(i.unitPrice * i.quantity)}</td>
        </tr>`,
      )
      .join("");

    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
      <title>Pedido ${o.number.slice(-6)}</title>
      <style>
        * { font-family: Arial, Helvetica, sans-serif; color: #1f2937; }
        body { margin: 32px; }
        h1 { color: #0f4c81; font-size: 20px; margin: 0 0 4px; }
        .muted { color: #6b7280; font-size: 12px; }
        .box { margin-top: 16px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 6px 4px; text-align: left; }
        th { color: #6b7280; font-weight: 600; }
        .total { margin-top: 12px; text-align: right; font-size: 16px; font-weight: bold; color: #0f4c81; }
      </style></head><body>
      <h1>Pedido #${o.number.slice(-6)}</h1>
      <div class="muted">${date}</div>
      <div class="box">
        <strong>Cliente:</strong> ${escapeHtml(o.customer.name)}${o.customer.document ? ` (${escapeHtml(o.customer.document)})` : ""}<br/>
        <strong>Vendedor:</strong> ${escapeHtml(o.seller.name)}<br/>
        ${o.paymentMethod ? `<strong>Pagamento:</strong> ${escapeHtml(o.paymentMethod)}` : ""}
      </div>
      <table>
        <thead><tr><th>Qtd</th><th>Produto</th><th>SKU</th><th style="text-align:right">Unit.</th><th style="text-align:right">Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total">Total: ${formatBRL(o.total)}</div>
      <script>window.onload = function(){ window.print(); }</script>
      </body></html>`;

    const w = window.open("", "_blank");
    if (!w) {
      window.alert("Permita pop-ups para baixar o PDF.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={sendWhatsApp}
          title="Enviar no WhatsApp"
          aria-label="Enviar no WhatsApp"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#25d366] text-white transition hover:bg-[#1ebe5b]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.115zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
        </button>
        <button
          onClick={downloadPdf}
          title="Baixar PDF"
          aria-label="Baixar PDF"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f4c81] text-white transition hover:bg-[#0c3c64]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <button
          onClick={copyOrder}
          title="Copiar"
          aria-label="Copiar"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50"
        >
          {copied ? (
            <span className="text-xs font-bold text-emerald-600">✓</span>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={sendWhatsApp}
        className="flex items-center gap-2 rounded-lg bg-[#25d366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1ebe5b]"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.115zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        WhatsApp
      </button>
      <button
        onClick={downloadPdf}
        className="flex items-center gap-2 rounded-lg bg-[#0f4c81] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c64]"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Baixar PDF
      </button>
      <button
        onClick={copyOrder}
        className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        {copied ? "Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
