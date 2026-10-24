"use strict";
const cv=document.getElementById('game'),ctx=cv.getContext('2d');
const $=id=>document.getElementById(id);
let W=0,H=0,DPR=1;

const N=48,TW=64,TH=32,HW=TW/2,HH=TH/2,OX=N*HW;
const MAIN={x:22,y:22,w:3,h:3};
const CX=MAIN.x+MAIN.w/2,CY=MAIN.y+MAIN.h/2;
const DOOR={x:MAIN.x+MAIN.w+0.4,y:MAIN.y+MAIN.h*0.62};
const JOBS={
  asker:{ad:'Asker',renk:'#c0493c',ico:'<path d="M20 4L9 15M20 4v4M20 4h-4M7 13l4 4M5 19l2-2"/>'},
  ciftci:{ad:'Çiftçi',renk:'#d9b443',ico:'<path d="M12 21V9M12 9c-3 0-4.5-2-4.5-4.5C10.5 4.5 12 6.5 12 9zm0 0c3 0 4.5-2 4.5-4.5C13.5 4.5 12 6.5 12 9zM12 14c-3 0-4.5-2-4.5-4.5 3 0 4.5 2 4.5 4.5zm0 0c3 0 4.5-2 4.5-4.5-3 0-4.5 2-4.5 4.5z"/>'},
  muhendis:{ad:'Mühendis',renk:'#4d88bd',ico:'<path d="M11 9l5-5 4 4-5 5zM12.5 10.5L4 19l1.5 1.5L14 12"/>'},
  oduncu:{ad:'Oduncu',renk:'#9a6634',ico:'<path d="M6 20L16 6M13 4c3 0 6 3 6 6l-4 1-3-3z"/>'},
  madenci:{ad:'Madenci',renk:'#8d96a0',ico:'<path d="M4 10c4-5 12-5 16 0M12 7.5L6 21"/>'}
};
const ORDER=['asker','ciftci','muhendis','oduncu','madenci'];
const SPAWN=5;
const HLV=[{cap:5,hp:200,next:90},{cap:7,hp:260,next:150},{cap:10,hp:320,next:0}];
const FLV=[{work:2,hp:80,next:90},{work:3,hp:110,next:150},{work:4,hp:140,next:0}];
const FSLOT=[[.55,.6],[1.45,1.4],[1.45,.6],[.55,1.4]];
const BSPEC={house:{w:2,h:2,hp:200,time:14,wood:30,stone:15},farm:{w:2,h:2,hp:80,time:8,wood:20,stone:0},
  tower:{w:1,h:1,hp:180,time:12,wood:20,stone:30},
  atolye:{w:2,h:2,hp:220,time:10,wood:25,stone:0},kamp:{w:2,h:2,hp:200,time:10,wood:20,stone:5},
  ocak:{w:2,h:2,hp:240,time:12,wood:30,stone:0},ciftlik:{w:2,h:2,hp:200,time:12,wood:25,stone:10},kisla:{w:2,h:2,hp:280,time:14,wood:30,stone:20}};
const BNAME={house:'Ev',farm:'Tarla',tower:'Kule',atolye:'Mühendis Atölyesi',kamp:'Oduncu Kampı',ocak:'Maden Ocağı',ciftlik:'Çiftlik Evi',kisla:'Kışla',main:'Ana Bina'};
const GUILD={muhendis:'atolye',oduncu:'kamp',madenci:'ocak',ciftci:'ciftlik',asker:'kisla'};
const GJOB={atolye:'muhendis',kamp:'oduncu',ocak:'madenci',ciftlik:'ciftci',kisla:'asker'};
const ORD={
  muhendis:[{k:'ev',ad:'Ev yap',kisa:'Ev yap',acik:'Ev 5 kişilik yer açar.',b:'house'},{k:'tarla',ad:'Tarla yap',kisa:'Tarla yap',acik:'Tarlada 2 çiftçi çalışır.',b:'farm'},
    {k:'kule',ad:'Kule yap',kisa:'Kule yap',acik:'Kule yaklaşan düşmana ok atar.',b:'tower'},{k:'tamir',ad:'Tamir et',kisa:'Tamir',acik:'Hasarlı binaları onarırlar.'}],
  oduncu:[{k:'kes',ad:'Odun kes',kisa:'Odun kes',acik:'Ağaç kesip odun getirirler.'},
    {k:'dik',ad:'Ağaç dik',kisa:'Ağaç dik',acik:'Kampın çevresine fidan dikerler. Fidan 1 dakikada ağaç olur. Bu sırada odun gelmez.'},
    {k:'testere',ad:'Testere geliştir',kisa:'Testere',acik:'Kampta çalışırlar, odun gelmez. Her seviyede %40 daha hızlı keserler.',tech:'testere'}],
  madenci:[{k:'kir',ad:'Taş kır',kisa:'Taş kır',acik:'Kaya kırıp taş getirirler.'},
    {k:'kazma',ad:'Kazma geliştir',kisa:'Kazma',acik:'Ocakta çalışırlar, taş gelmez. Her seviyede %40 daha hızlı kırarlar.',tech:'kazma'},
    {k:'guclendir',ad:'Ana binayı güçlendir',kisa:'Güçlendir',acik:'Her seferde 5 taş harcayıp ana binaya 20 can eklerler.'}],
  ciftci:[{k:'hasat',ad:'Hasat et',kisa:'Hasat',acik:'Tarlada çalışıp yemek getirirler.'},
    {k:'sur',ad:'Toprağı sür',kisa:'Toprak sür',acik:'Yemek gelmez ama tarlalar çok daha hızlı seviye atlar.'},
    {k:'saban',ad:'Saban geliştir',kisa:'Saban',acik:'Çiftlik evinde çalışırlar, yemek gelmez. Her seviyede %40 daha hızlı üretirler.',tech:'saban'}],
  asker:[{k:'nobet',ad:'Nöbet tut',kisa:'Nöbet',acik:'Ana binanın çevresinde dolaşıp köyü korurlar.'},
    {k:'talim',ad:'Talim yap',kisa:'Talim',acik:'Kışlada talim yaparlar. Her seviye askerleri %25 güçlendirir. Köy o sırada daha az korunur.',tech:'talim'},
    {k:'avlan',ad:'Avlan',kisa:'Avlan',acik:'Köyün dışında avlanıp yemek getirirler.'}]};
const GDAT={muhendis:'mühendislere',oduncu:'odunculara',madenci:'madencilere',ciftci:'çiftçilere',asker:'askerlere'};
const TECH={testere:{ad:'Testere',max:2,need:[200,400],eff:'oduncular daha hızlı kesiyor'},kazma:{ad:'Kazma',max:2,need:[160,320],eff:'madenciler daha hızlı kırıyor'},
  saban:{ad:'Saban',max:2,need:[160,320],eff:'çiftçiler daha hızlı üretiyor'},talim:{ad:'Talim',max:3,need:[120,240,360],eff:'askerler daha güçlü'}};
const FORTMAX=20;
const missTxt=sp=>[G.res.wood<sp.wood?`${Math.ceil(sp.wood-G.res.wood)} odun`:'',G.res.stone<sp.stone?`${Math.ceil(sp.stone-G.res.stone)} taş`:''].filter(Boolean).join(' ve ');
const costTxt=sp=>[sp.wood?`${sp.wood} odun`:'',sp.stone?`${sp.stone} taş`:''].filter(Boolean).join(' ve ');
const NAMES=['Ali','Ayşe','Mehmet','Fatma','Hasan','Zeynep','Mustafa','Elif','Hüseyin','Emine','Osman','Hatice','Yusuf','Meryem','İbrahim','Esra','Murat','Selin','Kemal','Derya','Burak','Leyla','Cem','Sevgi','Halil','Nazlı','Recep','Gül','Ömer','Songül','Kadir','Aslı','Yakup','Dilek','Ramazan','Sibel'];
const SIDES=['kuzeybatıdan','kuzeydoğudan','güneydoğudan','güneybatıdan'];

const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const inMap=(x,y)=>x>=0&&y>=0&&x<N&&y<N;

let G=null,Z=0.95,cam={x:0,y:0},uid=0,started=false,paused=false,speed=1,ground=null;
