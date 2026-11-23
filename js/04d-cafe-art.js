/* 사회 게임 RPG · 🍰 디저트 카페 그래픽 (가게 · 재료 가판대 4곳 · 벽돌 오븐 · 토핑대 · 픽업 카운터 · 손님 출입문과 대기줄)
   04c-cafe.js의 buildCafe()가 cfArt()로 가게를 지어요. 텍스처는 모두 코드로 그려요(외부 그림 파일 없음).
   움직이지 않는 조각은 재질별로 하나로 합쳐서(vlMerge) 느린 컴퓨터에서도 가볍게 돌아가요. */
const CF_BOARD={y:3.9,z:-8.0,tilt:.55,w:3.3,h:2.48};   // 가판대 위에 매달린 주문 판 (가운데 높이 · 깊이 · 기울기 · 크기)
const CF_OVEN_C={x:-10.8,z:-8.3,r:1.62};                 // 구석 벽돌 오븐
const CF_DOORX={x0:9.9,x1:11.7,h:3.1};                   // 손님이 들어오는 뒷벽 문
const CF_CAM={x:.1,y:10,z:12.6};                         // 표지판이 바라볼 곳 (카메라 쪽)
const CFA={};                                            // 한 번 만든 텍스처

function cfaCv(w,h,fn){ const cv=document.createElement('canvas'); cv.width=w; cv.height=h; fn(cv.getContext('2d'),w,h); return cv; }
function cfaTex(cv,rep){ const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; t.anisotropy=ANISO; if (rep) t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }
const cfaMat=o=>new THREE.MeshStandardMaterial(Object.assign({roughness:.85,metalness:0},o));
function cfaShade(c,v){ const C=new THREE.Color(c); return `rgb(${Math.min(255,C.r*255*v)|0},${Math.min(255,C.g*255*v)|0},${Math.min(255,C.b*255*v)|0})`; }
function cfaMix(a,b,t){ const A=new THREE.Color(a); A.lerp(new THREE.Color(b),t); return '#'+A.getHexString(); }
const cfaFont=(px,b)=>`${b===false?'':'bold '}${px}px Jua, "Malgun Gothic", sans-serif`;

/* ---------- 작은 그림 (재료 · 토핑 · 불 · 종) : 100칸 크기로 그려서 s만큼 키워요 ---------- */
function cfaIcon(g,k,x,y,s){
  g.save(); g.translate(x,y); g.scale(s/100,s/100); g.lineJoin='round'; g.lineCap='round';
  const OL='rgba(58,34,48,.92)';
  const blob=(fill,path,lw)=>{ g.beginPath(); path(); g.fillStyle=fill; g.fill(); if (lw){ g.lineWidth=lw; g.strokeStyle=OL; g.stroke(); } };
  const shine=(x0,y0,rx,ry,r)=>{ g.fillStyle='rgba(255,255,255,.38)'; g.beginPath(); g.ellipse(x0,y0,rx,ry,r||0,0,7); g.fill(); };
  if (k===0){   // 딸기
    blob('#ff4d6d',()=>{ g.moveTo(0,44); g.bezierCurveTo(-26,30,-44,4,-38,-16); g.bezierCurveTo(-32,-34,-10,-32,0,-24); g.bezierCurveTo(10,-32,32,-34,38,-16); g.bezierCurveTo(44,4,26,30,0,44); g.closePath(); },6);
    shine(-17,-9,6,11,-.5);
    g.fillStyle='#ffe08a'; [[-20,-4],[0,-2],[20,-4],[-12,14],[12,14],[0,30],[-27,10],[27,10]].forEach(([a,b])=>{ g.beginPath(); g.ellipse(a,b,2.6,3.8,0,0,7); g.fill(); });
    blob('#43a047',()=>{ for (let i=0;i<5;i++){ const a=Math.PI+i*Math.PI/4, b=a+Math.PI/8; const ox=Math.cos(a)*25, oy=-25+Math.sin(a)*13; i?g.lineTo(ox,oy):g.moveTo(ox,oy); g.lineTo(Math.cos(b)*9,-25+Math.sin(b)*5); } g.closePath(); },4);
    g.strokeStyle='#2e7d32'; g.lineWidth=6; g.beginPath(); g.moveTo(0,-30); g.quadraticCurveTo(2,-40,8,-46); g.stroke();
  } else if (k===1){   // 초콜릿
    g.rotate(-.18);
    blob('#6e3d22',()=>{ roundRect(g,-31,-43,62,86,9); },0);
    g.fillStyle='#8c5530'; for (let r=0;r<3;r++) for (let c=0;c<2;c++){ roundRect(g,-25+c*26,-37+r*18,23,15,3); g.fill(); }
    g.fillStyle='rgba(255,255,255,.2)'; for (let r=0;r<3;r++) for (let c=0;c<2;c++) g.fillRect(-23+c*26,-36+r*18,19,3);
    g.save(); roundRect(g,-31,-43,62,86,9); g.clip(); g.fillStyle='#e5484d'; g.fillRect(-31,16,62,28); g.fillStyle='#ffd23f'; g.fillRect(-31,24,62,7); g.restore();
    g.lineWidth=6; g.strokeStyle=OL; roundRect(g,-31,-43,62,86,9); g.stroke();
  } else if (k===2){   // 레몬
    g.save(); g.rotate(-.35);
    blob('#ffd84a',()=>{ g.moveTo(-47,0); g.bezierCurveTo(-40,-31,40,-31,47,0); g.bezierCurveTo(40,31,-40,31,-47,0); g.closePath(); },6);
    shine(-12,-12,16,6,-.2); g.restore();
    blob('#66bb6a',()=>{ g.moveTo(12,-24); g.quadraticCurveTo(28,-50,52,-40); g.quadraticCurveTo(38,-18,12,-24); },4);
  } else if (k===3){   // 블루베리
    [[0,-16,'#6f5ff0'],[-21,12,'#5b4bd6'],[22,14,'#4a3cc0']].forEach(([a,b,c])=>{
      blob(c,()=>{ g.arc(a,b,23,0,7); },6); shine(a-8,b-8,6,6);
      g.strokeStyle='#241a66'; g.lineWidth=4; g.beginPath(); for (let i=0;i<5;i++){ const t=i*Math.PI*2/5-Math.PI/2; g.moveTo(a,b-13); g.lineTo(a+Math.cos(t)*6,b-13+Math.sin(t)*6); } g.stroke(); });
  } else if (k==='cherry'){
    g.strokeStyle='#5d4037'; g.lineWidth=5; g.beginPath(); g.moveTo(-16,16); g.quadraticCurveTo(-8,-20,8,-40); g.moveTo(18,20); g.quadraticCurveTo(14,-14,8,-40); g.stroke();
    blob('#7cb342',()=>{ g.moveTo(8,-40); g.quadraticCurveTo(30,-56,46,-36); g.quadraticCurveTo(24,-28,8,-40); },3);
    [[-16,22],[18,26]].forEach(([a,b])=>{ blob('#e8143c',()=>{ g.arc(a,b,19,0,7); },6); shine(a-6,b-7,5,5); });
  } else if (k==='mint'){
    [[-14,6,-.5,'#5fd38d'],[14,0,.45,'#36a862']].forEach(([a,b,r,c])=>{ g.save(); g.translate(a,b); g.rotate(r);
      blob(c,()=>{ g.moveTo(0,-40); g.bezierCurveTo(26,-24,24,22,0,40); g.bezierCurveTo(-24,22,-26,-24,0,-40); },5);
      g.strokeStyle='rgba(20,80,40,.55)'; g.lineWidth=3; g.beginPath(); g.moveTo(0,-34); g.lineTo(0,36); for (let i=-2;i<=2;i++){ g.moveTo(0,i*12); g.lineTo(12,i*12-8); g.moveTo(0,i*12); g.lineTo(-12,i*12-8); } g.stroke(); g.restore(); });
  } else if (k==='flame'){
    blob('#ff7a1a',()=>{ g.moveTo(0,-46); g.bezierCurveTo(22,-18,38,4,30,24); g.bezierCurveTo(24,42,-24,42,-30,24); g.bezierCurveTo(-38,4,-14,-12,0,-46); },6);
    blob('#ffd23f',()=>{ g.moveTo(0,-12); g.bezierCurveTo(12,4,20,14,14,28); g.bezierCurveTo(8,38,-8,38,-14,28); g.bezierCurveTo(-20,14,-10,4,0,-12); },0);
  } else if (k==='bell'){
    blob('#f2b632',()=>{ g.moveTo(-36,20); g.bezierCurveTo(-36,-28,36,-28,36,20); g.closePath(); },6);
    shine(-14,-6,6,12,.4);
    blob('#8d6e63',()=>{ roundRect(g,-46,20,92,14,5); },5);
    blob('#f2b632',()=>{ g.arc(0,-25,7,0,7); },4);
  } else if (k==='cake'){
    blob('#ffe1c2',()=>{ roundRect(g,-40,-4,80,42,8); },6);
    blob('#ff8fb0',()=>{ g.moveTo(-40,4); g.bezierCurveTo(-40,-20,40,-20,40,4); for (let i=0;i<=8;i++){ const x=40-i*10; g.quadraticCurveTo(x-5,(i%2)?10:16,x-10,6); } g.closePath(); },6);
    blob('#e8143c',()=>{ g.arc(0,-24,9,0,7); },4); g.strokeStyle='#5d4037'; g.lineWidth=3; g.beginPath(); g.moveTo(0,-32); g.quadraticCurveTo(4,-42,10,-44); g.stroke();
  }
  g.restore();
}

/* ---------- 주문 판 (가판대 위) : 위쪽 색 띠 + 크림색 종이 + 진한 글씨라 노란 판도 잘 읽혀요 ---------- */
function cfaBoardBase(g,W,H,i){
  const C=CF_SHELF[i].c;
  g.fillStyle='#fff8ec'; g.fillRect(0,0,W,H);
  for (let n=0;n<260;n++){ g.fillStyle=`rgba(150,110,70,${Math.random()*.05})`; g.fillRect(Math.random()*W,Math.random()*H,2+Math.random()*34,1.2); }
  g.fillStyle=C; g.fillRect(0,0,W,118);
  g.beginPath(); for (let x=0;x<W;x+=40) g.arc(x+20,118,20,0,Math.PI); g.fill();
  g.fillStyle='rgba(255,255,255,.16)'; g.fillRect(0,0,W,12);
  g.strokeStyle=C; g.lineWidth=12; g.strokeRect(6,6,W-12,H-12);
  g.strokeStyle='rgba(58,34,48,.25)'; g.lineWidth=2; g.strokeRect(13,13,W-26,H-26);
}
function cfaHeadBadge(g,W,label,i){
  g.textAlign='center'; g.textBaseline='middle';
  g.fillStyle='#fff'; g.beginPath(); g.arc(W/2,58,47,0,7); g.fill();
  g.fillStyle=CF_SHELF[i].c; g.font=cfaFont(68); g.fillText(label,W/2,62);
  cfaIcon(g,i,98,60,80); cfaIcon(g,i,W-98,60,80);
}
function cfBoardTex(label,text,i){
  const W=640, H=480;
  return cfaTex(cfaCv(W,H,g=>{ cfaBoardBase(g,W,H,i); cfaHeadBadge(g,W,label,i);
    const s=String(text), len=s.length, fs=len>22?50:len>14?60:len>8?72:86;
    const lines=runWrap(g,s,W-74,cfaFont(fs,false),fs*1.18,3);
    g.fillStyle='#3a2230'; lines.forEach((l,j)=>g.fillText(l,W/2,304+(j-(lines.length-1)/2)*fs*1.2));
  }));
}
function cfaBoardIdleTex(i){
  const W=640, H=480, s=CF_SHELF[i];
  return cfaTex(cfaCv(W,H,g=>{ cfaBoardBase(g,W,H,i); cfaHeadBadge(g,W,String(i+1),i);
    cfaIcon(g,i,W/2,262,150);
    g.fillStyle=cfaShade(s.c,i===2?.8:1); g.font=cfaFont(64); g.fillText(s.n,W/2,405);
  }));
}

/* ---------- 발판 (바닥에 그린 동그라미 + 그림) ---------- */
function cfaPadTex(kind,hex){
  const key='pad'+kind; if (CFA[key]) return CFA[key];
  const S=256, c=new THREE.Color(hex), rgb=`${c.r*255|0},${c.g*255|0},${c.b*255|0}`, m=S/2;
  return CFA[key]=cfaTex(cfaCv(S,S,g=>{
    g.fillStyle=`rgba(${rgb},.3)`; g.beginPath(); g.arc(m,m,122,0,7); g.fill();
    g.lineWidth=13; g.strokeStyle=`rgba(${rgb},.96)`; g.beginPath(); g.arc(m,m,114,0,7); g.stroke();
    g.lineWidth=4; g.strokeStyle='rgba(255,255,255,.95)'; g.beginPath(); g.arc(m,m,104,0,7); g.stroke();
    g.setLineDash([12,12]); g.lineWidth=3.5; g.strokeStyle=`rgba(${rgb},.7)`; g.beginPath(); g.arc(m,m,86,0,7); g.stroke(); g.setLineDash([]);
    g.fillStyle='rgba(255,255,255,.72)'; g.beginPath(); g.arc(m,m,56,0,7); g.fill();
    if (kind==='O'||kind==='X'){ g.textAlign='center'; g.textBaseline='middle'; g.font=cfaFont(104); g.lineWidth=10; g.strokeStyle='#fff'; g.strokeText(kind,m,m+6); g.fillStyle=`rgb(${rgb})`; g.fillText(kind,m,m+6); }
    else cfaIcon(g,kind,m,m,86);
  }));
}

/* ---------- 바닥: 부엌은 육각 타일, 손님 쪽은 나무 마루 + 대기줄 러그, 가구 · 벽 밑은 부드러운 그늘 ---------- */
function cfaFloorTex(){
  const S=QCUR==='low'?1024:2048, X0=-12.6, Z0=-10, WD=25.2, k=S/WD, px=x=>(x-X0)*k, pz=z=>(z-Z0)*k;
  return cfaTex(cfaCv(S,S,g=>{
    // 나무 마루
    const pw=.27*k;
    for (let c=0;c*pw<S;c++){ let y=-Math.random()*2*k;
      while (y<S){ const L=(1.3+Math.random()*2.4)*k, v=.84+Math.random()*.24;
        g.fillStyle=`rgb(${160*v|0},${106*v|0},${68*v|0})`; g.fillRect(c*pw,y,pw,L);
        g.lineWidth=Math.max(1,k*.01);
        for (let n=0;n<6;n++){ const x0=c*pw+pw*(.15+Math.random()*.7), a=pw*(.04+Math.random()*.08), f=2+Math.random()*4, ph=Math.random()*6;
          g.strokeStyle=Math.random()<.6?'rgba(70,38,18,.2)':'rgba(255,220,170,.12)'; g.beginPath();
          for (let t=0;t<=1.001;t+=.05){ const xx=x0+Math.sin(t*f+ph)*a; t?g.lineTo(xx,y+t*L):g.moveTo(xx,y); } g.stroke(); }
        g.fillStyle='rgba(45,24,10,.55)'; g.fillRect(c*pw,y,pw,Math.max(1.5,k*.016));
        y+=L; }
      g.fillStyle='rgba(45,24,10,.45)'; g.fillRect(c*pw,0,Math.max(1.5,k*.014),S); }
    // 손님 대기줄 러그 (문 → 카운터)
    { const x0=px(9.4), x1=px(12.0), z0=pz(-9.25), z1=pz(-1.95), w=x1-x0, h=z1-z0, u=k;
      g.fillStyle='rgba(40,20,10,.28)'; roundRect(g,x0+.05*u,z0+.08*u,w,h,.12*u); g.fill();
      g.fillStyle='#b8495c'; roundRect(g,x0,z0,w,h,.12*u); g.fill();
      g.fillStyle='#f6e2cd'; roundRect(g,x0+.13*u,z0+.13*u,w-.26*u,h-.26*u,.08*u); g.fill();
      g.fillStyle='#d36a7c'; roundRect(g,x0+.22*u,z0+.22*u,w-.44*u,h-.44*u,.06*u); g.fill();
      g.save(); g.beginPath(); g.rect(x0+.22*u,z0+.22*u,w-.44*u,h-.44*u); g.clip();
      const dw=.62*u, dh=.8*u; for (let yy=z0; yy<z1+dh; yy+=dh) for (let xx=x0-dw; xx<x1+dw; xx+=dw){ const ox=((yy-z0)/dh|0)%2?dw/2:0;
        g.fillStyle='rgba(255,236,214,.55)'; g.beginPath(); g.moveTo(xx+ox,yy-dh*.32); g.lineTo(xx+ox+dw*.26,yy); g.lineTo(xx+ox,yy+dh*.32); g.lineTo(xx+ox-dw*.26,yy); g.closePath(); g.fill();
        g.fillStyle='rgba(184,73,92,.8)'; g.beginPath(); g.arc(xx+ox,yy,.05*u,0,7); g.fill(); }
      g.restore();
      g.strokeStyle='#f6e2cd'; g.lineWidth=Math.max(1,.02*u); for (let xx=x0+.1*u; xx<x1-.05*u; xx+=.07*u){ g.beginPath(); g.moveTo(xx,z0); g.lineTo(xx,z0-.12*u); g.moveTo(xx,z1); g.lineTo(xx,z1+.12*u); g.stroke(); } }
    // 문 앞 매트
    { g.fillStyle='#8a6a3e'; roundRect(g,px(10.05),pz(-9.78),px(11.55)-px(10.05),pz(-9.3)-pz(-9.78),.05*k); g.fill();
      g.strokeStyle='rgba(60,40,20,.5)'; g.lineWidth=Math.max(1,.015*k); for (let xx=px(10.1); xx<px(11.5); xx+=.05*k){ g.beginPath(); g.moveTo(xx,pz(-9.75)); g.lineTo(xx,pz(-9.33)); g.stroke(); } }
    // 부엌 육각 타일
    const KP=[[-12.6,-10],[9.02,-10],[9.02,-4.3],[6.3,-4.3],[6.3,3.3],[-12.6,3.3]];
    g.save(); g.beginPath(); KP.forEach(([x,z],i)=>i?g.lineTo(px(x),pz(z)):g.moveTo(px(x),pz(z))); g.closePath(); g.clip();
    g.fillStyle='#d6c7b0'; g.fillRect(0,0,S,S);
    const R=.36*k, hw=Math.sqrt(3)*R, rh=1.5*R, gap=Math.max(1,k*.02);
    const hex=(cx,cy,rr)=>{ g.beginPath(); for (let i=0;i<6;i++){ const a=Math.PI/6+i*Math.PI/3, X=cx+Math.cos(a)*rr, Y=cy+Math.sin(a)*rr; i?g.lineTo(X,Y):g.moveTo(X,Y); } g.closePath(); };
    for (let r=-1;r*rh<pz(3.5)+R;r++) for (let c=-1;c*hw<px(9.3)+hw;c++){
      const cx=c*hw+((r&1)?hw/2:0), cy=r*rh, q=c-((r-(r&1))>>1), acc=(((q+3*r)%7)+7)%7===0, v=.97+Math.random()*.045;
      const b=acc?[214,229,214]:[245,236,220];
      g.fillStyle=`rgb(${b.map(x=>Math.min(255,x*v)|0)})`; hex(cx,cy,R-gap); g.fill();
      g.fillStyle='rgba(255,255,255,.22)'; hex(cx-R*.06,cy-R*.08,R*.62); g.fill();
    }
    for (let n=0;n<70;n++){ const x=Math.random()*S, y=Math.random()*pz(3.3), r=(.3+Math.random()*1.3)*k, gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(140,110,70,.07)'); gr.addColorStop(1,'rgba(140,110,70,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); }
    g.restore();
    // 그늘 (가구 · 벽 밑)
    const sh=(fn,b,a)=>{ g.save(); g.shadowColor=`rgba(35,20,8,${a})`; g.shadowBlur=b*k; g.fillStyle=`rgba(35,20,8,${a})`; fn(); g.restore(); };
    const ao=(x0,z0,x1,z1,b,a)=>sh(()=>g.fillRect(px(x0),pz(z0),px(x1)-px(x0),pz(z1)-pz(z0)),b,a);
    const aoC=(x,z,r,b,a)=>sh(()=>{ g.beginPath(); g.arc(px(x),pz(z),r*k,0,7); g.fill(); },b,a);
    ao(-12.6,-10.6,12.6,-9.8,.9,.6); ao(-13.4,-10,-12.4,15,.9,.55); ao(12.4,-10,13.4,15,.9,.55);
    for (const b of CF_BOX) ao(b[0],b[2],b[1],b[3],.42,.55);
    for (const c of CF_ROUND) aoC(c.x,c.z,c.r,.5,.6);
    for (const [x,z,r] of CF_ART_AO) aoC(x,z,r,.3,.42);
  }));
}
const CF_ART_AO=[[10.8,1.9,.55],[10.05,1.9,.32],[11.55,1.9,.32],[11.95,-6.6,.5],[11.95,-7.6,.4],[11.95,-5.6,.4],[12.0,.4,.45],[12.05,-9.3,.35],[9.45,-9.35,.3]];

/* ---------- 벽: 위는 줄무늬 벽지, 아래는 민트색 판벽, 가판대 뒤는 하얀 타일 ---------- */
function cfaWallpaper(g,W,H,k){
  g.fillStyle='#fbf1e2'; g.fillRect(0,0,W,H);
  const sw=.36*k; for (let x=0;x<W;x+=sw*2){ g.fillStyle='#f4e1cd'; g.fillRect(x,0,sw,H); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(x+sw-1.5,0,1.5,H); }
  g.fillStyle='rgba(226,150,160,.28)';
  for (let x=sw*1.5,j=0;x<W;x+=sw*2,j++) for (let y=.25*k;y<H;y+=.5*k){ const yy=y+(j%2?.25*k:0); g.beginPath(); for (let p=0;p<4;p++){ const a=p*Math.PI/2; g.moveTo(x,yy); g.arc(x+Math.cos(a)*.035*k,yy+Math.sin(a)*.035*k,.03*k,0,7); } g.fill(); }
}
function cfaWainscot(g,x0,x1,H,k){
  const top=H-1.3*k;
  g.fillStyle='#a3d4c1'; g.fillRect(x0,top,x1-x0,H-top);
  const gw=Math.max(1,k*.014);
  for (let x=x0;x<x1;x+=.14*k){ g.fillStyle='rgba(40,90,70,.26)'; g.fillRect(x,top,gw,H-top); g.fillStyle='rgba(255,255,255,.2)'; g.fillRect(x+gw,top,gw,H-top); }
  g.fillStyle='#c8925a'; g.fillRect(x0,top-.07*k,x1-x0,.11*k); g.fillStyle='rgba(255,255,255,.28)'; g.fillRect(x0,top-.07*k,x1-x0,.025*k); g.fillStyle='rgba(60,30,10,.3)'; g.fillRect(x0,top+.03*k,x1-x0,.015*k);
  g.fillStyle='#f4ede2'; g.fillRect(x0,H-.18*k,x1-x0,.18*k); g.fillStyle='rgba(60,30,10,.18)'; g.fillRect(x0,H-.18*k,x1-x0,.02*k);
}
function cfaWallShade(g,W,H,k,edges){   // 바닥 · 모서리 · 위쪽 그늘
  let gr=g.createLinearGradient(0,H,0,H-.9*k); gr.addColorStop(0,'rgba(50,30,15,.38)'); gr.addColorStop(1,'rgba(50,30,15,0)'); g.fillStyle=gr; g.fillRect(0,H-.9*k,W,.9*k);
  gr=g.createLinearGradient(0,0,0,1.2*k); gr.addColorStop(0,'rgba(50,30,15,.22)'); gr.addColorStop(1,'rgba(50,30,15,0)'); g.fillStyle=gr; g.fillRect(0,0,W,1.2*k);
  for (const [x,dir] of edges){ gr=g.createLinearGradient(x,0,x+dir*1.1*k,0); gr.addColorStop(0,'rgba(50,30,15,.32)'); gr.addColorStop(1,'rgba(50,30,15,0)'); g.fillStyle=gr; g.fillRect(Math.min(x,x+dir*1.1*k),0,1.1*k,H); }
}
function cfaBackWallTex(){
  const W=QCUR==='low'?1024:2048, k=W/24.8, H=Math.round(6.2*k), px=x=>(x+12.4)*k, py=y=>H-y*k;
  return cfaTex(cfaCv(W,H,g=>{
    cfaWallpaper(g,W,H,k);
    { const x0=px(-8.85), x1=px(8.85), y0=py(3.3), y1=py(.85), tw=.3*k, th=.15*k;
      g.save(); g.beginPath(); g.rect(x0,y0,x1-x0,y1-y0); g.clip(); g.fillStyle='#ddd0be'; g.fillRect(x0,y0,x1-x0,y1-y0);
      for (let r=0;r*th<y1-y0;r++) for (let c=-1;c*tw<x1-x0+tw;c++){ const x=x0+c*tw+(r&1?tw/2:0), y=y0+r*th, v=.96+Math.random()*.05;
        g.fillStyle=`rgb(${255*v|0},${250*v|0},${241*v|0})`; roundRect(g,x+1.2,y+1.2,tw-2.4,th-2.4,2); g.fill(); g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(x+3,y+2.2,tw-6,1.6); }
      const gr=g.createLinearGradient(0,y1,0,y1-.7*k); gr.addColorStop(0,'rgba(60,35,15,.35)'); gr.addColorStop(1,'rgba(60,35,15,0)'); g.fillStyle=gr; g.fillRect(x0,y1-.7*k,x1-x0,.7*k);
      g.restore(); g.fillStyle='#c8925a'; g.fillRect(x0,y0-.07*k,x1-x0,.09*k); }
    cfaWainscot(g,0,px(-8.85),H,k); cfaWainscot(g,px(8.85),W,H,k);
    cfaWallShade(g,W,H,k,[[0,1],[W,-1]]);
  }));
}
function cfaSideWallTex(left){   // 왼쪽 벽: 앞(z=10)→뒤(z=-9.8), 오른쪽 벽: 뒤→앞
  const W=QCUR==='low'?1024:2048, k=W/19.8, H=Math.round(6.2*k), sx=z=>(left?10-z:z+9.8)*k, py=y=>H-y*k;
  return cfaTex(cfaCv(W,H,g=>{
    cfaWallpaper(g,W,H,k); cfaWainscot(g,0,W,H,k);
    const back=sx(-9.8); cfaWallShade(g,W,H,k,[[back,left?-1:1]]);
    const band=(z0,z1,y,a)=>{ const x0=Math.min(sx(z0),sx(z1)), x1=Math.max(sx(z0),sx(z1)); const gr=g.createLinearGradient(0,py(y),0,py(y+.6)); gr.addColorStop(0,`rgba(50,30,15,${a})`); gr.addColorStop(1,'rgba(50,30,15,0)'); g.fillStyle=gr; g.fillRect(x0,py(y+.6),x1-x0,.6*k); };
    if (left){ band(-4.25,3.8,1.02,.35); band(-6.0,-4.3,2.3,.25); }
    else { band(-8.4,-4.8,1.05,.25); }
  }));
}

/* ---------- 재질 텍스처들 ---------- */
function cfaMarbleTex(){ if (CFA.marble) return CFA.marble; const S=512;
  return CFA.marble=cfaTex(cfaCv(S,S,g=>{ g.fillStyle='#f3efe8'; g.fillRect(0,0,S,S);
    const n=vlTileNoise(128,4,3), cv=cfaCv(128,128,gg=>{ const id=gg.createImageData(128,128); for (let i=0;i<n.length;i++){ const v=n[i]; id.data[i*4]=200; id.data[i*4+1]=196; id.data[i*4+2]=190; id.data[i*4+3]=v*60; } gg.putImageData(id,0,0); });
    g.drawImage(cv,0,0,S,S);
    for (let v=0;v<10;v++){ let x=Math.random()*S, y=Math.random()*S, a=Math.random()*6.283; const pts=[[x,y]]; for (let s=0;s<26;s++){ a+=(Math.random()-.5)*.7; x+=Math.cos(a)*16; y+=Math.sin(a)*16; pts.push([x,y]); }
      for (const ox of [-S,0,S]) for (const oy of [-S,0,S]){ g.strokeStyle=`rgba(120,116,112,${.12+Math.random()*.16})`; g.lineWidth=.8+Math.random()*1.8; g.beginPath(); pts.forEach(([X,Y],j)=>j?g.lineTo(X+ox,Y+oy):g.moveTo(X+ox,Y+oy)); g.stroke(); } }
  }),true); }
function cfaBrickTex(){ if (CFA.brick) return CFA.brick; const S=512, rows=10, rh=S/rows, bw=S/5;
  return CFA.brick=cfaTex(cfaCv(S,S,g=>{ g.fillStyle='#e2cfb6'; g.fillRect(0,0,S,S);
    const pal=[[186,92,62],[170,80,52],[198,108,72],[156,74,48],[178,98,70]];
    for (let r=0;r<rows;r++) for (let c=-1;c<=5;c++){ const x=c*bw+(r%2?bw/2:0), y=r*rh, p=pal[(Math.random()*pal.length)|0], v=.9+Math.random()*.16;
      g.fillStyle=`rgb(${p[0]*v|0},${p[1]*v|0},${p[2]*v|0})`; roundRect(g,x+4,y+4,bw-8,rh-8,6); g.fill();
      g.fillStyle='rgba(255,230,200,.16)'; roundRect(g,x+7,y+6,bw-14,rh*.3,4); g.fill();
      g.fillStyle='rgba(40,15,5,.16)'; roundRect(g,x+7,y+rh*.55,bw-14,rh*.3,4); g.fill();
      if (Math.random()<.25){ g.fillStyle='rgba(30,20,15,.12)'; g.beginPath(); g.arc(x+Math.random()*bw,y+rh/2,8+Math.random()*10,0,7); g.fill(); } }
  }),true); }
function cfaStripeTex(i){ const C=CF_SHELF[i].c, W=512, H=256, n=16, sw=W/n;
  return cfaTex(cfaCv(W,H,g=>{ for (let s=0;s<n;s++){ const gr=g.createLinearGradient(s*sw,0,(s+1)*sw,0), c=s%2?'#fff6ea':C;
      gr.addColorStop(0,cfaShade(c,.9)); gr.addColorStop(.5,cfaShade(c,1.04)); gr.addColorStop(1,cfaShade(c,.88)); g.fillStyle=gr; g.fillRect(s*sw,0,sw,H); }
    const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'rgba(40,20,10,.25)'); gr.addColorStop(.5,'rgba(40,20,10,0)'); gr.addColorStop(1,'rgba(255,255,255,.08)'); g.fillStyle=gr; g.fillRect(0,0,W,H); })); }
function cfaValanceTex(i){ const C=CF_SHELF[i].c, W=512, H=48, n=16, sw=W/n, top=30;
  return cfaTex(cfaCv(W,H,g=>{ for (let s=0;s<n;s++){ const c=s%2?'#fff6ea':C; g.fillStyle=cfaShade(c,.97); g.beginPath(); g.moveTo(s*sw,0); g.lineTo((s+1)*sw,0); g.lineTo((s+1)*sw,top); g.arc(s*sw+sw/2,top,sw/2,0,Math.PI); g.closePath(); g.fill();
      g.strokeStyle='rgba(58,34,48,.35)'; g.lineWidth=2; g.beginPath(); g.arc(s*sw+sw/2,top,sw/2-1,0,Math.PI); g.stroke(); }
    g.fillStyle='rgba(255,255,255,.3)'; g.fillRect(0,3,W,3); g.fillStyle='rgba(58,34,48,.2)'; g.fillRect(0,0,W,2); })); }
function cfaViewTex(){ if (CFA.view) return CFA.view; const W=1024, H=640;
  return CFA.view=cfaTex(cfaCv(W,H,g=>{
    let gr=g.createLinearGradient(0,0,0,H*.62); gr.addColorStop(0,'#8cc4ea'); gr.addColorStop(1,'#eaf5f2'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.fillStyle='rgba(255,255,255,.85)'; for (const [x,y,s] of [[180,110,1],[620,80,1.3],[880,170,.8],[390,190,.7]]) for (let i=0;i<5;i++){ g.beginPath(); g.ellipse(x+(i-2)*36*s,y+Math.abs(i-2)*7*s,40*s,26*s,0,0,7); g.fill(); }
    g.fillStyle='#a9cf94'; g.beginPath(); g.moveTo(0,H*.6); for (let x=0;x<=W;x+=32) g.lineTo(x,H*.56-Math.sin(x/170)*26-Math.sin(x/61)*8); g.lineTo(W,H); g.lineTo(0,H); g.fill();
    for (let i=0;i<14;i++){ const x=i*78+Math.random()*30, y=H*.6, r=40+Math.random()*24;
      g.fillStyle='#6b4a32'; g.fillRect(x-6,y-10,12,50);
      g.fillStyle=['#5f9e4f','#6fae55','#548f45'][i%3]; for (let j=0;j<4;j++){ g.beginPath(); g.arc(x+(j-1.5)*r*.45,y-r*.7-(j%2)*r*.35,r*.62,0,7); g.fill(); }
      g.fillStyle='rgba(255,255,240,.18)'; g.beginPath(); g.arc(x-r*.3,y-r*1.05,r*.4,0,7); g.fill(); }
    g.fillStyle='#4e8a40'; g.fillRect(0,H*.7,W,H*.09); for (let x=0;x<W;x+=18){ g.beginPath(); g.arc(x,H*.7,14,0,7); g.fill(); }
    g.fillStyle='#fffaf0'; for (let x=6;x<W;x+=40){ g.fillRect(x,H*.73,16,H*.12); g.beginPath(); g.moveTo(x,H*.73); g.lineTo(x+8,H*.71); g.lineTo(x+16,H*.73); g.fill(); } g.fillRect(0,H*.765,W,8); g.fillRect(0,H*.82,W,8);
    gr=g.createLinearGradient(0,H*.85,0,H); gr.addColorStop(0,'#7fb35a'); gr.addColorStop(1,'#6a9e48'); g.fillStyle=gr; g.fillRect(0,H*.85,W,H*.15);
    for (let i=0;i<120;i++){ g.fillStyle=['#ff8fb0','#ffffff','#ffd84a','#c77dff'][i%4]; g.beginPath(); g.arc(Math.random()*W,H*.86+Math.random()*H*.13,3+Math.random()*3,0,7); g.fill(); }
  })); }
function cfaFireTex(){ const S=256;
  return cfaTex(cfaCv(S,S,g=>{ g.fillStyle='#1c0a05'; g.fillRect(0,0,S,S);
    let gr=g.createRadialGradient(S/2,S*.92,10,S/2,S*.85,S*.75); gr.addColorStop(0,'rgba(255,190,90,1)'); gr.addColorStop(.35,'rgba(240,90,30,.85)'); gr.addColorStop(1,'rgba(60,15,5,0)'); g.fillStyle=gr; g.fillRect(0,0,S,S);
    for (let i=0;i<9;i++){ const x=S*(.15+i*.088), h=S*(.32+Math.random()*.3), w=S*(.07+Math.random()*.04);
      g.fillStyle=i%2?'rgba(255,140,40,.9)':'rgba(255,90,20,.85)'; g.beginPath(); g.moveTo(x-w,S*.9); g.bezierCurveTo(x-w,S*.9-h*.5,x+w*.3,S*.9-h*.7,x,S*.9-h); g.bezierCurveTo(x+w*.6,S*.9-h*.6,x+w,S*.9-h*.4,x+w,S*.9); g.fill(); }
    for (let i=0;i<7;i++){ const x=S*(.22+i*.095), h=S*(.18+Math.random()*.16), w=S*.045; g.fillStyle='rgba(255,226,120,.95)'; g.beginPath(); g.moveTo(x-w,S*.9); g.quadraticCurveTo(x,S*.9-h*1.4,x+w,S*.9); g.fill(); }
    g.fillStyle='#3a1c0e'; for (let i=0;i<5;i++){ g.save(); g.translate(S*(.25+i*.13),S*.93); g.rotate((i-2)*.25); roundRect(g,-34,-8,68,16,7); g.fill(); g.restore(); }
    for (let i=0;i<40;i++){ g.fillStyle=`rgba(255,${180+Math.random()*70|0},80,${.5+Math.random()*.5})`; g.beginPath(); g.arc(S*(.15+Math.random()*.7),S*(.86+Math.random()*.12),1.5+Math.random()*2.5,0,7); g.fill(); }
  })); }
function cfaSmallTex(kind){ if (CFA[kind]) return CFA[kind]; let cv;
  if (kind==='choc') cv=cfaCv(128,64,g=>{ g.fillStyle='#4f2a16'; g.fillRect(0,0,128,64); for (let r=0;r<2;r++) for (let c=0;c<4;c++){ g.fillStyle='#6e3d22'; roundRect(g,4+c*31,4+r*30,27,26,4); g.fill(); g.fillStyle='rgba(255,255,255,.14)'; g.fillRect(7+c*31,7+r*30,21,3); } });
  else if (kind==='berries'||kind==='cherries') cv=cfaCv(128,128,g=>{ const bl=kind==='berries'; g.fillStyle=bl?'#2c2470':'#7a0f22'; g.fillRect(0,0,128,128);
    for (let i=0;i<70;i++){ const x=Math.random()*128, y=Math.random()*128, r=bl?7+Math.random()*3:9+Math.random()*3; for (const ox of [-128,0,128]){ g.fillStyle=bl?['#4d45b8','#5d52cc','#3f37a0'][i%3]:['#d8143a','#e8284a','#c00f30'][i%3]; g.beginPath(); g.arc(x+ox,y,r,0,7); g.fill(); g.fillStyle='rgba(255,255,255,.3)'; g.beginPath(); g.arc(x+ox-r*.35,y-r*.35,r*.3,0,7); g.fill(); } } });
  else if (kind==='minty') cv=cfaCv(128,128,g=>{ g.fillStyle='#2f8a52'; g.fillRect(0,0,128,128); for (let i=0;i<60;i++){ g.save(); g.translate(Math.random()*128,Math.random()*128); g.rotate(Math.random()*6.3); g.fillStyle=['#5fd38d','#48c07a','#7fe0a5'][i%3]; g.beginPath(); g.ellipse(0,0,6,13,0,0,7); g.fill(); g.strokeStyle='rgba(20,70,40,.5)'; g.beginPath(); g.moveTo(0,-11); g.lineTo(0,11); g.stroke(); g.restore(); } });
  else if (kind==='wicker') cv=cfaCv(128,128,g=>{ g.fillStyle='#8a5e2c'; g.fillRect(0,0,128,128); for (let r=0;r<8;r++) for (let c=0;c<8;c++){ g.fillStyle=(r+c)%2?'#d6a660':'#c08d48'; roundRect(g,c*16+1,r*16+2,14,12,5); g.fill(); g.fillStyle='rgba(255,240,200,.25)'; g.fillRect(c*16+3,r*16+3,10,2); } });
  else if (kind==='gingham') cv=cfaCv(64,64,g=>{ g.fillStyle='#fff'; g.fillRect(0,0,64,64); g.fillStyle='rgba(220,40,60,.55)'; for (let i=0;i<4;i++){ g.fillRect(i*16,0,8,64); g.fillRect(0,i*16,64,8); } });
  else if (kind==='lemonIn') cv=cfaCv(128,128,g=>{ g.fillStyle='#ffd23f'; g.beginPath(); g.arc(64,64,63,0,7); g.fill(); g.fillStyle='#fff6c8'; g.beginPath(); g.arc(64,64,54,0,7); g.fill(); g.fillStyle='#ffe066'; for (let i=0;i<9;i++){ const a=i/9*6.283; g.beginPath(); g.moveTo(64+Math.cos(a+.06)*8,64+Math.sin(a+.06)*8); g.arc(64,64,49,a+.06,a+6.283/9-.06); g.closePath(); g.fill(); } });
  else if (kind==='crate') cv=cfaCv(128,128,g=>{ for (let i=0;i<4;i++){ const v=.9+Math.random()*.15; g.fillStyle=`rgb(${214*v|0},${170*v|0},${118*v|0})`; g.fillRect(0,i*32,128,30); g.fillStyle='rgba(90,55,25,.25)'; for (let k=0;k<8;k++) g.fillRect(0,i*32+Math.random()*30,128,1); } g.fillStyle='rgba(60,35,15,.5)'; for (let i=0;i<4;i++) g.fillRect(0,i*32+30,128,2); });
  else if (kind==='curtain') cv=cfaCv(128,256,g=>{ for (let x=0;x<128;x++){ const v=.86+.14*Math.sin(x/128*Math.PI*6); g.fillStyle=cfaShade('#f7b7c3',v); g.fillRect(x,0,1,256); } g.fillStyle='rgba(255,255,255,.5)'; for (let y=8;y<256;y+=22) for (let x=8;x<128;x+=22){ g.beginPath(); g.arc(x+(y/22%2)*11,y,2.4,0,7); g.fill(); } g.fillStyle='#e48a9c'; g.fillRect(0,240,128,16); });
  else if (kind==='logs') cv=cfaCv(256,128,g=>{ g.fillStyle='#24140c'; g.fillRect(0,0,256,128); for (let r=0;r<3;r++) for (let c=0;c<7;c++){ const x=22+c*36+(r%2)*18, y=104-r*32; g.fillStyle='#7a5232'; g.beginPath(); g.arc(x,y,15,0,7); g.fill(); g.fillStyle='#c79a62'; g.beginPath(); g.arc(x,y,11,0,7); g.fill(); g.strokeStyle='rgba(110,70,40,.6)'; g.lineWidth=1.5; for (let q=3;q<11;q+=3){ g.beginPath(); g.arc(x,y,q,0,7); g.stroke(); } } });
  else if (kind==='cake') cv=cfaCv(128,64,g=>{ g.fillStyle='#ffe2c4'; g.fillRect(0,0,128,64); g.fillStyle='#fff7f0'; g.fillRect(0,26,128,9); g.fillStyle='#ff9ab3'; g.fillRect(0,22,128,4); g.fillRect(0,0,128,8); for (let x=0;x<128;x+=16){ g.beginPath(); g.arc(x+8,8,8,0,Math.PI); g.fill(); } });
  CFA[kind]=cfaTex(cv,true); return CFA[kind]; }

/* ---------- 표지판 ---------- */
function cfaSignTex(kind){
  if (kind==='O'||kind==='X'){ const W=512, H=384, red=kind==='O', C=red?'#e5484d':'#22a35a';
    return cfaTex(cfaCv(W,H,g=>{ g.fillStyle='#fff8ec'; roundRect(g,6,6,W-12,H-12,40); g.fill(); g.lineWidth=14; g.strokeStyle=C; roundRect(g,10,10,W-20,H-20,36); g.stroke();
      g.fillStyle=C; g.beginPath(); g.arc(W/2,138,98,0,7); g.fill(); g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; g.font=cfaFont(150); g.fillText(kind,W/2,150);
      cfaIcon(g,red?'cherry':'mint',70,138,96); cfaIcon(g,red?'cherry':'mint',W-70,138,96);
      g.fillStyle='#3a2230'; g.font=cfaFont(60); g.fillText(red?'체리 = 맞아요':'민트 = 틀려요',W/2,306); })); }
  if (kind==='logo') return cfaTex(cfaCv(768,224,g=>{ g.fillStyle='#7a4a2a'; roundRect(g,4,4,760,216,40); g.fill(); g.strokeStyle='#f2c26b'; g.lineWidth=8; roundRect(g,18,18,732,188,30); g.stroke();
    g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#fff3dc'; g.font=cfaFont(104); g.fillText('달콤 카페',W2(768)+30,104); g.font=cfaFont(34,false); g.fillStyle='#f2c26b'; g.fillText('DESSERT CAFE',W2(768)+30,170); cfaIcon(g,'cake',110,112,120); }));
  if (kind==='pickup') return cfaTex(cfaCv(320,200,g=>{ g.fillStyle='#fff8ec'; roundRect(g,4,4,312,192,26); g.fill(); g.lineWidth=10; g.strokeStyle='#f2a516'; roundRect(g,8,8,304,184,22); g.stroke(); cfaIcon(g,'bell',80,104,96); g.fillStyle='#3a2230'; g.textAlign='center'; g.textBaseline='middle'; g.font=cfaFont(64); g.fillText('픽업',212,108); }));
  if (kind==='chalk') return cfaTex(cfaCv(512,416,g=>{ g.fillStyle='#8a5a34'; g.fillRect(0,0,512,416); g.fillStyle='#2f3d37'; g.fillRect(18,18,476,380);
    g.fillStyle='rgba(255,255,255,.05)'; for (let i=0;i<40;i++){ g.beginPath(); g.ellipse(Math.random()*512,Math.random()*416,40,10,Math.random()*3,0,7); g.fill(); }
    g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#fff6d8'; g.font=cfaFont(50); g.fillText('오늘의 디저트',256,70);
    g.strokeStyle='rgba(255,246,216,.7)'; g.lineWidth=3; g.beginPath(); g.moveTo(110,104); g.lineTo(402,104); g.stroke();
    const L=[['#ff9ab3','딸기 케이크'],['#d9a27a','초코 파르페'],['#ffe27a','레몬 타르트'],['#b9b0ff','블루베리 머핀']];
    g.font=cfaFont(38,false); L.forEach(([c,t],j)=>{ g.fillStyle=c; g.beginPath(); g.arc(120,150+j*58,10,0,7); g.fill(); g.fillStyle='#fff6d8'; g.textAlign='left'; g.fillText(t,148,152+j*58); });
    g.textAlign='center'; g.fillStyle='#ffd23f'; g.font=cfaFont(30); g.fillText('★ 정답 재료로 만들어요 ★',256,378); }));
  if (kind==='art1'||kind==='art2') return cfaTex(cfaCv(256,320,g=>{ g.fillStyle='#c8925a'; g.fillRect(0,0,256,320); g.fillStyle=kind==='art1'?'#ffe3ea':'#e3f3ff'; g.fillRect(16,16,224,288);
    if (kind==='art1') cfaIcon(g,'cake',128,170,170); else { cfaIcon(g,0,90,140,100); cfaIcon(g,2,170,200,100); } }));
}
const W2=w=>w/2;

/* ============================== 가게 짓기 ============================== */
function cfArt(root){
  const ST=new THREE.Group(); root.add(ST);
  const put=(geo,mat,x,y,z,rx,ry,rz,cast,par)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.rotation.set(rx||0,ry||0,rz||0); m.castShadow=cast!==false; m.receiveShadow=true; (par||ST).add(m); return m; };
  const B=(w,h,d,s)=>vlUVBox(new THREE.BoxGeometry(w,h,d),s||1);
  const box=(w,h,d,mat,x,y,z,ry,s,par)=>put(B(w,h,d,s),mat,x,y,z,0,ry||0,0,true,par);
  const cyl=(rt,rb,h,mat,x,y,z,seg,open,par)=>put(new THREE.CylinderGeometry(rt,rb,h,seg||16,1,!!open),mat,x,y,z,0,0,0,true,par);
  const sph=(r,mat,x,y,z,sx,sy,sz,seg,par)=>{ const s0=seg||10, m=put(new THREE.SphereGeometry(r,s0,Math.max(4,s0*.7|0)),mat,x,y,z,0,0,0,true,par); m.scale.set(sx||1,sy||1,sz||1); return m; };
  const plane=(w,h,mat,x,y,z,rx,ry,par)=>put(new THREE.PlaneGeometry(w,h),mat,x,y,z,rx||0,ry||0,0,false,par);
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const woodT=c=>{ const t=vlWoodTex(c); return t; };
  const M={
    floor:cfaMat({map:cfaFloorTex(),roughness:.6}),
    wallB:cfaMat({map:cfaBackWallTex(),roughness:.95}), wallL:cfaMat({map:cfaSideWallTex(true),roughness:.95}), wallR:cfaMat({map:cfaSideWallTex(false),roughness:.95}),
    outer:cfaMat({color:0xf3cfc6,roughness:.95}), cap:cfaMat({color:0xf3e9dc,roughness:.8}),
    cream:cfaMat({color:0xf6eee2,roughness:.72}), white:cfaMat({color:0xfbf8f2,roughness:.55}), mint:cfaMat({color:0x9fd4c0,roughness:.6}),
    marble:cfaMat({map:cfaMarbleTex(),roughness:.3}), oak:cfaMat({map:woodT('#c8925a'),roughness:.68}), walnut:cfaMat({map:woodT('#6e4528'),roughness:.66}),
    brass:cfaMat({color:0xd4a94e,metalness:.75,roughness:.32}), chrome:cfaMat({color:0xdfe5ea,metalness:.85,roughness:.22}), iron:cfaMat({color:0x2d2a2a,metalness:.45,roughness:.5}),
    glass:cfaMat({color:0xeaf7ff,transparent:true,opacity:.24,roughness:.05,metalness:.1,depthWrite:false}),
    brick:cfaMat({map:cfaBrickTex(),roughness:.95}), stone:cfaMat({color:0xe8ddcc,roughness:.9}), copper:cfaMat({color:0xc8794a,metalness:.65,roughness:.33}),
    terracotta:cfaMat({color:0xc96f4a,roughness:.85}), soil:cfaMat({color:0x4a3524,roughness:1}), leaf:cfaMat({color:0x5aa04a,roughness:.8}), leaf2:cfaMat({color:0x3f8a3c,roughness:.8}), leaf3:cfaMat({color:0x77b85a,roughness:.8}),
    straw:cfaMat({color:0xe8344e,roughness:.42}), strawLeaf:cfaMat({color:0x4caf50,roughness:.7}),
    choc:cfaMat({map:cfaSmallTex('choc'),roughness:.45}), chocDark:cfaMat({color:0x4a2716,roughness:.3}), chocMilk:cfaMat({color:0x7a4527,roughness:.35}),
    lemon:cfaMat({color:0xffd23f,roughness:.5}), lemonIn:cfaMat({map:cfaSmallTex('lemonIn'),roughness:.45}), lemonade:cfaMat({color:0xffe46b,transparent:true,opacity:.72,roughness:.1,depthWrite:false}),
    blue:cfaMat({color:0x4a42b4,roughness:.42}), blue2:cfaMat({color:0x6258d0,roughness:.42}), cherry:cfaMat({color:0xd8143a,roughness:.32}), stem:cfaMat({color:0x6b4a2a,roughness:.8}), mintLeaf:cfaMat({color:0x4cc47e,roughness:.6}),
    berriesC:cfaMat({map:cfaSmallTex('berries'),roughness:.4}), cherriesC:cfaMat({map:cfaSmallTex('cherries'),roughness:.4}), mintC:cfaMat({map:cfaSmallTex('minty'),roughness:.6}),
    wicker:cfaMat({map:cfaSmallTex('wicker'),roughness:.9}), gingham:cfaMat({map:cfaSmallTex('gingham'),roughness:.8}), crate:cfaMat({map:cfaSmallTex('crate'),roughness:.85}),
    jamPink:cfaMat({color:0xe0405e,roughness:.3}), jamBlue:cfaMat({color:0x3a2f8a,roughness:.3}), label:cfaMat({color:0xfff3dc,roughness:.8}),
    ceramic:cfaMat({color:0xfdfaf5,roughness:.35}), ceramicP:cfaMat({color:0xffc4d0,roughness:.35}), ceramicB:cfaMat({color:0xbfe0f5,roughness:.35}),
    cakeSide:cfaMat({map:cfaSmallTex('cake'),roughness:.6}), frost:cfaMat({color:0xfff5ec,roughness:.5}), frostP:cfaMat({color:0xff9ab3,roughness:.5}), sponge:cfaMat({color:0xf0c58a,roughness:.7}),
    fridge:cfaMat({color:0xa8dccb,roughness:.35}), pinkMetal:cfaMat({color:0xf5a3b5,roughness:.4,metalness:.1}), cushion:cfaMat({color:0xe98ba0,roughness:.9}),
    curtain:cfaMat({map:cfaSmallTex('curtain'),roughness:.95,side:THREE.DoubleSide}), dark:cfaMat({color:0x2a2420,roughness:.8}), gold:cfaMat({color:0xf0c14b,metalness:.8,roughness:.3}),
    bulb:cfaMat({color:0xfff2c4,emissive:0xffcf70,emissiveIntensity:1.5,roughness:.4}), shade:cfaMat({color:0xfff4dc,emissive:0xffd28a,emissiveIntensity:.9,roughness:.5}),
    view:cfaMat({map:cfaViewTex(),emissive:0xffffff,emissiveMap:cfaViewTex(),emissiveIntensity:.55,roughness:.9}),
  };
  M.cab=CF_SHELF.map((_,i)=>cfaMat({map:cfaCabTex(i,4.4),roughness:.62}));
  // 화면 뒤 깊이 값이 16비트라 가까운 면끼리 줄무늬로 깜빡여요 → 넓은 바닥 · 윗판은 살짝 뒤로, 붙여 그린 면(문짝 · 판 · 액자)은 살짝 앞으로
  const back=m=>Object.assign(m,{polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:4}), front=m=>Object.assign(m,{polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4});
  [M.floor,M.marble].forEach(back); [...M.cab,M.view].forEach(front);
  const decal=o=>front(cfaMat(o));
  M.awn=CF_SHELF.map((_,i)=>cfaMat({map:cfaStripeTex(i),roughness:.9,side:THREE.DoubleSide}));
  M.val=CF_SHELF.map((_,i)=>cfaMat({map:cfaValanceTex(i),roughness:.9,alphaTest:.5,side:THREE.DoubleSide}));
  const CT=1.02, CH=.92;   // 조리대 윗면 · 몸통 높이

  /* ----- 바닥 · 바깥 땅 ----- */
  { const f=put(new THREE.PlaneGeometry(25.2,25.2),M.floor,0,0,2.6,-Math.PI/2,0,0,false); f.receiveShadow=true;
    const gt=vlGrassDetail(); gt.repeat.set(60,60);
    const out=new THREE.Mesh(new THREE.PlaneGeometry(240,240),cfaMat({map:gt,color:0xb8d090,roughness:1,polygonOffset:true,polygonOffsetFactor:4,polygonOffsetUnits:16})); out.rotation.x=-Math.PI/2; out.position.y=-.06; out.receiveShadow=true; out.renderOrder=-2; root.add(out);
    const path=new THREE.Mesh(new THREE.PlaneGeometry(2.0,3.4),cfaMat({color:0xd8c8ae,roughness:.95,polygonOffset:true,polygonOffsetFactor:2,polygonOffsetUnits:8})); path.rotation.x=-Math.PI/2; path.position.set(10.8,-.03,-11.6); path.receiveShadow=true; path.renderOrder=-1; root.add(path); }

  /* ----- 벽 (안쪽 면은 그림 텍스처, 바깥은 분홍 회벽) ----- */
  { const H=6.2, X0=-12.4, X1=12.4, D=CF_DOORX;
    const s=new THREE.Shape(); s.moveTo(X0,0); s.lineTo(D.x0,0); s.lineTo(D.x0,D.h); s.lineTo(D.x1,D.h); s.lineTo(D.x1,0); s.lineTo(X1,0); s.lineTo(X1,H); s.lineTo(X0,H); s.closePath();
    const bw=new THREE.ShapeGeometry(s); M.wallB.map.repeat.set(1/24.8,1/H); M.wallB.map.offset.set(.5,0);
    put(bw,M.wallB,0,0,-9.8,0,0,0,false);
    const side=(left)=>{ const g=new THREE.PlaneGeometry(19.8,H), m=put(g,left?M.wallL:M.wallR,left?X0:X1,H/2,.1,0,left?Math.PI/2:-Math.PI/2,0,false); };
    side(true); side(false);
    for (const x of [-12.6,12.6]) box(.56,.14,20.3,M.cap,x,H+.07,.1).castShadow=false;
    box(25.8,.14,.56,M.cap,0,H+.07,-10.0).castShadow=false;
    // 문틀 · 문 위 간판 · 종
    box(.14,D.h+.1,.5,M.mint,D.x0-.07,(D.h+.1)/2,-9.95); box(.14,D.h+.1,.5,M.mint,D.x1+.07,(D.h+.1)/2,-9.95); box(D.x1-D.x0+.42,.16,.5,M.mint,(D.x0+D.x1)/2,D.h+.08,-9.95);
    box(2.6,.82,.07,M.walnut,(D.x0+D.x1)/2,3.86,-9.76);
    put(new THREE.PlaneGeometry(2.5,.73),front(cfaMat({map:cfaSignTex('logo'),roughness:.7})),(D.x0+D.x1)/2,3.86,-9.72,0,0,0,false);
    box(.06,.3,.06,M.brass,D.x1-.25,3.0,-9.62); sph(.1,M.gold,D.x1-.25,2.8,-9.62,1,1.1,1,12);
    // 벽등
    for (const [x,z,r] of [[12.33,-9.0,-Math.PI/2],[12.33,.9,-Math.PI/2],[-12.33,-1.15,Math.PI/2]]){ const g=new THREE.Group(); g.position.set(x,3.55,z); g.rotation.y=r; ST.add(g);
      put(new THREE.CylinderGeometry(.13,.13,.05,16),M.brass,0,0,0,Math.PI/2,0,0,true,g); put(new THREE.CylinderGeometry(.025,.025,.3,6),M.brass,0,.02,.15,Math.PI/2,0,0,true,g);
      put(new THREE.CylinderGeometry(.13,.22,.28,16,1,true),M.shade,0,.12,.3,0,0,0,true,g); cfaHalo(root,x+Math.sin(r)*.3,3.6,z+Math.cos(r)*.3,1.5); }
  }

  /* ----- 재료 가판대 4곳 (뒤쪽 벽을 따라 이어진 조리대) ----- */
  const SZ0=-9.8, SZ1=-8.45, SCZ=(SZ0+SZ1)/2;
  box(17.6,CH,SZ1-SZ0,M.cream,0,CH/2,SCZ);
  box(17.72,.1,SZ1-SZ0+.1,M.marble,0,CH+.05,SCZ+.03,0,1.6);
  CF_SHELF.forEach((s,i)=>plane(4.4,CH,M.cab[i],s.x,CH/2,SZ1+.006));
  for (const x of [-8.8,-4.4,0,4.4,8.8]) box(.14,4.4,.14,M.white,x,CT+2.2,-8.88);
  CF_SHELF.forEach((s,i)=>{
    put(new THREE.PlaneGeometry(4.4,1.2),M.awn[i],s.x,5.8,-9.35,-.844,0,0);
    put(new THREE.PlaneGeometry(4.4,.41),M.val[i],s.x,5.2,-8.9,0,0,0,false);
    for (let k=0;k<12;k++) sph(.045,M.bulb,s.x-2.0+k*.364,5.38,-8.86,1,1,1,6).castShadow=false;
  });
  // 위에 매달린 주문 판의 나무 틀 (판 자체는 04c가 주문마다 그려요)
  CF_SHELF.forEach((s,i)=>{ const n=CF_BOARD, ny=Math.sin(n.tilt), nz=Math.cos(n.tilt);
    put(new THREE.BoxGeometry(n.w+.24,n.h+.24,.07),M.walnut,s.x,n.y-ny*.045,n.z-nz*.045,-n.tilt,0,0);
    const top=[n.y+(n.h/2+.12)*nz,n.z-(n.h/2+.12)*ny];
    for (const dx of [-1.35,1.35]) box(.04,5.2-top[0]+.05,.04,M.brass,s.x+dx,(5.2+top[0])/2,top[1]-.02);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(n.w,n.h),front(new THREE.MeshBasicMaterial({map:cfaBoardIdleTex(i),toneMapped:false})));
    face.position.set(s.x,n.y,n.z); face.rotation.x=-n.tilt; root.add(face); });
  // 가판대 위 재료
  const gStraw=new THREE.LatheGeometry([[0,-.1],[.042,-.086],[.068,-.042],[.076,.008],[.067,.048],[.036,.07],[0,.072]].map(p=>new THREE.Vector2(p[0],p[1])),9);
  const gCalyx=new THREE.ConeGeometry(.058,.03,5), gBlue=new THREE.SphereGeometry(.045,7,5), gLemon=new THREE.SphereGeometry(.105,12,8), gCherry=new THREE.SphereGeometry(.062,9,7);
  const berry=(x,y,z,s,tilt)=>{ s=s||1; const rx=tilt?rnd(-tilt,tilt):0, rz=tilt?rnd(-tilt,tilt):0, ry=rnd(0,6.3);
    put(gStraw,M.straw,x,y+.1*s,z,rx,ry,rz).scale.setScalar(s); put(gCalyx,M.strawLeaf,x,y+.18*s,z,rx,ry,rz).scale.setScalar(s); };
  const lemon=(x,y,z,ry)=>{ const m=put(gLemon,M.lemon,x,y+.1,z,0,ry==null?rnd(0,6.3):ry,0); m.scale.set(1.3,1,1); };
  const blue=(x,y,z)=>put(gBlue,Math.random()<.5?M.blue:M.blue2,x,y+.04,z);
  const bowl=(x,z,r,mat)=>{ const pts=[[0,0],[r*.55,0],[r*.8,r*.18],[r*.96,r*.42],[r,r*.5],[r*.92,r*.5],[r*.86,r*.4],[r*.72,r*.2],[0,r*.12]].map(p=>new THREE.Vector2(p[0],p[1])); put(new THREE.LatheGeometry(pts,20),mat,x,CT,z); };
  const jar=(x,z,r,h,content,lid,lidMat)=>{ put(vlUVScale(new THREE.CylinderGeometry(r*.94,r*.94,h*.86,16),Math.max(1,r*12),Math.max(1,h*3)),content,x,CT+h*.43,z); cyl(r,r,h,M.glass,x,CT+h/2,z,18,true).castShadow=false;
    if (lid) cyl(r*1.04,r*1.04,h*.12,lidMat||M.brass,x,CT+h+h*.05,z,18); };
  // 1 딸기: 나무 상자 · 그릇 · 딸기잼
  { const x=CF_SHELF[0].x, z=-9.15;
    { const cx=x-1.25; box(.92,.05,.62,M.crate,cx,CT+.025,z); for (const [w,d,ox,oz] of [[.92,.04,0,.29],[.92,.04,0,-.29],[.04,.62,.44,0],[.04,.62,-.44,0]]) box(w,.26,d,M.crate,cx+ox,CT+.13,z+oz);
      for (let a=0;a<5;a++) for (let b=0;b<3;b++) berry(cx-.34+a*.17+rnd(-.02,.02),CT+.09+rnd(0,.05),z-.18+b*.18+rnd(-.02,.02),1,.5);
      for (let n=0;n<5;n++) berry(cx+rnd(-.3,.3),CT+.2,z+rnd(-.15,.15),1,.6); }
    bowl(x+.05,z+.05,.36,M.ceramicP);
    for (let n=0;n<14;n++){ const a=n*2.4, r=n<8?.2:.09; berry(x+.05+Math.cos(a)*r,CT+.1+(n<8?0:.07),z+.05+Math.sin(a)*r,1.05,.4); }
    jar(x+1.05,z-.12,.13,.24,M.jamPink,true,M.gingham); jar(x+1.36,z+.05,.1,.18,M.jamPink,true,M.gingham);
    berry(x+1.2,CT-.01,z+.35,1,.3); berry(x+.95,CT-.01,z+.42,.95,.3); }
  // 2 초콜릿: 판 초콜릿 · 녹인 초콜릿 냄비 · 초콜릿 분수
  { const x=CF_SHELF[1].x, z=-9.12, gBar=new THREE.BoxGeometry(.46,.05,.23);
    for (let l=0;l<4;l++) for (let k=0;k<2;k++){ const m=put(gBar,M.choc,x-1.25+(l%2?0:(k-.5)*.25),CT+.025+l*.05,z+(l%2?(k-.5)*.25:0),0,l%2?Math.PI/2:0,0); }
    cyl(.31,.27,.3,M.copper,x,CT+.15,z,22,true); cyl(.27,.27,.02,M.copper,x,CT+.01,z,22); cyl(.29,.29,.02,M.chocMilk,x,CT+.25,z,22);
    box(.36,.04,.06,M.copper,x+.44,CT+.24,z); put(new THREE.CylinderGeometry(.018,.018,.62,6),M.oak,x+.08,CT+.42,z+.02,0,0,-.5); sph(.05,M.oak,x-.06,CT+.2,z+.02,1,.5,1.4,8);
    { const fx=x+1.18, fz=z-.05, T=[[.32,.24],[.22,.5],[.13,.72]]; cyl(.24,.28,.1,M.chrome,fx,CT+.05,fz,20); cyl(.04,.04,.78,M.chrome,fx,CT+.47,fz,8);
      T.forEach(([r,y],j)=>{ const below=j?T[j-1][1]:.1; cyl(r,r*.8,.06,M.chrome,fx,CT+y,fz,20); cyl(r*.95,r*.95,.015,M.chocDark,fx,CT+y+.03,fz,20);
        cyl(r*.97,r*.97,y-below-.03,M.chocDark,fx,CT+(y+below)/2,fz,20,true).castShadow=false; }); }
    for (let n=0;n<5;n++) sph(.055,M.chocDark,x-.5+n*.13,CT+.05,z+.42,1,.9,1,8); box(.78,.03,.24,M.ceramic,x-.24,CT+.015,z+.42); }
  // 3 레몬: 바구니 · 레모네이드 · 도마
  { const x=CF_SHELF[2].x, z=-9.12;
    cyl(.33,.27,.24,M.wicker,x-1.2,CT+.12,z,18,true); cyl(.27,.27,.02,M.wicker,x-1.2,CT+.01,z,18);
    put(new THREE.TorusGeometry(.3,.025,6,18,Math.PI),M.wicker,x-1.2,CT+.24,z);
    for (let n=0;n<8;n++){ const a=n*2.3, r=n<6?.15:.03; lemon(x-1.2+Math.cos(a)*r,CT+.14+(n<6?0:.1),z+Math.sin(a)*r); }
    cyl(.17,.17,.46,M.glass,x+.02,CT+.23,z-.1,18,true).castShadow=false; cyl(.155,.155,.36,M.lemonade,x+.02,CT+.18,z-.1,18).castShadow=false;
    put(new THREE.TorusGeometry(.1,.022,6,12,Math.PI),M.glass,x+.2,CT+.27,z-.1,0,0,-Math.PI/2).castShadow=false;
    put(new THREE.CylinderGeometry(.07,.07,.012,14),M.lemonIn,x-.02,CT+.37,z-.12,.3,0,.2);
    box(.58,.04,.38,M.oak,x+1.18,CT+.02,z+.02,.12);
    for (const [ox,oz,r] of [[-.12,-.03,.2],[.1,.06,-.4]]){ const m=put(new THREE.SphereGeometry(.1,12,8,0,Math.PI*2,0,Math.PI/2),M.lemon,x+1.18+ox,CT+.14,z+oz,Math.PI,r,0); m.scale.set(1.25,1,1);
      put(new THREE.CircleGeometry(.1,16),M.lemonIn,x+1.18+ox,CT+.142,z+oz,-Math.PI/2,0,-r).scale.set(1.25,1,1); }
    lemon(x+1.5,CT-.0,z-.25,.4); lemon(x+.8,CT,z+.36,1.2); }
  // 4 블루베리: 유리병 · 그릇 · 잼
  { const x=CF_SHELF[3].x, z=-9.12;
    jar(x-1.32,z-.18,.16,.42,M.berriesC,true,M.brass); jar(x-.95,z+.12,.13,.3,M.berriesC,true,M.gingham); jar(x-1.6,z+.2,.11,.24,M.berriesC,true,M.brass);
    bowl(x+.08,z+.04,.34,M.ceramicB); for (let n=0;n<34;n++){ const a=n*2.39996, r=Math.sqrt(n/34)*.26; blue(x+.08+Math.cos(a)*r,CT+.1+(.26-r)*.35,z+.04+Math.sin(a)*r); }
    jar(x+1.12,z-.08,.13,.26,M.jamBlue,true,M.gingham); jar(x+1.42,z+.12,.1,.2,M.jamBlue,true,M.gingham);
    for (let n=0;n<7;n++) blue(x+.75+rnd(-.12,.12),CT-.005,z+.38+rnd(-.06,.06)); }

  /* ----- 구석 벽돌 오븐 ----- */
  let glow=null, halo=null;
  { const O=CF_OVEN_C, yaw=Math.atan2(CF_OVEN.x-O.x,CF_OVEN.z-O.z), g=new THREE.Group(); g.position.set(O.x,0,O.z); g.rotation.y=yaw; ST.add(g);
    const P2=(geo,mat,x,y,z,rx,ry,rz)=>put(geo,mat,x,y,z,rx,ry,rz,true,g);
    P2(vlUVScale(new THREE.CylinderGeometry(1.78,1.86,.95,30),7,.95),M.brick,0,.475,0);
    P2(new THREE.CylinderGeometry(1.9,1.9,.09,30),M.stone,0,.995,0);
    P2(vlUVScale(new THREE.SphereGeometry(O.r,30,12,0,Math.PI*2,0,Math.PI/2),7,2.2),M.brick,0,1.04,0).scale.y=.95;
    const sh=new THREE.Shape(); sh.moveTo(-.98,0); sh.lineTo(.98,0); sh.lineTo(.98,1.08); sh.absarc(0,1.08,.98,0,Math.PI,false); sh.lineTo(-.98,0);
    const hole=new THREE.Path(); hole.moveTo(-.52,.1); hole.lineTo(.52,.1); hole.lineTo(.52,.58); hole.absarc(0,.58,.52,0,Math.PI,false); hole.lineTo(-.52,.1); sh.holes.push(hole);
    const fg=vlUVScale(new THREE.ExtrudeGeometry(sh,{depth:.34,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:2,curveSegments:18}),.85);
    P2(fg,M.brick,0,1.03,1.6);
    P2(new THREE.TorusGeometry(.6,.075,6,20,Math.PI),M.stone,0,1.61,2.02); for (const sx of [-.6,.6]) P2(B(.15,.5,.12),M.stone,sx,1.37,2.02);
    P2(B(.36,.16,.14),M.stone,0,2.26,2.02);
    P2(new THREE.PlaneGeometry(1.1,1.16),cfaMat({color:0x1a0f0a,roughness:1}),0,1.6,1.63);
    glow=new THREE.Mesh(new THREE.PlaneGeometry(1.06,1.12),front(cfaMat({color:0x000000,emissive:0xffffff,emissiveMap:cfaFireTex(),emissiveIntensity:.9,roughness:1})));
    glow.position.set(0,1.61,1.67); glow.userData.keep=true; g.add(glow);
    P2(new THREE.PlaneGeometry(1.3,.62),front(cfaMat({map:cfaSmallTex('logs'),roughness:1})),0,.42,1.85);
    P2(B(1.42,.08,.1),M.stone,0,.76,1.85);
    P2(new THREE.CylinderGeometry(.25,.25,4.3,16),M.copper,-.2,4.25,-.55); for (const y of [2.6,4.3,5.9]) P2(new THREE.CylinderGeometry(.29,.29,.07,16),M.copper,-.2,y,-.55);
    P2(new THREE.CylinderGeometry(.03,.03,1.7,6),M.oak,1.55,1.02,1.18,0,0,.18); P2(B(.42,.025,.5),M.oak,1.7,.21,1.2,0,0,Math.PI/2-.18);
    halo=new THREE.Sprite(new THREE.SpriteMaterial({map:vlGlowTex(),color:0xffa050,transparent:true,opacity:.4,depthWrite:false,blending:THREE.AdditiveBlending}));
    const hp=new THREE.Vector3(0,1.6,2.2).applyAxisAngle(new THREE.Vector3(0,1,0),yaw); halo.position.set(O.x+hp.x,hp.y,O.z+hp.z); halo.scale.setScalar(2.6); root.add(halo);
    // 밀가루 포대 · 장작
    const sack=cfaMat({color:0xefe6d4,roughness:.95}); sph(.3,sack,-12.0,.32,-6.45,1,1.15,.85,12); sph(.2,sack,-12.02,.78,-6.42,1.1,.9,.9,12); }

  /* ----- 냉장고 (왼쪽 벽) ----- */
  { const fx=-11.8, fz=-5.15;
    box(1.2,1.95,1.7,M.fridge,fx,.975,fz); put(new THREE.CylinderGeometry(.6,.6,1.7,22,1,false,-Math.PI/2,Math.PI),M.fridge,fx,1.95,fz,-Math.PI/2,0,0);
    box(.02,.03,1.6,M.dark,-11.19,1.42,fz); for (const [y,h] of [[1.85,.5],[.85,.7]]) box(.06,h,.06,M.chrome,-11.15,y,fz+.62);
    box(.03,.12,.42,M.chrome,-11.19,2.3,fz); for (const [y,z,c] of [[1.15,-.35,0xff8fb0],[.75,-.1,0xffd84a],[1.0,.2,0x9fd8ff]]) box(.02,.16,.16,cfaMat({color:c,roughness:.6}),-11.18,y,fz+z); }

  /* ----- 토핑대 (왼쪽 벽: O 체리 · X 민트) ----- */
  { const x0=-12.4, x1=-10.66, z0=-4.25, z1=2.6, cx=(x0+x1)/2, cz=(z0+z1)/2;
    box(x1-x0,CH,z1-z0,M.cream,cx,CH/2,cz);
    plane(z1-z0,CH,decal({map:cfaCabTex(-1,z1-z0),roughness:.62}),x1+.006,CH/2,cz,0,Math.PI/2);
    box(x1-x0+.1,.1,z1-z0+.1,M.marble,cx-.02,CH+.05,cz,0,1.6);
    CF_OX.forEach((o,i)=>{ const jx=-11.72, r=.4, h=.8;
      put(vlUVScale(new THREE.CylinderGeometry(r*.93,r*.93,h*.84,18),5,2),i?M.mintC:M.cherriesC,jx,CT+h*.42,o.z); cyl(r,r,h,M.glass,jx,CT+h/2,o.z,20,true).castShadow=false;
      cyl(r*1.06,r*1.06,.1,i?cfaMat({color:0x36a862,roughness:.5}):cfaMat({color:0xe5484d,roughness:.5}),jx,CT+h+.05,o.z,20); cyl(.06,.06,.08,M.brass,jx,CT+h+.14,o.z,10);
      box(.04,.75,.04,M.brass,-11.02,CT+.37,o.z); cyl(.09,.11,.04,M.brass,-11.02,CT+.02,o.z,12);
      const sg=new THREE.Mesh(new THREE.PlaneGeometry(1.36,1.02),new THREE.MeshBasicMaterial({map:cfaSignTex(i?'X':'O'),toneMapped:false}));
      sg.position.set(-11.02,CT+1.26,o.z); sg.lookAt(CF_CAM.x,CF_CAM.y,CF_CAM.z); root.add(sg);
      if (!i){ bowl(-11.15,o.z+.72,.2,M.ceramicP); for (let n=0;n<5;n++) put(gCherry,M.cherry,-11.15+Math.cos(n*1.3)*.08,CT+.1,o.z+.72+Math.sin(n*1.3)*.08); }
      else { bowl(-11.15,o.z-.72,.2,M.ceramic); for (let n=0;n<6;n++) sph(.06,M.mintLeaf,-11.15+Math.cos(n)*.09,CT+.1,o.z-.72+Math.sin(n)*.09,1,.3,1.6,6).rotation.y=n; } });
    [[-4.0,0xff8fb0],[-1.95,0xffd84a],[-1.55,0x9fd8ff],[.6,0xffffff],[1.0,0xc77dff],[1.4,0xff8f5a]].forEach(([z,c])=>{ cyl(.1,.1,.24,cfaMat({color:c,roughness:.5}),-12.12,CT+.12,z,12); cyl(.1,.1,.24,M.glass,-12.12,CT+.12,z,12,true).castShadow=false; cyl(.105,.105,.05,M.chrome,-12.12,CT+.265,z,12); });
    for (let n=0;n<4;n++) cyl(.2-n*.012,.15-n*.012,.07,M.ceramic,-11.3,CT+.035+n*.07,-1.6,16);
    { const cz2=1.75; cyl(.22,.22,.04,M.chrome,-11.25,CT+.02,cz2,18); cyl(.05,.05,.14,M.chrome,-11.25,CT+.11,cz2,8); cyl(.26,.26,.03,M.chrome,-11.25,CT+.19,cz2,20);
      put(new THREE.CylinderGeometry(.22,.22,.22,20),M.cakeSide,-11.25,CT+.32,cz2); cyl(.225,.225,.03,M.frostP,-11.25,CT+.44,cz2,20);
      for (let n=0;n<6;n++) put(gCherry,M.cherry,-11.25+Math.cos(n*1.05)*.15,CT+.48,cz2+Math.sin(n*1.05)*.15); } }

  /* ----- 픽업 카운터 (L자: 진열장 · 종 · 계산대) ----- */
  { box(1.8,CH,6.9,M.cream,6.3,CH/2,-.85); box(1.92,.1,7.0,M.marble,6.3,CH+.05,-.86,0,1.6);
    plane(6.9,CH,decal({map:cfaCabTex(-1,6.9),roughness:.62}),5.394,CH/2,-.85,0,-Math.PI/2);
    box(1.7,CH,1.8,M.cream,8.05,CH/2,-3.4); box(1.82,.1,1.92,M.marble,8.06,CH+.05,-3.4,0,1.6);
    plane(1.7,CH,decal({map:cfaCabTex(-2,1.7),roughness:.62}),8.05,CH/2,-2.494);
    // 진열장
    { const cx=8.05, cz=-3.4, w=1.56, d=1.66, h=.82, y0=CT;
      box(w,.04,d,M.walnut,cx,y0+.02,cz);
      for (const sz of [-1,1]) box(w+.05,.05,.05,M.walnut,cx,y0+h,cz+sz*d/2); for (const sx of [-1,1]) box(.05,.05,d+.05,M.walnut,cx+sx*w/2,y0+h,cz);
      for (const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]) box(.04,h,.04,M.walnut,cx+sx*w/2,y0+h/2,cz+sz*d/2);
      box(w,h,d,M.glass,cx,y0+h/2,cz).castShadow=false; plane(w-.06,d-.06,M.glass,cx,y0+.42,cz,-Math.PI/2);
      const cake=(x,y,z,r,hh,top)=>{ put(new THREE.CylinderGeometry(r,r,hh,18),M.cakeSide,x,y+hh/2,z); cyl(r*1.01,r*1.01,.025,top,x,y+hh,z,18); put(gCherry,M.cherry,x,y+hh+.06,z).scale.setScalar(.8); cyl(r+.04,r+.04,.015,M.ceramic,x,y+.008,z,18); };
      cake(cx-.38,y0+.04,cz-.35,.2,.2,M.frostP); cake(cx+.36,y0+.04,cz-.38,.17,.18,M.frost);
      put(new THREE.CylinderGeometry(.19,.19,.18,16,1,false,0,Math.PI*1.6),M.chocMilk,cx-.1,y0+.13,cz+.38); cyl(.2,.2,.02,M.chocDark,cx-.1,y0+.23,cz+.38,16);
      for (const [ox,oz,m] of [[-.4,-.3,M.blue2],[0,-.4,M.lemon],[.4,-.3,M.straw]]){ cyl(.12,.09,.12,M.sponge,cx+ox,y0+.48,cz+oz,12); sph(.12,m,cx+ox,y0+.56,cz+oz,1,.6,1,10); }
      for (const ox of [-.42,0,.42]){ cyl(.15,.15,.08,M.lemon,cx+ox,y0+.46,cz+.32,14); cyl(.16,.16,.02,M.sponge,cx+ox,y0+.43,cz+.32,14); } }
    // 서빙 종 · 픽업 표지 · 팁 병 · 계산대 · 꽃병 · 케이크 돔
    { const z=CF_SERVE.z; cyl(.13,.13,.04,M.walnut,5.95,CT+.02,z,16); put(new THREE.SphereGeometry(.11,16,8,0,Math.PI*2,0,Math.PI/2),M.gold,5.95,CT+.04,z); sph(.025,M.gold,5.95,CT+.16,z,1,1,1,8);
      box(.04,.36,.04,M.brass,6.15,CT+.18,z+.45);
      const pk=new THREE.Mesh(new THREE.PlaneGeometry(.62,.39),new THREE.MeshBasicMaterial({map:cfaSignTex('pickup'),toneMapped:false})); pk.position.set(6.15,CT+.5,z+.45); pk.lookAt(CF_CAM.x,CF_CAM.y,CF_CAM.z); root.add(pk); }
    cyl(.1,.1,.2,M.glass,6.0,CT+.1,.45,14,true).castShadow=false; for (let n=0;n<5;n++) cyl(.06,.06,.012,M.gold,6.0+rnd(-.03,.03),CT+.01+n*.014,.45+rnd(-.03,.03),10);
    { const rx=6.45, rz=1.35; box(.8,.26,.6,M.pinkMetal,rx,CT+.13,rz); put(B(.66,.3,.36),M.pinkMetal,rx-.04,CT+.38,rz,0,0,.35); box(.5,.02,.3,M.dark,rx-.12,CT+.47,rz).rotation.z=.35;
      box(.08,.22,.08,M.pinkMetal,rx+.25,CT+.6,rz); box(.34,.16,.05,M.dark,rx+.25,CT+.74,rz); box(.82,.06,.5,M.cream,rx,CT+.03,rz); }
    { cyl(.07,.09,.26,M.ceramicB,6.55,CT+.13,-2.7,12); for (let n=0;n<6;n++) sph(.07,n%2?M.frostP:M.white,6.55+Math.cos(n)*.08,CT+.38+(n%3)*.05,-2.7+Math.sin(n)*.08,1,1,1,8); for (let n=0;n<4;n++) sph(.06,M.leaf,6.55+Math.cos(n*1.6)*.11,CT+.3,-2.7+Math.sin(n*1.6)*.11,1.4,.5,.8,6); }
    { const x=6.45, z=-1.85; cyl(.04,.06,.24,M.ceramic,x,CT+.12,z,10); cyl(.28,.28,.03,M.ceramic,x,CT+.25,z,22);
      put(new THREE.CylinderGeometry(.2,.2,.2,20),M.cakeSide,x,CT+.37,z); cyl(.205,.205,.03,M.frost,x,CT+.48,z,20); for (let n=0;n<5;n++) berry(x+Math.cos(n*1.26)*.12,CT+.39,z+Math.sin(n*1.26)*.12,.8);
      put(new THREE.SphereGeometry(.3,18,10,0,Math.PI*2,0,Math.PI/2),M.glass,x,CT+.265,z).castShadow=false; sph(.04,M.chrome,x,CT+.58,z,1,1,1,8); } }

  /* ----- 앞쪽 진열 카운터 (부엌 앞) ----- */
  { box(19.6,CH,1.2,M.cream,-2.6,CH/2,3.2); box(19.72,.1,1.32,M.oak,-2.6,CH+.05,3.2,0,2);
    plane(19.6,CH,decal({map:cfaCabTex(-3,19.6),roughness:.62}),-2.6,CH/2,3.806);
    { const x=-9.7, z=3.15; cyl(.05,.07,.22,M.chrome,x,CT+.11,z,10); cyl(.3,.3,.03,M.chrome,x,CT+.23,z,22); put(new THREE.CylinderGeometry(.22,.22,.24,20),M.cakeSide,x,CT+.36,z); cyl(.225,.225,.04,M.chocMilk,x,CT+.5,z,20);
      put(new THREE.SphereGeometry(.32,18,10,0,Math.PI*2,0,Math.PI/2),M.glass,x,CT+.25,z).castShadow=false; }
    { const x=-8.6, z=3.2; cyl(.17,.17,.3,M.glass,x,CT+.15,z,16,true).castShadow=false; for (let n=0;n<8;n++) cyl(.07,.07,.025,M.sponge,x+rnd(-.06,.06),CT+.02+n*.034,z+rnd(-.06,.06),10); cyl(.18,.18,.05,M.ceramicP,x,CT+.32,z,16); }
    plant(-11.7,3.2,.55,CT);
    { const x=-6.4, z=3.15; for (const [r,y] of [[.34,.02],[.25,.36],[.16,.66]]){ cyl(r,r,.02,M.ceramic,x,CT+y,z,20); cyl(.02,.02,.34,M.chrome,x,CT+y+.17,z,6); }
      [[.34,.02,6],[.25,.36,4]].forEach(([r,y,n])=>{ for (let k=0;k<n;k++){ const a=k/n*6.283, cx=x+Math.cos(a)*r*.62, cz=z+Math.sin(a)*r*.62; cyl(.07,.055,.08,M.sponge,cx,CT+y+.06,cz,10); sph(.075,[M.frostP,M.white,M.lemon,M.blue2][k%4],cx,CT+y+.12,cz,1,.75,1,8); } });
      sph(.09,M.frostP,x,CT+.72,z,1,.9,1,10); put(gCherry,M.cherry,x,CT+.8,z); }
    { const x=-2.4, z=3.15; cyl(.36,.3,.16,M.wicker,x,CT+.08,z,16,true); cyl(.3,.3,.02,M.wicker,x,CT+.01,z,16);
      for (let k=0;k<5;k++){ const m=put(new THREE.TorusGeometry(.09,.055,6,10,Math.PI*1.2),cfaMat({color:0xe0a050,roughness:.7}),x+Math.cos(k*1.26)*.16,CT+.17,z+Math.sin(k*1.26)*.14,Math.PI/2,0,k); m.scale.set(1.3,1,1); } }
    { const x=1.6, z=3.15; cyl(.32,.32,.02,M.ceramic,x,CT+.01,z,22);
      [0xff9ab3,0xfff0a0,0xb9b0ff,0xa8e6c8,0xffc89a,0xff9ab3,0xb9b0ff].forEach((c,k)=>{ const a=k*.9, r=k?.18:0, mm=cfaMat({color:c,roughness:.55}); cyl(.07,.07,.035,mm,x+Math.cos(a)*r,CT+.04,z+Math.sin(a)*r,12); cyl(.06,.06,.02,M.white,x+Math.cos(a)*r,CT+.065,z+Math.sin(a)*r,12); cyl(.07,.07,.035,mm,x+Math.cos(a)*r,CT+.09,z+Math.sin(a)*r,12); }); }
    { const x=4.4, z=3.2; box(.5,.32,.4,cfaMat({color:0xffc4d0,roughness:.6}),x,CT+.16,z); box(.52,.04,.42,M.white,x,CT+.33,z); box(.42,.28,.36,cfaMat({color:0xbfe3d4,roughness:.6}),x-.06,CT+.49,z+.02,.3); box(.44,.035,.38,M.white,x-.06,CT+.645,z+.02,.3); } }

  /* ----- 손님 쪽 칸막이 (화분 + 판벽) ----- */
  { box(.36,1.15,5.5,M.mint,9.02,.575,-7.05); box(.46,.07,5.6,M.oak,9.02,1.185,-7.05);
    box(.34,.22,5.3,M.walnut,9.02,1.33,-7.05); for (let n=0;n<14;n++) sph(rnd(.17,.24),[M.leaf,M.leaf2,M.leaf3][n%3],9.02+rnd(-.08,.08),1.5+rnd(0,.08),-9.5+n*.37,1,.85,1.1,8);
    for (let n=0;n<7;n++) sph(.06,[M.frostP,M.white,M.lemon][n%3],9.02+rnd(-.1,.1),1.66,-9.3+n*.72,1,1,1,6); }

  /* ----- 손님 쪽: 대기 의자 · 창문 · 칠판 · 탁자 · 화분 · 옷걸이 ----- */
  { const bx=11.95, bz=-6.6; box(.62,.08,3.4,M.oak,bx,.48,bz); box(.52,.1,3.2,M.cushion,bx,.57,bz);
    for (const [dx,dz] of [[-.25,-1.6],[.25,-1.6],[-.25,1.6],[.25,1.6]]) box(.07,.44,.07,M.walnut,bx+dx,.22,bz+dz);
    box(.08,.62,3.4,M.oak,12.3,.95,bz);
    // 창문 (오른쪽 벽)
    const wz=-6.6, wy=3.05, ww=2.8, wh=2.5;
    plane(ww,wh,M.view,12.385,wy,wz,0,-Math.PI/2);
    for (const [w,h,dy,dz] of [[.14,wh+.28,0,ww/2+.07],[.14,wh+.28,0,-ww/2-.07],[.14,.14,wh/2+.07,0],[.14,.14,-wh/2-.07,0]]) box(.12,h,w===.14&&h===.14?ww+.28:w,M.white,12.33,wy+dy,wz+dz);
    box(.1,wh,.07,M.white,12.34,wy,wz); box(.1,.07,ww,M.white,12.34,wy,wz); box(.32,.07,ww+.5,M.white,12.25,wy-wh/2-.18,wz);
    for (const sz of [-1,1]) put(new THREE.PlaneGeometry(.75,3.1),M.curtain,12.22,wy-.1,wz+sz*(ww/2+.2),0,-Math.PI/2,0,true);
    cyl(.03,.03,ww+1.4,M.brass,12.24,wy+wh/2+.34,wz,8).rotation.x=Math.PI/2;
    for (const sz of [-1,1]) sph(.05,M.brass,12.24,wy+wh/2+.34,wz+sz*(ww/2+.72),1,1,1,8);
    // 칠판 메뉴
    box(.06,1.75,2.15,M.walnut,12.36,2.55,-2.0); plane(2.0,1.62,decal({map:cfaSignTex('chalk'),roughness:.9}),12.325,2.55,-2.0,0,-Math.PI/2);
    for (const [z,k] of [[2.3,'art1'],[3.4,'art2']]) { box(.05,.82,.66,M.walnut,12.36,2.75,z); plane(.6,.76,decal({map:cfaSignTex(k),roughness:.8}),12.33,2.75,z,0,-Math.PI/2); }
    // 둥근 탁자 + 의자 2개
    { const tx=10.8, tz=1.9; cyl(.56,.56,.05,M.marble,tx,1.0,tz,26); cyl(.05,.05,.95,M.iron,tx,.5,tz,8); cyl(.3,.34,.04,M.iron,tx,.02,tz,18);
      cyl(.07,.06,.09,M.ceramic,tx-.15,1.07,tz+.1,12); cyl(.11,.11,.012,M.ceramic,tx-.15,1.03,tz+.1,14); put(new THREE.CylinderGeometry(.13,.13,.1,14,1,false,0,1.1),M.cakeSide,tx+.18,1.08,tz-.1);
      for (const s of [-1,1]){ const cx=tx+s*.78; cyl(.27,.27,.06,M.oak,cx,.62,tz,18); for (let n=0;n<3;n++){ const a=n*2.09+.5; put(new THREE.CylinderGeometry(.022,.022,.62,6),M.iron,cx+Math.cos(a)*.18,.31,tz+Math.sin(a)*.18,Math.sin(a)*.1,0,-Math.cos(a)*.1); }
        put(new THREE.TorusGeometry(.24,.03,6,14,Math.PI),M.iron,cx+s*.22,.95,tz,0,Math.PI/2,0); for (const dz of [-.12,0,.12]) box(.025,.3,.025,M.iron,cx+s*.22,.8,tz+dz); } }
    plant(12.0,.45,.8); plant(12.05,-9.3,.55);
    { const x=9.45, z=-9.35; cyl(.24,.26,.05,M.walnut,x,.025,z,14); cyl(.04,.04,2.0,M.walnut,x,1.0,z,8); sph(.06,M.walnut,x,2.03,z,1,1,1,8);
      for (let n=0;n<3;n++){ const a=n*2.09; put(new THREE.CylinderGeometry(.018,.018,.22,6),M.brass,x+Math.cos(a)*.1,1.88,z+Math.sin(a)*.1,Math.sin(a)*.9,0,-Math.cos(a)*.9); }
      cyl(.2,.2,.02,cfaMat({color:0xf2c26b,roughness:.8}),x+.14,1.78,z+.05,16).rotation.z=.5; box(.22,.3,.1,M.cushion,x-.13,1.55,z+.05); } }

  /* ----- 화분 도우미 (위에서 씀) ----- */
  function plant(x,z,s,y0){ y0=y0||0; cyl(.24*s,.18*s,.42*s,M.terracotta,x,y0+.21*s,z,14); cyl(.26*s,.26*s,.06*s,M.terracotta,x,y0+.42*s,z,14); cyl(.22*s,.22*s,.02,M.soil,x,y0+.43*s,z,12);
    for (let n=0;n<7;n++){ const a=n*.9, r=n?.17*s:0; sph(rnd(.2,.27)*s,[M.leaf,M.leaf2,M.leaf3][n%3],x+Math.cos(a)*r,y0+(.66+(n?rnd(0,.25):.38))*s,z+Math.sin(a)*r,1,.9,1,8); } }

  /* ----- 뒷문 (손님이 가까이 오면 열려요) · 문 밖 풍경 ----- */
  const door=new THREE.Group(); door.position.set(CF_DOORX.x0+.02,0,-9.86); root.add(door);
  { const dw=CF_DOORX.x1-CF_DOORX.x0-.04, dh=CF_DOORX.h-.04, P3=(geo,mat,x,y,z)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=m.receiveShadow=true; door.add(m); return m; };
    const dm=cfaMat({color:0x8fcab4,roughness:.55});
    P3(B(dw,1.15,.08),dm,dw/2,.575,0); P3(B(dw,.22,.08),dm,dw/2,dh-.11,0); P3(B(.2,dh,.08),dm,.1,dh/2,0); P3(B(.2,dh,.08),dm,dw-.1,dh/2,0);
    const gl=P3(new THREE.PlaneGeometry(dw-.4,dh-1.37),M.glass,dw/2,1.15+(dh-1.37)/2,0); gl.castShadow=false;
    P3(B(dw-.5,.05,.05),M.brass,dw/2,1.05,.07); P3(new THREE.CylinderGeometry(.04,.04,.42,8),M.brass,dw-.28,1.25,.08);
    const sg=P3(new THREE.PlaneGeometry(.62,.26),new THREE.MeshBasicMaterial({map:cfaTex(cfaCv(256,108,g=>{ g.fillStyle='#fff8ec'; roundRect(g,4,4,248,100,20); g.fill(); g.lineWidth=8; g.strokeStyle='#e5484d'; roundRect(g,8,8,240,92,16); g.stroke(); g.fillStyle='#e5484d'; g.font=cfaFont(56); g.textAlign='center'; g.textBaseline='middle'; g.fillText('OPEN',128,58); })),toneMapped:false}),dw/2,2.05,.05); sg.castShadow=false; }
  { const hg=new THREE.Group(); root.add(hg); const lm=[M.leaf,M.leaf2,M.leaf3];
    for (let n=0;n<14;n++){ const m=new THREE.Mesh(new THREE.SphereGeometry(.62,10,8),lm[n%3]); m.position.set(6.6+n*.66,.5+Math.random()*.2,-13.4+Math.random()*.3); m.scale.set(1,.95,.8); hg.add(m); }
    const fw=cfaMat({color:0xfffaf0,roughness:.7}); for (let n=0;n<16;n++){ const m=new THREE.Mesh(new THREE.BoxGeometry(.12,.9,.05),fw); m.position.set(7.2+n*.44,.45,-12.4); hg.add(m); }
    for (const y of [.3,.7]){ const m=new THREE.Mesh(new THREE.BoxGeometry(7.0,.08,.04),fw); m.position.set(10.5,y,-12.43); hg.add(m); }
    for (let n=0;n<10;n++){ const m=new THREE.Mesh(new THREE.SphereGeometry(.09,6,5),[M.frostP,M.white,M.lemon][n%3]); m.position.set(7.4+n*.62,.95+Math.random()*.25,-13.0); hg.add(m); }
    hg.traverse(o=>{ if (o.isMesh){ o.castShadow=true; o.receiveShadow=true; } }); }

  vlMerge(ST);
  return {glow,halo,door};
}
function cfaHalo(par,x,y,z,s){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:vlGlowTex(),color:0xffc878,transparent:true,opacity:.42,depthWrite:false,blending:THREE.AdditiveBlending})); sp.position.set(x,y,z); sp.scale.setScalar(s); par.add(sp); return sp; }

/* 수납장 앞면 (가판대: 재료 색 문짝 · 그 밖: 크림색 + 민트 문짝) */
function cfaCabTex(i,wu){
  const key='cab'+i+'_'+wu; if (CFA[key]) return CFA[key];
  const k=Math.min(110,2048/wu), W=Math.round(wu*k), H=Math.round(.92*k);
  const base=i>=0?CF_SHELF[i].c:i===-3?'#c8925a':'#8fcab4', tint=i>=0?cfaMix(base,'#ffffff',i===1?.42:.5):i===-3?'#e9c9a0':'#bfe3d4', edge=cfaShade(base,.72);
  return CFA[key]=cfaTex(cfaCv(W,H,g=>{
    g.fillStyle='#f6eee2'; g.fillRect(0,0,W,H);
    g.fillStyle='#4a3a30'; g.fillRect(0,H-.12*k,W,.12*k);
    const n=Math.max(1,Math.round(wu/1.1)), dw=W/n, top=.05*k, dTop=.28*k, bot=H-.16*k;
    for (let d=0;d<n;d++){ const x=d*dw;
      g.fillStyle='#fbf6ee'; roundRect(g,x+.04*k,top,dw-.08*k,.18*k,3); g.fill(); g.strokeStyle='rgba(120,90,60,.35)'; g.lineWidth=1.5; g.stroke();
      g.fillStyle='#c9a050'; roundRect(g,x+dw/2-.13*k,top+.07*k,.26*k,.045*k,2); g.fill();
      g.fillStyle=tint; roundRect(g,x+.04*k,dTop,dw-.08*k,bot-dTop,4); g.fill(); g.strokeStyle=edge; g.lineWidth=2.2; g.stroke();
      g.globalAlpha=.55; g.strokeStyle=cfaShade(base,.9); roundRect(g,x+.12*k,dTop+.08*k,dw-.24*k,bot-dTop-.16*k,3); g.stroke(); g.globalAlpha=1;
      g.fillStyle='rgba(255,255,255,.28)'; g.fillRect(x+.07*k,dTop+2,dw-.14*k,2);
      g.fillStyle='#c9a050'; g.beginPath(); g.arc(x+(d%2?.17*k:dw-.17*k),(dTop+bot)/2,.038*k,0,7); g.fill(); g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.arc(x+(d%2?.16*k:dw-.18*k),(dTop+bot)/2-.012*k,.012*k,0,7); g.fill(); }
    const gr=g.createLinearGradient(0,0,0,.2*k); gr.addColorStop(0,'rgba(40,20,10,.3)'); gr.addColorStop(1,'rgba(40,20,10,0)'); g.fillStyle=gr; g.fillRect(0,0,W,.2*k);
  }));
}
