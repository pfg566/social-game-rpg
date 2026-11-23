/* 사회 게임 RPG · 함께 쓰는 것: 구름 · 애니메이션 캐릭터 · 마을 사람 · 퀴즈 기둥(수정) · 효과 · 지식 카드
   (서비스업 섬 맵은 js/04i-island.js에 있어요)
   파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
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
  const light=ptLightQ(new THREE.PointLight(color,.7,8,2)); light.position.y=2.8;
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

