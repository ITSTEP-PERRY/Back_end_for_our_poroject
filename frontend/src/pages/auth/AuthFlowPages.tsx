import { type ClipboardEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../../api";
import {
  clearPendingRegistration,
  loadPendingRegistration,
  updatePendingRegistration,
} from "../../api/pendingRegistration";
import { useAuth } from "../../app/AuthContext";
import { AuthField, AuthModal } from "../../widgets/auth/AuthModal";
import { PasswordField } from "../../widgets/auth/PasswordField";

export function VerifyCodePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get("email") || loadPendingRegistration()?.email || "";
  const context = params.get("context") || "forgot";
  const isRegister = context === "register";
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(60);
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
    const focusAt = Math.min(cleaned.length, 5);
    refs.current[focusAt]?.focus();
  };

  const onDigit = (i: number, value: string) => {
    if (value.length > 1) {
      applyCode(value);
      return;
    }
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError(null);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    applyCode(e.clipboardData.getData("text"));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) {
      setError("Incorrect code, try again");
      return;
    }
    if (!email) {
      setError("Email is missing — start registration again");
      return;
    }
    setError(null);
    if (!isRegister) {
      navigate("/auth/success?kind=verify");
      return;
    }
    setBusy(true);
    try {
      const res = await authApi.verifyEmail(email, code);
      if (!res.registrationToken) {
        throw new Error("No registration token from Auth — try again");
      }
      updatePendingRegistration({ registrationToken: res.registrationToken });
      navigate("/finishing-touches");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    if (seconds > 0 || !email) return;
    setError(null);
    try {
      if (isRegister) {
        await authApi.resendVerificationCode(email);
      } else {
        await authApi.forgot(email);
      }
      setSeconds(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
    }
  };

  return (
    <AuthModal data-figma="1393:2003">
      <form className="login-form" onSubmit={(e) => void onSubmit(e)} data-verify-form>
        <div className="login-form__titles">
          <h1>Send code</h1>
          <h2>Enter the code to confirm your email</h2>
        </div>
        <div className="login-form__fields">
          <div className={`code-inputs ${error ? "code-inputs--error" : ""}`} data-code-inputs>
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
                autoComplete={i === 0 ? "one-time-code" : "off"}
                value={d}
                onChange={(e) => onDigit(i, e.target.value)}
                onPaste={onPaste}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
                }}
              />
            ))}
          </div>
          {error && <p className="code-error">{error}</p>}
        </div>
        <button type="submit" className="perry-btn" disabled={busy}>
          {busy ? "…" : "Continue"}
        </button>
      </form>
      <div className="resend-wrap">
        <button
          type="button"
          className="resend-link"
          disabled={seconds > 0}
          onClick={() => void onResend()}
        >
          Resend code
        </button>
        {seconds > 0 && (
          <span className="resend-timer">
            Resend code {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </span>
        )}
      </div>
      {email && (
        <p className="dev-code-hint">
          Code sent to {email}
          {isRegister ? " — check inbox / spam" : ""}
        </p>
      )}
    </AuthModal>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    let ok = true;
    if (!password) {
      setPwdError("This field is necessary to continue!");
      ok = false;
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setPwdError(
        "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and be at least 8 characters long",
      );
      ok = false;
    } else {
      setPwdError(null);
    }
    if (!confirm) {
      setConfirmError("This field is necessary to continue!");
      ok = false;
    } else if (password !== confirm) {
      setConfirmError("Passwords must match");
      ok = false;
    } else {
      setConfirmError(null);
    }
    if (!ok) return;
    navigate("/auth/success?kind=reset");
  };

  return (
    <AuthModal data-figma="4251:8816">
      <form className="login-form" onSubmit={onSubmit} data-reset-form>
        <div className="login-form__titles">
          <h1>Reset password</h1>
          <h2>Set a new password for your account</h2>
        </div>
        <div className="login-form__fields">
          <PasswordField
            label="New password"
            value={password}
            onChange={setPassword}
            placeholder="Enter new password"
            autoComplete="new-password"
            error={pwdError}
          />
          <PasswordField
            label="Repeat password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Repeat new password"
            autoComplete="new-password"
            error={confirmError}
          />
        </div>
        <button type="submit" className="perry-btn">
          Continue
        </button>
      </form>
    </AuthModal>
  );
}

export function FinishingTouchesPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [firstError, setFirstError] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const fErr = !first.trim() ? "First name is required" : null;
    const lErr = !last.trim() ? "Last name is required" : null;
    setFirstError(fErr);
    setLastError(lErr);
    if (fErr || lErr) return;

    const pending = loadPendingRegistration();
    if (!pending?.registrationToken) {
      setError("Registration session expired — start again from Create account");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await authApi.completeRegistration({
        registrationToken: pending.registrationToken,
        firstName: first.trim(),
        lastName: last.trim(),
      });
      await login(pending.email, pending.password);
      clearPendingRegistration();
      navigate("/auth/success?kind=register");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finish registration");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthModal data-figma="4251:33099">
      {error && <div className="auth-alert">{error}</div>}
      <form className="login-form" onSubmit={(e) => void onSubmit(e)} data-finishing-form>
        <div className="login-form__titles">
          <h1>Finishing touches</h1>
          <h2>Enter your first and last name</h2>
        </div>
        <div className="login-form__fields">
          <AuthField label="First name" error={firstError}>
            <input
              className="perry-field__input"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              placeholder="Enter your first name"
              autoComplete="given-name"
            />
          </AuthField>
          <AuthField label="Last name" error={lastError}>
            <input
              className="perry-field__input"
              value={last}
              onChange={(e) => setLast(e.target.value)}
              placeholder="Enter your last name"
              autoComplete="family-name"
            />
          </AuthField>
        </div>
        <button type="submit" className="perry-btn" disabled={busy}>
          {busy ? "…" : "Create account"}
        </button>
      </form>
    </AuthModal>
  );
}

export function AuthSuccessPage() {
  const [params] = useSearchParams();
  const kind = params.get("kind") || "register";
  const copy =
    kind === "reset"
      ? {
          title: "Congratulations!",
          subtitle: "Your password has been changed",
          cta: "Log in",
          to: "/login",
        }
      : kind === "verify"
        ? {
            title: "Congratulations!",
            subtitle: "Email confirmed",
            cta: "Let's start shopping",
            to: "/",
          }
        : {
            title: "Congratulations!",
            subtitle: "The registration was completed",
            cta: "Let's start shopping",
            to: "/",
          };

  return (
    <AuthModal>
      <div className="login-form login-form--success">
        <div className="login-form__titles">
          <h1>{copy.title}</h1>
          <h2>{copy.subtitle}</h2>
        </div>
        <Link className="perry-btn" to={copy.to}>
          {copy.cta}
        </Link>
      </div>
    </AuthModal>
  );
}
