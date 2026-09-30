const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').replace(/<script src="(assets\/[^"]+)"><\/script>/g,(_,file)=>'<script>'+fs.readFileSync(path.join(__dirname,'..',file),'utf8')+'</script>');
async function check(mode){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:mode==='file'?'file:///preview/index.html?opponent=SA':'https://preview.test/?opponent=SA',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:()=>null,setItem:()=>{}}});w.Response=Response;w.AbortController=AbortController;w.scrollTo=()=>{};
  w.fetch=async(url)=>{if(mode!=='live')throw Error('Simulated Supabase outage');if(!String(url).includes('/South%20Alabama/'))return new Response('',{status:404});let name=decodeURIComponent(String(url).split('/').pop().split('?')[0]);let p=path.join(__dirname,'../opponents/south-alabama/current',name);return fs.existsSync(p)?new Response(fs.readFileSync(p,'utf8')):new Response('',{status:404});};
 }});
 const w=dom.window,ev=s=>w.eval(s);
 for(let i=0;i<100&&!w.document.querySelector('#headerStatus').textContent.includes('core data sources loaded');i++)await new Promise(r=>setTimeout(r,20));
 assert.deepEqual([...ev('Object.keys(OPPONENTS)')].sort(),['FAU','MSST','SA','SELA','UAB']);
 assert.equal(w.document.querySelectorAll('.opponent-toggle button').length,5);
 assert.equal(ev('dashboardPlayRows().length'),216);assert.equal(ev('datasets.plays.length'),225);
 assert.equal(ev('offenseRoster().length'),52);
 assert.equal(ev('Object.values(loadState).filter(x=>x.ok).length'),20);
 assert.equal(ev("parseCSV('COV,COV,MT,MT\\n62.3,107,2,1')[0]['COV.1']"),'107');
 assert.equal(ev("piStats(roster.find(p=>p.name==='Jayvon Henderson')).covGrade"),'62.3');
 assert.equal(ev("piStats(roster.find(p=>p.name==='Jayvon Henderson')).covSnaps"),107);
 assert.equal(ev("piStats(roster.find(p=>p.name==='DJ Moore')).rows"),69);
 assert.equal(ev("piGameStats(roster.find(p=>p.name==='Jayvon Henderson')).length"),4);
 assert.equal(ev('activeDefDepthRows().length'),11);
 assert.equal(ev("piStats(roster.find(p=>p.name==='Masey Lewis')).verified"),true);
 assert.equal(ev("resolveRosterPlayer('Mase Lewis').name"),'Masey Lewis');
 assert(ev('datasets.plays.filter(r=>r.ulmFormation).length')>=20);
 assert.equal(ev("piTokenMatchesPlayer('ALSO D08; ALSO D02',roster.find(p=>p.name==='Jayvon Henderson'))"),true);
 assert.equal(ev("piTokenMatchesPlayer('LASE D02',roster.find(p=>p.name==='Jayvon Henderson'))"),false);
 for(const page of ['dashboard','players','depthchart','leaders','missedtackles','personnel','run','qbrun','pass','coverage','pressure','situations','heatmaps','formations','structures']){
  w.goPage(page);let app=w.document.querySelector('#app');assert(app.textContent.length>150,page);assert.equal(app.querySelectorAll('.empty').length,0,page);
 }
 w.openFAUProfile('Jayvon Henderson');
 for(const tab of ['overview','topgames','gamelog','deployment','notes']){w.setPIProfileTab(tab);assert(w.document.querySelector('#fauPanel').textContent.length>40,tab);assert.equal(w.document.querySelectorAll('#fauPanel .empty').length,0,tab);}
 assert(w.document.querySelector('.fau-hero img').src.includes('/player-images/'));
 assert.equal(errors.length,0,errors.join('\n'));
 // All four existing opponents remain selectable with the original source configuration.
 for(const key of ['MSST','UAB','SELA','FAU']){await w.setOpponent(key);assert.equal(ev('activeOpponent'),key);assert.equal(w.document.querySelector('#oppName').textContent,ev('OPPONENTS[activeOpponent].label'));}
 console.log(`${mode}: 15 pages, 5 profile tabs, 5 opponents, 216 valid plays, 52 defenders passed`);
 dom.window.close();
}
(async()=>{for(const mode of ['file','outage','live'])await check(mode)})().catch(e=>{console.error(e);process.exit(1)});
