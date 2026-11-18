// Preview built static pages with zero dependencies: npm run dev -> http://localhost:4173
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url||'/',`http://${req.headers.host}`);
  const path=resolve(root,'.'+decodeURIComponent(url.pathname));
  if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  let source=path;
  try{if((await stat(source)).isDirectory())source=resolve(source,'index.html');}
  catch{}
  const data=await readFile(source);
  res.writeHead(200,{'Content-Type':types[extname(source)]||'application/octet-stream','Cache-Control':'no-cache'});
  res.end(data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'}).end('Not found');}
}).listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('GTA VI Zero Hour: http://localhost:'+(process.env.PORT||4173)));
