import { useState } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string | null;
  required?: boolean;
};

export function PasswordField({
  label,
  value,
  onChange,
  placeholder = "Enter your password",
  autoComplete = "current-password",
  error,
  required,
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className={`perry-field perry-field--password ${error ? "perry-field--error" : ""}`}>
      <span className="perry-field__label">{label}</span>
      <div className="perry-field__control">
        <input
          className="perry-field__input"
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
        />
        <button
          type="button"
          className="perry-field__toggle"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((v) => !v)}
        >
          <img
            src={show ? "/icons/Eye_open.svg" : "/icons/Eye_closed.svg"}
            alt=""
            width={24}
            height={24}
          />
        </button>
      </div>
      {error && <p className="perry-field__error">{error}</p>}
    </div>
  );
}
