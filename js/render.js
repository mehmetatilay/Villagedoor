"use strict";
/* ---------- drawing ---------- */
function poly(pts,fill){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
const P=(x,y,h)=>{const p=w2s(x,y);return[p.x,p.y-h*Z];};
function ell(x,y,rx,ry,f){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=f;ctx.fill();}
function circ(x,y,r,f){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=f;ctx.fill();}
function ln(x1,y1,x2,y2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function rr(x,y,w,h,r,f){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.fillStyle=f;ctx.fill();}
function bar(x,y,w,frac,col){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x-w/2-1,y-1,w+2,5);ctx.fillStyle=col||(frac>.6?'#86b56c':frac>.3?'#d9a441':'#d0503f');ctx.fillRect(x-w/2,y,w*clamp(frac,0,1),3);}

function box(b,h,cl,cr,ct,h0=0){
  const{x,y,w}=b,d=b.h;
  poly([P(x,y+d,h0),P(x+w,y+d,h0),P(x+w,y+d,h),P(x,y+d,h)],cl);
  poly([P(x+w,y+d,h0),P(x+w,y,h0),P(x+w,y,h),P(x+w,y+d,h)],cr);
  poly([P(x,y,h),P(x+w,y,h),P(x+w,y+d,h),P(x,y+d,h)],ct);
}
const faceR=(b,u,v)=>P(b.x+b.w,b.y+b.h*u,v);
const faceL=(b,u,v)=>P(b.x+b.w*u,b.y+b.h,v);
function roof(b,h,peak,cb,cl,cr){
  const e=.18,x=b.x-e,y=b.y-e,w=b.w+2*e,d=b.h+2*e;
  const A=P(x,y,h),B=P(x+w,y,h),C=P(x+w,y+d,h),D=P(x,y+d,h),T=P(b.x+b.w/2,b.y+b.h/2,h+peak);
  poly([A,B,T],cb);poly([D,A,T],cb);poly([D,C,T],cl);poly([C,B,T],cr);
  ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=Math.max(1,Z);ln(C[0],C[1],T[0],T[1]);
  return T;
}
function shadowFoot(b){const e=.3;poly([P(b.x-e,b.y-e,0),P(b.x+b.w+e,b.y-e,0),P(b.x+b.w+e,b.y+b.h+e,0),P(b.x-e,b.y+b.h+e,0)],'rgba(0,0,0,.2)');}
function quadOnFace(f,b,u1,u2,v1,v2,col){poly([f(b,u1,v1),f(b,u2,v1),f(b,u2,v2),f(b,u1,v2)],col);}

function drawMain(b){
  ctx.save();if(b.hitT>0)ctx.translate((Math.random()-.5)*3,0);
  shadowFoot(b);
  if(G.fort>0){const e=.34,hh=4+Math.min(13,G.fort*.65);box({x:b.x-e,y:b.y-e,w:b.w+2*e,h:b.h+2*e},hh,'#6f747a','#8f959b','#80868c');}
  box(b,44,'#8e7c60','#b9a582','#a6936f');
  ctx.strokeStyle='rgba(60,45,30,.35)';ctx.lineWidth=Math.max(1,Z*.8);
  for(const v of[11,22,33]){let a=faceL(b,0,v),c=faceL(b,1,v);ln(a[0],a[1],c[0],c[1]);a=faceR(b,0,v);c=faceR(b,1,v);ln(a[0],a[1],c[0],c[1]);}
  quadOnFace(faceR,b,.5,.74,0,22,'#3a2618');
  quadOnFace(faceR,b,.53,.71,0,19,'#57381f');
  const night='#e6b25a';
  quadOnFace(faceL,b,.18,.32,24,33,'#2b221c');quadOnFace(faceL,b,.2,.3,25,32,night);
  quadOnFace(faceL,b,.64,.78,24,33,'#2b221c');quadOnFace(faceL,b,.66,.76,25,32,night);
  quadOnFace(faceR,b,.15,.3,25,34,'#2b221c');quadOnFace(faceR,b,.17,.28,26,33,night);
  const T=roof(b,44,32,'#6a2a20','#8c3a2b','#ab4a3a');
  ctx.strokeStyle='#3a2a1e';ctx.lineWidth=Math.max(1.2,1.6*Z);ln(T[0],T[1],T[0],T[1]-26*Z);
  const wv=Math.sin(G.t*4)*2*Z;
  poly([[T[0],T[1]-26*Z],[T[0]+15*Z,T[1]-22*Z+wv],[T[0],T[1]-17*Z]],'#d9a441');
  ctx.restore();
  if(b.hp<b.maxHp){const c=P(b.x+b.w/2,b.y+b.h/2,44+32+36);bar(c[0],c[1],46*Z,b.hp/b.maxHp);}
}
function drawHouse(b){
  ctx.save();if(b.hitT>0)ctx.translate((Math.random()-.5)*3,0);
  shadowFoot(b);
  const lv=b.level||1,Hh=[22,28,38][lv-1];
  box(b,Hh,'#a88f68','#d0ba90','#c1aa80');
  if(lv===3){ctx.strokeStyle='rgba(80,55,30,.55)';ctx.lineWidth=Math.max(1,1.4*Z);
    let a=faceL(b,0,20),c=faceL(b,1,20);ln(a[0],a[1],c[0],c[1]);a=faceR(b,0,20);c=faceR(b,1,20);ln(a[0],a[1],c[0],c[1]);
    quadOnFace(faceL,b,.2,.4,25,33,'#2b221c');quadOnFace(faceL,b,.23,.37,26,32,'#e6b25a');
    quadOnFace(faceL,b,.6,.8,25,33,'#2b221c');quadOnFace(faceL,b,.63,.77,26,32,'#e6b25a');
    quadOnFace(faceR,b,.25,.45,25,33,'#2b221c');quadOnFace(faceR,b,.28,.42,26,32,'#e6b25a');}
  const fd=b.door==='l'?faceL:faceR,fw=b.door==='l'?faceR:faceL;
  quadOnFace(fd,b,.42,.66,0,14,'#4a301c');
  quadOnFace(fw,b,.35,.62,9,16,'#2b221c');quadOnFace(fw,b,.38,.59,10,15,'#e6b25a');
  ctx.strokeStyle='rgba(80,55,30,.5)';ctx.lineWidth=Math.max(1,Z);
  let a=faceL(b,0,0),c=faceL(b,0,Hh);ln(a[0],a[1],c[0],c[1]);a=faceR(b,1,0);c=faceR(b,1,Hh);ln(a[0],a[1],c[0],c[1]);
  const rc=[['#553621','#6e4629','#8a5a33'],['#5e2c1e','#7c3a26','#9a4a30'],['#5a2420','#7a302a','#9c3e34']][lv-1];
  const T=roof(b,Hh,20+(lv-1)*3,rc[0],rc[1],rc[2]);
  if(lv>=2){const ch=P(b.x+b.w*.32,b.y+b.h*.3,Hh+14);rr(ch[0]-2.6*Z,ch[1],5.2*Z,12*Z,1*Z,'#7d6a55');ctx.fillStyle='#5b4a3a';ctx.fillRect(ch[0]-3.2*Z,ch[1],6.4*Z,2*Z);
    for(let i=0;i<3;i++){const k=((G.t*.45+i/3+b.x*.13)%1);ctx.globalAlpha=(1-k)*.45;circ(ch[0]+k*6*Z,ch[1]-4*Z-k*18*Z,(2+k*4)*Z,'#d8d4cc');}ctx.globalAlpha=1;}
  if(lv===3){ctx.strokeStyle='#3a2a1e';ctx.lineWidth=Math.max(1,1.3*Z);ln(T[0],T[1],T[0],T[1]-14*Z);poly([[T[0],T[1]-14*Z],[T[0]+9*Z,T[1]-11.5*Z],[T[0],T[1]-9*Z]],'#d9a441');}
  ctx.restore();
  if(b.hp<b.maxHp){const c=P(b.x+b.w/2,b.y+b.h/2,Hh+36);bar(c[0],c[1],32*Z,b.hp/b.maxHp);}
}
function drawSite(b){
  poly([P(b.x,b.y,0),P(b.x+b.w,b.y,0),P(b.x+b.w,b.y+b.h,0),P(b.x,b.y+b.h,0)],'rgba(122,96,60,.75)');
  const h=22*b.progress;
  if(h>1){ctx.globalAlpha=.55;box(b,h,'#a88f68','#d0ba90','#c1aa80');ctx.globalAlpha=1;}
  ctx.strokeStyle='#6b4a2b';ctx.lineWidth=Math.max(1.5,2.2*Z);
  for(const[cx,cy]of[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]]){const a=P(cx,cy,0),c=P(cx,cy,26);ln(a[0],a[1],c[0],c[1]);}
  let a=P(b.x,b.y+b.h,24),c=P(b.x+b.w,b.y+b.h,24);ln(a[0],a[1],c[0],c[1]);a=P(b.x+b.w,b.y,24);ln(a[0],a[1],c[0],c[1]);
  const m=P(b.x+b.w/2,b.y+b.h/2,40);bar(m[0],m[1],36*Z,b.progress,'#d9a441');
}
function drawFarm(b){
  const{x,y,w,h}=b;
  poly([P(x,y,0),P(x+w,y,0),P(x+w,y+h,0),P(x,y+h,0)],b.built?'#6a4d2f':'rgba(110,80,50,.6)');
  if(!b.built){ctx.strokeStyle='#7a5530';ctx.lineWidth=Math.max(1,1.6*Z);
    for(const[cx,cy]of[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]){const a=P(cx,cy,0),c=P(cx,cy,10);ln(a[0],a[1],c[0],c[1]);}
    const m=P(x+w/2,y+h/2,16);bar(m[0],m[1],30*Z,b.progress,'#d9a441');return;}
  ctx.strokeStyle='#553b22';ctx.lineWidth=Math.max(1,1.4*Z);
  for(let i=1;i<5;i++){const a=P(x+.1,y+i*h/5,0),c=P(x+w-.1,y+i*h/5,0);ln(a[0],a[1],c[0],c[1]);}
  const g=.5+.5*Math.sin(G.t*.25+x*1.7);
  ctx.strokeStyle=mix('#5f9a45','#d8b443',g);ctx.lineWidth=Math.max(1.2,1.8*Z);
  for(let i=1;i<5;i++)for(let j=1;j<6;j++){const p=P(x+j*w/6,y+i*h/5,0);ln(p[0],p[1],p[0]-1.5*Z,p[1]-6*Z);ln(p[0],p[1],p[0]+1.8*Z,p[1]-5*Z);}
  const lv=b.level||1;
  if(lv>=2){ctx.strokeStyle='#8a6438';ctx.lineWidth=Math.max(1,1.5*Z);
    const fp=[[x,y+h],[x+w,y+h],[x+w,y]];
    for(let k=0;k<2;k++){const[a1,b1]=fp[k],[a2,b2]=fp[k+1];
      for(const hh of[4,8]){const p1=P(a1,b1,hh),p2=P(a2,b2,hh);ln(p1[0],p1[1],p2[0],p2[1]);}
      for(let t=0;t<=4;t++){const px=a1+(a2-a1)*t/4,py=b1+(b2-b1)*t/4,q1=P(px,py,0),q2=P(px,py,10);ln(q1[0],q1[1],q2[0],q2[1]);}}}
  if(lv>=3){const p=P(x+w*.5,y+h*.5,0);ctx.strokeStyle='#6b4a2b';ctx.lineWidth=Math.max(1.2,1.8*Z);
    ln(p[0],p[1],p[0],p[1]-24*Z);ln(p[0]-7*Z,p[1]-16*Z,p[0]+7*Z,p[1]-16*Z);
    rr(p[0]-3.5*Z,p[1]-19*Z,7*Z,8*Z,2*Z,'#7b4a8c');circ(p[0],p[1]-23*Z,3.2*Z,'#e2c463');ell(p[0],p[1]-25.5*Z,5.5*Z,1.6*Z,'#c9a645');}
}
function drawTree(t){
  const p=w2s(t.x+.5,t.y+.5),s=Z*(.85+t.v*.3)*(t.sap!=null?.25+.55*t.sap:.65+.35*Math.min(1,t.wood/30));
  ell(p.x,p.y,13*s,5*s,'rgba(0,0,0,.25)');
  rr(p.x-2.5*s,p.y-13*s,5*s,13*s,1.5*s,'#5b3d22');
  if(t.pine){
    poly([[p.x,p.y-44*s],[p.x+11*s,p.y-24*s],[p.x-11*s,p.y-24*s]],'#2b5530');
    poly([[p.x,p.y-36*s],[p.x+14*s,p.y-14*s],[p.x-14*s,p.y-14*s]],'#24492a');
    poly([[p.x,p.y-44*s],[p.x+11*s,p.y-24*s],[p.x+2*s,p.y-26*s]],'#1f4024');
  }else{
    circ(p.x,p.y-24*s,12*s,'#2f5c2c');circ(p.x-7*s,p.y-17*s,9*s,'#376b31');circ(p.x+7*s,p.y-18*s,9*s,'#2a522a');
    circ(p.x-3*s,p.y-29*s,5.5*s,'#4c8a3d');
  }
}
function drawRock(r){
  const p=w2s(r.x+.5,r.y+.5),s=Z*(.55+.45*Math.min(1,r.stone/40))*(.9+r.v*.25);
  ell(p.x,p.y+1*s,15*s,5*s,'rgba(0,0,0,.25)');
  poly([[p.x-14*s,p.y],[p.x-10*s,p.y-11*s],[p.x-1*s,p.y-17*s],[p.x+9*s,p.y-13*s],[p.x+15*s,p.y-2*s],[p.x+6*s,p.y+4*s],[p.x-8*s,p.y+4*s]],'#8b9095');
  poly([[p.x-1*s,p.y-17*s],[p.x+9*s,p.y-13*s],[p.x+15*s,p.y-2*s],[p.x+6*s,p.y+4*s],[p.x+2*s,p.y-5*s]],'#6c7177');
  poly([[p.x-10*s,p.y-11*s],[p.x-1*s,p.y-17*s],[p.x+2*s,p.y-5*s],[p.x-5*s,p.y-3*s]],'#a5aab0');
}
function tool(kind,hx,hy,ang,f,s){
  ctx.save();ctx.translate(hx,hy);ctx.scale(f*s,s);ctx.rotate(ang);ctx.lineCap='round';ctx.lineWidth=1.7;
  ctx.strokeStyle='#6b4a2b';
  if(kind==='asker'){ln(0,5,0,-21);poly([[0,-27],[2.2,-20],[-2.2,-20]],'#d4dade');}
  else if(kind==='oduncu'){ln(0,3,0,-11);poly([[0,-12],[5,-14],[5.5,-6],[0,-8]],'#c9ced3');}
  else if(kind==='madenci'){ln(0,3,0,-11);ctx.strokeStyle='#9aa1a8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-6,-8);ctx.quadraticCurveTo(0,-14,6,-9);ctx.stroke();}
  else if(kind==='muhendis'){ln(0,3,0,-9);ctx.fillStyle='#7b8086';ctx.fillRect(-3.5,-13,7,4);}
  else if(kind==='ciftci'){ln(0,4,0,-15);ctx.strokeStyle='#b9bec3';ln(0,-15,5,-12.5);}
  else if(kind==='raider'){ctx.strokeStyle='#4a3420';ln(0,3,0,0);ctx.strokeStyle='#d4dade';ctx.lineWidth=2;ln(0,0,0,-15);ctx.strokeStyle='#8a6a3a';ln(-3,0,3,0);}
  ctx.restore();
}
function drawPerson(v,col,isFoe){
  const p=w2s(v.x,v.y),s=Z,f=v.face||1;
  ell(p.x,p.y,6.5*s,2.8*s,'rgba(0,0,0,.28)');
  const st=v.moving?Math.sin(v.walk*11)*2.4*s:0;
  ctx.strokeStyle='#2a221d';ctx.lineWidth=2.2*s;ctx.lineCap='round';
  ln(p.x-1.8*s,p.y-7*s,p.x-1.8*s+st,p.y-.6*s);ln(p.x+1.8*s,p.y-7*s,p.x+1.8*s-st,p.y-.6*s);
  if(v.job==='asker'){circ(p.x-f*5*s,p.y-11*s,3.6*s,'#d9a441');circ(p.x-f*5*s,p.y-11*s,2.7*s,'#7a2a22');}
  rr(p.x-4.6*s,p.y-16.5*s,9.2*s,10.5*s,2.6*s,v.hitT>0?'#ffffff':col);
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(p.x-4.6*s,p.y-9.5*s,9.2*s,1.6*s);
  circ(p.x,p.y-20*s,3.8*s,isFoe?'#c9a27e':'#e4c19a');
  const hat=(c)=>{ctx.beginPath();ctx.arc(p.x,p.y-20.6*s,4.1*s,Math.PI,0);ctx.fillStyle=c;ctx.fill();};
  const j=v.job;
  if(j==='asker')hat('#a7b0b9');
  else if(j==='ciftci'){ell(p.x,p.y-22.4*s,6.4*s,1.9*s,'#e2c463');hat('#d2b14e');}
  else if(j==='muhendis')hat('#2f5f8f');
  else if(j==='oduncu')hat('#6b2e22');
  else if(j==='madenci'){hat('#d9a441');circ(p.x+f*2.4*s,p.y-22.6*s,1.2*s,'#fff6cf');}
  else if(isFoe){ctx.fillStyle='#c0493c';ctx.fillRect(p.x-4*s,p.y-22*s,8*s,2*s);}
  const busy=v.state==='work'||v.state==='build'||v.state==='fight'||(isFoe&&v.atk>v.rate*.5&&v.tgt);
  const ang=busy?Math.sin(G.t*9+v.id)*.9:.35;
  if(j&&j!=='none')tool(j,p.x+f*5.2*s,p.y-10.5*s,ang,f,s);
  if(isFoe)tool('raider',p.x+f*5.2*s,p.y-10.5*s,ang,f,s);
  if(v.carry>0){
    const cy=p.y-28*s;
    if(v.ct==='wood'){rr(p.x-5*s,cy-2*s,10*s,4*s,2*s,'#8a5a2e');circ(p.x+3.6*s,cy,1.4*s,'#d9a06a');}
    else if(v.ct==='stone')poly([[p.x-4*s,cy+2*s],[p.x-3*s,cy-2*s],[p.x+1*s,cy-3*s],[p.x+4*s,cy+2*s]],'#9aa1a8');
    else{circ(p.x-2*s,cy,2.6*s,'#e0b84a');circ(p.x+2*s,cy,2.6*s,'#cfa23c');}
  }
  if(v.hp<v.maxHp&&!v.queue)bar(p.x,p.y-33*s,15*s,v.hp/v.maxHp,isFoe?'#d0503f':null);
}
function drawVill(v){drawPerson(v,v.job==='none'?'#bdb39b':JOBS[v.job].renk,false);
  if(v.state==='idle'&&v.why&&!v.queue){const p=w2s(v.x,v.y),y=p.y-40*Z-3,r=9*Math.max(.8,Z);
    poly([[p.x-4,y+r-1],[p.x+4,y+r-1],[p.x,y+r+5]],'#d0503f');circ(p.x,y,r+1.5,'#d0503f');circ(p.x,y,r,'#2a1714');label('!',p.x,y+4.5*Math.max(.8,Z),'#ffb3a8',Math.round(13*Math.max(.8,Z)));}}
function drawFoe(e){
  if(e.kind==='raider'){drawPerson(e,'#3c2e3a',true);return;}
  const p=w2s(e.x,e.y),s=Z,f=e.face||1;
  ell(p.x,p.y,10*s,3.2*s,'rgba(0,0,0,.28)');
  const st=e.moving?Math.sin(e.walk*14)*2*s:0;
  ctx.strokeStyle='#4c4844';ctx.lineWidth=2*s;ctx.lineCap='round';
  ln(p.x-5*s,p.y-6*s,p.x-5*s+st,p.y);ln(p.x+5*s,p.y-6*s,p.x+5*s-st,p.y);
  ctx.lineWidth=2.6*s;ctx.strokeStyle='#5d5955';ln(p.x-f*8*s,p.y-9*s,p.x-f*13*s,p.y-13*s);
  ell(p.x,p.y-8.5*s,9.5*s,4.8*s,e.hitT>0?'#ffffff':'#6f6a65');
  ell(p.x,p.y-10*s,6*s,2.2*s,'#85807a');
  circ(p.x+f*8.5*s,p.y-11.5*s,4.2*s,'#6f6a65');
  ell(p.x+f*12.2*s,p.y-10.5*s,2.8*s,1.7*s,'#5d5955');
  poly([[p.x+f*6.5*s,p.y-14*s],[p.x+f*7.5*s,p.y-19*s],[p.x+f*9.5*s,p.y-14.5*s]],'#5d5955');
  circ(p.x+f*9.5*s,p.y-12.5*s,1*s,'#ff4a3a');
  if(e.hp<e.maxHp)bar(p.x,p.y-24*s,15*s,e.hp/e.maxHp,'#d0503f');
}
const GSTY={atolye:{h:26,c:['#6f7c88','#98a5b1','#87949f'],r:['#24496d','#2f5f8f','#3d74aa']},
  kamp:{h:22,c:['#6e4c2c','#946a42','#83603a'],r:['#3f4a24','#55632f','#6b7a3a']},
  ocak:{h:20,c:['#62676d','#878d93','#767c82'],r:['#3d4248','#4f555b','#62686e']},
  ciftlik:{h:26,c:['#86372a','#a8493a','#983f31'],r:['#5a4a2a','#7a6638','#9a8448']},
  kisla:{h:28,c:['#7d7264','#a29684','#908575'],r:['#5a2420','#7a302a','#9c3e34']}};
function drawGuild(b){
  const S=GSTY[b.type],h=S.h,job=GJOB[b.type];
  ctx.save();if(b.hitT>0)ctx.translate((Math.random()-.5)*3,0);
  shadowFoot(b);box(b,h,...S.c);
  if(b.type==='ocak'){quadOnFace(faceL,b,.3,.7,0,14,'#1b1917');quadOnFace(faceR,b,.4,.62,0,12,'#3a2a1c');}
  else{quadOnFace(faceR,b,.4,.64,0,15,'#3a2618');quadOnFace(faceL,b,.35,.62,10,17,'#2b221c');quadOnFace(faceL,b,.38,.59,11,16,'#e6b25a');}
  if(b.type==='ciftlik'){ctx.strokeStyle='#e9dcc4';ctx.lineWidth=Math.max(1,1.3*Z);const a=faceR(b,.4,0),c=faceR(b,.64,15),d=faceR(b,.64,0),e=faceR(b,.4,15);ln(a[0],a[1],c[0],c[1]);ln(d[0],d[1],e[0],e[1]);}
  if(b.type==='kisla'){for(const u of[0,.5,1]){const q=faceL(b,u,h);rr(q[0]-2.5*Z,q[1]-5*Z,5*Z,5*Z,1,'#7d7264');}}
  const T=roof(b,h,b.type==='ocak'?12:20,...S.r);
  ctx.strokeStyle='#3a2a1e';ctx.lineWidth=Math.max(1.2,1.5*Z);ln(T[0],T[1],T[0],T[1]-20*Z);
  const wv=Math.sin(G.t*4+b.x)*1.6*Z;poly([[T[0],T[1]-20*Z],[T[0]+12*Z,T[1]-17*Z+wv],[T[0],T[1]-13*Z]],JOBS[job].renk);
  ctx.restore();
  const pz=P(b.x+b.w+.15,b.y+b.h+.15,0);
  if(b.type==='kamp'){for(let i=0;i<3;i++){rr(pz[0]-12*Z,pz[1]-(4+i*4)*Z,16*Z,4*Z,2*Z,i%2?'#8a5a2e':'#7a4e28');circ(pz[0]+3*Z,pz[1]-(2+i*4)*Z,1.6*Z,'#d9a06a');}}
  if(b.type==='ocak'){poly([[pz[0]-12*Z,pz[1]],[pz[0]-8*Z,pz[1]-7*Z],[pz[0]-1*Z,pz[1]-9*Z],[pz[0]+4*Z,pz[1]-2*Z],[pz[0]+2*Z,pz[1]+1*Z]],'#9aa1a8');}
  if(b.type==='ciftlik'){ell(pz[0]-6*Z,pz[1]-4*Z,7*Z,5*Z,'#d9b443');ell(pz[0]-6*Z,pz[1]-6*Z,5*Z,3*Z,'#e8c95a');}
  if(b.hp<b.maxHp){const c=P(b.x+b.w/2,b.y+b.h/2,h+38);bar(c[0],c[1],32*Z,b.hp/b.maxHp);}
}
function drawTower(b){
  ctx.save();if(b.hitT>0)ctx.translate((Math.random()-.5)*3,0);
  shadowFoot(b);box(b,54,'#767b81','#a0a6ac','#8e949a');
  quadOnFace(faceL,b,.4,.6,30,42,'#22201e');quadOnFace(faceR,b,.4,.6,30,42,'#22201e');
  for(const[u,w]of[[0,0],[.68,0],[0,.68],[.68,.68]])box({x:b.x+u,y:b.y+w,w:.32,h:.32},62,'#767b81','#a0a6ac','#8e949a',54);
  ctx.restore();
  if(b.hp<b.maxHp){const c=P(b.x+.5,b.y+.5,74);bar(c[0],c[1],24*Z,b.hp/b.maxHp);}
}
function drawBld(b){if(!b.built)drawSite(b);else if(b.type==='main')drawMain(b);else if(b.type==='tower')drawTower(b);else if(GSTY[b.type])drawGuild(b);else drawHouse(b);}

function render(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle='#101713';ctx.fillRect(0,0,W,H);
  if(!G)return;
  ctx.drawImage(ground,cam.x-OX*Z,cam.y,ground.width*Z,ground.height*Z);
  drawRoads();
  for(const b of G.blds)if(b.type==='farm')drawFarm(b);
  // selection ring
  const ringT=sheetRef&&!sheetRef.dead?sheetRef:(trayJob?guild(trayJob):null);
  if(ringT){
    ctx.strokeStyle='#d9a441';ctx.lineWidth=2;
    if(ringT.type){const b=ringT,e=.25;ctx.beginPath();const pts=[P(b.x-e,b.y-e,0),P(b.x+b.w+e,b.y-e,0),P(b.x+b.w+e,b.y+b.h+e,0),P(b.x-e,b.y+b.h+e,0)];
      ctx.moveTo(pts[0][0],pts[0][1]);for(const q of pts)ctx.lineTo(q[0],q[1]);ctx.closePath();ctx.stroke();}
    else{const p=w2s(ringT.x,ringT.y);ctx.beginPath();ctx.ellipse(p.x,p.y,10*Z,4.5*Z,0,0,Math.PI*2);ctx.stroke();}
  }
  const list=[],vis=(x,y)=>{const p=w2s(x,y);return p.x>-130&&p.x<W+130&&p.y>-60&&p.y<H+170;};
  for(const t of G.trees)if(vis(t.x+.5,t.y+.5))list.push([t.x+t.y+1,drawTree,t]);
  for(const r of G.rocks)if(vis(r.x+.5,r.y+.5))list.push([r.x+r.y+1,drawRock,r]);
  for(const b of G.blds)if(b.type!=='farm')list.push([b.x+b.y+(b.w+b.h)/2,drawBld,b]);
  for(const v of G.vill)if(!v.inside&&vis(v.x,v.y))list.push([v.x+v.y,drawVill,v]);
  for(const e of G.foes)if(vis(e.x,e.y))list.push([e.x+e.y,drawFoe,e]);
  const qn=Math.min(G.queue,8);
  for(let i=0;i<qn;i++){const q={x:DOOR.x+.5+i*.42,y:DOOR.y+.1,job:'none',hp:1,maxHp:1,walk:0,face:-1,queue:true,id:i};list.push([q.x+q.y,drawVill,q]);}
  list.sort((a,b)=>a[0]-b[0]);
  for(const[,fn,o]of list)fn(o);
  if(G.queue>8){const p=w2s(DOOR.x+.5+8*.42,DOOR.y+.1);label(`+${G.queue-8}`,p.x+4*Z,p.y-12*Z,'#efe6d1',12);}
  if(G.job&&G.queue>0){const p=w2s(DOOR.x,DOOR.y),cy=p.y-34*Z,r=7*Z+2,fr=1-G.spawnT/SPAWN;
    circ(p.x,cy,r+2.5,'rgba(12,16,14,.75)');ctx.strokeStyle=JOBS[G.job].renk;ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,cy,r,-Math.PI/2,-Math.PI/2+fr*Math.PI*2);ctx.stroke();}
  ctx.strokeStyle='#f3e3b0';ctx.lineWidth=2;for(const sh of G.shots){const a=P(sh.x,sh.y,58),e=w2s(sh.ex,sh.ey),k=sh.t/.25;ctx.globalAlpha=1-k;ln(a[0],a[1],a[0]+(e.x-a[0])*Math.min(1,k*2+.3),a[1]+(e.y-12*Z-a[1])*Math.min(1,k*2+.3));}ctx.globalAlpha=1;
  drawDistrictNames();
  for(const f of G.floaters){const p=w2s(f.x,f.y);ctx.globalAlpha=clamp(1.6-f.t,0,1);label(f.txt,p.x,p.y-40*Z-f.t*26,f.col,13);ctx.globalAlpha=1;}
  // offscreen enemy markers
  const m=26,top=104,bot=H-DOCKH-(trayJob?0:14)-12;
  for(const e of G.foes){const p=w2s(e.x,e.y-.3);
    if(p.x<m||p.x>W-m||p.y<top||p.y>bot){const cx=clamp(p.x,m,W-m),cy=clamp(p.y,top,bot),a=Math.atan2(p.y-H/2,p.x-W/2);
      ctx.save();ctx.translate(cx,cy);ctx.rotate(a);poly([[10,0],[-7,-7],[-3,0],[-7,7]],'#e2553f');ctx.restore();}}
}
function label(t,x,y,col,sz){ctx.font=`800 ${sz}px "Alegreya Sans",system-ui,sans-serif`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(12,16,14,.85)';ctx.strokeText(t,x,y);ctx.fillStyle=col;ctx.fillText(t,x,y);}
