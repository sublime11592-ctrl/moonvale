'use strict';
/* Prismancer gun rhythm (design/prismancer-gun.md): 6-round Bubble Mag + pump, optional Perfect Pump, Overpressure,
   tap/charge tiers on offensive shots, instant defensive shots, casings, pump gauge, muzzle drips and synth SFX.
   Runtime wrappers only: art, anim sheets and oozevale-prism.js data are untouched. */
(()=>{
if(typeof p==='undefined'||typeof projectile!=='function')return;
const on=()=>p.cls==='mage';
const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const touch=matchMedia('(pointer:coarse)').matches||'ontouchstart' in window;
const G={mag:6,pump:0,pumpT:0,pumpDur:.6,tapped:false,over:false,overT:0,pend:null,charge:null,boostT:0,boost:1,casings:[],gauge:{pulse:0,shake:0},drip:0,
 stats:{rounds:0,pumps:0,perfect:0,jam:0,charged:[0,0,0]}};
const PERFECT=touch?[.26,.46]:[.30,.42];
/* ---------- synth ---------- */
let AC=null;const ac=()=>{if(typeof soundOn!=='undefined'&&!soundOn)return null;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();}catch(e){return null;}return AC;};
function tone(f0,f1,dur,vol,type,delay){const a=ac();if(!a)return;const t=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.02);}
function noise(dur,freq,vol,delay,q){const a=ac();if(!a)return;const t=a.currentTime+(delay||0),n=Math.floor(a.sampleRate*dur),b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q||1.2;const g=a.createGain();g.gain.value=vol;s.connect(f).connect(g).connect(a.destination);s.start(t);}
const SND={
 round:()=>{tone(520,260,.07,.035,'triangle');noise(.04,1800,.04);},
 pump:()=>{noise(.03,1200,.06);tone(400,380,.05,.03,'sine',.06);},
 perfect:()=>{tone(1568,1568,.18,.04,'sine');tone(2093,2093,.14,.02,'sine',.05);},
 jam:()=>{tone(180,140,.12,.05,'triangle');},
 hop:k=>{const f=880*Math.pow(2,2*k/12);tone(f,f*1.5,.06,.03,'sine');},
 inflate:()=>{tone(330,300,.05,.03,'triangle');tone(180,620,.26,.025,'sine',.08);},
 uncork:()=>noise(.025,2000,.07),
 choke:()=>{for(let i=0;i<5;i++)noise(.012,3000,.05,i*.03,4);},
 ting:()=>{tone(1760,1760,.04,.025,'sine');tone(880,880,.08,.025,'sine',.04);},
 crack:()=>{for(let i=0;i<4;i++)tone(2600+i*300,2400,.05,.015,'sine',i*.03);},
 thumpUp:()=>tone(140,90,.12,.06,'sine'),
 burst:()=>{noise(.2,2500,.05);tone(2093,2093,.3,.02,'sine');},
 triple:k=>{SND.pump();tone([523,659,784][k],[523,659,784][k],.12,.04,'triangle',.06);},
 charge:k=>tone(300+k*200,340+k*220,.08,.025,'sine'),
};
/* ---------- muzzle helpers ---------- */
const muzzle=()=>{try{const m=globalThis.PrismBlaster&&PrismBlaster.muzzle();if(m)return m;}catch(e){}const dir=p.dir||1;return {x:p.x+dir*38,y:p.y-58,dir};};
function casing(col){const m=muzzle();const c=G.casings.length>=12?G.casings.shift():{};Object.assign(c,{x:m.x-m.dir*14,y:m.y+4,vx:-m.dir*(60+Math.random()*60),vy:-180-Math.random()*60,r:0,t:0,b:0,floor:p.y+6,col:col||'#9ff6ff'});G.casings.push(c);}
const elixCol=()=>{const S=globalThis.Prismancer&&Prismancer.state;if(!S)return null;const E=Prismancer.ELIX||{};if(S.haste>0)return (E.gold||{}).c||'#ffd257';if(S.splash>0)return (E.orange||{}).c||'#ff8a3a';if(S.hot>0)return (E.teal||{}).c||'#6ff0d0';if(S.purple>0)return (E.purple||{}).c||'#b45cff';return null;};
/* ---------- Bubble Mag: auto-attack rounds ---------- */
let inSpell=0;
{const pj=projectile;projectile=function(from,to,amount,color,enemy=false,onHit=null){
 if(!on()||enemy||from!==p||inSpell||Math.abs(amount-p.power*.7)>.01)return pj.apply(this,arguments);
 if(G.pump>0){G.pend=Math.max(.05,G.pump);return;}
 const over=G.over;G.over=false;let amt=p.power*.34*(over?2:1);
 const S=globalThis.Prismancer&&Prismancer.state;let h=onHit;
 if(S&&S.hot>0){const f=h;h=function(){try{f&&f.apply(this,arguments)}catch(e){}p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.01);};}
 if(over&&to){const f=h,tt=to,a=amt;h=function(){try{f&&f.apply(this,arguments)}catch(e){}const nx=mobs.filter(e=>e.alive&&e!==tt&&d2(e,tt)<120).sort((x,y)=>d2(x,tt)-d2(y,tt))[0];if(nx)damage(nx,a,'#ffd257');};}
 const r=pj.call(this,from,to,amt,color,enemy,h);const s=shots[shots.length-1];if(s&&!s.enemy){s.ozRound=true;s.over=over;s.speed=Math.max(s.speed||0,560);}
 G.stats.rounds++;G.mag--;casing(elixCol());try{SND.round();}catch(e){}
 if(G.mag<=0){G.pump=G.pumpDur=.6;G.pumpT=0;G.tapped=false;G.pend=.6;G.stats.pumps++;setTimeout(()=>{try{SND.pump();}catch(e){}},80);}
 else G.pend=S&&S.haste>0?.34:.45;
 return r;};}
function endPump(){G.pump=0;G.mag=6;G.pend=0;try{SND.pump();}catch(e){}}
function tapPump(){if(!on()||G.pump<=0||G.tapped)return false;G.tapped=true;const t=G.pumpT;
 if(t>=PERFECT[0]&&t<=PERFECT[1]){G.stats.perfect++;G.over=true;G.overT=6;endPump();G.gauge.pulse=.12;try{SND.perfect();}catch(e){}try{if(typeof identityState!=='undefined'){identityState.value=Math.min((classIdentity&&classIdentity.mage&&classIdentity.mage.max)||9,(identityState.value||0)+1);}}catch(e){}try{float(p.x,p.y-120,'Perfect Pump!','#ffd257');}catch(e){}return true;}
 if(touch){try{float(p.x,p.y-110,'pump','#c9d6e8');}catch(e){}return true;} // mobile: a mistimed tap is just a normal pump
 G.stats.jam++;G.pumpDur=.9;G.pump=.9-t;G.pend=G.pump;G.gauge.shake=.2;try{SND.jam();}catch(e){}return true;}
addEventListener('keydown',e=>{if(e.key&&e.key.toLowerCase()==='r'&&on()&&G.pump>0&&!e.repeat){if(tapPump()){e.stopImmediatePropagation();e.preventDefault();}}},true);
const PB=document.createElement('div');PB.id='ozPumpBtn';PB.setAttribute('role','button');PB.setAttribute('aria-label','Pump');PB.innerHTML='<b>PUMP</b><small>R</small>';PB.hidden=true;document.body.appendChild(PB);
PB.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();tapPump();});
const css=document.createElement('style');css.textContent='#ozPumpBtn{position:fixed;z-index:40;width:72px;height:72px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 40% 35%,#ffe9a8,#c58a2a 60%,#6a4210);color:#2a1606;border:2px solid #ffd257;box-shadow:0 0 14px #ffd25788;font:700 13px Georgia,serif;touch-action:none;user-select:none;cursor:pointer}#ozPumpBtn[hidden]{display:none}#ozPumpBtn small{font-size:10px;opacity:.7}.oz-chg{position:absolute;inset:-3px;border-radius:inherit;pointer-events:none;background:conic-gradient(#9ff6ff var(--c,0%),transparent 0);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 0);mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 0)}';document.head.appendChild(css);
function placePump(){const a=document.getElementById('autoBtn');const show=on()&&G.pump>0&&typeof started!=='undefined'&&started;PB.hidden=!show;if(!show||!a)return;const r=a.getBoundingClientRect();PB.style.left=(r.left+r.width/2-36)+'px';PB.style.top=(r.top+r.height/2-36)+'px';}
/* ---------- charge tiers (offensive shots only: slots 0 and 4, and the signature) ---------- */
const CHG=[0,4];let suppressClick=-1;
function tierOf(h){return h>=.8?2:h>=.4?1:0;}
function startCharge(i,src){if(!on()||G.charge||p.cd[i]>0)return;G.charge={i,t:0,t0:performance.now(),src,tier:0};}
function releaseCharge(){const c=G.charge;if(!c)return;G.charge=null;c.t=(performance.now()-c.t0)/1000;const tier=c.t<.25?0:tierOf(c.t);G.stats.charged[tier]++;G.tier=tier;G.tierT=1.5;castSkill(c.i);}
addEventListener('keydown',e=>{if(!on()||e.repeat||typeof started==='undefined'||!started)return;const k=e.key;const i=k==='1'?0:k==='5'?4:-1;if(i<0)return;e.stopImmediatePropagation();startCharge(i,'key');},true);
addEventListener('keyup',e=>{if(G.charge&&G.charge.src==='key'&&(e.key==='1'||e.key==='5'))releaseCharge();},true);
document.addEventListener('pointerdown',e=>{if(!on())return;const hb=document.getElementById('hotbar');if(!hb)return;const b=e.target.closest&&e.target.closest('#hotbar > *');if(!b)return;const i=[...hb.children].indexOf(b);if(!CHG.includes(i))return;startCharge(i,'ptr');G.charge&&(G.charge.btn=b);},true);
document.addEventListener('pointerup',e=>{const c=G.charge;if(!c||c.src!=='ptr')return;if(c.t>=.25){suppressClick=c.i;releaseCharge();}else G.charge=null;},true);
document.addEventListener('pointercancel',()=>{if(G.charge&&G.charge.src==='ptr')G.charge=null;},true);
document.addEventListener('click',e=>{if(suppressClick<0)return;const hb=document.getElementById('hotbar');const b=e.target.closest&&e.target.closest('#hotbar > *');if(b&&[...hb.children].indexOf(b)===suppressClick){e.stopImmediatePropagation();e.preventDefault();}suppressClick=-1;},true);
/* ---------- spell hooks: chamber (mana) shots, tiers, overpressure, timelines ---------- */
{const cs=releaseSpell;releaseSpell=function(i){if(!on())return cs.apply(this,arguments);const before=p.cd[i],m0=p.mana,tier=CHG.includes(i)?G.tier|0:0;inSpell++;let r;try{r=cs.apply(this,arguments);}finally{inSpell--;}
 if(!(p.cd[i]>before))return r;
 if(CHG.includes(i))G.tier=0;
 const over=G.over&&[0,4].includes(i);if(over)G.over=false;
 G.boost=(over?1.25:1)*(i===0?[1,1.115,1.23][tier]:i===4?[1,1.14,1.27][tier]:1);G.boostT=G.boost>1?1.4:0;
 if(tier===2){p.mana=Math.max(0,p.mana-(m0-p.mana)*.5);if(i===0)p.cd[i]+=.4;}
 timeline(i,tier);return r;};}
{const dm=damage;damage=function(m,n,c){if(on()&&G.boostT>0&&!globalThis.OZ_SRC)n*=G.boost;return dm.call(this,m,n,c);};}
const FX={rings:[],splats:[],chokes:[],ups:[],flash:0,cracks:[],beams:[],drops:[]};
function timeline(i,tier){const m=muzzle(),S=globalThis.Prismancer&&Prismancer.state;
 if(i===0){try{SND.round();}catch(e){}casing('#9ff6ff');
  if(tier>0&&S){const first=typeof target!=='undefined'&&target;const extra=tier===1?[.5]:[.5,.4];let prev=first;extra.forEach((f,k)=>{setTimeout(()=>{if(!prev)return;const nx=mobs.filter(e=>e.alive&&e!==prev&&d2(e,prev)<190).sort((a,b)=>d2(a,prev)-d2(b,prev))[0];if(!nx)return;S.bolts.push({x:prev.x,y:prev.y-30,m:nx,amt:Math.round(p.power*1.3*f),t:0,dur:.22,bounce:true});try{SND.hop(3+k);}catch(e){}prev=nx;},(3+k)*280);});}
  [0,1,2].forEach(k=>setTimeout(()=>{try{SND.hop(k);}catch(e){}},220+k*280));}
 if(i===1){try{SND.inflate();}catch(e){}setTimeout(()=>FX.splats.push({x:p.x,y:p.y+4,t:0,life:.6}),60);}
 if(i===2){try{SND.uncork();}catch(e){}G.hose=1.1;setTimeout(()=>{G.drip=8;},650);}
 if(i===3){try{SND.choke();}catch(e){}FX.chokes.push({t:0,life:.2});setTimeout(()=>{FX.flash=.08;},200);if(S){G.chromeCap=p.maxHp*.3+6*p.level;G.chromeUsed=0;}}
 if(i===4){FX.ups.push({x:m.x,y:m.y,t:0,tier});setTimeout(()=>{try{SND.thumpUp();}catch(e){}},180);setTimeout(()=>{try{SND.burst();}catch(e){}FX.flash=.08;
   if(tier>0){const R=tier===2?190:165;for(const e of mobs)if(e.alive&&d2(e,p)<R&&d2(e,p)>=145)damage(e,p.power*(tier===2?1.4:1.25),'#eef6ff');if(tier===2)for(const e of mobs)if(e.alive&&d2(e,p)<R)e.stun=Math.max(e.stun||0,.5);}
   FX.rings.push({x:p.x,y:p.y,t:0,life:.4,r:tier===2?190:tier===1?165:145});},300);}}
/* Chrome Choke capacity (30% maxHp + 6·L): when spent the chrome cracks */
{const hu=hurt;hurt=function(n){const S=on()&&globalThis.Prismancer&&Prismancer.state;const was=S&&S.mirror>0;const r=hu.apply(this,arguments);
 if(was&&G.chromeCap){G.chromeUsed+=n*.75;try{SND.ting();}catch(e){}if(globalThis.PrismBlaster)try{PrismBlaster.FX.recoil=Math.max(PrismBlaster.FX.recoil||0,.05);}catch(e){}if(G.chromeUsed>=G.chromeCap){S.mirror=0;G.chromeCap=0;FX.cracks.push({t:0,x:p.x,y:p.y-50});try{SND.crack();float(p.x,p.y-130,'Chrome cracked','#e8f4ff');}catch(e){}}}
 if(S&&S.purple>0&&G.markNext){G.markNext=false;}
 return r;};}
/* Triple Pump signature */
if(typeof useSignature==='function'){const us=useSignature;useSignature=function(){const before=typeof identityState!=='undefined'?identityState.cooldown:0;const r=us.apply(this,arguments);if(on()&&typeof identityState!=='undefined'&&identityState.cooldown>before){[0,1,2].forEach(k=>setTimeout(()=>{try{SND.triple(k);}catch(e){}casing('#ffd257');const m=muzzle(),t=typeof target!=='undefined'&&target&&target.alive?target:null;if(t)FX.beams.push({x:m.x,y:m.y,tx:t.x,ty:t.y-30,t:0,life:.18,k});if(k===2)FX.flash=.08;},k*140));}return r;};}
/* ---------- update ---------- */
{const up=update;update=function(dt){const x0=p.x,y0=p.y;up.apply(this,arguments);try{if(!on())return placePump();
 if(G.pend!=null){p.attack=G.pend;G.pend=null;}
 if(G.pump>0){G.pumpT+=dt;G.pump-=dt;p.attack=Math.max(p.attack||0,G.pump);if(G.pump<=0)endPump();}
 if(G.overT>0){G.overT-=dt;if(G.overT<=0)G.over=false;}
 if(G.boostT>0)G.boostT-=dt;if(G.tierT>0){G.tierT-=dt;if(G.tierT<=0)G.tier=0;}
 if(G.charge){const c=G.charge;const was=tierOf(c.t);c.t=(performance.now()-c.t0)/1000;const now=tierOf(c.t);if(now>was)try{SND.charge(now);}catch(e){}c.tier=now;p.x=x0+(p.x-x0)*.6;p.y=y0+(p.y-y0)*.6;if(c.t>=1.2)releaseCharge();
  const b=c.btn||document.querySelectorAll('#hotbar > *')[c.i];if(b){let o=b.querySelector('.oz-chg');if(!o){o=document.createElement('i');o.className='oz-chg';b.style.position=b.style.position||'relative';b.appendChild(o);}o.style.setProperty('--c',Math.min(100,c.t/1.2*100)+'%');}}
 else document.querySelectorAll('.oz-chg').forEach(o=>o.remove());
 for(const c of G.casings){c.t+=dt;c.vy+=900*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;c.r+=14*dt;if(c.y>c.floor&&!c.b){c.b=1;c.y=c.floor;c.vy*=-.35;c.vx*=.5;}else if(c.y>c.floor){c.y=c.floor;c.vy=0;c.vx*=.9;}}
 G.casings=G.casings.filter(c=>c.t<.9);
 if(G.drip>0){G.drip-=dt;G.dripT=(G.dripT||0)-dt;if(G.dripT<=0){G.dripT=.4;const m=muzzle();FX.drops.push({x:m.x,y:m.y,vy:0,t:0,col:elixCol()||'#9ff6ff'});}}
 if(G.hose>0)G.hose-=dt;
 for(const k of ['rings','splats','chokes','ups','cracks','beams','drops'])for(const o of FX[k])o.t+=dt;
 for(const d of FX.drops){d.vy+=500*dt;d.y+=d.vy*dt;}
 FX.rings=FX.rings.filter(o=>o.t<o.life);FX.splats=FX.splats.filter(o=>o.t<o.life);FX.chokes=FX.chokes.filter(o=>o.t<.2);FX.ups=FX.ups.filter(o=>o.t<.3);FX.cracks=FX.cracks.filter(o=>o.t<.5);FX.beams=FX.beams.filter(o=>o.t<o.life);FX.drops=FX.drops.filter(o=>o.t<.5);
 if(FX.flash>0)FX.flash-=dt;G.gauge.pulse=Math.max(0,G.gauge.pulse-dt);G.gauge.shake=Math.max(0,G.gauge.shake-dt);
 placePump();}catch(e){console.warn('gun',e);}};}
/* ---------- draw ---------- */
{const dr=draw;draw=function(){dr.apply(this,arguments);if(!on()||typeof started!=='undefined'&&!started)return;g.save();try{const dpr=cinematic.dpr;g.setTransform(dpr,0,0,dpr,-camera.x*dpr,-camera.y*dpr);const t=typeof time!=='undefined'?time:performance.now()/1000;
 // bubble rounds
 g.globalCompositeOperation='lighter';
 for(const s of shots){if(!s.ozRound)continue;const R=s.over?13:10;const gr=g.createRadialGradient(s.x,s.y,1,s.x,s.y,R);gr.addColorStop(0,'#ffffff22');gr.addColorStop(.6,'#9ff6ff55');gr.addColorStop(1,s.over?'#ffd257aa':'#e2b8ff88');g.fillStyle=gr;g.beginPath();g.arc(s.x,s.y,R,0,7);g.fill();g.strokeStyle='#ffffffaa';g.lineWidth=1.5;g.beginPath();g.arc(s.x,s.y,R*.6,3.6+t*4,5.2+t*4);g.stroke();g.fillStyle='#fff';g.fillRect(s.x-3,s.y-4,1.5,1.5);}
 for(const b of FX.beams){const k=1-b.t/b.life;const gr=g.createLinearGradient(b.x,b.y,b.tx,b.ty);gr.addColorStop(0,'#6ff0d0');gr.addColorStop(.5,'#ff8ad8');gr.addColorStop(1,'#ffd257');g.strokeStyle=gr;g.globalAlpha=k;g.lineWidth=3*[1,1.2,1.5][b.k];g.beginPath();g.moveTo(b.x,b.y);g.lineTo(b.tx,b.ty);g.stroke();g.globalAlpha=1;}
 for(const u of FX.ups){const k=Math.min(1,u.t/.12);g.fillStyle='#e8f4ff';g.beginPath();g.arc(u.x,u.y-60*k-(u.t>.18?(u.t-.18)*300:0),5+u.tier*2,0,7);g.fill();}
 if(G.charge){const m=muzzle(),k=.35+.3*G.charge.tier+.1*Math.sin(t*20);const gr=g.createRadialGradient(m.x,m.y,1,m.x,m.y,14+8*G.charge.tier);gr.addColorStop(0,'#ffffff');gr.addColorStop(.4,'#9ff6ff');gr.addColorStop(1,'#9ff6ff00');g.globalAlpha=k;g.fillStyle=gr;g.beginPath();g.arc(m.x,m.y,22,0,7);g.fill();g.globalAlpha=1;}
 if(G.over){const m=muzzle();g.globalAlpha=.4+.2*Math.sin(t*12);g.fillStyle='#ffd257';g.beginPath();g.arc(m.x,m.y,7,0,7);g.fill();g.globalAlpha=1;}
 g.globalCompositeOperation='source-over';
 for(const r of FX.rings){const k=r.t/r.life;g.globalAlpha=1-k;g.strokeStyle='#e2b8ff';g.lineWidth=3;g.beginPath();g.ellipse(r.x,r.y,r.r*k,r.r*.38*k,0,0,7);g.stroke();g.globalAlpha=1;}
 for(const s of FX.splats){const k=Math.min(1,s.t/.18);g.globalAlpha=.7*(1-s.t/s.life);g.strokeStyle='#9ff6ff';g.lineWidth=2;g.beginPath();g.ellipse(s.x,s.y,46*k,16*k,0,0,7);g.stroke();for(let n=0;n<14;n++){const a=n/14*6.283;g.fillStyle=n%2?'#ff8ad8':'#6ff0d0';g.beginPath();g.arc(s.x+Math.cos(a)*40*k,s.y-Math.abs(Math.sin(a))*30*k*(1-k)+Math.sin(a)*10*k,2,0,7);g.fill();}g.globalAlpha=1;}
 for(const c of FX.chokes){const m=muzzle();for(let n=0;n<3;n++){g.strokeStyle='#e8f4ff';g.lineWidth=2;g.beginPath();g.ellipse(m.x-m.dir*n*5,m.y,3,7,c.t/.2*12.56,0,7);g.stroke();}}
 for(const c of FX.cracks){g.strokeStyle='#ffffff';g.lineWidth=1.5;g.globalAlpha=1-c.t/.5;for(let n=0;n<6;n++){const a=n*1.05;g.beginPath();g.moveTo(c.x,c.y);g.lineTo(c.x+Math.cos(a)*20,c.y+Math.sin(a)*24+6);g.lineTo(c.x+Math.cos(a+.2)*40,c.y+Math.sin(a+.2)*48);g.stroke();}g.globalAlpha=1;}
 for(const d of FX.drops){g.fillStyle=d.col;g.globalAlpha=1-d.t/.5;g.beginPath();g.ellipse(d.x,d.y,2,3,0,0,7);g.fill();g.globalAlpha=1;}
 for(const c of G.casings){g.save();g.translate(c.x,c.y);g.rotate(c.r);g.globalAlpha=1-Math.max(0,c.t-.6)/.3;g.fillStyle='#c8963a';g.fillRect(-1.5,-3,3,6);g.fillStyle=c.col;g.fillRect(-1.5,-4,3,1.2);g.restore();}
 g.globalAlpha=1;
 // HUD: pump gauge + mag pips (screen space)
 g.setTransform(dpr,0,0,dpr,0,0);const W=innerWidth,H=innerHeight;const hb=document.getElementById('hotbar');const hr=hb&&hb.getBoundingClientRect();const cx=hr?hr.left+hr.width/2:W/2,cy=hr?hr.top-44:H-150;
 for(let n=0;n<6;n++){g.fillStyle=n<G.mag?'#9ff6ff':'rgba(255,255,255,.18)';g.beginPath();g.arc(cx-30+n*12,cy+26,4,0,7);g.fill();}
 if(G.pump>0){const sh=G.gauge.shake>0?Math.sin(t*90)*3:0,sc=1+(G.gauge.pulse>0?.15:0);g.save();g.translate(cx+sh,cy);g.scale(sc,sc);const R=32,a0=Math.PI*1.15,a1=Math.PI*1.85,span=a1-a0,at=v=>a0+span*Math.min(1,v/G.pumpDur);
  g.lineCap='round';g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=8;g.beginPath();g.arc(0,0,R,a0,a1);g.stroke();
  if(G.pumpDur<=.6){g.strokeStyle='#ffd257';g.lineWidth=6;g.beginPath();g.arc(0,0,R,at(PERFECT[0]),at(PERFECT[1]));g.stroke();}
  g.strokeStyle=G.gauge.shake>0?'#ff6a3d':'#e8c98a';g.lineWidth=3;const na=at(G.pumpT);g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(na)*R,Math.sin(na)*R);g.stroke();g.fillStyle='#c58a2a';g.beginPath();g.arc(0,0,4,0,7);g.fill();g.restore();}
 if(FX.flash>0){g.globalAlpha=.15*(FX.flash/.08);g.fillStyle='#fff';g.fillRect(0,0,W,H);g.globalAlpha=1;}
}catch(e){}g.restore();};}
if(typeof restoreAdventure==='function'){const ra=restoreAdventure;restoreAdventure=function(){G.mag=6;G.pump=0;G.over=false;G.charge=null;return ra.apply(this,arguments);};}
globalThis.PrismGun={G,tapPump,PERFECT,touch,FX,SND};
})();
