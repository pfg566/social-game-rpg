/* 사회 게임 RPG · 펫 (펫 자리 · 세 직업 모두)
   모델 파일 없이 코드로 만든 펫이에요. 꾸미기 전용이라 능력치는 전혀 없어요.
   - 리메이크: 부드러운 몸 모양 · 그러데이션 털 무늬(정점 색) · 반짝이는 큰 눈 · 코 · 입 · 소품(목걸이 · 스카프 · 리본 · 나뭇잎 · 학사모)
   - 같은 종류는 한 번만 만들어 두고 복제해서 써요. 부위(몸 · 머리 · 다리 · 귀 · 꼬리 · 날개)마다 한 덩어리로 합쳐서 여러 명이 함께 해도 가벼워요.
   주인을 졸졸 따라오고, 멈추면 앉고, 오래 가만히 있으면 잠들어요(💤). 문제를 맞히면 폴짝 뛰고, 틀리면 시무룩해요.
   펫은 캐릭터 안에 붙어 있어서(캐릭터가 숨으면 같이 숨어요) 매 프레임 '세상 기준 위치'를 거꾸로 계산해 따로 움직여요. */
const PET_TYPES={
  dog:    {move:'walk',  size:1,   spd:1,   build:'dog'},
  cat:    {move:'walk',  size:.95, spd:1.05,build:'cat'},
  rabbit: {move:'hop',   size:.95, spd:1,   build:'rabbit'},
  slime:  {move:'bounce',size:1,   spd:.95, build:'slime'},
  penguin:{move:'waddle',size:1,   spd:.9,  build:'penguin'},
  bear:   {move:'walk',  size:1.05,spd:.95, build:'bear'},
  owl:    {move:'fly',   size:.95, spd:1.1, build:'owl', flyH:1.7},
  gowl:   {move:'fly',   size:1,   spd:1.1, build:'owl', flyH:1.75, gold:true},
  ribbon: {move:'walk',  size:.95, spd:1.05,build:'ribbon'},
  fox:    {move:'walk',  size:1,   spd:1.1, build:'fox'},
  egg:    {move:'egg',   size:1,   spd:1.05,build:'egg'},
  dragon: {move:'fly',   size:1.05,spd:1.1, build:'dragon', flyH:1.4},
  // 모델 파일(GLB) 펫: models/pets/{glb}.glb · h = 펫 크기(키)
  //  애니메이션 이름으로 찾아요: 가만히(Idle) · 걷기/달리기(Walk · Run) · 날기(Fly) · 앉기(Sit) · 잠자기(Sleep). 애니메이션이 없으면 몸 전체를 코드로 움직여요
  lbird:  {move:'fly',   size:1,   spd:1.1, glb:'lavender_bird', h:.7, flyH:1.6},
  mfox:   {move:'walk',  size:1,   spd:1.1, glb:'maple_fox_v2', h:.8}   // 단풍 여우 v2 (Tripo · Run · Sit · LieDown_Sleep + 잘 때 덮는 눈꺼풀, 가만히 애니메이션은 없어서 서 있는 기본 자세)
};
const PET_SIZE=1.25;
const PETS=[];
let PET_LAST=0;

/* ---------- 모양 · 색 도우미 ---------- */
const PGEO={};
const pgeo=(k,f)=>PGEO[k]||(PGEO[k]=f());
const gSphH=()=>pgeo('sh',()=>new THREE.SphereGeometry(1,48,36));   // 몸 · 머리 (무늬가 부드럽게)
const gSph=()=>pgeo('s',()=>new THREE.SphereGeometry(1,28,20));
const gSphL=()=>pgeo('sl',()=>new THREE.SphereGeometry(1,14,10));   // 아주 작은 부품
const gCone=()=>pgeo('c',()=>new THREE.ConeGeometry(1,1,20,4));
const gBox=()=>pgeo('box',()=>new THREE.BoxGeometry(1,1,1));
const gTorus=(k,r,t)=>pgeo('tor'+k,()=>new THREE.TorusGeometry(r,t,10,32));
const pLin=h=>new THREE.Color(h).convertSRGBToLinear();
const PSm=(a,b,x)=>{ const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); };
const pSpot=(x,y,z,cx,cy,cz,r0,r1)=>1-PSm(r0,r1,Math.hypot(x-cx,y-cy,z-cz));
const pSpot2=(x,y,z,cx,cy,cz,r0,r1)=>Math.max(pSpot(x,y,z,cx,cy,cz,r0,r1),pSpot(x,y,z,-cx,cy,cz,r0,r1));   // 왼쪽 · 오른쪽 한 쌍
const tubeT=i=>Math.floor(i/9)/24;   // 관(꼬리 · 뿔)의 처음 → 끝 (0~1)
const _pc=new THREE.Color();
// 타원체 겉면 위의 점 (입 · 수염을 얼굴에 딱 붙이려고)
const onE=(E,x,y,off)=>{ const [cx,cy,cz]=E.c,[a,b,c]=E.r, lx=(x-cx)/a, ly=(y-cy)/b; return [x,y,cz+c*Math.sqrt(Math.max(0,1-lx*lx-ly*ly))+(off||0)]; };

/* 재료: 색은 정점마다 칠하니까 종류별로 한 개씩만 있어요 */
const PMAT={};
function pmatK(kind,gcol){ const k=kind+'|'+(gcol||''); if (PMAT[k]) return PMAT[k]; let m;
  if (kind==='basic') m=new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true});
  else if (kind==='slime') m=toonMat({color:0xffffff,vertexColors:true,transparent:true,opacity:.8,rim:.7});
  else if (kind==='glow') m=toonMat({color:0xffffff,vertexColors:true,emissive:pLin(gcol||'#e0a92a'),emissiveIntensity:.14,rim:.6});
  else if (kind==='side') m=toonMat({color:0xffffff,vertexColors:true,side:THREE.DoubleSide,rim:.3});
  else m=toonMat({color:0xffffff,vertexColors:true,rim:.14});
  if (kind!=='basic') petNoGlow(m); m.userData.petKind=kind; return PMAT[k]=m; }
/* 펫만 빛 번짐(블룸)에서 빼기: 펫 색이 '번지기 시작하는 밝기'를 넘지 않게 살짝 눌러요.
   맵의 반짝이는 느낌은 그대로 두고, 하얀 펫만 형체가 또렷하게 보여요 */
const PET_CAP={value:10};
function petNoGlow(m){ const prev=m.onBeforeCompile, key=m.customProgramCacheKey?m.customProgramCacheKey():'';
  m.onBeforeCompile=(sh,r)=>{ if (prev) prev(sh,r); sh.uniforms.uPetCap=PET_CAP;
    sh.fragmentShader='uniform float uPetCap;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','gl_FragColor.rgb=min(gl_FragColor.rgb,vec3(uPetCap));\n#include <dithering_fragment>'); };
  m.customProgramCacheKey=()=>key+'|petcap'; }
/* 테두리 선: 겉면을 바깥으로 일정하게 밀어낸 뒷면 (부품 크기와 상관없이 같은 굵기) */
let PET_LINE=null;
function petLineMat(){ if (PET_LINE) return PET_LINE; const m=new THREE.MeshBasicMaterial({color:0x4a3b46,side:THREE.BackSide});
  m.onBeforeCompile=sh=>{ sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','vec3 transformed=position+normalize(normal)*.0105;'); };
  m.customProgramCacheKey=()=>'petline2'; return PET_LINE=m; }

/* 색칠: col 은 색(문자 · 숫자) 또는 (x,y,z,정점번호)=>색 · x,y,z 는 부품 원래 모양(단위 구 등)의 좌표 */
function pPaint(g,col){ const p=g.attributes.position, n=p.count, a=new Float32Array(n*3);
  if (typeof col==='function'){ for (let i=0;i<n;i++){ const c=col(p.getX(i),p.getY(i),p.getZ(i),i); a[i*3]=c.r; a[i*3+1]=c.g; a[i*3+2]=c.b; } }
  else { const c=col&&col.isColor?col:pLin(col); for (let i=0;i<n;i++){ a[i*3]=c.r; a[i*3+1]=c.g; a[i*3+2]=c.b; } }
  g.setAttribute('color',new THREE.BufferAttribute(a,3)); return g; }
// 같은 자리 정점의 방향을 평균: 구의 이음매 · 극점이 매끈해지고 테두리 선도 갈라지지 않아요
function pWeld(g){ const p=g.attributes.position, n=g.attributes.normal, map=new Map();
  for (let i=0;i<p.count;i++){ const k=Math.round(p.getX(i)*1e4)+','+Math.round(p.getY(i)*1e4)+','+Math.round(p.getZ(i)*1e4); let e=map.get(k); if (!e){ e=[0,0,0,[]]; map.set(k,e); } e[0]+=n.getX(i); e[1]+=n.getY(i); e[2]+=n.getZ(i); e[3].push(i); }
  map.forEach(e=>{ const l=Math.hypot(e[0],e[1],e[2])||1; e[3].forEach(i=>n.setXYZ(i,e[0]/l,e[1]/l,e[2]/l)); }); n.needsUpdate=true; return g; }
function pDeform(g,fn){ const p=g.attributes.position, v=new THREE.Vector3(); for (let i=0;i<p.count;i++){ v.set(p.getX(i),p.getY(i),p.getZ(i)); fn(v); p.setXYZ(i,v.x,v.y,v.z); }
  p.needsUpdate=true; g.computeVertexNormals(); return pWeld(g); }
function pPart(par,geo,col,pos,scl,rot,o){ o=o||{}; const g=pPaint(geo.clone(),col); if (o.deform) pDeform(g,o.deform); else if (g.index) pWeld(g);
  const kind=o.basic?'basic':o.slime?'slime':o.glow?'glow':o.side?'side':'toon';
  const m=new THREE.Mesh(g,pmatK(kind,o.gcol)); m.position.set(pos[0],pos[1],pos[2]);
  if (typeof scl==='number') m.scale.setScalar(scl); else m.scale.set(scl[0],scl[1],scl[2]); if (rot) m.rotation.set(rot[0],rot[1],rot[2]);
  m.userData.part=true; m.userData.keep=!!o.keep; m.userData.line=!(o.noLine||kind==='basic'||kind==='slime'||kind==='side');
  m.castShadow=!o.noShadow&&kind!=='basic'; m.userData.noFlash=true; m.frustumCulled=false; par.add(m); return m; }
function pGroup(par,pos,rot){ const g=new THREE.Group(); g.position.set(pos[0],pos[1],pos[2]); if (rot) g.rotation.set(rot[0],rot[1],rot[2]); par.add(g); return g; }
/* 다리: 엉덩이(관절)에서 아래로 매달려요 */
function pLeg(R,par,x,y,z,col,w,h,paw,o){ const g=pGroup(par,[x,y,z]); pPart(g,gSph(),col,[0,-h*.55,0],[w,h,w],null,o);
  if (paw) pPart(g,gSph(),paw,[0,-h*1.2,w*.25],[w*1.05,w*.7,w*1.2],null,o); R.legs.push(g); return g; }
function tubeGeo(key,pts,r0,r1){ return pgeo(key,()=>{ const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],p[1],p[2])));
  const g=new THREE.TubeGeometry(c,24,1,8,false), p=g.attributes.position, n=24;
  // 끝으로 갈수록 가늘게: 고리마다 중심 쪽으로 당겨요
  for (let i=0;i<=n;i++){ const t=i/n, rr=r0+(r1-r0)*t, ctr=c.getPoint(t); for (let j=0;j<=8;j++){ const k=i*9+j; const v=new THREE.Vector3(p.getX(k),p.getY(k),p.getZ(k)).sub(ctr).multiplyScalar(rr).add(ctr); p.setXYZ(k,v.x,v.y,v.z); } }
  g.computeVertexNormals(); return g; }); }
const pLine=(par,key,pts,r,col)=>pPart(par,tubeGeo(key,pts,r,r),col,[0,0,0],1,null,{noLine:true,noShadow:true});

/* 눈: 볼록한 원판에 그린 큰 눈 (홍채 그러데이션 · 동공 · 반짝이 두 개) · 눈 감기는 scale.y 로 해요 */
const gEye=()=>pgeo('eye',()=>{ const T=.62, g=new THREE.SphereGeometry(1,30,8,0,Math.PI*2,0,T); g.rotateX(Math.PI/2); g.translate(0,0,-Math.cos(T)); const s=1/Math.sin(T); g.scale(s,s,s);
  const p=g.attributes.position, uv=g.attributes.uv; for (let i=0;i<p.count;i++) uv.setXY(i,p.getX(i)*.5+.5,p.getY(i)*.5+.5); uv.needsUpdate=true; return g; });
const PEYE={};
function petEyeMat(iris,opt){ const k=iris+'|'+(opt||''); if (PEYE[k]) return PEYE[k];
  const S=128, mk=()=>{ const c=document.createElement('canvas'); c.width=c.height=S; return c; }, cv=mk(), g=cv.getContext('2d'), ce=mk(), e=ce.getContext('2d');
  const hsl={}; new THREE.Color(iris).getHSL(hsl); const hs=(l,s)=>'#'+new THREE.Color().setHSL(hsl.h,Math.min(1,hsl.s*(s||1)),Math.max(0,Math.min(1,l))).getHexString();
  g.fillStyle='#17111a'; g.fillRect(0,0,S,S);
  const gr=g.createLinearGradient(0,14,0,118); gr.addColorStop(0,hs(hsl.l*.42)); gr.addColorStop(.52,iris); gr.addColorStop(1,hs(Math.min(.86,hsl.l*1.55+.12),1.1));
  g.fillStyle=gr; g.beginPath(); g.arc(64,64,54,0,7); g.fill();
  g.globalAlpha=.5; g.fillStyle=hs(Math.min(.92,hsl.l*1.8+.18),1.2); g.beginPath(); g.ellipse(64,99,31,12,0,0,7); g.fill(); g.globalAlpha=1;   // 아래쪽 비치는 빛
  g.fillStyle='#120b12'; g.beginPath(); if (opt==='cat') g.ellipse(64,60,15,33,0,0,7); else if (opt==='big') g.arc(64,62,33,0,7); else g.ellipse(64,60,26,29,0,0,7); g.fill();
  const sh=g.createLinearGradient(0,6,0,58); sh.addColorStop(0,'rgba(8,4,10,.85)'); sh.addColorStop(1,'rgba(8,4,10,0)'); g.fillStyle=sh; g.beginPath(); g.arc(64,64,56,0,7); g.fill();
  if (opt==='lash'){ g.strokeStyle='#120b12'; g.lineCap='round'; g.lineWidth=11; g.beginPath(); g.arc(64,64,57,Math.PI*1.06,Math.PI*1.94); g.stroke(); }   // 진한 속눈썹 선
  const hl=(c,cl)=>{ c.fillStyle=cl; c.beginPath(); c.ellipse(44,40,17,13,-.55,0,7); c.fill(); c.beginPath(); c.arc(87,85,7.5,0,7); c.fill(); c.globalAlpha=.85; c.beginPath(); c.arc(70,29,4.5,0,7); c.fill(); c.globalAlpha=1; };
  hl(g,'#ffffff'); e.fillStyle='#000'; e.fillRect(0,0,S,S); hl(e,'#ffffff');
  const map=new THREE.CanvasTexture(cv); map.encoding=THREE.sRGBEncoding; map.anisotropy=4;
  const em=new THREE.CanvasTexture(ce); em.encoding=THREE.sRGBEncoding;
  const m=toonMat({map,emissive:0xffffff,emissiveMap:em,rim:0}); petNoGlow(m); return PEYE[k]=m; }
// E: 눈을 붙일 얼굴 타원체 {c:중심, r:반지름} · (x,y) 눈 자리 · r 눈 크기
function pEye(R,par,E,x,y,r,iris,o){ o=o||{}; const [cx,cy,cz]=E.c,[a,b,c]=E.r, lx=x-cx, ly=y-cy;
  const z=cz+c*Math.sqrt(Math.max(.02,1-(lx/a)**2-(ly/b)**2)), n=new THREE.Vector3(lx/(a*a),ly/(b*b),(z-cz)/(c*c)).normalize(), sag=r*r/(2*Math.min(a,b,c))*.6;
  const g=pGroup(par,[x-n.x*sag,y-n.y*sag,z-n.z*sag]); g.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n);
  const m=new THREE.Mesh(gEye(),petEyeMat(iris,o.opt)); m.scale.set(r*(o.sx||1),r*(o.sy||1),r*(o.zs||.55));
  m.userData.part=true; m.userData.keep=true; m.userData.noFlash=true; m.frustumCulled=false; g.add(m); R.eyes.push(g); return g; }
// 얼굴이 타원체가 아닌 곳(슬라임)의 볼 터치
function pCheek(par,x,y,z,r){ pPart(par,gSph(),'#ff9fb0',[x,y,z],[r,r*.6,r*.3],null,{noShadow:true,noLine:true}); }

/* ---------- 펫마다 만들기 (앞 = +z, 바닥 = y 0, 키 약 0.6) ---------- */
function newRig(){ const R={g:new THREE.Group(),eyes:[],legs:[],ears:[],wings:[],tail:null,head:null}; R.bob=pGroup(R.g,[0,0,0]); R.body=pGroup(R.bob,[0,0,0]); return R; }
const PET_BUILD={
  /* 강아지: 황금빛 털 · 하얀 주둥이와 가슴 · 늘어진 갈색 귀 · 빨간 목걸이와 금빛 이름표 · 돌돌 말린 꼬리 */
  dog(R){ const B=R.body, C=pLin('#eaa95e'), Cd=pLin('#c9843f'), W=pLin('#fbf1df'), E=pLin('#8a5230'), Ed=pLin('#5e341c'), PK=pLin('#ff9fb0');
    pPart(B,gSphH(),(x,y,z)=>_pc.copy(C).lerp(Cd,PSm(.35,1,y)*.35).lerp(W,PSm(.18,.62,z*.8-y*.6)),[0,.29,-.03],[.23,.21,.29],null,{deform:v=>{ const f=1+.12*Math.max(0,-v.y); v.x*=f; v.z*=1+.05*Math.max(0,-v.y); }});
    [[0,.39,.19,.06],[.055,.365,.18,.05],[-.055,.365,.18,.05]].forEach(([x,y,z,r])=>pPart(B,gSph(),W,[x,y,z],[r,r*.85,r*.75]));
    const sock=(x,y,z)=>_pc.copy(C).lerp(W,PSm(-.1,-.6,y));
    pLeg(R,B,.12,.2,.15,sock,.07,.12,W); pLeg(R,B,-.12,.2,.15,sock,.07,.12,W); pLeg(R,B,.12,.2,-.18,sock,.075,.12,W); pLeg(R,B,-.12,.2,-.18,sock,.075,.12,W);
    pPart(B,gTorus('dog',.14,.024),'#e5484d',[0,.415,.13],1,[-1.2,0,0]);
    pPart(B,gSph(),'#ffcf4a',[0,.338,.268],[.032,.032,.013],[-.3,0,0]); pPart(B,gSphL(),'#fff3c4',[-.01,.348,.28],[.009,.009,.004],null,{basic:true});
    const H=R.head=pGroup(B,[0,.53,.21]), HE={c:[0,0,0],r:[.25,.22,.22]}, ME={c:[0,-.07,.155],r:[.12,.088,.1]};
    pPart(H,gSphH(),(x,y,z)=>_pc.copy(C).lerp(Cd,PSm(.55,1,y)*.3).lerp(W,pSpot(x,y,z,0,-.42,.9,.32,.62)).lerp(W,pSpot2(x,y,z,.42,.56,.72,.07,.15)*.9).lerp(PK,pSpot2(x,y,z,.64,-.16,.74,.1,.3)*.55),
      [0,0,0],HE.r,null,{deform:v=>{ v.x*=1+.08*PSm(.1,-.8,v.y); if (v.z<0) v.z*=.94; }});
    pPart(H,gSph(),W,ME.c,ME.r);
    pPart(H,gSph(),'#2b201d',[0,-.034,.252],[.05,.035,.032],null,{deform:v=>{ v.x*=1+.25*Math.max(0,v.y); }});
    pPart(H,gSphL(),'#ffffff',[-.015,-.022,.282],[.012,.008,.006],null,{basic:true});
    pLine(H,'dogmouth',[[-.042,-.1],[-.021,-.114],[0,-.1],[.021,-.114],[.042,-.1]].map(([x,y])=>onE(ME,x,y,.004)),.0065,'#4a2a22');
    pPart(H,gSph(),'#ff7d8e',[0,-.121,.236],[.024,.012,.02],[.35,0,0],{noLine:true});
    pEye(R,H,HE,.098,.035,.058,'#4a2c1a',{sx:.92,sy:1.08}); pEye(R,H,HE,-.098,.035,.058,'#4a2c1a',{sx:.92,sy:1.08});
    [1,-1].forEach(s=>{ const e=pGroup(H,[.2*s,.1,-.01],[0,0,.38*s]); pPart(e,gSph(),(x,y,z)=>_pc.copy(E).lerp(Ed,PSm(-.2,-.95,y)*.6),[0,-.11,0],[.07,.15,.095],null,{deform:v=>{ v.z*=.62; v.x*=1+.25*Math.max(0,-v.y); }}); R.ears.push(e); });
    const T=R.tail=pGroup(B,[0,.38,-.28],[-.6,0,0]); pPart(T,tubeGeo('dogtail',[[0,0,0],[0,.07,-.04],[0,.15,-.03],[0,.2,.03],[0,.18,.09]],.05,.03),(x,y,z,i)=>_pc.copy(C).lerp(W,PSm(.62,.9,tubeT(i))),[0,0,0],1);
  },
  /* 고양이: 주황 줄무늬(등 · 이마 M자) · 하얀 가슴과 양말 · 초록 눈 · 분홍 코 · ω 입 · 수염 · 줄무늬 꼬리 */
  cat(R){ const B=R.body, C=pLin('#f4a65a'), S=pLin('#d47228'), W=pLin('#fff5e8'), PK=pLin('#ff9fb0');
    const belly=(x,y,z)=>PSm(.2,.6,z*.8-y*.6);
    pPart(B,gSphH(),(x,y,z)=>{ const bl=belly(x,y,z); return _pc.copy(C).lerp(S,PSm(.45,.8,Math.sin(z*11+.6))*PSm(-.05,.5,y)*(1-bl)*.85).lerp(W,bl); },[0,.28,-.02],[.205,.19,.29]);
    [[0,.375,.18,.055],[.05,.35,.17,.045],[-.05,.35,.17,.045]].forEach(([x,y,z,r])=>pPart(B,gSph(),W,[x,y,z],[r,r*.85,r*.75]));
    const sock=(x,y,z)=>_pc.copy(C).lerp(W,PSm(-.15,-.65,y));
    pLeg(R,B,.1,.2,.15,sock,.06,.12,W); pLeg(R,B,-.1,.2,.15,sock,.06,.12,W); pLeg(R,B,.1,.2,-.17,sock,.065,.12,W); pLeg(R,B,-.1,.2,-.17,sock,.065,.12,W);
    const H=R.head=pGroup(B,[0,.52,.2]), HE={c:[0,0,0],r:[.23,.2,.2]};
    pPart(H,gSphH(),(x,y,z)=>_pc.copy(C).lerp(S,PSm(.45,.8,Math.sin(x*15))*PSm(.4,.75,y)*PSm(.15,.55,z)*.9).lerp(W,pSpot(x,y,z,0,-.46,.88,.34,.6)).lerp(PK,pSpot2(x,y,z,.6,-.22,.74,.1,.28)*.55),
      [0,0,0],HE.r,null,{deform:v=>{ v.x*=1+.12*PSm(0,-.8,v.y); if (v.y>.6) v.y*=.96; }});
    const PE={c:[0,-.072,.168],r:[.08,.036,.04]};
    [1,-1].forEach(s=>pPart(H,gSph(),W,[.032*s,-.072,.168],[.048,.036,.04]));
    pPart(H,gSph(),'#ff8fa3',[0,-.04,.206],[.024,.017,.014],null,{deform:v=>{ if (v.y<0) v.x*=1+v.y*.55; }});
    pLine(H,'catmouth',[[-.036,-.084],[-.018,-.098],[0,-.087],[.018,-.098],[.036,-.084]].map(([x,y])=>onE(PE,x*.9,y,.003)),.005,'#6a4234');
    [1,-1].forEach(s=>[[-.05,.012],[-.075,-.02]].forEach(([dy,ey],k)=>pLine(H,'catwh'+s+k,[[.075*s,-.062+dy*.2,.17],[.14*s,-.06+ey*.5,.168],[.2*s,-.055+ey,.15]],.0028,'#7a5a48')));
    pEye(R,H,HE,.09,.035,.062,'#4f9a3c',{opt:'cat',sx:.95,sy:1.05}); pEye(R,H,HE,-.09,.035,.062,'#4f9a3c',{opt:'cat',sx:.95,sy:1.05});
    [1,-1].forEach(s=>{ const e=pGroup(H,[.12*s,.15,0],[0,0,-.28*s]); pPart(e,gCone(),(x,y,z)=>_pc.copy(C).lerp(S,PSm(.1,.45,y)*.6),[0,.07,0],[.085,.16,.06]); pPart(e,gCone(),'#ffb7c2',[0,.055,.03],[.05,.11,.02],null,{noLine:true}); R.ears.push(e); });
    const T=R.tail=pGroup(B,[0,.33,-.3]); pPart(T,tubeGeo('cattail',[[0,0,0],[0,.08,-.1],[0,.22,-.14],[0,.36,-.08],[0,.42,.02]],.045,.032),(x,y,z,i)=>{ const t=tubeT(i); return _pc.copy(C).lerp(S,t>.12&&(t*4.6)%1>.55?.9:0).lerp(S,PSm(.86,.96,t)); },[0,0,0],1);
  },
  /* 토끼: 크림빛 털 · 분홍 속귀(한쪽 귀는 살짝 접힘) · 앞니 · 솜꼬리 · 귀에 꽃 */
  rabbit(R){ const B=R.body, C=pLin('#f3ede7'), Cs=pLin('#e4dad2'), W=pLin('#fffaf6'), P=pLin('#ffb3c6'), PK=pLin('#ff9fb0');
    pPart(B,gSphH(),(x,y,z)=>_pc.copy(C).lerp(Cs,PSm(-.3,-1,y)*.5).lerp(W,PSm(.25,.65,z*.8-y*.5)),[0,.26,-.04],[.22,.21,.24],null,{deform:v=>{ v.x*=1+.1*Math.max(0,-v.y); }});
    [1,-1].forEach(s=>pPart(B,gSph(),C,[.13*s,.14,-.08],[.09,.085,.13]));
    [1,-1].forEach(s=>pPart(B,gSph(),(x,y,z)=>_pc.copy(C).lerp(Cs,PSm(0,-1,y)*.4),[.13*s,.04,-.02],[.065,.04,.13]));
    pLeg(R,B,.08,.16,.12,C,.045,.075,W); pLeg(R,B,-.08,.16,.12,C,.045,.075,W);
    [[0,.27,-.28,.07],[.035,.3,-.27,.05],[-.035,.3,-.27,.05],[0,.23,-.27,.05]].forEach(([x,y,z,r])=>pPart(B,gSph(),W,[x,y,z],r));
    const H=R.head=pGroup(B,[0,.5,.13]), HE={c:[0,0,0],r:[.21,.19,.19]};
    pPart(H,gSphH(),(x,y,z)=>_pc.copy(C).lerp(W,pSpot(x,y,z,0,-.42,.9,.3,.56)).lerp(PK,pSpot2(x,y,z,.6,-.2,.74,.1,.28)*.55),[0,0,0],HE.r,null,{deform:v=>{ v.x*=1+.1*PSm(0,-.8,v.y); }});
    const PE={c:[0,-.068,.155],r:[.07,.032,.036]};
    [1,-1].forEach(s=>pPart(H,gSph(),W,[.028*s,-.068,.155],[.042,.032,.036]));
    pPart(H,gSph(),'#ff8fa8',[0,-.037,.19],[.02,.014,.012],null,{deform:v=>{ if (v.y<0) v.x*=1+v.y*.5; }});
    pLine(H,'rabmouth',[[-.026,-.088],[0,-.072],[.026,-.088]].map(([x,y])=>onE(PE,x,y,.003)),.0045,'#7a4a50');
    [1,-1].forEach(s=>pPart(H,gBox(),'#ffffff',[.0072*s,-.091,.186],[.012,.017,.006],null,{noShadow:true}));
    pEye(R,H,HE,.085,.035,.056,'#6a3f2c',{sx:.92,sy:1.08}); pEye(R,H,HE,-.085,.035,.056,'#6a3f2c',{sx:.92,sy:1.08});
    const earCol=(x,y,z)=>_pc.copy(C).lerp(P,PSm(.15,.6,z)*PSm(.8,.25,Math.abs(x))*PSm(-.9,-.45,y)*PSm(.95,.7,y));
    const eR=pGroup(H,[.07,.15,-.02],[-.12,0,-.12]); pPart(eR,gSph(),earCol,[0,.19,0],[.055,.2,.04]); R.ears.push(eR);
    const eL=pGroup(H,[-.07,.15,-.02],[-.12,0,.12]); pPart(eL,gSph(),earCol,[0,.11,0],[.055,.12,.04]);
    const tip=pGroup(eL,[0,.2,0],[.95,0,0]); pPart(tip,gSph(),earCol,[0,.075,0],[.05,.1,.036]); R.ears.push(eL);
    const fl=pGroup(H,[.105,.165,.06],[.35,.3,-.4]);
    for (let i=0;i<5;i++){ const a=i/5*Math.PI*2; pPart(fl,gSph(),'#ff9ec0',[Math.cos(a)*.026,Math.sin(a)*.026,0],[.022,.018,.008],[0,0,a],{noLine:true}); }
    pPart(fl,gSph(),'#ffd34d',[0,0,.005],.012,null,{noLine:true});
  },
  /* 슬라임: 물방울 모양 · 아래는 진하고 위는 밝은 초록 · 속 알맹이와 거품 · 큰 반짝이 · 웃는 입 */
  slime(R){ const B=R.body, G2=pLin('#3cbf72'), G=pLin('#5fd68c'), G3=pLin('#a6f2c2');
    const prof=[[0,0],[.18,.004],[.28,.035],[.32,.1],[.315,.19],[.27,.29],[.19,.38],[.11,.46],[.06,.53],[.035,.585],[0,.63]].map(([r,y])=>new THREE.Vector2(r,y));
    R.blob=pPart(B,pgeo('slimeL',()=>new THREE.LatheGeometry(prof,40)),(x,y,z)=>_pc.copy(G2).lerp(G,PSm(0,.22,y)).lerp(G3,PSm(.32,.62,y)),[0,0,0],1,null,{slime:true,deform:v=>{ if (v.y>.42) v.z-=.08*((v.y-.42)/.21)**2; }});
    pPart(B,gSph(),'#2f9e5e',[0,.17,0],[.14,.1,.14],null,{noShadow:true});
    [[.08,.27,-.06,.025],[-.1,.12,.05,.018],[.12,.1,.08,.014]].forEach(([x,y,z,r])=>pPart(B,gSphL(),'#e8fff0',[x,y,z],r,null,{slime:true}));
    pPart(B,gSph(),'#ffffff',[-.15,.34,.19],[.075,.032,.02],[0,-.5,.65],{basic:true});
    pPart(B,gSphL(),'#ffffff',[-.075,.445,.15],.02,null,{basic:true});
    const H=R.head=pGroup(B,[0,.2,0]), HE={c:[0,0,0],r:[.31,.3,.31]};
    pEye(R,H,HE,.1,.075,.055,'#1d3a2a',{sx:.9,sy:1.12}); pEye(R,H,HE,-.1,.075,.055,'#1d3a2a',{sx:.9,sy:1.12});
    pCheek(H,.175,.005,.245,.04); pCheek(H,-.175,.005,.245,.04);
    const m=onE(HE,0,-.015,-.004); pPart(H,gSph(),'#1d4a2c',m,[.042,.026,.012],null,{noLine:true,noShadow:true,deform:v=>{ if (v.y>0) v.y*=.25; }});
    pPart(H,gSph(),'#ff8a9a',[m[0],m[1]-.012,m[2]+.004],[.022,.01,.008],null,{noLine:true,noShadow:true});
  },
  /* 펭귄: 남색 몸 · 하트 모양 하얀 얼굴과 배 · 주황 부리와 발 · 빨간 나비넥타이 */
  penguin(R){ const B=R.body, K=pLin('#2c3552'), K2=pLin('#3e4a74'), W=pLin('#f7f4ee'), PK=pLin('#ff9fb0');
    pPart(B,gSphH(),(x,y,z)=>_pc.copy(K).lerp(K2,PSm(.3,1,y)*.4).lerp(W,PSm(.2,.42,z-x*x*.9-Math.max(0,y-.45))),[0,.25,0],[.22,.25,.21],null,{deform:v=>{ v.x*=1+.1*Math.max(0,-v.y); }});
    [1,-1].forEach(s=>pPart(B,gSph(),'#ffa531',[.08*s,.022,.075],[.075,.025,.1]));
    pPart(B,gSph(),K,[0,.07,-.2],[.06,.03,.06],[.5,0,0]);
    [1,-1].forEach(s=>{ const f=pGroup(B,[.21*s,.38,0],[0,0,.25*s]); pPart(f,gSph(),(x,y,z)=>_pc.copy(K).lerp(K2,PSm(.2,1,y)*.5),[0,-.12,0],[.045,.15,.085],null,{deform:v=>{ v.x*=1+.25*Math.min(0,v.y); v.z*=1+.15*Math.min(0,v.y); }}); R.wings.push(f); });
    const bt=pGroup(B,[0,.385,.185],[.25,0,0]);
    [1,-1].forEach(s=>pPart(bt,gSph(),'#e5484d',[.042*s,0,0],[.044,.03,.018],[0,0,.25*s])); pPart(bt,gSph(),'#c4303a',[0,0,.006],.018);
    const H=R.head=pGroup(B,[0,.52,.02]), HE={c:[0,0,0],r:[.21,.19,.2]};
    pPart(H,gSphH(),(x,y,z)=>_pc.copy(K).lerp(K2,PSm(.4,1,y)*.35).lerp(W,Math.max(pSpot2(x,y,z,.36,.08,.92,.3,.4),pSpot(x,y,z,0,-.3,.95,.32,.44))).lerp(PK,pSpot2(x,y,z,.62,-.22,.74,.1,.24)*.6),[0,0,0],HE.r);
    pPart(H,gCone(),'#ffa531',[0,-.035,.215],[.045,.07,.034],[Math.PI/2,0,0]);
    pPart(H,gCone(),'#ff8a1f',[0,-.052,.205],[.03,.045,.022],[Math.PI/2+.25,0,0],{noLine:true});
    pEye(R,H,HE,.07,.035,.046,'#1f2a44',{sx:.9,sy:1.1}); pEye(R,H,HE,-.07,.035,.046,'#1f2a44',{sx:.9,sy:1.1});
  },
  /* 아기 북극곰: 하얀 털 · 크림빛 주둥이 · 동그란 귀 · 하늘색 줄무늬 목도리 */
  bear(R){ const B=R.body, C=pLin('#f6f3ee'), Cs=pLin('#e2dcd2'), M=pLin('#fffaf2'), PK=pLin('#ff9fb0'), SC=pLin('#7cc0ea'), SC2=pLin('#4f97cf');
    pPart(B,gSphH(),(x,y,z)=>_pc.copy(C).lerp(Cs,PSm(-.2,-.95,y)*.65),[0,.3,-.02],[.27,.24,.32],null,{deform:v=>{ v.x*=1+.08*Math.max(0,-v.y); }});
    const leg=(x,y,z)=>_pc.copy(C).lerp(Cs,PSm(-.2,-.9,y)*.6);
    pLeg(R,B,.13,.2,.16,leg,.088,.12,M); pLeg(R,B,-.13,.2,.16,leg,.088,.12,M); pLeg(R,B,.13,.2,-.17,leg,.092,.12,M); pLeg(R,B,-.13,.2,-.17,leg,.092,.12,M);
    pPart(B,gSph(),C,[0,.35,-.33],.055);
    pPart(B,gTorus('bear2',.175,.05),(x,y,z)=>{ const a=Math.atan2(y,x); return _pc.copy(SC).lerp(SC2,((a/(Math.PI*2)+1)*9)%1>.5?1:0); },[0,.43,.12],1,[-1.25,0,0]);
    const sc=pGroup(B,[.12,.38,.27],[.2,.15,.3]);
    pPart(sc,gSph(),(x,y,z)=>_pc.copy(SC).lerp(SC2,((y+1)*2.2)%1>.5?1:0),[0,-.07,0],[.052,.095,.022]);
    [-.03,0,.03].forEach(dx=>pPart(sc,gCone(),SC2,[dx,-.175,0],[.012,.035,.01],[Math.PI,0,0],{noLine:true}));
    const H=R.head=pGroup(B,[0,.55,.24]), HE={c:[0,0,0],r:[.245,.215,.215]}, ME={c:[0,-.065,.155],r:[.12,.09,.1]};
    pPart(H,gSphH(),(x,y,z)=>_pc.copy(C).lerp(M,pSpot(x,y,z,0,-.35,.92,.3,.55)).lerp(PK,pSpot2(x,y,z,.64,-.18,.74,.1,.28)*.5),[0,0,0],HE.r,null,{deform:v=>{ v.x*=1+.1*PSm(0,-.8,v.y); }});
    pPart(H,gSph(),M,ME.c,ME.r);
    pPart(H,gSph(),'#2a2626',[0,-.03,.24],[.05,.036,.03],null,{deform:v=>{ v.x*=1+.22*Math.max(0,v.y); }});
    pPart(H,gSphL(),'#ffffff',[-.015,-.018,.268],[.012,.008,.006],null,{basic:true});
    pLine(H,'bearmouth',[[0,-.062],[0,-.09]].map(([x,y])=>onE(ME,x,y,.003)),.0055,'#4a3a38');
    pLine(H,'bearmouth2',[[-.032,-.1],[-.016,-.106],[0,-.09],[.016,-.106],[.032,-.1]].map(([x,y])=>onE(ME,x,y,.003)),.0055,'#4a3a38');
    pEye(R,H,HE,.095,.04,.052,'#2e2228',{sx:.9,sy:1.1}); pEye(R,H,HE,-.095,.04,.052,'#2e2228',{sx:.9,sy:1.1});
    [1,-1].forEach(s=>{ const e=pGroup(H,[.155*s,.15,-.02]); pPart(e,gSph(),C,[0,0,0],[.075,.072,.05]); pPart(e,gSph(),'#ffd0d6',[0,-.004,.032],[.045,.042,.02],null,{noShadow:true,noLine:true}); R.ears.push(e); });
  },
  /* 부엉이: 하트 모양 얼굴 · 가슴 깃털 무늬 · 큰 호박색 눈 · 깃털 귀 · 겹친 날개 깃 (황금 부엉이는 학사모 + 반짝이) */
  owl(R,T){ const B=R.body, gold=!!T.gold, o=gold?{glow:true,gcol:'#e0a92a'}:undefined;
    const C=pLin(gold?'#e2a51c':'#8a6244'), Cd=pLin(gold?'#a8700c':'#5a3b26'), L=pLin(gold?'#fde5a0':'#eed8b0'), Lr=pLin(gold?'#cf9a33':'#b48a5e');
    pPart(B,gSphH(),(x,y,z)=>{ const ch=PSm(.05,.4,z*.9-y*.5-x*x*.5), d1=Math.hypot(x-.36,y-.42,z-.84), d2=Math.hypot(x+.36,y-.42,z-.84), d=Math.min(d1,d2);
        return _pc.copy(C).lerp(Cd,PSm(.4,1,y)*.25).lerp(L,ch).lerp(Lr,PSm(.72,.95,Math.sin(y*22+Math.abs(x)*9))*ch*PSm(.2,-.45,y)*.8).lerp(L,1-PSm(.26,.33,d)).lerp(Cd,PSm(.27,.33,d)*(1-PSm(.36,.42,d))*.75); },
      [0,0,0],[.21,.25,.2],null,Object.assign({deform:v=>{ v.x*=1+.07*Math.max(0,-v.y); }},o));
    pEye(R,B,{c:[0,0,0],r:[.21,.25,.2]},.075,.105,.064,gold?'#ff6b2a':'#f2a91f',{opt:'big'}); pEye(R,B,{c:[0,0,0],r:[.21,.25,.2]},-.075,.105,.064,gold?'#ff6b2a':'#f2a91f',{opt:'big'});
    pPart(B,gCone(),'#f0a531',[0,.048,.212],[.03,.06,.03],[Math.PI*.88,0,0]);
    if (!gold) [1,-1].forEach(s=>pPart(B,gCone(),(x,y,z)=>_pc.copy(C).lerp(Cd,PSm(-.1,.4,y)*.7),[.12*s,.25,0],[.045,.11,.04],[0,0,-.35*s]));
    [1,-1].forEach(s=>{ const w=pGroup(B,[.19*s,.07,-.01],[0,0,.15*s]); const wc=(x,y,z)=>_pc.copy(C).lerp(Cd,PSm(.1,-.8,y)*.7);
      pPart(w,gSph(),wc,[.02*s,-.09,0],[.055,.16,.12],null,o); [-.055,0,.055].forEach(z=>pPart(w,gSph(),Cd,[.022*s,-.22,z],[.036,.05,.03],null,o)); R.wings.push(w); });
    [1,-1].forEach(s=>[-.016,.016].forEach(dx=>pPart(B,gSph(),'#f0a531',[.06*s+dx,-.247,.06],[.017,.011,.032])));
    if (gold){ pPart(B,pgeo('capB',()=>new THREE.CylinderGeometry(.075,.08,.045,24)),'#2c2a3e',[0,.245,0],1);
      pPart(B,gBox(),'#2c2a3e',[0,.272,0],[.21,.016,.21],[0,Math.PI/4,0]); pPart(B,gSphL(),'#ffd34d',[0,.283,0],.014);
      pPart(B,tubeGeo('tassel',[[0,.283,0],[.07,.282,.02],[.12,.27,.03],[.135,.22,.035]],.005,.005),'#ffd34d',[0,0,0],1,null,{noLine:true});
      pPart(B,gCone(),'#ffcf3a',[.136,.2,.036],[.022,.05,.022],[Math.PI,0,0]);
      R.spark=[]; for (let i=0;i<5;i++){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:wingGlowTex(),color:0xfff0a0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})); sp.userData.ph=i/5; R.bob.add(sp); R.spark.push(sp); } }
    R.head=null;
  },
  /* 키우는 알: 크림빛 알 · 하늘색 지그재그 띠 · 알록달록 점 · 반짝이 (금이 가는 모습은 따로) */
  egg(R){ const B=R.body, base=pLin('#f2dfb6'), band=pLin('#5db6f0'), dots=[[.6,.25,.75,'#ff8fb3'],[-.55,-.3,.75,'#8fd46a'],[.1,.62,-.75,'#ffc04a'],[-.75,.45,-.3,'#a98cff'],[.75,-.4,-.4,'#ff8fb3'],[0,-.55,.8,'#ffc04a'],[-.2,.85,.45,'#5db6f0'],[.4,.1,-.9,'#8fd46a']].map(d=>[d[0],d[1],d[2],pLin(d[3])]);
    pPart(B,gSphH(),(x,y,z)=>{ const a=Math.atan2(z,x), zig=Math.abs(((a/(Math.PI*2)+1)*8)%1*2-1), y0=(zig-.5)*.2-.05; let c=_pc.copy(base).lerp(band,1-PSm(.06,.1,Math.abs(y-y0)));
        for (const d of dots) c.lerp(d[3],pSpot(x,y,z,d[0],d[1],d[2],.13,.19)); return c; },[0,.27,0],[.2,.26,.2],null,{deform:v=>{ if (v.y>0){ v.x*=1-.16*v.y; v.z*=1-.16*v.y; } }});
    pPart(B,gSph(),'#ffffff',[-.085,.42,.12],[.03,.06,.015],[0,-.6,.5],{basic:true}); pPart(B,gSphL(),'#ffffff',[-.04,.48,.11],.012,null,{basic:true});
    const gB=gBox(); R.cracks=[[],[]];
    [[0,.36,.19,.11,.4],[.05,.31,.192,.08,-.6],[-.05,.32,.19,.07,.7]].forEach(([x,y,z,l,a],k)=>{ const m=pPart(B,gB,'#5a4632',[x,y,z],[l,.012,.01],[0,0,a],{noShadow:true,noLine:true,keep:true}); m.visible=false; R.cracks[k?1:0].push(m); });
    [[.13,.3,.14,.09,1.1],[.16,.24,.11,.06,-.4]].forEach(([x,y,z,l,a])=>{ const m=pPart(B,gB,'#5a4632',[x,y,z],[l,.012,.01],[0,.75,a],{noShadow:true,noLine:true,keep:true}); m.visible=false; R.cracks[1].push(m); });
  },
  /* 리본 고양이: 하얀 털 · 분홍 리본 · 방울 목걸이 · 파란 눈(진한 속눈썹) · 하트 꼬리 */
  ribbon(R){ const B=R.body, C=pLin('#f8f2f0'), Cs=pLin('#e6e0ea'), W=pLin('#fffcfa'), P=pLin('#ff7fae'), PD=pLin('#e0558c'), PK=pLin('#ffa3bf');
    pPart(B,gSphH(),(x,y,z)=>_pc.copy(C).lerp(Cs,PSm(-.25,-1,y)*.55).lerp(W,PSm(.2,.6,z*.8-y*.6)),[0,.28,-.02],[.2,.19,.29]);
    [[0,.375,.18,.055],[.05,.35,.17,.045],[-.05,.35,.17,.045]].forEach(([x,y,z,r])=>pPart(B,gSph(),W,[x,y,z],[r,r*.85,r*.75]));
    const lg=(x,y,z)=>_pc.copy(C).lerp(Cs,PSm(.1,-.9,y)*.35);
    pLeg(R,B,.1,.2,.15,lg,.058,.12,W); pLeg(R,B,-.1,.2,.15,lg,.058,.12,W); pLeg(R,B,.1,.2,-.17,lg,.062,.12,W); pLeg(R,B,-.1,.2,-.17,lg,.062,.12,W);
    pPart(B,gTorus('rib',.105,.018),P,[0,.405,.165],1,[-1.15,0,0]);
    pPart(B,gSph(),'#ffd34d',[0,.335,.25],.026); pPart(B,gBox(),'#8a6a1a',[0,.329,.274],[.03,.004,.004],null,{noShadow:true,noLine:true}); pPart(B,gSphL(),'#fff6c8',[-.009,.345,.268],.006,null,{basic:true});
    const H=R.head=pGroup(B,[0,.52,.2]), HE={c:[0,0,0],r:[.23,.2,.2]};
    pPart(H,gSphH(),(x,y,z)=>_pc.copy(C).lerp(W,pSpot(x,y,z,0,-.46,.88,.34,.6)).lerp(PK,pSpot2(x,y,z,.6,-.22,.74,.1,.28)*.6),[0,0,0],HE.r,null,{deform:v=>{ v.x*=1+.12*PSm(0,-.8,v.y); if (v.y>.6) v.y*=.96; }});
    const PE={c:[0,-.072,.168],r:[.08,.036,.04]};
    [1,-1].forEach(s=>pPart(H,gSph(),W,[.032*s,-.072,.168],[.048,.036,.04]));
    pPart(H,gSph(),'#ff8fb0',[0,-.04,.206],[.024,.017,.014],null,{deform:v=>{ if (v.y<0) v.x*=1+v.y*.55; }});
    pLine(H,'ribmouth',[[-.036,-.084],[-.018,-.098],[0,-.087],[.018,-.098],[.036,-.084]].map(([x,y])=>onE(PE,x*.9,y,.003)),.005,'#8a6a6a');
    [1,-1].forEach(s=>[[-.05,.012],[-.075,-.02]].forEach(([dy,ey],k)=>pLine(H,'ribwh'+s+k,[[.075*s,-.062+dy*.2,.17],[.14*s,-.06+ey*.5,.168],[.2*s,-.055+ey,.15]],.0028,'#a89a9a')));
    pEye(R,H,HE,.09,.035,.064,'#3c7fe6',{opt:'lash',sx:.95,sy:1.05}); pEye(R,H,HE,-.09,.035,.064,'#3c7fe6',{opt:'lash',sx:.95,sy:1.05});
    [1,-1].forEach(s=>{ const e=pGroup(H,[.12*s,.15,0],[0,0,-.28*s]); pPart(e,gCone(),C,[0,.07,0],[.085,.16,.06]); pPart(e,gCone(),'#ffc2d4',[0,.055,.03],[.05,.11,.02],null,{noLine:true}); R.ears.push(e); });
    const bow=pGroup(H,[-.13,.17,.05],[0,0,.35]);
    pPart(bow,gSph(),(x,y,z)=>_pc.copy(P).lerp(PD,PSm(.2,.9,Math.abs(x))*.0+PSm(-.2,-.9,y)*.4),[.058,0,0],[.062,.042,.026],[0,0,.25]); pPart(bow,gSph(),(x,y,z)=>_pc.copy(P).lerp(PD,PSm(-.2,-.9,y)*.4),[-.058,0,0],[.062,.042,.026],[0,0,-.25]);
    [1,-1].forEach(s=>pPart(bow,gSph(),PD,[.028*s,-.045,0],[.016,.035,.012],[0,0,.35*s]));
    pPart(bow,gSph(),PD,[0,0,.006],[.026,.029,.026]);
    const T=R.tail=pGroup(B,[0,.33,-.3]); pPart(T,tubeGeo('cattail',[[0,0,0],[0,.08,-.1],[0,.22,-.14],[0,.36,-.08],[0,.42,.02]],.045,.032),(x,y,z,i)=>_pc.copy(C).lerp(Cs,PSm(.5,0,tubeT(i))*.25),[0,0,0],1);
    const ht=pGroup(T,[0,.45,.03]); pPart(ht,gSph(),P,[.025,.01,0],[.035,.035,.02]); pPart(ht,gSph(),P,[-.025,.01,0],[.035,.035,.02]); pPart(ht,gCone(),P,[0,-.035,0],[.05,.055,.019],[Math.PI,0,0]);
  },
  /* 아기 여우: 주황 털 · 하얀 볼과 가슴 · 갈색 양말과 귀 끝 · 크고 복슬복슬한 꼬리 · 머리에 나뭇잎 */
  fox(R){ const B=R.body, C=pLin('#f28a3a'), Cd=pLin('#d96f22'), W=pLin('#fff4e6'), D=pLin('#4e2c20'), PK=pLin('#ff9fb0');
    pPart(B,gSphH(),(x,y,z)=>_pc.copy(C).lerp(Cd,PSm(.4,1,y)*.3).lerp(W,PSm(.2,.6,z*.8-y*.6)),[0,.28,-.02],[.2,.19,.29]);
    [[0,.375,.18,.06],[.052,.35,.17,.05],[-.052,.35,.17,.05],[0,.33,.2,.045]].forEach(([x,y,z,r])=>pPart(B,gSph(),W,[x,y,z],[r,r*.85,r*.75]));
    const sock=(x,y,z)=>_pc.copy(C).lerp(D,PSm(.05,-.55,y));
    pLeg(R,B,.1,.2,.15,sock,.055,.12,D); pLeg(R,B,-.1,.2,.15,sock,.055,.12,D); pLeg(R,B,.1,.2,-.17,sock,.06,.12,D); pLeg(R,B,-.1,.2,-.17,sock,.06,.12,D);
    const H=R.head=pGroup(B,[0,.52,.2]), HE={c:[0,0,0],r:[.22,.19,.19]}, ME={c:[0,-.07,.15],r:[.065,.052,.11]};
    pPart(H,gSphH(),(x,y,z)=>_pc.copy(C).lerp(Cd,PSm(.55,1,y)*.25).lerp(W,Math.max(pSpot2(x,y,z,.6,-.42,.62,.3,.5),pSpot(x,y,z,0,-.55,.82,.3,.5))).lerp(PK,pSpot2(x,y,z,.55,-.12,.8,.07,.2)*.45),
      [0,0,0],HE.r,null,{deform:v=>{ v.x*=1+.1*PSm(.1,-.7,v.y); }});
    [1,-1].forEach(s=>pPart(H,gCone(),W,[.195*s,-.085,.05],[.05,.1,.045],[0,0,(Math.PI/2+.55)*s]));
    pPart(H,gSph(),W,ME.c,ME.r,null,{deform:v=>{ if (v.z>0){ v.x*=1-.32*v.z; v.y*=1-.2*v.z; } }});
    pPart(H,gSph(),'#2a1d1a',[0,-.058,.255],[.027,.02,.018]); pPart(H,gSphL(),'#ffffff',[-.008,-.05,.271],[.007,.005,.004],null,{basic:true});
    pLine(H,'foxmouth',[[-.024,-.1],[0,-.106],[.024,-.1]].map(([x,y])=>onE(ME,x*.8,y,.003)),.0045,'#5a3a2a');
    pEye(R,H,HE,.088,.042,.056,'#8a4a14',{sx:.95,sy:1.1}); pEye(R,H,HE,-.088,.042,.056,'#8a4a14',{sx:.95,sy:1.1});
    [1,-1].forEach(s=>{ const e=pGroup(H,[.12*s,.14,-.01],[0,0,-.3*s]); pPart(e,gCone(),(x,y,z)=>_pc.copy(C).lerp(D,PSm(.12,.3,y)),[0,.09,0],[.085,.2,.055]); pPart(e,gCone(),W,[0,.07,.026],[.045,.13,.02],null,{noLine:true}); R.ears.push(e); });
    const lf=pGroup(H,[-.02,.195,.03],[.55,.35,-.25]);
    pPart(lf,gSph(),(x,y,z)=>_pc.copy(pLin('#79c84e')).lerp(pLin('#4f9a34'),PSm(.2,-.8,x)*.5),[0,.014,0],[.066,.014,.115],null,{deform:v=>{ v.x*=Math.max(0,1-Math.abs(v.z)**1.6); }});
    pLine(lf,'leafrib2',[[0,.03,-.11],[0,.033,0],[0,.03,.11]],.004,'#3f7a2a');
    pPart(lf,tubeGeo('leafstem2',[[0,.014,-.11],[0,.022,-.14],[.014,.04,-.158]],.006,.005),'#3f7a2a',[0,0,0],1,null,{noLine:true});
    const T=R.tail=pGroup(B,[0,.3,-.28],[-.5,0,0]);
    pPart(T,gSph(),C,[0,.08,-.08],[.11,.12,.17],[.5,0,0]);
    pPart(T,gSph(),(x,y,z)=>_pc.copy(C).lerp(W,PSm(.25,.85,y*.6-z*.6)),[0,.18,-.2],[.12,.12,.14],[.9,0,0]);
    pPart(T,gSph(),W,[0,.27,-.28],[.092,.1,.09]);
  },
  /* 아기 용: 큰 머리 · 둥근 주둥이(콧구멍 · 입 없이) · 줄무늬 배 · 뒤로 휜 뿔 · 보라 날개 · 하트 꼬리 */
  dragon(R){ const B=R.body, C=pLin('#6fd0c4'), Cd=pLin('#4fb2a6'), Y=pLin('#fff0cc'), Yd=pLin('#ecd6a2'), A='#b79cf0', AD='#8f74d6', PK=pLin('#ff9fb0');
    pPart(B,gSphH(),(x,y,z)=>{ const pl=PSm(.25,.5,z-x*x*1.2); return _pc.copy(C).lerp(Cd,PSm(.3,1,y)*.3).lerp(Y,pl).lerp(Yd,PSm(.55,.85,Math.sin(y*26))*pl*.7); },[0,-.03,-.03],[.17,.18,.2],null,{deform:v=>{ v.x*=1+.08*Math.max(0,-v.y); }});
    [1,-1].forEach(s=>pPart(B,gSph(),C,[.1*s,-.19,.05],[.055,.04,.07]));
    [1,-1].forEach(s=>[-.02,0,.02].forEach(dx=>pPart(B,gSphL(),Y,[.1*s+dx,-.2,.115],[.012,.01,.012],null,{noLine:true})));
    [1,-1].forEach(s=>pPart(B,gSph(),C,[.08*s,-.055,.16],[.03,.05,.03],[1.05,0,-.2*s],{noLine:true}));   // 배 앞에 모은 앞발
    const T=R.tail=pGroup(B,[0,-.08,-.18]);
    pPart(T,tubeGeo('dragtail2',[[0,0,0],[0,-.05,-.1],[0,-.02,-.22],[0,.08,-.29],[0,.17,-.27]],.065,.022),C,[0,0,0],1);
    [[0,-.015,-.11,.02],[0,.02,-.215,.017]].forEach(([x,y,z,r],k)=>pPart(T,gCone(),A,[x,y+.045,z],[r,.045,r*1.4],[-.3-.4*k,0,0]));
    const ht=pGroup(T,[0,.2,-.255],[-.25,0,0]);
    pPart(ht,gSph(),A,[.022,.01,0],[.032,.032,.018]); pPart(ht,gSph(),A,[-.022,.01,0],[.032,.032,.018]); pPart(ht,gCone(),A,[0,-.03,0],[.046,.05,.017],[Math.PI,0,0]);
    for (let i=0;i<3;i++) pPart(B,gCone(),A,[0,.15-.07*i,-.115-.055*i],[.025,.06,.03],[-.45-.3*i,0,0]);
    const H=R.head=pGroup(B,[0,.21,.08]), HE={c:[0,0,0],r:[.21,.19,.19]};
    pPart(H,gSphH(),(x,y,z)=>_pc.copy(C).lerp(Cd,PSm(.5,1,y)*.3).lerp(Y,PSm(.35,.75,z*.7-y*.8)*.45).lerp(PK,pSpot2(x,y,z,.62,-.25,.74,.1,.26)*.55),[0,0,0],HE.r);
    pPart(H,gSph(),(x,y,z)=>_pc.copy(C).lerp(Y,PSm(-.1,-.8,y)*.55),[0,-.065,.1],[.13,.085,.1]);
    pEye(R,H,HE,.088,.03,.062,'#2b2756',{sx:.95,sy:1.1}); pEye(R,H,HE,-.088,.03,.062,'#2b2756',{sx:.95,sy:1.1});
    [1,-1].forEach(s=>pPart(H,tubeGeo('dhorn',[[0,0,0],[0,.06,-.02],[0,.1,-.07],[0,.11,-.12]],.03,.008),(x,y,z,i)=>_pc.copy(pLin('#ffe0a0')).lerp(pLin('#fff8e4'),PSm(.4,1,tubeT(i))),[.085*s,.13,-.02],1,[0,.25*s,0]));
    [1,-1].forEach(s=>{ const e=pGroup(H,[.19*s,.03,-.03],[0,0,-1.1*s]); pPart(e,gCone(),(x,y,z)=>_pc.copy(pLin(A)).lerp(pLin('#dcc6ff'),PSm(-.3,.5,y)*.6),[0,.05,0],[.045,.09,.018]); R.ears.push(e); });
    pPart(H,gCone(),A,[0,.17,-.06],[.026,.05,.03],[-.3,0,0]); pPart(H,gCone(),A,[0,.12,-.145],[.022,.045,.028],[-.9,0,0]);
    const wg=pgeo('dragwing2',()=>{ const s=new THREE.Shape(); s.moveTo(0,0); s.quadraticCurveTo(.14,.2,.34,.2);
      s.quadraticCurveTo(.3,.1,.36,.03); s.quadraticCurveTo(.28,.02,.26,-.07); s.quadraticCurveTo(.18,-.03,.13,-.11); s.quadraticCurveTo(.08,-.03,0,-.05); s.lineTo(0,0); return new THREE.ShapeGeometry(s,10); });
    const bone=pgeo('dwbone',()=>{ const c=new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,0,0),new THREE.Vector3(.14,.2,0),new THREE.Vector3(.34,.2,0)); return new THREE.TubeGeometry(c,10,.012,6,false); });
    const bone2=pgeo('dwbone2',()=>{ const c=new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,0,0),new THREE.Vector3(.12,.05,0),new THREE.Vector3(.26,-.06,0)); return new THREE.TubeGeometry(c,8,.008,5,false); });
    [1,-1].forEach(s=>{ const w=pGroup(B,[.11*s,.08,-.09],[0,s>0?-.35:Math.PI+.35,0]);
      pPart(w,wg,(x,y,z)=>_pc.copy(pLin(A)).lerp(pLin('#e8d2ff'),PSm(.12,.34,Math.hypot(x,y))),[0,0,0],1,null,{side:true});
      pPart(w,bone,AD,[0,0,.002],1,null,{noLine:true}); pPart(w,bone2,AD,[0,0,.002],1,null,{noLine:true}); R.wings.push(w); w.userData.side=s; });
  }
};
/* ---------- 합치기: 부위(그룹)마다 같은 재료끼리 한 덩어리 + 테두리 한 덩어리 ---------- */
function petMergeGeos(list){ let nv=0, ni=0; list.forEach(g=>{ nv+=g.attributes.position.count; ni+=g.index?g.index.count:g.attributes.position.count; });
  const pos=new Float32Array(nv*3), nor=new Float32Array(nv*3), col=new Float32Array(nv*3), idx=nv>65535?new Uint32Array(ni):new Uint16Array(ni); let vo=0, io=0;
  list.forEach(g=>{ const P=g.attributes.position, N=g.attributes.normal, C=g.attributes.color, c=P.count;
    for (let i=0;i<c;i++){ const k=(vo+i)*3; pos[k]=P.getX(i); pos[k+1]=P.getY(i); pos[k+2]=P.getZ(i); nor[k]=N.getX(i); nor[k+1]=N.getY(i); nor[k+2]=N.getZ(i); col[k]=C.getX(i); col[k+1]=C.getY(i); col[k+2]=C.getZ(i); }
    if (g.index){ const I=g.index; for (let j=0;j<I.count;j++) idx[io+j]=I.getX(j)+vo; io+=I.count; } else { for (let j=0;j<c;j++) idx[io+j]=vo+j; io+=c; }
    vo+=c; });
  const out=new THREE.BufferGeometry(); out.setAttribute('position',new THREE.BufferAttribute(pos,3)); out.setAttribute('normal',new THREE.BufferAttribute(nor,3)); out.setAttribute('color',new THREE.BufferAttribute(col,3));
  out.setIndex(new THREE.BufferAttribute(idx,1)); out.computeBoundingSphere(); return out; }
function petBake(root){ const groups=[]; root.traverse(o=>{ if (!o.isMesh&&!o.isSprite) groups.push(o); });
  groups.forEach(g=>{ const parts=g.children.filter(c=>c.isMesh&&c.userData.part&&!c.userData.keep); if (!parts.length) return;
    const by=new Map(), lined=[];
    parts.forEach(m=>{ m.updateMatrix(); const geo=m.geometry.clone().applyMatrix4(m.matrix); if (!by.has(m.material)) by.set(m.material,[]); by.get(m.material).push(geo); if (m.userData.line) lined.push(geo); g.remove(m); });
    by.forEach((list,mat)=>{ const mm=new THREE.Mesh(petMergeGeos(list),mat); mm.castShadow=mat.userData.petKind!=='basic'; mm.userData.noFlash=true; mm.frustumCulled=false; g.add(mm); });
    if (lined.length){ const ol=new THREE.Mesh(petMergeGeos(lined),petLineMat()); ol.castShadow=false; ol.userData.noFlash=true; ol.frustumCulled=false; g.add(ol); } }); }
/* 💤 표시 */
let PET_ZTEX=null;
function petZTex(){ if (PET_ZTEX) return PET_ZTEX; const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d');
  g.font='bold 30px sans-serif'; g.textAlign='center'; g.lineWidth=5; g.strokeStyle='#2b3550'; g.fillStyle='#bfe3ff';
  g.strokeText('Z',38,30); g.fillText('Z',38,30); g.font='bold 20px sans-serif'; g.strokeText('z',20,52); g.fillText('z',20,52);
  return PET_ZTEX=new THREE.CanvasTexture(c); }
/* 종류마다 한 번만 만들어 두는 본(템플릿) → 펫이 필요할 때마다 복제 (모양 · 재료는 함께 써요) */
const PET_TPL={};
function petTpl(type){ if (PET_TPL[type]) return PET_TPL[type];
  const T=PET_TYPES[type], R=newRig(); PET_BUILD[T.build](R,T);
  const tag=(o,r,i)=>{ if (o){ o.userData.role=r; o.userData.ri=i||0; } };
  tag(R.bob,'bob'); tag(R.body,'body'); tag(R.head,'head'); tag(R.tail,'tail');
  R.eyes.forEach((o,i)=>tag(o,'eye',i)); R.legs.forEach((o,i)=>tag(o,'leg',i)); R.ears.forEach((o,i)=>tag(o,'ear',i)); R.wings.forEach((o,i)=>tag(o,'wing',i));
  if (R.cracks) R.cracks.forEach((a,k)=>a.forEach((m,i)=>tag(m,'crack'+k,i))); if (R.spark) R.spark.forEach((s,i)=>tag(s,'spark',i));
  petBake(R.g); R.g.traverse(o=>{ o.frustumCulled=false; o.userData.noFlash=true; });
  return PET_TPL[type]=R; }
/* ---------- 모델 파일(GLB) 펫: 한 번 불러와서 뼈대째 복제 · 걷기/날기 ↔ 가만히 애니메이션을 섞어요 ---------- */
const PET_GLB={}, PET_GLB_V='20261122a';
function petGlbLoad(key,cb){ let E=PET_GLB[key];
  if (!E){ E=PET_GLB[key]={g:null,cbs:[],err:false};
    new THREE.GLTFLoader().load('models/pets/'+key+'.glb?v='+PET_GLB_V,g=>{
      g.scene.traverse(o=>{ if (o.isMesh){ o.castShadow=!(o.material&&o.material.transparent); o.frustumCulled=false; o.userData.noFlash=true; const m=o.material; if (m&&!m.userData.petPrep){ m.userData.petPrep=true; addRim(m,.22,0xfff2dc); petNoGlow(m); } } });
      g.userData.bb=new THREE.Box3().setFromObject(g.scene); g.userData.piv=petPaws(g.scene,g.userData.bb); E.g=g; const c=E.cbs; E.cbs=[]; c.forEach(f=>{ try{ f(g); }catch(e){} }); },
      undefined,()=>{ E.err=true; E.cbs=[]; }); }
  if (E.g) cb(E.g); else if (!E.err) E.cbs.push(cb); }
/* 앞발 · 뒷발이 땅에 닿는 곳(앞뒤 위치): 애니메이션 없는 펫이 앉을 때 앞발을 축으로 몸을 뒤로 기울여요 */
function petPaws(scene,bb){ const lowY=bb.min.y+(bb.max.y-bb.min.y)*.06, cz=(bb.min.z+bb.max.z)/2, v=new THREE.Vector3(); let f=0,nf=0,r=0,nr=0;
  scene.updateMatrixWorld(true);
  scene.traverse(o=>{ if (!o.isMesh||o.isSkinnedMesh) return; const P=o.geometry.attributes.position; for (let i=0;i<P.count;i+=2){ v.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld); if (v.y>lowY) continue; if (v.z>cz){ f+=v.z; nf++; } else { r+=v.z; nr++; } } });
  return {f:nf?f/nf:bb.max.z*.4, r:nr?r/nr:bb.min.z*.4}; }
function makeGlbPet(type,T){
  const R=newRig(); R.glb=T.glb; R.g.name='pet_'+type;
  R.z=new THREE.Sprite(new THREE.SpriteMaterial({map:petZTex(),transparent:true,depthWrite:false})); R.z.scale.setScalar(.28); R.z.visible=false; R.bob.add(R.z);
  petGlbLoad(T.glb,g=>{ if (R.dead) return;
    const root=THREE.SkeletonUtils.clone(g.scene), bb=g.userData.bb, sc=T.h/Math.max(.01,bb.max.y-bb.min.y);
    root.scale.setScalar(sc); root.position.y=(T.move==='fly'?-(bb.min.y+bb.max.y)/2:-bb.min.y)*sc;   // 나는 펫은 몸 가운데, 걷는 펫은 발바닥이 기준
    root.traverse(o=>{ o.frustumCulled=false; o.userData.noFlash=true; });
    R.body.add(root); R.model=root; R.bones={}; R.lids=[]; root.traverse(o=>{ if (o.isBone) R.bones[o.name]=o;
      if (o.isMesh&&o.morphTargetInfluences&&o.material&&o.material.transparent){ R.lids.push(o); o.visible=false; } });   // 잘 때 덮는 눈꺼풀(따로 된 투명 덩어리): 감을 때만 보여요
    R.pivF=(g.userData.piv?g.userData.piv.f:0)*sc; R.pivR=(g.userData.piv?g.userData.piv.r:0)*sc;
    const clips=g.animations||[];
    if (!clips.length){ R.rigid=true; return; }   // 애니메이션이 없는 모델: petPoseRigid가 몸 전체를 움직여요
    const mx=R.mixer=new THREE.AnimationMixer(root);
    const find=(...res)=>{ for (const re of res){ const c=clips.find(c=>re.test(c.name)); if (c) return c; } return null; };
    // 처음과 끝 자세가 다른 애니메이션(앉기 · 눕기)은 한 번 하고 끝 자세로 멈춰 있어요. 같으면(달리기 · 가만히) 계속 반복
    const act=c=>{ if (!c) return null; const a=mx.clipAction(c); if (!petClipLoops(c)){ a.setLoop(THREE.LoopOnce,1); a.clampWhenFinished=true; a.once=true; } return a; };
    const cIdle=find(/idle|stand|breath|대기/i), cMove=T.move==='fly'?find(/fly|날/i):find(/run|gallop|trot|달리/i,/walk|걷/i), cSit=find(/sit|squat|앉/i), cSleep=find(/sleep|lie|rest|잠/i);
    R.aIdle=act(cIdle)||(!cMove&&!cSit&&!cSleep?act(clips[0]):null);   // 가만히 애니메이션이 없으면 뼈대 기본 자세(서 있기)
    R.aMove=act(cMove)||R.aIdle; R.aSit=act(cSit); R.aSleep=act(cSleep);
    R.mw=T.move==='fly'?1:0; R.sw=0; R.zw=0;
    [R.aIdle,R.aMove,R.aSit,R.aSleep].forEach(a=>{ if (a&&!a.isRunning()){ a.play(); a.setEffectiveWeight(0); } });
    if (R.aIdle) R.aIdle.setEffectiveWeight(1-R.mw); if (R.aMove&&R.aMove!==R.aIdle) R.aMove.setEffectiveWeight(R.mw);
    R.tailBone=null; for (const k in R.bones) if (/^tail[_ .]?(0?1|base|root)$/i.test(k)){ R.tailBone=R.bones[k]; break; }
    mx.update(Math.random()*2); });
  return R; }
function petClipLoops(c){ for (const tr of c.tracks){ const v=tr.values, n=tr.getValueSize(), L=v.length-n; if (L<=0) continue;
    if (/quaternion$/.test(tr.name)){ const d=Math.abs(v[0]*v[L]+v[1]*v[L+1]+v[2]*v[L+2]+v[3]*v[L+3]); if (2*Math.acos(Math.min(1,d))>.06) return false; }
    else { const lim=/position$/.test(tr.name)?.01:.05; for (let i=0;i<n;i++) if (Math.abs(v[i]-v[L+i])>lim) return false; } }
  return true; }
function petDispose(R){ R.dead=true; if (R.mixer) R.mixer.stopAllAction(); R.g.traverse(o=>{ if (o.isSkinnedMesh&&o.skeleton) o.skeleton.dispose(); }); }
function makePet(type){
  const T0=PET_TYPES[type]; if (T0&&T0.glb) return makeGlbPet(type,T0);
  const g=petTpl(type).g.clone(true), R={g,eyes:[],legs:[],ears:[],wings:[],tail:null,head:null}, arr={eye:R.eyes,leg:R.legs,ear:R.ears,wing:R.wings};
  g.traverse(o=>{ const r=o.userData.role; if (!r) return; const i=o.userData.ri;
    if (arr[r]) arr[r][i]=o; else if (r==='bob') R.bob=o; else if (r==='body') R.body=o; else if (r==='head') R.head=o; else if (r==='tail') R.tail=o;
    else if (r==='crack0'||r==='crack1'){ R.cracks=R.cracks||[[],[]]; R.cracks[r==='crack0'?0:1][i]=o; }
    else if (r==='spark'){ o.material=o.material.clone(); (R.spark=R.spark||[])[i]=o; } });
  R.z=new THREE.Sprite(new THREE.SpriteMaterial({map:petZTex(),transparent:true,depthWrite:false})); R.z.scale.setScalar(.28); R.z.visible=false; R.bob.add(R.z);
  R.g.name='pet_'+type; R.g.traverse(o=>{ o.frustumCulled=false; o.userData.noFlash=true; });
  return R;
}

/* ---------- 붙이기: 상태(위치)는 캐릭터에 남겨서 옷을 바꿔 입어도 펫이 순간이동하지 않아요 ---------- */
function attachPet(ch,type){
  if (!PET_TYPES[type]||!ch||!ch.root) return null;
  const R=makePet(type);
  const st=ch.petSt||(ch.petSt={pos:null,yaw:0,op:new THREE.Vector3(),ov:0,still:0,k:0,ph:Math.random()*6,t:0,blink:2+Math.random()*3,react:null,fy:0});
  ch.root.add(R.g);
  PETS.push({ch,type,T:PET_TYPES[type],R,st});
  return R.g;
}
/* 문제를 풀었을 때: 지금 내 캐릭터의 펫이 반응해요 */
function petReact(ok){
  const me=typeof knight!=='undefined'?knight:null; if (!me) return;
  PETS.forEach(p=>{ if (p.ch===me){ p.st.react={t:0,ok:!!ok}; p.st.still=0;
    if (ok && p.type==='dragon' && p.st.pos && typeof fx!=='undefined' && fx.burst){ try{ const f=p.st.yaw; fx.burst(p.st.pos.x+Math.sin(f)*.5,p.st.pos.y+(p.T.flyH||1)*1.2,p.st.pos.z+Math.cos(f)*.5,0xff8a3d,10,1.6); }catch(e){} }
    if (p.st.pos && typeof fx!=='undefined' && fx.burst){ try{ fx.burst(p.st.pos.x,p.st.pos.y+(p.T.flyH||.5),p.st.pos.z,ok?0xffd34d:0x9aa4b2,ok?14:6,ok?2.6:1); }catch(e){} } } });
}

const PV=new THREE.Vector3(), PQ=new THREE.Quaternion(), PS=new THREE.Vector3(), PF=new THREE.Vector3(), PT=new THREE.Vector3(), PQ2=new THREE.Quaternion(), PUP=new THREE.Vector3(0,1,0);
const angLerp=(a,b,t)=>{ let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI; return a+d*t; };
const damp=(a,b,k,dt)=>a+(b-a)*Math.min(1,k*dt);
function petsTick(){
  PET_CAP.value=(typeof bloom!=='undefined'&&bloom&&bloom.enabled&&typeof composer!=='undefined'&&composer)?Math.max(.3,bloom.threshold-.03):10;
  const now=performance.now()/1000, dt=PET_LAST?Math.min(.1,now-PET_LAST):0; PET_LAST=now;
  for (let i=PETS.length-1;i>=0;i--){ const p=PETS[i]; if (!p.R.g.parent){ PETS.splice(i,1); if (p.R.glb) petDispose(p.R); continue; } if (!p.ch.root.parent) continue;
    try{ petUpdate(p,dt,now); }catch(e){} }
}
function petUpdate(p,dt,now){
  const {R,st,T}=p, root=p.ch.root;
  root.updateWorldMatrix(true,false); root.matrixWorld.decompose(PV,PQ,PS);
  // 로그인 화면(세 캐릭터가 나란히)에서는 펫을 숨겨요: 옆 친구와 겹쳐서
  const lineup=typeof LOBBY!=='undefined'&&LOBBY.last===null&&LOBBY.chars&&LOBBY.chars[p.ch.job]===p.ch;
  const sc=PS.x; if (sc<.4||lineup){ R.g.visible=false; return; } R.g.visible=true;
  // 주인 속도 · 가는 방향
  const jump=st.pos?PV.distanceTo(st.op):99, ddx=PV.x-st.op.x, ddz=PV.z-st.op.z; st.op.copy(PV);
  const ov=dt>0&&jump<6?Math.min(10,jump/dt):0; st.ov=damp(st.ov,ov,5,dt);
  if (dt>0 && jump<6 && jump>1e-4){ st.mx=damp(st.mx||0,ddx/dt,6,dt); st.mz=damp(st.mz===undefined?1:st.mz,ddz/dt,6,dt); }
  const ml=Math.hypot(st.mx||0,st.mz||0)||1, fx=(st.mx||0)/ml, fz=(st.mz===undefined?1:st.mz)/ml;
  // 화면(카메라) 쪽 방향: 서 있을 때는 주인의 화면 오른쪽에 앉아서 화면을 봐요
  let cx=camera.position.x-PV.x, cz=camera.position.z-PV.z; const cl=Math.hypot(cx,cz)||1; cx/=cl; cz/=cl;
  const shop=typeof SHOP!=='undefined'&&SHOP.open&&typeof knight!=='undefined'&&p.ch===knight;
  const fly=T.move==='fly';
  st.k=damp(st.k,Math.min(1,st.ov/2.2),3,dt);
  const side=fly?.95:1.3, back=fly?.8:1.25, k=st.k;
  const ix=PV.x+cz*side+cx*.35, iz=PV.z-cx*side+cz*.35;               // 서 있을 때 자리
  const mx=PV.x-fx*back+fz*.55, mz=PV.z-fz*back-fx*.55;                // 달릴 때 자리(뒤쪽 옆)
  PT.set(ix*(1-k)+mx*k, PV.y, iz*(1-k)+mz*k);
  if (shop) PT.set(PV.x+1.6,PV.y,PV.z+.35);   // 상점 미리보기: 캐릭터 오른쪽에 넉넉히
  const camYaw=Math.atan2(cx,cz);
  if (!st.pos||jump>6||st.pos.distanceTo(PT)>12){ st.pos=PT.clone(); st.yaw=camYaw; st.v=0; }
  const dx=PT.x-st.pos.x, dz=PT.z-st.pos.z, dist=Math.hypot(dx,dz);
  // 도착하면 조금 흔들려도 가만히: 멀어지면(0.6 넘게) 다시 출발
  if (st.arr && dist>.6) st.arr=false; if (!st.arr && dist<.08) st.arr=true;
  const vmax=Math.max(4.2,st.ov*1.3)*T.spd, want=st.arr?0:Math.min(vmax,Math.max(.6,dist*3.2));
  st.v=damp(st.v||0,want,8,dt);
  if (dist>1e-4 && !st.arr){ const m=Math.min(dist,st.v*dt); st.pos.x+=dx/dist*m; st.pos.z+=dz/dist*m; }
  const moving=st.v>.35;
  st.still=moving?0:st.still+dt; if (shop) st.still=Math.min(st.still,3);
  const sleep=st.still>8&&T.move!=='egg', sit=st.still>1.2;
  // 바닥 높이 · 나는 펫 높이
  const lift=fly?(sleep?0:(T.flyH||1.4)):0;
  st.fy=damp(st.fy,lift,sleep?1.5:3,dt);
  st.pos.y=damp(st.pos.y,PV.y,10,dt);
  // 방향: 움직이면 가는 쪽, 멈추면 화면 쪽(주인 쪽으로 살짝 고개)
  const tyaw=moving?Math.atan2(dx,dz):camYaw-.45;
  st.yaw=angLerp(st.yaw,tyaw,Math.min(1,dt*(moving?8:3)));
  st.t+=dt;
  // 반응(맞힘: 폴짝 + 한 바퀴 / 틀림: 시무룩)
  let hop=0, spin=0, sad=0;
  if (st.react){ st.react.t+=dt; const r=st.react.t;
    if (st.react.ok){ if (r<.9){ hop=Math.abs(Math.sin(r/.45*Math.PI))*.32; spin=r<.45?r/.45*Math.PI*2:0; } else st.react=null; }
    else { if (r<1.6) sad=Math.min(1,r*6)*Math.min(1,(1.6-r)*4); else st.react=null; } }
  // 세상 위치 → 캐릭터 안 위치로 바꿔 넣기
  R.g.position.set(st.pos.x,st.pos.y,st.pos.z); root.worldToLocal(R.g.position);
  PQ2.setFromAxisAngle(PUP,st.yaw+spin); R.g.quaternion.copy(PQ).invert().multiply(PQ2);
  R.g.scale.setScalar(PET_SIZE*T.size/sc);
  petPose(p,dt,now,moving,sit,sleep,hop,sad);
}
/* 모델 파일 펫: 애니메이션을 섞고, 그 위에 높이 · 기울기 · 고개(졸 때 · 시무룩할 때)만 덧붙여요 */
const PQN=new THREE.Quaternion(), PXA=new THREE.Vector3(1,0,0);
function petPoseGlb(p,dt,moving,sit,sleep,hop,sad){
  const {R,st,T}=p, mv=Math.min(1,st.v/3), t=st.t, fly=T.move==='fly';
  R.z.visible=sleep; if (sleep){ const k=(t*.6)%1; R.z.position.set(.12+.08*k,(fly?T.h*.55:R.aSleep?T.h*.55:T.h)+.15+.25*k,0); R.z.material.opacity=Math.sin(k*Math.PI); }   // 엎드려 자면 💤도 낮게
  let bobY=hop, bodyX=0;
  if (fly){ bobY+=st.fy+(sleep?T.h*.5:Math.sin(t*2.2)*.05); bodyX=moving?.28*mv:0; }   // 졸면 땅에 내려앉아요
  R.bob.position.y=damp(R.bob.position.y,bobY,fly?20:30,dt); R.body.rotation.x=damp(R.body.rotation.x,bodyX,8,dt);
  if (!R.mixer) return;
  const want=fly?(sleep?0:1):(moving?1:0); R.mw=damp(R.mw,want,6,dt);
  // 앉기 · 잠자기 애니메이션이 있으면 섞어요: 들어갈 때 처음부터(앉는 모습 · 눕는 모습) 하고 끝 자세로 멈춰 있어요
  //  (없으면 가만히 애니메이션을 느리게 + 고개 숙이기)
  const zOn=!!R.aSleep&&sleep&&!moving, sOn=!!R.aSit&&sit&&!sleep&&!moving;
  if (zOn&&!R.zOn&&R.aSleep.once&&R.zw<.05) R.aSleep.reset();
  if (sOn&&!R.sOn&&R.aSit.once&&R.sw<.05) R.aSit.reset();
  R.zOn=zOn; R.sOn=sOn;
  R.zw=damp(R.zw,zOn?1:0,3,dt); R.sw=damp(R.sw,sOn?1:0,4,dt);
  const rest=(1-R.mw)*(1-R.zw)*(1-R.sw);
  if (R.aSleep) R.aSleep.setEffectiveWeight((1-R.mw)*R.zw); if (R.aSit) R.aSit.setEffectiveWeight((1-R.mw)*(1-R.zw)*R.sw);
  if (R.aMove&&R.aMove!==R.aIdle) R.aMove.setEffectiveWeight(R.mw);
  if (R.aIdle) R.aIdle.setEffectiveWeight(R.aMove===R.aIdle?Math.max(R.mw,rest):rest);
  if (R.aMove) R.aMove.setEffectiveTimeScale(hop>0?1.7:fly?(moving?1+.3*mv:.6):Math.max(.6,Math.min(2.2,st.v/(R.aMove.getClip().duration<.8?3.4:2.3))));   // 걷는 빠르기에 맞춰 발을 굴러요 (짧은 달리기 동작은 조금 천천히)
  if (R.aIdle&&R.aIdle!==R.aMove) R.aIdle.setEffectiveTimeScale(sleep&&!R.aSleep?.35:1);
  R.mixer.update(dt);
  for (const m of R.lids) m.visible=m.morphTargetInfluences[0]>.02;   // 눈을 뜨고 있을 때는 아예 숨겨요 (멀리서 눈 위로 비쳐 보이지 않게)
  const hd=R.bones.Head, nod=Math.max(sleep&&!R.aSleep?.55:0,sad*.45); R.nod=damp(R.nod||0,nod,6,dt);
  if (hd&&R.nod>.002) hd.quaternion.multiply(PQN.setFromAxisAngle(PXA,R.nod));
  // 꼬리 뼈가 있으면: 서 있거나 앉아 있을 때 살랑살랑, 잘 때는 아주 천천히 (달리기는 애니메이션 그대로)
  if (R.tailBone){ const k=1-R.mw; if (k>.02) R.tailBone.quaternion.multiply(PQN.setFromAxisAngle(PUP,(sleep?.05*Math.sin(t*.9):.16*Math.sin(t*2.6))*k*(sad?.3:1))); }
  // 엎드려 자는 동안 숨쉬기 (잠자기 애니메이션 끝 자세가 멈춰 있어서)
  if (R.aSleep&&R.zw>.02) R.body.scale.set(1,1+.02*Math.sin(t*1.4)*R.zw,1); else if (R.body.scale.y!==1) R.body.scale.set(1,1,1);
}
/* 애니메이션이 없는 모델 펫(뼈대 없음): 몸 전체를 움직여요
   달릴 때 총총 뛰기(뜨고 · 내려앉으며 앞뒤로 기울고 찌그러짐) · 가만히 숨쉬기 · 앉기(앞발을 축으로 뒤로 살짝) · 잠자기(납작 엎드려 💤) */
function petPoseRigid(p,dt,moving,sit,sleep,hop,sad){
  const {R,st,T}=p, t=st.t, H=T.h, mv=Math.min(1,st.v/3);
  R.z.visible=sleep; if (sleep){ const k=(t*.6)%1; R.z.position.set(.12+.08*k,H*.72+.12+.25*k,0); R.z.material.opacity=Math.sin(k*Math.PI); }
  if (moving||(R.run||0)>.02) st.gph=((st.gph||0)+dt*Math.PI*2*(2.3+.28*Math.min(6,st.v)))%(Math.PI*2);
  const run=R.run=damp(R.run||0,moving?1:0,9,dt), lie=R.lie=damp(R.lie||0,sleep&&!moving?1:0,2.5,dt), sk=R.sitk=damp(R.sitk||0,sit&&!sleep&&!moving?1:0,4,dt);
  const ph=st.gph||0, up=Math.max(0,Math.sin(ph)), dn=Math.max(0,-Math.sin(ph)), br=Math.sin(t*(sleep?1.3:2.4));
  R.bob.position.y=damp(R.bob.position.y,hop+run*up*H*(.1+.05*mv),30,dt);
  const pitch=run*-.14*Math.cos(ph)+sk*(1-lie)*-.15+sad*.12;   // - = 고개를 들어요
  let sy=1+.018*br*(1-run); sy+=(.7+.015*br-sy)*lie; sy*=1-run*(.07*dn-.04*up); if (sad) sy*=1-.05*sad;
  const sxz=1+(1-sy)*.45;
  R.body.rotation.x=damp(R.body.rotation.x,pitch,run>.5?40:10,dt); R.body.rotation.y=damp(R.body.rotation.y,.1*Math.sin(t*.55)*(1-run)*(1-lie),4,dt);
  R.body.scale.set(sxz,sy,sxz);
  const th=R.body.rotation.x, pz=(th<0?(R.pivF||0):(R.pivR||0))*(1-run);   // 고개를 들면 앞발, 숙이면 뒷발을 축으로 (앉을 때는 엉덩이 쪽이 내려가요)
  R.body.position.set(0,pz*Math.sin(th),pz*(1-Math.cos(th)));
}
function petPose(p,dt,now,moving,sit,sleep,hop,sad){
  if (p.R.glb){ if (p.R.rigid) petPoseRigid(p,dt,moving,sit,sleep,hop,sad); else petPoseGlb(p,dt,moving,sit,sleep,hop,sad); return; }
  const {R,st,T}=p, mv=Math.min(1,st.v/3), t=st.t;
  st.ph+=dt*(moving?(T.move==='hop'?9:T.move==='bounce'?8:7+st.v*1.6):2);
  const ph=st.ph;
  // 눈 깜빡 / 잠
  st.blink-=dt; let eyeY=1; if (st.blink<0){ eyeY=.12; if (st.blink<-.13) st.blink=2.2+Math.random()*3.5; }
  if (sleep) eyeY=.1; else if (sad) eyeY=Math.min(eyeY,1-.45*sad);
  R.eyes.forEach(e=>{ e.scale.y=damp(e.scale.y,eyeY,25,dt); });
  R.z.visible=sleep; if (sleep){ const k=(t*.6)%1; R.z.position.set(.12+.08*k,(T.move==='fly'?.45:.85)+.25*k,0); R.z.material.opacity=Math.sin(k*Math.PI); }
  if (R.spark) R.spark.forEach((s,i)=>{ const a=t*1.4+i/R.spark.length*Math.PI*2, k=(t*.8+s.userData.ph)%1; s.position.set(Math.cos(a)*.32,.05+Math.sin(a*1.3)*.12,Math.sin(a)*.32); s.material.opacity=Math.sin(k*Math.PI); s.scale.setScalar(.06+.07*Math.sin(k*Math.PI)); });
  const B=R.body, H=R.head;
  let bobY=hop, bodyX=0, bodyZ=0, headX=sad*.4, headZ=0, sy=1;
  if (T.move==='walk'){
    R.legs.forEach((l,i)=>{ const diag=(i===0||i===3)?0:Math.PI; let a=Math.sin(ph+diag)*.75*mv;
      if (sit&&!moving&&!T.tall) a=i<2?-.15:-1.25; if (sleep) a=i<2?-1.4:1.4; l.rotation.x=damp(l.rotation.x,a,12,dt); });
    bobY+=moving?Math.abs(Math.sin(ph))*.035*mv:0;
    bodyX=sleep||T.tall?0:(sit&&!moving?-.3:0); if (sleep) bobY-=T.tall?.2:.12; else if (sit&&!moving&&!T.tall) bobY+=.02;
    if (sleep) headX=.3;
    if (!moving&&!sleep) headZ=Math.sin(t*.8)*.12;
  } else if (T.move==='hop'){
    const hp=moving?Math.max(0,Math.sin(ph)):0; bobY+=hp*.2*mv; bodyX=moving?-.25*Math.cos(ph)*mv:0;
    R.legs.forEach(l=>{ l.rotation.x=damp(l.rotation.x,moving?-.6*hp:0,12,dt); });
    if (sleep){ bobY-=.08; headX=.25; }
    if (!moving&&!sleep) headZ=Math.sin(t*.9)*.1;
  } else if (T.move==='bounce'){
    const s=moving?Math.sin(ph):Math.sin(t*2.4)*.35; bobY+=moving?Math.max(0,s)*.18*mv:0;
    sy=moving?1+.14*s:1+.05*s; if (sleep) sy=.82; if (sad) sy=Math.min(sy,1-.15*sad);
    if (hop>0) sy=1+hop*.5;
  } else if (T.move==='waddle'){
    bodyZ=moving?Math.sin(ph)*.2*mv:Math.sin(t*1.2)*.03; bobY+=moving?Math.abs(Math.cos(ph))*.03:0;
    R.wings.forEach((w,i)=>{ const s=i?-1:1; w.rotation.z=damp(w.rotation.z,(.25+(moving?.25+.2*Math.sin(ph*2):hop>0?1.1:sad?0:.06*Math.sin(t*2)))*s,12,dt); });
    if (sleep){ headX=.35; bobY-=.03; }
  } else if (T.move==='egg'){
    const pr=typeof eggShowProg==='function'?eggShowProg():0;
    if (R.cracks){ R.cracks[0].forEach(m=>m.visible=pr>=.5); R.cracks[1].forEach(m=>m.visible=pr>=.8); }
    if (moving){ bobY+=Math.abs(Math.sin(ph*.8))*.09; bodyZ=Math.sin(ph*.8)*.18; }
    else { const cyc=(t%(4.2-2.4*pr))/(4.2-2.4*pr), burst=cyc<.16?Math.sin(cyc/.16*Math.PI*6)*(.12+.3*pr):0;
      bodyZ=Math.sin(t*1.6)*(.03+.06*pr)+burst; if (cyc<.16&&pr>.5) bobY+=Math.abs(burst)*.15; }
  } else if (T.move==='fly'){
    const flap=sleep?0:(moving?16:9)+(hop>0?10:0);
    st.fp=(st.fp||0)+dt*flap; const f=Math.sin(st.fp);
    R.wings.forEach((w,i)=>{ const s=i?-1:1;
      if (p.T.build==='dragon') w.rotation.z=damp(w.rotation.z,sleep?.2*s:(.15+.75*f)*s,20,dt);
      else w.rotation.z=damp(w.rotation.z,sleep?.08*s:(.3+.9*(f*.5+.5))*s,20,dt); });
    bobY+=st.fy+(sleep?.24:Math.sin(t*2.2)*.06); bodyX=moving?.35*mv:0;
    if (sleep) headX=.25;
    if (!moving&&!sleep) headZ=Math.sin(t*.7)*.1;
    if (p.T.build==='owl' && !moving && !sleep) B.rotation.y=damp(B.rotation.y,Math.sin(t*.45)>.85?.9:0,4,dt); else B.rotation.y=damp(B.rotation.y,0,4,dt);
  }
  R.bob.position.y=damp(R.bob.position.y,bobY,T.move==='fly'?20:30,dt); R.bob.scale.set(1/Math.sqrt(sy),sy,1/Math.sqrt(sy));
  B.rotation.x=damp(B.rotation.x,bodyX,8,dt); B.rotation.z=damp(B.rotation.z,bodyZ,12,dt);
  if (H){ H.rotation.x=damp(H.rotation.x,headX,8,dt); H.rotation.z=damp(H.rotation.z,headZ,4,dt); }
  // 꼬리 · 귀
  if (R.tail){ const wag=(moving?10:hop>0?18:5)*(sad?.3:1), amp=sleep?.05:(hop>0?.7:.4)*(sad?.3:1);
    R.tail.rotation.y=Math.sin(t*wag)*amp; }
  R.ears.forEach((e,i)=>{ const s=i?-1:1; e.userData.r0=e.userData.r0??e.rotation.z; e.userData.x0=e.userData.x0??e.rotation.x;
    e.rotation.z=damp(e.rotation.z,e.userData.r0+(sad?.5*s:0)+(moving?Math.sin(ph*2)*.08:0),10,dt);
    e.rotation.x=damp(e.rotation.x,e.userData.x0+(sad||sleep?.5:0),10,dt); });
}
