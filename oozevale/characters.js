'use strict';
// Appearance belongs to the adventure; selecting a look never changes its stats.
const characterPresets={
 mage:[['Rowan','Moonweaver','Silver hair · violet robes'],['Alden','Tide scholar','White beard · teal robes'],['Nia','Starcaller','Natural curls · gold & indigo'],['Finch','Ember sage','Red hair · wine & bronze']],
 warrior:[['Rowan','Dawn sentinel','Gold armor · blue cape'],['Kaia','Copper vanguard','Red hair · copper armor'],['Bram','Iron warden','Dwarf · black beard · iron plate'],['Imani','Emerald knight','Braids · silver & emerald']],
 ranger:[['Rowan','Grove tracker','Brown braid · green leather'],['Idris','River scout','Short curls · blue-green leather'],['Seren','Night ranger','Silver hair · midnight leather'],['Arlen','Sunwood hunter','Hooded elf · ochre & green']],
 druid:[['Rowan','Wild keeper','Antlers · teal leaves'],['Elowen','Autumn tender','Auburn hair · autumn leaves'],['Orin','Moss elder','Gray beard · mossy robes'],['Lunara','Moonbloom','Silver hair · turquoise leaves']]
};
let appearanceChoices={mage:0,warrior:0,ranger:0,druid:0},appearanceDraft={...appearanceChoices};
const presetSheets=[null,null,null,null],appearancePortraits=new Map();
let unarmedWarriorFrames=null;
function sliceCharacterSheet(img){
 const cw=Math.floor(img.naturalWidth/4),ch=Math.floor(img.naturalHeight/4),rows=[];
 for(let row=0;row<4;row++){rows[row]=[];for(let col=0;col<4;col++){
  const c=document.createElement('canvas');c.width=cw;c.height=ch;const ctx=c.getContext('2d');ctx.drawImage(img,col*cw,row*ch,cw,ch,0,0,cw,ch);
  const data=ctx.getImageData(0,0,cw,ch).data;let l=cw,t=ch,r=0,b=0;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(data[(y*cw+x)*4+3]>40){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
  if(r<=l||b<=t)throw Error('Empty character artwork');
  rows[row][col]={img:c,sx:l,sy:t,sw:r-l+1,sh:b-t+1};
 }}return rows;
}
function appearanceFrame(cls,preset,face='front'){
 if(preset===0&&cls==='warrior'&&unarmedWarriorFrames)return unarmedWarriorFrames[directions.indexOf(face)];
 const sheet=presetSheets[preset]||(preset===0?directional.heroes:null);
 return sheet?.[spriteOrder.indexOf(cls)]?.[directions.indexOf(face)];
}
const defaultHeroFrame=heroFrame;
heroFrame=function(cls,face){return appearanceFrame(cls,appearanceChoices[cls]||0,face)||defaultHeroFrame(cls,face);};
heroName=function(){return characterPresets[p.cls][appearanceChoices[p.cls]||0][0];};
function portraitFor(cls,preset){
 const f=appearanceFrame(cls,preset);if(!f)return '';
 const key=cls+'-'+preset;if(appearancePortraits.has(key))return appearancePortraits.get(key);
 const c=document.createElement('canvas');c.width=180;c.height=210;const ctx=c.getContext('2d'),h=Math.min(200,160*f.sh/f.sw),w=h*f.sw/f.sh;
 ctx.drawImage(f.img,f.sx,f.sy,f.sw,f.sh,(180-w)/2,5,w,h);const url=c.toDataURL();appearancePortraits.set(key,url);return url;
}
function syncAppearanceEntry(){
 const ready=!!appearanceFrame(selectedClass,appearanceDraft[selectedClass]);
 $('enterBtn').disabled=cinematic.ready<12||!ready;
}
function renderAppearancePicker(){
 const cls=selectedClass,chosen=appearanceDraft[cls];
 $('appearancePicker').innerHTML='<div class="appearance-heading"><h3>Choose your character</h3><span>4 appearances · Same class abilities</span></div><div class="appearance-grid">'+characterPresets[cls].map((preset,i)=>{
  const src=portraitFor(cls,i),selected=i===chosen;
  return '<button class="appearance-card'+(selected?' selected':'')+'" data-appearance="'+i+'" aria-pressed="'+selected+'" '+(!src?'disabled':'')+'>'+(src?'<img src="'+src+'" alt="'+preset[0]+', '+preset[2]+'">':'<span class="appearance-loading">Loading…</span>')+'<b>'+preset[0]+'</b><span>'+preset[1]+'</span><small>'+(selected?'✓ Selected':preset[2])+'</small></button>';
 }).join('')+'</div><p class="appearance-note">Change your look at camp. Your level, gear and quests stay with you.</p>';
 $('appearancePicker').querySelectorAll('[data-appearance]').forEach(b=>b.onclick=()=>selectAppearance(Number(b.dataset.appearance)));
 syncAppearanceEntry();
}
function selectAppearance(index){if(!Number.isInteger(index)||index<0||index>3||!appearanceFrame(selectedClass,index))return;appearanceDraft[selectedClass]=index;renderAppearancePicker();updateClassPortraits();$('appearancePicker').querySelector('[data-appearance="'+index+'"]').focus?.();}
function updateClassPortraits(){Array.from($('classCards').children).forEach(card=>{const cls=card.dataset.cls,portrait=card.querySelector('.class-portrait'),src=portraitFor(cls,appearanceDraft[cls]);if(portrait&&src)portrait.src=src;});}
function loadAppearanceSheet(url,preset){const img=new Image();img.onload=()=>{try{const rows=sliceCharacterSheet(img);rows[1].forEach(f=>{f.unarmed=true;if(preset===2)f.heightScale=.88;});if(preset===0)unarmedWarriorFrames=rows[1];presetSheets[preset]=rows;appearancePortraits.clear();renderAppearancePicker();updateClassPortraits();}catch{assetStatus.textContent='A character appearance could not load. Reload to try again.';}};img.onerror=()=>{assetStatus.textContent='A character appearance could not load. Reload to try again.';};img.src=url;}
const appearanceAssetReady=assetReady;assetReady=function(){appearanceAssetReady();appearancePortraits.clear();renderAppearancePicker();updateClassPortraits();};
loadAppearanceSheet('characters-1.webp',1);loadAppearanceSheet('characters-2.webp',2);loadAppearanceSheet('characters-3.webp',3);loadAppearanceSheet('characters-original-unarmed.webp',0);
const chooseBeforeAppearance=chooseClass;chooseClass=function(id){chooseBeforeAppearance(id);renderAppearancePicker();};
const openBeforeAppearance=openClasses;openClasses=function(){appearanceDraft={...appearanceChoices};openBeforeAppearance();updateClassPortraits();};
const enterBeforeAppearance=enter;enter=function(){
 appearanceChoices={...appearanceDraft};enterBeforeAppearance();const pose=stateFor(p,true);pose.kind='idle';pose.action=0;pose.weaponAttack=null;
};$('enterBtn').onclick=()=>enter();
const saveBeforeAppearance=adventureData;adventureData=function(){const data=saveBeforeAppearance();data.appearance={...appearanceChoices};return data;};
const restoreBeforeAppearance=restoreAdventure;restoreAdventure=function(data){
 const next={mage:0,warrior:0,ranger:0,druid:0};
 if(data?.appearance!==undefined){if(!data.appearance||typeof data.appearance!=='object'||Array.isArray(data.appearance))throw Error('Invalid character appearance.');for(const cls of spriteOrder){const value=data.appearance[cls]??0;if(!Number.isInteger(value)||value<0||value>3)throw Error('Invalid character appearance.');next[cls]=value;}}
 const previous={...appearanceChoices},draft={...appearanceDraft};appearanceChoices={...next};appearanceDraft={...next};
 try{restoreBeforeAppearance(data);chooseClass(p.cls);updateClassPortraits();hud();}catch(error){appearanceChoices=previous;appearanceDraft=draft;throw error;}
};
renderAppearancePicker();
