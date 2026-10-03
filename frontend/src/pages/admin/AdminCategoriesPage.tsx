import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { categoriesApi } from "../../api";
import type { CategoryDto } from "../../api/types";
import { AdminCategoryDropdown } from "../../widgets/admin/AdminCategoryDropdown";
import { AdminCategoryFormModal, type CategoryFormValues } from "../../widgets/admin/AdminCategoryFormModal";
import { AdminCategoryTree } from "../../widgets/admin/AdminCategoryTree";
import { AdminConfirmModal } from "../../widgets/admin/AdminConfirmModal";
import { AdminEmptyBlob } from "../../widgets/admin/AdminEmptyBlob";
import { categoryIconSrc } from "../../widgets/admin/categoryIcons";

const PROP_KEYS_STORAGE = "perry_admin_category_prop_keys";

function loadPropKeys(id: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PROP_KEYS_STORAGE) || "{}") as Record<string, string[]>;
    return raw[id] ?? [];
  } catch {
    return [];
  }
}

function savePropKeys(id: string, keys: string[]) {
  try {
    const raw = JSON.parse(localStorage.getItem(PROP_KEYS_STORAGE) || "{}") as Record<string, string[]>;
    raw[id] = keys;
    localStorage.setItem(PROP_KEYS_STORAGE, JSON.stringify(raw));
  } catch {
    /* ignore */
  }
}

function findNode(nodes: CategoryDto[], id: string): CategoryDto | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const hit = findNode(n.subCategories ?? [], id);
    if (hit) return hit;
  }
  return null;
}

function findRoot(flat: CategoryDto[], node: CategoryDto | null): CategoryDto | null {
  if (!node) return null;
  let cur: CategoryDto | null = node;
  while (cur?.parentCategoryId) {
    cur = flat.find((c) => c.id === cur!.parentCategoryId) ?? null;
  }
  return cur;
}

function collectDescendants(node: CategoryDto): string[] {
  const ids = [node.id];
  for (const c of node.subCategories ?? []) ids.push(...collectDescendants(c));
  return ids;
}

const emptyForm = (parentCategoryId = ""): CategoryFormValues => ({
  name: "",
  description: "",
  imageUrl: "",
  iconUrl: "",
  parentCategoryId,
  isActive: true,
  propertyKeys: [],
});

export function AdminCategoriesPage() {
  const [params, setParams] = useSearchParams();
  const filterId = params.get("categoryId") || undefined;
  const selectedId = params.get("selectedId") || undefined;
  const q = params.get("q") || "";

  const [tree, setTree] = useState<CategoryDto[]>([]);
  const [search, setSearch] = useState(q);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<
    | null
    | { kind: "form"; mode: "create-root" | "create-child" | "edit"; initial: CategoryFormValues; editId?: string }
    | { kind: "delete"; ids: string[] }
  >(null);

  const reload = () =>
    categoriesApi
      .tree({ includeInactive: true })
      .then((t) => {
        setTree(t);
        setError(null);
        setExpanded((prev) => {
          const next = new Set(prev);
          t.forEach((r) => next.add(r.id));
          return next;
        });
      })
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => setSearch(q), [q]);

  const flat = useMemo(() => {
    const out: CategoryDto[] = [];
    const walk = (nodes: CategoryDto[]) => {
      nodes.forEach((n) => {
        out.push(n);
        if (n.subCategories) walk(n.subCategories);
      });
    };
    walk(tree);
    return out;
  }, [tree]);

  const filterRoot = filterId ? findNode(tree, filterId) : null;
  const displayRoots = filterRoot ? [filterRoot] : tree;
  const selected = selectedId ? findNode(tree, selectedId) : filterRoot;
  const parentOfSelected = selected?.parentCategoryId
    ? flat.find((c) => c.id === selected.parentCategoryId) ?? null
    : null;
  const mainOfSelected = findRoot(flat, selected);

  const setFilter = (id?: string) => {
    const next = new URLSearchParams(params);
    if (id) {
      next.set("categoryId", id);
      next.set("selectedId", id);
    } else {
      next.delete("categoryId");
      next.delete("selectedId");
    }
    setParams(next);
    setChecked(new Set());
  };

  const selectNode = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("selectedId", id);
    setParams(next);
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (search.trim()) next.set("q", search.trim());
    else next.delete("q");
    setParams(next);
  };

  const openCreateRoot = () =>
    setModal({ kind: "form", mode: "create-root", initial: emptyForm("") });

  const openCreateChild = (parentId: string) =>
    setModal({ kind: "form", mode: "create-child", initial: emptyForm(parentId) });

  const openEdit = () => {
    if (!selected) return;
    setModal({
      kind: "form",
      mode: "edit",
      editId: selected.id,
      initial: {
        name: selected.name,
        description: selected.description || "",
        imageUrl: selected.imageUrl || "",
        iconUrl: selected.iconUrl || "",
        parentCategoryId: selected.parentCategoryId || "",
        isActive: selected.isActive !== false,
        propertyKeys: loadPropKeys(selected.id),
      },
    });
  };

  const openDelete = (ids: string[]) => {
    if (!ids.length) return;
    setModal({ kind: "delete", ids });
  };

  const submitForm = async (values: CategoryFormValues) => {
    setBusy(true);
    try {
      const body = {
        name: values.name,
        slug: null,
        description: values.description || null,
        imageUrl: values.imageUrl || null,
        iconUrl: values.iconUrl || null,
        parentCategoryId: values.parentCategoryId || null,
        sortOrder: 0,
        isActive: values.isActive,
      };
      if (modal?.kind === "form" && modal.mode === "edit" && modal.editId) {
        await categoriesApi.update(modal.editId, body);
        savePropKeys(modal.editId, values.propertyKeys);
        setModal(null);
        await reload();
      } else {
        const created = await categoriesApi.create(body);
        savePropKeys(created.id, values.propertyKeys);
        setModal(null);
        const next = new URLSearchParams(params);
        next.set("selectedId", created.id);
        if (created.parentCategoryId) next.set("categoryId", created.parentCategoryId);
        setParams(next);
        await reload();
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (modal?.kind !== "delete") return;
    setBusy(true);
    try {
      for (const id of modal.ids) {
        await categoriesApi.remove(id);
      }
      setChecked(new Set());
      const next = new URLSearchParams(params);
      if (selectedId && modal.ids.includes(selectedId)) next.delete("selectedId");
      if (filterId && modal.ids.includes(filterId)) {
        next.delete("categoryId");
        next.delete("selectedId");
      }
      setParams(next);
      setModal(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setModal(null);
    } finally {
      setBusy(false);
    }
  };

  const checkedCount = checked.size;
  const emptyText = filterId
    ? "No subcategories in the selected category"
    : q
      ? `Nothing found for “${q}”`
      : "No subcategories in the selected category";

  const showTree = displayRoots.length > 0 && (filterId || tree.length > 0);
  const treeHasVisibleKids =
    !!filterRoot?.subCategories?.length || (!filterId && tree.length > 0);

  return (
    <div data-figma="2720:5428">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="ap-toolbar">
        <span className="ap-toolbar__label">Category</span>
        <AdminCategoryDropdown
          tree={tree}
          value={filterId}
          placeholder="Choose category"
          allLabel="All categories"
          onChange={setFilter}
        />
        <form className="ap-search" onSubmit={onSearch} role="search">
          <img className="ap-search__icon" src="/icons/search.svg" alt="" width={20} height={16} />
          <input
            className="ap-search__input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
          />
        </form>
        <div className="ap-toolbar__actions">
          {checkedCount > 0 && (
            <button
              type="button"
              className="ap-btn ap-btn--danger-outline ap-btn--sm"
              onClick={() => openDelete([...checked])}
            >
              Delete selected ({checkedCount})
            </button>
          )}
          <button type="button" className="ap-btn ap-btn--accent ap-btn--sm" onClick={openCreateRoot}>
            + Create category
          </button>
        </div>
      </div>

      <div className="ap-layout ap-layout--cats">
        <section className="ap-list ap-list--tree">
          {!showTree || (!treeHasVisibleKids && !filterRoot) ? (
            <AdminEmptyBlob text={emptyText} />
          ) : !treeHasVisibleKids && filterRoot ? (
            <>
              <AdminCategoryTree
                nodes={displayRoots}
                selectedId={selected?.id}
                checked={checked}
                expanded={expanded}
                query={q}
                onSelect={selectNode}
                onToggleCheck={(id) =>
                  setChecked((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
                onToggleExpand={(id) =>
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
                onAddChild={openCreateChild}
              />
              <AdminEmptyBlob text="No subcategories in the selected category" />
              <button type="button" className="ap-create-card" onClick={() => openCreateChild(filterRoot.id)}>
                <span className="ap-create-card__plus">+</span>
                <span>Create subcategory</span>
              </button>
            </>
          ) : (
            <AdminCategoryTree
              nodes={displayRoots}
              selectedId={selected?.id}
              checked={checked}
              expanded={expanded}
              query={q}
              onSelect={selectNode}
              onToggleCheck={(id) =>
                setChecked((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              onToggleExpand={(id) =>
                setExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              onAddChild={openCreateChild}
            />
          )}
        </section>

        <aside className="ap-panel ap-panel--detail">
          {!selected ? (
            <div className="ap-panel__empty">
              <p>Select a category to see its information</p>
            </div>
          ) : (
            <div className="ap-panel__preview ap-cat-detail">
              <div className={`ap-panel__hero ${selected.imageUrl ? "" : "is-ph"}`}>
                {selected.imageUrl && <img src={selected.imageUrl} alt="" />}
              </div>
              <div className="ap-cat-detail__title-row">
                {categoryIconSrc(selected.iconUrl) && (
                  <img src={categoryIconSrc(selected.iconUrl)!} alt="" width={24} height={24} />
                )}
                <h2 className="ap-panel__title">{selected.name}</h2>
              </div>
              {selected.description && <p className="ap-cat-detail__desc">{selected.description}</p>}
              <dl className="ap-cat-detail__meta">
                <div>
                  <dt>Status</dt>
                  <dd>{selected.isActive === false ? "Not active" : "Active"}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{selected.parentCategoryId ? "Child category" : "Parent category"}</dd>
                </div>
                {parentOfSelected && (
                  <div>
                    <dt>Parent category</dt>
                    <dd>{parentOfSelected.name}</dd>
                  </div>
                )}
                {mainOfSelected && selected.parentCategoryId && (
                  <div>
                    <dt>Main category</dt>
                    <dd>{mainOfSelected.name}</dd>
                  </div>
                )}
              </dl>
              <div className="ap-panel__actions">
                <button type="button" className="ap-btn ap-btn--outline" onClick={openEdit}>
                  <img src="/icons/admin/pencil.svg" alt="" width={16} height={16} />
                  Edit
                </button>
                <button
                  type="button"
                  className="ap-btn ap-btn--danger-outline"
                  onClick={() => openDelete(collectDescendants(selected))}
                >
                  <img src="/icons/admin/trash.svg" alt="" width={16} height={16} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {modal?.kind === "form" && (
        <AdminCategoryFormModal
          mode={modal.mode}
          initial={modal.initial}
          flat={flat}
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={submitForm}
        />
      )}

      {modal?.kind === "delete" && (
        <AdminConfirmModal
          message={
            modal.ids.length > 1
              ? "You can't recover categories, subcategories; products will be deactivated."
              : "You can't recover categories, subcategories; products will be deactivated."
          }
          busy={busy}
          onCancel={() => setModal(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </div>
  );
}
