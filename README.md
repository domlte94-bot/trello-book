# Power-Up "Clientes" para Trello

Muestra dentro de cada tarjeta un bloque por cliente (con su color de lomo) y sus links
de SharePoint, Matterport, etc. como botones con nombre, en vez de URLs largas.

## 1. Subir los archivos (GitHub Pages, gratis)

1. Crea un repositorio nuevo en GitHub, por ejemplo `trello-clientes`.
2. Sube todo el contenido de esta carpeta (index.html, section.html, edit.html, css/, js/, img/).
3. En el repo: **Settings → Pages → Branch: main / root → Save**.
4. En un minuto tendrás una URL como `https://TU-USUARIO.github.io/trello-clientes/`.
   Ábrela en el navegador: debe cargar una página en blanco sin error 404.

Cualquier hosting con HTTPS funciona igual (Netlify, el servidor de kanegraphical.com, etc.).

## 2. Registrar el Power-Up en Trello

1. Ve a https://trello.com/power-ups/admin y crea un **New Power-Up**.
2. Elige el Workspace donde está el tablero.
3. En **Iframe connector URL** pega la URL del paso anterior (la que termina en `/`).
4. En la pestaña **Capabilities** activa: `card-back-section`, `card-buttons` y `card-badges`.
5. Guarda.

## 3. Activarlo en el tablero

Tablero → **Power-Ups** → pestaña **Custom** → agrega "Clientes".

## Uso

- En la tarjeta aparece la sección **Clientes** y el botón **Agregar cliente**.
- En el formulario, la sección **Pegar texto de Amazing Fields** acepta el texto tal cual
  lo tienes hoy y saca los links con su nombre automáticamente.
- Al pegar un link sin nombre, se le pone uno según el dominio (Book, Scan, Proyecto final).

## Límite

Trello guarda hasta ~4,000 caracteres de datos por tarjeta para cada Power-Up.
Eso alcanza para unos 15–20 links de SharePoint. Si se llena, el formulario lo avisa.

## Cambiar diseño

- Colores de lomo: `js/shared.js` → `PALETTE`.
- Estilos: `css/style.css`.
- Después de cambiar algo, súbelo a GitHub y recarga Trello (puede tardar un par de minutos por caché).
