/* 사회 게임 RPG · 캐릭터 눈 (세 직업 모두 · 입 없이 눈만)
   KayKit 캐릭터의 원래 눈(검은 막대)은 머리 모양 안으로 숨기고, 그 자리에 그린 눈 판을 머리 뼈에 붙여요.
   눈은 반짝이는 눈동자 + 깜빡임. 문제를 맞히면 ⭐ 별눈, 틀리면 글썽, 맞으면 ><, 쓰러지면 빙글빙글, 환호하면 ^^ 눈이 돼요.
   10월 표정 시안(② 그린 눈)을 게임용으로 옮긴 거예요. */
const FACE_LIST=[];
const FACE_STATES=['base','blink','happy','sad','hurt','star','swirl','sleepy'];
const FACE_MATS={};
let FACE_LAST=0;

/* ---------- 눈 그리기 (512×256 판, 판 너비의 22.5% · 77.5% 자리에 두 눈) ---------- */
function drawEyes(g,f){
  const W=512,H=256, lx=W*.225, rx=W*.775, ey=H*.45, line='#1d1a24', EC={d:'#14121c',m:'#2a2638',l:'#5a5478'};
  g.clearRect(0,0,W,H); g.lineCap='round'; g.lineJoin='round';
  const rr=(x,w,h,r)=>{ g.beginPath(); r=Math.min(r,w/2,h/2); g.moveTo(x-w/2+r,ey-h/2); g.arcTo(x+w/2,ey-h/2,x+w/2,ey+h/2,r); g.arcTo(x+w/2,ey+h/2,x-w/2,ey+h/2,r); g.arcTo(x-w/2,ey+h/2,x-w/2,ey-h/2,r); g.arcTo(x-w/2,ey-h/2,x+w/2,ey-h/2,r); g.closePath(); };
  const iris=(y0,h)=>{ const gr=g.createLinearGradient(0,y0,0,y0+h); gr.addColorStop(0,EC.d); gr.addColorStop(.55,EC.m); gr.addColorStop(1,EC.l); return gr; };
  const eye=(x,side,o)=>{ o=o||{}; const w=o.w||58, h=o.h||96;
    g.save(); rr(x,w,h,o.r||24); g.clip();
    if (o.tilt||o.lid){ const t=(o.tilt||0)*side, top=ey-h/2+(o.lid||0)*h; g.beginPath(); g.moveTo(x-w,top-t*w*.9); g.lineTo(x+w,top+t*w*.9); g.lineTo(x+w,ey+h); g.lineTo(x-w,ey+h); g.closePath(); g.clip(); }
    g.fillStyle=iris(ey-h/2,h); g.fillRect(x-w,ey-h,w*2,h*2);
    if (o.water){ g.fillStyle='rgba(170,225,255,.6)'; g.fillRect(x-w,ey+h*.16,w*2,h); }
    g.fillStyle='#fff'; g.beginPath(); g.ellipse(x+w*.18,ey-h*.2,w*.17,w*.17,0,0,Math.PI*2); g.fill();
    g.globalAlpha=.85; g.beginPath(); g.arc(x-w*.2,ey+h*.24,w*.085,0,Math.PI*2); g.fill(); g.globalAlpha=1;
    g.restore();
    if (o.tilt||o.lid){ const t=(o.tilt||0)*side, top=ey-h/2+(o.lid||0)*h; g.strokeStyle=line; g.lineWidth=7; g.beginPath(); g.moveTo(x-w*.62,top-t*w*.56); g.lineTo(x+w*.62,top+t*w*.56); g.stroke(); } };
  const arc=(x,up,wd)=>{ g.strokeStyle=EC.d; g.lineWidth=wd||22; g.beginPath(); if (up) g.arc(x,ey+30,44,Math.PI*1.15,Math.PI*1.85); else g.arc(x,ey-26,42,Math.PI*.15,Math.PI*.85); g.stroke(); };
  const blush=()=>{ g.fillStyle='rgba(255,120,140,.4)'; g.beginPath(); g.ellipse(W*.12,H*.8,30,13,0,0,Math.PI*2); g.ellipse(W*.88,H*.8,30,13,0,0,Math.PI*2); g.fill(); };
  const chev=(x,s)=>{ g.strokeStyle=EC.d; g.lineWidth=20; g.beginPath(); g.moveTo(x-34*s,ey-34); g.lineTo(x+28*s,ey); g.lineTo(x-34*s,ey+34); g.stroke(); };
  const star=x=>{ g.fillStyle='#ffc531'; g.strokeStyle=line; g.lineWidth=6; g.beginPath(); for (let i=0;i<10;i++){ const r=i%2?22:54, a=-Math.PI/2+i*Math.PI/5; g.lineTo(x+Math.cos(a)*r,ey+Math.sin(a)*r); } g.closePath(); g.fill(); g.stroke(); g.fillStyle='#fff'; g.beginPath(); g.arc(x+10,ey-14,7,0,Math.PI*2); g.fill(); };
  const swirl=x=>{ g.strokeStyle=EC.d; g.lineWidth=9; g.beginPath(); for (let i=0;i<=80;i++){ const a=i*.21, r=3+i*.55, px=x+Math.cos(a)*r, py=ey+Math.sin(a)*r; i?g.lineTo(px,py):g.moveTo(px,py); } g.stroke(); };
  if (f==='base'){ eye(lx,-1); eye(rx,1); }
  else if (f==='blink'){ g.strokeStyle=EC.d; g.lineWidth=14; [lx,rx].forEach(x=>{ g.beginPath(); g.moveTo(x-28,ey+6); g.quadraticCurveTo(x,ey+16,x+28,ey+6); g.stroke(); }); }
  else if (f==='happy'){ arc(lx,true); arc(rx,true); blush(); }
  else if (f==='sad'){ eye(lx,-1,{tilt:-.32,lid:.12,water:true}); eye(rx,1,{tilt:-.32,lid:.12,water:true});
    g.fillStyle='#8fd6ff'; g.strokeStyle=line; g.lineWidth=4; g.beginPath(); g.moveTo(rx+34,ey+40); g.bezierCurveTo(rx+46,ey+62,rx+50,ey+76,rx+38,ey+82); g.arc(rx+34,ey+74,9,.4,Math.PI); g.closePath(); g.fill(); g.stroke(); }
  else if (f==='hurt'){ chev(lx,1); chev(rx,-1); }
  else if (f==='star'){ star(lx); star(rx); blush(); }
  else if (f==='swirl'){ swirl(lx); swirl(rx); }
  else if (f==='sleepy'){ arc(lx,false,16); arc(rx,false,16); }
}
function faceMat(f){ if (FACE_MATS[f]) return FACE_MATS[f];
  const c=document.createElement('canvas'); c.width=512; c.height=256; drawEyes(c.getContext('2d'),f);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4;
  const m=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
  if (typeof petNoGlow==='function') petNoGlow(m);       // 하얀 반짝임이 빛 번짐으로 번지지 않게
  return FACE_MATS[f]=m; }

/* ---------- 원래 눈 찾기 · 숨기기 (팔레트 그림의 '짙은 칸'을 쓰는 점들이 눈이에요) ---------- */
function eyeInfo(geo){
  if (geo.userData.eyeInfo!==undefined) return geo.userData.eyeInfo;
  const pos=geo.attributes.position, uv=geo.attributes.uv; if (!pos||!uv) return geo.userData.eyeInfo=null;
  const L=[],R=[]; for (let i=0;i<pos.count;i++){ const u=uv.getX(i), v=uv.getY(i); if (Math.floor(u*8)===2 && Math.floor(v*4)===0) (pos.getX(i)<0?L:R).push(i); }
  if (L.length<3||R.length<3) return geo.userData.eyeInfo=null;
  const cen=a=>{ let x=0,y=0,z=0,zm=-9; a.forEach(i=>{ x+=pos.getX(i); y+=pos.getY(i); z+=pos.getZ(i); zm=Math.max(zm,pos.getZ(i)); }); return {x:x/a.length,y:y/a.length,z:z/a.length,zm}; };
  const cl=cen(L), cr=cen(R);
  // 원래 눈은 머리 안쪽으로 쏙 넣어서 안 보이게 (모양을 같이 쓰는 모든 캐릭터에 한 번만)
  [[L,cl],[R,cr]].forEach(([a,c])=>a.forEach(i=>pos.setXYZ(i,c.x,c.y,c.z-.06)));
  pos.needsUpdate=true; geo.computeBoundingSphere();
  return geo.userData.eyeInfo={L:cl,R:cr};
}
/* 눈 판 모양: 머리 앞면 곡면에 맞춰 살짝 휘어요 (크기마다 하나씩 만들어 둬요) */
const FACE_GEO={};
function faceGeo(w){ const k=w.toFixed(3); if (FACE_GEO[k]) return FACE_GEO[k];
  const g=new THREE.PlaneGeometry(w,w/2,12,1), p=g.attributes.position; const curve=.9*.72/w;
  for (let i=0;i<p.count;i++){ const x=p.getX(i); p.setZ(i,-x*x*curve); }
  return FACE_GEO[k]=g; }

/* 옷을 입힌 뒤(dressP2) 보이는 머리에 눈을 붙여요 */
function attachFace(ch,head){
  if (!head||!head.isSkinnedMesh||!head.skeleton) return null;
  const E=eyeInfo(head.geometry); if (!E) return null;
  const sk=head.skeleton, bi=sk.bones.findIndex(b=>/^head$/i.test(b.name)); if (bi<0) return null;
  const bone=sk.bones[bi];
  const sep=E.R.x-E.L.x, w=sep/.55, cx=(E.L.x+E.R.x)/2, cy=(E.L.y+E.R.y)/2, cz=Math.max(E.L.zm,E.R.zm)+.105*(w/.72);
  const mesh=new THREE.Mesh(faceGeo(w),faceMat('base'));
  // 머리 모양 기준 자리 → 머리 뼈 기준 자리 (처음 자세 기준이라, 어떤 동작 중이어도 정확해요)
  const M=new THREE.Matrix4().copy(sk.boneInverses[bi]).multiply(head.bindMatrix).multiply(new THREE.Matrix4().makeTranslation(cx,cy-.012,cz));
  mesh.matrixAutoUpdate=false; mesh.matrix.copy(M);
  mesh.renderOrder=3; mesh.frustumCulled=false; mesh.userData.noFlash=true; mesh.castShadow=false;
  bone.add(mesh);
  const F={ch,mesh,head,blinkT:1+Math.random()*3,expr:null,exprT:0,cur:'base'};
  ch.face=F; FACE_LIST.push(F);
  return mesh;
}
/* 잠깐 표정 바꾸기 */
function faceExpr(ch,f,dur){ const F=ch&&ch.face; if (!F) return; F.expr=f; F.exprT=dur||1.5; }
function faceTick(){
  const now=performance.now()/1000, dt=FACE_LAST?Math.min(.1,now-FACE_LAST):0; FACE_LAST=now;
  for (let i=FACE_LIST.length-1;i>=0;i--){ const F=FACE_LIST[i];
    if (!F.mesh.parent){ FACE_LIST.splice(i,1); continue; }
    if (!F.head.visible){ F.mesh.visible=false; continue; } F.mesh.visible=true;
    let f='base'; const A=F.ch.anim;
    if (F.exprT>0){ F.exprT-=dt; f=F.expr; }
    else if (A){ if (A.dead) f='swirl'; else if (A.cur&&A.cur===A.actions.hit) f='hurt'; else if (A.cur&&A.cur===A.actions.cheer) f='happy'; }
    if (f==='base'){ F.blinkT-=dt; if (F.blinkT<0){ f='blink'; if (F.blinkT<-.13) F.blinkT=2.2+Math.random()*3.2; } }
    if (f!==F.cur){ F.cur=f; F.mesh.material=faceMat(f); }
  }
}
/* 문제를 풀면 내 캐릭터 표정이 바뀌어요 */
function faceQuiz(ok){ if (typeof knight!=='undefined'&&knight) faceExpr(knight,ok?'star':'sad',ok?1.6:1.8); }
