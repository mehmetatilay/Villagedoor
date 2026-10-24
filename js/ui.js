"use strict";
/* ---------- UI ---------- */
const sheet=$('sheet'),door=$('door');
let sheetKind=null,sheetRef=null;
function toast(msg,kind){const box=$('toasts');const d=document.createElement('div');d.className='toast'+(kind?' '+kind:'');d.textContent=msg;box.appendChild(d);
  while(box.children.length>1)box.firstChild.remove();setTimeout(()=>d.remove(),kind==='danger'?5000:3800);}
function setT(id,v){const e=$(id);v=String(v);if(e.textContent!==v)e.textContent=v;}
const fmt=s=>{s=Math.max(0,Math.ceil(s));return`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
function hpCls(fr){return fr>.6?'':fr>.3?'mid':'bad';}

function openVill(v){
  sheetKind='vill';sheetRef=v;
  sheet.innerHTML=`<div class="sh-head"><div><div class="eyebrow" style="color:${JOBS[v.job].renk}">${JOBS[v.job].ad}</div><h2>${v.name}</h2></div><button class="x" type="button" data-close>Kapat</button></div>
  <div class="hp"><i id="vHp"></i></div><div class="meta"><span id="vHpT"></span><span></span></div>
  <p class="note" id="vState"></p>
  <button class="big" type="button" id="vBack" data-back>Ana binaya geri çağır</button>`;
  showSheet();
}
function openBld(b){
  sheetKind='bld';sheetRef=b;
  const name=BNAME[b.type];
  sheet.innerHTML=`<div class="sh-head"><div><div class="eyebrow">${b.built?'Bina':'İnşaat'}</div><h2>${name}</h2></div><button class="x" type="button" data-close>Kapat</button></div>
  <div class="hp"><i id="bHp"></i></div><div class="meta"><span id="bHpT"></span><span id="bLv"></span></div><p class="note" id="bNote"></p>`;
  showSheet();
}
function setH(id,h){const e=$(id);if(e&&e.innerHTML!==h)e.innerHTML=h;}
function showSheet(){closeTray();sheet.hidden=false;door.hidden=true;updSheet();}
function closeSheet(){sheet.hidden=true;sheetKind=null;sheetRef=null;door.hidden=!started||!G||G.over;}
sheet.addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.hasAttribute('data-close'))closeSheet();
  else if(t.hasAttribute('data-back')){recall(sheetRef);updSheet();}
});


function updSheet(){
  if(!sheetKind)return;
  if(sheetKind==='vill'){
    const v=sheetRef;if(!v||v.dead){closeSheet();return;}
    if(v.gone){closeSheet();return;}
    const fr=v.hp/v.maxHp,hp=$('vHp');hp.style.width=fr*100+'%';hp.className=hpCls(fr);
    setT('vHpT',`Can ${Math.ceil(v.hp)}/${v.maxHp}`);setT('vState',stateText(v));
    const bb=$('vBack');bb.disabled=v.state==='recall';setT('vBack',v.state==='recall'?'Ana binaya dönüyor…':'Ana binaya geri çağır');
  }else if(sheetKind==='bld'){
    const b=sheetRef;if(!b||b.dead){closeSheet();return;}
    if(b.built&&GJOB[b.type]){closeSheet();openTray(GJOB[b.type]);return;}
    const fr=b.built?b.hp/b.maxHp:b.progress,hp=$('bHp');hp.style.width=fr*100+'%';hp.className=b.built?hpCls(fr):'mid';
    setT('bHpT',b.built?`Can ${Math.ceil(b.hp)}/${b.maxHp}`:`İnşaat %${Math.floor(b.progress*100)}`);
    if(b.type==='house'&&b.built){const L=HLV[b.level-1];setT('bHpT',`Can ${Math.ceil(b.hp)}/${b.maxHp}`);
      const lvTxt=b.level<3?(b.hp<b.maxHp?` Hasarlı, tamir edilene kadar gelişmiyor.`:` ${b.level+1}. seviyeye ${fmt(L.next-b.age)} kaldı (${HLV[b.level].cap} kişilik).`):' En yüksek seviyede.';
      setT('bLv',`${b.level}. seviye`);setT('bNote',`${L.cap} kişilik yer sağlıyor.${lvTxt}`);}
    else if(b.type==='tower')setT('bNote',b.built?'Yaklaşan düşmana ok atar.':'Mühendisler kuleyi yapıyor.');
    else if(GJOB[b.type])setT('bNote',`Mühendisler ${BNAME[b.type].toLowerCase()} yapıyor. Bitince ${GDAT[GJOB[b.type]]} emir verebilirsin.`);
    else setT('bNote',b.type==='house'?'Mühendisler çalışıyor. 30 odun ve 15 taş harcandı, bitince 5 kişilik yer açar.'
      :(b.built?`${b.workers.length}/${FLV[b.level-1].work} çiftçi çalışıyor.${b.level<3?` ${b.level+1}. seviyeye ${fmt(FLV[b.level-1].next-b.age)} kaldı (${FLV[b.level].work} çiftçi).`:' En yüksek seviyede.'}`:'Mühendisler tarlayı hazırlıyor.'));
    if(b.type==='farm'&&b.built)setT('bLv',`${b.level}. seviye`);
  }
}
function stateText(v){
  if(v.state==='recall')return'Ana binaya dönüyor. Sıraya girip yeni meslek alacak.';
  if(v.inside)return'Ana binaya sığındı, tehlike geçince işe döner.';
  if(v.flee)return'Düşmandan kaçıyor';
  if(v.state==='idle')return v.why||'Bekliyor';
  const j=v.job;
  const o=order(j);
  if(v.state==='fight')return'Savaşıyor';
  if(v.state==='return')return{wood:'Odun taşıyor',stone:'Taş taşıyor',food:'Yemek taşıyor'}[v.ct]||'Dönüyor';
  if(j==='asker'&&o==='nobet')return'Köyün etrafında nöbet tutuyor';
  if(v.state==='work'){
    if(o==='testere'||o==='kazma'||o==='saban'||o==='talim')return`${TECH[o].ad} üzerinde çalışıyor`;
    return{kes:'Ağaç kesiyor',dik:'Fidan dikiyor',kir:'Taş kırıyor',guclendir:'Ana binayı güçlendiriyor',hasat:'Tarlada çalışıyor',sur:'Toprağı sürüyor',avlan:'Avlanıyor'}[o]||'Çalışıyor';}
  if(v.state==='build')return v.tgt&&v.tgt.built?'Tamir ediyor':'İnşaat yapıyor';
  return'İşe gidiyor';
}
let hudT=0;
const LITE={asker:'#e07060',ciftci:'#e2bd4f',muhendis:'#6fa6dc',oduncu:'#d0965e',madenci:'#b4bcc4'};
const GPL={asker:'Askerler',ciftci:'Çiftçiler',muhendis:'Mühendisler',oduncu:'Oduncular',madenci:'Madenciler'};
const BSHORT={atolye:'Atölye',kamp:'Kamp',ocak:'Ocak',ciftlik:'Çiftlik',kisla:'Kışla'};
const OICO={ev:'M4 11l8-6 8 6v9H4zM10 20v-5h4v5',tarla:'M4 19h16M5 15h14M7 11l1.5-5M12 11V5M17 11l-1.5-5',kule:'M7 21V9h10v12M6 9V4h2.5v2H11V4h2v2h2.5V4H18v5M11 21v-4h2v4',
  tamir:'M14.5 5.5a4 4 0 00-5 5L4 16l4 4 5.5-5.5a4 4 0 005-5l-2.5 2.5-2.5-1-1-2.5z',kes:'M6 20L16 6M13 4c3 0 6 3 6 6l-4 1-3-3z',dik:'M12 21v-7M12 3c4 3 6 6 6 9a6 6 0 01-12 0c0-3 2-6 6-9z',
  testere:'M3 15l14-8 4 3-14 8zM6.5 14.5l1 1.6M9.5 12.8l1 1.6M12.5 11l1 1.6',kir:'M4 10c4-5 12-5 16 0M12 7.5L6 21',kazma:'M4 10c4-5 12-5 16 0M12 7.5L6 21M17 14l2 2M20 12h2M18 18l1 2',
  guclendir:'M4 20h16M6 20v-7h3v-3h6v3h3v7M10 10V6h4v4',hasat:'M12 21V9M12 9c-3 0-4.5-2-4.5-4.5C10.5 4.5 12 6.5 12 9zm0 0c3 0 4.5-2 4.5-4.5C13.5 4.5 12 6.5 12 9zM12 14c-3 0-4.5-2-4.5-4.5 3 0 4.5 2 4.5 4.5zm0 0c3 0 4.5-2 4.5-4.5-3 0-4.5 2-4.5 4.5z',
  sur:'M3 19h18M5 15h14M8 11l4-7 4 7',saban:'M4 17l9-9 3 3-9 9zM14 7l3-3M3 21l2-2',nobet:'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z',
  talim:'M12 3a9 9 0 100 18 9 9 0 100-18M12 8a4 4 0 100 8 4 4 0 100-8',avlan:'M6 4c8 2 12 6 14 14M6 4l14 14M4 20l6-6'};
const DKS={ev:'Ev',tarla:'Tarla',kule:'Kule',tamir:'Tamir',kes:'Kesim',dik:'Dikim',testere:'Testere',kir:'Taş kır',kazma:'Kazma',guclendir:'Sur',hasat:'Hasat',sur:'Sür',saban:'Saban',nobet:'Nöbet',talim:'Talim',avlan:'Avlan'};
const BACC={atolye:'Atölyeyi',kamp:'Kampı',ocak:'Ocağı',ciftlik:'Çiftliği',kisla:'Kışlayı'};
const OSTAT={kes:'Odun getirir',kir:'Taş getirir',hasat:'Yemek getirir',sur:'Tarlaları büyütür',nobet:'Köyü korur',avlan:'Yemek getirir'};
const svgP=(d,cls,style)=>`<svg class="${cls||'i'}" viewBox="0 0 24 24"${style?` style="${style}"`:''} aria-hidden="true"><path d="${d}"/></svg>`;
const WOODP='M7 8h10a4 4 0 010 8H7a4 4 0 010-8z',STONEP='M4 18l3-8 6-4 6 4 1.5 8z';
let trayJob=null,trayKey='',DOCKH=0,dockBuilt=false;
function buildDock(){
  $('dkCols').innerHTML=ORDER.map(k=>`<div class="col" id="col_${k}"><button class="tok" type="button" data-tok="${k}" aria-label="${JOBS[k].ad}: kapıdan bu meslek çıksın"><svg class="i" viewBox="0 0 24 24" style="color:${LITE[k]}" aria-hidden="true">${JOBS[k].ico}</svg><span class="n" id="cn_${k}">0</span><span class="nm">${JOBS[k].ad}</span></button><button class="ordb" type="button" data-ordb="${k}" aria-label="${JOBS[k].ad} emirleri"><span id="co_${k}"></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></button><span class="badge" id="cb_${k}" hidden>!</span></div>`).join('');
  dockBuilt=true;
}
const mineOf=k=>G.vill.filter(v=>v.job===k&&v.state!=='recall');
const waitWhy=k=>{const v=G.vill.find(v=>v.job===k&&v.state==='idle'&&v.why);return v?v.why:null;};
function updDock(){
  if(!dockBuilt)buildDock();
  DOCKH=door.hidden?0:door.offsetHeight;
  const j=G.job;
  const dj=$('dJob');setT('dJob',j?JOBS[j].ad:'Kapı kapalı');dj.style.color=j?LITE[j]:'';dj.classList.toggle('pulse',!j&&G.queue>0);
  setT('dQ',j?(G.queue?`Sırada ${G.queue} · ${Math.ceil(G.spawnT)} sn`:'Sırada kimse yok'):(G.queue?`Sırada ${G.queue}`:''));
  const fr=j&&G.queue?1-G.spawnT/SPAWN:0,r=$('dRing');r.setAttribute('stroke-dasharray',`${(fr*56.55).toFixed(1)} 57`);r.style.stroke=j?LITE[j]:'';
  for(const k of ORDER){
    const n=mineOf(k).length,c=$('col_'+k);
    setT('cn_'+k,n);c.classList.toggle('sel',j===k);c.classList.toggle('open',trayJob===k);c.classList.toggle('empty',n===0);
    setT('co_'+k,DKS[order(k)]);$('cb_'+k).hidden=!waitWhy(k);
  }
  if(trayJob)placeTray();
}
function placeTray(){
  const t=$('tray'),c=$('col_'+trayJob);if(!c)return;
  t.style.bottom=(DOCKH+8)+'px';
  $('trayIn').style.maxHeight=Math.max(200,innerHeight-DOCKH-110)+'px';
  const cr=c.getBoundingClientRect(),tr=t.getBoundingClientRect();
  $('notch').style.left=clamp(cr.left+cr.width/2-tr.left-7,14,tr.width-28)+'px';
}
function openTray(k){if(!started||G.over)return;trayJob=k;trayKey='';$('tray').hidden=false;updTray();updDock();}
function closeTray(){trayJob=null;$('tray').hidden=true;if(G&&dockBuilt)updDock();}
function locked(k,o){return o!==ORD[k][0].k&&!guild(k);}
function trayStructKey(k){return k+'|'+!!guild(k)+'|'+(k==='muhendis'?['kamp','ocak','ciftlik','kisla'].map(t=>guildAny(t)?1:0).join(''):'')+'|'+!!guildAny(GUILD[k]);}
function buildTray(k){
  const g=GUILD[k],gb=guild(k),list=ORD[k];
  let h=`<div class="tr-h"><div class="tr-t">${svgP('',0,'')}`.replace(svgP('',0,''),`<svg class="i" viewBox="0 0 24 24" style="color:${LITE[k]}" aria-hidden="true">${JOBS[k].ico}</svg>`)+`<b>${GPL[k]}</b><span id="trC"></span></div>`+
    (gb?`<button class="lnk" type="button" data-show="${k}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.5-6-10a6 6 0 0112 0c0 4.5-6 10-6 10zM12 9a2 2 0 100 4 2 2 0 100-4"/></svg>${BACC[g]} göster</button>`:'')+`</div>`;
  h+=`<div class="warn" id="trW" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5M12 16.5v.5M10.3 4.2L2.6 18a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z"/></svg><span id="trWt"></span></div>`;
  h+=`<div class="chips" style="grid-template-columns:repeat(${list.length},minmax(0,1fr))">`+list.map(o=>`<button class="chip" type="button" data-tord="${o.k}" id="ch_${o.k}"><svg class="i" viewBox="0 0 24 24" style="color:${LITE[k]}" aria-hidden="true"><path d="${OICO[o.k]}"/></svg><span class="cl">${o.kisa}</span><span class="cs" id="cs_${o.k}"></span>${o.tech?`<span class="pb"><i id="pb_${o.k}"></i></span>`:''}</button>`).join('')+`</div>`;
  h+=`<p class="desc" id="trD"></p>`;
  if(k==='muhendis'&&gb){
    h+=`<div class="gl-h"><span class="eyebrow">Meslek binaları</span><span>Her biri bir kez yapılır</span></div><div class="gl">`+
      ['kamp','ocak','ciftlik','kisla'].map(t=>`<button class="gt" type="button" data-one="${t}" id="gt_${t}"><b>${BSHORT[t]}</b><span id="gs_${t}"></span><span class="pb" id="gp_${t}" hidden><i id="gpi_${t}"></i></span></button>`).join('')+`</div>`;
  }
  if(!gb){const sp=BSPEC[g];
    h+=`<div class="cta"><div><b>${BNAME[g]} yaptır</b><span id="ctaT"></span></div><button type="button" id="ctaB" data-q="${g}">Sıraya koy</button></div>`;}
  h+=`<div class="tr-f"><button class="rcb" type="button" data-rc="${k}" id="trR"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3"/></svg>Birini kapıya geri çağır</button></div>`;
  $('trayIn').innerHTML=h;
}
function costSpans(sp){
  const mw=G.res.wood<sp.wood,ms=G.res.stone<sp.stone;
  return (sp.wood?`<span class="${mw?'miss':''}"><svg viewBox="0 0 24 24" style="stroke:${mw?'#ffb3a8':'#d0965e'}"><path d="${WOODP}"/></svg>${sp.wood}</span>`:'')+
    (sp.stone?`<span class="${ms?'miss':''}"><svg viewBox="0 0 24 24" style="stroke:${ms?'#ffb3a8':'#b4bcc4'}"><path d="${STONEP}"/></svg>${sp.stone}</span>`:'');
}
function updTray(){
  if(!trayJob||!G)return;
  const k=trayJob,key=trayStructKey(k);
  if(key!==trayKey){trayKey=key;buildTray(k);}
  const g=GUILD[k],cur=order(k),n=mineOf(k).length;
  setT('trC',`${n} kişi`);
  const why=waitWhy(k);$('trW').hidden=!why;if(why)setT('trWt',`Bekliyorlar · ${why.charAt(0).toLowerCase()+why.slice(1)}`);
  for(const o of ORD[k]){
    const el=$('ch_'+o.k),lk=locked(k,o.k);let st,cls='';
    if(lk){st=`<svg viewBox="0 0 24 24" style="stroke:currentColor"><path d="M7 11V8a5 5 0 0110 0v3M5 11h14v9H5z"/></svg>${BSHORT[g]} gerekli`;cls='lock';}
    else if(o.b)st=costSpans(BSPEC[o.b]);
    else if(o.tech){const lv=G.tech[o.tech],T=TECH[o.tech];
      if(lv>=T.max){st='Tamamlandı';cls='done';$('pb_'+o.k).style.width='100%';}
      else{st=`Seviye ${lv} → ${lv+1}`;$('pb_'+o.k).style.width=(G.prog[o.tech]/T.need[lv]*100)+'%';}}
    else if(o.k==='dik'){const m=G.trees.filter(t=>t.sap!=null).length;st=m?`${m} fidan`:'Fidan diker';}
    else if(o.k==='guclendir')st=`+${G.fort*20} can`;
    else if(o.k==='tamir'){const m=G.blds.filter(q=>q.built&&!q.dead&&q.hp<q.maxHp).length;st=m?`${m} hasarlı`:'Hasar yok';}
    else st=OSTAT[o.k]||'';
    el.className='chip'+(cur===o.k&&!lk?' on':'')+(cls?' '+cls:'');
    setH('cs_'+o.k,st);
  }
  const ao=ORD[k].find(q=>q.k===cur);setH('trD',`<b>${ao.ad}</b> · ${ao.acik}`);
  if($('gt_kamp'))for(const t of['kamp','ocak','ciftlik','kisla']){
    const ex=guildAny(t),q=G.oneShot.includes(t),el=$('gt_'+t);
    el.className='gt'+(ex&&ex.built?' have':'')+(q||(ex&&!ex.built)?' q':'');
    setT('gs_'+t,ex?(ex.built?'Var':`%${Math.floor(ex.progress*100)}`):q?'Sırada':'+ Yap');
    $('gp_'+t).hidden=!(ex&&!ex.built);if(ex&&!ex.built)$('gpi_'+t).style.width=ex.progress*100+'%';
  }
  if($('ctaB')){const ex=guildAny(g),q=G.oneShot.includes(g),sp=BSPEC[g];
    setT('ctaT',ex?`Mühendisler yapıyor · %${Math.floor(ex.progress*100)}`:q?'Sırada, mühendisler malzeme bekliyor olabilir':`Diğer emirleri açar · ${costTxt(sp)}`);
    const b=$('ctaB');b.disabled=!!ex||q;setT('ctaB',ex?'Yapılıyor':q?'Sırada':'Sıraya koy');}
  $('trR').disabled=n===0;
  placeTray();
}
$('dkCols').addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t||!started||G.over)return;
  if(t.dataset.tok){const k=t.dataset.tok;G.job=G.job===k?null:k;updDock();}
  else if(t.dataset.ordb){const k=t.dataset.ordb;closeSheet();trayJob===k?closeTray():openTray(k);}
});
$('tray').addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t||!trayJob)return;const k=trayJob;
  if(t.dataset.tord){const o=t.dataset.tord;
    if(locked(k,o)){toast(`${ORD[k].find(q=>q.k===o).ad} için önce ${BNAME[GUILD[k]].toLowerCase()} gerekli.`);return;}
    G.orders[k]=o;}
  else if(t.dataset.show){const b=guild(k);if(b){centerOn(b.x+b.w/2,b.y+b.h/2+3);clampCam();}}
  else if(t.dataset.one){const x=t.dataset.one,i=G.oneShot.indexOf(x);if(guildAny(x))return;if(i>=0)G.oneShot.splice(i,1);else G.oneShot.push(x);}
  else if(t.dataset.q){const x=t.dataset.q;if(!guildAny(x)&&!G.oneShot.includes(x)){G.oneShot.push(x);toast(`${BNAME[x]} sıraya kondu. Mühendisler malzeme bulunca yapacak.`);}}
  else if(t.dataset.rc)recallOne(k);
  updTray();updDock();
});
function hud(dt){
  if(!G)return;
  setT('rFood',Math.floor(G.res.food));setT('rWood',Math.floor(G.res.wood));setT('rStone',Math.floor(G.res.stone));setT('rPop',`${pop()}/${cap()}`);
  $('pFood').classList.toggle('low',G.res.food<15);
  $('wave').hidden=!G.raids;setT('waveT',`Dalga ${G.wave+1} · ${fmt(G.waveT)}`);$('wave').classList.toggle('soon',G.waveT<10);
  $('toasts').style.top=`calc(env(safe-area-inset-top,0px) + ${G.raids?100:64}px)`;
  updDock();
  hudT-=dt;if(hudT<=0){hudT=.2;updSheet();updTray();}
}

function gameOver(title,sub){
  G.over=true;clearSave();closeSheet();door.hidden=true;
  setT('oTitle',title);setT('oSub',sub);setT('sTime',fmt(G.t));setT('sWave',Math.max(0,G.wave-(G.foes.length?1:0)));setT('sPop',G.maxPop);setT('sKill',G.kills);
  $('over').hidden=false;
}
