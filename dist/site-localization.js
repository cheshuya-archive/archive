import { translateText } from "./site-translations.js";
const attributes = ["aria-label", "alt", "title"];
const ignored = "script,style,noscript,template";
let locale = window.CheshuyaLocale?.get() || "ru";
function translate(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    if (root.parentElement?.closest(ignored)) return;
    const next = translateText(root.nodeValue, locale);
    if (next !== root.nodeValue) root.nodeValue = next;
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  if (root.matches?.(ignored)) return;
  const elements = root.nodeType === Node.ELEMENT_NODE ? [root, ...root.querySelectorAll("[aria-label],[alt],[title]")] : [...root.querySelectorAll("[aria-label],[alt],[title]")];
  for (const element of elements) for (const attr of attributes) {
    const value = element.getAttribute(attr);
    if (value === null) continue;
    const next = translateText(value, locale);
    if (next !== value) element.setAttribute(attr, next);
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) translate(walker.currentNode);
}
document.addEventListener("cheshuya:locale", event => {
  locale = event.detail === "en" ? "en" : "ru";
  translate(document);
});
translate(document);
// Only inspect changed subtrees; no full-document scan on scroll or animation frames.
new MutationObserver(records => {
  const roots = new Set();
  for (const record of records) {
    if (record.type === "attributes" || record.type === "characterData") roots.add(record.target);
    else for (const node of record.addedNodes) roots.add(node);
  }
  for (const root of roots) if (root.isConnected) translate(root);
}).observe(document.documentElement, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:attributes});
