/* 사회 게임 RPG · 🏝️ 서비스업 섬 리메이크 (택배 · 도둑 해골 · 공정 여행 관광객)
   들판 마을(04f) · 마을(04v · 04w)의 그래픽 도구로 지어요.
   북 = 물류 센터(창고 · 컨베이어 · 컨테이너 · 트럭) · 화물 부두와 화물선 · 여객선 부두 / 북동 = 등대 곶 / 북서 = 고깃배 포구
   가운데 = 분수 광장과 서비스업 가게 6곳(카페 · 민박 · 전통 시장 · 병원 · 체험 공방 · 편의점) / 서 = 바위 해안 / 남 · 동 = 모래사장 · 야자수
   놀이: 온라인 주문 알림 · ⚡ 빠른 배송 상자 · 🧳 공정 여행 관광객 안내 (여객선 → 퀴즈 → 마을 가게로)
   파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */

/* ---------- 다른 파일이 함께 쓰는 값 ---------- */
const ISL_R=30, ISL_DOCK={x:.8,z:-21.2}, ISL_PLAZA={x:0,z:1,r:5};
const ISL_SEGS=[], ISL_HOUSES=[], ISL_STATIONS=[[-10.5,-7],[10.5,-7],[0,12.5]];
let parcels=[], islBeam=null, islArrow=null, islBeam2=null, islArrow2=null;
const PARCEL_COL=0xe0a040, TOUR_COL=0x22c4b0, EXP_TIME=24;

/* ---------- 지도 ---------- */
const IS={built:false,secs:{},halos:[],smoke:[],ao:[],boats:[],tags:[],moodK:'day'};
const IS_MAP=112, IS_MS=1024;
// 해안선: 15°마다 반지름 (동 → 남 → 서 → 북). 북 = 항구, 북동 = 등대 곶, 북서 = 포구, 서 = 바위 해안, 남 = 넓은 모래사장
const IS_CR=[31,32.5,31.5,29.5,30.5,32,33,32,30,28.5,29.5,30.5,31,30,28,26.5,29,28.5,27.5,28,30,35,33.5,31];
const IS_PIER={x:-3,z0:-25.4,z1:-41,hw:1.8}, IS_FPIER={x:14.4,z0:-24.6,z1:-38,hw:1.2}, IS_WAIT={x:14.4,z:-23.6};
const IS_FERRY={x:18.6,z:-33.2}, IS_LH={x:23.2,z:-23.2}, IS_SHIP={x:-9.6,z:-34.5};
const IS_WARE={x:-9,z:-19.5,w:10,d:7};
const ISL_SHOPS=[
  {k:'cafe',  name:'바다 카페',icon:'☕',hex:'#2f86c8',x:-22,  z:-6.5,item:'원두 상자를',kind:'house',roof:'#3a7ab8',shut:'#f0e8d8',w:8.5,d:6},
  {k:'inn',   name:'해변 민박',icon:'🏠',hex:'#e07a3a',x:-20.5,z:10,  item:'새 이불을',  kind:'house',roof:'#c0703c',shut:'#3f6b4a',w:9,d:6.5,tour:true},
  {k:'market',name:'전통 시장',icon:'🧺',hex:'#c99a2a',x:-9,   z:21.5,item:'포장 상자를',kind:'market',tour:true},
  {k:'clinic',name:'섬 병원',  icon:'🏥',hex:'#d84a4a',x:9,    z:21.5,item:'의약품을',   kind:'clinic'},
  {k:'craft', name:'체험 공방',icon:'🎨',hex:'#8a5ac8',x:20.5, z:10,  item:'도자기 흙을',kind:'house',roof:'#7a4a3a',shut:'#3f5f8a',w:8,d:6,tour:true},
  {k:'mart',  name:'편의점',   icon:'🏪',hex:'#2fa36a',x:22,   z:-6.5,item:'과자 상자를',kind:'mart'}];

/* ---------- 해안선 · 높이 ---------- */
function islCoastR(a){ const t=((a/(Math.PI*2))%1+1)%1*24, i=Math.floor(t), f=t-i;
  const p0=IS_CR[(i+23)%24], p1=IS_CR[i%24], p2=IS_CR[(i+1)%24], p3=IS_CR[(i+2)%24];
  return .5*(2*p1+(-p0+p2)*f+(2*p0-5*p1+4*p2-p3)*f*f+(-p0+3*p1-3*p2+p3)*f*f*f)+Math.sin(a*5+.7)*.35+Math.sin(a*11+2.1)*.22; }
function islS(x,z){ return Math.hypot(x,z)-islCoastR(Math.atan2(z,x)); }     // 0보다 크면 바다 쪽
function islIn(x,z,m){ return islS(x,z)<-(m||0); }
function islandOK(x,z,m){ return islIn(x,z,m); }
function islClamp(p,m){ m=m==null?1:m; const r=Math.hypot(p.x,p.z)||1e-6, R=islCoastR(Math.atan2(p.z,p.x))-m; if (r>R){ p.x*=R/r; p.z*=R/r; } }
function islCliff(x,z){ const a=Math.atan2(z,x)*180/Math.PI, d=a<0?a+360:a; return Math.max(0,Math.min(1,(d-148)/10))*Math.max(0,Math.min(1,(214-d)/10)); }   // 서쪽 바위 해안
function islH(x,z){ const s=islS(x,z), c=islCliff(x,z), a=-2.2+1.6*c, b=5.5-3.9*c; if (s<=a) return 0; const t=Math.min(1,(s-a)/(b-a)); return -1.9*t*t*(3-2*t); }

/* ---------- 작은 도구 ---------- */
function islSignTex(icon,name,hex){ return vlTex(vlCanvas(512,160,g=>{ g.fillStyle='#5a3d24'; roundRect(g,0,0,512,160,24); g.fill(); g.fillStyle=hex; roundRect(g,10,10,492,140,18); g.fill();
  g.fillStyle='rgba(255,255,255,.18)'; roundRect(g,10,10,492,54,18); g.fill(); g.fillStyle='#fffaf0'; g.font='bold 76px Jua, "Malgun Gothic", sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(`${icon} ${name}`,256,86); })); }
function islBoard(par,icon,name,hex,x,y,z,ry,w){ w=w||2.6; const m=new THREE.Mesh(new THREE.BoxGeometry(w,w*.31,.08),[vlMats().wood,vlMats().wood,vlMats().wood,vlMats().wood,new THREE.MeshStandardMaterial({map:islSignTex(icon,name,hex),roughness:.7}),vlMats().wood]);
  m.position.set(x,y,z); m.rotation.y=ry||0; m.castShadow=true; m.userData.keep=true; par.add(m); return m; }
function islCorrTex(base){ return vlTexRep(vlCanvas(256,256,g=>{ g.fillStyle=base; g.fillRect(0,0,256,256);
  for (let x=0;x<256;x+=16){ const gr=g.createLinearGradient(x,0,x+16,0); gr.addColorStop(0,'rgba(0,0,0,.22)'); gr.addColorStop(.45,'rgba(255,255,255,.16)'); gr.addColorStop(1,'rgba(0,0,0,.22)'); g.fillStyle=gr; g.fillRect(x,0,16,256); }
  for (let i=0;i<500;i++){ g.fillStyle=Math.random()<.5?'rgba(0,0,0,.06)':'rgba(255,255,255,.05)'; g.fillRect(Math.random()*256,Math.random()*256,2,2); } })); }
let IS_MATS=null;
function islMats(){ if (IS_MATS) return IS_MATS; const std=o=>{ if (o.color!=null) o.color=new THREE.Color(o.color).convertSRGBToLinear(); return new THREE.MeshStandardMaterial(Object.assign({roughness:.85,metalness:0},o)); };
  const white=std({color:0xf2efe8,roughness:.8});
  return IS_MATS={white,red:std({color:0xc8382e,roughness:.7}),navy:std({color:0x24406e,roughness:.7}),glass:std({color:0x9fd4ea,roughness:.1,metalness:.3,emissive:0x2a5a70,emissiveIntensity:.25}),
    rock:std({color:0x8a8478,roughness:1,flatShading:true}),rockD:std({color:0x6a655c,roughness:1,flatShading:true}),
    ware:std({map:islCorrTex('#b8c4cc'),roughness:.6,metalness:.25}),wareRoof:std({map:islCorrTex('#5f7f9a'),roughness:.55,metalness:.3}),
    cont:['#c8442e','#2f6fb0','#2f9a5a','#e0902a','#7a4ab0'].map(c=>std({map:islCorrTex(c),roughness:.6,metalness:.2})),
    belt:std({color:0x26282c,roughness:.8}),steel:std({color:0x9aa2aa,roughness:.4,metalness:.6}),yellow:std({color:0xf0c02a,roughness:.6}),
    hull:std({color:0x2f5f9a,roughness:.6}),hull2:std({color:0xb8402e,roughness:.6}),deck:std({color:0xb08a5c,roughness:.8}),
    palmT:std({color:0x8a6a48,roughness:.95}),coco:std({color:0x5a3a1e,roughness:.8}),
    stripe:['#e8483a','#2f86c8','#f0b02a','#2fa36a'].map(c=>{ const t=vlTex(vlCanvas(128,32,g=>{ for (let i=0;i<8;i++){ g.fillStyle=i%2?'#fff8ec':c; g.fillRect(i*16,0,16,32); } })); return std({map:t,roughness:.8,side:THREE.DoubleSide}); }),
    water:new THREE.MeshStandardMaterial({color:new THREE.Color(0x3aa8d0).convertSRGBToLinear(),roughness:.08,metalness:.2,emissive:new THREE.Color(0x0a3a50),emissiveIntensity:.4,transparent:true,opacity:.85})}; }

/* ---------- 땅: 풀밭 · 길 · 모래 (들판 마을 땅 셰이더를 섬에 맞춰 썼어요) ---------- */
function islGround(R){
  const S=IS_MS, mp=v=>(v/IS_MAP+.5)*S, k=S/IS_MAP;
  const line=(g,pts,wd,bl,a)=>{ g.save(); g.filter=`blur(${bl}px)`; g.globalAlpha=a==null?1:a; g.lineWidth=wd*k; g.lineCap='round'; g.lineJoin='round'; g.beginPath(); pts.forEach(([x,z],i)=>i?g.lineTo(mp(x),mp(z)):g.moveTo(mp(x),mp(z))); g.stroke(); g.restore(); };
  const disc=(g,x,z,r,a,bl)=>{ g.save(); g.filter=`blur(${bl==null?4:bl}px)`; g.globalAlpha=a; g.beginPath(); g.arc(mp(x),mp(z),r*k,0,7); g.fill(); g.restore(); };
  const rect=(g,x0,z0,x1,z1,a,bl)=>{ g.save(); g.filter=`blur(${bl==null?3:bl}px)`; g.globalAlpha=a; g.fillRect(mp(x0),mp(z0),(x1-x0)*k,(z1-z0)*k); g.restore(); };
  IS.paths=[[[0,-3.6],[.4,-10],[.8,-17.6]],[[3.4,-22.6],[9,-23.6],[13.4,-23.8]],[[15.6,-23.4],[19.4,-22.6],[21.6,-22]]];
  ISL_SHOPS.forEach(h=>{ const d=Math.hypot(h.x-ISL_PLAZA.x,h.z-ISL_PLAZA.z), ux=(ISL_PLAZA.x-h.x)/d, uz=(ISL_PLAZA.z-h.z)/d; h.mx=h.x+ux*4.6; h.mz=h.z+uz*4.6;
    IS.paths.push([[ISL_PLAZA.x-ux*(ISL_PLAZA.r-.4),ISL_PLAZA.z-uz*(ISL_PLAZA.r-.4)],[h.mx+ux*.3,h.mz+uz*.3]]); });
  const cR=vlCanvas(S,S,g=>{ g.fillStyle='#000'; g.fillRect(0,0,S,S); g.strokeStyle=g.fillStyle='#fff';
    IS.paths.forEach((p,i)=>{ const w=i===0?3.4:2.6; line(g,p,w+1.3,7,.42); line(g,p,w-.2,2.5,1); });
    disc(g,ISL_PLAZA.x,ISL_PLAZA.z,ISL_PLAZA.r+1.2,.8,6); ISL_STATIONS.forEach(([x,z])=>disc(g,x,z,3.5,.7,5));
    rect(g,-15.5,-26,17,-14.6,.92,6); ISL_SHOPS.forEach(h=>disc(g,h.mx,h.mz,2.2,.7,5)); disc(g,IS_LH.x,IS_LH.z,3,.6,6); disc(g,IS_WAIT.x,IS_WAIT.z,2.4,.8,4); });
  const cG=vlCanvas(S,S,g=>{ g.fillStyle='#fff'; g.fillRect(0,0,S,S); });
  // 모래: 해안선에서 몇 걸음 안쪽까지 (바위 해안은 좁게)
  const sb=vlCanvas(256,256,g=>{ const id=g.createImageData(256,256);
    for (let py=0;py<256;py++) for (let px=0;px<256;px++){ const x=(px+.5)/256*IS_MAP-IS_MAP/2, z=(py+.5)/256*IS_MAP-IS_MAP/2, s=islS(x,z), c=islCliff(x,z);
      const sand=Math.max(0,Math.min(1,(s+7.2)/3.4))*(1-c)+Math.max(0,Math.min(1,(s+1.8)/1.4))*c*.55, harbor=x>-16&&x<18&&z<-14&&z>-30?.35:1, i=(py*256+px)*4;
      id.data[i]=id.data[i+1]=id.data[i+2]=255*Math.min(1,sand*harbor+(s>0?1:0)); id.data[i+3]=255; }
    g.putImageData(id,0,0); });
  const cB=vlCanvas(S,S,g=>{ g.imageSmoothingEnabled=true; g.filter='blur(3px)'; g.drawImage(sb,0,0,S,S); });
  IS.gcv={R:cR,G:cG,B:cB,S,mp,k};
  const macro=vlCanvas(512,512,g=>{ g.fillStyle='rgb(128,128,128)'; g.fillRect(0,0,512,512);
    for (let i=0;i<300;i++){ const x=Math.random()*512, y=Math.random()*512, r=10+Math.random()*48, q=Math.random(), c=q<.3?'150,146,92':q<.58?'100,130,96':q<.78?'140,124,92':'118,130,104';
      vlWrapDraw(512,x,y,r,(X,Y)=>{ const gr=g.createRadialGradient(X,Y,0,X,Y,r); gr.addColorStop(0,`rgba(${c},.34)`); gr.addColorStop(1,`rgba(${c},0)`); g.fillStyle=gr; g.fillRect(X-r,Y-r,2*r,2*r); }); } });
  const macroT=vlTexRep(macro,true); macroT.encoding=THREE.LinearEncoding;
  const maskT=new THREE.CanvasTexture(vlCanvas(4,4,()=>{})); IS.mask=maskT;
  const grassT=vlGrassDetail(), dirtT=vlDirtDetail(), noiseT=vlNoiseTex(), MS=IS_MAP.toFixed(1);
  const GU=IS.GU={uGSat:{value:1.18},uGMul:{value:new THREE.Color(.72,.92,.6)},uDSat:{value:.95},uDMul:{value:new THREE.Color(1.02,.94,.82)},uEdge:{value:.3}};
  const mat=new THREE.MeshStandardMaterial({roughness:1,metalness:0});
  mat.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,{tMask:{value:maskT},tNoise:{value:noiseT},tGrassD:{value:grassT},tDirtD:{value:dirtT},tMacro:{value:macroT}},GU);
    sh.vertexShader='varying vec3 vGW;\n'+sh.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n vGW=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader='varying vec3 vGW; uniform sampler2D tMask,tNoise,tGrassD,tDirtD,tMacro; uniform float uGSat,uDSat,uEdge; uniform vec3 uGMul,uDMul;\nvec3 isSL(vec3 c){ return pow(c,vec3(2.2)); }\nvec3 isSat(vec3 c,float s){ return max(mix(vec3(dot(c,vec3(.2126,.7152,.0722))),c,s),0.); }\n'+sh.fragmentShader.replace('#include <map_fragment>',`
      vec2 gw=vGW.xz; vec2 muv=vec2(gw.x/${MS}+.5,.5-gw.y/${MS}); vec4 mk=texture2D(tMask,clamp(muv,.001,.999));
      float outside=step(.5,max(abs(muv.x-.5),abs(muv.y-.5))); mk=mix(mk,vec4(0.,1.,1.,1.),outside);
      vec2 tu=gw/3.;
      float n1=texture2D(tNoise,tu*.21).r, n2=texture2D(tNoise,tu*1.63).r, n3=texture2D(tNoise,tu*.07).r;
      vec3 macro=texture2D(tMacro,gw/${MS}+.5).rgb*2.;
      vec3 gC=isSat(isSL(texture2D(tGrassD,tu).rgb)*macro,uGSat)*uGMul;
      float sand=smoothstep(.35,.65,mk.b+(n1-.5)*.35+(n2-.5)*.12);
      float rip=.5+.5*sin(gw.x*2.1+gw.y*1.3+n1*6.);
      vec3 sC=mix(vec3(.44,.33,.19),vec3(.6,.48,.31),n2*.7+rip*.3)*mix(.92,1.06,n3);
      sC=mix(sC,sC*vec3(.66,.62,.56),1.-smoothstep(-.32,-.08,vGW.y));
      float edge=smoothstep(.15,.55,mk.b)*(1.-sand); gC=mix(gC,gC*vec3(1.02,.92,.7),edge*.6);
      vec3 col=mix(gC,sC,sand);
      float path=smoothstep(.40,.60,mk.r+(n1-.5)*.4+(n2-.5)*.16);
      vec3 pC=isSat(isSL(texture2D(tDirtD,tu*1.37+.31).rgb)*mix(vec3(1.),macro,.3),uDSat)*uDMul;
      col=mix(col,pC,path);
      col=mix(col,col*vec3(.52,.74,.78),1.-smoothstep(-1.5,-.4,vGW.y));
      col*=mix(.45,1.,mk.g);
      diffuseColor.rgb*=col;`); };
  mat.customProgramCacheKey=()=>'isground';
  const g1=new THREE.PlaneGeometry(IS_MAP,IS_MAP,224,224); g1.rotateX(-Math.PI/2);
  { const p=g1.attributes.position; for (let i=0;i<p.count;i++) p.setY(i,islH(p.getX(i),p.getZ(i))); g1.computeVertexNormals(); }
  const inner=new THREE.Mesh(g1,mat); inner.receiveShadow=true; R.add(inner);
  const fs=new THREE.Shape(); fs.moveTo(-340,-340); fs.lineTo(340,-340); fs.lineTo(340,340); fs.lineTo(-340,340); fs.lineTo(-340,-340);
  { const h=IS_MAP/2-.02, hp=new THREE.Path(); hp.moveTo(-h,-h); hp.lineTo(-h,h); hp.lineTo(h,h); hp.lineTo(h,-h); hp.lineTo(-h,-h); fs.holes.push(hp); }
  const og=new THREE.ShapeGeometry(fs); og.rotateX(-Math.PI/2); const outer=new THREE.Mesh(og,mat); outer.position.y=-1.9; R.add(outer);
}
function islGroundFinish(ao){
  const C=IS.gcv; if (!C) return; const S=C.S, mp=C.mp, k=C.k, g=C.G.getContext('2d');
  const blob=(x,z,r,a)=>{ const R2=r*k, gr=g.createRadialGradient(mp(x),mp(z),0,mp(x),mp(z),R2); gr.addColorStop(0,`rgba(0,0,0,${a})`); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(mp(x)-R2,mp(z)-R2,R2*2,R2*2); };
  const box=(x,z,w,d,r,a)=>{ g.save(); g.translate(mp(x),mp(z)); g.rotate(-r); g.filter='blur(7px)'; g.fillStyle=`rgba(0,0,0,${a})`; g.fillRect(-w/2*k,-d/2*k,w*k,d*k); g.restore(); };
  ao.forEach(a=>a.w?box(a.x,a.z,a.w,a.d,a.r||0,a.k):blob(a.x,a.z,a.r,a.k));
  const out=vlCanvas(S,S,gg=>{ const a=C.R.getContext('2d').getImageData(0,0,S,S).data, b=C.G.getContext('2d').getImageData(0,0,S,S).data, c=C.B.getContext('2d').getImageData(0,0,S,S).data, id=gg.createImageData(S,S);
    for (let i=0;i<a.length;i+=4){ id.data[i]=a[i]; id.data[i+1]=b[i]; id.data[i+2]=c[i]; id.data[i+3]=255; } gg.putImageData(id,0,0); });
  IS.mask.image=out; IS.mask.needsUpdate=true; IS.maskData=out.getContext('2d').getImageData(0,0,S,S).data; IS.gcv=null; }
function islMaskAt(x,z,ch){ const D=IS.maskData; if (!D) return 0; const S=IS_MS, px=Math.max(0,Math.min(S-1,((x/IS_MAP+.5)*S)|0)), pz=Math.max(0,Math.min(S-1,((z/IS_MAP+.5)*S)|0)); return D[(pz*S+px)*4+ch]/255; }

/* ---------- 바다: 얕은 바다 · 반짝이는 물결 · 해안 파도 거품 ---------- */
function islSea(R){
  const S=512, W=160, mp=v=>(v/W+.5)*S;
  const poly=vlCanvas(S,S,g=>{ g.fillStyle='#000'; g.fillRect(0,0,S,S); g.fillStyle='#fff'; g.beginPath(); for (let i=0;i<=360;i++){ const a=i/360*Math.PI*2-Math.PI, r=islCoastR(a); const x=Math.cos(a)*r, z=Math.sin(a)*r; i?g.lineTo(mp(x),mp(z)):g.moveTo(mp(x),mp(z)); } g.closePath(); g.fill();
    g.fillRect(mp(IS_PIER.x-IS_PIER.hw*.6),mp(IS_PIER.z1),IS_PIER.hw*1.2/W*S,(IS_PIER.z0-IS_PIER.z1)/W*S); });
  const ch=bl=>vlCanvas(S,S,g=>{ g.filter=`blur(${bl}px)`; g.drawImage(poly,0,0); });
  const a=ch(9).getContext('2d').getImageData(0,0,S,S).data, b=ch(34).getContext('2d').getImageData(0,0,S,S).data;
  const cv=vlCanvas(S,S,g=>{ const id=g.createImageData(S,S); for (let i=0;i<a.length;i+=4){ id.data[i]=a[i]; id.data[i+1]=b[i]; id.data[i+3]=255; } g.putImageData(id,0,0); });
  const ct=new THREE.CanvasTexture(cv); ct.minFilter=THREE.LinearFilter; ct.generateMipmaps=false;
  const U=IS.WU={uCoast:{value:ct},uTime:{value:0},uDeep:{value:new THREE.Color(.02,.16,.32)},uShal:{value:new THREE.Color(.1,.56,.62)},uSun:{value:new THREE.Vector3(.5,.62,.3).normalize()},uSunCol:{value:new THREE.Color(1,.95,.85)},
    uTop:{value:new THREE.Color()},uHor:{value:new THREE.Color()},uFog:{value:new THREE.Color()},uFogN:{value:40},uFogF:{value:150},uLightK:{value:new THREE.Color(1,1,1)}};
  const m=new THREE.Mesh(new THREE.PlaneGeometry(700,700,1,1),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,
    vertexShader:'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader:`uniform sampler2D uCoast; uniform float uTime,uFogN,uFogF; uniform vec3 uDeep,uShal,uSun,uSunCol,uTop,uHor,uFog,uLightK; varying vec3 vW;
      float h2(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h2(i),h2(i+vec2(1.,0.)),f.x),mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),f.x),f.y); }
      float wav(vec2 p){ return vn(p+vec2(uTime*.35,uTime*.2))*.5+vn(p*2.3+vec2(-uTime*.5,uTime*.4))*.3+vn(p*5.1+vec2(uTime*.9,-uTime*.6))*.2; }
      void main(){ vec2 uv=vec2(vW.x/160.+.5,.5-vW.z/160.); vec2 cs=texture2D(uCoast,clamp(uv,.002,.998)).rg; float shore=cs.r, shal=cs.g;
        vec2 p=vW.xz*.22; float e=.07; float n0=wav(p), nx=wav(p+vec2(e,0.)), nz=wav(p+vec2(0.,e));
        vec3 N=normalize(vec3((n0-nx)*1.3,1.,(n0-nz)*1.3));
        vec3 V=normalize(cameraPosition-vW); float fr=.03+.97*pow(1.-max(dot(N,V),0.),5.);
        vec3 R=reflect(-V,N); vec3 sky=mix(uHor,uTop,pow(max(R.y,0.),.5)); float s=max(dot(R,uSun),0.);
        vec3 base=mix(uDeep,uShal,smoothstep(.02,.6,shal))*uLightK;
        vec3 col=mix(base,sky,clamp(fr*.85+.06,0.,1.));
        col+=uSunCol*(pow(s,700.)*16.+pow(s,48.)*.45);
        vec2 sc=vW.xz*5.; float tw=step(.982,h2(floor(sc)+floor(uTime*2.5)))*smoothstep(.2,.0,length(fract(sc)-.5))*pow(s,3.)*2.2; col+=uSunCol*tw;
        float band=smoothstep(.36,.52,shore)*(1.-smoothstep(.6,.78,shore));
        float lines=smoothstep(.82,1.,sin(shore*30.-uTime*2.1+n0*4.)*.5+.5)*smoothstep(.16,.42,shore)*(1.-smoothstep(.56,.7,shore));
        float foam=clamp(band*(.5+.5*n0)+lines*.75,0.,1.); col=mix(col,vec3(.96,.98,1.)*uLightK,foam*.85);
        float a=mix(.97,.42,smoothstep(.4,.66,shore)); a=max(a,foam*.9);
        float dist=length(vW-cameraPosition); col=mix(col,uFog,smoothstep(uFogN,uFogF,dist));
        gl_FragColor=vec4(col,a);
        #include <tonemapping_fragment>
      }`}));
  m.rotation.x=-Math.PI/2; m.position.y=-.33; m.renderOrder=1; m.frustumCulled=false; R.add(m); IS.sea=m; }

/* ---------- 물류 센터: 창고 · 컨베이어 · 컨테이너 · 트럭 · 화물 부두 · 화물선 · 기중기 ---------- */
function islDock(S,R){
  const M=vlMats(), X=gfMats(), I=islMats(), B=vlBox, W=IS_WARE;
  { const g=gfGroup(S,W.x,W.z,0), p=vlPutter(g);
    p(B(W.w+.4,.35,W.d+.4,1.4),M.stoneDark,0,.17,0);
    for (const s of [-1,1]){ p(vlUVScale(new THREE.BoxGeometry(W.w,4.2,.16),W.w/3,1.4),I.ware,0,2.4,s*(W.d/2)); }
    p(vlUVScale(new THREE.BoxGeometry(.16,4.2,W.d),W.d/3,1.4),I.ware,-W.w/2,2.4,0);
    { const sh=new THREE.Shape(); sh.moveTo(-W.d/2,0); sh.lineTo(-W.d/2,4.2); sh.lineTo(0,5.6); sh.lineTo(W.d/2,4.2); sh.lineTo(W.d/2,0); sh.lineTo(1.6,0); sh.lineTo(1.6,3.2); sh.lineTo(-1.6,3.2); sh.lineTo(-1.6,0); sh.lineTo(-W.d/2,0);
      const eg=vlUVScale(new THREE.ExtrudeGeometry(sh,{depth:.16,bevelEnabled:false}),1/3); const e=p(eg,I.ware,W.w/2-.16,.3,0,0,Math.PI/2,0); }
    const sl=Math.hypot(W.d/2,1.4)+.4; for (const s of [-1,1]) p(vlUVScale(new THREE.BoxGeometry(W.w+.8,.14,sl),W.w/3,sl/3),I.wareRoof,0,5.27,s*W.d/4,s*Math.atan2(1.4,W.d/2),0,0);
    { const d=new THREE.Mesh(new THREE.PlaneGeometry(3.1,2.8),new THREE.MeshStandardMaterial({map:vlTexRep(vlCanvas(64,128,c=>{ for (let y=0;y<128;y+=8){ c.fillStyle=y%16?'#8a929a':'#6a727a'; c.fillRect(0,y,64,8); } })),roughness:.6,metalness:.3}));
      d.position.set(W.w/2-.12,1.9,0); d.rotation.y=Math.PI/2; d.material.map.repeat.set(1,1); g.add(d);
      const dark=new THREE.Mesh(new THREE.PlaneGeometry(3.1,.55),X.dark); dark.position.set(W.w/2-.1,.6,0); dark.rotation.y=Math.PI/2; g.add(dark); }
    for (const x of [-3.6,3.6]) p(new THREE.PlaneGeometry(1.4,.9),M.win,x,3.4,W.d/2+.09).castShadow=false;
    p(B(1.4,2.4,.1,1),I.steel,-1.8,1.5,W.d/2+.09); islBoard(g,'📦','섬 물류 센터','#c47a1e',1.2,3.4,W.d/2+.14,0,3.6);
    vlMerge(g); addCol(W.x,W.z,W.w+.4,W.d+.4); IS.ao.push({x:W.x,z:W.z,w:W.w+2,d:W.d+2,k:.55}); }
  // 컨베이어 (창고 문 → 택배 내려놓는 곳)
  { const x0=W.x+W.w/2+.1, x1=ISL_DOCK.x-1.4, L=x1-x0, cx=(x0+x1)/2, z=W.z-.2, g=gfGroup(S,0,0,0), p=vlPutter(g);
    for (const s of [-1,1]) p(B(L,.16,.1,1),I.steel,cx,.86,z+s*.55);
    for (let x=x0+.3;x<x1;x+=1.1) for (const s of [-1,1]) p(B(.1,.8,.1,1),I.steel,x,.4,z+s*.55);
    for (let x=x0+.15;x<x1;x+=.35) p(new THREE.CylinderGeometry(.06,.06,1.0,6),I.steel,x,.78,z,Math.PI/2,0,0);
    p(B(1.1,.08,1.0,1),I.steel,x1+.45,.6,z,0,0,-.38); p(B(.9,.5,.1,1),I.yellow,x0-.3,1.2,z+.62);
    vlMerge(g);
    const bt=vlTexRep(vlCanvas(64,64,c=>{ c.fillStyle='#2a2c30'; c.fillRect(0,0,64,64); c.fillStyle='#3a3d42'; for (let y=0;y<64;y+=8) c.fillRect(0,y,64,3); }));
    const belt=new THREE.Mesh(new THREE.PlaneGeometry(L,1.0),new THREE.MeshStandardMaterial({map:bt,roughness:.85})); bt.repeat.set(L/1.2,1); belt.rotation.x=-Math.PI/2; belt.position.set(cx,.85,z); R.add(belt);
    const boxes=[]; for (let i=0;i<4;i++){ const b=makeBox(); b.scale.setScalar(.85); b.position.set(x0+i*L/4,1.1,z); R.add(b); boxes.push(b); }
    IS.convey={belt:bt,boxes,x0,x1,z,L}; addCol(cx,z,L,1.3); }
  // 택배 내려놓는 곳 (돌 포장)
  islCobble(R,ISL_DOCK.x,ISL_DOCK.z,3.2);
  // 컨테이너 (두 층)
  { const D=[[8.4,-19.4,0,0],[8.4,-19.4,1,1],[9.4,-16.6,0,2],[20.4,-17.2,0,3]];
    D.forEach(([x,z,lv,c],i)=>{ const g=gfGroup(S,x,z,i===3?.12:0), p=vlPutter(g); p(vlUVScale(new THREE.BoxGeometry(6,2.5,2.4),2.4,1),I.cont[c],0,1.25+lv*2.52,0);
      for (const s of [-1,1]) p(B(.08,2.4,2.3,1),X.dark,s*3.01,1.25+lv*2.52,0); vlMerge(g); if (!lv) { addCol(x,z,6.2,2.6); IS.ao.push({x,z,w:7,d:3.4,k:.5}); } }); }
  // 택배 트럭
  { const g=gfGroup(S,4.6,-14.4,0), p=vlPutter(g);
    p(B(2.2,2.3,3.8,1),I.white,0,1.7,-1.2); islBoard(g,'📦','섬택배','#c47a1e',1.12,1.9,-1.2,Math.PI/2,2.6); islBoard(g,'📦','섬택배','#c47a1e',-1.12,1.9,-1.2,-Math.PI/2,2.6);
    p(B(2.2,1.6,1.6,1),I.red,0,1.25,1.45); p(B(2.0,.7,.06,1),I.glass,0,1.65,2.26,-.25,0,0); p(B(2.25,.3,5.6,1),X.dark,0,.48,-.1);
    for (const sx of [-1.02,1.02]) for (const z of [1.5,-2.2]) p(new THREE.CylinderGeometry(.42,.42,.32,14),X.dark,sx,.42,z,0,0,Math.PI/2);
    for (const sx of [-.75,.75]) p(B(.3,.18,.05,1),new THREE.MeshStandardMaterial({color:0xfff6d0,emissive:0xffe8a0,emissiveIntensity:.6}),sx,.9,2.27);
    vlMerge(g); addCol(4.6,-14.4-.1,2.5,5.8); IS.ao.push({x:4.6,z:-14.5,w:3,d:6.4,k:.5}); }
  // 짐 (팔레트 · 상자)
  { const box=(x,z,s,ry,y)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(s,s*.8,s),M.crate); m.position.set(x,(y||0)+s*.4,z); m.rotation.y=ry; m.castShadow=m.receiveShadow=true; S.add(m); };
    for (const [x,z] of [[-2.6,-16.6],[-14.6,-15.4]]){ const p=vlPutter(S); p(B(1.2,.14,1.2,1),M.woodLight,x,.07,z); box(x-.2,z-.2,.55,.2,.14); box(x+.25,z+.2,.5,.6,.14); box(x,z,.42,.1,.6); addCol(x,z,1.3,1.3); } }
  // 화물 부두 · 기중기 · 화물선
  { const P=IS_PIER, L=P.z0-P.z1, zc=(P.z0+P.z1)/2, g=gfGroup(S,0,0,0), p=vlPutter(g);
    p(B(P.hw*2,.24,L,2.4),X.plank,P.x,.06,zc);
    for (let z=P.z0-1;z>P.z1;z-=2.6) for (const s of [-1,1]) p(new THREE.CylinderGeometry(.18,.2,2.6,8),M.wood,P.x+s*(P.hw-.1),-.95,z);
    for (let z=P.z0-3;z>P.z1;z-=5.2) for (const s of [-1,1]) p(new THREE.CylinderGeometry(.13,.15,.45,8),X.dark,P.x+s*(P.hw-.25),.4,z);
    vlMerge(g); IS.ao.push({x:P.x,z:P.z0-1,w:4,d:3,k:.4}); }
  { const c=new THREE.Group(); c.position.set(IS_PIER.x+1.1,0,-30); R.add(c); const p=vlPutter(c);
    p(B(.5,.5,.5,1),I.yellow,0,.4,0); p(new THREE.CylinderGeometry(.18,.24,5,10),I.yellow,0,2.8,0);
    const jib=new THREE.Group(); jib.position.y=5.3; c.add(jib); const pj=vlPutter(jib); pj(B(.36,.36,6,1),I.yellow,0,0,-2.2); pj(B(.5,.5,1.2,1),X.dark,0,0,1.3);
    pj(new THREE.CylinderGeometry(.02,.02,2.6,4),X.dark,0,-1.3,-4.6); const ct=pj(B(2.6,1.1,1.1,1),I.cont[1],0,-3.1,-4.6); ct.castShadow=true;
    IS.crane=jib; }
  { const g=new THREE.Group(); g.position.set(IS_SHIP.x,0,IS_SHIP.z); R.add(g); const p=vlPutter(g);
    const hg=new THREE.BoxGeometry(4.4,2.2,14,1,2,8), pa=hg.attributes.position;
    for (let i=0;i<pa.count;i++){ const y=pa.getY(i), z=pa.getZ(i); let k=y<0?.8:1; if (z<-4.5) k*=1-Math.min(1,(-4.5-z)/2.5)*.7; pa.setX(i,pa.getX(i)*k); if (z<-5.5&&y>0) pa.setY(i,y+.35); }
    hg.computeVertexNormals(); p(hg,I.hull2,0,.1,0); p(B(4.1,.12,12,1),I.deck,0,1.24,.6);
    p(B(3.4,2.6,3,1),I.white,0,2.6,4.6); for (let i=-1;i<=1;i++) p(new THREE.PlaneGeometry(.7,.5),M.win,i*1,3.3,3.09).castShadow=false;
    p(new THREE.CylinderGeometry(.3,.35,1.4,10),I.red,0,4.6,5.4);
    [[-1.1,1.86,-3.4,0],[1.1,1.86,-3.4,2],[-1.1,1.86,-.8,3],[1.1,1.86,-.8,4],[0,2.98,-2.1,1]].forEach(([x,y,z,c])=>p(vlUVScale(new THREE.BoxGeometry(2.1,1.1,2.4),1.2,.6),I.cont[c],x,y,z));
    vlMerge(g); IS.boats.push({g,ph:0,amp:.08}); }
  addNpc('barbarian',-2.8,-18.6,.6); }

/* ---------- 여객선 부두 · 여객선 · 등대 · 포구 ---------- */
function islFerry(S,R){
  const M=vlMats(), X=gfMats(), I=islMats(), B=vlBox, P=IS_FPIER, L=P.z0-P.z1, zc=(P.z0+P.z1)/2;
  { const g=gfGroup(S,0,0,0), p=vlPutter(g); p(B(P.hw*2,.22,L,2.4),X.plank,P.x,.06,zc);
    for (let z=P.z0-1.5;z>P.z1;z-=2.4) for (const s of [-1,1]) p(new THREE.CylinderGeometry(.15,.17,2.4,8),M.wood,P.x+s*(P.hw-.08),-.9,z);
    for (let z=P.z0-1;z>P.z1+.5;z-=1.6) for (const s of [-1,1]) p(B(.08,.8,.08),M.wood,P.x+s*(P.hw-.04),.55,z);
    for (const s of [-1,1]) p(B(.06,.06,L-1,1),M.woodLight,P.x+s*(P.hw-.04),.92,zc-.3);
    vlMerge(g); }
  islBoard(S,'⛴️','여객선 터미널','#1f8a9e',IS_WAIT.x-2.2,2.3,IS_WAIT.z-.6,0,3.4); { const p=vlPutter(S); p(new THREE.CylinderGeometry(.08,.08,2.4,6),M.wood,IS_WAIT.x-3.4,1.15,IS_WAIT.z-.6); p(new THREE.CylinderGeometry(.08,.08,2.4,6),M.wood,IS_WAIT.x-1,1.15,IS_WAIT.z-.6); }
  // 여객선 (드나들어요)
  { const g=new THREE.Group(); g.position.set(IS_FERRY.x,0,IS_FERRY.z-60); g.visible=false; R.add(g); const p=vlPutter(g);
    const hg=new THREE.BoxGeometry(3.6,1.6,10,1,2,6), pa=hg.attributes.position;
    for (let i=0;i<pa.count;i++){ const y=pa.getY(i), z=pa.getZ(i); let k=y<0?.75:1; if (z<-3) k*=1-Math.min(1,(-3-z)/2)*.75; pa.setX(i,pa.getX(i)*k); if (z<-4&&y>0) pa.setY(i,y+.3); }
    hg.computeVertexNormals(); p(hg,I.hull,0,.15,0); p(B(3.4,.1,8,1),I.deck,0,.98,.6); p(B(3.5,.22,9.4,1),I.white,0,.82,.2);
    p(B(3,1.6,5,1),I.white,0,1.85,1.4); for (let i=0;i<5;i++) for (const s of [-1,1]) p(new THREE.PlaneGeometry(.62,.55),M.win,s*1.51,2.05,-.6+i*1,0,s*Math.PI/2,0).castShadow=false;
    p(B(2.6,.12,4.4,1),I.navy,0,2.71,1.4); p(new THREE.CylinderGeometry(.26,.3,1,10),I.red,0,3.2,2.6);
    vlMerge(g); IS.ferry={g,st:'away',t:0}; }
  // 등대 (곶 끝 바위 위)
  { const g=gfGroup(S,IS_LH.x,IS_LH.z,0), p=vlPutter(g);
    p(dfCyl(2.2,2.5,.8,16,1.6),M.stoneDark,0,.4,0);
    for (let i=0;i<4;i++) p(new THREE.CylinderGeometry(1.45-(i+1)*.11,1.45-i*.11,2.1,18),i%2?I.red:I.white,0,.8+i*2.1+1.05,0);
    p(new THREE.CylinderGeometry(1.25,1.25,.2,18),X.dark,0,9.3,0); p(new THREE.TorusGeometry(1.2,.04,5,24),X.dark,0,9.9,0,Math.PI/2,0,0);
    for (let i=0;i<12;i++){ const a=i/12*6.28; p(B(.05,.6,.05),X.dark,Math.cos(a)*1.2,9.6,Math.sin(a)*1.2); }
    p(new THREE.CylinderGeometry(.75,.75,1.1,12),I.glass,0,10,0); p(new THREE.ConeGeometry(.95,.9,12),I.red,0,11,0); p(new THREE.SphereGeometry(.12,8,6),X.gold,0,11.5,0);
    p(B(.8,1.4,.1,1),M.door,0,1.5,1.32);
    vlMerge(g); addCol(IS_LH.x,IS_LH.z,3.4,3.4); IS.ao.push({x:IS_LH.x,z:IS_LH.z,r:3.4,k:.5});
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.42,12,8),new THREE.MeshBasicMaterial({color:0xfff2b0,toneMapped:false})); lamp.position.set(IS_LH.x,10,IS_LH.z); R.add(lamp);
    const bm=new THREE.MeshBasicMaterial({color:0xfff2c0,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
    const beam=new THREE.Group(); beam.position.set(IS_LH.x,10,IS_LH.z); R.add(beam);
    for (const s of [-1,1]){ const c=new THREE.Mesh(new THREE.ConeGeometry(1.6,18,16,1,true).translate(0,-9,0),bm); c.rotation.z=s*Math.PI/2; beam.add(c); }
    IS.lhBeam=beam; IS.lhLamp=lamp; }
  // 북서 포구: 나무 선창 · 고깃배 두 척
  { const a=-Math.PI*.75, ux=Math.cos(a), uz=Math.sin(a), r0=islCoastR(a)-1.4, g=gfGroup(S,ux*(r0+3.2),uz*(r0+3.2),Math.atan2(ux,uz)), p=vlPutter(g);
    p(B(2.2,.2,7.4,2.4),X.plank,0,.04,0); for (let z=-3;z<=3;z+=2) for (const s of [-1,1]) p(new THREE.CylinderGeometry(.13,.15,2,8),M.wood,s*1,-.8,z); vlMerge(g);
    [[-.5,4.6,.12,'#c8382e'],[2.4,2.4,-.35,'#2f6fb0']].forEach(([lx,lz,ry,c],i)=>{ const bx=ux*(r0+lz+.5)-uz*lx*1.6, bz=uz*(r0+lz+.5)+ux*lx*1.6, bg=new THREE.Group(); bg.position.set(bx,0,bz); bg.rotation.y=Math.atan2(ux,uz)+ry+(i?1.4:0); R.add(bg); const pb=vlPutter(bg);
      const hg=new THREE.BoxGeometry(1.7,.8,4.2,1,1,4), pa=hg.attributes.position; for (let j=0;j<pa.count;j++){ const y=pa.getY(j), z=pa.getZ(j); let k=y<0?.6:1; if (z>1.2) k*=1-(z-1.2)/1.2*.85; pa.setX(j,pa.getX(j)*k); } hg.computeVertexNormals();
      pb(hg,new THREE.MeshStandardMaterial({color:new THREE.Color(c).convertSRGBToLinear(),roughness:.6}),0,.05,0); pb(B(1.5,.08,3.4,1),islMats().deck,0,.42,-.2); pb(B(1,.9,1.1,1),islMats().white,0,.9,-.8); pb(new THREE.CylinderGeometry(.04,.04,2.2,5),M.wood,0,1.5,.6);
      vlMerge(bg); IS.boats.push({g:bg,ph:i*2.1,amp:.1}); });
    addNpc('rogue',ux*(r0-1.2),uz*(r0-1.2),Math.atan2(-ux,-uz)); } }

/* ---------- 서비스업 가게 6곳 · 배달 깔개 · 이름표 ---------- */
function islCobble(R,x,z,r){ if (!DF_COB) DF_COB=gfCobbleTex(0,false); const geo=new THREE.CircleGeometry(r,48); vlUVScale(geo,r*2/3.4);
  const m=new THREE.Mesh(geo,IS.cobM||(IS.cobM=new THREE.MeshStandardMaterial({map:DF_COB,roughness:.92,metalness:0}))); m.rotation.x=-Math.PI/2; m.position.set(x,.03,z); m.receiveShadow=true; R.add(m);
  const curb=new THREE.Mesh(new THREE.TorusGeometry(r,.18,6,72),GF_CURB||(GF_CURB=new THREE.MeshStandardMaterial({color:0x5e594f,roughness:.95}))); curb.rotation.x=Math.PI/2; curb.scale.z=.45; curb.position.set(x,.04,z); R.add(curb); return m; }
function islShops(S,R){
  const M=vlMats(), X=gfMats(), I=islMats(), B=vlBox;
  ISL_SHOPS.forEach((h,hi)=>{
    const ry=Math.atan2(ISL_PLAZA.x-h.x,ISL_PLAZA.z-h.z), g=gfGroup(S,h.x,h.z,ry), p=vlPutter(g);
    let front=3.4, signY=3.2;
    if (h.kind==='house'){ const sg=gfGroup(g,0,0,0,GF_HS); vlHouse2({x:0,z:0,r:0,w:h.w,d:h.d,roof:h.roof,shut:h.shut,chim:h.chim},sg); front=(h.d/2+.4)*GF_HS+.15; signY=2.75;
      gfColRect(h.x,h.z,(h.w+.5)*GF_HS,(h.d+1.1)*GF_HS,ry); }
    else if (h.kind==='market'){ for (const sx of [-1,1]) for (const sz of [-1,1]) p(B(.2,2.9,.2,.8),M.wood,sx*3.6,1.45,sz*2.1);
      for (const s of [-1,1]){ const L=Math.hypot(2.5,1.1); p(B(8.2,.14,L,1.4),M.roof('#b8553e'),0,3.4,s*1.2,s*Math.atan2(1.1,2.4),0,0); }
      [[-2.4,0],[0,1],[2.4,2]].forEach(([x,c])=>{ p(B(2.1,.9,1.1,1),M.woodLight,x,.45,.9); p(B(2.2,.06,1.5,1),I.stripe[c],x,2.25,1.75,.35,0,0);
        for (let i=0;i<6;i++) p(new THREE.SphereGeometry(.13,8,6),M.flowers[(i+c)%5],x-.8+i*.32,.98,.9); });
      p(B(1.4,.5,.9,1),new THREE.MeshStandardMaterial({color:0xd8eef8,roughness:.2}),-2.4,1.0,-1.2); front=2.6; signY=3.0; gfColRect(h.x,h.z,7.6,4.6,ry); }
    else if (h.kind==='clinic'){ p(B(7,3.6,5.4,1),I.white,0,1.8,0); p(B(7.3,.3,5.7,1),M.stoneLight,0,3.7,0); p(B(7.4,.18,5.8,1),M.stoneDark,0,.09,0);
      for (const x of [-2.4,2.4]) p(new THREE.PlaneGeometry(1.4,1.1),M.win,x,2.2,2.71).castShadow=false; p(B(1.6,2.3,.08,1),I.glass,0,1.15,2.72);
      const cr=new THREE.MeshStandardMaterial({color:0xe23a3a,emissive:0xb01818,emissiveIntensity:.5,roughness:.5}); p(B(.9,.28,.1,1),cr,0,3.15,2.75); p(B(.28,.9,.1,1),cr,0,3.15,2.75);
      p(B(2.4,.1,1.1,1),I.stripe[0],0,2.5,3.1,.3,0,0); for (const x of [-2.2,0,2.2]) p(new THREE.PlaneGeometry(1.2,1),M.win,x,2.2,-2.71,0,Math.PI,0).castShadow=false; for (const s of [-1,1]) for (const z of [-1.2,1.2]) p(new THREE.PlaneGeometry(1.1,1),M.win,s*3.51,2.2,z,0,s*Math.PI/2,0).castShadow=false;
      front=3.0; signY=4.2; gfColRect(h.x,h.z,7.2,5.6,ry); }
    else { p(B(7,3.2,5,1),I.white,0,1.6,0); p(B(7.2,.25,5.2,1),M.stoneDark,0,3.25,0); p(B(6.2,2.2,.06,1),I.glass,0,1.3,2.52); p(B(7.1,.55,.12,1),I.stripe[3],0,2.75,2.56);
      p(B(.8,1.7,.7,1),new THREE.MeshStandardMaterial({color:0x2f86c8,emissive:0x1a5a90,emissiveIntensity:.5,roughness:.4}),3.9,.85,1.6); p(B(7.1,.4,.1,1),I.stripe[3],0,2.75,-2.52); for (const x of [-2,2]) p(new THREE.PlaneGeometry(1.4,.9),M.win,x,1.7,-2.53,0,Math.PI,0).castShadow=false; p(B(1.1,2,.08,1),I.steel,-3.0,1.0,-2.54); p(B(1.4,.08,.4,1),M.woodLight,-2.6,.45,3.1); front=2.8; signY=3.65; gfColRect(h.x,h.z,7.4,5.2,ry); }
    islBoard(g,h.icon,h.name,h.hex,0,signY,front+.06,0,h.kind==='house'?2.6:3.2);
    // 가게마다 작은 소품
    if (h.k==='cafe') [[-2.6,front+1.8],[2.6,front+1.6]].forEach(([x,z],i)=>{ p(new THREE.CylinderGeometry(.42,.42,.06,14),M.woodLight,x,.74,z); p(new THREE.CylinderGeometry(.05,.06,.74,6),M.iron,x,.37,z); p(new THREE.CylinderGeometry(.03,.03,2.1,5),M.iron,x,1.05,z); p(new THREE.ConeGeometry(1.2,.5,10,1,true),I.stripe[1+i],x,2.15,z); });
    if (h.k==='inn'){ const lx=4.3; for (const x of [lx,lx+2.6]) p(new THREE.CylinderGeometry(.04,.04,1.9,5),M.wood,x,.95,1.2); for (let i=0;i<4;i++) p(B(.5,.62,.02,1),I.stripe[i],lx+.4+i*.6,1.45,1.2); }
    if (h.k==='craft'){ p(new THREE.SphereGeometry(.9,12,8,0,6.283,0,Math.PI/2),M.stone,-3.9,0,1.6); p(B(.6,.5,.1,1),X.dark,-3.9,.3,2.48);
      for (let i=0;i<5;i++) p(new THREE.LatheGeometry([[0,0],[.14,.02],[.2,.18],[.14,.34],[.1,.42],[.12,.46]].map(([a,b])=>new THREE.Vector2(a,b)),10),new THREE.MeshStandardMaterial({color:new THREE.Color(['#b86a3a','#c8885a','#8a5a3a','#d8a070','#a85a30'][i]).convertSRGBToLinear(),roughness:.7}),3.2+i*.42,0,2.2+(i%2)*.35); }
    vlMerge(g);
    // 배달 깔개 · 둥근 테두리 · 이름표
    const col=new THREE.Color(h.hex);
    const rug=new THREE.Mesh(new THREE.CircleGeometry(1.5,32),new THREE.MeshStandardMaterial({color:col.clone().lerp(new THREE.Color(0xf2ead6),.45).convertSRGBToLinear(),roughness:.9})); rug.rotation.x=-Math.PI/2; rug.position.set(h.mx,.05,h.mz); rug.receiveShadow=true; R.add(rug);
    const edge=new THREE.Mesh(new THREE.RingGeometry(1.5,1.75,40),new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide,toneMapped:false})); edge.rotation.x=-Math.PI/2; edge.position.set(h.mx,.06,h.mz); R.add(edge);
    const tag=dfLabel(`${h.icon} ${h.name}`,h.hex,3.6); tag.position.set(h.x,h.kind==='house'?6.6:5.4,h.z); R.add(tag);
    ISL_HOUSES.push({name:h.name,icon:h.icon,item:h.item,k:h.k,tour:!!h.tour,hex:h.hex,x:h.mx,z:h.mz,hx:h.x,hz:h.z,tag,edge,ty:tag.position.y});
    IS.ao.push({x:h.x,z:h.z,w:8.4,d:7,r:ry,k:.5}); }); }

/* ---------- 분수 광장 · 수정 · 해변 소품 ---------- */
function islPlaza(S,R){
  const M=vlMats(), X=gfMats(), I=islMats();
  islCobble(R,ISL_PLAZA.x,ISL_PLAZA.z,ISL_PLAZA.r);
  { const g=gfGroup(S,ISL_PLAZA.x,ISL_PLAZA.z,0), p=vlPutter(g);
    p(vlUVScale(new THREE.CylinderGeometry(1.9,2.0,.55,24,1,true),5,.6),M.stone2,0,.27,0); p(new THREE.TorusGeometry(1.95,.14,6,32),M.stoneLight,0,.55,0,Math.PI/2,0,0);
    p(new THREE.CylinderGeometry(.32,.42,1.4,10),M.stoneLight,0,.7,0); p(new THREE.CylinderGeometry(.9,.25,.3,16),M.stoneLight,0,1.45,0); p(new THREE.CylinderGeometry(.14,.18,.6,8),M.stoneLight,0,1.8,0);
    vlMerge(g); addCol(ISL_PLAZA.x,ISL_PLAZA.z,3.6,3.6); IS.ao.push({x:ISL_PLAZA.x,z:ISL_PLAZA.z,r:2.6,k:.35}); }
  const wd=new THREE.Mesh(new THREE.CircleGeometry(1.85,24),I.water); wd.rotation.x=-Math.PI/2; wd.position.set(ISL_PLAZA.x,.42,ISL_PLAZA.z); R.add(wd);
  const top=new THREE.Mesh(new THREE.CircleGeometry(.82,16),I.water); top.rotation.x=-Math.PI/2; top.position.set(ISL_PLAZA.x,1.61,ISL_PLAZA.z); R.add(top);
  { const sm=new THREE.MeshBasicMaterial({color:0xd8f4ff,transparent:true,opacity:.5,depthWrite:false}); const sp=new THREE.Mesh(new THREE.CylinderGeometry(.06,.3,.9,10,1,true),sm); sp.position.set(ISL_PLAZA.x,2.3,ISL_PLAZA.z); R.add(sp); IS.spray=sp; }
  // 벤치 · 가로등 · 화분
  [[3.9,-2.4,-2.2],[-3.9,-2.4,2.2],[4.3,4.2,-.9],[-4.3,4.2,.9]].forEach(([x,z,r])=>{ const b=gfGroup(S,ISL_PLAZA.x+x,ISL_PLAZA.z+z,r,.85), p=vlPutter(b), B=vlBox;
    p(B(1.6,.08,.42,1),M.woodLight,0,.48,0); p(B(1.6,.34,.06,1),M.woodLight,0,.8,-.2,-.15,0,0); for (const xx of [-.65,.65]){ p(B(.08,.48,.08),M.wood,xx,.24,.15); p(B(.08,.48,.08),M.wood,xx,.24,-.17); } vlMerge(b); });
  [[5.6,-1],[-5.6,-1],[2.4,6.4],[-2.4,6.4],[-3.4,-14],[4.2,-11]].forEach(([x,z])=>{ const lg=gfGroup(S,x,z,0,.82); vlLamp(0,0,Math.atan2(-x,-z),lg); addCol(x,z,.45,.45); IS.ao.push({x,z,r:.7,k:.3}); });
  ISL_STATIONS.forEach(([x,z],i)=>{ const c=[0x9b6bff,0xffb72e,0x35c8e8][i], hex=['#7c4dff','#c98a00','#1b8fb0'][i]; islCobble(R,x,z,2.8); makeStation('any',x,z,c,{title:'지식의 수정',hex});
    stations[stations.length-1].g.children.forEach(m=>{ if (m.isMesh&&m.material&&m.material.isMeshToonMaterial&&m.material.color&&m.material.color.getHex()<0x707070) m.material=vlMats().stoneDark; }); }); }
function islBeach(S){
  const M=vlMats(), X=gfMats(), I=islMats(), B=vlBox;
  [[-8,27.5,0],[-2,29,1],[5,28.5,2],[11,27,0],[27.4,6,3],[28.2,-1.4,1]].forEach(([x,z,c],i)=>{ const g=gfGroup(S,x,z,rnd(0,6.3)), p=vlPutter(g);
    p(new THREE.CylinderGeometry(.04,.04,2.4,6),M.woodN,0,1.1,0); p(new THREE.ConeGeometry(1.5,.6,12,1,true),I.stripe[c],0,2.3,0); p(new THREE.SphereGeometry(.08,8,6),M.woodN,0,2.62,0);
    for (const s of [-1,1]){ p(B(.62,.08,1.6,1),I.stripe[(c+1)%4],s*.95,.32,.7,-.12,0,0); p(B(.62,.06,.6,1),I.stripe[(c+1)%4],s*.95,.55,-.05,.75,0,0); for (const z of [.1,1.3]) p(B(.05,.3,.05),M.woodN,s*.95,.15,z); }
    vlMerge(g); });
  { const g=gfGroup(S,-13,24.6,-.3), p=vlPutter(g); for (const sx of [-.8,.8]) for (const sz of [-.8,.8]) p(B(.12,2.4,.12,.6),M.woodN,sx,1.2,sz);
    p(B(2,.12,2,1),M.woodLight,0,2.45,0); p(B(1.8,.9,.08,1),I.red,0,2.95,.95); p(B(1.8,.9,.08,1),I.red,0,2.95,-.95); p(new THREE.ConeGeometry(1.6,.8,4,1),I.red,0,3.8,0,0,Math.PI/4,0);
    for (let y=.3;y<2.4;y+=.4) p(B(.8,.06,.06,.5),M.woodN,0,y,1.05); vlMerge(g); addCol(-13,24.6,2,2); }
  [[2,25.2],[8.6,24.6]].forEach(([x,z])=>{ const p=vlPutter(S); p(new THREE.ConeGeometry(.5,.6,8),islMats().deck,x,.3,z); p(new THREE.CylinderGeometry(.18,.24,.4,6),islMats().deck,x+.6,.2,z+.2); }); }

/* ---------- 야자수 (바람에 살랑여요) · 바위 해안 ---------- */
function islPalms(R){
  const pts=[]; for (let d=-30;d<=140;d+=6.5){ const a=d*Math.PI/180+rnd(-.04,.04), r=islCoastR(a)-rnd(3.6,6), x=Math.cos(a)*r, z=Math.sin(a)*r;
    if (ISL_SHOPS.some(h=>Math.hypot(x-h.x,z-h.z)<5.2)||pts.some(q=>Math.hypot(x-q.x,z-q.z)<3)||Math.hypot(x+13,z-24.6)<3||[[-8,27.5],[-2,29],[5,28.5],[11,27],[27.4,6],[28.2,-1.4]].some(([a2,b2])=>Math.hypot(x-a2,z-b2)<2.4)) continue; pts.push({x,z,s:rnd(.85,1.15),ry:rnd(0,6.3),lean:rnd(.12,.3)}); }
  [[-26.5,1.5],[-25.4,-12.6],[17.6,-12],[-16.4,-22.8],[19.6,-26.2],[-27.2,16.4]].forEach(([x,z])=>pts.push({x,z,s:rnd(.8,1),ry:rnd(0,6.3),lean:rnd(.08,.2)}));
  IS.palmPts=pts;
  const tg=new THREE.CylinderGeometry(.13,.2,5,8,10); { const p=tg.attributes.position; for (let i=0;i<p.count;i++){ const y=p.getY(i)+2.5, t=y/5; p.setY(i,y); p.setX(i,p.getX(i)*(1+.12*Math.sin(y*6))+t*t*1.3); } tg.computeVertexNormals(); }
  const lt=vlTex(vlCanvas(64,256,g=>{ g.clearRect(0,0,64,256); g.strokeStyle='#4f8a2a'; g.lineWidth=3; g.beginPath(); g.moveTo(32,0); g.lineTo(32,256); g.stroke();
    for (let y=8;y<250;y+=7){ const w=26*Math.sin(Math.PI*y/256)+4; g.fillStyle=['#5f9a32','#6aa83a','#4f8a2a'][(y/7|0)%3]; g.beginPath(); g.moveTo(32,y); g.lineTo(32-w,y+10); g.lineTo(32-w+3,y+14); g.lineTo(32,y+5); g.fill(); g.beginPath(); g.moveTo(32,y); g.lineTo(32+w,y+10); g.lineTo(32+w-3,y+14); g.lineTo(32,y+5); g.fill(); } }));
  const fg=[]; for (let i=0;i<9;i++){ const pl=new THREE.PlaneGeometry(1.0,3.0,1,8), p=pl.attributes.position; for (let j=0;j<p.count;j++){ const v=p.getY(j)+1.5, t=v/3; p.setXYZ(j,p.getX(j),Math.sin(t*2.4)*1.0-t*t*1.6,v*.95); }
    pl.rotateX(-.25); pl.rotateY(i/9*Math.PI*2+rnd(-.1,.1)); pl.translate(1.3,5,0); fg.push(pl); }
  const fGeo=vlMergeGeos(fg);
  const fm=new THREE.MeshStandardMaterial({map:lt,alphaTest:.5,side:THREE.DoubleSide,roughness:.8});
  fm.onBeforeCompile=sh=>{ sh.uniforms.uTime=NAT_U.uTime; sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n float ph=instanceMatrix[3].x*.31+instanceMatrix[3].z*.23; float rr=length(position.xz-vec2(1.3,0.)); transformed.y+=sin(uTime*1.7+ph+rr)*.08*rr; transformed.x+=sin(uTime*1.1+ph)*.05*rr;'); };
  fm.customProgramCacheKey=()=>'ispalm';
  const D=new THREE.Object3D(), I=islMats(), tm=new THREE.InstancedMesh(tg,I.palmT,pts.length), fmI=new THREE.InstancedMesh(fGeo,fm,pts.length), cm=new THREE.InstancedMesh(new THREE.SphereGeometry(.16,8,6),I.coco,pts.length*3);
  pts.forEach((t,i)=>{ D.position.set(t.x,0,t.z); D.rotation.set(0,t.ry,0); D.scale.setScalar(t.s); D.updateMatrix(); tm.setMatrixAt(i,D.matrix); fmI.setMatrixAt(i,D.matrix);
    for (let k=0;k<3;k++){ const a=k/3*6.28; D.position.set(t.x,0,t.z); D.updateMatrix(); const m=new THREE.Matrix4().makeTranslation(1.3+Math.cos(a)*.22,4.75,Math.sin(a)*.22); m.premultiply(D.matrix); cm.setMatrixAt(i*3+k,m); }
    addCol(t.x,t.z,.6,.6); IS.ao.push({x:t.x+.6,z:t.z,r:2.4,k:.3}); });
  tm.castShadow=fmI.castShadow=cm.castShadow=true; fmI.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:lt,alphaTest:.5,side:THREE.DoubleSide});
  R.add(tm,fmI,cm); }
function vlMergeGeos(list){ let n=0; list.forEach(g=>{ g=g.index?g.toNonIndexed():g; n+=g.attributes.position.count; });
  const P=new Float32Array(n*3), N=new Float32Array(n*3), T=new Float32Array(n*2); let o=0;
  list.forEach(g0=>{ const g=g0.index?g0.toNonIndexed():g0; g.computeVertexNormals(); P.set(g.attributes.position.array,o*3); N.set(g.attributes.normal.array,o*3); T.set(g.attributes.uv.array,o*2); o+=g.attributes.position.count; });
  const G=new THREE.BufferGeometry(); G.setAttribute('position',new THREE.BufferAttribute(P,3)); G.setAttribute('normal',new THREE.BufferAttribute(N,3)); G.setAttribute('uv',new THREE.BufferAttribute(T,2)); return G; }
function islRocks(S){
  const I=islMats(), put=vlPutter(S);
  for (let d=146;d<=218;d+=2.6){ const a=d*Math.PI/180, R0=islCoastR(a); for (let k=0;k<2;k++){ const r=R0+rnd(-1.2,2.4)+k*1.6, x=Math.cos(a)*r, z=Math.sin(a)*r, s=rnd(.9,2.2)*(k?.75:1);
      const m=put(new THREE.DodecahedronGeometry(s,0),Math.random()<.5?I.rock:I.rockD,x,islH(x,z)+s*.25,z,rnd(0,3),rnd(0,3),rnd(0,3)); m.scale.set(rnd(.9,1.3),rnd(.55,.9),rnd(.9,1.3)); } }
  for (let d=-58;d<=-30;d+=4){ const a=d*Math.PI/180, r=islCoastR(a)+rnd(-.5,2), x=Math.cos(a)*r, z=Math.sin(a)*r, s=rnd(.8,1.7); put(new THREE.DodecahedronGeometry(s,0),I.rockD,x,islH(x,z)+s*.2,z,rnd(0,3),rnd(0,3),0).scale.set(1.2,.7,1.1); }
  [[-36,8],[-34,-15],[38,30],[-30,31],[33,-30]].forEach(([x,z])=>{ const s=rnd(1.4,2.6); put(new THREE.DodecahedronGeometry(s,0),I.rock,x,-1.2,z,rnd(0,3),rnd(0,3),0).scale.set(1.2,.9,1); }); }

/* ---------- 자연: 나무 · 덤불 · 풀 뭉치 · 꽃 · 바위 (들판 마을과 같은 자연 에셋) ---------- */
function islNature(){
  const by={}, put=(n,p)=>(by[n]=by[n]||[]).push(p), green=['#7cae46','#8fbd4f','#6a9e3c','#86b84a','#5f9438'];
  const tint=()=>VL_LIN(green[(Math.random()*green.length)|0]).multiplyScalar(rnd(.9,1.06));
  const pathD=(x,z)=>{ let d=1e9; IS.paths.forEach(p=>{ for (let i=0;i<p.length-1;i++) d=Math.min(d,dfSegD(x,z,p[i][0],p[i][1],p[i+1][0],p[i+1][1])); }); return d; };
  const free=(x,z,pad)=>islIn(x,z,7+pad)&&pathD(x,z)>1.7+pad&&Math.hypot(x-ISL_PLAZA.x,z-ISL_PLAZA.z)>ISL_PLAZA.r+1+pad&&!ISL_STATIONS.some(([a,b])=>Math.hypot(x-a,z-b)<3.2+pad)&&!(x>-16&&x<18&&z<-13&&z>-28)&&!colliders.some(b=>x>b.x0-pad&&x<b.x1+pad&&z>b.z0-pad&&z<b.z1+pad)&&!ISL_HOUSES.some(h=>Math.hypot(x-h.x,z-h.z)<2.2+pad);
  [[-14.6,-1],[14.4,1.4],[-6.4,13.6],[6.8,14.2],[-15.6,15.6],[15.8,16.2],[-17.4,-14.6],[19.6,-14.4],[0,19.4],[-26,4],[26.4,2.6]].forEach(([x,z],i)=>{ if (!free(x,z,0)) return; put('T'+(i%5+1),{x,z,ry:rnd(0,6.3),s:rnd(.66,.8),c:tint()}); addCol(x,z,.8,.8); IS.ao.push({x:x+1,z:z+1,r:2.8,k:.4}); });
  for (let i=0;i<60;i++){ const a=rnd(0,6.28), r=rnd(8,24), x=Math.cos(a)*r, z=Math.sin(a)*r; if (!free(x,z,.5)) continue; put(Math.random()<.35?'Bush_Common_Flowers':'Bush_Common',{x,z,ry:rnd(0,6.3),s:rnd(.6,.95),c:tint()}); }
  const scatter=(n,cnt,sMin,sMax,pad)=>{ let k=0, t=0; while (k<cnt&&t<cnt*40){ t++; const a=rnd(0,6.28), r=Math.sqrt(Math.random())*27, x=Math.cos(a)*r, z=Math.sin(a)*r; if (!free(x,z,pad)) continue; put(n,{x,z,ry:rnd(0,6.3),s:rnd(sMin,sMax)}); k++; } };
  scatter('Grass_Wispy_Tall',200,.24,.4,.3); scatter('Grass_Common_Tall',160,.22,.36,.3); scatter('Flower_3_Group',70,.22,.32,.3); scatter('Flower_4_Group',70,.2,.3,.3); scatter('Clover_2',60,.28,.4,.2); scatter('Fern_1',24,.1,.14,.4);
  for (let d=146;d<=218;d+=7){ const a=d*Math.PI/180, r=islCoastR(a)-rnd(2.6,4.4), x=Math.cos(a)*r, z=Math.sin(a)*r; put('Bush_Common',{x,z,ry:rnd(0,6.3),s:rnd(.7,1),c:tint()}); }
  IS.natPlan=by; islNatInst(); }
function islNatInst(){
  const by=IS.natPlan; if (!by||IS.natDone) return; if (!GF_NAT.every(n=>VL.nat[n])){ GF_NATP.then(()=>{ if (!IS.natDone) within('island',islNatInst); }); return; }
  IS.natDone=true; const name=n=>{ const m=/^T(\d)/.exec(n); return m?'CommonTree_'+m[1]:n; };
  for (const n in by) vlInst(name(n),by[n],{shadow:!/Grass|Clover|Flower|Fern/.test(n)}); }

/* ---------- 풀: 캐릭터 주변에 가는 풀잎 (성벽 디펜스와 같은 풀 셰이더 · 모래 위에는 안 나요) ---------- */
function islGrass(R){
  const S=512, mp=v=>(v/IS_MAP+.5)*S, k=S/IS_MAP;
  const cv=vlCanvas(S,S,g=>{ g.fillStyle='#fff'; g.fillRect(0,0,S,S); g.lineCap='round'; g.lineJoin='round';
    const ln=(pts,w,c,bl)=>{ g.save(); g.filter=`blur(${bl}px)`; g.strokeStyle=c; g.lineWidth=w*k; g.beginPath(); pts.forEach(([x,z],i)=>i?g.lineTo(mp(x),mp(z)):g.moveTo(mp(x),mp(z))); g.stroke(); g.restore(); };
    const disc=(x,z,r,c,bl)=>{ g.save(); g.filter=`blur(${bl}px)`; g.fillStyle=c; g.beginPath(); g.arc(mp(x),mp(z),r*k,0,7); g.fill(); g.restore(); };
    IS.paths.forEach((p,i)=>ln(p,(i?2.6:3.4)+3,'#666',4)); IS.paths.forEach((p,i)=>ln(p,(i?2.6:3.4)+.5,'#000',1.5));
    disc(ISL_PLAZA.x,ISL_PLAZA.z,ISL_PLAZA.r+.4,'#000',1); ISL_STATIONS.forEach(([x,z])=>disc(x,z,3.1,'#000',1)); ISL_SHOPS.forEach(h=>{ disc(h.x,h.z,4.6,'#000',2); disc(h.mx,h.mz,1.9,'#000',1); });
    g.fillStyle='#000'; g.fillRect(mp(-16),mp(-27),34*k,14*k); disc(IS_LH.x,IS_LH.z,3,'#000',2); });
  { const g=cv.getContext('2d'), id=g.getImageData(0,0,S,S), d=id.data;
    for (let py=0;py<S;py++) for (let px=0;px<S;px++){ const x=(px+.5)/S*IS_MAP-IS_MAP/2, z=(py+.5)/S*IS_MAP-IS_MAP/2, sd=islMaskAt(x,z,2), i=(py*S+px)*4;
      const cut=Math.max(0,Math.min(1,(sd-.15)/.3)); d[i]=d[i]*(1-cut); d[i+2]=255*(1-Math.min(1,sd*1.6)); }
    g.putImageData(id,0,0); }
  const mt=new THREE.CanvasTexture(cv); mt.minFilter=THREE.LinearFilter; mt.generateMipmaps=false;
  const U=IS.U={uTime:NAT_U.uTime,uPlayer:{value:new THREE.Vector3()},uCenter:{value:new THREE.Vector2()},uR:{value:21},uMap:{value:IS_MAP},uMask:{value:mt},uGround:{value:IS.mask},
    uTip:{value:VL_LIN('#a8c84a')},uTip2:{value:VL_LIN('#5f9a32')},uDry:{value:VL_LIN('#c8b060')},uRoot:{value:VL_LIN('#3a5a1c')},uSun:{value:new THREE.Vector3(.5,.62,.3).normalize()},uSunCol:{value:new THREE.Color(1,.9,.7)},
    uFog:{value:new THREE.Color()},uFogN:{value:40},uFogF:{value:150},uLightK:{value:new THREE.Color(1,1,1)}};
  const m=dfGrassMesh(U); R.add(m); IS.grass=m; GRASS.push(m); }

/* ---------- 섬 짓기 ---------- */
function buildIsland(){
  const R=new THREE.Group(); scene.add(R); IS.root=R;
  const keep={halos:VL.halos,smoke:VL.smokeSrc,camObs:VL.camObs,bed:VL.bedFlowers};
  VL.halos=IS.halos; VL.smokeSrc=IS.smoke; VL.camObs=[]; VL.bedFlowers=[];
  IS.ao=[]; ISL_HOUSES.length=0;
  const S=new THREE.Group(); R.add(S); IS.static=S;
  try{
    gfSky(R,IS); R.children.slice(-2).forEach(m=>{ m.scale.y=.42; });
    islGround(R); islSea(R);
    islDock(S,R); islFerry(S,R); islShops(S,R); islPlaza(S,R); islBeach(S); islRocks(S); islPalms(R);
    addNpc('mage',-4.2,-1.6,.9);
    islNature();
    gfSmoke(R,IS);
    islGroundFinish(IS.ao);
    islGrass(R); gfSeeThrough(R);
    S.updateMatrixWorld(true); vlMerge(S);
  } finally { VL.halos=keep.halos||[]; VL.smokeSrc=keep.smoke||[]; VL.camObs=keep.camObs||[]; VL.bedFlowers=keep.bed||[]; }
  // 배달지 · 관광객 안내 표시: 빛기둥 · 발밑 화살표
  const beam=c=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.6,36,28,1,true),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})); m.position.y=18; m.visible=false; R.add(m); return m; };
  islBeam=beam(PARCEL_COL); islBeam2=beam(TOUR_COL);
  IS.built=true;
}
/* ---------- 분위기: 맑은 낮 · 황금빛 오후 (바다 노을) ---------- */
const IS_MOODS={
  day:   {top:'#2a72d8',hor:'#9ccdf2',fog:'#acd4f2',fogN:50,fogF:175,cShade:[.74,.82,.95],cAdd:[.32,.32,.32],sunCol:'#fff3df',cov:.5,mtn:[0x6f93b8,0x5f8a78],light:[1,1,1],sun:[1,.95,.85],deep:[.02,.16,.32],shal:[.1,.56,.62]},
  golden:{top:'#3f7cc8',hor:'#f4cf9a',fog:'#f0d4aa',fogN:42,fogF:155,cShade:[.82,.66,.62],cAdd:[.42,.24,.1],sunCol:'#ffd08a',cov:.55,mtn:[0x8a7f9c,0x7a7a64],light:[1.04,.98,.9],sun:[1,.8,.55],deep:[.04,.14,.28],shal:[.16,.5,.52]},
};
function islApplyMood(k){
  const G=IS_MOODS[k]||IS_MOODS.day;
  scene.background.set(G.fog).convertSRGBToLinear(); scene.fog.color.set(G.fog).convertSRGBToLinear(); scene.fog.near=G.fogN; scene.fog.far=G.fogF;
  if (IS.skyU){ const U=IS.skyU; U.uTop.value.set(G.top).convertSRGBToLinear(); U.uHor.value.set(G.hor).convertSRGBToLinear(); U.uCShade.value.setRGB(...G.cShade); U.uCAdd.value.setRGB(...G.cAdd); U.uSunCol.value.set(G.sunCol).convertSRGBToLinear(); U.uCov.value=G.cov; }
  (IS.mtnU||[]).forEach((u,i)=>u.uCol.value.setHex(G.mtn[i]||G.mtn[0]).convertSRGBToLinear());
  if (IS.WU){ IS.WU.uSunCol.value.setRGB(...G.sun); IS.WU.uLightK.value.setRGB(...G.light); IS.WU.uDeep.value.setRGB(...G.deep); IS.WU.uShal.value.setRGB(...G.shal); }
  if (IS.U){ IS.U.uSunCol.value.setRGB(...G.sun); IS.U.uLightK.value.setRGB(...G.light); }
  IS.moodK=k; }
const islPickMood=seed=>{ let r=Math.random(); if (seed){ let h=0; for (const c of String(seed)) h=(h*31+c.charCodeAt(0))|0; r=(Math.abs(h)%100)/100; } return r<.6?'day':'golden'; };

/* ---------- 택배 ---------- */
const boxTex=canvasTex(128,128,(g,w,h)=>{ g.fillStyle='#c8955a'; g.fillRect(0,0,w,h);
  for (let i=0;i<300;i++){ g.fillStyle=`rgba(90,55,20,${rnd(.03,.09)})`; g.fillRect(Math.random()*w,Math.random()*h,rnd(2,8),1); }
  g.fillStyle='#e8d29a'; g.fillRect(w*.42,0,w*.16,h); g.strokeStyle='rgba(80,50,20,.6)'; g.lineWidth=4; g.strokeRect(2,2,w-4,h-4); });
boxTex.wrapS=boxTex.wrapT=THREE.ClampToEdgeWrapping;
const boxGeo=new THREE.BoxGeometry(.72,.56,.72), boxMat=toonMat({map:boxTex,rim:.25});
const expMat=toonMat({map:boxTex,rim:.25,color:0xffe9a0,emissive:0x8a5a00,emissiveIntensity:.35});
function makeBox(exp){ return cs(new THREE.Mesh(boxGeo,exp?expMat:boxMat),false); }
function islReset(){
  parcels.forEach(p=>{ if (p.mesh.parent) p.mesh.parent.remove(p.mesh); if (p.g&&p.g.parent) p.g.parent.remove(p.g); }); parcels=[];
  if (W.isl&&W.isl.tour) islTourClear(W.isl.tour);
  W.isl={quota:0,spawned:0,done:0,nextAt:0,delivered:0,lost:0,thiefQ:[],carry:null,hint:0,lastDest:-1,waitHint:0,tips:0,expN:0,tourN:0,tour:{st:'none'},tourAt:-1};
  if (islBeam) islBeam.visible=false; if (islBeam2) islBeam2.visible=false; if (islArrow) islArrow.visible=false; if (islArrow2) islArrow2.visible=false;
  if (IS.ferry){ IS.ferry.st='away'; IS.ferry.g.visible=false; }
  if (IS.pirate){ IS.pirate.visible=false; } }
function islWaveStart(d){
  const S=W.isl; if (!S) return;
  S.quota=d.parcels||0; S.spawned=0; S.done=0; S.nextAt=W.t+2.5;
  S.thiefQ=(d.thieves||[]).map(q=>({at:W.t+q.at,n:q.n,def:d}));
  if (!d.boss && !PARTY.on && (S.tour.st==='none'||S.tour.st==='done')) S.tourAt=W.t+9;
  if (d.boss) islBossLand(liveBoss()); }
function islWaveDone(){ const S=W.isl; return MAPK!=='island' || !S || (S.spawned>=S.quota && !parcels.length && !S.thiefQ.length); }
function spawnParcel(){
  const S=W.isl; let di; do { di=Math.floor(Math.random()*ISL_HOUSES.length); } while (di===S.lastDest && ISL_HOUSES.length>1); S.lastDest=di;
  const a=rnd(0,6.283), r=rnd(.3,1.8), x=ISL_DOCK.x+Math.cos(a)*r, z=ISL_DOCK.z+Math.sin(a)*r, exp=S.spawned>=1&&Math.random()<.34;
  const g=new THREE.Group(); g.position.set(x,0,z);
  const mesh=makeBox(exp); mesh.position.y=.75; g.add(mesh);
  const col=exp?0xffd34d:PARCEL_COL;
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.35,.55,5,14,1,true),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.25,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})); beam.position.y=2.5; g.add(beam);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.85,28),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false})); ring.rotation.x=-Math.PI/2; ring.position.y=.07; g.add(ring);
  (IS.root||scene).add(g);
  parcels.push({state:'ground',x,z,dest:di,g,mesh,beam,ring,born:W.t,express:exp});
  S.spawned++; fx.burst(x,1,z,col,10,3);
  const h=ISL_HOUSES[di];
  if (!S.hint){ S.hint=1; flashPrompt(`📱 ${h.icon} ${h.name}에서 인터넷으로 ${h.item} 주문했어요! 북쪽 물류 센터에서 상자를 집어 배달하세요`,3.8); }
  else flashPrompt(`📱 ${h.icon} ${h.name}에서 인터넷으로 ${h.item} 주문했어요!${exp?' ⚡ 빠른 배송 상자예요':''}`,2.8); }
function setGround(p,x,z){
  p.state='ground'; p.thief=null; p.x=x; p.z=z; p.g.position.set(x,0,z); p.g.add(p.mesh); p.mesh.position.set(0,.75,0); p.mesh.rotation.set(0,0,0); p.mesh.scale.setScalar(1);
  p.beam.visible=p.ring.visible=true; (IS.root||scene).add(p.g); }
function removeParcel(p){ if (p.mesh.parent) p.mesh.parent.remove(p.mesh); if (p.g.parent) p.g.parent.remove(p.g); parcels=parcels.filter(q=>q!==p); if (W.isl.carry===p) W.isl.carry=null; }
function pickParcel(p){
  const S=W.isl; S.carry=p; p.state='carried'; if (p.g.parent) p.g.parent.remove(p.g); pg.add(p.mesh); p.mesh.position.set(0,2.85,0); p.mesh.rotation.set(0,.4,0); p.mesh.scale.setScalar(1.15);
  SFX.card(); fx.burst(P.x,1.4,P.z,p.express?0xffd34d:PARCEL_COL,12,3);
  if (PEACE_RUN) p.due=W.t+PARCEL_TIME; else if (p.express) p.due=W.t+EXP_TIME;
  const h=ISL_HOUSES[p.dest]; flashPrompt(p.express?`⚡ 빠른 배송! ${EXP_TIME}초 안에 ${h.icon} ${h.name}(으)로 가면 보너스`:`${h.icon} ${h.name}(으)로 배달해요! 주황 화살표를 따라가세요`,3);
  const useOX=OX.length&&Math.random()<.45;
  openQuiz(pick(useOX?['ox','mc']:['mc','ox'],useOX?OX:MC),{type:'parcel'}); }
function deliverParcel(p){
  const S=W.isl, h=ISL_HOUSES[p.dest];
  removeParcel(p); S.delivered++; S.done++;
  SFX.correct(); fx.rise(h.x,h.z,PARCEL_COL,24); fx.burst(h.x,1.2,h.z,0xffffff,12,4); fx.num(h.x,3.2,h.z,'배달 완료!','#ffd34d',1.3);
  P.hp=Math.min(P.max,P.hp+5);
  if (PEACE_RUN && p.due && W.t<=p.due){ S.stars=(S.stars||0)+1; showBanner(`${h.name} 제시간 배달! ★`); fx.num(h.x,4.2,h.z,'★','#ffd34d',1.6); }
  else if (!PEACE_RUN && p.express && p.due && W.t<=p.due){ S.expN++; S.tips+=20; const b=P.hp; P.hp=Math.min(P.max,P.hp+Math.round(P.max*.1)); showBanner(`⚡ ${h.name} 빠른 배송 성공! +20`); fx.num(h.x,4.3,h.z,'⚡ +20','#ffe066',1.5); fx.rise(h.x,h.z,0xffe066,30); }
  else showBanner(`${h.name} 배달 완료!`);
  if (W.stats) W.stats.dl=(W.stats.dl||0)+1; }
function thiefSpawn(def){
  const a=-rnd(.2,Math.PI-.2), r=islCoastR(a)-2.5;
  spawnMob({...def,hp:Math.round(def.hp*.55),spd:3.3,runner:true,thief:true},false,{x:Math.cos(a)*r,z:Math.sin(a)*r}); }
/* 도둑 해골: 바닥에 놓인 상자를 노리고, 훔치면 바다로 달아나요. 처치하면 상자를 떨어뜨려요 */
function thiefAI(m,dt){
  let tx,tz;
  if (m.parcel){ const d=Math.hypot(m.x,m.z)||1, R=islCoastR(Math.atan2(m.z,m.x)); tx=m.x/d*(R+3); tz=m.z/d*(R+3);
    if (d>R-1.3){ const p=m.parcel; m.parcel=null; removeParcel(p); W.isl.lost++; W.isl.done++; if (W.stats) W.stats.lost=(W.stats.lost||0)+1;
      fx.burst(m.x,.5,m.z,0xffffff,24,5); flashPrompt('도둑 해골이 상자를 들고 바다로 달아났어요… 다음 상자는 꼭 지켜요!',2.6); SFX.wrong();
      m.hp=0; m.dying=0; return true; }
  } else {
    let best=null, bd=1e9; for (const p of parcels){ if (p.state!=='ground') continue; const d=Math.hypot(p.x-m.x,p.z-m.z); if (d<bd){ bd=d; best=p; } }
    if (!best) return false;
    tx=best.x; tz=best.z;
    if (bd<1.1){ best.state='thief'; best.thief=m; m.parcel=best; if (best.g.parent) best.g.parent.remove(best.g); m.g.add(best.mesh); best.mesh.position.set(0,2.45,0); best.mesh.scale.setScalar(1.1);
      flashPrompt('도둑 해골이 상자를 훔쳤어요! 바다에 닿기 전에 쓰러뜨리세요',2.6); SFX.wrong(); }
  }
  const dx=tx-m.x, dz=tz-m.z, d=Math.hypot(dx,dz)||1, sp=m.spd*(m.parcel?.85:1)*(W.loc?.5:1)*slowK(m);
  m.x+=(dx/d*sp+m.kbx)*dt; m.z+=(dz/d*sp+m.kbz)*dt; m.kbx*=Math.pow(.02,dt); m.kbz*=Math.pow(.02,dt);
  if (!m.parcel) resolve(m,m.r);
  m.g.rotation.y=Math.atan2(dx,dz); m.flash=Math.max(0,m.flash-dt); m.mat.emissive.setHex(m.flash>0?0xffffff:0x000000);
  return true; }

/* ---------- 🧳 공정 여행 관광객: 여객선이 오면 퀴즈를 맞히고, 마을 가게(민박 · 전통 시장 · 체험 공방)로 안내해요 ---------- */
const IS_TPATH=[[IS_FERRY.x-1.5,IS_FERRY.z],[IS_FPIER.x+.2,IS_FERRY.z],[IS_FPIER.x,-30],[IS_WAIT.x,IS_WAIT.z]];
function islTourClear(T){ if (T&&T.c&&T.c.root.parent) T.c.root.parent.remove(T.c.root); if (T) { T.c=null; if (T.mk&&T.mk.parent) T.mk.parent.remove(T.mk); T.mk=null; } }
function islTourSpawn(T){
  const jobs=Object.keys(DEFAULTS), job=jobs[Math.floor(Math.random()*jobs.length)];
  let c=null; try{ c=makePlayerChar(job); dressP2(c,cfLookFix(job,cfRandLook(job))).catch(()=>{}); cfAnimKeys(c); }catch(e){ c=makeChar('rogue',1,{idle:'Idle',run:'Running_A'}); c.anim.actions.cidle=c.anim.actions.idle; c.anim.actions.crun=c.anim.actions.run; }
  c.root.position.set(IS_TPATH[0][0],1.05,IS_TPATH[0][1]); IS.root.add(c.root); c.anim.setBase('cidle');
  const mk=dfLabel('🧳 관광객 · 안내해 주세요','#1f9e94',3.9); IS.root.add(mk);
  Object.assign(T,{st:'walk',c,mk,x:IS_TPATH[0][0],z:IS_TPATH[0][1],pi:1,dest:-1,t:0,told:false}); }
function islTourWalk(T,pts,dt,sp){ const tgt=pts[T.pi]; if (!tgt) return true; const dx=tgt[0]-T.x, dz=tgt[1]-T.z, d=Math.hypot(dx,dz);
  if (d<.15){ T.pi++; return T.pi>=pts.length; } const v=Math.min(d,sp*dt); T.x+=dx/d*v; T.z+=dz/d*v; T.ry=Math.atan2(dx,dz); T.moving=true; return false; }
function islTourFx(ok){
  const T=W.isl&&W.isl.tour; if (!T||!T.c) return {label:ok?'관광객이 기뻐해요':'관광객이 떠나요'};
  if (!ok){ T.st='leave'; T.pi=1; return {label:'관광객이 대형 리조트 셔틀을 탔어요… 다음엔 마을 가게로 안내해요'}; }
  const opts=ISL_HOUSES.map((h,i)=>h.tour?i:-1).filter(i=>i>=0); T.dest=opts[Math.floor(Math.random()*opts.length)]; T.st='follow';
  const h=ISL_HOUSES[T.dest]; T.mk.visible=false;
  setTimeout(()=>{ if (W.state==='play') flashPrompt(`🧳 관광객을 ${h.icon} ${h.name}(으)로 안내해요! 초록 화살표를 따라가요`,3.2); },200);
  return {label:`🧳 공정 여행! 관광객이 ${h.name}에 가고 싶대요`}; }
function islTourTick(dt){
  const S=W.isl, T=S.tour, F=IS.ferry; if (!F) return;
  if ((T.st==='none'||T.st==='done') && S.tourAt>0 && W.t>=S.tourAt){ S.tourAt=-1; T.st='ferry'; F.st='in'; F.t=0; F.g.visible=true; }
  if (T.st==='ferry' && F.st==='dock'){ islTourSpawn(T); if (!S.tourSeen){ S.tourSeen=1; flashPrompt('⛴️ 여객선이 도착했어요! 🧳 관광객에게 가면 퀴즈가 나와요. 맞히면 마을 가게로 안내해요',3.6); } else flashPrompt('⛴️ 여객선이 관광객을 태우고 왔어요!',2.4); }
  if (!T.c) return;
  T.moving=false;
  if (T.st==='walk'){ if (islTourWalk(T,IS_TPATH,dt,2.6)){ T.st='wait'; T.ry=0; } }
  else if (T.st==='wait'){ const d=Math.hypot(P.x-T.x,P.z-T.z), busy=W.paused||!$('#quiz').hidden||W.prep||W.loc||(typeof FUN!=='undefined'&&FUN.am&&!FUN.am.done);
    if (!busy && d<2.4){ const it=pick(['ox','mc'],OX.length?OX:MC)||pick(['mc'],MC); if (it){ T.st='quiz'; openQuiz(it,{type:'tourist'}); } }
    else if (!busy && d<7 && !T.told){ T.told=true; flashPrompt('🧳 관광객이 길을 물어봐요 · 가까이 가면 퀴즈가 나와요',2.4); } }
  else if (T.st==='follow'){ const dx=P.x-T.x, dz=P.z-T.z, d=Math.hypot(dx,dz); if (d>1.9){ const v=Math.min(d-1.9,Math.min(8,2+d*1.6)*dt); T.x+=dx/d*v; T.z+=dz/d*v; T.ry=Math.atan2(dx,dz); T.moving=v>.01; }
    const p={x:T.x,z:T.z}; islClamp(p,1.2); T.x=p.x; T.z=p.z;
    const h=ISL_HOUSES[T.dest]; if (Math.hypot(P.x-h.x,P.z-h.z)<2.6 && Math.hypot(T.x-h.x,T.z-h.z)<4.5){ T.st='enter'; T.t=0; S.tourN++; S.tips+=40;
      const b=P.hp; P.hp=Math.min(P.max,P.hp+Math.round(P.max*.1)); SFX.correct(); fx.rise(h.x,h.z,TOUR_COL,28); fx.num(h.x,3.4,h.z,'🧳 팁 +40','#7df2e4',1.4);
      showBanner(`🧳 ${h.name} 안내 완료! 팁 +40`); setTimeout(()=>{ if (W.state==='play') flashPrompt('공정 여행: 관광객이 마을 가게에서 돈을 쓰면 섬 주민에게 도움이 돼요!',3); },900); } }
  else if (T.st==='enter'){ T.t+=dt; const h=ISL_HOUSES[T.dest], dx=h.hx-T.x, dz=h.hz-T.z, d=Math.hypot(dx,dz)||1; T.x+=dx/d*2*dt; T.z+=dz/d*2*dt; T.ry=Math.atan2(dx,dz); T.moving=true; T.c.root.scale.setScalar(Math.max(.01,1-T.t/1.4));
    if (T.t>1.4){ islTourClear(T); T.st='done'; F.st='out'; F.t=0; } }
  else if (T.st==='leave'){ const back=[...IS_TPATH].reverse(); if (T.pi>=back.length||T.pi<0) T.pi=0; if (islTourWalk(T,back,dt,3)){ islTourClear(T); T.st='done'; F.st='out'; F.t=0; } }
  if (T.c){ T.c.root.position.set(T.x,T.st==='walk'&&T.pi<=1?1.05:islH(T.x,T.z)*0+(Math.abs(T.x-IS_FPIER.x)<IS_FPIER.hw&&T.z<IS_FPIER.z0-1?.17:0),T.z); let dy=(T.ry||0)-T.c.root.rotation.y; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); T.c.root.rotation.y+=dy*Math.min(1,dt*10);
    T.c.anim.setBase(T.moving?'crun':'cidle',T.moving?1.1:1); } }

/* 해적 해골 선장: 남쪽 해변에 작은 배를 타고 올라와요 */
function islBossLand(b){
  if (!b||!IS.built) return; const a=Math.PI*.5+rnd(-.25,.25), R0=islCoastR(a); b.x=Math.cos(a)*(R0-4); b.z=Math.sin(a)*(R0-4); b.g.position.set(b.x,0,b.z);
  if (!IS.pirate){ const g=new THREE.Group(), p=vlPutter(g), M=vlMats(); IS.root.add(g);
    const hg=new THREE.BoxGeometry(1.8,.8,4.4,1,1,4), pa=hg.attributes.position; for (let j=0;j<pa.count;j++){ const y=pa.getY(j), z=pa.getZ(j); let k=y<0?.6:1; if (z>1.2) k*=1-(z-1.2)/1.4*.85; pa.setX(j,pa.getX(j)*k); } hg.computeVertexNormals();
    p(hg,new THREE.MeshStandardMaterial({color:0x3a2a20,roughness:.8}),0,.2,0); p(new THREE.CylinderGeometry(.05,.05,3,5),M.wood,0,1.8,0);
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.9),new THREE.MeshStandardMaterial({map:dfBannerTex(true),side:THREE.DoubleSide,alphaTest:.5})); fl.position.set(.7,2.9,0); fl.rotation.y=Math.PI/2; g.add(fl); IS.pirate=g; }
  IS.pirate.position.set(Math.cos(a)*(R0+.6),-.1,Math.sin(a)*(R0+.6)); IS.pirate.rotation.y=Math.atan2(-Math.cos(a),-Math.sin(a))+.4; IS.pirate.visible=true;
  fx.burst(b.x,.5,b.z,0xffffff,30,6); shake=Math.max(shake,.4);
  setTimeout(()=>{ if (W.state==='play') flashPrompt('🏴‍☠️ 해적 해골 선장이 남쪽 해변에 배를 대고 올라왔어요!',3); },700); }

function islandTick(dt){
  const S=W.isl; if (MAPK!=='island' || !S) return;
  if (S.spawned<S.quota && W.t>=S.nextAt && parcels.filter(p=>p.state==='ground').length<2){ spawnParcel(); S.nextAt=W.t+6; }
  for (let i=S.thiefQ.length-1;i>=0;i--){ const q=S.thiefQ[i]; if (W.t<q.at) continue; S.thiefQ.splice(i,1); for (let k=0;k<q.n;k++) thiefSpawn(q.def);
    flashPrompt(S.thiefSeen?'도둑 해골이 또 나타났어요!':'주황색 도둑 해골은 상자를 훔쳐 가요! 상자 근처를 지키세요',3); S.thiefSeen=1; }
  for (const p of parcels){ if (p.state==='thief' && p.thief && p.thief.dying>=0){ const m=p.thief; m.parcel=null; const q={x:m.x,z:m.z}; islClamp(q,2); setGround(p,q.x,q.z); fx.burst(p.x,1,p.z,PARCEL_COL,10,3); flashPrompt('상자를 되찾았어요! 다시 집어서 배달하세요',2); } }
  if (!W.paused && !W.loc){
    if (S.carry){ const p=S.carry, h=ISL_HOUSES[p.dest]; if (Math.hypot(P.x-h.x,P.z-h.z)<2.1) deliverParcel(p); }
    else { for (const p of parcels){ if (p.state==='ground' && W.t-p.born>.6 && Math.hypot(P.x-p.x,P.z-p.z)<1.5){ pickParcel(p); break; } } }
  }
  if (!PARTY.on) islTourTick(dt);
  if (!PEACE_RUN && !mobs.length && !W.gate && (parcels.length || S.spawned<S.quota) && W.t>=S.waitHint){ S.waitHint=W.t+9; flashPrompt('남은 택배를 모두 배달하면 웨이브가 끝나요',2.5); } }

/* ---------- 매 프레임 (그림) ---------- */
const IS_FR=new THREE.Frustum(), IS_PM=new THREE.Matrix4(), IS_DB=new THREE.Vector2();
function islandLook(real,dt){
  if (MAPK!=='island' || !IS.built){ if (islArrow) islArrow.visible=false; if (islArrow2) islArrow2.visible=false; return; }
  const play=W.state==='play';
  GF_SEE.value=(play&&!(typeof SHOP!=='undefined'&&SHOP.open))?1:0;
  if (!IS.skyOff){ IS.skyOff=true; gfSkyVis(false); clouds.forEach(c=>c.visible=true); }
  NAT_U.uTime.value=real; NAT_U.uCam.value.copy(camera.position); NAT_U.uPlr.value.set(P.x,1.1,P.z);
  const fc=scene.fog.color, sunD=new THREE.Vector3().copy(sun.position).sub(sun.target.position).normalize();
  if (IS.skyU){ IS.skyU.uTime.value=real; IS.skyU.uFog.value.copy(fc); IS.sky.position.copy(camera.position); IS.skyU.uSun.value.copy(sunD); }
  if (IS.WU){ const U=IS.WU; U.uTime.value=real; U.uFog.value.copy(fc); U.uFogN.value=scene.fog.near; U.uFogF.value=scene.fog.far; U.uTop.value.copy(IS.skyU.uTop.value); U.uHor.value.copy(IS.skyU.uHor.value); U.uSun.value.copy(sunD); }
  if (IS.U){ const U=IS.U; U.uPlayer.value.set(P.x,0,P.z); U.uCenter.value.set(P.x,P.z-4); U.uFog.value.copy(fc); U.uFogN.value=scene.fog.near; U.uFogF.value=scene.fog.far; U.uSun.value.copy(sunD); }
  if (IS.smU){ renderer.getDrawingBufferSize(IS_DB); IS.smU.uScale.value=IS_DB.y/(2*Math.tan(camera.fov*Math.PI/360)); }
  { const M=vlMats(), gold=IS.moodK==='golden'; M.lantern.emissiveIntensity=gold?1.2:.55; M.win.emissiveIntensity=gold?.45:.16; IS.halos.forEach(h=>{ h.visible=gold; }); }
  // 배 · 기중기 · 컨베이어 · 등대 · 분수
  IS.boats.forEach((b,i)=>{ b.g.position.y=Math.sin(real*1.2+b.ph)*b.amp-.05; b.g.rotation.z=Math.sin(real*.9+b.ph)*.03; b.g.rotation.x=Math.sin(real*.7+b.ph)*.015; });
  if (IS.crane) IS.crane.rotation.y=Math.sin(real*.25)*.9;
  if (IS.convey){ const C=IS.convey; C.belt.offset.x=-(real*.4)%1; C.boxes.forEach((b,i)=>{ const t=((real*.4/C.L*1.2+i/C.boxes.length)%1); b.position.x=C.x0+t*C.L; b.position.y=1.1-(t>.95?(t-.95)*6:0); b.visible=t<.99; }); }
  if (IS.lhBeam){ IS.lhBeam.rotation.y=real*.9; const gold=IS.moodK==='golden'; IS.lhBeam.visible=gold; IS.lhLamp.material.color.setHex(gold?0xfff2b0:0xd8dccf); }
  if (IS.spray){ IS.spray.scale.y=1+.12*Math.sin(real*8); IS.spray.material.opacity=.38+.12*Math.sin(real*5); }
  // 여객선: 들어오고 · 기다리고 · 나가요
  const F=IS.ferry; if (F && play){
    if (F.st==='in'){ F.t+=dt; const k=Math.min(1,F.t/7), e=1-Math.pow(1-k,3); F.g.position.set(IS_FERRY.x,0,IS_FERRY.z-60*(1-e)); if (k>=1) F.st='dock'; }
    else if (F.st==='out'){ F.t+=dt; const k=Math.min(1,F.t/7), e=k*k*k; F.g.position.set(IS_FERRY.x,0,IS_FERRY.z-60*e); if (k>=1){ F.st='away'; F.g.visible=false; } }
    if (F.g.visible){ F.g.position.y=Math.sin(real*1.3)*.1-.05; F.g.rotation.z=Math.sin(real*1.1)*.025; } }
  // 관광객 애니메이션 · 표시
  const T=W.isl&&W.isl.tour; if (T&&T.c){ T.c.mixer.update(W.paused?0:dt); if (T.mk){ T.mk.visible=play&&T.st==='wait'; if (T.mk.visible) T.mk.position.set(T.x,3.1+Math.sin(real*3)*.12,T.z); } }
  // 택배 상자 · 빠른 배송 반짝이
  for (const p of parcels){ if (p.state==='ground'){ p.mesh.rotation.y=real*1.2; p.mesh.position.y=.75+Math.sin(real*3+p.x)*.12; p.ring.material.opacity=.45+Math.sin(real*4)*.2; }
    if (p.express && play && Math.random()<.18){ const wp=p.state==='carried'?{x:P.x,y:2.9,z:P.z}:p.state==='ground'?{x:p.x,y:1,z:p.z}:null; if (wp) fx.burst(wp.x+rnd(-.3,.3),wp.y+rnd(-.2,.3),wp.z+rnd(-.3,.3),0xfff0a0,1,1.2); } }
  // 배달지 · 안내지: 빛기둥 · 화살표 · 이름표(목적지와 가까운 곳만)
  const S=W.isl, c=S&&S.carry&&play, tg=T&&T.st==='follow'&&T.dest>=0&&play;
  islBeam.visible=!!c; islBeam2.visible=!!tg;
  const arrow=(A,h,on,k)=>{ if (!A) return; const far=on&&Math.hypot(h.x-P.x,h.z-P.z)>3; A.visible=far; if (far){ A.position.set(P.x,.14,P.z); A.rotation.y=Math.atan2(h.x-P.x,h.z-P.z); const s2=(1+Math.sin(real*6+k)*.12)*(k?.85:1); A.children[0].scale.setScalar(s2); A.children[1].scale.setScalar(1.22*s2); } };
  if (c){ const h=ISL_HOUSES[S.carry.dest]; islBeam.position.set(h.x,18,h.z); islBeam.material.opacity=.24+Math.sin(real*4)*.1; islBeam.rotation.y=real*.5; islBeam.material.color.setHex(S.carry.express?0xffd34d:PARCEL_COL); }
  if (tg){ const h=ISL_HOUSES[T.dest]; islBeam2.position.set(h.x,18,h.z); islBeam2.material.opacity=.22+Math.sin(real*4+1)*.1; }
  arrow(islArrow,c?ISL_HOUSES[S.carry.dest]:null,!!c,0); arrow(islArrow2,tg?ISL_HOUSES[T.dest]:null,!!tg,1.5);
  ISL_HOUSES.forEach((h,i)=>{ const dest=(c&&S.carry.dest===i)||(tg&&T.dest===i), near=Math.hypot(P.x-h.hx,P.z-h.hz)<10; h.tag.visible=!play||dest||near; const sc=dest?1.25+Math.sin(real*5)*.08:1; h.tag.scale.set(3.6*sc,3.6*.218*sc,1); h.tag.position.y=h.ty+(dest?Math.sin(real*3)*.15:0);
    h.edge.material.opacity=dest?1:.7; }); }
/* 발밑 화살표 두 개 (주황 = 택배 · 초록 = 관광객) */
{ const mk=c=>{ const g=new THREE.Group(); const sh=new THREE.Shape(); sh.moveTo(0,.95); sh.lineTo(.5,.25); sh.lineTo(.2,.25); sh.lineTo(.2,-.4); sh.lineTo(-.2,-.4); sh.lineTo(-.2,.25); sh.lineTo(-.5,.25); sh.lineTo(0,.95);
    const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide,depthWrite:false,transparent:true,opacity:.95})); m.rotation.x=Math.PI/2; m.position.z=2.6; g.add(m);
    const o=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:0x18213a,side:THREE.DoubleSide,depthWrite:false})); o.rotation.x=Math.PI/2; o.position.set(0,-.01,2.6); o.scale.setScalar(1.22); g.add(o);
    g.visible=false; scene.add(g); return g; };
  islArrow=mk(PARCEL_COL); islArrow2=mk(TOUR_COL); }

MAP_BUILD.island=()=>buildIsland();
GRASS_OK.island=null;
