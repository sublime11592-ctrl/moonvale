'use strict';
const townFrames=[];
function campTownsfolk(){return [{id:'smith',npcStyle:1,name:'Orin · Blacksmith',x:CAMP.x-170,y:CAMP.y+45,glyph:'▣',service:'shop'},{id:'innkeeper',npcStyle:5,name:'Mara · Innkeeper',x:CAMP.x-55,y:CAMP.y+62,glyph:'▣',service:'shop'}];}
function npcFrame(n,face='front'){
 const role=n.npcStyle??({quartermaster:3,chronicler:0,caravan:6,wayfarer:7}[n.id])??[0,2,4][n.hub]??0;
 return townFrames[role]?.[directions.indexOf(face)];
}
function syncCartoonResidents(){
 // NPC-only artwork. Never copy any player preset into this collection.
 if(townFrames.length)directional.heroes=[townFrames[0],townFrames[3],townFrames[6],townFrames[7]];
}
const townAtlas=new Image();townAtlas.onload=()=>{townFrames.push(...sliceRaceStyles(townAtlas,true,8));syncCartoonResidents();};townAtlas.src='epic-npcs.webp';
const cartoonRenderCreatorBefore=renderCreator;renderCreator=function(){
 cartoonRenderCreatorBefore();const f=customFrame(creatorDraft);if(!f?.cartoon)return;
 const src=raceStylePortrait(creatorDraft.race,creatorDraft.sex,creatorDraft.presetStyle);
 for(const card of $('classCards').children){const img=card.querySelector('.class-portrait');if(img&&src)img.src=src;}
};
function drawCartoonBody(f,w,h,s,type){
 const walk=clamp(s.moving,0,1),phase=s.stride,side=s.face==='left'||s.face==='right',envelope=s.action>0?Math.sin(clamp(s.action/.55,0,1)*Math.PI):0,direction=s.face==='left'?-1:1;
 g.save();
 if(type==='slime'){const squash=Math.sin(phase*2)*walk*.09+(s.kind==='windup'?.09:0);g.scale(1+squash,1-squash);spritePart(f,0,0,1,1,-w/2,-h,w,h);g.restore();return;}
 if(type==='wisp'){g.rotate(Math.sin(time*2+s.stride)*.045+direction*envelope*.1);spritePart(f,0,0,1,1,-w/2,-h,w,h);g.restore();return;}
 g.rotate(Math.sin(phase)*walk*.025+(s.kind==='windup'?-direction*.09:s.kind==='strike'?direction*envelope*.1:0));
 const split=type==='boar'?.65:.73;
 for(let half=0;half<2;half++){const step=Math.sin(phase+half*Math.PI)*walk,dx=step*(side?5:2.8),lift=Math.max(0,step)*4.2;spritePart(f,half*.5,split,.5,1-split,-w/2+half*w/2+dx,-h*(1-split)-lift,w/2,h*(1-split)+.5);}
 spritePart(f,0,0,1,split,-w/2,-h,w,h*split+.6);g.restore();
}
function cartoonCastLift(s){return s.kind==='cast'?.8:Math.sin(clamp(s.action/.55,0,1)*Math.PI)*.95;}
const articulatedBeforeCartoon=drawArticulated;drawArticulated=function(f,w,h,s,type){
 if(!f.cartoon)return articulatedBeforeCartoon(f,w,h,s,type);
 if(type!=='hero'||!['cast','release','shoot'].includes(s.kind)||s.action<=0){drawCartoonBody(f,w,h,s,type);return;}
 const anchor=f.handAnchor||[.17,.67],parts=articulatedWeaponArm(f,s,{u:anchor[0],v:anchor[1]}),elbow={x:(parts.elbow.x/f.sw-.5)*w,y:(parts.elbow.y/f.sh-1)*h},rotation=(anchor[0]<.5?1:-1)*cartoonCastLift(s),behind=s.face==='back';
 const arm=()=>{g.save();g.translate(elbow.x,elbow.y);g.rotate(rotation);g.drawImage(parts.arm,-w/2-elbow.x,-h-elbow.y,w,h);g.restore();};
 if(behind)arm();drawCartoonBody(parts.body,w,h,s,type);if(!behind)arm();
};
const handBeforeCartoon=handPosition;handPosition=function(o,face){
 if(o!==p)return handBeforeCartoon(o,face);const f=heroFrame(p.cls,face);if(!f?.cartoon)return handBeforeCartoon(o,face);
 const h=112*(f.heightScale||1),w=h*f.sw/f.sh,a=f.handAnchor,s=stateFor(p,true),parts=articulatedWeaponArm(f,s,{u:a[0],v:a[1]}),elbow={x:(parts.elbow.x/f.sw-.5)*w,y:(parts.elbow.y/f.sh-1)*h};
 const dx=(a[0]-.5)*w-elbow.x,dy=(a[1]-1)*h-elbow.y,rotation=(a[0]<.5?1:-1)*cartoonCastLift(s);
 return {x:o.x+elbow.x+dx*Math.cos(rotation)-dy*Math.sin(rotation),y:o.y+7+elbow.y+dx*Math.sin(rotation)+dy*Math.cos(rotation)};
};
syncCartoonResidents();renderCreator();
