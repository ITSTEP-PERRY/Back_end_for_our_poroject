import { Link, Outlet } from "react-router-dom";

export function AuthShell({ backTo = "/", backLabel = "← Perry" }: { backTo?: string; backLabel?: string }) {
  return (
    <div className="auth-shell">
      <Link className="auth-back" to={backTo}>
        {backLabel}
      </Link>
      <Outlet />
    </div>
  );
}
