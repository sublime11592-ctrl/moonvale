/* Moonvale glow layer: glowing mushroom clusters (teal/purple, pulsing, additive), flickering lantern light,
   floating teal/purple/gold motes, chrome glints on loot, and living jelly slimes (wobble, bubbles, drips, halo).
   Cheap: pre-rendered sprites, view culling, counts scaled down on phones, all skipped under reduced motion where it moves. */
(()=>{
if(typeof draw!=='function'||typeof actor!=='function')return;
const small=()=>innerWidth<700;
const calm=()=>document.documentElement.classList.contains('mv-calm')||matchMedia('(prefers-reduced-motion: reduce)').matches;
const now=()=>performance.now()/1000;
const mk=(w,h,fn)=>{const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);return c;};
const glowSprite=hex=>mk(64,64,(x,w)=>{const r=x.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,hex+'ff');r.addColorStop(.25,hex+'88');r.addColorStop(.6,hex+'22');r.addColorStop(1,hex+'00');x.fillStyle=r;x.fillRect(0,0,64,64);});
const GLOW={teal:glowSprite('#5ff5e0'),purple:glowSprite('#b77dff'),gold:glowSprite('#ffc86a'),warm:glowSprite('#ff9a3c'),silver:glowSprite('#e8f0ff')};
/* ---------- mushroom cluster sprites (x2 resolution) ---------- */
function shroom(x,cx,by,h,r,cap,gill){x.fillStyle='#e9f3ee';x.beginPath();x.moveTo(cx-r*.22,by);x.quadraticCurveTo(cx-r*.3,by-h*.6,cx-r*.12,by-h);x.lineTo(cx+r*.12,by-h);x.quadraticCurveTo(cx+r*.3,by-h*.6,cx+r*.22,by);x.closePath();x.fill();
 x.fillStyle='rgba(0,0,0,.18)';x.fillRect(cx,by-h,r*.12,h);
 const g=x.createLinearGradient(0,by-h-r*.9,0,by-h+r*.2);g.addColorStop(0,gill);g.addColorStop(.55,cap);g.addColorStop(1,'#1b1030');
 x.fillStyle=g;x.beginPath();x.ellipse(cx,by-h,r,r*.62,0,Math.PI,0);x.quadraticCurveTo(cx,by-h+r*.28,cx-r,by-h);x.fill();
 x.fillStyle=gill;x.globalAlpha=.9;x.beginPath();x.ellipse(cx,by-h+1,r*.86,r*.16,0,0,Math.PI*2);x.fill();x.globalAlpha=1;
 x.fillStyle='rgba(255,255,255,.75)';for(const [dx,dy,s] of [[-.45,-.32,.11],[.15,-.45,.08],[.5,-.2,.07]]){x.beginPath();x.arc(cx+dx*r,by-h+dy*r,s*r+.6,0,7);x.fill();}
 x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.ellipse(cx-r*.35,by-h-r*.35,r*.28,r*.1,-.4,0,7);x.fill();}
const PAL={teal:['#2fd6c3','#b9fff4'],purple:['#9b5cf0','#efd6ff']};
const CL=[[[-9,0,13,7],[3,2,9,5.5],[10,-1,6,4]],[[-6,1,10,6],[5,0,15,8],[-14,2,6,4],[13,2,5,3.5]],[[0,0,12,7.5],[-10,2,7,4.5]]];
const SPR={};for(const k of ['teal','purple'])SPR[k]=CL.map(set=>mk(84,64,(x)=>{x.scale(2,2);for(const [dx,dy,h,r] of set)shroom(x,21+dx,30+dy,h,r,PAL[k][0],PAL[k][1]);}));
/* ---------- placement ---------- */
let zoneKey=-1,clusters=[],lamps=[],motes=[];
const rnd=s=>()=>((s=Math.imul(s^s>>>15,1|s)+0x6D2B79F5|0),((s^s>>>14)>>>0)/4294967296);
const kind=()=>{try{return MoonZones.kindFor(story.zone)}catch{return ''}};
function place(){zoneKey=story.zone;clusters=[];lamps=[];const k=kind();const R=rnd(9173+story.zone*131);
 if(k==='grove'||k==='marsh'){const want=small()?12:18;let tries=0;
  while(clusters.length<want&&tries++<900){const x=60+R()*(WORLD.w-120),y=80+R()*(WORLD.h-140);
   if(Math.hypot(x-CAMP.x,y-CAMP.y)<170)continue;
   let b=true,near=false;try{b=blocked(x,y);near=!blocked(x+34,y)||!blocked(x-34,y)||!blocked(x,y+28)||!blocked(x,y-28);}catch{b=false;near=true;}
   if(!(b&&near))continue; if(clusters.some(c=>Math.hypot(c.x-x,c.y-y)<120))continue;
   clusters.push({x,y,c:R()<(k==='marsh'?.55:.45)?'purple':'teal',v:Math.floor(R()*3),ph:R()*6.28,s:1.15+R()*.45});}}
 if(story.zone===0){lamps=[[614,798],[854,872],[598,922],[685,1064],[1047,1073],[1077,886],[1208,929],[1485,1000],[1484,1040]].map(([x,y],i)=>({x,y,r:58,ph:i*1.7}));
  lamps.push({x:884,y:950,r:112,ph:0,fire:true});
  for(const [x,y,c] of [[624,778,'teal'],[1148,856,'teal']])clusters.push({x,y,c,v:-1,ph:x*.01,s:1});}
 motes=[];}
/* ---------- ground pass (before the first actor of each frame) ---------- */
let frameId=0,groundDone=-1,T=0;
function ground(){if(!started||globalThis.MV_NOGLOW)return;if(zoneKey!==story.zone)place();const t=T,d=cinematic.dpr||1,vw=g.canvas.width/d,vh=g.canvas.height/d,cx=camera.x,cy=camera.y;
 for(const c of clusters){if(c.x<cx-60||c.x>cx+vw+60||c.y<cy-60||c.y>cy+vh+80)continue;
  if(c.v>=0){const s=SPR[c.c][c.v];g.drawImage(s,c.x-21*c.s,c.y-30*c.s,42*c.s,32*c.s);}}
 g.save();g.globalCompositeOperation='lighter';
 if(!(globalThis.MVD&2))for(const c of clusters){if(degraded&&c.v>=0)continue;if(c.x<cx-90||c.x>cx+vw+90||c.y<cy-90||c.y>cy+vh+90)continue;
  const a=calm()?.7:.62+.3*Math.sin(t*1.7+c.ph),R=(c.v<0?30:38)*c.s;g.globalAlpha=a;g.drawImage(GLOW[c.c],c.x-R,c.y-16*c.s-R,R*2,R*2);
  g.globalAlpha=a*.6;g.drawImage(GLOW[c.c],c.x-R*.45,c.y-14*c.s-R*.45,R*.9,R*.9);}
 g.restore();}
/* ---------- top pass ---------- */
function top(){if(!started||globalThis.MV_NOGLOW)return;const t=T,d=cinematic.dpr||1,vw=g.canvas.width/d,vh=g.canvas.height/d,cx=camera.x,cy=camera.y,still=calm(),lite=small();
 g.save();g.setTransform(d,0,0,d,-cx*d,-cy*d);g.globalCompositeOperation='lighter';
 // lantern + fire flicker
 if(!(globalThis.MVD&1)&&!degraded)for(const L of lamps){if(L.x<cx-L.r||L.x>cx+vw+L.r||L.y<cy-L.r||L.y>cy+vh+L.r)continue;
  const f=still?1:(.82+.1*Math.sin(t*9+L.ph)+.08*Math.sin(t*23.7+L.ph*3)+(Math.random()<.04?-.12:0));const R=L.r*(L.fire?.95+.05*f:1);
  g.globalAlpha=(L.fire?.32:.42)*f;g.drawImage(GLOW.warm,L.x-R,L.y-R*.8,R*2,R*1.6);if(!L.fire&&!lite){g.globalAlpha=.5*f;g.drawImage(GLOW.gold,L.x-R*.32,L.y-R*.32,R*.64,R*.64);}}
 // motes
 const k=kind(),want=still?0:small()?16:28;
 while(motes.length<want)motes.push(newMote(cx,cy,vw,vh,true,k));
 if(motes.length>want)motes.length=want;
 if(!(globalThis.MVD&4))for(let i=0;i<motes.length;i++){const m=motes[i];m.y-=m.vy*dtLast;m.x+=Math.sin(t*m.f+m.ph)*m.sw*dtLast;m.life-=dtLast;
  if(m.life<=0||m.x<cx-40||m.x>cx+vw+40||m.y<cy-60||m.y>cy+vh+40){motes[i]=newMote(cx,cy,vw,vh,false,k);continue;}
  const a=Math.min(1,m.life/1.2,(m.max-m.life)/1.2)*(.55+.45*Math.sin(t*3+m.ph));g.globalAlpha=Math.max(0,a)*.9;g.drawImage(GLOW[m.c],m.x-m.r*4,m.y-m.r*4,m.r*8,m.r*8);}
 // chrome glints on loot
 if(Array.isArray(drops))for(const dp of drops){if(dp.x<cx-30||dp.x>cx+vw+30||dp.y<cy-30||dp.y>cy+vh+30)continue;
  const ph=(t*1.3+dp.x*.013)%2.2;const y=dp.y-10;g.globalAlpha=.35;g.drawImage(GLOW.silver,dp.x-16,y-16,32,32);
  if(ph<.6){const s=Math.sin(ph/.6*Math.PI);g.globalAlpha=s;g.strokeStyle='#f4f8ff';g.lineWidth=1.3;const L=4+9*s;g.beginPath();g.moveTo(dp.x-L,y-4);g.lineTo(dp.x+L,y-4);g.moveTo(dp.x,y-4-L);g.lineTo(dp.x,y-4+L);g.stroke();g.globalAlpha=s*.8;g.drawImage(GLOW.silver,dp.x-7,y-11,14,14);}}
 g.restore();}
function newMote(cx,cy,vw,vh,anywhere,k){const cols=k==='marsh'?['purple','teal','purple','gold']:k==='grove'?['teal','gold','purple','teal']:['gold','teal','purple'];
 const max=4+Math.random()*5;return {x:cx+Math.random()*vw,y:anywhere?cy+Math.random()*vh:cy+vh*(.4+Math.random()*.6),vy:6+Math.random()*12,sw:6+Math.random()*10,f:.6+Math.random(),ph:Math.random()*6.28,r:1.2+Math.random()*1.5,c:cols[Math.floor(Math.random()*cols.length)],life:max,max};}
/* ---------- jelly slimes ---------- */
const JELLY=GLOW.teal;
function slimeFx(o,before){const t=T,id=(o.id||0)*1.37;
 const st=o._mv||(o._mv={px:o.x,py:o.y,drips:[],sp:0});const mv=Math.hypot(o.x-st.px,o.y-st.py);st.sp+=((mv/Math.max(dtLast,.001))-st.sp)*.15;st.px=o.x;st.py=o.y;
 const moving=Math.min(1,st.sp/60);
 if(!calm()&&moving>.2&&(!st.lx||Math.hypot(o.x-st.lx,o.y-st.ly)>14)){st.drips.push({x:o.x+(Math.random()-.5)*16,y:o.y+5,t:t,r:4+Math.random()*4});st.lx=o.x;st.ly=o.y;if(st.drips.length>9)st.drips.shift();}
 // drip trail (on the ground, under the body)
 for(const dr of st.drips){const age=t-dr.t;if(age>2.6)continue;const a=(1-age/2.6)*.5;g.save();g.globalAlpha=a;g.fillStyle='rgba(95,225,205,.8)';g.beginPath();g.ellipse(dr.x,dr.y,dr.r*1.5,dr.r*.6,0,0,7);g.fill();g.fillStyle='rgba(225,255,250,.9)';g.beginPath();g.ellipse(dr.x-dr.r*.4,dr.y-dr.r*.15,dr.r*.35,dr.r*.15,0,0,7);g.fill();g.restore();}
 // halo
 if(!small()){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.16+.05*Math.sin(t*2+id);g.drawImage(JELLY,o.x-46,o.y-62,92,80);g.restore();}
 // wobble: squash-and-stretch about the feet, faster while moving
 const w=calm()?0:Math.sin(t*(5+moving*7)+id)*(.05+moving*.06);const sx=1+w,sy=1/(1+w);
 g.save();g.translate(o.x,o.y+7);g.scale(sx,sy);g.translate(-o.x,-(o.y+7));before();g.restore();
 // live bubbles rising inside
 if(!calm()){g.save();g.strokeStyle='rgba(225,255,250,.7)';g.lineWidth=1;g.fillStyle='rgba(255,255,255,.85)';
  for(let k=0;k<3;k++){const life=(t*.55+k*.33+id*.1)%1;const bx=o.x+Math.sin(t*1.4+k*2.1+id)*12,by=o.y+2-life*40*sy,r=1.4+k*.5;g.globalAlpha=Math.sin(life*Math.PI);g.beginPath();g.arc(bx,by,r,0,7);g.stroke();g.fillRect(bx-r*.5,by-r*.6,1,1);}
  g.restore();}}
/* ---------- hooks ---------- */
let dtLast=1/60,lastT=now();
let ema=1/60,slowFor=0,degraded=false;
const bd=draw;draw=function(){const n=now();dtLast=Math.min(.1,n-lastT);lastT=n;T=n;frameId++;if(!degraded&&started&&!document.hidden){ema+=(dtLast-ema)*.05;slowFor=ema>1/30?slowFor+dtLast:0;if(slowFor>3){degraded=true;}}const r=bd.apply(this,arguments);try{top();}catch(e){}return r;};
const ba=actor;actor=function(o,hero,ghost){if(groundDone!==frameId){groundDone=frameId;try{ground();}catch(e){}}
 if(!globalThis.MV_NOGLOW&&!(globalThis.MVD&8)&&!hero&&o&&o.type==='slime'&&o.alive!==false&&(ghost===undefined||ghost===1)){const args=arguments,self=this;let r;try{slimeFx(o,()=>{r=ba.apply(self,args);});}catch(e){r=ba.apply(this,arguments);}return r;}
 return ba.apply(this,arguments);};
globalThis.MoonGlow={place,info:()=>({zone:zoneKey,clusters:clusters.length,lamps:lamps.length,motes:motes.length,degraded})};
})();
