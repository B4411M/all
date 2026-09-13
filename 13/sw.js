/* mansoor0x · polpNO-MX · Service Worker */
const V = "polpno-mx-2";
const FILES = [
    "/", "/index.html", "/lapse.html", "/poops.html",
    "/chain_lapse.mjs", "/chain_poops.mjs",
    "/core.mjs", "/mem.mjs", "/int64.mjs",
    "/rpc_worker.mjs", "/ps4_offsets.mjs",
    "/payload.bin",
    "/patches/1100.bin", "/patches/1150.bin",
    "/patches/1200.bin", "/patches/1250.bin",
    "/patches/1300.bin", "/patches/1302.bin",
    "/patches/1304.bin", "/patches/1350.bin",
];

self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(V)
            .then(c => c.addAll(FILES.filter(f => !f.endsWith(".bin"))))
            .catch(() => {})
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys()
            .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", e => {
    if (e.request.method !== "GET") return;
    e.respondWith(
        caches.match(e.request).then(cached => {
            const net = fetch(e.request).then(r => {
                if (r.ok) caches.open(V).then(c => c.put(e.request, r.clone()));
                return r;
            }).catch(() => null);
            return cached || net;
        })
    );
});
