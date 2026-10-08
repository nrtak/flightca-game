const passengerDialogue=document.createElement('div');
passengerDialogue.className='passenger-dialogue';passengerDialogue.hidden=true;
passengerDialogue.setAttribute('role','status');passengerDialogue.setAttribute('aria-live','polite');
document.querySelector('main').appendChild(passengerDialogue);
let passengerDialogueTimer;
const expressions={neutral:'😐',happy:'🙂','very-happy':'😄',sad:'😟',mad:'😠','very-mad':'😤'};
function passengerMood(s){if(!s.request)return 'neutral';const ratio=s.patience/requestPatience();return ratio>.65?'neutral':ratio>.4?'sad':ratio>.2?'mad':'very-mad'}
function speakPassenger(s,text,mood=passengerMood(s)){
 passengerDialogue.replaceChildren();
 const portrait=document.createElement('div');portrait.className='passenger-portrait';
 setPassengerPortrait(portrait,passengerIdentity(seats.indexOf(s)),mood);
 const content=document.createElement('div'),name=document.createElement('strong'),line=document.createElement('p');
 name.textContent=familyService.role(seats.indexOf(s))+' · '+s.button.querySelector('small').textContent;line.textContent=text;
 content.append(name,line);passengerDialogue.append(portrait,content);passengerDialogue.hidden=false;
 clearTimeout(passengerDialogueTimer);passengerDialogueTimer=setTimeout(()=>passengerDialogue.hidden=true,3500);
 $('message').classList.remove('show');
}
function clearPassengerDialogue(){passengerDialogue.hidden=true;clearTimeout(passengerDialogueTimer)}
