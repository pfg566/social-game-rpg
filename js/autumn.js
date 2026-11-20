/* 가을 마을 · 테스트 맵 (게임과 따로 돌아가는 시험 페이지)
   풍경 연출 실험: 바람에 흔들리는 풀 · 단풍 나무 · 목조 집 · 역광 안개 · 빛줄기 · 블룸.
   학교 컴퓨터에서 얼마나 부드럽게 도는지 재 보려고 만들었어요. 1 / 2 / 3 키로 화질을 바꿔요. */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const lin=h=>new THREE.Color(h).convertSRGBToLinear();
const rnd=(a,b)=>a+Math.random()*(b-a);
let seed=7; const srand=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
const sr=(a,b)=>a+srand()*(b-a);

/* ---------- 렌더러 · 장면 ---------- */
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=.95;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,400);

/* 시간대 (T 키로 바꿔요) */
const MOODS={
  sunset:{name:'노을',sun:new THREE.Vector3(-.42,.2,-.88).normalize(),sunCol:'#ffb46e',sunI:2.6,hemiS:'#ffd8b0',hemiG:'#6b5638',hemiI:.6,
    fog:'#eab384',fogD:.0135,skyTop:'#7fa1cf',skyHor:'#ffc58e',grassBase:'#3b4f1a',grassTip:'#d9c25e',grassTip2:'#a9b544',exp:.95,rays:1},
  day:{name:'오후',sun:new THREE.Vector3(.45,.75,.35).normalize(),sunCol:'#fff0d8',sunI:3.0,hemiS:'#d8ecff',hemiG:'#5b6a3a',hemiI:.85,
    fog:'#cfdfe8',fogD:.009,skyTop:'#5f9bd9',skyHor:'#dcecf3',grassBase:'#38521c',grassTip:'#c8cf5c',grassTip2:'#8fb544',exp:.9,rays:0}
};
let MOOD='sunset';

const hemi=new THREE.HemisphereLight(0xffffff,0x444444,.8); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,2.5); scene.add(sun); scene.add(sun.target);
sun.castShadow=true; sun.shadow.bias=-.0004; sun.shadow.normalBias=.03;
const SC=sun.shadow.camera; SC.left=-34; SC.right=34; SC.top=34; SC.bottom=-34; SC.near=1; SC.far=160;
scene.fog=new THREE.FogExp2(0xf2c294,.02);

/* 하늘 */
const skyU={uFog:{value:new THREE.Color()},uTop:{value:new THREE.Color()},uHor:{value:new THREE.Color()},uSun:{value:new THREE.Vector3()},uSunCol:{value:new THREE.Color()}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(300,32,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:`varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader:`uniform vec3 uTop,uHor,uSun,uSunCol,uFog; varying vec3 vD;
    void main(){ float h=max(vD.y,0.); vec3 c=mix(uHor,uTop,pow(h,.55)); float s=max(dot(normalize(vD),uSun),0.);
      c+=uSunCol*(pow(s,600.)*6.+pow(s,24.)*.55+pow(s,4.)*.18); c=mix(uFog,c,smoothstep(-.02,.22,vD.y));
      gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
    }`}));
sky.renderOrder=-1; scene.add(sky);

/* ---------- 지도 배치 ---------- */
const PATH=[[-62,34],[-40,22],[-20,12],[-4,6],[10,0],[24,-10],[40,-26],[62,-40]].map(p=>new THREE.Vector2(p[0],p[1]));
const PATH_W=1.7;
const SIDE=[[3,5.6],[4,1],[5.2,-3.5],[6.2,-8.5],[6.6,-12.6]].map(p=>new THREE.Vector2(p[0],p[1]));   // 집으로 가는 돌길
function segDist(p,a,b){ const abx=b.x-a.x, aby=b.y-a.y, t=Math.max(0,Math.min(1,((p.x-a.x)*abx+(p.y-a.y)*aby)/(abx*abx+aby*aby))); return Math.hypot(p.x-(a.x+abx*t),p.y-(a.y+aby*t)); }
const pathCurve=new THREE.SplineCurve(PATH), pathPts=pathCurve.getPoints(160);
const sideCurve=new THREE.SplineCurve(SIDE), sidePts=sideCurve.getPoints(40);
function polyDist(pts,x,z){ const p=new THREE.Vector2(x,z); let d=1e9; for (let i=0;i<pts.length-1;i++) d=Math.min(d,segDist(p,pts[i],pts[i+1])); return d; }
const HOUSES=[{x:7,z:-20,r:0,w:10,d:7,h:4.6,roof:'#6d5a8e'},{x:-24,z:-8,r:.5,w:8,d:6.5,h:4.2,roof:'#8a4a3a'},{x:-8,z:27,r:Math.PI+.25,w:9,d:6.5,h:4.4,roof:'#5a6a8a'},{x:30,z:16,r:Math.PI-.4,w:8.5,d:6,h:4.2,roof:'#7a5a7a'}];
const TREES=[[-8,-6,1.15,'au'],[16,6,1.3,'au'],[-30,10,1.2,'au'],[22,-24,1.1,'yl'],[-14,-24,1.05,'au'],[-2,16,.95,'yl'],[34,-6,1.2,'au'],[-40,-16,1.25,'gr'],[12,24,1.1,'gr'],[-20,30,1.15,'au'],[44,8,1.0,'yl'],[-44,26,1.05,'au'],[0,-36,1.2,'au'],[26,-40,1.0,'gr']];
const BUSHES=[[-4,1,'rd'],[-6.5,-1.5,'au'],[12,4,'au'],[14.5,1.5,'rd'],[-1,-11,'gr'],[13,-12,'gr'],[-12,8,'au'],[18,-4,'rd'],[-17,2,'gr'],[3,10,'au'],[-26,16,'rd'],[26,-14,'au'],[30,0,'gr'],[-10,-14,'rd'],[8,14,'gr'],[-34,4,'au'],[20,12,'rd']];
const COLL=[];   // 부딪히는 곳 (원)
TREES.forEach(t=>COLL.push({x:t[0],z:t[1],r:.7*t[2]}));
function inHouse(x,z,pad){ for (const H of HOUSES){ const c=Math.cos(-H.r), s=Math.sin(-H.r), dx=x-H.x, dz=z-H.z, lx=dx*c-dz*s, lz=dx*s+dz*c; if (Math.abs(lx)<H.w/2+pad&&Math.abs(lz)<H.d/2+pad) return true; } return false; }

/* ---------- 바닥 (흙길을 그린 큰 텍스처) ---------- */
const MAP=140;
function groundTex(){
  const N=2048, cv=document.createElement('canvas'); cv.width=cv.height=N; const g=cv.getContext('2d');
  g.fillStyle='#55662a'; g.fillRect(0,0,N,N);
  for (let i=0;i<9000;i++){ const x=Math.random()*N, y=Math.random()*N, r=rnd(4,26); g.fillStyle=`rgba(${rnd(60,110)|0},${rnd(80,120)|0},${rnd(25,50)|0},.18)`; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); }
  const toPx=v=>(v/MAP+.5)*N;
  const stroke=(pts,w,col,blur)=>{ g.save(); g.filter=`blur(${blur}px)`; g.strokeStyle=col; g.lineWidth=w/MAP*N; g.lineCap='round'; g.lineJoin='round'; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(toPx(p.x),toPx(p.y)):g.moveTo(toPx(p.x),toPx(p.y))); g.stroke(); g.restore(); };
  stroke(pathPts,PATH_W*2+1.4,'#8a7a4e',10); stroke(pathPts,PATH_W*2,'#c9ad84',4);
  stroke(sidePts,2.4,'#8a7a4e',8); stroke(sidePts,1.7,'#b9a07a',3);
  for (let i=0;i<14000;i++){ const p=pathPts[(Math.random()*pathPts.length)|0]; const x=toPx(p.x+rnd(-PATH_W,PATH_W)), y=toPx(p.y+rnd(-PATH_W,PATH_W)); g.fillStyle=`rgba(${rnd(150,215)|0},${rnd(130,185)|0},${rnd(95,140)|0},.35)`; g.fillRect(x,y,rnd(1,4),rnd(1,4)); }
  HOUSES.forEach(H=>{ g.save(); g.translate(toPx(H.x),toPx(H.z)); g.rotate(H.r); g.filter='blur(6px)'; g.fillStyle='#4a4a2a'; const w=(H.w+1.2)/MAP*N, d=(H.d+1.2)/MAP*N; g.fillRect(-w/2,-d/2,w,d); g.restore(); });
  const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; return t;
}
const ground=new THREE.Mesh(new THREE.PlaneGeometry(MAP,MAP),new THREE.MeshStandardMaterial({map:groundTex(),roughness:1}));
ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
const far=new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.MeshStandardMaterial({color:0x55662a,roughness:1})); far.rotation.x=-Math.PI/2; far.position.y=-.02; scene.add(far);

/* ---------- 풀 (풀잎 수만 개를 한 번에 그리고, 셰이더로 바람 · 역광 · 안개를 처리) ---------- */
const grassU={uTime:{value:0},uPlayer:{value:new THREE.Vector3()},uBase:{value:new THREE.Color()},uTip:{value:new THREE.Color()},uTip2:{value:new THREE.Color()},
  uSunCol:{value:new THREE.Color()},uSun:{value:new THREE.Vector3()},uFog:{value:new THREE.Color()},uFogD:{value:.02},uAmb:{value:1}};
const GRASS_MAX=220000;
const grassGeo=new THREE.InstancedBufferGeometry();
{ const P=[-1,0,0, 1,0,0, -.8,.33,0, .8,.33,0, -.5,.66,0, .5,.66,0, 0,1,0];
  grassGeo.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); grassGeo.setIndex([0,1,2, 1,3,2, 2,3,4, 3,5,4, 4,5,6]); }
const gOff=new Float32Array(GRASS_MAX*3), gP=new Float32Array(GRASS_MAX*4), gSh=new Float32Array(GRASS_MAX);
const shadowSpots=[];   // 나무 · 집 그림자를 대충 계산해서 풀을 어둡게 (실제 그림자 대신 가벼운 방법)
function buildGrass(){
  shadowSpots.length=0; const sd=MOODS[MOOD].sun, hor=new THREE.Vector2(-sd.x,-sd.z).normalize(), k=1/Math.max(.25,sd.y);
  TREES.forEach(t=>{ const off=Math.min(14,5.5*t[2]*k*.35); shadowSpots.push({x:t[0]+hor.x*off,z:t[1]+hor.y*off,r:3.6*t[2]}); });
  BUSHES.forEach(b=>shadowSpots.push({x:b[0]+hor.x*.8,z:b[1]+hor.y*.8,r:1.4}));
  HOUSES.forEach(H=>{ const off=Math.min(10,3*k*.5); for (let i=-1;i<=1;i++) shadowSpots.push({x:H.x+hor.x*off+Math.cos(H.r)*i*H.w*.3,z:H.z+hor.y*off-Math.sin(H.r)*i*H.w*.3,r:H.d*.55}); });
  seed=11; let n=0;
  while (n<GRASS_MAX){
    const a=srand()*Math.PI*2, r=Math.sqrt(srand())*58, x=Math.cos(a)*r, z=Math.sin(a)*r;
    const dp=polyDist(pathPts,x,z), ds=polyDist(sidePts,x,z), edge=sr(-.35,.25);
    if (dp<PATH_W+edge||ds<.95+edge*.6||inHouse(x,z,.25)) continue;
    let near=false; for (const c of COLL) if (Math.hypot(x-c.x,z-c.z)<c.r*.8){ near=true; break; } if (near) continue;
    const clump=.5+.5*Math.sin(x*.21+Math.sin(z*.13)*2)*Math.cos(z*.17-x*.05);
    const nearPath=Math.min(1,Math.max(0,(dp-PATH_W)/2.5));
    const h=(.24+clump*.38+sr(0,.18))*(.55+.45*nearPath);
    let sh=1; for (const s of shadowSpots){ const d=Math.hypot(x-s.x,z-s.z); if (d<s.r) sh=Math.min(sh,.35+.65*Math.pow(d/s.r,2)); }
    gOff[n*3]=x; gOff[n*3+1]=0; gOff[n*3+2]=z;
    gP[n*4]=srand()*Math.PI*2; gP[n*4+1]=h; gP[n*4+2]=sr(.02,.036); gP[n*4+3]=srand(); gSh[n]=sh; n++;
  }
  grassGeo.setAttribute('aOff',new THREE.InstancedBufferAttribute(gOff,3)); grassGeo.setAttribute('aP',new THREE.InstancedBufferAttribute(gP,4)); grassGeo.setAttribute('aSh',new THREE.InstancedBufferAttribute(gSh,1));
}
const grassMat=new THREE.ShaderMaterial({uniforms:grassU,side:THREE.DoubleSide,
  vertexShader:`attribute vec3 aOff; attribute vec4 aP; attribute float aSh; uniform float uTime; uniform vec3 uPlayer;
    varying float vH,vV,vS; varying vec3 vW;
    void main(){ float h=position.y; float c=cos(aP.x), s=sin(aP.x);
      vec3 p=vec3(position.x*aP.z*c, h*aP.y, position.x*aP.z*s);
      p.xz+=vec2(-s,c)*h*h*aP.y*.28;
      float w=sin(uTime*1.5+aOff.x*.31+aOff.z*.23)*.6+sin(uTime*2.9+aOff.x*.83-aOff.z*.4)*.25+.35;
      p.xz+=vec2(.85,.45)*w*.32*aP.y*h*h;
      vec3 wp=aOff+p; vec2 d=wp.xz-uPlayer.xz; float dl=length(d)+1e-4; float push=smoothstep(1.2,.0,dl)*h;
      wp.xz+=d/dl*push*.55; wp.y-=push*.3*aP.y;
      vW=wp; vH=h; vV=aP.w; vS=aSh;
      gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.); }`,
  fragmentShader:`uniform vec3 uBase,uTip,uTip2,uSunCol,uSun,uFog; uniform float uFogD,uTime,uAmb; varying float vH,vV,vS; varying vec3 vW;
    void main(){ vec3 tip=mix(uTip,uTip2,vV); vec3 col=mix(uBase,tip,smoothstep(.0,1.,vH));
      float cloud=.86+.14*sin(vW.x*.06+uTime*.04)*sin(vW.z*.08-uTime*.03);
      col*=(.42+.68*vH)*mix(.5,1.,vS)*cloud*uAmb;
      vec3 V=normalize(vW-cameraPosition); float back=pow(max(dot(V,uSun),0.),5.)*vH*vS;
      col+=uSunCol*back*.75+uSunCol*.18*vH*vS*max(uSun.y,.2);
      float dist=length(vW-cameraPosition); float f=1.-exp(-uFogD*uFogD*dist*dist); col=mix(col,uFog,f);
      gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
    }`});
const grass=new THREE.Mesh(grassGeo,grassMat); grass.frustumCulled=false; scene.add(grass);

/* ---------- 단풍 나무 · 덤불 (잎 뭉치 카드 수천 장을 한 번에) ---------- */
function leafTex(){
  const N=256, cv=document.createElement('canvas'); cv.width=cv.height=N; const g=cv.getContext('2d');
  for (let i=0;i<85;i++){ const a=Math.random()*Math.PI*2, r=Math.sqrt(Math.random())*96, x=N/2+Math.cos(a)*r, y=N/2+Math.sin(a)*r, s=rnd(9,17), l=rnd(170,255)|0;
    g.save(); g.translate(x,y); g.rotate(rnd(0,7)); g.fillStyle=`rgb(${l},${l},${l})`;
    g.beginPath(); g.moveTo(0,-s); g.quadraticCurveTo(s*.85,-s*.2,0,s); g.quadraticCurveTo(-s*.85,-s*.2,0,-s); g.fill();
    g.strokeStyle=`rgba(0,0,0,.18)`; g.lineWidth=1.2; g.beginPath(); g.moveTo(0,-s*.8); g.lineTo(0,s*.9); g.stroke(); g.restore(); }
  const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; return t;
}
const LT=leafTex();
const PAL={au:['#e3542a','#f0782e','#f59a38','#d8402a','#f2b445','#c9341f'],rd:['#d6402c','#e4552f','#b8301f','#ef6b35'],yl:['#f2b13c','#f6c94e','#e8962f','#f5d66a'],gr:['#6c963a','#86ad48','#5a8534','#9bb950']};
const leafMat=new THREE.MeshStandardMaterial({map:LT,alphaTest:.5,side:THREE.DoubleSide,roughness:.85,emissive:0x2a1204});
leafMat.onBeforeCompile=sh=>{ sh.uniforms.uTime=grassU.uTime;
  sh.vertexShader='attribute vec3 aN;\nuniform float uTime;\n'+sh.vertexShader
    .replace('#include <defaultnormal_vertex>','#include <defaultnormal_vertex>\n transformedNormal=normalMatrix*normalize(aN);')
    .replace('#include <begin_vertex>','#include <begin_vertex>\n float ph=instanceMatrix[3].x*.45+instanceMatrix[3].z*.33; transformed+=vec3(sin(uTime*1.3+ph),sin(uTime*1.7+ph*1.3)*.5,cos(uTime*1.1+ph))*.07;');
};
const leafDepth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:LT,alphaTest:.5,side:THREE.DoubleSide});
const barkMat=new THREE.MeshStandardMaterial({color:0x6a4a33,roughness:.95});
const cards=[];   // {pos,rot,scale,color,normal}
function crown(cx,cy,cz,rx,ry,rz,n,pal,sMin,sMax){
  for (let i=0;i<n;i++){
    let x,y,z; do { x=sr(-1,1); y=sr(-1,1); z=sr(-1,1); } while (x*x+y*y+z*z>1);
    const L=Math.hypot(x,y,z)||1, k=Math.pow(L,.35)/L; x*=k; y*=k; z*=k;
    const col=lin(pal[(srand()*pal.length)|0]); const lift=.8+.35*(y+1)/2; col.multiplyScalar(lift*sr(.85,1.1));
    cards.push({p:new THREE.Vector3(cx+x*rx,cy+y*ry,cz+z*rz),r:new THREE.Euler(sr(0,6.3),sr(0,6.3),sr(0,6.3)),s:sr(sMin,sMax),c:col,n:new THREE.Vector3(x,y*.8+.25,z).normalize()});
  }
}
function tree(x,z,s,kind){
  const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
  const trunkH=4.2*s;
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22*s,.42*s,trunkH,9),barkMat); trunk.position.y=trunkH/2; trunk.castShadow=true; trunk.receiveShadow=true; g.add(trunk);
  const brs=[];
  for (let i=0;i<4;i++){ const a=i/4*Math.PI*2+sr(0,1), len=sr(2,3)*s, b=new THREE.Mesh(new THREE.CylinderGeometry(.08*s,.16*s,len,6),barkMat);
    const tilt=sr(.6,1); b.position.set(Math.cos(a)*Math.sin(tilt)*len/2,trunkH*sr(.65,.9)+Math.cos(tilt)*len/2,Math.sin(a)*Math.sin(tilt)*len/2);
    b.rotation.set(0,-a,0); b.rotateZ(-tilt); b.castShadow=true; g.add(b); brs.push(new THREE.Vector3(x+Math.cos(a)*Math.sin(tilt)*len,trunkH*.8+Math.cos(tilt)*len,z+Math.sin(a)*Math.sin(tilt)*len)); }
  const pal=PAL[kind];
  crown(x,trunkH+1.5*s,z,3.4*s,2.5*s,3.4*s,Math.round(240*s),pal,1.4*s,2.1*s);
  brs.forEach(b=>crown(b.x,b.y+.3,b.z,1.7*s,1.3*s,1.7*s,Math.round(40*s),pal,1.1*s,1.7*s));
}
function bush(x,z,kind){ const s=sr(.8,1.2); crown(x,.85*s,z,1.6*s,1.0*s,1.6*s,Math.round(110*s),PAL[kind],.8,1.2); COLL.push({x,z,r:1.1*s}); }
seed=3;
TREES.forEach(t=>tree(t[0],t[1],t[2],t[3]));
BUSHES.forEach(b=>bush(b[0],b[1],b[2]));
// 멀리 둘러싼 숲 (안개 속 실루엣)
for (let i=0;i<70;i++){ const a=i/70*Math.PI*2+sr(-.04,.04), r=sr(68,90), x=Math.cos(a)*r, z=Math.sin(a)*r, s=sr(1.3,2), pal=PAL[['au','yl','gr','au','rd'][(srand()*5)|0]];
  crown(x,5.5*s,z,4.2*s,4*s,4.2*s,70,pal,1.9*s,2.6*s); }
let leaves;
function buildLeaves(){
  const m=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),leafMat,cards.length);
  const aN=new Float32Array(cards.length*3), q=new THREE.Quaternion(), M=new THREE.Matrix4(), S=new THREE.Vector3();
  cards.forEach((c,i)=>{ q.setFromEuler(c.r); S.set(c.s,c.s,c.s); M.compose(c.p,q,S); m.setMatrixAt(i,M); m.setColorAt(i,c.c); aN[i*3]=c.n.x; aN[i*3+1]=c.n.y; aN[i*3+2]=c.n.z; });
  m.geometry.setAttribute('aN',new THREE.InstancedBufferAttribute(aN,3));
  m.castShadow=true; m.receiveShadow=true; m.customDepthMaterial=leafDepth; m.frustumCulled=false; scene.add(m); leaves=m;
}
buildLeaves();

/* ---------- 목조 집 ---------- */
function plasterTex(w,h){
  const N=512, cv=document.createElement('canvas'); cv.width=N; cv.height=Math.round(N*h/w); const g=cv.getContext('2d'), H=cv.height;
  g.fillStyle='#efe5d3'; g.fillRect(0,0,N,H);
  for (let i=0;i<900;i++){ g.fillStyle=`rgba(${rnd(150,200)|0},${rnd(130,170)|0},${rnd(100,140)|0},.06)`; g.beginPath(); g.arc(rnd(0,N),rnd(0,H),rnd(2,14),0,7); g.fill(); }
  const B=N/w*.22; g.fillStyle='#5a3b28';
  g.fillRect(0,0,N,B); g.fillRect(0,H-B,N,B); g.fillRect(0,H*.47,N,B*.9);
  const cols=Math.max(2,Math.round(w/1.6)); for (let i=0;i<=cols;i++) g.fillRect(i/cols*(N-B),0,B,H);
  g.lineWidth=B*.8; g.strokeStyle='#5a3b28';
  for (let i=0;i<cols;i++){ if (i%2) continue; const x0=i/cols*(N-B)+B, x1=(i+1)/cols*(N-B); g.beginPath(); g.moveTo(x0,H*.47+B); g.lineTo(x1,H-B); g.stroke(); }
  const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; return t;
}
function shingleTex(col){
  const cv=document.createElement('canvas'); cv.width=256; cv.height=256; const g=cv.getContext('2d'), c=new THREE.Color(col);
  for (let r=0;r<16;r++) for (let k=0;k<9;k++){ const v=rnd(.82,1.12); g.fillStyle=`rgb(${Math.min(255,c.r*255*v)|0},${Math.min(255,c.g*255*v)|0},${Math.min(255,c.b*255*v)|0})`; g.fillRect(k*32-(r%2)*16,r*16,30,15); }
  const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t;
}
const stoneMat=new THREE.MeshStandardMaterial({color:0x9a958c,roughness:1});
const woodMat=new THREE.MeshStandardMaterial({color:0x6b4a30,roughness:.9});
const frameMat=new THREE.MeshStandardMaterial({color:0x4a3022,roughness:.8});
const glowMat=new THREE.MeshStandardMaterial({color:0x8a5a2a,emissive:0xffa040,emissiveIntensity:.75,roughness:.4});
function house(H){
  const g=new THREE.Group(); g.position.set(H.x,0,H.z); g.rotation.y=H.r; scene.add(g);
  const add=(geo,mat,x,y,z)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; g.add(m); return m; };
  add(new THREE.BoxGeometry(H.w+.3,.6,H.d+.3),stoneMat,0,.3,0);
  const fm=new THREE.MeshStandardMaterial({map:plasterTex(H.w,H.h),roughness:.95}), sm=new THREE.MeshStandardMaterial({map:plasterTex(H.d,H.h),roughness:.95});
  add(new THREE.BoxGeometry(H.w,H.h,H.d),[sm,sm,fm,fm,fm,fm],0,.6+H.h/2,0);
  const pitch=.72, rise=H.d/2*Math.tan(pitch), slab=(H.d/2+.55)/Math.cos(pitch), top=.6+H.h;
  const rt=shingleTex(H.roof); rt.repeat.set(H.w/2.5,slab/2.5); const rm=new THREE.MeshStandardMaterial({map:rt,roughness:.85});
  for (const s of [-1,1]){ const r=add(new THREE.BoxGeometry(H.w+.9,.22,slab),rm,0,top+rise/2+.05,s*(H.d/4+.12)); r.rotation.x=s*pitch; }
  const tri=new THREE.Shape(); tri.moveTo(-H.d/2,0); tri.lineTo(H.d/2,0); tri.lineTo(0,rise); tri.lineTo(-H.d/2,0);
  const gm=new THREE.MeshStandardMaterial({color:0xe9dcc6,roughness:.95});
  for (const s of [-1,1]){ const m=add(new THREE.ExtrudeGeometry(tri,{depth:.1,bevelEnabled:false}),gm,s*(H.w/2-.05),top,0); m.rotation.y=Math.PI/2; }
  add(new THREE.BoxGeometry(1.1,2.4,1.1),stoneMat,H.w*.3,top+rise*.6+.9,-H.d*.18);
  // 창문 · 문 (앞면 +z)
  const winY=[.6+H.h*.3,.6+H.h*.75];
  const xs=[-H.w*.36,-H.w*.14,H.w*.14,H.w*.36];
  xs.forEach((x,i)=>winY.forEach((y,j)=>{ if (j===0&&(i===1||i===2)) return;
    add(new THREE.BoxGeometry(1.15,1.05,.12),frameMat,x,y,H.d/2+.04); add(new THREE.PlaneGeometry(.92,.82),glowMat,x,y,H.d/2+.11);
    add(new THREE.BoxGeometry(.08,.82,.04),frameMat,x,y,H.d/2+.13); add(new THREE.BoxGeometry(.92,.07,.04),frameMat,x,y,H.d/2+.13); }));
  add(new THREE.BoxGeometry(1.5,2.5,.14),frameMat,0,.6+1.25,H.d/2+.05);
  add(new THREE.BoxGeometry(1.2,2.25,.1),new THREE.MeshStandardMaterial({color:0x4f6b66,roughness:.7}),0,.6+1.15,H.d/2+.1);
  add(new THREE.SphereGeometry(.07,8,6),new THREE.MeshStandardMaterial({color:0xd8b25a,metalness:.6,roughness:.3}),.4,.6+1.1,H.d/2+.18);
  add(new THREE.BoxGeometry(2.2,.12,1.1),woodMat,0,.6+2.75,H.d/2+.5).rotation.x=-.35;
  add(new THREE.BoxGeometry(1.8,.3,1.0),stoneMat,0,.15,H.d/2+.6);
  // 옆 창문
  for (const s of [-1,1]){ add(new THREE.BoxGeometry(.12,1,1.1),frameMat,s*(H.w/2+.04),winY[1],0); add(new THREE.PlaneGeometry(.88,.8),glowMat,s*(H.w/2+.11),winY[1],0).rotation.y=s*Math.PI/2; }
}
HOUSES.forEach(house);

/* ---------- 울타리 · 돌기둥 문 · 디딤돌 · 꽃 · 돌 ---------- */
const fenceParts=[];
function fence(ax,az,bx,bz,gapA,gapB){
  const L=Math.hypot(bx-ax,bz-az), n=Math.floor(L/.32), ang=Math.atan2(bz-az,bx-ax);
  for (let i=0;i<=n;i++){ const t=i/n, d=t*L; if (gapA!=null&&d>gapA&&d<gapB) continue; const x=ax+(bx-ax)*t, z=az+(bz-az)*t;
    fenceParts.push({x,y:.5,z,sx:.1,sy:i%6===0?1.25:sr(.9,1.05),sz:.05,ry:-ang,post:i%6===0}); }
  const seg=(d0,d1)=>{ const L2=d1-d0; if (L2<=.1) return; const mx=ax+(bx-ax)*((d0+d1)/2/L), mz=az+(bz-az)*((d0+d1)/2/L); for (const y of [.35,.78]) fenceParts.push({x:mx,y,z:mz,sx:L2,sy:.07,sz:.06,ry:-ang,rail:true}); };
  if (gapA!=null){ seg(0,gapA); seg(gapB,L); } else seg(0,L);
  for (let t=0;t<=1;t+=.5/L) if (gapA==null||t*L<gapA||t*L>gapB) COLL.push({x:ax+(bx-ax)*t,z:az+(bz-az)*t,r:.25});
}
// 첫 번째 집 앞마당 울타리 (가운데 문)
fence(-2,-12.4,4.8,-12.4); fence(8.6,-12.4,17,-12.4); fence(-2,-12.4,-2,-26); fence(17,-12.4,17,-26);
fence(-35,-1,-14,-1,9.5,12.5); fence(-14,40,8,40);
fence(-6,10.5,-26,24,6,9);
{ const fp=fenceParts, m=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),woodMat,fp.length), M=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler();
  fp.forEach((f,i)=>{ e.set(0,f.ry,0); q.setFromEuler(e); const sy=f.rail?f.sy:f.sy; M.compose(new THREE.Vector3(f.x,f.rail?f.y:sy/2,f.z),q,new THREE.Vector3(f.sx,sy,f.sz)); m.setMatrixAt(i,M);
    m.setColorAt(i,lin(f.post?'#5e402a':f.rail?'#7a5638':['#8a6442','#7d5a3b','#93704c'][i%3])); });
  m.castShadow=true; m.receiveShadow=true; scene.add(m); }
// 돌기둥 문 (첫 번째 집)
const whiteStone=new THREE.MeshStandardMaterial({color:0xe6e1d6,roughness:.9});
for (const x of [5,8.4]){ const p=new THREE.Mesh(new THREE.BoxGeometry(.75,1.7,.75),whiteStone); p.position.set(x,.85,-12.4); p.castShadow=p.receiveShadow=true; scene.add(p);
  const cap=new THREE.Mesh(new THREE.BoxGeometry(.95,.18,.95),whiteStone); cap.position.set(x,1.78,-12.4); cap.castShadow=true; scene.add(cap);
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.26,14,10),whiteStone); ball.position.set(x,2.1,-12.4); ball.castShadow=true; scene.add(ball); COLL.push({x,z:-12.4,r:.55}); }
{ const gate=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.1,.08),woodMat); gate.position.set(5.75,.65,-11.8); gate.rotation.y=-1.1; gate.castShadow=true; scene.add(gate); }
// 디딤돌
{ const n=26, m=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0xd3cec4,roughness:1}),n*2), M=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(); let k=0;
  for (let i=0;i<n;i++){ const t=i/(n-1), p=sideCurve.getPoint(t); for (let j=0;j<2;j++){ if (j&&srand()<.4) continue; e.set(0,sr(0,3),0); q.setFromEuler(e);
    M.compose(new THREE.Vector3(p.x+sr(-.45,.45),.05,p.y+sr(-.3,.3)),q,new THREE.Vector3(sr(.55,.8),.12,sr(.4,.6))); m.setMatrixAt(k,M); m.setColorAt(k,lin(['#d6d1c6','#c8c2b6','#e0dbd0'][k%3])); k++; } }
  m.count=k; m.receiveShadow=true; m.castShadow=true; scene.add(m); }
// 꽃 (데이지 · 라벤더 · 노란 꽃)
function flowers(kind,n,areaFn){
  const geo=kind==='lav'?new THREE.ConeGeometry(.05,.42,5):new THREE.CylinderGeometry(.075,.075,.02,8);
  const m=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({roughness:.8,emissive:kind==='daisy'?0x222222:0x000000}),n), M=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(); let k=0, tries=0;
  while (k<n&&tries<n*40){ tries++; const p=areaFn(); if (!p) continue; const [x,z]=p;
    if (polyDist(pathPts,x,z)<PATH_W+.3||polyDist(sidePts,x,z)<1.1||inHouse(x,z,.4)) continue;
    const h=kind==='lav'?sr(.55,.85):kind==='daisy'?sr(.35,.6):sr(.4,.62);
    e.set(sr(-.25,.25),0,sr(-.25,.25)); q.setFromEuler(e); M.compose(new THREE.Vector3(x,h,z),q,new THREE.Vector3(1,1,1)); m.setMatrixAt(k,M);
    m.setColorAt(k,lin(kind==='lav'?['#8a6fd1','#9b7fe0','#7a5fc0'][k%3]:kind==='daisy'?'#ffffff':['#f5c934','#f8d64e','#eeb92a'][k%3])); k++; }
  m.count=k; m.castShadow=false; scene.add(m);
}
const clusterArea=(cs,spread)=>()=>{ const c=cs[(Math.random()*cs.length)|0]; const a=Math.random()*7, r=Math.sqrt(Math.random())*spread; return [c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r]; };
flowers('lav',900,clusterArea([[-9,2],[2,-10],[12,-10],[-18,-2],[18,8],[-4,12],[-28,12],[8,-14]],3.2));
flowers('daisy',1100,clusterArea([[0,9],[6,9],[-3,4],[10,-2],[-12,10],[14,-6],[-6,-10],[22,4],[-16,20]],4));
flowers('yel',1300,clusterArea([[-6,-4],[3,-11],[11,-15],[-1,-15],[16,-8],[-20,4],[-12,16],[6,16]],3.5));
// 돌
for (let i=0;i<18;i++){ const a=sr(0,7), r=sr(6,50), x=Math.cos(a)*r, z=Math.sin(a)*r; if (polyDist(pathPts,x,z)<PATH_W+.8||inHouse(x,z,1)) continue;
  const s=sr(.4,1.1), m=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),stoneMat); m.position.set(x,s*.35,z); m.scale.y=.6; m.rotation.set(sr(0,3),sr(0,3),0); m.castShadow=m.receiveShadow=true; scene.add(m); }

/* ---------- 떠다니는 먼지 · 꽃가루 (빛 받으면 반짝) ---------- */
const DUST=500, dustPos=new Float32Array(DUST*3); for (let i=0;i<DUST;i++){ dustPos[i*3]=rnd(-14,14); dustPos[i*3+1]=rnd(.3,6); dustPos[i*3+2]=rnd(-14,14); }
const dustGeo=new THREE.BufferGeometry(); dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dotTex=(()=>{ const cv=document.createElement('canvas'); cv.width=cv.height=64; const g=cv.getContext('2d'), gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(cv); })();
const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({size:.09,map:dotTex,color:0xffe2b0,transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending}));
scene.add(dust);

/* ---------- 후처리: 블룸 · 빛줄기 · 색 보정 ---------- */
const composer=new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene,camera));
const bloom=new THREE.UnrealBloomPass(new THREE.Vector2(512,512),.42,.7,.82); composer.addPass(bloom);
const RAYS={uniforms:{tDiffuse:{value:null},uSun:{value:new THREE.Vector2(.5,.5)},uStr:{value:1},uCol:{value:new THREE.Color()},uAsp:{value:1}},
  vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader:`uniform sampler2D tDiffuse; uniform vec2 uSun; uniform float uStr,uAsp; uniform vec3 uCol; varying vec2 vUv;
    void main(){ vec4 base=texture2D(tDiffuse,vUv); vec3 acc=vec3(0.);
      if (uStr>.001){ vec2 d=(vUv-uSun)*(.92/28.); vec2 uv=vUv; float il=1.;
        for (int i=0;i<28;i++){ uv-=d; vec3 s=texture2D(tDiffuse,uv).rgb; float b=max(0.,dot(s,vec3(.3,.5,.2))-.72); acc+=s*b*il; il*=.955; }
        acc*=uStr*.11; }
      vec3 c=base.rgb+acc*uCol;
      vec2 v=vUv-.5; v.x*=uAsp; c*=1.-dot(v,v)*.55;
      float l=dot(c,vec3(.3,.59,.11)); c=mix(vec3(l),c,1.08);
      gl_FragColor=vec4(c,base.a); }`};
const rays=new THREE.ShaderPass(RAYS); composer.addPass(rays);
composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));

/* ---------- 시간대 적용 ---------- */
function applyMood(){
  const M=MOODS[MOOD];
  sun.color.set(M.sunCol); sun.intensity=M.sunI; hemi.color.set(M.hemiS); hemi.groundColor.set(M.hemiG); hemi.intensity=M.hemiI;
  scene.fog.color.set(M.fog); scene.fog.density=M.fogD; renderer.toneMappingExposure=M.exp;
  skyU.uFog.value.copy(lin(M.fog)); skyU.uTop.value.copy(lin(M.skyTop)); skyU.uHor.value.copy(lin(M.skyHor)); skyU.uSun.value.copy(M.sun); skyU.uSunCol.value.copy(lin(M.sunCol));
  grassU.uBase.value.copy(lin(M.grassBase)); grassU.uTip.value.copy(lin(M.grassTip)); grassU.uTip2.value.copy(lin(M.grassTip2));
  grassU.uSunCol.value.copy(lin(M.sunCol)); grassU.uSun.value.copy(M.sun); grassU.uFog.value.copy(scene.fog.color).convertSRGBToLinear(); grassU.uFogD.value=M.fogD;
  RAYS.uniforms.uCol.value.copy(lin(M.sunCol)); document.body.style.background=M.fog;
  buildGrass(); setQuality(QUAL,true);
}

/* ---------- 화질 (1 낮음 · 2 보통 · 3 높음) ---------- */
const QS={1:{name:'낮음',grass:45000,shadow:0,pr:.75,rays:0,bloom:0,dust:0},2:{name:'보통',grass:110000,shadow:1024,pr:1,rays:1,bloom:1,dust:1},3:{name:'높음',grass:GRASS_MAX,shadow:2048,pr:Math.min(devicePixelRatio,1.5),rays:1,bloom:1,dust:1}};
let QUAL=2;
function setQuality(q,quiet){
  QUAL=q; const Q=QS[q];
  grassGeo.instanceCount=Q.grass;
  renderer.shadowMap.enabled=!!Q.shadow; if (Q.shadow&&sun.shadow.mapSize.x!==Q.shadow){ sun.shadow.mapSize.set(Q.shadow,Q.shadow); if (sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; } }
  scene.traverse(o=>{ if (o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true); } });
  renderer.setPixelRatio(Q.pr); resize(); bloom.enabled=!!Q.bloom; dust.visible=!!Q.dust;
  if (!quiet) toast(`화질: ${Q.name}`);
}
function resize(){ renderer.setSize(innerWidth,innerHeight); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(innerWidth,innerHeight); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); RAYS.uniforms.uAsp.value=camera.aspect; }
addEventListener('resize',resize);
let toastT=0, toastMsg=''; function toast(t){ toastMsg=t; toastT=performance.now()+1600; }

/* ---------- 캐릭터 · 조작 ---------- */
const P={x:3.5,z:9,yaw:Math.PI,vy:0,y:0};
let hero=null, mixer=null, act={}, cur='';
const holder=new THREE.Group(); scene.add(holder);
new THREE.GLTFLoader().load('models/knight.glb',g=>{
  hero=g.scene; hero.traverse(o=>{ if (o.isMesh){ o.castShadow=true; o.receiveShadow=true; } });
  const box=new THREE.Box3().setFromObject(hero), h=box.max.y-box.min.y; hero.scale.setScalar(1.75/h); holder.add(hero);
  mixer=new THREE.AnimationMixer(hero); g.animations.forEach(a=>act[a.name]=mixer.clipAction(a)); play('Idle');
},undefined,()=>{});
function play(n){ if (cur===n||!act[n]) return; const a=act[n]; a.reset().fadeIn(.2).play(); if (act[cur]) act[cur].fadeOut(.2); cur=n; }
const keys={};
addEventListener('keydown',e=>{ keys[e.code]=true;
  if (e.code==='Digit1') setQuality(1); if (e.code==='Digit2') setQuality(2); if (e.code==='Digit3') setQuality(3);
  if (e.code==='KeyT'){ MOOD=MOOD==='sunset'?'day':'sunset'; applyMood(); toast(`시간대: ${MOODS[MOOD].name}`); }
  if (e.code==='Space'&&P.y<=0) P.vy=6.2;
  if (e.code==='KeyP'){ composer.render(); const a=document.createElement('a'); a.href=renderer.domElement.toDataURL('image/png'); a.download='autumn.png'; a.click(); }
});
addEventListener('keyup',e=>keys[e.code]=false); addEventListener('blur',()=>{ for (const k in keys) keys[k]=false; });
let camYaw=Math.PI, camPitch=.2, camDist=6.5, drag=null;
renderer.domElement.addEventListener('pointerdown',e=>{ drag={x:e.clientX,y:e.clientY}; renderer.domElement.setPointerCapture(e.pointerId); });
addEventListener('pointerup',()=>drag=null);
addEventListener('pointermove',e=>{ if (!drag) return; camYaw-=(e.clientX-drag.x)*.006; camPitch=Math.max(.02,Math.min(.9,camPitch+(e.clientY-drag.y)*.004)); drag={x:e.clientX,y:e.clientY}; });
addEventListener('wheel',e=>{ camDist=Math.max(3,Math.min(14,camDist+Math.sign(e.deltaY)*.7)); },{passive:true});

/* ---------- 매 프레임 ---------- */
const clock=new THREE.Clock(); let fpsN=0, fpsT=0, fps=0, lowT=0;
const tmpV=new THREE.Vector3();
function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta(),.05), t=clock.elapsedTime;
  grassU.uTime.value=t;
  // 이동 (카메라 기준)
  let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0), iz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
  const moving=ix||iz;
  if (moving){ const L=Math.hypot(ix,iz); ix/=L; iz/=L; const c=Math.cos(camYaw), s=Math.sin(camYaw), dx=ix*c+iz*s, dz=-ix*s+iz*c, sp=keys.ShiftLeft||keys.ShiftRight?7.5:4.2;
    P.x+=dx*sp*dt; P.z+=dz*sp*dt; const ty=Math.atan2(dx,dz); let d=ty-P.yaw; d=Math.atan2(Math.sin(d),Math.cos(d)); P.yaw+=d*Math.min(1,dt*12); }
  for (const c of COLL){ const dx=P.x-c.x, dz=P.z-c.z, d=Math.hypot(dx,dz), r=c.r+.35; if (d<r&&d>1e-4){ P.x=c.x+dx/d*r; P.z=c.z+dz/d*r; } }
  for (const H of HOUSES){ const c=Math.cos(-H.r), s=Math.sin(-H.r); let lx=(P.x-H.x)*c-(P.z-H.z)*s, lz=(P.x-H.x)*s+(P.z-H.z)*c; const hw=H.w/2+.5, hd=H.d/2+.5;
    if (Math.abs(lx)<hw&&Math.abs(lz)<hd){ if (hw-Math.abs(lx)<hd-Math.abs(lz)) lx=Math.sign(lx)*hw; else lz=Math.sign(lz)*hd; P.x=H.x+lx*Math.cos(H.r)+lz*Math.sin(H.r); P.z=H.z-lx*Math.sin(H.r)+lz*Math.cos(H.r); } }
  const R=Math.hypot(P.x,P.z); if (R>62){ P.x*=62/R; P.z*=62/R; }
  P.vy-=18*dt; P.y=Math.max(0,P.y+P.vy*dt); if (P.y===0) P.vy=Math.max(0,P.vy);
  holder.position.set(P.x,P.y,P.z); holder.rotation.y=P.yaw;
  if (mixer){ play(moving?'Running_A':'Idle'); if (act.Running_A) act.Running_A.timeScale=keys.ShiftLeft||keys.ShiftRight?1.25:.85; mixer.update(dt); }
  grassU.uPlayer.value.set(P.x,0,P.z);
  // 카메라
  const tx=P.x, ty=1.35+P.y*.5, tz=P.z;
  tmpV.set(tx+Math.sin(camYaw)*Math.cos(camPitch)*camDist, ty+Math.sin(camPitch)*camDist+.4, tz+Math.cos(camYaw)*Math.cos(camPitch)*camDist);
  camera.position.lerp(tmpV,Math.min(1,dt*8)); camera.lookAt(tx,ty,tz);
  sky.position.copy(camera.position);
  // 그림자 카메라는 캐릭터를 따라가요
  const sd=MOODS[MOOD].sun; sun.position.set(P.x+sd.x*70,sd.y*70,P.z+sd.z*70); sun.target.position.set(P.x,0,P.z);
  // 먼지는 캐릭터 주변에서 천천히 떠다녀요
  if (dust.visible){ const a=dustGeo.attributes.position.array; for (let i=0;i<DUST;i++){ a[i*3]+=Math.sin(t*.3+i)*.004; a[i*3+1]+=Math.sin(t*.5+i*1.7)*.003+.002; a[i*3+2]+=Math.cos(t*.27+i)*.004;
      if (a[i*3+1]>6.5) a[i*3+1]=.3; if (Math.abs(a[i*3]-P.x)>14) a[i*3]=P.x+rnd(-12,12); if (Math.abs(a[i*3+2]-P.z)>14) a[i*3+2]=P.z+rnd(-12,12); } dustGeo.attributes.position.needsUpdate=true; }
  // 빛줄기: 해가 화면 안이나 가까이 있을 때만
  const sp3=tmpV.copy(camera.position).addScaledVector(sd,200).project(camera), front=camera.getWorldDirection(new THREE.Vector3()).dot(sd);
  RAYS.uniforms.uSun.value.set((sp3.x+1)/2,(sp3.y+1)/2);
  const on=QS[QUAL].rays&&MOODS[MOOD].rays?Math.max(0,Math.min(1,(front-.1)*2.2)):0; RAYS.uniforms.uStr.value=on;
  composer.render();
  // fps · 안내
  fpsN++; fpsT+=dt; if (fpsT>=.5){ fps=Math.round(fpsN/fpsT); fpsN=0; fpsT=0;
    if (fps<28&&QUAL>1){ lowT+=.5; if (lowT>=3){ setQuality(QUAL-1); toast(`느려서 화질을 ${QS[QUAL].name}(으)로 낮췄어요`); lowT=0; } } else lowT=0; }
  $('#hud').textContent=`가을 마을 테스트 맵 · ${MOODS[MOOD].name} · 화질 ${QS[QUAL].name} · ${fps} fps · 풀잎 ${(QS[QUAL].grass/10000).toFixed(0)}만 개\n`+
    `WASD 걷기 · Shift 달리기 · Space 점프 · 마우스 드래그 시점 · 휠 거리 · 1/2/3 화질 · T 시간대 · P 사진`+(performance.now()<toastT?`\n▶ ${toastMsg}`:'');
}
applyMood(); setQuality(2,true); resize();
setTimeout(()=>$('#load').classList.add('off'),400);
frame();
window.AUT={P,setQuality,applyMood,camera,get cam(){ return {camYaw,camPitch,camDist}; },setCam(y,p,d){ camYaw=y; camPitch=p; camDist=d; },MOODS,setMood(m){ MOOD=m; applyMood(); }};
})();
