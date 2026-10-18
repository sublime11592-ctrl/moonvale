'use strict';
let campPreviewStart=performance.now(),campPreviewClass='',campPreviewPulse=0;
const campClassColors={warrior:'#ffd18b',mage:'#a0b9ff',ranger:'#bce09d',druid:'#c5a8ec'};
creatorPreview=function(){
 const c=$('creatorPreview');if(!c?.getContext)return;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
 const f=customFrame(creatorDraft,directions[creatorFace]);if(!f)return;
 const now=performance.now()/1000,reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const pulse=reduced?0:Math.max(0,1-(performance.now()-campPreviewPulse)/1400),bob=reduced?0:Math.sin(now*2)*1.8;
 const h=Math.min(c.height-65,290*(f.heightScale||1)),w=h*f.sw/f.sh,x=c.width/2,y=c.height-44+bob;
 ctx.save();ctx.fillStyle='#05111955';ctx.beginPath();ctx.ellipse(x,y+3,w*.4,9,0,0,Math.PI*2);ctx.fill();
 // A gentle idle sway keeps the selected hero alive without distorting their face.
 ctx.translate(x,y);ctx.rotate(reduced?0:Math.sin(now*1.3)*.008);ctx.drawImage(f.img,f.sx,f.sy,f.sw,f.sh,-w/2,-h,w,h);
 if(creatorStep===2){const color=campClassColors[selectedClass]||'#ffd18b';ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=3;
  if(selectedClass==='warrior'){ctx.save();ctx.translate(w*.32,-h*.32);ctx.rotate(-.25-Math.sin(pulse*Math.PI)*.9);ctx.fillStyle='#c8d8e0';ctx.fillRect(-3,-67,6,57);ctx.fillStyle='#d7a45e';ctx.fillRect(-12,-13,24,5);ctx.fillRect(-3,-9,6,19);ctx.restore();}
  else if(selectedClass==='ranger'){ctx.save();ctx.translate(-w*.35,-h*.4);ctx.beginPath();ctx.arc(0,0,30,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-30);ctx.lineTo(0,30);ctx.stroke();ctx.restore();}
  else{const orbX=-w*.35,orbY=-h*.4;ctx.globalAlpha=.8;ctx.shadowColor=color;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(orbX,orbY,7+pulse*4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
  if(pulse>0){ctx.globalAlpha=pulse*.8;for(let i=0;i<12;i++){const a=i*Math.PI/6+now,rad=18+(1-pulse)*60;ctx.beginPath();ctx.arc(Math.cos(a)*rad,-h*.45+Math.sin(a)*rad,2,0,Math.PI*2);ctx.fill();}}
 }
 ctx.restore();
};
const campChooseBefore=chooseClass;chooseClass=function(id){campPreviewPulse=performance.now();campChooseBefore(id);};
const campRenderBefore=renderCreator;renderCreator=function(){campRenderBefore();$('classDialog').classList.add('camp-creator');const stage=$('creator').querySelector('.creator-stage');if(stage&&creatorStep===2&&!$('creator').querySelector('#previewCalling')){const b=document.createElement('button');b.id='previewCalling';b.className='preview-calling';b.textContent='✦ Preview '+CLASSES[selectedClass].name;b.onclick=()=>{campPreviewPulse=performance.now();creatorPreview();};stage.appendChild(b);}creatorPreview();};
// One animation loop for the visible creator; it never rebuilds the controls.
function animateCampCreator(){if($('classDialog').open)creatorPreview();requestAnimationFrame(animateCampCreator);}requestAnimationFrame(animateCampCreator);
renderCreator();
