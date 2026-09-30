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
const languageButton = document.querySelector('[data-language-toggle]');
const archiveDeck = new URLSearchParams(location.search).get('deck') === '2025';
const pageCount = archiveDeck ? 10 : 57;
const pdfUrl = archiveDeck ? 'assets/week01/week01-slides.pdf' : 'assets/week01/麗澤流エンジニア2026_1.pdf';
const slideDirectory = archiveDeck ? 'assets/week01/slides' : 'assets/week01/slides-2026';
const questionUrl = 'https://script.google.com/macros/s/AKfycbz7kuUplBbrLkwNnpCSfE_fH3Ua1PL3rd3Ml84l4-oc13gfjQmDaCY1OF4AkGNyiwEF/exec?lecture=engineer';
const draftQuestionUrl = 'https://script.google.com/macros/s/AKfycby4YxQXKwTc0IYB4p8Gr9ASgoKpcUewbDwASkmqbKk/dev?lecture=engineer';
const fallbackLinks = archiveDeck
  ? new Map([[2, [{url: 'https://youtu.be/rk9Uwvno9SU', rect: [312.75, 245.25, 647.25, 272.25]}]]])
  : new Map([[8, [{url: questionUrl, rect: [90, 115, 700, 205]}]]]);
const fallbackPageSize = {width: 960, height: 540};
let language = (() => { try { return localStorage.getItem('reitaku-engineering-language') || 'en'; } catch { return 'en'; } })();
let currentPage = Math.max(1, Math.min(pageCount, Number(new URLSearchParams(location.search).get('page')) || 1));
let pdf = null;
let renderTask = null;
let renderRevision = 0;

function setLanguage() {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-ja]').forEach(element => {
    if (!element.dataset.en) element.dataset.en = element.textContent;
    element.textContent = language === 'ja' ? element.dataset.ja : element.dataset.en;
  });
  document.title = `${language === 'ja' ? '第1回スライド' : 'Week 1 slides'} · Reitaku Engineering`;
  document.querySelector('.viewer-heading h1').textContent = archiveDeck
    ? (language === 'ja' ? '2025年度の参考スライド' : '2025 reference slides')
    : (language === 'ja' ? '麗澤流エンジニア 第1回' : 'Reitaku Engineering · Week 1');
  languageButton.textContent = language === 'ja' ? 'EN' : 'JP';
  languageButton.setAttribute('aria-label', language === 'ja' ? 'Switch to English' : '日本語に切り替える');
  previous.setAttribute('aria-label', language === 'ja' ? '前のページ' : 'Previous page');
  next.setAttribute('aria-label', language === 'ja' ? '次のページ' : 'Next page');
  pageInput.setAttribute('aria-label', language === 'ja' ? 'ページ番号' : 'Page number');
  viewer.setAttribute('aria-label', language === 'ja' ? '第1回PDFスライドビューア' : 'Week 1 PDF slide viewer');
  image.alt = `${language === 'ja' ? `${archiveDeck ? '2025' : '2026'}年度第1回講義スライド` : `${archiveDeck ? '2025' : '2026'} Week 1 lecture slide`} ${currentPage} / ${pageCount}`;
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
  return `${slideDirectory}/slide-${String(page).padStart(2, '0')}.jpg`;
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
    const scale = Math.min(
      Math.max(1, stage.clientWidth - 32) / base.width,
      Math.max(1, stage.clientHeight - 32) / base.height
    );
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
    const links = annotations.filter(annotation => annotation.subtype === 'Link' && annotation.url);
    placeLinks(links.length ? links : fallbackLinks.get(pageNumber) || [], viewport.width, viewport.height,
      rect => viewport.convertToViewportRectangle(rect));
  } catch (error) {
    if (error?.name !== 'RenderingCancelledException' && revision === renderRevision) {
      canvas.hidden = true;
      image.hidden = false;
      requestAnimationFrame(showFallbackLinks);
    }
  }
}

function showPage(requestedPage) {
  currentPage = Math.max(1, Math.min(pageCount, Number(requestedPage) || 1));
  image.src = pageImage(currentPage);
  image.hidden = false;
  canvas.hidden = true;
  linkLayer.replaceChildren();
  linkLayer.hidden = true;
  image.alt = `${language === 'ja' ? `${archiveDeck ? '2025' : '2026'}年度第1回講義スライド` : `${archiveDeck ? '2025' : '2026'} Week 1 lecture slide`} ${currentPage} / ${pageCount}`;
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
    renderPdfPage(currentPage);
  }).catch(() => { /* The prepared slide images remain available. */ });
}
