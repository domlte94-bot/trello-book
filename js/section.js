/* Vista dentro de la tarjeta */
var t = TrelloPowerUp.iframe();
var app = document.getElementById('app');
KC.applyTheme(t);

function openEditor(index) {
  var isNew = index == null;
  return t.modal({
    url: './edit.html',
    args: isNew ? {} : { index: index },
    title: isNew ? 'Agregar cliente' : 'Editar cliente',
    height: 620,
    accentColor: '#2457c5'
  });
}

function chip(link) {
  var url = KC.safeUrl(link.url);
  if (!url) return '';
  var k = KC.kind(url);
  return '<a class="chip chip-' + k.id + '" href="' + KC.esc(url) + '" target="_blank" rel="noopener noreferrer" title="' + KC.esc(url) + '">' +
    '<span class="chip-icon">' + (KC.ICONS[k.id] || KC.ICONS.web) + '</span>' +
    '<span class="chip-text">' + KC.esc(link.label || KC.autoLabel(url)) + '</span>' +
    '<span class="chip-src">' + KC.esc(k.label) + '</span></a>';
}

function book(c, i) {
  var links = (c.links || []).map(chip).join('');
  return '<article class="book" style="--spine:' + KC.colorHex(c.color) + '">' +
    '<div class="spine" aria-hidden="true"></div>' +
    '<div class="book-body">' +
      '<header class="book-head">' +
        '<div class="book-title"><h3>' + KC.esc(c.name) + '</h3>' +
        (c.location ? '<p>' + KC.esc(c.location) + '</p>' : '') + '</div>' +
        '<button class="icon-btn" data-edit="' + i + '" aria-label="Editar ' + KC.esc(c.name) + '">' +
          '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11 2.5 13.5 5 6 12.5H3.5V10z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>' +
        '</button>' +
      '</header>' +
      (links ? '<div class="chips">' + links + '</div>' : '<p class="muted">Sin links todavía.</p>') +
    '</div></article>';
}

function render(clients) {
  if (!clients || !clients.length) {
    app.innerHTML =
      '<div class="empty"><p>Agrega un cliente para guardar sus books, scans y proyectos en esta tarjeta.</p>' +
      '<button class="btn primary" data-add>Agregar cliente</button></div>';
  } else {
    app.innerHTML = '<div class="shelf">' + clients.map(book).join('') + '</div>' +
      '<button class="btn ghost add-more" data-add>+ Agregar cliente</button>';
  }
}

app.addEventListener('click', function (e) {
  var edit = e.target.closest('[data-edit]');
  if (edit) { openEditor(parseInt(edit.getAttribute('data-edit'), 10)); return; }
  if (e.target.closest('[data-add]')) openEditor();
});

t.render(function () {
  return KC.get(t).then(render).then(function () { return t.sizeTo('#app'); });
});

// Reajustar altura si cambia el ancho del panel
window.addEventListener('resize', function () { t.sizeTo('#app'); });
