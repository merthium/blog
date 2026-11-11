import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import domino from '@mixmark-io/domino';
import { browserDOM, fire, until } from './helpers/dom.mjs';
import { fixtureSite } from './helpers/content.mjs';

let output;
before(async () => {
  const fixture = await fixtureSite();
  output = fixture.output;
  await promisify(execFile)('hugo', ['--contentDir', fixture.content, '--destination', output]);
});
const docAt = async path => domino.createDocument(await readFile(join(output, path), 'utf8'));

test('built search index includes post content and taxonomy but excludes author pages and drafts', async () => {
  const index = JSON.parse(await readFile(join(output, 'index.json'), 'utf8'));
  assert.equal(index.length, 3);
  assert.ok(index.every(item => item.permalink.startsWith('/posts/') && Array.isArray(item.tags)));
  assert.ok(index.some(item => item.title === 'Orta Seviye Crackme' && item.content.includes('entry0') && item.tags.includes('crackme')));
  assert.ok(!JSON.stringify(index).includes('SECRET DRAFT'));
  const doc = await docAt('search/index.html');
  assert.ok(doc.querySelector('label[for="searchInput"]'));
  assert.ok(doc.querySelector('#search-status[role="status"]'));
  assert.equal(doc.querySelectorAll('#comment-form').length, 0);
});

test('related posts exclude self and non-post pages, and RSS is reachable in navigation and after posts', async () => {
  const doc = await docAt('posts/orta-seviye-crackme-cozumu/index.html');
  const related = Array.from(doc.querySelectorAll('.related-posts a'));
  assert.ok(related.length > 0 && related.length <= 3);
  assert.ok(related.some(link => link.getAttribute('href') === '/posts/basit-seviye-bir-crackme-cozumu/'));
  assert.ok(related.every(link => link.getAttribute('href').startsWith('/posts/') && !link.getAttribute('href').includes('orta-seviye')));
  assert.ok(doc.querySelector('.follow-posts a[type="application/rss+xml"]'));
  assert.ok(doc.querySelector('#menu a[href$="/index.xml"]'));
  assert.ok(doc.querySelector('#menu a[href$="/search/"]'));
  assert.match(await readFile(join(output, 'index.xml'), 'utf8'), /<rss/);
  const fallback = await docAt('posts/ag/index.html');
  assert.equal(fallback.getElementById('related-title').textContent, 'Diğer yazılar');
});

async function readingDOM(html, t) {
  const dom = browserDOM(html, 'https://blog.linkola.workers.dev/posts/test/', undefined, t);
  dom.run(await readFile('assets/js/reading.js', 'utf8'));
  const dialog = dom.document.querySelector('.image-lightbox');
  if (dialog) Object.defineProperties(dialog, {
    showModal: { value() { this.setAttribute('open', ''); } },
    close: { value() { this.removeAttribute('open'); this.dispatchEvent(new dom.window.Event('close')); } },
  });
  return dom;
}

test('long code folds without truncating content or removing copy controls, and toggles both ways', async t => {
  const lines = Array.from({ length: 35 }, (_, i) => 'line ' + i).join('\n');
  const dom = await readingDOM('<div class="post-content"><div class="highlight"><pre><code>' + lines + '</code></pre><button class="copy-code">Kopyala</button></div><pre><code>short</code></pre></div>', t);
  const folds = dom.document.querySelectorAll('.code-fold'); assert.equal(folds.length, 1);
  const toggle = dom.document.querySelector('.code-fold-toggle');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(dom.document.querySelector('.code-fold code').textContent, lines);
  assert.equal(dom.document.querySelectorAll('.copy-code').length, 1);
  assert.ok(dom.document.getElementById(toggle.getAttribute('aria-controls')));
  fire(dom, toggle, 'click'); assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  fire(dom, toggle, 'click'); assert.equal(toggle.getAttribute('aria-expanded'), 'false');
});

test('image zoom preserves linked images and captions, opens original image and closes', async t => {
  const dom = await readingDOM('<div class="post-content"><figure><img src="/uploads/trace.png" alt="Register değerleri"><figcaption>Hata anındaki değerler</figcaption></figure><a href="/existing/"><img src="/linked.png" alt="Bağlantılı"></a></div><div id="yorumlar"><img src="/avatar.png"></div>', t);
  const trigger = dom.document.querySelector('.image-zoom-trigger'); assert.ok(trigger);
  assert.equal(dom.document.querySelectorAll('.image-zoom-trigger').length, 1);
  assert.equal(dom.document.querySelector('a[href="/existing/"] img').getAttribute('src'), '/linked.png');
  fire(dom, trigger, 'click');
  const dialog = dom.document.querySelector('.image-lightbox');
  assert.ok(dialog.hasAttribute('open'));
  assert.match(dialog.querySelector('img').src, /\/uploads\/trace.png$/);
  assert.match(dialog.textContent, /Hata anındaki değerler/);
  fire(dom, dialog.querySelector('.lightbox-close'), 'click'); assert.equal(dialog.hasAttribute('open'), false);
  fire(dom, trigger, 'click'); fire(dom, dialog, 'cancel'); assert.equal(dialog.hasAttribute('open'), false);
});

const articles = [
  { title:'Ağ Güvenliği', content:'Wireshark ve nftables kullanımı', summary:'Paketleri incelemek.', tags:['güvenlik'], categories:['Network'], permalink:'/posts/ag/' },
  { title:'Crackme çözümü', content:'radare2 ile analiz', summary:'İkili dosya incelemesi.', tags:['reversing'], categories:['Reversing'], permalink:'/posts/crackme/' },
  { title:'<img src=x onerror=alert(1)>', content:'etikettest', summary:'<script>alert(1)</script>', tags:[], categories:[], permalink:'/posts/safe/' },
];
async function searchDOM(fetch, t) {
  const html = await readFile(join(output, 'search/index.html'), 'utf8');
  const dom = browserDOM(html, 'https://blog.linkola.workers.dev/search/', fetch, t);
  dom.run(await readFile('themes/PaperMod/assets/js/fuse.basic.min.js', 'utf8'));
  dom.run(await readFile('assets/js/fastsearch.js', 'utf8'));
  return dom;
}

test('search matches Turkish title, content and tags and treats result text as text', async t => {
  const dom = await searchDOM(async () => Response.json(articles), t);
  const input = dom.document.getElementById('searchInput');
  await until(() => !input.disabled);
  for (const query of ['ag guvenligi', 'WIRESHARK', 'guvenlik']) {
    input.value = query; fire(dom, input, 'input');
    await until(() => dom.document.getElementById('searchResults').textContent.includes('Ağ Güvenliği'));
  }
  input.value = 'radare2'; fire(dom, input, 'input');
  await until(() => dom.document.getElementById('searchResults').textContent.includes('Crackme'));
  input.value = 'etikettest'; fire(dom, input, 'input');
  await until(() => dom.document.getElementById('searchResults').textContent.includes('<img'));
  assert.equal(dom.document.querySelectorAll('#searchResults img, #searchResults script').length, 0);
  input.value = 'zzzznotfoundzzzz'; fire(dom, input, 'input');
  await until(() => /bulunamadı/.test(dom.document.getElementById('search-status').textContent));
  assert.equal(dom.document.querySelectorAll('#searchResults li').length, 0);
});

test('search fetch failure offers retry and uses a query entered before loading completes', async t => {
  let attempts = 0, finish;
  const dom = await searchDOM(async () => {
    attempts++; if (attempts === 1) throw new Error('offline');
    return new Promise(resolve => { finish = resolve; });
  }, t);
  const retry = dom.document.getElementById('search-retry');
  await until(() => !retry.hidden);
  fire(dom, retry, 'click');
  const input = dom.document.getElementById('searchInput'); input.value = 'nftables'; fire(dom, input, 'input');
  finish(Response.json(articles));
  await until(() => dom.document.getElementById('searchResults').textContent.includes('Ağ Güvenliği'));
  assert.equal(attempts, 2);
});

test('PaperMod fragment navigation opens hidden code before scrolling without relying on hashchange', async t => {
  const lines = Array.from({length:35},(_,i)=>i===30?'<span id="line-31">target</span>':'line '+i).join('\n');
  const dom = await readingDOM('<div class="post-content"><a href="#line-31">Satıra git</a><pre><code>'+lines+'</code></pre></div>',t);
  const target=dom.document.getElementById('line-31');
  const toggle=dom.document.querySelector('.code-fold-toggle');
  let openWhenScrolled=false;
  Object.defineProperty(target,'scrollIntoView',{value(){openWhenScrolled=toggle.getAttribute('aria-expanded')==='true';}});
  Object.defineProperty(target,'focus',{value(){}});
  Object.defineProperty(dom.window.history,'pushState',{value(){}});
  dom.window.matchMedia=()=>({matches:true});
  const footer=await readFile('themes/PaperMod/layouts/_partials/footer.html','utf8');
  const start=footer.indexOf(`    document.querySelectorAll('a[href^="#"]')`);
  dom.run(footer.slice(start,footer.indexOf('</script>',start)));
  fire(dom,dom.document.querySelector('a'),'click');
  assert.equal(openWhenScrolled,true);
  assert.equal(toggle.getAttribute('aria-expanded'),'true');
});
