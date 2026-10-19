'use strict';
const path=require('node:path'),{randomUUID,randomBytes}=require('node:crypto'),{spawn}=require('node:child_process');
const S=require('./store.cjs'),agent=require('./agent.cjs'),weather=require('./weather.cjs');
const app=path.resolve(__dirname,'..');
const store=S.createStore(process.env.LUMIERE_DATA_DIR||path.join(app,'.data'));
const token=randomBytes(32).toString('hex'),analyses=new Map(),locations=new Map();
let chatting=false,analyzing=false,epoch=0;
const send=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function body(req){let parts=[],size=0;for await(const part of req){size+=part.length;if(size>9*1024*1024)throw Error('Upload is too large (maximum 6 MB photo).');parts.push(part);}try{return JSON.parse(Buffer.concat(parts).toString());}catch{throw Error('Invalid request.');}}
function tick(){if(!store.get().settings.remindersEnabled)return;const s=store.get();if(S.schedule(s))store.transaction(next=>{next.notifications=s.notifications;});}
function vision(image){return new Promise((resolve,reject)=>{
 const python=process.env.LUMIERE_PYTHON||path.join(app,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
 const child=spawn(python,[path.join(app,'vision/analyze.py')],{windowsHide:true,env:{...process.env,PYTHONUTF8:'1'}});let output='';
 const timeout=setTimeout(()=>{child.kill();reject(Error('Photo analysis timed out. Please try a smaller photo.'));},30000);
 child.on('error',()=>{clearTimeout(timeout);reject(Error('Photo service is unavailable. Run the setup script to install Python dependencies.'));});
 child.stdout.on('data',d=>{output+=d;if(output.length>2e6)child.kill();});child.stderr.resume();child.stdin.on('error',()=>{});
 child.on('close',code=>{clearTimeout(timeout);try{const result=JSON.parse(output);if(result.error)reject(Error(result.error));else if(code)reject(Error('Photo analysis failed.'));else resolve(result);}catch{reject(Error('Photo service could not process this image. Please upload a clear JPG or PNG.'));}});child.stdin.end(JSON.stringify({image}));
});}
async function api(req,res,url){
 if(req.method==='GET'&&url.pathname==='/api/bootstrap'){tick();return send(res,200,{token,state:store.get(),catalog:agent.catalog,sources:agent.sources});}
 if(req.method==='GET'&&url.pathname==='/api/status')return send(res,200,await agent.status());
 if(req.method!=='POST')return send(res,404,{error:'Not found'});
 if(req.headers['x-lumiere-token']!==token)return send(res,403,{error:'Please reload this page before saving.'});
 const b=await body(req);let result={};
 switch(url.pathname){
 case '/api/profile':{const p=S.profile.validate(b);store.transaction(s=>{const changed=s.profile?.city!==p.city;s.profile=p;s.settings.onboarded=true;if(changed)s.weather=null;});break;}
 case '/api/settings':store.transaction(s=>{
  if('onboarded'in b)s.settings.onboarded=b.onboarded===true;
  if('focus'in b)s.settings.focus=S.choice(b.focus,['comfort','redness','blemishes','tone']);
  if('remindersEnabled'in b){if(b.remindersEnabled&&!s.settings.remindersEnabled)s.settings.enabledAt=S.iso();s.settings.remindersEnabled=b.remindersEnabled===true;}
  if('intervalDays'in b)s.settings.intervalDays=S.number(b.intervalDays,1,30);
  if('hour'in b)s.settings.hour=S.number(b.hour,8,20);
  if('timezone'in b){new Intl.DateTimeFormat('en',{timeZone:b.timezone});s.settings.timezone=S.text(b.timezone,80);}
 });break;
 case '/api/product':store.transaction(s=>{const old=b.id?s.products.find(p=>p.id===b.id):null;if(b.id&&!old)throw Error('Product not found.');const p=S.productInput(b,old);if(old)s.products[s.products.indexOf(old)]=p;else s.products.push(p);S.event(s,old?'Product updated':'Product added',`${p.name} · ${p.status} · ${p.period}. ${p.purpose} ${p.notes}`,p.id,old?S.iso():p.start+'T12:00:00.000Z');});break;
 case '/api/feedback':store.transaction(s=>{const p=s.products.find(p=>p.id===b.id);if(!p)throw Error('Product not found.');const feeling=S.choice(b.feeling,['Comfortable','Sticky','Dry','Stinging or discomfort','No clear change','Other']);const notes=S.text(b.notes||'');p.feedback.push({at:S.iso(),feeling,notes});S.event(s,'Product feedback',`${p.name}: ${feeling}. ${notes}`,p.id);});break;
 case '/api/complete':store.transaction(s=>{const period=S.choice(b.period,['morning','evening']);const day=S.localDate(s.settings.timezone);const ids=s.products.filter(p=>p.status==='using'&&(p.period===period||p.period==='both')).map(p=>p.id);const selected=b.all?ids:[S.choice(b.id,ids)];for(const id of selected){const key=day+':'+period+':'+id;if(b.done===false)delete s.completions[key];else s.completions[key]=S.iso();}s.settings.lastRoutineVisit=S.iso();});break;
 case '/api/event':store.transaction(s=>{S.event(s,S.text(b.title,120),S.text(b.detail,600),null,S.date(b.date)+'T12:00:00.000Z');s.settings.lastRoutineVisit=S.iso();});break;
 case '/api/checkin':{const analysis=b.analysisId?analyses.get(b.analysisId):null;if(b.analysisId&&(!analysis||Date.now()-analysis.created>1800000))throw Error('This photo report expired. Please analyze the photo again.');store.transaction(s=>{s.checkins.push({id:randomUUID(),at:S.iso(),feeling:S.choice(b.feeling,['Dry or tight','Oily','Stinging or itchy','Comfortable','Other']),notes:S.text(b.notes||'',1200),comfort:S.number(b.comfort,0,10),redness:S.number(b.redness,0,10),blemishes:S.number(b.blemishes,0,10),tone:S.number(b.tone,0,10),analysis:analysis?.report||null,photo:b.keepPhoto===true?analysis?.photo||null:null});});if(b.analysisId)analyses.delete(b.analysisId);break;}
 case '/api/analyze':{
  if(analyzing)return send(res,409,{error:'A photo is already being analyzed. Please wait.'});
  if(typeof b.image!=='string'||!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=\r\n]+$/.test(b.image)||b.image.length>8500000)throw Error('Choose a JPG or PNG under 6 MB.');
  analyzing=true;const currentEpoch=epoch;try{const v=await vision(b.image);if(currentEpoch!==epoch)throw Error('Your data was reset. Please try again.');const id=randomUUID();const {photo,...report}=v;analyses.set(id,{created:Date.now(),report,photo});result={analysisId:id,report,photo};}finally{analyzing=false;}return send(res,200,result);
 }
 case '/api/chat':{
  if(chatting)return send(res,409,{error:'Lumière is still responding. Please wait.'});
  const message=S.text(b.message,2000);if(!message)throw Error('Write a message first.');chatting=true;const currentEpoch=epoch;
  try{result=await agent.chat(store.get(),message);if(currentEpoch!==epoch)throw Error('Your data was reset. Please start a new conversation.');store.transaction(s=>{s.messages.push({id:randomUUID(),role:'user',content:message,at:S.iso()},{id:randomUUID(),role:'assistant',content:result.reply,at:S.iso(),profileUpdates:result.profileUpdates,productDraft:result.productDraft});});}finally{chatting=false;}break;
 }
 case '/api/cities':{const city=S.text(b.city,100);if(!city)throw Error('Add a city in your profile first.');const options=await weather.cities(city);for(const c of options)locations.set(c.id,c);return send(res,200,{cities:options});}
 case '/api/weather':{const city=locations.get(b.id);if(!city)throw Error('Please search for your city again.');const currentEpoch=epoch;const w=await weather.weather(city);if(currentEpoch!==epoch)throw Error('Your data was reset.');store.transaction(s=>s.weather=w);break;}
 case '/api/notification':store.transaction(s=>{const n=s.notifications.find(n=>n.id===b.id);if(!n)throw Error('Reminder not found.');n.read=true;});break;
 case '/api/delete':if(b.confirm!=='DELETE')throw Error('Type DELETE to confirm.');epoch++;store.reset();analyses.clear();locations.clear();break;
 default:return send(res,404,{error:'Not found'});
 }
 tick();send(res,200,{...result,state:store.get()});
}
setInterval(()=>{try{tick();for(const [id,a]of analyses)if(Date.now()-a.created>1800000)analyses.delete(id);}catch(e){console.error('Background check failed:',e.message);}},60000).unref();
module.exports={api,send};
