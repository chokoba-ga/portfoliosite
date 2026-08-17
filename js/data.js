/* ============================================================
   data.js
   ------------------------------------------------------------
   サイトの「データ」を管理するファイルです。
   作品・プロフィール・SNS・依頼情報などは、すべてここを通して
   保存・読み込みされます。

   今は「ブラウザの localStorage」にデータを保存しています。
   これは無料・簡単ですが、【自分のブラウザの中だけ】に保存される
   ため、他の人のスマホやPCからは admin.html で編集した内容が
   見えません（サイトを見に来た人には、あなたが最後に「公開」した
   状態がちゃんと表示されるように、後述の「本番運用」の章で
   簡単な無料の切り替え方法を README にまとめています）。

   将来、他の保存方法（Firebase など）に切り替えたくなったときは、
   このファイルの中の「getData」「saveData」という2つの関数だけを
   直せば、他のファイルは一切変更しなくて済むように作ってあります。
   ============================================================ */

const STORAGE_KEY = "togebara_portfolio_v1";

/* ---------- 手描き風プレースホルダーイラストを自動生成する ----------
   実際のイラスト画像を差し替えるまでの「仮画像」です。
   毎回少しずつ違う表情・色になるように、簡単な乱数の種(seed)を
   使って自動生成しています。実際の作品を登録すると、この仮画像は
   使われなくなります。 */
function seededRandom(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function generatePlaceholderArt(seed, mood = "default") {
  const rand = seededRandom(String(seed));
  const w = 800, h = 1000;
  const eyeTilt = (rand() - 0.5) * 18; // 表情の角度
  const browTilt = (rand() - 0.5) * 24;
  const hueShift = Math.floor(rand() * 12) - 6;
  const red = `hsl(${350 + hueShift} 78% ${44 + rand() * 8}%)`;
  const redDeep = `hsl(${350 + hueShift} 70% 18%)`;
  const paper = "#f3ece2";
  const petals = Array.from({ length: 5 }).map((_, i) => {
    const a = (i / 5) * Math.PI * 2;
    const rx = 40 + rand() * 10;
    const cx = 400 + Math.cos(a) * 26;
    const cy = 150 + Math.sin(a) * 26;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.6}" fill="${red}" opacity="0.85" transform="rotate(${a * 57} ${cx} ${cy})"/>`;
  }).join("");
  const cracks = Array.from({ length: 3 }).map(() => {
    const x1 = 300 + rand() * 200, y1 = 300 + rand() * 300;
    const x2 = x1 + (rand() - 0.5) * 120, y2 = y1 + 80 + rand() * 120;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${red}" stroke-width="1.5" opacity="0.5"/>`;
  }).join("");

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="bg-${seed}" cx="50%" cy="35%" r="75%">
        <stop offset="0%" stop-color="#231a1c"/>
        <stop offset="100%" stop-color="#0c0a0a"/>
      </radialGradient>
      <filter id="grain-${seed}">
        <feTurbulence baseFrequency="0.9" numOctaves="2" result="noise"/>
        <feColorMatrix in="noise" type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.04"/></feComponentTransfer>
        <feComposite operator="over" in2="SourceGraphic"/>
      </filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg-${seed})"/>
    <!-- 顔の輪郭 -->
    <ellipse cx="400" cy="430" rx="230" ry="270" fill="${paper}" opacity="0.96"/>
    <!-- 前髪の影 -->
    <path d="M170,320 Q400,150 630,320 Q560,230 400,220 Q240,230 170,320 Z" fill="${redDeep}" opacity="0.9"/>
    <!-- 眉 -->
    <rect x="300" y="380" width="90" height="10" rx="5" fill="#151011" transform="rotate(${browTilt} 345 385)"/>
    <rect x="410" y="380" width="90" height="10" rx="5" fill="#151011" transform="rotate(${-browTilt} 455 385)"/>
    <!-- 目：強い感情を宿す表情 -->
    <path d="M300,430 Q345,${400 + eyeTilt} 390,430 Q345,460 300,430 Z" fill="#151011"/>
    <path d="M410,430 Q455,${400 - eyeTilt} 500,430 Q455,460 410,430 Z" fill="#151011"/>
    <circle cx="345" cy="425" r="7" fill="${red}"/>
    <circle cx="455" cy="425" r="7" fill="${red}"/>
    <!-- 涙、または赤い一筋 -->
    <path d="M470,450 q6,30 -4,55 q-10,-8 -4,-30 q4,-15 8,-25 Z" fill="${red}" opacity="0.9"/>
    <!-- 口 -->
    <path d="M370,540 Q400,${mood === "smile" ? 565 : 528} 430,540" stroke="#151011" stroke-width="6" fill="none" stroke-linecap="round"/>
    <!-- 棘の装飾フレーム -->
    <g opacity="0.8">
      <path d="M40,${h - 40} Q120,${h - 200} 60,${h - 320}" stroke="${red}" stroke-width="3" fill="none"/>
      <path d="M${w - 40},60 Q${w - 120},220 ${w - 60},360" stroke="${red}" stroke-width="3" fill="none"/>
    </g>
    ${petals}
    ${cracks}
    <rect width="${w}" height="${h}" filter="url(#grain-${seed})" opacity="0.5"/>
  </svg>`;

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg.replace(/\n\s+/g, " "));
}

/* ---------- 初期サンプルデータ（最初に一度だけ使われます） ---------- */
function seedDefaultData() {
  const works = [
    {
      id: "w1",
      title: "棘のくちづけ",
      year: "2026",
      category: "オリジナル",
      description:
        "「好き」と「痛い」は、たぶん似ている感情。棘のある花束を抱えた少女の、一瞬の表情を描きました。",
      period: "2026年 春",
      featured: true,
      published: true,
      image: null, // null の場合は自動生成されたプレースホルダーが使われます
      order: 0,
    },
    {
      id: "w2",
      title: "灰の誓い",
      year: "2025",
      category: "オリジナル",
      description: "何かを失った後の、静かな怒りと決意を表情に込めました。",
      period: "2025年 冬",
      featured: true,
      published: true,
      image: null,
      order: 1,
    },
    {
      id: "w3",
      title: "赤い糸、切れる音",
      year: "2025",
      category: "キャラクター",
      description: "運命の糸が切れる瞬間の、驚きと少しの安堵。",
      period: "2025年 秋",
      featured: true,
      published: true,
      image: null,
      order: 2,
    },
    {
      id: "w4",
      title: "夜宴の招待状",
      year: "2025",
      category: "キャラクター",
      description: "ゴシックドレスに身を包んだ少女。悪戯っぽい微笑みと、鋭い視線。",
      period: "2025年 夏",
      featured: false,
      published: true,
      image: null,
      order: 3,
    },
  ];

  return {
    siteTitle: "棘薔薇 -TOGEBARA-",
    artistName: "棘薔薇",
    tagline: "感情を、突き刺すように。",
    heroSub: "かわいさの中に、少しの毒を。",
    profile: {
      bio:
        "キャラクターの「表情」を中心に描いています。かわいらしさの中に、ほんの少しの毒と痛みを込めて。作品を見た人の心に、強い感情がふっと残るような絵を目指しています。",
      likes: ["ゴシック", "赤と黒と白", "棘のある花", "静かな狂気", "涙のモチーフ"],
      note: "活動名は現在仮のものです。少しずつ、この庭を育てています。",
    },
    commission: {
      status: "準備中",
      note: "現在、依頼受付の準備を進めています。もう少しだけお待ちください。",
      menu: [
        { name: "アイコン", price: "準備中", note: "SNS用の一枚絵アイコン" },
        { name: "立ち絵", price: "準備中", note: "全身のキャラクターイラスト" },
        { name: "一枚絵", price: "準備中", note: "背景ありのイラスト" },
        { name: "MVイラスト", price: "準備中", note: "楽曲用のイラスト" },
      ],
    },
    sns: {
      instagram: "",
      twitter: "",
      pixiv: "",
    },
    works,
  };
}

/* ---------- データの取得・保存 ----------
   ここだけ他の保存方法に差し替えれば、サイト全体が切り替わります。 */
function getData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedDefaultData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("データの読み込みに失敗しました。初期データを使用します。", e);
    return seedDefaultData();
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ---------- 作品まわりの便利関数 ---------- */
const PortfolioData = {
  get: getData,
  save: saveData,

  getWorks({ onlyPublished = true } = {}) {
    const data = getData();
    let works = [...data.works].sort((a, b) => a.order - b.order);
    if (onlyPublished) works = works.filter((w) => w.published);
    return works;
  },

  getWorkById(id) {
    const data = getData();
    return data.works.find((w) => w.id === id) || null;
  },

  getFeaturedWorks() {
    return this.getWorks().filter((w) => w.featured);
  },

  getWorkImage(work) {
    return work.image || generatePlaceholderArt(work.id, work.mood || "default");
  },

  addWork(work) {
    const data = getData();
    const id = "w" + Date.now();
    const order = data.works.length;
    data.works.push({
      id,
      title: work.title || "無題",
      year: work.year || new Date().getFullYear().toString(),
      category: work.category || "オリジナル",
      description: work.description || "",
      period: work.period || "",
      featured: !!work.featured,
      published: work.published !== false,
      image: work.image || null,
      order,
    });
    saveData(data);
    return id;
  },

  updateWork(id, updates) {
    const data = getData();
    const idx = data.works.findIndex((w) => w.id === id);
    if (idx === -1) return false;
    data.works[idx] = { ...data.works[idx], ...updates };
    saveData(data);
    return true;
  },

  deleteWork(id) {
    const data = getData();
    data.works = data.works.filter((w) => w.id !== id);
    data.works.forEach((w, i) => (w.order = i));
    saveData(data);
  },

  reorderWorks(orderedIds) {
    const data = getData();
    orderedIds.forEach((id, i) => {
      const w = data.works.find((x) => x.id === id);
      if (w) w.order = i;
    });
    saveData(data);
  },

  updateProfile(updates) {
    const data = getData();
    data.profile = { ...data.profile, ...updates };
    saveData(data);
  },

  updateSiteSettings(updates) {
    const data = getData();
    Object.assign(data, updates);
    saveData(data);
  },

  updateSns(updates) {
    const data = getData();
    data.sns = { ...data.sns, ...updates };
    saveData(data);
  },

  updateCommission(updates) {
    const data = getData();
    data.commission = { ...data.commission, ...updates };
    saveData(data);
  },
};

window.PortfolioData = PortfolioData;
window.generatePlaceholderArt = generatePlaceholderArt;
