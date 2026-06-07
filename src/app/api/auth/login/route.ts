import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 400 });
  }

  const { email, password } = parsed.data;

  try {
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer?.passwordHash) {
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }

    const valid = await verifyPassword(password, customer.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }

    await createSession(customer.id);

    return NextResponse.json({
      ok: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        type: customer.type,
      },
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível entrar. Tente novamente." }, { status: 500 });
  }
}
