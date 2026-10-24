'use strict';
/* Oozevale roaming world: one continuous 5×5 world.
   - Explicit world graph (OOZE_ROAM.grid / adj, built by tools/roam_build.py from the walk masks). routes[] follow it.
   - Walk off the walkable edge of a region (N/S/W/E) into the neighbour; you arrive at its opposite edge at the same
     relative spot, keys still held, with a 0.25 s fade. No teleport portals: the old "Road to" points now sit on the edges.
   - Varied layouts: quest givers, travelling residents, mob packs, landmarks and the elite lair are spread over each
     region's own walkable sites (seeded per zone). Small camps stay only in hub regions. */
(()=>{
const R=globalThis.OOZE_ROAM;if(!R||typeof travel!=='function'||typeof routes==='undefined')return;
const COLS=90,ROWS=60,OPP={N:'S',S:'N',W:'E',E:'W'},DIR={N:[0,-1],S:[0,1],W:[-1,0],E:[1,0]},WORD={N:'north',S:'south',W:'west',E:'east'};
const Z=z=>R.zones[z]||null;const here=()=>{const d=Z(story.zone);return d&&WORLD.w===d.W&&WORLD.h===d.H?d:null;};
// ---------- graph ----------
for(let z=0;z<zones.length;z++)routes[z]=Object.values(R.adj[z]||{});
const sideTo=(a,b)=>Object.keys(R.adj[a]||{}).find(s=>R.adj[a][s]===b);
// ---------- masks (reachable cells) ----------
for(const z in R.zones){const d=R.zones[z],b=atob(d.m),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);d.bits=u;d.band={};for(const s in d.gates)d.band[s]=new Set(d.gates[s].cells);
 const near=(x,y)=>{let best=null,bd=1e18;for(const s in d.gates)for(const n of d.gates[s].cells){const cx=(n%COLS+.5)*d.cell,cy=((n/COLS|0)+.5)*d.cell,e=(cx-x)**2+(cy-y)**2;if(e<bd){bd=e;best=[cx,cy];}}return best;};
 for(const s in d.gates){const g=d.gates[s];g.p=near(g.c[0],g.c[1])||g.c;}}
const reach=(d,i,j)=>i>=0&&j>=0&&i<COLS&&j<ROWS&&((d.bits[(j*COLS+i)>>3]>>((j*COLS+i)&7))&1);
function snap(d,x,y){const c=d.cell;let i=Math.floor(x/c),j=Math.floor(y/c);if(reach(d,i,j))return [x,y];for(let r=1;r<40;r++)for(let a=-r;a<=r;a++)for(const [u,v] of [[i+a,j-r],[i+a,j+r],[i-r,j+a],[i+r,j+a]])if(reach(d,u,v))return [(u+.5)*c,(v+.5)*c];return [x,y];}
// Starfall's painted mask is empty: give it an open rectangle so the region is walkable at all.
{const bb=blocked;blocked=function(x,y){const d=here();if(d&&d.fallback)return x<120||x>d.W-120||y<140||y>d.H-90;return bb(x,y);};}
// ---------- seeded layout ----------
const rng=s=>()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;};
const LAY={};
function layout(z){if(LAY[z])return LAY[z];const d=Z(z);if(!d)return null;const r=rng(z*977+31),wild=[...d.wild];for(let i=wild.length-1;i>0;i--){const k=Math.floor(r()*(i+1));[wild[i],wild[k]]=[wild[k],wild[i]];}
 const gates=Object.keys(R.adj[z]).map(s=>d.gates[s].p),used=new Set();const take=f=>{let best=-1,bv=-1e18;wild.forEach((w,i)=>{if(used.has(i))return;const v=f(w)+r()*40;if(v>bv){bv=v;best=i;}});if(best<0)return d.sites[0];used.add(best);return wild[best];};
 const nearGate=w=>-Math.min(...gates.map(g=>Math.hypot(w[0]-g[0],w[1]-g[1])));
 const onRoad=w=>{if(gates.length<2)return nearGate(w);const a=gates[0],b=gates[1],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;return -Math.hypot(w[0]-mx,w[1]-my);};
 const names=zones[z].frontier?.givers||[];const ROLE=/scout|tracker|ranger|watch|pathfinder|cliff|rider|explorer|guide|surveyor|prospector|warden/i,TRADE=/trader|cooper|cook|quarter|tinker|sail|boat|miller|merchant|steward|florist/i;
 const SPOTS=['by the pond','at the old well','under the great tree','beside the standing stones','in the clearing','at the ruined shrine'];
 const giver=names.map((n,i)=>{if(i===0&&d.camp)return null;const w=ROLE.test(n)?take(nearGate):TRADE.test(n)?take(onRoad):take(()=>0);const where=ROLE.test(n)?'on the ridge':TRADE.test(n)?'on the road':SPOTS[Math.floor(r()*SPOTS.length)];
  const cx=w[0]/d.W-.5,cy=w[1]/d.H-.5,comp=(Math.abs(cy)>.17?(cy<0?'north':'south'):'')+(Math.abs(cx)>.17?(cy&&Math.abs(cy)>.17?'-':'')+(cx<0?'west':'east'):'');return {x:w[0],y:w[1],where:(comp?comp+' · ':'')+where};});
 const res={merchant:take(onRoad),guide:take(nearGate),wayfarer:take(()=>0)};
 const packs=wild.filter((w,i)=>!used.has(i));
 return LAY[z]={giver,res,packs,sites:d.sites};}
// ---------- mob packs spread through the wilderness ----------
for(let z=0;z<zones.length;z++){const d=Z(z),L=layout(z);if(!d||!L||!L.packs.length)continue;const r=rng(z*131+7);let k=0,left=0,c=null;
 for(const m of zones[z].mobs){if(m.type==='boss'||m.lairMob)continue;if(left<=0){c=L.packs[k++%L.packs.length];left=3+Math.floor(r()*3);}left--;const a=r()*6.283,rad=30+r()*80;const q=snap(d,c[0]+Math.cos(a)*rad,c[1]+Math.sin(a)*rad);m.x=q[0];m.y=q[1];m.home={x:m.x,y:m.y};}}
// ---------- quest givers scattered (frontier regions) ----------
{const qg=questGiver;questGiver=function(q=null){const o=qg.apply(this,arguments);if(!o||o.hub===undefined)return o;const z=q?.zone??story.zone,L=layout(z),s=L&&L.giver[o.hub];if(!s)return o;return {...o,x:s.x,y:s.y,where:s.where,label:o.label+' · '+s.where};};}
// residents: in non-camp regions the merchant waits on the road, the guide by an edge, the wayfarer in the wilds.
function scatterResidents(zone){const d=Z(zone),L=layout(zone);if(!d||!L||d.camp)return;try{for(const n of residents){if(n.id==='chronicler')continue;const k=/quarter/i.test(n.name||n.label||'')?'merchant':/guide|caravan/i.test(n.name||n.label||'')?'guide':/way/i.test(n.name||n.label||'')?'wayfarer':null;if(k){n.x=L.res[k][0];n.y=L.res[k][1];}}}catch(e){}}
if(typeof setWorldGeometry==='function'){const sg=setWorldGeometry;setWorldGeometry=function(zone){sg.apply(this,arguments);scatterResidents(zone);};}
// ---------- landmarks / lair / gather points use the region's own sites ----------
const hashSite=(z,x,y,salt)=>{const L=layout(z);if(!L)return null;const h=Math.abs(Math.round(x)*73856093^Math.round(y)*19349663^(salt|0)*83492791)%Math.max(1,L.sites.length-2);return L.sites[1+h];};
const remap=o=>{if(!o||!inFrontierZone())return o;if(o.bossHint||o.resident||o.hub!==undefined||o.zone!==undefined||o.cache)return o;if(Math.hypot(o.x-CAMP.x,o.y-CAMP.y)<260)return o;const s=hashSite(story.zone,o.x,o.y,o.id==null?0:String(o.id).length+(+o.id||0));return s?{...o,x:s[0],y:s[1]}:o;};
const inFrontierZone=()=>!!zones[story.zone]?.frontier&&!!here();
if(typeof frontierLandmarks==='function'){const fl=frontierLandmarks;frontierLandmarks=function(){return fl.apply(this,arguments).map(remap);};}
{const ep=expansionPoints;expansionPoints=function(){const r=ep.apply(this,arguments);return Array.isArray(r)?r.map(o=>o&&['✦','⌖','◇'].includes(o.glyph)?remap(o):o):r;};}
{const op=objectivePoints;objectivePoints=function(){const r=op.apply(this,arguments);return Array.isArray(r)?r.map(o=>o&&o.lair?remap(o):o):r;};}
// ---------- edge exits replace portals ----------
portals=function(){const d=here();if(!d)return [];return Object.entries(R.adj[story.zone]||{}).map(([s,z])=>({x:d.gates[s].p[0],y:d.gates[s].p[1],label:'Road to '+zones[z].name+' · '+WORD[s]+' edge',glyph:'⌁',zone:z,edge:s}));};
if(typeof nextQuestRoad==='function')nextQuestRoad=function(zone){const path=worldRoadTo(zone);return portals().find(o=>o.zone===path[1])||null;};
{const is=interactStory;interactStory=function(){const o=nearestInteraction();if(o&&o.edge&&o.zone!==undefined){cross(o.edge);return true;}return is.apply(this,arguments);};}
const veil=document.createElement('div');veil.id='roamVeil';veil.style.cssText='position:fixed;inset:0;background:#070a10;opacity:0;pointer-events:none;z-index:40;transition:opacity .22s ease-out';document.body.appendChild(veil);
const ST={cool:0,armed:true,lx:0,ly:0,last:null};
function cross(side){const from=story.zone,to=R.adj[from]?.[side],a=here(),b=Z(to);if(to===undefined||!a||!b)return false;
 const f=side==='W'||side==='E'?p.y/a.H:p.x/a.W;veil.style.transition='none';veil.style.opacity='.92';
 const pet=globalThis.MoonPet;travel(to);if(story.zone!==to){veil.style.opacity='0';p.x-=DIR[side][0]*30;p.y-=DIR[side][1]*30;return false;}
 const band=b.gates[OPP[side]].cells;let best=band[0],bd=1e9;for(const n of band){const i=n%COLS,j=n/COLS|0,v=side==='W'||side==='E'?(j+.5)*b.cell/b.H:(i+.5)*b.cell/b.W;const e=Math.abs(v-f);if(e<bd){bd=e;best=n;}}
 let i=best%COLS,j=best/COLS|0;for(let k=0;k<4&&reach(b,i+DIR[side][0],j+DIR[side][1]);k++){i+=DIR[side][0];j+=DIR[side][1];}
 p.x=(i+.5)*b.cell;p.y=(j+.5)*b.cell;camera.x=clamp(p.x-view.w/2,0,Math.max(0,WORLD.w-view.w));camera.y=clamp(p.y-view.h/2,0,Math.max(0,WORLD.h-view.h));
 ST.armed=false;ST.cool=.6;ST.last={from,to,side,t:performance.now()};
 requestAnimationFrame(()=>requestAnimationFrame(()=>{veil.style.transition='opacity .22s ease-out';veil.style.opacity='0';}));return true;}
function edgeTick(dt){ST.cool-=dt;const d=here();if(!d)return;if(typeof started!=='undefined'&&!started)return;if(document.querySelector('dialog[open]'))return;
 let ix=((keys.d||keys.arrowright)?1:0)-((keys.a||keys.arrowleft)?1:0)+(typeof stickX==='number'?stickX:0),iy=((keys.s||keys.arrowdown)?1:0)-((keys.w||keys.arrowup)?1:0)+(typeof stickY==='number'?stickY:0);
 const mx=p.x-ST.lx,my=p.y-ST.ly;ST.lx=p.x;ST.ly=p.y;if(!ix&&!iy&&Math.hypot(mx,my)>40*dt&&Math.hypot(mx,my)<400*dt){ix=mx;iy=my;}const il=Math.hypot(ix,iy);
 const c=d.cell,ci=Math.floor(p.x/c),cj=Math.floor(p.y/c);let inBand=false;
 for(const s in R.adj[story.zone]){const band=d.band[s];let hit=false;for(let a=-2;a<=2&&!hit;a++)for(let b=-2;b<=2&&!hit;b++)if(band.has((cj+b)*COLS+ci+a))hit=true;if(!hit)continue;inBand=true;
  if(ST.armed&&ST.cool<=0&&il>.2&&(ix*DIR[s][0]+iy*DIR[s][1])/il>.55&&!(globalThis.frontierState&&frontierState.lair)){cross(s);return;}}
 if(!inBand||ST.cool<-.6)ST.armed=true;}
{const up=update;update=function(dt){up.apply(this,arguments);try{edgeTick(dt);}catch(e){}};}
// ---------- edge signposts (drawn in world space, after lighting) ----------
{const dr=draw;draw=function(){dr.apply(this,arguments);const d=here();if(!d||(typeof started!=='undefined'&&!started))return;g.save();try{g.setTransform(cinematic.dpr,0,0,cinematic.dpr,-camera.x*cinematic.dpr,-camera.y*cinematic.dpr);
 for(const [s,z] of Object.entries(R.adj[story.zone]||{})){const [x,y]=d.gates[s].p;if(x<camera.x-200||x>camera.x+view.w+200||y<camera.y-200||y>camera.y+view.h+200)continue;const t=performance.now()/1000,bob=Math.sin(t*2.4)*5,[dx,dy]=DIR[s];
  g.globalAlpha=.85;g.fillStyle='#ffe08b';g.strokeStyle='#2a1a00';g.lineWidth=3;g.save();g.translate(x+dx*(18+bob),y+dy*(18+bob)-30);g.rotate(Math.atan2(dy,dx));g.beginPath();g.moveTo(16,0);g.lineTo(-8,-12);g.lineTo(-2,0);g.lineTo(-8,12);g.closePath();g.stroke();g.fill();g.restore();
  g.font='bold 15px Georgia,serif';g.textAlign='center';g.lineWidth=4;const label=zones[z].name;g.strokeText(label,x,y-62);g.fillText(label,x,y-62);g.globalAlpha=1;}
 }catch(e){}g.restore();};}
// ---------- world map: the 5×5 graph ----------
if(typeof openWorld==='function'){const ow=openWorld;openWorld=function(){if(globalThis.frontierState)frontierState.worldFilter='All';ow.apply(this,arguments);const grid=mapDialog.querySelector('.world-grid');if(!grid)return;
 mapDialog.querySelector('.world-filters')?.remove();const ps=mapDialog.querySelectorAll('p');if(ps[1])ps[1].textContent='One continuous land. Walk off any edge of a region to step into its neighbour — no portals. Visited camps still offer a waypoint.';
 const nb=R.adj[story.zone]||{};const rt=mapDialog.querySelector('.world-route');if(rt)rt.textContent='From here: '+Object.entries(nb).map(([s,z])=>WORD[s]+' → '+zones[z].name).join(' · ');
 grid.classList.add('roam-grid');for(const btn of grid.querySelectorAll('[data-region]')){const z=+btn.dataset.region,pp=R.pos[z];if(!pp)continue;btn.style.gridColumn=pp[0]+1;btn.style.gridRow=pp[1]+1;const s=sideTo(story.zone,z);btn.classList.toggle('roam-here',z===story.zone);btn.classList.toggle('roam-next',!!s);
  const sp=btn.querySelector('span');if(sp&&s)sp.textContent='Walk '+WORD[s];for(const [side,n] of Object.entries(R.adj[z]))if(side==='E'||side==='S'){const k=document.createElement('i');k.className='roam-link roam-'+side;btn.appendChild(k);}}};
 worldButton.onclick=()=>openWorld();}
const css=document.createElement('style');css.textContent='.world-grid.roam-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:10px!important;position:relative}.roam-grid>button{position:relative;overflow:visible!important;min-width:0}.roam-grid>button{padding:4px!important;min-height:0!important}.roam-grid>button img{width:100%;aspect-ratio:5/2;object-fit:cover;height:auto!important}.world-grid.roam-grid>button b{font-size:12px!important;line-height:1.15!important;display:block;margin:2px 0 0!important}.world-grid.roam-grid>button small{display:none!important}.world-grid.roam-grid>button span{font-size:10px!important;margin:0!important;padding:0!important}.roam-grid .roam-here{outline:3px solid #ffd257;box-shadow:0 0 18px #ffd25788}.roam-grid .roam-next{outline:2px dashed #9fe3b0}.roam-link{position:absolute;background:#c9a95c;pointer-events:none;border-radius:2px}.roam-link.roam-E{right:-10px;top:45%;width:10px;height:4px}.roam-link.roam-S{bottom:-10px;left:48%;width:4px;height:10px}@media(max-width:700px){.world-grid.roam-grid{gap:6px!important}.world-grid.roam-grid>button{padding:2px!important}.world-grid.roam-grid>button span{display:none!important}.world-grid.roam-grid>button b{font-size:8.5px!important;word-break:break-word}.roam-link.roam-E{right:-6px!important;width:6px!important}.roam-link.roam-S{bottom:-6px!important;height:6px!important}}';document.head.appendChild(css);
// mob colours given as rgb() broke glow()'s hex-alpha stamps once packs moved into view: normalise to hex.
if(typeof glow==='function'){const gw=glow,hx=c=>{const m=/^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c);return m?'#'+[m[1],m[2],m[3]].map(v=>(+v).toString(16).padStart(2,'0')).join(''):c;};glow=function(x,y,r,color,...a){return gw.call(this,x,y,r,typeof color==='string'&&color[0]==='r'?hx(color):color,...a);};}
globalThis.OozeRoam={cross,layout,state:ST,data:R,sideTo};
})();
