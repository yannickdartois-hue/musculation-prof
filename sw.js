/* Hors ligne : l'outil est gardé sur l'iPad après la 1re ouverture. À chaque mise en ligne : augmenter VERSION. */
const VERSION='musculation-prof-v7.9';
// Toutes les applis partagent le même stockage (même adresse github.io) : on n'efface QUE les anciennes versions de CETTE appli.
const MES_CACHES=/^musculation-prof-v\d+(?:\.\d+)?$/;
const sous3s=p=>{p.catch(()=>{});return Promise.race([p,new Promise((_,non)=>setTimeout(()=>non(new Error('réseau lent')),3000))])};
const FICHIERS=['./','index.html','prof.js','s1-plan-16-ateliers.pdf','s1-fiches-16-ateliers.pdf','jsqr.js','aide.js','muscu-donnees.js','qrcode.js','eps-code.js','eps-aide.js','eps-maj.js','eps-coffre.js','eps-garde.js','eps-demo.js','eps-charte-v1.css','xlsx.js','manifest.webmanifest','icon-32.png','icon-180.png','icon-192.png','icon-512.png','polices/archivo.woff2','polices/atkinson-400.woff2','polices/atkinson-700.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FICHIERS.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>MES_CACHES.test(k)&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
  const net=fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.status===200){const c=r.clone();caches.open(VERSION).then(x=>x.put(e.request,c))}return r});
  e.respondWith(sous3s(net).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(h=>h||net)));
});
