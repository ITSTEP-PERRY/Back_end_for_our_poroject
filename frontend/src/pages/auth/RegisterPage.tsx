import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthContext";
import { savePendingRegistration } from "../../api/pendingRegistration";
import { AuthField, AuthModal } from "../../widgets/auth/AuthModal";
import { PasswordField } from "../../widgets/auth/PasswordField";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords must match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const login = email.trim();
      savePendingRegistration({ email: login, password });
      await register({ email: login, password, confirmPassword: confirm });
      navigate(`/verify-code?email=${encodeURIComponent(login)}&context=register`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthModal data-figma="1353:1912">
      {error && <div className="auth-alert">{error}</div>}
      <form className="login-form" onSubmit={(e) => void onSubmit(e)}>
        <div className="login-form__titles">
          <h1>Create account</h1>
          <h2>Shop in the marketplace while traveling</h2>
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
            />
          </AuthField>

          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
          />

          <PasswordField
            label="Confirm password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Repeat your password"
            autoComplete="new-password"
            required
          />
        </div>

        <button type="submit" className="perry-btn" disabled={busy}>
          {busy ? "…" : "Continue"}
        </button>
      </form>

      <p className="auth-modal__signup">
        Have an account? <Link to="/login">Log in</Link>
      </p>
      <p className="auth-modal__terms">
        By clicking &apos;Continue&apos;, you agree with{" "}
        <Link to="/terms">PERRY Terms and Conditions</Link>
      </p>
    </AuthModal>
  );
}
