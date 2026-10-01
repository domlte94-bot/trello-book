/* Form to add / edit a client */
var t = KC.iframe();
KC.applyTheme(t);

var rawIndex = t.arg('index');
var index = (rawIndex === undefined || rawIndex === null) ? null : Number(rawIndex);
var clients = [];
var state = { name: '', location: '', color: 'navy', links: [] };

var $ = function (id) { return document.getElementById(id); };
var linksEl = $('links');
var errorEl = $('error');

function showError(msg) { errorEl.textContent = msg; errorEl.hidden = !msg; }

function buildSwatches() {
  $('swatches').innerHTML = KC.PALETTE.map(function (p) {
    var on = p.id === state.color;
    return '<button type="button" class="swatch' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on +
      '" aria-label="' + p.name + '" data-color="' + p.id + '" style="--c:' + p.hex + '"></button>';
  }).join('');
}

function linkRow(l, i) {
  return '<div class="link-row" data-i="' + i + '">' +
    '<input class="l-label" type="text" placeholder="Name (e.g. Book, Initial scan)" value="' + KC.esc(l.label) + '">' +
    '<input class="l-url" type="url" placeholder="https://…" value="' + KC.esc(l.url) + '">' +
    '<button type="button" class="icon-btn" data-remove="' + i + '" aria-label="Remove link">' +
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
    '</button></div>';
}

function readLinks() {
  state.links = Array.prototype.map.call(linksEl.querySelectorAll('.link-row'), function (row) {
    return { label: row.querySelector('.l-label').value.trim(), url: row.querySelector('.l-url').value.trim() };
  });
}

function buildLinks() {
  if (!state.links.length) state.links.push({ label: '', url: '' });
  linksEl.innerHTML = state.links.map(linkRow).join('');
}

// ---- Main image ----
var EMPTY_MSG = '<span>No image</span>';

function setImage(url) {
  state.image = url || '';
  $('image').value = state.image;
  $('clearImage').hidden = !state.image;
  var prev = $('coverPreview');
  prev.classList.remove('bad', 'busy');
  var safe = KC.safeUrl(state.image);
  if (!safe) { prev.innerHTML = EMPTY_MSG; return; }
  prev.innerHTML = '<img alt="">';
  KC.loadImage(t, prev.querySelector('img'), safe, function () {
    prev.classList.add('bad');
    prev.innerHTML = '<span>Can\'t show this link as an image</span>';
  });
}

$('image').addEventListener('change', function () { setImage(this.value.trim()); });
$('clearImage').addEventListener('click', function () { setImage(''); });

$('pickAttachment').addEventListener('click', function () {
  var box = $('attachments');
  if (!box.hidden) { box.hidden = true; return; }
  t.card('attachments').then(function (card) {
    var imgs = (card.attachments || []).filter(function (a) {
      return /^image\//.test(a.mimeType || '') || (a.previews && a.previews.length) ||
        /\.(jpe?g|png|gif|webp)(\?|$)/i.test(a.url || '');
    });
    if (!imgs.length) {
      box.innerHTML = '<p class="hint">This card has no image attachments. Attach one to the card first, then try again.</p>';
    } else {
      box.innerHTML = imgs.map(function (a) {
        var u = KC.bestPreview(a);
        return '<button type="button" class="thumb" data-url="' + KC.esc(u) + '" title="' + KC.esc(a.name || '') + '">' +
          '<img data-src="' + KC.esc(u) + '" alt="' + KC.esc(a.name || 'Attachment') + '"></button>';
      }).join('');
    }
    box.hidden = false;
    Array.prototype.forEach.call(box.querySelectorAll('img[data-src]'), function (im) {
      KC.loadImage(t, im, im.getAttribute('data-src'));
    });
  });
});

$('attachments').addEventListener('click', function (e) {
  var b = e.target.closest('[data-url]');
  if (!b) return;
  setImage(b.getAttribute('data-url'));
  $('attachments').hidden = true;
});

function fill() {
  setImage(state.image || '');
  $('name').value = state.name;
  $('location').value = state.location || '';
  buildSwatches();
  buildLinks();
  $('deleteBtn').hidden = index === null;
  $('name').focus();
}

// Events
$('swatches').addEventListener('click', function (e) {
  var b = e.target.closest('[data-color]');
  if (!b) return;
  state.color = b.getAttribute('data-color');
  buildSwatches();
});

linksEl.addEventListener('click', function (e) {
  var b = e.target.closest('[data-remove]');
  if (!b) return;
  readLinks();
  state.links.splice(Number(b.getAttribute('data-remove')), 1);
  buildLinks();
});

// Auto-name a link when it's pasted
linksEl.addEventListener('change', function (e) {
  if (!e.target.classList.contains('l-url')) return;
  var row = e.target.closest('.link-row');
  var label = row.querySelector('.l-label');
  var url = KC.safeUrl(e.target.value);
  if (url && !label.value.trim()) label.value = KC.autoLabel(url);
});

$('addLink').addEventListener('click', function () {
  readLinks();
  state.links.push({ label: '', url: '' });
  buildLinks();
  var rows = linksEl.querySelectorAll('.l-label');
  rows[rows.length - 1].focus();
});

// ---- Card attachments (PDFs, etc.) as links ----
function cleanName(n) { return String(n || 'Attachment').replace(/\.[a-z0-9]{2,5}$/i, ''); }

function usedElsewhere(url) {
  for (var i = 0; i < clients.length; i++) {
    if (i === index) continue;
    var ls = clients[i].links || [];
    for (var j = 0; j < ls.length; j++) if (ls[j].url === url) return clients[i].name;
  }
  return '';
}

function buildPicker(atts) {
  readLinks();
  var mine = state.links.map(function (l) { return l.url; });
  var box = $('filePicker');
  if (!atts.length) {
    box.innerHTML = '<p class="hint">This card has no attachments yet. Attach the files to the card first, then try again.</p>';
    return;
  }
  box.innerHTML = '<p class="hint">Check the files that belong to this project.</p>' + atts.map(function (a, i) {
    var url = KC.safeUrl(a.url) || '';
    var other = usedElsewhere(url);
    var k = KC.kind(url);
    return '<label class="file-opt">' +
      '<input type="checkbox" data-att="' + i + '"' + (mine.indexOf(url) > -1 ? ' checked' : '') + '>' +
      '<span class="chip-icon">' + (KC.ICONS[k.id] || KC.ICONS.file) + '</span>' +
      '<span class="file-name">' + KC.esc(a.name || url) + '</span>' +
      (other ? '<span class="file-tag">in ' + KC.esc(other) + '</span>' : '') +
      '</label>';
  }).join('') + '<button type="button" id="applyFiles" class="btn primary small">Add selected</button>';

  $('applyFiles').addEventListener('click', function () {
    readLinks();
    var checks = box.querySelectorAll('input[data-att]');
    Array.prototype.forEach.call(checks, function (c) {
      var a = atts[Number(c.getAttribute('data-att'))];
      var url = KC.safeUrl(a.url);
      if (!url) return;
      var pos = -1;
      state.links.forEach(function (l, i) { if (l.url === url) pos = i; });
      if (c.checked && pos < 0) state.links.push({ label: cleanName(a.name), url: url });
      if (!c.checked && pos > -1) state.links.splice(pos, 1);
    });
    state.links = state.links.filter(function (l) { return l.url || l.label; });
    buildLinks();
    box.hidden = true;
  });
}

$('pickFiles').addEventListener('click', function () {
  var box = $('filePicker');
  if (!box.hidden) { box.hidden = true; return; }
  t.card('attachments').then(function (card) {
    // Only real files uploaded to the card (skip plain links pasted as attachments)
    var atts = (card.attachments || []).filter(function (a) { return KC.isTrelloFile(a.url) || a.isUpload; });
    buildPicker(atts);
    box.hidden = false;
  });
});

$('importBtn').addEventListener('click', function () {
  var found = KC.parseText($('importText').value);
  if (!found.length) { showError('No links found in the pasted text.'); return; }
  readLinks();
  state.links = state.links.filter(function (l) { return l.url || l.label; }).concat(found);
  buildLinks();
  $('importText').value = '';
  showError('');
});

$('cancelBtn').addEventListener('click', function () { t.closeModal(); });

var confirmDelete = false;
$('deleteBtn').addEventListener('click', function () {
  if (!confirmDelete) {
    confirmDelete = true;
    this.textContent = 'Click again to delete';
    return;
  }
  clients.splice(index, 1);
  KC.save(t, clients).then(function () { t.closeModal(); }, function (err) { showError(err.message); });
});

$('form').addEventListener('submit', function (e) {
  e.preventDefault();
  readLinks();
  var name = $('name').value.trim();
  if (!name) { showError('Enter the client name for this project.'); $('name').focus(); return; }

  var links = [];
  for (var i = 0; i < state.links.length; i++) {
    var l = state.links[i];
    if (!l.url && !l.label) continue;
    var url = KC.safeUrl(l.url);
    if (!url) { showError('The link "' + (l.label || l.url) + '" isn\'t valid. It must start with https://'); return; }
    links.push({ label: l.label || KC.autoLabel(url), url: url });
  }

  var imgRaw = $('image').value.trim();
  var image = imgRaw ? KC.safeUrl(imgRaw) : '';
  if (imgRaw && !image) { showError('The image link isn\'t valid. It must start with https://'); return; }

  var client = { name: name, location: $('location').value.trim(), color: state.color, image: image, links: links };
  if (index === null) clients.push(client); else clients[index] = client;

  KC.save(t, clients).then(function () { t.closeModal(); }, function (err) {
    if (index === null) clients.pop();
    showError(err.message);
  });
});

KC.get(t).then(function (c) {
  clients = Array.isArray(c) ? c : [];
  if (index !== null && clients[index]) state = JSON.parse(JSON.stringify(clients[index]));
  else index = null;
  fill();
});
