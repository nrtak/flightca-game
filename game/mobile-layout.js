// Keep stable seat IDs for legacy saves; the comparison mode hides row five.
let cabinRows=4;
function setCabinRows(value){
 cabinRows=value===5?5:4;
 cabin.style.setProperty('--cabin-rows',String(cabinRows));
 seats.forEach(s=>{s.button.hidden=s.row>=cabinRows});
 // There is an empty aisle cell between each pair of seat pairs.
 Array.from($('rows').children).forEach((cell,i)=>{cell.hidden=Math.floor(i/5)>=cabinRows});
 windows.forEach(({pane,row})=>{pane.hidden=row>=cabinRows});positionWindows();
}

setCabinRows(cabinRows);
function activeRequestLimit(){return firstFlight()?(ticks<45?2:3):ticks<30?3:ticks<75?4:5}
function requestMembers(index){const n=familyService.groupFor(index);return n<0?[index]:familyService.groups[n].seats}
