/* XADREZ PRO 3D v7 â€” asset catalog and atomic, on-demand loading. */
const XPAssets = (() => {
  const types={p:'pawn',r:'rook',n:'knight',b:'bishop',q:'queen',k:'king'};
  const sets={
    padrao:{name:'PadrÃ£o Â· model.glb',yaw:0},
    premium:{name:'Premium Â· A Beautiful Game',yaw:Math.PI},
    tournament:{name:'Tournament Â· Staunton',yaw:0},
    medieval:{name:'Medieval Â· cavaleiros',yaw:0},
    spiral:{name:'Spiral',yaw:-Math.PI/2},
    crystal:{name:'Crystal',yaw:-Math.PI/2},
    cyber:{name:'Cyber Â· Sci-Fi',yaw:0},
    classico:{name:'ClÃ¡ssico leve',folder:'light',yaw:Math.PI}
  };
  const boards={voxel:{name:'Voxel Â· Board Games',url:'models/boards/voxel.glb',squares:false},neon:{name:'Neon original'},madeira:{name:'Wood Â· Chess',url:'models/boards/wood.glb',squares:false},premium:{name:'Premium Â· A Beautiful Game',url:'models/boards/premium.glb',squares:true},minimal:{name:'Minimal Â· ChessSet',url:'models/boards/minimal.glb',squares:true}};
  const cache=new Map();
  function glb(url){return new Promise((resolve,reject)=>new THREE.GLTFLoader().load(url,g=>resolve(g.scene),undefined,reject));}
  function normalized(source){
    source.updateMatrixWorld(true);
    const b=new THREE.Box3().setFromObject(source),size=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());
    if(!Number.isFinite(size.y)||size.y<=0)throw Error('Modelo sem geometria');
    const offset=new THREE.Group();offset.add(source);offset.position.set(-c.x,-b.min.y,-c.z);
    const root=new THREE.Group();root.add(offset);root.scale.setScalar(Math.min(.9/Math.max(size.x,size.z),1.65/size.y));return root;
  }
  async function loadSet(id){
    if(!sets[id])throw Error('Conjunto desconhecido');
    const key='set:'+id;if(cache.has(key))return cache.get(key);
    const pending=(async()=>{
      const templates={};
      if(id==='padrao'){
        const scene=await glb('models/model.glb');scene.updateMatrixWorld(true);
        for(const [type,name] of Object.entries(types)){
          let source;scene.traverse(o=>{if(!source&&o.name.endsWith('-'+name))source=o;});
          if(!source)throw Error('PeÃ§a ausente: '+name);
          const clone=source.clone(true);clone.matrix.copy(source.matrixWorld);clone.matrix.decompose(clone.position,clone.quaternion,clone.scale);
          templates[type]=normalized(clone);
        }
      }else await Promise.all(Object.entries(types).map(async([type,name])=>{templates[type]=normalized(await glb('models/sets/'+(sets[id].folder||id)+'/'+name+'.glb'));}));
      return templates;
    })();cache.set(key,pending);try{return await pending;}catch(e){cache.delete(key);throw e;}
  }
  async function loadBoard(id){
    if(!boards[id])throw Error('Tabuleiro desconhecido');if(!boards[id].url)return null;
    const key='board:'+id;if(!cache.has(key))cache.set(key,glb(boards[id].url));
    try{return (await cache.get(key)).clone(true);}catch(e){cache.delete(key);throw e;}
  }
  return {sets,boards,loadSet,loadBoard};
})();
