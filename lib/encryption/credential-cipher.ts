import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const key = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY no está configurada en este entorno.",
    );
  }
  const buffer = Buffer.from(key, "base64");
  if (buffer.length !== 32) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY debe decodificar a una clave de 32 bytes en base64.",
    );
  }
  return buffer;
}

/** Cifra un secreto (p. ej. una API key de proveedor) con AES-256-GCM. Uso exclusivo de servidor. */
export function encryptCredential(plainText: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

/** Descifra un valor generado por encryptCredential. Uso exclusivo de servidor. */
export function decryptCredential(encoded: string): string {
  const key = getKey();
  const [ivB64, authTagB64, dataB64] = encoded.split(".");
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error("Formato de credencial cifrada inválido.");
  }

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}
