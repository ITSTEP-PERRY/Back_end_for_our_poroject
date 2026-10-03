export type PendingRegistration = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  registrationToken?: string;
};

/** In-memory only — do not put password into navigation params. */
let pending: PendingRegistration | null = null;

export function savePendingRegistration(data: PendingRegistration) {
  pending = data;
}

export function loadPendingRegistration(): PendingRegistration | null {
  return pending;
}

export function updatePendingRegistration(patch: Partial<PendingRegistration>) {
  if (!pending) return;
  pending = { ...pending, ...patch };
}

export function clearPendingRegistration() {
  pending = null;
}
