/* 사회 게임 RPG · 🍰 디저트 카페 · 손님 주문서(문제)를 보고 정답 재료로 디저트를 만들어 서빙해요
   한 주문 = 4지선다 1개(재료 선반) + O/X 1개(토핑대) → 오븐 → 카운터에서 서빙. 답이 맞았는지는 서빙할 때 손님 반응으로 알 수 있어요.
   몬스터 · 쓰러짐이 없는 평화 모드예요. 파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
const CF_SHELF=[{x:-6.6,c:'#ff6b8a',n:'딸기',hex:0xff6b8a},{x:-2.2,c:'#8b5a3c',n:'초콜릿',hex:0x8b5a3c},{x:2.2,c:'#e0a800',n:'레몬',hex:0xffd84a},{x:6.6,c:'#6c5ce7',n:'블루베리',hex:0x7c6cf0}];
const CF_PAD_Z=-5.9, CF_OX=[{x:-7.3,z:-.4,c:'#e5484d',n:'O 체리'},{x:-7.3,z:2.8,c:'#22a35a',n:'X 민트'}], CF_OVEN={x:-7.4,z:-3.6}, CF_SERVE={x:3.6,z:-.2};
const CF_SLOT=[{x:7.9,z:-2.6},{x:7.9,z:.4},{x:7.9,z:3.4}], CF_DOOR={x:9.6,z:9.5};
const CF_LV={easy:{n:8,pat:95,gap:11},normal:{n:10,pat:80,gap:10},hard:{n:12,pat:66,gap:9},hero:{n:14,pat:54,gap:8}};
const CF_GUEST=['mage','rogue','barbarian'];
const CAFE={root:null,dyn:null,panels:[],oxPanels:[],cust:[],spawned:0,n:10,lv:null,nextSpawn:0,step:'',pick:{mc:null,ox:null},stand:null,standT:0,bake:0,carry:null,
  tips:0,served:0,perfect:0,lost:0,combo:0,maxCombo:0,scores:[],res:null,id:0,cols:[],help:0};

function buildCafe(){
  const root=new THREE.Group(); CAFE.root=root; scene.add(root);
  const add=(m,x,y,z)=>{ m.position.set(x,y,z); root.add(m); return m; };
  const box=(w,h,d,c,x,y,z,o)=>add(cs(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),std(c,o))),x,y,z);
  const cyl=(rt,rb,h,c,x,y,z,seg)=>add(cs(new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||20),std(c))),x,y,z);
  const sph=(r,c,x,y,z,sx,sy,sz)=>{ const m=add(cs(new THREE.Mesh(new THREE.SphereGeometry(r,18,12),std(c)),false),x,y,z); m.scale.set(sx||1,sy||1,sz||1); return m; };
  const outside=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshBasicMaterial({color:0xf6d7e0})); outside.rotation.x=-Math.PI/2; outside.position.y=-.05; root.add(outside);
  const ft=canvasTex(512,512,(g)=>{ for (let i=0;i<8;i++) for (let j=0;j<8;j++){ g.fillStyle=(i+j)%2?'#f07896':'#ffd8b4'; g.fillRect(i*64,j*64,64,64); } });
  ft.wrapS=ft.wrapT=THREE.RepeatWrapping; ft.repeat.set(3,2.4);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(26,20),toonMat({map:ft})); fl.rotation.x=-Math.PI/2; fl.receiveShadow=true; root.add(fl);
  box(26,5,.5,0x4fb89c,0,2.5,-9.6); box(.5,5,20,0x5cc2a6,-11.3,2.5,0); box(.5,5,20,0x5cc2a6,11.3,2.5,0); box(26,.35,.6,0xffffff,0,1.2,-9.3);
  for (const x of [-9.5,9.5]){ box(3.2,2.2,.2,0xffffff,x,3.1,-9.3); box(2.8,1.8,.22,0x9fd8ff,x,3.1,-9.25); }
  for (let i=0;i<13;i++) box(2,.5,1.1,i%2?0xff8fb0:0xffffff,-12+i*2,4.75,-8.9);
  // 재료 선반 · 재료 모형 · 답 발판
  CF_SHELF.forEach((s,i)=>{ box(3.4,2.3,1.2,0xffffff,s.x,1.15,-8.2); box(3.6,.18,1.35,0xf3c6a4,s.x,2.38,-8.2);
    for (let k=0;k<3;k++){ const x=s.x-1+k, y=2.62;
      if (i===0){ const m=add(new THREE.Mesh(new THREE.ConeGeometry(.28,.5,12),std(0xff4d6d)),x,y+.05,-8.2); m.rotation.x=Math.PI; add(new THREE.Mesh(new THREE.ConeGeometry(.2,.15,6),std(0x4caf50)),x,y+.33,-8.2); }
      if (i===1){ box(.55,.28,.4,0x6b3f25,x,y,-8.2); }
      if (i===2) sph(.27,0xffe14d,x,y+.05,-8.2,1.25,1,1);
      if (i===3){ sph(.17,0x5b4bd6,x-.15,y,-8.2); sph(.17,0x6f5ff0,x+.15,y,-8.1); sph(.17,0x4a3cc0,x,y+.2,-8.25); } }
    cfPad(root,s.x,CF_PAD_Z,s.hex); });
  // 오븐 · 토핑대 · 카운터 · 서빙 발판
  box(2.6,2.6,2.2,0xff6f96,-9.4,1.3,-3.6); box(1.9,1.2,.1,0x3a2230,-9.4,1.35,-2.45); CAFE.ovenGlow=box(1.6,.9,.12,0xffa63d,-9.4,1.35,-2.42,{emissive:0xff7a1a,emissiveIntensity:.25});
  cyl(.25,.25,.6,0xd8d8e0,-8.8,2.9,-4.1); cfPad(root,CF_OVEN.x,CF_OVEN.z,0xff8a3d);
  box(2.4,1.1,4.6,0xffffff,-9.6,.55,1.2);
  sph(.22,0xe8143c,-9.9,1.3,-.3); sph(.22,0xe8143c,-9.6,1.3,-.2);
  for (let k=0;k<3;k++){ const lf=sph(.18,0x5fd38d,-9.8+k*.15,1.25,2.7+k*.12,1,.4,.6); lf.rotation.y=k; }
  CF_OX.forEach((o,i)=>cfPad(root,o.x,o.z,i?0x22a35a:0xe5484d));
  box(2.2,1.3,8,0xffffff,6,.65,.4); box(2.4,.18,8.2,0xf3c6a4,6,1.38,.4); box(.8,.6,.6,0x7ec8e3,6,1.75,-2.9);
  cfPad(root,CF_SERVE.x,CF_SERVE.z,0xffc531);
  // 테이블 · 화분 · 조명
  CAFE.cols=[];
  for (const [x,z] of [[-3.6,5.2],[1.0,5.6],[-2.8,-1.4]]){ cyl(1.0,1.0,.12,0xffffff,x,1.0,z,28); cyl(.12,.18,1,0xf3c6a4,x,.5,z); for (const s of [-1,1]){ cyl(.42,.42,.1,0xff9db5,x+s*1.45,.55,z); cyl(.08,.08,.55,0xf3c6a4,x+s*1.45,.27,z); } CAFE.cols.push({x,z,r:1.25}); }
  for (const [x,z] of [[-10.5,-8.4],[10.5,-8.4],[-10.5,8],[10.5,8.4]]){ cyl(.5,.38,.8,0xffffff,x,.4,z); sph(.75,0x6fcf87,x,1.3,z); sph(.5,0x58b872,x+.3,1.75,z-.1); }
  for (const x of [-6,0,6]){ const l=add(new THREE.Mesh(new THREE.SphereGeometry(.35,14,10),new THREE.MeshBasicMaterial({color:0xfff3c4})),x,4.2,-2); l.userData.noBloom=true; }
  CAFE.dyn=new THREE.Group(); root.add(CAFE.dyn);
}
function cfPad(root,x,z,hex){
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.25,.06,40),new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity:.42,depthWrite:false})); pad.position.set(x,.03,z); root.add(pad);
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.16,1.32,48),new THREE.MeshBasicMaterial({color:0xffffff})); ring.rotation.x=-Math.PI/2; ring.position.set(x,.07,z); root.add(ring);
  return pad;
}
MAP_BUILD.cafe=()=>buildCafe();
GRASS_OK.cafe=null;

/* 선반 위 보기 판 (주문이 바뀔 때마다 다시 그려요) */
function cfPanel(x,y,z,tex,w,h){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true,toneMapped:false})); m.position.set(x,y,z); m.rotation.x=-.55; CAFE.dyn.add(m); return m; }
function cfClearPanels(){ for (const m of [...CAFE.panels,...CAFE.oxPanels]){ CAFE.dyn.remove(m); m.material.map&&m.material.map.dispose(); m.material.dispose(); m.geometry.dispose(); } CAFE.panels=[]; CAFE.oxPanels=[]; }

/* 손님 */
function cfOrder(){
  const hasMC=MC.length>0, hasOX=OX.length>0;
  const mc=hasMC?pick(['mc'],MC):null, ox=hasOX?pick(['ox'],OX):null;
  let opts=null, ci=-1; if (mc){ const order=mc.o.map((_,i)=>i).sort(()=>Math.random()-.5); opts=order.map(i=>mc.o[i]); ci=order.indexOf(0); }
  return {mc,ox,opts,ci,oxci:ox?(ox.a?0:1):-1};
}
function cfSpawn(){
  const o=cfOrder(); if (!o.mc&&!o.ox) return;
  const key=CF_GUEST[CAFE.spawned%CF_GUEST.length], c=makeChar(key,1,{idle:'Idle',cheer:'Cheer'});
  c.root.traverse(m=>{ if (/sword|shield|blade|axe|staff|wand|knife|dagger|crossbow|spellbook|mug/i.test(m.name)&&!m.isBone) m.visible=false; });
  c.root.position.set(CF_DOOR.x,0,CF_DOOR.z); c.root.rotation.y=-Math.PI/2; CAFE.dyn.add(c.root); c.anim.setBase('idle');
  const pat=CAFE.lv.pat*(MODE==='hero'?1:(EASEF.quiz||1));
  const C={id:++CAFE.id,no:++CAFE.spawned,c,o,pat,left:pat,x:CF_DOOR.x,z:CF_DOOR.z,leaving:0,mood:'',el:null,happyT:0};
  const el=document.createElement('div'); el.className='cf-bub'; $('#cfBubs').appendChild(el); C.el=el;
  CAFE.cust.push(C); if (cfFront()===C) cfActivate();
}
function cfFront(){ return CAFE.cust.find(c=>!c.leaving)||null; }
function cfActivate(){
  cfClearPanels(); CAFE.pick={mc:null,ox:null}; CAFE.bake=0; cfCarry(null);
  const C=cfFront(); if (!C){ $('#cfQ').hidden=true; CAFE.step=''; return; }
  const o=C.o;
  if (o.mc) o.opts.forEach((t,i)=>{ const s=CF_SHELF[i]; CAFE.panels.push(cfPanel(s.x,3.25,-7.25,runPanelTex(String(i+1),t,s.c,false),3.3,2.48)); });
  if (o.ox) CF_OX.forEach((s,i)=>{ CAFE.oxPanels.push(cfPanel(s.x-2.2,1.95,s.z,runPanelTex(i?'X':'O','',s.c,true),1.7,1.1)); });
  CAFE.step=o.mc?'mc':'ox';
  cfQUI(); try{ SFX.wave(); }catch(e){}
}
function cfQUI(){
  const C=cfFront(); if (!C){ $('#cfQ').hidden=true; return; } const o=C.o;
  $('#cfQ').hidden=false;
  $('#cfQNo').textContent=`주문 #${C.no}`;
  const mcDone=CAFE.pick.mc!=null, oxDone=CAFE.pick.ox!=null;
  const showOx=!o.mc||(mcDone&&CAFE.step!=='mc');
  $('#cfQKind').textContent=showOx&&o.ox?'토핑 · O/X':'재료 · 4지선다';
  $('#cfQText').textContent=showOx&&o.ox?o.ox.q:o.mc.q;
  const box=$('#cfOpts');
  if (showOx&&o.ox){ box.className='run-opts two'; box.innerHTML=CF_OX.map((s,i)=>`<div class="run-opt${CAFE.pick.ox===i?' on':''}" style="--c:${s.c}"><b>${i?'X':'O'}</b><span>${i?'민트 (틀리다)':'체리 (맞다)'}</span></div>`).join(''); }
  else { box.className='run-opts'; box.innerHTML=o.opts.map((t,i)=>`<div class="run-opt${CAFE.pick.mc===i?' on':''}" style="--c:${CF_SHELF[i].c}"><b>${i+1}</b><span>${esc(t)}</span></div>`).join(''); }
  const steps=[]; if (o.mc) steps.push(['재료',mcDone]); if (o.ox) steps.push(['토핑',oxDone]); steps.push(['오븐',CAFE.step==='serve']); steps.push(['서빙',false]);
  const cur={mc:'재료',ox:'토핑',oven:'오븐',serve:'서빙'}[CAFE.step];
  $('#cfSteps').innerHTML=steps.map(([n,d])=>`<span class="${d?'done':n===cur?'now':''}">${d?'✓ ':''}${n}</span>`).join('<i>›</i>');
  $('#cfHint').textContent=CAFE.step==='mc'?'정답 재료 선반 앞 발판에 서요':CAFE.step==='ox'?'왼쪽 토핑대: 맞으면 O(체리), 틀리면 X(민트) 발판':CAFE.step==='oven'?'왼쪽 오븐 앞 발판에 서서 구워요 (재료를 바꾸려면 다른 발판에 다시 서요)':'카운터 앞 노란 발판에서 손님에게 서빙!';
}
/* 내가 들고 있는 쟁반 */
function cfCarry(kind){
  if (!CAFE.tray){ const g=new THREE.Group(); const t=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.05,20),std(0xd8d8e0)); g.add(t);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.3,18),std(0xffe0b0)); base.position.y=.18; g.add(base);
    const top=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.1,18),std(0xff6b8a)); top.position.y=.36; g.add(top);
    const ch=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),std(0xe8143c)); ch.position.y=.47; g.add(ch);
    g.position.set(0,1.45,.62); CAFE.tray={g,base,top,ch}; }
  const T=CAFE.tray; if (!kind){ if (T.g.parent) T.g.parent.remove(T.g); return; }
  if (T.g.parent!==pg) pg.add(T.g);
  const mcI=CAFE.pick.mc, oxI=CAFE.pick.ox;
  T.base.visible=true; T.top.visible=mcI!=null; if (mcI!=null) T.top.material.color.setHex(CF_SHELF[mcI].hex);
  T.ch.visible=oxI!=null; if (oxI!=null) T.ch.material.color.setHex(oxI?0x5fd38d:0xe8143c);
  T.base.material.color.setHex(kind==='baked'?0xe9b36a:0xffe0b0);
}

/* ---------- 판 진행 ---------- */
function cafeReset(){
  document.body.classList.remove('cafe'); ['#cfHud','#cfQ','#cfRes','#cfHelp'].forEach(s=>{ const e=$(s); if (e) e.hidden=true; });
  if (MAPK!=='cafe' || !CAFE.dyn){ return; }
  cfClearPanels(); for (const C of CAFE.cust){ CAFE.dyn.remove(C.c.root); C.el&&C.el.remove(); } CAFE.cust=[]; $('#cfBubs').innerHTML='';
  const lv=CF_LV[MODE==='hero'?'hero':LEVEL]||CF_LV.normal;
  Object.assign(CAFE,{lv,n:lv.n,spawned:0,nextSpawn:1.2,step:'',pick:{mc:null,ox:null},stand:null,standT:0,bake:0,tips:0,served:0,perfect:0,lost:0,combo:0,maxCombo:0,scores:[],res:null,help:W.t+8});
  cfCarry(null);
  P.x=0; P.z=-1.5; P.fx=0; P.fz=-1; W.nextWaveAt=-1; W.nextQuiz=1e9; W.snapCam=true;
  document.body.classList.add('cafe'); $('#cfHud').hidden=false;
  setTimeout(()=>{ if (MAPK==='cafe'&&W.state==='play') showBanner('달콤 카페 영업 시작!'); },300);
}
function cfStars(){ if (!CAFE.scores.length) return 3; return Math.round(CAFE.scores.reduce((a,b)=>a+b,0)/CAFE.scores.length*2)/2; }
function cfAt(x,z,r){ return Math.hypot(P.x-x,P.z-z)<(r||1.15); }
function cfPadTick(dt){
  const C=cfFront(); if (!C) return;
  let here=null;
  if (C.o.mc&&CAFE.step!=='serve') CF_SHELF.forEach((s,i)=>{ if (cfAt(s.x,CF_PAD_Z)) here='mc'+i; });
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
  else if (here==='oven'&&CAFE.step==='oven'){ CAFE.bake+=dt; if (CAFE.bake>=2.2){ CAFE.step='serve'; CAFE.bake=0; cfCarry('baked'); try{ SFX.wave(); }catch(e){} fx.burst(CF_OVEN.x,1.8,CF_OVEN.z,0xffc531,20,4); cfQUI(); } }
  else if (here==='serve'&&CAFE.step==='serve'&&CAFE.standT>=.25){ cfServe(C); CAFE.standT=-99; }
}
function cfServe(C){
  const o=C.o, okMc=o.mc?CAFE.pick.mc===o.ci:null, okOx=o.ox?CAFE.pick.ox===o.oxci:null;
  if (o.mc) settle(okMc,o.mc,{type:'cafe'}); if (o.ox) settle(okOx,o.ox,{type:'cafe'});
  const n=(o.mc?1:0)+(o.ox?1:0), good=(okMc?1:0)+(okOx?1:0), perfect=good===n;
  if (perfect){ CAFE.combo++; CAFE.perfect++; } else CAFE.combo=0; CAFE.maxCombo=Math.max(CAFE.maxCombo,CAFE.combo);
  const mul=1+.25*Math.min(4,Math.max(0,CAFE.combo-1)), hurry=C.left/C.pat;
  const tip=Math.round((good*20+(perfect?Math.round(hurry*20):0))*mul);
  CAFE.tips+=tip; CAFE.served++; CAFE.scores.push(perfect?5:good?3:1);
  W.cardCoins=(W.cardCoins||0)+(perfect?4:good?2:0);
  C.mood=perfect?'happy':good?'ok':'sad'; C.happyT=W.t+2.2;
  if (perfect){ C.c.anim.once('cheer',1); try{ SFX.correct(); }catch(e){} fx.burst(C.x,2.6,C.z,0xff4d88,26,5); }
  else if (good){ try{ SFX.correct(); }catch(e){} } else { try{ SFX.wrong(); }catch(e){} }
  const line=(item,ok,ans)=>`<li class="${ok?'g':'b'}"><b>${ok?'정답':'아쉬워요'}</b> ${esc(item.q)}<br><small>정답: ${esc(ans)}${item.e?` · ${esc(item.e)}`:''}</small></li>`;
  const r=$('#cfRes'); r.className='run-res cf-res '+(perfect?'good':good?'mid':'bad'); r.hidden=false;
  r.innerHTML=`<b>${perfect?'"딱 제가 원하던 맛이에요!"':good?'"음, 괜찮네요!"':'"음… 이게 아닌데요?"'}</b> <small>${tip?`+${tip} 팁`:''}${CAFE.combo>=2?` · 🔥 ${CAFE.combo}콤보`:''}</small><ul>`+
    (o.mc?line(o.mc,okMc,correctText(o.mc)):'')+(o.ox?line(o.ox,okOx,correctText(o.ox)):'')+'</ul>';
  CAFE.res=W.t+(perfect?4:6.5);
  cfLeave(C);
}
function cfLeave(C){ C.leaving=1; C.el.classList.add('out'); setTimeout(()=>C.el&&C.el.remove(),600); cfActivate(); }
function cfUpdate(dt){
  // 손님 오기
  const waiting=CAFE.cust.filter(c=>!c.leaving).length;
  if (CAFE.spawned<CAFE.n && waiting<3 && W.t>=CAFE.nextSpawn){ cfSpawn(); CAFE.nextSpawn=W.t+CAFE.lv.gap*(waiting===0?.3:1); }
  // 손님 줄 서기 · 기다리기 · 떠나기
  let slot=0;
  for (const C of CAFE.cust){
    let tx,tz;
    if (C.leaving){ tx=CF_DOOR.x; tz=CF_DOOR.z+2; }
    else { const s=CF_SLOT[Math.min(2,slot++)]; tx=s.x; tz=s.z;
      if (Math.hypot(C.x-tx,C.z-tz)<.4) C.left-=dt;
      if (C.left<=0){ CAFE.lost++; CAFE.combo=0; CAFE.scores.push(0); C.mood='sad'; const front=cfFront()===C;
        C.leaving=1; C.el.classList.add('out'); setTimeout(()=>C.el&&C.el.remove(),600); flashCf(`주문 #${C.no} 손님이 기다리다 갔어요…`);
        if (front) cfActivate(); continue; } }
    const dx=tx-C.x, dz=tz-C.z, d=Math.hypot(dx,dz), sp=C.leaving?3.2:3.8;
    if (d>.05){ const k=Math.min(1,sp*dt/d); C.x+=dx*k; C.z+=dz*k; }
    C.c.root.position.set(C.x,Math.abs(Math.sin(W.t*9))*(d>.1?.12:0),C.z); C.c.root.rotation.y=d>.1?Math.atan2(dx,dz):-Math.PI/2;
    C.c.mixer.update(dt);
  }
  CAFE.cust=CAFE.cust.filter(C=>{ if (C.leaving&&Math.hypot(C.x-CF_DOOR.x,C.z-CF_DOOR.z-2)<.3){ CAFE.dyn.remove(C.c.root); return false; } return true; });
  cfPadTick(dt);
  if (CAFE.res && W.t>=CAFE.res){ CAFE.res=null; $('#cfRes').hidden=true; }
  if (CAFE.help && W.t>=CAFE.help){ CAFE.help=0; $('#cfHelp').hidden=true; }
  CAFE.ovenGlow.material.emissiveIntensity=CAFE.bake>0?.6+.4*Math.sin(W.t*12):.25;
  // 끝
  if (CAFE.spawned>=CAFE.n && !CAFE.cust.length && W.state==='play'){ CAFE.done=true; setTimeout(()=>{ if (MAPK==='cafe'&&W.state==='play') endGame(true); },700); CAFE.spawned=1e9; }
}
function flashCf(t){ const e=$('#cfToast'); e.textContent=t; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }
const _cfV=new THREE.Vector3();
function cfBubbles(){
  const r=renderer.domElement.getBoundingClientRect(), front=cfFront();
  for (const C of CAFE.cust){ if (!C.el) continue;
    _cfV.set(C.x,3.3,C.z).project(camera); const x=r.left+(_cfV.x+1)/2*r.width, y=r.top+(1-_cfV.y)/2*r.height;
    C.el.style.transform=`translate(${Math.round(x-80)}px,${Math.round(y-56)}px)`;
    const k=Math.max(0,C.left/C.pat), col=k>.5?'#3fb26b':k>.25?'#f2a516':'#e5484d';
    const what=C.o.mc&&C.o.ox?'케이크 + 토핑':C.o.mc?'케이크':'파르페';
    const html=C.leaving?(C.mood==='happy'?'<b class="hp">💖 맛있어요!</b>':C.mood==='ok'?'<b>🙂 고마워요</b>':'<b class="sd">😢</b>')
      :`<div class="t"><span>주문 #${C.no}</span><em>${C===front?'지금 만드는 중':what}</em></div><div class="bar"><i style="width:${Math.round(k*100)}%;background:${col}"></i></div>`;
    if (C.el._h!==html){ C.el._h=html; C.el.innerHTML=html; } C.el.classList.toggle('front',C===front&&!C.leaving); }
}
function cfHUD(){
  const st=cfStars();
  $('#cfStars').textContent=`★ ${st.toFixed(1)}`;
  $('#cfTips').textContent=`팁 ${CAFE.tips.toLocaleString('ko-KR')}`;
  $('#cfCount').textContent=`손님 ${Math.min(CAFE.served+CAFE.lost,CAFE.n)}/${CAFE.n}`;
  $('#cfCombo').textContent=CAFE.combo>=2?`🔥 ${CAFE.combo}콤보`:'';
  const ob=$('#cfOven'); ob.hidden=!(CAFE.step==='oven'&&CAFE.stand==='oven'); if (!ob.hidden) ob.firstChild.style.width=Math.round(CAFE.bake/2.2*100)+'%';
}
function cafeFrame(dt,real,now){
  if (knight && (knight.anim.dead||endPose)){ knight.anim.revive(); endPose=false; }
  if (!W.paused){ W.t+=dt; cfUpdate(dt); }
  lobbyTick(real,dt);
  let moving=false;
  if (!W.paused){
    const am=arrowsMove();
    let ix=(keys.KeyD||am&&keys.ArrowRight?1:0)-(keys.KeyA||am&&keys.ArrowLeft?1:0)+joy.x, iz=(keys.KeyS||am&&keys.ArrowDown?1:0)-(keys.KeyW||am&&keys.ArrowUp?1:0)+joy.y;
    const L=Math.hypot(ix,iz); if (L>.12){ if (L>1){ ix/=L; iz/=L; } P.x+=ix*7.5*dt; P.z+=iz*7.5*dt; P.fx=ix; P.fz=iz; moving=true; }
    P.x=Math.max(-8.1,Math.min(4.75,P.x)); P.z=Math.max(-7.0,Math.min(8.6,P.z));
    for (const c of CAFE.cols){ const dx=P.x-c.x, dz=P.z-c.z, d=Math.hypot(dx,dz); if (d<c.r&&d>1e-4){ P.x=c.x+dx/d*c.r; P.z=c.z+dz/d*c.r; } }
  }
  pg.position.set(P.x,0,P.z);
  { let dy=Math.atan2(P.fx,P.fz)-pg.rotation.y; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); pg.rotation.y+=dy*Math.min(1,dt*14); }
  if (knight){ setBaseSynced(knight.anim,moving?'run':'idle',moving?1.15:1); knight.mixer.update(W.paused?0:dt); }
  fx.update(dt); updateCombatFx(dt); updateDreamy(real); qualityTick(now);
  { const o=sun.userData.off||[22,38,14]; sun.position.set(P.x+o[0],o[1],P.z+o[2]); sun.target.position.set(P.x,0,P.z); sun.target.updateMatrixWorld(); }
  const cx=.8+P.x*.06, cz=P.z*.06, tgt=new THREE.Vector3(cx,16,12.6+cz); camera.position.lerp(tgt,W.snapCam?1:Math.min(1,dt*5)); W.snapCam=false; camera.lookAt(cx,0,-3.0+cz);
  limitTick(); if (W.state!=='play'){ renderFrame(); return; }
  cfHUD(); renderFrame(); cfBubbles();
}
/* 카페에서는 공격 · 스킬 키를 쓰지 않아요 (이동 키는 그대로) */
addEventListener('keydown',e=>{ if (MAPK!=='cafe'||W.state!=='play') return; if (/^(Space|KeyE|KeyQ|KeyR|KeyF|ShiftLeft|ShiftRight|Digit\d)$/.test(e.code)){ e.preventDefault(); e.stopImmediatePropagation(); } },true);
addEventListener('mousedown',e=>{ if (MAPK==='cafe'&&W.state==='play'&&e.target===renderer.domElement){ e.stopImmediatePropagation(); } },true);
function cafeEndUI(){
  document.body.classList.remove('cafe'); ['#cfHud','#cfQ','#cfRes','#cfHelp','#cfOven'].forEach(s=>{ const e=$(s); if (e) e.hidden=true; });
  for (const C of CAFE.cust){ C.el&&C.el.remove(); } $('#cfBubs')&&($('#cfBubs').innerHTML=''); cfCarry(null);
}
function cafeSummary(){ const st=cfStars(); return `손님 ${CAFE.n}명 중 ${CAFE.perfect}명이 완벽한 디저트를 받았어요 · 별점 ★${st.toFixed(1)} · 팁 ${CAFE.tips.toLocaleString('ko-KR')}`+(CAFE.lost?` · 기다리다 간 손님 ${CAFE.lost}명`:'')+'. '; }
