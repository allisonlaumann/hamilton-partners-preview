/* Suite detail page — suite.html?s=<id>
   Mirrors the current site's /suite/<slug>/ page: plan gallery, suite features,
   details table, leasing contacts, and the Download Printable PDF action. */
(function () {
  'use strict';

  var id = new URLSearchParams(location.search).get('s');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function galleryHtml(images, altBase) {
    if (!images || !images.length) return '';
    var thumbs = images.map(function (u, i) {
      return '<button class="g-thumb' + (i === 0 ? ' is-active' : '') + '" data-src="' + esc(u) +
        '" type="button" aria-label="Plan ' + (i + 1) + '"><img src="' + esc(u) + '" alt="" loading="lazy"></button>';
    }).join('');
    return '<div class="gallery">' +
      '<div class="g-main"><img id="gMain" src="' + esc(images[0]) + '" alt="' + esc(altBase) + '"></div>' +
      (images.length > 1 ? '<div class="g-thumbs">' + thumbs + '</div>' : '') +
      '</div>';
  }

  function render(s, b) {
    document.title = s.building + ' ' + s.title + ' | Hamilton Partners';

    document.getElementById('crumb').innerHTML =
      '<a href="building.html?b=' + esc(b.slug) + '">&larr; Back to ' + esc(b.name) + '</a>';

    var features = (s.features || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('');
    var details = (s.details || []).map(function (d) {
      return '<tr><th>' + esc(d.label) + ':</th><td>' + esc(d.value) + '</td></tr>';
    }).join('');
    var contacts = (s.contacts || []).map(function (c) {
      var phones = (c.phones || []).map(function (p) {
        return esc(p.type) + ' ' + esc(p.number);
      }).join('<br>');
      return '<li><h4>' + esc(c.name) + '</h4>' +
        (c.email ? '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a><br>' : '') +
        phones + '</li>';
    }).join('');

    document.getElementById('suiteRoot').innerHTML =
      '<div class="bstrip">' +
        (b.image ? '<a href="building.html?b=' + esc(b.slug) + '"><img src="' + esc(b.image) + '" alt="' + esc(b.name) + '"></a>' : '') +
        '<div><h3>' + esc(s.building) + '</h3><p>' + esc(s.address) + '</p></div>' +
      '</div>' +
      '<div class="detail-grid">' +
        '<div>' + galleryHtml(s.images, s.title + ' plans') + '</div>' +
        '<div class="detail-body">' +
          '<h1 class="detail-title">' + esc(s.title) + '</h1>' +
          '<p class="action-row">' +
            '<a class="btn btn--primary" href="flyer.html?ids=' + esc(s.id) + '" target="_blank" rel="noopener">Download Printable PDF</a>' +
            '<a class="action-link" href="' + esc(s.url) + '" target="_blank" rel="noopener">View on hamiltonpartners.com</a>' +
          '</p>' +
          (features ? '<h3 class="sub-head">Suite Features</h3><ul class="amen-list">' + features + '</ul>' : '') +
          '<h3 class="sub-head">Details</h3>' +
          '<table class="detail-table">' + details + '</table>' +
          (contacts ? '<h3 class="sub-head">Leasing Contacts</h3><ul class="contact-grid contact-grid--stack">' + contacts + '</ul>' : '') +
        '</div>' +
      '</div>';

    document.getElementById('srcLink').href = s.url;

    document.querySelectorAll('.g-thumb').forEach(function (t) {
      t.addEventListener('click', function () {
        document.getElementById('gMain').src = t.dataset.src;
        document.querySelectorAll('.g-thumb').forEach(function (x) { x.classList.remove('is-active'); });
        t.classList.add('is-active');
      });
    });
  }

  fetch('data/hamilton-lakes.json')
    .then(function (r) { return r.json(); })
    .then(function (park) {
      var hit = null;
      park.buildings.forEach(function (b) {
        b.suites.forEach(function (s) {
          if (String(s.id) === String(id)) hit = { s: s, b: b };
        });
      });
      if (!hit) {
        document.getElementById('suiteRoot').innerHTML =
          '<p class="listings-note">Suite not found. <a href="listings.html">Back to the park page</a>.</p>';
        return;
      }
      render(hit.s, hit.b);
    });
})();
