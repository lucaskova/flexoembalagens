import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  findBlingNfeForStoreOrder,
  getBlingAccessToken,
  type BlingNfeDetails,
} from "@/lib/integrations/bling";
import {
  createJtShipment,
  getJtLabel,
  type CreateShipmentInput,
  type JtParty,
} from "@/lib/integrations/jt-express";

const DEFAULT_ITEM_WEIGHT_GRAMS = 500;

function envParty(prefix: string): JtParty | null {
  const name = process.env[`${prefix}_NAME`];
  const postCode = (process.env[`${prefix}_POST_CODE`] || "").replace(/\D/g, "");
  const taxNumber = (process.env[`${prefix}_TAX_NUMBER`] || "").replace(/\D/g, "");
  const prov = process.env[`${prefix}_PROV`];
  const city = process.env[`${prefix}_CITY`];
  const street = process.env[`${prefix}_STREET`];

  if (!name || postCode.length !== 8 || !taxNumber || !prov || !city || !street) return null;

  return {
    name,
    company: process.env[`${prefix}_COMPANY`] || name,
    postCode,
    mailBox: process.env[`${prefix}_EMAIL`],
    taxNumber,
    mobile: process.env[`${prefix}_MOBILE`],
    phone: process.env[`${prefix}_PHONE`],
    prov,
    city,
    street,
    streetNumber: process.env[`${prefix}_STREET_NUMBER`] || "SN",
    address: process.env[`${prefix}_ADDRESS`] || "SEM COMPLEMENTO",
    areaCode: process.env[`${prefix}_AREA_CODE`],
    ieNumber: process.env[`${prefix}_IE_NUMBER`],
    area: process.env[`${prefix}_AREA`],
  };
}

function partyFromCustomer(customer: {
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
}): JtParty | null {
  const postCode = (customer.zipCode || "").replace(/\D/g, "");
  if (postCode.length !== 8 || !customer.street || !customer.city || !customer.state) return null;

  return {
    name: customer.name,
    postCode,
    mailBox: customer.email,
    taxNumber: (customer.document || "").replace(/\D/g, "") || "00000000000",
    mobile: customer.phone || undefined,
    phone: customer.phone || undefined,
    prov: customer.state,
    city: customer.city,
    street: customer.street,
    streetNumber: customer.number || "SN",
    address: customer.complement || "SEM COMPLEMENTO",
    ieNumber: "ISENTO",
    area: customer.district || undefined,
  };
}

function partyFromNfe(nfe: BlingNfeDetails): JtParty | null {
  const c = nfe.contato;
  const e = c?.endereco;
  if (!c?.nome || !e?.cep || !e.logradouro || !e.municipio || !e.uf) return null;

  return {
    name: c.nome,
    postCode: e.cep.replace(/\D/g, ""),
    mailBox: c.email,
    taxNumber: (c.numeroDocumento || "").replace(/\D/g, "") || "00000000000",
    mobile: c.telefone,
    phone: c.telefone,
    prov: e.uf,
    city: e.municipio,
    street: e.logradouro,
    streetNumber: e.numero || "SN",
    address: e.complemento || "SEM COMPLEMENTO",
    ieNumber: "ISENTO",
    area: e.bairro,
  };
}

function formatNfeDate(raw?: string): string {
  if (!raw) return new Date().toISOString().slice(0, 19).replace("T", " ");
  if (raw.includes(" ")) return raw.slice(0, 19);
  return `${raw} 12:00:00`;
}

export type ShipJtResult =
  | { ok: true; billCode: string; labelUrl: string }
  | { ok: false; error: string };

export async function shipOrderWithJt(orderId: string): Promise<ShipJtResult> {
  const sender = envParty("JT_SENDER");
  if (!sender) {
    return {
      ok: false,
      error: "Configure os dados do remetente (JT_SENDER_*) nas variáveis de ambiente.",
    };
  }

  const blingToken = await getBlingAccessToken();
  if (!blingToken) {
    return { ok: false, error: "Bling não conectado. Conecte no painel admin primeiro." };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      shipment: true,
      items: { include: { product: { select: { weightGrams: true } } } },
    },
  });

  if (!order) return { ok: false, error: "Pedido não encontrado." };
  if (order.shipment?.trackingCode) {
    return { ok: false, error: `Pedido já possui rastreio J&T: ${order.shipment.trackingCode}` };
  }

  const nfe = await findBlingNfeForStoreOrder(blingToken, {
    blingOrderId: order.blingId,
    storeOrderNumber: order.number,
    since: order.createdAt,
  });

  if (!nfe?.chaveAcesso || !nfe.numero || !nfe.serie) {
    return {
      ok: false,
      error:
        "NF-e não encontrada no Bling para este pedido. Emita/autorize a nota no Bling e vincule o número do pedido da loja.",
    };
  }

  const receiver =
    partyFromNfe(nfe) ??
    (order.customer ? partyFromCustomer(order.customer) : null) ??
    (order.shipment
      ? ({
          name: order.customer?.name || "Destinatário",
          postCode: (order.shipment.zipCode || "").replace(/\D/g, ""),
          taxNumber: (order.customer?.document || "").replace(/\D/g, "") || "00000000000",
          prov: order.shipment.state || "",
          city: order.shipment.city || "",
          street: order.shipment.street || "",
          streetNumber: order.shipment.number || "SN",
          address: order.shipment.complement || "SEM COMPLEMENTO",
          ieNumber: "ISENTO",
          area: order.shipment.district || undefined,
        } satisfies JtParty)
      : null);

  if (!receiver || receiver.postCode.length !== 8) {
    return { ok: false, error: "Endereço do destinatário incompleto." };
  }

  let weightGrams = 0;
  for (const item of order.items) {
    const w = item.product?.weightGrams ?? DEFAULT_ITEM_WEIGHT_GRAMS;
    weightGrams += w * item.quantity;
  }
  weightGrams = Math.max(weightGrams, 300);

  const input: CreateShipmentInput = {
    txlogisticId: order.number,
    sender,
    receiver,
    translate: sender,
    weightKg: weightGrams / 1000,
    totalQuantity: 1,
    items: order.items.map((it) => ({
      itemName: it.name,
      number: it.quantity,
      desc: it.name,
    })),
    invoiceNumber: String(nfe.numero),
    invoiceSerialNumber: String(nfe.serie),
    invoiceMoney: String(nfe.valorNota ?? order.total).replace(",", "."),
    invoiceAccessKey: nfe.chaveAcesso,
    invoiceIssueDate: formatNfeDate(nfe.dataEmissao),
    invoiceType: "NF-e",
    taxCode: order.number,
  };

  const created = await createJtShipment(input);
  if (!created) {
    return { ok: false, error: "Falha ao criar envio na J&T. Verifique credenciais e homologação." };
  }

  const label = await getJtLabel(created.billCode);
  let labelUrl: string | null = null;

  if (label?.pdfBase64) {
    const dir = path.join(process.cwd(), "public", "shipping-labels");
    await fs.mkdir(dir, { recursive: true });
    const fileName = `${order.number}.pdf`;
    await fs.writeFile(path.join(dir, fileName), Buffer.from(label.pdfBase64, "base64"));
    labelUrl = `/shipping-labels/${fileName}`;
  }

  await prisma.shipment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      carrier: "JT_EXPRESS",
      trackingCode: created.billCode,
      labelUrl,
      zipCode: receiver.postCode,
      street: receiver.street,
      number: receiver.streetNumber,
      complement: receiver.address,
      district: receiver.area,
      city: receiver.city,
      state: receiver.prov,
      cost: order.shippingCost,
      shippedAt: new Date(),
    },
    update: {
      trackingCode: created.billCode,
      labelUrl,
      shippedAt: new Date(),
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "SHIPPED" },
  });

  return {
    ok: true,
    billCode: created.billCode,
    labelUrl: labelUrl ?? "",
  };
}
