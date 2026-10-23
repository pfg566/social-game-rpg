/* 사회 게임 RPG · 서비스업 섬 맵 · 택배 · 도둑 해골
   파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
/* ---------- 서비스업 섬 맵: 물류 센터에 도착한 택배를 마을로 배달해요 ---------- */
const ISL_R=30, ISL_DOCK={x:0,z:-21.5}, ISL_PLAZA={x:0,z:2,r:4.6};
const ISL_SEGS=[], ISL_HOUSES=[], ISL_STATIONS=[[-10.5,-7],[10.5,-7],[0,12.5]];
let parcels=[], islBeam=null, islRing=null, islArrow=null, islBoat=null, islWater=null;
const PARCEL_COL=0xe0a040;
function islandOK(x,z,m){ return Math.hypot(x,z)<ISL_R-(m||0); }
function smallTag(text,color){
  const cv=document.createElement('canvas'); cv.width=320; cv.height=96; const g=cv.getContext('2d');
  g.fillStyle='rgba(18,22,34,.86)'; roundRect(g,4,4,312,88,20); g.fill();
  g.fillStyle=color; roundRect(g,4,4,16,88,8); g.fill();
  g.strokeStyle='rgba(232,200,120,.85)'; g.lineWidth=3; roundRect(g,6,6,308,84,18); g.stroke();
  g.fillStyle='#f7f1e3'; g.textAlign='center'; g.textBaseline='middle'; g.font='44px Jua, "Malgun Gothic", sans-serif'; g.fillText(text,166,52);
  const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,fog:false,toneMapped:false})); sp.scale.set(4.2,1.26,1); return sp;
}
const boxTex=canvasTex(128,128,(g,w,h)=>{ g.fillStyle='#c8955a'; g.fillRect(0,0,w,h);
  for (let i=0;i<300;i++){ g.fillStyle=`rgba(90,55,20,${rnd(.03,.09)})`; g.fillRect(Math.random()*w,Math.random()*h,rnd(2,8),1); }
  g.fillStyle='#e8d29a'; g.fillRect(w*.42,0,w*.16,h); g.strokeStyle='rgba(80,50,20,.6)'; g.lineWidth=4; g.strokeRect(2,2,w-4,h-4); });
boxTex.wrapS=boxTex.wrapT=THREE.ClampToEdgeWrapping;
const boxGeo=new THREE.BoxGeometry(.72,.56,.72), boxMat=toonMat({map:boxTex,rim:.25});
function makeBox(){ const m=cs(new THREE.Mesh(boxGeo,boxMat),false); return m; }

function buildIsland(){
  /* 바다: 섬 둘레가 물결치고 파도가 부서져요 */
  const lin=c=>new THREE.Color(c).convertSRGBToLinear();
  const wm=new THREE.ShaderMaterial({fog:true,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uTime:{value:0},uR:{value:ISL_R},uShal:{value:lin(0x5fc9d8)},uDeep:{value:lin(0x2a6fa8)}}]),
    vertexShader:'varying vec2 vW;\n#include <fog_pars_vertex>\nvoid main(){ vec4 wp=modelMatrix*vec4(position,1.); vW=wp.xz; vec4 mvPosition=viewMatrix*wp; gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader:'uniform float uTime; uniform float uR; uniform vec3 uShal; uniform vec3 uDeep; varying vec2 vW;\n#include <common>\n#include <fog_pars_fragment>\n'+
      'void main(){ float r=length(vW); float t=smoothstep(uR+1.,uR+16.,r); vec3 col=mix(uShal,uDeep,t);'+
      'float w=sin(vW.x*.33+uTime*.7)*sin(vW.y*.29-uTime*.55)+.5*sin((vW.x+vW.y)*.8+uTime*1.3); col+=smoothstep(1.05,1.4,w)*.10;'+
      'float a=atan(vW.y,vW.x); float e=r-(uR+1.2)+sin(a*14.+uTime*1.6)*.28+sin(a*5.-uTime)*.2; float f=1.-smoothstep(0.,1.4,e); col=mix(col,vec3(1.),f*.8);'+
      'float f2=smoothstep(.15,0.,abs(e-2.2-sin(uTime*1.1)*.6)); col=mix(col,vec3(1.),f2*.35);'+
      'gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n#include <fog_fragment>\n}'});
  islWater=wm;
  const water=new THREE.Mesh(new THREE.RingGeometry(ISL_R+.6,175,160,1),wm); water.rotation.x=-Math.PI/2; water.position.y=.06; scene.add(water);
  /* 모래사장 */
  const R2=ISL_R+2.4, rin=(ISL_R-3.2)/R2;
  const sand=canvasTex(1024,1024,(g,w,h)=>{ const c=w/2;
    const gr=g.createRadialGradient(c,c,0,c,c,c); gr.addColorStop(0,'rgba(230,207,150,0)'); gr.addColorStop(rin,'rgba(230,207,150,0)'); gr.addColorStop(rin+.05,'rgba(230,207,150,1)'); gr.addColorStop(1,'rgba(214,186,124,1)');
    g.fillStyle=gr; g.fillRect(0,0,w,h);
    g.globalCompositeOperation='source-atop'; for (let i=0;i<9000;i++){ g.fillStyle=Math.random()<.5?'rgba(150,120,70,.25)':'rgba(255,245,215,.35)'; g.fillRect(Math.random()*w,Math.random()*h,2,2); } });
  sand.wrapS=sand.wrapT=THREE.ClampToEdgeWrapping; sand.repeat.set(1,1);
  const sm=new THREE.Mesh(new THREE.CircleGeometry(R2,128),toonMat({map:sand,transparent:true,depthWrite:false}));
  sm.rotation.x=-Math.PI/2; sm.position.y=.035; sm.receiveShadow=true; scene.add(sm);
  /* 부두와 배 */
  const wood=std(0x8a5a32,{roughness:.9}), wood2=std(0x6e4526,{roughness:.9});
  for (let i=0;i<13;i++){ const p=cs(new THREE.Mesh(new THREE.BoxGeometry(3.4,.2,.82),i%2?wood:wood2)); p.position.set(0,.5,-(ISL_R-3+i*.95)); p.rotation.y=rnd(-.03,.03); scene.add(p); }
  for (const x of [-1.6,1.6]) for (let i=0;i<4;i++){ const p=cs(new THREE.Mesh(new THREE.CylinderGeometry(.16,.18,1.6,8),wood2)); p.position.set(x,.2,-(ISL_R+.5+i*2.8)); scene.add(p); }
  islBoat=new THREE.Group(); islBoat.position.set(4.4,0,-(ISL_R+6.5)); islBoat.rotation.y=Math.PI;
  { const hg=new THREE.BoxGeometry(2.6,1.1,6.4,1,2,6), pa=hg.attributes.position;
    for (let i=0;i<pa.count;i++){ const y=pa.getY(i), z=pa.getZ(i); let k=y<0?.62:1; if (z>1.6) k*=1-(z-1.6)/1.6*.85; pa.setX(i,pa.getX(i)*k); if (z>2.6&&y>0) pa.setY(i,y+.25); }
    hg.computeVertexNormals();
    const hull=cs(new THREE.Mesh(hg,std(0x9a4a2a,{flatShading:true}))); hull.position.y=.45; islBoat.add(hull);
    const deck=cs(new THREE.Mesh(new THREE.BoxGeometry(2.3,.12,4.2),std(0xc89a62))); deck.position.set(0,1.02,-.4); islBoat.add(deck);
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(2.66,.16,4.4),std(0xf2ead6)); stripe.position.set(0,.78,-.5); islBoat.add(stripe);
    const mast=cs(new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,5.4,8),wood2)); mast.position.set(0,3.6,.2); islBoat.add(mast);
    const sailT=canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#f7f0dc'; g.fillRect(0,0,w,h); g.fillStyle='#e0a040'; roundRect(g,w*.3,h*.34,w*.4,h*.32,10); g.fill(); g.fillStyle='#f7f0dc'; g.fillRect(w*.47,h*.34,w*.06,h*.32); g.strokeStyle='rgba(120,90,50,.4)'; g.lineWidth=3; for (let y=20;y<h;y+=40){ g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke(); } });
    sailT.wrapS=sailT.wrapT=THREE.ClampToEdgeWrapping;
    const sg=new THREE.PlaneGeometry(3.2,3.6,6,1), sp=sg.attributes.position; for (let i=0;i<sp.count;i++){ const x=sp.getX(i); sp.setZ(i,(1-(x/1.6)*(x/1.6))*.45); } sg.computeVertexNormals();
    const sail=cs(new THREE.Mesh(sg,toonMat({map:sailT,side:THREE.DoubleSide}))); sail.rotation.y=Math.PI/2; sail.position.set(0,3.9,.25); islBoat.add(sail);
    for (let i=0;i<3;i++){ const b=makeBox(); b.position.set(rnd(-.6,.6),1.36,-1.4+i*.8); b.rotation.y=rnd(-.4,.4); islBoat.add(b); }
  }
  scene.add(islBoat);
  /* 물류 센터 */
  stoneDisc(ISL_DOCK.x,ISL_DOCK.z,3.3);
  place('building_market_blue',-8.8,-20.5,3.4,2.6,.7);
  place('tent',8.6,-20.8,5,3.6,.8);
  [['crate_A_big',-4.6,-23.6,5],['crate_A_big',-4.1,-24.4,5],['crate_long_A',4.8,-23.8,5],['barrel',5.6,-22.6,5],['sack',-5.2,-18.6,6],['wheelbarrow',4.6,-18.2,5],['crate_A_big',-12.5,-16.5,5],['barrel',12.5,-17,5]]
    .forEach(([n,x,z,s])=>place(n,x,z,s,rnd(0,6),false));
  label('물류 센터','택배가 도착하는 곳','#e0a040',0,9,-26);
  /* 광장과 길 */
  stoneDisc(ISL_PLAZA.x,ISL_PLAZA.z,ISL_PLAZA.r);
  dirtStrip(ISL_DOCK.x,ISL_DOCK.z+3.1,ISL_PLAZA.x,ISL_PLAZA.z-ISL_PLAZA.r+.3,ISL_SEGS);
  /* 배달지: 집마다 문 앞에 배달 깔개가 있어요 */
  const H=[['파랑 지붕 집','building_home_A_blue',-22.5,-6,4.2,'#3b6fd9'],['초록 지붕 집','building_home_B_green',-21,10,3.8,'#21966f'],['성당','building_church_green',-9.5,22,4.6,'#7c4dff'],
           ['대장간','building_blacksmith_red',9.5,22,4.4,'#d9481f'],['풍차 농장','building_windmill_red',21,10,4.8,'#c98a00'],['광산','building_mine_red',22.5,-6,3.6,'#7a5a3a']];
  H.forEach(([name,model,x,z,s,hex],i)=>{
    const ry=Math.atan2(-x,-z);
    const o=place(model,x,z,s,ry,.72); if (model==='building_windmill_red') lift(o);
    const d=Math.hypot(x,z), ux=-x/d, uz=-z/d, sx=x+ux*4.6, sz=z+uz*4.6;
    dirtStrip(ISL_PLAZA.x-ux*(ISL_PLAZA.r-.3),ISL_PLAZA.z-uz*(ISL_PLAZA.r-.3),sx+ux*.4,sz+uz*.4,ISL_SEGS,2.8);
    const col=new THREE.Color(hex);
    const rug=new THREE.Mesh(new THREE.CircleGeometry(1.5,32),toonMat({color:col.clone().lerp(new THREE.Color(0xf2ead6),.35)})); rug.rotation.x=-Math.PI/2; rug.position.set(sx,.045,sz); rug.receiveShadow=true; scene.add(rug);
    const edge=new THREE.Mesh(new THREE.RingGeometry(1.5,1.75,40),new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide})); edge.rotation.x=-Math.PI/2; edge.position.set(sx,.05,sz); scene.add(edge);
    const tag=smallTag(name,hex); tag.position.set(x,s*1.7+2.2,z); scene.add(tag);
    ISL_HOUSES.push({name,hex,x:sx,z:sz,hx:x,hz:z,tag,edge});
  });
  /* 지식의 수정 */
  ISL_STATIONS.forEach(([x,z],i)=>{ const c=[0x9b6bff,0xffb72e,0x35c8e8][i], hex=['#7c4dff','#c98a00','#1b8fb0'][i]; stoneDisc(x,z,2.9); makeStation('any',x,z,c,{title:'지식의 수정',hex}); });
  /* 나무 · 바위 · 먼 섬 */
  const keep=[[ISL_PLAZA.x,ISL_PLAZA.z,ISL_PLAZA.r+2.5],[ISL_DOCK.x,ISL_DOCK.z,6],...ISL_STATIONS.map(([x,z])=>[x,z,4.5]),...ISL_HOUSES.map(h=>[h.x,h.z,3.2])];
  let n=0; for (let i=0;i<300&&n<20;i++){ const x=rnd(-27,27), z=rnd(-27,27); if (!islandOK(x,z,4)||!clearSpot(x,z,3,ISL_SEGS,keep)) continue; place(Math.random()<.5?'tree_single_A':'tree_single_B',x,z,rnd(3.2,4.2),rnd(0,6),.25); n++; }
  n=0; for (let i=0;i<300&&n<12;i++){ const a=rnd(0,6.283), r=rnd(ISL_R-3.5,ISL_R-1.2), x=Math.cos(a)*r, z=Math.sin(a)*r; if (z<-(ISL_R-10)&&Math.abs(x)<8) continue; if (!clearSpot(x,z,2,ISL_SEGS,keep)) continue; place(['rock_single_A','rock_single_C','rock_single_E'][n%3],x,z,rnd(2.6,4),rnd(0,6),false); n++; }
  for (let i=0;i<7;i++){ const a=i/7*Math.PI*2+.4, r=rnd(92,118); place(i%2?'mountain_A_grass_trees':'mountain_B_grass_trees',Math.cos(a)*r,Math.sin(a)*r,rnd(11,16),rnd(0,6),false); }
  for (let i=0;i<5;i++){ const a=i/5*Math.PI*2+1.1, r=rnd(62,72); place(i%2?'hills_A_trees':'hills_B_trees',Math.cos(a)*r,Math.sin(a)*r,rnd(6,8),rnd(0,6),false); }
  /* 섬 사람들 */
  addNpc('barbarian',-3.4,-18.2,.4); addNpc('rogue',-13,3,.9); addNpc('mage',13,3,-.9);
  /* 배달지 표시: 빛기둥 · 발밑 화살표 */
  islBeam=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.6,36,28,1,true),new THREE.MeshBasicMaterial({color:PARCEL_COL,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
  islBeam.position.y=18; islBeam.visible=false; scene.add(islBeam);
}
/* 발밑 화살표는 모든 맵 공용 그룹(arrowG처럼)으로 둬요 */
{
  islArrow=new THREE.Group();
  const sh=new THREE.Shape(); sh.moveTo(0,.95); sh.lineTo(.5,.25); sh.lineTo(.2,.25); sh.lineTo(.2,-.4); sh.lineTo(-.2,-.4); sh.lineTo(-.2,.25); sh.lineTo(-.5,.25); sh.lineTo(0,.95);
  const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:PARCEL_COL,side:THREE.DoubleSide,depthWrite:false,transparent:true,opacity:.95}));
  m.rotation.x=-Math.PI/2; m.position.z=2.6; islArrow.add(m);
  const o=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:0x18213a,side:THREE.DoubleSide,depthWrite:false}));
  o.rotation.x=-Math.PI/2; o.position.set(0,-.01,2.6); o.scale.setScalar(1.22); islArrow.add(o);
  islArrow.visible=false; scene.add(islArrow);
}

/* ---------- 택배 ---------- */
function islReset(){
  parcels.forEach(p=>{ if (p.mesh.parent) p.mesh.parent.remove(p.mesh); if (p.g) scene.remove(p.g); }); parcels=[];
  W.isl={quota:0,spawned:0,done:0,nextAt:0,delivered:0,lost:0,thiefQ:[],carry:null,hint:0,lastDest:-1,waitHint:0};
  if (islBeam) islBeam.visible=false; if (islArrow) islArrow.visible=false;
  ISL_HOUSES.forEach(h=>h.tag.scale.set(4.2,1.26,1));
}
function islWaveStart(d){
  const S=W.isl; if (!S) return;
  S.quota=d.parcels||0; S.spawned=0; S.done=0; S.nextAt=W.t+2.5;
  S.thiefQ=(d.thieves||[]).map(q=>({at:W.t+q.at,n:q.n,def:d}));
}
function islWaveDone(){ const S=W.isl; return MAPK!=='island' || !S || (S.spawned>=S.quota && !parcels.length && !S.thiefQ.length); }
function spawnParcel(){
  const S=W.isl; let di; do { di=Math.floor(Math.random()*ISL_HOUSES.length); } while (di===S.lastDest && ISL_HOUSES.length>1); S.lastDest=di;
  const a=rnd(0,6.283), r=rnd(.3,1.8), x=ISL_DOCK.x+Math.cos(a)*r, z=ISL_DOCK.z+Math.sin(a)*r;
  const g=new THREE.Group(); g.position.set(x,0,z);
  const mesh=makeBox(); mesh.position.y=.75; g.add(mesh);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.35,.55,5,14,1,true),new THREE.MeshBasicMaterial({color:PARCEL_COL,transparent:true,opacity:.25,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})); beam.position.y=2.5; g.add(beam);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.85,28),new THREE.MeshBasicMaterial({color:PARCEL_COL,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false})); ring.rotation.x=-Math.PI/2; ring.position.y=.07; g.add(ring);
  scene.add(g);
  parcels.push({state:'ground',x,z,dest:di,g,mesh,beam,ring,born:W.t});
  S.spawned++; fx.burst(x,1,z,PARCEL_COL,10,3);
  if (!S.hint){ S.hint=1; flashPrompt('북쪽 부두의 물류 센터에 택배가 왔어요! 상자에 다가가 집은 뒤 배달지로 가져가세요',3.5); }
}
function setGround(p,x,z){
  p.state='ground'; p.thief=null; p.x=x; p.z=z; p.g.position.set(x,0,z); p.g.add(p.mesh); p.mesh.position.set(0,.75,0); p.mesh.rotation.set(0,0,0); p.mesh.scale.setScalar(1);
  p.beam.visible=p.ring.visible=true; scene.add(p.g);
}
function removeParcel(p){ if (p.mesh.parent) p.mesh.parent.remove(p.mesh); scene.remove(p.g); parcels=parcels.filter(q=>q!==p); if (W.isl.carry===p) W.isl.carry=null; }
function pickParcel(p){
  const S=W.isl; S.carry=p; p.state='carried'; scene.remove(p.g); pg.add(p.mesh); p.mesh.position.set(0,2.85,0); p.mesh.rotation.set(0,.4,0); p.mesh.scale.setScalar(1.15);
  SFX.card(); fx.burst(P.x,1.4,P.z,PARCEL_COL,12,3);
  if (PEACE_RUN) p.due=W.t+PARCEL_TIME;
  const h=ISL_HOUSES[p.dest]; flashPrompt(`${h.name}(으)로 배달해요! 주황 화살표를 따라가세요`,3);
  const useOX=OX.length&&Math.random()<.45;
  openQuiz(pick(useOX?['ox','mc']:['mc','ox'],useOX?OX:MC),{type:'parcel'});
}
function deliverParcel(p){
  const S=W.isl, h=ISL_HOUSES[p.dest];
  removeParcel(p); S.delivered++; S.done++;
  SFX.correct(); fx.rise(h.x,h.z,PARCEL_COL,24); fx.burst(h.x,1.2,h.z,0xffffff,12,4); fx.num(h.x,3.2,h.z,'배달 완료!','#ffd34d',1.3);
  P.hp=Math.min(P.max,P.hp+5);
  if (PEACE_RUN && p.due && W.t<=p.due){ S.stars=(S.stars||0)+1; showBanner(`${h.name} 제시간 배달! ★`); fx.num(h.x,4.2,h.z,'★','#ffd34d',1.6); }
  else showBanner(`${h.name} 배달 완료!`);
  if (W.stats) W.stats.dl=(W.stats.dl||0)+1;
}
function thiefSpawn(def){
  const a=-rnd(.2,Math.PI-.2), r=ISL_R-2.5;
  spawnMob({...def,hp:Math.round(def.hp*.55),spd:3.3,runner:true,thief:true},false,{x:Math.cos(a)*r,z:Math.sin(a)*r});
}
/* 도둑 해골: 바닥에 놓인 상자를 노리고, 훔치면 바다로 달아나요. 처치하면 상자를 떨어뜨려요 */
function thiefAI(m,dt){
  let tx,tz;
  if (m.parcel){ const d=Math.hypot(m.x,m.z)||1; tx=m.x/d*(ISL_R+2); tz=m.z/d*(ISL_R+2);
    if (d>ISL_R-1.3){ const p=m.parcel; m.parcel=null; removeParcel(p); W.isl.lost++; W.isl.done++; if (W.stats) W.stats.lost=(W.stats.lost||0)+1;
      fx.burst(m.x,.5,m.z,0xffffff,24,5); flashPrompt('도둑 해골이 상자를 들고 바다로 달아났어요… 다음 상자는 꼭 지켜요!',2.6); SFX.wrong();
      m.hp=0; m.dying=0; return true; }
  } else {
    let best=null, bd=1e9; for (const p of parcels){ if (p.state!=='ground') continue; const d=Math.hypot(p.x-m.x,p.z-m.z); if (d<bd){ bd=d; best=p; } }
    if (!best) return false;
    tx=best.x; tz=best.z;
    if (bd<1.1){ best.state='thief'; best.thief=m; m.parcel=best; scene.remove(best.g); m.g.add(best.mesh); best.mesh.position.set(0,2.45,0); best.mesh.scale.setScalar(1.1);
      flashPrompt('도둑 해골이 상자를 훔쳤어요! 바다에 닿기 전에 쓰러뜨리세요',2.6); SFX.wrong(); }
  }
  const dx=tx-m.x, dz=tz-m.z, d=Math.hypot(dx,dz)||1, sp=m.spd*(m.parcel?.85:1)*(W.loc?.5:1)*slowK(m);
  m.x+=(dx/d*sp+m.kbx)*dt; m.z+=(dz/d*sp+m.kbz)*dt; m.kbx*=Math.pow(.02,dt); m.kbz*=Math.pow(.02,dt);
  if (!m.parcel) resolve(m,m.r);
  m.g.rotation.y=Math.atan2(dx,dz); m.flash=Math.max(0,m.flash-dt); m.mat.emissive.setHex(m.flash>0?0xffffff:0x000000);
  return true;
}
function islandTick(dt){
  const S=W.isl; if (MAPK!=='island' || !S) return;
  // 상자 도착
  if (S.spawned<S.quota && W.t>=S.nextAt && parcels.filter(p=>p.state==='ground').length<2){ spawnParcel(); S.nextAt=W.t+6; }
  // 도둑 해골 등장
  for (let i=S.thiefQ.length-1;i>=0;i--){ const q=S.thiefQ[i]; if (W.t<q.at) continue; S.thiefQ.splice(i,1); for (let k=0;k<q.n;k++) thiefSpawn(q.def);
    flashPrompt(S.thiefSeen?'도둑 해골이 또 나타났어요!':'주황색 도둑 해골은 상자를 훔쳐 가요! 상자 근처를 지키세요',3); S.thiefSeen=1; }
  // 쓰러진 도둑은 상자를 떨어뜨려요
  for (const p of parcels){ if (p.state==='thief' && p.thief && p.thief.dying>=0){ const m=p.thief; m.parcel=null; setGround(p,Math.max(-ISL_R+2,Math.min(ISL_R-2,m.x)),Math.max(-ISL_R+2,Math.min(ISL_R-2,m.z))); fx.burst(p.x,1,p.z,PARCEL_COL,10,3); flashPrompt('상자를 되찾았어요! 다시 집어서 배달하세요',2); } }
  // 줍기 · 배달
  if (!W.paused && !W.loc){
    if (S.carry){ const p=S.carry, h=ISL_HOUSES[p.dest]; if (Math.hypot(P.x-h.x,P.z-h.z)<2.1) deliverParcel(p); }
    else { for (const p of parcels){ if (p.state==='ground' && W.t-p.born>.6 && Math.hypot(P.x-p.x,P.z-p.z)<1.5){ pickParcel(p); break; } } }
  }
  // 남은 택배 안내
  if (!PEACE_RUN && !mobs.length && !W.gate && (parcels.length || S.spawned<S.quota) && W.t>=S.waitHint){ S.waitHint=W.t+9; flashPrompt('남은 택배를 모두 배달하면 웨이브가 끝나요',2.5); }
}
function islandLook(real,dt){
  if (islWater) islWater.uniforms.uTime.value=real;
  if (MAPK!=='island'){ if (islArrow) islArrow.visible=false; return; }
  if (islBoat){ islBoat.position.y=Math.sin(real*1.3)*.12; islBoat.rotation.z=Math.sin(real*1.1)*.04; islBoat.rotation.x=Math.sin(real*.9)*.025; }
  for (const p of parcels){ if (p.state!=='ground') continue; p.mesh.rotation.y=real*1.2; p.mesh.position.y=.75+Math.sin(real*3+p.x)*.12; p.ring.material.opacity=.45+Math.sin(real*4)*.2; }
  const S=W.isl, c=S&&S.carry&&W.state==='play';
  islBeam.visible=!!c; islArrow.visible=false;
  ISL_HOUSES.forEach(h=>h.tag.scale.set(4.2,1.26,1));
  if (c){ const h=ISL_HOUSES[S.carry.dest]; islBeam.position.set(h.x,18,h.z); islBeam.material.opacity=.24+Math.sin(real*4)*.1; islBeam.rotation.y=real*.5;
    const sc=1.25+Math.sin(real*5)*.1; h.tag.scale.set(4.2*sc,1.26*sc,1);
    const far=Math.hypot(h.x-P.x,h.z-P.z)>3; islArrow.visible=far; if (far){ islArrow.position.set(P.x,.14,P.z); islArrow.rotation.y=Math.atan2(h.x-P.x,h.z-P.z); const s2=1+Math.sin(real*6)*.12; islArrow.children[0].scale.setScalar(s2); islArrow.children[1].scale.setScalar(1.22*s2); } }
}

const clouds=[];

/* 애니메이션 캐릭터 */
function makeChar(key,scale,map){
  const src=GL[key]; const root=THREE.SkeletonUtils.clone(src.scene); root.scale.setScalar(scale);
  const mats=[];
  root.traverse(o=>{ if (o.isMesh||o.isSkinnedMesh){ o.castShadow=true; o.receiveShadow=true; o.frustumCulled=false; o.material=toToon(o.material,.5,0xfff2dc); mats.push(o.material); } });
  const mixer=new THREE.AnimationMixer(root);
  return {root,mixer,mats,anim:new Anim(mixer,src.animations,map)};
}
function Anim(mixer,clips,map){
  this.mixer=mixer; this.actions={}; this.cur=null; this.baseKey=null; this.want='idle'; this.lock=false; this.dead=false;
  for (const k in map){ const c=clips.find(x=>x.name===map[k]); if (c) this.actions[k]=mixer.clipAction(c); }
  mixer.addEventListener('finished',e=>{ if (e.action!==this.cur || this.dead) return; this.lock=false; this.baseKey=null; this.setBase(this.want); });
}
Anim.prototype._to=function(a,t){ if (this.cur && this.cur!==a) this.cur.fadeOut(t); a.reset(); a.setEffectiveWeight(1); a.fadeIn(t); a.play(); this.cur=a; };
Anim.prototype.setBase=function(k,speed){ this.want=k; if (this.dead||this.lock) return; const a=this.actions[k]; if (!a) return;
  if (speed) a.timeScale=speed; if (this.baseKey===k) return; this.baseKey=k; a.setLoop(THREE.LoopRepeat,Infinity); a.clampWhenFinished=false; this._to(a,.2); };
Anim.prototype.once=function(k,speed,force){ if (this.dead) return false; if (this.lock && !force) return false; const a=this.actions[k]; if (!a) return false;
  a.setLoop(THREE.LoopOnce,1); a.clampWhenFinished=true; a.timeScale=speed||1; this.lock=true; this.baseKey=null; this._to(a,.08); if (this.onAct) this.onAct(k,speed); return true; };
Anim.prototype.die=function(){ if (this.dead) return; this.once('death',1,true); this.dead=true; };
Anim.prototype.revive=function(){ this.dead=false; this.lock=false; this.baseKey=null; this.mixer.stopAllAction(); this.cur=null; this.setBase('idle'); };
function addNpc(key,x,z,ry){
  const c=makeChar(key,1,{idle:'Idle',work:key==='mage'?'Spellcasting':key==='barbarian'?'Interact':'Cheer',cheer:'Cheer'});
  c.root.position.set(x,0,z); c.root.rotation.y=ry; scene.add(c.root); c.anim.setBase('idle'); c.next=rnd(3,7); npcs.push(c); addCol(x,z,1.1,1.1);
}

/* 퀴즈 기둥: 돌 받침 위의 수정 */
function makeStation(zone,x,z,color,extra){
  const g=new THREE.Group();
  const stone=std(0x6e6a62,{roughness:.95,flatShading:true});
  const base=cs(new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.4,.55,8),stone)); base.position.y=.27;
  const col=cs(new THREE.Mesh(new THREE.CylinderGeometry(.62,.8,1.0,8),stone)); col.position.y=1.0;
  const top=cs(new THREE.Mesh(new THREE.CylinderGeometry(.9,.7,.22,8),std(0x6f6a62,{roughness:.9,flatShading:true}))); top.position.y=1.6;
  const runeM=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85});
  for (let i=0;i<4;i++){ const r=new THREE.Mesh(new THREE.PlaneGeometry(.22,.5),runeM); const a=i/4*Math.PI*2+Math.PI/8; r.position.set(Math.cos(a)*.73,1.0,Math.sin(a)*.73); r.lookAt(r.position.x*3,1.0,r.position.z*3); g.add(r); }
  const gemMat=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.85,roughness:.15,metalness:.1,flatShading:true});
  const gem=cs(new THREE.Mesh(new THREE.OctahedronGeometry(.62,0),gemMat),false); gem.scale.set(.75,1.45,.75); gem.position.y=2.75;
  const om=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9});
  const orbit=new THREE.Mesh(new THREE.TorusGeometry(1.0,.035,6,64),om), orbit2=new THREE.Mesh(new THREE.TorusGeometry(1.2,.03,6,64),om);
  orbit.position.y=orbit2.position.y=2.75;
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.75,2.1,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}));
  ring.rotation.x=-Math.PI/2; ring.position.y=.07;
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.5,.85,8,24,1,true),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  beam.position.y=4.6;
  const light=new THREE.PointLight(color,.7,8,2); light.position.y=2.8;
  g.add(base,col,top,gem,orbit,orbit2,ring,beam,light); g.position.set(x,0,z); scene.add(g);
  stations.push(Object.assign({zone,g,gem,gemMat,ring,color,readyAt:0,orbit,orbit2,beam,light},extra||{}));
}
within('zones',()=>{ makeStation('hq',0,-18,0x4f86ff); makeStation('lab',-19,12,0x2bd49a); makeStation('fac',19,12,0xff8a2a); });

/* 플레이어 자리(모델은 불러온 뒤 붙여요) */
const pg=new THREE.Group(); scene.add(pg);
let knight=null;
function blob(){ return new THREE.Object3D(); }
const pShadow=blob();
const swing=new THREE.Mesh(new THREE.RingGeometry(2.3,2.75,48),new THREE.MeshBasicMaterial({color:0xfff0a8,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
swing.rotation.x=-Math.PI/2; swing.position.y=.12; scene.add(swing);
const arcG=new THREE.Group(); scene.add(arcG);
const swingArc=new THREE.Mesh(new THREE.RingGeometry(.9,2.7,32,1,-Math.PI/2-1.25,2.5),new THREE.MeshBasicMaterial({color:0xfff6d8,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
swingArc.rotation.x=-Math.PI/2; arcG.add(swingArc);
let stepT=0, walkT=0, walkAmp=0, shake=0, smokeT=0, lastSwing=0, lastHurt=0, endPose=false;

/* 효과: 파편 · 피해 숫자 · 충격파 */
const fx=(()=>{
  const parts=[], geo=new THREE.OctahedronGeometry(.11), cache={};
  const mat=c=>cache[c]||(cache[c]=new THREE.MeshBasicMaterial({color:c,toneMapped:false}));
  function spawn(x,y,z,c,vx,vy,vz,life,grav,size,grow){
    let p=parts.find(q=>!q.alive);
    if (!p){ if (parts.length>320) return; p={mesh:new THREE.Mesh(geo,mat(c))}; scene.add(p.mesh); parts.push(p); }
    p.mesh.material=mat(c); p.mesh.visible=true; Object.assign(p,{alive:true,x,y,z,vx,vy,vz,life,max:life,grav,size,grow:!!grow});
  }
  function burst(x,y,z,c,n,sp){ for (let i=0;i<n;i++){ const a=Math.random()*6.283, u=rnd(.25,1); spawn(x,y,z,c,Math.cos(a)*sp*u,sp*rnd(.5,1.3),Math.sin(a)*sp*u,rnd(.45,.9),16,rnd(.8,1.6)); } }
  function rise(x,z,c,n){ for (let i=0;i<n;i++) spawn(x+rnd(-.9,.9),rnd(.2,1.6),z+rnd(-.9,.9),c,0,rnd(1.5,3),0,rnd(.8,1.3),0,rnd(1,1.6)); }
  function smoke(x,y,z){ spawn(x+rnd(-.15,.15),y,z+rnd(-.15,.15),0xbfc3ca,rnd(-.2,.2),rnd(1,1.5),rnd(.2,.5),2.8,0,2.6,true); }
  const nums=[];
  function num(x,y,z,text,color,scale){
    const cv=document.createElement('canvas'); cv.width=160; cv.height=72; const g=cv.getContext('2d');
    g.font='52px Jua, "Malgun Gothic", sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.lineWidth=8; g.strokeStyle='#18213a';
    g.strokeText(text,80,38); g.fillStyle=color; g.fillText(text,80,38);
    const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding;
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false,toneMapped:false}));
    const sc=scale||1; sp.scale.set(1.6*sc,.72*sc,1); sp.position.set(x+rnd(-.3,.3),y,z); sp.renderOrder=10; scene.add(sp); nums.push({sp,life:.85});
  }
  const rings=[];
  function shock(x,z,r){ const m=new THREE.Mesh(new THREE.RingGeometry(.85,1,48),new THREE.MeshBasicMaterial({color:0xffe1a8,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
    m.rotation.x=-Math.PI/2; m.position.set(x,.15,z); scene.add(m); rings.push({m,r,life:.5}); }
  function update(dt){
    for (const p of parts){ if (!p.alive) continue;
      p.life-=dt; if (p.life<=0){ p.alive=false; p.mesh.visible=false; continue; }
      p.vy-=p.grav*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt;
      if (p.grav && p.y<.08){ p.y=.08; p.vy*=-.35; p.vx*=.6; p.vz*=.6; }
      const k=p.life/p.max; p.mesh.position.set(p.x,p.y,p.z); p.mesh.rotation.x+=dt*6; p.mesh.rotation.y+=dt*5;
      p.mesh.scale.setScalar(p.grow ? p.size*(.5+(1-k)*1.6)*Math.min(1,k*3) : p.size*Math.min(1,k*1.8)); }
    for (let i=nums.length-1;i>=0;i--){ const n=nums[i]; n.life-=dt; n.sp.position.y+=dt*1.6; n.sp.material.opacity=Math.min(1,n.life*3);
      if (n.life<=0){ scene.remove(n.sp); n.sp.material.map.dispose(); n.sp.material.dispose(); nums.splice(i,1); } }
    for (let i=rings.length-1;i>=0;i--){ const g=rings[i]; g.life-=dt; const k=1-g.life/.5; g.m.scale.setScalar(.3+k*g.r); g.m.material.opacity=.9*(1-k);
      if (g.life<=0){ scene.remove(g.m); g.m.geometry.dispose(); g.m.material.dispose(); rings.splice(i,1); } }
  }
  return {burst,rise,smoke,num,shock,update};
})();

/* 지식 카드: 빛나는 두루마리 */
const qTex=canvasTex(128,160,(g,w,h)=>{ g.fillStyle='#efe2c0'; roundRect(g,6,6,w-12,h-12,10); g.fill(); g.lineWidth=7; g.strokeStyle='#c9952e'; roundRect(g,6,6,w-12,h-12,10); g.stroke();
  g.fillStyle='#5a3d14'; g.font='96px Jua, "Malgun Gothic", sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('?',w/2,h/2+6); });
qTex.wrapS=qTex.wrapT=THREE.ClampToEdgeWrapping;
const cardGeo=new THREE.PlaneGeometry(.85,1.06), cardMat=new THREE.MeshBasicMaterial({map:qTex,side:THREE.DoubleSide,transparent:true,toneMapped:false});
const cardBeamMat=new THREE.MeshBasicMaterial({color:0xffc531,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
const cardGlowMat=new THREE.MeshBasicMaterial({color:0xffc531,transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false});
let cards=[];
function dropCard(x,z){
  const g=new THREE.Group();
  const card=new THREE.Mesh(cardGeo,cardMat); card.position.y=1.2;
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,4,14,1,true),cardBeamMat); beam.position.y=2;
  const glow=new THREE.Mesh(new THREE.RingGeometry(.45,.75,28),cardGlowMat); glow.rotation.x=-Math.PI/2; glow.position.y=.06;
  g.add(card,beam,glow); g.position.set(x,0,z); scene.add(g);
  cards.push({m:g,card,x,z,born:W.t}); fx.burst(x,1,z,0xffc531,8,3);
}

