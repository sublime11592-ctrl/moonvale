'use strict';
/* Oozevale juice (design/juice.md) + design must-fixes (design/review.md, classes.md). Loaded LAST.
   Wraps, never edits, the older layers:
   §6 sound: sweep()/noiseHit() synth, an SFX table (squelch, hit, jellyHit, crit, kill, multikill, hurt, heartbeat, summon,
      pounce, slurp, lootRare, lootEpic, signature, levelUp, evolve, uiTap, uiDeny) with ±6 % pitch / ±1.5 dB jitter,
      per-key cooldowns and a compressor on soundBus. Fixes the silent sfx('hit').
   §2 hit-stop: freeze-then-ease curve, max 180 ms, merged by max, at most one new stop per 100 ms.
   §3 trauma shake: trauma² × 10 px, linear decay 1.6/s; drives cinematic.shake (Ooze Quake 0.55, was 0.2 px).
   §4 droplet splats with one bounce + ground puddles (4 s, max 60).   §5 hurt vignette + low-HP pulse and heartbeat.
   §7 source-tagged damage numbers (player / crit / pet / jelly / DoT / heal / words), lanes, jelly merging, 14 cap,
      multi-kill "SPLAT ×n".   §8 kill, signature, level-up beats; 2.2 s pet-evolution cinematic; loot beams.
   Design: Ooze earned from slime hits (+4 jelly/familiar, +10 Acid Glob, +8/s standing, no drain), Summon Jellies
   self-cast, XP curve 55+35(L-1)+6(L-1)², class-themed loot names, Gelguard kit tweaks, pet abilities
   (lv3 trick, lv5 bond, lv10/lv25 evolutions) for all three pet lines.
   Pet and summon hits never move the camera or stop time. Reduced motion (mv-calm / prefers-reduced-motion) scales it down. */
(()=>{
if(typeof CLASSES==='undefined'||typeof update!=='function'||typeof damage!=='function')return;
const T=()=>typeof time!=='undefined'?time:performance.now()/1000;
const calm=()=>document.documentElement.classList.contains('mv-calm')||(matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const phone=()=>innerWidth<700||!!(matchMedia&&matchMedia('(pointer:coarse)').matches);
const FEEL={get shakeMul(){return calm()?.25:1},get stopMul(){return calm()?.5:1},get particleMul(){return phone()?.5:1}};
const R=(a,b)=>a+Math.random()*(b-a);
const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const slime=()=>{try{return MoonSlime.hex(MoonSlime.current());}catch(e){return '#3fe0c8';}};
const petHex=()=>{try{return MoonSlime.hex(MoonPet.color());}catch(e){return slime();}};
const lighten=(hex,k=.2)=>{const n=parseInt(String(hex).slice(1,7),16);if(isNaN(n))return hex;const c=[n>>16,(n>>8)&255,n&255].map(v=>Math.round(v+(255-v)*k));return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');};
const live=()=>typeof started!=='undefined'&&started&&!(typeof isPaused==='function'&&isPaused());
const J={stats:{hitstops:0,maxTrauma:0,sfx:{},splats:0,evolves:0,tricks:{}}};

/* ------------------------------------------------------------------ §6 sound */
let comp=null,NB=null,PJ=1,GJ=1;
function bus(){
 if(typeof audio==='undefined'||!audio||typeof soundBus==='undefined'||!soundBus)return null;
 if(comp===null){try{comp=audio.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=4;comp.attack.value=.003;comp.release.value=.12;
  soundBus.disconnect();soundBus.connect(comp);comp.connect(audio.destination);}catch(e){comp=false;try{soundBus.connect(audio.destination);}catch(_){}}}
 return soundBus;}
function sweep(f0,f1,dur,vol,type='sine',off=0){const b=bus();if(!b)return;const t=audio.currentTime+off,o=audio.createOscillator(),v=audio.createGain();
 o.type=type;o.frequency.setValueAtTime(Math.max(20,f0*PJ),t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1*PJ),t+dur);
 v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(Math.max(.0002,vol*GJ),t+.008);v.gain.exponentialRampToValueAtTime(.0001,t+dur);
 o.connect(v);v.connect(b);o.start(t);o.stop(t+dur+.05);}
function pad(f,dur,vol,type='sine',off=0,att=.08){const b=bus();if(!b)return;const t=audio.currentTime+off,o=audio.createOscillator(),v=audio.createGain();
 o.type=type;o.frequency.setValueAtTime(f*PJ,t);v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(Math.max(.0002,vol*GJ),t+att);v.gain.exponentialRampToValueAtTime(.0001,t+dur);
 o.connect(v);v.connect(b);o.start(t);o.stop(t+dur+.05);}
function noiseHit(dur,f,q,vol,kind='bandpass',off=0,f1=0){const b=bus();if(!b)return;
 NB||=(()=>{const bf=audio.createBuffer(1,Math.floor(audio.sampleRate*.5),audio.sampleRate),d=bf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return bf;})();
 const t=audio.currentTime+off,s=audio.createBufferSource(),bq=audio.createBiquadFilter(),v=audio.createGain();
 s.buffer=NB;bq.type=kind;bq.frequency.setValueAtTime(f,t);if(f1)bq.frequency.exponentialRampToValueAtTime(f1,t+dur);bq.Q.value=q;
 v.gain.setValueAtTime(Math.max(.0002,vol*GJ),t);v.gain.exponentialRampToValueAtTime(.0001,t+dur);
 s.connect(bq);bq.connect(v);v.connect(b);s.start(t);s.stop(t+dur+.02);}
const SFX={
 squelch:()=>{noiseHit(.09,900,1.2,.06);sweep(220,90,.11,.05);},
 hit:()=>{sweep(480,240,.07,.04);noiseHit(.04,2200,2,.025);},
 jellyHit:()=>sweep(660,420,.05,.018,'triangle'),
 crit:()=>{SFX.squelch();sweep(880,870,.12,.05,'triangle');sweep(1320,1300,.12,.04,'triangle',.03);},
 kill:()=>{sweep(300,60,.22,.08);noiseHit(.16,600,.7,.05,'lowpass');sweep(1200,1100,.025,.03,'sine',.02);},
 multikill:()=>{SFX.kill();[523,659,784].forEach((f,i)=>sweep(f,f*1.01,.06,.05,'triangle',.08+i*.06));},
 hurt:()=>{sweep(180,110,.16,.07);noiseHit(.12,400,.7,.05,'lowpass');},
 heartbeat:()=>{sweep(60,50,.09,.05,'sine');sweep(60,48,.09,.04,'sine',.18);},
 summon:()=>{[0,.07,.14].forEach(o=>sweep(300,900,.08,.05,'sine',o));pad(1568,.3,.02,'triangle',.05,.04);},
 pounce:()=>{sweep(200,700,.15,.05);noiseHit(.08,900,1.2,.035,'bandpass',.16);sweep(220,90,.1,.03,'sine',.16);},
 slurp:()=>{sweep(900,300,.18,.04);noiseHit(.18,1500,1.5,.02,'bandpass',0,500);},
 lootRare:()=>{[784,988,1175].forEach((f,i)=>pad(f,.3+(i===2?.3:0),.05,'triangle',i*.08,.01));},
 lootEpic:()=>{SFX.lootRare();[0,.06,.12].forEach(o=>pad(1568,.12,.025,'sine',.3+o,.005));pad(196,.6,.05,'sine',0,.12);},
 signature:()=>{pad(55,.4,.09,'sine',0,.01);noiseHit(.35,2000,.8,.06,'lowpass',0,200);SFX.crit();},
 levelUp:()=>{[523,659,784,1046].forEach(f=>pad(f,1,.035,'sine',.8,.18));},
 evolve:()=>{sweep(200,800,1.2,.06);noiseHit(1.2,400,.7,.03,'highpass',0,4000);[1046,1318,1568,2092].forEach(f=>pad(f,1.1,.03,'sine',1.3,.12));sweep(300,60,.22,.06,'sine',1.3);},
 uiTap:()=>sweep(1046,1040,.03,.02),
 uiDeny:()=>sweep(220,180,.09,.025,'triangle'),
 xpTick:()=>sweep(1318,1310,.02,.012),
};
const lastK={};
const prevSfx=sfx;
sfx=function(k,opt){
 if(typeof soundOn!=='undefined'&&!soundOn)return;
 if(k==='loot'&&J.muteLoot)return;
 J.stats.sfx[k]=(J.stats.sfx[k]||0)+1;
 if(k==='level'){prevSfx('level');k='levelUp';}
 const f=SFX[k];if(!f)return prevSfx(k,opt);
 const now=performance.now(),cd=k==='jellyHit'?25:40;if(now-(lastK[k]||0)<cd)return;lastK[k]=now;
 PJ=(1+(Math.random()-.5)*.12)*(opt&&opt.pitch||1);GJ=Math.pow(10,(Math.random()*2-1)*1.5/20);
 try{f();}catch(e){}PJ=1;GJ=1;};
if(typeof initAudio==='function'){const b=initAudio;initAudio=function(){const r=b.apply(this,arguments);try{bus();}catch(e){}return r;};}

/* ------------------------------------------------------------------ §2 hit-stop */
const stop={t:0,max:0,last:-1e9};
if(typeof MoonFeel!=='undefined'){
 MoonFeel.hitstop=s=>{s=Math.min(.18,s*FEEL.stopMul);const n=performance.now();if(s<=stop.t)return;if(stop.t<=0&&n-stop.last<100)return;stop.t=stop.max=s;stop.last=n;J.stats.hitstops++;};
 MoonFeel.scale=dt=>{if(stop.t<=0)return dt;stop.t-=dt;const u=1-Math.max(0,stop.t)/stop.max;return dt*Math.max(.02,u<.7?0:(u-.7)/.3);};   // never exactly 0: motion code divides by dt
}
const hitstop=s=>{if(typeof MoonFeel!=='undefined')MoonFeel.hitstop(s);};

/* ------------------------------------------------------------------ §3 trauma */
let trauma=0;
function addTrauma(a){trauma=Math.min(1,trauma+a);J.stats.maxTrauma=Math.max(J.stats.maxTrauma,trauma);}

/* ------------------------------------------------------------------ §4 splats + puddles */
const drops=[],puddles=[];
function splat(x,y,hex,n,o={}){
 n=Math.round(n*FEEL.particleMul);const dir=o.dir==null?null:o.dir,spread=o.spread==null?Math.PI*2:o.spread,cols=Array.isArray(hex)?hex:[hex];
 for(let i=0;i<n&&drops.length<160;i++){const a=dir==null?Math.random()*Math.PI*2:dir+(Math.random()-.5)*spread,v=R(o.vMin||90,o.vMax||260),inv=o.inward;
  drops.push({x:inv?x+Math.cos(a)*40:x,y:inv?y+Math.sin(a)*22:y,z:o.z==null?24:o.z,vx:Math.cos(a)*v*(inv?-1:1),vy:Math.sin(a)*v*.55*(inv?-1:1),vz:inv?R(20,60):R(o.vzMin||120,o.vzMax||300),
   r:R(o.rMin||2,o.rMax||5.5),hex:cols[Math.floor(Math.random()*cols.length)],life:R(o.lMin||.45,o.lMax||.9),bounced:false,keep:!inv});}
 J.stats.splats++;}
function puddle(x,y,r,hex){puddles.push({x,y,r,hex,life:4,zone:typeof story!=='undefined'?story.zone:0});if(puddles.length>60)puddles.shift();}
function tickDrops(dt){
 for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.vz-=900*dt;d.z+=d.vz*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.vx*=.985;d.vy*=.985;d.life-=dt;
  if(d.z<=0){if(!d.bounced&&d.vz<-120){d.vz*=-.28;d.vx*=.5;d.vy*=.5;d.bounced=true;d.z=0;}else{if(d.keep&&Math.random()<.5)puddle(d.x,d.y,d.r*2.2,d.hex);drops.splice(i,1);continue;}}
  if(d.life<=0)drops.splice(i,1);}
 for(let i=puddles.length-1;i>=0;i--){puddles[i].life-=dt;if(puddles[i].life<=0)puddles.splice(i,1);}}
function drawPuddles(){try{drawTargeting();}catch(e){}if(!puddles.length||typeof g==='undefined')return;const z=typeof story!=='undefined'?story.zone:0;g.save();
 for(const q of puddles){if(q.zone!==z)continue;g.globalAlpha=.35*Math.min(1,q.life/1.5);g.fillStyle=q.hex;g.beginPath();g.ellipse(q.x,q.y,q.r,q.r*.45,0,0,7);g.fill();}g.restore();}
function drawDrops(){if(!drops.length)return;const glow=!phone();
 for(const d of drops){const sp=Math.hypot(d.vx,d.vy-d.vz),a=Math.atan2(d.vy-d.vz,d.vx),st=1+Math.min(.6,sp/600);g.globalAlpha=Math.min(1,d.life*3);
  g.save();g.translate(d.x,d.y-d.z);g.rotate(a);g.fillStyle=d.hex;g.beginPath();g.ellipse(0,0,d.r*st,d.r/Math.sqrt(st),0,0,7);g.fill();
  g.fillStyle='rgba(255,255,255,.75)';g.fillRect(-d.r*.3,-d.r*.5,1,1);g.restore();
  if(glow&&d.r>3.5){g.globalCompositeOperation='lighter';g.globalAlpha*=.25;g.fillStyle=d.hex;g.beginPath();g.arc(d.x,d.y-d.z,d.r*2,0,7);g.fill();g.globalCompositeOperation='source-over';}}
 g.globalAlpha=1;}

/* ------------------------------------------------------------------ overlays (vignettes, flashes, rings, beams, cinematic) */
const ov={hurt:0,hurtMax:.35,flash:0,flashMax:.12,flashCol:'#fff',dim:0,dimTo:0,rings:[],beams:[],cocoon:null,lv:null};
function ring(x,y,r,col,dur=.22,w=6){ov.rings.push({x,y,r,col,t:0,dur,w});}
function flash(col,alpha,ms){ov.flash=ms/1000;ov.flashMax=ms/1000;ov.flashCol=col;ov.flashA=alpha;}
function drawWorldFx(){ // world space
 for(const r of ov.rings){const u=Math.min(1,r.t/r.dur),e=1-Math.pow(1-u,3);g.save();g.globalAlpha=(1-u)*.9;g.strokeStyle=r.col;g.lineWidth=r.w*(1-u*.6);g.beginPath();g.ellipse(r.x,r.y,r.r*e,r.r*e*.5,0,0,7);g.stroke();g.restore();}
 for(const b of ov.beams){const it=b.g;if(!it||(typeof inventory!=='undefined'&&!inventory.ground.includes(it))){b.dead=true;continue;}const pulse=b.epic?.75+.25*Math.sin(T()*6):1;
  g.save();g.globalCompositeOperation='lighter';const gr=g.createLinearGradient(0,it.y-b.h,0,it.y);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,b.col);g.globalAlpha=b.a*pulse;g.fillStyle=gr;g.fillRect(it.x-7,it.y-b.h,14,b.h);
  if(b.motes)for(let i=0;i<8;i++){const a=T()*2+i*.785;g.fillStyle=b.col;g.globalAlpha=.6;g.beginPath();g.arc(it.x+Math.cos(a)*16,it.y-10-((T()*30+i*12)%b.h*.6),1.8,0,7);g.fill();}
  if(b.epic){g.globalAlpha=.4*pulse;g.strokeStyle=b.col;g.lineWidth=2;g.beginPath();g.ellipse(it.x,it.y,22,10,0,0,7);g.stroke();}g.restore();}
 const c=ov.cocoon;if(c){const u=Math.min(1,c.t/.9),pe=c.pet,W=c.W*(.6+.8*u),wob=Math.sin(c.t*18)*.06*(1-Math.max(0,c.t-.9));
  if(c.t<1){g.save();g.translate(pe.x,pe.y-W*.45);g.scale(1+wob,1-wob);const gr=g.createRadialGradient(-W*.15,-W*.15,2,0,0,W*.6);gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(.35,c.col);gr.addColorStop(1,'rgba(0,0,0,0)');
   g.globalAlpha=.85;g.fillStyle=gr;g.beginPath();g.arc(0,0,W*.6,0,7);g.fill();g.restore();}
  else{const k=Math.min(1,(c.t-1)/.6);g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.4*(1-k);g.fillStyle=c.col;g.beginPath();g.arc(pe.x,pe.y-30,c.W*(1+k),0,7);g.fill();g.restore();}}}
function drawScreenFx(){ // screen space
 const vw=typeof view!=='undefined'?view.w:innerWidth,vh=typeof view!=='undefined'?view.h:innerHeight;
 const low=live()&&p.hp<p.maxHp*.25?.18*(.6+.4*Math.sin(T()*Math.PI*2*1.1)):0,h=Math.max(low,ov.hurt>0?ov.hurtMax*ov.hurt/.3:0);
 if(h>0){const gr=g.createRadialGradient(vw/2,vh/2,Math.min(vw,vh)*.55*.5,vw/2,vh/2,Math.hypot(vw,vh)/2);gr.addColorStop(0,'rgba(255,40,40,0)');gr.addColorStop(1,'rgba(200,20,30,'+h.toFixed(3)+')');g.fillStyle=gr;g.fillRect(0,0,vw,vh);}
 if(ov.dim>0){g.fillStyle='rgba(4,6,14,'+(ov.dim).toFixed(3)+')';g.fillRect(0,0,vw,vh);}
 if(ov.flash>0){g.globalAlpha=(ov.flashA||.6)*(ov.flash/ov.flashMax);g.fillStyle=ov.flashCol;g.fillRect(0,0,vw,vh);g.globalAlpha=1;}}
function tickOverlays(dt){ov.hurt=Math.max(0,ov.hurt-dt);ov.flash=Math.max(0,ov.flash-dt);ov.dim+=(ov.dimTo-ov.dim)*Math.min(1,dt*6);
 for(let i=ov.rings.length-1;i>=0;i--){ov.rings[i].t+=dt;if(ov.rings[i].t>=ov.rings[i].dur)ov.rings.splice(i,1);}
 for(let i=ov.beams.length-1;i>=0;i--)if(ov.beams[i].dead)ov.beams.splice(i,1);
 if(ov.cocoon){ov.cocoon.t+=dt;if(ov.cocoon.t>1.7)ov.cocoon=null;}}
if(typeof mvWorldArt==='function'){const b=mvWorldArt;mvWorldArt=function(){const r=b.apply(this,arguments);try{drawPuddles();J.pd=true;}catch(e){}return r;};}
{const b=draw;draw=function(){b.apply(this,arguments);if(typeof g==='undefined'||typeof cinematic==='undefined')return;try{const dpr=cinematic.dpr||1;g.save();
 const sx=cinematic.shake?Math.sin(T()*65)*cinematic.shake:0,sy=cinematic.shake?Math.cos(T()*70)*cinematic.shake*.5:0;
 g.setTransform(dpr,0,0,dpr,(-camera.x+sx)*dpr,(-camera.y+sy)*dpr);if(!J.pd)drawPuddles();J.pd=false;drawDrops();drawWorldFx();g.setTransform(dpr,0,0,dpr,0,0);drawScreenFx();g.restore();}catch(e){try{g.restore();}catch(_){}}};}

/* ------------------------------------------------------------------ §7 damage numbers */
let CTX=null;const laneOf=new WeakMap();
const isNum=s=>/^(✦\s*)?[+−-]?\d+$/.test(String(s).trim());
function capNumbers(){if(typeof texts==='undefined')return;let n=0;for(const t of texts)if(isNum(t.s))n++;
 while(n>14){let i=texts.findIndex(t=>isNum(t.s)&&(t.src==='jelly'||t.src==='pet'));if(i<0)i=texts.findIndex(t=>isNum(t.s));if(i<0)break;texts.splice(i,1);n--;}}
const prevFloat=float;
float=function(x,y,s,color){
 prevFloat(x,y,s,color);if(typeof texts==='undefined')return;const t=texts[texts.length-1];if(!t||t.s!==s)return;
 const str=String(s);
 if(CTX&&!CTX.tagged&&/^(✦\s*)?\d+$/.test(str)){const c=CTX,m=c.m;c.tagged=t;c.crit=str.startsWith('✦');
  t.src=c.src==='pet'?'pet':c.src==='jelly'?'jelly':c.src==='dot'?'dot':'';
  if(t.src==='pet'){t.color=lighten(petHex(),.2);t.life=t.max=.75;}
  else if(t.src==='jelly'){t.color=slime();t.life=t.max=.6;
   const old=texts.find(o=>o!==t&&o.src==='jelly'&&o.m===m&&o.max-o.life<.25);
   if(old){old.s=String((+old.s||0)+(+str||0));old.merge=(old.merge||0)+1;old.mergeAt=old.max-old.life;texts.pop();return;}}
  else if(t.src==='dot'){t.life=t.max=.7;}
  else{t.life=t.max=c.crit?1.1:.9;if(c.crit)t.tilt=(Math.random()-.5)*.21;}
  t.m=m;const L=laneOf.get(m)||{i:-1,at:-9};L.i=T()-L.at>.4?0:(L.i+1)%4;L.at=T();laneOf.set(m,L);t.lane=L.i;capNumbers();return;}
 if(/^\+\d/.test(str)){t.src='heal';t.life=t.max=1;}
 else if(/^[−-]\d/.test(str)){t.life=t.max=.9;}
 capNumbers();};
function word(x,y,s,col){prevFloat(x,y,s,col);const t=texts[texts.length-1];if(t){t.src='word';t.life=t.max=.9;}}

/* ------------------------------------------------------------------ resource helpers */
const res=n=>{try{if(typeof classResource==='function')classResource(n);}catch(e){}};
const resVal=()=>typeof identityState!=='undefined'?identityState.value:0;

/* ------------------------------------------------------------------ skill tracking (release) + Gelguard kit Δ */
const cast={at:-9,id:0,kind:null,used:-1};
if(typeof releaseSpell==='function'){const b=releaseSpell;releaseSpell=function(i){
 const sk=CLASSES[p.cls]&&CLASSES[p.cls].skills[i],kind=sk&&sk[5],before=p.cd[i],tgt=(typeof target!=='undefined'&&target&&target.alive&&!target.ozDummy)?target:null;
 const coated=kind==='spin'?mobs.filter(m=>m.alive&&d2(m,p)<115&&m.expose>0).length:0;
 cast.at=T();cast.kind=kind;cast.id++;const r=b(i);if(kind==='summon')clearDummy();
 if(!(p.cd[i]>before)){cast.at=-9;return r;}
 try{
  if(p.cls==='warrior'){
   if(kind==='sunder')res(10);
   if(kind==='spin'){const hit=mobs.filter(m=>m.alive&&d2(m,p)<115);for(const m of hit){const dx=p.x-m.x,dy=p.y-m.y,l=Math.hypot(dx,dy)||1,k=Math.min(20,l-30);if(k>0&&m.type!=='boss'){m.x+=dx/l*k;m.y+=dy/l*k;}m.slow=Math.max(m.slow||0,2);if(coated)m.expose=Math.max(m.expose||0,3);}
    addTrauma(.3);for(let b2=0;b2<3;b2++)for(let k=0;k<14*FEEL.particleMul&&drops.length<160;k++){const a=k/14*Math.PI*2+b2*.4,v=220,r0=30+b2*25;drops.push({x:p.x+Math.cos(a)*r0,y:p.y+Math.sin(a)*r0*.5,z:20,vx:-Math.sin(a)*v,vy:Math.cos(a)*v*.55,vz:R(80,160),r:R(2,4.5),hex:slime(),life:R(.4,.6),bounced:false,keep:true});}}
   if(kind==='bash'&&tgt&&tgt.alive){const boss=tgt.type==='boss';tgt.stun=Math.min(tgt.stun||0,boss?.75:1.5);tgt.root=Math.max(tgt.root||0,boss?1.5:3);}
   if(kind==='guard')petTaunt(true);
  }
  if(p.cls==='druid'&&kind==='heal'){p.root=0;p.slow=0;}
  if(p.cls==='ranger'&&kind==='summon'){const col=slime();splat(p.x+(p.dir||1)*14,p.y-60,[col,'#ffffff'],22,{dir:-Math.PI/2,spread:1.4,vMin:140,vMax:240,z:60,vzMin:200,vzMax:340});}
  if(p.cls==='ranger'&&kind==='command'&&tgt)voidMaw(tgt);
 }catch(e){console.warn('juice release',e);}
 return r;};}

/* ------------------------------------------------------------------ Summon Jellies: self-cast (review M5) */
const DUMMY={ozDummy:true,alive:true,x:0,y:0,hp:1,maxHp:1,name:'',type:'none',level:1,color:'#fff',xp:0,gold:0};
let dummyOn=false;
const clearDummy=()=>{if(dummyOn&&typeof target!=='undefined'&&target===DUMMY)target=null;dummyOn=false;};
{const b=castSkill;castSkill=function(i){
 try{if(live()&&Number.isInteger(i)){const sk=CLASSES[p.cls].skills[i];
  if(sk&&(p.cd[i]>0||p.mana<sk[2]||(typeof skillUnlockLevels!=='undefined'&&p.level<skillUnlockLevels[i])))sfx('uiDeny');
  if(sk&&sk[5]==='summon'&&p.cd[i]<=0&&p.mana>=sk[2]){const tg=typeof target!=='undefined'?target:null,ok=tg&&tg.alive&&!tg.ozDummy&&d2(tg,p)<=sk[4];
   const near=!ok&&typeof nearest==='function'?nearest(sk[4]):null;
   if(!ok&&!near){DUMMY.x=p.x+(p.dir||1)*2;DUMMY.y=p.y;DUMMY.alive=true;target=DUMMY;dummyOn=true;}}}}catch(e){}
 const r=b.apply(this,arguments);
 if(dummyOn&&!(typeof cinematic!=='undefined'&&cinematic.pending))clearDummy();
 return r;};}

/* ------------------------------------------------------------------ smart cast: auto-target + approach (all classes)
   No valid target → the closest living foe within ACQ is selected (and stays selected). Out of the ability's range →
   the hero walks toward it and casts the moment it is in range (melee range for melee skills). Any joystick touch or
   movement key cancels the approach. Self / around-self abilities (shields, heals, Cyclone, Slip, Summon) cast at once. */
const SELF_KINDS=['nova','spin','blink','ward','guard','heal','summon'];
const ACQ=440;
let appr=null;
const validT=t=>t&&t.alive&&!t.ozDummy&&mobs.includes(t);
function closestFoe(r){let best=null,bd=r;for(const m of mobs){if(!m.alive)continue;const d=d2(m,p);if(d<bd){bd=d;best=m;}}return best;}
function moveKeys(){if(typeof keys==='undefined')return false;return !!(keys.w||keys.a||keys.s||keys.d||keys.arrowup||keys.arrowdown||keys.arrowleft||keys.arrowright);}
function stickHeld(){const J=globalThis.MoonInput&&MoonInput.joystick;return !!(J&&J.id!==null&&J.id!==undefined);}
function cancelApproach(why){if(!appr)return;appr=null;if(!stickHeld()){stickX=0;stickY=0;}if(why)J.stats.apprCancel=(J.stats.apprCancel||0)+1;}
{const b=castSkill;castSkill=function(i){
 try{
  if(!live()||!Number.isInteger(i))return b.apply(this,arguments);
  const sk=CLASSES[p.cls].skills[i];if(!sk)return b.apply(this,arguments);
  if(appr&&appr.i!==i)cancelApproach(false);
  if(SELF_KINDS.includes(sk[5]))return b.apply(this,arguments);
  const locked=typeof skillUnlockLevels!=='undefined'&&p.level<skillUnlockLevels[i];
  if(locked||p.cd[i]>0||p.mana<sk[2]||(typeof cinematic!=='undefined'&&cinematic.pending))return b.apply(this,arguments);
  let tg=validT(target)?target:null;
  if(!tg){tg=closestFoe(Math.max(ACQ,(sk[4]||100)+220));if(!tg)return b.apply(this,arguments);target=tg;}
  const range=sk[4]||100;
  if(d2(tg,p)<=range){appr=null;return b.apply(this,arguments);}
  appr={i,tg,range,t:0,best:d2(tg,p),stuck:0};J.stats.approaches=(J.stats.approaches||0)+1;
  return;
 }catch(e){console.warn('smart cast',e);}
 return b.apply(this,arguments);};}
function tickApproach(dt){
 if(!appr)return;const a=appr;a.t+=dt;
 if(!live()||stickHeld()||moveKeys()){cancelApproach(true);return;}
 if(!validT(a.tg)||a.t>6||(typeof target!=='undefined'&&target!==a.tg)){cancelApproach(true);return;}
 const d=d2(a.tg,p);
 if(d<=a.range-4){stickX=0;stickY=0;appr=null;J.stats.apprCast=(J.stats.apprCast||0)+1;castSkill(a.i);return;}
 if(d<a.best-2){a.best=d;a.stuck=0;}else{a.stuck+=dt;if(a.stuck>1.2){cancelApproach(true);if(typeof say==='function')say('Can’t reach that target');return;}}
 const dx=a.tg.x-p.x,dy=a.tg.y-p.y,l=Math.hypot(dx,dy)||1;stickX=dx/l;stickY=dy/l;}
function drawTargeting(){
 if(typeof g==='undefined')return;const t=T(),hex=slime();
 const tg=typeof target!=='undefined'&&validT(target)?target:null;
 if(appr&&validT(appr.tg)){g.save();g.globalAlpha=.16+.05*Math.sin(t*5);g.strokeStyle=hex;g.lineWidth=2;g.setLineDash([10,8]);g.lineDashOffset=-t*30;
  g.beginPath();g.ellipse(p.x,p.y,appr.range,appr.range*.5,0,0,7);g.stroke();g.setLineDash([]);g.globalAlpha=.08;g.fillStyle=hex;g.fill();g.restore();}
 if(tg){const w=Math.max(26,(tg.r||tg.size||22)*1.25)*(1+.05*Math.sin(t*6));g.save();g.translate(tg.x,tg.y+4);
  g.globalAlpha=.9;g.lineWidth=3;g.strokeStyle='rgba(10,6,4,.6)';g.beginPath();g.ellipse(0,0,w+1,w*.45+1,0,0,7);g.stroke();
  g.strokeStyle='#ffd257';g.lineWidth=2.4;g.beginPath();g.ellipse(0,0,w,w*.45,0,0,7);g.stroke();
  g.fillStyle='#ffd257';for(let k=0;k<4;k++){const an=t*1.6+k*Math.PI/2,x=Math.cos(an)*(w+5),y=Math.sin(an)*(w+5)*.45;g.beginPath();g.moveTo(x,y);g.lineTo(x*.86,y*.86-3);g.lineTo(x*.86,y*.86+3);g.fill();}
  g.globalAlpha=.14;g.fillStyle='#ffd257';g.beginPath();g.ellipse(0,0,w,w*.45,0,0,7);g.fill();g.restore();}}

/* ------------------------------------------------------------------ damage hook: feel + Ooze + pet/jelly modifiers */
const kills=[];
const prevDamage=damage;
damage=function(m,amount,color){
 if(!m||!m.alive||m.ozDummy)return m&&m.ozDummy?undefined:prevDamage(m,amount,color);
 const srcTag=globalThis.OZ_SRC,dot=!srcTag&&(color==='#9fe398'||color==='#c1b3ff'),src=srcTag||(dot?'dot':'');
 // modifiers (classes.md): Lead the Swarm + Brood Bond for jellies, Rooted in Rot for Sporecaller DoTs, pet passive tiers
 try{
  if(src==='jelly'&&p.cls==='ranger'){const K=globalThis.MoonKits,n=K?K.jellies.length:0,petOn=globalThis.MoonPet&&MoonPet.active();let mul=1+.06*Math.min(4,Math.max(0,n-1)+(petOn?1:0));
   const j=globalThis.OZ_J,pe=MoonPet&&MoonPet.state;if(p.level>=3&&petOn&&j&&pe&&d2(j,pe)<80){mul*=1.15;}amount*=mul;}
  if(dot&&p.cls==='druid'&&m.root>0)amount*=1.25;
  if(src==='pet')amount*=1+(p.level>=15?.1:0)+(p.level>=20?.1:0);
 }catch(e){}
 const hp0=m.hp,wasMarked=m.mark>0;CTX={src,m,tagged:null,crit:false};J.muteLoot=true;let r;
 try{r=prevDamage(m,amount,color);}finally{J.muteLoot=false;const c=CTX;CTX=null;try{afterHit(c,m,hp0,wasMarked);}catch(e){console.warn('juice hit',e);}}
 return r;};
function afterHit(c,m,hp0,wasMarked){
 const killed=!m.alive,crit=c.crit,src=c.src,hex=slime(),dir=Math.atan2(m.y-p.y,m.x-p.x),boss=m.type==='boss',player=!src||src==='player';
 if(hp0-m.hp<=0&&!killed)return;
 if(src==='pet'){splat(m.x,m.y-14,petHex(),5,{vMin:60,vMax:140,z:14,lMin:.4,lMax:.6});if(p.cls==='ranger')res(4);}
 else if(src==='jelly'){splat(m.x,m.y-12,hex,3,{vMin:60,vMax:120,z:10,lMin:.35,lMax:.5});if(p.cls==='ranger')res(4);}
 else if(src==='dot'){/* quiet: no stop, no shake */}
 else{
  const skill=T()-cast.at<1.2&&cast.kind,first=skill&&cast.used!==cast.id,melee=p.cls==='warrior'&&d2(p,m)<160,aoe=['spin','trap','rain','nova'].includes(cast.kind);
  if(skill&&first)cast.used=cast.id;
  if(p.cls==='ranger')res(skill&&cast.kind==='poison'?10:skill?0:4);
  if(crit){hitstop(.07);addTrauma(.25);splat(m.x,m.y-18,['#ffd257',hex,'#ffffff'],18,{vMin:160,vMax:320,z:28,lMax:1});sfx('crit');ring(m.x,m.y-18,60,'#ffffff',.12,10);}
  else if(skill){if(first){hitstop(aoe?.06:.055);addTrauma(aoe?.08:.15);}splat(m.x,m.y-16,[hex,m.color||hex],12,{vMin:120,vMax:260,z:26,lMin:.5});sfx(melee?'squelch':'hit');}
  else if(melee){hitstop(.035);addTrauma(.08);splat(m.x,m.y-16,[hex,hex,'#f4fffd'],8,{dir,spread:1.75,vMin:90,vMax:200,lMax:.8});sfx('squelch');}
  else{splat(m.x,m.y-16,hex,5,{vMin:80,vMax:180,z:20});sfx('hit');}
  if(!boss&&m.alive){const k=crit?12:6;m.x+=Math.cos(dir)*k*.5;m.y+=Math.sin(dir)*k*.25;}
 }
 if(killed){
  const now=T();kills.push({t:now,x:m.x,y:m.y});while(kills.length&&now-kills[0].t>.25)kills.shift();
  const col=m.color||hex,jelly=/jell|slime|ooze|gloop/i.test(m.name||'');
  if(boss){for(let i=0;i<3;i++)setTimeout(()=>splat(m.x,m.y-20,['#3fe0c8','#b483ff','#ffd257','#ff8a3d','#c8d7e0'],27,{vMin:180,vMax:420,z:40,lMin:.8,lMax:1.4}),i*120);hitstop(.18);addTrauma(.6);}
  else{splat(m.x,m.y-16,jelly?['#b483ff',col]:[col,col,col,hex,hex],jelly?34:26,{vMin:140,vMax:300,z:20,lMin:.6,lMax:1});puddle(m.x,m.y+4,26,col);
   if(player||src==='dot'){hitstop(kills.length>=3?.12:.09);addTrauma(.22);}}
  sfx(kills.length>=3?'multikill':'kill');
  if(kills.length>=3){const cx=kills.reduce((a,k)=>a+k.x,0)/kills.length,cy=kills.reduce((a,k)=>a+k.y,0)/kills.length,n=kills.length;word(cx,cy-60,n>=5?'GLOOPTASTIC ×'+n:n===4?'MEGA SPLAT ×4':'SPLAT ×3','#ffd257');}
  if(wasMarked&&p.cls==='ranger')budJelly(m.x,m.y,'burst');
 }}

/* ------------------------------------------------------------------ hurt: vignette, trauma, heartbeat; Bodyblock, Golem Ward, Living Armor */
const prevHurt=hurt;
hurt=function(n){
 let note=null;
 try{if(live()&&!(p.evade>0)&&!(typeof CAMP!=='undefined'&&d2(p,CAMP)<125)){
  if(p.cls==='warrior'&&resVal()>=60)n=Math.max(1,n-2);                    // Living Armor Δ: +2 armor at 60+ Gel
  const pe=petOn()&&MoonPet.state;
  if(pe&&p.cls==='warrior'&&p.level>=25&&d2(pe,p)<60)n*=.9;                 // Gel Golem passive ward
  if(pe&&p.cls==='warrior'&&p.level>=3&&n>=p.maxHp*.08&&cdReady('block',8)&&d2(pe,p)<190){n*=.5;note='block';}}}catch(e){}
 const hp0=p.hp,x0=p.x,y0=p.y;prevHurt(n);
 try{const lost=hp0-p.hp;if(note==='block'){const pe=MoonPet.state;word(pe.x,pe.y-50,'BLOCK!',petHex());pe.lunge=.28;pe.say='!';pe.sayT=1;sfx('pounce');trick('block');}
  if(lost>0&&p.x===x0&&p.y===y0){sfx('hurt');const big=lost>=p.maxHp*.2;ov.hurt=.3;ov.hurtMax=big?.55:.35;if(lost>=p.maxHp*.1)addTrauma(.18);if(big)hitstop(.06);
   if(p.cls==='warrior'&&p.hp<p.maxHp*.5)petTaunt(false);if(p.cls==='druid'&&p.hp<p.maxHp*.4)glowcapSnack();}}catch(e){}};

/* ------------------------------------------------------------------ signature: Ooze Quake & co */
{const b=useSignature;useSignature=function(){
 const cd0=typeof identityState!=='undefined'?identityState.cooldown:0,cls=p.cls;const r=b.apply(this,arguments);
 try{if(typeof identityState!=='undefined'&&identityState.cooldown>cd0){
  const hex=slime();ov.dimTo=.25;setTimeout(()=>{ov.dimTo=0;},120);sfx('signature');hitstop(.09);
  if(cls==='warrior'){addTrauma(.55);ring(p.x,p.y,145,hex,.22,6);splat(p.x,p.y-10,[hex,hex,'#ffd257'],40,{vMin:200,vMax:380,z:10,lMin:.6,lMax:1});
   for(let i=0;i<12;i++){const a=i/12*Math.PI*2;puddle(p.x+Math.cos(a)*145,p.y+Math.sin(a)*72,14,hex);}
   if(identityState.visuals)for(const v of identityState.visuals)if(v.kind==='slam')v.color=hex;}
  else if(cls==='ranger'){addTrauma(.35);}
  else if(cls==='druid'){addTrauma(.15);twinGrove();}}}catch(e){}
 return r;};}

/* ------------------------------------------------------------------ XP curve (review P1) + level-up beat */
const curve=L=>Math.round(180+(L-1)*50+(L-1)**2*12);   // balance pass (Oct 19): was 55+35(L-1)+6(L-1)²
{const b=gainXp;gainXp=function(n){
 const lv0=p.level;if(p.nextXp!==curve(p.level))p.nextXp=curve(p.level);
 const r=b.apply(this,arguments);if(p.nextXp!==curve(p.level))p.nextXp=curve(p.level);
 try{if(p.level>lv0)levelBeat(lv0,p.level);}catch(e){}
 return r;};}
function levelBeat(from,to){
 const hex=slime();flash('#ffffff',.25,120);ring(p.x,p.y,160,'#ffd257',.5,5);
 for(let i=0;i<30*FEEL.particleMul&&drops.length<160;i++)drops.push({x:p.x+R(-18,18),y:p.y+R(-4,6),z:R(0,10),vx:R(-20,20),vy:0,vz:R(260,460),r:R(2,4),hex:i%3?hex:'#ffffff',life:R(.8,1.2),bounced:true,keep:false});
 for(const m of mobs)if(m.alive&&m.type!=='boss'&&d2(m,p)<200){const dx=m.x-p.x,dy=m.y-p.y,l=Math.hypot(dx,dy)||1;m.x+=dx/l*30;m.y+=dy/l*15;}
 for(let L=from+1;L<=to;L++){if(L===3)milestone('trick');if(L===5)milestone('bond');if(L===15||L===20)milestone('tier');}}

/* ------------------------------------------------------------------ loot names (review L3) */
const GEAR={
 warrior:{weapon:['Jelly Blade','Gel Cleaver','Ooze Longsword'],helm:['Iron Gelhelm','Slimeguard Visor','Riveted Jelly Helm'],chest:['Gel-Plate Cuirass','Oozeguard Mail','Riveted Jellyplate'],gloves:['Gooseal Gauntlets','Iron Gel Grips','Plated Ooze Fists'],boots:['Slimetread Greaves','Iron Puddle Boots','Gel-Sole Sabatons'],ring:['Gel Signet','Ooze Band','Jelly Loop']},
 druid:{weapon:['Glowcap Staff','Mossknot Rod','Sporewood Crook'],helm:['Spore Cap','Glowcap Hood','Mycelium Circlet'],chest:['Mossweave Robe','Sporecloth Vest','Lichen Mantle'],gloves:['Mycelium Wraps','Moss Mitts','Spore-Dusted Gloves'],boots:['Rootsoft Boots','Mosstep Treads','Capfoot Slippers'],ring:['Spore Ring','Glowcap Band','Mycelium Loop']},
 mage:{weapon:['Brass Bubble-Blaster','Pearlglass Repeater','Brewbarrel Carbine'],helm:['Brass Goggles','Pearl-Glass Circlet','Bubblesmith Visor'],chest:['Pearl-Glass Coat','Gilded Brewer\'s Vest','Bubble-Cape Mantle'],gloves:['Brass Trigger Gloves','Pearl Grips','Brewer\'s Gauntlets'],boots:['Brass-Buckled Boots','Bubblestep Treads','Gilded Puddle Boots'],ring:['Pearl Band','Bubble Loop','Prism Signet']},
 ranger:{weapon:['Orb-Knot Staff','Jelly Orb Rod','Gloop Scepter'],helm:['Seeping Hood','Gelglass Cowl','Drip Hood'],chest:['Dripping Robe','Oozeseer Coat','Gel-Lined Mantle'],gloves:['Gel-Lined Gauntlets','Orbkeeper Gloves','Slick Wraps'],boots:['Puddle Boots','Slipstep Treads','Gloop Waders'],ring:['Orb Ring','Jelly Signet','Brood Band']}};
const RP=['Murky','Glossy','Glowing','Radiant'];
if(typeof makeGear==='function'){const b=makeGear;makeGear=function(){const it=b.apply(this,arguments);try{const L=GEAR[p.cls]&&GEAR[p.cls][it.slot];
 if(L){const base=L[Math.floor(Math.random()*L.length)];const set=it.set&&typeof attireById==='function'&&attireById(it.set);it.name=(set?set.name+' ':(it.rarity===0?'Worn ':RP[it.rarity]?RP[it.rarity]+' ':''))+base;}}catch(e){}return it;};}
function renameOld(){try{if(typeof inventory==='undefined')return;const all=[...(inventory.bag||[]),...Object.values(inventory.equipped||{}),...(inventory.ground||[]).map(g=>g.item)].filter(Boolean);
 for(const it of all)if(/\b(Longbow|Runeblade|Moonstaff|Field Bow|Recruit’s Blade)\b/.test(it.name||'')){const L=GEAR[p.cls]&&GEAR[p.cls][it.slot];if(L)it.name=it.name.replace(/\b(Longbow|Runeblade|Moonstaff|Field Bow|Recruit’s Blade)\b/,L[0]);}}catch(e){}}

/* ------------------------------------------------------------------ loot beams + pet slurp */
function lootSeen(gd){if(!gd||!gd.item||ov.beams.some(b=>b.g===gd))return;const rr=gd.item.rarity||0;if(rr<1)return;
 const col=['#b9c8cc','#82d59b','#80bcff','#d3a0ff'][rr]||'#fff';ov.beams.push({g:gd,col,h:[0,60,110,160][rr]||60,a:rr===1?.35:.45,motes:rr>=2,epic:rr>=3});
 if(rr===1)sfx('hit',{pitch:1.5});if(rr===2)sfx('lootRare');if(rr>=3){sfx('lootEpic');hitstop(.06);}}
function slurp(pe,col){splat(pe.x,pe.y-16,col,10,{inward:true,vMin:120,vMax:160,lMin:.3,lMax:.35});pe.lunge=.3;}
let seenGround=0;
function scanGround(){try{if(typeof inventory==='undefined'||!inventory.ground)return;if(inventory.ground.length===seenGround)return;seenGround=inventory.ground.length;
 for(const gd of inventory.ground)if(gd.zone===story.zone&&d2(gd,p)<500)lootSeen(gd);}catch(e){}}

/* ------------------------------------------------------------------ pets: tricks (lv3), bond (lv5), evolutions (lv10/25) */
const petOn=()=>!!(globalThis.MoonPet&&MoonPet.active&&MoonPet.active()&&MoonPet.state&&MoonPet.state.seen);
const PD=()=>{const st=MoonPet.state.stage;return 3+1.5*p.level+(st==='grown'?4:st==='evolved'?10:0);};
const cds={};const cdMul=()=>1-(p.level>=15?.1:0)-(p.level>=20?.1:0);
function cdReady(k,s){const t=T();if((cds[k]||-1e9)+s*cdMul()>t)return false;cds[k]=t;return true;}
function trick(k){J.stats.tricks[k]=(J.stats.tricks[k]||0)+1;}
const TRICKS={
 warrior:{3:['Bodyblock','The next big hit aimed at you is intercepted and halved (8 s cooldown).'],10:['Jelly Taunt','Your attacker is glued to the blob for 3 s. Fires when you cast Gel Bulwark or drop below 50% health.'],25:['Golem Slam','Leaps and slams a pack (2× pet damage, 1 s stun). You take 10% less damage beside it.']},
 druid:{3:['Spore Puff','Puffs spores at your target: a hit plus a 4-second rot.'],10:['Glowcap Snack','Below 40% health it pops a glowcap: +12% health and 1 Spore (30 s).'],25:['Twin Grove','Your Glowcap Grove grows a second grove where it stands; its puffs root.']},
 ranger:{3:['Lead the Swarm','Jellylings near it deal +15% damage.'],10:['Bud','Every 15 s in a fight it buds a free jellyling (6 s).'],25:['Void Maw','Gloop Command opens a maw at the target: pulls foes in, then crunches them.']}};
function card(title,sub,col,ms=2600){let el=document.getElementById('ozCard');if(!el){el=document.createElement('div');el.id='ozCard';el.setAttribute('aria-live','polite');
  el.style.cssText='position:fixed;left:50%;top:22%;transform:translate(-50%,-50%) scale(.9);z-index:60;pointer-events:none;text-align:center;opacity:0;transition:opacity .25s,transform .35s cubic-bezier(.2,1.6,.4,1);max-width:min(92vw,520px);padding:12px 18px;border-radius:16px;background:rgba(8,12,22,.78);box-shadow:0 0 0 2px rgba(255,210,87,.35),0 10px 40px rgba(0,0,0,.5)';
  el.innerHTML='<b style="display:block;font:700 26px Cinzel,Georgia,serif;color:#ffd257;text-shadow:0 2px 0 #000"></b><small style="display:block;margin-top:6px;font:600 14px \'MV Fira\',system-ui,sans-serif;color:#e8f4ff"></small>';document.body.appendChild(el);}
 const [b,s]=el.children;b.innerHTML=title;s.textContent=sub;el.style.opacity='1';el.style.transform='translate(-50%,-50%) scale(1)';clearTimeout(el._t);el._t=setTimeout(()=>{el.style.opacity='0';el.style.transform='translate(-50%,-50%) scale(.9)';},ms);
 if(col)b.querySelector('i')&&(b.querySelector('i').style.color=col);}
function milestone(kind){if(!globalThis.MoonPet||!MoonPet.active())return;const nm=MoonPet.name(),T3=TRICKS[p.cls];if(!T3)return;
 if(kind==='trick'){const [a,d]=T3[3];card(nm+' learned <i style="font-style:normal;color:'+petHex()+'">'+a+'</i>!','New: '+a+' — '+d,petHex());sfx('lootRare');}
 if(kind==='bond'){card(nm+' bonded with you','Stash +4 · Fetch: it now vacuums gold within 220 steps',petHex());sfx('lootRare');}
 if(kind==='tier'){card(nm+' grows stronger','+10% pet damage · tricks recharge 10% faster',petHex(),2000);}}
function evolve(pe,stage,name,stageName){
 J.stats.evolves++;const col=petHex(),W={grown:58,evolved:92}[stage]||58,ab=TRICKS[p.cls]&&TRICKS[p.cls][stage==='evolved'?25:10];
 hitstop(.18);sfx('evolve');ov.dimTo=calm()?.3:.55;
 for(const m of mobs)if(m.alive&&d2(m,p)<600){m.stun=Math.max(m.stun||0,2.2);m.cast=null;}
 if(!calm())ov.cocoon={pet:pe,t:0,W,col};
 setTimeout(()=>{flash('#ffffff',.9,140);addTrauma(.4);splat(pe.x,pe.y-20,[col,col,'#ffffff'],40,{vMin:160,vMax:360,z:40});ring(pe.x,pe.y,90,col,.4,6);},900);
 setTimeout(()=>{card(name+' evolved into <i style="font-style:normal;color:'+col+'">'+stageName+'</i>!',ab?'New: '+ab[0]+' — '+ab[1]:'',col,2200);if(typeof say==='function')say(name+' evolved into a '+stageName+'!');},1100);
 setTimeout(()=>{pe.say='✦';pe.sayT=1.2;pe.lunge=.3;},1500);
 setTimeout(()=>{ov.dimTo=0;},2200);}
function petTaunt(force){if(!petOn()||p.cls!=='warrior'||p.level<10||!cdReady('taunt',12))return;const pe=MoonPet.state;
 const foe=mobs.filter(m=>m.alive&&m.aggro&&d2(m,p)<160).sort((a,b)=>d2(a,p)-d2(b,p))[0];if(!foe){cds.taunt=-1e9;return;}
 foe.stun=Math.max(foe.stun||0,foe.type==='boss'?1.5:3);foe.cast=null;word(pe.x,pe.y-52,'TAUNT!',petHex());res(20);sfx('pounce');trick('taunt');}
function glowcapSnack(){if(!petOn()||p.level<10||!cdReady('snack',30))return;const pe=MoonPet.state,h=Math.round(p.maxHp*.12);p.hp=Math.min(p.maxHp,p.hp+h);res(1);float(p.x,p.y-60,'+'+h,'#9cebbb');pe.say='…!';pe.sayT=1.4;
 splat(pe.x,pe.y-20,['#c79bff','#9cebbb'],10,{vMin:60,vMax:140});sfx('lootRare');trick('snack');}
const groves=[];
function twinGrove(){if(!petOn()||p.cls!=='druid'||p.level<25)return;const pe=MoonPet.state;groves.push({x:pe.x,y:pe.y,left:8,tick:1});ring(pe.x,pe.y,60,petHex(),.4,5);trick('twin');}
const rots=[];
function budJelly(x,y,why){const K=globalThis.MoonKits;if(!K||!K.spawnJellies)return;K.spawnJellies(1,(typeof target!=='undefined'&&target&&target.alive&&!target.ozDummy)?target:null);const j=K.jellies[K.jellies.length-1];
 if(j){j.x=x;j.y=y;j.life=j.max=6;}splat(x,y-16,slime(),10,{vMin:80,vMax:160,z:12});trick(why);}
function voidMaw(tgt){if(!petOn()||p.level<25||!tgt||!tgt.alive)return;const pe=MoonPet.state,pd=PD(),ms=mobs.filter(m=>m.alive&&d2(m,tgt)<120);
 ring(tgt.x,tgt.y,120,'#7a3dff',.6,8);for(const m of ms)if(m!==tgt&&m.type!=='boss'){m.pull={x:tgt.x,y:tgt.y,t:.6};}
 setTimeout(()=>{for(const m of mobs)if(m.alive&&d2(m,tgt)<120)MoonPet.hit(m,Math.round(pd*2.5),petHex(),'pet');addTrauma(.4);hitstop(.08);splat(tgt.x,tgt.y-20,['#7a3dff',petHex()],24,{vMin:140,vMax:300});sfx('kill');},600);trick('maw');}
function tickPets(dt){
 for(const m of mobs)if(m.pull&&m.alive){m.pull.t-=dt;const k=Math.min(1,dt*4);m.x+=(m.pull.x-m.x)*k;m.y+=(m.pull.y-m.y)*k;if(m.pull.t<=0)m.pull=null;}
 for(let i=groves.length-1;i>=0;i--){const q=groves[i];q.left-=dt;q.tick-=dt;if(q.tick<=0){q.tick+=1;if(d2(p,q)<60)p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.02);for(const m of mobs)if(m.alive&&d2(m,q)<60){MoonPet.hit(m,Math.round(p.power*.225),'#c79bff','pet');m.slow=Math.max(m.slow||0,2);}ring(q.x,q.y,60,'#9cebbb',.5,3);}if(q.left<=0)groves.splice(i,1);}
 for(let i=rots.length-1;i>=0;i--){const q=rots[i];q.left-=dt;q.tick-=dt;if(q.tick<=0&&q.m.alive){q.tick+=1;MoonPet.hit(q.m,Math.max(1,Math.round(q.dmg)),'#c79bff','dot');}if(q.left<=0||!q.m.alive)rots.splice(i,1);}
 if(!petOn())return;const pe=MoonPet.state,tgt=(typeof target!=='undefined'&&target&&target.alive&&!target.ozDummy)?target:null,fight=tgt&&p.inCombat>0&&d2(tgt,p)<300;
 // lv5 bond: Fetch gold within 220
 if(p.level>=5&&typeof drops!=='undefined')for(const d of drops)if(d.kind==='gold'&&d2(d,p)<220&&d2(d,p)>8){const dx=p.x-d.x,dy=p.y-d.y,l=Math.hypot(dx,dy);const v=Math.min(l,320*dt);d.x+=dx/l*v;d.y+=dy/l*v;}
 if(p.level<3)return;
 if(p.cls==='druid'&&fight&&d2(pe,tgt)<260&&cdReady('puff',6)){const pd=PD();MoonPet.hit(tgt,Math.round(pd*.6),petHex(),'pet');rots.push({m:tgt,left:4,tick:1,dmg:pd*.3});
  splat(tgt.x,tgt.y-18,['#c79bff','#9cebbb'],8,{vMin:60,vMax:140});word(pe.x,pe.y-46,'Puff!',petHex());if(p.level>=25&&cdReady('root'+(tgt.id||''),8))tgt.root=Math.max(tgt.root||0,1);trick('puff');}
 if(p.cls==='ranger'&&p.level>=10&&fight&&cdReady('bud',15))budJelly(pe.x,pe.y,'bud');
 if(p.cls==='warrior'&&p.level>=25&&fight&&pe.mode==='fight'&&d2(pe,tgt)<70&&cdReady('slam',10)){const pd=PD();for(const m of mobs)if(m.alive&&d2(m,tgt)<90){MoonPet.hit(m,Math.round(pd*2),petHex(),'pet');if(m.alive)m.stun=Math.max(m.stun||0,1);}
  ring(tgt.x,tgt.y,90,petHex(),.3,6);splat(tgt.x,tgt.y-10,petHex(),18,{vMin:120,vMax:260});addTrauma(.35);sfx('squelch');trick('slam');}}

/* ------------------------------------------------------------------ Ooze rework (review M9) + per-frame hook */
let restT=0,prevPos=null,hbT=0,petLv=0;
const b0=update;update=function(dt){
 const v0=resVal(),pos={x:p.x,y:p.y},isR=p.cls==='ranger';
 try{tickApproach(dt);}catch(e){console.warn('approach',e);}
 b0(dt);
 try{
  if(isR&&p.cls==='ranger'&&typeof identityState!=='undefined'){ // undo the old stand-still/move rule; slime hits add their Ooze through classResource() as they land
   const moved=d2(pos,p)>.1,old=moved?-20*dt:25*dt;const lo=0,hi=classIdentity.ranger.max;
   const expectedOld=Math.min(hi,Math.max(lo,v0+old));let gained=identityState.value-expectedOld;if(Math.abs(gained)<1e-6)gained=0;
   identityState.value=Math.min(hi,Math.max(lo,v0+Math.max(0,gained)));}
  if(dummyOn&&!(typeof cinematic!=='undefined'&&cinematic.pending))clearDummy();
  if(dummyOn){DUMMY.x=p.x;DUMMY.y=p.y;}
  tickDrops(dt);tickOverlays(dt);
  trauma=Math.max(0,trauma-1.6*dt);if(typeof cinematic!=='undefined')cinematic.shake=trauma*trauma*10*FEEL.shakeMul;
  if(live()){
   if(p.nextXp!==curve(p.level))p.nextXp=curve(p.level);
   if(p.hp<p.maxHp*.25&&p.hp>0){hbT-=dt;if(hbT<=0){hbT=.9;sfx('heartbeat');}}else hbT=0;
   tickPets(dt);scanGround();
   if(!petLv){petLv=p.level;renameOld();}
  }
 }catch(e){console.warn('juice update',e);}};

globalThis.MoonJuice={get approach(){return appr?{i:appr.i,range:appr.range,t:+appr.t.toFixed(2)}:null;},cancelApproach,FEEL,sfx:SFX,sweep,noiseHit,splat,puddle,addTrauma,hitstop,evolve,milestone,lootSeen,slurp,word,curve,card,
 get trauma(){return trauma;},get drops(){return drops.length;},get puddles(){return puddles.length;},stats:J.stats,
 debug:()=>({trauma:+trauma.toFixed(3),shake:typeof cinematic!=='undefined'?+(+cinematic.shake).toFixed(3):0,stop:+stop.t.toFixed(3),drops:drops.length,puddles:puddles.length,comp:!!comp,...J.stats})};
})();
