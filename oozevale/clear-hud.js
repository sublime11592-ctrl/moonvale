'use strict';
const hudPreferences={questsOpen:false,statusOpen:false};
try{const saved=JSON.parse(window.localStorage?.getItem('moonvale-hud')||'null');if(saved){hudPreferences.questsOpen=saved.questsOpen===true;hudPreferences.statusOpen=saved.statusOpen===true;}}catch{}
function applyHudPreferences(){
 $('questTracker').classList.toggle('is-collapsed',!hudPreferences.questsOpen);
 $('questDetails').hidden=!hudPreferences.questsOpen;
 $('questToggle').setAttribute('aria-expanded',String(hudPreferences.questsOpen));
 $('playerFrame').classList.toggle('is-compact',!hudPreferences.statusOpen);
 $('statusToggle').setAttribute('aria-expanded',String(hudPreferences.statusOpen));
 $('statusToggle').setAttribute('aria-label',(hudPreferences.statusOpen?'Hide':'Show')+' character status details');
 try{window.localStorage?.setItem('moonvale-hud',JSON.stringify(hudPreferences));}catch{}
}
const narrowHud=()=>window.matchMedia?.('(max-width:680px)')?.matches===true;
$('questToggle').onclick=()=>{hudPreferences.questsOpen=!hudPreferences.questsOpen;if(hudPreferences.questsOpen&&narrowHud())hudPreferences.statusOpen=false;applyHudPreferences();};
$('statusToggle').onclick=()=>{hudPreferences.statusOpen=!hudPreferences.statusOpen;if(hudPreferences.statusOpen&&narrowHud())hudPreferences.questsOpen=false;applyHudPreferences();};
$('trackerJournal').onclick=()=>openJournal();
let lastLogTime=-100;
const logBeforeClearHud=log;log=function(message){logBeforeClearHud(message);lastLogTime=time;$('combatLog').style.opacity='1';};
const hudBeforeClear=hud;hud=function(){
 hudBeforeClear();
 $('targetFrame').hidden=true;
 const ready=questLog.ready.size,count=questLog.accepted.size;
 $('questBadge').textContent=ready?'? '+ready:String(count);
 $('questTracker').classList.toggle('has-ready',ready>0);
 $('questToggle').setAttribute('aria-label',(hudPreferences.questsOpen?'Collapse':'Expand')+' quests, '+count+' accepted'+(ready?', '+ready+' ready to turn in':''));
 $('playerName').textContent=heroName();
 $('statusToggle').title=heroName()+' · '+CLASSES[p.cls].name+' · '+Math.ceil(p.hp)+' health · '+Math.floor(p.mana)+' mana';
 $('playerFrame').classList.toggle('health-low',p.hp/p.maxHp<.3);
 $('combatLog').style.opacity=time-lastLogTime<6?'1':'0';
};
applyHudPreferences();hud();
