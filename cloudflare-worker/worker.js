/**
 * Bridge between the "Projects" Trello Power-Up and Trello attachments.
 * Trello's file storage doesn't allow browsers to read files from other sites,
 * so this Worker fetches the file on Trello's side and hands it back to the Power-Up.
 *
 * It only:
 *   - answers requests coming from your Power-Up's site (ALLOWED_ORIGINS)
 *   - downloads Trello card attachments (nothing else)
 *   - uses the token of the person who is viewing (it stores nothing)
 */

// ===== EDIT THIS: your GitHub Pages domain (no folder, no slash at the end) =====
const ALLOWED_ORIGINS = [
  'https://TU-USUARIO.github.io'
];
// ================================================================================

const ATTACHMENT_PATH =
  /^\/1\/cards\/[a-f0-9]{24}\/attachments\/[a-f0-9]{24}\/(previews\/[a-f0-9]{24}\/)?download\/[^/]+$/i;

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin);

    const cors = allowed ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    } : { 'Vary': 'Origin' };

    const reply = (status, text) =>
      new Response(text, { status, headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: allowed ? 204 : 403, headers: cors });
    if (!allowed) return reply(403, 'Origin not allowed: ' + (origin || '(none)'));
    if (request.method !== 'GET') return reply(405, 'Method not allowed');

    // Which file?
    let target;
    try {
      target = new URL(new URL(request.url).searchParams.get('url') || '');
    } catch (e) {
      return reply(400, 'Missing or invalid ?url=');
    }
    if (target.protocol !== 'https:' ||
        !['trello.com', 'api.trello.com'].includes(target.hostname) ||
        !ATTACHMENT_PATH.test(target.pathname)) {
      return reply(400, 'Only Trello card attachments are allowed');
    }
    target.hostname = 'api.trello.com';
    target.search = '';

    // The viewer's own Trello permission
    const auth = request.headers.get('Authorization') || '';
    if (!/^OAuth /.test(auth)) return reply(401, 'Missing Trello authorization');

    let upstream;
    try {
      upstream = await fetch(target.toString(), { headers: { Authorization: auth }, redirect: 'follow' });
    } catch (e) {
      return reply(502, 'Could not reach Trello');
    }
    if (!upstream.ok) return reply(upstream.status, 'Trello answered ' + upstream.status);

    const headers = new Headers(cors);
    headers.set('Content-Type', upstream.headers.get('Content-Type') || 'application/octet-stream');
    const len = upstream.headers.get('Content-Length');
    if (len) headers.set('Content-Length', len);
    headers.set('Cache-Control', 'private, max-age=300');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(upstream.body, { status: 200, headers });
  }
};
