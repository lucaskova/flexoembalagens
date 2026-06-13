/**
 * Cliente Bling API v3 (OAuth 2.0).
 * Documentação: https://developer.bling.com.br/
 *
 * Fluxo:
 * 1. GET /api/integrations/bling/connect → redireciona para OAuth
 * 2. Callback troca code por tokens e salva em Integration
 * 3. POST /api/integrations/bling/sync → puxa produtos/estoque/categorias
 */

const BLING_API = process.env.BLING_API_URL ?? "https://api.bling.com.br/Api/v3";
const BLING_AUTH = "https://www.bling.com.br/Api/v3/oauth/authorize";
const BLING_TOKEN = "https://www.bling.com.br/Api/v3/oauth/token";

export function getBlingAuthUrl(state: string): string {
  const clientId = process.env.BLING_CLIENT_ID;
  if (!clientId) throw new Error("BLING_CLIENT_ID não configurado.");
  const redirect = encodeURIComponent(process.env.BLING_REDIRECT_URI ?? "");
  return `${BLING_AUTH}?response_type=code&client_id=${clientId}&state=${state}&redirect_uri=${redirect}`;
}

export async function exchangeBlingCode(code: string) {
  const clientId = process.env.BLING_CLIENT_ID;
  const clientSecret = process.env.BLING_CLIENT_SECRET;
  const redirectUri = process.env.BLING_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Credenciais Bling incompletas.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(BLING_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bling OAuth falhou: ${err}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>;
}

export async function blingFetch<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${BLING_API}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bling API ${path}: ${err}`);
  }
  return res.json() as Promise<T>;
}

/** Lista produtos do Bling (paginado). */
export async function fetchBlingProducts(accessToken: string, page = 1) {
  return blingFetch<{ data: BlingProduct[] }>(
    accessToken,
    `/produtos?pagina=${page}&limite=100&criterio=2`,
  );
}

export type BlingCategory = {
  id: number;
  descricao: string;
  categoriaPai?: { id: number };
};

/** Lista categorias de produtos do Bling (paginado). */
export async function fetchBlingCategories(accessToken: string, page = 1) {
  return blingFetch<{ data: BlingCategory[] }>(
    accessToken,
    `/categorias/produtos?pagina=${page}&limite=100`,
  );
}

export type BlingProduct = {
  id: number;
  nome: string;
  codigo: string;
  preco: number;
  situacao: string;
  estoque?: { saldoVirtualTotal?: number };
  midia?: { imagens?: { externas?: Array<{ link: string }> } };
  categoria?: { id: number; descricao: string };
};

export type BlingNfeSummary = {
  id: number;
  numero?: string;
  serie?: string;
  chaveAcesso?: string;
  dataEmissao?: string;
  valorNota?: number;
  numeroPedidoLoja?: string;
};

export type BlingNfeDetails = BlingNfeSummary & {
  contato?: {
    nome?: string;
    numeroDocumento?: string;
    email?: string;
    telefone?: string;
    endereco?: {
      cep?: string;
      logradouro?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      municipio?: string;
      uf?: string;
    };
  };
  itens?: Array<{
    descricao?: string;
    quantidade?: number;
    valor?: number;
    codigo?: string;
    classificacaoFiscal?: string;
  }>;
};

export async function getBlingAccessToken(): Promise<string | null> {
  const { prisma } = await import("@/lib/prisma");
  const integration = await prisma.integration.findUnique({ where: { provider: "BLING" } });
  return integration?.accessToken ?? null;
}

export async function fetchBlingSalesOrder(accessToken: string, orderId: string | number) {
  return blingFetch<{ data: Record<string, unknown> }>(accessToken, `/pedidos/vendas/${orderId}`);
}

export async function fetchBlingNfe(accessToken: string, nfeId: string | number) {
  return blingFetch<{ data: BlingNfeDetails }>(accessToken, `/nfe/${nfeId}`);
}

export async function listBlingNfe(accessToken: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  return blingFetch<{ data: BlingNfeSummary[] }>(accessToken, `/nfe?${qs}`);
}

/** Busca NF-e do Bling vinculada ao pedido da loja (por blingId ou número do pedido). */
export async function findBlingNfeForStoreOrder(
  accessToken: string,
  opts: { blingOrderId?: string | null; storeOrderNumber: string; since?: Date },
): Promise<BlingNfeDetails | null> {
  if (opts.blingOrderId) {
    try {
      const pedido = await fetchBlingSalesOrder(accessToken, opts.blingOrderId);
      const nota = pedido.data?.notaFiscal as { id?: number } | undefined;
      if (nota?.id) {
        const nfe = await fetchBlingNfe(accessToken, nota.id);
        return nfe.data;
      }
    } catch {
      // segue para busca por número do pedido na loja
    }
  }

  const since = opts.since ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const dataInicial = since.toISOString().slice(0, 10);

  for (let page = 1; page <= 5; page++) {
    const { data } = await listBlingNfe(accessToken, {
      pagina: String(page),
      limite: "100",
      dataEmissaoInicial: dataInicial,
    });

    const match = data.find(
      (n) =>
        n.numeroPedidoLoja === opts.storeOrderNumber ||
        n.numeroPedidoLoja === opts.storeOrderNumber.slice(-6),
    );
    if (match?.id) {
      const nfe = await fetchBlingNfe(accessToken, match.id);
      return nfe.data;
    }
    if (data.length < 100) break;
  }

  return null;
}
