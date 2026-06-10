/**
 * Cliente J&T Express (frete) — plataforma J&T Open (open.jtjms-br.com).
 *
 * Configure no .env.local / Vercel:
 *   JT_API_URL        → URL base do gateway de API (NÃO é o portal de docs).
 *                       Ex.: https://.../webopenplatformapi
 *   JT_API_ACCOUNT    → apiAccount fornecido pela J&T
 *   JT_PRIVATE_KEY    → privateKey fornecido pela J&T
 *   JT_CUSTOMER_CODE      → customerCode do contrato
 *   JT_ORIGIN_ZIP_CODE    → CEP de origem (armazém/loja)
 *   JT_GOODS_TYPE_CODE    → goodsTypeCode (padrão: bm000008)
 *   JT_PRODUCT_TYPE_CODE  → productTypeCode (padrão: EZ)
 *   JT_CUSTOMER_PWD       → senha do cliente para calcular o digest fixo do body
 *   JT_BODY_DIGEST        → digest fixo do body (opcional; se já veio pronto)
 *   JT_TRACK_PATH         → path do rastreio (obrigatório p/ tracking)
 *   JT_CREATE_ORDER_PATH  → path de criação (padrão: /api/order/addOrder)
 *   JT_LABEL_PATH         → path da etiqueta (padrão: /api/order/printOrder)
 *   JT_CANCEL_PATH        → path de cancelamento (padrão: /api/order/cancelOrder)
 *   JT_EXPRESS_TYPE/ORDER_TYPE/SERVICE_TYPE/DELIVERY_TYPE → padrões do contrato
 *
 * Autenticação (J&T Open Platform):
 *   - HTTP POST, body `application/x-www-form-urlencoded`, UTF-8.
 *   - Parâmetros de negócio vão num campo `bizContent` (JSON string).
 *   - Assinatura: digest = base64(md5(bizContentJson + privateKey)).
 *     -> primeiro MD5 (bytes), depois Base64.
 *   - Headers: apiAccount, digest, timestamp.
 *
 * Endpoints/campos exatos do contrato BR são preenchidos via env (paths) e
 * mapeamento abaixo, para evoluir sem mudar o resto da loja.
 */

import crypto from "crypto";

const JT_API_URL_DEMO = "https://demoopenapi.jtjms-br.com/webopenplatformapi";
const JT_API_URL_PROD = "https://openapi.jtjms-br.com/webopenplatformapi";
const JT_QUOTE_PATH_DEFAULT = "/api/spmComCost/getComCostAndTime";
const JT_CREATE_PATH_DEFAULT = "/api/order/addOrder";
const JT_LABEL_PATH_DEFAULT = "/api/order/printOrder";
const JT_CANCEL_PATH_DEFAULT = "/api/order/cancelOrder";
const JT_TRACK_PATH_DEFAULT = "/api/logistics/trace";

export type FreightQuoteInput = {
  /** CEP de destino (sem máscara). */
  destinationZipCode: string;
  weightGrams: number;
  /** Valor declarado para seguro (opcional). */
  insuredAmount?: number;
};

export type FreightQuoteResult = {
  carrier: "JT_EXPRESS";
  service: string;
  cost: number;
  estimatedDays: number;
  raw?: unknown;
};

type JtConfig = {
  apiUrl: string;
  apiAccount: string;
  privateKey: string;
  customerCode: string;
  bodyDigest?: string;
  originZipCode: string;
  goodsTypeCode: string;
  productTypeCode: string;
  customerPwd?: string;
};

type JtApiResponse<T = unknown> = {
  code?: string;
  msg?: string;
  data?: T;
};

function defaultApiUrl(): string {
  if (process.env.JT_API_URL) return process.env.JT_API_URL;
  return process.env.JT_API_ENV === "production" ? JT_API_URL_PROD : JT_API_URL_DEMO;
}

function getConfig(): JtConfig | null {
  const apiUrl = defaultApiUrl();
  const apiAccount = process.env.JT_API_ACCOUNT;
  const privateKey = process.env.JT_PRIVATE_KEY;
  const customerCode = process.env.JT_CUSTOMER_CODE;
  const originZipCode = (process.env.JT_ORIGIN_ZIP_CODE || "").replace(/\D/g, "");

  if (!apiAccount || !privateKey || !customerCode) return null;

  return {
    apiUrl: apiUrl.replace(/\/+$/, ""),
    apiAccount,
    privateKey,
    customerCode,
    bodyDigest:
      process.env.JT_BODY_DIGEST ||
      (process.env.JT_CUSTOMER_PWD
        ? buildBodyDigest(customerCode, process.env.JT_CUSTOMER_PWD, privateKey)
        : undefined),
    originZipCode,
    goodsTypeCode: process.env.JT_GOODS_TYPE_CODE || "bm000008",
    productTypeCode: process.env.JT_PRODUCT_TYPE_CODE || "EZ",
    customerPwd: process.env.JT_CUSTOMER_PWD || undefined,
  };
}

function formatWeightKg(weightGrams: number): string {
  return (Math.max(weightGrams, 300) / 1000).toFixed(2);
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function md5HexUpper(value: string): string {
  return crypto.createHash("md5").update(value, "utf8").digest("hex").toUpperCase();
}

/**
 * Business parameter signature (digest fixo do body).
 * Doc J&T BR:
 * 1. PWD = MD5(Senha + "jadada236t2") em MAIUSCULO.
 * 2. Digest do body é gerado com CustomerCode + PWD + PrivateKey.
 *
 * Se a J&T já fornecer este valor pelo Help Center, use JT_BODY_DIGEST.
 */
function buildBodyDigest(customerCode: string, customerPwd: string, privateKey: string): string {
  const pwd = md5HexUpper(`${customerPwd}jadada236t2`);
  const md5Bytes = crypto.createHash("md5").update(customerCode + pwd + privateKey, "utf8").digest();
  return md5Bytes.toString("base64");
}

/**
 * digest = base64(md5(bizContentJson + privateKey)).
 * MD5 gera bytes; depois aplicamos Base64.
 */
export function buildDigest(bizContentJson: string, privateKey: string): string {
  const md5Bytes = crypto
    .createHash("md5")
    .update(bizContentJson + privateKey, "utf8")
    .digest(); // Buffer (bytes), NÃO hex
  return md5Bytes.toString("base64");
}

export type JtRequestResult<T = unknown> = {
  ok: boolean;
  status: number;
  data: T | null;
  raw: string;
  error?: string;
};

/**
 * Chamada genérica à plataforma J&T Open.
 * `path` é o caminho do endpoint relativo a JT_API_URL (ex.: "/api/order/addOrder").
 * `bizContent` são os parâmetros de negócio (serão serializados em JSON e assinados).
 */
export async function jtRequest<T = unknown>(
  path: string,
  bizContent: Record<string, unknown>,
  config?: JtConfig,
): Promise<JtRequestResult<T>> {
  const cfg = config ?? getConfig();
  if (!cfg) {
    return { ok: false, status: 0, data: null, raw: "", error: "J&T não configurado" };
  }

  const bizJson = JSON.stringify(bizContent);
  const digest = buildDigest(bizJson, cfg.privateKey);
  const timestamp = Date.now().toString();

  const body = new URLSearchParams();
  body.set("bizContent", bizJson);

  const url = `${cfg.apiUrl}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        apiAccount: cfg.apiAccount,
        digest,
        timestamp,
      },
      body: body.toString(),
      // cotação não deve travar o checkout indefinidamente
      signal: AbortSignal.timeout(12_000),
    });

    const raw = await res.text();
    let data: T | null = null;
    try {
      data = JSON.parse(raw) as T;
    } catch {
      data = null;
    }

    return { ok: res.ok, status: res.status, data, raw };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Falha na requisição J&T";
    return { ok: false, status: 0, data: null, raw: "", error };
  }
}

/**
 * Cotação de frete — getComCostAndTime (Check freight e Deadline).
 * Doc: POST .../api/spmComCost/getComCostAndTime
 */
export async function quoteJtExpress(input: FreightQuoteInput): Promise<FreightQuoteResult | null> {
  const cfg = getConfig();
  if (!cfg) return null;
  if (cfg.originZipCode.length !== 8) return null;

  const destinationZipCode = input.destinationZipCode.replace(/\D/g, "");
  if (destinationZipCode.length !== 8) return null;

  const path = process.env.JT_QUOTE_PATH || JT_QUOTE_PATH_DEFAULT;

  const bizContent: Record<string, unknown> = {
    customerCode: cfg.customerCode,
    digest: cfg.bodyDigest,
    originZipCode: cfg.originZipCode,
    destinationZipCode,
    goodsTypeCode: cfg.goodsTypeCode,
    productTypeCode: cfg.productTypeCode,
    weight: formatWeightKg(input.weightGrams),
  };

  if (input.insuredAmount != null && input.insuredAmount > 0) {
    bizContent.insuredAmount = formatMoney(input.insuredAmount);
  }

  const result = await jtRequest<JtApiResponse<Record<string, unknown>>>(path, bizContent, cfg);
  if (!result.ok || !result.data) return null;

  const envelope = result.data;
  if (envelope.code !== "1" || !envelope.data) return null;

  const data = envelope.data;
  const cost = Number(
    data.riskPremiumWaybillFee ?? data.cost ?? data.totalFee ?? 0,
  );
  const estimatedDays = Number(data.aging ?? data.deliveryDays ?? 5);

  if (!Number.isFinite(cost) || cost < 0) return null;

  return {
    carrier: "JT_EXPRESS",
    service: "J&T Express",
    cost,
    estimatedDays: Number.isFinite(estimatedDays) ? estimatedDays : 5,
    raw: result.data,
  };
}

/** Remetente/destinatário no padrão J&T (sender/receiver/translate). */
export type JtParty = {
  name: string;
  company?: string;
  postCode: string;
  mailBox?: string;
  taxNumber: string; // CPF/CNPJ
  mobile?: string;
  phone?: string;
  prov: string; // UF
  city: string;
  street: string;
  streetNumber?: string;
  address?: string; // complemento
  areaCode?: string;
  ieNumber?: string; // Inscrição estadual ("ISENTO" p/ PF)
  area?: string; // bairro
};

export type JtShipmentItem = {
  itemType?: string;
  itemName: string;
  number: number;
  desc?: string;
  itemNcm?: string;
};

export type CreateShipmentInput = {
  /** Pedido interno / código da etiqueta do cliente. */
  txlogisticId: string;
  sender: JtParty;
  receiver: JtParty;
  /** Dados de coleta — se omitido, usa o sender. */
  translate?: JtParty;
  goodsType?: string;
  weightKg: number;
  totalQuantity?: number;
  items: JtShipmentItem[];
  // Dados fiscais (NF-e / CT-e / DCe)
  invoiceNumber: string;
  invoiceSerialNumber: string;
  invoiceMoney: string;
  invoiceAccessKey: string;
  invoiceIssueDate: string; // "YYYY-MM-DD HH:mm:ss"
  invoiceType?: string; // "NF-e" | "CT-e"
  taxCode?: string;
};

export type CreateShipmentResult = {
  txlogisticId: string;
  billCode: string;
  raw: unknown;
};

function defaults(party: JtParty): Record<string, unknown> {
  return {
    name: party.name,
    company: party.company,
    postCode: party.postCode.replace(/\D/g, ""),
    mailBox: party.mailBox,
    taxNumber: party.taxNumber.replace(/\D/g, ""),
    mobile: party.mobile,
    phone: party.phone,
    prov: party.prov,
    city: party.city,
    street: party.street,
    streetNumber: party.streetNumber || "SN",
    address: party.address || "SEM COMPLEMENTO",
    areaCode: party.areaCode,
    ieNumber: party.ieNumber || "ISENTO",
    area: party.area,
  };
}

/**
 * Criação de pedido J&T (Create Order) a partir de documento fiscal (NF-e/CT-e).
 * Doc (bizContent): customerCode, txlogisticId, expressType, orderType,
 * serviceType, deliveryType, sender, receiver, translate, items, invoice*.
 */
export async function createJtShipment(
  input: CreateShipmentInput,
): Promise<CreateShipmentResult | null> {
  const cfg = getConfig();
  if (!cfg) return null;

  const path = process.env.JT_CREATE_ORDER_PATH || JT_CREATE_PATH_DEFAULT;

  const bizContent: Record<string, unknown> = {
    customerCode: cfg.customerCode,
    digest: cfg.bodyDigest,
    txlogisticId: input.txlogisticId,
    expressType: process.env.JT_EXPRESS_TYPE || "EZ",
    orderType: process.env.JT_ORDER_TYPE || "2",
    serviceType: process.env.JT_SERVICE_TYPE || "02",
    deliveryType: process.env.JT_DELIVERY_TYPE || "03",
    sender: defaults(input.sender),
    receiver: defaults(input.receiver),
    translate: defaults(input.translate ?? input.sender),
    goodsType: input.goodsType || cfg.goodsTypeCode,
    weight: String(input.weightKg),
    totalQuantity: input.totalQuantity ?? 1,
    items: input.items.map((it) => ({
      itemType: it.itemType || input.goodsType || cfg.goodsTypeCode,
      itemName: it.itemName,
      number: it.number,
      desc: it.desc || it.itemName,
      itemNcm: it.itemNcm,
    })),
    invoiceNumber: input.invoiceNumber,
    invoiceSerialNumber: input.invoiceSerialNumber,
    invoiceMoney: input.invoiceMoney,
    invoiceAccessKey: input.invoiceAccessKey,
    invoiceIssueDate: input.invoiceIssueDate,
  };

  if (input.invoiceType) bizContent.invoiceType = input.invoiceType;
  if (input.taxCode) bizContent.taxCode = input.taxCode;

  const result = await jtRequest<JtApiResponse<Record<string, unknown>>>(path, bizContent, cfg);
  if (!result.ok || !result.data) return null;

  const envelope = result.data;
  if (envelope.code !== "1" || !envelope.data) return null;

  const billCode = String(envelope.data.billCode ?? "");
  if (!billCode) return null;

  return {
    txlogisticId: String(envelope.data.txlogisticId ?? input.txlogisticId),
    billCode,
    raw: result.data,
  };
}

/**
 * Etiqueta (Smartlabel). bizContent: customerCode, billCode, printSize.
 * Retorna o conteúdo bruto (geralmente base64/URL) para download/impressão.
 */
export async function getJtLabel(
  billCode: string,
  printSize = 0,
): Promise<{ billCode: string; pdfBase64: string; raw: unknown } | null> {
  const cfg = getConfig();
  if (!cfg) return null;

  const path = process.env.JT_LABEL_PATH || JT_LABEL_PATH_DEFAULT;
  const result = await jtRequest<JtApiResponse<Record<string, unknown>>>(
    path,
    { customerCode: cfg.customerCode, digest: cfg.bodyDigest, billCode, printSize },
    cfg,
  );

  if (!result.ok || !result.data) return null;
  if (result.data.code !== "1" || !result.data.data) return null;

  const data = result.data.data;
  const pdfBase64 = String(data.base64EncodeContent ?? "");
  if (!pdfBase64) return null;

  return {
    billCode: String(data.billCode ?? billCode),
    pdfBase64,
    raw: result.data,
  };
}

/**
 * Cancelamento de pedido sem movimentação.
 * bizContent: customerCode, orderType, txlogisticId, reason.
 */
export async function cancelJtOrder(
  txlogisticId: string,
  reason: string,
  orderType = process.env.JT_ORDER_TYPE || "2",
): Promise<{ txlogisticId: string; billCode?: string } | null> {
  const cfg = getConfig();
  if (!cfg) return null;

  const path = process.env.JT_CANCEL_PATH || JT_CANCEL_PATH_DEFAULT;
  const result = await jtRequest<JtApiResponse<Record<string, unknown>>>(
    path,
    { customerCode: cfg.customerCode, digest: cfg.bodyDigest, orderType, txlogisticId, reason },
    cfg,
  );

  if (!result.ok || !result.data || result.data.code !== "1") return null;

  return {
    txlogisticId: String(result.data.data?.txlogisticId ?? txlogisticId),
    billCode: result.data.data?.billCode ? String(result.data.data.billCode) : undefined,
  };
}

export async function trackJtShipment(trackingCode: string): Promise<Array<{ status: string; at: string }>> {
  const cfg = getConfig();
  const path = process.env.JT_TRACK_PATH || JT_TRACK_PATH_DEFAULT;
  if (!cfg) return [];

  const result = await jtRequest<JtApiResponse<Array<Record<string, unknown>>>>(
    path,
    {
      command: 0, // 0 = billCodes, 1 = invoiceAccessKey, 2 = customerOrderNumber
      billCodes: trackingCode,
      customerCode: cfg.customerCode,
      digest: cfg.bodyDigest,
      invoiceAccessKey: "",
      customerOrderNumber: "",
    },
    cfg,
  );
  if (!result.ok || !result.data) return [];

  const [shipment] = result.data.data ?? [];
  const details = (shipment?.details ?? []) as Array<Record<string, unknown>>;
  if (!Array.isArray(details)) return [];

  return details.map((d) => ({
    status: String(d.scanType ?? d.desc ?? ""),
    at: String(d.scanTime ?? d.time ?? d.at ?? ""),
  }));
}
