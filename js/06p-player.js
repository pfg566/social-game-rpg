/* 사회 게임 RPG · 주인공 캐릭터 (KayKit 2.0: 기사 · 레인저 궁수 · 마법사)
   파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
/* ---------- 직업마다 다른 모델 · 무기 · 동작 ---------- */
// 동작은 models/pclips.glb 하나에 모았어요 (예전 기사 동작 + 새 동작 팩의 활 · 마법 · 점프 내려찍기)
const P2={
  knight:{model:'p_knight',tex:'knight',
    // 상점의 기본 무기 · 방패 이름(KBASE)에 맞춰 손에 미리 붙여 두고, 고른 것만 보여요
    items:[['1H_Sword','w_sword1','handslotr'],['2H_Sword','w_sword2','handslotr'],['1H_Sword_Offhand','w_sword1','handslotl'],
           ['Round_Shield','w_shround','handslotl'],['Badge_Shield','w_shbadge','handslotl'],['Rectangle_Shield','w_shsquare','handslotl'],['Spike_Shield','w_shspike','handslotl']],
    map:{idle:'Idle',run:'Running_A',slashH:'1H_Melee_Attack_Slice_Horizontal',slashD:'1H_Melee_Attack_Slice_Diagonal',chop:'1H_Melee_Attack_Chop',
         dodge:'Dodge_Forward',dodgeB:'Dodge_Backward',hit:'Hit_A',death:'Death_A',cheer:'Cheer',block:'Block',blocking:'Blocking',blockAtk:'Block_Attack',
         stab:'Melee_1H_Attack_Jump_Chop',whirl:'2H_Melee_Attack_Spinning'}},
  archer:{model:'p_ranger',tex:'ranger',
    items:[['Bow','w_bow','handslotl',Math.PI]],
    map:{idle:'Ranged_Bow_Idle',run:'Running_HoldingBow',shoot:'Ranged_Bow_Release',ult:'Ranged_Bow_Release_Up',
         dodge:'Dodge_Forward',dodgeB:'Dodge_Backward',hit:'Hit_A',death:'Death_A',cheer:'Cheer'}},
  mage:{model:'p_mage',tex:'mage',
    items:[['Staff','w_staff','handslotr']],
    map:{idle:'Idle',run:'Running_A',cast:'Ranged_Magic_Shoot',castBig:'Ranged_Magic_Raise',ult:'Ranged_Magic_Summon',
         dodge:'Dodge_Forward',dodgeB:'Dodge_Backward',hit:'Hit_A',death:'Death_A',cheer:'Cheer'}}
};
/* 색 바꾸기: 상점의 '색' 아이템. 세 직업 모두 같은 글자(A · B · C)의 색 옷으로 바뀌어요 */
const P2TEX={};
function p2Tex(job,suf){
  const key=P2[job].tex+suf; if (P2TEX[key]) return P2TEX[key];
  const t=new THREE.TextureLoader().load(`models/p2/tex/${P2[job].tex}_texture${suf}.png?v=1`);
  t.flipY=false; t.encoding=THREE.sRGBEncoding; t.anisotropy=4; P2TEX[key]=t; return t;
}
function setCharColor(ch,suf){
  if (!ch || ch.colorSuf===suf) return; ch.colorSuf=suf;
  const t=suf?p2Tex(ch.job,suf):ch.baseMap; ch.texMats.forEach(m=>{ m.map=t; m.needsUpdate=true; });
}
function colorSuf(L){ const it=CAT[(L||LOOK).color]; return (it&&it.alt)||''; }

function makePlayerChar(job){
  const D=P2[job], src=GL[D.model]; const root=THREE.SkeletonUtils.clone(src.scene);
  const mats=[], texMats=[]; let base=null;
  root.traverse(o=>{ if (o.isMesh){ o.castShadow=true; o.receiveShadow=true; o.frustumCulled=false;
    o.material=toToon(o.material,.5,0xfff2dc); mats.push(o.material); texMats.push(o.material); if (!base && o.material.map) base=o.material.map; } });
  for (const [name,key,bone,ry] of D.items){
    const b=root.getObjectByName(bone); if (!b || !GL[key]) continue;
    const w=GL[key].scene.clone(true); w.name=name; if (ry) w.rotation.y=ry;
    w.traverse(o=>{ if (o.isMesh){ o.castShadow=true; o.material=toonMat({map:base,rim:.4}); mats.push(o.material); texMats.push(o.material); } });
    b.add(w);
  }
  const mixer=new THREE.AnimationMixer(root);
  return {root,mixer,mats,texMats,baseMap:base,job,colorSuf:'',lookParts:[],anim:new Anim(mixer,GL.pclips.animations,D.map)};
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
