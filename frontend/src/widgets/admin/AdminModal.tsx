import type { ReactNode } from "react";

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  titleCenter?: boolean;
};

export function AdminModal({ title, onClose, children, wide, titleCenter }: Props) {
  return (
    <div className="ap-modal" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="ap-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div className={`ap-modal__card ${wide ? "ap-modal__card--wide" : ""}`}>
        <h2 className={`ap-modal__title ${titleCenter ? "is-center" : ""}`}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
