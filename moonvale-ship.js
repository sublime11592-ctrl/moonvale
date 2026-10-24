/* Moonvale ship pass: NPC talk dialog, fallen/respawn screen, leftover-UI cleanup. Loaded after moonvale-title.js. */
(()=>{
const $$=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let quietJournal=false;
try{const oj=openJournal;openJournal=function(){if(quietJournal)return;return oj.apply(this,arguments);};}catch{}

/* ---------- NPC talk dialog (quest giver / lantern board) ---------- */
const D=document.createElement('dialog');D.id='mvTalk';
D.innerHTML='<div class="mvk-head"><span class="mvk-port"><img alt="" src="art/npc-witch.png"><b>!</b></span><div class="mvk-name"><small class="mv-kicker">Quest giver</small><h2>Vale</h2></div><button type="button" class="close mv-x" aria-label="Close">×</button></div><p class="mvk-line"></p><div class="mvk-quests"></div><div class="mvk-actions"><button type="button" class="mv-btn" id="mvkJournal">Quest journal</button><button type="button" class="mv-btn" id="mvkBye">Farewell</button></div>';
document.body.appendChild(D);
const close=()=>{if(D.open)D.close();};
D.querySelector('.mv-x').onclick=close;$$('mvkBye').onclick=close;
$$('mvkJournal').onclick=()=>{close();openJournal();};
D.addEventListener('click',e=>{if(e.target===D)close();});
const allQuests=()=>{try{return [...openingQuests,...regionQuests]}catch{return []}};
function count(q){try{return questCountText(q)}catch{return ''}}
function render(){
 let board=false;try{board=!!questGiver().board}catch{}
 D.classList.toggle('mvk-board',board);
 D.querySelector('.mvk-name h2').textContent=board?'Lantern board':'Vale';
 D.querySelector('.mvk-name small').textContent=board?'Quest board · '+(zones?.[story.zone]?.name||''):'Quest giver · Lantern Rest';
 const here=allQuests().filter(q=>q.zone===story.zone);
 const ready=here.filter(q=>questLog.accepted.has(q.id)&&questLog.ready.has(q.id));
 const offered=here.filter(q=>{try{return offeredQuest(q)}catch{return false}}).slice(0,3);
 const going=here.filter(q=>questLog.accepted.has(q.id)&&!questLog.ready.has(q.id));
 const line=ready.length?(board?'A finished notice flutters on the board, ready to claim.':'You did it. The grove owes you more than coin.'):offered.length?(board?'Fresh notices are pinned under the lantern.':'Traveller, the grove needs a steady hand. Will you help?'):going.length?(board?'Your notice is still pinned here. Finish the work and return.':'Safe roads, friend. Come back when the work is done.'):(board?'No new notices for now. Try the next road.':'Nothing new for now. The roads beyond the grove are calling.');
 D.querySelector('.mvk-line').textContent=(board?'':'\u201c')+line+(board?'':'\u201d');
 const card=(q,kind)=>'<article class="mvk-q mvk-'+kind+'"><small>'+(kind==='ready'?'Objectives complete':kind==='going'?'In progress'+(count(q)?' · '+esc(count(q)):''):'New quest')+'</small><h3>'+esc(q.title)+'</h3>'+(kind!=='ready'?'<p>'+esc(q.description)+'</p>':'')+'<div class="mvk-row"><span class="mvk-rew">'+(q.gold?'<i class="g"></i>'+q.gold+' gold':'')+(q.xp?' · '+q.xp+' XP':'')+'</span>'+(kind==='offer'?'<button type="button" class="mv-btn mv-btn-gold" data-accept="'+esc(q.id)+'">Accept</button>':kind==='ready'?'<button type="button" class="mv-btn mv-btn-gold" data-turn="'+esc(q.id)+'">Turn in</button>':'')+'</div></article>';
 D.querySelector('.mvk-quests').innerHTML=ready.map(q=>card(q,'ready')).join('')+offered.map(q=>card(q,'offer')).join('')+going.slice(0,2).map(q=>card(q,'going')).join('');
}
D.addEventListener('click',e=>{const a=e.target.closest('[data-accept]'),t=e.target.closest('[data-turn]');if(!a&&!t)return;
 quietJournal=true;try{if(a)acceptQuest(a.dataset.accept);else turnInQuest(t.dataset.turn);}finally{quietJournal=false;}
 try{hud()}catch{}
 if(a&&questLog.accepted.has(a.dataset.accept)){close();}else render();});
function openTalk(){try{keysClear()}catch{}render();if(!D.open)D.showModal();}
try{const bi=interactStory;interactStory=function(){let o=null;try{o=nearestInteraction()}catch{}if(o&&o.resident==='journal'&&!document.querySelector('dialog[open]')){openTalk();return true;}return bi.apply(this,arguments);};}catch{}
globalThis.MoonTalk={open:openTalk,dialog:D};

/* ---------- fallen screen ---------- */
const F=document.createElement('dialog');F.id='mvFallen';
F.innerHTML='<div class="mvf-card"><small class="mv-kicker">The grove carries you home</small><h2>You have fallen</h2><p>You wake by the lanterns of Lantern Rest, healed and rested. <b>No XP lost.</b></p><button type="button" class="mv-btn mv-btn-gold" id="mvRise">Rise again</button></div>';
document.body.appendChild(F);
F.addEventListener('cancel',e=>{e.preventDefault();rise();});
let fallenAt=0;function rise(){if(!F.open)return;F.classList.add('out');setTimeout(()=>{F.close();F.classList.remove('out');},280);}
$$('mvRise').onclick=rise;
try{const h0=hurt;hurt=function(n){const before=p.hp,bx=p.x,by=p.y;const r=h0.apply(this,arguments);if(before>0&&p.hp>=p.maxHp&&Math.hypot(p.x-bx,p.y-by)>60&&!document.querySelector('dialog[open]')){fallenAt=performance.now();try{keysClear()}catch{}F.showModal();}return r;};}catch{}



/* ---------- hero sheet (Hero tab / portrait) ---------- */
const HS=document.createElement('dialog');HS.id='mvHero';
HS.innerHTML='<button type="button" class="close mv-x" aria-label="Close">×</button><div class="mvh-top"><div class="mvh-art"><img alt=""></div><div class="mvh-id"><small class="mv-kicker"></small><h2></h2><p class="mvh-lv"></p><div class="mvh-xp"><i></i></div><p class="mvh-xpt"></p></div></div><div class="mvh-stats"></div><div class="mvh-actions"><button type="button" class="mv-btn" id="mvhGear">Equipment</button><button type="button" class="mv-btn" id="mvhSkills">Skills</button></div>';
document.body.appendChild(HS);
HS.querySelector('.mv-x').onclick=()=>HS.close();HS.addEventListener('click',e=>{if(e.target===HS)HS.close();});
$$('mvhGear').onclick=()=>{HS.close();try{openInventory()}catch{}};
$$('mvhSkills').onclick=()=>{HS.close();try{openTraining()}catch{}};
function heroSheet(){const ch=(typeof customHero!=='undefined'&&customHero)||{};const paint=(typeof MoonMotion!=='undefined'&&MoonMotion.art?.heroKey?.(p.cls))||ch.paint||(MoonCreator?.state?.hero)||'warden';
 const cls=(typeof CLASSES!=='undefined'&&CLASSES[p.cls])||{};const names={warden:'Sporecaller',warrior:'Gelguard',gelguard:'Gelguard',embermage:'Magmaweaver',frostcaller:'Rimegel',ranger:'Slimewright',mage:'Prismancer',prismancer:'Prismancer'};
 {const lk=ch.look||'';const pm={prismpearl:'hybrid',prismgilt:'prismgilt',prismtide:'prismtide'};HS.querySelector('img').src=(p.cls==='mage'||/^prism/.test(lk))?'art/prismancer/portrait-'+(pm[lk]||'hybrid')+'.png?v=3':'art/hero-'+paint+'.png';}
 HS.querySelector('.mv-kicker').textContent=(names[paint]||cls.name||'Adventurer')+' · '+(zones?.[story.zone]?.name||'');
 HS.querySelector('h2').textContent=ch.name||p.name||'Wanderer';
 HS.querySelector('.mvh-lv').textContent='Level '+p.level;
 const need=p.nextXp||1;HS.querySelector('.mvh-xp i').style.width=Math.max(2,Math.min(100,(p.xp/need)*100))+'%';HS.querySelector('.mvh-xpt').textContent=Math.floor(p.xp)+' / '+Math.floor(need)+' XP to level '+(p.level+1);
 const st=[['Health',Math.ceil(p.hp)+' / '+Math.ceil(p.maxHp)],['Mana',Math.ceil(p.mana)+' / 100'],['Power',p.power],['Armor',p.armor],['Gold',p.gold],['Tonics',p.potions],['Weapon','+'+(p.weapon||0)],['Gear','+'+(p.gear||0)]];
 HS.querySelector('.mvh-stats').innerHTML=st.filter(s=>s[1]!==undefined&&!/undefined|NaN/.test(String(s[1]))).map(s=>'<div><small>'+s[0]+'</small><b>'+esc(s[1])+'</b></div>').join('');}
function openHero(){try{keysClear()}catch{}heroSheet();if(!HS.open)HS.showModal();}
const hookHero=()=>{const b=$$('mvNavHero');if(b&&!b.dataset.mvh){b.dataset.mvh=1;b.onclick=openHero;}const pt=document.querySelector('.mv-portrait');if(pt&&!pt.dataset.mvh){pt.dataset.mvh=1;pt.onclick=openHero;}};
hookHero();setTimeout(hookHero,1500);
globalThis.MoonHero={open:openHero};
try{const pb=isPaused;isPaused=function(){return pb()||D.open||F.open||HS.open;};}catch{}

/* ---------- level-up banner (non-blocking) ---------- */
const LV=document.createElement('div');LV.id='mvLevel';LV.setAttribute('aria-live','polite');LV.innerHTML='<i class="mvl-rays"></i><small>Level up</small><b></b><span></span>';document.body.appendChild(LV);
let lvT=0;try{const g0=gainXp;gainXp=function(){const before=p.level;const r=g0.apply(this,arguments);if(p.level>before){LV.querySelector('b').textContent='Level '+p.level;LV.querySelector('span').textContent='Power +'+(3*(p.level-before))+' · Health +'+(14*(p.level-before))+' · New training point';LV.classList.remove('on');void LV.offsetWidth;LV.classList.add('on');clearTimeout(lvT);lvT=setTimeout(()=>LV.classList.remove('on'),2900);}return r;};}catch{}
/* ---------- leftover UI ---------- */
const kick=$$('menuDialog')?.querySelector('.release-kicker');if(kick)kick.textContent='Oozevale';
try{const oi=openInventory;openInventory=function(){const r=oi.apply(this,arguments);try{
 const d=typeof progressionDialog!=='undefined'?progressionDialog:null;if(d){for(const id of ['followGearLook','epicChangeLook']){const b=d.querySelector('#'+id);if(b)b.remove();}
  for(const h of d.querySelectorAll('.set-overview h2,.set-overview h3,.set-overview header'))if(/identity/i.test(h.textContent))h.textContent='Armor sets';const p0=d.querySelector('.set-overview p');if(p0)p0.textContent='Equip loot to raise your power, armor and health. Common pieces are plain; uncommon, rare and epic loot hit harder, and matching sets grant extra combat bonuses.';}
}catch{}return r;};}catch{}
try{const oj2=openJournal;openJournal=function(){const r=oj2.apply(this,arguments);try{const c=$$('contractButton');if(c)c.hidden=c.disabled;}catch{}return r;};}catch{}

// pin each dialog's own close button to the top of its scroll area (Bag put it below the fold on phones)
try{const pin=d=>{try{const x=[...d.children].find(c=>c.matches&&c.matches('button.journal-close,button.close,button[aria-label^=Close]'));if(!x)return;x.classList.add('mv-pinx');if(d.firstElementChild!==x)d.insertBefore(x,d.firstElementChild);}catch{}};
 document.querySelectorAll('dialog').forEach(d=>{if(d.open)pin(d)});
 new MutationObserver(ms=>{for(const m of ms)if(m.target.tagName==='DIALOG'&&m.target.open)pin(m.target);}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});}catch{}
})();
