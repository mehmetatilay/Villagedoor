"use strict";
/* ---------- update ---------- */
function update(dt){
  G.t+=dt;
  const p=pop();
  G.res.food=Math.max(0,G.res.food-p*dt/(isNight()?36:18)); // uyuyan az yer
  G.birthT-=dt;
  if(G.birthT<=0){G.birthT=9;
    if(p<cap()&&G.res.food>=15){G.res.food-=15;bornKid();}}
  if(G.job&&G.queue>0&&!isNight()){G.spawnT-=dt;if(G.spawnT<=0){G.spawnT=SPAWN;G.queue--;const v=mkV(G.job);giveHome(v);G.vill.push(v);}}
  else G.spawnT=SPAWN;

  G.needFarmPrev=G.needFarm;G.needFarm=false;
  let si=0;for(const v of G.vill)if(v.job==='asker'&&v.state!=='recall')v.sidx=si++;G._sold=si;
  for(const v of G.vill){updateV(v,dt);if(v.moving)wearStep(v,dt);}
  fadeWear(dt);
  for(const k of G.kids)updateKid(k,dt);
  for(const e of G.foes)updateE(e,dt);
  G.vill=G.vill.filter(v=>!v.dead&&!v.gone);
  if(G.kids.some(k=>k.gone))G.kids=G.kids.filter(k=>!k.gone);
  G.homeT=(G.homeT||0)-dt;if(G.homeT<=0){G.homeT=2;rehome();}
  if(darkness()>.3)hint('night','Akşam oldu. Köylüler evlerine dönüyor, sabah işlerine çıkacaklar.',1e9);
  G.foes=G.foes.filter(e=>!e.dead);
  if(G.trees.some(t=>t.dead))G.trees=G.trees.filter(t=>!t.dead);
  if(G.rocks.some(r=>r.dead))G.rocks=G.rocks.filter(r=>!r.dead);
  if(G.blds.some(b=>b.dead))G.blds=G.blds.filter(b=>!b.dead);
  for(const b of G.blds){if(b.hitT>0)b.hitT-=dt;
    if((b.type==='house'||b.type==='farm')&&b.built&&b.level<3&&b.hp>=b.maxHp){b.age+=dt;const T=b.type==='house'?HLV:FLV;
      if(b.age>=T[b.level-1].next){b.age=0;b.level++;const L=T[b.level-1];b.hp+=L.hp-b.maxHp;b.maxHp=L.hp;
        floatAt(b.x+b.w/2,b.y+b.h/2,b.type==='house'?`${HNAME[b.level-2]} ${HNAME[b.level-1].toLowerCase()} oldu · ${L.cap} kişilik`:`Tarla ${b.level}. seviye · ${L.work} çiftçi`,'#e3b54f');
        hint('lvl','Bir bina gelişti. Evler ve tarlalar hasarsız kaldıkça zamanla büyür.',9999);}}}

  for(const t of G.trees)if(t.sap!=null){t.sap+=dt/60;if(t.sap>=1){t.sap=null;t.wood=30;}}
  for(const b of G.blds)if(b.type==='tower'&&b.built){b.cd=(b.cd||0)-dt;
    if(b.cd<=0&&G.foes.length){const e=nearest(G.foes,b.x+.5,b.y+.5,6.5);if(e){b.cd=1.2;hitFoe(e,10);G.shots.push({x:b.x+.5,y:b.y+.5,ex:e.x,ey:e.y,t:0});}}}
  for(const sh of G.shots)sh.t+=dt;G.shots=G.shots.filter(sh=>sh.t<.25);
  if(G.raids){G.waveT-=dt;if(G.waveT<=0){spawnWave();G.waveT=Math.max(57,93-G.wave*3);}}
  for(const f of G.floaters)f.t+=dt;G.floaters=G.floaters.filter(f=>f.t<1.6);
  G.maxPop=Math.max(G.maxPop,pop());

  if(G.t>6){
    if(G.res.food<=0)hint('food','Yemek bitti, nüfus artmıyor. Kapıdan çiftçi çıkar.',45,'danger');
    else if(pop()>=cap())hint('cap',guild('muhendis')?'Nüfus sınırı doldu. Atölyeden mühendislere “Ev yap” emri ver.':'Nüfus sınırı doldu. Mühendisler ev yaparsa yeni yer açılır.',60);
    const idleEng=G.vill.find(v=>v.job==='muhendis'&&v.state==='idle'&&v.why&&/lazım|eksik/.test(v.why));
    if(idleEng)hint('cost',`Mühendis bekliyor: ${idleEng.why.charAt(0).toLowerCase()+idleEng.why.slice(1)}.`,40);
    if(G.needFarmPrev)hint('farm','Çiftçiler için boş tarla yok. Atölyeden mühendislere “Tarla yap” emri ver.',50);
  }
  if(!G.over&&pop()===0&&G.res.food<15)gameOver('Köy boşaldı','Köyde kimse kalmadı.');
}
