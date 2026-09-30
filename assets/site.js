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
  ['Computational complexity','計算複雑性',11,11],['Information theory','情報理論',30,13],['Cryptography','暗号理論',42,11],['Scheduling','スケジューリング',72,13],['Computer architecture','コンピュータ・アーキテクチャ',88,13],
  ['Theoretical computer science','理論計算機科学',34,27],['Computability theory','計算可能性理論',29,31],['Turing machine','チューリングマシン',50,31],['Computer engineering','コンピュータ工学',78,29],['Algorithms','アルゴリズム',8,35],['Logic','論理学',18,34],
  ['Graph theory','グラフ理論',18,50],['Computational geometry','計算幾何学',29,50],['Automata theory','オートマトン理論',36,55],['Formal methods','形式手法',58,38],['Parallel programming','並列プログラミング',55,44],
  ['Software and programming languages','ソフトウェアと言語',81,38],['Compilers','コンパイラ',95,47],['Software engineering','ソフトウェア工学',65,48],['Operating systems','オペレーティングシステム',75,47],['Networking','ネットワーク',88,44],['Data management','データ管理',94,45],
  ['Machine learning','機械学習',8,58],['Optimisation','最適化',21,58],['Boolean satisfiability','充足可能性問題',37,60],['Supercomputing','スーパーコンピューティング',51,60],['Computer graphics','コンピュータグラフィックス',66,61],
  ['Artificial intelligence','人工知能',20,75],['Robotics','ロボット工学',37,68],['Computer vision','コンピュータビジョン',8,70],['Image processing','画像処理',8,96],['Natural language processing','自然言語処理',25,84],
  ['Knowledge representation','知識表現',31,89],['Telepresence','テレプレゼンス',44,83],['Virtual reality','仮想現実',61,80],['Augmented reality','拡張現実',62,84],['Human-computer interaction','ヒューマン・コンピュータ・インタラクション',73,84],
  ['Simulation','シミュレーション',77,80],['Computational science','計算科学',79,69],['Hacking','ハッキング',94,66],['Internet of things','モノのインターネット',78,95],['Big data','ビッグデータ',94,95]
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
      <section class="week-one-slide-panel" aria-labelledby="week-one-slides-title"><header class="material-heading"><div><p>2025 MATERIAL · 10 SLIDES</p><h4 id="week-one-slides-title">${ja ? '講義スライド' : 'Lecture slides'}</h4></div><a href="assets/week01/week01-slides.pdf" target="_blank" rel="noopener">${ja ? 'PDFを開く ↗' : 'Open PDF ↗'}</a></header>
        <div class="week-one-slideshow" data-slideshow role="group" aria-label="${ja ? '第1回講義スライド' : 'Week 1 lecture slides'}" tabindex="0"><div class="slide-stage"><img data-slide-image src="assets/week01/slides/slide-01.jpg" alt="${ja ? '2025年度第1回スライド 1 / 10' : '2025 Week 1 lecture slide 1 of 10'}"></div><div class="slide-toolbar"><button type="button" data-slide-step="-1" aria-label="${ja ? '前のスライド' : 'Previous slide'}">←</button><output data-slide-count aria-live="polite">1 / 10</output><button type="button" data-slide-step="1" aria-label="${ja ? '次のスライド' : 'Next slide'}">→</button></div></div><a class="slide-download" href="assets/week01/week01-slides.pdf" download>${ja ? '元のPDFをダウンロード ↓' : 'Download the original PDF ↓'}</a>
      </section>
      <section class="engineer-map-panel" aria-labelledby="engineer-map-title"><header class="material-heading"><div><p>2025 LECTURE · TWO MAPS</p><h4 id="engineer-map-title">${ja ? '2つのマップを探索' : 'Explore the maps'}</h4></div></header>
        <div class="map-tabs" id="week-one-map-tabs" role="tablist" aria-label="${ja ? '地図を選ぶ' : 'Choose a map'}"><button id="map-tab-engineering" type="button" role="tab" aria-selected="true" aria-controls="map-panel-engineering" tabindex="0">${ja ? '工学マップ' : 'Engineering'}</button><button id="map-tab-computer-science" type="button" role="tab" aria-selected="false" aria-controls="map-panel-computer-science" tabindex="-1">${ja ? 'コンピュータサイエンス' : 'Computer Science'}</button></div>
        <div class="map-tab-panel" id="map-panel-engineering" role="tabpanel" aria-labelledby="map-tab-engineering">
        <div class="engineer-map-viewer" id="engineer-map-viewer" style="--map-ratio:2183 / 1643;--map-width-at-height:132.87vh;--map-height-at-width:75.27vw" tabindex="0" role="application" aria-label="${ja ? 'Engineer Map。ドラッグして移動、スクロールして拡大・縮小できます。' : 'Engineer Map. Drag to pan and use the scroll wheel to zoom.'}" data-map-viewer>
          <div class="map-canvas"><img class="engineer-map-image" src="assets/week01/engineer-map.png" alt="A map showing the fields and connections within engineering" draggable="false"><div class="map-hotspots" aria-label="${ja ? '日本語訳のある分野名' : 'Engineering fields with Japanese translations'}">
            <button class="map-term" style="--x:8%;--y:5%" data-map-term="Civil engineering" data-map-ja="土木工学"><span>Civil engineering</span><span lang="ja">土木工学</span></button>
            <button class="map-term" style="--x:25%;--y:8%" data-map-term="Geological engineering" data-map-ja="地質工学"><span>Geological engineering</span><span lang="ja">地質工学</span></button>
            <button class="map-term" style="--x:43%;--y:13%" data-map-term="Fluid mechanics" data-map-ja="流体力学"><span>Fluid mechanics</span><span lang="ja">流体力学</span></button>
            <button class="map-term" style="--x:68%;--y:4%" data-map-term="Satellites" data-map-ja="人工衛星"><span>Satellites</span><span lang="ja">人工衛星</span></button>
            <button class="map-term" style="--x:77%;--y:10%" data-map-term="Aerodynamics" data-map-ja="空気力学"><span>Aerodynamics</span><span lang="ja">空気力学</span></button>
            <button class="map-term" style="--x:84%;--y:5%" data-map-term="Aerospace engineering" data-map-ja="航空宇宙工学"><span>Aerospace engineering</span><span lang="ja">航空宇宙工学</span></button>
            <button class="map-term" style="--x:60%;--y:15%" data-map-term="Marine engineering" data-map-ja="海洋工学"><span>Marine engineering</span><span lang="ja">海洋工学</span></button>
            <button class="map-term" style="--x:67%;--y:17%" data-map-term="Naval engineering" data-map-ja="造船工学"><span>Naval engineering</span><span lang="ja">造船工学</span></button>
            <button class="map-term" style="--x:8%;--y:31%" data-map-term="Structural engineering" data-map-ja="構造工学"><span>Structural engineering</span><span lang="ja">構造工学</span></button>
            <button class="map-term" style="--x:15%;--y:36%" data-map-term="Architectural engineering" data-map-ja="建築工学"><span>Architectural engineering</span><span lang="ja">建築工学</span></button>
            <button class="map-term" style="--x:24%;--y:36%" data-map-term="Agricultural engineering" data-map-ja="農業工学"><span>Agricultural engineering</span><span lang="ja">農業工学</span></button>
            <button class="map-term" style="--x:65%;--y:33%" data-map-term="Materials engineering" data-map-ja="材料工学"><span>Materials engineering</span><span lang="ja">材料工学</span></button>
            <button class="map-term" style="--x:95%;--y:34%" data-map-term="Audio engineering" data-map-ja="音響工学"><span>Audio engineering</span><span lang="ja">音響工学</span></button>
            <button class="map-term" style="--x:21%;--y:53%" data-map-term="Environmental engineering" data-map-ja="環境工学"><span>Environmental engineering</span><span lang="ja">環境工学</span></button>
            <button class="map-term" style="--x:8%;--y:50%" data-map-term="Nuclear engineering" data-map-ja="原子力工学"><span>Nuclear engineering</span><span lang="ja">原子力工学</span></button>
            <button class="map-term" style="--x:46%;--y:47%" data-map-term="Manufacturing engineering" data-map-ja="生産工学"><span>Manufacturing engineering</span><span lang="ja">生産工学</span></button>
            <button class="map-term" style="--x:66%;--y:52%" data-map-term="Automotive engineering" data-map-ja="自動車工学"><span>Automotive engineering</span><span lang="ja">自動車工学</span></button>
            <button class="map-term" style="--x:53%;--y:58%" data-map-term="Robotics and mechatronics" data-map-ja="ロボット工学・メカトロニクス"><span>Robotics and mechatronics</span><span lang="ja">ロボット工学・メカトロニクス</span></button>
            <button class="map-term" style="--x:40%;--y:61%" data-map-term="Industrial engineering" data-map-ja="産業工学"><span>Industrial engineering</span><span lang="ja">産業工学</span></button>
            <button class="map-term" style="--x:60%;--y:53%" data-map-term="Mechanical engineering" data-map-ja="機械工学"><span>Mechanical engineering</span><span lang="ja">機械工学</span></button>
            <button class="map-term" style="--x:88%;--y:55%" data-map-term="Electrical engineering" data-map-ja="電気工学"><span>Electrical engineering</span><span lang="ja">電気工学</span></button>
            <button class="map-term" style="--x:7%;--y:63%" data-map-term="Power and energy systems" data-map-ja="電力・エネルギーシステム"><span>Power and energy systems</span><span lang="ja">電力・エネルギーシステム</span></button>
            <button class="map-term" style="--x:7%;--y:82%" data-map-term="Chemical engineering" data-map-ja="化学工学"><span>Chemical engineering</span><span lang="ja">化学工学</span></button>
            <button class="map-term" style="--x:40%;--y:80%" data-map-term="Biomedical engineering" data-map-ja="生体医工学"><span>Biomedical engineering</span><span lang="ja">生体医工学</span></button>
            <button class="map-term" style="--x:74%;--y:78%" data-map-term="Photonics" data-map-ja="フォトニクス・光工学"><span>Photonics</span><span lang="ja">フォトニクス・光工学</span></button>
            <button class="map-term" style="--x:84%;--y:83%" data-map-term="Computer engineering" data-map-ja="コンピュータ工学"><span>Computer engineering</span><span lang="ja">コンピュータ工学</span></button>
            <button class="map-term" style="--x:76%;--y:90%" data-map-term="Software engineering" data-map-ja="ソフトウェア工学"><span>Software engineering</span><span lang="ja">ソフトウェア工学</span></button>
            <button class="map-term" style="--x:89%;--y:88%" data-map-term="Network engineering" data-map-ja="ネットワーク工学"><span>Network engineering</span><span lang="ja">ネットワーク工学</span></button>
            <button class="map-term" style="--x:96%;--y:90%" data-map-term="Data engineering" data-map-ja="データ工学"><span>Data engineering</span><span lang="ja">データ工学</span></button>
            <button class="map-term" style="--x:47%;--y:94%" data-map-term="Bio-engineering" data-map-ja="生物工学"><span>Bio-engineering</span><span lang="ja">生物工学</span></button>
          </div></div>
          <p class="map-viewer-instruction">${ja ? '丸印にカーソルを合わせると日本語訳' : 'Hover a marker for the Japanese translation'}</p><div class="map-viewer-toolbar" aria-label="${ja ? '地図の操作' : 'Map controls'}"><button type="button" data-map-action="out" aria-label="${ja ? '縮小' : 'Zoom out'}">−</button><output data-map-zoom aria-live="polite">100%</output><button type="button" data-map-action="in" aria-label="${ja ? '拡大' : 'Zoom in'}">+</button><button type="button" data-map-action="reset">${ja ? 'リセット' : 'Reset'}</button><button type="button" data-map-action="fullscreen" aria-pressed="false">${ja ? '全画面' : 'Fullscreen'}</button></div>
        </div><p class="map-viewer-hint">${ja ? 'ドラッグして移動 · スクロールまたは＋／−で拡大 · 0でリセット' : 'Drag to pan · Scroll or use + / − to zoom · Press 0 to reset'}</p><p class="map-original-link"><a href="assets/week01/engineer-map.png" target="_blank" rel="noopener">${ja ? 'Engineer Mapの原寸画像 ↗' : 'Open the original Engineer Map ↗'}</a></p>
        </div>
        <div class="map-tab-panel" id="map-panel-computer-science" role="tabpanel" aria-labelledby="map-tab-computer-science" hidden>
          <div class="engineer-map-viewer" id="computer-science-map-viewer" style="--map-ratio:3840 / 2704;--map-width-at-height:142.01vh;--map-height-at-width:70.42vw" tabindex="0" role="application" aria-label="${ja ? 'コンピュータサイエンスの地図。ドラッグして移動、スクロールして拡大・縮小できます。' : 'Map of Computer Science. Drag to pan and use the scroll wheel to zoom.'}" data-map-viewer>
            <div class="map-canvas"><img class="engineer-map-image" src="assets/week01/computer-science-map.png" alt="Map of Computer Science by Dominic Walliman" draggable="false"><div class="map-hotspots" aria-label="${ja ? 'コンピュータサイエンスの用語と日本語訳' : 'Computer science terms with Japanese translations'}">${computerScienceMapTermsHtml()}</div></div>
            <p class="map-viewer-instruction">${ja ? '丸印にカーソルを合わせると日本語訳' : 'Hover a marker for the Japanese translation'}</p><div class="map-viewer-toolbar" aria-label="${ja ? '地図の操作' : 'Map controls'}"><button type="button" data-map-action="out" aria-label="${ja ? '縮小' : 'Zoom out'}">−</button><output data-map-zoom aria-live="polite">100%</output><button type="button" data-map-action="in" aria-label="${ja ? '拡大' : 'Zoom in'}">+</button><button type="button" data-map-action="reset">${ja ? 'リセット' : 'Reset'}</button><button type="button" data-map-action="fullscreen" aria-pressed="false">${ja ? '全画面' : 'Fullscreen'}</button></div>
          </div><p class="map-viewer-hint">${ja ? 'ドラッグして移動 · スクロールまたは＋／−で拡大 · 0でリセット' : 'Drag to pan · Scroll or use + / − to zoom · Press 0 to reset'}</p><p class="map-original-link"><a href="assets/week01/computer-science-map.png" target="_blank" rel="noopener">${ja ? 'Computer Science Mapの原寸画像 ↗' : 'Open the original Computer Science map ↗'}</a> · Dominic Walliman, 2017</p>
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
      if (button.dataset.mapAction === 'in') zoomAt(1.35);
      else if (button.dataset.mapAction === 'out') zoomAt(1 / 1.35);
      else { state.scale = 1; state.x = 0; state.y = 0; paint(); }
    }));
    viewer.addEventListener('wheel', event => {
      event.preventDefault();
      const rect = viewer.getBoundingClientRect();
      zoomAt(event.deltaY < 0 ? 1.15 : 1 / 1.15, event.clientX - rect.left, event.clientY - rect.top);
    }, {passive:false});
    viewer.addEventListener('pointerdown', event => {
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
      if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomAt(1.25); }
      else if (event.key === '-') { event.preventDefault(); zoomAt(1 / 1.25); }
      else if (event.key === '0') { event.preventDefault(); state.scale = 1; state.x = 0; state.y = 0; paint(); }
    });
    const fullscreenButton = viewer.querySelector('[data-map-action="fullscreen"]');
    const setFullscreenState = () => {
      const active = document.fullscreenElement === viewer || viewer.classList.contains('is-fullscreen-fallback');
      fullscreenButton.setAttribute('aria-pressed', String(active));
      fullscreenButton.textContent = active ? (language === 'ja' ? '全画面を終了' : 'Exit fullscreen') : (language === 'ja' ? '全画面' : 'Fullscreen');
    };
    fullscreenButton.addEventListener('click', async () => {
      if (document.fullscreenElement === viewer || viewer.classList.contains('is-fullscreen-fallback')) {
        if (document.fullscreenElement) await document.exitFullscreen();
        else { viewer.classList.remove('is-fullscreen-fallback'); document.body.classList.remove('map-fullscreen-open'); }
      } else if (viewer.requestFullscreen) {
        try { await viewer.requestFullscreen(); } catch { viewer.classList.add('is-fullscreen-fallback'); document.body.classList.add('map-fullscreen-open'); }
      } else { viewer.classList.add('is-fullscreen-fallback'); document.body.classList.add('map-fullscreen-open'); }
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
      current = Math.max(1, Math.min(10, page));
      image.src = `assets/week01/slides/slide-${String(current).padStart(2,'0')}.jpg`;
      image.alt = `${language === 'ja' ? '2025年度第1回スライド' : '2025 Week 1 lecture slide'} ${current} / 10`;
      count.value = `${current} / 10`; count.textContent = count.value;
      buttons[0].disabled = current === 1; buttons[1].disabled = current === 10;
    };
    buttons.forEach(button => button.addEventListener('click', () => show(current + Number(button.dataset.slideStep))));
    slideshow.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
      else if (event.key === 'Home') { event.preventDefault(); show(1); }
      else if (event.key === 'End') { event.preventDefault(); show(10); }
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
  const planning = new URLSearchParams(location.search).has('planning');
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  target.innerHTML = weeks.map(w => {
    const guest = guests.find(g => g.id === w.guest_id);
    const speaker = guest ? `<a href="guests.html#${escapeHtml(guest.id)}">${escapeHtml(localized(guest,'name'))} ↗</a>` : '';
    const summary = localized(w,'overview') || (language === 'ja' ? '詳細は後日案内します。' : 'Details forthcoming.');
    const sections = [language === 'ja' ? 'Reaction JP' : 'Reaction',language === 'ja' ? 'Materials JP' : 'Materials','Resources'].filter(key => w.sections[key]);
    const details = sections.map(key => `<div class="detail-block"><h3>${key === 'Resources' ? (language === 'ja' ? '参考資料' : 'Background resource') : key.includes('Reaction') ? (language === 'ja' ? '振り返り' : 'Reflection') : (language === 'ja' ? '資料' : 'Materials')}</h3>${sectionHtml(w.sections[key])}</div>`).join('');
    return `<article class="agenda-week" id="week-${escapeHtml(w.week)}"><div class="agenda-week-heading"><div><span class="week-number">${String(w.week).padStart(2,'0')}</span><p class="week-date">${escapeHtml(dateLabel(w.date,{month:'short',day:'numeric'}))}</p></div><div class="agenda-week-title"><p>${language === 'ja' ? '木曜日 · 4限' : 'Thursday · Period 4'} · ${escapeHtml(dateLabel(w.date))}</p><h2>${escapeHtml(localized(w,'title'))}</h2><p class="speaker-line">${speaker}</p></div></div>${Number(w.week) === 1 ? weekOneMaterialsHtml() : ''}<details class="agenda-more" ${planning || w.date <= today ? 'open' : ''}><summary>${language === 'ja' ? '授業の詳細' : 'Class details'}</summary><div class="agenda-content"><p class="agenda-overview">${escapeHtml(summary)}</p>${details}</div></details></article>`;
  }).join('') + `<p class="schedule-note">${language === 'ja' ? '最終発表は2回を予定しています。もう一回の日程は未定です。' : 'Two final presentation sessions are intended. The second date is to be confirmed.'}</p>`;
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
