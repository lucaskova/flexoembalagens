import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentSeller } from "@/lib/seller-auth";
import { formatBRL } from "@/lib/format";
import OrderShareButtons, { type ShareOrder } from "@/components/vendedor/OrderShareButtons";

export const metadata = { title: "Meus pedidos — Portal do Vendedor" };

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Rascunho", cls: "bg-slate-100 text-slate-600" },
  PENDING: { label: "Pendente", cls: "bg-amber-100 text-amber-700" },
  PAID: { label: "Pago", cls: "bg-emerald-100 text-emerald-700" },
  SHIPPED: { label: "Enviado", cls: "bg-sky-100 text-sky-700" },
  CANCELLED: { label: "Cancelado", cls: "bg-rose-100 text-rose-700" },
};

export default async function MeusPedidosPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  let orders: Array<{ share: ShareOrder; id: string; status: string; editable: boolean }> = [];

  try {
    const rows = await prisma.order.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        customer: { select: { name: true, document: true, phone: true } },
        items: { select: { name: true, sku: true, quantity: true, unitPrice: true } },
      },
    });

    orders = rows.map((o) => ({
      id: o.id,
      status: o.status,
      editable: o.status === "PENDING" || o.status === "DRAFT",
      share: {
        number: o.number,
        total: o.total,
        createdAt: o.createdAt.toISOString(),
        paymentMethod: o.paymentMethod,
        customer: {
          name: o.customer?.name ?? "—",
          document: o.customer?.document ?? null,
          phone: o.customer?.phone ?? null,
        },
        seller: { name: seller.name },
        items: o.items,
      },
    }));
  } catch {
    // banco offline
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Meus pedidos</h1>
          <p className="text-sm text-slate-600">Pedidos que você montou para seus clientes.</p>
        </div>
        <Link
          href="/vendedor/pedido"
          className="rounded-lg bg-[#0f4c81] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0c3c64]"
        >
          + Novo pedido
        </Link>
      </header>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Você ainda não tem pedidos.
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const st = STATUS_LABEL[o.status] ?? { label: o.status, cls: "bg-slate-100 text-slate-600" };
            return (
              <li
                key={o.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-500">
                        #{o.share.number.slice(-6)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-medium text-slate-800">
                      {o.share.customer.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(o.share.createdAt).toLocaleString("pt-BR")} ·{" "}
                      {o.share.items.length} {o.share.items.length === 1 ? "item" : "itens"}
                      {o.share.paymentMethod ? ` · ${o.share.paymentMethod}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-[#0f4c81]">
                      {formatBRL(o.share.total)}
                    </span>
                    <OrderShareButtons order={o.share} variant="compact" />
                    {o.editable && (
                      <Link
                        href={`/vendedor/pedidos/${o.id}/editar`}
                        className="flex h-8 items-center rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
