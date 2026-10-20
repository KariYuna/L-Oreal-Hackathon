'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const S=require('../lib/store.cjs');
test('atomic persistence survives reopen; failed validation leaves data intact',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lumiere-test-'));try{const db=S.createStore(dir);db.transaction(s=>s.profile={name:'Jamie Chan'});assert.equal(S.createStore(dir).get().profile.name,'Jamie Chan');assert.throws(()=>db.transaction(s=>{s.profile.name='Wrong';throw Error('invalid');}));assert.equal(db.get().profile.name,'Jamie Chan');db.reset();assert.equal(db.get().profile,null);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('product estimates clamp and do not deplete paused products',()=>{const p={status:'using',remaining:80,remainingAt:'2026-01-01T00:00:00Z',cycleDays:100};assert.equal(S.remaining(p,Date.parse('2026-01-11')),70);assert.equal(S.remaining(p,Date.parse('2027-01-01')),0);assert.equal(S.remaining({...p,status:'paused'},Date.parse('2027-01-01')),80);});
test('reminders respect opt-in, timezone quiet hours, deduplication, overdue catch-up and cancellation',()=>{const s=S.fresh();s.settings={...s.settings,timezone:'Asia/Taipei',enabledAt:'2026-01-01T00:00:00Z'};s.products=[{id:'p1',name:'Cream',status:'using',start:'2026-01-01',remaining:10,remainingAt:'2026-01-01T00:00:00Z',cycleDays:60}];const due=new Date('2026-01-15T03:00:00Z');assert.equal(S.schedule(s,due),false);s.settings.remindersEnabled=true;assert.equal(S.schedule(s,new Date('2026-01-15T15:00:00Z')),false);assert.equal(S.schedule(s,due),true);assert.equal(s.notifications.length,3);assert.equal(S.schedule(s,due),false);s.settings.remindersEnabled=false;assert.equal(S.schedule(s,new Date('2026-02-01T03:00:00Z')),false);});
test('malformed profile, dates, products and values are rejected',()=>{assert.throws(()=>S.profile.validate({name:''}));assert.throws(()=>S.date('2026-02-30'));assert.throws(()=>S.number('NaN',0,100));assert.throws(()=>S.productInput({name:'Cream',type:'Medication',period:'both',status:'using'}));});
test('emergency language routes away from routine shopping',()=>{assert.equal(require('../lib/agent.cjs').urgent('My lips are swollen and I have difficulty breathing'),true);assert.equal(require('../lib/agent.cjs').urgent('My skin is dry'),false);});
test('saved language migrates safely and reminder copy follows the chosen language',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lumiere-language-'));
 try{
  const old=S.fresh();delete old.settings.language;delete old.settings.languageChosen;
  fs.writeFileSync(path.join(dir,'state.json'),JSON.stringify(old));
  const db=S.createStore(dir);assert.equal(db.get().settings.language,'en');assert.equal(db.get().settings.languageChosen,false);
  db.transaction(s=>{s.settings.language='zh-TW';s.settings.languageChosen=true;s.settings.remindersEnabled=true;s.settings.enabledAt='2026-01-01T00:00:00Z';s.products.push({id:'p1',name:'Cream',status:'purchased',statusAt:'2026-01-01T00:00:00Z',start:'2026-01-01',remaining:80,cycleDays:60});});
  const reopened=S.createStore(dir).get();assert.equal(reopened.settings.language,'zh-TW');assert.equal(reopened.settings.languageChosen,true);
  assert.equal(S.schedule(reopened,new Date('2026-01-10T03:00:00Z')),true);
  assert.ok(reopened.notifications.some(n=>n.body.includes('Cream')&&/[\u4e00-\u9fff]/u.test(n.title)));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
