type Props = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AdminConfirmModal({
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  busy,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="ap-modal" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="ap-modal__backdrop" aria-label="Close" onClick={onCancel} />
      <div className="ap-modal__card ap-modal__card--confirm">
        <h2 className="ap-modal__title is-center">{title}</h2>
        <p className="ap-modal__message">{message}</p>
        <div className="ap-modal__footer ap-modal__footer--confirm">
          <button type="button" className="ap-btn ap-btn--accent" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="ap-btn ap-btn--danger-outline"
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
