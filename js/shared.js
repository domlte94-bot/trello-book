/* Shared helpers: data, colors, links */

/* ====== CONFIG: paste your Trello API key here (Power-Up admin > API key) ====== */
var KC_CONFIG = {
  appKey: '080ce5ba9739527301f5f8c14eb29b82',
  appName: 'Projects',
  appAuthor: 'Kane Graphical'
};

/* ====== CONFIG: your Cloudflare Worker URL (see cloudflare-worker/README) ====== */
var KC_PROXY = 'https://kane-trello-files.domlte94.workers.dev/';   // e.g. https://kane-trello-files.yourname.workers.dev



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
    if (isTrelloFile(url)) {
      var ext = fileExt(url);
      return { id: ext === 'PDF' ? 'pdf' : 'file', label: ext === 'File' ? 'Trello file' : ext };
    }
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
    if (k.id === 'pdf' || k.id === 'file') return 'Attachment';
    return k.label;
  }

  // Simple inline SVG icons per type
  var ICONS = {
    sharepoint: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2.5h7l3 3v8H3z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M10 2.5v3h3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    matterport: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 13.5 5v6L8 14.2 2.5 11V5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M2.5 5 8 8.2 13.5 5M8 8.2v6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    google: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 2h5l4 7-2.5 4.5h-8L1.5 9z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    dropbox: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 2.5 3.5 2.3-3.5 2.3L1 4.8zm7 0L15 4.8l-3.5 2.3L8 4.8zM1 9.4l3.5-2.3L8 9.4l-3.5 2.3zm10.5-2.3L15 9.4l-3.5 2.3L8 9.4z" fill="currentColor"/></svg>',
    pdf: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 1.5h6l3 3v10h-9z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M5.5 8.5h5M5.5 11h5M5.5 6h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    file: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 4.5 5.8 9.2a1.5 1.5 0 0 0 2.1 2.1l5-5a3 3 0 0 0-4.2-4.2l-5 5a4.5 4.5 0 0 0 6.4 6.4l3.4-3.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
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

  function fileExt(url) {
    var m = /\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(decodeURIComponent(String(url || '').split('?')[0]));
    return m ? m[1].toUpperCase() : 'File';
  }

  function isTrelloFile(url) { return /^https:\/\/(api\.)?trello\.com\/1\/cards\//.test(url || ''); }

  function bestPreview(a) {
    var p = (a.previews || []).filter(function (x) { return x.url; });
    p.sort(function (x, y) { return (x.width || 0) - (y.width || 0); });
    for (var i = 0; i < p.length; i++) if ((p[i].width || 0) >= 600) return p[i].url;
    return p.length ? p[p.length - 1].url : a.url;
  }

  /* ---------- Trello REST: read files attached to cards ---------- */
  function hasKey() { return !!KC_CONFIG.appKey && KC_CONFIG.appKey.indexOf('PASTE_') !== 0; }
  function api(t) { return hasKey() ? t.getRestApi() : null; }

  function isAuthorized(t) {
    var a = api(t);
    return a ? a.isAuthorized().catch(function () { return false; }) : Promise.resolve(false);
  }
  function authorize(t) { return api(t).authorize({ scope: 'read,write', expiration: 'never' }); }

  // Download a Trello attachment with the user's token -> Blob
  // Tries a few ways, because browsers can block some of them (CORS)
  function fetchTrelloFile(t, url) {
    var apiUrl = url.replace('https://trello.com/', 'https://api.trello.com/');
    var log = [];
    return api(t).getToken().then(function (tok) {
      if (!tok) throw new Error('not-authorized');
      var sep = apiUrl.indexOf('?') > -1 ? '&' : '?';
      var authHeader = 'OAuth oauth_consumer_key="' + KC_CONFIG.appKey + '", oauth_token="' + tok + '"';
      var proxy = KC_PROXY && KC_PROXY.indexOf('PASTE_') !== 0 ? KC_PROXY.replace(/\/+$/, '') : '';
      var attempts = proxy ? [
        function () {
          return fetch(proxy + '/?url=' + encodeURIComponent(apiUrl), { headers: { Authorization: authHeader } });
        }
      ] : [
        function () {
          return fetch(apiUrl, { headers: { Authorization:
            'OAuth oauth_consumer_key="' + KC_CONFIG.appKey + '", oauth_token="' + tok + '"' } });
        },
        function () {
          return fetch(apiUrl + sep + 'key=' + encodeURIComponent(KC_CONFIG.appKey) +
            '&token=' + encodeURIComponent(tok));
        }
      ];
      function next(i) {
        if (i >= attempts.length) {
          var e = new Error('blocked'); e.detail = log.join(' | '); throw e;
        }
        return attempts[i]().then(function (r) {
          if (r.ok) return r.blob();
          log.push((proxy ? 'worker' : 'try ' + (i + 1)) + ': HTTP ' + r.status);
          if (r.status === 401 && i === attempts.length - 1) throw new Error('not-authorized');
          return next(i + 1);
        }, function (err) {
          log.push((proxy ? 'worker' : 'try ' + (i + 1)) + ': ' + (err && err.message));
          return next(i + 1);
        });
      }
      return next(0);
    });
  }

  // Upload a file as an attachment of the current card -> attachment JSON
  function uploadToCard(t, file) {
    return api(t).getToken().then(function (tok) {
      if (!tok) throw new Error('not-authorized');
      var fd = new FormData();
      fd.append('file', file, file.name || 'image.png');
      fd.append('name', file.name || 'image.png');
      fd.append('setCover', 'false');
      var url = 'https://api.trello.com/1/cards/' + encodeURIComponent(t.getContext().card) + '/attachments' +
        '?key=' + encodeURIComponent(KC_CONFIG.appKey) + '&token=' + encodeURIComponent(tok);
      return fetch(url, { method: 'POST', body: fd });
    }).then(function (r) {
      if (r.status === 401 || r.status === 403) throw new Error('not-authorized');
      if (!r.ok) return r.text().then(function (x) { throw new Error('Upload failed (' + r.status + '): ' + x); });
      return r.json();
    });
  }

  // Show an image; if it's a Trello file that needs login, load it with the token
  var blobCache = {};
  function loadImage(t, img, url, onFail) {
    img.onerror = function () {
      img.onerror = null;
      if (!isTrelloFile(url) || !hasKey()) { if (onFail) onFail(); return; }
      if (blobCache[url]) { img.src = blobCache[url]; return; }
      isAuthorized(t).then(function (ok) {
        if (!ok) throw new Error('not-authorized');
        return fetchTrelloFile(t, url);
      }).then(function (b) {
        blobCache[url] = URL.createObjectURL(b);
        img.onerror = function () { if (onFail) onFail(); };
        img.src = blobCache[url];
      }).catch(function () { if (onFail) onFail(); });
    };
    img.src = url;
  }

  function iframe() { return TrelloPowerUp.iframe(hasKey() ? KC_CONFIG : undefined); }

  return {
    isTrelloFile: isTrelloFile, fileExt: fileExt, hasKey: hasKey, isAuthorized: isAuthorized,
    authorize: authorize, fetchTrelloFile: fetchTrelloFile, uploadToCard: uploadToCard,
    bestPreview: bestPreview, loadImage: loadImage, iframe: iframe,
    PALETTE: PALETTE, colorHex: colorHex, get: get, save: save, esc: esc,
    safeUrl: safeUrl, kind: kind, autoLabel: autoLabel, ICONS: ICONS,
    parseText: parseText, applyTheme: applyTheme
  };
})();
