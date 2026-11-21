/* 사회 게임 RPG · 노을 마을 시간 · 날씨
   - 게임 속 시계: 선생님이 '자동으로 흐르기'(하루 길이를 분으로 정함) 또는 아침 · 낮 · 노을 · 밤 가운데 하나로 고정
   - 날씨: 자동(5분마다 바뀜) 또는 맑음 · 흐림 · 비 · 눈 · 안개 가운데 하나로 고정
   - 설정은 settings/villageEnv 에 저장해요. 모든 학생이 같은 서버 시각으로 계산하니까 모두 같은 하늘을 봐요. */
const VL_ENV_DEF={time:'auto',speed:24,weather:'auto'};
let VL_ENV=Object.assign({},VL_ENV_DEF), VL_ENV_LOCAL=null;   // VL_ENV_LOCAL: 선생님이 마을 안에서 고른 값 (저장이 안 돼도 내 화면에는 바로 보여요)
const VL_ENVU={uSnow:{value:0},uWet:{value:0},uPoolT:{value:null},uPoolK:{value:0}};   // uPoolT: 밤에 등불 아래가 밝아지는 빛 웅덩이 지도
const VL_SUN0=VL_SUN.clone();   // 지금까지의 노을 해 방향 (17:40)
const VL_TIMEH={morning:7.5,day:12.5,sunset:17.67,night:22};
const VL_TNAME={auto:'⏱️ 자동으로 흐르기',morning:'🌅 아침',day:'☀️ 낮',sunset:'🌇 노을',night:'🌙 밤'};
const VL_WNAME={clear:'☀️ 맑음',cloudy:'☁️ 흐림',rain:'🌧️ 비',snow:'❄️ 눈',fog:'🌫️ 안개'};
function vlEnvClean(v){ const o=Object.assign({},VL_ENV_DEF,v&&typeof v==='object'?v:{});
  if (!VL_TNAME[o.time]) o.time='auto'; if (o.weather!=='auto'&&!VL_WNAME[o.weather]) o.weather='auto'; o.speed=Math.max(6,Math.min(120,Math.round(+o.speed)||24));
  return {time:o.time,speed:o.speed,weather:o.weather}; }
function vlEnvSet(v){ VL_ENV=vlEnvClean(v); VL_ENV_LOCAL=null; try{ vlEnvPanelSync(); }catch(e){} }
const vlEnvCur=()=>VL_ENV_LOCAL||VL_ENV;
const vlEnvNow=()=>Date.now()+(typeof SOFF==='number'?SOFF:0);

/* 게임 시각: 하루 한 바퀴(0~1)를 시각으로 바꿔요. 낮 · 노을은 넉넉하게, 밤은 빨리 지나가요 */
const VL_DAYMAP=[[0,5],[.12,8],[.52,16],[.72,19.5],[1,29]];
function vlGameHour(){ const E=vlEnvCur(); if (E.time!=='auto') return VL_TIMEH[E.time];
  const u=((vlEnvNow()/(E.speed*60000))%1+1)%1;
  for (let i=1;i<VL_DAYMAP.length;i++){ const [u1,h1]=VL_DAYMAP[i]; if (u<=u1){ const [u0,h0]=VL_DAYMAP[i-1]; return (h0+(h1-h0)*(u-u0)/(u1-u0))%24; } }
  return 5; }
function vlWeatherAt(k){ const r=Math.abs(Math.sin(k*12.9898+78.233)*43758.5453)%1; return r<.42?'clear':r<.67?'cloudy':r<.81?'rain':r<.92?'fog':'snow'; }
function vlWeatherNow(){ const E=vlEnvCur(); return E.weather!=='auto'?E.weather:vlWeatherAt(Math.floor(vlEnvNow()/300000)); }

/* 시간대별 하늘 · 빛 · 색감 (노을은 지금까지의 노을 마을과 똑같아요) */
const VL_PRE={
  night:  {exp:.8,top:'#0b1430',hor:'#2a3a66',fog:'#1e2a46',fogN:10,fogF:82,hemiC:'#8ea2e0',hemiG:'#1a1f2c',hemiI:.5,sunC:'#a8bcff',sunI:.6,fillC:'#5a6fd0',fillI:.32,
           bS:.75,bR:.8,bT:.62,sat:.9,tint:[.93,.97,1.1],lift:[.008,.012,.035],con:1.05,vig:.58,sunCol:'#9fb2e8',lightK:[.24,.28,.42],cShade:[.03,.04,.08],cAdd:[.05,.06,.1],
           mtn1:'#1e2640',mtn2:'#161c2e',mtnSun:0,rays:0,glow:1.45,win:1.35,lan:2.6,star:1,disc:1,sunPow:1500,shadeK:.25,ff:1,smoke:'#3a3e4e'},
  dawn:   {exp:.9,top:'#5d72b4',hor:'#f3b9c4',fog:'#d8b6c8',fogN:12,fogF:92,hemiC:'#ffd9e6',hemiG:'#4a4a5c',hemiI:.56,sunC:'#ffb8a8',sunI:.75,fillC:'#a9b8ff',fillI:.34,
           bS:.6,bR:.8,bT:.76,sat:1,tint:[1,.97,1.04],lift:[.02,.012,.04],con:1.02,vig:.46,sunCol:'#ffae9c',lightK:[.74,.7,.8],cShade:[.3,.24,.36],cAdd:[.2,.12,.16],
           mtn1:'#7f7296',mtn2:'#665b78',mtnSun:.45,rays:.55,glow:.85,win:.75,lan:1.8,star:.2,disc:1,sunPow:600,shadeK:.55,ff:.3,smoke:'#8e8494'},
  morning:{exp:.92,top:'#6f9cd6',hor:'#ffd2a8',fog:'#f0d4bc',fogN:15,fogF:104,hemiC:'#ffe8d2',hemiG:'#5d6248',hemiI:.62,sunC:'#ffc890',sunI:1.55,fillC:'#c0ccff',fillI:.28,
           bS:.5,bR:.7,bT:.8,sat:1.05,tint:[1.04,1,.95],lift:[.016,.01,.016],con:1.02,vig:.44,sunCol:'#ffc48a',lightK:[1.02,.97,.9],cShade:[.5,.47,.56],cAdd:[.25,.2,.16],
           mtn1:'#a49eb4',mtn2:'#8b8b94',mtnSun:.3,rays:.7,glow:.3,win:.3,lan:.8,star:0,disc:1,sunPow:600,shadeK:.6,ff:0,smoke:'#a8a2ac'},
  day:    {exp:.9,top:'#4f8ad6',hor:'#c4dcf2',fog:'#d4e0ec',fogN:20,fogF:122,hemiC:'#e8efff',hemiG:'#5d6e40',hemiI:.64,sunC:'#fff2dc',sunI:1.65,fillC:'#b9c9ff',fillI:.3,
           bS:.32,bR:.6,bT:.9,sat:1.06,tint:[1,1,1],lift:[.008,.008,.02],con:1.03,vig:.38,sunCol:'#fff4e2',lightK:[1.1,1.1,1.08],cShade:[.62,.67,.76],cAdd:[.26,.27,.29],
           mtn1:'#8fa4bf',mtn2:'#73888c',mtnSun:.08,rays:.28,glow:.12,win:.15,lan:.5,star:0,disc:1,sunPow:600,shadeK:.38,ff:0,smoke:'#b4b0b8'},
  sunset: {exp:.95,top:'#7fa1cf',hor:'#ffc58e',fog:'#eab384',fogN:12,fogF:95,hemiC:'#ffd8b0',hemiG:'#6b5638',hemiI:.6,sunC:'#ffb46e',sunI:1.9,fillC:'#ffc8a0',fillI:.18,
           bS:.42,bR:.7,bT:.82,sat:1.08,tint:[1.03,1,.95],lift:[.012,.006,0],con:1.03,vig:.5,sunCol:'#ffb46e',lightK:[1,1,1],cShade:[.24,.16,.24],cAdd:[.22,.1,.08],
           mtn1:'#9c829a',mtn2:'#7e6a72',mtnSun:.6,rays:1,glow:1,win:.72,lan:1.9,star:0,disc:1,sunPow:600,shadeK:1,ff:1,smoke:'#9a92a0'},
  dusk:   {exp:.84,top:'#2c3172',hor:'#d9849c',fog:'#8c6c90',fogN:12,fogF:88,hemiC:'#c9b4ff',hemiG:'#2c2645',hemiI:.52,sunC:'#ff8a66',sunI:.5,fillC:'#6f7cff',fillI:.38,
           bS:.7,bR:.8,bT:.68,sat:1,tint:[.97,.9,1.06],lift:[.012,0,.035],con:1.06,vig:.56,sunCol:'#ff9274',lightK:[.55,.5,.64],cShade:[.15,.1,.2],cAdd:[.16,.07,.1],
           mtn1:'#4c3c62',mtn2:'#3a2e4a',mtnSun:.5,rays:.35,glow:1.25,win:1.15,lan:2.4,star:.35,disc:1,sunPow:600,shadeK:.6,ff:1,smoke:'#6a6276'}};
// 섞기 좋게 숫자 배열로 바꿔 둬요 (빛 · 안개 색은 그대로, 셰이더 색은 선형)
const VL_PN={};
for (const k in VL_PRE){ const p=Object.assign({},VL_PRE[k]);
  ['fog','hemiC','hemiG','sunC','fillC'].forEach(n=>{ const c=new THREE.Color(p[n]); p[n]=[c.r,c.g,c.b]; });
  ['top','hor','sunCol','mtn1','mtn2','smoke'].forEach(n=>{ const c=VL_LIN(p[n]); p[n]=[c.r,c.g,c.b]; });
  p.cov=.5; p.hazeK=1; p.rain=0; p.snow=0;
  p.sat*=1.04; p.con*=1.05; p.lift=p.lift.map(v=>v*0.5); p.fogN*=1.3; p.fogF*=1.08;   // 진한 카툰 색감: 채도 · 대비 조금 올리고, 어두운 곳 들뜸은 줄여요
  VL_PN[k]=p; }
function vlMixInto(o,a,b,t){ for (const k in a){ const x=a[k], y=b[k]; if (Array.isArray(x)){ const r=o[k]||(o[k]=x.slice()); for (let i=0;i<x.length;i++) r[i]=x[i]+(y[i]-x[i])*t; } else o[k]=x+(y-x)*t; } return o; }
VL_PN.twiN=Object.assign(vlMixInto({},VL_PN.dusk,VL_PN.night,.55),{sunI:.05,rays:0});   // 해가 지고 달이 뜨기 전 (빛 방향이 바뀌는 때)
VL_PN.twiD=Object.assign(vlMixInto({},VL_PN.night,VL_PN.dawn,.5),{sunI:.05,rays:0});
const VL_KEYS=[[0,'night'],[4.4,'night'],[5.2,'twiD'],[5.9,'dawn'],[7.2,'morning'],[9.6,'day'],[15.4,'day'],[17.67,'sunset'],[18.6,'dusk'],[19.3,'twiN'],[20.2,'night'],[24,'night']];
const VL_T={};
function vlTimeState(h){ for (let i=1;i<VL_KEYS.length;i++){ const [h1,k1]=VL_KEYS[i]; if (h<=h1){ const [h0,k0]=VL_KEYS[i-1]; return vlMixInto(VL_T,VL_PN[k0],VL_PN[k1],(h-h0)/Math.max(1e-6,h1-h0)); } }
  return vlMixInto(VL_T,VL_PN.night,VL_PN.night,0); }

/* 날씨: 시간대 색 위에 덧입혀요 (밤에는 같은 비라도 어둡게) */
const VL_WK={cloudy:0,rain:0,snow:0,fog:0};
const vlLum=c=>c[0]*.3+c[1]*.59+c[2]*.11;
function vlTo(a,b,t){ for (let i=0;i<3;i++) a[i]+=(b[i]-a[i])*t; }
function vlMul(a,k){ for (let i=0;i<a.length;i++) a[i]*=k; }
function vlGray(a,k,t){ const l=vlLum(a)*k; for (let i=0;i<3;i++) a[i]+=(l-a[i])*t; }
function vlWeatherApply(T){
  const b=Math.max(.12,Math.min(1.1,vlLum(T.fog)/.78)), bl=b*b*1.1;
  let k=VL_WK.cloudy;
  if (k>.001){ T.sunI*=1-.58*k; T.rays*=1-k; T.cov+=(.3-T.cov)*k; T.disc*=1-.9*k; vlGray(T.top,.95,.55*k); vlGray(T.hor,1,.5*k); vlGray(T.fog,1,.45*k);
    T.fogN*=1-.25*k; T.fogF*=1-.2*k; T.sat*=1-.18*k; T.hemiI*=1+.15*k; T.hazeK*=1-.35*k; vlMul(T.sunCol,1-.45*k); vlTo(T.cShade,[.5*bl,.52*bl,.56*bl],.7*k); vlTo(T.cAdd,[.2*bl,.2*bl,.21*bl],.6*k); }
  k=VL_WK.rain;
  if (k>.001){ T.sunI*=1-.8*k; T.rays*=1-k; T.cov+=(.17-T.cov)*k; T.disc*=1-k;
    vlTo(T.top,[.13*bl,.16*bl,.2*bl],.75*k); vlTo(T.hor,[.24*bl,.27*bl,.3*bl],.75*k); vlTo(T.fog,[.5*b,.54*b,.58*b],.65*k);
    T.fogN+=(6-T.fogN)*k; T.fogF+=(62-T.fogF)*k; T.sat*=1-.25*k; T.exp*=1-.06*k; vlTo(T.cShade,[.16*bl,.17*bl,.2*bl],k); vlTo(T.cAdd,[.05*bl,.05*bl,.06*bl],k); vlMul(T.sunCol,1-.75*k);
    T.glow+=(Math.max(T.glow,.8)-T.glow)*k; T.win+=(Math.max(T.win,.9)-T.win)*k; T.lan+=(Math.max(T.lan,2.1)-T.lan)*k; vlMul(T.lightK,1-.3*k); T.hazeK*=1-.75*k; T.ff*=1-k; T.rain=k; }
  k=VL_WK.snow;
  if (k>.001){ T.sunI*=1-.62*k; T.rays*=1-k; T.cov+=(.22-T.cov)*k; T.disc*=1-k;
    vlTo(T.top,[.36*bl,.4*bl,.46*bl],.6*k); vlTo(T.hor,[.62*bl,.65*bl,.7*bl],.6*k); vlTo(T.fog,[.82*b,.85*b,.9*b],.65*k);
    T.fogN+=(8-T.fogN)*k; T.fogF+=(72-T.fogF)*k; T.sat*=1-.2*k; vlTo(T.tint,[.96,.99,1.05],k); vlTo(T.cShade,[.42*bl,.45*bl,.5*bl],k); vlTo(T.cAdd,[.16*bl,.16*bl,.18*bl],k); vlMul(T.sunCol,1-.6*k);
    T.hazeK*=1-.55*k; T.ff*=1-k; T.snow=k; }
  k=VL_WK.fog;
  if (k>.001){ T.sunI*=1-.6*k; T.rays*=1-k; T.cov+=(.4-T.cov)*k; T.disc*=1-.85*k; vlTo(T.fog,[.76*b,.77*b,.76*b],.75*k); T.fogN+=(2-T.fogN)*k; T.fogF+=(36-T.fogF)*k;
    vlTo(T.top,[.5*bl,.52*bl,.52*bl],.5*k); vlTo(T.hor,[.55*bl,.56*bl,.55*bl],.75*k); T.sat*=1-.15*k; vlMul(T.sunCol,1-.5*k);
    T.glow+=(Math.max(T.glow,.6)-T.glow)*k; T.hazeK*=1-.9*k; T.ff*=1-.6*k; }
}

/* 해 · 달 방향: 6:00 해 뜸 → 18:30 해 짐 (17:40에 지금까지의 노을 방향과 같아요) · 밤에는 달빛 */
const _vlSunT=new THREE.Vector3(); let VL_BODY='';
function vlSunDir(h,out){ const A0=Math.atan2(VL_SUN0.z,VL_SUN0.x), E0=Math.asin(VL_SUN0.y), ts=Math.PI*(17.67-6)/12.5, em=E0/Math.sin(ts);
  if (h>=5.2&&h<19.3){ const th=Math.PI*(h-6)/12.5, el=Math.max(-.12,em*Math.sin(th)), az=A0+(th-ts); out.set(Math.cos(el)*Math.cos(az),Math.sin(el),Math.cos(el)*Math.sin(az)); return 'sun'; }
  const hm=h<12?h+24:h, th=Math.PI*(hm-19.3)/9.9, el=.1+.35*Math.sin(th), az=A0-.25+(th-1.2)*.5; out.set(Math.cos(el)*Math.cos(az),Math.sin(el),Math.cos(el)*Math.sin(az)); return 'moon'; }

/* 매 프레임: 시각 · 날씨를 정하고, 부드럽게 섞어서 하늘 · 빛 · 안개 · 풀 · 물 · 산 · 등불에 넣어요 */
const VL_ST={}; let VL_STOK=false;
function vlStLerp(T,t){ for (const k in T){ const b=T[k]; if (Array.isArray(b)){ const a=VL_ST[k]; if (!VL_STOK||!a){ VL_ST[k]=b.slice(); continue; } for (let i=0;i<b.length;i++) a[i]+=(b[i]-a[i])*t; } else VL_ST[k]=VL_STOK?VL_ST[k]+(b-VL_ST[k])*t:b; } VL_STOK=true; }
function vlEnvTick(dt,real){
  const h=vlGameHour(), w=vlWeatherNow(), sn=!!VL.envSnap; VL.envSnap=false; VL.envHour=h; VL.envW=w;
  for (const k in VL_WK){ const tg=w===k?1:0; VL_WK[k]=sn?tg:VL_WK[k]+(tg-VL_WK[k])*Math.min(1,dt*.22); }
  const T=vlTimeState(h); T.cov=.5; T.hazeK=1; T.rain=0; T.snow=0; vlWeatherApply(T);
  if (sn) VL_STOK=false; vlStLerp(T,Math.min(1,dt*.8));
  const body=vlSunDir(h,_vlSunT); if (sn||body!==VL_BODY){ VL_SUN.copy(_vlSunT); VL_BODY=body; } else VL_SUN.lerp(_vlSunT,Math.min(1,dt*.8)).normalize();
  const su=VL_ENVU.uSnow, wu=VL_ENVU.uWet;
  if (sn){ su.value=w==='snow'?1:0; wu.value=w==='rain'?1:0; }
  else { su.value+=((w==='snow'?1:0)-su.value)*Math.min(1,dt*(w==='snow'?.03:.02)); wu.value+=((w==='rain'?1:0)-wu.value)*Math.min(1,dt*(w==='rain'?.09:.025)); }
  vlEnvApply(VL_ST,real);
}
function vlEnvApply(S,real){
  renderer.toneMappingExposure=S.exp;
  scene.fog.color.setRGB(S.fog[0],S.fog[1],S.fog[2]); if (scene.background&&scene.background.isColor) scene.background.copy(scene.fog.color); scene.fog.near=S.fogN; scene.fog.far=S.fogF;
  HEMI.color.setRGB(S.hemiC[0],S.hemiC[1],S.hemiC[2]); HEMI.groundColor.setRGB(S.hemiG[0],S.hemiG[1],S.hemiG[2]); HEMI.intensity=S.hemiI;
  sun.color.setRGB(S.sunC[0],S.sunC[1],S.sunC[2]); sun.intensity=S.sunI; sun.userData.off=[VL_SUN.x*70,Math.max(3,VL_SUN.y*70),VL_SUN.z*70];
  fill.color.setRGB(S.fillC[0],S.fillC[1],S.fillC[2]); fill.intensity=S.fillI;
  if (typeof bloom!=='undefined'&&bloom){ bloom.strength=S.bS; bloom.radius=S.bR; bloom.threshold=S.bT; }
  if (typeof GRADE!=='undefined'&&GRADE){ const u=GRADE.uniforms; u.uSat.value=S.sat; u.uTint.value.set(S.tint[0],S.tint[1],S.tint[2]); u.uLift.value.set(S.lift[0],S.lift[1],S.lift[2]); u.uCon.value=S.con; u.uVig.value=S.vig; }
  const K=VL.skyU; K.uTop.value.setRGB(S.top[0],S.top[1],S.top[2]); K.uHor.value.setRGB(S.hor[0],S.hor[1],S.hor[2]); K.uSun.value.copy(VL_SUN); K.uSunCol.value.setRGB(S.sunCol[0],S.sunCol[1],S.sunCol[2]);
  K.uCov.value=S.cov; K.uCShade.value.setRGB(S.cShade[0],S.cShade[1],S.cShade[2]); K.uCAdd.value.setRGB(S.cAdd[0],S.cAdd[1],S.cAdd[2]); K.uStar.value=S.star; K.uDisc.value=S.disc; K.uSunPow.value=S.sunPow;
  const U=VL.U; U.uSun.value.copy(VL_SUN); U.uSunCol.value.copy(K.uSunCol.value); U.uLightK.value.setRGB(S.lightK[0],S.lightK[1],S.lightK[2]); U.uShadeK.value=S.shadeK;
  if (VL.WU){ VL.WU.uSunCol.value.copy(K.uSunCol.value); VL.WU.uLightK.value.copy(U.uLightK.value); }
  (VL.mtnU||[]).forEach((m,i)=>{ const c=i?S.mtn2:S.mtn1; m.uCol.value.setRGB(c[0],c[1],c[2]); m.uSunK.value=S.mtnSun; m.uHaze.value=m.uHaze0.value*S.hazeK; });
  if (VL.rays) VL.rays.uniforms.uCol.value.copy(K.uSunCol.value); VL.raysK=S.rays;
  const M=vlMats(); M.win.emissiveIntensity=S.win; M.lantern.emissiveIntensity=S.lan; VL.glowK=S.glow; VL_ENVU.uPoolK.value=Math.max(0,Math.min(1,(S.glow-1.05)/.4));
  if (VL.ffU){ VL.ffU.uCol.value.setRGB(1,.82,.38).multiplyScalar(S.ff); if (VL.ff) VL.ff.visible=QCUR!=='low'&&S.ff>.03; }
  if (VL.smU) VL.smU.uCol.value.setRGB(S.smoke[0],S.smoke[1],S.smoke[2]);
  const lk=Math.min(1.1,vlLum(S.lightK));
  if (VL.rainU){ const R=VL.rainU; R.uAmt.value=S.rain; R.uTime.value=real; R.uOrg.value.copy(camera.position); R.uCol.value.setRGB(.62,.68,.76).multiplyScalar(.35+.65*lk); VL.rainFx.visible=S.rain>.01; }
  if (VL.snowU){ const N=VL.snowU; N.uAmt.value=S.snow; N.uTime.value=real; N.uOrg.value.copy(camera.position); N.uLight.value=.3+.7*Math.min(1,lk); VL.snowFx.visible=S.snow>.01; }
}

/* 눈 쌓임 · 젖은 바닥: 마을의 모든 표준 재질에 같은 계산을 넣어요 (위를 보는 면만 하얗게 · 젖으면 어둡고 반들반들) */
function vlEnvHook(m,pools){
  if (m.userData.vlEnv) return; m.userData.vlEnv=true;
  const prev=m.onBeforeCompile, key0=m.customProgramCacheKey();
  m.onBeforeCompile=function(sh,r){ if (prev) prev.call(this,sh,r);
    Object.assign(sh.uniforms,{uSnow:VL_ENVU.uSnow,uWet:VL_ENVU.uWet,uPoolT:VL_ENVU.uPoolT,uPoolK:VL_ENVU.uPoolK});
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying float vUpN;')
      .replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\n{ vec3 un=objectNormal;\n#ifdef USE_INSTANCING\nun=mat3(instanceMatrix)*un;\n#endif\nvUpN=normalize(mat3(modelMatrix)*un).y; }');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uSnow,uWet,uPoolK; uniform sampler2D uPoolT; varying float vUpN;')
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n{ float vup=smoothstep(.3,.85,vUpN), sn=uSnow*vup; diffuseColor.rgb=mix(diffuseColor.rgb*(1.-.3*uWet*vup),vec3(.9,.93,.97),sn); roughnessFactor=mix(roughnessFactor,.62,uWet*vup*(1.-sn)*.7); }');
    if (pools) sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nif (uPoolK>.001) totalEmissiveRadiance+=diffuseColor.rgb*vec3(1.,.66,.3)*texture2D(uPoolT,vUv).r*uPoolK*1.7;');
  };
  m.customProgramCacheKey=()=>'vlenv'+(pools?'P':'')+'|'+key0; m.needsUpdate=true; }

/* 마을을 만들 때 한 번: 재질 연결 · 등불 빛 웅덩이 · 비 · 눈 */
function vlEnvBuild(R){
  const grp=(typeof mapGroups!=='undefined'&&mapGroups.village)||R, seen=new Set();
  grp.traverse(o=>{ if (!o.isMesh||!o.material) return; (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if (m&&m.isMeshStandardMaterial&&!seen.has(m)){ seen.add(m); vlEnvHook(m,!!m.userData.vlPools); } }); });
  // 밤에 가로등 · 정원등 · 횃불 아래가 따뜻하게 밝아져요 (한 번 그려 둔 지도를 바닥 · 풀이 읽어요)
  const pools=[]; VL_LAMPS.forEach(([x,z,ry])=>pools.push([x+Math.cos(ry)*.86,z-Math.sin(ry)*.86,4.4,.95])); VL_GARDEN.lights.forEach(l=>pools.push([l.x,l.z,2.3,.6]));
  for (const s of [-1,1]){ const w=vlPortalW(s*3.1,2.4); pools.push([w.x,w.z,3.6,.8]); }
  { const S=512, mp=v=>(v/VL_MAP+.5)*S, cv=vlCanvas(S,S,g=>{ g.fillStyle='#000'; g.fillRect(0,0,S,S); g.globalCompositeOperation='lighter';
      pools.forEach(([x,z,r,k])=>{ const R2=r/VL_MAP*S, gr=g.createRadialGradient(mp(x),mp(z),0,mp(x),mp(z),R2), c=a=>`rgba(255,255,255,${(a*k).toFixed(3)})`;
        gr.addColorStop(0,c(1)); gr.addColorStop(.3,c(.6)); gr.addColorStop(.6,c(.13)); gr.addColorStop(1,c(0)); g.fillStyle=gr; g.fillRect(mp(x)-R2,mp(z)-R2,R2*2,R2*2); }); });
    const t=new THREE.CanvasTexture(cv); t.minFilter=THREE.LinearFilter; t.generateMipmaps=false; VL_ENVU.uPoolT.value=t; }
  // 비: 카메라 둘레 상자 안에서 떨어지는 빗줄기 (끝이 맞닿은 선)
  { const N=2400, pos=new Float32Array(N*6), end=new Float32Array(N*2);
    for (let i=0;i<N;i++){ const x=Math.random()*36, y=Math.random()*20, z=Math.random()*36; pos.set([x,y,z,x,y,z],i*6); end[i*2+1]=1; }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('aEnd',new THREE.BufferAttribute(end,1)); g.userData.max=N*2;
    VL.rainU={uTime:{value:0},uOrg:{value:new THREE.Vector3()},uAmt:{value:0},uCol:{value:new THREE.Color(.62,.68,.76)}};
    const m=new THREE.LineSegments(g,new THREE.ShaderMaterial({uniforms:VL.rainU,transparent:true,depthWrite:false,fog:false,
      vertexShader:`attribute float aEnd; uniform float uTime,uAmt; uniform vec3 uOrg; varying float vA;
        void main(){ vec3 S=vec3(36.,20.,36.); vec3 p=position+vec3(uTime*2.2,-uTime*17.,0.); p=mod(p-uOrg+S*.5,S)+uOrg-S*.5;
          float on=step(fract(position.x*.173+position.z*.311+position.y*.07),uAmt); p+=vec3(.13,-1.,0.)*aEnd*.8;
          vec4 mv=modelViewMatrix*vec4(p,1.); vA=on*(1.-smoothstep(13.,21.,-mv.z))*(.3+.7*aEnd); gl_Position=projectionMatrix*mv; }`,
      fragmentShader:`uniform vec3 uCol; varying float vA; void main(){ if (vA<.01) discard; gl_FragColor=vec4(uCol,vA*.45); }`}));
    m.frustumCulled=false; m.visible=false; m.renderOrder=3; R.add(m); VL.rainFx=m; }
  // 눈: 천천히 흔들리며 내려오는 눈송이
  { const N=1800, pos=new Float32Array(N*3), sd=new Float32Array(N);
    for (let i=0;i<N;i++){ pos[i*3]=Math.random()*30; pos[i*3+1]=Math.random()*16; pos[i*3+2]=Math.random()*30; sd[i]=Math.random(); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('aSd',new THREE.BufferAttribute(sd,1)); g.userData.max=N;
    VL.snowU={uTime:{value:0},uOrg:{value:new THREE.Vector3()},uAmt:{value:0},uScale:{value:600},uLight:{value:1}};
    const m=new THREE.Points(g,new THREE.ShaderMaterial({uniforms:VL.snowU,transparent:true,depthWrite:false,fog:false,
      vertexShader:`attribute float aSd; uniform float uTime,uAmt,uScale; uniform vec3 uOrg; varying float vA;
        void main(){ vec3 S=vec3(30.,16.,30.); vec3 p=position+vec3(uTime*.45+sin(uTime*.7+aSd*20.)*.6,-uTime*(1.05+aSd*.6),cos(uTime*.5+aSd*13.)*.5); p=mod(p-uOrg+S*.5,S)+uOrg-S*.5;
          vec4 mv=modelViewMatrix*vec4(p,1.); vA=step(aSd,uAmt)*(1.-smoothstep(9.,15.,-mv.z)); gl_PointSize=clamp(uScale*.055*(.6+aSd*.8)/max(.5,-mv.z),1.,16.); gl_Position=projectionMatrix*mv; }`,
      fragmentShader:`uniform float uLight; varying float vA; void main(){ if (vA<.01) discard; float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.12,d)*vA; gl_FragColor=vec4(vec3(.95,.97,1.)*uLight,a*.92); }`}));
    m.frustumCulled=false; m.visible=false; m.renderOrder=3; R.add(m); VL.snowFx=m; }
}
/* 마을에 들어올 때: 바로 지금 하늘로 · 화질에 맞춰 빗줄기 · 눈송이 수 */
function vlEnvReset(){
  VL.envSnap=true; const f=QCUR==='high'?1:QCUR==='medium'?.6:.3;
  if (VL.rainFx) VL.rainFx.geometry.setDrawRange(0,Math.floor(VL.rainFx.geometry.userData.max*f/2)*2);
  if (VL.snowFx) VL.snowFx.geometry.setDrawRange(0,Math.floor(VL.snowFx.geometry.userData.max*f));
  const b=$('#vlEnvBtn'); if (b) b.hidden=!isAdmin; const p=$('#vlEnvP'); if (p) p.hidden=true;
}

/* 시계: 게임 시각 · 날씨 (+ 작게 지금 시각) */
function vlEnvClockText(){ const h=VL.envHour==null?17.67:VL.envHour, H=Math.floor(h), mi=Math.floor((h-H)*60/10)*10;
  const word=H<5?'새벽':H<9?'아침':H<12?'오전':H<17?'오후':H<20?'저녁':'밤', icon=H<5||H>=20?'🌙':H<9?'🌅':H<17?'☀️':'🌇';
  const wn=(VL.envW||'clear')==='clear'&&(H<5||H>=19)?'✨ 맑음':VL_WNAME[VL.envW]||VL_WNAME.clear;
  return `${icon} ${word} ${((H+11)%12)+1}:${String(mi).padStart(2,'0')} · ${wn}`; }
function vlEnvClockInit(){ const ce=$('#vlClock'); if (!ce||ce.dataset.init) return; ce.dataset.init='1';
  ce.innerHTML=`<b>🌇 노을 마을</b><div id="vlClockT"></div><small id="vlClockR"></small><button class="vl-envbtn" id="vlEnvBtn" hidden>⚙️ 시간 · 날씨 바꾸기</button>
    <div class="vl-envp card" id="vlEnvP" hidden>
      <label>시간 <select id="vlEnvTime">${Object.keys(VL_TNAME).map(k=>`<option value="${k}">${VL_TNAME[k]}</option>`).join('')}</select></label>
      <label id="vlEnvSpdL">하루 길이 <select id="vlEnvSpd"><option value="12">12분</option><option value="24">24분</option><option value="48">48분</option></select></label>
      <label>날씨 <select id="vlEnvW"><option value="auto">🔄 자동으로 바뀌기</option>${Object.keys(VL_WNAME).map(k=>`<option value="${k}">${VL_WNAME[k]}</option>`).join('')}</select></label>
      <p class="vl-envmsg" id="vlEnvMsg">학생 화면에도 같이 바뀌어요</p></div>`;
  $('#vlEnvBtn').onclick=()=>{ const p=$('#vlEnvP'); p.hidden=!p.hidden; if (!p.hidden) vlEnvPanelSync(); };
  ['vlEnvTime','vlEnvSpd','vlEnvW'].forEach(id=>{ $('#'+id).onchange=vlEnvPanelSave; });
  ['keydown','keyup'].forEach(t=>$('#vlEnvP').addEventListener(t,e=>e.stopPropagation()));
}
function vlEnvPanelSync(){ const E=vlEnvCur(), t=$('#vlEnvTime'); if (!t) return; t.value=E.time; $('#vlEnvSpd').value=String([12,24,48].includes(E.speed)?E.speed:24); $('#vlEnvW').value=E.weather; $('#vlEnvSpdL').hidden=E.time!=='auto'; }
function vlEnvPanelSave(){ const v=vlEnvClean({time:$('#vlEnvTime').value,speed:+$('#vlEnvSpd').value,weather:$('#vlEnvW').value}); VL_ENV_LOCAL=v; vlEnvPanelSync();
  const msg=(t,ok)=>{ const e=$('#vlEnvMsg'); if (e){ e.textContent=t; e.style.color=ok?'#15803d':'#b4472a'; } };
  if (!fbDb){ msg('지금은 내 화면에서만 바뀌어요',false); return; }
  fbDb.ref('settings/villageEnv').set(v).then(()=>msg('저장했어요 · 학생 화면에도 바뀌어요',true)).catch(()=>msg('저장하지 못했어요 · 새 보안 규칙을 올리면 학생 화면에도 바뀌어요 (지금은 내 화면만)',false)); }
