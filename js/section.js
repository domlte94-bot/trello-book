/* View inside the card */
var t = KC.iframe();
var app = document.getElementById('app');
KC.applyTheme(t);

function openEditor(index) {
  var isNew = index == null;
  return t.modal({
    url: './edit.html',
    args: isNew ? {} : { index: index },
    title: isNew ? 'Add project' : 'Edit project',
    height: 760,
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
  var img = KC.safeUrl(c.image);
  var cover = img
    ? '<a class="cover" href="' + KC.esc(img) + '" target="_blank" rel="noopener noreferrer" aria-label="Open image for ' + KC.esc(c.name) + '">' +
        '<img data-src="' + KC.esc(img) + '" alt=""></a>'
    : '';
  return '<article class="book' + (img ? ' has-cover' : '') + '" style="--spine:' + KC.colorHex(c.color) + '">' +
    '<div class="spine" aria-hidden="true"></div>' + cover +
    '<div class="book-body">' +
      '<header class="book-head">' +
        '<div class="book-title"><h3>' + KC.esc(c.name) + '</h3>' +
        (c.location ? '<p>' + KC.esc(c.location) + '</p>' : '') + '</div>' +
        '<button class="icon-btn" data-edit="' + i + '" aria-label="Edit ' + KC.esc(c.name) + '">' +
          '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11 2.5 13.5 5 6 12.5H3.5V10z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>' +
        '</button>' +
      '</header>' +
      (links ? '<div class="chips">' + links + '</div>' : '<p class="muted">No links yet.</p>') +
    '</div></article>';
}

function render(clients) {
  if (!clients || !clients.length) {
    app.innerHTML =
      '<div class="empty"><p>Add a project to keep its books, scans and links on this card.</p>' +
      '<button class="btn primary" data-add>Add project</button></div>';
  } else {
    app.innerHTML = '<div class="shelf">' + clients.map(book).join('') + '</div>' +
      '<button class="btn ghost add-more" data-add>+ Add project</button>';
  }
}

app.addEventListener('click', function (e) {
  var edit = e.target.closest('[data-edit]');
  if (edit) { openEditor(parseInt(edit.getAttribute('data-edit'), 10)); return; }
  if (e.target.closest('[data-add]')) openEditor();
});

// If an image fails to load, hide its column; resize when images arrive
app.addEventListener('load', function (e) {
  if (e.target.tagName === 'IMG') t.sizeTo('#app');
}, true);
function loadCovers() {
  Array.prototype.forEach.call(app.querySelectorAll('img[data-src]'), function (img) {
    KC.loadImage(t, img, img.getAttribute('data-src'), function () {
      var art = img.closest('.book');
      if (art) art.classList.add('cover-broken');
      t.sizeTo('#app');
    });
  });
}

t.render(function () {
  return KC.get(t).then(render).then(function () { loadCovers(); return t.sizeTo('#app'); });
});

// Resize when the panel width changes
window.addEventListener('resize', function () { t.sizeTo('#app'); });
