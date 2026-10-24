"use strict";
/* ---------- input ---------- */
const ptrs=new Map();let drag=null,pinch=null;
cv.addEventListener('pointerdown',e=>{
  try{cv.setPointerCapture(e.pointerId);}catch(_){}
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1){drag={sx:e.clientX,sy:e.clientY,cx:cam.x,cy:cam.y,moved:false};pinch=null;}
  else if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:Z,w:s2w((a.x+b.x)/2,(a.y+b.y)/2)};if(drag)drag.moved=true;}
});
cv.addEventListener('pointermove',e=>{
  if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&ptrs.size>=2){const[a,b]=[...ptrs.values()];Z=clamp(pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d,.45,1.9);
    const ip=isoRaw(pinch.w.x,pinch.w.y);cam.x=(a.x+b.x)/2-ip.x*Z;cam.y=(a.y+b.y)/2-ip.y*Z;clampCam();}
  else if(drag){const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;if(Math.hypot(dx,dy)>8)drag.moved=true;
    if(drag.moved){cam.x=drag.cx+dx;cam.y=drag.cy+dy;clampCam();}}
});
function endPtr(e){
  ptrs.delete(e.pointerId);
  if(ptrs.size===0){if(drag&&!drag.moved&&e.type==='pointerup')tap(e.clientX,e.clientY);drag=null;pinch=null;}
  else if(ptrs.size===1){const[a]=[...ptrs.values()];drag={sx:a.x,sy:a.y,cx:cam.x,cy:cam.y,moved:true};pinch=null;}
}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
cv.addEventListener('wheel',e=>{e.preventDefault();const w=s2w(e.clientX,e.clientY);Z=clamp(Z*(e.deltaY<0?1.1:.9),.45,1.9);
  const ip=isoRaw(w.x,w.y);cam.x=e.clientX-ip.x*Z;cam.y=e.clientY-ip.y*Z;clampCam();},{passive:false});
function tap(sx,sy){
  if(!started||G.over)return;
  let best=null,bd=1e9;
  for(const v of G.vill){if(v.inside)continue;const p=w2s(v.x,v.y),d=Math.hypot(p.x-sx,p.y-13*Z-sy);if(d<Math.max(20,17*Z)&&d<bd){bd=d;best=v;}}
  if(best){openVill(best);return;}
  for(let i=0;i<Math.min(G.queue,9);i++){const p=w2s(DOOR.x+.5+i*.42,DOOR.y+.1);if(Math.hypot(p.x-sx,p.y-13*Z-sy)<20){closeSheet();closeTray();return;}}
  const order=[...G.blds.filter(b=>b.type!=='farm'),...G.blds.filter(b=>b.type==='farm')];
  for(const b of order){
    const ht=b.type==='main'?76:b.type==='farm'?0:b.type==='tower'?(b.built?70:22):b.built?50:22;
    for(const f of[0,.45,.9]){const w=s2w(sx,sy+ht*f*Z);
      if(w.x>=b.x-.2&&w.x<=b.x+b.w+.2&&w.y>=b.y-.2&&w.y<=b.y+b.h+.2){if(b.type==='main'){closeSheet();closeTray();hint('mainTap','Kapıyı alttaki şeritten yönetirsin: bir mesleğe dokun, kapıdan o meslek çıksın.',60);}else if(b.built&&GJOB[b.type]){closeSheet();openTray(GJOB[b.type]);}else openBld(b);return;}}
  }
  closeSheet();closeTray();
}
