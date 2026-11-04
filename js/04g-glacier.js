/* 사회 게임 RPG · 녹는 빙하 맵 · 북극곰이 사는 빙하 6개를 지켜요
   빙하는 시간이 지나면 조금씩 녹고, 매연 해골이 닿으면 더 빨리 녹아요. 퀴즈를 맞히면 다시 얼어요.
   파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
const GL_R=27.5, GL_BASE={x:0,z:0,r:6};
const GL_STATIONS=[[0,-11],[-10,6.5],[10,6.5]];
const GL_MELT=.2, GL_MELT_WAVE=.05, GL_WARM_K=2.2, GL_WARM_T=8, GL_FREEZE=6, GL_FREEZE_ST=14, GL_MOB_K=.9;
const GL_BLOCKS=[];      // 빙하 6개 (모양 · 곰 · 물웅덩이 · 체력바)
let glWater=null, glSea=null;

/* 눈밭 바닥 · 얼음 무늬 */
const snowTex=canvasTex(1024,1024,(g,w,h)=>{
  g.fillStyle='#dde8f1'; g.fillRect(0,0,w,h);
  for (let i=0;i<14000;i++){ const b=Math.random(); g.fillStyle=b<.5?`rgba(140,175,205,${rnd(.08,.2)})`:`rgba(250,253,255,${rnd(.25,.5)})`; g.fillRect(Math.random()*w,Math.random()*h,rnd(1,4),rnd(1,3)); }
  g.strokeStyle='rgba(110,160,205,.45)'; g.lineWidth=2.5;
  for (let i=0;i<26;i++){ let x=Math.random()*w, y=Math.random()*h; g.beginPath(); g.moveTo(x,y); for (let k=0;k<5;k++){ x+=rnd(-70,70); y+=rnd(-70,70); g.lineTo(x,y); } g.stroke(); }
});
snowTex.wrapS=snowTex.wrapT=THREE.ClampToEdgeWrapping;

function polarBear(){
  const g=new THREE.Group(), fur=toonMat({color:0xf3efe4,rim:.3}), dark=new THREE.MeshBasicMaterial({color:0x1a1a22});
  const ball=(r,sx,sy,sz,x,y,z,m)=>{ const o=cs(new THREE.Mesh(new THREE.SphereGeometry(r,16,12),m||fur)); o.scale.set(sx,sy,sz); o.position.set(x,y,z); return o; };
  const body=ball(1,.72,.6,1.1,0,.92,0); g.add(body);
  const head=new THREE.Group(); head.position.set(0,1.22,1.02); g.add(head);
  head.add(ball(.42,1,.9,1.12,0,0,.1)); head.add(ball(.21,1,.8,1.25,0,-.09,.5)); head.add(ball(.075,1,.8,1,0,-.03,.75,dark));
  head.add(ball(.12,1,1,.7,-.26,.33,0)); head.add(ball(.12,1,1,.7,.26,.33,0));
  head.add(ball(.05,1,1,1,-.17,.1,.45,dark)); head.add(ball(.05,1,1,1,.17,.1,.45,dark));
  for (const [x,z] of [[-.42,.62],[.42,.62],[-.42,-.6],[.42,-.6]]){ const l=cs(new THREE.Mesh(new THREE.CylinderGeometry(.2,.22,.72,10),fur)); l.position.set(x,.36,z); g.add(l); }
  g.add(ball(.16,1,1,1,0,1.05,-1.08));
  g.userData={head,body};
  return g;
}
function iceBerg(){
  const g=new THREE.Group();
  const m1=std(0xb8e4fb,{flatShading:true}), m2=std(0x7cc4ea,{flatShading:true}), m3=std(0xd6f0ff,{flatShading:true});
  const piece=(s,m,x,y,z,ry)=>{ const o=cs(new THREE.Mesh(new THREE.IcosahedronGeometry(1,0),m)); o.scale.set(...s); o.position.set(x,y,z); o.rotation.set(rnd(-.15,.15),ry,rnd(-.15,.15)); g.add(o); };
  piece([1.7,2.5,1.6],m1,0,1.5,0,rnd(0,6)); piece([1.2,1.7,1.1],m2,1.2,.95,.5,rnd(0,6)); piece([1.1,1.3,1.2],m3,-1.15,.75,-.35,rnd(0,6)); piece([.8,1.0,.8],m2,.2,.55,-1.2,rnd(0,6));
  return g;
}
function buildGlacier(){
  /* 차가운 바다 */
  const lin=c=>new THREE.Color(c).convertSRGBToLinear();
  const wm=new THREE.ShaderMaterial({fog:true,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uTime:{value:0},uR:{value:GL_R+1},uShal:{value:lin(0x7cc7e0)},uDeep:{value:lin(0x24578f)}}]),
    vertexShader:'varying vec2 vW;\n#include <fog_pars_vertex>\nvoid main(){ vec4 wp=modelMatrix*vec4(position,1.); vW=wp.xz; vec4 mvPosition=viewMatrix*wp; gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader:'uniform float uTime; uniform float uR; uniform vec3 uShal; uniform vec3 uDeep; varying vec2 vW;\n#include <common>\n#include <fog_pars_fragment>\n'+
      'void main(){ float r=length(vW); float t=smoothstep(uR,uR+20.,r); vec3 col=mix(uShal,uDeep,t);'+
      'float w=sin(vW.x*.31+uTime*.6)*sin(vW.y*.27-uTime*.5)+.5*sin((vW.x+vW.y)*.7+uTime*1.1); col+=smoothstep(1.05,1.4,w)*.09;'+
      'float a=atan(vW.y,vW.x); float e=r-uR+sin(a*11.+uTime*1.3)*.25; col=mix(col,vec3(.93,.97,1.),(1.-smoothstep(0.,1.6,e))*.75);'+
      'gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n#include <fog_fragment>\n}'});
  glWater=wm;
  glSea=new THREE.Mesh(new THREE.RingGeometry(GL_R+.4,175,160,1),wm); glSea.rotation.x=-Math.PI/2; glSea.position.y=-.55; scene.add(glSea);
  /* 얼음 절벽(빙붕 가장자리)과 눈밭 */
  const cliff=new THREE.Mesh(new THREE.CylinderGeometry(GL_R+.9,GL_R+1.6,1.4,96,1,true),std(0xb9e3f7,{flatShading:true,side:THREE.DoubleSide}));
  { const pa=cliff.geometry.attributes.position; for (let i=0;i<pa.count;i++){ const x=pa.getX(i), z=pa.getZ(i), a=Math.atan2(z,x), k=1+Math.sin(a*17)*.012+Math.sin(a*5)*.01; pa.setX(i,x*k); pa.setZ(i,z*k); } cliff.geometry.computeVertexNormals(); }
  cliff.position.y=-.68; cliff.receiveShadow=true; scene.add(cliff);
  const sheet=new THREE.Mesh(new THREE.CircleGeometry(GL_R+.95,128),toonMat({map:snowTex})); sheet.rotation.x=-Math.PI/2; sheet.position.y=.01; sheet.receiveShadow=true; scene.add(sheet);
  /* 가운데 북극 기지 */
  const pad=new THREE.Mesh(new THREE.CircleGeometry(GL_BASE.r,48),toonMat({map:stoneTex('#c9dbe8','#9fb6c8','#dfeaf2')})); pad.rotation.x=-Math.PI/2; pad.position.set(GL_BASE.x,.025,GL_BASE.z); pad.receiveShadow=true; scene.add(pad);
  const curb=new THREE.Mesh(new THREE.TorusGeometry(GL_BASE.r,.2,8,64),std(0xa9c3d6,{roughness:.9})); curb.rotation.x=Math.PI/2; curb.scale.z=.6; curb.position.set(GL_BASE.x,.05,GL_BASE.z); scene.add(curb);
  place('tent',-3.2,-2.4,5,.7,.8);
  [['crate_A_big',3.2,-2.8,5],['barrel',4.1,-1.9,5],['sack',3.6,-3.8,6],['crate_long_A',-4.2,1.8,5]].forEach(([n,x,z,s])=>place(n,x,z,s,rnd(0,6),false));
  place('flag_blue',1.4,-4.2,7,0,false);
  GL_STATIONS.forEach(([x,z])=>makeStation('any',x,z,0x2fa8ff,{title:'냉각 수정',hex:'#1f86d0'}));
  /* 빙하 6개와 북극곰 */
  GL_BLOCKS.length=0;
  for (let i=0;i<6;i++){
    const a=i/6*Math.PI*2+Math.PI/6, R=19.5, x=Math.cos(a)*R, z=Math.sin(a)*R;
    const root=new THREE.Group(); root.position.set(x,0,z); scene.add(root);
    const floe=cs(new THREE.Mesh(new THREE.CylinderGeometry(3.5,3.8,.26,9),std(0xe4f5ff,{flatShading:true}))); floe.position.y=.13; floe.rotation.y=rnd(0,6); root.add(floe);
    const pool=new THREE.Mesh(new THREE.CircleGeometry(1,40),new THREE.MeshBasicMaterial({color:0x4fa9d8,transparent:true,opacity:.85,depthWrite:false})); pool.rotation.x=-Math.PI/2; pool.position.y=.28; pool.scale.setScalar(.01); root.add(pool);
    const berg=iceBerg(); berg.position.y=.2; root.add(berg);
    const bear=polarBear(); const ux=-x/R, uz=-z/R; bear.position.set(ux*2.6,.24,uz*2.6); bear.rotation.y=Math.atan2(ux,uz); bear.scale.setScalar(.72); root.add(bear);
    const bar=makeBar(2.2); bar.fg.material.color.setHex(0x5fc6ff);
    const col={x0:x-2.1,x1:x+2.1,z0:z-2.1,z1:z+2.1}; colliders.push(col);
    GL_BLOCKS.push({i,x,z,r:2.6,root,floe,pool,berg,bear,bar,col,ice:100,alive:true,flash:0,sinkT:0});
  }
  /* 멀리 떠 있는 빙산들 */
  const far=[std(0xe9f6ff,{flatShading:true}),std(0xc4e6f8,{flatShading:true})];
  for (let i=0;i<22;i++){ const a=i/22*Math.PI*2+rnd(-.08,.08), r=rnd(42,95), s=rnd(2.5,8);
    const o=new THREE.Mesh(new THREE.IcosahedronGeometry(1,0),far[i%2]); o.scale.set(s*rnd(.8,1.4),s*rnd(.6,1.3),s*rnd(.8,1.4)); o.position.set(Math.cos(a)*r,-.6+s*.25,Math.sin(a)*r); o.rotation.y=rnd(0,6); scene.add(o); }
  for (let i=0;i<14;i++){ const a=rnd(0,Math.PI*2), r=rnd(GL_R+3,GL_R+12), s=rnd(.8,2.2);
    const o=new THREE.Mesh(new THREE.CylinderGeometry(s,s*1.1,.3,7),far[0]); o.position.set(Math.cos(a)*r,-.45,Math.sin(a)*r); o.rotation.y=rnd(0,6); scene.add(o); }
  /* 눈 덮인 바위 · 작은 얼음 */
  for (let i=0;i<10;i++){ const a=rnd(0,Math.PI*2), r=rnd(9,25), x=Math.cos(a)*r, z=Math.sin(a)*r;
    if (GL_BLOCKS.some(b=>Math.hypot(x-b.x,z-b.z)<5.5) || GL_STATIONS.some(([sx,sz])=>Math.hypot(x-sx,z-sz)<4)) continue;
    const o=cs(new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(.4,.8),0),far[i%2])); o.position.set(x,.2,z); o.rotation.set(rnd(0,3),rnd(0,3),0); scene.add(o); }
}
MAP_BUILD.glacier=()=>buildGlacier();
GRASS_OK.glacier=null;

/* ---------- 판 진행 ---------- */
function glacierReset(){
  if (MAPK!=='glacier'){ W.gl=null; $('#iceRow').hidden=true; return; }
  W.gl={warmUntil:0,lost:0,warnAt:0,lowWarn:{}};
  const cols=MAPSTATE.glacier.colliders;
  for (const b of GL_BLOCKS){ b.ice=100; b.alive=true; b.flash=0; b.sinkT=0; b.berg.visible=true; b.bear.visible=true; b.bear.position.y=.24; b.floe.scale.set(1,1,1);
    if (!cols.includes(b.col)) cols.push(b.col); glVisual(b); }
  $('#iceRow').hidden=false;
}
function glAlive(){ return GL_BLOCKS.filter(b=>b.alive); }
function glAvg(){ return GL_BLOCKS.reduce((a,b)=>a+Math.max(0,b.ice),0)/Math.max(1,GL_BLOCKS.length); }
function glTarget(m){ let best=null, bd=1e9; for (const b of GL_BLOCKS){ if (!b.alive) continue; const d=Math.hypot(b.x-m.x,b.z-m.z); if (d<bd){ bd=d; best=b; } } return best; }
function glVisual(b){
  const k=Math.max(0,b.ice)/100;
  b.berg.scale.set(.5+.5*k,.15+.85*k,.5+.5*k);
  b.pool.scale.setScalar(.01+(1-k)*3.4);
  const h=b.bear.userData.head; h.rotation.x=k<.35?.45:0;      // 빙하가 많이 녹으면 고개를 떨궈요
  b.bar.fg.scale.x=Math.max(.001,k); b.bar.fg.position.x=-(1-k)*b.bar.w/2;
  b.bar.fg.material.color.setHex(k<.3?0xff8a5c:0x5fc6ff);
}
function glMelt(b,amt,byMob){
  if (!b.alive || amt<=0) return;
  b.ice-=amt; if (byMob) b.flash=.25;
  if (b.ice<=30 && !W.gl.lowWarn[b.i]){ W.gl.lowWarn[b.i]=true; flashPrompt('북극곰의 빙하가 거의 다 녹았어요! 퀴즈를 맞혀 다시 얼리세요',2.6); }
  if (b.ice<=0){
    b.ice=0; b.alive=false; b.sinkT=2; W.gl.lost++;
    const cols=MAPSTATE.glacier.colliders, ci=cols.indexOf(b.col); if (ci>=0) cols.splice(ci,1);
    fx.burst(b.x,1.2,b.z,0x9fdcff,30,6); SFX.door&&SFX.door();
    flashPrompt(`빙하 하나가 모두 녹았어요… 북극곰이 살 곳을 잃었어요 (남은 빙하 ${glAlive().length}개)`,3);
  }
  glVisual(b);
}
function glFreeze(amt,lowestOnly){
  if (!W.gl) return 0;
  const live=glAlive(); if (!live.length) return 0;
  const list=lowestOnly?[live.reduce((a,b)=>a.ice<=b.ice?a:b)]:live;
  let got=0;
  for (const b of list){ const before=b.ice; b.ice=Math.min(100,b.ice+amt); got+=b.ice-before; if (b.ice>30) W.gl.lowWarn[b.i]=false; glVisual(b); if (b.ice>before) fx.rise(b.x,b.z,0xbfeaff,14); }
  return Math.round(got);
}
/* 퀴즈 결과: 맞히면 다시 얼고, 틀리면 잠깐 온난화가 빨라져요 */
function glQuiz(ok,source,extras){
  if (MAPK!=='glacier' || !W.gl || PARTY.on) return;
  if (ok){
    const st=source&&source.type==='station';
    const n=glFreeze(st?GL_FREEZE_ST:GL_FREEZE,st);
    if (n>0) extras.push(st?`가장 많이 녹은 빙하가 다시 얼었어요! +${n}%`:`모든 빙하가 조금씩 다시 얼었어요 (+${GL_FREEZE}%)`);
  } else if (source && source.type!=='revive'){
    W.gl.warmUntil=W.t+GL_WARM_T; extras.push(`오답이라 ${GL_WARM_T}초 동안 빙하가 더 빨리 녹아요`);
  }
}
function glMobHit(m,dt){
  const b=m.glB; if (!b||!b.alive) return;
  m.doorCd=(m.doorCd||0)-dt;
  if (m.doorCd<=0){ m.doorCd=1.2; const dmg=Math.round(m.dmg*GL_MOB_K); glMelt(b,dmg,true); if (m.anim) m.anim.once('attack',1.6,true);
    fx.burst(b.x+(m.x-b.x)*.4,1.4,b.z+(m.z-b.z)*.4,0x9a9aa4,6,3); fx.num(b.x,3.6,b.z,'-'+dmg+'%','#8fd8ff');
    if (W.t>=W.gl.warnAt){ W.gl.warnAt=W.t+6; flashPrompt('매연 해골이 빙하를 녹이고 있어요! 가까이 가서 끌어내세요',2.2); } }
}
function glBossSlam(x,z,r){ if (MAPK!=='glacier'||!W.gl) return; for (const b of GL_BLOCKS){ if (b.alive && Math.hypot(b.x-x,b.z-z)<r+2.5){ glMelt(b,20,true); flashPrompt('보스의 내려찍기에 빙하가 깨졌어요! -20%',1.8); } } }
function glacierTick(dt){
  if (MAPK!=='glacier' || !W.gl) return;
  if (glWater) glWater.uniforms.uTime.value+=dt;
  const playing=W.state==='play' && !W.paused && W.wave>=0;
  if (playing){
    const warm=W.t<W.gl.warmUntil, rate=(GL_MELT+GL_MELT_WAVE*Math.max(0,W.wave))*(warm?GL_WARM_K:1)*(MODE==='hero'?1.3:LEVEL==='easy'?.7:LEVEL==='hard'?1.15:1);
    for (const b of GL_BLOCKS) if (b.alive){ glMelt(b,rate*dt,false); }
  }
  // 바다가 조금씩 차올라요 (녹은 만큼)
  if (glSea) glSea.position.y=-.55+(1-glAvg()/100)*.35;
  for (const b of GL_BLOCKS){
    if (b.flash>0){ b.flash-=dt; b.berg.position.x=Math.sin(W.t*60)*.06; } else b.berg.position.x=0;
    const bd=b.bear.userData.body; bd.scale.y=.6*(1+Math.sin(W.t*2.2+b.i)*.03);
    if (!b.alive){
      b.berg.visible=false;
      if (b.sinkT>0){ b.sinkT-=dt; b.bear.position.y=.24-(2-b.sinkT)*.9; b.floe.scale.setScalar(Math.max(.45,b.sinkT/2)); if (b.sinkT<=0) b.bear.visible=false; }
    }
    b.bar.g.position.set(b.x,b.alive?4.9*(.35+.65*b.ice/100)+.6:-50,b.z); b.bar.g.quaternion.copy(camera.quaternion);
  }
}
function glacierLost(){ return MAPK==='glacier' && W.gl && W.state==='play' && !glAlive().length; }
function glScore(){ if (MAPK!=='glacier'||!W.gl) return {alive:0,pts:0,avg:0}; const alive=glAlive().length, avg=Math.round(glAvg()); return {alive,avg,pts:alive*30+avg}; }
function glHUD(){
  if (MAPK!=='glacier' || !W.gl) return;
  const alive=glAlive().length, avg=glAvg();
  $('#iceTxt').textContent=`${alive}/6 · ${Math.round(avg)}%`+(W.t<W.gl.warmUntil?' 🔥':'');
  $('#iceBar').style.width=avg+'%';
}
/* 매연 해골: 회색빛으로 칠해요 */
function glTintMob(c){ if (MAPK==='glacier') c.mats.forEach(m=>{ if (m.color) m.color.multiply(new THREE.Color(0x9a9aa6)); }); }
