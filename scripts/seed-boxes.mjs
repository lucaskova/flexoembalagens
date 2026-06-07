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

// Caixas da imagem (A–G). Preços são exemplos — edite no admin.
const boxes = [
  { letter: "A", dims: "16×11×6 cm", price: 2.5, stock: 100 },
  { letter: "B", dims: "16×16×16 cm", price: 3.9, stock: 100 },
  { letter: "C", dims: "26×16×10 cm", price: 4.5, stock: 100 },
  { letter: "D", dims: "30×20×20 cm", price: 6.9, stock: 100 },
  { letter: "E", dims: "18×12×12 cm", price: 3.5, stock: 100 },
  { letter: "F", dims: "41×15×8 cm", price: 5.5, stock: 100 },
  { letter: "G", dims: "30×30×20 cm", price: 8.9, stock: 100 },
];

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: "caixas-de-papelao" },
    update: {},
    create: {
      name: "Caixas de Papelão",
      slug: "caixas-de-papelao",
      description: "Caixas de papelão em vários tamanhos.",
      active: true,
    },
  });

  for (const b of boxes) {
    const name = `Caixa de Papelão ${b.letter} (${b.dims})`;
    const sku = `CAIXA-${b.letter}`;
    await prisma.product.upsert({
      where: { sku },
      update: {
        name,
        slug: slugify(name),
        price: b.price,
        stock: b.stock,
        status: "ACTIVE",
        categoryId: category.id,
        description: `Caixa de papelão tamanho ${b.dims}.`,
      },
      create: {
        name,
        slug: slugify(name),
        sku,
        price: b.price,
        stock: b.stock,
        status: "ACTIVE",
        categoryId: category.id,
        description: `Caixa de papelão tamanho ${b.dims}.`,
      },
    });
    console.log(`OK: ${name} (${sku}) - R$ ${b.price.toFixed(2)}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
