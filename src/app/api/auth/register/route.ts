import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2, "Informe seu nome completo."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  phone: z.string().optional(),
  document: z.string().optional(),
  type: z.enum(["PF", "PJ"]).default("PF"),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { name, email, password, phone, document, type } = parsed.data;

  try {
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing?.passwordHash) {
      return NextResponse.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Pode existir um Customer criado em compra anterior (sem senha): completa o cadastro.
    const customer = existing
      ? await prisma.customer.update({
          where: { id: existing.id },
          data: { name, phone, document, passwordHash, type },
        })
      : await prisma.customer.create({
          data: { name, email, phone, document, passwordHash, type },
        });

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
    return NextResponse.json(
      { error: "Não foi possível concluir o cadastro. Tente novamente." },
      { status: 500 },
    );
  }
}
