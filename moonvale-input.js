/* Moonvale input v2 (floating stick + point-based hit test + touch devices always show the stick); was v1 — hardened movement joystick (replaces game.js's pointer-only stick handlers).
   Why: the old stick used only pointer events + setPointerCapture, and released on ANY pointercancel /
   lostpointercapture without checking which pointer it was. On real phones the browser's own gestures
   (iOS long-press selection/callout, double-tap zoom — nothing on the page disabled them, touchstart was
   never prevented) cancel the pointer, so stickX/Y snapped to 0 and the hero never moved. Touches also
   landed on the HUD's decoration children (emblem/arrows/rim) instead of the stick.
   Now: native touch events (tracked by identifier, preventDefault on touchstart) on touch devices,
   pointer events for mouse/pen, window-level move/end, release only for the tracked contact,
   analog throw scaled to the stick size with a small dead zone. */
(()=>{
 const stick=document.getElementById('stick'),knob=document.getElementById('knob');if(!stick||!knob)return;
 stick.onpointerdown=stick.onpointermove=stick.onpointerup=stick.onpointercancel=stick.onlostpointercapture=null;
 const TOUCH='ontouchstart' in window||navigator.maxTouchPoints>0,DZ=.1;
 const J={id:null,kind:null,cx:0,cy:0,R:34};
 const field=document.getElementById('field')||stick.parentElement;
 function geom(){const r=stick.getBoundingClientRect();J.cx=r.left+r.width/2;J.cy=r.top+r.height/2;J.R=r.width>20?Math.max(22,r.width*.34):34;}
 function set(px,py){
  const dx=px-J.cx,dy=py-J.cy,d=Math.hypot(dx,dy);if(!d){stickX=stickY=0;knob.style.transform='';return;}
  const m=Math.min(d,J.R),n=m/J.R,a=n<DZ?0:(n-DZ)/(1-DZ),ux=dx/d,uy=dy/d;
  stickX=ux*a;stickY=uy*a;knob.style.transform='translate('+(ux*m).toFixed(1)+'px,'+(uy*m).toFixed(1)+'px)';
 }
 function end(){J.id=null;J.kind=null;J.float=false;stickX=stickY=0;stickId=null;knob.style.transform='';stick.classList.remove('mv-active','mv-floating');stick.style.translate='';}
 function begin(kind,id,x,y){geom();J.kind=kind;J.id=id;stickId=id;stick.classList.add('mv-active');set(x,y);}
 // floating stick: the base jumps under the thumb, so any touch on the left half of the field steers
 function beginFloat(id,x,y){stick.style.translate='';stick.classList.add('mv-floating');const r=stick.getBoundingClientRect();
  const ox=r.left+r.width/2,oy=r.top+r.height/2;stick.style.translate=(x-ox).toFixed(1)+'px '+(y-oy).toFixed(1)+'px';
  J.cx=x;J.cy=y;J.R=r.width>20?Math.max(22,r.width*.34):34;J.kind='touch';J.id=id;J.float=true;stickId=id;stick.classList.add('mv-active');set(x,y);}
 // game.js's keysClear()/blur/pause call the global release(): point it at the new state
 try{release=end;}catch(e){}
 // ---- touch path (phones/tablets) ----
 // Root-cause guard: decide from the touch POINT, not from which element iOS hit-tested. A document-level
 // capture listener sees every touch first, so a stray overlay above the stick (glow canvas, motes, toast,
 // HUD wrappers, a freshly-closed dialog's layer) can no longer swallow it.
 const INTERACTIVE='button,a,input,select,textarea,label,summary,[role=button],[contenteditable],dialog,.mv-map,.mv-portrait,.mv-quest,.mv-chat,.mv-nav,footer,#pauseOverlay';
 const busy=()=>{try{if(typeof started!=='undefined'&&!started)return true;if(typeof isPaused==='function'&&isPaused())return true;}catch(_){}return !!document.querySelector('dialog[open]');};
 function onStart(e){
  if(J.id!==null&&J.kind==='touch')return;const t=e.changedTouches[0];if(!t)return;
  const x=t.clientX,y=t.clientY,onStick=e.target===stick||stick.contains(e.target);
  if(!onStick&&busy())return;
  const r=stick.getBoundingClientRect(),pad=24,shown=r.width>0;
  const inStick=onStick||(shown&&x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad);
  const el=e.target&&e.target.closest?e.target:null;
  if(!onStick&&el&&el.closest(INTERACTIVE)&&!(inStick&&!el.closest('button,a,input,select,textarea,dialog')))return;
  if(inStick){if(e.cancelable)e.preventDefault();begin('touch',t.identifier,x,y);return;}
  const f=field.getBoundingClientRect();
  if(x>=f.left&&x<f.left+f.width/2&&y>=f.top&&y<=f.bottom){if(e.cancelable)e.preventDefault();beginFloat(t.identifier,x,y);}
 }
 document.addEventListener('touchstart',onStart,{capture:true,passive:false});
 stick.addEventListener('touchstart',e=>{if(e.cancelable)e.preventDefault();},{passive:false});
 // a touch device must always see the stick, whatever the viewport width (iPad, Pro Max landscape,
 // "Request Desktop Website" all report >=900px and the desktop HUD rule used to hide it)
 const markTouch=()=>document.body&&document.body.classList.add('mv-touch');
 if(TOUCH)markTouch();window.addEventListener('touchstart',markTouch,{once:true,passive:true,capture:true});
 const tmove=e=>{if(J.kind!=='touch')return;for(const t of e.changedTouches)if(t.identifier===J.id){if(e.cancelable)e.preventDefault();set(t.clientX,t.clientY);}};
 const tend=e=>{if(J.kind!=='touch')return;for(const t of e.changedTouches)if(t.identifier===J.id)end();};
 window.addEventListener('touchmove',tmove,{passive:false});
 window.addEventListener('touchend',tend);window.addEventListener('touchcancel',tend);
 // ---- pointer path (mouse/pen; touch pointers only if the browser has no touch events) ----
 stick.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&TOUCH)return;if(J.id!==null)return;e.preventDefault();try{stick.setPointerCapture(e.pointerId)}catch(_){}begin('pointer',e.pointerId,e.clientX,e.clientY);});
 window.addEventListener('pointermove',e=>{if(J.kind==='pointer'&&e.pointerId===J.id)set(e.clientX,e.clientY);});
 const pend=e=>{if(J.kind==='pointer'&&e.pointerId===J.id)end();};
 window.addEventListener('pointerup',pend);window.addEventListener('pointercancel',pend);
 stick.addEventListener('contextmenu',e=>e.preventDefault());
 // re-measure on layout changes while held (rotation, toolbar collapse)
 window.addEventListener('resize',()=>{if(J.id!==null)geom();});
 window.MoonInput={joystick:J,end,begin,beginFloat};
})();
