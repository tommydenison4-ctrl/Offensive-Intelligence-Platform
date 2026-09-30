function pfField(r,names){return firstField(r,names)}

function pffLeadingCount(v){
 let m=String(v??'').trim().match(/^(\d+)/);
 return m?String(parseInt(m[1],10)):'';
}
function pffBool(v){
 let s=String(v??'').trim().toUpperCase();
 return ['1','TRUE','YES','Y'].includes(s);
}
function pffFieldZoneFromGoal(r){
 let raw=firstField(r,['pff_YARDS_TO_GOAL_LINE','YARDS_TO_GOAL_LINE']);
 if(!nonEmpty(raw))return '';
 let ytg=parseFloat(String(raw)); if(!Number.isFinite(ytg))return '';
 if(ytg>=90)return'Backed Up'; if(ytg>=75)return'Coming Out'; if(ytg>=60)return'Own 26-40';
 if(ytg>=41)return'Midfield'; if(ytg>=21)return'+40 to +21'; if(ytg>=11)return'Red Zone'; return'Goal-to-Go';
}

function pfPersonnel(r){return String(pfField(r,['pff_OFFPERSONNELBASIC','pff_OFFPERSONNEL','PERSONNEL','personnel','OFF_PERSONNEL'])||'').trim()}
function pfFront(r){return String(pfField(r,['pff_DEFENSIVE_FRONT_NAME','pff_DEFPERSONNEL','pff_DEFFRONT','DEF_FRONT','FRONT','front'])||'').trim()}
function pfBox(r){let v=pfField(r,['pff_BOXPLAYERS','pff_BOXCOUNT','BOX_COUNT','box_count']);return nonEmpty(v)?(pffLeadingCount(v)||String(v).trim()):''}
function pfDown(r){let d=Math.round(num(pfField(r,['pff_DOWN','DOWN','down'])));return d>=1&&d<=4?String(d):''}
function pfFieldZone(r){
 let tagged=String(pfField(r,['FIELD_ZONE','field_zone','pff_FIELDZONE'])||'').trim();
 if(tagged)return tagged;
 return pffFieldZoneFromGoal(r);
}
function pfRows(){
 let rows=dashboardPlayRows();
 return rows.filter(r=>
   (pfPersonnelF==='ALL'||pfPersonnel(r)===pfPersonnelF) &&
   (pfFrontF==='ALL'||pfFront(r)===pfFrontF) &&
   (pfDownF==='ALL'||pfDown(r)===pfDownF) &&
   (pfFieldF==='ALL'||pfFieldZone(r)===pfFieldF) &&
   (pfBoxF==='ALL'||pfBox(r)===pfBoxF) &&
   (pfHashF==='ALL'||reportHash(r)===pfHashF) &&
   dndMatches(r)
 );
}
function uniqueVals(rows,fn){
 return [...new Set(rows.map(fn).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true}));
}
function pfMetrics(rows){
 let s=dashboardStats(rows);
 return {
   ...s,
   runPct: rows.length ? s.runN/rows.length*100 : 0,
   passPct: rows.length ? s.passN/rows.length*100 : 0
 };
}
function pfBreakdown(rows,fn){
 let m={};
 rows.forEach(r=>{
   let k=fn(r)||'Unknown';
   (m[k] ||= []).push(r);
 });
 return Object.entries(m).map(([k,a])=>{
   let s=pfMetrics(a);
   return {k,n:a.length,ypp:s.ypp,med:s.median,exp:s.expl,neg:s.neg,run:s.runN,pass:s.passN}
 }).sort((a,b)=>b.n-a.n);
}
function pfTableRows(arr,total){
 return arr.map(x=>[
   esc(x.k),
   x.n,
   pctText(x.n,total),
   fmt(x.ypp,2),
   fmt(x.med,1),
   pctText(x.exp,x.n),
   pctText(x.neg,x.n),
   `${x.run}/${x.pass}`
 ]);
}
function pfComboBreakdown(rows){
 let m={};
 rows.forEach(r=>{
   let p=pfPersonnel(r)||'Unknown Personnel', f=pfFront(r)||'Unknown Front';
   let k=p+'||'+f;
   (m[k] ||= []).push(r);
 });
 return Object.entries(m).map(([k,a])=>{
   let [p,f]=k.split('||'),s=pfMetrics(a);
   return {p,f,n:a.length,ypp:s.ypp,med:s.median,exp:s.expl,neg:s.neg}
 }).sort((a,b)=>b.n-a.n).slice(0,12);
}
function setPF(key,val){
 if(key==='personnel')pfPersonnelF=val;
 if(key==='front')pfFrontF=val;
 if(key==='down')pfDownF=val;
 if(key==='field')pfFieldF=val;
 if(key==='box')pfBoxF=val;
 if(key==='hash')pfHashF=val;
 render();
}
function resetPF(){pfPersonnelF=pfFrontF=pfDownF=pfFieldF=pfBoxF=pfHashF='ALL';dndFilter='ALL';render()}

function uabTackleValidation(){
 let a=uabTackleSummaryRows();
 return {
   rows:a.length,
   total:a.reduce((n,x)=>n+x.total,0),
   tackles:a.reduce((n,x)=>n+x.tkl,0),
   assists:a.reduce((n,x)=>n+x.ast,0),
   missed:a.reduce((n,x)=>n+x.mt,0),
   runMissed:a.reduce((n,x)=>n+x.runMt,0),
   passMissed:a.reduce((n,x)=>n+x.passMt,0)
 };
}
function missedTacklesPage(){
 let players=offenseRoster().filter(piHasVerifiedHistoricalIdentity),rows=mtReportRows(players);
 let total=rows.reduce((n,x)=>n+x.mt,0),tackles=rows.reduce((n,x)=>n+x.tkl,0),opp=tackles+total;
 let run=rows.reduce((n,x)=>n+x.run,0),pass=rows.reduce((n,x)=>n+x.pass,0);
 let mtPlayRows=(datasets.plays||[]).filter(r=>nonEmpty(r.pff_MISSEDTACKLE));
 let gains=mtPlayRows.map(r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained']))),expl=gains.filter(x=>x>=15).length;
 let tackleSource='pff-data (49).csv · direct embedded source';
 return `<div class="page-title"><h2>Missed Tackle Report</h2><p>${isCurrentSeasonOpponent()?'2026 tackling sample, with current-player context.':'Full historical tackling sample, with current-player context where available.'}</p></div>
 <div class="kpis">
  <div class="kpi"><span>Missed Tackles</span><b>${total}</b></div>
  <div class="kpi"><span>Tackles</span><b>${tackles}</b></div>
  <div class="kpi"><span>Tackle Opportunities</span><b>${opp}</b></div>
  <div class="kpi"><span>Team MT %</span><b>${opp?`${(100*total/opp).toFixed(1)}%`:'—'}</b></div>
  <div class="kpi"><span>Run MT</span><b>${run}</b></div>
  <div class="kpi"><span>Pass MT</span><b>${pass}</b></div>
  <div class="kpi"><span>Explosive Plays on MT</span><b>${expl}</b></div>
  <div class="kpi"><span>YPP on MT Plays</span><b>${gains.length?fmt(avg(gains),2):'—'}</b></div>
  <div class="kpi"><span>Median</span><b>${gains.length?fmt(calcMedian(gains),1):'—'}</b></div>
 </div>
 ${missedTackleReport(players)}`;
}

function personnelPage(){
 let all=dashboardPlayRows(),rows=pfRows(),s=pfMetrics(rows);
 let personnelVals=uniqueVals(all,pfPersonnel),frontVals=uniqueVals(all,pfFront),downVals=uniqueVals(all,pfDown),fieldVals=uniqueVals(all,pfFieldZone),boxVals=uniqueVals(all,pfBox);
 let personnelB=pfBreakdown(rows,pfPersonnel),frontB=pfBreakdown(rows,pfFront),boxB=pfBreakdown(rows,pfBox),downB=addP10Breakdown(pfBreakdown(rows,pfDown),rows,pfMetrics),fieldB=pfBreakdown(rows,pfFieldZone),combos=pfComboBreakdown(rows);
 let has=all.length>0;
 return `<div class="page-title"><h2>Personnel & Fronts</h2><p>How ${esc(activeOpponentName())} structures its defense against offensive personnel, situations and field location.</p></div>
 ${!has?`<div class="pf-empty"><b>No opponent-defense play feed is loaded yet.</b><br>This page is fully built and will populate when <code>play_feed.csv</code>, <code>plays.csv</code>, or <code>current.csv</code> is added to the Offensive Intelligence opponent folder.</div>`:''}

 <div class="pf-toolbar">
   <label>Offensive Personnel<select onchange="setPF('personnel',this.value)"><option value="ALL">All Personnel</option>${personnelVals.map(v=>`<option ${pfPersonnelF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Defensive Front<select onchange="setPF('front',this.value)"><option value="ALL">All Fronts</option>${frontVals.map(v=>`<option ${pfFrontF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Down<select onchange="setPF('down',this.value)"><option value="ALL">All Downs</option>${downVals.map(v=>`<option value="${esc(v)}" ${pfDownF===v?'selected':''}>${esc(v)}${v?' Down':''}</option>`).join('')}</select></label>
   <label>Field Zone<select onchange="setPF('field',this.value)"><option value="ALL">All Field Zones</option>${fieldVals.map(v=>`<option ${pfFieldF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Box Count<select onchange="setPF('box',this.value)"><option value="ALL">All Box Counts</option>${boxVals.map(v=>`<option ${pfBoxF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Hash<select onchange="setPF('hash',this.value)">${reportHashOptions(pfHashF)}</select></label>
   ${dndSelect()}<div class="pf-reset"><button onclick="resetPF()">Reset Filters</button></div>
 </div>

 <div class="pf-summary">
   <div class="pf-card"><span>Filtered Plays</span><b>${has?rows.length:'—'}</b></div>
   <div class="pf-card"><span>YPP Allowed</span><b>${rows.length?fmt(s.ypp,2):'—'}</b></div>
   <div class="pf-card"><span>Median YPP</span><b>${rows.length?fmt(s.median,1):'—'}</b></div>
   <div class="pf-card"><span>Explosive %</span><b>${rows.length?pctText(s.expl,rows.length):'—'}</b></div>
   <div class="pf-card"><span>Negative %</span><b>${rows.length?pctText(s.neg,rows.length):'—'}</b></div>
   <div class="pf-card"><span>Run / Pass</span><b>${rows.length?`${s.runN} / ${s.passN}`:'—'}</b></div>
 </div>

 <div class="pf-grid">
   <div class="pf-section pf-span-6">
     <h3>Offensive Personnel Faced</h3><div class="pf-sub">Frequency and defensive results by the offense's personnel group.</div>
     <div class="pf-table-wrap">${table(['Personnel','Plays','Usage','YPP','Median','Expl %','Neg %','R/P'],pfTableRows(personnelB,rows.length))}</div>
   </div>

   <div class="pf-section pf-span-6">
     <h3>Defensive Front Usage</h3><div class="pf-sub">What ${esc(activeOpponentName())} is actually lining up in.</div>
     <div class="pf-table-wrap">${table(['Front','Plays','Usage','YPP','Median','Expl %','Neg %','R/P'],pfTableRows(frontB,rows.length))}</div>
   </div>

   <div class="pf-section pf-span-4">
     <h3>Box Count</h3><div class="pf-sub">Defenders in the box when tagged.</div>
     <div class="pf-table-wrap">${table(['Box','Plays','Usage','YPP','Median','Expl %','Neg %','R/P'],pfTableRows(boxB,rows.length))}</div>
   </div>

   <div class="pf-section pf-span-4">
     <h3>By Down</h3><div class="pf-sub">Front/personnel performance by down.</div>
     <div class="pf-table-wrap">${table(['Down','Plays','Usage','YPP','Median','Expl %','Neg %','R/P'],pfTableRows(downB,rows.length))}</div>
   </div>

   <div class="pf-section pf-span-4">
     <h3>By Field Zone</h3><div class="pf-sub">Where the structures are appearing on the field.</div>
     <div class="pf-table-wrap">${table(['Zone','Plays','Usage','YPP','Median','Expl %','Neg %','R/P'],pfTableRows(fieldB,rows.length))}</div>
   </div>

   <div class="pf-section pf-span-12">
     <h3>Personnel × Front Combinations</h3><div class="pf-sub">The most common structural combinations in the filtered sample.</div>
     ${combos.length?`<div class="pf-combo head"><div>Personnel</div><div>Front</div><div>Plays</div><div>YPP</div><div>Expl%</div></div>${combos.map(x=>`<div class="pf-combo"><div class="name">${esc(x.p)}</div><div><span class="pf-tag">${esc(x.f)}</span></div><div>${x.n}</div><div>${fmt(x.ypp,2)}</div><div>${pctText(x.exp,x.n)}</div></div>`).join('')}`:'<div class="empty">No personnel/front combinations available.</div>'}
   </div>

   <div class="pf-section pf-span-12">
     <h3>Staff View</h3><div class="pf-sub">Fast structural read for game-plan work.</div>
     <div class="pf-mini-grid">
       <div class="pf-mini"><span>Most Common Personnel</span><b>${personnelB[0]?esc(personnelB[0].k):'—'}</b></div>
       <div class="pf-mini"><span>Most Common Front</span><b>${frontB[0]?esc(frontB[0].k):'—'}</b></div>
       <div class="pf-mini"><span>Most Common Box</span><b>${boxB[0]?esc(boxB[0].k):'—'}</b></div>
       <div class="pf-mini"><span>Sample</span><b>${rows.length||'—'}</b></div>
     </div>
     <div class="sample-note">This page describes what is in the charted sample. It does not infer or rename untagged fronts.</div>
   </div>
 </div>`;
}


function rdRunRowsBase(){
 return dashboardPlayRows().filter(r=>{
   let rp=String(firstField(r,['pff_RUNPASS','RUNPASS','run_pass','play_type'])||'').toUpperCase();
   return rp==='R'||rp==='RUN';
 });
}
function rdDirection(r){return String(firstField(r,['pff_POAACTUAL','pff_POAINTENDED','pff_RBDIRECTION','RUN_DIRECTION'])||'').trim()}
function rdGap(r){return String(firstField(r,['pff_RUNCONCEPTPRIMARY','pff_RUNCONCEPTSECONDARY','RUN_CONCEPT'])||'').trim()}
function rdDistanceBucket(r){
 let d=num(firstField(r,['pff_DISTANCE','DISTANCE','distance']));
 if(!d)return '';
 if(d<=2)return'1-2';
 if(d===3)return'3';
 if(d<=6)return'4-6';
 if(d<=9)return'7-9';
 if(d<=12)return'10-12';
 return'13+';
}
function rdRows(){
 return rdRunRowsBase().filter(r=>
   (rdFrontF==='ALL'||pfFront(r)===rdFrontF) &&
   (rdBoxF==='ALL'||pfBox(r)===rdBoxF) &&
   (rdPersonnelF==='ALL'||pfPersonnel(r)===rdPersonnelF) &&
   (rdDownF==='ALL'||pfDown(r)===rdDownF) &&
   (rdDistF==='ALL'||rdDistanceBucket(r)===rdDistF) &&
   (rdFieldF==='ALL'||pfFieldZone(r)===rdFieldF) &&
   (rdHashF==='ALL'||reportHash(r)===rdHashF) &&
   (rdDirF==='ALL'||rdDirection(r)===rdDirF) &&
   (rdGapF==='ALL'||rdGap(r)===rdGapF) &&
   dndMatches(r)
 );
}
function rdMetrics(rows){
 let gains=rows.map(r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained'])));
 let n=gains.length, exp=gains.filter(x=>x>=15).length, neg=gains.filter(x=>x<=0).length,stuffs=neg;
 let first=rows.filter(r=>{let gain=num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained']));let dist=num(firstField(r,['pff_DISTANCE','DISTANCE','distance']));return dist>0&&gain>=dist}).length;
 let td=rows.filter(r=>nonEmpty(firstField(r,['pff_TOUCHDOWN','TOUCHDOWN','TD']))).length;
 const gain=r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained']));
 return {n,ypp:n?balancedAvgRows(rows,gain):0,med:n?balancedMedianRows(rows,gain):0,exp,neg,stuffs,first,td};
}
function rdBreakdown(rows,fn){
 let m={};
 rows.forEach(r=>{let k=fn(r)||'Unknown';(m[k] ||= []).push(r)});
 return Object.entries(m).map(([k,a])=>({k,...rdMetrics(a)})).sort((a,b)=>b.n-a.n);
}
function rdTable(arr,total){
 return arr.map(x=>[
   esc(x.k),x.n,pctText(x.n,total),fmt(x.ypp,2),fmt(x.med,1),
   pctText(x.exp,x.n),pctText(x.neg,x.n),x.td
 ]);
}
function rdComboRows(rows){
 let m={};
 rows.forEach(r=>{
   let front=pfFront(r)||'Unknown Front', box=pfBox(r)||'Unknown Box', gap=rdGap(r)||rdDirection(r)||'Unknown';
   let k=front+'||'+box+'||'+gap;(m[k] ||= []).push(r);
 });
 return Object.entries(m).map(([k,a])=>{
   let [front,box,gap]=k.split('||');return {front,box,gap,...rdMetrics(a)}
 }).sort((a,b)=>b.n-a.n).slice(0,14);
}
function setRD(key,val){
 if(key==='front')rdFrontF=val;
 if(key==='box')rdBoxF=val;
 if(key==='personnel')rdPersonnelF=val;
 if(key==='down')rdDownF=val;
 if(key==='dist')rdDistF=val;
 if(key==='field')rdFieldF=val;
 if(key==='hash')rdHashF=val;
 if(key==='dir')rdDirF=val;
 if(key==='gap')rdGapF=val;
 render();
}
function resetRD(){rdFrontF=rdBoxF=rdPersonnelF=rdDownF=rdDistF=rdFieldF=rdDirF=rdGapF=rdHashF='ALL';dndFilter='ALL';render()}

function rdPoaLane(r){
 let v=String(rdDirection(r)||'').trim().toUpperCase();
 return ['LE','LT','LG','ML','MR','RG','RT','RE'].includes(v)?v:'';
}
function rdGapNameFromPoa(poa){
 return {
   'LE':'D-L','LT':'C-L','LG':'B-L','ML':'A-L',
   'MR':'A-R','RG':'B-R','RT':'C-R','RE':'D-R'
 }[poa]||'';
}
function rdFootballGapBreakdown(rows){
 let order=['LE','LT','LG','ML','MR','RG','RT','RE'];
 let map={};order.forEach(k=>map[k]=[]);
 rows.forEach(r=>{let k=rdPoaLane(r);if(k)map[k].push(r)});
 return order.map(k=>({poa:k,gap:rdGapNameFromPoa(k),...rdMetrics(map[k])}));
}

function runPage(){
 let all=rdRunRowsBase(),rows=rdRows(),s=rdMetrics(rows);
 let fronts=uniqueVals(all,pfFront),boxes=uniqueVals(all,pfBox),pers=uniqueVals(all,pfPersonnel),downs=uniqueVals(all,pfDown),
     dists=uniqueVals(all,rdDistanceBucket),fields=uniqueVals(all,pfFieldZone),dirs=uniqueVals(all,rdDirection),gaps=uniqueVals(all,rdGap);
 let gapB=rdBreakdown(rows,rdGap),dirB=rdBreakdown(rows,rdDirection),frontB=rdBreakdown(rows,pfFront),boxB=rdBreakdown(rows,pfBox),
     personnelB=rdBreakdown(rows,pfPersonnel),downB=addP10Breakdown(rdBreakdown(rows,pfDown),rows,rdMetrics),fieldB=rdBreakdown(rows,pfFieldZone),combos=rdComboRows(rows);
 let gapView=rdFootballGapBreakdown(rows);let maxGapView=Math.max(...gapView.map(x=>x.n),1);let gapMapped=gapView.reduce((n,x)=>n+x.n,0);
 return `<div class="page-title"><h2>Run Defense</h2><p>How ${activeOpponentName()} is defending the run by front, box count, run concept, point of attack, personnel and situation.</p></div>
 ${!all.length?`<div class="pf-empty"><b>No charted run plays are loaded yet.</b><br>The Run Defense explorer is built and will populate from the opponent-defense play feed.</div>`:''}

 <div class="rd-toolbar">
   <label>Defensive Front<select onchange="setRD('front',this.value)"><option value="ALL">All Fronts</option>${fronts.map(v=>`<option ${rdFrontF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Box Count<select onchange="setRD('box',this.value)"><option value="ALL">All Box Counts</option>${boxes.map(v=>`<option ${rdBoxF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Offensive Personnel<select onchange="setRD('personnel',this.value)"><option value="ALL">All Personnel</option>${pers.map(v=>`<option ${rdPersonnelF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Down<select onchange="setRD('down',this.value)"><option value="ALL">All Downs</option>${downs.map(v=>`<option value="${esc(v)}" ${rdDownF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Distance<select onchange="setRD('dist',this.value)"><option value="ALL">All Distances</option>${dists.map(v=>`<option ${rdDistF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Field Zone<select onchange="setRD('field',this.value)"><option value="ALL">All Field Zones</option>${fields.map(v=>`<option ${rdFieldF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Hash<select onchange="setRD('hash',this.value)">${reportHashOptions(rdHashF)}</select></label>
   <label>Point of Attack<select onchange="setRD('dir',this.value)"><option value="ALL">All Directions</option>${dirs.map(v=>`<option ${rdDirF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Run Concept<select onchange="setRD('gap',this.value)"><option value="ALL">All Concepts</option>${gaps.map(v=>`<option ${rdGapF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   ${dndSelect()}<div class="rd-reset"><button onclick="resetRD()">Reset Filters</button></div>
 </div>

 <div class="rd-kpis">
   <div class="rd-kpi"><span>Run Plays</span><b>${rows.length||'—'}</b></div>
   <div class="rd-kpi"><span>YPP Allowed</span><b>${rows.length?fmt(s.ypp,2):'—'}</b></div>
   <div class="rd-kpi"><span>Median YPP</span><b>${rows.length?fmt(s.med,1):'—'}</b></div>
   <div class="rd-kpi"><span>Explosive %</span><b>${rows.length?pctText(s.exp,s.n):'—'}</b></div>
   <div class="rd-kpi"><span>Negative %</span><b>${rows.length?pctText(s.neg,s.n):'—'}</b></div>
   <div class="rd-kpi"><span>1st Down %</span><b>${rows.length?pctText(s.first,s.n):'—'}</b></div>
   <div class="rd-kpi"><span>Rush TD</span><b>${rows.length?s.td:'—'}</b></div>
   <div class="rd-kpi"><span>Sample</span><b>${all.length||'—'}</b></div>
 </div>

 <div class="rd-grid">
   <div class="rd-section rd-span-12">
     <h3>Run Gap Map</h3>
     <div class="rd-sub">Football gap language from the offense's perspective. PFF's POAACTUAL lanes are translated into A/B/C/D gaps so the picture matches how the offense talks.</div>
     <div class="gap-board">
       <div class="gap-divider"></div>
       <div class="gap-los-label"><span>LINE OF SCRIMMAGE</span></div>
       <div class="gap-lanes">
         ${gapView.map(x=>`<div class="gap-cell ${x.n===maxGapView&&x.n?'hot':''}">
           <div class="gap-title">${x.gap}</div>
           <div class="gap-source">PFF ${x.poa}</div>
           <div class="gap-n">${x.n}</div>
           <div class="gap-share">${gapMapped?pctText(x.n,gapMapped):'—'} of mapped runs</div>
           <div class="gap-ypp">${x.n?fmt(x.ypp,2):'—'} YPP</div>
           <div class="gap-detail">${x.n?`MED ${fmt(x.med,1)} · EXP ${pctText(x.exp,x.n)}<br>NEG ${pctText(x.neg,x.n)}`:'No sample'}</div>
         </div>`).join('')}
       </div>
       <div class="gap-center"><div class="gap-ol">LT</div><div class="gap-ol">LG</div><div class="gap-ol">C</div><div class="gap-ol">RG</div><div class="gap-ol">RT</div></div>
       <div class="gap-axis"><span>OFFENSE LEFT</span><span>A GAPS MEET AT CENTER</span><span>OFFENSE RIGHT</span></div>
     </div>
     <div class="sample-note">Translation used: ML/MR → A gaps, LG/RG → B gaps, LT/RT → C gaps, LE/RE → D gaps. Specialty POA tags such as QB scramble, sneak, jet sweep, reverse and kneel are not forced into a gap.</div>
   </div>

   <div class="rd-section rd-span-6">
     <h3>By Run Concept</h3><div class="rd-sub">Concept-level run-defense performance.</div>
     <div class="rd-table-wrap">${table(['Concept','Plays','Usage','YPP','Median','Expl %','Neg %','TD'],rdTable(gapB,rows.length))}</div>
   </div>

   <div class="rd-section rd-span-6">
     <h3>By PFF Point of Attack</h3><div class="rd-sub">Raw PFF POAACTUAL labels. The gap map above translates the eight core OL/edge lanes into A/B/C/D terminology.</div>
     <div class="rd-table-wrap">${table(['POA','Plays','Usage','YPP','Median','Expl %','Neg %','TD'],rdTable(dirB,rows.length))}</div>
   </div>

   <div class="rd-section rd-span-4">
     <h3>By Front</h3><div class="rd-sub">Run results against each front.</div>
     <div class="rd-table-wrap">${table(['Front','Plays','Usage','YPP','Median','Expl %','Neg %','TD'],rdTable(frontB,rows.length))}</div>
   </div>

   <div class="rd-section rd-span-4">
     <h3>By Box Count</h3><div class="rd-sub">Run results by defenders in the box.</div>
     <div class="rd-table-wrap">${table(['Box','Plays','Usage','YPP','Median','Expl %','Neg %','TD'],rdTable(boxB,rows.length))}</div>
   </div>

   <div class="rd-section rd-span-4">
     <h3>By Personnel Faced</h3><div class="rd-sub">How the defense performs versus offensive personnel.</div>
     <div class="rd-table-wrap">${table(['Personnel','Plays','Usage','YPP','Median','Expl %','Neg %','TD'],rdTable(personnelB,rows.length))}</div>
   </div>

   <div class="rd-section rd-span-6">
     <h3>By Down</h3><div class="rd-sub">Run-defense profile by down.</div>
     <div class="rd-table-wrap">${table(['Down','Plays','Usage','YPP','Median','Expl %','Neg %','TD'],rdTable(downB,rows.length))}</div>
   </div>

   <div class="rd-section rd-span-6">
     <h3>By Field Zone</h3><div class="rd-sub">Where run-defense efficiency changes on the field.</div>
     <div class="rd-table-wrap">${table(['Field Zone','Plays','Usage','YPP','Median','Expl %','Neg %','TD'],rdTable(fieldB,rows.length))}</div>
   </div>

   <div class="rd-section rd-span-12">
     <h3>Front × Box × Gap</h3><div class="rd-sub">Most common run-defense combinations in the filtered sample.</div>
     ${combos.length?`<div class="rd-combo head"><div>Front</div><div>Box</div><div>Gap / Direction</div><div>Plays</div><div>YPP</div><div>Expl%</div><div>Neg%</div></div>${combos.map(x=>`<div class="rd-combo"><div><b>${esc(x.front)}</b></div><div>${esc(x.box)}</div><div>${esc(x.gap)}</div><div>${x.n}</div><div>${fmt(x.ypp,2)}</div><div>${pctText(x.exp,x.n)}</div><div>${pctText(x.neg,x.n)}</div></div>`).join('')}`:'<div class="empty">No combination data available.</div>'}
     <div class="sample-note">This is descriptive scouting data only. Untagged gaps, fronts and box counts stay unclassified.</div>
   </div>
 </div>`;
}


function routeName(r){return String(firstField(r,['pff_ROUTE_THROWN'])||'').trim()}
function routeGroup(r){return String(firstField(r,['pff_PASSROUTETARGETGROUP'])||'').trim()}
function routeTargetPos(r){return String(firstField(r,['pff_PASSRECEIVERPOSITIONTARGET'])||'').trim()}
function routeMetrics(rows){
 let gains=rows.map(r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained'])));
 let att=0,comp=0,td=0,ints=0,pbu=0;
 rows.forEach(r=>{
   let res=String(firstField(r,['pff_PASSRESULT'])||'').toUpperCase();
   if(['COMPLETE','INCOMPLETE','INTERCEPTION','THROWN AWAY','HIT AS THREW','BATTED PASS'].includes(res))att++;
   if(res==='COMPLETE')comp++;
   if(res==='INTERCEPTION'||nonEmpty(firstField(r,['pff_INTERCEPTION'])))ints++;
   if(nonEmpty(firstField(r,['pff_TOUCHDOWN'])))td++;
   if(nonEmpty(firstField(r,['pff_PASSBREAKUP'])))pbu++;
 });
 let n=rows.length,exp=gains.filter(x=>x>=15).length,neg=gains.filter(x=>x<=0).length;
 const gain=r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained']));
 return {n,ypp:n?balancedAvgRows(rows,gain):0,med:n?balancedMedianRows(rows,gain):0,att,comp,td,ints,pbu,exp,neg};
}
function routeBreakdown(rows,fn){
 let m={};rows.forEach(r=>{let k=fn(r);if(k)(m[k] ||= []).push(r)});
 return Object.entries(m).map(([k,a])=>({k,...routeMetrics(a)})).sort((a,b)=>b.n-a.n);
}
function routeTable(arr,total){
 return arr.map(x=>[esc(x.k),x.n,pctText(x.n,total),fmt(x.ypp,2),fmt(x.med,1),x.att?pctText(x.comp,x.att):'—',pctText(x.exp,x.n),pctText(x.neg,x.n),x.td,x.ints,x.pbu]);
}


function qbRunType(r){
 let scr=String(firstField(r,['pff_QBSCRAMBLE'])||'').trim();
 if(scr)return 'Scramble';
 let rp=String(firstField(r,['pff_RUNPASS'])||'').trim().toUpperCase();
 let bc=String(firstField(r,['pff_BALLCARRIER'])||'').trim().toUpperCase();
 let qb=String(firstField(r,['pff_QB'])||'').trim().toUpperCase();
 if(rp==='R' && bc && qb && bc===qb)return 'Designed Run';
 return '';
}
function qbRunRowsBase(){return dashboardPlayRows().filter(r=>qbRunType(r))}
function qbRunRows(){return qbRunRowsBase().filter(r=>(qbRunHashF==='ALL'||cvHash(r)===qbRunHashF)&&(qbRunTypeF==='ALL'||qbRunType(r)===qbRunTypeF)&&dndMatches(r))}
function qbRunMetrics(rows){
 let gains=rows.map(r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained']))),n=rows.length;
 let exp=gains.filter(x=>x>=15).length,neg=gains.filter(x=>x<=0).length,td=rows.filter(r=>nonEmpty(firstField(r,['pff_TOUCHDOWN']))).length,fd=rows.filter(r=>pffBool(firstField(r,['pff_FIRST_DOWN_GAINED']))).length;
 const gain=r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained']));
 return {n,yards:gains.reduce((a,b)=>a+b,0),ypp:n?balancedAvgRows(rows,gain):0,med:n?balancedMedianRows(rows,gain):0,exp,neg,td,fd};
}
function qbRunBreakdown(rows,fn){let m={};rows.forEach(r=>{let k=fn(r)||'Unknown';(m[k] ||= []).push(r)});return Object.entries(m).map(([k,a])=>({k,...qbRunMetrics(a)})).sort((a,b)=>b.n-a.n)}
function qbRunTable(arr,total){return arr.map(x=>[esc(x.k),x.n,pctText(x.n,total),x.yards,fmt(x.ypp,2),fmt(x.med,1),pctText(x.exp,x.n),pctText(x.neg,x.n),pctText(x.fd,x.n),x.td])}
function setQBRun(k,v){if(k==='hash')qbRunHashF=v;if(k==='type')qbRunTypeF=v;render()}
function resetQBRun(){qbRunHashF=qbRunTypeF='ALL';dndFilter='ALL';render()}
function qbRunSplitCard(type,rows){let a=rows.filter(r=>qbRunType(r)===type),m=qbRunMetrics(a);return `<div class="qbr-split-card"><h4>${type}</h4><div class="big">${m.n} runs</div><div class="qbr-mini"><div><span>YPP</span><b>${m.n?fmt(m.ypp,2):'—'}</b></div><div><span>Median</span><b>${m.n?fmt(m.med,1):'—'}</b></div><div><span>Yards</span><b>${m.yards}</b></div><div><span>Expl %</span><b>${m.n?pctText(m.exp,m.n):'—'}</b></div><div><span>Neg %</span><b>${m.n?pctText(m.neg,m.n):'—'}</b></div><div><span>1D %</span><b>${m.n?pctText(m.fd,m.n):'—'}</b></div></div></div>`}
function qbRunPage(){
 let rows=qbRunRows(),m=qbRunMetrics(rows),designedRows=rows.filter(r=>qbRunType(r)==='Designed Run'),byDown=addP10Breakdown(qbRunBreakdown(rows,pfDown),rows,qbRunMetrics),byDist=addP10Breakdown(qbRunBreakdown(rows,rdDistanceBucket),rows,qbRunMetrics),byField=qbRunBreakdown(rows,pfFieldZone),byHash=qbRunBreakdown(rows,cvHash),byConcept=qbRunBreakdown(designedRows,r=>String(firstField(r,['pff_RUNCONCEPTPRIMARY'])||'').trim());
 return `<div class="page-title"><h2>QB Run Success</h2><p>Designed quarterback runs and scrambles against ${activeOpponentName()}.</p></div>
 <div class="qbr-toolbar"><label>Run Type<select onchange="setQBRun('type',this.value)"><option value="ALL" ${qbRunTypeF==='ALL'?'selected':''}>Designed + Scramble</option><option value="Designed Run" ${qbRunTypeF==='Designed Run'?'selected':''}>Designed Run</option><option value="Scramble" ${qbRunTypeF==='Scramble'?'selected':''}>Scramble</option></select></label><label>Hash<select onchange="setQBRun('hash',this.value)">${reportHashOptions(qbRunHashF)}</select></label>${dndSelect()}<button onclick="resetQBRun()">Reset Filters</button></div>
 <div class="qbr-kpis"><div class="qbr-kpi"><span>QB Runs</span><b>${m.n}</b></div><div class="qbr-kpi"><span>Yards</span><b>${m.yards}</b></div><div class="qbr-kpi"><span>YPP</span><b>${m.n?fmt(m.ypp,2):'—'}</b></div><div class="qbr-kpi"><span>Median</span><b>${m.n?fmt(m.med,1):'—'}</b></div><div class="qbr-kpi"><span>Explosive %</span><b>${m.n?pctText(m.exp,m.n):'—'}</b></div><div class="qbr-kpi"><span>Negative %</span><b>${m.n?pctText(m.neg,m.n):'—'}</b></div><div class="qbr-kpi"><span>1D %</span><b>${m.n?pctText(m.fd,m.n):'—'}</b></div><div class="qbr-kpi"><span>TD</span><b>${m.td}</b></div></div>
 <div class="qbr-card full"><h3>Designed Run vs Scramble</h3><div class="qbr-split">${qbRunSplitCard('Designed Run',rows)}${qbRunSplitCard('Scramble',rows)}</div></div>
 <div class="qbr-grid"><div class="qbr-card"><h3>By Down</h3><div class="table-wrap">${table(['Down','Runs','Usage','Yards','YPP','Median','Expl %','Neg %','1D %','TD'],qbRunTable(byDown,rows.length))}</div></div><div class="qbr-card"><h3>By Distance</h3><div class="table-wrap">${table(['Distance','Runs','Usage','Yards','YPP','Median','Expl %','Neg %','1D %','TD'],qbRunTable(byDist,rows.length))}</div></div><div class="qbr-card"><h3>By Field Zone</h3><div class="table-wrap">${table(['Field Zone','Runs','Usage','Yards','YPP','Median','Expl %','Neg %','1D %','TD'],qbRunTable(byField,rows.length))}</div></div><div class="qbr-card"><h3>By Hash</h3><div class="table-wrap">${table(['Hash','Runs','Usage','Yards','YPP','Median','Expl %','Neg %','1D %','TD'],qbRunTable(byHash,rows.length))}</div></div><div class="qbr-card full"><h3>Designed Run Concept</h3><div class="table-wrap">${table(['Concept','Runs','Usage','Yards','YPP','Median','Expl %','Neg %','1D %','TD'],qbRunTable(byConcept,rows.length))}</div></div></div>
 <div class="sample-note" style="margin-top:10px">Scrambles use explicit pff_QBSCRAMBLE tags. Designed QB runs are run plays where pff_BALLCARRIER exactly matches pff_QB. The Designed Run Concept table contains designed runs only.</div>`;
}

function passPage(){
 let all=cvPassRowsBase(),rows=all.filter(r=>(passHashF==='ALL'||reportHash(r)===passHashF)&&dndMatches(r)),s=cvMetrics(rows);
 let depth=cvBreakdown(rows,cvTargetDepth),side=cvBreakdown(rows,cvTargetSide),shell=cvBreakdown(rows,cvShell),cov=cvBreakdown(rows,cvFamily),routeRows=rows.filter(r=>routeName(r)),routeB=routeBreakdown(routeRows,routeName);
 let depths=rows.map(r=>firstField(r,['pff_PASSDEPTH'])).filter(nonEmpty).map(num),adot=depths.length?avg(depths):0;
 let screens=rows.filter(r=>pffBool(firstField(r,['pff_SCREEN']))).length,pa=rows.filter(r=>pffBool(firstField(r,['pff_PLAYACTION']))).length;
 let deep=rows.filter(r=>nonEmpty(firstField(r,['pff_PASSDEPTH']))&&num(firstField(r,['pff_PASSDEPTH']))>=20).length;
 let scr=rows.filter(r=>nonEmpty(firstField(r,['pff_QBSCRAMBLE']))).length;
 let t=(arr)=>arr.map(x=>[esc(x.k),x.n,pctText(x.n,rows.length),fmt(x.ypp,2),fmt(x.med,1),x.att?pctText(x.comp,x.att):'—',pctText(x.exp,x.n),x.td,x.ints]);
 return `<div class="page-title"><h2>Pass Defense</h2><p>Overall passing profile before drilling into Coverage, Pressure and Field Heat Maps.</p></div>
 <div class="report-hash-filter"><label>Hash<select onchange="setPassHash(this.value)">${reportHashOptions(passHashF)}</select></label>${dndSelect()}</div>
 <div class="cv-kpis">
  <div class="cv-kpi"><span>Pass Plays</span><b>${rows.length}</b></div><div class="cv-kpi"><span>YPP</span><b>${fmt(s.ypp,2)}</b></div>
  <div class="cv-kpi"><span>Median YPP</span><b>${fmt(s.med,1)}</b></div><div class="cv-kpi"><span>Completion %</span><b>${s.att?pctText(s.comp,s.att):'—'}</b></div>
  <div class="cv-kpi"><span>aDOT</span><b>${adot?fmt(adot,1):'—'}</b></div><div class="cv-kpi"><span>20+ Air Yards</span><b>${pctText(deep,rows.length)}</b></div>
  <div class="cv-kpi"><span>Sacks</span><b>${s.sacks}</b></div><div class="cv-kpi"><span>TD / INT</span><b>${s.td} / ${s.ints}</b></div>
  <div class="cv-kpi"><span>Explosive %</span><b>${pctText(s.exp,s.n)}</b></div>
 </div>
 <div class="cv-grid">
  <div class="cv-section cv-span-6"><h3>Target Depth</h3><div class="cv-table-wrap">${table(['Depth','Plays','Usage','YPP','Median','Comp %','Expl %','TD','INT'],t(depth))}</div></div>
  <div class="cv-section cv-span-6"><h3>Target Direction</h3><div class="cv-table-wrap">${table(['Side','Plays','Usage','YPP','Median','Comp %','Expl %','TD','INT'],t(side))}</div></div>
  <div class="cv-section cv-span-6"><h3>By Shell</h3><div class="cv-table-wrap">${table(['Shell','Plays','Usage','YPP','Median','Comp %','Expl %','TD','INT'],t(shell))}</div></div>
  <div class="cv-section cv-span-6"><h3>By Coverage</h3><div class="cv-table-wrap">${table(['Coverage','Plays','Usage','YPP','Median','Comp %','Expl %','TD','INT'],t(cov))}</div></div>
  <div class="cv-section cv-span-12"><div class="sr-response-grid">
   <div class="sr-response"><span>Screen Rate</span><b>${pctText(screens,rows.length)}</b><small>${screens} plays</small></div>
   <div class="sr-response"><span>Play Action Rate</span><b>${pctText(pa,rows.length)}</b><small>${pa} plays</small></div>
   <div class="sr-response"><span>Scrambles</span><b>${scr}</b><small>charted QB scrambles</small></div>
   <div class="sr-response"><span>Pressure Rate</span><b>${pctText(rows.filter(r=>nonEmpty(firstField(r,['pff_QBPRESSURE']))).length,rows.length)}</b><small>actual pressure outcome</small></div>
  </div></div>
  <div class="cv-section cv-span-12 route-report">
    <h3>Route Defense</h3><div class="cv-sub">What routes were targeted and how ${esc(activeOpponentName())} defended them. Route names come directly from PFF ROUTE_THROWN.</div>
    <div class="route-grid">
      <div class="route-card route-only"><h3>By Route</h3><div class="sub">Named targeted routes in the current hash filter.</div><div class="table-wrap">${table(['Route','Targets','Target %','YPT','Median','Comp %','Expl %','Neg %','TD','INT','PBU'],routeTable(routeB,routeRows.length))}</div></div>
    </div>
  </div>
 </div>`;
}

function cvPassRowsBase(){
 return dashboardPlayRows().filter(r=>{
   let rp=String(firstField(r,['pff_RUNPASS','RUNPASS','run_pass','play_type'])||'').toUpperCase();
   return rp==='P'||rp==='PASS';
 });
}
function cvFamily(r){return String(firstField(r,['pff_PASS_COVERAGE_BASIC','pff_PASSCOVERAGE','COVERAGE','coverage'])||'').trim()}
function cvShell(r){
 let shown=String(firstField(r,['pff_MOFOCSHOWN','pff_MOFOCPLAYED'])||'').trim().toUpperCase();
 if(shown==='O')return'2 High';
 if(shown==='C')return'1 High';
 let fam=cvFamily(r).toUpperCase();
 if(/COVER\s*0|ZERO/.test(fam))return'0 High';
 if(/COVER\s*1|COVER\s*3/.test(fam))return'1 High';
 if(/COVER\s*2|COVER\s*4|COVER\s*6|QUARTERS/.test(fam))return'2 High';
 return '';
}
