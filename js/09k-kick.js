/* 사회 게임 RPG · 🚪 선생님이 학생 내보내기
   선생님 화면 '게임 열기'의 [🚪 학생 내보내기]를 누르면 kick/{학급} (또는 kick/all) 에 {t, all} 이 적혀요.
   그 시각보다 먼저 로그인해 있던 학생은 로그아웃되고 로그인 화면으로 돌아가요.
   all=false: 로비에 있는 학생만 (게임·수업 중인 학생은 그대로) · all=true: 게임·수업 중인 학생도 */
const KICK={cid:null,refs:[],since:0,busy:false};
function kickWatch(){
  const cid=fbDb&&AUTHMODE==='student'&&STUDENT?String(STUDENT.cid):'';
  if (cid===KICK.cid) return;
  KICK.refs.forEach(r=>r.off()); KICK.refs=[]; KICK.cid=cid; if (!cid) return;
  KICK.since=stgNow();   // 이 시각 뒤에 누른 '내보내기'만 따라요 (예전에 누른 것 때문에 다시 쫓겨나지 않게)
  ['all',cid].forEach(k=>{ const r=fbDb.ref(`kick/${k}`); r.on('value',s=>kickCheck(s.val()),()=>{}); KICK.refs.push(r); });
}
function kickCheck(v){
  if (!v||!(+v.t)||+v.t<=KICK.since||KICK.busy) return;
  const playing=typeof W!=='undefined'&&W.state==='play';
  if (playing&&!v.all) return;   // 로비만 내보내기: 하던 판은 그대로
  kickOut();
}
async function kickOut(){
  KICK.busy=true;
  try{ const u=myUid(); if (typeof LIVE!=='undefined'&&LIVE.on&&LIVE.cid&&u){ fbDb.ref(`live/${LIVE.cid}/pos/${u}`).remove().catch(()=>{}); fbDb.ref(`live/${LIVE.cid}/p/${u}`).remove().catch(()=>{}); } }catch(e){}
  try{ sessionStorage.setItem('gsd-kicked','1'); }catch(e){}
  try{ await withTimeout(fbAuth.signOut(),4000); }catch(e){}
  location.reload();
}
function kickNotice(){
  let k=false; try{ k=sessionStorage.getItem('gsd-kicked')==='1'; sessionStorage.removeItem('gsd-kicked'); }catch(e){}
  if (!k) return;
  const d=document.createElement('div'); d.className='kick-pop';
  d.innerHTML='<div class="card"><b>🚪 선생님이 게임을 정리했어요</b><p>로그아웃되었어요. 다시 하려면 선생님 안내에 따라 로그인해 주세요.</p><button class="btn">확인</button></div>';
  d.querySelector('button').onclick=()=>d.remove(); document.body.appendChild(d);
}
kickNotice();
setInterval(()=>{ try{ kickWatch(); }catch(e){} },1500);
