/* 사회 게임 RPG · 📒 내 오답 노트
   판이 끝날 때 끝내 못 맞힌 문제를 notes/{반}/{번호}에 모아요. 나중에 맞히면 '이제 맞혀요'로 바뀌어요. */
const noteKey=q=>{ let h=5381; for (let i=0;i<q.length;i++) h=((h<<5)+h+q.charCodeAt(i))|0; return 'q'+(h>>>0).toString(36); };
async function notesWrite(){
  if (!(AUTHMODE==='student'&&STUDENT&&fbDb)) return;
  const ref=fbDb.ref(`notes/${STUDENT.cid}/${STUDENT.num}`), TS=firebase.database.ServerValue.TIMESTAMP;
  try{
    const cur=(await withTimeout(ref.once('value'),8000)).val()||{}, up={};
    for (const w of W.wrong){ const q=String(w.item.q||'').slice(0,300); if (!q) continue; const k=noteKey(q), e=cur[k]||{};
      up[k]={q,n:Math.min(9999,(e.n|0)+1),s:w.fixed?0:1,t:TS}; }
    const right=W.right||new Set();
    for (const k in cur){ const e=cur[k]; if (!up[k] && e && e.s===1 && right.has(e.q)) up[k]={q:e.q,n:e.n|0,s:0,t:TS}; }
    if (Object.keys(up).length) await withTimeout(ref.update(up),8000);
  }catch(e){}
}
/* 문제 찾기: 지금 문제은행의 모든 단원에서 같은 문제를 찾아 정답·해설을 보여 줘요 */
function noteLookup(){
  const map=new Map();
  try{ for (const u of DATA.units){ const b=u.bank||{}, z=zcfgOf(u), zn=z.n, zc=z.c;
    (b.mc||[]).forEach(x=>{ if (x&&x.q) map.set(x.q,{kind:'4지선다',q:x.q,opts:x.o,ans:x.o[0],e:x.e||'',unit:u.name}); });
    (b.ox||[]).forEach(x=>{ if (x&&x.q) map.set(x.q,{kind:'O/X',q:x.q,opts:['O','X'],ans:x.a?'O (맞다)':'X (틀리다)',e:x.e||'',unit:u.name}); });
    (b.cls||[]).forEach(x=>{ if (x&&x.q) map.set(x.q,{kind:'분류',q:`“${x.q}” ${z.q}`,opts:zc,ans:zc[x.a?1:0],e:x.e||'',unit:u.name}); });
    (b.loc||[]).forEach(x=>{ if (x&&x.q) map.set(x.q,{kind:'위치 퀴즈',q:x.q,opts:zn,ans:zn[ZK.indexOf(x.a)]||'',e:x.e||'',unit:u.name}); }); } }catch(e){}
  return map;
}
const NOTES={open:false,data:{}};
async function notesOpen(){
  if (!(AUTHMODE==='student'&&STUDENT&&fbDb)) return;
  NOTES.open=true; $('#notesPop').hidden=false; $('#notesList').innerHTML='<p class="bd-empty">불러오는 중…</p>';
  try{ NOTES.data=(await withTimeout(fbDb.ref(`notes/${STUDENT.cid}/${STUDENT.num}`).once('value'),8000)).val()||{}; }
  catch(e){ $('#notesList').innerHTML='<p class="bd-empty">오답 노트를 불러오지 못했어요. 선생님께 보안 규칙이 최신인지 알려 주세요.</p>'; return; }
  notesRender();
}
function notesRender(){
  const L=noteLookup(), all=Object.entries(NOTES.data||{}).map(([k,e])=>({k,...e,it:L.get(e.q)})).filter(x=>x.q);
  const tab=NOTES.tab||'todo', todo=all.filter(x=>x.s===1), done=all.filter(x=>x.s!==1);
  const rows=(tab==='todo'?todo:done).sort((a,b)=>(b.n-a.n)||((+b.t||0)-(+a.t||0)));
  $('#notesTabs').innerHTML=`<button data-nt="todo" class="${tab==='todo'?'on':''}">복습할 문제 ${todo.length}</button><button data-nt="done" class="${tab==='done'?'on':''}">이제 맞혀요 ✓ ${done.length}</button>`;
  $('#notesList').innerHTML=rows.length?rows.map((x,i)=>{ const it=x.it;
    return `<div class="nt-item"><div class="nt-top"><span class="nt-kind">${esc(it?it.kind:'문제')}</span>${it?`<small>${esc(it.unit)}</small>`:''}<span class="nt-n">${x.n|0}번 틀림</span></div>
      <p class="nt-q">${esc(it?it.q:x.q)}</p>
      ${it&&it.opts&&it.kind==='4지선다'?`<ol class="nt-opts">${(()=>{ let h=7; for (const ch of x.q) h=(h*31+ch.charCodeAt(0))|0; return [...it.opts].map((o,j)=>({o,r:((Math.sin((h%1000)*12.9898+j*78.233)*43758.5453)%1+1)%1})).sort((a,b)=>a.r-b.r).map(a=>`<li>${esc(a.o)}</li>`).join(''); })()}</ol>`:''}
      <details class="nt-ans"><summary>정답 보기</summary><p><b>정답: ${esc(it?it.ans:'(문제은행에서 이 문제가 바뀌었어요)')}</b></p>${it&&it.e?`<p>${esc(it.e)}</p>`:''}</details></div>`; }).join('')
    :`<p class="bd-empty">${tab==='todo'?(all.length?'복습할 문제가 없어요. 모두 맞혔어요! 🎉':'아직 오답 노트가 비어 있어요. 게임에서 끝내 못 맞힌 문제가 여기에 모여요.'):'아직 다시 맞힌 문제가 없어요.'}</p>`;
}
function notesClose(){ NOTES.open=false; $('#notesPop').hidden=true; }
$('#notesBtn').addEventListener('click',notesOpen);
$('#notesClose').addEventListener('click',notesClose);
$('#notesPop').addEventListener('click',e=>{ if (e.target.id==='notesPop') notesClose(); const t=e.target.closest('[data-nt]'); if (t){ NOTES.tab=t.dataset.nt; notesRender(); } });
setInterval(()=>{ const b=$('#notesBtn'); if (b) b.hidden=!(AUTHMODE==='student'&&STUDENT&&W.state!=='play'&&!$('#title').hidden); },1000);
