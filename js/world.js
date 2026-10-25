"use strict";
/* ---------- map ---------- */
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function makeNoise(cell,R=Math.random){
  const gw=Math.ceil(N/cell)+3,g=[];for(let i=0;i<gw*gw;i++)g.push(R());
  const s=t=>t*t*(3-2*t);
  return (x,y)=>{const fx=x/cell,fy=y/cell,ix=Math.floor(fx),iy=Math.floor(fy),u=s(fx-ix),v=s(fy-iy);
    const a=g[iy*gw+ix],b=g[iy*gw+ix+1],c=g[(iy+1)*gw+ix],d=g[(iy+1)*gw+ix+1];
    return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};
}
function markOcc(x,y,w,h,v){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(inMap(xx,yy)){const i=yy*N+xx;G.occ[i]=v;if(v===3){G.road[i]=0;G.wear[i]=0;G.keep[i]=0;}}}
function areaFree(x,y,w,h){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){if(!inMap(xx,yy)||xx<1||yy<1||xx>N-2||yy>N-2||G.occ[yy*N+xx])return false;}return true;}
function findSpot(w,h,minR,maxR,cx=CX,cy=CY){
  for(let i=0;i<500;i++){
    const r=minR+(maxR-minR)*(i/500)+Math.random()*1.5,a=Math.random()*Math.PI*2;
    const x=Math.round(cx+Math.cos(a)*r-w/2),y=Math.round(cy+Math.sin(a)*r-h/2);
    if(Math.hypot(x+w/2-CX,y+h/2-CY)<3.6||inDistrict(x+w/2,y+h/2,1.5))continue;
    if(areaFree(x-1,y-1,w+2,h+2)&&footRoadFree(x,y,w,h))return{x,y};
  }
  return null;
}
function addTree(x,y){G.trees.push({x,y,wood:30,users:0,v:Math.random(),pine:Math.random()<.45});G.occ[y*N+x]=1;}
function addRock(x,y){G.rocks.push({x,y,stone:40,users:0,v:Math.random()});G.occ[y*N+x]=2;}
function cluster(a,r,count,fn,spread){
  const cx=CX+Math.cos(a)*r,cy=CY+Math.sin(a)*r;
  for(let i=0;i<count*4&&count>0;i++){const x=Math.floor(cx+(Math.random()-.5)*2*spread),y=Math.floor(cy+(Math.random()-.5)*2*spread);
    if(inMap(x,y)&&!G.occ[y*N+x]&&Math.hypot(x+.5-CX,y+.5-CY)>5.5){fn(x,y);count--;}}
}
function mkB(type,x,y,built,door){
  const s=BSPEC[type];
  const b={type,x,y,door:door||'r',w:s.w,h:s.h,maxHp:s.hp,hp:built?s.hp:s.hp*.3,built,progress:built?1:0,need:s.time,workers:[],dead:false,hitT:0,level:1,age:0};
  markOcc(x,y,b.w,b.h,3);return b;
}
function newGame(){
  uid=0;
  G={seed:(Math.random()*4294967295)>>>0,t:0,res:{food:60,wood:40,stone:15},queue:10,vill:[],foes:[],trees:[],rocks:[],blds:[],job:null,spawnT:SPAWN,birthT:9,
     wave:0,waveT:120,over:false,needFarm:false,needFarmPrev:false,floaters:[],occ:new Uint8Array(N*N),road:new Uint8Array(N*N),keep:new Uint8Array(N*N),wear:new Float32Array(N*N),mah:[],kids:[],grown:0,kills:0,maxPop:10,hints:{},names:NAMES.slice().sort(()=>Math.random()-.5),...freshMeta()};
  const main={type:'main',...MAIN,hp:600,maxHp:600,built:true,progress:1,workers:[],dead:false,hitT:0};
  G.blds.push(main);G.main=main;markOcc(MAIN.x,MAIN.y,MAIN.w,MAIN.h,3);
  markOcc(MAIN.x+MAIN.w,MAIN.y+1,5,2,4); // kapı önü ve sıra alanı
  doorYard();
  const n1=makeNoise(6),n2=makeNoise(5);
  for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){
    if(G.occ[y*N+x])continue;
    const d=Math.hypot(x+.5-CX,y+.5-CY);if(d<7)continue;
    if(n1(x,y)>.6&&Math.random()<.6){addTree(x,y);continue;}
    if(d>8.5&&n2(x,y)>.7&&Math.random()<.45)addRock(x,y);
  }
  const a=Math.random()*Math.PI*2;
  cluster(a,8.5,14,addTree,2.3);
  cluster(a+Math.PI*.95,9.5,9,addRock,1.7);
  foundDistrict();
  for(let i=0;i<2;i++){const s=findSpot(2,2,3.6,8);if(s){const b=mkB('farm',s.x,s.y,true);G.blds.push(b);const f=doorTile(b);linkToRoad(f.x,f.y);}}
  ground=buildGround();
  Z=W<600?0.7:0.85;centerOn(CX+1,CY+1);
  closeSheet();
}

function freshMeta(){return{raids:false,orders:Object.fromEntries(ORDER.map(k=>[k,ORD[k][0].k])),oneShot:['atolye'],
  tech:{testere:0,kazma:0,saban:0,talim:0},prog:{testere:0,kazma:0,saban:0,talim:0},fort:0,shots:[]};}

/* ---------- ground prerender ---------- */
function hex(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
function mix(a,b,t){const A=hex(a),B=hex(b);return`rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')})`;}
function buildGround(){
  const g=document.createElement('canvas');g.width=N*TW;g.height=N*TH+26;const c=g.getContext('2d');
  const R=rng(G.seed),nz=makeNoise(4,R),nz2=makeNoise(10,R);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const cx=OX+(x-y)*HW,cy=(x+y)*HH;
    let v=nz(x,y)*.55+nz2(x,y)*.45+(R()-.5)*.08;
    let col=mix('#47703a','#729a4a',clamp(v,0,1));
    const d=Math.hypot(x+.5-CX,y+.5-CY);
    if(d<5)col=mix(col.replace(/rgb\((\d+),(\d+),(\d+)\)/,(m,r,gg,b)=>'#'+[r,gg,b].map(n=>(+n).toString(16).padStart(2,'0')).join('')),'#8c7a54',clamp((5-d)/3.2,0,.85));
    c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+HW,cy+HH);c.lineTo(cx,cy+TH);c.lineTo(cx-HW,cy+HH);c.closePath();
    c.fillStyle=col;c.fill();c.strokeStyle='rgba(0,0,0,.045)';c.lineWidth=1;c.stroke();
    if(d>5&&R()<.18){
      c.strokeStyle='rgba(30,60,25,.45)';c.lineWidth=1.2;
      for(let k=0;k<3;k++){const px=cx+(R()-.5)*30,py=cy+HH+(R()-.5)*12;c.beginPath();c.moveTo(px,py);c.lineTo(px+(R()-.5)*3,py-4);c.stroke();}
    }
    if(d>6&&R()<.025){c.fillStyle=R()<.5?'#e8dca0':'#d98a7a';c.beginPath();c.arc(cx+(R()-.5)*24,cy+HH+(R()-.5)*8,1.6,0,7);c.fill();}
  }
  const p=(x,y)=>[OX+(x-y)*HW,(x+y)*HH];
  let a=p(0,N),b=p(N,N),d=p(N,0);
  c.fillStyle='#5b3f26';c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.lineTo(b[0],b[1]+22);c.lineTo(a[0],a[1]+22);c.closePath();c.fill();
  c.fillStyle='#46301d';c.beginPath();c.moveTo(b[0],b[1]);c.lineTo(d[0],d[1]);c.lineTo(d[0],d[1]+22);c.lineTo(b[0],b[1]+22);c.closePath();c.fill();
  return g;
}

/* ---------- camera ---------- */
const isoRaw=(x,y)=>({x:(x-y)*HW,y:(x+y)*HH});
const w2s=(x,y)=>({x:cam.x+(x-y)*HW*Z,y:cam.y+(x+y)*HH*Z});
function s2w(sx,sy){const wx=(sx-cam.x)/Z,wy=(sy-cam.y)/Z;return{x:(wx/HW+wy/HH)/2,y:(wy/HH-wx/HW)/2};}
function centerOn(x,y){const p=isoRaw(x,y);cam.x=W/2-p.x*Z;cam.y=H/2-p.y*Z;}
function clampCam(){const c=s2w(W/2,H/2);const x=clamp(c.x,2,N-2),y=clamp(c.y,2,N-2);if(x!==c.x||y!==c.y)centerOn(x,y);}
function resize(){
  const c=G?s2w(W/2,H/2):null;
  DPR=Math.min(2,window.devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
  if(c)centerOn(c.x,c.y);
}
