/* 사회 게임 RPG · 🏡 노을 마을 (돌아다니는 마을 · 1단계)
   로비에서 들어가요. 내 캐릭터(꾸민 모습 그대로)로 걸어 다니고, 건물 앞 발판에서 상점 · 던전(지금 열린 게임) · 내 집(준비 중)으로 들어가요.
   몬스터 · 퀴즈 · 기록이 없는 공간이라 점수에는 영향이 없어요. 파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
const VL={on:false,joining:false,built:false,yaw:0,pitch:.2,dist:6.5,run:false,slow:1,drag:null,ks:1,door:null,callT:0,toastT:0,backShop:false,
  U:null,grass:null,leaves:null,sky:null,skyU:null,rays:null,mini:null,miniSrc:null};
const VL_LIN=h=>new THREE.Color(h).convertSRGBToLinear();
// 자연 에셋(나무 · 풀 뭉치)의 바람 · 캐릭터 앞 잎 비치기: 마을과 들판 마을이 같은 값을 함께 써요
const NAT_U={uTime:{value:0},uCam:{value:new THREE.Vector3(0,-999,0)},uPlr:{value:new THREE.Vector3(0,-999,0)}};
let vlSeed=7; const vlR=()=>{ vlSeed=(vlSeed*16807)%2147483647; return (vlSeed-1)/2147483646; }, vlS=(a,b)=>a+vlR()*(b-a);
const VL_SUN=new THREE.Vector3(-.42,.2,-.88).normalize();
const VL_MAP=140, VL_PATH_W=1.7;
// 큰길: 서쪽 끝은 마을 밖으로 이어지고, 동쪽 끝은 던전 입구 앞마당에서 끝나요
const VL_PATH=[[-62,34],[-40,22],[-20,12],[-4,6],[10,0],[24,-10],[40,-26]].map(p=>new THREE.Vector2(p[0],p[1]));
const VL_SIDE=[[3,5.6],[4,1],[5.2,-3.5],[6.2,-8.5],[6.6,-12.6]].map(p=>new THREE.Vector2(p[0],p[1]));
const VL_HOUSES=[{x:7,z:-20,r:0,w:10,d:7,h:4.4,roof:'#6d5a8e',cozy:true},{x:-24,z:-8,r:.5,w:8,d:6.5,h:4.2,roof:'#a2553f',shut:'#3f6b4a',shop:true},{x:-8,z:27,r:Math.PI+.25,w:9,d:6.5,h:4.4,roof:'#56688c',shut:'#3f5f8a',chim:-1},{x:30,z:16,r:Math.PI-.4,w:8.5,d:6,h:4.2,roof:'#7a5a7a',shut:'#8a3f3f'}];
const VL_TREES=[[-8,-6,1.15,'au'],[16,6,1.3,'au'],[-30,10,1.2,'au'],[22,-24,1.1,'yl'],[-14,-24,1.05,'au'],[-2,16,.95,'yl'],[34,-6,1.2,'au'],[-40,-16,1.25,'gr'],[12,24,1.1,'gr'],[-20,30,1.15,'au'],[44,8,1.0,'yl'],[-44,26,1.05,'au'],[0,-36,1.2,'au'],[26,-40,1.0,'gr']];
// 덤불: 길 위 · 길가에 있던 것들은 나무 곁 · 울타리 곁 · 연못가로 옮겼어요 (지나갈 수 있지만 느려져요)
const VL_BUSHES=[[-2.2,-4.0,'rd'],[-15,-3.5,'au'],[13.5,9,'au'],[19.5,8.5,'rd'],[-1,-11,'gr'],[13,-12,'gr'],[-17.1,19.3,'au'],[21,-17,'rd'],[-17,2,'gr'],[0,12.5,'au'],[-24,26,'rd'],[29,-26,'au'],[30,0,'gr'],[-10,-14,'rd'],[8,14,'gr'],[-34,4,'au'],[20,12,'rd']];
// 던전 입구: 큰길이 끝나는 동쪽 숲 가장자리, 바위 언덕에 박힌 돌 아치 (앞쪽이 길을 바라봐요)
const VL_PORTAL={x:43.4,z:-29.4,r:-Math.PI/4};
const vlPortalW=(lx,lz)=>({x:VL_PORTAL.x+lx*Math.cos(VL_PORTAL.r)+lz*Math.sin(VL_PORTAL.r),z:VL_PORTAL.z-lx*Math.sin(VL_PORTAL.r)+lz*Math.cos(VL_PORTAL.r)});
// 가로등: 큰길을 따라 약 12.5m마다 양쪽을 번갈아 세우고, 등불 팔은 길 쪽을 향해요 (시작 위치 앞 시야는 비워 둬요) [x, z, 회전]
const VL_LAMPS=[[-33.58,21.47,2.05],[-24.64,11.38,-1.127],[-11.18,11.24,1.908],[-5.39,3.86,-1.197],[12.34,1.53,2.103],[19.74,-9.69,-.89],[31.28,-13.45,2.355]];
const VL_COLL=[], VL_SOFT=[];   // VL_SOFT: 덤불처럼 지나갈 수 있지만 느려지는 곳
const vlSegD=(p,a,b)=>{ const abx=b.x-a.x, aby=b.y-a.y, t=Math.max(0,Math.min(1,((p.x-a.x)*abx+(p.y-a.y)*aby)/(abx*abx+aby*aby))); return Math.hypot(p.x-(a.x+abx*t),p.y-(a.y+aby*t)); };
const VL_PATHC=new THREE.SplineCurve(VL_PATH), VL_PATHP=VL_PATHC.getPoints(160), VL_SIDEC=new THREE.SplineCurve(VL_SIDE), VL_SIDEP=VL_SIDEC.getPoints(40);
// 내 집 앞 꽃밭 두 개 · 작은 정원등 두 개 (디딤돌 길 양옆)
const VL_GARDEN=(()=>{ const L=VL_SIDEC.getLength(), at=d=>{ const p=VL_SIDEC.getPointAt(d/L), t=VL_SIDEC.getTangentAt(d/L).normalize(); return {p,t,n:new THREE.Vector2(-t.y,t.x)}; };
  const b=at(13.5), l=at(9), ry=Math.atan2(b.t.x,b.t.y);
  return {beds:[-1,1].map(s=>({x:b.p.x+b.n.x*s*1.85,z:b.p.y+b.n.y*s*1.85,ry,w:1.1,l:3.6})),lights:[-1,1].map(s=>({x:l.p.x+l.n.x*s*1.25,z:l.p.y+l.n.y*s*1.25}))}; })();
function vlPolyD(pts,x,z){ const p=new THREE.Vector2(x,z); let d=1e9; for (let i=0;i<pts.length-1;i++) d=Math.min(d,vlSegD(p,pts[i],pts[i+1])); return d; }
function vlInHouse(x,z,pad){ for (const H of VL_HOUSES){ const c=Math.cos(H.r), s=Math.sin(H.r), dx=x-H.x, dz=z-H.z, lx=dx*c-dz*s, lz=dx*s+dz*c; if (Math.abs(lx)<H.w/2+pad&&Math.abs(lz)<H.d/2+pad) return true; } return false; }
const VL_DPINES=[[-9.6,-5.2,1.25],[9.9,-4.8,1.35],[-5.4,-11.8,1.15],[5.8,-12.2,1.4],[.3,-14.5,1.2],[-12.5,1,1.05],[12.8,.6,1.1]];   // 던전 언덕 뒤 · 옆 소나무 (아치 기준 좌표)
const vlFront=(H,d)=>({x:H.x+Math.sin(H.r)*d,z:H.z+Math.cos(H.r)*d});
const VL_DOORS=[
  {id:'home',...vlFront(VL_HOUSES[0],VL_HOUSES[0].d/2+1.5),sign:'🏠 내 집'},
  {id:'shop',...vlFront(VL_HOUSES[1],VL_HOUSES[1].d/2+1.6),sign:'🛒 상점'},
  {id:'dungeon',x:VL_PORTAL.x+Math.sin(VL_PORTAL.r)*2.2,z:VL_PORTAL.z+Math.cos(VL_PORTAL.r)*2.2,sign:'⚔️ 던전 입구'}];

/* ---------- 재질 · 텍스처 ---------- */
function vlCanvas(w,h,fn){ const cv=document.createElement('canvas'); cv.width=w; cv.height=h; fn(cv.getContext('2d'),cv); return cv; }
function vlTex(cv,rep){ const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; t.anisotropy=ANISO; if (rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; } return t; }
const vlRnd=(a,b)=>a+Math.random()*(b-a);

function buildVillage(){
  const R=new THREE.Group(); scene.add(R); VL.root=R; VL_COLL.length=0; VL_SOFT.length=0; VL.camObs=[]; VL.halos=[]; VL.smokeSrc=[]; VL_AO.length=0; VL.bedFlowers=[]; VL.torches=[];
  const add=o=>{ R.add(o); return o; };
  const U=VL.U={uTime:{value:0},uPlayer:{value:new THREE.Vector3()},uBase:{value:VL_LIN('#3b4f1a')},uTip:{value:VL_LIN('#9ea23a')},uTip2:{value:VL_LIN('#5f8a30')},
    uSunCol:{value:VL_LIN('#ffb46e')},uSun:{value:VL_SUN.clone()},uFog:{value:new THREE.Color()},uFogN:{value:12},uFogF:{value:95},
    uCam:NAT_U.uCam,uPlr:NAT_U.uPlr,uSoil:{value:VL_LIN('#44611c')}}; U.uTime=NAT_U.uTime;
  VL_TREES.forEach(t=>VL_COLL.push({x:t[0],z:t[1],r:.7*t[2]}));

  /* 하늘 (해 · 노을 빛) */
  const skyU=VL.skyU={uTop:{value:VL_LIN('#7fa1cf')},uHor:{value:VL_LIN('#ffc58e')},uFog:{value:new THREE.Color()},uSun:{value:VL_SUN.clone()},uSunCol:{value:VL_LIN('#ffb46e')},uTime:{value:0},uCloud:{value:1},
    uCov:{value:.5},uCShade:{value:new THREE.Color(.24,.16,.24)},uCAdd:{value:new THREE.Color(.22,.1,.08)},uStar:{value:0},uDisc:{value:1},uSunPow:{value:600}};
  VL.sky=add(new THREE.Mesh(new THREE.SphereGeometry(280,40,20),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
    vertexShader:'varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader:`uniform vec3 uTop,uHor,uSun,uSunCol,uFog,uCShade,uCAdd; uniform float uTime,uCloud,uCov,uStar,uDisc,uSunPow; varying vec3 vD;
      float h2(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h2(i),h2(i+vec2(1.,0.)),f.x),mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),f.x),f.y); }
      float fbm(vec2 p){ float v=0., a=.5; for (int i=0;i<5;i++){ v+=a*vn(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return v; }
      vec2 cuv(vec3 d){ vec2 c=d.xz/(max(d.y,0.)+.16)*2.1; c.x*=.55; return c+vec2(uTime*.006,uTime*.0024); }
      void main(){ vec3 d=normalize(vD); float h=max(d.y,0.); vec3 c=mix(uHor,uTop,pow(h,.55)); float s=max(dot(d,uSun),0.);
        c+=uSunCol*(pow(s,uSunPow)*6.*uDisc+pow(s,24.)*.55+pow(s,4.)*.18);
        if (uStar>.01&&d.y>0.){ vec2 sp=d.xz/(d.y+.4)*64.; vec2 ci=floor(sp); float r=h2(ci); if (r>.982){ vec2 f=fract(sp)-.5-(vec2(h2(ci+3.1),h2(ci+7.7))-.5)*.5; float st=smoothstep(.12,.0,length(f))*(.55+.45*sin(uTime*1.7+r*91.)); c+=vec3(.85,.9,1.)*st*uStar*smoothstep(.04,.3,d.y)*(.4+.6*fract(r*37.)); } }
        if (uCloud>.5&&d.y>0.){ vec2 cp=cuv(d); float n=fbm(cp);
          float cov=smoothstep(uCov,uCov+.22,n)*smoothstep(.0,.16,d.y)*(1.-smoothstep(.65,.98,d.y));
          if (cov>.001){ vec2 dir=normalize(cuv(uSun)-cp+1e-4); float n2=fbm(cp+dir*.09); float lit=clamp((n-n2)*5.+.5,0.,1.);
            vec3 shade=uCShade, litc=uSunCol*1.3+uCAdd;
            vec3 cc=mix(shade,litc,lit*(.35+.65*pow(s,1.5)));
            cc+=uSunCol*pow(s,10.)*1.4*(1.-smoothstep(.2,.6,cov));
            c=mix(c,cc,cov*.88); } }
        c=mix(uFog,c,smoothstep(-.02,.22,d.y));
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
      }`})));
  VL.sky.renderOrder=-2; VL.sky.frustumCulled=false;
  vlMountains(R);

  /* 바닥: 풀밭 · 흙길 텍스처를 섞는 셰이더 (04w) */
  vlBuildGround(R);

  /* 풀: 캐릭터 주변(한 변 약 50m)에 가는 풀잎을 아주 빽빽하게. 움직이면 풀밭이 따라와요(먼 곳은 바닥 그림 · 풀 뭉치 · 안개).
     뿌리 색은 바닥 그림에서 그대로 가져와서 바닥과 이어져 보여요. 길 · 집 · 문 앞은 '풀 지도(mask)'로 비워요 */
  const MS=512, mcv=vlCanvas(MS,MS,()=>{}), mg=mcv.getContext('2d'), mp=v=>(v/VL_MAP+.5)*MS;
  { const A=vlCanvas(MS,MS,g=>{ g.fillStyle='#fff'; g.fillRect(0,0,MS,MS); g.lineCap='round'; g.lineJoin='round';
      const st=(pts,w)=>{ g.lineWidth=w/VL_MAP*MS; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(mp(p.x),mp(p.y)):g.moveTo(mp(p.x),mp(p.y))); g.stroke(); };
      const box=(x,z,r,w,d,ex)=>{ const k=MS/VL_MAP; g.save(); g.translate(mp(x),mp(z)); g.rotate(-r); g.fillRect(-w/2*k,-d/2*k,(w+(ex||0))*k,d*k); g.restore(); };
      const disc=(x,z,r)=>{ g.beginPath(); g.arc(mp(x),mp(z),r/VL_MAP*MS,0,7); g.fill(); };
      // 길가 · 내 집 마당 · 집 둘레 · 시작 자리: 짧게 깎은 풀 (회색)
      g.filter='blur(6px)'; g.strokeStyle=g.fillStyle='#555';
      st(VL_PATHP,VL_PATH_W*2+4.6); st(VL_SIDEP,6.6); box(7.5,-19.2,0,19,13.6); disc(5.6,8.2,3.2);
      VL_HOUSES.forEach(H=>box(H.x,H.z,H.r,H.w+5,H.d+5,H.cozy?3.4:0));
      // 풀 없음 (검정): 길 · 디딤돌 · 집 · 문 앞 · 꽃밭 · 던전 앞마당과 바위 언덕 · 연못 · 나무 밑
      g.filter='blur(2px)'; g.strokeStyle=g.fillStyle='#000';
      st(VL_PATHP,VL_PATH_W*2+.9); st(VL_SIDEP,1.8);
      VL_HOUSES.forEach(H=>box(H.x,H.z,H.r,H.w+.5,H.d+.5,H.cozy?3.4:0));
      VL_DOORS.forEach(d=>{ if (d.id!=='home') disc(d.x,d.z,2.2); });
      { const f=vlPortalW(0,1.6), k=vlPortalW(0,-4.5); disc(f.x,f.z,5.4); disc(k.x,k.z,7.8); }
      VL_GARDEN.beds.forEach(b=>box(b.x,b.z,b.ry,b.w+.3,b.l+.3));
      g.beginPath(); for (let i=0;i<=72;i++){ const a=i/72*Math.PI*2, r=vlPondR(a)+.35, x=VL_POND.x+Math.cos(a)*r, z=VL_POND.z+Math.sin(a)*r; i?g.lineTo(mp(x),mp(z)):g.moveTo(mp(x),mp(z)); } g.fill();
      VL_COLL.forEach(c=>{ if (c.r>.4) disc(c.x,c.z,c.r*.7); }); });
    const B=vlCanvas(MS,MS,g=>{ g.fillStyle='#fff'; g.fillRect(0,0,MS,MS);
      const hor=new THREE.Vector2(-VL_SUN.x,-VL_SUN.z).normalize(), kk=1/Math.max(.25,VL_SUN.y);
      const spot=(x,z,r,k)=>{ const gr=g.createRadialGradient(mp(x),mp(z),0,mp(x),mp(z),r/VL_MAP*MS); gr.addColorStop(0,`rgba(0,0,0,${k})`); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,MS,MS); };
      VL_TREES.forEach(t=>{ const o=Math.min(14,5.5*t[2]*kk*.35); spot(t[0]+hor.x*o,t[1]+hor.y*o,4*t[2],.6); });
      VL_BUSHES.forEach(b=>spot(b[0]+hor.x*.8,b[1]+hor.y*.8,1.6,.45));
      VL_HOUSES.forEach(H=>{ const o=Math.min(10,3*kk*.5); for (let i=-1;i<=1;i++) spot(H.x+hor.x*o+Math.cos(H.r)*i*H.w*.3,H.z+hor.y*o-Math.sin(H.r)*i*H.w*.3,H.d*.7,.55); }); });
    const a=A.getContext('2d').getImageData(0,0,MS,MS).data, b=B.getContext('2d').getImageData(0,0,MS,MS).data, out=mg.createImageData(MS,MS);
    for (let i=0;i<a.length;i+=4){ out.data[i]=a[i]; out.data[i+1]=b[i]; out.data[i+2]=0; out.data[i+3]=255; }
    mg.putImageData(out,0,0);
    VL.maskR=new Uint8Array(MS*MS); VL.maskS=MS; for (let i=0;i<MS*MS;i++) VL.maskR[i]=a[i*4]; }
  VL.maskCv=mcv; const maskT=new THREE.CanvasTexture(mcv); maskT.minFilter=THREE.LinearFilter; maskT.generateMipmaps=false;
  U.uWash={value:.05}; U.uBSat={value:1}; U.uMask={value:maskT}; U.uGround={value:VL.macroTex}; U.uCenter={value:new THREE.Vector2()}; U.uR={value:20}; U.uMap={value:VL_MAP}; U.uDry={value:VL_LIN('#ad7f36')}; U.uGK={value:1.45};
  U.uLightK={value:new THREE.Color(1,1,1)}; U.uShadeK={value:1}; U.uSnow=VL_ENVU.uSnow; U.uWet=VL_ENVU.uWet; U.uPoolT=VL_ENVU.uPoolT; U.uPoolK=VL_ENVU.uPoolK;
  const GMAX=240000, geo=new THREE.InstancedBufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,0, 1,0,0, -.75,.4,0, .75,.4,0, -.4,.75,0, .4,.75,0, 0,1,0],3)); geo.setIndex([0,1,2, 1,3,2, 2,3,4, 3,5,4, 4,5,6]);
  const off=new Float32Array(GMAX*3), pr=new Float32Array(GMAX*4);
  vlSeed=11;
  for (let n=0;n<GMAX;n++){ off[n*3]=vlS(-24,24); off[n*3+2]=vlS(-24,24); pr[n*4]=vlR()*Math.PI*2; pr[n*4+1]=vlS(.6,1.15); pr[n*4+2]=vlS(.012,.024); pr[n*4+3]=vlR(); }
  geo.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,3)); geo.setAttribute('aP',new THREE.InstancedBufferAttribute(pr,4));
  geo.userData={max:GMAX};
  VL.grass=add(new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:U,side:THREE.DoubleSide,
    vertexShader:`attribute vec3 aOff; attribute vec4 aP; uniform float uTime,uR,uMap,uPoolK; uniform vec3 uPlayer,uSoil; uniform vec2 uCenter; uniform sampler2D uMask,uGround,uPoolT;
      varying float vH,vV,vS,vT,vP; varying vec3 vW,vG;
      void main(){
        vec2 rel=mod(aOff.xz-uCenter+uR,2.*uR)-uR; vec2 root=uCenter+rel;
        vec2 uv=vec2(root.x/uMap+.5,1.-(root.y/uMap+.5)); vec4 mk=texture2D(uMask,uv);
        float fade=1.-smoothstep(uR*.72,uR,max(abs(rel.x),abs(rel.y)));
        float pch=.5+.5*sin(root.x*.23+sin(root.y*.17)*2.)*cos(root.y*.19-root.x*.07);
        float tl=smoothstep(.45,.92,mk.r); float hgt=aP.y*mix(.12,.22+.34*pch,tl)*smoothstep(.06,.26,mk.r)*fade; vT=tl;
        float h=position.y; float c=cos(aP.x), s=sin(aP.x);
        vec3 p=vec3(position.x*aP.z*c, h*hgt, position.x*aP.z*s);
        p.xz+=vec2(-s,c)*h*h*hgt*.35;
        float w=sin(uTime*1.3+root.x*.21+root.y*.17)*.55+sin(uTime*2.6+root.x*.7-root.y*.5)*.2+.3; p.xz+=vec2(.85,.45)*w*.35*hgt*h*h;
        vec3 wp=vec3(root.x,0.,root.y)+p; vec2 d=wp.xz-uPlayer.xz; float dl=length(d)+1e-4; float push=smoothstep(1.,.0,dl)*h*tl; wp.xz+=d/dl*push*min(.45,hgt*.8); wp.y-=push*.25*hgt;
        vW=wp; vH=h; vV=aP.w*.6+pch*.4; vS=mk.g; vG=texture2D(uGround,uv).rgb*2.*uSoil; vP=uPoolK>.001?texture2D(uPoolT,uv).r:0.;
        gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.); }`,
    fragmentShader:`uniform vec3 uTip,uTip2,uDry,uSunCol,uSun,uFog,uLightK; uniform float uFogN,uFogF,uTime,uGK,uShadeK,uSnow,uWet,uPoolK,uWash,uBSat; varying float vH,vV,vS,vT,vP; varying vec3 vW,vG;
      void main(){ float sS=mix(1.,vS,uShadeK); vec3 tip=mix(uTip2,uTip,smoothstep(.2,.8,vV)); tip=mix(tip,uDry,smoothstep(.75,1.,vV)*.6); tip=mix(uTip2,tip,.5+.5*vT);
        vec3 base=vG*uGK*mix(.55,1.,sS);
        vec3 alb=mix(base,tip*mix(.55,1.,sS),smoothstep(.0,1.,vH))*(1.-.18*uWet); alb=max(mix(vec3(dot(alb,vec3(.2126,.7152,.0722))),alb,uBSat),0.); vec3 col=alb*uLightK;
        col+=alb*vec3(1.,.66,.3)*vP*uPoolK*1.5;
        col=mix(col,vec3(.8,.84,.9)*uLightK*1.1,uSnow*(.25+.5*vH));
        vec3 V=normalize(vW-cameraPosition); float back=pow(max(dot(V,uSun),0.),5.)*vH*sS; col+=uSunCol*(back*.6+uWash*vH*sS);
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
  VL_BUSHES.forEach(([x,z,kind])=>{ const s=vlS(.8,1.2); crown(x,.85*s,z,1.6*s,1.0*s,1.6*s,Math.round(110*s),PAL[kind],.8,1.2); VL_SOFT.push({x,z,r:1.4*s}); });
  for (let i=0;i<70;i++){ const a=i/70*Math.PI*2+vlS(-.04,.04), r=vlS(68,90), s=vlS(1.3,2); crown(Math.cos(a)*r,5.5*s,Math.sin(a)*r,4.2*s,4*s,4.2*s,70,PAL[['au','yl','gr','au','rd'][(vlR()*5)|0]],1.9*s,2.6*s); }
  { const m=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),leafMat,cards.length), aN=new Float32Array(cards.length*3), q=new THREE.Quaternion(), M=new THREE.Matrix4(), S=new THREE.Vector3();
    cards.forEach((c,i)=>{ q.setFromEuler(c.r); S.setScalar(c.s); M.compose(c.p,q,S); m.setMatrixAt(i,M); m.setColorAt(i,c.c); aN[i*3]=c.n.x; aN[i*3+1]=c.n.y; aN[i*3+2]=c.n.z; });
    m.geometry.setAttribute('aN',new THREE.InstancedBufferAttribute(aN,3));
    m.castShadow=true; m.receiveShadow=true; m.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:ltex,alphaTest:.5,side:THREE.DoubleSide}); m.frustumCulled=false; add(m); VL.leaves=m; }
  // 뾰족 소나무
  { const pine=[]; vlSeed=31; for (let i=0;i<26;i++){ const a=vlS(0,6.3), r=vlS(40,64); pine.push([Math.cos(a)*r,Math.sin(a)*r,vlS(1,1.6)]); } pine.push([-16,-30,1.3],[-30,-26,1.5],[-36,-20,1.2]); VL_DPINES.forEach(([lx,lz,s])=>{ const w=vlPortalW(lx,lz); pine.push([w.x,w.z,s,1]); });
    const m=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,8),new THREE.MeshStandardMaterial({roughness:.9}),pine.length*3), M=new THREE.Matrix4(), q=new THREE.Quaternion(); let k=0;
    pine.forEach(([x,z,s,keep])=>{ if (!keep&&(vlInHouse(x,z,2)||vlPolyD(VL_PATHP,x,z)<VL_PATH_W+2||Math.hypot(x-VL_PORTAL.x,z-VL_PORTAL.z)<9)) return;
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
  vlSeed=5; VL_HOUSES.forEach(H=>H.cozy?vlCozy2(H,R):vlHouse2(H,R));
  VL_TREES.forEach(t=>VL.camObs.push({x:t[0],z:t[1],r:.95*t[2],h:3.8*t[2]}));

  /* 던전 입구: 큰길 끝 바위 언덕 · 돌 아치 · 보랏빛 소용돌이 · 횃불 · 수정 (04w) */
  vlDungeon(R);

  /* 울타리 · 돌기둥 문 · 디딤돌 · 꽃 · 돌 · 소품 */
  const fp=[];
  const fence=(ax,az,bx,bz,ga,gb)=>{ const L=Math.hypot(bx-ax,bz-az), n=Math.floor(L/.32), ang=Math.atan2(bz-az,bx-ax);
    for (let i=0;i<=n;i++){ const t=i/n, d=t*L; if (ga!=null&&d>ga&&d<gb) continue; fp.push({x:ax+(bx-ax)*t,y:.5,z:az+(bz-az)*t,sx:.1,sy:i%6===0?1.25:vlS(.9,1.05),sz:.05,ry:-ang,post:i%6===0}); }
    const seg=(d0,d1)=>{ if (d1-d0<=.1) return; const t=(d0+d1)/2/L; for (const y of [.35,.78]) fp.push({x:ax+(bx-ax)*t,y,z:az+(bz-az)*t,sx:d1-d0,sy:.07,sz:.06,ry:-ang,rail:true}); };
    if (ga!=null){ seg(0,ga); seg(gb,L); } else seg(0,L);
    for (let t=0;t<=1;t+=.5/L) if (ga==null||t*L<ga||t*L>gb) VL_COLL.push({x:ax+(bx-ax)*t,z:az+(bz-az)*t,r:.25}); };
  fence(-2,-12.4,4.8,-12.4); fence(8.6,-12.4,17,-12.4); fence(-2,-12.4,-2,-26); fence(17,-12.4,17,-26);
  fence(-14,40,8,40); fence(-6,10.5,-26,24,6,9);
  { const m=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),vlMats().woodN,fp.length), M=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler();
    fp.forEach((f,i)=>{ e.set(f.rail?0:vlS(-.04,.04),f.ry,f.rail?0:vlS(-.05,.05)); q.setFromEuler(e); M.compose(new THREE.Vector3(f.x,f.rail?f.y:f.sy/2,f.z),q,new THREE.Vector3(f.sx,f.sy,f.sz)); m.setMatrixAt(i,M); m.setColorAt(i,VL_LIN(f.post?'#5e402a':f.rail?'#7a5638':['#8a6442','#7d5a3b','#93704c'][i%3])); });
    m.castShadow=m.receiveShadow=true; add(m); }
  const ST=new THREE.Group(); add(ST);   // 움직이지 않는 작은 소품 (끝에서 하나로 합쳐요)
  for (const x of [5,8.4]){ mesh(ST,vlBox(.75,1.7,.75,1.2),vlMats().stoneLight,x,.85,-12.4); mesh(ST,new THREE.BoxGeometry(.95,.18,.95),white,x,1.78,-12.4); mesh(ST,new THREE.SphereGeometry(.26,14,10),white,x,2.1,-12.4); VL_COLL.push({x,z:-12.4,r:.55}); VL_AO.push({x,z:-12.4,r:.9,k:.4}); }
  mesh(ST,vlBox(1.4,1.1,.08,1),vlMats().woodLight,5.75,.65,-11.8).rotation.y=-1.1;
  // 내 집 앞 디딤돌 길: 바위 대신 집에 어울리는 꽃밭 두 개 · 작은 정원등 두 개
  VL_GARDEN.beds.forEach(b=>vlFlowerBed(b,ST)); VL_GARDEN.lights.forEach(l=>vlGardenLight(l.x,l.z,R));
  if (VL.natOK) vlNatureGround(); else { const nn=26, m=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0xd3cec4,roughness:1}),nn*2), M=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(); let k=0;
    for (let i=0;i<nn;i++){ const p=VL_SIDEC.getPoint(i/(nn-1)); for (let j=0;j<2;j++){ if (j&&vlR()<.4) continue; e.set(0,vlS(0,3),0); q.setFromEuler(e);
      M.compose(new THREE.Vector3(p.x+vlS(-.45,.45),.05,p.y+vlS(-.3,.3)),q,new THREE.Vector3(vlS(.55,.8),.12,vlS(.4,.6))); m.setMatrixAt(k,M); m.setColorAt(k,VL_LIN(['#d6d1c6','#c8c2b6','#e0dbd0'][k%3])); k++; } }
    m.count=k; m.receiveShadow=m.castShadow=true; add(m); }
  const flowers=(kind,cnt,area)=>{ const g=kind==='lav'?new THREE.ConeGeometry(.05,.42,5):new THREE.CylinderGeometry(.075,.075,.02,8);
    const m=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({roughness:.8,emissive:kind==='daisy'?0x222222:0}),cnt), M=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(); let k=0, tries=0;
    while (k<cnt&&tries<cnt*40){ tries++; const [x,z]=area(); if (vlPolyD(VL_PATHP,x,z)<VL_PATH_W+.3||vlPolyD(VL_SIDEP,x,z)<1.1||vlInHouse(x,z,.4)||vlInPond(x,z,.6)) continue;
      const h=kind==='lav'?vlS(.55,.85):kind==='daisy'?vlS(.35,.6):vlS(.4,.62); e.set(vlS(-.25,.25),0,vlS(-.25,.25)); q.setFromEuler(e); M.compose(new THREE.Vector3(x,h,z),q,new THREE.Vector3(1,1,1)); m.setMatrixAt(k,M);
      m.setColorAt(k,VL_LIN(kind==='lav'?['#8a6fd1','#9b7fe0','#7a5fc0'][k%3]:kind==='daisy'?'#ffffff':['#f5c934','#f8d64e','#eeb92a'][k%3])); k++; }
    m.count=k; add(m); };
  const cl=(cs,sp)=>()=>{ const c=cs[(Math.random()*cs.length)|0], a=Math.random()*7, r=Math.sqrt(Math.random())*sp; return [c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r]; };
  if (VL.natOK){ /* 꽃은 MegaKit 꽃 · 보라 꽃밭(Plant_7)으로 */ } else {
  flowers('lav',900,cl([[-9,2],[2,-10],[12,-10],[-18,-2],[18,8],[-4,12],[-28,12],[8,-14]],3.2));
  flowers('daisy',1100,cl([[0,9],[6,9],[-3,4],[10,-2],[-12,10],[14,-6],[-6,-10],[22,4],[-16,20]],4));
  flowers('yel',1300,cl([[-6,-4],[3,-11],[11,-15],[-1,-15],[16,-8],[-20,4],[-12,16],[6,16]],3.5)); }
  if (!VL.natOK) for (let i=0;i<18;i++){ const a=vlS(0,7), r=vlS(6,50), x=Math.cos(a)*r, z=Math.sin(a)*r; if (vlPolyD(VL_PATHP,x,z)<VL_PATH_W+.8||vlInHouse(x,z,1)) continue;
    const s=vlS(.4,1.1), m=mesh(R,new THREE.DodecahedronGeometry(s,0),stone,x,s*.35,z); m.scale.y=.6; m.rotation.set(vlS(0,3),vlS(0,3),0); }
  // 소품
  const lamp=VL.lampMat=new THREE.MeshStandardMaterial({color:0xfff0c0,emissive:0xffc060,emissiveIntensity:1.6,roughness:.5});
  const pot=new THREE.MeshStandardMaterial({color:0xc8743f,roughness:.9}), leafG=new THREE.MeshStandardMaterial({color:0x4f9a34,roughness:.8});
  const potF=(x,z,col)=>{ const FM=vlMats().flowers; mesh(ST,new THREE.CylinderGeometry(.32,.24,.5,12),pot,x,.25,z); mesh(ST,new THREE.TorusGeometry(.31,.04,5,14),pot,x,.5,z).rotation.x=Math.PI/2; mesh(ST,new THREE.SphereGeometry(.22,8,6),leafG,x,.48,z);
    for (let i=0;i<5;i++) mesh(ST,new THREE.SphereGeometry(.12,8,6),col?FM[0]:FM[i%FM.length],x+vlS(-.15,.15),.58+vlS(0,.12),z+vlS(-.15,.15)); VL_AO.push({x,z,r:.6,k:.35}); };
  vlWell(-1.5,-17.5,R); vlBarrel(13.6,-15.2,R); vlBarrel(14.4,-16.1,R,.9); vlBarrel(-.8,-14.2,R);
  potF(3.6,-15.6); potF(10.6,-15.8,'#ff6b8a'); potF(1.2,-13.4,'#ffd84a'); potF(12.2,-13.3);
  mesh(ST,vlBox(.12,1.1,.12,.6),vlMats().wood,9.6,.55,-11.6); mesh(ST,new THREE.BoxGeometry(.45,.38,.6),new THREE.MeshStandardMaterial({color:0xd8402a,roughness:.6}),9.6,1.25,-11.6); mesh(ST,new THREE.CylinderGeometry(.225,.225,.6,12,1,false,0,Math.PI),new THREE.MeshStandardMaterial({color:0xd8402a,roughness:.6}),9.6,1.44,-11.6).rotation.set(Math.PI/2,0,Math.PI/2);
  VL_LAMPS.forEach(([x,z,r])=>vlLamp(x,z,r,R));
  vlBarrel(VL_DOORS[1].x+2.4,VL_DOORS[1].z-.6,R); potF(VL_DOORS[1].x-2.2,VL_DOORS[1].z-.2);
  vlMerge(ST); vlProps(R); vlPond(R);

  /* 장소 이름표 · 발판 */
  VL.pads=[];
  VL_DOORS.forEach(d=>{
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:vlTex(vlCanvas(512,128,g=>{ g.fillStyle='rgba(58,34,48,.82)'; roundRect(g,8,8,496,112,56); g.fill(); g.fillStyle='#ffe3a8'; g.font='bold 62px Jua, "Malgun Gothic", sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(d.sign,256,68); })),transparent:true,depthWrite:false,fog:false}));
    sp.scale.set(3.2,.8,1); sp.position.set(d.x,d.id==='dungeon'?5.9:3.4,d.z); add(sp); d.label=sp;
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.0,1.25,40),new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.75,depthWrite:false,toneMapped:false})); ring.rotation.x=-Math.PI/2; ring.position.set(d.x,.06,d.z); add(ring); VL.pads.push(ring);
  });
  vlParticles(R); vlGroundFinish(); vlEnvBuild(R);
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
  'RockPath_Round_Small_1','RockPath_Round_Small_2','RockPath_Round_Small_3','Plant_7','Plant_7_Big'];
VL.nat={};
// 모델마다 한 번만 불러와요 (들판 마을은 시작할 때 필요한 것만, 마을은 들어갈 때 나머지까지)
const VL_NATP={}; let VL_NATL=null;
// 가볍게 줄인 모델(_s): 나무 기둥 · 바위 · 디딤돌 · 버섯 · 꽃의 폴리곤을 절반 이하로 (잎 카드는 그대로라 모양은 같아요)
const VL_NAT_S=new Set(['Bush_Common_Flowers','Clover_2','CommonTree_1','CommonTree_2','CommonTree_3','CommonTree_4','CommonTree_5','Flower_4_Group','Mushroom_Common',
  'Pine_1','Pine_2','Pine_4','RockPath_Round_Small_1','RockPath_Round_Small_2','RockPath_Round_Small_3','Rock_Medium_1','Rock_Medium_3','TwistedTree_1','TwistedTree_3']);
function vlLoadNat(list){ return Promise.all(list.map(vlNatOne)); }
function vlLoadNature(){
  if (VL.natP) return VL.natP;
  VL.natP=vlLoadNat(VL_NAT).then(()=>{ VL.natOK=Object.keys(VL.nat).length>=VL_NAT.length-3; VL.natDone=true; });
  return VL.natP;
}
function vlNatOne(n){
  if (VL_NATP[n]) return VL_NATP[n];
  if (!VL_NATL) VL_NATL={L:new THREE.GLTFLoader(),TL:new THREE.TextureLoader(),white:{}};
  const L=VL_NATL.L, TL=VL_NATL.TL, white=VL_NATL.white;
  const whiteTex=n=>{ if (!white[n]){ const t=TL.load('env/nature/tex/'+n+'.png'); t.encoding=THREE.sRGBEncoding; t.flipY=false; t.anisotropy=4; white[n]=t; } return white[n]; };
  return VL_NATP[n]=new Promise(res=>L.load('env/nature/'+n+(VL_NAT_S.has(n)?'_s':'')+'.gltf',g=>{ g.scene.updateMatrixWorld(true); const parts=[];
    g.scene.traverse(o=>{ if (!o.isMesh) return; const m=o.material, leaf=/Leaves|Leaf_Pine|Grass|Flowers/.test(m.name);
      if (m.map) m.map.anisotropy=4;
      if (leaf){ m.alphaTest=.45; m.side=THREE.DoubleSide; m.transparent=false;
        if (m.name==='Leaves_NormalTree') m.map=whiteTex('Leaves_NormalTree'); if (m.name==='Leaves_TwistedTree') m.map=whiteTex('Leaves_TwistedTree');
        m.onBeforeCompile=sh=>{ sh.uniforms.uTime=NAT_U.uTime; sh.uniforms.uCam=NAT_U.uCam; sh.uniforms.uPlr=NAT_U.uPlr;
          sh.vertexShader='uniform float uTime;\nuniform vec3 uPlr;\nvarying vec3 vWP;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n gl_Position=projectionMatrix*viewMatrix*vec4(vWP,1.);').replace('#include <begin_vertex>',
          '#include <begin_vertex>\n#ifdef USE_INSTANCING\n float ph=instanceMatrix[3].x*.37+instanceMatrix[3].z*.29;\n#else\n float ph=0.;\n#endif\n float hh=max(position.y,0.); transformed.x+=sin(uTime*1.5+ph)*.035*hh; transformed.z+=cos(uTime*1.2+ph*1.3)*.035*hh;\n vec4 vwp=vec4(transformed,1.);\n#ifdef USE_INSTANCING\n vwp=instanceMatrix*vwp;\n#endif\n vWP=(modelMatrix*vwp).xyz;\n { vec2 pd=vWP.xz-uPlr.xz; float pl=length(pd)+1e-4; float pk=(1.-smoothstep(.2,1.3,pl))*smoothstep(.2,.6,vWP.y)*(1.-smoothstep(1.5,2.3,vWP.y)); vWP.xz+=pd/pl*pk*.4; vWP.y-=pk*.08; }');
          sh.fragmentShader='uniform vec3 uCam,uPlr;\nvarying vec3 vWP;\n'+sh.fragmentShader.replace('#include <clipping_planes_fragment>',
          '{ vec3 ab=uPlr-uCam; float tt=clamp(dot(vWP-uCam,ab)/max(dot(ab,ab),1e-4),0.,1.); float dd=length(vWP-(uCam+ab*tt)); if (tt<.9){ float rr=.55+tt*1.15; float k=smoothstep(rr*.5,rr,dd); float di=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715)))); if (k<di) discard; } }\n#include <clipping_planes_fragment>'); };
        m.customProgramCacheKey=()=>'vlwind'+m.name; }
      if (/^Grass_/.test(n)) m.color.multiply(new THREE.Color(0.74,0.88,0.66)); else if (/^(Clover|Fern|Plant_1)/.test(n)) m.color.multiply(new THREE.Color(0.84,0.9,0.76));   // 풀 뭉치도 풀잎과 같은 진한 색
      m.roughness=.9; m.metalness=0; if (m.name==='PathRocks') m.color.setRGB(1.45,1.4,1.32); if (m.name==='Rocks') m.color.setRGB(1.2,1.15,1.08);
      parts.push({geo:o.geometry,mat:m,m:o.matrixWorld.clone(),leaf,tint:m.name==='Leaves_NormalTree'||m.name==='Leaves_TwistedTree'}); });
    VL.nat[n]=parts; res(); },undefined,()=>res()));
}
/* 모델 하나를 여러 곳에 (InstancedMesh). P: [{x,y,z,ry,s,c}] · c는 잎 색 */
function vlInst(name,P,opt){
  const parts=VL.nat[name], out=[]; if (!parts||!P.length) return out;
  const M=new THREE.Matrix4(), T=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), S=new THREE.Vector3(), V=new THREE.Vector3();
  parts.forEach(pt=>{ let mat=pt.mat; if (opt&&opt.col){ mat=pt.mat.clone(); mat.color.multiply(opt.col); }   // 색만 바꾼 복사본 (인스턴스 색을 쓰면 같은 재질을 쓰는 다른 바위와 셰이더가 엇갈려요)
    const im=new THREE.InstancedMesh(pt.geo,mat,P.length);
    P.forEach((p,i)=>{ e.set(0,p.ry||0,0); q.setFromEuler(e); S.setScalar(p.s||1); T.compose(V.set(p.x,p.y||0,p.z),q,S); M.multiplyMatrices(T,pt.m); im.setMatrixAt(i,M);
      if (pt.tint) im.setColorAt(i,p.c||new THREE.Color(1,1,1)); });
    const sh=!opt||opt.shadow!==false; im.castShadow=sh; im.receiveShadow=true; im.frustumCulled=false;
    if (pt.leaf&&sh) im.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:pt.mat.map,alphaTest:.45,side:THREE.DoubleSide});
    if (!opt||opt.cull!==false) natCullReg(im,sh);   // 화면 밖 나무·풀은 안 그려요 (러너는 본마다 따로 거르니 빼요)
    if (opt&&opt.lod){ (VL.lod=VL.lod||[]).push({im,n:P.length}); }
    scene.add(im); out.push(im); });
  return out;
}
/* ---------- 화면 밖 자연물 거르기 ----------
   나무 · 풀 뭉치 · 꽃 · 바위를 한 묶음(InstancedMesh)으로 그리면 three.js는 묶음 전체를 늘 그려요 (맵 반대편 것까지).
   매 프레임 카메라에 보이는 것(+ 그림자가 화면에 드리울 것)만 앞으로 모아 개수를 줄여요. 보이는 목록이 바뀔 때만 다시 올려요. */
const NATC={list:[],fr:new THREE.Frustum(),pm:new THREE.Matrix4()};
function natCullReg(im,cast){
  const g=im.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
  const bs=g.boundingSphere, n=im.count, sph=new Float32Array(n*4), M=new THREE.Matrix4(), V=new THREE.Vector3();
  for (let i=0;i<n;i++){ im.getMatrixAt(i,M); V.copy(bs.center).applyMatrix4(M); sph[i*4]=V.x; sph[i*4+1]=V.y; sph[i*4+2]=V.z; sph[i*4+3]=bs.radius*M.getMaxScaleOnAxis()+.6; }
  const r={im,n,lim:n,full:im.instanceMatrix.array.slice(0,n*16),col:im.instanceColor?im.instanceColor.array.slice(0,n*3):null,sph,cast:!!cast,vis:new Uint8Array(n),last:-1,auto:true};
  NATC.list.push(r); im.userData.natc=r; return r;
}
function natSeen(o){ for (let p=o.parent;p;p=p.parent){ if (!p.visible) return false; if (p===scene) return true; } return false; }
function natCullTick(){
  const L=NATC.list; if (!L.length) return;
  camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  NATC.pm.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse); NATC.fr.setFromProjectionMatrix(NATC.pm);
  const pl=NATC.fr.planes, ax=pl[0].normal.x,ay=pl[0].normal.y,az=pl[0].normal.z,ad=pl[0].constant, bx=pl[1].normal.x,by=pl[1].normal.y,bz=pl[1].normal.z,bd=pl[1].constant,
    cx=pl[2].normal.x,cy=pl[2].normal.y,cz=pl[2].normal.z,cd=pl[2].constant, dx=pl[3].normal.x,dy=pl[3].normal.y,dz=pl[3].normal.z,dd=pl[3].constant,
    ex=pl[4].normal.x,ey=pl[4].normal.y,ez=pl[4].normal.z,ed=pl[4].constant, fx2=pl[5].normal.x,fy=pl[5].normal.y,fz2=pl[5].normal.z,fd=pl[5].constant;
  const inF=(x,y,z,r)=>ax*x+ay*y+az*z+ad>-r&&bx*x+by*y+bz*z+bd>-r&&cx*x+cy*y+cz*z+cd>-r&&dx*x+dy*y+dz*z+dd>-r&&ex*x+ey*y+ez*z+ed>-r&&fx2*x+fy*y+fz2*z+fd>-r;
  // 그림자: 키 h인 물체의 그림자는 땅 위 (해 반대쪽으로) h·(sx,sz)만큼 뻗어요 → 그 중간에 커진 구로 한 번 더 확인
  const lx=sun.position.x-sun.target.position.x, ly=Math.max(.2,sun.position.y-sun.target.position.y), lz=sun.position.z-sun.target.position.z, sx=-lx/ly, sz=-lz/ly, sl=Math.hypot(sx,sz), shOn=sun.castShadow&&renderer.shadowMap.enabled&&!SH_PAUSED;
  for (const r of L){
    const im=r.im; if (!natSeen(im)) continue;
    const n=Math.min(r.n,r.lim), s=r.sph, vis=r.vis, e=im.matrixWorld.elements; let ch=n!==r.last;
    const id=e[0]===1&&e[5]===1&&e[10]===1&&e[12]===0&&e[13]===0&&e[14]===0&&e[1]===0&&e[2]===0&&e[4]===0&&e[6]===0&&e[8]===0&&e[9]===0, sc=id?1:Math.hypot(e[0],e[1],e[2]);   // 묶음을 옮겨 둔 경우도 맞게
    for (let i=0;i<n;i++){ const j=i*4; let x=s[j], y=s[j+1], z=s[j+2], rad=s[j+3];
      if (!id){ const X=x,Y=y,Z=z; x=e[0]*X+e[4]*Y+e[8]*Z+e[12]; y=e[1]*X+e[5]*Y+e[9]*Z+e[13]; z=e[2]*X+e[6]*Y+e[10]*Z+e[14]; rad*=sc; }
      let v=inF(x,y,z,rad); if (!v&&r.cast&&shOn){ const h=(y+rad)*.5; v=inF(x+sx*h,0,z+sz*h,rad+h*sl); }
      const b=v?1:0; if (vis[i]!==b){ vis[i]=b; ch=true; } }
    if (!ch) continue;
    r.last=n; const A=im.instanceMatrix, dst=A.array, full=r.full, C=im.instanceColor, cdst=C&&r.col?C.array:null, cf=r.col; let k=0;
    for (let i=0;i<n;i++){ if (!vis[i]) continue; dst.set(full.subarray(i*16,i*16+16),k*16);
      if (cdst){ cdst[k*3]=cf[i*3]; cdst[k*3+1]=cf[i*3+1]; cdst[k*3+2]=cf[i*3+2]; } k++; }
    im.count=k; im.visible=k>0;
    A.updateRange.offset=0; A.updateRange.count=Math.max(16,k*16); A.needsUpdate=true;
    if (cdst){ C.updateRange.offset=0; C.updateRange.count=Math.max(3,k*3); C.needsUpdate=true; }
  }
}
const VL_TINT={au:['#e8572a','#f07a2c','#f39a34','#d9432a','#ee6a2a'],rd:['#e4502e','#d8432a','#ee6234'],yl:['#f2b13c','#f6c94e','#eba232'],gr:['#7cae46','#8fbd4f','#6a9e3c']};
const vlTint=k=>VL_LIN(VL_TINT[k][(vlR()*VL_TINT[k].length)|0]).multiplyScalar(vlS(.9,1.08));
function vlFree(x,z,pad){ if (vlInPond(x,z,pad+.6)||vlPolyD(VL_PATHP,x,z)<VL_PATH_W+pad||vlPolyD(VL_SIDEP,x,z)<1+pad*.6||vlInHouse(x,z,pad)) return false; for (const d of VL_DOORS) if (Math.hypot(x-d.x,z-d.z)<2.4) return false; for (const l of VL_LAMPS) if (Math.hypot(x-l[0],z-l[1])<.9+pad*.5) return false; return Math.hypot(x-VL_PORTAL.x,z-VL_PORTAL.z)>9.5; }
const vlInYard=(x,z)=>x>-1.5&&x<16.5&&z>-25.5&&z<-12.9;   // 내 집 울타리 안 마당 (꽃은 잔디 마당에도 피어요)
// 풀 높이 지도 (0 풀 없음 · 약 .33 짧은 잔디 · 1 키 큰 풀)
function vlGrassAt(x,z){ const M=VL.maskR; if (!M) return 1; const S=VL.maskS, px=Math.max(0,Math.min(S-1,((x/VL_MAP+.5)*S)|0)), pz=Math.max(0,Math.min(S-1,((z/VL_MAP+.5)*S)|0)); return M[pz*S+px]/255; }
function vlNatureTrees(){
  vlSeed=3; const by={};
  const put=(n,p)=>(by[n]=by[n]||[]).push(p);
  VL_TREES.forEach(([x,z,s,kind],i)=>{ const big=(i===1||i===6); put(big?'TwistedTree_'+(i===1?1:3):'CommonTree_'+(1+i%5),{x,z,ry:vlS(0,6.3),s:big?s*.62:s*1.05,c:vlTint(kind)}); });
  VL_BUSHES.forEach(([x,z,kind])=>{ const s=vlS(1.0,1.45); put(kind==='gr'&&vlR()<.6?'Bush_Common_Flowers':'Bush_Common',{x,z,ry:vlS(0,6.3),s,c:vlTint(kind)}); VL_SOFT.push({x,z,r:.95*s}); });
  for (let i=0;i<80;i++){ const a=i/80*Math.PI*2+vlS(-.04,.04), r=vlS(66,90); put('Ring_'+(1+(vlR()*5|0)),{x:Math.cos(a)*r,z:Math.sin(a)*r,ry:vlS(0,6.3),s:vlS(1.2,1.9),c:vlTint(['au','yl','au','rd','gr'][(vlR()*5)|0])}); }
  vlSeed=31; for (let i=0;i<30;i++){ const a=vlS(0,6.3), r=vlS(38,64), x=Math.cos(a)*r, z=Math.sin(a)*r, s=vlS(1,1.5); if (!vlFree(x,z,2)||Math.hypot(x-VL_PORTAL.x,z-VL_PORTAL.z)<9) continue; put('Pine_'+[1,2,4][i%3],{x,z,ry:vlS(0,6.3),s}); VL_COLL.push({x,z,r:.5*s}); }
  [[-16,-30,1.3],[-30,-26,1.5],[-36,-20,1.2]].forEach(([x,z,s],i)=>{ put('Pine_'+[1,2,4][i],{x,z,ry:vlS(0,6.3),s}); VL_COLL.push({x,z,r:.5*s}); });
  VL_DPINES.forEach(([lx,lz,s],i)=>{ const w=vlPortalW(lx,lz); put('Pine_'+[2,4,1][i%3],{x:w.x,z:w.z,ry:vlS(0,6.3),s}); VL_COLL.push({x:w.x,z:w.z,r:.5*s}); });
  for (const n in by){ const ring=n.startsWith('Ring_'); vlInst(ring?'CommonTree_'+n.slice(5):n,by[n],{shadow:!ring}); }
}
function vlNatureGround(){
  vlSeed=51; const by={}, put=(n,p)=>(by[n]=by[n]||[]).push(p);
  // 집으로 가는 디딤돌
  for (let i=0;i<22;i++){ const p=VL_SIDEC.getPoint(i/21); put('RockPath_Round_Small_'+(1+i%3),{x:p.x+vlS(-.25,.25),y:.02,z:p.y+vlS(-.2,.2),ry:vlS(0,6.3),s:vlS(.85,1.1)}); }
  // 풀 뭉치 · 꽃 · 고사리 · 클로버 · 버섯 · 바위 · 자갈
  const scatter=(n,cnt,R,pad,sMin,sMax,clump,lv)=>{ let k=0, t=0; while (k<cnt&&t<cnt*30){ t++; let x,z;
      if (clump){ const c=clump[(vlR()*clump.length)|0], a=vlS(0,6.3), r=Math.sqrt(vlR())*c[2]; x=c[0]+Math.cos(a)*r; z=c[1]+Math.sin(a)*r; } else { const a=vlS(0,6.3), r=Math.sqrt(vlR())*R; x=Math.cos(a)*r; z=Math.sin(a)*r; }
      if (!vlFree(x,z,pad)||(lv==='flower'?!(vlGrassAt(x,z)>.7||vlInYard(x,z)):vlGrassAt(x,z)<(lv||0))) continue; let bad=false; for (const c of VL_COLL) if (Math.hypot(x-c.x,z-c.z)<c.r*.7){ bad=true; break; } for (const c of VL_SOFT) if (Math.hypot(x-c.x,z-c.z)<c.r*.6){ bad=true; break; } if (bad) continue;
      put(n,{x,z,ry:vlS(0,6.3),s:vlS(sMin,sMax)}); k++; } };
  scatter('Grass_Wispy_Tall',500,56,.3,.3,.5,null,.85); scatter('Grass_Wispy_Short',600,56,.2,.3,.5,null,.7); scatter('Grass_Common_Tall',400,56,.3,.26,.42,null,.85); scatter('Grass_Common_Short',300,40,.3,.3,.45,null,.7);
  const trees=VL_TREES.map(t=>[t[0],t[1],4.5]);
  scatter('Fern_1',40,0,.5,.1,.15,trees,.5); scatter('Plant_1_Big',35,0,.5,.22,.32,trees,.5); scatter('Mushroom_Common',40,0,.4,.6,.95,trees,.5); scatter('Clover_2',90,50,.3,.35,.5,null,.25);
  scatter('Flower_3_Group',110,0,.3,.28,.4,[[0,9,4],[6,9,3],[-3,4,3],[10,-2,3],[-12,10,3],[14,-6,3],[22,4,3],[-16,20,3]],'flower');
  scatter('Flower_4_Group',110,0,.3,.26,.38,[[-6,-4,3],[3,-11,2.5],[11,-15,2.5],[16,-8,3],[-20,4,3],[-12,16,3],[6,16,3],[-9,2,3]],'flower');
  const purple=[[-13,6,3],[2,-10,2.5],[12,-10,2.5],[-18,-2,3],[18,8,3],[-4,12,3],[-28,12,3],[8,-14,2],[-2,6.5,2],[24,6,3],[-6,-12,3]];
  scatter('Plant_7',160,0,.3,.45,.75,purple,.3); scatter('Plant_7_Big',60,0,.3,.45,.7,purple,.3);
  // 내 집 앞 꽃밭에 심은 꽃
  VL.bedFlowers.forEach(f=>put(f.k?'Flower_4_Group':'Flower_3_Group',{x:f.x,y:f.y,z:f.z,ry:f.ry,s:f.s}));
  // 바위: 길 · 집 · 마당 · 시작 자리에서 떨어진 나무 곁과 바깥 풀밭에만 (집 앞에는 두지 않아요)
  { let k=0; for (let i=0;i<70&&k<12;i++){ let x,z; if (i%2){ const t=VL_TREES[(vlR()*VL_TREES.length)|0], a=vlS(0,6.3), r=vlS(3.2,6); x=t[0]+Math.cos(a)*r; z=t[1]+Math.sin(a)*r; } else { const a=vlS(0,6.3), r=vlS(28,54); x=Math.cos(a)*r; z=Math.sin(a)*r; }
      if (!vlFree(x,z,1.5)||vlPolyD(VL_PATHP,x,z)<VL_PATH_W+4.5||vlPolyD(VL_SIDEP,x,z)<6.5||vlInHouse(x,z,5)||Math.hypot(x-5.6,z-8.2)<9||Math.hypot(x,z)>56||vlGrassAt(x,z)<.75) continue;
      let bad=false; for (const c of VL_COLL) if (Math.hypot(x-c.x,z-c.z)<c.r+1.5){ bad=true; break; } for (const c of VL_SOFT) if (Math.hypot(x-c.x,z-c.z)<c.r+1.5){ bad=true; break; } if (bad) continue;
      const s=vlS(.35,.72); put('Rock_Medium_'+(1+k%3),{x,z,ry:vlS(0,6.3),s}); VL_COLL.push({x,z,r:1.3*s}); k++; } }
  for (let i=0;i<130;i++){ const p=VL_PATHP[(vlR()*VL_PATHP.length)|0], a=vlS(0,6.3), r=VL_PATH_W+vlS(-.1,.7); put('Pebble_Round_'+(1+i%3),{x:p.x+Math.cos(a)*r,y:.01,z:p.y+Math.sin(a)*r,ry:vlS(0,6.3),s:vlS(.5,1.1)}); }
  const noShadow=n=>/Grass|Clover|Pebble|Flower|Fern|Plant|Mushroom|RockPath/.test(n);
  for (const n in by) vlInst(n,by[n],{shadow:!noShadow(n),lod:/Grass|Clover|Flower/.test(n)});
}
function villageReset(){
  document.body.classList.remove('village'); ['#vlHud','#vlPrompt','#vlCall','#vlMini','#vlClock'].forEach(s=>{ const e=$(s); if (e) e.hidden=true; });
  if (MAPK!=='village'){ if (VL.on) vlRestore(); VL.on=false; return; }
  VL.on=true; VL.yaw=.3; VL.pitch=.2; VL.dist=6.5; VL.door=null; VL.run=false; VL.slow=1; VL.camAt=null; VL.camD=null;
  P.x=5.6; P.z=8.2; P.fx=0; P.fz=-1; W.nextWaveAt=-1; W.nextQuiz=1e9; W.snapCam=true;
  // 캐릭터 키를 마을 크기(약 1.75)에 맞춰요
  pg.scale.setScalar(1); if (knight){ const b=new THREE.Box3().setFromObject(knight.root), h=b.max.y-b.min.y; VL.ks=h>.3?1.75/h:1; } pg.scale.setScalar(VL.ks);
  camera.fov=55; camera.updateProjectionMatrix();
  vlSetSky(false); if (VL.rays) VL.rays.enabled=false;
  const C=QUALITY[QCUR]||QUALITY.medium; if (VL.grass){ bladeLOD(VL.grass,QCUR!=='high'); VL.grass.geometry.instanceCount=Math.floor(VL.grass.geometry.userData.max*C.vlGrass); }
  (VL.lod||[]).forEach(L=>{ const n=Math.floor(L.n*(QCUR==='high'?1:QCUR==='medium'?.6:.2)), r=L.im.userData.natc; if (r) r.lim=n; else L.im.count=n; });
  if (VL.skyU) VL.skyU.uCloud.value=QCUR==='low'?0:1; vlParticlesReset(); vlEnvClockInit(); vlEnvReset();
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
    // 키 큰 풀밭 · 덤불: 지나갈 수 있지만 느려져요 (길 · 짧은 잔디는 그대로)
    { let f=1-.3*Math.max(0,Math.min(1,(vlGrassAt(P.x,P.z)-.5)/.4)); for (const b of VL_SOFT){ const d=Math.hypot(P.x-b.x,P.z-b.z); if (d<b.r){ const k=d/b.r; f=Math.min(f,.45+.55*k*k); } } VL.slow+=(f-VL.slow)*Math.min(1,dt*8); }
    if (L>.12){ if (L>1){ ix/=L; iz/=L; } const c=Math.cos(VL.yaw), s=Math.sin(VL.yaw), dx=ix*c+iz*s, dz=-ix*s+iz*c, sp=(VL.run?7.5:4.6)*VL.slow;
      P.x+=dx*sp*dt; P.z+=dz*sp*dt; P.fx=dx; P.fz=dz; moving=true; }
    for (const c of VL_COLL){ const dx=P.x-c.x, dz=P.z-c.z, d=Math.hypot(dx,dz), r=c.r+.35; if (d<r&&d>1e-4){ P.x=c.x+dx/d*r; P.z=c.z+dz/d*r; } }
    for (const H of VL_HOUSES){ const c=Math.cos(H.r), s=Math.sin(H.r); let lx=(P.x-H.x)*c-(P.z-H.z)*s, lz=(P.x-H.x)*s+(P.z-H.z)*c; const hw=H.w/2+.5+(H.cozy&&lx>0?1.5:0), hd=H.d/2+.5;
      if (Math.abs(lx)<hw&&Math.abs(lz)<hd){ if (hw-Math.abs(lx)<hd-Math.abs(lz)) lx=Math.sign(lx)*hw; else lz=Math.sign(lz)*hd; P.x=H.x+lx*Math.cos(H.r)+lz*Math.sin(H.r); P.z=H.z-lx*Math.sin(H.r)+lz*Math.cos(H.r); } }
    const RR=Math.hypot(P.x,P.z); if (RR>60){ P.x*=60/RR; P.z*=60/RR; }
  }
  pg.position.set(P.x,0,P.z);
  { let dy=Math.atan2(P.fx,P.fz)-pg.rotation.y; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); pg.rotation.y+=dy*Math.min(1,dt*12); }
  if (knight){ setBaseSynced(knight.anim,moving?'run':'idle',moving?(VL.run?1.25:.9)*(.45+.55*VL.slow):1); knight.mixer.update(W.paused?0:dt); }
  vlEnvTick(dt,real);
  const U=VL.U; U.uTime.value=real; U.uPlayer.value.set(P.x,0,P.z); U.uCenter.value.set(P.x-Math.sin(VL.yaw)*5,P.z-Math.cos(VL.yaw)*5);   // 풀잎은 카메라가 보는 앞쪽에 모아 심어요 (등 뒤 안 보이는 곳 대신)
  U.uFog.value.copy(scene.fog.color); U.uFogN.value=scene.fog.near; U.uFogF.value=scene.fog.far; VL.skyU.uFog.value.copy(scene.fog.color);
  // 카메라: 캐릭터 뒤 · 마우스로 돌려요
  const ty=1.35, sy=Math.sin(VL.pitch), cyw=Math.cos(VL.pitch), want=VL.dist; let allow=want;
  for (let i=3;i<=24;i++){ const t=i/24*want, x=P.x+Math.sin(VL.yaw)*cyw*t, y=ty+sy*t+.4*t/want, z=P.z+Math.cos(VL.yaw)*cyw*t; if (vlCamBlock(x,y,z)){ allow=Math.max(1.5,t-.55); break; } }
  if (VL.camD==null||W.snapCam) VL.camD=allow; else VL.camD+=(allow-VL.camD)*Math.min(1,dt*(allow<VL.camD?16:2.5));
  const cd=VL.camD, cp=_vlV.set(P.x+Math.sin(VL.yaw)*cyw*cd, ty+sy*cd+.4*cd/want, P.z+Math.cos(VL.yaw)*cyw*cd);
  camera.position.lerp(cp,W.snapCam?1:Math.min(1,dt*10)); W.snapCam=false; camera.lookAt(P.x,ty,P.z);
  U.uCam.value.copy(camera.position); U.uPlr.value.set(P.x,1.1,P.z); VL.skyU.uTime.value=real;
  vlParticlesTick(dt,real);
  VL.sky.position.copy(camera.position);
  { const o=sun.userData.off||[-29,14,-62]; sun.position.set(P.x+o[0],o[1],P.z+o[2]); sun.target.position.set(P.x,0,P.z); sun.target.updateMatrixWorld(); }
  if (VL.portal) VL.portal.rotation.z=real*.8;
  VL.torches.forEach((f,i)=>{ const k=1+.14*Math.sin(real*11.3+i*2.1)+.08*Math.sin(real*17.9+i*.7); f.scale.set(1.08-k*.08,k,1.08-k*.08); });
  VL.pads.forEach((r,i)=>{ r.scale.setScalar(1+.08*Math.sin(real*4+i)); });
  VL_DOORS.forEach(d=>{ if (d.label) d.label.visible=Math.hypot(P.x-d.x,P.z-d.z)>7.5; });
  // 빛줄기
  // 빛줄기는 고화질에서, 해 쪽을 볼 때만 켜요 (안 보일 때도 화면 전체를 한 번 더 그리던 것을 줄여요)
  if (VL.rays){ let on=!!(QUALITY[QCUR]&&QUALITY[QCUR].rays);
    if (on){ const sp=_vlV2.copy(camera.position).addScaledVector(VL_SUN,200).project(camera), fr=camera.getWorldDirection(_vlV).dot(VL_SUN), st=Math.max(0,Math.min(1,(fr-.1)*2.2))*(VL.raysK==null?1:VL.raysK);
      VL.rays.uniforms.uSun.value.set((sp.x+1)/2,(sp.y+1)/2); VL.rays.uniforms.uStr.value=st; VL.rays.uniforms.uAsp.value=camera.aspect; on=st>.002; }
    VL.rays.enabled=on; }
  // 장소 발판
  let near=null; for (const d of VL_DOORS) if (Math.hypot(P.x-d.x,P.z-d.z)<1.5) near=d;
  if (near!==VL.door){ VL.door=near; const pe=$('#vlPrompt'); pe.hidden=!near; if (near){ const [a,b]=vlDoorText(near); pe.innerHTML=`<b>${a}</b><span>${esc(b)}</span><button class="btn small" id="vlGo">${near.id==='home'?'둘러보기':'들어가기'} (E)</button>`; $('#vlGo').onclick=vlEnterDoor; } }
  // 선생님이 연 수업 활동 알림
  VL.callT-=dt; if (VL.callT<=0){ VL.callT=1; const k=typeof liveOpen==='function'&&liveOpen()?'live':typeof stgOpen==='function'&&stgOpen()?'stage':typeof twOpen==='function'&&twOpen()?'tw':typeof raidOpen==='function'&&raidOpen()?'raid':'';
    const e=$('#vlCall'); e.hidden=!k; if (k&&e.dataset.k!==k){ e.dataset.k=k; e.textContent=k==='live'?'🏫 선생님이 수업 모드를 열었어요 · 지금 가기':k==='stage'?'🟦 발판 서바이벌이 열렸어요 · 지금 가기':k==='raid'?'🐉 보스 레이드가 열렸어요 · 지금 가기':'⚔️ 조별 점령전이 열렸어요 · 지금 가기'; } if (!k) e.dataset.k=''; }
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
  vlEnvClockInit(); const dn=new Date(), h=dn.getHours(), mi=dn.getMinutes(), te=$('#vlClockT'), re=$('#vlClockR');
  const gt=vlEnvClockText(); if (te&&te._t!==gt){ te._t=gt; te.textContent=gt; }
  const rt=`지금 ${h<12?'오전':'오후'} ${((h+11)%12)+1}:${String(mi).padStart(2,'0')}`; if (re&&re._t!==rt){ re._t=rt; re.textContent=rt; }
}

/* ---------- 조작: 이동 키는 그대로 · 공격 키는 막고 · Shift 달리기 · E 들어가기 · 마우스 드래그 시점 ---------- */
addEventListener('keydown',e=>{ if (MAPK!=='village'||W.state!=='play') return; if (e.target.closest&&e.target.closest('input,textarea,select')) return;
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
$('#vlCall')&&$('#vlCall').addEventListener('click',()=>{ const k=$('#vlCall').dataset.k; villageLeave(()=>{ if (k==='live') liveJoin(); else if (k==='stage') stageJoin(); else if (k==='tw') twJoin(); else if (k==='raid') raidJoin(); }); });
$('#shopClose')&&$('#shopClose').addEventListener('click',()=>{ if (VL.backShop){ VL.backShop=false; setTimeout(villageJoin,60); } });
setInterval(()=>{ const b=$('#vilBtn'); if (b) b.disabled=!assetsReady; },1000);
