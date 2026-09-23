const XP_SW_BUILD='xadrez-pro-3d-v8-20260922';
const CORE=['./','./index.html','./style.css','./game.js','./assets-v8.js','./three.js','./GLTFLoader.js','./OrbitControls.js','./chess.min.js','./peerjs.min.js','./manifest.json','./models/model.glb','./assets/toasty-sprite.png','./assets/toasty.mp3'];
self.addEventListener('install',e=>e.waitUntil(caches.open(XP_SW_BUILD).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('xadrez-pro-3d-')&&k!==XP_SW_BUILD).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/'))return;
 if(u.pathname.endsWith('verify.html')||u.searchParams.has('verify'))return;
 e.respondWith((async()=>{const c=await caches.open(XP_SW_BUILD);
  if(u.pathname.includes('/models/')){const hit=await c.match(r);if(hit)return hit;const res=await fetch(r);if(res.ok)await c.put(r,res.clone());return res;}
  try{const res=await fetch(r,{cache:'no-cache'});if(res.ok)await c.put(r,res.clone());return res;}catch(err){return (await c.match(r))||(r.mode==='navigate'?await c.match('./index.html'):Response.error());}
 })());
});
