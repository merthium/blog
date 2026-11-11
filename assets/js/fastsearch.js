(() => {
  'use strict';
  const box = document.getElementById('searchbox');
  if (!box) return;
  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  const status = document.getElementById('search-status');
  const retry = document.getElementById('search-retry');
  const form = document.getElementById('site-search');
  let fuse, loading = false, debounce;
  const normalize = text => String(text || '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/\p{M}/gu, '').replace(/ı/g, 'i');
  const make = (tag, className, text) => {
    const node = document.createElement(tag); node.className = className;
    node.textContent = text; return node;
  };
  function search() {
    if (!fuse) return;
    const query = input.value.trim();
    results.replaceChildren();
    try {
      const url = new URL(location.href);
      if (query) url.searchParams.set('q', query); else url.searchParams.delete('q');
      history.replaceState(null, '', url);
    } catch { /* Search still works if browser history is unavailable. */ }
    if (!query) { status.textContent = 'Aramak istediğin kelimeyi yaz.'; return; }
    const matches = fuse.search(normalize(query));
    status.textContent = matches.length ? matches.length + ' yazı bulundu.' + (matches.length > 20 ? ' İlk 20 sonuç gösteriliyor.' : '') : 'Sonuç bulunamadı. Başka bir kelime deneyebilirsin.';
    for (const match of matches.slice(0, 20)) {
      const post = match.item;
      const row = make('li', 'search-result', '');
      const link = make('a', 'search-result-link', '');
      link.href = post.permalink;
      link.append(make('h2', '', post.title));
      if (post.summary) link.append(make('p', 'search-summary', post.summary));
      const labels = [...(post.categories || []), ...(post.tags || []).map(tag => '#' + tag)];
      if (labels.length) link.append(make('p', 'search-meta', labels.join(' · ')));
      row.append(link); results.append(row);
    }
  }
  async function load() {
    if (loading) return;
    loading = true; retry.hidden = true; status.textContent = 'Yazılar yükleniyor…';
    box.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(box.dataset.index, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('load_failed');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('invalid_index');
      const posts = data.filter(post => typeof post.title === 'string' && typeof post.permalink === 'string' && post.permalink.startsWith('/') && !post.permalink.startsWith('//'));
      fuse = new Fuse(posts.map(post => ({ ...post,
        normalizedTitle: normalize(post.title), normalizedContent: normalize((post.summary || '') + '\n' + (post.content || '')),
        normalizedTags: (post.tags || []).map(normalize), normalizedCategories: (post.categories || []).map(normalize),
      })), {
        ignoreLocation: true, threshold: 0.3, includeScore: true,
        keys: [{ name:'normalizedTitle', weight:3 }, { name:'normalizedTags', weight:2 }, { name:'normalizedCategories', weight:1 }, { name:'normalizedContent', weight:1 }],
      });
      search();
    } catch {
      status.textContent = 'Arama yüklenemedi. Bağlantını kontrol edip tekrar dene.';
      retry.hidden = false;
    } finally { loading = false; box.setAttribute('aria-busy', 'false'); }
  }
  input.disabled = false;
  const query = new URL(location.href).searchParams.get('q');
  if (query) input.value = query.slice(0, 120);
  input.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(search, 120); });
  input.addEventListener('search', search);
  form.addEventListener('submit', event => { event.preventDefault(); clearTimeout(debounce); search(); });
  retry.addEventListener('click', load);
  box.addEventListener('keydown', event => {
    const links = Array.from(results.querySelectorAll('a'));
    if (event.key === 'Escape') { input.value = ''; search(); input.focus(); return; }
    if (!['ArrowDown', 'ArrowUp'].includes(event.key) || !links.length) return;
    const current = links.indexOf(document.activeElement);
    const next = event.key === 'ArrowDown' ? Math.min(current + 1, links.length - 1) : current - 1;
    event.preventDefault();
    if (next < 0) input.focus(); else links[next].focus();
  });
  load();
})();
