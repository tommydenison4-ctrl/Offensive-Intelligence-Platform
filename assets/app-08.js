function pffFormation(r){return String(firstField(r,['pff_OFFENSIVE_FORMATION_NAME','pff_STARTING_OFFENSIVE_FORMATION_NAME','pff_OFFFORMATION'])||'').trim()}
function ulmFormationFromPFF(v){let raw=String(v||'').trim().toUpperCase();return ULM_FORMATION_MAP[raw]||''}
function ulmFormation(r){if(activeOpponent==='SA'&&r.ulmFormation)return r.ulmFormation;let raw=pffFormation(r);return ulmFormationFromPFF(raw)||raw||'Unknown'}
function srFormation(r){return ulmFormation(r)}

function srMotion(r){
 let v=String(firstField(r,['pff_SHIFTMOTION'])||'').trim();
 return v?'Motion / Shift Tagged':'No Motion / Shift Tag';
}
function srStructure(r){
 let g=String(firstField(r,['pff_OFFFORMATIONGROUP','pff_STARTING_OFFENSIVE_FORMATION_GROUP'])||'').trim();
 if(g)return g;
 let f=srFormation(r).toUpperCase();
 if(!f)return '';
 if(f.includes('EMPTY'))return'Empty';
 if(f.includes('BUNCH'))return'Bunch';
 return'Other';
}
function srBackLocation(r){
 return String(firstField(r,['pff_RBALIGNMENT','RB_ALIGNMENT','rb_alignment','BACK_LOCATION','back_location'])||'').trim();
}
function srTESurface(r){return String(firstField(r,['pff_TEALIGNMENT','TE_SURFACE','te_surface'])||'').trim()}
function srRows(){
 return dashboardPlayRows().filter(r=>
   (srFormationF==='ALL'||srFormation(r)===srFormationF) &&
   (srPersonnelF==='ALL'||pfPersonnel(r)===srPersonnelF) &&
   (srMotionF==='ALL'||srMotion(r)===srMotionF) &&
   (srStructureF==='ALL'||srStructure(r)===srStructureF) &&
   (srDownF==='ALL'||pfDown(r)===srDownF) &&
   (srFieldF==='ALL'||pfFieldZone(r)===srFieldF) &&
   (srHashF==='ALL'||cvHash(r)===srHashF) &&
   dndMatches(r)
 );
}
function srMetrics(rows){
 let s=dashboardStats(rows);
 return {...s};
}
function srBreakdown(rows,fn){
 let m={};rows.forEach(r=>{let k=fn(r)||'Unknown';(m[k] ||= []).push(r)});
 return Object.entries(m).map(([k,a])=>({k,...srMetrics(a)})).sort((a,b)=>b.n-a.n);
}
function srTable(arr,total){
 return arr.map(x=>[
   esc(x.k),x.n,pctText(x.n,total),fmt(x.ypp,2),fmt(x.median,1),
   pctText(x.expl,x.n),pctText(x.neg,x.n),`${x.runN}/${x.passN}`
 ]);
}
function srResponse(rows,fn){
 let b=srBreakdown(rows,fn);
 return b[0]||null;
}
function srComboRows(rows){
 let m={};
 rows.forEach(r=>{
   let f=srFormation(r)||'Unknown Formation',front=pfFront(r)||'Unknown Front',cov=cvFamily(r)||'Unknown Coverage',box=pfBox(r)||'Unknown Box';
   let k=f+'||'+front+'||'+cov+'||'+box;(m[k] ||= []).push(r);
 });
 return Object.entries(m).map(([k,a])=>{
   let [formation,front,coverage,box]=k.split('||');let s=srMetrics(a);
   return {formation,front,coverage,box,...s}
 }).sort((a,b)=>b.n-a.n).slice(0,16);
}
function setSR(key,val){
 if(key==='formation')srFormationF=val;if(key==='personnel')srPersonnelF=val;if(key==='motion')srMotionF=val;
 if(key==='structure')srStructureF=val;if(key==='down')srDownF=val;if(key==='field')srFieldF=val;if(key==='hash')srHashF=val;render();
}
function resetSR(){srFormationF=srPersonnelF=srMotionF=srStructureF=srDownF=srFieldF=srHashF='ALL';dndFilter='ALL';render()}


function formationPerfRows(rows){
 let m={};
 rows.forEach(r=>{let ulm=ulmFormation(r)||'Unknown',raw=pffFormation(r)||'Unknown';if(!m[ulm])m[ulm]={rows:[],raw:new Set()};m[ulm].rows.push(r);m[ulm].raw.add(raw)});
 return Object.entries(m).map(([k,obj])=>{
   let a=obj.rows,s=dashboardStats(a),runs=a.filter(r=>['R','RUN'].includes(String(firstField(r,['pff_RUNPASS'])||'').toUpperCase())),passes=a.filter(r=>['P','PASS'].includes(String(firstField(r,['pff_RUNPASS'])||'').toUpperCase()));
   let runG=runs.map(r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained']))),passG=passes.map(r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained'])));
   let att=0,comp=0,sacks=0,ints=0,first=0;
   a.forEach(r=>{if(pffBool(firstField(r,['pff_FIRST_DOWN_GAINED'])))first++});
   passes.forEach(r=>{let res=String(firstField(r,['pff_PASSRESULT'])||'').toUpperCase();if(['COMPLETE','INCOMPLETE','INTERCEPTION','THROWN AWAY','HIT AS THREW','BATTED PASS'].includes(res))att++;if(res==='COMPLETE')comp++;if(res==='SACK'||nonEmpty(firstField(r,['pff_SACK'])))sacks++;if(res==='INTERCEPTION'||nonEmpty(firstField(r,['pff_INTERCEPTION'])))ints++});
   return {k,pff:[...obj.raw].sort(),...s,runYpp:runs.length?balancedAvgRows(runs,r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained']))):0,passYpp:passes.length?balancedAvgRows(passes,r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained']))):0,att,comp,sacks,ints,first};
 }).sort((a,b)=>b.n-a.n);
}
function formationPerfTable(arr,total){return arr.map(x=>[
 `<span class="fm-ulm-name">${esc(x.k)}</span><span class="fm-pff-source">PFF: ${esc(x.pff.join(' / '))}</span>`,x.n,pctText(x.n,total),`${x.runN}/${x.passN}`,fmt(x.ypp,2),fmt(x.median,1),x.runN?fmt(x.runYpp,2):'—',x.passN?fmt(x.passYpp,2):'—',pctText(x.expl,x.n),pctText(x.neg,x.n),pctText(x.first,x.n),x.td,x.att?pctText(x.comp,x.att):'—',x.sacks,x.ints
])}
function fmRowsBase(){return dashboardPlayRows()}
function fmRows(){return fmRowsBase().filter(r=>(fmFormationF==='ALL'||ulmFormation(r)===fmFormationF)&&(fmPersonnelF==='ALL'||pfPersonnel(r)===fmPersonnelF)&&(fmMotionF==='ALL'||srMotion(r)===fmMotionF)&&(fmDownF==='ALL'||pfDown(r)===fmDownF)&&(fmFieldF==='ALL'||pfFieldZone(r)===fmFieldF)&&(fmHashF==='ALL'||cvHash(r)===fmHashF)&&dndMatches(r))}
function setFM(k,v){if(k==='formation')fmFormationF=v;if(k==='personnel')fmPersonnelF=v;if(k==='motion')fmMotionF=v;if(k==='down')fmDownF=v;if(k==='field')fmFieldF=v;if(k==='hash')fmHashF=v;render()}
function resetFM(){fmFormationF=fmPersonnelF=fmMotionF=fmDownF=fmFieldF=fmHashF='ALL';dndFilter='ALL';render()}
function formationsPage(){
 let all=fmRowsBase(),rows=fmRows(),perf=formationPerfRows(rows),s=dashboardStats(rows);
 let forms=uniqueVals(all,ulmFormation),pers=uniqueVals(all,pfPersonnel),motions=uniqueVals(all,srMotion),downs=uniqueVals(all,pfDown),fields=uniqueVals(all,pfFieldZone);
 let mapped=all.filter(r=>ulmFormationFromPFF(pffFormation(r))).length,unmapped=all.length-mapped;
 return `<div class="page-title"><h2>Formation Performance</h2><p>How offensive formations performed against ${activeOpponentName()}, in ULM formation language.</p></div>
 <div class="fm-note">ULM formation names are primary. The PFF source label is shown underneath only for reference. Unmapped PFF formations stay unchanged rather than being guessed.</div>
 <div class="fm-toolbar">
  <label>ULM Formation<select onchange="setFM('formation',this.value)"><option value="ALL">All ULM Formations</option>${forms.map(v=>`<option ${fmFormationF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
  <label>Personnel<select onchange="setFM('personnel',this.value)"><option value="ALL">All Personnel</option>${pers.map(v=>`<option ${fmPersonnelF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
  <label>Motion<select onchange="setFM('motion',this.value)"><option value="ALL">All Motion States</option>${motions.map(v=>`<option ${fmMotionF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
  <label>Down<select onchange="setFM('down',this.value)"><option value="ALL">All Downs</option>${downs.map(v=>`<option ${fmDownF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
  <label>Field Zone<select onchange="setFM('field',this.value)"><option value="ALL">All Field Zones</option>${fields.map(v=>`<option ${fmFieldF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
  <label>Hash<select onchange="setFM('hash',this.value)">${reportHashOptions(fmHashF)}</select></label>
  ${dndSelect()}<div class="fm-reset"><button onclick="resetFM()">Reset Filters</button></div>
 </div>
 <div class="fm-summary">
  <div class="fm-kpi"><span>Filtered Plays</span><b>${rows.length}</b></div><div class="fm-kpi"><span>ULM Formations</span><b>${perf.length}</b></div><div class="fm-kpi"><span>YPP</span><b>${rows.length?fmt(s.ypp,2):'—'}</b></div><div class="fm-kpi"><span>Median YPP</span><b>${rows.length?fmt(s.median,1):'—'}</b></div><div class="fm-kpi"><span>Explosive %</span><b>${rows.length?pctText(s.expl,s.n):'—'}</b></div><div class="fm-kpi"><span>Negative %</span><b>${rows.length?pctText(s.neg,s.n):'—'}</b></div>
 </div>
 <div class="fm-table-card"><h3>Formation Results</h3><div class="fm-table-wrap">${table(['ULM Formation','Plays','Usage','Run/Pass','YPP','Median','Run YPP','Pass YPP','Expl %','Neg %','1D %','TD','Comp %','Sacks','INT'],formationPerfTable(perf,rows.length))}</div></div>
 <div class="sample-note" style="margin-top:10px">${mapped} of ${all.length} plays match one of the 20 taught PFF→ULM formation translations. ${unmapped} plays retain their PFF source name because no ULM translation was present in the taught map.</div>`;
}

function structuresPage(){
 let all=dashboardPlayRows(),rows=srRows(),s=srMetrics(rows);
 let forms=uniqueVals(all,srFormation),pers=uniqueVals(all,pfPersonnel),motions=uniqueVals(all,srMotion),structures=uniqueVals(all,srStructure),
     downs=uniqueVals(all,pfDown),fields=uniqueVals(all,pfFieldZone),hashes=uniqueVals(all,cvHash);
 let formB=srBreakdown(rows,srFormation),structB=srBreakdown(rows,srStructure),motionB=srBreakdown(rows,srMotion);
 let topFront=srResponse(rows,pfFront),topBox=srResponse(rows,pfBox),topCov=srResponse(rows,cvFamily),topPress=srResponse(rows,prType);
 return `<div class="page-title"><h2>Structure Response</h2><p>How ${esc(activeOpponentName())} changes its defensive structure against offensive formations, personnel, motion and alignment.</p></div>
 ${!all.length?`<div class="pf-empty"><b>No charted play data is loaded yet.</b><br>This page is built and will populate when the opponent-defense play feed is available.</div>`:''}

 <div class="sr-toolbar">
   <label>Formation<select onchange="setSR('formation',this.value)"><option value="ALL">All Formations</option>${forms.map(v=>`<option ${srFormationF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Personnel<select onchange="setSR('personnel',this.value)"><option value="ALL">All Personnel</option>${pers.map(v=>`<option ${srPersonnelF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Motion<select onchange="setSR('motion',this.value)"><option value="ALL">All Motion States</option>${motions.map(v=>`<option ${srMotionF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Structure<select onchange="setSR('structure',this.value)"><option value="ALL">All Structures</option>${structures.map(v=>`<option ${srStructureF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Down<select onchange="setSR('down',this.value)"><option value="ALL">All Downs</option>${downs.map(v=>`<option ${srDownF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Field Zone<select onchange="setSR('field',this.value)"><option value="ALL">All Field Zones</option>${fields.map(v=>`<option ${srFieldF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Hash<select onchange="setSR('hash',this.value)"><option value="ALL">All Hashes</option>${hashes.map(v=>`<option ${srHashF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   ${dndSelect()}<div class="sr-reset"><button onclick="resetSR()">Reset Filters</button></div>
 </div>

 <div class="sr-kpis">
   <div class="sr-kpi"><span>Plays</span><b>${rows.length||'—'}</b></div>
   <div class="sr-kpi"><span>YPP</span><b>${rows.length?fmt(s.ypp,2):'—'}</b></div>
   <div class="sr-kpi"><span>Median YPP</span><b>${rows.length?fmt(s.median,1):'—'}</b></div>
   <div class="sr-kpi"><span>Explosive %</span><b>${rows.length?pctText(s.expl,s.n):'—'}</b></div>
   <div class="sr-kpi"><span>Negative %</span><b>${rows.length?pctText(s.neg,s.n):'—'}</b></div>
   <div class="sr-kpi"><span>Run Plays</span><b>${rows.length?s.runN:'—'}</b></div>
   <div class="sr-kpi"><span>Pass Plays</span><b>${rows.length?s.passN:'—'}</b></div>
   <div class="sr-kpi"><span>TD</span><b>${rows.length?s.td:'—'}</b></div>
 </div>

 <div class="sr-grid">
   <div class="sr-section sr-span-12">
     <h3>Defensive Response Snapshot</h3><div class="sr-sub">Most common response inside the current offensive-structure filter.</div>
     <div class="sr-response-grid">
       <div class="sr-response"><span>Most Common Front</span><b>${topFront?esc(topFront.k):'—'}</b><small>${topFront?`${topFront.n} plays · ${pctText(topFront.n,rows.length)}`:'No sample'}</small></div>
       <div class="sr-response"><span>Most Common Box</span><b>${topBox?esc(topBox.k):'—'}</b><small>${topBox?`${topBox.n} plays · ${pctText(topBox.n,rows.length)}`:'No sample'}</small></div>
       <div class="sr-response"><span>Most Common Coverage</span><b>${topCov?esc(topCov.k):'—'}</b><small>${topCov?`${topCov.n} plays · ${pctText(topCov.n,rows.length)}`:'No sample'}</small></div>
       <div class="sr-response"><span>Most Common Pressure</span><b>${topPress?esc(topPress.k):'—'}</b><small>${topPress?`${topPress.n} plays · ${pctText(topPress.n,rows.length)}`:'No sample'}</small></div>
     </div>
   </div>

   <div class="sr-section sr-keep-full">
     <h3>By Structure Family</h3><div class="sr-sub">Trips, bunch, condensed, empty, 2x2 and other structures.</div>
     <div class="sr-table-wrap">${table(['Structure','Plays','Usage','YPP','Median','Expl %','Neg %','R/P'],srTable(structB,rows.length))}</div>
   </div>

   <div class="sr-section sr-span-4">
     <h3>Motion Response</h3><div class="sr-sub">How the defense performs against motion states when tagged.</div>
     <div class="sr-table-wrap">${table(['Motion','Plays','Usage','YPP','Median','Expl %','Neg %','R/P'],srTable(motionB,rows.length))}</div>
   </div>

 </div>`;
}


function render(){
 let app=$('app');
 if(page==='players')app.innerHTML=playersPage();
 else if(page==='depthchart')app.innerHTML=depthChartPage();
 else if(page==='dashboard')app.innerHTML=dashboardPage();
 else if(page==='leaders')app.innerHTML=leadersPage();
 else if(page==='missedtackles')app.innerHTML=missedTacklesPage();
 else if(page==='personnel')app.innerHTML=personnelPage();
 else if(page==='run')app.innerHTML=runPage();
 else if(page==='qbrun')app.innerHTML=qbRunPage();
 else if(page==='pass')app.innerHTML=passPage();
 else if(page==='coverage')app.innerHTML=coveragePage();
 else if(page==='pressure')app.innerHTML=pressurePage();
 else if(page==='situations')app.innerHTML=situationsPage();
 else if(page==='heatmaps')app.innerHTML=heatmapsPage();
 else if(page==='formations')app.innerHTML=formationsPage();
 else if(page==='structures')app.innerHTML=structuresPage();
 else if(page==='advantage')app.innerHTML=plannedPage('Advantage Theory','Optional charted sample. This page will activate only when Advantage data is present.');
 const analyticsPages=['dashboard','personnel','run','qbrun','pass','coverage','pressure','situations','heatmaps','formations','structures'];
 if(supportsSeasonSplit()&&analyticsPages.includes(page))app.innerHTML=analyticsModeBar()+app.innerHTML;
 if(isCurrentSeasonOpponent()&&analyticsPages.includes(page)){
   let n=rawChartedPlayRows().length;
   app.innerHTML=`<div class="analytics-season-bar no-print"><div class="analytics-season-copy"><b>Main Analytics Sample</b><span>2026 Raw: ${n} plays · current-season package only</span></div><div class="analytics-weight-note">${esc(activeOpponentName())} currently uses the loaded 2026 sample only. No 2025 or synthetic weighted plays are included.</div></div>`+app.innerHTML;
 }
}
function goPage(p){page=p;syncNav();render();window.scrollTo({top:0,behavior:'smooth'})}
window.setDashHash=setDashHash;window.setPassHash=setPassHash;
window.setQBRun=setQBRun;window.resetQBRun=resetQBRun;
window.setReportPlayerPos=setReportPlayerPos;window.selectVisibleReportPlayers=selectVisibleReportPlayers;
window.setFM=setFM;window.resetFM=resetFM;
window.setHR=setHR;window.resetHR=resetHR;
function syncNav(){document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===page))}
window.setGroup=id=>{group=id;selected=null;facet='overview';render()};window.openPlayer=name=>openFAUProfile(name);window.setFacet=id=>{facet=id;render()};
window.setOpponent=setOpponent;
window.setFreqMode=v=>{freqMode=v;render()};window.setDndFilter=v=>{dndFilter=v;render()};window.setHeatScope=v=>{heatScope=v;if(v!=='coverage')heatCoverage='ALL';render()};window.setHeatMetric=v=>{heatMetric=v;render()};window.setHeatCoverage=v=>{heatCoverage=v;render()};window.setHeatHash=v=>{heatHash=v;render()};window.setHeatQB=v=>{heatQB=v;render()};window.setRunConceptFocus=v=>{runConceptFocus=v;render()};
window.setRunFilter=(kind,v)=>{if(kind==='concept')runConceptFocus=v;else if(kind==='hash')runHashF=v;else if(kind==='rb')runRBSideF=v;else if(kind==='personnel')runPersonnelF=v;else if(kind==='formation')runFormationF=v;render()};
window.resetRunFilters=()=>{runConceptFocus='ALL';runHashF='ALL';runRBSideF='ALL';runPersonnelF='ALL';runFormationF='ALL';dndFilter='ALL';render()};
document.addEventListener('click',e=>{
 let card=e.target.closest?.('.player-card[data-player-index]');
 if(card && !e.target.closest('button,a')) openPlayerIndex(Number(card.dataset.playerIndex));
});
async function loadRoster(){
 let h=$('headerStatus');
 bundledSources.clear();
 h.textContent=`Loading ${activeOpponentName()} roster + Offensive Intelligence data…`;
 roster=[];datasets={};loadState={};depthChartData=null;historicalRoster=[];FILES=activeFiles();

 if(activeOpponent==='UAB'){
   discoveredUABBase='';
   await discoverUABBase();
 }
 if(activeOpponent==='SELA'){
   discoveredSELABase='';
   await discoverSELABase();
 }
 if(activeOpponent==='FAU'){
   discoveredFAUBase='';
   await discoverFAUBase();
 }

 let data=null;
 if(activeOpponent==='MSST'){
   try{let r=await fetch('/api/roster?v='+Date.now(),{cache:'no-store'});if(r.ok)data=await r.json()}catch(e){}
 }
 if(!data){
   try{let r=await fetchOpponentResource(activeRosterUrl()+'?v='+Date.now(),{cache:'no-store'});if(r.ok)data=await r.json()}catch(e){}
 }
 roster=Array.isArray(data)?data:Array.isArray(data?.players)?data.players:[];
 if(activeOpponent==='SELA'&&!roster.length)roster=SELA_CURRENT_ROSTER.slice();
 if(activeOpponent==='FAU'&&!roster.length)roster=FAU_CURRENT_ROSTER.slice();

 if(activeOpponent==='UAB'&&discoveredUABBase){
   try{let r=await fetch(discoveredUABBase+'depth-chart.json?v='+Date.now(),{cache:'no-store'});if(r.ok)depthChartData=await r.json()}catch(e){}
   try{
     let r=await fetch(discoveredUABBase+'historical-roster-2025.json?v='+Date.now(),{cache:'no-store'});
     if(r.ok){let x=await r.json();historicalRoster=Array.isArray(x)?x:(x?.players||[])}
   }catch(e){}
 }
 if(activeOpponent==='SELA'){
   if(discoveredSELABase){
     try{let r=await fetch(discoveredSELABase+'depth-chart.json?v='+Date.now(),{cache:'no-store'});if(r.ok)depthChartData=await r.json()}catch(e){}
     try{let r=await fetch(discoveredSELABase+'historical-roster-2025.json?v='+Date.now(),{cache:'no-store'});if(r.ok){let x=await r.json();historicalRoster=Array.isArray(x)?x:(x?.players||[])}}catch(e){}
   }
   if(!depthChartData)depthChartData=SELA_DEPTH_CHART;
   if(!historicalRoster.length)historicalRoster=SELA_HISTORICAL_ROSTER_2025.slice();
 }
 if(activeOpponent==='FAU'){
   if(discoveredFAUBase){
     try{let r=await fetch(discoveredFAUBase+'depth-chart.json?v='+Date.now(),{cache:'no-store'});if(r.ok)depthChartData=await r.json()}catch(e){}
   }
   if(!depthChartData)depthChartData=FAU_DEPTH_CHART;
 }

 await Promise.all(Object.keys(FILES).map(fetchCSV));
 if(activeOpponent==='SA'){
  let r=await fetchOpponentResource(opp().pffBase+'depth-chart.json');depthChartData=await r.json();
  const saved=JSON.parse(SA_BUNDLE['roster.json']).players;
  roster=saved.map(backup=>{let live=roster.find(p=>cleanName(p.name)===cleanName(backup.name));return {...backup,...live,image:backup.image,officialImageSource:backup.officialImageSource}});
  enrichSouthAlabamaLanguage();
 }

 let coreOk=['plays','playerIntel'].filter(k=>loadState[k]?.ok).length;
 h.textContent=roster.length
   ?`${activeOpponentName()} roster loaded • ${roster.length} players • ${coreOk}/2 core data sources loaded`
   :`${activeOpponentName()} roster ${localFileMode()?'not reachable in local-file preview':'failed'} • ${coreOk}/2 core data sources loaded`;

 if(bundledSources.size)h.textContent+=' • bundled fallback';
 let on=$('oppName');if(on)on.textContent=activeOpponentName();
 let so=$('sideOpponent');if(so)so.textContent=`${activeOpponentName()} Week`;
 let bm=$('oppBtnMSST'),bu=$('oppBtnUAB'),bs=$('oppBtnSELA'),bf=$('oppBtnFAU');
 if(bm)bm.classList.toggle('active',activeOpponent==='MSST');
 if(bu)bu.classList.toggle('active',activeOpponent==='UAB');
 if(bs)bs.classList.toggle('active',activeOpponent==='SELA');
 if(bf)bf.classList.toggle('active',activeOpponent==='FAU');
 $('oppBtnSA')?.classList.toggle('active',activeOpponent==='SA');

 render();
}
async function setOpponent(key){
 if(!OPPONENTS[key]||key===activeOpponent)return;
 activeOpponent=key;
 localStorage.setItem('ulmOffIntelOpponent',activeOpponent);
 group='ALL';selected=null;dndFilter='ALL';
 await loadRoster();
}
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{page=b.dataset.page;syncNav();render()});$('reloadBtn').onclick=loadRoster;$('printBtn').onclick=openPrintCenter;render();loadRoster();

