'use strict';
/* Oozevale talent trees: 2 trees per class. 1 point per level from level 5 (level 34 = 30 points: one full tree).
   Mix freely; respec for free at a camp fire. Key nodes (5 / 15 points in a tree) and the capstone (25) RENAME a spell and
   change its colour, shape and behaviour. 10 / 20 / 30 points in one tree unlock that tree's skins (overlay/recolour of the
   current look for now: see REQUESTS-talent-skins.md). Saved in the adventure (d.talents) and customHero.talentSkin. */
(()=>{
if(typeof CLASSES==='undefined'||typeof p==='undefined')return;
const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),now=()=>typeof time!=='undefined'?time:performance.now()/1000;
const stat=(id,name,max,req,desc,fx)=>({id,name,max,req,desc,fx});
const key=(id,name,req,skill,rename,desc,flag)=>({id,name,max:1,req,desc,key:true,skill,rename,flag});
/* ---------- trees ---------- */
const TREES={
 warrior:[
  {id:'bulwark',name:'Bulwark',color:'#7fd8ff',theme:'Taunt, shield walls, slime armor',skins:['Bulwark Steel','Aegis Gel','Bastion Prime'],filter:['saturate(.55) hue-rotate(-20deg) brightness(1.08)','hue-rotate(150deg) saturate(1.3)','hue-rotate(190deg) saturate(1.6) brightness(1.15)'],glow:['#bfe9ff','#6ff2ff','#c9f4ff'],nodes:[
   stat('thick','Thick Gel',5,0,'+3% max health per rank.',{hp:.03}),stat('hide','Ironhide',5,0,'+1 armor per rank.',{armor:1}),
   key('wall','Shield Wall',5,4,'Shield Wall','Gel Bulwark becomes Shield Wall: a curved wall of slime panels, a shield worth 20% of your health, and every foe within 220 is taunted onto you.','wall'),
   stat('mast','Bulwark Mastery',5,10,'Gel Bulwark / Shield Wall recharges 6% faster per rank.',{cdr:[4,.06]}),stat('retal','Retaliation',5,10,'Reflect 3% of every hit you take per rank.',{reflect:.03}),
   key('slam','Taunting Slam',15,3,'Taunting Slam','Jelly Bash becomes Taunting Slam: a ground-shaking slam that stuns and taunts everything within 120, and you gain a shield for each foe hit.','slam'),
   stat('stal','Stalwart',5,20,'+2% max health and +1 armor per rank.',{hp:.02,armor:1}),
   key('armor','Slime Armor',25,-1,null,'Capstone: living slime plates cover you. −15% damage taken, +6 armor, and a teal plate aura.','armor'),stat('echo','Ward Echo',2,25,'+10% more shield from your walls per rank.',{wallx:.1})]},
  {id:'ravager',name:'Ravager',color:'#ff6a3d',theme:'Two-handed ooze cleaves, leaps',skins:['Ravager Rust','Bloodgel','Warlord Magma'],filter:['hue-rotate(-60deg) saturate(1.2)','hue-rotate(-110deg) saturate(1.5) brightness(.95)','hue-rotate(-140deg) saturate(1.9) brightness(1.1)'],glow:['#ff9a6a','#ff4040','#ffb347'],nodes:[
   stat('heavy','Heavy Gel',5,0,'+3% power per rank.',{power:.03}),stat('brut','Brutality',5,0,'+2% power and +1% lifesteal per rank.',{power:.02,ls:.01}),
   key('cleave','Ravaging Cleave',5,1,'Ravaging Cleave','Ooze Cyclone becomes Ravaging Cleave: a huge orange crescent that cleaves everything in front of you for 160% power.','cleave'),
   stat('rend','Rending',5,10,'Gelbreaker recharges 6% faster per rank.',{cdr:[0,.06]}),stat('mom','Momentum',5,10,'Slime Surge / Ooze Leap recharges 6% faster per rank.',{cdr:[2,.06]}),
   key('leap','Ooze Leap',15,2,'Ooze Leap','Slime Surge becomes Ooze Leap: you land in a crater slam that hits everything within 120 for 200% power.','leap'),
   stat('sav','Savagery',5,20,'+2% power per rank.',{power:.02}),
   key('frenzy','Bloodgel Frenzy',25,-1,null,'Capstone: below half health you attack 35% faster, and all damage heals you for 6%.','frenzy'),stat('life','Lifegel',2,25,'+2% lifesteal per rank.',{ls:.02})]}],
 druid:[
  {id:'bloom',name:'Bloomwarden',color:'#a8ff7a',theme:'Heals, mushroom groves',skins:['Bloom Petal','Grovekeeper','Evergreen Crown'],filter:['hue-rotate(40deg) saturate(1.2) brightness(1.08)','hue-rotate(70deg) saturate(1.5)','hue-rotate(20deg) saturate(1.8) brightness(1.18)'],glow:['#d8ff9a','#8fff8a','#ffe58a'],nodes:[
   stat('root','Deep Roots',5,0,'+3% max health per rank.',{hp:.03}),stat('dew','Moondew',5,0,'Glowcap Mend recharges 6% faster per rank.',{cdr:[2,.06]}),
   key('grove','Bloom Grove',5,2,'Bloom Grove','Glowcap Mend becomes Bloom Grove: a ring of glowing mushrooms sprouts around you for 8 s and heals 3% health per second inside it.','grove'),
   stat('lush','Lushness',5,10,'+2% max health and +1 armor per rank.',{hp:.02,armor:1}),stat('pollen','Pollen Ward',5,10,'Cap Shell recharges 6% faster per rank.',{cdr:[4,.06]}),
   key('sguard','Sporeguard Bloom',15,4,'Sporeguard Bloom','Cap Shell becomes Sporeguard Bloom: a petal shield worth 12% of your health and a small grove at your feet.','sguard'),
   stat('sap','Living Sap',5,20,'+3% max health per rank.',{hp:.03}),
   key('ever','Evergrove',25,-1,null,'Capstone: every 6 s in combat a healing petal pulse restores 6% health.','ever'),stat('bloomx','Overgrowth',2,25,'Groves last 2 s longer per rank.',{grovex:2})]},
  {id:'rot',name:'Rotcaller',color:'#b45cff',theme:'Spore DoTs, fungal zombies',skins:['Rot Moth','Plaguecap','Fungal Lich'],filter:['hue-rotate(80deg) saturate(.9) brightness(.92)','hue-rotate(120deg) saturate(1.4) brightness(.9)','hue-rotate(160deg) saturate(1.8) brightness(1.05)'],glow:['#c7a0ff','#9be04a','#d07dff'],nodes:[
   stat('blight','Blight',5,0,'+3% power per rank.',{power:.03}),stat('decay','Decay',5,0,'Spore Burst / Rot Spores recharges 6% faster per rank.',{cdr:[0,.06]}),
   key('rotsp','Rot Spores',5,0,'Rot Spores','Spore Burst becomes Rot Spores: a violet rot cloud that poisons the target for 8 s and spreads to every foe within 90.','rotsp'),
   stat('mold','Black Mold',5,10,'+2% power per rank.',{power:.02}),stat('fall','Rotfall',5,10,'Sporefall recharges 6% faster per rank.',{cdr:[3,.06]}),
   key('zomb','Fungal Rising',15,3,'Fungal Rising','Sporefall becomes Fungal Rising: two fungal zombies claw out of the ground and fight for you for 14 s.','zomb'),
   stat('host','Host Mind',5,20,'+3% power per rank.',{power:.03}),
   key('plague','Plaguebearer',25,-1,null,'Capstone: poisoned foes burst into a spore cloud when they die, hitting everything nearby for 120% power.','plague'),stat('horde','Horde',2,25,'One more zombie per rank.',{zombx:1})]}],
 ranger:[
  {id:'brood',name:'Broodmother',color:'#c77dff',theme:'Swarms of jellies',skins:['Brood Silk','Hive Violet','Queen of Jelly'],filter:['hue-rotate(20deg) saturate(1.2)','hue-rotate(40deg) saturate(1.6) brightness(1.05)','hue-rotate(-30deg) saturate(1.9) brightness(1.15)'],glow:['#d9a8ff','#c77dff','#ff9adf'],nodes:[
   stat('spawn','Spawning Pools',5,0,'Summon Jellies / Brood Swarm recharges 6% faster per rank.',{cdr:[1,.06]}),stat('vit','Vital Gel',5,0,'+3% max health per rank.',{hp:.03}),
   key('swarm','Brood Swarm',5,1,'Brood Swarm','Summon Jellies becomes Brood Swarm: two extra jellylings spill out in a violet spray.','swarm'),
   stat('acid','Acid Brood',5,10,'+3% power per rank.',{power:.03}),stat('cmd','Hive Voice',5,10,'Gloop Command recharges 6% faster per rank.',{cdr:[2,.06]}),
   key('frenzyS','Frenzy Swarm',15,2,'Frenzy Swarm','Gloop Command becomes Frenzy Swarm: every jellyling is refreshed to full life and a new one is born with each command.','frenzyS'),
   stat('mother','Motherglow',5,20,'+2% power and +2% health per rank.',{power:.02,hp:.02}),
   key('hive','Hivemother',25,-1,null,'Capstone: your jellylings hit 35% harder.','hive'),stat('nest','Nest',2,25,'+2% power per rank.',{power:.02})]},
  {id:'golem',name:'Golemsmith',color:'#ffb347',theme:'One giant ooze golem',skins:['Forge Amber','Golemheart','Titan Smith'],filter:['hue-rotate(-150deg) saturate(1.1) brightness(1.05)','hue-rotate(-170deg) saturate(1.5) brightness(1.1)','hue-rotate(160deg) saturate(1.8) brightness(1.18)'],glow:['#ffcf7a','#ffb347','#ffe08b'],nodes:[
   stat('forge','Forgework',5,0,'+3% power per rank.',{power:.03}),stat('anvil','Anvil Hide',5,0,'+1 armor per rank.',{armor:1}),
   key('forgeG','Forge Golem',5,1,'Forge Golem','Summon Jellies becomes Forge Golem: instead of a swarm, ONE giant amber ooze golem rises and fights beside you for 25 s.','forgeG'),
   stat('core','Molten Core',5,10,'Your golem has +8% health and damage per rank.',{golemx:.08}),stat('cmdG','Foreman',5,10,'Gloop Command / Golem Smash recharges 6% faster per rank.',{cdr:[2,.06]}),
   key('smash','Golem Smash',15,2,'Golem Smash','Gloop Command becomes Golem Smash: your golem leaps onto the target and smashes everything within 110 for 220% power.','smash'),
   stat('temper','Tempered',5,20,'+3% max health per rank.',{hp:.03}),
   key('titan','Titan Gel',25,-1,null,'Capstone: your golem grows 40% larger, hits 40% harder and lasts until it falls.','titan'),stat('rivet','Rivets',2,25,'Golem +10% health per rank.',{golemx:.1})]}],
 mage:[
  {id:'mirror',name:'Mirrorwall',color:'#eef6ff',theme:'Reflect tank',skins:['Silvered Pearl','Mirrorplate','Perfect Prism'],filter:['saturate(.4) brightness(1.15)','saturate(.2) brightness(1.25) contrast(1.1)','hue-rotate(200deg) saturate(1.3) brightness(1.25)'],glow:['#ffffff','#e8f4ff','#bff6ff'],nodes:[
   stat('pearl','Pearl Skin',5,0,'+3% max health per rank.',{hp:.03}),stat('silver','Silvering',5,0,'+1 armor per rank.',{armor:1}),
   key('mwall','Mirrorwall',5,3,'Mirrorwall','Mirror Gel becomes Mirrorwall: lasts 6 s and is ringed by spinning chrome facets.','mwall'),
   stat('glint','Glint',5,10,'Mirror Gel / Mirrorwall recharges 6% faster per rank.',{cdr:[3,.06]}),stat('film','Thick Film',5,10,'Bubble Ward recharges 6% faster per rank.',{cdr:[1,.06]}),
   key('bastion','Prism Bastion',15,1,'Prism Bastion','Bubble Ward becomes Prism Bastion: a 60% stronger bubble that taunts nearby foes and reflects part of every absorbed hit.','bastion'),
   stat('lustre','Lustre',5,20,'+2% health and +1 armor per rank.',{hp:.02,armor:1}),
   key('perfect','Perfect Reflection',25,-1,null,'Capstone: every mirror shard ricochets into a second foe for 60%.','perfect'),stat('facet','Facets',2,25,'+3% power per rank.',{power:.03})]},
  {id:'alch',name:'Alchemist',color:'#ff9a3a',theme:'Thrown brews, AoE flasks',skins:['Copper Still','Gilded Alembic','Grand Alchemist'],filter:['hue-rotate(-170deg) saturate(1.2)','hue-rotate(-150deg) saturate(1.7) brightness(1.1)','hue-rotate(-120deg) saturate(2) brightness(1.2)'],glow:['#ffb36f','#ffd257','#ff8a3a'],nodes:[
   stat('catal','Catalyst',5,0,'+3% power per rank.',{power:.03}),stat('cork','Quick Cork',5,0,'Gulp Brew / Hurl Flask recharges 6% faster per rank.',{cdr:[2,.06]}),
   key('flask','Hurl Flask',5,2,'Hurl Flask','Gulp Brew becomes Hurl Flask: the elixir is lobbed at your target and bursts in a coloured splash for 180% power (you still get its effect).','flask'),
   stat('react','Reagents',5,10,'+2% power per rank.',{power:.02}),stat('bounce','Volatility',5,10,'Bounce Bolt / Volatile Vial recharges 6% faster per rank.',{cdr:[0,.06]}),
   key('vial','Volatile Vial',15,0,'Volatile Vial','Bounce Bolt becomes Volatile Vial: a spinning flask that explodes on impact, hitting everything within 90.','vial'),
   stat('dist','Distillation',5,20,'+3% power per rank.',{power:.03}),
   key('grand','Grand Concoction',25,-1,null,'Capstone: every brew grants a second random elixir.','grand'),stat('fumes','Fumes',2,25,'+2% max health per rank.',{hp:.02})]}]};
const MILESTONES=[10,20,30];
/* ---------- state ---------- */
const TAL={ranks:{},skin:null,applied:{power:0,maxHp:0,armor:0},orig:{}};
const trees=()=>TREES[p.cls]||[];
const spentIn=t=>t.nodes.reduce((s,n)=>s+(TAL.ranks[t.id+'.'+n.id]||0),0);
const spent=()=>trees().reduce((s,t)=>s+spentIn(t),0);
const total=()=>Math.max(0,(p.level|0)-4);
const avail=()=>total()-spent();
const rank=(t,n)=>TAL.ranks[t.id+'.'+n.id]||0;
function agg(){const A={power:0,hp:0,armor:0,cdr:[0,0,0,0,0],flags:{},ls:0,reflect:0,wallx:0,grovex:0,zombx:0,golemx:0,tree:{}};
 for(const t of trees())for(const n of t.nodes){const r=rank(t,n);if(!r)continue;if(n.key){A.flags[n.flag]=true;if(n.skill>=0)A.tree[n.skill]=t;continue;}
  for(const [k,v] of Object.entries(n.fx||{})){if(k==='cdr')A.cdr[v[0]]+=v[1]*r;else A[k]=(A[k]||0)+v*r;}}
 if(A.flags.armor)A.armor+=6;return A;}
let AG=agg();
function unapply(){const a=TAL.applied;p.power-=a.power;p.maxHp-=a.maxHp;p.armor-=a.armor;TAL.applied={power:0,maxHp:0,armor:0};}
function apply(){unapply();AG=agg();const a={power:Math.round(p.power*AG.power),maxHp:Math.round(p.maxHp*AG.hp),armor:AG.armor};p.power+=a.power;p.maxHp+=a.maxHp;p.armor+=a.armor;TAL.applied=a;p.hp=Math.min(p.hp,p.maxHp);renames();try{hud();}catch(e){}}
function renames(){for(const [cls,tr] of Object.entries(TREES)){const sk=CLASSES[cls]&&CLASSES[cls].skills;if(!sk)continue;const o=TAL.orig[cls]||(TAL.orig[cls]=sk.map(s=>s[0]));sk.forEach((s,i)=>{s[0]=o[i];});
  if(cls!==p.cls)continue;for(const t of tr)for(const n of t.nodes)if(n.key&&n.skill>=0&&rank(t,n))sk[n.skill][0]=n.rename;}}
// protect stats on save/load and level-up
{const ad=adventureData;adventureData=function(){const a={...TAL.applied};unapply();let d;try{d=ad.apply(this,arguments);}finally{p.power+=a.power;p.maxHp+=a.maxHp;p.armor+=a.armor;TAL.applied=a;}d.talents={v:1,ranks:{...TAL.ranks},skin:TAL.skin};return d;};}
{const ra=restoreAdventure;restoreAdventure=function(data){TAL.applied={power:0,maxHp:0,armor:0};const r=ra.apply(this,arguments);const t=data&&data.talents;TAL.ranks=t&&t.ranks?{...t.ranks}:{};TAL.skin=t&&t.skin||null;apply();return r;};}
{const gx=gainXp;gainXp=function(){const lv=p.level;const a={...TAL.applied};unapply();let r;try{r=gx.apply(this,arguments);}finally{p.power+=a.power;p.maxHp+=a.maxHp;p.armor+=a.armor;TAL.applied=a;}if(p.level!==lv){apply();if(p.level>=5)try{float(p.x,p.y-130,'+1 talent point','#ffd257');}catch(e){}}return r;};}
if(typeof beginCreation==='function'){const bc=beginCreation;beginCreation=function(){TAL.ranks={};TAL.skin=null;TAL.applied={power:0,maxHp:0,armor:0};AG=agg();return bc.apply(this,arguments);};}
function learn(t,n){if(avail()<=0)return 'No talent points left';if(rank(t,n)>=n.max)return 'Already mastered';if(spentIn(t)<n.req)return 'Needs '+n.req+' points in '+t.name;TAL.ranks[t.id+'.'+n.id]=rank(t,n)+1;const before=spentIn(t)-1;apply();
 const ms=MILESTONES.find(m=>before<m&&spentIn(t)>=m);if(ms){const i=MILESTONES.indexOf(ms);try{float(p.x,p.y-140,'Skin unlocked · '+t.skins[i],t.color);}catch(e){}}try{writeDeviceSave(true);}catch(e){}return null;}
function respec(){TAL.ranks={};TAL.skin=null;apply();try{writeDeviceSave(true);}catch(e){}}
const atCamp=()=>typeof CAMP!=='undefined'&&d2(p,CAMP)<170;
/* ---------- skins (overlay/recolour of the current frames) ---------- */
function skinDef(){if(!TAL.skin)return null;const [tid,i]=TAL.skin.split(':');const t=trees().find(x=>x.id===tid);if(!t||spentIn(t)<MILESTONES[+i])return null;return {filter:t.filter[+i],glow:t.glow[+i],key:TAL.skin};}
const SC=new Map();
function skinned(img,src,sd){if(!img||!(img.width||img.naturalWidth))return null;const k=(src||'')+'|'+sd.key+'|'+(img.width||img.naturalWidth);let c=SC.get(k);if(c)return c;c=document.createElement('canvas');c.width=img.width||img.naturalWidth;c.height=img.height||img.naturalHeight;const x=c.getContext('2d');x.filter=sd.filter;x.drawImage(img,0,0);x.filter='none';x.globalCompositeOperation='source-atop';x.globalAlpha=.12;x.fillStyle=sd.glow;x.fillRect(0,0,c.width,c.height);SC.set(k,c);if(SC.size>80)SC.delete(SC.keys().next().value);return c;}
if(typeof MoonMotion!=='undefined'){const t0=MoonMotion.tint;MoonMotion.tint=m=>{const base=t0?t0(m):null;const sd=skinDef();if(!sd||!m)return base;return skinned(base||m.img,(base?'t':'')+m.src,sd)||base;};
 const tf=MoonMotion.tintFrame;if(tf)MoonMotion.tintFrame=(ch,f)=>{const r=tf(ch,f);const sd=skinDef();if(!sd||!r||!r.img)return r;const c=skinned(r.img,'f'+ch,sd);return c?{...r,img:c}:r;};}
/* ---------- behaviour ---------- */
const FX={walls:[],arcs:[],craters:[],groves:[],clouds:[],flasks:[],minions:[],pulse:0,taunt:[]};
let tint=null;
{const bu=burst;burst=function(x,y,color,...a){return bu.call(this,x,y,tint||color,...a);};}
{const ef=effect;effect=function(x,y,r,color,...a){return ef.call(this,x,y,r,tint||color,...a);};}
const foes=(c,r)=>mobs.filter(m=>m.alive&&d2(m,c)<r);
function taunt(c,r){for(const m of foes(c,r)){m.aggro=true;FX.taunt.push({m,t:.8});}}
function lob(from,to,col,onLand,shape){FX.flasks.push({x0:from.x,y0:from.y-40,x1:to.x,y1:to.y-10,t:0,dur:Math.min(.6,.25+d2(from,to)/900),col,onLand,shape:shape||'flask'});}
function splash(x,y,r,amt,col){for(const m of mobs)if(m.alive&&Math.hypot(m.x-x,m.y-y)<r)damage(m,amt,col);try{burst(x,y-10,col,26,170);effect(x,y,r,col,'ring',.6);}catch(e){}}
function minion(kind,x,y){const big=kind==='golem',ti=AG.flags.titan;const k=1+(AG.golemx||0)+(ti&&big?.4:0);FX.minions.push({kind,x,y,hp:(big?p.maxHp*1.2:p.maxHp*.35)*k,max:(big?p.maxHp*1.2:p.maxHp*.35)*k,life:big?(ti?1e9:25):14,cd:.6,target:null,size:(big?1:0.55)*(ti&&big?1.4:1),dmg:p.power*(big?1.4:.45)*(big?k:1),hop:0,leap:null,born:.5,face:1});try{burst(x,y-20,big?'#ffb347':'#b45cff',24,140);}catch(e){}}
const RS=releaseSpell;releaseSpell=function(i){
 const sk=CLASSES[p.cls]&&CLASSES[p.cls].skills[i],before=p.cd[i],tgt=(typeof target!=='undefined'&&target&&target.alive)?target:null,t=AG.tree[i],F=AG.flags;
 const kind=sk&&sk[5],oldCF=typeof colorFor!=='undefined'?colorFor[kind]:null;if(t){tint=t.color;if(typeof colorFor!=='undefined')colorFor[kind]=t.color;}
 let r;try{r=RS.apply(this,arguments);}finally{tint=null;if(t&&typeof colorFor!=='undefined')colorFor[kind]=oldCF;}
 if(!(p.cd[i]>0))return r;
 if(AG.cdr[i]&&p.cd[i]>before)p.cd[i]*=Math.max(.4,1-AG.cdr[i]);
 const col=t?t.color:null;
 try{tint=col;
  if(p.cls==='warrior'){
   if(i===4&&F.wall){p.shield+=p.maxHp*(.2+(AG.wallx||0));p.ward=Math.max(p.ward,6);taunt(p,220);FX.walls.push({x:p.x,y:p.y,dir:p.dir||1,t:0,life:6});}
   if(i===3&&F.slam){const hit=foes(p,120);for(const m of hit){m.stun=Math.max(m.stun||0,1.2);}taunt(p,120);p.shield+=p.maxHp*.06*hit.length;p.ward=Math.max(p.ward,5);FX.craters.push({x:p.x,y:p.y,t:0,life:.8,r:120,col});cinematic.shake=.25;}
   if(i===1&&F.cleave){const dir=p.dir||1;for(const m of mobs)if(m.alive&&d2(m,p)<165&&(m.x-p.x)*dir>-30)damage(m,p.power*1.6,col);FX.arcs.push({x:p.x,y:p.y-30,dir,t:0,life:.6,col});cinematic.shake=.2;}
   if(i===2&&F.leap){setTimeout(()=>{FX.craters.push({x:p.x,y:p.y,t:0,life:.9,r:120,col:'#ff6a3d'});for(const m of foes(p,120))damage(m,p.power*2,'#ff6a3d');cinematic.shake=.35;try{burst(p.x,p.y,'#ff6a3d',34,190);}catch(e){}},260);}}
  if(p.cls==='druid'){
   if(i===2&&F.grove)FX.groves.push({x:p.x,y:p.y,r:110,t:0,life:8+(AG.grovex||0),col});
   if(i===4&&F.sguard){p.shield+=p.maxHp*.12;p.ward=Math.max(p.ward,6);FX.groves.push({x:p.x,y:p.y,r:70,t:0,life:5+(AG.grovex||0),col:'#d8ff9a'});}
   if(i===0&&F.rotsp&&tgt){tgt.poison=Math.max(tgt.poison||0,8);for(const m of foes(tgt,90))m.poison=Math.max(m.poison||0,5);FX.clouds.push({x:tgt.x,y:tgt.y,t:0,life:1.6,r:90});}
   if(i===3&&F.zomb){const c=tgt||p;for(let k=0;k<2+(AG.zombx||0);k++){const a=k*2.4;minion('zombie',c.x+Math.cos(a)*50,c.y+Math.sin(a)*24);}}}
  if(p.cls==='ranger'){
   if(i===1&&F.forgeG){if(globalThis.MoonKits)MoonKits.jellies.length=0;FX.minions=FX.minions.filter(m=>m.kind!=='golem');minion('golem',p.x+(p.dir||1)*60,p.y+10);}
   else if(i===1&&F.swarm&&globalThis.MoonKits)MoonKits.spawnJellies(2,tgt);
   if(i===2&&F.frenzyS&&globalThis.MoonKits){for(const j of MoonKits.jellies)j.life=j.max;MoonKits.spawnJellies(1,tgt);}
   if(i===2&&F.smash&&tgt){const gm=FX.minions.find(m=>m.kind==='golem');if(gm)gm.leap={x0:gm.x,y0:gm.y,t:0,dur:.45,tgt};}}
  if(p.cls==='mage'&&globalThis.Prismancer){const S=Prismancer.state;
   if(i===3&&F.mwall){S.mirror=6;p.ward=Math.max(p.ward,6);}
   if(i===1&&F.bastion){p.shield*=1.6;taunt(p,200);S.purple=Math.max(S.purple,p.ward||8);}
   if(i===2&&F.flask){const e=tgt||mobs.filter(m=>m.alive&&d2(m,p)<320).sort((a,b)=>d2(a,p)-d2(b,p))[0];if(e){S.gulp=0;setTimeout(()=>{const c2=(Prismancer.ELIX[S.elixir]||{}).c||'#ff9a3a';lob(p,e,c2,()=>splash(e.x,e.y,100,p.power*1.8,c2));},80);}}
   if(i===2&&F.grand){setTimeout(()=>{const ks=['teal','purple','gold','orange'],k=ks[Math.floor(Math.random()*4)];if(k==='teal')S.hot=6;if(k==='purple')S.purple=10;if(k==='gold')S.haste=8;if(k==='orange')S.splash=3;try{float(p.x,p.y-150,'+ '+Prismancer.ELIX[k].name,Prismancer.ELIX[k].c);}catch(e){}},900);}
   if(i===0&&F.vial&&tgt){lob(p,tgt,'#ff9a3a',()=>splash(tgt.x,tgt.y,90,p.power*1.0,'#ff9a3a'),'vial');}}
 }catch(e){console.warn('talents',e);}finally{tint=null;}
 return r;};
{const hu=hurt;hurt=function(n){if(AG.flags.armor)n*=.85;const hp=p.hp,sh=p.shield;hu.call(this,n);const took=(hp-p.hp)+(sh-p.shield);if(AG.reflect>0&&took>0){const m=mobs.filter(e=>e.alive&&e.aggro&&d2(e,p)<200).sort((a,b)=>d2(a,p)-d2(b,p))[0];if(m)damage(m,took*AG.reflect,'#7fd8ff');}};}
{const dm=damage;damage=function(m,n,c){const alive=m&&m.alive,poisoned=m&&m.poison>0,src=globalThis.OZ_SRC;if(AG.flags.hive&&src==='jelly')n*=1.35;const hp=m?m.hp:0;const r=dm.call(this,m,n,c);
 try{const dealt=Math.max(0,hp-(m?m.hp:0));const ls=(AG.ls||0)+(AG.flags.frenzy?.06:0);if(ls&&dealt&&!src)p.hp=Math.min(p.maxHp,p.hp+dealt*ls);
  if(AG.flags.plague&&alive&&poisoned&&!m.alive){FX.clouds.push({x:m.x,y:m.y,t:0,life:1.4,r:110});setTimeout(()=>{for(const e of mobs)if(e.alive&&d2(e,m)<110)dm(e,p.power*1.2,'#b45cff');},60);}
  if(AG.flags.perfect&&c==='#eef6ff'&&globalThis.Prismancer){const nx=mobs.filter(e=>e.alive&&e!==m&&d2(e,m)<220).sort((a,b)=>d2(a,m)-d2(b,m))[0];if(nx)Prismancer.state.bolts.push({x:m.x,y:m.y-30,m:nx,amt:Math.round(n*.6),t:0,dur:.25,bounce:true});}}catch(e){}
 return r;};}
{const up=update;update=function(dt){up.apply(this,arguments);try{if(typeof isPaused==='function'&&isPaused())return;tick(dt);}catch(e){console.warn('talents',e);}};}
function tick(dt){
 for(const k of ['walls','arcs','craters','groves','clouds','flasks'])for(const o of FX[k])o.t+=dt;
 for(const gv of FX.groves)if(d2(p,gv)<gv.r)p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.03*dt);
 for(const f of FX.flasks)if(f.t>=f.dur&&!f.done){f.done=true;try{f.onLand&&f.onLand();}catch(e){}}
 for(const k of ['walls','arcs','craters','groves','clouds'])FX[k]=FX[k].filter(o=>o.t<o.life);FX.flasks=FX.flasks.filter(f=>!f.done);
 for(const q of FX.taunt)q.t-=dt;FX.taunt=FX.taunt.filter(q=>q.t>0);
 if(AG.flags.frenzy&&p.hp<p.maxHp*.5)p.attack=Math.max(0,p.attack-dt*.35);
 if(AG.flags.ever&&p.inCombat>0){FX.pulse+=dt;if(FX.pulse>=6){FX.pulse=0;p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.06);FX.groves.push({x:p.x,y:p.y,r:90,t:0,life:.8,col:'#ffe58a',pulse:true});try{burst(p.x,p.y-30,'#ffe58a',20,120);}catch(e){}}}
 for(let i=FX.minions.length-1;i>=0;i--){const m=FX.minions[i];m.life-=dt;m.born=Math.max(0,m.born-dt);m.cd=Math.max(0,m.cd-dt);
  if(m.life<=0||m.hp<=0||d2(m,p)>700){try{burst(m.x,m.y-20,m.kind==='golem'?'#ffb347':'#b45cff',18,120);}catch(e){}FX.minions.splice(i,1);continue;}
  if(m.leap){const L=m.leap;L.t+=dt;const u=Math.min(1,L.t/L.dur);m.x=L.x0+(L.tgt.x-L.x0)*u;m.y=L.y0+(L.tgt.y-L.y0)*u;m.hop=-Math.sin(u*Math.PI)*70;if(u>=1){m.leap=null;m.hop=0;FX.craters.push({x:m.x,y:m.y,t:0,life:.9,r:110,col:'#ffb347'});for(const e of foes(m,110)){damage(e,p.power*2.2*(1+(AG.golemx||0)),'#ffb347');e.stun=Math.max(e.stun||0,1);}cinematic.shake=.35;}continue;}
  let e=m.target&&m.target.alive&&d2(m.target,p)<360?m.target:null;if(!e){const tg=typeof target!=='undefined'&&target&&target.alive&&d2(target,p)<320?target:null;e=tg||mobs.filter(x=>x.alive&&x.aggro&&d2(x,p)<300).sort((a,b)=>d2(a,m)-d2(b,m))[0]||null;}m.target=e;
  const gx=e?e.x-Math.sign(e.x-m.x||1)*(m.kind==='golem'?40:22):p.x-(p.dir||1)*(m.kind==='golem'?80:50),gy=e?e.y:p.y+16,dx=gx-m.x,dy=gy-m.y,dd=Math.hypot(dx,dy),sp=m.kind==='golem'?150:175;
  if(dd>6){const st=Math.min(dd,sp*dt);m.x+=dx/dd*st;m.y+=dy/dd*st;m.face=Math.sign(dx)||m.face;}
  if(e&&d2(m,e)<(m.kind==='golem'?70:42)&&m.cd<=0){m.cd=m.kind==='golem'?1.3:.9;m.swing=.25;globalThis.OZ_SRC='pet';try{if(m.kind==='golem'){for(const x of foes(e,60))damage(x,m.dmg,'#ffb347');}else damage(e,m.dmg,'#b45cff');}finally{globalThis.OZ_SRC=null;}if(e.alive&&Math.random()<.4)e.aggro=true;}
  m.swing=Math.max(0,(m.swing||0)-dt);}}
/* ---------- drawing ---------- */
{const dr=draw;draw=function(){dr.apply(this,arguments);if(typeof started!=='undefined'&&!started)return;g.save();try{g.setTransform(cinematic.dpr,0,0,cinematic.dpr,-camera.x*cinematic.dpr,-camera.y*cinematic.dpr);const t=now();
 for(const gv of FX.groves){const k=Math.min(1,gv.t*3),fade=Math.min(1,(gv.life-gv.t)*2);g.globalAlpha=.35*fade;g.fillStyle=gv.col;g.beginPath();g.ellipse(gv.x,gv.y,gv.r*k,gv.r*.4*k,0,0,7);g.fill();g.globalAlpha=.9*fade;
  if(!gv.pulse)for(let n=0;n<10;n++){const a=n/10*6.283+t*.2,x=gv.x+Math.cos(a)*gv.r*.9*k,y=gv.y+Math.sin(a)*gv.r*.36*k,h=12+6*Math.sin(n*3);g.fillStyle='#e9ffd8';g.fillRect(x-1.5,y-h,3,h);g.fillStyle=gv.col;g.beginPath();g.ellipse(x,y-h,8,5,0,Math.PI,0);g.fill();g.fillStyle='#fff';g.globalAlpha=.6*fade;g.beginPath();g.arc(x-2,y-h-2,1.3,0,7);g.fill();g.globalAlpha=.9*fade;}}
 g.globalAlpha=1;
 for(const c of FX.clouds){const k=c.t/c.life;for(let n=0;n<9;n++){const a=n*2.1+c.t,rr=c.r*(.3+.7*k)*(.5+((n*37)%10)/20);g.globalAlpha=.45*(1-k);g.fillStyle=n%2?'#b45cff':'#9be04a';g.beginPath();g.arc(c.x+Math.cos(a)*rr,c.y-20+Math.sin(a)*rr*.45,14+n%3*6,0,7);g.fill();}}g.globalAlpha=1;
 for(const w of FX.walls){const k=Math.min(1,w.t*4),fade=Math.min(1,(w.life-w.t)*2);for(let n=-3;n<=3;n++){const a=n*.32,x=w.x+w.dir*Math.cos(a)*70,y=w.y-20+Math.sin(a)*40;g.globalAlpha=.75*fade;g.fillStyle='rgba(127,216,255,.35)';g.strokeStyle='#bfe9ff';g.lineWidth=2;g.beginPath();for(let s=0;s<6;s++){const b=s/6*6.283;g.lineTo(x+Math.cos(b)*14*k,y-30*k+Math.sin(b)*26*k);}g.closePath();g.fill();g.stroke();}}g.globalAlpha=1;
 for(const a of FX.arcs){const k=a.t/a.life;g.globalAlpha=1-k;g.strokeStyle=a.col||'#ff6a3d';g.lineWidth=18*(1-k)+2;g.shadowColor='#ff6a3d';g.shadowBlur=16;g.beginPath();g.ellipse(a.x,a.y,100+60*k,46+20*k,0,a.dir>0?-1.3:Math.PI-1.3+0,a.dir>0?1.3:Math.PI+1.3);g.stroke();g.shadowBlur=0;}g.globalAlpha=1;
 for(const c of FX.craters){const k=c.t/c.life;g.globalAlpha=.8*(1-k);g.strokeStyle=c.col||'#ffb347';g.lineWidth=6*(1-k)+1;g.beginPath();g.ellipse(c.x,c.y,c.r*(.4+.8*k),c.r*.38*(.4+.8*k),0,0,7);g.stroke();g.fillStyle='rgba(40,20,10,'+(.35*(1-k))+')';g.beginPath();g.ellipse(c.x,c.y,c.r*.5,c.r*.18,0,0,7);g.fill();}g.globalAlpha=1;
 for(const f of FX.flasks){const u=Math.min(1,f.t/f.dur),x=f.x0+(f.x1-f.x0)*u,y=f.y0+(f.y1-f.y0)*u-Math.sin(u*Math.PI)*90;g.save();g.translate(x,y);g.rotate(t*12);g.fillStyle=f.col;g.beginPath();g.ellipse(0,4,f.shape==='vial'?5:8,f.shape==='vial'?9:10,0,0,7);g.fill();g.fillStyle='#e8f4ff';g.fillRect(-2.5,-10,5,7);g.fillStyle='#a0703a';g.fillRect(-3,-13,6,3);g.restore();}
 for(const q of FX.taunt){if(!q.m.alive)continue;g.globalAlpha=Math.min(1,q.t*2);g.fillStyle='#ff5040';g.font='bold 20px Georgia,serif';g.textAlign='center';g.fillText('!',q.m.x,q.m.y-95);}g.globalAlpha=1;
 if(AG.flags.armor){g.globalAlpha=.35+.1*Math.sin(t*3);g.strokeStyle='#7fd8ff';g.lineWidth=3;for(let n=0;n<6;n++){const a=n/6*6.283+t*.5;g.beginPath();g.arc(p.x+Math.cos(a)*30,p.y-50+Math.sin(a)*40,9,0,7);g.stroke();}g.globalAlpha=1;}
 if(AG.flags.mwall&&globalThis.Prismancer&&Prismancer.state.mirror>0){for(let n=0;n<8;n++){const a=n/8*6.283+t*1.4,x=p.x+Math.cos(a)*68,y=p.y-54+Math.sin(a)*80;g.save();g.translate(x,y);g.rotate(a);g.fillStyle='rgba(240,248,255,.75)';g.strokeStyle='#fff';g.lineWidth=1.5;g.beginPath();g.moveTo(0,-12);g.lineTo(7,0);g.lineTo(0,12);g.lineTo(-7,0);g.closePath();g.fill();g.stroke();g.restore();}}
 const sd=skinDef();if(sd){g.globalAlpha=.22+.08*Math.sin(t*2);g.strokeStyle=sd.glow;g.lineWidth=2;g.beginPath();g.ellipse(p.x,p.y+4,30,10,0,0,7);g.stroke();g.globalAlpha=1;}
 for(const m of FX.minions){const S=(m.kind==='golem'?78:40)*m.size/(m.kind==='golem'?1:0.55)*(m.kind==='golem'?1:.55),bob=Math.sin(t*6+m.x)*2*(1-m.born),y=m.y+(m.hop||0),sw=m.swing>0?1.15:1;g.save();g.translate(m.x,y);g.scale(m.face*(1-m.born*.6),1-m.born*.6);
  g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(0,2-(m.hop||0),S*.55,S*.16,0,0,7);g.fill();
  if(m.kind==='golem'){const gr=g.createRadialGradient(-S*.2,-S*.9,4,0,-S*.6,S);gr.addColorStop(0,'#ffe0a0');gr.addColorStop(.5,'#ffb347');gr.addColorStop(1,'#8a4a10');g.fillStyle=gr;g.beginPath();g.ellipse(0,-S*.6+bob,S*.55*sw,S*.62,0,0,7);g.fill();
   g.fillStyle='#ffb347';g.beginPath();g.ellipse(S*.55,-S*.55,S*.18,S*.28*sw,.4,0,7);g.fill();g.beginPath();g.ellipse(-S*.55,-S*.55,S*.18,S*.28,-.4,0,7);g.fill();
   g.fillStyle='#3a1e05';g.fillRect(-S*.3,-S*.95,S*.6,S*.12);g.fillStyle='#fff6c0';g.beginPath();g.arc(-S*.14,-S*.89,S*.05,0,7);g.arc(S*.14,-S*.89,S*.05,0,7);g.fill();g.fillStyle='rgba(255,255,255,.5)';g.beginPath();g.ellipse(-S*.22,-S*.98,S*.12,S*.06,-.5,0,7);g.fill();}
  else{g.fillStyle='#6a8a4a';g.beginPath();g.ellipse(0,-S*.45+bob,S*.42,S*.5,0,0,7);g.fill();g.fillStyle='#b45cff';g.beginPath();g.ellipse(0,-S*.9+bob,S*.52,S*.26,0,Math.PI,0);g.fill();g.fillStyle='#e8d0ff';for(const [a,b] of [[-.2,-1.0],[.15,-.98],[.3,-.9]]){g.beginPath();g.arc(S*a,S*b+bob,S*.05,0,7);g.fill();}
   g.fillStyle='#d9ff7a';g.beginPath();g.arc(-S*.12,-S*.55+bob,S*.06,0,7);g.arc(S*.12,-S*.55+bob,S*.06,0,7);g.fill();}
  g.restore();if(m.hp<m.max){g.fillStyle='#200';g.fillRect(m.x-20,y-(m.kind==='golem'?S*1.3:S*1.3)-6,40,4);g.fillStyle=m.kind==='golem'?'#ffb347':'#b45cff';g.fillRect(m.x-20,y-(m.kind==='golem'?S*1.3:S*1.3)-6,40*m.hp/m.max,4);}}
}catch(e){}g.restore();};}
// minions soak a share of incoming hits (golem taunts)
{const hu=hurt;hurt=function(n){const gm=FX.minions.find(m=>m.kind==='golem'&&d2(m,p)<200);if(gm){gm.hp-=n*.5;return hu.call(this,n*.5);}return hu.call(this,n);};}
if(typeof travel==='function'){const tv=travel;travel=function(){const z=story.zone;const r=tv.apply(this,arguments);if(story.zone!==z){FX.minions=FX.minions.filter(m=>m.life>1e8);for(const m of FX.minions){m.x=p.x-40;m.y=p.y+10;}for(const k of ['walls','arcs','craters','groves','clouds','flasks'])FX[k]=[];}return r;};}
/* ---------- UI ---------- */
const D=document.createElement('dialog');D.id='ozTalents';D.className='mv-panel oz-tal';document.body.appendChild(D);
let tab=0,sel=null;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function treeHtml(t,ti){const sp=spentIn(t),rows=[[0,1],[2],[3,4],[5],[6],[7,8]];
 let h='<section class="ozt-tree" data-tree="'+ti+'" style="--tc:'+t.color+'"><div class="ozt-th"><b>'+esc(t.name)+'</b><small>'+esc(t.theme)+'</small><em>'+sp+' pts</em></div><div class="ozt-grid"><svg class="ozt-links" viewBox="0 0 100 600" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="oztg'+ti+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+t.color+'" stop-opacity=".9"/><stop offset="1" stop-color="'+t.color+'" stop-opacity=".25"/></linearGradient></defs>';
 const pos=(ri,ci,n)=>[n===1?50:(ci?72:28),ri*100+50];
 rows.forEach((row,ri)=>{if(ri===rows.length-1)return;const nx=rows[ri+1];row.forEach((a,ci)=>nx.forEach((b,cj)=>{const [x1,y1]=pos(ri,ci,row.length),[x2,y2]=pos(ri+1,cj,nx.length);const lit=sp>=t.nodes[b].req;h+='<path class="'+(lit?'lit':'')+'" d="M'+x1+' '+y1+' C'+x1+' '+(y1+50)+' '+x2+' '+(y2-50)+' '+x2+' '+y2+'" stroke="url(#oztg'+ti+')"/>';}));});
 h+='</svg>';
 rows.forEach((row,ri)=>{h+='<div class="ozt-row">';row.forEach(ni=>{const n=t.nodes[ni],r=rank(t,n),open=sp>=n.req,cls=['ozt-node',n.key?'key':'',r>=n.max?'max':'',r?'has':'',open?'':'locked',sel&&sel[0]===ti&&sel[1]===ni?'sel':''].join(' ');
  h+='<div role="button" tabindex="0" class="'+cls+'" data-node="'+ni+'" aria-label="'+esc(n.name)+'"><i>'+(n.key?'◆':'●')+'</i><span>'+esc(n.name)+'</span><em>'+r+'/'+n.max+'</em></div>';});h+='</div>';});
 h+='</div><div class="ozt-skins">'+t.skins.map((s,i)=>{const un=sp>=MILESTONES[i],on=TAL.skin===t.id+':'+i;return '<div role="button" tabindex="0" class="ozt-skin mv-raw'+(un?'':' locked')+(on?' on':'')+'" data-skin="'+t.id+':'+i+'" style="--sg:'+t.glow[i]+'"><i></i><span>'+esc(s)+'</span><small>'+(un?(on?'Worn':'Wear'):MILESTONES[i]+' pts')+'</small></div>';}).join('')+'</div></section>';return h;}
function render(){const T=trees();if(!T.length){D.innerHTML='<p>No talents for this class.</p>';return;}
 const n=sel&&T[sel[0]]&&T[sel[0]].nodes[sel[1]],tt=sel&&T[sel[0]];
 D.innerHTML='<button class="close mv-x ozt-x" type="button" aria-label="Close talents">×</button><div class="ozt-head"><small class="mv-kicker">'+esc(CLASSES[p.cls].name)+' · Talents</small><h2>Choose your path</h2><p class="ozt-pts"><b>'+avail()+'</b> point'+(avail()===1?'':'s')+' to spend · '+spent()+' / '+total()+' spent'+(p.level<5?' · first point at level 5':'')+'</p></div>'+
  '<div class="ozt-tabs">'+T.map((t,i)=>'<button type="button" data-tab="'+i+'" class="'+(i===tab?'on':'')+'" style="--tc:'+t.color+'">'+esc(t.name)+' <em>'+spentIn(t)+'</em></button>').join('')+'</div>'+
  '<div class="ozt-trees" data-tab="'+tab+'">'+T.map(treeHtml).join('')+'</div>'+
  '<div class="ozt-info">'+(n?'<b style="color:'+tt.color+'">'+esc(n.name)+'</b> <small>'+rank(tt,n)+'/'+n.max+(n.req?' · needs '+n.req+' in '+esc(tt.name):'')+'</small><p>'+esc(n.desc)+'</p><button type="button" class="ozt-learn"'+(avail()>0&&rank(tt,n)<n.max&&spentIn(tt)>=n.req?'':' disabled')+'>Learn · 1 point</button><span class="ozt-msg"></span>':'<p>Tap a talent to read it. ◆ key talents rename a spell and change how it looks and behaves. 10 / 20 / 30 points in one tree unlock its skins.</p>')+
  '<button type="button" class="ozt-respec"'+(atCamp()&&spent()?'':' disabled')+'>'+(atCamp()?'Respec (free at camp)':'Respec at a camp fire')+'</button></div>';
 D.querySelector('.ozt-x').onclick=()=>D.close();
 D.querySelectorAll('[data-tab]').forEach(b=>{if(b.tagName==='BUTTON')b.onclick=()=>{tab=+b.dataset.tab;render();};});
 D.querySelectorAll('.ozt-tree').forEach(sec=>{const ti=+sec.dataset.tree;sec.querySelectorAll('.ozt-node').forEach(b=>b.onclick=()=>{sel=[ti,+b.dataset.node];tab=ti;render();});
  sec.querySelectorAll('.ozt-skin').forEach(b=>b.onclick=()=>{if(b.classList.contains('locked'))return;TAL.skin=TAL.skin===b.dataset.skin?null:b.dataset.skin;SC.clear();try{writeDeviceSave(true);}catch(e){}render();});});
 const L=D.querySelector('.ozt-learn');if(L)L.onclick=()=>{const m=learn(tt,n);if(m)D.querySelector('.ozt-msg').textContent=m;else{try{sfx('level');}catch(e){}render();const nb=D.querySelector('.ozt-node.sel');if(nb){nb.classList.add('pulse');}}};
 const R=D.querySelector('.ozt-respec');R.onclick=()=>{if(R.dataset.arm){respec();sel=null;render();return;}R.dataset.arm=1;R.textContent='Tap again to reset every point';};}
function open(){if(typeof started!=='undefined'&&!started)return;try{keysClear();}catch(e){}render();if(!D.open)D.showModal();}
{const ip=isPaused;isPaused=function(){return ip.apply(this,arguments)||D.open;};}
D.addEventListener('click',e=>{if(e.target===D)D.close();});D.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role=button]')){e.preventDefault();e.target.click();}});
addEventListener('keydown',e=>{if((e.key==='t'||e.key==='T')&&!e.target.closest('input,textarea')&&typeof started!=='undefined'&&started){if(D.open)D.close();else open();}});
function navBtn(){const sk=document.getElementById('mvNavSkills');if(!sk||document.getElementById('mvNavTalents'))return;const b=document.createElement('button');b.id='mvNavTalents';b.className='mv-nav-skills oz-nav-tal';b.innerHTML='<i></i><span>Talents</span><b class="ozt-dot" hidden></b>';b.onclick=open;sk.after(b);}
navBtn();setInterval(()=>{navBtn();const d=document.querySelector('#mvNavTalents .ozt-dot');if(d)d.hidden=!(avail()>0);},1000);
const css=document.createElement('style');css.textContent=`
#ozTalents{overflow-x:hidden;box-sizing:border-box;width:min(980px,96vw);max-height:92vh;overflow:auto;padding:14px 16px 16px;border-radius:18px;color:#f1e6c8;background:linear-gradient(180deg,#1b1f25 0%,#121418 100%);border:2px solid #7a5a2e;box-shadow:0 0 0 1px #2a1d0e inset,0 0 0 4px #15100a,0 20px 60px #000c,0 0 40px #3fe0c822}
#ozTalents .ozt-node::before,#ozTalents .ozt-node::after,#ozTalents .ozt-skin::before,#ozTalents .ozt-skin::after,#ozTalents .ozt-th::before,#ozTalents .ozt-th::after{display:none!important}
#ozTalents::backdrop{background:#05070acc}
.ozt-head h2{margin:2px 0 4px;font:700 24px/1.1 Georgia,serif;color:#ffe3a1}.ozt-pts{margin:0 0 10px;color:#c9b48a;font-size:14px}.ozt-pts b{color:#ffd257;font-size:18px}
.ozt-x{position:absolute;right:10px;top:10px}
.ozt-tabs{display:none;gap:8px;margin-bottom:8px}.ozt-tabs button{flex:1;padding:10px;border-radius:12px;border:2px solid #4b3a22;background:#1d1812;color:#e9d8b4;font:700 15px Georgia,serif;cursor:pointer}.ozt-tabs button.on{border-color:var(--tc);box-shadow:0 0 14px color-mix(in srgb,var(--tc) 45%,transparent);color:#fff}.ozt-tabs em{font-style:normal;color:var(--tc);margin-left:4px}
.ozt-trees{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.ozt-tree{position:relative;border-radius:16px;padding:10px 10px 12px;background:radial-gradient(120% 60% at 50% 0%,color-mix(in srgb,var(--tc) 14%,transparent),transparent 70%),linear-gradient(180deg,#22262d,#16191e);border:2px solid #5a4426;box-shadow:inset 0 0 0 1px #0008,inset 0 2px 0 #ffffff10}
.ozt-th{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin:0 4px 6px}.ozt-th b{font:700 20px Georgia,serif;color:var(--tc);text-shadow:0 0 10px color-mix(in srgb,var(--tc) 50%,transparent)}.ozt-th small{color:#b9a47c;font-size:12px;flex:1}.ozt-th em{font-style:normal;color:#ffd257;font-weight:700}
.ozt-grid{position:relative}.ozt-links{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.ozt-links path{fill:none;stroke-width:1.2;opacity:.25;vector-effect:non-scaling-stroke;stroke-width:4px}.ozt-links path.lit{opacity:1;stroke-dasharray:10 8;animation:oztFlow 1.4s linear infinite;filter:drop-shadow(0 0 4px var(--tc))}
@keyframes oztFlow{to{stroke-dashoffset:-36}}
.ozt-row{position:relative;display:flex;justify-content:space-around;height:96px;align-items:center}
.ozt-node{position:relative;width:74px;display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:0;color:#e9d8b4;cursor:pointer;padding:0}
.ozt-node i{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;font-style:normal;font-size:18px;color:var(--tc);background:radial-gradient(circle at 40% 35%,#3a3f48,#14161a 70%);border:3px solid #8a6a3a;box-shadow:inset 0 0 0 2px #0009,0 2px 0 #000a}
.ozt-node.key i{border-radius:14px;transform:rotate(45deg);width:46px;height:46px}.ozt-node.key i::first-letter{}
.ozt-node.has i{border-color:var(--tc);box-shadow:inset 0 0 12px color-mix(in srgb,var(--tc) 50%,transparent),0 0 14px color-mix(in srgb,var(--tc) 55%,transparent)}
.ozt-node.max i{background:radial-gradient(circle at 40% 35%,color-mix(in srgb,var(--tc) 70%,#fff),color-mix(in srgb,var(--tc) 40%,#000) 75%);color:#10141a}
.ozt-node.locked{opacity:.42;filter:grayscale(.7)}.ozt-node.sel i{outline:3px solid #ffd257;outline-offset:3px}.ozt-node.pulse i{animation:oztPulse .5s ease-out}
@keyframes oztPulse{0%{transform:scale(1)}40%{transform:scale(1.25)}100%{transform:scale(1)}}.ozt-node.key.pulse i{animation:none}
.ozt-node span{overflow-wrap:normal;font-size:11px;line-height:1.1;text-align:center;max-width:84px}.ozt-node.key span{margin-top:6px}.ozt-node em{position:absolute;top:36px;right:4px;font-style:normal;font-size:10px;font-weight:800;background:#120e08;border:1px solid #8a6a3a;border-radius:8px;padding:0 4px;color:#ffd257}
.ozt-skins{display:flex;gap:6px;margin-top:8px}.ozt-skin{flex:1;min-width:0;overflow-wrap:anywhere;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px;border-radius:12px;border:2px solid #4b3a22;background:#18140e;color:#e9d8b4;cursor:pointer}
.ozt-skin i{width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,var(--sg) 45%,#000 100%);box-shadow:0 0 10px var(--sg)}.ozt-skin span{font-size:11px;text-align:center}.ozt-skin small{font-size:10px;color:#b9a47c}.ozt-skin.on{border-color:var(--sg);box-shadow:0 0 12px var(--sg)}.ozt-skin.locked{opacity:.45}.ozt-skin.locked i{filter:grayscale(1) brightness(.5)}
.ozt-info{position:sticky;bottom:-16px;margin:12px -16px -16px;padding:12px 16px 16px;background:linear-gradient(180deg,#1a1d22ee,#0e1013);border-top:2px solid #5a4426;display:flex;flex-wrap:wrap;align-items:center;gap:8px}.ozt-info p{flex-basis:100%;margin:2px 0;font-size:14px;color:#e2d4b2}.ozt-info small{color:#b9a47c}
.ozt-learn,.ozt-respec{padding:10px 16px;border-radius:12px;font:700 14px Georgia,serif;cursor:pointer;border:2px solid #a07a3c;background:linear-gradient(180deg,#3a2a14,#22180c);color:#ffe3a1}.ozt-learn:not([disabled]){border-color:#3fe0c8;box-shadow:0 0 12px #3fe0c866;color:#eafff9}.ozt-respec{margin-left:auto}.ozt-learn[disabled],.ozt-respec[disabled]{opacity:.45;cursor:default}.ozt-msg{color:#ff9a7a;font-size:13px}
.oz-nav-tal{position:relative}.ozt-dot{position:absolute;top:4px;right:10px;width:9px;height:9px;border-radius:50%;background:#ffd257;box-shadow:0 0 8px #ffd257}
@media(max-width:760px){.ozt-row{height:88px}.ozt-node{width:84px}.ozt-info p{font-size:13px}.ozt-info{padding:8px 10px 10px}.ozt-learn,.ozt-respec{padding:8px 12px}.ozt-tabs{display:flex}.ozt-trees{grid-template-columns:1fr}.ozt-trees[data-tab="0"] .ozt-tree[data-tree="1"],.ozt-trees[data-tab="1"] .ozt-tree[data-tree="0"]{display:none}#ozTalents{padding:12px 10px 14px}.ozt-info{margin:10px -10px -14px}.ozt-head h2{font-size:20px}}
`;document.head.appendChild(css);
globalThis.OozeTalents={TREES,TAL,open,render,learn,respec,avail,spentIn,agg:()=>AG,apply,FX,skinDef,trees};
})();
