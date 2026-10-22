/* 사회 게임 RPG · Firebase 접속 · 결과 저장 · 학생 계정 · 보상 · 각성
   파일은 01 → 13 순서로 불러와요. 모든 파일이 같은 전역 공간을 함께 써요. */
/* ---------- Firebase: 접속 · 결과 저장 · 문제은행 ---------- */
let fbAuth=null, fbDb=null, fbReady=null, isAdmin=false;
const PENDING_KEY='gsd-pending';
function emailKey(e){ return String(e||'').toLowerCase().replace(/\./g,','); }
function setSave(kind,msg,retry){ const b=$('#saveBox'); b.className='savebox '+kind; $('#saveMsg').textContent=msg; $('#saveRetry').hidden=!retry; }
function pendingList(){ try{ return JSON.parse(localStorage.getItem(PENDING_KEY)||'[]'); }catch(e){ return []; } }
function setPending(a){ try{ localStorage.setItem(PENDING_KEY,JSON.stringify(a.slice(-20))); }catch(e){} }
function combatStats(){
  const S=W.stats||{}; const r=v=>Math.max(0,Math.round(v||0));
  return {dealt:r(S.dealt),taken:r(S.taken),minHp:r(Math.min(S.minHp===undefined?1:S.minHp,Math.max(0,P.hp)/(P.max||1))*100),melee:r(S.melee),ranged:r(S.ranged),boss:r(S.boss),quiz:r(S.quiz),
    blocks:r(S.blocks),blocked:r(S.blocked),dodges:r(S.dodges),ults:r(S.ults),evaded:r(S.evaded),shots:r(S.shots),dl:r(S.dl),lost:r(S.lost),pc:PEACE_RUN?1:0,st:r(PEACE_RUN&&W.isl?W.isl.stars:0),rv:W.revived?1:0,wv:r(W.wave+1),hpMax:r(P.max),
    wt:(S.ws||[]).map(v=>v===undefined?'':Math.round(v)).join(',').slice(0,120)};
}
function toRecord(r,uid){
  if (!r.label) r.label=(r.cls||'')+'반';
  return {uid,cls:String(r.cls).slice(0,4),cid:String(r.cid||'').slice(0,10),sch:String(r.sch||'').slice(0,30),grade:+r.grade||0,year:+r.year||0,nick:String(r.nick).slice(0,20),unit:String(r.unit).slice(0,80),unitId:String(r.unitId).slice(0,20),
    win:!!r.win,score:r.score|0,correct:r.correct|0,asked:r.asked|0,kills:r.kills|0,timeSec:r.timeSec|0,
    wrong:r.wrong.join('\n').slice(0,3000),ts:firebase.database.ServerValue.TIMESTAMP,mode:r.mode==='hero'?'hero':'normal',diff:Math.round((r.diff||1)*100)/100,
    ...(r.cs?{job:String(r.job||'').slice(0,12),map:String(r.map||'').slice(0,10),ease:Math.max(-1,Math.min(2,r.ease|0)),cs:r.cs}:{})};
}
function withTimeout(p,ms){ return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]); }
async function pushResult(r){
  await withTimeout(fbReady,10000);
  const u=fbAuth.currentUser; if (!u) throw new Error('no-auth');
  const rec=toRecord(r,u.uid);
  try{ await withTimeout(fbDb.ref('results').push(rec),10000); }
  catch(e){
    // 예전 보안 규칙(모드·난이도 칸이 없는 규칙)이면 그 두 칸을 빼고 다시 저장
    if (!/permission|PERMISSION/i.test(String(e&&(e.code||e.message)))) throw e;
    if (rec.cs){ delete rec.job; delete rec.map; delete rec.ease; delete rec.cs;
      try{ await withTimeout(fbDb.ref('results').push(rec),10000); return; }
      catch(e2){ if (!/permission|PERMISSION/i.test(String(e2&&(e2.code||e2.message)))) throw e2; } }
    delete rec.mode; delete rec.diff;
    await withTimeout(fbDb.ref('results').push(rec),10000);
  }
}
async function saveResult(r){
  if (!fbDb){ setSave('err','결과를 저장할 수 없어요. 인터넷 연결을 확인하고 선생님께 알려 주세요.',false); $('#copyBtn').hidden=false; return; }
  setSave('wait','결과를 저장하는 중…',false);
  try{ await pushResult(r); setSave('ok',`결과가 선생님께 저장됐어요 ✓  (${r.label} ${r.nick} · ${r.score}점)`,false); $('#copyBtn').hidden=true; }
  catch(e){
    const p=pendingList(); if (!p.some(x=>x.when===r.when&&x.nick===r.nick)){ p.push(r); setPending(p); }
    setSave('err','저장하지 못했어요. 인터넷이 다시 연결되면 자동으로 저장돼요. 지금 다시 시도하려면 버튼을 누르세요.',true);
    $('#copyBtn').hidden=false;
  }
}
async function flushPending(){
  const p=pendingList(); if (!p.length) return;
  const left=[];
  for (const r of p){ try{ await pushResult(r); }catch(e){ left.push(r); } }
  setPending(left);
  if (lastResult && !left.some(x=>x.when===lastResult.when&&x.nick===lastResult.nick) && !$('#end').hidden && $('#saveBox').classList.contains('err'))
    setSave('ok',`결과가 선생님께 저장됐어요 ✓  (${lastResult.label} ${lastResult.nick} · ${lastResult.score}점)`,false);
}
$('#saveRetry').addEventListener('click',async()=>{ if (!lastResult) return; setSave('wait','다시 저장하는 중…',false);
  await flushPending(); if ($('#saveBox').classList.contains('wait')) saveResult(lastResult); });
addEventListener('online',()=>{ flushPending(); });

async function checkAdmin(user){
  if (!user || user.isAnonymous || !user.email) return false;
  if (user.email.toLowerCase()===String(window.OWNER_EMAIL).toLowerCase()) return true;
  try{ const snap=await fbDb.ref('admins/'+emailKey(user.email)).once('value'); return snap.val()===true; }catch(e){ return false; }
}
function initFirebase(){
  if (!window.firebase || !window.FIREBASE_CONFIG){ $('#netWarn').hidden=false; $('#netWarn').textContent='저장 서버에 연결하지 못했어요. 게임은 할 수 있지만 결과가 저장되지 않아요. 선생님께 알려 주세요.'; return; }
  try{
    firebase.initializeApp(window.FIREBASE_CONFIG);
    fbAuth=firebase.auth(); fbDb=firebase.database();
  }catch(e){ $('#netWarn').hidden=false; $('#netWarn').textContent='저장 서버 설정에 문제가 있어요. 선생님께 알려 주세요.'; return; }
  try{ fbAuth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(()=>{}); }catch(e){}
  loadClasses();
  fbReady=new Promise((resolve,reject)=>{
    let first=true;
    fbAuth.onAuthStateChanged(async u=>{
      if (u){ if (first){ first=false; resolve(u); } if (isStudentUser(u)) enterStudentFromSession(u); return; }
      try{ await fbAuth.signInAnonymously(); }catch(err){
        if (!first) return; first=false; $('#netWarn').hidden=false;
        const c=String(err&&err.code||err&&err.message||'unknown');
        const why = (c==='auth/operation-not-allowed'||c==='auth/admin-restricted-operation') ? 'Firebase에서 익명 로그인이 꺼져 있어요. Authentication → 로그인 방법에서 익명을 켜 주세요.'
          : c==='auth/operation-not-supported-in-this-environment' ? '파일을 컴퓨터에서 바로 열었어요. GitHub에 올린 주소(https://…github.io/…)로 열어 주세요.'
          : (c==='auth/api-key-not-valid.-please-pass-a-valid-api-key.'||c.indexOf('api-key')>=0) ? 'firebase-config.js의 apiKey 값이 맞지 않아요.'
          : c==='auth/network-request-failed' ? '구글 로그인 서버(identitytoolkit.googleapis.com)에 닿지 못했어요. 학교망에서 막혔을 수 있어요.'
          : c==='auth/unauthorized-domain' ? 'Firebase 승인된 도메인에 이 사이트 주소를 추가해야 해요.'
          : '저장 서버에 접속하지 못했어요.';
        $('#netWarn').textContent = `${why} (오류: ${c})`;
        reject(err); }
    });
  });
  fbReady.then(async u=>{
    loadBank(); loadSettings();
    isAdmin=await checkAdmin(u);
    $('#editBtn').hidden=!isAdmin; $('#guestBtn').hidden=!isAdmin; applyPlay(); renderJobPick(); if (!isAdmin && AUTHMODE==='guest'){ AUTHMODE='login'; showAuthUI(); } watchGate(); updateGateUI();
    const plain=u.isAnonymous||isStudentUser(u);
    $('#teacherState').textContent = isAdmin ? `선생님 로그인됨 (${u.email})` : (plain?'선생님이신가요?':`${u.email} 은(는) 선생님 권한이 없어요`);
    $('#teacherLogin').textContent = isAdmin||!plain ? '로그아웃' : '문제 관리 로그인';
    flushPending();
  }).catch(()=>{ loadBank(); });
}
$('#teacherLogin').addEventListener('click',async e=>{
  e.preventDefault(); if (!fbAuth) return;
  const u=fbAuth.currentUser;
  if (u && !u.isAnonymous && !isStudentUser(u)){ await fbAuth.signOut(); location.reload(); return; }
  try{ await fbAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); location.reload(); }
  catch(err){ $('#teacherState').textContent = err&&err.code==='auth/unauthorized-domain' ? 'Firebase 인증 설정에 이 사이트 주소를 추가해야 해요' : err&&err.code==='auth/popup-blocked' ? '팝업이 막혔어요. 팝업을 허용해 주세요' : '로그인하지 못했어요'; }
});
function loadSettings(){
  if (!fbDb) return;
  fbDb.ref('settings').once('value').then(snap=>{ const v=snap.val()||{}; HERO_OPEN=v.heroMode===true; FREE_PLAY=v.freePlay===true; applyPlay(); $('#modePick').hidden=!HERO_OPEN; if (!HERO_OPEN) $('#modeNormal').checked=true; }).catch(()=>{ HERO_OPEN=false; });
}
function loadBank(){
  if (!fbDb) return;
  fbDb.ref('bank').once('value').then(snap=>{
    const n=normalize(snap.val()); if (n){ DATA=n; useUnit(DATA.active); applyPlay(); }
  }).catch(()=>{});
}

/* ---------- 학생 계정: 반·번호·코드 로그인, 경험치·레벨·코인 ---------- */
const STU_DOMAIN='stu.sgame.kr';
let AUTHMODE='login', STUDENT=null, PROFILE=null, lastReward=null, GUEST_IN=false;
const isStudentUser=u=>!!(u&&u.email&&u.email.endsWith('@'+STU_DOMAIN));
const emailOf=(c,n,code)=>`${c}-${n}-${String(code).toLowerCase()}@${STU_DOMAIN}`;
const pwOf=code=>'sg#'+String(code).toLowerCase()+'#26';
function levelOf(xp){ let lv=1, need=150, rest=Math.max(0,xp|0); while (rest>=need){ rest-=need; lv++; need=150+50*(lv-1); } return {lv,rest,need}; }
function profRef(){ return fbDb.ref(`profiles/${STUDENT.cid}/${STUDENT.num}`); }
function showAuthUI(){
  $('#classPick').hidden=AUTHMODE==='student'||AUTHMODE==='name';
  $('#loginBox').hidden=AUTHMODE!=='login';
  $('#guestBox').hidden=AUTHMODE!=='guest';
  $('#nameBox').hidden=AUTHMODE!=='name';
  $('#profileCard').hidden=AUTHMODE!=='student';
  if (AUTHMODE!=='guest') GUEST_IN=false;
  const lobby=AUTHMODE==='student'||(AUTHMODE==='guest'&&GUEST_IN);
  $('#title').classList.toggle('step-login',!lobby);
  { const tr=document.querySelector('.teacher-row'); (lobby?$('#setPop'):$('#title .panel')).appendChild(tr); if (!lobby) setPopOpen(false); }
  $('#guestCard').hidden=!(AUTHMODE==='guest'&&GUEST_IN);
  if (AUTHMODE==='guest'&&GUEST_IN){ const ci=classInfo($('#pkCls').value); $('#gcName').textContent=$('#nick').value.trim(); $('#gcWho').textContent=ci?ci.label:''; }
  if (AUTHMODE==='student') renderProfileCard();
  renderJobPick();
  watchPlog(); updateGateUI(); try{ applyPlay(); }catch(e){}
}
function renderProfileCard(){
  const L=levelOf(PROFILE.xp);
  $('#pcName').textContent=PROFILE.name||'이름 없음';
  { const ci=classInfo(STUDENT.cid); $('#pcWho').textContent=`${ci?ci.label:''} ${STUDENT.num}번`; }
  $('#pcLv').textContent=`Lv.${L.lv}`;
  $('#pcXp').style.width=Math.round(L.rest/L.need*100)+'%';
  $('#pcXpTxt').textContent=`경험치 ${L.rest} / ${L.need}`;
  $('#pcCoins').textContent=availCoins().toLocaleString('ko-KR');
}
function lgError(msg){ const e=$('#lgErr'); e.hidden=!msg; e.textContent=msg||''; }
try{ $('#lgNum').value=localStorage.getItem('gsd-lgnum')||''; }catch(e){}
$('#lgCode').addEventListener('input',e=>{ e.target.value=e.target.value.replace(/[^a-zA-Z0-9]/g,'').toUpperCase().slice(0,6); lgError(''); });
$('#guestBtn').addEventListener('click',()=>{ if (!isAdmin) return; AUTHMODE='guest'; showAuthUI(); $('#nick').focus(); });
$('#backLogin').addEventListener('click',()=>{ AUTHMODE='login'; showAuthUI(); $('#lgCode').focus(); });
function guestEnter(){
  const v=$('#nick').value.trim(), c=$('#pkCls').value;
  if (!v||!c){ $('#nickErr').hidden=false; (c?$('#nick'):$('#pkCls')).focus(); return; }
  $('#nickErr').hidden=true; GUEST_IN=true; showAuthUI();
}
$('#guestGo').addEventListener('click',guestEnter);
$('#nick').addEventListener('keydown',e=>{ if (e.key==='Enter'){ e.preventDefault(); guestEnter(); } });
$('#gcBack').addEventListener('click',()=>{ GUEST_IN=false; AUTHMODE='guest'; showAuthUI(); $('#nick').focus(); });
$('#lgCode').addEventListener('keydown',e=>{ if (e.key==='Enter'){ e.preventDefault(); studentLogin(); } });
$('#lgBtn').addEventListener('click',()=>studentLogin());
$('#pcLogout').addEventListener('click',async()=>{ STUDENT=null; PROFILE=null; WARDROBE=null; applyLook(guestLook()); AUTHMODE='login'; showAuthUI(); $('#lgCode').value=''; try{ await fbAuth.signOut(); }catch(e){} });

let loggingIn=false;
async function studentLogin(){
  if (loggingIn) return;
  if (!fbAuth){ lgError('저장 서버에 연결되지 않아 로그인할 수 없어요. 잠시 뒤 다시 해 보고, 계속 안 되면 선생님께 알려 주세요.'); return; }
  const c=$('#pkCls').value, n=String(parseInt($('#lgNum').value,10)||''), code=$('#lgCode').value.trim().toLowerCase();
  if (LEGACY||!c||c.startsWith('n:')){ lgError('학급을 먼저 골라 주세요.'); return; }
  if (!n||+n<1||+n>60){ lgError('번호를 확인해 주세요.'); return; }
  if (!/^[a-z0-9]{6}$/.test(code)){ lgError('코드는 영어와 숫자 6자리예요.'); return; }
  loggingIn=true; $('#lgBtn').disabled=true; $('#lgBtn').textContent='확인 중…'; lgError('');
  const email=emailOf(c,n,code), pw=pwOf(code);
  let created=false;
  try{
    try{ await fbAuth.signInWithEmailAndPassword(email,pw); }
    catch(e){
      const k=e&&e.code;
      if (k==='auth/invalid-credential'||k==='auth/user-not-found'||k==='auth/invalid-login-credentials'||k==='auth/wrong-password'){
        await fbAuth.createUserWithEmailAndPassword(email,pw); created=true;
      } else throw e;
    }
    STUDENT={cid:c,num:n};
    let val;
    try{ val=(await withTimeout(profRef().once('value'),10000)).val(); }
    catch(e){
      // 이 반·번호의 코드가 아니면 읽기 권한이 없어요
      const u=fbAuth.currentUser; STUDENT=null;
      if (created && u) { try{ await u.delete(); }catch(_){} }
      try{ await fbAuth.signOut(); }catch(_){}
      lgError(/timeout/.test(String(e&&e.message))?'서버가 응답하지 않아요. 잠시 뒤 다시 해 주세요.':'학급·번호·코드가 맞지 않아요. 선생님께 받은 코드 카드를 확인해 주세요.');
      return;
    }
    try{ localStorage.setItem('gsd-cid',c); localStorage.setItem('gsd-lgnum',n); }catch(_){}
    if (!val){ AUTHMODE='name'; showAuthUI(); $('#pfName').focus(); return; }
    PROFILE=val; AUTHMODE='student'; showAuthUI(); loadWardrobe();
  }catch(e){
    const k=e&&e.code;
    lgError(k==='auth/operation-not-allowed'?'선생님: Firebase에서 이메일/비밀번호 로그인을 켜야 해요.'
      : k==='auth/too-many-requests'?'로그인 시도가 너무 많아요. 잠시 뒤 다시 해 주세요.'
      : k==='auth/network-request-failed'?'인터넷 연결을 확인해 주세요.'
      : '로그인하지 못했어요. ('+(k||'오류')+')');
  }finally{ loggingIn=false; $('#lgBtn').disabled=false; $('#lgBtn').textContent='로그인'; }
}
$('#pfSave').addEventListener('click',()=>saveName());
$('#pfName').addEventListener('keydown',e=>{ if (e.key==='Enter'){ e.preventDefault(); saveName(); } });
async function saveName(){
  const nm=$('#pfName').value.trim();
  if (!nm){ $('#pfErr').hidden=false; $('#pfErr').textContent='이름(또는 별명)을 적어 주세요.'; return; }
  const TS=firebase.database.ServerValue.TIMESTAMP;
  const p={name:nm.slice(0,12),xp:0,coins:0,plays:0,wins:0,best:0,skill:1,correct:0,asked:0,fixed:0,createdAt:TS,updatedAt:TS};
  $('#pfSave').disabled=true;
  try{ await withTimeout(profRef().set(p),10000); PROFILE={...p,createdAt:Date.now(),updatedAt:Date.now()}; AUTHMODE='student'; showAuthUI(); loadWardrobe(); }
  catch(e){ $('#pfErr').hidden=false; $('#pfErr').textContent='저장하지 못했어요. 보안 규칙이 최신인지 선생님께 알려 주세요.'; }
  finally{ $('#pfSave').disabled=false; }
}
async function enterStudentFromSession(u){
  if (STUDENT||AUTHMODE==='student') return;
  const m=u.email.match(/^([a-z0-9]{4,10})-(\d+)-[a-z0-9]{6}@/); if (!m) return;
  STUDENT={cid:m[1],num:m[2]};
  try{ const val=(await withTimeout(profRef().once('value'),10000)).val();
    if (!val){ AUTHMODE='name'; } else { PROFILE=val; AUTHMODE='student'; loadWardrobe(); }
    showAuthUI();
  }catch(e){ STUDENT=null; try{ await fbAuth.signOut(); }catch(_){} }
}

/* 게임이 끝나면 노력에 따라 보상 */
async function grantRewards(r,fixedN){
  const box=$('#rewardBox');
  if (!STUDENT||!PROFILE){ box.className='rewardbox guest'; box.innerHTML='<b>연습 모드</b><span>코드로 로그인하면 경험치와 코인이 쌓여요.</span>'; box.hidden=false; return; }
  let xp=10*r.asked+20*r.correct+40*fixedN+5*r.kills+(r.win?100:0);
  const newBest=(PROFILE.plays|0)>0 && r.score>(PROFILE.best|0);
  if (newBest) xp+=80;
  if (r.mode==='hero') xp*=1.5;
  xp=Math.min(1800,Math.round(xp)); const coins=Math.min(900,Math.round(xp/2));
  const before=levelOf(PROFILE.xp|0), after=levelOf((PROFILE.xp|0)+xp);
  // 각성: 오른 레벨마다 한 번씩 굴려요
  let own=ownedElems(), awk=PROFILE.awk|0; const awoke=[]; let tries=0;
  for (let l=before.lv+1; l<=after.lv; l++){ const left=ELEM_ORDER.filter(e=>!own.includes(e)); if (!left.length) break; tries++;
    if (awk>=AWAKE_PITY || Math.random()<AWAKE_CHANCE){ const e=left[Math.floor(Math.random()*left.length)]; own=[...own,e]; awoke.push(e); awk=0; } else awk++; }
  const upd={xp:(PROFILE.xp|0)+xp,coins:(PROFILE.coins|0)+coins,plays:(PROFILE.plays|0)+1,wins:(PROFILE.wins|0)+(r.win?1:0),
    best:Math.max(PROFILE.best|0,r.score|0),correct:(PROFILE.correct|0)+r.correct,asked:(PROFILE.asked|0)+r.asked,fixed:(PROFILE.fixed|0)+fixedN,
    skill:Math.round((r.newSkill??PROFILE.skill??1)*100)/100,updatedAt:firebase.database.ServerValue.TIMESTAMP};
  if (tries){ upd.elems=ELEM_ORDER.filter(e=>own.includes(e)).join(','); upd.awk=awk; }
  const lines=[`<b>+${xp} 경험치 · +${coins} 코인</b>`];
  const why=[]; if (r.asked) why.push(`문제 ${r.asked}개 도전`); if (fixedN) why.push(`틀린 문제 ${fixedN}개 다시 맞힘`); if (newBest) why.push('내 최고 점수 경신!'); if (r.mode==='hero') why.push('영웅 모드 ×1.5');
  if (why.length) lines.push(`<span>${why.join(' · ')}</span>`);
  if (after.lv>before.lv) lines.push(`<span class="lvup">레벨 업! Lv.${before.lv} → Lv.${after.lv}</span>`);
  awoke.forEach(e=>lines.push(`<span class="awake">✨ 각성! 마법사가 <b>${{fire:'🔥 불',ice:'❄️ 얼음',bolt:'⚡ 번개'}[e]}</b> 원소를 깨우쳤어요</span>`));
  if (tries && !awoke.length) lines.push(`<span class="awake miss">이번 레벨업에서는 각성하지 못했어요${awk>=AWAKE_PITY?' · 다음 레벨업엔 꼭 각성해요!':''}</span>`);
  lines.push(`<div class="xpbar"><i style="width:${Math.round(after.rest/after.need*100)}%"></i></div><small>Lv.${after.lv} · 경험치 ${after.rest} / ${after.need} · 코인 ${Math.max(0,upd.coins-((WARDROBE&&WARDROBE.spent)|0)).toLocaleString('ko-KR')}</small>`);
  box.className='rewardbox'; box.innerHTML=lines.join(''); box.hidden=false;
  try{ await withTimeout(profRef().update(upd),10000); PROFILE={...PROFILE,...upd,updatedAt:Date.now()}; renderProfileCard(); renderJobPick(); lastReward={xp,coins}; if (awoke.length){ SFX.wave(); } }
  catch(e){ box.insertAdjacentHTML('beforeend','<small class="warn">보상을 저장하지 못했어요. 너무 빨리 끝난 판(10초 미만)이나 게임 시간이 끝나고 15분이 지난 판은 저장되지 않아요.</small>'); }
}

