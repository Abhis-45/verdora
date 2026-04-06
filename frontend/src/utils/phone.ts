export function normalizeMobile(input: string): string {
  if (!input) return input;
  // remove non-digit characters
  const digits = input.replace(/\D/g, "");
  // if already has country code (e.g., starts with 91 and length >10), keep + prefix
  if (digits.length === 10) {
    return "+91" + digits;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return "+91" + digits.slice(1);
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return "+" + digits;
  }
  // fallback: return with + prefix
  return "+" + digits;
}

export function ensurePlus91(input: string): string {
  return normalizeMobile(input);
}
