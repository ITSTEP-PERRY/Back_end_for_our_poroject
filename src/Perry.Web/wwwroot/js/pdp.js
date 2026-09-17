(() => {
  const gallery = document.querySelector("[data-pdp-gallery]");
  if (gallery) {
    const main = gallery.querySelector("#mainImage");
    const thumbs = [...gallery.querySelectorAll(".thumb")];
    let index = Math.max(0, thumbs.findIndex((t) => t.classList.contains("active")));

    const show = (i) => {
      if (!thumbs.length || !main) return;
      index = (i + thumbs.length) % thumbs.length;
      const thumb = thumbs[index];
      main.src = thumb.dataset.url;
      thumbs.forEach((t, n) => t.classList.toggle("active", n === index));
    };

    gallery.querySelector("[data-gallery-prev]")?.addEventListener("click", () => show(index - 1));
    gallery.querySelector("[data-gallery-next]")?.addEventListener("click", () => show(index + 1));
    thumbs.forEach((t, i) => t.addEventListener("click", () => show(i)));
  }

  document.querySelectorAll("[data-pdp-qty]").forEach((form) => {
    const input = form.querySelector('input[name="AddQuantity"]');
    if (!input) return;
    const min = Number(input.min || 1);
    const max = Number(input.max || 99);
    form.querySelector("[data-qty-minus]")?.addEventListener("click", () => {
      input.value = String(Math.max(min, Number(input.value || 1) - 1));
    });
    form.querySelector("[data-qty-plus]")?.addEventListener("click", () => {
      input.value = String(Math.min(max, Number(input.value || 1) + 1));
    });
  });

  const openReview = document.querySelector("[data-open-review]");
  const form = document.getElementById("createReview");
  openReview?.addEventListener("click", () => {
    if (!form) return;
    form.hidden = !form.hidden;
    if (!form.hidden) form.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  const toTop = document.getElementById("toTop");
  if (toTop) {
    const toggle = () => {
      toTop.hidden = window.scrollY < 400;
    };
    window.addEventListener("scroll", toggle, { passive: true });
    toggle();
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }
})();
