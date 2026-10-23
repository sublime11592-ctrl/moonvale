'use strict';
/* Prismancer looks (mage slot). Three presets registered with MoonLooks. Until the real frame sheets arrive
   (REQUESTS-prismancer.md → art-src/ooze/incoming/prismancer/), each look uses tinted copies of the Chrome Veil
   frames from art/prismancer/ (tools/prism_placeholder.py). Loaded before the creator so the class shows as playable. */
(()=>{
const L=globalThis.MoonLooks,A=globalThis.MOONVALE_ANIM,P=globalThis.PRISM_PLACEHOLDER||{};if(!L||!A||!A.chars)return;
const base=A.chars.chromeveil;if(!base)return;
const defs=[
 {id:'prismpearl',name:'Pearl Prismancer',tag:'Chrome & pearl',lore:'Silver-chrome and pearl plate under a cape of iridescent soap-bubble ooze. A chrome hand-mirror buckler and a belt of glowing vials.'},
 {id:'prismgilt',name:'Gilded Alchemist',tag:'Gold & amber brew',lore:'Gold-washed chrome, an amber bubble cape and a bandolier of bubbling orange elixirs.'},
 {id:'prismtide',name:'Tideglass Mirror',tag:'Teal mirror',lore:'Pale chrome with teal tideglass inlays; the bubble cape ripples like a calm sea.'}];
for(const d of defs){d.cls='mage';d.placeholder=!P[d.id]||true;const c={};for(const k in base)c[k]={...base[k],char:d.id,src:(P[d.id]&&P[d.id][k])||base[k].src};A.chars[d.id]=c;
 if(globalThis.OOZE_LOOKS&&OOZE_LOOKS.chromeveil)OOZE_LOOKS[d.id]={...OOZE_LOOKS.chromeveil};}
L.LOOKS.mage=defs;const by=Object.fromEntries(defs.map(d=>[d.id,d]));
const g=L.get;L.get=id=>by[id]||g(id);
L.available=id=>!!(L.get(id)&&L.animated(id));
L.forClass=function(cls,want){const w=want&&L.get(want);if(w&&w.cls===cls&&L.available(want))return want;return L.first(cls);};
// frame sheets for the motion renderer (it built its sheet table before this file loaded)
const MM=typeof MoonMotion!=='undefined'?MoonMotion:globalThis.MoonMotion;if(MM&&MM.anim){const an=MM.anim;an.sheets=an.sheets||{};for(const d of defs){const set=an.sheets[d.id]={};for(const [name,m] of Object.entries(A.chars[d.id])){const img=new Image();img.decoding='async';const e={...m,img,ok:false};img.onload=()=>{e.ok=true;};img.src=m.src;set[name]=e;}
 if(an.meta&&an.meta.static&&an.meta.static.chromeveil)an.meta.static[d.id]=an.meta.static.chromeveil;}}
const isPrism=cls=>{if(cls!=='mage')return null;const cs=globalThis.MoonCreator&&MoonCreator.state,dl=document.getElementById('classDialog');const h=typeof customHero!=='undefined'?customHero:null;const w=(cs&&dl&&dl.open&&by[cs.hero])?cs.hero:h&&h.look;return by[w]?w:'prismpearl';};
// painted still (sizing + fallback) = the Chrome Veil still; sheets = the Prismancer look
let wrapped=false;const wrap=()=>{const art=MM&&MM.art;if(wrapped||!art||!art.heroKey)return;wrapped=true;const hk=art.heroKey,hr=art.hero;
 const veil=(fn)=>{const h=typeof customHero!=='undefined'?customHero:null;const old=h&&h.look;if(h)h.look='chromeveil';try{return fn();}finally{if(h)h.look=old;}};
 art.heroKey=cls=>{const k=isPrism(cls);return k&&MM.anim.sheets[k]?k:hk(cls);};
 art.hero=(cls,face)=>{if(isPrism(cls))return veil(()=>hr('ranger',face));return hr(cls,face);};};
wrap();const iv=setInterval(()=>{wrap();if(wrapped)clearInterval(iv);},200);
globalThis.PrismLooks={defs};
})();
