'use strict';
/* Moonvale unified character motion.
   Replaces the older layered rigs (strip-sliced legs in animation.js / cartoon-motion.js,
   the triangle-mesh warp in jointed-motion.js and the cut-out arm in warrior-motion.js).
   Every sprite is now drawn as ONE rigid image at its true aspect ratio, and all motion
   comes from eased whole-body transforms: breathing idle, stepping walk/run bounce with lean,
   attack windup -> strike -> recovery, dodge roll, hit reaction with white flash, and death. */
const MoonMotion=(()=>{
 const ease={
  inOut:t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,
  out:t=>1-Math.pow(1-t,3),
  in:t=>t*t*t,
  back:t=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);}
 };
 const lerp=(a,b,t)=>a+(b-a)*t;
 const corpses=[];
 const scratch=document.createElement('canvas'),sctx=scratch.getContext('2d');
 const heroTrack={hp:null,evade:0,evadeAt:-9,roll:null,hurt:0,trail:[]};

 function faceVec(face){return {x:face==='left'?-1:face==='right'?1:0,y:face==='front'?1:face==='back'?-1:0};}
 function seedOf(o){return o.phase??((o.id?String(o.id).length*1.7:0)+(o.x||0)*.013);}

 // ---- Pose: one place that decides how the body moves -------------------------------
 function pose(o,s,type,hero,framed=false){
  const P={x:0,y:0,rot:0,sx:1,sy:1,alpha:1,flash:0,roll:0,lift:0};
  const f=faceVec(s.face),m=clamp(s.moving||0,0,1),ph=s.stride||0,t=time+seedOf(o);
  const side=f.x||((Math.floor(ph/Math.PI)%2)?1:-1)*.5;
  // Idle: slow breathing, volume preserving.
  const br=framed?0:Math.sin(t*2.3);if(!framed){P.sy+=.014*br*(1-m);P.sx-=.007*br*(1-m);P.y-=.5*(br+1)*(1-m);}
  // Walk / run: a bounce per step, a squash on each foot contact, lean into travel.
  const bounce=Math.abs(Math.sin(ph)),contact=Math.pow(1-bounce,6);
  if(type==='slime'){const q=Math.sin(ph*2)*m;P.sx+=.11*q+.03*br;P.sy-=.11*q+.03*br;P.y-=Math.max(0,-q)*6;}
  else if(type==='wisp'){P.y+=Math.sin(t*2.6)*5-6;P.rot+=Math.sin(t*1.9)*.05+f.x*.08*m;}
  else if(!framed){
   const amp=type==='boar'?3.5:type==='boss'?2:2.8;
   P.y-=bounce*amp*m;P.lift=bounce*amp*m;P.sy-=.035*m*contact;P.sx+=.025*m*contact;
   P.rot+=f.x?f.x*.055*m:Math.sin(ph)*.03*m;
  }
  // Actions. Progress u runs 0 -> 1 over the action.
  const kind=s.kind,act=s.action||0;
  if(kind==='strike'&&act>0){
   const total=s.weaponAttack?.duration||.55,u=s.weaponAttack?clamp(s.weaponAttack.elapsed/total,0,1):clamp(1-act/total,0,1);
   const dx=f.x||0,dy=f.y||0,dir=dx||(s.weaponAttack?.side||1)*.6;
   let k,px,py,r,st;
   if(u<.3){k=ease.inOut(u/.3);px=-5*k;py=-2*k;r=-.11*k;st=.04*k;}
   else if(u<.52){k=ease.back((u-.3)/.22);px=lerp(-5,11,k);py=lerp(-2,1,k);r=lerp(-.11,.13,k);st=lerp(.04,-.05,k);}
   else{k=ease.out((u-.52)/.48);px=lerp(11,0,k);py=lerp(1,0,k);r=lerp(.13,0,k);st=lerp(-.05,0,k);}
   P.x+=px*(dx||dir*.4);P.y+=px*.45*dy+py;P.rot+=r*(dx||dir);P.sy+=st;P.sx-=st*.7;
  }else if(kind==='windup'&&act>0){
   const q=.5+.5*Math.sin(time*18);P.rot+=-(f.x||1)*.09;P.sy+=.035+.01*q;P.sx-=.025;P.x-=(f.x||0)*4;
  }else if((kind==='release'||kind==='shoot')&&act>0){
   const u=clamp(1-act/.55,0,1),k=u<.18?ease.out(u/.18):1-ease.out((u-.18)/.82);
   P.x-=(f.x||0)*4*k;P.y-=f.y*2*k;P.sy+=.03*k;P.sx-=.02*k;P.rot-=(f.x||0)*.05*k;
  }else if(kind==='cast'){
   const q=Math.sin(time*6);P.y-=2+q;P.sy+=.02;P.sx-=.012;
  }
  // Hit reaction: knocked away from the attacker, tilt, white flash.
  const hit=hero?heroTrack.hurt:(s.hit||0);
  if(hit>0){const k=clamp(hit/.18,0,1),e=ease.out(k),away=hero?(target?Math.sign(p.x-target.x)||1:-(f.x||1)):(Math.sign(o.x-p.x)||1);
   P.x+=away*6*e;P.rot+=away*.1*e;P.sy-=.04*e;P.sx+=.03*e;P.flash=k;}
  // Dodge roll.
  if(hero&&heroTrack.roll){const r=heroTrack.roll,u=clamp(r.t/r.dur,0,1),k=ease.inOut(u);
   P.roll=r.dir*Math.PI*2*k;P.y-=Math.sin(u*Math.PI)*8;P.sy*=1-.18*Math.sin(u*Math.PI);P.sx*=1+.08*Math.sin(u*Math.PI);}
  return P;
 }

 // ---- Sprite source resolution (keeps gear overlays + aspect ratios) ----------------
 function sourceFor(f){
  if(f.novice&&typeof jointSource==='function'){try{const c=jointSource(f,true);return {img:c,sx:0,sy:0,sw:c.width,sh:c.height};}catch(e){}}
  return {img:f.img,sx:f.sx,sy:f.sy,sw:f.sw,sh:f.sh};
 }
 function handLocal(f,w,h){
  if(f.novice&&typeof jointRest==='function'){const r=jointRest(f),pt=r.arms[f.face==='back'?1:0][2];return {x:(pt.x-.5)*w,y:(pt.y-1)*h};}
  const a=Array.isArray(f.handAnchor)?f.handAnchor:(f.handAnchor?.[f.face||'front'])||[.15,.6];
  return {x:(a[0]-.5)*w,y:(a[1]-1)*h};
 }
 function blit(src,w,h,flash){
  if(flash>.02){
   const W=Math.max(2,Math.ceil(w*cinematic.dpr)),H=Math.max(2,Math.ceil(h*cinematic.dpr));
   if(scratch.width<W)scratch.width=W;if(scratch.height<H)scratch.height=H;
   sctx.globalCompositeOperation='source-over';sctx.clearRect(0,0,W,H);sctx.drawImage(src.img,src.sx,src.sy,src.sw,src.sh,0,0,W,H);
   sctx.globalCompositeOperation='source-atop';sctx.fillStyle='rgba(255,246,230,'+(.75*flash).toFixed(3)+')';sctx.fillRect(0,0,W,H);
   g.drawImage(scratch,0,0,W,H,-w/2,-h,w,h);return;
  }
  g.drawImage(src.img,src.sx,src.sy,src.sw,src.sh,-w/2,-h,w,h);
 }
 // Rigid body draw with the pose applied around the feet (lean) or the centre (roll).
 function drawBody(f,w,h,s,type,P,opts={}){
  const src=sourceFor(f);if(!src.img)return;
  // Correct proportions: width ALWAYS follows the source aspect ratio.
  w=h*src.sw/src.sh;
  g.save();g.translate(P.x,P.y);
  if(P.roll){g.translate(0,-h*.45);g.rotate(P.roll);g.translate(0,h*.45);}
  g.rotate(P.rot);g.scale(P.sx,P.sy);
  const cls=f.cls||opts.cls,isWarrior=cls==='warrior',hand=handLocal(f,w,h);
  const drawWeapon=()=>{
   if(f.novice&&typeof drawClassImplement==='function'&&typeof jointPose==='function'){
    const jp=jointPose(f,{...s,moving:0},cls);drawClassImplement(g,cls,hand,jp,s,typeof equippedVisualTier==='function'?equippedVisualTier('weapon'):0,h/112);
   }else if(isWarrior&&(f.unarmed||f.epic)&&typeof drawHeldBlade==='function'){
    const sp=swordPose(s);
    if(sp.trail){g.save();g.translate(hand.x,hand.y);g.globalCompositeOperation='lighter';g.strokeStyle='#ffe6b0';g.globalAlpha=.75*sp.strength;g.lineWidth=3;g.lineCap='round';g.shadowColor='#ffcf7a';g.shadowBlur=10;g.beginPath();g.arc(0,0,44,sp.angle-1.7,sp.angle-.2);g.stroke();g.restore();}
    drawHeldBlade(g,hand.x,hand.y,sp.angle,f.epic?.4:.34);
   }
  };
  const behind=s.face==='back'||s.face==='left';
  if(opts.weapon&&behind)drawWeapon();
  blit(src,w,h,P.flash);
  if(opts.weapon&&!behind)drawWeapon();
  g.restore();
  return w;
 }
 function shadow(x,y,w,lift,alpha=1){
  const rx=Math.max(10,w*.36)*(1-lift*.03),ry=rx*.32;
  g.save();g.globalAlpha=alpha*(.55-lift*.03);
  const gr=g.createRadialGradient(x,y,0,x,y,rx);gr.addColorStop(0,'rgba(4,10,18,.75)');gr.addColorStop(.6,'rgba(4,10,18,.45)');gr.addColorStop(1,'rgba(4,10,18,0)');
  g.fillStyle=gr;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();g.restore();
 }

 // ---- Frame lookup (same rules the game already used) -------------------------------
 function frameFor(o,hero,face){
  if(MoonMotion.art){const f=hero?MoonMotion.art.hero?.(o.cls||p.cls,face):MoonMotion.art.enemy?.(o,face);if(f)return f;}
  if(hero)return heroFrame(o.cls||p.cls,face);
  const row=['slime','boar','wisp','boss'].indexOf(o.type);return directional.enemies[row]?.[directions.indexOf(face)];
 }
 function sizeFor(o,hero,frame){const type=hero?'hero':o.type;return hero?112*(frame.heightScale||1):(type==='boss'?168:type==='boar'?80:type==='slime'?62:92)*(frame.enemyScale||1);}


 // ---- Frame-by-frame sheets (art/anim/anim.js, built by tools/process_anim.py) -------
 // Heroes with sheets are drawn from real frames: side walk (mirrored for left), front idle,
 // walkfront (down), walkback (up, and frame 1 as the back idle). Missing direction sheets fall back
 // to the idle frames with a step bob.
 // Action sheets (attack/cast/hurt) are used if present; otherwise the current frame plays
 // under the existing transform (lunge, cast lift, knockback + flash, roll). Anything with
 // no sheet (enemies, NPCs, ranger, classic art) keeps the rigid motion above.
 const anim={sheets:{},meta:globalThis.MOONVALE_ANIM||null,hero:{phase:0,lastX:null,lastY:null,side:'right',info:null,speed:0}};
 if(anim.meta)for(const [ch,set] of Object.entries(anim.meta.chars||{}))for(const [name,m] of Object.entries(set)){
  const img=new Image();img.decoding='async';const e={...m,img,ok:false};img.onload=()=>{e.ok=true;};img.src=m.src;(anim.sheets[ch]||(anim.sheets[ch]={}))[name]=e;}
 const WALK_CYCLE=118;          // world px travelled per full walk cycle (two steps)
 function sheetSet(o,hero){
  if(!hero||!anim.meta||!MoonMotion.art?.heroKey||(typeof MoonMotion.disableFrames!=='undefined'&&MoonMotion.disableFrames))return null;
  const k=MoonMotion.art.heroKey(o.cls||p.cls);const set=k&&anim.sheets[k];
  return set&&set.idle?.ok?{key:k,set,stat:anim.meta.static?.[k]}:null;
 }
 // Direction: 8-way from the smoothed velocity, with hysteresis so diagonals don't flicker between
 // sheets. Octants: 0 E, 1 SE, 2 S, 3 SW, 4 W, 5 NW, 6 N, 7 NE (screen y points down).
 // S -> walkfront, N -> walkback, every other octant -> side walk (mirrored for the west half).
 const OCT=Math.PI/4,HYST=.2;     // keep the current octant until the heading is 22.5deg + ~11deg past its centre
 function trackHero(o,dt){
  const H=anim.hero;if(H.lastX===null){H.lastX=o.x;H.lastY=o.y;H.vx=0;H.vy=0;H.oct=2;H.last='S';}
  const dx=o.x-H.lastX,dy=o.y-H.lastY,d=Math.hypot(dx,dy);H.lastX=o.x;H.lastY=o.y;
  if(d>=40){H.vx=H.vy=0;return;}                      // teleport / zone change: no stride, no heading
  H.phase+=d/WALK_CYCLE;                                // frames advance by distance travelled -> no foot slide
  if(dt>0){const a=Math.min(1,dt*12);H.vx+=(dx/dt-H.vx)*a;H.vy+=(dy/dt-H.vy)*a;}
  H.speed=Math.hypot(H.vx,H.vy);
  if(H.speed>25){const ang=Math.atan2(H.vy,H.vx);
   const off=Math.abs(((ang-H.oct*OCT)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI);
   if(off>OCT/2+HYST)H.oct=((Math.round(ang/OCT)%8)+8)%8;
   H.last=H.oct===2?'S':H.oct===6?'N':'side';
   if(H.oct!==2&&H.oct!==6)H.side=(H.oct>=3&&H.oct<=5)?'left':'right';}
 }
 // ---- Attack / cast sheets -------------------------------------------------------------
 // Timing: the sheet's key frame (impact for attacks, release for casts; detected in process_anim.py)
 // is on screen exactly when the game applies damage or spawns the projectile.
 //  - warrior melee: weaponAttack progress, impact at .48 (warrior-motion.js resolves damage there)
 //  - staff basic attacks: the projectile is held back for the wind-up and spawned on the key frame
 //  - spells: wind-up frames span cinematic.pending, the release frame plays when releaseSpell fires
 const ACT_FPS=12,STAFF={warden:1,embermage:1,frostcaller:1,glowcap:1,mossmother:1,ambercap:1,oozeseer:1,chromeveil:1,lanternhood:1};
 function heroTarget(){return (typeof target!=='undefined'&&target&&target.alive)?target:null;}
 function faceTarget(H){const t=heroTarget();if(t&&Math.abs(t.x-p.x)>2)H.side=t.x<p.x?'left':'right';}
 function actionFrame(sh,s,H){
  const wa=s.weaponAttack,a0=H.act;
  if(wa&&sh.attack?.ok&&!wa.castShown&&!(a0&&a0.name==='cast')){const m=sh.attack,n=m.frames,key=m.key??Math.floor(n/2),u=clamp(wa.elapsed/wa.duration,0,1);
   const i=u<.48?Math.floor(u/.48*key):key+Math.floor((u-.48)/.52*(n-key));faceTarget(H);return {m,i:clamp(i,0,n-1),state:'attack'};}
  const a=H.act;
  if(a&&sh[a.name]?.ok){const m=sh[a.name],n=m.frames,key=m.key??Math.floor(n/2);
   const i=a.t<a.W?Math.floor(a.t/a.W*key):key+Math.floor((a.t-a.W)/a.A*(n-key));return {m,i:clamp(i,0,n-1),state:a.name};}
  const c=typeof cinematic!=='undefined'?cinematic.pending:null;
  if(c&&c.cls===p.cls&&sh.cast?.ok){const m=sh.cast,key=m.key??3,u=clamp(1-c.life/c.total,0,.999);faceTarget(H);
   return {m,i:Math.min(key-1,Math.floor(u*key))|0,state:'cast-windup'};}
  return null;
 }
 function actionTick(dt){
  const a=anim.hero.act;if(!a)return;a.t+=dt;
  if(a.spawn&&a.t>=a.W){const f=a.spawn;a.spawn=null;f();}
  if(a.t>=a.W+a.A)anim.hero.act=null;
 }
 function heroSheets(){const ss=sheetSet(p,true);return ss&&ss.set;}
 function startAction(name,spawn){
  const sh=heroSheets(),m=sh&&sh[name];if(!m||!m.ok)return false;const n=m.frames,key=m.key??Math.floor(n/2);
  faceTarget(anim.hero);
  if(anim.hero.last==='N')anim.hero.last='side';   // after turning to strike, settle to the front idle, not the back
  if(name==='cast'){const wa=stateFor(p,true).weaponAttack;if(wa)wa.castShown=true;}   // a spell's sword move is shown by the cast sheet
  anim.hero.act={name,t:name==='cast'?key/ACT_FPS:0,W:key/ACT_FPS,A:(n-key)/ACT_FPS,spawn};   // casts start at release (wind-up was the pending phase)
  return true;
 }
 // World position of a sheet's emit point (staff tip / palm), mirrored with facing.
 function emitWorld(name,frame){
  const ss=sheetSet(p,true),m=ss&&ss.set[name];if(!m||!m.ok||!m.emit)return null;
  const i=frame??m.key??0,e=m.emit[clamp(i,0,m.emit.length-1)];if(!e)return null;
  const bodyTarget=sizeFor(p,true,frameFor(p,true,'front'))*(ss.stat?.bodyFrac||.92),k=bodyTarget/(m.bodyH||260),dir=anim.hero.side==='left'?-1:1;
  return {x:p.x+(e[0]-m.anchorX)*k*dir,y:p.y+7+(e[1]-m.baseY)*k,from:STAFF[ss.key]&&MoonMotion.emitFrom!=='hands'?'staff':'hand'};
 }
 // The emit point of whatever frame is on screen right now (charge glow during the wind-up).
 function emitNow(){const sh=heroSheets();if(!sh)return null;const H=anim.hero,sel=actionFrame(sh,stateFor(p,true),H);if(!sel)return null;return emitWorld(sel.m===sh.cast?'cast':'attack',sel.i);}
 const BACK_IDLE=1;               // standing after moving up: frame 1 of walkback
 function pick(sh,s,H,moving){
  // returns {m:sheet, i:cell index, bob(px, negative=up), flip, state}
  const act=s.action>0?s.kind:null,roll=!!heroTrack.roll,hurt=heroTrack.hurt>0;
  const by=(name,u)=>{const m=sh[name];if(!m||!m.ok)return null;const n=m.frames;return {m,i:clamp(Math.floor(u*n),0,n-1)};};
  // real attack / cast sheets (side views, mirrored toward the target, also when attacking up/down)
  const A=actionFrame(sh,s,H);
  if(A)return {...A,bob:0,flip:H.side==='left',real:true};
  let r=null;
  if(hurt&&sh.hurt?.ok)r=by('hurt',1-heroTrack.hurt/.2);
  if(r)return {...r,bob:0,flip:H.side==='left',state:'hurt'};
  const u=((H.phase%1)+1)%1;
  const cyc=(m)=>{const n=m.frames,j=Math.floor(u*n)%n;return {j,i:(m.order||[])[j]??j};};
  if(moving||roll){
   const dir=roll?'side':H.last;
   if(dir==='S'&&sh.walkfront?.ok){const m=sh.walkfront,{i}=cyc(m);return {m,i,bob:0,flip:false,state:'walk-down'};}
   if(dir==='N'&&sh.walkback?.ok){const m=sh.walkback,{i}=cyc(m);return {m,i,bob:0,flip:false,state:'walk-up'};}
   if(dir==='side'&&sh.walk?.ok){const m=sh.walk,{j,i}=cyc(m),b=(m.bob||[])[j]||0;
    // the bob stays only on weak side sheets (legs barely move); sheets with real stepping get none
    return {m,i,bob:m.weak?b*3*moving:0,flip:H.side==='left',state:'walk-side'};}
   // no sheet for this direction yet: idle frames with a step bob (fallback)
   const m=sh.idle,n=m.frames,step=Math.abs(Math.sin(u*Math.PI*2));
   return {m,i:Math.floor(u*n*2)%n,bob:-step*3.2*moving,sway:Math.sin(u*Math.PI*2)*1.4*moving,flip:H.side==='left',state:dir==='N'?'walk-up(fallback)':'walk-down(fallback)'};
  }
  if(H.last==='N'&&sh.walkback?.ok){const m=sh.walkback;return {m,i:Math.min(BACK_IDLE,m.frames-1),bob:0,flip:false,state:act?act+'-back':'idle-back',breathe:true};}
  const m=sh.idle,n=m.frames;return {m,i:Math.floor(time*(m.fps||4))%n,bob:0,flip:H.side==='left',state:act||'idle'};
 }
 // Draw one sheet cell with feet at the origin, mirrored if needed, with optional hit flash.
 function blitCell(m,i,k,flip,flash){
  const w=m.cellW*k,h=m.cellH*k,ax=m.anchorX*k,ay=m.baseY*k;
  g.save();if(flip)g.scale(-1,1);
  const src={img:(MoonMotion.tint&&MoonMotion.tint(m))||m.img,sx:i*m.cellW,sy:0,sw:m.cellW,sh:m.cellH};
  g.translate(w/2-ax,h-ay);blit(src,w,h,flash);g.restore();
 }
 const PP_GHOST=a=>a<1;
 function framedDraw(o,s,ss,ghostAlpha,dt){
  const H=anim.hero,moving=(H.speed||0)>25?clamp(Math.max(s.moving||0,.6),0,1):0;
  const sel=pick(ss.set,s,H,moving),m=sel.m;
  const frame=frameFor(o,true,'front');
  // Height match: on-screen body height = the static painted hero's body height, for every sheet.
  const bodyTarget=sizeFor(o,true,frame)*(ss.stat?.bodyFrac||.92),k=bodyTarget/(m.bodyH||260);
  const P=pose(o,sel.real?{...s,kind:'idle',action:0}:s,'hero',true,true);
  P.y+=sel.bob||0;P.x+=sel.sway||0;
  if(sel.breathe){const br=Math.sin(time*2.3);P.sy+=.01*br;P.sx-=.005*br;}
  const bodyW=bodyTarget*.42;
  H.info={state:sel.state,sheet:ss.key+'-'+(m.src.split('/').pop().replace(/\.png.*/,'').split('-').pop()),i:sel.i,flip:sel.flip,k:+k.toFixed(3),bodyPx:+bodyTarget.toFixed(1)};
  if(ghostAlpha===1)shadow(o.x,o.y+4,bodyW*1.25,P.lift-(sel.bob||0)*.6+(P.roll?Math.sin(clamp(heroTrack.roll.t/heroTrack.roll.dur,0,1)*Math.PI)*6:0));
  const body=(PP,alpha)=>{g.save();g.translate(PP.x,PP.y);
   if(PP.roll){const hh=bodyTarget;g.translate(0,-hh*.45);g.rotate(PP.roll);g.translate(0,hh*.45);}
   g.rotate(PP.rot);g.scale(PP.sx,PP.sy);blitCell(m,sel.i,k,sel.flip,PP.flash);g.restore();};
  if(heroTrack.roll&&ghostAlpha===1){heroTrack.trail.forEach((q,j)=>{g.save();g.globalAlpha=.12*(j+1)/heroTrack.trail.length;g.translate(q.x,q.y+7);body({...P,x:0,y:0,flash:0,roll:q.roll});g.restore();});}
  g.save();g.globalAlpha=ghostAlpha*heroAlpha();
  g.translate(o.x,o.y+7);const race=typeof customHero!=='undefined'?customHero?.race:null;if(race==='ashbound')g.translate(0,-2-Math.sin(time*2)*1.2);
  {const T=g.getTransform();H.info.dev=[T.a,T.e,T.f];}
  {const ac=MoonMotion.accent&&MoonMotion.accent();if(ac&&!PP_GHOST(ghostAlpha)){g.shadowColor=ac;g.shadowBlur=11*(cinematic.dpr||1);}}   // creator aura: a glow around the real sprite
  body(P);g.restore();
  return bodyTarget/(ss.stat?.bodyFrac||.92);
 }
 // Hero opacity: always solid. The only exceptions are a real dodge-roll afterimage (ghostAlpha<1 while
 // rolling) and a short invulnerability flicker at the start of an evade window (max .6s, never constant).
 function heroAlpha(){
  if(heroTrack.roll||!(p.evade>0))return 1;
  const since=time-heroTrack.evadeAt;return since>=0&&since<.6&&Math.floor(since*14)%2===1?.55:1;
 }
 // ---- Public actor renderer -------------------------------------------------------------
 function actorDraw(o,hero=false,ghostAlpha=1){
  if(hero&&ghostAlpha<1&&!heroTrack.roll)return;   // evade-buff ghosts only as real roll afterimages
  const s=stateFor(hero?p:o,hero),frame=frameFor(o,hero,s.face);if(!frame)return;
  const ss=sheetSet(o,hero);if(hero&&!ss)anim.hero.info=null;
  if(ss){const h=framedDraw(o,s,ss,ghostAlpha);if(ghostAlpha<1)return;
   if(p.shield>0){g.save();g.strokeStyle='#bcd9ff88';g.lineWidth=2;g.beginPath();g.ellipse(o.x,o.y-38,32,49,0,0,Math.PI*2);g.stroke();g.restore();glow(o.x,o.y-36,47,'#a5c9ff',.18);}
   if(p.guard>0)ring(o.x,o.y,28,'#dec99066',2);if(p.regen>0)glow(o.x,o.y-18,42,'#a0ecba',.15);
   if(!document.body.classList.contains('mv-ui2'))label(heroName(),o.x,o.y-h-9,'#f6ead0',12);
   return;}
  const type=hero?'hero':o.type,h=sizeFor(o,hero,frame),src=sourceFor(frame),w=h*src.sw/src.sh;
  let race=hero&&typeof customHero!=='undefined'?customHero?.race:null;
  const P=pose(o,s,type,hero);
  if(!hero&&ghostAlpha===1&&typeof drawBindingVines==='function')drawBindingVines(o,w,h,false);
  if(ghostAlpha===1)shadow(o.x,o.y+4,w,P.lift+(type==='wisp'?6:0)+(P.roll?Math.sin(clamp(heroTrack.roll.t/heroTrack.roll.dur,0,1)*Math.PI)*6:0));
  // Dodge afterimages.
  if(hero&&heroTrack.roll&&ghostAlpha===1){heroTrack.trail.forEach((q,i)=>{g.save();g.globalAlpha=.12*(i+1)/heroTrack.trail.length;g.translate(q.x,q.y+7);drawBody(frame,w,h,s,type,{...P,x:0,y:0,flash:0,roll:q.roll});g.restore();});}
  g.save();g.globalAlpha=ghostAlpha*(hero?heroAlpha():1);
  g.translate(o.x,o.y+7);if(race==='ashbound')g.translate(0,-2-Math.sin(time*2)*1.2);
  drawBody(frame,w,h,s,type,P,{weapon:hero,cls:o.cls||p.cls});
  g.restore();
  if(!hero&&ghostAlpha===1&&typeof drawBindingVines==='function')drawBindingVines(o,w,h,true);
  if(ghostAlpha<1)return;
  if(hero){
   if(p.shield>0){g.save();g.strokeStyle='#bcd9ff88';g.lineWidth=2;g.beginPath();g.ellipse(o.x,o.y-38,32,49,0,0,Math.PI*2);g.stroke();g.restore();glow(o.x,o.y-36,47,'#a5c9ff',.18);}
   if(p.guard>0)ring(o.x,o.y,28,'#dec99066',2);if(p.regen>0)glow(o.x,o.y-18,42,'#a0ecba',.15);
   if(!document.body.classList.contains('mv-ui2'))label(heroName(),o.x,o.y-h-9,'#f6ead0',12);
  }else{
   drawEnemyStatus(o,h);if(o.root>0)ring(o.x,o.y,20,'#87c9ac88');if(o.mark>0)label('◇',o.x,o.y-h-31,'#ffde95',20);if(type==='wisp')glow(o.x,o.y-35,29,'#b697df',.15);
  }
 }
 // Generic body draw used by NPCs, followers and the creator preview (no game object).
 function articulated(f,w,h,s,type){if(f&&f.scale){w*=f.scale;h*=f.scale;}s=s||{face:'front'};if(s.seed===undefined)s.seed=Math.random()*9;const P=pose({x:0,phase:s.seed},s,type||'hero',false);drawBody(f,w,h,s||{},type,P,{weapon:false});}
 function warriorRig(f,w,h,s){const P={x:0,y:0,rot:0,sx:1,sy:1,flash:0,roll:0,lift:0};drawBody(f,w,h,s,'hero',P,{weapon:true,cls:'warrior'});}

 // ---- Death ----------------------------------------------------------------------------
 function addCorpse(m){
  const s=stateFor(m),frame=frameFor(m,false,s.face);if(!frame)return;
  const h=sizeFor(m,false,frame),src=sourceFor(frame);
  corpses.push({x:m.x,y:m.y,type:m.type,frame,h,w:h*src.sw/src.sh,face:s.face,t:0,dir:Math.sign(m.x-p.x)||1,color:m.color||'#cfe7b0'});
  if(corpses.length>12)corpses.shift();
 }
 function drawCorpses(){
  corpses.forEach(c=>{const u1=clamp(c.t/.35,0,1),u2=clamp((c.t-.35)/.65,0,1),e=ease.in(u1);
   const P={x:c.dir*6*e,y:u2*6,rot:c.type==='slime'||c.type==='wisp'?0:c.dir*1.25*e,sx:c.type==='slime'?1+.5*e:1,sy:c.type==='slime'?1-.75*e:c.type==='wisp'?1+.3*e:1,flash:Math.max(0,1-c.t*5),roll:0,lift:0};
   shadow(c.x,c.y+4,c.w,0,1-u2);
   g.save();g.globalAlpha=1-u2;g.translate(c.x,c.y+7);drawBody(c.frame,c.w,c.h,{face:c.face},c.type,P);g.restore();});
 }
 function update(dt){
  if(typeof p!=='undefined'&&p)trackHero(p,dt);
  actionTick(dt);
  for(let i=corpses.length-1;i>=0;i--){corpses[i].t+=dt;if(corpses[i].t>1)corpses.splice(i,1);}
  // Hero hit + dodge tracking.
  if(heroTrack.hp!==null&&p.hp<heroTrack.hp-.5&&p.hp>0)heroTrack.hurt=.2;heroTrack.hp=p.hp;heroTrack.hurt=Math.max(0,heroTrack.hurt-dt);
  if(p.evade>heroTrack.evade+.2&&!heroTrack.roll){const s=stateFor(p,true),f=faceVec(s.face);heroTrack.roll={t:0,dur:.42,dir:(Math.sign(p.dx||0)||f.x||1)};heroTrack.trail=[];}
  if(p.evade>0&&!(heroTrack.evade>0))heroTrack.evadeAt=time;
  heroTrack.evade=p.evade;
  if(heroTrack.roll){const r=heroTrack.roll;r.t+=dt;heroTrack.trail.push({x:p.x,y:p.y,roll:r.dir*Math.PI*2*ease.inOut(clamp(r.t/r.dur,0,1))});if(heroTrack.trail.length>4)heroTrack.trail.shift();if(r.t>=r.dur){heroTrack.roll=null;heroTrack.trail=[];}}
 }
 return {art:null,anim,heroAlpha,heroTrack,emitWorld,emitNow,startAction,emitFrom:'auto',animInfo:()=>anim.hero.info,actorDraw,articulated,warriorRig,addCorpse,drawCorpses,update,pose,ease,corpses};
})();

// Install: the single motion system replaces every previous body renderer.
actor=MoonMotion.actorDraw;renderSprite=MoonMotion.actorDraw;
drawArticulated=MoonMotion.articulated;drawWarriorRig=MoonMotion.warriorRig;
{const before=update;update=function(dt){before(dt);MoonMotion.update(dt);};}
{const before=damage;damage=function(m,n,c){const alive=m&&m.alive,hp=m?m.hp:0;before(m,n,c);
 if(alive&&!m.alive){MoonMotion.addCorpse(m);if(typeof burst==='function'){burst(m.x,m.y-25,m.color||'#e9f1c9',26,140);burst(m.x,m.y-25,'#fff3d6',10,60);}cinematic.shake=Math.max(cinematic.shake,m.type==='boss'?7:3);MoonFeel.hitstop(m.type==='boss'?.12:.05);}
 else if(alive&&hp-m.hp>m.maxHp*.22){cinematic.shake=Math.max(cinematic.shake,1.8);}
};}

// Creator preview: same rigid motion (the old preview used the mesh warp).
{const before=creatorPreview;creatorPreview=function(){const c=$('creatorPreview');if(!c?.getContext)return before();
 const f=customFrame(creatorDraft,directions[creatorFace]);if(!f?.novice||typeof jointSource!=='function')return before();
 const ctx=c.getContext('2d'),now=performance.now()/1000,active=performance.now()<epicArt.previewUntil,kind=active?epicArt.preview:'idle',elapsed=active?1.8-(epicArt.previewUntil-performance.now())/1000:0;
 const src=jointSource(f,false),h=Math.min(c.height-50,410)*(f.heightScale||1),w=h*src.width/src.height;
 ctx.clearRect(0,0,c.width,c.height);ctx.save();
 const gr=ctx.createRadialGradient(c.width/2,c.height-20,0,c.width/2,c.height-20,70);gr.addColorStop(0,'rgba(3,8,14,.7)');gr.addColorStop(1,'rgba(3,8,14,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(c.width/2,c.height-20,70,16,0,0,Math.PI*2);ctx.fill();
 ctx.translate(c.width/2,c.height-24);
 let y=0,rot=0,sx=1,sy=1,x=0;const E=MoonMotion.ease;
 if(kind==='walk'){const ph=now*7,b=Math.abs(Math.sin(ph));y=-b*7;sy=1-.035*Math.pow(1-b,6);rot=Math.sin(ph)*.03;}
 else if(kind==='attack'){const u=(elapsed%.9)/.9;if(u<.3){const k=E.inOut(u/.3);x=-10*k;rot=-.1*k;}else if(u<.52){const k=E.back((u-.3)/.22);x=-10+30*k;rot=-.1+.22*k;}else{const k=E.out((u-.52)/.48);x=20*(1-k);rot=.12*(1-k);}}
 else if(kind==='cast'){y=-4-Math.sin(now*6)*2;sy=1.02;}
 else{const br=Math.sin(now*2.3);sy=1+.014*br;sx=1-.007*br;}
 ctx.translate(x,y);ctx.rotate(rot);ctx.scale(sx,sy);ctx.drawImage(src,-w/2,-h,w,h);
 try{const r=jointRest(f),pt=r.arms[f.face==='back'?1:0][2],s={face:directions[creatorFace],stride:0,moving:0,kind:kind==='attack'?'strike':kind==='cast'?'cast':'idle',action:kind==='idle'?0:.3,castBlend:1};drawClassImplement(ctx,selectedClass,{x:(pt.x-.5)*w,y:(pt.y-1)*h},jointPose(f,s,selectedClass),s,0,h/112);}catch(e){}
 ctx.restore();};}

// Spells and staff attacks leave from the painted staff tip (or the palm for the warrior), on the
// sheet's release / impact frame, mirrored with facing. Heroes without frame sheets keep the old origin.
{const sheetsOn=()=>{const H=MoonMotion.anim.hero;return MoonMotion.emitWorld('cast',0)!==null;};
 let inSpell=false,spawning=false;
 const place=(name)=>{const e=MoonMotion.emitWorld(name);if(!e)return;const sh=shots[shots.length-1];if(sh&&!sh.enemy){sh.x=e.x;sh.y=e.y;sh.trail=[];}
  const d=cinematic.decals[cinematic.decals.length-1];if(d&&d.kind==='flare'&&d.life>=d.max-.001){d.x=e.x;d.y=e.y;}};
 const beforeProjectile=projectile;
 projectile=function(from,to,amount,color,enemy=false,onHit=null){
  if(enemy||from!==p||!sheetsOn())return beforeProjectile(from,to,amount,color,enemy,onHit);
  if(inSpell){const r=beforeProjectile(from,to,amount,color,enemy,onHit);place('cast');return r;}
  // basic staff attack: wind up on the attack sheet, spawn on its impact frame
  if(!spawning&&Math.abs(amount-p.power*.7)<1e-6&&MoonMotion.startAction('attack',()=>{if(!to||(to.alive===false))return;spawning=true;try{beforeProjectile(p,to,amount,color,false,onHit);place('attack');}finally{spawning=false;}}))return;
  const r=beforeProjectile(from,to,amount,color,enemy,onHit);place('attack');return r;
 };
 if(typeof releaseSpell==='function'){const beforeRelease=releaseSpell;releaseSpell=function(i){
  const cd=p.cd[i];inSpell=true;let r;try{r=beforeRelease(i);}finally{inSpell=false;}
  if(p.cd[i]>cd&&sheetsOn()){MoonMotion.startAction('cast');const e=MoonMotion.emitWorld('cast');
   // every spell flashes at the emit point, also self/area spells whose main effect is on the ground or target
   if(e)cinematic.decals.push({x:e.x,y:e.y,r:30,color:(typeof colorFor!=='undefined'&&colorFor[CLASSES[p.cls].skills[i][5]])||CLASSES[p.cls].color,life:.4,max:.4,kind:'flare'});}
  return r;};}
}
