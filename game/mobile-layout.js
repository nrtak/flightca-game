// Keep stable seat IDs for legacy saves; the comparison mode hides row five.
let cabinRows=4;
const densityPicker=document.createElement('select');
densityPicker.className='route-picker';densityPicker.setAttribute('aria-label','Cabin size for phone comparison');
densityPicker.innerHTML='<option value="4">Roomier cabin · 4 rows</option><option value="5">Original cabin · 5 rows</option>';
densityPicker.value='4';$('start').before(densityPicker);
function setCabinRows(value){
 cabinRows=value===5?5:4;densityPicker.value=String(cabinRows);
 cabin.style.setProperty('--cabin-rows',String(cabinRows));
 seats.forEach(s=>{s.button.hidden=s.row>=cabinRows});
 // There is an empty aisle cell between each pair of seat pairs.
 Array.from($('rows').children).forEach((cell,i)=>{cell.hidden=Math.floor(i/5)>=cabinRows});
 windows.forEach(({pane,row})=>{pane.hidden=row>=cabinRows});positionWindows();
}
densityPicker.onchange=()=>{if(!running)setCabinRows(Number(densityPicker.value))};
setCabinRows(cabinRows);
function activeRequestLimit(){return ticks<30?3:ticks<75?4:5}
function requestMembers(index){const n=familyService.groupFor(index);return n<0?[index]:familyService.groups[n].seats}
