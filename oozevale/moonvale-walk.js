'use strict';
/* Walkable areas that match the painted zone maps (art/zone-*.webp are drawn 1:1 in world space, 1800x1200).
   Each painted zone gets a walkable outline plus blocked shapes (tents, rocks, shrubs, pillars, water).
   Only applies to zones that show a painted map and have a mask here; every other zone keeps its old rules.
   Anything that would start inside a blocked spot (hero, NPC spots, creatures) is nudged to the nearest open ground. */
(()=>{
 const E=(x,y,rx,ry)=>({e:[x,y,rx,ry]});
 const WALK={
  0:{ // Lantern Rest / The Elder Grove (zone-camp)
   walk:[[320,250],[440,150],[560,108],[760,98],[930,112],[985,150],[1060,170],[1180,210],[1300,250],[1380,290],[1460,380],[1560,420],[1640,470],[1660,560],[1590,630],[1460,640],[1410,700],[1440,810],[1380,880],[1290,905],[1230,960],[1185,1050],[1060,1092],[900,1102],[760,1092],[660,1050],[590,990],[548,900],[560,820],[640,780],[680,700],[650,610],[590,560],[540,470],[470,410],[380,350],[315,300]],
   block:[E(575,290,215,82),E(1070,440,150,80),E(1105,800,140,62),E(746,637,88,46),E(1350,650,50,36),E(1135,890,66,48),E(625,915,70,60),E(640,1045,40,30),E(1490,720,58,58),E(1236,160,22,62),E(1374,290,24,52),E(1560,362,66,38)]
  },
  2:{ // Hollow Sanctum (zone-chapel)
   walk:[[250,560],[470,556],[620,560],[632,330],[1000,318],[1100,290],[1440,288],[1462,600],[1600,600],[1600,830],[1782,850],[1782,1182],[40,1182],[40,880],[250,862]],
   block:[E(362,700,55,142),E(856,560,46,58),E(669,686,46,62),E(1284,670,38,66),E(1095,916,48,72),E(1471,890,46,98),E(1712,1050,70,150),E(527,988,80,42),E(1251,368,158,64),E(1696,702,94,90)]
  },
  5:{ // Duskfen Marsh (zone-marsh): the two boardwalks, the reed bank between them, the hut porch and two dry banks
   lines:[{w:50,l:[[1196,329],[1185,406],[1097,527],[944,593],[834,571],[724,483],[593,450],[505,472],[417,505],[263,615],[154,702],[132,790],[176,900],[285,966],[329,1054],[307,1190]]},
          {w:50,l:[[768,779],[878,812],[988,878],[1097,944],[1207,966],[1317,922],[1427,834],[1536,757],[1668,713],[1792,702]]}],
   areas:[E(760,680,92,118),E(1250,372,120,56),E(175,1010,100,80)],
   block:[E(1250,190,180,150)]
  }
 };
 const segD=(x,y,[ax,ay],[bx,by])=>{const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-ax-t*dx,y-ay-t*dy);};
 const onLine=(x,y,L)=>{for(let i=1;i<L.l.length;i++)if(segD(x,y,L.l[i-1],L.l[i])<L.w)return true;return false;};
 const inPoly=(x,y,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if(((yi>y)!==(yj>y))&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;};
 const hitE=(x,y,[cx,cy,rx,ry])=>((x-cx)/rx)**2+((y-cy)/ry)**2<1;
 function active(){const z=story.zone,m=WALK[z];if(!m)return null;
  if(typeof inFrontier==='function'&&inFrontier())return null;if(typeof realmFor==='function'&&realmFor())return null;
  if(zones[z]&&zones[z].frontier)return null;return m;}
 function blockedIn(m,x,y){if(x<20||y<20||x>WORLD.w-20||y>WORLD.h-12)return true;
  let walk=!!(m.walk&&inPoly(x,y,m.walk));if(!walk&&m.lines)walk=m.lines.some(L=>onLine(x,y,L));if(!walk&&m.areas)walk=m.areas.some(a=>hitE(x,y,a.e));
  if(!walk)return true;for(const b of m.block||[])if(b.e&&hitE(x,y,b.e))return true;return false;}
 const before=blocked;
 blocked=function(x,y){const m=active();return m?blockedIn(m,x,y):before(x,y);};
 // nearest open ground (spiral search), used to rescue anything placed inside a blocked shape
 function free(x,y){if(!blocked(x,y))return [x,y];for(let r=8;r<400;r+=8)for(let a=0;a<16;a++){const t=a/16*Math.PI*2,nx=x+Math.cos(t)*r,ny=y+Math.sin(t)*r;if(!blocked(nx,ny))return [nx,ny];}return [x,y];}
 function settle(){if(!active())return;
  if(blocked(p.x,p.y)){[p.x,p.y]=free(p.x,p.y);}
  for(const m of mobs){if(m.alive&&blocked(m.x,m.y)){const q=free(m.x,m.y);m.x=q[0];m.y=q[1];if(m.home){m.home.x=m.x;m.home.y=m.y;}if(m.sx!==undefined){m.sx=m.x;m.sy=m.y;}}}}
 // road markers / portals that land inside scenery move to the nearest open ground (trigger and marker move together)
 if(typeof portals==='function'){const pb=portals;portals=function(){const list=pb();if(!active()||!Array.isArray(list))return list;
  return list.map(o=>{if(!blocked(o.x,o.y))return o;const q=free(o.x,o.y);return {...o,x:Math.round(q[0]),y:Math.round(q[1])};});};}
 if(typeof objectivePoints==='function'){const ob=objectivePoints;objectivePoints=function(){const list=ob();if(!active()||!Array.isArray(list))return list;
  return list.map(o=>{if(!o||o.resident||!blocked(o.x,o.y))return o;const q=free(o.x,o.y);return {...o,x:Math.round(q[0]),y:Math.round(q[1])};});};}
 let lastZone=-1,tick=0;
 {const u=update;update=function(dt){u(dt);if(story.zone!==lastZone){lastZone=story.zone;settle();}if((tick+=dt)>1.5){tick=0;settle();}};}
 globalThis.MoonWalk={WALK,blockedIn,active,free,settle};
})();
