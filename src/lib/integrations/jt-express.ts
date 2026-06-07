/**
 * Cliente J&T Express (frete).
 * Configure JT_CUSTOMER_CODE, JT_API_ACCOUNT e JT_PRIVATE_KEY no .env.local.
 *
 * Endpoints reais dependem do contrato com a J&T — esta camada centraliza
 * cotação e geração de etiqueta para evoluir sem mudar o resto da loja.
 */

export type FreightQuoteInput = {
  zipCode: string;
  weightGrams: number;
  widthCm?: number;
  heightCm?: number;
  lengthCm?: number;
};

export type FreightQuoteResult = {
  carrier: "JT_EXPRESS";
  service: string;
  cost: number;
  estimatedDays: number;
  raw?: unknown;
};

export async function quoteJtExpress(input: FreightQuoteInput): Promise<FreightQuoteResult | null> {
  const apiUrl = process.env.JT_API_URL;
  const customerCode = process.env.JT_CUSTOMER_CODE;
  const apiAccount = process.env.JT_API_ACCOUNT;
  const privateKey = process.env.JT_PRIVATE_KEY;

  if (!apiUrl || !customerCode || !apiAccount || !privateKey) {
    // Sem credenciais: retorna null (loja pode exibir "frete a combinar")
    return null;
  }

  // TODO: implementar assinatura e payload conforme documentação J&T do seu contrato.
  // Placeholder estruturado para não quebrar o checkout quando credenciais forem preenchidas.
  void input;
  return {
    carrier: "JT_EXPRESS",
    service: "J&T Express Padrão",
    cost: 0,
    estimatedDays: 5,
  };
}

export async function createJtShipment(_orderId: string): Promise<{ trackingCode: string; labelUrl?: string } | null> {
  // TODO: expedir pedido e gerar etiqueta via API J&T
  return null;
}

export async function trackJtShipment(_trackingCode: string): Promise<Array<{ status: string; at: string }>> {
  // TODO: consultar rastreio
  return [];
}
