const WEEK_FILES = Array.from({length:13}, (_,i) => `content/weeks/${String(i+1).padStart(2,'0')}.md`);
const GUEST_FILES = ['ohishi','alesha','seetha','albert','ishizaki'].map(id => `content/guests/${id}.md`);
const storeKey = 'reitaku-engineering-language';
let language = (() => { try { return localStorage.getItem(storeKey) || 'en'; } catch { return 'en'; } })();
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
function markCurrentPage() {
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a').forEach(a => {
    if (a.getAttribute('href') === current) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}
markCurrentPage();
const languageButton = document.createElement('button');
languageButton.className = 'language-toggle';
languageButton.type = 'button';
nav.append(languageButton);
let originalTitle = document.title;
function translateStatic() {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-ja]').forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.innerHTML;
    el.innerHTML = language === 'ja' ? el.dataset.ja : el.dataset.en;
  });
  document.title = language === 'ja' ? originalTitle.replace('Home','ホーム').replace('Agenda','授業予定').replace('Guest speakers','ゲスト講師').replace('Reaction papers','リアクションペーパー').replace('Group project','グループ課題').replace('Resources','資料') : originalTitle;
  languageButton.textContent = language === 'ja' ? 'EN' : 'JP';
  languageButton.setAttribute('aria-label', language === 'ja' ? 'Switch to English' : '日本語に切り替える');
}
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function parseContent(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('Missing Markdown front matter');
  const meta = {};
  match[1].split(/\r?\n/).forEach(line => {
    const idx = line.indexOf(':');
    if (idx > -1) meta[line.slice(0,idx).trim()] = line.slice(idx+1).trim();
  });
  const sections = {};
  match[2].split(/^## /m).slice(1).forEach(block => {
    const idx = block.indexOf('\n');
    sections[block.slice(0,idx).trim()] = block.slice(idx+1).trim();
  });
  return {...meta, sections};
}
async function getFiles(files) {
  return Promise.all(files.map(async file => {
    const response = await fetch(file, {cache:'no-cache'});
    if (!response.ok) throw new Error(`${file} (${response.status})`);
    return parseContent(await response.text());
  }));
}
const localized = (item,field) => item[language === 'ja' ? `${field}_ja` : field] || item[field] || '';
function dateLabel(value, options={month:'short',day:'numeric',year:'numeric'}) {
  return new Intl.DateTimeFormat(language === 'ja' ? 'ja-JP' : 'en-US', {...options,timeZone:'Asia/Tokyo'}).format(new Date(`${value}T00:00:00+09:00`));
}
function inlineMarkdown(value) {
  return escapeHtml(value).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_,name,url) => `<a href="${url}" target="_blank" rel="noopener">${name} ↗</a>`).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
}
function sectionHtml(value) {
  if (!value) return '';
  return value.split('\n').filter(Boolean).map(line => line.startsWith('- ') ? `<p class="resource-item">${inlineMarkdown(line.slice(2))}</p>` : `<p>${inlineMarkdown(line)}</p>`).join('');
}
const QUESTIONS_URL = 'https://script.google.com/macros/s/AKfycbz7kuUplBbrLkwNnpCSfE_fH3Ua1PL3rd3Ml84l4-oc13gfjQmDaCY1OF4AkGNyiwEF/exec?lecture=engineer';
const COMPUTER_SCIENCE_MAP_TERMS = [
  ['Computational complexity','計算複雑性',22.2,10.5],
  ['NP-complete','NP完全',18,16],
  ['BQP','BQP（量子計算の複雑性クラス）',17,23],
  ['P','P（多項式時間）',17,27],
  ['Information theory','情報理論',37.7,12],
  ['Coding theory','符号理論',39,20],
  ['Cryptography','暗号理論',49.3,10.5],
  ['Monitor','モニター',57,13],
  ['GPU','GPU（画像処理装置）',54,19],
  ['SSD','SSD（半導体記憶装置）',60,17],
  ['Hardware','ハードウェア',69,15],
  ['RAM','RAM（主記憶装置）',60,22],
  ['CPU','CPU（中央処理装置）',55,25],
  ['Motherboard','マザーボード',60,28],
  ['Data structures','データ構造',68,25],
  ['Scheduling','スケジューリング',81,11.6],
  ['Scheduler','スケジューラ',79,19],
  ['Multiprocessing','マルチプロセッシング',79,25],
  ['Computer architecture','コンピュータ・アーキテクチャ',97.7,11.6],
  ['Central processing unit','中央処理装置',87,17],
  ['Control unit','制御装置',87,19],
  ['Arithmetic logic unit','算術論理装置',87,22],
  ['Memory unit','記憶装置',87,25],
  ['Theoretical computer science','理論計算機科学',50.6,26],
  ['Computability theory','計算可能性理論',39.6,29.5],
  ['Turing machine','チューリングマシン',57.7,30.4],
  ['Computer engineering','コンピュータ工学',90.3,28],
  ['Algorithms','アルゴリズム',15.4,35.5],
  ['Logic','論理学',22.5,33],
  ['Graph theory','グラフ理論',23.2,45],
  ['Computational geometry','計算幾何学',30,45],
  ['Automata theory','オートマトン理論',37,45.5],
  ['Quantum computation','量子計算',45,45],
  ['And more','その他',54,45],
  ['Formal methods','形式手法',64,37],
  ['Parallel programming','並列プログラミング',60,44],
  ['Software and programming languages','ソフトウェアとプログラミング言語',93.2,32.3],
  ['Web apps','ウェブアプリ',92,35],
  ['Browser','ブラウザー',90,37],
  ['Applications (software)','アプリケーションソフト',89,39],
  ['BIOS','BIOS（基本入出力システム）',85,42],
  ['Silicon','シリコン',83,44],
  ['Compilers','コンパイラ',90.5,41],
  ['Software engineering','ソフトウェア工学',74.8,47.3],
  ['Operating systems','オペレーティングシステム',85,47.5],
  ['Networking','ネットワーク',93,47],
  ['Data management','データ管理',90,44],
  ['Analysis of algorithms','アルゴリズム解析',9,54],
  ['Algorithmic complexity','アルゴリズムの計算量',16,54],
  ['Machine learning','機械学習',16,58.5],
  ['Optimisation','最適化',29.3,56.5],
  ['Boolean satisfiability','ブール充足可能性問題',47,56.1],
  ['Supercomputing','スーパーコンピューティング',60,58.3],
  ['Computer graphics','コンピュータグラフィックス',73,61],
  ['Performance','性能',89,55],
  ['Artificial intelligence','人工知能',32,69],
  ['Robotics','ロボット工学',40,70],
  ['Computer vision','コンピュータビジョン',15,72],
  ['Find the humans','人を探そう',15,75],
  ['Image processing','画像処理',16.4,96],
  ['Natural language processing','自然言語処理',36,84.1],
  ['Chatbots','チャットボット',26,87],
  ['Knowledge representation','知識表現',43,96],
  ['Applications','応用分野',58,77.5],
  ['Telepresence','テレプレゼンス',49,84],
  ['Virtual reality','仮想現実',73,79],
  ['Augmented reality','拡張現実',66,83],
  ['Human-computer interaction','ヒューマン・コンピュータ・インタラクション',78,84],
  ['Simulation','シミュレーション',85.5,79.7],
  ['Computational science','計算科学',90,63],
  ['Hacking','ハッキング',90,65],
  ['Internet of things','モノのインターネット',87,96],
  ['Big data','ビッグデータ',89,80]
];
function computerScienceMapTermsHtml() {
  return COMPUTER_SCIENCE_MAP_TERMS.map(([english,japanese,x,y]) => `<button class="map-term" style="--x:${x}%;--y:${y}%" data-map-term="${english}" data-map-ja="${japanese}"><span>${english}</span><span lang="ja">${japanese}</span></button>`).join('');
}
function weekOneMaterialsHtml() {
  const ja = language === 'ja';
  return `<section class="week-one-materials" aria-labelledby="week-one-materials-title">
    <div class="week-one-topline"><div><p class="section-label">${ja ? '第1回 · イントロダクション' : 'WEEK 01 · INTRODUCTION'}</p><h3 id="week-one-materials-title">${ja ? 'エンジニアを考える' : 'What engineers do'}</h3></div>
      <a class="question-cta" href="${QUESTIONS_URL}" target="_blank" rel="noopener"><span>${ja ? '質問がありますか？' : 'Have a question?'}</span><strong>${ja ? '授業への質問を送る' : 'Ask a question about this class'} <b aria-hidden="true">↗</b></strong><small>${ja ? '質問フォームを新しいタブで開く' : 'Open the student question form'}</small></a>
    </div>
    <div class="week-one-material-grid">
      <section class="week-one-slide-panel" aria-labelledby="week-one-slides-title"><header class="material-heading"><div><p>2026 PRESENTATION · 57 SLIDES</p><h4 id="week-one-slides-title">${ja ? '講義スライド' : 'Lecture slides'}</h4></div><a href="viewer.html">${ja ? 'PDFビューアを開く →' : 'Open PDF viewer →'}</a></header>
        <div class="week-one-slideshow" data-slideshow role="group" aria-label="${ja ? '2026年度第1回講義スライド' : '2026 Week 1 lecture slides'}" tabindex="0"><div class="slide-stage"><img data-slide-image src="assets/week01/slides-2026/slide-01.jpg" alt="${ja ? '2026年度第1回スライド 1 / 57' : '2026 Week 1 lecture slide 1 of 57'}"></div><div class="slide-toolbar"><button type="button" data-slide-step="-1" aria-label="${ja ? '前のスライド' : 'Previous slide'}">←</button><output data-slide-count aria-live="polite">1 / 57</output><button type="button" data-slide-step="1" aria-label="${ja ? '次のスライド' : 'Next slide'}">→</button></div></div>
        <p class="slide-archive-link"><a href="viewer.html?deck=2025">${ja ? '2025年度の参考スライド →' : '2025 reference slides →'}</a></p>
      </section>
      <section class="engineer-map-panel" aria-labelledby="engineer-map-title"><header class="material-heading"><div><p>2025 LECTURE · TWO MAPS</p><h4 id="engineer-map-title">${ja ? '2つのマップを探索' : 'Explore the maps'}</h4></div></header>
        <div class="map-tabs" id="week-one-map-tabs" role="tablist" aria-label="${ja ? '地図を選ぶ' : 'Choose a map'}"><button id="map-tab-engineering" type="button" role="tab" aria-selected="true" aria-controls="map-panel-engineering" tabindex="0">${ja ? '工学マップ' : 'Engineering'}</button><button id="map-tab-computer-science" type="button" role="tab" aria-selected="false" aria-controls="map-panel-computer-science" tabindex="-1">${ja ? 'コンピュータサイエンス' : 'Computer Science'}</button></div>
        <div class="map-tab-panel" id="map-panel-engineering" role="tabpanel" aria-labelledby="map-tab-engineering">
        <div class="engineer-map-viewer" id="engineer-map-viewer" style="--map-ratio:2183 / 1643;--map-width-at-height:132.87vh;--map-height-at-width:75.27vw" tabindex="0" role="application" aria-label="${ja ? 'Engineer Map。クリックして全画面表示。全画面ではドラッグとスクロールで地図を操作できます。' : 'Engineer Map. Click to open fullscreen; then drag and scroll to explore.'}" data-map-viewer>
          <div class="map-canvas"><img class="engineer-map-image" src="assets/week01/engineer-map.png" alt="A map showing the fields and connections within engineering" draggable="false"><div class="map-hotspots" aria-label="${ja ? '日本語訳のある分野名' : 'Engineering fields with Japanese translations'}">
            <button class="map-term" style="--x:14%;--y:5%" data-map-term="Civil engineering" data-map-ja="土木工学"><span>Civil engineering</span><span lang="ja">土木工学</span></button>
            <button class="map-term" style="--x:30%;--y:8%" data-map-term="Geological engineering" data-map-ja="地質工学"><span>Geological engineering</span><span lang="ja">地質工学</span></button>
            <button class="map-term" style="--x:50%;--y:13%" data-map-term="Fluid mechanics" data-map-ja="流体力学"><span>Fluid mechanics</span><span lang="ja">流体力学</span></button>
            <button class="map-term" style="--x:78%;--y:4%" data-map-term="Satellites" data-map-ja="人工衛星"><span>Satellites</span><span lang="ja">人工衛星</span></button>
            <button class="map-term" style="--x:85%;--y:10%" data-map-term="Aerodynamics" data-map-ja="空気力学"><span>Aerodynamics</span><span lang="ja">空気力学</span></button>
            <button class="map-term" style="--x:90%;--y:2.2%" data-map-term="Aerospace engineering" data-map-ja="航空宇宙工学"><span>Aerospace engineering</span><span lang="ja">航空宇宙工学</span></button>
            <button class="map-term" style="--x:65.8%;--y:15%" data-map-term="Marine engineering" data-map-ja="海洋工学"><span>Marine engineering</span><span lang="ja">海洋工学</span></button>
            <button class="map-term" style="--x:73%;--y:15%" data-map-term="Naval engineering" data-map-ja="造船工学"><span>Naval engineering</span><span lang="ja">造船工学</span></button>
            <button class="map-term" style="--x:9.8%;--y:29%" data-map-term="Structural engineering" data-map-ja="構造工学"><span>Structural engineering</span><span lang="ja">構造工学</span></button>
            <button class="map-term" style="--x:22.2%;--y:36%" data-map-term="Architectural engineering" data-map-ja="建築工学"><span>Architectural engineering</span><span lang="ja">建築工学</span></button>
            <button class="map-term" style="--x:30.2%;--y:36%" data-map-term="Agricultural engineering" data-map-ja="農業工学"><span>Agricultural engineering</span><span lang="ja">農業工学</span></button>
            <button class="map-term" style="--x:73.1%;--y:34%" data-map-term="Materials engineering" data-map-ja="材料工学"><span>Materials engineering</span><span lang="ja">材料工学</span></button>
            <button class="map-term" style="--x:89.6%;--y:34%" data-map-term="Audio engineering" data-map-ja="音響工学"><span>Audio engineering</span><span lang="ja">音響工学</span></button>
            <button class="map-term" style="--x:27.7%;--y:53%" data-map-term="Environmental engineering" data-map-ja="環境工学"><span>Environmental engineering</span><span lang="ja">環境工学</span></button>
            <button class="map-term" style="--x:14.8%;--y:50%" data-map-term="Nuclear engineering" data-map-ja="原子力工学"><span>Nuclear engineering</span><span lang="ja">原子力工学</span></button>
            <button class="map-term" style="--x:54.8%;--y:47%" data-map-term="Manufacturing engineering" data-map-ja="生産工学"><span>Manufacturing engineering</span><span lang="ja">生産工学</span></button>
            <button class="map-term" style="--x:76%;--y:53%" data-map-term="Automotive engineering" data-map-ja="自動車工学"><span>Automotive engineering</span><span lang="ja">自動車工学</span></button>
            <button class="map-term" style="--x:62.5%;--y:58%" data-map-term="Robotics and mechatronics" data-map-ja="ロボット工学・メカトロニクス"><span>Robotics and mechatronics</span><span lang="ja">ロボット工学・メカトロニクス</span></button>
            <button class="map-term" style="--x:49.5%;--y:61%" data-map-term="Industrial engineering" data-map-ja="産業工学"><span>Industrial engineering</span><span lang="ja">産業工学</span></button>
            <button class="map-term" style="--x:67.5%;--y:53%" data-map-term="Mechanical engineering" data-map-ja="機械工学"><span>Mechanical engineering</span><span lang="ja">機械工学</span></button>
            <button class="map-term" style="--x:95.1%;--y:52.8%" data-map-term="Electrical engineering" data-map-ja="電気工学"><span>Electrical engineering</span><span lang="ja">電気工学</span></button>
            <button class="map-term" style="--x:14.4%;--y:63%" data-map-term="Power and energy systems" data-map-ja="電力・エネルギーシステム"><span>Power and energy systems</span><span lang="ja">電力・エネルギーシステム</span></button>
            <button class="map-term" style="--x:12.9%;--y:82%" data-map-term="Chemical engineering" data-map-ja="化学工学"><span>Chemical engineering</span><span lang="ja">化学工学</span></button>
            <button class="map-term" style="--x:46.9%;--y:80%" data-map-term="Biomedical engineering" data-map-ja="生体医工学"><span>Biomedical engineering</span><span lang="ja">生体医工学</span></button>
            <button class="map-term" style="--x:79.2%;--y:76%" data-map-term="Photonics" data-map-ja="フォトニクス・光工学"><span>Photonics</span><span lang="ja">フォトニクス・光工学</span></button>
            <button class="map-term" style="--x:92.3%;--y:83%" data-map-term="Computer engineering" data-map-ja="コンピュータ工学"><span>Computer engineering</span><span lang="ja">コンピュータ工学</span></button>
            <button class="map-term" style="--x:82.5%;--y:90%" data-map-term="Software engineering" data-map-ja="ソフトウェア工学"><span>Software engineering</span><span lang="ja">ソフトウェア工学</span></button>
            <button class="map-term" style="--x:80%;--y:92%" data-map-term="Network engineering" data-map-ja="ネットワーク工学"><span>Network engineering</span><span lang="ja">ネットワーク工学</span></button>
            <button class="map-term" style="--x:89.3%;--y:91%" data-map-term="Data engineering" data-map-ja="データ工学"><span>Data engineering</span><span lang="ja">データ工学</span></button>
            <button class="map-term" style="--x:52%;--y:95%" data-map-term="Bio-engineering" data-map-ja="生物工学"><span>Bio-engineering</span><span lang="ja">生物工学</span></button>
          </div></div>
          <p class="map-viewer-instruction">${ja ? '丸印にカーソルを合わせると日本語訳' : 'Hover a marker for the Japanese translation'}</p><span class="map-open-cue" aria-hidden="true">${ja ? 'クリックして全画面 ↗' : 'Click to open fullscreen ↗'}</span><div class="map-viewer-toolbar" aria-label="${ja ? '地図の操作' : 'Map controls'}"><button type="button" data-map-action="out" aria-label="${ja ? '縮小' : 'Zoom out'}">−</button><output data-map-zoom aria-live="polite">100%</output><button type="button" data-map-action="in" aria-label="${ja ? '拡大' : 'Zoom in'}">+</button><button type="button" data-map-action="reset">${ja ? 'リセット' : 'Reset'}</button><button type="button" data-map-action="fullscreen" aria-pressed="false">${ja ? '全画面' : 'Fullscreen'}</button></div>
        </div><p class="map-viewer-hint">${ja ? 'クリックして全画面表示 · 全画面では丸印にカーソルを合わせると日本語訳' : 'Click the map for fullscreen · In fullscreen, hover a marker for its Japanese translation'}</p><p class="map-original-link"><a href="assets/week01/engineer-map.png" target="_blank" rel="noopener">${ja ? 'Engineer Mapの原寸画像 ↗' : 'Open the original Engineer Map ↗'}</a></p>
        </div>
        <div class="map-tab-panel" id="map-panel-computer-science" role="tabpanel" aria-labelledby="map-tab-computer-science" hidden>
          <div class="engineer-map-viewer" id="computer-science-map-viewer" style="--map-ratio:3840 / 2704;--map-width-at-height:142.01vh;--map-height-at-width:70.42vw" tabindex="0" role="application" aria-label="${ja ? 'コンピュータサイエンスの地図。クリックして全画面表示。全画面ではドラッグとスクロールで操作できます。' : 'Map of Computer Science. Click to open fullscreen; then drag and scroll to explore.'}" data-map-viewer>
            <div class="map-canvas"><img class="engineer-map-image" src="assets/week01/computer-science-map.png" alt="Map of Computer Science by Dominic Walliman" draggable="false"><div class="map-hotspots" aria-label="${ja ? 'コンピュータサイエンスの用語と日本語訳' : 'Computer science terms with Japanese translations'}">${computerScienceMapTermsHtml()}</div></div>
            <p class="map-viewer-instruction">${ja ? '丸印にカーソルを合わせると日本語訳' : 'Hover a marker for the Japanese translation'}</p><span class="map-open-cue" aria-hidden="true">${ja ? 'クリックして全画面 ↗' : 'Click to open fullscreen ↗'}</span><div class="map-viewer-toolbar" aria-label="${ja ? '地図の操作' : 'Map controls'}"><button type="button" data-map-action="out" aria-label="${ja ? '縮小' : 'Zoom out'}">−</button><output data-map-zoom aria-live="polite">100%</output><button type="button" data-map-action="in" aria-label="${ja ? '拡大' : 'Zoom in'}">+</button><button type="button" data-map-action="reset">${ja ? 'リセット' : 'Reset'}</button><button type="button" data-map-action="fullscreen" aria-pressed="false">${ja ? '全画面' : 'Fullscreen'}</button></div>
          </div><p class="map-viewer-hint">${ja ? 'クリックして全画面表示 · 全画面では丸印にカーソルを合わせると日本語訳' : 'Click the map for fullscreen · In fullscreen, hover a marker for its Japanese translation'}</p><p class="map-original-link"><a href="assets/week01/computer-science-map.png" target="_blank" rel="noopener">${ja ? 'Computer Science Mapの原寸画像 ↗' : 'Open the original Computer Science map ↗'}</a> · Dominic Walliman, 2017</p>
        </div>
      </section>
    </div>
  </section>`;
}
function initEngineerMapViewers() {
  document.querySelectorAll('[data-map-viewer]:not([data-ready])').forEach(viewer => {
    viewer.dataset.ready = 'true';
    viewer.querySelectorAll('[data-map-term]').forEach(term => term.setAttribute('aria-label', `${term.dataset.mapTerm}: ${term.dataset.mapJa}`));
    const image = viewer.querySelector('.engineer-map-image');
    const canvas = viewer.querySelector('.map-canvas');
    const output = viewer.querySelector('[data-map-zoom]');
    const state = {scale:1, x:0, y:0, pointer:null, startX:0, startY:0, originX:0, originY:0};
    const isFullscreen = () => document.fullscreenElement === viewer || viewer.classList.contains('is-fullscreen-fallback');
    const paint = () => {
      canvas.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`;
      output.value = `${Math.round(state.scale * 100)}%`;
      output.textContent = output.value;
    };
    const zoomAt = (factor, px = viewer.clientWidth / 2, py = viewer.clientHeight / 2) => {
      const previous = state.scale;
      state.scale = Math.max(1, Math.min(8, previous * factor));
      const ratio = state.scale / previous;
      state.x = px - viewer.clientWidth / 2 - (px - viewer.clientWidth / 2 - state.x) * ratio;
      state.y = py - viewer.clientHeight / 2 - (py - viewer.clientHeight / 2 - state.y) * ratio;
      if (state.scale === 1) { state.x = 0; state.y = 0; }
      paint();
    };
    viewer.querySelectorAll('[data-map-action]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.mapAction === 'in') zoomAt(1.2);
      else if (button.dataset.mapAction === 'out') zoomAt(1 / 1.2);
      else { state.scale = 1; state.x = 0; state.y = 0; paint(); }
    }));
    viewer.addEventListener('wheel', event => {
      if (!isFullscreen()) return;
      event.preventDefault();
      const rect = viewer.getBoundingClientRect();
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewer.clientHeight : 1);
      const factor = Math.exp(-Math.max(-160, Math.min(160, pixels)) * .001);
      zoomAt(factor, event.clientX - rect.left, event.clientY - rect.top);
    }, {passive:false});
    viewer.addEventListener('pointerdown', event => {
      if (!isFullscreen()) return;
      if (event.target.closest('.map-viewer-toolbar, .map-term')) return;
      state.pointer = event.pointerId; state.startX = event.clientX; state.startY = event.clientY; state.originX = state.x; state.originY = state.y;
      viewer.setPointerCapture(event.pointerId); viewer.classList.add('is-dragging');
    });
    viewer.addEventListener('pointermove', event => {
      if (state.pointer !== event.pointerId) return;
      state.x = state.originX + event.clientX - state.startX; state.y = state.originY + event.clientY - state.startY; paint();
    });
    const stopDrag = event => { if (state.pointer !== event.pointerId) return; state.pointer = null; viewer.classList.remove('is-dragging'); };
    viewer.addEventListener('pointerup', stopDrag); viewer.addEventListener('pointercancel', stopDrag);
    viewer.addEventListener('keydown', event => {
      if (!isFullscreen()) {
        if (event.target === viewer && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openFullscreen(); }
        return;
      }
      if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomAt(1.25); }
      else if (event.key === '-') { event.preventDefault(); zoomAt(1 / 1.25); }
      else if (event.key === '0') { event.preventDefault(); state.scale = 1; state.x = 0; state.y = 0; paint(); }
    });
    const fullscreenButton = viewer.querySelector('[data-map-action="fullscreen"]');
    const setFullscreenState = () => {
      const active = isFullscreen();
      fullscreenButton.setAttribute('aria-pressed', String(active));
      fullscreenButton.textContent = active ? (language === 'ja' ? '全画面を終了' : 'Exit fullscreen') : (language === 'ja' ? '全画面' : 'Fullscreen');
      if (!active) { state.scale = 1; state.x = 0; state.y = 0; paint(); }
    };
    const openFullscreen = async () => {
      if (viewer.requestFullscreen) {
        try { await viewer.requestFullscreen(); }
        catch { viewer.classList.add('is-fullscreen-fallback'); document.body.classList.add('map-fullscreen-open'); }
      } else { viewer.classList.add('is-fullscreen-fallback'); document.body.classList.add('map-fullscreen-open'); }
      setFullscreenState();
    };
    viewer.addEventListener('click', event => {
      if (!isFullscreen() && event.target.closest('.map-canvas')) openFullscreen();
    });
    fullscreenButton.addEventListener('click', async () => {
      if (isFullscreen()) {
        if (document.fullscreenElement) await document.exitFullscreen();
        else { viewer.classList.remove('is-fullscreen-fallback'); document.body.classList.remove('map-fullscreen-open'); }
      } else await openFullscreen();
      setFullscreenState();
    });
    viewer.addEventListener('keydown', event => {
      if (event.key === 'Escape' && viewer.classList.contains('is-fullscreen-fallback')) {
        viewer.classList.remove('is-fullscreen-fallback');
        document.body.classList.remove('map-fullscreen-open');
        setFullscreenState();
      }
    });
    document.addEventListener('fullscreenchange', setFullscreenState);
    paint();
  });
  document.querySelectorAll('[data-slideshow]:not([data-ready])').forEach(slideshow => {
    slideshow.dataset.ready = 'true';
    const image = slideshow.querySelector('[data-slide-image]');
    const count = slideshow.querySelector('[data-slide-count]');
    const buttons = [...slideshow.querySelectorAll('[data-slide-step]')];
    let current = 1;
    const show = page => {
      current = Math.max(1, Math.min(57, page));
      image.src = `assets/week01/slides-2026/slide-${String(current).padStart(2,'0')}.jpg`;
      image.alt = `${language === 'ja' ? '2026年度第1回スライド' : '2026 Week 1 lecture slide'} ${current} / 57`;
      count.value = `${current} / 57`; count.textContent = count.value;
      buttons[0].disabled = current === 1; buttons[1].disabled = current === 57;
    };
    buttons.forEach(button => button.addEventListener('click', () => show(current + Number(button.dataset.slideStep))));
    slideshow.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
      else if (event.key === 'Home') { event.preventDefault(); show(1); }
      else if (event.key === 'End') { event.preventDefault(); show(57); }
    });
    show(current);
  });
}
function initWeekOneMapTabs() {
  const tabs = [...document.querySelectorAll('#week-one-map-tabs [role="tab"]')];
  if (!tabs.length) return;
  const activate = index => tabs.forEach((tab, i) => {
    const selected = i === index;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
  });
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(index));
    tab.addEventListener('keydown', event => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(next);
      tabs[next].focus();
    });
  });
}
let weeks = [], guests = [];
const agendaOpenState = new Map();
function renderHome() {
  const target = document.querySelector('#next-class'); if (!target) return;
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const next = weeks.find(w => w.date >= today) || weeks.at(-1);
  if (!next) return;
  const title = localized(next,'title');
  target.innerHTML = `<div><p class="kicker">${language === 'ja' ? '第' + next.week + '回 · ' : 'Week ' + next.week + ' · '}${escapeHtml(dateLabel(next.date))}</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(localized(next,'overview') || (language === 'ja' ? '詳細は後日案内します。' : 'Details forthcoming.'))}</p></div><a class="button button-light" href="agenda.html#week-${escapeHtml(next.week)}">${language === 'ja' ? '授業予定を開く' : 'Open this week'}</a>`;
}
function renderAgenda() {
  const target = document.querySelector('#agenda-list'); if (!target) return;
  target.querySelectorAll('details.agenda-more').forEach(details => agendaOpenState.set(details.dataset.week, details.open));
  const planning = new URLSearchParams(location.search).has('planning');
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  target.innerHTML = weeks.map(w => {
    const guest = guests.find(g => g.id === w.guest_id);
    const speaker = guest ? `<a href="guests.html#${escapeHtml(guest.id)}">${escapeHtml(localized(guest,'name'))} ↗</a>` : '';
    const summary = localized(w,'overview') || (language === 'ja' ? '詳細は後日案内します。' : 'Details forthcoming.');
    const sections = [language === 'ja' ? 'Reaction JP' : 'Reaction',language === 'ja' ? 'Materials JP' : 'Materials','Resources'].filter(key => w.sections[key]);
    const details = sections.map(key => `<div class="detail-block"><h3>${key === 'Resources' ? (language === 'ja' ? '参考資料' : 'Background resource') : key.includes('Reaction') ? (language === 'ja' ? '振り返り' : 'Reflection') : (language === 'ja' ? '資料' : 'Materials')}</h3>${sectionHtml(w.sections[key])}</div>`).join('');
    const isOpen = agendaOpenState.get(w.week) ?? (Number(w.week) === 1 || planning || w.date <= today);
    return `<article class="agenda-week" id="week-${escapeHtml(w.week)}"><div class="agenda-week-heading"><div><span class="week-number">${String(w.week).padStart(2,'0')}</span><p class="week-date">${escapeHtml(dateLabel(w.date,{month:'short',day:'numeric'}))}</p></div><div class="agenda-week-title"><p>${language === 'ja' ? '木曜日 · 4限' : 'Thursday · Period 4'} · ${escapeHtml(dateLabel(w.date))}</p><h2>${escapeHtml(localized(w,'title'))}</h2><p class="speaker-line">${speaker}</p></div></div><details class="agenda-more" data-week="${escapeHtml(w.week)}" ${isOpen ? 'open' : ''}><summary><span class="agenda-label-closed">${language === 'ja' ? '授業の詳細を見る' : 'Expand week details'}</span><span class="agenda-label-open">${language === 'ja' ? '授業の詳細を閉じる' : 'Collapse week details'}</span><span class="agenda-summary-symbol" aria-hidden="true"></span></summary><div class="agenda-content"><p class="agenda-overview">${escapeHtml(summary)}</p>${details}</div>${Number(w.week) === 1 ? weekOneMaterialsHtml() : ''}</details></article>`;
  }).join('') + `<p class="schedule-note">${language === 'ja' ? '最終発表は2回を予定しています。もう一回の日程は未定です。' : 'Two final presentation sessions are intended. The second date is to be confirmed.'}</p>`;
  target.querySelectorAll('details.agenda-more').forEach(details => details.addEventListener('toggle', () => agendaOpenState.set(details.dataset.week, details.open)));
  initEngineerMapViewers();
  initWeekOneMapTabs();
}
function renderGuests() {
  const target = document.querySelector('#guest-list'); if (!target) return;
  document.querySelector('#guest-index').innerHTML = guests.map(g => `<a href="#${escapeHtml(g.id)}">${escapeHtml(localized(g,'name'))}</a>`).join('');
  target.innerHTML = guests.map(g => {
    const connectedWeek = weeks.find(w => w.week === g.week);
    const photo = g.image ? `<img class="guest-photo" src="content/guests/${encodeURIComponent(g.image)}" alt="${escapeHtml(localized(g,'name'))}" loading="lazy">` : '<div class="guest-photo guest-placeholder" aria-hidden="true">RE</div>';
    return `<article class="guest" id="${escapeHtml(g.id)}"><div><p class="eyebrow">${language === 'ja' ? 'ゲスト講師 · ' : 'Guest speaker · '}${escapeHtml(dateLabel(connectedWeek.date))}</p><h2>${escapeHtml(localized(g,'name'))}</h2>${photo}</div><div><p class="guest-role">${escapeHtml(localized(g,'role'))}</p><div class="guest-bio"><h3>${language === 'ja' ? '略歴' : 'Bio'}</h3>${sectionHtml(g.sections[language === 'ja' ? 'Bio JP' : 'Bio'])}</div>${g.sections['Background resource'] ? `<div class="detail-block"><h3>${language === 'ja' ? '背景資料' : 'Background resource'}</h3>${sectionHtml(g.sections['Background resource'])}</div>` : ''}<p><a class="text-link" href="agenda.html#week-${escapeHtml(g.week)}">${language === 'ja' ? '授業予定を見る →' : 'See this class in the agenda →'}</a></p></div></article>`;
  }).join('');
}
function render() { translateStatic(); renderHome(); renderAgenda(); renderGuests(); }
languageButton.addEventListener('click', () => {
  language = language === 'en' ? 'ja' : 'en';
  try { localStorage.setItem(storeKey,language); } catch {}
  render();
});
render();
Promise.all([getFiles(WEEK_FILES),getFiles(GUEST_FILES)]).then(([loadedWeeks,loadedGuests]) => {
  weeks = loadedWeeks; guests = loadedGuests; render();
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}).catch(error => {
  for (const id of ['agenda-list','guest-list','next-class']) {
    const target = document.getElementById(id);
    if (target) target.textContent = `${language === 'ja' ? '内容を読み込めませんでした' : 'Could not load course content'}: ${error.message}`;
  }
});

// The in-app preview can retain the first document on a full-page navigation.
// Load course pages within the same document so its links work there as well.
async function openCoursePage(url, addHistory = true) {
  const response = await fetch(url.pathname, {cache:'no-cache'});
  if (!response.ok) throw new Error(`Page could not be loaded (${response.status})`);
  const next = new DOMParser().parseFromString(await response.text(), 'text/html');
  const nextMain = next.querySelector('main');
  if (!nextMain) throw new Error('Page content missing');
  document.querySelector('main').replaceWith(document.importNode(nextMain, true));
  document.body.dataset.page = next.body.dataset.page;
  originalTitle = next.title;
  if (addHistory) history.pushState(null, '', url);
  markCurrentPage();
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded','false');
  render();
  if (url.hash) document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();
  else window.scrollTo(0,0);
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || !/\/(index|agenda|guests|reactions|project|resources)\.html$/.test(url.pathname)) return;
  if (url.pathname === location.pathname && url.hash) return;
  event.preventDefault();
  openCoursePage(url).catch(() => { location.href = url.href; });
});
window.addEventListener('popstate', () => {
  openCoursePage(new URL(location.href), false).catch(() => location.reload());
});
