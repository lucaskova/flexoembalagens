import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const cats = await prisma.category.findMany({
  include: { _count: { select: { products: true } }, products: { orderBy: { name: "asc" } } },
  orderBy: { name: "asc" },
});
for (const c of cats) {
  console.log(`\n# ${c.name} (${c._count.products})`);
  for (const p of c.products) {
    console.log(`  - ${p.name} | ${p.sku} | R$ ${p.price.toFixed(2)} | estoque ${p.stock} | ${p.status}`);
  }
}
console.log(`\nTOTAL produtos: ${await prisma.product.count()}`);
await prisma.$disconnect();
