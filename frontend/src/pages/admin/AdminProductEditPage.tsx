import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { categoriesApi, productsApi } from "../../api";
import type { CategoryDto, ProductDetail } from "../../api/types";

type AboutRow = { title: string; description: string };
type AttrRow = { name: string; value: string };

const MAX_IMAGES = 10;
const MAX_CODE = 60;

function discountFromPrices(price: number, oldPrice?: number | null) {
  if (oldPrice == null || oldPrice <= price || price <= 0) return "";
  return String(Math.round((1 - price / oldPrice) * 100));
}

function oldPriceFromDiscount(price: number, discountRaw: string) {
  const d = Number(discountRaw);
  if (!Number.isFinite(d) || d <= 0 || d >= 100 || price <= 0) return null;
  return Math.round((price / (1 - d / 100)) * 100) / 100;
}

export function AdminProductEditPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cats, setCats] = useState<CategoryDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeSection, setActiveSection] = useState<"general" | "details" | "about">("general");
  const [form, setForm] = useState({
    name: "",
    brand: "Perry",
    sku: "",
    categoryId: searchParams.get("categoryId") || "",
    price: "" as string,
    discount: "" as string,
    stockQuantity: "" as string,
    imageUrls: [] as string[],
  });
  const [about, setAbout] = useState<AboutRow[]>([]);
  const [attrs, setAttrs] = useState<AttrRow[]>([]);
  const generalRef = useRef<HTMLElement | null>(null);
  const detailsRef = useRef<HTMLElement | null>(null);
  const aboutRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    categoriesApi.tree({ includeInactive: true }).then((tree) => {
      const flat: CategoryDto[] = [];
      const walk = (nodes: CategoryDto[]) => {
        nodes.forEach((n) => {
          flat.push(n);
          if (n.subCategories) walk(n.subCategories);
        });
      };
      walk(tree);
      setCats(flat);
    });
  }, []);

  useEffect(() => {
    if (isNew || !id) return;
    productsApi.byId(id).then((p: ProductDetail) => {
      setForm({
        name: p.name,
        brand: p.brand || "Perry",
        sku: p.sku || "",
        categoryId: p.category.id,
        price: String(p.price),
        discount: discountFromPrices(p.price, p.oldPrice),
        stockQuantity: String(p.stockQuantity),
        imageUrls: p.images.map((i) => i.url).filter(Boolean),
      });
      setAbout(p.aboutItems.length ? p.aboutItems : []);
      setAttrs(p.attributes.length ? p.attributes : []);
    });
  }, [id, isNew]);

  useEffect(() => {
    const sections: { id: typeof activeSection; el: HTMLElement | null }[] = [
      { id: "general", el: generalRef.current },
      { id: "details", el: detailsRef.current },
      { id: "about", el: aboutRef.current },
    ];
    const onScroll = () => {
      const y = window.scrollY + 120;
      let current: typeof activeSection = "general";
      for (const s of sections) {
        if (s.el && s.el.offsetTop <= y) current = s.id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (section: typeof activeSection) => {
    const map = { general: generalRef, details: detailsRef, about: aboutRef };
    map[section].current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(section);
  };

  const pageTitle = isNew ? "Create product" : "Edit product";
  const primaryCta = isNew ? "Create" : "Save";

  const imageCount = form.imageUrls.length;
  const codeLen = form.sku.length;

  const flatCats = useMemo(() => cats, [cats]);

  const addImageUrl = () => {
    if (form.imageUrls.length >= MAX_IMAGES) return;
    const url = window.prompt("Image or video URL (.mp4 for gallery video)");
    if (!url?.trim()) return;
    setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, url.trim()].slice(0, MAX_IMAGES) }));
  };

  const removeImage = (index: number) => {
    setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== index) }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!form.categoryId) {
      setError("Category is required");
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid price");
      return;
    }
    setBusy(true);
    const stockQuantity = Number(form.stockQuantity || 0);
    const body = {
      name: form.name.trim(),
      description: about.find((a) => a.description.trim())?.description.trim() || form.name.trim(),
      brand: form.brand || "Perry",
      sku: form.sku.trim() || null,
      categoryId: form.categoryId,
      price,
      oldPrice: oldPriceFromDiscount(price, form.discount),
      stockQuantity: Number.isFinite(stockQuantity) ? stockQuantity : 0,
      imageUrls: form.imageUrls,
      aboutItems: about.filter((a) => a.title.trim() || a.description.trim()),
      attributes: attrs.filter((a) => a.name.trim() || a.value.trim()),
    };
    try {
      if (isNew) {
        const created = await productsApi.create(body);
        navigate(`/admin/products?selectedId=${created.id}`);
      } else if (id) {
        await productsApi.update(id, body);
        navigate(`/admin/products?selectedId=${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ap-pedit" data-figma="4611:53960">
      <aside className="ap-pedit__nav" aria-label="Product sections">
        <nav className="ap-pedit__nav-list">
          {(
            [
              ["general", "General information"],
              ["details", "Product details"],
              ["about", "About product"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`ap-pedit__nav-link${activeSection === key ? " is-active" : ""}`}
              onClick={() => scrollTo(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="ap-pedit__nav-foot">
          <span className="ap-pedit__nav-plus" aria-hidden="true">
            +
          </span>
          <span>{pageTitle}</span>
        </div>
      </aside>

      <form className="ap-pedit__main" onSubmit={(e) => void onSubmit(e)}>
        {error && <div className="alert alert-error">{error}</div>}

        <section className="ap-pedit__section" ref={generalRef} id="ap-general">
          <h1 className="ap-pedit__title">General information</h1>
          <hr className="ap-pedit__rule" />

          <label className="ap-pedit-field">
            <span className="ap-pedit-field__label">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter product name..."
              required
            />
          </label>

          <label className="ap-pedit-field ap-pedit-field--count">
            <span className="ap-pedit-field__label">Code</span>
            <input
              value={form.sku}
              maxLength={MAX_CODE}
              onChange={(e) => setForm({ ...form, sku: e.target.value.slice(0, MAX_CODE) })}
              placeholder="Enter product code..."
            />
            <em className="ap-pedit-field__counter">
              {codeLen} / {MAX_CODE}
            </em>
          </label>

          <label className="ap-pedit-field ap-pedit-field--select">
            <span className="ap-pedit-field__label">Category</span>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              required
            >
              <option value="">Choose category...</option>
              {flatCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isActive === false ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="ap-pedit-display">
            <div className="ap-pedit-display__head">
              <span>
                Product display{" "}
                <span
                  className="ap-pedit-display__info"
                  title="Up to 10 media URLs. Paste a .mp4 URL for gallery video (#42)."
                >
                  ⓘ
                </span>
              </span>
              <span className="ap-pedit-display__count">
                {imageCount} / {MAX_IMAGES}
              </span>
            </div>
            <div className="ap-pedit-display__grid">
              {form.imageUrls.map((url, i) => {
                const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
                return (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    className="ap-pedit-display__tile ap-pedit-display__tile--filled"
                    onClick={() => removeImage(i)}
                    title={isVideo ? "Remove video" : "Remove image"}
                  >
                    {isVideo ? <span className="ap-pedit-display__video">VIDEO</span> : <img src={url} alt="" />}
                  </button>
                );
              })}
              {imageCount < MAX_IMAGES && (
                <button type="button" className="ap-pedit-display__tile" onClick={addImageUrl} aria-label="Add image">
                  <span>+</span>
                </button>
              )}
            </div>
          </div>

          <label className="ap-pedit-field">
            <span className="ap-pedit-field__label">Price, $</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Enter product price..."
              required
            />
          </label>

          <label className="ap-pedit-field">
            <span className="ap-pedit-field__label">Discount, %</span>
            <input
              type="number"
              min="0"
              max="99"
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })}
              placeholder="Enter product discount..."
            />
          </label>

          <label className="ap-pedit-field">
            <span className="ap-pedit-field__label">Number</span>
            <input
              type="number"
              min="0"
              value={form.stockQuantity}
              onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
              placeholder="Enter the quantity of your product..."
            />
          </label>
        </section>

        <section className="ap-pedit__section" ref={detailsRef} id="ap-details">
          <hr className="ap-pedit__rule" />
          <h2 className="ap-pedit__title">Product details</h2>
          <hr className="ap-pedit__rule" />

          {attrs.map((row, i) => (
            <div key={i} className="ap-pedit__pair">
              <label className="ap-pedit-field">
                <span className="ap-pedit-field__label">Property key</span>
                <input
                  value={row.name}
                  onChange={(e) => {
                    const next = [...attrs];
                    next[i] = { ...row, name: e.target.value };
                    setAttrs(next);
                  }}
                  placeholder="Enter key..."
                />
              </label>
              <label className="ap-pedit-field">
                <span className="ap-pedit-field__label">Attribute</span>
                <input
                  value={row.value}
                  onChange={(e) => {
                    const next = [...attrs];
                    next[i] = { ...row, value: e.target.value };
                    setAttrs(next);
                  }}
                  placeholder="Enter value..."
                />
              </label>
            </div>
          ))}

          <button
            type="button"
            className="ap-pedit__add"
            onClick={() => setAttrs([...attrs, { name: "", value: "" }])}
          >
            <span className="ap-pedit__add-plus">+</span>
            Add product detail
          </button>
        </section>

        <section className="ap-pedit__section" ref={aboutRef} id="ap-about">
          <hr className="ap-pedit__rule" />
          <h2 className="ap-pedit__title">About product</h2>
          <hr className="ap-pedit__rule" />

          {about.map((row, i) => (
            <div key={i} className="ap-pedit__pair ap-pedit__pair--about">
              <label className="ap-pedit-field">
                <span className="ap-pedit-field__label">Title</span>
                <input
                  value={row.title}
                  onChange={(e) => {
                    const next = [...about];
                    next[i] = { ...row, title: e.target.value };
                    setAbout(next);
                  }}
                  placeholder="Feature title..."
                />
              </label>
              <label className="ap-pedit-field ap-pedit-field--area">
                <span className="ap-pedit-field__label">Description</span>
                <textarea
                  rows={2}
                  value={row.description}
                  onChange={(e) => {
                    const next = [...about];
                    next[i] = { ...row, description: e.target.value };
                    setAbout(next);
                  }}
                  placeholder="Describe the feature..."
                />
              </label>
            </div>
          ))}

          <button
            type="button"
            className="ap-pedit__add"
            onClick={() => setAbout([...about, { title: "", description: "" }])}
          >
            <span className="ap-pedit__add-plus">+</span>
            Add product feature
          </button>
        </section>

        <div className="ap-pedit__actions">
          <Link className="ap-pedit__btn ap-pedit__btn--ghost" to="/admin/products">
            Cancel
          </Link>
          <button className="ap-pedit__btn ap-pedit__btn--primary" type="submit" disabled={busy}>
            {busy ? "…" : primaryCta}
          </button>
        </div>
      </form>
    </div>
  );
}
