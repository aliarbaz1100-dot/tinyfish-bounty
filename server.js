const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const KEY = process.env.TINYFISH_API_KEY;

async function tfSearch(query) {
  const u = new URL('https://api.search.tinyfish.ai');
  u.searchParams.set('query', query);
  u.searchParams.set('language', 'en');
  const r = await fetch(u, {headers:{'X-API-Key':KEY}});
  if (!r.ok) throw new Error(`Search failed: ${r.status}`);
  return r.json();
}

async function tfFetch(urls) {
  const r = await fetch('https://api.fetch.tinyfish.ai', {
    method:'POST', headers:{'X-API-Key':KEY,'Content-Type':'application/json'},
    body:JSON.stringify({urls, format:'markdown', links:true, page_metadata:true})
  });
  if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
  return r.json();
}

async function tfAgent(url, goal) {
  const r = await fetch('https://agent.tinyfish.ai/v1/automation/run-sse', {
    method:'POST', headers:{'X-API-Key':KEY,'Content-Type':'application/json'},
    body:JSON.stringify({url, goal, browser_profile:'lite'})
  });
  if (!r.ok) throw new Error(`Agent failed: ${r.status}`);
  const text = await r.text();
  return text.slice(-12000);
}

function resultsOf(x){ return x.results || x.data?.results || x.data || []; }

async function analyze(body){
  if(!KEY) throw new Error('TINYFISH_API_KEY is not configured');
  const topic=(body.topic||'').trim();
  const region=(body.region||'global').trim();
  if(!topic) throw new Error('Enter a market, product, or topic');

  // Endpoint 1: SEARCH — discover live sources instead of relying on a static dataset.
  const searches = await Promise.all([
    tfSearch(`${topic} ${region} official pricing`),
    tfSearch(`${topic} ${region} alternatives competitors`),
    tfSearch(`${topic} ${region} reviews complaints demand`)
  ]);
  const candidates = searches.flatMap(resultsOf).filter(x=>x && x.url);
  const unique = [...new Map(candidates.map(x=>[x.url,x])).values()].slice(0,6);
  if(!unique.length) throw new Error('No live sources discovered');

  // Endpoint 2: FETCH — extract evidence from several discovered pages.
  const fetched = await tfFetch(unique.map(x=>x.url));
  const pages = fetched.results || fetched.data?.results || fetched.data || [];
  const evidence = (Array.isArray(pages)?pages:[]).slice(0,6).map((p,i)=>({
    url:p.url||unique[i]?.url,
    title:p.title||unique[i]?.title||`Source ${i+1}`,
    excerpt:String(p.text||p.content||p.markdown||unique[i]?.snippet||'').replace(/\s+/g,' ').slice(0,700)
  }));

  // Endpoint 3: AGENT — inspect one live site interactively for facts that static extraction can miss.
  const target = unique[0].url;
  const agentGoal = `Act as a market-research verifier. Inspect this website for the topic "${topic}" in ${region}. Navigate only as needed. Return concise JSON-like findings covering: current offer/product, visible pricing if any, target customer, trust signals, and one competitive weakness or opportunity. Do not purchase, sign in, or submit forms.`;
  const agent = await tfAgent(target, agentGoal);

  return {topic,region,generatedAt:new Date().toISOString(),endpointCount:3,discovered:unique,evidence,agentVerification:agent};
}

function send(res,status,data,type='application/json'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(type.includes('json')?JSON.stringify(data):data)}
const server=http.createServer(async(req,res)=>{
  if(req.method==='GET' && req.url==='/'){return send(res,200,fs.readFileSync(path.join(__dirname,'public','index.html'),'utf8'),'text/html; charset=utf-8')}
  if(req.method==='GET' && req.url==='/health'){return send(res,200,{ok:true,apiKeyConfigured:!!KEY})}
  if(req.method==='POST' && req.url==='/api/analyze'){
    let raw=''; req.on('data',c=>raw+=c); req.on('end',async()=>{try{const out=await analyze(JSON.parse(raw||'{}'));send(res,200,out)}catch(e){send(res,500,{error:e.message})}}); return;
  }
  send(res,404,{error:'Not found'});
});
server.listen(PORT,()=>console.log(`SignalScout running on ${PORT}`));
