import { PrismaClient } from "@prisma/client";
import { writeFile } from "fs/promises";
import path from "path";

const p = new PrismaClient();

const settings = await p.storeSettings.findUnique({ where: { id: "default" } });
const categories = await p.category.findMany();
const products = await p.product.findMany();

let promotions = [];
try {
  promotions = await p.promotion.findMany();
} catch {
  // modelo pode não existir
}

const data = { settings, categories, products, promotions };

const out = `// Gerado automaticamente por scripts/export-seed.mjs
// Popula o banco (Postgres em produção) com os dados da loja.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const data = ${JSON.stringify(data, null, 2)};

async function main() {
  if (data.settings) {
    const { id, ...rest } = data.settings;
    await prisma.storeSettings.upsert({
      where: { id: id ?? "default" },
      update: rest,
      create: { id: id ?? "default", ...rest },
    });
  }

  for (const c of data.categories) {
    await prisma.category.upsert({ where: { id: c.id }, update: c, create: c });
  }

  for (const prod of data.products) {
    await prisma.product.upsert({ where: { id: prod.id }, update: prod, create: prod });
  }

  for (const promo of data.promotions) {
    await prisma.promotion.upsert({ where: { id: promo.id }, update: promo, create: promo });
  }

  console.log("Seed concluído:", {
    categorias: data.categories.length,
    produtos: data.products.length,
    promocoes: data.promotions.length,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
`;

await writeFile(path.join(process.cwd(), "prisma", "seed.mjs"), out, "utf8");
console.log("prisma/seed.mjs gerado.");
await p.$disconnect();
