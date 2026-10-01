/* Form to add / edit a client */
var t = TrelloPowerUp.iframe();
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

function fill() {
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
  if (!name) { showError('Enter the client name.'); $('name').focus(); return; }

  var links = [];
  for (var i = 0; i < state.links.length; i++) {
    var l = state.links[i];
    if (!l.url && !l.label) continue;
    var url = KC.safeUrl(l.url);
    if (!url) { showError('The link "' + (l.label || l.url) + '" isn\'t valid. It must start with https://'); return; }
    links.push({ label: l.label || KC.autoLabel(url), url: url });
  }

  var client = { name: name, location: $('location').value.trim(), color: state.color, links: links };
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
