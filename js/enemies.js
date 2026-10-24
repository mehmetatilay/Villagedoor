"use strict";
/* ---------- enemies ---------- */
function mkFoe(kind,x,y,n){
  const k=1+.07*(n-1);
  const e=kind==='wolf'?{kind,hp:22*k,sp:2.2,dmg:4,rate:1}:{kind,hp:50*k,sp:1.45,dmg:9,rate:1};
  const a=Math.random()*Math.PI*2;
  return Object.assign(e,{x,y,maxHp:e.hp,atk:0,rt:0,tgt:null,face:1,walk:0,hitT:0,ox:Math.cos(a)*4,oy:Math.sin(a)*4,dead:false});
}
function spawnWave(){
  const n=++G.wave,wolves=n<=3?n+1:2+Math.floor(n/3),raiders=n<3?0:(n-2)+Math.floor(n/4);
  const side=Math.floor(Math.random()*4),r=12+Math.random()*24;
  const base=[{x:1.5,y:r},{x:r,y:1.5},{x:N-1.5,y:r},{x:r,y:N-1.5}][side];
  const j=()=>(Math.random()-.5)*3;
  for(let i=0;i<wolves;i++)G.foes.push(mkFoe('wolf',clamp(base.x+j(),1,N-1),clamp(base.y+j(),1,N-1),n));
  for(let i=0;i<raiders;i++)G.foes.push(mkFoe('raider',clamp(base.x+j(),1,N-1),clamp(base.y+j(),1,N-1),n));
  const parts=[];if(wolves)parts.push(`${wolves} kurt`);if(raiders)parts.push(`${raiders} akıncı`);
  toast(`${n}. dalga: ${parts.join(' ve ')} ${SIDES[side]} geliyor!`,'danger');
}
function pickTarget(e){
  let best=null,bd=1e9;
  if(e.kind==='wolf'){for(const v of G.vill){if(v.dead||v.gone||v.inside)continue;const d=dist(e,v);if(d<18&&d<bd){bd=d;best=v;}}return best;}
  for(const v of G.vill){if(v.dead||v.gone||v.inside)continue;const d=dist(e,v),lim=v.job==='asker'?3:1.6;if(d<lim&&d<bd){bd=d;best=v;}}
  if(best)return best;
  for(const b of G.blds){if(b.dead||b.type==='farm')continue;const d=Math.hypot(clamp(e.x,b.x,b.x+b.w)-e.x,clamp(e.y,b.y,b.y+b.h)-e.y);if(d<bd){bd=d;best=b;}}
  return best;
}
function updateE(e,dt){
  e.atk-=dt;if(e.hitT>0)e.hitT-=dt;e.moving=false;
  e.rt-=dt;if(e.rt<=0){e.rt=.8;e.tgt=pickTarget(e);}
  const t=e.tgt;
  if(t&&!t.dead&&!t.gone&&!t.inside){
    let tx,ty,range;
    if(t.type){tx=clamp(e.x,t.x,t.x+t.w);ty=clamp(e.y,t.y,t.y+t.h);range=.35;}else{tx=t.x;ty=t.y;range=.5;}
    const d=Math.hypot(tx-e.x,ty-e.y);
    if(d>range)moveTo(e,tx,ty,dt,e.sp);
    else{face(e,tx,ty);if(e.atk<=0){e.atk=e.rate;t.type?hitBld(t,e.dmg):hitVill(t,e.dmg);}}
  }else moveTo(e,CX+e.ox,CY+e.oy,dt,e.sp*.6);
}
function hitVill(v,d){
  v.hp-=d;v.hitT=.15;v.lastHit=0;
  if(v.hp<=0&&!v.dead){v.dead=true;release(v);floatAt(v.x,v.y,`${v.name} öldü`,'#ff8f80');if(sheetRef===v)closeSheet();}
}
function hitBld(b,d){
  b.hp-=d;b.hitT=.15;
  if(b.hp<=0&&!b.dead){b.dead=true;b.hp=0;markOcc(b.x,b.y,b.w,b.h,0);
    if(b.type==='main'){gameOver('Köy düştü','Akıncılar ana binayı yıktı.');return;}
    floatAt(b.x+b.w/2,b.y+b.h/2,b.type==='house'?'Ev yıkıldı':'Bina yıkıldı','#ff8f80');if(sheetRef===b)closeSheet();}
}
function hitFoe(e,d){e.hp-=d;e.hitT=.15;if(e.hp<=0&&!e.dead){e.dead=true;G.kills++;}}
