'use strict';
/* Prismancer (mage slot): bubble shield + mirror + brew.
   Kit (unlocks 1/1/4/7/10): Bounce Bolt (ricochet bubble), Bubble Ward (absorb bubble), Gulp Brew (random elixir),
   Mirror Gel (bubble turns to liquid chrome: every absorbed hit flies back as a mirror-shard bolt), Refraction Nova.
   Auto-attack: Prism Shard (pearl shards). Pet line: Bubblet → Prism Bubblet (10) → Mirrorgel Orb (25).
   Hooks: releaseSpell (after cast), hurt (absorb/reflect), projectile (shard look, orange splash), update, draw. */
(()=>{
if(typeof CLASSES==='undefined'||!CLASSES.mage)return;
const M=CLASSES.mage,now=()=>typeof time!=='undefined'?time:performance.now()/1000,d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const on=()=>typeof p!=='undefined'&&p.cls==='mage';
for(const [k,v] of Object.entries({name:'Prismancer',role:'Bubble shield · Mirror · Brews',desc:'Wrap yourself in a wobbling jelly bubble, turn it to liquid chrome to throw every blow back at the attacker, and gulp a random elixir mid-fight. Bounce Bolt ricochets between foes.',color:'#d8f6ff'}))Object.defineProperty(M,k,{configurable:true,get:()=>v});
Object.assign(M,{glyph:'◎',hp:120,armor:2,range:250});
M.skills=[
 ['Bounce Bolt','◎',8,2.2,280,'bolt',1.3,'A ricochet bubble: hits your target, then bounces to 2 more foes nearby (70% damage each).'],
 ['Bubble Ward','○',18,11,0,'ward',0,'Wrap yourself in a wobbly iridescent jelly bubble that absorbs damage for 8 seconds, then pops into droplets.'],
 ['Gulp Brew','⚗',16,14,0,'heal',0,'Uncork and glug a random elixir: Teal heals over time, Purple doubles reflection, Gold hastes you, Orange makes your next 3 attacks splash fire ooze.'],
 ['Mirror Gel','◈',22,16,0,'guard',0,'For 3.5 seconds your bubble turns to liquid chrome: every hit is absorbed and flung back at the attacker as a mirror-shard bolt.'],
 ['Refraction Nova','✺',26,10,145,'nova',1.1,'Burst the light through your mirror: shards freeze nearby foes for 2 seconds, then slow them.']];
try{if(typeof classIdentity!=='undefined'&&classIdentity.mage)Object.assign(classIdentity.mage,{resource:'Refractions',signature:'Prism Cascade',short:'Cascade',glyph:'◎',role:'Bubble shield · Reflect · Brew',passive:'Refraction',description:'Offensive casts build up to 3 Refractions. Prism Cascade spends them on a volley of three prism shards.',signatureHelp:'Spend 3 Refractions to fire three prism shards at your target.'});}catch(e){}
// pet line
try{if(globalThis.MoonPet&&MoonPet.defs)MoonPet.defs.mage={id:'prismancer',species:'Bubblet',defaultName:'Bubbles',color:'teal',stages:{baby:'Bubblet',grown:'Prism Bubblet',evolved:'Mirrorgel Orb'},lore:'A pearly jelly bubble with a chrome glint. It bobs after you, reflects stray shards at your foes and keeps your loot inside its shimmer.'};}catch(e){}
/* ---------- state ---------- */
const S={bubble:false,ripples:[],mirror:0,reflectMul:1,elixir:null,brew:0,hot:0,haste:0,splash:0,purple:0,bolts:[],motes:[],flashes:[],pops:[],gulp:0};
const ELIX={teal:{c:'#3fe0c8',name:'Teal Elixir · Mending'},purple:{c:'#b483ff',name:'Purple Elixir · Double Reflect'},gold:{c:'#ffd257',name:'Gold Elixir · Haste'},orange:{c:'#ff8a3a',name:'Orange Elixir · Fire Splash ×3'}};
const say2=(x,y,t,c)=>{try{float(x,y,t,c);}catch(e){}};
function popBubble(){S.bubble=false;S.pops.push({x:p.x,y:p.y-52,t:0});try{burst(p.x,p.y-52,'#c9f6ff',22,170);burst(p.x,p.y-52,'#e9b8ff',10,120);}catch(e){}try{sfx('squelch')}catch(e){}}
function attacker(){let best=null,bd=1e9;for(const m of mobs){if(!m.alive||m.ozDummy&&!m.aggro)continue;const d=d2(m,p);if(d<340&&(m.aggro||m.ozDummy)&&d<bd){bd=d;best=m;}}return best;}
function reflect(m,amt){if(!m)return;S.bolts.push({x:p.x,y:p.y-52,m,amt:Math.max(1,Math.round(amt)),t:0,dur:Math.min(.45,.12+d2(m,p)/900)});}
/* ---------- casts ---------- */
if(typeof releaseSpell==='function'){const b=releaseSpell;releaseSpell=function(i){
 if(!on())return b.apply(this,arguments);
 const sk=M.skills[i],kind=sk&&sk[5],before=p.cd[i],tgt=(typeof target!=='undefined'&&target&&target.alive)?target:null,hp0=p.hp,rg0=p.regen;
 const r=b.apply(this,arguments);if(!(p.cd[i]>before))return r;
 try{
  if(kind==='ward'){S.bubble=true;S.ripples=[];say2(p.x,p.y-110,'Bubble Ward','#c9f6ff');}
  if(kind==='guard'){p.guard=0;p.regen=rg0;S.mirror=3.5;if(!S.bubble||p.shield<=0){p.shield=Math.max(p.shield,30+p.level*4);p.ward=Math.max(p.ward,3.5);S.bubble=true;}say2(p.x,p.y-110,'Mirror Gel','#eef6ff');try{burst(p.x,p.y-52,'#ffffff',18,140);}catch(e){}}
  if(kind==='heal'){p.hp=Math.min(p.maxHp,hp0+p.maxHp*.08);p.regen=rg0;const keys=Object.keys(ELIX),k=keys[Math.floor(Math.random()*keys.length)];S.gulp=.8;S.elixir=k;
   setTimeout(()=>{if(!on())return;const e=ELIX[k];if(k==='teal')S.hot=6;if(k==='purple')S.purple=10;if(k==='gold')S.haste=8;if(k==='orange')S.splash=3;say2(p.x,p.y-118,e.name,e.c);
    for(let n=0;n<26;n++)S.motes.push({a:n/26*6.283,r:10+Math.random()*16,y:0,v:60+Math.random()*60,life:1.2+Math.random()*.6,c:e.c,s:2+Math.random()*4,bub:n%5===0});try{burst(p.x,p.y-60,e.c,14,90);}catch(x){}},650);}
  if(kind==='bolt'&&tgt){const pw=p.power*sk[6]*.7;let from=tgt,hit=new Set([tgt]);let delay=0;for(let k=0;k<2;k++){const nx=mobs.filter(m=>m.alive&&!hit.has(m)&&d2(m,from)<190).sort((a,c)=>d2(a,from)-d2(c,from))[0];if(!nx)break;hit.add(nx);const f0={x:from.x,y:from.y},to=nx;delay+=.28;setTimeout(()=>{if(to.alive)S.bolts.push({x:f0.x,y:f0.y-24,m:to,amt:Math.round(pw),t:0,dur:.22,bounce:true});},delay*1000);from=nx;}}
  if(kind==='nova'){for(let n=0;n<16;n++){const a=n/16*6.283;S.flashes.push({x:p.x+Math.cos(a)*30,y:p.y-30+Math.sin(a)*20,vx:Math.cos(a)*320,vy:Math.sin(a)*200,t:0,shard:true});}}
 }catch(e){console.warn('prism',e);}
 return r;};}
/* ---------- absorb + reflect ---------- */
{const b=hurt;hurt=function(n){if(!on())return b.apply(this,arguments);
 const camp=typeof CAMP!=='undefined'&&d2(p,CAMP)<125;if(p.evade>0||camp)return b.apply(this,arguments);
 const m=attacker(),ang=m?Math.atan2(m.y-(p.y-52),m.x-p.x):Math.random()*6.283;
 if(S.mirror>0){const dmg=Math.max(1,n-p.armor);p.inCombat=6;S.ripples.push({a:ang,t:0,k:1.4});reflect(m,dmg*.75*(S.purple>0?2:1)*1.15);say2(p.x,p.y-70,'MIRRORED','#eef6ff');return b.call(this,n*.25,...[...arguments].slice(1));}
 const sh=p.shield;b.apply(this,arguments);
 if(S.bubble&&sh>0){S.ripples.push({a:ang,t:0,k:1});if(S.purple>0&&m)reflect(m,(sh-p.shield)*.6);}
};}
/* ---------- shots: prism shards + orange splash ---------- */
{const b=projectile;projectile=function(from,to,amount,color,enemy=false,onHit=null){
 if(on()&&!enemy&&from===p){let h=onHit;if(S.splash>0&&to){S.splash--;const first=h;h=function(){try{first&&first.apply(this,arguments);}catch(e){}for(const e of mobs)if(e.alive&&e!==to&&d2(e,to)<85)damage(e,amount*.5,'#ff8a3a');try{burst(to.x,to.y-20,'#ff8a3a',22,150);burst(to.x,to.y-20,'#ffd257',8,90);}catch(e){}};}
  const r=b.call(this,from,to,amount,'#d8f6ff',enemy,h);const s=shots[shots.length-1];if(s){s.prism=true;s.spin=Math.random()*6;}return r;}
 return b.apply(this,arguments);};}
/* ---------- per frame ---------- */
{const b=update;update=function(dt){b.apply(this,arguments);if(!on()){S.bubble=false;S.mirror=0;return;}
 try{if(typeof isPaused==='function'&&isPaused())return;
  S.mirror=Math.max(0,S.mirror-dt);S.purple=Math.max(0,S.purple-dt);S.gulp=Math.max(0,S.gulp-dt);
  if(S.bubble&&(p.shield<=0||p.ward<=0)&&S.mirror<=0)popBubble();
  if(S.hot>0){S.hot-=dt;p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.035*dt);}
  if(S.haste>0){S.haste-=dt;if(p.walk>0&&(p.dx||p.dy))move(p,p.dx*70*dt,p.dy*70*dt);p.attack=Math.max(0,p.attack-dt*.7);}
  for(const r of S.ripples)r.t+=dt;S.ripples=S.ripples.filter(r=>r.t<.9);
  for(let i=S.bolts.length-1;i>=0;i--){const o=S.bolts[i];o.t+=dt;if(!o.m.alive){S.bolts.splice(i,1);continue;}if(o.t>=o.dur){S.bolts.splice(i,1);
    damage(o.m,o.amt,o.bounce?'#bff6ff':'#eef6ff');o.m.ozMirror=.45;if(!o.bounce)say2(o.m.x,o.m.y-86,'↩ '+o.amt,'#eef6ff');try{burst(o.m.x,o.m.y-30,'#ffffff',12,150);burst(o.m.x,o.m.y-30,'#9fd8ff',8,110);}catch(e){}}}
  for(const m of mobs)if(m.ozMirror>0)m.ozMirror-=dt;
  for(const q of S.motes){q.life-=dt;q.y-=q.v*dt;q.a+=dt*3;}S.motes=S.motes.filter(q=>q.life>0);
  for(const f of S.flashes){f.t+=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;}S.flashes=S.flashes.filter(f=>f.t<.4);
  for(const q of S.pops)q.t+=dt;S.pops=S.pops.filter(q=>q.t<.5);
 }catch(e){console.warn('prism',e);}};}
/* ---------- drawing ---------- */
function bubblePath(cx,cy,rx,ry,t){const N=56,pts=[];for(let i=0;i<N;i++){const a=i/N*6.283;let k=1+.035*Math.sin(3*a+t*4)+.025*Math.sin(5*a-t*3);for(const r of S.ripples){let da=Math.atan2(Math.sin(a-r.a),Math.cos(a-r.a));const fall=Math.exp(-r.t*4.5)*r.k;k+=-.16*fall*Math.exp(-da*da*3)*Math.cos(r.t*28)+.05*fall*Math.sin(da*6-r.t*30);}pts.push([cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k]);}
 g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<=N;i++){const a=pts[i%N],b2=pts[(i+1)%N];g.quadraticCurveTo(a[0],a[1],(a[0]+b2[0])/2,(a[1]+b2[1])/2);}g.closePath();}
{const b=draw;draw=function(){b.apply(this,arguments);if(!on()||(typeof started!=='undefined'&&!started))return;g.save();try{g.setTransform(cinematic.dpr,0,0,cinematic.dpr,-camera.x*cinematic.dpr,-camera.y*cinematic.dpr);const t=now();
 // prism shards on your shots
 for(const s of shots){if(!s.prism)continue;g.save();g.translate(s.x,s.y);g.rotate(t*9+s.spin);g.globalAlpha=.95;const gr=g.createLinearGradient(-9,0,9,0);gr.addColorStop(0,'#9ff6ff');gr.addColorStop(.5,'#ffffff');gr.addColorStop(1,'#e2b8ff');g.fillStyle=gr;g.beginPath();g.moveTo(0,-10);g.lineTo(5,0);g.lineTo(0,10);g.lineTo(-5,0);g.closePath();g.fill();g.restore();}
 // bubble
 if(S.bubble){const cx=p.x,cy=p.y-54,rx=50,ry=64,mir=S.mirror>0;bubblePath(cx,cy,rx,ry,t);
  if(mir){const gr=g.createLinearGradient(cx-rx,cy-ry,cx+rx,cy+ry);gr.addColorStop(0,'rgba(240,248,255,.34)');gr.addColorStop(.35,'rgba(150,165,185,.22)');gr.addColorStop(.55,'rgba(250,252,255,.4)');gr.addColorStop(.8,'rgba(110,125,150,.22)');gr.addColorStop(1,'rgba(230,240,255,.34)');g.fillStyle=gr;g.fill();g.lineWidth=4;g.strokeStyle='rgba(255,255,255,.95)';g.shadowColor='#ffffff';g.shadowBlur=18;g.stroke();g.shadowBlur=0;
   g.save();bubblePath(cx,cy,rx,ry,t);g.clip();g.globalAlpha=.45;g.fillStyle='#ffffff';const sx=((t*1.6)%2-1)*rx*1.6;g.beginPath();g.moveTo(cx+sx-12,cy-ry);g.lineTo(cx+sx+4,cy-ry);g.lineTo(cx+sx-20,cy+ry);g.lineTo(cx+sx-36,cy+ry);g.fill();g.restore();}
  else{const rg=g.createRadialGradient(cx-rx*.3,cy-ry*.35,4,cx,cy,rx*1.1);rg.addColorStop(0,'rgba(255,255,255,.28)');rg.addColorStop(.6,'rgba(160,240,255,.06)');rg.addColorStop(1,'rgba(200,150,255,.22)');g.fillStyle=rg;g.fill();
   let cg;try{cg=g.createConicGradient(t*.8,cx,cy);[['#5ff2d0',0],['#b483ff',.25],['#ffd257',.5],['#ff8adf',.72],['#5ff2d0',1]].forEach(([c,o])=>cg.addColorStop(o,c));}catch(e){cg='#bff6ff';}g.lineWidth=3.2;g.strokeStyle=cg;g.globalAlpha=.9;g.shadowColor='#bff6ff';g.shadowBlur=12;g.stroke();g.shadowBlur=0;g.globalAlpha=1;}
  g.fillStyle='rgba(255,255,255,.75)';g.beginPath();g.ellipse(cx-rx*.42,cy-ry*.5,9,5,-.6,0,7);g.fill();g.beginPath();g.arc(cx-rx*.2,cy-ry*.68,3,0,7);g.fill();}
 for(const q of S.pops){const k=q.t/.5;g.globalAlpha=1-k;g.strokeStyle='#dff8ff';g.lineWidth=3*(1-k)+.5;g.beginPath();g.ellipse(q.x,q.y,50+k*60,64+k*60,0,0,7);g.stroke();g.globalAlpha=1;}
 // gulp: vial tilting at the hand
 if(S.gulp>0&&S.elixir){const k=1-S.gulp/.8,e=ELIX[S.elixir];g.save();g.translate(p.x+(p.dir||1)*10,p.y-92+Math.sin(k*3)*4);g.rotate(-(p.dir||1)*(.3+k*2));g.fillStyle=e.c;g.globalAlpha=.95;g.beginPath();g.ellipse(0,6,7,9,0,0,7);g.fill();g.fillStyle='#e8f4ff';g.fillRect(-2.5,-8,5,8);g.fillStyle='#a0703a';g.fillRect(-3,-11,6,3);g.restore();
  if(k>.25&&k<.9)for(let n=0;n<2;n++){S.motes.push({a:Math.random()*6.283,r:3,y:-30,v:30,life:.35,c:e.c,s:2,bub:true});}}
 // tinted swirl + bubbles rising from the hero
 for(const q of S.motes){const x=p.x+Math.cos(q.a)*q.r,y=p.y-40+q.y;g.globalAlpha=Math.min(1,q.life*1.6);if(q.bub){g.strokeStyle=q.c;g.lineWidth=1.6;g.beginPath();g.arc(x,y,q.s+2,0,7);g.stroke();}else{g.fillStyle=q.c;g.beginPath();g.arc(x,y,q.s,0,7);g.fill();}}g.globalAlpha=1;
 // active elixir aura
 const aura=S.hot>0?'#3fe0c8':S.purple>0?'#b483ff':S.haste>0?'#ffd257':S.splash>0?'#ff8a3a':null;if(aura){g.globalAlpha=.35+.15*Math.sin(t*6);g.strokeStyle=aura;g.lineWidth=3;g.beginPath();g.ellipse(p.x,p.y,34,12,0,0,7);g.stroke();g.globalAlpha=1;}
 // mirror-shard bolts
 for(const o of S.bolts){const k=Math.min(1,o.t/o.dur),x=o.x+(o.m.x-o.x)*k,y=o.y+(o.m.y-30-o.y)*k-Math.sin(k*Math.PI)*24;g.save();g.translate(x,y);g.rotate(Math.atan2(o.m.y-o.y,o.m.x-o.x));const gr=g.createLinearGradient(-14,0,14,0);gr.addColorStop(0,'rgba(180,220,255,0)');gr.addColorStop(.6,o.bounce?'#9ff6ff':'#c8d4e6');gr.addColorStop(1,'#ffffff');g.fillStyle=gr;g.shadowColor='#ffffff';g.shadowBlur=10;g.beginPath();g.moveTo(14,0);g.lineTo(-6,-6);g.lineTo(-16,0);g.lineTo(-6,6);g.closePath();g.fill();
  if(o.bounce){g.strokeStyle='rgba(220,250,255,.9)';g.lineWidth=2;g.beginPath();g.arc(0,0,9,0,7);g.stroke();}g.restore();}
 // chrome flash on mirrored attackers
 for(const m of mobs){if(!(m.ozMirror>0)||!m.alive)continue;const k=m.ozMirror/.45;g.globalAlpha=k;g.strokeStyle='#ffffff';g.lineWidth=4;g.shadowColor='#e8f4ff';g.shadowBlur=20;g.beginPath();g.ellipse(m.x,m.y-34,30+(1-k)*26,40+(1-k)*26,0,0,7);g.stroke();g.shadowBlur=0;g.fillStyle='rgba(235,245,255,'+(.35*k)+')';g.beginPath();g.ellipse(m.x,m.y-34,26,36,0,0,7);g.fill();g.globalAlpha=1;}
 // nova shards
 for(const f of S.flashes){g.save();g.translate(f.x,f.y);g.rotate(Math.atan2(f.vy,f.vx));g.globalAlpha=1-f.t/.4;g.fillStyle='#e8fbff';g.beginPath();g.moveTo(12,0);g.lineTo(-4,-4);g.lineTo(-10,0);g.lineTo(-4,4);g.fill();g.restore();}g.globalAlpha=1;
}catch(e){}g.restore();};}
globalThis.Prismancer={state:S,ELIX,popBubble};
})();
