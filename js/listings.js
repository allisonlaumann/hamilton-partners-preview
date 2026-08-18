/* Hamilton Lakes listings — renders buildings + suites from data/hamilton-lakes.json,
   tracks suite selection, and links into the flyer generator (flyer.html?ids=…).
   Mirrors the current site's park page structure: park → buildings → suites. */
(function () {
  'use strict';

  var state = { selected: [] };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function detail(list, label) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].label.toLowerCase().indexOf(label) !== -1) return list[i].value;
    }
    return null;
  }

  function renderBuilding(b) {
    var sec = el('article', 'bld');
    var media = el('div', 'bld-media');
    if (b.image) {
      var imgLink = el('a');
      imgLink.href = 'building.html?b=' + b.slug;
      var img = el('img');
      img.src = b.image; img.alt = b.name; img.loading = 'lazy';
      imgLink.appendChild(img);
      media.appendChild(imgLink);
    }
    sec.appendChild(media);

    var body = el('div', 'bld-body');
    body.appendChild(el('h2', 'bld-name',
      '<a href="building.html?b=' + b.slug + '">' + b.name + '</a>'));

    // headline facts pulled from the details table
    var facts = el('ul', 'bld-facts');
    b.details.forEach(function (d) {
      facts.appendChild(el('li', null, '<span>' + d.label + '</span>' + d.value));
    });
    body.appendChild(facts);

    if (b.suites.length) {
      var tbl = el('table', 'suite-table');
      tbl.innerHTML = '<thead><tr><th class="st-check"><span class="sr-only">Select</span></th>' +
        '<th>Suite</th><th>Space</th><th>Net Rent</th><th class="st-pdf"></th></tr></thead>';
      var tb = el('tbody');
      b.suites.forEach(function (s) {
        var tr = el('tr');
        var net = detail(s.details || [], 'net rent') || '&mdash;';
        tr.innerHTML =
          '<td class="st-check"><input type="checkbox" value="' + s.id + '" aria-label="Select ' + s.name + '"></td>' +
          '<td><a class="suite-name" href="suite.html?s=' + s.id + '">' + s.name + '</a></td>' +
          '<td>' + (s.sf ? s.sf + ' S.F.' : '&mdash;') + '</td>' +
          '<td>' + net + '</td>' +
          '<td class="st-pdf"><a href="flyer.html?ids=' + s.id + '" target="_blank" rel="noopener">Flyer &rarr;</a></td>';
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      body.appendChild(tbl);
    } else {
      body.appendChild(el('p', 'bld-none', 'Fully leased &mdash; no availabilities at this time.'));
    }

    sec.appendChild(body);
    return sec;
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
      var host = document.getElementById('buildings');
      var total = 0;
      park.buildings.forEach(function (b) {
        total += b.suites.length;
        host.appendChild(renderBuilding(b));
      });
      document.getElementById('dataNote').textContent =
        park.buildings.length + ' buildings · ' + total + ' available suites · data refreshed ' + park.scrapedAt;
    })
    .catch(function () {
      document.getElementById('dataNote').textContent =
        'Could not load listing data (data/hamilton-lakes.json).';
    });
})();
