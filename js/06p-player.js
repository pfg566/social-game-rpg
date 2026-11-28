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
         dodge:'Dodge_Forward',dodgeB:'Dodge_Backward',hit:'Hit_A',death:'Death_A',cheer:'Cheer'}}
};
function makePlayerChar(job){
  const D=P2[job], src=GL[D.model]; const root=THREE.SkeletonUtils.clone(src.scene);
  const mats=[], native=[]; let head=null, skel=null;
  root.traverse(o=>{ if (o.isMesh){ o.castShadow=true; o.receiveShadow=true; o.frustumCulled=false;
    o.material=toToon(o.material,.5,0xfff2dc); mats.push(o.material); native.push(o);
    if (/_Head$/.test(o.name)) head=o; if (!skel && o.isSkinnedMesh) skel=o.skeleton; } });
  skShare(root,skel);   // 조각들이 뼈대 하나를 같이 써요 (04-island.js)
  // 상점 차림(옷 · 모자 · 무기)은 10-shop.js의 dressP2가 입혀요. 원래 몸은 숨기고 머리만 남겨요
  const mixer=new THREE.AnimationMixer(root);
  return {root,mixer,mats,native,nativeHead:head,skel,host:head?head.parent:root,job,wardParts:[],anim:new Anim(mixer,GL.pclips.animations,D.map)};
}
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
function playerFor(job){ if (!PCH[job]){ const c=makePlayerChar(job); setupKnightLayers(c); PCH[job]=c; } return PCH[job]; }
function usePlayer(job){
  if (!WORLD_READY) return null;
  const c=playerFor(job);
  if (knight!==c){ if (knight) pg.remove(knight.root); pg.add(c.root); knight=c; c.anim.revive(); if (c.upper) c.upper.cur=null; }
  return c;
}
