import crypto from "crypto";

const algorithm = "aes-256-cbc";
const rawKey = process.env.CRYPTO_KEY;

if (!rawKey) {
  throw new Error("❌ CRYPTO_KEY não está definida no ambiente.");
}

const key = Buffer.from(rawKey, "hex"); // Deve ter 64 chars hex => 32 bytes

// 🔐 Criptografa texto simples para AES (retorna: iv:encrypted)
export function encrypt(plainText: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

// 🔓 Descriptografa AES (retorna string original ou null)
export function decrypt(encryptedData: string | null | undefined): string | null {
  if (!encryptedData) return null;

  try {
    const [ivHex, encryptedHex] = encryptedData.split(":");

    // Verificação de integridade mínima
    if (!ivHex || !encryptedHex) {
      throw new Error("Formato inválido: esperado 'iv:encrypted'");
    }

    const iv = Buffer.from(ivHex, "hex");
    const encryptedText = Buffer.from(encryptedHex, "hex");

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);

    return decrypted.toString("utf8");
  } catch (err) {
    console.error("Erro ao descriptografar senha_sistema:", err);
    return null;
  }
}
