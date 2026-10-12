const comfortKey='cabin-crew-comfort-v1';
let comfort={sound:false,haptics:false},returnMode=false,audioContext;
try{const saved=JSON.parse(gameStorage.getItem(comfortKey));if(saved)comfort={sound:saved.sound===true,haptics:saved.haptics===true}}catch{}
function feedback(kind){
 if(comfort.haptics)try{window.webkit?.messageHandlers?.cabinFeedback?.postMessage({kind})}catch{}
 if(!comfort.sound)return;
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audioContext??=new Audio();audioContext.resume().catch(()=>{});const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;oscillator.type='sine';oscillator.frequency.setValueAtTime(kind==='serve'?660:440,now);gain.gain.setValueAtTime(.045,now);gain.gain.exponentialRampToValueAtTime(.001,now+.12);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(now);oscillator.stop(now+.13)}catch{}
}
const returnButton=document.createElement('button');returnButton.className='return-items';returnButton.textContent='Return items';returnButton.setAttribute('aria-pressed','false');document.querySelector('.tray-head').appendChild(returnButton);
returnButton.onclick=()=>{if(!running||busy||!atGalley)return;returnMode=!returnMode;updateTray();tell(returnMode?'Tap a tray item to return one. Tap Done when finished.':'Tap a supply to prepare it.')};
function returnItem(item){if(!running||busy||!atGalley||!Object.hasOwn(inventory,item))return false;if(!inventory[item]){tell('No '+item+' to return.');return false}inventory[item]--;updateTray();tell('Returned one '+item+'. Space available: '+(6-stock)+'.');feedback('stock');return true}
const trayBeforeComfort=updateTray;
updateTray=function(){if(!atGalley)returnMode=false;trayBeforeComfort();returnButton.hidden=!atGalley;returnButton.disabled=busy;returnButton.textContent=returnMode?'Done':'Return items';returnButton.setAttribute('aria-pressed',String(returnMode));document.body.classList.toggle('returning-items',returnMode);if(returnMode){document.querySelector('.tray-head h2').textContent='RETURN TO GALLEY';document.querySelectorAll('[data-drink]').forEach(b=>b.setAttribute('aria-label','Return '+b.dataset.drink+', '+inventory[b.dataset.drink]+' on tray'))}};
document.querySelectorAll('[data-drink]').forEach(button=>{const stockOrSelect=button.onclick;button.onclick=()=>{if(returnMode){returnItem(button.dataset.drink);return}stockOrSelect()}});
const prepareBeforeComfort=prepareDrink;
prepareDrink=async function(item){if(!busy)returnMode=false;const before=inventory[item],id=flightId;await prepareBeforeComfort(item);if(id===flightId&&inventory[item]>before)feedback('stock')};
const serveBeforeComfort=serve;
serve=async function(index){const before=served,id=flightId;await serveBeforeComfort(index);if(id===flightId&&served>before)feedback('serve')};
function starProgress(){const total=served+missed+seats.filter(s=>s.request).length,rate=total?served/total:0;return {total,rate,stars:served>=14&&rate>=.85?3:served>=8&&rate>=.65?2:served>0?1:0}}
const renderBeforeComfort=render;
render=function(){renderBeforeComfort();seats.forEach(s=>s.button.classList.toggle('requesting',Boolean(s.request)));if(running&&!learningService()&&orders.length===0){const goal=document.createElement('span'),p=starProgress();goal.className='flight-hint star-goal';goal.textContent=p.stars===3?'★★★ Keep serving to hold three stars!':p.stars>=2?'★★★ Goal: '+served+'/14 served · '+Math.round(p.rate*100)+'% fulfilled (85% needed)':'★★ Goal: '+served+'/8 served · '+Math.round(p.rate*100)+'% fulfilled (65% needed)';orderBar.appendChild(goal)}};
const finishBeforeComfort=finishFlight;
finishFlight=function(){const p=starProgress();finishBeforeComfort();document.querySelector('.welcome-card h1').textContent='Flight complete';attendantPicker.hidden=true;const detail=document.createElement('p');detail.className='landing-detail';detail.textContent=Math.round(p.rate*100)+'% of requests fulfilled · '+(familyService.bonuses*25)+' family bonus points included';const next=document.createElement('p');next.className='landing-next';next.textContent=routeIndex<2?(career.best[routeIndex]>=2?'Next destination available: '+routes[routeIndex+1].to:('Next route: serve at least 8 passengers and fulfill 65% of requests.')):'All US routes unlocked. Try for three stars!';$('summary').append(detail,next)};
const startBeforeComfort=$('start').onclick;
$('start').onclick=()=>{returnMode=false;startBeforeComfort();document.querySelector('.welcome-card h1').textContent='Choose your avatar';attendantPicker.hidden=false};
const comfortPanel=document.createElement('div');comfortPanel.className='comfort-settings';pauseScreen.querySelector('.welcome-card').appendChild(comfortPanel);
['sound','haptics'].forEach(key=>{const button=document.createElement('button');const refresh=()=>{button.textContent=(key==='sound'?'Sound':'Haptics')+': '+(comfort[key]?'On':'Off');button.setAttribute('aria-pressed',String(comfort[key]))};refresh();button.onclick=()=>{comfort[key]=!comfort[key];refresh();try{gameStorage.setItem(comfortKey,JSON.stringify(comfort))}catch{}if(comfort[key])feedback('stock')};comfortPanel.appendChild(button)});
updateTray();render();
