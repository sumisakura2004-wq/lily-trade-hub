/**
 * Compatibility guard for former callers. Company policy is inquiry-only.
 * Never inspect a quotation or the clock: no mode, approval or future date can
 * re-enable public prices. The public DTO and query do not contain quotations.
 */
export function getPublicFobQuote(value?: unknown, now?: Date): null {
  void value;
  void now;
  return null;
}

/** Legacy validation helper; it can no longer approve public pricing. */
export function validatePublicFobQuote(value: unknown, now?: Date): true | string {
  void now;
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    (value as Record<string, unknown>).mode === "inquiry"
    ? true
    : "公司现行政策为统一询价，不公开报价。/ Company policy requires inquiry-only pricing; quotations are not public.";
}
