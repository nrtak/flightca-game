// Versioned, local-only flight recovery. No network is needed to play or save.
const flightSaveKey='cabin-crew-flight-v1';
let pausedFlight=false;
const pauseButton=document.createElement('button');
pauseButton.textContent='Pause';pauseButton.className='pause-flight';
pauseButton.setAttribute('aria-label','Pause and save flight');
document.querySelector('main').appendChild(pauseButton);
const pauseScreen=document.createElement('div');
pauseScreen.className='flight-pause';pauseScreen.hidden=true;
pauseScreen.innerHTML='<div class="welcome-card" role="dialog" aria-modal="true" aria-labelledby="pause-title"><h1 id="pause-title">Flight paused</h1><p id="pause-status"></p><button class="primary" id="resume-flight">Resume flight</button></div>';
document.querySelector('main').appendChild(pauseScreen);
const saveStyle=document.createElement('style');
saveStyle.textContent='.pause-flight{display:none;position:absolute;right:18px;top:96px;z-index:6;border:2px solid #91a6aa;border-radius:8px;background:#fffdf1;padding:8px;color:#435657}.playing .pause-flight{display:block}.flight-pause{position:absolute;inset:0;z-index:20;background:#263d4088;display:flex;align-items:center;justify-content:center}.flight-pause[hidden]{display:none}';
document.head.appendChild(saveStyle);
function flightSnapshot(){return {version:1,routeIndex,inventory:{...inventory},score,served,missed,remaining,ticks,selected,attendantChoice,orders:[...orders],atGalley,cabinRows,familyState:familyService.snapshot(),seats:seats.map(s=>({request:s.request,patience:s.patience,queued:Boolean(s.queued)}))}}
function saveFlight(){
 if(!running&&!pausedFlight)return false;
 try{gameStorage.setItem(flightSaveKey,JSON.stringify(flightSnapshot()));return true}
 catch{saveAvailable=false;return false}
}
function clearFlightSave(){try{gameStorage.removeItem(flightSaveKey)}catch{saveAvailable=false}}
function validFlight(s){
 const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
 return s&&s.version===1&&Array.isArray(s.seats)&&(s.cabinRows===undefined||s.cabinRows===4||s.cabinRows===5)&&(s.cabinRows!==4||s.seats?.slice(16).every(p=>!p.request&&!p.queued))&&integer(s.routeIndex,0,2)&&integer(s.remaining,1,120)&&integer(s.ticks,0,120)&&s.ticks+s.remaining===120&&
 ['score','served','missed'].every(k=>integer(s[k],0,100000))&&Object.hasOwn(icons,s.selected)&&integer(s.attendantChoice,0,1)&&typeof s.atGalley==='boolean'&&
 s.inventory&&Object.keys(s.inventory).length===6&&Object.keys(icons).every(k=>integer(s.inventory[k],0,6))&&Object.values(s.inventory).reduce((a,b)=>a+b,0)<=6&&
 Array.isArray(s.seats)&&s.seats.length===seats.length&&s.seats.every(p=>p&&(p.request===null||Object.hasOwn(icons,p.request))&&integer(p.patience,0,45)&&(!p.request||p.patience>0)&&typeof p.queued==='boolean')&&
 Array.isArray(s.orders)&&s.orders.length<=6&&new Set(s.orders).size===s.orders.length&&s.orders.every(i=>integer(i,0,seats.length-1)&&s.seats[i].queued&&s.seats[i].request)&&s.seats.every((p,i)=>!p.queued||s.orders.includes(i))&&(s.familyState===undefined||familyService.valid(s.familyState,s.seats));
}
function showPause(message){pauseScreen.hidden=false;$('pause-status').textContent=message;$('resume-flight').focus()}
function pauseFlight(){
 if(!running)return;
 clearInterval(timer);running=false;pausedFlight=true;flightId++;
 preparing=false;stopWalking();clearPassengerDialogue();
 const saved=saveFlight();
 showPause(saved?'Saved on this browser. Your passengers and landing timer will wait.':'Your flight is paused here. Browser storage is unavailable; keep this page open.');
}
function resumeFlight(){
 if(!pausedFlight)return;
 pausedFlight=false;running=true;pauseScreen.hidden=true;
 document.body.classList.add('playing');updateTray();render();beginFlightClock();pauseButton.focus();
}
pauseButton.onclick=pauseFlight;$('resume-flight').onclick=resumeFlight;
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseFlight()});
window.addEventListener('pagehide',()=>{if(running)pauseFlight()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(running)pauseFlight();else if(pausedFlight)resumeFlight()}});
// Persist completed service/preparation immediately, as well as each clock tick.
const originalUpdateTray=updateTray;
updateTray=function(){originalUpdateTray();if(running)saveFlight()};
try{
 const saved=JSON.parse(gameStorage.getItem(flightSaveKey));
 if(validFlight(saved)){
  routeIndex=saved.routeIndex;inventory={...saved.inventory};score=saved.score;served=saved.served;missed=saved.missed;remaining=saved.remaining;ticks=saved.ticks;selected=saved.selected;attendantChoice=saved.attendantChoice;orders=[...saved.orders];atGalley=saved.atGalley;
  seats.forEach((seat,i)=>Object.assign(seat,saved.seats[i]));familyService.restore(saved.familyState,seats);setCabinRows(saved.cabinRows??5);
  if(typeof selectAttendant==='function')selectAttendant(attendantChoice);showCareer();
  document.querySelector('.welcome-card p').textContent=routes[routeIndex].from+' → '+routes[routeIndex].to;
  crew.style.left=(cabin.clientWidth/2-17)+'px';crew.style.top='114px';
  // Return the attendant to the aisle; prepared tray items are kept.
  atGalley=false;pausedFlight=true;document.body.classList.add('playing');updateCrewSprite();updateTray();render();
  showPause('Saved flight: '+routes[routeIndex].from+' → '+routes[routeIndex].to+'. Resume with your tray and orders intact.');
 }else if(saved!==null)clearFlightSave();
}catch{saveAvailable=false}
