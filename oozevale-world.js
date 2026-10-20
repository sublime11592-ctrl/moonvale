'use strict';
/* Oozevale environments: repainted slime zone maps, matching walkable masks and animated environment FX.
   Data: art/env/env-data.js (built by tools/env_build.py from tools/env_spec.py), loaded on demand.
   - Maps load lazily (current zone first, then the roads out of it) and replace the zone image once decoded.
   - Walk masks: one bit per cell; portals, objectives, quest givers, the hero and creatures are moved to open ground.
   - FX (all pre-rendered sprites, view-culled): ooze pool shimmer + ripples + bubbles, jelly waterfalls, jelly drips,
     lantern flicker and mushroom/crystal glow, light shafts, drifting spores.
     Phones run a lighter set; Reduced motion keeps only still glows; below ~30 fps for 3 s the FX step down
     (and switch off with the existing glow auto-off). ?noart or MV_NOGLOW=true turns it off. */
(()=>{
if(/[?&](noart|classic_env)\b/.test(location.search))return;
if(typeof draw!=='function'||typeof update!=='function'||typeof blocked!=='function')return;
const ENV={data:null,imgs:{},want:new Set()};
const small=()=>innerWidth<700;
const calm=()=>document.documentElement.classList.contains('mv-calm')||matchMedia('(prefers-reduced-motion: reduce)').matches;
/* ---------- data + images ---------- */
function loadData(){const s=document.createElement('script');s.src='art/env/env-data.js?v=6a16aa75';s.onload=()=>{ENV.data=globalThis.OOZE_ENV||{};decodeMasks();want(story.zone);neighbours();};document.head.appendChild(s);}
function decodeMasks(){for(const z in ENV.data){const d=ENV.data[z];const b=atob(d.mask),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);d.bits=u;}}
function want(z){const d=ENV.data&&ENV.data[z];if(!d||ENV.imgs[z])return;const i=new Image();i.decoding='async';ENV.imgs[z]=i;i.onload=()=>{i.ready=true;(i.decode?i.decode():Promise.resolve()).catch(()=>{}).then(()=>{i.decoded=true;});};i.src=d.img;}
function neighbours(){try{const r=routes[story.zone]||[];const go=()=>r.forEach(want);(globalThis.requestIdleCallback||setTimeout)(go,{timeout:4000});}catch(e){}}
const data=(z=story.zone)=>ENV.data&&ENV.data[z]||null;
function active(z=story.zone){const d=data(z),i=ENV.imgs[z];if(!d||!i||!i.ready)return null;if(WORLD.w!==d.w||WORLD.h!==d.h)return null;return d;}
/* ---------- walk mask ---------- */
function maskAt(d,x,y){const i=Math.floor(x/d.cell),j=Math.floor(y/d.cell);if(i<0||j<0||i>=d.cols||j>=d.rows)return false;const n=j*d.cols+i;return (d.bits[n>>3]>>(n&7))&1;}
const beforeBlocked=blocked;
blocked=function(x,y){const d=active();if(!d)return beforeBlocked(x,y);if(x<16||y<16||x>WORLD.w-16||y>WORLD.h-10)return true;return !maskAt(d,x,y);};
function free(x,y){if(!blocked(x,y))return [x,y];for(let r=8;r<600;r+=8)for(let a=0;a<20;a++){const t=a/20*Math.PI*2,nx=x+Math.cos(t)*r,ny=y+Math.sin(t)*r;if(!blocked(nx,ny))return [nx,ny];}return [x,y];}
const memo=new Map();
function fix(o){if(!o||!active()||!Number.isFinite(o.x)||!Number.isFinite(o.y)||!blocked(o.x,o.y))return o;const k=story.zone+':'+Math.round(o.x)+':'+Math.round(o.y);let q=memo.get(k);if(!q){q=free(o.x,o.y);memo.set(k,q);}return {...o,x:Math.round(q[0]),y:Math.round(q[1])};}
const L=f=>function(){const r=f.apply(this,arguments);return Array.isArray(r)?r.map(fix):r;};
function mv(o){const d=active();if(!d||!d.moves||!o)return o;for(const m of d.moves)if(Math.abs(o.x-m[0])<90&&Math.abs(o.y-m[1])<90)return {...o,x:m[2],y:m[3]};return o;}
if(typeof portals==='function'){const pp=portals;portals=function(){const r=pp.apply(this,arguments);return Array.isArray(r)?r.map(o=>fix(mv(o))):r;};}
if(typeof objectivePoints==='function')objectivePoints=L(objectivePoints);
if(typeof expansionPoints==='function')expansionPoints=L(expansionPoints);
if(typeof questGiver==='function'){const qg=questGiver;questGiver=function(){const r=qg.apply(this,arguments);return r&&(arguments[0]==null||arguments[0].zone==null||arguments[0].zone===story.zone)?fix(r):r;};}
if(typeof questDestination==='function'){const qd=questDestination;questDestination=function(){const r=qd.apply(this,arguments);return r&&r.zone===undefined?fix(r):r;};}
function settle(){if(!active())return;if(blocked(p.x,p.y))[p.x,p.y]=free(p.x,p.y);
 for(const m of mobs){if(!m.alive||!blocked(m.x,m.y))continue;const q=free(m.x,m.y);m.x=q[0];m.y=q[1];if(m.home){m.home.x=m.x;m.home.y=m.y;}}
 try{for(const n of residents)if(n.x>-9000&&blocked(n.x,n.y))[n.x,n.y]=free(n.x,n.y);}catch(e){}}
/* ---------- zone art + lighting profile ---------- */
let shownZone=-1,shownImg=null,tick=0,lastZone=-1;
{const u=update;update=function(dt){u(dt);const z=story.zone,d=active(z);
 if(d){const img=ENV.imgs[z];if(art!==img)art=img;zones[z].image=img;if(shownZone!==z||shownImg!==img){shownZone=z;shownImg=img;settle();place();try{globalThis.MoonGlow&&MoonGlow.place();}catch(e){}}if((tick+=dt)>1.5){tick=0;settle();}}
 else if(data(z)&&!ENV.imgs[z])want(z);
 if(z!==lastZone){lastZone=z;neighbours();}};}
if(typeof MoonLights!=='undefined'&&MoonLights.find){const f=MoonLights.find;MoonLights.find=function(img){for(const z in ENV.imgs)if(ENV.imgs[z]===img){const d=data(z);if(d&&d.fx&&d.fx.lights)return d.fx.lights.filter(L=>L[3]!=='fire').slice(0,26).map((L,i)=>({x:L[0],y:L[1],v:99,color:COL[L[3]]||'#ffcf8a',warm:/warm|fire|amber|gold/.test(L[3]),seed:i*1.7}));}return f.apply(this,arguments);};}
if(globalThis.MoonZones&&MoonZones.profile){const pf=MoonZones.profile;const cache={};MoonZones.profile=function(z){const base=pf.apply(this,arguments);const d=data(z);if(!d)return base;const k=z+':'+(base&&base.tint);return cache[k]||(cache[k]={...base,dark:Math.min(base.dark,.24),fogA:Math.min(base.fogA,.05),...(d.prof||{})});};}
/* ---------- sprites ---------- */
const COL={teal:'#5ff5e0',purple:'#b77dff',gold:'#ffc86a',warm:'#ff9a3c',fire:'#ff8a2a',silver:'#e8f0ff',amber:'#ffb43a',pink:'#ff7ad9',blue:'#6fb8ff'};
const mk=(w,h,fn)=>{const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);return c;};
const glowS=hex=>mk(64,64,x=>{const r=x.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,hex+'ff');r.addColorStop(.22,hex+'99');r.addColorStop(.55,hex+'2a');r.addColorStop(1,hex+'00');x.fillStyle=r;x.fillRect(0,0,64,64);});
const GL={};for(const k in COL)GL[k]=glowS(COL[k]);
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`;};
// caustic shimmer tile: soft bright wavy cells
const caustic=hex=>mk(256,256,(x)=>{x.globalCompositeOperation='lighter';let s=7;const R=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);
 for(let i=0;i<70;i++){const cx=R()*256,cy=R()*256,r=10+R()*26;x.strokeStyle=rgba(hex,.10+R()*.18);x.lineWidth=1.5+R()*2.5;
  for(const ox of [-256,0,256])for(const oy of [-256,0,256]){x.beginPath();x.ellipse(cx+ox,cy+oy,r,r*.55,R()*3,0,Math.PI*(1+R()));x.stroke();}}
 const g=x.createRadialGradient(128,128,0,128,128,128);});
const CAU={};
const bubbleS=hex=>mk(32,32,x=>{const g=x.createRadialGradient(13,12,1,16,16,15);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(.45,rgba(hex,.28));g.addColorStop(.85,rgba(hex,.5));g.addColorStop(1,rgba(hex,0));x.fillStyle=g;x.beginPath();x.arc(16,16,15,0,7);x.fill();
 x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=1.2;x.beginPath();x.arc(16,16,13.5,3.6,5.2);x.stroke();x.fillStyle='rgba(255,255,255,.95)';x.beginPath();x.ellipse(11,10,3,2,-.6,0,7);x.fill();});
const BUB={};
const dropS=hex=>mk(16,24,x=>{const g=x.createRadialGradient(6,14,1,8,15,8);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.35,rgba(hex,.85));g.addColorStop(1,rgba(hex,.25));x.fillStyle=g;x.beginPath();x.moveTo(8,1);x.bezierCurveTo(10,8,15,12,15,16);x.arc(8,16,7,0,Math.PI);x.bezierCurveTo(1,12,6,8,8,1);x.fill();});
const DROP={};
const fallS=hex=>mk(64,256,x=>{let s=11;const R=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);x.globalCompositeOperation='lighter';
 for(let i=0;i<46;i++){const cx=R()*64,w=1+R()*3.5,y=R()*256,h=30+R()*120;const g=x.createLinearGradient(0,y,0,y+h);g.addColorStop(0,rgba(hex,0));g.addColorStop(.5,i%5?rgba(hex,.35):'rgba(255,255,255,.55)');g.addColorStop(1,rgba(hex,0));x.fillStyle=g;for(const oy of [-256,0,256])x.fillRect(cx,y+oy,w,h);}});
const FALL={};
const shaftS=hex=>mk(128,256,x=>{const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,rgba(hex,.55));g.addColorStop(.6,rgba(hex,.16));g.addColorStop(1,rgba(hex,0));x.fillStyle=g;x.beginPath();x.moveTo(40,0);x.lineTo(88,0);x.lineTo(128,256);x.lineTo(0,256);x.closePath();x.fill();
 const h=x.createLinearGradient(0,0,128,0);h.addColorStop(0,'rgba(0,0,0,1)');h.addColorStop(.5,'rgba(0,0,0,0)');h.addColorStop(1,'rgba(0,0,0,1)');x.globalCompositeOperation='destination-out';x.fillStyle=h;x.fillRect(0,0,128,256);});
const SHAFT={};
const get=(T,f,k)=>T[k]||(T[k]=f(COL[k]||k));
/* ---------- per-zone state ---------- */
let S=null;
const rnd=s=>()=>((s=Math.imul(s^s>>>15,1|s)+0x6D2B79F5|0),((s^s>>>14)>>>0)/4294967296);
function inEll(P,R){const a=R()*Math.PI*2,r=Math.sqrt(R())*.86;const c=Math.cos(P[5]||0),s=Math.sin(P[5]||0),ex=Math.cos(a)*r*P[2],ey=Math.sin(a)*r*P[3];return [P[0]+ex*c-ey*s,P[1]+ex*s+ey*c];}
function place(){const d=active();if(!d){S=null;return;}const fx=d.fx||{},R=rnd(4441+story.zone*977);
 S={z:story.zone,fx,R,pools:(fx.pools||[]).map(P=>({P,rip:[],bub:[],off:R()*256})),drips:(fx.drips||[]).map((D,i)=>({D,t:-R()*3,per:2.6+R()*2.2})),spores:[]};}
/* ---------- quality / fps ---------- */
let level=2,lockLv=false,ema=1/60,slow=0,lastT=performance.now()/1000,T=0,dt=1/60;
function tickQ(){const n=performance.now()/1000;dt=Math.min(.1,n-lastT);lastT=n;T=n;if(!started||document.hidden)return;ema+=(dt-ema)*.05;slow=ema>1/30?slow+dt:0;if(slow>3&&level>0&&!lockLv){level--;slow=0;ema=1/45;}
 try{if(!lockLv&&globalThis.MoonGlow&&MoonGlow.info().degraded)level=Math.min(level,0);}catch(e){}}
const lite=()=>small()||level<2;
/* ---------- ground pass: ooze surfaces, falls (under actors) ---------- */
function ground(){if(!S||S.z!==story.zone||globalThis.MV_NOGLOW||!active())return;const d=cinematic.dpr||1,vw=g.canvas.width/d,vh=g.canvas.height/d,cx=camera.x,cy=camera.y,still=calm();
 const vis=(x,y,rx,ry)=>x+rx>cx-20&&x-rx<cx+vw+20&&y+ry>cy-20&&y-ry<cy+vh+20;
 g.save();
 for(const o of ((globalThis.MVE&1)||level===0)?[]:S.pools){const P=o.P,[px,py,rx,ry,col]=P,rot=P[5]||0;if(!vis(px,py,rx+40,ry+40))continue;const cau=get(CAU,caustic,col);
  // shimmer: two caustic layers drifting against each other, clipped to the surface
  g.save();g.translate(px,py);g.rotate(rot);g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.clip();g.globalCompositeOperation='lighter';
  const sh=still?0:T;g.globalAlpha=.55;const ox=(o.off+sh*9)%256,oy=(sh*5)%256;
  for(let ix=-rx-256;ix<rx+256;ix+=256)for(let iy=-ry-128;iy<ry+256;iy+=128){g.drawImage(cau,ix-ox+128,iy-oy*.5,256,128);}
  if(!lite()){g.globalAlpha=.35;const ox2=(o.off*2-sh*6)%256;for(let ix=-rx-256;ix<rx+256;ix+=256)for(let iy=-ry-128;iy<ry+256;iy+=128)g.drawImage(cau,ix+ox2,iy+(sh*3)%128,256,128);}
  // slow specular sweep
  if(!still){const sx=((T*.07+o.off/256)%1)*2.6-1.3;g.globalAlpha=.22;g.drawImage(GL.silver,sx*rx-rx*.5,-ry*.6,rx,ry*.9);}
  g.restore();
  if(still)continue;
  const R=S.R;
  // ripples
  const nR=lite()?2:4;if(o.rip.length<nR&&R()<dt*1.6){const q=inEll(P,R);o.rip.push({x:q[0],y:q[1],t:0,m:1.6+R()*1.2,r:14+R()*20});}
  g.globalCompositeOperation='lighter';g.lineWidth=1.6;
  for(let i=o.rip.length-1;i>=0;i--){const r=o.rip[i];r.t+=dt;const k=r.t/r.m;if(k>=1){o.rip.splice(i,1);continue;}const rr=r.r*(.3+k*1.7);g.strokeStyle=rgba(COL[col],(1-k)*.5);g.beginPath();g.ellipse(r.x,r.y,rr,rr*.42,0,0,7);g.stroke();if(k<.6){g.strokeStyle=rgba('#ffffff',(1-k/.6)*.3);g.beginPath();g.ellipse(r.x,r.y,rr*.55,rr*.23,0,0,7);g.stroke();}}
  // bubbles: swell, wobble, pop with a ring
  const nB=Math.min(lite()?4:11,Math.ceil(rx*ry/5200));if(o.bub.length<nB&&R()<dt*5){const q=inEll(P,R);o.bub.push({x:q[0],y:q[1],t:0,m:1.2+R()*2.2,s:5+R()*9});}
  g.globalCompositeOperation='source-over';const bs=get(BUB,bubbleS,col);
  for(let i=o.bub.length-1;i>=0;i--){const b=o.bub[i];b.t+=dt;const k=b.t/b.m;if(k>=1.15){o.bub.splice(i,1);continue;}
   if(k<1){const s=b.s*Math.min(1,k*2.2)*(1+.08*Math.sin(b.t*14));g.globalAlpha=.9;g.drawImage(bs,b.x-s,b.y-s*1.6-k*4,s*2,s*2);}
   else{const kk=(k-1)/.15;g.globalAlpha=1-kk;g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=1.2;g.beginPath();g.ellipse(b.x,b.y-b.s*.6-4,b.s*(1+kk*1.4),b.s*.45*(1+kk*1.4),0,0,7);g.stroke();}}
  g.globalAlpha=1;}
 // jelly waterfalls
 for(const F of (globalThis.MVE&2)?[]:S.fx.falls||[]){const [fx,fy,fw,fh,col]=F;if(!vis(fx+fw/2,fy+fh/2,fw,fh))continue;const tex=get(FALL,fallS,col);
  g.save();g.beginPath();g.rect(fx,fy,fw,fh);g.clip();g.globalCompositeOperation='lighter';g.globalAlpha=.7;const off=still?0:(T*150)%256;
  for(let y=fy-256+off;y<fy+fh;y+=256)g.drawImage(tex,fx,y,fw,256);g.restore();
  g.save();g.globalCompositeOperation='lighter';const pul=still?.5:.45+.15*Math.sin(T*3+fx);g.globalAlpha=pul;g.drawImage(GL[col]||GL.purple,fx-fw*.4,fy+fh-fw*.55,fw*1.8,fw*1.1);g.restore();
  if(!still&&!lite()){const R=S.R;if(R()<dt*6){(S.pools[0]||{rip:[]}).rip;}}}
 g.restore();}
/* ---------- top pass: glows, drips, shafts, spores (over actors and the night layer) ---------- */
function top(){if(!S||S.z!==story.zone||globalThis.MV_NOGLOW||!active())return;const d=cinematic.dpr||1,vw=g.canvas.width/d,vh=g.canvas.height/d,cx=camera.x,cy=camera.y,still=calm(),fx=S.fx;
 const vis=(x,y,r)=>x+r>cx&&x-r<cx+vw&&y+r>cy&&y-r<cy+vh;
 g.save();g.setTransform(d,0,0,d,-cx*d,-cy*d);g.globalCompositeOperation='lighter';
 // light shafts (desktop / full quality only)
 if(!lite()&&level>=2)for(const L of fx.shafts||[]){const [x,y,w,h,col]=L;if(!vis(x,y+h/2,Math.max(w,h)))continue;const a=still?.10:.08+.05*Math.sin(T*.35+x*.01);g.save();g.translate(x,y);g.rotate(-.28+(still?0:.03*Math.sin(T*.2+x)));g.globalAlpha=a;g.drawImage(get(SHAFT,shaftS,col),-w/2,0,w,h);g.restore();}
 // lanterns flicker, fungus & crystals pulse
 const LT=lite(),L0=level===0;for(const L of (globalThis.MVE&4)?[]:fx.lights||[]){const [x,y,r,k]=L;if(L0&&k!=='fire')continue;if(LT&&r<44&&k!=='warm')continue;if(!vis(x,y,r*1.4))continue;const warm=k==='warm'||k==='fire';
  let f;if(still)f=.85;else if(warm)f=.78+.12*Math.sin(T*9+x)+.08*Math.sin(T*23.7+y)+(Math.random()<.03?-.15:0);else f=.66+.3*Math.sin(T*1.6+x*.013+y*.007);
  const R=r*(k==='fire'?1+.06*Math.sin(T*13):1);g.globalAlpha=(k==='fire'?.42:warm?.5:.46)*f;g.drawImage(GL[k]||GL.warm,x-R,y-R*.85,R*2,R*1.7);
  if(!lite()||k==='fire'){g.globalAlpha=.55*f;g.drawImage(warm?GL.gold:GL.silver,x-R*.25,y-R*.25,R*.5,R*.5);}}
 if(!still&&!(globalThis.MVE&8)&&level>0){
  // jelly drips: bead grows, stretches, falls, splats
  g.globalCompositeOperation='source-over';
  for(const o of S.drips){const [x,y,len,col]=o.D;if(!vis(x,y+len/2,len))continue;o.t+=dt;if(o.t>o.per)o.t-=o.per;const t=o.t;if(t<0)continue;const sp=get(DROP,dropS,col);
   if(t<1.1){const k=t/1.1,s=3+k*4;g.globalAlpha=.95;g.drawImage(sp,x-s,y-s*.3,s*2,s*(2.2+k*.9));}
   else if(t<1.1+Math.sqrt(len/300)){const tt=t-1.1,yy=y+.5*600*tt*tt;g.globalAlpha=.95;g.drawImage(sp,x-5,yy,10,17);}
   else{const k=Math.min(1,(t-1.1-Math.sqrt(len/300))/.6);if(k<1){g.globalAlpha=(1-k)*.8;g.fillStyle=rgba(COL[col]||'#5ff5e0',.8);g.beginPath();g.ellipse(x,y+len+12,6+k*10,2.5+k*3,0,0,7);g.fill();}}}
  // drifting spores
  const want=lite()?12:30,cols=fx.spores||['teal','purple','gold'];
  while(S.spores.length<want)S.spores.push(spore(cx,cy,vw,vh,true,cols));if(S.spores.length>want)S.spores.length=want;
  g.globalCompositeOperation='lighter';
  for(let i=0;i<S.spores.length;i++){const m=S.spores[i];m.y-=m.vy*dt;m.x+=(m.vx+Math.sin(T*m.f+m.ph)*m.sw)*dt;m.life-=dt;
   if(m.life<=0||m.x<cx-40||m.x>cx+vw+40||m.y<cy-60||m.y>cy+vh+40){S.spores[i]=spore(cx,cy,vw,vh,false,cols);continue;}
   const a=Math.max(0,Math.min(1,m.life/1.5,(m.max-m.life)/1.5))*(.6+.4*Math.sin(T*2.3+m.ph));g.globalAlpha=a;g.drawImage(GL[m.c]||GL.teal,m.x-m.r*3.5,m.y-m.r*3.5,m.r*7,m.r*7);
   g.globalAlpha=a*.9;g.fillStyle='#ffffff';g.fillRect(m.x-.6,m.y-.6,1.2,1.2);}
 }
 g.restore();}
function spore(cx,cy,vw,vh,any,cols){const max=5+Math.random()*6;return {x:cx+Math.random()*vw,y:any?cy+Math.random()*vh:cy+vh*(.5+Math.random()*.55),vy:8+Math.random()*16,vx:(Math.random()-.5)*8,sw:8+Math.random()*12,f:.4+Math.random()*.8,ph:Math.random()*6.28,r:1.3+Math.random()*1.9,c:cols[Math.floor(Math.random()*cols.length)],life:max,max};}
/* ---------- emissive slime: the hero's own slime, pet and jellylings stay vivid at night ----------
   While the hero actor draws (it also draws the pet and jellylings), every sprite blit is recorded. After the night
   lighting pass the same blits are replayed additively from a slime-only copy of each image (pixels in the current
   slime colour's hue band), plus a soft halo in that colour around the hero and the pet. */
const emi=new WeakMap();let rec=[],recOn=false,emiBudget=0;
function hueOf(hex){const n=parseInt(hex.slice(1),16),r=(n>>16)/255,gg=(n>>8&255)/255,b=(n&255)/255,mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),c=mx-mn;if(c<.08)return -1;let h=mx===r?((gg-b)/c)%6:mx===gg?(b-r)/c+2:(r-gg)/c+4;h*=60;return h<0?h+360:h;}
function slimeHex(){try{return MoonSlime.hex(MoonSlime.current());}catch(e){return '#5ff5e0';}}
function emissive(img,hue,hue2){let per=emi.get(img);if(!per){per={};emi.set(img,per);}const k=(hue|0)+':'+(hue2|0);if(per[k]!==undefined)return per[k];
 if(emiBudget<=0)return null;emiBudget--;const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;if(!w||!h||w*h>4.2e6)return per[k]=false;
 const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});let id;try{x.drawImage(img,0,0);id=x.getImageData(0,0,w,h);}catch(e){return per[k]=false;}
 const d=id.data;let any=0;
 for(let i=0;i<d.length;i+=4){const a=d[i+3];if(a<10){d[i+3]=0;continue;}const r=d[i]/255,gg=d[i+1]/255,b=d[i+2]/255,mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),ch=mx-mn;let wgt=0;
  if(hue<0){wgt=mx>.72&&ch<.18?(mx-.72)/.28:0;}
  else if(ch>.1&&mx>.28){let hh=mx===r?((gg-b)/ch)%6:mx===gg?(b-r)/ch+2:(r-gg)/ch+4;hh*=60;if(hh<0)hh+=360;let dh=Math.abs(((hh-hue+540)%360)-180);if(hue2>=0)dh=Math.min(dh,Math.abs(((hh-hue2+540)%360)-180));const s=ch/mx;if(dh<40&&s>.28)wgt=Math.min(1,(40-dh)/14)*Math.min(1,(s-.28)/.2)*Math.min(1,(mx-.28)/.2);}
  if(wgt<=.02){d[i+3]=0;continue;}any++;d[i+3]=Math.round(a*wgt);}
 if(any<20)return per[k]=false;x.putImageData(id,0,0);return per[k]=c;}
function emissivePass(){const list=rec;rec=[];if(globalThis.MV_NOGLOW||globalThis.MV_NOEMIT||(globalThis.MVE&16)||!started||!list.length)return;emiBudget=2;const hx=slimeHex(),hue=hueOf(hx),d=cinematic.dpr||1;let hue2=-1;try{hue2=hueOf(MoonSlime.hex(MoonPet.color()));}catch(e){}
 g.save();g.globalCompositeOperation='lighter';
 for(const r of list){const e=emissive(r.a[0],hue,hue2);if(!e)continue;g.setTransform(r.t);g.globalAlpha=.5*r.al;const a=r.a.slice();a[0]=e;try{g.drawImage.apply(g,a);}catch(err){}}
 g.setTransform(d,0,0,d,-camera.x*d,-camera.y*d);const gl=GL[nearest(hx)];
 g.globalAlpha=.2;g.drawImage(gl,p.x-60,p.y-120,120,120);
 try{const pt=globalThis.MoonPet&&MoonPet.state;if(pt&&pt.seen&&Number.isFinite(pt.x)){const pc=MoonSlime.hex(MoonPet.color());g.globalAlpha=.3;g.drawImage(GL[nearest(pc)],pt.x-42,pt.y-70,84,80);}}catch(e){}
 g.restore();}
const NEAR={};function nearest(hex){if(NEAR[hex])return NEAR[hex];const h=hueOf(hex);let k='silver';if(h>=0){const opts={teal:172,purple:275,gold:44,warm:26,pink:320,blue:212};let best=1e9;for(const o in opts){const dd=Math.abs(((h-opts[o]+540)%360)-180);if(dd<best){best=dd;k=o;}}}return NEAR[hex]=k;}
/* ---------- hooks ---------- */
let frame=0,groundDone=-1;
const bd=draw;draw=function(){tickQ();frame++;rec=[];const r=bd.apply(this,arguments);if(started){try{top();}catch(e){}try{emissivePass();}catch(e){}}return r;};
const gDraw=g.drawImage;
function recDraw(){if(g.globalCompositeOperation==='source-over'&&g.globalAlpha>.3&&rec.length<40){const im=arguments[0];if(im&&(im.width||im.naturalWidth)>12)rec.push({a:Array.prototype.slice.call(arguments),t:g.getTransform(),al:g.globalAlpha});}return gDraw.apply(g,arguments);}
if(typeof actor==='function'){const ba=actor;actor=function(o,hero,ghost){if(groundDone!==frame){groundDone=frame;if(started)try{ground();}catch(e){}}
 if(hero&&(ghost===undefined||ghost===1)&&!recOn&&!globalThis.MV_NOGLOW){recOn=true;g.drawImage=recDraw;try{return ba.apply(this,arguments);}finally{g.drawImage=gDraw;recOn=false;}}
 return ba.apply(this,arguments);};}
/* ---------- world map: repainted regions show their new painting ---------- */
if(typeof openWorld==='function'){const ow=openWorld;openWorld=function(){const r=ow.apply(this,arguments);try{if(ENV.data&&typeof mapDialog!=='undefined')for(const b of mapDialog.querySelectorAll('[data-region]')){const d=ENV.data[b.dataset.region],img=b.querySelector('img');if(d&&d.thumb&&img){img.src=d.thumb;img.classList.add('ooze-thumb');}}}catch(e){}return r;};
 try{if(typeof worldButton!=='undefined'&&worldButton)worldButton.onclick=()=>openWorld();}catch(e){}}
globalThis.OozeWorld={active,data,place,settle,free,info:()=>({zone:story.zone,active:!!active(),level,pools:S?S.pools.length:0,lights:S?(S.fx.lights||[]).length:0,spores:S?S.spores.length:0,loaded:Object.keys(ENV.imgs).filter(z=>ENV.imgs[z].ready)}),setLevel:(v,lock)=>{level=v;lockLv=!!lock;slow=0;}};
loadData();
})();
