'use strict';
/* Prismancer bubble-blaster: every Prismancer spell (except Gulp Brew) leaves from the blaster MUZZLE with a muzzle
   flash, a short recoil kick and a brew-coloured glow running up the glass feed tube from the hip potion tank.
   Muzzle anchor: per-frame `muzzle` arrays in the sheet meta when the new gun sheets land (tools/prism_ingest.py),
   else the sheet's staff/emit point. Bubble Ward is a bubble shot that wraps her; Mirror Gel's reflected shards fly
   out of the muzzle. */
(()=>{
if(!globalThis.Prismancer||typeof MoonMotion==='undefined')return;
const S=Prismancer.state,MM=MoonMotion;
const isPrism=()=>p.cls==='mage'&&typeof customHero!=='undefined'&&customHero&&/^prism/.test(customHero.look||'prismpearl');
const brew=()=>(Prismancer.ELIX[S.elixir]||{}).c||'#7ff6ff';
function sheetMeta(){const i=MM.animInfo&&MM.animInfo();if(!i||!i.sheet)return null;const look=i.sheet.replace(/-[a-z]+$/,''),an=i.sheet.slice(look.length+1),m=MM.anim.sheets[look]&&MM.anim.sheets[look][an];return m?{m,i}:null;}
function muzzle(){const q=sheetMeta();if(q&&q.m.muzzle&&q.m.muzzle[q.i.i|0]){const [mx,my]=q.m.muzzle[q.i.i|0],k=q.i.k||.43,f=q.i.flip?-1:1;return {x:p.x+(mx-q.m.anchorX)*k*f,y:p.y+7+(my-q.m.baseY)*k,dir:f};}
 const e=MM.emitWorld&&(MM.emitWorld('cast')||MM.emitWorld('attack'));const dir=p.dir||1;return e?{x:e.x,y:e.y,dir:Math.sign(e.x-p.x)||dir}:{x:p.x+dir*30,y:p.y-55,dir};}
const hip=()=>({x:p.x-(p.dir||1)*6,y:p.y-30});
const FX={flash:[],bub:[],recoil:0,tube:0};
function fire(col,big){if(!isPrism())return;const m=muzzle();FX.flash.push({x:m.x,y:m.y,dir:m.dir,t:0,life:big?.18:.12,col:col||brew(),big});FX.recoil=big?.16:.1;FX.tube=.5;return m;}
// spells
{const rs=releaseSpell;releaseSpell=function(i){const before=p.cd[i];const m0=isPrism()?muzzle():null;const r=rs.apply(this,arguments);
 if(isPrism()&&p.cd[i]>before&&i!==2){const m=fire(i===4?'#c9f4ff':i===3?'#eef6ff':brew(),i===4||i===1);
  if(i===1&&m)FX.bub.push({x:m.x,y:m.y,t:0,life:.3});}
 return r;};}
// auto-attack shots
{const pj=projectile;projectile=function(){const n=shots.length;const r=pj.apply(this,arguments);if(isPrism()&&shots.length>n){const s=shots[shots.length-1];if(s&&!s.enemy){const m=fire(null,false);if(m){s.x=m.x;s.y=m.y;s.trail=[];}}}return r;};}
// reflected mirror shards leave from the muzzle
{const push=S.bolts.push.bind(S.bolts);S.bolts.push=function(o){if(o&&!o.bounce&&isPrism()){const m=muzzle();o.x=m.x;o.y=m.y;FX.flash.push({x:m.x,y:m.y,dir:m.dir,t:0,life:.1,col:'#eef6ff'});FX.recoil=Math.max(FX.recoil,.06);}return push(o);};}
// recoil: kick the hero sprite back along the aim
for(const nm of ['actor','renderSprite']){const fn=globalThis[nm];if(typeof fn!=='function')continue;globalThis[nm]=function(o,hero){if(!hero||!isPrism()||FX.recoil<=0)return fn.apply(this,arguments);const k=FX.recoil/.16;g.save();g.translate(-(p.dir||1)*5*k,-1.5*k);try{return fn.apply(this,arguments);}finally{g.restore();}};}
try{actor=globalThis.actor;renderSprite=globalThis.renderSprite;}catch(e){}
{const up=update;update=function(dt){up.apply(this,arguments);if(typeof isPaused==='function'&&isPaused())return;FX.recoil=Math.max(0,FX.recoil-dt);FX.tube=Math.max(0,FX.tube-dt);for(const f of FX.flash)f.t+=dt;FX.flash=FX.flash.filter(f=>f.t<f.life);for(const b of FX.bub)b.t+=dt;FX.bub=FX.bub.filter(b=>b.t<b.life);};}
{const dr=draw;draw=function(){dr.apply(this,arguments);if(!isPrism()||typeof started!=='undefined'&&!started)return;g.save();try{g.setTransform(cinematic.dpr,0,0,cinematic.dpr,-camera.x*cinematic.dpr,-camera.y*cinematic.dpr);
 const t=typeof time!=='undefined'?time:performance.now()/1000;
 if(FX.tube>0){const m=muzzle(),h=hip(),a=Math.min(1,FX.tube*2.5),c=brew();g.globalAlpha=.75*a;g.strokeStyle=c;g.lineWidth=3;g.shadowColor=c;g.shadowBlur=10;g.beginPath();g.moveTo(h.x,h.y);g.bezierCurveTo(h.x+m.dir*4,h.y+16,m.x-m.dir*30,m.y+16,m.x-m.dir*14,m.y+3);g.stroke();
  const u=(t*3)%1;g.fillStyle='#fff';g.beginPath();const bx=h.x+(m.x-m.dir*14-h.x)*u,by=h.y+(m.y-h.y)*u+Math.sin(u*Math.PI)*12;g.arc(bx,by,2.2,0,7);g.fill();g.shadowBlur=0;g.globalAlpha=1;}
 for(const f of FX.flash){const k=f.t/f.life,R=(f.big?26:16)*(1-k*.4);g.save();g.translate(f.x,f.y);g.globalAlpha=1-k;g.fillStyle=f.col;g.shadowColor=f.col;g.shadowBlur=18;for(let n=0;n<6;n++){const a=n/6*6.283+(f.dir<0?Math.PI:0)+k;g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(a-.12)*R*.35,Math.sin(a-.12)*R*.35);g.lineTo(Math.cos(a)*R*(n%2?.6:1),Math.sin(a)*R*(n%2?.6:1));g.lineTo(Math.cos(a+.12)*R*.35,Math.sin(a+.12)*R*.35);g.fill();}
  g.fillStyle='#fff';g.beginPath();g.arc(0,0,R*.28,0,7);g.fill();g.globalAlpha=(1-k)*.6;g.strokeStyle='#fff';g.lineWidth=1.5;g.beginPath();g.arc(f.dir*R*.6,0,R*.5*(.5+k),0,7);g.stroke();g.restore();}
 for(const b of FX.bub){const k=Math.min(1,b.t/b.life),x=b.x+(p.x-b.x)*k,y=b.y+(p.y-50-b.y)*k,r=8+50*k;g.globalAlpha=.8*(1-k*.5);g.strokeStyle='#c9f4ff';g.lineWidth=2;g.beginPath();g.ellipse(x,y,r*.8,r,0,0,7);g.stroke();g.fillStyle='rgba(201,244,255,.12)';g.fill();g.globalAlpha=1;}
}catch(e){}g.restore();};}
globalThis.PrismBlaster={muzzle,fire,FX};
})();
