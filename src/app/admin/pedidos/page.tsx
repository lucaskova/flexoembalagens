import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/format";

export const metadata = { title: "Pedidos — Painel" };

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Rascunho", cls: "bg-slate-100 text-slate-600" },
  PENDING: { label: "Pendente", cls: "bg-amber-100 text-amber-700" },
  PAID: { label: "Pago", cls: "bg-emerald-100 text-emerald-700" },
  SHIPPED: { label: "Enviado", cls: "bg-sky-100 text-sky-700" },
  CANCELLED: { label: "Cancelado", cls: "bg-rose-100 text-rose-700" },
};

export default async function AdminPedidosPage() {
  let orders: Array<{
    id: string;
    number: string;
    createdAt: Date;
    customer: string;
    seller: string | null;
    paymentMethod: string | null;
    status: string;
    items: number;
    total: number;
    commission: number | null;
  }> = [];
  let totalRevenue = 0;
  let totalCommission = 0;

  try {
    const [rows, sellers] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          customer: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.seller.findMany({ select: { id: true, name: true } }),
    ]);

    const sellerName = new Map(sellers.map((s) => [s.id, s.name]));

    orders = rows.map((o) => ({
      id: o.id,
      number: o.number,
      createdAt: o.createdAt,
      customer: o.customer?.name ?? "—",
      seller: o.sellerId ? sellerName.get(o.sellerId) ?? "—" : null,
      paymentMethod: o.paymentMethod,
      status: o.status,
      items: o._count.items,
      total: o.total,
      commission: o.sellerCommission,
    }));

    totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    totalCommission = orders.reduce((s, o) => s + (o.commission ?? 0), 0);
  } catch {
    // banco offline
  }

  const cards = [
    { label: "Pedidos", value: String(orders.length) },
    { label: "Faturamento", value: formatBRL(totalRevenue) },
    { label: "Comissões", value: formatBRL(totalCommission) },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-slate-600">Pedidos da loja e dos vendedores externos.</p>
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
        <h2 className="mb-4 font-semibold">Últimos pedidos ({orders.length})</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum pedido ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-3 font-medium">Data</th>
                  <th className="py-2 pr-3 font-medium">Pedido</th>
                  <th className="py-2 pr-3 font-medium">Cliente</th>
                  <th className="py-2 pr-3 font-medium">Vendedor</th>
                  <th className="py-2 pr-3 font-medium">Pagamento</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Itens</th>
                  <th className="py-2 pr-3 text-right font-medium">Total</th>
                  <th className="py-2 pr-3 text-right font-medium">Comissão</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const st = STATUS_LABEL[o.status] ?? {
                    label: o.status,
                    cls: "bg-slate-100 text-slate-600",
                  };
                  return (
                    <tr key={o.id} className="border-b border-slate-100">
                      <td className="py-2 pr-3 text-slate-600">
                        {o.createdAt.toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs text-slate-500">
                        #{o.number.slice(-6)}
                      </td>
                      <td className="py-2 pr-3 font-medium text-slate-800">{o.customer}</td>
                      <td className="py-2 pr-3 text-slate-600">
                        {o.seller ?? <span className="text-slate-400">Loja</span>}
                      </td>
                      <td className="py-2 pr-3 text-slate-600">{o.paymentMethod ?? "—"}</td>
                      <td className="py-2 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-slate-600">{o.items}</td>
                      <td className="py-2 pr-3 text-right font-medium">{formatBRL(o.total)}</td>
                      <td className="py-2 pr-3 text-right text-emerald-700">
                        {o.commission ? formatBRL(o.commission) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
