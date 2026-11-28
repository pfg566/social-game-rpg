/* 사회 게임 RPG · 🐉 보스 레이드 (반 전체가 큰 보스 하나를 함께 잡아요 · 선생님 화면이 판을 진행해요)
   · 퀴즈를 맞히면 '⚡ 지식 폭발'이 보스에게 날아가요 (빨리 · 연속으로 맞힐수록 세요). 틀려도 벌칙 없이 다음 문제를 기다려요.
   · 제한 시간 안에 보스 체력을 0으로 만들면 반 전체 승리 → 모두 코인을 받아요.
   · 1분쯤마다 보스가 '망각의 폭풍'(전체 공격)을 모아요: 모두 같은 문제를 풀고, 선생님이 정한 비율 이상 맞히면 막아요
     (보스가 쓰러져 8초 동안 피해 2배). 못 막으면 모두 쓰러졌다 일어나고 남은 시간이 15초 줄어요.
   · 바닥의 빨간 표시는 보스의 공격이에요. 맞으면 하트가 1개 줄어요 (하트 3개). 하트를 다 잃으면 쓰러져요.
     쓰러지면 ① 친구가 옆에 2초 서 있으면 일어나요 (한 판에 1번 · 하트 2개, 쉬움은 3개)
              ② 쓰러진 학생들이 함께 문제를 맞혀 부활 게이지를 채우면 한 명씩 일어나요 (하트 3개 · 선생님 화면이 골라요)
     일어나면 3초 동안 파란 보호막. 쓰러져 있을 때 맞힌 문제는 레이드 점수 50점이에요.
   · 보라색 바닥 = 망각의 사슬 (묶이면 문제를 맞혀야 바로 풀려요) · 안쪽으로 빨려드는 고리 = 끌어당기기 (바깥으로 달려요)
   · 빨간 바닥 안에 있다가 제때 빠져나오면 '완벽 회피' (지식 폭발 충전 2초 빨리)
   데이터: raid/{학급}/meta · qs(문제) · qa(전체 공격 문제) · st(선생님 화면이 계산) · pi/{uid} · pl/{uid}(위치)
          · dmg/{uid}(내 피해량 · 정답 · 하트 · 쓰러짐 · 구해 준 친구) · ans/{k}/{uid}(전체 공격 답) · rk/{uid}(내 순위)
   레이드 점수 = 맞힌 문제 ×100 (+빨리 맞히면 최대 50) · 쓰러져서 맞힌 문제 ×50 · 보스 피해 30마다 1점
   파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
const RD_R=24, RD_SC=3.8, RD_BR=2.9, RD_INTRO=8, RD_PAT=7, RD_PAT0=5, RD_QCD=9, RD_QAUTO=4;
const RD_HEART=3, RD_RESC=2, RD_RESC_R=1.9, RD_KOQ=1.2, RD_CHAIN=4, RD_GUARD=3, RD_CH_R=3.3, RD_PULL_R=10.2, RD_PULL_V=3.5;
const RD_NAME='망각의 해골 대왕';
const RD_MY0=()=>({d:0,c:0,a:0,t:0,g:0,cd:0,sp:0,pd:0,rv:0});   // 피해 · 정답 · 푼 문제 · 정답 시간 · 폭풍 정답 · 쓰러져서 맞힘 · 빠른 정답 점수 · 완벽 회피 · 구조
/* 레이드 점수 (선생님 화면 teacher.html의 rdScore와 같은 계산) */
function raidScore(M){ const c=M.c|0, cd=Math.min(c,M.cd|0); return (c-cd)*100+Math.max(0,M.sp|0)+cd*50+Math.floor(Math.max(0,+M.d||0)/30); }
/* 받침에 따라 이/가 · 을/를 */
const rdJ=(s,a,b)=>{ s=String(s||''); const c=s.slice(-1).charCodeAt(0)-0xAC00; return s+(c>=0&&c<11172&&c%28?a:b); };
/* 직업마다: 기사 = 가까이서 세게 · 궁수 = 멀리서 안전하게 · 마법사 = 중간 거리 (보스 하나뿐이라 가까우면 알아서 보스를 겨눠요) */
const RD_JOB={knight:{cd:.5,rng:2.7,dmg:12,anim:'slashH',sanim:'stab',sk:'돌진 베기',up:'stab'},
              archer:{cd:.7,rng:18,dmg:10,anim:'shoot',sanim:'ult',sk:'세 갈래 화살',up:'ult'},
              mage:{cd:.8,rng:14,dmg:13,anim:'cast',sanim:'castBig',sk:'번개 폭발',up:'castBig'}};
const RAID={cid:'',metaRef:null,meta:null,st:null,on:false,joining:false,sk:0,refs:[],rp:{},pi:{},items:[],qa:[],qsKey:0,dyn:null,proj:[],bl:[],
  my:RD_MY0(),streak:0,cd:0,scd:0,dash:0,dashHit:false,dashDir:null,vx:0,vz:0,stunT:0,downT:0,invT:0,hitT:0,ak:0,an:0,bd:0,sendT:0,lastSent:'',lastSendAt:0,
  flT:0,flKey:'',sentD:0,qReadyAt:0,qWant:false,pendBlast:null,atkK:-1,atkDone:-1,resK:-1,patDone:-1,patAnim:-1,hpShow:0,hpKey:0,rank:0,endShown:false,endAt:0,win:false,
  hearts:RD_HEART,ko:false,koAt:0,koQAt:0,fr:false,sv:'',resT:0,resBy:'',saveT:0,saveFor:'',chainT:0,chainFx:null,pdIn:-1,rvSeen:-1,heartFx:0,patHint:-1,hintN:{},rdt:0,lastNow:0,
  joinSrv:0,boss:null,rune:null,tel:null,flames:[],sayT:0,cam:new THREE.Vector3(),look:new THREE.Vector3(),lookT:new THREE.Vector3()};

/* 맵 등록 (파티 점령전처럼 따로 묶음을 만들어요) */
MAP_KEYS.push('raid'); MAPSTATE.raid={colliders:[],stations:[],npcs:[]}; mapGroups.raid=new THREE.Group(); mapGroups.raid.visible=false; scene.add(mapGroups.raid);
MAPS.raid={name:'보스 레이드',need:['mc','ox'],start:[0,15],recharge:30,desc:'선생님이 연 반 전체 보스 레이드예요.',rules:[],gateText:'',clearText:'',
  winTitle:`${RD_NAME}을 쓰러뜨렸어요!`,winMsg:'반 전체가 힘을 모아 보스를 물리쳤어요. 아래 틀린 문제를 한 번 더 읽어 보고 마무리해요.'};
WAVESETS.raid=[{name:RD_NAME,n:0,hp:1,spd:1,dmg:0,color:0x8b5cf6}];

/* ---------- 맵: 무너진 돌 투기장 ---------- */
function buildRaid(){
  const fT=stoneTex('#8a8277','#5a534b','#9d9486'); fT.repeat.set(9,9);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(RD_R+2.2,96),toonMat({map:fT})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
  const outer=new THREE.Mesh(new THREE.RingGeometry(RD_R+2.1,RD_R+70,96,1),toonMat({color:0x3b3442})); outer.rotation.x=-Math.PI/2; outer.position.y=-.02; outer.receiveShadow=true; scene.add(outer);
  const curb=cs(new THREE.Mesh(new THREE.TorusGeometry(RD_R+.9,.42,8,128),std(0x6e675e))); curb.rotation.x=Math.PI/2; curb.scale.z=.55; curb.position.y=.1; scene.add(curb);
  /* 계단식 관중석 */
  const stepM=std(0x655d55,{side:THREE.DoubleSide}), stepT=std(0x7b7369,{side:THREE.DoubleSide});
  const tiers=[[RD_R+4,1.3],[RD_R+7,2.6],[RD_R+10,3.9],[RD_R+13,5.2]];
  tiers.forEach(([r,h],i)=>{ const rs=new THREE.Mesh(new THREE.CylinderGeometry(r,r,1.3,96,1,true),stepM); rs.position.y=h-.65; scene.add(rs);
    const top=new THREE.Mesh(new THREE.RingGeometry(r,tiers[i+1]?tiers[i+1][0]:r+16,96,1),stepT); top.rotation.x=-Math.PI/2; top.position.y=h; top.receiveShadow=true; scene.add(top); });
  /* 무너진 기둥: 카메라가 남쪽(+z)에서 보니까 남쪽 기둥은 낮게(학생을 가리지 않게) */
  const pilM=std(0x9b9284);
  for (let i=0;i<12;i++){ const a=i/12*Math.PI*2+Math.PI/12, r=RD_R+2.6, x=Math.sin(a)*r, z=Math.cos(a)*r, south=z>4;
    const h=south?[1.6,2.3,1.9][i%3]:[8.6,5.2,7.4,8.6,4.2,6.6][i%6];
    const base=cs(new THREE.Mesh(new THREE.BoxGeometry(2.4,.6,2.4),pilM)); base.position.set(x,.3,z); base.rotation.y=a; scene.add(base);
    const p=cs(new THREE.Mesh(new THREE.CylinderGeometry(.82,.98,h,10),pilM)); p.position.set(x,h/2+.5,z); p.rotation.z=south?rnd(-.12,.12):0; scene.add(p);
    if (h>8){ const cap=cs(new THREE.Mesh(new THREE.BoxGeometry(2.3,.5,2.3),pilM)); cap.position.set(x,h+.75,z); cap.rotation.y=a; scene.add(cap); } }
  for (let i=0;i<9;i++){ const a=rnd(0,Math.PI*2), r=rnd(RD_R+4,RD_R+12); place(['rock_single_A','rock_single_C','rock_single_E'][i%3],Math.sin(a)*r,Math.cos(a)*r,rnd(3,5),rnd(0,6)); }
  /* 화로 8개 (불빛은 고화질에서만) */
  const bowlM=std(0x463b33), flameM=new THREE.MeshBasicMaterial({color:0xff8a3d,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  RAID.flames=[];
  for (let i=0;i<8;i++){ const a=i/8*Math.PI*2+Math.PI/8, r=RD_R+1.25, x=Math.sin(a)*r, z=Math.cos(a)*r;
    const stand=cs(new THREE.Mesh(new THREE.CylinderGeometry(.16,.26,1.1,8),bowlM)); stand.position.set(x,.55,z); scene.add(stand);
    const bowl=cs(new THREE.Mesh(new THREE.CylinderGeometry(.68,.4,.48,10),bowlM)); bowl.position.set(x,1.3,z); scene.add(bowl);
    const fl=new THREE.Mesh(new THREE.ConeGeometry(.44,1.35,8),flameM); fl.position.set(x,2.1,z); scene.add(fl); RAID.flames.push(fl);
    if (i%2===0){ const L=ptLightQ(new THREE.PointLight(0xff9a4a,.9,11,2)); L.position.set(x,2.5,z); scene.add(L); } }
  /* 가운데 마법진 (보스 자리) */
  const runeT=canvasTex(512,512,(g,w,h)=>{ g.clearRect(0,0,w,h); g.translate(w/2,h/2); g.strokeStyle='#fff'; g.fillStyle='#fff';
    g.lineWidth=12; g.beginPath(); g.arc(0,0,244,0,Math.PI*2); g.stroke(); g.lineWidth=5; [212,150,96].forEach(r=>{ g.beginPath(); g.arc(0,0,r,0,Math.PI*2); g.stroke(); });
    g.lineWidth=6; g.beginPath(); for (let i=0;i<=6;i++){ const a=i*Math.PI*4/6-Math.PI/2; const x=Math.cos(a)*212, y=Math.sin(a)*212; i?g.lineTo(x,y):g.moveTo(x,y); } g.stroke();
    for (let i=0;i<16;i++){ const a=i/16*Math.PI*2; g.save(); g.rotate(a); g.translate(0,-228); g.beginPath(); g.moveTo(0,-9); g.lineTo(7,6); g.lineTo(-7,6); g.closePath(); g.fill(); g.restore(); } });
  runeT.wrapS=runeT.wrapT=THREE.ClampToEdgeWrapping; runeT.repeat.set(1,1);
  const rune=new THREE.Mesh(new THREE.CircleGeometry(9.5,64),new THREE.MeshBasicMaterial({map:runeT,color:0x9b6bff,transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  rune.rotation.x=-Math.PI/2; rune.position.y=.035; scene.add(rune); RAID.rune=rune;
  /* 보스 공격 표시 (빨간 바닥) */
  const tm=new THREE.MeshBasicMaterial({color:0xff3344,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const flat=m=>{ m.rotation.x=-Math.PI/2; m.position.y=.07; m.renderOrder=3; m.visible=false; scene.add(m); return m; };
  const lines=new THREE.Group(); scene.add(lines); lines.visible=false;
  for (let j=0;j<6;j++){ const arm=new THREE.Group(); arm.rotation.y=j*Math.PI/3; const L=RD_R-RD_BR; const m=new THREE.Mesh(new THREE.PlaneGeometry(2.8,L),tm); m.rotation.x=-Math.PI/2; m.position.set(0,.07,RD_BR+L/2); m.renderOrder=3; arm.add(m); lines.add(arm); }
  /* 보라색 = 망각의 사슬 · 안쪽으로 줄어드는 고리 = 끌어당기기 */
  const cm=new THREE.MeshBasicMaterial({color:0xb455ff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const sm=new THREE.MeshBasicMaterial({color:0xe9d5ff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false});
  RAID.tel={mat:tm,cmat:cm,smat:sm,cir:[0,1,2].map(()=>flat(new THREE.Mesh(new THREE.CircleGeometry(4.4,48),tm))),ring:flat(new THREE.Mesh(new THREE.RingGeometry(RD_BR+.2,8.8,72),tm)),
    out:flat(new THREE.Mesh(new THREE.RingGeometry(13,RD_R+1.2,96),tm)),lines,
    chain:[0,1,2,3,4].map(()=>flat(new THREE.Mesh(new THREE.CircleGeometry(RD_CH_R,40),cm))),
    pull:flat(new THREE.Mesh(new THREE.RingGeometry(RD_BR+.2,RD_PULL_R,72),tm)),
    sw:[0,1,2].map(()=>{ const m=flat(new THREE.Mesh(new THREE.RingGeometry(.93,1,72),sm)); m.position.y=.08; return m; })};
  RAID.dyn=new THREE.Group(); scene.add(RAID.dyn);
  RAID.orbMat=new THREE.SpriteMaterial({map:glowTex,color:0xb48cff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  RAID.ringGeo=new THREE.RingGeometry(.5,.66,28);
  /* 쓰러진 친구 표시 (모든 친구가 같이 써요): 구조 고리 · 차오르는 막대 · 보호막 방울 · 머리 위 글씨 */
  RAID.helpGeo=new THREE.RingGeometry(RD_RESC_R-.16,RD_RESC_R,48);
  RAID.helpMat=new THREE.MeshBasicMaterial({color:0x4ade80,transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  RAID.progGeo=[...Array(16)].map((_,k)=>new THREE.RingGeometry(RD_RESC_R-.42,RD_RESC_R-.18,48,1,Math.PI/2,-Math.PI*2*(k+1)/16));
  RAID.progMat=new THREE.MeshBasicMaterial({color:0xfde047,transparent:true,opacity:.95,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  RAID.bubGeo=new THREE.SphereGeometry(1.05,18,12);
  RAID.bubMat=new THREE.MeshBasicMaterial({color:0x7cc8ff,transparent:true,opacity:.26,depthWrite:false,toneMapped:false});
  RAID.lblHelp=raidLabelMat('🩹 구해 주세요!','#15803d'); RAID.lblQuiz=raidLabelMat('📖 문제로만 부활','#475569');
  RAID.chainIcon=twItemIcon('⛓️').material;
  raidMakeBoss();
}
/* 머리 위 글씨 (한 번 만들어 모든 친구가 함께 써요) */
function raidLabelMat(text,col){
  const cv=document.createElement('canvas'); cv.width=320; cv.height=72; const g=cv.getContext('2d');
  g.fillStyle=col; roundRect(g,4,8,312,56,18); g.fill(); g.lineWidth=4; g.strokeStyle='rgba(255,255,255,.85)'; roundRect(g,4,8,312,56,18); g.stroke();
  g.fillStyle='#fff'; g.font='700 32px "Noto Sans KR","Malgun Gothic","Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,160,37);
  const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding;
  return new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false,toneMapped:false});
}
MAP_BUILD.raid=()=>buildRaid();
GRASS_OK.raid=null;

/* 보스: 큰 해골 전사 (보라빛) · 기절 별 · 망각의 구슬 */
function raidMakeBoss(){
  const c=makeChar('sk_warrior',RD_SC,BOSS_MAP); arm(c,'axe');
  c.mats.forEach(m=>{ if (m.color) m.color.multiply(new THREE.Color(0xd4c6ff)); m.transparent=true; });
  const g=new THREE.Group(); g.add(c.root); scene.add(g);
  let H=RD_SC*2.1; try{ const b=new THREE.Box3().setFromObject(c.root); if (isFinite(b.max.y)&&b.max.y-b.min.y>3) H=b.max.y-b.min.y; }catch(e){}
  const aura=new THREE.Mesh(new THREE.RingGeometry(RD_BR-.3,RD_BR+.7,64),new THREE.MeshBasicMaterial({color:0xb48cff,transparent:true,opacity:.45,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  aura.rotation.x=-Math.PI/2; aura.position.y=.05; g.add(aura);
  const stars=twItemIcon('💫'); stars.scale.set(2.6,2.6,1); stars.visible=false; scene.add(stars);
  const orb=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshBasicMaterial({color:0x7c2dff,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  orb.visible=false; scene.add(orb);
  const core=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xe9d5ff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false})); core.visible=false; scene.add(core);
  const motes=[...Array(14)].map(()=>{ const s=new THREE.Sprite(RAID.orbMat); s.scale.setScalar(.8); s.visible=false; scene.add(s); return {s,a:rnd(0,6.28),r:rnd(4,9),y:rnd(0,5),sp:rnd(1.3,2.3)}; });
  const eye=ptLightQ(new THREE.PointLight(0xb48cff,1.1,14,2)); eye.position.y=H*.8; g.add(eye);
  g.visible=false;
  RAID.boss={c,g,H,mats:c.mats,aura,stars,orb,core,motes,state:'hidden',y:-H,fade:1,flash:0,face:0,taunted:false,deadT:0,
    head:c.root.getObjectByName('head'),chest:c.root.getObjectByName('chest'),hp:new THREE.Vector3(),cp:new THREE.Vector3()};
}

/* ---------- 선생님이 연 레이드 지켜보기 ---------- */
const raidSrv=()=>stgNow();
function raidWatch(){
  const cid=fbDb?stgCidNow():'';
  if (cid===RAID.cid) return;
  if (RAID.metaRef){ RAID.metaRef.off(); RAID.metaRef=null; }
  RAID.cid=cid; RAID.meta=null; raidBtn(); if (!cid) return;
  RAID.metaRef=fbDb.ref(`raid/${cid}/meta`);
  RAID.metaRef.on('value',s=>{ const was=RAID.meta&&RAID.meta.state; RAID.meta=s.val(); raidBtn(); if (RAID.meta&&RAID.meta.t0&&+RAID.meta.t0!==RAID.qsKey) raidLoadQs();
    if (RAID.on&&MAPK==='raid'&&RAID.meta&&RAID.meta.state==='wait'&&was!=='wait') raidWritePi(); },()=>{});   // 선생님이 입장을 다시 열면 내 정보도 다시 알려요
}
function raidOpen(){ const m=RAID.meta; return !!m&&(m.state==='wait'||m.state==='run'); }
function raidBtn(){ const b=$('#raidBtn'); if (!b) return; const on=raidOpen()&&W.state!=='play'&&!(typeof PARTY!=='undefined'&&PARTY.rid); b.hidden=!on;
  if (on) b.innerHTML=RAID.meta.state==='run'?'🐉 보스 레이드 진행 중 · 지금 들어가기':'🐉 보스 레이드 · 입장하기'; }
setInterval(()=>{ try{ raidWatch(); raidBtn(); }catch(e){} },1500);
const raidArr=x=>Array.isArray(x)?x.filter(v=>v!=null):(x&&typeof x==='object'?Object.values(x):[]);
async function raidLoadQs(){
  const k=+RAID.meta.t0, c=RAID.cid;
  try{ const [a,b]=await Promise.all([fbDb.ref(`raid/${c}/qs`).once('value'),fbDb.ref(`raid/${c}/qa`).once('value')]);
    if (RAID.cid!==c) return; RAID.items=raidBuildItems(raidArr(a.val())); RAID.qa=raidArr(b.val()).map(raidOneItem).filter(Boolean); RAID.qsKey=k; }catch(e){}
}
/* 선생님이 보낸 문제 → 퀴즈 창 문제 (단답형 · 보기 조합 · 순서도 그대로 풀어요) */
function raidOneItem(q){ if (!q||!q.q) return null; return q.k==='ox'?{kind:'ox',q:String(q.q),a:!!q.a,e:String(q.e||'')}:{kind:'mc',q:String(q.q),o:raidArr(q.o).map(String),e:String(q.e||'')}; }
function raidBuildItems(qs){
  const b={mc:[],ox:[],sa:[],cmb:[],ord:[]};
  for (const q of qs){ if (!q||!q.q) continue; const e=String(q.e||'');
    if (q.k==='mc'){ const o=raidArr(q.o).map(String); if (o.length>=4) b.mc.push({q:String(q.q),o,e}); }
    else if (q.k==='ox') b.ox.push({q:String(q.q),a:!!q.a,e});
    else if (q.k==='sa') b.sa.push({q:String(q.q),a:String(q.a||''),h:String(q.h||''),e});
    else if (q.k==='cmb') b.cmb.push({q:String(q.q),s:raidArr(q.s).map(String),a:String(q.a||''),e});
    else if (q.k==='ord') b.ord.push({q:String(q.q),it:raidArr(q.it).map(String),e}); }
  let ex=[]; try{ ex=qxDerive(b); }catch(e){}
  return [...b.mc.map(x=>({...x,kind:'mc'})),...b.ox.map(x=>({...x,kind:'ox'})),...ex];
}
function raidJoin(){ if (!raidOpen()) return; if (!myUid()){ flashPrompt('로그인한 학생만 들어갈 수 있어요',2); return; } RAID.joining=true; startGame(); RAID.joining=false; }
function raidWritePi(){ const u=myUid(); if (!u||!RAID.cid) return; fbDb.ref(`raid/${RAID.cid}/pi/${u}`).set({n:myName().slice(0,12),num:STUDENT?+STUDENT.num:0,job:JOB,look:equippedLook(JOB)}).catch(()=>{}); }
function raidReset(){
  raidEndUI();
  if (MAPK!=='raid'){ RAID.on=false; return; }
  RAID.on=true; RAID.sk=0; raidNewSession();
  raidRemoveAll(); RAID.proj.forEach(p=>RAID.dyn.remove(p.mesh)); RAID.bl.forEach(b=>RAID.dyn.remove(b.sp)); RAID.proj=[]; RAID.bl=[];
  const a=rnd(0,Math.PI*2), r=rnd(13,17); P.x=Math.sin(a)*r; P.z=Math.cos(a)*r; P.fx=-Math.sin(a); P.fz=-Math.cos(a); W.snapCam=true;
  W.nextWaveAt=-1; W.nextQuiz=1e9; RAID.joinSrv=raidSrv();
  document.body.classList.add('raidmode'); ['#rdTop','#rdMe','#rdRank','#rdFeed'].forEach(s=>{ const e=$(s); if (e) e.hidden=false; }); $('#rdFeed').innerHTML='';
  raidWritePi(); raidListen();
}
/* 선생님이 판을 시작하면(또는 다시 시작하면) 기록을 새로 세요. 같은 판에 다시 들어오면 내 피해량을 이어서 세요 */
function raidNewSession(){
  const k=+(RAID.meta&&RAID.meta.t0)||0; RAID.sk=k;
  Object.assign(RAID,{my:RD_MY0(),streak:0,cd:0,scd:0,dash:0,vx:0,vz:0,stunT:0,downT:0,invT:0,hitT:0,bd:0,sendT:0,lastSent:'',flT:0,flKey:'',sentD:0,
    qReadyAt:0,qWant:false,pendBlast:null,atkK:-1,atkDone:-1,resK:-1,patDone:-1,patAnim:-1,hpShow:0,hpKey:0,rank:0,endShown:false,win:false,
    hearts:RD_HEART,ko:false,koAt:0,koQAt:0,fr:false,sv:'',resT:0,resBy:'',saveT:0,saveFor:'',chainT:0,pdIn:-1,rvSeen:-1,heartFx:0,patHint:-1,hintN:{}});
  W.guardUntil=0;
  if (RAID.boss) raidBossState(RAID.boss,'hidden',true);
  if (k) raidRestore(k);
}
/* 같은 판에 다시 들어오면 (새로 고침 등) 피해량 · 정답 · 하트 · 쓰러짐을 이어서 써요 (새로 고침으로 되살아나지 않게) */
async function raidRestore(k){
  const u=myUid(); if (!u||!RAID.cid) return; let v=null;
  try{ v=(await withTimeout(fbDb.ref(`raid/${RAID.cid}/dmg/${u}`).once('value'),6000)).val(); }catch(e){}
  if (!(v && +v.k===k && RAID.sk===k)) return;
  const M=RAID.my; ['d','c','a','t','g','cd','sp','pd'].forEach(f=>{ M[f]=Math.max(M[f]|0,+v[f]||0); }); RAID.sentD=M.d;
  if (v.h!=null) RAID.hearts=Math.min(RAID.hearts,Math.max(0,Math.min(RD_HEART,v.h|0)));
  if (+v.fr===1) RAID.fr=true; if (v.sv) RAID.sv=String(v.sv);
  if ((+v.ko===1||RAID.hearts<=0) && !RAID.ko) raidKO(0,0,true);
}
/* ---------- 네트워크 ---------- */
function raidListen(){
  raidOff(); const c=RAID.cid, me=myUid(); if (!c||!fbDb) return;
  const L=(path,ev,cb)=>{ const r=fbDb.ref(path); r.on(ev,cb,()=>{}); RAID.refs.push([r,ev,cb]); };
  L(`raid/${c}/st`,'value',s=>raidOnSt(s.val()));
  L(`raid/${c}/pi`,'child_added',s=>{ RAID.pi[s.key]=s.val()||{}; }); L(`raid/${c}/pi`,'child_changed',s=>{ RAID.pi[s.key]=s.val()||{}; });
  const onP=s=>{ if (s.key===me) return; raidRemoteNet(s.key,s.val()); };
  L(`raid/${c}/pl`,'child_added',onP); L(`raid/${c}/pl`,'child_changed',onP); L(`raid/${c}/pl`,'child_removed',s=>raidRemoveOne(s.key));
  if (me) L(`raid/${c}/rk/${me}`,'value',s=>{ RAID.rank=+s.val()||0; });
  try{ if (me) fbDb.ref(`raid/${c}/pl/${me}`).onDisconnect().remove(); }catch(e){}
}
function raidOff(){ RAID.refs.forEach(([r,ev,cb])=>{ try{ r.off(ev,cb); }catch(e){} }); RAID.refs=[]; }
function raidSend(dt){
  RAID.sendT-=dt; if (RAID.sendT>0||!RAID.cid) return; RAID.sendT=.15;
  // 1 넘어짐·쓰러짐 · 2 문제 푸는 중 · 4 맞음 · 8 쓰러짐(하트 0) · 16 친구 구조를 이미 받음 · 32 사슬 · 64 보호막
  const fl=(RAID.downT>0||RAID.ko?1:0)|(W.paused?2:0)|(RAID.hitT>0?4:0)|(RAID.ko?8:0)|(RAID.fr?16:0)|(RAID.chainT>0?32:0)|(raidGuard()?64:0), f=Math.round(Math.atan2(P.fx,P.fz)*100), now=performance.now();
  const body=[Math.round(P.x*10),Math.round(P.z*10),f,fl,RAID.ak,RAID.an,RAID.bd|0].join(',');
  if (body===RAID.lastSent && now-RAID.lastSendAt<2000) return;   // 가만히 있어도 2초마다 한 번은 보내요 (선생님 화면이 '접속 중'으로 세요)
  RAID.lastSent=body; RAID.lastSendAt=now;
  fbDb.ref(`raid/${RAID.cid}/pl/${myUid()}`).set(Math.round(now/10)%60000+','+body).catch(()=>{});
}
/* 내 피해량 · 정답 수: 0.6초마다 바뀐 것만 보내요 (선생님 화면이 모두 더해서 보스 체력을 계산해요) */
function raidFlush(force){
  if (!RAID.cid||!RAID.sk||!myUid()) return; const now=performance.now(); if (!force && now-RAID.flT<600) return;
  const M=RAID.my, key=[M.d,M.c,M.a,M.g,M.cd,M.sp,M.pd,RAID.hearts,RAID.ko?1:0,RAID.fr?1:0,RAID.sv].join('|'); if (key===RAID.flKey) return; RAID.flT=now; RAID.flKey=key; RAID.sentD=M.d;
  const v={k:RAID.sk,d:M.d,c:M.c,a:M.a,t:M.t,g:M.g,cd:M.cd,sp:M.sp,pd:M.pd,h:RAID.hearts,ko:RAID.ko?1:0,fr:RAID.fr?1:0,n:myName().slice(0,12),num:STUDENT?+STUDENT.num:0};
  if (RAID.sv) v.sv=RAID.sv;   // 나를 구해 준 친구 (선생님 화면이 🩹 구조왕을 세요)
  fbDb.ref(`raid/${RAID.cid}/dmg/${myUid()}`).set(v).catch(()=>{});
}
function raidDecP(v){ const a=String(v).split(','); return {t:+a[0],x:+a[1]/10,z:+a[2]/10,f:+a[3]/100,fl:+a[4]|0,ak:+a[5]|0,an:+a[6]|0,bd:+a[7]|0}; }
async function raidRemoteNet(u,v){
  if (v==null) return; const st=raidDecP(v); let R=RAID.rp[u];
  if (!R){ if (RAID.rp[u]===null) return; RAID.rp[u]=null; let info=RAID.pi[u];
    if (!info){ try{ info=(await fbDb.ref(`raid/${RAID.cid}/pi/${u}`).once('value')).val()||{}; }catch(e){ info={}; } RAID.pi[u]=info; }
    if (!RAID.on||RAID.rp[u]!==null){ if (RAID.rp[u]===null) delete RAID.rp[u]; return; }
    R=raidMakeRemote(u,info,st); RAID.rp[u]=R; }
  if (R.st){ let dts=(st.t-R.st.t)/100; if (dts<0) dts+=600; if (dts>.03&&dts<1.5){ R.vx=(st.x-R.st.x)/dts; R.vz=(st.z-R.st.z)/dts; const sp=Math.hypot(R.vx,R.vz); if (sp>14){ R.vx*=14/sp; R.vz*=14/sp; } } else { R.vx=R.vz=0; } }
  const pf=R.st?R.st.fl:0, nm=(R.info&&R.info.n)||'친구';
  if ((st.fl&1)&&!(pf&1)) R.ch.anim.die(); else if (!(st.fl&1)&&(pf&1)) raidGetUp(R.ch);
  if ((st.fl&4)&&!(pf&4)&&!(st.fl&1)) R.ch.anim.once('hit',1.2,true);
  if (R.st && RAID.sk){   // 친구가 쓰러지거나 일어났어요
    if ((st.fl&8)&&!(pf&8)) raidFeed(st.fl&16?`💀 ${nm} 쓰러졌어요 · 문제로 다시 일어나요`:`💀 ${nm} 쓰러졌어요 · 옆에 2초 서 있으면 구해요!`,'#ef4444');
    else if (!(st.fl&8)&&(pf&8)&&(st.fl&16)&&!(pf&16)){
      if (RAID.saveFor===u&&RAID.saveT>.8&&!RAID.ko){ RAID.my.rv++; raidSay(`🩹 ${rdJ(nm,'을','를')} 구했어요!`,2.2); try{ SFX.cheer(); }catch(e){} fx.rise(R.x,R.z,0x4ade80,14); }
      raidFeed(`🩹 ${nm} 친구 도움으로 일어났어요`,'#22c55e'); }
  }
  if (R.st && st.an!==R.st.an) raidRemoteFx(R,st.ak,st.bd);
  R.st=st; R.netAt=performance.now();
}
function raidMakeRemote(u,info,st){
  const job=JOBS[info.job]?info.job:'knight', ch=makePlayerChar(job), g=new THREE.Group(); g.add(ch.root); RAID.dyn.add(g); remoteLite(ch,g);   // 친구는 동그란 그림자만
  dressP2(ch,{...DEFAULTS[job],...(info.look||{})}).catch(()=>{});
  const tag=twTag(info.n||'친구',null); tag.position.y=3.05; g.add(tag);
  const ring=new THREE.Mesh(RAID.ringGeo,new THREE.MeshBasicMaterial({color:0xc4b5fd,transparent:true,opacity:.7,depthWrite:false})); ring.rotation.x=-Math.PI/2; ring.position.y=.06; g.add(ring);
  const book=twItemIcon('📖'); book.scale.set(.95,.95,1); book.position.y=3.85; book.visible=false; g.add(book);
  const mk=new THREE.Sprite(RAID.lblHelp); mk.scale.set(3,.68,1); mk.position.y=3.78; mk.renderOrder=9; mk.visible=false; g.add(mk);
  const hr=new THREE.Mesh(RAID.helpGeo,RAID.helpMat); hr.rotation.x=-Math.PI/2; hr.position.y=.07; hr.visible=false; g.add(hr);
  const pr=new THREE.Mesh(RAID.progGeo[0],RAID.progMat); pr.rotation.x=-Math.PI/2; pr.position.y=.09; pr.visible=false; g.add(pr);
  const chn=new THREE.Sprite(RAID.chainIcon); chn.scale.set(1.1,1.1,1); chn.position.y=3.85; chn.renderOrder=7; chn.visible=false; g.add(chn);
  const bub=new THREE.Mesh(RAID.bubGeo,RAID.bubMat); bub.position.y=1.05; bub.scale.set(1,1.15,1); bub.visible=false; g.add(bub);
  ch.anim.setBase('idle'); g.position.set(st.x,0,st.z);
  return {u,info,job,ch,g,tag,ring,book,mk,hr,pr,chn,bub,st:null,x:st.x,z:st.z,f:st.f,vx:0,vz:0,netAt:0};
}
function raidRemoveOne(u){ const R=RAID.rp[u]; if (R){ RAID.dyn.remove(R.g); charDispose(R.ch.root,R.ch.mixer,R.g); } delete RAID.rp[u]; }
function raidRemoveAll(){ for (const u in RAID.rp) raidRemoveOne(u); RAID.rp={}; }
function raidRemoteFx(R,k,bd){
  const dx=Math.sin(R.f), dz=Math.cos(R.f), J=RD_JOB[R.job]||RD_JOB.knight, near=Math.hypot(R.x-P.x,R.z-P.z)<26&&RAID.proj.length<40;
  if (k===1){ R.ch.anim.once(J.anim,R.job==='knight'?2.4:2.6,true);
    if (!near) return;
    if (R.job==='archer') raidShoot({x:dx,z:dz},'arrow',0,false,R.x,R.z);
    else if (R.job==='mage') raidShoot({x:dx,z:dz},'orb',0,false,R.x,R.z);
    else if (Math.hypot(R.x,R.z)-RD_BR<3.2) impactFx(R.x+dx*1.4,1.1,R.z+dz*1.4,0xfff1c4,1.4); }
  else if (k===2){ R.ch.anim.once(J.sanim,2.2,true);
    if (R.job==='mage') fx.shock(R.x,R.z,5); else if (R.job==='archer'&&near){ for (const a of [-.12,0,.12]){ const c=Math.cos(a), s=Math.sin(a); raidShoot({x:dx*c-dz*s,z:dx*s+dz*c},'arrow',0,false,R.x,R.z); } } }
  else if (k===5 && bd>0){ R.ch.anim.once(J.up,2,true); raidLaunchBlast(bd,false,R); fx.rise(R.x,R.z,0xffd34d,10); }
}
function raidRemoteTick(dt){
  const now=performance.now(); if (RAID.helpMat) RAID.helpMat.opacity=.45+Math.sin(now/180)*.3;
  for (const u in RAID.rp){ const R=RAID.rp[u]; if (!R||!R.st) continue; const s=R.st;
    const age=R.netAt?Math.min(.3,(now-R.netAt)/1000):0, tx=s.x+(R.vx||0)*age, tz=s.z+(R.vz||0)*age, k=Math.min(1,dt*14);
    const ox=R.x, oz=R.z; R.x+=(tx-R.x)*k; R.z+=(tz-R.z)*k; const mv=Math.hypot(R.x-ox,R.z-oz)/Math.max(dt,1e-3);
    let df=s.f-R.f; df=Math.atan2(Math.sin(df),Math.cos(df)); R.f+=df*Math.min(1,dt*12);
    R.g.position.set(R.x,0,R.z); R.ch.root.rotation.y=R.f;
    const ko=!!(s.fl&8), help=ko&&!(s.fl&16);   // 쓰러짐 · 친구가 구할 수 있음
    R.book.visible=!!(s.fl&2)&&!ko; R.chn.visible=!!(s.fl&32)&&!ko; R.bub.visible=!!(s.fl&64)&&!ko;
    R.mk.visible=ko; if (ko){ const want=help?RAID.lblHelp:RAID.lblQuiz; if (R.mk.material!==want) R.mk.material=want; }
    R.hr.visible=help;
    const pv=help&&RAID.saveFor===u?Math.min(1,RAID.saveT/RD_RESC):0; R.pr.visible=pv>0;   // 내가 구하는 중: 노란 막대가 2초 동안 차요
    if (pv>0){ const gi=Math.min(15,Math.floor(pv*16)); if (R.pr.geometry!==RAID.progGeo[gi]) R.pr.geometry=RAID.progGeo[gi]; }
    if (!(s.fl&1)) R.ch.anim.setBase(mv>1.2?'run':'idle'); R.ch.mixer.update(dt);
  }
}
/* 친구 구조: 쓰러진 학생 화면이 '옆에 2초 서 있었는지' 정해요 (한 판에 1번). 구하는 친구 화면은 막대만 보여 줘요 */
function raidRescueTick(){
  const dt=RAID.rdt; let near='', nd=1e9;   // 실제 시간으로 재요: 두 학생 화면의 2초가 같아요
  if (RAID.ko){ RAID.saveFor=''; RAID.saveT=0;
    if (RAID.fr||raidPh()==='end') { RAID.resT=0; return; }
    const now=performance.now();
    for (const u in RAID.rp){ const R=RAID.rp[u]; if (!R||!R.st||(R.st.fl&9)||now-R.netAt>4000) continue;   // 넘어졌거나 쓰러진 친구는 못 구해요
      const d=Math.hypot(R.x-P.x,R.z-P.z); if (d<RD_RESC_R&&d<nd){ nd=d; near=u; } }
    if (near){ RAID.resT+=dt; RAID.resBy=near; if (RAID.resT>=RD_RESC) raidRevive('friend',near); }
    else RAID.resT=Math.max(0,RAID.resT-dt*1.5);
    return;
  }
  RAID.resT=0;
  if (RAID.downT<=0 && raidPh()!=='end'){
    for (const u in RAID.rp){ const R=RAID.rp[u]; if (!R||!R.st) continue; const f=R.st.fl; if (!(f&8)||(f&16)) continue;
      const d=Math.hypot(R.x-P.x,R.z-P.z); if (d<RD_RESC_R&&d<nd){ nd=d; near=u; } } }
  if (near&&near===RAID.saveFor) RAID.saveT+=dt; else { RAID.saveFor=near; RAID.saveT=near?dt:0; }
}
/* 쓰러진 자세(죽는 동작 끝)에서 거꾸로 틀어 일어나요 */
function raidGetUp(ch,want){
  const A=ch.anim, a=A.actions.death; if (want) A.want=want; if (!a){ A.revive(); return; }
  A.dead=false; A.lock=true; A.baseKey=null; a.paused=false; a.enabled=true; a.setLoop(THREE.LoopOnce,1); a.clampWhenFinished=true; a.timeScale=-1.6;
  if (a.time<=.01) a.time=a.getClip().duration; a.setEffectiveWeight(1); a.play(); A.cur=a;
}

/* ---------- 판 진행 (선생님 화면이 보낸 상태) ---------- */
function raidEl(){ const m=RAID.meta; return m&&m.t0?(raidSrv()-m.t0)/1000:0; }
function raidSt(){ const s=RAID.st; return s&&+s.k0===RAID.sk&&RAID.sk?s:null; }
function raidPh(){
  const m=RAID.meta; if (!m) return 'gone';
  if (m.state==='wait') return 'wait';
  const st=raidSt();
  if (m.state==='end'||(st&&st.end)) return 'end';
  if (m.state!=='run'||!m.t0) return 'wait';
  if (raidEl()<RD_INTRO) return 'intro';
  return st?(st.ph==='intro'?'fight':st.ph||'fight'):'load';
}
function raidGroggy(){ const st=raidSt(); return !!(st&&st.gro&&raidSrv()<st.gro); }
function raidCanDamage(){ const p=raidPh(), st=raidSt(), B=RAID.boss; return (p==='fight'||p==='atk'||p==='res')&&!!B&&B.state!=='hidden'&&B.state!=='dead'&&!(st&&st.hp<=0); }
function raidGuard(){ return !!(W.guardUntil&&W.guardUntil>W.t); }   // 일어난 뒤 파란 보호막
function raidVuln(){ return RAID.on&&W.state==='play'&&!W.paused&&RAID.invT<=0&&RAID.downT<=0&&!RAID.dash&&!RAID.ko&&!raidGuard(); }
function raidEasy(){ const m=RAID.meta; return !!(m&&+m.ez===1); }   // 선생님이 고른 난이도 '쉬움'
function raidOnSt(v){
  RAID.st=v; if (!RAID.on||!v||+v.k0!==RAID.sk||!RAID.sk) return;
  if (v.ph==='atk' && v.k!==RAID.atkK){ RAID.atkK=v.k; if (!(v.as&&v.as<RAID.joinSrv-1500)) raidAtkStart(v); }
  if (v.ph==='res' && v.k!==RAID.resK){ RAID.resK=v.k; if (!(v.as&&v.as<RAID.joinSrv-1500)) raidAtkResult(v); }
  // 함께 문제 풀기 부활: 부활 게이지가 차면 선생님 화면이 쓰러진 학생 한 명을 골라요
  const rv=v.rv; if (rv && rv.k!==RAID.rvSeen){ RAID.rvSeen=rv.k;
    if (!(rv.at&&rv.at<RAID.joinSrv-1500)){ if (rv.u===myUid()) raidRevive('pool'); else raidFeed(`📖 다 같이 맞혀서 ${rv.n||'친구'} 다시 일어났어요!`,'#14b8a6'); } }
}
function raidSessionCheck(){ const k=+(RAID.meta&&RAID.meta.t0)||0; if (k && k!==RAID.sk) raidNewSession(); }

/* ---------- 퀴즈: 혼자 푸는 '지식 폭발' · 반 전체 '망각의 폭풍 막기' ---------- */
function raidQuizTick(){
  const ph=raidPh(), now=performance.now();
  if (ph==='atk'){ const st=raidSt(); if (st && RAID.atkDone!==st.k) raidAtkQuiz(st); return; }   // 전체 공격 중에는 혼자 푸는 문제를 쉬어요 (쓰러져 있어도 함께 풀어요)
  if (!(ph==='fight'||ph==='res')||!RAID.items.length) return;
  if (RAID.ko){ raidKOQuizTick(now); return; }
  if (W.paused||!$('#quiz').hidden||RAID.downT>0||RAID.stunT>0||RAID.chainT>0) return;
  if (!RAID.qReadyAt) RAID.qReadyAt=now+rnd(2.5,5.5)*1000;   // 처음 문제는 학생마다 조금씩 다르게
  if (now<RAID.qReadyAt) return;
  if (!RAID.qWant && RAID.saveFor && RAID.saveT>0) return;   // 친구를 구하는 동안에는 문제가 저절로 뜨지 않아요 (F를 누르면 떠요)
  if (RAID.qWant || now>=RAID.qReadyAt+RD_QAUTO*1000){ RAID.qWant=false; raidQuizOpen(); }
}
/* 쓰러져 있는 동안: 부활 문제를 쉬지 않고 풀어요. 맞힐 때마다 부활 게이지 +1 (쓰러진 학생 모두가 함께 채워요) */
function raidKOQuizTick(now){
  if (W.paused||!$('#quiz').hidden||now<RAID.koQAt) return;
  const item=pick(['mc','ox'],RAID.items); if (!item){ RAID.koQAt=now+3000; return; }
  openQuiz(item,{type:'raidKO',ko:true}); const t=$('#qtag'); t.style.background='#0f766e'; raidKOTag();
}
function raidKOTag(){
  const t=$('#qtag'), st=raidSt(); if (!t) return;
  const rn=st&&st.rn|0, rp=Math.min(rn,st&&st.rp|0), helped=RAID.resT>0&&!RAID.fr;
  const s=`📖 부활 문제 · 다 같이 ${rn?`${rp}/${rn}`:'…'}`+(helped?' · 🩹 친구가 구하는 중':'');
  if (t.textContent!==s) t.textContent=s;
}
function raidWantQuiz(){ const now=performance.now(); if (RAID.qReadyAt && now>=RAID.qReadyAt) RAID.qWant=true; }
function raidQuizOpen(){
  const item=pick(['mc','ox'],RAID.items); if (!item){ RAID.qReadyAt=performance.now()+3000; return; }
  RAID.qReadyAt=1e15; openQuiz(item,{type:'raid'});
  const t=$('#qtag'); t.textContent=t.textContent.replace('돌발 퀴즈','⚡ 지식 폭발'); t.style.background='#6d28d9';
}
function raidAtkQuiz(st){
  const left=(st.au-raidSrv())/1000, item=RAID.qa[st.k]; if (left<2.5||!item){ if (left<2.5) RAID.atkDone=st.k; return; }
  raidQuizAbort(); if (W.paused||!$('#quiz').hidden) return;
  RAID.atkDone=st.k; openQuiz(item,{type:'raidAtk',k:st.k,ko:RAID.ko}); Q.dur=Math.max(3,left-.4);
  const t=$('#qtag'); t.textContent=RAID.ko?'🌀 망각의 폭풍 막기 · 쓰러져 있어도 함께 풀어요':'🌀 망각의 폭풍 막기 · 반 전체 문제'; t.style.background='#b91c1c';
}
/* 레이드 문제: raid(지식 폭발) · raidAtk(폭풍) · raidKO(부활 문제) · raidCh(사슬 풀기) */
const raidQType=s=>!!(s&&/^raid/.test(String(s.type||'')));
/* 열려 있던 레이드 문제를 닫아요: 답을 고른 상태면 그대로 닫고(정답이면 지식 폭발), 아직이면 세지 않고 닫아요 */
function raidQuizAbort(){
  if ($('#quiz').hidden) return; const s=Q.source; if (!raidQType(s)) return;
  if (Q.answered){ closeQuiz(); return; }
  Q.answered=true; Q.item=null; $('#quiz').hidden=true; W.paused=false; const now=performance.now();
  if (s.type==='raid') RAID.qReadyAt=now+3000; else if (s.type==='raidKO') RAID.koQAt=now+800;
}
function raidResultAutoClose(){ const s=Q.source; if ($('#quiz').hidden||!Q.answered||!raidQType(s)) return; if (performance.now()>(Q.closeAt||0)+(s.type==='raidKO'?4000:7000)) closeQuiz(); }
/* 07-quiz.js settle()에서 불러요 (정답 수 · 틀린 문제 기록은 이미 끝난 뒤)
   레이드 점수: 살아 있을 때 맞히면 100점 + 빠른 정답(최대 50) · 쓰러져 있을 때 맞히면 50점 (일부러 쓰러지는 게 유리하지 않게) */
function raidSettle(ok,item,source){
  const ms=Math.max(0,performance.now()-Q.start-QUIZ_LOCK_MS), left=Math.max(0,Math.min(1,1-ms/1000/Math.max(1,Q.dur)));
  const M=RAID.my, ko=source.type==='raidKO'||!!source.ko; let pts=0;
  M.a++;
  if (ok){ M.c++; M.t+=Math.round(ms); RAID.streak++; if (ko){ M.cd++; pts=50; } else { const s=speedPts(left); M.sp+=s; pts=100+s; } } else RAID.streak=0;
  const ptx=ok?`🏅 레이드 점수 +${pts}`+(ko?' (쓰러져 있을 때는 50점)':''):'';
  if (source.type==='raidAtk'){
    if (RAID.cid&&myUid()) fbDb.ref(`raid/${RAID.cid}/ans/${source.k}/${myUid()}`).set(ok?1:0).catch(()=>{});
    if (ok){ M.g++; if (!ko) RAID.pendBlast={d:120}; }
    raidFlush(true);
    return {fx:{label:ok?(ko?'기억의 방패에 힘을 보탰어요! 부활 게이지도 +1':'기억의 방패에 힘을 보탰어요! (작은 반격 ⚡120)'):'아쉬워요… 친구들이 막아 줄 거예요'},
      extras:[ok?'반 전체 정답 비율이 목표를 넘으면 폭풍을 막아요.':'정답과 풀이를 읽어 두면 다음에 맞힐 수 있어요.',ptx].filter(Boolean)};
  }
  if (source.type==='raidKO'){
    raidFlush(true);
    return {fx:{label:ok?'부활 게이지 +1! 쓰러진 친구들과 함께 채워요':'괜찮아요, 다음 문제로 다시 채워요'},extras:[ok?ptx:'풀이를 읽고 다음 문제에서 맞혀 봐요.']};
  }
  if (source.type==='raidCh'){
    if (ok && RAID.chainT>0){ RAID.chainT=0; raidChainBreak(false); }
    raidFlush(true);
    return {fx:{label:ok?'사슬을 끊었어요! 다시 움직일 수 있어요':'사슬이 곧 저절로 풀려요'},extras:[ok?ptx:'풀이를 읽고 다음 문제에서 맞혀 봐요.']};
  }
  raidFlush(true);
  if (!ok) return {fx:{label:'괜찮아요, 벌칙은 없어요. 다음 문제를 기다려요'},extras:['풀이를 읽고 다음 문제에서 맞혀 봐요.']};
  const sp=Math.round(140*left), stk=Math.min(4,RAID.streak-1)*30, hard=item.src?60:0, d=260+sp+stk+hard;
  RAID.pendBlast={d}; const ex=[ptx];
  if (RAID.streak>=2) ex.push(`🔥 ${RAID.streak}연속 정답! 폭발 +${stk}`); if (hard) ex.push(`어려운 문제 보너스 +${hard}`);
  return {fx:{label:`지식 폭발 준비 완료! 계속하기를 누르면 보스에게 날아가요 ⚡${d}`},extras:ex};
}
/* 07-quiz.js closeQuiz()에서 불러요 */
function raidQuizClosed(s,ok){
  W.paused=false; try{ canvas.focus({preventScroll:true}); }catch(e){}
  const now=performance.now();
  if (s.type==='raid'||s.type==='raidCh') RAID.qReadyAt=now+RD_QCD*1000;   // 사슬 문제도 다음 지식 폭발 문제를 한 번 대신해요
  if (s.type==='raidKO') RAID.koQAt=now+RD_KOQ*1000;
  const pb=RAID.pendBlast; RAID.pendBlast=null; W.lastFx=null;
  if (pb && raidCanDamage() && !RAID.ko) raidLaunchBlast(Math.round(pb.d*(raidGroggy()?2:1)),true);
}
function raidAtkStart(st){
  raidSay('🌀 망각의 폭풍! 반 전체가 문제를 맞혀 막아요',3); try{ SFX.drum(); }catch(e){} shake=Math.max(shake,.25);
  raidAtkQuiz(st);
}
function raidAtkResult(st){
  raidQuizAbort(); const B=RAID.boss;
  if (st.ok){ raidSay('🛡️ 막았다! 보스 기절 · 8초 동안 피해 2배',3.2); try{ SFX.shield(); SFX.cheer(); }catch(e){}
    if (B){ fx.burst(0,B.H+1.5,0,0x9fe6ff,40,9); fx.shock(0,0,10); } }
  else { raidSay('💥 못 막았어요… 남은 시간 −15초',3.2); try{ SFX.boom(); }catch(e){}
    if (B){ fx.burst(0,B.H+1.5,0,0xb048ff,44,10); } fx.shock(0,0,RD_R+2); fx.shock(0,0,15); shake=Math.max(shake,.7); raidKnockDown(2.6); }
}

/* ---------- 내 캐릭터: 이동 · 공격 · 맞기 ---------- */
function raidAct(k){ RAID.ak=k; RAID.an=(RAID.an+1)%1000; RAID.sendT=0; }
function raidAim(rng){
  const dx=-P.x, dz=-P.z, d=Math.hypot(dx,dz)||1, B=RAID.boss;
  if (B&&B.state!=='hidden'&&d-RD_BR<=rng){ P.fx=dx/d; P.fz=dz/d; return {x:P.fx,z:P.fz,boss:true}; }
  const kb=kbAimDir(), md=!kb&&mouseAiming()?mouseAimDir():null, a=kb||md; if (a){ P.fx=a.x; P.fz=a.z; }
  return {x:P.fx,z:P.fz,boss:false};
}
function raidCanAct(){ return RAID.on&&!W.paused&&RAID.downT<=0&&RAID.stunT<=0&&!(RAID.dash>0)&&!RAID.ko&&RAID.chainT<=0&&raidPh()!=='end'; }
function raidAttack(){
  if (RAID.cd>0||!raidCanAct()) return;
  const J=RD_JOB[JOB]||RD_JOB.knight, d=raidAim(J.rng); RAID.cd=J.cd;
  if (knight) knight.anim.once(J.anim,JOB==='knight'?2.4:2.6,true); raidAct(1);
  if (JOB==='archer'){ raidShoot(d,'arrow',J.dmg,true); try{ SFX.zap(); }catch(e){} return; }
  if (JOB==='mage'){ raidShoot(d,'orb',J.dmg,true); try{ SFX.zap(); }catch(e){} return; }
  try{ SFX.swing(0); }catch(e){} impactFx(P.x+d.x*1.4,1.1,P.z+d.z*1.4,0xfff1c4,1.6);
  if (d.boss) raidDeal(J.dmg);
}
function raidSkill(){
  if (RAID.scd>0||!raidCanAct()) return;
  const J=RD_JOB[JOB]||RD_JOB.knight, d=raidAim(JOB==='knight'?10:J.rng); RAID.scd=6; raidAct(2);
  if (knight) knight.anim.once(J.sanim,2.2,true);
  if (JOB==='knight'){ RAID.dash=.32; RAID.dashHit=false; RAID.dashDir={x:d.x,z:d.z}; try{ SFX.dodge(); }catch(e){} }
  else if (JOB==='archer'){ for (const a of [-.12,0,.12]){ const c=Math.cos(a), s=Math.sin(a); raidShoot({x:d.x*c-d.z*s,z:d.x*s+d.z*c},'arrow',10,true); } try{ SFX.zap(); }catch(e){} }
  else { fx.shock(P.x,P.z,5.2); fx.burst(P.x,1,P.z,0xc4b5fd,18,6); try{ SFX.thunder(); }catch(e){} if (Math.hypot(P.x,P.z)-RD_BR<5.4) raidDeal(40); }
}
function raidShoot(d,kind,dmg,mine,ox,oz){
  const x0=(ox!=null?ox:P.x)+d.x*.6, z0=(oz!=null?oz:P.z)+d.z*.6;
  let m; if (kind==='arrow'){ m=makeArrow(0); m.rotation.y=Math.atan2(d.x,d.z); } else { m=new THREE.Sprite(RAID.orbMat); m.scale.setScalar(1.5); }
  RAID.dyn.add(m); const spd=kind==='arrow'?26:22, rng=kind==='arrow'?20:15;
  RAID.proj.push({mesh:m,x:x0,z:z0,y:kind==='arrow'?1.25:1.3,vx:d.x*spd,vz:d.z*spd,life:rng/spd,mine,dmg,kind});
}
function raidProjTick(dt){
  const B=RAID.boss, live=B&&B.state!=='hidden'&&B.state!=='dead';
  RAID.proj=RAID.proj.filter(p=>{
    const ox=p.x, oz=p.z; p.x+=p.vx*dt; p.z+=p.vz*dt; p.life-=dt; p.mesh.position.set(p.x,p.y,p.z);
    let done=p.life<=0;
    if (!done && live && twSegDist(0,0,ox,oz,p.x,p.z)<RD_BR+.3){ done=true; if (p.mine) raidDeal(p.dmg); else raidBossFlash(.08);
      if (p.kind==='orb'){ fx.shock(p.x,p.z,2.4); fx.burst(p.x,1.4,p.z,0xa77bff,10,4); } else fx.burst(p.x,1.4,p.z,0xfff1a8,5,3); }
    if (done){ RAID.dyn.remove(p.mesh); return false; } return true; });
}
/* 보스에게 피해: 15% 치명타 · 보스가 쓰러져 있으면 2배 */
function raidDeal(base,o){
  o=o||{}; if (!raidCanDamage()) return 0;
  let d=base, crit=false; if (!o.blast && Math.random()<.15){ d*=1.6; crit=true; }
  if (!o.fixed && raidGroggy()) d*=2; d=Math.round(d);
  RAID.my.d+=d; raidBossFlash(o.blast?.4:.12);
  const B=RAID.boss, L=Math.hypot(P.x,P.z)||1, nx=o.blast?B.cp.x:P.x/L*(RD_BR+.4), nz=o.blast?B.cp.z:P.z/L*(RD_BR+.4);
  fx.num(nx,o.blast?Math.max(2,B.cp.y)+1:B.H*.42+rnd(-.4,.6),nz,(o.blast?'⚡':'')+d+(crit?'!':''),o.blast?'#ffd34d':crit?'#ffcf3a':'#ffffff',o.blast?2.2:crit?1.4:1.05);
  if (!o.blast){ try{ SFX.hit(crit); }catch(e){} }
  return d;
}
function raidBossFlash(k){ const B=RAID.boss; if (B) B.flash=Math.max(B.flash,k); }
/* 지식 폭발: 빛나는 구슬이 포물선을 그리며 보스에게 날아가요 */
function raidLaunchBlast(d,mine,R){
  const sx=mine?P.x:R.x, sz=mine?P.z:R.z;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:mine?0xffd34d:0xffe9a8,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  sp.scale.setScalar(mine?2.6:1.9); RAID.dyn.add(sp);
  RAID.bl.push({sp,sx,sz,t:0,dur:.62,d,mine,name:mine?myName():(R&&R.info&&R.info.n)||'친구'});
  if (mine){ RAID.bd=d; raidAct(5); const J=RD_JOB[JOB]||RD_JOB.knight; if (knight) knight.anim.once(J.up,2,true); try{ SFX.whoosh(); }catch(e){} fx.rise(P.x,P.z,0xffd34d,14); }
}
function raidBlastTick(dt){
  const B=RAID.boss;
  RAID.bl=RAID.bl.filter(b=>{
    b.t+=dt; const k=Math.min(1,b.t/b.dur), tx=B?B.cp.x:0, tz=B?B.cp.z:0, ty=B?Math.max(1.5,B.cp.y):5;
    const x=b.sx+(tx-b.sx)*k, z=b.sz+(tz-b.sz)*k, y=1.6+(ty-1.6)*k+Math.sin(Math.PI*k)*4.5; b.sp.position.set(x,y,z);
    if (Math.random()<.6) fx.burst(x,y,z,0xffd34d,1,1.2);
    if (k<1) return true;
    RAID.dyn.remove(b.sp); b.sp.material.dispose();
    if (b.mine){ const d=raidDeal(b.d,{blast:true,fixed:true}); if (d) raidFeed(`⚡ 나 · 지식 폭발 ${d.toLocaleString('ko-KR')}`,'#ffd34d'); }
    else { raidBossFlash(.3); if (B) fx.num(x+rnd(-1,1),y+.6,z+rnd(-1,1),'⚡'+b.d,'#ffe9a8',1.5); raidFeed(`⚡ ${b.name} · 지식 폭발 ${b.d.toLocaleString('ko-KR')}`,'#a78bfa'); }
    fx.burst(x,y,z,0xffd34d,b.mine?26:14,7); fx.shock(x,z,6.5); impactFx(x,y,z,0xffd34d,b.mine?3.4:2.4); shake=Math.max(shake,b.mine?.3:.1);
    try{ SFX.thunder(); }catch(e){}
    if (B&&B.state==='idle') B.c.anim.once('hit',1.3);
    return false; });
}
function raidStun(dx,dz,pow,sec){
  if (!raidVuln()) return false; const L=Math.hypot(dx,dz)||1;
  RAID.vx+=dx/L*pow; RAID.vz+=dz/L*pow; RAID.stunT=sec; RAID.invT=sec+1; RAID.hitT=.5;
  if (knight) knight.anim.once('hit',1.2,true); shake=Math.max(shake,.3); try{ SFX.hurt(); }catch(e){} fx.burst(P.x,1.2,P.z,0xffffff,10,4);
  return true;
}
/* 보스 공격에 맞으면 하트 −1 · 0개가 되면 쓰러져요 */
function raidHurt(dx,dz){
  if (!raidVuln()) return;
  RAID.hearts=Math.max(0,RAID.hearts-1); RAID.heartFx=performance.now();
  if (RAID.hearts<=0){ raidKO(dx,dz); return; }
  raidStun(dx,dz,11,1.1); raidSay(RAID.hearts===1?'💔 하트가 1개 남았어요! 조심해요':`💔 하트 −1 · 남은 하트 ${RAID.hearts}개`,1.4); raidFlush(true);
}
function raidKO(dx,dz,quiet){
  const now=performance.now();
  Object.assign(RAID,{ko:true,koAt:now,koQAt:now+(quiet?600:1600),hearts:0,stunT:0,downT:0,dash:0,chainT:0,resT:0,saveFor:'',saveT:0,qWant:false,pendBlast:null});
  raidChainBreak(true);
  const L=Math.hypot(dx,dz); if (L>.01){ RAID.vx+=dx/L*8; RAID.vz+=dz/L*8; }
  if (knight) knight.anim.die();
  if (!quiet){ shake=Math.max(shake,.45); try{ SFX.hurt(); SFX.crumble(); }catch(e){} fx.burst(P.x,1,P.z,0x9aa3b5,18,5);
    raidSay('💀 쓰러졌어요!',1.6); raidFeed(RAID.fr?'💀 나 · 쓰러졌어요 — 부활 문제를 맞혀 다시 일어나요':'💀 나 · 쓰러졌어요 — 친구가 옆에 오거나, 부활 문제를 맞히면 일어나요','#ef4444'); }
  RAID.sendT=0; raidFlush(true);
}
/* 다시 일어나기: 친구 구조(하트 2개 · 쉬움은 3개, 한 판에 1번) · 함께 문제 풀기(하트 3개) → 3초 보호막 */
function raidRevive(how,by){
  if (!RAID.ko) return;
  const friend=how==='friend', nm=friend?((RAID.pi[by]&&RAID.pi[by].n)||(RAID.rp[by]&&RAID.rp[by].info&&RAID.rp[by].info.n)||'친구'):'';
  RAID.ko=false; RAID.hearts=friend?(raidEasy()?RD_HEART:2):RD_HEART; RAID.resT=0; RAID.vx=RAID.vz=0; RAID.heartFx=performance.now();
  if (friend){ RAID.fr=true; RAID.sv=String(by||''); }
  RAID.invT=RD_GUARD; guardStart(RD_GUARD);
  if (knight) raidGetUp(knight);
  RAID.qReadyAt=Math.max(RAID.qReadyAt>1e14?0:RAID.qReadyAt,performance.now()+3000);
  raidSay(friend?`🩹 ${rdJ(nm,'이','가')} 구해 줬어요! 하트 ${RAID.hearts}개`:`📖 다 같이 맞혀서 다시 일어났어요! 하트 ${RAID.hearts}개`,2.6);
  raidFeed(friend?`🩹 나 · ${rdJ(nm,'이','가')} 구해 줬어요`:'📖 나 · 부활 게이지로 다시 일어났어요','#22c55e');
  try{ SFX.shield(); }catch(e){} fx.rise(P.x,P.z,0x7fe3ff,18);
  RAID.sendT=0; raidFlush(true);
}
/* 망각의 사슬: 4초 동안 못 움직여요. 사슬 문제를 맞히면 바로 풀려요 (하트는 안 줄어요) */
function raidChain(){
  if (!raidVuln()) return;
  RAID.chainT=RD_CHAIN; RAID.vx=RAID.vz=0; RAID.dash=0; RAID.hitT=.4; RAID.sendT=0;
  if (knight) knight.anim.once('hit',1.2,true); shake=Math.max(shake,.25); try{ SFX.block(); }catch(e){} fx.burst(P.x,1.2,P.z,0xb455ff,18,5);
  raidSay('⛓️ 망각의 사슬! 문제를 맞히면 바로 풀려요',1.8);
  const ox=RAID.items.filter(x=>x.kind==='ox'), item=ox.length?pickFrom(ox):pick(['mc','ox'],RAID.items);
  if (item && $('#quiz').hidden && !W.paused){ openQuiz(item,{type:'raidCh'}); const t=$('#qtag'); t.textContent='⛓️ 사슬 풀기 · 맞히면 바로 풀려요'; t.style.background='#7e22ce'; }
}
function raidChainBreak(quiet){
  if (RAID.chainFx) RAID.chainFx.visible=false;
  if (!quiet){ fx.burst(P.x,1.1,P.z,0xd8b4fe,20,6); try{ SFX.shield(); }catch(e){} }
}
function raidChainFxTick(){
  const on=RAID.chainT>0&&!RAID.ko;
  if (!on){ if (RAID.chainFx) RAID.chainFx.visible=false; return; }
  if (!RAID.chainFx){ const g=new THREE.Group();
    const m=new THREE.MeshBasicMaterial({color:0xc084fc,transparent:true,opacity:.85,depthWrite:false,toneMapped:false});
    [.55,1.05].forEach((y,i)=>{ const t=new THREE.Mesh(new THREE.TorusGeometry(.62,.07,6,24),m); t.rotation.x=Math.PI/2; t.position.y=y; t.rotation.z=i*.6; g.add(t); });
    const s=new THREE.Sprite(RAID.chainIcon); s.scale.set(1.1,1.1,1); s.position.y=3.2; s.renderOrder=7; g.add(s); pg.add(g); RAID.chainFx=g; }
  const g=RAID.chainFx, t=performance.now()/1000; g.visible=true; g.rotation.y=t*1.4; g.children[2].position.y=3.2+Math.sin(t*5)*.08;
}
/* 완벽 회피: 공격 표시 안에 있다가 제때 빠져나오면 지식 폭발 충전이 2초 빨라져요 (🏃 회피왕) */
function raidPerfect(){
  const now=performance.now(); RAID.my.pd++;
  let cut=false; if (RAID.qReadyAt>now && RAID.qReadyAt<1e14){ RAID.qReadyAt=Math.max(now,RAID.qReadyAt-2000); cut=true; }
  raidSay(cut?'✨ 완벽 회피! 지식 폭발 충전 −2초':'✨ 완벽 회피!',1.3); fx.burst(P.x,1.4,P.z,0x9fe6ff,14,5); try{ SFX.dodge(); }catch(e){}
  raidFlush(false);
}
function raidKnockDown(sec){
  if (RAID.downT>0||!RAID.on||RAID.ko) return; RAID.downT=sec; RAID.stunT=0; RAID.dash=0; RAID.chainT=0; raidChainBreak(true);
  const L=Math.hypot(P.x,P.z)||1; RAID.vx+=P.x/L*9; RAID.vz+=P.z/L*9; RAID.invT=sec+1;
  if (knight) knight.anim.die();
}
function raidMove(dt){
  RAID.cd=Math.max(0,RAID.cd-dt); RAID.scd=Math.max(0,RAID.scd-dt); RAID.invT=Math.max(0,RAID.invT-dt); RAID.hitT=Math.max(0,RAID.hitT-dt); RAID.stunT=Math.max(0,RAID.stunT-dt);
  if (RAID.downT>0){ RAID.downT-=dt; if (RAID.downT<=0){ RAID.downT=0; if (knight&&!RAID.ko) raidGetUp(knight); } }
  if (RAID.chainT>0){ RAID.chainT-=RAID.rdt; if (RAID.chainT<=0){ RAID.chainT=0; raidChainBreak(false); RAID.sendT=0; } }   // 4초가 지나면 저절로 풀려요 (실제 시간)
  let moving=false; const can=!W.paused&&RAID.downT<=0&&RAID.stunT<=0&&!RAID.ko&&RAID.chainT<=0;
  if (can && MOUSE.held) raidAttack();
  if (can && !(RAID.dash>0)){
    const am=arrowsMove(); let ix=(keys.KeyD||am&&keys.ArrowRight?1:0)-(keys.KeyA||am&&keys.ArrowLeft?1:0)+joy.x, iz=(keys.KeyS||am&&keys.ArrowDown?1:0)-(keys.KeyW||am&&keys.ArrowUp?1:0)+joy.y;
    const L=Math.hypot(ix,iz); if (L>.12){ if (L>1){ ix/=L; iz/=L; } P.x+=ix*7.2*dt; P.z+=iz*7.2*dt; if (!mouseAiming()&&!kbAimDir()){ P.fx=ix; P.fz=iz; } moving=true; }
    if (mouseAiming()&&!kbAimDir()){ const md=mouseAimDir(); if (md){ P.fx=md.x; P.fz=md.z; } } }
  if (RAID.dash>0){ RAID.dash-=dt; const d=RAID.dashDir; P.x+=d.x*19*dt; P.z+=d.z*19*dt; moving=true;
    if (!RAID.dashHit && Math.hypot(P.x,P.z)<RD_BR+1.4){ RAID.dashHit=true; raidDeal(36); impactFx(P.x+d.x,1.4,P.z+d.z,0xffd34d,2.6); RAID.dash=0; } }
  P.x+=RAID.vx*dt; P.z+=RAID.vz*dt; const fr=Math.exp(-5*dt); RAID.vx*=fr; RAID.vz*=fr;
  const d=Math.hypot(P.x,P.z); if (d>RD_R){ P.x*=RD_R/d; P.z*=RD_R/d; }
  const B=RAID.boss, minD=RD_BR+.6; if (B&&B.state!=='hidden'&&B.state!=='dead'&&d<minD){ if (d<.01){ P.x=0; P.z=minD; } else { P.x*=minD/d; P.z*=minD/d; } }
  return moving;
}
addEventListener('keydown',e=>{
  if (MAPK!=='raid'||W.state!=='play'||W.paused) return;
  if (e.target&&e.target.closest&&e.target.closest('input,textarea,select')) return;
  const k=e.code;
  if (k==='Space'){ MOUSE.kbT=performance.now(); raidAttack(); }
  else if (k==='KeyE'||k==='ShiftLeft'||k==='ShiftRight') raidSkill();
  else if (k==='KeyF'||k==='KeyQ') raidWantQuiz();
  else return;
  e.preventDefault(); e.stopImmediatePropagation();
},true);
canvas.addEventListener('contextmenu',e=>{ if (MAPK==='raid'&&W.state==='play'){ e.preventDefault(); raidSkill(); } });

/* ---------- 보스 공격 (모든 학생 화면에서 같은 때 · 같은 자리에 나와요: 판 시작 시각으로 정해요) ---------- */
/* 공격 종류: 0 내려찍기(원 3개) · 1 안쪽 고리 · 2 여섯 줄 · 3 바깥 고리 · 4 망각의 사슬(보라 원 5개) · 5 끌어당기기
   처음 세 번은 0~3만 나와요. 같은 공격이 두 번 이어지지 않게 해요. */
function raidPatK(i){ const h=stgHash(RAID.sk+':p'+i); return i<3?h%4:h%6; }
function raidPat(i){ const h=stgHash(RAID.sk+':p'+i), n=i<3?4:6; let k=raidPatK(i); if (i>0&&k===raidPatK(i-1)) k=(k+1)%n; return {i,k,h,a:((h>>>5)%3600)/3600*Math.PI*2}; }
function raidPatTel(k,rage){ return k===5?(rage?2:2.4):k===4?(rage?1.6:1.9):(rage?1.35:1.7); }   // 빨간 표시가 보이는 시간
function raidChainPos(p){ const out=[]; for (let j=0;j<5;j++){ const a=p.a+j*Math.PI*.4+((((p.h>>>(3+j*4))&15)/15)-.5)*.5, r=6.4+(((p.h>>>(9+j*3))&7)/7)*9.2; out.push([Math.sin(a)*r,Math.cos(a)*r]); } return out; }
function raidPull(dt){ const d=Math.hypot(P.x,P.z); if (d<RD_BR+.9||d>RD_R+.5) return; const s=RD_PULL_V*dt; P.x-=P.x/d*s; P.z-=P.z/d*s; }
function raidPatTick(dt){
  const T=RAID.tel; if (!T) return; T.cir.forEach(m=>{ m.visible=false; }); T.ring.visible=false; T.out.visible=false; T.lines.visible=false;
  T.chain.forEach(m=>{ m.visible=false; }); T.pull.visible=false; T.sw.forEach(m=>{ m.visible=false; });
  const B=RAID.boss; if (raidPh()!=='fight'||raidGroggy()||!B||B.state!=='idle') return;
  const ft=raidEl()-RD_INTRO-RD_PAT0; if (ft<0) return;
  const i=Math.floor(ft/RD_PAT), u=ft-i*RD_PAT, st=raidSt(), rage=!!(st&&st.mx&&st.hp<st.mx*.5), p=raidPat(i), TEL=raidPatTel(p.k,rage);
  if (u>TEL+.2) return;
  if (RAID.patAnim!==i && u>=TEL-.62){ RAID.patAnim=i; B.c.anim.once('slam',1.1,true); }
  if (p.k>=4 && RAID.patHint!==i && u<.6 && raidVuln()){ RAID.patHint=i; const n=RAID.hintN[p.k]=(RAID.hintN[p.k]|0)+1;   // 새 공격은 처음 두 번 알려 줘요
    if (n<=2) raidSay(p.k===5?'🌀 끌어당기기! 바깥쪽으로 달려요':'⛓️ 보라 바닥을 피해요 (사슬에 묶여요)',1.5); }
  if (u<TEL){ const k=u/TEL, blink=k>.78&&Math.sin(u*40)>0;
    T.mat.opacity=(.14+.36*k)*(blink?1.5:1); T.mat.color.setHex(blink?0xff8a8a:0xff3344);
    T.cmat.opacity=(.18+.4*k)*(blink?1.4:1); T.cmat.color.setHex(blink?0xe9c6ff:0xb455ff);
    if (p.k===0) T.cir.forEach((m,j)=>{ const a=p.a+j*2.0944; m.position.set(Math.sin(a)*8.2,.07,Math.cos(a)*8.2); m.scale.setScalar(.25+.75*Math.min(1,k*1.6)); m.visible=true; });
    else if (p.k===1) T.ring.visible=true;
    else if (p.k===2){ T.lines.rotation.y=p.a; T.lines.visible=true; }
    else if (p.k===3) T.out.visible=true;
    else if (p.k===4) raidChainPos(p).forEach((c,j)=>{ const m=T.chain[j]; m.position.set(c[0],.075,c[1]); m.scale.setScalar(.3+.7*Math.min(1,k*1.8)); m.visible=true; });
    else { T.pull.visible=true; T.smat.opacity=.55*(blink?1.3:1);   // 바깥에서 안쪽으로 줄어드는 고리 = 빨려 들어가요
      T.sw.forEach((m,j)=>{ const f=(u*.85+j/3)%1; m.scale.setScalar(RD_R-(RD_R-RD_BR-1)*f); m.visible=true; });
      if (u>.25 && raidVuln()) raidPull(dt||0); }
    if (u<TEL*.65 && raidVuln() && raidPatHit(p)) RAID.pdIn=i; }   // 처음에 공격 자리에 있었는지 (완벽 회피)
  else if (RAID.patDone!==i){ RAID.patDone=i; raidPatImpact(p); }
}
function raidPatHit(p){
  const d=Math.hypot(P.x,P.z);
  if (p.k===0){ for (let j=0;j<3;j++){ const a=p.a+j*2.0944, cx=Math.sin(a)*8.2, cz=Math.cos(a)*8.2; if (Math.hypot(P.x-cx,P.z-cz)<4.6) return [P.x-cx||.01,P.z-cz]; } return null; }
  if (p.k===1) return d<9?[P.x||.01,P.z]:null;
  if (p.k===3) return d>12.8?[-P.x,-P.z]:null;   // 바깥 충격파: 가운데 쪽으로 밀어요
  if (p.k===4){ for (const c of raidChainPos(p)) if (Math.hypot(P.x-c[0],P.z-c[1])<RD_CH_R+.2) return [P.x-c[0]||.01,P.z-c[1]]; return null; }
  if (p.k===5) return d<RD_PULL_R?[P.x||.01,P.z]:null;
  for (let j=0;j<6;j++){ const la=p.a+j*Math.PI/3, dx=Math.sin(la), dz=Math.cos(la), t=P.x*dx+P.z*dz; if (t<RD_BR-.5) continue;
    const cx=dx*t, cz=dz*t; if (Math.hypot(P.x-cx,P.z-cz)<1.65) return [(P.x-cx)||dz,(P.z-cz)||-dx]; }
  return null;
}
function raidPatImpact(p){
  const near=Math.hypot(P.x,P.z)<16; shake=Math.max(shake,near?.35:.15); try{ SFX.boom(); }catch(e){}
  if (p.k===0) for (let j=0;j<3;j++){ const a=p.a+j*2.0944, x=Math.sin(a)*8.2, z=Math.cos(a)*8.2; fx.shock(x,z,4.6); fx.burst(x,.4,z,0xc9b29a,14,6); }
  else if (p.k===1){ fx.shock(0,0,9); fx.burst(0,.5,0,0xc9b29a,22,8); }
  else if (p.k===3){ for (let j=0;j<10;j++){ const a=j/10*6.283; fx.burst(Math.sin(a)*18.5,.5,Math.cos(a)*18.5,0xc9b29a,5,5); } fx.shock(0,0,RD_R); }
  else if (p.k===4) raidChainPos(p).forEach(c=>{ fx.shock(c[0],c[1],RD_CH_R); fx.burst(c[0],.5,c[1],0xb455ff,10,5); });
  else if (p.k===5){ fx.shock(0,0,RD_PULL_R); fx.shock(0,0,RD_PULL_R*.6); fx.burst(0,.6,0,0xd946ef,26,9); }
  else for (let j=0;j<6;j++){ const la=p.a+j*Math.PI/3; for (let r=6;r<RD_R;r+=5) fx.burst(Math.sin(la)*r,.4,Math.cos(la)*r,0xff6b5b,4,4); }
  const v=raidVuln(), hit=v?raidPatHit(p):null;
  if (hit){ if (p.k===4) raidChain(); else raidHurt(hit[0],hit[1]); }
  else if (v && RAID.pdIn===p.i) raidPerfect();
}

/* ---------- 보스 모습 (상태: 숨음 · 솟아오름 · 서 있음 · 기 모으기 · 쓰러짐 · 쓰러뜨림 · 버텨 냄) ---------- */
function raidBossWant(){
  const ph=raidPh(), st=raidSt();
  if (ph==='gone'||ph==='wait') return 'hidden';
  if (ph==='intro'||ph==='load') return 'rise';
  if (ph==='end'){ const e=st&&st.end; return (e&&e.win)||(st&&st.hp<=0)?'dead':'win'; }
  if (raidGroggy()) return 'down';
  return ph==='atk'?'charge':'idle';
}
function raidBossState(B,s,quiet){
  const was=B.state; if (was===s) return; B.state=s; const A=B.c.anim;
  if (s==='hidden'){ B.g.visible=false; B.y=-B.H; A.revive(); B.taunted=false; B.deadT=0; B.orb.visible=B.core.visible=false; B.motes.forEach(m=>{ m.s.visible=false; }); B.stars.visible=false; return; }
  B.g.visible=true;
  if (s==='rise'){ A.revive(); A.once('spawn',1,true); B.taunted=false; }
  else if (s==='idle'){ if (A.dead) raidGetUp(B.c,'idle'); else A.setBase('idle'); B.y=0; }
  else if (s==='charge'){ if (A.dead) raidGetUp(B.c,'summon'); else { A.lock=false; A.setBase('summon'); } B.y=0; }
  else if (s==='down'){ A.die(); B.y=0; try{ SFX.crumble(); }catch(e){} }
  else if (s==='dead'){ if (!A.dead) A.die(); B.deadT=0; B.y=0; if (!quiet){ try{ SFX.kill(); SFX.cheer(); }catch(e){} shake=Math.max(shake,.8); } }
  else if (s==='win'){ const up=A.dead; if (up) raidGetUp(B.c,'idle'); else A.setBase('idle'); setTimeout(()=>{ if (B.state==='win') A.once('taunt',1,true); },up?1700:400); B.y=0; }
  if (s!=='charge'){ B.orb.visible=B.core.visible=false; B.motes.forEach(m=>{ m.s.visible=false; }); }
}
function raidBossTick(dt){
  const B=RAID.boss; if (!B) return; raidBossState(B,raidBossWant());
  if (B.state==='hidden') return;
  const A=B.c.anim, st=raidSt(), now=raidSrv();
  if (B.state==='rise'){ const el=raidEl(), k=Math.max(0,Math.min(1,(el-1)/4)); B.y=-B.H*(1-k)*(1-k);
    if (k>0&&k<1&&Math.random()<.5){ const a=rnd(0,6.28); fx.burst(Math.sin(a)*RD_BR,.3,Math.cos(a)*RD_BR,0xa89c8c,3,4); shake=Math.max(shake,.08); }
    if (k>=1&&!B.taunted&&el>5.4){ B.taunted=true; A.once('taunt',1,true); shake=Math.max(shake,.5); try{ SFX.drum(); }catch(e){} } }
  if (B.state==='dead'){ B.deadT+=dt; if (B.deadT>1.6) B.y=-Math.min(B.H,(B.deadT-1.6)*1.6); if (B.deadT<3&&Math.random()<.5) fx.burst(rnd(-2,2),rnd(1,B.H),rnd(-2,2),[0xffd34d,0xff6b8b,0x7ee0ff,0xb48cff][Math.floor(rnd(0,4))],3,5); }
  B.g.position.y=B.y;
  // 내 쪽을 봐요 (쓰러져 있을 때는 그대로)
  if (B.state==='idle'||B.state==='charge'||B.state==='win'||B.state==='rise'){ const want=Math.atan2(P.x,P.z); let df=want-B.face; df=Math.atan2(Math.sin(df),Math.cos(df)); B.face+=Math.max(-dt*1.6,Math.min(dt*1.6,df)); B.c.root.rotation.y=B.face; }
  // 번쩍 (맞았을 때) · 나를 가리면 반투명
  B.flash=Math.max(0,B.flash-dt*2.2); const fl=Math.min(1,B.flash*2.2);
  const hide=P.z<0&&P.z>-6.2&&Math.abs(P.x)<3.8&&B.state!=='down'&&B.state!=='dead', fo=hide?.4:1;   // 보스 바로 뒤(북쪽)에 서면 보스를 반투명하게 B.fade+=(fo-B.fade)*Math.min(1,dt*6);
  const em=(B.state==='charge'?0x2a0a4a:0)|0;
  for (const m of B.mats){ if (m.emissive){ if (fl>0) m.emissive.setRGB(fl,fl*.9,fl*.75); else m.emissive.setHex(em); } m.opacity=B.state==='dead'&&B.deadT>1.6?Math.max(0,1-(B.deadT-1.6)/3):B.fade; m.depthWrite=B.fade>.9; }
  B.aura.material.opacity=(B.state==='charge'?.75:.38)+Math.sin(performance.now()/300)*.12; B.aura.material.color.setHex(B.state==='down'?0x7ec8ff:B.state==='charge'?0xd946ef:0xb48cff);
  // 기절 별
  B.stars.visible=B.state==='down'; if (B.stars.visible){ const t=performance.now()/1000; if (B.head) B.head.getWorldPosition(B.hp); else B.hp.set(0,2,0); B.stars.position.set(B.hp.x+Math.sin(t*3)*1.4,B.hp.y+1.8,B.hp.z+Math.cos(t*3)*1.4); }
  if (B.chest) B.chest.getWorldPosition(B.cp); else B.cp.set(0,B.H*.55,0);
  // 망각의 구슬 (전체 공격을 모으는 중)
  if (B.state==='charge'){ const k=st&&st.au>st.as?Math.max(0,Math.min(1,(now-st.as)/(st.au-st.as))):.5, r=.9+2.4*k, y=B.H+1.4+r*.6, t=performance.now()/1000;
    B.orb.visible=B.core.visible=true; B.orb.scale.setScalar(r*(1+Math.sin(t*9)*.04)); B.orb.position.set(0,y,0); B.core.position.set(0,y,0); B.core.scale.setScalar(r*3.2);
    B.motes.forEach(m=>{ m.s.visible=true; m.r-=dt*m.sp*2.2; if (m.r<r*.8){ m.r=rnd(6,10); m.y=rnd(0,5); m.a=rnd(0,6.28); } m.a+=dt*m.sp; m.s.position.set(Math.sin(m.a)*m.r,y-2+m.y*(m.r/10),Math.cos(m.a)*m.r); });
    if (Math.random()<.3) fx.burst(rnd(-r,r),y,rnd(-r,r),0xc084fc,1,1); }
  B.c.mixer.update(dt);
}
function raidWorldTick(dt){
  const t=performance.now()/1000; RAID.flames.forEach((f,i)=>{ f.scale.set(1,1+Math.sin(t*9+i*1.7)*.12+Math.sin(t*23+i)*.06,1); });
  const B=RAID.boss, st=B?B.state:'hidden', R=RAID.rune;
  if (R){ R.rotation.z+=dt*(st==='charge'?.9:.15); R.material.opacity=st==='charge'?.85+Math.sin(t*6)*.12:st==='hidden'?.45+Math.sin(t*2)*.15:.5;
    R.material.color.setHex(st==='down'?0x7ec8ff:st==='charge'?0xd946ef:0x9b6bff); }
  document.body.classList.toggle('rdstorm',st==='charge');
}

/* ---------- 화면 (위: 보스 체력 · 아래: 내 칸 · 오른쪽: 순위 · 왼쪽: 소식) ---------- */
const rdH=(sel,h)=>{ const e=$(sel); if (e&&e._h!==h){ e._h=h; e.innerHTML=h; } };
function raidSay(m,sec){ const e=$('#rdToast'); if (!e) return; e.textContent=m; e.hidden=false; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); RAID.sayT=performance.now()+sec*1000; }
function raidFeed(m,c){ const box=$('#rdFeed'); if (!box||!m) return; const d=document.createElement('div'); d.className='tw-feed-i'; d.style.borderColor=c||'#8a93a5'; d.textContent=m; box.prepend(d); while (box.children.length>6) box.lastChild.remove(); setTimeout(()=>d.classList.add('old'),6000); }
const rdNum=v=>Math.max(0,Math.round(v)).toLocaleString('ko-KR');
const rdClock=s=>{ s=Math.max(0,Math.ceil(s)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
function raidHUD(){
  const m=RAID.meta, st=raidSt(), ph=raidPh(), now=performance.now();
  const mx=(st&&st.mx)||(m&&m.hp)||1;
  let hp=st?Math.max(0,st.hp-(RAID.my.d-RAID.sentD)):mx;   // 아직 안 보낸 내 피해는 미리 깎아서 보여요
  if (RAID.hpKey===RAID.sk&&RAID.hpShow>0&&hp>RAID.hpShow) hp=RAID.hpShow; RAID.hpShow=hp; RAID.hpKey=RAID.sk;
  if (ph==='wait'||ph==='gone') hp=mx;
  const pc=Math.max(0,Math.min(100,hp/mx*100)); setWid($('#rdHpI'),pc); setWid($('#rdHpLag'),pc);
  setTxt($('#rdHpT'),ph==='wait'?'보스가 잠들어 있어요':`${rdNum(hp)} / ${rdNum(mx)}`);
  const left=st&&st.left!=null?st.left:(m&&m.dur)||0; setTxt($('#rdTime'),ph==='wait'||!left&&!st?'⏱ 준비':'⏱ '+rdClock(left)); $('#rdTime').classList.toggle('hurry',ph!=='wait'&&ph!=='intro'&&left<=30);
  setTxt($('#rdPpl'),`👥 ${Object.keys(RAID.rp).length+1}명`);
  let chip='', cc='';
  if (raidGroggy()){ chip=`💫 보스가 쓰러졌어요! 피해 2배 · ${Math.ceil((st.gro-raidSrv())/1000)}초`; cc='gro'; }
  else if (ph==='fight'&&st&&st.hp<st.mx*.5){ chip='😡 보스가 화났어요! 바닥 공격이 빨라져요'; cc='rage'; }
  else if (ph==='fight'){ chip='빨간 바닥을 피하며 공격! 문제를 맞히면 ⚡지식 폭발 · 보라 바닥은 사슬'; }
  const ce=$('#rdChip'); setTxt(ce,chip); setHid(ce,!chip); if (ce&&ce._c!==cc){ ce._c=cc; ce.className='rd-chip '+cc; }
  // 전체 공격 막기 게이지
  const ae=$('#rdAtk');
  if (st&&(ph==='atk'||(ph==='res'&&now<RAID.sayT+1500))){ const th=(m&&m.th)||60, np=Math.max(1,st.np|0), r=Math.round((st.ac|0)/np*100);
    setHid(ae,false); const cls='rd-atk card'+(ph==='res'?(st.ok?' ok':' bad'):''); if (ae.className!==cls) ae.className=cls;
    setTxt($('#rdAtkT'),ph==='res'?(st.ok?'🛡️ 막았다!':'💥 막지 못했어요'):`🌀 망각의 폭풍 · ${Math.max(0,Math.ceil((st.au-raidSrv())/1000))}초`);
    setWid($('#rdAtkI'),Math.min(100,r)); const s=$('#rdAtkS'); if (s&&s._th!==th){ s._th=th; s.style.left=th+'%'; }
    setTxt($('#rdAtkN'),`정답 ${st.ac|0} / ${np}명 (${r}%) · 목표 ${th}%`+(ph==='atk'?` · 답한 학생 ${st.an|0}명`:'')); }
  else setHid(ae,true);
  // 내 칸: 하트 · 지식 폭발 · 스킬 · 레이드 점수 · 정답 · 피해량
  const hurt=now-RAID.heartFx<650;
  rdH('#rdHeart',RAID.ko?'<b class="ko">💀</b><small>쓰러짐</small>':`<span>${[...Array(RD_HEART)].map((_,i)=>`<i class="${i<RAID.hearts?'on':''}">❤️</i>`).join('')}</span><small>하트</small>`);
  const he=$('#rdHeart'); if (he){ const hc='rd-hearts'+(RAID.ko?' ko':'')+(hurt?' hurt':'')+(!RAID.ko&&RAID.hearts===1?' low':''); if (he.className!==hc) he.className=hc; }
  let qh, qc='rd-slot';
  if (RAID.ko){ qh='<b>📖</b><small>부활 문제 풀기</small>'; qc+=' ko'; }
  else if (RAID.chainT>0){ qh=`<b>⛓️ ${Math.ceil(RAID.chainT)}</b><small>사슬에 묶였어요</small>`; qc+=' cd'; }
  else if (ph==='atk'){ qh='<b>🌀</b><small>폭풍 막는 중</small>'; qc+=' cd'; }
  else if (!(ph==='fight'||ph==='res')){ qh='<b>⚡</b><small>지식 폭발</small>'; qc+=' cd'; }
  else if (!$('#quiz').hidden){ qh='<b>📖</b><small>문제 푸는 중</small>'; }
  else if (!RAID.qReadyAt||now<RAID.qReadyAt){ const w=RAID.qReadyAt?(RAID.qReadyAt-now)/1000:0; qh=`<b>${w>0&&w<60?Math.ceil(w):'…'}</b><small>⚡ 지식 폭발 충전${RAID.streak>=2?` · 🔥${RAID.streak}`:''}</small>`; qc+=' cd'; }
  else { qh=`<b>⚡ F</b><small>준비! ${Math.max(0,Math.ceil((RAID.qReadyAt+RD_QAUTO*1000-now)/1000))}초 뒤 문제</small>`; qc+=' ready'; }
  rdH('#rdQ',qh); const qe=$('#rdQ'); if (qe.className!==qc) qe.className=qc;
  const J=RD_JOB[JOB]||RD_JOB.knight; rdH('#rdSk',`<b>${RAID.scd>0?Math.ceil(RAID.scd):'E'}</b><small>${J.sk}</small>`); $('#rdSk').classList.toggle('cd',RAID.scd>0);
  const myS=raidScore(RAID.my);
  setTxt($('#rdMyP'),rdNum(myS)); setTxt($('#rdMyC'),`${RAID.my.c}/${RAID.my.a}`); setTxt($('#rdMyD'),rdNum(RAID.my.d));
  // 순위 (선생님 화면이 보내요) · 레이드 점수
  const top=(st&&st.top)||[], me=STUDENT?+STUDENT.num:-1;
  rdH('#rdRankL',top.length?top.map((t,i)=>`<li class="${+t[0]===me?'me':''}"><b>${i+1}</b><span>${esc(String(t[1]||''))}</span><em>${rdNum(t[2])}</em></li>`).join(''):'<li class="none"><span>아직 기록이 없어요</span></li>');
  setTxt($('#rdRankMe'),RAID.rank?`나: ${RAID.rank}위 · ${rdNum(myS)}점`:`나: ${rdNum(myS)}점`);
  // 상황 안내 (쓰러짐 · 친구 구하기 · 사슬)
  let help='', hcl='rd-help';
  if (ph==='fight'||ph==='atk'||ph==='res'){
    const rn=st&&st.rn|0, rp=Math.min(rn,st&&st.rp|0), gauge=rn?` · 📖 다 같이 맞힌 부활 문제 <b>${rp}/${rn}</b>`:'';
    if (RAID.ko){ hcl+=' ko';
      if (RAID.resT>0&&!RAID.fr){ const nm=(RAID.pi[RAID.resBy]&&RAID.pi[RAID.resBy].n)||'친구'; const lf=RD_RESC-RAID.resT; help=`🩹 <b>${esc(rdJ(nm,'이','가'))}</b> 구하는 중… `+(lf>.05?`${lf.toFixed(1)}초`:'곧 일어나요!'); hcl+=' save'; }
      else help=(RAID.fr?'💀 쓰러졌어요 · 부활 문제를 맞혀 다시 일어나요':'💀 쓰러졌어요 · 🩹 친구가 옆에 2초 서 있으면 일어나요')+gauge; }
    else if (RAID.saveFor){ const R=RAID.rp[RAID.saveFor], nm=(R&&R.info&&R.info.n)||'친구'; const lf=RD_RESC-RAID.saveT; help=`🩹 <b>${esc(rdJ(nm,'을','를'))}</b> 구하는 중… `+(lf>.05?`${lf.toFixed(1)}초 · 옆에 서 있어요`:'곧 일어나요!'); hcl+=' save'; }
    else if (RAID.chainT>0) help='⛓️ 망각의 사슬! 사슬 문제를 맞히면 바로 풀려요';
  }
  const hp2=$('#rdHelp'); if (hp2){ setHid(hp2,!help); if (help){ rdH('#rdHelp',help); if (hp2.className!==hcl) hp2.className=hcl; } }
  document.body.classList.toggle('rdko',RAID.ko&&ph!=='end');
  if (RAID.ko && !$('#quiz').hidden && Q.source && Q.source.type==='raidKO') raidKOTag();
  // 기다리는 중 · 시작 전 안내
  const w=$('#rdWait');
  if (ph==='wait'){ setHid(w,false); rdH('#rdWait',`<b>🐉 보스 레이드</b><p>선생님이 곧 시작해요 · WASD 이동 · 스페이스/클릭 공격 · E 스킬</p><p>문제를 맞히면 <b>⚡ 지식 폭발</b>이 보스에게 날아가요. 빨리 · 연속으로 맞힐수록 세요! 틀려도 벌칙은 없어요.</p><p>❤️ 하트 3개 · 빨간 바닥에 맞으면 하트 −1 · 다 잃으면 쓰러져요 → 🩹 친구가 옆에 2초 서 있거나(한 판에 1번) 📖 쓰러진 친구들과 함께 문제를 맞히면 일어나요</p>`); }
  else if (ph==='intro'){ setHid(w,false); rdH('#rdWait',`<b>${Math.max(1,Math.ceil(RD_INTRO-raidEl()))}</b><p>${RD_NAME}이 깨어나요! 빨간 바닥은 피하세요 · ❤️ 하트 3개</p>`); }
  else if (ph==='load'){ setHid(w,false); rdH('#rdWait','<b>불러오는 중…</b><p>선생님 화면과 연결하고 있어요</p>'); }
  else setHid(w,true);
  if (RAID.sayT&&now>RAID.sayT){ RAID.sayT=0; const e=$('#rdToast'); if (e) e.hidden=true; }
}

/* ---------- 매 프레임 ---------- */
function raidFrame(dt,real,now){
  if (knight && RAID.downT<=0 && !RAID.ko && (knight.anim.dead||endPose)){ knight.anim.revive(); endPose=false; }   // 지난 판에서 쓰러진 자세가 남지 않게
  if (!W.paused) W.t+=dt;
  RAID.rdt=Math.min(.25,Math.max(0,(now-(RAID.lastNow||now))/1000)); RAID.lastNow=now;   // 실제로 흐른 시간 (dt는 0.05초에서 잘려요)
  lobbyTick(real,dt); raidSessionCheck();
  const ph=raidPh(); let moving=false;
  if (ph!=='end'&&ph!=='gone'){ moving=raidMove(dt); raidSend(dt); }
  raidQuizTick(); raidResultAutoClose();
  raidProjTick(dt); raidBlastTick(dt); raidRemoteTick(dt); raidRescueTick(); raidBossTick(dt); raidPatTick(dt); raidWorldTick(dt); raidChainFxTick();
  raidFlush(false);
  if (ph==='end'&&!RAID.endShown) raidShowEnd();
  if (RAID.endShown&&!$('#rdEnd').hidden&&performance.now()-RAID.endAt>30000) raidFinish();   // 30초 지나면 알아서 결과로
  pg.position.set(P.x,0,P.z); { let dy=Math.atan2(P.fx,P.fz)-pg.rotation.y; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); pg.rotation.y+=dy*Math.min(1,dt*14); }
  if (knight){ if (RAID.downT<=0&&!knight.anim.dead) setBaseSynced(knight.anim,moving?'run':'idle',moving?1.15:1); knight.mixer.update(dt); }
  for (const c of clouds){ c.position.x+=c.userData.v*dt; if (c.position.x>130) c.position.x=-130; }
  fx.update(dt); updateCombatFx(dt); updateDreamy(real); qualityTick(now);
  { const o=sun.userData.off||[22,38,14]; sun.position.set(P.x+o[0],o[1],P.z+o[2]); sun.target.position.set(P.x,0,P.z); sun.target.updateMatrixWorld(); }
  // 카메라: 나를 따라가되 보스 쪽으로 조금 당겨서 보스가 화면 안에 잘 보이게
  const dB=Math.hypot(P.x,P.z)||1, sh=Math.min(4.5,dB*.28), cx=P.x-P.x/dB*sh, cz=P.z-P.z/dB*sh;
  const snap=W.snapCam, ck=snap?1:Math.min(1,dt*5); W.snapCam=false;
  RAID.cam.set(cx,20.5,cz+10.5); camera.position.lerp(RAID.cam,ck); RAID.look.lerp(RAID.lookT.set(cx,1,cz-1.2),ck); camera.lookAt(RAID.look);
  if (shake>0){ shake=Math.max(0,shake-dt); camera.position.x+=rnd(-1,1)*shake*.6; camera.position.y+=rnd(-1,1)*shake*.6; }
  raidHUD(); renderFrame();
}

/* ---------- 끝: 반 전체 결과 · 순위 · MVP ---------- */
function raidShowEnd(){
  if (RAID.endShown) return; RAID.endShown=true; RAID.endAt=performance.now(); raidFlush(true); raidQuizAbort();
  const st=raidSt()||{}, e=st.end||{}, win=!!e.win||(st.hp!=null&&st.hp<=0); RAID.win=win;
  const mx=e.mx||st.mx||1, me=STUDENT?+STUDENT.num:-1;
  $('#rdEndT').innerHTML=win?`🎉 ${RD_NAME} 토벌 성공!`:'⏰ 시간 종료 · 보스가 버텨 냈어요';
  $('#rdEndS').innerHTML=win?'반 전체 승리! 모두 <b>코인 +30</b>을 받아요':`보스 체력이 <b>${Math.round((e.hp!=null?e.hp:st.hp||0)/mx*100)}%</b> 남았어요 · 참여 코인 +5`;
  $('#rdEndL').innerHTML=(e.top||st.top||[]).slice(0,5).map((t,i)=>`<li class="${+t[0]===me?'me':''}"><b>${i+1}</b><span>${esc(String(t[1]||''))}</span><em>${rdNum(t[2])}</em></li>`).join('');
  const mv=e.mvp||{}, row=(k,ic,lab)=>mv[k]?`<li><b>${ic} ${lab}</b><span>${esc(String(mv[k][0]||''))}</span><em>${esc(String(mv[k][1]||''))}</em></li>`:'';
  $('#rdEndM').innerHTML=row('cor','✅','정답왕')+row('dmg','💥','최고 피해')+row('fast','⚡','번개 손')+row('guard','🛡️','수호자')+row('save','🩹','구조왕')+row('dodge','🏃','회피왕');
  $('#rdEndMe').textContent=`내 레이드 점수 ${rdNum(raidScore(RAID.my))}점${RAID.rank?` (${RAID.rank}위)`:''} · 맞힌 문제 ${RAID.my.c}개 · 보스 피해 ${rdNum(RAID.my.d)}`;
  $('#rdEnd').hidden=false; setHid($('#rdWait'),true); setHid($('#rdAtk'),true);
}
function raidFinish(){
  $('#rdEnd').hidden=true; if (W.state!=='play'||MAPK!=='raid') return;
  raidQuizAbort(); raidFlush(true);
  W.kills=0; W.cardCoins=(W.cardCoins||0)+(RAID.win?30:5);   // 반 전체 보상 (모두 같아요)
  try{ fbDb.ref(`raid/${RAID.cid}/pl/${myUid()}`).remove(); }catch(e){}
  endGame(!!RAID.win);
}
function raidEndUI(){
  document.body.classList.remove('raidmode','rdstorm');
  ['#rdTop','#rdMe','#rdRank','#rdFeed','#rdWait','#rdEnd','#rdAtk','#rdToast','#rdHelp'].forEach(s=>{ const e=$(s); if (e) e.hidden=true; });
  document.body.classList.remove('rdko'); if (RAID.chainFx) RAID.chainFx.visible=false;
  raidOff();
}
$('#raidBtn')&&$('#raidBtn').addEventListener('click',raidJoin);
$('#rdEndGo')&&$('#rdEndGo').addEventListener('click',raidFinish);
