'use strict';
/* Moonvale world presentation: crisp canvas, smooth camera, per-zone atmosphere
   (palette grade, night lighting with real light sources, fog, weather, particles,
   foreground depth), zone banners, in-game clock, ambient sound and combat feel. */

// ---------- Combat feel ------------------------------------------------------------------
const MoonFeel=(()=>{let stop=0;
 function hitstop(s){stop=Math.max(stop,s);}
 function scale(dt){if(stop>0){stop-=dt;return dt*.08;}return dt;}
 return {hitstop,scale};})();
{const before=update;update=function(dt){before(MoonFeel.scale(dt));};}

// ---------- Smooth camera ----------------------------------------------------------------
globalThis.MoonCamera=(()=>{let last=0,inited=false,lx=0,ly=0;
 function follow(){const now=performance.now(),dt=Math.min(.1,(now-last)/1000||0);last=now;
  const s=typeof stateFor==='function'?stateFor(p,true):null,m=s?s.moving:0;
  lx+=((p.dx||0)*60*m-lx)*Math.min(1,dt*2.5);ly+=((p.dy||0)*40*m-ly)*Math.min(1,dt*2.5);if(!isFinite(lx))lx=0;if(!isFinite(ly))ly=0;if(!isFinite(camera.x)||!isFinite(camera.y))inited=false;
  // portrait phones: hero sits at ~53% of the screen height and the camera may run past the map edge
  // (the edge is filled with a mirrored, darkened strip of the zone art) instead of clamping the hero low
  const port=view.h>view.w*1.15,ay=port?(view.h<580?.66:.62):.5,px=port?view.w*.22:0,py=port?view.h*.32:0;
  const tx=clamp(p.x+lx-view.w/2,-px,Math.max(0,WORLD.w-view.w)+px),ty=clamp(p.y+ly-view.h*ay,-py,Math.max(0,WORLD.h-view.h)+py);
  if(!inited||Math.abs(tx-camera.x)>320||Math.abs(ty-camera.y)>320){camera.x=tx;camera.y=ty;inited=true;return;}
  const k=1-Math.exp(-dt*7);camera.x+=(tx-camera.x)*k;camera.y+=(ty-camera.y)*k;}
 return {follow};})();

// ---------- Zone profiles ----------------------------------------------------------------
const MoonZones=(()=>{
 const P={
  grove:{tint:[58,72,135],dark:.42,grade:'#ff9a4a',gradeA:.06,fog:'#9fc2e6',fogA:.05,parts:['firefly','mote','leaf'],embers:true,canopy:'#08130f',sound:{type:'night',freq:900,gain:.018},light:'#ffbe7a'},
  moon:{tint:[52,84,135],dark:.40,grade:'#6fc9ff',gradeA:.07,fog:'#a8d8f0',fogA:.08,parts:['mote','firefly'],canopy:'#071318',sound:{type:'water',freq:500,gain:.02},light:'#a9dcff'},
  chapel:{tint:[78,52,138],dark:.48,grade:'#9b6cff',gradeA:.09,fog:'#b7a2e8',fogA:.05,parts:['dust','mote'],canopy:null,sound:{type:'wind',freq:350,gain:.02},light:'#ffcf8a'},
  marsh:{tint:[38,92,104],dark:.46,grade:'#3fe0c0',gradeA:.07,fog:'#8fe0c8',fogA:.11,parts:['wisp','firefly'],canopy:'#06140f',sound:{type:'marsh',freq:420,gain:.022},light:'#ffb35e'},
  frost:{tint:[120,142,185],dark:.30,grade:'#bfe6ff',gradeA:.08,fog:'#e6f4ff',fogA:.08,parts:['snow'],canopy:null,sound:{type:'wind',freq:700,gain:.024},light:'#ffd9a0'},
  coast:{tint:[90,112,142],dark:.32,grade:'#6fe0e8',gradeA:.06,fog:'#cdeef2',fogA:.07,parts:['rain'],canopy:null,sound:{type:'rain',freq:1800,gain:.03},light:'#ffd394'},
  meadow:{tint:[210,186,150],dark:.14,grade:'#ffd36e',gradeA:.07,fog:'#fff1c8',fogA:.06,parts:['pollen','leaf'],canopy:'#16200c',sound:{type:'wind',freq:1200,gain:.012},light:'#ffe2a0'},
  star:{tint:[72,62,135],dark:.40,grade:'#c4a7f5',gradeA:.08,fog:'#d4c4ff',fogA:.08,parts:['star','mote'],canopy:null,sound:{type:'wind',freq:600,gain:.015},light:'#e2d0ff'},
  dawn:{tint:[185,140,140],dark:.20,grade:'#ffcf9a',gradeA:.08,fog:'#ffe6c8',fogA:.08,parts:['gold','mote'],canopy:null,sound:{type:'wind',freq:800,gain:.012},light:'#ffe2a8'},
  ember:{tint:[130,62,48],dark:.36,grade:'#ff6a2a',gradeA:.08,fog:'#ffb58a',fogA:.06,parts:['ember','ash'],canopy:null,sound:{type:'wind',freq:300,gain:.02},light:'#ff9d4d'}
 };
 function kindFor(z){const n=((zones[z]?.name||'')+' '+(zones[z]?.sub||'')).toLowerCase();
  if(z===0||/grove|lantern|wood|forest|glade/.test(n))return 'grove';
  if(/sanctum|chapel|ruin|crypt|cathedral|abbey|tomb|citadel/.test(n))return 'chapel';
  if(/fen|marsh|mire|bog|swamp/.test(n))return 'marsh';
  if(/frost|snow|ice|rime|winter|glacier|pine/.test(n))return 'frost';
  if(/tide|coast|shore|sea|harbor|reef|isle/.test(n))return 'coast';
  if(/meadow|downs|field|farm|harvest/.test(n))return 'meadow';
  if(/star|sky|highland|observ/.test(n))return 'star';
  if(/crown|dawn|sun|gold/.test(n))return 'dawn';
  if(/ash|ember|forge|cinder|flame|burn|volcan/.test(n))return 'ember';
  if(/moon|water|lake|river|reach/.test(n))return 'moon';
  return ['grove','moon','chapel','marsh'][z%4];}
 function profile(z){return P[kindFor(z)];}
 return {profile,kindFor,P};})();

// ---------- Light sources found in the painted art -------------------------------------
const MoonLights=(()=>{const cache=new WeakMap();
 function find(img){if(!img||!img.complete||!img.naturalWidth)return [];if(cache.has(img))return cache.get(img);
  const W=180,H=120,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{willReadFrequently:true});let d;
  try{x.drawImage(img,0,0,W,H);d=x.getImageData(0,0,W,H).data;}catch(e){cache.set(img,[]);return [];}
  const score=new Float32Array(W*H);
  for(let i=0;i<W*H;i++){const r=d[i*4],gg=d[i*4+1],b=d[i*4+2],l=.3*r+.55*gg+.15*b;
   const warm=r>175&&gg>110&&r>b+50?(l-120):0,cool=l>205?(l-190)*.8:0;score[i]=Math.max(0,warm,cool);}
  const out=[];for(let y=2;y<H-2;y++)for(let xx=2;xx<W-2;xx++){const v=score[y*W+xx];if(v<45)continue;let max=true;
   for(let dy=-4;dy<=4&&max;dy++)for(let dx=-4;dx<=4;dx++){const yy=y+dy,x2=xx+dx;if(yy<0||yy>=H||x2<0||x2>=W)continue;if(score[yy*W+x2]>v){max=false;break;}}
   if(max){const i=(y*W+xx)*4;out.push({x:(xx+.5)/W*WORLD.w,y:(y+.5)/H*WORLD.h,v,color:'rgb('+d[i]+','+d[i+1]+','+d[i+2]+')',warm:d[i]>d[i+2]+40,seed:Math.random()*9});}}
  out.sort((a,b)=>b.v-a.v);const pick=[];for(const o of out){if(pick.every(q=>Math.hypot(q.x-o.x,q.y-o.y)>70))pick.push(o);if(pick.length>=22)break;}
  cache.set(img,pick);return pick;}
 return {find};})();

// ---------- Atmosphere renderer ---------------------------------------------------------
const MoonAtmos=(()=>{
 const parts=[],MAX=170;let zone=-1,fade=0,prof=MoonZones.P.grove,lastT=performance.now(),clockStart=performance.now();
 const dark=document.createElement('canvas'),dctx=dark.getContext('2d');
 const stamp=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),gr=x.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.35,'rgba(0,0,0,.75)');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);return c;})();
 const fogTex=new Map();function fog(color){if(fogTex.has(color))return fogTex.get(color);const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');let seed=7;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let i=0;i<46;i++){const px=r()*512,py=r()*512,rad=50+r()*130;for(const [ox,oy] of [[0,0],[512,0],[-512,0],[0,512],[0,-512]]){const gr=x.createRadialGradient(px+ox,py+oy,0,px+ox,py+oy,rad);gr.addColorStop(0,color+'55');gr.addColorStop(1,color+'00');x.fillStyle=gr;x.fillRect(px+ox-rad,py+oy-rad,rad*2,rad*2);}}
  fogTex.set(color,c);return c;}
 const canopyTex=new Map();function canopy(color){if(canopyTex.has(color))return canopyTex.get(color);const c=document.createElement('canvas');c.width=900;c.height=260;const x=c.getContext('2d');let seed=11;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let i=0;i<120;i++){const px=r()*900,py=150+r()*140-((px<200||px>700)?60*r():0),rx=18+r()*36,ry=10+r()*20;x.fillStyle=color;x.globalAlpha=.85+r()*.15;x.beginPath();x.ellipse(px,py,rx,ry,r()*3,0,Math.PI*2);x.fill();}
  x.globalAlpha=.18;x.fillStyle='#2f4a2a';for(let i=0;i<60;i++){const px=r()*900,py=170+r()*80;x.beginPath();x.ellipse(px,py,8+r()*10,4+r()*5,r()*3,0,Math.PI*2);x.fill();}
  canopyTex.set(color,c);return c;}
 function gameMinutes(){return (21*60+30+(performance.now()-clockStart)/1000)%1440;}
 function nightFactor(){const h=gameMinutes()/60;if(h>=20||h<5)return 1;if(h<8)return 1-(h-5)/3;if(h<18)return 0;return (h-18)/2;}
 function clockText(){const m=Math.floor(gameMinutes()),h=Math.floor(m/60),mm=m%60,ap=h>=12?'PM':'AM',h12=h%12||12;return h12+':'+String(mm).padStart(2,'0')+' '+ap;}
 function rnd(a,b){return a+Math.random()*(b-a);}
 function spawn(kind,anywhere){if(parts.length>=MAX)return;const x0=camera.x-40,y0=camera.y-40,W=view.w+80,H=view.h+80;
  const q={kind,x:x0+Math.random()*W,y:anywhere?y0+Math.random()*H:y0+Math.random()*H,vx:0,vy:0,life:rnd(3,8),max:0,seed:Math.random()*9,size:1};
  if(kind==='snow'){q.vy=rnd(22,48);q.vx=rnd(-12,4);q.size=rnd(1,2.6);q.life=12;}
  else if(kind==='rain'){q.vy=rnd(520,700);q.vx=-90;q.life=1.4;}
  else if(kind==='leaf'){q.vy=rnd(14,28);q.vx=rnd(-20,20);q.life=14;q.size=rnd(2,3.5);}
  else if(kind==='firefly'){q.vx=rnd(-8,8);q.vy=rnd(-8,8);q.life=rnd(4,9);}
  else if(kind==='wisp'){q.vx=rnd(-6,6);q.vy=rnd(-4,4);q.life=rnd(5,10);q.size=rnd(3,6);}
  else if(kind==='star'){q.vx=rnd(-70,-30);q.vy=rnd(40,90);q.life=rnd(.6,1.4);q.y=y0+Math.random()*H*.6;}
  else {q.vy=rnd(-12,-4);q.vx=rnd(-5,5);q.size=rnd(1,2);}
  q.max=q.life;parts.push(q);}
 function spawnEmber(x,y){if(parts.length>=MAX)return;parts.push({kind:'ember',x:x+rnd(-14,14),y:y-rnd(4,16),vx:rnd(-10,10),vy:rnd(-55,-25),life:rnd(.8,1.8),max:1.8,seed:Math.random()*9,size:rnd(1,2.2)});}
 function step(dt){
  const want=prof.parts,quota=cinematic.quality==='low'?40:110,n=Math.max(1,Math.round(quota/want.length));
  for(const k of want){let c=0;for(const q of parts)if(q.kind===k)c++;const wgt={leaf:.22,star:.12,ember:.5,ash:.6,wisp:.55,dust:.8}[k]??1,target=(k==='rain'?n*1.6:k==='firefly'?n*(.35+.65*nightFactor()):n)*wgt;if(c<target)for(let i=0;i<Math.min(4,target-c);i++)spawn(k,zone!==story.zone);}
  if(prof.embers&&story.zone===0&&Math.random()<dt*14)spawnEmber(CAMP.x,CAMP.y);
  for(const L of lights()) if(L.fire&&Math.random()<dt*3)spawnEmber(L.x,L.y);
  for(let i=parts.length-1;i>=0;i--){const q=parts[i];q.life-=dt;
   if(q.kind==='firefly'||q.kind==='wisp'){q.vx+=Math.sin(time*1.3+q.seed)*dt*14;q.vy+=Math.cos(time*1.1+q.seed*2)*dt*10;q.vx*=.98;q.vy*=.98;}
   if(q.kind==='snow'||q.kind==='leaf')q.vx+=Math.sin(time*.9+q.seed)*dt*10;
   q.x+=q.vx*dt;q.y+=q.vy*dt;
   if(q.life<=0||q.x<camera.x-120||q.x>camera.x+view.w+120||q.y<camera.y-160||q.y>camera.y+view.h+120)parts.splice(i,1);}
 }
 function drawParts(){g.save();
  for(const q of parts){const a=Math.min(1,q.life/(q.max*.25),(q.max-q.life)/.6+.01);
   if(q.kind==='firefly'){const tw=.4+.6*Math.max(0,Math.sin(time*3+q.seed*3));glow(q.x,q.y,7,'#e8ff9a',a*tw*.9);g.fillStyle='rgba(255,255,210,'+(a*tw)+')';g.fillRect(q.x-.75,q.y-.75,1.5,1.5);}
   else if(q.kind==='wisp'){glow(q.x,q.y,10+q.size*2,'#5ff5d0',a*.55);g.fillStyle='rgba(200,255,240,'+(a*.9)+')';g.beginPath();g.arc(q.x,q.y,q.size*.45,0,7);g.fill();}
   else if(q.kind==='ember'){glow(q.x,q.y,5,'#ffae55',a*.8);g.fillStyle='rgba(255,226,170,'+a+')';g.fillRect(q.x-.6,q.y-.6,1.2+q.size*.3,1.2+q.size*.3);}
   else if(q.kind==='snow'){g.fillStyle='rgba(245,250,255,'+(a*.85)+')';g.beginPath();g.arc(q.x,q.y,q.size,0,7);g.fill();}
   else if(q.kind==='rain'){g.strokeStyle='rgba(190,220,240,'+(a*.35)+')';g.lineWidth=1;g.beginPath();g.moveTo(q.x,q.y);g.lineTo(q.x+q.vx*.03,q.y+q.vy*.03);g.stroke();}
   else if(q.kind==='leaf'){g.save();g.translate(q.x,q.y);g.rotate(time*1.5+q.seed);g.fillStyle='rgba(200,110,50,'+(a*.8)+')';g.beginPath();g.ellipse(0,0,q.size*1.6,q.size*.7,0,0,7);g.fill();g.restore();}
   else if(q.kind==='star'){g.strokeStyle='rgba(235,225,255,'+a+')';g.lineWidth=1.4;g.beginPath();g.moveTo(q.x,q.y);g.lineTo(q.x-q.vx*.12,q.y-q.vy*.12);g.stroke();glow(q.x,q.y,6,'#e6dcff',a);}
   else {const col=q.kind==='gold'?'#ffe2a0':q.kind==='pollen'?'#fff2b0':q.kind==='dust'?'#cdb8ff':q.kind==='ash'?'#bbb':'#d9edbb';glow(q.x,q.y,4,col,a*.45);}
  }g.restore();}
 let lightList=[];
 function lights(){return lightList;}
 function refreshLights(){const base=MoonLights.find(art).map(l=>({...l,r:l.warm?110:85,fire:false}));
  if(story.zone===0)base.push({x:CAMP.x,y:CAMP.y,r:210,color:'#ffb066',warm:true,fire:true,seed:1,v:999});
  lightList=base;}
 const white=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),gr=x.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,240,220,1)');gr.addColorStop(.4,'rgba(255,240,220,.7)');gr.addColorStop(1,'rgba(255,240,220,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);return c;})();
 function drawLighting(){
  const night=nightFactor(),strength=clamp(prof.dark*(.55+.45*night)*1.9,0,1);const Q=3,W=Math.ceil(view.w/Q),H=Math.ceil(view.h/Q);
  if(dark.width!==W||dark.height!==H){dark.width=W;dark.height=H;}
  const t=prof.tint,mix=i=>Math.round(255-(255-t[i])*strength);
  dctx.globalCompositeOperation='source-over';dctx.globalAlpha=1;dctx.fillStyle='rgb('+mix(0)+','+mix(1)+','+mix(2)+')';dctx.fillRect(0,0,W,H);
  dctx.globalCompositeOperation='lighter';
  const hole=(x,y,rad,a)=>{const sx=(x-camera.x)/Q,sy=(y-camera.y)/Q,rr=rad/Q;if(sx<-rr||sy<-rr||sx>W+rr||sy>H+rr)return;dctx.globalAlpha=a*strength;dctx.drawImage(white,sx-rr,sy-rr*.8,rr*2,rr*1.6);};
  hole(p.x,p.y-30,300,.75);
  for(const L of lightList){const fl=.85+.15*Math.sin(time*(L.fire?11:5)+L.seed*7)*Math.sin(time*3.1+L.seed);hole(L.x,L.y,L.r*fl*1.6,L.fire?1:.8);}
  for(const s of shots)hole(s.x,s.y,110,.7);
  for(const m of mobs)if(m.alive&&m.type==='wisp')hole(m.x,m.y-30,120,.6);
  for(const d of drops)hole(d.x,d.y,70,.6);
  dctx.globalAlpha=1;dctx.globalCompositeOperation='source-over';
  // Vignette baked into the same multiply layer (one full-screen blit).
  const vg=dctx.createRadialGradient(W/2,H*.48,Math.min(W,H)*.3,W/2,H/2,Math.hypot(W,H)*.6);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(6,8,20,.55)');dctx.fillStyle=vg;dctx.fillRect(0,0,W,H);
  g.save();g.setTransform(cinematic.dpr,0,0,cinematic.dpr,0,0);g.imageSmoothingEnabled=true;
  g.globalCompositeOperation='multiply';g.drawImage(dark,0,0,W,H,0,0,view.w,view.h);g.globalAlpha=1;
  g.globalCompositeOperation='lighter';
  for(const L of lightList){const sx=L.x-camera.x,sy=L.y-camera.y;if(sx<-200||sy<-200||sx>view.w+200||sy>view.h+200)continue;const fl=.8+.2*Math.sin(time*(L.fire?12:4)+L.seed*5);
   glowScreen(sx,sy,L.r*.55*fl,L.warm?prof.light:L.color,(.07+.09*night)*(L.fire?1.8:1));}
  g.restore();}
 function glowScreen(x,y,r,color,a){if(typeof glow==='function'){glow(x,y,r,color,a,.75);}}
 const fogBuf=document.createElement('canvas'),fctx=fogBuf.getContext('2d');
 function drawFog(){const a=prof.fogA;if(a<=0)return;const tex=fog(prof.fog),Q=4,W=Math.ceil(view.w/Q),H=Math.ceil(view.h/Q);if(fogBuf.width!==W||fogBuf.height!==H){fogBuf.width=W;fogBuf.height=H;}
  fctx.clearRect(0,0,W,H);
  for(const [par,spd,alpha,scale] of [[.6,6,a,1.6],[1.25,14,a*.7,2.2]]){const sz=512*scale/Q,ox=-(((camera.x*par+time*spd)/Q)%sz+sz)%sz,oy=-(((camera.y*par+time*spd*.3)/Q)%sz+sz)%sz;fctx.globalAlpha=alpha;
   for(let x=ox;x<W;x+=sz)for(let y=oy;y<H;y+=sz)fctx.drawImage(tex,x,y,sz,sz);}
  g.save();g.setTransform(cinematic.dpr,0,0,cinematic.dpr,0,0);g.imageSmoothingEnabled=true;g.drawImage(fogBuf,0,0,W,H,0,0,view.w,view.h);g.restore();}
 function drawCanopy(){if(!prof.canopy)return;const tex=canopy(prof.canopy);g.save();g.setTransform(cinematic.dpr,0,0,cinematic.dpr,0,0);g.globalAlpha=.92;
  const par=1.35,sway=Math.sin(time*.7)*4;const ox=-((camera.x*(par-1))%900+900)%900;
  const hgt=Math.min(150,view.h*.2),bottom=view.h+hgt*.35+(camera.y-(WORLD.h-view.h))*.25*(par-1);
  for(let x=ox-900;x<view.w;x+=900)g.drawImage(tex,x+sway,bottom-hgt,900,hgt*1.3);
  g.restore();}
 function drawText(){g.save();g.setTransform(cinematic.dpr,0,0,cinematic.dpr,-camera.x*cinematic.dpr,-camera.y*cinematic.dpr);g.textAlign='center';g.lineJoin='round';
  // mockup style: big orange outlined numbers, crits as a yellow "146!" with a callout line, word pops in gold
  for(const t of texts){const mx=t.max||1.2,age=mx-t.life,str=String(t.s),src=t.src||'',crit=str.startsWith('✦'),hurtN=/^[−-]\d/.test(str),num=/^(✦\s*)?[+−-]?\d+$/.test(str.trim());
   // Oozevale juice (juice.md §7): source-tagged numbers. src: ''|'pet'|'jelly'|'dot'|'heal'|'word' (set by oozevale-juice.js)
   const small=src==='pet'||src==='jelly'||src==='dot'||src==='heal'||(src==='word'&&!num);
   const base=src==='pet'?17:src==='jelly'?14:src==='dot'?15:src==='heal'?18:src==='word'?14:num?(crit?32:hurtN?20:23):14;
   const popT=crit?.14:.08,pop=small?(src==='dot'?1:age<.1?.7+.3*MoonMotion.ease.out(age/.1):1)*(1+(t.merge||0)*.12*Math.max(0,1-(age-(t.mergeAt||0))*4)):age<popT?(crit?1.6-.6*MoonMotion.ease.out(age/popT):.5+.7*MoonMotion.ease.back(age/popT)):1;
   const size=Math.round(base*pop),riseMax=src==='pet'?18:src==='jelly'?14:src==='dot'?10:src==='heal'?30:crit?34:hurtN?-10:26,rise=riseMax*MoonMotion.ease.out(Math.min(1,age/.4));
   g.globalAlpha=clamp(t.life/.3,0,1);const lane=t.lane||0,shk=hurtN&&age<.12?Math.sin(age*160)*2:0;
   const y=t.y-28-rise-lane*14,x=t.x+(src==='pet'?10+12*Math.min(1,age/.6):0)+(lane%2?10:0)*(lane%4===3?-1:1)+shk+(num&&!hurtN&&!src?((t.x*7)%13-6):0);
   let s=crit?str.replace(/^✦\s*/,'')+'!':str;if(src==='word')s=s.toUpperCase();
   g.save();if(crit){g.translate(x,y);g.rotate((t.tilt||0));g.translate(-x,-y);}
   g.font=(src==='dot'?'italic 800 ':num?'900 ':'italic 800 ')+size+'px "MV Fira","Trebuchet MS",system-ui,sans-serif';
   if(src==='word'&&'letterSpacing' in g)g.letterSpacing='1px';
   g.lineWidth=src==='jelly'||src==='dot'?2.5:small?3:crit?5:Math.max(3,size*.2);g.strokeStyle='rgba(20,8,4,.95)';
   if(crit){g.shadowColor='rgba(255,210,87,.9)';g.shadowBlur=4;}g.strokeText(s,x,y);g.shadowBlur=0;
   let fill;if(src&&src!=='word'&&src!=='heal'&&t.color)fill=t.color;else if(src==='heal')fill='#9cebbb';else if(src==='word')fill=t.color||'#ffd36b';else if(hurtN)fill='#ff5a52';
   else if(crit){const gr=g.createLinearGradient(0,y-size*.8,0,y);gr.addColorStop(0,'#fff6c0');gr.addColorStop(1,'#ffd84a');fill=gr;}
   else if(num){const gr=g.createLinearGradient(0,y-size*.8,0,y);gr.addColorStop(0,'#ffd27a');gr.addColorStop(1,'#ff7a1e');fill=gr;}else fill='#ffd36b';
   g.fillStyle=fill;g.fillText(s,x,y);
   if(crit){g.globalCompositeOperation='lighter';g.globalAlpha*=.3;g.fillStyle='#ffd84a';g.fillText(s,x,y);g.globalCompositeOperation='source-over';}
   if('letterSpacing' in g)g.letterSpacing='0px';g.restore();}
  g.restore();}
 function drawVignette(){if(fade<=0)return;g.save();g.setTransform(cinematic.dpr,0,0,cinematic.dpr,0,0);
  if(fade>0){g.globalAlpha=Math.min(1,fade);g.fillStyle='#04060c';g.fillRect(0,0,view.w,view.h);}g.restore();}
 function onZone(){prof=MoonZones.profile(story.zone);parts.length=0;fade=1;refreshLights();banner();MoonSound.zone(prof);}
 function banner(){const b=$('zoneBanner');if(!b)return;const z=zones[story.zone]||{};b.querySelector('b').textContent=z.name||'';b.querySelector('small').textContent=z.sub||'';b.classList.remove('show');void b.offsetWidth;b.classList.add('show');}
 let lastArt=null;
 let slow=0,lite=false;const forceHQ=/[?&]hq\b/.test(location.search);
 function frame(){const now=performance.now(),rawDt=(now-lastT)/1000,dt=Math.min(.05,rawDt);lastT=now;
  // Auto quality: if frames stay slow for ~2s, drop the fog layer (the costliest pass).
  if(!forceHQ&&!lite&&rawDt<.5){slow=rawDt>1/46?slow+rawDt:Math.max(0,slow-rawDt*.5);if(slow>2)lite=true;}
  if(typeof story==='undefined')return;
  if(zone!==story.zone){zone=story.zone;onZone();}
  if(lastArt!==art){lastArt=art;refreshLights();}
  if(fade>0)fade-=dt*1.6;
  if(!isPaused())step(dt);
  g.save();g.setTransform(cinematic.dpr,0,0,cinematic.dpr,-camera.x*cinematic.dpr,-camera.y*cinematic.dpr);
  MoonMotion.drawCorpses();g.restore();
  const off=globalThis.MV_OFF||{};if(!off.fog&&!lite&&cinematic.quality!=='low')drawFog();if(!off.light)drawLighting();
  g.save();g.setTransform(cinematic.dpr,0,0,cinematic.dpr,-camera.x*cinematic.dpr,-camera.y*cinematic.dpr);if(!off.parts)drawParts();g.restore();
  if(!off.canopy)drawCanopy();drawText();if(!off.vig)drawVignette();
  const clk=$('moonClock');if(clk)clk.textContent=clockText()+(nightFactor()>.5?' ☾':' ☀');}
 return {get lite(){return lite;},frame,clockText,nightFactor,lights,profile:()=>prof,spawnEmber};})();

// ---------- Ambient sound (Web Audio, routed through the game's effects bus) -------------
const MoonSound=(()=>{let ctx=null,src=null,filt=null,gain=null,want=null,chirpT=0;
 function ensure(){if(ctx||typeof audio==='undefined'||!audio||typeof soundBus==='undefined'||!soundBus)return !!ctx;ctx=audio;
  const len=ctx.sampleRate*2,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);let last=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;last=(last+.02*w)/1.02;d[i]=last*3.5;}
  src=ctx.createBufferSource();src.buffer=buf;src.loop=true;filt=ctx.createBiquadFilter();filt.type='bandpass';filt.Q.value=.7;gain=ctx.createGain();gain.gain.value=0;src.connect(filt);filt.connect(gain);gain.connect(soundBus);src.start();return true;}
 function zone(prof){want=prof.sound;apply();}
 function apply(){if(!ensure()||!want)return;filt.frequency.setTargetAtTime(want.freq,ctx.currentTime,.5);gain.gain.setTargetAtTime(want.gain*(typeof soundOn==='undefined'||soundOn?1:0),ctx.currentTime,1);}
 function chirp(){if(!ctx||!want)return;const o=ctx.createOscillator(),gn=ctx.createGain(),t=ctx.currentTime;const f=want.type==='marsh'?180+Math.random()*80:4200+Math.random()*600;o.type=want.type==='marsh'?'square':'sine';o.frequency.value=f;
  gn.gain.value=0;const n=want.type==='marsh'?2:3;for(let i=0;i<n;i++){gn.gain.setValueAtTime(0,t+i*.07);gn.gain.linearRampToValueAtTime(want.type==='marsh'?.012:.006,t+i*.07+.015);gn.gain.linearRampToValueAtTime(0,t+i*.07+.05);}
  o.connect(gn);gn.connect(soundBus);o.start(t);o.stop(t+.3);}
 setInterval(()=>{if(!want)return;if(!ctx){ensure();apply();}if(!ctx||typeof started==='undefined'||!started)return;apply();
  if(['night','marsh'].includes(want.type)&&MoonAtmos.nightFactor()>.5&&Math.random()<.35)chirp();},900);
 return {zone};})();

// ---------- Install the world pass after the whole draw chain ---------------------------
{const before=draw;draw=function(){before();MoonAtmos.frame();};}

// ---------- Crisp canvas: backing store = CSS size x devicePixelRatio --------------------
{const before=resize;resize=function(){before();const r=canvas.getBoundingClientRect();
  // portrait phones: zoom the world in (~1.21x vs the old 1.05 scale) so characters read larger; proportions unchanged
  {const f=document.getElementById('field')?.getBoundingClientRect();if(f&&f.width<680&&f.height>f.width*1.15){view.w=Math.round(f.width/1.27);view.h=Math.round(f.height/1.27);}}
  const dprCap=cinematic.quality==='low'?1:2,css=Math.max(1,r.width/view.w);cinematic.dpr=Math.min(3,Math.min(window.devicePixelRatio||1,dprCap)*css);
  canvas.width=Math.round(view.w*cinematic.dpr);canvas.height=Math.round(view.h*cinematic.dpr);};
 window.removeEventListener('resize',before);window.addEventListener('resize',resize);resize();}

// ---------- World art with edge extension (for camera overscroll on phones) -------------------
globalThis.mvWorldArt=function(img){const W=WORLD.w,H=WORLD.h;g.drawImage(img,0,0,W,H);
 if(!(view.h>view.w*1.15))return;const nw=img.naturalWidth,nh=img.naturalHeight,sx=nw/W,sy=nh/H,E=Math.min(460,H*.4),EX=Math.min(300,W*.3);
 const vis=(x0,y0,x1,y1)=>x1>camera.x&&x0<camera.x+view.w&&y1>camera.y&&y0<camera.y+view.h;
 g.save();
 if(vis(0,H,W,H+E)){g.save();g.translate(0,2*H);g.scale(1,-1);g.drawImage(img,0,(H-E)*sy,nw,E*sy,0,H-E,W,E);g.restore();}
 if(vis(0,-E,W,0)){g.save();g.scale(1,-1);g.drawImage(img,0,0,nw,E*sy,0,0,W,E);g.restore();}
 if(vis(-EX,-E,0,H+E)){g.save();g.scale(-1,1);g.drawImage(img,0,0,EX*sx,nh,0,0,EX,H);g.restore();}
 if(vis(W,-E,W+EX,H+E)){g.save();g.translate(2*W,0);g.scale(-1,1);g.drawImage(img,(W-EX)*sx,0,EX*sx,nh,W-EX,0,EX,H);g.restore();}
 // darken + soften the mirrored strips so the real map edge still reads as an edge
 const fade=(x0,y0,x1,y1,gx0,gy0,gx1,gy1)=>{const gr=g.createLinearGradient(gx0,gy0,gx1,gy1);gr.addColorStop(0,'rgba(4,6,10,.25)');gr.addColorStop(1,'rgba(4,6,10,.88)');g.fillStyle=gr;g.fillRect(x0,y0,x1-x0,y1-y0);};
 fade(0,H,W,H+E,0,H,0,H+E*.8);fade(0,-E,W,0,0,0,0,-E*.8);fade(-EX,-E,0,H+E,0,0,-EX*.8,0);fade(W,-E,W+EX,H+E,W,0,W+EX*.8,0);
 g.fillStyle='rgba(4,6,10,.9)';for(const [x,y] of [[-EX,-E],[W,-E],[-EX,H],[W,H]])g.fillRect(x,y,EX,E);
 g.restore();};
