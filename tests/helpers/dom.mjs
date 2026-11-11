import domino from '@mixmark-io/domino';
import vm from 'node:vm';

// Domino supplies the HTML parser and DOM. These browser platform shims are
// limited to APIs it omits; network responses still run the real Worker code.
export function browserDOM(html, url, fetch, t) {
  const window = domino.createWindow(html, url);
  for (const list of [window.document.querySelectorAll('*'), window.document.querySelectorAll('form'), window.document.body.children]) {
    const listProto = Object.getPrototypeOf(list);
    if (!listProto[Symbol.iterator]) listProto[Symbol.iterator] = Array.prototype[Symbol.iterator];
    if (!listProto.forEach) listProto.forEach = Array.prototype.forEach;
  }
  let focused;
  Object.defineProperty(window.document, 'activeElement', { get: () => focused || window.document.body });
  for (const kind of ['HTMLButtonElement', 'HTMLInputElement', 'HTMLAnchorElement']) {
    Object.defineProperty(window[kind].prototype, 'focus', { configurable: true, value: function () { focused = this; } });
  }
  const proto = window.Element.prototype;
  if (!proto.append) proto.append = function (...items) { for (const item of items) this.appendChild(typeof item === 'string' ? this.ownerDocument.createTextNode(item) : item); };
  if (!proto.replaceChildren) proto.replaceChildren = function (...items) { while (this.firstChild) this.removeChild(this.firstChild); this.append(...items); };
  window.DocumentFragment.prototype.append = proto.append;
  for (const select of window.document.querySelectorAll('select')) select.value = select.querySelector('option')?.value || '';
  if (!Object.getOwnPropertyDescriptor(proto, 'dataset')) Object.defineProperty(proto, 'dataset', {
    get() { const element = this; return new Proxy({}, { get: (_, key) => element.getAttribute('data-' + key.replace(/[A-Z]/g, x => '-' + x.toLowerCase())), set: (_, key, value) => { element.setAttribute('data-' + key.replace(/[A-Z]/g, x => '-' + x.toLowerCase()), value); return true; } }); },
  });
  const timers = new Set();
  window.setTimeout = (callback, ms) => { const timer = setTimeout(callback, ms); timers.add(timer); return timer; };
  window.clearTimeout = clearTimeout;
  window.fetch = fetch; window.AbortSignal = AbortSignal; window.URL = URL;
  window.confirm = () => true;
  window.Option = function (text, value) { const option = window.document.createElement('option'); option.textContent = text; option.value = value; return option; };
  const storage = new Map();
  window.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, val) => storage.set(key, val), removeItem: key => storage.delete(key) };
  for (const form of window.document.querySelectorAll('form')) form.reset = () => { for (const el of form.querySelectorAll('input, textarea')) el.value = ''; };
  t.after(() => { for (const timer of timers) clearTimeout(timer); });
  const context = vm.createContext(window);
  return { window, document: window.document, run: source => vm.runInContext(source, context) };
}

export function fire(dom, element, name) {
  assertElement(element, name);
  element.dispatchEvent(new dom.window.Event(name, { bubbles: true, cancelable: true }));
}
function assertElement(element, name) { if (!element) throw new Error('Missing element for ' + name); }
export async function until(check) {
  for (let i = 0; i < 100; i++) { if (check()) return; await new Promise(resolve => setTimeout(resolve, 2)); }
  throw new Error('UI did not reach expected state');
}
export const findButton = (document, label) => [...document.querySelectorAll('button')].find(button => {
  if (button.textContent !== label) return false;
  for (let element = button; element; element = element.parentElement) if (element.hidden) return false;
  return true;
});
