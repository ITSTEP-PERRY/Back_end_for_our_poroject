import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../api";
import { AuthField, AuthModal } from "../../widgets/auth/AuthModal";

const SUCCESS_MSG =
  "If an account exists for this email, we sent password reset instructions.";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setBusy(true);
    try {
      await authApi.forgot(email);
      // Always the same client message — do not reveal whether the email exists.
      setMsg(SUCCESS_MSG);
    } catch (err) {
      // Network/validation only; never treat as "user not found".
      setError(err instanceof Error ? err.message : "Request failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthModal data-figma="2072:12437">
      {error && <div className="auth-alert">{error}</div>}
      {msg && (
        <div className="dev-code-hint">
          <p>{msg}</p>
          <p>
            <Link to="/login">Back to log in</Link>
            {" · "}
            <Link to="/reset-password">I already have a reset token</Link>
          </p>
        </div>
      )}
      <form className="login-form" onSubmit={(e) => void onSubmit(e)}>
        <div className="login-form__titles">
          <h1>Forgot password</h1>
          <h2>Enter your email to reset your password</h2>
        </div>

        <div className="login-form__fields">
          <AuthField label="Email">
            <input
              className="perry-field__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
              disabled={busy || !!msg}
            />
          </AuthField>
        </div>

        <button type="submit" className="perry-btn" disabled={busy || !!msg}>
          {busy ? "Sending…" : "Continue"}
        </button>
      </form>
    </AuthModal>
  );
}
