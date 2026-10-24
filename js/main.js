"use strict";
/* ---------- controls & loop ---------- */
function setPause(p){paused=p;$('pauseOv').hidden=!p;if(p)closeTray();
  if(p){saveGame();armNew($('bNewPause'),false);updRaids();}}
function updRaids(){setT('bRaids',G.raids?'Saldırılar açık · Kapat':'Saldırılar kapalı · Aç');}
$('bRaids').addEventListener('click',()=>{G.raids=!G.raids;updRaids();toast(G.raids?`Saldırılar açıldı. Sıradaki dalgaya ${fmt(G.waveT)} var.`:'Saldırılar kapatıldı.');});
$('bPause').addEventListener('click',()=>setPause(!paused));
$('bResume').addEventListener('click',()=>setPause(false));
function armNew(btn,on){btn.dataset.armed=on?'1':'';btn.classList.toggle('warn',on);btn.textContent=on?'Emin misin? Köy silinir, tekrar dokun':'Yeni oyun başlat';}
function freshStart(){clearSave();newGame();G.over=false;started=true;$('over').hidden=true;$('intro').hidden=true;setPause(false);door.hidden=false;
  setTimeout(()=>toast('Alttaki şeritte bir mesleğe dokun, kapıdan o meslek çıksın.'),400);}
for(const id of['bNewPause','bNewIntro'])$(id).addEventListener('click',e=>{const b=e.currentTarget;if(b.dataset.armed)freshStart();else armNew(b,true);});
$('bSpeed').addEventListener('click',()=>{speed=speed===1?2:1;setT('bSpeed',`Oyun hızı: ${speed}×`);});
$('bStart').addEventListener('click',()=>{
  const d=readSave();$('intro').hidden=true;
  if(d&&loadGame(d)){started=true;door.hidden=false;toast('Köyün kaldığı yerden devam ediyor.');return;}
  started=true;door.hidden=false;setTimeout(()=>toast('Alttaki şeritte bir mesleğe dokun, kapıdan o meslek çıksın.'),400);});
$('bRestart').addEventListener('click',freshStart);

window.addEventListener('resize',resize);
resize();newGame();door.hidden=true;
{const d=readSave();if(d){const p=(d.vill?.length||0)+(d.queue||0);
  $('introSave').hidden=false;$('introSave').textContent=`Kayıtlı köy: ${fmt(d.t)} oynandı, ${p} nüfus, ${d.wave} dalga atlatıldı.`;
  $('bStart').textContent='Devam et';$('bNewIntro').hidden=false;}}
let saveT=5;
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveGame();});
window.addEventListener('pagehide',saveGame);
let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(started&&!G.over&&!paused&&!document.hidden)for(let i=0;i<speed;i++)update(dt);
  render();hud(dt);
  saveT-=dt;if(saveT<=0){saveT=5;saveGame();}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
