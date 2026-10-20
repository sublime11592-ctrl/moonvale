// Oozevale bestiary: zone-fitting creatures replace the generic slime/boar/wisp spawns.
// Game logic keeps the base type (slime = melee brawler, boar = charger, wisp = ranged spitter), so
// AI, balance scaling (oozevale-balance.js) and quests are unchanged; this layer adds identity,
// stat tilts, pack/flier behaviour, an elite per zone, telegraphs, hit flash/squash and frame art
// from art/beasts/ (tools/process_beasts.py). Creatures with no sheet yet use the old painted art.
(()=>{if(/[?&]nobeast\b/.test(location.search))return;
 // beh: pack (alerts kin), flier (hovers, quicker), tank, charger/spitter come from the base AI.
 const B=(id,name,base,o={})=>({id,name,base,hp:1,dmg:1,spd:1,xp:1,size:1,glow:'#5ff2d6',loot:null,...o});
 const ROSTER={
  0:[B('gloomwolf','Gloomfang Wolf','slime',{beh:'pack',spd:1.35,hp:.9,glow:'#4fe6d0',loot:'Gloomfang pelt'}),
     B('lanternmoth','Lantern Moth','wisp',{beh:'flier',hp:.85,glow:'#ffb04a',loot:'Glowing wing dust'}),
     B('capcrab','Capshell Crab','slime',{beh:'tank',hp:1.4,dmg:.85,spd:.75,xp:1.2,glow:'#b07cff',loot:'Mooncap shell'}),
     B('briarboar','Briarback Boar','boar',{glow:'#ff9a3c',loot:'Briar tusk'}),
     B('mossstag','Mossback Stag','boar',{elite:1,glow:'#7dffb0',loot:'Mossback antler'})],
  1:[B('willwisp',"Will-o'-wisp",'wisp',{beh:'flier',glow:'#64f0ff',loot:'Wisp ember'}),
     B('pondlurker','Pond Lurker','slime',{hp:1.1,glow:'#3fd7c0',loot:'Lurker scale'}),
     B('reedheron','Reedstalk Heron','boar',{beh:'flier',spd:1.1,glow:'#9cc8ff',loot:'Silver plume'}),
     B('lanternmoth','Lantern Moth','wisp',{beh:'flier',hp:.85,glow:'#ffb04a',loot:'Glowing wing dust'}),
     B('naiad','Moonwater Naiad','wisp',{elite:1,glow:'#7ae8ff',loot:'Naiad pearl'})],
  2:[B('wraith','Sanctum Wraith','wisp',{beh:'flier',glow:'#b48cff',loot:'Wraith shroud'}),
     B('armor','Hollow Armor','slime',{beh:'tank',hp:1.5,spd:.8,xp:1.2,glow:'#c9d6e8',loot:'Chrome rivet'}),
     B('gargbat','Gargoyle Bat','boar',{beh:'pack',hp:.8,spd:1.2,glow:'#ff8a4a',loot:'Stone wing'}),
     B('bellwarden','Bellwarden','boar',{elite:1,glow:'#ffd36a',loot:'Cracked chapel bell'})],
  3:[B('beetle','Meadow Beetle','boar',{beh:'tank',hp:1.2,glow:'#ffcf4a',loot:'Gilded carapace'}),
     B('scarecrow','Scarecrow','slime',{glow:'#ff9a3c',loot:'Lantern-gourd'}),
     B('bandit','Downs Bandit','wisp',{beh:'pack',glow:'#ffcf8a',loot:'Stolen coin purse'}),
     B('banditcap','Bandit Captain','boar',{elite:1,glow:'#ffb347',loot:'Captain’s brass badge'})],
  4:[B('frostwolf','Frost Wolf','slime',{beh:'pack',spd:1.35,hp:.9,glow:'#8fe8ff',loot:'Frost pelt'}),
     B('icestag','Ice Stag','boar',{hp:1.1,glow:'#a6f0ff',loot:'Rime antler'}),
     B('snowowl','Snow Owl','wisp',{beh:'flier',glow:'#d9f4ff',loot:'Snow plume'}),
     B('frostslime','Rime Slime','slime',{beh:'tank',hp:1.2,spd:.8,glow:'#7fd8ff',loot:'Frozen jelly'}),
     B('yeti','Rime Yeti','boar',{elite:1,glow:'#9fe8ff',loot:'Yeti fang'})],
  5:[B('bogtoad','Bog Toad','wisp',{glow:'#b6ff5a',loot:'Toad gland'}),
     B('marshlurker','Marsh Lurker','slime',{hp:1.15,glow:'#4fe6b0',loot:'Lurker claw'}),
     B('bogslime','Bog Slime','slime',{beh:'tank',hp:1.2,spd:.75,glow:'#a0ff6a',loot:'Peat jelly'}),
     B('fenmoth','Fen Moth','boar',{beh:'flier',hp:.85,glow:'#c08cff',loot:'Fen wing'}),
     B('bogmaw','Bogmaw Croc','boar',{elite:1,glow:'#7dff9a',loot:'Bogmaw tooth'})]
 };
 const ELITE={hp:2.6,dmg:1.45,xp:3,gold:3,size:1.35};
 const sheets={},meta=globalThis.OOZE_BEASTS||{};
 for(const [id,m] of Object.entries(meta))for(const k of ['a','b','idle'])if(m[k]){const img=new Image();img.decoding='async';const e={...m[k],img,ok:false,H:m.H};img.onload=()=>e.ok=true;img.src=m[k].src;(sheets[id]||(sheets[id]={}))[k]=e;}
 const zone=()=>typeof story!=='undefined'?story.zone:0;
 const eligible=m=>m.alive&&!m.beast&&m._bnone!==zone()+1&&m.type!=='boss'&&!m.ozTest&&m.maxHp<3000&&['slime','boar','wisp'].includes(m.type);
 function assign(m){
  const R0=ROSTER[zone()];if(!R0)return;const R=R0.filter(r=>meta[r.id]);const plain=R.filter(r=>!r.elite&&r.base===m.type);
  const zm=mobs.filter(o=>o.alive&&o.type!=='boss');
  let r=null;
  if(m.type==='boar'&&!zm.some(o=>o.beastElite)){r=R.find(x=>x.elite);}
  if(!r){if(!plain.length){m._bnone=zone()+1;return;}r=plain[m.id%plain.length];}
  const f=m.hp/(m.maxHp||1),el=r.elite?ELITE:{hp:1,dmg:1,xp:1,gold:1,size:1};
  m.beast=r.id;m.beastDef=r;m.beastElite=!!r.elite;m.name=(r.elite?'★ ':'')+r.name;m.color=r.glow;
  m.maxHp=Math.round(m.maxHp*r.hp*el.hp);m.hp=Math.max(1,Math.round(m.maxHp*f));m.damage*=r.dmg*el.dmg;m.speed*=r.spd;
  m.xp=Math.round((m.xp||10)*r.xp*el.xp);m.gold=Math.round((m.gold||5)*el.gold);if(r.elite){m.level+=2;m.elite=true;}
  m.beastSize=r.size*el.size;m.loot=r.loot;m.flier=r.beh==='flier';
 }
 const kin=(m)=>mobs.filter(o=>o!==m&&o.alive&&o.beast===m.beast&&Math.hypot(o.x-m.x,o.y-m.y)<220);
 {const before=update;update=function(dt){before(dt);
  for(const m of mobs){if(eligible(m)&&(m.bal||!globalThis.MoonBalance))assign(m);
   if(!m.beast||!m.alive)continue;
   if(m.beastDef.beh==='pack'&&m.aggro&&!m._packed){m._packed=1;kin(m).forEach(o=>{if(Math.hypot(o.x-p.x,o.y-p.y)<320)o.aggro=true;});}
   if(!m.aggro)m._packed=0;
   const v=m._lx===undefined?0:Math.hypot(m.x-m._lx,m.y-m._ly);m._mv=(m._mv||0)*.8+(dt>0?v/dt:0)*.2;m._lx=m.x;m._ly=m.y;
   if(m.x!==m._fx){if(Math.abs(p.x-m.x)>6)m._face=p.x<m.x?-1:1;}
   m._hitT=Math.max(0,(m._hitT||0)-dt);m._ph=(m._ph||0)+dt;}
 };}
 {const before=damage;damage=function(m,n,c){const hp=m&&m.hp;const r=before(m,n,c);if(m&&m.beast&&m.hp<hp)m._hitT=.22;return r;};}
 // Loot line on kill (the gold/xp payout is the game's own).
 {const before=damage;damage=function(m,n,c){const a=m&&m.alive;const r=before(m,n,c);if(a&&m&&!m.alive&&m.loot&&typeof log==='function'&&Math.random()<(m.elite?1:.35))log('Looted · '+m.loot);return r;};}
 const sheetOf=m=>{const s=sheets[m.beast];return s&&s.a&&s.a.ok&&s.b&&s.b.ok?s:null;};
 function frameOf(m,s){
  if(m._hitT>0)return [s.b,2];
  if(m.cast){const u=1-m.cast.left/(m.cast.total||1);return [s.b,u>.8?1:0];}
  if(m._mv>8){const i=2+Math.floor(m._ph*(m.flier?8:10))%4;return [s.a,i];}
  return [s.a,Math.floor(m._ph*2.5)%2];
 }
 function blit(sh,i,x,y,hpx,face,flash,sx=1,sy=1,alpha=1){
  const k=hpx/(sh.H||150),w=sh.w*k,h=sh.h*k;g.save();g.globalAlpha*=alpha;g.translate(x,y);g.scale(face*sx,sy);
  g.drawImage(sh.img,i*sh.w,0,sh.w,sh.h,-w/2,-sh.base*k,w,h);
  if(flash>0){g.globalCompositeOperation='lighter';g.globalAlpha=alpha*Math.min(1,flash);g.drawImage(sh.img,i*sh.w,0,sh.w,sh.h,-w/2,-sh.base*k,w,h);}
  g.restore();
 }
 const baseH={slime:70,boar:84,wisp:78};
 function telegraph(m){const c=m.cast;if(!c)return;const u=Math.min(1,1-c.left/(c.total||1));g.save();
  g.globalAlpha=.25+.5*u;g.strokeStyle=u>.8?'#ff5a3c':'#ffb04a';g.lineWidth=2+2*u;
  if(c.kind==='charge'){g.setLineDash([10,8]);g.beginPath();g.moveTo(c.x,c.y);g.lineTo(c.tx,c.ty);g.stroke();}
  else if(c.kind==='slam'){g.beginPath();g.ellipse(c.x,c.y,c.r*u,c.r*u*.45,0,0,7);g.stroke();g.globalAlpha=.12;g.fillStyle='#ff6a3c';g.fill();}
  else{g.fillStyle=m.color;g.globalAlpha=.5*u;g.beginPath();g.arc(m.x+(m._face||1)*14,m.y-baseH.wisp*.6,6+10*u,0,7);g.fill();}
  g.restore();}
 const prevActor=actor;
 actor=renderSprite=function(o,...rest){
  if(!o||o===p||!o.beast)return prevActor(o,...rest);
  telegraph(o);const s=sheetOf(o);if(!s)return prevActor(o,...rest);
  const [sh,i]=frameOf(o,s),hpx=(baseH[o.type]||80)*(o.beastSize||1)*(o.elite?1:1);
  const lift=o.flier?18+Math.sin(o._ph*3)*5:0,hit=o._hitT>0?o._hitT/.22:0;
  // ground shadow
  g.save();g.globalAlpha=.45;g.fillStyle='rgba(4,10,18,.8)';g.beginPath();g.ellipse(o.x,o.y+4,hpx*.38,hpx*.11,0,0,7);g.fill();g.restore();
  if(o.elite){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.18+.06*Math.sin(o._ph*4);const gr=g.createRadialGradient(o.x,o.y-hpx*.4,0,o.x,o.y-hpx*.4,hpx*.8);gr.addColorStop(0,o.color);gr.addColorStop(1,'transparent');g.fillStyle=gr;g.fillRect(o.x-hpx,o.y-hpx*1.3,hpx*2,hpx*1.6);g.restore();}
  const BOB={lanternmoth:'flap',gargbat:'flap',capcrab:'bob',beetle:'bob'}[o.beast];let by=0,fs=1;if(BOB&&sh===s.a){const w=o._mv>8?1:.5;if(BOB==='flap'){fs=1+.07*w*Math.sin(o._ph*16);by=3*w*Math.sin(o._ph*8);}else{by=Math.abs(Math.sin(o._ph*(o._mv>8?9:3)))*-3*w;}}
  const sq=(hit?1+.12*hit:1)*fs;blit(sh,i,o.x+(hit?-(o._face||1)*4*hit:0),o.y+7-lift+by,hpx,o._face||1,hit*.8,sq,BOB==='flap'&&!hit?1/fs:2-sq);
  if(typeof drawEnemyStatus==='function')drawEnemyStatus(o,hpx+lift);
 };
 // Death: real death frames (b 3..5), then fade.
 const dead=[];
 {const before=MoonMotion.addCorpse;MoonMotion.addCorpse=function(m){const s=m&&m.beast&&sheetOf(m);if(!s)return before(m);
  dead.push({x:m.x,y:m.y,s,face:m._face||1,h:(baseH[m.type]||80)*(m.beastSize||1),t:0,flier:m.flier});if(dead.length>12)dead.shift();};}
 {const before=MoonMotion.drawCorpses;MoonMotion.drawCorpses=function(){before();
  for(const d of dead){const i=3+Math.min(2,Math.floor(d.t/.18)),fade=Math.max(0,Math.min(1,(1.6-d.t)/.6));
   blit(d.s.b,i,d.x,d.y+7-(d.flier?Math.max(0,18-d.t*60):0),d.h,d.face,Math.max(0,.6-d.t*3),1,1,fade);}};}
 {const before=update;update=function(dt){before(dt);for(let i=dead.length-1;i>=0;i--){dead[i].t+=dt;if(dead[i].t>1.6)dead.splice(i,1);}};}
 globalThis.OozeBestiary={ROSTER,sheets,assign,dead};
})();
