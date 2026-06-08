import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentSeller } from "@/lib/seller-auth";
import { buildPricingContextForType, priceFor } from "@/lib/pricing";
import SellerOrderBuilder from "@/components/vendedor/SellerOrderBuilder";

export const metadata = { title: "Novo pedido — Portal do Vendedor" };

export default async function VendedorPedidoPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;

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

  try {
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
  } catch {
    // banco offline
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Novo pedido</h1>
        <p className="text-sm text-slate-600">Monte o pedido em nome do cliente (preço de atacado).</p>
      </header>

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Você ainda não tem clientes.{" "}
          <Link href="/vendedor/clientes/novo" className="font-semibold underline">
            Cadastre um cliente
          </Link>{" "}
          para montar pedidos.
        </div>
      ) : (
        <SellerOrderBuilder
          clients={clients}
          products={products}
          paymentMethods={paymentMethods}
          sellerName={seller.name}
        />
      )}
    </div>
  );
}
