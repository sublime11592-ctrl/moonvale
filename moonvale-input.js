/* Moonvale input v1 — hardened movement joystick (replaces game.js's pointer-only stick handlers).
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
 function geom(){const r=stick.getBoundingClientRect();J.cx=r.left+r.width/2;J.cy=r.top+r.height/2;J.R=Math.max(22,r.width*.34);}
 function set(px,py){
  const dx=px-J.cx,dy=py-J.cy,d=Math.hypot(dx,dy);if(!d){stickX=stickY=0;knob.style.transform='';return;}
  const m=Math.min(d,J.R),n=m/J.R,a=n<DZ?0:(n-DZ)/(1-DZ),ux=dx/d,uy=dy/d;
  stickX=ux*a;stickY=uy*a;knob.style.transform='translate('+(ux*m).toFixed(1)+'px,'+(uy*m).toFixed(1)+'px)';
 }
 function end(){J.id=null;J.kind=null;stickX=stickY=0;stickId=null;knob.style.transform='';stick.classList.remove('mv-active');}
 function begin(kind,id,x,y){geom();J.kind=kind;J.id=id;stickId=id;stick.classList.add('mv-active');set(x,y);}
 // game.js's keysClear()/blur/pause call the global release(): point it at the new state
 try{release=end;}catch(e){}
 // ---- touch path (phones/tablets) ----
 stick.addEventListener('touchstart',e=>{e.preventDefault();if(J.id!==null&&J.kind==='touch')return;const t=e.changedTouches[0];if(t)begin('touch',t.identifier,t.clientX,t.clientY);},{passive:false});
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
 window.MoonInput={joystick:J,end};
})();
