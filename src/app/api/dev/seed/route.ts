import { NextResponse } from "next/server";
import { seedTestProducts } from "@/lib/seed-products";

// Rota de desenvolvimento para popular produtos de teste.
// Acesse no navegador: http://localhost:3001/api/dev/seed
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Indisponível em produção" }, { status: 403 });
  }
  try {
    const result = await seedTestProducts();
    return NextResponse.json({
      ok: true,
      message: `Seed concluído: ${result.categories} categorias e ${result.products} produtos.`,
      ...result,
    });
  } catch (err) {
    console.error("Erro no seed", err);
    return NextResponse.json(
      { error: "Falha no seed. Verifique se o banco foi criado (npm run db:push)." },
      { status: 500 },
    );
  }
}
