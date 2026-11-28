/* 사회 게임 RPG · 주인공 캐릭터 (KayKit 2.0: 기사 · 레인저 궁수 · 마법사)
   파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
/* ---------- 직업마다 다른 모델 · 무기 · 동작 ---------- */
// 동작은 models/pclips.glb 하나에 모았어요 (예전 기사 동작 + 새 동작 팩의 활 · 마법 · 점프 내려찍기)
const P2={
  knight:{model:'p_knight',tex:'knight',
    map:{idle:'Idle',run:'Running_A',slashH:'1H_Melee_Attack_Slice_Horizontal',slashD:'1H_Melee_Attack_Slice_Diagonal',chop:'1H_Melee_Attack_Chop',
         dodge:'Dodge_Forward',dodgeB:'Dodge_Backward',hit:'Hit_A',death:'Death_A',cheer:'Cheer',block:'Block',blocking:'Blocking',blockAtk:'Block_Attack',
         stab:'Melee_1H_Attack_Jump_Chop',whirl:'2H_Melee_Attack_Spinning'}},
  archer:{model:'p_ranger',tex:'ranger',
    map:{idle:'Ranged_Bow_Idle',run:'Running_HoldingBow',shoot:'Ranged_Bow_Release',ult:'Ranged_Bow_Release_Up',
         dodge:'Dodge_Forward',dodgeB:'Dodge_Backward',hit:'Hit_A',death:'Death_A',cheer:'Cheer'}},
  mage:{model:'p_mage',tex:'mage',
    map:{idle:'Idle',run:'Running_A',cast:'Ranged_Magic_Shoot',castBig:'Ranged_Magic_Raise',ult:'Ranged_Magic_Summon',
         dodge:'Dodge_Forward',dodgeB:'Dodge_Backward',hit:'Hit_A',death:'Death_A',cheer:'Cheer'}},
  // 새 마법사 루미 (시험 · 선생님만): 몸 · 옷 · 머리 · 신발 · 허리띠 부품을 원래 루미 뼈대에 맞춰 붙인 모델 (Lumi2.glb · 동작은 원래 루미 것)
  //  own: 꾸미기(옷 갈아입기) 없음 · base: 싸우는 방법은 마법사 · h: 키(머리카락 꼭대기까지) · runRef: 빠르기 1일 때 발이 땅을 미는 빠르기
  //  구르기(dodge) · 만세(cheer) 동작은 없어요 → 순간이동은 원래 동작 없이 · 이기면 가만히 서 있어요
  lumi:{model:'p_lumi',own:true,base:'mage',h:2.15,runRef:2.4,runMax:2.3,
    map:{idle:'Staff_Idle',walk:'Staff_Walk',run:'Staff_Run',cast:'Staff_Cast',castBig:'Staff_Cast',ult:'Staff_Cast',hit:'Staff_Hit',death:'Staff_LieDown'}}
};
/* 다른 모델의 동작이 원래 마법사 동작보다 길거나 짧으면, 같은 시간에 끝나도록 빠르기를 맞춰요 (너무 빠르거나 느리지 않게 0.35~2.2배) */
function ownSpeeds(D,clips){ const M=P2[D.base||'mage'].map, out={};
  for (const k in D.map){ if (k==='idle'||k==='run'||k==='walk') continue; const a=clips.find(c=>c.name===D.map[k]), b=M[k]&&GL.pclips.animations.find(c=>c.name===M[k]);
    if (a&&b) out[k]=Math.max(.35,Math.min(2.2,a.duration/b.duration)); }
  return out; }
function makePlayerChar(job){
  const D=P2[job], src=GL[D.model]; let root=THREE.SkeletonUtils.clone(src.scene);
  if (D.own){ const bb=src.userData.bb||(src.userData.bb=new THREE.Box3().setFromObject(src.scene)), inner=root;   // 키를 맞추는 크기는 안쪽에 (로비 등에서 root 크기를 바꿔도 그대로)
    inner.scale.setScalar(D.h/Math.max(.01,bb.max.y-bb.min.y)); root=new THREE.Group(); root.add(inner); }
  const mats=[], native=[]; let head=null, skel=null;
  root.traverse(o=>{ if (o.isMesh){ o.castShadow=true; o.receiveShadow=true; o.frustumCulled=false;
    o.material=toToon(o.material,.5,0xfff2dc); mats.push(o.material); native.push(o);
    if (/_Head$/.test(o.name)) head=o; if (!skel && o.isSkinnedMesh) skel=o.skeleton; } });
  skShare(root,skel);   // 조각들이 뼈대 하나를 같이 써요 (04-island.js)
  // 상점 차림(옷 · 모자 · 무기)은 10-shop.js의 dressP2가 입혀요. 원래 몸은 숨기고 머리만 남겨요
  const mixer=new THREE.AnimationMixer(root), clips=D.own?src.animations:GL.pclips.animations;
  return {root,mixer,mats,native,nativeHead:head,skel,host:head?head.parent:root,job:D.base||job,pkey:job,own:!!D.own,clips,wardParts:[],
    anim:new Anim(mixer,clips,D.map,D.own?ownSpeeds(D,clips):null)};
}
/* 루미 모델은 선생님이 고를 때만 불러와요 (학생들은 내려받지 않아요) */
const LUMI={loading:false,err:false};
function lumiOn(){ return typeof lumiPicked==='function'&&lumiPicked()&&!(typeof SHOP!=='undefined'&&SHOP.open); }   // 상점에서는 꾸미기를 볼 수 있게 원래 마법사로
function lumiLoad(){ if (GL.p_lumi||LUMI.loading||LUMI.err) return; LUMI.loading=true; if (typeof renderJobPick==='function') renderJobPick();
  new THREE.GLTFLoader().load('models/p2/Lumi2.glb?v=20261128',g=>{ GL.p_lumi=g; LUMI.loading=false;
    if (typeof lobbyAddLumi==='function') lobbyAddLumi();
    if (typeof renderJobPick==='function') renderJobPick();
    if (WORLD_READY && W.state!=='play') applyLook(); },
    undefined,()=>{ LUMI.loading=false; LUMI.err=true; if (typeof renderJobPick==='function') renderJobPick(); }); }
function pkeyFor(job){ if (job==='mage'&&lumiOn()){ if (GL.p_lumi) return 'lumi'; lumiLoad(); } return job; }
/* ---------- 여럿이 하는 판의 친구 캐릭터: 진짜 그림자 대신 발밑 동그란 그림자 ----------
   진짜 그림자는 그림자 지도에 캐릭터를 한 번 더 그려요 (친구 20명이면 조각 150개를 더). 동그란 그림자는 판 하나라 거의 공짜예요. */
const BLOB={geo:null,mat:null};
function blobShadow(r){
  if (!BLOB.geo){ BLOB.geo=new THREE.CircleGeometry(1,28); BLOB.geo.rotateX(-Math.PI/2);
    const cv=document.createElement('canvas'); cv.width=cv.height=64; const g=cv.getContext('2d'), gr=g.createRadialGradient(32,32,0,32,32,32);
    // 화면은 밝기를 곡선으로 바꿔 보여 줘서(감마) 옅은 검정은 거의 안 보여요 → 진하게 칠하고 끝만 부드럽게
    gr.addColorStop(0,'rgba(0,0,0,.66)'); gr.addColorStop(.5,'rgba(0,0,0,.58)'); gr.addColorStop(.78,'rgba(0,0,0,.3)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64);
    BLOB.mat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,toneMapped:false}); }
  const m=new THREE.Mesh(BLOB.geo,BLOB.mat); m.scale.setScalar(r||.7); m.position.y=.03; m.renderOrder=1; m.castShadow=false; m.receiveShadow=false; m.userData.noFlash=true; return m;
}
function remoteLite(ch,g){
  ch.noShadow=true; ch.root.traverse(o=>{ if (o.isMesh) o.castShadow=false; });   // 옷을 입힌 뒤(dressP2)에도 그림자 없이 (10-shop.js)
  if (g&&!g.userData.blob){ const b=blobShadow(); g.add(b); g.userData.blob=b; }
}
/* 게임 속 주인공: 직업마다 하나씩 만들어 두고 고른 직업만 무대(pg)에 올려요 */
const PCH={};
function playerFor(job){ const k=pkeyFor(job); if (!PCH[k]){ const c=makePlayerChar(k); setupKnightLayers(c); PCH[k]=c; } return PCH[k]; }
function usePlayer(job){
  if (!WORLD_READY) return null;
  const c=playerFor(job);
  if (knight!==c){ if (knight) pg.remove(knight.root); pg.add(c.root); knight=c; c.anim.revive(); if (c.upper) c.upper.cur=null; }
  return c;
}
