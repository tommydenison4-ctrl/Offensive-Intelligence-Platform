function blitzIntelHTML(filteredBaseRows){
 let rows=blitzFilteredRows(filteredBaseRows),players=blitzPlayerRows(rows),combos=blitzComboRows(rows),posCombos=blitzPositionCombos(rows),slotRows=blitzSlotSummaries(rows);
 let pressurePlays=rows.filter(r=>nonEmpty(firstField(r,['pff_QBPRESSURE']))).length;
 let sackPlays=rows.filter(r=>nonEmpty(firstField(r,['pff_SACK']))).length;
 let activeSlots=slotRows.filter(x=>x.calls>0);
 return `<div class="blitz-intel">
   <div class="pr-section pr-span-12">
     <h3>Blitz Intelligence</h3>
     <div class="pr-sub">Built from filtered PFF BLITZDOG plays with PASSRUSHPLAYERS. The field is fixed at 11 defenders in a 3-3-5 shell; PFF left/right roles are normalized to field / boundary before they are rolled into FC, Nickel, Sam, Mike, Will and the three-man front.</div>
     <div class="blitz-headline">
       <div class="blitz-head-kpi"><span>Filtered Blitz Calls</span><b>${rows.length}</b></div>
       <div class="blitz-head-kpi"><span>Pressure Plays</span><b>${pressurePlays}</b></div>
       <div class="blitz-head-kpi"><span>Pressure Rate</span><b>${pctText(pressurePlays,rows.length)}</b></div>
       <div class="blitz-head-kpi"><span>Sack Plays</span><b>${sackPlays}</b></div>
     </div>
     ${rows.length?blitzFieldHTML(slotRows,rows.length):`<div class="empty">No blitz sample exists for the current pressure filters.</div>`}
   </div>
   <div class="blitz-tables">
     <div class="blitz-table">
       <h3>Blitz Origins by Coaching Position</h3><div class="sub">Raw calls and results after PFF alignment roles are normalized into the 11 coaching positions shown above.</div>
       <div class="blitz-table-wrap">${table(['Spot','Top Blitzer','Calls','Call Share','Pressure %','Sacks','YPP','Median','Comp %','Expl %','Neg %'],
         activeSlots.length?activeSlots.map(x=>[
           esc(BLITZ_SLOT_META[x.slot]?.title||x.slot),
           x.topPlayer?`${esc(x.topPlayer.name)} (#${x.topPlayer.num})`:'—',
           x.calls,
           pctText(x.calls,rows.length),
           pctText(x.pressure,x.calls),
           x.sacks,
           fmt(x.ypp,2),
           fmt(x.med,1),
           x.att?pctText(x.comp,x.att):'—',
           pctText(x.exp,x.calls),
           pctText(x.neg,x.calls)
         ]):[['No blitz origins found','—','—','—','—','—','—','—','—','—','—']]
       )}</div>
     </div>
     <div class="blitz-table">
       <h3>Second-Level / DB Blitzers</h3><div class="sub">Which individual non-front defenders are showing up as rushers.</div>
       <div class="blitz-table-wrap">${table(['Player','Primary Role','Blitz Rushes','Share','Player Pressures','Player Sacks','Team YPP','Comp %','Expl %','Neg %'],
         players.length?players.map(x=>[
           esc(x.name)+' (#'+x.num+')',esc(x.role),x.n,pctText(x.n,players.reduce((n,p)=>n+p.n,0)),x.playerPress,x.playerSacks,fmt(x.ypp,2),x.att?pctText(x.comp,x.att):'—',pctText(x.exp,x.n),pctText(x.neg,x.n)
         ]):[['No non-front blitzers found','—','—','—','—','—','—','—','—','—']]
       )}</div>
     </div>
     <div class="blitz-table">
       <h3>Position Combinations</h3><div class="sub">Position groups entering the rush together on the same call.</div>
       <div class="blitz-table-wrap">${table(['Combination','Calls','Call Share','Pressure %','Sacks','YPP','Median','Comp %','Expl %','Neg %'],
         posCombos.length?posCombos.map(x=>[esc(x.k),x.n,pctText(x.n,rows.length),pctText(x.press,x.n),x.sacks,fmt(x.ypp,2),fmt(x.med,1),x.att?pctText(x.comp,x.att):'—',pctText(x.exp,x.n),pctText(x.neg,x.n)]):[['No combo data available','—','—','—','—','—','—','—','—','—']]
       )}</div>
     </div>
     <div class="blitz-table">
       <h3>Exact Player Combinations</h3><div class="sub">Specific defenders who rushed together on the same blitz.</div>
       <div class="blitz-table-wrap">${table(['Blitzers','Calls','Call Share','Pressure %','Sacks','YPP','Median','Comp %','Expl %','Neg %'],
         combos.length?combos.map(x=>[esc(x.k),x.n,pctText(x.n,rows.length),pctText(x.press,x.n),x.sacks,fmt(x.ypp,2),fmt(x.med,1),x.att?pctText(x.comp,x.att):'—',pctText(x.exp,x.n),pctText(x.neg,x.n)]):[['No exact player combo data available','—','—','—','—','—','—','—','—','—']]
       )}</div>
     </div>
     <div class="blitz-table" style="grid-column:1/-1">
       <div class="sample-note">“Actual blitzers” here means the added second-level or coverage defenders explicitly listed in PASSRUSHPLAYERS on a BLITZDOG play. The front stays on the field for context, but the highlighted callouts are showing the extra rush origins.</div>
     </div>
   </div>
 </div>`;
}

function pressurePage(){
 let all=prPassRowsBase(),rows=prRows(),s=prMetrics(rows);
 let types=uniqueVals(all,prType),rushes=uniqueVals(all,prRushCount),downs=uniqueVals(all,pfDown),dists=uniqueVals(all,rdDistanceBucket),
     fields=uniqueVals(all,pfFieldZone),pers=uniqueVals(all,prPersonnel),forms=uniqueVals(all,prFormation),covs=uniqueVals(all,prCoverage);
 let typeB=prBreakdown(rows,prType),rushB=prBreakdown(rows,prRushCount),downB=addP10Breakdown(prBreakdown(rows,pfDown),rows,prMetrics),fieldB=prBreakdown(rows,pfFieldZone),persB=prBreakdown(rows,prPersonnel),combo=prComboRows(rows);
 let maxRush=Math.max(...rushB.map(x=>x.n),1);
 return `<div class="page-title"><h2>Pressure</h2><p>How ${esc(activeOpponentName())} creates pass-game stress by blitz, pressure state and rush count.</p></div>
 ${!all.length?`<div class="pf-empty"><b>No charted pass plays are loaded yet.</b><br>The Pressure workspace is built and will populate from the opponent-defense play feed.</div>`:''}

 <div class="pr-toolbar">
   <label>Pressure Type<select onchange="setPR('type',this.value)"><option value="ALL">All Pressure States</option>${types.map(v=>`<option ${prTypeF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Rush Count<select onchange="setPR('rush',this.value)"><option value="ALL">All Rush Counts</option>${rushes.map(v=>`<option ${prRushF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Down<select onchange="setPR('down',this.value)"><option value="ALL">All Downs</option>${downs.map(v=>`<option ${prDownF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Distance<select onchange="setPR('dist',this.value)"><option value="ALL">All Distances</option>${dists.map(v=>`<option ${prDistF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Field Zone<select onchange="setPR('field',this.value)"><option value="ALL">All Field Zones</option>${fields.map(v=>`<option ${prFieldF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Hash<select onchange="setPR('hash',this.value)">${reportHashOptions(prHashF)}</select></label>
   <label>Personnel<select onchange="setPR('personnel',this.value)"><option value="ALL">All Personnel</option>${pers.map(v=>`<option ${prPersonnelF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Formation<select onchange="setPR('formation',this.value)"><option value="ALL">All Formations</option>${forms.map(v=>`<option ${prFormationF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Coverage<select onchange="setPR('coverage',this.value)"><option value="ALL">All Coverages</option>${covs.map(v=>`<option ${prCoverageF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   ${dndSelect()}<div class="pr-reset"><button onclick="resetPR()">Reset Filters</button></div>
 </div>

 <div class="pr-kpis">
   <div class="pr-kpi"><span>Pass Plays</span><b>${rows.length||'—'}</b></div>
   <div class="pr-kpi"><span>YPP Allowed</span><b>${rows.length?fmt(s.ypp,2):'—'}</b></div>
   <div class="pr-kpi"><span>Median YPP</span><b>${rows.length?fmt(s.med,1):'—'}</b></div>
   <div class="pr-kpi"><span>Completion %</span><b>${s.att?pctText(s.comp,s.att):'—'}</b></div>
   <div class="pr-kpi"><span>Sacks</span><b>${rows.length?s.sacks:'—'}</b></div>
   <div class="pr-kpi"><span>Scrambles</span><b>${rows.length?s.scr:'—'}</b></div>
   <div class="pr-kpi"><span>Explosive %</span><b>${rows.length?pctText(s.exp,s.n):'—'}</b></div>
   <div class="pr-kpi"><span>Negative %</span><b>${rows.length?pctText(s.neg,s.n):'—'}</b></div>
   <div class="pr-kpi"><span>INT</span><b>${rows.length?s.ints:'—'}</b></div>
   <div class="pr-kpi"><span>Avg TTT</span><b>${s.ttt?fmt(s.ttt,2):'—'}</b></div>
 </div>

 <div class="pr-grid">
   <div class="pr-section pr-pressure-wide">
     <h3>Pressure State</h3><div class="pr-sub">Blitz / pressure / no-pressure-tag frequency and results.</div>
     <div class="pr-table-wrap">${table(['Type','Plays','Usage','YPP','Median','Comp %','Sacks','Expl %','Neg %'],prTable(typeB,rows.length))}</div>
   </div>

   <div class="pr-section pr-rush-narrow">
     <h3>Rush Count</h3><div class="pr-sub">How many defenders are coming when tagged.</div>
     <div class="pr-rush-grid">${rushB.length?rushB.slice(0,5).map(x=>`<div class="pr-rush-card"><span>Rush ${esc(x.k)}</span><div class="big">${x.n}</div><small>${pctText(x.n,rows.length)} · ${fmt(x.ypp,1)} YPP</small></div>`).join(''):'<div class="empty" style="grid-column:1/-1">Rush-count tags not available.</div>'}</div>
   </div>

   <div class="pr-section pr-span-12">
     <h3>Rush Distribution</h3><div class="pr-sub">Relative frequency of rush-count calls.</div>
     <div class="pr-bar-wrap">${rushB.length?rushB.map(x=>`<div class="pr-bar-row"><b>${esc(x.k)} rushers</b><div class="pr-bar"><i style="width:${100*x.n/maxRush}%"></i></div><span>${x.n} · ${pctText(x.n,rows.length)}</span></div>`).join(''):'<div class="empty">No rush-count data.</div>'}</div>
   </div>

   <div class="pr-section pr-span-6">
     <h3>By Down</h3><div class="pr-sub">Pressure results by down.</div>
     <div class="pr-table-wrap">${table(['Down','Plays','Usage','YPP','Median','Comp %','Sacks','Expl %','Neg %'],prTable(downB,rows.length))}</div>
   </div>

   <div class="pr-section pr-span-6">
     <h3>By Field Zone</h3><div class="pr-sub">How pressure changes by field position.</div>
     <div class="pr-table-wrap">${table(['Zone','Plays','Usage','YPP','Median','Comp %','Sacks','Expl %','Neg %'],prTable(fieldB,rows.length))}</div>
   </div>

 </div>`;
}



function hrHash(r){let h=String(firstField(r,['pff_HASH','HASH','hash'])||'').trim().toUpperCase();return ['L','C','R'].includes(h)?h:''}
function hrHashLabel(h){return h==='L'?'Left Hash':h==='R'?'Right Hash':h==='C'?'Middle':'Unknown'}
function hrRunPass(r){let v=String(firstField(r,['pff_RUNPASS'])||'').toUpperCase();return v==='R'?'Run':v==='P'?'Pass':'Other'}
function hrMotion(r){return nonEmpty(firstField(r,['pff_SHIFTMOTION']))?'Motion / Shift':'No Motion / Shift'}
function hrShell(r){return cvShell(r)||'Unknown'}
function hrManZone(r){return cvManZone(r)||'Unknown'}
function hrPressureState(r){return prType(r)||'Unknown'}
function hrRushCount(r){return prRushCount(r)||'Unknown'}
function hrTargetDepth(r){return cvTargetDepth(r)||'Unknown'}
function hrTargetSide(r){return cvTargetSide(r)||'Unknown'}
function hrTargetRelation(r){return hmTargetRelation(r)||'Unknown'}
function hrFormationGroup(r){return String(firstField(r,['pff_OFFFORMATIONGROUP','pff_STARTING_OFFENSIVE_FORMATION_GROUP'])||'').trim()||'Unknown'}
function hrFormation(r){return String(firstField(r,['pff_OFFENSIVE_FORMATION_NAME','pff_STARTING_OFFENSIVE_FORMATION_NAME','pff_OFFFORMATION'])||'').trim()||'Unknown'}
function hrRBAlignment(r){return String(firstField(r,['pff_RBALIGNMENT','pff_RBDIRECTION'])||'').trim()||'Unknown'}
function hrTEAlignment(r){return String(firstField(r,['pff_TEALIGNMENT'])||'').trim()||'Unknown'}
function hrRouteGroup(r){return String(firstField(r,['pff_PASSROUTETARGETGROUP','pff_PASSPATTERNBASIC','pff_PASSROUTETARGET'])||'').trim()||'Unknown'}
function hrReceiverPos(r){return String(firstField(r,['pff_PASSRECEIVERPOSITIONTARGET'])||'').trim()||'Unknown'}
function hrRunGap(r){
 let p=String(firstField(r,['pff_POAACTUAL'])||'').trim().toUpperCase();
 return ({ML:'A-L',MR:'A-R',LG:'B-L',RG:'B-R',LT:'C-L',RT:'C-R',LE:'D-L',RE:'D-R'})[p]||p||'Unknown';
}
function hrRowsBase(){return dashboardPlayRows().filter(r=>hrHash(r))}
function hrRows(){
 return hrRowsBase().filter(r=>
   (hrRPF==='ALL'||hrRunPass(r)===hrRPF) &&
   (hrDownF==='ALL'||pfDown(r)===hrDownF) &&
   (hrDistF==='ALL'||rdDistanceBucket(r)===hrDistF) &&
   (hrFieldF==='ALL'||pfFieldZone(r)===hrFieldF) &&
   (hrPersonnelF==='ALL'||pfPersonnel(r)===hrPersonnelF)
 )
}
function hrIsPass(r){return hrRunPass(r)==='Pass'}
function hrIsRun(r){return hrRunPass(r)==='Run'}
function hrMetric(rows){
 let gains=rows.map(r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained'])));
 let n=rows.length,exp=gains.filter(x=>x>=15).length,neg=gains.filter(x=>x<=0).length;
 let first=rows.filter(r=>pffBool(firstField(r,['pff_FIRST_DOWN_GAINED']))).length;
 let td=rows.filter(r=>nonEmpty(firstField(r,['pff_TOUCHDOWN']))).length;
 let passes=rows.filter(hrIsPass),runs=rows.filter(hrIsRun),att=0,comp=0,ints=0,sacks=0,press=0,blitz=0,tttRows=[];
 passes.forEach(r=>{
   let res=String(firstField(r,['pff_PASSRESULT'])||'').toUpperCase();
   if(['COMPLETE','INCOMPLETE','INTERCEPTION','THROWN AWAY','HIT AS THREW','BATTED PASS'].includes(res))att++;
   if(res==='COMPLETE')comp++;
   if(res==='INTERCEPTION'||nonEmpty(firstField(r,['pff_INTERCEPTION'])))ints++;
   if(res==='SACK'||nonEmpty(firstField(r,['pff_SACK'])))sacks++;
   if(nonEmpty(firstField(r,['pff_QBPRESSURE'])))press++;
   if(pffBool(firstField(r,['pff_BLITZDOG'])))blitz++;
   if(nonEmpty(firstField(r,['pff_TIMETOTHROW'])))tttRows.push(r);
 });
 const gain=r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained'])),ttt=r=>num(firstField(r,['pff_TIMETOTHROW']));
 return {n,ypp:n?balancedAvgRows(rows,gain):0,med:n?balancedMedianRows(rows,gain):0,exp,neg,first,td,runN:runs.length,passN:passes.length,att,comp,ints,sacks,press,blitz,ttt:tttRows.length?balancedAvgRows(tttRows,ttt):0};
}
function hrCoreTable(rows){
 let hashes=['L','C','R'];
 return hashes.map(h=>{
   let a=rows.filter(r=>hrHash(r)===h),m=hrMetric(a);
   return [hrHashLabel(h),m.n,fmt(m.ypp,2),fmt(m.med,1),pctText(m.exp,m.n),pctText(m.neg,m.n),pctText(m.first,m.n),m.td,m.runN,m.passN];
 });
}
function hrPassTable(rows){
 let hashes=['L','C','R'];
 return hashes.map(h=>{
   let a=rows.filter(r=>hrHash(r)===h&&hrIsPass(r)),m=hrMetric(a);
   return [hrHashLabel(h),m.n,fmt(m.ypp,2),fmt(m.med,1),m.att?pctText(m.comp,m.att):'—',pctText(m.exp,m.n),pctText(m.neg,m.n),m.sacks,m.ints,m.td,pctText(m.press,m.n),pctText(m.blitz,m.n),m.ttt?fmt(m.ttt,2):'—'];
 });
}
function hrRunTable(rows){
 let hashes=['L','C','R'];
 return hashes.map(h=>{
   let a=rows.filter(r=>hrHash(r)===h&&hrIsRun(r)),m=hrMetric(a);
   return [hrHashLabel(h),m.n,fmt(m.ypp,2),fmt(m.med,1),pctText(m.exp,m.n),pctText(m.neg,m.n),pctText(m.first,m.n),m.td];
 });
}
function hrCategoryMatrix(rows,label,fn,filterFn=null,limit=30){
 let base=filterFn?rows.filter(filterFn):rows,hashes=['L','C','R'];
 let cats={};
 base.forEach(r=>{let k=fn(r)||'Unknown';if(!cats[k])cats[k]={};(cats[k][hrHash(r)] ||= []).push(r)});
 let vals=Object.entries(cats).map(([k,m])=>({k,total:Object.values(m).reduce((n,a)=>n+a.length,0),m})).sort((a,b)=>b.total-a.total).slice(0,limit);
 return vals.map(x=>{
   let out=[esc(x.k)];
   hashes.forEach(h=>{
     let a=x.m[h]||[],den=base.filter(r=>hrHash(r)===h).length,met=hrMetric(a);
     out.push(a.length,den?pctText(a.length,den):'—',a.length?fmt(met.ypp,2):'—',a.length?fmt(met.med,1):'—');
   });
   return out;
 });
}
function hrSection(title,sub,rows,label,fn,filterFn=null,limit=30){
 let data=hrCategoryMatrix(rows,label,fn,filterFn,limit);
 return `<div class="hr-section"><h3>${esc(title)}</h3><div class="hr-sub">${esc(sub)}</div><div class="hr-table-wrap">${table([label,'L N','L %','L YPP','L Med','C N','C %','C YPP','C Med','R N','R %','R YPP','R Med'],data)}</div></div>`;
}
function setHR(k,v){if(k==='rp')hrRPF=v;if(k==='down')hrDownF=v;if(k==='dist')hrDistF=v;if(k==='field')hrFieldF=v;if(k==='personnel')hrPersonnelF=v;render()}
function resetHR(){hrRPF=hrDownF=hrDistF=hrFieldF=hrPersonnelF='ALL';render()}
function hashReportPage(){
 let all=hrRowsBase(),rows=hrRows();
 let downs=uniqueVals(all,pfDown),dists=uniqueVals(all,rdDistanceBucket),fields=uniqueVals(all,pfFieldZone),pers=uniqueVals(all,pfPersonnel);
 let hashCards=['L','C','R'].map(h=>{let a=rows.filter(r=>hrHash(r)===h),m=hrMetric(a);return `<div class="hr-hash-card"><h3>${hrHashLabel(h)}</h3><div class="sample">${m.n} filtered plays</div><div class="hr-mini-grid">
   <div class="hr-mini"><span>YPP</span><b>${fmt(m.ypp,2)}</b></div><div class="hr-mini"><span>Median</span><b>${fmt(m.med,1)}</b></div><div class="hr-mini"><span>Expl %</span><b>${pctText(m.exp,m.n)}</b></div>
   <div class="hr-mini"><span>Neg %</span><b>${pctText(m.neg,m.n)}</b></div><div class="hr-mini"><span>1D %</span><b>${pctText(m.first,m.n)}</b></div><div class="hr-mini"><span>Run / Pass</span><b>${m.runN}/${m.passN}</b></div>
 </div></div>`}).join('');
 return `<div class="page-title"><h2>Hash Intelligence</h2><p>Left, middle and right hash reports across every measurable scouting dimension available in the opponent-defense play feed.</p></div>
 <div class="hr-toolbar">
   <label>Run / Pass<select onchange="setHR('rp',this.value)"><option value="ALL">Run + Pass</option><option ${hrRPF==='Run'?'selected':''}>Run</option><option ${hrRPF==='Pass'?'selected':''}>Pass</option></select></label>
   <label>Down<select onchange="setHR('down',this.value)"><option value="ALL">All Downs</option>${downs.map(v=>`<option ${hrDownF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Distance<select onchange="setHR('dist',this.value)"><option value="ALL">All Distances</option>${dists.map(v=>`<option ${hrDistF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Field Zone<select onchange="setHR('field',this.value)"><option value="ALL">All Field Zones</option>${fields.map(v=>`<option ${hrFieldF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Personnel<select onchange="setHR('personnel',this.value)"><option value="ALL">All Personnel</option>${pers.map(v=>`<option ${hrPersonnelF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <div class="hr-reset"><button onclick="resetHR()">Reset Filters</button></div>
 </div>
 <div class="hr-legend">Every category table reports both <b>raw count</b> and <b>within-hash percentage</b>, plus YPP and median YPP. Nothing is inferred when the underlying tag is absent.</div>
 <div class="hr-hash-grid">${hashCards}</div>
 <div class="hr-section hr-core"><h3>Overall Hash Comparison</h3><div class="hr-sub">Core efficiency and volume by ball hash.</div><div class="hr-table-wrap">${table(['Hash','Plays','YPP','Median','Expl %','Neg %','1D %','TD','Runs','Passes'],hrCoreTable(rows))}</div></div>
 <div class="hr-passrun">
  <div class="hr-section hr-core"><h3>Run Performance by Hash</h3><div class="hr-sub">Run-only production.</div><div class="hr-table-wrap">${table(['Hash','Runs','YPP','Median','Expl %','Neg %','1D %','Rush TD'],hrRunTable(rows))}</div></div>
  <div class="hr-section hr-core"><h3>Pass Performance by Hash</h3><div class="hr-sub">Pass-only production and pressure results.</div><div class="hr-table-wrap">${table(['Hash','Pass Plays','YPP','Median','Comp %','Expl %','Neg %','Sacks','INT','Pass TD','Pressure %','Blitz %','Avg TTT'],hrPassTable(rows))}</div></div>
 </div>
 ${hrSection('Defensive Front by Hash','How the defense structures the front from each hash.',rows,'Front',pfFront,null,20)}
 ${hrSection('Box Count by Hash','Tagged box-player counts by hash.',rows,'Box',pfBox,null,15)}
 ${hrSection('Offensive Personnel Faced by Hash','Which offensive personnel groupings are being defended from each hash.',rows,'Personnel',pfPersonnel,null,20)}
 ${hrSection('Coverage Family by Hash','Coverage calls on pass plays.',rows,'Coverage',cvFamily,hrIsPass,25)}
 ${hrSection('Shell by Hash','1-high / 2-high / 0-high structure on pass plays.',rows,'Shell',hrShell,hrIsPass,10)}
 ${hrSection('Man vs Zone by Hash','Broad coverage family on pass plays.',rows,'Type',hrManZone,hrIsPass,10)}
 ${hrSection('Pressure State by Hash','Blitz / pressure result on pass plays.',rows,'Pressure',hrPressureState,hrIsPass,10)}
 ${hrSection('Rush Count by Hash','Number of pass rushers by hash.',rows,'Rushers',hrRushCount,hrIsPass,10)}
 ${hrSection('Run Concept by Hash','Run concept frequency and efficiency.',rows,'Concept',r=>String(firstField(r,['pff_RUNCONCEPTPRIMARY'])||'').trim()||'Unknown',hrIsRun,25)}
 ${hrSection('Run Gap / Point of Attack by Hash','A/B/C/D translation from PFF POAACTUAL.',rows,'Gap',hrRunGap,hrIsRun,25)}
 ${hrSection('Target Depth by Hash','Passing target depth bands.',rows,'Depth',hrTargetDepth,hrIsPass,10)}
 ${hrSection('Target Direction by Hash','PFF left / middle / right target direction.',rows,'Direction',hrTargetSide,hrIsPass,10)}
 ${hrSection('Target Relation to Hash','Boundary / middle / field-side target relationship.',rows,'Relation',hrTargetRelation,hrIsPass,10)}
 ${hrSection('Target Position by Hash','Position of the intended receiver when tagged.',rows,'Target Pos',hrReceiverPos,hrIsPass,20)}
 ${hrSection('Route / Pattern by Hash','Targeted route or pattern group when tagged.',rows,'Route',hrRouteGroup,hrIsPass,30)}
 ${hrSection('Formation Group by Hash','Formation structure group.',rows,'Formation Group',hrFormationGroup,null,25)}
 ${hrSection('Formation Name by Hash','Named offensive formations faced.',rows,'Formation',hrFormation,null,30)}
 ${hrSection('Motion / Shift by Hash','Broad motion/shift usage.',rows,'Motion',hrMotion,null,10)}
 ${hrSection('RB Alignment by Hash','Running back alignment/direction tag when available.',rows,'RB Align',hrRBAlignment,null,20)}
 ${hrSection('TE Alignment by Hash','Tight-end alignment tag when available.',rows,'TE Align',hrTEAlignment,null,20)}
 ${hrSection('Down by Hash','Down distribution within each hash.',rows,'Down',pfDown,null,10)}
 ${hrSection('Distance by Hash','Distance bucket distribution within each hash.',rows,'Distance',rdDistanceBucket,null,10)}
 ${hrSection('Field Zone by Hash','Field-position distribution within each hash.',rows,'Field Zone',pfFieldZone,null,15)}
 <div class="hr-section"><div class="sample-note">Hash is taken directly from PFF HASH. Left / Middle / Right samples in the supplied feed are charted independently; missing tags are not reassigned. Category percentages are always calculated within the current hash after the page filters are applied.</div></div>`;
}

function hmPassRowsBase(){return cvPassRowsBase()}

function hmTargetRelation(r){
 let h=String(cvHash(r)||'').toUpperCase();
 let w=firstField(r,['pff_PASSWIDTH']);
 if(!nonEmpty(w))return '';
 w=num(w);
 if(h==='L'){
   if(w<20)return'Boundary';
   if(w<=33.34)return'Middle';
   return'Field';
 }
 if(h==='R'){
   if(w>33.34)return'Boundary';
   if(w>=20)return'Middle';
   return'Field';
 }
 if(h==='C')return'Center Ball';
 return '';
}
function hmLaneFilterName(r){
 let c=hmWidthBin(r);
 return c>=0?hmLaneLabel(c):'';
}
function hmDepthFilterName(r){
 let rr=hmDepthBin(r);
 return rr>=0?hmDepthLabel(rr):'';
}
function hmRows(){
 return hmPassRowsBase().filter(r=>
   (hmCoverageF==='ALL'||cvFamily(r)===hmCoverageF) &&
   (hmShellF==='ALL'||cvShell(r)===hmShellF) &&
   (hmPressureF==='ALL'||prType(r)===hmPressureF) &&
   (hmDownF==='ALL'||pfDown(r)===hmDownF) &&
   (hmHashF==='ALL'||cvHash(r)===hmHashF) &&
   (hmFieldF==='ALL'||pfFieldZone(r)===hmFieldF) &&
   (hmRelativeF==='ALL'||hmTargetRelation(r)===hmRelativeF) &&
   (hmDepthF==='ALL'||hmDepthFilterName(r)===hmDepthF) &&
   (hmLaneF==='ALL'||hmLaneFilterName(r)===hmLaneF) &&
   dndMatches(r)
 );
}
function hmCellRows(rows,depth,side){
 return rows.filter(r=>cvTargetDepth(r)===depth&&cvTargetSide(r)===side);
}
function hmMetricValue(rows){
 let m=cvMetrics(rows);
 if(hmMetric==='targets')return {big:rows.length,small:rows.length?'targets':'No targets'};
 if(hmMetric==='ypp')return {big:rows.length?fmt(m.ypp,1):'—',small:rows.length?`${rows.length} targets`:'No targets'};
 if(hmMetric==='comp')return {big:m.att?pctText(m.comp,m.att):'—',small:rows.length?`${m.comp}/${m.att}`:'No targets'};
 if(hmMetric==='expl')return {big:rows.length?pctText(m.exp,m.n):'—',small:rows.length?`${m.exp} explosives`:'No targets'};
 if(hmMetric==='td')return {big:rows.length?m.td:'—',small:rows.length?`${rows.length} targets`:'No targets'};
 if(hmMetric==='int')return {big:rows.length?m.ints:'—',small:rows.length?`${rows.length} targets`:'No targets'};
 return {big:rows.length,small:'targets'};
}
function hmBreakdown(rows,fn){
 let m={};rows.forEach(r=>{let k=fn(r)||'Unknown';(m[k] ||= []).push(r)});
 return Object.entries(m).map(([k,a])=>({k,...cvMetrics(a)})).sort((a,b)=>b.n-a.n);
}
function hmTable(arr,total){
 return arr.map(x=>[
   esc(x.k),x.n,pctText(x.n,total),fmt(x.ypp,2),fmt(x.med,1),
   x.att?pctText(x.comp,x.att):'—',pctText(x.exp,x.n),x.td,x.ints
 ]);
}
function setHM(key,val){
 if(key==='metric')hmMetric=val;if(key==='coverage')hmCoverageF=val;if(key==='shell')hmShellF=val;
 if(key==='pressure')hmPressureF=val;if(key==='down')hmDownF=val;if(key==='hash')hmHashF=val;if(key==='field')hmFieldF=val;if(key==='relative')hmRelativeF=val;if(key==='depth')hmDepthF=val;if(key==='lane')hmLaneF=val;render();
}
function resetHM(){hmCoverageF=hmShellF=hmPressureF=hmDownF=hmHashF=hmFieldF=hmRelativeF=hmDepthF=hmLaneF='ALL';hmMetric='ypp';render()}

function hmWidthBin(r){
 let w=firstField(r,['pff_PASSWIDTH']);
 if(!nonEmpty(w))return -1;
 let n=num(w);
 if(!Number.isFinite(n))return -1;
 return Math.max(0,Math.min(4,Math.floor((n/53.34)*5)));
}
function hmDepthBin(r){
 let d=firstField(r,['pff_PASSDEPTH']);
 if(!nonEmpty(d))return -1;
 d=num(d);
 if(d<0)return 3;
 if(d<10)return 2;
 if(d<20)return 1;
 return 0;
}
function hmLaneLabel(c){return ['Left Sideline','Left Hash','Middle','Right Hash','Right Sideline'][c]}
function hmDepthLabel(r){return ['20+','10-19','0-9','Behind LOS'][r]}
function hmSpatialCells(rows){
 let cells=Array.from({length:20},()=>[]);
 rows.forEach(r=>{
   let rr=hmDepthBin(r),cc=hmWidthBin(r);
   if(rr<0||cc<0)return;
   cells[rr*5+cc].push(r);
 });
 return cells;
}

function spatialMetricValue(a,metricName,totalMapped){
 let m=cvMetrics(a),share=totalMapped?pctText(a.length,totalMapped):'—',comp=m.att?pctText(m.comp,m.att):'—';
 let extra=a.length?`CMP ${comp} · YPP ${fmt(m.ypp,1)} · MED ${fmt(m.med,1)}`:'';
 if(metricName==='targets')return {main:a.length,share,sub:a.length?`${a.length} targets · ${share}`:'No targets',extra};
 if(metricName==='ypp')return {main:a.length?fmt(m.ypp,1):'—',share,sub:a.length?`${a.length} targets · ${share}`:'No targets',extra:`MED ${fmt(m.med,1)} · CMP ${comp}`};
 if(metricName==='comp')return {main:comp,share,sub:m.att?`${m.comp}/${m.att} completions · ${a.length} targets`:'No attempts',extra:`YPP ${fmt(m.ypp,1)} · MED ${fmt(m.med,1)}`};
 if(metricName==='expl')return {main:a.length?pctText(m.exp,m.n):'—',share,sub:a.length?`${m.exp} explosives / ${a.length} targets`:'No targets',extra:`CMP ${comp} · YPP ${fmt(m.ypp,1)} · MED ${fmt(m.med,1)}`};
 if(metricName==='td')return {main:m.td,share,sub:a.length?`${m.td} TD · ${a.length} targets · ${share}`:'No targets',extra:`CMP ${comp} · YPP ${fmt(m.ypp,1)} · MED ${fmt(m.med,1)}`};
 if(metricName==='int')return {main:m.ints,share,sub:a.length?`${m.ints} INT · ${a.length} targets · ${share}`:'No targets',extra:`CMP ${comp} · YPP ${fmt(m.ypp,1)} · MED ${fmt(m.med,1)}`};
 return {main:a.length,share,sub:`${a.length} targets · ${share}`,extra};
}


function qbHashPosition(rows){
 let posMap={L:30,C:50,R:70};
 let tagged=rows.map(r=>String(cvHash(r)||'').toUpperCase()).filter(v=>v==='L'||v==='C'||v==='R');
 if(!tagged.length)return 50;
 let counts={L:0,C:0,R:0};
 tagged.forEach(v=>counts[v]++);
 return ((counts.L*posMap.L)+(counts.C*posMap.C)+(counts.R*posMap.R))/tagged.length;
}
function qbHashLabel(rows){
 let tagged=rows.map(r=>String(cvHash(r)||'').toUpperCase()).filter(v=>v==='L'||v==='C'||v==='R');
 if(!tagged.length)return 'HASH MIX UNKNOWN';
 let counts={L:0,C:0,R:0}; tagged.forEach(v=>counts[v]++);
 let top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
 return top==='L'?'QB ON LEFT HASH':top==='R'?'QB ON RIGHT HASH':'QB IN MIDDLE';
}

function zoneDetailData(a,row,col,totalMapped){
 let m=cvMetrics(a);
 return {
   title:`${hmDepthLabel(row)} · ${hmLaneLabel(col)}`,
   targets:a.length,
   share:totalMapped?pctText(a.length,totalMapped):'—',
   comp:m.att?pctText(m.comp,m.att):'—',
   completions:m.comp,
   attempts:m.att,
   ypp:a.length?fmt(m.ypp,2):'—',
   median:a.length?fmt(m.med,1):'—',
   explosive:a.length?pctText(m.exp,m.n):'—',
   explosives:m.exp,
   td:m.td,
   ints:m.ints,
   sample:totalMapped
 };
}
function openZoneModalFromEncoded(encoded){
 try{
   let d=JSON.parse(decodeURIComponent(encoded));
   $('zoneModalTitle').textContent=d.title;
   $('zoneModalBody').innerHTML=`<div class="zone-modal-kpis">
      <div class="zone-modal-kpi"><span>Targets</span><b>${d.targets}</b></div>
      <div class="zone-modal-kpi"><span>Target Share</span><b>${d.share}</b></div>
      <div class="zone-modal-kpi"><span>Completion %</span><b>${d.comp}</b></div>
      <div class="zone-modal-kpi"><span>Completions</span><b>${d.completions}/${d.attempts}</b></div>
      <div class="zone-modal-kpi"><span>YPP</span><b>${d.ypp}</b></div>
      <div class="zone-modal-kpi"><span>Median YPP</span><b>${d.median}</b></div>
      <div class="zone-modal-kpi"><span>Explosive %</span><b>${d.explosive}</b></div>
      <div class="zone-modal-kpi"><span>Explosives</span><b>${d.explosives}</b></div>
      <div class="zone-modal-kpi"><span>TD</span><b>${d.td}</b></div>
      <div class="zone-modal-kpi"><span>INT</span><b>${d.ints}</b></div>
    </div>
    <div class="zone-modal-note">Zone share is based on ${d.sample} mapped targets in the current filter. All other numbers are calculated only from plays in this zone.</div>`;
   $('zoneModal').classList.remove('hidden');
 }catch(e){console.error(e)}
}
function closeZoneModal(){$('zoneModal').classList.add('hidden')}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeZoneModal()});


function heatWeightValue(a,metricName){
 if(!a.length)return null;
 let m=cvMetrics(a);
 if(metricName==='comp')return m.att ? (100*m.comp/m.att) : null;
 if(metricName==='expl')return m.n ? (100*m.exp/m.n) : null;
 return m.ypp;
}
function heatWeightRange(cells,metricName){
 let vals=cells.map(a=>heatWeightValue(a,metricName)).filter(v=>Number.isFinite(v));
 if(!vals.length)return {min:0,max:1};
 let min=Math.min(...vals),max=Math.max(...vals);
 if(max===min)max=min+1;
 return {min,max};
}
function heatZoneStyle(a,metricName,range){
 let v=heatWeightValue(a,metricName);
 if(!Number.isFinite(v))return 'background:rgba(255,255,255,.52)';
 let t=Math.max(0,Math.min(1,(v-range.min)/(range.max-range.min)));
 let alpha=.05 + (.57*t);
 return `background:rgba(111,24,39,${alpha.toFixed(3)});${t>.56?'color:#fff;':''}`;
}
function spatialFieldHTML(rows,metricName='ypp'){
 let cells=hmSpatialCells(rows),totalMapped=cells.reduce((n,a)=>n+a.length,0),qbLeft=qbHashPosition(rows),qbText=qbHashLabel(rows),range=heatWeightRange(cells,metricName);
 return `<div class="pass-field">
   <div class="pass-los"><span>OFFENSIVE LINE OF SCRIMMAGE</span></div>
   <div class="pass-field-grid">
     ${cells.map((a,i)=>{
       let row=Math.floor(i/5),col=i%5,v=spatialMetricValue(a,metricName,totalMapped),d=zoneDetailData(a,row,col,totalMapped),detail=encodeURIComponent(JSON.stringify(d));
       let m=cvMetrics(a),style=heatZoneStyle(a,metricName,range);
       return `<div class="pass-zone weighted" style="${style}" role="button" tabindex="0"
         onclick="openZoneModalFromEncoded('${detail}')"
         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openZoneModalFromEncoded('${detail}')}">
         <div class="pz-label">${hmDepthLabel(row)} · ${hmLaneLabel(col)}</div>
         <div class="pz-main">${v.main}</div>
         <div class="pz-share">${a.length?v.share:''}</div>
         <div class="pz-sub">${v.sub}</div>
         <div class="pz-extra">${a.length?v.extra:''}</div>
         <div class="pz-context">${a.length?`<b>TD ${m.td}</b> · <b>INT ${m.ints}</b>`:''}</div>
       </div>`
     }).join('')}
   </div>
   <div class="pass-qb" style="left:${qbLeft}%"><div class="pass-qb-icon">QB</div><div class="pass-qb-label">${qbText}</div></div>
 </div><div class="pass-axis"><span>OFFENSE LEFT</span><span>${totalMapped} mapped targets = 100%</span><span>OFFENSE RIGHT</span></div>`;
}
function heatmapsPage(){
 let all=hmPassRowsBase(),rows=hmRows(),s=cvMetrics(rows);
 let covs=uniqueVals(all,cvFamily),shells=uniqueVals(all,cvShell),pressures=uniqueVals(all,prType),downs=uniqueVals(all,pfDown),hashes=uniqueVals(all,cvHash),fields=uniqueVals(all,pfFieldZone),rels=uniqueVals(all,hmTargetRelation),depthFilters=['20+','10-19','0-9','Behind LOS'],laneFilters=['Left Sideline','Left Hash','Middle','Right Hash','Right Sideline'];
 let cells=hmSpatialCells(rows),maxTargets=Math.max(...cells.map(a=>a.length),1);
 let depthB=hmBreakdown(rows,cvTargetDepth),sideB=hmBreakdown(rows,cvTargetSide),covB=hmBreakdown(rows,cvFamily);
 let mapped=cells.reduce((n,a)=>n+a.length,0);
 return `<div class="page-title"><h2>Field Heat Maps</h2><p>Offensive-view target map using the same 5-wide × 4-deep spatial structure as D Intel.</p></div>
 ${!all.length?`<div class="pf-empty"><b>No charted pass plays are loaded yet.</b><br>The Field Heat Maps workspace is built and will populate from the opponent-defense play feed.</div>`:''}

 <div class="hm-toolbar hm-more">
   <label>Coverage<select onchange="setHM('coverage',this.value)"><option value="ALL">All Coverages</option>${covs.map(v=>`<option ${hmCoverageF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Shell<select onchange="setHM('shell',this.value)"><option value="ALL">All Shells</option>${shells.map(v=>`<option ${hmShellF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Pressure<select onchange="setHM('pressure',this.value)"><option value="ALL">All Pressure States</option>${pressures.map(v=>`<option ${hmPressureF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Down<select onchange="setHM('down',this.value)"><option value="ALL">All Downs</option>${downs.map(v=>`<option ${hmDownF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Hash<select onchange="setHM('hash',this.value)"><option value="ALL">All Hashes</option>${hashes.map(v=>`<option ${hmHashF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Field Zone<select onchange="setHM('field',this.value)"><option value="ALL">All Field Zones</option>${fields.map(v=>`<option ${hmFieldF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Relative to Hash<select onchange="setHM('relative',this.value)"><option value="ALL">All Target Relations</option>${rels.map(v=>`<option ${hmRelativeF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Depth Band<select onchange="setHM('depth',this.value)"><option value="ALL">All Depths</option>${depthFilters.map(v=>`<option ${hmDepthF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Width Lane<select onchange="setHM('lane',this.value)"><option value="ALL">All Width Lanes</option>${laneFilters.map(v=>`<option ${hmLaneF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   ${dndSelect()}<div class="hm-reset"><button onclick="resetHM()">Reset Filters</button></div>
 </div>

 <div class="hash-quick">
   <button class="${hmHashF==='ALL'?'active':''}" onclick="setHM('hash','ALL')">All Hashes</button>
   <button class="${hmHashF==='L'?'active':''}" onclick="setHM('hash','L')">Left Hash</button>
   <button class="${hmHashF==='C'?'active':''}" onclick="setHM('hash','C')">Middle</button>
   <button class="${hmHashF==='R'?'active':''}" onclick="setHM('hash','R')">Right Hash</button>
 </div>

 <div class="hm-weight-select">
   <label>Heat Weight
     <select onchange="setHM('metric',this.value)">
       <option value="ypp" ${hmMetric==='ypp'?'selected':''}>YPP</option>
       <option value="comp" ${hmMetric==='comp'?'selected':''}>Completion %</option>
       <option value="expl" ${hmMetric==='expl'?'selected':''}>Explosive %</option>
     </select>
   </label>
 </div>
 <div class="heat-scale"><span>Lower</span><div class="heat-scale-bar"></div><span>Higher selected metric</span></div>

 <div class="hm-summary">
   ${metric('Pass Plays',rows.length||'—')}
   ${metric('Mapped Targets',mapped||'—')}
   ${metric('YPP',rows.length?fmt(s.ypp,2):'—')}
   ${metric('Median YPP',rows.length?fmt(s.med,1):'—')}
   ${metric('Completion %',s.att?pctText(s.comp,s.att):'—')}
   ${metric('Explosive %',rows.length?pctText(s.exp,s.n):'—')}
   ${metric('TD',rows.length?s.td:'—')}
   ${metric('INT',rows.length?s.ints:'—')}
 </div>

 <div class="pass-legend"><span><b>20 zones:</b> 5 width lanes × 4 depth bands</span><span><b>LOS:</b> lower on field for offensive view</span></div>
 ${spatialFieldHTML(rows,hmMetric)}

 <div class="sample-note">LOS is placed low on the field because this is the offensive view. The 20 zones use PFF PASSWIDTH and PASSDEPTH. Throws without a charted width are excluded from the spatial grid rather than forced into a lane.</div>

 <div class="hm-split-grid" style="margin-top:12px">
   <div class="hm-panel"><h3>By Target Depth</h3><div class="hm-sub">Behind LOS through deep 20+.</div><div class="hm-table-wrap">${table(['Depth','Targets','Usage','YPP','Median','Comp %','Expl %','TD','INT'],hmTable(depthB,rows.length))}</div></div>
   <div class="hm-panel"><h3>By Target Side</h3><div class="hm-sub">Broad left, middle and right PFF direction tag.</div><div class="hm-table-wrap">${table(['Side','Targets','Usage','YPP','Median','Comp %','Expl %','TD','INT'],hmTable(sideB,rows.length))}</div></div>
   <div class="hm-panel"><h3>By Coverage</h3><div class="hm-sub">Spatial results by coverage family.</div><div class="hm-table-wrap">${table(['Coverage','Targets','Usage','YPP','Median','Comp %','Expl %','TD','INT'],hmTable(covB,rows.length))}</div></div>
 </div>`;
}


const ULM_FORMATION_MAP={
 'PRO - CLOSED':'I-FLUTE','PRO - OPEN':'SPIN','PRO - PRO':'DIAMOND','QUADS WING - NIX':'FLANK','QUAY - NIX':'TRIO XTRA','QUAY - OPEN':'TRIO XTRA',
 'SLOT - CLOSED':'FLANK FIB','SLOT - OPEN':'TRIO','SLOT - PRO':'DUO','SLOT - SLOT':'DICE','SLOT - WING':'FLANK FIB','TOAD WING - OPEN':'TOP',
 'TREY - CLOSED':'FLANK','TREY - NIX':'TRIPS XTRA','TREY - OPEN':'TRIO','TREY - PRO':'TRUST FIB','TREY - SLOT':'TRUST','TRIPS - CLOSED':'FIST','TRIPS - OPEN':'TOP','TRIPS - SLOT':'TOP'
};
