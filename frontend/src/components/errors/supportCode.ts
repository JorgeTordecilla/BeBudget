export function toSupportCode(requestId: string): string {
  const trimmed = requestId.trim();
  if (!trimmed) {
    return "";
  }

  const compact = trimmed.replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (compact.length >= 8) {
    return compact.slice(0, 8);
  }
  return trimmed.toUpperCase();
}
