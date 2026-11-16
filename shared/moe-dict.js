/* 紅色字詞 → 教育部《重編國語辭典修訂本》超連結
   掃描紅字元素（.target-text、.chip.target、.t、.sent span），把其中每段中文字包成連結，
   動態產生的題目／詳解也會自動處理（MutationObserver）。按鈕裡的字不加連結，避免誤觸作答。 */
(function () {
  var SEL = '.target-text,.chip.target,.t,.sent span,[data-moe]';
  var BASE = 'https://dict.revised.moe.edu.tw/search.jsp?md=1&qMd=0&qCol=1&word=';
  var CJK = /([㐀-䶿一-鿿豈-﫿]+)/;
  var css = document.createElement('style');
  css.textContent = 'a.moe{color:inherit;font:inherit;text-decoration:underline dotted;text-underline-offset:3px;text-decoration-thickness:1px}' +
    'a.moe:hover,a.moe:focus-visible{text-decoration-style:solid;background:rgba(192,57,43,.1);border-radius:3px;outline:none}';
  document.head.appendChild(css);

  function linkify(el) {
    if (el.closest('button,a,input,select,textarea,[data-no-moe]')) return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    while ((n = walker.nextNode())) if (CJK.test(n.nodeValue) && !n.parentNode.closest('a')) nodes.push(n);
    nodes.forEach(function (t) {
      var parts = t.nodeValue.split(CJK), frag = document.createDocumentFragment();
      parts.forEach(function (p, i) {
        if (!p) return;
        if (i % 2) {
          var a = document.createElement('a');
          a.className = 'moe'; a.href = BASE + encodeURIComponent(p); a.target = '_blank'; a.rel = 'noopener';
          a.title = '查教育部國語辭典：' + p; a.textContent = p;
          a.addEventListener('click', function (e) { e.stopPropagation(); });
          frag.appendChild(a);
        } else frag.appendChild(document.createTextNode(p));
      });
      t.parentNode.replaceChild(frag, t);
    });
  }
  function scan(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches(SEL)) linkify(root);
    root.querySelectorAll(SEL).forEach(linkify);
  }
  var pending = [], queued = false;
  function flush() { queued = false; var list = pending; pending = []; list.forEach(scan); }
  function start() {
    scan(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) { m.addedNodes.forEach(function (x) { if (x.nodeType === 1) pending.push(x); else if (x.parentNode && x.parentNode.nodeType === 1) pending.push(x.parentNode.closest(SEL) || x.parentNode); }); });
      if (pending.length && !queued) { queued = true; requestAnimationFrame(flush); }
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
