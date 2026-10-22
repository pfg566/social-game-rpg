/* 사회 게임 RPG · 3D 모델 불러오기 · 맵 만들기(세 거점 · 들판 마을 · 성벽 디펜스)
   파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
/* ---------- 3D 모델 불러오기 ---------- */
const MODEL_FILES={
  pclips:'models/pclips.glb?v=2', p_knight:'models/p2/Knight.glb', p_ranger:'models/p2/Ranger.glb', p_mage:'models/p2/Mage.glb',
  w_sword1:'models/p2/sword_1handed.glb', w_sword2:'models/p2/sword_2handed.glb', w_shround:'models/p2/shield_round.glb', w_shbadge:'models/p2/shield_badge.glb',
  w_shsquare:'models/p2/shield_square.glb', w_shspike:'models/p2/shield_spikes.glb', w_bow:'models/p2/bow_withString.glb', w_staff:'models/p2/staff.glb',
  mage:'models/mage.glb', barbarian:'models/barbarian.glb', rogue:'models/rogue.glb',
  sk_minion:'models/sk_minion.glb', sk_rogue:'models/sk_rogue.glb?v=3', sk_warrior:'models/sk_warrior.glb',
  blade:'models/Skeleton_Blade.gltf', axe:'models/Skeleton_Axe.gltf'
};
const ENV_FILES=['building_castle_blue','building_tower_A_blue','building_market_blue','building_home_A_blue','building_tower_B_green','building_church_green','building_well_green','building_home_B_green',
  'building_blacksmith_red','building_lumbermill_red','building_mine_red','building_windmill_red','wall_straight','fence_wood_straight',
  'trees_A_large','trees_B_medium','tree_single_A','tree_single_B','rock_single_A','rock_single_C','rock_single_E','mountain_A_grass_trees','mountain_B_grass_trees','hills_A_trees','hills_B_trees','cloud_big',
  'barrel','crate_A_big','crate_long_A','resource_lumber','resource_stone','wheelbarrow','flag_blue','flag_green','flag_red','tent','sack','weaponrack','target'];
const GL={}; let assetsReady=false;
const loadMgr=new THREE.LoadingManager();
loadMgr.onProgress=(url,done,total)=>{ const b=$('#startBtn'); if (!assetsReady && b){ b.textContent=`불러오는 중… ${Math.round(done/total*100)}%`; } };
const gltfLoader=new THREE.GLTFLoader(loadMgr);
function loadOne(key,url){ return new Promise((res,rej)=>gltfLoader.load(url,g=>{ GL[key]=g; res(g); },undefined,err=>rej(new Error(url)))); }
const assetsPromise=Promise.all([
  ...Object.entries(MODEL_FILES).map(([k,u])=>loadOne(k,u)),
  ...ENV_FILES.map(n=>loadOne(n,'env/'+n+'.gltf'))
]);

function prepMesh(root,shadow){ root.traverse(o=>{ if (o.isMesh){ o.castShadow=shadow!==false; o.receiveShadow=true;
  o.material=Array.isArray(o.material)?o.material.map(toonCached):toonCached(o.material); } }); return root; }
function place(name,x,z,s,ry,col){
  const g=GL[name]; if (!g) return null;
  const o=g.scene.clone(true); prepMesh(o); o.scale.setScalar(s); o.position.set(x,0,z); o.rotation.y=ry||0; scene.add(o);
  if (col!==false){ const bb=new THREE.Box3().setFromObject(o); const w=(bb.max.x-bb.min.x)*(col||.8), d=(bb.max.z-bb.min.z)*(col||.8); addCol((bb.min.x+bb.max.x)/2,(bb.min.z+bb.max.z)/2,w,d); }
  return o;
}
function lift(o){ if (!o) return o; const bb=new THREE.Box3().setFromObject(o); if (bb.min.y<0) o.position.y-=bb.min.y; return o; }

function buildZones(){
  {
  /* 본사: 성과 망루 */
  place('building_castle_blue',0,-34,5,0,.75);
  place('building_tower_A_blue',-10.5,-29,4.6,.3,.6);
  place('building_tower_A_blue',10.5,-29,4.6,-.3,.6);
  place('building_market_blue',9.5,-18.5,3.4,-.55,.7);
  place('building_home_A_blue',-9.5,-18.5,4.2,.5,.7);
  place('flag_blue',-3.4,-20,7,0,false); place('flag_blue',3.4,-20,7,0,false);
  /* 연구소: 마법 탑과 성당 */
  place('building_tower_B_green',-31.5,18.5,5.2,.6,.6);
  place('building_church_green',-31,6.5,4.6,1.1,.75);
  place('building_well_green',-19.5,21.5,3.2,0,.7);
  place('building_home_B_green',-24.5,25,3.8,.2,.7);
  place('flag_green',-21,7.5,7,0,false);
  /* 생산 공장: 대장간, 제재소, 풍차, 광산 */
  place('building_blacksmith_red',30.5,9,4.6,-.6,.75);
  place('building_lumbermill_red',24.5,24,4.2,.3,.7);
  lift(place('building_windmill_red',33,19.5,5,-.9,.6));
  place('building_mine_red',16.5,24.5,3.6,.5,.7);
  place('flag_red',21,7.5,7,0,false);
  [['crate_A_big',27,15.5,5],['crate_A_big',27.9,16.3,5],['crate_long_A',29,13.8,5],['barrel',26,13.6,5],['barrel',25.3,14.4,5],['resource_lumber',20,18.5,4],['resource_stone',29.5,20.5,4],['wheelbarrow',22.5,18.8,5],['sack',26.5,17.8,6]]
    .forEach(([n,x,z,s])=>place(n,x,z,s,rnd(0,6),false));
  /* 광장 */
  place('tent',-6.5,7.5,5,.6,.8); place('weaponrack',6,8.5,6,-.4,false); place('target',7.5,1,6,-1.2,false);
  let n=0; for (let i=0;i<120&&n<18;i++){ const x=rnd(-33,33), z=rnd(-33,33); if (!freeSpot(x,z,3)) continue;
    place(Math.random()<.5?'tree_single_A':'tree_single_B',x,z,rnd(3.2,4.2),rnd(0,6),.25); n++; }
  n=0; for (let i=0;i<120&&n<16;i++){ const x=rnd(-34,34), z=rnd(-34,34); if (!freeSpot(x,z,2.5)) continue;
    place(['rock_single_A','rock_single_C','rock_single_E'][n%3],x,z,rnd(3,5),rnd(0,6),false); n++; }
  /* 거점 사람들 */
  addNpc('rogue',4.2,-16.8,-.4); addNpc('mage',-22.2,9.4,.9); addNpc('barbarian',22.2,9.4,-.9);
  }
}
/* 맵은 처음 쓸 때 한 번만 만들어요 (건물 · 나무 · 사람 · 풀). 시작할 때 4개를 한꺼번에 만들지 않아서 가볍고 빨라요 */
const MAP_BUILD={zones:()=>buildZones(),general:()=>buildGeneral(),defense:()=>buildDefense(),island:()=>buildIsland()}, MAP_BUILT={};
let WORLD_READY=false;
function ensureMap(k){
  if (!WORLD_READY || MAP_BUILT[k] || !MAP_BUILD[k]) return;
  MAP_BUILT[k]=true;
  within(k,MAP_BUILD[k]);
  within(k,()=>buildGrass(60000,GRASS_OK[k]));
  applyQuality(QCUR);
}
function buildWorld(){

  /* 모든 맵이 함께 쓰는 배경: 나무 띠 · 언덕 · 산 (섬 맵에서는 바다라서 숨겨요) · 구름 */
  scene.add=function(){ bgGroup.add.apply(bgGroup,arguments); return scene; };
  for (let i=0;i<34;i++){ const a=i/34*Math.PI*2+rnd(-.05,.05), r=rnd(38,45);
    place(i%2?'trees_A_large':'trees_B_medium',Math.cos(a)*r,Math.sin(a)*r,rnd(4.5,6),rnd(0,6),false); }
  for (let i=0;i<14;i++){ const a=i/14*Math.PI*2+.2, r=rnd(52,60); place(i%2?'hills_A_trees':'hills_B_trees',Math.cos(a)*r,Math.sin(a)*r,rnd(8,11),rnd(0,6),false); }
  for (let i=0;i<10;i++){ const a=i/10*Math.PI*2+rnd(-.1,.1), r=rnd(72,85); place(i%2?'mountain_A_grass_trees':'mountain_B_grass_trees',Math.cos(a)*r,Math.sin(a)*r,rnd(13,18),rnd(0,6),false); }
  delete scene.add;
  for (let i=0;i<8;i++){ const c=GL.cloud_big.scene.clone(true); c.traverse(o=>{ if (o.isMesh){ o.material=o.material.clone(); o.material.emissive=new THREE.Color(0xffffff); o.material.emissiveIntensity=.35; o.material.fog=false; } });
    c.scale.setScalar(rnd(5,8)); c.position.set(rnd(-120,120),rnd(36,48),rnd(-110,30)); c.userData.v=rnd(.6,1.4); scene.add(c); clouds.push(c); }
  /* 주인공 */
  /* 주인공 모델은 직업을 고르면 붙여요 (06p-player.js · usePlayer) */
  const sh=new THREE.Mesh(new THREE.CircleGeometry(.75,24),new THREE.MeshBasicMaterial({map:glowTex,color:0x000000,transparent:true,opacity:.32,depthWrite:false}));
  sh.rotation.x=-Math.PI/2; sh.position.y=.04; sh.renderOrder=1; pg.add(sh);
}

/* 빈자리 찾기(일반 맵·디펜스 맵) */
function clearSpot(x,z,m,segs,circles){ return !circles.some(c=>Math.hypot(x-c[0],z-c[1])<c[2]) && !nearSegs(segs,x,z,m) && !colliders.some(b=>x>b.x0-1.5&&x<b.x1+1.5&&z>b.z0-1.5&&z<b.z1+1.5); }
function scatter(n,box,m,segs,circles,fn){ let k=0; for (let i=0;i<200&&k<n;i++){ const x=rnd(box[0],box[1]), z=rnd(box[2],box[3]); if (!clearSpot(x,z,m,segs,circles)) continue; fn(x,z,k); k++; } }
function stoneDisc(x,z,r){
  const m=new THREE.Mesh(new THREE.CircleGeometry(r,40),toonMat({map:stoneTex('#928c7f','#625b4f','#a29c8e')}));
  m.rotation.x=-Math.PI/2; m.position.set(x,.03,z); m.receiveShadow=true; scene.add(m);
  const curb=new THREE.Mesh(new THREE.TorusGeometry(r,.22,8,64),std(0x8d8577,{roughness:.95})); curb.rotation.x=Math.PI/2; curb.position.set(x,.05,z); curb.scale.z=.6; curb.receiveShadow=true; scene.add(curb);
}

/* ---------- 들판 마을 맵: 어느 단원이든 4지선다 + O/X로 ---------- */
const GEN_SEGS=[];
function buildGeneral(){
  const PL={x:0,z:2,r:6.5};
  stoneDisc(PL.x,PL.z,PL.r);
  const ST=[[0,-15,0x9b6bff,'#7c4dff'],[-15,11,0xffb72e,'#c98a00'],[15,11,0x35c8e8,'#1b8fb0']];
  ST.forEach(([x,z,c,hex])=>{
    const dx=x-PL.x, dz=z-PL.z, D=Math.hypot(dx,dz), ux=dx/D, uz=dz/D;
    dirtStrip(PL.x+ux*(PL.r-.3),PL.z+uz*(PL.r-.3),x-ux*2.6,z-uz*2.6,GEN_SEGS);
    stoneDisc(x,z,2.9);
    makeStation('any',x,z,c,{title:'지식의 수정',hex});
  });
  /* 마을 건물 */
  place('building_market_blue',13,-19,3.4,-.5,.7);
  place('building_home_A_blue',-12.5,-19.5,4.2,.5,.7);
  place('building_home_B_green',-25,-9,3.8,1.1,.7);
  place('building_church_green',-25,23,4.6,.8,.75);
  lift(place('building_windmill_red',27,23,5,-.9,.6));
  place('building_lumbermill_red',28,-6,4.2,-1.3,.7);
  place('building_blacksmith_red',23,-23,4.2,-.4,.75);
  place('building_tower_A_blue',-27,-25,4.6,.3,.6);
  place('building_well_green',-8.5,-3.5,3,0,.7);
  place('flag_blue',-3.2,-11.5,7,0,false); place('flag_blue',3.2,-11.5,7,0,false);
  place('flag_green',-19,8,7,0,false); place('flag_red',19,8,7,0,false);
  place('tent',-9,16,5,.6,.8); place('weaponrack',9.5,17,6,-.4,false); place('target',12,15.5,6,-1.2,false);
  [['crate_A_big',17,-15,5],['barrel',18.2,-14.2,5],['barrel',9.5,-14.5,5],['sack',10.5,-15.3,6],['resource_lumber',24,-1.5,4],['wheelbarrow',22.5,-3.5,5],['crate_long_A',-21,-6,5],['resource_stone',20,-19,4]]
    .forEach(([n,x,z,s])=>place(n,x,z,s,rnd(0,6),false));
  /* 나무와 바위 */
  const keep=[[PL.x,PL.z,PL.r+3],...ST.map(([x,z])=>[x,z,5])];
  scatter(16,[-33,33,-33,33],3,GEN_SEGS,keep,(x,z)=>place(Math.random()<.5?'tree_single_A':'tree_single_B',x,z,rnd(3.2,4.2),rnd(0,6),.25));
  scatter(14,[-34,34,-34,34],2.5,GEN_SEGS,keep,(x,z,k)=>place(['rock_single_A','rock_single_C','rock_single_E'][k%3],x,z,rnd(3,5),rnd(0,6),false));
  /* 마을 사람들 */
  addNpc('rogue',15.5,-14.5,-.6); addNpc('mage',-21,19,.9); addNpc('barbarian',24.5,-1,-1.2);
}

/* ---------- 성벽 디펜스 맵: 포탑을 퀴즈로 깨워 성문을 지켜요 ---------- */
const WALL_Z=-14, DOOR={x:0,z:-12.4}, DOOR_HP=450, TURRET_RANGE=22, TURRET_DMG=35, TURRET_TIME=20, DOOR_HIT=1.5;
const DEF_SEGS=[], TURRETS=[];
let bolts=[], doorG=null, doorMat=null, doorFlash=0;
const DOOR_COL=new THREE.Color(0x7a4a26), DOOR_DARK=new THREE.Color(0x2e1c10);
function makeTurret(x,y,z,color,title){
  const g=new THREE.Group(); g.position.set(x,y,z);
  const gemMat=new THREE.MeshStandardMaterial({color:0x7d8594,emissive:0x000000,emissiveIntensity:.9,roughness:.15,metalness:.1,flatShading:true});
  const gem=cs(new THREE.Mesh(new THREE.OctahedronGeometry(.75,0),gemMat),false); gem.scale.set(.8,1.4,.8);
  const om=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9});
  const orbit=new THREE.Mesh(new THREE.TorusGeometry(1.25,.05,6,64),om), orbit2=new THREE.Mesh(new THREE.TorusGeometry(1.5,.04,6,64),om);
  const light=new THREE.PointLight(color,0,14,2);
  g.add(gem,orbit,orbit2,light); scene.add(g);
  const t={x,y,z,color,title,until:0,cd:0,g,gem,gemMat,orbit,orbit2,light,boltMat:new THREE.MeshBasicMaterial({color,toneMapped:false})};
  TURRETS.push(t); return t;
}
function buildDefense(){
  const stone=std(0x8d8577,{roughness:.95,flatShading:true});
  /* 성벽: 문까지 한 줄로 막혀 있어요 */
  addCol(0,WALL_Z,92,1.6);
  for (const sd of [-1,1]) for (let i=0;i<6;i++) place('wall_straight',sd*(9.8+6*i),WALL_Z,3,0,false);
  place('building_tower_A_blue',-5.2,WALL_Z,3.6,0,.8); place('building_tower_A_blue',5.2,WALL_Z,3.6,0,.8);
  place('building_tower_A_blue',-31,WALL_Z,3.8,0,.8); place('building_tower_A_blue',31,WALL_Z,3.8,0,.8);
  /* 성문 */
  doorG=new THREE.Group(); doorG.position.set(0,0,WALL_Z+.1);
  doorMat=std(0x7a4a26,{roughness:.9});
  for (let i=0;i<5;i++){ const b=cs(new THREE.Mesh(new THREE.BoxGeometry(1.2,4.3,.42),doorMat)); b.position.set(-2.48+i*1.24,2.15,0); doorG.add(b); }
  const band=std(0x3a3f47,{roughness:.45,metalness:.6});
  for (const y of [1.1,3.2]){ const b=cs(new THREE.Mesh(new THREE.BoxGeometry(6.3,.28,.52),band)); b.position.set(0,y,0); doorG.add(b); }
  const ring=cs(new THREE.Mesh(new THREE.TorusGeometry(.32,.07,8,20),band)); ring.position.set(0,2.2,.3); doorG.add(ring);
  scene.add(doorG);
  const lintel=cs(new THREE.Mesh(new THREE.BoxGeometry(7.6,1.2,1.6),stone)); lintel.position.set(0,4.9,WALL_Z); scene.add(lintel);
  for (const x of [-3.2,-1.1,1.1,3.2]){ const c=cs(new THREE.Mesh(new THREE.BoxGeometry(1,.7,1.4),stone)); c.position.set(x,5.85,WALL_Z); scene.add(c); }
  const ped=cs(new THREE.Mesh(new THREE.CylinderGeometry(.55,.75,.9,8),stone)); ped.position.set(0,5.95,WALL_Z+.2); scene.add(ped);
  /* 포탑 탑 · 포탑 수정 */
  const tops=[-1,1].map(sd=>{ const o=place('building_tower_B_green',sd*18,WALL_Z-.4,3.8,0,.8); return o?new THREE.Box3().setFromObject(o).max.y:9.5; });
  const T=[makeTurret(-18,tops[0]+1.4,WALL_Z,0xff6b3d,'왼쪽 포탑'), makeTurret(0,7.5,WALL_Z+.2,0xffd34d,'성문 포탑'), makeTurret(18,tops[1]+1.4,WALL_Z,0x5cc8f0,'오른쪽 포탑')];
  const HEX=['#d9481f','#b88a00','#1b8fb0'];
  [[-15,-8.2],[0,-6.4],[15,-8.2]].forEach(([x,z],i)=>{ stoneDisc(x,z,2.9); makeStation('any',x,z,T[i].color,{title:`${T[i].title} 수정`,hex:HEX[i],turret:T[i]}); });
  /* 성 안쪽 (배경) */
  place('building_castle_blue',0,-28,5,0,false);
  place('building_tower_A_blue',-12,-24,4.6,.3,false); place('building_tower_A_blue',12,-24,4.6,-.3,false);
  place('building_church_green',-22,-24,4.6,.4,false); place('building_market_blue',22,-21,3.4,-.4,false);
  place('building_home_A_blue',-27,-19,4.2,.6,false); place('building_home_B_green',27,-27,3.8,-.5,false);
  place('flag_blue',-8,-12,7,0,false); place('flag_blue',8,-12,7,0,false);
  place('flag_red',-22,-12,7,0,false); place('flag_red',22,-12,7,0,false);
  /* 들판: 성문으로 이어진 길 · 남쪽 해골 진영 */
  dirtStrip(0,WALL_Z+.9,0,34,DEF_SEGS,5);
  [['crate_A_big',-11,-11.6,5],['barrel',-12.2,-11,5],['barrel',11.5,-11.4,5],['sack',12.4,-11.8,6],['crate_long_A',24,-11.4,5],['resource_stone',-25,-11.5,4]]
    .forEach(([n,x,z,s])=>place(n,x,z,s,rnd(0,6),false));
  place('tent',-14,32,5,.4,false); place('tent',12,31.5,5,-.5,false); place('tent',25,30,5,.9,false); place('tent',-26,30.5,5,-.8,false);
  place('weaponrack',-4,33,6,0,false); place('target',4.5,32.5,6,.3,false);
  const keep=[[-15,-8.2,4.5],[0,-6.4,4.5],[15,-8.2,4.5],[0,0,8]];
  scatter(9,[-33,-22,-9,26],3,DEF_SEGS,keep,(x,z)=>place(Math.random()<.5?'tree_single_A':'tree_single_B',x,z,rnd(3.2,4.2),rnd(0,6),.25));
  scatter(9,[22,33,-9,26],3,DEF_SEGS,keep,(x,z)=>place(Math.random()<.5?'tree_single_A':'tree_single_B',x,z,rnd(3.2,4.2),rnd(0,6),.25));
  scatter(10,[-34,34,-8,28],2.5,DEF_SEGS,keep.concat([[0,10,14]]),(x,z,k)=>place(['rock_single_A','rock_single_C','rock_single_E'][k%3],x,z,rnd(2.6,4.2),rnd(0,6),false));
  /* 성문 지기 */
  addNpc('barbarian',-8.6,-11.4,.25); addNpc('mage',8.6,-11.4,-.25);
}
function updateTurrets(dt){
  for (const t of TURRETS){
    if (W.t>=t.until) continue;
    t.cd-=dt; if (t.cd>0) continue;
    let best=null, bd=TURRET_RANGE;
    for (const m of mobs){ if (m.dying>=0||m.spawnT>0) continue; const d=Math.hypot(m.x-t.x,m.z-t.z); if (d<bd){ bd=d; best=m; } }
    if (!best) continue;
    t.cd=1.25;
    const mesh=new THREE.Mesh(boltGeo,t.boltMat); mesh.position.set(t.x,t.y,t.z); scene.add(mesh);
    bolts.push({mesh,m:best,t,sx:t.x,sz:t.z}); SFX.zap(); fx.burst(t.x,t.y,t.z,t.color,5,2);
  }
}
const boltGeo=new THREE.SphereGeometry(.3,12,8);
function updateBolts(dt){
  for (let i=bolts.length-1;i>=0;i--){
    const b=bolts[i], p=b.mesh.position, m=b.m;
    const tx=m.x, ty=m.boss?2.4:1.1, tz=m.z, dx=tx-p.x, dy=ty-p.y, dz=tz-p.z, d=Math.hypot(dx,dy,dz), step=34*dt;
    if (m.dying>=0 || d<=step+.2){
      if (m.dying<0) hitMob(m,TURRET_DMG,b.sx,b.sz,.4,'#'+b.t.color.toString(16).padStart(6,'0'),false,{src:'turret'});
      fx.burst(p.x,p.y,p.z,b.t.color,8,3); scene.remove(b.mesh); bolts.splice(i,1); continue;
    }
    p.x+=dx/d*step; p.y+=dy/d*step; p.z+=dz/d*step;
  }
}
function updateDefenseLook(real,dt){
  if (MAPK!=='defense') return;
  doorFlash=Math.max(0,doorFlash-dt);
  if (doorMat){
    const k=W.state==='play'||W.state==='end'?Math.max(0,Math.min(1,(W.door??DOOR_HP)/(W.doorMax||DOOR_HP))):1;
    doorMat.color.copy(DOOR_COL).lerp(DOOR_DARK,(1-k)*.85);
    doorMat.emissive.setHex(doorFlash>0?0x7a1a0a:0x000000);
    doorG.position.x=doorFlash>0?Math.sin(real*70)*.06:0;
  }
  for (const t of TURRETS){
    const on=W.state==='play'&&W.t<t.until, left=t.until-W.t;
    t.gem.rotation.y=real*(on?3:.8); t.gem.position.y=Math.sin(real*2+t.x)*.15;
    t.gemMat.color.setHex(on?t.color:0x7d8594); t.gemMat.emissive.setHex(on?t.color:0x000000);
    t.light.intensity=on?1.6+Math.sin(real*6)*.4:0;
    t.orbit.visible=t.orbit2.visible=on; if (on){ t.orbit.rotation.set(real*1.6,real*.8,0); t.orbit2.rotation.set(-real,0,real*1.3); const sc=left<5?.6+.4*Math.abs(Math.sin(real*8)):1; t.orbit.scale.setScalar(sc); t.orbit2.scale.setScalar(sc); }
  }
}

