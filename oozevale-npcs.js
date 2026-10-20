// Oozevale NPC voices: each camp resident has a personality, and the starter chain gets short story beats.
(()=>{
 const VOICE={
  quartermaster:{who:'Tessa',lines:['Gloomfang pelts, moth dust, crab shells. Bring it all and I’ll make it worth the walk.','Potions are on the left. The right shelf is for heroes who pay.','I counted every jar twice. Then the slimes counted them too. Now there’s one less.']},
  chronicler:{who:'Vale',lines:['Every lantern that goes dark is a page torn out. Help me write them back.','The Elder Grove remembers you, little traveller. The wolves remember you too.','I write down what the wardstones dream. Lately it’s all teeth.']},
  caravan:{who:'Bran',lines:['Roads are open as far as your boots are brave. Pick a pin on the map.','Moonwater’s pretty until a heron sees your snacks. Mind the reeds.','My wagon has two speeds: slow, and running from bandits.']},
  wayfarer:{who:'Eryn',lines:['I’ve seen frost wolves hunt in threes. Never fight the middle one first.','Sing to the will-o’-wisps and they’ll stop leading you astray. Mostly.','Camp fires are the only honest light left in the vale.']}
 };
 const BEATS={0:['Vale','The lanterns are fading. Moondew blossoms might bring them back. Gather three.'],
  1:['Vale','The moondew shows a trail east. Scout Mira went that way and didn’t come back.'],
  2:['Mira','The wardstones went to sleep and the wolves came out. Wake them, and stand still while they glow.'],
  3:['Mira','The Elder Thornwarden is rooted across the lake road. It was a guardian once. Put it to rest.'],
  4:['Bran','The lake road’s open. Moonwater keeps its memories under the surface. Fish out three sigils.']};
 const said={};let lastStep=-1;
 const talk=(who,t)=>{if(typeof say==='function')say(who+': “'+t+'”');if(typeof log==='function')log(who+' · '+t);};
 {const before=interactStory;interactStory=function(){const o=typeof nearestInteraction==='function'?nearestInteraction():null;
  const id=o&&o.resident&&(typeof residents!=='undefined')?(residents.find(n=>n.x===o.x&&n.y===o.y)||{}).id:null;
  if(id&&VOICE[id]){const v=VOICE[id];said[id]=((said[id]??-1)+1)%v.lines.length;talk(v.who,v.lines[said[id]]);}
  return before.apply(this,arguments);};}
 {const before=update;update=function(dt){before(dt);if(typeof story==='undefined')return;
  if(story.step!==lastStep){const b=BEATS[story.step];if(b&&lastStep>=0)talk(b[0],b[1]);lastStep=story.step;}};}
 globalThis.OozeNpcs={VOICE,BEATS};
})();
// Vale travels with the story. Away from the Elder Grove the camp folk are hidden (moonvale-hud.js) and the
// quest point became an invisible "lantern board", so story chapters that open in Moonwater Reach / Hollow
// Sanctum had no giver at all. Vale now stands at that zone's camp quest point whenever a story quest is
// waiting there (or to turn in), with a '!' marker, minimap point and a tracker line saying where she is.
(()=>{
 if(typeof residents==='undefined'||typeof questGiver!=='function')return;
 const vale=()=>residents.find(n=>n.id==='chronicler');
 const away=()=>story.zone!==0||!!(zones[0]&&zones[0].frontier);
 const valeHere=()=>{if(!away())return false;try{const r=qg0();return !!(r&&(r.board||/^Vale/.test(r.label||'')));}catch(e){return false;}};
 const qg0=questGiver;questGiver=function(q){const qg=qg0;const r=qg.apply(this,arguments);
  if(r&&r.board&&(q==null||q.opening!==undefined||q.zone===story.zone)&&valeHere()){r.label='Vale · Quest giver';r.board=false;r.vale=true;}return r;};
 const qd=questDestination;questDestination=function(){const r=qd.apply(this,arguments);
  if(r&&/^Pick up a quest from Vale/.test(r.label||'')){const g=questGiver();if(g&&g.vale){r.x=g.x;r.y=g.y;r.label='Talk to Vale · by the camp in '+zones[story.zone].name;r.glyph='!';}
   else if(!away())r.label='Talk to Vale · by the camp fire';
   else if(g&&g.label&&!/^Vale|board/i.test(g.label)){const nm=g.label.split(' · ')[0];r.x=g.x;r.y=g.y;r.label='Talk to '+nm+' · quest giver in '+zones[story.zone].name;r.glyph='!';}}
  return r;};
 questDestination.__raw=qd;
 const op=objectivePoints;objectivePoints=function(){const pts=op.apply(this,arguments);
  if(valeHere()){const g=questGiver();if(g&&g.vale&&!pts.some(o=>/^Vale/.test(o.label||'')))pts.push({x:g.x,y:g.y,label:'Vale · Quest giver',glyph:'!',resident:'journal',vale:true});}
  return pts;};
 {const before=update;update=function(dt){before(dt);try{const v=vale();if(!v)return;
   if(valeHere()){const g=questGiver();if(g&&g.vale){v.x=g.x;v.y=g.y;}}}catch(e){}};}
 // E near the travelling Vale opens the quest journal (same as at home)
 {const before=interactStory;interactStory=function(){const o=typeof nearestInteraction==='function'?nearestInteraction():null;
  if(o&&(o.vale||o.resident==="journal"&&/^Vale/.test(o.label||"")&&away())){openJournal();return true;}return before.apply(this,arguments);};}
 globalThis.OozeVale={valeHere};
})();
// Overhead quest markers: a bobbing gold "!" (quest available) or "?" (ready to turn in) over quest givers.
(()=>{
 if(typeof draw!=='function')return;
 const before=draw;
 draw=function(){before.apply(this,arguments);if(typeof started!=='undefined'&&!started)return;g.save();try{g.setTransform(cinematic.dpr,0,0,cinematic.dpr,-camera.x*cinematic.dpr,-camera.y*cinematic.dpr);
  const pts=objectivePoints().filter(o=>(o.glyph==='!'||o.glyph==='?')&&(o.resident==='journal'||o.vale||o.hub!==undefined||/Quest giver|Available quests|Turn in/.test(o.label||'')));
  const seen=new Set();
  for(const o of pts){let x=o.x,y=o.y;if(/^Vale/.test(o.label||'')){const v=residents.find(n=>n.id==='chronicler');if(v&&v.x>-9000){x=v.x;y=v.y;}}
   const k=Math.round(x/40)+','+Math.round(y/40);if(seen.has(k))continue;seen.add(k);
   const t=performance.now()/1000,by=y-172+Math.sin(t*3.2)*4;
   g.save();g.font='900 34px "MV Cinzel",Georgia,serif';g.textAlign='center';g.textBaseline='middle';
   g.shadowColor=o.glyph==='?'?'#7ff0ff':'#ffd36a';g.shadowBlur=14;g.lineWidth=5;g.strokeStyle='#1a1206';g.strokeText(o.glyph,x,by);
   g.fillStyle=o.glyph==='?'?'#bff8ff':'#ffd85a';g.fillText(o.glyph,x,by);g.restore();}
 }catch(e){}g.restore();};
})();
