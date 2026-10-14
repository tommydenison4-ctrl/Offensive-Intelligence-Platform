/* Louisiana Tech Week 7: offensive staff scouting workspace. */
window.LaTech = (() => {
 const defaultConfig={
  team:'Louisiana Tech',season:2026,week:7,
  storageBase:'https://hzrosmevuejjlxigdxmg.supabase.co/storage/v1/object/public/Offensive%20Intelligence/Current/Louisiana%20Tech/',
  playsFile:'play_feed-5.csv',
  offenseBreakdownFile:'ALL_BREAKDOWN_GAMES.csv',
  breakdownFiles:[
   '26_01_LA_Tech_D_vs_Northwestern_Louisiana_.csv',
   '26_02_LA_Tech_D_vs_LSU.csv',
   '26_03_LA_Tech_D_vs_Baylor.csv',
   '26_04_LA_Tech_D_vs_Army.csv',
   '2606_Louisiana_Tech_D_vs_Louisiana-_Lafayette.csv'
  ],
  teamField:'pff_OFFTEAM',teamCodes:['LATC'],rosterFile:'roster.json'
 };
 const state={config:defaultConfig,data:{plays:[],defensivePlays:[],breakdowns:[],internalPlays:[]},status:{},depth:null,roster:null,enrichment:{},pffReports:[],defensePffReports:[],loading:false,version:0,selectedPlayer:''};
 const officialProfiles={
  'Trey Kukuk':'https://latechsports.com/sports/football/roster/trey-kukuk/14612','Blake Baker':'https://latechsports.com/sports/football/roster/blake-baker/14582','Jackson Bradley':'https://latechsports.com/sports/football/roster/jackson-bradley/14587','Jaden Miller':'https://latechsports.com/sports/football/roster/jaden-miller/14673','Dylone Brooks':'https://latechsports.com/sports/football/roster/dylone-brooks/14588',
  'Jay Wilkerson':'https://latechsports.com/sports/football/roster/jay-wilkerson/14643','Marcus Calwise Jr.':'https://latechsports.com/sports/football/roster/marcus-calwise-jr/14664','Carter Harris':'https://latechsports.com/sports/football/roster/carter-harris/14752','Talyn Shettron':'https://latechsports.com/sports/football/roster/talyn-shettron/14681','Luke Watkins':'https://latechsports.com/sports/football/roster/luke-watkins/14639','Jalen Mickens':'https://latechsports.com/sports/football/roster/jalen-mickens/14620','Dedrick Latulas':'https://latechsports.com/sports/football/roster/dedrick-latulas/14613','David Pierro':'https://latechsports.com/sports/football/roster/david-pierro/14626',
  'Hayden Christman':'https://latechsports.com/sports/football/roster/hayden-christman/14591','Tadan Bingham':'https://latechsports.com/sports/football/roster/tadan-bingham/14744','Ashanti Cole':'https://latechsports.com/sports/football/roster/ashanti-cole/14592','Roy Brackins III':'https://latechsports.com/sports/football/roster/roy-brackins-iii/14585','Andrew Richard':'https://latechsports.com/sports/football/roster/andrew-richard/14628','Austin Ellis':'https://latechsports.com/sports/football/roster/austin-ellis/14599','Will Hutchens':'https://latechsports.com/sports/football/roster/will-hutchens/14608','Troy Smith III':'https://latechsports.com/sports/football/roster/troy-smith-iii/14636','Tye Hylton':'https://latechsports.com/sports/football/roster/tye-hylton/14679','Eli Finley':'https://latechsports.com/sports/football/roster/eli-finley/14601'
 };
 const officialRosterUrl='https://latechsports.com/sports/football/roster/';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const n=x=>{const v=Number(String(x??'').replace(/[^0-9.-]/g,''));return Number.isFinite(v)?v:0};
 const get=(r,keys)=>{for(const k of keys){if(r&&r[k]!=null&&String(r[k]).trim()!=='')return r[k]}return ''};
 const fileLabel=f=>f;
 async function response(url){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);try{return await fetch(url,{cache:'no-store',signal:ctl.signal})}finally{clearTimeout(timer)}}
 async function load(parse){
  const version=++state.version;state.loading=true;state.data={plays:[],defensivePlays:[],breakdowns:[],internalPlays:[]};state.status={};
  try{const r=await response('./louisiana-tech/upload-manifest.json');if(r.ok)state.config={...defaultConfig,...await r.json()}}catch(_){}
  const cfg=state.config,base=cfg.storageBase,stamp='?v='+Date.now();
  const loadFile=async name=>{const r=await response(base+encodeURIComponent(name)+stamp);if(!r.ok)throw Error('HTTP '+r.status);return parse(await r.text())};
  try{const r=await response(base+encodeURIComponent(cfg.depthFile||'depth-chart.json')+stamp);if(r.ok)state.depth=await r.json()}catch(_){}
  if(!state.depth){try{const r=await response('./louisiana-tech/depth-chart.json');if(r.ok)state.depth=await r.json()}catch(_){}}
  try{const r=await response('./louisiana-tech/roster-enrichment.json');if(r.ok){const x=await r.json();state.enrichment=x.players||{}}}catch(_){}
  try{const r=await response('./louisiana-tech/pff-player-reports.json');if(r.ok){const x=await r.json();state.pffReports=x.reports||[];state.status.pffReports='Loaded '+state.pffReports.reduce((a,x)=>a+(x.rows||[]).length,0)+' rows from supplied pff-data-14.csv through pff-data-29.csv'}}catch(_){state.pffReports=[]}
  let bundledDefenseReports=[];
  try{const r=await response('./louisiana-tech/pff-defense-reports.json');if(r.ok){const x=await r.json();bundledDefenseReports=x.reports||[]}}catch(_){bundledDefenseReports=[]}
  const defenseReportFiles=Array.from({length:17},(_,i)=>`pff-data-${i+30}.csv`);
  state.defensePffReports=await Promise.all(defenseReportFiles.map(async file=>{
   const fallback=bundledDefenseReports.find(x=>x.file===file)||{file,rows:[],fields:[]};
   try{const rows=await loadFile(file);return {...fallback,rows,fields:rows.length?Object.keys(rows[0]):fallback.fields,source:'Supabase'}}
   catch(_){return {...fallback,source:'bundled fallback'}}
  }));
  const liveDefenseFileCount=state.defensePffReports.filter(x=>x.source==='Supabase').length;
  const defenseReportRowCount=state.defensePffReports.reduce((a,x)=>a+(x.rows||[]).length,0);
  state.status.pffDefenseReports='Loaded '+defenseReportRowCount+' rows from '+liveDefenseFileCount+' of 17 Supabase PFF files; bundled data backs up files that are not uploaded yet';
  let plays=[];
  try{
   plays=await loadFile(cfg.playsFile||'play_feed-5.csv');
   plays=plays.filter(r=>cfg.teamCodes.includes(String(r[cfg.teamField]||'').trim())&&String(r.pff_GAMESEASON||'')==='2026');
   state.status.plays=plays.length?'Loaded '+plays.length+' Louisiana Tech offensive plays':'Rejected: no LATC 2026 offense rows';
  }catch(e){state.status.plays='Awaiting upload ('+String(e.message||'unreachable')+')'}
  let defensivePlays=[];
  try{
   const file=cfg.defensivePlaysFile||'play_feed-6.csv';
   const rows=await loadFile(file);
   defensivePlays=rows.filter(r=>String(r.pff_DEFTEAM||'').trim()==='LATC'&&String(r.pff_GAMESEASON||'')==='2026');
   if(!defensivePlays.length)throw Error('no LATC 2026 defensive rows');
   state.status.defensivePlays='Loaded '+defensivePlays.length+' Louisiana Tech opponent-offense plays from '+file;
  }catch(e){state.status.defensivePlays='Awaiting '+(cfg.defensivePlaysFile||'play_feed-6.csv')+' ('+String(e.message||'unreachable')+')'}
  const breakdowns=[];
  for(const name of cfg.breakdownFiles||[]){
   try{const rows=await loadFile(name);breakdowns.push({name,label:fileLabel(name),rows});state.status[name]='Loaded '+rows.length+' rows'}
   catch(e){state.status[name]='Awaiting upload ('+String(e.message||'unreachable')+')'}
  }
  let internalPlays=[];
  try{internalPlays=await loadFile(cfg.offenseBreakdownFile||'ALL_BREAKDOWN_GAMES.csv');state.status.internalPlays='Loaded '+internalPlays.length+' offensive breakdown plays from Supabase'}
  catch(e){try{const r=await response('./louisiana-tech/ALL_BREAKDOWN_GAMES.csv');if(!r.ok)throw Error('HTTP '+r.status);internalPlays=parse(await r.text());state.status.internalPlays='Loaded '+internalPlays.length+' offensive breakdown plays from bundled file (Supabase: '+String(e.message||'unreachable')+')'}catch(localError){state.status.internalPlays='Awaiting '+(cfg.offenseBreakdownFile||'ALL_BREAKDOWN_GAMES.csv')+' ('+String(localError.message||'unreachable')+')'}}
  let rosterData=null;
  try{const r=await response(base+encodeURIComponent(cfg.rosterFile||'roster.json')+stamp);if(r.ok){const x=await r.json();rosterData=Array.isArray(x)?x:(x.players||x.roster||x.offense);if(!Array.isArray(rosterData))rosterData=null;state.status.roster=rosterData?'Loaded '+rosterData.length+' roster records':'Roster file has no player list'}}catch(e){state.status.roster='Roster details unavailable ('+String(e.message||'unreachable')+')'}
  if(version!==state.version)return null;
  state.data={plays,defensivePlays,breakdowns,internalPlays};state.roster=rosterData;state.loading=false;return state;
 }
 function depthPlayers(){
  const rows=[],by=state.depth?.offense||{},meta=state.roster||[];
  for(const [position,players] of Object.entries(by))for(const p of players||[]){
   const number=String(p[0]||''),name=String(p[1]||''),extra=meta.find(x=>String(get(x,['name','Name'])).trim().toLowerCase()===name.trim().toLowerCase())||meta.find(x=>String(get(x,['number','jersey','jerseyNumber','#'])).replace(/^0+(?=\d)/,'')===number.replace(/^0+(?=\d)/,''))||{};
   const enrich=state.enrichment[name]||{};
   rows.push({...enrich,...extra,number,name,position:String(get(extra,['position','Position'])||position),class:String(get(extra,['class','Class','year'])||p[2]||''),height:get(extra,['height','Height'])||enrich.height,weight:get(extra,['weight','Weight'])||enrich.weight,hometown:get(extra,['hometown','Hometown'])||enrich.hometown,previousSchool:get(extra,['previousSchool','previous_school','Previous School'])||enrich.previousSchool,highSchool:get(extra,['highSchool','high_school','lastSchool'])||enrich.highSchool,image:get(extra,['image','imageUrl','image_url','photo','photoUrl','headshot','headshotUrl','portrait'])||enrich.image,profile:get(extra,['profile','profileUrl','bioUrl','url'])||enrich.profile||officialProfiles[name]||officialRosterUrl,bio:get(extra,['bio','biography','Bio'])||enrich.bio});
  }
  return rows;
 }
 function offensiveRoster(){
  const roster=new Map(),allowed=new Set(['QB','RB','WR','TE','OL']);
  for(const [name,x] of Object.entries(state.enrichment||{}))if(allowed.has(String(x.position||'').toUpperCase()))roster.set(name,{...x,name,number:String(x.number||''),position:String(x.position||'')});
  for(const x of state.roster||[]){const name=String(get(x,['name','Name'])||'').trim(),position=String(get(x,['position','Position'])||'').toUpperCase();if(!name||!allowed.has(position))continue;const old=roster.get(name)||{};roster.set(name,{...old,...x,name,number:String(get(x,['number','jersey','jerseyNumber','#'])||old.number||''),position,image:get(x,['image','imageUrl','image_url','photo','headshot'])||old.image,profile:get(x,['profile','profileUrl','bioUrl','url'])||old.profile||officialProfiles[name]||officialRosterUrl,bio:get(x,['bio','biography','Bio'])||old.bio});}
  for(const p of depthPlayers()){const old=roster.get(p.name)||{};roster.set(p.name,{...old,...p,class:p.class||old.class});}
  const order={QB:0,RB:1,WR:2,TE:3,OL:4};return [...roster.values()].sort((a,b)=>(order[a.position]??9)-(order[b.position]??9)||Number(a.number)-Number(b.number)||a.name.localeCompare(b.name));
 }
 function allPlays(){return state.data.plays||[]}
 function groups(rows,field,label){
  const m=new Map();for(const r of rows){const k=String(get(r,[field])||'Unknown').trim()||'Unknown';if(!m.has(k))m.set(k,[]);m.get(k).push(r)}
  return [...m].map(([key,items])=>({key,items,n:items.length,yards:items.reduce((a,r)=>a+n(r.pff_GAINLOSS),0)})).sort((a,b)=>b.n-a.n);
 }
 function internalPlays(){return state.data.internalPlays||[]}
 function tagGroups(rows,field){const src=rows.filter(r=>String(get(r,[field])||'').trim()),m=new Map();for(const r of src){const key=String(get(r,[field])).trim();if(!m.has(key))m.set(key,[]);m.get(key).push(r)}return [...m].map(([key,items])=>({key,items,n:items.length,yards:items.reduce((a,r)=>a+n(r.Gain),0)})).sort((a,b)=>b.n-a.n)}
 function taggedRows(rows,field){const denom=rows.length;return tagGroups(rows,field).map(g=>[esc(g.key),g.n,pct(g.n,denom),g.yards.toFixed(0),(g.yards/g.n).toFixed(2)])}
 function internalGame(row){const name=String(get(row,['Name'])||'');return name.split(/,\s*Play\s*\d+/i)[0]||'Unlabeled game'}
 function internalGames(rows){const m=new Map();for(const r of rows){const k=internalGame(r);if(!m.has(k))m.set(k,[]);m.get(k).push(r)}return [...m].map(([key,items])=>({key,items,n:items.length,yards:items.reduce((a,r)=>a+n(r.Gain),0)})).sort((a,b)=>a.key.localeCompare(b.key))}
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
  const src=(validOnly?rows.filter(r=>String(r.pff_NOPLAY||'').toUpperCase()!=='T'):rows).filter(r=>String(r[field]||'').trim());
  return groups(src,field).map(g=>[esc(g.key),g.n,pct(g.n,src.length),g.yards.toFixed(0),g.n?(g.yards/g.n).toFixed(2):'—']);
 }
 function playerMatch(value,p){const num=String(p.number||'').replace(/^0+(?=\d)/,'');return num!==''&&new RegExp('\\bLATC\\s+0*'+num+'\\b','i').test(String(value||''))}
 function playerEvents(p){const pos=String(p.position||'').toUpperCase();return allPlays().filter(r=>{
  if(['QB'].includes(pos))return playerMatch(r.pff_PASSER,p)||playerMatch(r.pff_BALLCARRIER,p);
  if(['RB','HB','FB'].includes(pos))return playerMatch(r.pff_BALLCARRIER,p)||playerMatch(r.pff_PASSRECEIVERTARGET,p);
  if(['WR','TE','H','X','Z'].some(x=>pos.includes(x)))return playerMatch(r.pff_PASSRECEIVERTARGET,p)||playerMatch(r.pff_PASSROUTETARGET,p);
  return playerMatch(r.pff_OFFPLAYERS,p);
 })}
 function playerStats(p){const rows=playerEvents(p),pos=String(p.position||'').toUpperCase(),games=new Map();let carries=0,rushY=0,targets=0,recs=0,recY=0,attempts=0,comps=0,passY=0,td=0,ints=0;
  for(const r of rows){const id=String(r.pff_GAMEID||r.pff_GAMEDATE||'Unknown'),g=games.get(id)||{date:r.pff_GAMEDATE||'',opp:r.pff_DEFTEAM||'Opponent',plays:0,rush:0,rushY:0,target:0,rec:0,recY:0,att:0,comp:0,passY:0,td:0,int:0};g.plays++;const y=n(get(r,['pff_GAINLOSSNET','pff_GAINLOSS'])),result=String(r.pff_PASSRESULT||'').toUpperCase(),isCarrier=playerMatch(r.pff_BALLCARRIER,p),isPasser=playerMatch(r.pff_PASSER,p),isTarget=playerMatch(r.pff_PASSRECEIVERTARGET,p);
   if(isCarrier&&String(r.pff_RUNPASS||'').toUpperCase()==='R'){carries++;rushY+=y;g.rush++;g.rushY+=y}
   if(isPasser){if(['COMPLETE','INCOMPLETE','INTERCEPTION','THROWN AWAY','HIT AS THREW','BATTED PASS'].includes(result)){attempts++;g.att++}if(result==='COMPLETE'){comps++;g.comp++}passY+=y;g.passY+=y;if(result==='INTERCEPTION'||String(r.pff_INTERCEPTION||'').trim()) {ints++;g.int++}}
   if(isTarget){targets++;g.target++;if(result==='COMPLETE'){recs++;recY+=y;g.rec++;g.recY+=y}}
   if(String(r.pff_TOUCHDOWN||'').includes('LATC')){td++;g.td++}games.set(id,g);
  }return {rows,carries,rushY,targets,recs,recY,attempts,comps,passY,td,ints,games:[...games.values()].sort((a,b)=>String(a.date).localeCompare(String(b.date)))};
 }
 const pffPlayerSpecs=[
  ['pff-data-14.csv','Passing',['PASS GRD','ATT','COMP','COMP%','PASS YDS','PASS YPA','PASS TD','INT','SK']],
  ['pff-data-18.csv','Passing by pressure',['PRESS PLAY','PASS GRD','ATT','COMP','COMP%','PASS YDS','PASS TD','INT','SK']],
  ['pff-data-19.csv','Receiving',['REC GRD','TGT','REC','REC YDS','REC TD','DP','YPR','YPT']],
  ['pff-data-20.csv','Rushing',['RUSH GRD','ATT','RUSH YDS','RUN TD','YPC','STUFF','FUM']],
  ['pff-data-23.csv','Run blocking',['RBLK GRD','RBLK','IMPACT RBLK','IMPACT RBLK%','DEFEATED RBLK','DEFEATED RBLK%']],
  ['pff-data-24.csv','Pass blocking',['PBLK GRD','PBLK','SK','HT','KD','HU','PR']],
  ['pff-data-29.csv','11-personnel usage',['11P','RUN%','PASS%','ED SNAPS','ED RUN%','ED PASS%','CD SNAPS','CD RUN%','CD PASS%']]
 ];
 function playerPffRows(p){const key=String(p.name||'').toLowerCase().replace(/[^a-z0-9]/g,'');return pffPlayerSpecs.flatMap(([file,label,fields])=>{const report=state.pffReports.find(x=>x.file===file);if(!report)return[];const rows=(report.rows||[]).filter(r=>String(r.Name||'').toLowerCase().replace(/[^a-z0-9]/g,'')===key);return rows.map(r=>({file,label,fields,values:fields.map(k=>r[k]||'')})).filter(x=>x.values.some(Boolean))})}
 function playerPffGrade(p){const rows=playerPffRows(p),pos=String(p.position||'').toUpperCase(),wanted=pos==='QB'?'PASS GRD':['RB','HB','FB'].includes(pos)?'RUSH GRD':['WR','TE'].includes(pos)?'REC GRD':'RBLK GRD';const row=rows.find(x=>x.fields.includes(wanted)&&x.values[x.fields.indexOf(wanted)]);return row?{label:wanted==='PASS GRD'?'PFF pass grade':wanted==='RUSH GRD'?'PFF rush grade':wanted==='REC GRD'?'PFF receiving grade':'PFF run-block grade',value:row.values[row.fields.indexOf(wanted)]}:null}
 function playerPffSection(p){const rows=playerPffRows(p);if(!rows.length)return section('PFF Season Reports','No supplied PFF player report matched this player.','<div class="empty">PFF reports are loaded for '+state.pffReports.reduce((a,x)=>a+(x.rows||[]).length,0)+' rows.</div>');return section('PFF Season Reports','Supplemental LA Tech PFF reports, shown by the supplied report category and source file.',rows.map(x=>'<h4>'+esc(x.label)+' · '+esc(x.file)+'</h4>'+table(x.fields,[x.values.map(esc)])).join(''))}
 function pffTeamSection(file,titleName,fields){const report=state.pffReports.find(x=>x.file===file);if(!report||!(report.rows||[]).length)return '';const rows=report.rows.map(r=>fields.map(k=>esc(r[k]||'—')));return section(titleName,'Supplied PFF report · '+file,table(fields,rows))}
 function pffTeamReports(){if(!state.pffReports.length)return '';return '<div class="lt-two">'+pffTeamSection('pff-data-17.csv','PFF Passing Summary',['PASS GRD','DB','ATT','COMP','COMP%','PASS YDS','PASS YPA','PASS TD','INT','BTT','TWP','SK'])+pffTeamSection('pff-data-21.csv','PFF Run Concepts',['RC','RUSH','RUSH YDS','RUN TD','YPC','YBC/ATT','YCO','STUFF','FUM'])+pffTeamSection('pff-data-22.csv','PFF Point of Attack Mix',['RC','RUSH','LE (D)%','LT (C)%','LG (B)%','ML (A)%','MR (A)%','RG (B)%','RT (C)%','RE (D)%'])+pffTeamSection('pff-data-25.csv','PFF Formation Usage',['Final Formation Group','OFF%','OFF','RUN%','PASS%','RPO%','SCRN%','TEMPO%'])+pffTeamSection('pff-data-26.csv','PFF Personnel Usage',['O PERS','OFF%','OFF','RUN%','PASS%','RPO%','SCRN%','ED SNAPS','ED RUN%','ED PASS%','CD SNAPS','CD RUN%','CD PASS%'])+pffTeamSection('pff-data-27.csv','PFF Weekly Personnel Usage',['Week','Opp','OFF','10PERS%','11PERS%','12PERS%','20PERS%','21PERS%'])+'</div>'}
 function playerCard(p){const s=playerStats(p),img=p.image?'<img src="'+esc(p.image)+'" alt="'+esc(p.name)+'" onerror="this.remove()">':'<div class="lt-initials">'+esc(String(p.name||'?').split(/\s+/).map(x=>x[0]).join('').slice(0,2))+'</div>';
  let main=String(p.position||'').toUpperCase().includes('QB')?s.passY+' pass yds':(['WR','TE','RB','HB','FB'].some(x=>String(p.position||'').toUpperCase().includes(x))?s.recY+s.rushY+' scrimmage yds':s.rows.length+' linked plays');
  const grade=playerPffGrade(p);return '<button class="lt-player-card" onclick="LaTech.selectPlayer(decodeURIComponent(\''+encodeURIComponent(p.name)+'\'))"><div class="lt-player-photo">'+img+'<span>#'+esc(p.number)+'</span></div><div class="lt-player-body"><b>'+esc(p.name)+'</b><small>'+esc(p.position)+' · '+esc(p.class)+'</small><div class="lt-player-metrics"><strong>'+s.rows.length+'</strong> linked plays <strong>'+main+'</strong></div>'+(grade?'<small>'+esc(grade.label)+': <b>'+esc(grade.value)+'</b></small>':'')+'</div></button>';
 }
 function playerProfile(p){const s=playerStats(p),meta=[p.position,p.class,p.height,p.weight?p.weight+' lbs':'',p.hometown,p.previousSchool].filter(Boolean).map(esc).join(' · '),g=s.games.map(x=>[esc(x.date),esc(x.opp),x.plays,x.rush,x.rushY,x.target,x.rec,x.recY,x.att,x.comp,x.passY,x.td,x.int]);
  const vals=String(p.position||'').toUpperCase().includes('QB')?[['Pass yds',s.passY],['Comp / Att',s.comps+' / '+s.attempts],['Rush',s.carries+' · '+s.rushY+' yds'],['TD',s.td],['INT',s.ints]]:['RB','HB','FB'].some(x=>String(p.position||'').toUpperCase().includes(x))?[['Carries',s.carries],['Rush yds',s.rushY],['Targets',s.targets],['Receptions',s.recs],['Receiving yds',s.recY],['TD',s.td]]:[['Targets',s.targets],['Receptions',s.recs],['Receiving yds',s.recY],['Rush yds',s.rushY],['TD',s.td]];
  return '<div class="lt-profile-head"><button onclick="LaTech.selectPlayer(\'\')">← All Players</button><div class="lt-profile-bio"><div><b>'+esc(p.name)+'</b><p>#'+esc(p.number)+' · '+meta+'</p><p>'+(p.bio?esc(p.bio):'Official player biography and current details are available from Louisiana Tech Athletics.')+'</p>'+(p.highSchool?'<p>High school: '+esc(p.highSchool)+'</p>':'')+(p.previousSchool?'<p>Previous school: '+esc(p.previousSchool)+'</p>':'')+(p.profile?'<a target="_blank" rel="noopener" href="'+esc(p.profile)+'">Official Louisiana Tech Bio ↗</a>':'')+'</div></div></div>'+cards(vals)+section('Game-by-Game Production','Events tied to this player in the 2026 supplied play feed. The roster number is matched to the feed’s LATC player tag.',table(['Date','Opponent','Linked plays','Carries','Rush yds','Targets','Rec','Rec yds','Pass att','Comp','Pass yds','TD','INT'],g))+playerPffSection(p);
 }
 function title(name,desc){return '<div class="page-title"><h2>'+esc(name)+'</h2><p>'+esc(desc)+'</p></div>'}
 function cards(items){return '<div class="kpis">'+items.map(x=>'<div class="kpi"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join('')+'</div>'}
 function section(name,desc,body){return '<div class="card"><div class="section-head"><div><h3>'+esc(name)+'</h3><small>'+esc(desc)+'</small></div></div>'+body+'</div>'}
 function table(headers,rows){return window.table?window.table(headers,rows):'<div class="empty">Table unavailable</div>'}
 function dash(){
  const ps=allPlays(),s=summary(ps),games=groups(ps,'pff_DEFTEAM',false),bd=state.data.breakdowns||[],ip=internalPlays(),runs=ip.filter(r=>String(r['R/P']||'').trim().toUpperCase()==='R'),passes=ip.filter(r=>String(r['R/P']||'').trim().toUpperCase()==='P');
  const gameRows=games.map(g=>{const sample=g.items[0]||{};return [esc(g.key),esc(get(sample,['pff_GAMEDATE'])||'—'),g.n,g.yards.toFixed(0),g.n?(g.yards/g.n).toFixed(2):'—',pct(g.items.filter(r=>String(r.pff_OFFSUCCESS||'').toUpperCase()==='T').length,g.n)]});
  const files=(state.config.breakdownFiles||[]).map(name=>{const b=bd.find(x=>x.name===name),rows=b?b.rows:[];return '<tr><td>'+esc(name)+'</td><td>'+esc(state.status[name]||'Awaiting upload')+'</td><td>'+(b?rows.length:'—')+'</td><td>'+rows.filter(r=>String(get(r,['Formation','pff_OFFFORMATIONGROUP','pff_OFFFORMATION'])||'').trim()).length+'</td><td>'+rows.filter(r=>String(get(r,['Run Concept','Pass Concept','pff_RUNCONCEPTPRIMARY','Front','pff_FRONTTYPE','Proctection','Protection'])||'').trim()).length+'</td></tr>'}).join('');
  return title('Louisiana Tech · Week 7','Offensive staff workspace · Week of October 17, 2026 · 2026 season data only')+
   cards([['Offensive Plays',s.plays],['Yards',s.yards],['Yards per Play',s.avg.toFixed(2)],['Success Rate',s.successRate],['Run / Pass',s.run+' / '+s.pass],['Touchdowns',s.td],['Explosive Plays',s.explosive],['Games in Feed',games.length]])+
   section('Louisiana Tech Game Log','Offensive production by opponent from the supplied 2026 play feed.',table(['Defense','Date','Plays','Yards','YPP','Success'],gameRows))+
   section('Louisiana Tech Offensive Breakdown Language','Exact call tags from '+(state.config.offenseBreakdownFile||'ALL_BREAKDOWN_GAMES.csv')+'. This is separate from the opponent defensive game sheets.',cards([['Tagged Offensive Plays',ip.length],['Run Calls',runs.length],['Pass Calls',passes.length],['Run Concepts',tagGroups(runs,'Run Concept').length],['Pass Concepts',tagGroups(passes,'Pass Concept').length],['Named Formations',tagGroups(ip,'Formation').length]])+'<p>'+esc(state.status.internalPlays||'Offensive breakdown file not loaded')+'</p>')+
   section('Supplied Defensive Breakdown Files','Expected opponent defense uploads are listed by their original filenames. These game sheets remain separate from Louisiana Tech offensive play language.', '<div class="table-wrap"><table class="data-table"><thead><tr><th>Supplied file</th><th>Load status</th><th>Rows</th><th>Formation tags</th><th>Concept / front / protection tags</th></tr></thead><tbody>'+files+'</tbody></table></div>')+
   section('Louisiana Tech PFF Team Reports','Supplemental season reports from the supplied pff-data-14.csv through pff-data-29.csv files. These offense reports are kept separate from opponent-defense scouting.',pffTeamReports());
 }
 function depthPage(){
  const by=state.depth?.offense||{},rows=[];
  for(const [pos,players] of Object.entries(by))for(let i=0;i<Math.max(3,(players||[]).length);i++){const p=(players||[])[i];rows.push([esc(pos),i===0?'1st':i===1?'2nd':'3rd',p?'#'+esc(p[0])+' '+esc(p[1]):'—',p?esc(p[2]||''):'—'])}
  return title('Louisiana Tech Offensive Depth Chart','Week 7 · October 17, 2026 · Offense only · Source: '+(state.depth?.source||'uploaded depth-chart.json'))+
   section('Offensive Personnel','Depth order from the Louisiana Tech offense depth chart.',table(['Position','Order','Player','Class'],rows));
 }
 function playersPage(){
  const players=offensiveRoster(),selected=players.find(p=>p.name===state.selectedPlayer);
  return title('Louisiana Tech Player Intelligence','Full offensive roster · Official LA Tech biographies and portraits · 2026 play-feed production.')+
   (selected?playerProfile(selected):section('Offensive Player Profiles',players.length+' offensive roster players. Select a player to open their biography, headshot and individual production.', '<div class="lt-player-grid">'+players.map(playerCard).join('')+'</div>'));
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
 function runGamePage(){const all=internalPlays(),ps=all.filter(r=>String(r['R/P']||'').trim().toUpperCase()==='R'),yards=ps.reduce((a,r)=>a+n(r.Gain),0),byGame=internalGames(ps),gameRows=byGame.map(g=>[esc(g.key),g.n,g.yards.toFixed(0),(g.yards/g.n).toFixed(2),tagGroups(g.items,'Run Concept')[0]?.key||'—']);
  return title('Louisiana Tech Run Game','Run calls and results from the exact offensive terminology in '+(state.config.offenseBreakdownFile||'ALL_BREAKDOWN_GAMES.csv')+'.')+cards([['Run Plays',ps.length],['Tagged Run Yards',yards],['Yards per Call',ps.length?(yards/ps.length).toFixed(2):'—'],['Named Run Concepts',tagGroups(ps,'Run Concept').length],['Play Types',tagGroups(ps,'Play Type').length],['Source Plays',all.length]])+
   '<p class="lt-data-source">'+esc(state.status.internalPlays||'Offensive breakdown file not loaded')+'</p>'+section('Run Production by Game','Gain and the game names are read from the internal breakdown rows.',table(['Game','Run calls','Gain','Gain per call','Most used run concept'],gameRows))+
   '<div class="lt-two">'+section('Run Concepts','Exact Run Concept labels from the offensive sheet.',table(['Run Concept','Calls','Usage','Gain','Avg gain'],taggedRows(ps,'Run Concept')))+section('Run Play Types','Exact Play Type labels from the offensive sheet.',table(['Play Type','Calls','Usage','Gain','Avg gain'],taggedRows(ps,'Play Type')))+section('Run Formations','Exact formation language, with formation variation.',table(['Formation','Calls','Usage','Gain','Avg gain'],taggedRows(ps,'Formation')))+section('Backfield','Backfield labels from the sheet.',table(['Backfield','Calls','Usage','Gain','Avg gain'],taggedRows(ps,'Backfield')))+section('Personnel','Personnel groupings from the sheet.',table(['Personnel','Calls','Usage','Gain','Avg gain'],taggedRows(ps,'Personnel')))+section('Motion and Y Location','Motion and alignment tags as charted.',table(['Motion','Calls','Usage','Gain','Avg gain'],taggedRows(ps,'Motion'))+table(['Y Location','Calls','Usage','Gain','Avg gain'],taggedRows(ps,'Y Location')))+ '</div>';
 }
 function passGamePage(){const all=internalPlays(),ps=all.filter(r=>String(r['R/P']||'').trim().toUpperCase()==='P'),yards=ps.reduce((a,r)=>a+n(r.Gain),0),byGame=internalGames(ps),gameRows=byGame.map(g=>[esc(g.key),g.n,g.yards.toFixed(0),(g.yards/g.n).toFixed(2),tagGroups(g.items,'Pass Concept')[0]?.key||'—']);
  return title('Louisiana Tech Pass Game','Pass calls and results from the exact offensive terminology in '+(state.config.offenseBreakdownFile||'ALL_BREAKDOWN_GAMES.csv')+'.')+cards([['Pass Plays',ps.length],['Tagged Pass Gain',yards],['Gain per Call',ps.length?(yards/ps.length).toFixed(2):'—'],['Named Pass Concepts',tagGroups(ps,'Pass Concept').length],['Protection Labels',tagGroups(ps,'Proctection').length],['Source Plays',all.length]])+
   '<p class="lt-data-source">'+esc(state.status.internalPlays||'Offensive breakdown file not loaded')+'</p>'+section('Pass Production by Game','Gain and game names are read from the internal breakdown rows.',table(['Game','Pass calls','Gain','Gain per call','Most used pass concept'],gameRows))+
   '<div class="lt-two">'+section('Pass Concepts','Exact Pass Concept labels from the offensive sheet.',table(['Pass Concept','Calls','Usage','Gain','Avg gain'],taggedRows(ps,'Pass Concept')))+section('Pass Play Types','Exact Play Type labels from the offensive sheet.',table(['Play Type','Calls','Usage','Gain','Avg gain'],taggedRows(ps,'Play Type')))+section('Protection','Preserving the source header spelling “Proctection”.',table(['Protection','Calls','Usage','Gain','Avg gain'],taggedRows(ps,'Proctection')))+section('Pass Formations','Formation labels from the sheet.',table(['Formation','Calls','Usage','Gain','Avg gain'],taggedRows(ps,'Formation')))+section('Pass Personnel','Personnel, backfield, and motion call tags.',table(['Personnel','Calls','Usage','Gain','Avg gain'],taggedRows(ps,'Personnel'))+table(['Backfield','Calls','Usage','Gain','Avg gain'],taggedRows(ps,'Backfield'))+table(['Motion','Calls','Usage','Gain','Avg gain'],taggedRows(ps,'Motion')))+section('Pass Play Log','Rows retain the offensive terminology exactly as supplied.',table(['Name','Down','Distance','Field Position','Gain','Formation','Pass Concept','Protection','QB','RB','TE','WR'],ps.map(r=>[esc(r.Name),esc(r.Down),esc(r.Distance),esc(r['Field Position']),esc(r.Gain),esc(r.Formation),esc(r['Pass Concept']),esc(r.Proctection),esc(r.QB),esc(r.RB),esc(r.TE),esc(r.WR)])))+'</div>';
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
  if(pageName==='run')return runGamePage();
  if(pageName==='qbrun')return overviewBy('pff_RUNPASS','Quarterback Run Game',ps.filter(r=>String(r.pff_PASSER||'').includes('(QB)')||String(r.pff_BALLCARRIER||'').includes('(QB)')));
  if(pageName==='pass')return passGamePage();
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
 function selectPlayer(name){state.selectedPlayer=String(name||'');const app=document.getElementById('app');if(app)app.innerHTML=page('players')}
 return {state,load,depthPlayers,page,statusHTML,selectPlayer};
})();
