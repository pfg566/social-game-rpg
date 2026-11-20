/* 사회 게임 RPG · 🏡 노을 마을 그래픽 (땅 · 집 · 하늘 · 연못 · 소품 · 효과)
   04v-village.js가 마을을 지을 때 이 파일의 함수들을 써요. 텍스처는 모두 코드로 그려요(외부 그림 파일 없음).
   무거운 것은 화질(낮음 · 보통 · 높음)에 따라 줄어요. */

const VL_POND={x:-8.6,z:-.6,r:4.2};
const vlPondR=a=>VL_POND.r*(1+.1*Math.sin(3*a+.7)+.06*Math.sin(5*a+2.1)+.035*Math.sin(7*a+.3));
function vlInPond(x,z,pad){ const dx=x-VL_POND.x, dz=z-VL_POND.z; return Math.hypot(dx,dz)<vlPondR(Math.atan2(dz,dx))+(pad||0); }
const VL_AO=[];   // 바닥 접지 그늘 {x,z,r,k}
const VLT={};     // 한 번 만든 텍스처 · 재질

/* ---------- 텍스처 도우미 ---------- */
function vlWrapDraw(S,x,y,r,fn){ for (const ox of [0,-S,S]) for (const oy of [0,-S,S]){ const X=x+ox, Y=y+oy; if (X<-r||X>S+r||Y<-r||Y>S+r) continue; fn(X,Y); } }
function vlTileNoise(S,cells,oct){   // 이어 붙여도 티 안 나는 값 노이즈 (0~1)
  const out=new Float32Array(S*S); let amp=1, tot=0;
  for (let o=0;o<oct;o++){ const c=cells<<o, gr=new Float32Array(c*c); for (let i=0;i<gr.length;i++) gr[i]=Math.random();
    for (let y=0;y<S;y++){ const fy=y/S*c, iy=Math.floor(fy), ty=fy-iy, sy=ty*ty*(3-2*ty), r0=(iy%c)*c, r1=((iy+1)%c)*c;
      for (let x=0;x<S;x++){ const fx=x/S*c, ix=Math.floor(fx), tx=fx-ix, sx=tx*tx*(3-2*tx), x0=ix%c, x1=(ix+1)%c;
        out[y*S+x]+=amp*((gr[r0+x0]*(1-sx)+gr[r0+x1]*sx)*(1-sy)+(gr[r1+x0]*(1-sx)+gr[r1+x1]*sx)*sy); } }
    tot+=amp; amp*=.5; }
  let mn=1e9, mx=-1e9; for (let i=0;i<out.length;i++){ out[i]/=tot; if (out[i]<mn) mn=out[i]; if (out[i]>mx) mx=out[i]; }
  for (let i=0;i<out.length;i++) out[i]=(out[i]-mn)/(mx-mn||1);
  return out; }
function vlTexRep(cv,lin){ const t=new THREE.CanvasTexture(cv); if (!lin) t.encoding=THREE.sRGBEncoding; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t; }
function vlFromNoise(S,n,fn){ return vlCanvas(S,S,g=>{ const id=g.createImageData(S,S); for (let i=0;i<S*S;i++){ const c=fn(n[i],i); id.data[i*4]=c[0]; id.data[i*4+1]=c[1]; id.data[i*4+2]=c[2]; id.data[i*4+3]=255; } g.putImageData(id,0,0); }); }

function vlNoiseTex(){ if (VLT.noise) return VLT.noise; const S=256, n=vlTileNoise(S,4,4); return VLT.noise=vlTexRep(vlFromNoise(S,n,v=>[v*255,v*255,v*255]),true); }
function vlGrassDetail(){   // 풀밭 바닥 (약 3m 한 장)
  const S=512, n=vlTileNoise(S,6,3), cv=vlFromNoise(S,n,v=>[74+v*42,92+v*38,34+v*16]), g=cv.getContext('2d');
  const pal=['#6c8a33','#7c9b3b','#5d7a2b','#8fa646','#a7a64c','#c2b25a','#4f6a25','#b89a4a'];
  for (let i=0;i<7500;i++){ const x=Math.random()*S, y=Math.random()*S, a=Math.random()*6.283, l=3+Math.random()*8; g.strokeStyle=pal[(Math.random()*pal.length)|0]; g.globalAlpha=.5+Math.random()*.45; g.lineWidth=1+Math.random()*1.4;
    vlWrapDraw(S,x,y,12,(X,Y)=>{ g.beginPath(); g.moveTo(X,Y); g.lineTo(X+Math.cos(a)*l,Y+Math.sin(a)*l); g.stroke(); }); }
  g.globalAlpha=.5; for (let i=0;i<900;i++){ const x=Math.random()*S, y=Math.random()*S, r=.6+Math.random()*1.5; g.fillStyle=Math.random()<.5?'#3a3418':'#5a4a2a'; vlWrapDraw(S,x,y,3,(X,Y)=>{ g.beginPath(); g.arc(X,Y,r,0,7); g.fill(); }); }
  g.globalAlpha=.85; for (let i=0;i<140;i++){ const x=Math.random()*S, y=Math.random()*S; g.fillStyle=Math.random()<.7?'#7fa83e':'#94b84a'; vlWrapDraw(S,x,y,7,(X,Y)=>{ for (let k=0;k<3;k++){ const a=k*2.09+Math.random()*.3; g.beginPath(); g.arc(X+Math.cos(a)*2.3,Y+Math.sin(a)*2.3,2.1,0,7); g.fill(); } }); }
  g.globalAlpha=1; return vlTexRep(cv); }
function vlDirtDetail(){   // 흙길 (자갈 · 모래 · 갈라짐)
  const S=512, n=vlTileNoise(S,5,4), cv=vlFromNoise(S,n,v=>[146+v*64,120+v*56,88+v*42]), g=cv.getContext('2d');
  for (let i=0;i<6000;i++){ g.fillStyle=Math.random()<.5?'rgba(90,70,48,.45)':'rgba(230,210,176,.45)'; g.fillRect(Math.random()*S,Math.random()*S,1+Math.random()*1.6,1+Math.random()*1.6); }
  const cols=[[168,160,148],[150,140,126],[186,176,160],[128,120,108],[178,152,122],[200,192,176]];
  for (let i=0;i<300;i++){ const x=Math.random()*S, y=Math.random()*S, rx=1.8+Math.pow(Math.random(),2)*7, ry=rx*(.55+Math.random()*.4), a=Math.random()*3.14, c=cols[(Math.random()*cols.length)|0];
    vlWrapDraw(S,x,y,11,(X,Y)=>{ g.save(); g.translate(X,Y); g.rotate(a);
      g.fillStyle='rgba(60,45,30,.38)'; g.beginPath(); g.ellipse(1.3,1.6,rx,ry,0,0,7); g.fill();
      g.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`; g.beginPath(); g.ellipse(0,0,rx,ry,0,0,7); g.fill();
      g.fillStyle='rgba(255,250,235,.35)'; g.beginPath(); g.ellipse(-rx*.25,-ry*.3,rx*.55,ry*.42,0,0,7); g.fill(); g.restore(); }); }
  g.strokeStyle='rgba(92,70,48,.32)'; g.lineWidth=1.1;
  for (let i=0;i<20;i++){ let x=Math.random()*S, y=Math.random()*S; const pts=[[x,y]]; for (let k=0;k<6;k++){ x+=(Math.random()-.5)*28; y+=(Math.random()-.5)*28; pts.push([x,y]); }
    vlWrapDraw(S,pts[0][0],pts[0][1],90,(X,Y)=>{ const dx=X-pts[0][0], dy=Y-pts[0][1]; g.beginPath(); pts.forEach((p,j)=>j?g.lineTo(p[0]+dx,p[1]+dy):g.moveTo(p[0]+dx,p[1]+dy)); g.stroke(); }); }
  return vlTexRep(cv); }
function vlLitterTex(){   // 떨어진 낙엽 (투명 배경)
  const S=512, cv=vlCanvas(S,S,()=>{}), g=cv.getContext('2d'), pal=['#d9542a','#e8782e','#c9401f','#f0a03a','#b8642a','#e3b04a','#8a5a2a','#a83a1c'];
  for (let i=0;i<1000;i++){ const x=Math.random()*S, y=Math.random()*S, s=4+Math.random()*7, a=Math.random()*6.283, col=pal[(Math.random()*pal.length)|0];
    vlWrapDraw(S,x,y,14,(X,Y)=>{ g.save(); g.translate(X,Y); g.rotate(a);
      g.fillStyle='rgba(40,25,10,.28)'; g.beginPath(); g.ellipse(1,1.3,s*.55,s,0,0,7); g.fill();
      g.fillStyle=col; g.beginPath(); g.moveTo(0,-s); g.quadraticCurveTo(s*.85,-s*.1,0,s); g.quadraticCurveTo(-s*.85,-s*.1,0,-s); g.fill();
      g.strokeStyle='rgba(80,40,15,.45)'; g.lineWidth=.8; g.beginPath(); g.moveTo(0,-s*.8); g.lineTo(0,s*.9); g.stroke(); g.restore(); }); }
  return vlTexRep(cv); }
function vlPlasterTex(base){   // 회벽 (약 2.4m 한 장)
  const S=512, n=vlTileNoise(S,8,4), b=base||[226,212,186], cv=vlFromNoise(S,n,v=>[b[0]+v*24-8,b[1]+v*24-8,b[2]+v*22-8]), g=cv.getContext('2d');
  for (let i=0;i<45;i++){ const x=Math.random()*S, y=Math.random()*S, r=10+Math.random()*44; vlWrapDraw(S,x,y,r,(X,Y)=>{ const gr=g.createRadialGradient(X,Y,0,X,Y,r); gr.addColorStop(0,'rgba(140,110,70,.11)'); gr.addColorStop(1,'rgba(140,110,70,0)'); g.fillStyle=gr; g.fillRect(X-r,Y-r,r*2,r*2); }); }
  g.strokeStyle='rgba(120,100,80,.2)'; g.lineWidth=.8;
  for (let i=0;i<10;i++){ let x=40+Math.random()*(S-80), y=40+Math.random()*(S-120); g.beginPath(); g.moveTo(x,y); for (let k=0;k<5;k++){ x+=(Math.random()-.5)*18; y+=Math.random()*14; g.lineTo(x,y); } g.stroke(); }
  return vlTexRep(cv); }
function vlWoodTex(base){   // 나뭇결
  const S=256, cv=vlCanvas(S,S,g=>{ g.fillStyle=base; g.fillRect(0,0,S,S);
    for (let i=0;i<150;i++){ const y=Math.random()*S, k=1+(Math.random()*3|0), amp=1+Math.random()*2.5, ph=Math.random()*6.283; g.strokeStyle=Math.random()<.55?'rgba(30,18,8,.28)':'rgba(150,105,66,.2)'; g.lineWidth=.6+Math.random()*1.9; g.beginPath();
      for (let x=0;x<=S;x+=8){ const yy=y+Math.sin(x/S*6.283*k+ph)*amp; x?g.lineTo(x,yy):g.moveTo(x,yy); } g.stroke(); }
    for (let i=0;i<5;i++){ const x=Math.random()*S, y=Math.random()*S; g.fillStyle='rgba(28,16,8,.45)'; g.beginPath(); g.ellipse(x,y,5+Math.random()*4,2.5+Math.random()*2,0,0,7); g.fill(); } });
  return vlTexRep(cv); }
function vlStoneTex(){   // 돌담 · 기단
  const S=512, cv=vlCanvas(S,S,g=>{ g.fillStyle='#7f786c'; g.fillRect(0,0,S,S);
    const rows=8, rh=S/rows; for (let r=0;r<rows;r++){ let x=Math.random()*40-40; const yc=r*rh+rh/2;
      while (x<S){ const w=36+Math.random()*46, f=.78+Math.random()*.32, c=[178*f|0,170*f|0,156*f|0], cx=x+w/2, ww=w;
        vlWrapDraw(S,cx,yc,90,(X,Y)=>{ g.fillStyle=`rgb(${c})`; roundRect(g,X-ww/2+2,Y-rh/2+2,ww-4,rh-4,9); g.fill();
          g.fillStyle='rgba(255,255,255,.13)'; roundRect(g,X-ww/2+5,Y-rh/2+4,ww-10,rh*.32,7); g.fill();
          g.fillStyle='rgba(0,0,0,.15)'; roundRect(g,X-ww/2+5,Y+rh*.1,ww-10,rh*.32,7); g.fill(); });
        x+=w; } } });
  return vlTexRep(cv); }
function vlShingleTex(col){   // 지붕 기와
  const S=512, c=new THREE.Color(col), cv=vlCanvas(S,S,g=>{ const rows=14, rh=S/rows; g.fillStyle='#231a1a'; g.fillRect(0,0,S,S);
    for (let r=0;r<rows;r++){ const off=(r%2)*16; for (let k=-1;k<=S/32;k++){ const v=.76+Math.random()*.36, x=k*32+off, y=r*rh;
      g.fillStyle=`rgb(${Math.min(255,c.r*255*v)|0},${Math.min(255,c.g*255*v)|0},${Math.min(255,c.b*255*v)|0})`; roundRect(g,x+1,y,30,rh-2,4); g.fill();
      const gr=g.createLinearGradient(0,y,0,y+rh); gr.addColorStop(0,'rgba(0,0,0,.3)'); gr.addColorStop(.35,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(255,255,255,.1)'); g.fillStyle=gr; g.fillRect(x+1,y,30,rh-2);
      if (Math.random()<.06){ g.fillStyle='rgba(90,120,60,.35)'; g.beginPath(); g.arc(x+8+Math.random()*16,y+rh*.6,4+Math.random()*4,0,7); g.fill(); } } } });
  return vlTexRep(cv); }
function vlScallopTex(col,dark){
  const c=new THREE.Color(col), cv=vlCanvas(256,256,g=>{ g.fillStyle=dark; g.fillRect(0,0,256,256);
    for (let r=0;r<9;r++) for (let k=-1;k<9;k++){ const x=k*32+(r%2)*16+16, y=r*30, v=.86+Math.random()*.26; g.fillStyle=`rgb(${Math.min(255,c.r*255*v)|0},${Math.min(255,c.g*255*v)|0},${Math.min(255,c.b*255*v)|0})`;
      g.beginPath(); g.moveTo(x-15,y); g.lineTo(x+15,y); g.lineTo(x+15,y+18); g.arc(x,y+18,15,0,Math.PI); g.closePath(); g.fill();
      g.strokeStyle='rgba(255,255,255,.22)'; g.lineWidth=2; g.beginPath(); g.arc(x,y+18,11,.3,Math.PI-.3); g.stroke(); } });
  return vlTexRep(cv); }
function vlWindowTex(){   // 불 켜진 창 (커튼 · 창살)
  const W=128, H=160, cv=vlCanvas(W,H,g=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#4a2a14'); gr.addColorStop(.5,'#b8662a'); gr.addColorStop(1,'#ffcf7a'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.fillStyle='rgba(255,232,170,.55)'; g.beginPath(); g.ellipse(W*.5,H*.78,W*.34,H*.24,0,0,7); g.fill();
    g.fillStyle='#a83a32'; g.fillRect(0,0,W*.2,H); g.fillRect(W*.8,0,W*.2,H); g.fillStyle='rgba(0,0,0,.18)'; for (let i=0;i<4;i++){ g.fillRect(i*W*.05,0,2,H); g.fillRect(W*.8+i*W*.05,0,2,H); }
    g.fillStyle='rgba(255,255,255,.13)'; g.beginPath(); g.moveTo(0,H*.32); g.lineTo(W*.5,0); g.lineTo(W*.72,0); g.lineTo(0,H*.56); g.fill();
    g.fillStyle='#3a2416'; g.fillRect(W/2-4,0,8,H); g.fillRect(0,H/2-4,W,8); g.lineWidth=10; g.strokeStyle='#3a2416'; g.strokeRect(0,0,W,H); });
  const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; return t; }
function vlDoorTex(){
  const W=256, H=512, cv=vlCanvas(W,H,g=>{ const pl=5, pw=W/pl;
    for (let i=0;i<pl;i++){ const v=.82+Math.random()*.28; g.fillStyle=`rgb(${126*v|0},${82*v|0},${46*v|0})`; g.fillRect(i*pw,0,pw,H);
      g.strokeStyle='rgba(50,28,12,.25)'; g.lineWidth=1; for (let k=0;k<26;k++){ const x=i*pw+Math.random()*pw; g.beginPath(); g.moveTo(x,0); g.lineTo(x+(Math.random()-.5)*8,H); g.stroke(); }
      g.fillStyle='rgba(30,16,6,.6)'; g.fillRect(i*pw,0,3,H); }
    g.fillStyle='#2b2724'; for (const y of [H*.16,H*.8]){ g.fillRect(0,y,W*.7,16); g.beginPath(); g.arc(W*.7,y+8,10,0,7); g.fill(); for (let k=0;k<4;k++){ g.beginPath(); g.arc(18+k*40,y+8,3,0,7); g.fillStyle='#4a4440'; g.fill(); g.fillStyle='#2b2724'; } }
    g.strokeStyle='#2b2724'; g.lineWidth=6; g.beginPath(); g.arc(W*.8,H*.52,16,0,7); g.stroke(); });
  const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; return t; }
function vlShutterTex(col){
  const W=128, H=256, c=new THREE.Color(col), cv=vlCanvas(W,H,g=>{ for (let i=0;i<3;i++){ const v=.84+Math.random()*.22; g.fillStyle=`rgb(${c.r*255*v|0},${c.g*255*v|0},${c.b*255*v|0})`; g.fillRect(i*W/3,0,W/3,H); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(i*W/3,0,2,H); }
    g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(0,H*.14,W,10); g.fillRect(0,H*.8,W,10); g.save(); g.translate(W/2,H/2); g.rotate(-1.1); g.fillRect(-H*.34,-5,H*.68,10); g.restore(); });
  const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; return t; }
function vlStrawTex(){
  const S=256, cv=vlCanvas(S,S,g=>{ g.fillStyle='#c9a24e'; g.fillRect(0,0,S,S); for (let i=0;i<1600;i++){ const x=Math.random()*S, y=Math.random()*S, l=6+Math.random()*16, a=(Math.random()-.5)*.6;
    g.strokeStyle=['#e2c06a','#b38a3c','#d8b45c','#a07a32','#f0d68a'][(Math.random()*5)|0]; g.lineWidth=1+Math.random(); g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l); g.stroke(); } });
  return vlTexRep(cv); }
function vlClothTex(a,b){ const cv=vlCanvas(256,64,g=>{ for (let i=0;i<8;i++){ g.fillStyle=i%2?b:a; g.fillRect(i*32,0,32,64); } g.fillStyle='rgba(0,0,0,.08)'; for (let i=0;i<64;i+=4) g.fillRect(0,i,256,1); }); return vlTexRep(cv); }
function vlCrateTex(){ const S=256, cv=vlCanvas(S,S,g=>{ g.fillStyle='#9a6e44'; g.fillRect(0,0,S,S); for (let i=0;i<5;i++){ g.fillStyle=`rgba(0,0,0,${.05+Math.random()*.08})`; g.fillRect(0,i*S/5,S,S/5); g.fillStyle='rgba(40,22,10,.5)'; g.fillRect(0,i*S/5,S,2); }
  g.strokeStyle='rgba(50,28,12,.2)'; for (let k=0;k<60;k++){ const y=Math.random()*S; g.beginPath(); g.moveTo(0,y); g.lineTo(S,y+(Math.random()-.5)*6); g.stroke(); }
  g.fillStyle='#6a4428'; g.fillRect(0,0,S,26); g.fillRect(0,S-26,S,26); g.fillRect(0,0,26,S); g.fillRect(S-26,0,26,S);
  g.save(); g.translate(S/2,S/2); g.rotate(Math.PI/4); g.fillRect(-S*.62,-12,S*1.24,24); g.restore(); });
  const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; return t; }
function vlGlowTex(){ if (VLT.glow) return VLT.glow; const cv=vlCanvas(64,64,g=>{ const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,240,200,1)'); gr.addColorStop(.25,'rgba(255,200,120,.55)'); gr.addColorStop(1,'rgba(255,170,80,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); });
  return VLT.glow=new THREE.CanvasTexture(cv); }
function vlLeafTex(){ const cv=vlCanvas(64,64,g=>{ g.translate(32,32); g.rotate(.5); g.fillStyle='#fff'; g.beginPath(); g.moveTo(0,-28); g.quadraticCurveTo(22,-6,0,28); g.quadraticCurveTo(-22,-6,0,-28); g.fill();
  g.strokeStyle='rgba(0,0,0,.3)'; g.lineWidth=2; g.beginPath(); g.moveTo(0,-24); g.lineTo(0,28); g.stroke(); g.lineWidth=1.2; for (let i=-2;i<=2;i++){ g.beginPath(); g.moveTo(0,i*8); g.lineTo(9,i*8-6); g.moveTo(0,i*8); g.lineTo(-9,i*8-6); g.stroke(); } });
  const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; return t; }

/* 상자 모양에 실제 크기 기준 UV를 줘요 (같은 텍스처를 여러 크기 벽에 써도 무늬 크기가 같아요) */
function vlUVBox(geo,sc){ const p=geo.attributes.position, n=geo.attributes.normal, uv=geo.attributes.uv;
  for (let i=0;i<p.count;i++){ const ax=Math.abs(n.getX(i)), ay=Math.abs(n.getY(i)), az=Math.abs(n.getZ(i)); let u, v;
    if (ay>=ax&&ay>=az){ u=p.getX(i); v=p.getZ(i); } else if (ax>=az){ u=p.getZ(i); v=p.getY(i); } else { u=p.getX(i); v=p.getY(i); }
    uv.setXY(i,u/sc,v/sc); }
  uv.needsUpdate=true; return geo; }
function vlUVScale(geo,su,sv){ const uv=geo.attributes.uv; for (let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*su,uv.getY(i)*(sv==null?su:sv)); uv.needsUpdate=true; return geo; }

/* 움직이지 않는 조각들을 재질별로 하나로 합쳐요 (그리기 횟수가 줄어서 느린 컴퓨터에 좋아요) */
function vlMerge(group){
  group.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(group.matrixWorld).invert(), buckets=new Map(), dead=[];
  group.traverse(o=>{ if (!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.userData.keep||Array.isArray(o.material)) return;
    const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));
    if (!geo.attributes.normal) geo.computeVertexNormals();
    if (!geo.attributes.uv) geo.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));
    const k=o.material.uuid+(o.castShadow?'1':'0');
    if (!buckets.has(k)) buckets.set(k,{mat:o.material,cast:o.castShadow,list:[]});
    buckets.get(k).list.push(geo); dead.push(o); });
  dead.forEach(o=>{ if (o.parent) o.parent.remove(o); });
  buckets.forEach(b=>{ let n=0; b.list.forEach(g=>{ n+=g.attributes.position.count; });
    const P=new Float32Array(n*3), N=new Float32Array(n*3), T=new Float32Array(n*2); let o=0;
    b.list.forEach(g=>{ P.set(g.attributes.position.array,o*3); N.set(g.attributes.normal.array,o*3); T.set(g.attributes.uv.array,o*2); o+=g.attributes.position.count; g.dispose(); });
    const G=new THREE.BufferGeometry(); G.setAttribute('position',new THREE.BufferAttribute(P,3)); G.setAttribute('normal',new THREE.BufferAttribute(N,3)); G.setAttribute('uv',new THREE.BufferAttribute(T,2)); G.computeBoundingSphere();
    const m=new THREE.Mesh(G,b.mat); m.castShadow=b.cast; m.receiveShadow=true; group.add(m); });
}

/* ---------- 공용 재질 ---------- */
function vlMats(){ if (VLT.mats) return VLT.mats;
  const std=o=>new THREE.MeshStandardMaterial(Object.assign({roughness:.9,metalness:0},o));
  const winT=vlWindowTex();
  const M={ plaster:std({map:vlPlasterTex(),roughness:.95}), plasterW:std({map:vlPlasterTex([238,222,186]),roughness:.95}),
    wood:std({map:vlWoodTex('#5a3a24'),roughness:.85}), woodLight:std({map:vlWoodTex('#8d6442'),roughness:.85}), woodN:std({map:vlWoodTex('#e2d8ca'),roughness:.85}),
    stone:std({map:vlStoneTex(),roughness:1}), stoneLight:std({color:0xd8d0c2,roughness:.95}), iron:std({color:0x2b2826,roughness:.55,metalness:.45}),
    win:std({map:winT,emissiveMap:winT,emissive:0xffb060,emissiveIntensity:.72,roughness:.3}), door:std({map:vlDoorTex(),roughness:.8}),
    lantern:std({color:0xfff0c0,emissive:0xffc060,emissiveIntensity:1.9,roughness:.4}), leaf:std({color:0x4a8a2c,roughness:.8}),
    flowers:['#ff6b8a','#ffffff','#ffd84a','#c77dff','#ff8f5a'].map(c=>std({color:new THREE.Color(c),roughness:.7})),
    straw:std({map:vlStrawTex(),roughness:1}), cloth:std({map:vlClothTex('#c8433a','#f3ead8'),roughness:.85,side:THREE.DoubleSide}), crate:std({map:vlCrateTex(),roughness:.9}),
    roofC:{}, shutC:{} };
  M.stone2=M.stone.clone(); M.stone2.side=THREE.DoubleSide; M.stoneDark=M.stone.clone(); M.stoneDark.color=new THREE.Color(0x8a8580);
  M.roof=c=>M.roofC[c]||(M.roofC[c]=std({map:vlShingleTex(c),roughness:.8}));
  M.shut=c=>M.shutC[c]||(M.shutC[c]=std({map:vlShutterTex(c),roughness:.8}));
  return VLT.mats=M; }
const vlBox=(a,b,c,s)=>vlUVBox(new THREE.BoxGeometry(a,b,c),s||1);
function vlPutter(g){ return (geo,mat,x,y,z,rx,ry,rz,par)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.rotation.set(rx||0,ry||0,rz||0); m.castShadow=m.receiveShadow=true; (par||g).add(m); return m; }; }
function vlHalo(par,x,y,z,s){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:vlGlowTex(),color:0xffc070,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));
  sp.position.set(x,y,z); sp.scale.setScalar(s); par.add(sp); VL.halos.push(sp); return sp; }

/* 창문 묶음 (벽 바깥쪽이 +z) */
function vlWindow(ww,hh,opt){ const M=vlMats(), s=new THREE.Group(), put=vlPutter(s), B=vlBox;
  put(new THREE.PlaneGeometry(ww,hh),M.win,0,0,.02).castShadow=false;
  put(B(ww+.22,.1,.14,.5),M.wood,0,hh/2+.05,.05); put(B(ww+.22,.1,.14,.5),M.wood,0,-hh/2-.05,.05);
  put(B(.1,hh,.14,.5),M.wood,ww/2+.05,0,.05); put(B(.1,hh,.14,.5),M.wood,-ww/2-.05,0,.05);
  put(B(ww+.4,.08,.26,.5),M.stoneLight,0,-hh/2-.13,.1);
  if (opt.shut){ const sm=M.shut(opt.shut); for (const k of [1,-1]) put(new THREE.BoxGeometry(ww*.5,hh+.08,.05),sm,k*(ww/2+.12+ww*.25),0,.07); }
  if (opt.box){ put(B(ww+.12,.22,.28,.5),M.woodLight,0,-hh/2-.31,.2);
    for (let i=0;i<7;i++){ const x=(i/6-.5)*ww*.9; put(new THREE.SphereGeometry(.11,7,5),M.leaf,x,-hh/2-.15,.22);
      if (i%2===0||Math.random()<.5) put(new THREE.SphereGeometry(.075,6,4),M.flowers[(Math.random()*M.flowers.length)|0],x+vlRnd(-.05,.05),-hh/2-.06,.28); } }
  return s; }
function vlLantern(par,x,y,z){ const M=vlMats(), s=new THREE.Group(), put=vlPutter(s); s.position.set(x,y,z); par.add(s);
  put(vlBox(.06,.06,.34),M.iron,0,.12,.14); put(vlBox(.24,.32,.24),M.iron,0,-.06,.32); put(vlBox(.18,.26,.18),M.lantern,0,-.06,.32); put(vlBox(.19,.22,.26),M.lantern,0,-.06,.32);
  put(new THREE.ConeGeometry(.19,.16,4),M.iron,0,.17,.32,0,Math.PI/4,0);
  vlHalo(s,0,-.06,.36,1.25); }

/* ---------- 목조 2층 집 (2층이 앞뒤로 조금 내민 형태 · 나무 뼈대 · 덧창 · 꽃상자 · 굴뚝) ---------- */
function vlHouse2(H,parent){
  const M=vlMats(), g=new THREE.Group(); g.position.set(H.x,0,H.z); g.rotation.y=H.r; parent.add(g);
  const put=vlPutter(g), B=vlBox;
  const w=H.w, d=H.d, J=.38, y0=.6, h1=2.5, h2=2.1, y1=y0+h1, yU=y1+.24, Y2=yU+h2, D=d/2, DJ=D+J, T=.17;
  put(B(w+.5,y0,d+.5,1.4),M.stone,0,y0/2,0);
  put(B(w,h1,.22,2.4),M.plaster,0,y0+h1/2,D-.11); put(B(w,h1,.22,2.4),M.plaster,0,y0+h1/2,-D+.11);
  put(B(.22,h1,d-.44,2.4),M.plaster,w/2-.11,y0+h1/2,0); put(B(.22,h1,d-.44,2.4),M.plaster,-w/2+.11,y0+h1/2,0);
  put(B(w+.12,.24,2*DJ+.1,.8),M.wood,0,y1+.12,0);
  for (let x=-w/2+.3;x<w/2-.1;x+=.6) for (const s of [1,-1]) put(B(.13,.15,.42,.4),M.wood,x,y1-.06,s*(DJ-.12));
  put(B(w,h2,.22,2.4),M.plaster,0,yU+h2/2,DJ-.11); put(B(w,h2,.22,2.4),M.plaster,0,yU+h2/2,-DJ+.11);
  put(B(.22,h2,2*DJ-.44,2.4),M.plaster,w/2-.11,yU+h2/2,0); put(B(.22,h2,2*DJ-.44,2.4),M.plaster,-w/2+.11,yU+h2/2,0);
  // 나무 뼈대
  const beam=(f,ua,ya,ub,yb,th)=>{ const du=ub-ua, dy=yb-ya, len=Math.hypot(du,dy)+th*.5, ang=Math.atan2(dy,du), um=(ua+ub)/2, ym=(ya+yb)/2, off=.05;
    if (f.ax==='z') put(B(len,th,.1,.6),M.wood,um,ym,f.s*(f.c+off),0,0,ang); else put(B(.1,th,len,.6),M.wood,f.s*(f.c+off),ym,um,-ang,0,0); };
  const timber=(f,u0,u1,yA,yB,ops)=>{
    beam(f,u0,yA,u1,yA,T); beam(f,u0,yB,u1,yB,T); beam(f,u0,yA,u0,yB,T*1.25); beam(f,u1,yA,u1,yB,T*1.25);
    const free=(ua,ub)=>!ops.some(o=>ub>o.u-o.w/2-.14&&ua<o.u+o.w/2+.14);
    ops.forEach(o=>{ const L=o.u-o.w/2-.09, R=o.u+o.w/2+.09; beam(f,L,o.door?yA:o.y0-.08,L,Math.min(yB,o.y1+.1),T); beam(f,R,o.door?yA:o.y0-.08,R,Math.min(yB,o.y1+.1),T);
      if (o.y1+.24<yB) beam(f,L-.02,o.y1+.1,R+.02,o.y1+.1,T);
      if (!o.door&&o.y0-.24>yA) beam(f,L-.02,o.y0-.08,R+.02,o.y0-.08,T);
      if (o.x&&o.y0-yA>.45){ beam(f,L+.06,yA+.06,R-.06,o.y0-.14,T*.8); beam(f,L+.06,o.y0-.14,R-.06,yA+.06,T*.8); } });
    const n=Math.max(1,Math.round((u1-u0)/1.25)); for (let i=1;i<n;i++){ const u=u0+(u1-u0)*i/n; if (free(u-.12,u+.12)) beam(f,u,yA,u,yB,T); }
    if (free(u0,u0+1.25)) beam(f,u0+.12,yA+.1,u0+1.05,yB-.12,T*.9);
    if (free(u1-1.25,u1)) beam(f,u1-.12,yA+.1,u1-1.05,yB-.12,T*.9); };
  const at=(obj,f,u,y,off)=>{ if (f.ax==='z'){ obj.position.set(u,y,f.s*(f.c+(off||0))); obj.rotation.y=f.s>0?0:Math.PI; } else { obj.position.set(f.s*(f.c+(off||0)),y,u); obj.rotation.y=f.s>0?Math.PI/2:-Math.PI/2; } g.add(obj); return obj; };
  const FG={ax:'z',s:1,c:D}, BG={ax:'z',s:-1,c:D}, FU={ax:'z',s:1,c:DJ}, BU={ax:'z',s:-1,c:DJ}, RX={ax:'x',s:1,c:w/2}, LX={ax:'x',s:-1,c:w/2};
  const gw=1.0, gh=1.15, gy=y0+1.4, uw=.95, uh=1.05, uy=yU+1.12;
  const op=(u,ww,hh,yc,extra)=>Object.assign({u,w:ww,y0:yc-hh/2,y1:yc+hh/2},extra||{});
  const frontG=[op(0,1.2,2.15,y0+1.075,{door:true}),op(-w*.3,gw,gh,gy),op(w*.3,gw,gh,gy)];
  const backG=[op(-w*.25,gw,gh,gy),op(w*.25,gw,gh,gy)], sideG=[op(0,gw,gh,gy)];
  const frontU=(w>=9?[-w*.32,0,w*.32]:[-w*.24,w*.24]).map(u=>op(u,uw,uh,uy,{x:true}));
  if (H.shop) frontU.forEach((o,i,a)=>{ if (a.length===2) o.u*=1.12; });
  const backU=[op(-w*.25,uw,uh,uy,{x:true}),op(w*.25,uw,uh,uy,{x:true})], sideU=[op(0,uw,uh,uy,{x:true})];
  timber(FG,-w/2,w/2,y0+.09,y1-.02,frontG); timber(BG,-w/2,w/2,y0+.09,y1-.02,backG); timber(RX,-D,D,y0+.09,y1-.02,sideG); timber(LX,-D,D,y0+.09,y1-.02,sideG);
  timber(FU,-w/2,w/2,yU+.04,Y2-.02,frontU); timber(BU,-w/2,w/2,yU+.04,Y2-.02,backU); timber(RX,-DJ+.12,DJ-.12,yU+.04,Y2-.02,sideU); timber(LX,-DJ+.12,DJ-.12,yU+.04,Y2-.02,sideU);
  const sc=H.shut||'#3f6b4a';
  frontG.filter(o=>!o.door).forEach(o=>at(vlWindow(o.w,o.y1-o.y0,{shut:sc,box:true}),FG,o.u,(o.y0+o.y1)/2));
  backG.forEach(o=>at(vlWindow(o.w,o.y1-o.y0,{shut:sc}),BG,o.u,(o.y0+o.y1)/2));
  sideG.forEach(o=>{ at(vlWindow(o.w,o.y1-o.y0,{}),RX,o.u,(o.y0+o.y1)/2); at(vlWindow(o.w,o.y1-o.y0,{}),LX,o.u,(o.y0+o.y1)/2); });
  frontU.forEach(o=>at(vlWindow(o.w,o.y1-o.y0,{shut:sc,box:true}),FU,o.u,(o.y0+o.y1)/2));
  backU.forEach(o=>at(vlWindow(o.w,o.y1-o.y0,{shut:sc}),BU,o.u,(o.y0+o.y1)/2));
  sideU.forEach(o=>{ at(vlWindow(o.w,o.y1-o.y0,{}),RX,o.u,(o.y0+o.y1)/2); at(vlWindow(o.w,o.y1-o.y0,{}),LX,o.u,(o.y0+o.y1)/2); });
  // 문 · 지붕 달린 현관 · 계단 · 등불
  { const dg=new THREE.Group(), p2=vlPutter(dg);
    p2(new THREE.BoxGeometry(1.1,2.1,.08),M.door,0,1.05,0);
    p2(B(.16,2.3,.16,.5),M.wood,-.66,1.15,.05); p2(B(.16,2.3,.16,.5),M.wood,.66,1.15,.05); p2(B(1.52,.2,.18,.5),M.wood,0,2.3,.06);
    for (const k of [1,-1]){ p2(B(1.0,.08,1.05,1.2),M.roof(H.roof),k*.43,2.64,.48,0,0,-k*.5); p2(B(.07,.07,.8,.5),M.wood,k*.62,2.25,.42,-.62,0,0); }
    p2(B(1.75,.3,.5,1),M.stone,0,-.15,.32); p2(B(1.75,.3,.5,1),M.stone,0,-.45,.72);
    vlLantern(dg,.98,1.95,0);
    at(dg,FG,0,y0); }
  if (H.shop){   // 상점: 줄무늬 차양 · 간판
    const aw=new THREE.Group(), p3=vlPutter(aw);
    p3(B(w*.86,.06,1.5,1),M.cloth,0,0,.72,.36,0,0); p3(B(w*.86,.28,.03,1),M.cloth,0,-.38,1.42);
    for (const k of [1,-1]) p3(B(.06,.06,1.3,.5),M.iron,k*w*.4,-.2,.62,.36,0,0);
    at(aw,FG,0,y1-.18);
    const sg=vlTex(vlCanvas(512,176,c=>{ c.fillStyle='#5a3b28'; roundRect(c,0,0,512,176,26); c.fill(); c.strokeStyle='#d8b25a'; c.lineWidth=10; roundRect(c,10,10,492,156,20); c.stroke(); c.fillStyle='#f6d58a'; c.font='bold 92px Jua, "Malgun Gothic", sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('🛒 상점',256,94); }));
    const sb=new THREE.Group(), p4=vlPutter(sb); p4(new THREE.PlaneGeometry(2.1,.72),new THREE.MeshStandardMaterial({map:sg,roughness:.7}),0,0,.07).userData.keep=true; p4(B(2.2,.08,.12,.5),M.wood,0,.42,.04);
    at(sb,FU,0,uy); }
  // 지붕 (기와 · 박공널 · 처마널 · 용마루)
  const th=.72, og=.55, oe=.5, rise=DJ*Math.tan(th), L=(DJ+oe)/Math.cos(th), yR=Y2+rise, RM=M.roof(H.roof);
  for (const s of [1,-1]){ const cy=yR-Math.sin(th)*L/2+Math.cos(th)*.13, cz=s*(Math.cos(th)*L/2+Math.sin(th)*.13);
    put(B(w+2*og,.22,L,1.5),RM,0,cy,cz,s*th,0,0);
    for (const k of [1,-1]) put(B(.09,.34,L+.04,.6),M.wood,k*(w/2+og+.02),cy-.04,cz,s*th,0,0);
    const ey=yR-Math.sin(th)*L+Math.cos(th)*.05, ez=s*(Math.cos(th)*L+Math.sin(th)*.05); put(B(w+2*og+.1,.24,.09,.6),M.wood,0,ey-.1,ez,s*th,0,0); }
  put(B(w+2*og+.12,.18,.36,.6),M.wood,0,yR+.2,0);
  const tri=new THREE.Shape(); tri.moveTo(-DJ,0); tri.lineTo(DJ,0); tri.lineTo(0,rise); tri.lineTo(-DJ,0);
  for (const s of [1,-1]){ put(vlUVScale(new THREE.ExtrudeGeometry(tri,{depth:.22,bevelEnabled:false}),1/2.4),M.plaster,s>0?w/2-.22:-w/2,Y2,0,0,Math.PI/2,0);
    const f={ax:'x',s,c:w/2}; beam(f,-DJ*.78,Y2+.06,0,Y2+rise*.66,T*.85); beam(f,DJ*.78,Y2+.06,0,Y2+rise*.66,T*.85); beam(f,0,Y2+rise*.62,0,yR-.2,T);
    at(vlWindow(.55,.5,{}),f,0,Y2+rise*.3); }
  // 굴뚝 (연기는 효과에서)
  const chx=w*.27*(H.chim||1), chz=-DJ*.32, ch0=Y2-.4, ch1=yR+.75;
  put(B(.85,ch1-ch0,.85,1.2),M.stone,chx,(ch0+ch1)/2,chz); put(B(1.05,.14,1.05,1),M.stoneLight,chx,ch1+.07,chz);
  g.updateMatrixWorld(true); VL.smokeSrc.push(g.localToWorld(new THREE.Vector3(chx,ch1+.25,chz)));
  vlMerge(g);
  return g; }

/* ---------- 탑 달린 파란 지붕 집 (내 집) ---------- */
function vlCozy2(H,parent){
  const M=vlMats(), g=new THREE.Group(); g.position.set(H.x,0,H.z); g.rotation.y=H.r; parent.add(g);
  const put=vlPutter(g), B=vlBox, D=H.d/2, y0=.6, top=y0+H.h;
  put(B(H.w+.4,y0,H.d+.4,1.4),M.stone,0,y0/2,0);
  put(B(H.w,H.h,H.d,2.4),M.plasterW,0,y0+H.h/2,0);
  for (const x of [-H.w/2,H.w/2]) for (const z of [-D,D]) put(B(.28,H.h,.28,.6),M.wood,x,y0+H.h/2,z);
  for (const y of [y0+.1,y0+H.h*.48,top-.05]) put(B(H.w+.1,.2,.2,.6),M.wood,0,y,D+.03);
  for (const x of [-H.w*.13,H.w*.13]) put(B(.18,H.h*.48,.18,.6),M.wood,x,y0+H.h*.74,D+.03);
  const sc=vlScallopTex('#3f6fd8','#24438a'), rm=new THREE.MeshStandardMaterial({map:sc,roughness:.55});
  const pitch=.82, over=.7, rise=D*Math.tan(pitch), slab=(D+over)/Math.cos(pitch); sc.repeat.set(H.w/2.4,slab/2.4);
  for (const s of [-1,1]){ const rg=new THREE.BoxGeometry(H.w+1.1,.26,slab); if (s<0) rg.rotateY(Math.PI); const r=put(rg,rm,0,top+rise/2+.05,s*(D/2+over*.22)); r.rotation.x=s*pitch;
    for (const k of [1,-1]){ const b=put(B(.09,.32,slab+.04,.6),M.wood,k*(H.w/2+.57),top+rise/2+.01,s*(D/2+over*.22)); b.rotation.x=s*pitch; } }
  const tri=new THREE.Shape(); tri.moveTo(-D,0); tri.lineTo(D,0); tri.lineTo(0,rise); tri.lineTo(-D,0);
  for (const s of [-1,1]) put(vlUVScale(new THREE.ExtrudeGeometry(tri,{depth:.12,bevelEnabled:false}),1/2.4),M.plasterW,s*(H.w/2-.06),top,0,0,Math.PI/2,0);
  const arch=(w,h)=>{ const s=new THREE.Shape(); s.moveTo(-w/2,0); s.lineTo(w/2,0); s.lineTo(w/2,h-w/2); s.absarc(0,h-w/2,w/2,0,Math.PI,false); s.lineTo(-w/2,0); return s; };
  const archWin=(x,y,z,ry,w,h,box)=>{ const s=new THREE.Group(), p=vlPutter(s); s.position.set(x,y,z); s.rotation.y=ry; g.add(s);
    p(new THREE.ExtrudeGeometry(arch(w+.22,h+.16),{depth:.1,bevelEnabled:false}),M.wood,0,-.08,0);
    const gl=vlUVScale(new THREE.ShapeGeometry(arch(w,h)),1/w,1/h); gl.translate(.5*0,0,0); { const uv=gl.attributes.uv; for (let i=0;i<uv.count;i++) uv.setX(i,uv.getX(i)+.5); uv.needsUpdate=true; }
    p(gl,M.win,0,0,.11).castShadow=false;
    p(B(.06,h,.04),M.wood,0,h/2,.13);
    if (box){ p(B(w+.3,.25,.35,.5),M.woodLight,0,-.2,.2); for (let i=0;i<5;i++){ p(new THREE.SphereGeometry(.11,7,5),M.leaf,(i-2)*(w/5),-.04,.24); p(new THREE.SphereGeometry(.08,6,4),M.flowers[i%M.flowers.length],(i-2)*(w/5)+.04,.02,.3); } } };
  const dx=-H.w*.22, dz=D-.3, dy=top+.9;
  put(B(1.8,1.6,1.4,2.4),M.plasterW,dx,dy,dz-.2);
  // 지붕창 지붕 (Λ): 박공과 같은 기울기로 덮고, 뒤쪽은 큰 지붕 속까지 이어 붙여 틈이 안 보이게 해요
  const da=Math.atan2(.9,1.05), dca=Math.cos(da), dsa=Math.sin(da), dL=1.62, ay=dy+1.7, zf=dz+.72, zb=dz-2.05, dD=zf-zb, dzc=(zf+zb)/2;
  const dt=new THREE.Shape(); dt.moveTo(-1.05,0); dt.lineTo(1.05,0); dt.lineTo(0,.9); dt.lineTo(-1.05,0);
  put(vlUVScale(new THREE.ExtrudeGeometry(dt,{depth:dz+.55-zb,bevelEnabled:false}),1/2.4),M.plasterW,dx,dy+.8,zb);
  for (const s of [-1,1]){
    const sg=new THREE.BoxGeometry(dD,.12,dL); sg.rotateY(s*Math.PI/2); vlUVScale(sg,dD/(H.w+1.1),dL/slab);   // 큰 지붕과 같은 비늘 크기 · 방향
    put(sg,rm,dx+s*(dca*dL/2+dsa*.06),ay-dsa*dL/2+dca*.06,dzc,0,0,-s*da);
    put(vlBox(dL,.2,.07,.6),M.wood,dx+s*(dca*dL/2+dsa*.02),ay-dsa*dL/2+dca*.02,zf+.035,0,0,-s*da); }
  put(vlBox(.18,.16,dD,.6),M.wood,dx,ay+.09,dzc);
  put(vlBox(.14,.34,.1,.6),M.wood,dx,ay,zf+.045);
  archWin(dx,dy-.55,dz+.5,0,.8,1.05,true); archWin(-H.w*.32,1.5,D,0,1.1,1.6,true); archWin(H.w*.28,1.5,D,0,1.0,1.5,true);
  // 아치 문
  const dg=vlUVScale(new THREE.ExtrudeGeometry(arch(1.3,2.4),{depth:.12,bevelEnabled:false}),1/1.3,1/2.4); { const uv=dg.attributes.uv; for (let i=0;i<uv.count;i++) uv.setX(i,uv.getX(i)+.5); uv.needsUpdate=true; }
  put(dg,M.door,0,y0,D);
  put(new THREE.ExtrudeGeometry(arch(1.75,2.75),{depth:.1,bevelEnabled:false}),M.stoneLight,0,y0,D-.03);
  put(B(2.3,.14,1.0),new THREE.MeshStandardMaterial({color:0x3f6fd0,roughness:.6}),0,3.75,D+.42).rotation.x=.42;
  put(B(2.1,.22,1.1,1),M.stone,0,.11,D+.75); put(B(1.7,.22,.8,1),M.stone,0,.33,D+.5);
  vlLantern(g,1.2,2.55,D);
  // 둥근 탑
  const bt=vlTexRep(vlCanvas(256,256,c=>{ c.fillStyle='#9a968d'; c.fillRect(0,0,256,256); for (let r=0;r<10;r++) for (let k=-1;k<5;k++){ const v=196+Math.random()*44|0; c.fillStyle=`rgb(${v},${v-4},${v-12})`; roundRect(c,k*64+(r%2)*32+3,r*25.6+3,58,20,4); c.fill(); c.fillStyle='rgba(0,0,0,.12)'; c.fillRect(k*64+(r%2)*32+3,r*25.6+17,58,6); } })); bt.repeat.set(4,4);
  const tx=H.w/2-.2, tz=-.3, th=H.h+3.6;
  put(new THREE.CylinderGeometry(1.9,2.0,th,28),new THREE.MeshStandardMaterial({map:bt,roughness:.95}),tx,y0+th/2,tz);
  put(new THREE.CylinderGeometry(2.08,2.08,.22,28),M.wood,tx,y0+th,tz);
  const ct=vlScallopTex('#3f6fd8','#24438a'); ct.repeat.set(5,2); put(new THREE.ConeGeometry(2.45,3.4,28),new THREE.MeshStandardMaterial({map:ct,roughness:.55}),tx,y0+th+1.7,tz);
  put(new THREE.SphereGeometry(.16,8,6),new THREE.MeshStandardMaterial({color:0xd8b25a,metalness:.6,roughness:.3}),tx,y0+th+3.5,tz);
  for (const [y,a] of [[2.0,.35],[4.6,.1],[th-.9,-.25]]) archWin(tx+Math.sin(a)*2.0,y0+y-.6,tz+Math.cos(a)*2.0,a,.75,1.15,y<3);
  put(B(.85,2.4,.85,1.2),M.stone,-H.w*.32,top+2.6,-H.d*.2); put(B(1.05,.14,1.05),M.stoneLight,-H.w*.32,top+3.87,-H.d*.2);
  g.updateMatrixWorld(true); VL.smokeSrc.push(g.localToWorld(new THREE.Vector3(-H.w*.32,top+4.1,-H.d*.2)));
  vlMerge(g);
  // 담쟁이 (잎 카드 · 합치지 않아요)
  const ivyTex=vlLeafTex(), ivy=[];
  for (const [x0,len] of [[-H.w*.47,16],[H.w*.06,14],[tx-1.6,18]]){ let x=x0, y=.7;
    for (let i=0;i<len;i++){ x+=vlS(-.12,.12); y+=vlS(.16,.26); for (let k=0;k<5;k++) ivy.push([x+vlS(-.28,.28),y+vlS(-.15,.15)]); } }
  const im=new THREE.InstancedMesh(new THREE.PlaneGeometry(.2,.2),new THREE.MeshStandardMaterial({map:ivyTex,alphaTest:.5,side:THREE.DoubleSide,roughness:.8}),ivy.length), Mx=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler();
  ivy.forEach(([x,y],i)=>{ const onTower=x>tx-2.2; const zz=onTower?tz+Math.sqrt(Math.max(0,4.1-(x-tx)*(x-tx)))+.03:D+.04;
    e.set(vlS(-.3,.3),vlS(-.4,.4),vlS(0,6.3)); q.setFromEuler(e); Mx.compose(new THREE.Vector3(x,y,zz),q,new THREE.Vector3(1,1,1).multiplyScalar(vlS(.8,1.3))); im.setMatrixAt(i,Mx); im.setColorAt(i,VL_LIN(['#3f7a2a','#4f8a34','#5f9a3a','#356a24'][i%4])); });
  g.add(im);
  return g; }

/* ---------- 땅: 풀밭 · 흙길 텍스처를 섞는 셰이더 + 접지 그늘 + 낙엽 ---------- */
function vlBuildGround(R){
  const S=1024, mp=v=>(v/VL_MAP+.5)*S;
  const strokeP=(g,pts,wd,bl,a)=>{ g.save(); g.filter=`blur(${bl}px)`; g.globalAlpha=a==null?1:a; g.lineWidth=wd/VL_MAP*S; g.lineCap='round'; g.lineJoin='round'; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(mp(p.x),mp(p.y)):g.moveTo(mp(p.x),mp(p.y))); g.stroke(); g.restore(); };
  const disc=(g,x,z,r,a,bl)=>{ g.save(); g.filter=`blur(${bl==null?4:bl}px)`; g.globalAlpha=a; g.beginPath(); g.arc(mp(x),mp(z),r/VL_MAP*S,0,7); g.fill(); g.restore(); };
  const pondPath=(g,pad)=>{ g.beginPath(); for (let i=0;i<=72;i++){ const a=i/72*Math.PI*2, r=vlPondR(a)+pad; const x=VL_POND.x+Math.cos(a)*r, z=VL_POND.z+Math.sin(a)*r; i?g.lineTo(mp(x),mp(z)):g.moveTo(mp(x),mp(z)); } g.closePath(); };
  const cR=vlCanvas(S,S,g=>{ g.fillStyle='#000'; g.fillRect(0,0,S,S); g.strokeStyle='#fff'; g.fillStyle='#fff';
    strokeP(g,VL_PATHP,VL_PATH_W*2+1.4,7,.5); strokeP(g,VL_PATHP,VL_PATH_W*2-.2,3,1); strokeP(g,VL_SIDEP,2.4,5,.55); strokeP(g,VL_SIDEP,1.5,2,1);
    VL_DOORS.forEach(d=>disc(g,d.x,d.z,d.id==='home'?1.4:2.6,.95));
    disc(g,VL_PORTAL.x,VL_PORTAL.z,3.6,.9,6); disc(g,-1.5,-17.5,2.4,.7); disc(g,-17.5,-7.5,2.4,.75); disc(g,21.8,-1.2,2.2,.55);
    g.save(); g.filter='blur(5px)'; pondPath(g,.8); g.fill(); g.restore(); });
  const cG=vlCanvas(S,S,g=>{ g.fillStyle='#fff'; g.fillRect(0,0,S,S); });
  const cB=vlCanvas(S,S,g=>{ g.fillStyle='#000'; g.fillRect(0,0,S,S);
    const spot=(x,z,r,a)=>{ const R2=r/VL_MAP*S, gr=g.createRadialGradient(mp(x),mp(z),0,mp(x),mp(z),R2); gr.addColorStop(0,`rgba(255,255,255,${a})`); gr.addColorStop(.6,`rgba(255,255,255,${a*.55})`); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(mp(x)-R2,mp(z)-R2,R2*2,R2*2); };
    VL_TREES.forEach(t=>{ if (t[3]!=='gr') spot(t[0],t[1],4.8*t[2],.95); });
    VL_BUSHES.forEach(b=>{ if (b[2]!=='gr') spot(b[0],b[1],2.3,.7); });
    for (let i=0;i<40;i++){ const p=VL_PATHP[(Math.random()*VL_PATHP.length)|0]; spot(p.x+vlRnd(-2.5,2.5),p.y+vlRnd(-2.5,2.5),vlRnd(1,2.2),.45); } });
  VL.gcv={R:cR,G:cG,B:cB,S,mp};
  const macro=vlCanvas(512,512,g=>{ g.fillStyle='rgb(128,128,128)'; g.fillRect(0,0,512,512);
    for (let i=0;i<280;i++){ const x=Math.random()*512, y=Math.random()*512, r=12+Math.random()*52, k=Math.random(), c=k<.35?'150,140,96':k<.62?'108,126,98':k<.8?'142,118,94':'122,122,108'; const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(${c},.38)`); gr.addColorStop(1,`rgba(${c},0)`); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); }
    const px=(VL_POND.x/VL_MAP+.5)*512, pz=(VL_POND.z/VL_MAP+.5)*512, pr=(VL_POND.r+2.2)/VL_MAP*512, gr=g.createRadialGradient(px,pz,0,px,pz,pr); gr.addColorStop(0,'rgba(66,70,58,.9)'); gr.addColorStop(.72,'rgba(80,86,66,.55)'); gr.addColorStop(1,'rgba(80,86,66,0)'); g.fillStyle=gr; g.fillRect(0,0,512,512); });
  const macroT=new THREE.CanvasTexture(macro); VL.macroTex=macroT;
  const maskT=new THREE.CanvasTexture(vlCanvas(4,4,()=>{})); VL.groundMask=maskT;
  // 미니맵용 그림
  VL.miniSrc=vlCanvas(1024,1024,g=>{ g.fillStyle='#6f7d36'; g.fillRect(0,0,1024,1024); g.strokeStyle='#c9ad84'; g.fillStyle='#c9ad84';
    strokeP(g,VL_PATHP,VL_PATH_W*2,1); strokeP(g,VL_SIDEP,1.6,1); VL_DOORS.forEach(d=>disc(g,d.x,d.z,2.2,1,1));
    g.fillStyle='#4f8a9a'; pondPath(g,0); g.fill(); });
  const grassT=vlGrassDetail(), dirtT=vlDirtDetail(), litT=vlLitterTex(), noiseT=vlNoiseTex();
  const mat=new THREE.MeshStandardMaterial({map:macroT,roughness:1,metalness:0});
  mat.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,{tMask:{value:maskT},tNoise:{value:noiseT},tGrassD:{value:grassT},tDirtD:{value:dirtT},tLit:{value:litT},uTile:{value:VL_MAP/3.0}});
    sh.fragmentShader='uniform sampler2D tMask,tNoise,tGrassD,tDirtD,tLit; uniform float uTile;\nvec3 vlSL(vec3 c){ return pow(c,vec3(2.2)); }\n'+sh.fragmentShader.replace('#include <map_fragment>',`
      vec4 mk=texture2D(tMask,vUv); vec2 tu=vUv*uTile;
      float n1=texture2D(tNoise,tu*.21).r, n2=texture2D(tNoise,tu*1.63).r;
      float dirt=smoothstep(.40,.60,mk.r+(n1-.5)*.45+(n2-.5)*.18);
      vec3 macro=texture2D(map,vUv).rgb*2.;
      vec3 gC=vlSL(texture2D(tGrassD,tu).rgb)*macro;
      vec3 dC=vlSL(texture2D(tDirtD,tu*1.37+.31).rgb)*mix(vec3(1.),macro,.4);
      float edge=smoothstep(.1,.5,mk.r)*(1.-dirt); gC=mix(gC,gC*vec3(.95,.84,.62),edge*.75);
      vec3 col=mix(gC,dC,dirt);
      vec4 lt=texture2D(tLit,tu*.83+vec2(.37,.11)); float la=lt.a*smoothstep(.2,.65,mk.b+(n2-.5)*.35)*(1.-dirt*.6);
      col=mix(col,vlSL(lt.rgb),la);
      col*=mix(.42,1.,mk.g);
      diffuseColor.rgb*=col;`); };
  mat.customProgramCacheKey=()=>'vlground';
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(VL_MAP,VL_MAP),mat); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; R.add(ground);
  // 바깥 땅: 마을 땅과 겹치는 가운데를 비워 둬요 (겹치면 멀리서 줄무늬처럼 깜빡여요)
  const fs=new THREE.Shape(); fs.moveTo(-300,-300); fs.lineTo(300,-300); fs.lineTo(300,300); fs.lineTo(-300,300); fs.lineTo(-300,-300);
  { const h=VL_MAP/2-.5, hp=new THREE.Path(); hp.moveTo(-h,-h); hp.lineTo(-h,h); hp.lineTo(h,h); hp.lineTo(h,-h); hp.lineTo(-h,-h); fs.holes.push(hp); }
  const far=new THREE.Mesh(new THREE.ShapeGeometry(fs),new THREE.MeshStandardMaterial({color:0x5a682c,roughness:1})); far.rotation.x=-Math.PI/2; far.position.y=-.03; R.add(far);
}
function vlGroundFinish(){
  const C=VL.gcv; if (!C) return; const S=C.S, mp=C.mp, g=C.G.getContext('2d');
  const blob=(x,z,r,k)=>{ const R2=r/VL_MAP*S, gr=g.createRadialGradient(mp(x),mp(z),0,mp(x),mp(z),R2); gr.addColorStop(0,`rgba(0,0,0,${k})`); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(mp(x)-R2,mp(z)-R2,R2*2,R2*2); };
  VL_TREES.forEach(t=>blob(t[0],t[1],2.1*t[2],.55));
  VL_BUSHES.forEach(b=>blob(b[0],b[1],1.8,.5));
  VL_HOUSES.forEach(H=>{ g.save(); g.translate(mp(H.x),mp(H.z)); g.rotate(-H.r); g.filter='blur(8px)'; g.fillStyle='rgba(0,0,0,.62)'; const w=(H.w+1.6)/VL_MAP*S, d=(H.d+1.9)/VL_MAP*S; g.fillRect(-w/2,-d/2,w+(H.cozy?3.6/VL_MAP*S:0),d); g.restore(); });
  VL_AO.forEach(a=>blob(a.x,a.z,a.r,a.k));
  const out=vlCanvas(S,S,gg=>{ const a=C.R.getContext('2d').getImageData(0,0,S,S).data, b=C.G.getContext('2d').getImageData(0,0,S,S).data, c=C.B.getContext('2d').getImageData(0,0,S,S).data, id=gg.createImageData(S,S);
    for (let i=0;i<a.length;i+=4){ id.data[i]=a[i]; id.data[i+1]=b[i]; id.data[i+2]=c[i]; id.data[i+3]=255; } gg.putImageData(id,0,0); });
  VL.groundMask.image=out; VL.groundMask.needsUpdate=true; VL.gcv=null; }

/* ---------- 먼 산 (안개 속 두 겹 · 해 지는 쪽은 골짜기) ---------- */
function vlMountains(par){
  const sunA=Math.atan2(VL_SUN.z,VL_SUN.x);
  const layer=(R,H0,amp,seed,col,haze)=>{ const N=220, pos=[], ah=[], idx=[];
    for (let i=0;i<=N;i++){ const a=i/N*Math.PI*2; let h=0; for (let k=1;k<=6;k++) h+=Math.sin(a*(k<3?k:k*2)+seed*k*1.37)/k; h=H0+amp*h+amp*.16*Math.sin(a*31+seed);
      const da=Math.abs(Math.atan2(Math.sin(a-sunA),Math.cos(a-sunA))); h*=.4+.6*Math.min(1,da/.6);
      const x=Math.cos(a)*R, z=Math.sin(a)*R; pos.push(x,-6,z, x,Math.max(6,h),z); ah.push(0,1); }
    for (let i=0;i<N;i++){ const b=i*2; idx.push(b,b+1,b+2, b+1,b+3,b+2); }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('aH',new THREE.Float32BufferAttribute(ah,1)); geo.setIndex(idx);
    const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:{uCol:{value:VL_LIN(col)},uFog:VL.U.uFog,uHaze:{value:haze},uSun:{value:VL_SUN}},side:THREE.DoubleSide,fog:false,
      vertexShader:'attribute float aH; varying float vH; varying vec3 vW; void main(){ vH=aH; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
      fragmentShader:`uniform vec3 uCol,uFog,uSun; uniform float uHaze; varying float vH; varying vec3 vW;
        void main(){ vec3 d=normalize(vec3(vW.x,0.,vW.z)); float s=max(dot(d,normalize(vec3(uSun.x,0.,uSun.z))),0.);
          vec3 c=mix(uFog,uCol,uHaze*(.5+.5*vH)); c=mix(c,c*vec3(.8,.7,.84),pow(s,3.)*.6);
          gl_FragColor=vec4(c,1.);
          #include <tonemapping_fragment>
        }`}));
    m.frustumCulled=false; par.add(m); };
  layer(250,62,24,1.3,'#9c829a',.3); layer(195,36,17,4.1,'#7e6a72',.5); }

/* ---------- 연못 (하늘 · 해가 비치는 물 · 갈대 · 부들 · 연잎) ---------- */
function vlPond(par){
  const P0=VL_POND, rings=8, segs=72, pos=[P0.x,.05,P0.z], ed=[0], idx=[];
  for (let r=1;r<=rings;r++){ const t=r/rings; for (let s=0;s<segs;s++){ const a=s/segs*Math.PI*2, R=vlPondR(a)*t; pos.push(P0.x+Math.cos(a)*R,.05,P0.z+Math.sin(a)*R); ed.push(t); } }
  for (let s=0;s<segs;s++) idx.push(0,1+s,1+(s+1)%segs);
  for (let r=1;r<rings;r++){ const b0=1+(r-1)*segs, b1=1+r*segs; for (let s=0;s<segs;s++){ const a=b0+s, b=b0+(s+1)%segs, c=b1+s, d=b1+(s+1)%segs; idx.push(a,c,b, b,c,d); } }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('aE',new THREE.Float32BufferAttribute(ed,1)); geo.setIndex(idx);
  const U=VL.U, WU={uTime:U.uTime,uSun:{value:VL_SUN},uSunCol:{value:VL_LIN('#ffb46e')},uTop:VL.skyU.uTop,uHor:VL.skyU.uHor,uFog:U.uFog,uFogN:U.uFogN,uFogF:U.uFogF};
  const water=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:WU,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:'attribute float aE; varying float vE; varying vec3 vW; void main(){ vE=aE; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader:`uniform float uTime,uFogN,uFogF; uniform vec3 uSun,uSunCol,uTop,uHor,uFog; varying float vE; varying vec3 vW;
      float h2(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h2(i),h2(i+vec2(1.,0.)),f.x),mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),f.x),f.y); }
      float wav(vec2 p){ return vn(p*1.3+vec2(uTime*.32,uTime*.18))*.6+vn(p*3.2-vec2(uTime*.45,-uTime*.28))*.3+vn(p*7.5-uTime*.7)*.1; }
      void main(){ vec2 p=vW.xz; float e=.07; float n0=wav(p), nx=wav(p+vec2(e,0.)), nz=wav(p+vec2(0.,e));
        vec3 N=normalize(vec3((n0-nx)*.85,1.,(n0-nz)*.85));
        vec3 V=normalize(cameraPosition-vW); float fr=.03+.97*pow(1.-max(dot(N,V),0.),5.);
        vec3 R=reflect(-V,N); float ry=max(R.y,0.);
        vec3 sky=mix(uHor,uTop,pow(ry,.55)); float s=max(dot(R,uSun),0.); sky+=uSunCol*(pow(s,380.)*12.+pow(s,30.)*.65+pow(s,6.)*.16);
        sky=mix(sky*vec3(.3,.27,.25),sky,smoothstep(.03,.2,ry));
        vec3 deep=vec3(.03,.065,.075), shal=vec3(.15,.18,.11);
        vec3 col=mix(mix(deep,shal,smoothstep(.55,1.,vE)),sky,clamp(fr*1.15+.06,0.,1.));
        col=mix(col,vec3(.32,.26,.18),smoothstep(.86,1.,vE)*.3);
        float a=mix(.93,0.,smoothstep(.9,1.,vE)); a=max(a,fr*.55*(1.-smoothstep(.97,1.,vE)));
        float dist=length(vW-cameraPosition); col=mix(col,uFog,smoothstep(uFogN,uFogF,dist));
        gl_FragColor=vec4(col,a);
        #include <tonemapping_fragment>
      }`}));
  water.renderOrder=1; par.add(water);
  // 갈대 · 부들
  const blade=new THREE.BufferGeometry(); blade.setAttribute('position',new THREE.Float32BufferAttribute([-.035,0,0, .035,0,0, -.02,.55,0, .02,.55,0, 0,1,0],3)); blade.setIndex([0,1,2, 1,3,2, 2,3,4]); blade.computeVertexNormals();
  const reeds=[], tails=[]; vlSeed=91;
  for (let i=0;i<40;i++){ const a=i/40*Math.PI*2+vlS(-.06,.06); if (Math.abs(Math.atan2(Math.sin(a-.15),Math.cos(a-.15)))<.38) continue;   // 벤치 쪽은 비워요
    const rr=vlPondR(a)*vlS(.86,1.04), cx=VL_POND.x+Math.cos(a)*rr, cz=VL_POND.z+Math.sin(a)*rr, n=3+(vlR()*5|0);
    for (let k=0;k<n;k++) reeds.push({x:cx+vlS(-.3,.3),z:cz+vlS(-.3,.3),h:vlS(.7,1.5),ry:vlS(0,6.3),lx:vlS(-.3,.3),lz:vlS(-.3,.3)});
    if (vlR()<.5) tails.push({x:cx+vlS(-.2,.2),z:cz+vlS(-.2,.2),h:vlS(1.1,1.6),lx:vlS(-.12,.12)}); }
  const Mx=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), V=new THREE.Vector3(), S3=new THREE.Vector3();
  { const im=new THREE.InstancedMesh(blade,new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.85}),reeds.length);
    reeds.forEach((r,i)=>{ e.set(r.lx,r.ry,r.lz); q.setFromEuler(e); Mx.compose(V.set(r.x,0,r.z),q,S3.set(1,r.h,1)); im.setMatrixAt(i,Mx); im.setColorAt(i,VL_LIN(['#6f8f3a','#8a9a40','#a8a24a','#5f7f30','#b8a050'][i%5])); });
    im.castShadow=true; im.receiveShadow=true; par.add(im); }
  { const stem=new THREE.InstancedMesh(new THREE.CylinderGeometry(.012,.016,1,4),new THREE.MeshStandardMaterial({color:0x6f7f3a,roughness:.9}),tails.length), head=new THREE.InstancedMesh(new THREE.CylinderGeometry(.05,.05,.27,8),new THREE.MeshStandardMaterial({color:0x5a3a22,roughness:.95}),tails.length);
    tails.forEach((t,i)=>{ e.set(t.lx,0,t.lx*.5); q.setFromEuler(e); Mx.compose(V.set(t.x,t.h/2,t.z),q,S3.set(1,t.h,1)); stem.setMatrixAt(i,Mx); Mx.compose(V.set(t.x+t.lx*t.h*.85,t.h-.12,t.z-t.lx*.5*t.h*.0),q,S3.set(1,1,1)); head.setMatrixAt(i,Mx); });
    stem.castShadow=head.castShadow=true; par.add(stem); par.add(head); }
  // 연잎 · 연꽃
  const pads=[]; for (let i=0;i<20;i++){ const a=vlS(0,6.3), t=Math.sqrt(vlR())*.72, r=vlPondR(a)*t; pads.push({x:VL_POND.x+Math.cos(a)*r,z:VL_POND.z+Math.sin(a)*r,s:vlS(.7,1.25),ry:vlS(0,6.3)}); }
  { const pg2=new THREE.CircleGeometry(.36,18,.35,Math.PI*2-.7); pg2.rotateX(-Math.PI/2); const im=new THREE.InstancedMesh(pg2,new THREE.MeshStandardMaterial({roughness:.6,side:THREE.DoubleSide}),pads.length);
    pads.forEach((p,i)=>{ e.set(0,p.ry,0); q.setFromEuler(e); Mx.compose(V.set(p.x,.07,p.z),q,S3.set(p.s,1,p.s)); im.setMatrixAt(i,Mx); im.setColorAt(i,VL_LIN(['#3f7a32','#4f8a3a','#5a8f3f','#376a2c'][i%4])); });
    im.receiveShadow=true; par.add(im);
    const fl=new THREE.Group(); par.add(fl); const pm=new THREE.MeshStandardMaterial({color:0xff9ec0,roughness:.6,emissive:0x2a0810}), cm=new THREE.MeshStandardMaterial({color:0xffd84a,roughness:.6});
    pads.slice(0,6).forEach(p=>{ for (let k=0;k<6;k++){ const pe=new THREE.Mesh(new THREE.ConeGeometry(.06,.18,4),pm); const a=k/6*Math.PI*2; pe.position.set(p.x+Math.cos(a)*.06,.15,p.z+Math.sin(a)*.06); pe.rotation.set(Math.cos(a)*.6,0,-Math.sin(a)*.6); fl.add(pe); }
      const c=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),cm); c.position.set(p.x,.16,p.z); fl.add(c); });
    vlMerge(fl); }
  // 물가 바위
  if (VL.natOK){ const rocks=[]; for (const a of [2.2,3.4,4.6,5.5]){ const rr=vlPondR(a)*1.02; rocks.push({x:VL_POND.x+Math.cos(a)*rr,y:-.15,z:VL_POND.z+Math.sin(a)*rr,ry:vlS(0,6.3),s:vlS(.42,.7)}); }
    vlInst('Rock_Medium_1',rocks.slice(0,2)); vlInst('Rock_Medium_3',rocks.slice(2)); }
  VL_COLL.push({x:VL_POND.x,z:VL_POND.z,r:VL_POND.r*.84});
}

/* ---------- 소품: 가로등 · 우물 · 나무통 · 수레 · 건초 · 이정표 · 과일 가판대 · 벤치 · 상자 ---------- */
function vlLamp(x,z,ry,par){ const M=vlMats(), g=new THREE.Group(), put=vlPutter(g), B=vlBox; g.position.set(x,0,z); g.rotation.y=ry||0; par.add(g);
  put(B(.5,.28,.5,1),M.stone,0,.14,0); put(B(.34,.2,.34,1),M.stone,0,.38,0);
  put(new THREE.CylinderGeometry(.06,.085,3.0,10),M.iron,0,1.98,0);
  for (const y of [.6,3.4]) put(new THREE.CylinderGeometry(.095,.095,.08,10),M.iron,0,y,0);
  put(new THREE.SphereGeometry(.085,10,8),M.iron,0,3.56,0);
  put(B(.95,.055,.055),M.iron,.47,3.38,0);
  put(new THREE.TorusGeometry(.19,.022,6,16,Math.PI*1.5),M.iron,.21,3.17,0,0,0,Math.PI*.25);
  const lx=.86, ly=2.88;
  put(new THREE.CylinderGeometry(.012,.012,.2,4),M.iron,lx,3.27,0);
  put(new THREE.ConeGeometry(.24,.2,4),M.iron,lx,ly+.3,0,0,Math.PI/4,0);
  put(B(.3,.04,.3),M.iron,lx,ly+.19,0); put(B(.26,.05,.26),M.iron,lx,ly-.2,0);
  put(new THREE.ConeGeometry(.08,.1,4),M.iron,lx,ly-.28,0,Math.PI,Math.PI/4,0);
  for (const [sx,sz] of [[1,1],[1,-1],[-1,1],[-1,-1]]) put(B(.03,.36,.03),M.iron,lx+sx*.12,ly,sz*.12);
  put(B(.22,.34,.22),M.lantern,lx,ly,0);
  vlHalo(g,lx,ly,0,1.9);
  vlMerge(g);
  const c=Math.cos(ry||0), sn=Math.sin(ry||0);
  VL_COLL.push({x,z,r:.32}); VL_AO.push({x,z,r:.8,k:.35});
  VL.camObs.push({x,z,r:.25,h:3.7},{x:x+c*lx,z:z-sn*lx,r:.45,h:3.4}); }
function vlWell(x,z,par){ const M=vlMats(), g=new THREE.Group(), put=vlPutter(g), B=vlBox; g.position.set(x,0,z); par.add(g);
  put(vlUVScale(new THREE.CylinderGeometry(1.25,1.35,1.0,20,1,true),2*Math.PI*1.3/1.4,1/1.4),M.stone2,0,.5,0);
  put(new THREE.TorusGeometry(1.27,.16,8,24),M.stoneLight,0,1.0,0,Math.PI/2,0,0);
  put(new THREE.CircleGeometry(1.15,20),new THREE.MeshStandardMaterial({color:0x22424f,roughness:.15,metalness:.2}),0,.62,0,-Math.PI/2,0,0);
  for (const s of [-1,1]) put(B(.18,2.4,.18,.6),M.wood,s*1.15,1.2,0);
  for (const s of [-1,1]) put(B(3,.12,1.6,1.5),M.roof('#3f6fd0'),0,2.75,s*.62,s*.6,0,0);
  put(new THREE.CylinderGeometry(.1,.1,2.3,8),M.wood,0,2.0,0,0,0,Math.PI/2);
  put(new THREE.CylinderGeometry(.18,.15,.28,10),M.woodLight,.3,1.55,0); put(new THREE.TorusGeometry(.17,.02,4,12),M.iron,.3,1.62,0,Math.PI/2,0,0);
  vlMerge(g); VL_COLL.push({x,z,r:1.4}); VL_AO.push({x,z,r:2.2,k:.45}); VL.camObs.push({x,z,r:1.4,h:3}); }
function vlBarrel(x,z,par,s){ const M=vlMats(), g=new THREE.Group(), put=vlPutter(g); g.position.set(x,0,z); g.scale.setScalar(s||1); par.add(g);
  put(vlUVScale(new THREE.CylinderGeometry(.42,.42,.95,16),3,1),M.woodLight,0,.48,0); put(new THREE.CylinderGeometry(.46,.42,.08,16),M.woodLight,0,.48,0);
  for (const y of [.14,.82]) put(new THREE.TorusGeometry(.43,.025,5,18),M.iron,0,y,0,Math.PI/2,0,0);
  put(new THREE.CircleGeometry(.4,16),M.wood,0,.96,0,-Math.PI/2,0,0);
  vlMerge(g); VL_COLL.push({x,z,r:.5}); VL_AO.push({x,z,r:.8,k:.4}); }
function vlProps(par){ const M=vlMats(), g=new THREE.Group(), put=vlPutter(g), B=vlBox; par.add(g);
  // 수레와 건초
  { const c=new THREE.Group(); c.position.set(21.5,0,-1.5); c.rotation.y=.6; g.add(c); const p=vlPutter(c);
    p(B(1.6,.12,1.0,1),M.woodLight,0,.62,0); for (const s of [1,-1]){ p(B(1.6,.32,.07,1),M.woodLight,0,.84,s*.5); p(B(.07,.32,1.0,1),M.woodLight,s*.8,.84,0); }
    for (const s of [1,-1]){ const wg=new THREE.Group(); wg.position.set(-.1,.45,s*.6); c.add(wg); const pw=vlPutter(wg);
      pw(new THREE.TorusGeometry(.4,.05,6,18),M.iron,0,0,0); pw(new THREE.CylinderGeometry(.08,.08,.14,8),M.wood,0,0,0,Math.PI/2,0,0); for (let k=0;k<6;k++) pw(B(.05,.76,.04),M.wood,0,0,0,0,0,k*Math.PI/6); }
    for (const s of [1,-1]) p(B(1.4,.07,.07,1),M.woodLight,1.45,.66,s*.35,0,0,-.12);
    p(B(1.25,.42,.72,1),M.straw,-.1,.9,0,0,.15,0);
    VL_COLL.push({x:21.5,z:-1.5,r:1.15}); VL_AO.push({x:21.5,z:-1.5,r:1.8,k:.4}); }
  [[23.3,.6,0,.3],[24.2,-.5,0,-.4],[23.7,.05,.55,.12]].forEach(([x,z,y,ry])=>{ put(B(1.1,.55,.62,1),M.straw,x,y+.275,z,0,ry,0); if (!y){ VL_COLL.push({x,z,r:.6}); VL_AO.push({x,z,r:1,k:.4}); } });
  // 이정표
  { const sx=.6, sz=6.7, sg=new THREE.Group(); sg.position.set(sx,0,sz); par.add(sg); const p=vlPutter(sg);
    p(B(.16,2.6,.16,.6),M.wood,0,1.3,0); p(new THREE.ConeGeometry(.14,.18,4),M.wood,0,2.68,0,0,Math.PI/4,0);
    const sign=(txt,y,tx,tz)=>{ const tex=vlTex(vlCanvas(512,128,c=>{ c.fillStyle='#8a6240'; c.fillRect(0,0,512,128); c.strokeStyle='#5a3b26'; c.lineWidth=10; c.strokeRect(5,5,502,118); c.fillStyle='#fff3d6'; c.font='bold 62px Jua, "Malgun Gothic", sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,256,68); }));
      const tm=new THREE.MeshStandardMaterial({map:tex,roughness:.8}), m=new THREE.Mesh(new THREE.BoxGeometry(1.5,.36,.06),[M.wood,M.wood,M.wood,M.wood,tm,tm]); m.castShadow=true;
      const a=new THREE.Group(); a.position.set(0,y,0); a.rotation.y=Math.atan2(-(tz-sz),tx-sx); sg.add(a); m.position.set(.66,0,0); a.add(m); };
    sign('🏠 내 집',2.28,VL_DOORS[0].x,VL_DOORS[0].z); sign('🛒 상점',1.86,VL_DOORS[1].x,VL_DOORS[1].z); sign('⚔️ 던전',1.44,VL_DOORS[2].x,VL_DOORS[2].z);
    VL_COLL.push({x:sx,z:sz,r:.25}); VL.camObs.push({x:sx,z:sz,r:1.15,h:2.7}); }
  // 과일 가판대 (상점 옆)
  { const s=new THREE.Group(); s.position.set(-17.5,0,-7.5); s.rotation.y=.5; g.add(s); const p=vlPutter(s);
    for (const [x,z] of [[-1.3,-.7],[1.3,-.7],[-1.3,.7],[1.3,.7]]) p(B(.12,2.3,.12,.6),M.wood,x,1.15,z);
    for (const k of [1,-1]) p(B(3.0,.05,1.0,1),M.cloth,0,2.42,k*.44,k*.34,0,0);
    p(B(2.6,.1,1.15,1),M.woodLight,0,.9,0); p(B(2.6,.75,.06,1),M.woodLight,0,.5,.56); p(B(2.6,.75,.06,1),M.woodLight,0,.5,-.56);
    const fm=[new THREE.MeshStandardMaterial({color:0xd8342a,roughness:.5}),new THREE.MeshStandardMaterial({color:0xf2a12c,roughness:.5}),new THREE.MeshStandardMaterial({color:0x8fc23f,roughness:.5}),new THREE.MeshStandardMaterial({color:0x7a3a8a,roughness:.5})];
    [-.85,0,.85].forEach((x,i)=>{ p(new THREE.BoxGeometry(.7,.24,.5),M.crate,x,1.07,.1); for (let k=0;k<9;k++) p(new THREE.SphereGeometry(.085,8,6),fm[(i+(k%3===0?1:0))%fm.length],x+((k%3)-1)*.2,1.24,.1+(Math.floor(k/3)-1)*.14); });
    p(new THREE.BoxGeometry(.6,.6,.6),M.crate,1.9,.3,.4,0,.3,0); p(new THREE.BoxGeometry(.5,.5,.5),M.crate,1.85,.85,.35,0,.1,0);
    VL_COLL.push({x:-17.5,z:-7.5,r:1.6}); VL_AO.push({x:-17.5,z:-7.5,r:2.4,k:.45}); VL.camObs.push({x:-17.5,z:-7.5,r:1.4,h:2.5}); }
  // 상점 앞 상자 · 연못가 벤치
  [[-25.6,-2.8,.6,.2],[-26.2,-3.4,.5,.6],[-25.9,-3.1,.45,1.2,.6]].forEach(([x,z,s,ry,y])=>{ put(new THREE.BoxGeometry(s,s,s),M.crate,x,(y||0)+s/2,z,0,ry,0); if (!y){ VL_COLL.push({x,z,r:s*.7}); VL_AO.push({x,z,r:s*1.4,k:.4}); } });
  { const b=new THREE.Group(); b.position.set(-3.3,0,-1.1); b.rotation.y=-Math.PI/2; g.add(b); const p=vlPutter(b);
    p(B(1.6,.08,.42,1),M.woodLight,0,.48,0); p(B(1.6,.34,.06,1),M.woodLight,0,.8,-.2,-.15,0,0);
    for (const x of [-.65,.65]){ p(B(.08,.48,.08),M.wood,x,.24,.15); p(B(.08,.48,.08),M.wood,x,.24,-.17); p(B(.08,.45,.08),M.wood,x,.66,-.2,-.15,0,0); }
    VL_COLL.push({x:-3.3,z:-1.1,r:.8}); VL_AO.push({x:-3.3,z:-1.1,r:1.2,k:.35}); }
  vlMerge(g); }

/* ---------- 효과: 떨어지는 낙엽 · 반딧불이 · 굴뚝 연기 · 등불 깜빡임 ---------- */
function vlParticles(par){
  const N=260, im=new THREE.InstancedMesh(new THREE.PlaneGeometry(.2,.2),new THREE.MeshStandardMaterial({map:vlLeafTex(),alphaTest:.5,side:THREE.DoubleSide,roughness:.8}),N);
  im.frustumCulled=false; const st=[], pal=['#e8572a','#f07a2c','#f39a34','#d9432a','#f2b13c','#c9341f'];
  for (let i=0;i<N;i++){ st.push({x:0,y:-1,z:0,v:0,ph:Math.random()*6.283,rs:.6+Math.random()*1.6,rest:Math.random()*3}); im.setColorAt(i,VL_LIN(pal[i%pal.length]).multiplyScalar(.9+Math.random()*.2)); }
  par.add(im); VL.fall={im,st,N,n:N};
  // 반딧불이
  const spots=[]; for (let i=0;i<24;i++){ const a=i/24*Math.PI*2; spots.push([VL_POND.x+Math.cos(a)*(vlPondR(a)+.6),VL_POND.z+Math.sin(a)*(vlPondR(a)+.6)]); }
  VL_BUSHES.forEach(b=>spots.push([b[0],b[1]]));
  const FN=110, fp=new Float32Array(FN*3), fph=new Float32Array(FN);
  for (let i=0;i<FN;i++){ const s=spots[(Math.random()*spots.length)|0], a=Math.random()*6.283, r=Math.random()*2.2; fp[i*3]=s[0]+Math.cos(a)*r; fp[i*3+1]=.35+Math.random()*1.4; fp[i*3+2]=s[1]+Math.sin(a)*r; fph[i]=Math.random()*6.283; }
  const fg=new THREE.BufferGeometry(); fg.setAttribute('position',new THREE.BufferAttribute(fp,3)); fg.setAttribute('aPh',new THREE.BufferAttribute(fph,1));
  VL.ffU={uTime:{value:0},uScale:{value:400},uCol:{value:new THREE.Color(1,.82,.38)}};
  const ff=new THREE.Points(fg,new THREE.ShaderMaterial({uniforms:VL.ffU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute float aPh; uniform float uTime,uScale; varying float vA;
      void main(){ vec3 p=position+vec3(sin(uTime*.7+aPh*3.)*.7,sin(uTime*1.1+aPh*5.)*.35,cos(uTime*.6+aPh*2.)*.7); vec4 mv=modelViewMatrix*vec4(p,1.);
        float bl=smoothstep(.35,1.,sin(uTime*1.9+aPh*11.)*.5+.5); vA=bl*(1.-smoothstep(28.,48.,-mv.z)); gl_PointSize=clamp(uScale*.16*(.55+bl*.6)/(-mv.z),1.,48.); gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`uniform vec3 uCol; varying float vA; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.0,d); a*=a; gl_FragColor=vec4(uCol*(1.+a*1.5),a*vA); }`}));
  ff.frustumCulled=false; par.add(ff); VL.ff=ff;
  // 굴뚝 연기
  const src=VL.smokeSrc, per=18, SN=src.length*per, sp=new Float32Array(SN*3), sph=new Float32Array(SN), ssd=new Float32Array(SN);
  src.forEach((o,j)=>{ for (let k=0;k<per;k++){ const i=j*per+k; sp[i*3]=o.x; sp[i*3+1]=o.y; sp[i*3+2]=o.z; sph[i]=k/per+Math.random()*.03; ssd[i]=Math.random(); } });
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(sp,3)); sg.setAttribute('aPh',new THREE.BufferAttribute(sph,1)); sg.setAttribute('aSd',new THREE.BufferAttribute(ssd,1));
  VL.smU={uTime:{value:0},uScale:{value:400},uCol:{value:VL_LIN('#9a92a0')}};
  const sm=new THREE.Points(sg,new THREE.ShaderMaterial({uniforms:VL.smU,transparent:true,depthWrite:false,
    vertexShader:`attribute float aPh,aSd; uniform float uTime,uScale; varying float vA,vL;
      void main(){ float life=fract(uTime*.085+aPh); vec3 p=position+vec3((.9+aSd*.6)*life*life*2.4+sin(life*7.+aSd*20.)*.25*life,life*6.5,(.4+aSd*.5)*life*life*1.5);
        vec4 mv=modelViewMatrix*vec4(p,1.); vL=life; vA=smoothstep(0.,.12,life)*(1.-life); gl_PointSize=clamp(uScale*(.45+life*1.7)/(-mv.z),1.,180.); gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`uniform vec3 uCol; varying float vA,vL; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.1,d)*vA*.55; gl_FragColor=vec4(uCol*mix(1.15,.85,vL),a);
      #include <tonemapping_fragment>
    }`}));
  sm.frustumCulled=false; par.add(sm); VL.smoke=sm;
}
function vlFallSpawn(s,first){
  const near=VL_TREES.filter(t=>t[3]!=='gr'&&Math.hypot(t[0]-P.x,t[1]-P.z)<34);
  if (!near.length){ s.y=-1; s.rest=2; return; }
  const t=near[(Math.random()*near.length)|0], sc=t[2], a=Math.random()*6.283, r=Math.sqrt(Math.random())*3.2*sc;
  s.x=t[0]+Math.cos(a)*r; s.z=t[1]+Math.sin(a)*r; s.y=first?.5+Math.random()*7*sc:(3.5+Math.random()*4)*sc; s.v=.5+Math.random()*.5; s.rest=0; }
function vlParticlesReset(){ const F=VL.fall; if (!F) return; F.n=Math.floor(F.N*(QCUR==='high'?1:QCUR==='medium'?.6:.25)); F.st.forEach(s=>vlFallSpawn(s,true));
  const Z=new THREE.Matrix4().makeScale(0,0,0); for (let i=F.n;i<F.N;i++) F.im.setMatrixAt(i,Z); F.im.instanceMatrix.needsUpdate=true;
  if (VL.ff) VL.ff.visible=QCUR!=='low'; if (VL.smoke) VL.smoke.visible=QCUR!=='low'; }
const _vlM4=new THREE.Matrix4(), _vlQ=new THREE.Quaternion(), _vlE=new THREE.Euler(), _vlP=new THREE.Vector3(), _vlS1=new THREE.Vector3(1,1,1), _vlZ=new THREE.Matrix4().makeScale(0,0,0), _vlDB=new THREE.Vector2();
function vlParticlesTick(dt,real){
  const F=VL.fall; if (F){ for (let i=0;i<F.n;i++){ const s=F.st[i];
      if (s.y<0){ if ((s.rest-=dt)<=0) vlFallSpawn(s,false); F.im.setMatrixAt(i,_vlZ); continue; }
      if (s.y<=.03){ s.y=.02; s.rest+=dt; if (s.rest>5){ s.y=-1; s.rest=.3+Math.random()*2; } _vlE.set(-Math.PI/2,0,s.ph); }
      else { s.y-=s.v*dt; s.x+=(Math.sin(real*1.3+s.ph)*.55+.35)*dt; s.z+=(Math.cos(real*1.1+s.ph*1.7)*.45+.15)*dt; _vlE.set(real*s.rs+s.ph,real*s.rs*.7,s.ph); }
      _vlQ.setFromEuler(_vlE); _vlM4.compose(_vlP.set(s.x,s.y,s.z),_vlQ,_vlS1); F.im.setMatrixAt(i,_vlM4); }
    F.im.instanceMatrix.needsUpdate=true; }
  renderer.getDrawingBufferSize(_vlDB); const sc=_vlDB.y/(2*Math.tan(camera.fov*Math.PI/360));
  if (VL.ffU){ VL.ffU.uTime.value=real; VL.ffU.uScale.value=sc; } if (VL.smU){ VL.smU.uTime.value=real; VL.smU.uScale.value=sc; }
  VL.halos.forEach((h,i)=>{ h.material.opacity=.5+.07*Math.sin(real*7.3+i*1.7)+.04*Math.sin(real*13.1+i); });
}

/* ---------- 카메라가 집 · 나무 기둥 · 가로등에 가리지 않게 ---------- */
function vlCamBlock(x,y,z){
  for (const H of VL_HOUSES){ const c=Math.cos(H.r), s=Math.sin(H.r), dx=x-H.x, dz=z-H.z, lx=dx*c-dz*s, lz=dx*s+dz*c, ex=H.w/2+.8+(H.cozy&&lx>0?2.3:0), ez=H.d/2+(H.cozy?.8:1.2);
    if (Math.abs(lx)<ex&&Math.abs(lz)<ez&&y<H.h+(H.cozy?8.5:5.2)) return true; }
  for (const o of VL.camObs) if (y<o.h&&Math.hypot(x-o.x,z-o.z)<o.r+.3) return true;
  return false; }
