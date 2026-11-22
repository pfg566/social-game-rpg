/* 사회 게임 RPG · 🌾 들판 마을 (전투 맵) 리메이크
   마을(04v · 04w)의 그래픽 도구로 지어요: 섞는 땅 셰이더 · 자연 에셋 나무(바람) · 목조 집 · 흐르는 시냇물 · 파란 하늘.
   가운데 광장(옆에 우물)에서 큰길이 십자로 뻗어요.
   북 = 종탑 성당 · 마을 / 서 = 풍차 언덕 · 밀밭 / 동 = 시냇물 · 다리 · 물레방아 / 남서 = 농가 · 텃밭 / 남동 = 오래된 묘지(보스가 깨어나는 곳)
   파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
const GF={built:false,U:null,halos:[],smoke:[],sails:null,wheel:null,bell:null,water:null,sky:null,skyU:null,mtnU:[],brk:[],apples:[],reqs:[],gem:[],grass:null,wheat:[],fx:0,glowWin:null};
const GF_MAP=100, GF_MS=1024, GF_HS=.78;   // 땅 지도 크기(m) · 지도 해상도 · 집 크기(마을 집의 78%: 전투 맵 캐릭터 크기에 맞춰요)
const GF_PLAZA={x:0,z:0,r:6.4};
const GF_SQ={church:{x:0,z:-17,r:4.4},mill:{x:-20.6,z:-2.2,r:3.6},bridge:{x:24,z:.4,r:3.4}};
// 시냇물: 북쪽 숲에서 남동쪽 끝으로 (얕아서 걸어서 건널 수 있어요)
const GF_STREAM=new THREE.CatmullRomCurve3([[14.6,-72],[16,-44],[17.6,-27],[19.2,-14],[17.8,-3],[18,6],[21,16],[25.4,27],[28.6,44],[30,72]].map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
const GF_SP=GF_STREAM.getSpacedPoints(380);
const GF_SW=1.75;   // 시냇물 반폭
const GF_BR=(()=>{ let b=GF_SP[0]; for (const p of GF_SP) if (Math.abs(p.z-.4)<Math.abs(b.z-.4)) b=p; return {x:b.x,z:.4,hl:3.5,hw:1.45,h:.34}; })();   // 다리: 길이 7m · 폭 2.9m · 높이 .34m
// 길: [폭, 점들] (흙길은 땅 셰이더에 그려요)
const GF_ROADS=[
 [3.4,[[0,-5.6],[.7,-9.4],[.3,-13]]],                          // 북: 광장 → 종탑 광장
 [3.4,[[0,5.6],[-.7,13],[.4,21],[-.2,29],[0,42]]],               // 남: 광장 → 남쪽 문
 [3.2,[[-5.6,-.5],[-11,-1.6],[-17.2,-2.1]]],                     // 서: 광장 → 풍차 수정
 [3.2,[[5.6,.3],[10.5,.9],[GF_BR.x-GF_BR.hl,.4]]],               // 동: 광장 → 다리
 [3.0,[[GF_BR.x+GF_BR.hl,.4],[21,.4]]],
 [2.6,[[27.2,.5],[30.6,1.2],[44,1]]],                            // 동쪽 끝으로
 [2.2,[[-23.6,-3.6],[-25.4,-6],[-25.6,-8]]],                     // 풍차 수정 → 풍차
 [2.2,[[-.6,14.2],[-5.8,15.2],[-10.4,15.6],[-14.4,18.6],[-19.2,21.8]]],   // 남쪽 길 → 농가
 [2.2,[[.4,20.8],[3.6,22.3],[7.2,22.4]]],                        // 남쪽 길 → 묘지 문
 [2.2,[[24.2,-3],[24,-7],[23.9,-10.6]]],                         // 다리 광장 → 물레방아
 [2.0,[[-3.8,-15.4],[-7.8,-17.4],[-10.4,-18.6]]],                // 종탑 광장 → 집
 [2.0,[[3.8,-15.4],[7.6,-17.2],[9.8,-18.6]]],
];
const GF_RP=GF_ROADS.map(([w,p])=>({w,pts:new THREE.CatmullRomCurve3(p.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal').getSpacedPoints(Math.max(8,Math.ceil(p.length*14)))}));
// 집 (마을 목조 집 · 크기 GF_HS배)
const GF_HOUSES=[
 {x:-12.8,z:-22.6,r:.42,w:9,d:6.5,roof:'#b8553e',shut:'#3f6b4a'},
 {x:11.9,z:-22.4,r:-.44,w:8.5,d:6.2,roof:'#56688c',shut:'#8a3f3f'},
 {x:-23.4,z:-27.8,r:.66,w:8,d:6,roof:'#c0703c',shut:'#3f5f8a',chim:-1},
 {x:25.4,z:-27.4,r:-.72,w:8,d:6,roof:'#6d5a8e',shut:'#3f6b4a'},
 {x:-23.6,z:23.6,r:Math.PI/2+.12,w:9,d:6.5,roof:'#b38a3e',shut:'#5a7a3a'},   // 농가 (동쪽 텃밭을 봐요)
 {x:24.2,z:-14.6,r:0,w:7,d:5.5,roof:'#8a5a3c',shut:'#3f5f8a',chim:-1},       // 물레방아 집 (서쪽 벽에 물레방아)
];
const GF_CHURCH={x:0,z:-29.2};   // 종탑은 앞(남쪽)에, 본당은 뒤에
const GF_WMILL={x:-26.4,z:-11.4};
const GF_CEM={x0:6.4,x1:18,z0:17,z1:28.6};
const GF_PLOTS=[{x:-14.6,z:17.6,w:6,d:3.6},{x:-14.6,z:23.4,w:6,d:3.6},{x:-7.6,z:20.6,w:3.6,d:6.6}];
const GF_WHEAT=[{x0:-33,x1:-21.5,z0:3.2,z1:12.6},{x0:-33,x1:-21,z0:-23,z1:-16.4}];

/* ---------- 거리 · 높이 ---------- */
function gfPolyD(pts,x,z){ let d=1e9; for (let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1], vx=b.x-a.x, vz=b.z-a.z, L=vx*vx+vz*vz, t=L?Math.max(0,Math.min(1,((x-a.x)*vx+(z-a.z)*vz)/L)):0; const dd=Math.hypot(x-a.x-vx*t,z-a.z-vz*t); if (dd<d) d=dd; } return d; }
function gfStreamD(x,z){ if (x<10||x>36) return 99; return gfPolyD(GF_SP,x,z); }
function gfRoadD(x,z){ let d=1e9; for (const r of GF_RP) d=Math.min(d,gfPolyD(r.pts,x,z)-r.w/2); return d; }
const gfOnBridge=(x,z)=>Math.abs(x-GF_BR.x)<GF_BR.hl+1.1&&Math.abs(z-GF_BR.z)<GF_BR.hw;
function gfBridgeY(x){ const u=Math.abs(x-GF_BR.x); return u<GF_BR.hl-.4?GF_BR.h:Math.max(0,GF_BR.h*(1-(u-(GF_BR.hl-.4))/1.5)); }
// 시냇물 바닥(땅 모양)
function gfBed(x,z){ const d=gfStreamD(x,z); if (d>GF_SW+.7) return 0; const k=Math.max(0,1-d/(GF_SW+.7)), far=1-Math.min(1,Math.max(0,(Math.abs(z)-56)/7)); return -.46*Math.pow(k,1.25)*far; }
// 캐릭터 · 몬스터 발 높이: 다리 위는 올라가고, 시냇물에서는 살짝 잠겨요
function gfY(x,z){ if (MAPK!=='general') return 0; if (gfOnBridge(x,z)) return gfBridgeY(x); const d=gfStreamD(x,z); if (d>GF_SW) return 0; const k=1-d/GF_SW; return -.27*k*k*(3-2*k); }

/* ---------- 텍스처 ---------- */
function gfCobbleTex(seed,rad){   // 둥근 돌 포장 (rad: 광장처럼 동심원 무늬)
  const S=1024, cv=vlCanvas(S,S,g=>{ g.fillStyle='#4f4a43'; g.fillRect(0,0,S,S);
    const stone=(x,y,w,h,a,v,tone)=>{ g.save(); g.translate(x,y); g.rotate(a);
      g.fillStyle=`rgba(30,26,22,.55)`; roundRect(g,-w/2+2,-h/2+3,w,h,Math.min(w,h)*.42); g.fill();
      const T=tone||[142,132,114], c=[T[0]*v|0,T[1]*v|0,T[2]*v|0]; g.fillStyle=`rgb(${c})`; roundRect(g,-w/2,-h/2,w,h,Math.min(w,h)*.42); g.fill();
      const gr=g.createLinearGradient(0,-h/2,0,h/2); gr.addColorStop(0,'rgba(255,250,235,.16)'); gr.addColorStop(.5,'rgba(255,255,255,0)'); gr.addColorStop(1,'rgba(0,0,0,.2)'); g.fillStyle=gr; roundRect(g,-w/2,-h/2,w,h,Math.min(w,h)*.42); g.fill();
      if (Math.random()<.25){ g.fillStyle='rgba(90,110,60,.25)'; g.beginPath(); g.arc((Math.random()-.5)*w*.6,(Math.random()-.5)*h*.6,3+Math.random()*5,0,7); g.fill(); }
      g.restore(); };
    if (rad){ const C=S/2, px=S/(GF_PLAZA.r*2);   // 가운데 여덟 갈래 별 · 붉은 띠 두 줄
      const star=(r,a)=>{ const k=Math.abs(((a/(Math.PI/4))%1+1)%1-.5)*2; return r<px*(.7+1.6*(1-k)); };
      stone(C,C,40,40,0,1.08,[196,170,120]);
      for (let r=26;r<C-6;r+=22){ const n=Math.floor(2*Math.PI*r/25), off=(Math.round(r/22)%2)*.5; for (let i=0;i<n;i++){ const a=(i+off)/n*Math.PI*2, v=.74+Math.random()*.24, rm=r/px;
        const tone=star(r,a)?[184,162,120]:(rm>1.9&&rm<2.2)||(rm>4.85&&rm<5.15)?[138,98,80]:null;
        stone(C+Math.cos(a)*r,C+Math.sin(a)*r,20+Math.random()*3,17+Math.random()*2,a+Math.PI/2,v,tone); } } }
    else { const rows=26, rh=S/rows; for (let r=0;r<rows;r++){ let x=(r%2)*14-20; while (x<S+20){ const w=23+Math.random()*15; vlWrapDraw(S,x+w/2,r*rh+rh/2,44,(X,Y)=>stone(X,Y,w-4,rh-5,(Math.random()-.5)*.12,.8+Math.random()*.3)); x+=w; } } }
    g.globalAlpha=.35; for (let i=0;i<70;i++){ const x=Math.random()*S, y=Math.random()*S, r=8+Math.random()*30, gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,Math.random()<.5?'rgba(90,110,50,.5)':'rgba(70,52,34,.45)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); } g.globalAlpha=1;
    g.globalAlpha=.5; for (let i=0;i<2500;i++){ g.fillStyle=Math.random()<.5?'rgba(0,0,0,.18)':'rgba(255,255,255,.12)'; g.fillRect(Math.random()*S,Math.random()*S,1.5,1.5); } g.globalAlpha=1; });
  const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; if (!rad){ t.wrapS=t.wrapT=THREE.RepeatWrapping; } return t; }

/* ---------- 땅: 풀밭 · 흙길 · 밭 흙을 섞는 셰이더 (마을 땅 셰이더를 들판 마을 지도에 맞춰 썼어요) ---------- */
function gfGround(R){
  const S=GF_MS, mp=v=>(v/GF_MAP+.5)*S, k=S/GF_MAP;
  const strokeP=(g,pts,wd,bl,a)=>{ g.save(); g.filter=`blur(${bl}px)`; g.globalAlpha=a==null?1:a; g.lineWidth=wd*k; g.lineCap='round'; g.lineJoin='round'; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(mp(p.x),mp(p.z)):g.moveTo(mp(p.x),mp(p.z))); g.stroke(); g.restore(); };
  const disc=(g,x,z,r,a,bl)=>{ g.save(); g.filter=`blur(${bl==null?4:bl}px)`; g.globalAlpha=a; g.beginPath(); g.arc(mp(x),mp(z),r*k,0,7); g.fill(); g.restore(); };
  const rect=(g,x,z,w,d,ry,a,bl)=>{ g.save(); g.filter=`blur(${bl==null?3:bl}px)`; g.globalAlpha=a; g.translate(mp(x),mp(z)); g.rotate(-(ry||0)); g.fillRect(-w/2*k,-d/2*k,w*k,d*k); g.restore(); };
  // R: 흙 (길 · 광장 둘레 · 시냇물 바닥 · 묘지 맨땅) · G: 접지 그늘 · B: 밭 흙
  const cR=vlCanvas(S,S,g=>{ g.fillStyle='#000'; g.fillRect(0,0,S,S); g.strokeStyle=g.fillStyle='#fff';
    GF_RP.forEach(r=>{ strokeP(g,r.pts,r.w+1.3,7,.42); strokeP(g,r.pts,r.w-.25,2.5,1); });
    disc(g,GF_PLAZA.x,GF_PLAZA.z,GF_PLAZA.r+1.2,.8,6); for (const s of Object.values(GF_SQ)) disc(g,s.x,s.z,s.r+1,.75,6);
    strokeP(g,GF_SP,GF_SW*2+.9,6,.9);
    disc(g,GF_WMILL.x,GF_WMILL.z,4.6,.6,8); disc(g,GF_CHURCH.x,GF_CHURCH.z+2,6.5,.35,10);
    for (let i=0;i<26;i++) disc(g,GF_CEM.x0+Math.random()*(GF_CEM.x1-GF_CEM.x0),GF_CEM.z0+Math.random()*(GF_CEM.z1-GF_CEM.z0),.8+Math.random()*1.6,.28,6);
    GF_HOUSES.forEach(H=>{ const fx=H.x+Math.sin(H.r)*H.d*GF_HS*.75, fz=H.z+Math.cos(H.r)*H.d*GF_HS*.75; disc(g,fx,fz,1.7,.7,5); });
    disc(g,0,36,3.2,.6,6); });
  const cG=vlCanvas(S,S,g=>{ g.fillStyle='#fff'; g.fillRect(0,0,S,S); });
  const cB=vlCanvas(S,S,g=>{ g.fillStyle='#000'; g.fillRect(0,0,S,S); g.fillStyle='#fff'; GF_PLOTS.forEach(p=>rect(g,p.x,p.z,p.w,p.d,0,1,2)); GF_WHEAT.forEach(f=>rect(g,(f.x0+f.x1)/2,(f.z0+f.z1)/2,f.x1-f.x0+.6,f.z1-f.z0+.6,0,.32,4));
    rect(g,(GF_CEM.x0+GF_CEM.x1)/2,(GF_CEM.z0+GF_CEM.z1)/2,GF_CEM.x1-GF_CEM.x0+1,GF_CEM.z1-GF_CEM.z0+1,0,.3,8); });   // 묘지: 마른 땅빛
  GF.gcv={R:cR,G:cG,B:cB,S,mp,k};
  const macro=vlCanvas(512,512,g=>{ g.fillStyle='rgb(128,128,128)'; g.fillRect(0,0,512,512);
    for (let i=0;i<300;i++){ const x=Math.random()*512, y=Math.random()*512, r=10+Math.random()*48, q=Math.random(), c=q<.32?'156,150,92':q<.6?'104,128,96':q<.78?'136,122,90':'118,130,104';
      vlWrapDraw(512,x,y,r,(X,Y)=>{ const gr=g.createRadialGradient(X,Y,0,X,Y,r); gr.addColorStop(0,`rgba(${c},.36)`); gr.addColorStop(1,`rgba(${c},0)`); g.fillStyle=gr; g.fillRect(X-r,Y-r,2*r,2*r); }); } });
  const macroT=vlTexRep(macro,true); macroT.encoding=THREE.LinearEncoding;
  const maskT=new THREE.CanvasTexture(vlCanvas(4,4,()=>{})); GF.mask=maskT;
  const grassT=vlGrassDetail(), dirtT=vlDirtDetail(), noiseT=vlNoiseTex();
  const GU=GF.GU={uGSat:{value:1.16},uGMul:{value:new THREE.Color(.74,.9,.64)},uDSat:{value:1.02},uDMul:{value:new THREE.Color(.86,.78,.68)},uEdge:{value:.3}};
  const mat=new THREE.MeshStandardMaterial({roughness:1,metalness:0});
  mat.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,{tMask:{value:maskT},tNoise:{value:noiseT},tGrassD:{value:grassT},tDirtD:{value:dirtT},tMacro:{value:macroT}},GU);
    sh.vertexShader='varying vec3 vGW;\n'+sh.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n vGW=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader='varying vec3 vGW; uniform sampler2D tMask,tNoise,tGrassD,tDirtD,tMacro; uniform float uGSat,uDSat,uEdge; uniform vec3 uGMul,uDMul;\nvec3 gfSL(vec3 c){ return pow(c,vec3(2.2)); }\nvec3 gfSat(vec3 c,float s){ return max(mix(vec3(dot(c,vec3(.2126,.7152,.0722))),c,s),0.); }\n'+sh.fragmentShader.replace('#include <map_fragment>',`
      vec2 gw=vGW.xz; vec2 muv=vec2(gw.x/${GF_MAP.toFixed(1)}+.5,.5-gw.y/${GF_MAP.toFixed(1)}); vec4 mk=texture2D(tMask,clamp(muv,.001,.999));
      float outside=step(.5,max(abs(muv.x-.5),abs(muv.y-.5))); mk=mix(mk,vec4(0.,1.,0.,1.),outside);
      vec2 tu=gw/3.;
      float n1=texture2D(tNoise,tu*.21).r, n2=texture2D(tNoise,tu*1.63).r;
      float dirt=smoothstep(.40,.60,mk.r+(n1-.5)*.45+(n2-.5)*.18);
      vec3 macro=texture2D(tMacro,gw/${GF_MAP.toFixed(1)}+.5).rgb*2.;
      vec3 gC=gfSat(gfSL(texture2D(tGrassD,tu).rgb)*macro,uGSat)*uGMul;
      vec3 dC=gfSat(gfSL(texture2D(tDirtD,tu*1.37+.31).rgb)*mix(vec3(1.),macro,.4),uDSat)*uDMul;
      float edge=smoothstep(.1,.5,mk.r)*(1.-dirt); gC=mix(gC,gC*vec3(.95,.86,.64),edge*uEdge);
      vec3 col=mix(gC,dC,dirt);
      float soil=smoothstep(.35,.7,mk.b+(n2-.5)*.2); float fur=.5+.5*sin(gw.y*7.4+n1*1.2);
      vec3 sC=mix(vec3(.16,.095,.05),vec3(.3,.19,.11),fur)*mix(vec3(1.),gfSL(texture2D(tDirtD,tu*2.1).rgb)*1.6,.5);
      col=mix(col,sC,soil*step(.8,mk.b+.2)); col=mix(col,col*vec3(1.02,.96,.78),smoothstep(.15,.4,mk.b)*(1.-step(.8,mk.b+.2))*(1.-dirt));
      col*=mix(.45,1.,mk.g);
      diffuseColor.rgb*=col;`); };
  mat.customProgramCacheKey=()=>'gfground';
  // 안쪽 땅은 촘촘하게(시냇물 바닥이 패여요), 바깥 땅은 넓게
  const IN=130, g1=new THREE.PlaneGeometry(IN,IN,260,260); g1.rotateX(-Math.PI/2);
  { const p=g1.attributes.position; for (let i=0;i<p.count;i++) p.setY(i,gfBed(p.getX(i),p.getZ(i))); g1.computeVertexNormals(); }
  const inner=new THREE.Mesh(g1,mat); inner.receiveShadow=true; R.add(inner);
  const fs=new THREE.Shape(); fs.moveTo(-320,-320); fs.lineTo(320,-320); fs.lineTo(320,320); fs.lineTo(-320,320); fs.lineTo(-320,-320);
  { const h=IN/2-.02, hp=new THREE.Path(); hp.moveTo(-h,-h); hp.lineTo(-h,h); hp.lineTo(h,h); hp.lineTo(h,-h); hp.lineTo(-h,-h); fs.holes.push(hp); }
  const og=new THREE.ShapeGeometry(fs); og.rotateX(-Math.PI/2);
  const outer=new THREE.Mesh(og,mat); outer.receiveShadow=true; R.add(outer);
  GF.groundMat=mat;
}
// 집 · 나무 · 소품을 다 놓은 뒤 접지 그늘을 그려 땅 지도를 완성해요
function gfGroundFinish(ao){
  const C=GF.gcv; if (!C) return; const S=C.S, mp=C.mp, k=C.k, g=C.G.getContext('2d');
  const blob=(x,z,r,a)=>{ const R2=r*k, gr=g.createRadialGradient(mp(x),mp(z),0,mp(x),mp(z),R2); gr.addColorStop(0,`rgba(0,0,0,${a})`); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(mp(x)-R2,mp(z)-R2,R2*2,R2*2); };
  const box=(x,z,w,d,r,a)=>{ g.save(); g.translate(mp(x),mp(z)); g.rotate(-r); g.filter='blur(7px)'; g.fillStyle=`rgba(0,0,0,${a})`; g.fillRect(-w/2*k,-d/2*k,w*k,d*k); g.restore(); };
  GF_HOUSES.forEach(H=>box(H.x,H.z,H.w*GF_HS+1.3,H.d*GF_HS+1.6,H.r,.6));
  ao.forEach(a=>a.w?box(a.x,a.z,a.w,a.d,a.r||0,a.k):blob(a.x,a.z,a.r,a.k));
  // 시냇가: 물에 젖은 진한 흙
  g.save(); g.filter='blur(5px)'; g.strokeStyle='rgba(0,0,0,.28)'; g.lineWidth=(GF_SW*2+1.2)*k; g.lineCap='round'; g.beginPath(); GF_SP.forEach((p,i)=>i?g.lineTo(mp(p.x),mp(p.z)):g.moveTo(mp(p.x),mp(p.z))); g.stroke(); g.restore();
  const out=vlCanvas(S,S,gg=>{ const a=C.R.getContext('2d').getImageData(0,0,S,S).data, b=C.G.getContext('2d').getImageData(0,0,S,S).data, c=C.B.getContext('2d').getImageData(0,0,S,S).data, id=gg.createImageData(S,S);
    for (let i=0;i<a.length;i+=4){ id.data[i]=a[i]; id.data[i+1]=b[i]; id.data[i+2]=c[i]; id.data[i+3]=255; } gg.putImageData(id,0,0); });
  GF.mask.image=out; GF.mask.needsUpdate=true; GF.maskData=out.getContext('2d').getImageData(0,0,S,S).data; GF.gcv=null; }
// 땅 지도 읽기 (풀 · 꽃을 심을 때)
function gfMaskAt(x,z,ch){ const D=GF.maskData; if (!D) return ch===1?1:0; const S=GF_MS, px=Math.max(0,Math.min(S-1,((x/GF_MAP+.5)*S)|0)), pz=Math.max(0,Math.min(S-1,((z/GF_MAP+.5)*S)|0)); return D[(pz*S+px)*4+ch]/255; }

/* ---------- 돌 포장 (광장 · 수정 광장) ---------- */
let GF_CURB=null;
function gfCobble(R,x,z,r,rad){
  const t=gfCobbleTex(0,rad); if (!rad) t.repeat.set(r*2/3.4,r*2/3.4);
  const m=new THREE.Mesh(new THREE.CircleGeometry(r,64),new THREE.MeshStandardMaterial({map:t,roughness:.92,metalness:0}));
  m.rotation.x=-Math.PI/2; m.position.set(x,.03,z); m.receiveShadow=true; R.add(m);
  const curb=new THREE.Mesh(new THREE.TorusGeometry(r,.18,6,72),GF_CURB||(GF_CURB=new THREE.MeshStandardMaterial({color:0x5e594f,roughness:.95}))); curb.rotation.x=Math.PI/2; curb.scale.z=.45; curb.position.set(x,.04,z); curb.receiveShadow=true; R.add(curb);
  return m; }

/* ---------- 시냇물 (하늘 · 해가 비치고, 남쪽으로 흘러요) ---------- */
function gfWater(R){
  const N=GF_SP.length, pos=[], uv=[], idx=[], ed=[];
  for (let i=0;i<N;i++){ const p=GF_SP[i], q=GF_SP[Math.min(N-1,i+1)], o=GF_SP[Math.max(0,i-1)]; let tx=q.x-o.x, tz=q.z-o.z; const tl=Math.hypot(tx,tz)||1; tx/=tl; tz/=tl;
    const w=GF_SW+.35, nx=-tz, nz=tx, v=i*.4;
    pos.push(p.x+nx*w,-.1,p.z+nz*w, p.x,-.1,p.z, p.x-nx*w,-.1,p.z-nz*w); uv.push(0,v,.5,v,1,v); ed.push(1,0,1);
    if (i<N-1){ const a=i*3; idx.push(a,a+3,a+1, a+1,a+3,a+4, a+1,a+4,a+2, a+2,a+4,a+5); } }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geo.setAttribute('aE',new THREE.Float32BufferAttribute(ed,1)); geo.setIndex(idx);
  const WU=GF.WU={uTime:{value:0},uSun:{value:new THREE.Vector3(.5,.62,.3).normalize()},uSunCol:{value:new THREE.Color(1,.92,.76)},uTop:{value:new THREE.Color()},uHor:{value:new THREE.Color()},uFog:{value:new THREE.Color()},uFogN:{value:40},uFogF:{value:150},uLightK:{value:new THREE.Color(1,1,1)}};
  const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:WU,transparent:true,depthWrite:false,
    vertexShader:'attribute float aE; varying float vE; varying vec2 vU; varying vec3 vW; void main(){ vE=aE; vU=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader:`uniform float uTime,uFogN,uFogF; uniform vec3 uSun,uSunCol,uTop,uHor,uFog,uLightK; varying float vE; varying vec2 vU; varying vec3 vW;
      float h2(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h2(i),h2(i+vec2(1.,0.)),f.x),mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),f.x),f.y); }
      float wav(vec2 p){ return vn(p*vec2(2.2,1.)+vec2(0.,-uTime*1.1))*.55+vn(p*vec2(4.6,2.)+vec2(uTime*.2,-uTime*1.9))*.3+vn(p*9.+vec2(0.,-uTime*2.6))*.15; }
      void main(){ vec2 p=vec2(vU.x*3.,vU.y); float e=.06; float n0=wav(p), nx=wav(p+vec2(e,0.)), nz=wav(p+vec2(0.,e));
        vec3 N=normalize(vec3((n0-nx)*.7,1.,(n0-nz)*.7));
        vec3 V=normalize(cameraPosition-vW); float fr=.04+.96*pow(1.-max(dot(N,V),0.),5.);
        vec3 R=reflect(-V,N); float ry=max(R.y,0.);
        vec3 sky=mix(uHor,uTop,pow(ry,.5)); float s=max(dot(R,uSun),0.); sky+=uSunCol*(pow(s,300.)*9.+pow(s,24.)*.5);
        vec3 deep=vec3(.05,.13,.15)*uLightK, shal=vec3(.2,.3,.22)*uLightK;
        vec3 col=mix(deep,shal,smoothstep(.2,1.,vE)); col=mix(col,sky,clamp(fr*1.1+.18,0.,1.));
        float foam=smoothstep(.62,.9,n0)*.35*(.3+.7*vE); col+=vec3(.9,.95,1.)*foam*uLightK;
        float a=mix(.84,.0,smoothstep(.72,1.,vE))*(1.-smoothstep(50.,60.,abs(vW.z)));
        float dist=length(vW-cameraPosition); col=mix(col,uFog,smoothstep(uFogN,uFogF,dist));
        gl_FragColor=vec4(col,a);
        #include <tonemapping_fragment>
      }`}));
  m.renderOrder=1; R.add(m); GF.water=m;
}

/* ---------- 하늘 (구름 · 해) · 먼 산 ---------- */
function gfSky(R){
  const U=GF.skyU={uTop:{value:new THREE.Color()},uHor:{value:new THREE.Color()},uFog:{value:new THREE.Color()},uSun:{value:new THREE.Vector3(.5,.62,.3).normalize()},uSunCol:{value:new THREE.Color(1,.93,.8)},uTime:{value:0},uCov:{value:.56},uCShade:{value:new THREE.Color(.72,.8,.94)},uCAdd:{value:new THREE.Color(.3,.3,.3)},uCloud:{value:1}};
  const sky=new THREE.Mesh(new THREE.SphereGeometry(300,40,20),new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,fog:false,
    vertexShader:'varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader:`uniform vec3 uTop,uHor,uSun,uSunCol,uFog,uCShade,uCAdd; uniform float uTime,uCov,uCloud; varying vec3 vD;
      float h2(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h2(i),h2(i+vec2(1.,0.)),f.x),mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),f.x),f.y); }
      float fbm(vec2 p){ float v=0., a=.5; for (int i=0;i<5;i++){ v+=a*vn(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return v; }
      vec2 cuv(vec3 d){ vec2 c=d.xz/(max(d.y,0.)+.16)*2.1; c.x*=.55; return c+vec2(uTime*.006,uTime*.0024); }
      void main(){ vec3 d=normalize(vD); float h=max(d.y,0.); vec3 c=mix(uHor,uTop,pow(h,.5)); float s=max(dot(d,uSun),0.);
        c+=uSunCol*(pow(s,600.)*5.+pow(s,24.)*.4+pow(s,4.)*.12);
        if (uCloud>.5&&d.y>0.){ vec2 cp=cuv(d); float n=fbm(cp);
          float cov=smoothstep(uCov,uCov+.22,n)*smoothstep(.0,.16,d.y)*(1.-smoothstep(.65,.98,d.y));
          if (cov>.001){ vec2 dir=normalize(cuv(uSun)-cp+1e-4); float n2=fbm(cp+dir*.09); float lit=clamp((n-n2)*5.+.5,0.,1.);
            vec3 cc=mix(uCShade,uSunCol*1.25+uCAdd,lit*(.4+.6*pow(s,1.5))); c=mix(c,cc,cov*.9); } }
        c=mix(uFog,c,smoothstep(-.02,.2,d.y));
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
      }`}));
  sky.renderOrder=-2; sky.frustumCulled=false; R.add(sky); GF.sky=sky;
  // 먼 산 두 겹 (안개 속)
  GF.mtnU=[];
  const layer=(Rr,H0,amp,seed,col,haze)=>{ const N=200, pos=[], ah=[], idx=[];
    for (let i=0;i<=N;i++){ const a=i/N*Math.PI*2; let h=0; for (let q=1;q<=6;q++) h+=Math.sin(a*(q<3?q:q*2)+seed*q*1.37)/q; h=H0+amp*h+amp*.16*Math.sin(a*31+seed);
      const x=Math.cos(a)*Rr, z=Math.sin(a)*Rr; pos.push(x,-6,z, x,Math.max(6,h),z); ah.push(0,1); }
    for (let i=0;i<N;i++){ const b=i*2; idx.push(b,b+1,b+2, b+1,b+3,b+2); }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('aH',new THREE.Float32BufferAttribute(ah,1)); geo.setIndex(idx);
    const mu={uCol:{value:new THREE.Color(col)},uFog:U.uFog,uHaze:{value:haze}}; GF.mtnU.push(mu);
    const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:mu,side:THREE.DoubleSide,fog:false,
      vertexShader:'attribute float aH; varying float vH; void main(){ vH=aH; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader:`uniform vec3 uCol,uFog; uniform float uHaze; varying float vH; void main(){ vec3 c=mix(uFog,uCol,uHaze*(.45+.55*vH)); gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
      }`}));
    m.frustumCulled=false; m.renderOrder=-1; R.add(m); };
  layer(255,30,13,1.3,0x5c7fa8,.4); layer(200,17,8,4.1,0x4f6f5a,.55);
}

/* ---------- 풀: 캐릭터 주변에 가는 풀잎 (마을 풀 셰이더를 전투 카메라에 맞춰 썼어요) ---------- */
function gfGrass(R){
  const S=512, mp=v=>(v/GF_MAP+.5)*S, k=S/GF_MAP;
  const cv=vlCanvas(S,S,g=>{ g.fillStyle='#fff'; g.fillRect(0,0,S,S); g.lineCap='round'; g.lineJoin='round';
    const st=(pts,w,c,bl)=>{ g.save(); g.filter=`blur(${bl}px)`; g.strokeStyle=c; g.lineWidth=w*k; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(mp(p.x),mp(p.z)):g.moveTo(mp(p.x),mp(p.z))); g.stroke(); g.restore(); };
    const disc=(x,z,r,c,bl)=>{ g.save(); g.filter=`blur(${bl}px)`; g.fillStyle=c; g.beginPath(); g.arc(mp(x),mp(z),r*k,0,7); g.fill(); g.restore(); };
    const rect=(x,z,w,d,r,c,bl)=>{ g.save(); g.filter=`blur(${bl}px)`; g.fillStyle=c; g.translate(mp(x),mp(z)); g.rotate(-(r||0)); g.fillRect(-w/2*k,-d/2*k,w*k,d*k); g.restore(); };
    GF_RP.forEach(r=>st(r.pts,r.w+3,'#666',4)); disc(GF_PLAZA.x,GF_PLAZA.z,GF_PLAZA.r+2.6,'#666',4);
    GF_RP.forEach(r=>st(r.pts,r.w+.5,'#000',1.5)); disc(GF_PLAZA.x,GF_PLAZA.z,GF_PLAZA.r+.3,'#000',1); for (const s of Object.values(GF_SQ)) disc(s.x,s.z,s.r+.4,'#000',1);
    st(GF_SP,GF_SW*2+.4,'#000',2);
    GF_HOUSES.forEach(H=>rect(H.x,H.z,H.w*GF_HS+.6,H.d*GF_HS+.6,H.r,'#000',1));
    GF_PLOTS.forEach(p=>rect(p.x,p.z,p.w+.4,p.d+.4,0,'#000',1)); GF_WHEAT.forEach(f=>rect((f.x0+f.x1)/2,(f.z0+f.z1)/2,f.x1-f.x0,f.z1-f.z0,0,'#000',1));
    rect(GF_CHURCH.x,GF_CHURCH.z,8.4,14.4,0,'#000',1); disc(GF_WMILL.x,GF_WMILL.z,3.4,'#000',1);
    rect((GF_CEM.x0+GF_CEM.x1)/2,(GF_CEM.z0+GF_CEM.z1)/2,GF_CEM.x1-GF_CEM.x0,GF_CEM.z1-GF_CEM.z0,0,'#888',3); });
  { const g=cv.getContext('2d'), id=g.getImageData(0,0,S,S), d=id.data, C=GF_CEM;   // 파랑 = 마른 풀 (묘지 · 밀밭 가장자리)
    for (let py=0;py<S;py++) for (let px=0;px<S;px++){ const x=(px+.5)/S*GF_MAP-GF_MAP/2, z=(py+.5)/S*GF_MAP-GF_MAP/2;
      const ec=Math.max(C.x0-x,x-C.x1,C.z0-z,z-C.z1), ew=Math.min(...GF_WHEAT.map(f=>Math.max(f.x0-x,x-f.x1,f.z0-z,z-f.z1)));
      const dry=Math.max(1-Math.max(0,Math.min(1,(ec+.5)/2.5)),.55*(1-Math.max(0,Math.min(1,ew/3))));
      d[(py*S+px)*4+2]=255*(1-dry); }
    g.putImageData(id,0,0); }
  const mt=new THREE.CanvasTexture(cv); mt.minFilter=THREE.LinearFilter; mt.generateMipmaps=false; GF.grassMask=cv.getContext('2d').getImageData(0,0,S,S).data;
  const U=GF.U={uTime:NAT_U.uTime,uPlayer:{value:new THREE.Vector3()},uCenter:{value:new THREE.Vector2()},uR:{value:21},uMap:{value:GF_MAP},uMask:{value:mt},uGround:{value:GF.mask},
    uTip:{value:VL_LIN('#a4c04a')},uTip2:{value:VL_LIN('#5f8f32')},uDry:{value:VL_LIN('#c2a64e')},uRoot:{value:VL_LIN('#3a5a1c')},uSun:{value:new THREE.Vector3(.5,.62,.3).normalize()},uSunCol:{value:new THREE.Color(1,.9,.7)},
    uFog:{value:new THREE.Color()},uFogN:{value:40},uFogF:{value:150},uLightK:{value:new THREE.Color(1,1,1)}};
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
  m.frustumCulled=false; m.userData.max=GMAX; R.add(m); GF.grass=m; GRASS.push(m);
}

/* ---------- 건물 · 소품 ---------- */
// 돌린 직사각형 둘레를 작은 충돌 상자로 막아요 (충돌 상자는 축에 나란한 상자만 돼서)
function gfColRect(x,z,w,d,r,cell){
  cell=cell||1.3; const c=Math.cos(r), s=Math.sin(r);
  if (Math.abs(s)<.04||Math.abs(c)<.04){ const W=Math.abs(c)>.5?w:d, D=Math.abs(c)>.5?d:w; addCol(x,z,W,D); return; }
  const nx=Math.max(1,Math.ceil(w/cell)), nz=Math.max(1,Math.ceil(d/cell)), cw=w/nx, cd=d/nz, e=Math.max(cw,cd)*.92;
  for (let i=0;i<nx;i++) for (let j=0;j<nz;j++){ if (i>0&&i<nx-1&&j>0&&j<nz-1) continue;
    const lx=-w/2+cw*(i+.5), lz=-d/2+cd*(j+.5); addCol(x+lx*c+lz*s,z-lx*s+lz*c,e,e); } }
function gfGroup(R,x,z,ry,sc){ const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; if (sc) g.scale.setScalar(sc); R.add(g); g.updateMatrixWorld(true); return g; }
let GF_MATS=null;
function gfMats(){ if (GF_MATS) return GF_MATS; const std=o=>{ if (o.color!=null) o.color=new THREE.Color(o.color).convertSRGBToLinear(); return new THREE.MeshStandardMaterial(Object.assign({roughness:.9,metalness:0},o)); };   // 고른 색 그대로 보이게 (선형 색으로 바꿔요)
  const glass=vlCanvas(128,256,g=>{ g.fillStyle='#1d2433'; g.fillRect(0,0,128,256); const cols=['#3d6fd8','#d84a3a','#e8b43a','#3aa860','#7a4ad0','#3aa0d0'];
    for (let y=0;y<256;y+=28) for (let x=0;x<128;x+=32){ g.fillStyle=cols[(Math.random()*cols.length)|0]; g.fillRect(x+3,y+3,26,22); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(x+3,y+3,26,6); }
    g.strokeStyle='#1d2433'; g.lineWidth=5; g.beginPath(); g.arc(64,64,40,0,7); g.stroke(); g.beginPath(); g.moveTo(64,0); g.lineTo(64,256); g.stroke(); });
  const gt=new THREE.CanvasTexture(glass); gt.encoding=THREE.sRGBEncoding;
  const clock=vlCanvas(256,256,g=>{ g.fillStyle='#f3ead2'; g.beginPath(); g.arc(128,128,124,0,7); g.fill(); g.lineWidth=10; g.strokeStyle='#3a3026'; g.beginPath(); g.arc(128,128,118,0,7); g.stroke();
    g.fillStyle='#3a3026'; for (let i=0;i<12;i++){ const a=i/12*Math.PI*2; g.save(); g.translate(128+Math.sin(a)*96,128-Math.cos(a)*96); g.rotate(a); g.fillRect(-4,-12,8,24); g.restore(); }
    g.lineCap='round'; g.lineWidth=11; g.beginPath(); g.moveTo(128,128); g.lineTo(128+Math.sin(5.2)*58,128-Math.cos(5.2)*58); g.stroke(); g.lineWidth=7; g.beginPath(); g.moveTo(128,128); g.lineTo(128+Math.sin(2.1)*86,128-Math.cos(2.1)*86); g.stroke();
    g.beginPath(); g.arc(128,128,10,0,7); g.fill(); });
  const ct=new THREE.CanvasTexture(clock); ct.encoding=THREE.sRGBEncoding;
  const plank=vlTexRep(vlCanvas(256,256,g=>{ for (let i=0;i<8;i++){ const v=.8+Math.random()*.3; g.fillStyle=`rgb(${142*v|0},${104*v|0},${68*v|0})`; g.fillRect(0,i*32,256,32); g.fillStyle='rgba(40,24,12,.55)'; g.fillRect(0,i*32,256,2);
    for (let k=0;k<14;k++){ g.strokeStyle='rgba(60,36,18,.22)'; g.beginPath(); const y=i*32+4+Math.random()*24; g.moveTo(0,y); g.lineTo(256,y+(Math.random()-.5)*5); g.stroke(); } } }));
  return GF_MATS={glass:std({map:gt,emissiveMap:gt,emissive:0xffffff,emissiveIntensity:.32,roughness:.3}),clock:std({map:ct,roughness:.6}),
    bronze:std({color:0xb08a3e,metalness:.7,roughness:.35}),gold:std({color:0xe0b84a,metalness:.75,roughness:.3}),dark:std({color:0x15121a,roughness:1}),
    slate:std({map:vlShingleTex('#4d5a72'),roughness:.75}),grave:std({color:0x928e86,roughness:.95}),grave2:std({color:0x7c7974,roughness:.95}),moss:std({color:0x4a6230,roughness:1}),
    deadwood:std({color:0x4a3f38,roughness:1}),plank:std({map:plank,roughness:.85}),sail:std({color:0xf0e6cf,roughness:.9,side:THREE.DoubleSide}),
    straw:vlMats().straw, pumpkin:std({color:0xe57a22,roughness:.6}),cabbage:std({color:0x8fbf4a,roughness:.7}),cabbage2:std({color:0x5f9a3a,roughness:.8}),leafDk:std({color:0x3f7a2c,roughness:.8}),
    shirt:std({color:0x4a6fa8,roughness:.9}),burlap:std({color:0xc7a46a,roughness:1}),apple:std({color:0xd8342a,roughness:.45}),soil:std({color:0x4b3324,roughness:1})}; }

/* 목조 집 (마을 집을 작게) */
function gfHouse(R,H){ const g=gfGroup(R,H.x,H.z,0,GF_HS); vlHouse2({...H,x:0,z:0},g); gfColRect(H.x,H.z,(H.w+.5)*GF_HS,(H.d+1.1)*GF_HS,H.r); }

/* 종탑 성당: 앞(남쪽)에 시계 · 종이 달린 종탑, 뒤에 돌 본당 */
function gfChurch(R){
  const M=vlMats(), X=gfMats(), g=gfGroup(R,GF_CHURCH.x,GF_CHURCH.z,0), put=vlPutter(g), B=vlBox;
  const W=7.2, D=9.2, H=4.4, y0=.5, zF=D/2;
  put(B(W+.7,y0,D+.7,1.4),M.stone,0,y0/2,0);
  put(B(W,H,D,2.4),M.stone,0,y0+H/2,0);
  for (const sx of [-1,1]) for (const sz of [-1,1]) put(B(.7,H+.3,.7,1.2),M.stoneDark,sx*(W/2+.15),y0+(H+.3)/2,sz*(zF-.2));   // 모서리 버팀벽
  for (const sx of [-1,1]) put(B(.6,H*.8,.6,1.2),M.stoneDark,sx*(W/2+.12),y0+H*.4,0);
  // 지붕 (가파른 슬레이트)
  const th=.95, og=.45, L=(W/2+og)/Math.cos(th), rise=(W/2)*Math.tan(th), yR=y0+H+rise;
  for (const s of [1,-1]){ put(B(L,.24,D+.9,1.5),X.slate,s*(Math.cos(th)*L/2-og*.0),yR-Math.sin(th)*L/2+.12,0,0,0,-s*th);
    put(B(L+.04,.3,.1,.6),M.wood,s*(Math.cos(th)*L/2),yR-Math.sin(th)*L/2+.08,(D+.9)/2,0,0,-s*th); }
  put(B(.3,.26,D+1,.6),M.wood,0,yR+.12,0);
  const tri=new THREE.Shape(); tri.moveTo(-W/2,0); tri.lineTo(W/2,0); tri.lineTo(0,rise); tri.lineTo(-W/2,0);
  for (const s of [1,-1]) put(vlUVScale(new THREE.ExtrudeGeometry(tri,{depth:.3,bevelEnabled:false}),1/2.4),M.stone,0,y0+H,s>0?zF-.3:-zF);
  // 옆 창 (뾰족한 아치 · 색유리)
  const arch=(w,h)=>{ const sh=new THREE.Shape(); sh.moveTo(-w/2,0); sh.lineTo(w/2,0); sh.lineTo(w/2,h-w*.6); sh.quadraticCurveTo(w/2,h-w*.1,0,h); sh.quadraticCurveTo(-w/2,h-w*.1,-w/2,h-w*.6); sh.lineTo(-w/2,0); return sh; };
  const archWin=(x,y,z,ry,w,h)=>{ const s2=new THREE.Group(), p=vlPutter(s2); s2.position.set(x,y,z); s2.rotation.y=ry; g.add(s2);
    p(new THREE.ExtrudeGeometry(arch(w+.24,h+.18),{depth:.1,bevelEnabled:false}),M.stoneLight,0,-.09,0);
    const gl=vlUVScale(new THREE.ShapeGeometry(arch(w,h)),1/w,1/h); { const uv=gl.attributes.uv; for (let i=0;i<uv.count;i++) uv.setX(i,uv.getX(i)+.5); uv.needsUpdate=true; } p(gl,X.glass,0,0,.11).castShadow=false; };
  for (const s of [1,-1]) for (const z of [-2.6,0,2.6]) archWin(s*(W/2+.01),y0+1.4,z,s*Math.PI/2,.9,2.2);
  archWin(0,y0+1.6,-zF-.01,Math.PI,1.6,2.6);
  // 종탑
  const T=3.6, tz=zF+T/2-.1, tH=8.6, by=y0+tH, bH=2.3;
  put(B(T+.5,y0,T+.5,1.4),M.stone,0,y0/2,tz);
  put(B(T,tH,T,2.4),M.stone,0,y0+tH/2,tz);
  for (const y of [y0+3.4,by]) put(B(T+.26,.24,T+.26,1),M.stoneLight,0,y,tz);
  // 문 (아치 · 나무) · 계단
  { const dg=vlUVScale(new THREE.ExtrudeGeometry(arch(1.5,2.5),{depth:.12,bevelEnabled:false}),1/1.5,1/2.5); { const uv=dg.attributes.uv; for (let i=0;i<uv.count;i++) uv.setX(i,uv.getX(i)+.5); uv.needsUpdate=true; }
    put(dg,M.door,0,y0,tz+T/2+.01); put(new THREE.ExtrudeGeometry(arch(2.0,2.85),{depth:.1,bevelEnabled:false}),M.stoneLight,0,y0,tz+T/2-.02);
    put(B(2.6,.25,.7,1),M.stone,0,.12,tz+T/2+.55); put(B(2.2,.25,.45,1),M.stone,0,.37,tz+T/2+.3); }
  archWin(0,y0+4.3,tz+T/2+.01,0,.7,1.5);
  for (const s of [1,-1]) archWin(s*(T/2+.01),y0+4.3,tz,s*Math.PI/2,.6,1.3);
  // 시계
  put(new THREE.CylinderGeometry(.82,.82,.12,32),M.stoneLight,0,by-1.25,tz+T/2+.04,Math.PI/2,0,0);
  put(new THREE.CircleGeometry(.72,32),X.clock,0,by-1.25,tz+T/2+.11).castShadow=false;
  // 종 칸: 네 기둥 · 아치 창 · 종
  for (const sx of [-1,1]) for (const sz of [-1,1]) put(B(.72,bH,.72,1.2),M.stone,sx*(T/2-.36),by+bH/2,tz+sz*(T/2-.36));
  for (const [ax,az,ry] of [[0,T/2-.2,0],[0,-T/2+.2,0],[T/2-.2,0,Math.PI/2],[-T/2+.2,0,Math.PI/2]]) put(B(T-1.3,.5,.36,1),M.stone,ax,by+bH-.25,tz+az,0,ry,0);
  put(B(T+.4,.36,T+.4,1),M.stoneLight,0,by+bH+.18,tz);
  { const bell=new THREE.Group(); bell.position.set(0,by+bH-.55,tz); g.add(bell);
    const prof=[[0,0],[.22,0],[.28,-.15],[.32,-.5],[.42,-.8],[.5,-.92],[.5,-.98],[0,-.98]].map(([x,y])=>new THREE.Vector2(x,y));
    const bm=new THREE.Mesh(new THREE.LatheGeometry(prof,24),X.bronze); bm.castShadow=true; bell.add(bm);
    const yk=new THREE.Mesh(B(1.4,.18,.18,.6),M.wood); yk.position.y=.12; bell.add(yk); yk.userData.keep=true; bm.userData.keep=true;
    GF.bell=bell; }
  // 첨탑 (네모 뿔) · 금빛 장식 · 바람개비
  const sp=new THREE.Mesh(new THREE.ConeGeometry((T+.3)/Math.SQRT2,5,4),X.slate); sp.rotation.y=Math.PI/4; sp.position.set(0,by+bH+.36+2.5,tz); sp.castShadow=true; g.add(sp);
  put(new THREE.SphereGeometry(.2,12,8),X.gold,0,by+bH+.36+5.1,tz); put(new THREE.CylinderGeometry(.04,.04,1,6),X.gold,0,by+bH+.36+5.6,tz);
  put(B(.9,.08,.05,.5),X.gold,0,by+bH+.36+5.9,tz); put(new THREE.ConeGeometry(.1,.26,4),X.gold,.5,by+bH+.36+5.9,tz,0,0,-Math.PI/2);
  vlMerge(g);
  addCol(GF_CHURCH.x,GF_CHURCH.z,W+.8,D+.8); addCol(GF_CHURCH.x,GF_CHURCH.z+tz,T+.6,T+.6);
  GF.ao.push({x:GF_CHURCH.x,z:GF_CHURCH.z+1,w:W+2.2,d:D+T+2,k:.55}); }

/* 풍차: 흰 회벽 탑 · 둘레 난간 · 나무 지붕 · 도는 날개 (앞이 동쪽 = 광장 쪽) */
function gfWindmill(R){
  const M=vlMats(), X=gfMats(), g=gfGroup(R,GF_WMILL.x,GF_WMILL.z,Math.PI/2), put=vlPutter(g), B=vlBox;
  put(vlUVScale(new THREE.CylinderGeometry(3.1,3.3,.5,28,1,true),8,.4),M.stone2,0,.25,0); put(new THREE.CircleGeometry(3.1,28),M.stoneLight,0,.5,0,-Math.PI/2,0,0);
  const O=Math.PI/8;   // 팔각형 면이 앞(+z)을 보게
  put(new THREE.CylinderGeometry(2.36,2.42,1.3,8,1,false,O),M.stone,0,1.15,0);
  put(vlUVScale(new THREE.CylinderGeometry(1.62,2.3,6.8,8,1,false,O),3,2.6),M.plasterW,0,1.8+3.4,0);
  for (const [y,r] of [[1.85,2.36],[5.1,1.98],[8.55,1.66]]) put(new THREE.CylinderGeometry(r,r,.18,8,1,false,O),M.wood,0,y,0);
  // 둘레 난간
  put(new THREE.CylinderGeometry(2.9,2.9,.12,24),M.woodLight,0,5.2,0);
  for (let i=0;i<16;i++){ const a=i/16*Math.PI*2; put(B(.08,.75,.08,.5),M.wood,Math.cos(a)*2.8,5.6,Math.sin(a)*2.8); }
  put(new THREE.TorusGeometry(2.8,.05,5,40),M.wood,0,5.95,0,Math.PI/2,0,0);
  // 문 · 창
  put(B(1.1,1.9,.14,1),M.door,0,1.45,2.26); put(B(1.4,.18,.3,.5),M.wood,0,2.48,2.3);
  for (const [y,z] of [[3.8,1.98],[7.2,1.68]]) put(B(.6,.75,.1,.5),M.win,0,y,z).castShadow=false;
  // 지붕
  put(new THREE.CylinderGeometry(1.86,1.86,.34,16),M.wood,0,8.75,0);
  put(new THREE.ConeGeometry(2.08,2.5,16),M.roof('#5c4232'),0,10.15,0);
  put(new THREE.SphereGeometry(.16,10,8),M.wood,0,11.45,0);
  // 날개 (z축 둘레로 돌아요)
  const hub=new THREE.Group(); hub.position.set(0,8.6,2.1); g.add(hub);
  put(new THREE.CylinderGeometry(.16,.16,1.2,10),M.wood,0,8.6,1.55,Math.PI/2,0,0);
  const sails=new THREE.Group(); hub.add(sails);
  { const p=vlPutter(sails); p(new THREE.CylinderGeometry(.3,.3,.34,12),M.wood,0,0,.1,Math.PI/2,0,0);
    for (let k=0;k<4;k++){ const arm=new THREE.Group(); arm.rotation.z=k*Math.PI/2+.3; sails.add(arm); const pa=vlPutter(arm);
      pa(B(.16,5.8,.14,.6),M.wood,0,3.0,.18);
      for (let j=0;j<7;j++) pa(B(1.25,.06,.06,.5),M.wood,.55,1.2+j*.72,.2);
      pa(B(.06,4.6,.06,.5),M.wood,1.15,3.5,.2);
      pa(new THREE.PlaneGeometry(1.08,4.5),X.sail,.6,3.5,.24).castShadow=true; } }
  GF.sails=sails;
  sails.children.forEach(a=>{ if (a.isGroup) vlMerge(a); }); sails.traverse(o=>{ if (o.isMesh) o.userData.keep=true; });   // 날개는 따로 돌아야 해서 큰 덩어리에 합치지 않아요
  vlMerge(g);
  addCol(GF_WMILL.x,GF_WMILL.z,5,5); GF.ao.push({x:GF_WMILL.x,z:GF_WMILL.z,r:4.2,k:.5}); }

/* 물레방아: 물레방아 집 서쪽 벽, 시냇물에 반쯤 잠겨 돌아요 */
function gfWheel(R){
  const M=vlMats(), H=GF_HOUSES[5], wx=H.x-H.w*GF_HS/2-.5, wz=H.z, wy=1.15, r=1.75;
  const g=gfGroup(R,wx,wz,0); const wheel=new THREE.Group(); wheel.position.y=wy; g.add(wheel);
  const put=vlPutter(wheel), B=vlBox;
  for (const s of [-1,1]) put(new THREE.TorusGeometry(r,.07,6,40),M.wood,s*.36,0,0,0,Math.PI/2,0);
  for (let i=0;i<4;i++) for (const s of [-1,1]) put(B(.08,r*2,.1,.6),M.wood,s*.36,0,0,i*Math.PI/4,0,0);
  for (let i=0;i<14;i++){ const a=i/14*Math.PI*2; put(B(.86,.46,.06,.6),M.woodLight,0,Math.cos(a)*(r-.1),Math.sin(a)*(r-.1),a,0,0); }
  put(new THREE.CylinderGeometry(.28,.28,.9,12),M.wood,0,0,0,0,0,Math.PI/2);
  vlMerge(wheel);
  const ax=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,1.4,10),M.iron); ax.rotation.z=Math.PI/2; ax.position.set(.7,wy,0); ax.castShadow=true; g.add(ax);
  // 물길 (나무 수로) · 떨어지는 물
  const fl=new THREE.Group(); g.add(fl); const pf=vlPutter(fl);
  pf(B(.7,.12,4.2,1),M.wood,0,wy+r+.32,-2.6,.1,0,0); for (const s of [-1,1]) pf(B(.08,.3,4.2,.5),M.wood,s*.33,wy+r+.45,-2.6,.1,0,0);
  for (const z of [-4.2,-2.6]) pf(B(.14,wy+r+.3,.14,.6),M.wood,0,(wy+r+.3)/2,z);
  vlMerge(fl);
  GF.wheel=wheel; addCol(wx,wz,1.1,r*2+.2); }

/* 다리: 나무 판자 · 난간 · 양쪽 돌 받침 */
function gfBridge(R){
  const M=vlMats(), X=gfMats(), g=gfGroup(R,GF_BR.x,GF_BR.z,0), put=vlPutter(g), B=vlBox, hl=GF_BR.hl+1.1, hw=GF_BR.hw;
  for (let x=-hl+.21;x<=hl-.2;x+=.42){ const y0=gfBridgeY(GF_BR.x+x-.21), y1=gfBridgeY(GF_BR.x+x+.21), y=(y0+y1)/2, a=Math.atan2(y1-y0,.42);
    put(B(.4,.09,hw*2-.1,1),X.plank,x,y-.045,(Math.random()-.5)*.06,0,(Math.random()-.5)*.03,a); }
  for (const s of [-1,1]){ const segs=[[-hl,-GF_BR.hl+.4],[-GF_BR.hl+.4,GF_BR.hl-.4],[GF_BR.hl-.4,hl]];
    segs.forEach(([a,b])=>{ const ya=gfBridgeY(GF_BR.x+a), yb=gfBridgeY(GF_BR.x+b), L=Math.hypot(b-a,yb-ya); put(B(L+.05,.2,.16,.6),M.wood,(a+b)/2,(ya+yb)/2-.16,s*(hw-.05),0,0,Math.atan2(yb-ya,b-a)); }); }
  // 난간
  for (const s of [-1,1]){ for (let x=-GF_BR.hl+.2;x<=GF_BR.hl-.1;x+=1.15){ const y=gfBridgeY(GF_BR.x+x); put(B(.14,.95,.14,.5),M.wood,x,y+.42,s*(hw+.02)); }
    put(B(GF_BR.hl*2-.2,.12,.12,.6),M.woodLight,0,GF_BR.h+.86,s*(hw+.02)); put(B(GF_BR.hl*2-.2,.08,.08,.6),M.wood,0,GF_BR.h+.5,s*(hw+.02));
    addCol(GF_BR.x,GF_BR.z+s*(hw+.1),GF_BR.hl*2-.4,.3); }
  // 다리 밑 받침 · 돌 받침
  for (const x of [-1.2,1.2]){ put(B(.24,.9,hw*2,.6),M.wood,x,-.2,0); }
  for (const s of [-1,1]) put(B(1.4,.6,hw*2+.8,1.2),M.stone,s*(GF_BR.hl+.1),-.12,0);
  vlMerge(g); }

/* 오래된 묘지: 무너진 돌담 · 비석 · 납골당 · 마른 나무 (보스가 여기서 깨어나요) */
function gfCemetery(R){
  const M=vlMats(), X=gfMats(), C=GF_CEM, g=gfGroup(R,0,0,0), put=vlPutter(g), B=vlBox;
  const wall=(ax,az,bx,bz,gaps)=>{ const L=Math.hypot(bx-ax,bz-az), n=Math.floor(L/.62), horiz=Math.abs(bz-az)<.01; let run=[];
    const flush=()=>{ if (run.length>1){ const a=run[0], b=run[run.length-1]; horiz?addCol((a.x+b.x)/2,a.z,Math.abs(b.x-a.x)+.62,.55):addCol(a.x,(a.z+b.z)/2,.55,Math.abs(b.z-a.z)+.62); } run=[]; };
    for (let i=0;i<n;i++){ const t=(i+.5)/n, x=ax+(bx-ax)*t, z=az+(bz-az)*t, d=t*L;
      if (gaps.some(([a,b])=>d>a&&d<b)||Math.random()<.1){ flush(); continue; }
      const low=Math.random()<.2, h=low?rnd(.2,.38):rnd(.5,.82); put(B(.62,h,.5,1),M.stoneDark,x,h/2,z,0,(horiz?0:Math.PI/2)+rnd(-.08,.08),rnd(-.05,.05));
      if (!low&&Math.random()<.3) put(B(.48,.05,.44,1),X.moss,x,h+.02,z,0,horiz?0:Math.PI/2,0);
      run.push({x,z}); }
    flush(); };
  wall(C.x0,C.z0,C.x1,C.z0,[[2.4,3.6],[7.6,8.4]]); wall(C.x0,C.z1,C.x1,C.z1,[[3.2,4.4],[8.4,9.4]]);
  wall(C.x0,C.z0,C.x0,C.z1,[[4.6,6.4]]); wall(C.x1,C.z0,C.x1,C.z1,[[2.2,3.4],[7,8]]);
  // 문 기둥
  for (const z of [21.3,23.5]){ put(B(.7,1.6,.7,1),M.stoneDark,C.x0,.8,z); put(B(.86,.18,.86,1),M.stoneLight,C.x0,1.69,z); put(new THREE.SphereGeometry(.2,10,8),M.stoneLight,C.x0,1.98,z); addCol(C.x0,z,.8,.8); }
  // 비석 (둥근 머리 · 기울어진 것 · 부서진 것)
  const head=(w,h)=>{ const s=new THREE.Shape(); s.moveTo(-w/2,0); s.lineTo(w/2,0); s.lineTo(w/2,h-w/2); s.absarc(0,h-w/2,w/2,0,Math.PI,false); s.lineTo(-w/2,0); return s; };
  const rows=[19.6,22.2,24.8,27.2], cols=[8.6,10.2,14.2,15.8];
  rows.forEach((z,ri)=>cols.forEach((x,ci)=>{ if (Math.random()<.14) return; if (ri===0&&ci>=2) return;
    const w=rnd(.42,.56), h=rnd(.6,.85)*(Math.random()<.15?.55:1), geo=new THREE.ExtrudeGeometry(head(w,h),{depth:.12,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:1});
    const m=put(geo,Math.random()<.5?X.grave:X.grave2,x+rnd(-.2,.2),0,z+rnd(-.15,.15),rnd(-.12,.12),Math.PI+rnd(-.2,.2),rnd(-.14,.14)); m.position.y=-.05;
    put(B(.36,.12,.6,1),X.moss,x,.06,z+.4); if (Math.random()<.4) put(new THREE.SphereGeometry(.09,6,5),M.flowers[(Math.random()*5)|0],x+rnd(-.15,.15),.1,z+.32); }));
  // 열린 무덤 (보스가 깨어나는 곳)
  put(B(1.1,.12,2.1,1),X.soil,12.2,.04,23.6); for (const s of [-1,1]) put(B(.4,.28,2.2,1),X.soil,12.2+s*.78,.12,23.6,0,0,s*.3);
  put(new THREE.ExtrudeGeometry(head(.72,1.05),{depth:.16,bevelEnabled:false}),X.grave2,12.2,-.05,22.2,-.18,Math.PI,.05);
  // 납골당
  { const cg=gfGroup(R,15.6,19.6,-Math.PI/2), p=vlPutter(cg); p(B(3.2,.3,3.6,1.2),M.stone,0,.15,0); p(B(2.6,2.3,3.0,1.6),M.stoneDark,0,1.45,0);
    for (const s of [1,-1]){ p(B(1.75,.16,3.4,1.2),X.slate,s*.72,2.95,0,0,0,-s*.62); }
    const tri=new THREE.Shape(); tri.moveTo(-1.3,0); tri.lineTo(1.3,0); tri.lineTo(0,.95); tri.lineTo(-1.3,0);
    for (const s of [1,-1]) p(new THREE.ExtrudeGeometry(tri,{depth:.16,bevelEnabled:false}),M.stoneDark,0,2.6,s>0?1.34:-1.5);
    p(B(1.0,1.6,.1,1),M.iron,0,1.1,1.53); for (const s of [-1,1]) p(new THREE.CylinderGeometry(.14,.16,2,10),M.stoneLight,s*.95,1.3,1.62);
    p(B(2.3,.2,.4,1),M.stoneLight,0,2.4,1.62); vlMerge(cg); addCol(15.6,19.6,3.8,3.4); }
  // 마른 나무
  { const tg=gfGroup(R,9,19.2,0), p=vlPutter(tg); p(new THREE.CylinderGeometry(.14,.26,2.8,7),X.deadwood,0,1.4,0,.05,0,.06);
    const br=(y,a,tilt,len,r0)=>{ const b=p(new THREE.CylinderGeometry(r0*.5,r0,len,6),X.deadwood,Math.cos(a)*Math.sin(tilt)*len/2,y+Math.cos(tilt)*len/2,Math.sin(a)*Math.sin(tilt)*len/2); b.rotation.set(0,-a,0); b.rotateZ(-tilt); return b; };
    [[2.2,.3,.8,1.6,.11],[2.5,2.4,.7,1.4,.1],[1.8,4.1,.95,1.2,.09],[2.7,5.3,.5,1.1,.08],[1.5,1.6,1.1,1,.08]].forEach(a=>br(...a));
    vlMerge(tg); addCol(9,19.2,.7,.7); }
  // 등불 (문 앞)
  for (const z of [20.4,24.4]){ const lg=gfGroup(R,C.x0-.9,z,0,.8); vlGardenLight(0,0,lg); }
  vlMerge(g);
  // 안개 (천천히 떠다녀요)
  const ft=vlTex(vlCanvas(128,128,c=>{ const gr=c.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(235,240,250,.85)'); gr.addColorStop(1,'rgba(235,240,250,0)'); c.fillStyle=gr; c.fillRect(0,0,128,128); }));
  GF.fog=[]; for (let i=0;i<9;i++){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:ft,transparent:true,depthWrite:false,opacity:.22}));
    sp.position.set(rnd(C.x0+1,C.x1-1),rnd(.35,.8),rnd(C.z0+1,C.z1-1)); sp.scale.set(rnd(3.5,5.5),rnd(1.2,1.8),1); sp.userData={ph:Math.random()*6.28,x:sp.position.x,z:sp.position.z}; R.add(sp); GF.fog.push(sp); }
  GF.ao.push({x:15.6,z:19.6,w:4.4,d:4.2,k:.5}); }

/* 농장: 텃밭 작물 · 허수아비 · 수레 · 밭 울타리 */
function gfFarm(R){
  const M=vlMats(), X=gfMats(), D=new THREE.Object3D();
  const inst=(geo,mat,list,shadow)=>{ const im=new THREE.InstancedMesh(geo,mat,list.length); list.forEach((t,i)=>{ D.position.set(t.x,t.y||0,t.z); D.rotation.set(t.rx||0,t.ry||0,t.rz||0); D.scale.set(t.sx||t.s||1,t.sy||t.s||1,t.sz||t.s||1); D.updateMatrix(); im.setMatrixAt(i,D.matrix); }); im.castShadow=shadow!==false; im.receiveShadow=true; R.add(im); return im; };
  const cab=[], cabL=[], pum=[], pumL=[], car=[];
  { const p=GF_PLOTS[0]; for (let x=p.x-p.w/2+.45;x<p.x+p.w/2-.2;x+=.66) for (let z=p.z-p.d/2+.4;z<p.z+p.d/2-.2;z+=.72){ const s=rnd(.8,1.15); cab.push({x:x+rnd(-.06,.06),y:.14*s,z:z+rnd(-.06,.06),s:s*.22,sy:s*.17,ry:rnd(0,6)}); cabL.push({x,y:.06,z,s:s*.36,sy:s*.07,ry:rnd(0,6)}); } }
  { const p=GF_PLOTS[1]; for (let x=p.x-p.w/2+.5;x<p.x+p.w/2-.2;x+=.95) for (let z=p.z-p.d/2+.5;z<p.z+p.d/2-.2;z+=.9){ if (Math.random()<.25) continue; const s=rnd(.75,1.25); pum.push({x:x+rnd(-.12,.12),y:.15*s,z:z+rnd(-.1,.1),s:s*.26,sy:s*.19,ry:rnd(0,6)}); }
    for (let i=0;i<70;i++) pumL.push({x:p.x+rnd(-p.w/2+.2,p.w/2-.2),y:.05,z:p.z+rnd(-p.d/2+.2,p.d/2-.2),s:rnd(.16,.26),sy:.05,ry:rnd(0,6)}); }
  { const p=GF_PLOTS[2]; for (let x=p.x-p.w/2+.4;x<p.x+p.w/2-.2;x+=.6) for (let z=p.z-p.d/2+.3;z<p.z+p.d/2-.2;z+=.32) for (let k=0;k<3;k++) car.push({x:x+rnd(-.05,.05),y:.16,z:z+rnd(-.05,.05),s:1,sy:rnd(.8,1.3),rx:rnd(-.35,.35),rz:rnd(-.35,.35)}); }
  inst(new THREE.IcosahedronGeometry(1,1),X.cabbage,cab); inst(new THREE.IcosahedronGeometry(1,0),X.cabbage2,cabL,false);
  const pg2=new THREE.SphereGeometry(1,12,8); { const p=pg2.attributes.position; for (let i=0;i<p.count;i++){ const x=p.getX(i), z=p.getZ(i), a=Math.atan2(z,x), k=1+.08*Math.cos(a*8); p.setX(i,x*k); p.setZ(i,z*k); } pg2.computeVertexNormals(); }
  inst(pg2,X.pumpkin,pum); inst(new THREE.IcosahedronGeometry(1,0),X.leafDk,pumL,false);
  inst(new THREE.ConeGeometry(.035,.34,4),X.leafDk,car,false);
  // 밭 둘레 낮은 울타리 (지나갈 수 있어요)
  const fp=[]; const fence=(ax,az,bx,bz)=>{ const L=Math.hypot(bx-ax,bz-az), n=Math.max(1,Math.floor(L/1.1)), ang=Math.atan2(bz-az,bx-ax);
    for (let i=0;i<=n;i++){ const t=i/n; fp.push({x:ax+(bx-ax)*t,y:.32,z:az+(bz-az)*t,sx:.1,sy:.64,sz:.1,ry:-ang+rnd(-.05,.05)}); }
    for (const y of [.24,.5]) fp.push({x:(ax+bx)/2,y,z:(az+bz)/2,sx:L,sy:.06,sz:.05,ry:-ang}); };
  GF_PLOTS.forEach(p=>{ const x0=p.x-p.w/2-.35, x1=p.x+p.w/2+.35, z0=p.z-p.d/2-.35, z1=p.z+p.d/2+.35; fence(x0,z0,x1,z0); fence(x0,z1,x0+(x1-x0)*.35,z1); fence(x0,z0,x0,z1); fence(x1,z0,x1,z1-(z1-z0)*.4); });
  { const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),vlMats().woodN,fp.length); fp.forEach((f,i)=>{ D.position.set(f.x,f.y,f.z); D.rotation.set(0,f.ry,0); D.scale.set(f.sx,f.sy,f.sz); D.updateMatrix(); im.setMatrixAt(i,D.matrix); im.setColorAt(i,VL_LIN(['#8a6442','#7d5a3b','#93704c'][i%3])); }); im.castShadow=im.receiveShadow=true; R.add(im); }
  // 허수아비 (서쪽 밀밭)
  { const sg=gfGroup(R,-27.2,8,.5), p=vlPutter(sg), B=vlBox; p(B(.12,2.2,.12,.6),M.wood,0,1.1,0); p(B(1.5,.1,.1,.6),M.wood,0,1.55,0);
    p(B(.62,.7,.32,1),X.shirt,0,1.42,0); for (const s of [-1,1]) p(B(.5,.18,.2,1),X.shirt,s*.5,1.55,0); p(new THREE.SphereGeometry(.24,10,8),X.burlap,0,2.0,0);
    p(new THREE.CylinderGeometry(.42,.42,.04,14),X.straw,0,2.2,0); p(new THREE.ConeGeometry(.22,.3,12),X.straw,0,2.36,0);
    for (const s of [-1,1]) p(new THREE.ConeGeometry(.09,.3,5),X.straw,s*.78,1.55,0,0,0,s*Math.PI/2); vlMerge(sg); }
  // 농가 앞 수레 · 짚단
  { const c=gfGroup(R,-18.6,26.2,.7,.8), p=vlPutter(c), B=vlBox;
    p(B(1.6,.12,1.0,1),M.woodLight,0,.62,0); for (const s of [1,-1]){ p(B(1.6,.32,.07,1),M.woodLight,0,.84,s*.5); p(B(.07,.32,1.0,1),M.woodLight,s*.8,.84,0); }
    for (const s of [1,-1]){ p(new THREE.TorusGeometry(.4,.05,6,18),M.iron,-.1,.45,s*.6); for (let k=0;k<3;k++) p(B(.05,.76,.04),M.wood,-.1,.45,s*.6,0,0,k*Math.PI/3); }
    for (const s of [1,-1]) p(B(1.4,.07,.07,1),M.woodLight,1.45,.66,s*.35,0,0,-.12); p(B(1.25,.42,.72,1),M.straw,-.1,.9,0,0,.15,0);
    vlMerge(c); addCol(-18.6,26.2,2.2,2.2); }
  GF.ao.push({x:-18.6,z:26.2,r:1.8,k:.4}); }

/* 밀밭: 바람에 출렁이는 밀 (지나갈 수 있어요) */
function gfWheat(R){
  const P=[-.014,0,0, .014,0,0, -.011,.7,0, .011,.7,0, -.036,.82,0, .036,.82,0, 0,1,0, 0,.68,0];
  const pos=[], hd=[], idx=[];
  for (const r of [0,Math.PI/2]){ const b=pos.length/3, c=Math.cos(r), s=Math.sin(r); for (let i=0;i<8;i++){ pos.push(P[i*3]*c,P[i*3+1],P[i*3]*s); hd.push(i>=4?1:0); } idx.push(b,b+1,b+2, b+1,b+3,b+2, b+7,b+5,b+4, b+4,b+5,b+6); }
  const off=[], pr=[];
  GF_WHEAT.forEach(f=>{ const sp=.17; for (let x=f.x0;x<f.x1;x+=sp) for (let z=f.z0;z<f.z1;z+=sp){ const e=Math.min(x-f.x0,f.x1-x,z-f.z0,f.z1-z); if (e<.4&&Math.random()<.5) continue;
    off.push(x+rnd(-.07,.07),0,z+rnd(-.07,.07)); pr.push(Math.random()*6.283,rnd(.82,1.08)*(e<.5?.85:1),Math.random(),Math.random()); } });
  const n=off.length/3, geo=new THREE.InstancedBufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('aHd',new THREE.Float32BufferAttribute(hd,1)); geo.setIndex(idx);
  geo.setAttribute('aOff',new THREE.InstancedBufferAttribute(new Float32Array(off),3)); geo.setAttribute('aP',new THREE.InstancedBufferAttribute(new Float32Array(pr),4)); geo.instanceCount=n;
  const U=GF.U;
  const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:{uTime:NAT_U.uTime,uPlayer:U.uPlayer,uSun:U.uSun,uSunCol:U.uSunCol,uFog:U.uFog,uFogN:U.uFogN,uFogF:U.uFogF,uLightK:U.uLightK},side:THREE.DoubleSide,
    vertexShader:`attribute vec3 aOff; attribute vec4 aP; attribute float aHd; uniform float uTime; uniform vec3 uPlayer; varying float vH,vHd,vV; varying vec3 vW;
      void main(){ float c=cos(aP.x), s=sin(aP.x); float h=position.y; vec3 p=vec3(position.x*c-position.z*s, h*aP.y*.92, position.x*s+position.z*c);
        float g=sin(uTime*1.25+aOff.x*.32+aOff.z*.18)*.6+sin(uTime*2.3+aOff.x*.9-aOff.z*.6)*.2+.25; p.xz+=vec2(.8,.5)*g*.24*h*h;
        vec3 wp=aOff+p; vec2 d=wp.xz-uPlayer.xz; float dl=length(d)+1e-4; float push=smoothstep(.95,.0,dl)*h; wp.xz+=d/dl*push*.42; wp.y-=push*.28;
        vW=wp; vH=h; vHd=aHd; vV=aP.z; gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.); }`,
    fragmentShader:`uniform vec3 uSun,uSunCol,uFog,uLightK; uniform float uFogN,uFogF; varying float vH,vHd,vV; varying vec3 vW;
      void main(){ vec3 st=mix(vec3(.2,.2,.05),vec3(.62,.52,.16),smoothstep(0.,.75,vH)); vec3 hc=mix(vec3(.66,.5,.15),vec3(.86,.7,.3),vV);
        vec3 alb=mix(st,hc,vHd)*(.85+.3*vV); vec3 col=alb*uLightK;
        vec3 V=normalize(vW-cameraPosition); col+=uSunCol*pow(max(dot(V,uSun),0.),4.)*vH*.45;
        float dist=length(vW-cameraPosition); col=mix(col,uFog,smoothstep(uFogN,uFogF,dist));
        gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
      }`}));
  m.frustumCulled=false; m.userData.max=n; R.add(m); GF.wheat=m; }

/* 경계: 남쪽 산울타리 · 문 · 동서 나무 울타리 */
function gfBounds(R,put2){
  const M=vlMats(), D=new THREE.Object3D(), fp=[];
  const fence=(ax,az,bx,bz,gaps)=>{ const L=Math.hypot(bx-ax,bz-az), n=Math.floor(L/1.6), ang=Math.atan2(bz-az,bx-ax);
    for (let i=0;i<=n;i++){ const t=i/n, d=t*L; if ((gaps||[]).some(([a,b])=>d>a-.3&&d<b+.3)) continue; fp.push({x:ax+(bx-ax)*t,y:.45,z:az+(bz-az)*t,sx:.13,sy:.9,sz:.13,ry:-ang}); }
    const seg=(d0,d1)=>{ if (d1-d0<.3) return; const t=(d0+d1)/2/L; for (const y of [.36,.72]) fp.push({x:ax+(bx-ax)*t,y,z:az+(bz-az)*t,sx:d1-d0,sy:.07,sz:.06,ry:-ang,rail:1}); };
    let d0=0; (gaps||[]).forEach(([a,b])=>{ seg(d0,a); d0=b; }); seg(d0,L); };
  fence(-35.2,-33,-35.2,35); fence(35.2,-33,35.2,35,[[32.6,36.2]]); fence(-35.2,35,35.2,35,[[32.4,37.8],[59.8,65.2]]);
  { const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),M.woodN,fp.length); fp.forEach((f,i)=>{ D.position.set(f.x,f.y,f.z); D.rotation.set(0,f.ry,0); D.scale.set(f.sx,f.sy,f.sz); D.updateMatrix(); im.setMatrixAt(i,D.matrix); im.setColorAt(i,VL_LIN(f.rail?'#7a5638':['#8a6442','#7d5a3b','#93704c'][i%3])); }); im.castShadow=im.receiveShadow=true; R.add(im); }
  // 남쪽 문: 돌기둥 두 개 · 나무 아치 · 이름판
  const g=gfGroup(R,0,35.4,0), put=vlPutter(g), B=vlBox;
  for (const s of [-1,1]){ put(B(.9,2.6,.9,1.2),M.stone,s*2.5,1.3,0); put(B(1.1,.22,1.1,1),M.stoneLight,s*2.5,2.71,0); vlLantern(g,s*2.5,2.1,.45); }
  put(B(5.9,.3,.34,.6),M.wood,0,3.1,0); put(B(5.6,.2,.3,.6),M.wood,0,2.65,0);
  const sign=vlTex(vlCanvas(512,160,c=>{ c.fillStyle='#6a4a2c'; roundRect(c,0,0,512,160,26); c.fill(); c.strokeStyle='#e0b85a'; c.lineWidth=10; roundRect(c,10,10,492,140,20); c.stroke(); c.fillStyle='#ffe9b0'; c.font='bold 84px Jua, "Malgun Gothic", sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('🌾 들판 마을',256,86); }));
  const sm=new THREE.MeshStandardMaterial({map:sign,roughness:.7}); const sb=new THREE.Mesh(new THREE.BoxGeometry(2.6,.8,.08),[M.wood,M.wood,M.wood,M.wood,sm,sm]); sb.position.set(0,3.75,0); sb.castShadow=true; sb.userData.keep=true; g.add(sb);
  for (const s of [-1,1]) put(B(.06,.5,.06,.5),M.iron,s*1,3.35,0);
  vlMerge(g); }

/* 우물 · 가로등 · 광장 벤치 · 짐 */
function gfProps(R){
  const M=vlMats(), X=gfMats();
  { const wg=gfGroup(R,-4.3,-2.9,.5,.8), put=vlPutter(wg), B=vlBox;   // 우물 (마을 우물 모양 · 붉은 지붕)
    put(vlUVScale(new THREE.CylinderGeometry(1.25,1.35,1.0,20,1,true),2*Math.PI*1.3/1.4,1/1.4),M.stone2,0,.5,0); put(new THREE.TorusGeometry(1.27,.16,8,24),M.stoneLight,0,1.0,0,Math.PI/2,0,0);
    put(new THREE.CircleGeometry(1.15,20),new THREE.MeshStandardMaterial({color:0x22424f,roughness:.15,metalness:.2}),0,.62,0,-Math.PI/2,0,0);
    for (const s2 of [-1,1]) put(B(.18,2.4,.18,.6),M.wood,s2*1.15,1.2,0); for (const s2 of [-1,1]) put(B(3,.12,1.6,1.5),M.roof('#a2553f'),0,2.75,s2*.62,s2*.6,0,0);
    put(new THREE.CylinderGeometry(.1,.1,2.3,8),M.wood,0,2.0,0,0,0,Math.PI/2); put(new THREE.CylinderGeometry(.18,.15,.28,10),M.woodLight,.3,1.55,0); put(new THREE.TorusGeometry(.17,.02,4,12),M.iron,.3,1.62,0,Math.PI/2,0,0);
    vlMerge(wg); addCol(-4.3,-2.9,2.2,2.2); GF.ao.push({x:-4.3,z:-2.9,r:2,k:.45}); }
  const lamps=[[5.3,-4.2,-2.4],[-5.6,3.9,.8],[5.6,3.9,2.4],[-2.6,-13.2,-.3],[3.1,-13.4,-2.9],[-2.4,-19.6,0],[2.4,-19.6,Math.PI],[-17.6,-5,-.5],[21.4,-2.6,1.6],[-2.4,16.6,.2],[2.6,27,2.9],[12.5,1.9,1.6]];
  lamps.forEach(([x,z,r])=>{ const lg=gfGroup(R,x,z,0,.82); vlLamp(0,0,r,lg); addCol(x,z,.45,.45); GF.ao.push({x,z,r:.7,k:.3}); });
  // 광장 벤치
  [[3.6,-5.4,Math.PI-.6],[-1.2,-6.2,Math.PI+.2],[6,1.6,-Math.PI/2]].forEach(([x,z,r])=>{ const b=gfGroup(R,x,z,r,.85), p=vlPutter(b), B=vlBox;
    p(B(1.6,.08,.42,1),M.woodLight,0,.48,0); p(B(1.6,.34,.06,1),M.woodLight,0,.8,-.2,-.15,0,0);
    for (const xx of [-.65,.65]){ p(B(.08,.48,.08),M.wood,xx,.24,.15); p(B(.08,.48,.08),M.wood,xx,.24,-.17); p(B(.08,.45,.08),M.wood,xx,.66,-.2,-.15,0,0); }
    vlMerge(b); });
  // 상자 · 자루 (집 앞)
  const box=(x,z,s,ry,y)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(s,s,s),M.crate); m.position.set(x,(y||0)+s/2,z); m.rotation.y=ry; m.castShadow=m.receiveShadow=true; R.add(m); };
  box(-8.6,-19.2,.6,.3); box(-8.1,-18.6,.5,.9); box(-8.4,-18.9,.42,.2,.6); box(15.6,-19.4,.55,.5); box(27.6,-12.6,.6,.2); box(28.2,-12,.5,.7); box(-23,-6.8,.55,.4);
  [[-22.4,-7.6],[-22,-8.3],[27.8,-11],[-17.2,25]].forEach(([x,z])=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(.32,10,8),X.burlap); m.scale.set(1,1.2,.9); m.position.set(x,.34,z); m.castShadow=true; R.add(m); });
}

/* 자연: 나무(바람) · 덤불 · 갈대 · 풀 뭉치 · 꽃 · 바위 (Quaternius Stylized Nature MegaKit) */
const GF_NAT=['CommonTree_1','CommonTree_2','CommonTree_3','CommonTree_4','CommonTree_5','Pine_1','Pine_2','Pine_4','Bush_Common','Bush_Common_Flowers',
  'Grass_Common_Tall','Grass_Wispy_Tall','Grass_Wispy_Short','Flower_3_Group','Flower_4_Group','Fern_1','Clover_2','Plant_7','Rock_Medium_1','Rock_Medium_2','Rock_Medium_3','Pebble_Round_1','Pebble_Round_2','Mushroom_Common'];
const GF_TREES=[[-8,-28,1,'gr'],[7.4,-31,1.05,'gr'],[-16.6,-17.6,.9,'gr'],[14.2,-9.2,.95,'yl'],[22.4,8.4,.9,'gr'],[29.4,-5.6,1,'gr'],[31.6,-18,1.05,'gr'],[-30.6,-3.4,1,'gr'],[-29.8,18.4,1.05,'gr'],[-31.2,29.6,.95,'yl'],
  [-16.6,30.6,.9,'gr'],[4.8,31.4,.85,'gr'],[21.2,31.2,.95,'gr'],[30.2,24.6,1,'yl'],[-4.6,-31.6,.85,'gr'],[18.6,-31.8,.9,'gr'],[-31.6,-14.6,.9,'gr']];
const GF_ORCH=[[28.6,7],[32,7.4],[28.4,11],[31.8,11.4],[28.8,15],[32.2,15.2]];
function gfNature(R){
  const by={}, put=(n,p)=>(by[n]=by[n]||[]).push(p), green=['#7cae46','#8fbd4f','#6a9e3c','#86b84a','#5f9438'], yel=['#a8c44a','#c2c84e','#9cb840'];
  const tint=k=>VL_LIN((k==='yl'?yel:green)[(Math.random()*(k==='yl'?yel:green).length)|0]).multiplyScalar(rnd(.92,1.06));
  const free=(x,z,pad)=>gfRoadD(x,z)>pad&&gfStreamD(x,z)>GF_SW+pad&&Math.hypot(x-GF_PLAZA.x,z-GF_PLAZA.z)>GF_PLAZA.r+pad&&!Object.values(GF_SQ).some(s=>Math.hypot(x-s.x,z-s.z)<s.r+pad)&&!colliders.some(b=>x>b.x0-pad&&x<b.x1+pad&&z>b.z0-pad&&z<b.z1+pad);
  // 안쪽 나무 (그림자 있음)
  GF_TREES.forEach(([x,z,s,k],i)=>{ put('T'+(i%5+1),{x,z,ry:rnd(0,6.3),s:s*.82,c:tint(k)}); addCol(x,z,.9,.9); GF.ao.push({x:x+1.2,z:z+1.2,r:3.2*s,k:.42}); });
  GF_ORCH.forEach(([x,z],i)=>{ put('T'+((i+2)%5+1),{x,z,ry:rnd(0,6.3),s:rnd(.6,.7),c:VL_LIN(['#6fa83e','#7cb444'][i%2])}); addCol(x,z,.8,.8); GF.ao.push({x:x+.9,z:z+.9,r:2.4,k:.38}); });
  // 숲 가장자리 한 줄 (경계 밖 · 그림자 없음 · 땅에 그늘만 그려요). 그 뒤는 잎 덩어리 숲(gfForest)
  const sec=(x,z)=>z<-36?'n':z>50?'s':x<0?'w':'e';   // 숲은 구역마다 따로: 카메라에 안 보이는 구역은 그리지 않아요
  const rim=(x,z,s)=>{ const pine=Math.random()<.38, k=sec(x,z); if (pine) put('P'+[1,2,4][(Math.random()*3)|0]+k,{x,z,ry:rnd(0,6.3),s:s*.95}); else put('R'+((Math.random()*5|0)+1)+k,{x,z,ry:rnd(0,6.3),s,c:tint(Math.random()<.18?'yl':'gr')}); GF.ao.push({x:x+.8,z:z+.8,r:3.2*s,k:.42}); };
  for (let x=-39;x<=39;x+=3.3) rim(x+rnd(-.8,.8),-38.6+rnd(-1.2,1.2),rnd(.95,1.25));
  for (let z=-35.5;z<=33;z+=3.3){ rim(-38.6+rnd(-1.2,1.2),z+rnd(-.8,.8),rnd(.95,1.25)); rim(38.6+rnd(-1.2,1.2),z+rnd(-.8,.8),rnd(.95,1.25)); }
  for (let x=-44;x<=44;x+=3.6){ if (x>24&&x<33) continue; rim(x+rnd(-.9,.9),57+rnd(-1.5,1.5),rnd(1,1.35)); }
  for (let i=0;i<46;i++){ const t=Math.random(), side=i%3; const x=side===0?rnd(-38,38):side===1?-36.6+rnd(-.4,.4):36.6+rnd(-.4,.4), z=side===0?-36.6+rnd(-.4,.4):rnd(-36,33);
    put(Math.random()<.25?'Bush_Common_Flowers':'Bush_Common',{x,z,ry:rnd(0,6.3),s:rnd(.9,1.3),c:tint('gr')}); }
  // 덤불: 남쪽 산울타리 · 집 둘레 · 시냇가
  for (let x=-35;x<=35;x+=1.35){ if (Math.abs(x)<3.4||(x>25.6&&x<30)) continue; put(Math.random()<.25?'Bush_Common_Flowers':'Bush_Common',{x:x+rnd(-.2,.2),z:36.4+rnd(-.25,.25),ry:rnd(0,6.3),s:rnd(.85,1.15),c:tint('gr')}); }
  const bush=[[-7.6,-23.6],[-17.4,-21.4],[16.4,-24.6],[6.8,-25.4],[-3.8,-25.6],[3.8,-25.8],[-27,-21.8],[20.8,-19.8],[27.6,-21.4],[-19.6,19.2],[-27.6,27.2],[-12.6,13.6],[9.4,15.6],[19.6,15.6],[-9.8,-6.6],[8.6,-6.8],[-9,6.8],[9.4,7.4],[26.6,-8.6],[-23.6,-14.6],[-21,6.8],[13.6,29.6],[-6.8,29.4],[-33,-28.4],[33,-29],[-33.4,14],[33.2,20.4]];
  bush.forEach(([x,z])=>{ for (let k=0;k<2;k++) put(Math.random()<.3?'Bush_Common_Flowers':'Bush_Common',{x:x+rnd(-.7,.7),z:z+rnd(-.7,.7),ry:rnd(0,6.3),s:rnd(.7,1.05),c:tint('gr')}); });
  // 풀 뭉치 · 꽃 · 고사리 · 보라 꽃밭
  const scatter=(n,cnt,sMin,sMax,where,pad)=>{ let k=0, t=0; while (k<cnt&&t<cnt*40){ t++; const [x,z]=where(); if (Math.abs(x)>48||Math.abs(z)>48) continue; if (!free(x,z,pad)) continue; if (GF_WHEAT.some(f=>x>f.x0-.3&&x<f.x1+.3&&z>f.z0-.3&&z<f.z1+.3)||GF_PLOTS.some(p=>Math.abs(x-p.x)<p.w/2+.6&&Math.abs(z-p.z)<p.d/2+.6)) continue;
      put(n,{x,z,ry:rnd(0,6.3),s:rnd(sMin,sMax)}); k++; } };
  const any=()=>[rnd(-40,40),rnd(-40,46)], nearT=()=>{ const t=GF_TREES[(Math.random()*GF_TREES.length)|0], a=rnd(0,6.3), r=rnd(1,3.6); return [t[0]+Math.cos(a)*r,t[1]+Math.sin(a)*r]; };
  const edge=()=>{ const r=GF_RP[(Math.random()*GF_RP.length)|0], p=r.pts[(Math.random()*r.pts.length)|0], a=rnd(0,6.3), d=r.w/2+rnd(.6,2.4); return [p.x+Math.cos(a)*d,p.z+Math.sin(a)*d]; };
  scatter('Grass_Wispy_Tall',260,.24,.4,any,.4); scatter('Grass_Common_Tall',220,.22,.36,any,.4); scatter('Grass_Wispy_Short',160,.24,.4,edge,.25);
  scatter('Flower_3_Group',90,.22,.32,edge,.35); scatter('Flower_4_Group',90,.2,.3,any,.5); scatter('Fern_1',40,.1,.14,nearT,.5); scatter('Mushroom_Common',26,.5,.8,nearT,.4); scatter('Clover_2',80,.28,.4,any,.3);
  const lav=[[-9.6,-11],[10.4,-11.6],[-12.8,6.6],[12,8.6],[-30.6,-8.8],[30.4,-12.4],[-6.8,33],[6.8,33.2],[-26.6,32]]; scatter('Plant_7',150,.36,.6,()=>{ const c=lav[(Math.random()*lav.length)|0], a=rnd(0,6.3), r=Math.sqrt(Math.random())*2.4; return [c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r]; },.3);
  // 바위 · 자갈
  [[-11.8,9.4,.5],[13.6,-12.8,.45],[-28.2,-6,.55],[28.6,20.4,.5],[-13.6,-27.6,.5],[33,-2,.6],[-33,22,.55],[8.4,30.2,.4],[-19,10.6,.4],[15.4,4.4,.45]].forEach(([x,z,s],i)=>{ put('Rock_Medium_'+(i%3+1),{x,z,ry:rnd(0,6.3),s}); addCol(x,z,s*2,s*2); });
  for (let i=0;i<110;i++){ const [x,z]=edge(); if (!free(x,z,.05)) continue; put('Pebble_Round_'+(i%2+1),{x,y:.01,z,ry:rnd(0,6.3),s:rnd(.4,.9)}); }
  // 시냇가 큰 돌
  for (let i=12;i<GF_SP.length-12;i+=9){ const p=GF_SP[i]; if (Math.abs(p.z)>40||Math.abs(p.z-GF_BR.z)<4) continue; const q=GF_SP[i+1], tx=q.x-p.x, tz=q.z-p.z, L=Math.hypot(tx,tz)||1, s=Math.random()<.5?1:-1;
    put('Rock_Medium_'+(i%3+1),{x:p.x-tz/L*s*(GF_SW+.25),y:-.18,z:p.z+tx/L*s*(GF_SW+.25),ry:rnd(0,6.3),s:rnd(.22,.4)}); }
  GF.natPlan=by; gfNatInst();
}
// 자연 에셋이 다 오면 그때 심어요 (먼저 맵을 보여 주고, 나무는 조금 뒤에 나타날 수 있어요)
function gfNatInst(){
  const by=GF.natPlan; if (!by||GF.natDone) return; if (!GF_NAT.every(n=>VL.nat[n])){ GF_NATP.then(()=>{ if (!GF.natDone) within('general',gfNatInst); }); return; }
  GF.natDone=true;
  const name=n=>{ let m=/^[TR](\d)/.exec(n); if (m) return 'CommonTree_'+m[1]; m=/^P(\d)/.exec(n); return m?'Pine_'+m[1]:n; };
  const noShadow=n=>/^R\d|^P\d|Grass|Clover|Pebble|Flower|Fern|Plant|Mushroom|Rock/.test(n);
  for (const n in by){ const ims=vlInst(name(n),by[n],{shadow:!noShadow(n)}); const k=/^[RP]\d([nsew])$/.exec(n); if (k) gfSector(k[1],ims,by[n]); }
}
const GF_NATP=vlLoadNat(GF_NAT);   // 시작하자마자 다른 그림 파일과 함께 받아요
// 갈대 · 부들 (시냇가)
function gfReeds(R){
  const blade=new THREE.BufferGeometry(); blade.setAttribute('position',new THREE.Float32BufferAttribute([-.03,0,0, .03,0,0, -.018,.55,0, .018,.55,0, 0,1,0],3)); blade.setIndex([0,1,2, 1,3,2, 2,3,4]); blade.computeVertexNormals();
  const reeds=[], D=new THREE.Object3D();
  for (let i=4;i<GF_SP.length-4;i+=2){ const p=GF_SP[i]; if (Math.abs(p.z)>44||Math.abs(p.z-GF_BR.z)<4.4||Math.abs(p.z-GF_HOUSES[5].z)<2.6) continue; if (Math.random()<.45) continue;
    const q=GF_SP[i+1], tx=q.x-p.x, tz=q.z-p.z, L=Math.hypot(tx,tz)||1; for (const s of [-1,1]){ if (Math.random()<.4) continue; const d=GF_SW+rnd(-.35,.25), cx=p.x-tz/L*s*d, cz=p.z+tx/L*s*d;
      for (let k=0;k<4;k++) reeds.push({x:cx+rnd(-.3,.3),z:cz+rnd(-.3,.3),h:rnd(.55,1.1),ry:rnd(0,6.3),lx:rnd(-.25,.25),lz:rnd(-.25,.25)}); } }
  const im=new THREE.InstancedMesh(blade,new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.85}),reeds.length);
  reeds.forEach((r,i)=>{ D.position.set(r.x,gfBed(r.x,r.z)*.6,r.z); D.rotation.set(r.lx,r.ry,r.lz); D.scale.set(1,r.h,1); D.updateMatrix(); im.setMatrixAt(i,D.matrix); im.setColorAt(i,VL_LIN(['#6f8f3a','#8a9a40','#a8a24a','#5f7f30','#b8a050'][i%5])); });
  im.castShadow=true; im.receiveShadow=true; R.add(im); }

/* ---------- 수정 3개: 문제 종류 · 보상이 달라요 ---------- */
const GF_ST=[{k:'church',col:0xffc83a,hex:'#b88400',title:'종탑 수정 · 4지선다',qk:'mc',reward:'heal',tag:'🔔 4지선다 · 체력 회복'},
  {k:'mill',col:0x5fd35f,hex:'#2f8f3a',title:'풍차 수정 · O/X',qk:'ox',reward:'wind',tag:'🌾 O/X 퀴즈'},
  {k:'bridge',col:0x3ab0ff,hex:'#1b78b8',title:'다리 수정 · 도전 문제',qk:'adv',reward:'card',tag:'🌉 도전 문제 · 강화 카드'}];
function gfStations(R){
  GF.tags=[];
  GF_ST.forEach(o=>{ const q=GF_SQ[o.k]; makeStation('any',q.x,q.z,o.col,{title:o.title,hex:o.hex,qk:o.qk,reward:o.reward});
    stations[stations.length-1].g.children.forEach(m=>{ if (m.isMesh&&m.material&&m.material.isMeshToonMaterial&&m.material.color&&m.material.color.getHex()<0x707070) m.material=vlMats().stoneDark; });   // 받침돌은 마을 돌 질감으로
    const t=vlTex(vlCanvas(512,112,c=>{ c.fillStyle='rgba(24,28,40,.82)'; roundRect(c,6,6,500,100,50); c.fill(); c.fillStyle=o.hex; roundRect(c,6,6,500,100,50); c.globalAlpha=.25; c.fill(); c.globalAlpha=1;
      c.fillStyle='#fff6dc'; c.font='bold 54px Jua, "Malgun Gothic", sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(o.tag,256,60); }));
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false})); sp.scale.set(4.4,.96,1); sp.position.set(q.x,5.1,q.z); sp.visible=false; R.add(sp); GF.tags.push({sp,st:stations[stations.length-1]}); }); }
function gfStationItem(st){
  if (st.qk==='ox') return pick(['ox'],OX)||pick(['mc'],MC);
  if (st.qk==='adv'){ const adv=MC.filter(it=>it.src); return (adv.length&&pick(['mc'],adv,it=>!!it.src))||pick(['mc'],MC); }
  const plain=MC.filter(it=>!it.src); return pick(['mc'],plain.length?plain:MC,it=>!it.src)||pick(['mc'],MC); }
function gfReward(st,extras){
  if (st.reward==='heal'){ const b=P.hp; P.hp=Math.min(P.max,P.hp+Math.round(P.max*.35)); extras.push(`🔔 종소리! 체력 +${Math.round(P.hp-b)}`); GF.bellT=3; }
  else if (st.reward==='card'){ W.bonusCard=true; extras.push('🌉 보너스 강화 카드를 하나 골라요!'); }
  else { GF.sailT=5; extras.push('🌾 풍차가 힘차게 돌아요!'); } }

/* ---------- 마을 사람 부탁 (O/X · 하고 싶을 때만: 가까이 가면 물어봐요) ---------- */
const GF_REQ=[{key:'barbarian',x:-11.4,z:12.2,ry:.7,name:'농부',reward:'shield'},{key:'rogue',x:21.6,z:-7.4,ry:-2.5,name:'방앗간 주인',reward:'ult'},{key:'mage',x:4.8,z:-15.2,ry:-.9,name:'종지기',reward:'shield'}];
function gfReqs(R){
  const bt=vlTex(vlCanvas(128,128,c=>{ c.fillStyle='#fff7df'; c.beginPath(); c.arc(64,56,46,0,7); c.fill(); c.beginPath(); c.moveTo(50,96); c.lineTo(64,124); c.lineTo(78,96); c.fill();
    c.lineWidth=7; c.strokeStyle='#c0661e'; c.beginPath(); c.arc(64,56,46,0,7); c.stroke(); c.fillStyle='#e0761e'; c.font='bold 70px Jua, "Malgun Gothic", sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('!',64,60); }));
  GF.reqs=GF_REQ.map(o=>{ addNpc(o.key,o.x,o.z,o.ry); const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:bt,transparent:true,depthWrite:false,fog:false})); sp.scale.set(.9,.9,1); sp.position.set(o.x,2.55,o.z); sp.visible=false; R.add(sp); return {...o,sp,next:0,open:false}; }); }
function gfReqFx(ok,src){
  const r=src.req; if (r) r.next=W.t+75;
  if (!ok) return {label:'다음에 또 부탁할게요!'};
  if (r&&r.reward==='ult'&&(W.ult||0)<ULT_NEED){ W.ult=Math.min(ULT_NEED,(W.ult||0)+1); return {label:'✨ 고마워요! 필살기 한 칸'}; }
  W.qshield=Math.min(100,(W.qshield||0)+40); return {label:'🛡️ 고마워요! 방어막 +40'}; }

/* ---------- 부서지는 짚단 · 나무통: 부수면 작은 사과(체력 회복) ---------- */
const GF_BRK=[[-17.6,13.2,'hay'],[-12.2,27.8,'hay'],[-21.2,-8.6,'hay'],[-28.6,1.6,'hay'],[-20.2,15.6,'hay'],[5.4,16.4,'hay'],[26.8,-10.2,'barrel'],[20.4,-17.8,'barrel'],[-7.6,-25.2,'barrel'],[7.8,-25.4,'barrel'],[27.2,3.6,'barrel'],[-3.8,-9.8,'barrel']];
function gfBreakables(R){
  const M=vlMats(), X=gfMats();
  GF.brk=GF_BRK.map(([x,z,k])=>{ const g=gfGroup(R,x,z,rnd(0,6.3)), put=vlPutter(g), B=vlBox;
    if (k==='hay'){ put(new THREE.CylinderGeometry(.52,.52,.95,16),X.straw,0,.52,0,0,0,Math.PI/2); for (const sx of [-.28,.28]) put(new THREE.TorusGeometry(.53,.025,4,18),M.wood,sx,.52,0,0,Math.PI/2,0); }
    else { put(vlUVScale(new THREE.CylinderGeometry(.4,.4,.9,14),3,1),M.woodLight,0,.45,0); put(new THREE.CylinderGeometry(.43,.4,.08,14),M.woodLight,0,.45,0); for (const y of [.13,.77]) put(new THREE.TorusGeometry(.41,.025,5,18),M.iron,0,y,0,Math.PI/2,0,0); put(new THREE.CircleGeometry(.38,14),M.wood,0,.91,0,-Math.PI/2,0,0); }
    vlMerge(g); const col={x0:x-.6,x1:x+.6,z0:z-.6,z1:z+.6}; colliders.push(col);
    return {x,z,k,g,col,hp:2,alive:true,back:0,wob:0}; }); }
function gfBrkHit(x,z,r){
  if (MAPK!=='general'||!GF.brk.length) return false; let hit=false;
  for (const b of GF.brk){ if (!b.alive||Math.hypot(b.x-x,b.z-z)>r+.55) continue; hit=true; b.hp--; b.wob=.35; fx.burst(b.x,.6,b.z,b.k==='hay'?0xe2c06a:0x9a6e44,8,3);
    if (b.hp<=0){ b.alive=false; b.g.visible=false; const i=colliders.indexOf(b.col); if (i>=0) colliders.splice(i,1); b.back=W.t+45;
      fx.burst(b.x,.5,b.z,b.k==='hay'?0xf0d68a:0x7a5638,26,5); fx.burst(b.x,.4,b.z,0xffffff,8,4); SFX.hit(true); gfApple(b.x+rnd(-.4,.4),b.z+rnd(-.4,.4)); } }
  return hit; }
function gfApple(x,z){ const X=gfMats(), g=new THREE.Group(); g.position.set(x,.3,z);
  const a=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),X.apple); a.scale.y=.9; a.castShadow=true; g.add(a);
  const st=new THREE.Mesh(new THREE.CylinderGeometry(.015,.02,.12,5),vlMats().wood); st.position.y=.2; g.add(st);
  const lf=new THREE.Mesh(new THREE.SphereGeometry(.07,6,4),vlMats().leaf); lf.scale.set(1.4,.3,.7); lf.position.set(.07,.22,0); g.add(lf);
  mapGroups.general.add(g); GF.apples.push({g,x,z,t:W.t}); }

/* ---------- 보스: 오래된 묘지의 열린 무덤에서 깨어나요 ---------- */
const GF_BOSS_AT={x:12.2,z:24.4};
function gfBossRise(b){ if (!b) return; b.x=GF_BOSS_AT.x; b.z=GF_BOSS_AT.z; b.g.position.set(b.x,0,b.z);
  fx.shock(b.x,b.z,7); fx.shock(b.x,b.z,4); fx.burst(b.x,.4,b.z,0x6b5a48,46,7); fx.burst(b.x,1.2,b.z,0xb8a0ff,24,5); shake=Math.max(shake,.55);
  setTimeout(()=>{ if (W.state==='play') flashPrompt('💀 오래된 묘지에서 보스가 깨어났어요!',3); },700); }

/* 판마다 처음 상태로 */
function gfReset(){
  if (!GF.built) return;
  GF.brk.forEach(b=>{ b.alive=true; b.hp=2; b.g.visible=true; b.wob=0; if (!MAPSTATE.general.colliders.includes(b.col)) MAPSTATE.general.colliders.push(b.col); });
  GF.apples.forEach(a=>{ if (a.g.parent) a.g.parent.remove(a.g); }); GF.apples=[];
  GF.reqs.forEach(r=>{ r.next=rnd(25,45); r.sp.visible=false; r.told=false; }); GF.bellT=0; GF.sailT=0; }

/* 깊은 숲: 가벼운 잎 덩어리(정이십면체)를 빽빽하게 (멀리 · 안개 속이라 진짜 나무 대신) */
function gfForest(R){
  const lt=vlTexRep(vlCanvas(256,256,g=>{ g.fillStyle='#bdbdbd'; g.fillRect(0,0,256,256);
    for (let i=0;i<900;i++){ const x=Math.random()*256, y=Math.random()*256, s=4+Math.random()*7, l=140+Math.random()*115|0;
      vlWrapDraw(256,x,y,12,(X,Y)=>{ g.save(); g.translate(X,Y); g.rotate(Math.random()*6.3); g.fillStyle=`rgb(${l},${l},${l})`; g.beginPath(); g.ellipse(0,0,s,s*.55,0,0,7); g.fill(); g.restore(); }); } }));
  const geo=new THREE.IcosahedronGeometry(1,1); { const p=geo.attributes.position; for (let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), k=1+.16*Math.sin(x*3.1+z*2.3)+.1*Math.cos(y*4.2+x); p.setXYZ(i,x*k,y*k*.86,z*k); } geo.computeVertexNormals(); }
  const pts=[], band=(x,z)=>{ const n=z<-41&&z>-84, w=x<-41&&x>-84&&z<54, e=x>41&&x<84&&z<54; return (n||w||e)&&Math.hypot(x*.85,z)<96; };   // 남쪽은 로비 무대 뒤라 비워요 (진짜 나무 한 줄만)
  for (let x=-84;x<=84;x+=2.9) for (let z=-84;z<=88;z+=2.9){ const jx=x+rnd(-1.3,1.3), jz=z+rnd(-1.3,1.3); if (!band(jx,jz)) continue; if (jx>22&&jx<34&&jz>58) continue; pts.push([jx,jz]); }
  const mat=new THREE.MeshStandardMaterial({map:lt,roughness:.95,metalness:0}), D=new THREE.Object3D(), pal=['#4f7f2c','#5f8f34','#6a9a3a','#45722a','#73a040','#587f30'];
  const by={n:[],s:[],w:[],e:[]}; pts.forEach(p=>by[p[1]<-41?'n':p[1]>56?'s':p[0]<0?'w':'e'].push(p));
  for (const k in by){ const L=by[k]; if (!L.length) continue; const im=new THREE.InstancedMesh(geo,mat,L.length);
    L.forEach(([x,z],i)=>{ const d=Math.min(Math.abs(Math.abs(x)-41),Math.abs(z+41)), s=rnd(2.3,3.4)*(d<6?.85:1); D.position.set(x,s*1.05+rnd(2.4,4.6),z); D.rotation.set(rnd(0,.4),rnd(0,6.3),rnd(0,.4)); D.scale.set(s,s*rnd(.9,1.2),s); D.updateMatrix(); im.setMatrixAt(i,D.matrix);
      im.setColorAt(i,VL_LIN(pal[(Math.random()*pal.length)|0]).multiplyScalar(rnd(.85,1.08))); });
    im.receiveShadow=true; im.frustumCulled=false; R.add(im); gfSector(k,[im],L.map(([x,z])=>({x,z}))); } }
/* 구역별 숲 묶음: 카메라 시야에 구역 상자가 걸릴 때만 그려요 (인스턴스 묶음은 three.js가 스스로 못 걸러서) */
GF.secs={};
function gfSector(k,ims,P){ const S=GF.secs[k]||(GF.secs[k]={ims:[],box:new THREE.Box3()}); S.ims.push(...ims); P.forEach(p=>S.box.expandByPoint(new THREE.Vector3(p.x-6,0,p.z-6)).expandByPoint(new THREE.Vector3(p.x+6,16,p.z+6))); }
const GF_FR=new THREE.Frustum(), GF_PM=new THREE.Matrix4();
/* 굴뚝 연기 (부드러운 점) */
function gfSmoke(R){
  const src=GF.smoke; if (!src.length) return; const per=16, N=src.length*per, sp=new Float32Array(N*3), ph=new Float32Array(N), sd=new Float32Array(N);
  src.forEach((o,j)=>{ for (let k=0;k<per;k++){ const i=j*per+k; sp[i*3]=o.x; sp[i*3+1]=o.y; sp[i*3+2]=o.z; ph[i]=k/per+Math.random()*.03; sd[i]=Math.random(); } });
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(sp,3)); g.setAttribute('aPh',new THREE.BufferAttribute(ph,1)); g.setAttribute('aSd',new THREE.BufferAttribute(sd,1));
  GF.smU={uTime:NAT_U.uTime,uScale:{value:400},uCol:{value:new THREE.Color(.78,.77,.8)}};
  const m=new THREE.Points(g,new THREE.ShaderMaterial({uniforms:GF.smU,transparent:true,depthWrite:false,
    vertexShader:`attribute float aPh,aSd; uniform float uTime,uScale; varying float vA,vL;
      void main(){ float life=fract(uTime*.08+aPh); vec3 p=position+vec3((.7+aSd*.5)*life*life*2.,life*4.8,(.3+aSd*.4)*life*life*1.2+sin(life*7.+aSd*20.)*.2*life);
        vec4 mv=modelViewMatrix*vec4(p,1.); vL=life; vA=smoothstep(0.,.12,life)*(1.-life); gl_PointSize=clamp(uScale*(.35+life*1.3)/(-mv.z),1.,160.); gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`uniform vec3 uCol; varying float vA,vL; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.1,d)*vA*.5; gl_FragColor=vec4(uCol*mix(1.1,.85,vL),a);
      #include <tonemapping_fragment>
    }`}));
  m.frustumCulled=false; R.add(m); GF.smokePts=m; }

/* 집 · 성당 · 풍차가 캐릭터를 가리면 그 부분만 점점이 비춰 보여요 (전투 카메라는 위에서 비스듬히 내려다봐서) */
const GF_SEE={value:0};
function gfSeeThrough(R){
  const base=THREE.Material.prototype.onBeforeCompile;
  R.traverse(o=>{ if (!o.isMesh||o.isInstancedMesh) return; (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
    if (!m||!m.isMeshStandardMaterial||m.userData.gfSee||m.onBeforeCompile!==base) return; m.userData.gfSee=true;
    m.onBeforeCompile=sh=>{ sh.uniforms.uPlr=NAT_U.uPlr; sh.uniforms.uSee=GF_SEE;
      sh.fragmentShader='uniform vec3 uPlr; uniform float uSee;\n'+sh.fragmentShader.replace('#include <clipping_planes_fragment>',
        '{ if (uSee>.5){ vec3 pv=-vViewPosition; vec3 pl=(viewMatrix*vec4(uPlr,1.)).xyz; float tt=clamp(dot(pv,pl)/max(dot(pl,pl),1e-4),0.,1.); float dd=length(pv-pl*tt);'+
        ' if (tt<.985){ float rr=.8+tt*1.9; float k=smoothstep(rr*.5,rr,dd); float di=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715)))); if (k<di) discard; } } }\n#include <clipping_planes_fragment>'); };
    m.customProgramCacheKey=()=>'gfsee'; m.needsUpdate=true; }); }); }

/* ---------- 들판 마을 짓기 ---------- */
function buildField(){
  const R=new THREE.Group(); scene.add(R); GF.root=R;
  const keep={halos:VL.halos,smoke:VL.smokeSrc,camObs:VL.camObs,bed:VL.bedFlowers};
  VL.halos=GF.halos; VL.smokeSrc=GF.smoke; VL.camObs=[]; VL.bedFlowers=[];
  const AO=[]; GF.ao=AO;
  const S=new THREE.Group(); R.add(S); GF.static=S;   // 움직이지 않는 건물 · 소품: 마지막에 재질별로 한 덩어리로 합쳐요 (그리기 횟수 ↓)
  try{
    gfSky(R); gfGround(R); gfWater(R);
    gfCobble(R,GF_PLAZA.x,GF_PLAZA.z,GF_PLAZA.r,true);
    for (const s of Object.values(GF_SQ)) gfCobble(R,s.x,s.z,s.r,false);
    GF_HOUSES.forEach(H=>gfHouse(S,H));
    gfChurch(S); gfWindmill(S); gfWheel(R); gfBridge(S); gfCemetery(S); gfFarm(S); gfProps(S); gfBounds(S);
    gfStations(R); gfReqs(R); gfBreakables(R);
    gfNature(R); gfForest(R); gfReeds(R); gfSmoke(R);
    gfGroundFinish(AO);
    gfGrass(R); gfWheat(R); gfSeeThrough(R);
    S.updateMatrixWorld(true); vlMerge(S);
  } finally { VL.halos=keep.halos||[]; VL.smokeSrc=keep.smoke||[]; VL.camObs=keep.camObs||[]; VL.bedFlowers=keep.bed||[]; }
  GF.built=true;
}

/* 들판 마을 분위기: 맑은 낮 · 황금빛 오후만 (하늘 색 · 안개는 이 맵에 맞춰요) */
const GF_MOODS={
  day:   {top:'#2a6fd6',hor:'#8cc0ee',fog:'#a7cbee',fogN:46,fogF:165,cShade:[.74,.82,.95],cAdd:[.32,.32,.32],sunCol:'#fff3df',cov:.58,mtn:[0x5c7fa8,0x4f7a5c],light:[1,1,1],sun:[1,.93,.8]},
  golden:{top:'#3f7cc8',hor:'#f2cf9a',fog:'#efd2a6',fogN:38,fogF:145,cShade:[.82,.66,.62],cAdd:[.42,.24,.1],sunCol:'#ffd08a',cov:.6,mtn:[0x8a7f9c,0x6f7a58],light:[1.04,.98,.9],sun:[1,.82,.56]},
};
function gfApplyMood(k){
  const G=GF_MOODS[k]||GF_MOODS.day;
  scene.background.set(G.fog).convertSRGBToLinear(); scene.fog.color.set(G.fog).convertSRGBToLinear(); scene.fog.near=G.fogN; scene.fog.far=G.fogF;
  if (GF.skyU){ const U=GF.skyU; U.uTop.value.set(G.top).convertSRGBToLinear(); U.uHor.value.set(G.hor).convertSRGBToLinear(); U.uCShade.value.setRGB(...G.cShade); U.uCAdd.value.setRGB(...G.cAdd); U.uSunCol.value.set(G.sunCol).convertSRGBToLinear(); U.uCov.value=G.cov; }
  GF.mtnU.forEach((u,i)=>u.uCol.value.setHex(G.mtn[i]||G.mtn[0]).convertSRGBToLinear());
  if (GF.WU){ GF.WU.uSunCol.value.setRGB(...G.sun); }
  if (GF.U){ GF.U.uSunCol.value.setRGB(...G.sun); GF.U.uLightK.value.setRGB(...G.light); }
  GF.moodK=k;
}
/* 들판 마을에서는 기본 하늘(그라데이션 공)만 끄고 자기 하늘을 써요 (뭉게구름 모형은 그대로) */
function gfSkyVis(on){ scene.children.forEach(o=>{ if (o.material===SKY) o.visible=on; }); }
const gfPickMood=seed=>{ if (seed){ let h=0; for (const c of String(seed)) h=(h*31+c.charCodeAt(0))|0; return Math.abs(h)%5<3?'day':'golden'; } return Math.random()<.6?'day':'golden'; };

/* ---------- 매 프레임 ---------- */
const GF_DB=new THREE.Vector2();
function gfTick(dt,real){
  if (MAPK!=='general' || !GF.built) return;
  GF_SEE.value=(W.state==='play'&&!(typeof SHOP!=='undefined'&&SHOP.open))?1:0;
  if (!GF.skyOff){ GF.skyOff=true; gfSkyVis(false); clouds.forEach(c=>c.visible=true); }   // 맵을 처음 볼 때 한 번 (불러오는 순서 때문에)
  camera.updateMatrixWorld(); GF_FR.setFromProjectionMatrix(GF_PM.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  for (const k in GF.secs){ const S=GF.secs[k], v=GF_FR.intersectsBox(S.box); S.ims.forEach(m=>{ m.visible=v; }); }
  NAT_U.uTime.value=real;
  NAT_U.uCam.value.copy(camera.position); NAT_U.uPlr.value.set(P.x,1.1,P.z);
  const fc=scene.fog.color;
  if (GF.skyU){ GF.skyU.uTime.value=real; GF.skyU.uFog.value.copy(fc); GF.sky.position.copy(camera.position); }
  if (GF.WU){ const W2=GF.WU; W2.uTime.value=real; W2.uFog.value.copy(fc); W2.uFogN.value=scene.fog.near; W2.uFogF.value=scene.fog.far; W2.uTop.value.copy(GF.skyU.uTop.value); W2.uHor.value.copy(GF.skyU.uHor.value); W2.uSun.value.copy(sun.position).sub(sun.target.position).normalize(); }
  if (GF.U){ const U=GF.U; U.uPlayer.value.set(P.x,0,P.z); U.uCenter.value.set(P.x,P.z-4); U.uFog.value.copy(fc); U.uFogN.value=scene.fog.near; U.uFogF.value=scene.fog.far; U.uSun.value.copy(GF.WU.uSun.value); }
  if (GF.skyU) GF.skyU.uSun.value.copy(GF.WU.uSun.value);
  // 풍차 날개 · 물레방아 · 종 · 묘지 안개 · 굴뚝 연기
  if (GF.sails){ GF.sailT=Math.max(0,(GF.sailT||0)-dt); GF.sails.rotation.z-=dt*(.5+Math.min(1,GF.sailT)*1.8); }
  if (GF.wheel) GF.wheel.rotation.x-=dt*.85;
  if (GF.bell){ GF.bellT=Math.max(0,(GF.bellT||0)-dt); GF.bell.rotation.z=Math.sin(real*5.5)*.55*Math.min(1,GF.bellT/1.2); }
  if (GF.fog) GF.fog.forEach(f=>{ const u=f.userData; f.position.x=u.x+Math.sin(real*.12+u.ph)*1.4; f.position.z=u.z+Math.cos(real*.09+u.ph)*1.1; f.material.opacity=.16+.08*Math.sin(real*.4+u.ph); });
  if (GF.smU){ renderer.getDrawingBufferSize(GF_DB); GF.smU.uScale.value=GF_DB.y/(2*Math.tan(camera.fov*Math.PI/360)); }
  // 등불 · 창 불빛: 낮에는 은은하게
  { const M=vlMats(), gold=GF.moodK==='golden'; M.lantern.emissiveIntensity=gold?1.1:.55; M.win.emissiveIntensity=gold?.42:.16; GF.halos.forEach((h,i)=>{ h.visible=gold; if (gold) h.material.opacity=.42*(.85+.15*Math.sin(real*7+i)); }); }   // 낮에는 등불 빛무리를 끄고, 황금빛 오후에만 켜요
  // 밀밭 · 풀: 화질에 맞춰요
  if (GF.wheat && GF.qk!==QCUR){ GF.qk=QCUR; GF.wheat.geometry.instanceCount=Math.floor(GF.wheat.userData.max*(QCUR==='high'?1:QCUR==='medium'?.75:.5)); }
  const play=W.state==='play';
  // 수정 위 안내판 (웨이브를 여는 동안만)
  if (GF.tags) GF.tags.forEach(t=>{ const on=play&&W.gate&&!W.prep&&W.t>=t.st.readyAt; t.sp.visible=on; if (on) t.sp.position.y=5.1+Math.sin(real*2+t.st.g.position.x)*.12; });
  // 마을 사람 부탁
  if (GF.reqs) GF.reqs.forEach(r=>{ const can=play&&NEWQ()&&W.t>=r.next&&!W.prep&&!W.loc&&!(FUN.am&&!FUN.am.done)&&!liveBoss(); r.sp.visible=can; if (!can) return;
    r.sp.position.y=2.55+Math.sin(real*3+r.x)*.1; const d=Math.hypot(P.x-r.x,P.z-r.z);
    if (!W.paused && d<2.2 && $('#quiz').hidden){ const it=pick(['ox'],OX)||pick(['mc'],MC); if (it){ r.next=W.t+75; openQuiz(it,{type:'npc',req:r}); } } else if (!W.paused && d<5 && !r.told){ r.told=true; flashPrompt(`🙋 ${r.name}에게 부탁이 있어요 · 가까이 가면 O/X 문제를 내요 (안 해도 돼요)`,3); } });
  // 짚단 · 나무통 · 사과
  if (GF.brk) GF.brk.forEach(b=>{ if (b.wob>0){ b.wob=Math.max(0,b.wob-dt); b.g.rotation.z=Math.sin(b.wob*40)*b.wob*.25; }
    if (!b.alive && play && W.t>=b.back && Math.hypot(P.x-b.x,P.z-b.z)>2.5 && !mobs.some(m=>m.dying<0&&Math.hypot(m.x-b.x,m.z-b.z)<1.6)){ b.alive=true; b.hp=2; b.g.visible=true; colliders.push(b.col); fx.burst(b.x,.5,b.z,0xfff3c0,10,2); } });
  for (let i=GF.apples.length-1;i>=0;i--){ const a=GF.apples[i]; a.g.position.y=.3+Math.sin(real*3+a.x)*.08; a.g.rotation.y+=dt*1.5;
    if (play && !W.paused && Math.hypot(P.x-a.x,P.z-a.z)<1.2){ const h=Math.round(P.max*.1), b0=P.hp; P.hp=Math.min(P.max,P.hp+h); fx.num(P.x,2.6,P.z,'+'+Math.round(P.hp-b0),'#7dff9a'); fx.rise(P.x,P.z,0x9dff9a,12); SFX.card(); a.g.parent&&a.g.parent.remove(a.g); GF.apples.splice(i,1); }
    else if (play && W.t-a.t>35){ a.g.parent&&a.g.parent.remove(a.g); GF.apples.splice(i,1); } }
}

MAP_BUILD.general=()=>buildField();
GRASS_OK.general=null;
