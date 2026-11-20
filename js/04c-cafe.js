/* 사회 게임 RPG · 🍰 디저트 카페 · 손님 주문서(문제)를 보고 정답 재료로 디저트를 만들어 서빙해요
   한 주문 = 4지선다 1개(재료 선반) + O/X 1개(토핑대) → 오븐 → 카운터에서 서빙. 답이 맞았는지는 서빙할 때 손님 반응으로 알 수 있어요.
   몬스터 · 쓰러짐이 없는 평화 모드예요. 파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
const CF_SHELF=[{x:-6.6,c:'#ff6b8a',n:'딸기',hex:0xff6b8a},{x:-2.2,c:'#8b5a3c',n:'초콜릿',hex:0x8b5a3c},{x:2.2,c:'#e0a800',n:'레몬',hex:0xffd84a},{x:6.6,c:'#6c5ce7',n:'블루베리',hex:0x7c6cf0}];
const CF_PAD_Z=-5.9, CF_OX=[{x:-7.3,z:-1.5,c:'#e5484d',n:'O 체리'},{x:-7.3,z:1.05,c:'#22a35a',n:'X 민트'}], CF_OVEN={x:-7.4,z:-4.1}, CF_SERVE={x:3.6,z:-.2};
const CF_SLOT=[{x:8.3,z:-3.2},{x:8.3,z:-.4},{x:8.3,z:2.4}], CF_DOOR={x:9.6,z:9.5};
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
  box(2.6,2.6,2.2,0xff6f96,-9.4,1.3,-4.1); box(1.9,1.2,.1,0x3a2230,-9.4,1.35,-2.95); CAFE.ovenGlow=box(1.6,.9,.12,0xffa63d,-9.4,1.35,-2.92,{emissive:0xff7a1a,emissiveIntensity:.25});
  cyl(.25,.25,.6,0xd8d8e0,-8.8,2.9,-4.6); cfPad(root,CF_OVEN.x,CF_OVEN.z,0xff8a3d);
  box(2.4,1.1,4.2,0xffffff,-9.6,.55,-.2);
  sph(.22,0xe8143c,-9.9,1.3,-1.4); sph(.22,0xe8143c,-9.6,1.3,-1.3);
  for (let k=0;k<3;k++){ const lf=sph(.18,0x5fd38d,-9.8+k*.15,1.25,.95+k*.12,1,.4,.6); lf.rotation.y=k; }
  CF_OX.forEach((o,i)=>cfPad(root,o.x,o.z,i?0x22a35a:0xe5484d));
  box(2.2,1.3,8,0xffffff,6,.65,.4); box(2.4,.18,8.2,0xf3c6a4,6,1.38,.4); box(.8,.6,.6,0x7ec8e3,6,1.75,3.6);
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
function cfSpawn(){
  const o=cfOrder(); if (!o.mc&&!o.ox&&!o.sp) return;
  const g=cfGuest(), c=makePlayerChar(g.job);
  dressP2(c,g.look).catch(()=>{});
  c.root.position.set(CF_DOOR.x,0,CF_DOOR.z); c.root.rotation.y=-Math.PI/2; CAFE.dyn.add(c.root); c.anim.setBase('idle');
  const pat=CAFE.lv.pat*(MODE==='hero'?1:(EASEF.quiz||1));
  const pat2=pat*(CF_KIND[o.k].pat||1);
  const C={id:++CAFE.id,no:++CAFE.spawned,name:g.n,c,o,pat:pat2,left:pat2,x:CF_DOOR.x,z:CF_DOOR.z,leaving:0,mood:'',el:null,happyT:0};
  const el=document.createElement('div'); el.className='cf-bub'; $('#cfBubs').appendChild(el); C.el=el;
  CAFE.cust.push(C); if (cfFront()===C) cfActivate();
}
function cfFront(){ return CAFE.cust.find(c=>!c.leaving)||null; }
function cfActivate(){
  cfClearPanels(); CAFE.pick={mc:null,ox:null,sel:[],sa:null,hint:false}; CAFE.bake=0; cfCarry(null); CAFE.qxKey='';
  const C=cfFront(); if (!C){ $('#cfQ').hidden=true; CAFE.step=''; return; }
  const o=C.o;
  if (o.mc) o.opts.forEach((t,i)=>{ const s=CF_SHELF[i]; CAFE.panels.push(cfPanel(s.x,3.25,-7.25,runPanelTex(String(i+1),t,s.c,false),3.3,2.48)); });
  if (o.ox) CF_OX.forEach((s,i)=>{ CAFE.oxPanels.push(cfPanel(s.x-2.2,1.95,s.z,runPanelTex(i?'X':'O','',s.c,true),1.7,1.1)); });
  if (o.k==='cmb'||o.k==='ord') o.opts.forEach((t,i)=>{ const s=CF_SHELF[i]; CAFE.panels.push(cfPanel(s.x,3.25,-7.25,runPanelTex(o.k==='cmb'?QX_LET[i]:'ABCD'[i],t,s.c,false),3.3,2.48)); });
  CAFE.step=o.k==='base'?(o.mc?'mc':'ox'):o.k;
  cfQUI(); try{ SFX.wave(); }catch(e){}
  if (o.k==='sa') setTimeout(()=>{ const el=$('#cfSaIn'); if (el&&cfFront()===C) el.focus(); },350);
}
function cfQUI(){
  const C=cfFront(); if (!C){ $('#cfQ').hidden=true; return; } const o=C.o;
  $('#cfQ').hidden=false;
  $('#cfQNo').textContent=`주문 #${C.no}`;
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
    $('#cfHint').textContent=CAFE.step==='mc'?'정답 재료 선반 앞 발판에 서요':CAFE.step==='ox'?'왼쪽 토핑대: 맞으면 O(체리), 틀리면 X(민트) 발판':CAFE.step==='oven'?'왼쪽 오븐 앞 발판에 서서 구워요 (재료를 바꾸려면 다른 발판에 다시 서요)':'카운터 앞 노란 발판에서 손님에게 서빙!';
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
      $('#cfHint').textContent=CAFE.pick.sa==null?'정답을 써서 주문서를 완성해요 (쓰는 동안은 움직이지 않아요 · Esc로 빠져나오기)':CAFE.step==='oven'?'왼쪽 오븐 앞 발판에 서서 구워요':'카운터 앞 노란 발판에서 손님에게 서빙!';
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
        $('#cfHint').textContent=CAFE.step==='ord'?`먼저 일어나는 것부터 발판을 차례로 밟아 한 층씩 쌓아요 (${sel.length}/${o.opts.length}층)`:CAFE.step==='oven'?'다 쌓았어요! 왼쪽 오븐 앞 발판에서 구워요':'카운터 앞 노란 발판에서 손님에게 서빙!';
      }
    }
  }
  steps.push(['오븐',CAFE.step==='serve']); steps.push(['서빙',false]);
  $('#cfSteps').innerHTML=steps.map(([n,d])=>`<span class="${d?'done':n===cur0?'now':''}">${d?'✓ ':''}${n}</span>`).join('<i>›</i>');
}
/* 내가 들고 있는 쟁반 */
function cfCarry(kind){
  if (!CAFE.tray){ const g=new THREE.Group(); const t=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.05,20),std(0xd8d8e0)); g.add(t);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.3,18),std(0xffe0b0)); base.position.y=.18; g.add(base);
    const top=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.1,18),std(0xff6b8a)); top.position.y=.36; g.add(top);
    const ch=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),std(0xe8143c)); ch.position.y=.47; g.add(ch);
    const layers=[0,1,2,3].map(k=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(.32-k*.04,.32-k*.04,.16,18),std(0xffffff)); m.position.y=.42+k*.17; g.add(m); return m; });
    g.position.set(0,1.45,.62); CAFE.tray={g,base,top,ch,layers}; }
  const T=CAFE.tray; if (!kind){ if (T.g.parent) T.g.parent.remove(T.g); return; }
  if (T.g.parent!==pg) pg.add(T.g);
  const mcI=CAFE.pick.mc, oxI=CAFE.pick.ox;
  T.base.visible=true; T.top.visible=mcI!=null; if (mcI!=null) T.top.material.color.setHex(CF_SHELF[mcI].hex);
  T.ch.visible=oxI!=null; if (oxI!=null) T.ch.material.color.setHex(oxI?0x5fd38d:0xe8143c);
  const C=cfFront(), k=C?C.o.k:'base', sel=CAFE.pick.sel||[];
  T.layers.forEach((m,j)=>{ m.visible=k==='ord'&&j<sel.length; if (m.visible) m.material.color.setHex(CF_SHELF[sel[j]].hex); });
  if (k==='ord'){ T.top.visible=false; T.ch.visible=false; }
  if (k==='cmb'){ T.top.visible=true; T.top.material.color.setHex(0xfff0f5); T.ch.visible=sel.length>0; T.ch.material.color.setHex(sel.length?CF_SHELF[sel[sel.length-1]].hex:0xe8143c); T.ch.scale.setScalar(1+.25*sel.length); }
  if (k==='sa'){ T.top.visible=true; T.top.material.color.setHex(0xffb3c7); T.ch.visible=true; T.ch.material.color.setHex(0xffd23f); T.ch.scale.setScalar(1.3); }
  if (k==='base') T.ch.scale.setScalar(1);
  T.base.material.color.setHex(kind==='baked'?0xe9b36a:0xffe0b0);
}

/* ---------- 판 진행 ---------- */
function cafeReset(){
  document.body.classList.remove('cafe'); ['#cfHud','#cfQ','#cfRes','#cfHelp'].forEach(s=>{ const e=$(s); if (e) e.hidden=true; });
  if (MAPK!=='cafe' || !CAFE.dyn){ return; }
  cfClearPanels(); for (const C of CAFE.cust){ CAFE.dyn.remove(C.c.root); C.el&&C.el.remove(); } CAFE.cust=[]; $('#cfBubs').innerHTML='';
  const lv=CF_LV[MODE==='hero'?'hero':LEVEL]||CF_LV.normal;
  Object.assign(CAFE,{lv,n:lv.n,spawned:0,nextSpawn:1.2,step:'',pick:{mc:null,ox:null},stand:null,standT:0,bake:0,tips:0,served:0,perfect:0,lost:0,combo:0,maxCombo:0,scores:[],res:null,help:W.t+8});
  cfCarry(null); cfLoadClass();
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
  else if (here==='oven'&&(CAFE.step==='oven'||CAFE.step==='cmb'&&CAFE.pick.sel.length)){ CAFE.bake+=dt; if (CAFE.bake>=2.2){ CAFE.step='serve'; CAFE.bake=0; cfCarry('baked'); try{ SFX.wave(); }catch(e){} fx.burst(CF_OVEN.x,1.8,CF_OVEN.z,0xffc531,20,4); cfQUI(); } }
  else if (here==='serve'&&CAFE.step==='serve'&&CAFE.standT>=.25){ cfServe(C); CAFE.standT=-99; }
}
function cfServe(C){
  const o=C.o; let n,good,lines,tip0;
  const line=(item,ok,ans,mine,q)=>`<li class="${ok?'g':'b'}"><b>${ok?'정답':'아쉬워요'}</b> ${esc(q||item.q)}<br><small>${mine!=null&&!ok?`내 답: ${esc(mine)} → `:''}정답: ${esc(ans)}${item.e?` · ${esc(item.e)}`:''}</small></li>`;
  if (o.k==='base'){
    const okMc=o.mc?CAFE.pick.mc===o.ci:null, okOx=o.ox?CAFE.pick.ox===o.oxci:null;
    if (o.mc) settle(okMc,o.mc,{type:'cafe'}); if (o.ox) settle(okOx,o.ox,{type:'cafe'});
    n=(o.mc?1:0)+(o.ox?1:0); good=(okMc?1:0)+(okOx?1:0); tip0=good*20;
    lines=(o.mc?line(o.mc,okMc,correctText(o.mc)):'')+(o.ox?line(o.ox,okOx,correctText(o.ox)):'');
  } else {
    const it=o.sp, sel=CAFE.pick.sel; let ok=false, mine='', q=it.q;
    if (o.k==='sa'){ mine=CAFE.pick.sa||''; ok=it.sa.ans.map(qxNorm).includes(qxNorm(mine)); }
    if (o.k==='cmb'){ const s=sel.slice().sort(), a=it.cmb.a; ok=s.length===a.length&&s.every((v,j)=>v===a[j]); mine=s.map(i=>QX_LET[i]).join(', ')||'(없음)'; q=it.cmb.q0+' — '+it.cmb.s.map((v,i)=>`${QX_LET[i]}. ${v}`).join(' / '); }
    if (o.k==='ord'){ const seq=sel.map(i=>o.map[i]); ok=seq.length===it.ord.it.length&&seq.every((v,j)=>v===j); mine=seq.map(j=>it.ord.it[j]).join(' → '); q=String(it.q).replace(/^\[순서\]\s*/,''); }
    settle(ok,it,{type:'cafe'});
    n=1; good=ok?1:0; tip0=ok?Math.round(40*(CAFE.pick.hint?.7:1)):0;
    lines=line(it,ok,correctText(it),mine,q)+(o.k==='ord'&&!ok?'<li class="b"><small>🎂 층 순서가 달라서 케이크가 기울었어요!</small></li>':'');
  }
  const perfect=good===n;
  if (perfect){ CAFE.combo++; CAFE.perfect++; } else CAFE.combo=0; CAFE.maxCombo=Math.max(CAFE.maxCombo,CAFE.combo);
  const mul=1+.25*Math.min(4,Math.max(0,CAFE.combo-1)), hurry=C.left/C.pat;
  const tip=Math.round((tip0+(perfect?Math.round(hurry*20):0))*mul);
  CAFE.tips+=tip; CAFE.served++; CAFE.scores.push(perfect?5:good?3:1);
  W.cardCoins=(W.cardCoins||0)+(perfect?4:good?2:0);
  C.mood=perfect?'happy':good?'ok':'sad'; C.happyT=W.t+2.2;
  if (perfect){ C.c.anim.once('cheer',1); try{ SFX.correct(); }catch(e){} fx.burst(C.x,2.6,C.z,0xff4d88,26,5); }
  else if (good){ try{ SFX.correct(); }catch(e){} } else { try{ SFX.wrong(); }catch(e){} }
  const r=$('#cfRes'); r.className='run-res cf-res '+(perfect?'good':good?'mid':'bad'); r.hidden=false;
  r.innerHTML=`<b>${perfect?'"딱 제가 원하던 맛이에요!"':good?'"음, 괜찮네요!"':'"음… 이게 아닌데요?"'}</b> <small>${tip?`+${tip} 팁`:''}${CAFE.combo>=2?` · 🔥 ${CAFE.combo}콤보`:''}</small><ul>${lines}</ul>`;
  CAFE.res=W.t+(perfect?4:7);
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
    C.c.anim.setBase(d>.1?'run':'idle',d>.1?.8:1); C.c.mixer.update(dt);
  }
  CAFE.cust=CAFE.cust.filter(C=>{ if (C.leaving&&Math.hypot(C.x-CF_DOOR.x,C.z-CF_DOOR.z-2)<.3){ CAFE.dyn.remove(C.c.root); C.c.mixer.stopAllAction(); return false; } return true; });
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
    _cfV.set(C.x,2.9,C.z).project(camera); const x=r.left+(_cfV.x+1)/2*r.width, y=r.top+(1-_cfV.y)/2*r.height;
    C.el.style.transform=`translate(${Math.round(x-65)}px,${Math.round(y-46)}px)`;
    const k=Math.max(0,C.left/C.pat), col=k>.5?'#3fb26b':k>.25?'#f2a516':'#e5484d';
    const what=CF_KIND[C.o.k].what||(C.o.mc&&C.o.ox?'케이크 + 토핑':C.o.mc?'케이크':'파르페');
    const html=C.leaving?`<b class="nm">${esc(C.name)}</b> `+(C.mood==='happy'?'<b class="hp">💖 맛있어요!</b>':C.mood==='ok'?'<b>🙂 고마워요</b>':'<b class="sd">😢</b>')
      :`<div class="t"><b class="nm">${esc(C.name)}</b><em>${C===front?'만드는 중':'#'+C.no}</em></div><div class="bar"><i style="width:${Math.round(k*100)}%;background:${col}"></i></div>`;
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
    P.x=Math.max(-8.1,Math.min(7.9,P.x)); P.z=Math.max(-7.0,Math.min(8.6,P.z));
    // 카운터(오른쪽 긴 탁자)는 통과하지 못해요. 카운터 뒤쪽 끝으로 돌아가면 4번 선반 발판까지 갈 수 있어요
    { const x0=4.75,x1=7.45,z0=-4.25,z1=4.85; if (P.x>x0&&P.x<x1&&P.z>z0&&P.z<z1){ const d=[[P.x-x0,'x',x0],[x1-P.x,'x',x1],[P.z-z0,'z',z0],[z1-P.z,'z',z1]].sort((a,b)=>a[0]-b[0])[0]; P[d[1]]=d[2]; } }
    for (const c of CAFE.cols){ const dx=P.x-c.x, dz=P.z-c.z, d=Math.hypot(dx,dz); if (d<c.r&&d>1e-4){ P.x=c.x+dx/d*c.r; P.z=c.z+dz/d*c.r; } }
  }
  pg.position.set(P.x,0,P.z);
  { let dy=Math.atan2(P.fx,P.fz)-pg.rotation.y; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); pg.rotation.y+=dy*Math.min(1,dt*14); }
  if (knight){ setBaseSynced(knight.anim,moving?'run':'idle',moving?1.15:1); knight.mixer.update(W.paused?0:dt); }
  fx.update(dt); updateCombatFx(dt); updateDreamy(real); qualityTick(now);
  { const o=sun.userData.off||[22,38,14]; sun.position.set(P.x+o[0],o[1],P.z+o[2]); sun.target.position.set(P.x,0,P.z); sun.target.updateMatrixWorld(); }
  const cx=.8+P.x*.06, cz=P.z*.06, tgt=new THREE.Vector3(cx,16,12.6+cz); camera.position.lerp(tgt,W.snapCam?1:Math.min(1,dt*5)); W.snapCam=false; camera.lookAt(cx,0,-3.0+cz);
  limitTick(); if (W.state!=='play'){ renderFrame(); return; }
  cfHUD(); cfArrowTick(); renderFrame(); cfBubbles();
}
/* 카페에서는 공격 · 스킬 키를 쓰지 않아요 (이동 키는 그대로) */
addEventListener('keydown',e=>{ if (MAPK!=='cafe'||W.state!=='play') return; if (e.target.closest&&e.target.closest('input,textarea')) return; if (/^(Space|KeyE|KeyQ|KeyR|KeyF|ShiftLeft|ShiftRight|Digit\d)$/.test(e.code)){ e.preventDefault(); e.stopImmediatePropagation(); } },true);
addEventListener('mousedown',e=>{ if (MAPK==='cafe'&&W.state==='play'&&e.target===renderer.domElement){ e.stopImmediatePropagation(); blurAll(); } },true);
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
    else if (CAFE.step==='oven'){ pts=[[CF_OVEN.x,CF_OVEN.z]]; txt=CAFE.bake>0?'굽는 중…':'③ 오븐에서 굽기'; }
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
  document.body.classList.remove('cafe'); ['#cfHud','#cfQ','#cfRes','#cfHelp','#cfOven'].forEach(s=>{ const e=$(s); if (e) e.hidden=true; });
  for (const C of CAFE.cust){ C.el&&C.el.remove(); } $('#cfBubs')&&($('#cfBubs').innerHTML=''); cfCarry(null);
  if (CAFE.arrows){ CAFE.arrows.forEach(a=>{ a.visible=false; a.userData.ring.visible=false; }); CAFE.label.visible=false; }
}
function cafeSummary(){ const st=cfStars(); return `손님 ${CAFE.n}명 중 ${CAFE.perfect}명이 완벽한 디저트를 받았어요 · 별점 ★${st.toFixed(1)} · 팁 ${CAFE.tips.toLocaleString('ko-KR')}`+(CAFE.lost?` · 기다리다 간 손님 ${CAFE.lost}명`:'')+'. '; }
