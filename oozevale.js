'use strict';
/* Oozevale core (phase 1): slime colours, the slime companion (pet) and its stash, class names.
   Loaded after moonvale-art.js and before moonvale-creator.js. Painted art comes from art/ooze/ooze-art.js
   (written by tools/ooze_import.py); everything has a drawn fallback so the build never shows a hole.
   - MoonSlime: colour presets + a runtime recolour of the living-slime pixels (teal hue band) of a sheet.
     Armour, skin and cloth are untouched because only pixels in the slime hue band move.
   - MoonPet: per-class companion. Rules: fights only what you are fighting; if you are AFK and something
     hits you it defends you; when you run it stops fighting and follows; leashed to a few body-lengths with
     smooth catch-up (spring-damped steering, no snapping); auto-loots gear drops into its own stash. */
(()=>{
const OZ=globalThis.OOZE_ART||{};
const clamp01=v=>v<0?0:v>1?1:v;

/* ------------------------------------------------------------------ slime colours */
const PRESETS={
 teal:  {name:'Teal',     hex:'#3fe0c8',h:172,s:1.0,v:1.0},
 purple:{name:'Amethyst', hex:'#b483ff',h:276,s:1.0,v:1.08},
 orange:{name:'Ember',    hex:'#ff9a3c',h:27, s:1.12,v:1.12},
 gold:  {name:'Gold',     hex:'#ffd257',h:46, s:1.0,v:1.18},
 chrome:{name:'Chrome',   hex:'#dfe8f2',chrome:true}
};
const ORDER=['teal','purple','orange','gold','chrome'];
/* Per painted hero: the hue band of its living slime (h ± w, min saturation s, min value v) and the preset
   it was painted in (native = no change). Only pixels inside the band move, so plate, cloth, skin stay put. */
const SPEC={
 gelguard:    {h:172,w:36,s:.16,v:0,  native:'teal'},
 tidemane:    {h:172,w:36,s:.16,v:0,  native:'teal'},
 chromeknight:{h:280,w:30,s:.38,v:.42,native:'purple'},
 glowcap:     {h:160,w:28,s:.30,v:.34,native:'teal'},
 oozeseer:    {h:166,w:28,s:.30,v:.30,native:'teal'},
 gildedgloop: {h:32, w:22,s:.45,v:.5, native:'orange'},
 mossmother:  {h:150,w:28,s:.3, v:.34,native:'teal'},
 ambercap:    {h:32, w:22,s:.45,v:.5, native:'orange'},
 chromeveil:  {h:280,w:30,s:.38,v:.42,native:'purple'},
 lanternhood: {h:32, w:22,s:.45,v:.5, native:'orange'}
};
const cache=new Map(),wcache=new WeakMap();
function recolorCanvas(img,key,spec){
 const P=PRESETS[key];if(!P||!img||!spec||key===spec.native)return null;
 const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;if(!w||!h)return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);
 let id;try{id=x.getImageData(0,0,w,h);}catch(e){return null;}
 const d=id.data,BH=spec.h,BW=spec.w,MS=spec.s,MV=spec.v||0;
 for(let i=0;i<d.length;i+=4){
  if(d[i+3]<8)continue;
  const r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),ch=mx-mn;
  if(ch<.07||mx<MV)continue;
  let hh;if(mx===r)hh=((g-b)/ch)%6;else if(mx===g)hh=(b-r)/ch+2;else hh=(r-g)/ch+4;hh*=60;if(hh<0)hh+=360;
  const dh=((hh-BH+540)%360)-180,adh=Math.abs(dh);if(adh>BW)continue;
  const s=ch/mx;if(s<MS)continue;
  const wgt=clamp01((BW-adh)/12)*clamp01((s-MS)/.14)*(MV?clamp01((mx-MV)/.12):1);
  let H2,S2,V2;
  if(P.chrome){H2=208;S2=s*.12;V2=Math.min(1,.16+mx*1.12);}
  else{H2=(P.h+dh*.6+360)%360;S2=Math.min(1,s*P.s);V2=Math.min(1,mx*P.v);}
  const C=V2*S2,X=C*(1-Math.abs((H2/60)%2-1)),m=V2-C;let rr,gg,bb;
  if(H2<60){rr=C;gg=X;bb=0}else if(H2<120){rr=X;gg=C;bb=0}else if(H2<180){rr=0;gg=C;bb=X}else if(H2<240){rr=0;gg=X;bb=C}else if(H2<300){rr=X;gg=0;bb=C}else{rr=C;gg=0;bb=X}
  d[i]=Math.round((r+(rr+m-r)*wgt)*255);d[i+1]=Math.round((g+(gg+m-g)*wgt)*255);d[i+2]=Math.round((b+(bb+m-b)*wgt)*255);
 }
 x.putImageData(id,0,0);return c;
}
// pets are painted/drawn teal: they use the generic teal band
const PET_SPEC={h:172,w:36,s:.16,v:0,native:'teal'};
function recolor(img,key,tag,spec=PET_SPEC){
 if(!img||!key||!PRESETS[key]||key===spec.native)return img;
 if(img.complete===false||!(img.naturalWidth||img.width))return img;
 const kk=key+'|'+spec.h,tg=tag||img.src;let c;
 if(tg){const k=tg+'|'+kk;c=cache.get(k);if(c===undefined){c=recolorCanvas(img,key,spec);cache.set(k,c);}}
 else{let per=wcache.get(img);if(!per){per={};wcache.set(img,per);}c=per[kk];if(c===undefined)c=per[kk]=recolorCanvas(img,key,spec);}
 return c||img;
}
const nativeOf=k=>(SPEC[k]&&SPEC[k].native)||'teal';
const lookNow=()=>{const L=globalThis.MoonLooks;return L?L.current():null;};
const heroSlime=()=>{const h=typeof customHero!=='undefined'?customHero:null;return h&&PRESETS[h.slime]?h.slime:nativeOf(lookNow());};
const petColor=()=>{const h=typeof customHero!=='undefined'?customHero:null;if(h&&PRESETS[h.petColor])return h.petColor;const d=PETS_DEF_COLOR();return d||heroSlime();};
let PETS_DEF_COLOR=()=>null;
const MoonSlime={PRESETS,ORDER,SPEC,recolor,hex:k=>(PRESETS[k]||PRESETS.teal).hex,current:heroSlime,pet:petColor,nativeOf,
 // a sheet entry from art/anim (has .char/.img): recoloured copy for the chosen slime colour
 sheet(m,key){if(!m||!SPEC[m.char])return m&&m.img;return recolor(m.img,key||heroSlime(),m.src,SPEC[m.char]);},
 hasSlime:k=>!!SPEC[k],
 warm(key,ch){const sheets=(typeof MoonMotion!=='undefined'&&MoonMotion.anim&&MoonMotion.anim.sheets)||{};
  let q=[];for(const c of (ch?[ch]:Object.keys(SPEC)))for(const e of Object.values(sheets[c]||{}))q.push([e,c]);
  const step=()=>{const it=q.shift();if(!it)return;const [e,c]=it;if(e.ok)recolor(e.img,key,e.src,SPEC[c]);setTimeout(step,16);};step();}
};
globalThis.MoonSlime=MoonSlime;
if(typeof MoonMotion!=='undefined'){
 MoonMotion.tint=m=>{if(!m||!SPEC[m.char])return null;const k=heroSlime();return k===SPEC[m.char].native?null:recolor(m.img,k,m.src,SPEC[m.char]);};
 // static painted heroes (no frame sheets yet): same recolour on the still
 const fcache=new WeakMap();
 MoonMotion.tintFrame=(ch,f)=>{if(!f||!f.img||!SPEC[ch])return f;const k=heroSlime();if(k===SPEC[ch].native)return f;
  const img=recolor(f.img,k,null,SPEC[ch]);if(img===f.img)return f;
  const key=ch+'|'+k;let per=fcache.get(f);if(!per){per={};fcache.set(f,per);}return per[key]||(per[key]={...f,img});};
}

/* ------------------------------------------------------------------ hero looks (presets) */
// Three distinct painted outfits per playable class. A look is playable when its art is in the build:
// frame sheets (art/anim) or at least the painted still (art/manifest heroes). Missing ones show as
// "in the vats" and can't be picked.
const LOOKS={
 warrior:[
  {id:'chromeknight',name:'Chrome Ooze Knight',tag:'Silver & gold',lore:'Mirror-bright plate trimmed in gold, purple and orange ooze pumping through glass tubes. A slime orb rides in the open palm.'},
  {id:'tidemane',name:'Tidemane',tag:'Iron & teal',lore:'Dark iron run through with teal ooze, a hood of translucent teal jelly over an iron half-mask with glowing eyes, a jelly sword and one jelly shield slung high on the back.'},
  {id:'gildedgloop',name:'Gilded Gloop',tag:'Bronze & amber',lore:'Bronze and gold plate glowing with amber ooze, behind a shield of set honey-jelly.'}],
 druid:[
  {id:'glowcap',name:'Glowcap Witch',tag:'Lantern & cap',lore:'A purple mushroom hat speckled with glowing spots, a brass lantern staff brimming with slime and an arm of living teal jelly.'},
  {id:'mossmother',name:'Mossmother',tag:'Moss & caps',lore:'A teal-green mushroom hood over mossy robes; her staff is a slimy stalk crowned with glowing caps.'},
  {id:'ambercap',name:'Ambercap',tag:'Amber lantern',lore:'An orange glowing mushroom hat and a gold lantern staff full of amber ooze.'}],
 ranger:[
  {id:'oozeseer',name:'Hooded Oozeseer',tag:'Hood & orb',lore:'A shadowed purple hood, silver pauldrons and gauntlets, a robe dripping teal slime and a twisted staff crowned by a living slime orb.'},
  {id:'chromeveil',name:'Chrome Veil',tag:'Mask & void',lore:'A silver mask under a dark hood, and a staff holding a sphere of purple void-ooze.'},
  {id:'lanternhood',name:'Lanternhood',tag:'Teal & lantern',lore:'A deep teal hood and a staff hung with an orange lantern of ooze.'}]
};
const LOOK_BY={};for(const [cls,arr] of Object.entries(LOOKS))for(const l of arr){l.cls=cls;LOOK_BY[l.id]=l;}
const ART=()=>globalThis.MOONVALE_ART||{},ANIM=()=>globalThis.MOONVALE_ANIM||{};
const MoonLooks={
 LOOKS,get:id=>LOOK_BY[id]||null,
 // A look is selectable ONLY when its full drawn frame-by-frame set is imported: idle, walk (side),
 // walkfront, walkback, attack and cast. No painted still is ever offered as a rigid-motion stand-in.
 NEED:['idle','walk','walkfront','walkback','attack','cast'],
 animated:id=>{const c=ANIM().chars&&ANIM().chars[id];return !!c&&MoonLooks.NEED.every(a=>c[a]&&(c[a].n||c[a].frames||1)>1);},
 available(id){return !!(LOOK_BY[id]&&MoonLooks.animated(id));},
 list:cls=>LOOKS[cls]||[],
 first(cls){const l=(LOOKS[cls]||[]).find(x=>MoonLooks.available(x.id));return l?l.id:null;},
 // look for the class (saved choice if valid, else the first available)
 forClass(cls,want){if(want&&LOOK_BY[want]&&LOOK_BY[want].cls===cls&&MoonLooks.available(want))return want;return MoonLooks.first(cls);},
 current(){const h=typeof customHero!=='undefined'?customHero:null;const cls=typeof p!=='undefined'?p.cls:null;return cls?MoonLooks.forClass(cls,h&&h.look):null;},
 playable:cls=>!!MoonLooks.first(cls)
};
globalThis.MoonLooks=MoonLooks;

/* ------------------------------------------------------------------ class names */
try{
 const paintOf=()=>{const cs=globalThis.MoonCreator&&MoonCreator.state,dl=document.getElementById('classDialog');if(cs&&dl&&dl.open&&(cs.hero==='frostcaller'||cs.hero==='embermage'))return cs.hero;const h=typeof customHero!=='undefined'?customHero:null;return h&&h.paint==='frostcaller'?'frostcaller':(h&&h.paint==='embermage'?'embermage':(/dwarf/.test(h?.race||'')?'frostcaller':'embermage'));};
 const M=CLASSES.mage;
 Object.defineProperty(M,'name',{configurable:true,get:()=>paintOf()==='frostcaller'?'Rimegel':'Magmaweaver'});
 Object.defineProperty(M,'role',{configurable:true,get:()=>paintOf()==='frostcaller'?'Ranged · Frost gel & arcane':'Ranged · Molten ooze & arcane'});
 Object.defineProperty(M,'desc',{configurable:true,get:()=>paintOf()==='frostcaller'
  ?'Freeze a pack in frost gel, shatter it with Arcane Lance, then blink clear. Meteor rewards a well-timed setup.'
  :'Hurl bolts of molten ooze, lock foes in a burst of frost and drop a Meteor on the crowd. Blink keeps you out of the splash.'});
 Object.defineProperty(CLASSES.warrior,'color',{configurable:true,get:()=>MoonSlime.hex(heroSlime())});
 // Sporecaller (druid): same proven kit, grown into spores and glowcaps
 Object.assign(CLASSES.druid,{name:'Sporecaller',role:'Hybrid · Spores & renewal',desc:'Seed foes with glowing spores, snare a pack in slimy mycelium and mend through the fight. Sporefall turns a crowd into a drifting glow.'});
 CLASSES.druid.skills=[
  ['Spore Burst','☾',10,3,250,'moonfire',1.1,'Fling a puff of glowing spores: spore damage, then the spores smoulder on the foe for 6 seconds.'],
  ['Mycelium Snare','❧',20,8,260,'trap',.8,'Slimy mycelium bursts up around your target and roots every foe nearby for 3 seconds.'],
  ['Glowcap Mend','✚',25,12,0,'heal',0,'A glowcap blooms at your feet: restore 35% of maximum health, then regenerate for 6 seconds.'],
  ['Sporefall','✧',30,12,280,'rain',1.5,'Shake loose a cloud of shining spores over the target area for 4 seconds.'],
  ['Cap Shell','⬡',20,15,0,'guard',0,'Pull a rubbery mushroom shell around you: take 70% less damage and regenerate for 6 seconds.']];
 Object.defineProperty(CLASSES.druid,'color',{configurable:true,get:()=>MoonSlime.hex(heroSlime())});
 // Slimewright (ranger slot): a summoner. Its own kit: jellylings, commands, a familiar (see oozevale-kits.js)
 Object.assign(CLASSES.ranger,{name:'Slimewright',role:'Summoner · Living slime',glyph:'◉',hp:125,armor:2,range:260,desc:'Pull living slime out of your staff orb and command it. Jellylings swarm your target, Gloop Command makes every slime you own pounce, and your familiar never leaves your side.'});
 CLASSES.ranger.skills=[
  ['Acid Glob','◉',10,3,300,'poison',1.4,'Lob a glob of acidic jelly from your staff orb: it hits, then corrodes the foe for 7 seconds.'],
  ['Summon Jellies','✺',24,11,300,'summon',.5,'Pull jellylings from the orb (2, or 3 from level 10). No target needed: they orbit you until a fight starts, then swarm your target for 13 seconds.'],
  ['Gloop Command','⇶',16,7,300,'command',1.3,'Every slime you own pounces on your target, hits hard and glues it in place for 2 seconds. With no slimes out, the orb lashes it instead.'],
  ['Feeding Frenzy','◎',15,10,320,'mark',0,'Mark a foe for 10 seconds: it takes 50% more damage from you and from all of your slimes. If it dies marked, a free jellyling bursts out of it.'],
  ['Slime Slip','➶',12,6,0,'blink',0,'Melt into a puddle and slither in your movement direction, slipping past every attack.']];
 Object.defineProperty(CLASSES.ranger,'color',{configurable:true,get:()=>MoonSlime.hex(heroSlime())});
 if(typeof classIdentity!=='undefined'){
  Object.assign(classIdentity.ranger,{resource:'Ooze',signature:'Gelspike Lance',short:'Lance',glyph:'◉',role:'Summoner · Slime at your command',passive:'Long Reach',
   description:'Deal 20% more damage when your target is over 160 steps away. Ooze is earned by your slimes: +4 for every jellyling or familiar hit, +10 for every Acid Glob hit, +8 per second while you stand still. Moving never drains it.',
   signatureHelp:'Spend 60 Ooze to fire a lance of hardened jelly through every enemy in a 380-step line toward your target. Hits deal heavy damage and leave foes 30% more vulnerable for 4 seconds.',
   rotation:'Summon Jellies → Feeding Frenzy → Acid Glob → Gloop Command when they cluster → Gelspike Lance.'});
  Object.assign(classIdentity.druid,{resource:'Spores',signature:'Glowcap Grove',short:'Grove',passive:'Cycle of Spores',
   description:'Spore Burst, Mycelium Snare and Sporefall each grow 1 Spore, up to 3. Glowcap Mend consumes Spores to heal an extra 8% of maximum health per Spore and extend regeneration.',
   signatureHelp:'Spend 3 Spores to grow an 8-second glowcap grove where you stand. Each second it heals you for 4% maximum health inside its 125-step radius and damages and slows nearby enemies.',
   rotation:'Spore Burst → Mycelium Snare → choose between an empowered Glowcap Mend and Glowcap Grove.'});
  Object.assign(classIdentity.warrior,{resource:'Gel',signature:'Ooze Quake',short:'Quake',glyph:'◍',passive:'Living Armor',role:'Front-line bruiser · Gel & sustain',
   description:'Melee hits generate 8 Gel and taking health damage generates 15. Melee kills restore 6% of maximum health. At 60+ Gel your living armor hardens (+2 armor). Gel slowly seeps away out of combat.',
   signatureHelp:'Spend 60 Gel to quake the ground within 145 steps: heavy damage, a 1.5-second stun that interrupts casts, and an ooze shield worth 15% of your maximum health.',
   rotation:'Slime Surge in → Gelbreaker → Ooze Cyclone (spreads the goo) → spend Gel on Ooze Quake.'});
  CLASSES.warrior.desc='Wade in behind a wall of living ooze. Slime Surge closes the gap, Gelbreaker coats a foe in goo, Ooze Cyclone splashes the whole pack and Ooze Quake spends your Gel.';
 }
 // skill order + unlocks (design/classes.md, review M10): the combo partner sits in slot 3, unlocks at [1,1,2,4,6]
 {const W=CLASSES.warrior.skills,a=W.findIndex(s=>s[5]==='charge'),b=W.findIndex(s=>s[5]==='bash');if(a===3&&b===2){W[2]=W.splice(3,1,W[2])[0];}
  W.forEach(s=>{if(s[5]==='bash')s[7]='Slam your jelly shield into the target: interrupts it, stuns it for 1.5 seconds, then glues it in goo for 1.5 more.';if(s[5]==='sunder')s[7]='A heavy jelly-blade strike that coats the target in clinging ooze: it takes 30% extra damage for 6 seconds. +10 Gel.';if(s[5]==='spin')s[7]='Spin the jelly blade: splash every nearby foe, pull them in and slow them. Goo on one target spreads to every foe hit.';});}
 if(typeof skillUnlockLevels!=='undefined')skillUnlockLevels.splice(0,skillUnlockLevels.length,1,1,2,4,6);
 if(typeof originalSkills!=='undefined')for(const id of ['warrior','druid','ranger'])originalSkills[id]=CLASSES[id].skills.map(s=>[...s]);
 if(typeof syncTraining==='function')try{syncTraining();}catch(e){}
 if(typeof classGearNames!=='undefined'){
  classGearNames.ranger={weapon:'Orb-Knot Staff',helm:'Seeping Hood',chest:'Dripping Robe',gloves:'Gel-Lined Gauntlets',boots:'Puddle Boots'};
  classGearNames.druid={weapon:'Glowcap Staff',helm:'Spore Cap',chest:'Mossweave Robe',gloves:'Mycelium Wraps',boots:'Rootsoft Boots'};
  classGearNames.warrior={weapon:'Jelly Blade',helm:'Iron Gelhelm',chest:'Gel-Plate Cuirass',gloves:'Gooseal Gauntlets',boots:'Slimetread Greaves'};
 }
}catch(e){console.warn('oozevale classes',e);}

/* ------------------------------------------------------------------ pets */
const PETS={
 warrior:{id:'gelguard',species:'Bulwark Blob',defaultName:'Gloop',
  stages:{baby:'Blobling',grown:'Bulwark Blob',evolved:'Gel Golem'},
  lore:'A pocket-sized armored slime. It wobbles after you, guards your back and swallows loot for safekeeping.'},
 druid:{id:'sporecaller',species:'Capslime',defaultName:'Puffle',color:'teal',
  stages:{baby:'Sporeling',grown:'Capslime',evolved:'Elder Shroomgel'},
  lore:'A wobbly slime wearing a glowing mushroom cap. It puffs spores at your foes and tucks loot under its cap.'},
 ranger:{id:'slimewright',species:'Jelly Familiar',defaultName:'Glimmer',color:'purple',
  stages:{baby:'Gloomlet',grown:'Jelly Familiar',evolved:'Void Gelwyrm'},
  lore:'A purple jelly you pulled from the orb yourself. One big eye, two orbiting droplets, and it leads your jellylings into the fight.'}
};
PETS_DEF_COLOR=()=>{const d=PETS[typeof p!=='undefined'?p.cls:''];return d&&d.color||null;};
const STAGE_AT={grown:10,evolved:25};
const CAP={baby:12,grown:24,evolved:36};
const SIZE={baby:44,grown:58,evolved:92};          // world px (body width)
const stageOf=lv=>lv>=STAGE_AT.evolved?'evolved':lv>=STAGE_AT.grown?'grown':'baby';
const defFor=cls=>PETS[cls]||null;
const petName=()=>{const h=typeof customHero!=='undefined'?customHero:null;const d=defFor(typeof p!=='undefined'?p.cls:null);return (h&&typeof h.petName==='string'&&h.petName.trim())||(d?d.defaultName:'Pet');};
const pet={x:0,y:0,vx:0,vy:0,face:1,phase:0,mode:'follow',target:null,cd:0,lunge:0,stash:[],zone:-1,seen:false,lootT:null,full:0,pop:0,stage:'baby',say:null,sayT:0,hopY:0};
const rarityCol=()=>typeof rarityColors!=='undefined'?rarityColors:['#b9c8cc','#82d59b','#80bcff','#d3a0ff'];

// ---- drawn fallback (also used for portraits) ----
const hexRgb=h=>{const n=parseInt(h.slice(1),16);return [n>>16&255,n>>8&255,n&255];};
const mixc=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
const rgba=(c,a)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
function drawBlob(x,W,colorKey,stage,o={}){
 // bottom-centre at (0,0). o: squash (1=neutral), blink, items[], t, alpha
 const base=hexRgb(MoonSlime.hex(colorKey)),lite=mixc(base,[255,255,255],.45),dark=mixc(base,[4,12,22],.55),deep=mixc(base,[0,0,0],.75);
 const sq=o.squash||1,Wd=W*(1+(1-sq)*.6),H=W*.78*sq,t=o.t||0;
 x.save();
 const body=()=>{x.beginPath();x.moveTo(-Wd/2,0);x.bezierCurveTo(-Wd/2,-H*.58,-Wd*.3,-H,0,-H);x.bezierCurveTo(Wd*.3,-H,Wd/2,-H*.58,Wd/2,0);x.quadraticCurveTo(0,H*.12,-Wd/2,0);x.closePath();};
 // puddle
 x.fillStyle=rgba(base,.28);x.beginPath();x.ellipse(0,1,Wd*.62,W*.1,0,0,7);x.fill();
 body();const gr=x.createRadialGradient(-Wd*.16,-H*.62,W*.04,0,-H*.42,Wd*.72);
 gr.addColorStop(0,rgba(lite,.86));gr.addColorStop(.45,rgba(base,.74));gr.addColorStop(1,rgba(dark,.93));x.fillStyle=gr;x.fill();
 x.save();body();x.clip();
 // core + items floating inside the jelly
 x.fillStyle=rgba(deep,.22);x.beginPath();x.ellipse(Wd*.05,-H*.3,Wd*.3,H*.22,0,0,7);x.fill();
 const items=o.items||[];const RC=rarityCol();
 items.slice(-6).forEach((it,i)=>{const a=i*2.17+t*.6,px=Math.cos(a)*Wd*.22,py=-H*.3+Math.sin(a*1.3)*H*.13,s=W*.085;
  x.save();x.translate(px,py);x.rotate(Math.sin(t+i)*.4);x.fillStyle=RC[it.rarity]||'#ddd';x.globalAlpha=.85;
  x.beginPath();x.moveTo(0,-s);x.lineTo(s*.8,0);x.lineTo(0,s);x.lineTo(-s*.8,0);x.closePath();x.fill();x.fillStyle='rgba(255,255,255,.7)';x.fillRect(-s*.2,-s*.6,s*.25,s*.35);x.restore();});
 x.fillStyle=rgba(base,.26);x.fillRect(-Wd,-H*1.2,Wd*2,H*1.4);        // jelly film over the items
 // bubbles
 x.strokeStyle='rgba(255,255,255,.55)';x.lineWidth=Math.max(1,W*.02);
 for(let i=0;i<4;i++){const by=-H*((t*.35+i*.27)%1),bx=Math.sin(i*2.1+t)*Wd*.28;x.beginPath();x.arc(bx,by,W*(.025+.012*(i%2)),0,7);x.stroke();}
 x.restore();
 // rim + gloss
 body();x.strokeStyle=rgba(dark,.95);x.lineWidth=Math.max(1.2,W*.035);x.stroke();
 x.fillStyle='rgba(255,255,255,.62)';x.beginPath();x.ellipse(-Wd*.2,-H*.72,Wd*.1,H*.07,-.5,0,7);x.fill();
 x.beginPath();x.arc(-Wd*.07,-H*.83,W*.025,0,7);x.fill();
 const line=o.line||'gelguard';
 // face
 if(line==='slimewright'){const ey=-H*.5,R=W*.15,blink=o.blink?.15:1;
  x.fillStyle='#f4ecff';x.beginPath();x.ellipse(0,ey,R,R*blink,0,0,7);x.fill();x.strokeStyle=rgba(dark,.9);x.lineWidth=Math.max(1,W*.025);x.stroke();
  if(!o.blink){x.fillStyle='#1a0d2a';x.beginPath();x.arc(R*.18,ey+R*.08,R*.5,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(-R*.1,ey-R*.25,R*.2,0,7);x.fill();}
  // two droplets orbiting the familiar
  if(stage!=='none')for(let i=0;i<(stage==='evolved'?3:2);i++){const a=t*1.8+i*Math.PI*2/(stage==='evolved'?3:2),ox=Math.cos(a)*Wd*.62,oy=-H*.62+Math.sin(a)*H*.18,r=W*(.07+.02*(stage!=='baby'));
   x.globalAlpha=Math.sin(a)>0?.95:.6;const og=x.createRadialGradient(ox-r*.3,oy-r*.3,r*.1,ox,oy,r);og.addColorStop(0,rgba(lite,1));og.addColorStop(1,rgba(base,.7));x.fillStyle=og;x.beginPath();x.arc(ox,oy,r,0,7);x.fill();x.globalAlpha=1;}
  // inner core glow
  x.globalCompositeOperation='lighter';const cg=x.createRadialGradient(0,-H*.3,0,0,-H*.3,W*.22);cg.addColorStop(0,rgba(lite,.5));cg.addColorStop(1,rgba(base,0));x.fillStyle=cg;x.beginPath();x.arc(0,-H*.3,W*.22,0,7);x.fill();x.globalCompositeOperation='source-over';
  x.restore();return;}
 const ey=-H*.46,ex=Wd*.16,blink=o.blink?.15:1;
 x.fillStyle='#0b1218';for(const s of [-1,1]){x.beginPath();x.ellipse(s*ex,ey,W*.075,W*.1*blink,0,0,7);x.fill();}
 if(!o.blink){x.fillStyle='#fff';for(const s of [-1,1]){x.beginPath();x.arc(s*ex-W*.025,ey-W*.035,W*.03,0,7);x.fill();x.beginPath();x.arc(s*ex+W*.02,ey+W*.03,W*.014,0,7);x.fill();}}
 x.strokeStyle='#0b1218';x.lineWidth=Math.max(1,W*.025);x.beginPath();x.arc(0,ey+W*.08,W*.05,.25,Math.PI-.25);x.stroke();
 // dark-iron helmet with a bronze rim (Gelguard line); grown: cheek guards + slime crest; evolved: crown spikes
 const hy=-H*.74,hw=Wd*.36;
 if(stage!=='none'&&line==='sporecaller'){
  // glowing mushroom cap (purple, spotted); grown: wider cap + gills; evolved: a second little cap
  const cw=Wd*(stage==='baby'?.52:stage==='grown'?.62:.7),cy=-H*.8,chh=H*(stage==='baby'?.42:.5);
  const caps=stage==='evolved'?[[Wd*.28,-H*.55,.45],[0,0,1]]:[[0,0,1]];
  for(const [ox,oy,sc] of caps){x.save();x.translate(ox,oy);x.scale(sc,sc);
   x.fillStyle='#e9dcc4';x.beginPath();x.ellipse(0,cy+chh*.08,cw*.86,chh*.16,0,0,7);x.fill();
   x.beginPath();x.moveTo(-cw,cy+chh*.08);x.bezierCurveTo(-cw,cy-chh*1.1,cw,cy-chh*1.1,cw,cy+chh*.08);x.quadraticCurveTo(0,cy-chh*.12,-cw,cy+chh*.08);x.closePath();
   const cg=x.createLinearGradient(0,cy-chh,0,cy+chh*.1);cg.addColorStop(0,'#a36cf0');cg.addColorStop(1,'#4c2a86');x.fillStyle=cg;x.fill();x.strokeStyle='#2a1747';x.lineWidth=Math.max(1,W*.025);x.stroke();
   const sp=[[-.5,-.35,.13],[.1,-.62,.11],[.55,-.3,.12],[-.12,-.18,.08],[.32,-.05,.07]];
   for(const [sx,sy,sr] of sp){const gx=sx*cw,gy=cy+sy*chh,rr=W*sr*.7;const gg=x.createRadialGradient(gx,gy,0,gx,gy,rr*2.2);gg.addColorStop(0,'rgba(190,255,240,.95)');gg.addColorStop(.4,'rgba(120,240,215,.6)');gg.addColorStop(1,'rgba(120,240,215,0)');x.fillStyle=gg;x.beginPath();x.arc(gx,gy,rr*2.2,0,7);x.fill();}
   x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.ellipse(-cw*.35,cy-chh*.55,cw*.18,chh*.1,-.4,0,7);x.fill();x.restore();}
  // drifting spores
  x.fillStyle='rgba(200,255,170,.85)';for(let i=0;i<3;i++){const q=(t*.4+i*.33)%1;x.globalAlpha=1-q;x.beginPath();x.arc(Math.sin(i*2+t)*Wd*.5,-H*(1+q*.6),W*.025,0,7);x.fill();}x.globalAlpha=1;
 }
 else if(stage!=='none'){
  if(stage!=='baby'){x.fillStyle=rgba(lite,.85);x.beginPath();x.moveTo(-W*.05,hy-H*.28);x.quadraticCurveTo(W*.02,hy-H*.6,W*.14,hy-H*.52);x.quadraticCurveTo(W*.04,hy-H*.38,W*.05,hy-H*.26);x.fill();}
  x.beginPath();x.moveTo(-hw,hy+H*.05);x.bezierCurveTo(-hw,hy-H*.33,hw,hy-H*.33,hw,hy+H*.05);x.quadraticCurveTo(0,hy-H*.05,-hw,hy+H*.05);x.closePath();
  const hg=x.createLinearGradient(0,hy-H*.3,0,hy+H*.05);hg.addColorStop(0,'#59606d');hg.addColorStop(.5,'#2c313b');hg.addColorStop(1,'#15181e');x.fillStyle=hg;x.fill();
  x.strokeStyle='#a9824a';x.lineWidth=Math.max(1,W*.03);x.beginPath();x.moveTo(-hw,hy+H*.05);x.quadraticCurveTo(0,hy-H*.05,hw,hy+H*.05);x.stroke();
  x.fillStyle='#c7cfdb';for(const s of [-.55,0,.55]){x.beginPath();x.arc(s*hw,hy-H*.03+(s?H*.03:0),W*.016,0,7);x.fill();}
  if(stage==='evolved'){x.fillStyle='#2c313b';for(const s of [-1,1]){x.beginPath();x.moveTo(s*hw*.5,hy-H*.2);x.lineTo(s*hw*.75,hy-H*.48);x.lineTo(s*hw*.9,hy-H*.12);x.fill();}}
  // little shield on its side
  const sx=Wd*.43,sy=-H*.33,ss=W*.16;x.save();x.translate(sx,sy);
  x.beginPath();x.moveTo(-ss,-ss*1.1);x.lineTo(ss,-ss*1.1);x.lineTo(ss,ss*.2);x.quadraticCurveTo(0,ss*1.4,0,ss*1.4);x.quadraticCurveTo(0,ss*1.4,-ss,ss*.2);x.closePath();
  x.fillStyle='#232832';x.fill();x.strokeStyle='#a9824a';x.lineWidth=Math.max(1,W*.025);x.stroke();
  x.strokeStyle=rgba(lite,1);x.lineWidth=Math.max(1,W*.03);x.beginPath();x.moveTo(0,-ss*.7);x.lineTo(0,ss*.8);x.moveTo(-ss*.5,-ss*.2);x.lineTo(0,ss*.25);x.lineTo(ss*.5,-ss*.2);x.stroke();x.restore();
 }
 x.restore();
}
// ---- painted sprite (art/ooze) ----
const petImgs={};
function petArt(stage,line='gelguard'){const P=OZ.pets&&OZ.pets[line];const m=P&&(P[stage]||(stage==='evolved'?P.grown:null)||P.baby);if(!m)return null;
 let e=petImgs[m.src];if(!e){const i=new Image();e=petImgs[m.src]={m,img:i,ok:false};i.onload=()=>{e.ok=true;};i.src=m.src;}return e.ok?e:null;}
function drawPetSprite(x,W,colorKey,stage,o){
 const e=petArt(stage,o.line);if(!e)return false;const m=e.m;const img=recolor(e.img,colorKey,m.src);
 const n=m.frames||1,fi=n>1?(o.frame|0)%n:0,k=W/(m.bodyW||m.cellW);
 x.save();if(o.flip)x.scale(-1,1);const sq=o.squash||1;x.scale(1+(1-sq)*.5,sq);
 x.drawImage(img,fi*m.cellW,0,m.cellW,m.cellH,-m.anchorX*k,-m.baseY*k,m.cellW*k,m.cellH*k);
 // stash items glinting inside the jelly
 const items=o.items||[];if(items.length){const RC=rarityCol(),H=W*.7,t=o.t||0;
  items.slice(-5).forEach((it,i)=>{const a=i*2.17+t*.6,px=Math.cos(a)*W*.18,py=-H*.42+Math.sin(a*1.3)*H*.12,s=W*.07;
   x.save();x.translate(px,py);x.rotate(Math.sin(t+i)*.4);x.globalAlpha=.62;x.fillStyle=RC[it.rarity]||'#ddd';x.beginPath();x.moveTo(0,-s);x.lineTo(s*.8,0);x.lineTo(0,s);x.lineTo(-s*.8,0);x.closePath();x.fill();
   x.globalAlpha=.5;x.fillStyle='#fff';x.fillRect(-s*.2,-s*.6,s*.25,s*.3);x.restore();});
  x.globalCompositeOperation='lighter';x.globalAlpha=.18;x.fillStyle=MoonSlime.hex(colorKey);x.beginPath();x.ellipse(0,-H*.42,W*.3,H*.22,0,0,7);x.fill();}
 x.restore();return true;
}
function drawPet(x,W,colorKey,stage,o={}){if(!o.line){const d=defFor(typeof p!=='undefined'?p.cls:null);o.line=d?d.id:'gelguard';}if(!drawPetSprite(x,W,colorKey,stage,o)){x.save();if(o.flip)x.scale(-1,1);drawBlob(x,W,colorKey,stage,o);x.restore();}}
// creator / UI portrait
function portrait(canvas,colorKey,stage,opts={}){const x=canvas.getContext('2d');const w=canvas.width,h=canvas.height;x.clearRect(0,0,w,h);x.save();x.translate(w/2,h*.88);
 if(opts.dim)x.filter='saturate(.5) brightness(.6)';drawPet(x,w*(opts.scale||.62),colorKey,stage,{t:performance.now()/1000,items:opts.items,line:opts.line});x.restore();}

// ---- state helpers ----
function active(){return typeof started!=='undefined'&&started&&typeof p!=='undefined'&&!!defFor(p.cls)&&!(typeof customHero!=='undefined'&&customHero&&customHero.pet===false);}
function cap(){return CAP[stageOf(p.level)]+(p.level>=5?4:0);}   // lv5 bond: +4 (classes.md §4)
let lastInput=0,hurtAt=-99,playerHitAt=-99,petHitting=false,prevP=null,pv={x:0,y:0},lastStage=null,seenZone=null;
const now=()=>typeof time!=='undefined'?time:performance.now()/1000;
for(const ev of ['keydown','pointerdown','touchstart','wheel'])addEventListener(ev,()=>{lastInput=now();},{passive:true,capture:true});
function isAfk(){const sx=typeof stickX!=='undefined'?stickX:0,sy=typeof stickY!=='undefined'?stickY:0;if(sx||sy)lastInput=now();return now()-lastInput>6&&Math.hypot(pv.x,pv.y)<20;}
function place(){const f=(p.dir||1);pet.x=p.x-f*40;pet.y=p.y+12;pet.vx=pet.vy=0;pet.zone=story.zone;pet.mode='follow';pet.target=null;pet.pop=.45;}
const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const LEASH_FOLLOW=46,LEASH_FIGHT=150,LEASH_MAX=190;
function bubble(s){pet.say=s;pet.sayT=2.4;}

function tick(dt){
 if(!active()){pet.seen=false;return;}
 const t=now();
 // player velocity (smoothed)
 if(prevP&&dt>0){const vx=(p.x-prevP.x)/dt,vy=(p.y-prevP.y)/dt;if(Math.hypot(vx,vy)<1200){pv.x+=(vx-pv.x)*Math.min(1,dt*10);pv.y+=(vy-pv.y)*Math.min(1,dt*10);}}
 prevP={x:p.x,y:p.y};
 if(!pet.seen||pet.zone!==story.zone||d2(pet,p)>1800){place();pet.seen=true;pet.recall=false;}   // only zone changes / true teleports re-place the pet
 // commanded pounce (Slimewright Gloop Command): fly an arc to the target, hit, then resume
 if(pet.pounce){const q=pet.pounce;q.t+=dt;const u=Math.min(1,q.t/q.dur),e=q.target;const tx=e?e.x-Math.sign(e.x-q.x0||1)*14:q.x0,ty=e?e.y+2:q.y0;
  pet.x=q.x0+(tx-q.x0)*u;pet.y=q.y0+(ty-q.y0)*u;pet.hopY=-Math.sin(u*Math.PI)*46;pet.face=Math.sign(tx-q.x0)||pet.face;pet.vx=pet.vy=0;
  if(u>=1){pet.pounce=null;pet.hopY=0;pet.lunge=.28;if(e&&e.alive&&q.onHit)q.onHit(e);pet.mode='fight';pet.target=e&&e.alive?e:null;pet.cd=.6;}
  return;}
 const st=stageOf(p.level);if(lastStage&&st!==lastStage&&STAGE_AT[st]&&globalThis.MoonJuice&&MoonJuice.evolve){bubble('✦');MoonJuice.evolve(pet,st,petName(),PETS[p.cls].stages[st]);}
 else if(lastStage&&st!==lastStage){const nm=petName();bubble('✦');say(nm+' evolved into a '+PETS[p.cls].stages[st]+'!');if(typeof effect==='function')effect(pet.x,pet.y,70,MoonSlime.hex(petColor()),'ring',1.2);if(typeof burst==='function')burst(pet.x,pet.y-20,MoonSlime.hex(petColor()),30,120);}
 lastStage=st;pet.stage=st;
 const speedP=Math.hypot(pv.x,pv.y),moving=speedP>30;
 const tgt=(typeof target!=='undefined'&&target&&target.alive)?target:null;
 const safe=typeof CAMP!=='undefined'&&d2(p,CAMP)<125;
 const fighting=tgt&&!safe&&(t-playerHitAt<3.5);
 let away=false;if(tgt&&moving){const rx=p.x-tgt.x,ry=p.y-tgt.y,rl=Math.hypot(rx,ry)||1;away=(pv.x*rx+pv.y*ry)/(rl*speedP)>.35&&rl>70;if(rl>230)away=true;}
 const dp=d2(pet,p);
 // ---- decide ----
 if(pet.mode==='fight'||pet.mode==='defend'){
  const e=pet.target;let keep=e&&e.alive&&!safe&&dp<LEASH_MAX&&d2(e,p)<LEASH_FIGHT+40;
  if(pet.mode==='fight')keep=keep&&e===tgt&&fighting&&!away;
  else keep=keep&&(isAfk()||(e===tgt&&fighting&&!away));       // defend lasts while you are AFK (or you then fight it)
  if(!keep){if(pet.mode==='fight'&&away)bubble('!');pet.mode='follow';pet.target=null;}
 }
 if(pet.mode==='follow'||pet.mode==='loot'){
  if(pet.recall){}else if(fighting&&!away&&d2(tgt,p)<LEASH_FIGHT){pet.mode='fight';pet.target=tgt;}
  else if(isAfk()&&t-hurtAt<2.5&&!safe){const foe=(typeof mobs!=='undefined'?mobs:[]).filter(m=>m.alive&&m.aggro&&d2(m,p)<150).sort((a,b)=>d2(a,p)-d2(b,p))[0];if(foe){pet.mode='defend';pet.target=foe;bubble('!');}}
 }
 // ---- screen-edge leash: past ~the visible half-width the pet drops everything and runs back (boosted, no teleport)
 {const vw=(typeof view!=='undefined'&&view.w)?view.w:800,R=Math.max(150,vw*.5-24);pet.leashR=R;
  if(!pet.recall&&dp>R){pet.recall=true;pet.mode='follow';pet.target=null;pet.lootT=null;bubble('!');}
  if(pet.recall){pet.mode='follow';pet.target=null;if(dp<70)pet.recall=false;}}
 const calm=!fighting&&!(typeof mobs!=='undefined'&&mobs.some(m=>m.alive&&m.aggro&&d2(m,p)<200));
 if(pet.mode==='follow'&&!pet.recall&&calm&&typeof inventory!=='undefined'){   // loot vacuum (review M13): no stand-still, up to 220 away, as soon as the fight around you is over
  if(pet.stash.length<cap()){const drop=inventory.ground.filter(g=>g.zone===story.zone&&d2(g,p)<220&&d2(g,p)>24).sort((a,b)=>d2(a,pet)-d2(b,pet))[0];if(drop){pet.mode='loot';pet.lootT=drop;if(globalThis.MoonJuice)MoonJuice.lootSeen(drop);}}
  else if(pet.full<=0&&inventory.ground.some(g=>g.zone===story.zone&&d2(g,p)<150)){pet.full=12;bubble('full');say(petName()+'’s stash is full · open the pet stash to sort it');}
 }
 if(pet.mode==='loot'&&(!calm||!pet.lootT||!inventory.ground.includes(pet.lootT)||d2(pet.lootT,p)>260)){pet.mode='follow';pet.lootT=null;}
 pet.full=Math.max(0,pet.full-dt);
 // ---- steer (spring-damped arrive; never snaps) ----
 let gx,gy,stop=8;
 if((pet.mode==='fight'||pet.mode==='defend')&&pet.target){const e=pet.target,s=Math.sign(pet.x-e.x)||1;gx=e.x+s*26;gy=e.y+4;stop=4;}
 else if(pet.mode==='loot'&&pet.lootT){gx=pet.lootT.x;gy=pet.lootT.y;stop=3;}
 else{const f=moving?(Math.abs(pv.x)>8?Math.sign(pv.x):(pet.x<p.x?1:-1)):(pet.x<p.x?1:-1);gx=p.x-f*LEASH_FOLLOW;gy=p.y+14;
  if(moving){gx-=pv.x*.12;gy-=pv.y*.12;}stop=14;}
 // the goal itself is leashed to the player (fights never pull the pet far away)
 {const lx=gx-p.x,ly=gy-p.y,ll=Math.hypot(lx,ly),lim=pet.mode==='follow'?LEASH_FOLLOW+30:pet.mode==='loot'?250:LEASH_FIGHT;if(ll>lim){gx=p.x+lx/ll*lim;gy=p.y+ly/ll*lim;}}
 const dx=gx-pet.x,dy=gy-pet.y,dd=Math.hypot(dx,dy);
 const base=Math.max(170,speedP*1.12),boost=1+clamp01((dp-110)/110)*.75,vmax=pet.recall?Math.max(base*boost,speedP*1.7,360):base*boost;
 let want=dd<stop?0:Math.min(vmax,(dd-stop)*4.2);
 const wx=dd?dx/dd*want:0,wy=dd?dy/dd*want:0,acc=(pet.recall?2600:dp>LEASH_MAX?1700:1000)*dt;
 let ax=wx-pet.vx,ay=wy-pet.vy;const al=Math.hypot(ax,ay);if(al>acc){ax*=acc/al;ay*=acc/al;}
 pet.vx+=ax;pet.vy+=ay;pet.x+=pet.vx*dt;pet.y+=pet.vy*dt;
 const sp=Math.hypot(pet.vx,pet.vy);pet.phase+=sp*dt/40;if(Math.abs(pet.vx)>12)pet.face=Math.sign(pet.vx);
 // ---- act ----
 pet.cd=Math.max(0,pet.cd-dt);pet.lunge=Math.max(0,pet.lunge-dt);pet.pop=Math.max(0,pet.pop-dt);pet.sayT=Math.max(0,pet.sayT-dt);
 if((pet.mode==='fight'||pet.mode==='defend')&&pet.target&&d2(pet,pet.target)<40&&pet.cd<=0){
  const e=pet.target,lv=p.level,dmg=Math.round(3+lv*1.5+(pet.stage==='grown'?4:pet.stage==='evolved'?10:0));
  pet.cd=1.15;pet.lunge=.28;pet.face=Math.sign(e.x-pet.x)||pet.face;
  petHitting=true;globalThis.OZ_SRC='pet';try{damage(e,dmg,MoonSlime.hex(petColor()));}finally{petHitting=false;globalThis.OZ_SRC=null;}
  if(typeof burst==='function')burst(e.x,e.y-18,MoonSlime.hex(petColor()),10,90);
  if(typeof sfx==='function')try{sfx('jellyHit')}catch{}
 }
 if(pet.mode==='loot'&&pet.lootT&&d2(pet,pet.lootT)<18){
  const i=inventory.ground.indexOf(pet.lootT);if(i>=0){const it=inventory.ground.splice(i,1)[0].item;pet.stash.push(it);
   const nm=petName();if(typeof log==='function')log(nm+' swallowed '+it.name);say(nm+' swallowed '+it.name+' · Pet stash '+pet.stash.length+'/'+cap());
   if(globalThis.MoonJuice)MoonJuice.slurp(pet,rarityCol()[it.rarity]||'#fff');else if(typeof burst==='function')burst(pet.x,pet.y-16,rarityCol()[it.rarity]||'#fff',14,70);if(typeof sfx==='function')try{sfx('slurp')}catch{}}
  pet.mode='follow';pet.lootT=null;
 }
}
function drawWorld(){
 if(!active()||!pet.seen)return;const g2=typeof g!=='undefined'?g:null;if(!g2)return;
 const t=now(),sp=Math.hypot(pet.vx,pet.vy),mv=clamp01(sp/80),W=SIZE[pet.stage];
 const hop=Math.abs(Math.sin(pet.phase*Math.PI)),y=-hop*W*.24*mv+(pet.hopY||0),contact=Math.pow(1-hop,4)*mv;
 let sq=1-.14*contact+.06*hop*mv+(1-mv)*.025*Math.sin(t*3);if(pet.pop>0)sq*=1+.4*Math.sin((1-pet.pop/.45)*Math.PI);
 const lx=pet.lunge>0?Math.sin((1-pet.lunge/.28)*Math.PI)*12*pet.face:0;
 g2.save();g2.translate(pet.x,pet.y);
 // shadow
 g2.save();g2.globalAlpha=.42*(1-hop*.4*mv);g2.fillStyle='#040a12';g2.beginPath();g2.ellipse(0,2,W*.42,W*.12,0,0,7);g2.fill();g2.restore();
 // soft glow (the pet is a light source too)
 g2.save();g2.globalCompositeOperation='lighter';const gl=g2.createRadialGradient(0,-W*.3,0,0,-W*.3,W*.9);const c=hexRgb(MoonSlime.hex(petColor()));gl.addColorStop(0,rgba(c,.16));gl.addColorStop(1,rgba(c,0));g2.fillStyle=gl;g2.beginPath();g2.arc(0,-W*.3,W*.9,0,7);g2.fill();g2.restore();
 g2.translate(lx,y);
 const art=petArt(pet.stage,(defFor(p.cls)||{}).id);const frame=art&&art.m.frames>1?(mv>.15?Math.floor(pet.phase*art.m.frames)%art.m.frames:0):0;
 drawPet(g2,W,petColor(),pet.stage,{squash:sq,flip:pet.face<0,t,items:pet.stash,frame,blink:(t%4.2)<.12});
 g2.restore();
 if(pet.sayT>0&&pet.say){const a=Math.min(1,pet.sayT*2);g2.save();g2.globalAlpha=a;const bx=pet.x,by=pet.y-W*.95-8;g2.fillStyle='rgba(10,14,22,.85)';g2.strokeStyle=MoonSlime.hex(petColor());g2.lineWidth=1.2;
  const tw=pet.say.length>1?34:18;g2.beginPath();g2.roundRect?g2.roundRect(bx-tw/2,by-12,tw,18,8):g2.rect(bx-tw/2,by-12,tw,18);g2.fill();g2.stroke();
  g2.fillStyle='#f2fbff';g2.font='700 11px "MV Fira",system-ui,sans-serif';g2.textAlign='center';g2.textBaseline='middle';g2.fillText(pet.say,bx,by-3);g2.restore();}
}

// ---- hooks into the game ----
{const before=damage;damage=function(m,n,c){if(!petHitting&&m&&m.alive)playerHitAt=now();
 const was=m&&m.alive;before(m,n,c);
 // Gelguard: every hit splashes living ooze (melee + skills)
 if(was&&!petHitting&&typeof p!=='undefined'&&p.cls==='warrior'&&typeof burst==='function'){const hx=MoonSlime.hex(heroSlime());burst(m.x,m.y-24,hx,12,130);burst(m.x,m.y-24,'#f4fffd',3,60);}};}
{const before=hurt;hurt=function(n){const hp=p.hp;before(n);if(p.hp!==hp)hurtAt=now();};}
{const before=update;update=function(dt){before(dt);try{if(!(typeof isPaused==='function'&&isPaused()))tick(dt);}catch(e){console.warn('pet',e);}};}
{const before=actor;actor=function(o,hero,ghost){
  if(hero&&(ghost===undefined||ghost===1)&&active()&&pet.seen){if(pet.y<o.y){drawWorld();before(o,hero,ghost);}else{before(o,hero,ghost);drawWorld();}return;}
  return before(o,hero,ghost);};}
// save / load: stash rides in the adventure save; name + colours ride in customHero
{const before=adventureData;adventureData=function(){const d=before();d.ooze={v:1,stash:pet.stash.map(x=>({...x,stats:{...x.stats}}))};return d;};}
{const before=restoreAdventure;restoreAdventure=function(data){before(data);let st=[];
 try{const s=data&&data.ooze&&Array.isArray(data.ooze.stash)?data.ooze.stash.slice(0,36):[];if(s.length&&typeof validateGearSave==='function')st=validateGearSave({gear:{items:s,equipped:{},nextId:1,kills:0,buyback:[]}}).items;}catch(e){console.warn('pet stash ignored:',e.message);st=[];}
 const used=new Set([...inventory.items,...inventory.buyback].map(x=>x.id));
 for(const it of st){if(used.has(it.id))it.id='item-'+inventory.nextId++;used.add(it.id);const n=+String(it.id).slice(5);if(n>=inventory.nextId)inventory.nextId=n+1;}
 pet.stash=st;pet.seen=false;lastStage=null;};}
{const before=enter;enter=function(){const wasStarted=typeof started!=='undefined'&&started;before.apply(this,arguments);if(!wasStarted&&started){pet.seen=false;lastStage=null;}};}

/* ------------------------------------------------------------------ pet stash dialog */
const D=document.createElement('dialog');D.id='ozStash';D.className='mv-panel oz-stash';
D.innerHTML='<button class="close mv-x" type="button" aria-label="Close pet stash">×</button>'+
 '<div class="oz-head"><canvas width="160" height="160" aria-hidden="true"></canvas><div><small class="mv-kicker" id="ozStage"></small><h2 id="ozName"></h2><p class="oz-sub" id="ozSub"></p>'+
 '<div class="oz-cap"><i id="ozCapBar"></i></div><p class="oz-capt" id="ozCapT"></p></div></div>'+
 '<p class="oz-help" id="ozHelp"></p><div class="oz-bulk"><button type="button" class="mv-btn" id="ozAllBag">Take all</button><button type="button" class="mv-btn" id="ozSellCommon">Sell commons</button></div>'+
 '<div class="oz-list" id="ozList"></div>';
document.body.appendChild(D);
const q=s=>D.querySelector(s);
q('.mv-x').onclick=()=>D.close();D.addEventListener('click',e=>{if(e.target===D)D.close();});
const atCamp=()=>typeof CAMP!=='undefined'&&d2(p,CAMP)<140;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let raf2=0;
function renderStash(){
 const def=defFor(p.cls);if(!def)return;const st=stageOf(p.level),c=cap(),RC=rarityCol(),RN=typeof rarityNames!=='undefined'?rarityNames:['Common','Uncommon','Rare','Epic'],SN=typeof slotNames!=='undefined'?slotNames:{};
 q('#ozStage').textContent=def.stages[st]+' · Level '+p.level;q('#ozName').textContent=petName();
 const next=st==='baby'?'Evolves into a '+def.stages.grown+' at level '+STAGE_AT.grown:st==='grown'?'Evolves into a '+def.stages.evolved+' at level '+STAGE_AT.evolved:'Fully evolved';
 q('#ozSub').textContent=next;q('#ozCapBar').style.width=Math.min(100,pet.stash.length/c*100)+'%';q('#ozCapT').textContent='Stash '+pet.stash.length+' / '+c+' · grows as it evolves';
 const camp=atCamp(),bagFull=()=>typeof bagItems==='function'&&bagItems().length>=48;
 q('#ozHelp').textContent=pet.stash.length?(camp?'You are at camp: sell what you don’t need, keep the rest.':'Keep items by moving them to your bag. Selling works at camp.'):petName()+' swallows gear drops near you when you stand still out of combat.';
 q('#ozAllBag').disabled=!pet.stash.length||bagFull();q('#ozSellCommon').disabled=!camp||!pet.stash.some(x=>x.rarity===0);
 q('#ozList').innerHTML=pet.stash.map((it,i)=>`<article class="oz-item" style="--rc:${RC[it.rarity]}"><b>${esc(it.name)}${it.upgrade?' +'+it.upgrade:''}</b><small>${RN[it.rarity]} · ${esc(SN[it.slot]||it.slot)} · Item level ${it.level}</small>`+
  `<div class="oz-acts"><button type="button" class="mv-btn" data-keep="${i}" ${bagFull()?'disabled':''}>To bag</button><button type="button" class="mv-btn" data-sell="${i}" ${camp?'':'disabled'}>Sell · ${it.value}g</button></div></article>`).join('')||'<p class="oz-empty">Nothing inside yet. Its jelly is clear as a moonlit pond.</p>';
 D.querySelectorAll('[data-keep]').forEach(b=>b.onclick=()=>keep(+b.dataset.keep));D.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>sell(+b.dataset.sell));
}
function keep(i){const it=pet.stash[i];if(!it)return;if(typeof bagItems==='function'&&bagItems().length>=48)return say('Your bag is full');
 if(inventory.items.some(x=>x.id===it.id))it.id='item-'+inventory.nextId++;inventory.items.push(it);pet.stash.splice(i,1);renderStash();try{hud()}catch{}}
function sell(i){if(!atCamp())return say('Visit the quartermaster at camp to sell');const it=pet.stash.splice(i,1)[0];if(!it)return;p.gold+=it.value;inventory.buyback.unshift(it);inventory.buyback.length=Math.min(inventory.buyback.length,10);if(typeof sfx==='function')try{sfx('loot')}catch{}renderStash();try{hud()}catch{}}
q('#ozAllBag').onclick=()=>{while(pet.stash.length&&!(typeof bagItems==='function'&&bagItems().length>=48))keep(0);renderStash();};
q('#ozSellCommon').onclick=()=>{for(let i=pet.stash.length-1;i>=0;i--)if(pet.stash[i].rarity===0)sell(i);};
function open(){if(!defFor(p.cls))return say('Your companion hatches with your hero’s slime update');if(typeof keysClear==='function')keysClear();renderStash();if(!D.open)D.showModal();
 const cv=q('canvas');const loop=()=>{if(!D.open){raf2=0;return;}portrait(cv,petColor(),stageOf(p.level),{items:pet.stash,scale:.6});raf2=requestAnimationFrame(loop);};if(!raf2)raf2=requestAnimationFrame(loop);}
if(typeof isPaused==='function'){const before=isPaused;isPaused=()=>before()||D.open;}
// entry points: More sheet, adventure menu, Bag, Hero sheet
function install(){
 const more=document.getElementById('mvMore');if(more&&!document.getElementById('ozMoreBtn')){const b=document.createElement('button');b.id='ozMoreBtn';b.innerHTML='<span>Pet stash</span><kbd>P</kbd>';b.onclick=()=>{document.body.classList.remove('mv-more-open');open();};more.insertBefore(b,more.firstChild);}
 const grid=document.querySelector('#menuDialog .menu-grid');if(grid&&!document.getElementById('menuPet')){const b=document.createElement('button');b.id='menuPet';b.innerHTML='Pet stash<small>Your slime’s swallowed loot</small>';b.onclick=()=>{document.getElementById('menuDialog')?.close();open();};grid.insertBefore(b,grid.children[3]||null);}
 const hs=document.querySelector('#mvHero .mvh-actions');if(hs&&!document.getElementById('mvhPet')){const b=document.createElement('button');b.type='button';b.className='mv-btn';b.id='mvhPet';b.textContent='Pet stash';b.onclick=()=>{document.getElementById('mvHero')?.close();open();};hs.appendChild(b);}
 const show=active();for(const id of ['ozMoreBtn','menuPet','mvhPet']){const e=document.getElementById(id);if(e)e.hidden=!show;}
}
if(typeof openInventory==='function'){const before=openInventory;openInventory=function(){before.apply(this,arguments);try{const dlg=typeof progressionDialog!=='undefined'?progressionDialog:null;if(dlg&&active()&&!dlg.querySelector('.oz-bagpet')){const h=dlg.querySelector('h3');if(h){const b=document.createElement('button');b.type='button';b.className='mv-btn oz-bagpet';b.textContent='Pet stash · '+pet.stash.length+' / '+cap();b.onclick=()=>{dlg.close();open();};h.parentNode.insertBefore(b,h);}}}catch(e){}};}
addEventListener('keydown',e=>{if(e.key&&e.key.toLowerCase()==='p'&&!e.repeat&&!(e.target&&/input|textarea/i.test(e.target.tagName))&&active()&&!document.querySelector('dialog[open]:not(#ozStash)')){if(D.open)D.close();else open();}});
setInterval(install,1000);addEventListener('load',install);

globalThis.MoonPet={state:pet,defs:PETS,stageOf,cap,open,close:()=>D.close(),portrait,draw:drawPet,drawBlob,name:petName,active,STAGE_AT,color:()=>petColor(),
 hit(e,n,c,src){petHitting=true;const s0=globalThis.OZ_SRC;globalThis.OZ_SRC=src||s0||'pet';try{damage(e,n,c);}finally{petHitting=false;globalThis.OZ_SRC=s0||null;}},
 pounce(target,onHit){if(!active()||!pet.seen||!target)return false;pet.pounce={t:0,dur:.38,x0:pet.x,y0:pet.y,target,onHit};return true;},
 rules:{LEASH_FOLLOW,LEASH_FIGHT,LEASH_MAX},debug:()=>({mode:pet.mode,x:+pet.x.toFixed(1),y:+pet.y.toFixed(1),d:+d2(pet,p).toFixed(1),stash:pet.stash.length,stage:pet.stage,afk:isAfk(),target:pet.target?pet.target.name||pet.target.type:null})};
})();
