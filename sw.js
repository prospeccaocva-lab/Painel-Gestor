// Service worker: permite instalar no celular e abrir o app na hora, mesmo sem internet.
// Troque o número da versão sempre que publicar uma atualização.
const CACHE = 'cv-vendas-v25';
const FILES = ['./', './index.html', './manifest.json', './logo.svg', './icon-192.png', './icon-512.png', './icon-180.png',
  './jost.woff2', './jspdf.umd.min.js', './cabecalho.jpg', './rodape.jpg', './marca-dagua.jpg'];

// Versão nova: baixa todos os arquivos direto do servidor (ignora o cache de 10 min do GitHub)
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Arquivos do app: abre na hora com o que está salvo no celular e confere o servidor em segundo plano.
// (Versão nova chega pelo próprio sw.js: o app recarrega sozinho quando ela é instalada.)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // Google (planilha) e outros: direto pela internet
  e.respondWith(caches.open(CACHE).then(async c => {
    const salvo = await c.match(e.request, { ignoreSearch: true });
    const rede = fetch(e.request.url, { cache: 'no-cache' }).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; });
    if (salvo) { e.waitUntil(rede.catch(() => {})); return salvo; }
    return rede.catch(() => c.match('./index.html'));
  }));
});
