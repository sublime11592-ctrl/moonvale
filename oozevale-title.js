// Opening flow + title polish.
// Fresh: Begin Adventure -> creator -> "Enter Oozevale" -> in game (the prologue card is a banner, not a second button).
// Returning: Continue (primary) loads straight in. The first click still unlocks audio (game's own handlers).
(()=>{
 const $=id=>document.getElementById(id),T=$('titleScreen');
 // 1) no blocking prologue: close it as soon as it opens and show the chapter line as a fading banner
 const I=$('mvIntro');
 if(I){const show=I.showModal.bind(I);I.showModal=function(){
   const k=I.querySelector('.mv-kicker')?.textContent||'',h=I.querySelector('h2')?.textContent||'',l=I.querySelector('.mvi-l1')?.textContent||'';
   const b=document.createElement('div');b.id='ozPrologue';b.setAttribute('role','status');b.innerHTML='<small></small><b></b><p></p>';
   b.children[0].textContent=k;b.children[1].textContent=h;b.children[2].textContent=l;document.body.appendChild(b);
   setTimeout(()=>b.classList.add('out'),4200);setTimeout(()=>b.remove(),5200);
   try{MoonTitle.arrive();}catch(e){}
  };}
 // 2) returning players: Continue first and gold; "New hero" second
 const nb=$('newAdventure'),rb=$('resumeAdventure');
 const sync=()=>{if(!nb||!rb)return;const has=rb.offsetParent!==null&&!rb.hidden&&getComputedStyle(rb).display!=='none';
  rb.classList.toggle('mv-btn-gold',has);nb.classList.toggle('mv-btn-gold',!has);
  if(has){rb.textContent='Continue';nb.textContent='New hero';if(rb.parentNode&&rb.nextSibling!==nb&&rb.parentNode===nb.parentNode)nb.parentNode.insertBefore(rb,nb);}
  else nb.textContent='Begin Adventure';};
 if(T){new MutationObserver(sync).observe(T,{attributes:true,subtree:true,attributeFilter:['hidden','class','style','open']});sync();}
 // creator confirm label
 const cb=$('mvcBegin');if(cb&&/start|begin/i.test(cb.textContent))cb.textContent='Enter Oozevale';
 // 3) slime drip on the logo
 const logo=document.querySelector('.mvt-logo h1');
 if(logo&&!logo.querySelector('.oz-drip')){const d=document.createElement('span');d.className='oz-drips';d.setAttribute('aria-hidden','true');
  [[18,0,1],[34,1.6,.8],[52,.7,1.2],[67,2.4,.9],[81,1.1,1]].forEach(([x,dl,s])=>{const e=document.createElement('i');e.className='oz-drip';e.style.cssText=`left:${x}%;animation-delay:${dl}s;--s:${s}`;d.appendChild(e);});
  logo.appendChild(d);}
 // 4) leftover Moonvale wording in visible UI text
 const fix=root=>{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode())if(/Moonvale/.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(/Moonvale/g,'Oozevale');};
 fix(document.body);if(/Moonvale/.test(document.title))document.title=document.title.replace(/Moonvale/g,'Oozevale');
 globalThis.OozeTitle={sync};
})();
