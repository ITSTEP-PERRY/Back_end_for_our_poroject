const KEY = "perry_pending_registration";

export type PendingRegistration = {
  email: string;
  password: string;
  registrationToken?: string;
};

export function savePendingRegistration(data: PendingRegistration) {
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

export function loadPendingRegistration(): PendingRegistration | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingRegistration;
    if (!parsed?.email || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function updatePendingRegistration(patch: Partial<PendingRegistration>) {
  const current = loadPendingRegistration();
  if (!current) return;
  savePendingRegistration({ ...current, ...patch });
}

export function clearPendingRegistration() {
  sessionStorage.removeItem(KEY);
}
