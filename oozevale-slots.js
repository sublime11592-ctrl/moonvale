'use strict';
/* Oozevale home screen + character slots.
   Title shows only: Create Character · Continue (when any character exists) · Settings · Credits.
   - Slots: index 'oozevale.slots.v1' {active,list:[{id}]}, data 'oozevale.slot.<id>' (same {savedAt,payload} as the device save).
     The old single save migrates into slot 1. Every successful writeDeviceSave() mirrors into the active slot.
   - Continue: character select (portrait, name, class, level, zone, delete behind a confirm). Selecting shows a glowing
     ooze bubble; tapping it pops (splash + SFX) and loads straight into the game. */
(()=>{
const T=document.getElementById('titleScreen');if(!T||typeof writeDeviceSave!=='function'||typeof restoreSaveText!=='function')return;
const IDX='oozevale.slots.v1',KEY=id=>'oozevale.slot.'+id;
const rd=()=>{try{const v=JSON.parse(localStorage.getItem(IDX));if(v&&Array.isArray(v.list))return v;}catch(e){}return null;};
let idx=rd();const wr=()=>{try{localStorage.setItem(IDX,JSON.stringify(idx));}catch(e){}};
const parse=raw=>{try{const s=JSON.parse(raw);return s&&s.payload&&s.payload.format==='moonvale-adventure'&&CLASSES[s.payload.player?.cls]?s:null;}catch(e){return null;}};
const newId=()=>'c'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);
if(!idx){idx={active:null,list:[]};const raw=localStorage.getItem(DEVICE_SAVE);if(parse(raw)){idx.list.push({id:'s1'});idx.active='s1';try{localStorage.setItem(KEY('s1'),raw);}catch(e){}}wr();}
const slots=()=>idx.list.map(e=>({id:e.id,raw:localStorage.getItem(KEY(e.id))})).map(e=>({...e,s:parse(e.raw)})).filter(e=>e.s).sort((a,b)=>String(b.s.savedAt).localeCompare(String(a.s.savedAt)));
{const ws=writeDeviceSave;writeDeviceSave=function(){const r=ws.apply(this,arguments);if(r){try{const raw=localStorage.getItem(DEVICE_SAVE);if(parse(raw)){if(!idx.active||!idx.list.some(e=>e.id===idx.active)){idx.active=newId();idx.list.push({id:idx.active});}localStorage.setItem(KEY(idx.active),raw);wr();}}catch(e){}}return r;};}
/* ---------- portraits from the idle sheet ---------- */
const CLS={warrior:'Gelguard',druid:'Sporecaller',ranger:'Slimewright',mage:'Prismancer'};
const LOOKDEF={warrior:'chromeknight',druid:'glowcap',ranger:'oozeseer',mage:'chromeveil'};
function portrait(cv,look){const A=globalThis.MOONVALE_ANIM,a=A&&A.chars&&(A.chars[look]||A.chars.chromeknight);const m=a&&a.idle;if(!m)return;const img=new Image();img.onload=()=>{const c=cv.getContext('2d'),s=Math.min(cv.width/m.cellW,cv.height/m.bodyH*.92);c.clearRect(0,0,cv.width,cv.height);const w=m.cellW*s,h=m.cellH*s;c.drawImage(img,0,0,m.cellW,m.cellH,(cv.width-w)/2,cv.height-m.baseY*s-4,w,h);if(globalThis.OozeLooks&&OozeLooks.tint&&look==='prismancer')OozeLooks.tint(c,cv);};img.src=m.src;}
/* ---------- SFX ---------- */
let AC=null;function pop(){try{if(typeof soundOn!=='undefined'&&!soundOn)return;AC=AC||new (globalThis.AudioContext||globalThis.webkitAudioContext)();const t=AC.currentTime,o=AC.createOscillator(),gn=AC.createGain();o.type='sine';o.frequency.setValueAtTime(420,t);o.frequency.exponentialRampToValueAtTime(1500,t+.07);o.frequency.exponentialRampToValueAtTime(180,t+.22);gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(.55,t+.012);gn.gain.exponentialRampToValueAtTime(.0001,t+.28);o.connect(gn).connect(AC.destination);o.start(t);o.stop(t+.3);
 const n=AC.createBuffer(1,AC.sampleRate*.5,AC.sampleRate),d=n.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2.4);const src=AC.createBufferSource(),f=AC.createBiquadFilter(),g2=AC.createGain();src.buffer=n;f.type='bandpass';f.frequency.setValueAtTime(1800,t+.05);f.frequency.exponentialRampToValueAtTime(400,t+.5);f.Q.value=1.4;g2.gain.setValueAtTime(.0001,t);g2.gain.exponentialRampToValueAtTime(.4,t+.06);g2.gain.exponentialRampToValueAtTime(.0001,t+.5);src.connect(f).connect(g2).connect(AC.destination);src.start(t+.04);
 for(let k=0;k<5;k++){const o2=AC.createOscillator(),g3=AC.createGain(),tt=t+.1+k*.05+Math.random()*.03;o2.frequency.setValueAtTime(900+Math.random()*900,tt);o2.frequency.exponentialRampToValueAtTime(2400,tt+.04);g3.gain.setValueAtTime(.12,tt);g3.gain.exponentialRampToValueAtTime(.0001,tt+.06);o2.connect(g3).connect(AC.destination);o2.start(tt);o2.stop(tt+.07);}}catch(e){}}
/* ---------- UI ---------- */
const $=id=>document.getElementById(id),nb=$('newAdventure'),rb=$('resumeAdventure'),acts=nb&&nb.parentNode;
const cr=document.createElement('button');cr.id='titleCredits';cr.type='button';cr.className='mv-btn oz-credits-btn';cr.textContent='Credits';
const sb=$('titleSettings');if(acts){(sb||rb).after(cr);}
const panel=document.createElement('div');panel.id='ozSelect';panel.hidden=true;panel.innerHTML='<div class="ozs-head"><button type="button" class="ozs-back" aria-label="Back">‹</button><h2>Choose your hero</h2></div><div class="ozs-list" role="listbox"></div><div class="ozs-go" hidden><button type="button" class="ozs-bubble" aria-label="Enter Oozevale"><i></i><b>Enter</b></button><p class="ozs-who"></p></div>';
const credits=document.createElement('div');credits.id='ozCredits';credits.hidden=true;credits.innerHTML='<div class="ozs-head"><button type="button" class="ozs-back" aria-label="Back">‹</button><h2>Credits</h2></div><p><b>Oozevale</b> · a slime-soaked open-road adventure.</p><p>Design &amp; direction · the Oozevale player-designer</p><p>Code, FX &amp; worldbuilding · Grok Bot</p><p>Painted heroes, zones &amp; beasts · generated concept art, processed in-house</p><p class="ozs-small">Thanks for playing. Pop a bubble for us.</p>';
T.querySelector('.mvt-ui')?.append(panel,credits);
const ui=T.querySelector('.mvt-ui');const show=w=>{ui.classList.toggle('ozs-open',!!w);panel.hidden=w!==panel;credits.hidden=w!==credits;};
panel.querySelector('.ozs-back').onclick=()=>show(null);credits.querySelector('.ozs-back').onclick=()=>show(null);cr.onclick=()=>show(credits);
let pick=null;
function zoneName(s){const z=s.payload.story?.zone??0;return zones[z]?.name||'Oozevale';}
function render(){const L=panel.querySelector('.ozs-list');L.innerHTML='';const all=slots();
 for(const e of all){const pl=e.s.payload,h=pl.customHero||{},look=h.look||LOOKDEF[pl.player.cls];const card=document.createElement('div');card.className='ozs-card';card.setAttribute('role','option');card.tabIndex=0;card.dataset.id=e.id;
  card.innerHTML='<canvas width="120" height="140"></canvas><div class="ozs-info"><b></b><span></span><small></small></div><button type="button" class="ozs-del" aria-label="Delete character">🗑</button><div class="ozs-confirm" hidden><span>Delete forever?</span><button type="button" class="ozs-yes">Delete</button><button type="button" class="ozs-no">Keep</button></div>';
  card.querySelector('b').textContent=h.name||'Adventurer';card.querySelector('span').textContent=(CLS[pl.player.cls]||CLASSES[pl.player.cls]?.name||'Hero')+' · Level '+pl.player.level;card.querySelector('small').textContent=zoneName(e.s);
  portrait(card.querySelector('canvas'),look);
  card.onclick=ev=>{if(ev.target.closest('.ozs-del,.ozs-confirm'))return;select(e,card);};card.onkeydown=ev=>{if(ev.key==='Enter')select(e,card);};
  card.querySelector('.ozs-del').onclick=()=>{card.querySelector('.ozs-confirm').hidden=false;};card.querySelector('.ozs-no').onclick=()=>{card.querySelector('.ozs-confirm').hidden=true;};
  card.querySelector('.ozs-yes').onclick=()=>{try{localStorage.removeItem(KEY(e.id));}catch(x){}idx.list=idx.list.filter(x=>x.id!==e.id);if(idx.active===e.id){idx.active=null;try{localStorage.removeItem(DEVICE_SAVE);}catch(x){}}wr();if(pick&&pick.id===e.id){pick=null;panel.querySelector('.ozs-go').hidden=true;}render();sync();if(!slots().length)show(null);};
  L.appendChild(card);}
 if(all.length===1)select(all[0],L.firstChild);}
function select(e,card){pick=e;panel.querySelectorAll('.ozs-card').forEach(c=>c.classList.toggle('on',c===card));const go=panel.querySelector('.ozs-go');go.hidden=false;go.classList.remove('popped');void go.offsetWidth;panel.querySelector('.ozs-who').textContent=(e.s.payload.customHero?.name||'Adventurer');}
const bub=panel.querySelector('.ozs-bubble');let busy=false;
bub.onclick=()=>{if(!pick||busy)return;busy=true;pop();const go=panel.querySelector('.ozs-go'),r=bub.getBoundingClientRect();go.classList.add('popped');
 for(let i=0;i<22;i++){const d=document.createElement('i');d.className='ozs-drop';const a=Math.random()*Math.PI*2,v=70+Math.random()*150,sz=6+Math.random()*16;d.style.cssText=`left:${r.left+r.width/2}px;top:${r.top+r.height/2}px;width:${sz}px;height:${sz}px;--dx:${Math.cos(a)*v}px;--dy:${Math.sin(a)*v-40}px;--h:${150+Math.random()*140}`;T.appendChild(d);setTimeout(()=>d.remove(),900);}
 const ring=document.createElement('i');ring.className='ozs-ring';ring.style.cssText=`left:${r.left+r.width/2}px;top:${r.top+r.height/2}px`;T.appendChild(ring);setTimeout(()=>ring.remove(),700);
 const e=pick;setTimeout(async()=>{try{localStorage.setItem(DEVICE_SAVE,e.raw);idx.active=e.id;wr();T.classList.add('mvt-leave');await restoreSaveText(e.raw);}catch(x){}finally{busy=false;T.classList.remove('mvt-leave');show(null);}},420);};
/* buttons: Create Character goes straight to the creator; Continue opens the select */
function sync(){const has=slots().length>0,set=(el,k,v)=>{if(el[k]!==v)el[k]=v;};if(rb){set(rb,'hidden',!has);if(rb.style.display!==(has?'':'none'))rb.style.display=has?'':'none';set(rb,'textContent','Continue');if(rb.classList.contains('mv-btn-gold')!==has)rb.classList.toggle('mv-btn-gold',has);}if(nb){set(nb,'textContent','Create Character');if(nb.classList.contains('mv-btn-gold')===has)nb.classList.toggle('mv-btn-gold',!has);if(acts&&acts.firstElementChild!==nb)acts.prepend(nb);}
 for(const id of ['titleSaves','freshWarning','freshActions','homeSave'])if($(id)&&!$(id).hidden)$(id).hidden=true;const sv=T.querySelector('.mvt-save');if(sv&&!sv.hidden)sv.hidden=true;}
if(nb)nb.onclick=()=>{idx.active=null;wr();pick=null;show(null);T.classList.add('mvt-leave');setTimeout(()=>{T.classList.remove('mvt-leave');beginCreation();},240);};
if(rb)rb.onclick=()=>{render();show(panel);};
let raf=0;const soon=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;sync();});};if(globalThis.OozeTitle)OozeTitle.sync=soon;
sync();setInterval(()=>{if(T.open)sync();},1500);
const css=document.createElement('style');css.textContent=`
.mvt-ui.ozs-open>:not(#ozSelect):not(#ozCredits){display:none!important}
#ozSelect,#ozCredits{position:relative;width:min(560px,94vw);max-height:82vh;overflow:auto;margin:0 auto;padding:16px 16px 22px;border-radius:18px;background:linear-gradient(180deg,rgba(20,24,30,.94),rgba(12,14,18,.96));border:2px solid #7a5a2e;box-shadow:0 0 0 1px #2a1d0e inset,0 10px 40px #000a,0 0 30px #3fe0c833;color:#f1e6c8;text-align:left;pointer-events:auto}
#ozCredits p{margin:.5em 4px;font-size:15px}.ozs-small{opacity:.7;font-size:13px!important}
.ozs-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}.ozs-head h2{margin:0;font:700 22px/1.1 Georgia,serif;color:#ffe3a1;letter-spacing:.04em}
.ozs-back{width:38px;height:38px;border-radius:50%;border:2px solid #a07a3c;background:#241a10;color:#ffe3a1;font-size:24px;line-height:1;cursor:pointer}
.ozs-list{display:grid;gap:10px}
.ozs-card{position:relative;display:flex;align-items:center;gap:12px;padding:8px 52px 8px 8px;border-radius:14px;background:linear-gradient(90deg,#1d232b,#151a20);border:2px solid #4b3a22;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}
.ozs-card:hover{border-color:#a07a3c}.ozs-card.on{border-color:#3fe0c8;box-shadow:0 0 18px #3fe0c866,0 0 0 1px #3fe0c8 inset;transform:translateY(-1px)}
.ozs-card canvas{width:72px;height:84px;flex:none;border-radius:10px;background:radial-gradient(circle at 50% 70%,#2c4a44,#11161b 70%)}
.ozs-info{display:flex;flex-direction:column;gap:3px;min-width:0}.ozs-info b{font:700 18px Georgia,serif;color:#fff1c9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ozs-info span{font-size:14px;color:#9fe3cf}.ozs-info small{font-size:12px;color:#c9b48a}
.ozs-del{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:10px;border:1px solid #6b3a2a;background:#2a1612;color:#ffb09a;cursor:pointer;font-size:16px}
.ozs-confirm{position:absolute;inset:0;display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:0 10px;border-radius:12px;background:#1a0f0de8}.ozs-confirm[hidden]{display:none}.ozs-confirm span{margin-right:auto;color:#ffcfbf;font-weight:700}
.ozs-confirm button{padding:8px 12px;border-radius:9px;border:1px solid #8a5a2e;background:#2a1d10;color:#ffe3a1;font-weight:700;cursor:pointer}.ozs-confirm .ozs-yes{background:#6b1f16;border-color:#d0664c;color:#fff}
.ozs-go{display:flex;flex-direction:column;align-items:center;margin-top:16px}.ozs-go[hidden]{display:none}.ozs-who{margin:6px 0 0;color:#c9b48a;font-size:13px}
#ozSelect .ozs-go .ozs-bubble{position:relative;width:132px;height:132px;border-radius:50%;border:0!important;padding:0!important;cursor:pointer;background:radial-gradient(circle at 34% 30%,#ffffffee 0 7%,#c9fff4aa 12%,transparent 26%),radial-gradient(circle at 50% 55%,#5ff2d0cc,#1fae94cc 55%,#0b5f58ee 78%,#063a36 100%)!important;box-shadow:0 0 30px #3fe0c8aa,0 0 70px #3fe0c855,inset 0 -10px 24px #02302c,inset 0 6px 14px #b9fff0aa!important;animation:ozsWob 2.2s ease-in-out infinite;color:#06302b}
.ozs-bubble i{position:absolute;inset:-10px;border-radius:50%;border:2px solid #9ffbe655;animation:ozsHalo 1.8s ease-out infinite}
.ozs-bubble b{position:relative;font:800 20px Georgia,serif;letter-spacing:.06em;color:#eafff9;text-shadow:0 2px 0 #0b4a44,0 0 12px #3fe0c8}
@keyframes ozsWob{0%,100%{border-radius:50% 50% 48% 52%/52% 48% 52% 48%;transform:scale(1)}25%{border-radius:46% 54% 52% 48%/48% 54% 46% 52%;transform:scale(1.04,.97)}50%{transform:scale(.97,1.04)}75%{border-radius:53% 47% 49% 51%/47% 51% 49% 53%;transform:scale(1.02)}}
@keyframes ozsHalo{0%{transform:scale(.9);opacity:.9}100%{transform:scale(1.35);opacity:0}}
.ozs-go.popped .ozs-bubble{animation:ozsPop .32s ease-out forwards!important}.ozs-go.popped .ozs-bubble{animation:ozsPop .32s ease-out forwards}@keyframes ozsPop{0%{transform:scale(1)}35%{transform:scale(1.28,1.18);filter:brightness(1.5)}100%{transform:scale(1.6);opacity:0}}
.ozs-drop{position:fixed;z-index:9999;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 30%,#fff 0 12%,hsl(var(--h) 85% 62%) 40%,hsl(var(--h) 80% 35%));box-shadow:0 0 10px hsl(var(--h) 90% 60%);transform:translate(-50%,-50%);animation:ozsDrop .85s cubic-bezier(.2,.7,.4,1) forwards}
@keyframes ozsDrop{0%{transform:translate(-50%,-50%) scale(.4)}60%{opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy) + 90px)) scale(.6);opacity:0}}
.ozs-ring{position:fixed;z-index:9998;width:140px;height:140px;margin:-70px 0 0 -70px;border-radius:50%;border:6px solid #9ffbe6;pointer-events:none;animation:ozsRing .6s ease-out forwards}@keyframes ozsRing{0%{transform:scale(.7);opacity:1}100%{transform:scale(2.2);opacity:0;border-width:1px}}
.oz-credits-btn{opacity:.85}
@media(max-width:480px){.ozs-card canvas{width:60px;height:70px}.ozs-info b{font-size:16px}.ozs-bubble{width:116px;height:116px}}
`;document.head.appendChild(css);
globalThis.OozeSlots={slots,idx:()=>idx,render,sync:soon,syncNow:sync};
})();
