/* ============================================================
   admin.js
   ------------------------------------------------------------
   管理画面の動きをまとめたファイルです。
   「データベース」「JSON」「API」のような言葉が出てこないように、
   すべて分かりやすい日本語の操作としてまとめています。
   ============================================================ */

let editingWorkId = null; // 編集中の作品ID（新規作成のときは null）
let uploadedImageDataUrl = null;

document.addEventListener("DOMContentLoaded", () => {
  const data = PortfolioData.get();
  document.getElementById("sidebarTitle").innerHTML = `${data.siteTitle}<small>ADMIN</small>`;

  initSidebarNav();
  initWorksPage();
  initWorkForm();
  initProfilePage();
  initSnsPage();
  initCommissionPage();
  initSettingsPage();
});

/* ---------- サイドバーの切り替え ---------- */
function initSidebarNav() {
  const buttons = document.querySelectorAll(".admin-nav button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => showPage(btn.dataset.page));
  });
}

function showPage(pageId) {
  document.querySelectorAll(".admin-page").forEach((p) => p.classList.remove("active"));
  document.getElementById("page-" + pageId).classList.add("active");
  document.querySelectorAll(".admin-nav button").forEach((b) =>
    b.classList.toggle("active", b.dataset.page === pageId)
  );
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ============================================================
   作品管理
   ============================================================ */
function initWorksPage() {
  renderWorksList();

  document.getElementById("btnNewWork").addEventListener("click", () => openWorkForm(null));
  document.getElementById("btnCancelWork").addEventListener("click", () => showPage("works"));
  document.getElementById("btnCancelWork2").addEventListener("click", () => showPage("works"));
}

function renderWorksList() {
  const data = PortfolioData.get();
  const works = [...data.works].sort((a, b) => a.order - b.order);
  const list = document.getElementById("worksList");

  if (!works.length) {
    list.innerHTML = `<div class="empty-state">まだ作品がありません。「＋ 作品を追加」から最初の作品を登録しましょう。</div>`;
    return;
  }

  list.innerHTML = works
    .map(
      (w, i) => `
    <div class="work-row">
      <img src="${PortfolioData.getWorkImage(w)}" alt="">
      <div>
        <div class="title">${w.title}${w.featured ? " ★" : ""}</div>
        <div class="sub">${w.year}・${w.category}</div>
        <span class="status-tag ${w.published ? "on" : "off"}">${w.published ? "公開中" : "非公開"}</span>
      </div>
      <div class="order-btns">
        <button data-move="up" data-id="${w.id}" ${i === 0 ? "disabled" : ""}>▲</button>
        <button data-move="down" data-id="${w.id}" ${i === works.length - 1 ? "disabled" : ""}>▼</button>
      </div>
      <div class="row-actions">
        <button class="btn btn-sm" data-edit="${w.id}">編集</button>
        <button class="btn btn-sm btn-danger" data-delete="${w.id}">削除</button>
      </div>
    </div>`
    )
    .join("");

  list.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => openWorkForm(b.dataset.edit))
  );
  list.querySelectorAll("[data-delete]").forEach((b) =>
    b.addEventListener("click", () => {
      const work = PortfolioData.getWorkById(b.dataset.delete);
      if (confirm(`「${work.title}」を削除します。この操作は元に戻せません。よろしいですか？`)) {
        PortfolioData.deleteWork(b.dataset.delete);
        renderWorksList();
        showToast("作品を削除しました");
      }
    })
  );
  list.querySelectorAll("[data-move]").forEach((b) =>
    b.addEventListener("click", () => {
      moveWork(b.dataset.id, b.dataset.move);
    })
  );
}

function moveWork(id, direction) {
  const data = PortfolioData.get();
  const works = [...data.works].sort((a, b) => a.order - b.order);
  const idx = works.findIndex((w) => w.id === id);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= works.length) return;
  [works[idx], works[swapWith]] = [works[swapWith], works[idx]];
  PortfolioData.reorderWorks(works.map((w) => w.id));
  renderWorksList();
}

/* ---------- 作品の追加・編集フォーム ---------- */
function initWorkForm() {
  const drop = document.getElementById("imageDrop");
  const input = document.getElementById("imageInput");
  const preview = document.getElementById("imagePreview");
  const dropText = document.getElementById("imageDropText");

  drop.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImageDataUrl = e.target.result;
      preview.src = uploadedImageDataUrl;
      preview.style.display = "block";
      dropText.textContent = "クリックして画像を変更";
      markStep("step1", true);
    };
    reader.readAsDataURL(file);
  });

  ["fTitle", "fDescription"].forEach((id) => {
    document.getElementById(id).addEventListener("input", updateStepFlow);
  });

  document.getElementById("btnSaveWork").addEventListener("click", saveWorkForm);
}

function markStep(id, done) {
  document.getElementById(id).classList.toggle("done", done);
}

function updateStepFlow() {
  markStep("step2", document.getElementById("fTitle").value.trim().length > 0);
  markStep("step3", document.getElementById("fDescription").value.trim().length > 0);
}

function openWorkForm(id) {
  editingWorkId = id;
  uploadedImageDataUrl = null;
  const preview = document.getElementById("imagePreview");
  const dropText = document.getElementById("imageDropText");
  ["step1", "step2", "step3", "step4"].forEach((s) => markStep(s, false));

  if (id) {
    const w = PortfolioData.getWorkById(id);
    document.getElementById("workFormTitle").textContent = "作品を編集";
    document.getElementById("fTitle").value = w.title;
    document.getElementById("fYear").value = w.year;
    document.getElementById("fCategory").value = w.category;
    document.getElementById("fPeriod").value = w.period || "";
    document.getElementById("fDescription").value = w.description || "";
    document.getElementById("fPublished").checked = w.published;
    document.getElementById("fFeatured").checked = w.featured;
    uploadedImageDataUrl = w.image || null;
    preview.src = PortfolioData.getWorkImage(w);
    preview.style.display = "block";
    dropText.textContent = "クリックして画像を変更";
    markStep("step1", true);
    markStep("step2", true);
    markStep("step3", true);
  } else {
    document.getElementById("workFormTitle").textContent = "作品を追加";
    document.getElementById("fTitle").value = "";
    document.getElementById("fYear").value = new Date().getFullYear().toString();
    document.getElementById("fCategory").value = "オリジナル";
    document.getElementById("fPeriod").value = "";
    document.getElementById("fDescription").value = "";
    document.getElementById("fPublished").checked = true;
    document.getElementById("fFeatured").checked = false;
    preview.style.display = "none";
    dropText.textContent = "クリックして画像を選択";
  }
  showPage("workForm");
}

function saveWorkForm() {
  const title = document.getElementById("fTitle").value.trim();
  if (!title) {
    alert("タイトルを入力してください。");
    return;
  }
  const payload = {
    title,
    year: document.getElementById("fYear").value.trim(),
    category: document.getElementById("fCategory").value.trim() || "オリジナル",
    period: document.getElementById("fPeriod").value.trim(),
    description: document.getElementById("fDescription").value.trim(),
    published: document.getElementById("fPublished").checked,
    featured: document.getElementById("fFeatured").checked,
    image: uploadedImageDataUrl,
  };

  markStep("step4", true);

  if (editingWorkId) {
    PortfolioData.updateWork(editingWorkId, payload);
    showToast("作品を更新しました");
  } else {
    PortfolioData.addWork(payload);
    showToast("作品を公開しました");
  }
  renderWorksList();
  showPage("works");
}

/* ============================================================
   プロフィール
   ============================================================ */
function initProfilePage() {
  const data = PortfolioData.get();
  document.getElementById("pArtistName").value = data.artistName;
  document.getElementById("pTagline").value = data.tagline;
  document.getElementById("pBio").value = data.profile.bio;
  document.getElementById("pNote").value = data.profile.note || "";

  let likes = [...data.profile.likes];
  renderLikeTags(likes);

  const likeInput = document.getElementById("pLikeInput");
  likeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && likeInput.value.trim()) {
      e.preventDefault();
      likes.push(likeInput.value.trim());
      likeInput.value = "";
      renderLikeTags(likes);
    }
  });

  function renderLikeTags(arr) {
    const mount = document.getElementById("pLikesList");
    mount.innerHTML = arr
      .map((l, i) => `<span class="chip">${l}<button data-i="${i}">×</button></span>`)
      .join("");
    mount.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        arr.splice(Number(b.dataset.i), 1);
        renderLikeTags(arr);
      })
    );
  }

  document.getElementById("btnSaveProfile").addEventListener("click", () => {
    PortfolioData.updateProfile({
      bio: document.getElementById("pBio").value.trim(),
      note: document.getElementById("pNote").value.trim(),
      likes,
    });
    PortfolioData.updateSiteSettings({
      artistName: document.getElementById("pArtistName").value.trim(),
      tagline: document.getElementById("pTagline").value.trim(),
    });
    showToast("プロフィールを保存しました");
  });
}

/* ============================================================
   SNS
   ============================================================ */
function initSnsPage() {
  const data = PortfolioData.get();
  document.getElementById("sInstagram").value = data.sns.instagram || "";
  document.getElementById("sTwitter").value = data.sns.twitter || "";
  document.getElementById("sPixiv").value = data.sns.pixiv || "";

  document.getElementById("btnSaveSns").addEventListener("click", () => {
    PortfolioData.updateSns({
      instagram: document.getElementById("sInstagram").value.trim(),
      twitter: document.getElementById("sTwitter").value.trim(),
      pixiv: document.getElementById("sPixiv").value.trim(),
    });
    showToast("SNSリンクを保存しました");
  });
}

/* ============================================================
   依頼情報
   ============================================================ */
function initCommissionPage() {
  const data = PortfolioData.get();
  document.getElementById("cStatus").value = data.commission.status;
  document.getElementById("cNote").value = data.commission.note;

  let menu = [...data.commission.menu];
  renderMenu();

  document.getElementById("btnAddMenuItem").addEventListener("click", () => {
    menu.push({ name: "新しいメニュー", price: "準備中", note: "" });
    renderMenu();
  });

  document.getElementById("btnSaveCommission").addEventListener("click", () => {
    PortfolioData.updateCommission({
      status: document.getElementById("cStatus").value.trim(),
      note: document.getElementById("cNote").value.trim(),
      menu,
    });
    showToast("依頼情報を保存しました");
  });

  function renderMenu() {
    const mount = document.getElementById("commissionMenuList");
    mount.innerHTML = menu
      .map(
        (m, i) => `
      <div class="panel" style="background:#faf9f7;">
        <div class="form-grid">
          <div class="field"><label>名前</label><input type="text" data-menu="${i}" data-field="name" value="${m.name}"></div>
          <div class="field"><label>価格</label><input type="text" data-menu="${i}" data-field="price" value="${m.price}"></div>
          <div class="field full"><label>説明</label><input type="text" data-menu="${i}" data-field="note" value="${m.note || ""}"></div>
        </div>
        <button class="btn btn-sm btn-danger" data-remove-menu="${i}">このメニューを削除</button>
      </div>`
      )
      .join("");

    mount.querySelectorAll("input").forEach((inp) =>
      inp.addEventListener("input", () => {
        menu[inp.dataset.menu][inp.dataset.field] = inp.value;
      })
    );
    mount.querySelectorAll("[data-remove-menu]").forEach((b) =>
      b.addEventListener("click", () => {
        menu.splice(Number(b.dataset.removeMenu), 1);
        renderMenu();
      })
    );
  }
}

/* ============================================================
   サイト設定
   ============================================================ */
function initSettingsPage() {
  const data = PortfolioData.get();
  document.getElementById("stSiteTitle").value = data.siteTitle;
  document.getElementById("stHeroSub").value = data.heroSub || "";

  document.getElementById("btnSaveSettings").addEventListener("click", () => {
    PortfolioData.updateSiteSettings({
      siteTitle: document.getElementById("stSiteTitle").value.trim(),
      heroSub: document.getElementById("stHeroSub").value.trim(),
    });
    showToast("サイト設定を保存しました");
    document.getElementById("sidebarTitle").innerHTML =
      `${document.getElementById("stSiteTitle").value.trim()}<small>ADMIN</small>`;
  });
}
