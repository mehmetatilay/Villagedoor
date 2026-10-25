"use strict";
/* ---------- save / load ---------- */
const SKEY='koy-kapisi-kayit-v1';
const r2=n=>Math.round(n*100)/100;
function saveGame(){
  if(!G||!started||G.over)return;
  const c=s2w(W/2,H/2);
  const d={v:1,n:N,grown:G.grown,seed:G.seed,t:G.t,res:G.res,queue:G.queue,job:G.job,spawnT:G.spawnT,birthT:G.birthT,wave:G.wave,waveT:G.waveT,kills:G.kills,maxPop:G.maxPop,uid,names:G.names,hints:G.hints,
    mah:G.mah,roads:G.wear.reduce((a,w,i)=>(w>=1||G.road[i])?(a.push([i,G.road[i],Math.round(w),G.keep[i]]),a):a,[]),
    raids:G.raids,orders:G.orders,oneShot:G.oneShot,tech:G.tech,prog:G.prog,fort:G.fort,
    trees:G.trees.map(t=>[t.x,t.y,t.wood,r2(t.v),t.pine?1:0,t.sap==null?-1:r2(t.sap)]),rocks:G.rocks.map(r=>[r.x,r.y,r.stone,r2(r.v)]),
    blds:G.blds.map(b=>({type:b.type,x:b.x,y:b.y,w:b.w,h:b.h,hp:r2(b.hp),maxHp:b.maxHp,built:b.built,progress:r2(b.progress),need:b.need,level:b.level||1,age:r2(b.age||0),door:b.door||'r',m:b.m??null})),
    vill:G.vill.map(v=>({id:v.id,name:v.name,job:v.job,x:r2(v.x),y:r2(v.y),hp:r2(v.hp),carry:v.carry,ct:v.ct,home:v.home,sleep:v.sleep?1:0})),
    kids:G.kids.map(k=>({id:k.id,x:r2(k.x),y:r2(k.y),home:k.home,age:r2(k.age),c:k.c,sleep:k.sleep?1:0})),
    foes:G.foes.map(e=>({kind:e.kind,x:r2(e.x),y:r2(e.y),hp:r2(e.hp),maxHp:e.maxHp,sp:e.sp,dmg:e.dmg,rate:e.rate})),
    cam:{x:r2(c.x),y:r2(c.y),z:r2(Z)},speed,saved:Date.now()};
  try{localStorage.setItem(SKEY,JSON.stringify(d));}catch(_){}
}
function readSave(){try{const d=JSON.parse(localStorage.getItem(SKEY)||'null');return d&&d.v===1&&Array.isArray(d.blds)?d:null;}catch(_){return null;}}
function clearSave(){try{localStorage.removeItem(SKEY);}catch(_){}}
// 48 karelik eski haritanın kaydı: her şeyi yeni haritanın ortasına kaydır.
function migrateSize(d){
  const n=d.n||48,o=(N-n)/2;if(!o)return;
  const mv=k=>k&&k!=='main'?k.split(',').map(Number).map(c=>c+o).join(','):k;
  for(const t of d.trees){t[0]+=o;t[1]+=o;}for(const r of d.rocks){r[0]+=o;r[1]+=o;}
  for(const a of[d.blds,d.vill,d.foes,d.kids||[],d.mah||[]])for(const e of a){e.x+=o;e.y+=o;}
  for(const e of[...d.vill,...(d.kids||[])])e.home=mv(e.home);
  if(d.roads)for(const r of d.roads){const x=r[0]%n,y=Math.floor(r[0]/n);r[0]=(y+o)*N+x+o;}
  if(d.cam){d.cam.x+=o;d.cam.y+=o;}d.n=N;
}
function loadGame(d){
  try{
    migrateSize(d);
    uid=d.uid||0;
    G={seed:d.seed,t:d.t,res:d.res,queue:d.queue,vill:[],foes:[],trees:[],rocks:[],blds:[],job:d.job,spawnT:d.spawnT,birthT:d.birthT,
       wave:d.wave,waveT:d.waveT,over:false,needFarm:false,needFarmPrev:false,floaters:[],occ:new Uint8Array(N*N),road:new Uint8Array(N*N),keep:new Uint8Array(N*N),wear:new Float32Array(N*N),mah:Array.isArray(d.mah)?d.mah:[],kids:[],grown:d.grown||0,kills:d.kills,maxPop:d.maxPop,hints:d.hints||{},names:d.names||NAMES.slice()};
    Object.assign(G,freshMeta());for(const k of['orders','tech','prog'])Object.assign(G[k],d[k]||{});G.raids=!!d.raids;G.fort=d.fort||0;G.oneShot=Array.isArray(d.oneShot)?d.oneShot:[];
    for(const t of d.trees){G.trees.push({x:t[0],y:t[1],wood:t[2],users:0,v:t[3],pine:!!t[4],sap:t[5]>=0?t[5]:null});G.occ[t[1]*N+t[0]]=1;}
    for(const r of d.rocks){G.rocks.push({x:r[0],y:r[1],stone:r[2],users:0,v:r[3]});G.occ[r[1]*N+r[0]]=2;}
    for(const o of d.blds){const b=Object.assign({workers:[],dead:false,hitT:0},o);G.blds.push(b);markOcc(b.x,b.y,b.w,b.h,3);if(b.type==='main')G.main=b;}
    if(!G.main)throw 0;
    if(!d.oneShot&&!G.blds.some(b=>b.type==='atolye'))G.oneShot=['atolye'];
    markOcc(MAIN.x+MAIN.w,MAIN.y+1,5,2,4);
    for(const[i,s,w,k]of d.roads||[]){G.road[i]=s;G.wear[i]=w;G.keep[i]=k?1:0;}
    doorYard();
    if(!G.mah.length){ // yollardan önceki kayıt: evleri tek mahallede topla
      const hs=G.blds.filter(b=>b.type==='house');
      if(hs.length){G.mah.push({id:0,name:MNAMES[0],x:hs.reduce((s,b)=>s+b.x+1,0)/hs.length,y:hs.reduce((s,b)=>s+b.y+1,0)/hs.length});
        for(const b of hs)b.m=0;linkToRoad(G.mah[0].x,G.mah[0].y);}
      else foundDistrict();
      for(const b of G.blds)if(b.type!=='main'){const f=doorTile(b);linkToRoad(f.x,f.y);}}
    for(const o of d.vill){const v=mkV(o.job);Object.assign(v,{id:o.id,name:o.name,x:o.x,y:o.y,hp:Math.min(o.hp,v.maxHp),carry:o.carry||0,ct:o.ct||null,home:o.home||null,sleep:!!o.sleep,bed:!!o.sleep});
      if(!v.home)giveHome(v);G.vill.push(v);}
    for(const o of d.kids||[])G.kids.push({id:o.id,x:o.x,y:o.y,home:o.home||'main',age:o.age||0,c:o.c||KIDC[0],sc:.68,face:1,walk:0,wx:null,wy:null,pause:0,sleep:!!o.sleep});
    for(const o of d.foes){const e=mkFoe(o.kind,o.x,o.y,1);Object.assign(e,{hp:o.hp,maxHp:o.maxHp,sp:o.sp,dmg:o.dmg,rate:o.rate});G.foes.push(e);}
    ground=buildGround();
    Z=clamp(d.cam?.z||Z,ZMIN,ZMAX);centerOn(d.cam?.x??CX+1,d.cam?.y??CY+1);
    speed=d.speed===2?2:1;setT('bSpeed',`Oyun hızı: ${speed}×`);
    closeSheet();return true;
  }catch(_){clearSave();newGame();return false;}
}
