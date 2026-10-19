'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const profile = require('../dist/profile-store.js');
const DAY = 86400000;
const fresh = () => ({version:2,profile:null,settings:{onboarded:false,focus:'comfort',remindersEnabled:false,intervalDays:7,hour:10,timezone:'Asia/Taipei'},products:[],checkins:[],events:[],completions:{},messages:[],notifications:[],weather:null});
function text(value,max=600){if(typeof value!=='string'||value.length>max)throw new Error('Please check the text length.');return value.trim();}
function choice(value,options){if(!options.includes(value))throw new Error('Please choose a listed option.');return value;}
function number(value,min,max){const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)throw new Error(`Enter a number from ${min} to ${max}.`);return n;}
function date(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw new Error('Choose a valid date.');if(Date.parse(value)>Date.now()+DAY)throw new Error('Please use today or an earlier date.');return value;}
const iso=()=>new Date().toISOString();
const event=(s,title,detail,productId=null,at=iso())=>s.events.push({id:randomUUID(),at,title,detail,productId});
function remaining(p,now=Date.now()){if(p.status==='finished')return 0;const elapsed=p.status==='using'?Math.max(0,(now-Date.parse(p.remainingAt||p.start))/DAY):0;return Math.round(Math.max(0,Math.min(100,p.remaining-elapsed*100/p.cycleDays)));}
function localDate(timezone,now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
function schedule(s,now=new Date()){
 if(!s.settings.remindersEnabled)return false;
 const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:s.settings.timezone,hour:'numeric',hourCycle:'h23'}).format(now));
 if(hour<s.settings.hour||hour>=21)return false;
 let changed=false;
 const add=(key,title,body,productId=null)=>{if(s.notifications.some(n=>n.key===key))return;s.notifications.push({id:randomUUID(),key,title,body,productId,at:now.toISOString(),read:false});changed=true;};
 for(const p of s.products){
  if(p.status==='purchased'&&now-Date.parse(p.start)>=3*DAY)add('received:'+p.id,'Has your product arrived?',`Have you received ${p.name}? Open it on your shelf to record when you start.`,p.id);
  if(p.status==='using'&&now-Date.parse(p.start)>=3*DAY)add('tolerance:'+p.id,'A little check-in',`How does ${p.name} feel? Record comfort or irritation on your shelf. Stinging is not proof that a product is working.`,p.id);
  if(p.status==='using'&&remaining(p,+now)<=15)add('low:'+p.id+':'+p.remainingAt,'Time to check your bottle?',`${p.name} may be running low. This is an estimate; tell us how much is actually left.`,p.id);
 }
 const since=Date.parse(s.settings.enabledAt||now.toISOString());
 const period=Math.floor((+now-since)/(s.settings.intervalDays*DAY));
 if(period>=1)add('care:'+s.settings.enabledAt+':'+s.settings.intervalDays+':'+period,'How is your skin feeling?','A quick check-in can help you notice changes. There is no pressure to add more products.');
 return changed;
}
function createStore(dir){
 fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'state.json');
 let state=fresh();if(fs.existsSync(file)){state=JSON.parse(fs.readFileSync(file,'utf8'));if(state.version!==2)throw new Error('Unrecognized data version. Your data has not been changed.');}
 const get=()=>structuredClone(state);
 function transaction(fn){const next=get();const result=fn(next);fs.writeFileSync(file+'.tmp',JSON.stringify(next,null,2));fs.renameSync(file+'.tmp',file);state=next;return result;}
 return {get,transaction,reset:()=>transaction(s=>{for(const k of Object.keys(s))delete s[k];Object.assign(s,fresh());})};
}
function productInput(b,previous){
 const name=text(b.name,120);if(!name)throw new Error('Enter a product name.');
 return {id:previous?.id||randomUUID(),name,type:choice(b.type,['Cleanser','Moisturizer','Sunscreen','Serum','Other']),period:choice(b.period,['morning','evening','both']),status:choice(b.status,['purchased','using','paused','finished']),start:date(b.start),cycleDays:number(b.cycleDays,7,730),remaining:number(b.remaining,0,100),remainingAt:iso(),purpose:text(b.purpose||'',300),notes:text(b.notes||'',600),createdAt:previous?.createdAt||iso(),feedback:previous?.feedback||[]};
}
module.exports={fresh,createStore,text,choice,number,date,iso,event,remaining,localDate,schedule,productInput,profile};
