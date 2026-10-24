'use strict';
/* Oozevale zone-1/2 polish (playtest pass): strict level gates with glowing barriers, NPC "Talk" bubble,
   quests only from NPC talk + big Accept/Decline, bigger themed spell buttons + first-time hint,
   overhead health bars (hero/pet green, foes red), attention cues (sound + visual), cleaner HUD. Loaded last. */
(()=>{
if(typeof p==='undefined'||typeof travel!=='function')return;
const $=id=>document.getElementById(id);const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const nowS=()=>performance.now()/1000;const live=()=>typeof started==='undefined'||started;
/* ---------- soft ooze synth (respects mute) ---------- */
let AC=null;const ac=()=>{if(typeof soundOn!=='undefined'&&!soundOn)return null;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();}catch(e){return null;}return AC;};
function tn(f0,f1,dur,vol,type,delay){const a=ac();if(!a)return;const t=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.03);}
const CUE={
 giver:()=>{tn(660,700,.25,.025,'sine');tn(990,1040,.3,.02,'sine',.09);},
 turnin:()=>{tn(880,840,.22,.025,'triangle');tn(660,620,.3,.02,'triangle',.1);},
 accept:()=>{[523,659,784].forEach((f,i)=>tn(f,f*1.01,.22,.03,'triangle',i*.08));},
 complete:()=>{[523,659,784,1046].forEach((f,i)=>tn(f,f,.35,.03,'triangle',i*.09));tn(262,262,.6,.02,'sine',.0);},
 aggro:()=>{tn(240,170,.16,.035,'square');tn(180,120,.18,.02,'sawtooth',.05);},
 heart:()=>{tn(70,50,.12,.06,'sine');tn(66,48,.12,.045,'sine',.18);},
 loot:()=>{tn(1320,1760,.12,.02,'sine');tn(1980,1980,.1,.012,'sine',.06);},
 bubble:()=>tn(400,900,.09,.02,'sine'),
 deny:()=>{tn(200,150,.2,.035,'triangle');tn(150,110,.25,.025,'sine',.08);},
};
/* ---------- level gates ---------- */
const zoneLevel=z=>{const Z=zones[z];if(!Z)return 1;if(Z.frontier&&Z.frontier.level)return Z.frontier.level;const lv=Z.mobs.filter(m=>m.type!=='boss').map(m=>m.level||1);return lv.length?Math.min(...lv):1;};
const sealed=z=>{const im=zones[z]&&zones[z].image;return z!==0&&im&&im.naturalWidth>0&&im.naturalWidth<1000;};
const gateMsg=z=>sealed(z)?'The path to '+zones[z].name+' is overgrown with wild ooze. Not open yet.':'Too dangerous! Reach level '+zoneLevel(z)+' to enter '+zones[z].name+'.';
const locked=z=>!globalThis.__ozNoGate&&z!==0&&(sealed(z)||p.level<zoneLevel(z));
let restoring=0,lastDeny=0;
if(typeof restoreAdventure==='function'){const ra=restoreAdventure;restoreAdventure=function(){restoring++;try{return ra.apply(this,arguments);}finally{restoring--;}};}
function offFire(){try{if(d2(p,CAMP)<150){for(const dy of [200,180,230,150]){if(typeof blocked!=="function"||!blocked(CAMP.x+40,CAMP.y+dy)){p.x=CAMP.x+40;p.y=CAMP.y+dy;break;}}}}catch(e){}}
setTimeout(function sp(){if(live()&&typeof started!=='undefined'&&started){offFire();return;}setTimeout(sp,300);},300);
{const tv=travel;travel=function(z){if(!restoring&&locked(z)&&z!==story.zone){const t=nowS();if(t-lastDeny>1.6){lastDeny=t;try{say(gateMsg(z));}catch(e){}toast(gateMsg(z),'#ff8a6a');CUE.deny();}return;}const r=tv.apply(this,arguments);offFire();return r;};}
// saved in a zone that is now locked: send home safely
setTimeout(function chk(){try{if(live()&&locked(story.zone)&&story.zone!==0){restoring++;try{travel(0);}finally{restoring--;}toast('You find your way back to the Elder Grove.','#ffd257');}}catch(e){}},2500);
/* ---------- toast ---------- */
const TO=document.createElement('div');TO.id='ozToast';document.body.appendChild(TO);let toT=0;
function toast(msg,col){TO.textContent=msg;TO.style.borderColor=col||'#ffd257';TO.classList.add('on');clearTimeout(toT);toT=setTimeout(()=>TO.classList.remove('on'),2600);}
/* ---------- quests: only from NPC talk ---------- */
let lastTalk=0;let talkOpen=()=>!!($('mvTalk')&&$('mvTalk').open)||(Date.now()-lastTalk<60000&&!!($('storyDialog')&&$('storyDialog').open));
if(typeof acceptQuest==='function'){const aq=acceptQuest;acceptQuest=function(id){if(!talkOpen()){let who='a quest giver';try{const q=questById(id);who=questGiver(q).label.split('·')[0].trim();}catch(e){}try{say('Talk to '+who+' to accept this quest.');}catch(e){}CUE.deny();return;}const had=questLog.accepted.has(id);const r=aq.apply(this,arguments);if(!had&&questLog.accepted.has(id)){CUE.accept();toast('Quest accepted','#9fe3b0');}return r;};}
if(typeof turnInQuest==='function'){const ti=turnInQuest;turnInQuest=function(){const n=questLog.accepted.size;const r=ti.apply(this,arguments);if(questLog.accepted.size<n){CUE.complete();toast('Quest complete!','#ffd257');}return r;};}
// every quest-giver NPC opens the talk dialog (not the journal)
if(typeof interactStory==='function'){const is=interactStory;interactStory=function(){let o=null;try{o=nearestInteraction();}catch(e){}if(o)lastTalk=Date.now();
 if(o&&o.hub!==undefined&&!o.edge&&globalThis.MoonTalk&&!document.querySelector('dialog[open]')){MoonTalk.open();try{const nm=(o.label||'').split('·')[0].trim();if(nm)MoonTalk.dialog.querySelector('.mvk-name h2').textContent=nm;}catch(e){}decorate();return true;}
 return is.apply(this,arguments);};}
function decorate(){const D=$('mvTalk');if(!D)return;D.querySelectorAll('[data-accept]').forEach(b=>{if(b.classList.contains('oz-big-accept'))return;b.classList.add('oz-big-accept');b.textContent='✔ Accept';if(!b.nextElementSibling||!b.nextElementSibling.classList.contains('oz-big-decline')){const n=document.createElement('button');n.type='button';n.className='mv-btn oz-big-decline';n.textContent='✖ Decline';n.onclick=e=>{e.stopPropagation();D.close();};b.after(n);}});}
if($('mvTalk'))new MutationObserver(decorate).observe($('mvTalk'),{childList:true,subtree:true});
/* ---------- Talk bubble over the nearest NPC ---------- */
const TB=document.createElement('div');TB.id='ozTalk';TB.setAttribute('role','button');TB.tabIndex=0;TB.innerHTML='<span class="ozt-b"></span><b>Talk</b><small>E</small>';TB.hidden=true;document.body.appendChild(TB);
const act=e=>{e.preventDefault();e.stopPropagation();CUE.bubble();try{openCamp();}catch(x){}};TB.addEventListener('click',act);TB.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')act(e);});
const isNpc=o=>o&&!o.edge&&o.zone===undefined&&(o.resident||o.hub!==undefined||o.npc||/scout|keeper|vale|giver|merchant|guide|wayfarer|miller|cooper|rider|tinker/i.test(o.label||''));
function screenOf(x,y){const c=document.querySelector('canvas');const r=c.getBoundingClientRect();return [r.left+(x-camera.x)*r.width/view.w,r.top+(y-camera.y)*r.height/view.h];}
function placeTalk(){let o=null;try{o=live()&&!document.querySelector('dialog[open]')&&nearestInteraction();}catch(e){}
 if(!isNpc(o)){TB.hidden=true;document.body.classList.remove('oz-has-talk');return;}
 const [sx,sy]=screenOf(o.x,o.y-120);TB.hidden=false;document.body.classList.add('oz-has-talk');TB.style.left=Math.round(sx)+'px';TB.style.top=Math.round(Math.max(60,sy))+'px';
 const nm=(o.label||'').split('·')[0].trim();TB.querySelector('b').textContent=o.resident==='journal'||o.hub!==undefined?'Talk':(nm&&nm.length<16?'Talk':'Talk');TB.title='Talk to '+nm;}
/* ---------- spell hint ---------- */
const HINT=document.createElement('div');HINT.id='ozCastHint';HINT.innerHTML=(matchMedia('(pointer:coarse)').matches?'Tap a spell to cast':'Click a spell or press 1–5')+' <i>⬇</i>';HINT.hidden=true;document.body.appendChild(HINT);
let hintDone=localStorage.getItem('oz.hint.cast')==='1',hintShown=0;
function placeHint(){if(hintDone||!live()||document.querySelector('dialog[open]')){HINT.hidden=true;return;}const b=document.querySelector('#hotbar > *');if(!b){HINT.hidden=true;return;}const r=b.getBoundingClientRect();if(!r.width){HINT.hidden=true;return;}
 if(!hintShown)hintShown=nowS();HINT.hidden=false;HINT.style.left=Math.round(r.left+r.width/2)+'px';HINT.style.top=Math.round(r.top-12)+'px';b.classList.add('oz-pulse');if(nowS()-hintShown>14)endHint();}
function endHint(){hintDone=true;localStorage.setItem('oz.hint.cast','1');HINT.hidden=true;document.querySelectorAll('.oz-pulse').forEach(b=>b.classList.remove('oz-pulse'));}
{const cs=castSkill;castSkill=function(){if(!hintDone&&hintShown)endHint();return cs.apply(this,arguments);};}
/* ---------- cues state ---------- */
const seenGiver=new Map(),aggroT=new WeakMap();let heartT=0,lowPulse=0,prevDrops=0;const sparkles=[];
function questMarks(){const out=[];try{for(const o of objectivePoints()){if(o.edge)continue;const id=o.hub!==undefined?'h'+o.hub+':'+story.zone:o.resident?'r'+o.resident:null;if(!id)continue;let kind=null;
  try{const here=[...openingQuests,...regionQuests].filter(q=>q.zone===story.zone);if(here.some(q=>questLog.ready.has(q.id)))kind='?';else if(here.some(q=>offeredQuest(q)))kind='!';}catch(e){}
  if(o.resident==='journal'||o.hub!==undefined)if(kind)out.push({o,id,kind});}}catch(e){}return out;}
function trackedPoint(){try{const q=questLog.tracked&&questById(questLog.tracked);if(q&&typeof questTarget==='function'){const t=questTarget(q);if(t&&t.x!=null)return t;}}catch(e){}
 try{const pts=objectivePoints().filter(o=>!o.edge&&!o.resident&&o.hub===undefined);if(pts.length)return pts.sort((a,b)=>d2(a,p)-d2(b,p))[0];}catch(e){}return null;}
/* ---------- update ---------- */
{const up=update;update=function(dt){up.apply(this,arguments);try{placeTalk();placeHint();if(!live()||(typeof isPaused==='function'&&isPaused()))return;const t=nowS();
 for(const m of questMarks()){const dd=d2(m.o,p),k=m.id+m.kind,last=seenGiver.get(k)||0;if(dd<420&&t-last>40){seenGiver.set(k,t);(m.kind==='?'?CUE.turnin:CUE.giver)();}}
 for(const m of mobs){if(!m.alive)continue;const was=aggroT.get(m);if(m.aggro&&d2(m,p)<420&&!was){aggroT.set(m,t);if(t-(aggroT.lastSnd||0)>1.2){aggroT.lastSnd=t;CUE.aggro();}}else if(!m.aggro&&was)aggroT.delete(m);}
 const low=p.hp>0&&p.hp<p.maxHp*.3;if(low){heartT-=dt;if(heartT<=0){heartT=1.05;CUE.heart();lowPulse=1;}}else heartT=0;lowPulse=Math.max(0,lowPulse-dt*1.4);
 const n=(typeof drops!=='undefined'?drops.length:0)+(typeof inventory!=='undefined'?inventory.ground.filter(g=>g.zone===story.zone).length:0);if(n>prevDrops){CUE.loot();}prevDrops=n;
 for(const s of sparkles)s.t+=dt;}catch(e){}};}
/* ---------- world draw: bars, marks, aggro outline, gate barriers ---------- */
function bar(x,y,w,h,f,c1,c2,label){g.fillStyle='rgba(10,8,6,.75)';g.beginPath();g.roundRect?g.roundRect(x-w/2-2,y-2,w+4,h+4,4):g.rect(x-w/2-2,y-2,w+4,h+4);g.fill();
 const gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,c1);gr.addColorStop(1,c2);g.fillStyle=gr;g.fillRect(x-w/2,y,w*Math.max(0,Math.min(1,f)),h);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(x-w/2,y,w*Math.max(0,Math.min(1,f)),1.5);
 g.strokeStyle='#c9a95c';g.lineWidth=1;g.strokeRect(x-w/2-.5,y-.5,w+1,h+1);if(label){g.font='bold 10px Georgia,serif';g.textAlign='center';g.lineWidth=3;g.strokeStyle='#120c06';g.strokeText(label,x,y-3);g.fillStyle='#bff5c8';g.fillText(label,x,y-3);}}
{const dr=draw;draw=function(){dr.apply(this,arguments);if(!live())return;g.save();try{const dpr=cinematic.dpr;g.setTransform(dpr,0,0,dpr,-camera.x*dpr,-camera.y*dpr);const t=nowS();
 const R=globalThis.OOZE_ROAM,Z=R&&R.zones[story.zone];
 if(Z&&WORLD.w===Z.W)for(const [s,z] of Object.entries(R.adj[story.zone]||{})){if(!locked(z))continue;const [x,y]=Z.gates[s].p;const vert=s==='W'||s==='E';
  g.save();g.globalCompositeOperation='lighter';for(let k=0;k<3;k++){g.globalAlpha=.18+.08*Math.sin(t*3+k);g.strokeStyle=k?'#ff6a3d':'#ffd257';g.lineWidth=16-k*5;g.beginPath();if(vert){g.moveTo(x,y-110);g.quadraticCurveTo(x+(s==='W'?-18:18)*Math.sin(t*2+k),y,x,y+110);}else{g.moveTo(x-130,y);g.quadraticCurveTo(x,y+(s==='N'?-18:18)*Math.sin(t*2+k),x+130,y);}g.stroke();}
  for(let k=0;k<8;k++){const u=((t*.35+k/8)%1);g.globalAlpha=.6*(1-u);g.fillStyle='#ffb070';const px=vert?x+(Math.sin(k*7)*10):x-120+k*34,py=vert?y-100+k*28:y+(Math.sin(k*7)*10);g.beginPath();g.arc(px,py-u*40,3,0,7);g.fill();}g.restore();
  g.globalAlpha=1;g.font='bold 14px Georgia,serif';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#1a0a04';const msg=sealed(z)?'Path overgrown · not open yet':'⚠ Too dangerous · reach level '+zoneLevel(z);const ty=y-(vert?130:40);g.strokeText(msg,x,ty);g.fillStyle='#ffb48a';g.fillText(msg,x,ty);}
 // hostile pulse outline for foes targeting you
 for(const m of mobs){if(!m.alive||!m.aggro||d2(m,p)>500)continue;const at=aggroT.get(m)||0,age=t-at;if(age<1.2){g.globalAlpha=.7*(1-age/1.2);g.strokeStyle='#ff3b30';g.lineWidth=3;g.beginPath();g.ellipse(m.x,m.y-4,30+age*20,10+age*7,0,0,7);g.stroke();g.globalAlpha=1;}}
 // health bars
 for(const m of mobs){if(!m.alive||!m.maxHp)continue;if(m.hp>=m.maxHp&&!m.aggro&&m!==target)continue;if(m.x<camera.x-60||m.x>camera.x+view.w+60)continue;bar(m.x,m.y-(m.type==='boss'?120:82),m.type==='boss'?70:44,5,m.hp/m.maxHp,'#ff6a5a','#a01818');}
 bar(p.x,p.y-128,54,6,p.hp/p.maxHp,'#8dff7a','#2e9a2a');
 const pe=globalThis.MoonPet&&MoonPet.state;if(pe&&pe.x!=null&&pe.zone===undefined||pe&&pe.zone===story.zone){let f=1;try{if(pe.hp!=null&&pe.maxHp)f=pe.hp/pe.maxHp;}catch(e){}let nm='Pet';try{nm=(MoonPet.name&&MoonPet.name())||customHero.petName||'Pet';}catch(e){}bar(pe.x,pe.y-46,34,4,f,'#7affd8','#1f8f78',nm);}
 // quest marks ! / ?
 for(const m of questMarks()){const b=Math.abs(Math.sin(t*3))*8,x=m.o.x,y=m.o.y-150-b;g.save();g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(x,y,2,x,y,26);gr.addColorStop(0,m.kind==='?'?'#9fe3ff':'#ffe27a');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,26,0,7);g.fill();g.restore();
  g.font='900 30px Georgia,serif';g.textAlign='center';g.lineWidth=5;g.strokeStyle='#2a1500';g.strokeText(m.kind,x,y+10);g.fillStyle=m.kind==='?'?'#bff0ff':'#ffd257';g.fillText(m.kind,x,y+10);}
 // loot sparkle
 if(typeof drops!=='undefined')for(const d of drops){const s=Math.sin(t*6+d.x)*.5+.5;g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.5+.5*s;g.fillStyle='#fff6c0';g.translate(d.x,d.y-14);g.rotate(t*2);g.fillRect(-1,-7,2,14);g.fillRect(-7,-1,14,2);g.restore();}
 // screen space: low-health vignette + off-screen objective arrow
 g.setTransform(dpr,0,0,dpr,0,0);const W=innerWidth,H=innerHeight;
 if(p.hp>0&&p.hp<p.maxHp*.3){const a=.18+.25*lowPulse;const gr=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);gr.addColorStop(0,'rgba(180,0,0,0)');gr.addColorStop(1,'rgba(200,10,10,'+a+')');g.fillStyle=gr;g.fillRect(0,0,W,H);}
 const tp=trackedPoint();if(tp){const [sx,sy]=screenOf(tp.x,tp.y);const m=40;if(sx<m||sx>W-m||sy<m+40||sy>H-m-60){const cx=W/2,cy=H/2,a=Math.atan2(sy-cy,sx-cx);const k=Math.min((W/2-m)/Math.abs(Math.cos(a)||1e-6),(H/2-m-50)/Math.abs(Math.sin(a)||1e-6));const ax=cx+Math.cos(a)*k,ay=cy+Math.sin(a)*k;g.save();g.translate(ax,ay);g.rotate(a);g.globalAlpha=.75+.25*Math.sin(t*4);g.fillStyle='#ffd257';g.strokeStyle='#2a1500';g.lineWidth=3;g.beginPath();g.moveTo(16,0);g.lineTo(-10,-11);g.lineTo(-4,0);g.lineTo(-10,11);g.closePath();g.stroke();g.fill();g.restore();}}
}catch(e){}g.restore();};}
/* ---------- CSS: talk bubble, dialog buttons, spell bar, HUD declutter ---------- */
const css=document.createElement('style');css.textContent=`
#ozTalk{position:fixed;z-index:35;transform:translate(-50%,-100%);min-width:92px;height:56px;padding:0 18px;border-radius:30px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;user-select:none;touch-action:none;
 background:radial-gradient(circle at 35% 30%,#eafff6 0,#7ef0c4 22%,#1f9a78 70%,#0d4a3a 100%);border:3px solid #ffd257;box-shadow:0 0 18px #6effc0aa,0 6px 14px rgba(0,0,0,.5),inset 0 -6px 12px rgba(0,40,30,.5);color:#08241c;font:900 22px Georgia,serif;animation:ozBob 1.4s ease-in-out infinite}
#ozTalk[hidden]{display:none}#ozTalk small{font:700 11px sans-serif;background:#2a1a00;color:#ffd257;border-radius:6px;padding:2px 5px}#ozTalk .ozt-b{position:absolute;left:12px;top:8px;width:12px;height:7px;border-radius:50%;background:rgba(255,255,255,.75)}
#ozTalk:after{content:'';position:absolute;bottom:-12px;left:50%;margin-left:-9px;border:9px solid transparent;border-top-color:#ffd257}
@keyframes ozBob{0%,100%{margin-top:0}50%{margin-top:-6px}}
body.oz-has-talk #mvPrompt,body.oz-has-talk #interactBtn{visibility:hidden}
#mvTalk .oz-big-accept,#mvTalk .oz-big-decline{min-height:52px!important;min-width:132px!important;font-size:18px!important;font-weight:900!important;border-radius:14px!important;margin:6px 4px 0!important}
#mvTalk .oz-big-accept{background:linear-gradient(#ffe68a,#d4a020)!important;background-image:linear-gradient(#ffe68a,#d4a020)!important;color:#2a1600!important;border:2px solid #fff3b0!important;box-shadow:0 0 14px #ffd25799!important}
#mvTalk .oz-big-decline{background:linear-gradient(#5a3a3a,#3a2020)!important;background-image:linear-gradient(#5a3a3a,#3a2020)!important;color:#ffd9d0!important;border:2px solid #a06050!important}
#mvTalk .mvk-row{flex-wrap:wrap}
#hotbar>*{--sc:#7ef0c4;transform:scale(1.18);transform-origin:center;border:3px solid var(--sc)!important;box-shadow:0 0 0 2px #6b4a1a,0 0 14px var(--sc),inset 0 0 10px color-mix(in srgb,var(--sc) 55%,transparent)!important;border-radius:50%}
#hotbar>*:nth-child(1){--sc:#ffb347}#hotbar>*:nth-child(2){--sc:#7ef0c4}#hotbar>*:nth-child(3){--sc:#b98cff}#hotbar>*:nth-child(4){--sc:#ff7a9c}#hotbar>*:nth-child(5){--sc:#7fd8ff}
@media(max-width:700px){#hotbar>*{transform:scale(1.32)}}
#hotbar>*.oz-pulse{animation:ozPulse 1s ease-in-out infinite}@keyframes ozPulse{0%,100%{box-shadow:0 0 0 2px #6b4a1a,0 0 10px var(--sc)}50%{box-shadow:0 0 0 2px #6b4a1a,0 0 30px 6px var(--sc)}}
#ozCastHint{position:fixed;z-index:36;transform:translate(-50%,-100%);background:#1b1208ee;color:#ffe9a8;border:2px solid #ffd257;border-radius:12px;padding:8px 12px;font:700 15px Georgia,serif;pointer-events:none;white-space:nowrap;box-shadow:0 0 14px #ffd25766;animation:ozBob 1.2s ease-in-out infinite}#ozCastHint[hidden]{display:none}#ozCastHint i{font-style:normal;color:#7ef0c4}
#ozToast{position:fixed;left:50%;top:18%;transform:translate(-50%,-10px);opacity:0;transition:all .25s;z-index:60;background:#140d06ee;color:#ffe9c8;border:2px solid #ffd257;border-radius:14px;padding:10px 16px;font:700 15px Georgia,serif;max-width:88vw;text-align:center;pointer-events:none}#ozToast.on{opacity:1;transform:translate(-50%,0)}
[data-mvhero=prismancer] .mvc-portrait{background:url(art/prismancer/portrait-hybrid.png?v=3) center 20%/cover no-repeat!important;border-radius:50%;overflow:hidden}[data-mvhero=prismancer] .mvc-portrait canvas{opacity:0}
.mvc-look[data-look^=prism] canvas{filter:none}
.mvc-look[data-look=prismpearl] canvas{background:url(art/prismancer/portrait-hybrid.png?v=3) center 20%/cover no-repeat;border-radius:12px}.mvc-look[data-look=prismgilt] canvas{background:url(art/prismancer/portrait-prismgilt.png) center 20%/cover no-repeat;border-radius:12px}.mvc-look[data-look=prismtide] canvas{background:url(art/prismancer/portrait-prismtide.png) center 20%/cover no-repeat;border-radius:12px}[data-mvhero=prismancer] .mvc-portrait{background:url(art/prismancer/portrait-hybrid.png?v=3) center 20%/cover no-repeat;border-radius:50%}
#combatLog{opacity:.0!important;pointer-events:none}#spellHelp{display:none!important}
`;document.head.appendChild(css);
globalThis.OozePolish={zoneLevel,locked,sealed,CUE,toast,questMarks,placeTalk,endHint};
})();
/* hover target for enemy nameplates */
addEventListener('pointermove',e=>{try{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();const wx=camera.x+(e.clientX-r.left)*view.w/r.width,wy=camera.y+(e.clientY-r.top)*view.h/r.height;let best=null,bd=60;for(const m of (typeof mobs!=='undefined'?mobs:[])){if(!m.alive)continue;const d=Math.hypot(m.x-wx,(m.y-40)-wy);if(d<bd){bd=d;best=m;}}globalThis.__ozHoverMob=best;}catch(_){}},{passive:true});
