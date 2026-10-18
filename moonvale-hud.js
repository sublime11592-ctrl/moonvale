'use strict';
/* Moonvale HUD v2: a clean, portrait-first layout modelled on the reference mockups.
   - compact portrait (name, class, level, slim HP/MP bars, buff icons with timers)
   - small centred zone + clock banner, round ornate minimap with enemy dots, translucent quest tracker
   - loot feed, ability-name callouts, restyled damage numbers and enemy name plates (drawn on the canvas)
   - ornate joystick, potion button, 5-skill arc with labels, slim bottom bar (level, XP, nav, chat)
   The game's own buttons/ids stay in the DOM (hidden or restyled), so every key binding and game
   system keeps working; the new widgets read game state each frame and click the original controls. */
(()=>{
 const field=$('field'),footer=document.querySelector('footer');if(!field||!footer)return;
 document.body.classList.add('mv-hud','mv-ui2');
 const el=(tag,id,cls,html='')=>{const e=document.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;e.innerHTML=html;return e;};
 const click=id=>{if(typeof id==='function')return id();const b=typeof id==='string'?($(id)||document.querySelector(id)):id;if(b&&!b.disabled)b.click();};
 const ICON=k=>'--mvpos:'+((k%5)/4*100)+'% '+(Math.floor(k/5)/3*100)+'%';
 if(!$('zoneBanner'))field.appendChild(el('div','zoneBanner','','<i></i><b></b><small></small>'));

 // ---------- player frame ----------
 const pf=el('div','mvPlayer','mv-player',
  '<div class="mv-portrait" id="mvPortrait"><canvas width="128" height="128"></canvas></div><b class="mv-lvl" id="mvLevel">1</b>'+
  '<div class="mv-id"><b id="mvName">Wanderer</b><small id="mvClass">Class</small></div>'+
  '<div class="mv-bar hp"><i id="mvHp"></i><span id="mvHpT"></span></div><div class="mv-bar mp"><i id="mvMp"></i><span id="mvMpT"></span></div>'+
  '<div class="mv-res" id="mvRes"></div><div class="mv-buffs" id="mvBuffs"></div>');
 pf.querySelector('.mv-portrait').onclick=()=>click('classBtn');field.appendChild(pf);
 const cur=el('div','mvCurrency','mv-currency','<span class="mv-pill gold"><i></i><b id="mvGold">0</b></span><span class="mv-pill gem"><i></i><b id="mvPower">0</b></span>');field.appendChild(cur);

 // ---------- zone banner (top centre) ----------
 field.appendChild(el('div','mvZoneBar','mv-zonebar','<b id="mvZone"></b><small><span id="moonClock"></span></small>'));

 // ---------- minimap ----------
 const mm=el('div','mvMap','mv-map','<canvas width="240" height="240"></canvas><i class="mv-n">N</i><i class="mv-rim"></i>');field.appendChild(mm);
 const mctx=mm.querySelector('canvas').getContext('2d');mm.onclick=()=>click('mvNavQuests');

 // ---------- quest tracker ----------
 const qt=el('div','mvQuest','mv-quest','');field.appendChild(qt);qt.onclick=()=>{if(typeof openJournal==='function')openJournal();};

 // ---------- loot feed ----------
 const feed=el('div','mvFeed','mv-feed','');field.appendChild(feed);
 function feedItem(text,kind){const d=el('div','','mv-feed-item '+kind,'<i></i><span></span>');d.querySelector('span').textContent=text;feed.prepend(d);while(feed.children.length>4)feed.lastChild.remove();setTimeout(()=>d.classList.add('out'),4200);setTimeout(()=>d.remove(),5000);}
 {const before=log;log=function(s){before(s);const m=/^Loot · (.*)$/.exec(String(s));if(!m)return;const t=m[1];let g;
  if((g=/^(\d+) gold$/i.exec(t)))feedItem('+'+g[1]+' Gold','gold');else if(/tonic/i.test(t))feedItem('+1 '+t.replace(/^\w/,c=>c.toUpperCase()),'potion');else feedItem('+ '+t,'item');};}

 // ---------- joystick, potion, chat ----------
 const stick=$('stick');if(stick)stick.insertAdjacentHTML('afterbegin','<i class="mv-stick-rim"></i><i class="mv-arrow n"></i><i class="mv-arrow e"></i><i class="mv-arrow s"></i><i class="mv-arrow w"></i>');
 const knob=$('knob');if(knob)knob.innerHTML='<i class="mv-emblem"></i>';
 const potion=el('button','mvPotion','mv-potion','<i></i><b id="mvPotionN">0</b>');potion.setAttribute('aria-label','Drink tonic (Q)');potion.onclick=()=>click('potionBtn');field.appendChild(potion);
 const chatBtn=el('button','mvChatBtn','mv-chatbtn','<i></i>');chatBtn.setAttribute('aria-label','Show messages');field.appendChild(chatBtn);
 const chat=$('combatLog');if(chat){chat.classList.add('mv-chat');}
 chatBtn.onclick=()=>document.body.classList.toggle('mv-chat-open');

 // ---------- skill arc ----------
 const arc=el('div','mvArc','mv-arc');field.appendChild(arc);
 const hot=$('hotbar'),auto=$('autoBtn');if(hot)arc.appendChild(hot);if(auto)arc.appendChild(auto);
 const tgt=el('button','mvTarget','mv-mini target','<i></i>');tgt.setAttribute('aria-label','Next target (Tab)');tgt.onclick=()=>click('targetBtn');arc.appendChild(tgt);
 const dodge=el('button','mvDodge','mv-mini dodge','<i></i><small id="mvDodgeCd"></small>');dodge.setAttribute('aria-label','Dodge roll (Space)');dodge.onclick=()=>click('dodgeBtn');arc.appendChild(dodge);
 let labelsFor='';
 function skillLabels(){const sk=CLASSES[p.cls]?.skills;if(!sk||!hot)return;const key=p.cls+hot.children.length;if(key===labelsFor&&hot.querySelector('.mv-label'))return;labelsFor=key;
  [...hot.children].forEach((b,i)=>{let l=b.querySelector('.mv-label');if(!l){l=el('em','','mv-label');b.appendChild(l);}l.textContent=sk[i]?.[0]||'';});}

 // ---------- contextual interact prompt ----------
 const prompt=el('button','mvPrompt','mv-prompt','<kbd>E</kbd><span></span>');prompt.onclick=()=>{const b=$('interactBtn');if(b&&b.onclick)b.onclick();};field.appendChild(prompt);

 // ---------- bottom bar ----------
 const bar=el('nav','mvNav','mv-nav','<div class="mv-badge"><b id="mvBadge">1</b></div><div class="mv-xp"><small id="mvXpL">Lv. 1</small><div class="mv-xpbar"><i id="mvXp"></i><span id="mvXpT"></span></div></div>');
 const items=[['bag','Bag',()=>typeof openInventory==='function'?openInventory():click('classBtn')],['hero','Hero','classBtn'],['skills','Skills','menuSkills'],['quests','Quests',()=>typeof openJournal==='function'&&openJournal()],['more','More',()=>document.body.classList.toggle('mv-more-open')]];
 const navBox=el('div','','mv-navbtns');
 for(const [icon,label,act] of items){const b=el('button','mvNav'+label,'mv-nav-'+icon,'<i></i><span>'+label+'</span>');
  b.onclick=()=>{if(typeof act==='function')return act();const t=$(act);if(t)t.click();else if(act==='menuSkills'){click('adventureMenu');setTimeout(()=>click('menuSkills'),30);}};navBox.appendChild(b);}
 bar.appendChild(navBox);footer.appendChild(bar);
 // "More" sheet: everything that used to clutter the screen edges
 const more=el('div','mvMore','mv-more','');field.appendChild(more);
 const moreItems=[['Trail run','R','trailRun'],['Racial','G','racialAbility'],['Signature','F','.signature-button'],['World map','',()=>typeof openWorld==='function'&&openWorld()],['Codex','','helpBtn'],['Menu','Esc','adventureMenu']];
 for(const [label,key,id] of moreItems){const b=el('button','','','<span></span><kbd></kbd>');b.querySelector('span').textContent=label;b.querySelector('kbd').textContent=key;b.onclick=()=>{document.body.classList.remove('mv-more-open');click(id);};more.appendChild(b);}
 document.addEventListener('pointerdown',e=>{if(document.body.classList.contains('mv-more-open')&&!more.contains(e.target)&&!e.target.closest('.mv-nav-more'))document.body.classList.remove('mv-more-open');},true);

 // ---------- portrait painter ----------
 let lastKey='';
 function paintPortrait(){const f=heroFrame?.(p.cls,'front');if(!f)return;const src=(f.novice&&typeof jointSource==='function')?(()=>{try{const c=jointSource(f,true);return {img:c,sx:0,sy:0,sw:c.width,sh:c.height};}catch(e){return f;}})():f;
  const key=p.cls+'|'+src.sw+'|'+src.sh+'|'+(src.img?.width||0);if(key===lastKey)return;lastKey=key;
  const c=pf.querySelector('canvas'),x=c.getContext('2d');x.clearRect(0,0,128,128);
  // find the head: the topmost wide row of opaque pixels (skips staff tips and sparks)
  let top=0;try{const t=document.createElement('canvas');t.width=64;t.height=Math.max(1,Math.round(64*src.sh/src.sw));const tx=t.getContext('2d');tx.drawImage(src.img,src.sx,src.sy,src.sw,src.sh,0,0,t.width,t.height);
   const d=tx.getImageData(0,0,t.width,t.height).data;for(let y=0;y<t.height;y++){let n=0;for(let xx=0;xx<64;xx++)if(d[(y*64+xx)*4+3]>128)n++;if(n>=9){top=y/t.height;break;}}}catch(e){}
  const cropW=src.sw*.5,cropH=cropW,sy=src.sy+Math.max(0,top*src.sh-cropH*.06);x.imageSmoothingQuality='high';
  x.drawImage(src.img,src.sx+(src.sw-cropW)/2,sy,cropW,cropH,0,4,128,128);}

 // ---------- minimap painter ----------
 const MR=900; // world units across
 function drawMini(){const W=240,c=mctx;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,W,W);c.save();c.beginPath();c.arc(W/2,W/2,W/2,0,Math.PI*2);c.clip();
  c.fillStyle='#0b1412';c.fillRect(0,0,W,W);const s=W/MR,ox=clamp(p.x-MR/2,0,Math.max(0,WORLD.w-MR)),oy=clamp(p.y-MR/2,0,Math.max(0,WORLD.h-MR));/* keep the map window inside the world: no empty band at the edges */
  if(art&&art.complete&&art.naturalWidth){const kx=art.naturalWidth/WORLD.w,ky=art.naturalHeight/WORLD.h;c.globalAlpha=.9;c.drawImage(art,ox*kx,oy*ky,MR*kx,MR*ky,0,0,W,W);c.globalAlpha=1;}
  const g2=c.createRadialGradient(W/2,W/2,W*.25,W/2,W/2,W/2);g2.addColorStop(0,'rgba(0,0,0,0)');g2.addColorStop(1,'rgba(0,0,0,.55)');c.fillStyle=g2;c.fillRect(0,0,W,W);
  const P=(x,y)=>[(x-ox)*s,(y-oy)*s];
  try{for(const o of [...(objectivePoints?.()||[]),...(portals?.()||[])]){const [x,y]=P(o.x,o.y);c.fillStyle=o.glyph==='!'?'#ffd257':o.resident?'#9fe3b0':'#ffe08b';c.beginPath();c.arc(x,y,o.glyph==='!'?5:3.5,0,7);c.fill();if(o.glyph==='!'){c.fillStyle='#2a1a00';c.font='bold 8px sans-serif';c.textAlign='center';c.fillText('!',x,y+3);}}}catch(e){}
  {const [x,y]=P(CAMP.x,CAMP.y);c.fillStyle='#ffb347';c.shadowColor='#ff9a2a';c.shadowBlur=8;c.beginPath();c.arc(x,y,4,0,7);c.fill();c.shadowBlur=0;}
  for(const m of mobs){if(!m.alive)continue;const [x,y]=P(m.x,m.y);if(x<-6||y<-6||x>W+6||y>W+6)continue;const boss=m.type==='boss';c.fillStyle=boss?'#d070ff':'#ff3b30';c.strokeStyle='#2a0000';c.lineWidth=1.5;c.beginPath();c.arc(x,y,boss?6:4,0,7);c.fill();c.stroke();}
  // player arrow
  const a=Math.atan2(p.dy||0,p.dx||0)||(p.dir==='left'?Math.PI:p.dir==='up'?-Math.PI/2:p.dir==='down'?Math.PI/2:0);
  const moving=Math.hypot(p.dx||0,p.dy||0)>.05;if(moving)drawMini.a=a;const ang=drawMini.a??-Math.PI/2;
  {const [hx,hy]=P(p.x,p.y);c.translate(hx,hy);}c.rotate(ang+Math.PI/2);c.fillStyle='#ffe9a8';c.strokeStyle='#3a2600';c.lineWidth=2;c.beginPath();c.moveTo(0,-10);c.lineTo(7,8);c.lineTo(0,4);c.lineTo(-7,8);c.closePath();c.stroke();c.fill();
  c.restore();}

 // ---------- quest tracker ----------
 let qKey='';
 function questHtml(){const rows=[];const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const split=t=>{const m=/^(.*?)(?:\s*·\s*)?(\d+\s*\/\s*\d+)$/.exec(t);return m?[m[1],m[2].replace(/\s/g,'')]:[t,''];};
  const obj=(t,done,count)=>'<li class="'+(done?'done':'')+'"><i></i><span>'+esc(t)+'</span>'+(count?'<em>'+esc(count)+'</em>':'')+'</li>';
  const ch=typeof chapters!=='undefined'?chapters[story.step]:null;
  if(ch){const [t,c]=split($('questText')?.textContent||ch[0]);const done=c&&c.split('/')[0]===c.split('/')[1];rows.push('<h4>'+esc(ch[0])+'</h4><ul>'+obj(t===ch[0]?ch[1].split('.')[0]:t,done,c)+'</ul>');}
  try{const q=typeof activeQuest==='function'?activeQuest():null;if(q){const c=typeof questCountText==='function'?questCountText(q):'';rows.push('<h4>'+esc(q.title)+'</h4><ul>'+obj(q.description?.split('.')[0]||'',false,/\d+\/\d+/.test(c)?c:'')+'</ul>');}}catch(e){}
  if(!rows.length){const h=$('questText')?.textContent||'Explore Moonvale';const [t,c]=split(h);rows.push('<h4>Quests</h4><ul>'+obj(t,false,c)+'</ul>');}
  const extra=typeof questLog!=='undefined'?questLog.accepted.size:0;
  return '<div class="mv-qh"><i></i>Quests'+(questLog?.ready?.size?'<b class="ready">'+questLog.ready.size+' ready</b>':'')+'</div>'+rows.slice(0,2).join('')+(extra?'<div class="mv-qf">+'+extra+' in journal</div>':'');}

 // ---------- buffs ----------
 function buffs(){const out=[];const rest=dist(p,CAMP)<125;
  if(rest)out.push([19,'','Rested']);if(p.guard>0)out.push([13,Math.ceil(p.guard)+'s','Guard']);if(p.shield>0)out.push([7,Math.ceil(p.shield),'Ward']);if(p.regen>0)out.push([10,Math.ceil(p.regen)+'s','Regen']);if(p.evade>0)out.push([2,p.evade.toFixed(1),'Evade']);
  return out.slice(0,4).map(([k,t,n])=>'<span title="'+n+'"><i style="'+ICON(k)+'"></i><small>'+t+'</small></span>').join('');}

 // ---------- per-frame sync ----------
 let tick=0,lastBuffs='';
 function screenOf(x,y){const r=$('game').getBoundingClientRect(),fr=field.getBoundingClientRect(),s=r.width/view.w;return [r.left-fr.left+(x-camera.x)*s,r.top-fr.top+(y-camera.y)*s,s];}
 function sync(){tick++;
  try{
   const cls=CLASSES[p.cls]||{};
   $('mvLevel').textContent=p.level;$('mvBadge').textContent=p.level;$('mvXpL').textContent='Lv. '+p.level;
   $('mvName').textContent=(typeof heroName==='function'?heroName():'Wanderer');const ce=$('mvClass');ce.textContent=cls.name||'';ce.style.color=cls.color||'#c9a6ff';
   $('mvHp').style.width=Math.max(0,p.hp/p.maxHp*100)+'%';$('mvHpT').textContent=Math.ceil(p.hp).toLocaleString()+' / '+p.maxHp.toLocaleString();
   $('mvMp').style.width=Math.max(0,p.mana)+'%';$('mvMpT').textContent=Math.floor(p.mana)+' / 100';
   $('mvXp').style.width=(p.xp/p.nextXp*100)+'%';$('mvXpT').textContent=p.xp.toLocaleString()+' / '+p.nextXp.toLocaleString();
   $('mvGold').textContent=Number(p.gold||0).toLocaleString();$('mvPower').textContent=$('power')?.textContent||p.power;
   $('mvPotionN').textContent=p.potions;potion.classList.toggle('empty',!p.potions);
   $('mvDodgeCd').textContent=p.dodge>0?p.dodge.toFixed(1):'';dodge.classList.toggle('cooling',p.dodge>0);
   pf.classList.toggle('low',p.hp/p.maxHp<.3);
   const res=document.querySelector('#playerFrame .class-resource div');$('mvRes').textContent=res?[...res.childNodes].map(n=>n.textContent.replace(/\s+/g,' ').trim()).filter(Boolean).join(' '):'';
   const b=buffs();if(b!==lastBuffs){$('mvBuffs').innerHTML=b;lastBuffs=b;}
   $('mvZone').textContent=(typeof zones!=='undefined'&&zones[story.zone]?.name)||'';
   if(tick%30===1){paintPortrait();skillLabels();const h=questHtml();if(h!==qKey){qt.innerHTML=h;qKey=h;}}
   if(started&&tick%2===0){try{drawMini();}catch(e){try{mctx.restore();}catch(_){}}}
   // interact prompt: over the nearest interaction point, or the campfire when resting
   let o=null;try{o=typeof nearestInteraction==='function'?nearestInteraction():null;}catch(e){}
   let label='';if(o){label=o.zone!==undefined?(o.label||'Travel'):(o.label||'Interact');}else if(dist(p,CAMP)<140){o=CAMP;label='Camp';}
   if(o&&started&&!(typeof isPaused==='function'&&isPaused())){const [x,y]=screenOf(o.x,o.y);const onTop=dist(p,o)<64;/* standing on it (campfire): tuck the prompt under the hero's feet instead of over the body */const [hx,hy]=screenOf(p.x,p.y);prompt.style.transform=onTop?'translate('+Math.round(hx)+'px,'+Math.round(hy+10)+'px) translate(-50%,0)':'translate('+Math.round(x)+'px,'+Math.round(y-(o===CAMP?70:96))+'px) translate(-50%,-100%)';prompt.querySelector('span').textContent=label.split(' · ')[0];prompt.classList.add('on');}else prompt.classList.remove('on');
  }catch(e){if(!sync.warned){sync.warned=1;console.warn('HUD sync',e);}}
  requestAnimationFrame(sync);}
 requestAnimationFrame(sync);
 setTimeout(()=>window.dispatchEvent(new Event('resize')),50);

 // ---------- canvas overlays: NPC labels, ability callouts ----------
 const callouts=[];globalThis.MoonUI={callouts};
 // ability callout: any skill whose cooldown just started was cast (works for keys, taps and auto-cast)
 const prevCd=[];setInterval(()=>{try{if(!started||!p.cd)return;const sk=CLASSES[p.cls].skills;p.cd.forEach((v,i)=>{if(v>.3&&!(prevCd[i]>.05)&&sk[i]){callouts.push({s:sk[i][0]+'!',t:0,color:CLASSES[p.cls].color});if(callouts.length>2)callouts.shift();}prevCd[i]=v;});}catch(e){}},50);
 const roleColor={journal:'#ffd36b',shop:'#a9e6a1',world:'#8fd6ff'};
 {const before=draw;draw=function(){before();if(!started)return;const d=cinematic.dpr;g.save();g.setTransform(d,0,0,d,-camera.x*d,-camera.y*d);g.textAlign='center';g.lineJoin='round';
   let pts=[];try{pts=objectivePoints().filter(o=>o.resident);}catch(e){}
   const folkByName={};try{for(const n of [...residents,...(typeof campTownsfolk==='function'?campTownsfolk():[])])folkByName[n.name.split(' · ')[0]]=n;}catch(e){}
   for(let o of pts){const name=o.label.split(' · ')[0],quest=o.glyph==='!'||/quest/i.test(o.label);let sh=96;
    try{const n=folkByName[name];const f=n&&typeof npcFrame==='function'?npcFrame(n,'front'):null;if(f)sh=77*(f.scale||1);}catch(e){}
    const y=o.y-sh-12;
    g.font='700 11px "MV Fira","Trebuchet MS",system-ui,sans-serif';if(y-24-camera.y<(globalThis.MV_TOPBAND||0))continue;{const w=g.measureText(name).width;o={...o,x:clamp(o.x,camera.x+8+w/2,camera.x+view.w-8-w/2)};}
    g.lineWidth=3;g.strokeStyle='rgba(6,8,12,.9)';g.strokeText(name,o.x,y);g.fillStyle=roleColor[o.resident]||'#e8e0c8';g.fillText(name,o.x,y);
    if(quest){const by=y-20+Math.sin(time*2.4)*1.5;g.fillStyle='#f6ecd2';g.strokeStyle='#2a2112';g.lineWidth=1.5;g.beginPath();g.roundRect?g.roundRect(o.x-9,by-7,18,13,4):g.rect(o.x-9,by-7,18,13);g.fill();g.stroke();g.beginPath();g.moveTo(o.x-3,by+6);g.lineTo(o.x-6,by+10);g.lineTo(o.x+1,by+6);g.fill();
     g.fillStyle='#3a2a10';for(let k=-1;k<=1;k++){g.beginPath();g.arc(o.x+k*4,by-.5,1.3,0,7);g.fill();}}}
   // ability callout above the hero
   for(let i=callouts.length-1;i>=0;i--){const c=callouts[i];c.t+=1/60;if(c.t>1.1){callouts.splice(i,1);continue;}
    const a=c.t<.12?c.t/.12:c.t>.8?1-(c.t-.8)/.3:1,sc=c.t<.12?.7+.3*(c.t/.12):1,y=p.y-128-c.t*14-(callouts.length-1-i)*20;
    g.globalAlpha=Math.max(0,a);g.font='italic 700 '+Math.round(15*sc)+'px Georgia,"Palatino Linotype",serif';g.lineWidth=4;g.strokeStyle='rgba(10,6,18,.95)';g.strokeText(c.s,p.x+8,y);g.fillStyle=c.color;g.fillText(c.s,p.x+8,y);
    const w=g.measureText(c.s).width;g.save();g.translate(p.x+8-w/2-12,y-5);g.rotate(Math.PI/4);g.fillStyle=c.color;g.strokeStyle='#120a1a';g.lineWidth=1.5;g.fillRect(-4,-4,8,8);g.strokeRect(-4,-4,8,8);g.restore();g.globalAlpha=1;}
   g.restore();};}
 // ---------- enemy name plates: small name + thin red bar, shown for nearby foes ----------
 if(typeof drawEnemyStatus==='function'){drawEnemyStatus=function(o,h){if(!o.alive)return;if(o.y-h-20-camera.y<(globalThis.MV_TOPBAND||0))return;const near=dist(p,o)<330;if(!(near||o===target||o.aggro||o.hp<o.maxHp))return;
   const sel=o===target,w=o.type==='boss'?70:44,y=o.y-h-8;g.save();g.textAlign='center';g.lineJoin='round';
   g.font=(sel?'700 ':'600 ')+(o.type==='boss'?12:10.5)+'px "MV Fira","Trebuchet MS",system-ui,sans-serif';const nm=o.name+(o.type==='boss'||sel?' · '+o.level:'');
   g.lineWidth=3;g.strokeStyle='rgba(8,6,10,.92)';g.strokeText(nm,o.x,y-6);g.fillStyle=sel?'#ffe6b0':o.type==='boss'?'#f0c0ff':'#f2e4dc';g.fillText(nm,o.x,y-6);
   g.fillStyle='rgba(10,4,6,.9)';g.fillRect(o.x-w/2-1,y-1,w+2,5);const f=clamp(o.hp/o.maxHp,0,1);const gr=g.createLinearGradient(0,y,0,y+3);gr.addColorStop(0,'#ff6a5a');gr.addColorStop(1,'#a3161a');g.fillStyle=gr;g.fillRect(o.x-w/2,y,w*f,3);
   if(o.cast){g.fillStyle='#ffcf6b';g.fillRect(o.x-w/2,y+4,w*clamp(1-o.cast.left/(o.cast.total||1.5),0,1),2);}
   if(sel){g.strokeStyle='rgba(255,214,140,.9)';g.lineWidth=1;g.strokeRect(o.x-w/2-1.5,y-1.5,w+3,6);}g.restore();};}
})();

// ---------- Camp layout: spread the lantern-camp folk around the fire; they stay home in the Elder Grove ----------
(()=>{if(typeof residents==='undefined')return;
 const home=()=>story.zone===0&&!(zones[0]&&zones[0].frontier);
 const spot={quartermaster:[-104,-86],chronicler:[-22,-132],caravan:[106,-80],wayfarer:[-205,-30]};
 const folk={smith:[-116,14],innkeeper:[116,20]};let cache=null,ck='';
 if(typeof campTownsfolk==='function'){const base=campTownsfolk;campTownsfolk=function(){if(!home())return [];const k=CAMP.x+','+CAMP.y;
   if(k!==ck||!cache){ck=k;cache=base();for(const n of cache){const o=folk[n.id];if(o){n.x=CAMP.x+o[0];n.y=CAMP.y+o[1];}}}return cache;};}
 // Vale's quest-giver marker follows her new spot by the fire (only the plain camp giver, not realm/frontier givers)
 if(typeof questGiver==='function'){const qg=questGiver;questGiver=function(q){const r=qg(q);if(r&&/^Vale/.test(r.label||'')&&r.x===CAMP.x+90&&r.y===CAMP.y-65){r.x=CAMP.x+spot.chronicler[0];r.y=CAMP.y+spot.chronicler[1];}return r;};}
 const before=update;update=function(dt){before(dt);try{const h=home();for(const n of residents){const o=spot[n.id];if(!o)continue;
   if(!h){const q=n.id==='chronicler'&&typeof questGiver==='function'?questGiver():null;if(q&&/^Vale/.test(q.label||'')){n.x=q.x;n.y=q.y;}else{n.x=-9999;n.y=-9999;}continue;}
   if(n.id==='wayfarer'){const ox=n.x,oy=n.y;n.x=CAMP.x+o[0]+Math.sin(time*.09)*22;n.y=CAMP.y+o[1]+Math.sin(time*.13)*8;const s=stateFor(n);if(ox>-9000)s.face=facingFrom(n.x-ox,n.y-oy,s.face);}
   else{n.x=CAMP.x+o[0];n.y=CAMP.y+o[1];}}}catch(e){}};
})();

// ---------- polish: world labels (shared font, outline, kept on screen, hidden under the top HUD band) ----------
(()=>{
 const FONT='"MV Fira","Fira Sans",system-ui,sans-serif';
 // canvas text only uses a web font once it is loaded; load ours up front so the first frames don't fall back
 if(document.fonts&&document.fonts.load){['600 12px','700 12px','800 12px','900 24px','italic 800 14px'].forEach(f=>document.fonts.load(f+' "MV Fira"').catch(()=>{}));document.fonts.load('700 12px "MV Cinzel"').catch(()=>{});}
 function band(){const c=canvas.getBoundingClientRect(),k=(c.width||1)/view.w,z=document.querySelector('.mv-zonebar');
  // on phones everything above the zone banner's bottom edge is HUD; on desktop the HUD row is thinner
  globalThis.MV_TOPBAND=z&&c.width<900?Math.max(0,(z.getBoundingClientRect().bottom-c.top)/k):0;}
 window.addEventListener('resize',()=>setTimeout(band,60));setTimeout(band,400);setInterval(band,2000);
 if(typeof label==='function'){label=function(s,x,y,c='#eee8d2',size=12){s=String(s);const t=g.getTransform(),d=cinematic.dpr||1;
   const world=Math.abs(t.e+camera.x*d)<1.5&&Math.abs(t.f+camera.y*d)<1.5;
   g.save();g.font='600 '+size+'px '+FONT;g.textAlign='center';g.textBaseline='alphabetic';
   if(world){if(y-camera.y<(globalThis.MV_TOPBAND||0)+size*.4){g.restore();return;}
     if(x<camera.x-40||x>camera.x+view.w+40){g.restore();return;}/* anchor well off-screen: no orphan label */
     const w=g.measureText(s).width,m=6;x=Math.min(Math.max(x,camera.x+m+w/2),camera.x+view.w-m-w/2);}
   g.lineJoin='round';g.lineWidth=Math.max(2.5,size*.24);g.strokeStyle='rgba(6,8,14,.9)';g.strokeText(s,x,y);g.fillStyle=c;g.fillText(s,x,y);g.restore();};}
})();

// ---------- polish: inventory hero preview shows the painted hero (it rendered blank for painted art) ----------
(()=>{if(typeof openInventory!=='function')return;const before=openInventory;openInventory=function(...a){const r=before.apply(this,a);
 try{const img=document.querySelector('.epic-wardrobe-preview img');const f=heroFrame(p.cls,'front');
  if(img&&f&&!f.novice&&f.img&&f.sw&&f.sh){const c=document.createElement('canvas');c.width=240;c.height=320;const x=c.getContext('2d');
   const h=Math.min(296,296),w=h*f.sw/f.sh,W=Math.min(w,228),H=W*f.sh/f.sw;x.imageSmoothingQuality='high';
   x.drawImage(f.img,f.sx||0,f.sy||0,f.sw,f.sh,120-W/2,312-H,W,H);img.src=c.toDataURL();}}catch(e){}
 return r;};})();
