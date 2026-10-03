import type { CategoryDto } from "../../api/types";
import { categoryIconSrc } from "./categoryIcons";

type Props = {
  nodes: CategoryDto[];
  depth?: number;
  selectedId?: string;
  checked: Set<string>;
  expanded: Set<string>;
  onSelect: (id: string) => void;
  onToggleCheck: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onAddChild: (parentId: string) => void;
  query?: string;
};

function matchesQuery(node: CategoryDto, q: string): boolean {
  if (!q) return true;
  const hay = `${node.name} ${node.slug}`.toLowerCase();
  if (hay.includes(q)) return true;
  return (node.subCategories ?? []).some((c) => matchesQuery(c, q));
}

export function AdminCategoryTree({
  nodes,
  depth = 0,
  selectedId,
  checked,
  expanded,
  onSelect,
  onToggleCheck,
  onToggleExpand,
  onAddChild,
  query = "",
}: Props) {
  const q = query.trim().toLowerCase();
  const visible = nodes.filter((n) => matchesQuery(n, q));

  return (
    <ul className={`ap-tree ${depth === 0 ? "ap-tree--root" : ""}`}>
      {visible.map((node) => {
        const kids = node.subCategories ?? [];
        const hasKids = kids.length > 0;
        const isOpen = expanded.has(node.id) || (!!q && hasKids);
        const isSelected = selectedId === node.id;
        const icon = categoryIconSrc(node.iconUrl);
        return (
          <li key={node.id} className="ap-tree__item">
            <div
              className={`ap-tree__row ${isSelected ? "is-selected" : ""}`}
              style={{ paddingLeft: 8 + depth * 18 }}
            >
              <label className="ap-tree__check">
                <input
                  type="checkbox"
                  checked={checked.has(node.id)}
                  onChange={() => onToggleCheck(node.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </label>
              <button type="button" className="ap-tree__label" onClick={() => onSelect(node.id)}>
                {depth === 0 && icon && (
                  <img className="ap-tree__icon" src={icon} alt="" width={18} height={18} />
                )}
                <span>{node.name}</span>
              </button>
              {depth === 0 && (
                <button
                  type="button"
                  className="ap-tree__add"
                  title="Create subcategory"
                  onClick={() => onAddChild(node.id)}
                >
                  +
                </button>
              )}
              {hasKids && (
                <button
                  type="button"
                  className={`ap-tree__chevron ${isOpen ? "is-open" : ""}`}
                  aria-label={isOpen ? "Collapse" : "Expand"}
                  onClick={() => onToggleExpand(node.id)}
                />
              )}
            </div>
            {hasKids && isOpen && (
              <AdminCategoryTree
                nodes={kids}
                depth={depth + 1}
                selectedId={selectedId}
                checked={checked}
                expanded={expanded}
                onSelect={onSelect}
                onToggleCheck={onToggleCheck}
                onToggleExpand={onToggleExpand}
                onAddChild={onAddChild}
                query={query}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
