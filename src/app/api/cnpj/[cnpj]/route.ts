import { NextResponse } from "next/server";

type NormalizedCnpj = {
  name: string;
  tradeName: string;
  email: string;
  phone: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

const UA = "Mozilla/5.0 (compatible; FlexoEmbalagens/1.0; +https://flexoembalagens.vercel.app)";

function digits(v: unknown): string {
  return String(v ?? "").replace(/\D/g, "");
}

// BrasilAPI — https://brasilapi.com.br/api/cnpj/v1/{cnpj}
async function fromBrasilApi(cnpj: string): Promise<NormalizedCnpj | null> {
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      headers: { Accept: "application/json", "User-Agent": UA },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (!d || (!d.razao_social && !d.nome_fantasia)) return null;
    const ddd = d.ddd_telefone_1 ?? "";
    return {
      name: d.razao_social ?? d.nome_fantasia ?? "",
      tradeName: d.nome_fantasia ?? "",
      email: d.email ?? "",
      phone: ddd,
      zipCode: digits(d.cep),
      street: d.logradouro ?? "",
      number: d.numero ?? "",
      complement: d.complemento ?? "",
      district: d.bairro ?? "",
      city: d.municipio ?? "",
      state: d.uf ?? "",
    };
  } catch {
    return null;
  }
}

// ReceitaWS — https://receitaws.com.br/v1/cnpj/{cnpj}
async function fromReceitaWs(cnpj: string): Promise<NormalizedCnpj | null> {
  try {
    const res = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpj}`, {
      headers: { Accept: "application/json", "User-Agent": UA },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (!d || d.status === "ERROR" || (!d.nome && !d.fantasia)) return null;
    return {
      name: d.nome ?? d.fantasia ?? "",
      tradeName: d.fantasia ?? "",
      email: d.email ?? "",
      phone: d.telefone ?? "",
      zipCode: digits(d.cep),
      street: d.logradouro ?? "",
      number: d.numero ?? "",
      complement: d.complemento ?? "",
      district: d.bairro ?? "",
      city: d.municipio ?? "",
      state: d.uf ?? "",
    };
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ cnpj: string }> }) {
  const { cnpj } = await params;
  const clean = digits(cnpj);
  if (clean.length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
  }

  // Tenta BrasilAPI; se falhar (bloqueio/limite em IPs de nuvem), tenta ReceitaWS.
  const data = (await fromBrasilApi(clean)) ?? (await fromReceitaWs(clean));

  if (!data) {
    return NextResponse.json(
      { error: "Não foi possível consultar o CNPJ agora. Preencha manualmente." },
      { status: 502 },
    );
  }

  return NextResponse.json(data);
}
