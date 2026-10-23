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
  {id:'mirror',name:'Mirrorwall',color:'#eef6ff',theme:'Mirrored shield-gun, reflect tank',skins:['Silvered Pearl','Mirrorplate','Perfect Prism'],filter:['saturate(.4) brightness(1.15)','saturate(.2) brightness(1.25) contrast(1.1)','hue-rotate(200deg) saturate(1.3) brightness(1.25)'],glow:['#ffffff','#e8f4ff','#bff6ff'],nodes:[
   stat('pearl','Pearl Skin',5,0,'+3% max health per rank.',{hp:.03}),stat('silver','Silvering',5,0,'+1 armor per rank.',{armor:1}),
   key('mwall','Mirrorwall',5,3,'Mirrorwall','Mirror Gel becomes Mirrorwall: lasts 6 s and is ringed by spinning chrome facets.','mwall'),
   stat('glint','Glint',5,10,'Mirror Gel / Mirrorwall recharges 6% faster per rank.',{cdr:[3,.06]}),stat('film','Thick Film',5,10,'Bubble Ward recharges 6% faster per rank.',{cdr:[1,.06]}),
   key('bastion','Prism Bastion',15,1,'Prism Bastion','Bubble Ward becomes Prism Bastion: a 60% stronger bubble that taunts nearby foes and reflects part of every absorbed hit.','bastion'),
   stat('lustre','Lustre',5,20,'+2% health and +1 armor per rank.',{hp:.02,armor:1}),
   key('perfect','Perfect Reflection',25,-1,null,'Capstone: every mirror shard ricochets into a second foe for 60%.','perfect'),stat('facet','Facets',2,25,'+3% power per rank.',{power:.03})]},
  {id:'alch',name:'Alchemist',color:'#ff9a3a',theme:'Long blaster rifle, potion grenades',skins:['Copper Still','Gilded Alembic','Grand Alchemist'],filter:['hue-rotate(-170deg) saturate(1.2)','hue-rotate(-150deg) saturate(1.7) brightness(1.1)','hue-rotate(-120deg) saturate(2) brightness(1.2)'],glow:['#ffb36f','#ffd257','#ff8a3a'],nodes:[
   stat('catal','Catalyst',5,0,'+3% power per rank.',{power:.03}),stat('cork','Quick Cork',5,0,'Gulp Brew / Hurl Flask recharges 6% faster per rank.',{cdr:[2,.06]}),
   key('flask','Potion Grenade',5,2,'Potion Grenade','Gulp Brew becomes Potion Grenade: a grenade off your bandolier is lobbed at your target and bursts in a coloured splash for 180% power (you still get its effect).','flask'),
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
  if(cls!==p.cls)continue;for(const t of tr)for(const n of t.nodes)if(n.key&&n.skill>=0&&rank(t,n))sk[n.skill][0]=n.rename;}relabel();}
function relabel(){const hb=document.getElementById('hotbar'),sk=CLASSES[p.cls]&&CLASSES[p.cls].skills;if(!hb||!sk)return;const o=TAL.orig[p.cls]||[];const names=new Set();for(const tr of Object.values(TREES))for(const t of tr)for(const n of t.nodes)if(n.rename)names.add(n.rename);
 [...hb.children].forEach((b,i)=>{if(!sk[i])return;const all=new Set([o[i],...names]);const w=document.createTreeWalker(b,NodeFilter.SHOW_TEXT);let x;while(x=w.nextNode()){const v=x.nodeValue.trim();if(v&&all.has(v)&&v!==sk[i][0])x.nodeValue=x.nodeValue.replace(v,sk[i][0]);}});}
// protect stats on save/load and level-up
{const ad=adventureData;adventureData=function(){const a={...TAL.applied};unapply();let d;try{d=ad.apply(this,arguments);}finally{p.power+=a.power;p.maxHp+=a.maxHp;p.armor+=a.armor;TAL.applied=a;}d.talents={v:1,ranks:{...TAL.ranks},skin:TAL.skin};return d;};}
{const ra=restoreAdventure;restoreAdventure=function(data){TAL.applied={power:0,maxHp:0,armor:0};const r=ra.apply(this,arguments);const t=data&&data.talents;TAL.ranks=t&&t.ranks?{...t.ranks}:{};TAL.skin=t&&t.skin||null;if(trees().filter(x=>spentIn(x)>0).length>1){TAL.ranks={};TAL.skin=null;TAL.refunded=true;setTimeout(()=>{try{float(p.x,p.y-140,'Talents refunded: pick one path','#ffd257');}catch(e){}},1500);}apply();return r;};}
{const gx=gainXp;gainXp=function(){const lv=p.level;const a={...TAL.applied};unapply();let r;try{r=gx.apply(this,arguments);}finally{p.power+=a.power;p.maxHp+=a.maxHp;p.armor+=a.armor;TAL.applied=a;}if(p.level!==lv){apply();if(p.level>=5)try{float(p.x,p.y-130,'+1 talent point','#ffd257');}catch(e){}}return r;};}
if(typeof beginCreation==='function'){const bc=beginCreation;beginCreation=function(){TAL.ranks={};TAL.skin=null;TAL.applied={power:0,maxHp:0,armor:0};AG=agg();return bc.apply(this,arguments);};}
const lockedTree=()=>trees().find(t=>spentIn(t)>0)||null;
function learn(t,n){const lk=lockedTree();if(lk&&lk!==t)return 'Locked: visit a Talent Keeper to reset';if(avail()<=0)return 'No talent points left';if(rank(t,n)>=n.max)return 'Already mastered';if(spentIn(t)<n.req)return 'Needs '+n.req+' points in '+t.name;TAL.ranks[t.id+'.'+n.id]=rank(t,n)+1;const before=spentIn(t)-1;apply();
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
   if(i===1&&F.forgeG){if(globalThis.MoonKits)MoonKits.jellies.length=0;FX.minions=FX.minions.filter(m=>m.kind!=='golem');minion('golem',p.x-(p.dir||1)*90,p.y-10);}
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
 drawKeeper(t);drawWeapon(t);
 const sd=skinDef();if(sd){g.globalAlpha=.22+.08*Math.sin(t*2);g.strokeStyle=sd.glow;g.lineWidth=2;g.beginPath();g.ellipse(p.x,p.y+4,30,10,0,0,7);g.stroke();g.globalAlpha=1;}
 for(const m of FX.minions){const S=(m.kind==='golem'?62:22)*m.size/(m.kind==='golem'?1:.55),bob=Math.sin(t*6+m.x)*2*(1-m.born),y=m.y+(m.hop||0),sw=m.swing>0?1.15:1;g.save();g.translate(m.x,y);g.scale(m.face*(1-m.born*.6),1-m.born*.6);
  g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(0,2-(m.hop||0),S*.55,S*.16,0,0,7);g.fill();
  if(m.kind==='golem'){const gr=g.createRadialGradient(-S*.2,-S*.9,4,0,-S*.6,S);gr.addColorStop(0,'#fff0c0');gr.addColorStop(.35,'#f0a030');gr.addColorStop(1,'#5a2a06');g.globalAlpha=.92;g.fillStyle=gr;g.beginPath();g.ellipse(0,-S*.6+bob,S*.55*sw,S*.62,0,0,7);g.fill();
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
 const lk=lockedTree(),lockd=lk&&lk!==t;let h='<section class="ozt-tree'+(lockd?' tlock':'')+'" data-tree="'+ti+'"'+(lockd?' title="Locked: visit a Talent Keeper to reset"':'')+' style="--tc:'+t.color+'">'+(lockd?'<div class="ozt-lockmsg">🔒 Locked: visit a Talent Keeper to reset</div>':'')+'<div class="ozt-th"><canvas class="ozt-wpn" width="72" height="72" data-wt="'+t.id+'"></canvas><b>'+esc(t.name)+'</b><small>'+esc(t.theme)+'</small><em>'+sp+' pts</em></div><div class="ozt-grid"><svg class="ozt-links" viewBox="0 0 100 600" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="oztg'+ti+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+t.color+'" stop-opacity=".9"/><stop offset="1" stop-color="'+t.color+'" stop-opacity=".25"/></linearGradient></defs>';
 const pos=(ri,ci,n)=>[n===1?50:(ci?72:28),ri*100+50];
 rows.forEach((row,ri)=>{if(ri===rows.length-1)return;const nx=rows[ri+1];row.forEach((a,ci)=>nx.forEach((b,cj)=>{const [x1,y1]=pos(ri,ci,row.length),[x2,y2]=pos(ri+1,cj,nx.length);const lit=sp>=t.nodes[b].req;h+='<path class="'+(lit?'lit':'')+'" d="M'+x1+' '+y1+' C'+x1+' '+(y1+50)+' '+x2+' '+(y2-50)+' '+x2+' '+y2+'" stroke="url(#oztg'+ti+')"/>';}));});
 h+='</svg>';
 rows.forEach((row,ri)=>{h+='<div class="ozt-row">';row.forEach(ni=>{const n=t.nodes[ni],r=rank(t,n),open=sp>=n.req,cls=['ozt-node',n.key?'key':'',r>=n.max?'max':'',r?'has':'',open?'':'locked',sel&&sel[0]===ti&&sel[1]===ni?'sel':''].join(' ');
  h+='<div role="button" tabindex="0" class="'+cls+'" data-node="'+ni+'" aria-label="'+esc(n.name)+'"><i>'+(n.key?'◆':'●')+'</i><span>'+esc(n.name)+'</span><em>'+r+'/'+n.max+'</em></div>';});h+='</div>';});
 h+='</div><div class="ozt-skins">'+t.skins.map((s,i)=>{const un=sp>=MILESTONES[i],on=TAL.skin===t.id+':'+i;return '<div role="button" tabindex="0" class="ozt-skin mv-raw'+(un?'':' locked')+(on?' on':'')+'" data-skin="'+t.id+':'+i+'" style="--sg:'+t.glow[i]+'"><i></i><span>'+esc(s)+'</span><small>'+(un?(on?'Worn':'Wear'):MILESTONES[i]+' pts')+'</small></div>';}).join('')+'</div></section>';return h;}
function render(){const T=trees();if(!T.length){D.innerHTML='<p>No talents for this class.</p>';return;}
 const n=sel&&T[sel[0]]&&T[sel[0]].nodes[sel[1]],tt=sel&&T[sel[0]];
 D.innerHTML='<button class="close mv-x ozt-x" type="button" aria-label="Close talents">×</button><div class="ozt-head"><small class="mv-kicker">'+esc(CLASSES[p.cls].name)+' · Talents</small><h2>Choose your path</h2><p class="ozt-pts"><b>'+avail()+'</b> point'+(avail()===1?'':'s')+' to spend · '+spent()+' / '+total()+' spent'+(p.level<5?' · first point at level 5':'')+'</p></div>'+
  '<div class="ozt-tabs">'+T.map((t,i)=>'<button type="button" data-tab="'+i+'" class="'+(i===tab?'on':'')+'" style="--tc:'+t.color+'">'+(lockedTree()&&lockedTree()!==t?'🔒 ':'')+esc(t.name)+' <em>'+spentIn(t)+'</em></button>').join('')+'</div>'+
  '<div class="ozt-trees" data-tab="'+tab+'">'+T.map(treeHtml).join('')+'</div>'+
  '<div class="ozt-info">'+(n?'<b style="color:'+tt.color+'">'+esc(n.name)+'</b> <small>'+rank(tt,n)+'/'+n.max+(n.req?' · needs '+n.req+' in '+esc(tt.name):'')+'</small><p>'+esc(n.desc)+'</p><button type="button" class="ozt-learn"'+(avail()>0&&rank(tt,n)<n.max&&spentIn(tt)>=n.req&&!(lockedTree()&&lockedTree()!==tt)?'':' disabled')+'>Learn · 1 point</button><span class="ozt-msg"></span>':'<p>Tap a talent to read it. ◆ key talents rename a spell and change how it looks and behaves. 10 / 20 / 30 points in one tree unlock its skins.</p>')+
  '<small class="ozt-keep">'+(lockedTree()?'Path chosen: '+esc(lockedTree().name)+'. Visit a Talent Keeper at camp to reset.':'Your first point locks you into that tree.')+(TAL.refunded?' Your old mixed talents were refunded.':'')+'</small></div>';
 D.querySelector('.ozt-x').onclick=()=>D.close();D.querySelectorAll('.ozt-wpn').forEach(c=>{const x=c.getContext('2d');x.translate(c.dataset.wt==='mirror'||c.dataset.wt==='bulwark'?22:36,64);x.rotate(c.dataset.wt==='mirror'||c.dataset.wt==='bulwark'?0:-.6);weapon(x,c.dataset.wt,.72,0);});
 D.querySelectorAll('[data-tab]').forEach(b=>{if(b.tagName==='BUTTON')b.onclick=()=>{tab=+b.dataset.tab;render();};});
 D.querySelectorAll('.ozt-tree').forEach(sec=>{const ti=+sec.dataset.tree;sec.querySelectorAll('.ozt-node').forEach(b=>b.onclick=()=>{sel=[ti,+b.dataset.node];tab=ti;render();});
  sec.querySelectorAll('.ozt-skin').forEach(b=>b.onclick=()=>{if(b.classList.contains('locked'))return;TAL.skin=TAL.skin===b.dataset.skin?null:b.dataset.skin;SC.clear();try{writeDeviceSave(true);}catch(e){}render();});});
 const L=D.querySelector('.ozt-learn');if(L)L.onclick=()=>{const m=learn(tt,n);if(m)D.querySelector('.ozt-msg').textContent=m;else{try{sfx('level');}catch(e){}render();const nb=D.querySelector('.ozt-node.sel');if(nb){nb.classList.add('pulse');}}};
}
function open(){if(typeof started!=='undefined'&&!started)return;try{keysClear();}catch(e){}render();if(!D.open)D.showModal();}
{const ip=isPaused;isPaused=function(){return ip.apply(this,arguments)||D.open;};}
D.addEventListener('click',e=>{if(e.target===D)D.close();});D.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role=button]')){e.preventDefault();e.target.click();}});
addEventListener('keydown',e=>{if((e.key==='t'||e.key==='T')&&!e.target.closest('input,textarea')&&typeof started!=='undefined'&&started){if(D.open)D.close();else open();}});
function navBtn(){const sk=document.getElementById('mvNavSkills');if(!sk||document.getElementById('mvNavTalents'))return;const b=document.createElement('button');b.id='mvNavTalents';b.className='mv-nav-skills oz-nav-tal';b.innerHTML='<i></i><span>Talents</span><b class="ozt-dot" hidden></b>';b.onclick=open;sk.after(b);}
navBtn();setInterval(()=>{navBtn();try{relabel();}catch(e){}const d=document.querySelector('#mvNavTalents .ozt-dot');if(d)d.hidden=!(avail()>0);},1000);
/* ---------- weapons that follow the tree ---------- */
const WT={bulwark:'shield',ravager:'great',bloom:'blossom',rot:'scythe',brood:'hive',golem:'hammer',mirror:'mirrorgun',alch:'rifle'};
function weapon(x,tid,k,sw){const w=WT[tid];if(!w)return;x.save();x.scale(k,k);x.lineCap='round';x.lineJoin='round';
 const stick=(len,c1,c2)=>{x.strokeStyle=c1;x.lineWidth=5;x.beginPath();x.moveTo(0,8);x.lineTo(0,-len);x.stroke();x.strokeStyle=c2;x.lineWidth=2;x.beginPath();x.moveTo(-1,6);x.lineTo(-1,-len+2);x.stroke();};
 if(w==='great'){x.fillStyle='#5a2a12';x.fillRect(-3,-6,6,22);x.fillStyle='#c98a3a';x.fillRect(-12,-9,24,5);const g=x.createLinearGradient(-9,-70,9,-10);g.addColorStop(0,'#ffd0a0');g.addColorStop(.5,'#ff6a3d');g.addColorStop(1,'#8a2010');x.fillStyle=g;x.beginPath();x.moveTo(-9,-9);x.lineTo(-11,-58);x.quadraticCurveTo(0,-80,11,-58);x.lineTo(9,-9);x.closePath();x.fill();x.strokeStyle='#ffe0c0';x.lineWidth=1.5;x.stroke();x.fillStyle='rgba(255,170,90,.7)';x.beginPath();x.arc(0,-40,4,0,7);x.fill();}
 else if(w==='shield'){x.fillStyle='#bfe9ff';x.fillRect(-2,-40,4,34);x.fillStyle='#7a5a2e';x.fillRect(-8,-8,16,4);const g=x.createLinearGradient(14,-50,40,10);g.addColorStop(0,'#e6f6ff');g.addColorStop(1,'#3a7aa0');x.fillStyle=g;x.beginPath();x.moveTo(12,-46);x.lineTo(40,-46);x.lineTo(40,0);x.quadraticCurveTo(26,16,12,0);x.closePath();x.fill();x.strokeStyle='#d0a050';x.lineWidth=3;x.stroke();x.fillStyle='#7fd8ff';x.beginPath();x.arc(26,-22,6,0,7);x.fill();}
 else if(w==='blossom'){stick(62,'#6a4a2a','#a07a4a');for(let i=0;i<6;i++){const a=i/6*6.283;x.fillStyle=i%2?'#ffb0d8':'#ffe0f0';x.beginPath();x.ellipse(Math.cos(a)*8,-66+Math.sin(a)*8,7,4,a,0,7);x.fill();}x.fillStyle='#ffe58a';x.beginPath();x.arc(0,-66,4,0,7);x.fill();x.fillStyle='#8fff8a';x.beginPath();x.ellipse(5,-40,6,3,.6,0,7);x.fill();}
 else if(w==='scythe'){stick(66,'#3a2a3a','#6a4a6a');x.fillStyle='#b45cff';x.strokeStyle='#e0c0ff';x.lineWidth=1.5;x.beginPath();x.moveTo(0,-66);x.quadraticCurveTo(-34,-70,-40,-44);x.quadraticCurveTo(-26,-58,0,-56);x.closePath();x.fill();x.stroke();x.fillStyle='#9be04a';for(const [a,b] of [[-22,-60],[-32,-52],[-12,-63]]){x.beginPath();x.arc(a,b,2.4,0,7);x.fill();}}
 else if(w==='hive'){stick(58,'#5a3a6a','#9a6aaa');const g=x.createRadialGradient(-3,-70,2,0,-66,14);g.addColorStop(0,'#f0d0ff');g.addColorStop(1,'#7a3ab0');x.fillStyle=g;x.beginPath();x.ellipse(0,-66,12,14,0,0,7);x.fill();x.strokeStyle='#d9a8ff';x.lineWidth=1.5;for(let i=-1;i<=1;i++){x.beginPath();x.moveTo(-11,-66+i*7);x.lineTo(11,-66+i*7);x.stroke();}x.fillStyle='#c77dff';x.beginPath();x.arc(10,-50,4,0,7);x.arc(-9,-48,3,0,7);x.fill();}
 else if(w==='hammer'){stick(44,'#5a3a1a','#9a6a3a');x.fillStyle='#ffb347';x.strokeStyle='#5a2a06';x.lineWidth=2;x.beginPath();x.roundRect(-16,-62,32,20,4);x.fill();x.stroke();x.fillStyle='#fff0c0';x.fillRect(-12,-58,6,12);}
 else if(w==='mirror'){x.fillStyle='#e8f4ff';x.fillRect(-2,-30,4,24);const g=x.createLinearGradient(10,-56,40,10);g.addColorStop(0,'#ffffff');g.addColorStop(.5,'#b8c8d8');g.addColorStop(1,'#f0f8ff');x.fillStyle=g;x.beginPath();x.moveTo(10,-56);x.lineTo(42,-56);x.lineTo(42,4);x.lineTo(10,4);x.closePath();x.fill();x.strokeStyle='#d0a050';x.lineWidth=3;x.stroke();x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=2;x.beginPath();x.moveTo(16,-46);x.lineTo(28,-30);x.moveTo(20,-50);x.lineTo(36,-28);x.stroke();}
 else if(w==='flask'){stick(56,'#5a3a1a','#a0703a');x.fillStyle='#a07a3c';x.fillRect(-8,-62,16,8);x.fillStyle='#ff9a3a';x.beginPath();x.arc(0,-68,9,0,7);x.fill();x.fillStyle='#e8f4ff';x.fillRect(-2.5,-80,5,6);x.fillStyle='rgba(255,255,255,.6)';x.beginPath();x.arc(-3,-71,2.5,0,7);x.fill();x.fillStyle='#ffd257';x.beginPath();x.arc(8,-40,4,0,7);x.fill();}
 else if(w==='rifle'){x.rotate(1.25);x.fillStyle='#5a3a1a';x.fillRect(-14,-4,16,8);const g1=x.createLinearGradient(0,-6,0,6);g1.addColorStop(0,'#ffe08b');g1.addColorStop(1,'#a0702a');x.fillStyle=g1;x.fillRect(0,-5,62,10);x.fillStyle='#d8a040';x.fillRect(60,-7,8,14);x.fillStyle='rgba(255,154,58,.85)';x.beginPath();x.ellipse(22,9,9,6,0,0,7);x.fill();x.strokeStyle='#7ff6ff';x.lineWidth=2;x.beginPath();x.moveTo(22,4);x.quadraticCurveTo(34,0,44,-5);x.stroke();x.fillStyle='rgba(255,255,255,.7)';x.beginPath();x.arc(70,-10,4,0,7);x.arc(76,-16,2.5,0,7);x.fill();}
 else if(w==='mirrorgun'){const g2=x.createLinearGradient(10,-56,40,10);g2.addColorStop(0,'#ffffff');g2.addColorStop(.5,'#b8c8d8');g2.addColorStop(1,'#f0f8ff');x.fillStyle=g2;x.beginPath();x.moveTo(8,-52);x.lineTo(40,-52);x.lineTo(40,0);x.quadraticCurveTo(24,10,8,0);x.closePath();x.fill();x.strokeStyle='#d0a050';x.lineWidth=3;x.stroke();
  x.fillStyle='#c9902a';x.fillRect(38,-32,22,9);x.beginPath();x.moveTo(58,-36);x.lineTo(70,-40);x.lineTo(70,-15);x.lineTo(58,-19);x.closePath();x.fill();x.fillStyle='#fff';x.beginPath();x.ellipse(68,-27,3,9,0,0,7);x.fill();x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=2;x.beginPath();x.moveTo(14,-44);x.lineTo(26,-28);x.stroke();}
 x.restore();}
let swingT=0,lastAtk=0;
function drawWeapon(t){const tr=lockedTree();if(!tr||!WT[tr.id])return;const dir=p.dir||1;
 if(p.attack>lastAtk+.05)swingT=.35;lastAtk=p.attack;swingT=Math.max(0,swingT-1/60);const sw=swingT>0?1-swingT/.35:0;
 const big=WT[tr.id]==='great';g.save();g.translate(p.x+dir*16,p.y-46);g.scale(dir,1);
 const base=WT[tr.id]==='shield'||WT[tr.id]==='mirror'?.15:.45,ang=base+(sw?(-1.6+sw*3.2)*(big?1.3:.8):Math.sin(t*2)*.04);
 if(sw&&(big||WT[tr.id]==='shield'||WT[tr.id]==='hammer')){g.globalAlpha=.55*(1-sw);g.strokeStyle=big?'#ff6a3d':tr.color;g.lineWidth=big?16:7;g.shadowColor=g.strokeStyle;g.shadowBlur=14;g.beginPath();g.arc(0,0,big?80:56,base-1.6*(big?1.3:.8)-1.57,ang-1.57);g.stroke();g.shadowBlur=0;g.globalAlpha=1;}
 g.rotate(ang);weapon(g,tr.id,big?.95:.75,sw);g.restore();}
/* ---------- Talent Keeper NPC (resets for gold) ---------- */
const keeperPos=()=>typeof CAMP!=='undefined'?{x:CAMP.x-150,y:CAMP.y+70}:null;
const keeperHere=()=>{const k=keeperPos();return k&&!(typeof story!=='undefined'&&story.zone>0&&!(typeof zones!=='undefined'&&zones[story.zone]&&zones[story.zone].camp!==false))?k:k;};
const resetCost=()=>Math.round(25+(p.level|0)*(p.level|0)*2.5);
function drawKeeper(t){const k=keeperHere();if(!k||Math.abs(k.x-camera.x-innerWidth/2)>innerWidth*1.2)return;const bob=Math.sin(t*2)*2;g.save();g.translate(k.x,k.y);
 g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(0,2,22,7,0,0,7);g.fill();
 const gr=g.createLinearGradient(0,-80,0,0);gr.addColorStop(0,'#3a2a5a');gr.addColorStop(1,'#1a1228');g.fillStyle=gr;g.beginPath();g.moveTo(-20,0);g.quadraticCurveTo(-18,-50,0,-78+bob);g.quadraticCurveTo(18,-50,20,0);g.closePath();g.fill();g.strokeStyle='#d0a050';g.lineWidth=2;g.stroke();
 g.fillStyle='#0a0810';g.beginPath();g.ellipse(0,-58+bob,8,9,0,0,7);g.fill();g.fillStyle='#ffd257';g.beginPath();g.arc(-3,-59+bob,1.6,0,7);g.arc(3,-59+bob,1.6,0,7);g.fill();
 g.strokeStyle='#7a5a2e';g.lineWidth=3;g.beginPath();g.moveTo(22,4);g.lineTo(22,-70);g.stroke();const gl=.6+.3*Math.sin(t*3);g.fillStyle='rgba(63,224,200,'+gl+')';g.shadowColor='#3fe0c8';g.shadowBlur=16;g.beginPath();g.arc(22,-76,7,0,7);g.fill();g.shadowBlur=0;
 g.font='bold 13px Georgia,serif';g.textAlign='center';g.fillStyle='#ffe3a1';g.strokeStyle='#000';g.lineWidth=3;g.strokeText('Talent Keeper',0,-92);g.fillText('Talent Keeper',0,-92);g.restore();}
const KB=document.createElement('button');KB.id='ozKeeperBtn';KB.type='button';KB.className='oz-keeper-btn';KB.innerHTML='<kbd>E</kbd><span>Talent Keeper</span>';KB.hidden=true;document.body.appendChild(KB);
const KD=document.createElement('dialog');KD.id='ozKeeper';KD.className='mv-panel oz-tal';document.body.appendChild(KD);
function openKeeper(){const c=resetCost(),sp=spent(),lk=lockedTree();KD.innerHTML='<button class="close mv-x ozt-x" type="button" aria-label="Close">×</button><small class="mv-kicker">Talent Keeper</small><h2>Unlearn your path?</h2><p>'+(sp?'You walk the <b style="color:'+lk.color+'">'+esc(lk.name)+'</b> path with '+sp+' points spent. For <b style="color:#ffd257">'+c+' gold</b> I will wash them all away so you can choose again. Your skins from that path will be put away.':'You have not chosen a path yet. Come back once you have.')+'</p><p class="ozt-msg"></p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="ozk-no">Not now</button><button type="button" class="ozk-yes"'+(sp?'':' disabled')+'>Reset for '+c+' gold</button></div>';
 KD.querySelector('.ozt-x').onclick=KD.querySelector('.ozk-no').onclick=()=>KD.close();
 const Y=KD.querySelector('.ozk-yes');Y.onclick=()=>{if((p.gold|0)<c){KD.querySelector('.ozt-msg').textContent='You need '+c+' gold (you have '+(p.gold|0)+').';return;}if(!Y.dataset.arm){Y.dataset.arm=1;Y.textContent='Confirm: spend '+c+' gold';return;}p.gold-=c;respec();TAL.refunded=false;try{float(p.x,p.y-130,'Talents reset · −'+c+' gold','#ffd257');sfx('level');}catch(e){}KD.close();try{hud();}catch(e){}};
 if(!KD.open)KD.showModal();}
KB.onclick=openKeeper;
const nearKeeper=()=>{const k=keeperHere();return k&&typeof started!=='undefined'&&started&&d2(p,k)<80;};
addEventListener('keydown',e=>{if((e.key==='e'||e.key==='E')&&nearKeeper()&&!document.querySelector('dialog[open]')){e.stopImmediatePropagation();e.preventDefault();openKeeper();}},true);
setInterval(()=>{KB.hidden=!nearKeeper()||!!document.querySelector('dialog[open]');},250);
const css=document.createElement('style');css.textContent=`
.oz-keeper-btn{width:auto!important;height:auto!important;min-height:0!important;max-height:56px!important;top:auto!important;right:auto!important;position:fixed!important;left:50%!important;bottom:120px!important;transform:translateX(-50%);z-index:30;display:flex!important;gap:8px;align-items:center;padding:10px 16px;border-radius:14px;border:2px solid #d0a050;background:#1b1610ee;color:#ffe3a1;font:700 15px Georgia,serif}.oz-keeper-btn[hidden]{display:none!important}
#ozKeeper{width:min(460px,92vw)}#ozKeeper h2{font:700 22px Georgia,serif;color:#ffe3a1;margin:4px 0}#ozKeeper p{color:#e2d4b2}
.ozt-tree.tlock{filter:grayscale(.85) brightness(.6)}.ozt-tree.tlock .ozt-node,.ozt-tree.tlock .ozt-skin{pointer-events:none}
.ozt-lockmsg{position:absolute;z-index:3;left:50%;top:40%;transform:translate(-50%,-50%);padding:10px 14px;border-radius:12px;background:#0d0f12ee;border:2px solid #8a6a3a;color:#ffe3a1;font:700 14px Georgia,serif;text-align:center;white-space:nowrap;filter:none}
.ozt-wpn{width:44px;height:44px;flex:none;border-radius:50%;background:radial-gradient(circle,#2a2f38,#121418);border:2px solid #8a6a3a;margin-right:2px}.ozt-keep{color:#b9a47c;font-size:12px;margin-left:auto}
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
globalThis.OozeTalents={TREES,TAL,open,render,learn,respec,lockedTree,openKeeper,resetCost,keeperPos,WT,avail,spentIn,agg:()=>AG,apply,FX,skinDef,trees};
})();
