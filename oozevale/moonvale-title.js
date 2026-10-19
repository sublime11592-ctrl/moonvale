/* Moonvale ship pass: boot hand-off, painted title screen, settings, prologue and the fade into the world.
   Keeps every original id (#newAdventure, #resumeAdventure, #titleSaves, #freshWarning, #freshActions, #homeSave). */
(()=>{
const $$=id=>document.getElementById(id);
const T=$$('titleScreen');if(!T||T.dataset.mvt)return;T.dataset.mvt='1';
const root=document.documentElement;
const PREF='moonvale-prefs';
const prefs=(()=>{try{return JSON.parse(localStorage.getItem(PREF))||{}}catch{return{}}})();
const savePrefs=()=>{try{localStorage.setItem(PREF,JSON.stringify(prefs))}catch{}};
const calm=()=>prefs.calm||matchMedia('(prefers-reduced-motion: reduce)').matches;
try{if(prefs.music===false){musicOn=false;$$('musicBtn')?.setAttribute('aria-pressed',false)}if(prefs.sound===false){soundOn=false;$$('soundBtn')?.setAttribute('aria-pressed',false)}}catch{}
for(const [id,k] of [['musicBtn','music'],['soundBtn','sound']])$$(id)?.addEventListener('click',()=>{prefs[k]=$$(id).getAttribute('aria-pressed')==='true';savePrefs();syncSettings();});
root.classList.toggle('mv-calm',!!prefs.calm);

/* ---------- title screen ---------- */
T.classList.add('mvt');
const scene=document.createElement('div');scene.className='mvt-scene';scene.setAttribute('aria-hidden','true');
const OZ=globalThis.OOZE_ART||{};
scene.innerHTML='<div class="mvt-back"></div><div class="mvt-art"><img src="'+(OZ.title?OZ.title.src:'art/title-a.webp')+'" alt="" decoding="async" fetchpriority="high"></div><canvas class="mvt-flies"></canvas><div class="mvt-shade"></div>';
if(OZ.title){T.classList.add('oz-title');scene.querySelector('.mvt-back').style.backgroundImage='url("'+OZ.title.blur+'")';}
const ui=document.createElement('div');ui.className='mvt-ui';
ui.innerHTML='<div class="mvt-logo"><small>Tales of the glowing ooze</small><h1>Oozevale</h1><i class="mvt-orn" aria-hidden="true"><b></b></i></div><div class="mvt-actions"></div><div class="mvt-fresh"></div><p class="mvt-save"></p><p class="mvt-foot">Single-player · Autosaves on this device</p>';
T.prepend(scene,ui);
{const h1=ui.querySelector('.mvt-logo h1');if(OZ.logo){h1.classList.add('oz-logo-img');h1.innerHTML='<img src="'+OZ.logo.src+'" alt="Oozevale" width="'+OZ.logo.w+'" height="'+OZ.logo.h+'">';}else{h1.classList.add('oz-logo-text');h1.setAttribute('data-text','Oozevale');}}
const acts=ui.querySelector('.mvt-actions');
const nb=$$('newAdventure'),rb=$$('resumeAdventure');
const sb=document.createElement('button');sb.id='titleSettings';sb.type='button';
nb.textContent='Begin Adventure';rb.textContent='Continue';sb.textContent='Settings';
for(const b of [nb,rb,sb]){b.classList.add('mv-btn');acts.appendChild(b);}
nb.classList.add('mv-btn-gold');rb.classList.remove('primary');nb.classList.remove('primary');
const fresh=ui.querySelector('.mvt-fresh');
for(const id of ['freshWarning','freshActions'])if($$(id))fresh.appendChild($$(id));
if($$('confirmFresh')){$$('confirmFresh').textContent='Start a new hero';$$('confirmFresh').classList.add('mv-btn','mv-btn-gold');}
if($$('cancelFresh')){$$('cancelFresh').textContent='Keep my adventure';$$('cancelFresh').classList.add('mv-btn');}
if($$('homeSave'))ui.querySelector('.mvt-save').appendChild($$('homeSave'));
const leave=fn=>{if(T.classList.contains('mvt-leave'))return;if(calm()){fn();return;}T.classList.add('mvt-leave');setTimeout(()=>{fn();T.classList.remove('mvt-leave');},260);};
const origNew=nb.onclick;nb.onclick=e=>{let has=false;try{has=!!readDeviceSave()}catch{}if(has)return origNew(e);leave(()=>origNew(e));};
const origConfirm=$$('confirmFresh')?.onclick;if(origConfirm)$$('confirmFresh').onclick=e=>leave(()=>origConfirm(e));
sb.onclick=()=>openSettings();

/* parallax + drift + fireflies (one rAF, only while the title is open) */
const art=scene.querySelector('.mvt-art'),back=scene.querySelector('.mvt-back'),cv=scene.querySelector('.mvt-flies'),cx=cv.getContext('2d');
let tx=0,ty=0,px=0,py=0,raf=0,t0=performance.now(),flies=[],W=0,H=0,dpr=1;
const glow=document.createElement('canvas');glow.width=glow.height=32;{const g=glow.getContext('2d'),r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,250,205,1)');r.addColorStop(.18,'rgba(250,226,130,.9)');r.addColorStop(.5,'rgba(214,190,90,.25)');r.addColorStop(1,'rgba(200,170,80,0)');g.fillStyle=r;g.fillRect(0,0,32,32);}
function size(){const r=T.getBoundingClientRect();dpr=Math.min(2,devicePixelRatio||1);W=r.width;H=r.height;cv.width=Math.max(1,W*dpr|0);cv.height=Math.max(1,H*dpr|0);
 const n=Math.round(Math.min(46,Math.max(18,W*H/16000)));flies=Array.from({length:n},()=>({x:Math.random()*W,y:H*(.25+Math.random()*.75),z:.4+Math.random()*.9,a:Math.random()*6.28,s:.15+Math.random()*.35,p:Math.random()*6.28}));}
function frame(now){raf=0;if(!T.open)return;const t=(now-t0)/1000,still=calm();
 px+=(tx-px)*.05;py+=(ty-py)*.05;
 if(!still){const pr=W<H,dx=Math.sin(t*.05)*(pr?.5:1.2)+px*(pr?.8:1.6),dy=Math.cos(t*.037)*.7+py*1.1;art.style.transform=`translate3d(${dx}%,${dy}%,0) scale(${pr?1.015:1.06})`;back.style.transform=`translate3d(${-px*.6}%,${-py*.4}%,0) scale(1.12)`;}
 else{art.style.transform='none';back.style.transform='scale(1.08)';}
 cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);cx.globalCompositeOperation='lighter';
 for(const f of flies){if(!still){f.a+=(Math.random()-.5)*.08;f.x+=Math.cos(f.a)*f.s*f.z+px*.02*f.z;f.y+=Math.sin(f.a)*f.s*f.z*.7-.05*f.z;if(f.x<-20)f.x=W+20;if(f.x>W+20)f.x=-20;if(f.y<H*.15)f.y=H+10;if(f.y>H+20)f.y=H*.3;}
  const b=.35+.65*Math.max(0,Math.sin(t*(.9+f.z*.6)+f.p)),r=(5+7*f.z)*(.75+b*.35);cx.globalAlpha=b*.9;cx.drawImage(glow,f.x+px*6*f.z-r,f.y+py*4*f.z-r,r*2,r*2);}
 cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
 raf=requestAnimationFrame(frame);}
const kick=()=>{if(T.open&&!raf){size();raf=requestAnimationFrame(frame);}};
addEventListener('resize',()=>{if(T.open)size();});
T.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=T.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5)*2;ty=((e.clientY-r.top)/r.height-.5)*2;});
addEventListener('deviceorientation',e=>{if(e.gamma==null)return;tx=Math.max(-1,Math.min(1,e.gamma/25));ty=Math.max(-1,Math.min(1,((e.beta||45)-45)/25));});
new MutationObserver(kick).observe(T,{attributes:true,attributeFilter:['open']});kick();setInterval(kick,1000);

/* ---------- settings ---------- */
const S=document.createElement('dialog');S.id='mvSettings';S.className='mv-panel';
S.innerHTML='<button class="close mv-x" type="button" aria-label="Close settings">×</button><small class="mv-kicker">Oozevale</small><h2>Settings</h2>'+
 '<div class="mvs-list"><label class="mvs-row"><span><b>Music</b><em>Ambient grove score</em></span><input type="checkbox" id="mvsMusic" class="mv-toggle"></label>'+
 '<label class="mvs-row"><span><b>Sound effects</b><em>Spells, hits and loot</em></span><input type="checkbox" id="mvsSound" class="mv-toggle"></label>'+
 '<label class="mvs-row"><span><b>Reduced motion</b><em>Stills the title drift, fireflies and fades</em></span><input type="checkbox" id="mvsCalm" class="mv-toggle"></label></div>'+
 '<div class="mvs-links"></div><button type="button" class="mv-btn mv-btn-gold mvs-done">Done</button>';
document.body.appendChild(S);
const links=S.querySelector('.mvs-links');
const ts=$$('titleSaves');if(ts){ts.textContent='Saves & backups';ts.classList.add('mv-btn');links.appendChild(ts);}
const gb=document.createElement('button');gb.type='button';gb.id='mvsGuide';gb.className='mv-btn';gb.textContent='Controls & guide';gb.onclick=()=>{const g=$$('guideDialog');if(g&&!g.open)g.showModal();};links.appendChild(gb);
function syncSettings(){if(!$$('mvsMusic'))return;$$('mvsMusic').checked=$$('musicBtn')?.getAttribute('aria-pressed')!=='false';$$('mvsSound').checked=$$('soundBtn')?.getAttribute('aria-pressed')!=='false';$$('mvsCalm').checked=!!prefs.calm;}
function openSettings(){try{keysClear()}catch{}syncSettings();if(!S.open)S.showModal();}
$$('mvsMusic').onchange=()=>{if($$('mvsMusic').checked!==($$('musicBtn').getAttribute('aria-pressed')==='true'))$$('musicBtn').click();};
$$('mvsSound').onchange=()=>{if($$('mvsSound').checked!==($$('soundBtn').getAttribute('aria-pressed')==='true'))$$('soundBtn').click();};
$$('mvsCalm').onchange=()=>{prefs.calm=$$('mvsCalm').checked;savePrefs();root.classList.toggle('mv-calm',prefs.calm);};
S.querySelector('.mv-x').onclick=S.querySelector('.mvs-done').onclick=()=>S.close();
S.addEventListener('click',e=>{if(e.target===S)S.close();});
const ms=$$('menuSettings');if(ms){const b=document.createElement('button');b.type='button';b.id='menuOpenSettings';b.textContent='⚙ Settings';b.onclick=()=>{$$('menuDialog')?.close();openSettings();};ms.appendChild(b);}
globalThis.MoonSettings={open:openSettings,prefs};

/* ---------- prologue (fresh heroes only) + fade into the world ---------- */
const I=document.createElement('dialog');I.id='mvIntro';
I.innerHTML='<div class="mvi-art"><img src="art/title-b.webp" alt="" decoding="async"></div><div class="mvi-shade"></div><div class="mvi-card"><small class="mv-kicker">Chapter I · The Elder Grove</small><h2>The lanterns are fading</h2><p class="mvi-l1">Night after night the grove grows darker, and Vale\u2019s scout has not come home.</p><p class="mvi-l2">Gather moondew, find the scout, and the glowing roads of Oozevale are yours to walk.</p><button type="button" class="mv-btn mv-btn-gold" id="mvIntroGo">Enter the grove</button></div>';
document.body.appendChild(I);
I.addEventListener('cancel',e=>{e.preventDefault();closeIntro();});
let introAt=0;
function closeIntro(){if(!I.open||I.classList.contains('mvi-out'))return;I.classList.add('mvi-out');setTimeout(()=>{I.close();I.classList.remove('mvi-out');arrive();},calm()?0:420);}
$$('mvIntroGo').onclick=closeIntro;
I.addEventListener('click',e=>{if(e.target.closest('button'))return;if(performance.now()-introAt>900)closeIntro();});
const veil=document.createElement('div');veil.id='mvVeil';veil.setAttribute('aria-hidden','true');document.body.appendChild(veil);
function arrive(){if(calm())return;veil.className='on';void veil.offsetWidth;requestAnimationFrame(()=>requestAnimationFrame(()=>{veil.className='on out';}));setTimeout(()=>{veil.className='';},1400);}
try{const pb=isPaused;isPaused=function(){return pb()||I.open||S.open;};}catch{}
try{const eb=enter;enter=function(){const was=started;const r=eb.apply(this,arguments);try{if(!was&&started&&!(typeof restoringCreator!=='undefined'&&restoringCreator)){introAt=performance.now();if(!I.open)I.showModal();}}catch{}return r;};}catch{}
try{const rb2=restoreAdventure;restoreAdventure=function(){const r=rb2.apply(this,arguments);arrive();return r;};}catch{}
globalThis.MoonTitle={closeIntro,arrive};

/* ---------- boot hand-off ---------- */
const img=scene.querySelector('img');
const ready=Promise.all([new Promise(r=>{if(document.readyState!=='loading')r();else document.addEventListener('DOMContentLoaded',r,{once:true});}),img.decode?img.decode().catch(()=>{}):Promise.resolve(),document.fonts?document.fonts.ready.catch(()=>{}):Promise.resolve()]);
const minShow=new Promise(r=>setTimeout(r,500));
const done=()=>{if(!root.classList.contains('mv-booting'))return;root.classList.remove('mv-booting');const b=$$('mvBoot');if(b){b.classList.add('gone');setTimeout(()=>b.remove(),700);}kick();};
Promise.all([ready,minShow]).then(done);setTimeout(done,9000);
})();
