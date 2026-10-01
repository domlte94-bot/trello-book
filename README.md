# Power-Up "Projects" para Trello

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

Tablero → **Power-Ups** → pestaña **Custom** → agrega "Projects".

## Uso

- En la tarjeta aparece la sección **Projects** y el botón **Add project**.
- En el formulario, la sección **Paste text from Amazing Fields** acepta el texto tal cual
  lo tienes hoy y saca los links con su nombre automáticamente.
- Al pegar un link sin nombre, se le pone uno según el dominio (Book, Initial scan, Completed project).

## Límite

Trello guarda hasta ~4,000 caracteres de datos por tarjeta para cada Power-Up.
Eso alcanza para unos 15–20 links de SharePoint. Si se llena, el formulario lo avisa.

## Cambiar diseño

- Colores de lomo: `js/shared.js` → `PALETTE`.
- Estilos: `css/style.css`.
- Después de cambiar algo, súbelo a GitHub y recarga Trello (puede tardar un par de minutos por caché).

## Imagen principal

Cada proyecto puede tener una imagen que ocupa 1/4 del bloque a la izquierda.
- **Choose from card attachments**: adjunta la imagen a la tarjeta de Trello y elígela de la lista.
- O pega un link **directo** a la imagen (que termine en .jpg/.png o que abra solo la imagen).
  Los links de "compartir" de SharePoint (`/:i:/...`) abren una página, no la imagen, y no se van a mostrar.
Si una imagen no carga, el bloque se muestra sin imagen y los links siguen funcionando.

## Adjuntos de la tarjeta (PDFs, etc.)

En el formulario de cada proyecto, **+ Add from card attachments** muestra los archivos
subidos a la tarjeta. Marca los que pertenecen a ese proyecto y dale **Add selected**:
se agregan como links con el nombre del archivo e ícono de PDF.
Si un archivo ya está en otro proyecto, aparece la etiqueta "in [nombre]".
Los archivos siguen guardados en Trello; el Power-Up solo los ordena.
