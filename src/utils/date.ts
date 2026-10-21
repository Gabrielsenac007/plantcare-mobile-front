export function todayISO(date = new Date()): string {
  // Componentes locais: UTC pode enviar amanhã à noite no Brasil.
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function formatShort(iso: string | null): string {
  if (!iso) return "—";
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
export function localDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function reminderDate(
  iso: string,
  hour: number,
  minute: number,
  now = new Date(),
): Date {
  const date = localDate(iso);
  date.setHours(hour, minute, 0, 0);
  if (date <= now) {
    date.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    date.setHours(hour, minute, 0, 0);
    if (date <= now) date.setDate(date.getDate() + 1);
  }
  return date;
}
