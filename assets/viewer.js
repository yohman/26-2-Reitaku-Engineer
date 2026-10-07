const viewer = document.querySelector('.slide-pdf-viewer');
const stage = viewer.querySelector('[data-stage]');
const image = viewer.querySelector('[data-slide-image]');
const canvas = viewer.querySelector('[data-pdf-canvas]');
const linkLayer = viewer.querySelector('[data-link-layer]');
const previous = viewer.querySelector('[data-previous]');
const next = viewer.querySelector('[data-next]');
const pageInput = viewer.querySelector('[data-page-input]');
const pageTotal = viewer.querySelector('[data-page-total]');
const fullscreenButton = viewer.querySelector('[data-fullscreen]');
const fullscreenLabel = viewer.querySelector('[data-fullscreen-label]');
const atlasLink = viewer.querySelector('[data-atlas-link]');
const viewerError = viewer.querySelector('[data-viewer-error]');
const languageButton = document.querySelector('[data-language-toggle]');
const requestedDeck = new URLSearchParams(location.search).get('deck');
const deckKey = ['yoh', '2025'].includes(requestedDeck) ? 'yoh' : ['vibe', 'studio', 'oishi'].includes(requestedDeck) ? requestedDeck : 'course';
const decks = {
  course: {week: 1, pages: 57, pdf: 'assets/week01/麗澤流エンジニア2026_1.pdf', slides: 'assets/week01/slides-2026', title: {en: 'Reitaku Engineering · Week 1', ja: '麗澤流エンジニア 第1回'}, short: {en: 'Course introduction', ja: '授業イントロ'}},
  yoh: {week: 1, pages: 10, pdf: 'assets/week01/week01-slides.pdf', slides: 'assets/week01/slides', title: {en: 'Yoh’s engineering story', ja: 'Yohのエンジニア・ストーリー'}, short: {en: 'Yoh’s presentation', ja: 'Yohのプレゼン'}},
  vibe: {week: 2, pages: 241, pdf: 'assets/week02/vibe-coding-textbook.pdf', cover: 'assets/week02/vibe-coding-cover.jpg', title: {en: 'Vibe Coding: App Development Textbook', ja: 'Vibe Codingからはじめるアプリ開発の教科書'}, short: {en: 'Vibe Coding textbook', ja: 'Vibe Codingの教科書'}},
  studio: {week: 2, pages: 37, pdf: 'assets/week02/ai-studio-prototyping.pdf', cover: 'assets/week02/ai-studio-cover.jpg', title: {en: 'Rapid Prototyping with Google AI Studio', ja: '爆速プロトタイプ構築術'}, short: {en: 'Google AI Studio slides', ja: 'Google AI Studioの講義スライド'}},
  oishi: {week: 3, pages: 50, pdf: 'assets/week03/oishi-ai-health-wellbeing.pdf', cover: 'assets/week03/oishi-cover.jpg', title: {en: 'AI, Health, and Well-being', ja: 'AIと医療・ウェルビーイング'}, short: {en: 'Oishi’s presentation', ja: '大石先生のプレゼンテーション'}}
};
const deck = decks[deckKey];
const yohDeck = deckKey === 'yoh';
let pageCount = deck.pages;
const pdfUrl = deck.pdf;
const slideDirectory = deck.slides;
const questionUrl = 'https://script.google.com/macros/s/AKfycbz7kuUplBbrLkwNnpCSfE_fH3Ua1PL3rd3Ml84l4-oc13gfjQmDaCY1OF4AkGNyiwEF/exec?lecture=engineer';
const draftQuestionUrl = 'https://script.google.com/macros/s/AKfycby4YxQXKwTc0IYB4p8Gr9ASgoKpcUewbDwASkmqbKk/dev?lecture=engineer';
const fallbackLinks = yohDeck
  ? new Map([[2, [{url: 'https://youtu.be/rk9Uwvno9SU', rect: [312.75, 245.25, 647.25, 272.25]}]]])
  : deckKey === 'course' ? new Map([[8, [{url: questionUrl, rect: [90, 115, 700, 205]}]]]) : new Map();
const fallbackPageSize = {width: 960, height: 540};
let language = (() => { try { return localStorage.getItem('reitaku-engineering-language') || 'en'; } catch { return 'en'; } })();
let currentPage = Math.max(1, Math.min(pageCount, Number(new URLSearchParams(location.search).get('page')) || 1));
let pdf = null;
let renderTask = null;
let renderRevision = 0;

function setLanguage() {
  document.documentElement.lang = language;
  document.body.classList.toggle('is-book-viewer', deckKey === 'vibe');
  document.querySelectorAll('[data-ja]').forEach(element => {
    if (!element.dataset.en) element.dataset.en = element.textContent;
    element.textContent = language === 'ja' ? element.dataset.ja : element.dataset.en;
  });
  document.title = `${deck.title[language]} · Reitaku Engineering`;
  document.querySelector('.viewer-heading h1').textContent = deck.title[language];
  document.querySelector('.viewer-heading .eyebrow').textContent = language === 'ja' ? `第${deck.week}回 · ${deckKey === 'vibe' ? '参考教材' : '講義資料'}` : `WEEK ${String(deck.week).padStart(2, '0')} · ${deckKey === 'vibe' ? 'COURSE MATERIAL' : 'PRESENTATION'}`;
  const backLink = document.querySelector('.viewer-site-header .site-nav a');
  backLink.href = `agenda.html#week-${deck.week}`;
  backLink.textContent = language === 'ja' ? '授業予定に戻る' : 'Back to agenda';
  const deckTabs = document.querySelector('.viewer-deck-tabs');
  deckTabs.hidden = deck.week !== 1;
  if (deck.week === 1) document.querySelector(yohDeck ? '[data-deck-yoh]' : '[data-deck-course]').setAttribute('aria-current', 'page');
  languageButton.textContent = language === 'ja' ? 'EN' : 'JP';
  languageButton.setAttribute('aria-label', language === 'ja' ? 'Switch to English' : '日本語に切り替える');
  previous.setAttribute('aria-label', language === 'ja' ? '前のページ' : 'Previous page');
  next.setAttribute('aria-label', language === 'ja' ? '次のページ' : 'Next page');
  pageInput.setAttribute('aria-label', language === 'ja' ? 'ページ番号' : 'Page number');
  viewer.setAttribute('aria-label', `${deck.title[language]} · ${language === 'ja' ? 'PDFビューア' : 'PDF viewer'}`);
  image.alt = `${deck.short[language]} ${currentPage} / ${pageCount}`;
  viewerError.querySelector('a').textContent = language === 'ja' ? 'PDFをブラウザで開く ↗' : 'Open PDF in browser ↗';
  viewerError.querySelector('a').href = pdfUrl;
  viewerError.querySelector('span').textContent = language === 'ja' ? 'このページを表示できませんでした。' : 'This page could not be displayed.';
  if (deckKey === 'vibe') document.querySelector('.viewer-hint').textContent = language === 'ja' ? 'ページ内は縦にスクロール · ← → キーでページ移動 · Esc で全画面を終了' : 'Scroll within a page to read · Use ← → to change pages · Esc exits full screen';
  linkLayer.querySelectorAll('a').forEach(link => setLinkLabel(link));
  updateFullscreenLabel();
}

function setLinkLabel(link) {
  link.setAttribute('aria-label', language === 'ja'
    ? `${link.dataset.host} を新しいタブで開く`
    : `Open ${link.dataset.host} in a new tab`);
}

function placeLinks(links, width, height, convertRect) {
  linkLayer.replaceChildren();
  linkLayer.style.width = `${width}px`;
  linkLayer.style.height = `${height}px`;
  for (const annotation of links) {
    let url;
    try { url = new URL(annotation.url === draftQuestionUrl ? questionUrl : annotation.url); } catch { continue; }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') continue;
    const [x1, y1, x2, y2] = convertRect(annotation.rect);
    const left = Math.min(x1, x2), top = Math.min(y1, y2);
    const right = Math.max(x1, x2), bottom = Math.max(y1, y2);
    const link = document.createElement('a');
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = url.href;
    link.dataset.host = url.hostname;
    setLinkLabel(link);
    link.style.left = `${left}px`;
    link.style.top = `${top}px`;
    link.style.width = `${right - left}px`;
    link.style.height = `${bottom - top}px`;
    linkLayer.append(link);
  }
  linkLayer.hidden = !linkLayer.childElementCount;
}

function showFallbackLinks() {
  if (image.hidden) return;
  const width = image.getBoundingClientRect().width;
  const height = image.getBoundingClientRect().height;
  if (!width || !height) return;
  placeLinks(fallbackLinks.get(currentPage) || [], width, height, rect => [
    rect[0] / fallbackPageSize.width * width,
    (fallbackPageSize.height - rect[3]) / fallbackPageSize.height * height,
    rect[2] / fallbackPageSize.width * width,
    (fallbackPageSize.height - rect[1]) / fallbackPageSize.height * height
  ]);
}

function updateFullscreenLabel() {
  const active = document.fullscreenElement === viewer || viewer.classList.contains('is-fullscreen-fallback');
  viewer.classList.toggle('is-fullscreen', active);
  document.body.classList.toggle('viewer-fullscreen-open', active);
  fullscreenButton.setAttribute('aria-pressed', String(active));
  fullscreenLabel.textContent = active
    ? (language === 'ja' ? '全画面を終了' : 'Exit full screen')
    : (language === 'ja' ? '全画面' : 'Full screen');
}

function pageImage(page) {
  return slideDirectory ? `${slideDirectory}/slide-${String(page).padStart(2, '0')}.jpg` : deck.cover;
}

async function renderPdfPage(pageNumber) {
  if (!pdf) return;
  const revision = ++renderRevision;
  if (renderTask) {
    try { renderTask.cancel(); } catch { /* It has already finished. */ }
  }
  try {
    const page = await pdf.getPage(pageNumber);
    if (revision !== renderRevision) return;
    const annotationsTask = page.getAnnotations({intent: 'display'}).catch(() => []);
    const base = page.getViewport({scale: 1});
    const widthScale = Math.max(1, stage.clientWidth - 32) / base.width;
    const heightScale = Math.max(1, stage.clientHeight - 32) / base.height;
    const scale = deckKey === 'vibe' ? Math.max(.25, Math.min(widthScale, 1.8)) : Math.max(.25, Math.min(widthScale, heightScale));
    const viewport = page.getViewport({scale});
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(viewport.width * pixelRatio);
    canvas.height = Math.round(viewport.height * pixelRatio);
    canvas.style.width = `${Math.round(viewport.width)}px`;
    canvas.style.height = `${Math.round(viewport.height)}px`;
    const context = canvas.getContext('2d');
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    renderTask = page.render({canvasContext: context, viewport});
    await renderTask.promise;
    const annotations = await annotationsTask;
    if (revision !== renderRevision) return;
    canvas.hidden = false;
    image.hidden = true;
    viewerError.hidden = true;
    const links = annotations.filter(annotation => annotation.subtype === 'Link' && annotation.url);
    placeLinks(links.length ? links : fallbackLinks.get(pageNumber) || [], viewport.width, viewport.height,
      rect => viewport.convertToViewportRectangle(rect));
  } catch (error) {
    if (error?.name !== 'RenderingCancelledException' && revision === renderRevision) {
      canvas.hidden = true;
      image.hidden = !slideDirectory || currentPage !== 1;
      viewerError.hidden = !!slideDirectory;
      requestAnimationFrame(showFallbackLinks);
    }
  }
}

function showPage(requestedPage) {
  currentPage = Math.max(1, Math.min(pageCount, Number(requestedPage) || 1));
  stage.scrollTop = 0;
  image.src = pageImage(currentPage);
  image.hidden = !slideDirectory && currentPage !== 1;
  canvas.hidden = true;
  viewerError.hidden = true;
  linkLayer.replaceChildren();
  linkLayer.hidden = true;
  image.alt = `${deck.short[language]} ${currentPage} / ${pageCount}`;
  atlasLink.hidden = !(yohDeck && currentPage === 1);
  pageInput.value = currentPage;
  pageInput.max = String(pageCount);
  pageTotal.textContent = `/ ${pageCount}`;
  previous.disabled = currentPage === 1;
  next.disabled = currentPage === pageCount;
  const url = new URL(location.href);
  if (currentPage === 1) url.searchParams.delete('page');
  else url.searchParams.set('page', String(currentPage));
  history.replaceState(null, '', url);
  requestAnimationFrame(showFallbackLinks);
  renderPdfPage(currentPage);
}

image.addEventListener('load', showFallbackLinks);

previous.addEventListener('click', () => showPage(currentPage - 1));
next.addEventListener('click', () => showPage(currentPage + 1));
pageInput.addEventListener('change', () => showPage(pageInput.value));
pageInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') { showPage(pageInput.value); pageInput.blur(); }
});
document.addEventListener('keydown', event => {
  if (event.target === pageInput) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); showPage(currentPage - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showPage(currentPage + 1); }
  if (event.key === 'Home') { event.preventDefault(); showPage(1); }
  if (event.key === 'End') { event.preventDefault(); showPage(pageCount); }
  if (event.key === 'Escape' && viewer.classList.contains('is-fullscreen-fallback')) {
    viewer.classList.remove('is-fullscreen-fallback');
    updateFullscreenLabel();
  }
});
fullscreenButton.addEventListener('click', async () => {
  if (document.fullscreenElement === viewer) await document.exitFullscreen();
  else if (viewer.classList.contains('is-fullscreen-fallback')) viewer.classList.remove('is-fullscreen-fallback');
  else if (viewer.requestFullscreen) {
    try { await viewer.requestFullscreen(); }
    catch { viewer.classList.add('is-fullscreen-fallback'); }
  } else viewer.classList.add('is-fullscreen-fallback');
  updateFullscreenLabel();
  requestAnimationFrame(() => renderPdfPage(currentPage));
});
document.addEventListener('fullscreenchange', () => {
  updateFullscreenLabel();
  requestAnimationFrame(() => renderPdfPage(currentPage));
});
window.addEventListener('resize', () => {
  if (pdf) requestAnimationFrame(() => renderPdfPage(currentPage));
  else requestAnimationFrame(showFallbackLinks);
});
languageButton.addEventListener('click', () => {
  language = language === 'en' ? 'ja' : 'en';
  try { localStorage.setItem('reitaku-engineering-language', language); } catch { /* Language still changes. */ }
  setLanguage();
});

setLanguage();
showPage(currentPage);
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  window.pdfjsLib.getDocument(pdfUrl).promise.then(documentPdf => {
    pdf = documentPdf;
    pageCount = pdf.numPages;
    currentPage = Math.min(currentPage, pageCount);
    showPage(currentPage);
  }).catch(() => { if (!slideDirectory) viewerError.hidden = false; });
} else if (!slideDirectory) viewerError.hidden = false;
