'use strict';
/* Oozevale races: each race changes the WHOLE model, not just a label. Until real per-race sheets land
   (REQUESTS-races.md) this is code-driven: body proportions (height/width squash), gait bob, walk speed and
   walk-cycle timing, plus race features that read even with the helmet on (dwarf beard, elf ears, goblin ears +
   green hands). Helmet OFF draws a placeholder race head over the helmet. Anchors come from each frame's alpha
   bounding box (top of head, head centre x), cached per sheet + frame. Saved per character: customHero.helmet. */
(()=>{
const R={
 humans:{name:'Human',sx:1,sy:1,bob:0,speed:1,fps:1,skin:'#e8b48e',hair:'#6a4022'},
 mountaindwarves:{name:'Dwarf',sx:1.16,sy:.8,bob:.05,speed:.95,fps:.85,skin:'#e0a07a',hair:'#c0582a',beard:true},
 moonelves:{name:'Moon Elf',sx:.9,sy:1.08,bob:0,speed:1.04,fps:1.1,skin:'#e6dcf6',hair:'#a99cd0',ears:'elf'},
 goblins:{name:'Goblin',sx:1,sy:.74,bob:.03,speed:1.05,fps:1.25,skin:'#8fc45a',hair:'#3a5a1a',ears:'gob',hands:true}};
const raceId=r=>{if(!r)return 'humans';if(R[r])return r;if(/dwar/.test(r))return 'mountaindwarves';if(/elf/.test(r))return 'moonelves';if(/gob/.test(r))return 'goblins';return 'humans';};
const prof=r=>R[raceId(r)];
const heroRace=()=>typeof customHero!=='undefined'&&customHero?customHero.race:null;
const helmetOn=()=>!(typeof customHero!=='undefined'&&customHero&&customHero.helmet===false);
/* ---- anchors from alpha bbox ---- */
const AC=new Map();
function anchor(m,i){if(!m||!m.img||!(m.img.naturalWidth||m.img.width))return null;const key=(m.src||m.img.src)+'#'+i;let a=AC.get(key);if(a)return a;
 try{const c=document.createElement('canvas');c.width=m.cellW;c.height=m.cellH;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(m.img,i*m.cellW,0,m.cellW,m.cellH,0,0,m.cellW,m.cellH);const d=x.getImageData(0,0,m.cellW,m.cellH).data;
  let top=-1;for(let y=0;y<m.cellH&&top<0;y++)for(let X=0;X<m.cellW;X++)if(d[(y*m.cellW+X)*4+3]>60){top=y;break;}
  const body=(m.baseY-top),band=Math.round(body*.14);let sx=0,n=0,minx=1e9,maxx=-1;for(let y=top;y<top+band;y++)for(let X=0;X<m.cellW;X++)if(d[(y*m.cellW+X)*4+3]>60){sx+=X;n++;if(X<minx)minx=X;if(X>maxx)maxx=X;}
  a={top,cx:n?sx/n:m.anchorX,body,hw:maxx>minx?(maxx-minx):body*.12};}catch(e){a={top:m.baseY-(m.bodyH||260),cx:m.anchorX,body:m.bodyH||260,hw:30};}
 AC.set(key,a);if(AC.size>600)AC.delete(AC.keys().next().value);return a;}
/* ---- features, drawn in sheet-cell space scaled by k with origin at the feet anchor ---- */
function features(x,race,m,i,k,view,flip,t,helmet){const P=prof(race);const a=anchor(m,i);if(!a)return;
 const hx=(a.cx-m.anchorX)*k,top=(a.top-m.baseY)*k,H=a.body*k,hh=H*.15,face=view==='side'?1:0,back=view==='back';
 x.save();if(flip)x.scale(-1,1);x.lineJoin='round';
 const cy=top+hh*.62,fx=hx+(face?hh*.18:0);
 // helmet off: placeholder race head over the helmet
 if(!helmet){x.fillStyle=P.hair;x.beginPath();x.ellipse(hx,cy-hh*.08,hh*.62,hh*.66,0,0,7);x.fill();
  if(!back){x.fillStyle=P.skin;x.beginPath();x.ellipse(fx,cy+hh*.08,hh*(face?.44:.48),hh*.5,0,0,7);x.fill();x.fillStyle='#201810';
   if(face){x.beginPath();x.arc(fx+hh*.2,cy,hh*.06,0,7);x.fill();}else{x.beginPath();x.arc(fx-hh*.17,cy,hh*.06,0,7);x.arc(fx+hh*.17,cy,hh*.06,0,7);x.fill();}
   x.fillStyle=P.hair;x.beginPath();x.ellipse(hx-(face?hh*.12:0),cy-hh*.42,hh*.58,hh*.26,0,Math.PI,0);x.fill();}
  if(raceId(race)==='moonelves'){x.fillStyle=P.hair;x.beginPath();x.moveTo(hx-hh*.5,cy);x.quadraticCurveTo(hx-hh*.75,cy+hh*1.1,hx-hh*.3,cy+hh*1.3);x.lineTo(hx-hh*.1,cy+hh*.4);x.fill();}}
 // ears (show through the helmet)
 if(P.ears){const elf=P.ears==='elf',len=hh*(elf?1.05:.95),side=[-1,1];x.fillStyle=P.skin;x.strokeStyle='rgba(0,0,0,.45)';x.lineWidth=Math.max(1,hh*.05);
  for(const s of side){const ex=hx+s*hh*.46,ey=cy;x.beginPath();x.moveTo(ex,ey-hh*.18);
   if(elf){x.quadraticCurveTo(ex+s*len*.6,ey-hh*.35,ex+s*len,ey-len*.85);x.quadraticCurveTo(ex+s*len*.45,ey-hh*.05,ex,ey+hh*.16);}
   else{x.quadraticCurveTo(ex+s*len*.7,ey-hh*.5,ex+s*len*1.15,ey-hh*.15);x.quadraticCurveTo(ex+s*len*.6,ey+hh*.25,ex,ey+hh*.18);}
   x.closePath();x.fill();x.stroke();x.fillStyle='rgba(120,60,60,.35)';x.beginPath();x.ellipse(ex+s*len*.35,ey-hh*.08,len*.18,hh*.08,s*(elf?-.6:-.2),0,7);x.fill();x.fillStyle=P.skin;}}
 // dwarf beard (pokes out under the helmet)
 if(P.beard&&!back){const bw=hh*(face?.55:.72),by=cy+hh*.38,bx=face?fx+hh*.12:hx;const g2=x.createLinearGradient(0,by,0,by+hh*1.35);g2.addColorStop(0,P.hair);g2.addColorStop(1,'#7a2e10');x.fillStyle=g2;
  x.beginPath();x.moveTo(bx-bw/2,by);x.quadraticCurveTo(bx-bw*.55,by+hh*.7,bx,by+hh*1.05);x.quadraticCurveTo(bx+bw*.55,by+hh*.7,bx+bw/2,by);x.closePath();x.fill();
  x.strokeStyle='rgba(60,20,5,.6)';x.lineWidth=Math.max(1,hh*.05);for(let j=-1;j<=1;j++){x.beginPath();x.moveTo(bx+j*bw*.2,by+hh*.2);x.lineTo(bx+j*bw*.12,by+hh*1.1);x.stroke();}
  x.fillStyle='#d8b050';x.fillRect(bx-hh*.08,by+hh*.72,hh*.16,hh*.1);}
 if(P.beard&&back){x.fillStyle=P.hair;x.beginPath();x.ellipse(hx-hh*.55,cy+hh*.5,hh*.16,hh*.3,.3,0,7);x.ellipse(hx+hh*.55,cy+hh*.5,hh*.16,hh*.3,-.3,0,7);x.fill();}
 // goblin green hands at the sheet's hand anchors (approx: mid-body sides)
 if(P.hands&&m.emit&&m.emit[i]&&!back){const e=m.emit[i];x.fillStyle=P.skin;x.strokeStyle='rgba(0,0,0,.4)';x.lineWidth=1;x.beginPath();x.arc((e[0]-m.anchorX)*k,(e[1]-m.baseY)*k+hh*.15,hh*.2,0,7);x.fill();x.stroke();}
 x.restore();}
/* ---- in-game hero ---- */
const MM=typeof MoonMotion!=='undefined'?MoonMotion:null;
function bodyTf(ctx,race,ox,oy,walking,t){const P=prof(race);let sy=P.sy,sx=P.sx;if(walking&&P.bob){const b=Math.abs(Math.sin(t*9*P.fps));sy*=1-P.bob*b;sx*=1+P.bob*.5*b;}
 ctx.translate(ox,oy);ctx.scale(sx,sy);ctx.translate(-ox,-oy);return {sx,sy};}
function wrapActor(fn){return function(o,hero,ghost){if(!hero)return fn.apply(this,arguments);const race=heroRace(),t=typeof time!=='undefined'?time:performance.now()/1000;
 const info=MM&&MM.animInfo&&MM.animInfo(),walking=info&&/walk/.test(info.state||info.sheet||'');
 g.save();bodyTf(g,race,o.x,o.y+7,walking,t);let r;try{r=fn.apply(this,arguments);}finally{}
 try{if(info&&info.sheet&&(ghost===undefined||ghost>=1)){const look=info.sheet.replace(/-(idle|walk|walkfront|walkback|attack|cast|hurt|gulp)$/,''),an=info.sheet.slice(look.length+1),m=MM.anim.sheets[look]&&MM.anim.sheets[look][an];
   if(m&&m.ok!==false){g.save();g.translate(o.x,o.y+7);features(g,race,m,info.i|0,info.k||.43,m.view||'side',!!info.flip,t,helmetOn());g.restore();}}}catch(e){}
 g.restore();return r;};}
if(typeof actor==='function')actor=wrapActor(actor);
if(typeof renderSprite==='function')renderSprite=wrapActor(renderSprite);
// walk speed + walk-cycle timing feel
{let px=null,py=null;const up=update;update=function(dt){if(px===null||typeof started!=='undefined'&&!started){px=p.x;py=p.y;}const bx=p.x,by=p.y;const r=up.apply(this,arguments);
 const P=prof(heroRace()),dx=p.x-bx,dy=p.y-by,d=Math.hypot(dx,dy);if(P.speed!==1&&d>0&&d<25&&!(p.dash>0)){const nx=bx+dx*P.speed,ny=by+dy*P.speed;if(typeof blocked!=='function'||!blocked(nx,ny)){p.x=nx;p.y=ny;}}px=p.x;py=p.y;return r;};}
const FPS0=new Map();
setInterval(()=>{if(!MM||!MM.anim||!MM.anim.sheets)return;const P=prof(heroRace());for(const [look,set] of Object.entries(MM.anim.sheets))for(const an of ['walk','walkfront','walkback']){const m=set&&set[an];if(!m)continue;const k=look+an;if(!FPS0.has(k))FPS0.set(k,m.fps);const own=typeof customHero!=='undefined'&&customHero&&customHero.look===look;m.fps=FPS0.get(k)*(own?P.fps:1);}},500);
/* ---- creator hooks (called from moonvale-creator draw) ---- */
const CR={pre(cx,race,mode,t){bodyTf(cx,race,0,0,mode==='walk',t);},post(cx,race,m,f,k,t,flip){features(cx,race,m,f,k,m.view||'side',flip,t,CR.helmet());},
 helmet(){const S=globalThis.MoonCreator&&MoonCreator.state;return S&&S.helmet===false?false:true;}};
/* creator toggle + Settings toggle */
function creatorToggle(){const box=document.getElementById('mvcRaces');if(!box||document.getElementById('ozHelmet'))return;const S=MoonCreator.state;if(S.helmet===undefined)S.helmet=typeof customHero!=='undefined'&&customHero&&customHero.helmet===false?false:true;
 const b=document.createElement('button');b.type='button';b.id='ozHelmet';b.className='mvc-race oz-helm';const lab=()=>{b.innerHTML='<b>Helmet: '+(S.helmet?'On':'Off')+'</b><small>tap to preview the '+(S.helmet?'face':'helmet')+'</small>';b.classList.toggle('on',!S.helmet);};lab();
 b.onclick=()=>{S.helmet=!S.helmet;lab();};box.after(b);}
setInterval(()=>{if(globalThis.MoonCreator)creatorToggle();settingsToggle();},400);
function settingsToggle(){const S=document.getElementById('mvSettings');if(!S||!S.open)return;let row=document.getElementById('ozHelmRow');
 if(!row){row=document.createElement('label');row.id='ozHelmRow';row.className='oz-helm-row';row.innerHTML='<input type="checkbox" id="ozHelmChk"> <span>Show helmet</span> <small>(this character)</small>';const host=S.querySelector('.mv-settings,form,section,div')||S;host.appendChild(row);
  row.querySelector('input').onchange=e=>{if(typeof customHero!=='undefined'&&customHero){customHero.helmet=e.target.checked;try{writeDeviceSave(true);}catch(er){}}};}
 row.querySelector('input').checked=helmetOn();}
// carry the creator choice into the new hero
let pend=null;setInterval(()=>{if(pend!==null&&typeof customHero!=='undefined'&&customHero&&typeof started!=='undefined'&&started){customHero.helmet=pend;pend=null;try{writeDeviceSave(true);}catch(e){}}},300);
if(typeof beginCreation==='function'||globalThis.MoonCreator){const tryWrap=()=>{const MC=globalThis.MoonCreator;if(!MC||MC.__ozh)return;MC.__ozh=1;const b=MC.begin;if(b)MC.begin=function(){const r=b.apply(this,arguments);setTimeout(()=>{if(typeof customHero!=='undefined'&&customHero)customHero.helmet=MC.state.helmet!==false;},0);return r;};
 const btn=()=>document.getElementById('mvcBegin');document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#mvcBegin'))pend=MC.state.helmet!==false;},true);};tryWrap();setTimeout(tryWrap,500);}
const css=document.createElement('style');css.textContent='.oz-helm{margin-top:6px;width:100%}.oz-helm-row{display:flex;gap:8px;align-items:center;margin:10px 0;color:#e9d8b4;font:600 15px Georgia,serif}.oz-helm-row input{width:20px;height:20px;accent-color:#3fe0c8}.oz-helm-row small{color:#b9a47c}';document.head.appendChild(css);
globalThis.OozeRace={R,prof,raceId,anchor,features,creator:CR,helmetOn};
})();
