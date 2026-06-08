import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentSeller } from "@/lib/seller-auth";

export const metadata = { title: "Portal do Vendedor" };

export default async function SellerDashboard() {
  const seller = await getCurrentSeller();

  let clientCount = 0;
  let recentClients: Array<{ id: string; name: string; document: string | null }> = [];
  if (seller) {
    try {
      [clientCount, recentClients] = await Promise.all([
        prisma.customer.count({ where: { sellerId: seller.id } }),
        prisma.customer.findMany({
          where: { sellerId: seller.id },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { id: true, name: true, document: true },
        }),
      ]);
    } catch {
      // banco offline
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Olá, {seller?.name ?? "vendedor"} 👋</h1>
        <p className="text-sm text-slate-600">Atenda lojistas e monte pedidos no atacado.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/vendedor/clientes/novo"
          className="rounded-2xl border border-dashed border-[#0f4c81]/40 bg-white p-6 transition hover:border-[#0f4c81] hover:shadow"
        >
          <p className="text-lg font-semibold text-[#0f4c81]">+ Cadastrar cliente</p>
          <p className="mt-1 text-sm text-slate-600">Busca automática por CNPJ.</p>
        </Link>
        <Link
          href="/vendedor/pedido"
          className="rounded-2xl border border-dashed border-emerald-400/50 bg-white p-6 transition hover:border-emerald-500 hover:shadow"
        >
          <p className="text-lg font-semibold text-emerald-700">+ Novo pedido</p>
          <p className="mt-1 text-sm text-slate-600">Monte o pedido em nome do cliente.</p>
        </Link>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/vendedor/pedidos"
          className="block rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-[#0f4c81] shadow-sm transition hover:shadow"
        >
          Ver meus pedidos →
        </Link>
        <Link
          href="/vendedor/relatorio"
          className="block rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-[#0f4c81] shadow-sm transition hover:shadow"
        >
          Ver relatório de vendas e comissões →
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-semibold">Meus clientes ({clientCount})</h2>
        {recentClients.length === 0 ? (
          <p className="text-sm text-slate-500">Você ainda não cadastrou clientes.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentClients.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-slate-800">{c.name}</span>
                <span className="text-slate-500">{c.document ?? "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
