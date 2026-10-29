import "server-only";

/** Company-approved public contact details. Never derive a URL from the display name. */
export const companyContact = {
  email: "1847820623@qq.com",
  whatsappName: "@Lintao Hengdeyuan",
} as const;

/** Accept only an explicitly configured, official WhatsApp address; fail closed. */
export function parseVerifiedWhatsAppUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 256 || /\s/.test(value)) return null;

  const allowedAddress = /^https:\/\/wa\.me\/(?:message\/[A-Za-z0-9]{6,64}|[1-9]\d{7,14})$/.test(value)
    || /^https:\/\/api\.whatsapp\.com\/send\?phone=[1-9]\d{7,14}$/.test(value);
  if (!allowedAddress) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) return null;
    if (url.hostname !== "wa.me" && url.hostname !== "api.whatsapp.com") return null;
    return url.href === value ? value : null;
  } catch {
    return null;
  }
}

/** Leave unset until the company verifies its official direct link. */
export function getVerifiedWhatsAppUrl(): string | null {
  return parseVerifiedWhatsAppUrl(process.env.COMPANY_VERIFIED_WHATSAPP_URL);
}
