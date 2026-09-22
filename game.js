var XADREZ_PRO_BUILD_V7 = "7-20260922";
// Xadrez Pro 3D — Nova versão
// Visual neon + IA + temas + Toasty + animação por peça
(function () {
  'use strict';

  const SQUARE = 1.24;
  const PIECE_SCALE = 1.0;

  const THEMES = [
    { id: 'ciano-magenta', name: 'Ciano / Magenta', w: 0x00e5ff, b: 0xff2d9b, emW: 0x0099b0, emB: 0xb01860 },
    { id: 'verde-vermelho', name: 'Verde / Vermelho', w: 0x22ff88, b: 0xff3355, emW: 0x12b058, emB: 0xb02038 },
    { id: 'azul-laranja', name: 'Azul / Laranja', w: 0x3399ff, b: 0xff8833, emW: 0x1870c0, emB: 0xc05818 },
    { id: 'roxo-dourado', name: 'Roxo / Dourado', w: 0xaa66ff, b: 0xffcc33, emW: 0x7840c0, emB: 0xc09018 },
    { id: 'matrix', name: 'Matrix', w: 0x33ff66, b: 0x00aa44, emW: 0x20c048, emB: 0x008830 },
    { id: 'cyberpunk', name: 'Cyberpunk', w: 0x00e5ff, b: 0xffea00, emW: 0x00b0c0, emB: 0xc0b000 },
    { id: 'gelo', name: 'Gelo / Roxo', w: 0xaaddff, b: 0xbb44ff, emW: 0x70a0c8, emB: 0x8030c0 },
    { id: 'toxic', name: 'Toxic', w: 0x84cc16, b: 0x9333ea, emW: 0x60a010, emB: 0x7020b0 },
    { id: 'paris', name: 'Paris Rosa', w: 0xec4899, b: 0x831843, emW: 0xc03070, emB: 0x601030 }
  ];

  let currentTheme = THEMES[0];
  let pieceStyle = localStorage.getItem('xp-v7-piece-style') || 'padrao';
  if (!XPAssets.sets[pieceStyle]) pieceStyle='padrao';
  let templates=null, assetBusy=false, pieceRequest=0, boardRequest=0, boardAsset=null;
  let cameraLocked=true;
  let boardStyle = localStorage.getItem('xp-v7-board-style') || 'neon';
  if (!XPAssets.boards[boardStyle]) boardStyle='neon';
  let gameMode = 'local';
  let playerIsWhite = true;
  let aiThinking = false;

  let scene, camera, renderer, controls, raycaster, mouse;
  let boardGroup, piecesGroup, highlightsGroup, lastMoveGroup, moveTrailGroup;
  let chess = new Chess();
  let selected = null, legal = [], animating = false;
  let pieceMap = {}, pendingPromo = null, selectedMesh = null;
  let soundOn = true, audioCtx = null, ambientNodes = [];
  let pointerDownPos = null, isDragging = false;
  let lastToastyAt = 0;
  let toastyCount = { check: 0, promo: 0, queen: 0, castle: 0 };
  let wasInCheck = false;

  function init() {
    const wrap = document.getElementById('canvas-wrap');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x01040c);
    scene.fog = new THREE.FogExp2(0x01040c, 0.024);

    camera = new THREE.PerspectiveCamera((innerWidth/innerHeight)<0.72 ? 48 : 35, innerWidth / innerHeight, 0.1, 120);
    camera.position.set(0, 12.2, 10.8);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: location.search.includes('verify') });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    wrap.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.25, 0);
    controls.enableDamping = false;
    controls.enabled = false;
    controls.dampingFactor = 0.08;
    controls.minDistance = 6;
    controls.maxDistance = 150;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minPolarAngle = 0.22;
    controls.enablePan = false;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    scene.add(new THREE.AmbientLight(0x8ea0b7, 0.7));
    scene.add(new THREE.HemisphereLight(0xdbe8ff,0x34283a,.55));
    const key = new THREE.DirectionalLight(0xd0e4ff, 1.05);
    key.position.set(5, 16, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 2; key.shadow.camera.far = 40;
    key.shadow.camera.left = key.shadow.camera.bottom = -11;
    key.shadow.camera.right = key.shadow.camera.top = 11;
    scene.add(key);

    const cL = new THREE.PointLight(currentTheme.w, 1.8, 28);
    cL.position.set(-6, 6, -4); scene.add(cL); scene.userData.lightW = cL;
    const mL = new THREE.PointLight(currentTheme.b, 1.8, 28);
    mL.position.set(6, 6, 4); scene.add(mL); scene.userData.lightB = mL;

    boardGroup = new THREE.Group();
    piecesGroup = new THREE.Group();
    highlightsGroup = new THREE.Group();
    lastMoveGroup = new THREE.Group();
    moveTrailGroup = new THREE.Group();
    scene.add(boardGroup, piecesGroup, highlightsGroup, lastMoveGroup, moveTrailGroup);

    buildBoard();
    buildPlatform();
    buildParticles();

    loadPosition();
    applyThemeCSS();
    bindUI();
    initAudio();
    animate();
    atualizarStatus();
    updatePlayCamera();
    onResize();
    selectPieces(pieceStyle, true);
    selectBoard(boardStyle, true);
    bindGlobalActivity();
  }

  function bindUI() {
    addEventListener('resize', onResize);
    renderer.domElement.addEventListener('pointerdown', e => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      isDragging = false;
    });
    renderer.domElement.addEventListener('pointermove', e => {
      if (!pointerDownPos) return;
      if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) > 5) isDragging = true;
    });
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    document.getElementById('btn-new').onclick = novaPartida;
    document.getElementById('btn-undo').onclick = desfazer;
    document.getElementById('btn-sound').onclick = toggleSound;
    document.getElementById('btn-toasty').onclick = () => showToasty();
    var pieceBtn = document.getElementById('btn-pieces');
    if (pieceBtn) pieceBtn.onclick = function () { document.getElementById('pieces-modal').classList.remove('hidden'); };
    var pieceClose = document.getElementById('btn-close-pieces');
    if (pieceClose) pieceClose.onclick = function () { document.getElementById('pieces-modal').classList.add('hidden'); };
    const pieceOptions=document.querySelector('#pieces-modal .piece-options');
    pieceOptions.innerHTML='';
    Object.entries(XPAssets.sets).forEach(([id,def])=>{const b=document.createElement('button');b.type='button';b.textContent=def.name;b.dataset.pieceStyle=id;b.onclick=()=>selectPieces(id);pieceOptions.appendChild(b);});
    document.getElementById('btn-board').onclick=()=>document.getElementById('board-modal').classList.remove('hidden');
    document.getElementById('btn-close-board').onclick=()=>document.getElementById('board-modal').classList.add('hidden');
    const boardOptions=document.querySelector('#board-modal .board-options');boardOptions.innerHTML='';
    Object.entries(XPAssets.boards).forEach(([id,def])=>{const b=document.createElement('button');b.type='button';b.textContent=def.name;b.dataset.boardStyle=id;b.onclick=()=>selectBoard(id);boardOptions.appendChild(b);});
    document.getElementById('btn-camera').onclick=()=>{
      cameraLocked=!cameraLocked;cameraAnimToken++;cineActive=false;
      controls.enableDamping=false;controls.update();controls.enabled=!cameraLocked;
      if(cameraLocked) onResize();
      document.getElementById('btn-camera').textContent=cameraLocked?'🔓 Destravar câmera':'🔒 Enquadrar / Travar';
      document.getElementById('btn-camera').setAttribute('aria-pressed',String(cameraLocked));
    };
    if(window.visualViewport)window.visualViewport.addEventListener('resize',onResize);
    var controlsToggle = document.getElementById('btn-controls-toggle');
    if (controlsToggle) controlsToggle.onclick = function () {
      document.body.classList.toggle('controls-collapsed');
      controlsToggle.textContent = document.body.classList.contains('controls-collapsed') ? '☰' : '×';
      requestAnimationFrame(onResize);
    };
    document.getElementById('btn-theme').onclick = () => {
      document.getElementById('theme-modal').classList.remove('hidden');
      buildThemeGrid();
    };
    document.getElementById('btn-close-theme').onclick = () => document.getElementById('theme-modal').classList.add('hidden');
    document.getElementById('btn-mode').onclick = () => document.getElementById('mode-modal').classList.remove('hidden');
    document.getElementById('btn-close-mode').onclick = () => document.getElementById('mode-modal').classList.add('hidden');

    document.querySelectorAll('#mode-modal [data-mode]').forEach(btn => {
      btn.onclick = () => {
        gameMode = btn.dataset.mode;
        const labels = { local: 'Local', 'ai-easy': 'IA Fácil', 'ai-medium': 'IA Médio', 'ai-hard': 'IA Difícil', paris: 'Paris' };
        document.getElementById('btn-mode').textContent = 'Modo: ' + labels[gameMode];
        document.getElementById('name-white').textContent = 'VOCÊ';
        if (gameMode === 'paris') {
          document.getElementById('name-black').textContent = 'PARIS';
          const pt = THEMES.find(t => t.id === 'paris');
          if (pt) applyTheme(pt);
          document.getElementById('mode-modal').classList.add('hidden');
          enterParisDirect();
          return;
        }
        document.getElementById('name-black').textContent = gameMode === 'local' ? 'ADVERSÁRIO' : 'MÁQUINA';
        document.getElementById('mode-modal').classList.add('hidden');
        novaPartida();
      };
    });

    document.querySelectorAll('#promo-modal button').forEach(btn => {
      btn.onclick = () => {
        if (pendingPromo) {
          executarLance(pendingPromo.from, pendingPromo.to, btn.dataset.p);
          pendingPromo = null;
          document.getElementById('promo-modal').classList.add('hidden');
        }
      };
    });
  }

  function showToast(message){const el=document.getElementById('asset-status');el.textContent=message;el.hidden=false;clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>{el.hidden=true;},2600);}
  async function selectPieces(id, startup=false) {
    if(animating){showToast('Aguarde o lance terminar');return;}
    const request=++pieceRequest;assetBusy=true;
    const status=document.getElementById('asset-status');status.hidden=false;status.textContent='Carregando '+XPAssets.sets[id].name+'…';
    try {
      const next=await XPAssets.loadSet(id);if(request!==pieceRequest)return;
      // A remote move may have started while downloading; swap only between animations.
      while(animating)await new Promise(r=>setTimeout(r,40));
      if(request!==pieceRequest)return;
      templates=next;pieceStyle=id;localStorage.setItem('xp-v7-piece-style',id);deselect();loadPosition();
      document.querySelectorAll('[data-piece-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pieceStyle===id)));
      document.getElementById('pieces-modal').classList.add('hidden');status.hidden=true;onResize();
      if(!startup)showToast('Peças: '+XPAssets.sets[id].name);
    }catch(e){console.error('Falha no conjunto',id,e);status.textContent='Não foi possível carregar '+XPAssets.sets[id].name+'. Abra Peças 3D para tentar novamente.';}
    finally{if(request===pieceRequest)assetBusy=false;}
  }
  async function selectBoard(id,startup=false){
    const request=++boardRequest;
    try{const next=await XPAssets.loadBoard(id);if(request!==boardRequest)return;boardStyle=id;boardAsset=next;buildBoard();localStorage.setItem('xp-v7-board-style',id);document.getElementById('board-modal').classList.add('hidden');onResize();if(!startup)showToast('Tabuleiro: '+XPAssets.boards[id].name);}
    catch(e){console.error('Falha no tabuleiro',id,e);showToast('Falha ao carregar tabuleiro. Tente novamente.');}
  }
  function buildBoard() {
    while(boardGroup.children.length)boardGroup.remove(boardGroup.children[0]);
    if(boardAsset){boardAsset.traverse(o=>{if(o.isMesh)o.receiveShadow=true;});boardGroup.add(boardAsset);}
    const imported=!!boardAsset;
    if(!imported || XPAssets.boards[boardStyle].squares){
      for(let r=0;r<8;r++)for(let f=0;f<8;f++){
        const light=(f+r)%2===1;
        const mat=new THREE.MeshStandardMaterial({color:imported?(light?0xd9cbae:0x302c29):(light?0x173146:0x07121e),roughness:.5,metalness:.15});
        const sq=new THREE.Mesh(new THREE.BoxGeometry(SQUARE,.06,SQUARE),mat);sq.position.set((f-3.5)*SQUARE,0,(r-3.5)*SQUARE);sq.receiveShadow=true;sq.userData={square:alg(f,7-r),isLight:light};boardGroup.add(sq);
      }
    }
    if(!imported){const border=new THREE.Mesh(new THREE.BoxGeometry(SQUARE*8.4,.18,SQUARE*8.4),new THREE.MeshPhysicalMaterial({color:0x00141e,emissive:currentTheme.w,emissiveIntensity:.35,metalness:.8,roughness:.2}));border.position.y=-.13;border.name='border';boardGroup.add(border);}
    const platform=scene.getObjectByName('platform');if(platform)platform.visible=!imported;
  }

  function buildPlatform() {
    const plat = new THREE.Mesh(
      new THREE.CylinderGeometry(8.2, 8.7, 0.4, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0x020810, metalness: 0.9, roughness: 0.15,
        emissive: 0x001018, emissiveIntensity: 0.4, clearcoat: 0.8
      })
    );
    plat.position.y = -0.35; plat.receiveShadow = true; plat.name = 'platform';
    scene.add(plat);
  }

  function buildParticles() {
    const N = 160;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = Math.random() * 12 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 26;
      const c = new THREE.Color(Math.random() > 0.5 ? currentTheme.w : currentTheme.b);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.04, vertexColors: true, transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(pts); scene.userData.particles = pts;
  }

  function createPiece(type, color) {
    const g = new THREE.Group();
    const isW = color === 'w';
    const col = isW ? currentTheme.w : currentTheme.b;
    const em = isW ? currentTheme.emW : currentTheme.emB;

    // v5: conjuntos visuais realmente distintos; modelo padrão continua sendo model.glb.
    var presets = {
      padrao:   {color:col, emissive:em, ei:.28, metal:.12, rough:.24, trans:.04, opacity:1, coat:.86},
      classico: {color:isW?0xf1dfbd:0x241b18, emissive:0x000000, ei:0, metal:.02, rough:.38, trans:0, opacity:1, coat:.55},
      premium:  {color:isW?0xfff4d6:0x111827, emissive:isW?0x2b210d:0x02040a, ei:.06, metal:.18, rough:.18, trans:0, opacity:1, coat:1},
      royal:    {color:isW?0xffd34d:0x6d28d9, emissive:isW?0x6b3f00:0x220044, ei:.22, metal:.78, rough:.16, trans:0, opacity:1, coat:1},
      crystal:  {color:col, emissive:em, ei:.62, metal:.02, rough:.07, trans:.38, opacity:.88, coat:1},
      cyber:    {color:isW?0x00e5ff:0xff2d9b, emissive:isW?0x00a6c8:0xb00066, ei:.95, metal:.28, rough:.10, trans:.12, opacity:.96, coat:1},
      obsidian: {color:isW?0x64748b:0x08090d, emissive:isW?0x0f172a:0x16001f, ei:.18, metal:.66, rough:.12, trans:0, opacity:1, coat:1}
    };
    var pp = presets[pieceStyle] || (pieceStyle==='medieval'?presets.royal:pieceStyle==='tournament'?presets.classico:presets.premium);
    const mat = new THREE.MeshPhysicalMaterial({
      color: pp.color, emissive: pp.emissive, emissiveIntensity: pp.ei,
      metalness: pp.metal, roughness: pp.rough, transmission: pp.trans,
      clearcoat: pp.coat, clearcoatRoughness: .06,
      transparent: pp.opacity < 1 || pp.trans > 0, opacity: pp.opacity, side: THREE.DoubleSide
    });
    const body=templates[type].clone(true);
    body.traverse(o=>{if(o.isMesh){if(!o.geometry.attributes.normal)o.geometry.computeVertexNormals();o.material=mat;o.castShadow=true;o.receiveShadow=true;}});
    g.add(body);
    const facing=(type==='n'?XPAssets.sets[pieceStyle].yaw:0)+(isW?0:Math.PI);
    g.userData={type,color,col,baseY:.04,staunton:true,facingY:facing,setId:pieceStyle};g.rotation.y=facing;
    body.traverse(function(o){
      o.userData = o.userData || {};
      o.userData.type = type; o.userData.color = color; o.userData.xpPieceRoot = g;
    });

    // Crystal/Cyber: brilho interno ascendente; Crystal é menos transparente e mais legível.
    if (pieceStyle === 'crystal' || pieceStyle === 'cyber') {
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex(), color: pp.color, transparent: true, opacity: pieceStyle === 'crystal' ? 0.52 : 0.36,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    spr.scale.set(1.4, 1.4, 1);
    spr.position.y = 0.20;
    spr.userData.xpNeonRise = true;
    spr.userData.xpNeonPhase = Math.random() * Math.PI * 2;
    g.add(spr);
    }
    return g;
  }

  function glowTex() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,0.9)');
    grd.addColorStop(0.3, 'rgba(255,255,255,0.25)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  function alg(f, r) { return String.fromCharCode(97 + f) + (r + 1); }
  function sqPos(sq) {
    const f = sq.charCodeAt(0) - 97, r = parseInt(sq[1], 10) - 1, off = 3.5 * SQUARE;
    return { x: f * SQUARE - off, z: (7 - r) * SQUARE - off };
  }

  function clearPieces() {
    const mats=new Set();piecesGroup.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));}});mats.forEach(m=>m.dispose());
    while (piecesGroup.children.length) piecesGroup.remove(piecesGroup.children[0]);
    pieceMap = {}; selectedMesh = null;
  }

  function loadPosition() {
    if (!templates) return;
    clearPieces();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[7 - r][f];
        if (p) {
          const sq = alg(f, r);
          const mesh = createPiece(p.type, p.color);
          const pos = sqPos(sq);
          mesh.position.set(pos.x, 0.04, pos.z);
          mesh.userData.square = sq;
          piecesGroup.add(mesh);
          pieceMap[sq] = mesh;
        }
      }
    }
  }

  function clearHighlights() {
    while (highlightsGroup.children.length) highlightsGroup.remove(highlightsGroup.children[0]);
  }
  function clearLastMove() {
    while (lastMoveGroup.children.length) lastMoveGroup.remove(lastMoveGroup.children[0]);
  }

  function showHighlights(moves, from) {
    clearHighlights();
    if (from) {
      const p = sqPos(from);
      const sel = new THREE.Mesh(
        new THREE.PlaneGeometry(SQUARE * 0.96, SQUARE * 0.96),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
      );
      sel.rotation.x = -Math.PI / 2; sel.position.set(p.x, 0.07, p.z);
      highlightsGroup.add(sel);
    }
    moves.forEach(m => {
      const p = sqPos(m.to);
      const cap = !!chess.get(m.to);
      if (cap) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.32, 0.48, 32),
          new THREE.MeshBasicMaterial({ color: 0xff3355, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, 0.08, p.z);
        highlightsGroup.add(ring);
      } else {
        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(0.16, 20),
          new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
        );
        dot.rotation.x = -Math.PI / 2; dot.position.set(p.x, 0.08, p.z);
        highlightsGroup.add(dot);
      }
    });
  }

  function clearMoveTrails() {
    if (!moveTrailGroup) return;
    while (moveTrailGroup.children.length) {
      var o = moveTrailGroup.children[0];
      moveTrailGroup.remove(o);
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    }
  }

  function squaresAlongMove(from, to, type) {
    var ff = from.charCodeAt(0) - 97, fr = parseInt(from[1], 10) - 1;
    var tf = to.charCodeAt(0) - 97, tr = parseInt(to[1], 10) - 1;
    var df = tf - ff, dr = tr - fr;
    var steps = Math.max(Math.abs(df), Math.abs(dr));
    if (type === 'n' || steps < 1 || !((df === 0) || (dr === 0) || Math.abs(df) === Math.abs(dr))) return [from, to];
    var out = [];
    for (var i = 0; i <= steps; i++) out.push(alg(ff + Math.round(df * i / steps), fr + Math.round(dr * i / steps)));
    return out;
  }

  function addMoveTrail(move) {
    if (!moveTrailGroup || !move) return;
    // Mantém exatamente um trajeto por lado: o próximo lance do mesmo jogador substitui o anterior.
    for (var i = moveTrailGroup.children.length - 1; i >= 0; i--) {
      var old = moveTrailGroup.children[i];
      if (old.userData.trailColorSide === move.color) {
        moveTrailGroup.remove(old);
        if (old.geometry) old.geometry.dispose();
        if (old.material) old.material.dispose();
      }
    }
    var color = move.color === 'w' ? currentTheme.w : currentTheme.b;
    squaresAlongMove(move.from, move.to, move.piece).forEach(function (sq, idx, arr) {
      var p = sqPos(sq);
      var endpoint = idx === 0 || idx === arr.length - 1;
      var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(SQUARE * 0.94, SQUARE * 0.94),
        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: endpoint ? 0.78 : 0.62, side: THREE.DoubleSide, depthWrite: false })
      );
      plane.rotation.x = -Math.PI / 2; plane.position.set(p.x, 0.073, p.z);
      plane.userData.trailColorSide = move.color;
      moveTrailGroup.add(plane);
    });
  }

  function showLastMove(from, to) {
    clearLastMove();
    [from, to].forEach(sq => {
      const p = sqPos(sq);
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(SQUARE * 0.96, SQUARE * 0.96),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
      );
      plane.rotation.x = -Math.PI / 2; plane.position.set(p.x, 0.065, p.z);
      lastMoveGroup.add(plane);
    });
  }

  function liftSelected(mesh, up) {
    if (!mesh) return;
    const targetY = up ? 0.32 : 0.04;
    const startY = mesh.position.y;
    const t0 = performance.now();
    function step(now) {
      const t = Math.min((now - t0) / 120, 1);
      mesh.position.y = startY + (targetY - startY) * t;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Converte ponto 3D no plano do tabuleiro → casa algébrica (casa inteira clicável)
  function worldToSquare(x, z) {
    const off = 3.5 * SQUARE;
    const f = Math.floor((x + off) / SQUARE + 0.5);
    const rFromCam = Math.floor((z + off) / SQUARE + 0.5);
    const r = 7 - rFromCam;
    if (f < 0 || f > 7 || r < 0 || r > 7) return null;
    return alg(f, r);
  }

  function squareWorldCenter(sq) {
    if (!sq || sq.length < 2) return null;
    var f = sq.charCodeAt(0) - 97, r = parseInt(sq.charAt(1), 10) - 1;
    if (f < 0 || f > 7 || r < 0 || r > 7) return null;
    var off = 3.5 * SQUARE;
    return { x: f * SQUARE - off, z: (7 - r) * SQUARE - off };
  }

  function assistedTouchDestination(hit, exactSq, e) {
    if (!selected || !legal || !legal.length) return exactSq;
    var isTouch = e && (e.pointerType === 'touch' || e.pointerType === 'pen');
    if (!isTouch) return exactSq;
    if (legal.some(function(m){ return m.to === exactSq; })) return exactSq;
    var best = null, bestD = Infinity;
    legal.forEach(function(m){
      var c = squareWorldCenter(m.to); if (!c) return;
      var d = Math.hypot(hit.x - c.x, hit.z - c.z);
      if (d < bestD) { bestD = d; best = m.to; }
    });
    // tolerância moderada: ajuda o dedo sem transformar toque distante em outro lance
    return (best && bestD <= SQUARE * 0.72) ? best : exactSq;
  }

  function onPointerUp(e) {
    if (!pointerDownPos) return;
    const wasDrag = isDragging;
    pointerDownPos = null; isDragging = false;
    resetIdleTimer();
    if (cineActive === 'idle') stopCinematic(true);
    if (wasDrag || assetBusy || !templates || animating || aiThinking || chess.game_over()) return;
    if (gameMode !== 'local') {
      if (gameMode === 'paris' && !parisReady) return;
      if (chess.turn() !== (playerIsWhite ? 'w' : 'b')) return;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // 1) Prioriza peça (selecionar)
    let clicked = null;
    const pieceHits = raycaster.intersectObjects(piecesGroup.children, true);
    if (pieceHits.length) {
      let o = pieceHits[0].object;
      while (o && !o.userData.square) o = o.parent;
      if (o) clicked = o.userData.square;
    }

    // 2) Casa inteira via interseção com plano do tabuleiro (mais preciso)
    if (!clicked || selected) {
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.06);
      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, hit)) {
        const sq = worldToSquare(hit.x, hit.z);
        if (sq) {
          // Mobile: se o dedo cair perto da borda, favorece um destino legal próximo.
          const assistedSq = assistedTouchDestination(hit, sq, e);
          if (selected) clicked = assistedSq;
          else if (!clicked) clicked = sq;
        }
      }
    }

    if (!clicked) { deselect(); return; }

    const turn = chess.turn();
    const piece = chess.get(clicked);

    if (selected) {
      const move = legal.find(m => m.to === clicked);
      if (move) {
        if (move.flags && move.flags.includes('p')) {
          pendingPromo = { from: selected, to: clicked };
          document.getElementById('promo-modal').classList.remove('hidden');
          return;
        }
        executarLance(selected, clicked);
        return;
      }
      if (piece && piece.color === turn) { selecionar(clicked); return; }
      deselect();
    } else if (piece && piece.color === turn) {
      selecionar(clicked);
    }
  }

  function deselect() {
    if (selectedMesh) { liftSelected(selectedMesh, false); selectedMesh = null; }
    selected = null; legal = []; clearHighlights();
  }

  function selecionar(sq) {
    if (selectedMesh) liftSelected(selectedMesh, false);
    selected = sq;
    legal = chess.moves({ square: sq, verbose: true });
    showHighlights(legal, sq);
    selectedMesh = pieceMap[sq] || null;
    if (selectedMesh) liftSelected(selectedMesh, true);
    playSelect();
  }

  function getAnimParams(type, isCapture) {
    const base = {
      p: { height: 0.65, dur: 300, spin: 0 },
      n: { height: 1.7, dur: 430, spin: 0.4 },
      b: { height: 0.9, dur: 350, spin: 0.12 },
      r: { height: 0.5, dur: 310, spin: 0 },
      q: { height: 1.05, dur: 390, spin: 0.2 },
      k: { height: 0.55, dur: 280, spin: 0 }
    }[type] || { height: 0.8, dur: 340, spin: 0 };
    if (isCapture) { base.height *= 1.12; base.dur += 30; }
    return base;
  }

  function executarLance(from, to, promo) {
    promo = promo || 'q';
    const move = chess.move({ from, to, promotion: promo });
    if (!move) return;

    animating = true;
    if (selectedMesh) { selectedMesh.position.y = 0.04; selectedMesh = null; }
    selected = null; legal = []; clearHighlights();
    playMove(!!move.captured);

    const mesh = pieceMap[from];
    if (!mesh) { loadPosition(); afterMove(move); return; }

    const anim = getAnimParams(mesh.userData.type, !!move.captured);
    const target = sqPos(to);
    const start = mesh.position.clone();
    const startRotY = mesh.rotation.y;
    const t0 = performance.now();

    if (pieceMap[to]) { piecesGroup.remove(pieceMap[to]); delete pieceMap[to]; }

    let rook = null, rookTarget = null;
    if (move.flags.includes('k') || move.flags.includes('q')) {
      const rank = from[1];
      const isK = move.flags.includes('k');
      const rFrom = (isK ? 'h' : 'a') + rank;
      const rTo = (isK ? 'f' : 'd') + rank;
      rook = pieceMap[rFrom];
      if (rook) {
        rookTarget = sqPos(rTo);
        delete pieceMap[rFrom];
        pieceMap[rTo] = rook;
        rook.userData.square = rTo;
      }
    }

    function step(now) {
      const t = Math.min((now - t0) / anim.dur, 1);
      const e = 1 - Math.pow(1 - t, 3);
      mesh.position.x = start.x + (target.x - start.x) * e;
      mesh.position.z = start.z + (target.z - start.z) * e;
      const hCurve = mesh.userData.type === 'n'
        ? Math.sin(t * Math.PI) * (0.85 + 0.15 * Math.sin(t * Math.PI * 2))
        : Math.sin(t * Math.PI);
      mesh.position.y = 0.04 + hCurve * anim.height;
      if (anim.spin) mesh.rotation.y = startRotY + t * Math.PI * 2 * anim.spin;

      if (rook && rookTarget) {
        rook.position.x += (rookTarget.x - rook.position.x) * 0.2;
        rook.position.z += (rookTarget.z - rook.position.z) * 0.2;
      }

      if (t < 1) requestAnimationFrame(step);
      else {
        mesh.position.set(target.x, 0.04, target.z);
        mesh.rotation.y = (mesh.userData && typeof mesh.userData.facingY === 'number') ? mesh.userData.facingY : startRotY;
        delete pieceMap[from];
        pieceMap[to] = mesh;
        mesh.userData.square = to;

        if (move.flags.includes('p')) {
          piecesGroup.remove(mesh);
          const neu = createPiece(move.promotion, move.color);
          neu.position.copy(mesh.position);
          neu.userData.square = to;
          piecesGroup.add(neu);
          pieceMap[to] = neu;
        }
        if (move.flags.includes('e')) {
          const epR = move.color === 'w' ? parseInt(to[1], 10) - 1 : parseInt(to[1], 10) + 1;
          const ep = to[0] + epR;
          if (pieceMap[ep]) { piecesGroup.remove(pieceMap[ep]); delete pieceMap[ep]; }
        }
        if (rook && rookTarget) rook.position.set(rookTarget.x, 0.04, rookTarget.z);

        animating = false;
        afterMove(move);
      }
    }
    requestAnimationFrame(step);
  }

  function afterMove(move) {
    resetIdleTimer();
    showLastMove(move.from, move.to);
    addMoveTrail(move);
    if (move.flags && (move.flags.includes('k') || move.flags.includes('q'))) playCastle();
    if (move.flags && move.flags.includes('p')) playPromotion();
    addMoveList(move);
    atualizarStatus();
    atualizarCapturadas();
    burst(sqPos(move.to), move.color === 'w' ? currentTheme.b : currentTheme.w);
    triggerSpecialFx(move);

    if (!chess.game_over() && gameMode.startsWith('ai')) {
      if (chess.turn() === (playerIsWhite ? 'b' : 'w')) setTimeout(aiMove, 380);
    }
  }

  function triggerSpecialFx(move) {
    const now = performance.now();
    if (now - lastToastyAt < 4000) return;
    if (chess.in_checkmate()) { lastToastyAt = now; return; }
    if (move.flags && move.flags.includes('p') && toastyCount.promo < 2) {
      showToasty('PROMOÇÃO!'); toastyCount.promo++; lastToastyAt = now; return;
    }
    if (move.captured === 'q' && toastyCount.queen < 2) {
      showToasty('RAINHA!'); toastyCount.queen++; lastToastyAt = now; return;
    }
    if (move.flags && (move.flags.includes('k') || move.flags.includes('q')) && toastyCount.castle < 1) {
      showToasty('ROQUE!'); toastyCount.castle++; lastToastyAt = now; return;
    }
    // Xeque: tratado em atualizarStatus (só ao entrar em xeque)
  }

  function pieceValue(t) {
    return { p: 1, n: 3, b: 3.1, r: 5, q: 9, k: 0 }[t] || 0;
  }
  function evaluate() {
    let score = 0;
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[r][f];
        if (!p) continue;
        const v = pieceValue(p.type);
        const center = (r >= 2 && r <= 5 && f >= 2 && f <= 5) ? 0.15 : 0;
        score += p.color === 'w' ? (v + center) : -(v + center);
      }
    }
    if (chess.in_check()) score += chess.turn() === 'w' ? -0.4 : 0.4;
    return score;
  }

  function aiMove() {
    if (aiThinking || chess.game_over()) return;
    aiThinking = true;
    atualizarStatus();
    const depth = gameMode === 'ai-hard' ? 2 : (gameMode === 'ai-medium' ? 1 : 0);
    const moves = chess.moves({ verbose: true });
    if (!moves.length) { aiThinking = false; return; }
    for (let i = moves.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [moves[i], moves[j]] = [moves[j], moves[i]];
    }
    let best = null;
    let bestScore = chess.turn() === 'w' ? -Infinity : Infinity;
    for (const m of moves) {
      chess.move(m);
      let score = depth === 0
        ? evaluate() + (Math.random() - 0.5) * 1.2 + (m.captured ? (chess.turn() === 'w' ? -0.3 : 0.3) : 0)
        : minimax(depth - 1, -Infinity, Infinity);
      chess.undo();
      const isMax = chess.turn() === 'w';
      if (isMax ? score > bestScore : score < bestScore) { bestScore = score; best = m; }
    }
    if (!best) best = moves[0];
    aiThinking = false;
    setTimeout(() => executarLance(best.from, best.to, best.promotion || 'q'), 70);
  }

  function minimax(depth, alpha, beta) {
    if (depth === 0 || chess.game_over()) return evaluate();
    const moves = chess.moves({ verbose: true });
    if (chess.turn() === 'w') {
      let max = -Infinity;
      for (const m of moves) {
        chess.move(m);
        max = Math.max(max, minimax(depth - 1, alpha, beta));
        chess.undo();
        alpha = Math.max(alpha, max);
        if (beta <= alpha) break;
      }
      return max;
    }
    let min = Infinity;
    for (const m of moves) {
      chess.move(m);
      min = Math.min(min, minimax(depth - 1, alpha, beta));
      chess.undo();
      beta = Math.min(beta, min);
      if (beta <= alpha) break;
    }
    return min;
  }

  function burst(pos, color) {
    const N = 18;
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { arr[i * 3] = pos.x; arr[i * 3 + 1] = 0.4; arr[i * 3 + 2] = pos.z; }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const mat = new THREE.PointsMaterial({
      color, size: 0.08, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    const vel = Array.from({ length: N }, () => ({
      x: (Math.random() - 0.5) * 0.14, y: Math.random() * 0.1 + 0.03, z: (Math.random() - 0.5) * 0.14
    }));
    let life = 1;
    (function tick() {
      life -= 0.04;
      if (life <= 0) { scene.remove(pts); geo.dispose(); mat.dispose(); return; }
      const a = geo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        a[i * 3] += vel[i].x; a[i * 3 + 1] += vel[i].y; a[i * 3 + 2] += vel[i].z;
        vel[i].y -= 0.006;
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = life;
      requestAnimationFrame(tick);
    })();
  }

  function atualizarStatus() {
    const el = document.getElementById('status');
    const cardW = document.getElementById('card-white');
    const cardB = document.getElementById('card-black');
    el.classList.remove('xeque', 'mate');
    cardW.classList.remove('active-turn');
    cardB.classList.remove('active-turn');

    if (aiThinking) {
      el.textContent = 'Máquina pensando…';
      cardB.classList.add('active-turn');
      return;
    }
    if (chess.in_checkmate()) {
      const v = chess.turn() === 'w' ? (gameMode === 'local' ? 'Adversário' : 'Máquina') : 'Você';
      el.textContent = 'Xeque-mate — ' + v + ' venceu!';
      el.classList.add('mate');
      if (!wasInCheck) playMate();
      wasInCheck = true;
    } else if (chess.in_draw()) {
      el.textContent = 'Empate';
      wasInCheck = false;
    } else if (chess.in_check()) {
      const myTurn = chess.turn() === (playerIsWhite ? 'w' : 'b');
      const who = myTurn ? 'você' : (gameMode.indexOf('ai-')===0 ? 'máquina' : 'adversário');
      el.textContent = 'Xeque! ' + (myTurn ? 'É a sua vez' : 'Vez do ' + who);
      el.classList.add('xeque');
      // Toasty só ao ENTRAR em xeque (não a cada atualização de status)
      if (!wasInCheck) playCheck();
      wasInCheck = true;
      if (chess.turn() === 'w') cardW.classList.add('active-turn');
      else cardB.classList.add('active-turn');
    } else {
      const myTurn = chess.turn() === (playerIsWhite ? 'w' : 'b');
      el.textContent = myTurn ? 'É a sua vez' : (gameMode.indexOf('ai-')===0 ? 'Vez da máquina' : 'Vez do adversário');
      wasInCheck = false;
      if (chess.turn() === 'w') cardW.classList.add('active-turn');
      else cardB.classList.add('active-turn');
    }
  }

  function addMoveList(move) {
    const list = document.getElementById('move-list');
    const hist = chess.history({ verbose: true });
    const num = Math.ceil(hist.length / 2);
    let row = list.querySelector('[data-n="' + num + '"]');
    if (!row) {
      row = document.createElement('div');
      row.className = 'move-row';
      row.dataset.n = num;
      row.innerHTML = '<span class="n">' + num + '.</span><span class="s w"></span><span class="s b"></span>';
      list.appendChild(row);
    }
    const span = row.querySelector(move.color === 'w' ? '.w' : '.b');
    if (span) span.textContent = move.san;
    list.scrollTop = list.scrollHeight;
  }

  function atualizarCapturadas() {
    const hist = chess.history({ verbose: true });
    const capW = [], capB = [];
    hist.forEach(m => {
      if (m.captured) {
        const sym = { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' }[m.captured] || '•';
        if (m.color === 'w') capB.push(sym); else capW.push(sym);
      }
    });
    document.getElementById('captured-black').textContent = capB.join(' ');
    document.getElementById('captured-white').textContent = capW.join(' ');
    document.getElementById('score-white').textContent = String(capB.length);
    document.getElementById('score-black').textContent = String(capW.length);
  }

  function novaPartida() {
    chess.reset();
    selected = null; legal = []; aiThinking = false; selectedMesh = null;
    clearHighlights(); clearLastMove(); clearMoveTrails();
    loadPosition();
    document.getElementById('move-list').innerHTML = '';
    document.getElementById('captured-black').textContent = '';
    document.getElementById('captured-white').textContent = '';
    document.getElementById('score-white').textContent = '0';
    document.getElementById('score-black').textContent = '0';
    toastyCount = { check: 0, promo: 0, queen: 0, castle: 0 };
    lastToastyAt = 0;
    wasInCheck = false;
    atualizarStatus();
    playSelect();
    onResize();
    selectPieces(pieceStyle, true);
    selectBoard(boardStyle, true);
  }

  function desfazer() {
    if (animating || aiThinking) return;
    if (gameMode.startsWith('ai')) { chess.undo(); chess.undo(); }
    else chess.undo();
    loadPosition();
    clearHighlights(); clearLastMove();
    selected = null; selectedMesh = null;
    document.getElementById('move-list').innerHTML = '';
    chess.history({ verbose: true }).forEach(addMoveList);
    atualizarStatus();
    atualizarCapturadas();
  }

  function applyThemeCSS() {
    document.documentElement.style.setProperty('--accent-w', '#' + currentTheme.w.toString(16).padStart(6, '0'));
    document.documentElement.style.setProperty('--accent-b', '#' + currentTheme.b.toString(16).padStart(6, '0'));
    document.documentElement.style.setProperty('--theme-w-soft', '#' + new THREE.Color(currentTheme.w).lerp(new THREE.Color(0x01040c), 0.78).getHexString());
    document.documentElement.style.setProperty('--theme-b-soft', '#' + new THREE.Color(currentTheme.b).lerp(new THREE.Color(0x01040c), 0.82).getHexString());
  }

  function applyTheme(theme) {
    currentTheme = theme;
    applyThemeCSS();
    var bg = new THREE.Color(theme.w).lerp(new THREE.Color(theme.b), 0.35).lerp(new THREE.Color(0x01040c), 0.88);
    scene.background = bg.clone();
    scene.fog.color.copy(bg);
    boardGroup.children.forEach(function (o) {
      if (boardStyle==='neon' && o.userData && typeof o.userData.isLight === 'boolean') {
        var base = new THREE.Color(o.userData.isLight ? 0x122840 : 0x0a1520);
        var tint = new THREE.Color(o.userData.isLight ? theme.w : theme.b);
        o.material.color.copy(base.lerp(tint, o.userData.isLight ? 0.16 : 0.11));
        o.material.emissive.copy(new THREE.Color(0x020810).lerp(tint, 0.10));
      }
    });
    if (moveTrailGroup) moveTrailGroup.children.forEach(function(o){ o.material.color.setHex(o.userData.trailColorSide === 'w' ? theme.w : theme.b); });
    if (scene.userData.lightW) scene.userData.lightW.color.setHex(theme.w);
    if (scene.userData.lightB) scene.userData.lightB.color.setHex(theme.b);
    const border = boardGroup.getObjectByName('border');
    if (border) border.material.emissive.setHex(theme.w);
    var plat = scene.getObjectByName('platform');
    if (plat) { plat.material.color.copy(new THREE.Color(0x020810).lerp(new THREE.Color(theme.b), 0.08)); plat.material.emissive.copy(new THREE.Color(0x001018).lerp(new THREE.Color(theme.w), 0.12)); }
    const ring = boardGroup.getObjectByName('ring');
    if (ring) ring.material.color.setHex(theme.w);
    loadPosition();
    if (scene.userData.particles) {
      const col = scene.userData.particles.geometry.attributes.color.array;
      for (let i = 0; i < col.length; i += 3) {
        const c = new THREE.Color(Math.random() > 0.5 ? theme.w : theme.b);
        col[i] = c.r; col[i + 1] = c.g; col[i + 2] = c.b;
      }
      scene.userData.particles.geometry.attributes.color.needsUpdate = true;
    }
  }

  function buildThemeGrid() {
    const grid = document.getElementById('theme-grid');
    grid.innerHTML = '';
    THEMES.forEach(t => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = t.name;
      btn.style.borderColor = '#' + t.w.toString(16).padStart(6, '0');
      btn.onclick = () => { applyTheme(t); document.getElementById('theme-modal').classList.add('hidden'); };
      grid.appendChild(btn);
    });
  }

  let toastyTimer = null;
  let audioUnlocked = false;

  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    ensureAudio();
    try {
      const aud = document.getElementById('toasty-audio');
      if (aud) {
        aud.muted = true;
        const p = aud.play();
        if (p && p.then) p.then(function () { aud.pause(); aud.currentTime = 0; aud.muted = false; }).catch(function () {});
      }
    } catch (e) {}
  }

  function playToastySound() {
    if (!soundOn) return;
    unlockAudio();
    // 1) Arquivo local WAV
    try {
      const aud = document.getElementById('toasty-audio');
      if (aud) {
        aud.muted = false;
        aud.volume = 1;
        aud.currentTime = 0;
        const p = aud.play();
        if (p && p.catch) p.catch(function () { speakToasty(); });
        else return;
        return;
      }
    } catch (e) {}
    // 2) Fallback voz
    speakToasty();
  }

  function speakToasty() {
    try {
      if (!window.speechSynthesis) { playTone(900, 0.12, 'square', 0.08); return; }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance('Toasty!');
      u.rate = 1.15;
      u.pitch = 1.4;
      u.volume = 1;
      window.speechSynthesis.speak(u);
    } catch (e) {
      playTone(900, 0.12, 'square', 0.08);
      setTimeout(function () { playTone(1200, 0.15, 'square', 0.06); }, 80);
    }
  }

  function showToasty(text, broadcast) {
    if (broadcast !== false && gameMode === 'paris' && conn && conn.open) {
      try { conn.send({ type: 'toasty', text: String(text || 'TOASTY!') }); } catch (e) {}
    }
    const el = document.getElementById('toasty');
    if (!el) return;
    el.classList.remove('hidden');
    void el.offsetWidth;
    el.classList.add('show');
    playToastySound();
    if (toastyTimer) clearTimeout(toastyTimer);
    toastyTimer = setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.classList.add('hidden'); }, 280);
    }, 1600);
  }


  function initAudio() {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { soundOn = false; }
  }
  function ensureAudio() {
    if (!audioCtx) initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      try { audioCtx.resume(); } catch (e) {}
    }
  }
  function toggleSound() {
    soundOn = !soundOn;
    var btn = document.getElementById('btn-sound');
    if (btn) btn.textContent = soundOn ? '🔊' : '🔇';
    if (soundOn) {
      ensureAudio();
      startAmbient();
    } else {
      stopAmbient();
    }
  }
  function startAmbient() {
    if (!audioCtx || ambientNodes.length) return;
    try {
      var osc1 = audioCtx.createOscillator(), osc2 = audioCtx.createOscillator();
      var gain = audioCtx.createGain(), filter = audioCtx.createBiquadFilter();
      osc1.type = 'sine'; osc1.frequency.value = 48;
      osc2.type = 'sine'; osc2.frequency.value = 72;
      filter.type = 'lowpass'; filter.frequency.value = 220;
      gain.gain.value = 0.016;
      osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
      osc1.start(); osc2.start();
      ambientNodes = [osc1, osc2, gain, filter];
    } catch (e) {}
  }
  function stopAmbient() {
    ambientNodes.forEach(function (n) {
      try { if (n.stop) n.stop(); if (n.disconnect) n.disconnect(); } catch (e) {}
    });
    ambientNodes = [];
  }
  function playTone(freq, dur, type, vol) {
    if (!soundOn || !audioCtx) return;
    ensureAudio();
    try {
      var osc = audioCtx.createOscillator(), g = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.05, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(g); g.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) {}
  }

  function playSelect() { playTone(820, 0.04, 'sine', 0.025); }
  function playMove(cap) {
    if (cap) { playTone(190, 0.09, 'triangle', 0.055); setTimeout(() => playTone(150, 0.1, 'sine', 0.035), 30); }
    else { playTone(460, 0.05, 'sine', 0.03); setTimeout(() => playTone(680, 0.04, 'sine', 0.018), 35); }
  }
  function playCastle() { playTone(260, 0.07, 'triangle', 0.035); setTimeout(function(){ playTone(390, 0.09, 'triangle', 0.028); }, 65); }
  function playPromotion() { playTone(520, 0.07, 'sine', 0.03); setTimeout(function(){ playTone(780, 0.10, 'sine', 0.026); }, 70); setTimeout(function(){ playTone(1040, 0.12, 'sine', 0.02); }, 145); }
  function playCheck() {
    playTone(600, 0.07, 'square', 0.03);
    setTimeout(() => playTone(800, 0.08, 'sine', 0.022), 55);
    showToasty();
  }
  function playMate() {
    playTone(380, 0.14, 'triangle', 0.045);
    setTimeout(() => playTone(280, 0.18, 'sine', 0.035), 110);
    showToasty();
  }

  document.body.addEventListener('pointerdown', function () {
    unlockAudio();
    ensureAudio();
    if (soundOn && !ambientNodes.length) startAmbient();
  }, { once: true });

  function updatePlayCamera() {
    const wrap=document.getElementById('canvas-wrap');const w=wrap.clientWidth,h=wrap.clientHeight;
    camera.aspect=w/Math.max(h,1);camera.fov=w<h?42:35;camera.updateProjectionMatrix();
    const bounds=new THREE.Box3().setFromObject(boardGroup);
    bounds.min.y=Math.min(bounds.min.y,-.15);bounds.max.y=Math.max(bounds.max.y,2.0);
    const center=bounds.getCenter(new THREE.Vector3());center.y=.45;
    const direction=new THREE.Vector3(0,w<h?1.55:1.25,playerIsWhite?1:-1).normalize();
    const corners=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new THREE.Vector3(x,y,z));
    let lo=1,hi=150;
    for(let i=0;i<36;i++){
      const dist=(lo+hi)/2;camera.position.copy(center).addScaledVector(direction,dist);camera.lookAt(center);camera.updateMatrixWorld(true);
      const fits=corners.every(v=>{const q=v.clone().project(camera);return q.z<1&&q.z>-1&&Math.abs(q.x)<=.965&&Math.abs(q.y)<=.94;});
      if(fits)hi=dist;else lo=dist;
    }
    PLAY_CAM={x:center.x+direction.x*hi,y:center.y+direction.y*hi,z:center.z+direction.z*hi};PLAY_TARGET={x:center.x,y:center.y,z:center.z};
    camera.position.set(PLAY_CAM.x,PLAY_CAM.y,PLAY_CAM.z);controls.target.copy(center);camera.lookAt(center);controls.update();
  }
  function onResize() {
    if(!renderer)return;
    const small=innerWidth<=720||innerHeight<500,collapsed=document.body.classList.contains('controls-collapsed');
    const wrap=document.getElementById('canvas-wrap');
    if(small){const status=document.getElementById('status').getBoundingClientRect();const control=document.getElementById(collapsed?'btn-controls-toggle':'bottom-bar').getBoundingClientRect();wrap.style.cssText='position:fixed;left:0;right:0;top:'+Math.ceil(Math.max(56,status.bottom+8))+'px;bottom:'+Math.ceil(innerHeight-control.top+8)+'px;';}
    else{wrap.style.cssText='position:fixed;left:'+(collapsed?16:218)+'px;right:210px;top:100px;bottom:20px;';}
    document.documentElement.style.setProperty('--play-top',wrap.style.top);document.documentElement.style.setProperty('--play-bottom',wrap.style.bottom);
    const old=camera.position.clone(),target=controls.target.clone();renderer.setSize(wrap.clientWidth,Math.max(wrap.clientHeight,1));updatePlayCamera();
    if(!cameraLocked&&!cineActive){camera.position.copy(old);controls.target.copy(target);controls.update();}
    controls.enabled=!cameraLocked;
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!cameraLocked) controls.update();
    if (scene.userData.particles) {
      const p = scene.userData.particles.geometry.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) {
        p[i + 1] += 0.0025;
        if (p[i + 1] > 13) p[i + 1] = 0.4;
      }
      scene.userData.particles.geometry.attributes.position.needsUpdate = true;
      scene.userData.particles.rotation.y += 0.0002;
    }
    const t = performance.now() * 0.001;
    Object.values(pieceMap).forEach((mesh, i) => {
      const spr = mesh.children.find(c => c.isSprite && c.userData.xpNeonRise);
      if (spr) {
        const phase = (t * 0.72 + spr.userData.xpNeonPhase) % 1;
        spr.position.y = 0.16 + phase * 1.22;
        const pulse = Math.sin(phase * Math.PI);
        const ss = 1.05 + pulse * 0.34;
        spr.scale.set(ss, ss, 1);
        spr.material.opacity = 0.16 + pulse * 0.34;
      }
    });
    renderer.render(scene, camera);
  }



  // ---------- CÂMERA CINEMÁTICA (intro + idle) ----------
  var PLAY_CAM = { x: 0, y: 12.2, z: 10.8 };
  var PLAY_TARGET = { x: 0, y: 0.25, z: 0 };
  var cineActive = false;
  var cameraAnimToken = 0;
  var idleTimer = null;
  var IDLE_MS = 45000;

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    if (cineActive === 'idle') stopCinematic(true);
    idleTimer = setTimeout(function () {
      if (!cameraLocked && !animating && !aiThinking && !cineActive) playIdleCinematic();
    }, IDLE_MS);
  }

  function stopCinematic(restorePlay) {
    cineActive = false;
    cameraAnimToken++; // cancela imediatamente qualquer animação antiga ainda agendada
    controls.enabled = !cameraLocked;
    updatePlayCamera();
    if (restorePlay) animateCameraTo(PLAY_CAM, PLAY_TARGET, 160);
  }

  function bindGlobalActivity() {
    ['pointerdown','touchstart','keydown','wheel'].forEach(function (ev) {
      window.addEventListener(ev, function () {
        if (cineActive === 'idle') stopCinematic(true);
        resetIdleTimer();
      }, { passive: true });
    });
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function animateCameraTo(pos, target, duration, onDone) {
    var myToken = ++cameraAnimToken;
    var sx = camera.position.x, sy = camera.position.y, sz = camera.position.z;
    var stx = controls.target.x, sty = controls.target.y, stz = controls.target.z;
    var t0 = performance.now();
    function step(now) {
      if (myToken !== cameraAnimToken) return;
      var t = Math.min((now - t0) / duration, 1);
      var e = easeInOut(t);
      camera.position.set(sx + (pos.x - sx) * e, sy + (pos.y - sy) * e, sz + (pos.z - sz) * e);
      controls.target.set(stx + (target.x - stx) * e, sty + (target.y - sty) * e, stz + (target.z - stz) * e);
      controls.update();
      if (t < 1) requestAnimationFrame(step);
      else if (onDone) onDone();
    }
    requestAnimationFrame(step);
  }

  function playIntroCinematic() {
    if(cameraLocked)return;
    // v6: no celular vertical entra direto no enquadramento jogável; nada de zoom que corte o tabuleiro.
    if (innerWidth <= 720 && innerHeight > innerWidth) {
      cineActive=false; controls.enabled=true; updatePlayCamera(); camera.position.set(PLAY_CAM.x,PLAY_CAM.y,PLAY_CAM.z); controls.target.set(PLAY_TARGET.x,PLAY_TARGET.y,PLAY_TARGET.z); controls.update(); resetIdleTimer(); return;
    }
    cineActive = 'intro';
    controls.enabled = false;
    camera.position.set(0, 28, 32);
    controls.target.set(0, 0.2, 0);
    controls.update();
    var t0 = performance.now();
    var phase1 = 550;
    function orbit(now) {
      if (cineActive !== 'intro') return;
      var t = Math.min((now - t0) / phase1, 1);
      var e = easeInOut(t);
      var angle = e * Math.PI * 1.25;
      var dist = 32 - e * 18;
      var height = 28 - e * 14;
      camera.position.set(Math.sin(angle) * dist, height, Math.cos(angle) * dist);
      controls.target.set(0, 0.3, 0);
      controls.update();
      if (t < 1) requestAnimationFrame(orbit);
      else {
        // v1.8: vai direto para a câmera de jogo; remove o zoom intermediário demorado.
        animateCameraTo(PLAY_CAM, PLAY_TARGET, 325, function () {
          cineActive = false;
          controls.enabled = !cameraLocked;
          updatePlayCamera();
          camera.position.set(PLAY_CAM.x, PLAY_CAM.y, PLAY_CAM.z);
          controls.target.set(PLAY_TARGET.x, PLAY_TARGET.y, PLAY_TARGET.z);
          controls.update();
          resetIdleTimer();
        });
      }
    }
    requestAnimationFrame(orbit);
  }

  function playIdleCinematic() {
    if (cameraLocked || cineActive || animating || aiThinking) return;
    cineActive = 'idle';
    controls.enabled = false;
    var pieces = Object.keys(pieceMap);
    if (!pieces.length) { stopCinematic(true); resetIdleTimer(); return; }
    var idx = 0;
    function focusNext() {
      if (cineActive !== 'idle') return;
      if (idx >= pieces.length) {
        animateCameraTo(PLAY_CAM, PLAY_TARGET, 1800, function () {
          stopCinematic(true);
          resetIdleTimer();
        });
        return;
      }
      var mesh = pieceMap[pieces[idx++]];
      if (!mesh) { focusNext(); return; }
      var p = mesh.position;
      var ox = (Math.random() - 0.5) * 2.5;
      var oz = 3.2 + Math.random() * 1.5;
      animateCameraTo(
        { x: p.x + ox, y: 3.8 + Math.random() * 1.5, z: p.z + oz },
        { x: p.x, y: 0.5, z: p.z },
        2200,
        function () { setTimeout(focusNext, 700); }
      );
    }
    animateCameraTo({ x: 8, y: 16, z: 8 }, { x: 0, y: 0.3, z: 0 }, 500, function () {
      setTimeout(focusNext, 300);
    });
  }

  // ---------- SALA PARIS (PeerJS P2P) ----------
  let peer = null, conn = null, isParisHost = false, parisReady = false;

  function setParisSlots(n) {
    var el = document.getElementById('paris-slots');
    if (el) el.textContent = 'Jogadores: ' + n + ' / 2';
  }

  function applyPlayerPerspective() {
    cameraAnimToken++;cineActive=false;updatePlayCamera();controls.enabled=!cameraLocked;
  }

  function enterParisDirect() {
    // Entrada direta: não mostra o modal intermediário.
    var modal = document.getElementById('paris-modal');
    if (modal) modal.classList.add('hidden');
    if (typeof Peer === 'undefined') {
      showToast('PeerJS não carregou');
      return;
    }
    parisReady = false;
    isParisHost = false;
    playerIsWhite = false;
    applyPlayerPerspective();
    try { if (conn) conn.close(); } catch(e) {}
    try { if (peer) peer.destroy(); } catch(e) {}
    peer = new Peer();
    var settled = false;
    peer.on('open', function(){
      setParisStatus('Entrando na Sala Paris…');
      conn = peer.connect(PARIS_ROOM_ID, { reliable:true });
      var joinTimer = setTimeout(function(){
        if (!parisReady && !settled) {
          settled = true;
          try { conn.close(); } catch(e) {}
          try { peer.destroy(); } catch(e) {}
          parisHost();
        }
      }, 1200);
      conn.on('open', function(){ settled = true; clearTimeout(joinTimer); });
      setupParisConn();
    });
    peer.on('error', function(){
      if (!settled) {
        settled = true;
        try { peer.destroy(); } catch(e) {}
        parisHost();
      }
    });
  }

  function openParisRoom() {
    const m = document.getElementById('paris-modal');
    if (m) m.classList.remove('hidden');
    setParisStatus('Sala Paris — só 2 jogadores. Abra a sala ou entre com o código Paris.');
    setParisSlots(0);
    // Já deixa o campo com Paris
    var inp = document.getElementById('paris-code-input');
    if (inp && !inp.value) inp.value = 'Paris';
  }

  function setParisStatus(msg) {
    const st = document.getElementById('paris-status');
    if (st) st.textContent = msg;
  }

  function bindParisUI() {
    const close = document.getElementById('btn-close-paris');
    if (close) close.onclick = () => document.getElementById('paris-modal').classList.add('hidden');
    const host = document.getElementById('btn-paris-host');
    if (host) host.onclick = parisHost;
    const join = document.getElementById('btn-paris-join');
    if (join) join.onclick = parisJoin;
  }

  var PARIS_ROOM_ID = 'xadrezpro-paris';

  function parisHost() {
    if (typeof Peer === 'undefined') {
      setParisStatus('PeerJS não carregou. Verifique a internet.');
      return;
    }
    isParisHost = true;
    playerIsWhite = true;
    applyPlayerPerspective();
    var pm = document.getElementById('paris-modal'); if (pm) pm.classList.add('hidden');
    setParisStatus('Abrindo sala Paris…');
    try { if (peer) peer.destroy(); } catch (e) {}
    // ID fixo: o código da sala é sempre "Paris"
    peer = new Peer(PARIS_ROOM_ID);
    peer.on('open', function () {
      var disp = document.getElementById('paris-code-display');
      if (disp) disp.textContent = 'PARIS';
      setParisStatus('Sala Paris pronta! Aguardando o 2º jogador digitar: Paris');
      setParisSlots(1);
      novaPartida();
    });
    peer.on('connection', function (c) {
      // Apenas 2 jogadores: se já tem conexão, rejeita o 3º
      if (conn && conn.open) {
        try { c.close(); } catch (e) {}
        setParisStatus('Sala cheia (2/2). Só dois jogadores.');
        return;
      }
      conn = c;
      setupParisConn();
    });
    peer.on('error', function (err) {
      if (err && (err.type === 'unavailable-id' || String(err).indexOf('taken') >= 0 || String(err).indexOf('ID') >= 0)) {
        setParisStatus('Sala Paris já está ocupada. Entre como visitante digitando Paris.');
      } else {
        setParisStatus('Erro: ' + (err.type || err.message || err));
      }
    });
  }

  function parisJoin() {
    if (typeof Peer === 'undefined') {
      setParisStatus('PeerJS não carregou. Verifique a internet.');
      return;
    }
    var raw = (document.getElementById('paris-code-input').value || '').trim().toLowerCase();
    // Aceita "paris", "PARIS", "Paris"
    if (!raw) {
      setParisStatus('Digite: Paris');
      return;
    }
    if (raw !== 'paris' && raw !== PARIS_ROOM_ID) {
      setParisStatus('Código inválido. Digite apenas: Paris');
      return;
    }
    isParisHost = false;
    playerIsWhite = false;
    applyPlayerPerspective();
    setParisStatus('Entrando na sala Paris…');
    try { if (peer) peer.destroy(); } catch (e) {}
    peer = new Peer(); // ID aleatório no cliente
    peer.on('open', function () {
      conn = peer.connect(PARIS_ROOM_ID, { reliable: true });
      setupParisConn();
    });
    peer.on('error', function (err) {
      setParisStatus('Erro: ' + (err.type || err.message || err));
    });
  }

  function setupParisConn() {
    if (!conn) return;
    conn.on('open', function () {
      parisReady = true;
      setParisSlots(2);
      setParisStatus('2 / 2 conectados! ' + (isParisHost ? 'Você: brancas.' : 'Você: pretas.'));
      document.getElementById('name-white').textContent = isParisHost ? 'VOCÊ' : 'PARIS';
      document.getElementById('name-black').textContent = isParisHost ? 'PARIS' : 'VOCÊ';
      setTimeout(function () {
        document.getElementById('paris-modal').classList.add('hidden');
      }, 900);
      if (isParisHost) {
        conn.send({ type: 'sync', fen: chess.fen(), theme: 'paris' });
      }
      novaPartida();
    });
    conn.on('data', function (data) {
      if (!data || !data.type) return;
      if (data.type === 'move' && data.from && data.to) {
        if (animating) return;
        // Apply remote move
        const turnOk = (isParisHost && chess.turn() === 'b') || (!isParisHost && chess.turn() === 'w');
        if (!turnOk && chess.turn() === (isParisHost ? 'w' : 'b')) {
          // remote is the other side
        }
        try {
          if (!chess.get(data.from)) return;
          executarLance(data.from, data.to, data.promotion || 'q');
        } catch (e) {}
      }
      if (data.type === 'toasty') {
        showToasty(data.text || 'TOASTY!', false);
        return;
      }
      if (data.type === 'sync' && data.fen) {
        try {
          chess.load(data.fen);
          loadPosition();
          atualizarStatus();
        } catch (e) {}
      }
    });
    conn.on('close', function () {
      parisReady = false;
      setParisStatus('Conexão encerrada.');
    });
  }

  // Hook: send moves in paris mode
  const _executarLance = executarLance;
  // Note: we wrap afterMove instead to avoid recursion issues

  const _afterMoveOrig = afterMove;
  afterMove = function (move) {
    _afterMoveOrig(move);
    if (gameMode === 'paris' && conn && conn.open && move) {
      try {
        conn.send({ type: 'move', from: move.from, to: move.to, promotion: move.promotion || undefined });
      } catch (e) {}
    }
  };

  // Restrict local clicks to own color in paris
  const _onPointerUp = onPointerUp;
  // already checks gameMode !== local for AI; extend for paris

  bindParisUI();
  init();
})();





