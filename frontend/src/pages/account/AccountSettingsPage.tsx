import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthContext";
import { authApi } from "../../api";
import { AuthField } from "../../widgets/auth/AuthModal";
import { PasswordField } from "../../widgets/auth/PasswordField";

type EditKind = "name" | "email" | "password" | "photo" | "logout" | "delete" | null;

const STRONG_PASSWORD_MSG =
  "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and be at least 8 characters long";

function isStrongPassword(value: string) {
  return /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && value.length >= 8;
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export function AccountSettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [edit, setEdit] = useState<EditKind>(null);
  const [busy, setBusy] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const close = () => {
    setEdit(null);
    setPhotoError(null);
  };

  const onPickPhoto = () => fileRef.current?.click();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Maximum file size: 5 MB");
      setEdit("photo");
      return;
    }
    if (!/^image\/(jpeg|png)$/i.test(file.type)) {
      setPhotoError("Acceptable formats: JPEG, PNG");
      setEdit("photo");
      return;
    }
    setBusy(true);
    setPhotoError(null);
    try {
      const dataUrl = await readAsDataUrl(file);
      await authApi.updateMe({ avatar: dataUrl });
      await refreshUser();
      close();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Failed to upload photo");
      setEdit("photo");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="account-panel">
      <h1 className="account-panel__title account-panel__title--rule">Account settings</h1>

      <div className="settings-list">
        <SettingsRow
          title="Profile photo"
          description="Change your profile picture."
          action={
            <div className="settings-row__actions">
              <button type="button" className="btn btn-outline" onClick={onPickPhoto} disabled={busy}>
                Change photo
              </button>
              <span
                className="settings-tip"
                onMouseEnter={() => setShowTips(true)}
                onMouseLeave={() => setShowTips(false)}
              >
                <button type="button" className="settings-tip__btn" aria-label="Image requirements">
                  i
                </button>
                {showTips && (
                  <div className="settings-tip__bubble" role="tooltip">
                    Please note that the uploaded image must meet the following requirements: Maximum
                    file size: 5 MB; Acceptable formats: JPEG, PNG. Images exceeding this size or in
                    other formats will not be accepted. Please ensure your files are optimized and
                    comply with the specified parameters.
                  </div>
                )}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png"
                hidden
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
            </div>
          }
        />

        <SettingsRow
          title="First name and last name"
          description="Update your first and last name for your profile where it's displayed."
          value={user.name}
          action={
            <button type="button" className="btn btn-outline" onClick={() => setEdit("name")}>
              Change name
            </button>
          }
        />

        <SettingsRow
          title="Email"
          description="Update the email address associated with your account."
          value={user.email}
          action={
            <button type="button" className="btn btn-outline" onClick={() => setEdit("email")}>
              Change email
            </button>
          }
        />

        <SettingsRow
          title="Password"
          description="Change your account's password."
          value={"****************"}
          action={
            <button type="button" className="btn btn-outline" onClick={() => setEdit("password")}>
              Change password
            </button>
          }
        />

        <SettingsRow
          title="Log out"
          description="Ends current session, disconnecting user from account or system."
          action={
            <button type="button" className="btn btn-outline" onClick={() => setEdit("logout")}>
              Log out
            </button>
          }
        />

        <SettingsRow
          title="Delete account"
          description="Permanently remove your account and associated data, disabling access and erasing personal information."
          action={
            <button type="button" className="btn btn-danger-outline" onClick={() => setEdit("delete")}>
              Delete
            </button>
          }
        />
      </div>

      {edit === "name" && (
        <ChangeNameModal
          initial={user.name}
          busy={busy}
          setBusy={setBusy}
          onClose={close}
          onSaved={async () => {
            await refreshUser();
            close();
          }}
        />
      )}

      {edit === "password" && (
        <ChangePasswordModal busy={busy} setBusy={setBusy} onClose={close} onSaved={close} />
      )}

      {edit === "email" && (
        <ChangeEmailModal
          currentEmail={user.email}
          busy={busy}
          setBusy={setBusy}
          onClose={close}
          onSaved={async () => {
            await refreshUser();
            close();
          }}
        />
      )}

      {edit === "logout" && (
        <SettingsModal title="Log out?" onClose={close} wide={false}>
          <p className="settings-modal__lead">You will log out of your account on this device.</p>
          <div className="confirm-modal__actions">
            <button type="button" className="btn btn-outline" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Log out
            </button>
          </div>
        </SettingsModal>
      )}

      {edit === "delete" && (
        <DeleteAccountModal
          busy={busy}
          setBusy={setBusy}
          onClose={close}
          onDeleted={() => {
            logout();
            navigate("/");
          }}
        />
      )}

      {edit === "photo" && photoError && (
        <SettingsModal title="Change photo" onClose={close} wide={false}>
          <p className="settings-field-error">{photoError}</p>
          <div className="confirm-modal__actions">
            <button type="button" className="btn btn-outline" onClick={close}>
              Close
            </button>
          </div>
        </SettingsModal>
      )}
    </section>
  );
}

function ChangeNameModal({
  initial,
  busy,
  setBusy,
  onClose,
  onSaved,
}: {
  initial: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const parts = splitName(initial);
  const [first, setFirst] = useState(parts.first);
  const [last, setLast] = useState(parts.last);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const name = `${first.trim()} ${last.trim()}`.trim();
    if (!first.trim()) {
      setError("First name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await authApi.updateMe({ name });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsModal title="Change name" onClose={onClose}>
      <form className="settings-modal__form" onSubmit={(e) => void onSubmit(e)}>
        <AuthField label="First name" error={error && !first.trim() ? error : null}>
          <input
            className="perry-field__input"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            placeholder="Enter new first name"
            maxLength={80}
            autoComplete="given-name"
          />
        </AuthField>
        <AuthField label="Last name">
          <input
            className="perry-field__input"
            value={last}
            onChange={(e) => setLast(e.target.value)}
            placeholder="Enter new last name"
            maxLength={80}
            autoComplete="family-name"
          />
        </AuthField>
        {error && first.trim() && <p className="settings-field-error">{error}</p>}
        <div className="confirm-modal__actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-accent" disabled={busy}>
            Confirm
          </button>
        </div>
      </form>
    </SettingsModal>
  );
}

function ChangePasswordModal({
  busy,
  setBusy,
  onClose,
  onSaved,
}: {
  busy: boolean;
  setBusy: (v: boolean) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const currentError =
    touched && !current ? "This field is necessary to continue!" : null;
  const nextError =
    touched && next && !isStrongPassword(next) ? STRONG_PASSWORD_MSG : touched && !next ? STRONG_PASSWORD_MSG : null;
  const repeatError = touched && repeat !== next ? "Passwords don't match" : null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    if (!current || !isStrongPassword(next) || next !== repeat) return;

    setBusy(true);
    try {
      await authApi.changePassword(current, next);
      onSaved();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsModal title="" onClose={onClose} hideTitle>
      <form className="settings-modal__form settings-modal__form--password" onSubmit={(e) => void onSubmit(e)}>
        <section className="settings-modal__section">
          <h2>Enter password</h2>
          <p className="settings-modal__lead">
            Firstly, enter your current password to confirm this is you.
          </p>
          <PasswordField
            label="Password"
            value={current}
            onChange={setCurrent}
            placeholder="Enter your password"
            autoComplete="current-password"
            error={currentError}
          />
        </section>

        <section className="settings-modal__section">
          <h2>Change password</h2>
          <p className="settings-modal__lead">Enter new password for your account.</p>
          <PasswordField
            label="New password"
            value={next}
            onChange={setNext}
            placeholder="Enter new password"
            autoComplete="new-password"
            error={nextError}
          />
          <PasswordField
            label="Repeat password"
            value={repeat}
            onChange={setRepeat}
            placeholder="Repeat new password"
            autoComplete="new-password"
            error={repeatError}
          />
        </section>

        {serverError && <p className="settings-field-error">{serverError}</p>}

        <div className="confirm-modal__actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-accent" disabled={busy}>
            Confirm
          </button>
        </div>
      </form>
    </SettingsModal>
  );
}

function ChangeEmailModal({
  currentEmail,
  busy,
  setBusy,
  onClose,
  onSaved,
}: {
  currentEmail: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [seconds]);

  const applyCode = (raw: string) => {
    const cleaned = raw.replace(/\D/g, "").slice(0, 6);
    if (!cleaned) return;
    const next = ["", "", "", "", "", ""];
    cleaned.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    refs.current[Math.min(cleaned.length, 5)]?.focus();
  };

  const sendCode = async () => {
    setPasswordError(null);
    setEmailError(null);
    setCodeError(null);
    if (!password.trim()) {
      setPasswordError("This field is required to be filled first");
      return;
    }
    if (!newEmail.trim()) {
      setEmailError("New email is required.");
      return;
    }
    setBusy(true);
    try {
      const res = await authApi.sendEmailChangeCode(newEmail.trim(), password);
      setSeconds(60);
      setDevCode(res.code ?? null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send code";
      if (/password/i.test(msg)) setPasswordError(msg);
      else setEmailError(msg);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setCodeError(null);
    setEmailError(null);

    if (!password.trim()) {
      setPasswordError("This field is required to be filled first");
      return;
    }
    if (!newEmail.trim()) {
      setEmailError("New email is required.");
      return;
    }
    const code = digits.join("");
    if (code.length < 6) {
      setCodeError("Incorrect code, try again");
      return;
    }

    setBusy(true);
    try {
      await authApi.changeEmail(newEmail.trim(), password, code);
      await onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to change email";
      if (/code/i.test(msg)) setCodeError(msg);
      else if (/password/i.test(msg)) setPasswordError(msg);
      else setEmailError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsModal title="Change email" onClose={onClose}>
      <form className="settings-modal__form" onSubmit={(e) => void onSubmit(e)}>
        <p className="settings-modal__lead">
          Your current email is <strong>{currentEmail}</strong>. To change it, enter a new email,
          then click &apos;Send code&apos; and enter it in corresponding prompt.
        </p>

        <AuthField label="New email" error={emailError}>
          <input
            className="perry-field__input"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email"
            autoComplete="email"
          />
        </AuthField>

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          error={passwordError}
        />

        <div className={`code-inputs ${codeError ? "code-inputs--error" : ""}`} data-code-inputs>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="code-input"
              value={d}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(-1);
                if (e.target.value.length > 1) {
                  applyCode(e.target.value);
                  return;
                }
                const next = [...digits];
                next[i] = v;
                setDigits(next);
                setCodeError(null);
                if (v && i < 5) refs.current[i + 1]?.focus();
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
              }}
              onPaste={(e: ClipboardEvent<HTMLInputElement>) => {
                e.preventDefault();
                applyCode(e.clipboardData.getData("text"));
              }}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>
        {codeError && <p className="code-error">{codeError}</p>}

        <div className="settings-modal__code-actions">
          {seconds > 0 ? (
            <span className="settings-modal__resend">
              Resend code {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </span>
          ) : (
            <button type="button" className="settings-modal__send-code" onClick={() => void sendCode()} disabled={busy}>
              Send code
            </button>
          )}
        </div>

        {devCode && <p className="dev-code-hint">Dev code: {devCode}</p>}

        <div className="confirm-modal__actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-accent" disabled={busy}>
            Confirm
          </button>
        </div>
      </form>
    </SettingsModal>
  );
}

function DeleteAccountModal({
  busy,
  setBusy,
  onClose,
  onDeleted,
}: {
  busy: boolean;
  setBusy: (v: boolean) => void;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await authApi.deleteMe();
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setBusy(false);
    }
  };

  return (
    <SettingsModal title="Delete account?" onClose={onClose} wide={false}>
      <p className="settings-modal__lead">
        This action will permanently remove your profile and correlated data. Once clicked, all
        associated information, including orders, wishlisted items, and settings, is irreversibly
        erased from the system. Do you wish to proceed?
      </p>
      {error && <p className="settings-field-error">{error}</p>}
      <div className="confirm-modal__actions">
        <button type="button" className="btn btn-accent" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger-outline" onClick={() => void onDelete()} disabled={busy}>
          Delete account
        </button>
      </div>
    </SettingsModal>
  );
}

function SettingsRow({
  title,
  description,
  value,
  action,
}: {
  title: string;
  description: string;
  value?: string;
  action: ReactNode;
}) {
  return (
    <div className="settings-row">
      <div className="settings-row__text">
        <h2>{title}</h2>
        <p>{description}</p>
        {value != null && <div className="settings-row__value">{value}</div>}
      </div>
      {action}
    </div>
  );
}

function SettingsModal({
  title,
  onClose,
  children,
  wide = true,
  hideTitle = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  hideTitle?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="acc-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`acc-modal settings-modal${wide ? "" : " settings-modal--narrow"}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {!hideTitle && title && <h2 className="settings-modal__title">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
