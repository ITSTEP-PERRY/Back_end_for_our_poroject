import type { HTMLAttributes, ReactNode } from "react";

export function AuthModal({ children, ...rest }: { children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="auth-modal" {...rest}>
      <div className="auth-modal__body">
        <div className="auth-modal__form-col">{children}</div>
        <div className="auth-modal__image">
          <img src="/images/SiginSignup.png" alt="" width={530} height={632} />
        </div>
      </div>
    </div>
  );
}

export function AuthField({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string | null;
}) {
  return (
    <div className={`perry-field ${error ? "perry-field--error" : ""}`}>
      <span className="perry-field__label">{label}</span>
      <div className="perry-field__control">{children}</div>
      {error && <p className="perry-field__error">{error}</p>}
    </div>
  );
}
