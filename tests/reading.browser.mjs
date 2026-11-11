import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from 'playwright-core';
import { fixtureSite } from './helpers/content.mjs';

const fixture = await fixtureSite();
const output = fixture.root;
await promisify(execFile)('hugo', ['--contentDir', fixture.content, '--destination', fixture.output]);
const root = resolve(output, 'public');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/sbin/chromium', headless:true, args:['--no-sandbox','--disable-dev-shm-usage','--disable-crashpad-for-testing'] });
try {
  const page = await browser.newPage({ viewport:{width:1280,height:900} });
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://challenges.cloudflare.com/**',route=>route.fulfill({contentType:'text/javascript',body:'window.turnstile={reset(){}};'}));
  await page.route('https://blog.linkola.workers.dev/**',async route=>{
    const path=decodeURIComponent(new URL(route.request().url()).pathname);
    if(path==='/api/comments')return route.fulfill({contentType:'application/json',body:'{"comments":[]}'});
    let file=resolve(root,'.'+path);
    if(!file.startsWith(root+'/')&&file!==root)return route.fulfill({status:404,body:''});
    try{
      if((await stat(file)).isDirectory())file=join(file,'index.html');
      return route.fulfill({contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.xml':'application/xml'})[extname(file)]||'application/octet-stream',body:await readFile(file)});
    }catch{
      // Fixture exercises the natural size of a technical screenshot.
      if(/\.(png|jpe?g)$/.test(path))return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900"><rect width="1400" height="900" fill="#263b36"/><text x="60" y="100" fill="white" font-size="40">Test görseli</text></svg>'});
      return route.fulfill({status:404,body:''});
    }
  });
  await page.goto('https://blog.linkola.workers.dev/posts/orta-seviye-crackme-cozumu/');
  const toggle=page.locator('.code-fold-toggle').first();
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  const image=page.locator('.image-zoom-trigger').first();await image.click();
  await page.locator('.image-lightbox[open]').waitFor();
  await page.keyboard.press('Escape');await page.locator('.image-lightbox[open]').waitFor({state:'hidden'});
  assert.equal(await image.evaluate(el=>el===document.activeElement),true);
  for(const width of [1280,390,320]){
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'post overflow at '+width);
    await page.screenshot({path:join(output,'post-'+width+'.png'),fullPage:true});
    await image.click();
    assert.ok(await page.locator('.image-lightbox').evaluate(el=>el.getBoundingClientRect().right<=innerWidth));
    await page.getByRole('button',{name:'Görseli kapat'}).click();
  }
  await page.goto('https://blog.linkola.workers.dev/search/?q=radare2');
  await page.locator('.search-result').first().waitFor();
  await page.getByLabel('Aranacak kelime').fill('wireshark');
  await page.waitForFunction(()=>document.querySelector('#searchResults').textContent.toLowerCase().includes('wireshark'));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  console.log('Browser checks passed. Screenshots: '+output);
} finally { await browser.close(); }
