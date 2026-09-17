(() => {
  function scrollCarousel(name, dir) {
    if (name === "hero") {
      cycleHero(dir);
      return;
    }
    const track = document.querySelector(`[data-carousel="${name}"]`);
    if (!track) return;
    const amount = Math.max(240, Math.floor(track.clientWidth * 0.8));
    track.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  function cycleHero(dir) {
    const track = document.querySelector('[data-carousel="hero"]');
    if (!track) return;
    const slides = [...track.querySelectorAll(".home-hero__slide")];
    if (slides.length < 2) return;
    const current = slides.findIndex((s) => s.classList.contains("is-active"));
    const next = (current + dir + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("is-active", i === next));
  }

  document.querySelectorAll("[data-carousel-prev]").forEach((btn) => {
    btn.addEventListener("click", () => scrollCarousel(btn.getAttribute("data-carousel-prev"), -1));
  });

  document.querySelectorAll("[data-carousel-next]").forEach((btn) => {
    btn.addEventListener("click", () => scrollCarousel(btn.getAttribute("data-carousel-next"), 1));
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
