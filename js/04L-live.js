/* 사회 게임 RPG · 🏫 수업 모드 (게임이 아니에요)
   선생님이 '수업 모드'에서 방을 열면 그 반 학생들이 한 교실 방에 모여 자유롭게 돌아다녀요.
   선생님이 질문을 띄우면 바닥에 답 구역이 생기고, 학생은 고른 답 구역으로 걸어가서 서면 답이 돼요.
   종류: 4지선다(mc) · O/X(ox) · 단답형(sa, 글자 입력) · 신호등(light) · 찬반(debate, 이유 쓰기) · 수직선(line, 0~100) · 모둠 나누기(group, 2~6칸)
   참여 코인: 답한 질문마다 5코인, 한 번 연 수업(방)에서 최대 50코인
   데이터: live/{학급}/meta {state,t0,q:{id,k,text,opts,ans,ph:'ask'|'lock'|'reveal',res},freeze,pick:{u,n,t}}
           live/{학급}/p/{uid} · pos/{uid} · a/{질문id}/{uid} {v,r,n,t} · log/{질문id} */
const LV_HX=12, LV_Z0=-8.2, LV_Z1=3.6, LV_SZ=6.6, LV_HZ=8.6;   // 방 크기 · 답 구역(z0~z1) · 출발선(z≈6.6)
const LV_COIN=5, LV_COIN_MAX=50;
const LV_PAL=['#e5484d','#3b82f6','#22a35a','#e8a400','#8b5cf6','#ec4899'];
const LV_KIND={mc:'4지선다',ox:'O/X',sa:'단답형',light:'신호등',debate:'찬반',line:'수직선',group:'모둠 나누기'};
const LIVE={cid:'',metaRef:null,meta:null,joining:false,on:false,root:null,zoneG:null,zones:[],q:null,qid:'',ph:'',
  av:{},live:{},liveRef:null,names:{},posT:0,posLast:'',nameT:0,hbT:0,
  holdZ:-2,holdT:0,sent:null,sentQ:'',paid:{},earn:0,lc:0,lk:0,flushT:0,flushing:false,mark:null,pickT:0,spot:null,toastT:0,lineV:-1};

function buildLive(){
  const root=new THREE.Group(); LIVE.root=root; scene.add(root);
  const sky=new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.MeshBasicMaterial({color:0x8fd0ef})); sky.rotation.x=-Math.PI/2; sky.position.y=-30; root.add(sky);
  // 교실 바닥 (나무 마루) + 테두리 + 아래 흙
  const cv=document.createElement('canvas'); cv.width=1024; cv.height=768; const g=cv.getContext('2d');
  g.fillStyle='#d9b98a'; g.fillRect(0,0,1024,768);
  for (let y=0;y<768;y+=48){ for (let x=-(y/48%2)*90;x<1024;x+=180){ g.fillStyle=`hsl(34,${42+Math.random()*10}%,${66+Math.random()*7}%)`; g.fillRect(x+2,y+2,176,44); } }
  g.strokeStyle='rgba(120,84,40,.25)'; g.lineWidth=2; for (let y=0;y<=768;y+=48){ g.beginPath(); g.moveTo(0,y); g.lineTo(1024,y); g.stroke(); }
  const ft=new THREE.CanvasTexture(cv); ft.encoding=THREE.sRGBEncoding; ft.anisotropy=4;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(LV_HX*2+1,LV_HZ*2+1),new THREE.MeshLambertMaterial({map:ft})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; root.add(floor);
  const base=cs(new THREE.Mesh(new THREE.BoxGeometry(LV_HX*2+1.6,1.6,LV_HZ*2+1.6),std(0x6fb04a,{flatShading:true}))); base.position.y=-.82; root.add(base);
  const dirt=new THREE.Mesh(new THREE.ConeGeometry(17,12,7),std(0x8b7d6b,{flatShading:true})); dirt.rotation.x=Math.PI; dirt.position.y=-7.6; dirt.scale.z=.75; root.add(dirt);
  const railM=std(0xffffff,{flatShading:true});
  [[0,-LV_HZ-.65,LV_HX*2+1.6,.5],[0,LV_HZ+.65,LV_HX*2+1.6,.5],[-LV_HX-.65,0,.5,LV_HZ*2+1.8],[LV_HX+.65,0,.5,LV_HZ*2+1.8]].forEach(([x,z,w,d])=>{
    const r=cs(new THREE.Mesh(new THREE.BoxGeometry(w,.45,d),railM)); r.position.set(x,.22,z); root.add(r); });
  // 칠판 (뒤쪽)
  const bd=new THREE.Group(); bd.position.set(0,0,-LV_HZ-1.1); root.add(bd);
  const fr=cs(new THREE.Mesh(new THREE.BoxGeometry(14.4,4.6,.4),std(0x9a6b3c,{flatShading:true}))); fr.position.y=2.6; bd.add(fr);
  const bc=document.createElement('canvas'); bc.width=1024; bc.height=300; LIVE.boardCv=bc; LIVE.boardTex=new THREE.CanvasTexture(bc); LIVE.boardTex.encoding=THREE.sRGBEncoding;
  const face=new THREE.Mesh(new THREE.PlaneGeometry(13.6,3.9),new THREE.MeshBasicMaterial({map:LIVE.boardTex})); face.position.set(0,2.6,.21); bd.add(face);
  lvBoard('🏫 수업 모드','선생님 질문을 기다려요');
  // 출발선
  const st=new THREE.Mesh(new THREE.PlaneGeometry(LV_HX*2-.4,2.8),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.28,depthWrite:false})); st.rotation.x=-Math.PI/2; st.position.set(0,.025,LV_SZ); root.add(st); LIVE.startStrip=st;
  // 주변 화분
  [[-LV_HX-2.2,-6],[-LV_HX-2.2,2],[LV_HX+2.2,-6],[LV_HX+2.2,2],[-8,LV_HZ+2.4],[8,LV_HZ+2.4]].forEach(([x,z],i)=>{ try{ place(i%2?'trees_B_medium':'trees_A_large',x,z,rnd(1.6,2.2),rnd(0,6),false); }catch(e){} });
  for (let i=0;i<14;i++){ const a=i/14*Math.PI*2+rnd(-.1,.1), r=rnd(30,50), s=rnd(1.5,4), gg=new THREE.Group(); gg.position.set(Math.cos(a)*r,rnd(-10,4),Math.sin(a)*r);
    const top=new THREE.Mesh(new THREE.CylinderGeometry(s,s*.9,.5,7),std(0x6fb04a,{flatShading:true})); gg.add(top);
    const bot=new THREE.Mesh(new THREE.ConeGeometry(s*.9,s*1.8,7),std(0x8b7d6b,{flatShading:true})); bot.rotation.x=Math.PI; bot.position.y=-s*.9-.25; gg.add(bot); root.add(gg); }
  LIVE.zoneG=new THREE.Group(); root.add(LIVE.zoneG);
}
MAP_BUILD.live=()=>buildLive();
GRASS_OK.live=null;

function lvBoard(title,sub){ const c=LIVE.boardCv; if (!c) return; const g=c.getContext('2d');
  g.fillStyle='#25543f'; g.fillRect(0,0,c.width,c.height); g.fillStyle='rgba(255,255,255,.05)'; for (let i=0;i<60;i++) g.fillRect(Math.random()*1024,Math.random()*300,rnd(20,90),2);
  g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle';
  const t=String(title||''), fs=t.length>40?40:t.length>26?50:t.length>14?62:78;
  const lines=runWrap(g,t,960,`${fs}px Jua, "Malgun Gothic", sans-serif`,fs*1.15,sub?2:3);
  const h=lines.length*fs*1.15, y0=(sub?128:150)-h/2+fs*.58; lines.forEach((l,i)=>g.fillText(l,512,y0+i*fs*1.15));
  if (sub){ g.fillStyle='#ffe08a'; g.font='40px Jua, "Malgun Gothic", sans-serif'; g.fillText(sub,512,258); }
  LIVE.boardTex.needsUpdate=true; }

/* ---------- 선생님이 연 수업 방 지켜보기 ---------- */
function liveWatch(){
  const cid=fbDb&&typeof stgCidNow==='function'?stgCidNow():'';
  if (cid===LIVE.cid) return;
  if (LIVE.metaRef){ LIVE.metaRef.off(); LIVE.metaRef=null; }
  LIVE.cid=cid; LIVE.meta=null; liveBtn(); if (!cid) return;
  LIVE.metaRef=fbDb.ref(`live/${cid}/meta`);
  LIVE.metaRef.on('value',s=>{ LIVE.meta=s.val(); liveBtn(); if (LIVE.on) lvMeta(); },()=>{});
}
function liveOpen(){ const m=LIVE.meta; return !!m&&m.state==='open'; }
function liveBtn(){ const b=$('#liveBtn'); if (!b) return; const on=liveOpen()&&W.state!=='play'&&!(typeof PARTY!=='undefined'&&PARTY.rid); b.hidden=!on;
  if (on) b.innerHTML=LIVE.meta.q?'🏫 수업 중 · 지금 들어가기 (질문 진행 중)':'🏫 수업 모드 · 교실에 들어가기'; }
setInterval(()=>{ try{ liveWatch(); liveBtn(); }catch(e){} },1500);

function liveJoin(){
  if (!liveOpen()) return;
  if (!myUid()){ showBanner('로그인한 학생만 들어갈 수 있어요'); return; }
  LIVE.joining=true; startGame(); LIVE.joining=false;
}
function liveReset(){
  document.body.classList.remove('livemode'); ['#lvHud','#lvQ','#lvFreeze','#lvPick'].forEach(s=>{ const e=$(s); if (e) e.hidden=true; });
  if (MAPK!=='live'){ LIVE.on=false; return; }
  LIVE.on=true; Object.assign(LIVE,{q:null,qid:'',ph:'',holdZ:-2,holdT:0,sent:null,sentQ:'',posLast:'',nameT:0,hbAt:performance.now()+25000,pickT:0,lineV:-1});
  const k=LIVE.meta&&+LIVE.meta.t0||0;
  if (LIVE.lk!==k){ LIVE.lk=k; LIVE.paid={}; LIVE.earn=0; LIVE.lc=PROFILE&&+PROFILE.lk===k?Math.min(LV_COIN_MAX,PROFILE.lc|0):0; }
  lvRemoveAvatars(); lvClearZones(); lvListenLive();
  P.x=rnd(-6,6); P.z=LV_SZ; P.fx=0; P.fz=-1; W.nextWaveAt=-1; W.nextQuiz=1e9;
  document.body.classList.add('livemode'); $('#lvHud').hidden=false;
  lvWriteMe(); lvMeta();
}
function lvWriteMe(){ const u=myUid(); if (!u||!LIVE.cid) return;
  fbDb.ref(`live/${LIVE.cid}/p/${u}`).set({n:myName().slice(0,12),num:STUDENT?+STUDENT.num:0,job:JOB,look:equippedLook(JOB),t:firebase.database.ServerValue.TIMESTAMP}).catch(()=>{}); }
function liveLeave(){   // 나가기: 결과 화면 없이 로비로
  lvFlush(true); const u=myUid();
  if (u&&LIVE.cid){ fbDb.ref(`live/${LIVE.cid}/pos/${u}`).remove().catch(()=>{}); fbDb.ref(`live/${LIVE.cid}/p/${u}`).remove().catch(()=>{}); }
  lvEndUI(); LIVE.on=false; W.state='end'; W.paused=true;
  try{ $('#homeBtn').click(); }catch(e){}
}
function lvEndUI(){ lvUnlisten(); lvRemoveAvatars(); lvClearZones(); if (LIVE.mark) LIVE.mark.visible=false; if (LIVE.spot) LIVE.spot.visible=false;
  document.body.classList.remove('livemode'); ['#lvHud','#lvQ','#lvFreeze','#lvPick'].forEach(s=>{ const e=$(s); if (e) e.hidden=true; }); }

/* ---------- 질문 · 답 구역 ---------- */
function lvZoneDefs(q){
  const o=Array.isArray(q.opts)?q.opts.map(String):[];
  if (q.k==='mc') return [0,1,2,3].map(i=>({num:String(i+1),text:o[i]||'',col:LV_PAL[i]}));
  if (q.k==='ox') return [{num:'O',text:'',col:'#3b82f6'},{num:'X',text:'',col:'#e5484d'}];
  if (q.k==='light') return [{num:'초록',text:'알겠어요',col:'#22a35a'},{num:'노랑',text:'조금 헷갈려요',col:'#e8a400'},{num:'빨강',text:'잘 모르겠어요',col:'#e5484d'}];
  if (q.k==='debate') return [{num:o[0]||'찬성',text:'',col:'#3b82f6'},{num:o[1]||'반대',text:'',col:'#e5484d'}];
  if (q.k==='group'){ const n=Math.max(2,Math.min(6,o.length||4)); return [...Array(n).keys()].map(i=>({num:o[i]||`${i+1}모둠`,text:'',col:LV_PAL[i]})); }
  return [];
}
function lvLayout(n){   // 답 구역 사각형들 [x0,x1,z0,z1]
  const W2=LV_HX*2, gap=.7, out=[];
  if (n<=4){ const w=(W2-gap*(n-1))/n; for (let i=0;i<n;i++){ const x0=-LV_HX+i*(w+gap); out.push([x0,x0+w,LV_Z0,LV_Z1]); } }
  else { const cols=3, rows=2, w=(W2-gap*2)/3, h=(LV_Z1-LV_Z0-gap)/2;
    for (let i=0;i<n;i++){ const c=i%cols, r=Math.floor(i/cols), x0=-LV_HX+c*(w+gap), z0=LV_Z0+r*(h+gap); out.push([x0,x0+w,z0,z0+h]); } }
  return out;
}
function lvTex(num,text,color,w,d,line){
  const W2=512, H2=Math.max(256,Math.min(1024,Math.round(512*d/w))), cv=document.createElement('canvas'); cv.width=W2; cv.height=H2; const g=cv.getContext('2d');
  g.fillStyle=color; g.fillRect(0,0,W2,H2);
  g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=12; roundRect(g,14,14,W2-28,H2-28,34); g.stroke();
  g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle';
  const nl=String(num).length, nfs=nl<=1?260:nl<=2?170:nl<=4?110:80;
  if (!text){ g.font=`bold ${nfs}px Jua, "Malgun Gothic", sans-serif`; g.fillText(num,W2/2,H2/2+10); }
  else { g.font=`bold ${Math.min(nfs,130)}px Jua, "Malgun Gothic", sans-serif`; g.fillText(num,W2/2,H2*.2);
    const len=String(text).length, fs=Math.round(len<=9?Math.min(80,(W2-70)/len):Math.max(38,Math.min(64,(W2-70)*2/len)));
    const lines=runWrap(g,text,W2-60,`${fs}px Jua, "Malgun Gothic", sans-serif`,fs*1.2,6);
    lines.forEach((l,i)=>g.fillText(l,W2/2,H2*.58+(i-(lines.length-1)/2)*fs*1.2)); }
  const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; return t;
}
function lvClearZones(){ if (!LIVE.zoneG) return; for (const z of LIVE.zones){ LIVE.zoneG.remove(z.m); if (z.ring){ LIVE.zoneG.remove(z.ring); z.ring.geometry.dispose(); } z.m.geometry.dispose(); if (z.m.material.map) z.m.material.map.dispose(); z.m.material.dispose(); } LIVE.zones=[]; }
function lvBuildZones(q){
  lvClearZones(); if (!q||!LIVE.zoneG) return;
  if (q.k==='line'){   // 수직선: 왼쪽 0 ~ 오른쪽 100
    const o=Array.isArray(q.opts)?q.opts:[], w=LV_HX*2, d=LV_Z1-LV_Z0, cv=document.createElement('canvas'); cv.width=1024; cv.height=512; const g=cv.getContext('2d');
    const gr=g.createLinearGradient(0,0,1024,0); gr.addColorStop(0,'#3b82f6'); gr.addColorStop(.5,'#a78bfa'); gr.addColorStop(1,'#e5484d'); g.fillStyle=gr; g.fillRect(0,0,1024,512);
    g.strokeStyle='rgba(255,255,255,.9)'; g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle';
    for (let i=0;i<=10;i++){ const x=12+i*100; g.lineWidth=i%5?4:8; g.beginPath(); g.moveTo(x,i%5?300:270); g.lineTo(x,512); g.stroke(); g.font='bold 40px Jua, sans-serif'; g.fillText(String(i*10),Math.min(990,Math.max(34,x)),236); }
    g.font='bold 60px Jua, "Malgun Gothic", sans-serif'; g.textAlign='left'; g.fillText(String(o[0]||'0'),30,90); g.textAlign='right'; g.fillText(String(o[1]||'100'),994,90);
    const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; t.anisotropy=4;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:t,transparent:true,opacity:.95})); m.rotation.x=-Math.PI/2; m.position.set(0,.03,(LV_Z0+LV_Z1)/2); LIVE.zoneG.add(m);
    LIVE.zones=[{m,r:[-LV_HX,LV_HX,LV_Z0,LV_Z1],line:true}];
    const ring=new THREE.Mesh(new THREE.PlaneGeometry(.35,d),new THREE.MeshBasicMaterial({color:0xffe14d,transparent:true,opacity:0,depthWrite:false})); ring.rotation.x=-Math.PI/2; ring.position.set(0,.05,(LV_Z0+LV_Z1)/2); LIVE.zoneG.add(ring); LIVE.zones[0].ring=ring;
    return; }
  const defs=lvZoneDefs(q); if (!defs.length) return; const rs=lvLayout(defs.length);
  defs.forEach((z,i)=>{ const [x0,x1,z0,z1]=rs[i], w=x1-x0, d=z1-z0;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:lvTex(z.num,z.text,z.col,w,d),transparent:true,opacity:.96})); m.rotation.x=-Math.PI/2; m.position.set((x0+x1)/2,.03,(z0+z1)/2); LIVE.zoneG.add(m);
    const sh=new THREE.Shape(), o2=.32, i2=.05; sh.moveTo(-w/2-o2,-d/2-o2); sh.lineTo(w/2+o2,-d/2-o2); sh.lineTo(w/2+o2,d/2+o2); sh.lineTo(-w/2-o2,d/2+o2); sh.lineTo(-w/2-o2,-d/2-o2);
    const hole=new THREE.Path(); hole.moveTo(-w/2+i2,-d/2+i2); hole.lineTo(-w/2+i2,d/2-i2); hole.lineTo(w/2-i2,d/2-i2); hole.lineTo(w/2-i2,-d/2+i2); hole.lineTo(-w/2+i2,-d/2+i2); sh.holes.push(hole);
    const ring=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:0xffe14d,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,fog:false})); ring.rotation.x=-Math.PI/2; ring.position.set((x0+x1)/2,.05,(z0+z1)/2); LIVE.zoneG.add(ring);
    LIVE.zones.push({m,ring,r:rs[i],i}); });
}
function lvZoneAt(x,z){ for (const Z of LIVE.zones){ const [x0,x1,z0,z1]=Z.r; if (x>=x0&&x<=x1&&z>=z0&&z<=z1) return Z.line?Math.round((x+LV_HX)/(LV_HX*2)*100):Z.i; } return -1; }
function lvCorrectSet(q){   // 정답 구역 번호들 (정답이 없으면 빈 배열)
  if (!q||q.ans==null||q.ans==='') return [];
  if (q.k==='mc') return String(q.ans).split(/[,|]/).map(s=>+s-1).filter(n=>n>=0&&n<4);
  if (q.k==='ox') return [/^(o|O|0|true)$/.test(String(q.ans))?0:1];
  return [];
}
function lvNorm(s){ return String(s||'').replace(/\s+/g,'').toLowerCase(); }
function lvSaOk(q,v){ if (!q||q.ans==null||q.ans==='') return null; const a=String(q.ans).split('|').map(lvNorm).filter(Boolean); return a.includes(lvNorm(v)); }
function lvMyOk(){ const q=LIVE.q; if (!q||LIVE.sent==null) return null;
  if (q.k==='sa') return lvSaOk(q,LIVE.sent);
  const c=lvCorrectSet(q); if (!c.length) return null; return c.includes(+LIVE.sent); }

/* 선생님 쪽이 바뀌면 (질문 · 단계 · 멈춰 · 발표자) */
function lvMeta(){
  if (!LIVE.on) return; const m=LIVE.meta;
  if (!m||m.state!=='open'){ if (W.state==='play'){ lvToast(m&&m.state==='closed'?'선생님이 수업 방을 닫았어요':'수업 방이 닫혔어요',3); setTimeout(()=>{ if (LIVE.on&&W.state==='play') liveLeave(); },1600); } return; }
  const q=m.q||null, id=q&&q.id||'';
  if (id!==LIVE.qid){ lvPayFor(LIVE.sentQ); LIVE.qid=id; LIVE.q=q; LIVE.ph=''; LIVE.sent=null; LIVE.sentQ=''; LIVE.holdZ=-2; LIVE.holdT=0; LIVE.lineV=-1; lvBuildZones(q);
    if (q){ P.x=rnd(-LV_HX+1.5,LV_HX-1.5); P.z=LV_SZ; P.fx=0; P.fz=-1; W.snapCam=true; try{ SFX.wave(); }catch(e){} lvBoard(q.text||`${LV_KIND[q.k]||''} 질문`,`${LV_KIND[q.k]||''} · `+(q.k==='sa'?'아래 칸에 답을 써요':q.k==='line'?'생각하는 만큼 왼쪽~오른쪽으로':'답 구역으로 걸어가 서요'));
      const inp=$('#lvSa'); if (inp) inp.value=''; const rr=$('#lvReason'); if (rr) rr.value=''; }
    else lvBoard('🏫 수업 모드','자유롭게 돌아다녀요 · 다음 질문을 기다려요'); }
  else LIVE.q=q;
  const ph=q?q.ph||'ask':'';
  if (ph!==LIVE.ph){ const was=LIVE.ph; LIVE.ph=ph;
    if (ph==='lock'||ph==='reveal') lvPayFor(id);
    if (ph==='reveal'&&was!=='reveal') lvReveal(); else if (ph!=='reveal') lvUnreveal(); }
  lvUI();
  // 발표자
  const pk=m.pick; if (pk&&pk.t&&pk.t!==LIVE.pickT){ LIVE.pickT=pk.t; if (stgNow()-pk.t<20000) lvPickShow(pk); }
}
function lvReveal(){
  const q=LIVE.q; if (!q) return; const c=lvCorrectSet(q);
  LIVE.zones.forEach(Z=>{ if (Z.line) return; const ok=c.includes(Z.i); Z.ring.material.opacity=ok?1:0; Z.m.material.color.setHex(c.length&&!ok?0x8a8a8a:0xffffff); });
  const ok=lvMyOk(); if (ok===true){ try{ SFX.correct(); }catch(e){} try{ petReact(true); }catch(e){} } else if (ok===false){ try{ SFX.wrong(); }catch(e){} try{ petReact(false); }catch(e){} }
}
function lvUnreveal(){ LIVE.zones.forEach(Z=>{ if (Z.ring) Z.ring.material.opacity=0; Z.m.material.color.setHex(0xffffff); }); }

/* 답 보내기 */
function lvSend(v,extra){
  const u=myUid(), q=LIVE.q; if (!u||!q||LIVE.ph!=='ask'||(LIVE.meta&&LIVE.meta.freeze)) return;
  const o={v:String(v).slice(0,40),n:myName().slice(0,12),t:firebase.database.ServerValue.TIMESTAMP};
  const r=extra!=null?extra:($('#lvReason')&&q.k==='debate'?$('#lvReason').value.trim():''); if (r) o.r=String(r).slice(0,60);
  LIVE.sent=String(v); LIVE.sentQ=q.id;
  fbDb.ref(`live/${LIVE.cid}/a/${q.id}/${u}`).set(o).catch(()=>{}); lvUI();
}
function lvZoneTick(dt){
  const q=LIVE.q; if (!q||LIVE.ph!=='ask'||q.k==='sa'||(LIVE.meta&&LIVE.meta.freeze)) return;
  const z=lvZoneAt(P.x,P.z);
  if (q.k==='line'){ const Z=LIVE.zones[0]; if (Z&&Z.ring){ Z.ring.position.x=z>=0?P.x:-99; Z.ring.material.opacity=z>=0?.9:0; }
    if (z<0){ LIVE.holdZ=-2; return; }
    if (Math.abs(z-LIVE.holdZ)>1){ LIVE.holdZ=z; LIVE.holdT=0; return; } LIVE.holdT+=dt;
    if (LIVE.holdT>=.7&&String(z)!==LIVE.sent){ lvSend(z); } return; }
  if (z!==LIVE.holdZ){ LIVE.holdZ=z; LIVE.holdT=0; } else LIVE.holdT+=dt;
  if (z>=0&&LIVE.holdT>=.6&&String(z)!==LIVE.sent) lvSend(z);
}

/* 참여 코인: 답한 질문마다 5코인, 이번 수업 방에서 최대 50코인 */
function lvPayFor(qid){
  if (!qid||LIVE.paid[qid]||LIVE.sentQ!==qid||LIVE.sent==null) return; LIVE.paid[qid]=1;
  if (!STUDENT||!PROFILE) return;
  const left=LV_COIN_MAX-LIVE.lc-LIVE.earn; if (left<=0){ lvToast('🪙 이번 수업 참여 코인은 다 받았어요 (최대 50)',2.5); return; }
  const c=Math.min(LV_COIN,left); LIVE.earn+=c; lvToast(`🪙 참여 코인 +${c}`,2); lvFlush(false);
}
async function lvFlush(force){
  if (!LIVE.earn||LIVE.flushing||!STUDENT||!PROFILE) return; const now=performance.now(); if (!force&&now<LIVE.flushT) return;
  LIVE.flushing=true; const e=LIVE.earn;
  try{ const fresh=(await withTimeout(profRef().once('value'),6000)).val(); if (fresh) PROFILE=fresh;
    const lc=+PROFILE.lk===LIVE.lk?Math.min(LV_COIN_MAX,PROFILE.lc|0):0, add=Math.max(0,Math.min(e,LV_COIN_MAX-lc));
    if (!add){ LIVE.earn=0; LIVE.lc=lc; }
    else { const since=Date.now()+(STG.off||0)-(+PROFILE.updatedAt||0); if (since<10500){ LIVE.flushT=now+(10600-since); }
      else { await withTimeout(profRef().update({coins:(PROFILE.coins|0)+add,lk:LIVE.lk,lc:lc+add,updatedAt:firebase.database.ServerValue.TIMESTAMP}),8000);
        PROFILE.coins=(PROFILE.coins|0)+add; PROFILE.lk=LIVE.lk; PROFILE.lc=lc+add; LIVE.lc=lc+add; LIVE.earn=Math.max(0,LIVE.earn-e); try{ renderProfileCard(); }catch(x){} } } }
  catch(x){ LIVE.flushT=now+12000; }
  LIVE.flushing=false;
  if (LIVE.earn&&LIVE.on){ clearTimeout(LIVE.flushTo); LIVE.flushTo=setTimeout(()=>lvFlush(false),Math.max(1000,LIVE.flushT-performance.now()+50)); }
}

/* ---------- 화면 (위 질문판 · 아래 내 답) ---------- */
function lvUI(){
  const m=LIVE.meta||{}, q=LIVE.q, box=$('#lvQ'); if (!box) return;
  $('#lvFreeze').hidden=!m.freeze;
  $('#lvCoin').textContent=STUDENT?`🪙 참여 ${Math.min(LV_COIN_MAX,LIVE.lc+LIVE.earn)}/${LV_COIN_MAX}`:'';
  if (!q){ box.hidden=true; $('#lvState').textContent='자유 시간 · 다음 질문을 기다려요'; return; }
  box.hidden=false; const ph=LIVE.ph, c=lvCorrectSet(q), defs=lvZoneDefs(q);
  $('#lvKind').textContent=`${LV_KIND[q.k]||''}${ph==='lock'?' · 마감':ph==='reveal'?' · 결과':''}`;
  $('#lvText').textContent=q.text||(q.k==='mc'?'정답 번호 구역으로 가요':q.k==='ox'?'O 또는 X 구역으로 가요':q.k==='light'?'지금 내 이해도는?':q.k==='line'?'얼마나 그렇다고 생각하나요?':q.k==='group'?'원하는 모둠 구역으로 가요':q.k==='debate'?'찬성/반대 구역으로 가요':'답을 써 주세요');
  const res=Array.isArray(q.res)?q.res:null, tot=res?res.reduce((a,b)=>a+(+b||0),0):0;
  $('#lvOpts').className='lv-opts n'+defs.length;
  $('#lvOpts').innerHTML=defs.map((d,i)=>{ const mine=LIVE.sent!=null&&+LIVE.sent===i&&q.k!=='line'&&q.k!=='sa', ok=ph==='reveal'&&c.includes(i), n=res?+res[i]||0:0;
    return `<div class="lv-opt${mine?' mine':''}${ok?' ok':''}${ph==='reveal'&&c.length&&!ok?' dim':''}" style="--c:${d.col}"><b>${esc(d.num)}</b><span>${esc(d.text)}</span>${res?`<em>${n}명</em><i style="width:${tot?Math.round(n/tot*100):0}%"></i>`:''}</div>`; }).join('');
  const sa=q.k==='sa', db=q.k==='debate';
  $('#lvSaRow').hidden=!sa; $('#lvReasonRow').hidden=!db||ph!=='ask';
  const lock=ph!=='ask'||!!m.freeze; if ($('#lvSa')) $('#lvSa').disabled=lock; if ($('#lvSaGo')) $('#lvSaGo').disabled=lock;
  let st='';
  if (ph==='ask'){ st=LIVE.sent==null?(sa?'✏️ 답을 쓰고 Enter':q.k==='line'?'👣 수직선 위에 서면 그 값이 내 답이에요':'👣 답 구역에 잠깐 서 있으면 내 답이 돼요 · 마감 전엔 바꿀 수 있어요')
      :`✅ 내 답: <b>${esc(lvAnsLabel(q,LIVE.sent))}</b> · 마감 전엔 바꿀 수 있어요`; }
  else if (ph==='lock') st=LIVE.sent==null?'⏹ 마감됐어요 (답하지 않았어요)':`⏹ 마감 · 내 답: <b>${esc(lvAnsLabel(q,LIVE.sent))}</b>`;
  else if (ph==='reveal'){ const ok=lvMyOk(), ans=q.k==='sa'?String(q.ans||'').split('|')[0]:c.map(i=>defs[i]&&defs[i].num).join(', ');
    st=(ok===true?'🎉 <b class="good">정답!</b> ':ok===false?'😢 <b class="bad">아쉬워요</b> ':'')+(ans?`정답: <b>${esc(ans)}</b>`:'')+(LIVE.sent!=null?` · 내 답: ${esc(lvAnsLabel(q,LIVE.sent))}`:' · 답하지 않았어요');
    if (q.k==='line'&&q.avg!=null) st+=` · 반 평균 <b>${q.avg}</b>`; }
  $('#lvState').innerHTML=st;
  if (q.k==='sa'&&ph==='reveal'&&Array.isArray(q.top)&&q.top.length) $('#lvState').innerHTML+=`<div class="lv-top">${q.top.slice(0,5).map(t=>`<span>${esc(t.v)} <small>${t.c}명</small></span>`).join('')}</div>`;
}
function lvAnsLabel(q,v){ if (v==null) return ''; if (q.k==='sa') return v; if (q.k==='line') return v+' / 100'; const d=lvZoneDefs(q)[+v]; return d?(d.text&&q.k==='mc'?`${d.num}. ${d.text}`:d.num):String(v); }
function lvToast(t,sec){ let el=$('#lvToast'); if (!el){ el=document.createElement('div'); el.id='lvToast'; document.body.appendChild(el); }
  el.textContent=t; el.className=''; void el.offsetWidth; el.className='show'; clearTimeout(el._t); el._t=setTimeout(()=>{ el.className=''; },(sec||2)*1000); }
function lvPickShow(pk){
  const me=pk.u===myUid(), el=$('#lvPick'); el.innerHTML=me?'<b>🎤 내가 발표자예요!</b><span>선생님께 내 생각을 말해 볼까요?</span>':`<b>🎤 ${esc(pk.n||'친구')} 발표!</b><span>친구의 생각을 들어 봐요</span>`;
  el.hidden=false; el.className='lv-pick card'+(me?' me':''); try{ SFX.card(); }catch(e){} if (me){ try{ petReact(true); }catch(e){} }
  LIVE.spotU=pk.u; LIVE.spotUntil=performance.now()+9000; clearTimeout(el._t); el._t=setTimeout(()=>{ el.hidden=true; },6500); }
function lvSpotTick(){
  if (!LIVE.spot){ const m=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.7,9,24,1,true),new THREE.MeshBasicMaterial({color:0xfff1a8,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide,fog:false})); m.renderOrder=4; scene.add(m); LIVE.spot=m; }
  const on=LIVE.spotU&&performance.now()<LIVE.spotUntil; let x=0,z=0,ok=false;
  if (on){ if (LIVE.spotU===myUid()){ x=P.x; z=P.z; ok=true; } else { const A=LIVE.av[LIVE.spotU]; if (A&&A.g.visible){ x=A.x; z=A.z; ok=true; } } }
  LIVE.spot.visible=ok; if (ok){ LIVE.spot.position.set(x,4.5,z); LIVE.spot.material.opacity=.22+.08*Math.sin(performance.now()/180); }
}

/* ---------- 친구들 (발판 서바이벌과 같은 방식) ---------- */
function lvAvatar(u){
  let A=LIVE.av[u]; if (A) return A;
  const info=LIVE.names[u]; if (!info) return null;
  const job=JOBS[info.job]?info.job:'knight', ch=makePlayerChar(job), g=new THREE.Group(); g.add(ch.root); scene.add(g);
  dressP2(ch,{...DEFAULTS[job],...(info.look||{})}).catch(()=>{});
  const tag=nameTag(info.n||'친구'); tag.position.y=3.05; g.add(tag); ch.anim.setBase('idle');
  A={u,g,ch,x:0,z:0,f:0}; LIVE.av[u]=A; return A;
}
function lvRemoveAvatars(){ for (const u in LIVE.av){ const A=LIVE.av[u]; scene.remove(A.g); A.ch.mixer.stopAllAction(); } LIVE.av={}; }
function lvListenLive(){
  lvUnlisten(); const c=LIVE.cid, me=myUid(); const r=fbDb.ref(`live/${c}/pos`);
  const cb=s=>{ if (s.key===me) return; const a=String(s.val()||'').split(','); if (a.length<3) return; LIVE.live[s.key]={x:+a[0]/10,z:+a[1]/10,f:+a[2]/100,t:performance.now()}; };
  const rm=s=>{ delete LIVE.live[s.key]; const A=LIVE.av[s.key]; if (A){ scene.remove(A.g); A.ch.mixer.stopAllAction(); delete LIVE.av[s.key]; } };
  r.on('child_added',cb,()=>{}); r.on('child_changed',cb,()=>{}); r.on('child_removed',rm,()=>{}); LIVE.liveRef=[r,cb,rm];
}
function lvUnlisten(){ if (LIVE.liveRef){ const [r,cb,rm]=LIVE.liveRef; r.off('child_added',cb); r.off('child_changed',cb); r.off('child_removed',rm); LIVE.liveRef=null; } LIVE.live={}; }
function lvSendPos(dt){
  LIVE.posT-=dt; if (LIVE.posT>0) return; LIVE.posT=.2;
  const s=[Math.round(P.x*10),Math.round(P.z*10),Math.round(Math.atan2(P.fx,P.fz)*100)].join(','); if (s===LIVE.posLast) return; LIVE.posLast=s;
  fbDb.ref(`live/${LIVE.cid}/pos/${myUid()}`).set(s).catch(()=>{});
}
function lvAvatarTick(dt){
  const now=performance.now();
  for (const u in LIVE.live){ const L=LIVE.live[u], A=lvAvatar(u); if (!A) continue;
    A.g.visible=now-L.t<120000;
    const ox=A.x, oz=A.z, k=Math.min(1,dt*12); A.x+=(L.x-A.x)*k; A.z+=(L.z-A.z)*k;
    const mv=Math.hypot(A.x-ox,A.z-oz)/Math.max(dt,1e-3);
    if (mv>.4){ const f=Math.atan2(A.x-ox,A.z-oz); let df=f-A.f; df=Math.atan2(Math.sin(df),Math.cos(df)); A.f+=df*Math.min(1,dt*12); }
    if (mv>8){ A.x=L.x; A.z=L.z; }   // 새 질문으로 출발선에 순간이동
    A.g.position.set(A.x,0,A.z); A.ch.root.rotation.y=A.f; A.ch.anim.setBase(mv>1.2?'run':'idle'); A.ch.mixer.update(dt); }
}

function liveFrame(dt,real,now){
  if (knight && (knight.anim.dead||endPose)){ knight.anim.revive(); endPose=false; }
  if (!W.paused) W.t+=dt;
  lobbyTick(real,dt);
  const m=LIVE.meta||{}, frozen=!!m.freeze;
  let moving=false;
  if (!W.paused && !frozen){
    const am=arrowsMove();
    let ix=(keys.KeyD||am&&keys.ArrowRight?1:0)-(keys.KeyA||am&&keys.ArrowLeft?1:0)+joy.x, iz=(keys.KeyS||am&&keys.ArrowDown?1:0)-(keys.KeyW||am&&keys.ArrowUp?1:0)+joy.y;
    const L=Math.hypot(ix,iz); if (L>.12){ if (L>1){ ix/=L; iz/=L; } P.x+=ix*7*dt; P.z+=iz*7*dt; P.fx=ix; P.fz=iz; moving=true; }
    P.x=Math.max(-LV_HX,Math.min(LV_HX,P.x)); P.z=Math.max(-LV_HZ,Math.min(LV_HZ,P.z));
  }
  lvZoneTick(dt);
  LIVE.nameT-=dt; if (LIVE.nameT<=0){ LIVE.nameT=4; fbDb.ref(`live/${LIVE.cid}/p`).once('value').then(s=>{ LIVE.names=s.val()||{}; const n=Object.keys(LIVE.names).length; $('#lvCount').textContent=`👥 ${n}명`; }).catch(()=>{}); }
  if (performance.now()>(LIVE.hbAt||0)){ LIVE.hbAt=performance.now()+25000; lvWriteMe(); }   // 접속 표시 (실제 시계 기준 25초마다)
  lvSendPos(dt); lvAvatarTick(dt); lvSpotTick();
  pg.position.set(P.x,0,P.z); stgMarkTickFor(LIVE,dt);
  { let dy=Math.atan2(P.fx,P.fz)-pg.rotation.y; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); pg.rotation.y+=dy*Math.min(1,dt*14); }
  if (knight){ setBaseSynced(knight.anim,moving?'run':'idle',moving?1.15:1); knight.mixer.update(dt); }
  for (const c of clouds){ c.position.x+=c.userData.v*dt; if (c.position.x>130) c.position.x=-130; }
  fx.update(dt); updateCombatFx(dt); updateDreamy(real); qualityTick(now);
  { const o=sun.userData.off||[22,38,14]; sun.position.set(P.x+o[0],o[1],P.z+o[2]); sun.target.position.set(P.x,0,P.z); sun.target.updateMatrixWorld(); }
  const tgt=new THREE.Vector3(P.x*.35,21,P.z*.3+15.5); camera.position.lerp(tgt,W.snapCam?1:Math.min(1,dt*6)); W.snapCam=false; camera.lookAt(P.x*.35,0,P.z*.3-2.6);
  renderFrame();
}
/* 내 머리 위 화살표 · 발밑 고리 (발판 서바이벌 것을 같이 써요) */
function stgMarkTickFor(S,dt){ if (!S.mark) S.mark=stgMarkMake(); const g=S.mark, t=performance.now()/1000; g.visible=true;
  g.userData.arrow.position.set(P.x,4.1+Math.abs(Math.sin(t*3.2))*.35,P.z); g.userData.lab.position.set(P.x,5.15+Math.abs(Math.sin(t*3.2))*.35,P.z);
  const r=g.userData.ring; r.position.set(P.x,.09,P.z); r.scale.setScalar(1+.08*Math.sin(t*5)); r.visible=true; }

$('#liveBtn')&&$('#liveBtn').addEventListener('click',liveJoin);
$('#lvSaGo')&&$('#lvSaGo').addEventListener('click',()=>{ const v=$('#lvSa').value.trim(); if (v) lvSend(v); $('#lvSa').blur(); try{ canvas.focus({preventScroll:true}); }catch(e){} });
$('#lvSa')&&$('#lvSa').addEventListener('keydown',e=>{ if (e.key==='Enter'){ e.preventDefault(); $('#lvSaGo').click(); } else if (e.key==='Escape'){ e.target.blur(); } e.stopPropagation(); });
$('#lvReason')&&$('#lvReason').addEventListener('keydown',e=>{ if (e.key==='Enter'){ e.preventDefault(); if (LIVE.sent!=null) lvSend(LIVE.sent); e.target.blur(); lvToast('이유를 보냈어요',1.5); } e.stopPropagation(); });
$('#lvReason')&&$('#lvReason').addEventListener('change',()=>{ if (LIVE.sent!=null) lvSend(LIVE.sent); });
$('#lvLeave')&&$('#lvLeave').addEventListener('click',liveLeave);
