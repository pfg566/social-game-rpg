/* 사회 게임 RPG · 🍰 디저트 카페 · 손님 주문서(문제)를 보고 정답 재료로 디저트를 만들어 서빙해요
   한 주문 = 4지선다 1개(재료 선반) + O/X 1개(토핑대) → 오븐 → 카운터에서 서빙. 답이 맞았는지는 서빙할 때 손님 반응으로 알 수 있어요.
   재미 요소: 오븐 굽기 타이밍(금색에서 스페이스 → 완벽 굽기) · 🥄 맛보기(서빙 전에 맞았는지 확인, 한 주문 1번) ·
   👑 VIP(팁 2배) · 🎉 해피 아워(40초 팁 1.5배) · 👭 친구 두 명(케이크 2개) · 🔁 다시 찾아온 손님(내가 틀린 문제를 그 손님이 다시 주문)
   몬스터 · 쓰러짐이 없는 평화 모드예요. 파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
const CF_SHELF=[{x:-6.6,c:'#ff6b8a',n:'딸기',hex:0xff6b8a},{x:-2.2,c:'#8b5a3c',n:'초콜릿',hex:0x8b5a3c},{x:2.2,c:'#e0a800',n:'레몬',hex:0xffd84a},{x:6.6,c:'#6c5ce7',n:'블루베리',hex:0x7c6cf0}];
const CF_PAD_Z=-5.9, CF_OX=[{x:-8.7,z:-2.85,c:'#e5484d',n:'O 체리'},{x:-8.7,z:-.3,c:'#22a35a',n:'X 민트'}], CF_OVEN={x:-9.3,z:-5.6}, CF_SERVE={x:4.0,z:-1.0};
// 가게 구조: 뒤쪽 벽 = 재료 가판대 4곳, 왼쪽 구석 = 벽돌 오븐, 왼쪽 벽 = 토핑대, 오른쪽 = L자 픽업 카운터, 그 너머 = 손님 자리 (그림은 04d-cafe-art.js)
// 손님은 뒷벽 문으로 들어와 러그 위에 줄을 서고(맨 앞이 카운터), 디저트를 받으면 앞쪽 손님 자리로 가요. 기다리다 지친 손님은 다시 문으로 나가요
const CF_SLOT=[{x:8.3,z:-1.0,ry:-1.25},{x:10.15,z:-3.5,ry:-.75},{x:11.0,z:-6.0,ry:-.35}], CF_DOOR={x:10.8,z:-11.4}, CF_DOORIN={x:10.8,z:-8.5};
const CF_OUT=[[8.6,1.6],[8.6,12]], CF_BACK=[[10.8,-8.5],[10.8,-11.6]];
// 지나갈 수 없는 가구 (x0,x1,z0,z1): 가판대 · 냉장고 · 토핑대 · 앞 카운터 · 픽업 카운터 2칸 · 칸막이, 그리고 둥근 오븐
const CF_BOX=[[-8.8,8.8,-9.8,-8.45],[-12.4,-11.2,-6.0,-4.3],[-12.4,-10.66,-4.25,2.6],[-12.4,7.2,2.6,3.8],[5.4,7.2,-4.3,2.6],[7.2,8.9,-4.3,-2.5],[8.84,9.2,-9.8,-4.3]];
const CF_ROUND=[{x:-10.8,z:-8.3,r:1.86}];
const CF_LV={easy:{n:8,pat:95,gap:11},normal:{n:10,pat:80,gap:10},hard:{n:12,pat:66,gap:9},hero:{n:14,pat:54,gap:8}};
const CF_WAITK=1/3;            // 줄 서 있는 손님은 메뉴판을 보며 1/3 속도로만 기다려요 (맨 앞 손님만 제 속도)
const CF_BAKE_T=3.0;           // 오븐 바늘이 끝까지 가는 시간(초)
function cfMild(){ return MODE!=='hero'&&((EASEF&&EASEF.quiz>1)||LEVEL==='easy'); }   // 쉬운 반 · 쉬움 단계: 탄 케이크 벌칙 없음
function cfGold(){ return MODE==='hero'?[.64,.8]:cfMild()?[.55,.86]:[.6,.84]; }       // 금색(완벽 굽기) 구간
function cfHappy(){ return W.t<(CAFE.happy||0); }
const CF_GUEST=['mage','rogue','barbarian'];
const CAFE={root:null,dyn:null,panels:[],oxPanels:[],cust:[],spawned:0,n:10,lv:null,nextSpawn:0,step:'',pick:{mc:null,ox:null},stand:null,standT:0,bake:0,carry:null,
  tips:0,served:0,perfect:0,lost:0,combo:0,maxCombo:0,scores:[],res:null,id:0,cols:[],help:0};

function buildCafe(){
  const root=new THREE.Group(); CAFE.root=root; scene.add(root);
  const A=cfArt(root);   // 가게 그림 (04d-cafe-art.js)
  CAFE.ovenGlow=A.glow; CAFE.ovenHalo=A.halo; CAFE.door=A.door; CAFE.doorA=0;
  // 답 발판: 재료 4칸 · 토핑 O/X · 오븐 · 서빙
  CF_SHELF.forEach((s,i)=>cfPad(root,s.x,CF_PAD_Z,s.hex,i));
  CF_OX.forEach((o,i)=>cfPad(root,o.x,o.z,i?0x22a35a:0xe5484d,i?'X':'O'));
  cfPad(root,CF_OVEN.x,CF_OVEN.z,0xff8a3d,'flame');
  cfPad(root,CF_SERVE.x,CF_SERVE.z,0xffb800,'bell');
  CAFE.cols=[];
  CAFE.dyn=new THREE.Group(); root.add(CAFE.dyn);
}
function cfPad(root,x,z,hex,kind){
  const pad=new THREE.Mesh(new THREE.CircleGeometry(1.3,48),new THREE.MeshBasicMaterial({map:cfaPadTex(kind,hex),transparent:true,depthWrite:false,toneMapped:false}));
  pad.rotation.x=-Math.PI/2; pad.position.set(x,.025,z); pad.renderOrder=1; root.add(pad);
  return pad;
}
MAP_BUILD.cafe=()=>buildCafe();
GRASS_OK.cafe=null;

/* 가판대 위에 매달린 주문 판 (주문이 바뀔 때마다 보기 글씨를 새로 그려서 나무 틀 앞에 붙여요) */
function cfPanel(i,tex){ const n=CF_BOARD, m=new THREE.Mesh(new THREE.PlaneGeometry(n.w,n.h),new THREE.MeshBasicMaterial({map:tex,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-8}));
  m.position.set(CF_SHELF[i].x,n.y+Math.sin(n.tilt)*.015,n.z+Math.cos(n.tilt)*.015); m.rotation.x=-n.tilt; CAFE.dyn.add(m); return m; }
function cfClearPanels(){ for (const m of [...CAFE.panels,...CAFE.oxPanels]){ CAFE.dyn.remove(m); m.material.map&&m.material.map.dispose(); m.material.dispose(); m.geometry.dispose(); } CAFE.panels=[]; CAFE.oxPanels=[]; }

/* 손님: 우리 반 친구들 캐릭터(이름 · 직업 · 차림)가 손님으로 와요. 친구 정보가 없으면 무작위로 꾸민 손님 */
const CF_NAMES=['단골손님','동네 주민','여행객','이웃집 친구','배고픈 손님','디저트 탐험가','산책하던 손님','카페 순례자'];
function cfLoadClass(){
  CAFE.pool=[]; if (!(fbDb&&AUTHMODE==='student'&&STUDENT)) return;
  const me=String(STUDENT.num);
  fbDb.ref(`pubcard/${STUDENT.cid}`).once('value').then(s=>{ const v=s.val()||{};
    CAFE.pool=Object.keys(v).filter(k=>k!==me&&v[k]&&v[k].n).map(k=>v[k]).sort(()=>Math.random()-.5); }).catch(()=>{});
}
function cfLookFix(job,l){
  const L={...DEFAULTS[job],...(l||{})}; for (const k in L) if (!CAT[L[k]]) L[k]=DEFAULTS[job][k];
  L.weapon=job==='knight'?'mug_p300':'none'; L.shield='noshield_p0'; L.pet='nopet_p0';   // 손님은 무기 없이 (기사는 머그잔)
  return L;
}
function cfRandLook(job){
  const L={...DEFAULTS[job]};
  for (const slot of ['outfit','hat','hair','eyes','eyecol','cape']){ const its=Object.values(CAT).filter(it=>it.slot===slot&&(it.job==='all'||it.job===job)&&!it.egg); if (its.length) L[slot]=its[Math.floor(Math.random()*its.length)].id; }
  if (Math.random()<.6) L.cape='nocape_p0'; if (Math.random()<.5) L.hat='nohat_p0';
  return L;
}
function cfGuest(){
  const jobs=Object.keys(DEFAULTS);
  const p=CAFE.pool&&CAFE.pool.length?CAFE.pool[(CAFE.spawned)%CAFE.pool.length]:null;
  if (p){ const job=jobs.includes(p.j)?p.j:'knight'; return {n:String(p.n).slice(0,12),job,look:cfLookFix(job,p.l)}; }
  const job=jobs[Math.floor(Math.random()*jobs.length)]; return {n:CF_NAMES[CAFE.spawned%CF_NAMES.length],job,look:cfLookFix(job,cfRandLook(job))};
}
/* 손님 */
/* 주문 종류: 기본(4지선다 재료 + O/X 토핑) · 📝 주문서(단답형) · 📋 토핑 파르페(보기 조합) · 🎂 층 케이크(순서 맞히기)
   단원에 들어 있는 문제 방식에 맞춰 섞여 나와요. 새 방식은 재료 선반 발판 4칸을 그대로 써요. */
const CF_KIND={base:{w:1.6},sa:{w:1,what:'📝 특별 메뉴',name:'주문서 · 단답형',pat:1.35},cmb:{w:1,what:'🍓 토핑 파르페',name:'토핑 파르페 · 보기 조합',pat:1.3},ord:{w:1,what:'🎂 층 케이크',name:'층 케이크 · 순서 맞히기',pat:1.3}};
function cfPools(){
  return {plain:MC.filter(x=>!x.src),sa:MC.filter(x=>x.src==='sa'),cmb:MC.filter(x=>x.src==='cmb'&&x.cmb.s.length<=4),ord:MC.filter(x=>x.src==='ord'&&x.ord.it.length<=4)};
}
function cfOrder(){
  const P0=cfPools(), av=[];
  if (P0.plain.length||OX.length) av.push('base');
  for (const k of ['sa','cmb','ord']) if (P0[k].length) av.push(k);
  if (!av.length) return {k:'base',mc:null,ox:null};
  // 앞 손님과 같은 새 방식이 연달아 나오지 않게 조금 섞어요
  let tot=0; const ws=av.map(k=>{ const w=CF_KIND[k].w*(k!=='base'&&k===CAFE.lastK?.4:1); tot+=w; return w; });
  let r=Math.random()*tot, k=av[av.length-1]; for (let i=0;i<av.length;i++){ r-=ws[i]; if (r<=0){ k=av[i]; break; } }
  CAFE.lastK=k;
  if (k==='base'){
    const mc=P0.plain.length?pick(['mc'],P0.plain,x=>!x.src):null, ox=OX.length?pick(['ox'],OX):null;
    let opts=null, ci=-1; if (mc){ const order=mc.o.map((_,i)=>i).sort(()=>Math.random()-.5); opts=order.map(i=>mc.o[i]); ci=order.indexOf(0); }
    return {k,mc,ox,opts,ci,oxci:ox?(ox.a?0:1):-1};
  }
  const it=pick(['mc'],P0[k],x=>x.src===k);
  const o={k,sp:it,mc:null,ox:null};
  if (k==='cmb') o.opts=it.cmb.s.slice();
  if (k==='ord'){ o.map=qxShuffle(it.ord.it.map((_,i)=>i)); o.opts=o.map.map(i=>it.ord.it[i]); }
  return o;
}
function cfItems(o){ return [o.mc,o.ox,o.sp].filter(Boolean); }
function cfPatOf(o){ return CAFE.lv.pat*(MODE==='hero'?1:(EASEF.quiz||1))*(CF_KIND[o.k].pat||1); }
function cfMakeGuest(job,look,x,z){ const c=makePlayerChar(job); dressP2(c,look).catch(()=>{}); c.root.position.set(x,0,z); c.root.rotation.y=0; CAFE.dyn.add(c.root); cfAnimKeys(c); c.anim.setBase('cidle'); return c; }
function cfSpawn(){
  // 아직 가게 안에 있는 손님이 틀렸던 문제는 잠깐 미뤄요 (그 손님이 나가기도 전에 같은 손님이 또 들어오면 이상해서)
  const hold=W.wrong.filter(w=>!w.fixed&&!w.pending&&CAFE.cust.some(c=>c.items&&c.items.includes(w.item)));
  hold.forEach(w=>{ w.pending=true; });
  const left=CAFE.n-CAFE.spawned, big=CAFE.n>=10;
  const pair=left>=2&&CAFE.spawned>=2&&CAFE.pairN<(big?2:1)&&Math.random()<.22;   // 👭 친구 두 명: 주문서 한 장에 케이크 2개
  const orders=[cfOrder()]; if (pair) orders.push(cfOrder());
  hold.forEach(w=>{ w.pending=false; });
  const okO=o=>o&&(o.mc||o.ox||o.sp); if (!okO(orders[0])) return; if (orders[1]&&!okO(orders[1])) orders.pop();
  const items=orders.flatMap(cfItems);
  const back=orders.length===1?items.map(it=>CAFE.wrongBy.get(it)).find(Boolean):null;   // 🔁 내가 틀렸던 문제면 그때 그 손님이 다시 와요
  const vip=!back&&orders.length===1&&CAFE.spawned>=2&&CAFE.spawned-CAFE.lastVip>=3&&CAFE.vipN<(big?2:1)&&Math.random()<.25;   // 👑 VIP: 기다리는 시간은 같고 팁 2배 (연달아 오지 않게)
  const no=CAFE.spawned+1, g=back||cfGuest(); CAFE.spawned++;
  const look=vip?{...g.look,hat:'nohat_p0'}:g.look, c=cfMakeGuest(g.job,look,CF_DOOR.x,CF_DOOR.z);
  if (vip){ cfCrown(c); CAFE.vipN++; CAFE.lastVip=CAFE.spawned; }
  let c2=null, g2=null; if (orders.length>1){ g2=cfGuest(); CAFE.spawned++; c2=cfMakeGuest(g2.job,g2.look,CF_DOOR.x-.55,CF_DOOR.z+.6); CAFE.pairN++; }
  const pat=orders.reduce((a,o)=>a+cfPatOf(o),0);
  const C={id:++CAFE.id,no,name:g.n,job:g.job,look,c,o:orders[0],orders,oi:0,items,pat,left:pat,x:CF_DOOR.x,z:CF_DOOR.z,ry:0,q:3,path:null,leaving:0,mood:'',el:null,happyT:0,
    vip,back:!!back,c2,name2:g2?g2.n:null,x2:CF_DOOR.x-.55,z2:CF_DOOR.z+.6,ry2:0,settled:new Set(),tasted:false,remade:false,frontAt:null,allPerfect:true};
  const el=document.createElement('div'); el.className='cf-bub'+(vip?' vip':''); $('#cfBubs').appendChild(el); C.el=el;
  CAFE.cust.push(C); if (cfFront()===C) cfActivate();
}
/* 👑 VIP 손님 왕관: 머리 꼭대기에 똑바로 얹고 머리뼈에 붙여서 고개를 따라 움직여요 */
function cfCrown(c){
  const h=c.root.getObjectByName('head'); if (!h) return;
  c.root.updateMatrixWorld(true);
  const gold=std(0xffbf1f,{rim:.6,emissive:0x5a3600}), g=new THREE.Group(), gems=[0xe5484d,0x3fa9f5,0x22a35a,0xc77dff,0xffffff];
  const band=new THREE.Mesh(new THREE.CylinderGeometry(.25,.27,.13,18,1,true),gold); g.add(band); gold.side=THREE.DoubleSide;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.27,.024,6,18),gold); ring.rotation.x=Math.PI/2; ring.position.y=-.06; g.add(ring);
  for (let k=0;k<5;k++){ const a=k/5*Math.PI*2;
    const sp=new THREE.Mesh(new THREE.ConeGeometry(.065,.17,6),gold); sp.position.set(Math.cos(a)*.24,.14,Math.sin(a)*.24); g.add(sp);
    const ball=new THREE.Mesh(new THREE.SphereGeometry(.03,8,6),gold); ball.position.set(Math.cos(a)*.24,.235,Math.sin(a)*.24); g.add(ball);
    const jw=new THREE.Mesh(new THREE.SphereGeometry(.036,8,6),std(gems[k])); jw.position.set(Math.cos(a+.63)*.268,0,Math.sin(a+.63)*.268); g.add(jw); }
  g.traverse(o=>{ if (o.isMesh) o.castShadow=true; });
  const rq=c.root.getWorldQuaternion(new THREE.Quaternion()), wp=h.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,1.05,0).applyQuaternion(rq));
  h.worldToLocal(wp); g.position.copy(wp);
  g.quaternion.copy(h.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rq).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),.12)));
  const ws=h.getWorldScale(new THREE.Vector3()); g.scale.set(1/ws.x,1/ws.y,1/ws.z);
  h.add(g);
}
function cfFront(){ return CAFE.cust.find(c=>!c.leaving)||null; }
function cfActivate(){
  cfClearPanels(); CAFE.pick={mc:null,ox:null,sel:[],sa:null,hint:false}; CAFE.bake=0; CAFE.bakeQ=null; cfCarry(null); CAFE.qxKey='';
  const C=cfFront(); if (!C){ $('#cfQ').hidden=true; CAFE.step=''; return; }
  if (C.frontAt==null) C.frontAt=W.t;   // 빠름 보너스는 맨 앞이 된 뒤 걸린 시간으로 따져요
  const o=C.o;
  if (o.mc) o.opts.forEach((t,i)=>{ CAFE.panels.push(cfPanel(i,cfBoardTex(String(i+1),t,i))); });
  if (o.k==='cmb'||o.k==='ord') o.opts.forEach((t,i)=>{ CAFE.panels.push(cfPanel(i,cfBoardTex(o.k==='cmb'?QX_LET[i]:'ABCD'[i],t,i))); });
  CAFE.step=o.k==='base'?(o.mc?'mc':'ox'):o.k;
  cfQUI(); try{ SFX.wave(); }catch(e){}
  if (o.k==='sa') setTimeout(()=>{ const el=$('#cfSaIn'); if (el&&cfFront()===C) el.focus(); },350);
}
function cfQUI(){
  const C=cfFront(); if (!C){ $('#cfQ').hidden=true; return; } const o=C.o;
  $('#cfQ').hidden=false;
  $('#cfQNo').textContent=`주문 #${C.no}`+(C.orders.length>1?` · 케이크 ${C.oi+1}/${C.orders.length}`:'');
  const box=$('#cfOpts'), cur0={mc:'재료',ox:'토핑',oven:'오븐',serve:'서빙',sa:'주문서',cmb:'토핑 담기',ord:'층 쌓기'}[CAFE.step];
  let steps;
  if (o.k==='base'){
    const mcDone=CAFE.pick.mc!=null, oxDone=CAFE.pick.ox!=null;
    const showOx=!o.mc||(mcDone&&CAFE.step!=='mc');
    $('#cfQKind').textContent=showOx&&o.ox?'토핑 · O/X':'재료 · 4지선다';
    $('#cfQText').textContent=showOx&&o.ox?o.ox.q:o.mc.q;
    if (showOx&&o.ox){ box.className='run-opts two'; box.innerHTML=CF_OX.map((s,i)=>`<div class="run-opt${CAFE.pick.ox===i?' on':''}" style="--c:${s.c}"><b>${i?'X':'O'}</b><span>${i?'민트 (틀리다)':'체리 (맞다)'}</span></div>`).join(''); }
    else { box.className='run-opts'; box.innerHTML=o.opts.map((t,i)=>`<div class="run-opt${CAFE.pick.mc===i?' on':''}" style="--c:${CF_SHELF[i].c}"><b>${i+1}</b><span>${esc(t)}</span></div>`).join(''); }
    steps=[]; if (o.mc) steps.push(['재료',mcDone]); if (o.ox) steps.push(['토핑',oxDone]);
    $('#cfHint').textContent=CAFE.step==='mc'?'정답 재료 가판대 앞 발판에 서요':CAFE.step==='ox'?'왼쪽 토핑대: 맞으면 O(체리), 틀리면 X(민트) 발판':CAFE.step==='oven'?'왼쪽 구석 벽돌 오븐 앞 발판에 서서 구워요 (재료를 바꾸려면 다른 발판에 다시 서요)':'카운터 앞 노란 발판에서 손님에게 서빙!';
  } else {
    const it=o.sp, sel=CAFE.pick.sel;
    $('#cfQKind').textContent=CF_KIND[o.k].name;
    if (o.k==='sa'){
      $('#cfQText').textContent=it.q;
      const key='sa'+C.id+(CAFE.pick.sa==null?'':'d');
      if (CAFE.qxKey!==key){ CAFE.qxKey=key; box.className='cf-qx';
        if (CAFE.pick.sa==null){
          box.innerHTML=`<div class="qx-row"><input id="cfSaIn" maxlength="30" autocomplete="off" placeholder="손님이 원하는 메뉴(정답)를 써요 · Enter"><button class="btn" id="cfSaGo">주문서 완성</button></div>
            <div class="qx-row2"><button class="btn ghost small" id="cfSaHint">💡 초성 힌트 (팁 조금 줄어요)</button><span id="cfSaHintTxt" class="qx-hint"></span></div>`;
          const inp=$('#cfSaIn'), go=()=>{ const v=inp.value.trim(); if (!v){ inp.focus(); return; } CAFE.pick.sa=v.slice(0,30); inp.blur(); CAFE.step='oven'; try{ SFX.card(); }catch(e){} cfCarry('raw'); cfQUI(); };
          inp.addEventListener('focus',()=>{ for (const k in keys) keys[k]=false; });
          inp.addEventListener('keydown',e=>{ e.stopPropagation(); if (e.key==='Enter'){ e.preventDefault(); go(); } else if (e.key==='Escape') inp.blur(); });
          $('#cfSaGo').onclick=go;
          $('#cfSaHint').onclick=()=>{ CAFE.pick.hint=true; $('#cfSaHint').disabled=true; $('#cfSaHintTxt').textContent=`${it.sa.cho} (${it.sa.ans[0].replace(/\s/g,'').length}글자)`+(it.sa.h?` · ${it.sa.h}`:''); inp.focus(); };
        } else box.innerHTML=`<div class="cf-slip">📝 주문서: <b>${esc(CAFE.pick.sa)}</b><small>맞았는지는 서빙할 때 알 수 있어요</small></div>`;
      }
      steps=[['주문서',CAFE.pick.sa!=null]];
      $('#cfHint').textContent=CAFE.pick.sa==null?'정답을 써서 주문서를 완성해요 (쓰는 동안은 움직이지 않아요 · Esc로 빠져나오기)':CAFE.step==='oven'?'왼쪽 구석 벽돌 오븐 앞 발판에 서서 구워요':'카운터 앞 노란 발판에서 손님에게 서빙!';
    } else {
      CAFE.qxKey='';
      if (o.k==='cmb'){
        $('#cfQText').textContent=it.cmb.q0;
        box.className='run-opts cf-st'; box.innerHTML=o.opts.map((t,i)=>`<div class="run-opt${sel.includes(i)?' on':''}" style="--c:${CF_SHELF[i].c}"><b>${sel.includes(i)?'✓':QX_LET[i]}</b><span>${esc(t)}</span></div>`).join('');
        steps=[['토핑 담기',CAFE.step!=='cmb']];
        $('#cfHint').textContent=CAFE.step==='cmb'?(sel.length?`담은 토핑: ${sel.slice().sort().map(i=>QX_LET[i]).join(', ')} · 다 담았으면 오븐으로 (다시 밟으면 빼요)`:'옳은 보기 선반 앞 발판을 모두 밟아 토핑을 담아요'):'카운터 앞 노란 발판에서 손님에게 서빙!';
      } else {
        $('#cfQText').textContent=String(it.q).replace(/^\[순서\]\s*/,'');
        box.className='run-opts cf-st'; box.innerHTML=o.opts.map((t,i)=>{ const n=sel.indexOf(i); return `<div class="run-opt${n>=0?' on':''}" style="--c:${CF_SHELF[i].c}"><b>${n>=0?n+1+'층':'ABCD'[i]}</b><span>${esc(t)}</span></div>`; }).join('')+
          (sel.length&&CAFE.step!=='serve'?`<button class="btn ghost small cf-redo" id="cfRedo">↺ 다시 쌓기</button>`:'');
        const rb=$('#cfRedo'); if (rb) rb.onclick=()=>{ CAFE.pick.sel=[]; CAFE.step='ord'; CAFE.bake=0; cfCarry(null); cfQUI(); };
        steps=[['층 쌓기',CAFE.step!=='ord']];
        $('#cfHint').textContent=CAFE.step==='ord'?`먼저 일어나는 것부터 발판을 차례로 밟아 한 층씩 쌓아요 (${sel.length}/${o.opts.length}층)`:CAFE.step==='oven'?'다 쌓았어요! 왼쪽 구석 오븐 앞 발판에서 구워요':'카운터 앞 노란 발판에서 손님에게 서빙!';
      }
    }
  }
  const tag=(C.vip?'👑 VIP 손님 · ':'')+(C.back?'🔁 다시 찾아온 손님 · ':'')+(C.orders.length>1?'👭 친구 두 명 · ':'');
  if (tag) $('#cfQKind').textContent=tag+$('#cfQKind').textContent;
  if (CAFE.step==='oven') $('#cfHint').textContent='오븐 발판에 서면 굽기 시작 · 바늘이 금색에 오면 스페이스(또는 클릭)!';
  if (CAFE.step==='serve') $('#cfHint').textContent=C.tasted?'카운터 앞 노란 발판에서 서빙!':'카운터 앞 노란 발판에서 서빙! 헷갈리면 먼저 🥄 맛보기 (T, 한 번만)';
  steps.push(['오븐',CAFE.step==='serve']); steps.push(['서빙',false]);
  const taste=CAFE.step==='serve'&&!C.tasted?'<button class="cf-taste" id="cfTaste" type="button">🥄 맛보기 <kbd>T</kbd></button>'
    :C.tasted?`<span class="cf-tasted">${C.remade?(CAFE.step==='serve'?'🥄 다시 만든 케이크':'🥄 다시 만드는 중'):'🥄 맛봄 · 맛있대요'}</span>`:'';
  $('#cfSteps').innerHTML=steps.map(([n,d])=>`<span class="${d?'done':n===cur0?'now':''}">${d?'✓ ':''}${n}</span>`).join('<i>›</i>')+taste;
  const tb=$('#cfTaste'); if (tb) tb.onclick=e=>{ e.preventDefault(); tb.blur(); cfTaste(); };
}
/* 내가 들고 있는 쟁반: 배 앞 낮은 곳에 들어요 (머리가 큰 캐릭터라 높이 들면 케이크가 얼굴에 파묻혀요)
   두 팔은 cfCarryPose()가 쟁반 양쪽을 받치도록 움직여요 */
const CF_TRAY={y:.86,z:.47}, CF_HAND={x:.31,y:.83,z:.39};
function cfCarry(kind){
  if (!CAFE.tray){ const g=new THREE.Group(), silver=std(0xe3e7ee,{rim:.25});
    const t=new THREE.Mesh(new THREE.CylinderGeometry(.35,.32,.025,32),silver); g.add(t);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.345,.017,6,32),silver); rim.rotation.x=Math.PI/2; rim.position.y=.016; g.add(rim);
    const lace=new THREE.Mesh(new THREE.CylinderGeometry(.29,.29,.006,16),std(0xffffff)); lace.position.set(0,.016,.04); g.add(lace);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.255,.265,.15,26),std(0xffe0b0)); base.position.set(0,.094,.04); g.add(base);
    const top=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.05,26),std(0xff6b8a)); top.position.set(0,.194,.04); g.add(top);
    for (let k=0;k<10;k++){ const a=k/10*Math.PI*2, d=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),top.material); d.position.set(Math.cos(a)*.255,-.024,Math.sin(a)*.255); d.scale.set(1,1.3,1); top.add(d); }
    const ch=new THREE.Mesh(new THREE.SphereGeometry(.055,12,10),std(0xe8143c)); ch.position.set(0,.268,.04); g.add(ch);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.08,5),std(0x5d4037)); stem.position.set(.012,.06,0); stem.rotation.z=-.3; ch.add(stem);
    const layers=[0,1,2,3].map(k=>{ const r=.255-k*.032; const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.064,22),std(0xffffff)); m.position.set(0,.05+k*.066,.04); g.add(m); return m; });
    g.traverse(o=>{ if (o.isMesh){ o.castShadow=true; o.receiveShadow=true; } });
    g.position.set(0,CF_TRAY.y,CF_TRAY.z); CAFE.tray={g,base,top,ch,layers}; }
  const T=CAFE.tray; if (!kind){ if (T.g.parent) T.g.parent.remove(T.g); return; }
  if (T.g.parent!==pg){ pg.add(T.g); T.pop=0; }
  const mcI=CAFE.pick.mc, oxI=CAFE.pick.ox;
  T.base.visible=true; T.top.visible=mcI!=null; if (mcI!=null) T.top.material.color.setHex(CF_SHELF[mcI].hex);
  T.ch.visible=oxI!=null; if (oxI!=null) T.ch.material.color.setHex(oxI?0x5fd38d:0xe8143c);
  const C=cfFront(), k=C?C.o.k:'base', sel=CAFE.pick.sel||[];
  T.layers.forEach((m,j)=>{ m.visible=k==='ord'&&j<sel.length; if (m.visible) m.material.color.setHex(CF_SHELF[sel[j]].hex); });
  if (k==='ord'){ T.top.visible=false; T.ch.visible=false; }
  if (k==='cmb'){ T.top.visible=true; T.top.material.color.setHex(0xfff0f5); T.ch.visible=sel.length>0; T.ch.material.color.setHex(sel.length?CF_SHELF[sel[sel.length-1]].hex:0xe8143c); T.ch.scale.setScalar(Math.min(1.6,1+.15*sel.length)); }
  if (k==='sa'){ T.top.visible=true; T.top.material.color.setHex(0xffb3c7); T.ch.visible=true; T.ch.material.color.setHex(0xffd23f); T.ch.scale.setScalar(1.3); }
  if (k==='base') T.ch.scale.setScalar(1);
  T.base.material.color.setHex(kind!=='baked'?0xffe0b0:CAFE.bakeQ==='burnt'?0x9a5a2e:CAFE.bakeQ==='soft'?0xf3d6a2:CAFE.bakeQ==='perfect'?0xf0ad52:0xe9b36a);
}

/* 카페에서는 무기 · 방패를 들지 않아요 (손 자리에 붙은 것을 숨겨요. 카페를 나가면 다시 보여요) */
function cfHands(c,hide){ if (!c||!c.root) return; for (const n of ['handslotl','handslotr']){ const b=cfBone(c,n); if (b) b.children.forEach(o=>{ o.visible=!hide; }); } }
/* 카페에서는 직업과 상관없이 맨손 기본 동작(서 있기 · 달리기)을 써요. 궁수의 활 든 자세가 빈손에선 어색해서요 */
function cfAnimKeys(c){ const A=c.anim; if (A.actions.cidle) return; const by=n=>GL.pclips.animations.find(x=>x.name===n);
  const ci=by('Idle'), cr=by('Running_A'); A.actions.cidle=ci?A.mixer.clipAction(ci):A.actions.idle; A.actions.crun=cr?A.mixer.clipAction(cr):A.actions.run; }
/* 쟁반 드는 자세: 위팔 · 아래팔 두 뼈를 돌려서 손목이 쟁반 양쪽 아래에 오게 해요 (애니메이션 위에 덮어써요) */
const _ik={a:new THREE.Vector3(),b:new THREE.Vector3(),c:new THREE.Vector3(),t:new THREE.Vector3(),e:new THREE.Vector3(),p:new THREE.Vector3(),d:new THREE.Vector3(),v0:new THREE.Vector3(),v1:new THREE.Vector3(),q:new THREE.Quaternion(),q2:new THREE.Quaternion(),q3:new THREE.Quaternion()};
function cfBone(c,n){ const B=c.cfBones||(c.cfBones={}); if (!B[n]||!B[n].parent) B[n]=c.root.getObjectByName(n); return B[n]; }
function cfTurnBone(B,from,cur,want,w){ const I=_ik;
  I.v0.subVectors(cur,from).normalize(); I.v1.subVectors(want,from).normalize(); I.q.setFromUnitVectors(I.v0,I.v1);
  B.getWorldQuaternion(I.q2); I.q2.premultiply(I.q); B.parent.getWorldQuaternion(I.q3).invert(); I.q3.multiply(I.q2);
  B.quaternion.slerp(I.q3,w); B.updateMatrixWorld(true); }
function cfArmIK(c,side,w,bob){
  const U=cfBone(c,'upperarm'+side), L=cfBone(c,'lowerarm'+side), Wr=cfBone(c,'wrist'+side); if (!U||!L||!Wr) return;
  const s=side==='l'?1:-1, I=_ik;
  U.getWorldPosition(I.a); L.getWorldPosition(I.b); Wr.getWorldPosition(I.c);
  const la=I.a.distanceTo(I.b), lb=I.b.distanceTo(I.c);
  I.t.set(s*CF_HAND.x,CF_HAND.y+bob,CF_HAND.z); pg.localToWorld(I.t);
  I.d.subVectors(I.t,I.a); let dist=I.d.length(); I.d.divideScalar(dist||1); dist=Math.min(la+lb-.004,Math.max(Math.abs(la-lb)+.004,dist));
  I.p.set(s*.9,-1,-.45).applyQuaternion(pg.quaternion); I.p.addScaledVector(I.d,-I.p.dot(I.d)).normalize();   // 팔꿈치는 바깥 · 아래 · 살짝 뒤로
  const ca=(la*la+dist*dist-lb*lb)/(2*la*dist), sa=Math.sqrt(Math.max(0,1-ca*ca));
  I.e.copy(I.a).addScaledVector(I.d,la*ca).addScaledVector(I.p,la*sa);
  cfTurnBone(U,I.a,I.b,I.e,w);
  L.getWorldPosition(I.b); Wr.getWorldPosition(I.c);
  I.t.copy(I.b).addScaledVector(I.d.subVectors(I.t,I.b).normalize(),lb);
  cfTurnBone(L,I.b,I.c,I.t,w);
}
function cfCarryPose(dt,moving){
  const T=CAFE.tray, held=!!(T&&T.g.parent===pg);
  CAFE.carryW=(CAFE.carryW||0)+((held?1:0)-(CAFE.carryW||0))*Math.min(1,dt*12);
  const bob=moving?Math.abs(Math.sin(W.t*10.5))*.025:0;
  if (held){ T.pop=Math.min(1,(T.pop||0)+dt*6); const k=T.pop, e=1+2.2*(k-1)*(k-1)*(k-1)+1.2*(k-1)*(k-1); T.g.scale.setScalar(Math.max(.01,e)); T.g.position.set(0,CF_TRAY.y+bob,CF_TRAY.z); }
  if (!knight||CAFE.carryW<.01) return;
  pg.updateMatrixWorld(true);
  cfArmIK(knight,'l',CAFE.carryW,bob); cfArmIK(knight,'r',CAFE.carryW,bob);
}

/* ---------- 판 진행 ---------- */
function cafeReset(){
  Object.values(PCH).forEach(c=>cfHands(c,false));
  document.body.classList.remove('cafe'); ['#cfHud','#cfQ','#cfRes','#cfHelp'].forEach(s=>{ const e=$(s); if (e) e.hidden=true; });
  if (MAPK!=='cafe' || !CAFE.dyn){ return; }
  cfClearPanels(); for (const C of CAFE.cust){ CAFE.dyn.remove(C.c.root); if (C.c2) CAFE.dyn.remove(C.c2.root); C.el&&C.el.remove(); } CAFE.cust=[]; $('#cfBubs').innerHTML='';
  const lv=CF_LV[MODE==='hero'?'hero':LEVEL]||CF_LV.normal;
  Object.assign(CAFE,{lv,n:lv.n,spawned:0,nextSpawn:1.2,step:'',pick:{mc:null,ox:null},stand:null,standT:0,bake:0,tips:0,served:0,perfect:0,lost:0,combo:0,maxCombo:0,scores:[],res:null,help:W.t+12,
    bakeQ:null,tasteT:0,happy:0,happyDone:false,confT:0,vipN:0,lastVip:-9,pairN:0,bakePerf:0,confident:0,fixedBack:0,wrongBy:new Map()});
  cfCarry(null); cfLoadClass();
  { const ob=$('#cfOven'); if (ob&&!ob._bound){ ob._bound=1; ob.addEventListener('click',()=>cfBakeHit()); } }   // 게이지를 눌러도 꺼내져요
  P.x=-1; P.z=-1.8; P.fx=0; P.fz=-1; W.nextWaveAt=-1; W.nextQuiz=1e9; W.snapCam=true; CAFE.doorA=0; if (CAFE.door) CAFE.door.rotation.y=0;
  document.body.classList.add('cafe'); $('#cfHud').hidden=false;
  setTimeout(()=>{ if (MAPK==='cafe'&&W.state==='play') showBanner('달콤 카페 영업 시작!'); },300);
}
function cfStars(){ if (!CAFE.scores.length) return 3; return Math.round(CAFE.scores.reduce((a,b)=>a+b,0)/CAFE.scores.length*2)/2; }
function cfAt(x,z,r){ return Math.hypot(P.x-x,P.z-z)<(r||1.15); }
function cfPadTick(dt){
  const C=cfFront(); if (!C) return;
  let here=null;
  if (C.o.mc&&CAFE.step!=='serve') CF_SHELF.forEach((s,i)=>{ if (cfAt(s.x,CF_PAD_Z)) here='mc'+i; });
  if ((C.o.k==='cmb'||C.o.k==='ord')&&CAFE.step!=='serve') C.o.opts.forEach((_,i)=>{ const s=CF_SHELF[i]; if (cfAt(s.x,CF_PAD_Z)) here='qx'+i; });
  if (C.o.ox&&CAFE.step!=='serve'&&(CAFE.step!=='mc')) CF_OX.forEach((s,i)=>{ if (cfAt(s.x,s.z)) here='ox'+i; });
  if (cfAt(CF_OVEN.x,CF_OVEN.z)) here='oven';
  if (cfAt(CF_SERVE.x,CF_SERVE.z)) here='serve';
  if (here!==CAFE.stand){ CAFE.stand=here; CAFE.standT=0; if (here!=='oven') CAFE.bake=0; }
  else CAFE.standT+=dt;
  if (!here) return;
  if (here.startsWith('mc')&&CAFE.standT>=.4){ const i=+here[2]; if (CAFE.pick.mc!==i){ CAFE.pick.mc=i; try{ SFX.card(); }catch(e){} fx.burst(P.x,1.6,P.z,CF_SHELF[i].hex,10,3); cfCarry('raw'); }
    if (CAFE.step==='mc') CAFE.step=C.o.ox?'ox':'oven'; else if (CAFE.step==='serve'){} cfQUI(); CAFE.standT=-99; }
  else if (here.startsWith('ox')&&CAFE.standT>=.4){ const i=+here[2]; if (CAFE.pick.ox!==i){ CAFE.pick.ox=i; try{ SFX.card(); }catch(e){} fx.burst(P.x,1.6,P.z,i?0x5fd38d:0xe8143c,10,3); cfCarry('raw'); }
    if (CAFE.step==='ox') CAFE.step='oven'; cfQUI(); CAFE.standT=-99; }
  else if (here.startsWith('qx')&&CAFE.standT>=.4){ const i=+here[2], sel=CAFE.pick.sel;
    if (C.o.k==='cmb'){ const n=sel.indexOf(i); if (n>=0) sel.splice(n,1); else sel.push(i); CAFE.step='cmb'; CAFE.bake=0; try{ SFX.card(); }catch(e){} fx.burst(P.x,1.6,P.z,CF_SHELF[i].hex,10,3); cfCarry(sel.length?'raw':null); }
    else if (CAFE.step==='ord'&&!sel.includes(i)){ sel.push(i); try{ SFX.card(); }catch(e){} fx.burst(P.x,1.6,P.z,CF_SHELF[i].hex,10,3); cfCarry('raw'); if (sel.length===C.o.opts.length) CAFE.step='oven'; }
    cfQUI(); CAFE.standT=-99; }
  else if (here==='oven'&&(CAFE.step==='oven'||CAFE.step==='cmb'&&CAFE.pick.sel.length)){ CAFE.bake+=dt; const v=CAFE.bake/CF_BAKE_T;
    if (cfMild()&&v>=cfGold()[1]) cfBakeDone('ok'); else if (v>=1) cfBakeDone('burnt'); }   // 아무것도 안 누르면: 쉬운 반은 그냥 완성, 그 밖은 살짝 타요
  else if (here==='serve'&&CAFE.step==='serve'&&CAFE.standT>=.25){ cfServe(C); CAFE.standT=-99; }
}
/* 지금 만든 디저트가 맞았는지 따져요 (서빙 · 맛보기에서 같이 써요) */
function cfJudge(C){
  const o=C.o, parts=[];
  if (o.k==='base'){
    if (o.mc) parts.push({item:o.mc,ok:CAFE.pick.mc===o.ci,ans:correctText(o.mc)});
    if (o.ox) parts.push({item:o.ox,ok:CAFE.pick.ox===o.oxci,ans:correctText(o.ox)});
  } else {
    const it=o.sp, sel=CAFE.pick.sel; let ok=false, mine='', q=it.q;
    if (o.k==='sa'){ mine=CAFE.pick.sa||''; ok=it.sa.ans.map(qxNorm).includes(qxNorm(mine)); }
    if (o.k==='cmb'){ const s=sel.slice().sort(), a=it.cmb.a; ok=s.length===a.length&&s.every((v,j)=>v===a[j]); mine=s.map(i=>QX_LET[i]).join(', ')||'(없음)'; q=it.cmb.q0+' — '+it.cmb.s.map((v,i)=>`${QX_LET[i]}. ${v}`).join(' / '); }
    if (o.k==='ord'){ const seq=sel.map(i=>o.map[i]); ok=seq.length===it.ord.it.length&&seq.every((v,j)=>v===j); mine=seq.map(j=>it.ord.it[j]).join(' → '); q=String(it.q).replace(/^\[순서\]\s*/,''); }
    parts.push({item:it,ok,ans:correctText(it),mine,q});
  }
  return {parts,n:parts.length,good:parts.filter(p=>p.ok).length,base:o.k==='base',ord:o.k==='ord'};
}
function cfServe(C){
  const J=cfJudge(C);
  const line=p=>`<li class="${p.ok?'g':'b'}"><b>${p.ok?'정답':'아쉬워요'}</b> ${esc(p.q||p.item.q)}<br><small>${p.mine!=null&&!p.ok?`내 답: ${esc(p.mine)} → `:''}정답: ${esc(p.ans)}${p.item.e?` · ${esc(p.item.e)}`:''}</small></li>`;
  let fixedBack=false;
  J.parts.forEach(p=>{ if (!C.settled.has(p.item)){ settle(p.ok,p.item,{type:'cafe'}); C.settled.add(p.item); }   // 맛보기에서 이미 틀린 걸로 기록한 문제는 다시 세지 않아요
    if (!p.ok) CAFE.wrongBy.set(p.item,{n:C.name,job:C.job,look:C.look});
    else if (CAFE.wrongBy.has(p.item)){ CAFE.wrongBy.delete(p.item); if (C.back) fixedBack=true; } });
  const allOk=J.good===J.n, perfect=allOk&&!C.remade, happy=cfHappy();
  const tip0=J.base?J.good*20:(allOk?Math.round(40*(CAFE.pick.hint?.7:1)):0);
  const hurry=Math.max(0,1-(W.t-(C.frontAt==null?W.t:C.frontAt))/cfPatOf(C.o));
  let tip=tip0+(perfect?Math.round(hurry*20):0)+(allOk&&CAFE.bakeQ==='perfect'?6:0);
  const conf=perfect&&!C.tasted; if (conf){ tip=Math.round(tip*1.25); CAFE.confident++; }   // 맛보지 않고 자신 있게 서빙해서 맞히면 +25%
  if (C.remade) tip=Math.round(tip*.5);
  if (CAFE.bakeQ==='burnt') tip=Math.round(tip*.75);
  if (fixedBack&&allOk){ tip+=10; CAFE.fixedBack++; }
  if (perfect){ CAFE.combo++; CAFE.perfect++; } else CAFE.combo=0; CAFE.maxCombo=Math.max(CAFE.maxCombo,CAFE.combo);
  const mul=1+.25*Math.min(4,Math.max(0,CAFE.combo-1));
  tip=Math.round(tip*mul*(C.vip?2:1)*(happy?1.5:1));
  C.allPerfect=C.allPerfect&&perfect;
  const last=C.oi>=C.orders.length-1;
  let pairBonus=0; if (last&&C.orders.length>1&&C.allPerfect){ pairBonus=Math.round(10*(happy?1.5:1)); tip+=pairBonus; }
  CAFE.tips+=tip; CAFE.served++; CAFE.scores.push(perfect?5:J.good?3:1);
  W.cardCoins=(W.cardCoins||0)+(perfect?4:J.good?2:0);
  C.mood=perfect?'happy':J.good?'ok':'sad'; C.happyT=W.t+2.2;
  if (perfect){ C.c.anim.once('cheer',1); if (C.c2) C.c2.anim.once('cheer',1); try{ SFX.correct(); }catch(e){} fx.burst(C.x,2.6,C.z,C.vip?0xffc93c:0xff4d88,26,5); }
  else if (J.good){ try{ SFX.correct(); }catch(e){} } else { try{ SFX.wrong(); }catch(e){} }
  const head=perfect?'"딱 제가 원하던 맛이에요!"':allOk?'"다시 만들어 줘서 고마워요!"':J.good?'"음, 괜찮네요!"':'"음… 이게 아닌데요?"';
  const chips=[tip?`+${tip} 팁`:'',CAFE.combo>=2?`🔥 ${CAFE.combo}콤보`:'',allOk&&CAFE.bakeQ==='perfect'?'✨ 완벽 굽기':'',conf?'💪 자신 있게 서빙 +25%':'',
    CAFE.bakeQ==='burnt'?'살짝 탐 −25%':'',C.vip?'👑 VIP ×2':'',happy?'🎉 해피 아워 ×1.5':'',fixedBack&&allOk?'🔁 이번엔 맞혔어요! +10':'',pairBonus?'👭 두 분 모두 만족!':''].filter(Boolean).join(' · ');
  const r=$('#cfRes'); r.className='run-res card cf-res '+(perfect?'good':J.good?'mid':'bad'); r.hidden=false;
  r.innerHTML=`<b>${head}</b> <small>${chips}</small><ul>${J.parts.map(line).join('')}`+
    (C.remade?'<li class="b"><small>🥄 맛보기에서 이상한 걸 알고 다시 만든 케이크예요 · 처음 답은 틀린 것으로 기록돼요</small></li>':'')+
    (J.ord&&!allOk?'<li class="b"><small>🎂 층 순서가 달라서 케이크가 기울었어요!</small></li>':'')+'</ul>';
  CAFE.res=W.t+(perfect?4:7);
  if (!last){ C.oi++; C.o=C.orders[C.oi]; C.settled=new Set(); C.tasted=false; C.remade=false; C.frontAt=W.t; cfActivate(); }   // 👭 두 번째 케이크 주문으로
  else cfLeave(C);
}
/* 🥄 맛보기: 서빙 전에 한 번, 맞게 만들었는지만 알려줘요 (무엇이 정답인지는 안 알려줘요)
   틀렸으면 처음 답은 틀린 것으로 기록하고 처음부터 다시 만들어요 (팁은 절반). 맞았으면 그대로 서빙 (자신 있게 보너스는 없어요) */
function cfTaste(){
  const C=cfFront(); if (!C||C.leaving||CAFE.step!=='serve'||C.tasted||W.paused||W.state!=='play') return;
  C.tasted=true; CAFE.tasteT=W.t+.8;   // 맛보는 동안 잠깐 멈춰 서요
  const J=cfJudge(C), ok=J.good===J.n;
  fx.burst(P.x,1.9,P.z,ok?0x3fb26b:0xe5484d,14,2.5);
  if (ok){ flashCf('🥄 음~ 맛있어요! 제대로 만든 것 같아요','good'); try{ SFX.correct(); }catch(e){} }
  else { flashCf('🥄 음… 맛이 좀 이상해요. 다시 만들어요!','bad'); try{ SFX.wrong(); }catch(e){}
    J.parts.forEach(p=>{ if (!p.ok&&!C.settled.has(p.item)){ settle(false,p.item,{type:'cafe'}); C.settled.add(p.item); CAFE.wrongBy.set(p.item,{n:C.name,job:C.job,look:C.look}); } });
    C.remade=true; cfRemake(C); }
  cfQUI();
}
function cfRemake(C){ const o=C.o;
  CAFE.pick={mc:null,ox:null,sel:[],sa:null,hint:CAFE.pick.hint}; CAFE.bake=0; CAFE.bakeQ=null; cfCarry(null); CAFE.qxKey='';
  CAFE.step=o.k==='base'?(o.mc?'mc':'ox'):o.k;
  if (o.k==='sa') setTimeout(()=>{ const el=$('#cfSaIn'); if (el&&cfFront()===C) el.focus(); },350); }
/* 🔥 오븐 굽기: 바늘이 금색에 있을 때 스페이스(또는 클릭) → 완벽 굽기. 너무 일찍 누르면 덜 구워지고(보너스 없음), 늦으면 살짝 타요 */
function cfBaking(){ return CAFE.stand==='oven'&&CAFE.bake>0&&(CAFE.step==='oven'||CAFE.step==='cmb'); }
function cfBakeHit(){
  if (!cfBaking()||W.paused||W.state!=='play') return false;
  const v=CAFE.bake/CF_BAKE_T, g=cfGold(); cfBakeDone(v<g[0]?'soft':v<=g[1]?'perfect':'burnt'); return true;
}
function cfBakeDone(q){
  if (q==='burnt'&&cfMild()) q='ok';   // 쉬운 반은 벌칙 없이
  CAFE.bakeQ=q; CAFE.step='serve'; CAFE.bake=0; cfCarry('baked');
  if (q==='perfect'){ CAFE.bakePerf++; try{ SFX.correct(); }catch(e){} fx.burst(CF_OVEN.x,2.0,CF_OVEN.z,0xffd23f,30,5); fx.burst(P.x,1.4,P.z,0xfff2a8,16,3); flashCf('✨ 완벽하게 구웠어요! (팁 +6)','gold'); }
  else if (q==='burnt'){ try{ SFX.wrong(); }catch(e){} fx.burst(CF_OVEN.x,2.2,CF_OVEN.z,0x5a4a40,22,2.5); flashCf('앗, 살짝 탔어요… (팁 조금 줄어요)','burnt'); }
  else if (q==='soft'){ try{ SFX.card(); }catch(e){} flashCf('조금 덜 구워졌어요 · 다음엔 금색에서!'); }
  else { try{ SFX.wave(); }catch(e){} fx.burst(CF_OVEN.x,1.8,CF_OVEN.z,0xffc531,20,4); }
  cfQUI();
}
function cfLeave(C){ C.leaving=1; C.path=CF_OUT.map(p=>p.slice()); C.el.classList.add('out'); setTimeout(()=>C.el&&C.el.remove(),600); cfActivate(); }   // 디저트를 받으면 앞쪽 손님 자리로
function cfUpdate(dt){
  // 손님 오기
  const waiting=CAFE.cust.filter(c=>!c.leaving).length;
  if (CAFE.spawned<CAFE.n && waiting<3 && W.t>=CAFE.nextSpawn){ cfSpawn(); CAFE.nextSpawn=W.t+CAFE.lv.gap*(waiting===0?.3:1); }
  // 손님 줄 서기 · 기다리기 · 떠나기: 문 → 러그 위 줄(뒤에서부터 한 칸씩) → 카운터. 떠날 때는 정해진 길(C.path)을 따라가요
  let slot=0; const QP=[CF_SLOT[0],CF_SLOT[1],CF_SLOT[2],CF_DOORIN];
  for (const C of CAFE.cust){
    let tx,tz,face=null;
    if (C.leaving){ let w=C.path[0]; if (C.path.length>1&&Math.hypot(C.x-w[0],C.z-w[1])<.35){ C.path.shift(); w=C.path[0]; } tx=w[0]; tz=w[1]; }
    else { const s=Math.min(2,slot++);
      while (C.q>s&&Math.hypot(C.x-QP[C.q].x,C.z-QP[C.q].z)<.4) C.q--;
      const tp=QP[Math.max(C.q,s)]; tx=tp.x; tz=tp.z; if (C.q<=s) face=CF_SLOT[s].ry;
      if (C.q<=s&&Math.hypot(C.x-tx,C.z-tz)<.4) C.left-=dt*(s===0?1:CF_WAITK);   // 맨 앞 손님만 제 속도로 줄어요
      if (C.left<=0){ const rest=C.orders.length-C.oi; CAFE.lost+=rest; CAFE.combo=0; for (let k=0;k<rest;k++) CAFE.scores.push(0); C.mood='sad'; const front=cfFront()===C;
        C.items.forEach(it=>{ const w=W.wrong.find(x=>x.item===it); if (w&&w.pending) w.pending=false; });   // 못 받은 문제는 나중에 다시 나올 수 있게
        C.leaving=1; C.path=(C.z>-3?[[10.1,-3.0]]:[]).concat(CF_BACK.map(p=>p.slice()));   // 지쳐서 다시 문으로
        C.el.classList.add('out'); setTimeout(()=>C.el&&C.el.remove(),600); flashCf(`주문 #${C.no} 손님이 기다리다 갔어요…`);
        if (front) cfActivate(); continue; } }
    const dx=tx-C.x, dz=tz-C.z, d=Math.hypot(dx,dz), sp=C.leaving?3.2:3.8, walk=d>.1;
    if (d>.05){ const k=Math.min(1,sp*dt/d); C.x+=dx*k; C.z+=dz*k; }
    const want=walk?Math.atan2(dx,dz):(face!=null?face:C.ry); let da=want-C.ry; da=Math.atan2(Math.sin(da),Math.cos(da)); C.ry+=da*Math.min(1,dt*10);
    C.c.root.position.set(C.x,Math.abs(Math.sin(W.t*9))*(walk?.12:0),C.z); C.c.root.rotation.y=C.ry;
    C.c.anim.setBase(walk?'crun':'cidle',walk?.8:1); C.c.mixer.update(dt);
    if (C.c2){ const tx2=C.x-.55, tz2=C.z+.62, dx2=tx2-C.x2, dz2=tz2-C.z2, d2=Math.hypot(dx2,dz2), walk2=d2>.12;   // 👭 친구는 왼쪽 앞에서 따라 걸어요
      if (d2>.03){ const k=Math.min(1,(sp+.8)*dt/d2); C.x2+=dx2*k; C.z2+=dz2*k; }
      const want2=walk2?Math.atan2(dx2,dz2):C.ry; let db=want2-C.ry2; db=Math.atan2(Math.sin(db),Math.cos(db)); C.ry2+=db*Math.min(1,dt*10);
      C.c2.root.position.set(C.x2,Math.abs(Math.sin(W.t*9+1.3))*(walk2?.12:0),C.z2); C.c2.root.rotation.y=C.ry2;
      C.c2.anim.setBase(walk2?'crun':'cidle',walk2?.8:1); C.c2.mixer.update(dt); }
  }
  CAFE.cust=CAFE.cust.filter(C=>{ if (C.leaving&&C.path.length===1&&Math.hypot(C.x-C.path[0][0],C.z-C.path[0][1])<.3){ CAFE.dyn.remove(C.c.root); C.c.mixer.stopAllAction(); if (C.c2){ CAFE.dyn.remove(C.c2.root); C.c2.mixer.stopAllAction(); } return false; } return true; });
  // 🎉 해피 아워: 손님의 40%쯤 지나면 한 번, 40초 동안 팁 1.5배 (손님 오는 속도는 그대로)
  if (!CAFE.happyDone&&CAFE.n>=6&&CAFE.served+CAFE.lost>=Math.round(CAFE.n*.4)){ CAFE.happyDone=true; CAFE.happy=W.t+40; showBanner('🎉 해피 아워! 40초 동안 팁 1.5배'); try{ SFX.wave(); }catch(e){} }
  if (cfHappy()&&(CAFE.confT=(CAFE.confT||0)-dt)<=0){ CAFE.confT=.7; const pt=[[-3,-3],[1,-2],[5,-6],[-6,-1],[9.6,-2.4],[-1,-6.5]][(Math.random()*6)|0];
    fx.burst(pt[0],3.3,pt[1],[0xff6b8a,0xffd23f,0x6c5ce7,0x3fb26b,0x4fc3f7][(Math.random()*5)|0],14,3); }
  // 뒷문: 손님이 가까이 오면 안쪽으로 열려요
  if (CAFE.door){ const near=CAFE.cust.some(C=>Math.hypot(C.x-10.8,C.z+9.9)<2.3); CAFE.doorA+=((near?1:0)-CAFE.doorA)*Math.min(1,dt*(near?7:3)); CAFE.door.rotation.y=-CAFE.doorA*1.55; }
  cfPadTick(dt);
  if (CAFE.res && W.t>=CAFE.res){ CAFE.res=null; $('#cfRes').hidden=true; }
  if (CAFE.help && W.t>=CAFE.help){ CAFE.help=0; $('#cfHelp').hidden=true; }
  { const f=.5+.5*Math.sin(W.t*7.3)*Math.sin(W.t*3.1+1);   // 오븐 불: 평소엔 은은하게 일렁이고, 굽는 동안은 환하게
    CAFE.ovenGlow.material.emissiveIntensity=CAFE.bake>0?1.55+.45*Math.sin(W.t*12):.8+.3*f;
    if (CAFE.ovenHalo){ CAFE.ovenHalo.material.opacity=CAFE.bake>0?.85:.34+.12*f; CAFE.ovenHalo.scale.setScalar(CAFE.bake>0?3.4:2.6); } }
  // 끝
  if (CAFE.spawned>=CAFE.n && !CAFE.cust.length && W.state==='play'){ CAFE.done=true; setTimeout(()=>{ if (MAPK==='cafe'&&W.state==='play') endGame(true); },700); CAFE.spawned=1e9; }
}
function flashCf(t,kind){ const e=$('#cfToast'); e.textContent=t; e.className='cf-toast'+(kind?' '+kind:''); void e.offsetWidth; e.classList.add('show'); }
const _cfV=new THREE.Vector3();
function cfBubbles(){
  const r=renderer.domElement.getBoundingClientRect(), front=cfFront();
  for (const C of CAFE.cust){ if (!C.el) continue;
    // 말풍선은 머리 오른쪽 옆에 (줄이 화면 위쪽으로 이어져서, 머리 위에 두면 뒷사람을 가려요)
    _cfV.set(C.x,1.75,C.z).project(camera); const x=r.left+(_cfV.x+1)/2*r.width, y=r.top+(1-_cfV.y)/2*r.height;
    C.el.style.transform=`translate(${Math.round(Math.min(x+18,r.right-136))}px,${Math.round(y-12)}px)`;
    const k=Math.max(0,C.left/C.pat), col=k>.5?'#3fb26b':k>.25?'#f2a516':'#e5484d';
    const what=CF_KIND[C.o.k].what||(C.o.mc&&C.o.ox?'케이크 + 토핑':C.o.mc?'케이크':'파르페');
    const html=C.leaving?`<b class="nm">${esc(C.name)}</b> `+(C.mood==='happy'?'<b class="hp">💖 맛있어요!</b>':C.mood==='ok'?'<b>🙂 고마워요</b>':'<b class="sd">😢</b>')
      :`<div class="t"><b class="nm">${C.back?'🔁 ':''}${C.vip?'👑 ':''}${esc(C.name)}${C.name2?' &amp; '+esc(C.name2):''}</b><em>${C===front?(C.orders.length>1?`🍰 ${C.oi+1}/${C.orders.length}`:'만드는 중'):'#'+C.no}</em></div><div class="bar"><i style="width:${Math.round(k*100)}%;background:${col}"></i></div>`;
    if (C.el._h!==html){ C.el._h=html; C.el.innerHTML=html; } C.el.classList.toggle('front',C===front&&!C.leaving); }
}
function cfHUD(){
  const st=cfStars();
  $('#cfStars').textContent=`★ ${st.toFixed(1)}`;
  $('#cfTips').textContent=`팁 ${CAFE.tips.toLocaleString('ko-KR')}`;
  $('#cfCount').textContent=`손님 ${Math.min(CAFE.served+CAFE.lost,CAFE.n)}/${CAFE.n}`;
  $('#cfCombo').textContent=[cfHappy()?`🎉 해피 아워 ${Math.ceil(CAFE.happy-W.t)}초`:'',CAFE.combo>=2?`🔥 ${CAFE.combo}콤보`:''].filter(Boolean).join(' · ');
  const ob=$('#cfOven'), baking=cfBaking(); if (ob.hidden===baking) ob.hidden=!baking;
  if (baking){ const g=cfGold(), v=Math.min(1,CAFE.bake/CF_BAKE_T), mild=cfMild(), gz=ob.querySelector('.cfo-g'), bz=ob.querySelector('.cfo-b'), nd=ob.querySelector('.cfo-n');
    if (gz){ gz.style.left=g[0]*100+'%'; gz.style.width=(g[1]-g[0])*100+'%'; bz.style.display=mild?'none':''; bz.style.left=g[1]*100+'%'; nd.style.left=v*100+'%'; }
    ob.classList.toggle('hot',v>=g[0]&&v<=g[1]); }
}
function cafeFrame(dt,real,now){
  if (knight && (knight.anim.dead||endPose)){ knight.anim.revive(); endPose=false; }
  if (!W.paused){ W.t+=dt; cfUpdate(dt); }
  lobbyTick(real,dt);
  let moving=false;
  if (!W.paused&&!(CAFE.tasteT>W.t)){
    const am=arrowsMove();
    let ix=(keys.KeyD||am&&keys.ArrowRight?1:0)-(keys.KeyA||am&&keys.ArrowLeft?1:0)+joy.x, iz=(keys.KeyS||am&&keys.ArrowDown?1:0)-(keys.KeyW||am&&keys.ArrowUp?1:0)+joy.y;
    const L=Math.hypot(ix,iz); if (L>.12){ if (L>1){ ix/=L; iz/=L; } P.x+=ix*7.5*dt; P.z+=iz*7.5*dt; P.fx=ix; P.fz=iz; moving=true; }
    cfCollide();
  }
  pg.position.set(P.x,0,P.z);
  { let dy=Math.atan2(P.fx,P.fz)-pg.rotation.y; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); pg.rotation.y+=dy*Math.min(1,dt*14); }
  if (knight){ cfAnimKeys(knight); cfHands(knight,true); setBaseSynced(knight.anim,moving?'crun':'cidle',moving?1.15:1); knight.mixer.update(W.paused?0:dt); cfCarryPose(W.paused?0:dt,moving); }
  fx.update(dt); updateCombatFx(dt); updateDreamy(real); qualityTick(now);
  { const o=sun.userData.off||[22,38,14]; sun.position.set(P.x+o[0],o[1],P.z+o[2]); sun.target.position.set(P.x,0,P.z); sun.target.updateMatrixWorld(); }
  // 카메라: 화면이 16:9보다 좁으면(16:10 · 4:3) 조금 뒤로 물러나서 가게 양쪽 끝(오븐 · 손님 줄)이 잘리지 않게 해요
  const ak=Math.max(1,Math.min(1.45,1.72/(camera.aspect||1.78)));
  const cx=.1+P.x*.06, cz=P.z*.06, tgt=new THREE.Vector3(cx,16*ak,-3+15.6*ak+cz); camera.position.lerp(tgt,W.snapCam?1:Math.min(1,dt*5)); W.snapCam=false; camera.lookAt(cx,0,-3.0+cz);
  limitTick(); if (W.state!=='play'){ renderFrame(); return; }
  cfHUD(); cfArrowTick(); renderFrame(); cfBubbles();
}
/* 가구에 부딪히면 밀려나요 (몸 반지름 .42). 부엌은 가구로 둘러싸여 있어서 손님 쪽 · 화면 아래(문제 창 뒤)로는 못 가요 */
function cfCollide(){
  const R=.42;
  for (let it=0;it<2;it++){
    for (const b of CF_BOX){ const x0=b[0]-R, x1=b[1]+R, z0=b[2]-R, z1=b[3]+R;
      if (P.x>x0&&P.x<x1&&P.z>z0&&P.z<z1){ const d=[[P.x-x0,'x',x0],[x1-P.x,'x',x1],[P.z-z0,'z',z0],[z1-P.z,'z',z1]].sort((a,b)=>a[0]-b[0])[0]; P[d[1]]=d[2]; } }
    for (const c of CF_ROUND){ const dx=P.x-c.x, dz=P.z-c.z, d=Math.hypot(dx,dz), r=c.r+R; if (d<r&&d>1e-4){ P.x=c.x+dx/d*r; P.z=c.z+dz/d*r; } }
  }
  P.x=Math.max(-12.4+R,Math.min(9.0,P.x)); P.z=Math.max(-9.8+R,Math.min(2.6-R,P.z));
}
/* 카페에서는 공격 · 스킬 키를 쓰지 않아요 (이동 키는 그대로) */
addEventListener('keydown',e=>{ if (MAPK!=='cafe'||W.state!=='play') return; if (e.target.closest&&e.target.closest('input,textarea')) return;
  if (!e.repeat&&(e.code==='Space'||e.code==='KeyE')&&cfBakeHit()){ e.preventDefault(); e.stopImmediatePropagation(); return; }   // 오븐에서 꺼내기
  if (e.code==='KeyT'){ e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) cfTaste(); return; }                      // 🥄 맛보기
  if (/^(Space|KeyE|KeyQ|KeyR|KeyF|ShiftLeft|ShiftRight|Digit\d)$/.test(e.code)){ e.preventDefault(); e.stopImmediatePropagation(); } },true);
addEventListener('mousedown',e=>{ if (MAPK==='cafe'&&W.state==='play'&&e.target===renderer.domElement){ e.stopImmediatePropagation(); blurAll(); cfBakeHit(); } },true);
/* 다음에 갈 곳 위에 통통 튀는 화살표 (재료 → 토핑 → 오븐 → 서빙) */
function cfArrowMake(){
  const g=new THREE.Group(), mat=new THREE.MeshBasicMaterial({color:0xffb800,toneMapped:false,fog:false}), line=new THREE.MeshBasicMaterial({color:0x3a2230,side:THREE.BackSide,toneMapped:false,fog:false});
  const head=new THREE.Mesh(new THREE.ConeGeometry(.55,.9,4),mat); head.rotation.x=Math.PI; head.rotation.y=Math.PI/4; g.add(head);
  const hl=new THREE.Mesh(head.geometry,line); hl.rotation.copy(head.rotation); hl.scale.setScalar(1.14); g.add(hl);
  const stem=new THREE.Mesh(new THREE.BoxGeometry(.32,.6,.32),mat); stem.position.y=.72; g.add(stem);
  const sl=new THREE.Mesh(stem.geometry,line); sl.position.copy(stem.position); sl.scale.setScalar(1.22); g.add(sl);
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.0,1.3,40),new THREE.MeshBasicMaterial({color:0xffb800,transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
  ring.rotation.x=-Math.PI/2; g.userData.ring=ring; CAFE.dyn.add(ring);
  g.renderOrder=6; CAFE.dyn.add(g); return g;
}
function cfLabelTex(t){ return canvasTex(512,128,g=>{ g.fillStyle='#3a2230'; roundRect(g,8,8,496,112,56); g.fill(); g.fillStyle='#ffd23f'; let fs=64; do { g.font=`bold ${fs}px Jua, "Malgun Gothic", sans-serif`; fs-=4; } while (fs>30&&g.measureText(t).width>460); g.textAlign='center'; g.textBaseline='middle'; g.fillText(t,256,68); }); }
function cfArrowTick(){
  if (!CAFE.arrows){ CAFE.arrows=[0,1,2,3,4].map(cfArrowMake); CAFE.labels={};
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthTest:false,toneMapped:false})); sp.scale.set(3.4,.85,1); sp.renderOrder=7; CAFE.dyn.add(sp); CAFE.label=sp; }
  const C=cfFront(); let pts=[], txt='';
  if (C&&W.state==='play'){
    if (CAFE.step==='mc'){ pts=CF_SHELF.map(s=>[s.x,CF_PAD_Z]); txt='① 정답 재료 고르기'; }
    else if (CAFE.step==='ox'){ pts=CF_OX.map(s=>[s.x,s.z]); txt='② 토핑 O / X'; }
    else if (CAFE.step==='cmb'){ pts=C.o.opts.map((_,i)=>[CF_SHELF[i].x,CF_PAD_Z]); if (CAFE.pick.sel.length) pts.push([CF_OVEN.x,CF_OVEN.z]); txt='① 옳은 보기 모두 담기'; }
    else if (CAFE.step==='ord'){ pts=C.o.opts.map((_,i)=>[CF_SHELF[i].x,CF_PAD_Z]).filter((_,i)=>!CAFE.pick.sel.includes(i)); txt=`① ${CAFE.pick.sel.length+1}층 쌓기`; }
    else if (CAFE.step==='sa'){ txt=''; }
    else if (CAFE.step==='oven'){ pts=[[CF_OVEN.x,CF_OVEN.z]]; txt=CAFE.bake>0?'금색일 때 스페이스!':'③ 오븐에서 굽기'; }
    else if (CAFE.step==='serve'){ pts=[[CF_SERVE.x,CF_SERVE.z]]; txt='④ 손님에게 서빙!'; }
  }
  const t=performance.now()/1000;
  CAFE.arrows.forEach((a,i)=>{ const p=pts[i]; a.visible=!!p; a.userData.ring.visible=!!p; if (!p) return;
    const here=Math.hypot(P.x-p[0],P.z-p[1])<1.15, bob=Math.abs(Math.sin(t*3.4+i*.5))*.45;
    a.position.set(p[0],(here?2.3:1.7)+bob,p[1]); a.rotation.y=t*1.6; a.scale.setScalar(pts.length>2?.8:1); if (CAFE.step==='cmb'&&i<C.o.opts.length&&CAFE.pick.sel.includes(i)) a.scale.setScalar(.5);
    a.userData.ring.position.set(p[0],.06,p[1]); a.userData.ring.scale.setScalar(1+.12*Math.sin(t*5+i)); a.userData.ring.material.opacity=here?.95:.6; });
  const L=CAFE.label; L.visible=!!txt;
  if (txt){ if (!CAFE.labels[txt]) CAFE.labels[txt]=cfLabelTex(txt); if (L.material.map!==CAFE.labels[txt]){ L.material.map=CAFE.labels[txt]; L.material.needsUpdate=true; }
    const shelf=CAFE.step==='mc'||CAFE.step==='cmb'||CAFE.step==='ord', pp=shelf?pts.filter(p=>p[1]===CF_PAD_Z):pts, q=pp.length?pp:pts;
    const cx=shelf?.0:q.reduce((s,p)=>s+p[0],0)/q.length, cz=q.reduce((s,p)=>s+p[1],0)/q.length;
    L.position.set(cx,(shelf?.9:3.6)+Math.sin(t*2)*.08,cz+(shelf?1.7:0)); }
}
function cafeEndUI(){
  Object.values(PCH).forEach(c=>cfHands(c,false)); CAFE.carryW=0;
  document.body.classList.remove('cafe'); ['#cfHud','#cfQ','#cfRes','#cfHelp','#cfOven'].forEach(s=>{ const e=$(s); if (e) e.hidden=true; });
  for (const C of CAFE.cust){ C.el&&C.el.remove(); } $('#cfBubs')&&($('#cfBubs').innerHTML=''); cfCarry(null);
  if (CAFE.arrows){ CAFE.arrows.forEach(a=>{ a.visible=false; a.userData.ring.visible=false; }); CAFE.label.visible=false; }
}
function cafeSummary(){ const st=cfStars(); return `손님 ${CAFE.n}명 중 ${CAFE.perfect}명이 완벽한 디저트를 받았어요 · 별점 ★${st.toFixed(1)} · 팁 ${CAFE.tips.toLocaleString('ko-KR')}`+
  (CAFE.bakePerf?` · ✨ 완벽 굽기 ${CAFE.bakePerf}번`:'')+(CAFE.confident?` · 💪 자신 있게 서빙 ${CAFE.confident}번`:'')+(CAFE.fixedBack?` · 🔁 다시 찾아온 손님 ${CAFE.fixedBack}명 만족`:'')+(CAFE.lost?` · 기다리다 간 손님 ${CAFE.lost}명`:'')+'. '; }
