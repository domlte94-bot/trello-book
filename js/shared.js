/* Shared helpers: data, colors, links */
var KC = (function () {
  var KEY = 'clients';
  // Trello allows ~4096 characters per card in this scope
  var LIMIT = 4000;

  var PALETTE = [
    { id: 'navy',   hex: '#2457c5', name: 'Blue' },
    { id: 'plum',   hex: '#8b3fb5', name: 'Purple' },
    { id: 'teal',   hex: '#0f8b8d', name: 'Teal' },
    { id: 'forest', hex: '#3d8b37', name: 'Green' },
    { id: 'amber',  hex: '#c98a0b', name: 'Amber' },
    { id: 'brick',  hex: '#c2412d', name: 'Red' },
    { id: 'slate',  hex: '#5b6577', name: 'Gray' }
  ];

  function colorHex(id) {
    for (var i = 0; i < PALETTE.length; i++) if (PALETTE[i].id === id) return PALETTE[i].hex;
    return PALETTE[0].hex;
  }

  function get(t) { return t.get('card', 'shared', KEY, []); }

  function save(t, clients) {
    var size = JSON.stringify(clients).length;
    if (size > LIMIT) {
      return Promise.reject(new Error(
        'This card is out of space (' + size + ' of ' + LIMIT + ' characters). ' +
        'Shorten some names or move a few projects to another card.'));
    }
    return t.set('card', 'shared', KEY, clients);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeUrl(u) {
    try {
      var x = new URL(String(u).trim());
      return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : null;
    } catch (e) { return null; }
  }

  // Link type based on the domain
  function kind(url) {
    var h = '';
    try { h = new URL(url).hostname; } catch (e) {}
    if (/sharepoint\.com$|onedrive|1drv\.ms/.test(h)) return { id: 'sharepoint', label: 'SharePoint' };
    if (/matterport\.com$/.test(h)) return { id: 'matterport', label: 'Matterport' };
    if (/drive\.google|docs\.google/.test(h)) return { id: 'google', label: 'Google Drive' };
    if (/dropbox/.test(h)) return { id: 'dropbox', label: 'Dropbox' };
    return { id: 'web', label: h.replace(/^www\./, '') || 'Link' };
  }

  function autoLabel(url) {
    var k = kind(url);
    try {
      var p = new URL(url).pathname;
      if (k.id === 'matterport') return /\/models\//.test(p) ? 'Completed project' : 'Initial scan';
    } catch (e) {}
    if (k.id === 'sharepoint') return 'Book';
    return k.label;
  }

  // Simple inline SVG icons per type
  var ICONS = {
    sharepoint: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2.5h7l3 3v8H3z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M10 2.5v3h3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    matterport: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 13.5 5v6L8 14.2 2.5 11V5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M2.5 5 8 8.2 13.5 5M8 8.2v6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    google: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 2h5l4 7-2.5 4.5h-8L1.5 9z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    dropbox: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 2.5 3.5 2.3-3.5 2.3L1 4.8zm7 0L15 4.8l-3.5 2.3L8 4.8zM1 9.4l3.5-2.3L8 9.4l-3.5 2.3zm10.5-2.3L15 9.4l-3.5 2.3L8 9.4z" fill="currentColor"/></svg>',
    web: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.6 9.4a3 3 0 0 0 4.2 0l2.4-2.4a3 3 0 0 0-4.2-4.2l-.8.8M9.4 6.6a3 3 0 0 0-4.2 0L2.8 9a3 3 0 0 0 4.2 4.2l.8-.8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'
  };

  // Turns pasted text (e.g. from Amazing Fields) into named links
  function parseText(text) {
    var out = [], lastText = '';
    var re = /https?:\/\/[^\s<>"']+/g;
    String(text || '').split(/\r?\n/).forEach(function (line) {
      var m, found = false, cursor = 0;
      re.lastIndex = 0;
      while ((m = re.exec(line))) {
        found = true;
        var url = safeUrl(m[0].replace(/[),.;]+$/, ''));
        var before = line.slice(cursor, m.index).trim().replace(/[:\-–—]\s*$/, '').trim();
        cursor = m.index + m[0].length;
        if (url) out.push({ label: before || lastText || autoLabel(url), url: url });
        lastText = '';
      }
      if (!found && line.trim()) lastText = line.trim().replace(/:$/, '');
    });
    return out;
  }

  function applyTheme(t) {
    try {
      var ctx = t.getContext();
      if (ctx && ctx.theme) document.documentElement.setAttribute('data-theme', ctx.theme);
    } catch (e) {}
  }

  return {
    PALETTE: PALETTE, colorHex: colorHex, get: get, save: save, esc: esc,
    safeUrl: safeUrl, kind: kind, autoLabel: autoLabel, ICONS: ICONS,
    parseText: parseText, applyTheme: applyTheme
  };
})();
