/* 사회 게임 RPG · 👥 지금 접속 중인 학생 (선생님 화면에서 동시 접속자 수를 봐요)
   online/{학급}/{uid} = {n 이름, num 번호, s 'lobby'|'play', m 모드, t 시각} · 창을 닫거나 인터넷이 끊기면 서버가 저절로 지워요 */
const ONL={key:'',ref:null,last:'',t:0,conn:null};
function onlineTick(){
  const on=!!(fbDb&&AUTHMODE==='student'&&STUDENT&&PROFILE&&myUid()), key=on?`online/${STUDENT.cid}/${myUid()}`:'';
  if (key!==ONL.key){
    if (ONL.ref){ try{ ONL.ref.onDisconnect().cancel(); }catch(e){} ONL.ref.remove().catch(()=>{}); }
    ONL.key=key; ONL.ref=key?fbDb.ref(key):null; ONL.last=''; ONL.t=0;
    if (ONL.ref&&!ONL.conn){ ONL.conn=fbDb.ref('.info/connected'); ONL.conn.on('value',s=>{ if (s.val()===true){ ONL.last=''; ONL.t=0; } }); }
  }
  if (!ONL.ref) return;
  const play=typeof W!=='undefined'&&W.state==='play', s=play?'play':'lobby', m=play&&typeof gameModeId==='function'?String(gameModeId()).slice(0,16):'';
  const sig=s+'|'+m+'|'+myName(), now=performance.now();
  if (sig===ONL.last&&now-ONL.t<25000) return;
  ONL.last=sig; ONL.t=now;
  try{ ONL.ref.onDisconnect().remove(); }catch(e){}
  ONL.ref.set({n:String(myName()||'').slice(0,12),num:+STUDENT.num||0,s,m,t:firebase.database.ServerValue.TIMESTAMP}).catch(()=>{ ONL.t=now+30000; });
}
setInterval(()=>{ try{ onlineTick(); }catch(e){} },2000);
