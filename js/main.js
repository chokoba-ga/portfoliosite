/* ============================================================
   main.js
   ------------------------------------------------------------
   すべての公開ページ（index / gallery / work / about / commission）
   で共通して使う演出をまとめています。
   「ナビゲーション」「カスタムカーソル」「背景の花びら」
   「スクロールで要素が現れる演出」「ページ遷移演出」など。
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const data = PortfolioData.get();

  buildNav(data);
  buildFooter(data);
  initPageTransition();
  initCustomCursor();
  initFloaters();
  initScrollReveal();
  initHoverTargets();
});

/* ---------- ナビゲーションを共通で組み立てる ---------- */
function buildNav(data) {
  const mount = document.getElementById("nav-mount");
  if (!mount) return;

  const current = document.body.dataset.page || "";

  mount.innerHTML = `
    <nav class="site-nav">
      <a href="index.html" class="nav-logo">
        ${data.siteTitle}
        <small>illustrator</small>
      </a>
      <button class="nav-toggle" id="navToggle" aria-label="メニューを開く">
        <span></span><span></span>
      </button>
    </nav>
    <div class="nav-overlay" id="navOverlay">
      <a href="index.html" class="${current === "top" ? "active" : ""}">TOP</a>
      <a href="gallery.html" class="${current === "gallery" ? "active" : ""}">GALLERY</a>
      <a href="about.html" class="${current === "about" ? "active" : ""}">ABOUT</a>
      <a href="commission.html" class="${current === "commission" ? "active" : ""}">COMMISSION</a>
      <div class="nav-sns">
        ${snsLine(data.sns)}
      </div>
    </div>
  `;

  const toggle = document.getElementById("navToggle");
  const overlay = document.getElementById("navOverlay");
  toggle.addEventListener("click", () => {
    toggle.classList.toggle("is-open");
    overlay.classList.toggle("is-open");
  });
  overlay.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      toggle.classList.remove("is-open");
      overlay.classList.remove("is-open");
    })
  );
}

function snsLine(sns) {
  const links = [];
  if (sns.instagram) links.push(`<a href="${sns.instagram}" target="_blank" rel="noopener">Instagram</a>`);
  if (sns.twitter) links.push(`<a href="${sns.twitter}" target="_blank" rel="noopener">X</a>`);
  if (sns.pixiv) links.push(`<a href="${sns.pixiv}" target="_blank" rel="noopener">pixiv</a>`);
  return links.length ? links.join(" ・ ") : "SNS：準備中";
}

/* ---------- フッターを共通で組み立てる ---------- */
function buildFooter(data) {
  const mount = document.getElementById("footer-mount");
  if (!mount) return;
  const year = new Date().getFullYear();
  mount.innerHTML = `
    <footer class="site-footer">
      <div>© ${year} ${data.siteTitle}</div>
      <div class="footer-sns">${snsLine(data.sns)} ・ <a href="commission.html">Commission</a></div>
    </footer>
  `;
}

/* ---------- ページ遷移の演出 ---------- */
function initPageTransition() {
  const overlay = document.getElementById("page-transition");
  if (!overlay) return;
  requestAnimationFrame(() => overlay.classList.add("enter"));

  document.querySelectorAll('a[href$=".html"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (link.target === "_blank" || href.startsWith("http")) return;
      e.preventDefault();
      overlay.classList.remove("enter");
      overlay.style.transformOrigin = "top";
      overlay.style.transform = "scaleY(0)";
      requestAnimationFrame(() => {
        overlay.style.transition = "transform .5s cubic-bezier(.7,0,.3,1)";
        overlay.style.transform = "scaleY(1)";
      });
      setTimeout(() => (window.location.href = href), 480);
    });
  });
}

/* ---------- カスタムカーソル ---------- */
function initCustomCursor() {
  if (window.matchMedia("(max-width: 780px)").matches) return;
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  document.body.append(dot, ring);

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  window.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + "px";
    dot.style.top = my + "px";
  });

  function loop() {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    ring.style.left = rx + "px";
    ring.style.top = ry + "px";
    requestAnimationFrame(loop);
  }
  loop();
}

function initHoverTargets() {
  const ring = document.querySelector(".cursor-ring");
  if (!ring) return;
  document.querySelectorAll("a, button, .work-card").forEach((el) => {
    el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
  });
}

/* ---------- 背景に浮かぶ花びら／棘の装飾 ---------- */
function initFloaters() {
  const layer = document.createElement("div");
  layer.id = "floaters";
  document.body.appendChild(layer);

  const count = window.matchMedia("(max-width: 780px)").matches ? 6 : 14;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "floater";
    const size = 6 + Math.random() * 10;
    const isPetal = Math.random() > 0.4;
    el.style.left = Math.random() * 100 + "vw";
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.animationDuration = 14 + Math.random() * 18 + "s";
    el.style.animationDelay = -Math.random() * 20 + "s";
    el.innerHTML = isPetal
      ? `<svg viewBox="0 0 20 20" width="100%" height="100%"><ellipse cx="10" cy="10" rx="9" ry="5" fill="#c81433" opacity="0.5"/></svg>`
      : `<svg viewBox="0 0 20 20" width="100%" height="100%"><circle cx="10" cy="10" r="2" fill="#f3ece1" opacity="0.4"/></svg>`;
    layer.appendChild(el);
  }
}

/* ---------- スクロールで要素がふわっと現れる演出 ---------- */
function initScrollReveal() {
  reobserveReveals();
}

/* あとから JavaScript で追加した要素（作品カードなど）にも
   同じ演出を適用するための関数。要素を追加した後に呼び出してください。 */
function reobserveReveals(root = document) {
  const targets = root.querySelectorAll(".reveal:not(.in-view), .work-card:not(.in-view)");
  if (!targets.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  targets.forEach((t) => io.observe(t));
}
window.reobserveReveals = reobserveReveals;

/* ---------- 作品カードのHTMLを組み立てる共通関数 ---------- */
function renderWorkCard(work) {
  const img = PortfolioData.getWorkImage(work);
  return `
    <a href="work.html?id=${work.id}" class="work-card reveal">
      <div class="thumb"><img src="${img}" alt="${work.title}" loading="lazy"></div>
      <div class="info">
        <div class="cat">${work.category}</div>
        <h3>${work.title}</h3>
        <div class="yr">${work.year}</div>
      </div>
    </a>
  `;
}
window.renderWorkCard = renderWorkCard;
