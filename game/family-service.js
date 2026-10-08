// A family shares an order cycle; each member still receives their own item.
class FamilyService {
 constructor(){this.groups=[{seats:[4,5],adult:4,child:5},{seats:[14,15],adult:14,child:15}];this.reset()}
 reset(){this.cycles=this.groups.map(()=>({active:false,resolved:[],failed:false}));this.bonuses=0}
 groupFor(index){return this.groups.findIndex(g=>g.seats.includes(index))}
 role(index){const n=this.groupFor(index);return n<0?'Passenger':this.groups[n].child===index?'Child':'Parent'}
 eligible(index){const n=this.groupFor(index);return n<0||!this.cycles[n].active}
 start(index,seats,items,patience,random=Math.random){
  const n=this.groupFor(index),pick=list=>list[Math.floor(random()*list.length)];
  const members=n<0?[index]:this.groups[n].seats;
  if(n>=0){if(this.cycles[n].active||members.some(i=>seats[i].request))return false;this.cycles[n]={active:true,resolved:[],failed:false}}
  members.forEach(i=>{seats[i].request=pick(this.role(i)==='Child'?['water','soda','pretzels','cookies']:items);seats[i].patience=n<0?patience:30;seats[i].queued=false});return true;
 }
 collect(index,seats,orders,capacity=6){
  const n=this.groupFor(index),members=n<0?[index]:this.groups[n].seats;
  const additions=members.filter(i=>seats[i].request&&!seats[i].queued);
  if(orders.length+additions.length>capacity)return false;
  additions.forEach(i=>{seats[i].queued=true;orders.push(i)});return true;
 }
 resolve(index,delivered){
  const n=this.groupFor(index);if(n<0)return 0;const cycle=this.cycles[n];
  if(!cycle.active||cycle.resolved.includes(index))return 0;
  cycle.resolved.push(index);if(!delivered)cycle.failed=true;
  if(cycle.resolved.length<this.groups[n].seats.length)return 0;
  cycle.active=false;if(cycle.failed)return 0;this.bonuses++;return 25;
 }
 snapshot(){return {bonuses:this.bonuses,cycles:this.cycles.map(c=>({...c,resolved:[...c.resolved]}))}}
 valid(saved,seats){
  return saved&&Number.isInteger(saved.bonuses)&&saved.bonuses>=0&&saved.bonuses<=1000&&Array.isArray(saved.cycles)&&saved.cycles.length===2&&saved.cycles.every((c,n)=>{
   const members=this.groups[n].seats;
   return c&&typeof c.active==='boolean'&&typeof c.failed==='boolean'&&Array.isArray(c.resolved)&&new Set(c.resolved).size===c.resolved.length&&c.resolved.every(i=>members.includes(i))&&
    (c.active?c.resolved.length<2&&members.every(i=>Boolean(seats[i].request)===!c.resolved.includes(i)):members.every(i=>!seats[i].request));
  });
 }
 restore(saved,seats){this.reset();if(saved&&this.valid(saved,seats)){this.bonuses=saved.bonuses;this.cycles=saved.cycles.map(c=>({...c,resolved:[...c.resolved]}))}else{
  // Legacy flight saves may contain independent requests in family seats.
  this.groups.forEach((g,n)=>{if(g.seats.some(i=>seats[i].request))this.cycles[n]={active:true,resolved:g.seats.filter(i=>!seats[i].request),failed:true}});
 }}
}
const familyService=new FamilyService();
