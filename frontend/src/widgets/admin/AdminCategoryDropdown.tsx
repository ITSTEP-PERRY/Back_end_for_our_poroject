import { useEffect, useMemo, useRef, useState } from "react";
import type { CategoryDto } from "../../api/types";
import { categoryIconSrc } from "./categoryIcons";

type Props = {
  tree: CategoryDto[];
  value?: string;
  placeholder?: string;
  allLabel?: string;
  onChange: (id: string | undefined) => void;
};

export function AdminCategoryDropdown({
  tree,
  value,
  placeholder = "Choose category...",
  allLabel = "All",
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const flat = useMemo(() => {
    const out: { id: string; name: string; depth: number; iconUrl?: string | null }[] = [];
    const walk = (nodes: CategoryDto[], depth: number) => {
      nodes.forEach((n) => {
        out.push({ id: n.id, name: n.name, depth, iconUrl: n.iconUrl });
        if (n.subCategories?.length) walk(n.subCategories, depth + 1);
      });
    };
    walk(tree, 0);
    return out;
  }, [tree]);

  const selected = flat.find((c) => c.id === value);
  const selectedName = selected?.name;
  const selectedIcon = categoryIconSrc(selected?.iconUrl);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="ap-cat" ref={root} data-cat-dropdown>
      <button
        type="button"
        className="ap-cat__trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`ap-cat__value ${selectedName ? "" : "is-placeholder"}`}>
          {selectedIcon && <img src={selectedIcon} alt="" width={18} height={18} />}
          {selectedName || placeholder}
        </span>
        <span className="ap-cat__chevron" aria-hidden="true" />
      </button>
      {open && (
        <div className="ap-cat__menu">
          <button
            type="button"
            className={`ap-cat__item ${!value ? "is-selected" : ""}`}
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
          >
            {allLabel}
          </button>
          {flat.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`ap-cat__item ${value === c.id ? "is-selected" : ""}`}
              style={{ paddingLeft: 10 + c.depth * 14 }}
              onClick={() => {
                onChange(c.id);
                setOpen(false);
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
