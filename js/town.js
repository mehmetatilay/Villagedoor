"use strict";
/* ---------- yollar ve mahalleler ---------- */
// Yürünen kare aşınır: PATH_W'de patika, ROAD_W'de toprak yol olur. Patika ve yol kalıcıdır, yalnız aşınma (0. aşama) zamanla silinir.
const PATH_W=12,ROAD_W=70,ROAD_MUL=[1,1.12,1.3],WEAR_FADE=.02;
const MR=5.5,MHOUSES=6;
const MNAMES=['Çeşme Mahallesi','Yukarı Mahalle','Bayır Mahallesi','Aşağı Mahalle','Dere Mahallesi','Çınar Mahallesi','Bağlar Mahallesi','Yeni Mahalle'];
const tileAt=(x,y)=>{const tx=Math.floor(x),ty=Math.floor(y);return inMap(tx,ty)?ty*N+tx:-1;};
const roadAt=(x,y)=>{const i=tileAt(x,y);return i<0?0:G.road[i];};
const roadMul=(x,y)=>ROAD_MUL[roadAt(x,y)];
const mahOf=b=>b&&b.m!=null?G.mah.find(m=>m.id===b.m)||null:null;
const inDistrict=(x,y,pad=0)=>G.mah.some(m=>Math.hypot(x-m.x,y-m.y)<MR+pad);
const houseCount=m=>G.blds.filter(b=>b.type==='house'&&!b.dead&&b.m===m.id).length;

function wearStep(v,dt){
  const i=tileAt(v.x,v.y);if(i<0||G.occ[i]===3)return;
  G.wear[i]+=dt;
  if(G.road[i]===0&&G.wear[i]>=PATH_W)G.road[i]=1;
  else if(G.road[i]===1&&G.wear[i]>=ROAD_W){G.road[i]=2;hint('road','Köyde ilk toprak yol oluştu. Yollarda köylüler daha hızlı yürür.',1e9);}
}
function fadeWear(dt){const w=G.wear,r=G.road;for(let i=0;i<w.length;i++)if(!r[i]&&w[i]>0)w[i]=Math.max(0,w[i]-dt*WEAR_FADE);}
// Planlı sokak (keep): mühendislerin açtığı patika; üstüne bina yapılmaz.
function setPath(i,stage){G.keep[i]=1;if(G.road[i]<stage){G.road[i]=stage;G.wear[i]=Math.max(G.wear[i],stage>1?ROAD_W:PATH_W);}}
// İki nokta arasına patika açar; binaların içinden geçmez, var olan yola değince durur.
function carve(ax,ay,bx,by,stopOnRoad){
  const d=Math.hypot(bx-ax,by-ay),n=Math.max(1,Math.ceil(d*4));let left=false;
  for(let k=0;k<=n;k++){const i=tileAt(ax+(bx-ax)*k/n,ay+(by-ay)*k/n);if(i<0||G.occ[i]===3)continue;
    if(stopOnRoad&&left&&G.road[i])return;if(!G.road[i])left=true;setPath(i,1);}
}
function nearestRoad(x,y,maxR){
  let best=null,bd=maxR*maxR;
  for(let ty=Math.max(0,Math.floor(y-maxR));ty<=Math.min(N-1,y+maxR);ty++)for(let tx=Math.max(0,Math.floor(x-maxR));tx<=Math.min(N-1,x+maxR);tx++){
    if(!G.road[ty*N+tx])continue;const d=(tx+.5-x)**2+(ty+.5-y)**2;if(d<bd){bd=d;best={x:tx+.5,y:ty+.5};}}
  return best;
}
function linkToRoad(x,y){const r=nearestRoad(x,y,14);if(r)carve(x,y,r.x,r.y,true);else carve(x,y,DOOR.x,DOOR.y,true);}
// Binanın kapı önü: 'r' sağ yüz (x+w), 'l' sol yüz (y+h).
const doorTile=b=>b.door==='l'?{x:b.x+b.w/2,y:b.y+b.h+.5}:{x:b.x+b.w+.5,y:b.y+b.h/2};
// Kendiliğinden oluşan patikanın üstüne bina yapılabilir (patika silinir); toprak yola ve planlı sokağa yapılamaz.
function footRoadFree(x,y,w,h){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const i=yy*N+xx;if(!inMap(xx,yy)||G.road[i]>=2||G.keep[i])return false;}return true;}
function sideRoads(x,y,w,h){
  let r=0,l=0,o=0;const at=(xx,yy)=>inMap(xx,yy)&&G.road[yy*N+xx]?1:0;
  for(let k=0;k<h;k++){r+=at(x+w,y+k);o+=at(x-1,y+k);}
  for(let k=0;k<w;k++){l+=at(x+k,y+h);o+=at(x+k,y-1);}
  return{r,l,o};
}
function houseSpot(m){
  let best=null,bs=-1e9;
  for(let y=Math.floor(m.y-MR);y<=m.y+MR;y++)for(let x=Math.floor(m.x-MR);x<=m.x+MR;x++){
    const d=Math.hypot(x+1-m.x,y+1-m.y);if(d>MR||d<2)continue;
    if(!areaFree(x-1,y-1,4,4)||!footRoadFree(x,y,2,2))continue;
    const s=sideRoads(x,y,2,2),front=Math.max(s.r,s.l),sc=front*4+s.o-d;
    if(sc>bs){bs=sc;best={x,y,door:s.l>s.r?'l':'r'};}
  }
  return best;
}
function foundDistrict(){
  let best=null,bs=-1e9;
  for(let a=0;a<16;a++)for(const r of[8,10,12,14,16,18,20,22]){
    const ang=a/16*Math.PI*2,x=CX+Math.cos(ang)*r,y=CY+Math.sin(ang)*r;
    if(x<MR+1||y<MR+1||x>N-MR-1||y>N-MR-1)continue;
    if(G.mah.some(m=>Math.hypot(m.x-x,m.y-y)<MR*2+1))continue;
    let free=0;for(let ty=Math.floor(y-MR);ty<=y+MR;ty++)for(let tx=Math.floor(x-MR);tx<=x+MR;tx++)if(Math.hypot(tx+.5-x,ty+.5-y)<=MR&&inMap(tx,ty)&&!G.occ[ty*N+tx]&&G.road[ty*N+tx]<2)free++;
    if(free<45)continue;
    const sc=free-r*2.5;if(sc>bs){bs=sc;best={x,y};}
  }
  if(!best)return null;
  const m={id:G.mah.length,name:MNAMES[G.mah.length%MNAMES.length],x:Math.round(best.x*2)/2,y:Math.round(best.y*2)/2};
  G.mah.push(m);
  // arsa açılır: mahalle alanındaki ağaç ve kayalar kalkar
  const inM=o=>Math.hypot(o.x+.5-m.x,o.y+.5-m.y)<=MR+.5;
  for(const t of G.trees)if(inM(t)&&!t.users){t.dead=true;G.occ[t.y*N+t.x]=0;}
  for(const r of G.rocks)if(inM(r)&&!r.users){r.dead=true;G.occ[r.y*N+r.x]=0;}
  G.trees=G.trees.filter(t=>!t.dead);G.rocks=G.rocks.filter(r=>!r.dead);
  linkToRoad(m.x,m.y);
  for(let ty=Math.floor(m.y-1.5);ty<=m.y+1.5;ty++)for(let tx=Math.floor(m.x-1.5);tx<=m.x+1.5;tx++)
    if(inMap(tx,ty)&&!G.occ[ty*N+tx]&&Math.hypot(tx+.5-m.x,ty+.5-m.y)<1.4)setPath(ty*N+tx,1);
  return m;
}
// Mühendisin yapacağı evin yeri: önce dolmamış mahallelerde yola bakan arsa, yoksa yeni mahalle.
function houseSite(){
  for(const m of G.mah){if(houseCount(m)>=MHOUSES)continue;const s=houseSpot(m);if(s)return{...s,m};}
  const full=G.mah.length?G.mah[G.mah.length-1]:null;
  const m=foundDistrict();if(!m)return null;
  if(full)toast(`${full.name} doldu. Mühendisler yeni bir mahalle açtı: ${m.name}.`);
  const s=houseSpot(m);return s?{...s,m}:null;
}
function doorYard(){for(let yy=MAIN.y+1;yy<MAIN.y+3;yy++)for(let xx=MAIN.x+MAIN.w;xx<MAIN.x+MAIN.w+5;xx++)setPath(yy*N+xx,2);}

/* ---------- çizim ---------- */
function drawRoads(){
  const rx=HW*Z,ry=HH*Z,r=G.road,w=G.wear;
  const pass=(test,k,col)=>{ctx.beginPath();let any=false;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;if(!test(r[i],w[i]))continue;
      const p=w2s(x+.5,y+.5);if(p.x<-60||p.x>W+60||p.y<-40||p.y>H+40)continue;
      ctx.moveTo(p.x+rx*k,p.y);ctx.ellipse(p.x,p.y,rx*k,ry*k,0,0,Math.PI*2);any=true;}
    if(any){ctx.fillStyle=col;ctx.fill();}};
  pass((s,v)=>!s&&v>PATH_W*.45,.7,'rgba(140,120,80,.2)');
  pass(s=>s>=1,.82,'rgba(150,124,80,.72)');
  pass(s=>s>=2,1,'#8a7350');
  pass(s=>s>=2,.74,'#9c8660');
}
function drawDistrictNames(){for(const m of G.mah){const p=w2s(m.x,m.y);if(p.x<-80||p.x>W+80||p.y<-20||p.y>H+20)continue;
  ctx.globalAlpha=.8;label(m.name,p.x,p.y+4,'#efe6d1',Math.round(12*Math.max(.85,Z)));ctx.globalAlpha=1;}}
