"use strict";
/* ---------- gündelik hayat: gece-gündüz, evler, çocuklar ---------- */
// Bir gün DAY saniye; oyun 06:00'da başlar. 21:30–05:00 arası gece: herkes evinde, kapıdan kimse çıkmaz.
const DAY=300,GROW=120,KID_SP=1.2;
const KIDC=['#c9705a','#5f8fc0','#d8b24a','#7aa65a','#b06aa0','#e08a3c'];
const hourAt=t=>(6+(t%DAY)/DAY*24)%24;
const dayNo=t=>Math.floor((t+DAY/4)/DAY)+1;
const isNight=(t=G.t)=>{const h=hourAt(t);return h>=21.5||h<5;};
// 19:30'da kararmaya başlar, 22:30'da tam gece, 04:00–06:00 şafak.
function darkness(){const h=hourAt(G.t);return h>=22.5||h<4?1:h>=19.5?(h-19.5)/3:h<6?(6-h)/2:0;}
const PARTS=[[5,'Şafak'],[8,'Sabah'],[12,'Öğle'],[16,'İkindi'],[19,'Akşam'],[21.5,'Gece']];
function dayPart(){const h=hourAt(G.t);let p='Gece';for(const[a,n]of PARTS)if(h>=a)p=n;return p;}
// Herkes aynı anda yola çıkmasın: kişiye göre birkaç saniye kayar.
const nightFor=e=>isNight(G.t-(e.id%9)*1.6);

/* ---------- evler ---------- */
const bkey=b=>b.type==='main'?'main':b.x+','+b.y;
function homeOf(e){if(!e.home||e.home==='main')return G.main;return G.blds.find(b=>b.type==='house'&&b.built&&!b.dead&&bkey(b)===e.home)||G.main;}
// Kapının hemen önü: köylü buraya varınca içeri girer.
function homePt(e){const b=homeOf(e);if(b===G.main)return DOOR;return b.door==='l'?{x:b.x+b.w*.55,y:b.y+b.h+.2}:{x:b.x+b.w+.2,y:b.y+b.h*.55};}
function residents(b){const k=bkey(b);let n=0;for(const v of G.vill)if(v.home===k)n++;for(const c of G.kids)if(c.home===k)n++;return n;}
function freeHome(){let best=null,bf=0;for(const b of G.blds){if(b.type!=='house'||!b.built||b.dead)continue;const f=HLV[b.level-1].cap-residents(b);if(f>bf){bf=f;best=b;}}return best;}
function giveHome(e){const h=freeHome();e.home=h?bkey(h):'main';}
// Ana binada kalanlar boş ev çıkınca taşınır.
function rehome(){for(const e of[...G.vill,...G.kids])if(e.home==='main'&&!e.sleep){const h=freeHome();if(!h)return;e.home=bkey(h);}}

/* ---------- köylünün akşamı ---------- */
function toBed(v,dt){
  if(v.sleep)return;
  if(!v.bed){release(v);deposit(v);v.bed=true;v.why=null;v.wx=null;v.dp=null;}
  const p=homePt(v);if(moveTo(v,p.x,p.y,dt,v.sp))v.sleep=true;
}
function wake(v){if(v.sleep){const p=homePt(v);v.x=p.x;v.y=p.y;}v.sleep=false;v.bed=false;v.state='seek';}

/* ---------- çocuklar ---------- */
function bornKid(){
  const h=freeHome(),home=h?bkey(h):'main',k={id:++uid,home,age:0,face:1,walk:0,wx:null,wy:null,pause:0,c:KIDC[uid%KIDC.length],sc:.68};
  const p=homePt(k);k.x=p.x;k.y=p.y;G.kids.push(k);floatAt(p.x,p.y,'+1 çocuk','#efe6d1');
}
function updateKid(k,dt){
  k.moving=false;k.age+=dt;
  if(k.age>=GROW&&!isNight()){ // büyüdü: ana binaya yürüyüp kapıdaki sıraya girer
    if(moveTo(k,DOOR.x,DOOR.y,dt,1.5)){k.gone=true;G.queue++;G.grown=(G.grown||0)+1;floatAt(DOOR.x+.5,DOOR.y,'+1 köylü','#efe6d1');
      hint('grown','Bir çocuk büyüdü ve kapıdaki sıraya girdi.',1e9);}
    return;}
  const hp=homePt(k);
  if(nightFor(k)){k.wx=null;if(!k.sleep&&moveTo(k,hp.x,hp.y,dt,KID_SP))k.sleep=true;return;}
  if(k.sleep){k.sleep=false;k.x=hp.x;k.y=hp.y;}
  if(k.wx==null||Math.hypot(k.wx-k.x,k.wy-k.y)<.08){
    if(k.pause>0){k.pause-=dt;return;}
    const b=homeOf(k),m=mahOf(b);let cx=hp.x,cy=hp.y,r=1.6;
    if(m&&Math.random()<.45){cx=m.x;cy=m.y;r=1.3;}       // meydanda oyun
    else if(b===G.main){cx=CX+3;cy=CY+.5;r=2;}
    const a=Math.random()*Math.PI*2,d=Math.random()*r;k.wx=cx+Math.cos(a)*d;k.wy=cy+Math.sin(a)*d;k.pause=1+Math.random()*3;
    const i=tileAt(k.wx,k.wy);if(i<0||G.occ[i]===3)k.wx=null;
  }else moveTo(k,k.wx,k.wy,dt,KID_SP);
}
function drawKid(k){
  const hop=k.moving?0:Math.max(0,Math.sin(G.t*7+k.id))*.12;
  drawPerson({...k,y:k.y-hop,x:k.x-hop},k.c,false);
}

/* ---------- gece çizimi ---------- */
function drawNight(){
  const dk=darkness();if(dk<=0)return;
  ctx.fillStyle=`rgba(12,18,44,${(.52*dk).toFixed(3)})`;ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='lighter';
  for(const b of G.blds){
    if(!b.built||b.dead||b.type==='farm'||b.type==='tower')continue;
    if(b.type==='house'&&!residents(b))continue;
    const c=P(b.x+b.w/2,b.y+b.h/2,14),r=(b.type==='main'?60:38)*Z;
    if(c[0]<-r||c[0]>W+r||c[1]<-r||c[1]>H+r)continue;
    const g=ctx.createRadialGradient(c[0],c[1],0,c[0],c[1],r);
    g.addColorStop(0,`rgba(255,180,90,${(.32*dk).toFixed(3)})`);g.addColorStop(1,'rgba(255,180,90,0)');
    ctx.fillStyle=g;ctx.fillRect(c[0]-r,c[1]-r,r*2,r*2);
  }
  ctx.globalCompositeOperation='source-over';
}
