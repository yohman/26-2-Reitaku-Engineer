(() => {
  const grid = document.querySelector('#prototype-grid');
  const count = document.querySelector('#gallery-count');
  const buttons = [...document.querySelectorAll('[data-gallery-filter]')];
  let items = [];
  let filter = 'all';
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function renderGallery() {
    const ja = document.documentElement.lang === 'ja';
    const shown = filter === 'linked' ? items.filter(item => item.url) : items;
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
      body.append(el('p', 'section-label', item.url ? (ja ? '試作品を見る' : 'PROTOTYPE LINK') : (ja ? '画面のみ' : 'PREVIEW ONLY')));
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
  buttons.forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.galleryFilter;
    buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    renderGallery();
  }));
  document.querySelector('.language-toggle')?.addEventListener('click', renderGallery);
  fetch('data/week04-prototypes.json', {cache: 'no-store'}).then(response => {
    if (!response.ok) throw new Error(response.status);
    return response.json();
  }).then(data => { items = data.items; renderGallery(); }).catch(() => {
    grid.textContent = document.documentElement.lang === 'ja' ? 'ギャラリーを読み込めませんでした。' : 'Could not load the gallery.';
  });
})();
