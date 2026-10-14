/* Louisiana Tech Week 7: offensive staff scouting workspace. */
window.LaTech = (() => {
 const defaultConfig={
  team:'Louisiana Tech',season:2026,week:7,
  storageBase:'https://hzrosmevuejjlxigdxmg.supabase.co/storage/v1/object/public/Offensive%20Intelligence/Current/Louisiana%20Tech/',
  playsFile:'play_feed-5.csv',
  breakdownFiles:[
   '26_01_LA_Tech_D_vs_Northwestern_Louisiana_.csv',
   '26_02_LA_Tech_D_vs_LSU.csv',
   '26_03_LA_Tech_D_vs_Baylor.csv',
   '26_04_LA_Tech_D_vs_Army.csv',
   '2606_Louisiana_Tech_D_vs_Louisiana-_Lafayette.csv'
  ],
  teamField:'pff_OFFTEAM',teamCodes:['LATC'],rosterFile:'roster.json'
 };
 const state={config:defaultConfig,data:{plays:[],breakdowns:[]},status:{},depth:null,roster:null,loading:false,version:0};
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const n=x=>{const v=Number(String(x??'').replace(/[^0-9.-]/g,''));return Number.isFinite(v)?v:0};
 const get=(r,keys)=>{for(const k of keys){if(r&&r[k]!=null&&String(r[k]).trim()!=='')return r[k]}return ''};
 const fileLabel=f=>f;
 async function response(url){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);try{return await fetch(url,{cache:'no-store',signal:ctl.signal})}finally{clearTimeout(timer)}}
 async function load(parse){
  const version=++state.version;state.loading=true;state.data={plays:[],breakdowns:[]};state.status={};
  try{const r=await response('./louisiana-tech/upload-manifest.json');if(r.ok)state.config={...defaultConfig,...await r.json()}}catch(_){}
  const cfg=state.config,base=cfg.storageBase,stamp='?v='+Date.now();
  const loadFile=async name=>{const r=await response(base+encodeURIComponent(name)+stamp);if(!r.ok)throw Error('HTTP '+r.status);return parse(await r.text())};
  try{const r=await response(base+encodeURIComponent(cfg.depthFile||'depth-chart.json')+stamp);if(r.ok)state.depth=await r.json()}catch(_){}
  if(!state.depth){try{const r=await response('./louisiana-tech/depth-chart.json');if(r.ok)state.depth=await r.json()}catch(_){}}
  let plays=[];
  try{
   plays=await loadFile(cfg.playsFile||'play_feed-5.csv');
   plays=plays.filter(r=>cfg.teamCodes.includes(String(r[cfg.teamField]||'').trim())&&String(r.pff_GAMESEASON||'')==='2026');
   state.status.plays=plays.length?'Loaded '+plays.length+' Louisiana Tech offensive plays':'Rejected: no LATC 2026 offense rows';
  }catch(e){state.status.plays='Awaiting upload ('+String(e.message||'unreachable')+')'}
  const breakdowns=[];
  for(const name of cfg.breakdownFiles||[]){
   try{const rows=await loadFile(name);breakdowns.push({name,label:fileLabel(name),rows});state.status[name]='Loaded '+rows.length+' rows'}
   catch(e){state.status[name]='Awaiting upload ('+String(e.message||'unreachable')+')'}
  }
  let rosterData=null;
  try{const r=await response(base+encodeURIComponent(cfg.rosterFile||'roster.json')+stamp);if(r.ok){const x=await r.json();rosterData=Array.isArray(x)?x:x.players;if(!Array.isArray(rosterData))rosterData=null}}catch(_){}
  if(version!==state.version)return null;
  state.data={plays,breakdowns};state.roster=rosterData;state.loading=false;return state;
 }
 function depthPlayers(){
  const rows=[],by=state.depth?.offense||{};
  for(const [position,players] of Object.entries(by))for(const p of players||[])rows.push({number:String(p[0]||''),name:String(p[1]||''),position,class:String(p[2]||'')});
  return rows;
 }
 function allPlays(){return state.data.plays||[]}
 function groups(rows,field,label){
  const m=new Map();for(const r of rows){const k=String(get(r,[field])||'Unknown').trim()||'Unknown';if(!m.has(k))m.set(k,[]);m.get(k).push(r)}
  return [...m].map(([key,items])=>({key,items,n:items.length,yards:items.reduce((a,r)=>a+n(r.pff_GAINLOSS),0)})).sort((a,b)=>b.n-a.n);
 }
 function pct(a,b){return b?((100*a/b).toFixed(1)+'%'):'—'}
 function summary(rows){
  const valid=rows.filter(r=>String(r.pff_NOPLAY||'').toUpperCase()!=='T'),run=valid.filter(r=>String(r.pff_RUNPASS||'').toUpperCase()==='R'),pass=valid.filter(r=>String(r.pff_RUNPASS||'').toUpperCase()==='P');
  const yards=valid.reduce((a,r)=>a+n(r.pff_GAINLOSS),0),success=valid.filter(r=>String(r.pff_OFFSUCCESS||'').toUpperCase()==='T').length;
  const sacks=valid.filter(r=>String(r.pff_PASSRESULT||'').toUpperCase()==='SACK').length,td=valid.filter(r=>String(r.pff_TOUCHDOWN||'').includes('LATC')).length;
  const int=valid.filter(r=>String(r.pff_PASSRESULT||'').toUpperCase()==='INTERCEPTION').length;
  const explosive=valid.filter(r=>n(r.pff_GAINLOSS)>=(String(r.pff_RUNPASS||'').toUpperCase()==='R'?10:20)).length;
  return {plays:valid.length,run:run.length,pass:pass.length,yards,avg:valid.length?yards/valid.length:0,success,successRate:pct(success,valid.length),explosive,explosiveRate:pct(explosive,valid.length),sacks,td,int};
 }
 function rowsFor(rows,field,validOnly=true){
  const src=validOnly?rows.filter(r=>String(r.pff_NOPLAY||'').toUpperCase()!=='T'):rows;
  return groups(src,field).map(g=>[esc(g.key),g.n,pct(g.n,src.length),g.yards.toFixed(0),g.n?(g.yards/g.n).toFixed(2):'—']);
 }
 function title(name,desc){return '<div class="page-title"><h2>'+esc(name)+'</h2><p>'+esc(desc)+'</p></div>'}
 function cards(items){return '<div class="kpis">'+items.map(x=>'<div class="kpi"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join('')+'</div>'}
 function section(name,desc,body){return '<div class="card"><div class="section-head"><div><h3>'+esc(name)+'</h3><small>'+esc(desc)+'</small></div></div>'+body+'</div>'}
 function table(headers,rows){return window.table?window.table(headers,rows):'<div class="empty">Table unavailable</div>'}
 function dash(){
  const ps=allPlays(),s=summary(ps),games=groups(ps,'pff_DEFTEAM',false),bd=state.data.breakdowns||[];
  const gameRows=games.map(g=>{const sample=g.items[0]||{};return [esc(g.key),esc(get(sample,['pff_GAMEDATE'])||'—'),g.n,g.yards.toFixed(0),g.n?(g.yards/g.n).toFixed(2):'—',pct(g.items.filter(r=>String(r.pff_OFFSUCCESS||'').toUpperCase()==='T').length,g.n)]});
  const files=(state.config.breakdownFiles||[]).map(name=>{const b=bd.find(x=>x.name===name),rows=b?b.rows:[];return '<tr><td>'+esc(name)+'</td><td>'+esc(state.status[name]||'Awaiting upload')+'</td><td>'+(b?rows.length:'—')+'</td><td>'+rows.filter(r=>String(r.Formation||'').trim()).length+'</td><td>'+rows.filter(r=>String(get(r,['Run Concept','Pass Concept','Front','Proctection','Protection'])||'').trim()).length+'</td></tr>'}).join('');
  return title('Louisiana Tech · Week 7','Offensive staff workspace · Week of October 17, 2026 · 2026 season data only')+
   cards([['Offensive Plays',s.plays],['Yards',s.yards],['Yards per Play',s.avg.toFixed(2)],['Success Rate',s.successRate],['Run / Pass',s.run+' / '+s.pass],['Touchdowns',s.td],['Explosive Plays',s.explosive],['Games in Feed',games.length]])+
   section('Louisiana Tech Game Log','Offensive production by opponent from the supplied 2026 play feed.',table(['Defense','Date','Plays','Yards','YPP','Success'],gameRows))+
   section('Supplied Defensive Breakdown Files','Expected uploads are listed by exact name. The supplied files contain down, distance, field position and play identity; concept, formation, front and protection cells are blank pending charting.', '<div class="table-wrap"><table class="data-table"><thead><tr><th>Supplied file</th><th>Load status</th><th>Rows</th><th>Formation tags</th><th>Concept / front / protection tags</th></tr></thead><tbody>'+files+'</tbody></table></div>');
 }
 function depthPage(){
  const by=state.depth?.offense||{},rows=[];
  for(const [pos,players] of Object.entries(by))for(let i=0;i<Math.max(3,(players||[]).length);i++){const p=(players||[])[i];rows.push([esc(pos),i===0?'1st':i===1?'2nd':'3rd',p?'#'+esc(p[0])+' '+esc(p[1]):'—',p?esc(p[2]||''):'—'])}
  return title('Louisiana Tech Offensive Depth Chart','Week 7 · October 17, 2026 · Offense only · Source: '+(state.depth?.source||'uploaded depth-chart.json'))+
   section('Offensive Personnel','Depth order from the Louisiana Tech offense depth chart.',table(['Position','Order','Player','Class'],rows));
 }
 function playersPage(){
  const roster=depthPlayers(),rows=roster.map(p=>{
   const token=('LATC '+String(p.number).padStart(2,'0')),events=allPlays().filter(r=>[r.pff_PASSER,r.pff_BALLCARRIER,r.pff_PASSRECEIVERTARGET,r.pff_PASSROUTETARGET].some(v=>String(v||'').includes(token)));
   return [p.number?'#'+esc(p.number):'—',esc(p.name),esc(p.position),esc(p.class),events.length,events.reduce((a,r)=>a+n(r.pff_GAINLOSS),0)];
  });
  return title('Louisiana Tech Player Intelligence','Offensive depth-chart players linked to their appearances in the supplied play feed.')+
   section('Offensive Roster','Play appearances are matched by Louisiana Tech jersey number; yardage is team-play context, not individual player yardage.',table(['No.','Player','Position','Class','Linked plays','Team play yards'],rows));
 }
 function leadersPage(){
  const ps=allPlays(),byNumber=new Map(),getNum=v=>{const m=String(v||'').match(/LATC\s+(\d+)/);return m?m[1]:''};
  const add=(num,fn)=>{if(!num)return;const o=byNumber.get(num)||{att:0,comp:0,rec:0,tgt:0,run:0,rushY:0,recY:0,td:0};fn(o);byNumber.set(num,o)};
  for(const r of ps){const passer=getNum(r.pff_PASSER),carrier=getNum(r.pff_BALLCARRIER),target=getNum(r.pff_PASSRECEIVERTARGET),yd=n(r.pff_GAINLOSS),result=String(r.pff_PASSRESULT||'').toUpperCase();
   if(passer)add(passer,o=>{if(['COMPLETE','INCOMPLETE','BATTED PASS','THROWN AWAY'].includes(result))o.att++;if(result==='COMPLETE')o.comp++});
   if(carrier&&String(r.pff_RUNPASS||'').toUpperCase()==='R')add(carrier,o=>{o.run++;o.rushY+=yd;if(String(r.pff_TOUCHDOWN||'').includes('LATC'))o.td++});
   if(target&&['COMPLETE','INCOMPLETE','BATTED PASS','THROWN AWAY'].includes(result))add(target,o=>{o.tgt++;if(result==='COMPLETE'){o.rec++;o.recY+=yd;if(String(r.pff_TOUCHDOWN||'').includes('LATC'))o.td++}});
  }
  const names=new Map(depthPlayers().map(p=>[String(p.number).padStart(2,'0'),p.name+' · '+p.position]));
  const rows=[...byNumber.entries()].map(([num,o])=>[esc(num),esc(names.get(String(num).padStart(2,'0'))||'Louisiana Tech player'),o.att,o.comp,o.run,o.rushY,o.tgt,o.rec,o.recY,o.td]).sort((a,b)=>(Number(b[5])||0)+(Number(b[8])||0)-(Number(a[5])||0)-(Number(a[8])||0));
  return title('Offensive Leaders','Appearances and events from the supplied 2026 play feed. Player yardage is reported only where the feed ties the event to the ball carrier.')+
   section('Player Events','Completions, carries and receptions use the PFF play result and player tags.',table(['No.','Player','Pass Att','Comp','Carries','Rush Yds','Targets','Rec','Rec Yds','TDs'],rows));
 }
 function overviewBy(field,label,ps=allPlays()){
  return title(label,'Louisiana Tech offensive play production grouped from the loaded 2026 PFF feed.')+
   section(label+' Results','Play count, share, total yards and yards per play.',table(['Category','Plays','Usage','Yards','YPP'],rowsFor(ps,field)));
 }
 function situ(){
  const ps=allPlays(),downs=groups(ps.filter(r=>String(r.pff_NOPLAY||'').toUpperCase()!=='T'),'pff_DOWN');
  const rows=downs.map(g=>[esc(g.key),g.n,g.yards.toFixed(0),(g.yards/g.n).toFixed(2),pct(g.items.filter(r=>String(r.pff_OFFSUCCESS||'').toUpperCase()==='T').length,g.n)]);
  return title('Situations','Down, distance and field-position performance from Louisiana Tech offensive snaps.')+
   section('Down Results','Offensive success is the PFF offensive-success flag in the feed.',table(['Down','Plays','Yards','YPP','Success'],rows))+
   section('Distance to Go','Distribution across supplied distance values.',table(['Distance','Plays','Usage','Yards','YPP'],rowsFor(ps,'pff_DISTANCE')));
 }
 function breakdownPage(){
  const all=(state.data.breakdowns||[]).flatMap(b=>b.rows.map(r=>({...r,__game:b.label})));
  const filled=(key)=>all.filter(r=>String(get(r,[key])||'').trim());
  const cols=[['Run Concept','Run Concept'],['Pass Concept','Pass Concept'],['Formation','Formation'],['Front','Defensive Front'],['Proctection','Protection']];
  const rows=cols.map(([field,label])=>[esc(label),filled(field).length,pct(filled(field).length,all.length)]);
  const games=(state.config.breakdownFiles||[]).map(name=>{const b=(state.data.breakdowns||[]).find(x=>x.name===name);return [esc(name),b?b.rows.length:'—',esc(state.status[name]||'Awaiting upload'),b?pct(b.rows.filter(r=>String(r['Down']||'').trim()).length,b.rows.length):'—',b?pct(b.rows.filter(r=>String(r['Field Position']||'').trim()).length,b.rows.length):'—']});
  const sheetRows=all.map(r=>[esc(r.__game),esc(r['#']),esc(r.Down||'—'),esc(r.Distance||'—'),esc(r['Field Position']||'—'),esc(r['R/P']||'—'),esc(r.Formation||'Awaiting chart'),esc(r['Run Concept']||r['Pass Concept']||'Awaiting chart'),esc(r.Front||'Awaiting chart')]);
  return title('Defensive Game Breakdowns','Five supplied game sheets under their original filenames. Empty chart fields are shown as awaiting charting.')+
   section('Charting Completion','Completeness checks prevent blank input cells from appearing as zero-value tendencies.',table(['Category','Tagged rows','Share of plays'],rows))+
   section('Game Sheets','The five uploads are checked independently so each opponent and week is preserved.',table(['Game file','Rows','Load status','Down tagged','Field position tagged'],games))+
   section('Play-by-Play Sheet Rows','Down, distance and field position are available in the supplied files; missing film labels remain visibly uncharted.',table(['Game','Play','Down','Distance','Field position','R/P','Formation','Concept','Front'],sheetRows));
 }
 function page(pageName){
  const ps=allPlays();
  if(!ps.length)return title('Louisiana Tech · Week 7','Offensive staff workspace')+'<div class="card notice"><b>Play feed is not loaded.</b><p>Expected '+esc(state.config.playsFile||'play_feed-5.csv')+' in the Offensive Intelligence / Louisiana Tech / Current folder.</p></div>'+statusHTML();
  if(pageName==='dashboard')return dash();
  if(pageName==='depthchart')return depthPage();
  if(pageName==='players')return playersPage();
  if(pageName==='leaders')return leadersPage();
  if(pageName==='missedtackles')return overviewBy('pff_MISSEDTACKLE','Missed Tackles Forced');
  if(pageName==='personnel')return overviewBy('pff_OFFPERSONNEL','Personnel & Fronts')+section('Defensive Fronts Faced','Front tags from each defensive response.',table(['Front','Plays','Usage','Yards','YPP'],rowsFor(ps,'pff_DEFENSIVE_FRONT_NAME')));
  if(pageName==='run')return overviewBy('pff_RUNCONCEPTPRIMARY','Run Game');
  if(pageName==='qbrun')return overviewBy('pff_RUNPASS','Quarterback Run Game',ps.filter(r=>String(r.pff_PASSER||'').includes('(QB)')||String(r.pff_BALLCARRIER||'').includes('(QB)')));
  if(pageName==='pass')return overviewBy('pff_PASSROUTETARGETGROUP','Pass Game');
  if(pageName==='coverage')return overviewBy('pff_PASS_COVERAGE_BASIC','Coverage Faced');
  if(pageName==='pressure')return overviewBy('pff_BLITZDOG','Pressure & Blitz');
  if(pageName==='situations')return situ();
  if(pageName==='heatmaps')return overviewBy('pff_FIELDPOSITION','Field Position');
  if(pageName==='formations')return overviewBy('pff_OFFENSIVE_FORMATION_NAME','Offensive Formations');
  if(pageName==='structures')return overviewBy('pff_OFF_PERSONNEL_GROUP','Offensive Structure');
  if(pageName==='advantage')return breakdownPage();
  return dash();
 }
 function statusHTML(){return '<div class="card"><b>Louisiana Tech uploads</b><p>'+Object.entries(state.status).map(([k,v])=>esc(k)+': '+esc(v)).join(' · ')+'</p></div>'}
 return {state,load,depthPlayers,page,statusHTML};
})();
