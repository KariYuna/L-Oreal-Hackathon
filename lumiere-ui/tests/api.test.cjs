'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process');
test('local API saves real records, validates input, protects writes and processes photos',{timeout:90000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lumiere-api-')),port=4186,base='http://127.0.0.1:'+port;
 const child=spawn(process.execPath,[path.resolve(__dirname,'../server.cjs')],{env:{...process.env,PORT:String(port),LUMIERE_DATA_DIR:dir},stdio:'pipe',windowsHide:true});
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server did not start')),10000);child.stdout.once('data',()=>{clearTimeout(timer);resolve();});child.once('error',reject);});
  const boot=await(await fetch(base+'/api/bootstrap')).json();assert.equal(boot.state.profile,null);
  const post=async(endpoint,data,headers={})=>{const r=await fetch(base+'/api/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-Lumiere-Token':boot.token,...headers},body:JSON.stringify(data)});return {status:r.status,...await r.json()};};
  assert.equal((await post('settings',{onboarded:true},{'X-Lumiere-Token':'wrong'})).status,403);
  assert.equal((await post('settings',{onboarded:true},{Origin:'https://example.com'})).status,403);
  const profile={...require('../dist/profile-store.js').defaults,city:'Taipei',sensitivities:'Fragrance preference'};
  assert.equal((await post('profile',profile)).state.profile.city,'Taipei');
  assert.equal((await post('profile',{...profile,name:''})).status,400);
  const p=await post('product',{name:'Test moisturizer',type:'Moisturizer',period:'both',status:'using',start:'2026-01-01',cycleDays:60,remaining:70,purpose:'Comfort',notes:'Test record'});assert.equal(p.state.products.length,1);const id=p.state.products[0].id;
  const done=await post('complete',{period:'morning',id,done:true});assert.equal(Object.keys(done.state.completions).length,1);
  await post('feedback',{id,feeling:'Comfortable',notes:'Test feedback'});
  const photo='data:image/png;base64,'+fs.readFileSync(path.resolve(__dirname,'../dist/assets/skincare-portrait.png')).toString('base64');
  const report=await post('analyze',{image:photo});assert.equal(report.status,200,JSON.stringify(report));assert.equal(report.report.faceCount,1);assert.ok(report.report.metrics.redChannel>0);
  assert.equal((await post('analyze',{image:'data:image/png;base64,bm90YW5pbWFnZQ=='})).status,400);
  const c=await post('checkin',{feeling:'Dry or tight',comfort:4,redness:3,blemishes:0,tone:1,notes:'Test check-in',analysisId:report.analysisId,keepPhoto:false});assert.equal(c.state.checkins[0].photo,null);assert.ok(c.state.checkins[0].analysis);assert.equal(c.state.events.length,2);
  assert.equal((await post('checkin',{feeling:'Dry or tight',comfort:4,redness:3,blemishes:0,tone:1,analysisId:report.analysisId})).status,400);
  const emergency=await post('chat',{message:'I have difficulty breathing and swollen lips.'});assert.equal(emergency.safety,true);assert.match(emergency.reply,/urgent medical help/);
  const disk=JSON.parse(fs.readFileSync(path.join(dir,'state.json')));assert.equal(disk.profile.city,'Taipei');assert.equal(disk.checkins.length,1);
  assert.equal((await post('delete',{confirm:'wrong'})).status,400);const reset=await post('delete',{confirm:'DELETE'});assert.equal(reset.state.products.length,0);assert.equal(reset.state.messages.length,0);assert.equal(reset.state.profile,null);
 }finally{child.kill();await new Promise(r=>child.once('exit',r));fs.rmSync(dir,{recursive:true,force:true});}
});
