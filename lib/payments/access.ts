const STORAGE_KEY = "kentekenrapport_paid_plates";

function normalizePlate(plate: string): string {
  return plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function readPaidPlateSet(): Set<string> {
  if (typeof window === "undefined") return new Set<string>();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return new Set<string>();
  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed.map(normalizePlate));
  } catch {
    return new Set<string>();
  }
}

function writePaidPlateSet(set: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
}

export function hasPaidAccessForPlate(plate: string): boolean {
  return readPaidPlateSet().has(normalizePlate(plate));
}

export function grantPaidAccessForPlate(plate: string) {
  const set = readPaidPlateSet();
  set.add(normalizePlate(plate));
  writePaidPlateSet(set);
}

export async function hasServerPaidAccessForPlate(plate: string): Promise<boolean> {
  const normalized = normalizePlate(plate);
  if (!normalized) return false;
  const response = await fetch(`/api/payments/access/${normalized}`, { cache: "no-store" });
  if (!response.ok) return false;
  const payload = (await response.json()) as { paid?: boolean };
  return Boolean(payload.paid);
}
