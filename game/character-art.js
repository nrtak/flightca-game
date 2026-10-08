// Front-facing seated atlas: 4 columns, 2 rows (six adults, two children).
// Walking atlas: four directions, two frames for each attendant.
const characterMoods=['neutral','happy','very-happy','sad','mad','very-mad'];
const passengerNames=['Alex','Marion','Lena','Noah','Isaac','Sam'];
let attendantChoice=1,crewDirection='down',crewAction='idle';
function passengerIdentity(index){return index===5?6:index===15?7:index===4?3:index===14?2:index%6}
function setPassengerPortrait(element,identity,mood='neutral'){
 element.style.backgroundPosition=(identity%4*100/3)+'% '+(Math.floor(identity/4)*100)+'%';
 element.setAttribute('aria-label',(identity>=6?'Child':'Passenger')+', '+mood.replaceAll('-',' '));
 element.setAttribute('data-mood',mood);
}
function updateCrewSprite(dx=0,dy=0,now=0){
 if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>1)crewDirection=dx<0?'left':'right';
 else if(Math.abs(dy)>1)crewDirection=dy<0?'up':'down';
 const column={down:0,up:1,left:2,right:3}[crewDirection];
 const phase=crew.classList.contains('walking')?Math.floor(now/180)%2:0;
 const sprite=crew.querySelector('.crew-sprite');
 if(!sprite)return;
 const action=crewAction==='serve'?'serve':!crew.classList.contains('walking')&&Object.values(inventory).some(n=>n>0)?'carry':'walk';
 sprite.classList.toggle('service-pose',action!=='walk');
 if(action==='walk')sprite.style.backgroundPosition=(column*100/3)+'% '+((attendantChoice*2+phase)*100/3)+'%';
 else sprite.style.backgroundPosition=(action==='serve'?100:0)+'% '+(attendantChoice*100)+'%';
 const carried=crew.querySelector('.crew-cargo');
 if(carried){carried.textContent=Object.keys(inventory).filter(k=>inventory[k]>0).slice(0,2).map(k=>icons[k]).join('');carried.hidden=action==='walk'||!carried.textContent}
}
function clearCrewAction(){crewAction='idle';updateCrewSprite()}
async function animateCrewService(){
 const id=flightId;busy=true;crewAction='serve';updateCrewSprite();
 await new Promise(resolve=>setTimeout(resolve,500));
 if(id!==flightId||!running)return false;
 busy=false;clearCrewAction();return true;
}
function refreshPassengerSprites(){
 seats.forEach((s,index)=>{
  const portrait=s.button.querySelector('.seat-avatar');if(!portrait)return;
  const mood=s.reactionUntil>Date.now()?s.reactionMood:passengerMood(s);
  setPassengerPortrait(portrait,passengerIdentity(index),mood);
  s.button.setAttribute('data-mood',mood);
 });
}
crew.replaceChildren();const crewSprite=document.createElement('span');crewSprite.className='crew-sprite';crew.appendChild(crewSprite);const cargo=document.createElement('span');cargo.className='crew-cargo';cargo.hidden=true;crew.appendChild(cargo);crew.setAttribute('aria-label','Flight attendant');
seats.forEach((s,index)=>{
 const label=s.button.querySelector('small');s.button.replaceChildren();
 const avatar=document.createElement('span');avatar.className='seat-avatar';s.button.append(avatar,label);if(familyService.groupFor(index)>=0){s.button.classList.add('family-seat');const badge=document.createElement('span');badge.className='family-badge';badge.textContent=familyService.role(index)==='Child'?'Child':'Parent';s.button.appendChild(badge)}
});
const attendantPicker=document.createElement('select');attendantPicker.className='route-picker';attendantPicker.setAttribute('aria-label','Choose your flight attendant');
attendantPicker.innerHTML='<option value="1">Female attendant</option><option value="0">Male attendant</option>';
attendantPicker.onchange=()=>{attendantChoice=Number(attendantPicker.value);updateCrewSprite()};
picker.before(attendantPicker);
updateCrewSprite();refreshPassengerSprites();
