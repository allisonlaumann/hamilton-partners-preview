/* Building detail page — building.html?b=<slug>
   Mirrors the current site's /building/<slug>/ page: photo gallery, address,
   map + brochure links, amenities, details, available suites, leasing contacts. */
(function () {
  'use strict';

  var slug = new URLSearchParams(location.search).get('b');
  var state = { selected: [] };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function detail(list, label) {
    for (var i = 0; i < (list || []).length; i++) {
      if (list[i].label.toLowerCase().indexOf(label) !== -1) return list[i].value;
    }
    return null;
  }

  function galleryHtml(images, altBase) {
    if (!images || !images.length) return '';
    var thumbs = images.map(function (u, i) {
      return '<button class="g-thumb' + (i === 0 ? ' is-active' : '') + '" data-src="' + esc(u) +
        '" type="button" aria-label="Photo ' + (i + 1) + '"><img src="' + esc(u) + '" alt="" loading="lazy"></button>';
    }).join('');
    return '<div class="gallery">' +
      '<div class="g-main"><img id="gMain" src="' + esc(images[0]) + '" alt="' + esc(altBase) + '"></div>' +
      (images.length > 1 ? '<div class="g-thumbs">' + thumbs + '</div>' : '') +
      '</div>';
  }

  function suiteTable(b) {
    if (!b.suites.length) {
      return '<p class="bld-none">Fully leased &mdash; no availabilities at this time.</p>';
    }
    var rows = b.suites.map(function (s) {
      var net = detail(s.details, 'net rent') || '&mdash;';
      return '<tr>' +
        '<td class="st-check"><input type="checkbox" value="' + esc(s.id) + '" aria-label="Select ' + esc(s.name) + '"></td>' +
        '<td><a class="suite-name" href="suite.html?s=' + esc(s.id) + '">' + esc(s.name) + '</a></td>' +
        '<td>' + (s.sf ? esc(s.sf) + ' S.F.' : '&mdash;') + '</td>' +
        '<td>' + esc(net) + '</td>' +
        '<td class="st-pdf"><a href="flyer.html?ids=' + esc(s.id) + '" target="_blank" rel="noopener">Flyer &rarr;</a></td></tr>';
    }).join('');
    return '<table class="suite-table">' +
      '<thead><tr><th class="st-check"><span class="sr-only">Select</span></th>' +
      '<th>Suite</th><th>Space</th><th>Net Rent</th><th class="st-pdf"></th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>';
  }

  function contactsHtml(contacts) {
    if (!contacts || !contacts.length) return '';
    var cards = contacts.map(function (c) {
      var phones = (c.phones || []).map(function (p) {
        return esc(p.type) + ' ' + esc(p.number);
      }).join('<br>');
      return '<li><h4>' + esc(c.name) + '</h4>' +
        (c.email ? '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a><br>' : '') +
        phones + '</li>';
    }).join('');
    return '<h3 class="sub-head">Leasing Contacts</h3><ul class="contact-grid">' + cards + '</ul>';
  }

  function render(b) {
    document.title = b.name + ' — Hamilton Lakes | Hamilton Partners';
    var actions = '' +
      (b.map ? '<a class="action-link" href="' + esc(b.map) + '" target="_blank" rel="noopener">Map / Directions</a>' : '') +
      (b.brochure ? '<a class="action-link" href="' + esc(b.brochure) + '" target="_blank" rel="noopener">PDF Brochure</a>' : '') +
      '<a class="action-link" href="' + esc(b.url) + '" target="_blank" rel="noopener">View on hamiltonpartners.com</a>';

    var facts = (b.details || []).map(function (d) {
      return '<li><span>' + esc(d.label) + '</span>' + esc(d.value) + '</li>';
    }).join('');

    var amen = (b.amenities || []).map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('');

    document.getElementById('buildingRoot').innerHTML =
      '<div class="detail-grid">' +
        '<div>' + galleryHtml(b.gallery && b.gallery.length ? b.gallery : (b.image ? [b.image] : []), b.name) + '</div>' +
        '<div class="detail-body">' +
          '<p class="section-kicker">Hamilton Lakes Business Park</p>' +
          '<h1 class="detail-title">' + esc(b.name) + '</h1>' +
          (b.address ? '<p class="detail-addr">' + esc(b.address) + '</p>' : '') +
          '<p class="action-row">' + actions + '</p>' +
          '<ul class="bld-facts">' + facts + '</ul>' +
          (amen ? '<h3 class="sub-head">Amenities</h3><ul class="amen-list">' + amen + '</ul>' : '') +
        '</div>' +
      '</div>' +
      '<h3 class="sub-head sub-head--lg">Available Spaces</h3>' + suiteTable(b) +
      contactsHtml(b.contacts);

    var src = document.getElementById('srcLink');
    src.href = b.url;

    // gallery thumb clicks
    document.querySelectorAll('.g-thumb').forEach(function (t) {
      t.addEventListener('click', function () {
        document.getElementById('gMain').src = t.dataset.src;
        document.querySelectorAll('.g-thumb').forEach(function (x) { x.classList.remove('is-active'); });
        t.classList.add('is-active');
      });
    });
  }

  function refreshBar() {
    var bar = document.getElementById('selectBar');
    var n = state.selected.length;
    bar.hidden = n === 0;
    document.getElementById('selCount').textContent = n;
    document.getElementById('selNoun').textContent = n === 1 ? 'suite' : 'suites';
    document.getElementById('pdfLink').href = 'flyer.html?ids=' + state.selected.join(',');
  }

  document.addEventListener('change', function (e) {
    if (e.target.matches('.suite-table input[type="checkbox"]')) {
      var id = e.target.value;
      var i = state.selected.indexOf(id);
      if (e.target.checked && i === -1) state.selected.push(id);
      if (!e.target.checked && i !== -1) state.selected.splice(i, 1);
      refreshBar();
    }
  });

  document.getElementById('clearSel').addEventListener('click', function () {
    state.selected = [];
    document.querySelectorAll('.suite-table input:checked').forEach(function (cb) { cb.checked = false; });
    refreshBar();
  });

  fetch('data/hamilton-lakes.json')
    .then(function (r) { return r.json(); })
    .then(function (park) {
      var b = park.buildings.filter(function (x) { return x.slug === slug; })[0];
      if (!b) {
        document.getElementById('buildingRoot').innerHTML =
          '<p class="listings-note">Building not found. <a href="listings.html">Back to the park page</a>.</p>';
        return;
      }
      render(b);
    });
})();
