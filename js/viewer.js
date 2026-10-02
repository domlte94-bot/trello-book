/* Preview a file attached to the card (PDF or image) */
var t = KC.iframe();
KC.applyTheme(t);

var fileUrl = t.arg('url');
var fileName = t.arg('name') || decodeURIComponent((fileUrl || '').split('/').pop() || 'File');
var $ = function (id) { return document.getElementById(id); };
var msg = $('vMsg'), wrap = $('vPagesWrap');
var pdfDoc = null, zoom = 1, renderRun = 0;

$('vName').textContent = fileName;

function showMsg(html) { msg.innerHTML = html; msg.hidden = false; }

function setFileActions(blobUrl) {
  $('vOpen').href = blobUrl; $('vOpen').hidden = false;
  $('vDownload').href = blobUrl; $('vDownload').setAttribute('download', fileName); $('vDownload').hidden = false;
}

function askConnect() {
  showMsg('<p>To preview files attached in Trello, connect this Power-Up to your Trello account once.</p>' +
    '<button type="button" id="connectBtn" class="btn primary">Connect to Trello</button>');
  $('connectBtn').addEventListener('click', function () {
    KC.authorize(t).then(load, function () {
      showMsg('<p>Connection was cancelled.</p><button type="button" id="retry" class="btn ghost">Try again</button>');
      $('retry').addEventListener('click', askConnect);
    });
  });
}

function isPdf(blob) { return blob.type === 'application/pdf' || /\.pdf$/i.test(fileName) || /\.pdf(\?|$)/i.test(fileUrl); }
function isImage(blob) { return /^image\//.test(blob.type) || /\.(jpe?g|png|gif|webp)$/i.test(fileName); }

/* ---------- PDF ---------- */
function renderPdf() {
  var run = ++renderRun;
  wrap.innerHTML = '';
  var maxW = Math.min(wrap.clientWidth || window.innerWidth, 1100) - 24;
  $('zoomVal').textContent = Math.round(zoom * 100) + '%';
  var dpr = window.devicePixelRatio || 1;

  function page(n) {
    if (run !== renderRun || n > pdfDoc.numPages) return;
    pdfDoc.getPage(n).then(function (p) {
      if (run !== renderRun) return;
      var base = p.getViewport({ scale: 1 });
      var scale = (maxW / base.width) * zoom;
      var vp = p.getViewport({ scale: scale * dpr });
      var c = document.createElement('canvas');
      c.className = 'v-page';
      c.width = vp.width; c.height = vp.height;
      c.style.width = (vp.width / dpr) + 'px';
      c.style.height = (vp.height / dpr) + 'px';
      c.setAttribute('aria-label', 'Page ' + n);
      wrap.appendChild(c);
      return p.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    }).then(function () { page(n + 1); });
  }
  page(1);
}

function showPdf(blob) {
  if (!window.pdfjsLib) { showMsg('<p>The PDF viewer could not load. Use “Open in new tab”.</p>'); return; }
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  blob.arrayBuffer().then(function (buf) {
    return pdfjsLib.getDocument({ data: buf }).promise;
  }).then(function (doc) {
    pdfDoc = doc;
    msg.hidden = true;
    $('vPages').textContent = doc.numPages + (doc.numPages === 1 ? ' page' : ' pages');
    $('vZoom').hidden = false;
    renderPdf();
  }).catch(function () {
    showMsg('<p>This PDF could not be displayed here. Use “Open in new tab” or “Download”.</p>');
  });
}

$('zoomIn').addEventListener('click', function () { zoom = Math.min(3, zoom + 0.25); renderPdf(); });
$('zoomOut').addEventListener('click', function () { zoom = Math.max(0.5, zoom - 0.25); renderPdf(); });
var resizeTimer;
window.addEventListener('resize', function () {
  if (!pdfDoc) return;
  clearTimeout(resizeTimer); resizeTimer = setTimeout(renderPdf, 200);
});

/* ---------- Load ---------- */
function load() {
  if (!KC.hasKey()) { showMsg('<p>Preview isn’t set up yet: add the API key in js/shared.js (see README).</p>'); return; }
  showMsg('<p>Loading…</p>');
  KC.isAuthorized(t).then(function (ok) {
    if (!ok) { askConnect(); return; }
    return KC.fetchTrelloFile(t, fileUrl).then(function (blob) {
      var blobUrl = URL.createObjectURL(isPdf(blob) ? new Blob([blob], { type: 'application/pdf' }) : blob);
      setFileActions(blobUrl);
      if (isPdf(blob)) return showPdf(blob);
      if (isImage(blob)) {
        msg.hidden = true;
        wrap.innerHTML = '<img class="v-img" alt="' + KC.esc(fileName) + '" src="' + blobUrl + '">';
        return;
      }
      showMsg('<p>This file type can’t be previewed here. Use “Open in new tab” or “Download”.</p>');
    });
  }).catch(function (err) {
    if (err && err.message === 'not-authorized') { askConnect(); return; }
    var detail = (err && (err.detail || err.message)) || 'unknown';
    showMsg('<p>Trello didn’t let the preview load this file.</p>' +
      '<p><a class="btn ghost" href="' + KC.esc(fileUrl) + '" target="_blank" rel="noopener">Open in Trello instead</a></p>' +
      '<p class="hint">Details: ' + KC.esc(detail) + '</p>');
    console.error('[Projects viewer]', detail, fileUrl);
  });
}

load();
