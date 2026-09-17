(() => {
  document.querySelectorAll("[data-filter-search]").forEach((input) => {
    const body = input.closest(".filter-acc__body");
    if (!body) return;
    const options = body.querySelector("[data-filter-options]");
    if (!options) return;

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      options.querySelectorAll("[data-filter-label]").forEach((el) => {
        const label = (el.getAttribute("data-filter-label") || "").toLowerCase();
        el.style.display = !q || label.includes(q) ? "" : "none";
      });
    });
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
