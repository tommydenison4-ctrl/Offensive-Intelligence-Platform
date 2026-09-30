function uabTackleSummaryRows(){
 if(activeOpponent!=='UAB')return [];
 let current=new Map(offenseRoster().map(p=>[loosePlayerName(p.name),p]));
 let hist=new Map((historicalRoster||[]).map(p=>[loosePlayerName(p.name),p]));
 return UAB_TACKLING_FALLBACK.map(r=>{
   let key=loosePlayerName(r.Name);
   let hp=hist.get(key);
   let p=current.get(key)||(
     hp ? {
       ...hp,
       historicalOnly:true,
       name:hp.name||r.Name,
       number:hp.number||r['#'],
       position:hp.position||r.POS
     } : {
       name:r.Name,
       number:r['#'],
       position:r.POS,
       class:'',
       height:'',
       weight:'',
       image:'',
       profile:'',
       historicalOnly:true
     }
   );
   return {
     p,
     total:num(r['TOT TKL']),
     tkl:num(r.TKL),
     ast:num(r.AST),
     mt:num(r.MT),
     stop:num(r.STOP),
     runMt:num(r['MT.1']),
     passMt:num(r['MT.2']),
     mtPctRaw:r['MT%']||''
   };
 }).filter(x=>nonEmpty(x.p?.name));
}
function selaTackleSummaryRows(){
 if(activeOpponent!=='SELA')return [];
 let current=new Map(offenseRoster().map(p=>[loosePlayerName(p.name),p]));
 return SELA_PFF_54.map(r=>{
   let p=current.get(loosePlayerName(r.Name));
   if(!p)return null;
   return {p,total:num(r['TOT TKL']),tkl:num(r.TKL),ast:num(r.AST),mt:num(r.MT),stop:num(r.STOP),runMt:num(r['MT.1']),passMt:num(r['MT.2'])};
 }).filter(Boolean);
}
function fauTackleSummaryRows(){
 if(!isCurrentSeasonOpponent())return [];
 let current=new Map(offenseRoster().map(p=>[cleanName(p.name),p]));
 return (activeOpponent==='SA'?(datasets.tackling||[]):FAU_PFF_80).map(r=>{
   let p=current.get(cleanName(r.Name)); if(!p)return null;
   return {p,total:num(r['TOT TKL']),tkl:num(r.TKL),ast:num(r.AST),mt:num(r.MT),stop:num(r.STOP),runMt:num(r['MT.1']),passMt:num(r['MT.2'])};
 }).filter(Boolean);
}
function mtRowsForPlayer(p){return dashboardPlayRows().filter(r=>piTagged(r,p,['pff_MISSEDTACKLE']))}
function mtReportRows(players){
 if(isCurrentSeasonOpponent()){
   return fauTackleSummaryRows().map(x=>{
     let mrows=mtRowsForPlayer(x.p),gains=mrows.map(r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained'])));
     let expl=gains.filter(v=>v>=15).length,opp=x.tkl+x.mt;
     return {p:x.p,mt:x.mt,tkl:x.tkl,total:x.total,ast:x.ast,opp,mtPct:opp?100*x.mt/opp:0,run:x.runMt,pass:x.passMt,expl,ypp:mrows.length?avg(gains):0,med:mrows.length?calcMedian(gains):0,hasPlayContext:mrows.length>0};
   }).filter(x=>x.mt>0).sort((a,b)=>b.mt-a.mt||b.mtPct-a.mtPct);
 }

 if(activeOpponent==='SELA'){
   return selaTackleSummaryRows().map(x=>{
     let mrows=mtRowsForPlayer(x.p),gains=mrows.map(r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained'])));
     let expl=gains.filter(v=>v>=15).length,opp=x.tkl+x.mt;
     return {p:x.p,mt:x.mt,tkl:x.tkl,total:x.total,ast:x.ast,opp,mtPct:opp?100*x.mt/opp:0,run:x.runMt,pass:x.passMt,expl,ypp:mrows.length?avg(gains):0,med:mrows.length?calcMedian(gains):0,hasPlayContext:mrows.length>0};
   }).filter(x=>x.mt>0).sort((a,b)=>b.mt-a.mt||b.mtPct-a.mtPct);
 }

 if(activeOpponent==='UAB'){
   return uabTackleSummaryRows().map(x=>{
     let isCurrent=!x.p.historicalOnly;
     let mrows=isCurrent?mtRowsForPlayer(x.p):[];
     let gains=mrows.map(r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained'])));
     let expl=gains.filter(v=>v>=15).length,opp=x.tkl+x.mt;
     return {
       p:x.p,
       mt:x.mt,
       tkl:x.tkl,
       total:x.total,
       ast:x.ast,
       opp,
       mtPct:opp?100*x.mt/opp:0,
       run:x.runMt,
       pass:x.passMt,
       expl,
       ypp:mrows.length?avg(gains):0,
       med:mrows.length?calcMedian(gains):0,
       hasPlayContext:mrows.length>0
     };
   }).filter(x=>x.mt>0).sort((a,b)=>b.mt-a.mt||b.mtPct-a.mtPct);
 }
 return players.map(p=>{
   let s=piStats(p),mrows=mtRowsForPlayer(p);
   let runTagged=mrows.filter(r=>['R','RUN'].includes(String(firstField(r,['pff_RUNPASS'])||'').toUpperCase())).length;
   let passTagged=mrows.filter(r=>['P','PASS'].includes(String(firstField(r,['pff_RUNPASS'])||'').toUpperCase())).length;
   let gains=mrows.map(r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained'])));
   let expl=gains.filter(x=>x>=15).length,mt=num(s.mt),tkl=num(s.tackles),opp=tkl+mt;
   return {p,mt,tkl,opp,mtPct:opp?100*mt/opp:0,run:runTagged,pass:passTagged,expl,ypp:mrows.length?avg(gains):0,med:mrows.length?calcMedian(gains):0,hasPlayContext:mrows.length>0};
 }).filter(x=>x.mt>0).sort((a,b)=>b.mt-a.mt||b.mtPct-a.mtPct);
}
function missedTackleReport(players){
 let rows=mtReportRows(players),total=rows.reduce((n,x)=>n+x.mt,0);
 return `<div class="card mt-report"><h3>Missed Tackle Report</h3>
 <div class="sample-note"></div>
 <div class="table-wrap">${rows.length?table(
   ['Player','Pos','MT','Team MT Share','Tackles','Tackle Opps','MT %','Run MT','Pass MT','Explosive Plays on MT','YPP on MT Plays','Median'],
   rows.map(x=>[esc(x.p.name),esc(x.p.position),x.mt,pctText(x.mt,total),x.tkl,x.opp,`${x.mtPct.toFixed(1)}%`,x.run,x.pass,x.hasPlayContext?x.expl:'—',x.hasPlayContext?fmt(x.ypp,2):'—',x.hasPlayContext?fmt(x.med,1):'—'])
 ):'<div class="empty">No missed-tackle data is available.</div>'}</div></div>`;
}


const DEF_DEPTH_CHART=[
 {pos:'DE',first:['43','Will Whitson','GR/TR'],second:['23','Trevion Williams','RS JR'],third:['97','Jayson Jenkins','RS SR/TR']},
 {pos:'NT',first:['9','Jaray Bledsoe','RS SR/TR'],second:['35','Kalvin Dinkins','RS SR'],third:['99','Diesel Moye','RS SR/TR']},
 {pos:'DT',first:['14','Dealyn Evans','RS SO/TR'],second:['42','DJ Reed','RS JR/TR'],third:['55','Colin Coates','RS JR/TR']},
 {pos:'JACK',first:['4','Amaree Williams','JR/TR'],second:['16','Derion Gullette','RS JR/TR'],third:['41','Tyshun Willis','RS FR']},
 {pos:'WLB',first:['11','Tyler Lockhart','SO'],second:['10','Jalen Smith','RS JR/TR'],third:['13','LaKendrick James','RS JR/TR']},
 {pos:'MLB',first:['7','Zakari Tillman','SR'],second:['0','Fatt Forrest','RS SO'],third:['32','AJ Rice','RS FR'],additional:['44','Gav Holman','RS SO/TR']},
 {pos:'LCB',first:['1','Kelley Jones','RS JR'],second:['8','Kaylib Singleton','RS FR/TR'],third:['17','Kyle Johnson','RS FR']},
 {pos:'SS',first:['5','Jardin Gilbert','GR/TR'],second:['28','Tanner Johnson','RS SR'],third:["12","Ja'Bryis Stewart",'RS JR/TR']},
 {pos:'FS',first:['15','Marcus Williams','RS SR/TR'],second:['6','Bralan Womack','FR'],third:['21','Dre Riley','JR/TR']},
 {pos:'RCB',first:['24','Quentin Taylor','RS SO/TR'],second:['20','Jett Jefferson','RS JR/TR'],third:['26','Jamroc Grimsley','RS SO/TR']},
 {pos:'NB',first:['2','Isaac Smith','SR'],second:['3','Kendel Dolby','GR/TR'],third:null}
];
function depthPlayerCell(entry,first=false){
 if(!entry)return '<span class="dc-empty">—</span>';
 let [num,name,cls]=entry, found=resolveRosterPlayer(name);
 let content=`<span class="dc-number">#${esc(num)}</span><span><span class="dc-name">${esc(name)}</span><span class="dc-class">${esc(cls||'')}</span></span>`;
 return found?`<button class="dc-player-btn ${first?'dc-first':''}" onclick='openFAUProfile(${JSON.stringify(name)})'>${content}</button>`:`<div class="dc-player ${first?'dc-first':''}">${content}</div>`;
}
function msstDepthChartPage(){
 return `<div class="dc-head"><div><h2>Defensive Depth Chart</h2><div class="dc-sub">Mississippi State - Week 1</div></div><div class="dc-badge">3-3-5 · Projected Depth</div></div>
 <div class="dc-card">
  <div class="dc-titlebar"><h3>Mississippi State Defense</h3><span>September 5, 2026 · Davis Wade Stadium</span></div>
  <div class="dc-table-wrap"><table class="dc-table"><thead><tr><th>Pos</th><th>1st</th><th>2nd</th><th>3rd / Additional</th></tr></thead><tbody>
   ${DEF_DEPTH_CHART.map(r=>`<tr><td class="dc-pos">${esc(r.pos)}</td><td>${depthPlayerCell(r.first,true)}</td><td>${depthPlayerCell(r.second)}</td><td>${depthPlayerCell(r.third)}${r.additional?`<div style="margin-top:7px">${depthPlayerCell(r.additional)}</div>`:''}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="dc-foot">Projected opponent depth chart · Week 1 matchup</div>
 </div>`;
}


function activeDefDepthRows(){
 let pos=depthChartData?.defense?.positions||depthChartData?.defense||{};
 return Object.entries(pos).map(([position,players])=>({
   pos:position,first:players?.[0]||null,second:players?.[1]||null,third:players?.[2]||null,additional:players?.[3]||null
 }));
}
function uabDepthPlayerCell(entry,first=false){
 if(!entry)return '<span class="dc-empty">—</span>';
 let [num,name,cls]=entry,found=resolveRosterPlayer(name);
 let klass=cls||found?.class||'';
 let content=`<span class="dc-number">#${esc(num)}</span><span><span class="dc-name">${esc(name)}</span><span class="dc-class">${esc(klass)}</span></span>`;
 return found?`<button class="dc-player-btn ${first?'dc-first':''}" onclick='openFAUProfile(${JSON.stringify(name)})'>${content}</button>`:`<div class="dc-player ${first?'dc-first':''}">${content}</div>`;
}
function opponentDepthChartPage(){
 let rows=activeDefDepthRows(),scheme=depthChartData?.defense?.scheme||depthChartData?.scheme||'Multiple',name=activeOpponentName();
 return `<div class="dc-head"><div><h2>Defensive Depth Chart</h2><div class="dc-sub">${esc(name)} · 2026 Opponent Prep</div></div><div class="dc-badge">${esc(scheme)} · Projected Depth</div></div>
 <div class="dc-card"><div class="dc-titlebar"><h3>${esc(name)} Defense</h3><span>Current opponent depth chart</span></div>
 ${rows.length?`<div class="dc-table-wrap"><table class="dc-table"><thead><tr><th>Pos</th><th>1st</th><th>2nd</th><th>3rd / Additional</th></tr></thead><tbody>
 ${rows.map(r=>`<tr><td class="dc-pos">${esc(r.pos)}</td><td>${uabDepthPlayerCell(r.first,true)}</td><td>${uabDepthPlayerCell(r.second)}</td><td>${uabDepthPlayerCell(r.third)}${r.additional?`<div style="margin-top:7px">${uabDepthPlayerCell(r.additional)}</div>`:''}</td></tr>`).join('')}
 </tbody></table></div>`:'<div class="empty">Depth chart has not loaded yet.</div>'}</div>`;
}
function depthChartPage(){return (supportsSeasonSplit()||isCurrentSeasonOpponent())?opponentDepthChartPage():msstDepthChartPage()}

function playersPage(){
 let all=offenseRoster(),list=filteredPlayers(),posCounts={};
 all.forEach(p=>posCounts[normPos(p.position)]=(posCounts[normPos(p.position)]||0)+1);
 return `<div class="page-title"><div class="pi-title-row"><h2>Player Intelligence</h2>${supportsSeasonSplit()?playerSeasonToggle():''}</div></div>
 
 <div class="toolbar"><input id="playerSearch" placeholder="Search name, number, hometown or previous school" oninput="render()"><select id="playerSort" onchange="render()"><option value="number">Sort: number</option><option value="name">Sort: name</option><option value="position">Sort: position</option></select><div></div><div></div></div>
 <div class="position-tabs">${positionGroups().map(([id,l])=>`<button class="${group===id?'active':''}" onclick="setGroup('${id}')">${l}${id!=='ALL'&&posCounts[id]!=null?` (${posCounts[id]})`:''}</button>`).join('')}</div>
 <div class="kpis"><div class="kpi"><span>Defensive Players</span><b>${all.length}</b></div><div class="kpi"><span>Current View</span><b>${list.length}</b><small>${group==='ALL'?'All defense':group}</small></div></div>
 <div class="player-grid">${list.length?list.map(playerCard).join(''):'<div class="empty">No defensive players match this view.</div>'}</div>
 `;
}

function firstField(r,names){
 for(const k of names){if(r&&nonEmpty(r[k]))return r[k]}
 return '';
}
function pctText(n,d){return d?`${(100*n/d).toFixed(1)}%`:'—'}
function rawChartedPlayRows(){
 return (datasets.plays||[]).filter(r=>{
   let rp=String(firstField(r,['pff_RUNPASS','RUNPASS','run_pass','play_type'])||'').toUpperCase();
   if(activeOpponent==='SA')return (rp==='R'||rp==='P')&&num(r.pff_NOPLAY)!==1;
   return rp==='R'||rp==='P'||rp==='RUN'||rp==='PASS'||nonEmpty(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained']));
 });
}
function gcdInt(a,b){a=Math.abs(a);b=Math.abs(b);while(b){let t=b;b=a%b;a=t}return a||1}

function analyticsRawCounts(){
 let raw=rawChartedPlayRows();
 return {
   y2025:raw.filter(r=>playYear(r)==='2025').length,
   y2026:raw.filter(r=>playYear(r)==='2026').length
 };
}

function analyticsIsWeighted(){return supportsSeasonSplit()&&analyticsSeasonMode==='WEIGHTED'}
function seasonSplitRows(rows){
 return {
   y2025:(rows||[]).filter(r=>playYear(r)==='2025'),
   y2026:(rows||[]).filter(r=>playYear(r)==='2026')
 };
}
function balancedAvgRows(rows,getter){
 rows=rows||[];
 if(!rows.length)return 0;
 if(!analyticsIsWeighted())return avg(rows.map(getter));
 let {y2025,y2026}=seasonSplitRows(rows);
 let vals=[];
 if(y2025.length)vals.push(avg(y2025.map(getter)));
 if(y2026.length)vals.push(avg(y2026.map(getter)));
 return vals.length?avg(vals):0;
}
function balancedMedianRows(rows,getter){
 rows=rows||[];
 if(!rows.length)return 0;
 if(!analyticsIsWeighted())return calcMedian(rows.map(getter));
 // True weighted median: every season receives 50% of the total weight.
 let {y2025,y2026}=seasonSplitRows(rows);
 if(!y2025.length||!y2026.length)return calcMedian(rows.map(getter));
 let weighted=[];
 y2025.forEach(r=>weighted.push([getter(r),0.5/y2025.length]));
 y2026.forEach(r=>weighted.push([getter(r),0.5/y2026.length]));
 weighted.sort((a,b)=>a[0]-b[0]);
 let cum=0;
 for(let [v,w] of weighted){cum+=w;if(cum>=0.5)return v}
 return weighted.at(-1)?.[0]||0;
}

function dashboardPlayRows(){
 let raw=rawChartedPlayRows();
 if(!supportsSeasonSplit())return raw;
 if(analyticsSeasonMode==='2025')return raw.filter(r=>playYear(r)==='2025');
 if(analyticsSeasonMode==='2026')return raw.filter(r=>playYear(r)==='2026');
 return raw;
}
function analyticsModeBar(){
 if(!supportsSeasonSplit())return '';
 let c=analyticsRawCounts();
 return `<div class="analytics-season-bar no-print">
   <div class="analytics-season-copy"><b>Main Analytics Sample</b><span>2025: ${c.y2025} raw plays · 2026: ${c.y2026} raw plays</span></div>
   <div class="analytics-season-buttons">
     <button class="${analyticsSeasonMode==='2025'?'active':''}" onclick="setAnalyticsSeasonMode('2025')">2025 Raw</button>
     <button class="${analyticsSeasonMode==='2026'?'active':''}" onclick="setAnalyticsSeasonMode('2026')">2026 Raw</button>
     <button class="${analyticsSeasonMode==='WEIGHTED'?'active weighted':''}" onclick="setAnalyticsSeasonMode('WEIGHTED')">50 / 50 Weighted</button>
   </div>
   ${analyticsSeasonMode==='WEIGHTED'?`<div class="analytics-weight-note">Play counts stay as the actual combined sample. YPP, median YPP and other average-based metrics are calculated 50% from 2025 and 50% from 2026. No plays are added or duplicated.</div>`:''}
 </div>`;
}
function setAnalyticsSeasonMode(v){
 analyticsSeasonMode=v;
 localStorage.setItem('ulmAnalyticsSeasonMode',analyticsSeasonMode);
 render();
 window.scrollTo({top:0,behavior:'smooth'});
}
window.setAnalyticsSeasonMode=setAnalyticsSeasonMode;
function dashboardStats(rows){
 let gains=[],runRows=[],passRows=[],att=0,comp=0,sacks=0,ints=0,td=0,blitz=0,pressure=0;
 rows.forEach(r=>{
   let gain=num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained'])); gains.push(gain);
   let rp=String(firstField(r,['pff_RUNPASS','RUNPASS','run_pass','play_type'])||'').toUpperCase();
   if(rp==='R'||rp==='RUN')runRows.push(r); if(rp==='P'||rp==='PASS')passRows.push(r);
   let result=String(firstField(r,['pff_PASSRESULT','PASSRESULT','pass_result'])||'').toUpperCase();
   if(['COMPLETE','INCOMPLETE','INTERCEPTION','THROWN AWAY','HIT AS THREW','BATTED PASS'].includes(result))att++;
   if(result==='COMPLETE')comp++;
   if(result==='SACK'||nonEmpty(firstField(r,['pff_SACK'])))sacks++;
   if(result==='INTERCEPTION'||nonEmpty(firstField(r,['pff_INTERCEPTION'])))ints++;
   if(nonEmpty(firstField(r,['pff_TOUCHDOWN'])))td++;
   if(pffBool(firstField(r,['pff_BLITZDOG'])))blitz++;
   if(nonEmpty(firstField(r,['pff_QBPRESSURE'])))pressure++;
 });
 let n=gains.length,expl=gains.filter(x=>x>=15).length,neg=gains.filter(x=>x<=0).length;
 const gain=r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained']));
 return {
   n,
   ypp:n?balancedAvgRows(rows,gain):0,
   median:n?balancedMedianRows(rows,gain):0,
   expl,neg,
   runN:runRows.length,passN:passRows.length,
   runYpp:runRows.length?balancedAvgRows(runRows,gain):0,
   passYpp:passRows.length?balancedAvgRows(passRows,gain):0,
   att,comp,sacks,ints,td,blitz,pressure
 };
}

function groupCounts(rows,fields,limit=6){
 let g={};
 rows.forEach(r=>{
   let v=String(firstField(r,fields)||'').trim();
   if(!v)return;
   g[v]=(g[v]||0)+1;
 });
 return Object.entries(g).sort((a,b)=>b[1]-a[1]).slice(0,limit);
}
function rankList(items,total){
 if(!items.length)return `<div class="empty">Not available in the current data file.</div>`;
 let max=Math.max(...items.map(x=>x[1]),1);
 return `<div class="rank-list">${items.map(([k,n])=>`<div class="rank-row"><div class="rank-label">${esc(k)}</div><div class="rank-bar"><i style="width:${100*n/max}%"></i></div><div class="rank-val">${n} · ${pctText(n,total)}</div></div>`).join('')}</div>`;
}
function dashKpi(label,val,sub=''){
 return `<div class="dash-kpi"><span>${esc(label)}</span><b>${esc(value(val))}</b>${sub?`<small>${esc(sub)}</small>`:''}</div>`;
}
function dashboardDataStatus(){
 const items=[['plays','Play Feed'],['playerIntel','Player Intelligence']];
 return `<div class="dash-status">${items.map(([k,l])=>`<span class="data-chip ${loadState[k]?.ok?'ok':'bad'}">${loadState[k]?.ok?'✓':'○'} ${l}${loadState[k]?.ok?` · ${loadState[k].n}`:' · waiting'}</span>`).join('')}</div>`;
}


function loosePlayerName(v){
 return String(v||'').toLowerCase()
  .replace(/[.'’`-]/g,' ')
  .replace(/\b(jr|sr|ii|iii|iv)\b/g,' ')
  .replace(/[^a-z0-9 ]/g,' ')
  .replace(/\s+/g,' ').trim();
}
function piSummaryByVerifiedName(p){
 if(!p||!nonEmpty(p.name))return null;
 let nm=cleanName(p.name);
 return (datasets.playerIntel||[]).find(r=>cleanName(r.Name)===nm||loosePlayerName(r.Name)===loosePlayerName(p.name))||null;
}
function piHasVerifiedHistoricalIdentity(p){
 if(activeOpponent==='SELA'){
   let target=loosePlayerName(p?.name);
   return (datasets.playerIntel||[]).some(r=>loosePlayerName(r.Name)===target) ||
          (historicalRoster||[]).some(r=>loosePlayerName(r.name)===target);
 }
 if(activeOpponent==='UAB'){
   let target=loosePlayerName(p?.name);
   return (datasets.playerIntel||[]).some(r=>loosePlayerName(r.Name)===target);
 }
 return !!piSummaryByVerifiedName(p);
}
function piTokenMatchesPlayer(v,p){
 if(activeOpponent==='SA'){let row=piSummaryByVerifiedName(p);if(!row)return false;let j=jerseyNum(row['#']);return String(v||'').split(';').some(t=>new RegExp('\\bALSO\\s+D0?'+j+'\\b','i').test(t));}
 if(!nonEmpty(v)||!p)return false;
 let summary=piSummaryByVerifiedName(p);
 if(activeOpponent==='FAU'){
   if(cleanName(v)===cleanName(p.name))return true;
   let tokenNumber=tokenJersey(v),currentJersey=jerseyNum(p.number),pffJersey=jerseyNum(summary?.['#']);
   return !!(tokenNumber&&((currentJersey&&tokenNumber===currentJersey)||(pffJersey&&tokenNumber===pffJersey)));
 }
 if(!summary)return false;
 if(cleanName(v)===cleanName(p.name))return true;
 let historicalJersey=jerseyNum(summary['#']),tokenNumber=tokenJersey(v);
 return !!(historicalJersey&&tokenNumber&&historicalJersey===tokenNumber);
}
function piTagged(r,p,fields){return fields.some(k=>piTokenMatchesPlayer(r?.[k],p))}
function piRowsForPlayer(p){
 return dashboardPlayRows().filter(r=>piTagged(r,p,[
  'pff_TACKLE','pff_TACKLEASSIST','pff_STOP','pff_SACK','pff_QBPRESSURE',
  'pff_INTERCEPTION','pff_PASSBREAKUP','pff_FORCEDFUMBLE','pff_MISSEDTACKLE'
 ]));
}
function uabRawPlayerRow(key,p){
 if(activeOpponent!=='UAB'||!p)return null;
 let rows=datasets[key]||[],target=loosePlayerName(p.name);
 return rows.find(r=>loosePlayerName(r.Name)===target)||null;
}

function uabDirectRow(rows,p){
 if(activeOpponent!=='UAB'||!p)return null;
 let target=loosePlayerName(p.name);
 return (rows||[]).find(r=>cleanName(r.Name)===cleanName(p.name)||loosePlayerName(r.Name)===target)||null;
}
function uabCoverageStructureForPlayer(p,covRow){
 if(activeOpponent!=='UAB'||!p||!covRow)return {manPct:'—',zonePct:'—'};
 let j=String(Math.round(num(covRow['#']))).padStart(2,'0');
 let token=`ALBI D${j}`;
 let man=0,zone=0;
 (datasets.plays||[]).forEach(r=>{
   let players=String(r.pff_PASSCOVERAGEPLAYERS||'').toUpperCase();
   if(!players.includes(token))return;
   let c=String(r.pff_PASS_COVERAGE_BASIC||'').toUpperCase().trim();
   if(/^COVER\s*[01]\b/.test(c))man++;
   else if(/^COVER\s*[2346]\b/.test(c)||c.includes('QUARTERS')||c.includes('ZONE'))zone++;
 });
 let total=man+zone;
 return {manPct:total?`${(100*man/total).toFixed(1)}%`:'—',zonePct:total?`${(100*zone/total).toFixed(1)}%`:'—'};
}

function selaDirectRow(rows,p){
 if(activeOpponent!=='SELA'||!p)return null;
 let target=loosePlayerName(p.name);
 return (rows||[]).find(r=>cleanName(r.Name)===cleanName(p.name)||loosePlayerName(r.Name)===target)||null;
}
function selaCoverageStructureForPlayer(p,covRow){
 if(activeOpponent!=='SELA'||!p||!covRow)return {manPct:'—',zonePct:'—'};
 let j=String(Math.round(num(covRow['#']))).padStart(2,'0'),token=`LASE D${j}`,man=0,zone=0;
 (datasets.plays||[]).forEach(r=>{
   let players=String(r.pff_PASSCOVERAGEPLAYERS||'').toUpperCase();
   if(!players.includes(token))return;
   let c=String(r.pff_PASS_COVERAGE_BASIC||'').toUpperCase().trim();
   if(/^COVER\s*[01]\b/.test(c))man++;
   else if(/^COVER\s*[2346]\b/.test(c)||c.includes('QUARTERS')||c.includes('ZONE'))zone++;
 });
 let total=man+zone;
 return {manPct:total?`${(100*man/total).toFixed(1)}%`:'—',zonePct:total?`${(100*zone/total).toFixed(1)}%`:'—'};
}

function fauDirectRow(rows,p){
 if(!isCurrentSeasonOpponent()||!p)return null;
 let target=loosePlayerName(p.name);
 return (rows||[]).find(r=>cleanName(r.Name)===cleanName(p.name)||loosePlayerName(r.Name)===target)||null;
}
function piStats(p){
 let summary=piSummaryByVerifiedName(p);
 if(isCurrentSeasonOpponent()){
   let def=fauDirectRow((activeOpponent==='SA'?(datasets.playerIntel||[]):FAU_PFF_76),p)||{},rush=fauDirectRow((activeOpponent==='SA'?(datasets.playerRush||[]):FAU_PFF_77),p)||{},run=fauDirectRow((activeOpponent==='SA'?(datasets.playerRun||[]):FAU_PFF_78),p)||{},cov=fauDirectRow((activeOpponent==='SA'?(datasets.playerCoverage||[]):FAU_PFF_79),p)||{},tkl=fauDirectRow((activeOpponent==='SA'?(datasets.tackling||[]):FAU_PFF_80),p)||{};
   let matched=!!(def.Name||rush.Name||run.Name||cov.Name||tkl.Name);
   if(!matched)return {rows:0,tackles:0,assists:0,stops:0,sacks:0,pressures:0,targets:0,comp:0,ints:0,td:0,pbu:0,mt:0,verified:false};
   return {
     rows:num(def.DEF),tackles:num(tkl.TKL||def.TKL),totalTackles:num(tkl['TOT TKL']),assists:num(tkl.AST||def.AST),
     stops:num(tkl.STOP||run.STOP),sacks:num(rush.SK||tkl.SK||def.SK),pressures:num(rush.TPR||def.TPR),
     targets:num(cov.CTGT||def.CTGT),comp:num(cov['REC ALL']),ints:num(cov.INT||def.INT),td:num(cov.TD),pbu:num(cov.PBU||def.PBU),
     mt:num(tkl.MT||def.MT),runMt:num(tkl['MT.1']),passMt:num(tkl['MT.2']),mtPct:tkl['MT%']||'',
     runGrade:run['RUND GRD']||'—',rushGrade:rush['PRSH GRD']||'—',covGrade:cov.COV||'—',
     compPct:cov['COMP%']||'—',passYds:nonEmpty(cov['P YDS ALL'])?num(cov['P YDS ALL']):'—',rating:cov.RTG||'—',
     prWin:rush['WIN%']||'—',prPct:rush['PR%']||'—',
     covSnaps:num(cov['COV.1']),rushSnaps:num(rush.PRSH),runSnaps:num(run.RUND),verified:true
   };
 }
 if(activeOpponent==='SELA'){
   let def=selaDirectRow(SELA_PFF_50,p)||{},rush=selaDirectRow(SELA_PFF_60,p)||{},run=selaDirectRow(SELA_PFF_61,p)||{},cov=selaDirectRow(SELA_PFF_62,p)||{},tkl=selaDirectRow(SELA_PFF_54,p)||{};
   let matched=!!(def.Name||rush.Name||run.Name||cov.Name||tkl.Name);
   if(!matched)return {rows:0,tackles:0,assists:0,stops:0,sacks:0,pressures:0,targets:0,comp:0,ints:0,td:0,pbu:0,mt:0,verified:false};
   let structure=selaCoverageStructureForPlayer(p,cov);
   return {
     rows:num(def.DEF),tackles:num(tkl.TKL||def.TKL),totalTackles:num(tkl['TOT TKL']),assists:num(tkl.AST||def.AST),
     stops:num(tkl.STOP||run.STOP),sacks:num(rush.SK||tkl.SK||def.SK),pressures:num(rush.TPR||def.TPR),
     targets:num(cov.CTGT||def.CTGT),comp:num(cov['REC ALL']),ints:num(cov.INT||def.INT),td:num(cov.TD),pbu:num(cov.PBU||def.PBU),
     mt:num(tkl.MT||def.MT),runMt:num(tkl['MT.1']),passMt:num(tkl['MT.2']),mtPct:tkl['MT%']||'',
     runGrade:run['RUND GRD']||'—',rushGrade:rush['PRSH GRD']||'—',covGrade:cov.COV||'—',
     compPct:cov['COMP%']||'—',passYds:nonEmpty(cov['P YDS ALL'])?num(cov['P YDS ALL']):'—',rating:cov.RTG||'—',
     prWin:rush['WIN%']||'—',prPct:rush['PR%']||'—',zonePct:structure.zonePct,manPct:structure.manPct,
     covSnaps:num(cov['COV.1']),rushSnaps:num(rush.PRSH),runSnaps:num(run.RUND),verified:true
   };
 }
 if(activeOpponent==='UAB'){
   let def=uabDirectRow(UAB_PFF_32,p)||{};
   let rush=uabDirectRow(UAB_PFF_33,p)||{};
   let run=uabDirectRow(UAB_PFF_34,p)||{};
   let cov=uabDirectRow(UAB_PFF_35,p)||{};
   let tkl=uabDirectRow(UAB_PFF_49,p)||{};
   let matched=!!(def.Name||rush.Name||run.Name||cov.Name||tkl.Name);
   if(!matched)return {rows:0,tackles:0,assists:0,stops:0,sacks:0,pressures:0,targets:0,comp:0,ints:0,td:0,pbu:0,mt:0,verified:false};
   let structure=uabCoverageStructureForPlayer(p,cov);
   return {
     rows:num(def.DEF),
     tackles:num(tkl.TKL||def.TKL),totalTackles:num(tkl['TOT TKL']),assists:num(tkl.AST||def.AST),
     stops:num(tkl.STOP||run.STOP),sacks:num(rush.SK||tkl.SK||def.SK),pressures:num(rush.TPR||def.TPR),
     targets:num(cov.CTGT||def.CTGT),comp:num(cov['REC ALL']),ints:num(cov.INT||def.INT),td:num(cov.TD),pbu:num(cov.PBU||def.PBU),
     mt:num(tkl.MT||def.MT),runMt:num(tkl['MT.1']),passMt:num(tkl['MT.2']),mtPct:tkl['MT%']||'',
     runGrade:run['RUND GRD']||'—',rushGrade:rush['PRSH GRD']||'—',covGrade:cov.COV||'—',
     compPct:cov['COMP%']||'—',passYds:nonEmpty(cov['P YDS ALL'])?num(cov['P YDS ALL']):'—',
     rating:cov.RTG||'—',prWin:rush['WIN%']||'—',prPct:rush['PR%']||'—',
     zonePct:structure.zonePct,manPct:structure.manPct,covSnaps:num(cov['COV.1']),rushSnaps:num(rush.PRSH),runSnaps:num(run.RUND),
     verified:true
   };
 }
 if(!summary)return {rows:0,tackles:0,assists:0,stops:0,sacks:0,pressures:0,targets:0,comp:0,ints:0,td:0,pbu:0,mt:0,verified:false};
 return {
   rows:num(summary.DEF),tackles:num(summary.TKL),assists:num(summary.AST),stops:num(summary.STOP),sacks:num(summary.SK),pressures:num(summary.TPR),
   targets:num(summary.CTGT),comp:num(summary.REC_ALLOWED),ints:num(summary.INT),td:num(summary.TD_ALLOWED),pbu:num(summary.PBU),mt:num(summary.MT),
   defGrade:summary.DEF_GRD||'',runGrade:summary.RUND_GRD||'',rushGrade:summary.PRSH_GRD||'',covGrade:summary.COV_GRD||'',
   compPct:summary.COMP_PCT_ALLOWED||'',passYds:num(summary.PASS_YDS_ALLOWED),rating:summary.RTG_ALLOWED||'',
   prWin:summary.PR_WIN_PCT||'',prPct:summary.PRESSURE_PCT||'',zonePct:summary.ZONE_PCT||'',manPct:summary.MAN_PCT||'',verified:true
 };
}
function piLeaderboard(players,metric,limit=6){
 return players.map(p=>({p,s:piStats(p)})).map(x=>{
  let v=metric==='rush'?x.s.pressures+x.s.sacks:metric==='tackle'?(x.s.totalTackles||x.s.tackles+x.s.assists):metric==='coverage'?x.s.targets:x.s.rows;
  return {...x,v};
 }).filter(x=>x.v>0).sort((a,b)=>b.v-a.v).slice(0,limit);
}

function leaderHeadshot(p){
 return `<div class="leader-headshot">${p.image?`<img src="${esc(p.image)}" data-alt="${esc(p.officialImageSource||p.supabaseImageBackup||'')}" alt="${esc(p.name)}" onerror="if(this.dataset.alt&&this.src!==this.dataset.alt){this.src=this.dataset.alt;this.dataset.alt=''}else{this.remove();this.parentElement.innerHTML='<div class=&quot;initials&quot;>${initials(p.name)}</div>'}">`:`<div class="initials">${initials(p.name)}</div>`}</div>`;
}
function leaderMetricLabel(metric){return metric==='rush'?'Rush Impact':metric==='coverage'?'Targets':'Tackles'}
function piLeaderCard(title,items,metric){
 return `<div class="leader-board"><h3>${esc(title)}</h3><div class="sub">${metric==='rush'?'Pressure and sack production':metric==='coverage'?'Most involved defenders in coverage':'Tackle production'}</div>
 ${items.length?items.map((x,i)=>{
   let idx=roster.indexOf(x.p);
   let sub=metric==='rush'?`${x.s.sacks} sacks · ${x.s.pressures} pressures`
    :metric==='coverage'?`${x.s.comp}/${x.s.targets} completions · ${x.s.ints} INT · ${x.s.pbu} PBU`
    :`${x.s.stops} stops · ${x.s.mt||0} missed`;
   let click=idx>=0
     ?`role="button" tabindex="0" onclick="openPlayerIndex(${idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openPlayerIndex(${idx})}"`
     :(x.p.profile?`role="button" tabindex="0" onclick="window.open('${esc(x.p.profile)}','_blank')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.open('${esc(x.p.profile)}','_blank')}"`:'');
   return `<div class="leader-entry" ${click}>
     <div class="leader-rank">${i+1}</div>${leaderHeadshot(x.p)}
     <div class="leader-info"><div class="leader-name">${esc(x.p.name)}</div><div class="leader-meta">#${esc(x.p.number||'—')} · ${esc(x.p.position||normPos(x.p.position))}</div><div class="leader-sub">${esc(sub)}</div></div>
     <div class="leader-value"><b>${x.v}</b><span>${leaderMetricLabel(metric)}</span></div>
   </div>`;
 }).join(''):'<div class="empty">No explicit player production is available.</div>'}</div>`;
}
function leadersPage(){
 let current=offenseRoster();
 let verified=current.filter(piHasVerifiedHistoricalIdentity);
 let dl=verified.filter(p=>normPos(p.position)==='DL');
 let lb=verified.filter(p=>normPos(p.position)==='LB');
 let db=verified.filter(p=>normPos(p.position)==='DB');

 let rush=piLeaderboard(dl.concat(lb),'rush');
 let coverage=piLeaderboard(db.concat(lb),'coverage');

 let tackle;
 if(activeOpponent==='UAB'){
   let currentMap=new Map(current.map(p=>[loosePlayerName(p.name),p]));
   tackle=uabTackleSummaryRows()
     .filter(x=>!x.p.historicalOnly && currentMap.has(loosePlayerName(x.p.name)) && x.total>0)
     .sort((a,b)=>b.total-a.total).slice(0,8)
     .map(x=>({p:currentMap.get(loosePlayerName(x.p.name)),s:{tackles:x.tkl,totalTackles:x.total,assists:x.ast,mt:x.mt,stops:x.stop},v:x.total}));
 }else if(activeOpponent==='SELA'){
   tackle=selaTackleSummaryRows()
     .filter(x=>x.total>0).sort((a,b)=>b.total-a.total).slice(0,8)
     .map(x=>({p:x.p,s:{tackles:x.tkl,totalTackles:x.total,assists:x.ast,mt:x.mt,stops:x.stop},v:x.total}));
 }else{
   tackle=piLeaderboard(verified,'tackle');
 }

 return `<div class="page-title"><h2>Defensive Leaders</h2><p>Current-roster defenders most involved in pass rush, tackling and coverage.</p></div>
 <div class="leaders-page-grid">
   ${piLeaderCard('Pass-Rush Leaders',rush,'rush')}
   ${piLeaderCard('Tackle Leaders',tackle,'tackle')}
   ${piLeaderCard('Coverage Leaders',coverage,'coverage')}
 </div>`;
}


function reportHash(r){return cvHash(r)}
function reportHashOptions(current){
 return `<option value="ALL" ${current==='ALL'?'selected':''}>All Hashes</option>
 <option value="L" ${current==='L'?'selected':''}>Left Hash</option>
 <option value="C" ${current==='C'?'selected':''}>Middle</option>
 <option value="R" ${current==='R'?'selected':''}>Right Hash</option>`;
}
function setDashHash(v){dashHashF=v;render()}
function setPassHash(v){passHashF=v;render()}

function dashboardPage(){
 let allRows=dashboardPlayRows(),rows=allRows.filter(r=>(dashHashF==='ALL'||reportHash(r)===dashHashF)&&dndMatches(r)),s=dashboardStats(rows),def=offenseRoster();
 let dl=def.filter(p=>normPos(p.position)==='DL').length,lb=def.filter(p=>normPos(p.position)==='LB').length,db=def.filter(p=>normPos(p.position)==='DB').length;
 let personnel=groupCounts(rows,['pff_OFFPERSONNELBASIC','pff_OFFPERSONNEL','PERSONNEL','personnel']);
 let fronts=groupCounts(rows,['pff_DEFENSIVE_FRONT_NAME','pff_DEFPERSONNEL']);
 let passRows=rows.filter(r=>['P','PASS'].includes(String(firstField(r,['pff_RUNPASS'])||'').toUpperCase()));
 let coverage=groupCounts(passRows,['pff_PASS_COVERAGE_BASIC','pff_PASSCOVERAGE']);
 let rushObj={};passRows.forEach(r=>{let k=pffLeadingCount(firstField(r,['pff_PASSRUSHPLAYERS']));if(k)rushObj[k]=(rushObj[k]||0)+1});let rushCount=Object.entries(rushObj).sort((a,b)=>b[1]-a[1]);
 let has=rows.length>0;
 return `<div class="page-title"><h2>Dashboard</h2><p>${activeOpponentName()} defensive scouting overview for the ULM offensive staff.</p></div>
 <div class="report-hash-filter"><label>Hash<select onchange="setDashHash(this.value)">${reportHashOptions(dashHashF)}</select></label>${dndSelect()}</div>
 ${dashboardDataStatus()}
 ${!has?`<div class="dashboard-empty"><b>Opponent data is not loaded.</b>Player Intelligence is connected to the selected opponent roster. Data loads from <code>Offensive Intelligence / ${activeOpponent==='UAB'?'UAB':'Mississippi State'} / Current</code>. Nothing here is estimated or fabricated.</div>`:''}
 <div class="dash-grid">
   <div class="dash-card span-12">
     <div class="section-head"><div><h3>Defensive Snapshot</h3><small>${has?`${s.n} charted plays`:'waiting for play data'}</small></div></div>
     <div class="dash-kpis">
       ${dashKpi('YPP Allowed',has?fmt(s.ypp,2):'—','all charted plays')}
       ${dashKpi('Median YPP',has?fmt(s.median,1):'—','all charted plays')}
       ${dashKpi('Explosive %',has?pctText(s.expl,s.n):'—','15+ yards')}
       ${dashKpi('Negative %',has?pctText(s.neg,s.n):'—','0 or fewer yards')}
       ${dashKpi('Run YPP',has&&s.runN?fmt(s.runYpp,2):'—',has?`${s.runN} runs`:'waiting')}
       ${dashKpi('Pass YPP',has&&s.passN?fmt(s.passYpp,2):'—',has?`${s.passN} passes`:'waiting')}
       ${dashKpi('Completion %',has&&s.att?pctText(s.comp,s.att):'—',has?`${s.comp}/${s.att}`:'waiting')}
       ${dashKpi('Sack %',has&&s.passN?pctText(s.sacks,s.passN):'—',has?`${s.sacks} sacks`:'waiting')}
       ${dashKpi('INT %',has&&s.att?pctText(s.ints,s.att):'—',has?`${s.ints} INT`:'waiting')}
       ${dashKpi('Blitz %',s.passN?pctText(passRows.filter(r=>pffBool(firstField(r,['pff_BLITZDOG']))).length,s.passN):'—','pass plays')}
       ${dashKpi('Pressure %',s.passN?pctText(passRows.filter(r=>nonEmpty(firstField(r,['pff_QBPRESSURE']))).length,s.passN):'—','pass plays')}
       ${dashKpi('TD Allowed',has?s.td:'—','charted sample')}
     </div>
   </div>

   <div class="dash-card span-4">
     <h3>Defensive Personnel</h3><div class="dash-sub">Shared Player Intelligence roster</div>
     <div class="metric-grid">${metric('DL',dl)}${metric('LB',lb)}${metric('DB',db)}${metric('Total',def.length)}</div>
     <div class="sample-note">Roster identity is shared across the intelligence apps. Analytics remain opponent-specific.</div>
   </div>

   <div class="dash-card span-4">
     <h3>Offensive Personnel Faced</h3><div class="dash-sub">What structures ${activeOpponentName()} has defended</div>
     ${rankList(personnel,s.n)}
   </div>

   <div class="dash-card span-4">
     <h3>Front Usage</h3><div class="dash-sub">Most common tagged defensive fronts</div>
     ${rankList(fronts,s.n)}
   </div>

   <div class="dash-card span-6">
     <h3>Coverage Family</h3><div class="dash-sub">Coverage usage from charted pass plays</div>
     ${rankList(coverage,passRows.length)}
   </div>

   <div class="dash-card span-6">
     <h3>Rush Count</h3><div class="dash-sub">Number of pass rushers when tagged</div>
     ${rankList(rushCount,passRows.length)}
   </div>

   <div class="dash-card span-12">
     <h3>Jump Into The Detail</h3><div class="dash-sub">Each dashboard area will drill into its own offensive-staff scouting workspace.</div>
     <div class="quick-links">
       <button class="quick-link" onclick="goPage('personnel')"><b>Personnel & Fronts</b><small>Structures, box counts and front usage</small></button>
       <button class="quick-link" onclick="goPage('run')"><b>Run Defense</b><small>Gaps, direction, fits and efficiency</small></button>
       <button class="quick-link" onclick="goPage('coverage')"><b>Coverage</b><small>Shell, man/zone and coverage family</small></button>
       <button class="quick-link" onclick="goPage('pressure')"><b>Pressure</b><small>Blitz, rush count, sacks and stress</small></button>
       <button class="quick-link" onclick="goPage('situations')"><b>Situations</b><small>Down, distance and field zone</small></button>
       <button class="quick-link" onclick="goPage('heatmaps')"><b>Field Heat Maps</b><small>Where the defense is being attacked</small></button><button class="quick-link" onclick="goPage('structures')"><b>Structure Response</b><small>How they adjust to formation, motion and personnel</small></button>
       <button class="quick-link" onclick="goPage('players')"><b>Player Intelligence</b><small>Shared DL, LB and DB profiles</small></button>
       <button class="quick-link" onclick="goPage('advantage')"><b>Advantage Theory</b><small>Optional sample-only layer later</small></button>
     </div>
   </div>
 </div>`;
}


