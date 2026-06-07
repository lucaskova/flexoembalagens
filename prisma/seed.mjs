// Gerado automaticamente por scripts/export-seed.mjs
// Popula o banco (Postgres em produção) com os dados da loja.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const data = {
  "settings": {
    "id": "default",
    "name": "Flexo embalagens",
    "description": null,
    "logoUrl": "/seed-images/logo.png",
    "themeColor": "#0F4C81",
    "whatsapp": null,
    "email": null,
    "instagram": null,
    "announcement": "Frete grátis acima de R$ 299!",
    "announcementEnabled": true,
    "freeShippingEnabled": true,
    "freeShippingThreshold": 300,
    "b2bEnabled": true,
    "b2bDiscountPercent": 20,
    "b2bMinOrder": 600,
    "b2bMinFreight": null,
    "b2bFreeShippingEnabled": true,
    "b2bFreeShippingThreshold": 1400,
    "heroEnabled": true,
    "heroTitle": "Embalagens para E-commerce com entrega rápida",
    "heroSubtitle": "Caixas, fitas e suprimentos para lojistas e marketplaces.",
    "heroCtaLabel": "Comprar Agora",
    "featuredCarouselEnabled": true,
    "featuredTitle": "Mais vendidos",
    "updatedAt": "2026-06-07T18:16:30.472Z"
  },
  "categories": [
    {
      "id": "cmq40e2020002gxybwpzywxzo",
      "name": "Caixas de papelão",
      "slug": "caixas-de-papelao",
      "description": null,
      "active": true,
      "blingId": null,
      "createdAt": "2026-06-07T16:41:11.330Z",
      "updatedAt": "2026-06-07T16:41:11.330Z"
    },
    {
      "id": "cmq410v7f0003gxyb0jty7niw",
      "name": "Fitas Durex",
      "slug": "fitas-durex",
      "description": "Fitas para embalar",
      "active": true,
      "blingId": null,
      "createdAt": "2026-06-07T16:58:55.612Z",
      "updatedAt": "2026-06-07T16:58:55.612Z"
    },
    {
      "id": "cmq411bmn0004gxybmmjr68kp",
      "name": "Etiqueta adesiva",
      "slug": "etiqueta-adesiva",
      "description": "Etiquete termica para e-commerce",
      "active": true,
      "blingId": null,
      "createdAt": "2026-06-07T16:59:16.896Z",
      "updatedAt": "2026-06-07T16:59:16.896Z"
    }
  ],
  "products": [
    {
      "id": "cmq40dekb0002h3ibualmjfew",
      "name": "Caixa de Papelão A (16×11×6 cm)",
      "slug": "caixa-de-papelao-a-16-11-6-cm",
      "description": "Caixa de papelão tamanho 16×11×6 cm.",
      "sku": "CAIXA-A",
      "price": 2.5,
      "stock": 100,
      "status": "ACTIVE",
      "featured": false,
      "imageUrl": "/seed-images/caixa-A.png",
      "blingId": null,
      "categoryId": "cmq40e2020002gxybwpzywxzo",
      "syncedAt": null,
      "createdAt": "2026-06-07T16:40:40.956Z",
      "updatedAt": "2026-06-07T18:16:30.300Z"
    },
    {
      "id": "cmq40del50004h3ibbbj4vgfg",
      "name": "Caixa de Papelão B (16×16×16 cm)",
      "slug": "caixa-de-papelao-b-16-16-16-cm",
      "description": "Caixa de papelão tamanho 16×16×16 cm.",
      "sku": "CAIXA-B",
      "price": 3.9,
      "stock": 100,
      "status": "ACTIVE",
      "featured": false,
      "imageUrl": "/seed-images/caixa-B.png",
      "blingId": null,
      "categoryId": "cmq40e2020002gxybwpzywxzo",
      "syncedAt": null,
      "createdAt": "2026-06-07T16:40:40.985Z",
      "updatedAt": "2026-06-07T18:16:30.325Z"
    },
    {
      "id": "cmq40delz0006h3ibheaut2kd",
      "name": "Caixa de Papelão C (26×16×10 cm)",
      "slug": "caixa-de-papelao-c-26-16-10-cm",
      "description": "Caixa de papelão tamanho 26×16×10 cm.",
      "sku": "CAIXA-C",
      "price": 4.5,
      "stock": 100,
      "status": "ACTIVE",
      "featured": false,
      "imageUrl": "/seed-images/caixa-C.png",
      "blingId": null,
      "categoryId": "cmq40e2020002gxybwpzywxzo",
      "syncedAt": null,
      "createdAt": "2026-06-07T16:40:41.015Z",
      "updatedAt": "2026-06-07T18:16:30.340Z"
    },
    {
      "id": "cmq40demu0008h3ibhk9uihrn",
      "name": "Caixa de Papelão D (30×20×20 cm)",
      "slug": "caixa-de-papelao-d-30-20-20-cm",
      "description": "Caixa de papelão tamanho 30×20×20 cm.",
      "sku": "CAIXA-D",
      "price": 6.9,
      "stock": 100,
      "status": "ACTIVE",
      "featured": false,
      "imageUrl": "/seed-images/caixa-D.png",
      "blingId": null,
      "categoryId": "cmq40e2020002gxybwpzywxzo",
      "syncedAt": null,
      "createdAt": "2026-06-07T16:40:41.046Z",
      "updatedAt": "2026-06-07T18:16:30.354Z"
    },
    {
      "id": "cmq40dend000ah3ib4kxgju8w",
      "name": "Caixa de Papelão E (18×12×12 cm)",
      "slug": "caixa-de-papelao-e-18-12-12-cm",
      "description": "Caixa de papelão tamanho 18×12×12 cm.",
      "sku": "CAIXA-E",
      "price": 3.5,
      "stock": 100,
      "status": "ACTIVE",
      "featured": false,
      "imageUrl": "/seed-images/caixa-E.png",
      "blingId": null,
      "categoryId": "cmq40e2020002gxybwpzywxzo",
      "syncedAt": null,
      "createdAt": "2026-06-07T16:40:41.066Z",
      "updatedAt": "2026-06-07T18:16:30.371Z"
    },
    {
      "id": "cmq40denx000ch3ibaym4qp2h",
      "name": "Caixa de Papelão F (41×15×8 cm)",
      "slug": "caixa-de-papelao-f-41-15-8-cm",
      "description": "Caixa de papelão tamanho 41×15×8 cm.",
      "sku": "CAIXA-F",
      "price": 5.5,
      "stock": 100,
      "status": "ACTIVE",
      "featured": false,
      "imageUrl": "/seed-images/caixa-F.png",
      "blingId": null,
      "categoryId": "cmq40e2020002gxybwpzywxzo",
      "syncedAt": null,
      "createdAt": "2026-06-07T16:40:41.085Z",
      "updatedAt": "2026-06-07T18:16:30.387Z"
    },
    {
      "id": "cmq40deof000eh3ibtn72c2ck",
      "name": "Caixa de Papelão G (30×30×20 cm)",
      "slug": "caixa-de-papelao-g-30-30-20-cm",
      "description": "Caixa de papelão tamanho 30×30×20 cm.",
      "sku": "CAIXA-G",
      "price": 8.9,
      "stock": 100,
      "status": "ACTIVE",
      "featured": false,
      "imageUrl": "/seed-images/caixa-G.png",
      "blingId": null,
      "categoryId": "cmq40e2020002gxybwpzywxzo",
      "syncedAt": null,
      "createdAt": "2026-06-07T16:40:41.103Z",
      "updatedAt": "2026-06-07T18:16:30.403Z"
    },
    {
      "id": "cmq41dlh80006gxybr0naebni",
      "name": "Kit 10 fita durex  45mm E 40 metros   para embalar",
      "slug": "kit-10-fita-durex-45mm-e-40-metros-para-embalar",
      "description": "KIT 10 FITAS DUREX 40 METROS 45MM.",
      "sku": "FT-DRXKT",
      "price": 130,
      "stock": 10,
      "status": "ACTIVE",
      "featured": false,
      "imageUrl": "/seed-images/kit-fita.png",
      "blingId": null,
      "categoryId": "cmq410v7f0003gxyb0jty7niw",
      "syncedAt": null,
      "createdAt": "2026-06-07T17:08:49.532Z",
      "updatedAt": "2026-06-07T18:16:30.425Z"
    },
    {
      "id": "cmq41grw90008gxybn1m2hk91",
      "name": "Kit 10 Etiqueta térmica para e-commerce 10x15",
      "slug": "kit-10-etiqueta-termica-para-e-commerce-10x15",
      "description": "Etiqueta térmica para e-commerce.\r\n10x15cm",
      "sku": "ETQ-TE",
      "price": 150,
      "stock": 10,
      "status": "ACTIVE",
      "featured": false,
      "imageUrl": "/seed-images/kit-etiqueta.png",
      "blingId": null,
      "categoryId": "cmq411bmn0004gxybmmjr68kp",
      "syncedAt": null,
      "createdAt": "2026-06-07T17:11:17.817Z",
      "updatedAt": "2026-06-07T18:16:30.444Z"
    }
  ],
  "promotions": [
    {
      "id": "cmq2pj64x00037psszhojj7oc",
      "title": "Semana do Pescador",
      "description": null,
      "discountType": "PERCENT",
      "discountValue": 10,
      "scope": "STORE",
      "productId": null,
      "categoryId": null,
      "active": true,
      "startsAt": null,
      "endsAt": null,
      "createdAt": "2026-06-06T18:49:28.018Z",
      "updatedAt": "2026-06-06T18:49:28.018Z"
    },
    {
      "id": "cmq2srl7e00047pssw17bu9dd",
      "title": "semana do pescador",
      "description": "aproveite este desconto especial sómente esta semana",
      "discountType": "PERCENT",
      "discountValue": 10,
      "scope": "STORE",
      "productId": null,
      "categoryId": null,
      "active": false,
      "startsAt": "2026-06-06T20:21:00.000Z",
      "endsAt": "2026-06-10T19:21:00.000Z",
      "createdAt": "2026-06-06T20:19:59.643Z",
      "updatedAt": "2026-06-06T20:19:59.643Z"
    }
  ]
};

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
