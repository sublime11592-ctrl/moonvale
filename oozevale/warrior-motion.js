'use strict';
// A separate textured blade stays attached to the weapon hand in every view.
const warriorBlade=new Image();let warriorBladeReady=false;
warriorBlade.onload=()=>{warriorBladeReady=true;appearancePortraits.clear();renderAppearancePicker();updateClassPortraits();};warriorBlade.src='warrior-blade.webp';
let swordSequence=0;
function beginWarriorAttack(kind,aim,onImpact=null){
 if(p.cls!=='warrior')return;
 const s=stateFor(p,true),dx=aim?aim.x-p.x:p.dx,dy=aim?aim.y-p.y:p.dy;
 s.face=facingFrom(dx,dy,s.face);
 const duration=kind==='spin'?.8:kind==='slam'?.7:kind==='sunder'?.64:kind==='bash'?.44:.56;
 s.weaponAttack={kind,elapsed:0,duration,angle:Math.atan2(dy||0,dx||.001),face:s.face,side:(++swordSequence%2?1:-1),onImpact,resolved:false,origin:{x:p.x,y:p.y}};
 s.kind='strike';s.action=duration;p.attack=Math.max(p.attack,duration);
}
function swordPose(s){
 // A relaxed upright guard: grip in the fist, blade slightly outside the shoulder.
 const a=s.weaponAttack,rest=({front:-.28,back:.28,left:-.48,right:.48})[s.face]??-.28;
 if(!a)return {angle:rest+Math.sin(s.stride)*s.moving*.035,progress:0,strength:0,trail:false};
 const t=clamp(a.elapsed/a.duration,0,1),base=a.angle+Math.PI/2,sign=a.kind==='sunder'?1:a.side;
 let angle;
 if(a.kind==='spin')angle=base-Math.PI*2+t*Math.PI*4;
 else if(a.kind==='slam')angle=t<.38?(-.25*t/.38):t<.65?-.25+(Math.PI+.25)*(t-.38)/.27:Math.PI+(rest-Math.PI)*(t-.65)/.35;
 else if(t<.28){const windup=base-sign*1.55,delta=Math.atan2(Math.sin(windup-rest),Math.cos(windup-rest)),q=t/.28;angle=rest+delta*q*q*(3-2*q);}
 else if(t<.65)angle=base+sign*(-1.55+2.8*(t-.28)/.37);
 else{const end=base+sign*1.25,delta=Math.atan2(Math.sin(rest-end),Math.cos(rest-end));angle=end+delta*(t-.65)/.35;}
 return {angle,progress:t,strength:Math.sin(t*Math.PI),trail:t>.28&&t<.67};
}
function warriorHand(frame,w,h,s,pose){
 const preset=appearanceChoices.warrior||0;
 const anchors=frame.handAnchor||[
  {front:[.065,.55],back:[.92,.55],left:[.1,.56],right:[.91,.54]},
  {front:[.065,.59],back:[.93,.59],left:[.09,.55],right:[.39,.61]},
  {front:[.08,.58],back:[.91,.58],left:[.1,.55],right:[.46,.62]},
  {front:[.07,.55],back:[.93,.55],left:[.08,.52],right:[.34,.62]}
 ][preset][s.face];
 const facing=s.face==='left'?-1:1,bodyShift=s.weaponAttack?7*pose.strength*facing:Math.sin(s.stride)*s.moving;
 return {x:(anchors[0]-.5)*w+bodyShift,y:(anchors[1]-1)*h,u:anchors[0],v:anchors[1]};
}
const warriorParts=new WeakMap();
function articulatedWeaponArm(frame,s,hand){
 if(warriorParts.has(frame))return warriorParts.get(frame);
 const sw=frame.sw,sh=frame.sh,right=hand.u>.5,nearProfile=s.face==='right'&&hand.u<.6;
 const wrist={x:hand.u*sw,y:hand.v*sh},elbow={x:wrist.x+(nearProfile?.02:right?-.1:.1)*sw,y:wrist.y-sh*.17};
 const dx=wrist.x-elbow.x,dy=wrist.y-elbow.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len,thickness=sw*(nearProfile?.055:.065);
 const polygon=[[elbow.x+nx*thickness,elbow.y+ny*thickness],[elbow.x-nx*thickness,elbow.y-ny*thickness],[wrist.x-nx*thickness-dx*.23,wrist.y-ny*thickness+sh*.04],[wrist.x+nx*thickness+dx*.23,wrist.y+ny*thickness+sh*.04]];
 const path=ctx=>{ctx.beginPath();polygon.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();};
 const body=document.createElement('canvas'),arm=document.createElement('canvas');body.width=arm.width=sw;body.height=arm.height=sh;
 const bg=body.getContext('2d'),ag=arm.getContext('2d');bg.drawImage(frame.img,frame.sx,frame.sy,sw,sh,0,0,sw,sh);bg.globalCompositeOperation='destination-out';path(bg);bg.fill();
 path(ag);ag.clip();ag.drawImage(frame.img,frame.sx,frame.sy,sw,sh,0,0,sw,sh);
 const parts={body:{img:body,sx:0,sy:0,sw,sh,cartoon:frame.cartoon},arm,wrist,elbow};warriorParts.set(frame,parts);return parts;
}
function drawHeldBlade(ctx,x,y,angle,scale=.34,alpha=1){
 // The pivot is the grip below the crossguard, not the crossguard itself.
 if(!warriorBladeReady)return;ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(warriorBlade,-44*scale,-155*scale,88*scale,165*scale);ctx.restore();
}
function drawWarriorRig(frame,w,h,s){
 if(!frame.unarmed){drawArticulated(frame,w,h,s,'hero');return;}
 const pose=swordPose(s),restHand=warriorHand(frame,w,h,s,{strength:0}),parts=articulatedWeaponArm(frame,s,restHand),behind=s.face==='back'||s.face==='left';
 if(!s.weaponAttack){
  // Keep the original relaxed arm intact while idle and walking.
  if(behind)drawHeldBlade(g,restHand.x,restHand.y,pose.angle);
  drawArticulated(frame,w,h,{...s,kind:'walk',action:0},'hero');
  if(!behind){drawHeldBlade(g,restHand.x,restHand.y,pose.angle);g.drawImage(parts.arm,-w/2,-h,w,h);}
  return;
 }
 const elbow={x:(parts.elbow.x/frame.sw-.5)*w,y:(parts.elbow.y/frame.sh-1)*h},a=s.weaponAttack,t=pose.progress;
 let rotation=0;
 if(a){const armBase=Math.atan2(restHand.y-elbow.y,restHand.x-elbow.x),aim=({front:Math.PI/2,back:-Math.PI/2,left:Math.PI,right:0})[s.face],extend=Math.atan2(Math.sin(aim-armBase),Math.cos(aim-armBase));rotation=t<.28?-.65*(t/.28):t<.58?-.65+(extend+.65)*(t-.28)/.3:extend*(1-(t-.58)/.42);if(a.kind==='spin')rotation=Math.sin(t*Math.PI*4)*.9;}
 const dx=restHand.x-elbow.x,dy=restHand.y-elbow.y,hand={x:elbow.x+dx*Math.cos(rotation)-dy*Math.sin(rotation),y:elbow.y+dx*Math.sin(rotation)+dy*Math.cos(rotation)};
 const drawArm=()=>{g.save();g.translate(elbow.x,elbow.y);g.rotate(rotation);g.drawImage(parts.arm,-w/2-elbow.x,-h-elbow.y,w,h);g.restore();};
 if(pose.trail){
  g.save();g.translate(hand.x,hand.y);g.strokeStyle=frame.cartoon?'#ffeab6dd':'#fff0c18a';g.lineWidth=frame.cartoon?4:2.4;g.lineCap='round';g.beginPath();const end=pose.angle-Math.PI/2,sign=s.weaponAttack?.side||1;g.arc(0,0,39,end-sign*.7,end,sign<0);g.stroke();g.restore();
  drawHeldBlade(g,hand.x,hand.y,pose.angle-(s.weaponAttack?.side||1)*.2,.34,.15);
 }
 if(behind){drawHeldBlade(g,hand.x,hand.y,pose.angle);drawArm();}
 const articulated={...s,kind:'walk',action:0};
 drawArticulated(parts.body,w,h,articulated,'hero');
 if(!behind){drawHeldBlade(g,hand.x,hand.y,pose.angle);drawArm();}
}
const updateBeforeSword=update;update=function(dt){
 updateBeforeSword(dt);const s=stateFor(p,true),a=s.weaponAttack;if(!a)return;
 if(p.cls!=='warrior'||dist(p,a.origin)>240){s.weaponAttack=null;return;}
 a.elapsed+=dt;const progress=a.elapsed/a.duration;
 s.kind='strike';s.action=Math.max(.001,a.duration-a.elapsed);s.face=a.face;
 if(a.kind==='spin')s.face=directions[Math.floor(progress*8)%4];
 if(!a.resolved&&progress>=.48){a.resolved=true;a.onImpact?.();}
 if(progress>=1){s.weaponAttack=null;s.action=0;s.kind=s.moving>.12?'walk':'idle';s.face=a.face;}
};
const releaseBeforeSword=releaseSpell;releaseSpell=function(i){const kind=CLASSES[p.cls].skills[i][5],aim=target,before=p.cd[i];releaseBeforeSword(i);if(p.cls==='warrior'&&p.cd[i]>before&&['sunder','spin','bash','charge'].includes(kind))beginWarriorAttack(kind,aim);};
const signatureBeforeSword=useSignature;useSignature=function(){const before=identityState.cooldown;signatureBeforeSword();if(p.cls==='warrior'&&identityState.cooldown>before)beginWarriorAttack('slam',target);};signatureButton.onclick=()=>useSignature();
const travelBeforeSword=travel;travel=function(zone){const before=story.zone;travelBeforeSword(zone);if(story.zone!==before)stateFor(p,true).weaponAttack=null;};
// Blade arcs come from the moving weapon; avoid a second detached spinning arc.
const decalBeforeSword=renderDecal;renderDecal=function(d){if(d.kind==='blade'&&p.cls==='warrior')return;decalBeforeSword(d);};
const spellBeforeSword=renderSpell;renderSpell=function(f){if(f.kind==='slash'&&p.cls==='warrior')return;spellBeforeSword(f);};
