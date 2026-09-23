/* XADREZ PRO 3D v8 — asset catalog and atomic, on-demand loading. */
const XPAssets = (() => {
  const types={p:'pawn',r:'rook',n:'knight',b:'bishop',q:'queen',k:'king'};
  const sets={
    padrao:{name:'Padrão · model.glb',yaw:0},
    premium:{name:'Premium · A Beautiful Game',yaw:Math.PI},
    tournament:{name:'Torneio · Staunton',yaw:0},
    medieval:{name:'Medieval · cavaleiros',yaw:0},
    spiral:{name:'Espiral',yaw:-Math.PI/2},
    crystal:{name:'Cristal',yaw:-Math.PI/2},
    cyber:{name:'Cibernético',yaw:0},
    classico:{name:'Clássico leve',folder:'light',yaw:Math.PI}
  };
  const boards={voxel:{name:'Voxel · Board Games',url:'models/boards/voxel.glb',playSpan:7.44,squares:false},neon:{name:'Neon original'},madeira:{name:'Madeira',url:'models/boards/wood.glb',playSpan:9.92,squares:false},premium:{name:'Premium · A Beautiful Game',url:'models/boards/premium.glb',squares:true},minimal:{name:'Minimalista',url:'models/boards/minimal.glb',squares:true}};
  const cache=new Map();
  function glb(url){return new Promise((resolve,reject)=>new THREE.GLTFLoader().load(url,g=>resolve(g.scene),undefined,reject));}
  function normalized(source,type,square){
    source.updateMatrixWorld(true);
    const b=new THREE.Box3().setFromObject(source),size=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());
    if(!Number.isFinite(size.y)||size.y<=0)throw Error('Modelo sem geometria');
    const offset=new THREE.Group();offset.add(source);offset.position.set(-c.x,-b.min.y,-c.z);
    const root=new THREE.Group();root.add(offset);const heights={p:.86,r:1.04,n:1.15,b:1.25,q:1.40,k:1.52};
    const widths={p:.60,r:.70,n:.72,b:.66,q:.74,k:.76};
    // Uniform scale preserves each authored silhouette; footprint always fits its square.
    const scale=Math.min(square*widths[type]/Math.max(size.x,size.z),square*heights[type]/size.y);
    root.scale.setScalar(scale);root.userData.normalization={type,square,scale,width:Math.max(size.x,size.z)*scale,height:size.y*scale};return root;
  }
  async function loadSet(id,square=1.24){
    if(!sets[id])throw Error('Conjunto desconhecido');
    const key='set:'+id+':'+square;if(cache.has(key))return cache.get(key);
    const pending=(async()=>{
      const templates={};
      if(id==='padrao'){
        const scene=await glb('models/model.glb');scene.updateMatrixWorld(true);
        for(const [type,name] of Object.entries(types)){
          let source;scene.traverse(o=>{if(!source&&o.name.endsWith('-'+name))source=o;});
          if(!source)throw Error('Peça ausente: '+name);
          const clone=source.clone(true);clone.matrix.copy(source.matrixWorld);clone.matrix.decompose(clone.position,clone.quaternion,clone.scale);
          templates[type]=normalized(clone,type,square);
        }
      }else await Promise.all(Object.entries(types).map(async([type,name])=>{templates[type]=normalized(await glb('models/sets/'+(sets[id].folder||id)+'/'+name+'.glb'),type,square);}));
      return templates;
    })();cache.set(key,pending);try{return await pending;}catch(e){cache.delete(key);throw e;}
  }
  async function loadBoard(id,square=1.24){
    if(!boards[id])throw Error('Tabuleiro desconhecido');if(!boards[id].url)return null;
    const key='board:'+id;if(!cache.has(key))cache.set(key,glb(boards[id].url));
    try{
      const model=(await cache.get(key)).clone(true),span=boards[id].playSpan;
      if(span){const scale=square*8/span;model.scale.multiplyScalar(scale);model.position.y+=.035*(1-scale);}
      if(id==='voxel')model.rotation.y+=Math.PI/2;
      return model;
    }catch(e){cache.delete(key);throw e;}
  }
  return {sets,boards,loadSet,loadBoard};
})();
