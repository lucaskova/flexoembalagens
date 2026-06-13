import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        active: true,
        products: { some: { status: { not: "HIDDEN" } } },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
    });
    return NextResponse.json(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: c._count.products,
      })),
    );
  } catch {
    return NextResponse.json([]);
  }
}
