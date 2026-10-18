'use strict';
/* Moonvale painted-hero creator (v1).
   Replaces the old ancestry/class/preset screens inside #classDialog with one screen that shows the exact
   painted hero you will play, animated from art/anim (idle → walk → strike/cast; tap the stage or the buttons).
   - Heroes: Warden (Druid), Sentinel (Warrior), Embermage and Frostcaller (both Spellweaver). Ranger has no
     painted art yet: shown as "Coming soon" and not selectable.
   - Options kept are only ones you can see on the painted hero: hero choice, aura colour (a glow drawn around
     the real sprite in game), plus name and heritage (heritage = racial ability; it doesn't change the look and says so).
   - Saves: customHero.paint ('embermage'|'frostcaller') and customHero.accent survive save/load.
   The old dialog content stays in the DOM (hidden) so the existing enter() chain and saves keep working. */
(()=>{
 const A=globalThis.MOONVALE_ANIM,dlg=document.getElementById('classDialog');if(!A||!A.chars||!dlg)return;
 const $q=(s,r=document)=>r.querySelector(s);
 const HEROES=[
  {key:'warden',cls:'druid',name:'Warden',tag:'Druid',glow:'#8fe8a0',zone:'art/zone-camp.webp',lore:'A keeper of the moonlit groves. Roots bind, starlight burns, and wounds close at the Warden’s word.'},
  {key:'warrior',cls:'warrior',name:'Sentinel',tag:'Warrior',glow:'#f2c879',zone:'art/zone-chapel.webp',lore:'Steel, shield and stubborn courage. The Sentinel holds the line so the lanterns stay lit.'},
  {key:'embermage',cls:'mage',name:'Embermage',tag:'Spellweaver',glow:'#ff9a4d',zone:'art/zone-marsh.webp',lore:'A wandering spellweaver whose staff burns with an ember that never goes out.'},
  {key:'frostcaller',cls:'mage',name:'Frostcaller',tag:'Spellweaver',glow:'#9fd8ff',zone:'art/zone-chapel.webp',lore:'A mountain-born spellweaver. Frost answers the crystal staff; foes slow, then shatter.'},
  {key:'ranger',cls:'ranger',name:'Ranger',tag:'Ranger',locked:true,lore:'Bows and snares. The Ranger’s painted art is still being made.'}
 ];
 const ACCENTS=[['','None'],['#cfe3ff','Moonsilver'],['#ffb15e','Ember'],['#8ff0a0','Verdant'],['#c79dff','Amethyst'],['#ffd98a','Gilded']];
 const ACC=new Set(ACCENTS.map(a=>a[0]).filter(Boolean));
 const RACES=(typeof selectableRaces!=='undefined'?selectableRaces:['humans']).filter(r=>typeof heritages!=='undefined'?heritages[r]:true);
 const raceInfo=r=>(typeof heritages!=='undefined'&&heritages[r])||{name:r,trait:''};
 const ICONS={mage:[6,1,5,2,7],warrior:[12,14,8,17,13],ranger:[11,15,9,2,16],druid:[3,9,10,0,13]};
 const iconPos=k=>((k%5)/4*100)+'% '+(Math.floor(k/5)/3*100)+'%';
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

 // ---------- persistence of the painted choice + aura ----------
 if(typeof validCustomHero==='function'){const before=validCustomHero;validCustomHero=function(v){const h=before(v);if(h&&v){if(v.paint==='embermage'||v.paint==='frostcaller')h.paint=v.paint;if(ACC.has(v.accent))h.accent=v.accent;}return h;};}
 if(typeof MoonMotion!=='undefined')(MoonMotion.accent=()=>{const a=typeof customHero!=='undefined'&&customHero?.accent;return a&&ACC.has(a)?a:null;});

 // ---------- sheets ----------
 const imgs={};const load=src=>imgs[src]||(imgs[src]=new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src;}));
 const sheet=(k,a)=>A.chars[k]&&A.chars[k][a];
 const ready={};
 async function prep(k){if(ready[k])return ready[k];const c=A.chars[k];if(!c)return null;const out={};await Promise.all(Object.entries(c).map(async([a,m])=>{const i=await load(m.src);if(i)out[a]={...m,img:i};}));return ready[k]=out;}

 // ---------- state ----------
 const S={hero:'embermage',race:'humans',accent:'',name:'Wanderer',mode:'auto',seq:null,t:0,last:0,flip:false,spell:-1,raf:0,open:false};

 // ---------- DOM ----------
 const root=document.createElement('section');root.id='mvCreator';root.setAttribute('aria-label','Create your hero');
 root.innerHTML=`
 <div class="mvc-stage" id="mvcStage">
  <div class="mvc-bg" id="mvcBg"></div><div class="mvc-vignette"></div>
  <div class="mvc-head"><small>Choose your hero</small><h2>Moonvale</h2></div>
  <button class="mvc-x" id="mvcClose" aria-label="Close" hidden>×</button>
  <canvas id="mvcCanvas" aria-label="Animated preview of your hero"></canvas>
  <button class="mvc-arrow prev" id="mvcPrev" aria-label="Previous hero">‹</button>
  <button class="mvc-arrow next" id="mvcNext" aria-label="Next hero">›</button>
  <div class="mvc-anims" id="mvcAnims" role="group" aria-label="Preview animation">
   <button data-mode="idle">Idle</button><button data-mode="walk">Walk</button><button data-mode="attack">Attack</button><button data-mode="cast">Cast</button>
  </div>
  <p class="mvc-tap">Tap the hero to see a move</p>
 </div>
 <div class="mvc-panel">
  <nav class="mvc-heroes" id="mvcHeroes" aria-label="Heroes"></nav>
  <article class="mvc-card">
   <div class="mvc-title"><h3 id="mvcName"></h3><span class="mvc-role" id="mvcRole"></span></div>
   <p class="mvc-class" id="mvcClass"></p>
   <p class="mvc-desc" id="mvcDesc"></p>
   <div class="mvc-label">Signature spells</div>
   <div class="mvc-spells" id="mvcSpells"></div>
   <p class="mvc-spellhelp" id="mvcSpellHelp"></p>
  </article>
  <article class="mvc-card mvc-make">
   <div class="mvc-label">Make it yours</div>
   <label class="mvc-field"><span>Name</span><input id="mvcNameIn" maxlength="18" autocomplete="off" spellcheck="false"></label>
   <div class="mvc-sub">Aura <em>— a glow around your hero in the world</em></div>
   <div class="mvc-swatches" id="mvcAccents"></div>
   <div class="mvc-sub">Heritage <em>— grants a racial ability (G); your painted look stays the same</em></div>
   <div class="mvc-races" id="mvcRaces"></div>
  </article>
 </div>
 <footer class="mvc-foot">
  <button class="mvc-back" id="mvcBack">← Title</button>
  <button class="mvc-begin" id="mvcBegin">Enter Moonvale</button>
 </footer>`;
 dlg.appendChild(root);
 const cv=$q('#mvcCanvas',root),cx=cv.getContext('2d');

 function heroDef(k=S.hero){return HEROES.find(h=>h.key===k)||HEROES[0];}
 function buildHeroes(){
  $q('#mvcHeroes',root).innerHTML=HEROES.map(h=>`<button class="mvc-hero${h.locked?' locked':''}" data-mvhero="${h.key}" ${h.locked?'aria-disabled="true"':''} style="--hc:${h.glow||'#8a8070'}"><span class="mvc-portrait"><canvas width="112" height="112"></canvas>${h.locked?'<i class="mvc-lock">✦</i>':''}</span><b>${h.name}</b><small>${h.locked?'Coming soon':h.tag}</small></button>`).join('');
  root.querySelectorAll('[data-mvhero]').forEach(b=>b.onclick=()=>{const h=heroDef(b.dataset.mvhero);if(h.locked){flashMsg('The Ranger’s painted hero is coming soon.');return;}select(h.key);});
  HEROES.forEach(async h=>{const c=root.querySelector(`[data-mvhero="${h.key}"] canvas`);const x=c.getContext('2d');
   if(h.locked){const i=await load('art/npc-ranger.png');if(i){const s=Math.min(112/(i.width*.62),1e9);x.filter='grayscale(1) brightness(.55)';x.drawImage(i,i.width*.19,0,i.width*.62,i.width*.62,0,6,112,112);}return;}
   const r=await prep(h.key);const m=r&&r.idle;if(!m)return;const sc=112/(m.bodyH*.42);const sx=m.anchorX-56/sc,sy=m.baseY-m.bodyH*1.02;
   x.drawImage(m.img,sx,sy,112/sc,112/sc,0,0,112,112);});
 }
 function buildAccents(){$q('#mvcAccents',root).innerHTML=ACCENTS.map(([c,n])=>`<button class="mvc-sw${c?'':' none'}" data-acc="${c}" title="${n}" aria-label="Aura: ${n}" style="--sw:${c||'transparent'}"></button>`).join('');
  root.querySelectorAll('[data-acc]').forEach(b=>b.onclick=()=>{S.accent=b.dataset.acc;sync();});}
 function buildRaces(){$q('#mvcRaces',root).innerHTML=RACES.map(r=>{const i=raceInfo(r);return `<button class="mvc-race" data-race="${r}" style="--rc:${i.accent||'#d8b16a'}"><b>${esc(i.name)}</b><small>${esc((i.trait||'').split('·')[0].trim())}</small></button>`;}).join('');
  root.querySelectorAll('.mvc-race').forEach(b=>b.onclick=()=>{S.race=b.dataset.race;sync();warmOldArt();});}
 function select(k){S.hero=k;S.mode='auto';S.seq=null;S.t=0;S.spell=-1;sync();prep(k);}
 function sync(){
  const h=heroDef(),c=CLASSES[h.cls]||{};
  root.querySelectorAll('[data-mvhero]').forEach(b=>b.classList.toggle('on',b.dataset.mvhero===h.key));
  root.querySelectorAll('[data-acc]').forEach(b=>b.classList.toggle('on',b.dataset.acc===S.accent));
  root.querySelectorAll('.mvc-race').forEach(b=>b.classList.toggle('on',b.dataset.race===S.race));
  root.querySelectorAll('#mvcAnims button').forEach(b=>b.classList.toggle('on',b.dataset.mode===S.mode));
  $q('#mvcName',root).textContent=h.name;$q('#mvcRole',root).textContent=(c.role||'').split('·')[0].trim();
  $q('#mvcClass',root).textContent=(c.name||h.tag)+' · '+(c.role||'').split('·').slice(1).join('·').trim();
  $q('#mvcDesc',root).textContent=h.lore+' '+(c.desc||'');
  const map=ICONS[h.cls]||[];const sk=c.skills||[];
  const box=$q('#mvcSpells',root);
  if(box.dataset.cls!==h.cls){box.dataset.cls=h.cls;box.innerHTML=sk.map((s,i)=>`<button class="mvc-spell" data-spell="${i}"><span class="mvc-icon" style="--mvpos:${iconPos(map[i]??0)}"></span><small>${esc(s[0])}</small></button>`).join('');
   box.querySelectorAll('[data-spell]').forEach(b=>b.onclick=()=>{S.spell=+b.dataset.spell;sync();});}
  box.querySelectorAll('[data-spell]').forEach(b=>b.classList.toggle('on',+b.dataset.spell===S.spell));
  const sp=sk[S.spell]||null;$q('#mvcSpellHelp',root).innerHTML=sp?`<b>${esc(sp[0])}</b> — ${esc(sp[7]||'')}`:'Tap a spell to read it.';
  const ri=raceInfo(S.race);root.style.setProperty('--hero',h.glow||'#d8b16a');
  $q('#mvcBg',root).style.backgroundImage=h.zone?`url("${h.zone}")`:'';
  const ni=$q('#mvcNameIn',root);if(document.activeElement!==ni)ni.value=S.name;
  $q('#mvcBegin',root).textContent=started?'Return to the grove':'Enter Moonvale';
  $q('#mvcBack',root).hidden=!!started;$q('#mvcClose',root).hidden=!started;
  root.dataset.hero=h.key;
 }
 let msgT=0;function flashMsg(t){const e=$q('#mvcSpellHelp',root);e.textContent=t;clearTimeout(msgT);msgT=setTimeout(sync,2200);}

 // ---------- preview animation ----------
 // auto loop: idle 2.4s → walk 2 cycles → idle 1.2s → attack → idle 1.6s → cast → …
 const AUTO=[['idle',2.4],['walk',0],['idle',1.2],['attack',0],['idle',1.6],['cast',0]];
 function clipLen(m,mode){if(!m)return 1;if(mode==='walk')return 2*m.frames/(m.fps||10);return m.frames/(m.fps||10);}
 function current(set,dt){
  if(!S.seq){S.seq={i:0,t:0};}
  const q=S.seq;q.t+=dt;
  let mode,dur;
  if(S.mode==='auto'){[mode,dur]=AUTO[q.i%AUTO.length];}else{mode=S.mode;dur=0;}
  const m=set[mode]||set.idle;dur=dur||clipLen(m,mode)+(mode==='attack'||mode==='cast'?.35:0);
  if(q.t>=dur){if(S.mode==='auto')q.i++;else if(S.mode==='attack'||S.mode==='cast'){S.mode='auto';q.i=0;sync();}q.t=0;return current(set,0);}
  const fps=m.fps||10,n=m.frames;let f=Math.floor(q.t*fps);
  if(mode==='walk'){f%=n;f=(m.order&&m.order[f]!=null)?m.order[f]:f;}
  else if(mode==='idle'){f%=n;}
  else f=Math.min(n-1,f);
  return {m,f,mode,t:q.t};
 }
 function draw(ts){
  if(!S.open){S.raf=0;return;}
  S.raf=requestAnimationFrame(draw);
  const dt=Math.min(.05,(ts-(S.last||ts))/1000);S.last=ts;
  const r=cv.getBoundingClientRect();if(r.width<10)return;const dpr=Math.min(2.5,devicePixelRatio||1);
  const W=Math.round(r.width*dpr),H=Math.round(r.height*dpr);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,W,H);
  const set=ready[S.hero];if(!set||!set.idle)return;
  const cur=current(set,dt),m=cur.m;
  const body=Math.min(H*.6,W*.95);const k=body/(m.bodyH||260);const gx=W/2,gy=H*.86;
  // ground: soft shadow + faint sigil in the hero colour
  const hcol=heroDef().glow||'#d8b16a';
  cx.save();cx.translate(gx,gy);cx.scale(1,.3);const rg=cx.createRadialGradient(0,0,0,0,0,body*.42);rg.addColorStop(0,'rgba(0,0,0,.62)');rg.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=rg;cx.beginPath();cx.arc(0,0,body*.42,0,7);cx.fill();
  cx.strokeStyle=hcol;cx.globalAlpha=.35;cx.lineWidth=2*dpr;cx.beginPath();cx.arc(0,0,body*.36,0,7);cx.stroke();cx.globalAlpha=.18;cx.beginPath();cx.arc(0,0,body*.44,0,7);cx.stroke();cx.restore();
  // hero (same frames, anchor and body height the game uses)
  cx.save();cx.translate(gx,gy);
  if(cur.mode==='idle'){const br=Math.sin(ts/1000*2.3);cx.scale(1-.005*br,1+.01*br);}
  if(S.accent){cx.shadowColor=S.accent;cx.shadowBlur=14*dpr;}
  cx.drawImage(m.img,cur.f*m.cellW,0,m.cellW,m.cellH,-m.anchorX*k,-m.baseY*k,m.cellW*k,m.cellH*k);
  cx.restore();
  // release flare at the staff tip / palm on the key frame
  if((cur.mode==='attack'||cur.mode==='cast')&&m.emit&&m.key!=null){const kf=m.key,dtk=cur.t-kf/(m.fps||10);
   if(dtk>-.03&&dtk<.45){const e=m.emit[Math.min(kf,m.emit.length-1)];if(e){const ex=gx+(e[0]-m.anchorX)*k,ey=gy+(e[1]-m.baseY)*k,a=1-Math.max(0,dtk)/.45,R=(26+70*Math.max(0,dtk))*dpr;
    const g2=cx.createRadialGradient(ex,ey,0,ex,ey,R);g2.addColorStop(0,'rgba(255,255,255,'+(.9*a)+')');g2.addColorStop(.25,hexA(hcol,.75*a));g2.addColorStop(1,hexA(hcol,0));cx.globalCompositeOperation='lighter';cx.fillStyle=g2;cx.beginPath();cx.arc(ex,ey,R,0,7);cx.fill();cx.globalCompositeOperation='source-over';}}}
  root.dataset.anim=cur.mode;root.dataset.frame=cur.f;
 }
 function hexA(h,a){const n=parseInt(h.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a.toFixed(3)})`;}
 function play(mode){S.mode=mode;S.seq={i:0,t:0};sync();}
 let tapAlt=0;
 $q('#mvcStage',root).addEventListener('click',e=>{if(e.target.closest('button'))return;play(tapAlt++%2?'cast':'attack');});
 root.querySelectorAll('#mvcAnims button').forEach(b=>b.onclick=()=>play(b.dataset.mode));
 const step=d=>{const list=HEROES.filter(h=>!h.locked);const i=list.findIndex(h=>h.key===S.hero);select(list[(i+d+list.length)%list.length].key);};
 $q('#mvcPrev',root).onclick=()=>step(-1);$q('#mvcNext',root).onclick=()=>step(1);
 // swipe on the stage to change hero
 {let sx=null;const st=$q('#mvcStage',root);st.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;},{passive:true});st.addEventListener('touchend',e=>{if(sx==null)return;const d=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(d)>60)step(d<0?1:-1);},{passive:true});}
 $q('#mvcNameIn',root).addEventListener('input',e=>{S.name=e.target.value.slice(0,18);});
 $q('#mvcBack',root).onclick=()=>{const b=document.getElementById('backToTitle');if(b)b.click();else if(!started)dlg.close();};
 $q('#mvcClose',root).onclick=()=>{if(started)dlg.close();};

 // ---------- bridge to the existing creator state + enter() chain ----------
 function warmOldArt(){try{if(typeof creatorDraft!=='undefined'&&creatorDraft){creatorDraft.race=S.race;if(typeof renderCreator==='function')renderCreator();}}catch(e){}}
 let entering=0;
 function begin(){
  const h=heroDef();if(h.locked)return;
  const btn=$q('#mvcBegin',root);
  try{
   const name=(S.name||'').trim()||'Wanderer';
   creatorDraft={...(typeof makeRaceStyle==='function'?makeRaceStyle(S.race,creatorDraft?.sex||'male',creatorDraft?.presetStyle||0,name):creatorDraft),...(creatorDraft?.appearanceVersion===2?{appearanceVersion:2}:{}),race:S.race,name};
   if(h.cls==='mage')creatorDraft.paint=h.key;else delete creatorDraft.paint;
   if(S.accent)creatorDraft.accent=S.accent;else delete creatorDraft.accent;
   if(typeof renderCreator==='function')renderCreator();
   chooseClass(h.cls);
  }catch(e){console.warn('creator',e);}
  const wasStarted=started,stamp=Date.now();
  const tryEnter=()=>{
   const before=customHero;
   try{const name=(S.name||'').trim()||'Wanderer';if(creatorDraft){creatorDraft.race=S.race;creatorDraft.name=name;if(h.cls==='mage')creatorDraft.paint=h.key;else delete creatorDraft.paint;if(S.accent)creatorDraft.accent=S.accent;else delete creatorDraft.accent;}}catch(e){}
   try{enter();}catch(e){console.warn('enter',e);}
   const ok=!dlg.open&&started&&(!wasStarted||customHero!==before);
   if(ok){entering=0;btn.disabled=false;sync();return;}
   if(Date.now()-stamp>12000){btn.disabled=false;btn.textContent='Try again';entering=0;return;}
   btn.disabled=true;btn.textContent='Preparing your hero…';entering=setTimeout(tryEnter,350);
  };
  clearTimeout(entering);tryEnter();
 }
 $q('#mvcBegin',root).onclick=begin;

 function mount(){
  dlg.classList.add('mv-c2');S.open=true;
  const ch=typeof customHero!=='undefined'?customHero:null;
  if(started&&ch){S.name=ch.name||S.name;S.race=RACES.includes(ch.race)?ch.race:S.race;S.accent=ACC.has(ch.accent)?ch.accent:'';
   const k=(typeof MoonMotion!=='undefined')&&MoonMotion.art?.heroKey?.(p.cls);if(k)S.hero=k;}
  else{const d=typeof creatorDraft!=='undefined'?creatorDraft:null;if(d){S.race=RACES.includes(d.race)?d.race:S.race;}}
  if(!RACES.includes(S.race))S.race=RACES[0];
  sync();prep(S.hero);HEROES.forEach(h=>!h.locked&&prep(h.key));warmOldArt();
  if(!S.raf)S.raf=requestAnimationFrame(draw);
 }
 dlg.addEventListener('close',()=>{S.open=false;});
 for(const fn of ['showModal','show']){const orig=dlg[fn].bind(dlg);dlg[fn]=function(){const r=orig();mount();return r;};}
 buildHeroes();buildAccents();buildRaces();sync();
 if(dlg.open)mount();
 window.MoonCreator={state:S,select,play,begin,mount};
})();
