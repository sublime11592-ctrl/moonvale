'use strict';
/* Oozevale balance pass (Oct 19): the hero was too strong and levelled too fast.
   - Mobs are scaled once, when they first appear, by an effective level:
       eff = max(mob level, zone level) + 0.35 × (hero level − that level, if positive)
     so later zones stay hard and starter mobs never become free. HP ×1.1 × (1+0.16·(eff−1)),
     damage ×1.6 × (1+0.11·(eff−1)), aggro radius 125 → 125+12/zone (max 230). Bosses and elites use the same rule.
   - XP: kill XP ×0.5 (see MoonJuice.curve for the new, steeper level curve).
   - Pet hits ×0.6 and jellyling hits ×0.5 so the companions help but don't carry the fight.
   Tunables live in MoonBalance.cfg. */
(()=>{
if(typeof makeMob!=='function'||typeof damage!=='function'||typeof update!=='function')return;
const cfg={hp:1.1,hpL:.16,dmg:1.6,dmgL:.11,sync:.35,xp:.5,pet:.6,jelly:.5,zoneLv:1.6,aggro:12};
const zoneLevel=z=>1+(z||0)*cfg.zoneLv;
function scaleMob(m,zone){
 if(!m||m.bal)return m;
 const z=zone!=null?zone:(typeof story!=='undefined'?story.zone:0);
 const base=Math.max(m.level||1,zoneLevel(z)),hero=typeof p!=='undefined'?p.level:1,eff=base+cfg.sync*Math.max(0,hero-base);
 const hk=cfg.hp*(1+cfg.hpL*(eff-1)),dk=cfg.dmg*(1+cfg.dmgL*(eff-1));
 const frac=m.maxHp?m.hp/m.maxHp:1;m.maxHp=Math.round(m.maxHp*hk);m.hp=Math.round(m.maxHp*frac);
 m.damage=Math.round(m.damage*dk*10)/10;m.xp=Math.max(1,Math.round(m.xp*cfg.xp));m.bal={eff:+eff.toFixed(1),z};
 return m;}
// scale every live mob once (catches zone spawns that adjust stats after makeMob, and respawns)
function sweep(){if(typeof mobs==='undefined')return;for(const m of mobs){if(m.alive&&!m.bal)scaleMob(m);}}
{const b=damage;damage=function(m,a,c){const s=globalThis.OZ_SRC;if(s==='pet')a*=cfg.pet;else if(s==='jelly')a*=cfg.jelly;return b.call(this,m,a,c);};}
let acc=0;
{const b=update;update=function(dt){b(dt);try{acc+=dt;if(acc>.25){acc=0;sweep();}
 if(typeof started!=='undefined'&&started&&typeof story!=='undefined'){const R=Math.min(230,125+story.zone*cfg.aggro);if(R>125)for(const m of mobs)if(m.alive&&!m.aggro&&!(typeof CAMP!=='undefined'&&Math.hypot(p.x-CAMP.x,p.y-CAMP.y)<125)&&Math.hypot(m.x-p.x,m.y-p.y)<R)m.aggro=true;}}catch(e){console.warn('balance',e);}};}
// Gelguard was far ahead of the other two in packs: trim its two AoE/opener multipliers
try{const W=CLASSES.warrior.skills,set=(k,v)=>{const i=W.findIndex(x=>x[5]===k);if(i<0)return;W[i][6]=v;if(typeof originalSkills!=='undefined'&&originalSkills.warrior&&originalSkills.warrior[i])originalSkills.warrior[i][6]=v;};
 set('spin',1.45);set('sunder',1.8);if(typeof syncTraining==='function')syncTraining();}catch(e){}
globalThis.MoonBalance={cfg,scaleMob,zoneLevel,sweep};
})();
