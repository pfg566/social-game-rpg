/* 사회 게임 RPG · 🏃 정답 러너 (리메이크)
   코스: 출발선 → 🌾 들판 마을 길 → 🍁 단풍 숲길 → 🌊 바닷가 절벽길 → 🏰 성곽 도시 → 🏁 결승선 경기장
         (풍경이 바뀌는 곳의 문을 지나면 다음 풍경이 시작되고, 하늘도 낮 → 황금빛 오후 → 노을로 바뀌어요)
   정답 문: 등불 달린 아치 · 색깔 문 · 멀리서도 보이는 빛기둥 · 줄마다 문까지 이어지는 색 카펫
   놀이: 문제 길이에 맞춘 시간 · 처음 몇 초는 크게 읽기(천천히 달리고 장애물 없음) · S 천천히 · 숫자 1~4 · 틀리면 해설 정리 구간
         빠른 결정 점수 · 장애물에 부딪히면 코인을 흘려요 · ⭐ 힌트 별 · 코스 진행 막대 · 결승선
   길은 40m 타일 9장을 이어 붙여요. 타일마다 풍경 본(템플릿)을 복제해 붙이고, 지나간 타일은 앞으로 옮겨 다시 써요.
   파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
const RUN_LANES=[-4.5,-1.5,1.5,4.5], RUN_COL=['#e5484d','#3b82f6','#22a35a','#e8a400'], RUN_OXCOL=['#3b82f6','#e5484d'];
const RUN_TILE=40, RUN_NT=9;
// 단계별: 문제 수 · 기본 속도 · 읽는 시간 배율 · 한 줄에 장애물이 나올 확률
const RUN_LV={easy:{n:10,spd:8,read:1.12,obs:.42}, normal:{n:12,spd:9.5,read:1,obs:.72}, hard:{n:15,spd:11,read:.88,obs:.82}, hero:{n:18,spd:12.5,read:.78,obs:.88}};
const RN_READ=2.6, RN_READK=.45, RN_SLOWK=.5, RN_BEEP=[1.8,1.2,.6];   // 크게 읽는 시간(초) · 그동안 속도 · S 천천히 · 문 앞 삑 소리(남은 초)
const RN_BIOME=['field','forest','sea','castle'];
const RN_BNAME={field:'🌾 들판 마을 길',forest:'🍁 단풍 숲길',sea:'🌊 바닷가 절벽길',castle:'🏰 성곽 도시',finish:'🏁 결승선 경기장'};
const RN_ROADK={field:'dirt',forest:'leaf',sea:'flag',castle:'cobble',finish:'track'};
const RN_AU=['#d9532a','#e8742c','#f09a34','#c9402a','#e7b23c','#b85a2a'];
const RN_GRN=['#7cae46','#8fbd4f','#6a9e3c','#86b84a','#5f9438'];
const RUN={lane:1,y:0,vy:0,spd:9,curSpd:9,stun:0,slowT:0,hearts:3,combo:0,maxCombo:0,coinsN:0,done:0,n:12,nextAt:0,lean:0,lv:null,hits:0,
  gate:null,old:[],obs:[],coins:[],stars:[],pieces:[],gz:[],spawned:0,hint:0,slow:false,explain:null,resT:0,fin:null,finZ:null,results:[],biome:'field',mood:0,toastT:0,land:0,pickI:-1};
const RN={built:false,root:null,dyn:null,tiles:[],tpl:{},pc:{},frame:{},obsT:{},geo:{},mats:null,skyG:null,skyU:null,mtnU:[],WU:null,
  coinIM:null,coinMax:180,fly:[],chars:{start:[],fin:[]},leaves:null,leavesU:null,moodAt:-1,natOK:false,glow:0,glowOn:undefined,star:null,wheat:[],wq:'',ui:{}};
const RN_D=new THREE.Object3D(), RN_V=new THREE.Vector3(), RN_DB=new THREE.Vector2(), RN_CA=new THREE.Color(), RN_CB=new THREE.Color(); RN_D.rotation.order='YXZ';

/* 글자를 줄 바꿈 (다른 모드도 같이 써요) */
function runWrap(g,text,maxW,font,lineH,maxLines){
  g.font=font; const words=String(text).split(''), lines=[]; let cur='';
  for (const ch of words){ const t=cur+ch; if (g.measureText(t).width>maxW && cur){ lines.push(cur); cur=ch.trim()?ch:''; } else cur=t; }
  if (cur) lines.push(cur);
  if (lines.length>maxLines){ lines.length=maxLines; lines[maxLines-1]=lines[maxLines-1].slice(0,-1)+'…'; }
  return lines;
}

/* ---------- 그림 (텍스처) ---------- */
function rnTex(w,h,fn,rep){ return vlTex(vlCanvas(w,h,fn),rep); }
function rnSpeck(g,w,h,n,cols,a,b){ for (let i=0;i<n;i++){ g.fillStyle=cols[(Math.random()*cols.length)|0]; const s=a+Math.random()*(b-a); g.fillRect(Math.random()*w,Math.random()*h,s,s*(.5+Math.random())); } }
function rnLeaf(g,x,y,s,col){ g.save(); g.translate(x,y); g.rotate(Math.random()*6.3); g.fillStyle=col; g.beginPath(); g.ellipse(0,0,s,s*.55,0,0,7); g.fill(); g.restore(); }
function rnBlot(g,S,n,cols,a,b){ for (let i=0;i<n;i++){ const x=Math.random()*S, y=Math.random()*S, r=a+Math.random()*(b-a), c=cols[(Math.random()*cols.length)|0];
  vlWrapDraw(S,x,y,r,(X,Y)=>{ const gr=g.createRadialGradient(X,Y,0,X,Y,r); gr.addColorStop(0,c); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(X-r,Y-r,2*r,2*r); }); } }
function rnCobble(u,v){ if (!DF_COB) DF_COB=gfCobbleTex(0,false); const t=DF_COB.clone(); t.needsUpdate=true; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(u,v); return t; }
// 길 바닥: 흙길 · 낙엽 흙길 · 판석 · 둥근 돌 · 붉은 트랙 (줄 표시는 따로 한 겹 더 깔아요)
function rnRoadTex(k){
  if (k==='cobble') return rnCobble(12.4/3.4,40/3.4);
  const S=256, t=rnTex(S,S,g=>{
    if (k==='dirt'||k==='leaf'){ g.fillStyle=k==='dirt'?'#b39466':'#9a7a54'; g.fillRect(0,0,S,S);
      rnSpeck(g,S,S,2600,['rgba(140,105,60,.2)','rgba(255,240,205,.2)','rgba(90,66,40,.15)'],1,4);
      for (const u of [.13,.37,.63,.87]){ const x=u*S, gr=g.createLinearGradient(x-15,0,x+15,0); gr.addColorStop(0,'rgba(90,64,38,0)'); gr.addColorStop(.5,'rgba(90,64,38,.15)'); gr.addColorStop(1,'rgba(90,64,38,0)'); g.fillStyle=gr; g.fillRect(x-15,0,30,S); }
      const e=g.createLinearGradient(0,0,S,0); e.addColorStop(0,'rgba(70,52,30,.55)'); e.addColorStop(.06,'rgba(70,52,30,0)'); e.addColorStop(.94,'rgba(70,52,30,0)'); e.addColorStop(1,'rgba(70,52,30,.55)'); g.fillStyle=e; g.fillRect(0,0,S,S);
      if (k==='leaf') for (let i=0;i<280;i++){ const ed=Math.random()<.72, x=ed?(Math.random()<.5?Math.random()*S*.2:S-Math.random()*S*.2):Math.random()*S; rnLeaf(g,x,Math.random()*S,2.4+Math.random()*3.6,RN_AU[(Math.random()*RN_AU.length)|0]); } }
    else if (k==='flag'){ g.fillStyle='#8a8275'; g.fillRect(0,0,S,S);
      for (let y=0;y<S;y+=32){ let x=-Math.random()*30; while (x<S){ const w=26+Math.random()*30, v=.86+Math.random()*.2; g.fillStyle=`rgb(${214*v|0},${204*v|0},${186*v|0})`; roundRect(g,x+1.5,y+1.5,w-3,29,4); g.fill(); g.fillStyle='rgba(255,255,255,.08)'; g.fillRect(x+3,y+3,w-6,5); x+=w; } }
      rnSpeck(g,S,S,1400,['rgba(0,0,0,.08)','rgba(255,255,255,.1)'],1,2.5); }
    else { g.fillStyle='#b9472f'; g.fillRect(0,0,S,S); rnSpeck(g,S,S,5200,['rgba(0,0,0,.1)','rgba(255,200,170,.1)'],1,2); } },true);
  if (k==='dirt'||k==='leaf'){ t.wrapS=THREE.ClampToEdgeWrapping; t.repeat.set(1,40/6); } else if (k==='flag') t.repeat.set(12.4/4,10); else t.repeat.set(3,10);
  return t; }
// 줄 표시 (점선 · 트랙은 실선)
function rnLaneTex(solid){ const t=rnTex(256,64,g=>{ g.clearRect(0,0,256,64); g.fillStyle=solid?'rgba(255,255,255,.95)':'rgba(255,250,236,.9)';
  for (const u of [3.2/12.4,.5,9.2/12.4]){ const x=u*256; if (solid) g.fillRect(x-1.7,0,3.4,64); else g.fillRect(x-1.7,8,3.4,38); }
  if (solid){ g.fillRect(3,0,3.4,64); g.fillRect(249.6,0,3.4,64); } },true); t.wrapS=THREE.ClampToEdgeWrapping; t.repeat.set(1,40/3); return t; }
function rnGroundTex(k){
  if (k==='castle') return rnCobble(240/3.4,40/3.4);
  if (k==='finish'){ const t=rnTex(16,128,g=>{ g.fillStyle='#5a9438'; g.fillRect(0,0,16,128); g.fillStyle='#6aaa42'; g.fillRect(0,0,16,64); },true); t.repeat.set(1,5); return t; }
  const S=256, t=rnTex(S,S,g=>{ g.fillStyle={field:'#6c9c40',forest:'#6e5832',sea:'#7aa84c'}[k]; g.fillRect(0,0,S,S);
    if (k==='forest'){ rnBlot(g,S,50,['rgba(160,84,30,.35)','rgba(60,46,26,.32)','rgba(120,110,50,.25)'],12,40); for (let i=0;i<900;i++) rnLeaf(g,Math.random()*S,Math.random()*S,2+Math.random()*3.4,RN_AU[(Math.random()*RN_AU.length)|0]); rnSpeck(g,S,S,900,['rgba(0,0,0,.12)','rgba(255,220,160,.1)'],1,2.5); }
    else { rnBlot(g,S,56,['rgba(160,190,80,.3)','rgba(40,70,25,.28)','rgba(120,150,60,.25)'],10,38); rnSpeck(g,S,S,2200,['rgba(30,60,20,.18)','rgba(200,230,140,.14)'],1,2.5);
      if (k==='sea') rnSpeck(g,S,S,260,['rgba(255,240,120,.85)','rgba(255,255,255,.85)','rgba(220,170,255,.75)'],1.5,2.5); } },true);
  t.repeat.set((k==='sea'?132.2:240)/8,5); return t; }
function rnChevTex(){ return rnTex(128,128,g=>{ g.fillStyle='rgba(255,255,255,.38)'; g.fillRect(0,0,128,128); g.fillStyle='#fff';
  g.beginPath(); g.moveTo(16,84); g.lineTo(64,34); g.lineTo(112,84); g.lineTo(112,106); g.lineTo(64,58); g.lineTo(16,106); g.closePath(); g.fill(); },true); }
function rnBeamTex(){ return rnTex(32,256,g=>{ const gr=g.createLinearGradient(0,256,0,0); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(.03,'rgba(255,255,255,1)'); gr.addColorStop(.3,'rgba(255,255,255,.55)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,32,256);
  g.globalCompositeOperation='destination-in'; const h=g.createLinearGradient(0,0,32,0); h.addColorStop(0,'rgba(0,0,0,0)'); h.addColorStop(.5,'rgba(0,0,0,1)'); h.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=h; g.fillRect(0,0,32,256); }); }
// 정답 문 한 짝: 색 판 · 흰 테두리 · 번호 동그라미 · 보기 글
function rnDoorTex(label,text,color,wide){ const W2=wide?1024:512, H2=wide?720:780;
  return rnTex(W2,H2,g=>{ roundRect(g,6,6,W2-12,H2-12,44); g.fillStyle=color; g.fill();
    g.save(); roundRect(g,6,6,W2-12,H2-12,44); g.clip();
    const gr=g.createLinearGradient(0,0,0,H2); gr.addColorStop(0,'rgba(255,255,255,.3)'); gr.addColorStop(.45,'rgba(255,255,255,0)'); gr.addColorStop(1,'rgba(0,0,0,.25)'); g.fillStyle=gr; g.fillRect(0,0,W2,H2);
    g.fillStyle='rgba(0,0,0,.09)'; for (let x=48;x<W2;x+=72) g.fillRect(x,0,4,H2); g.restore();
    g.strokeStyle='rgba(255,255,255,.95)'; g.lineWidth=14; roundRect(g,22,22,W2-44,H2-44,32); g.stroke();
    g.textAlign='center'; g.textBaseline='middle';
    if (!text){ g.fillStyle='#fff'; g.shadowColor='rgba(0,0,0,.35)'; g.shadowBlur=14; g.shadowOffsetY=6; g.font='bold 440px Jua, "Malgun Gothic", sans-serif'; g.fillText(label,W2/2,H2/2+30); return; }
    g.fillStyle='#fff'; g.beginPath(); g.arc(W2/2,146,88,0,7); g.fill(); g.fillStyle=color; g.font='bold 132px Jua, "Malgun Gothic", sans-serif'; g.fillText(label,W2/2,154);
    g.fillStyle='#fff'; g.shadowColor='rgba(0,0,0,.4)'; g.shadowBlur=10; g.shadowOffsetY=4;
    const len=String(text).length, fs=len>26?44:len>18?52:len>11?62:76, lines=runWrap(g,text,W2-72,`bold ${fs}px Jua, "Malgun Gothic", sans-serif`,fs*1.18,4);
    lines.forEach((l,i)=>g.fillText(l,W2/2,490+(i-(lines.length-1)/2)*fs*1.18)); }); }
function rnSignTex(text,o){ o=o||{}; const W2=o.w||1024, H2=o.h||256;
  return rnTex(W2,H2,g=>{ g.save(); roundRect(g,0,0,W2,H2,H2*.2); g.clip(); g.fillStyle=o.bg||'#6a4a2c'; g.fillRect(0,0,W2,H2);
    if (o.check){ const c=H2*.13; for (let x=0;x<W2;x+=c) for (const y of [0,H2-c]){ g.fillStyle=((x/c|0)+(y?1:0))%2?'#16161a':'#fafaf6'; g.fillRect(x,y,c+1,c); } }
    g.restore(); g.strokeStyle=o.edge||'#e0b85a'; g.lineWidth=H2*.055; roundRect(g,H2*.07,H2*.07,W2-H2*.14,H2-H2*.14,H2*.14); g.stroke();
    g.fillStyle=o.fg||'#ffe9b0'; g.font=`bold ${Math.round(H2*(o.fs||.5))}px Jua, "Malgun Gothic", sans-serif`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,W2/2,H2*.55); }); }
function rnCheckTex(n){ return rnTex(256,256,g=>{ const c=256/n; for (let i=0;i<n;i++) for (let j=0;j<n;j++){ g.fillStyle=(i+j)%2?'#1b1b1f':'#f6f4ee'; g.fillRect(i*c,j*c,c,c); } },true); }
function rnBarrelTex(){ return rnTex(256,128,g=>{ for (let i=0;i<10;i++){ const v=.82+Math.random()*.22; g.fillStyle=`rgb(${138*v|0},${92*v|0},${54*v|0})`; g.fillRect(i*25.6,0,26,128); g.fillStyle='rgba(40,22,10,.5)'; g.fillRect(i*25.6,0,2,128); }
  for (const y of [14,104]){ g.fillStyle='#3a3634'; g.fillRect(0,y,256,10); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(0,y,256,2); } }); }
function rnBarkTex(){ return rnTex(128,256,g=>{ g.fillStyle='#5a4230'; g.fillRect(0,0,128,256); for (let i=0;i<60;i++){ g.strokeStyle=`rgba(${30+Math.random()*30|0},${20+Math.random()*20|0},12,${.35+Math.random()*.3})`; g.lineWidth=1+Math.random()*3; const x=Math.random()*128; g.beginPath(); g.moveTo(x,0); g.bezierCurveTo(x+(Math.random()-.5)*14,85,x+(Math.random()-.5)*14,170,x+(Math.random()-.5)*10,256); g.stroke(); }
  rnSpeck(g,128,256,500,['rgba(120,100,70,.25)','rgba(0,0,0,.2)'],1,3); },true); }
function rnStripeTex(a,b,n){ return rnTex(256,32,g=>{ const w=256/n; for (let i=0;i<n;i++){ g.fillStyle=i%2?b:a; g.fillRect(i*w,0,w,32); } },true); }
function rnFlagTex(c){ return vlTex(vlCanvas(128,192,g=>{ g.beginPath(); g.moveTo(0,0); g.lineTo(128,0); g.lineTo(128,192); g.lineTo(64,150); g.lineTo(0,192); g.closePath(); g.fillStyle=c; g.fill(); g.fillStyle='rgba(255,255,255,.85)'; g.fillRect(0,40,128,16); g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(0,0,128,10); })); }
function rnXTex(){ if (RN.xTex) return RN.xTex; return RN.xTex=rnTex(128,128,g=>{ g.lineCap='round'; g.strokeStyle='rgba(30,30,40,.75)'; g.lineWidth=30; g.beginPath(); g.moveTo(26,26); g.lineTo(102,102); g.moveTo(102,26); g.lineTo(26,102); g.stroke(); g.strokeStyle='#d8dce6'; g.lineWidth=18; g.stroke(); }); }
function rnCheckSprite(){ const t=rnTex(256,96,g=>{ g.fillStyle='#1f9d55'; roundRect(g,4,4,248,88,44); g.fill(); g.strokeStyle='#fff'; g.lineWidth=6; roundRect(g,8,8,240,80,40); g.stroke(); g.fillStyle='#fff'; g.font='bold 54px Jua, "Malgun Gothic", sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('✓ 정답',128,52); });
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false,fog:false,toneMapped:false})); sp.scale.set(2.6,.98,1); sp.renderOrder=9; return sp; }

/* ---------- 재질 ---------- */
function rnWaterU(){ if (RN.WU) return RN.WU; return RN.WU={uTime:{value:0},uSun:{value:new THREE.Vector3(.5,.62,.3).normalize()},uSunCol:{value:new THREE.Color(1,.93,.8)},uTop:{value:new THREE.Color()},uHor:{value:new THREE.Color()},uFog:{value:new THREE.Color()},uFogN:{value:60},uFogF:{value:230},uLightK:{value:new THREE.Color(1,1,1)}}; }
const RN_NOISE=`float h2(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h2(i),h2(i+vec2(1.,0.)),f.x),mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),f.x),f.y); }`;
// 바다: 절벽(x≈13) 아래로 거품 · 얕은 청록 → 깊은 파랑 · 해 반짝임
function rnSeaMat(){ return new THREE.ShaderMaterial({uniforms:rnWaterU(),
  vertexShader:'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
  fragmentShader:`uniform float uTime,uFogN,uFogF; uniform vec3 uSun,uSunCol,uTop,uHor,uFog,uLightK; varying vec3 vW; ${RN_NOISE}
    float wav(vec2 p){ return vn(p+vec2(uTime*.35,uTime*.2))*.5+vn(p*2.3+vec2(-uTime*.5,uTime*.4))*.3+vn(p*5.1+vec2(uTime*.9,-uTime*.6))*.2; }
    void main(){ float sh=vW.x-13.4; vec2 p=vW.xz*.2; float e=.07; float n0=wav(p), nx=wav(p+vec2(e,0.)), nz=wav(p+vec2(0.,e));
      vec3 N=normalize(vec3((n0-nx)*1.2,1.,(n0-nz)*1.2)); vec3 V=normalize(cameraPosition-vW); float fr=.03+.97*pow(1.-max(dot(N,V),0.),5.);
      vec3 R=reflect(-V,N); vec3 sky=mix(uHor,uTop,pow(max(R.y,0.),.5)); float s=max(dot(R,uSun),0.);
      vec3 base=mix(vec3(.08,.5,.56),vec3(.02,.15,.3),smoothstep(1.,24.,sh))*uLightK;
      vec3 col=mix(base,sky,clamp(fr*.85+.06,0.,1.)); col+=uSunCol*(pow(s,600.)*14.+pow(s,40.)*.45);
      vec2 sc=vW.xz*4.; float tw=step(.982,h2(floor(sc)+floor(uTime*2.5)))*smoothstep(.22,.0,length(fract(sc)-.5))*pow(s,3.)*2.; col+=uSunCol*tw;
      float lines=smoothstep(.8,1.,sin(sh*2.4-uTime*2.+n0*4.)*.5+.5)*(1.-smoothstep(.6,5.,sh));
      float foam=clamp((1.-smoothstep(.0,1.4,sh))*(.6+.4*n0)+lines*.7,0.,1.); col=mix(col,vec3(.96,.98,1.)*uLightK,foam*.85);
      float dist=length(vW-cameraPosition); col=mix(col,uFog,smoothstep(uFogN,uFogF,dist));
      gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
    }`}); }
// 시냇물 (단풍 숲): 옆으로 흘러요
function rnStreamMat(){ return new THREE.ShaderMaterial({uniforms:rnWaterU(),transparent:true,depthWrite:false,
  vertexShader:'varying vec3 vW; varying vec2 vU; void main(){ vU=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
  fragmentShader:`uniform float uTime,uFogN,uFogF; uniform vec3 uSun,uSunCol,uTop,uHor,uFog,uLightK; varying vec3 vW; varying vec2 vU; ${RN_NOISE}
    void main(){ vec2 p=vec2(vW.x*.5-uTime*1.1,vU.y*3.); float n0=vn(p)*.6+vn(p*2.4+vec2(-uTime*.7,0.))*.4, n1=vn(p+vec2(.06,0.))*.6+vn((p+vec2(.06,0.))*2.4+vec2(-uTime*.7,0.))*.4;
      vec3 N=normalize(vec3((n0-n1)*1.4,1.,0.)); vec3 V=normalize(cameraPosition-vW); float fr=.04+.96*pow(1.-max(dot(N,V),0.),5.); vec3 R=reflect(-V,N);
      vec3 sky=mix(uHor,uTop,pow(max(R.y,0.),.5)); float s=max(dot(R,uSun),0.);
      float ed=1.-abs(vU.y*2.-1.); vec3 col=mix(vec3(.2,.3,.22),vec3(.05,.14,.15),smoothstep(.0,.7,ed))*uLightK; col=mix(col,sky,clamp(fr+.15,0.,1.)); col+=uSunCol*pow(s,200.)*6.;
      col+=vec3(.9,.95,1.)*smoothstep(.65,.9,n0)*.3*uLightK; float a=mix(.0,.9,smoothstep(.0,.18,ed));
      float dist=length(vW-cameraPosition); col=mix(col,uFog,smoothstep(uFogN,uFogF,dist));
      gl_FragColor=vec4(col,a);
      #include <tonemapping_fragment>
    }`}); }
// 관중: 자리에서 들썩들썩 (인스턴스마다 박자가 달라요)
function rnCrowdMat(){ const m=new THREE.MeshStandardMaterial({roughness:.85,metalness:0});
  m.onBeforeCompile=sh=>{ sh.uniforms.uTime=NAT_U.uTime; sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\n float ph=instanceMatrix[3].x*1.31+instanceMatrix[3].z*.73;\n#else\n float ph=0.;\n#endif\n transformed.y+=max(0.,sin(uTime*6.5+ph))*.2;'); };
  m.customProgramCacheKey=()=>'rncrowd'; return m; }
function rnMats(){ if (RN.mats) return RN.mats;
  const std=o=>new THREE.MeshStandardMaterial(Object.assign({roughness:.92,metalness:0},o)), C=h=>VL_LIN(h);
  const M={road:{},ground:{}};
  const off=(m,f)=>{ m.polygonOffset=true; m.polygonOffsetFactor=-f; m.polygonOffsetUnits=-f*2; return m; };
  for (const k of ['dirt','leaf','flag','cobble','track']) M.road[k]=off(std({map:rnRoadTex(k),roughness:k==='track'?.8:.95}),1);
  for (const k of ['field','forest','sea','castle','finish']) M.ground[k]=std({map:rnGroundTex(k),roughness:1});
  M.lane=off(std({map:rnLaneTex(false),transparent:true,depthWrite:false,roughness:.8}),2); M.laneT=off(std({map:rnLaneTex(true),transparent:true,depthWrite:false,roughness:.8}),2);
  M.curb={field:std({color:C('#9a8f7c')}),forest:std({color:C('#6f7558')}),sea:std({color:C('#cfc8b8')}),castle:std({color:C('#8a8580')}),finish:std({color:C('#f2efe6')})};
  M.bark=std({map:rnBarkTex(),roughness:1}); M.barkEnd=std({color:C('#c9a46e')});
  M.barrel=std({map:rnBarrelTex(),roughness:.85}); M.hurdle=std({map:rnStripeTex('#d8433a','#f6f2ea',8),roughness:.7});
  M.mud=off(std({color:C('#4a3522'),roughness:.22,transparent:true,opacity:.9,depthWrite:false}),3); M.puddle=off(std({color:C('#7b95a6'),roughness:.08,metalness:.25,transparent:true,opacity:.72,depthWrite:false}),3);
  M.coin=std({color:0xffc531,emissive:0xb37a00,emissiveIntensity:.5,metalness:.6,roughness:.3}); M.star=std({color:0xffd34d,emissive:0xffa820,emissiveIntensity:.95,metalness:.25,roughness:.35});
  M.paint={}; for (const [k,h] of Object.entries({white:'#f3efe6',blue:'#3b6fd9',red:'#d8433a',yellow:'#f2c230',green:'#3aa860',navy:'#27406e',purple:'#9a55d6'})) M.paint[k]=std({color:C(h)});
  M.bunt=['#e5484d','#f2c230','#3b82f6','#22a35a','#f3efe6','#a855f7'].map(h=>std({color:C(h),side:THREE.DoubleSide}));
  M.check=std({map:rnCheckTex(8),roughness:.6}); M.checkLine=off(std({map:(()=>{ const t=rnCheckTex(2); t.repeat.set(12.4/1.4,1); return t; })(),roughness:.7}),3);
  M.banner=dfClothMat(dfBannerTex(false)); M.flags=['#e5484d','#3b82f6','#22a35a','#e8a400','#a855f7'].map(c=>dfClothMat(rnFlagTex(c)));
  M.sea=rnSeaMat(); M.stream=rnStreamMat(); M.bank=off(std({color:C('#5a4630'),roughness:1}),1); M.cliff=vlMats().stone2;
  M.chev=rnChevTex(); M.beamT=rnBeamTex(); M.crowd=rnCrowdMat(); M.crowdHead=rnCrowdMat(); M.lamp=new THREE.MeshBasicMaterial({color:0xfff2b0,toneMapped:false});
  M.wheat=new THREE.ShaderMaterial({uniforms:(()=>{ const U=rnWaterU(); return {uTime:NAT_U.uTime,uSun:U.uSun,uSunCol:U.uSunCol,uFog:U.uFog,uFogN:U.uFogN,uFogF:U.uFogF,uLightK:U.uLightK}; })(),side:THREE.DoubleSide,
    vertexShader:`attribute vec3 aOff; attribute vec4 aP; attribute float aHd; uniform float uTime; varying float vH,vHd,vV; varying vec3 vW;
      void main(){ float c=cos(aP.x), s=sin(aP.x); float h=position.y; vec3 p=vec3(position.x*c-position.z*s, h*aP.y, position.x*s+position.z*c);
        float g=sin(uTime*1.25+aOff.x*.32+aOff.z*.18)*.6+sin(uTime*2.3+aOff.x*.9-aOff.z*.6)*.2+.25; p.xz+=vec2(.8,.5)*g*.24*h*h;
        vec4 W4=modelMatrix*vec4(aOff+p,1.); vW=W4.xyz; vH=h; vHd=aHd; vV=aP.z; gl_Position=projectionMatrix*viewMatrix*W4; }`,
    fragmentShader:`uniform vec3 uSun,uSunCol,uFog,uLightK; uniform float uFogN,uFogF; varying float vH,vHd,vV; varying vec3 vW;
      void main(){ vec3 st=mix(vec3(.2,.2,.05),vec3(.62,.52,.16),smoothstep(0.,.75,vH)); vec3 hc=mix(vec3(.66,.5,.15),vec3(.86,.7,.3),vV);
        vec3 alb=mix(st,hc,vHd)*(.85+.3*vV); vec3 col=alb*uLightK; vec3 V=normalize(vW-cameraPosition); col+=uSunCol*pow(max(dot(V,uSun),0.),4.)*vH*.45;
        float dist=length(vW-cameraPosition); col=mix(col,uFog,smoothstep(uFogN,uFogF,dist)); gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
      }`});
  return RN.mats=M; }
function rnGeos(){ const G=RN.geo;
  G.ground=new THREE.PlaneGeometry(240,40.05); G.groundSea=new THREE.PlaneGeometry(132.2,40.05); G.road=new THREE.PlaneGeometry(12.4,40.05); G.sea=new THREE.PlaneGeometry(328,40.4); G.curb=vlMergeGeos([new THREE.BoxGeometry(.5,.28,40.05).translate(-6.45,0,0),new THREE.BoxGeometry(.5,.28,40.05).translate(6.45,0,0)]);
  { const g=new THREE.PlaneGeometry(40.4,5.6,28,7), p=g.attributes.position; for (let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), e=Math.abs(x)>19.9?0:1; p.setZ(i,(Math.sin(x*1.3+y)*.28+Math.sin(x*3.3+y*2.1)*.16+(Math.random()-.5)*.22)*e); } g.computeVertexNormals(); g.rotateY(Math.PI/2); G.cliff=g; }
  G.body=vlMergeGeos([new THREE.CylinderGeometry(.2,.27,.66,8).translate(0,.33,0),new THREE.BoxGeometry(.09,.5,.09).rotateZ(.45).translate(.27,.86,0),new THREE.BoxGeometry(.09,.5,.09).rotateZ(-.45).translate(-.27,.86,0)]);
  G.head=new THREE.SphereGeometry(.19,10,8).translate(0,.88,0); }

/* ---------- 작은 도구 ---------- */
const rnTint=k=>k==='gr'?VL_LIN(RN_GRN[(Math.random()*RN_GRN.length)|0]).multiplyScalar(rnd(.92,1.06)):VL_LIN(VL_TINT[k][(Math.random()*VL_TINT[k].length)|0]).multiplyScalar(rnd(.9,1.08));
const rnPickN=(a,n)=>a.slice().sort(()=>Math.random()-.5).slice(0,n), rnOf=a=>a[(Math.random()*a.length)|0];
let RN_TREES=['CommonTree_3','CommonTree_5'], RN_PINES=['Pine_4'];   // 본마다 다시 골라요 (가벼운 나무 위주)
const rnTree=()=>rnOf(RN_TREES), rnPine=()=>rnOf(RN_PINES);
function rnTreeSet(){ RN_TREES=rnPickN(['CommonTree_3','CommonTree_5','CommonTree_4'],2).concat(Math.random()<.35?['CommonTree_1']:[]); RN_PINES=rnPickN(['Pine_4','Pine_2'],1); }
// 나무 · 덤불 · 풀 (Quaternius 모델): 모델별로 인스턴스 묶음을 만들어 본에 붙여요. 화면 밖이면 안 그려요 (그림자도)
// 이름 뒤 '@색'을 붙이면 그 색으로 물든 복사본 재질을 써요 (예: 단풍 덤불)
function rnNatTo(par,list){
  if (!list||!list.length) return;
  if (!RN.natOK){ (par.rnNat=par.rnNat||[]).push(...list); return; }
  // 작은 풀 · 꽃은 보통 화질에서 60%, 가벼움에서 40%만 심어요 (나무 · 덤불은 그대로)
  const keep=QCUR==='high'?1:QCUR==='medium'?.6:.4, by={}; let sm=0;
  list.forEach(p=>{ if (keep<1&&/^(Flower|Clover|Fern|Plant|Grass_|Mushroom)/.test(p.n)&&((sm++*.618)%1)>=keep) return; (by[p.n]=by[p.n]||[]).push(p); });
  for (const key in by){ const P2=by[key], at=key.indexOf('@'), name=at<0?key:key.slice(0,at), col=at<0?null:VL_LIN(key.slice(at+1));
    const ims=vlInst(name,P2,{shadow:/Tree|Pine/.test(name),col:col||undefined,cull:false});
    let cx=0, cy=0, cz=0; P2.forEach(p=>{ cx+=p.x; cy+=p.y||0; cz+=p.z; }); cx/=P2.length; cy/=P2.length; cz/=P2.length; let r=0; P2.forEach(p=>{ r=Math.max(r,Math.hypot(p.x-cx,p.z-cz)+8*(p.s||1)); });
    ims.forEach(im=>{ const g=new THREE.BufferGeometry(), s=im.geometry; for (const k in s.attributes) g.setAttribute(k,s.attributes[k]); if (s.index) g.setIndex(s.index); s.groups.forEach(q=>g.addGroup(q.start,q.count,q.materialIndex));
      g.boundingSphere=new THREE.Sphere(new THREE.Vector3(cx,cy+4,cz),r+3); im.geometry=g; im.frustumCulled=true; par.add(im); }); } }
function rnTplDone(T,S,nat){ vlMerge(S); rnNatTo(T,nat); T.traverse(o=>{ if (o.isSprite) o.userData.halo=1; }); T.rnPool=[]; return T; }
function rnTake(T){ let d=T.rnPool.pop(); if (!d){ d=T.clone(); d.rnT=T; const L={spin:[],bob:[],halo:[]}; d.traverse(o=>{ const u=o.userData; if (u.spin||u.spinY) L.spin.push(o); if (u.bob!=null) L.bob.push(o); if (u.halo) L.halo.push(o); }); d.rnL=L; } return d; }
function rnFree(d){ if (!d) return; if (d.parent) d.parent.remove(d); if (d.rnT) d.rnT.rnPool.push(d); }
function rnHaloVis(d){ if (d&&d.rnL) d.rnL.halo.forEach(h=>{ h.visible=!!RN.glowOn; }); }
function rnHaloAll(){ RN.tiles.forEach(t=>rnHaloVis(t.rn.decor)); RUN.pieces.forEach(p=>rnHaloVis(p.g)); if (RUN.gate) rnHaloVis(RUN.gate.fr); RUN.old.forEach(G=>rnHaloVis(G.fr)); }
function rnSignMesh(par,text,o,w,h,x,y,z,ry){ const t=rnSignTex(text,o), m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:0xffffff,emissiveIntensity:.42,roughness:.7,side:THREE.DoubleSide})); m.position.set(x,y,z); m.rotation.y=ry||0; m.userData.keep=true; m.castShadow=true; par.add(m); return m; }
function rnFence(put,M,x){ for (let z=-19.2;z<20;z+=2.6) put(vlBox(.13,.95,.13,.5),M.woodLight,x,.47,z+rnd(-.08,.08),0,rnd(-.08,.08),rnd(-.04,.04)); for (const y of [.36,.76]) put(vlBox(.06,.07,40.1,1),M.woodLight,x,y,0); }
function rnHay(put,X,x,z,s){ s=s||1; put(new THREE.CylinderGeometry(.9*s,1.0*s,1.15*s,14),X.straw,x,.57*s,z); put(new THREE.ConeGeometry(1.0*s,.85*s,14),X.straw,x,1.57*s,z); }
function rnBale(put,X,x,z,ry){ put(new THREE.CylinderGeometry(.62,.62,1.1,16),X.straw,x,.62,z,0,ry,Math.PI/2); }
function rnHouse(par,x,z,ry,H,sc){ const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry; g.scale.setScalar(sc||.9); par.add(g); vlHouse2(Object.assign({x:0,z:0,r:0,w:8,d:6,roof:'#a2553f',shut:'#3f6b4a'},H),g); return g; }
function rnScarecrow(par,x,z,ry){ const M=vlMats(), X=gfMats(), g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry; g.scale.setScalar(1.25); par.add(g); const p=vlPutter(g), B=vlBox;
  p(B(.12,2.2,.12,.6),M.wood,0,1.1,0); p(B(1.5,.1,.1,.6),M.wood,0,1.55,0); p(B(.62,.7,.32,1),X.shirt,0,1.42,0); for (const s of [-1,1]) p(B(.5,.18,.2,1),X.shirt,s*.5,1.55,0);
  p(new THREE.SphereGeometry(.24,10,8),X.burlap,0,2.0,0); p(new THREE.CylinderGeometry(.42,.42,.04,14),X.straw,0,2.2,0); p(new THREE.ConeGeometry(.22,.3,12),X.straw,0,2.36,0);
  for (const s of [-1,1]) p(new THREE.ConeGeometry(.09,.3,5),X.straw,s*.78,1.55,0,0,0,s*Math.PI/2); }
// 풍차 (들판 마을 풍차와 같은 모양 · 날개가 돌아요)
function rnWindmill(par,x,z,ry){ const M=vlMats(), X=gfMats(), g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry; par.add(g); const put=vlPutter(g), B=vlBox;
  put(vlUVScale(new THREE.CylinderGeometry(3.1,3.3,.5,28,1,true),8,.4),M.stone2,0,.25,0); put(new THREE.CircleGeometry(3.1,28),M.stoneLight,0,.5,0,-Math.PI/2,0,0);
  const O=Math.PI/8;
  put(new THREE.CylinderGeometry(2.36,2.42,1.3,8,1,false,O),M.stone,0,1.15,0); put(vlUVScale(new THREE.CylinderGeometry(1.62,2.3,6.8,8,1,false,O),3,2.6),M.plasterW,0,5.2,0);
  for (const [y,r] of [[1.85,2.36],[5.1,1.98],[8.55,1.66]]) put(new THREE.CylinderGeometry(r,r,.18,8,1,false,O),M.wood,0,y,0);
  put(new THREE.CylinderGeometry(2.9,2.9,.12,24),M.woodLight,0,5.2,0); for (let i=0;i<16;i++){ const a=i/16*Math.PI*2; put(B(.08,.75,.08,.5),M.wood,Math.cos(a)*2.8,5.6,Math.sin(a)*2.8); }
  put(new THREE.TorusGeometry(2.8,.05,5,40),M.wood,0,5.95,0,Math.PI/2,0,0);
  put(B(1.1,1.9,.14,1),M.door,0,1.45,2.26); put(B(1.4,.18,.3,.5),M.wood,0,2.48,2.3); for (const [y,zz] of [[3.8,1.98],[7.2,1.68]]) put(B(.6,.75,.1,.5),M.win,0,y,zz).castShadow=false;
  put(new THREE.CylinderGeometry(1.86,1.86,.34,16),M.wood,0,8.75,0); put(new THREE.ConeGeometry(2.08,2.5,16),M.roof('#5c4232'),0,10.15,0); put(new THREE.SphereGeometry(.16,10,8),M.wood,0,11.45,0);
  const hub=new THREE.Group(); hub.position.set(0,8.6,2.1); g.add(hub); put(new THREE.CylinderGeometry(.16,.16,1.2,10),M.wood,0,8.6,1.55,Math.PI/2,0,0);
  const sails=new THREE.Group(); hub.add(sails); sails.userData.spin=-.7;
  { const p=vlPutter(sails); p(new THREE.CylinderGeometry(.3,.3,.34,12),M.wood,0,0,.1,Math.PI/2,0,0);
    for (let k=0;k<4;k++){ const arm=new THREE.Group(); arm.rotation.z=k*Math.PI/2+.3; sails.add(arm); const pa=vlPutter(arm);
      pa(B(.16,5.8,.14,.6),M.wood,0,3.0,.18); for (let j=0;j<7;j++) pa(B(1.25,.06,.06,.5),M.wood,.55,1.2+j*.72,.2); pa(B(.06,4.6,.06,.5),M.wood,1.15,3.5,.2); pa(new THREE.PlaneGeometry(1.08,4.5),X.sail,.6,3.5,.24); } }
  sails.children.forEach(a=>{ if (a.isGroup) vlMerge(a); }); sails.traverse(o=>{ if (o.isMesh) o.userData.keep=true; }); }
function rnTower(par,x,z,r,h,roof){ const M=vlMats(), X=gfMats(), g=new THREE.Group(); g.position.set(x,0,z); par.add(g); const put=vlPutter(g);
  put(dfCyl(r+.3,r+.42,.9,24,1.6),M.stoneDark,0,.45,0); put(dfCyl(r,r+.08,h,24),M.stone,0,h/2,0); put(new THREE.CylinderGeometry(r+.16,r+.16,.24,24),M.stoneLight,0,h-.12,0);
  for (const a of [-.6,.6,Math.PI]) put(vlBox(.17,.85,.1),X.dark,Math.sin(a)*(r+.03),h*.55,Math.cos(a)*(r+.03),0,a,0).castShadow=false;
  const rh=r*1.7, rr=r+.55; put(new THREE.CylinderGeometry(r+.36,r+.22,.42,24),M.wood,0,h+.19,0);
  put(vlUVScale(new THREE.ConeGeometry(rr,rh,24,1,true),2*Math.PI*rr/2.2,Math.hypot(rh,rr)/2.2),M.roof(roof),0,h+.4+rh/2,0); put(new THREE.SphereGeometry(.16,10,8),X.gold,0,h+.4+rh+.04,0); return g; }
// 삼각 깃발 줄
function rnBunting(par,a,b,n){ const Rm=rnMats(), M=vlMats(), put=vlPutter(par), pts=[];
  for (let i=0;i<=n;i++){ const t=i/n, sag=Math.sin(t*Math.PI)*.55; pts.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-sag,a[2]+(b[2]-a[2])*t]); }
  for (let i=0;i<n;i++) dfRod(put,M.iron,pts[i],pts[i+1],.022,4).castShadow=false;
  const ry=-Math.atan2(b[2]-a[2],b[0]-a[0]);
  for (let i=0;i<n;i++){ const q=[(pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2,(pts[i][2]+pts[i+1][2])/2];
    const tri=new THREE.BufferGeometry(); tri.setAttribute('position',new THREE.Float32BufferAttribute([-.26,0,0, .26,0,0, 0,-.56,0],3)); tri.setAttribute('uv',new THREE.Float32BufferAttribute([0,1,1,1,.5,0],2)); tri.computeVertexNormals();
    put(tri,Rm.bunt[i%Rm.bunt.length],q[0],q[1],q[2],0,ry,0).castShadow=false; } }
function rnBalloons(par,x,y,z){ const Rm=rnMats(), M=vlMats(), put=vlPutter(par), cols=['red','yellow','blue','green','purple'];
  for (let i=0;i<4;i++){ const a=i/4*6.28+.4, bx=x+Math.cos(a)*.38, bz=z+Math.sin(a)*.38, by=y+1.1+(i%2)*.4; put(new THREE.SphereGeometry(.36,12,10),Rm.paint[cols[(i+((x*7)|0)+5)%5]],bx,by,bz).scale.set(1,1.18,1); dfRod(put,M.iron,[x,y,z],[bx,by-.4,bz],.012,3).castShadow=false; } }
function rnBoat(par,x,z,ry,col,sail){ const M=vlMats(), I=islMats(), g=new THREE.Group(); g.position.set(x,-4.5,z); g.rotation.y=ry; par.add(g); g.userData.bob=Math.random()*6; g.userData.y0=-4.5; const p=vlPutter(g);
  const hg=new THREE.BoxGeometry(1.8,.8,4.6,1,1,4), pa=hg.attributes.position; for (let j=0;j<pa.count;j++){ const y=pa.getY(j), zz=pa.getZ(j); let k=y<0?.6:1; if (zz>1.4) k*=1-(zz-1.4)/1.4*.85; pa.setX(j,pa.getX(j)*k); } hg.computeVertexNormals();
  p(hg,new THREE.MeshStandardMaterial({color:VL_LIN(col),roughness:.6}),0,.15,0); p(vlBox(1.6,.08,3.6,1),I.deck,0,.52,-.2);
  if (sail){ p(new THREE.CylinderGeometry(.05,.06,4.2,6),M.wood,0,2.5,.2); const sh=new THREE.Shape(); sh.moveTo(0,0); sh.lineTo(0,3.4); sh.lineTo(-1.9,0); sh.lineTo(0,0); p(new THREE.ShapeGeometry(sh),new THREE.MeshStandardMaterial({color:0xf6f1e4,roughness:.9,side:THREE.DoubleSide}),-.05,.85,.3,0,Math.PI/2,0); }
  else p(vlBox(1,.9,1.1,1),I.white,0,1,-.8);
  vlMerge(g); return g; }
function rnLighthouse(S,T,x,z){ const M=vlMats(), X=gfMats(), I=islMats(), g=new THREE.Group(); g.position.set(x,-4.6,z); S.add(g); const p=vlPutter(g);
  p(dfCyl(2.4,2.8,1.2,16,1.6),M.stoneDark,0,.6,0); for (let i=0;i<4;i++) p(new THREE.CylinderGeometry(1.45-(i+1)*.11,1.45-i*.11,2.3,18),i%2?I.red:I.white,0,1.2+i*2.3+1.15,0);
  p(new THREE.CylinderGeometry(1.25,1.25,.2,18),X.dark,0,10.5,0); for (let i=0;i<12;i++){ const a=i/12*6.28; p(vlBox(.05,.6,.05),X.dark,Math.cos(a)*1.2,10.85,Math.sin(a)*1.2); }
  p(new THREE.TorusGeometry(1.2,.04,5,24),X.dark,0,11.15,0,Math.PI/2,0,0); p(new THREE.CylinderGeometry(.75,.75,1.1,12),I.glass,0,11.25,0); p(new THREE.ConeGeometry(.95,.9,12),I.red,0,12.25,0); p(new THREE.SphereGeometry(.12,8,6),X.gold,0,12.75,0);
  const ly=-4.6+11.25, lamp=new THREE.Mesh(new THREE.SphereGeometry(.42,12,8),rnMats().lamp); lamp.position.set(x,ly,z); T.add(lamp);
  const h=new THREE.Sprite(new THREE.SpriteMaterial({map:vlGlowTex(),color:0xffe0a0,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending})); h.scale.setScalar(6); h.position.set(x,ly,z); T.add(h);
  const bm=new THREE.MeshBasicMaterial({color:0xfff2c0,transparent:true,opacity:.15,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const beam=new THREE.Group(); beam.position.set(x,ly,z); beam.userData.spinY=.9; beam.userData.halo=1; T.add(beam);
  for (const s of [-1,1]){ const c=new THREE.Mesh(new THREE.ConeGeometry(1.8,24,16,1,true).translate(0,-12,0),bm); c.rotation.z=s*Math.PI/2; beam.add(c); } }
function rnWheat(par,x0,x1,z0,z1,sp){ sp=sp||.3;
  const P0=[-.014,0,0, .014,0,0, -.011,.7,0, .011,.7,0, -.036,.82,0, .036,.82,0, 0,1,0, 0,.68,0], pos=[], hd=[], idx=[];
  for (const r of [0,Math.PI/2]){ const b=pos.length/3, c=Math.cos(r), s=Math.sin(r); for (let i=0;i<8;i++){ pos.push(P0[i*3]*c,P0[i*3+1],P0[i*3]*s); hd.push(i>=4?1:0); } idx.push(b,b+1,b+2, b+1,b+3,b+2, b+7,b+5,b+4, b+4,b+5,b+6); }
  const off=[], pr=[];
  for (let x=x0;x<x1;x+=sp) for (let z=z0;z<z1;z+=sp){ const e=Math.min(x-x0,x1-x,z-z0,z1-z); if (e<.4&&Math.random()<.5) continue; off.push(x+rnd(-.1,.1),0,z+rnd(-.1,.1)); pr.push(Math.random()*6.283,rnd(.85,1.12)*(e<.6?.85:1)*1.3,Math.random(),Math.random()); }
  const n=off.length/3, geo=new THREE.InstancedBufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('aHd',new THREE.Float32BufferAttribute(hd,1)); geo.setIndex(idx);
  geo.setAttribute('aOff',new THREE.InstancedBufferAttribute(new Float32Array(off),3)); geo.setAttribute('aP',new THREE.InstancedBufferAttribute(new Float32Array(pr),4)); geo.instanceCount=n; geo.userData.max=n;
  geo.boundingSphere=new THREE.Sphere(new THREE.Vector3((x0+x1)/2,.7,(z0+z1)/2),Math.hypot(x1-x0,z1-z0)/2+1);
  const m=new THREE.Mesh(geo,rnMats().wheat); m.userData.keep=true; par.add(m); RN.wheat.push(geo); return m; }

/* ---------- 풍경 본 (템플릿) : 타일 하나 = 길 앞뒤 40m ---------- */
function rnTplField(v){ rnTreeSet();
  const T=new THREE.Group(), S=new THREE.Group(); T.add(S); const M=vlMats(), X=gfMats(), put=vlPutter(S), nat=[];
  const N=(n,x,z,s,c,y)=>nat.push({n,x,y:y||0,z,s,ry:rnd(0,6.3),c});
  for (const s of [-1,1]) rnFence(put,M,s*7.75);
  const PL=rnPickN(['Grass_Wispy_Tall','Grass_Common_Tall','Flower_4_Group','Flower_3_Group','Clover_2'],3).concat(['Plant_7']);
  for (let i=0;i<44;i++){ const s=i%2?1:-1; N(PL[i%PL.length],s*rnd(6.95,9.8),rnd(-19.6,19.6),rnd(.34,.56)); }
  const BU=Math.random()<.5?'Bush_Common_Flowers':'Bush_Common';
  for (let i=0;i<10;i++){ const s=i%2?1:-1; N(BU,s*rnd(8.4,11.5),rnd(-19,19),rnd(.8,1.15),rnTint('gr')); }
  for (let i=0;i<8;i++){ const s=i%2?1:-1; N(rnTree(),s*rnd(31,52),rnd(-19,19),rnd(.95,1.3),rnTint(Math.random()<.2?'yl':'gr')); }
  if (v===0){ rnWheat(T,-27.5,-10.5,-17,17); rnScarecrow(S,-19,1.5,.4); rnHouse(S,20,-5,-Math.PI/2,{roof:'#a2553f',shut:'#3f6b4a'},.92);
    rnHay(put,X,14.4,6.4); rnHay(put,X,16.8,10.2,.85); rnBale(put,X,13.8,-12,.3); N(rnTree(),27,12,1.1,rnTint('gr')); N(rnTree(),29,-15,1.15,rnTint('gr')); N(rnTree(),12.6,15.5,.9,rnTint('gr')); }
  else if (v===1){ rnWindmill(S,-20.5,0,Math.PI/2); rnWheat(T,10.5,26.5,-18,7); rnHay(put,X,-14,-9); rnHay(put,X,-15.6,-12.4,.8); rnBale(put,X,-13.5,9,1.2); rnBale(put,X,-15,11.5,.4);
    N(rnTree(),-27,14,1.1,rnTint('gr')); N(rnTree(),19,14,1.0,rnTint('gr')); N(rnTree(),24,15,1.1,rnTint('yl')); }
  else { rnHouse(S,-20,4,Math.PI/2,{roof:'#56688c',shut:'#8a3f3f',chim:-1},.92);
    for (let x=12.5;x<27;x+=4.6) for (let z=-17;z<18;z+=5.8) N(rnTree(),x+rnd(-.4,.4),z+rnd(-.4,.4),rnd(.55,.68),VL_LIN(['#6fa83e','#7cb444'][(Math.random()*2)|0]));   // 과수원
    rnHay(put,X,-13.6,-8); rnBale(put,X,-14,-12.5,.8); N(rnTree(),-28,-14,1.1,rnTint('gr')); }
  return rnTplDone(T,S,nat); }
function rnTplForest(v){ rnTreeSet();
  const T=new THREE.Group(), S=new THREE.Group(); T.add(S); const M=vlMats(), Rm=rnMats(), put=vlPutter(S), nat=[];
  const N=(n,x,z,s,c,y)=>nat.push({n,x,y:y||0,z,s,ry:rnd(0,6.3),c});
  const au=()=>rnTint(['au','au','rd','yl'][(Math.random()*4)|0]);
  // 길가 큰 단풍나무 (가지가 길 위로 드리워요)
  for (const s of [-1,1]) for (let z=-18.5;z<=18.5;z+=rnd(5.4,7)){ if (v===1&&Math.abs(z)<4.6) continue; const pine=Math.random()<.16;
    N(pine?rnPine():rnTree(),s*rnd(8.7,10.6),z+rnd(-.8,.8),pine?rnd(1,1.25):rnd(1.15,1.5),pine?null:au()); }
  for (let i=0;i<18;i++){ const s=i%2?1:-1, x=s*rnd(12.5,42), z=rnd(-20,20); if (v===1&&Math.abs(z)<4) continue; if (v===2&&s<0&&Math.abs(x+17)<6.5&&Math.abs(z+5)<6.5) continue; const pine=Math.random()<.24;
    N(pine?rnPine():rnTree(),x,z,rnd(.95,1.4),pine?null:au()); }
  const BC=rnPickN(['#e0702c','#d9452a','#e8a43a'],2), RK='Rock_Medium_'+(1+((Math.random()*3)|0));
  for (let i=0;i<12;i++){ const s=i%2?1:-1; N('Bush_Common@'+BC[i%2],s*rnd(7.4,12),rnd(-19,19),rnd(.7,1.05)); }
  for (let i=0;i<22;i++){ const s=i%2?1:-1, k=i%4; N(['Fern_1','Mushroom_Common','Fern_1',RK][k],s*rnd(7.2,13),rnd(-19.5,19.5),[.16,.75,.16,.55][k]*rnd(.85,1.2)); }
  for (let i=0;i<12;i++){ const s=i%2?1:-1; N('Pebble_Round_1',s*rnd(6.75,7.6),rnd(-19.8,19.8),rnd(.5,.9),null,.01); }
  for (let i=0;i<3;i++){ const s=i%2?1:-1, x=s*rnd(11,16), z=rnd(-16,16); if (v===1&&Math.abs(z)<5) continue; put(new THREE.CylinderGeometry(.34,.38,rnd(2.6,4),12),Rm.bark,x,.33,z,0,rnd(-.6,.6),Math.PI/2); }
  for (let i=0;i<3;i++){ const s=i%2?-1:1, x=s*rnd(10.5,15), z=rnd(-18,18); if (v===1&&Math.abs(z)<5) continue; put(new THREE.CylinderGeometry(.42,.5,.55,12),Rm.bark,x,.27,z); put(new THREE.CircleGeometry(.42,12),Rm.barkEnd,x,.555,z,-Math.PI/2,0,0); }
  if (v===1){   // 시냇물 · 돌다리
    for (const s of [-1,1]){ const w=new THREE.Mesh(new THREE.PlaneGeometry(113.3,4.4),Rm.stream); w.rotation.x=-Math.PI/2; w.position.set(s*63.35,.05,0); w.renderOrder=1; T.add(w);
      const b=new THREE.Mesh(new THREE.PlaneGeometry(113.3,6.2),Rm.bank); b.rotation.x=-Math.PI/2; b.position.set(s*63.35,.025,0); b.receiveShadow=true; T.add(b);
      put(vlBox(.45,.75,7.2,1.2),M.stone,s*6.75,.37,0); put(vlBox(.62,.14,7.4,1),M.stoneLight,s*6.75,.8,0); }
    for (let i=0;i<16;i++){ const s=i%2?1:-1; N(RK,s*rnd(7.5,40),(i%4<2?1:-1)*rnd(2.3,2.9),rnd(.32,.55)); N('Fern_1',s*rnd(7.5,30),(i%4<2?-1:1)*rnd(2.4,3),.2); } }
  else if (v===2){   // 나무꾼 오두막 · 장작더미
    rnHouse(S,-17.5,-5,Math.PI/2,{w:6.4,d:5,roof:'#6d4a32',shut:'#5a3a24'},.85);
    for (let r=0;r<3;r++) for (let k=0;k<4-r;k++) put(new THREE.CylinderGeometry(.24,.24,2.2,10),Rm.bark,-12+(k-(3-r)/2)*.5,.25+r*.43,4.5,Math.PI/2,0,0);
    put(new THREE.CylinderGeometry(.38,.42,.6,12),Rm.bark,-12.6,.3,-1.4); put(vlBox(.06,.7,.06,.5),M.wood,-12.5,.85,-1.4,0,0,.5); put(vlBox(.3,.18,.05,.5),M.iron,-12.25,1.12,-1.4,0,0,.5); }
  return rnTplDone(T,S,nat); }
function rnTplSea(v){ rnTreeSet();
  const T=new THREE.Group(), S=new THREE.Group(); T.add(S); const M=vlMats(), X=gfMats(), Rm=rnMats(), put=vlPutter(S), nat=[];
  const N=(n,x,z,s,c,y)=>nat.push({n,x,y:y||0,z,s,ry:rnd(0,6.3),c});
  const sea=new THREE.Mesh(RN.geo.sea,Rm.sea); sea.rotation.x=-Math.PI/2; sea.position.set(176,-4.5,0); T.add(sea);
  const cl=new THREE.Mesh(RN.geo.cliff,Rm.cliff); cl.position.set(12.9,-2.3,0); cl.receiveShadow=true; T.add(cl);
  put(vlBox(.9,.5,40.4,1.4),M.stoneDark,12.35,-.12,0);
  const SR='Rock_Medium_'+(1+((Math.random()*3)|0)); for (let i=0;i<9;i++) N(SR,rnd(13.4,17.5),rnd(-19,19),rnd(1.0,1.9),null,-4.6);
  // 오른쪽 길가 낮은 돌담 (띄엄띄엄)
  for (let z=-19;z<17;z+=rnd(6,8.5)){ const L=rnd(3,5); put(vlBox(.5,.62,L,1),M.stone,7.45,.31,z+L/2); put(vlBox(.62,.12,L+.1,1),M.stoneLight,7.45,.66,z+L/2); }
  // 왼쪽 풀밭: 소나무 · 덤불 · 바위 · 꽃 · 마른 돌담
  for (let i=0;i<11;i++) N(rnPine(),-rnd(12,46),rnd(-19,19),rnd(.9,1.25));
  const SB=Math.random()<.5?'Bush_Common_Flowers':'Bush_Common'; for (let i=0;i<10;i++) N(SB,-rnd(7.6,16),rnd(-19,19),rnd(.8,1.1),rnTint('gr'));
  const PS=rnPickN(['Grass_Wispy_Tall','Flower_4_Group','Grass_Common_Tall','Flower_3_Group'],2);
  for (let i=0;i<26;i++){ const L=i%3!==0; N(PS[i%2],L?-rnd(6.9,12):rnd(8,11.6),rnd(-19.5,19.5),rnd(.34,.5)); }
  for (let i=0;i<5;i++) N(SR,-rnd(9,30),rnd(-18,18),rnd(.5,.9));
  for (let z=-18;z<18;z+=rnd(5,8)){ const L=rnd(2.5,4.5); put(vlBox(.7,.55,L,1),M.stone2,-14.5,.27,z+L/2,0,rnd(-.05,.05),0); }
  if (v===0){ rnHouse(S,-19,-7,Math.PI/2,{roof:'#2f6fb0',shut:'#2f6fb0'},.85); rnHouse(S,-28,10,Math.PI/2,{roof:'#4f6a8a',shut:'#3f5f8a',chim:-1},.85); rnBoat(T,40,8,.6,'#c8382e',true); }
  else if (v===1){ for (const [dx,dz,s] of [[0,0,7.5],[3.5,2.5,5.5],[-3,-2.5,5]]) N(SR,64+dx,-3+dz,s,null,-5.6); rnLighthouse(S,T,64,-3); rnBoat(T,38,9,-.4,'#2f6fb0',true); rnBoat(T,96,-12,1.2,'#e8a400',false); }
  else { const p=put; p(vlBox(2.8,.16,6,1),X.plank,10.1,.08,0); for (let z=-2.8;z<=2.81;z+=1.4) p(vlBox(.1,.9,.1,.5),M.wood,11.45,.5,z); p(vlBox(.06,.06,6,1),M.woodLight,11.45,.92,0);
    for (const s of [-1,1]){ p(vlBox(.42,.08,1.5,1),M.woodLight,9.4,.48,s*1.6); p(vlBox(.06,.4,1.5,1),M.woodLight,9.2,.75,s*1.6,0,0,-.15); }
    p(new THREE.CylinderGeometry(.09,.13,.9,8),X.bronze,10.9,1.15,2.4,0,0,Math.PI/2.4); p(vlBox(.05,.9,.05,.5),M.iron,10.7,.45,2.4); rnBoat(T,48,6,.9,'#c8382e',true); }
  return rnTplDone(T,S,nat); }
function rnTplCastle(v){ rnTreeSet();
  const T=new THREE.Group(), S=new THREE.Group(); T.add(S); const M=vlMats(), X=gfMats(), Rm=rnMats(), put=vlPutter(S), nat=[];
  for (const s of [-1,1]){ const cx=s*9.15;
    put(vlBox(1.5,4.6,40.2,3.2),M.stone,cx,2.3,0); put(vlBox(1.9,.7,40.2,1.6),M.stoneDark,cx,.35,0); put(vlBox(1.7,.22,40.2,1.2),M.stoneLight,cx,4.6,0);
    for (let z=-19.35;z<20;z+=1.3) put(vlBox(.42,.75,.78,1.4),M.stone,s*8.62,5.05,z);
    for (let z=-16.7;z<20;z+=6.6) put(vlBox(.06,.85,.16),X.dark,s*8.38,2.5,z).castShadow=false;
    rnTower(S,s*9.7,-20,2.05,7.4,s<0?'#a2553f':'#4f5f86'); }
  for (const s of [-1,1]) for (const z of [-9.5,9.5]){ const m=new THREE.Mesh(new THREE.PlaneGeometry(1.15,2.7,1,8),Rm.banner); m.position.set(s*8.36,3.0,z); m.rotation.y=s>0?-Math.PI/2:Math.PI/2; m.castShadow=true; S.add(m);
    const rod=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.35,6),M.iron); rod.rotation.x=Math.PI/2; rod.position.set(s*8.38,4.38,z); S.add(rod); }
  for (const s of [-1,1]){ const lg=new THREE.Group(); lg.position.set(s*8.42,0,0); lg.rotation.y=s>0?-Math.PI/2:Math.PI/2; S.add(lg); vlLantern(lg,0,3.25,0); }
  for (const s of [-1,1]) for (let z=-15;z<17;z+=rnd(7,10)){ const r=Math.random(); if (r<.35) vlBarrel(s*7.7,z,S,.8); else if (r<.65) put(new THREE.BoxGeometry(.7,.7,.7),M.crate,s*7.7,.35,z,0,rnd(0,1),0);
    else { put(vlBox(.9,.55,1.6,1),M.woodLight,s*7.75,.28,z); nat.push({n:'Bush_Common_Flowers',x:s*7.75,y:.45,z,s:.62,ry:rnd(0,6.3)}); } }
  if (v===0){ rnHouse(S,-16,-6,Math.PI/2,{roof:'#c0703c',shut:'#3f5f8a'},.95); rnHouse(S,16.5,8,-Math.PI/2,{roof:'#6d5a8e',shut:'#3f6b4a'},.95); }
  else if (v===1){ put(vlBox(3.6,11,3.6,2.4),M.stone,-15.5,5.5,3); put(vlBox(4,.3,4,1),M.stoneLight,-15.5,11.1,3); put(new THREE.ConeGeometry(2.8,6,4),X.slate,-15.5,14.2,3,0,Math.PI/4,0); put(new THREE.SphereGeometry(.22,10,8),X.gold,-15.5,17.3,3);
    rnHouse(S,16.5,-7,-Math.PI/2,{roof:'#a2553f',shut:'#8a3f3f',chim:-1},.95); }
  else { rnHouse(S,-16.5,9,Math.PI/2,{roof:'#56688c',shut:'#3f6b4a'},.95); rnHouse(S,16,-9,-Math.PI/2,{roof:'#b38a3e',shut:'#5a7a3a'},.95);
    for (const s of [-1,1]) nat.push({n:rnTree(),x:s*rnd(13,15),y:0,z:s*rnd(4,8),s:1.15,ry:rnd(0,6.3),c:rnTint('gr')}); }
  return rnTplDone(T,S,nat); }
function rnTplFinish(v){
  const T=new THREE.Group(), S=new THREE.Group(); T.add(S); const M=vlMats(), Rm=rnMats(), put=vlPutter(S);
  const A=v?Rm.paint.red:Rm.paint.blue, B=Rm.paint.white;
  for (const s of [-1,1]){ for (let k=0;k<4;k++) put(vlBox(1.55,.5*(k+1),40.2,1),k%2?B:A,s*(8.3+k*1.55+.775),.25*(k+1),0);
    for (let z=-16;z<=16;z+=8){ put(vlBox(.16,6.4,.16,.5),M.iron,s*14.7,3.2,z); put(vlBox(.12,3.2,.12,.5),M.iron,s*8.45,4.0,z); }
    put(vlBox(6.8,.1,40.2,1.5),M.cloth,s*11.6,5.75,0,0,0,-s*.12);
    for (let z=-16;z<=16;z+=8){ put(vlBox(.08,2.2,.08,.5),M.iron,s*7.1,1.1,z); const f=new THREE.Mesh(new THREE.PlaneGeometry(.75,1.1,1,6),Rm.flags[((z+16)/8+(s>0?2:0))%5]); f.position.set(s*7.1,1.75,z-.42); f.rotation.y=Math.PI/2; f.castShadow=true; S.add(f); }
    for (const z of [-12,4]) rnBalloons(S,s*8.3,.55,z); }
  // 관중 (계단마다 · 들썩들썩)
  const pts=[]; for (const s of [-1,1]) for (let k=0;k<4;k++) for (let z=-19.4;z<19.6;z+=.95){ if (Math.random()<.18) continue; pts.push([s*(8.3+k*1.55+.8)+rnd(-.12,.12),.5*(k+1),z+rnd(-.15,.15),s>0?-Math.PI/2:Math.PI/2]); }
  const shirt=['#e5484d','#3b82f6','#22a35a','#e8a400','#a855f7','#f3efe6','#ff8a3d','#2fb3c4'], skin=['#f2c9a0','#e0ac80','#c98f62','#f7d7b8'];
  const body=new THREE.InstancedMesh(RN.geo.body,Rm.crowd,pts.length), head=new THREE.InstancedMesh(RN.geo.head,Rm.crowdHead,pts.length), D=new THREE.Object3D();
  pts.forEach((p,i)=>{ D.position.set(p[0],p[1],p[2]); D.rotation.set(0,p[3],0); D.scale.setScalar(rnd(.92,1.08)); D.updateMatrix(); body.setMatrixAt(i,D.matrix); head.setMatrixAt(i,D.matrix);
    body.setColorAt(i,VL_LIN(shirt[(Math.random()*shirt.length)|0])); head.setColorAt(i,VL_LIN(skin[(Math.random()*skin.length)|0])); });
  for (const im of [body,head]){ const g=new THREE.BufferGeometry(), s=im.geometry; for (const k in s.attributes) g.setAttribute(k,s.attributes[k]); if (s.index) g.setIndex(s.index); g.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,2,0),26); im.geometry=g; im.frustumCulled=true; im.castShadow=true; im.receiveShadow=true; T.add(im); }
  return rnTplDone(T,S,[]); }

/* ---------- 출발 · 풍경 입구 · 결승선 ---------- */
function rnPcStart(){ const T=new THREE.Group(), S=new THREE.Group(); T.add(S); const M=vlMats(), X=gfMats(), put=vlPutter(S);
  for (const s of [-1,1]){ put(vlBox(.8,.5,.8,1),M.stone,s*7.25,.25,0); put(vlBox(.48,7.6,.48,.8),M.wood,s*7.25,4.05,0); put(new THREE.SphereGeometry(.26,10,8),X.gold,s*7.25,8.08,0); vlLantern(S,s*7.25,5.2,.25); }
  put(vlBox(15,.36,.38,.6),M.wood,0,7.45,0);
  rnSignMesh(S,'🏃 출발!',{bg:'#c8433a',edge:'#ffe08a',fg:'#fff8e6'},6.2,1.5,0,6.5,.24);
  rnBunting(S,[-7.25,7.5,0],[-14,3.3,-5],8); rnBunting(S,[7.25,7.5,0],[14,3.3,-5],8); for (const s of [-1,1]) put(vlBox(.12,3.4,.12,.5),M.wood,s*14,1.7,-5);
  rnHay(put,X,-10.4,2.6,.8); rnBale(put,X,10.6,1.6,.3); vlBarrel(9.4,-1.8,S,.85); vlBarrel(-9.2,-2.4,S,.8);
  rnBalloons(S,-7.7,.6,1.1); rnBalloons(S,7.7,.6,1.1);
  return rnTplDone(T,S,[]); }
function rnPcEntry(k){ const T=new THREE.Group(), S=new THREE.Group(); T.add(S); const M=vlMats(), Rm=rnMats(), put=vlPutter(S); let nat=[];
  if (k==='forest'){ for (const s of [-1,1]) put(new THREE.CylinderGeometry(.34,.4,7.7,10),Rm.bark,s*7.05,3.85,0);
    put(new THREE.CylinderGeometry(.32,.32,15.4,10),Rm.bark,0,7.5,0,0,0,Math.PI/2); for (const s of [-1,1]) put(new THREE.CircleGeometry(.32,10),Rm.barkEnd,s*7.7,7.5,0,0,s*Math.PI/2,0);
    for (const s of [-1,1]) dfRod(put,M.iron,[s*1.6,7.25,0],[s*1.6,7.05,0],.03,4);
    rnSignMesh(S,RN_BNAME.forest,{bg:'#7a4a24',edge:'#f0a040',fg:'#ffe6c0'},4.6,1.15,0,6.5,.06);
    for (const s of [-1,1]) vlLantern(S,s*7.05,5.2,.38);
    nat=[{n:'Bush_Common@#e0702c',x:-8.3,y:0,z:.6,s:1.15,ry:1},{n:'Bush_Common@#d9452a',x:8.4,y:0,z:-.4,s:1.05,ry:2}]; }
  else { for (const s of [-1,1]){ put(vlBox(1.0,5.9,1.0,1.2),M.stone,s*7.05,2.95,0); put(vlBox(1.2,.24,1.2,1),M.stoneLight,s*7.05,6.02,0); }
    put(vlBox(14.9,.34,.5,.8),M.woodLight,0,6.5,0); rnSignMesh(S,RN_BNAME.sea,{bg:'#1f6f8e',edge:'#bfe8f0',fg:'#f0fbff'},5.2,1.2,0,7.45,.1);
    for (let i=0;i<5;i++) put(new THREE.SphereGeometry(.2,10,8),i%2?Rm.paint.white:Rm.paint.red,-4+i*2,6.12,.32); }
  return rnTplDone(T,S,nat); }
function rnPcCastle(){ const T=new THREE.Group(), S=new THREE.Group(); T.add(S); const M=vlMats(), X=gfMats(), Rm=rnMats(), put=vlPutter(S), top=9.4;
  put(vlUVScale(new THREE.ExtrudeGeometry(dfArchShape(6.6,5.2,2.0,9.4,top),{depth:3.2,bevelEnabled:false}),1/3.2),M.stone,0,0,-1.6);
  put(vlBox(19.4,.3,3.6,1.2),M.stoneLight,0,top+.1,0);
  for (let x=-9.05;x<9.2;x+=1.3){ put(vlBox(.8,.85,.5,1.4),M.stone,x,top+.67,1.55); put(vlBox(.8,.85,.5,1.4),M.stone,x,top+.67,-1.55); }
  for (const s of [-1,1]) rnTower(S,s*11,0,2.8,11.6,'#a2553f');
  for (let x=-5.25;x<=5.26;x+=.75) put(vlBox(.1,1.5,.1,.5),M.iron,x,6.75,1.72); for (const y of [6.2,6.8]) put(vlBox(11,.08,.08,.5),M.iron,0,y,1.72);
  for (const s of [-1,1]){ const m=new THREE.Mesh(new THREE.PlaneGeometry(1.25,3.0,1,8),Rm.banner); m.position.set(s*8.0,5.9,1.64); m.castShadow=true; S.add(m); }
  rnSignMesh(S,RN_BNAME.castle,{bg:'#3a3f5a',edge:'#e0b84a',fg:'#ffe9b0'},5.4,1.25,0,8.45,1.66);
  { const g=new THREE.Group(); g.position.set(-40,0,-46); S.add(g); const p=vlPutter(g);   // 멀리 보이는 성채
    p(vlBox(16,13,13,3.2),M.stone,0,6.5,0); for (const sx of [-1,1]) for (const sz of [-1,1]) rnTower(g,sx*8,sz*6.5,2.4,17,'#56688c');
    for (let x=-7.4;x<7.5;x+=1.3) for (const sz of [-1,1]) p(vlBox(.8,.9,.5,1.4),M.stone,x,13.45,sz*6.3);
    p(vlBox(6,6,6,3.2),M.stone,0,16,0); p(new THREE.ConeGeometry(4.6,6,4),X.slate,0,22,0,0,Math.PI/4,0); }
  return rnTplDone(T,S,[]); }
function rnPcFinish(){ const T=new THREE.Group(), S=new THREE.Group(); T.add(S); const X=gfMats(), Rm=rnMats(), put=vlPutter(S);
  for (const s of [-1,1]){ put(new THREE.CylinderGeometry(.95,1.05,8.4,16),Rm.check,s*7.7,4.2,0); put(new THREE.CylinderGeometry(1.15,1.15,.3,16),Rm.paint.white,s*7.7,8.55,0); put(new THREE.SphereGeometry(.42,12,10),X.gold,s*7.7,9.12,0); }
  rnSignMesh(S,'🏁 결승선',{bg:'#1b2a4a',edge:'#ffd34d',fg:'#ffffff',check:true,fs:.46},12.6,2.3,0,7.2,0);
  const ln=new THREE.Mesh(new THREE.PlaneGeometry(12.4,1.4),Rm.checkLine); ln.rotation.x=-Math.PI/2; ln.position.set(0,.045,0); ln.receiveShadow=true; ln.userData.keep=true; S.add(ln);
  for (const s of [-1,1]) for (const zz of [-1.6,1.6]){ put(new THREE.CylinderGeometry(.22,.3,.9,12),Rm.paint.yellow,s*8.9,.75,zz,0,0,-s*.5); put(vlBox(.6,.3,.6,1),Rm.paint.navy,s*8.9,.15,zz); }
  rnBalloons(S,-8.6,.4,3); rnBalloons(S,8.6,.4,3);
  return rnTplDone(T,S,[]); }
// 정답 문 틀 (4지선다: 칸막이 3개 · O/X: 1개)
function rnFrameTpl(ox){ const T=new THREE.Group(), S=new THREE.Group(); T.add(S); const M=vlMats(), put=vlPutter(S);
  for (const s of [-1,1]){ const x=s*6.95; put(vlBox(1.15,.9,1.15,1.2),M.stone,x,.45,0); put(vlBox(1.3,.18,1.3,1),M.stoneLight,x,.99,0); put(vlBox(.62,5.6,.62,.8),M.wood,x,3.88,0); put(vlBox(.82,.22,.82,.6),M.woodLight,x,6.79,0); vlLantern(S,x,5.0,.31); }
  put(vlBox(14.8,.5,.64,.8),M.wood,0,6.5,0); put(vlBox(14.2,.2,.5,.6),M.woodLight,0,6.0,0);
  for (const s of [1,-1]) put(vlBox(15.4,.13,1.0,1.5),M.roof('#8a3a2a'),0,6.98,s*.34,s*.6,0,0);
  for (const x of (ox?[0]:[-3,0,3])) put(vlBox(.22,5.6,.3,.6),M.woodLight,x,3.1,0);
  return rnTplDone(T,S,[]); }

/* ---------- 장애물 · 코인 · 별 · 낙엽 · 응원하는 사람들 ---------- */
const RN_OBS={crate:{h:1.25,dz:.62},barrel:{h:1.2,dz:.56},hurdle1:{h:.95,dz:.18},hurdle2:{h:.95,dz:.18},roll:{h:1.1,dz:.56},log:{h:.88,dz:.46},mud:{h:0,dz:1.05},puddle:{h:0,dz:1.05}};
function rnObsTpls(){ const M=vlMats(), Rm=rnMats(), O=RN.obsT;
  const grp=fn=>{ const g=new THREE.Group(), S=new THREE.Group(); g.add(S); fn(vlPutter(S)); vlMerge(S); return g; };
  const hurdle=(p,w)=>{ for (const s of [-1,1]){ p(vlBox(.1,.95,.1,.5),Rm.paint.white,s*(w/2-.1),.47,0); p(vlBox(.1,.08,.7,.5),Rm.paint.white,s*(w/2-.1),.04,.2); } p(new THREE.BoxGeometry(w,.24,.06),Rm.hurdle,0,.86,0); };
  O.crate=grp(p=>{ p(new THREE.BoxGeometry(1.25,1.25,1.25),M.crate,0,.625,0); });
  O.barrel=grp(p=>{ p(new THREE.CylinderGeometry(.56,.5,1.2,16),Rm.barrel,0,.6,0); });
  O.hurdle1=grp(p=>hurdle(p,2.7)); O.hurdle2=grp(p=>hurdle(p,5.7));
  O.log=grp(p=>{ p(new THREE.CylinderGeometry(.42,.46,5.6,12),Rm.bark,0,.43,0,0,0,Math.PI/2); for (const s of [-1,1]) p(new THREE.CircleGeometry(.42,12),Rm.barkEnd,s*2.81,.43,0,0,s*Math.PI/2,0); });
  O.mud=grp(p=>{ const m=p(new THREE.CircleGeometry(1.25,24),Rm.mud,0,.036,0,-Math.PI/2,0,0); m.scale.set(1,1.5,1); m.castShadow=false; });
  O.puddle=grp(p=>{ const m=p(new THREE.CircleGeometry(1.25,24),Rm.puddle,0,.036,0,-Math.PI/2,0,0); m.scale.set(1,1.5,1); m.castShadow=false; });
  { const g=new THREE.Group(), r=new THREE.Group(); r.position.y=.56; g.add(r); const m=new THREE.Mesh(new THREE.CylinderGeometry(.56,.56,1.2,16),Rm.barrel); m.rotation.z=Math.PI/2; m.castShadow=true; r.add(m); O.roll=g; }
  // 힌트 별
  { const sh=new THREE.Shape(); for (let i=0;i<10;i++){ const a=i/10*Math.PI*2+Math.PI/2, r=i%2?.27:.62; i?sh.lineTo(Math.cos(a)*r,Math.sin(a)*r):sh.moveTo(Math.cos(a)*r,Math.sin(a)*r); } sh.closePath();
    const geo=new THREE.ExtrudeGeometry(sh,{depth:.16,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:2}); geo.center();
    const g=new THREE.Group(), m=new THREE.Mesh(geo,Rm.star); m.castShadow=true; g.add(m);
    const h=new THREE.Sprite(new THREE.SpriteMaterial({map:vlGlowTex(),color:0xffe27a,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending})); h.scale.setScalar(2.6); g.add(h); RN.star=g; } }
function rnCoins(){ const Rm=rnMats(), geo=new THREE.CylinderGeometry(.42,.42,.11,22), im=new THREE.InstancedMesh(geo,Rm.coin,RN.coinMax); im.count=0; im.castShadow=true; im.frustumCulled=false; RN.root.add(im); RN.coinIM=im;
  for (let i=0;i<8;i++){ const m=new THREE.Mesh(geo,Rm.coin); m.visible=false; RN.root.add(m); RN.fly.push({m,life:0,vx:0,vy:0,vz:0}); } }
function rnCoinSync(real){ const im=RN.coinIM; if (!im) return; let n=0;
  for (const c of RUN.coins){ if (!c.alive) continue; if (n>=RN.coinMax) break; RN_D.position.set(RUN_LANES[c.lane],1.05+Math.sin(real*3+c.z)*.08,c.z); RN_D.rotation.set(Math.PI/2,real*3.2+c.z*.4,0); RN_D.scale.setScalar(1); RN_D.updateMatrix(); im.setMatrixAt(n++,RN_D.matrix); }
  im.count=n; im.instanceMatrix.needsUpdate=true; }
// 단풍 숲에서 흩날리는 낙엽 (세상에 붙어 있고, 내 앞뒤 구간에서만 돌아가며 보여요)
function rnLeaves(){ const N=240, pos=new Float32Array(N*3), ph=new Float32Array(N), col=new Float32Array(N*3);
  for (let i=0;i<N;i++){ pos[i*3]=rnd(-18,18); pos[i*3+1]=rnd(0,10); pos[i*3+2]=rnd(0,44); ph[i]=Math.random(); const c=VL_LIN(RN_AU[(Math.random()*RN_AU.length)|0]); col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('aPh',new THREE.BufferAttribute(ph,1)); g.setAttribute('aCol',new THREE.BufferAttribute(col,3));
  const W2=rnWaterU(), U=RN.leavesU={uTime:NAT_U.uTime,uPZ:{value:0},uA:{value:0},uScale:{value:900},uFog:W2.uFog,uFogN:W2.uFogN,uFogF:W2.uFogF};
  const m=new THREE.Points(g,new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,
    vertexShader:`attribute float aPh; attribute vec3 aCol; uniform float uTime,uPZ,uScale; varying vec3 vC; varying float vR,vD;
      void main(){ float t=uTime*(.35+aPh*.25)+aPh*10.; float y=10.-mod(position.y+t*1.2,10.); float z=uPZ-34.+mod(position.z-uPZ,44.);
        vec3 p=vec3(position.x+sin(t*1.7+aPh*6.)*.8,y,z+cos(t*1.3)*.4); vec4 mv=viewMatrix*vec4(p,1.); vC=aCol; vR=t*3.; vD=-mv.z;
        gl_PointSize=clamp(uScale*.13/max(.5,-mv.z),1.,40.); gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`uniform float uA,uFogN,uFogF; uniform vec3 uFog; varying vec3 vC; varying float vR,vD;
      void main(){ vec2 q=gl_PointCoord-.5; float c=cos(vR), s=sin(vR); q=mat2(c,-s,s,c)*q; float d=length(q*vec2(1.,1.9)); float a=smoothstep(.5,.36,d)*uA; if (a<.02) discard;
        vec3 col=mix(vC,uFog,smoothstep(uFogN,uFogF,vD)); gl_FragColor=vec4(col,a);
        #include <tonemapping_fragment>
      }`}));
  m.frustumCulled=false; m.visible=false; RN.root.add(m); RN.leaves=m; }
const RN_CSPOT=[[-8.4,-3.2,1.35],[8.5,-2.4,-1.4],[-8.8,-8.6,1.1],[8.7,-9.4,-1.2]];
function rnChars(){ ['barbarian','rogue','mage','rogue','mage','barbarian','rogue','barbarian'].forEach((k,i)=>{ if (!GL[k]) return;
  const c=makeChar(k,1,{idle:'Idle',cheer:'Cheer'}); c.root.visible=false; RN.root.add(c.root); c.anim.setBase('cheer'); (i<4?RN.chars.start:RN.chars.fin).push(c); }); }
function rnCharsStart(){ RN.chars.start.forEach((c,i)=>{ const s=RN_CSPOT[i%4]; c.root.position.set(s[0],0,s[1]); c.root.rotation.y=s[2]; c.root.visible=true; c.mixer.setTime(Math.random()*2); }); }
function rnCharsFin(z){ RN.chars.fin.forEach((c,i)=>{ const s=RN_CSPOT[i%4]; c.root.position.set(Math.sign(s[0])*7.3,0,z+s[1]+6); c.root.rotation.y=s[2]; c.root.visible=true; c.mixer.setTime(Math.random()*2); }); }

/* ---------- 하늘 · 분위기: 출발은 맑은 낮 → 가운데 황금빛 오후 → 결승선 노을 ---------- */
const RN_MOODS=[
 {exp:.88,top:0x2a6fd6,hor:0x8cc0ee,fog:0xa9ccec,fogN:56,fogF:205,hemi:[0xe6eeff,0x5d6e40,.62],sun:[0xffe2b4,1.25,24,38,-6],fill:[0xb9c9ff,.32],bloom:[.5,.6,.82],
  sat:1.08,tint:[1.03,1,.985],lift:[.012,.008,.03],con:1.03,vig:.38,cShade:[.74,.82,.95],cAdd:[.32,.32,.32],sunCol:0xfff3df,cov:.56,mtn:[0x5c7fa8,0x4f7a5c],light:[1,1,1],sunK:[1,.93,.8],glow:0},
 {exp:.92,top:0x3f7cc8,hor:0xf2cf9a,fog:0xefd2a6,fogN:48,fogF:192,hemi:[0xfff0d0,0x6b5a3a,.56],sun:[0xffbf72,1.5,26,22,-28],fill:[0x9fb6ff,.26],bloom:[.72,.68,.75],
  sat:1.15,tint:[1.08,1,.88],lift:[.035,.018,0],con:1.05,vig:.44,cShade:[.82,.66,.62],cAdd:[.42,.24,.1],sunCol:0xffd08a,cov:.6,mtn:[0x8a7f9c,0x6f7a58],light:[1.04,.98,.9],sunK:[1,.82,.56],glow:.6},
 {exp:.86,top:0x34488f,hor:0xff9a5e,fog:0xeea27c,fogN:40,fogF:180,hemi:[0xffc9a0,0x4a3a40,.55],sun:[0xff9a55,1.6,-14,20,-58],fill:[0x8f9cff,.3],bloom:[.88,.74,.68],
  sat:1.12,tint:[1.1,.95,.86],lift:[.03,.01,.02],con:1.06,vig:.5,cShade:[.62,.46,.58],cAdd:[.55,.25,.1],sunCol:0xffb070,cov:.55,mtn:[0x7a5f8a,0x5a4a5a],light:[1,.9,.82],sunK:[1,.7,.45],glow:1}];
function rnMix(t){ t=Math.max(0,Math.min(1,t)); const i=t<.5?0:1, k=t<.5?t/.5:(t-.5)/.5, A=RN_MOODS[i], B=RN_MOODS[i+1];
  const L=(a,b)=>a+(b-a)*k, LA=(a,b)=>a.map((v,j)=>L(v,b[j])), C=(a,b)=>RN_CA.setHex(a).lerp(RN_CB.setHex(b),k).getHex();
  return {exp:L(A.exp,B.exp),top:C(A.top,B.top),hor:C(A.hor,B.hor),fog:C(A.fog,B.fog),fogN:L(A.fogN,B.fogN),fogF:L(A.fogF,B.fogF),
    hemi:[C(A.hemi[0],B.hemi[0]),C(A.hemi[1],B.hemi[1]),L(A.hemi[2],B.hemi[2])],sun:[C(A.sun[0],B.sun[0]),L(A.sun[1],B.sun[1]),L(A.sun[2],B.sun[2]),L(A.sun[3],B.sun[3]),L(A.sun[4],B.sun[4])],
    fill:[C(A.fill[0],B.fill[0]),L(A.fill[1],B.fill[1])],bloom:LA(A.bloom,B.bloom),sat:L(A.sat,B.sat),tint:LA(A.tint,B.tint),lift:LA(A.lift,B.lift),con:L(A.con,B.con),vig:L(A.vig,B.vig),
    cShade:LA(A.cShade,B.cShade),cAdd:LA(A.cAdd,B.cAdd),sunCol:C(A.sunCol,B.sunCol),cov:L(A.cov,B.cov),mtn:[C(A.mtn[0],B.mtn[0]),C(A.mtn[1],B.mtn[1])],light:LA(A.light,B.light),sunK:LA(A.sunK,B.sunK),glow:L(A.glow,B.glow)}; }
function rnMoodApply(force){ if (!RN.built) return; const t=RUN.mood; if (!force && Math.abs(t-RN.moodAt)<.006) return; RN.moodAt=t; const m=rnMix(t);
  renderer.toneMappingExposure=m.exp;
  scene.background.setHex(m.fog).convertSRGBToLinear(); scene.fog.color.setHex(m.fog).convertSRGBToLinear(); scene.fog.near=m.fogN; scene.fog.far=m.fogF;
  HEMI.color.setHex(m.hemi[0]); HEMI.groundColor.setHex(m.hemi[1]); HEMI.intensity=m.hemi[2];
  sun.color.setHex(m.sun[0]); sun.intensity=m.sun[1]; sun.userData.off=[m.sun[2],m.sun[3],m.sun[4]];
  fill.color.setHex(m.fill[0]); fill.intensity=m.fill[1];
  if (bloom){ bloom.strength=m.bloom[0]; bloom.radius=m.bloom[1]; bloom.threshold=m.bloom[2]; }
  if (GRADE){ const u=GRADE.uniforms; u.uSat.value=m.sat; u.uTint.value.set(...m.tint); u.uLift.value.set(...m.lift); u.uCon.value=m.con; u.uVig.value=m.vig; }
  const U=RN.skyU; if (U){ U.uTop.value.setHex(m.top).convertSRGBToLinear(); U.uHor.value.setHex(m.hor).convertSRGBToLinear(); U.uCShade.value.setRGB(...m.cShade); U.uCAdd.value.setRGB(...m.cAdd); U.uSunCol.value.setHex(m.sunCol).convertSRGBToLinear(); U.uCov.value=m.cov; }
  RN.mtnU.forEach((u,i)=>u.uCol.value.setHex(m.mtn[i]||m.mtn[0]).convertSRGBToLinear());
  const W2=rnWaterU(); W2.uSunCol.value.setRGB(...m.sunK); W2.uLightK.value.setRGB(...m.light); RN_V.set(m.sun[2],m.sun[3],m.sun[4]).normalize(); W2.uSun.value.copy(RN_V); if (U) U.uSun.value.copy(RN_V);
  const VM=vlMats(); VM.lantern.emissiveIntensity=.55+m.glow*1.1; VM.win.emissiveIntensity=.16+m.glow*.36;
  RN.glow=m.glow; const gl=m.glow>.42; if (gl!==RN.glowOn){ RN.glowOn=gl; rnHaloAll(); } }

/* ---------- 길 타일 · 풍경 정하기 ---------- */
function rnMakeTile(){ const M=rnMats(), G=RN.geo, t=new THREE.Group(); RN.root.add(t);
  const flat=(geo,mat,y)=>{ const m=new THREE.Mesh(geo,mat); m.rotation.x=-Math.PI/2; m.position.y=y; m.receiveShadow=true; t.add(m); return m; };
  const gr=flat(G.ground,M.ground.field,0), rd=flat(G.road,M.road.dirt,.02), ln=flat(G.road,M.lane,.032);
  const cb=new THREE.Mesh(G.curb,M.curb.field); cb.position.y=.14; cb.castShadow=cb.receiveShadow=true; t.add(cb); const curbs=[cb];
  t.rn={gr,rd,ln,curbs,biome:null,decor:null}; return t; }
function rnSkin(t,b,force){ const R=t.rn; if (R.biome===b && R.decor && !force) return; const M=rnMats(), G=RN.geo;
  R.biome=b; R.gr.material=M.ground[b]; R.gr.geometry=b==='sea'?G.groundSea:G.ground; R.gr.position.x=b==='sea'?-53.9:0;
  R.rd.material=M.road[RN_ROADK[b]]; R.ln.material=b==='finish'?M.laneT:M.lane; R.curbs.forEach(c=>{ c.material=M.curb[b]; });
  if (R.decor){ rnFree(R.decor); R.decor=null; }
  const L=RN.tpl[b]; if (!L||!L.length) return; const d=rnTake(L[rnPickV(b,L.length)]); t.add(d); R.decor=d; rnHaloVis(d); }
// 풍경 본 고르기: 바로 앞 타일과 같은 본은 피하고, 풍차 · 등대 · 첨탑처럼 눈에 띄는 본은 가끔만
const RN_VW={field:[1,.5,1],forest:[1,.7,.8],sea:[1,.5,1],castle:[1,.65,1],finish:[1,1]}, RN_LASTV={};
function rnPickV(b,n){ const w=(RN_VW[b]||[]).slice(0,n); while (w.length<n) w.push(1); if (n>1 && RN_LASTV[b]!=null) w[RN_LASTV[b]]=0;
  let sum=w.reduce((a,c)=>a+c,0), r=Math.random()*sum, i=0; for (;i<n-1;i++){ if ((r-=w[i])<=0) break; } RN_LASTV[b]=i; return i; }
// 문제 i의 풍경 (n문제를 네 풍경으로 나눠요 · 마지막 문 뒤는 결승선 경기장)
function rnBiomeIdx(i){ return i>=RUN.n?'finish':RN_BIOME[Math.min(3,Math.floor(i*4/RUN.n))]; }
// 이 자리(z)를 지나 처음 만나는 문이 몇 번째 문제인지로 풍경을 정해요 (아직 안 나온 문 뒤는 다음 문제 풍경)
function rnBiomeAt(z){ for (let i=0;i<RUN.spawned;i++) if (RUN.gz[i]<z) return rnBiomeIdx(i); return rnBiomeIdx(RUN.spawned); }
function rnReskin(){ for (const t of RN.tiles){ const b=rnBiomeAt(t.position.z); if (b!==t.rn.biome) rnSkin(t,b); } }

/* ---------- 짓기 ---------- */
function buildRunner(){
  const R=new THREE.Group(); scene.add(R); RN.root=R; RN.dyn=new THREE.Group(); R.add(RN.dyn);
  const keep={h:VL.halos,s:VL.smokeSrc}; VL.halos=[]; VL.smokeSrc=[];
  try{
    rnMats(); rnGeos();
    RN.skyG=new THREE.Group(); R.add(RN.skyG); gfSky(RN.skyG,RN);
    RN.natOK=GF_NAT.every(n=>VL.nat[n]);
    RN.tpl={field:[0,1,2].map(v=>rnTplField(v)),forest:[0,1,2].map(v=>rnTplForest(v)),sea:[0,1,2].map(v=>rnTplSea(v)),castle:[0,1,2].map(v=>rnTplCastle(v)),finish:[0,1].map(v=>rnTplFinish(v))};
    RN.pc={start:rnPcStart(),forest:rnPcEntry('forest'),sea:rnPcEntry('sea'),castle:rnPcCastle(),finish:rnPcFinish()};
    RN.frame={mc:rnFrameTpl(false),ox:rnFrameTpl(true)};
    rnObsTpls(); rnCoins(); rnLeaves(); rnChars();
    for (let i=0;i<RUN_NT;i++) RN.tiles.push(rnMakeTile());
  } finally { VL.halos=keep.h; VL.smokeSrc=keep.s; }
  if (!RN.natOK) GF_NATP.then(()=>{ if (!RN.natOK) within('runner',rnNatLate); });
  RN.built=true; }
// 자연 모델이 늦게 오면: 본에 나무 · 풀을 마저 심고 지금 타일을 다시 입혀요
function rnNatLate(){ RN.natOK=true;
  const all=[...Object.values(RN.tpl).flat(),...Object.values(RN.pc)]; all.forEach(T=>{ const L=T.rnNat; if (L){ T.rnNat=null; rnNatTo(T,L); } });
  RN.tiles.forEach(t=>{ if (t.rn.decor){ t.remove(t.rn.decor); t.rn.decor=null; } t.rn.biome=null; }); all.forEach(T=>{ T.rnPool=[]; });
  RUN.pieces.forEach(p=>{ if (p.g.parent) p.g.parent.remove(p.g); }); const pcs=RUN.pieces.map(p=>({k:p.k,z:p.z})); RUN.pieces=[]; pcs.forEach(p=>rnPcPlace(p.k,p.z));
  RN.tiles.forEach(t=>rnSkin(t,rnBiomeAt(t.position.z),true)); }
MAP_BUILD.runner=()=>buildRunner();
GRASS_OK.runner=null;

/* ---------- 정답 문 ---------- */
function rnMakeGate(item,opts,ci,z,i){ const Rm=rnMats(), mc=item.kind==='mc', g=new THREE.Group(); g.position.set(0,0,z); RN.dyn.add(g);
  const fr=rnTake(RN.frame[mc?'mc':'ox']); g.add(fr); rnHaloVis(fr);
  const texs=[], ctex=[], mats=[], doors=[], beams=[], carpets=[];
  const st=rnSignTex(i>=RUN.n-1?'마지막 문제!':`문제 ${i+1}`,{w:512,h:160,bg:'#5a3b28',edge:'#f0c060',fg:'#fff1cc',fs:.55}); texs.push(st);
  const sm=new THREE.MeshBasicMaterial({map:st,toneMapped:false,fog:false}); mats.push(sm); const sg=new THREE.Mesh(new THREE.PlaneGeometry(2.8,.88),sm); sg.position.set(0,7.64,.12); g.add(sg);
  const W2=mc?2.62:5.7, H2=4.0, L=Math.max(20,P.z-2-z);
  opts.forEach((o,k)=>{ const x=mc?RUN_LANES[k]:(k?3:-3), col=mc?RUN_COL[k]:RUN_OXCOL[k];
    const tx=rnDoorTex(mc?String(k+1):o,mc?o:'',col,!mc); texs.push(tx);
    const dm=new THREE.MeshBasicMaterial({map:tx,transparent:true,opacity:.96,side:THREE.DoubleSide,fog:false,toneMapped:false}); mats.push(dm);
    const d=new THREE.Mesh(new THREE.PlaneGeometry(W2,H2),dm); d.position.set(x,.42+H2/2,0); d.renderOrder=3; g.add(d); doors.push(d);
    const bm=new THREE.MeshBasicMaterial({color:new THREE.Color(col),map:Rm.beamT,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false,toneMapped:false}); mats.push(bm);
    const bg=new THREE.Group(); bg.position.set(x,7.3+15,0); g.add(bg); for (const r of [0,Math.PI/2]){ const b=new THREE.Mesh(new THREE.PlaneGeometry(mc?1.5:2.8,30),bm); b.rotation.y=r; bg.add(b); } beams.push(bg);
    const ct=Rm.chev.clone(); ct.needsUpdate=true; ct.wrapS=ct.wrapT=THREE.RepeatWrapping; ct.repeat.set(1,L/3.2); texs.push(ct); ctex.push(ct);
    const cm=new THREE.MeshBasicMaterial({color:new THREE.Color(col),map:ct,transparent:true,opacity:.5,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6}); mats.push(cm);
    const cp=new THREE.Mesh(new THREE.PlaneGeometry(mc?2.7:5.8,L),cm); cp.rotation.x=-Math.PI/2; cp.position.set(x,.036,L/2); cp.renderOrder=2; g.add(cp); carpets.push(cp); });
  return {g,fr,item,opts,ci,z,doors,beams,carpets,texs,ctex,mats,gone:-1,done:false,anim:null}; }
function rnDisposeGate(G){ if (!G) return; if (G.fr){ rnFree(G.fr); G.fr=null; } if (G.g.parent) G.g.parent.remove(G.g);
  G.g.traverse(o=>{ if (o.isMesh&&o.geometry) o.geometry.dispose(); }); G.texs.forEach(t=>t.dispose()); G.mats.forEach(m=>m.dispose()); G.texs=[]; G.mats=[]; }
function rnGateLook(G,dt,real){ const d=P.z-G.z, k=G.done?0:Math.max(0,Math.min(1,(d-16)/34));
  G.beams.forEach((b,i)=>{ const m=b.children[0].material, tg=i===G.gone?0:k*(.5+.12*Math.sin(real*3+i)); m.opacity+=(tg-m.opacity)*Math.min(1,dt*6); b.visible=m.opacity>.01; });
  G.ctex.forEach(t=>{ t.offset.y-=dt*.9; });
  const A=G.anim; if (!A) return; const t=W.t-A.t0;
  G.doors.forEach((dr,i)=>{ const m=dr.material; if (i===G.gone){ dr.visible=false; return; }
    if (A.ok){ if (i===A.pick){ const q=Math.min(1,t/.35); dr.scale.setScalar(1+q*.6); m.opacity=.96*(1-q); } else m.opacity=Math.max(0,.96-t*2); }
    else { if (i===A.pick){ const q=Math.min(1,t/.6); dr.rotation.z=Math.sin(t*34)*.14*(1-q); m.color.setRGB(1,.45+.55*q,.45+.55*q); }
      if (i===G.ci) dr.scale.setScalar(1+Math.sin(t*9)*.05);
      if (t>1.5) m.opacity=Math.max(0,.96-(t-1.5)*2.4); }
    dr.visible=m.opacity>.01; });
  if (A.check){ A.check.position.y=1.5+Math.sin(t*4)*.08; A.check.material.opacity=t>1.5?Math.max(0,1-(t-1.5)*2.4):1; } }
// ⭐ 힌트: 오답 문 하나가 무너져요 (카펫은 회색, 문제 칸 보기에는 줄)
function rnCrumble(G){ if (!G||G.done||G.gone>=0||G.item.kind!=='mc') return false; const wrong=[0,1,2,3].filter(i=>i!==G.ci), i=wrong[(Math.random()*wrong.length)|0]; G.gone=i;
  const d=G.doors[i], x=d.position.x, col=new THREE.Color(RUN_COL[i]).getHex(); d.visible=false; fx.burst(x,2.2,G.z,col,26,6); fx.burst(x,1.4,G.z,0x8a8fa0,16,4);
  const cp=G.carpets[i]; cp.material.color.setHex(0x6b6f78); cp.material.opacity=.22;
  const xm=new THREE.MeshBasicMaterial({map:rnXTex(),transparent:true,fog:false,toneMapped:false,side:THREE.DoubleSide}); G.mats.push(xm); const xp=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.6),xm); xp.position.set(x,2.2,.02); G.g.add(xp);
  const o=RN.ui.opts&&RN.ui.opts.children[i]; if (o) o.classList.add('gone');
  SFX.crumble(); return true; }

/* ---------- 장애물 놓기 ---------- */
function rnObsAdd(kind,lanes,z,x){ const T=RN.obsT[kind]; if (!T) return; const g=T.clone(); g.position.set(x,0,z); if (kind==='crate'||kind==='barrel') g.rotation.y=rnd(-.4,.4); RN.dyn.add(g);
  const D=RN_OBS[kind], o={g,kind,lanes,z,h:D.h,dz:D.dz,hit:false}; if (kind==='roll'){ o.vz=3.4; o.roll=g.children[0]; } RUN.obs.push(o); }
function rnObstacle(b,z,free){ const W={field:[['crate',.22],['barrel',.18],['hurdle',.26],['roll',.16],['mud',.18]],forest:[['log',.3],['crate',.14],['barrel',.12],['mud',.24],['roll',.2]],sea:[['crate',.32],['barrel',.28],['roll',.22],['puddle',.18]],castle:[['barrel',.3],['crate',.24],['roll',.26],['hurdle',.2]]}[b]||[['crate',1]];
  let r=Math.random(), kind=W[0][0]; for (const [k,w] of W){ if ((r-=w)<=0){ kind=k; break; } }
  const others=[0,1,2,3].filter(l=>l!==free);
  if (kind==='hurdle'||kind==='log'){ const pairs=[[0,1],[1,2],[2,3]].filter(p=>!p.includes(free));
    if (pairs.length && (kind==='log'||Math.random()<.55)){ const p=pairs[(Math.random()*pairs.length)|0]; rnObsAdd(kind==='log'?'log':'hurdle2',p,z,(RUN_LANES[p[0]]+RUN_LANES[p[1]])/2); return; }
    if (kind==='hurdle'){ const l=others[(Math.random()*others.length)|0]; rnObsAdd('hurdle1',[l],z,RUN_LANES[l]); return; } kind='crate'; }
  const l=others[(Math.random()*others.length)|0];
  if (kind==='roll'){ rnObsAdd('roll',[l],z-9,RUN_LANES[l]); return; }
  if ((kind==='crate'||kind==='barrel') && Math.random()<.3){ const o2=others.filter(q=>q!==l), l2=o2[(Math.random()*o2.length)|0]; rnObsAdd(kind,[l2],z+rnd(-.6,.6),RUN_LANES[l2]); }
  rnObsAdd(kind,[l],z,RUN_LANES[l]); }
// z0(가까운 곳) → z1(문). 문 바로 앞 18m는 비워 둬요. 줄마다 빈 줄 하나는 늘 남겨요
function rnSpawnStuff(z0,z1,o){ o=o||{};
  for (let z=z0; z>z1+18; z-=rnd(11,15)){ const free=(Math.random()*4)|0;
    if (!o.coinsOnly && Math.random()<RUN.lv.obs) rnObstacle(rnBiomeAt(z),z,free);
    if (Math.random()<.58) for (let k=0;k<3;k++) RUN.coins.push({lane:free,z:z+2.6-k*2.2,alive:true}); } }
function rnStarSpawn(z0,z1){ const z=z0-(z0-z1-18)*rnd(.3,.7), busy=new Set(); RUN.obs.forEach(o=>{ if (Math.abs(o.z-z)<4) o.lanes.forEach(l=>busy.add(l)); });
  const fr=[0,1,2,3].filter(l=>!busy.has(l)); if (!fr.length) return; const lane=fr[(Math.random()*fr.length)|0];
  const g=RN.star.clone(); g.position.set(RUN_LANES[lane],1.45,z); RN.dyn.add(g); RUN.stars.push({g,lane,z,alive:true});
  RUN.coins.forEach(c=>{ if (c.lane===lane && Math.abs(c.z-z)<1.6) c.alive=false; }); }
function rnPcPlace(k,z){ const T=RN.pc[k]; if (!T) return; const d=rnTake(T); d.position.set(0,0,z); RN.dyn.add(d); rnHaloVis(d); RUN.pieces.push({g:d,z,k}); }

/* ---------- 화면 (문제 칸 · 코스 막대 · 알림) ---------- */
function rnUI(){ const U=RN.ui; if (U.q) return; Object.assign(U,{q:$('#runQ'),qno:$('#runQNo'),qkind:$('#runQKind'),qtext:$('#runQText'),opts:$('#runOpts'),keys:$('#runQKeys'),time:$('#runQTime'),slowB:$('#runQSlow'),bar:$('#runBar'),
  res:$('#runRes'),toast:$('#runToast'),hearts:$('#runHearts'),combo:$('#runCombo'),coins:$('#runCoins'),star:$('#runStar'),prog:$('#runProg')}); }
function rnToast(msg,big){ const t=RN.ui.toast; if (!t) return; t.textContent=msg; t.className='run-toast show'+(big?' big':''); RUN.toastT=W.t+(big?2.4:1.7); }
function rnTrackBuild(){ const L=$('#runTrackLine'); if (!L) return; let h='<i class="rt-fill" id="runTrackFill"></i>'; for (let i=0;i<RUN.n;i++) h+=`<i class="rt-t" style="left:${(4+(i+1)/RUN.n*88).toFixed(2)}%"></i>`;
  h+='<b class="rt-me" id="runTrackMe">🏃</b>'; L.innerHTML=h; RN.ui.me=$('#runTrackMe'); RN.ui.fill=$('#runTrackFill'); RN.ui.ticks=[...L.querySelectorAll('.rt-t')]; }
function rnTrackMark(i,ok){ const t=RN.ui.ticks&&RN.ui.ticks[i]; if (t){ t.classList.remove('now'); t.classList.add(ok?'ok':'no'); } }
function rnCardShow(G){ const it=G.item, mc=it.kind==='mc', U=RN.ui;
  U.qno.textContent=`문제 ${RUN.done+1}/${RUN.n}`; U.qkind.textContent=mc?'4지선다':'O/X'; U.qtext.textContent=(mc?'':'[O/X] ')+it.q;
  U.opts.className='run-opts'+(mc?'':' two');
  U.opts.innerHTML=G.opts.map((o,i)=>`<div class="run-opt" style="--c:${mc?RUN_COL[i]:RUN_OXCOL[i]}"><b>${mc?i+1:esc(o)}</b><span>${mc?esc(String(o)):(i?'오른쪽 두 줄 · 2':'왼쪽 두 줄 · 1')}</span></div>`).join('');
  U.keys.innerHTML=mc?'<kbd>←</kbd> <kbd>→</kbd> 또는 <kbd>1</kbd>~<kbd>4</kbd> 줄 바꾸기 · <kbd>S</kbd>를 누르고 있으면 천천히':'<kbd>←</kbd> <kbd>→</kbd> 또는 <kbd>1</kbd> O · <kbd>2</kbd> X · <kbd>S</kbd>를 누르고 있으면 천천히';
  RUN.pickI=-1; U.time.textContent=''; U.tt=''; U.res.hidden=true; RUN.resT=0; U.q.hidden=false; U.q.classList.add('big'); }
function rnExplainShow(G){ const it=G.item, mc=it.kind==='mc', ci=G.ci, col=mc?RUN_COL[ci]:RUN_OXCOL[ci], lab=mc?String(ci+1):G.opts[ci], last=RUN.hearts<=0, r=RN.ui.res;
  r.className='run-res card big bad'; r.hidden=false;
  r.innerHTML=`<b>${last?'하트를 모두 잃었어요…':'아쉬워요… ❤️ -1'}</b><div class="rr-ans"><span class="rr-k" style="--c:${col}">${esc(lab)}</span><span>정답: ${esc(correctText(it))}</span></div><p>${esc(it.e||'')}</p><div class="rr-foot"><div class="rr-bar"><i id="runResBar"></i></div><small id="runResKey">해설을 읽어요…</small></div>`;
  RUN.explain={t0:W.t,until:W.t+(last?4.2:5.2),skip:W.t+1.4,keyOn:false}; }
function rnExplainEnd(){ if (!RUN.explain) return; RUN.explain=null; RN.ui.res.hidden=true; if (RUN.bToast){ rnToast(RN_BNAME[RUN.bToast],true); RUN.bToast=null; }
  if (RUN.hearts<=0){ RUN.nextAt=1e9; setTimeout(()=>{ if (MAPK==='runner'&&W.state==='play') endGame(false); },250); return; }
  if (RUN.done<RUN.n) RUN.nextAt=W.t+.6; }
function rnProgress(){ const G=RUN.gate; let k=0; if (G) k=Math.max(0,Math.min(1,(G.startZ-P.z)/Math.max(1,G.startZ-G.z))); return Math.min(1,(RUN.done+k)/Math.max(1,RUN.n)); }

/* ---------- 판 진행 ---------- */
function rnClearDyn(){ if (RUN.gate){ rnDisposeGate(RUN.gate); RUN.gate=null; } RUN.old.forEach(rnDisposeGate); RUN.old=[];
  RUN.obs.forEach(o=>RN.dyn.remove(o.g)); RUN.obs=[]; RUN.stars.forEach(s=>RN.dyn.remove(s.g)); RUN.stars=[]; RUN.coins=[];
  RUN.pieces.forEach(p=>rnFree(p.g)); RUN.pieces=[]; RN.fly.forEach(f=>{ f.m.visible=false; f.life=0; }); rnCoinSync(0); }
function runnerReset(){
  document.body.classList.remove('runner');
  ['#runHud','#runQ','#runRes','#runHelp','#runTrack'].forEach(s=>{ const e=$(s); if (e) e.hidden=true; }); { const t=$('#runToast'); if (t) t.className='run-toast'; }
  if (MAPK!=='runner' || !RN.built) return;
  rnUI(); rnClearDyn();
  const lv=RUN_LV[MODE==='hero'?'hero':LEVEL]||RUN_LV.normal;
  Object.assign(RUN,{lv,lane:1,y:0,vy:0,spd:lv.spd,curSpd:lv.spd,stun:0,slowT:0,hearts:3,combo:0,maxCombo:0,coinsN:0,done:0,n:lv.n,nextAt:2.6,lean:0,hits:0,
    gate:null,old:[],obs:[],coins:[],stars:[],pieces:[],gz:[],spawned:0,hint:0,slow:false,explain:null,resT:0,fin:null,finZ:null,results:[],biome:'field',mood:0,toastT:0,land:0,pickI:-1,bToast:null});
  P.x=RUN_LANES[1]; P.z=0; P.fx=0; P.fz=-1;
  RN.tiles.forEach((t,i)=>{ t.position.z=20-i*RUN_TILE; rnSkin(t,'field',true); });
  rnPcPlace('start',-5); rnCharsStart(); RN.chars.fin.forEach(c=>{ c.root.visible=false; });
  rnSpawnStuff(-12,-48,{coinsOnly:true});
  W.nextWaveAt=-1; W.nextQuiz=1e9;
  document.body.classList.add('runner');
  ['#runHud','#runTrack','#runHelp'].forEach(s=>{ $(s).hidden=false; }); rnTrackBuild(); RN.ui.hs=RN.ui.cs=RN.ui.co=RN.ui.st=RN.ui.pr=null; RN.ui.sl=null;
  setTimeout(()=>{ const h=$('#runHelp'); if (h) h.hidden=true; },8000);
  RN.moodAt=-1; RN.glowOn=undefined; rnMoodApply(true); W.snapCam=true;
  setTimeout(()=>{ if (MAPK==='runner'&&W.state==='play') showBanner('준비… 출발!'); },300); }
function rnNextQuestion(){
  const hasMC=MC.length>0, hasOX=OX.length>0;
  const kind=hasMC&&hasOX?(Math.random()<.62?'mc':'ox'):hasMC?'mc':'ox';
  const item=kind==='mc'?pick(['mc'],MC):pick(['ox'],OX);
  if (!item){ endGame(true); return; }
  let opts, ci; if (item.kind==='mc'){ const order=item.o.map((_,i)=>i).sort(()=>Math.random()-.5); opts=order.map(i=>item.o[i]); ci=order.indexOf(0); } else { opts=['O','X']; ci=item.a?0:1; }
  // 시간: 퀴즈 창 시간(문제 · 보기 길이)의 80% × 단계 · 반 쉬움 배율. 처음 몇 초는 크게 읽어요(천천히 달림)
  const T=Math.max(7,Math.min(26,quizTime(item,opts)*.8*RUN.lv.read*(MODE==='hero'?1:((EASEF&&EASEF.quiz)||1))));
  const rp=Math.min(RN_READ,T*.24), D=Math.max(46,RUN.spd*(rp*RN_READK+(T-rp))), i=RUN.spawned, z=P.z-D;
  const G=rnMakeGate(item,opts,ci,z,i); Object.assign(G,{t0:W.t,T,rp,settle:W.t,startZ:P.z,beep:0,big0:false});
  RUN.gate=G; RUN.gz.push(z); RUN.spawned++;
  const b0=rnBiomeIdx(i), b1=rnBiomeIdx(i+1);
  if (b1!==b0){ if (b1==='finish'){ RUN.finZ=z-38; rnPcPlace('finish',RUN.finZ); rnCharsFin(RUN.finZ); } else rnPcPlace(b1,z-15); }
  rnReskin();
  const readEnd=P.z-RUN.spd*rp*RN_READK-6;
  rnSpawnStuff(readEnd,z,{});
  if (i>0 && hasMC && RUN.hint<2 && !RUN.stars.length && Math.random()<.42) rnStarSpawn(readEnd,z);
  rnCardShow(G); if (RN.ui.ticks&&RN.ui.ticks[i]) RN.ui.ticks[i].classList.add('now');
  if (RUN.hint>0 && item.kind==='mc') setTimeout(()=>{ if (RUN.gate===G && !G.done && G.gone<0 && RUN.hint>0){ RUN.hint--; rnCrumble(G); rnToast('⭐ 힌트 별로 오답 문 하나를 무너뜨렸어요'); } },1100);
  SFX.wave(); }
function runLaneNow(){ let best=0, bd=99; RUN_LANES.forEach((x,i)=>{ const d=Math.abs(P.x-x); if (d<bd){ bd=d; best=i; } }); return best; }
function rnSetLane(l){ l=Math.max(0,Math.min(3,l)); if (l===RUN.lane) return; RUN.lane=l; const G=RUN.gate; if (G&&!G.done) G.settle=W.t; }
function rnKeyPick(d){ const G=RUN.gate; if (G&&G.item.kind!=='mc'){ if (d===1) rnSetLane(RUN.lane<2?RUN.lane:1); else if (d===2) rnSetLane(RUN.lane>=2?RUN.lane:2); else rnSetLane(d-1); } else rnSetLane(d-1); }
function rnPass(){ const G=RUN.gate; RUN.gate=null; G.done=true; RUN.old.push(G);
  const ln=runLaneNow(), mc=G.item.kind==='mc', pickI=mc?ln:(ln<2?0:1), ok=pickI===G.ci;
  // 빠른 결정: 마지막으로 줄을 정한 때가 이를수록 (크게 읽는 동안 정하면 만점 · 천천히 달리면 그만큼 늦어져요)
  let sp=0; if (ok){ RUN.combo++; RUN.maxCombo=Math.max(RUN.maxCombo,RUN.combo); const span=Math.max(1,G.T-G.rp), frac=Math.max(0,Math.min(1,1-Math.max(0,G.settle-G.t0-G.rp)/span)); sp=speedPts(frac); W.speedPts=(W.speedPts||0)+sp; } else RUN.combo=0;
  settle(ok,G.item,{type:'runner'});
  RUN.done++; RUN.results.push(ok); rnTrackMark(RUN.done-1,ok);
  G.anim={t0:W.t,ok,pick:pickI};
  const x=mc?RUN_LANES[pickI]:(pickI?3:-3), col=new THREE.Color(mc?RUN_COL[pickI]:RUN_OXCOL[pickI]).getHex();
  RN.ui.q.hidden=true; RN.ui.q.classList.remove('big');
  if (ok){ SFX.whoosh(); SFX.correct(); fx.burst(x,2.2,G.z,col,30,7); fx.burst(P.x,1.5,P.z,0xffd34d,24,6);
    RUN.spd=RUN.lv.spd*(1+Math.min(.35,RUN.combo*.05)); let extra='';
    if (RUN.combo>0 && RUN.combo%5===0 && RUN.hearts<3){ RUN.hearts++; extra=' · ❤️ 하트 회복!'; }
    const r=RN.ui.res; r.className='run-res card good'; r.hidden=false;
    r.innerHTML=`<b>정답!${RUN.combo>=2?` 🔥 ${RUN.combo}연속`:''}</b><small>${sp?`⚡ 빠른 결정 +${sp}점`:'통과!'}${extra}</small><p>${esc(G.item.e||'')}</p>`;
    RUN.resT=W.t+2.7; RUN.nextAt=W.t+2.7; }
  else { SFX.bounce(); SFX.wrong(); RUN.hearts--; RUN.stun=.9; shake=.35; P.z=G.z+1.3; fx.burst(x,1.6,G.z+.4,0x8a8fa0,20,4); RUN.spd=RUN.lv.spd;
    const ck=rnCheckSprite(); ck.position.set(mc?RUN_LANES[G.ci]:(G.ci?3:-3),1.5,.12); G.g.add(ck); G.anim.check=ck; G.texs.push(ck.material.map); G.mats.push(ck.material);
    rnExplainShow(G); RUN.nextAt=1e9; }
  if (RUN.done>=RUN.n) RUN.nextAt=1e9; }
function rnHit(o){ RUN.stun=.75; RUN.hits++; shake=.32; SFX.door(); const n=Math.min(RUN.coinsN,2+(Math.random()<.5?1:0));
  if (n){ RUN.coinsN-=n; W.cardCoins=Math.max(0,(W.cardCoins||0)-n); SFX.coinDrop(); rnFlyCoins(n); }
  fx.burst(P.x,1,P.z-.6,0xc9a06a,14,4);
  o.fly={t:0,vx:(o.g.position.x>=P.x?1:-1)*rnd(4,6),vy:o.kind==='log'?3:rnd(5,7),r:o.kind==='log'?2:rnd(5,9)};   // 부딪힌 것은 옆으로 튕겨 나가요
  rnToast(n?`쿵! 코인 ${n}개를 흘렸어요 · 스페이스로 뛰어넘어요`:'쿵! 스페이스로 뛰어넘어요'); }
function rnFlyCoins(n){ let k=0; for (const f of RN.fly){ if (k>=n) break; if (f.life>0) continue; f.life=.9; f.m.visible=true; f.m.position.set(P.x,1.2,P.z); const a=rnd(-1.2,1.2); f.vx=Math.sin(a)*rnd(2.5,4); f.vz=rnd(1,3); f.vy=rnd(5,7); k++; } }
function rnStarGet(){ SFX.star(); fx.burst(P.x,1.6,P.z,0xffe27a,24,5); RUN.hint=Math.min(2,RUN.hint+1);
  const G=RUN.gate; if (G && !G.done && G.item.kind==='mc' && G.gone<0){ RUN.hint--; rnCrumble(G); rnToast('⭐ 힌트 별! 오답 문 하나가 무너졌어요'); }
  else rnToast('⭐ 힌트 별을 모았어요 · 다음 4지선다에서 써요'); }
function rnFinishFx(){ SFX.cheer(); showBanner('🏁 결승선 통과!'); const z=RUN.finZ, cols=[0xff5a5a,0xffd34d,0x5ad1ff,0x7dff9a,0xd27dff];
  for (let k=0;k<5;k++) setTimeout(()=>{ for (let i=0;i<6;i++) fx.burst(rnd(-6,6),rnd(4,7),z+rnd(-2,2),cols[(i+k)%5],10,7); },k*220);
  if (knight) knight.anim.once('cheer',1,true); }
function runUpdate(dt){
  const G0=RUN.gate, reading=G0&&W.t<G0.t0+G0.rp;
  let f=1; if (reading) f=RN_READK; if (RUN.explain) f=Math.min(f,.5);
  if (RUN.slow && !RUN.fin) f*=RN_SLOWK;
  if (RUN.stun>0) f*=.45; else if (RUN.slowT>0) f*=.6;
  if (RUN.fin&&RUN.fin.crossed) f*=Math.max(0,1-(W.t-RUN.fin.t)/1.4);
  RUN.stun=Math.max(0,RUN.stun-dt); RUN.slowT=Math.max(0,RUN.slowT-dt);
  RUN.curSpd=RUN.spd*f; P.z-=RUN.curSpd*dt;
  const tx=RUN_LANES[RUN.lane], dx=tx-P.x; P.x+=Math.sign(dx)*Math.min(Math.abs(dx),15*dt); RUN.lean+=(Math.max(-1,Math.min(1,dx))-RUN.lean)*Math.min(1,dt*10);
  if (RUN.y>0||RUN.vy>0){ RUN.vy-=26*dt; RUN.y=Math.max(0,RUN.y+RUN.vy*dt); if (RUN.y===0){ RUN.vy=0; RUN.land=.18; } }
  RUN.land=Math.max(0,RUN.land-dt);
  // 길 이어 붙이기 (안개 너머 타일은 그리지 않아요)
  for (const t of RN.tiles){ if (t.position.z-RUN_TILE/2>P.z+16){ while (t.position.z-RUN_TILE/2>P.z+16) t.position.z-=RUN_TILE*RUN_NT; rnSkin(t,rnBiomeAt(t.position.z),true); } t.visible=P.z-t.position.z<scene.fog.far+20; }
  { const b=rnBiomeAt(P.z); if (b!==RUN.biome){ RUN.biome=b; if (RUN.explain) RUN.bToast=b; else rnToast(RN_BNAME[b],true); } }
  // 문제 · 문
  if (!RUN.gate && !RUN.explain && W.t>=RUN.nextAt && RUN.done<RUN.n && RUN.hearts>0) rnNextQuestion();
  const G=RUN.gate;
  if (G){ if (!G.big0 && W.t>=G.t0+G.rp){ G.big0=true; RN.ui.q.classList.remove('big'); }
    const tot=G.startZ-G.z, k=Math.max(0,Math.min(1,(P.z-G.z)/tot)); RN.ui.bar.style.width=(k*100)+'%'; RN.ui.bar.classList.toggle('hurry',k<.3);
    if (G.big0){ const tl=(P.z-G.z)/Math.max(.5,RUN.curSpd); while (G.beep<3 && tl<RN_BEEP[G.beep]){ SFX.tick(G.beep); G.beep++; } }
    if (P.z<=G.z) rnPass(); }
  if (RUN.explain){ const E=RUN.explain, b=$('#runResBar'); if (b) b.style.width=Math.max(0,(E.until-W.t)/(E.until-E.t0)*100)+'%';
    if (!E.keyOn && W.t>=E.skip){ E.keyOn=true; const kk=$('#runResKey'); if (kk) kk.innerHTML='<kbd>Enter</kbd> · <kbd>스페이스</kbd>로 계속'; }
    if (W.t>=E.until) rnExplainEnd(); }
  if (RUN.resT && W.t>=RUN.resT){ RUN.resT=0; if (!RUN.explain) RN.ui.res.hidden=true; }
  if (RUN.toastT && W.t>=RUN.toastT){ RUN.toastT=0; RN.ui.toast.className='run-toast'; }
  // 장애물
  const ln=runLaneNow(), lx=RUN_LANES[ln];
  for (const o of RUN.obs){
    if (o.fly){ const F=o.fly; o.g.position.x+=F.vx*dt; o.g.position.y=Math.max(0,o.g.position.y+F.vy*dt); F.vy-=18*dt; o.g.rotation.x+=F.r*dt; o.g.rotation.z+=F.r*.6*dt; continue; }
    if (o.vz && !o.hit){ o.z+=o.vz*dt; o.g.position.z=o.z; if (o.roll) o.roll.rotation.x+=o.vz*dt/.56; }
    if (o.hit) continue;
    if (Math.abs(o.z-P.z)<o.dz+.36 && o.lanes.includes(ln) && Math.abs(P.x-lx)<1.3){
      if (o.kind==='mud'||o.kind==='puddle'){ if (RUN.y<.15){ o.hit=true; RUN.slowT=.9; SFX.splash(); fx.burst(P.x,.25,P.z,o.kind==='mud'?0x5a4028:0x9ab8c8,12,3); rnToast(o.kind==='mud'?'철퍽! 진흙 웅덩이는 뛰어넘어요':'첨벙! 웅덩이는 뛰어넘어요'); } continue; }
      if (RUN.y>o.h*.8) continue;
      o.hit=true; rnHit(o); } }
  // 코인 · 별
  for (const c of RUN.coins){ if (!c.alive) continue; if (Math.abs(c.z-P.z)<.9 && c.lane===ln && RUN.y<2.3){ c.alive=false; RUN.coinsN++; W.cardCoins=(W.cardCoins||0)+1; SFX.card(); fx.burst(RUN_LANES[c.lane],1.1,c.z,0xffc531,6,2); } }
  for (const s of RUN.stars){ if (!s.alive) continue; if (Math.abs(s.z-P.z)<1 && s.lane===ln && RUN.y<2.5){ s.alive=false; s.g.visible=false; rnStarGet(); } }
  // 결승선
  if (RUN.done>=RUN.n && RUN.hearts>0 && RUN.finZ!=null && !RUN.explain){ if (!RUN.fin) RUN.fin={crossed:false};
    if (!RUN.fin.crossed && P.z<=RUN.finZ){ RUN.fin.crossed=true; RUN.fin.t=W.t; rnFinishFx(); } }
  if (RUN.fin && RUN.fin.crossed && !RUN.fin.ended && W.t-RUN.fin.t>2.9){ RUN.fin.ended=true; endGame(true); }
  // 지나간 것 치우기
  RUN.obs=RUN.obs.filter(o=>{ if (o.z>P.z+16||o.g.position.y>40){ RN.dyn.remove(o.g); return false; } return true; });
  RUN.coins=RUN.coins.filter(c=>c.alive&&c.z<P.z+14);
  RUN.stars=RUN.stars.filter(s=>{ if (!s.alive||s.z>P.z+14){ RN.dyn.remove(s.g); return false; } return true; });
  RUN.old=RUN.old.filter(G2=>{ if (G2.z>P.z+30){ rnDisposeGate(G2); return false; } return true; });
  RUN.pieces=RUN.pieces.filter(p=>{ if (p.z>P.z+70){ rnFree(p.g); return false; } return true; }); }
// 움직이는 것들 (하늘 · 물 · 풍차 · 배 · 문 · 코인 · 낙엽 · 응원)
function rnLook(dt,real){
  if (RN.skyG) RN.skyG.position.set(camera.position.x,0,camera.position.z);
  const fc=scene.fog.color, U=RN.skyU, W2=rnWaterU();
  if (U){ U.uTime.value=real; U.uFog.value.copy(fc); }
  W2.uTime.value=real; W2.uFog.value.copy(fc); W2.uFogN.value=scene.fog.near; W2.uFogF.value=scene.fog.far; if (U){ W2.uTop.value.copy(U.uTop.value); W2.uHor.value.copy(U.uHor.value); }
  for (const t of RN.tiles){ const d=t.rn.decor; if (!t.visible||!d) continue; const L=d.rnL;
    for (const o of L.spin){ if (o.userData.spin) o.rotation.z+=o.userData.spin*dt; if (o.userData.spinY) o.rotation.y+=o.userData.spinY*dt; }
    for (const o of L.bob){ o.position.y=o.userData.y0+Math.sin(real*1.2+o.userData.bob)*.1; o.rotation.z=Math.sin(real*.9+o.userData.bob)*.035; } }
  if (RUN.gate) rnGateLook(RUN.gate,dt,real); RUN.old.forEach(G=>rnGateLook(G,dt,real));
  rnCoinSync(real);
  for (const f of RN.fly){ if (f.life<=0) continue; f.life-=dt; f.vy-=20*dt; f.m.position.x+=f.vx*dt; f.m.position.y=Math.max(.1,f.m.position.y+f.vy*dt); f.m.position.z+=f.vz*dt; f.m.rotation.x+=dt*9; f.m.rotation.y+=dt*6; f.m.scale.setScalar(Math.max(.01,Math.min(1,f.life*2))); if (f.life<=0) f.m.visible=false; }
  for (const s of RUN.stars){ if (!s.alive) continue; s.g.rotation.y=real*2.2; s.g.position.y=1.45+Math.sin(real*3+s.z)*.15; }
  if (RN.leavesU){ const L2=RN.leavesU, tg=RUN.biome==='forest'?1:0; L2.uA.value+=(tg-L2.uA.value)*Math.min(1,dt*1.5); L2.uPZ.value=P.z; RN.leaves.visible=L2.uA.value>.01;
    if (RN.leaves.visible){ renderer.getDrawingBufferSize(RN_DB); L2.uScale.value=RN_DB.y/(2*Math.tan(camera.fov*Math.PI/360)); } }
  for (const c of RN.chars.start) if (c.root.visible && Math.abs(c.root.position.z-P.z)<80) c.mixer.update(dt);
  for (const c of RN.chars.fin) if (c.root.visible && Math.abs(c.root.position.z-P.z)<120) c.mixer.update(dt);
  if (RN.wq!==QCUR){ RN.wq=QCUR; const k=QCUR==='high'?1:QCUR==='medium'?.7:.45; RN.wheat.forEach(g=>{ g.instanceCount=Math.floor(g.userData.max*k); }); } }
function runHUD(){ const U=RN.ui; if (!U.hearts) return;
  const h=Math.max(0,RUN.hearts), hs='❤️'.repeat(h)+'🤍'.repeat(Math.max(0,3-h)); if (U.hs!==hs){ U.hs=hs; U.hearts.textContent=hs; }
  const cs=RUN.combo>=2?`🔥 ${RUN.combo}연속`:''; if (U.cs!==cs){ U.cs=cs; U.combo.textContent=cs; }
  const co=`🪙 ${RUN.coinsN}`; if (U.co!==co){ U.co=co; U.coins.textContent=co; }
  const st=RUN.hint>0?`⭐×${RUN.hint}`:''; if (U.st!==st){ U.st=st; U.star.textContent=st; U.star.hidden=!st; }
  const pr=`문제 ${Math.min(RUN.n,RUN.done+1)}/${RUN.n}`; if (U.pr!==pr){ U.pr=pr; U.prog.textContent=pr; }
  let pc=4+rnProgress()*88; if (RUN.done>=RUN.n && RUN.finZ!=null) pc=92+8*Math.max(0,Math.min(1,1-(P.z-RUN.finZ)/38));
  if (U.me){ U.me.style.left=pc.toFixed(2)+'%'; U.fill.style.width=pc.toFixed(2)+'%'; }
  const G=RUN.gate;
  if (G){ const rd=W.t<G.t0+G.rp, tt=rd?`읽는 시간 ${Math.ceil(G.t0+G.rp-W.t)}`:`${Math.max(0,Math.ceil((P.z-G.z)/Math.max(.5,RUN.curSpd)))}초`; if (U.tt!==tt){ U.tt=tt; U.time.textContent=tt; }
    const ln=runLaneNow(), pi=G.item.kind==='mc'?ln:(ln<2?0:1); if (pi!==RUN.pickI){ RUN.pickI=pi; [...U.opts.children].forEach((o,i)=>o.classList.toggle('pick',i===pi)); } }
  const sl=RUN.slow&&!!G; if (U.sl!==sl){ U.sl=sl; U.slowB.hidden=!sl; } }
function runnerFrame(dt,real,now){
  if (knight && (knight.anim.dead||endPose)){ knight.anim.revive(); endPose=false; }
  if (!RN.built){ renderFrame(); return; }
  if (!W.paused){ W.t+=dt; runUpdate(dt); }
  lobbyTick(real,dt);
  RUN.mood=rnProgress(); rnMoodApply(false);
  const air=RUN.y>.02;
  pg.position.set(P.x,RUN.y,P.z); pg.rotation.set(air?-.16:0,Math.PI-RUN.lean*.25,0);
  { const sq=RUN.land>0?1-Math.sin(RUN.land/.18*Math.PI)*.1:1; pg.scale.set(1,sq,1); }
  if (knight){ const A=knight.anim, fin=RUN.fin&&RUN.fin.crossed;
    if (fin && RUN.curSpd<.6) setBaseSynced(A,'idle'); else setBaseSynced(A,'run',air?.7:Math.min(2.4,Math.max(1,RUN.curSpd/6.5)));
    knight.mixer.update(W.paused?0:dt); }
  NAT_U.uTime.value=real; NAT_U.uCam.value.copy(camera.position); NAT_U.uPlr.value.set(P.x,1.1,P.z);
  fx.update(dt); updateCombatFx(dt); updateDreamy(real); qualityTick(now);
  { const o=sun.userData.off||[22,38,14]; sun.target.position.set(P.x,0,P.z-16); sun.position.set(P.x+o[0],o[1],P.z-16+o[2]); sun.target.updateMatrixWorld(); }
  // 낮게 뒤에서: 문이 멀리서 다가오는 게 문제 칸 아래로 보여요
  camera.position.lerp(RN_V.set(P.x*.45,5.0,P.z+10.5),W.snapCam?1:Math.min(1,dt*8)); W.snapCam=false; camera.lookAt(P.x*.55,.7,P.z-19.5);
  if (shake>0){ shake=Math.max(0,shake-dt); camera.position.x+=rnd(-1,1)*shake*.6; camera.position.y+=rnd(-1,1)*shake*.6; }
  rnLook(dt,real);
  limitTick(); if (W.state!=='play'){ renderFrame(); return; }
  runHUD(); renderFrame(); }
/* 키: 러너 판에서는 다른 조작(공격 · 스킬)보다 먼저 받아요 */
addEventListener('keydown',e=>{
  if (MAPK!=='runner' || W.state!=='play' || W.paused) return;
  const k=e.code;
  if (RUN.explain && (k==='Enter'||k==='NumpadEnter'||k==='Space')){ if (W.t>=RUN.explain.skip) rnExplainEnd(); e.preventDefault(); e.stopImmediatePropagation(); return; }
  if (k==='ArrowLeft'||k==='KeyA'){ if (!e.repeat) rnSetLane(RUN.lane-1); }
  else if (k==='ArrowRight'||k==='KeyD'){ if (!e.repeat) rnSetLane(RUN.lane+1); }
  else if (k==='Space'||k==='ArrowUp'||k==='KeyW'){ if (RUN.y===0&&RUN.vy===0) RUN.vy=10; }
  else if (k==='ArrowDown'||k==='KeyS') RUN.slow=true;
  else if (/^(Digit|Numpad)[1-4]$/.test(k)){ if (!e.repeat) rnKeyPick(+k.slice(-1)); }
  else if (k==='KeyO'||k==='KeyX'){ const G=RUN.gate; if (G&&G.item.kind!=='mc'&&!e.repeat) rnKeyPick(k==='KeyO'?1:2); }
  else if (/^F\d+$|Escape|Tab/.test(k)) return;
  e.preventDefault(); e.stopImmediatePropagation();
},true);
addEventListener('keyup',e=>{ if (e.code==='ArrowDown'||e.code==='KeyS') RUN.slow=false; },true);
addEventListener('blur',()=>{ RUN.slow=false; });
function runEndUI(){ document.body.classList.remove('runner'); ['#runHud','#runQ','#runRes','#runHelp','#runTrack'].forEach(s=>{ const e=$(s); if (e) e.hidden=true; }); const t=$('#runToast'); if (t) t.className='run-toast'; RUN.slow=false; }
