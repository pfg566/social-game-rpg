/* 사회 게임 RPG · 🏰 성벽 디펜스 리메이크 (전투 맵 + 평화 모드 '성 지휘관')
   들판 마을(04f) · 마을(04v · 04w)의 그래픽 도구로 지어요.
   북 = 돌 성벽 · 둥근 탑 · 쇠창살 성문 (그 뒤로 성 안 마을 · 성채)
   성문 앞 = 해자 · 도개교 · 바깥 성문 위 🔥 불꽃 포탑 · 해자 속 망루 두 개(❄️ 얼음 포탑 · ⚡ 번개 포탑)
   남 = 세 갈래 길 · 옛 성벽 폐허 · 해골 진영(울타리 · 천막 · 모닥불 · 공성탑)
   놀이: 길 미리보기(빨간 화살표 · 북소리) · 포탑 성격(얼음 = 느리게 · 불꽃 = 범위 · 번개 = 연쇄) · 성문 수리대(O/X) · 공성 망치 보스
   파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */

/* ---------- 다른 파일이 함께 쓰는 값 (성문 · 포탑) ---------- */
const WALL_Z=-14.4, WALL_T=2.4, WALL_H=4.2, DOOR={x:0,z:-12.4}, DOOR_HP=450, TURRET_RANGE=22, TURRET_DMG=35, TURRET_TIME=20, DOOR_HIT=1.5;
const DEF_SEGS=[], TURRETS=[];
let bolts=[], doorG=null, doorMat=null, doorFlash=0;
const DOOR_COL=new THREE.Color(1,1,1), DOOR_DARK=new THREE.Color(.3,.22,.18);

/* ---------- 지도 ---------- */
const DF={built:false,secs:{},halos:[],smoke:[],flames:[],ao:[],zaps:[],beams:[],lanes:[],laneOn:[0,0,0],rep:null,tags:[],moodK:'day',sparks:[]};
const DF_MAP=128, DF_MS=1024;
const DF_MOAT={z0:-11.5,z1:-8.5};                                        // 해자 (둑 바깥쪽 · 물은 -11 ~ -9)
const DF_GATE={hw:3.1,hs:3.2,ha:1.2,zf:-12.9,zb:-15.9,ox:4};             // 성문 구멍: 반폭 · 곧은 옆면 높이 · 아치 높이 · 앞면 · 뒷면 · 성문 건물 반폭
const DF_BARB={z:-7.95,px:3.8,hw:3.2,hs:2.2,ha:.85,h:3.5,ox:4.4,d:1.2};   // 바깥 성문 (위에 불꽃 포탑)
const DF_TOWERS=[{k:'ice',x:-12.5,z:-10},{k:'bolt',x:12.5,z:-10}];       // 해자 속 망루
const DF_ST=[{k:'ice', x:-12.5,z:-4.6,col:0x5cc8f0,hex:'#1b8fb0',title:'❄️ 얼음 포탑 수정',tag:'❄️ 얼음 포탑 · 느리게'},
             {k:'fire',x:0,    z:-3.4,col:0xff6b3d,hex:'#d9481f',title:'🔥 불꽃 포탑 수정',tag:'🔥 불꽃 포탑 · 범위 공격'},
             {k:'bolt',x:12.5, z:-4.6,col:0xffd34d,hex:'#b88a00',title:'⚡ 번개 포탑 수정',tag:'⚡ 번개 포탑 · 연쇄 공격'}];
const DF_REP={x:6.8,z:-5.9,r:2.1};                                        // 성문 수리대 (가까이 가면 O/X)
const DF_LANES=[-20,0,20], DF_WAY={x:0,z:-5.2};                          // 길 세 개 · 바깥 성문 앞 모이는 곳
const DF_LANE_END=L=>({x:L*.08,z:-6.6});
const DF_RUIN_Z=8.6, DF_PAL_Z=35.8;
const DF_CRATERS=[{x:-23,z:-1,r:1.8},{x:19,z:13,r:2.1},{x:-6,z:21,r:1.6},{x:25.5,z:-2,r:1.5},{x:-27,z:16,r:1.7},{x:8,z:27,r:1.5}];
const DF_TREES=[[-30.5,-3.5,1,'gr'],[30.6,-4.2,1.05,'gr'],[-31.4,21.6,1,'gr'],[31.2,23.2,1.05,'yl'],[-27.6,30.4,.9,'gr'],[27.8,30.2,.95,'gr'],[-24.4,1.6,.85,'gr'],[25.2,2.8,.9,'gr'],[-33,13.4,.95,'gr'],[33.2,14.6,.9,'gr']];
const DF_HOUSES=[{x:-11.5,z:-21.2,r:.1,w:8,d:6,roof:'#a2553f',shut:'#3f6b4a'},{x:11.8,z:-21.6,r:-.12,w:8.5,d:6,roof:'#56688c',shut:'#8a3f3f',chim:-1},
  {x:-23.5,z:-21.8,r:.22,w:8,d:6,roof:'#c0703c',shut:'#3f5f8a'},{x:24,z:-22.4,r:-.25,w:8,d:6,roof:'#6d5a8e',shut:'#3f6b4a'},
  {x:-35.5,z:-23.4,r:.35,w:8,d:6,roof:'#b38a3e',shut:'#5a7a3a',chim:-1},{x:36,z:-23.8,r:-.38,w:8,d:6,roof:'#8a5a3c',shut:'#3f5f8a'},
  {x:-14,z:-30.5,r:.05,w:7.5,d:6,roof:'#7a4a3a',shut:'#3f6b4a'},{x:15,z:-30.8,r:-.05,w:7.5,d:6,roof:'#4f6a8a',shut:'#8a3f3f',chim:-1}];
const DF_MOAT_SP=Array.from({length:121},(_,i)=>new THREE.Vector3(-66+i*1.1,0,-10));

/* ---------- 거리 ---------- */
function dfSegD(x,z,ax,az,bx,bz){ const vx=bx-ax, vz=bz-az, L=vx*vx+vz*vz, t=L?Math.max(0,Math.min(1,((x-ax)*vx+(z-az)*vz)/L)):0; return Math.hypot(x-ax-vx*t,z-az-vz*t); }
function dfLaneD(x,z){ let d=1e9; for (const L of DF_LANES){ const e=DF_LANE_END(L); d=Math.min(d,dfSegD(x,z,L,44,e.x,e.z)); } return d-1.65; }
// 몬스터가 성문으로 갈 때: 해자 옆에 끼지 않게 먼저 바깥 성문 앞으로 모여요
function dfGateWay(m){ return (Math.abs(m.x)>2.5 && m.z>-9.2)?DF_WAY:DOOR; }
function dfBed(x,z){ return (z>DF_MOAT.z0+.01&&z<DF_MOAT.z1-.01)?-1.05:0; }

/* ---------- 작은 도구 ---------- */
const dfCyl=(rt,rb,h,seg,sc,open)=>vlUVScale(new THREE.CylinderGeometry(rt,rb,h,seg||24,1,!!open),2*Math.PI*Math.max(rt,rb)/(sc||3.2),h/(sc||3.2));
function dfRod(put,mat,a,b,r,seg){ const dx=b[0]-a[0], dy=b[1]-a[1], dz=b[2]-a[2], L=Math.hypot(dx,dy,dz)||1;
  const m=put(new THREE.CylinderGeometry(r,r,L,seg||6),mat,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(dx/L,dy/L,dz/L)); return m; }
function dfLabel(text,hex,w){ w=w||4.4;
  const t=vlTex(vlCanvas(512,112,c=>{ c.fillStyle='rgba(24,28,40,.82)'; roundRect(c,6,6,500,100,50); c.fill(); c.fillStyle=hex; roundRect(c,6,6,500,100,50); c.globalAlpha=.25; c.fill(); c.globalAlpha=1;
    c.fillStyle='#fff6dc'; c.font='bold 50px Jua, "Malgun Gothic", sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(text,256,60); }));
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false})); sp.scale.set(w,w*.218,1); sp.visible=false; sp.renderOrder=5; return sp; }
// 깃발 · 휘장: 아래쪽이 바람에 살랑여요 (한 덩어리로 합쳐도 돼요)
function dfClothMat(tex){ const m=new THREE.MeshStandardMaterial({map:tex,roughness:.85,side:THREE.DoubleSide,alphaTest:.5});
  m.onBeforeCompile=sh=>{ sh.uniforms.uTime=NAT_U.uTime; sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\n float sw=1.-uv.y; transformed.z+=sin(uTime*2.1+position.x*1.3+position.y*.6)*.09*sw*sw+sin(uTime*3.7+position.x*2.1)*.03*sw;'); };
  m.customProgramCacheKey=()=>'dfcloth'; return m; }
function dfBannerTex(skull){ return vlTex(vlCanvas(128,320,g=>{ const W=128,H=320;
  g.beginPath(); g.moveTo(0,0); g.lineTo(W,0); g.lineTo(W,H); g.lineTo(W/2,H-44); g.lineTo(0,H); g.closePath();
  g.fillStyle=skull?'#2c2134':'#23458f'; g.fill(); g.save(); g.clip();
  for (let i=0;i<5;i++){ const gr=g.createLinearGradient(i*26,0,i*26+26,0); gr.addColorStop(0,'rgba(0,0,0,.14)'); gr.addColorStop(.5,'rgba(255,255,255,.07)'); gr.addColorStop(1,'rgba(0,0,0,.14)'); g.fillStyle=gr; g.fillRect(i*26,0,26,H); }
  g.restore(); g.lineWidth=9; g.strokeStyle=skull?'#5d4a6e':'#e0b84a'; g.stroke();
  if (skull){ g.fillStyle='#e9e0c8'; g.beginPath(); g.arc(64,120,30,0,7); g.fill(); g.fillRect(46,138,36,26); g.fillStyle='#2c2134'; g.beginPath(); g.arc(52,120,9,0,7); g.arc(76,120,9,0,7); g.fill();
    g.beginPath(); g.moveTo(64,128); g.lineTo(59,140); g.lineTo(69,140); g.fill(); for (let i=0;i<4;i++) g.fillRect(49+i*9,152,3,12);
    g.strokeStyle='#e9e0c8'; g.lineWidth=8; g.lineCap='round'; g.beginPath(); g.moveTo(30,190); g.lineTo(98,240); g.moveTo(98,190); g.lineTo(30,240); g.stroke(); }
  else { g.fillStyle='#e0b84a'; g.fillRect(40,92,48,74); for (let i=0;i<4;i++) g.fillRect(36+i*16,80,10,16); g.fillStyle='#23458f'; g.beginPath(); g.moveTo(54,166); g.lineTo(54,140); g.arc(64,140,10,Math.PI,0); g.lineTo(74,166); g.fill();
    g.fillRect(50,104,7,12); g.fillRect(71,104,7,12); g.fillStyle='#f3ead2'; g.beginPath(); g.moveTo(64,196); g.lineTo(72,212); g.lineTo(64,228); g.lineTo(56,212); g.fill(); } })); }

/* ---------- 땅: 풀밭 · 흙길 · 그을린 땅 (들판 마을 땅 셰이더를 이 맵에 맞춰 썼어요) ---------- */
function dfGround(R){
  const S=DF_MS, mp=v=>(v/DF_MAP+.5)*S, k=S/DF_MAP;
  const line=(g,ax,az,bx,bz,wd,bl,a)=>{ g.save(); g.filter=`blur(${bl}px)`; g.globalAlpha=a==null?1:a; g.lineWidth=wd*k; g.lineCap='round'; g.beginPath(); g.moveTo(mp(ax),mp(az)); g.lineTo(mp(bx),mp(bz)); g.stroke(); g.restore(); };
  const disc=(g,x,z,r,a,bl)=>{ g.save(); g.filter=`blur(${bl==null?4:bl}px)`; g.globalAlpha=a; g.beginPath(); g.arc(mp(x),mp(z),r*k,0,7); g.fill(); g.restore(); };
  const rect=(g,x0,z0,x1,z1,a,bl)=>{ g.save(); g.filter=`blur(${bl==null?3:bl}px)`; g.globalAlpha=a; g.fillRect(mp(x0),mp(z0),(x1-x0)*k,(z1-z0)*k); g.restore(); };
  // R: 흙 (길 · 광장 · 둔덕 · 진영 · 성 안 거리) · G: 접지 그늘 · B: 그을린 땅 (포탄 구덩이 · 불탄 자리)
  const cR=vlCanvas(S,S,g=>{ g.fillStyle='#000'; g.fillRect(0,0,S,S); g.strokeStyle=g.fillStyle='#fff';
    DF_LANES.forEach(L=>{ const e=DF_LANE_END(L); line(g,L,46,e.x,e.z,5,8,.42); line(g,L,46,e.x,e.z,3.3,2.5,1); });
    disc(g,0,-8.5,8.6,.85,6); rect(g,-70,-13.8,70,-8.1,1,2);
    DF_ST.forEach(s=>disc(g,s.x,s.z,3.6,.7,5)); disc(g,DF_REP.x,DF_REP.z-.6,2.9,.75,5);
    rect(g,-70,DF_PAL_Z-1.8,70,72,.5,14); for (let i=0;i<70;i++) disc(g,rnd(-44,44),rnd(DF_PAL_Z-1,54),rnd(1.5,4),.42,8); disc(g,0,41,5.5,.95,6);
    rect(g,-70,-72,70,-15.6,.3,10); rect(g,-2.6,-60,2.6,-15.6,1,2); rect(g,-60,-21.9,60,-18.5,1,2); disc(g,0,-20,5,.9,4);
    for (let i=0;i<34;i++) disc(g,rnd(-34,34),DF_RUIN_Z+rnd(-1.8,1.8),rnd(.6,1.8),.32,6); disc(g,-16,18,3,.55,6);
    DF_CRATERS.forEach(c=>disc(g,c.x,c.z,c.r+.9,.55,5)); });
  const cG=vlCanvas(S,S,g=>{ g.fillStyle='#fff'; g.fillRect(0,0,S,S); });
  const cB=vlCanvas(S,S,g=>{ g.fillStyle='#000'; g.fillRect(0,0,S,S); g.fillStyle=g.strokeStyle='#fff';
    DF_CRATERS.forEach(c=>{ disc(g,c.x,c.z,c.r*.72,.9,4); g.save(); g.filter='blur(3px)'; g.globalAlpha=.55; g.lineWidth=.55*k; g.beginPath(); g.arc(mp(c.x),mp(c.z),c.r*k,0,7); g.stroke(); g.restore(); });
    disc(g,0,41,3.4,.9,6); disc(g,-16,18,2.4,.8,5); disc(g,0,-7.6,2.6,.35,8);
    for (let i=0;i<16;i++) disc(g,rnd(-34,34),rnd(-2,32),rnd(.8,2.2),.3,8); });
  DF.gcv={R:cR,G:cG,B:cB,S,mp,k};
  const macro=vlCanvas(512,512,g=>{ g.fillStyle='rgb(128,128,128)'; g.fillRect(0,0,512,512);
    for (let i=0;i<300;i++){ const x=Math.random()*512, y=Math.random()*512, r=10+Math.random()*48, q=Math.random(), c=q<.3?'150,146,92':q<.58?'104,128,96':q<.78?'140,124,92':'118,130,104';
      vlWrapDraw(512,x,y,r,(X,Y)=>{ const gr=g.createRadialGradient(X,Y,0,X,Y,r); gr.addColorStop(0,`rgba(${c},.36)`); gr.addColorStop(1,`rgba(${c},0)`); g.fillStyle=gr; g.fillRect(X-r,Y-r,2*r,2*r); }); } });
  const macroT=vlTexRep(macro,true); macroT.encoding=THREE.LinearEncoding;
  const maskT=new THREE.CanvasTexture(vlCanvas(4,4,()=>{})); DF.mask=maskT;
  const grassT=vlGrassDetail(), dirtT=vlDirtDetail(), noiseT=vlNoiseTex(), MS=DF_MAP.toFixed(1);
  const GU=DF.GU={uGSat:{value:1.12},uGMul:{value:new THREE.Color(.74,.88,.62)},uDSat:{value:1.0},uDMul:{value:new THREE.Color(.84,.77,.68)},uEdge:{value:.3}};
  const mat=new THREE.MeshStandardMaterial({roughness:1,metalness:0});
  mat.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,{tMask:{value:maskT},tNoise:{value:noiseT},tGrassD:{value:grassT},tDirtD:{value:dirtT},tMacro:{value:macroT}},GU);
    sh.vertexShader='varying vec3 vGW;\n'+sh.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n vGW=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader='varying vec3 vGW; uniform sampler2D tMask,tNoise,tGrassD,tDirtD,tMacro; uniform float uGSat,uDSat,uEdge; uniform vec3 uGMul,uDMul;\nvec3 dfSL(vec3 c){ return pow(c,vec3(2.2)); }\nvec3 dfSat(vec3 c,float s){ return max(mix(vec3(dot(c,vec3(.2126,.7152,.0722))),c,s),0.); }\n'+sh.fragmentShader.replace('#include <map_fragment>',`
      vec2 gw=vGW.xz; vec2 muv=vec2(gw.x/${MS}+.5,.5-gw.y/${MS}); vec4 mk=texture2D(tMask,clamp(muv,.001,.999));
      float outside=step(.5,max(abs(muv.x-.5),abs(muv.y-.5))); mk=mix(mk,vec4(0.,1.,0.,1.),outside);
      vec2 tu=gw/3.;
      float n1=texture2D(tNoise,tu*.21).r, n2=texture2D(tNoise,tu*1.63).r;
      float dirt=smoothstep(.40,.60,mk.r+(n1-.5)*.45+(n2-.5)*.18);
      vec3 macro=texture2D(tMacro,gw/${MS}+.5).rgb*2.;
      vec3 gC=dfSat(dfSL(texture2D(tGrassD,tu).rgb)*macro,uGSat)*uGMul;
      vec3 dC=dfSat(dfSL(texture2D(tDirtD,tu*1.37+.31).rgb)*mix(vec3(1.),macro,.4),uDSat)*uDMul;
      float edge=smoothstep(.1,.5,mk.r)*(1.-dirt); gC=mix(gC,gC*vec3(.95,.86,.64),edge*uEdge);
      vec3 col=mix(gC,dC,dirt);
      float burn=smoothstep(.25,.7,mk.b+(n2-.5)*.3);
      vec3 bC=mix(vec3(.05,.042,.034),vec3(.14,.115,.09),n1)*mix(vec3(1.),dfSL(texture2D(tDirtD,tu*1.9).rgb)*1.5,.5);
      col=mix(col,bC,burn*.88);
      col=mix(col,col*vec3(.42,.48,.4),1.-smoothstep(-.6,-.15,vGW.y));
      col*=mix(.45,1.,mk.g);
      diffuseColor.rgb*=col;`); };
  mat.customProgramCacheKey=()=>'dfground';
  const g1=new THREE.PlaneGeometry(DF_MAP,DF_MAP,256,256); g1.rotateX(-Math.PI/2);
  { const p=g1.attributes.position; for (let i=0;i<p.count;i++) p.setY(i,dfBed(p.getX(i),p.getZ(i))); g1.computeVertexNormals(); }
  const inner=new THREE.Mesh(g1,mat); inner.receiveShadow=true; R.add(inner);
  const fs=new THREE.Shape(); fs.moveTo(-320,-320); fs.lineTo(320,-320); fs.lineTo(320,320); fs.lineTo(-320,320); fs.lineTo(-320,-320);
  { const h=DF_MAP/2-.02, hp=new THREE.Path(); hp.moveTo(-h,-h); hp.lineTo(-h,h); hp.lineTo(h,h); hp.lineTo(h,-h); hp.lineTo(-h,-h); fs.holes.push(hp); }
  const og=new THREE.ShapeGeometry(fs); og.rotateX(-Math.PI/2);
  const outer=new THREE.Mesh(og,mat); outer.receiveShadow=true; R.add(outer);
}
// 건물 · 나무 · 소품을 다 놓은 뒤 접지 그늘을 그려 땅 지도를 완성해요
function dfGroundFinish(ao){
  const C=DF.gcv; if (!C) return; const S=C.S, mp=C.mp, k=C.k, g=C.G.getContext('2d');
  const blob=(x,z,r,a)=>{ const R2=r*k, gr=g.createRadialGradient(mp(x),mp(z),0,mp(x),mp(z),R2); gr.addColorStop(0,`rgba(0,0,0,${a})`); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(mp(x)-R2,mp(z)-R2,R2*2,R2*2); };
  const box=(x,z,w,d,r,a)=>{ g.save(); g.translate(mp(x),mp(z)); g.rotate(-r); g.filter='blur(7px)'; g.fillStyle=`rgba(0,0,0,${a})`; g.fillRect(-w/2*k,-d/2*k,w*k,d*k); g.restore(); };
  box(0,-13.1,140,1.2,0,.55); box(0,-8.3,140,.7,0,.35);
  ao.forEach(a=>a.w?box(a.x,a.z,a.w,a.d,a.r||0,a.k):blob(a.x,a.z,a.r,a.k));
  const out=vlCanvas(S,S,gg=>{ const a=C.R.getContext('2d').getImageData(0,0,S,S).data, b=C.G.getContext('2d').getImageData(0,0,S,S).data, c=C.B.getContext('2d').getImageData(0,0,S,S).data, id=gg.createImageData(S,S);
    for (let i=0;i<a.length;i+=4){ id.data[i]=a[i]; id.data[i+1]=b[i]; id.data[i+2]=c[i]; id.data[i+3]=255; } gg.putImageData(id,0,0); });
  DF.mask.image=out; DF.mask.needsUpdate=true; DF.maskData=out.getContext('2d').getImageData(0,0,S,S).data; DF.gcv=null; }

/* ---------- 돌 포장 (광장 · 수정 받침) : 텍스처 하나를 함께 써요 ---------- */
let DF_COB=null;
function dfCobble(R,x,z,r,half){
  if (!DF_COB) DF_COB=gfCobbleTex(0,false);
  const geo=half?new THREE.CircleGeometry(r,48,Math.PI,Math.PI):new THREE.CircleGeometry(r,48); vlUVScale(geo,r*2/3.4);
  const m=new THREE.Mesh(geo,DF.cobM||(DF.cobM=new THREE.MeshStandardMaterial({map:DF_COB,roughness:.92,metalness:0})));
  m.rotation.x=-Math.PI/2; m.position.set(x,.03,z); m.receiveShadow=true; R.add(m);
  if (!half){ const curb=new THREE.Mesh(new THREE.TorusGeometry(r,.18,6,72),GF_CURB||(GF_CURB=new THREE.MeshStandardMaterial({color:0x5e594f,roughness:.95}))); curb.rotation.x=Math.PI/2; curb.scale.z=.45; curb.position.set(x,.04,z); curb.receiveShadow=true; R.add(curb); }
  return m; }

/* ---------- 해자: 돌 둑 · 물 (들판 마을 시냇물과 같은 물) ---------- */
function dfMoat(R,S){
  const M=vlMats(), put=vlPutter(S), B=vlBox;
  for (const z of [-11.27,-8.73]){ put(B(132,1.24,.55,3.2),M.stoneDark,0,-.5,z); put(B(132,.16,.72,1.6),M.stoneLight,0,.06,z); }
  gfWater(R,DF_MOAT_SP,.65,DF); DF.water.position.y=-.3;
  addCol(-31.5,-10,57,3); addCol(31.5,-10,57,3); }

/* ---------- 둥근 탑 (원뿔 지붕 또는 열린 성가퀴) ---------- */
function dfTower(S,x,z,r,h,o){
  o=o||{}; const M=vlMats(), X=gfMats(), g=gfGroup(S,x,z,0), put=vlPutter(g), y0=o.y0||0, H=h-y0;
  put(dfCyl(r+.3,r+.42,.9,24,1.6),M.stoneDark,0,y0+.45,0);
  put(dfCyl(r,r+.08,H,24),M.stone,0,y0+H/2,0);
  if (o.wet) put(dfCyl(r+.04,r+.1,1.25,24,1.6),M.stoneDark,0,-.48,0);   // 물에 잠긴 아랫부분
  put(new THREE.CylinderGeometry(r+.16,r+.16,.24,24),M.stoneLight,0,h-.12,0);
  (o.slits||[[-.55,h*.5],[.55,h*.5]]).forEach(([a,y])=>{ put(vlBox(.17,.85,.1),X.dark,Math.sin(a)*(r+.03),y,Math.cos(a)*(r+.03),0,a,0).castShadow=false; });
  if (o.roof){ const rh=o.rh||r*1.7, rr=r+.55;
    put(new THREE.CylinderGeometry(r+.36,r+.22,.42,24),M.wood,0,h+.19,0);
    put(vlUVScale(new THREE.ConeGeometry(rr,rh,24,1,true),2*Math.PI*rr/2.2,Math.hypot(rh,rr)/2.2),M.roof(o.roof),0,h+.4+rh/2,0);
    put(new THREE.SphereGeometry(.16,10,8),X.gold,0,h+.4+rh+.04,0); put(new THREE.CylinderGeometry(.035,.035,1.5,6),M.iron,0,h+.4+rh+.75,0);
    if (o.flag) DF.flagSpots.push({x,y:h+.4+rh+1.05,z}); }
  else { put(new THREE.CylinderGeometry(r+.1,r+.1,.16,24),M.stoneDark,0,h+.08,0);
    const n=o.merl||10; for (let i=0;i<n;i++){ const a=(i+.5)/n*Math.PI*2; put(vlBox(.6,.72,.42,1.4),M.stone,Math.sin(a)*(r-.1),h+.52,Math.cos(a)*(r-.1),0,a,0); } }
  if (o.col!==false) addCol(x,z,r*1.8,r*1.8);
  DF.ao.push({x,z,r:r+1.6,k:.5}); return g; }

/* ---------- 성벽: 두꺼운 돌벽 · 성가퀴 · 화살 구멍 · 휘장 ---------- */
function dfWallSeg(S,x0,x1){
  const M=vlMats(), X=gfMats(), put=vlPutter(S), B=vlBox, L=x1-x0, cx=(x0+x1)/2, zf=WALL_Z+WALL_T/2, zb=WALL_Z-WALL_T/2;
  put(B(L,WALL_H,WALL_T,3.2),M.stone,cx,WALL_H/2,WALL_Z);
  put(B(L,.75,WALL_T+.5,1.6),M.stoneDark,cx,.37,WALL_Z);
  put(B(L,.22,WALL_T+.28,1.2),M.stoneLight,cx,WALL_H-.06,WALL_Z);
  for (let x=x0+.65;x<x1-.3;x+=1.3){ put(B(.78,.85,.46,1.4),M.stone,x,WALL_H+.42,zf-.23); put(B(.78,.55,.4,1.4),M.stone,x,WALL_H+.27,zb+.2); }
  for (let x=x0+1.8;x<x1-.8;x+=3.3) put(B(.15,.85,.06),X.dark,x,2.35,zf+.02).castShadow=false; }
function dfWall(S,R){
  const M=vlMats(), X=gfMats();
  dfWallSeg(S,-66,-5); dfWallSeg(S,5,66);
  addCol(0,WALL_Z,134,WALL_T);
  [[-24,'#a2553f'],[24,'#a2553f'],[-41,'#4f5f86'],[41,'#4f5f86'],[-58,'#a2553f'],[58,'#a2553f']].forEach(([x,c])=>dfTower(S,x,WALL_Z+.5,2.3,6.2,{roof:c,flag:Math.abs(x)<45,slits:[[-.5,2.4],[.5,2.4],[0,4.3]]}));
  // 휘장 (성벽 앞면에 늘어뜨려요)
  const bm=dfClothMat(dfBannerTex(false)), zf=WALL_Z+WALL_T/2;
  [-31,-17.5,17.5,31,-48,48].forEach(x=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(1.15,2.7,1,8),bm); m.position.set(x,WALL_H-1.45,zf+.04); m.castShadow=true; S.add(m);
    const rod=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.35,6),M.iron); rod.rotation.z=Math.PI/2; rod.position.set(x,WALL_H-.08,zf+.06); S.add(rod); });
  // 망루 꼭대기 깃발 (깃대)
  DF.bannerMat=bm; }

/* ---------- 성문 건물: 아치 · 쇠창살 · 나무 문 · 도개교 ---------- */
function dfDoorTex(){ return vlTex(vlCanvas(512,384,g=>{
  for (let i=0;i<6;i++){ const v=.82+Math.random()*.24, x=i*85.4; g.fillStyle=`rgb(${126*v|0},${84*v|0},${48*v|0})`; g.fillRect(x,0,86,384);
    for (let k=0;k<16;k++){ g.strokeStyle=`rgba(50,28,12,${.12+Math.random()*.16})`; g.lineWidth=1+Math.random()*1.5; g.beginPath(); const xx=x+6+Math.random()*74; g.moveTo(xx,0); g.bezierCurveTo(xx+(Math.random()-.5)*12,128,xx+(Math.random()-.5)*12,256,xx+(Math.random()-.5)*8,384); g.stroke(); }
    g.fillStyle='rgba(28,14,6,.7)'; g.fillRect(x,0,4,384); }
  for (const y of [100,290]){ g.fillStyle='#2b2826'; g.fillRect(0,y,512,24); g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(0,y,512,4); g.fillStyle='#1b1918'; for (let x=20;x<512;x+=42){ g.beginPath(); g.arc(x,y+12,5,0,7); g.fill(); } }
  g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(253,0,6,384); })); }
function dfCrackTex(){ return vlTex(vlCanvas(512,384,g=>{ g.clearRect(0,0,512,384); g.lineCap='round';
  const crack=(x,y,a,len,w)=>{ g.strokeStyle='rgba(20,10,4,.85)'; g.lineWidth=w; g.beginPath(); g.moveTo(x,y); let cx=x, cy=y; for (let i=0;i<8;i++){ a+=(Math.random()-.5)*.9; cx+=Math.cos(a)*len/8; cy+=Math.sin(a)*len/8; g.lineTo(cx,cy); if (Math.random()<.3&&w>2) crack(cx,cy,a+(Math.random()<.5?1:-1)*.9,len*.45,w*.55); } g.stroke(); };
  for (let i=0;i<7;i++) crack(120+Math.random()*270,90+Math.random()*220,Math.random()*6.3,120+Math.random()*90,5);
  for (let i=0;i<4;i++){ const x=110+Math.random()*290, y=120+Math.random()*200, r=14+Math.random()*16; g.fillStyle='rgba(16,8,3,.9)'; g.beginPath(); for (let k=0;k<9;k++){ const a=k/9*6.28, rr=r*(.55+Math.random()*.6); g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.8); } g.closePath(); g.fill(); }
  for (let i=0;i<10;i++){ g.strokeStyle='rgba(60,30,12,.7)'; g.lineWidth=3; const x=60+Math.random()*390, y=60+Math.random()*270; g.beginPath(); g.moveTo(x,y); g.lineTo(x+(Math.random()-.5)*40,y+(Math.random()-.5)*40); g.stroke(); } })); }
function dfArchShape(hw,hs,ha,ox,top){   // 바깥 테두리(ox · top) 안쪽에 아치 구멍이 뚫린 U자 모양
  const s=new THREE.Shape(); s.moveTo(-ox,0); s.lineTo(-ox,top); s.lineTo(ox,top); s.lineTo(ox,0); s.lineTo(hw,0); s.lineTo(hw,hs); s.absellipse(0,hs,hw,ha,0,Math.PI,false); s.lineTo(-hw,0); s.lineTo(-ox,0); return s; }
function dfGatehouse(S,R){
  const M=vlMats(), X=gfMats(), G=DF_GATE, put=vlPutter(S), B=vlBox, top=5.8, depth=G.zf-G.zb;
  // 성문 건물 (아치 구멍)
  { const geo=vlUVScale(new THREE.ExtrudeGeometry(dfArchShape(G.hw,G.hs,G.ha,G.ox,top),{depth,bevelEnabled:false}),1/3.2); put(geo,M.stone,0,0,G.zb); }
  { const vr=new THREE.Shape(), o=.48; vr.moveTo(-G.hw-o,0); vr.lineTo(-G.hw-o,G.hs); vr.absellipse(0,G.hs,G.hw+o,G.ha+o,Math.PI,0,true); vr.lineTo(G.hw+o,0); vr.lineTo(G.hw,0); vr.lineTo(G.hw,G.hs); vr.absellipse(0,G.hs,G.hw,G.ha,0,Math.PI,false); vr.lineTo(-G.hw,0); vr.lineTo(-G.hw-o,0);
    put(vlUVScale(new THREE.ExtrudeGeometry(vr,{depth:.22,bevelEnabled:false}),1/1.6),M.stoneLight,0,0,G.zf); }
  put(B(G.ox*2+.5,.75,depth+.5,1.6),M.stoneDark,0,.37,(G.zf+G.zb)/2);
  // 돌출 성가퀴 · 받침돌 (머리 위에서 돌을 떨어뜨리던 곳)
  put(B(G.ox*2+.6,.7,.62,1.4),M.stone,0,top-.15,G.zf+.22); for (let x=-G.ox+.25;x<=G.ox-.2;x+=.7) put(B(.32,.42,.5,1),M.stoneLight,x,top-.68,G.zf+.12);
  for (let x=-G.ox+.35;x<=G.ox-.3;x+=1.3){ put(B(.74,.82,.46,1.4),M.stone,x,top+.58,G.zf+.38); put(B(.74,.55,.4,1.4),M.stone,x,top+.27,G.zb+.2); }
  // 문장 (성가퀴 앞)
  { const t=vlTex(vlCanvas(128,160,c=>{ c.fillStyle='#e0b84a'; c.beginPath(); c.moveTo(8,8); c.lineTo(120,8); c.lineTo(120,80); c.quadraticCurveTo(118,138,64,154); c.quadraticCurveTo(10,138,8,80); c.closePath(); c.fill();
      c.fillStyle='#23458f'; c.beginPath(); c.moveTo(18,18); c.lineTo(110,18); c.lineTo(110,80); c.quadraticCurveTo(108,128,64,142); c.quadraticCurveTo(20,128,18,80); c.closePath(); c.fill();
      c.fillStyle='#e0b84a'; c.fillRect(42,52,44,52); for (let i=0;i<4;i++) c.fillRect(38+i*15,42,10,14); c.fillStyle='#23458f'; c.fillRect(56,82,16,22); }));
    const m=new THREE.Mesh(new THREE.PlaneGeometry(.9,1.12),new THREE.MeshStandardMaterial({map:t,roughness:.6,metalness:.2,transparent:true,alphaTest:.3})); m.position.set(0,top-.14,G.zf+.57); S.add(m); }
  // 양쪽 성문 탑 (원뿔 지붕 · 깃발)
  for (const s of [-1,1]) dfTower(S,s*5,-13.9,2.2,6.8,{roof:'#4f5f86',rh:3.6,flag:true,slits:[[-.4,2.6],[.6*s,4.6]]});
  addCol(0,(G.zf+G.zb)/2,G.ox*2,depth);
  // 나무 문 · 쇠창살 · 금 간 자국 (흔들릴 수 있게 한 묶음)
  doorG=new THREE.Group(); R.add(doorG);
  doorMat=new THREE.MeshStandardMaterial({map:dfDoorTex(),roughness:.85});
  { const ds=new THREE.Shape(); ds.moveTo(-G.hw,0); ds.lineTo(G.hw,0); ds.lineTo(G.hw,G.hs); ds.absellipse(0,G.hs,G.hw,G.ha,0,Math.PI,false); ds.lineTo(-G.hw,0);
    const dg=new THREE.ExtrudeGeometry(ds,{depth:.3,bevelEnabled:false}); { const uv=dg.attributes.uv; for (let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)/(G.hw*2)+.5,uv.getY(i)/(G.hs+G.ha)); uv.needsUpdate=true; }
    const door=new THREE.Mesh(dg,doorMat); door.position.z=-13.9; door.castShadow=door.receiveShadow=true; doorG.add(door);
    const cg=new THREE.ShapeGeometry(ds); { const uv=cg.attributes.uv; for (let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)/(G.hw*2)+.5,uv.getY(i)/(G.hs+G.ha)); uv.needsUpdate=true; }
    DF.crack=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({map:dfCrackTex(),transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    DF.crack.position.z=-13.58; doorG.add(DF.crack);
    for (const s of [-1,1]){ const rg=new THREE.Mesh(new THREE.TorusGeometry(.2,.045,8,18),M.iron); rg.position.set(s*.5,1.7,-13.55); doorG.add(rg); } }
  { const pc=new THREE.Group(), pp=vlPutter(pc), ay=x=>G.hs+G.ha*Math.sqrt(Math.max(0,1-(x/G.hw)*(x/G.hw)));
    for (let x=-G.hw+.25;x<=G.hw-.2;x+=.46){ const h=ay(x)-.06; pp(B(.09,h,.09),M.iron,x,h/2,0); pp(new THREE.ConeGeometry(.07,.22,5),M.iron,x,-.06,0,Math.PI,0,0); }
    for (let y=.55;y<G.hs+G.ha-.25;y+=.62){ const w=y<=G.hs?G.hw*2-.1:2*G.hw*Math.sqrt(Math.max(0,1-((y-G.hs)/G.ha)*((y-G.hs)/G.ha)))-.1; pp(B(w,.08,.11),M.iron,0,y,0); }
    vlMerge(pc); pc.position.z=-13.25; doorG.add(pc); DF.portcullis=pc; }
  // 도개교 (해자 위 · 쇠사슬)
  { const z0=G.zf+.05, z1=-8.05, L=z0-z1, zc=(z0+z1)/2;
    put(B(6.1,.2,L,2.4),X.plank,0,-.08,zc); for (const s of [-1,1]) put(B(.14,.16,L+.02,1),M.iron,s*3.0,-.02,zc);
    for (const z of [z0-.6,zc,z1+.6]) put(B(6.1,.05,.12,1),M.iron,0,.03,z);
    for (const s of [-1,1]){ dfRod(put,M.iron,[s*2.9,.1,-9.1],[s*3.35,4.95,G.zf+.06],.055); put(new THREE.TorusGeometry(.12,.035,6,12),M.iron,s*3.35,4.95,G.zf+.08); } }
  DF.ao.push({x:0,z:-14.4,w:9,d:4.2,k:.55}); }

/* ---------- 바깥 성문 (도개교 남쪽 끝 · 위에 불꽃 포탑) ---------- */
function dfBarbican(S){
  const M=vlMats(), b=DF_BARB, put=vlPutter(S), B=vlBox;
  put(vlUVScale(new THREE.ExtrudeGeometry(dfArchShape(b.hw,b.hs,b.ha,b.ox,b.h),{depth:b.d,bevelEnabled:false}),1/3.2),M.stone,0,0,b.z-b.d/2);
  for (const s of [-1,1]){ put(B(1.5,.7,1.6,1.4),M.stoneDark,s*b.px,.35,b.z); put(B(1.4,.2,1.4,1),M.stoneLight,s*b.px,2.15,b.z); }
  put(B(b.ox*2+.3,.2,b.d+.3,1.2),M.stoneLight,0,b.h-.02,b.z);
  for (let x=-b.ox+.35;x<=b.ox-.3;x+=1.18){ for (const s of [-1,1]) put(B(.66,.62,.36,1.4),M.stone,x,b.h+.39,b.z+s*(b.d/2-.05)); }
  for (const s of [-1,1]) put(B(.36,.62,.66,1.4),M.stone,s*(b.ox-.05),b.h+.39,b.z);
  // 횃대 (기둥 앞)
  for (const s of [-1,1]){ const x=s*b.px; put(B(.08,.08,.45),M.iron,x,2.55,b.z+b.d/2+.2); put(new THREE.CylinderGeometry(.13,.07,.28,8),M.iron,x,2.7,b.z+b.d/2+.42); DF.fireSpots.push({x,y:2.86,z:b.z+b.d/2+.42,s:.42}); }
  for (const s of [-1,1]) addCol(s*b.px,b.z,b.ox-b.hw,b.d);
  DF.ao.push({x:0,z:b.z,w:b.ox*2+1,d:b.d+1.4,k:.45}); }

/* ---------- 포탑: 얼음(왼쪽 망루) · 불꽃(바깥 성문 위) · 번개(오른쪽 망루) ---------- */
const DF_FLAME=[new THREE.MeshBasicMaterial({color:0xff6a1a,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),
                new THREE.MeshBasicMaterial({color:0xffc24a,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false})];
const DF_FLAMEG=new THREE.ConeGeometry(1,1,9,1,true).translate(0,.5,0);
// 불꽃 한 무더기 (원뿔 겹치기 · 빛무리)
function dfFire(par,x,y,z,s,o){ o=o||{}; const g=new THREE.Group(); g.position.set(x,y,z); par.add(g);
  const cones=[]; for (let i=0;i<(o.n||4);i++){ const inner=i%2===1, m=new THREE.Mesh(DF_FLAMEG,DF_FLAME[inner?1:0]); const a=i/(o.n||4)*6.28, r=inner?0:s*.18;
    m.position.set(Math.cos(a)*r,0,Math.sin(a)*r); m.userData={r:s*(inner?.32:.42),h:s*(inner?1.1:1.5),ph:Math.random()*6.28}; m.renderOrder=3; g.add(m); cones.push(m); }
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:vlGlowTex(),color:o.col||0xffa040,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
  halo.position.y=s*.6; halo.scale.setScalar(s*(o.halo||4)); g.add(halo);
  const F={g,cones,halo,s,k:1,big:o.big||1,hs:s*(o.halo||4)}; DF.flames.push(F); return F; }
function dfTurret(R,kind,x,y,z){
  const M=vlMats(), X=gfMats(), col={ice:0x5cc8f0,fire:0xff6b3d,bolt:0xffd34d}[kind], g=new THREE.Group(); g.position.set(x,y,z); R.add(g);
  const put=vlPutter(g), B=vlBox;
  const gemMat=new THREE.MeshStandardMaterial({color:0x7d8594,emissive:0x000000,emissiveIntensity:.9,roughness:.15,metalness:.1,flatShading:true});
  let gy=1.6, gem, extra={};
  if (kind==='ice'){
    put(new THREE.CylinderGeometry(.58,.76,.45,8),M.stoneLight,0,.22,0); put(new THREE.CylinderGeometry(.44,.52,.32,8),M.stoneDark,0,.6,0);
    const cm=new THREE.MeshStandardMaterial({color:0xbfe8f5,emissive:0x3a8aa8,emissiveIntensity:.25,roughness:.08,metalness:.05,flatShading:true});
    for (let i=0;i<6;i++){ const a=i/6*6.28; put(new THREE.OctahedronGeometry(.17,0),cm,Math.cos(a)*.4,.92,Math.sin(a)*.4,rnd(-.35,.35),a,rnd(-.45,.45)).scale.set(.7,1.9,.7); }
    for (let i=0;i<3;i++){ const arc=put(new THREE.TorusGeometry(.78,.045,5,18,Math.PI),M.iron,0,.62,0); arc.rotation.set(0,i/3*Math.PI,0); }
    gem=new THREE.Mesh(new THREE.OctahedronGeometry(.52,0),gemMat); gem.scale.set(.7,1.55,.7); gy=1.75; extra.small=cm;
  } else if (kind==='fire'){
    for (let i=0;i<3;i++){ const a=i/3*6.28+.5; dfRod(put,M.iron,[Math.cos(a)*.66,0,Math.sin(a)*.66],[Math.cos(a)*.3,.82,Math.sin(a)*.3],.05); }
    put(new THREE.LatheGeometry([[0,0],[.42,.02],[.62,.22],[.72,.46],[.66,.48],[.56,.32],[0,.28]].map(([a,b])=>new THREE.Vector2(a,b)),18),M.iron,0,.74,0);
    put(new THREE.TorusGeometry(.69,.05,6,22),M.iron,0,1.2,0,Math.PI/2,0,0);
    const coal=new THREE.MeshStandardMaterial({color:0x2a1206,emissive:0xff4a10,emissiveIntensity:.9,roughness:1}); put(new THREE.SphereGeometry(.56,12,6,0,6.283,0,1.05),coal,0,.92,0).castShadow=false;
    extra.fire=dfFire(g,0,1.1,0,.55,{n:5,halo:4.6}); extra.coal=coal;
    gem=new THREE.Mesh(new THREE.OctahedronGeometry(.48,0),gemMat); gem.scale.set(.7,1.45,.7); gy=2.15;
  } else {
    put(new THREE.CylinderGeometry(.5,.62,.34,10),M.stoneDark,0,.17,0);
    put(new THREE.CylinderGeometry(.16,.2,1.0,10),X.bronze,0,.82,0);
    for (let i=0;i<4;i++) put(new THREE.TorusGeometry(.31-i*.03,.045,6,18),X.bronze,0,.5+i*.2,0,Math.PI/2,0,0);
    put(new THREE.SphereGeometry(.3,14,10),X.bronze,0,1.5,0);
    const sm=new THREE.LineBasicMaterial({color:0xfff2b0,transparent:true,opacity:.95,toneMapped:false});
    extra.sparks=[0,1,2].map(()=>{ const ln=new THREE.Line(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(18),3)),sm); ln.position.y=1.5; ln.visible=false; ln.frustumCulled=false; g.add(ln); return ln; });
    gem=new THREE.Mesh(new THREE.OctahedronGeometry(.46,0),gemMat); gem.scale.set(.7,1.45,.7); gy=2.12;
  }
  gem.position.y=gy; g.add(gem);
  const om=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.9,toneMapped:false});
  const orbit=new THREE.Mesh(new THREE.TorusGeometry(.95,.035,6,48),om), orbit2=new THREE.Mesh(new THREE.TorusGeometry(1.15,.03,6,48),om); orbit.position.y=orbit2.position.y=gy; g.add(orbit,orbit2);
  const light=new THREE.PointLight(col,0,13,2); light.position.y=gy; g.add(light);
  const t={kind,x,y:y+gy,z,color:col,title:{ice:'얼음 포탑',fire:'불꽃 포탑',bolt:'번개 포탑'}[kind],until:0,cd:0,g,gem,gemMat,orbit,orbit2,light,gy,kick:0,extra,
    boltMat:new THREE.MeshBasicMaterial({color:kind==='ice'?0xc8f4ff:kind==='fire'?0xff8a2a:0xfff2a0,toneMapped:false})};
  TURRETS.push(t); return t; }
function dfTurrets(S,R){
  DF_TOWERS.forEach(o=>dfTower(S,o.x,o.z,1.75,3.2,{y0:-1.1,wet:true,merl:9,col:false,slits:[[0,1.6],[-.8,1.6],[.8,1.6]]}));
  const T={ice:dfTurret(R,'ice',DF_TOWERS[0].x,3.2,DF_TOWERS[0].z),fire:dfTurret(R,'fire',0,DF_BARB.h,DF_BARB.z),bolt:dfTurret(R,'bolt',DF_TOWERS[1].x,3.2,DF_TOWERS[1].z)};
  return T; }

/* ---------- 포탑 수정 3개 · 성문 수리대 ---------- */
function dfStations(R,T){
  DF.tags=[];
  DF_ST.forEach(o=>{ dfCobble(R,o.x,o.z,2.8,false); makeStation('any',o.x,o.z,o.col,{title:o.title,hex:o.hex,turret:T[o.k]});
    const st=stations[stations.length-1];
    st.g.children.forEach(m=>{ if (m.isMesh&&m.material&&m.material.isMeshToonMaterial&&m.material.color&&m.material.color.getHex()<0x707070) m.material=vlMats().stoneDark; });
    const sp=dfLabel(o.tag,o.hex); sp.position.set(o.x,5.1,o.z); R.add(sp); DF.tags.push({sp,st}); }); }
function dfRepair(S,R){
  const M=vlMats(), X=gfMats(), bx=DF_REP.x, bz=DF_REP.z-1.6, g=gfGroup(S,bx,bz,0), put=vlPutter(g), B=vlBox;
  put(B(2.2,.12,.8,1),M.woodLight,0,.86,0); for (const sx of [-.95,.95]) for (const sz of [-.3,.3]) put(B(.12,.86,.12,.6),M.wood,sx,.43,sz);
  put(B(2.0,.08,.6,1),M.wood,0,.3,0);
  for (let i=0;i<3;i++) put(B(1.5,.06,.22,1),X.plank,-.15+rnd(-.05,.05),.95+i*.065,-.12+rnd(-.04,.04),0,rnd(-.06,.06),0);
  put(B(.05,.05,.5),M.wood,.72,.95,.18,0,.5,0); put(B(.24,.1,.1),M.iron,.84,.97,-.03,0,.5,0);
  put(B(.62,.02,.18),M.iron,-.6,.93,.24,0,-.2,0); put(B(.16,.06,.1),M.wood,-.98,.94,.3,0,-.2,0);
  put(new THREE.CylinderGeometry(.34,.38,.56,10),M.wood,-1.75,.28,.55); put(B(.62,.24,.28,.6),M.iron,-1.75,.68,.55); put(new THREE.ConeGeometry(.12,.34,6),M.iron,-1.32,.68,.55,0,0,-Math.PI/2);
  for (let i=0;i<3;i++) for (let j=0;j<3-i;j++) put(new THREE.CylinderGeometry(.16,.16,1.9,8),M.woodLight,2.0,.17+i*.29,-.3+(j-1+i*.5)*.3,0,0,Math.PI/2);
  { const bg=gfGroup(g,1.35,.62,0); vlBarrel(0,0,bg,.8); }
  addCol(bx,bz,2.5,.95); addCol(bx+2.0,bz-.3,1.95,.85);
  DF.ao.push({x:bx,z:bz,w:3.4,d:1.6,k:.45});
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.45,2.0,48),new THREE.MeshBasicMaterial({color:0xffa020,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
  ring.rotation.x=-Math.PI/2; ring.position.set(DF_REP.x,.08,DF_REP.z); R.add(ring);
  const sp=dfLabel('🔨 성문 수리 · O/X','#9a5b22',3.9); sp.position.set(DF_REP.x,2.9,DF_REP.z-.9); R.add(sp);
  const ham=new THREE.Group(); { const hp=vlPutter(ham); hp(B(.08,.62,.08),M.woodLight,0,0,0); hp(B(.36,.15,.15),new THREE.MeshStandardMaterial({color:0xffc04a,emissive:0xff9a20,emissiveIntensity:.8,metalness:.5,roughness:.35}),0,.32,0); }
  ham.position.set(DF_REP.x,1.9,DF_REP.z-1.0); ham.rotation.z=.5; R.add(ham);
  DF.rep={ring,sp,ham,next:0,told:false,warned:false};
  addNpc('rogue',bx-.4,bz-.75,0); }

/* ---------- 길 미리보기: 빨간 화살표 ---------- */
function dfLanes(R){
  const sh=new THREE.Shape(); sh.moveTo(-1,-.25); sh.lineTo(0,.65); sh.lineTo(1,-.25); sh.lineTo(.62,-.47); sh.lineTo(0,.1); sh.lineTo(-.62,-.47); sh.lineTo(-1,-.25);
  const geo=new THREE.ShapeGeometry(sh); geo.rotateX(-Math.PI/2);
  DF.lanes=DF_LANES.map(L=>{ const e=DF_LANE_END(L), ax=L, az=31, len=Math.hypot(e.x-ax,e.z-az), ux=(e.x-ax)/len, uz=(e.z-az)/len, ry=Math.atan2(-ux,-uz), list=[];
    for (let s=0;s<len-4;s+=3.3){ const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xff1e0e,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
      const o=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x4a0804,transparent:true,opacity:0,depthWrite:false})); o.scale.setScalar(1.22); o.position.y=-.01; o.renderOrder=1; m.add(o); m.userData.o=o;
      m.position.set(ax+ux*s,.1,az+uz*s); m.rotation.y=ry; m.scale.setScalar(1.5); m.visible=false; m.renderOrder=2; R.add(m); list.push(m); }
    const sk=dfLabel('⚔️ 몰려와요!','#c0281e',3.6); sk.position.set(ax,2.6,az+.5); R.add(sk); list.sk=sk; return list; }); }

/* ---------- 옛 성벽 폐허 (길 세 개는 비워 둬요) ---------- */
function dfRuins(S){
  const M=vlMats(), X=gfMats(), put=vlPutter(S), B=vlBox, z0=DF_RUIN_Z;
  const seg=(x0,x1,h,col)=>{ let x=x0;
    while (x<x1-.3){ const w=Math.min(rnd(.8,1.5),x1-x), hh=h*rnd(.5,1), courses=Math.max(1,Math.round(hh/.5)); let y=0;
      let bw=w, bd=.8; for (let c=0;c<courses;c++){ if (c>0&&Math.random()<.14+.14*c) break; bw=w*rnd(.86,1.02); const bh=rnd(.42,.56); bd=rnd(.74,.9);
        put(B(bw,bh,bd,3.2),c%2?M.stoneDark:M.stone,x+w/2+rnd(-.05,.05),y+bh/2,z0+rnd(-.07,.07),0,rnd(-.05,.05),0); y+=bh; }
      if (Math.random()<.3) put(B(bw*rnd(.4,.7),.04,bd*rnd(.4,.7),1),X.moss,x+w/2+rnd(-.15,.15),y+.015,z0+rnd(-.1,.1),0,rnd(0,3),0);
      x+=w+(Math.random()<.1?rnd(.3,.7):.03); }
    if (col) addCol((x0+x1)/2,z0,x1-x0,.95);
    DF.ao.push({x:(x0+x1)/2,z:z0,w:x1-x0+.8,d:1.8,k:.4}); };
  seg(-34,-27.6,1.9,true); seg(-20.6,-14.2,1.5,true); seg(-5.8,-3.6,.5,false); seg(3.6,5.8,.5,false); seg(14.2,20.6,1.5,true); seg(27.6,34,1.9,true);
  // 무너진 망루 두 개
  for (const s of [-1,1]){ const x=s*24.5, g=gfGroup(S,x,z0,rnd(0,6)), p=vlPutter(g);
    p(dfCyl(1.85,1.95,1.4,18),M.stone,0,.7,0); p(dfCyl(2.1,2.2,.5,18,1.6),M.stoneDark,0,.25,0);
    for (let i=0;i<11;i++){ if (Math.random()<.3) continue; const a=i/11*6.28, h=rnd(.4,1.5); p(B(1,h,.7,3.2),i%2?M.stone:M.stoneDark,Math.cos(a)*1.55,1.4+h/2,Math.sin(a)*1.55,0,-a+Math.PI/2,0); }
    p(new THREE.CircleGeometry(1.5,16),X.moss,0,1.42,0,-Math.PI/2,0,0); addCol(x,z0,3.4,3.4); DF.ao.push({x,z:z0,r:3.4,k:.5}); }
  // 가운데 길: 무너진 옛 성문 기둥
  for (const s of [-1,1]){ const x=s*2.95, g=gfGroup(S,x,z0,0), p=vlPutter(g); const h=s<0?3.4:2.3;
    p(B(1.25,.5,1.25,1.4),M.stoneDark,0,.25,0); p(B(1,h,1,3.2),M.stone,0,.5+h/2,0); p(B(1.12,.18,1.12,1.4),M.stoneDark,0,.5+h+.09,0);
    if (s<0){ const top=.5+h+.18, Rr=2.95, Ry=1.25; [.96,.89,.82,.75,.68].forEach((f,i)=>{ const th=Math.PI*f; p(B(.64,.48,.95,3.2),i%2?M.stoneDark:M.stone,Rr+Math.cos(th)*Rr,top+Math.sin(th)*Ry+.22,0,0,0,Math.atan2(-Ry*Math.cos(th),Rr*Math.sin(th))); }); }
    else p(B(.9,.3,.8,3.2),M.stoneDark,.05,.5+h+.32,.05,0,.4,.12);
    addCol(x,z0,1.05,1.05); }
  // 흩어진 돌덩이
  for (let i=0;i<46;i++){ const x=rnd(-34,34); if (Math.abs(x)<2.2||Math.abs(Math.abs(x)-10)<3.2) continue; const z=z0+(Math.random()<.5?1:-1)*rnd(.9,2.8);
    put(B(rnd(.5,1.05),rnd(.3,.48),rnd(.45,.8),3.2),Math.random()<.5?M.stone:M.stoneDark,x,.16,z,rnd(-.3,.3),rnd(0,3),rnd(-.25,.25)); } }

/* ---------- 들판 소품: 가시 울타리 · 부서진 수레 · 짐 · 깃발 · 포탄 구덩이 ---------- */
function dfField(S,R){
  const M=vlMats(), X=gfMats(), B=vlBox;
  const barricade=(x,z,ry)=>{ const g=gfGroup(S,x,z,ry), p=vlPutter(g);
    p(new THREE.CylinderGeometry(.17,.17,3.6,8),M.wood,0,.55,0,0,0,Math.PI/2);
    for (let i=0;i<5;i++){ const x0=-1.4+i*.7; for (const s of [1,-1]){ for (const e of [1,-1]){ const a=s*.78, dy=Math.cos(a)*.48*e, dz=Math.sin(a)*.48*e;
          const c=p(new THREE.ConeGeometry(.065,.96,6),M.woodLight,x0,.55+dy,dz); c.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(0,dy,dz).normalize()); } } }
    gfColRect(x,z,3.5,1.2,ry); DF.ao.push({x,z,w:3.8,d:1.6,r:ry,k:.35}); };
  barricade(-9.6,-1.4,.45); barricade(9.6,-1.4,-.45); barricade(-20.5,-6.2,-.15); barricade(20.5,-6.2,.15);
  // 부서진 수레 (불 · 연기)
  { const g=gfGroup(S,-16,18,.6), p=vlPutter(g);
    p(B(1.8,.12,1.1,1),M.woodLight,0,.42,0,0,0,.28); for (const s of [1,-1]){ p(B(1.8,.32,.07,1),M.woodLight,0,.62,s*.55,0,0,.28); }
    p(new THREE.TorusGeometry(.42,.05,6,18),M.iron,-.4,.42,.62); p(new THREE.TorusGeometry(.42,.05,6,18),M.iron,.9,.06,-.95,Math.PI/2,0,0);
    for (let k=0;k<3;k++) p(B(.05,.8,.04),M.wood,-.4,.42,.62,0,0,k*Math.PI/3);
    vlBarrel(.9,1.1,g,.75); vlBarrel(-1.4,-.9,g,.7);
    addCol(-16,18,2.4,2.2); DF.ao.push({x:-16,z:18,r:2.4,k:.45}); DF.fireSpots.push({x:-16.2,y:.65,z:18.1,s:.55,smoke:1}); }
  // 짐 (바깥 성문 옆)
  { const box=(x,z,s,ry,y)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(s,s,s),M.crate); m.position.set(x,(y||0)+s/2,z); m.rotation.y=ry; m.castShadow=m.receiveShadow=true; S.add(m); };
    box(-7.2,-7.6,.62,.3); box(-7.8,-7.2,.5,.9); box(-7.4,-7.4,.42,.2,.62); { const bg=gfGroup(S,-8.5,-7.7,0); vlBarrel(0,0,bg,.8); } addCol(-7.8,-7.5,2.2,1.0); }
  // 왕국 깃발 (광장 둘레 깃대)
  for (const [x,z] of [[-9.6,.3],[9.6,.3],[-17,-7.6],[17,-7.6]]){ const p=vlPutter(S); p(new THREE.CylinderGeometry(.06,.07,4.4,8),M.wood,x,2.2,z); p(new THREE.SphereGeometry(.1,8,6),X.gold,x,4.45,z);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(1.0,2.2,1,8),DF.bannerMat); m.position.set(x+.55,3.15,z); m.castShadow=true; S.add(m); addCol(x,z,.3,.3); }
  // 포탄 구덩이 가장자리 돌
  DF_CRATERS.forEach(c=>{ for (let i=0;i<5;i++){ const a=rnd(0,6.3); const m=new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(.14,.26),0),M.stoneDark); m.position.set(c.x+Math.cos(a)*c.r*rnd(.9,1.15),.06,c.z+Math.sin(a)*c.r*rnd(.9,1.15)); m.rotation.set(rnd(0,3),rnd(0,3),0); m.castShadow=true; S.add(m); } });
  // 땅에 꽂힌 화살
  { const D=new THREE.Object3D(), P=[]; for (let i=0;i<80;i++){ let x, z; if (i<36){ x=rnd(-10,10); z=rnd(-7.4,1.5); } else { x=rnd(-32,32); z=DF_RUIN_Z+rnd(-3.2,3.2); } if (dfLaneD(x,z)<-.6&&Math.random()<.5) continue; P.push({x,z,rx:rnd(-.55,.55),rz:rnd(-.55,.55),ry:rnd(0,6.3)}); }
    const sh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.018,.018,.72,4),M.wood,P.length), fl=new THREE.InstancedMesh(new THREE.BoxGeometry(.012,.16,.12),new THREE.MeshStandardMaterial({color:0xe8e0d0,roughness:.9}),P.length);
    P.forEach((a,i)=>{ D.position.set(a.x,.28,a.z); D.rotation.set(a.rx,a.ry,a.rz); D.scale.set(1,1,1); D.updateMatrix(); sh.setMatrixAt(i,D.matrix); D.translateY(.3); D.updateMatrix(); fl.setMatrixAt(i,D.matrix); });
    sh.castShadow=true; R.add(sh, fl); } }

/* ---------- 해골 진영: 통나무 울타리 · 천막 · 모닥불 · 공성탑 · 투석기 ---------- */
function dfTentTex(){ return vlTexRep(vlCanvas(256,256,g=>{ g.fillStyle='#4a3a44'; g.fillRect(0,0,256,256);
  for (let i=0;i<14;i++){ const x=Math.random()*256, y=Math.random()*256, w=30+Math.random()*60, h=20+Math.random()*50; g.fillStyle=['#5a4650','#3e3038','#62544a','#4a4038'][i%4]; g.fillRect(x,y,w,h); g.strokeStyle='rgba(230,220,200,.35)'; g.setLineDash([5,5]); g.strokeRect(x+2,y+2,w-4,h-4); g.setLineDash([]); }
  for (let i=0;i<1500;i++){ g.fillStyle=Math.random()<.5?'rgba(0,0,0,.15)':'rgba(255,255,255,.06)'; g.fillRect(Math.random()*256,Math.random()*256,2,2); } })); }
function dfCamp(S,R){
  const M=vlMats(), X=gfMats(), D=new THREE.Object3D(), z0=DF_PAL_Z;
  // 통나무 울타리 (길 세 개에 문)
  const logs=[]; for (let x=-46;x<=46;x+=.5){ if (DF_LANES.some(L=>Math.abs(x-L)<2.7)) continue; logs.push({x:x+rnd(-.05,.05),z:z0+rnd(-.08,.08),h:rnd(2.5,3.2),r:rnd(.19,.25),rx:rnd(-.05,.05),rz:rnd(-.05,.05)}); }
  { const lm=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,7),M.wood,logs.length), tm=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,7),M.woodLight,logs.length);
    logs.forEach((l,i)=>{ D.position.set(l.x,l.h/2,l.z); D.rotation.set(l.rx,0,l.rz); D.scale.set(l.r,l.h,l.r); D.updateMatrix(); lm.setMatrixAt(i,D.matrix); D.position.set(l.x-l.rz*l.h,l.h+.22,l.z+l.rx*l.h); D.scale.set(l.r,.45,l.r); D.updateMatrix(); tm.setMatrixAt(i,D.matrix); });
    lm.castShadow=tm.castShadow=true; lm.receiveShadow=true; R.add(lm,tm); }
  { const p=vlPutter(S); for (const [a,b] of [[-46,-22.7],[-17.3,-2.7],[2.7,17.3],[22.7,46]]) p(new THREE.CylinderGeometry(.13,.13,b-a,6),M.wood,(a+b)/2,1.9,z0+.3,0,0,Math.PI/2);
    for (const L of DF_LANES) for (const s of [-1,1]){ p(new THREE.CylinderGeometry(.28,.3,4.2,8),M.wood,L+s*2.9,2.1,z0); p(new THREE.ConeGeometry(.3,.55,8),M.woodLight,L+s*2.9,4.45,z0); } }
  // 해골 깃발
  { const sm=dfClothMat(dfBannerTex(true)); for (const L of DF_LANES) for (const s of [-1,1]){ const m=new THREE.Mesh(new THREE.PlaneGeometry(.95,2.1,1,8),sm); m.position.set(L+s*2.9+s*.55,3.0,z0-.35); m.castShadow=true; S.add(m); }
    for (const [x,z] of [[-12,41],[13,40.5],[-28,44],[28,44]]){ const p=vlPutter(S); p(new THREE.CylinderGeometry(.06,.07,4.6,8),M.wood,x,2.3,z); const m=new THREE.Mesh(new THREE.PlaneGeometry(1.0,2.2,1,8),sm); m.position.set(x+.55,3.3,z); S.add(m); } }
  // 천막
  const tt=dfTentTex(), tm=new THREE.MeshStandardMaterial({map:tt,roughness:.95,side:THREE.DoubleSide});
  [[-28,41.5,.3],[-20.5,44.5,-.2],[-6,46,.1],[7,45.5,-.15],[21.5,44,.25],[29,40.5,-.35]].forEach(([x,z,ry])=>{ const g=gfGroup(S,x,z,ry), p=vlPutter(g);
    const tri=new THREE.Shape(); tri.moveTo(-1.7,0); tri.lineTo(1.7,0); tri.lineTo(0,2.2); tri.lineTo(-1.7,0);
    p(vlUVScale(new THREE.ExtrudeGeometry(tri,{depth:3.6,bevelEnabled:false}),1/2.4),tm,0,0,-1.8);
    p(new THREE.CylinderGeometry(.06,.06,2.5,6),M.wood,0,1.25,1.85); p(new THREE.CylinderGeometry(.06,.06,2.5,6),M.wood,0,1.25,-1.85);
    const fl=new THREE.Shape(); fl.moveTo(-.7,0); fl.lineTo(.7,0); fl.lineTo(0,1.6); fl.lineTo(-.7,0); p(new THREE.ShapeGeometry(fl),X.dark,0,0,1.82);
    DF.ao.push({x,z,w:4,d:4.4,r:ry,k:.45}); });
  [[-16,39.8],[17,39.4],[-34,46],[34,46.5]].forEach(([x,z])=>{ const p=vlPutter(S); p(vlUVScale(new THREE.ConeGeometry(1.8,3.3,8,1,true),3,1.4),tm,x,1.65,z); p(new THREE.CylinderGeometry(.05,.05,1,6),M.wood,x,3.6,z); DF.ao.push({x,z,r:2.6,k:.45}); });
  // 모닥불
  { const p=vlPutter(S); for (let i=0;i<9;i++){ const a=i/9*6.28; const m=p(new THREE.DodecahedronGeometry(.3,0),M.stoneDark,Math.cos(a)*1.05,.12,41+Math.sin(a)*1.05); m.scale.y=.6; }
    for (let i=0;i<4;i++){ const a=i/4*Math.PI; p(new THREE.CylinderGeometry(.11,.13,1.6,7),M.wood,0,.25,41,Math.PI/2-.35,a,0); }
    DF.fireSpots.push({x:0,y:.3,z:41,s:1.25,smoke:1,halo:5.5}); }
  // 공성탑 (짓다 만 나무 탑)
  { const g=gfGroup(S,-10.5,42.8,.15), p=vlPutter(g), B=vlBox, H=9;
    for (const sx of [-1.5,1.5]) for (const sz of [-1.5,1.5]) p(B(.26,H,.26,.8),M.wood,sx,H/2,sz);
    for (const y of [3,6,H]){ p(B(3.4,.18,3.4,1.2),X.plank,0,y,0); for (const s of [-1,1]){ p(B(3.2,.14,.14,.8),M.wood,0,y-.5,s*1.5); p(B(.14,.14,3.2,.8),M.wood,s*1.5,y-.5,0); } }
    for (let y=.4;y<H;y+=.5) p(B(.7,.06,.06,.5),M.woodLight,0,y,-1.62);
    for (const s of [-1,1]) dfRod(p,M.wood,[s*1.5,.2,1.5],[-s*1.5,3,1.5],.07);
    p(B(3.6,1.6,.1,1.6),tm,0,H+.9,1.6); p(B(3.6,.1,3.6,1.6),tm,0,H+1.7,0);
    for (const sx of [-1.7,1.7]) for (const sz of [-1.2,1.2]) p(new THREE.CylinderGeometry(.45,.45,.25,12),M.wood,sx,.45,sz,0,0,Math.PI/2);
    DF.ao.push({x:-10.5,z:42.8,w:4.4,d:4.4,k:.5}); }
  // 투석기
  { const g=gfGroup(S,11.5,41.6,-.4), p=vlPutter(g), B=vlBox;
    for (const s of [-1,1]){ p(B(.24,.24,3.4,.8),M.wood,s*.8,.55,0); for (const z of [-1.2,1.2]) p(new THREE.CylinderGeometry(.42,.42,.18,12),M.wood,s*1.0,.42,z,0,0,Math.PI/2); dfRod(p,M.wood,[s*.8,.6,-.6],[s*.8,2.3,.2],.12); dfRod(p,M.wood,[s*.8,.6,1.0],[s*.8,2.3,.2],.12); }
    p(new THREE.CylinderGeometry(.1,.1,1.9,8),M.iron,0,2.3,.2,0,0,Math.PI/2); dfRod(p,M.woodLight,[0,2.3,.2],[0,4.2,-1.5],.12); dfRod(p,M.woodLight,[0,2.3,.2],[0,1.4,1.2],.16);
    p(new THREE.SphereGeometry(.42,10,6,0,6.283,Math.PI/2,Math.PI/2),M.wood,0,4.32,-1.62); p(B(.9,.7,.9,.8),M.wood,0,1.1,1.4);
    for (let i=0;i<5;i++) p(new THREE.DodecahedronGeometry(.32,0),M.stoneDark,2.0+rnd(-.4,.4),.3,rnd(-.6,.6));
    DF.ao.push({x:11.5,z:41.6,w:3,d:4,r:-.4,k:.45}); }
  // 뼈 무더기 · 마른 나무
  { const bm=new THREE.MeshStandardMaterial({color:0xe2d8c0,roughness:.8}), p=vlPutter(S);
    for (const [x,z] of [[-24,38.6],[24.6,38.4],[-4,43.6],[5.4,38.6],[-33,40],[34,39.6]]) for (let i=0;i<6;i++) p(new THREE.CylinderGeometry(.04,.05,rnd(.4,.7),5),bm,x+rnd(-.5,.5),.06,z+rnd(-.4,.4),Math.PI/2,rnd(0,6.3),0); }
  for (const [x,z,s] of [[-38,40.5,1],[38.5,41.5,.9],[-25,49,1.1],[26,49.5,1]]){ const g=gfGroup(S,x,z,rnd(0,6),s), p=vlPutter(g); p(new THREE.CylinderGeometry(.14,.28,3,7),X.deadwood,0,1.5,0,.05,0,.06);
    const br=(y,a,tilt,len,r0)=>{ const b=p(new THREE.CylinderGeometry(r0*.5,r0,len,6),X.deadwood,Math.cos(a)*Math.sin(tilt)*len/2,y+Math.cos(tilt)*len/2,Math.sin(a)*Math.sin(tilt)*len/2); b.rotation.set(0,-a,0); b.rotateZ(-tilt); };
    [[2.3,.3,.8,1.6,.11],[2.6,2.4,.7,1.4,.1],[1.9,4.1,.95,1.2,.09],[2.8,5.3,.5,1.1,.08]].forEach(a=>br(...a)); } }

/* ---------- 성 안 (성벽 뒤): 집 · 시장 노점 · 성채 ---------- */
function dfTown(S){
  const M=vlMats(), X=gfMats(), B=vlBox;
  DF_HOUSES.forEach(H=>{ const g=gfGroup(S,H.x,H.z,0,GF_HS); vlHouse2({...H,x:0,z:0},g); DF.ao.push({x:H.x,z:H.z,w:H.w*GF_HS+1.3,d:H.d*GF_HS+1.6,r:H.r,k:.55}); });
  // 시장 노점
  [[-5.2,-18.6,.1,'#c8433a'],[5.4,-19,-.1,'#2f6fb0'],[-5.4,-23.4,-.05,'#d89a2a'],[5.6,-23.8,.08,'#3a8a4a']].forEach(([x,z,ry,c])=>{ const g=gfGroup(S,x,z,ry), p=vlPutter(g);
    for (const sx of [-1,1]) for (const sz of [-.6,.6]) p(B(.1,2.1,.1,.6),M.wood,sx*1.1,1.05,sz);
    p(B(2.3,.1,1.0,1),M.woodLight,0,.9,.2); p(B(2.2,.7,.9,1),M.woodLight,0,.45,.2);
    const aw=vlMats().cloth.clone(); aw.color=VL_LIN(c); p(B(2.6,.06,1.7,1.4),aw,0,2.2,0,.22,0,0);
    for (let i=0;i<4;i++) p(new THREE.SphereGeometry(.13,8,6),M.flowers[i%5],-.6+i*.4,1.02,.25); });
  // 성채
  { const g=gfGroup(S,0,-33.5,0), p=vlPutter(g), W=10, H=11;
    p(B(W+2,1,W+2,1.6),M.stoneDark,0,.5,0); p(B(W,H,W,3.2),M.stone,0,H/2+.5,0);
    for (const y of [4.6,8.6]) p(B(W+.3,.22,W+.3,1),M.stoneLight,0,y,0);
    for (let i=0;i<8;i++){ const x=-W/2+.65+i*1.25; for (const s of [-1,1]){ p(B(.72,.8,.4,1.4),M.stone,x,H+.9,s*(W/2-.2)); p(B(.4,.8,.72,1.4),M.stone,s*(W/2-.2),H+.9,x); } }
    for (const sx of [-1,1]) for (const sz of [-1,1]){ const x=sx*W/2, z=sz*W/2; p(dfCyl(1.5,1.6,H+3,16),M.stone,x,(H+3)/2+.5,z);
      p(new THREE.CylinderGeometry(1.72,1.6,.3,16),M.wood,x,H+3.6,z); p(vlUVScale(new THREE.ConeGeometry(1.95,3.8,16,1,true),5,2),M.roof(sx<0?'#a2553f':'#4f5f86'),x,H+5.6,z); }
    p(B(4.6,4.2,4.6,3.2),M.stone,0,H+2.6,0); const pr=p(new THREE.ConeGeometry(3.6,4.6,4,1,true),M.roof('#4f5f86'),0,H+7,0); pr.rotation.y=Math.PI/4;
    for (const x of [-2.6,2.6]) for (const y of [3,6.6]) p(new THREE.PlaneGeometry(.7,1.2),M.win,x,y,W/2+.02).castShadow=false;
    const arch=new THREE.Shape(); arch.moveTo(-1,0); arch.lineTo(1,0); arch.lineTo(1,1.8); arch.absarc(0,1.8,1,0,Math.PI,false); arch.lineTo(-1,0); p(new THREE.ShapeGeometry(arch),M.door,0,.5,W/2+.02);
    DF.flagSpots.push({x:0,y:H+9.6,z:-33.5,big:1}); DF.smoke.push({x:3.6,y:H+1.5,z:-35}); }
  // 성벽 안쪽 계단 (성문 양옆)
  for (const s of [-1,1]){ const p=vlPutter(S); for (let i=0;i<8;i++) p(B(1.6,.52,.62,1.4),M.stoneDark,s*(9+i*.62),.26+i*.52,WALL_Z-WALL_T/2-.45); } }

/* ---------- 깃대 깃발 (탑 꼭대기) ---------- */
function dfFlags(S){
  const M=vlMats();
  DF.flagSpots.forEach(f=>{ const w=f.big?2.4:1.3, h=f.big?1.5:.82, m=new THREE.Mesh(new THREE.PlaneGeometry(w,h,6,1),DF.flagMat||(DF.flagMat=(()=>{ const t=vlTex(vlCanvas(256,160,g=>{ g.fillStyle='#23458f'; g.fillRect(0,0,256,160); g.fillStyle='#e0b84a'; g.fillRect(0,0,256,18); g.fillRect(0,142,256,18);
        g.fillRect(96,48,64,64); for (let i=0;i<4;i++) g.fillRect(90+i*20,36,12,16); g.fillStyle='#23458f'; g.fillRect(118,82,20,30); }));
      const fm=new THREE.MeshStandardMaterial({map:t,roughness:.85,side:THREE.DoubleSide});
      fm.onBeforeCompile=sh=>{ sh.uniforms.uTime=NAT_U.uTime; sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n float fu=uv.x; transformed.z+=sin(uTime*3.2-position.x*2.2+position.y)*.16*fu;'); };
      fm.customProgramCacheKey=()=>'dfflag'; return fm; })()));
    m.position.set(f.x+w/2,f.y-h/2,f.z); m.castShadow=true; S.add(m); }); }

/* ---------- 자연: 나무(바람) · 덤불 · 풀 뭉치 · 꽃 · 바위 (들판 마을과 같은 자연 에셋) ---------- */
function dfNature(){
  const by={}, put=(n,p)=>(by[n]=by[n]||[]).push(p), green=['#7cae46','#8fbd4f','#6a9e3c','#86b84a','#5f9438'], yel=['#a8c44a','#c2c84e','#9cb840'];
  const tint=k=>VL_LIN((k==='yl'?yel:green)[(Math.random()*(k==='yl'?yel:green).length)|0]).multiplyScalar(rnd(.9,1.04));
  const free=(x,z,pad)=>z>-7.6+pad&&z<DF_PAL_Z-1-pad&&dfLaneD(x,z)>pad&&Math.hypot(x,z+8.5)>8+pad&&!DF_ST.some(s=>Math.hypot(x-s.x,z-s.z)<3.2+pad)&&Math.hypot(x-DF_REP.x,z-DF_REP.z)>2.6+pad&&!colliders.some(b=>x>b.x0-pad&&x<b.x1+pad&&z>b.z0-pad&&z<b.z1+pad);
  DF_TREES.forEach(([x,z,s,k],i)=>{ put('T'+(i%5+1),{x,z,ry:rnd(0,6.3),s:s*.82,c:tint(k)}); addCol(x,z,.9,.9); DF.ao.push({x:x+1.2,z:z+1.2,r:3.2*s,k:.42}); });
  [[-7,-26.6,.75],[7.6,-27.4,.8],[-29.5,-30,.85],[30,-30.6,.8],[-41,-21,.9],[42,-22,.9]].forEach(([x,z,s],i)=>put('T'+(i%5+1),{x,z,ry:rnd(0,6.3),s,c:tint('gr')}));
  // 들판 가장자리 숲 한 줄 (경계 밖 · 그림자 없음)
  const sec=(x,z)=>z<-20?'n':z>48?'s':x<0?'w':'e';
  const rim=(x,z,s)=>{ const pine=Math.random()<.4, k=sec(x,z); if (pine) put('P'+[1,2,4][(Math.random()*3)|0]+k,{x,z,ry:rnd(0,6.3),s:s*.95}); else put('R'+((Math.random()*5|0)+1)+k,{x,z,ry:rnd(0,6.3),s,c:tint(Math.random()<.2?'yl':'gr')}); DF.ao.push({x:x+.8,z:z+.8,r:3.2*s,k:.42}); };
  for (let z=-6;z<=34;z+=3.3){ rim(-38.6+rnd(-1.2,1.2),z+rnd(-.8,.8),rnd(.95,1.25)); rim(38.6+rnd(-1.2,1.2),z+rnd(-.8,.8),rnd(.95,1.25)); }
  for (let x=-46;x<=46;x+=3.6) rim(x+rnd(-.9,.9),50+rnd(-1.5,1.5),rnd(1,1.35));
  for (let z=-40;z<=-19;z+=3.6){ rim(-46+rnd(-1,1),z,rnd(1,1.3)); rim(46+rnd(-1,1),z,rnd(1,1.3)); }
  for (let i=0;i<40;i++){ const side=i%2, x=(side?1:-1)*(36.6+rnd(-.5,.5)), z=rnd(-6,33); put(Math.random()<.25?'Bush_Common_Flowers':'Bush_Common',{x,z,ry:rnd(0,6.3),s:rnd(.9,1.3),c:tint('gr')}); }
  // 덤불 (폐허 · 들판 가장자리 · 성벽 앞)
  const bush=[[-31,6.6],[-22,10.6],[-16.6,6.4],[16.4,10.6],[22.4,6.6],[31,10.4],[-29,-6.4],[29,-6.6],[-34,1],[34,2],[-33.4,26],[33.6,27.4],[-26.6,22.4],[26,19],[-10.4,30.6],[10.2,31.4],[-8.6,13.6],[9,14.4]];
  bush.forEach(([x,z])=>{ for (let k=0;k<2;k++) put(Math.random()<.25?'Bush_Common_Flowers':'Bush_Common',{x:x+rnd(-.7,.7),z:z+rnd(-.7,.7),ry:rnd(0,6.3),s:rnd(.7,1.05),c:tint('gr')}); });
  const scatter=(n,cnt,sMin,sMax,where,pad)=>{ let k=0, t=0; while (k<cnt&&t<cnt*40){ t++; const [x,z]=where(); if (Math.abs(x)>40) continue; if (!free(x,z,pad)) continue; put(n,{x,z,ry:rnd(0,6.3),s:rnd(sMin,sMax)}); k++; } };
  const any=()=>[rnd(-38,38),rnd(-7,34)], nearT=()=>{ const t=DF_TREES[(Math.random()*DF_TREES.length)|0], a=rnd(0,6.3), r=rnd(1,3.6); return [t[0]+Math.cos(a)*r,t[1]+Math.sin(a)*r]; };
  const edge=()=>{ const L=DF_LANES[(Math.random()*3)|0], e=DF_LANE_END(L), t=Math.random(), x=L+(e.x-L)*t, z=44+(e.z-44)*t, s=Math.random()<.5?1:-1; return [x+s*rnd(2,3.8),z+rnd(-.5,.5)]; };
  const ruin=()=>[rnd(-34,34),DF_RUIN_Z+(Math.random()<.5?1:-1)*rnd(.8,2.6)];
  scatter('Grass_Wispy_Tall',240,.24,.4,any,.4); scatter('Grass_Common_Tall',200,.22,.36,any,.4); scatter('Grass_Wispy_Short',150,.24,.4,edge,.25); scatter('Grass_Common_Tall',70,.25,.4,ruin,.2);
  scatter('Flower_3_Group',40,.22,.32,edge,.35); scatter('Flower_4_Group',36,.2,.3,any,.5); scatter('Fern_1',36,.1,.14,nearT,.5); scatter('Mushroom_Common',22,.5,.8,nearT,.4); scatter('Clover_2',70,.28,.4,any,.3);
  [[-12.6,18.4,.5],[13.8,22,.45],[-28.4,-1.6,.55],[28.6,17,.5],[-3.6,28.8,.4],[4.4,16,.4],[-33,30,.55],[33.4,-1,.6],[-19.6,-3.4,.45],[19.4,25.6,.5]].forEach(([x,z,s],i)=>{ put('Rock_Medium_'+(i%3+1),{x,z,ry:rnd(0,6.3),s}); addCol(x,z,s*2,s*2); });
  for (let i=0;i<120;i++){ const [x,z]=Math.random()<.6?edge():ruin(); if (!free(x,z,.05)) continue; put('Pebble_Round_'+(i%2+1),{x,y:.01,z,ry:rnd(0,6.3),s:rnd(.4,.9)}); }
  DF.natPlan=by; dfNatInst(); }
function dfNatInst(){
  const by=DF.natPlan; if (!by||DF.natDone) return; if (!GF_NAT.every(n=>VL.nat[n])){ GF_NATP.then(()=>{ if (!DF.natDone) within('defense',dfNatInst); }); return; }
  DF.natDone=true;
  const name=n=>{ let m=/^[TR](\d)/.exec(n); if (m) return 'CommonTree_'+m[1]; m=/^P(\d)/.exec(n); return m?'Pine_'+m[1]:n; };
  const noShadow=n=>/^R\d|^P\d|Grass|Clover|Pebble|Flower|Fern|Plant|Mushroom|Rock/.test(n);
  for (const n in by){ const ims=vlInst(name(n),by[n],{shadow:!noShadow(n)}); const k=/^[RP]\d([nsew])$/.exec(n); if (k) gfSector(k[1],ims,by[n],DF); } }

/* 깊은 숲: 가벼운 잎 덩어리 (멀리 · 안개 속) */
function dfForest(R){
  const lt=vlTexRep(vlCanvas(256,256,g=>{ g.fillStyle='#bdbdbd'; g.fillRect(0,0,256,256);
    for (let i=0;i<900;i++){ const x=Math.random()*256, y=Math.random()*256, s=4+Math.random()*7, l=140+Math.random()*115|0;
      vlWrapDraw(256,x,y,12,(X,Y)=>{ g.save(); g.translate(X,Y); g.rotate(Math.random()*6.3); g.fillStyle=`rgb(${l},${l},${l})`; g.beginPath(); g.ellipse(0,0,s,s*.55,0,0,7); g.fill(); g.restore(); }); } }));
  const geo=new THREE.IcosahedronGeometry(1,1); { const p=geo.attributes.position; for (let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), k=1+.16*Math.sin(x*3.1+z*2.3)+.1*Math.cos(y*4.2+x); p.setXYZ(i,x*k,y*k*.86,z*k); } geo.computeVertexNormals(); }
  const pts=[], band=(x,z)=>{ if (z>-20&&z<-7) return false; const w=x<-41&&x>-92, e=x>41&&x<92, n=z<-44&&z>-92&&Math.abs(x)<=41, s=z>53&&z<92&&Math.abs(x)<=41; return (w||e||n||s)&&Math.hypot(x*.8,z*.85)<100; };
  for (let x=-90;x<=90;x+=2.9) for (let z=-90;z<=90;z+=2.9){ const jx=x+rnd(-1.3,1.3), jz=z+rnd(-1.3,1.3); if (band(jx,jz)) pts.push([jx,jz]); }
  const mat=new THREE.MeshStandardMaterial({map:lt,roughness:.95,metalness:0}), D=new THREE.Object3D(), pal=['#4f7f2c','#5f8f34','#6a9a3a','#45722a','#73a040','#587f30'];
  const by={n:[],s:[],w:[],e:[]}; pts.forEach(p=>by[p[1]<-44?'n':p[1]>53?'s':p[0]<0?'w':'e'].push(p));
  for (const k in by){ const L=by[k]; if (!L.length) continue; const im=new THREE.InstancedMesh(geo,mat,L.length);
    L.forEach(([x,z],i)=>{ const s=rnd(2.3,3.4); D.position.set(x,s*1.05+rnd(2.4,4.6),z); D.rotation.set(rnd(0,.4),rnd(0,6.3),rnd(0,.4)); D.scale.set(s,s*rnd(.9,1.2),s); D.updateMatrix(); im.setMatrixAt(i,D.matrix);
      im.setColorAt(i,VL_LIN(pal[(Math.random()*pal.length)|0]).multiplyScalar(rnd(.85,1.08))); });
    im.receiveShadow=true; im.frustumCulled=false; R.add(im); gfSector(k,[im],L.map(([x,z])=>({x,z})),DF); } }

/* ---------- 풀: 캐릭터 주변에 가는 풀잎 (들판 마을 풀 셰이더) ---------- */
function dfGrass(R){
  const S=512, mp=v=>(v/DF_MAP+.5)*S, k=S/DF_MAP;
  const cv=vlCanvas(S,S,g=>{ g.fillStyle='#fff'; g.fillRect(0,0,S,S); g.lineCap='round';
    const ln=(ax,az,bx,bz,w,c,bl)=>{ g.save(); g.filter=`blur(${bl}px)`; g.strokeStyle=c; g.lineWidth=w*k; g.beginPath(); g.moveTo(mp(ax),mp(az)); g.lineTo(mp(bx),mp(bz)); g.stroke(); g.restore(); };
    const disc=(x,z,r,c,bl)=>{ g.save(); g.filter=`blur(${bl}px)`; g.fillStyle=c; g.beginPath(); g.arc(mp(x),mp(z),r*k,0,7); g.fill(); g.restore(); };
    const rect=(x0,z0,x1,z1,c,bl)=>{ g.save(); g.filter=`blur(${bl}px)`; g.fillStyle=c; g.fillRect(mp(x0),mp(z0),(x1-x0)*k,(z1-z0)*k); g.restore(); };
    DF_LANES.forEach(L=>{ const e=DF_LANE_END(L); ln(L,46,e.x,e.z,6.3,'#666',4); });
    rect(-70,DF_PAL_Z-3,70,72,'#777',6);
    DF_LANES.forEach(L=>{ const e=DF_LANE_END(L); ln(L,46,e.x,e.z,3.8,'#000',1.5); });
    disc(0,-8.5,7.9,'#000',1); rect(-70,-72,70,-7.9,'#000',1); rect(-70,DF_PAL_Z-.8,70,72,'#222',3);
    DF_ST.forEach(s=>disc(s.x,s.z,3.1,'#000',1)); disc(DF_REP.x,DF_REP.z-.8,2.7,'#000',1);
    rect(-34.5,DF_RUIN_Z-.7,34.5,DF_RUIN_Z+.7,'#555',2); DF_CRATERS.forEach(c=>disc(c.x,c.z,c.r*.85,'#222',2)); disc(-16,18,2.2,'#000',2); });
  { const g=cv.getContext('2d'), id=g.getImageData(0,0,S,S), d=id.data;   // 파랑 = 마른 풀 (진영 가까이 · 포탄 구덩이 둘레)
    for (let py=0;py<S;py++) for (let px=0;px<S;px++){ const x=(px+.5)/S*DF_MAP-DF_MAP/2, z=(py+.5)/S*DF_MAP-DF_MAP/2;
      let dry=Math.max(0,Math.min(1,(z-22)/12))*.8; for (const c of DF_CRATERS){ const e=Math.hypot(x-c.x,z-c.z)-c.r; if (e<3) dry=Math.max(dry,(1-Math.max(0,e)/3)*.7); }
      d[(py*S+px)*4+2]=255*(1-dry); }
    g.putImageData(id,0,0); }
  const mt=new THREE.CanvasTexture(cv); mt.minFilter=THREE.LinearFilter; mt.generateMipmaps=false;
  const U=DF.U={uTime:NAT_U.uTime,uPlayer:{value:new THREE.Vector3()},uCenter:{value:new THREE.Vector2()},uR:{value:21},uMap:{value:DF_MAP},uMask:{value:mt},uGround:{value:DF.mask},
    uTip:{value:VL_LIN('#a4c04a')},uTip2:{value:VL_LIN('#5f8f32')},uDry:{value:VL_LIN('#c2a64e')},uRoot:{value:VL_LIN('#3a5a1c')},uSun:{value:new THREE.Vector3(.5,.62,.3).normalize()},uSunCol:{value:new THREE.Color(1,.9,.7)},
    uFog:{value:new THREE.Color()},uFogN:{value:40},uFogF:{value:150},uLightK:{value:new THREE.Color(1,1,1)}};
  const m=dfGrassMesh(U); R.add(m); DF.grass=m; GRASS.push(m); }
// 풀잎 덩어리 (들판 마을 풀 셰이더): 지도 · 색은 U로 받아요 (서비스업 섬도 같이 써요)
function dfGrassMesh(U){
  const GMAX=120000, geo=new THREE.InstancedBufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,0, 1,0,0, -.75,.4,0, .75,.4,0, -.4,.75,0, .4,.75,0, 0,1,0],3)); geo.setIndex([0,1,2, 1,3,2, 2,3,4, 3,5,4, 4,5,6]);
  const off=new Float32Array(GMAX*3), pr=new Float32Array(GMAX*4);
  for (let n=0;n<GMAX;n++){ off[n*3]=rnd(-21,21); off[n*3+2]=rnd(-21,21); pr[n*4]=Math.random()*Math.PI*2; pr[n*4+1]=rnd(.6,1.15); pr[n*4+2]=rnd(.014,.026); pr[n*4+3]=Math.random(); }
  geo.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,3)); geo.setAttribute('aP',new THREE.InstancedBufferAttribute(pr,4));
  geo.instanceCount=GMAX; geo.userData={max:GMAX};
  const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:U,side:THREE.DoubleSide,
    vertexShader:`attribute vec3 aOff; attribute vec4 aP; uniform float uTime,uR,uMap; uniform vec3 uPlayer,uRoot; uniform vec2 uCenter; uniform sampler2D uMask,uGround;
      varying float vH,vV,vT,vS,vD; varying vec3 vW;
      void main(){
        vec2 rel=mod(aOff.xz-uCenter+uR,2.*uR)-uR; vec2 root=uCenter+rel;
        vec2 uv=vec2(root.x/uMap+.5,1.-(root.y/uMap+.5)); vec4 mk=texture2D(uMask,uv); vS=texture2D(uGround,uv).g; vD=1.-mk.b;
        float fade=1.-smoothstep(uR*.72,uR,max(abs(rel.x),abs(rel.y)));
        float pch=.5+.5*sin(root.x*.23+sin(root.y*.17)*2.)*cos(root.y*.19-root.x*.07);
        float tl=smoothstep(.45,.92,mk.r); float hgt=aP.y*mix(.1,.18+.26*pch,tl)*smoothstep(.06,.26,mk.r)*fade; vT=tl;
        if (hgt<.003){ gl_Position=vec4(0.,0.,2.,1.); vH=vV=vS=vD=0.; vW=vec3(0.); return; }   // 풀이 없는 곳(길 · 모래): 납작한 잎이 점처럼 찍히지 않게 버려요
        float h=position.y; float c=cos(aP.x), s=sin(aP.x);
        vec3 p=vec3(position.x*aP.z*c, h*hgt, position.x*aP.z*s);
        p.xz+=vec2(-s,c)*h*h*hgt*.35;
        float w=sin(uTime*1.3+root.x*.21+root.y*.17)*.55+sin(uTime*2.6+root.x*.7-root.y*.5)*.2+.3; p.xz+=vec2(.85,.45)*w*.35*hgt*h*h;
        vec3 wp=vec3(root.x,0.,root.y)+p; vec2 d=wp.xz-uPlayer.xz; float dl=length(d)+1e-4; float push=smoothstep(.9,.0,dl)*h*tl; wp.xz+=d/dl*push*min(.4,hgt*.8); wp.y-=push*.22*hgt;
        vW=wp; vH=h; vV=aP.w*.6+pch*.4;
        gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.); }`,
    fragmentShader:`uniform vec3 uTip,uTip2,uDry,uRoot,uSunCol,uSun,uFog,uLightK; uniform float uFogN,uFogF; varying float vH,vV,vT,vS,vD; varying vec3 vW;
      void main(){ vec3 tip=mix(uTip2,uTip,smoothstep(.2,.8,vV)); tip=mix(tip,uDry,smoothstep(.78,1.,vV)*.55); tip=mix(uTip2,tip,.55+.45*vT); tip=mix(tip,mix(uDry*.72,uTip2*.8,vV*.5),vD*.75);
        float sh=mix(.5,1.,vS); vec3 alb=mix(uRoot,tip,smoothstep(.0,1.,vH))*sh; vec3 col=alb*uLightK;
        vec3 V=normalize(vW-cameraPosition); float back=pow(max(dot(V,uSun),0.),5.)*vH*sh; col+=uSunCol*back*.5;
        float dist=length(vW-cameraPosition); col=mix(col,uFog,smoothstep(uFogN,uFogF,dist));
        gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
      }`}));
  m.frustumCulled=false; m.userData.max=GMAX; return m; }

/* ---------- 성벽 디펜스 짓기 ---------- */
function buildDefense(){
  const R=new THREE.Group(); scene.add(R); DF.root=R;
  const keep={halos:VL.halos,smoke:VL.smokeSrc,camObs:VL.camObs,bed:VL.bedFlowers};
  VL.halos=DF.halos; VL.smokeSrc=DF.smoke; VL.camObs=[]; VL.bedFlowers=[];
  DF.ao=[]; DF.fireSpots=[]; DF.flagSpots=[];
  const S=new THREE.Group(); R.add(S); DF.static=S;   // 움직이지 않는 건물 · 소품: 마지막에 재질별로 한 덩어리로 합쳐요
  try{
    gfSky(R,DF); dfGround(R); dfMoat(R,S);
    dfCobble(R,0,-8.5,7.4,true);
    dfWall(S,R); dfGatehouse(S,R); dfBarbican(S);
    const T=dfTurrets(S,R); dfStations(R,T); dfRepair(S,R); dfLanes(R);
    dfRuins(S); dfField(S,R); dfCamp(S,R); dfTown(S); dfFlags(S);
    addNpc('barbarian',-5.3,-7.65,.2);
    dfNature(); dfForest(R);
    DF.fireSpots.forEach(f=>{ dfFire(R,f.x,f.y,f.z,f.s,{halo:f.halo}); if (f.smoke) DF.smoke.push({x:f.x,y:f.y+f.s*1.4,z:f.z}); });
    gfSmoke(R,DF);
    dfGroundFinish(DF.ao);
    dfGrass(R); gfSeeThrough(R);
    S.updateMatrixWorld(true); vlMerge(S);
  } finally { VL.halos=keep.halos||[]; VL.smokeSrc=keep.smoke||[]; VL.camObs=keep.camObs||[]; VL.bedFlowers=keep.bed||[]; }
  DF.built=true;
}

/* ---------- 분위기: 맑은 낮 · 황금빛 오후 · 해 질 녘 ---------- */
const DF_MOODS={
  day:   {top:'#2a6fd6',hor:'#8cc0ee',fog:'#a7cbee',fogN:46,fogF:165,cShade:[.74,.82,.95],cAdd:[.32,.32,.32],sunCol:'#fff3df',cov:.58,mtn:[0x5c7fa8,0x4f7a5c],light:[1,1,1],sun:[1,.93,.8]},
  golden:{top:'#3f7cc8',hor:'#f2cf9a',fog:'#efd2a6',fogN:38,fogF:145,cShade:[.82,.66,.62],cAdd:[.42,.24,.1],sunCol:'#ffd08a',cov:.6,mtn:[0x8a7f9c,0x6f7a58],light:[1.04,.98,.9],sun:[1,.82,.56]},
  dusk:  {top:'#2b3274',hor:'#f0a07c',fog:'#9a7896',fogN:32,fogF:130,cShade:[.46,.38,.58],cAdd:[.46,.2,.1],sunCol:'#ffa36b',cov:.62,mtn:[0x4a4a72,0x3e4854],light:[.74,.68,.86],sun:[1,.62,.42]},
};
function dfApplyMood(k){
  const G=DF_MOODS[k]||DF_MOODS.day;
  scene.background.set(G.fog).convertSRGBToLinear(); scene.fog.color.set(G.fog).convertSRGBToLinear(); scene.fog.near=G.fogN; scene.fog.far=G.fogF;
  if (DF.skyU){ const U=DF.skyU; U.uTop.value.set(G.top).convertSRGBToLinear(); U.uHor.value.set(G.hor).convertSRGBToLinear(); U.uCShade.value.setRGB(...G.cShade); U.uCAdd.value.setRGB(...G.cAdd); U.uSunCol.value.set(G.sunCol).convertSRGBToLinear(); U.uCov.value=G.cov; }
  (DF.mtnU||[]).forEach((u,i)=>u.uCol.value.setHex(G.mtn[i]||G.mtn[0]).convertSRGBToLinear());
  if (DF.WU){ DF.WU.uSunCol.value.setRGB(...G.sun); DF.WU.uLightK.value.setRGB(...G.light); }
  if (DF.U){ DF.U.uSunCol.value.setRGB(...G.sun); DF.U.uLightK.value.setRGB(...G.light); }
  DF.moodK=k; }
const dfPickMood=seed=>{ let r=Math.random(); if (seed){ let h=0; for (const c of String(seed)) h=(h*31+c.charCodeAt(0))|0; r=(Math.abs(h)%100)/100; } return r<.45?'day':r<.75?'golden':'dusk'; };

/* ---------- 놀이: 포탑 · 길 미리보기 · 성문 수리 · 공성 망치 (게임이 움직일 때만) ---------- */
const DF_SHARD=new THREE.OctahedronGeometry(.17,0).scale(.75,.75,2.6), DF_BALL=new THREE.SphereGeometry(.34,12,8), boltGeo=DF_BALL;
function dfTarget(t){ let best=null, bs=1e9;
  for (const m of mobs){ if (m.dying>=0||m.spawnT>0||m.ans) continue; const d=Math.hypot(m.x-t.x,m.z-t.z); if (d>TURRET_RANGE) continue;
    const s=Math.hypot(m.x-DOOR.x,m.z-DOOR.z)+d*.25; if (s<bs){ bs=s; best=m; } }   // 성문에 가까운 몬스터부터
  return best; }
function updateTurrets(dt){
  for (const q of W.spawnQ){ if (q.warned||q.lane==null||W.t<q.at-3.2) continue; q.warned=true; dfLaneWarn(q); }
  for (const t of TURRETS){
    if (W.t>=t.until) continue;
    t.cd-=dt; if (t.cd>0) continue;
    const m=dfTarget(t); if (!m) continue;
    if (t.kind==='bolt'){ t.cd=1.5; dfChain(t,m); continue; }
    t.cd=t.kind==='fire'?1.6:1.1; t.kick=.3;
    const mesh=new THREE.Mesh(t.kind==='fire'?DF_BALL:DF_SHARD,t.boltMat); mesh.position.set(t.x,t.y,t.z); scene.add(mesh);
    bolts.push({mesh,m,t,sx:t.x,sz:t.z}); fx.burst(t.x,t.y,t.z,t.color,5,2); if (t.kind==='fire') SFX.fire(); else SFX.ice(); }
  dfRepairTick(); dfRamTick(dt); }
function updateBolts(dt){
  for (let i=bolts.length-1;i>=0;i--){
    const b=bolts[i], p=b.mesh.position, m=b.m, k=b.t.kind;
    const ty=m.boss?2.4:1.1, dx=m.x-p.x, dy=ty-p.y, dz=m.z-p.z, d=Math.hypot(dx,dy,dz), step=(k==='fire'?24:32)*dt;
    if (m.dying>=0 || d<=step+.2){
      if (m.dying<0) dfImpact(b.t,m,b.sx,b.sz); else fx.burst(p.x,p.y,p.z,b.t.color,6,2);
      scene.remove(b.mesh); bolts.splice(i,1); continue; }
    p.x+=dx/d*step; p.y+=dy/d*step; p.z+=dz/d*step;
    if (k==='ice') b.mesh.lookAt(m.x,ty,m.z); else { b.mesh.rotation.x+=dt*8; if (Math.random()<.7) fx.burst(p.x,p.y,p.z,Math.random()<.5?0xff9a3c:0xffd060,1,1); } } }
function dfImpact(t,m,sx,sz){
  if (t.kind==='ice'){ if (hitMob(m,26,sx,sz,.25,'#9fe3ff',false,{src:'turret'})) slowRaw(m,2.6,.45); fx.burst(m.x,1.2,m.z,0xcff4ff,12,3); fx.burst(m.x,.3,m.z,0xffffff,6,2); return; }
  hitMob(m,30,sx,sz,.5,'#ffb36b',false,{src:'turret'}); burnRaw(m,2,12); fx.shock(m.x,m.z,2.8); fx.burst(m.x,1,m.z,0xff7a2a,16,5); fx.burst(m.x,1.2,m.z,0xffd060,8,3);
  for (const o of mobs){ if (o===m||o.dying>=0||o.spawnT>0||o.ans) continue; if (Math.hypot(o.x-m.x,o.z-m.z)<2.8) hitMob(o,16,m.x,m.z,.6,'#ffb36b',false,{src:'turret'}); } }
// 번개: 처음 맞은 몬스터에서 가까운 몬스터 2마리까지 이어져요
function dfChain(t,m){
  const hits=[m]; let cur=m;
  for (let n=0;n<2;n++){ let best=null, bd=6.5; for (const o of mobs){ if (o.dying>=0||o.spawnT>0||o.ans||hits.includes(o)) continue; const d=Math.hypot(o.x-cur.x,o.z-cur.z); if (d<bd){ bd=d; best=o; } } if (!best) break; hits.push(best); cur=best; }
  const pts=[[t.x,t.y,t.z]].concat(hits.map(o=>[o.x,o.boss?2.4:1.2,o.z]));
  for (let i=0;i<pts.length-1;i++) dfZap(pts[i],pts[i+1]);
  hits.forEach((o,i)=>{ hitMob(o,[30,22,16][i],t.x,t.z,.2,'#ffe66b',false,{src:'turret',stun:.35}); fx.burst(o.x,1.2,o.z,0xfff2a0,8,4); });
  t.kick=.35; SFX.thunder(); }
const DF_ZAPM=new THREE.MeshBasicMaterial({color:0xfff6c8,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
function dfZap(a,b){
  const N=8, P=[], dx=b[0]-a[0], dy=b[1]-a[1], dz=b[2]-a[2], L=Math.hypot(dx,dy,dz), amp=Math.min(.6,L*.06);
  for (let i=0;i<=N;i++){ const t=i/N, j=(i===0||i===N)?0:1; P.push(new THREE.Vector3(a[0]+dx*t+rnd(-amp,amp)*j,a[1]+dy*t+rnd(-amp,amp)*j,a[2]+dz*t+rnd(-amp,amp)*j)); }
  const path=new THREE.CurvePath(); for (let i=0;i<N;i++) path.add(new THREE.LineCurve3(P[i],P[i+1]));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(path,N*2,.06,4,false),DF_ZAPM.clone()); mesh.renderOrder=4; scene.add(mesh); DF.zaps.push({mesh,life:.22}); }
// 퀴즈를 맞혀 포탑이 깨어날 때: 수정에서 포탑으로 빛줄기
function dfTurretOn(t,st){
  if (!t) return ''; const a=st&&st.g?st.g.position:{x:t.x,z:t.z+5};
  const c=new THREE.QuadraticBezierCurve3(new THREE.Vector3(a.x,2.8,a.z),new THREE.Vector3((a.x+t.x)/2,t.y+3,(a.z+t.z)/2),new THREE.Vector3(t.x,t.y,t.z));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(c,24,.12,6,false),new THREE.MeshBasicMaterial({color:t.color,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  mesh.renderOrder=4; scene.add(mesh); DF.beams.push({mesh,life:.9}); t.kick=.5;
  setTimeout(()=>{ fx.rise(t.x,t.z,t.color,16); fx.burst(t.x,t.y,t.z,t.color,18,4); },350);
  const who=PEACE_RUN?'정령':'해골';
  return t.kind==='ice'?`❄️ 맞은 ${who}이 느려져요.`:t.kind==='fire'?`🔥 불꽃이 터져서 둘레 ${who}도 함께 맞아요.`:`⚡ 번개가 ${who} 3마리까지 이어져요.`; }
function dfLaneWarn(q){
  const li=DF_LANES.indexOf(q.lane); if (li<0) return;
  DF.laneOn[li]=W.t+4.2; SFX.drum();
  const nm=['왼쪽','가운데','오른쪽'][li], who=PEACE_RUN?'안개 정령 무리가':q.runner?'주황 돌격병이':'해골 무리가';
  flashPrompt(`🥁 ${nm} 길로 ${who} 와요!`,2.6); }
// 성문 수리대: 가까이 가면 O/X 문제 · 맞히면 성문 +15%
function dfRepairTick(){
  const R=DF.rep; if (!R) return;
  const ready=W.t>=R.next && W.door<W.doorMax*.97, d=Math.hypot(P.x-DF_REP.x,P.z-DF_REP.z);
  if (!ready){ R.told=false; return; }
  const busy=W.paused||!$('#quiz').hidden||W.prep||W.loc||(typeof FUN!=='undefined'&&FUN.am&&!FUN.am.done);
  if (!busy && d<DF_REP.r){ const it=pick(['ox'],OX)||pick(['mc'],MC); if (it){ R.next=W.t+5; openQuiz(it,{type:'repair'}); } }
  else if (!busy && d<6 && !R.told){ R.told=true; flashPrompt('🔨 성문 수리대: O/X 문제를 맞히면 성문이 15% 고쳐져요',2.6); }
  if (!R.warned && W.door<W.doorMax*.5){ R.warned=true; setTimeout(()=>{ if (W.state==='play') flashPrompt('성문이 많이 부서졌어요! 🔨 성문 수리대에서 고칠 수 있어요',3); },400); } }
function dfRepairFx(ok){
  const R=DF.rep;
  if (!ok){ if (R) R.next=W.t+(PEACE_RUN?12:18); return {label:`수리에 실패했어요… ${PEACE_RUN?12:18}초 뒤에 다시 해 봐요`}; }
  if (R) R.next=W.t+(PEACE_RUN?28:38);
  const before=W.door; W.door=Math.min(W.doorMax,W.door+Math.round(W.doorMax*.15)); const up=Math.round(W.door-before);
  setTimeout(()=>{ SFX.repair(); fx.rise(DOOR.x,DOOR.z-.4,0xffd34d,30); fx.burst(DOOR.x,2,DOOR.z,0xfff0b0,20,4); fx.num(DOOR.x,5,DOOR.z+.6,'+'+up,'#7dff9a',1.3); },300);
  return {label:`🔨 성문 수리 +${up}`}; }
/* 공성 망치: 마지막 보스(해골 장군)가 밀고 와요. 성문에 닿으면 뒤로 당겼다가 쿵! */
function dfRamModel(){
  const M=vlMats(), X=gfMats(), g=new THREE.Group(), put=vlPutter(g), B=vlBox, fr=new THREE.Group(); g.add(fr); const pf=vlPutter(fr);
  for (const s of [-1,1]){ pf(B(.2,.2,4,1),M.wood,s*.95,.62,2.3); pf(B(.16,1.9,.16,.8),M.wood,s*.95,1.5,.6); pf(B(.16,1.9,.16,.8),M.wood,s*.95,1.5,4.0); pf(B(.14,.14,3.6,.8),M.wood,s*.95,2.4,2.3); }
  for (const z of [.6,4.0]) pf(B(2.1,.16,.16,.8),M.wood,0,2.4,z); for (const z of [.6,2.3,4.0]) pf(B(2.0,.16,.16,.8),M.wood,0,.64,z);
  const hide=new THREE.MeshStandardMaterial({map:dfTentTex(),roughness:.95,side:THREE.DoubleSide});
  for (const s of [-1,1]) pf(B(1.35,.07,4.2,1.6),hide,s*.58,2.78,2.3,0,0,-s*.62);
  vlMerge(fr);
  const wheels=[]; for (const s of [-1,1]) for (const z of [.9,3.7]){ const w=new THREE.Group(); w.position.set(s*1.12,.5,z); g.add(w); const pw=vlPutter(w);
    pw(new THREE.CylinderGeometry(.5,.5,.18,14),M.woodLight,0,0,0,0,0,Math.PI/2); pw(new THREE.TorusGeometry(.5,.05,6,16),M.iron,0,0,0,0,Math.PI/2,0); for (let k=0;k<3;k++) pw(B(.06,.9,.08),M.wood,s*.1,0,0,k*Math.PI/3,0,0); vlMerge(w); wheels.push(w); }
  const log=new THREE.Group(); log.position.set(0,1.45,2.2); g.add(log); const pl=vlPutter(log);
  pl(new THREE.CylinderGeometry(.27,.3,4.6,12),M.wood,0,0,0,Math.PI/2,0,0); for (const z of [-1.4,0,1.4]) pl(new THREE.TorusGeometry(.3,.045,6,16),M.iron,0,0,z);
  pl(new THREE.CylinderGeometry(.34,.4,.5,12),M.iron,0,0,2.45,Math.PI/2,0,0); pl(new THREE.SphereGeometry(.34,12,8),M.iron,0,0,2.72);
  for (const s of [-1,1]) pl(new THREE.TorusGeometry(.2,.07,6,12,Math.PI*1.4),M.iron,s*.3,.12,2.6,0,Math.PI/2,s>0?.4:2.7);
  for (const z of [-1,1]) for (const s of [-1,1]) dfRod(pl,M.iron,[s*.08,0,z],[s*.9,.95,z],.025);
  vlMerge(log);
  g.traverse(o=>{ if (o.isMesh){ o.castShadow=true; } });
  g.userData={log,wheels}; return g; }
function dfRam(b){
  if (!b || MAPK!=='defense') return;
  b.x=0; b.z=31; b.g.position.set(0,0,31); fx.burst(0,.6,31,0x8a8f99,30,6);
  const g=dfRamModel(); g.position.set(0,0,1.25); b.g.add(g);
  b.ram={g,log:g.userData.log,wheels:g.userData.wheels,t:0,ph:0,cd:2,lx:b.x,lz:b.z,told:false};
  setTimeout(()=>{ if (W.state==='play') flashPrompt('🐏 해골 장군이 공성 망치를 밀고 와요! 성문에 닿기 전에 막으세요',3.4); },1000); }
function dfRamTick(dt){
  const b=liveBoss(); if (!b||!b.ram) return; const R=b.ram;
  const mv=Math.hypot(b.x-R.lx,b.z-R.lz); R.lx=b.x; R.lz=b.z; R.wheels.forEach(w=>{ w.rotation.x+=mv/.5; });
  const can=b.atDoor && !(b.groggy>W.t) && !(b.slamT>0) && !(b.shield>0&&W.bg&&W.bg.st);
  if (R.ph===0){ if (can){ R.cd-=dt; if (R.cd<=0){ R.ph=1; R.t=0; } } else R.cd=Math.max(R.cd,1); }
  else if (R.ph===1){ R.t+=dt; R.log.position.z=2.2-.95*Math.min(1,R.t/.9); if (R.t>=.9){ R.ph=2; R.t=0; } }
  else if (R.ph===2){ R.t+=dt; R.log.position.z=1.25+1.35*Math.min(1,R.t/.13); if (R.t>=.13){ R.ph=3; R.t=0; dfRamHit(b); } }
  else { R.t+=dt; R.log.position.z=2.6-.4*Math.min(1,R.t/.5); if (R.t>=.5){ R.ph=0; R.cd=2.4; } } }
function dfRamHit(b){
  if (!b.atDoor) return; const dd=Math.max(18,Math.round(b.dmg*2.8));
  W.door-=dd; doorFlash=.45; shake=Math.max(shake,.42); SFX.boom();
  fx.burst(DOOR.x,1.8,DOOR.z+.3,0xc9a06a,22,6); fx.burst(DOOR.x,1.2,DOOR.z+.5,0x7a5638,14,5); fx.num(DOOR.x,4.8,DOOR.z+.8,'쿵! -'+dd,'#ffb36b',1.4);
  if (!b.ram.told){ b.ram.told=true; flashPrompt('🐏 공성 망치가 성문을 들이받아요! 해골 장군을 성문에서 떼어 내세요',3); } }

/* 판마다 처음 상태로 */
function dfReset(){
  if (!DF.built) return;
  DF.laneOn=[0,0,0]; if (DF.rep){ DF.rep.next=0; DF.rep.told=false; DF.rep.warned=false; }
  DF.zaps.forEach(z=>{ scene.remove(z.mesh); z.mesh.geometry.dispose(); z.mesh.material.dispose(); }); DF.zaps=[];
  DF.beams.forEach(z=>{ scene.remove(z.mesh); z.mesh.geometry.dispose(); z.mesh.material.dispose(); }); DF.beams=[]; }

/* ---------- 매 프레임 (그림) ---------- */
const DF_FR=new THREE.Frustum(), DF_PM=new THREE.Matrix4(), DF_DB=new THREE.Vector2();
function updateDefenseLook(real,dt){
  if (MAPK!=='defense' || !DF.built) return;
  const play=W.state==='play';
  GF_SEE.value=(play&&!(typeof SHOP!=='undefined'&&SHOP.open))?1:0;
  if (!DF.skyOff){ DF.skyOff=true; gfSkyVis(false); clouds.forEach(c=>c.visible=true); }
  camera.updateMatrixWorld(); DF_FR.setFromProjectionMatrix(DF_PM.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  for (const k in DF.secs){ const S=DF.secs[k], v=DF_FR.intersectsBox(S.box); S.ims.forEach(m=>{ m.visible=v; }); }
  NAT_U.uTime.value=real; NAT_U.uCam.value.copy(camera.position); NAT_U.uPlr.value.set(P.x,1.1,P.z);
  const fc=scene.fog.color, sunD=new THREE.Vector3().copy(sun.position).sub(sun.target.position).normalize();
  if (DF.skyU){ DF.skyU.uTime.value=real; DF.skyU.uFog.value.copy(fc); DF.sky.position.copy(camera.position); DF.skyU.uSun.value.copy(sunD); }
  if (DF.WU){ const U=DF.WU; U.uTime.value=real*.45; U.uFog.value.copy(fc); U.uFogN.value=scene.fog.near; U.uFogF.value=scene.fog.far; U.uTop.value.copy(DF.skyU.uTop.value); U.uHor.value.copy(DF.skyU.uHor.value); U.uSun.value.copy(sunD); }
  if (DF.U){ const U=DF.U; U.uPlayer.value.set(P.x,0,P.z); U.uCenter.value.set(P.x,P.z-4); U.uFog.value.copy(fc); U.uFogN.value=scene.fog.near; U.uFogF.value=scene.fog.far; U.uSun.value.copy(sunD); }
  if (DF.smU){ renderer.getDrawingBufferSize(DF_DB); DF.smU.uScale.value=DF_DB.y/(2*Math.tan(camera.fov*Math.PI/360)); }
  // 불꽃 (모닥불 · 횃불 · 불꽃 포탑)
  const lit=DF.moodK==='day'?.75:1.05;
  DF.flames.forEach((F,i)=>{ const k=F.k; F.cones.forEach((c,j)=>{ const u=c.userData, f=1+.22*Math.sin(real*13+u.ph)+.1*Math.sin(real*29+u.ph*2);
      c.scale.set(u.r*k*(1+.08*Math.sin(real*17+u.ph)),u.h*k*f,u.r*k*(1+.08*Math.cos(real*15+u.ph))); c.rotation.y=real*(j%2?1.4:-1.1); });
    F.halo.material.opacity=(.38+.1*Math.sin(real*9+i))*lit*Math.min(1.4,k); F.halo.scale.setScalar(F.hs*(.9+.25*Math.min(2,k))); });
  { const M=vlMats(), warm=DF.moodK!=='day'; M.lantern.emissiveIntensity=warm?1.4:.6; M.win.emissiveIntensity=DF.moodK==='dusk'?.85:warm?.42:.16; DF.halos.forEach(h=>{ h.visible=warm; }); }
  // 성문: 다칠수록 어두워지고 금이 가요
  doorFlash=Math.max(0,doorFlash-dt);
  if (doorMat){ const k=play||W.state==='end'?Math.max(0,Math.min(1,(W.door??DOOR_HP)/(W.doorMax||DOOR_HP))):1;
    doorMat.color.copy(DOOR_COL).lerp(DOOR_DARK,(1-k)*.85); doorMat.emissive.setHex(doorFlash>0?0x5a1206:0x000000);
    doorG.position.x=doorFlash>0?Math.sin(real*70)*.06:0; if (DF.crack) DF.crack.material.opacity=Math.max(0,Math.min(1,(1-k)*1.5-.2));
    if (DF.portcullis) DF.portcullis.position.y=doorFlash>0?Math.abs(Math.sin(real*55))*.05:0; }
  // 포탑
  for (const t of TURRETS){
    const on=play&&W.t<t.until, left=t.until-W.t; t.kick=Math.max(0,t.kick-dt);
    t.gem.rotation.y=real*(on?2.6:.7); t.gem.position.y=t.gy+Math.sin(real*2+t.x)*.12+t.kick*.5;
    t.gemMat.color.setHex(on?t.color:0x7d8594); t.gemMat.emissive.setHex(on?t.color:0x000000);
    t.light.intensity=on?1.5+Math.sin(real*6)*.35+t.kick*5:0;
    t.orbit.visible=t.orbit2.visible=on;
    if (on){ t.orbit.rotation.set(real*1.6,real*.8,0); t.orbit2.rotation.set(-real,0,real*1.3); const sc=left<5?.6+.4*Math.abs(Math.sin(real*8)):1; t.orbit.scale.setScalar(sc); t.orbit2.scale.setScalar(sc); }
    const E=t.extra;
    if (E.fire){ E.fire.k=on?1.7+t.kick*1.5:.5; E.coal.emissiveIntensity=on?1.6:.7; }
    if (E.small) E.small.emissiveIntensity=on?1.1:.25;
    if (E.sparks) E.sparks.forEach((ln,i)=>{ ln.visible=on&&Math.random()<.7; if (!ln.visible) return; const a=ln.geometry.attributes.position; let x=0,y=0,z=0; const ang=Math.random()*6.28, el=rnd(-.6,1);
      for (let j=0;j<6;j++){ a.setXYZ(j,x,y,z); const r=.12+j*.11; x=Math.cos(ang+rnd(-.5,.5))*r; z=Math.sin(ang+rnd(-.5,.5))*r; y=el*r+rnd(-.08,.08); } a.needsUpdate=true; }); }
  // 길 미리보기 화살표
  DF.lanes.forEach((list,li)=>{ const on=play&&W.t<DF.laneOn[li]; list.sk.visible=on; if (on) list.sk.position.y=2.6+Math.abs(Math.sin(real*5))*.3;
    list.forEach((m,j)=>{ m.visible=on; if (on){ const w=Math.max(0,Math.sin(real*7-j*.75)); m.material.opacity=.6+.4*w; m.userData.o.material.opacity=.35+.25*w; m.position.y=.1+w*.06; m.scale.setScalar(1.5+w*.15); } }); });
  // 성문 수리대
  if (DF.rep){ const R=DF.rep, ready=play&&W.t>=R.next&&W.door<W.doorMax*.97, d=Math.hypot(P.x-DF_REP.x,P.z-DF_REP.z);
    R.ring.visible=ready; if (ready){ R.ring.material.opacity=.65+.3*Math.sin(real*4); const s=1+.05*Math.sin(real*4); R.ring.scale.setScalar(s); }
    R.sp.visible=ready&&!W.prep&&(d<9||W.door<W.doorMax*.6); if (R.sp.visible) R.sp.position.y=2.9+Math.sin(real*2.4)*.1;
    R.ham.visible=ready; if (ready){ R.ham.position.y=1.95+Math.sin(real*3)*.12; R.ham.rotation.y=real*1.5; } }
  // 수정 위 안내판
  DF.tags.forEach(t=>{ const st=t.st, on=play&&!W.prep&&W.t>=st.readyAt&&(W.gate||Math.hypot(P.x-st.g.position.x,P.z-st.g.position.z)<9); t.sp.visible=on; if (on) t.sp.position.y=5.1+Math.sin(real*2+st.g.position.x)*.12; });
  // 번개 · 빛줄기 사라지기
  for (let i=DF.zaps.length-1;i>=0;i--){ const z=DF.zaps[i]; z.life-=dt; z.mesh.material.opacity=Math.max(0,z.life/.22); if (z.life<=0){ scene.remove(z.mesh); z.mesh.geometry.dispose(); z.mesh.material.dispose(); DF.zaps.splice(i,1); } }
  for (let i=DF.beams.length-1;i>=0;i--){ const z=DF.beams[i]; z.life-=dt; z.mesh.material.opacity=Math.max(0,z.life/.9)*.9; if (z.life<=0){ scene.remove(z.mesh); z.mesh.geometry.dispose(); z.mesh.material.dispose(); DF.beams.splice(i,1); } }
}

MAP_BUILD.defense=()=>buildDefense();
GRASS_OK.defense=null;
