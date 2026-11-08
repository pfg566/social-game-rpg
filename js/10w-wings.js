/* 사회 게임 RPG · 날개 꾸미기 (망토 자리)
   모델 파일 없이 코드로 만들어요. 깃털 한 장 한 장을 겹쳐 붙이고, 가만히 있으면 천천히, 달리면 힘차게 퍼덕여요.
   종류마다 모양을 한 번만 만들어 두고(WING_GEO) 캐릭터마다 같은 모양을 나눠 써요. */
const WING_TYPES={
  angel:   {kind:'feather', base:'#c9d6ec', mid:'#eef3fb', tip:'#ffffff', arm:'#dfe7f5', mat:'std', amp:.16, hz:1.1, runAmp:.42, runHz:3.2, scale:.98},
  phoenix: {kind:'feather', base:'#ffe27a', mid:'#ff9a2e', tip:'#ff3a1c', arm:'#ffd060', mat:'glow', amp:.2, hz:1.4, runAmp:.45, runHz:3.4, scale:1.02, flame:true},
  bat:     {kind:'membrane',skin:'#5a2f7d', edge:'#22102f', bone:'#1b0f24', amp:.18, hz:1.3, runAmp:.5, runHz:3.6, scale:1.0},
  butterfly:{kind:'butterfly',c1:'#fff3a8', c2:'#ff8fd0', c3:'#7b5cff', edge:'#2b1d4a', amp:.42, hz:2.4, runAmp:.6, runHz:4.4, scale:.92},
  crystal: {kind:'crystal', col:'#a8ecff', glow:'#3fb4ff', arm:'#d8f6ff', amp:.12, hz:1, runAmp:.32, runHz:2.8, scale:.96, sparkle:true}
};
const WING_GEO={};

/* 여러 조각을 한 덩어리로 합치기 (그리기 횟수 줄이기) */
function wingMerge(parts){
  let n=0; const geos=parts.map(([g,m])=>{ const q=(g.index?g.toNonIndexed():g.clone()); q.applyMatrix4(m); if (!q.attributes.normal) q.computeVertexNormals(); n+=q.attributes.position.count; return q; });
  const pos=new Float32Array(n*3), nor=new Float32Array(n*3), col=new Float32Array(n*3), uv=new Float32Array(n*2); let o=0;
  geos.forEach(q=>{ const c=q.attributes.position.count;
    pos.set(q.attributes.position.array,o*3); nor.set(q.attributes.normal.array,o*3);
    if (q.attributes.color) col.set(q.attributes.color.array,o*3); else col.fill(1,o*3,(o+c)*3);
    if (q.attributes.uv) uv.set(q.attributes.uv.array,o*2);
    o+=c; q.dispose(); });
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  g.setAttribute('color',new THREE.BufferAttribute(col,3)); g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  g.computeBoundingSphere(); return g;
}
const WC=new THREE.Color();
function wingGrad(g,fn){ const p=g.attributes.position, c=new Float32Array(p.count*3);
  for (let i=0;i<p.count;i++){ fn(p.getX(i),p.getY(i),p.getZ(i),WC); c[i*3]=WC.r; c[i*3+1]=WC.g; c[i*3+2]=WC.b; }
  g.setAttribute('color',new THREE.BufferAttribute(c,3)); return g; }
const lerp3=(a,b,c,t)=>t<.5?WC.copy(a).lerp(b,t*2):WC.copy(b).lerp(c,(t-.5)*2);

/* 깃털 한 장: 아래(-y)로 뻗고, 끝으로 갈수록 뒤로 살짝 말려요 */
function featherGeo(L,W,T){
  const s=new THREE.Shape();
  s.moveTo(-W*.28,0);
  s.quadraticCurveTo(-W*.62,-L*.38,-W*.5,-L*.74);
  s.quadraticCurveTo(-W*.36,-L*.99,0,-L);
  s.quadraticCurveTo(W*.42,-L*.97,W*.5,-L*.68);
  s.quadraticCurveTo(W*.56,-L*.3,W*.28,0);
  s.lineTo(-W*.28,0);
  const g=new THREE.ShapeGeometry(s,7).toNonIndexed(), p=g.attributes.position;
  for (let i=0;i<p.count;i++){ const t=-p.getY(i)/L, x=p.getX(i); p.setZ(i,-.16*L*t*t + .05*Math.abs(x)/W*L*(1-t)); }   // 뒤로 말림 + 가운데 깃대가 살짝 볼록
  g.computeVertexNormals();
  return wingGrad(g,(x,y,z,c)=>{ const t=Math.min(1,-y/L); lerp3(T.base,T.mid,T.tip,Math.pow(t,.8));
    const q=Math.abs(x)/(W*.5); if (q<.12) c.multiplyScalar(.86+q);            // 깃대(가운데 줄)
    if (t>.25 && Math.abs(((x/W)*9+t*3)%1)<.08) c.multiplyScalar(.93); });       // 깃가지 결
}
function armCurve(){ return new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.28,.2,-.03),new THREE.Vector3(.58,.33,-.08),new THREE.Vector3(.9,.36,-.15)]); }

function buildFeatherWing(T){
  const C={base:new THREE.Color(T.base),mid:new THREE.Color(T.mid),tip:new THREE.Color(T.tip)}, arm=armCurve(), parts=[], m=new THREE.Matrix4(), e=new THREE.Euler();
  const put=(geo,t,ang,dz,tilt)=>{ const p=arm.getPoint(t); e.set(tilt||0,0,ang); m.makeRotationFromEuler(e); m.setPosition(p.x,p.y,p.z+dz); parts.push([geo,m.clone()]); };
  // 첫째 깃(끝, 길게 부채꼴) → 둘째 깃(가운데, 아래로) → 덮깃 2줄(짧게 위를 덮어요)
  for (let i=0;i<9;i++){ const k=i/8; put(featherGeo(.56+.22*k,.15,C),.56+.44*k,.42+1.0*k,.012*i,-.08); }
  for (let i=0;i<10;i++){ const k=i/9; put(featherGeo(.5-.03*k,.155,C),.04+.5*k,.04+.34*k,-.012-.003*i,-.05); }
  const CC={base:C.base,mid:C.base.clone().lerp(C.mid,.6),tip:C.mid};
  for (let i=0;i<11;i++){ const k=i/10; put(featherGeo(.28,.13,CC),.02+.86*k,.12+.6*k,-.03,-.03); }
  for (let i=0;i<9;i++){ const k=i/8; put(featherGeo(.15,.11,{base:C.base,mid:C.base,tip:C.mid}),.0+.8*k,.2+.5*k,-.042,0); }
  const tube=new THREE.TubeGeometry(arm,20,.042,7,false); wingGrad(tube,(x,y,z,c)=>c.set(T.arm)); parts.push([tube,new THREE.Matrix4()]);
  const knob=new THREE.SphereGeometry(.07,10,8); wingGrad(knob,(x,y,z,c)=>c.set(T.arm)); parts.push([knob,new THREE.Matrix4()]);
  return wingMerge(parts);
}
function buildMembraneWing(T){
  const skin=new THREE.Color(T.skin), edge=new THREE.Color(T.edge), W=new THREE.Vector2(.62,.37);
  const F=[[1.0,.3],[.95,-.06],[.72,-.36],[.38,-.46]].map(a=>new THREE.Vector2(a[0],a[1]));
  const s=new THREE.Shape(); s.moveTo(0,.03); s.lineTo(.3,.24); s.lineTo(W.x,W.y); s.lineTo(F[0].x,F[0].y);
  let prev=F[0];
  for (let i=1;i<F.length;i++){ const mid=prev.clone().add(F[i]).multiplyScalar(.5), c=mid.clone().lerp(W,.3); s.quadraticCurveTo(c.x,c.y,F[i].x,F[i].y); prev=F[i]; }
  s.quadraticCurveTo(.22,-.24,.02,-.26); s.lineTo(0,.03);
  const mem=new THREE.ShapeGeometry(s,10).toNonIndexed(), p=mem.attributes.position;
  for (let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i); p.setZ(i,-.12*x*x - .04*Math.sin(x*6)*(y<.2?1:0)); }
  mem.computeVertexNormals();
  wingGrad(mem,(x,y,z,c)=>{ const d=Math.hypot(x-W.x,y-W.y); c.copy(skin).lerp(edge,Math.min(1,d/1.0)); if ((x*14+y*6)%1<.05) c.multiplyScalar(.9); });
  const parts=[[mem,new THREE.Matrix4()]], bone=new THREE.Color(T.bone), m=new THREE.Matrix4(), up=new THREE.Vector3(0,1,0);
  const rod=(a,b,r)=>{ const A=new THREE.Vector3(a.x,a.y,-.12*a.x*a.x), B=new THREE.Vector3(b.x,b.y,-.12*b.x*b.x), d=B.clone().sub(A), L=d.length();
    const g=new THREE.CylinderGeometry(r*.55,r,L,6); wingGrad(g,(x,y,z,c)=>c.copy(bone));
    m.makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(up,d.normalize())); m.setPosition(A.clone().add(B).multiplyScalar(.5)); parts.push([g,m.clone()]); };
  rod({x:0,y:.03},{x:.3,y:.24},.04); rod({x:.3,y:.24},W,.035); F.forEach(f=>rod(W,f,.02));
  const claw=new THREE.ConeGeometry(.025,.1,6); wingGrad(claw,(x,y,z,c)=>c.set('#e8dccb')); m.makeRotationZ(-.5); m.setPosition(W.x+.02,W.y+.07,-.12*W.x*W.x); parts.push([claw,m.clone()]);
  return wingMerge(parts);
}
function butterflyTex(T){
  const cv=document.createElement('canvas'); cv.width=cv.height=256; const g=cv.getContext('2d');
  const gr=g.createRadialGradient(20,128,10,40,128,250); gr.addColorStop(0,T.c1); gr.addColorStop(.45,T.c2); gr.addColorStop(.85,T.c3); gr.addColorStop(1,T.edge);
  g.fillStyle=gr; g.fillRect(0,0,256,256);
  g.strokeStyle='rgba(30,15,50,.55)'; g.lineWidth=2.2;
  for (let i=0;i<7;i++){ const a=-1.1+i*.37; g.beginPath(); g.moveTo(8,128); g.quadraticCurveTo(100,128+Math.sin(a)*60,260*Math.cos(a)+10,128+250*Math.sin(a)); g.stroke(); }
  g.fillStyle='rgba(255,255,255,.92)'; for (let i=0;i<14;i++){ const a=-1.2+i*.18, r=200+((i*37)%30); g.beginPath(); g.arc(20+r*Math.cos(a),128+r*Math.sin(a)*.9,4+(i%3)*2,0,7); g.fill(); }
  [[150,70,22],[140,190,16]].forEach(([x,y,r])=>{ g.fillStyle=T.edge; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); g.fillStyle=T.c1; g.beginPath(); g.arc(x,y,r*.62,0,7); g.fill(); g.fillStyle='#1a1030'; g.beginPath(); g.arc(x,y,r*.3,0,7); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(x-r*.12,y-r*.15,r*.12,0,7); g.fill(); });
  const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; return t;
}
function buildButterflyWing(){
  const up=new THREE.Shape(); up.moveTo(0,.02); up.bezierCurveTo(.12,.5,.55,.78,.86,.66); up.bezierCurveTo(1.0,.6,.92,.3,.72,.14); up.bezierCurveTo(.5,.04,.22,0,0,.02);
  const lo=new THREE.Shape(); lo.moveTo(0,-.01); lo.bezierCurveTo(.3,.02,.62,-.06,.64,-.3); lo.bezierCurveTo(.66,-.5,.42,-.62,.28,-.52); lo.bezierCurveTo(.16,-.42,.06,-.2,0,-.01);
  const fix=g=>{ g=g.toNonIndexed(); const p=g.attributes.position, uv=g.attributes.uv;
    for (let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i); uv.setXY(i,Math.min(1,x/1.0),.5+y/1.3*.98); p.setZ(i,-.1*x*x); }
    g.computeVertexNormals(); return g; };
  return wingMerge([[fix(new THREE.ShapeGeometry(up,14)),new THREE.Matrix4()],[fix(new THREE.ShapeGeometry(lo,12)),new THREE.Matrix4().makeTranslation(0,0,.01)]]);
}
function buildCrystalWing(T){
  const arm=armCurve(), parts=[], m=new THREE.Matrix4(), e=new THREE.Euler(), base=new THREE.Color(T.col), deep=new THREE.Color(T.glow);
  const shard=(L,W)=>{ const g=new THREE.OctahedronGeometry(1,0); g.scale(W,L*.5,W*.45); g.translate(0,-L*.5,0); const q=g.toNonIndexed(); q.computeVertexNormals();
    return wingGrad(q,(x,y,z,c)=>{ const t=Math.min(1,-y/L); c.copy(deep).lerp(base,.35+.65*t); if (z>0) c.multiplyScalar(1.12); }); };
  for (let i=0;i<8;i++){ const k=i/7; e.set(-.06,0,.45+.95*k); m.makeRotationFromEuler(e); const p=arm.getPoint(.5+.5*k); m.setPosition(p.x,p.y,p.z); parts.push([shard(.5+.3*k,.06),m.clone()]); }
  for (let i=0;i<7;i++){ const k=i/6; e.set(-.04,0,.06+.34*k); m.makeRotationFromEuler(e); const p=arm.getPoint(.04+.46*k); m.setPosition(p.x,p.y,p.z-.015); parts.push([shard(.42-.06*k,.055),m.clone()]); }
  for (let i=0;i<9;i++){ const k=i/8; e.set(0,0,.2+.6*k); m.makeRotationFromEuler(e); const p=arm.getPoint(.03+.82*k); m.setPosition(p.x,p.y,p.z-.03); parts.push([shard(.2,.045),m.clone()]); }
  const tube=new THREE.TubeGeometry(arm,18,.035,6,false); wingGrad(tube,(x,y,z,c)=>c.set(T.arm)); parts.push([tube,new THREE.Matrix4()]);
  return wingMerge(parts);
}
function wingMaterial(type){
  const T=WING_TYPES[type];
  if (T.kind==='butterfly') return new THREE.MeshStandardMaterial({map:butterflyTex(T),emissive:0xffffff,emissiveMap:null,emissiveIntensity:.0,roughness:.55,side:THREE.DoubleSide,transparent:true,opacity:.95});
  if (T.kind==='crystal') return new THREE.MeshStandardMaterial({vertexColors:true,emissive:new THREE.Color(T.glow),emissiveIntensity:.45,roughness:.12,metalness:.15,flatShading:true,side:THREE.DoubleSide,transparent:true,opacity:.88});
  if (T.mat==='glow') return new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide});
  if (T.kind==='membrane') return new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,side:THREE.DoubleSide,transparent:true,opacity:.94});
  return new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,side:THREE.DoubleSide,emissive:0x1c2230,emissiveIntensity:.35});
}
function wingAsset(type){
  if (WING_GEO[type]) return WING_GEO[type];
  const T=WING_TYPES[type];
  const geo=T.kind==='membrane'?buildMembraneWing(T):T.kind==='butterfly'?buildButterflyWing(T):T.kind==='crystal'?buildCrystalWing(T):buildFeatherWing(T);
  return WING_GEO[type]={geo,mat:wingMaterial(type)};
}
let WING_GLOW_TEX=null;
function wingGlowTex(){ if (WING_GLOW_TEX) return WING_GLOW_TEX; const cv=document.createElement('canvas'); cv.width=cv.height=64; const g=cv.getContext('2d');
  const gr=g.createRadialGradient(32,32,2,32,32,30); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.35,'rgba(255,255,255,.6)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64);
  return WING_GLOW_TEX=new THREE.CanvasTexture(cv); }

/* 날개 한 쌍 만들기: 바깥 그룹(위치) → 오른쪽 축 / 거울(x -1) → 왼쪽 축 */
function makeWings(type){
  const T=WING_TYPES[type], A=wingAsset(type), root=new THREE.Group(), pivots=[];
  root.name='wings_'+type;
  [1,-1].forEach(side=>{ const holder=new THREE.Group(); holder.scale.x=side; holder.position.x=(T.kind==='butterfly'?.1:.075)*side; root.add(holder);
    const pv=new THREE.Group(); holder.add(pv); pivots.push(pv);
    const mesh=new THREE.Mesh(A.geo,A.mat); mesh.userData.noFlash=true; mesh.castShadow=true; mesh.frustumCulled=false; pv.add(mesh);
    if (T.flame||T.sparkle){ const sp=[]; for (let i=0;i<(T.flame?9:6);i++){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:wingGlowTex(),color:T.flame?(i%2?0xffb03a:0xff5a1f):0xbff4ff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
      s.userData.ph=Math.random(); s.userData.t=.5+Math.random()*.5; pv.add(s); sp.push(s); } pv.userData.sp=sp; }
  });
  root.scale.setScalar(T.scale);
  const st={t0:performance.now()/1000+Math.random()*3,last:0,lp:new THREE.Vector3(),v:0,ph:0};
  const arm=armCurve();
  pivots[0].children[0].onBeforeRender=()=>{
    const now=performance.now()/1000; if (now-st.last<.004) return; const dt=Math.min(.1,now-(st.last||now)); st.last=now;
    root.getWorldPosition(WV); if (dt>0){ const v=WV.distanceTo(st.lp)/dt; st.v+=(Math.min(8,v)-st.v)*Math.min(1,dt*6); } st.lp.copy(WV);
    const run=Math.min(1,st.v/3), hz=T.hz+(T.runHz-T.hz)*run, amp=T.amp+(T.runAmp-T.amp)*run;
    st.ph+=dt*hz*Math.PI*2; const f=Math.sin(st.ph);
    pivots.forEach(pv=>{ pv.rotation.set(.12+.06*f, .42-.22*run+.06*f, .1+amp*f);
      (pv.userData.sp||[]).forEach((s,i)=>{ const d=s.userData; d.ph=(d.ph+dt*(T.flame?1.1:.5)*d.t)%1; const k=(i+.5)/pv.userData.sp.length, p=arm.getPoint(.35+.6*k);
        if (T.flame){ s.position.set(p.x+.25*k,p.y-.5-.2*k+d.ph*.5,p.z-.05); const a=Math.sin(d.ph*Math.PI); s.material.opacity=.85*a; s.scale.setScalar(.12+.12*a); }
        else { s.position.set(p.x+.1*k,p.y-.35*k-.1,p.z-.06); const a=Math.max(0,Math.sin(d.ph*Math.PI*2)); s.material.opacity=a; s.scale.setScalar(.06+.08*a); } }); });
  };
  return root;
}
const WV=new THREE.Vector3();
/* 캐릭터 등(가슴 뼈)에 붙이기: 잠깐 기본 자세로 맞춘 뒤 붙여서 어느 캐릭터든 같은 자리에 와요 */
function attachWings(ch,type){
  const root=ch.root, chest=root.getObjectByName('chest')||root.getObjectByName('spine'); if (!chest||!WING_TYPES[type]) return null;
  const w=makeWings(type);
  try{ ch.skel.pose(); }catch(e){}
  root.updateMatrixWorld(true);
  const cp=new THREE.Vector3(), q=new THREE.Quaternion(), sc=new THREE.Vector3(); chest.getWorldPosition(cp); root.matrixWorld.decompose(new THREE.Vector3(),q,sc);
  const off=new THREE.Vector3(0,.05,-.2).multiply(sc).applyQuaternion(q);
  const holder=new THREE.Group(); holder.position.copy(cp).add(off); holder.quaternion.copy(q); holder.scale.copy(sc);
  holder.add(w); holder.updateMatrixWorld(true);
  chest.attach(holder);
  return holder;
}
