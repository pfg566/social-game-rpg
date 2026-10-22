/* 사회 게임 RPG · 상점 · 꾸미기
   파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
/* ---------- 상점 · 꾸미기 ---------- */
const SLOTS=['outfit','hat','cape','weapon','shield','color','trail'];
const SLOT_INFO={outfit:{label:'옷',icon:'👕'},hat:{label:'머리',icon:'⛑️'},cape:{label:'망토',icon:'🧣'},weapon:{label:'무기',icon:'⚔️'},shield:{label:'왼손',icon:'🛡️'},color:{label:'색',icon:'🎨'},trail:{label:'칼 궤적',icon:'✨'}};
const CATALOG=[
  {id:'knight_p0',slot:'outfit',name:'기사 갑옷',desc:'처음 받은 튼튼한 갑옷'},
  {id:'rogue_p800',slot:'outfit',name:'도적 옷',src:'rogue',parts:'Rogue',desc:'날렵한 가죽 옷'},
  {id:'barb_p800',slot:'outfit',name:'바바리안 전사복',src:'barb',parts:'Barbarian',desc:'북쪽 땅 전사의 옷'},
  {id:'mage_p1000',slot:'outfit',name:'마법사 로브',src:'mage',parts:'Mage',desc:'별무늬 마법사 로브'},
  {id:'hood_p1200',slot:'outfit',name:'후드 쓴 도적',src:'rogue',parts:'Rogue',head:'hood',desc:'후드를 쓰면 모자는 안 보여요'},
  {id:'khelm_p0',slot:'hat',name:'기사 투구',base:'Knight_Helmet'},
  {id:'nohat_p0',slot:'hat',name:'맨머리'},
  {id:'barbhat_p400',slot:'hat',name:'곰 털모자',src:'barb',mesh:'Barbarian_Hat'},
  {id:'magehat_p500',slot:'hat',name:'마법사 모자',src:'mage',mesh:'Mage_Hat'},
  {id:'kcape_p0',slot:'cape',name:'기사 망토',base:'Knight_Cape'},
  {id:'nocape_p0',slot:'cape',name:'망토 없음'},
  {id:'roguecape_p300',slot:'cape',name:'도적 망토',src:'rogue',mesh:'Rogue_Cape'},
  {id:'barbcape_p300',slot:'cape',name:'털 망토',src:'barb',mesh:'Barbarian_Cape'},
  {id:'magecape_p400',slot:'cape',name:'마법사 망토',src:'mage',mesh:'Mage_Cape'},
  {id:'sword_p0',slot:'weapon',name:'한손검',base:'1H_Sword'},
  {id:'mug_p150',slot:'weapon',name:'머그잔',src:'barb',mesh:'Mug',desc:'이걸로 싸울 수 있을까?'},
  {id:'knife_p200',slot:'weapon',name:'단검',src:'rogue',mesh:'Knife'},
  {id:'axe_p300',slot:'weapon',name:'한손 도끼',src:'barb',mesh:'1H_Axe'},
  {id:'wand_p400',slot:'weapon',name:'마법봉',src:'mage',mesh:'1H_Wand'},
  {id:'sword2_p500',slot:'weapon',name:'양손 대검',base:'2H_Sword'},
  {id:'axe2_p600',slot:'weapon',name:'양손 도끼',src:'barb',mesh:'2H_Axe'},
  {id:'staff_p600',slot:'weapon',name:'마법 지팡이',src:'mage',mesh:'2H_Staff'},
  {id:'rshield_p0',slot:'shield',name:'둥근 방패',base:'Round_Shield'},
  {id:'noshield_p0',slot:'shield',name:'빈손'},
  {id:'badge_p200',slot:'shield',name:'문장 방패',base:'Badge_Shield'},
  {id:'rect_p250',slot:'shield',name:'사각 방패',base:'Rectangle_Shield'},
  {id:'barbsh_p250',slot:'shield',name:'나무 방패',src:'barb',mesh:'Barbarian_Round_Shield'},
  {id:'knifeoff_p300',slot:'shield',name:'왼손 단검',src:'rogue',mesh:'Knife_Offhand'},
  {id:'spike_p400',slot:'shield',name:'가시 방패',base:'Spike_Shield'},
  {id:'swordoff_p450',slot:'shield',name:'쌍검',base:'1H_Sword_Offhand'},
  {id:'axeoff_p450',slot:'shield',name:'쌍도끼',src:'barb',mesh:'1H_Axe_Offhand'},
  {id:'book_p500',slot:'shield',name:'펼친 마법책',src:'mage',mesh:'Spellbook_open'},
  {id:'jarcher_p0',slot:'outfit',name:'궁수 옷',src:'rogue',parts:'Rogue',head:'hood',hidden:true},
  {id:'jmage_p0',slot:'outfit',name:'마법사 옷',src:'mage',parts:'Mage',hidden:true},
  {id:'jmhat_p0',slot:'hat',name:'마법사 모자',src:'mage',mesh:'Mage_Hat',hidden:true},
  {id:'jrcape_p0',slot:'cape',name:'궁수 망토',src:'rogue',mesh:'Rogue_Cape',hidden:true},
  {id:'jmcape_p0',slot:'cape',name:'마법사 망토',src:'mage',mesh:'Mage_Cape',hidden:true},
  {id:'jxbow_p0',slot:'weapon',name:'석궁',src:'rogue',mesh:'2H_Crossbow',hidden:true},
  {id:'jstaff_p0',slot:'weapon',name:'마법 지팡이',src:'mage',mesh:'2H_Staff',hidden:true},
  {id:'coldef_p0',slot:'color',name:'기본 색',desc:'기사 · 궁수 · 마법사의 처음 색'},
  {id:'cola_p300',slot:'color',name:'햇살 색',alt:'_alt_A',sw:'linear-gradient(90deg,#e6e9ee 33%,#e8c25a 33% 66%,#f08a3a 66%)',desc:'기사는 하얀 갑옷, 궁수는 노란 옷, 마법사는 주황 로브 (얼굴도 바뀌어요)'},
  {id:'colb_p400',slot:'color',name:'숲 색',alt:'_alt_B',sw:'linear-gradient(90deg,#d6c7ae 33%,#8fb33a 33% 66%,#a9b833 66%)',desc:'기사는 모래색 갑옷, 궁수는 초록 옷, 마법사는 연두 로브 (얼굴도 바뀌어요)'},
  {id:'colc_p500',slot:'color',name:'진홍 색',alt:'_alt_C',sw:'linear-gradient(90deg,#c8202e 33%,#d98a4a 33% 66%,#5a86b8 66%)',desc:'기사는 빨간 갑옷, 궁수는 갈색 옷, 마법사는 파란 로브 (얼굴도 바뀌어요)'},
  {id:'gold_p0',slot:'trail',name:'금빛 궤적',color:0xfff1c4},
  {id:'ice_p200',slot:'trail',name:'얼음 궤적',color:0x8fe3ff},
  {id:'leaf_p250',slot:'trail',name:'바람 궤적',color:0x9dff9a},
  {id:'fire_p300',slot:'trail',name:'불꽃 궤적',color:0xff8a3d},
  {id:'star_p400',slot:'trail',name:'별빛 궤적',color:0xd9a8ff},
  {id:'rainbow_p800',slot:'trail',name:'무지개 궤적',rainbow:true,desc:'휘두를 때마다 색이 바뀌어요'}
];
const CAT={}; CATALOG.forEach(it=>CAT[it.id]=it);
const priceOf=id=>{ const m=/_p(\d+)$/.exec(id||''); return m?+m[1]:0; };
const DEFAULT_LOOK={outfit:'knight_p0',hat:'khelm_p0',cape:'kcape_p0',weapon:'sword_p0',shield:'rshield_p0',color:'coldef_p0',trail:'gold_p0'};
const KBASE=['1H_Sword_Offhand','Badge_Shield','Rectangle_Shield','Round_Shield','Spike_Shield','1H_Sword','2H_Sword','Knight_Helmet','Knight_Cape'];
const KBODY=['ArmLeft','ArmRight','Body','Head','LegLeft','LegRight'];
const PARTS_FILES={barb:'models/parts_barbarian.glb',mage:'models/parts_mage.glb',rogue:'models/parts_rogue.glb?v=3',hood:'models/parts_rogueh.glb'};
const partsLoader=new THREE.GLTFLoader(), partsP={}, partToon=new WeakMap();
const loadParts=k=>partsP[k]||(partsP[k]=new Promise((res,rej)=>partsLoader.load(PARTS_FILES[k],res,undefined,e=>{ delete partsP[k]; rej(e); })));
let LOOK={...DEFAULT_LOOK}, lookToken=0, TRAIL=CAT.gold_p0, WARDROBE=null;
function lookOf(look){ const L={...DEFAULT_LOOK}; for (const s of SLOTS){ const id=look&&look[s]; if (CAT[id]&&CAT[id].slot===s) L[s]=id; } return L; }
function guestLook(){ let v={}; try{ v=JSON.parse(localStorage.getItem('gsd-look')||'{}'); }catch(e){} const L=lookOf(v); SLOTS.forEach(s=>{ if (priceOf(L[s])>0) L[s]=DEFAULT_LOOK[s]; }); return L; }
function equippedLook(){ return STUDENT&&WARDROBE ? lookOf(WARDROBE.equip) : guestLook(); }
function owns(id){ return priceOf(id)===0 || !!(WARDROBE&&WARDROBE.inv&&WARDROBE.inv[id]); }
function availCoins(){ return PROFILE ? Math.max(0,(PROFILE.coins|0)-((WARDROBE&&WARDROBE.spent)|0)) : 0; }
function partMat(m,rim){ let t=partToon.get(m); if (!t){ t=toToon(m,rim,0xfff2dc); partToon.set(m,t); } return t; }
async function loadLookParts(L){
  const need=new Set(); SLOTS.forEach(s=>{ const it=CAT[L[s]]; if (it.src) need.add(it.src); if (it.head) need.add(it.head); });
  const G={}; await Promise.all([...need].map(async f=>{ G[f]=await loadParts(f); })); return G;
}
function dressChar(ch,L,G){
  const root=ch.root; ch.lookParts=ch.lookParts||[];
  (ch.lookParts||[]).forEach(o=>{ if (o.parent) o.parent.remove(o); o.traverse(x=>{ if (x.isMesh){ const i=ch.mats.indexOf(x.material); if (i>=0) ch.mats.splice(i,1); } }); });
  ch.lookParts=[];
  const show=(n,v)=>{ const o=root.getObjectByName(n); if (o) o.visible=v; };
  KBASE.forEach(n=>show(n,false));
  const o=CAT[L.outfit];
  KBODY.forEach(p=>show('Knight_'+p,!o.src));
  if (o.src){
    let skel=null; root.traverse(x=>{ if (!skel && x.isSkinnedMesh) skel=x.skeleton; });
    const holder=root.getObjectByName('Knight_Body').parent;
    for (const p of KBODY){
      const hood=p==='Head'&&o.head, src=(hood?G[o.head]:G[o.src]).scene.getObjectByName(hood?'Rogue_Head_Hooded':o.parts+'_'+p);
      if (!src) continue;
      src.traverse(x=>{ if (!x.isSkinnedMesh) return;
        const m=x.clone(); m.bind(skel,x.bindMatrix); m.material=partMat(x.material,.5); m.frustumCulled=false; m.castShadow=true; m.receiveShadow=true;
        holder.add(m); ch.lookParts.push(m); ch.mats.push(m.material); });
    }
  }
  for (const slot of ['hat','cape','weapon','shield']){
    const it=CAT[L[slot]];
    if (slot==='hat' && o.head) continue;
    if (it.base) show(it.base,true);
    else if (it.mesh){ const src=G[it.src].scene.getObjectByName(it.mesh); if (!src||!src.parent) continue;
      const bone=root.getObjectByName(src.parent.name); if (!bone) continue;
      const m=src.clone(true); m.traverse(x=>{ if (x.isMesh){ x.material=partMat(x.material,.4); x.castShadow=true; ch.mats.push(x.material); } });
      bone.add(m); ch.lookParts.push(m); }
  }
  // 2.0 기사 투구는 얼굴 가리개가 따로 있어요: 투구와 함께 보이고 숨어요
  const hv=root.getObjectByName('Knight_HelmetVisor'), hm=root.getObjectByName('Knight_Helmet'); if (hv) hv.visible=!!(hm&&hm.visible);
}
async function applyLook(look){
  const L=lookOf(look); LOOK=L; TRAIL=CAT[L.trail]; const t=++lookToken;
  if (!WORLD_READY) return;
  usePlayer(SHOP.open?'knight':JOB);
  const suf=colorSuf(L); for (const j in PCH) setCharColor(PCH[j],suf); for (const j in LOBBY.chars) setCharColor(LOBBY.chars[j],suf);
  let G;
  try{ G=await loadLookParts(L); }
  catch(e){ if (t===lookToken && !$('#shop').hidden) shopMsg('꾸미기 파일을 불러오지 못했어요. 인터넷을 확인해 주세요.','err'); return; }
  if (t!==lookToken) return;
  dressChar(playerFor('knight'),L,G);
  if (!SHOP.open) dressLobby();
}
function trailColor(type){
  const t=TRAIL||CAT.gold_p0;
  if (t.rainbow) return new THREE.Color().setHSL((performance.now()/700)%1,.9,.62).getHex();
  if (t.id==='gold_p0') return SLASH_TYPES[type].color;
  return t.color;
}
function wardRef(){ return fbDb.ref(`wardrobe/${STUDENT.cid}/${STUDENT.num}`); }
async function loadWardrobe(){
  if (!STUDENT||!fbDb){ WARDROBE=null; applyLook(jobLook()); return; }
  try{ const v=(await withTimeout(wardRef().once('value'),10000)).val()||{}; WARDROBE={inv:v.inv||{},spent:+v.spent||0,equip:v.equip||{}}; }
  catch(e){ WARDROBE={inv:{},spent:0,equip:{},err:true}; }
  applyLook(jobLook());
  if (AUTHMODE==='student'&&PROFILE) renderProfileCard();
  if (!$('#shop').hidden) renderShop();
}

/* 상점 화면 */
const SHOP={open:false,tab:'outfit',sel:null,armed:false,rot:0,try:null,busy:false,drag:null};
function shopMsg(t,kind){ const e=$('#shopMsg'); e.textContent=t||''; e.className='ed-status'+(kind?' '+kind:''); }
function openShop(){
  if (!assetsReady) return;
  SHOP.open=true; SHOP.tab='outfit'; SHOP.try={...equippedLook()}; SHOP.sel=SHOP.try.outfit; SHOP.armed=false; SHOP.rot=0;
  clearWorld(); const st=MAPS[MAPK].start; P.x=st[0]; P.z=st[1];
  if (knight && knight.anim.dead){ knight.anim.revive(); } endPose=false;
  applyLook(SHOP.try);
  $('#title').hidden=true; $('#shop').hidden=false; shopMsg(''); renderShop();
}
function closeShop(){ SHOP.open=false; $('#shop').hidden=true; $('#title').hidden=false; applyLook(jobLook()); dressLobby(); if (AUTHMODE==='student'&&PROFILE) renderProfileCard(); }
function renderShop(){
  const coins=availCoins();
  $('#shopCoins').textContent=STUDENT&&PROFILE?coins.toLocaleString('ko-KR'):'-';
  $('#shopNote').textContent=STUDENT&&PROFILE?'게임을 하면 코인이 쌓여요. 사기 전에 눌러서 미리 입어 볼 수 있어요.':'연습 모드에서는 기본 아이템만 쓸 수 있어요. 코드로 로그인하면 코인으로 살 수 있어요.';
  $('#shopTabs').innerHTML=SLOTS.map(s=>`<button class="tab" data-stab="${s}" aria-selected="${s===SHOP.tab}">${SLOT_INFO[s].icon} ${SLOT_INFO[s].label}</button>`).join('');
  const eq=equippedLook();
  $('#shopGrid').innerHTML=CATALOG.filter(it=>it.slot===SHOP.tab&&!it.hidden).map(it=>{
    const pr=priceOf(it.id), own=owns(it.id), on=eq[it.slot]===it.id;
    const st=on?'착용 중':own?(pr?'보유':'기본'):`${pr.toLocaleString('ko-KR')} 코인`;
    const sw=it.sw?`<span class="sw" style="background:${it.sw}"></span>`:it.slot==='trail'?`<span class="sw" style="background:${it.rainbow?'linear-gradient(90deg,#ff6b6b,#ffd34d,#7be38a,#5cc8f0,#b38cff)':'#'+it.color.toString(16).padStart(6,'0')}"></span>`:'';
    return `<button class="item${it.id===SHOP.sel?' sel':''}${on?' on':''}${own?' own':''}" data-item="${it.id}">${sw}<b>${esc(it.name)}</b><span class="pr">${st}</span></button>`; }).join('');
  const it=CAT[SHOP.sel], btn=$('#shopBuy');
  if (!it || it.slot!==SHOP.tab){ $('#shopSel').innerHTML='<small>아이템을 눌러 미리 입어 보세요.</small>'; btn.hidden=true; return; }
  btn.hidden=false;
  const pr=priceOf(it.id), own=owns(it.id), on=eq[it.slot]===it.id;
  $('#shopSel').innerHTML=`<b>${esc(it.name)}</b><small>${esc(it.desc||(pr?pr.toLocaleString('ko-KR')+' 코인':'기본 아이템'))}</small>`;
  btn.disabled=SHOP.busy; btn.classList.remove('warn');
  if (on){ btn.textContent='착용 중'; btn.disabled=true; }
  else if (own) btn.textContent='착용하기';
  else if (!STUDENT||!PROFILE){ btn.textContent='로그인하면 살 수 있어요'; btn.disabled=true; }
  else if (coins<pr){ btn.textContent=`코인이 ${(pr-coins).toLocaleString('ko-KR')} 부족해요`; btn.disabled=true; }
  else if (SHOP.armed){ btn.textContent=`정말 살까요? 한 번 더 누르세요 (${pr.toLocaleString('ko-KR')} 코인)`; btn.classList.add('warn'); }
  else btn.textContent=`사기 · ${pr.toLocaleString('ko-KR')} 코인`;
}
async function shopAction(){
  const it=CAT[SHOP.sel]; if (!it||SHOP.busy) return;
  const pr=priceOf(it.id), own=owns(it.id);
  if (own){
    SHOP.busy=true; renderShop();
    try{
      if (STUDENT&&WARDROBE){ await withTimeout(wardRef().child('equip/'+it.slot).set(it.id),10000); WARDROBE.equip[it.slot]=it.id; }
      else { const g=guestLook(); g[it.slot]=it.id; try{ localStorage.setItem('gsd-look',JSON.stringify(g)); }catch(e){} }
      shopMsg(`${it.name}을(를) 착용했어요.`,'ok'); if (knight) knight.anim.once('cheer',1.3,true); SFX.card();
    }catch(e){ shopMsg('저장하지 못했어요. 잠시 뒤 다시 해 주세요.','err'); }
    SHOP.busy=false; renderShop(); return;
  }
  if (!STUDENT||!PROFILE||availCoins()<pr) return;
  if (!SHOP.armed){ SHOP.armed=true; renderShop(); return; }
  SHOP.armed=false; SHOP.busy=true; renderShop();
  const sp=((WARDROBE&&WARDROBE.spent)|0)+pr;
  try{
    await withTimeout(wardRef().update({['inv/'+it.id]:true,spent:sp,['equip/'+it.slot]:it.id}),10000);
    WARDROBE.inv[it.id]=true; WARDROBE.spent=sp; WARDROBE.equip[it.slot]=it.id;
    shopMsg(`${it.name}을(를) 샀어요! 바로 착용했어요.`,'ok'); SFX.correct(); fx.rise(P.x,P.z,0xffd34d,30); if (knight) knight.anim.once('cheer',1.2,true);
  }catch(e){ shopMsg(/permission|PERMISSION/i.test(String(e&&(e.code||e.message)))?'살 수 없었어요. 선생님께 보안 규칙이 최신인지 알려 주세요.':'사지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.','err'); }
  SHOP.busy=false; renderShop();
}
$('#shopBtn').addEventListener('click',openShop);
$('#shopClose').addEventListener('click',closeShop);
$('#shopTabs').addEventListener('click',e=>{ const b=e.target.closest('[data-stab]'); if (!b) return; SHOP.tab=b.dataset.stab; SHOP.sel=SHOP.try[SHOP.tab]; SHOP.armed=false; renderShop(); });
$('#shopGrid').addEventListener('click',e=>{ const b=e.target.closest('[data-item]'); if (!b) return; const it=CAT[b.dataset.item];
  SHOP.sel=it.id; SHOP.armed=false; SHOP.try[it.slot]=it.id; applyLook(SHOP.try); shopMsg('');
  if (it.slot==='trail'){ const keep=LOOK; setTimeout(()=>{ if (SHOP.open) slashFx(0); },60); }
  else if (knight) knight.anim.once('cheer',1.6,true);
  renderShop(); });
$('#shopBuy').addEventListener('click',shopAction);
$('#shop').addEventListener('pointerdown',e=>{ if (e.target.closest('.shop-panel')) return; SHOP.drag={x:e.clientX,r:SHOP.rot}; });
addEventListener('pointermove',e=>{ if (SHOP.drag) SHOP.rot=SHOP.drag.r+(e.clientX-SHOP.drag.x)*.012; });
addEventListener('pointerup',()=>{ SHOP.drag=null; });
addEventListener('keydown',e=>{ if (SHOP.open && e.key==='Escape') closeShop(); });
function shopCamera(real){
  if (!SHOP.open) return false;
  const narrow=innerWidth<760;
  if (narrow){ camera.position.set(P.x,2.5,P.z+6.2); camera.lookAt(P.x,.35,P.z); }
  else { camera.position.set(P.x+1.5,2.3,P.z+5.6); camera.lookAt(P.x+1.5,1.15,P.z); }
  pg.rotation.y=SHOP.rot+(SHOP.drag?0:Math.sin(real*.6)*.35);
  return true;
}

