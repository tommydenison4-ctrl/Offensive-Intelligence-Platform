function playerSeasonToggle(){
 return `<div class="player-season-toggle"><span>Season</span><button class="${playerIntelSeason==='2025'?'active':''}" onclick="setPlayerIntelSeason('2025')">2025</button><button class="${playerIntelSeason==='2026'?'active':''}" onclick="setPlayerIntelSeason('2026')">2026</button></div>`;
}
function setPlayerIntelSeason(y){
 playerIntelSeason=String(y);
 localStorage.setItem('ulmPlayerIntelSeason',playerIntelSeason);
 if(page==='players')render();
 let p=roster.find(x=>x.name===selected);
 if(p&&$('fauDrawer')?.classList.contains('open'))renderFAUDrawer(p);
}
window.setPlayerIntelSeason=setPlayerIntelSeason;

function cardMetricsFAU(p){
 if(isCurrentSeasonOpponent()){
   let s=piStats(p),pos=normPos(p.position);
   if(!s.verified)return [['DEF SNAPS','—'],['TACKLES','—'],['STOPS','—'],['MISSED','—']];
   if(pos==='DL')return [['DEF SNAPS',s.rows],['TACKLES',s.tackles],['PRESS',s.pressures],['SACKS',s.sacks]];
   if(pos==='LB')return [['DEF SNAPS',s.rows],['TACKLES',s.tackles],['STOPS',s.stops],['MISSED',s.mt]];
   return [['DEF SNAPS',s.rows],['TARGETS',s.targets],['PBU',s.pbu],['INT',s.ints]];
 }
 let pos=normPos(p.position),seasonMetrics=piSeasonCardMetrics(p);
 if(seasonMetrics)return seasonMetrics;
 let q=findPlayerRow('qb',p.name),rec=findPlayerRow('receiving',p.name),pb=findPlayerRow('passBlocking',p.name),rb=findPlayerRow('runBlocking',p.name),pl=playsForPlayer(p.name);
 if(pos==='QB'&&q)return [['CMP %',q['COMP%']],['YDS',q['PASS YDS']],['YDS/ATT',q['PASS YPA']],['TD',q['PASS TD']],['INT',q.INT],['RATING',q.RTG]];
 if(['WR','TE','RB'].includes(pos)&&rec)return [['TARGETS',rec.TGT],['REC',rec.REC],['YDS',rec['REC YDS']],['YPR',rec.YPR],['TD',rec['REC TD']],['YAC',rec.YAC]];
 if(pos==='OL'&&pb)return [['PBLK',pb.PBLK],['PBLK GRD',pb['PBLK GRD']],['PRESSURES',pb.PR],['SACKS',pb.SK],['HITS',pb.HT],['RBLK GRD',rb?.['RBLK GRD']]];
 return [['PLAYS',pl.length],['NO.',p.number],['GROUP',pos],['CLASS',p.class||'—']];
}
function playerCard(p){
 let m=cardMetricsFAU(p), idx=roster.indexOf(p), safeName=esc(p.name||'');
 return `<div class="player-card" role="button" tabindex="0" data-player-index="${idx}" aria-label="Open ${safeName} profile" onclick="openPlayerIndex(${idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openPlayerIndex(${idx})}"><div class="player-photo">${photo(p)}<div class="player-no">#${esc(p.number||'—')}</div></div><div class="player-body"><h3>${esc(p.name)}</h3><div class="player-meta">${esc(p.position||'')}${p.class?` · ${esc(p.class)}`:''}${p.height?` · ${esc(p.height)}`:''}${p.weight?` · ${esc(p.weight)} lbs`:''}</div><div class="mini-row">${m.slice(0,4).map(([l,v])=>`<div class="mini"><b>${esc(value(v))}</b><span>${esc(l)}</span></div>`).join('')}</div><div class="fau-card-actions"><button class="primary" type="button" onclick="event.stopPropagation();openPlayerIndex(${idx})">Full Profile</button>${p.profile?`<button type="button" onclick='event.stopPropagation();window.open(${JSON.stringify(p.profile)},"_blank")'>Bio ↗</button>`:''}</div></div></div>`;
}
function overview(p){let pos=normPos(p.position),q=findPlayerRow('qb',p.name),rec=findPlayerRow('receiving',p.name),pb=findPlayerRow('passBlocking',p.name),rb=findPlayerRow('runBlocking',p.name),stats='';if(pos==='QB'&&q)stats=`<div class="card"><h3>2025 PFF Passing Profile</h3><div class="metric-grid">${metric('Pass Grade',q['PASS GRD'])}${metric('Dropbacks',q.DB)}${metric('Att',q.ATT)}${metric('Comp %',q['COMP%'])}${metric('Pass Yds',q['PASS YDS'])}${metric('YPA',q['PASS YPA'])}${metric('TD',q['PASS TD'])}${metric('INT',q.INT)}${metric('Sacks',q.SK)}${metric('Scrambles',q.SCR)}${metric('avg TTT',q.avgTTT)}${metric('BTT',q.BTT)}${metric('TWP',q.TWP)}${metric('RTG',q.RTG)}</div></div>`;else if(rec&&['RB','WR','TE'].includes(pos))stats=`<div class="card"><h3>2025 PFF Receiving Profile</h3><div class="metric-grid">${metric('Rec Grade',rec['REC GRD'])}${metric('Route Snaps',rec['REC SNP'])}${metric('Targets',rec.TGT)}${metric('Receptions',rec.REC)}${metric('Rec Yds',rec['REC YDS'])}${metric('YPR',rec.YPR)}${metric('TD',rec['REC TD'])}${metric('1D',rec['REC 1D'])}${metric('Drops',rec.DP)}${metric('YAC',rec.YAC)}${metric('YAC/Rec',rec['YAC/REC'])}</div></div>`;else if(pos==='OL'&&(pb||rb))stats=`<div class="two">${pb?`<div class="card"><h3>Pass Blocking</h3><div class="metric-grid">${metric('Grade',pb['PBLK GRD'])}${metric('Snaps',pb.PBLK)}${metric('Sacks',pb.SK)}${metric('Hits',pb.HT)}${metric('Hurries',pb.HU)}${metric('Pressures',pb.PR)}</div></div>`:''}${rb?`<div class="card"><h3>Run Blocking</h3><div class="metric-grid">${metric('Grade',rb['RBLK GRD'])}${metric('Snaps',rb.RBLK)}${metric('Impact',rb['IMPACT RBLK'])}${metric('Impact %',rb['IMPACT RBLK%'])}${metric('Defeated',rb['DEFEATED RBLK'])}${metric('Defeated %',rb['DEFEATED RBLK%'])}</div></div>`:''}</div>`;return `<div class="card"><h3>Roster Identity</h3><div class="detail-grid">${detail('Number',p.number)}${detail('Position',p.position)}${detail('Height',p.height)}${detail('Weight',p.weight?`${p.weight} lbs`:'')}${detail('Class',p.class)}${detail('Hometown',p.hometown)}${detail('Previous School',p.previousSchool)}${detail('Roster Status','2026 Current')}</div></div>${stats}<div class="card"><h3>Biography</h3><div class="bio">${esc(p.bio||'Biography has not been enriched in the shared roster yet.')}</div></div>`}
function usage(p){let pos=normPos(p.position),rec=findPlayerRow('receiving',p.name),plays=playsForPlayer(p);let pass=plays.filter(r=>r.pff_RUNPASS==='P').length,run=plays.filter(r=>r.pff_RUNPASS==='R').length;let forms={};plays.forEach(r=>{let x=r.pff_OFFFORMATIONGROUP||r.pff_STARTING_OFFENSIVE_FORMATION_GROUP;if(x)forms[x]=(forms[x]||0)+1});let topForms=Object.entries(forms).sort((a,b)=>b[1]-a[1]).slice(0,6);return `<div class="two"><div class="card"><h3>Usage & Alignment</h3><div class="metric-grid">${metric('Linked Plays',plays.length)}${metric('Pass Plays',pass)}${metric('Run Plays',run)}${rec?metric('Route Snaps',rec['REC SNP']):''}${rec?metric('Targets',rec.TGT):''}</div>${topForms.length?`<h4>Most Common Formation Groups on Linked Plays</h4>${table(['Formation','Plays','Share'],topForms.map(([k,v])=>[esc(k),v,pct(100*v/plays.length)]))}`:'<div class="empty">No play-level role matches for this player.</div>'}</div><div class="card"><h3>Personnel Context</h3><div class="detail-grid">${detail('Position Group',pos)}${detail('Roster Number',p.number)}${detail('Class',p.class)}${detail('Previous',p.previousSchool)}</div></div></div>`}
function coverageRows(source){let rows=(source||[]).filter(r=>r.pff_RUNPASS==='P'&&r.pff_PASS_COVERAGE_BASIC);let g={};rows.forEach(r=>{let k=r.pff_PASS_COVERAGE_BASIC;if(!g[k])g[k]={cov:k,n:0,att:0,comp:0,yds:0,td:0,int:0,sack:0,scr:0,expl:0,neg:0};let x=g[k];x.n++;let gain=num(r.pff_GAINLOSSNET||r.pff_GAINLOSS);x.yds+=gain;if(gain>=15)x.expl++;if(gain<=0)x.neg++;let pr=passResult(r);if(['COMPLETE','INCOMPLETE','INTERCEPTION','THROWN AWAY','HIT AS THREW','BATTED PASS'].includes(pr)||isInterception(r))x.att++;if(pr==='COMPLETE')x.comp++;if(isInterception(r))x.int++;if(pr==='SACK')x.sack++;if(pr==='RUN')x.scr++;if(isPassTouchdown(r))x.td++});return Object.values(g).sort((a,b)=>b.n-a.n)}
function coverageTable(rows){
 let total=rows.reduce((s,x)=>s+x.n,0);
 let hdr=freqMode==='raw'?['Coverage','Frequency','C/A','Comp %','YPP','Explosives','Negative','TD','INT','Sack','Scr']:['Coverage','Frequency','C/A','Comp %','YPP','Expl %','Neg %','TD','INT','Sack','Scr'];
 return table(hdr,rows.map(x=>[esc(x.cov),freqVal(x.n,pct(100*x.n/Math.max(1,total)),'plays'),`${x.comp}/${x.att}`,pct(100*x.comp/Math.max(1,x.att)),fmt(x.yds/Math.max(1,x.n),2),freqMode==='raw'?x.expl:pct(100*x.expl/Math.max(1,x.n)),freqMode==='raw'?x.neg:pct(100*x.neg/Math.max(1,x.n)),x.td,x.int,x.sack,x.scr]));
}
function notePlayerName(p){
 if(typeof p==='string') return p.trim();
 return String(p?.name||p?.player_name||p?.full_name||p?.display_name||p?.playerName||'').trim();
}
function notePlayerKey(p){return `${notesTeam()}|${NOTES_SEASON}|${notePlayerName(p)}`}
function coachIdentity(){
 return localStorage.getItem('ulm-def-coach-name')||'';
}
function noteTime(v){
 if(!v)return '';
 try{return new Date(v).toLocaleString()}catch{return String(v)}
}
async function notesRequest(url,options={}){
 let headers={
   'apikey':SUPABASE_KEY,
   'Authorization':'Bearer '+SUPABASE_KEY,
   'Content-Type':'application/json',
   ...(options.headers||{})
 };
 let r=await fetch(url,{...options,headers});
 let text=await r.text(),data=null;
 try{data=text?JSON.parse(text):null}catch{data=text}
 if(!r.ok)throw new Error((data&&data.message)||text||`HTTP ${r.status}`);
 return data;
}
function cloudNoteMarkup(p,cls='coach-notes'){
 let name=coachIdentity();
 return `<div class="card ${cls}"><h3>Coach Notes</h3>
   <div id="coachNoteThread" class="note-thread"><div class="note-empty">Loading shared notes…</div></div>
   <div class="note-toolbar"><label>Your Name<input id="coachNoteAuthor" value="${esc(name)}" placeholder="Coach name"></label><div id="coachNoteStatus" class="note-status"></div></div>
   <textarea class="${cls==='coach-notes'?'':'notes-v6'}" id="coachNote" placeholder="Add a new staff note..."></textarea>
   <div class="profile-actions"><button class="primary" id="coachNoteSaveBtn" onclick="saveCoachNoteForPlayer()">Add Note</button></div>
 </div>`;
}
function coachNotes(p){
 setTimeout(()=>loadCoachNoteForPlayer(p),0);
 return cloudNoteMarkup(p,'coach-notes');
}
function renderCoachNoteThread(rows){
 let el=document.getElementById('coachNoteThread');
 if(!el)return;
 if(!rows?.length){
   el.innerHTML='<div class="note-empty">No shared notes yet.</div>';
   return;
 }
 el.innerHTML=rows.map(row=>{
   let created=String(row.created_by||'').trim(),updated=String(row.updated_by||'').trim();
   let changed=created&&updated&&created!==updated;
   let who=changed?`${created} · updated by ${updated}`:(updated||created||'Staff');
   let when=changed?(row.updated_at||row.created_at):(row.created_at||row.updated_at);
   return `<div class="note-entry"><div class="note-entry-head"><div class="note-entry-author">${esc(who)}</div><div class="note-entry-time">${esc(noteTime(when))}</div></div><div class="note-entry-text">${esc(row.note||'')}</div></div>`;
 }).join('');
}
async function loadCoachNoteForPlayer(p){
 let status=document.getElementById('coachNoteStatus');
 let playerName=notePlayerName(p);
 if(!playerName){
   if(status){status.textContent='Could not identify this player for shared notes.';status.className='note-status err'}
   return;
 }
 if(status){status.textContent='Loading shared notes…';status.className='note-status loading'}
 let q=`?select=*&team=eq.${encodeURIComponent(notesTeam())}&season=eq.${NOTES_SEASON}&player_name=eq.${encodeURIComponent(playerName)}&order=created_at.asc`;
 try{
   let rows=await notesRequest(NOTES_API+q);
   let key=notePlayerKey(p);
   cloudNotes[key]=Array.isArray(rows)?rows:[];
   renderCoachNoteThread(cloudNotes[key]);
   if(status){status.textContent='Shared across devices';status.className='note-status ok'}
 }catch(e){
   renderCoachNoteThread([]);
   if(status){status.textContent='Cloud notes unavailable: '+e.message;status.className='note-status err'}
 }
}
window.saveCoachNoteForPlayer=async()=>{
 let p=typeof selected==='string'?(resolveRosterPlayer(selected)||selected):selected,
     t=document.getElementById('coachNote'),authorEl=document.getElementById('coachNoteAuthor'),
     status=document.getElementById('coachNoteStatus'),btn=document.getElementById('coachNoteSaveBtn');
 if(!p||!t)return;
 let author=(authorEl?.value||'').trim();
 let playerName=notePlayerName(p);
 let noteText=(t.value||'').trim();
 if(!playerName){
   if(status){status.textContent='Could not identify this player for cloud notes.';status.className='note-status err'}
   return;
 }
 if(!author){
   if(status){status.textContent='Enter your name before saving.';status.className='note-status err'}
   authorEl?.focus();return;
 }
 if(!noteText){
   if(status){status.textContent='Type a note before saving.';status.className='note-status err'}
   t.focus();return;
 }
 localStorage.setItem('ulm-def-coach-name',author);
 if(btn){btn.disabled=true;btn.textContent='Saving…'}
 if(status){status.textContent='Adding shared note…';status.className='note-status loading'}
 let now=new Date().toISOString(),key=notePlayerKey(p);
 try{
   let body={
     team:notesTeam(),
     season:NOTES_SEASON,
     player_name:playerName,
     note:noteText,
     created_by:author,
     updated_by:author,
     updated_at:now
   };
   let rows=await notesRequest(NOTES_API,{
     method:'POST',
     headers:{'Prefer':'return=representation'},
     body:JSON.stringify(body)
   });
   let row=Array.isArray(rows)?rows[0]:rows;
   let list=Array.isArray(cloudNotes[key])?cloudNotes[key]:[];
   if(row)list.push(row);
   else list.push({...body,created_at:now});
   cloudNotes[key]=list;
   renderCoachNoteThread(list);
   t.value='';
   localStorage.removeItem('ulm-def-notes:'+playerName);
   if(status){status.textContent='Note added ✓';status.className='note-status ok'}
 }catch(e){
   localStorage.setItem('ulm-def-notes:'+playerName,noteText);
   if(status){status.textContent='Cloud save failed — kept locally on this device. '+e.message;status.className='note-status err'}
 }finally{
   if(btn){btn.disabled=false;btn.textContent='Add Note'}
 }
};
window.saveCoachNote=()=>window.saveCoachNoteForPlayer();


function customReportCatalog(){
 return [
  {id:'dashboard',label:'Dashboard Overview',cat:'Scouting Views',type:'view'},
  {id:'personnel',label:'Personnel & Formations',cat:'Scouting Views',type:'view'},
  {id:'run',label:'Run Game Explorer',cat:'Charts & Diagrams',type:'view'},
  {id:'heatmaps',label:'Passing Heat Map',cat:'Charts & Diagrams',type:'view'},
  {id:'coverage',label:'Coverage Response',cat:'Scouting Views',type:'view'},
  {id:'situations',label:'Situations / D&D',cat:'Scouting Views',type:'view'},
  {id:'rushcount',label:'Rush Count',cat:'Charts & Diagrams',type:'view'},
  {id:'pressure',label:'Pressure Response',cat:'Scouting Views',type:'view'}
 ];
}
function customReportKey(item){return item.type==='player'?`player:${item.name}`:`view:${item.id}:${Date.now()}:${Math.random()}`}
function addCustomReportView(id){
 let c=customReportCatalog().find(x=>x.id===id); if(!c)return;
 customReportItems.push({...c,key:customReportKey(c)});
 renderCustomReportItems();
}
function addCustomReportPlayer(name){
 let p=resolvedReportPlayer(name); if(!p)return;
 customReportItems.push({type:'player',name:p.name,label:`#${p.number||'—'} ${p.name}`,cat:'Players',key:customReportKey({type:'player',name:p.name})});
 renderCustomReportItems();
}
function removeCustomReportItem(key){customReportItems=customReportItems.filter(x=>x.key!==key);renderCustomReportItems()}
function moveCustomReportItem(key,dir){
 let i=customReportItems.findIndex(x=>x.key===key),j=i+dir;
 if(i<0||j<0||j>=customReportItems.length)return;
 [customReportItems[i],customReportItems[j]]=[customReportItems[j],customReportItems[i]];
 renderCustomReportItems();
}
function clearCustomReport(){customReportItems=[];renderCustomReportItems()}
function renderCustomReportLibrary(){
 let el=$('customReportLibrary'); if(!el)return;
 let q=String($('customReportSearch')?.value||'').trim().toLowerCase();
 let catalog=customReportCatalog().filter(x=>!q||`${x.label} ${x.cat}`.toLowerCase().includes(q));
 let players=offenseRoster().filter(p=>!q||`${p.name} ${p.number} ${p.position}`.toLowerCase().includes(q));
 let posOrder=['QB','RB','WR','TE','OL','OTHER'];
 let groups={}; players.forEach(p=>{let pos=normPos(p.position)||'OTHER';(groups[pos]||(groups[pos]=[])).push(p)});
 let views=`<div class="report-category"><h4>Charts / Scouting Views</h4><div class="report-item-list">${catalog.map(x=>`<div class="report-library-item"><div><b>${esc(x.label)}</b><small>${esc(x.cat)}</small></div><button onclick="addCustomReportView('${x.id}')">Add</button></div>`).join('')||'<div class="subtle">No matching views.</div>'}</div></div>`;
 let pl=posOrder.filter(pos=>groups[pos]?.length).map(pos=>{
   let label={QB:'Quarterbacks',RB:'Running Backs',WR:'Wide Receivers',TE:'Tight Ends',OL:'Offensive Line',OTHER:'Other'}[pos]||pos;
   return `<div class="report-category"><h4>${label}</h4><div class="report-item-list">${groups[pos].sort((a,b)=>num(a.number)-num(b.number)).map(p=>`<div class="report-library-item"><div><b>#${esc(p.number||'—')} ${esc(p.name)}</b><small>${esc(p.position||'')}</small></div><button onclick='addCustomReportPlayer(${JSON.stringify(p.name)})'>Add</button></div>`).join('')}</div></div>`;
 }).join('');
 el.innerHTML=views+pl;
}
function renderCustomReportItems(){
 let el=$('customReportItems'),sum=$('customReportSummary');
 if(!el)return;
 if(sum)sum.textContent=customReportItems.length?`${customReportItems.length} item${customReportItems.length===1?'':'s'} selected`:'';
 el.innerHTML=customReportItems.length?customReportItems.map((x,i)=>`<div class="custom-report-item">
   <div class="order">${i+1}</div>
   <div><b>${esc(x.label)}</b><small>${esc(x.cat||x.type)}</small></div>
   <div><button ${i===0?'disabled':''} onclick='moveCustomReportItem(${JSON.stringify(x.key)},-1)'>↑</button><button ${i===customReportItems.length-1?'disabled':''} onclick='moveCustomReportItem(${JSON.stringify(x.key)},1)'>↓</button></div>
   <button onclick='removeCustomReportItem(${JSON.stringify(x.key)})'>×</button>
 </div>`).join(''):'<div class="custom-report-empty"></div>';
}
function customViewHTML(id){
 if(id==='dashboard')return dashboardPage();
 if(id==='personnel')return personnelPage();
 if(id==='run')return `<div class="page-title"><h2>Run Game</h2></div>${runVisualizer()}`;
 if(id==='heatmaps')return heatmapPage();
 if(id==='coverage')return coveragePage();
 if(id==='situations')return situationsPage();
 if(id==='rushcount')return rushCountPage();
 if(id==='pressure')return pressurePage();
 return '';
}
function cleanCustomViewHTML(raw,label){
 let wrap=document.createElement('div');wrap.innerHTML=raw;
 wrap.querySelectorAll('.page-title,.data-status,.toolbar,.position-tabs,.view-toggle,.heat-controls,.run-filter-bar,.section-head button,.no-print,button,select,input').forEach(n=>n.remove());
 return `<section class="custom-section"><h2>${esc(label)}</h2><div class="custom-chart-snapshot">${wrap.innerHTML}</div></section>`;
}
async function customPlayerHTML(name){
 let p=resolvedReportPlayer(name); if(!p)return '';
 let notes=await fetchPlayerNotesForPrint(p),stats=playerSeasonStats(p),games=relevantGameRows(p).sort((a,b)=>gameScore(p,b)-gameScore(p,a)).slice(0,3);
 let img=p.image?`<img src="${esc(p.image)}" alt="">`:'';
 let pos=normPos(p.position);
 let gamesHTML=games.map(g=>{
   let production=pos==='QB'?`${g.passY+g.rushY} total yds · ${g.passTD} TD · ${g.int} INT`:pos==='RB'?`${g.rushY+g.recY} scrimmage yds · ${g.td} TD`:['WR','TE'].includes(pos)?`${g.rec}/${g.tgt} · ${g.recY} yds · ${g.td} TD`:`${g.plays} linked snaps`;
   return `<div class="print-game-line"><b>vs ${esc(g.opp||'Opponent')}</b> · ${esc(String(g.date||''))}<br>${production}</div>`;
 }).join('');
 let notesHTML=(notes||[]).slice(-3).map(n=>`<div class="print-note-line"><span class="print-note-author">${esc(printNoteAuthor(n))}</span> · ${esc(noteTime(n.updated_at||n.created_at))}<br>${esc(n.note||'')}</div>`).join('');
 return `<section class="custom-section"><h2>Player Profile</h2><div class="custom-player-print"><div class="custom-player-print-head">${img}<div><div class="custom-player-print-name">${esc(p.name)}</div><div class="print-profile-meta">${esc(p.position||'')} · #${esc(p.number||'—')}${p.class?` · ${esc(p.class)}`:''}${p.height?`<br>${esc(p.height)}`:''}${p.weight?` · ${esc(p.weight)} lbs`:''}</div></div></div><div class="print-profile-stats">${stats.slice(0,9).map(([l,v])=>`<div class="print-stat"><small>${esc(l)}</small><b>${esc(value(v))}</b></div>`).join('')}</div>${gamesHTML?`<div class="print-profile-section"><h4>Top Production</h4>${gamesHTML}</div>`:''}${notesHTML?`<div class="print-profile-section"><h4>Staff Notes</h4>${notesHTML}</div>`:''}</div></section>`;
}
async function printCustomScoutingReport(){
 if(!customReportItems.length){alert('Add at least one item to the custom report first.');return}
 closePrintCenter();
 let sections=[];
 for(const item of customReportItems){
   if(item.type==='player')sections.push(await customPlayerHTML(item.name));
   else sections.push(cleanCustomViewHTML(customViewHTML(item.id),item.label));
 }
 $('customReportPrint').innerHTML=`<div class="print-report-head"><div class="print-report-brand"><img src="ulm_avg_roundel_edge_star.png"><div><h1>ULM Defensive Intelligence</h1><small>${activeOpponentName()} · Custom Scouting Report</small></div></div><div style="font-size:9px;font-weight:900">2026 OPPONENT SCOUTING</div></div>${sections.join('')}`;
 document.body.classList.remove('print-view','print-profiles');
 document.body.classList.add('print-custom');
 setTimeout(()=>window.print(),120);
}

function resolvedReportPlayer(v){
 if(!v)return null;
 if(typeof v==='object')return v;
 return resolveRosterPlayer(v)||roster.find(p=>p.name===v)||null;
}
function addPlayerToReport(v){
 let p=resolvedReportPlayer(v);
 if(!p)return;
 if(!reportQueue.includes(p.name))reportQueue.push(p.name);
 renderReportQueue();
}
function removePlayerFromReport(name){
 reportQueue=reportQueue.filter(x=>x!==name);
 renderReportQueue();
}
function clearReportQueue(){reportQueue=[];renderReportQueue()}
function addCurrentPlayerToReport(){addPlayerToReport(selected)}
function addVisiblePlayersToReport(){
 let list=page==='players'?filteredPlayers():offenseRoster();
 list.forEach(p=>{if(!reportQueue.includes(p.name))reportQueue.push(p.name)});
 renderReportQueue();
}
function renderReportQueue(){
 let el=$('reportQueue');
 if(el){
   el.innerHTML=reportQueue.length
     ? reportQueue.map(n=>`<span class="report-chip">${esc(n)} <button onclick='removePlayerFromReport(${JSON.stringify(n)})'>×</button></span>`).join('')
     : '<span class="subtle">No players selected.</span>';
 }
 [1,2,4,8].forEach(n=>{let b=$('pp'+n);if(b)b.classList.toggle('active',printProfilesPerPage===n)});
 renderReportPlayerPicker();
}

function setReportPlayerPos(pos){
 printPlayerPos=pos;
 ['ALL','DL','LB','DB'].forEach(x=>{let b=$('rpf'+x);if(b)b.classList.toggle('active',x===pos)});
 renderReportPlayerPicker();
}
function reportPickerPlayers(){
 let q=String($('reportPlayerSearch')?.value||'').trim().toLowerCase();
 let list=offenseRoster().filter(p=>printPlayerPos==='ALL'||normPos(p.position)===printPlayerPos).slice().sort((a,b)=>{
   let pa=normPos(a.position),pb=normPos(b.position);
   const order={DL:1,LB:2,DB:3,OTHER:99};
   return (order[pa]||50)-(order[pb]||50)||num(a.number)-num(b.number)||String(a.name).localeCompare(String(b.name));
 });
 if(!q)return list;
 return list.filter(p=>`${p.name||''} ${p.number||''} ${p.position||''}`.toLowerCase().includes(q));
}
function renderReportPlayerPicker(){
 let el=$('reportPlayerPicker');
 if(!el)return;
 ['ALL','DL','LB','DB'].forEach(x=>{let b=$('rpf'+x);if(b)b.classList.toggle('active',x===printPlayerPos)});
 let list=reportPickerPlayers();
 if(!list.length){
   el.innerHTML='<div class="subtle">No defensive players match that filter/search.</div>';
   return;
 }
 const labelMap={DL:'Defensive Line',LB:'Linebackers',DB:'Defensive Backs'};
 const order=['DL','LB','DB'];
 const groups={};
 list.forEach(p=>{
   const pos=normPos(p.position);
   (groups[pos]||(groups[pos]=[])).push(p);
 });
 el.innerHTML=`<div class="report-player-groups">${order.filter(pos=>groups[pos]?.length).map(pos=>`<div class="report-player-group"><div class="report-player-group-title">${labelMap[pos]||pos} (${groups[pos].length})</div><div class="report-player-list">${groups[pos].map(p=>{
       let checked=reportQueue.includes(p.name);
       return `<label class="report-player-choice"><input type="checkbox" ${checked?'checked':''} onchange='toggleReportPlayer(${JSON.stringify(p.name)},this.checked)'><div><div class="rp-main">#${esc(p.number||'—')} ${esc(p.name)}</div><div class="rp-sub">${esc(p.position||'')} · ${esc(normPos(p.position))}</div></div></label>`;
     }).join('')}</div></div>`).join('')}</div>`;
}
function selectVisibleReportPlayers(){
 reportPickerPlayers().forEach(p=>{if(!reportQueue.includes(p.name))reportQueue.push(p.name)});
 renderReportQueue();
}
function toggleReportPlayer(name,checked){
 if(checked){
   if(!reportQueue.includes(name))reportQueue.push(name);
 }else{
   reportQueue=reportQueue.filter(x=>x!==name);
 }
 renderReportQueue();
}
function selectAllReportPlayers(){
 reportQueue=offenseRoster().map(p=>p.name);
 renderReportQueue();
}
function setProfilesPerPage(n){printProfilesPerPage=n;renderReportQueue()}
function openPrintCenter(){let el=$('printCenterOverlay');if(el){el.classList.add('open');setReportPlayerPos(printPlayerPos||'ALL');renderReportQueue();renderCustomReportLibrary();renderCustomReportItems()}}
function closePrintCenter(){let el=$('printCenterOverlay');if(el)el.classList.remove('open')}
function printViewHeaderHTML(){
 let titles={dashboard:'Dashboard',players:'Player Intelligence',personnel:'Personnel & Formations',run:'Run Game',pass:'Pass Game',heatmaps:'Passing Heat Maps',coverage:'Coverage Response',situations:'Situations',rushcount:'Rush Count',pressure:'Pressure Response'};
 return `<div class="print-view-header"><div style="display:flex;align-items:center;gap:9px"><img src="ulm_avg_roundel_edge_star.png"><div><b>ULM OFFENSIVE INTELLIGENCE</b><div style="font-size:9px;color:#667085">${activeOpponentName()} · ${esc(titles[page]||'Scouting Report')}</div></div></div><div style="font-size:9px;font-weight:900">2026 OPPONENT SCOUTING</div></div>`;
}
function ensurePrintViewHeader(){
 let app=$('app'); if(!app)return;
 let old=$('printViewHeader'); if(old)old.remove();
 app.insertAdjacentHTML('afterbegin',`<div id="printViewHeader">${printViewHeaderHTML()}</div>`);
}
function printCurrentView(){
 closePrintCenter();
 ensurePrintViewHeader();
 document.body.classList.remove('print-profiles');
 document.body.classList.add('print-view');
 setTimeout(()=>window.print(),80);
}
function printNoteAuthor(row){
 let c=String(row?.created_by||'').trim(),u=String(row?.updated_by||'').trim();
 if(c&&u&&c!==u)return `${c} → ${u}`;
 return u||c||'Staff';
}
async function fetchPlayerNotesForPrint(p){
 let key=notePlayerKey(p);
 if(Array.isArray(cloudNotes[key]))return cloudNotes[key];
 try{
   let q=`?select=*&team=eq.${encodeURIComponent(notesTeam())}&season=eq.${NOTES_SEASON}&player_name=eq.${encodeURIComponent(p.name)}&order=created_at.asc`;
   let rows=await notesRequest(NOTES_API+q);
   cloudNotes[key]=Array.isArray(rows)?rows:[];
   return cloudNotes[key];
 }catch{return []}
}
function printPlayerCardHTML(p,notes,perPage){
 let stats=playerSeasonStats(p),dense=perPage>=8,medium=perPage>=4;
 let statCount=dense?4:medium?6:9;
 let games=relevantGameRows(p).sort((a,b)=>gameScore(p,b)-gameScore(p,a)).slice(0,dense?1:medium?2:3);
 let noteCount=dense?1:medium?2:3,ns=(notes||[]).slice(-noteCount);
 let pos=normPos(p.position);
 let img=p.image?`<img src="${esc(p.image)}" alt="">`:`<div style="width:74px;height:84px;background:#eef1f4;border-radius:8px"></div>`;
 let gameLines=games.map(g=>{
   let production=pos==='QB'?`${g.passY+g.rushY} total yds · ${g.passTD} TD · ${g.int} INT`:pos==='RB'?`${g.rushY+g.recY} scrimmage yds · ${g.td} TD`:['WR','TE'].includes(pos)?`${g.rec}/${g.tgt} · ${g.recY} yds · ${g.td} TD`:`${g.plays} linked snaps`;
   return `<div class="print-game-line"><b>vs ${esc(g.opp||'Opponent')}</b> · ${esc(String(g.date||''))}<br>${production}</div>`;
 }).join('');
 let noteLines=ns.map(n=>`<div class="print-note-line"><span class="print-note-author">${esc(printNoteAuthor(n))}</span> · ${esc(noteTime(n.updated_at||n.created_at))}<br>${esc(n.note||'')}</div>`).join('');
 return `<article class="print-profile-card ${dense?'dense':''}">
   <div class="print-profile-top">${img}<div><div class="print-profile-name">${esc(p.name)}</div><div class="print-profile-meta">${esc(p.position||'')} · #${esc(p.number||'—')}${p.class?` · ${esc(p.class)}`:''}${p.height?`<br>${esc(p.height)}`:''}${p.weight?` · ${esc(p.weight)} lbs`:''}${p.hometown?`<br>${esc(p.hometown)}`:''}</div></div></div>
   <div class="print-profile-stats">${stats.slice(0,statCount).map(([l,v])=>`<div class="print-stat"><small>${esc(l)}</small><b>${esc(value(v))}</b></div>`).join('')}</div>
   ${games.length?`<div class="print-profile-section"><h4>Top Production</h4>${gameLines}</div>`:''}
   ${ns.length?`<div class="print-profile-section"><h4>Staff Notes</h4>${noteLines}</div>`:''}
 </article>`;
}
async function printProfilePack(){
 let players=reportQueue.map(resolvedReportPlayer).filter(Boolean);
 if(!players.length){alert('Select at least one player for the report first.');return}
 closePrintCenter();
 let noteSets=await Promise.all(players.map(fetchPlayerNotesForPrint));
 let cards=players.map((p,i)=>({p,notes:noteSets[i]}));
 let sheets=[];
 for(let i=0;i<cards.length;i+=printProfilesPerPage){
   let group=cards.slice(i,i+printProfilesPerPage);
   sheets.push(`<section class="print-sheet pp${printProfilesPerPage}">
     ${group.map(x=>printPlayerCardHTML(x.p,x.notes,printProfilesPerPage)).join('')}
   </section>`);
 }
 $('printReport').innerHTML=`<div class="print-report-head"><div class="print-report-brand"><img src="ulm_avg_roundel_edge_star.png"><div><h1>ULM Defensive Intelligence</h1><small>${activeOpponentName()} · Player Profile Pack</small></div></div><div style="font-size:9px;font-weight:900">2026 OPPONENT SCOUTING</div></div>${sheets.join('')}`;
 document.body.classList.remove('print-view');
 document.body.classList.add('print-profiles');
 setTimeout(()=>window.print(),100);
}
window.addEventListener('afterprint',()=>{document.body.classList.remove('print-view','print-profiles','print-custom')});


function profile(p){return `<div class="card profile"><div class="player-hero"><div class="player-photo">${photo(p)}<div class="player-no">#${esc(p.number||'—')}</div></div><div><div class="kicker">${activeOpponentName()} Player Intelligence</div><div class="player-name">${esc(p.name)}</div><div class="profile-meta">${esc(p.position||'')}${p.class?` · ${esc(p.class)}`:''}${p.height?` · ${esc(p.height)}`:''}${p.weight?` · ${esc(p.weight)} lbs`:''}${p.hometown?`<br>${esc(p.hometown)}`:''}${p.previousSchool?`<br>Previous: ${esc(p.previousSchool)}`:''}</div><div class="profile-actions">${p.profile?`<a href="${esc(p.profile)}" target="_blank" rel="noopener">Official Bio ↗</a>`:''}<button class="primary" onclick="addPlayerToReport(selected);openPrintCenter()">Print Player Report</button></div></div></div><div class="facet-tabs no-print">${[['overview','Overview'],['usage','Routes & Usage'],['tendencies','Coverage / Tendencies'],['games','Game Log'],['compare','Comparison'],['notes','Coach Notes']].map(([id,l])=>`<button class="${facet===id?'active':''}" onclick="setFacet('${id}')">${l}</button>`).join('')}</div>${facet==='overview'?overview(p):facet==='usage'?usage(p):facet==='tendencies'?tendencies(p):facet==='games'?games(p):facet==='compare'?comparison(p):coachNotes(p)}</div>`}

function pffRowForPlayer(p){let pos=normPos(p.position);return pos==='QB'?findPlayerRow('qb',p.name):['WR','TE','RB'].includes(pos)?findPlayerRow('receiving',p.name):findPlayerRow('passBlocking',p.name)}
function playerSeasonStats(p){
 let pos=normPos(p.position),q=findPlayerRow('qb',p.name),rec=findPlayerRow('receiving',p.name),pb=findPlayerRow('passBlocking',p.name),rb=findPlayerRow('runBlocking',p.name);
 if(pos==='QB'&&q)return [['CMP %',q['COMP%']],['YDS',q['PASS YDS']],['YDS/ATT',q['PASS YPA']],['TD',q['PASS TD']],['INT',q.INT],['RATING',q.RTG],['SACKS',q.SK],['SCRAMBLES',q.SCR],['AVG TTT',q.avgTTT]];
 if(['WR','TE','RB'].includes(pos)&&rec)return [['TARGETS',rec.TGT],['REC',rec.REC],['REC YDS',rec['REC YDS']],['YPR',rec.YPR],['TD',rec['REC TD']],['YAC',rec.YAC],['ROUTE SNAPS',rec['REC SNP']],['DROPS',rec.DP],['1ST DOWNS',rec['REC 1D']]];
 if(pos==='OL'&&pb)return [['PBLK SNAPS',pb.PBLK],['PBLK GRD',pb['PBLK GRD']],['PRESSURES',pb.PR],['SACKS',pb.SK],['HITS',pb.HT],['HURRIES',pb.HU],['RBLK SNAPS',rb?.RBLK],['RBLK GRD',rb?.['RBLK GRD']],['DEFEATED',rb?.['DEFEATED RBLK']]];
 return [['LINKED PLAYS',playsForPlayer(p.name).length],['NUMBER',p.number],['POSITION',p.position],['CLASS',p.class]];
}
function relevantGameRows(p){
 let pos=normPos(p.position),rows=(datasets.plays||[]),games={};
 rows.forEach(r=>{
   let linked=false;
   if(pos==='QB')linked=playerTokenMatch(r.pff_PASSER,p,'QB')||playerTokenMatch(r.pff_BALLCARRIER,p,'CARRIER')||isQBRunRow(r,p);
   else if(['WR','TE'].includes(pos))linked=playerTokenMatch(r.pff_PASSRECEIVERTARGET,p,'TARGET');
   else if(pos==='RB')linked=playerTokenMatch(r.pff_BALLCARRIER,p,'CARRIER')||playerTokenMatch(r.pff_PASSRECEIVERTARGET,p,'TARGET');
   else if(pos==='OL')linked=false;
   if(!linked)return;
   let id=r.pff_GAMEID||r.pff_GAMEDATE||'Unknown',g=games[id]||(games[id]={id,date:r.pff_GAMEDATE||'',opp:r.pff_DEFTEAM||'',plays:0,att:0,comp:0,passY:0,passTD:0,int:0,rush:0,rushY:0,tgt:0,rec:0,recY:0,td:0,expl:0,gradeVals:[]});
   g.plays++; let gain=num(r.pff_GAINLOSSNET||r.pff_GAINLOSS),res=String(r.pff_PASSRESULT||'').toUpperCase();
   if(gain>=15)g.expl++;
   if(pos==='QB'&&playerTokenMatch(r.pff_PASSER,p,'QB')){if(['COMPLETE','INCOMPLETE','INTERCEPTION','THROWN AWAY','HIT AS THREW','BATTED PASS'].includes(res))g.att++;if(res==='COMPLETE')g.comp++;g.passY+=gain;if(isInterception(r))g.int++;if(isPassTouchdown(r))g.passTD++}
   if((pos==='RB'&&playerTokenMatch(r.pff_BALLCARRIER,p,'CARRIER')&&r.pff_RUNPASS==='R')||(pos==='QB'&&isQBRunRow(r,p))){g.rush++;g.rushY+=gain;if(isRushTouchdown(r))g.td++}
   if(['WR','TE','RB'].includes(pos)&&playerTokenMatch(r.pff_PASSRECEIVERTARGET,p,'TARGET')){g.tgt++;if(res==='COMPLETE'){g.rec++;g.recY+=gain}if(isPassTouchdown(r))g.td++}
 });
 return Object.values(games);
}
function gameScore(p,g){
 let pos=normPos(p.position);
 if(pos==='QB')return g.passY + g.passTD*35 - g.int*25 + g.comp*2 + g.rushY;
 if(['WR','TE'].includes(pos))return g.recY + g.td*35 + g.rec*4 + g.expl*8;
 if(pos==='RB')return g.rushY+g.recY+g.td*35+(g.rec*3)+g.expl*8;
 return g.plays;
}

function productionMetric(p,g){
 let pos=normPos(p.position);
 if(pos==='QB')return g.passY+g.rushY;
 if(pos==='RB')return g.rushY+g.recY;
 if(['WR','TE'].includes(pos))return g.recY;
 return g.plays;
}
function productionLabel(p){
 let pos=normPos(p.position);
 return pos==='QB'?'Total Offense Yards':pos==='RB'?'Scrimmage Yards':['WR','TE'].includes(pos)?'Receiving Yards':'Linked Snaps';
}
function weeklyProductionChart(p){
 let games=relevantGameRows(p).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 if(!games.length)return `<div class="weekly-chart-card"><div class="no-sample-banner">No 2025 Mississippi State game-by-game sample matched this player.</div></div>`;
 let vals=games.map(g=>productionMetric(p,g)),max=Math.max(1,...vals),W=900,H=230,left=45,right=18,top=22,bottom=55,iw=W-left-right,ih=H-top-bottom;
 let pts=vals.map((v,i)=>{let x=left+(games.length===1?iw/2:i*iw/(games.length-1)),y=top+ih-(v/max)*ih;return {x,y,v,g:games[i]}});
 let path=pts.map((pt,i)=>(i?'L':'M')+pt.x.toFixed(1)+' '+pt.y.toFixed(1)).join(' ');
 let grid=[0,.25,.5,.75,1].map(f=>{let y=top+ih-f*ih;return `<line class="weekly-grid-line" x1="${left}" y1="${y}" x2="${W-right}" y2="${y}"/><text class="weekly-axis-text" x="${left-7}" y="${y+3}" text-anchor="end">${Math.round(max*f)}</text>`}).join('');
 let dots=pts.map(pt=>`<circle class="weekly-dot" cx="${pt.x}" cy="${pt.y}" r="5"/><text class="weekly-label" x="${pt.x}" y="${Math.max(12,pt.y-9)}" text-anchor="middle">${pt.v}</text><text class="weekly-opponent" x="${pt.x}" y="${H-28}" text-anchor="middle">vs ${esc(pt.g.opp||'—')}</text><text class="weekly-opponent" x="${pt.x}" y="${H-14}" text-anchor="middle">${esc(String(pt.g.date||'').slice(5))}</text>`).join('');
 return `<div class="weekly-chart-card"><div class="weekly-chart-head"><div><h3>Week-to-Week Production</h3><div class="subtle">${productionLabel(p)} · every matched 2025 Mississippi State game</div></div></div><svg class="weekly-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${grid}<path class="weekly-line" d="${path}"/>${dots}</svg></div>`;
}

