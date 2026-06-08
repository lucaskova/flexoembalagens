import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentSeller } from "@/lib/seller-auth";
import { formatBRL } from "@/lib/format";

export const metadata = { title: "Relatório de vendas — Portal do Vendedor" };

const PERIODS: Record<string, { label: string; days: number | null }> = {
  "30": { label: "Últimos 30 dias", days: 30 },
  "90": { label: "Últimos 90 dias", days: 90 },
  all: { label: "Tudo", days: null },
};

export default async function VendedorRelatorioPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const { period } = await searchParams;
  const sel = PERIODS[period ?? "30"] ? (period ?? "30") : "30";
  const days = PERIODS[sel].days;

  let commissionPercent = 0;
  let orders: Array<{
    id: string;
    number: string;
    createdAt: Date;
    customer: string;
    items: number;
    total: number;
    commission: number;
    paymentMethod: string | null;
  }> = [];

  try {
    const sellerRow = await prisma.seller.findUnique({
      where: { id: seller.id },
      select: { commissionPercent: true },
    });
    commissionPercent = sellerRow?.commissionPercent ?? 0;

    const where = {
      sellerId: seller.id,
      ...(days ? { createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } } : {}),
    };

    const rows = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        _count: { select: { items: true } },
      },
    });

    orders = rows.map((o) => ({
      id: o.id,
      number: o.number,
      createdAt: o.createdAt,
      customer: o.customer?.name ?? "—",
      items: o._count.items,
      total: o.total,
      commission:
        o.sellerCommission ?? Number(((o.subtotal * commissionPercent) / 100).toFixed(2)),
      paymentMethod: o.paymentMethod,
    }));
  } catch {
    // banco offline
  }

  const totalSold = orders.reduce((s, o) => s + o.total, 0);
  const totalCommission = orders.reduce((s, o) => s + o.commission, 0);

  const cards = [
    { label: "Pedidos", value: String(orders.length) },
    { label: "Total vendido", value: formatBRL(totalSold) },
    { label: `Comissão (${commissionPercent}%)`, value: formatBRL(totalCommission) },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Relatório de vendas</h1>
          <p className="text-sm text-slate-600">Seus pedidos e comissões.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {Object.entries(PERIODS).map(([key, p]) => (
            <Link
              key={key}
              href={`/vendedor/relatorio?period=${key}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                sel === key ? "bg-[#0f4c81] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{c.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Pedidos no período</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum pedido neste período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-3 font-medium">Data</th>
                  <th className="py-2 pr-3 font-medium">Pedido</th>
                  <th className="py-2 pr-3 font-medium">Cliente</th>
                  <th className="py-2 pr-3 font-medium">Pagamento</th>
                  <th className="py-2 pr-3 font-medium">Itens</th>
                  <th className="py-2 pr-3 text-right font-medium">Total</th>
                  <th className="py-2 pr-3 text-right font-medium">Comissão</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 text-slate-600">
                      {o.createdAt.toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-500">
                      #{o.number.slice(-6)}
                    </td>
                    <td className="py-2 pr-3 font-medium text-slate-800">{o.customer}</td>
                    <td className="py-2 pr-3 text-slate-600">{o.paymentMethod ?? "—"}</td>
                    <td className="py-2 pr-3 text-slate-600">{o.items}</td>
                    <td className="py-2 pr-3 text-right font-medium">{formatBRL(o.total)}</td>
                    <td className="py-2 pr-3 text-right font-semibold text-emerald-700">
                      {formatBRL(o.commission)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-bold">
                  <td className="py-2 pr-3" colSpan={5}>
                    Total
                  </td>
                  <td className="py-2 pr-3 text-right">{formatBRL(totalSold)}</td>
                  <td className="py-2 pr-3 text-right text-emerald-700">
                    {formatBRL(totalCommission)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
