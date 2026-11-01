// ============================================================
//  Service worker: guarda los archivos de la app en el celular
//  para que abra aunque no haya internet.
//
//  IMPORTANTE: si cambias index.html, style.css o app.js,
//  sube el número de versión (v1 -> v2) para que los celulares
//  descarguen la versión nueva.
// ============================================================

const CACHE = "mi-lista-v1";

const ARCHIVOS = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
];

// 1) Instalación: descargar y guardar todos los archivos
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS))
  );
  self.skipWaiting();
});

// 2) Activación: borrar cachés de versiones anteriores
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3) Peticiones: primero buscar en el caché, y si no está, ir a internet
self.addEventListener("fetch", (evento) => {
  if (evento.request.method !== "GET") return;

  evento.respondWith(
    caches.match(evento.request).then((guardado) => {
      if (guardado) return guardado;
      return fetch(evento.request).catch(() => {
        // Sin internet y sin caché: al menos mostrar la página principal
        if (evento.request.mode === "navigate") {
          return caches.match("index.html");
        }
      });
    })
  );
});
