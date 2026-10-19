'use strict';
/* Oozevale class kits (phase 1): the Slimewright summoner and slime-flavoured casting for all painted looks.
   Loaded last so its wrappers sit outside every older layer.
   - Summon Jellies ('summon'): 2 jellylings (3 from level 10) burst from the staff orb and fight for 15 s.
     They pick your target, then whatever is hitting you, never wander more than ~300 steps from you,
     and pop when they expire or you change zone.
   - Gloop Command ('command'): every jellyling and your familiar pounce on the target (arc leap), hit and glue
     it (2 s root). With no slimes out the orb lashes the target instead, so the button is never dead.
   - Slimewright shots are jelly globs (not arrows) in the slime colour.
   - Painted looks without frame sheets yet still cast from the painted staff tip / palm orb (art/ooze/looks.js). */
(()=>{
if(typeof CLASSES==='undefined')return;
const T=()=>typeof time!=='undefined'?time:performance.now()/1000;
const hx=()=>globalThis.MoonSlime?MoonSlime.hex(MoonSlime.current()):'#b483ff';
const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const jellies=[];
const MAXJ=5,LIFE=13;
function hitBy(e,n,c){if(globalThis.MoonPet&&MoonPet.hit)MoonPet.hit(e,n,c);else damage(e,n,c);}
function spawnJellies(n,tgt){
 const col=hx();
 for(let i=0;i<n;i++){
  if(jellies.length>=MAXJ){const old=jellies.shift();pop(old);}
  const a=Math.PI*2*i/n+Math.random()*.6,ox=Math.cos(a)*30,oy=Math.sin(a)*14+10;
  jellies.push({x:p.x+ox,y:p.y+oy,vx:Math.cos(a)*160,vy:Math.sin(a)*80,life:LIFE,max:LIFE,cd:.4+i*.15,target:tgt&&tgt.alive?tgt:null,phase:Math.random()*6,face:1,zone:story.zone,seed:Math.random()*9,pounce:null,lunge:0,born:.35});
 }
 if(typeof effect==='function')effect(p.x,p.y+6,70,col,'ring',.7);
 if(typeof burst==='function')burst(p.x,p.y-30,col,22,120);
 if(typeof float==='function')float(p.x,p.y-96,n+' jellylings!',col);
}
function pop(j){if(typeof burst==='function')burst(j.x,j.y-10,hx(),10,80);}
function pickTarget(j){
 if(j.target&&j.target.alive&&d2(j.target,p)<340)return j.target;
 if(typeof target!=='undefined'&&target&&target.alive&&d2(target,p)<300)return target;
 let best=null,bd=1e9;for(const m of mobs){if(!m.alive)continue;const d=d2(m,p);if(d<200&&(m.aggro||m.inCombat||d<120)&&d<bd){bd=d;best=m;}}
 return best;
}
function tickJellies(dt){
 const lv=p.level||1,dmg=p.power*.34+lv*.6,col=hx();
 for(let i=jellies.length-1;i>=0;i--){const j=jellies[i];
  j.life-=dt;j.born=Math.max(0,j.born-dt);j.lunge=Math.max(0,j.lunge-dt);j.cd=Math.max(0,j.cd-dt);
  if(j.life<=0||j.zone!==story.zone||d2(j,p)>520){if(j.zone===story.zone)pop(j);jellies.splice(i,1);continue;}
  if(j.pounce){const q=j.pounce;q.t+=dt;const u=Math.min(1,q.t/q.dur),e=q.target;const tx=e.x-Math.sign(e.x-q.x0||1)*12,ty=e.y+3;
   j.x=q.x0+(tx-q.x0)*u;j.y=q.y0+(ty-q.y0)*u;j.hop=-Math.sin(u*Math.PI)*38;
   if(u>=1){j.pounce=null;j.hop=0;j.lunge=.25;if(e.alive&&q.onHit)q.onHit(e);j.target=e.alive?e:null;j.cd=.5;}continue;}
  const e=pickTarget(j);j.target=e;
  let gx,gy,stop;
  if(e){const s=Math.sign(j.x-e.x)||1;gx=e.x+s*(18+(i%3)*6);gy=e.y+((i%2)?6:-4);stop=4;}
  else{const a=T()*.7+i*2.1;gx=p.x+Math.cos(a)*48-((p.dir||1)*20);gy=p.y+12+Math.sin(a)*14;stop=10;}
  // leash: never further than 300 from you
  {const lx=gx-p.x,ly=gy-p.y,ll=Math.hypot(lx,ly);if(ll>300){gx=p.x+lx/ll*300;gy=p.y+ly/ll*300;}}
  const dx=gx-j.x,dy=gy-j.y,dd=Math.hypot(dx,dy),want=dd<stop?0:Math.min(230,(dd-stop)*5),acc=1100*dt;
  let ax=(dd?dx/dd*want:0)-j.vx,ay=(dd?dy/dd*want:0)-j.vy;const al=Math.hypot(ax,ay);if(al>acc){ax*=acc/al;ay*=acc/al;}
  j.vx+=ax;j.vy+=ay;j.x+=j.vx*dt;j.y+=j.vy*dt;j.phase+=Math.hypot(j.vx,j.vy)*dt/26;if(Math.abs(j.vx)>10)j.face=Math.sign(j.vx);
  if(e&&d2(j,e)<30&&j.cd<=0){j.cd=.85;j.lunge=.25;j.face=Math.sign(e.x-j.x)||j.face;hitBy(e,Math.round(dmg),col);if(typeof burst==='function')burst(e.x,e.y-16,col,6,70);}
 }
}
function drawJelly(j){
 const x=typeof g!=='undefined'?g:null;if(!x||!globalThis.MoonPet||!MoonPet.drawBlob)return;
 const W=24,mv=Math.min(1,Math.hypot(j.vx,j.vy)/80),hop=Math.abs(Math.sin(j.phase*Math.PI)),fade=Math.min(1,j.life/1.2);
 const sp=j.born>0?1-j.born/.35:1,lx=j.lunge>0?Math.sin((1-j.lunge/.25)*Math.PI)*7*j.face:0;
 x.save();x.translate(j.x,j.y);x.globalAlpha=.4*fade;x.fillStyle='#040a12';x.beginPath();x.ellipse(0,2,W*.42,W*.12,0,0,7);x.fill();
 x.globalAlpha=fade;x.translate(lx,-hop*W*.3*mv+(j.hop||0));x.scale(sp*(j.face<0?-1:1),sp*(1-.12*Math.pow(1-hop,4)*mv));
 MoonPet.drawBlob(x,W,MoonSlime.current(),'none',{t:T()+j.seed,line:'slimewright',blink:((T()+j.seed)%3.7)<.1});
 x.restore();
}
function drawJellies(before){for(const j of jellies)if((j.y<p.y)===before)drawJelly(j);}

// ---- hooks ----
{const b=update;update=function(dt){b(dt);try{if(!(typeof isPaused==='function'&&isPaused())&&started)tickJellies(dt);}catch(e){console.warn('jellies',e);}};}
{const b=actor;actor=function(o,hero,ghost){
 if(hero&&(ghost===undefined||ghost===1)&&jellies.length){drawJellies(true);const r=b(o,hero,ghost);drawJellies(false);return r;}
 return b(o,hero,ghost);};}
if(typeof releaseSpell==='function'){const b=releaseSpell;releaseSpell=function(i){
 const sk=CLASSES[p.cls]&&CLASSES[p.cls].skills[i],kind=sk&&sk[5],before=p.cd[i],tgt=(typeof target!=='undefined'&&target&&target.alive)?target:null;
 const r=b(i);
 if(!(p.cd[i]>before))return r;               // not cast (cooldown, mana, range, locked)
 try{
  if(kind==='summon'){spawnJellies(p.level>=10?3:2,tgt);if(typeof sfx==='function')try{sfx('loot')}catch{}}
  if(kind==='command'&&tgt){
   const col=hx(),pw=p.power*sk[6];let n=0;
   const glue=(e,mult)=>{hitBy(e,Math.round(pw*mult),col);if(e.alive){e.root=Math.max(e.root||0,2);e.slow=Math.max(e.slow||0,3);}if(typeof burst==='function')burst(e.x,e.y-18,col,14,110);};
   for(const j of jellies){if(j.pounce)continue;j.pounce={t:0,dur:.3+n*.05,x0:j.x,y0:j.y,target:tgt,onHit:e=>glue(e,.55)};j.target=tgt;n++;}
   if(globalThis.MoonPet&&MoonPet.pounce(tgt,e=>glue(e,1)))n++;
   if(!n){glue(tgt,1.15);if(typeof effect==='function')effect(tgt.x,tgt.y,46,col,'ring',.5);}
   if(typeof float==='function')float(p.x,p.y-96,n?'Pounce!':'Orb lash!',col);
  }
 }catch(e){console.warn('slime kit',e);}
 return r;};}
// Slimewright globs + painted-tip origin for looks without frame sheets
if(typeof projectile==='function'){const b=projectile;projectile=function(from,to,amount,color,enemy=false,onHit=null){
 const n0=shots.length;const r=b(from,to,amount,color,enemy,onHit);
 if(enemy||from!==p||shots.length<=n0)return r;
 const s=shots[shots.length-1];if(!s||s.enemy)return r;
 if(p.cls==='ranger'){s.style='magic';s.color=hx();}
 else if(p.cls==='druid')s.color=hx();
 try{
  const sheets=MoonMotion&&MoonMotion.emitWorld&&MoonMotion.emitWorld('cast',0)!==null;
  const look=globalThis.MoonLooks&&MoonLooks.current(),em=look&&(globalThis.OOZE_LOOKS||{})[look];
  if(!sheets&&em){const hs=({glowcap:1.12,oozeseer:1.08,chromeknight:1.04})[look]||1,H=112*hs,Wd=H*em.w/em.h,dir=(p.dir||1)<0?-1:1;
   s.x=p.x+(em.emit[0]-.5)*Wd*dir;s.y=p.y+7-(1-em.emit[1])*H;s.trail=[];
   if(typeof cinematic!=='undefined'&&cinematic.decals)cinematic.decals.push({x:s.x,y:s.y,r:22,color:s.color||hx(),life:.3,max:.3,kind:'flare'});}
 }catch(e){}
 return r;};}
globalThis.MoonKits={jellies,spawnJellies};
})();
