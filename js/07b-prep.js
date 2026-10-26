/* 사회 게임 RPG · 정비 시간(웨이브 사이 퀴즈 → 강화 카드) · 보스 기믹(수정에서 힘 끌어오기)
   싸우는 도중에 갑자기 퀴즈가 뜨지 않아요. 평화 모드와 파티 모드는 예전 방식 그대로예요. */
const NEWQ=()=>!PEACE_RUN && !PARTY.on;
const PREP_N=3, BG_GAP=5, BG_FIRST=4, BOSS_SHIELD_NEW=3, GROGGY=5, GROGGY_DMG=1.5;
const bgTime=()=>MODE==='hero'?16:20;
const timedEvery=()=>NEWQ()?TIMED_NEW:TIMED_EVERY;   // 돌발 퀴즈 간격: 새 방식 50초, 평화 모드 30초

/* ---------- 강화 카드 (이번 판 끝까지 이어져요) ---------- */
const UPCARDS=[
 {k:'atk',   icon:'⚔️', name:'공격력 +20%',    desc:'이번 판 내내 더 세게 때려요', go(){ W.up.atk*=1.2; }},
 {k:'spd',   icon:'👟', name:'이동 속도 +12%', desc:'이번 판 내내 더 빨리 달려요', go(){ W.up.spd*=1.12; }},
 {k:'hp',    icon:'❤️', name:'최대 체력 +20',  desc:'최대 체력이 늘고 체력이 가득 차요', go(){ P.max+=20; P.hp=P.max; }},
 {k:'heal',  icon:'🧪', name:'체력 모두 회복', desc:'체력이 가득 차요', ok:()=>P.hp<P.max*.85, go(){ P.hp=P.max; }},
 {k:'shield',icon:'🛡️', name:'방어막 +40',     desc:'다음에 받는 피해 40을 막아 줘요', go(){ W.qshield=Math.min(100,(W.qshield||0)+40); }},
 {k:'ult',   icon:'✨', name:'필살기 한 칸',   desc:'필살기 게이지를 한 칸 채워요', ok:()=>(W.ult||0)<ULT_NEED, go(){ W.ult=Math.min(ULT_NEED,(W.ult||0)+1); }},
 {k:'turret',icon:'🏹', name:'포탑 모두 가동', desc:'다음 웨이브가 시작되면 포탑 3개가 25초 동안 자동으로 쏴요', map:'defense', ok:()=>!W.up.turret, go(){ W.up.turret=25; }},
 {k:'door',  icon:'🏰', name:'성문 수리 +30%', desc:'부서진 성문을 고쳐요', map:'defense', ok:()=>W.door<W.doorMax*.9, go(){ W.door=Math.min(W.doorMax,W.door+Math.round(W.doorMax*.3)); }},
];
let PREP_CARDS=[];
function drawCards(){
  const pool=UPCARDS.filter(c=>(!c.map||c.map===MAPK)&&(!c.ok||c.ok())).sort(()=>Math.random()-.5);
  const out=[]; const mapC=pool.find(c=>c.map); if (mapC) out.push(mapC);
  for (const c of pool){ if (out.length>=3) break; if (!out.includes(c)) out.push(c); }
  return out.sort(()=>Math.random()-.5);
}

/* ---------- 정비 시간 ---------- */
function startPrep(){
  W.gate=true; W.prep={step:0,n:PREP_N,got:[],seen:[]};
  W.paused=true; for (const k in keys) keys[k]=false;
  prepShow('intro');
}
function prepShow(kind){
  const p=W.prep; if (!p) return;
  const el=$('#prep'); el.hidden=false; el.dataset.kind=kind; blurAll(); UI_LOCK=performance.now()+QUIZ_LOCK_MS;
  $('#prepSteps').innerHTML=Array.from({length:p.n},(_,i)=>`<i class="${i<p.step?'done':i===p.step&&kind!=='done'?'now':''}"></i>`).join('');
  const go=$('#prepGo'), cards=$('#prepCards'), q=$('#prepQ'), note=$('#prepNote');
  cards.hidden=true; go.hidden=false; q.hidden=false;
  if (kind==='intro'){
    $('#prepTitle').textContent='정비 시간!';
    q.textContent=`웨이브 ${W.wave+2} 전에 숨 돌리기. 문제 ${p.n}개를 풀어요.`;
    note.textContent=(MAPK==='zones'&&LOC.length?'첫 문제는 위치 퀴즈예요. 몬스터가 없으니 천천히 달려가요. ':'')+'맞힐 때마다 강화 카드를 하나 골라요. 강화는 이번 판 끝까지 이어져요.';
    go.textContent='정비 시작 (Enter)';
  } else if (kind==='pick'){
    PREP_CARDS=drawCards();
    $('#prepTitle').textContent='정답! 강화 카드를 골라요';
    q.hidden=true; go.hidden=true; cards.hidden=false;
    cards.innerHTML=PREP_CARDS.map((c,i)=>`<button class="upcard" data-up="${i}"><span class="n">${i+1}</span><span class="ic">${c.icon}</span><b>${c.name}</b><small>${c.desc}</small></button>`).join('');
    note.textContent='숫자 키 1·2·3 또는 클릭으로 골라요';
  } else {
    PREP_CARDS=[];
    $('#prepTitle').textContent='정비 끝!';
    q.textContent=p.got.length?`이번 정비에서 얻은 강화: ${p.got.join(' · ')}`:'이번 정비에서는 강화를 얻지 못했어요. 틀린 문제는 나중에 다시 나와요.';
    note.textContent=(W.up.list.length?`지금까지의 강화: ${W.up.list.join(' · ')} · `:'')+'이제 '+MAPS[MAPK].gateText.replace(/^잠김 · /,'');
    go.textContent='정비 완료 (Enter)';
  }
}
function prepNext(){
  const p=W.prep; if (!p) return;
  $('#prep').hidden=true;
  if (p.step>=p.n){ prepShow('done'); return; }
  if (MAPK==='zones' && p.step===0 && LOC.length){ startLoc(); if (W.loc) return; }
  const fresh=it=>!p.seen.includes(it);
  let item=pick(['mc'],MC,fresh); if (!item) item=pick(['ox'],OX,fresh);
  if (item) p.seen.push(item);
  if (!item){ p.step=p.n; prepShow('done'); return; }
  openQuiz(item,{type:'prep'});
}
function prepAfter(ok){
  const p=W.prep; if (!p) return; p.step++;
  if (ok) prepShow('pick'); else prepNext();
}
function prepChoose(i){
  const c=PREP_CARDS[i], p=W.prep; if (!c||!p||performance.now()<UI_LOCK) return;
  c.go(); p.got.push(c.name); W.up.list.push(c.name); SFX.correct();
  fx.rise(P.x,P.z,0xffd34d,20);
  prepNext();
}
function prepFinish(){
  if (!W.prep) return;
  $('#prep').hidden=true; W.prep=null; W.gate=true; stations.forEach(s=>s.readyAt=W.t); W.paused=false;
  showBanner(MAPS[MAPK].clearText.replace(/^웨이브 클리어! /,''));
  canvas.focus({preventScroll:true});
}
$('#prepGo').addEventListener('click',()=>{ if (performance.now()<UI_LOCK) return; const k=$('#prep').dataset.kind; if (k==='intro') prepNext(); else if (k==='done') prepFinish(); });
$('#prepCards').addEventListener('click',e=>{ const b=e.target.closest('[data-up]'); if (b) prepChoose(+b.dataset.up); });
addEventListener('keydown',e=>{
  if ($('#prep').hidden) return;
  e.stopPropagation();
  if (e.target.closest && e.target.closest('input,textarea,select')) return;
  const m=/^(Digit|Numpad)([1-3])$/.exec(e.code);
  if (m){ e.preventDefault(); prepChoose(+m[2]-1); return; }
  if (e.key==='Enter'||e.code==='Space'){ e.preventDefault(); if (!$('#prepGo').hidden) $('#prepGo').click(); }
},true);

/* 지식 카드(몬스터가 떨어뜨림): 맞히면 버프 대신 코인 뽑기 · 꽝 45% · 조금 50% · 대박 5% */
const CARD_COIN={miss:.45,big:.05,small:[3,6],bigN:40};
function cardCoinRoll(){
  const r=Math.random();
  if (r<CARD_COIN.big) return {n:CARD_COIN.bigN,big:true};
  if (r<CARD_COIN.big+CARD_COIN.miss) return {n:0};
  const [a,b]=CARD_COIN.small; return {n:a+Math.floor(Math.random()*(b-a+1))};
}
function cardFx(ok){
  if (!ok) return null;
  const c=cardCoinRoll(); W.cardCoins=(W.cardCoins||0)+c.n;
  if (c.big){ SFX.wave(); fx.rise(P.x,P.z,0xffd34d,50); setTimeout(()=>showBanner(`🎉 대박! 코인 +${c.n}`),300); }
  return {label:c.big?`🎉 대박! 코인 +${c.n}`:c.n?`코인 +${c.n}`:'꽝! 이번엔 코인이 없어요', coin:c.n};
}
/* 정비 퀴즈는 버프·너프 대신 강화 카드를 줘요 */
function prepFx(ok){ return {label: ok?'강화 카드를 하나 골라요!':'이번엔 강화 카드가 없어요'}; }

/* ---------- 보스 기믹: 보스가 수정 하나에서 보라색 빛줄기로 힘을 끌어와요 ---------- */
let bgBeam=null, bgArrow=null;
function bgArrowMesh(){
  if (!bgArrow){ bgArrow=new THREE.Group();
    const sh=new THREE.Shape(); sh.moveTo(0,.95); sh.lineTo(.5,.25); sh.lineTo(.2,.25); sh.lineTo(.2,-.4); sh.lineTo(-.2,-.4); sh.lineTo(-.2,.25); sh.lineTo(-.5,.25); sh.lineTo(0,.95);
    const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:0xc06bff,side:THREE.DoubleSide,depthWrite:false,transparent:true,opacity:.95}));
    m.rotation.x=-Math.PI/2; m.position.z=2.6; bgArrow.add(m);
    const o=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:0x18213a,side:THREE.DoubleSide,depthWrite:false}));
    o.rotation.x=-Math.PI/2; o.position.set(0,-.01,2.6); o.scale.setScalar(1.22); bgArrow.add(o);
    bgArrow.visible=false; scene.add(bgArrow); }
  return bgArrow;
}
function bgBeamMesh(){
  if (!bgBeam){ const g=new THREE.CylinderGeometry(.32,.32,1,10,1,true); g.translate(0,.5,0); g.rotateX(Math.PI/2);
    bgBeam=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xd08bff,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending})); bgBeam.visible=false; bgBeam.renderOrder=3; scene.add(bgBeam); }
  return bgBeam;
}
function bgReset(){ W.bg={st:null,next:0,until:0,last:null}; if (bgBeam) bgBeam.visible=false; if (bgArrow) bgArrow.visible=false; }
function bgBossSpawned(b){
  if (!NEWQ() || !b) return;
  b.shield=b.shieldMax=BOSS_SHIELD_NEW;
  W.bg={st:null,next:W.t+BG_FIRST,until:0,last:null};
}
function bgStart(){
  const cand=stations.filter(s=>s!==W.bg.last); const s=cand[Math.floor(Math.random()*cand.length)]||stations[0]; if (!s) return;
  W.bg.st=s; W.bg.last=s; W.bg.until=W.t+bgTime(); s.readyAt=W.t;
  SFX.wave(); flashPrompt('보스가 보라색 수정에서 힘을 끌어와요! 수정으로 달려가 퀴즈로 끊으세요',3);
}
function bgEnd(gap){ const s=W.bg.st; W.bg.st=null; W.bg.next=W.t+(gap==null?BG_GAP:gap); if (s && MAPK!=='defense') s.readyAt=Infinity; }
function bgTick(){
  if (!NEWQ() || !W.bg) return;
  const b=W.bg, boss=liveBoss();
  if (!boss){ if (b.st) bgEnd(); return; }
  if (!b.st){ if (W.t>=b.next) bgStart(); return; }
  if (W.t>=b.until){
    if (boss.shield<boss.shieldMax) boss.shield++;
    boss.hp=Math.min(boss.max,boss.hp+Math.round(boss.max*.06));
    fx.shock(boss.x,boss.z,5); fx.burst(boss.x,2.6,boss.z,0xc06bff,30,7); shake=.3; SFX.shield();
    flashPrompt('늦었어요! 보스가 수정의 힘을 흡수했어요 · 보호막 +1 · 체력 회복',2.6);
    bgEnd();
  }
}
function bgVisual(real){
  const m=bgBeamMesh(), ar=bgArrowMesh(), b=W.bg, boss=liveBoss();
  const on=W.state==='play' && b && b.st && boss;
  m.visible=!!on; ar.visible=false; if (!on) return;
  { const s=b.st, dx=s.g.position.x-P.x, dz=s.g.position.z-P.z; if (Math.hypot(dx,dz)>3.5){ ar.visible=true; ar.position.set(P.x,.15,P.z); ar.rotation.y=Math.atan2(dx,dz); const k=1+Math.sin(real*6)*.12; ar.children[0].scale.setScalar(k); ar.children[1].scale.setScalar(1.22*k); } }
  const s=b.st, a=new THREE.Vector3(s.g.position.x,2.8,s.g.position.z), t=new THREE.Vector3(boss.x,2.4,boss.z);
  m.position.copy(a); m.lookAt(t); const d=a.distanceTo(t); const w=1+Math.sin(real*14)*.35; m.scale.set(w,w,d);
  m.material.opacity=.45+Math.sin(real*9)*.2+(b.until-W.t<5?.25:0);
}
/* 정비 중이거나 새 방식에서 쓰지 않는 수정은 꺼 둬요 (성벽 디펜스의 포탑 수정은 그대로) */
function stationOn(s){
  if (W.prep) return false;
  if (!NEWQ() || MAPK==='defense' || W.gate) return true;
  return !!(W.bg && W.bg.st===s);
}
/* 보스 수정 퀴즈 결과 */
function bgSettle(ok,extras){
  const boss=liveBoss(); const st=W.bg.st;
  if (!boss){ bgEnd(); return; }
  if (ok){
    if (boss.shield>0){ boss.shield--; W.lastShield=boss; extras.push(boss.shield>0?`힘을 끊었어요! 보스 보호막 파괴 · 남은 보호막 ${boss.shield}개`:'힘을 끊었어요! 보호막이 모두 깨졌어요'); }
    else extras.push('힘을 끊었어요!');
    boss.stun=GROGGY; boss.groggy=W.t+GROGGY; boss.slamT=0;
    extras.push(`보스가 ${GROGGY}초 동안 휘청여요 · 이때 공격하면 피해 ${GROGGY_DMG}배!`);
    bgEnd();
  } else {
    const cand=stations.filter(s=>s!==st); const ns=cand[Math.floor(Math.random()*cand.length)];
    if (ns){ W.bg.st=ns; W.bg.last=ns; ns.readyAt=W.t; W.bg.until=Math.max(W.bg.until,W.t+8); extras.push('보스가 다른 수정으로 옮겨 갔어요! 보라색 빛줄기를 따라가요'); }
  }
}
