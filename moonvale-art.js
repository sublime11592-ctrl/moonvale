'use strict';
/* Painted art pack (art/manifest.js, built by tools/process_art.py from art-src/).
   Zone maps for the camp, Hollow Sanctum and Duskfen Marsh; hero, NPC and enemy sprites; round skill icons.
   Every sprite is drawn at its own aspect ratio. Left/right views are mirrored copies, never stretched.
   Add ?classic to the URL to play with the original character sprites. */
(()=>{const A=globalThis.MOONVALE_ART;if(!A||/[?&]noart\b/.test(location.search))return;
 const classic=/[?&]classic\b/.test(location.search);
 const load=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src;});
 const mirror=img=>{const c=document.createElement('canvas');c.width=img.naturalWidth||img.width;c.height=img.naturalHeight||img.height;const x=c.getContext('2d');x.translate(c.width,0);x.scale(-1,1);x.drawImage(img,0,0);return c;};
 const frame=(img,extra={})=>({img,sx:0,sy:0,sw:img.naturalWidth||img.width,sh:img.naturalHeight||img.height,...extra});
 // class -> painted hero. Spellweavers: dwarves get the Frostcaller, everyone else the Embermage.
 // Rangers have no painted sheet yet and keep their original sprite.
 const heroFor=cls=>cls==='druid'?'warden':cls==='warrior'?'warrior':cls==='mage'?((typeof customHero!=='undefined'&&customHero?.race==='dwarf')?'frostcaller':'embermage'):null;
 // staff-bearers are drawn a little taller so the body (not the staff tip) matches the other heroes
 const heroScale={warden:1.1,embermage:1.1,frostcaller:1.0,warrior:1.0};
 // NPC id -> painted NPC (scale relative to the 77px NPC height the game uses)
 const npcFor={chronicler:'keeper',caravan:'ranger',wayfarer:'bard',quartermaster:'goblin'};
 const npcScale={keeper:1.3,ranger:1.36,bard:1.3,goblin:1.12,witch:1.3};
 const enemyScale={wraith:1.15,wisp:1.1,slime:1.05,boar:1.1,boss:1.0};
 const heroes={},enemies={},npcs={},zoneArt={};
 (async()=>{
  for(const [z,src] of Object.entries(A.zones||{})){const img=await load(src);if(img){zoneArt[z]=img;if(zones[z])zones[z].image=img;}}
  if(!classic){
   for(const [k,src] of Object.entries(A.heroes||{})){const img=await load(src);if(!img)continue;const back=A.heroesBack?.[k]?await load(A.heroesBack[k]):null;const e={heightScale:heroScale[k]||1};
    heroes[k]={front:frame(img,e),back:frame(back||img,e),left:frame(mirror(img),e),right:frame(img,e)};}
   for(const [type,src] of Object.entries(A.enemies||{})){const img=await load(src);if(!img)continue;const e={enemyScale:enemyScale[type]||1};
    enemies[type]={front:frame(img,e),back:frame(img,e),left:frame(img,e),right:frame(mirror(img),e)};}
   for(const n of A.npcs||[]){const i=await load(n.src);if(i)npcs[n.name]={front:frame(i,{scale:npcScale[n.name]||1.3}),left:frame(i,{scale:npcScale[n.name]||1.3}),right:frame(mirror(i),{scale:npcScale[n.name]||1.3})};}
  }
  if(A.icons)document.documentElement.style.setProperty('--mv-icons','url("'+A.icons+'")'),document.body.classList.add('mv-art-icons');
  MoonMotion.art={
   hero:(cls,face)=>{const k=heroFor(cls);return k&&heroes[k]?.[face]||null;},
   heroKey:cls=>{const k=heroFor(cls);return k&&heroes[k]?k:null;},
   enemy:(o,face)=>{const kind=MoonZones.kindFor(story.zone);let t=o.type;if(t==='wisp'&&kind==='chapel'&&enemies.wraith)t='wraith';return enemies[t]?.[face]||null;}
  };
  if(typeof heroFrame==='function'){const before=heroFrame;heroFrame=function(cls,face){const k=heroFor(cls);return (k&&heroes[k]?.[face])||before(cls,face);};}
  if(typeof npcFrame==='function'){const before=npcFrame;npcFrame=function(n,face='front'){
   let k=npcFor[n.id];if(!k&&n.hub>0){const kind=MoonZones.kindFor(story.zone);k=kind==='marsh'?'witch':kind==='chapel'?'keeper':null;}
   const set=k&&npcs[k];if(!set)return before(n,face);return set[face]||set.front;};}
 })();
 // Keep the painted map in place even if an older layer re-assigns the zone image.
 {const before=update;update=function(dt){before(dt);const img=zoneArt[story.zone];if(img&&art!==img)art=img;};}
 // Skill icons: one 5x4 sheet (index = row*5+col). Each class's five skills point at the closest painting.
 //  0 ice shards 1 snowflake 2 frost vortex 3 fire swirl 4 flame | 5 meteor streak 6 arcane arrow 7 arcane sigil 8 lightning 9 thorns
 // 10 leaf 11 poison skull 12 slash 13 shield 14 whirlwind | 15 arrow volley 16 eagle 17 charging beast 18 potion 19 lantern
 const ICONS={mage:[6,1,5,2,7],warrior:[12,14,8,17,13],ranger:[11,15,9,2,16],druid:[3,9,10,0,13]};
 {const before=hud;hud=function(){before();if(!document.body.classList.contains('mv-art-icons'))return;const map=ICONS[p.cls];if(!map)return;
  [...$('hotbar').children].forEach((b,i)=>{const gl=b.querySelector('.glyph');const k=map[i];if(gl&&k!=null){gl.style.setProperty('--mvpos',((k%5)/4*100)+'% '+(Math.floor(k/5)/3*100)+'%');gl.classList.add('mv-icon');}});};}
})();
