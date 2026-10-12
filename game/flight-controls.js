let nextAction=null,inputGeneration=0;
function actionLabel(action){return action.type==='seat'?'seat '+seats[action.index].button.querySelector('small').textContent:action.type==='stock'?action.item:action.type==='galley'?'galley':'move'}
function clearNextAction(){nextAction=null;seats.forEach(s=>s.button.classList.remove('next-stop'));renderOrders()}
function resetControls(){inputGeneration++;clearNextAction()}
async function requestAction(action){
 if(!running)return false;
 if(action.type==='seat'&&(!seats[action.index]||seats[action.index].row>=cabinRows))return false;
 if(busy&&!motion){nextAction=action;seats.forEach((s,i)=>s.button.classList.toggle('next-stop',action.type==='seat'&&action.index===i));renderOrders();tell('Next: '+actionLabel(action)+'. Tap another target to change it.');return false}
 const generation=++inputGeneration,id=flightId;
 nextAction=null;if(motion)stopWalking();clearNextAction();
 try{
  if(action.type==='seat')await serve(action.index);
  else if(action.type==='stock')await stockFromGalley(action.item);
  else if(action.type==='galley'){const arrived=await walk(-1);if(arrived&&running&&id===flightId){atGalley=true;updateTray();tell('Tap a supply to stock up, or Return items to free tray space.')}}
  else if(action.type==='move')await walkTo(action.x,action.y);
 }finally{if(generation===inputGeneration&&id===flightId&&running&&!busy){const pending=nextAction;clearNextAction();if(pending)await requestAction(pending)}}
 return true;
}
const ordersBeforeControls=renderOrders;
renderOrders=function(){ordersBeforeControls();if(nextAction){const button=document.createElement('button');button.className='order-chip next-action';button.textContent='Next: '+actionLabel(nextAction)+' ×';button.setAttribute('aria-label','Cancel next action');button.onclick=clearNextAction;orderBar.prepend(button)}};
const guidanceBeforeControls=updateServiceGuidance;
updateServiceGuidance=function(){guidanceBeforeControls();const need={};orders.forEach(index=>{const item=seats[index].request;if(item)need[item]=(need[item]||0)+1});document.querySelectorAll('[data-supply]').forEach(button=>{const item=button.dataset.supply,count=Math.max(0,(need[item]||0)-inventory[item]);let badge=button.querySelector('.supply-count');if(!badge){badge=document.createElement('span');badge.className='supply-count';button.appendChild(badge)}badge.hidden=count===0;badge.textContent=String(count);button.setAttribute('aria-label','Stock up on '+item+(count?', '+count+' needed for saved orders':''))})};
const renderBeforeControls=render;
render=function(){renderBeforeControls();seats.forEach(s=>{const bubble=s.button.querySelector('.request');if(bubble){const timer=document.createElement('span');timer.className='patience-label';timer.textContent=learningService()?'–':s.patience+'s';bubble.appendChild(timer)}})};
const pauseBeforeControls=pauseFlight;
pauseFlight=function(){resetControls();pauseBeforeControls()};pauseButton.onclick=pauseFlight;
const finishBeforeControls=finishFlight;
finishFlight=function(){resetControls();finishBeforeControls()};
const startBeforeControls=$('start').onclick;
$('start').onclick=()=>{if(running||busy)return;resetControls();shufflePassengers();startBeforeControls()};
window.addEventListener('resize',resetControls);
render();updateServiceGuidance();
