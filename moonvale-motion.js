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
 const heroTrack={hp:null,evade:0,roll:null,hurt:0,trail:[]};

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
 // and for up/down travel the idle frames with a step bob until walkback sheets exist.
 // Action sheets (attack/cast/hurt) are used if present; otherwise the current frame plays
 // under the existing transform (lunge, cast lift, knockback + flash, roll). Anything with
 // no sheet (enemies, NPCs, ranger, classic art) keeps the rigid motion above.
 const anim={sheets:{},meta:globalThis.MOONVALE_ANIM||null,hero:{phase:0,lastX:null,lastY:null,side:'right',idleT:0,info:null}};
 if(anim.meta)for(const [ch,set] of Object.entries(anim.meta.chars||{}))for(const [name,m] of Object.entries(set)){
  const img=new Image();img.decoding='async';const e={...m,img,ok:false};img.onload=()=>{e.ok=true;};img.src=m.src;(anim.sheets[ch]||(anim.sheets[ch]={}))[name]=e;}
 const WALK_CYCLE=118;          // world px travelled per full walk cycle (two steps)
 function sheetSet(o,hero){
  if(!hero||!anim.meta||!MoonMotion.art?.heroKey||(typeof MoonMotion.disableFrames!=='undefined'&&MoonMotion.disableFrames))return null;
  const k=MoonMotion.art.heroKey(o.cls||p.cls);const set=k&&anim.sheets[k];
  return set&&set.idle?.ok?{key:k,set,stat:anim.meta.static?.[k]}:null;
 }
 function trackHero(o,dt){
  const H=anim.hero;if(H.lastX===null){H.lastX=o.x;H.lastY=o.y;}
  const d=Math.hypot(o.x-H.lastX,o.y-H.lastY);if(d<40)H.phase+=d/WALK_CYCLE;H.lastX=o.x;H.lastY=o.y;H.idleT+=dt;
 }
 function pick(sh,s,H,moving){
  // returns {sheet, cell index, bob(px, negative=up), flip}
  const f=faceVec(s.face);if(f.x)H.side=f.x<0?'left':'right';
  const act=s.action>0?s.kind:null,roll=!!heroTrack.roll,hurt=heroTrack.hurt>0;
  const by=(name,u)=>{const m=sh[name];if(!m||!m.ok)return null;const n=m.frames;return {m,i:clamp(Math.floor(u*n),0,n-1)};};
  let r=null;
  if(hurt&&sh.hurt?.ok)r=by('hurt',1-heroTrack.hurt/.2);
  else if(act==='strike'&&sh.attack?.ok){const tot=s.weaponAttack?.duration||.55,u=s.weaponAttack?clamp(s.weaponAttack.elapsed/tot,0,1):clamp(1-s.action/tot,0,1);r=by('attack',u);}
  else if((act==='cast'||act==='release'||act==='windup'||act==='shoot')&&sh.cast?.ok)r=by('cast',(time*(sh.cast.fps||10)/sh.cast.frames)%1);
  if(r)return {...r,bob:0,flip:H.side==='left',state:act||'hurt',framed:true};
  if(moving||roll){
   const u=((H.phase%1)+1)%1;
   if(f.x||roll){const m=sh.walk;if(m?.ok){const n=m.frames,j=Math.floor(u*n)%n,i=(m.order||[])[j]??j,b=(m.bob||[])[j]||0;
    return {m,i,bob:b*(m.weak?3:1.6)*moving,flip:H.side==='left',state:'walk-side',framed:true};}}
   const back=f.y<0&&sh.walkback?.ok?sh.walkback:null;
   if(back){const n=back.frames,j=Math.floor(u*n)%n;return {m:back,i:j,bob:0,flip:false,state:'walk-back',framed:true};}
   // up/down: front idle frames stepping with a bob (two bobs per cycle) and a slight side sway
   const m=sh.idle,n=m.frames,step=Math.abs(Math.sin(u*Math.PI*2));
   return {m,i:Math.floor(u*n*2)%n,bob:-step*3.2*moving,sway:Math.sin(u*Math.PI*2)*1.4*moving,flip:H.side==='left',state:f.y<0?'walk-up':'walk-down',framed:true};
  }
  const m=sh.idle,n=m.frames;return {m,i:Math.floor(time*(m.fps||4))%n,bob:0,flip:H.side==='left',state:act||'idle',framed:true};
 }
 // Draw one sheet cell with feet at the origin, mirrored if needed, with optional hit flash.
 function blitCell(m,i,k,flip,flash){
  const w=m.cellW*k,h=m.cellH*k,ax=m.anchorX*k,ay=m.baseY*k;
  g.save();if(flip)g.scale(-1,1);
  const src={img:m.img,sx:i*m.cellW,sy:0,sw:m.cellW,sh:m.cellH};
  g.translate(w/2-ax,h-ay);blit(src,w,h,flash);g.restore();
 }
 function framedDraw(o,s,ss,ghostAlpha,dt){
  const H=anim.hero,moving=clamp((s.moving||0)>.12?s.moving:0,0,1);
  const sel=pick(ss.set,s,H,moving),m=sel.m;
  const frame=frameFor(o,true,'front');
  // Height match: on-screen body height = the static painted hero's body height, for every sheet.
  const bodyTarget=sizeFor(o,true,frame)*(ss.stat?.bodyFrac||.92),k=bodyTarget/(m.bodyH||260);
  const P=pose(o,s,'hero',true,true);
  P.y+=sel.bob||0;P.x+=sel.sway||0;
  const bodyW=bodyTarget*.42;
  H.info={state:sel.state,sheet:ss.key+'-'+(m.src.split('/').pop().replace(/\.png.*/,'').split('-').pop()),i:sel.i,flip:sel.flip,k:+k.toFixed(3),bodyPx:+bodyTarget.toFixed(1)};
  if(ghostAlpha===1)shadow(o.x,o.y+4,bodyW*1.25,P.lift-(sel.bob||0)*.6+(P.roll?Math.sin(clamp(heroTrack.roll.t/heroTrack.roll.dur,0,1)*Math.PI)*6:0));
  const body=(PP,alpha)=>{g.save();g.translate(PP.x,PP.y);
   if(PP.roll){const hh=bodyTarget;g.translate(0,-hh*.45);g.rotate(PP.roll);g.translate(0,hh*.45);}
   g.rotate(PP.rot);g.scale(PP.sx,PP.sy);blitCell(m,sel.i,k,sel.flip,PP.flash);g.restore();};
  if(heroTrack.roll&&ghostAlpha===1){heroTrack.trail.forEach((q,j)=>{g.save();g.globalAlpha=.12*(j+1)/heroTrack.trail.length;g.translate(q.x,q.y+7);body({...P,x:0,y:0,flash:0,roll:q.roll});g.restore();});}
  g.save();g.globalAlpha=ghostAlpha*(p.evade>0&&!heroTrack.roll?.72:1);
  g.translate(o.x,o.y+7);const race=typeof customHero!=='undefined'?customHero?.race:null;if(race==='ashbound')g.translate(0,-2-Math.sin(time*2)*1.2);
  {const T=g.getTransform();H.info.dev=[T.a,T.e,T.f];}
  body(P);g.restore();
  return bodyTarget/(ss.stat?.bodyFrac||.92);
 }
 // ---- Public actor renderer -------------------------------------------------------------
 function actorDraw(o,hero=false,ghostAlpha=1){
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
  g.save();g.globalAlpha=ghostAlpha*(hero&&p.evade>0&&!heroTrack.roll?.72:1);
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
  for(let i=corpses.length-1;i>=0;i--){corpses[i].t+=dt;if(corpses[i].t>1)corpses.splice(i,1);}
  // Hero hit + dodge tracking.
  if(heroTrack.hp!==null&&p.hp<heroTrack.hp-.5&&p.hp>0)heroTrack.hurt=.2;heroTrack.hp=p.hp;heroTrack.hurt=Math.max(0,heroTrack.hurt-dt);
  if(p.evade>heroTrack.evade+.2&&!heroTrack.roll){const s=stateFor(p,true),f=faceVec(s.face);heroTrack.roll={t:0,dur:.42,dir:(Math.sign(p.dx||0)||f.x||1)};heroTrack.trail=[];}
  heroTrack.evade=p.evade;
  if(heroTrack.roll){const r=heroTrack.roll;r.t+=dt;heroTrack.trail.push({x:p.x,y:p.y,roll:r.dir*Math.PI*2*ease.inOut(clamp(r.t/r.dur,0,1))});if(heroTrack.trail.length>4)heroTrack.trail.shift();if(r.t>=r.dur){heroTrack.roll=null;heroTrack.trail=[];}}
 }
 return {art:null,anim,animInfo:()=>anim.hero.info,actorDraw,articulated,warriorRig,addCorpse,drawCorpses,update,pose,ease,corpses};
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
