/* 사회 게임 RPG · 펫 (펫 자리 · 세 직업 모두)
   모델 파일 없이 코드로 만든 동글동글한 펫이에요. 꾸미기 전용이라 능력치는 전혀 없어요.
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
  dragon: {move:'fly',   size:1.05,spd:1.1, build:'dragon', flyH:1.4}
};
const PET_SIZE=1.25;
const PETS=[];
let PET_LAST=0;

/* ---------- 재료(모양 · 색) 캐시 ---------- */
const PGEO={};
const pgeo=(k,f)=>PGEO[k]||(PGEO[k]=f());
const gSph=()=>pgeo('s',()=>new THREE.SphereGeometry(1,22,16));
const gCone=()=>pgeo('c',()=>new THREE.ConeGeometry(1,1,16));
const PMAT={};
function pmat(hex,o){ const k=hex+'|'+JSON.stringify(o||{}); if (PMAT[k]) return PMAT[k];
  let m; const c=new THREE.Color(hex).convertSRGBToLinear(); hex=c;
  if (o&&o.basic) m=new THREE.MeshBasicMaterial({color:hex});
  else if (o&&o.slime) m=toonMat({color:hex,transparent:true,opacity:.78,rim:.7});
  else if (o&&o.glow) m=toonMat({color:hex,emissive:c.clone(),emissiveIntensity:o.glow,rim:.6});
  else if (o&&o.side) m=toonMat({color:hex,side:THREE.DoubleSide,rim:.3});
  else m=toonMat({color:hex,rim:.35});
  return PMAT[k]=m; }
function pPart(par,geo,col,pos,scl,rot,o){ const m=new THREE.Mesh(geo,pmat(col,o)); m.position.set(pos[0],pos[1],pos[2]);
  if (typeof scl==='number') m.scale.setScalar(scl); else m.scale.set(scl[0],scl[1],scl[2]);
  if (rot) m.rotation.set(rot[0],rot[1],rot[2]); m.castShadow=!(o&&o.noShadow); m.userData.noFlash=true; m.frustumCulled=false; par.add(m); return m; }
function pGroup(par,pos,rot){ const g=new THREE.Group(); g.position.set(pos[0],pos[1],pos[2]); if (rot) g.rotation.set(rot[0],rot[1],rot[2]); par.add(g); return g; }
/* 눈: 까만 눈 + 하얀 반짝이. 눈 감기는 scale.y 로 해요 */
function pEye(R,par,x,y,z,r,col){ const g=pGroup(par,[x,y,z]);
  pPart(g,gSph(),col||0x1d1a22,[0,0,0],[r,r*1.12,r*.6]);
  pPart(g,gSph(),0xffffff,[r*.35*Math.sign(x||1),r*.38,r*.45],r*.32,null,{basic:true,noShadow:true});
  R.eyes.push(g); return g; }
function pCheek(par,x,y,z,r){ pPart(par,gSph(),0xff9fb0,[x,y,z],[r,r*.6,r*.3],null,{noShadow:true}); }
/* 다리: 엉덩이(관절)에서 아래로 매달려요 */
function pLeg(R,par,x,y,z,col,w,h,paw){ const g=pGroup(par,[x,y,z]); pPart(g,gSph(),col,[0,-h*.55,0],[w,h,w]);
  if (paw) pPart(g,gSph(),paw,[0,-h*1.2,w*.25],[w*1.05,w*.7,w*1.2]); R.legs.push(g); return g; }
function tubeGeo(key,pts,r0,r1){ return pgeo(key,()=>{ const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],p[1],p[2])));
  const g=new THREE.TubeGeometry(c,24,1,8,false), p=g.attributes.position, n=24;
  // 끝으로 갈수록 가늘게: 고리마다 중심 쪽으로 당겨요
  for (let i=0;i<=n;i++){ const t=i/n, rr=r0+(r1-r0)*t, ctr=c.getPoint(t); for (let j=0;j<=8;j++){ const k=i*9+j; const v=new THREE.Vector3(p.getX(k),p.getY(k),p.getZ(k)).sub(ctr).multiplyScalar(rr).add(ctr); p.setXYZ(k,v.x,v.y,v.z); } }
  g.computeVertexNormals(); return g; }); }

/* ---------- 펫마다 만들기 (앞 = +z, 바닥 = y 0, 키 약 0.6) ---------- */
function newRig(){ const R={g:new THREE.Group(),eyes:[],legs:[],ears:[],wings:[],tail:null,head:null}; R.bob=pGroup(R.g,[0,0,0]); R.body=pGroup(R.bob,[0,0,0]); return R; }
const PET_BUILD={
  dog(R){ const B=R.body, C=0xdca066, D=0x8a5a34, W=0xfff4e2;
    pPart(B,gSph(),C,[0,.3,-.02],[.24,.22,.31]); pPart(B,gSph(),W,[0,.27,.15],[.16,.15,.15]);
    pLeg(R,B,.12,.2,.16,C,.07,.12,W); pLeg(R,B,-.12,.2,.16,C,.07,.12,W); pLeg(R,B,.12,.2,-.18,C,.075,.12,W); pLeg(R,B,-.12,.2,-.18,C,.075,.12,W);
    const H=R.head=pGroup(B,[0,.53,.22]);
    pPart(H,gSph(),C,[0,0,0],[.24,.22,.22]); pPart(H,gSph(),W,[0,-.07,.15],[.13,.1,.11]); pPart(H,gSph(),0x2a1f1c,[0,-.035,.255],[.05,.038,.035]);
    pPart(H,gSph(),D,[.09,.09,.13],[.06,.05,.03]);
    pEye(R,H,.095,.035,.185,.042); pEye(R,H,-.095,.035,.185,.042); pCheek(H,.15,-.05,.15,.04); pCheek(H,-.15,-.05,.15,.04);
    pPart(H,gSph(),0xff7a8a,[0,-.12,.2],[.035,.02,.04]);
    [1,-1].forEach(s=>{ const e=pGroup(H,[.19*s,.08,-.01],[0,0,.35*s]); pPart(e,gSph(),D,[0,-.11,0],[.065,.14,.1]); R.ears.push(e); });
    const T=R.tail=pGroup(B,[0,.38,-.3],[-.9,0,0]); pPart(T,gSph(),C,[0,.1,0],[.045,.12,.045]); pPart(T,gSph(),W,[0,.21,0],.04);
  },
  cat(R){ const B=R.body, C=0xf3a557, S=0xd9822f, W=0xfff6ea;
    pPart(B,gSph(),C,[0,.29,-.02],[.21,.2,.3]); pPart(B,gSph(),W,[0,.26,.14],[.14,.14,.13]);
    pPart(B,gSph(),S,[0,.44,-.05],[.1,.04,.18]);
    pLeg(R,B,.1,.2,.15,C,.06,.12,W); pLeg(R,B,-.1,.2,.15,C,.06,.12,W); pLeg(R,B,.1,.2,-.17,C,.065,.12,W); pLeg(R,B,-.1,.2,-.17,C,.065,.12,W);
    const H=R.head=pGroup(B,[0,.52,.2]);
    pPart(H,gSph(),C,[0,0,0],[.23,.2,.2]); pPart(H,gSph(),W,[0,-.07,.13],[.12,.08,.09]);
    pPart(H,gSph(),0xff8fa3,[0,-.03,.205],[.03,.022,.02]);
    pPart(H,gSph(),S,[0,.13,.1],[.05,.04,.05]);
    pEye(R,H,.09,.03,.165,.045,0x2b3a22); pEye(R,H,-.09,.03,.165,.045,0x2b3a22); pCheek(H,.14,-.05,.13,.035); pCheek(H,-.14,-.05,.13,.035);
    [1,-1].forEach(s=>{ const e=pGroup(H,[.12*s,.15,0],[0,0,-.25*s]); pPart(e,gCone(),C,[0,.06,0],[.075,.15,.05]); pPart(e,gCone(),0xffb7c2,[0,.05,.025],[.045,.1,.02]); R.ears.push(e); });
    // 수염
    [1,-1].forEach(s=>[0,1].forEach(k=>pPart(H,gSph(),0x6b4b3a,[.14*s,-.05-.025*k,.15],[.07,.004,.004],[0,0,(k?-.15:.12)*s],{noShadow:true})));
    const T=R.tail=pGroup(B,[0,.33,-.3]); pPart(T,tubeGeo('cattail',[[0,0,0],[0,.08,-.1],[0,.22,-.14],[0,.36,-.08],[0,.42,.02]],.045,.03),C,[0,0,0],1);
    pPart(T,gSph(),W,[0,.42,.02],.035);
  },
  rabbit(R){ const B=R.body, C=0xece6df, P=0xffb6c6;
    pPart(B,gSph(),C,[0,.27,-.04],[.23,.22,.25]);
    pPart(B,gSph(),C,[0,.27,-.29],.08);
    [1,-1].forEach(s=>pPart(B,gSph(),C,[.14*s,.06,-.06],[.07,.05,.14]));
    pLeg(R,B,.08,.15,.13,C,.05,.07); pLeg(R,B,-.08,.15,.13,C,.05,.07);
    const H=R.head=pGroup(B,[0,.5,.14]);
    pPart(H,gSph(),C,[0,0,0],[.21,.19,.19]); pPart(H,gSph(),0xf8f4ef,[0,-.06,.13],[.1,.07,.08]);
    pPart(H,gSph(),P,[0,-.025,.19],[.03,.022,.02]);
    pEye(R,H,.085,.03,.16,.045,0xc23a5a); pEye(R,H,-.085,.03,.16,.045,0xc23a5a); pCheek(H,.13,-.05,.12,.04); pCheek(H,-.13,-.05,.12,.04);
    [1,-1].forEach(s=>{ const e=pGroup(H,[.07*s,.15,-.02],[-.12,0,-.12*s]); pPart(e,gSph(),C,[0,.18,0],[.055,.19,.04]); pPart(e,gSph(),P,[0,.18,.022],[.032,.15,.02],null,{noShadow:true}); R.ears.push(e); });
  },
  slime(R){ const B=R.body, C=0x5fd68c;
    R.blob=pPart(B,gSph(),C,[0,.25,0],[.31,.25,.31],null,{slime:true});
    pPart(B,gSph(),0x2fa860,[0,.2,0],[.17,.12,.17],null,{noShadow:true});
    pPart(B,gCone(),C,[0,.53,-.02],[.08,.12,.08],[-.25,0,0],{slime:true});
    pPart(B,gSph(),0xffffff,[-.13,.38,.18],[.06,.035,.03],[0,0,.6],{basic:true,noShadow:true});
    const H=R.head=pGroup(B,[0,.28,.25]);
    pEye(R,H,.1,.02,.02,.05); pEye(R,H,-.1,.02,.02,.05); pCheek(H,.17,-.05,0,.04); pCheek(H,-.17,-.05,0,.04);
    pPart(H,gSph(),0x1d4a2c,[0,-.06,.04],[.035,.02,.01],null,{noShadow:true});
  },
  penguin(R){ const B=R.body, K=0x2d3550, W=0xffffff, O=0xffa531;
    pPart(B,gSph(),K,[0,.32,0],[.23,.31,.22]); pPart(B,gSph(),W,[0,.29,.1],[.18,.25,.14]);
    [1,-1].forEach(s=>pPart(B,gSph(),O,[.08*s,.025,.08],[.07,.028,.1]));
    [1,-1].forEach(s=>{ const f=pGroup(B,[.22*s,.42,0],[0,0,.25*s]); pPart(f,gSph(),K,[0,-.12,0],[.045,.15,.09]); R.wings.push(f); });
    const H=R.head=pGroup(B,[0,.5,.02]);
    pPart(H,gSph(),W,[.07,.02,.14],[.07,.07,.05]); pPart(H,gSph(),W,[-.07,.02,.14],[.07,.07,.05]);
    pEye(R,H,.065,.025,.18,.032); pEye(R,H,-.065,.025,.18,.032);
    pPart(H,gCone(),O,[0,-.04,.24],[.04,.08,.03],[Math.PI/2,0,0]);
    pCheek(H,.12,-.04,.16,.03); pCheek(H,-.12,-.04,.16,.03);
  },
  bear(R){ const B=R.body, C=0xe6e0d4, M=0xf6f1e8, N=0x2a2626;
    pPart(B,gSph(),C,[0,.31,-.02],[.27,.24,.32]);
    pLeg(R,B,.13,.2,.16,C,.085,.12,M); pLeg(R,B,-.13,.2,.16,C,.085,.12,M); pLeg(R,B,.13,.2,-.17,C,.09,.12,M); pLeg(R,B,-.13,.2,-.17,C,.09,.12,M);
    pPart(B,gSph(),C,[0,.34,-.33],.055);
    const H=R.head=pGroup(B,[0,.54,.24]);
    pPart(H,gSph(),C,[0,0,0],[.23,.21,.21]); pPart(H,gSph(),M,[0,-.06,.15],[.11,.085,.09]); pPart(H,gSph(),N,[0,-.03,.235],[.045,.034,.03]);
    pEye(R,H,.09,.04,.175,.038); pEye(R,H,-.09,.04,.175,.038); pCheek(H,.14,-.04,.15,.04); pCheek(H,-.14,-.04,.15,.04);
    [1,-1].forEach(s=>{ const e=pGroup(H,[.15*s,.15,-.02]); pPart(e,gSph(),C,[0,0,0],[.07,.07,.045]); pPart(e,gSph(),0xffd0d6,[0,0,.03],[.04,.04,.02],null,{noShadow:true}); R.ears.push(e); });
  },
  owl(R,T){ const B=R.body, gold=!!T.gold, C=gold?0xe0a92a:0x8d6446, L=gold?0xf6dc84:0xe9d1a6, D=gold?0xb07812:0x5e3f2a, gl=gold?{glow:.12}:undefined;
    pPart(B,gSph(),C,[0,0,0],[.21,.25,.2],null,gl); pPart(B,gSph(),L,[0,-.04,.1],[.15,.18,.12],null,gl);
    [1,-1].forEach(s=>pPart(B,gSph(),L,[.075*s,.11,.15],[.085,.085,.04]));
    pEye(R,B,.075,.115,.18,.05,gold?0x6a3b00:0x1b1420); pEye(R,B,-.075,.115,.18,.05,gold?0x6a3b00:0x1b1420);
    R.eyes.forEach(e=>pPart(e,gSph(),gold?0xff6b2a:0xffc93a,[0,0,-.012],[.066,.066,.03],null,{noShadow:true}));
    pPart(B,gCone(),0xffa531,[0,.05,.205],[.03,.06,.03],[Math.PI*.9,0,0]);
    [1,-1].forEach(s=>pPart(B,gCone(),D,[.12*s,.25,0],[.045,.1,.04],[0,0,-.35*s]));
    [1,-1].forEach(s=>{ const w=pGroup(B,[.19*s,.07,-.01],[0,0,.15*s]); pPart(w,gSph(),D,[.02*s,-.1,0],[.05,.16,.12],null,gl); R.wings.push(w); });
    [1,-1].forEach(s=>pPart(B,gSph(),0xffa531,[.06*s,-.245,.05],[.04,.02,.05]));
    R.head=null;
    if (gold){ R.spark=[]; for (let i=0;i<5;i++){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:wingGlowTex(),color:0xfff0a0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
      sp.userData.ph=i/5; R.bob.add(sp); R.spark.push(sp); } }
  },
  dragon(R){ const B=R.body, C=0x5cc27a, Y=0xffe7a6, D=0x2f8f57, H0=0xfff6d8;
    pPart(B,gSph(),C,[0,0,-.02],[.2,.21,.25]); pPart(B,gSph(),Y,[0,-.03,.1],[.14,.16,.12]);
    [1,-1].forEach(s=>pPart(B,gSph(),C,[.11*s,-.17,.06],[.05,.07,.06]));
    const T=R.tail=pGroup(B,[0,-.03,-.22]); pPart(T,tubeGeo('dragtail',[[0,0,0],[0,-.05,-.12],[.04,-.04,-.26],[.09,.03,-.36]],.07,.025),C,[0,0,0],1);
    pPart(T,gCone(),D,[.1,.05,-.39],[.05,.08,.02],[-.9,0,-.4]);
    for (let i=0;i<3;i++) pPart(B,gCone(),D,[0,.2-.05*i,-.06-.09*i],[.025,.06,.025],[-.4-.3*i,0,0]);
    const H=R.head=pGroup(B,[0,.22,.13]);
    pPart(H,gSph(),C,[0,0,0],[.19,.17,.17]); pPart(H,gSph(),C,[0,-.04,.13],[.11,.08,.1]);
    [1,-1].forEach(s=>pPart(H,gSph(),D,[.04*s,-.02,.225],[.012,.01,.01],null,{noShadow:true}));
    pEye(R,H,.085,.04,.13,.045,0x3a1a10); pEye(R,H,-.085,.04,.13,.045,0x3a1a10); pCheek(H,.13,-.04,.11,.035); pCheek(H,-.13,-.04,.11,.035);
    [1,-1].forEach(s=>pPart(H,gCone(),H0,[.08*s,.17,-.03],[.03,.1,.03],[-.35,0,-.25*s]));
    [1,-1].forEach(s=>{ const e=pGroup(H,[.16*s,.06,-.04],[0,0,-.9*s]); pPart(e,gCone(),C,[0,.05,0],[.04,.09,.02]); R.ears.push(e); });
    const wg=pgeo('dragwing',()=>{ const s=new THREE.Shape(); s.moveTo(0,0); s.lineTo(.36,.16); s.quadraticCurveTo(.33,.02,.4,-.08); s.quadraticCurveTo(.3,-.06,.27,-.16); s.quadraticCurveTo(.18,-.1,.12,-.17); s.quadraticCurveTo(.08,-.06,0,-.06); s.lineTo(0,0); return new THREE.ShapeGeometry(s,6); });
    [1,-1].forEach(s=>{ const w=pGroup(B,[.12*s,.1,-.08],[0,s>0?-.35:Math.PI+.35,0]); const m=pPart(w,wg,D,[0,0,0],1,null,{side:true}); R.wings.push(w); w.userData.side=s; });
  }
};
/* 💤 표시 */
let PET_ZTEX=null;
function petZTex(){ if (PET_ZTEX) return PET_ZTEX; const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d');
  g.font='bold 30px sans-serif'; g.textAlign='center'; g.lineWidth=5; g.strokeStyle='#2b3550'; g.fillStyle='#bfe3ff';
  g.strokeText('Z',38,30); g.fillText('Z',38,30); g.font='bold 20px sans-serif'; g.strokeText('z',20,52); g.fillText('z',20,52);
  return PET_ZTEX=new THREE.CanvasTexture(c); }
function makePet(type){
  const T=PET_TYPES[type]; const R=newRig(); PET_BUILD[T.build](R,T);
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
    if (p.st.pos && typeof fx!=='undefined' && fx.burst){ try{ fx.burst(p.st.pos.x,p.st.pos.y+(p.T.flyH||.5),p.st.pos.z,ok?0xffd34d:0x9aa4b2,ok?14:6,ok?2.6:1); }catch(e){} } } });
}

const PV=new THREE.Vector3(), PQ=new THREE.Quaternion(), PS=new THREE.Vector3(), PF=new THREE.Vector3(), PT=new THREE.Vector3(), PQ2=new THREE.Quaternion(), PUP=new THREE.Vector3(0,1,0);
const angLerp=(a,b,t)=>{ let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI; return a+d*t; };
const damp=(a,b,k,dt)=>a+(b-a)*Math.min(1,k*dt);
function petsTick(){
  const now=performance.now()/1000, dt=PET_LAST?Math.min(.1,now-PET_LAST):0; PET_LAST=now;
  for (let i=PETS.length-1;i>=0;i--){ const p=PETS[i]; if (!p.R.g.parent){ PETS.splice(i,1); continue; } if (!p.ch.root.parent) continue;
    try{ petUpdate(p,dt,now); }catch(e){} }
}
function petUpdate(p,dt,now){
  const {R,st,T}=p, root=p.ch.root;
  root.updateWorldMatrix(true,false); root.matrixWorld.decompose(PV,PQ,PS);
  const sc=PS.x; if (sc<.4){ R.g.visible=false; return; } R.g.visible=true;
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
  const sleep=st.still>8, sit=st.still>1.2;
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
function petPose(p,dt,now,moving,sit,sleep,hop,sad){
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
      if (sit&&!moving) a=i<2?-.15:-1.25; if (sleep) a=i<2?-1.3:-1.4; l.rotation.x=damp(l.rotation.x,a,12,dt); });
    bobY+=moving?Math.abs(Math.sin(ph))*.035*mv:0;
    bodyX=sleep?0:(sit&&!moving?-.3:0); if (sleep) bobY-=.12; else if (sit&&!moving) bobY+=.02;
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
