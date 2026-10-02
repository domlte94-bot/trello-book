# Puente para ver archivos de Trello (Cloudflare Worker)

Trello no deja que el navegador lea sus archivos adjuntos desde otra página.
Este Worker los pide a Trello y se los pasa al Power-Up. Es gratis (100,000 aperturas al día).
No guarda nada: usa el permiso de la persona que está viendo el archivo, solo acepta pedidos
de tu Power-Up y solo descarga adjuntos de tarjetas de Trello.

> Este archivo **no** va en GitHub Pages. Se pega en Cloudflare.

## Pasos

1. Crea una cuenta gratis en https://dash.cloudflare.com/sign-up
2. En el menú de la izquierda: **Workers & Pages** → **Create** → **Create Worker**
   (si te pregunta, elige la plantilla **Hello World**).
3. Ponle nombre, por ejemplo `kane-trello-files`, y haz clic en **Deploy**.
4. Haz clic en **Edit code**. Borra todo lo que hay y pega el contenido de `worker.js`.
5. Arriba del código, cambia `https://TU-USUARIO.github.io` por tu dominio de GitHub Pages
   (con `https://`, sin carpeta y sin `/` al final).
6. Haz clic en **Deploy** (arriba a la derecha).
7. Copia la URL del Worker, algo como `https://kane-trello-files.tu-nombre.workers.dev`.
8. Abre `js/shared.js` del Power-Up y pégala donde dice `PASTE_YOUR_WORKER_URL_HERE`.
9. Sube `js/shared.js` a GitHub y recarga Trello (Cmd/Ctrl + Shift + R).

## Probar que el Worker está vivo

Abre la URL del Worker en el navegador. Debe decir `Origin not allowed: (none)`.
Eso es correcto: significa que está funcionando y que bloquea todo lo que no venga de tu Power-Up.

## Si no carga

En el visor, la línea **Details** dice `worker: ...`:
- `HTTP 403` → el dominio en `ALLOWED_ORIGINS` no coincide exactamente con tu GitHub Pages.
- `HTTP 401` → vuelve a hacer **Connect to Trello**.
- `Failed to fetch` → revisa que la URL del Worker en `shared.js` esté bien escrita.
