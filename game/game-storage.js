// The iOS wrapper injects durable app storage before any game script runs.
// Browser builds retain their existing localStorage keys and behavior.
const gameStorage=(()=>{
 if(window.cabinNativeStorage)return window.cabinNativeStorage;
 try{return localStorage}catch{
  return {getItem(){throw Error('Storage unavailable')},setItem(){throw Error('Storage unavailable')},removeItem(){throw Error('Storage unavailable')}};
 }
})();
