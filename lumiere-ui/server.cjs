const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, 'dist');
const port = Number(process.env.PORT || 4173);
const {api,send}=require('./lib/api.cjs');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options','nosniff');
  response.setHeader('Referrer-Policy','no-referrer');
  response.setHeader('X-Frame-Options','DENY');
  const allowed=new Set([`localhost:${port}`,`127.0.0.1:${port}`]);
  if(!allowed.has(request.headers.host))return send(response,403,{error:'Local access only.'});
  if(request.headers.origin){try{if(!allowed.has(new URL(request.headers.origin).host))return send(response,403,{error:'Cross-site requests are not allowed.'});}catch{return send(response,403,{error:'Invalid origin.'});}}
  if(request.url.startsWith('/api/')){try{return await api(request,response,new URL(request.url,'http://localhost'));}catch(e){return send(response,400,{error:e.name==='TimeoutError'?'The service took too long. Please try again.':e.message||'Something went wrong.'});}}
  if(request.method!=='GET'&&request.method!=='HEAD')return send(response,405,{error:'Method not allowed'});
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400); return response.end('Bad request'); }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { response.writeHead(403); return response.end('Forbidden'); }
  fs.readFile(file, (error, body) => {
    if (error) { response.writeHead(404); return response.end('Not found'); }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    response.end(body);
  });
});
server.listen(port, '127.0.0.1', () => console.log(`Lumière preview: http://localhost:${port}`));
