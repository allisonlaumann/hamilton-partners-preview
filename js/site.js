/* Production behaviors (these ship): solid-on-scroll header + mobile nav. */
(function () {
  var header = document.getElementById('siteHeader');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();

/* Hero photo rotation + progress (ships): crossfade the 3 photos every 7s with
   a progress bar that fills toward each switch. data-hero="rotate" → auto-cycle;
   a specific name → pin that photo (progress hidden). Progress is rAF-driven so
   it stays smooth; the dev panel drives the mode via data-hero. */
(function () {
  var hero = document.getElementById('hero');
  if (!hero) return;
  var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
  if (slides.length < 2) return;
  var root = document.documentElement;
  var progress = document.getElementById('heroProgress');
  var segs = progress ? Array.prototype.slice.call(progress.querySelectorAll('.hp-seg')) : [];
  var INTERVAL = 7000;
  var i = 0, timer = null, raf = null, startTs = 0, rotating = false;

  function markActive() {
    slides.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
    segs.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
  }
  function fillStep(ts) {
    if (!startTs) startTs = ts;
    var pct = Math.min((ts - startTs) / INTERVAL, 1);
    var fill = segs[i] && segs[i].querySelector('.hp-fill');
    if (fill) fill.style.width = (pct * 100) + '%';
    if (pct < 1) raf = requestAnimationFrame(fillStep);
  }
  function resetFill() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    startTs = 0;
    segs.forEach(function (s) { var f = s.querySelector('.hp-fill'); if (f) f.style.width = '0%'; });
    if (rotating) raf = requestAnimationFrame(fillStep);
  }
  function show(n) {
    i = (n + slides.length) % slides.length;
    markActive();
    resetFill();
  }
  function idxOf(name) {
    for (var k = 0; k < slides.length; k++) {
      if (slides[k].getAttribute('data-slide') === name) return k;
    }
    return 0;
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }
  function start() { stop(); timer = setInterval(function () { show(i + 1); }, INTERVAL); }

  function apply() {
    var mode = root.getAttribute('data-hero') || 'rotate';
    if (mode === 'rotate') {
      rotating = true;
      if (progress) progress.hidden = false;
      show(i);
      start();
    } else {
      rotating = false;
      if (progress) progress.hidden = true;
      stop();
      show(idxOf(mode));
    }
  }

  segs.forEach(function (seg, idx) {
    seg.addEventListener('click', function () {
      if (!rotating) return;
      show(idx);
      start();
    });
  });

  apply();
  new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ['data-hero'] });
})();
