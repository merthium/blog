(() => {
  'use strict';
  const content = document.querySelector('.post-content');
  if (!content) return;
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  // Keep every line in the DOM so copying and printing retain the full output.
  const folded = new Set();
  content.querySelectorAll('pre').forEach((pre, index) => {
    const code = pre.querySelector('code');
    if (!code) return;
    const lines = code.textContent.replace(/\n$/, '').split('\n').length;
    const block = pre.closest('.highlight') || pre;
    if (lines <= 20 || folded.has(block)) return;
    folded.add(block);
    const wrapper = make('div', 'code-fold is-collapsed');
    const panel = make('div', 'code-fold-content');
    panel.id = 'blog-code-output-' + (index + 1);
    const toggle = make('button', 'code-fold-toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', panel.id);
    function expand(open) {
      wrapper.classList.toggle('is-collapsed', !open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Çıktıyı kısalt' : 'Tamamını göster · ' + lines + ' satır';
    }
    expand(false);
    block.parentNode.insertBefore(wrapper, block);
    panel.append(block); wrapper.append(panel, toggle);
    toggle.addEventListener('click', () => expand(toggle.getAttribute('aria-expanded') !== 'true'));
    // Heading/line anchors inside a folded output should remain reachable.
    function revealAnchor(hash = location.hash) {
      if (!hash) return;
      try {
        const target = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (target && panel.contains(target)) expand(true);
      } catch { /* Invalid URL fragments do not affect reading. */ }
    }
    window.addEventListener('hashchange', () => revealAnchor());
    // PaperMod uses pushState for fragment links, so expand before its scroll handler.
    document.addEventListener('click', event => {
      const anchor = event.target.closest?.('a[href^="#"]');
      if (anchor) revealAnchor(anchor.getAttribute('href'));
    }, true);
    revealAnchor();
  });

  const images = Array.from(content.querySelectorAll('img')).filter(image => !image.closest('a, button'));
  if (!images.length) return;
  const dialog = make('dialog', 'image-lightbox');
  dialog.setAttribute('aria-labelledby', 'lightbox-caption');
  const panel = make('div', 'lightbox-panel');
  const toolbar = make('div', 'lightbox-toolbar');
  const original = make('a', 'lightbox-original', 'Özgün görseli aç ↗');
  original.target = '_blank'; original.rel = 'noopener noreferrer';
  const close = make('button', 'lightbox-close', 'Kapat ×'); close.type = 'button';
  close.setAttribute('aria-label', 'Görseli kapat');
  const large = make('img', 'lightbox-image');
  const caption = make('p', 'lightbox-caption'); caption.id = 'lightbox-caption';
  toolbar.append(original, close); panel.append(toolbar, large, caption); dialog.append(panel);
  document.body.append(dialog);
  let opener;
  const canOpen = typeof dialog.showModal === 'function';
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => { event.preventDefault(); dialog.close(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('lightbox-open');
    large.removeAttribute('src'); opener?.focus();
  });
  images.forEach((image, index) => {
    const existingCaption = image.closest('figure')?.querySelector('figcaption')?.textContent.trim();
    const alt = image.alt.trim();
    const isFilename = /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(alt);
    const label = existingCaption || (alt && !isFilename ? alt : 'Görsel ' + (index + 1));
    const trigger = make(canOpen ? 'button' : 'a', 'image-zoom-trigger');
    trigger.setAttribute('aria-label', label + ' — büyüt');
    if (canOpen) { trigger.type = 'button'; trigger.setAttribute('aria-haspopup', 'dialog'); }
    else { trigger.href = image.currentSrc || image.src; trigger.target = '_blank'; trigger.rel = 'noopener noreferrer'; }
    image.parentNode.insertBefore(trigger, image); trigger.append(image);
    if (!existingCaption) {
      const hint = make('span', 'image-zoom-hint', label + ' · Büyütmek için seç');
      trigger.parentNode.insertBefore(hint, trigger.nextSibling);
    }
    if (!canOpen) return;
    trigger.addEventListener('click', () => {
      opener = trigger;
      large.src = image.currentSrc || image.src; large.alt = label;
      original.href = large.src; caption.textContent = label;
      dialog.showModal();
      document.documentElement.classList.add('lightbox-open');
      close.focus();
    });
  });
})();
