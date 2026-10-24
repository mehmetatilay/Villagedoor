"use strict";
/* ---------- helpers ---------- */
const pop=()=>G.vill.length+G.queue;
const cap=()=>10+G.blds.reduce((s,b)=>s+(b.type==='house'&&b.built&&!b.dead?HLV[b.level-1].cap:0),0);
function floatAt(x,y,txt,col){G.floaters.push({x,y,txt,col:col||'#efe6d1',t:0});}
function hint(key,msg,cool,kind){if(G.t>=(G.hints[key]??-1)){G.hints[key]=G.t+cool;toast(msg,kind);}}
function moveTo(e,tx,ty,dt,sp){
  const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy);
  if(d<.06)return true;
  const st=Math.min(d,sp*dt);e.x+=dx/d*st;e.y+=dy/d*st;e.walk=(e.walk||0)+dt;e.moving=true;
  const sx=dx-dy;if(Math.abs(sx)>.01)e.face=sx>0?1:-1;
  return false;
}
function face(e,tx,ty){const sx=(tx-e.x)-(ty-e.y);if(Math.abs(sx)>.01)e.face=sx>0?1:-1;}
function mkV(job){
  const s=job==='asker';
  return{id:++uid,name:G.names[uid%G.names.length],x:DOOR.x,y:DOOR.y+(Math.random()-.5)*.2,job,state:'seek',hp:s?soldierHp():30,maxHp:s?soldierHp():30,sp:s?1.9:1.6,
    carry:0,ct:null,tgt:null,timer:0,ox:Math.random()-.5,oy:Math.random()-.5,face:1,walk:0,atk:0,hitT:0,lastHit:99,wx:null,wy:null,pause:0};
}
function release(v){
  if(v.pt){const i=v.pt.y*N+v.pt.x;if(G.occ[i]===5)G.occ[i]=0;v.pt=null;}
  const t=v.tgt;
  if(t){if(t.users!=null)t.users=Math.max(0,t.users-1);if(t.workers){const i=t.workers.indexOf(v.id);if(i>=0)t.workers.splice(i,1);}}
  v.tgt=null;
}
function deposit(v){
  if(v.carry>0){G.res[v.ct]+=v.carry;const lab={wood:'odun',stone:'taş',food:'yemek'}[v.ct],col={wood:'#d9a06a',stone:'#c3cbd2',food:'#ecc95a'}[v.ct];
    floatAt(v.x,v.y-.2,`+${v.carry} ${lab}`,col);v.carry=0;}
}
function recall(v){if(!v||v.dead||v.gone||v.state==='recall')return;release(v);v.state='recall';v.why=null;v.flee=false;if(v.inside){v.inside=false;v.gone=true;G.queue++;}}
function recallOne(job){
  let best=null,bd=1e9;
  for(const v of G.vill){if(v.job!==job||v.state==='recall'||v.dead)continue;const d=Math.hypot(v.x-DOOR.x,v.y-DOOR.y);if(d<bd){bd=d;best=v;}}
  if(best)recall(best);
}

/* ---------- villagers ---------- */
const soldierHp=()=>Math.round(60*(1+.25*G.tech.talim));
const soldierDmg=()=>8*(1+.25*G.tech.talim);
const spd=k=>1+.4*G.tech[k];
const guild=job=>G.blds.find(b=>b.type===GUILD[job]&&b.built&&!b.dead)||null;
const guildAny=t=>G.blds.find(b=>b.type===t&&!b.dead)||null;
const front=b=>({x:b.x+b.w+.35,y:b.y+b.h*.6});
function order(job){const o=G.orders[job],def=ORD[job][0].k;if(o===def)return o;return guild(job)?o:def;}
function dropPt(v){const g=guild(v.job);if(g){const f=front(g);if(Math.hypot(f.x-v.x,f.y-v.y)<Math.hypot(DOOR.x-v.x,DOOR.y-v.y))return f;}return DOOR;}
function returning(v,dt){if(!v.dp)v.dp=dropPt(v);if(moveTo(v,v.dp.x,v.dp.y,dt,v.sp)){deposit(v);v.dp=null;return true;}return false;}
function goIdle(v,why,t){v.state='idle';v.timer=t||3;v.why=why;}
function nearest(list,x,y,maxD){let best=null,bd=maxD*maxD;for(const o of list){const d=(o.x-x)**2+(o.y-y)**2;if(d<bd){bd=d;best=o;}}return best;}
function wander(v,dt){
  if(v.wx==null||Math.hypot(v.wx-v.x,v.wy-v.y)<.1){
    if(v.pause>0)v.pause-=dt;
    else{const a=Math.random()*Math.PI*2,r=3.4+Math.random()*1.4;v.wx=CX+Math.cos(a)*r;v.wy=CY+Math.sin(a)*r;v.pause=1+Math.random()*2;}
  }else moveTo(v,v.wx,v.wy,dt,v.sp*.55);
  v.timer-=dt;if(v.timer<=0){v.state='seek';v.why=null;v.wx=null;}
}
function gather(v,dt,list,key,amt,time,rk){
  if(v.state==='return'){if(returning(v,dt))v.state='seek';return;}
  if(v.state==='idle'){wander(v,dt);return;}
  if(v.state==='seek'){
    let best=null,bd=1e9;
    for(const o of list){if(o.dead||o.sap!=null||o[key]<=0||o.users>=2)continue;const d=(o.x+.5-v.x)**2+(o.y+.5-v.y)**2;if(d<bd){bd=d;best=o;}}
    if(!best){goIdle(v,key==='wood'?'Kesilecek ağaç kalmadı. Oduncu kampından ağaç diktir.':'Kırılacak kaya kalmadı',4);return;}
    v.tgt=best;best.users++;v.state='go';
  }
  const o=v.tgt;
  if(!o||o.dead){release(v);v.state='seek';return;}
  if(v.state==='go'){if(moveTo(v,o.x+1.05+v.ox*.3,o.y+.8+v.oy*.4,dt,v.sp)){v.state='work';v.timer=time;}return;}
  if(v.state==='work'){
    face(v,o.x+.5,o.y+.5);v.timer-=dt;
    if(v.timer<=0){const take=Math.min(amt,o[key]);o[key]-=take;v.carry=take;v.ct=rk;release(v);
      if(o[key]<=0){o.dead=true;G.occ[o.y*N+o.x]=0;}v.state='return';}
  }
}
function plant(v,dt){
  if(v.state==='return'){if(returning(v,dt))v.state='seek';return;}
  if(v.state==='idle'){wander(v,dt);return;}
  const k=guild('oduncu');if(!k){v.state='seek';return;}
  if(v.state==='seek'){
    if(v.carry>0){v.state='return';return;}
    let spot=null;
    for(let i=0;i<90&&!spot;i++){const a=Math.random()*Math.PI*2,r=1.8+Math.random()*5.5;const x=Math.floor(k.x+1+Math.cos(a)*r),y=Math.floor(k.y+1+Math.sin(a)*r);
      if(x<1||y<1||x>N-2||y>N-2||G.occ[y*N+x])continue;if(Math.hypot(x+.5-CX,y+.5-CY)<5.5)continue;spot={x,y};}
    if(!spot){goIdle(v,'Kampın çevresinde fidan dikecek boş yer yok',4);return;}
    G.occ[spot.y*N+spot.x]=5;v.pt=spot;v.state='go';
  }
  const p=v.pt;if(!p){v.state='seek';return;}
  if(v.state==='go'){if(moveTo(v,p.x+1.05,p.y+.8,dt,v.sp)){v.state='work';v.timer=3;}return;}
  if(v.state==='work'){face(v,p.x+.5,p.y+.5);v.timer-=dt;
    if(v.timer<=0){G.occ[p.y*N+p.x]=0;addTree(p.x,p.y);const t=G.trees[G.trees.length-1];t.wood=0;t.sap=0;v.pt=null;v.state='seek';}}
}
function research(v,dt,key){
  if(v.state==='return'){if(returning(v,dt))v.state='seek';return;}
  if(v.state==='idle'){wander(v,dt);return;}
  const T=TECH[key],b=guild(v.job);if(!b){v.state='seek';return;}
  if(G.tech[key]>=T.max){goIdle(v,`${T.ad} en yüksek seviyede. Başka emir ver.`,4);return;}
  if(v.state==='seek'){if(v.carry>0){v.state='return';return;}v.state='go';}
  if(v.state==='go'){const f=front(b);if(moveTo(v,f.x+v.ox*.5,f.y+v.oy*1.3,dt,v.sp))v.state='work';return;}
  if(v.state==='work'){face(v,b.x+b.w/2,b.y+b.h/2);G.prog[key]+=dt;
    if(G.prog[key]>=T.need[G.tech[key]]){G.prog[key]=0;G.tech[key]++;
      if(key==='talim')for(const q of G.vill)if(q.job==='asker'){const m=soldierHp();q.hp+=m-q.maxHp;q.maxHp=m;}
      toast(`${T.ad} ${G.tech[key]}. seviyeye çıktı, ${T.eff}.`);floatAt(b.x+b.w/2,b.y+b.h/2,`${T.ad} ${G.tech[key]}. seviye`,'#e3b54f');}}
}
function farmer(v,dt,till){
  if(v.state==='idle'){G.needFarm=true;wander(v,dt);return;}
  if(v.state==='return'){if(returning(v,dt))v.state=(v.tgt&&!v.tgt.dead)?'go':'seek';return;}
  if(v.state==='seek'){
    const f=G.blds.find(b=>b.type==='farm'&&b.built&&!b.dead&&b.workers.length<FLV[b.level-1].work&&(!till||b.level<3));
    if(!f){if(till)goIdle(v,'Bütün tarlalar en yüksek seviyede');else{goIdle(v,'Boş tarla yok. Atölyeden tarla yaptır.');G.needFarm=true;}return;}
    v.slot=[0,1,2,3].find(i=>!f.workers.some(id=>{const w=G.vill.find(q=>q.id===id);return w&&w.slot===i;}))??0;
    f.workers.push(v.id);v.tgt=f;v.state='go';
  }
  const f=v.tgt;if(!f||f.dead){release(v);v.state='seek';return;}
  if(v.state==='go'){if(moveTo(v,f.x+FSLOT[v.slot][0],f.y+FSLOT[v.slot][1],dt,v.sp)){v.state='work';v.timer=7/spd('saban');}return;}
  if(v.state==='work'){v.timer-=dt;if(v.timer<=0){
    if(till){if(f.level<3&&f.hp>=f.maxHp){f.age+=12;floatAt(f.x+1,f.y+1,'Toprak sürüldü','#d9b443');}
      if(f.level>=3){release(v);v.state='seek';}else v.timer=7/spd('saban');}
    else{v.carry=5;v.ct='food';v.state='return';}}}
}
function createSite(type){
  const sp=BSPEC[type];if(G.res.wood<sp.wood||G.res.stone<sp.stone)return null;
  let s=null;
  if(type==='kamp'){const t=nearest(G.trees.filter(t=>t.sap==null),CX,CY,18);if(t)s=findSpot(2,2,1,5,t.x,t.y);}
  else if(type==='ocak'){const r=nearest(G.rocks,CX,CY,18);if(r)s=findSpot(2,2,1,5,r.x,r.y);}
  if(!s)s=findSpot(sp.w,sp.h,type==='farm'?3.6:type==='tower'?4:4.2,15);
  if(!s)return null;
  G.res.wood-=sp.wood;G.res.stone-=sp.stone;
  const b=mkB(type,s.x,s.y,false);G.blds.push(b);return b;
}
function engineer(v,dt){
  if(v.state==='idle'){wander(v,dt);return;}
  if(v.state==='seek'){
    let s=null,bd=1e9;
    for(const b of G.blds){if(b.dead||b.built)continue;const d=(b.x-v.x)**2+(b.y-v.y)**2;if(d<bd){bd=d;s=b;}}
    while(!s&&G.oneShot.length&&guildAny(G.oneShot[0]))G.oneShot.shift();
    if(!s&&G.oneShot.length){const t=G.oneShot[0];s=createSite(t);
      if(s)G.oneShot.shift();else{goIdle(v,`${BNAME[t].toLowerCase()} için ${missTxt(BSPEC[t])} eksik`);return;}}
    if(!s){const o=order('muhendis');
      if(o==='tamir'){bd=1e9;for(const b of G.blds){if(b.dead||!b.built||b.hp>=b.maxHp)continue;const d=(b.x-v.x)**2+(b.y-v.y)**2;if(d<bd){bd=d;s=b;}}
        if(!s){goIdle(v,'Onarılacak hasarlı bina yok');return;}}
      else{const t=ORD.muhendis.find(q=>q.k===o).b,sp=BSPEC[t];s=createSite(t);
        if(!s){goIdle(v,G.res.wood>=sp.wood&&G.res.stone>=sp.stone?'Yapacak boş yer kalmadı':`${BNAME[t].toLowerCase()} için ${missTxt(sp)} eksik`);return;}}}
    v.tgt=s;v.state='go';v.side=Math.random()<.5;
  }
  const b=v.tgt;if(!b||b.dead){v.tgt=null;v.state='seek';return;}
  if(v.state==='go'){
    const tx=v.side?b.x+b.w+.3:b.x+b.w*.5+v.ox*.8,ty=v.side?b.y+b.h*.5+v.oy*.8:b.y+b.h+.3;
    if(moveTo(v,tx,ty,dt,v.sp))v.state='build';return;
  }
  if(v.state==='build'){
    face(v,b.x+b.w/2,b.y+b.h/2);
    if(!b.built){
      b.progress+=dt/b.need;b.hp=Math.min(b.maxHp,b.hp+b.maxHp*.7*dt/b.need);
      if(b.progress>=1){b.progress=1;b.built=true;b.hp=b.maxHp;
        floatAt(b.x+b.w/2,b.y+b.h/2,b.type==='house'?'Ev hazır · +5 yer':`${BNAME[b.type]} hazır`,'#e3b54f');
        if(GJOB[b.type])toast(b.type==='atolye'?'Mühendis Atölyesi hazır. Atölyeye dokunup mühendislere ne yapacaklarını söyle, diğer meslek binalarını da buradan yaptır.'
          :`${BNAME[b.type]} hazır. Binaya dokunup ${GDAT[GJOB[b.type]]} emir verebilirsin.`);
        v.tgt=null;v.state='seek';}
    }else{b.hp+=10*dt;if(b.hp>=b.maxHp){b.hp=b.maxHp;v.tgt=null;v.state='seek';}}
  }
}
function fortify(v,dt){
  if(v.state==='return'){if(returning(v,dt))v.state='seek';return;}
  if(v.state==='idle'){wander(v,dt);return;}
  if(v.state==='seek'){
    if(v.carry>0){v.state='return';return;}
    if(G.fort>=FORTMAX){goIdle(v,'Ana bina en sağlam hâlinde. Başka emir ver.',4);return;}
    if(G.res.stone<5){goIdle(v,'Güçlendirmek için 5 taş lazım');return;}
    v.state='go';v.side=Math.random()<.5;
  }
  const b=G.main;
  if(v.state==='go'){const tx=v.side?b.x+v.oy*.8+1.5:b.x+b.w*.5+v.ox*1.4,ty=v.side?b.y-.35:b.y+b.h+.35;
    if(moveTo(v,tx,ty,dt,v.sp)){v.state='work';v.timer=4/spd('kazma');}return;}
  if(v.state==='work'){face(v,b.x+1.5,b.y+1.5);v.timer-=dt;
    if(v.timer<=0){if(G.res.stone>=5&&G.fort<FORTMAX){G.res.stone-=5;G.fort++;b.maxHp+=20;b.hp+=20;floatAt(b.x+1.5,b.y+1.5,'+20 can','#c3cbd2');}v.state='seek';}}
}
function hunt(v,dt){
  if(v.state==='return'){if(returning(v,dt))v.state='seek';return;}
  if(v.state==='seek'||v.state==='guard'){const a=Math.random()*Math.PI*2,r=10+Math.random()*6;v.hx=clamp(CX+Math.cos(a)*r,2,N-2);v.hy=clamp(CY+Math.sin(a)*r,2,N-2);v.state='go';}
  if(v.state==='go'){if(moveTo(v,v.hx,v.hy,dt,v.sp)){v.state='work';v.timer=8;}return;}
  if(v.state==='work'){v.timer-=dt;if(v.timer<=0){v.carry=6;v.ct='food';v.state='return';}}
}
function fightNear(v,dt,range,center){
  if(!G.foes.length)return false;
  let foe=null,bd=1e9;
  for(const e of G.foes){if(e.dead)continue;const d=dist(e,v),dc=Math.hypot(e.x-CX,e.y-CY);if((d<range||(center&&dc<12))&&d<bd){bd=d;foe=e;}}
  if(!foe)return false;
  if(v.state!=='fight'){release(v);v.state='fight';}
  if(bd>.55)moveTo(v,foe.x,foe.y,dt,v.sp);
  else{face(v,foe.x,foe.y);v.atk-=dt;if(v.atk<=0){v.atk=.8;hitFoe(foe,soldierDmg());}}
  return true;
}
function soldier(v,dt){
  v.state='guard';
  const n=G._sold,i=v.sidx,a=i/Math.max(1,n)*Math.PI*2+.7,r=3.7+(n>8?(i%2)*1.3:0);
  moveTo(v,CX+Math.cos(a)*r,CY+Math.sin(a)*r,dt,v.sp*.8);
  v.hp=Math.min(v.maxHp,v.hp+dt*1.5);
}
function updateV(v,dt){
  if(v.hitT>0)v.hitT-=dt;
  v.moving=false;v.lastHit+=dt;
  if(v.lastHit>4&&v.hp<v.maxHp&&v.job!=='asker')v.hp=Math.min(v.maxHp,v.hp+dt*2);
  if(v.state==='recall'){if(moveTo(v,DOOR.x,DOOR.y,dt,v.sp*1.15)){deposit(v);v.gone=true;G.queue++;}return;}
  if(v.job!=='asker'){
    if(v.inside){if(!G.foes.some(e=>Math.hypot(e.x-CX,e.y-CY)<10)){v.inside=false;v.flee=false;v.state='seek';v.x=DOOR.x;v.y=DOOR.y;}return;}
    if(!v.flee&&G.foes.some(e=>dist(e,v)<3.2)){v.flee=true;release(v);}
    if(v.flee){if(moveTo(v,DOOR.x,DOOR.y,dt,v.sp*1.25)){deposit(v);v.inside=true;}return;}
  }
  const o=order(v.job);
  if(v.ord!==o){if(v.ord!=null&&v.state!=='return'){release(v);v.state='seek';v.why=null;v.wx=null;}v.ord=o;}
  switch(v.job){
    case 'oduncu':o==='dik'?plant(v,dt):o==='testere'?research(v,dt,'testere'):gather(v,dt,G.trees,'wood',5,3.2/spd('testere'),'wood');break;
    case 'madenci':o==='kazma'?research(v,dt,'kazma'):o==='guclendir'?fortify(v,dt):gather(v,dt,G.rocks,'stone',4,4.2/spd('kazma'),'stone');break;
    case 'ciftci':o==='saban'?research(v,dt,'saban'):farmer(v,dt,o==='sur');break;
    case 'muhendis':engineer(v,dt);break;
    case 'asker':
      if(fightNear(v,dt,o==='nobet'?8:4,o==='nobet'))break;
      if(v.state==='fight')v.state='seek';
      if(o==='nobet')soldier(v,dt);else if(o==='talim')research(v,dt,'talim');else hunt(v,dt);
      break;
  }
}
