import { type FormEvent, useEffect, useState } from "react";
import type { CategoryDto } from "../../api/types";
import { AdminModal } from "./AdminModal";
import { CATEGORY_ICON_PRESETS } from "./categoryIcons";

export type CategoryFormValues = {
  name: string;
  description: string;
  imageUrl: string;
  iconUrl: string;
  parentCategoryId: string;
  isActive: boolean;
  propertyKeys: string[];
};

type Props = {
  mode: "create-root" | "create-child" | "edit";
  initial: CategoryFormValues;
  flat: CategoryDto[];
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
};

export function AdminCategoryFormModal({ mode, initial, flat, busy, onClose, onSubmit }: Props) {
  const [form, setForm] = useState(initial);
  const [propDraft, setPropDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setForm(initial), [initial]);

  const title =
    mode === "edit"
      ? form.parentCategoryId
        ? "Edit subcategory"
        : "Edit category"
      : mode === "create-child"
        ? "Create subcategory"
        : "Create category";

  const namePh =
    mode === "create-child" || form.parentCategoryId
      ? "Enter subcategory name..."
      : "Enter category name...";
  const descPh =
    mode === "create-child" || form.parentCategoryId
      ? "Describe your subcategory..."
      : "Describe your category...";

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        description: form.description.slice(0, 300),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <AdminModal title={title} onClose={onClose} wide>
      <form className="ap-cat-form" onSubmit={(e) => void save(e)}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="ap-cat-form__top">
          <label className="ap-cat-form__photo">
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="" />
            ) : (
              <span className="ap-cat-form__photo-plus">+</span>
            )}
            <input
              type="url"
              value={form.imageUrl}
              placeholder="Image URL"
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
          </label>

          <div className="ap-cat-form__fields">
            <div className="ap-cat-form__row">
              <label className="ap-field-float">
                <span>Category name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={namePh}
                  required
                />
              </label>
              <div className="ap-status-toggle" role="group" aria-label="Status">
                <button
                  type="button"
                  className={`ap-status-toggle__btn ${form.isActive ? "is-on" : ""}`}
                  onClick={() => setForm({ ...form, isActive: true })}
                >
                  Active
                </button>
                <button
                  type="button"
                  className={`ap-status-toggle__btn ${!form.isActive ? "is-on" : ""}`}
                  onClick={() => setForm({ ...form, isActive: false })}
                >
                  Not active
                </button>
              </div>
            </div>

            <label className="ap-field-float ap-field-float--area">
              <span>Description</span>
              <textarea
                rows={4}
                maxLength={300}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={descPh}
              />
              <em className="ap-field-float__counter">{form.description.length} / 300</em>
            </label>

            {(mode !== "create-root" || form.parentCategoryId) && (
              <label className="ap-field-float">
                <span>Category</span>
                <select
                  value={form.parentCategoryId}
                  onChange={(e) => setForm({ ...form, parentCategoryId: e.target.value })}
                >
                  <option value="">Choose category...</option>
                  {flat.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="ap-icon-picker">
              <span className="ap-icon-picker__label">Icon</span>
              <div className="ap-icon-picker__grid">
                {CATEGORY_ICON_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    title={p.label}
                    className={`ap-icon-picker__item ${form.iconUrl === p.url ? "is-selected" : ""}`}
                    onClick={() => setForm({ ...form, iconUrl: p.url })}
                  >
                    <img src={p.url} alt={p.label} width={22} height={22} />
                  </button>
                ))}
                <button
                  type="button"
                  className={`ap-icon-picker__item ${!form.iconUrl ? "is-selected" : ""}`}
                  onClick={() => setForm({ ...form, iconUrl: "" })}
                  title="None"
                >
                  —
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="ap-prop-keys">
          <h3>Property keys</h3>
          <div className="ap-prop-keys__list">
            {form.propertyKeys.map((key) => (
              <button
                key={key}
                type="button"
                className="ap-prop-keys__chip"
                onClick={() =>
                  setForm({ ...form, propertyKeys: form.propertyKeys.filter((k) => k !== key) })
                }
                title="Remove"
              >
                {key} ×
              </button>
            ))}
          </div>
          <div className="ap-prop-keys__add">
            <input
              value={propDraft}
              onChange={(e) => setPropDraft(e.target.value)}
              placeholder="Property key"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = propDraft.trim();
                  if (!v || form.propertyKeys.includes(v)) return;
                  setForm({ ...form, propertyKeys: [...form.propertyKeys, v] });
                  setPropDraft("");
                }
              }}
            />
            <button
              type="button"
              className="ap-prop-keys__btn"
              onClick={() => {
                const v = propDraft.trim();
                if (!v || form.propertyKeys.includes(v)) return;
                setForm({ ...form, propertyKeys: [...form.propertyKeys, v] });
                setPropDraft("");
              }}
            >
              + Add property key
            </button>
          </div>
          <p className="ap-prop-keys__hint">Keys are stored locally in the browser (UI preview).</p>
        </div>

        <div className="ap-modal__footer">
          <button type="button" className="ap-btn ap-btn--outline" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="ap-btn ap-btn--accent" disabled={busy}>
            {mode === "edit" ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
