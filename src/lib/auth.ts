import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const scryptAsync = promisify(scrypt);

const SESSION_COOKIE = "lambari_session";
const SESSION_DURATION_DAYS = 30;

export type SessionCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  type: string;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
};

// ----- Senha (scrypt nativo, sem dependências externas) -----

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, "hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  if (keyBuffer.length !== derived.length) return false;
  return timingSafeEqual(keyBuffer, derived);
}

// ----- Sessão -----

function expiryDate(): Date {
  return new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

export async function createSession(customerId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = expiryDate();

  await prisma.session.create({
    data: { token, customerId, expiresAt },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentCustomer(): Promise<SessionCustomer | null> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { token },
      include: { customer: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    const c = session.customer;
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      document: c.document,
      type: c.type,
      zipCode: c.zipCode,
      street: c.street,
      number: c.number,
      complement: c.complement,
      district: c.district,
      city: c.city,
      state: c.state,
    };
  } catch {
    return null;
  }
}
