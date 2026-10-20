const test = require('node:test');
const assert = require('node:assert/strict');
const {createStore,defaults,key,escapeHTML} = require('../dist/profile-store.js');
function memoryStorage() {
  const values = new Map();
  return {getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
}
test('first visit shows Jamie Chan; all edited fields survive a new store instance',()=>{
  const storage=memoryStorage(),store=createStore(()=>storage);
  assert.equal(store.load().data.name,'Jamie Chan');
  assert.equal(store.load().saved,false);
  const edited={name:' Alex Chan ',age:'25–34',city:'Taipei',life:'Working',experience:'I have a basic routine',budget:'Ask me each time',routine:'My own cleanser\nEvening moisturizer',sensitivities:'Fragrance',activity:'Gym twice a week',environment:'Air-conditioned laboratory',dailyHabits:'Outdoor commute'};
  assert.equal(store.save(edited).ok,true);
  const reloaded=createStore(()=>storage).load();
  assert.equal(reloaded.saved,true);
  assert.deepEqual(reloaded.data,{...edited,name:'Alex Chan'});
});
test('blank optional fields are preserved rather than replaced by sample personal data',()=>{
  const store=createStore(()=>memoryStorage());
  const result=store.save({...defaults,city:'',routine:'',sensitivities:'',age:'Prefer not to say'});
  assert.equal(result.ok,true);assert.equal(result.data.city,'');assert.equal(result.data.age,'Prefer not to say');
});
test('invalid edits do not replace a previously saved profile',()=>{
  const storage=memoryStorage(),store=createStore(()=>storage);store.save(defaults);
  const before=storage.getItem(key);
  for(const edit of [{name:'   '},{age:'unknown'},{name:'a'.repeat(81)},{routine:'x'.repeat(601)},{city:44}]){
    assert.equal(store.save({...defaults,...edit}).ok,false);
    assert.equal(storage.getItem(key),before);
  }
});
test('malformed, incompatible, and incomplete stored records fall back without overwriting data',()=>{
  const storage=memoryStorage(),store=createStore(()=>storage);
  for(const raw of ['{bad json','null',JSON.stringify({version:99,profile:defaults}),JSON.stringify({version:1,profile:{name:'Alex'}})]){
    storage.setItem(key,raw);const result=store.load();
    assert.equal(result.saved,false);assert.equal(result.data.name,'Jamie Chan');assert.ok(result.error);assert.equal(storage.getItem(key),raw);
  }
});
test('blocked access and quota failures report failure rather than claiming a save',()=>{
  const denied=createStore(()=>{throw new Error('SecurityError');});
  assert.ok(denied.load().error);assert.equal(denied.save(defaults).ok,false);assert.equal(denied.reset().ok,false);
  const storage=memoryStorage();storage.setItem(key,JSON.stringify({version:1,profile:defaults}));
  const quota=createStore(()=>({...storage,setItem(){throw new Error('QuotaExceededError');}}));
  assert.equal(quota.save({...defaults,name:'Unsaved'}).ok,false);assert.equal(quota.load().data.name,'Jamie Chan');
});
test('reset only removes this application profile',()=>{
  const storage=memoryStorage(),store=createStore(()=>storage);
  storage.setItem('another-app','preserve');store.save({...defaults,name:'Alex'});
  assert.equal(store.reset().ok,true);assert.equal(storage.getItem(key),null);assert.equal(storage.getItem('another-app'),'preserve');assert.equal(store.load().saved,false);
});
test('profile text is escaped for both HTML text and quoted attributes',()=>{
  assert.equal(escapeHTML('<img src=x onerror="alert(1)"> & \'hello\''),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;hello&#39;');
  assert.equal(escapeHTML('陳 Jamie'),'陳 Jamie');
});
