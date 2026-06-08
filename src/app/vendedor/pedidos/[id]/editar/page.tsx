import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentSeller } from "@/lib/seller-auth";
import { buildPricingContextForType, priceFor } from "@/lib/pricing";
import SellerOrderBuilder, { type EditOrder } from "@/components/vendedor/SellerOrderBuilder";

export const metadata = { title: "Editar pedido — Portal do Vendedor" };

export default async function EditarPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const { id } = await params;

  let clients: Array<{ id: string; name: string; type: string; document: string | null }> = [];
  let paymentMethods: Array<{ id: string; name: string }> = [];
  let products: Array<{
    id: string;
    name: string;
    sku: string;
    imageUrl: string | null;
    stock: number;
    price: number;
    listPrice: number;
  }> = [];
  let editOrder: EditOrder | null = null;
  let blocked = false;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { select: { productId: true, quantity: true } } },
    });

    if (!order || order.sellerId !== seller.id) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Pedido não encontrado.{" "}
          <Link href="/vendedor/pedidos" className="font-semibold underline">
            Voltar
          </Link>
        </div>
      );
    }

    if (order.status !== "PENDING" && order.status !== "DRAFT") {
      blocked = true;
    }

    const pricing = await buildPricingContextForType("PJ");
    const [dbClients, dbProducts, dbMethods] = await Promise.all([
      prisma.customer.findMany({
        where: { sellerId: seller.id },
        orderBy: { name: "asc" },
        select: { id: true, name: true, type: true, document: true },
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, sku: true, imageUrl: true, stock: true, price: true, categoryId: true },
      }),
      prisma.paymentMethod.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true },
      }),
    ]);

    clients = dbClients;
    paymentMethods = dbMethods;
    products = dbProducts.map((p) => {
      const priced = priceFor(
        { id: p.id, price: Number(p.price), categoryId: p.categoryId },
        pricing,
      );
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        imageUrl: p.imageUrl,
        stock: p.stock,
        price: priced.price,
        listPrice: Number(p.price),
      };
    });

    const quantities: Record<string, number> = {};
    for (const it of order.items) {
      if (it.productId) quantities[it.productId] = (quantities[it.productId] ?? 0) + it.quantity;
    }
    // Remove o prefixo "[Vendedor: ...]" das observações para edição.
    const cleanNotes = (order.notes ?? "").replace(/^\[Vendedor:[^\]]*\]\s*/, "");

    editOrder = {
      id: order.id,
      customerId: order.customerId ?? "",
      paymentMethod: order.paymentMethod ?? paymentMethods[0]?.name ?? "",
      notes: cleanNotes,
      quantities,
    };
  } catch {
    // banco offline
  }

  if (blocked) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Este pedido já foi processado e não pode mais ser editado.{" "}
        <Link href="/vendedor/pedidos" className="font-semibold underline">
          Voltar
        </Link>
      </div>
    );
  }

  if (!editOrder) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Não foi possível carregar o pedido.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Editar pedido</h1>
          <p className="text-sm text-slate-600">Ajuste os itens, pagamento ou observações.</p>
        </div>
        <Link
          href="/vendedor/pedidos"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Voltar
        </Link>
      </header>

      <SellerOrderBuilder
        clients={clients}
        products={products}
        paymentMethods={paymentMethods}
        sellerName={seller.name}
        editOrder={editOrder}
      />
    </div>
  );
}
