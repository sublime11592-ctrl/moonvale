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
