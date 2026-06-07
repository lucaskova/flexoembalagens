import Link from "next/link";
import { redirect } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import LogoutButton from "@/components/LogoutButton";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/format";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Rascunho", cls: "bg-slate-200 text-slate-600" },
  PENDING: { label: "Aguardando", cls: "bg-amber-100 text-amber-800" },
  PAID: { label: "Pago", cls: "bg-emerald-100 text-emerald-800" },
  SHIPPED: { label: "Enviado", cls: "bg-sky-100 text-sky-800" },
  CANCELED: { label: "Cancelado", cls: "bg-rose-100 text-rose-800" },
};

export default async function MinhaContaPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?redirect=/minha-conta");

  let orders: Awaited<
    ReturnType<typeof prisma.order.findMany<{ include: { items: true } }>>
  > = [];
  try {
    orders = await prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  } catch {
    // banco offline
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <StoreHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Minha conta</h1>
            <p className="text-sm text-slate-600">
              Olá, {customer.name}
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                {customer.type === "PJ" ? "Pessoa Jurídica · Atacado" : "Pessoa Física"}
              </span>
            </p>
          </div>
          <LogoutButton />
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-500">Dados cadastrais</h2>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Nome</dt>
                <dd className="font-medium">{customer.name}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">E-mail</dt>
                <dd className="font-medium">{customer.email}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Telefone</dt>
                <dd className="font-medium">{customer.phone || "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">CPF/CNPJ</dt>
                <dd className="font-medium">{customer.document || "—"}</dd>
              </div>
            </dl>

            <h3 className="mt-4 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-500">
              Endereço de entrega
            </h3>
            {customer.street ? (
              <p className="mt-2 text-sm text-slate-700">
                {customer.street}, {customer.number}
                {customer.complement ? ` — ${customer.complement}` : ""}
                <br />
                {[customer.district, customer.city, customer.state]
                  .filter(Boolean)
                  .join(", ")}
                {customer.zipCode ? <> · CEP {customer.zipCode}</> : null}
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                Nenhum endereço salvo. Será solicitado no checkout.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-500">Resumo</h2>
            <p className="mt-3 text-3xl font-bold">{orders.length}</p>
            <p className="text-sm text-slate-500">pedidos realizados</p>
            <Link
              href="/produtos"
              className="mt-4 inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Continuar comprando
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-bold">Histórico de pedidos</h2>
          {orders.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Você ainda não fez pedidos.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {orders.map((order) => {
                const status = STATUS_LABEL[order.status] ?? {
                  label: order.status,
                  cls: "bg-slate-100 text-slate-600",
                };
                return (
                  <li
                    key={order.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          Pedido #{order.number.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.cls}`}
                        >
                          {status.label}
                        </span>
                        <span className="font-bold text-emerald-800">
                          {formatBRL(Number(order.total))}
                        </span>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-2">
                          <span>
                            {item.quantity}× {item.name}
                          </span>
                          <span>{formatBRL(Number(item.unitPrice) * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
