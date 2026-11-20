/* 사회 게임 RPG · 🏡 노을 마을 (돌아다니는 마을 · 1단계)
   로비에서 들어가요. 내 캐릭터(꾸민 모습 그대로)로 걸어 다니고, 건물 앞 발판에서 상점 · 던전(지금 열린 게임) · 내 집(준비 중)으로 들어가요.
   몬스터 · 퀴즈 · 기록이 없는 공간이라 점수에는 영향이 없어요. 파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
const VL={on:false,joining:false,built:false,yaw:0,pitch:.2,dist:6.5,run:false,drag:null,ks:1,door:null,callT:0,toastT:0,backShop:false,
  U:null,grass:null,leaves:null,sky:null,skyU:null,rays:null,mini:null,miniSrc:null};
const VL_LIN=h=>new THREE.Color(h).convertSRGBToLinear();
let vlSeed=7; const vlR=()=>{ vlSeed=(vlSeed*16807)%2147483647; return (vlSeed-1)/2147483646; }, vlS=(a,b)=>a+vlR()*(b-a);
const VL_SUN=new THREE.Vector3(-.42,.2,-.88).normalize();
const VL_MAP=140, VL_PATH_W=1.7;
const VL_PATH=[[-62,34],[-40,22],[-20,12],[-4,6],[10,0],[24,-10],[40,-26],[62,-40]].map(p=>new THREE.Vector2(p[0],p[1]));
const VL_SIDE=[[3,5.6],[4,1],[5.2,-3.5],[6.2,-8.5],[6.6,-12.6]].map(p=>new THREE.Vector2(p[0],p[1]));
const VL_HOUSES=[{x:7,z:-20,r:0,w:10,d:7,h:4.4,roof:'#6d5a8e',cozy:true},{x:-24,z:-8,r:.5,w:8,d:6.5,h:4.2,roof:'#8a4a3a',shop:true},{x:-8,z:27,r:Math.PI+.25,w:9,d:6.5,h:4.4,roof:'#5a6a8a'},{x:30,z:16,r:Math.PI-.4,w:8.5,d:6,h:4.2,roof:'#7a5a7a'}];
const VL_TREES=[[-8,-6,1.15,'au'],[16,6,1.3,'au'],[-30,10,1.2,'au'],[22,-24,1.1,'yl'],[-14,-24,1.05,'au'],[-2,16,.95,'yl'],[34,-6,1.2,'au'],[-40,-16,1.25,'gr'],[12,24,1.1,'gr'],[-20,30,1.15,'au'],[44,8,1.0,'yl'],[-44,26,1.05,'au'],[0,-36,1.2,'au'],[26,-40,1.0,'gr']];
const VL_BUSHES=[[-4,1,'rd'],[-6.5,-1.5,'au'],[12,4,'au'],[14.5,1.5,'rd'],[-1,-11,'gr'],[13,-12,'gr'],[-12,8,'au'],[18,-4,'rd'],[-17,2,'gr'],[3,10,'au'],[-26,16,'rd'],[26,-14,'au'],[30,0,'gr'],[-10,-14,'rd'],[8,14,'gr'],[-34,4,'au'],[20,12,'rd']];
const VL_PORTAL={x:31,z:-19,r:-2.2};
const VL_COLL=[];
const vlSegD=(p,a,b)=>{ const abx=b.x-a.x, aby=b.y-a.y, t=Math.max(0,Math.min(1,((p.x-a.x)*abx+(p.y-a.y)*aby)/(abx*abx+aby*aby))); return Math.hypot(p.x-(a.x+abx*t),p.y-(a.y+aby*t)); };
const VL_PATHC=new THREE.SplineCurve(VL_PATH), VL_PATHP=VL_PATHC.getPoints(160), VL_SIDEC=new THREE.SplineCurve(VL_SIDE), VL_SIDEP=VL_SIDEC.getPoints(40);
function vlPolyD(pts,x,z){ const p=new THREE.Vector2(x,z); let d=1e9; for (let i=0;i<pts.length-1;i++) d=Math.min(d,vlSegD(p,pts[i],pts[i+1])); return d; }
function vlInHouse(x,z,pad){ for (const H of VL_HOUSES){ const c=Math.cos(H.r), s=Math.sin(H.r), dx=x-H.x, dz=z-H.z, lx=dx*c-dz*s, lz=dx*s+dz*c; if (Math.abs(lx)<H.w/2+pad&&Math.abs(lz)<H.d/2+pad) return true; } return false; }
const vlFront=(H,d)=>({x:H.x+Math.sin(H.r)*d,z:H.z+Math.cos(H.r)*d});
const VL_DOORS=[
  {id:'home',...vlFront(VL_HOUSES[0],VL_HOUSES[0].d/2+1.5),sign:'🏠 내 집'},
  {id:'shop',...vlFront(VL_HOUSES[1],VL_HOUSES[1].d/2+1.6),sign:'🛒 상점'},
  {id:'dungeon',x:VL_PORTAL.x+Math.sin(VL_PORTAL.r)*2.2,z:VL_PORTAL.z+Math.cos(VL_PORTAL.r)*2.2,sign:'⚔️ 던전 입구'}];

/* ---------- 재질 · 텍스처 ---------- */
function vlCanvas(w,h,fn){ const cv=document.createElement('canvas'); cv.width=w; cv.height=h; fn(cv.getContext('2d'),cv); return cv; }
function vlTex(cv,rep){ const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; if (rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; } return t; }
const vlRnd=(a,b)=>a+Math.random()*(b-a);

function buildVillage(){
  const R=new THREE.Group(); scene.add(R); VL.root=R; VL_COLL.length=0;
  const add=o=>{ R.add(o); return o; };
  const U=VL.U={uTime:{value:0},uPlayer:{value:new THREE.Vector3()},uBase:{value:VL_LIN('#3b4f1a')},uTip:{value:VL_LIN('#d9c25e')},uTip2:{value:VL_LIN('#a9b544')},
    uSunCol:{value:VL_LIN('#ffb46e')},uSun:{value:VL_SUN.clone()},uFog:{value:new THREE.Color()},uFogN:{value:12},uFogF:{value:95}};
  VL_TREES.forEach(t=>VL_COLL.push({x:t[0],z:t[1],r:.7*t[2]}));

  /* 하늘 (해 · 노을 빛) */
  const skyU=VL.skyU={uTop:{value:VL_LIN('#7fa1cf')},uHor:{value:VL_LIN('#ffc58e')},uFog:{value:new THREE.Color()},uSun:{value:VL_SUN.clone()},uSunCol:{value:VL_LIN('#ffb46e')}};
  VL.sky=add(new THREE.Mesh(new THREE.SphereGeometry(280,32,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
    vertexShader:'varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader:`uniform vec3 uTop,uHor,uSun,uSunCol,uFog; varying vec3 vD;
      void main(){ float h=max(vD.y,0.); vec3 c=mix(uHor,uTop,pow(h,.55)); float s=max(dot(normalize(vD),uSun),0.);
        c+=uSunCol*(pow(s,600.)*6.+pow(s,24.)*.55+pow(s,4.)*.18); c=mix(uFog,c,smoothstep(-.02,.22,vD.y));
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
      }`})));
  VL.sky.renderOrder=-2; VL.sky.frustumCulled=false;

  /* 바닥: 흙길을 그린 큰 텍스처 */
  const N=2048, toPx=v=>(v/VL_MAP+.5)*N;
  const gcv=vlCanvas(N,N,g=>{
    g.fillStyle='#5d6b2b'; g.fillRect(0,0,N,N);
    for (let i=0;i<9000;i++){ g.fillStyle=`rgba(${vlRnd(80,140)|0},${vlRnd(95,130)|0},${vlRnd(30,55)|0},.2)`; g.beginPath(); g.arc(Math.random()*N,Math.random()*N,vlRnd(4,26),0,7); g.fill(); }
    const stroke=(pts,w,col,blur)=>{ g.save(); g.filter=`blur(${blur}px)`; g.strokeStyle=col; g.lineWidth=w/VL_MAP*N; g.lineCap='round'; g.lineJoin='round'; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(toPx(p.x),toPx(p.y)):g.moveTo(toPx(p.x),toPx(p.y))); g.stroke(); g.restore(); };
    stroke(VL_PATHP,VL_PATH_W*2+1.4,'#8a7a4e',10); stroke(VL_PATHP,VL_PATH_W*2,'#c9ad84',4);
    stroke(VL_SIDEP,2.4,'#8a7a4e',8); stroke(VL_SIDEP,1.7,'#b9a07a',3);
    const sd=[[VL_DOORS[1].x,VL_DOORS[1].z],[VL_DOORS[2].x,VL_DOORS[2].z]];   // 상점 · 던전 앞 작은 마당
    sd.forEach(([x,z])=>{ g.save(); g.filter='blur(6px)'; g.fillStyle='#bba27a'; g.beginPath(); g.arc(toPx(x),toPx(z),2.4/VL_MAP*N,0,7); g.fill(); g.restore(); });
    for (let i=0;i<14000;i++){ const p=VL_PATHP[(Math.random()*VL_PATHP.length)|0]; g.fillStyle=`rgba(${vlRnd(150,215)|0},${vlRnd(130,185)|0},${vlRnd(95,140)|0},.35)`; g.fillRect(toPx(p.x+vlRnd(-VL_PATH_W,VL_PATH_W)),toPx(p.y+vlRnd(-VL_PATH_W,VL_PATH_W)),vlRnd(1,4),vlRnd(1,4)); }
    VL_HOUSES.forEach(H=>{ g.save(); g.translate(toPx(H.x),toPx(H.z)); g.rotate(-H.r); g.filter='blur(6px)'; g.fillStyle='#4a4a2a'; const w=(H.w+1.2)/VL_MAP*N, d=(H.d+1.2)/VL_MAP*N; g.fillRect(-w/2,-d/2,w,d); g.restore(); });
  });
  VL.miniSrc=gcv;
  const ground=add(new THREE.Mesh(new THREE.PlaneGeometry(VL_MAP,VL_MAP),new THREE.MeshStandardMaterial({map:vlTex(gcv),roughness:1})));
  ground.rotation.x=-Math.PI/2; ground.receiveShadow=true;
  const far=add(new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.MeshStandardMaterial({color:0x55662a,roughness:1}))); far.rotation.x=-Math.PI/2; far.position.y=-.02;

  /* 풀: 캐릭터 주변(한 변 약 50m)에 가는 풀잎을 아주 빽빽하게. 움직이면 풀밭이 따라와요(먼 곳은 바닥 그림 · 풀 뭉치 · 안개).
     뿌리 색은 바닥 그림에서 그대로 가져와서 바닥과 이어져 보여요. 길 · 집 · 문 앞은 '풀 지도(mask)'로 비워요 */
  const MS=512, mcv=vlCanvas(MS,MS,()=>{}), mg=mcv.getContext('2d'), mp=v=>(v/VL_MAP+.5)*MS;
  { const A=vlCanvas(MS,MS,g=>{ g.fillStyle='#fff'; g.fillRect(0,0,MS,MS); g.strokeStyle='#000'; g.fillStyle='#000'; g.lineCap='round'; g.lineJoin='round';
      g.filter='blur(2px)';
      const st=(pts,w)=>{ g.lineWidth=w/VL_MAP*MS; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(mp(p.x),mp(p.y)):g.moveTo(mp(p.x),mp(p.y))); g.stroke(); };
      st(VL_PATHP,VL_PATH_W*2+.9); st(VL_SIDEP,2.0);
      VL_HOUSES.forEach(H=>{ g.save(); g.translate(mp(H.x),mp(H.z)); g.rotate(-H.r); const w=(H.w+.5)/VL_MAP*MS, d=(H.d+.5)/VL_MAP*MS; g.fillRect(-w/2-(H.cozy?0:0),-d/2,w+(H.cozy?3.4/VL_MAP*MS:0),d); g.restore(); });
      VL_DOORS.forEach(d=>{ if (d.id==='home') return; g.beginPath(); g.arc(mp(d.x),mp(d.z),2.2/VL_MAP*MS,0,7); g.fill(); });
      g.beginPath(); g.arc(mp(VL_PORTAL.x),mp(VL_PORTAL.z),3/VL_MAP*MS,0,7); g.fill();
      VL_COLL.forEach(c=>{ if (c.r>.4){ g.beginPath(); g.arc(mp(c.x),mp(c.z),c.r*.7/VL_MAP*MS,0,7); g.fill(); } }); });
    const B=vlCanvas(MS,MS,g=>{ g.fillStyle='#fff'; g.fillRect(0,0,MS,MS);
      const hor=new THREE.Vector2(-VL_SUN.x,-VL_SUN.z).normalize(), kk=1/Math.max(.25,VL_SUN.y);
      const spot=(x,z,r,k)=>{ const gr=g.createRadialGradient(mp(x),mp(z),0,mp(x),mp(z),r/VL_MAP*MS); gr.addColorStop(0,`rgba(0,0,0,${k})`); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,MS,MS); };
      VL_TREES.forEach(t=>{ const o=Math.min(14,5.5*t[2]*kk*.35); spot(t[0]+hor.x*o,t[1]+hor.y*o,4*t[2],.6); });
      VL_BUSHES.forEach(b=>spot(b[0]+hor.x*.8,b[1]+hor.y*.8,1.6,.45));
      VL_HOUSES.forEach(H=>{ const o=Math.min(10,3*kk*.5); for (let i=-1;i<=1;i++) spot(H.x+hor.x*o+Math.cos(H.r)*i*H.w*.3,H.z+hor.y*o-Math.sin(H.r)*i*H.w*.3,H.d*.7,.55); }); });
    const a=A.getContext('2d').getImageData(0,0,MS,MS).data, b=B.getContext('2d').getImageData(0,0,MS,MS).data, out=mg.createImageData(MS,MS);
    for (let i=0;i<a.length;i+=4){ out.data[i]=a[i]; out.data[i+1]=b[i]; out.data[i+2]=0; out.data[i+3]=255; }
    mg.putImageData(out,0,0); }
  VL.maskCv=mcv; const maskT=new THREE.CanvasTexture(mcv); maskT.minFilter=THREE.LinearFilter; maskT.generateMipmaps=false;
  const gT=new THREE.CanvasTexture(gcv); gT.minFilter=THREE.LinearFilter; gT.generateMipmaps=false;
  U.uMask={value:maskT}; U.uGround={value:gT}; U.uCenter={value:new THREE.Vector2()}; U.uR={value:24}; U.uMap={value:VL_MAP}; U.uDry={value:VL_LIN('#d9a24a')}; U.uGK={value:1.45};
  const GMAX=240000, geo=new THREE.InstancedBufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,0, 1,0,0, -.75,.4,0, .75,.4,0, -.4,.75,0, .4,.75,0, 0,1,0],3)); geo.setIndex([0,1,2, 1,3,2, 2,3,4, 3,5,4, 4,5,6]);
  const off=new Float32Array(GMAX*3), pr=new Float32Array(GMAX*4);
  vlSeed=11;
  for (let n=0;n<GMAX;n++){ off[n*3]=vlS(-24,24); off[n*3+2]=vlS(-24,24); pr[n*4]=vlR()*Math.PI*2; pr[n*4+1]=vlS(.6,1.15); pr[n*4+2]=vlS(.012,.024); pr[n*4+3]=vlR(); }
  geo.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,3)); geo.setAttribute('aP',new THREE.InstancedBufferAttribute(pr,4));
  geo.userData={max:GMAX};
  VL.grass=add(new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:U,side:THREE.DoubleSide,
    vertexShader:`attribute vec3 aOff; attribute vec4 aP; uniform float uTime,uR,uMap; uniform vec3 uPlayer; uniform vec2 uCenter; uniform sampler2D uMask,uGround;
      varying float vH,vV,vS; varying vec3 vW,vG;
      void main(){
        vec2 rel=mod(aOff.xz-uCenter+uR,2.*uR)-uR; vec2 root=uCenter+rel;
        vec2 uv=vec2(root.x/uMap+.5,1.-(root.y/uMap+.5)); vec4 mk=texture2D(uMask,uv);
        float fade=1.-smoothstep(uR*.72,uR,max(abs(rel.x),abs(rel.y)));
        float pch=.5+.5*sin(root.x*.23+sin(root.y*.17)*2.)*cos(root.y*.19-root.x*.07);
        float hgt=aP.y*(.22+.34*pch)*smoothstep(.15,.6,mk.r)*fade;
        float h=position.y; float c=cos(aP.x), s=sin(aP.x);
        vec3 p=vec3(position.x*aP.z*c, h*hgt, position.x*aP.z*s);
        p.xz+=vec2(-s,c)*h*h*hgt*.35;
        float w=sin(uTime*1.3+root.x*.21+root.y*.17)*.55+sin(uTime*2.6+root.x*.7-root.y*.5)*.2+.3; p.xz+=vec2(.85,.45)*w*.35*hgt*h*h;
        vec3 wp=vec3(root.x,0.,root.y)+p; vec2 d=wp.xz-uPlayer.xz; float dl=length(d)+1e-4; float push=smoothstep(1.,.0,dl)*h; wp.xz+=d/dl*push*.45; wp.y-=push*.25*hgt;
        vW=wp; vH=h; vV=aP.w*.6+pch*.4; vS=mk.g; vG=pow(texture2D(uGround,uv).rgb,vec3(2.2));
        gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.); }`,
    fragmentShader:`uniform vec3 uTip,uTip2,uDry,uSunCol,uSun,uFog; uniform float uFogN,uFogF,uTime,uGK; varying float vH,vV,vS; varying vec3 vW,vG;
      void main(){ vec3 tip=mix(uTip2,uTip,smoothstep(.2,.8,vV)); tip=mix(tip,uDry,smoothstep(.75,1.,vV)*.6);
        vec3 base=vG*uGK*mix(.55,1.,vS);
        vec3 col=mix(base,tip*mix(.55,1.,vS),smoothstep(.0,1.,vH));
        vec3 V=normalize(vW-cameraPosition); float back=pow(max(dot(V,uSun),0.),5.)*vH*vS; col+=uSunCol*(back*.6+.12*vH*vS);
        float dist=length(vW-cameraPosition); col=mix(col,uFog,smoothstep(uFogN,uFogF,dist));
        gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
      }`})));
  VL.grass.frustumCulled=false;

  /* 단풍 나무 · 덤불 (잎 뭉치 카드) */
  const ltex=vlTex(vlCanvas(256,256,g=>{ for (let i=0;i<85;i++){ const a=Math.random()*Math.PI*2, r=Math.sqrt(Math.random())*96, x=128+Math.cos(a)*r, y=128+Math.sin(a)*r, s=vlRnd(9,17), l=vlRnd(170,255)|0;
    g.save(); g.translate(x,y); g.rotate(vlRnd(0,7)); g.fillStyle=`rgb(${l},${l},${l})`; g.beginPath(); g.moveTo(0,-s); g.quadraticCurveTo(s*.85,-s*.2,0,s); g.quadraticCurveTo(-s*.85,-s*.2,0,-s); g.fill();
    g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(0,-s*.8); g.lineTo(0,s*.9); g.stroke(); g.restore(); } }));
  const PAL={au:['#e3542a','#f0782e','#f59a38','#d8402a','#f2b445','#c9341f'],rd:['#d6402c','#e4552f','#b8301f','#ef6b35'],yl:['#f2b13c','#f6c94e','#e8962f','#f5d66a'],gr:['#6c963a','#86ad48','#5a8534','#9bb950']};
  const leafMat=new THREE.MeshStandardMaterial({map:ltex,alphaTest:.5,side:THREE.DoubleSide,roughness:.85,emissive:0x2a1204});
  leafMat.onBeforeCompile=s=>{ s.uniforms.uTime=U.uTime;
    s.vertexShader='attribute vec3 aN;\nuniform float uTime;\n'+s.vertexShader
      .replace('#include <defaultnormal_vertex>','#include <defaultnormal_vertex>\n transformedNormal=normalMatrix*normalize(aN);')
      .replace('#include <begin_vertex>','#include <begin_vertex>\n float ph=instanceMatrix[3].x*.45+instanceMatrix[3].z*.33; transformed+=vec3(sin(uTime*1.3+ph),sin(uTime*1.7+ph*1.3)*.5,cos(uTime*1.1+ph))*.07;'); };
  const bark=new THREE.MeshStandardMaterial({color:0x6a4a33,roughness:.95});
  const cards=[];
  const crown=(cx,cy,cz,rx,ry,rz,cnt,pal,a,b)=>{ for (let i=0;i<cnt;i++){ let x,y,z; do { x=vlS(-1,1); y=vlS(-1,1); z=vlS(-1,1); } while (x*x+y*y+z*z>1);
    const L=Math.hypot(x,y,z)||1, k=Math.pow(L,.35)/L; x*=k; y*=k; z*=k; const col=VL_LIN(pal[(vlR()*pal.length)|0]).multiplyScalar((.8+.35*(y+1)/2)*vlS(.85,1.1));
    cards.push({p:new THREE.Vector3(cx+x*rx,cy+y*ry,cz+z*rz),r:new THREE.Euler(vlS(0,6.3),vlS(0,6.3),vlS(0,6.3)),s:vlS(a,b),c:col,n:new THREE.Vector3(x,y*.8+.25,z).normalize()}); } };
  vlSeed=3;
  if (VL.natOK) vlNatureTrees(add); else {
  VL_TREES.forEach(([x,z,s,kind])=>{ const th=4.2*s, tr=add(new THREE.Mesh(new THREE.CylinderGeometry(.22*s,.42*s,th,9),bark)); tr.position.set(x,th/2,z); tr.castShadow=tr.receiveShadow=true;
    const pal=PAL[kind]; crown(x,th+1.5*s,z,3.4*s,2.5*s,3.4*s,Math.round(240*s),pal,1.4*s,2.1*s);
    for (let i=0;i<4;i++){ const a=i/4*Math.PI*2+vlS(0,1), len=vlS(2,3)*s, tilt=vlS(.6,1), b=new THREE.Mesh(new THREE.CylinderGeometry(.08*s,.16*s,len,6),bark);
      b.position.set(x+Math.cos(a)*Math.sin(tilt)*len/2,th*vlS(.65,.9)+Math.cos(tilt)*len/2,z+Math.sin(a)*Math.sin(tilt)*len/2); b.rotation.set(0,-a,0); b.rotateZ(-tilt); b.castShadow=true; add(b);
      crown(x+Math.cos(a)*Math.sin(tilt)*len,th*.8+Math.cos(tilt)*len+.3,z+Math.sin(a)*Math.sin(tilt)*len,1.7*s,1.3*s,1.7*s,Math.round(40*s),pal,1.1*s,1.7*s); } });
  VL_BUSHES.forEach(([x,z,kind])=>{ const s=vlS(.8,1.2); crown(x,.85*s,z,1.6*s,1.0*s,1.6*s,Math.round(110*s),PAL[kind],.8,1.2); VL_COLL.push({x,z,r:1.1*s}); });
  for (let i=0;i<70;i++){ const a=i/70*Math.PI*2+vlS(-.04,.04), r=vlS(68,90), s=vlS(1.3,2); crown(Math.cos(a)*r,5.5*s,Math.sin(a)*r,4.2*s,4*s,4.2*s,70,PAL[['au','yl','gr','au','rd'][(vlR()*5)|0]],1.9*s,2.6*s); }
  { const m=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),leafMat,cards.length), aN=new Float32Array(cards.length*3), q=new THREE.Quaternion(), M=new THREE.Matrix4(), S=new THREE.Vector3();
    cards.forEach((c,i)=>{ q.setFromEuler(c.r); S.setScalar(c.s); M.compose(c.p,q,S); m.setMatrixAt(i,M); m.setColorAt(i,c.c); aN[i*3]=c.n.x; aN[i*3+1]=c.n.y; aN[i*3+2]=c.n.z; });
    m.geometry.setAttribute('aN',new THREE.InstancedBufferAttribute(aN,3));
    m.castShadow=true; m.receiveShadow=true; m.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:ltex,alphaTest:.5,side:THREE.DoubleSide}); m.frustumCulled=false; add(m); VL.leaves=m; }
  // 뾰족 소나무
  { const pine=[]; vlSeed=31; for (let i=0;i<26;i++){ const a=vlS(0,6.3), r=vlS(40,64); pine.push([Math.cos(a)*r,Math.sin(a)*r,vlS(1,1.6)]); } pine.push([-16,-30,1.3],[-30,-26,1.5],[-36,-20,1.2]);
    const m=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,8),new THREE.MeshStandardMaterial({roughness:.9}),pine.length*3), M=new THREE.Matrix4(), q=new THREE.Quaternion(); let k=0;
    pine.forEach(([x,z,s])=>{ if (vlInHouse(x,z,2)||vlPolyD(VL_PATHP,x,z)<VL_PATH_W+2||Math.hypot(x-VL_PORTAL.x,z-VL_PORTAL.z)<9) return;
      for (let j=0;j<3;j++){ M.compose(new THREE.Vector3(x,(2.2+j*1.5)*s,z),q,new THREE.Vector3((2.2-j*.55)*s,(2.6-j*.3)*s,(2.2-j*.55)*s)); m.setMatrixAt(k,M); m.setColorAt(k,VL_LIN(['#2f5e34','#3a6d3c','#2a5530'][j])); k++; }
      const tr=add(new THREE.Mesh(new THREE.CylinderGeometry(.2*s,.3*s,2*s,7),bark)); tr.position.set(x,s,z); tr.castShadow=true; VL_COLL.push({x,z,r:.5*s}); });
    m.count=k; m.castShadow=true; m.receiveShadow=true; add(m); }
  }

  /* 집 */
  const stone=new THREE.MeshStandardMaterial({color:0x9a958c,roughness:1}), white=new THREE.MeshStandardMaterial({color:0xe6e1d6,roughness:.9});
  const wood=new THREE.MeshStandardMaterial({color:0x6b4a30,roughness:.9}), frame=new THREE.MeshStandardMaterial({color:0x4a3022,roughness:.8});
  const glow=VL.glow=new THREE.MeshStandardMaterial({color:0x8a5a2a,emissive:0xffa040,emissiveIntensity:.75,roughness:.4});
  VL.mats={stone,white,wood,frame};
  const mesh=(g,geo,mat,x,y,z)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; g.add(m); return m; };
  const plaster=(w,h)=>vlTex(vlCanvas(512,Math.round(512*h/w),(g,cv)=>{ const W2=512,H2=cv.height; g.fillStyle='#efe5d3'; g.fillRect(0,0,W2,H2);
    for (let i=0;i<900;i++){ g.fillStyle=`rgba(${vlRnd(150,200)|0},${vlRnd(130,170)|0},${vlRnd(100,140)|0},.06)`; g.beginPath(); g.arc(vlRnd(0,W2),vlRnd(0,H2),vlRnd(2,14),0,7); g.fill(); }
    const B=W2/w*.22; g.fillStyle='#5a3b28'; g.fillRect(0,0,W2,B); g.fillRect(0,H2-B,W2,B); g.fillRect(0,H2*.47,W2,B*.9);
    const cols=Math.max(2,Math.round(w/1.6)); for (let i=0;i<=cols;i++) g.fillRect(i/cols*(W2-B),0,B,H2);
    g.lineWidth=B*.8; g.strokeStyle='#5a3b28'; for (let i=0;i<cols;i+=2){ g.beginPath(); g.moveTo(i/cols*(W2-B)+B,H2*.47+B); g.lineTo((i+1)/cols*(W2-B),H2-B); g.stroke(); } }));
  const shingle=col=>{ const c=new THREE.Color(col); return vlTex(vlCanvas(256,256,g=>{ for (let r=0;r<16;r++) for (let k=0;k<9;k++){ const v=vlRnd(.82,1.12); g.fillStyle=`rgb(${Math.min(255,c.r*255*v)|0},${Math.min(255,c.g*255*v)|0},${Math.min(255,c.b*255*v)|0})`; g.fillRect(k*32-(r%2)*16,r*16,30,15); } }),true); };
  const scallop=(col,dark)=>{ const c=new THREE.Color(col); return vlTex(vlCanvas(256,256,g=>{ g.fillStyle=dark; g.fillRect(0,0,256,256);
    for (let r=0;r<9;r++) for (let k=-1;k<9;k++){ const x=k*32+(r%2)*16+16, y=r*30, v=vlRnd(.9,1.1); g.fillStyle=`rgb(${Math.min(255,c.r*255*v)|0},${Math.min(255,c.g*255*v)|0},${Math.min(255,c.b*255*v)|0})`;
      g.beginPath(); g.moveTo(x-15,y); g.lineTo(x+15,y); g.lineTo(x+15,y+18); g.arc(x,y+18,15,0,Math.PI); g.closePath(); g.fill(); g.strokeStyle='rgba(255,255,255,.25)'; g.lineWidth=2; g.beginPath(); g.arc(x,y+18,11,.3,Math.PI-.3); g.stroke(); } }),true); };
  const roofAndGable=(g,H,rm,wallMat,pitch,over)=>{ const rise=H.d/2*Math.tan(pitch), slab=(H.d/2+over)/Math.cos(pitch), top=.6+H.h;
    if (rm.map) rm.map.repeat.set(H.w/2.4,slab/2.4);
    for (const s of [-1,1]){ const r=mesh(g,new THREE.BoxGeometry(H.w+.9+over*.3,.24,slab),rm,0,top+rise/2+.05,s*(H.d/4+over*.22)); r.rotation.x=s*pitch; }
    const tri=new THREE.Shape(); tri.moveTo(-H.d/2,0); tri.lineTo(H.d/2,0); tri.lineTo(0,rise); tri.lineTo(-H.d/2,0);
    for (const s of [-1,1]) mesh(g,new THREE.ExtrudeGeometry(tri,{depth:.1,bevelEnabled:false}),wallMat,s*(H.w/2-.05),top,0).rotation.y=Math.PI/2;
    return {rise,top}; };
  const arch=(w,h)=>{ const s=new THREE.Shape(); s.moveTo(-w/2,0); s.lineTo(w/2,0); s.lineTo(w/2,h-w/2); s.absarc(0,h-w/2,w/2,0,Math.PI,false); s.lineTo(-w/2,0); return s; };
  const glass=VL.glass=new THREE.MeshStandardMaterial({color:0x8a5a2a,emissive:0xffa040,emissiveIntensity:.7,roughness:.15});
  const archWin=(g,x,y,z,ry,w,h,box)=>{
    const f=new THREE.Mesh(new THREE.ExtrudeGeometry(arch(w+.22,h+.16),{depth:.1,bevelEnabled:false}),frame); f.position.set(x,y-.08,z); f.rotation.y=ry; g.add(f);
    const gl=new THREE.Mesh(new THREE.ShapeGeometry(arch(w,h)),glass); gl.rotation.y=ry; gl.position.set(x,y,z); gl.translateZ(.11); g.add(gl);
    const bar=new THREE.Mesh(new THREE.BoxGeometry(.06,h,.04),frame); bar.rotation.y=ry; bar.position.set(x,y+h/2,z); bar.translateZ(.13); g.add(bar);
    if (box){ const b=new THREE.Mesh(new THREE.BoxGeometry(w+.3,.25,.35),wood); b.rotation.y=ry; b.position.set(x,y-.2,z); b.translateZ(.2); b.castShadow=true; g.add(b);
      for (let i=0;i<4;i++){ const fl=new THREE.Mesh(new THREE.SphereGeometry(.1,6,5),new THREE.MeshStandardMaterial({color:new THREE.Color(['#ff6b8a','#ffffff','#ffd84a','#ff8fb0'][i])})); fl.rotation.y=ry; fl.position.set(x,y-.02,z); fl.translateX((i-1.5)*(w/4)); fl.translateZ(.22); g.add(fl); } } };
  const plainHouse=H=>{ const g=new THREE.Group(); g.position.set(H.x,0,H.z); g.rotation.y=H.r; add(g);
    mesh(g,new THREE.BoxGeometry(H.w+.3,.6,H.d+.3),stone,0,.3,0);
    const fm=new THREE.MeshStandardMaterial({map:plaster(H.w,H.h),roughness:.95}), sm=new THREE.MeshStandardMaterial({map:plaster(H.d,H.h),roughness:.95});
    mesh(g,new THREE.BoxGeometry(H.w,H.h,H.d),[sm,sm,fm,fm,fm,fm],0,.6+H.h/2,0);
    const {rise,top}=roofAndGable(g,H,new THREE.MeshStandardMaterial({map:shingle(H.roof),roughness:.85}),new THREE.MeshStandardMaterial({color:0xe9dcc6,roughness:.95}),.72,.55);
    mesh(g,new THREE.BoxGeometry(1.1,2.4,1.1),stone,H.w*.3,top+rise*.6+.9,-H.d*.18);
    const wy=[.6+H.h*.3,.6+H.h*.75];
    [-H.w*.36,-H.w*.14,H.w*.14,H.w*.36].forEach((x,i)=>wy.forEach((y,j)=>{ if (j===0&&(i===1||i===2)) return;
      mesh(g,new THREE.BoxGeometry(1.15,1.05,.12),frame,x,y,H.d/2+.04); mesh(g,new THREE.PlaneGeometry(.92,.82),glow,x,y,H.d/2+.11);
      mesh(g,new THREE.BoxGeometry(.08,.82,.04),frame,x,y,H.d/2+.13); mesh(g,new THREE.BoxGeometry(.92,.07,.04),frame,x,y,H.d/2+.13); }));
    mesh(g,new THREE.BoxGeometry(1.5,2.5,.14),frame,0,1.85,H.d/2+.05); mesh(g,new THREE.BoxGeometry(1.2,2.25,.1),new THREE.MeshStandardMaterial({color:H.shop?0x9a3b2a:0x4f6b66,roughness:.7}),0,1.75,H.d/2+.1);
    mesh(g,new THREE.BoxGeometry(2.2,.12,1.1),wood,0,3.35,H.d/2+.5).rotation.x=-.35; mesh(g,new THREE.BoxGeometry(1.8,.3,1.0),stone,0,.15,H.d/2+.6);
    for (const s of [-1,1]){ mesh(g,new THREE.BoxGeometry(.12,1,1.1),frame,s*(H.w/2+.04),wy[1],0); mesh(g,new THREE.PlaneGeometry(.88,.8),glow,s*(H.w/2+.11),wy[1],0).rotation.y=s*Math.PI/2; }
    if (H.shop){ // 상점: 줄무늬 차양 · 간판 · 진열 상자
      const st=vlTex(vlCanvas(256,64,g2=>{ for (let i=0;i<8;i++){ g2.fillStyle=i%2?'#f6efe0':'#d9483a'; g2.fillRect(i*32,0,32,64); } }));
      const aw=mesh(g,new THREE.BoxGeometry(H.w*.8,.1,1.6),new THREE.MeshStandardMaterial({map:st,roughness:.8}),0,.6+H.h*.52,H.d/2+.8); aw.rotation.x=.38;
      const sg=vlTex(vlCanvas(512,160,g2=>{ g2.fillStyle='#5a3b28'; g2.fillRect(0,0,512,160); g2.fillStyle='#f6d58a'; g2.font='bold 96px Jua, "Malgun Gothic", sans-serif'; g2.textAlign='center'; g2.textBaseline='middle'; g2.fillText('상점',256,86); }));
      mesh(g,new THREE.PlaneGeometry(2.6,.8),new THREE.MeshStandardMaterial({map:sg,roughness:.7}),0,.6+H.h*.88,H.d/2+.13);
      for (const x of [-H.w*.32,H.w*.32]){ mesh(g,new THREE.BoxGeometry(1.3,.7,.8),wood,x,.95,H.d/2+.7); for (let i=0;i<5;i++) mesh(g,new THREE.SphereGeometry(.16,8,6),new THREE.MeshStandardMaterial({color:new THREE.Color(['#e04a3a','#f2b33c','#7cc04a','#e86a2a','#d8402a'][i])}),x-.4+i*.2,1.42,H.d/2+.7+(i%2?.15:-.15)); }
    } };
  const cozyHouse=H=>{ const g=new THREE.Group(); g.position.set(H.x,0,H.z); g.rotation.y=H.r; add(g);
    const wall=new THREE.MeshStandardMaterial({color:0xf3e3bf,roughness:.9}), beam=new THREE.MeshStandardMaterial({color:0x6a4128,roughness:.8});
    mesh(g,new THREE.BoxGeometry(H.w+.3,.6,H.d+.3),stone,0,.3,0); mesh(g,new THREE.BoxGeometry(H.w,H.h,H.d),wall,0,.6+H.h/2,0);
    for (const x of [-H.w/2,H.w/2]) for (const z of [-H.d/2,H.d/2]) mesh(g,new THREE.BoxGeometry(.28,H.h,.28),beam,x,.6+H.h/2,z);
    mesh(g,new THREE.BoxGeometry(H.w+.1,.22,.22),beam,0,.6+H.h*.48,H.d/2+.02); mesh(g,new THREE.BoxGeometry(H.w+.1,.22,.22),beam,0,.6+H.h,H.d/2+.02);
    const rm=new THREE.MeshStandardMaterial({map:scallop('#3f6fd8','#24438a'),roughness:.55});
    const {top}=roofAndGable(g,H,rm,wall,.82,.7);
    const dx=-H.w*.22, dz=H.d/2-.3, dy=top+.9;
    mesh(g,new THREE.BoxGeometry(1.8,1.6,1.4),wall,dx,dy,dz-.2);
    const dt=new THREE.Shape(); dt.moveTo(-1.05,0); dt.lineTo(1.05,0); dt.lineTo(0,.9); dt.lineTo(-1.05,0); mesh(g,new THREE.ExtrudeGeometry(dt,{depth:.1,bevelEnabled:false}),wall,dx,dy+.8,dz+.45);
    for (const s of [-1,1]) mesh(g,new THREE.BoxGeometry(.2,1.4,1.7),rm,dx+s*.55,dy+1.15,dz-.25).rotation.z=-s*.95;
    archWin(g,dx,dy-.55,dz+.5,0,.8,1.05,true); archWin(g,-H.w*.32,1.5,H.d/2,0,1.1,1.6,true); archWin(g,H.w*.28,1.5,H.d/2,0,1.0,1.5,true);
    const door=new THREE.Mesh(new THREE.ExtrudeGeometry(arch(1.3,2.4),{depth:.12,bevelEnabled:false}),new THREE.MeshStandardMaterial({color:0xb5763f,roughness:.8})); door.position.set(0,.6,H.d/2); g.add(door);
    const ar=new THREE.Mesh(new THREE.ExtrudeGeometry(arch(1.75,2.75),{depth:.1,bevelEnabled:false}),white); ar.position.set(0,.6,H.d/2-.03); g.add(ar);
    for (let i=0;i<4;i++) mesh(g,new THREE.BoxGeometry(.05,2.0,.03),frame,-.45+i*.3,1.6,H.d/2+.14);
    mesh(g,new THREE.BoxGeometry(2.3,.14,1.0),new THREE.MeshStandardMaterial({color:0x3f6fd0,roughness:.6}),0,3.75,H.d/2+.42).rotation.x=.42;
    mesh(g,new THREE.BoxGeometry(2.1,.22,1.1),white,0,.11,H.d/2+.75); mesh(g,new THREE.BoxGeometry(1.7,.22,.8),white,0,.33,H.d/2+.5);
    const ivy=new THREE.MeshStandardMaterial({color:0x3f8a2c,roughness:.8});
    for (const x0 of [-H.w*.47,H.w*.06]) for (let i=0;i<14;i++) mesh(g,new THREE.SphereGeometry(vlS(.12,.2),6,5),ivy,x0+Math.sin(i*.9)*.25+vlS(-.1,.1),.7+i*.3,H.d/2+.12);
    const bt=vlTex(vlCanvas(256,256,g2=>{ g2.fillStyle='#a9a69f'; g2.fillRect(0,0,256,256); for (let r=0;r<10;r++) for (let k=-1;k<5;k++){ const v=vlRnd(205,236)|0; g2.fillStyle=`rgb(${v},${v-3},${v-10})`; g2.fillRect(k*64+(r%2)*32+3,r*25.6+3,58,20); } }),true); bt.repeat.set(4,4);
    const tx=H.w/2-.2, tz=-.3, th=H.h+3.6;
    mesh(g,new THREE.CylinderGeometry(1.9,2.0,th,24),new THREE.MeshStandardMaterial({map:bt,roughness:.95}),tx,.6+th/2,tz);
    const ct=scallop('#3f6fd8','#24438a'); ct.repeat.set(5,2); mesh(g,new THREE.ConeGeometry(2.45,3.4,24),new THREE.MeshStandardMaterial({map:ct,roughness:.55}),tx,.6+th+1.7,tz);
    mesh(g,new THREE.SphereGeometry(.16,8,6),new THREE.MeshStandardMaterial({color:0xd8b25a,metalness:.6,roughness:.3}),tx,.6+th+3.5,tz);
    for (const [y,a] of [[2.0,.35],[4.6,.1],[th-.9,-.25]]) archWin(g,tx+Math.sin(a)*2.0,.6+y-.6,tz+Math.cos(a)*2.0,a,.75,1.15,y<3);
    mesh(g,new THREE.BoxGeometry(.8,2.2,.8),new THREE.MeshStandardMaterial({color:0xb04a2a,roughness:.9}),-H.w*.32,top+2.6,-H.d*.2); };
  vlSeed=5; VL_HOUSES.forEach(H=>H.cozy?cozyHouse(H):plainHouse(H));

  /* 던전 입구: 돌 아치 + 보랏빛 소용돌이 */
  { const g=new THREE.Group(); g.position.set(VL_PORTAL.x,0,VL_PORTAL.z); g.rotation.y=VL_PORTAL.r; add(g);
    const dark=new THREE.MeshStandardMaterial({color:0x6f6a64,roughness:1});
    for (const s of [-1,1]){ mesh(g,new THREE.BoxGeometry(1.1,4.2,1.1),dark,s*2.0,2.1,0); mesh(g,new THREE.BoxGeometry(1.4,.4,1.4),dark,s*2.0,.2,0); }
    const ah=new THREE.Mesh(new THREE.TorusGeometry(2.0,.55,8,20,Math.PI),dark); ah.position.set(0,4.2,0); ah.castShadow=true; g.add(ah);
    for (let i=0;i<9;i++) mesh(g,new THREE.DodecahedronGeometry(vlS(.5,1.1),0),dark,vlS(-3.4,3.4),vlS(.2,.6),vlS(-2.6,-.8));
    const pt=vlTex(vlCanvas(256,256,g2=>{ const gr=g2.createRadialGradient(128,128,10,128,128,128); gr.addColorStop(0,'#fff0ff'); gr.addColorStop(.35,'#b36bff'); gr.addColorStop(.8,'#4a1a8a'); gr.addColorStop(1,'rgba(40,10,80,0)'); g2.fillStyle=gr; g2.fillRect(0,0,256,256);
      g2.strokeStyle='rgba(255,255,255,.35)'; g2.lineWidth=5; for (let i=0;i<5;i++){ g2.beginPath(); for (let t=0;t<6;t+=.1){ const r=t*18, a=t*1.6+i*1.26; g2.lineTo(128+Math.cos(a)*r,128+Math.sin(a)*r); } g2.stroke(); } }));
    const pm=new THREE.Mesh(new THREE.CircleGeometry(1.75,40),new THREE.MeshBasicMaterial({map:pt,transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide})); pm.position.set(0,2.6,0); pm.scale.y=1.35; g.add(pm); VL.portal=pm;
    const tl=new THREE.PointLight(0xb36bff,1.2,9); tl.position.set(0,2.6,1); g.add(tl);
    VL_COLL.push({x:VL_PORTAL.x+Math.cos(VL_PORTAL.r)*2,z:VL_PORTAL.z-Math.sin(VL_PORTAL.r)*2,r:.8},{x:VL_PORTAL.x-Math.cos(VL_PORTAL.r)*2,z:VL_PORTAL.z+Math.sin(VL_PORTAL.r)*2,r:.8},{x:VL_PORTAL.x,z:VL_PORTAL.z,r:1.1}); }

  /* 울타리 · 돌기둥 문 · 디딤돌 · 꽃 · 돌 · 소품 */
  const fp=[];
  const fence=(ax,az,bx,bz,ga,gb)=>{ const L=Math.hypot(bx-ax,bz-az), n=Math.floor(L/.32), ang=Math.atan2(bz-az,bx-ax);
    for (let i=0;i<=n;i++){ const t=i/n, d=t*L; if (ga!=null&&d>ga&&d<gb) continue; fp.push({x:ax+(bx-ax)*t,y:.5,z:az+(bz-az)*t,sx:.1,sy:i%6===0?1.25:vlS(.9,1.05),sz:.05,ry:-ang,post:i%6===0}); }
    const seg=(d0,d1)=>{ if (d1-d0<=.1) return; const t=(d0+d1)/2/L; for (const y of [.35,.78]) fp.push({x:ax+(bx-ax)*t,y,z:az+(bz-az)*t,sx:d1-d0,sy:.07,sz:.06,ry:-ang,rail:true}); };
    if (ga!=null){ seg(0,ga); seg(gb,L); } else seg(0,L);
    for (let t=0;t<=1;t+=.5/L) if (ga==null||t*L<ga||t*L>gb) VL_COLL.push({x:ax+(bx-ax)*t,z:az+(bz-az)*t,r:.25}); };
  fence(-2,-12.4,4.8,-12.4); fence(8.6,-12.4,17,-12.4); fence(-2,-12.4,-2,-26); fence(17,-12.4,17,-26);
  fence(-14,40,8,40); fence(-6,10.5,-26,24,6,9);
  { const m=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),wood,fp.length), M=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler();
    fp.forEach((f,i)=>{ e.set(0,f.ry,0); q.setFromEuler(e); M.compose(new THREE.Vector3(f.x,f.rail?f.y:f.sy/2,f.z),q,new THREE.Vector3(f.sx,f.sy,f.sz)); m.setMatrixAt(i,M); m.setColorAt(i,VL_LIN(f.post?'#5e402a':f.rail?'#7a5638':['#8a6442','#7d5a3b','#93704c'][i%3])); });
    m.castShadow=m.receiveShadow=true; add(m); }
  for (const x of [5,8.4]){ mesh(R,new THREE.BoxGeometry(.75,1.7,.75),white,x,.85,-12.4); mesh(R,new THREE.BoxGeometry(.95,.18,.95),white,x,1.78,-12.4); mesh(R,new THREE.SphereGeometry(.26,14,10),white,x,2.1,-12.4); VL_COLL.push({x,z:-12.4,r:.55}); }
  mesh(R,new THREE.BoxGeometry(1.4,1.1,.08),wood,5.75,.65,-11.8).rotation.y=-1.1;
  if (VL.natOK) vlNatureGround(); else { const nn=26, m=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0xd3cec4,roughness:1}),nn*2), M=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(); let k=0;
    for (let i=0;i<nn;i++){ const p=VL_SIDEC.getPoint(i/(nn-1)); for (let j=0;j<2;j++){ if (j&&vlR()<.4) continue; e.set(0,vlS(0,3),0); q.setFromEuler(e);
      M.compose(new THREE.Vector3(p.x+vlS(-.45,.45),.05,p.y+vlS(-.3,.3)),q,new THREE.Vector3(vlS(.55,.8),.12,vlS(.4,.6))); m.setMatrixAt(k,M); m.setColorAt(k,VL_LIN(['#d6d1c6','#c8c2b6','#e0dbd0'][k%3])); k++; } }
    m.count=k; m.receiveShadow=m.castShadow=true; add(m); }
  const flowers=(kind,cnt,area)=>{ const g=kind==='lav'?new THREE.ConeGeometry(.05,.42,5):new THREE.CylinderGeometry(.075,.075,.02,8);
    const m=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({roughness:.8,emissive:kind==='daisy'?0x222222:0}),cnt), M=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(); let k=0, tries=0;
    while (k<cnt&&tries<cnt*40){ tries++; const [x,z]=area(); if (vlPolyD(VL_PATHP,x,z)<VL_PATH_W+.3||vlPolyD(VL_SIDEP,x,z)<1.1||vlInHouse(x,z,.4)) continue;
      const h=kind==='lav'?vlS(.55,.85):kind==='daisy'?vlS(.35,.6):vlS(.4,.62); e.set(vlS(-.25,.25),0,vlS(-.25,.25)); q.setFromEuler(e); M.compose(new THREE.Vector3(x,h,z),q,new THREE.Vector3(1,1,1)); m.setMatrixAt(k,M);
      m.setColorAt(k,VL_LIN(kind==='lav'?['#8a6fd1','#9b7fe0','#7a5fc0'][k%3]:kind==='daisy'?'#ffffff':['#f5c934','#f8d64e','#eeb92a'][k%3])); k++; }
    m.count=k; add(m); };
  const cl=(cs,sp)=>()=>{ const c=cs[(Math.random()*cs.length)|0], a=Math.random()*7, r=Math.sqrt(Math.random())*sp; return [c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r]; };
  if (VL.natOK){ flowers('lav',350,cl([[-9,2],[2,-10],[12,-10],[-18,-2],[18,8],[-4,12],[-28,12],[8,-14]],2.6)); flowers('daisy',500,cl([[0,9],[6,9],[-3,4],[10,-2],[-12,10],[14,-6],[-6,-10],[22,4],[-16,20]],3.4)); } else {
  flowers('lav',900,cl([[-9,2],[2,-10],[12,-10],[-18,-2],[18,8],[-4,12],[-28,12],[8,-14]],3.2));
  flowers('daisy',1100,cl([[0,9],[6,9],[-3,4],[10,-2],[-12,10],[14,-6],[-6,-10],[22,4],[-16,20]],4));
  flowers('yel',1300,cl([[-6,-4],[3,-11],[11,-15],[-1,-15],[16,-8],[-20,4],[-12,16],[6,16]],3.5)); }
  if (!VL.natOK) for (let i=0;i<18;i++){ const a=vlS(0,7), r=vlS(6,50), x=Math.cos(a)*r, z=Math.sin(a)*r; if (vlPolyD(VL_PATHP,x,z)<VL_PATH_W+.8||vlInHouse(x,z,1)) continue;
    const s=vlS(.4,1.1), m=mesh(R,new THREE.DodecahedronGeometry(s,0),stone,x,s*.35,z); m.scale.y=.6; m.rotation.set(vlS(0,3),vlS(0,3),0); }
  // 소품
  const lamp=VL.lampMat=new THREE.MeshStandardMaterial({color:0xfff0c0,emissive:0xffc060,emissiveIntensity:1.6,roughness:.5});
  const pot=new THREE.MeshStandardMaterial({color:0xc8743f,roughness:.9}), leafG=new THREE.MeshStandardMaterial({color:0x4f9a34,roughness:.8});
  const well=(x,z)=>{ const g=new THREE.Group(); g.position.set(x,0,z); add(g); mesh(g,new THREE.CylinderGeometry(1.25,1.35,1.0,16,1,true),white,0,.5,0).material=white;
    mesh(g,new THREE.TorusGeometry(1.25,.16,8,20),white,0,1.0,0).rotation.x=Math.PI/2; mesh(g,new THREE.CircleGeometry(1.15,16),new THREE.MeshStandardMaterial({color:0x3a6a9a,roughness:.2}),0,.6,0).rotation.x=-Math.PI/2;
    for (const s of [-1,1]) mesh(g,new THREE.BoxGeometry(.18,2.4,.18),wood,s*1.15,1.2,0);
    for (const s of [-1,1]) mesh(g,new THREE.BoxGeometry(3,.12,1.6),new THREE.MeshStandardMaterial({color:0x3f6fd0,roughness:.6}),0,2.75,s*.62).rotation.x=s*.6;
    VL_COLL.push({x,z,r:1.4}); };
  const barrel=(x,z)=>{ mesh(R,new THREE.CylinderGeometry(.45,.45,.95,14),new THREE.MeshStandardMaterial({color:0x8a6a48,roughness:.9}),x,.48,z); for (const y of [.2,.78]) mesh(R,new THREE.TorusGeometry(.46,.03,6,18),frame,x,y,z).rotation.x=Math.PI/2; VL_COLL.push({x,z,r:.5}); };
  const potF=(x,z,col)=>{ mesh(R,new THREE.CylinderGeometry(.32,.24,.5,12),pot,x,.25,z); mesh(R,new THREE.SphereGeometry(.22,8,6),leafG,x,.48,z);
    for (let i=0;i<5;i++) mesh(R,new THREE.SphereGeometry(.13,8,6),new THREE.MeshStandardMaterial({color:new THREE.Color(col||['#ff6b8a','#ffd84a','#ffffff','#b07cff'][i%4])}),x+vlS(-.15,.15),.58+vlS(0,.12),z+vlS(-.15,.15)); };
  const lampPost=(x,z,ry)=>{ const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; add(g);
    mesh(g,new THREE.BoxGeometry(.2,3.4,.2),wood,0,1.7,0); mesh(g,new THREE.BoxGeometry(1.0,.14,.14),wood,.42,3.25,0);
    mesh(g,new THREE.BoxGeometry(.42,.55,.42),frame,.82,2.85,0); mesh(g,new THREE.BoxGeometry(.32,.42,.44),lamp,.82,2.85,0); mesh(g,new THREE.BoxGeometry(.5,.08,.5),frame,.82,3.15,0);
    mesh(g,new THREE.BoxGeometry(.5,.3,.5),white,0,.15,0); VL_COLL.push({x,z,r:.3}); };
  well(-1.5,-17.5); barrel(13.6,-15.2); barrel(14.4,-16.1); barrel(-.8,-14.2);
  potF(3.6,-15.6); potF(10.6,-15.8,'#ff6b8a'); potF(1.2,-13.4,'#ffd84a'); potF(12.2,-13.3);
  mesh(R,new THREE.BoxGeometry(.12,1.1,.12),wood,9.6,.55,-11.6); mesh(R,new THREE.BoxGeometry(.45,.38,.6),new THREE.MeshStandardMaterial({color:0xd8402a,roughness:.6}),9.6,1.25,-11.6);
  lampPost(9.5,-11.2,0); lampPost(2.2,4.2,Math.PI); lampPost(-14,10.6,.3); lampPost(16,-1.6,2.6); lampPost(-30,17.3,.4); lampPost(27,-15,-.6);
  barrel(VL_DOORS[1].x+2.4,VL_DOORS[1].z-.6); potF(VL_DOORS[1].x-2.2,VL_DOORS[1].z-.2);

  /* 장소 이름표 · 발판 */
  VL.pads=[];
  VL_DOORS.forEach(d=>{
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:vlTex(vlCanvas(512,128,g=>{ g.fillStyle='rgba(58,34,48,.82)'; roundRect(g,8,8,496,112,56); g.fill(); g.fillStyle='#ffe3a8'; g.font='bold 62px Jua, "Malgun Gothic", sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(d.sign,256,68); })),transparent:true,depthWrite:false,fog:false}));
    sp.scale.set(3.2,.8,1); sp.position.set(d.x,d.id==='dungeon'?5.9:3.4,d.z); add(sp); d.label=sp;
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.0,1.25,40),new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.75,depthWrite:false,toneMapped:false})); ring.rotation.x=-Math.PI/2; ring.position.set(d.x,.06,d.z); add(ring); VL.pads.push(ring);
  });
  VL.built=true;
}
MAP_BUILD.village=()=>buildVillage();
GRASS_OK.village=null;

/* ---------- 들어가기 · 나가기 ---------- */
function villageJoin(){ if (!assetsReady||W.state==='play'||VL.loading) return;
  if (!VL.natDone){ const b=$('#vilBtn'), t=b&&b.innerHTML; VL.loading=true; if (b){ b.disabled=true; b.innerHTML='🏡 마을 불러오는 중…'; }
    vlLoadNature().then(()=>{ VL.loading=false; if (b){ b.innerHTML=t; b.disabled=false; } if (W.state!=='play'&&!$('#title').hidden) villageJoin(); }); return; }
  VL.joining=true; startGame(); VL.joining=false; }

/* ---------- 자연 에셋 (Quaternius · Stylized Nature MegaKit, CC0) ---------- */
const VL_NAT=['CommonTree_1','CommonTree_2','CommonTree_3','CommonTree_4','CommonTree_5','TwistedTree_1','TwistedTree_3','Pine_1','Pine_2','Pine_4',
  'Bush_Common','Bush_Common_Flowers','Grass_Common_Short','Grass_Common_Tall','Grass_Wispy_Short','Grass_Wispy_Tall','Flower_3_Group','Flower_4_Group',
  'Fern_1','Plant_1_Big','Clover_2','Rock_Medium_1','Rock_Medium_2','Rock_Medium_3','Pebble_Round_1','Pebble_Round_2','Pebble_Round_3','Mushroom_Common',
  'RockPath_Round_Small_1','RockPath_Round_Small_2','RockPath_Round_Small_3'];
VL.nat={};
function vlLoadNature(){
  if (VL.natP) return VL.natP;
  const L=new THREE.GLTFLoader(), TL=new THREE.TextureLoader(), white={};
  const whiteTex=n=>{ if (!white[n]){ const t=TL.load('env/nature/tex/'+n+'.png'); t.encoding=THREE.sRGBEncoding; t.flipY=false; t.anisotropy=4; white[n]=t; } return white[n]; };
  const one=n=>new Promise(res=>L.load('env/nature/'+n+'.gltf',g=>{ g.scene.updateMatrixWorld(true); const parts=[];
    g.scene.traverse(o=>{ if (!o.isMesh) return; const m=o.material, leaf=/Leaves|Leaf_Pine|Grass|Flowers/.test(m.name);
      if (m.map) m.map.anisotropy=4;
      if (leaf){ m.alphaTest=.45; m.side=THREE.DoubleSide; m.transparent=false;
        if (m.name==='Leaves_NormalTree') m.map=whiteTex('Leaves_NormalTree'); if (m.name==='Leaves_TwistedTree') m.map=whiteTex('Leaves_TwistedTree');
        m.onBeforeCompile=sh=>{ sh.uniforms.uTime=VL.U?VL.U.uTime:{value:0}; sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',
          '#include <begin_vertex>\n#ifdef USE_INSTANCING\n float ph=instanceMatrix[3].x*.37+instanceMatrix[3].z*.29;\n#else\n float ph=0.;\n#endif\n float hh=max(position.y,0.); transformed.x+=sin(uTime*1.5+ph)*.035*hh; transformed.z+=cos(uTime*1.2+ph*1.3)*.035*hh;'); };
        m.customProgramCacheKey=()=>'vlwind'+m.name; }
      m.roughness=.9; m.metalness=0; if (m.name==='PathRocks') m.color.setRGB(1.45,1.4,1.32); if (m.name==='Rocks') m.color.setRGB(1.2,1.15,1.08);
      parts.push({geo:o.geometry,mat:m,m:o.matrixWorld.clone(),leaf,tint:m.name==='Leaves_NormalTree'||m.name==='Leaves_TwistedTree'}); });
    VL.nat[n]=parts; res(); },undefined,()=>res()));
  VL.natP=Promise.all(VL_NAT.map(one)).then(()=>{ VL.natOK=Object.keys(VL.nat).length>=VL_NAT.length-3; VL.natDone=true; });
  return VL.natP;
}
/* 모델 하나를 여러 곳에 (InstancedMesh). P: [{x,y,z,ry,s,c}] · c는 잎 색 */
function vlInst(name,P,opt){
  const parts=VL.nat[name]; if (!parts||!P.length) return;
  const M=new THREE.Matrix4(), T=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), S=new THREE.Vector3(), V=new THREE.Vector3();
  parts.forEach(pt=>{ const im=new THREE.InstancedMesh(pt.geo,pt.mat,P.length);
    P.forEach((p,i)=>{ e.set(0,p.ry||0,0); q.setFromEuler(e); S.setScalar(p.s||1); T.compose(V.set(p.x,p.y||0,p.z),q,S); M.multiplyMatrices(T,pt.m); im.setMatrixAt(i,M);
      if (pt.tint) im.setColorAt(i,p.c||new THREE.Color(1,1,1)); });
    const sh=!opt||opt.shadow!==false; im.castShadow=sh; im.receiveShadow=true; im.frustumCulled=false;
    if (pt.leaf&&sh) im.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:pt.mat.map,alphaTest:.45,side:THREE.DoubleSide});
    if (opt&&opt.lod){ (VL.lod=VL.lod||[]).push({im,n:P.length}); }
    scene.add(im); });
}
const VL_TINT={au:['#e8572a','#f07a2c','#f39a34','#d9432a','#ee6a2a'],rd:['#e4502e','#d8432a','#ee6234'],yl:['#f2b13c','#f6c94e','#eba232'],gr:['#7cae46','#8fbd4f','#6a9e3c']};
const vlTint=k=>VL_LIN(VL_TINT[k][(vlR()*VL_TINT[k].length)|0]).multiplyScalar(vlS(.9,1.08));
function vlFree(x,z,pad){ if (vlPolyD(VL_PATHP,x,z)<VL_PATH_W+pad||vlPolyD(VL_SIDEP,x,z)<1+pad*.6||vlInHouse(x,z,pad)) return false; for (const d of VL_DOORS) if (Math.hypot(x-d.x,z-d.z)<2.4) return false; return Math.hypot(x-VL_PORTAL.x,z-VL_PORTAL.z)>4.5; }
function vlNatureTrees(){
  vlSeed=3; const by={};
  const put=(n,p)=>(by[n]=by[n]||[]).push(p);
  VL_TREES.forEach(([x,z,s,kind],i)=>{ const big=(i===1||i===6); put(big?'TwistedTree_'+(i===1?1:3):'CommonTree_'+(1+i%5),{x,z,ry:vlS(0,6.3),s:big?s*.62:s*1.05,c:vlTint(kind)}); });
  VL_BUSHES.forEach(([x,z,kind])=>{ const s=vlS(1.0,1.45); put(kind==='gr'&&vlR()<.6?'Bush_Common_Flowers':'Bush_Common',{x,z,ry:vlS(0,6.3),s,c:vlTint(kind)}); VL_COLL.push({x,z,r:1.0*s}); });
  for (let i=0;i<80;i++){ const a=i/80*Math.PI*2+vlS(-.04,.04), r=vlS(66,90); put('Ring_'+(1+(vlR()*5|0)),{x:Math.cos(a)*r,z:Math.sin(a)*r,ry:vlS(0,6.3),s:vlS(1.2,1.9),c:vlTint(['au','yl','au','rd','gr'][(vlR()*5)|0])}); }
  vlSeed=31; for (let i=0;i<30;i++){ const a=vlS(0,6.3), r=vlS(38,64), x=Math.cos(a)*r, z=Math.sin(a)*r, s=vlS(1,1.5); if (!vlFree(x,z,2)||Math.hypot(x-VL_PORTAL.x,z-VL_PORTAL.z)<9) continue; put('Pine_'+[1,2,4][i%3],{x,z,ry:vlS(0,6.3),s}); VL_COLL.push({x,z,r:.5*s}); }
  [[-16,-30,1.3],[-30,-26,1.5],[-36,-20,1.2]].forEach(([x,z,s],i)=>{ put('Pine_'+[1,2,4][i],{x,z,ry:vlS(0,6.3),s}); VL_COLL.push({x,z,r:.5*s}); });
  for (const n in by){ const ring=n.startsWith('Ring_'); vlInst(ring?'CommonTree_'+n.slice(5):n,by[n],{shadow:!ring}); }
}
function vlNatureGround(){
  vlSeed=51; const by={}, put=(n,p)=>(by[n]=by[n]||[]).push(p);
  // 집으로 가는 디딤돌
  for (let i=0;i<22;i++){ const p=VL_SIDEC.getPoint(i/21); put('RockPath_Round_Small_'+(1+i%3),{x:p.x+vlS(-.25,.25),y:.02,z:p.y+vlS(-.2,.2),ry:vlS(0,6.3),s:vlS(.85,1.1)}); }
  // 풀 뭉치 · 꽃 · 고사리 · 클로버 · 버섯 · 바위 · 자갈
  const scatter=(n,cnt,R,pad,sMin,sMax,clump)=>{ let k=0, t=0; while (k<cnt&&t<cnt*30){ t++; let x,z;
      if (clump){ const c=clump[(vlR()*clump.length)|0], a=vlS(0,6.3), r=Math.sqrt(vlR())*c[2]; x=c[0]+Math.cos(a)*r; z=c[1]+Math.sin(a)*r; } else { const a=vlS(0,6.3), r=Math.sqrt(vlR())*R; x=Math.cos(a)*r; z=Math.sin(a)*r; }
      if (!vlFree(x,z,pad)) continue; let bad=false; for (const c of VL_COLL) if (Math.hypot(x-c.x,z-c.z)<c.r*.7){ bad=true; break; } if (bad) continue;
      put(n,{x,z,ry:vlS(0,6.3),s:vlS(sMin,sMax)}); k++; } };
  const edge=[]; VL_PATHP.forEach((p,i)=>{ if (i%3) return; edge.push([p.x,p.y,4.2]); });
  scatter('Grass_Wispy_Tall',500,56,.3,.3,.5); scatter('Grass_Wispy_Short',600,56,.2,.3,.5); scatter('Grass_Common_Tall',400,56,.3,.26,.42); scatter('Grass_Common_Short',400,30,.7,.3,.45,edge);
  const trees=VL_TREES.map(t=>[t[0],t[1],4.5]);
  scatter('Fern_1',40,0,.5,.1,.15,trees); scatter('Plant_1_Big',35,0,.5,.22,.32,trees); scatter('Mushroom_Common',40,0,.4,.6,.95,trees); scatter('Clover_2',90,50,.3,.35,.5);
  scatter('Flower_3_Group',110,0,.3,.28,.4,[[0,9,4],[6,9,3],[-3,4,3],[10,-2,3],[-12,10,3],[14,-6,3],[22,4,3],[-16,20,3]]);
  scatter('Flower_4_Group',110,0,.3,.26,.38,[[-6,-4,3],[3,-11,2.5],[11,-15,2.5],[16,-8,3],[-20,4,3],[-12,16,3],[6,16,3],[-9,2,3]]);
  for (let i=0;i<16;i++){ const a=vlS(0,7), r=vlS(8,52), x=Math.cos(a)*r, z=Math.sin(a)*r; if (!vlFree(x,z,1)) continue; const s=vlS(.35,.8); put('Rock_Medium_'+(1+i%3),{x,z,ry:vlS(0,6.3),s}); VL_COLL.push({x,z,r:1.3*s}); }
  for (let i=0;i<130;i++){ const p=VL_PATHP[(vlR()*VL_PATHP.length)|0], a=vlS(0,6.3), r=VL_PATH_W+vlS(-.1,.7); put('Pebble_Round_'+(1+i%3),{x:p.x+Math.cos(a)*r,y:.01,z:p.y+Math.sin(a)*r,ry:vlS(0,6.3),s:vlS(.5,1.1)}); }
  const noShadow=n=>/Grass|Clover|Pebble|Flower|Fern|Plant|Mushroom|RockPath/.test(n);
  for (const n in by) vlInst(n,by[n],{shadow:!noShadow(n),lod:/Grass|Clover|Flower/.test(n)});
}
function villageReset(){
  document.body.classList.remove('village'); ['#vlHud','#vlPrompt','#vlCall','#vlMini','#vlClock'].forEach(s=>{ const e=$(s); if (e) e.hidden=true; });
  if (MAPK!=='village'){ if (VL.on) vlRestore(); VL.on=false; return; }
  VL.on=true; VL.yaw=0; VL.pitch=.2; VL.dist=6.5; VL.door=null; VL.run=false; VL.camAt=null;
  P.x=5.6; P.z=8.2; P.fx=0; P.fz=-1; W.nextWaveAt=-1; W.nextQuiz=1e9; W.snapCam=true;
  // 캐릭터 키를 마을 크기(약 1.75)에 맞춰요
  pg.scale.setScalar(1); if (knight){ const b=new THREE.Box3().setFromObject(knight.root), h=b.max.y-b.min.y; VL.ks=h>.3?1.75/h:1; } pg.scale.setScalar(VL.ks);
  camera.fov=55; camera.updateProjectionMatrix();
  vlSetSky(false); if (VL.rays) VL.rays.enabled=QCUR!=='low';
  const C=QUALITY[QCUR]||QUALITY.medium; if (VL.grass) VL.grass.geometry.instanceCount=Math.floor(VL.grass.geometry.userData.max*Math.max(.25,C.grass));
  (VL.lod||[]).forEach(L=>{ L.im.count=Math.floor(L.n*(QCUR==='high'?1:QCUR==='medium'?.6:.2)); });
  document.body.classList.add('village'); $('#vlHud').hidden=false; $('#vlMini').hidden=false; $('#vlClock').hidden=false;
  VL.t0=performance.now();
  setTimeout(()=>{ if (MAPK==='village'&&W.state==='play') showBanner('🏡 노을 마을에 왔어요'); },300);
}
function vlRestore(){ pg.scale.setScalar(1); camera.fov=42; camera.updateProjectionMatrix(); vlSetSky(true); if (VL.rays) VL.rays.enabled=false; }
function vlSetSky(on){ scene.children.forEach(o=>{ if (o.material===SKY) o.visible=on; }); try{ clouds.forEach(c=>c.visible=on); }catch(e){} }
function villageEndUI(){ document.body.classList.remove('village'); ['#vlHud','#vlPrompt','#vlCall','#vlMini','#vlClock'].forEach(s=>{ const e=$(s); if (e) e.hidden=true; }); vlRestore(); }
function villageLeave(after){
  VL.on=false; villageEndUI(); W.state='end'; W.paused=true;
  try{ $('#homeBtn').click(); }catch(e){}
  try{ applyMood(pickMood()); }catch(e){}
  if (after) setTimeout(after,60);
}
function vlGameOpen(){ if (isAdmin||!fbDb||GATE_OK===false) return true; const g=typeof activeGate==='function'?activeGate():null; return !!g&&playsLeft(g)>0; }
function vlModeName(){ const c=LAST_PLAYC; return c&&c.mode?`${c.mode.icon||''} ${c.mode.name||''}`.trim():'게임'; }
function vlDoorText(d){
  if (d.id==='home') return ['🏠 내 집','집 꾸미기는 다음 단계에서 열려요'];
  if (d.id==='shop') return ['🛒 상점','옷 · 모자 · 무기 · 펫 사러 들어가기'];
  return vlGameOpen()?['⚔️ 던전 입구',`지금 열린 게임: ${vlModeName()} · 들어가기`]:['⚔️ 던전 입구','선생님이 게임을 열면 들어갈 수 있어요'];
}
function vlEnterDoor(){
  const d=VL.door; if (!d) return;
  if (d.id==='home'){ vlToast('🏠 집 꾸미기는 곧 열려요! 조금만 기다려 주세요'); return; }
  if (d.id==='shop'){ VL.backShop=true; villageLeave(()=>openShop()); return; }
  if (!vlGameOpen()){ vlToast('아직 열린 게임이 없어요. 선생님이 게임을 열면 들어갈 수 있어요'); return; }
  villageLeave(()=>tryStart());
}
function vlToast(t){ const e=$('#vlToast'); if (!e) return; e.textContent=t; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }

/* ---------- 매 프레임 ---------- */
const _vlV=new THREE.Vector3(), _vlV2=new THREE.Vector3();
function villageFrame(dt,real,now){
  if (knight && (knight.anim.dead||endPose)){ knight.anim.revive(); endPose=false; }
  if (!W.paused) W.t+=dt;
  lobbyTick(real,dt);
  let moving=false;
  if (!W.paused){
    const am=arrowsMove();
    let ix=(keys.KeyD||am&&keys.ArrowRight?1:0)-(keys.KeyA||am&&keys.ArrowLeft?1:0)+joy.x, iz=(keys.KeyS||am&&keys.ArrowDown?1:0)-(keys.KeyW||am&&keys.ArrowUp?1:0)+joy.y;
    const L=Math.hypot(ix,iz);
    if (L>.12){ if (L>1){ ix/=L; iz/=L; } const c=Math.cos(VL.yaw), s=Math.sin(VL.yaw), dx=ix*c+iz*s, dz=-ix*s+iz*c, sp=VL.run?7.5:4.6;
      P.x+=dx*sp*dt; P.z+=dz*sp*dt; P.fx=dx; P.fz=dz; moving=true; }
    for (const c of VL_COLL){ const dx=P.x-c.x, dz=P.z-c.z, d=Math.hypot(dx,dz), r=c.r+.35; if (d<r&&d>1e-4){ P.x=c.x+dx/d*r; P.z=c.z+dz/d*r; } }
    for (const H of VL_HOUSES){ const c=Math.cos(H.r), s=Math.sin(H.r); let lx=(P.x-H.x)*c-(P.z-H.z)*s, lz=(P.x-H.x)*s+(P.z-H.z)*c; const hw=H.w/2+.5+(H.cozy&&lx>0?1.5:0), hd=H.d/2+.5;
      if (Math.abs(lx)<hw&&Math.abs(lz)<hd){ if (hw-Math.abs(lx)<hd-Math.abs(lz)) lx=Math.sign(lx)*hw; else lz=Math.sign(lz)*hd; P.x=H.x+lx*Math.cos(H.r)+lz*Math.sin(H.r); P.z=H.z-lx*Math.sin(H.r)+lz*Math.cos(H.r); } }
    const RR=Math.hypot(P.x,P.z); if (RR>60){ P.x*=60/RR; P.z*=60/RR; }
  }
  pg.position.set(P.x,0,P.z);
  { let dy=Math.atan2(P.fx,P.fz)-pg.rotation.y; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); pg.rotation.y+=dy*Math.min(1,dt*12); }
  if (knight){ setBaseSynced(knight.anim,moving?'run':'idle',moving?(VL.run?1.25:.9):1); knight.mixer.update(W.paused?0:dt); }
  const U=VL.U; U.uTime.value=real; U.uPlayer.value.set(P.x,0,P.z); U.uCenter.value.set(P.x,P.z);
  U.uFog.value.copy(scene.fog.color); U.uFogN.value=scene.fog.near; U.uFogF.value=scene.fog.far; VL.skyU.uFog.value.copy(scene.fog.color);
  // 카메라: 캐릭터 뒤 · 마우스로 돌려요
  const ty=1.35, cp=_vlV.set(P.x+Math.sin(VL.yaw)*Math.cos(VL.pitch)*VL.dist, ty+Math.sin(VL.pitch)*VL.dist+.4, P.z+Math.cos(VL.yaw)*Math.cos(VL.pitch)*VL.dist);
  camera.position.lerp(cp,W.snapCam?1:Math.min(1,dt*8)); W.snapCam=false; camera.lookAt(P.x,ty,P.z);
  VL.sky.position.copy(camera.position);
  { const o=sun.userData.off||[-29,14,-62]; sun.position.set(P.x+o[0],o[1],P.z+o[2]); sun.target.position.set(P.x,0,P.z); sun.target.updateMatrixWorld(); }
  if (VL.portal) VL.portal.rotation.z=real*.8;
  VL.pads.forEach((r,i)=>{ r.scale.setScalar(1+.08*Math.sin(real*4+i)); });
  // 빛줄기
  if (VL.rays&&VL.rays.enabled){ const sp=_vlV2.copy(camera.position).addScaledVector(VL_SUN,200).project(camera), fr=camera.getWorldDirection(new THREE.Vector3()).dot(VL_SUN);
    VL.rays.uniforms.uSun.value.set((sp.x+1)/2,(sp.y+1)/2); VL.rays.uniforms.uStr.value=Math.max(0,Math.min(1,(fr-.1)*2.2)); VL.rays.uniforms.uAsp.value=camera.aspect; }
  // 장소 발판
  let near=null; for (const d of VL_DOORS) if (Math.hypot(P.x-d.x,P.z-d.z)<1.5) near=d;
  if (near!==VL.door){ VL.door=near; const pe=$('#vlPrompt'); pe.hidden=!near; if (near){ const [a,b]=vlDoorText(near); pe.innerHTML=`<b>${a}</b><span>${esc(b)}</span><button class="btn small" id="vlGo">${near.id==='home'?'둘러보기':'들어가기'} (E)</button>`; $('#vlGo').onclick=vlEnterDoor; } }
  // 선생님이 연 수업 활동 알림
  VL.callT-=dt; if (VL.callT<=0){ VL.callT=1; const k=typeof liveOpen==='function'&&liveOpen()?'live':typeof stgOpen==='function'&&stgOpen()?'stage':typeof twOpen==='function'&&twOpen()?'tw':'';
    const e=$('#vlCall'); e.hidden=!k; if (k&&e.dataset.k!==k){ e.dataset.k=k; e.textContent=k==='live'?'🏫 선생님이 수업 모드를 열었어요 · 지금 가기':k==='stage'?'🟦 발판 서바이벌이 열렸어요 · 지금 가기':'⚔️ 조별 점령전이 열렸어요 · 지금 가기'; } if (!k) e.dataset.k=''; }
  fx.update(dt); updateDreamy(real); qualityTick(now);
  renderFrame(); vlMini(real);
}
/* 미니맵 · 시계 */
function vlMini(real){
  const cv=$('#vlMini'); if (!cv||!VL.miniSrc) return; const g=cv.getContext('2d'), R=80, span=46, N=VL.miniSrc.width, px=(P.x/VL_MAP+.5)*N, pz=(P.z/VL_MAP+.5)*N, sw=span/VL_MAP*N, S=160;
  g.clearRect(0,0,S,S); g.save(); g.beginPath(); g.arc(R,R,R-6,0,7); g.clip(); g.fillStyle='#7d8a3a'; g.fillRect(0,0,S,S);
  g.drawImage(VL.miniSrc,px-sw/2,pz-sw/2,sw,sw,0,0,S,S);
  const toM=(x,z)=>[R+(x-P.x)/span*S,R+(z-P.z)/span*S];
  VL_HOUSES.forEach(H=>{ const [x,y]=toM(H.x,H.z); g.save(); g.translate(x,y); g.rotate(-H.r); g.fillStyle=H.cozy?'#3f6fd8':H.shop?'#d9483a':'#a0624a'; const w=H.w/span*S, d=H.d/span*S; g.fillRect(-w/2,-d/2,w,d); g.restore(); });
  VL_TREES.forEach(T=>{ const [x,y]=toM(T[0],T[1]); g.fillStyle=T[3]==='gr'?'#4f8a34':'#d8662e'; g.beginPath(); g.arc(x,y,T[2]*4.5,0,7); g.fill(); });
  VL_DOORS.forEach(d=>{ const [x,y]=toM(d.x,d.z); g.font='14px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(d.sign.split(' ')[0],x,y); });
  g.restore();
  g.lineWidth=7; g.strokeStyle='#f6ecd8'; g.beginPath(); g.arc(R,R,R-4.5,0,7); g.stroke(); g.lineWidth=2; g.strokeStyle='#8a6a48'; g.beginPath(); g.arc(R,R,R-1.2,0,7); g.stroke();
  g.save(); g.translate(R,R); g.rotate(Math.atan2(P.fx,-P.fz)*-1+Math.PI); g.rotate(Math.PI); g.restore();
  g.save(); g.translate(R,R); g.rotate(Math.atan2(P.fx,P.fz)*-1+Math.PI); g.fillStyle='#ff4d6d'; g.strokeStyle='#fff'; g.lineWidth=2; g.beginPath(); g.moveTo(0,-9); g.lineTo(6.5,7); g.lineTo(0,3.5); g.lineTo(-6.5,7); g.closePath(); g.fill(); g.stroke(); g.restore();
  const m=Math.floor(17*60+40+(performance.now()-(VL.t0||0))/1000)%1440, h=Math.floor(m/60);
  const ce=$('#vlClock'); const txt=`${h<12?'오전':'오후'} ${((h+11)%12)+1}:${String(m%60).padStart(2,'0')}`; if (ce._t!==txt){ ce._t=txt; ce.innerHTML=`<b>🌇 노을 마을</b><br>${txt}`; }
}

/* ---------- 조작: 이동 키는 그대로 · 공격 키는 막고 · Shift 달리기 · E 들어가기 · 마우스 드래그 시점 ---------- */
addEventListener('keydown',e=>{ if (MAPK!=='village'||W.state!=='play') return; if (e.target.closest&&e.target.closest('input,textarea')) return;
  if (e.code==='ShiftLeft'||e.code==='ShiftRight') VL.run=true;
  if ((e.code==='KeyE'||e.code==='Enter')&&VL.door){ e.preventDefault(); e.stopImmediatePropagation(); vlEnterDoor(); return; }
  if (/^(Space|KeyE|KeyQ|KeyR|KeyF|ShiftLeft|ShiftRight|Digit\d|Enter)$/.test(e.code)){ e.preventDefault(); e.stopImmediatePropagation(); } },true);
addEventListener('keyup',e=>{ if (e.code==='ShiftLeft'||e.code==='ShiftRight') VL.run=false; },true);
addEventListener('blur',()=>{ VL.run=false; });
addEventListener('mousedown',e=>{ if (MAPK==='village'&&W.state==='play'&&e.target===renderer.domElement){ e.stopImmediatePropagation(); VL.drag={x:e.clientX,y:e.clientY}; } },true);
addEventListener('mousemove',e=>{ if (!VL.drag||MAPK!=='village') return; VL.yaw-=(e.clientX-VL.drag.x)*.006; VL.pitch=Math.max(.04,Math.min(.9,VL.pitch+(e.clientY-VL.drag.y)*.004)); VL.drag={x:e.clientX,y:e.clientY}; },true);
addEventListener('mouseup',()=>{ VL.drag=null; },true);
addEventListener('wheel',e=>{ if (MAPK==='village'&&W.state==='play') VL.dist=Math.max(3.2,Math.min(13,VL.dist+Math.sign(e.deltaY)*.7)); },{passive:true});
addEventListener('contextmenu',e=>{ if (MAPK==='village'&&W.state==='play'&&e.target===renderer.domElement) e.preventDefault(); });

/* 빛줄기 후처리 (마을에서만 켜요) */
try{ if (composer&&GRADE){ VL.rays=new THREE.ShaderPass({uniforms:{tDiffuse:{value:null},uSun:{value:new THREE.Vector2(.5,.5)},uStr:{value:0},uAsp:{value:1},uCol:{value:VL_LIN('#ffb46e')}},
  vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader:`uniform sampler2D tDiffuse; uniform vec2 uSun; uniform float uStr,uAsp; uniform vec3 uCol; varying vec2 vUv;
    void main(){ vec4 base=texture2D(tDiffuse,vUv); vec3 acc=vec3(0.);
      if (uStr>.001){ vec2 d=(vUv-uSun)*(.92/28.); vec2 uv=vUv; float il=1.;
        for (int i=0;i<28;i++){ uv-=d; vec3 s=texture2D(tDiffuse,uv).rgb; float b=max(0.,dot(s,vec3(.3,.5,.2))-.72); acc+=s*b*il; il*=.955; } acc*=uStr*.11; }
      gl_FragColor=vec4(base.rgb+acc*uCol,base.a); }`});
  VL.rays.enabled=false; composer.insertPass(VL.rays,composer.passes.indexOf(GRADE)); } }catch(e){ VL.rays=null; }

/* 로비 버튼 · 화면 요소 */
$('#vilBtn')&&$('#vilBtn').addEventListener('click',villageJoin);
$('#vlLeave')&&$('#vlLeave').addEventListener('click',()=>villageLeave());
$('#vlCall')&&$('#vlCall').addEventListener('click',()=>{ const k=$('#vlCall').dataset.k; villageLeave(()=>{ if (k==='live') liveJoin(); else if (k==='stage') stageJoin(); else if (k==='tw') twJoin(); }); });
$('#shopClose')&&$('#shopClose').addEventListener('click',()=>{ if (VL.backShop){ VL.backShop=false; setTimeout(villageJoin,60); } });
setInterval(()=>{ const b=$('#vilBtn'); if (b) b.disabled=!assetsReady; },1000);
