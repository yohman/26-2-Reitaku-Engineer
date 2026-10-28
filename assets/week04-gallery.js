(() => {
  const grid = document.querySelector('#prototype-grid');
  const count = document.querySelector('#gallery-count');
  const filters = document.querySelector('.gallery-filters');
  const labels = {
    all: {ja: 'すべて', en: 'All'},
    study: {ja: '学習・予定', en: 'Study & planning'},
    money: {ja: 'お金・バイト', en: 'Money & work'},
    creative: {ja: 'ゲーム・創作', en: 'Games & creativity'},
    life: {ja: 'くらし・健康', en: 'Daily life & wellbeing'},
    other: {ja: 'その他', en: 'Other'},
    linked: {ja: 'リンクあり', en: 'Links available'}
  };
  let items = [];
  let filter = 'all';
  let filterButtons = [];
  const isJapanese = () => document.documentElement.lang === 'ja';
  const categoryLabel = category => (labels[category] || labels.other)[isJapanese() ? 'ja' : 'en'];
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const matches = (item, key) => key === 'all' || (key === 'linked' ? Boolean(item.url) : item.category === key);
  function initFilters() {
    const keys = ['all', 'study', 'money', 'creative', 'life'];
    if (items.some(item => item.category === 'other')) keys.push('other');
    keys.push('linked');
    filterButtons = keys.map(key => {
      const button = el('button');
      button.type = 'button';
      button.dataset.galleryFilter = key;
      button.addEventListener('click', () => {
        filter = key;
        renderGallery();
      });
      return button;
    });
    filters.replaceChildren(...filterButtons);
  }
  function renderGallery() {
    const ja = isJapanese();
    const shown = items.filter(item => matches(item, filter));
    filters.setAttribute('aria-label', ja ? '作品の種類で絞り込む' : 'Filter prototypes by theme');
    filterButtons.forEach(button => {
      const key = button.dataset.galleryFilter;
      button.textContent = `${categoryLabel(key)} ${items.filter(item => matches(item, key)).length}`;
      button.setAttribute('aria-pressed', String(key === filter));
    });
    count.textContent = ja ? `${shown.length}件を表示 · ${items.filter(item => item.url).length}件にアプリへのリンクがあります` : `${shown.length} shown · ${items.filter(item => item.url).length} include prototype links`;
    grid.replaceChildren();
    for (const item of shown) {
      const title = ja ? item.title_ja : item.title_en;
      const article = el('article', 'prototype-card');
      const preview = el(item.url ? 'a' : 'div', 'prototype-preview');
      if (item.url) { preview.href = item.url; preview.target = '_blank'; preview.rel = 'noopener noreferrer'; preview.setAttribute('aria-label', ja ? `${title}を開く` : `Open ${title}`); }
      const image = el('img');
      image.src = item.thumbnail;
      image.alt = item.preview ? (ja ? `${title}の画面` : `Preview of ${title}`) : (ja ? 'プレビュー画像は未提出' : 'Preview image not supplied');
      image.loading = 'lazy';
      preview.append(image);
      const body = el('div', 'prototype-info');
      body.append(el('p', 'prototype-category', categoryLabel(item.category)));
      body.append(el('h3', '', title));
      if (item.url) {
        const link = el('a', 'prototype-open', ja ? 'アプリを開く ↗' : 'Open prototype ↗');
        link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        body.append(link);
      } else body.append(el('span', 'prototype-unlinked', ja ? 'アプリへのリンクは未提出' : 'No prototype link supplied'));
      article.append(preview, body);
      grid.append(article);
    }
  }
  document.querySelector('.language-toggle')?.addEventListener('click', renderGallery);
  fetch('data/week04-prototypes.json', {cache: 'no-store'}).then(response => {
    if (!response.ok) throw new Error(response.status);
    return response.json();
  }).then(data => { items = data.items; initFilters(); renderGallery(); }).catch(() => {
    grid.textContent = document.documentElement.lang === 'ja' ? 'ギャラリーを読み込めませんでした。' : 'Could not load the gallery.';
  });
})();
