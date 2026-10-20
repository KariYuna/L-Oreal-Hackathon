'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');

test('changing language during a pending answer returns only the newly selected language',{timeout:20000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lumiere-language-switch-'));
 let releaseFirst,firstCallSeen;
 const firstStarted=new Promise(resolve=>{firstCallSeen=resolve;});
 const firstReleased=new Promise(resolve=>{releaseFirst=resolve;});
 let calls=0;
 const fakeModel=http.createServer(async(req,res)=>{
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const input=JSON.parse(Buffer.concat(chunks).toString());
  calls++;
  if(calls===1){firstCallSeen();await firstReleased;}
  const japanese=input.messages[0].content.includes('Japanese (日本語)');
  const output={reply:japanese?'日本語でお答えします。':'I will answer in English.',briefMatch:false,recommendationIds:[],profileUpdates:[],productDraft:{name:'',purpose:''}};
  res.writeHead(200,{'Content-Type':'application/json'});
  res.end(JSON.stringify({message:{content:JSON.stringify(output)}}));
 });
 await new Promise(resolve=>fakeModel.listen(0,'127.0.0.1',resolve));
 const modelPort=fakeModel.address().port,port=4187,base='http://127.0.0.1:'+port;
 const child=spawn(process.execPath,[path.resolve(__dirname,'../server.cjs')],{env:{...process.env,PORT:String(port),LUMIERE_DATA_DIR:dir,OLLAMA_URL:'http://127.0.0.1:'+modelPort},stdio:'pipe',windowsHide:true});
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server did not start')),10000);child.stdout.once('data',()=>{clearTimeout(timer);resolve();});child.once('error',reject);});
  const boot=await(await fetch(base+'/api/bootstrap')).json();
  const post=async(endpoint,data)=>{const r=await fetch(base+'/api/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-Lumiere-Token':boot.token},body:JSON.stringify(data)});return {status:r.status,...await r.json()};};
  const pending=post('chat',{message:'What should I do about dry skin?'});
  await firstStarted;
  assert.equal((await post('settings',{language:'ja'})).state.settings.language,'ja');
  releaseFirst();
  const answer=await pending;
  assert.equal(answer.status,200);
  assert.equal(answer.reply,'日本語でお答えします。');
  assert.equal(answer.state.messages.length,2);
  assert.equal(answer.state.messages[1].language,'ja');
  assert.equal(calls,2);
 }finally{
  releaseFirst();child.kill();await new Promise(resolve=>child.once('exit',resolve));
  await new Promise(resolve=>fakeModel.close(resolve));
  fs.rmSync(dir,{recursive:true,force:true});
 }
});
