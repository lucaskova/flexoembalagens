// Seed de produtos de teste (uso via terminal):
//   $env:DATABASE_URL='file:./dev.db'; node scripts/seed.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const SEED = [
  {
    name: "Varas para molinete",
    products: [
      { sku: "VM-001", name: "Vara para Molinete 1,80m 2 Partes Ação Média", price: 129.9, stock: 14, featured: true, description: "Vara em fibra de carbono, 2 partes, ideal para molinete em pescarias leves." },
      { sku: "VM-002", name: "Vara para Molinete 2,10m Ação Pesada", price: 169.9, stock: 8, description: "Vara reforçada para iscas pesadas e peixes de maior porte." },
      { sku: "VM-003", name: "Vara Telescópica para Molinete 3,00m", price: 99.9, stock: 0, description: "Vara telescópica compacta, fácil de transportar." },
    ],
  },
  {
    name: "Varas para carretilha",
    products: [
      { sku: "VC-001", name: "Vara para Carretilha 1,68m Ação Rápida", price: 159.9, stock: 11, featured: true, description: "Vara para carretilha com ponteira sensível e cabo emborrachado." },
      { sku: "VC-002", name: "Vara para Carretilha 1,98m 2 Partes", price: 199.9, stock: 6, description: "Vara em 2 partes, ótima para pesca embarcada e de barranco." },
    ],
  },
  {
    name: "Redes de pesca simples",
    products: [
      { sku: "RP-001", name: "Rede de Pesca Simples Malha 40mm 10m", price: 89.9, stock: 20, description: "Rede de espera em nylon, malha 40mm, comprimento 10 metros." },
      { sku: "RP-002", name: "Rede de Pesca Simples Malha 60mm 20m", price: 149.9, stock: 12, featured: true, description: "Rede de espera reforçada, malha 60mm, comprimento 20 metros." },
    ],
  },
  {
    name: "Tarrafas com chumbo interno",
    products: [
      { sku: "TI-001", name: "Tarrafa com Chumbo Interno Malha 25mm 1,80m", price: 219.9, stock: 7, featured: true, description: "Tarrafa de arremesso com chumbo interno, abertura rápida." },
      { sku: "TI-002", name: "Tarrafa com Chumbo Interno Malha 35mm 2,20m", price: 289.9, stock: 4, description: "Tarrafa maior para peixes de médio porte, chumbo interno." },
    ],
  },
  {
    name: "Tarrafas com chumbo externo",
    products: [
      { sku: "TE-001", name: "Tarrafa com Chumbo Externo Malha 30mm 2,00m", price: 199.9, stock: 9, description: "Tarrafa tradicional com chumbo externo, ótimo afundamento." },
      { sku: "TE-002", name: "Tarrafa com Chumbo Externo Malha 45mm 2,50m", price: 279.9, stock: 0, description: "Tarrafa grande com chumbo externo para águas mais fundas." },
    ],
  },
];

async function main() {
  let categories = 0;
  let products = 0;
  for (const cat of SEED) {
    const slug = slugify(cat.name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name: cat.name },
      create: { name: cat.name, slug },
    });
    categories += 1;
    for (const p of cat.products) {
      await prisma.product.upsert({
        where: { sku: p.sku },
        update: {
          name: p.name,
          slug: slugify(p.name),
          description: p.description,
          price: p.price,
          stock: p.stock,
          featured: p.featured ?? false,
          status: p.stock > 0 ? "ACTIVE" : "OUT_OF_STOCK",
          categoryId: category.id,
        },
        create: {
          sku: p.sku,
          name: p.name,
          slug: slugify(p.name),
          description: p.description,
          price: p.price,
          stock: p.stock,
          featured: p.featured ?? false,
          status: p.stock > 0 ? "ACTIVE" : "OUT_OF_STOCK",
          categoryId: category.id,
        },
      });
      products += 1;
    }
  }
  console.log(`SEED_OK categorias=${categories} produtos=${products}`);
}

main()
  .catch((e) => {
    console.error("SEED_ERRO", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
