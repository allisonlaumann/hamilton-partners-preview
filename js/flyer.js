/* Client-side recreation of the current site's generate_suites_pdf flyer.
   flyer.html?ids=12741,27750 → renders one letter-size flyer per suite,
   matching the live PDF layout: green header band, building photo,
   suite features, details table, floor-plan key, space plan, broker footer.
   Print via the browser's Save-as-PDF (Phase 2 swaps this for a server endpoint). */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var ids = (params.get('ids') || '').split(',').filter(Boolean);

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* map the suite's scraped images onto flyer slots:
     "key" image → small floor-plan locator; "plan" (non-key) → big space plan */
  function planImages(images) {
    var key = null, plan = null;
    (images || []).forEach(function (u) {
      var f = u.toLowerCase();
      if (f.indexOf('key') !== -1) { if (!key) key = u; }
      else if (f.indexOf('mkt') === -1) { if (!plan) plan = u; }
    });
    return { key: key, plan: plan || (images && images[0]) || null };
  }

  function detail(list, label) {
    for (var i = 0; i < (list || []).length; i++) {
      if (list[i].label.toLowerCase().indexOf(label) !== -1) return list[i].value;
    }
    return null;
  }

  function contactHtml(c) {
    var lines = '';
    (c.phones || []).forEach(function (p) {
      lines += esc(p.type) + ' ' + esc(p.number) + '<br>';
    });
    return '<div class="contact"><h4>' + esc(c.name) + '</h4>' +
      (c.email ? '<a class="c-mail" href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a><br>' : '') +
      lines + '</div>';
  }

  function flyerHtml(suite, building) {
    var imgs = planImages(suite.images);
    var floor = detail(suite.details, 'floor');
    var detailRows = (suite.details || []).filter(function (d) {
      return d.label.toLowerCase().indexOf('floor') === -1; // floor shown in plan title
    }).map(function (d) {
      var label = d.label.replace('Sq. Footage', 'Square Feet').replace('OP Expense', 'OP. Expense');
      return '<tr><th>' + esc(label) + ':</th><td>' + esc(d.value) + '</td></tr>';
    }).join('');

    var features = (suite.features || []).map(function (f) {
      return '<li>' + esc(f) + '</li>';
    }).join('');

    return '' +
      '<section class="flyer">' +
        '<header class="f-head">' +
          '<div class="f-addr">' +
            '<strong>' + esc(suite.building) + '</strong>' +
            '<em>' + esc(suite.title) + '</em>' +
            '<em>' + esc(suite.address) + '</em>' +
          '</div>' +
          '<div class="f-brand">' +
            '<img src="assets/logo/hp-logo-white.svg" alt="Hamilton Partners" />' +
            '<span>www.hamiltonpartners.com</span>' +
          '</div>' +
        '</header>' +
        '<div class="f-body">' +
          '<div class="f-cols">' +
            '<div class="f-col-photo">' +
              (building && building.image ? '<img class="f-photo" src="' + esc(building.image) + '" alt="' + esc(suite.building) + '" />' : '') +
              '<h3 class="f-rule">Details</h3>' +
              '<table class="f-details">' + detailRows + '</table>' +
            '</div>' +
            '<div class="f-col-features">' +
              '<h3 class="f-rule">Suite Features</h3>' +
              '<ul class="f-features">' + features + '</ul>' +
            '</div>' +
            '<div class="f-col-key">' +
              '<h3 class="f-rule">' + (floor ? esc(floor) + ' ' : '') + 'Floor Plan</h3>' +
              (imgs.key ? '<img class="f-key" src="' + esc(imgs.key) + '" alt="Floor plan key" />' : '') +
            '</div>' +
          '</div>' +
          '<h3 class="f-rule">Space Plan</h3>' +
          (imgs.plan ? '<div class="f-plan-wrap"><img class="f-plan" src="' + esc(imgs.plan) + '" alt="Space plan" /></div>' : '') +
        '</div>' +
        '<footer class="f-foot">' +
          '<h3 class="f-rule">Hamilton Partners &mdash; Sponsoring Broker</h3>' +
          '<div class="f-contacts">' + (suite.contacts || []).map(contactHtml).join('') + '</div>' +
        '</footer>' +
      '</section>';
  }

  fetch('data/hamilton-lakes.json')
    .then(function (r) { return r.json(); })
    .then(function (park) {
      var found = [];
      park.buildings.forEach(function (b) {
        b.suites.forEach(function (s) {
          if (ids.indexOf(String(s.id)) !== -1) found.push({ suite: s, building: b });
        });
      });
      var host = document.getElementById('flyers');
      if (!found.length) {
        host.innerHTML = '<p class="f-empty">No suites matched. Open this page from the ' +
          '<a href="listings.html">listings</a>.</p>';
        return;
      }
      host.innerHTML = found.map(function (f) { return flyerHtml(f.suite, f.building); }).join('');
      document.getElementById('tbHint').textContent =
        found.length + (found.length === 1 ? ' flyer' : ' flyers') +
        ' — use "Save as PDF" in the print dialog. Tip: set margins to None.';
      document.title = 'Suite Flyer' + (found.length > 1 ? 's' : '') + ' — ' +
        found.map(function (f) { return f.suite.title; }).join(', ') + ' | Hamilton Partners';
    });

  document.getElementById('printBtn').addEventListener('click', function () {
    window.print();
  });
})();
