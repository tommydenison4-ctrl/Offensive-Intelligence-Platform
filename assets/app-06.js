function cvManZone(r){
 let raw=String(firstField(r,['pff_MANZONE','MAN_ZONE','man_zone','COVERAGE_TYPE','coverage_type'])||'').trim();
 if(raw)return raw;
 let fam=cvFamily(r).toUpperCase();
 if(/MAN|COVER\s*0|COVER\s*1|TWO MAN|2 MAN/.test(fam))return'Man';
 if(fam)return'Zone';
 return '';
}
function cvHash(r){return String(firstField(r,['pff_HASH','HASH','hash','BALL_HASH','ball_hash'])||'').trim()}
function cvPressure(r){
 let blitz=pffBool(firstField(r,['pff_BLITZDOG'])), pressured=nonEmpty(firstField(r,['pff_QBPRESSURE']));
 if(blitz&&pressured)return'Blitz + Pressure'; if(blitz)return'Blitz, No Pressure';
 if(pressured)return'Non-Blitz Pressure'; return'No Blitz / No Pressure';
}
function cvTargetDepth(r){
 let v=firstField(r,['pff_PASSDEPTH','pff_TARGETDEPTH','TARGET_DEPTH','target_depth']);
 if(!nonEmpty(v))return '';
 let d=num(v);
 if(d<0)return'Behind LOS';
 if(d<=9)return'Short 0-9';
 if(d<=19)return'Intermediate 10-19';
 return'Deep 20+';
}
function cvTargetSide(r){
 let raw=String(firstField(r,['pff_PASSDIRECTION','pff_TARGETLOCATION','TARGET_LOCATION'])||'').trim().toUpperCase();
 if(raw==='L'||raw.includes('LEFT'))return'Left';
 if(raw==='R'||raw.includes('RIGHT'))return'Right';
 if(raw==='M'||raw==='C'||raw.includes('MIDDLE')||raw.includes('CENTER'))return'Middle';
 return '';
}
function cvRows(){
 return cvPassRowsBase().filter(r=>
   (cvFamilyF==='ALL'||cvFamily(r)===cvFamilyF) &&
   (cvShellF==='ALL'||cvShell(r)===cvShellF) &&
   (cvManZoneF==='ALL'||cvManZone(r)===cvManZoneF) &&
   (cvDownF==='ALL'||pfDown(r)===cvDownF) &&
   (cvDistF==='ALL'||rdDistanceBucket(r)===cvDistF) &&
   (cvFieldF==='ALL'||pfFieldZone(r)===cvFieldF) &&
   (cvHashF==='ALL'||cvHash(r)===cvHashF) &&
   (cvPressureF==='ALL'||cvPressure(r)===cvPressureF) &&
   dndMatches(r)
 );
}
function cvMetrics(rows){
 let gains=rows.map(r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained'])));
 let att=0,comp=0,ints=0,td=0,sacks=0,exp=0,neg=0;
 rows.forEach(r=>{
   let g=num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained'])); if(g>=15)exp++; if(g<=0)neg++;
   let result=String(firstField(r,['pff_PASSRESULT','PASSRESULT','pass_result'])||'').toUpperCase();
   if(['COMPLETE','INCOMPLETE','INTERCEPTION','THROWN AWAY','HIT AS THREW','BATTED PASS'].includes(result))att++;
   if(result==='COMPLETE')comp++;
   if(result==='INTERCEPTION'||nonEmpty(firstField(r,['pff_INTERCEPTION','INTERCEPTION'])))ints++;
   if(result==='SACK')sacks++;
   if(nonEmpty(firstField(r,['pff_TOUCHDOWN','TOUCHDOWN','TD'])))td++;
 });
 const gain=r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained']));
 return {n:rows.length,ypp:rows.length?balancedAvgRows(rows,gain):0,med:rows.length?balancedMedianRows(rows,gain):0,att,comp,ints,td,sacks,exp,neg};
}
function cvBreakdown(rows,fn){
 let m={}; rows.forEach(r=>{let k=fn(r)||'Unknown';(m[k] ||= []).push(r)});
 return Object.entries(m).map(([k,a])=>({k,...cvMetrics(a)})).sort((a,b)=>b.n-a.n);
}
function cvTable(arr,total){
 return arr.map(x=>[
   esc(x.k),x.n,pctText(x.n,total),fmt(x.ypp,2),fmt(x.med,1),
   x.att?pctText(x.comp,x.att):'—',pctText(x.exp,x.n),x.td,x.ints
 ]);
}
function cvComboRows(rows){
 let m={};
 rows.forEach(r=>{
   let f=cvFamily(r)||'Unknown', s=cvShell(r)||'Unknown', mz=cvManZone(r)||'Unknown';
   let k=f+'||'+s+'||'+mz;(m[k] ||= []).push(r);
 });
 return Object.entries(m).map(([k,a])=>{
   let [family,shell,mz]=k.split('||');return {family,shell,mz,...cvMetrics(a)}
 }).sort((a,b)=>b.n-a.n).slice(0,14);
}
function cvHeat(rows){
 let cells={};
 rows.forEach(r=>{
   let d=cvTargetDepth(r)||'Unknown', side=cvTargetSide(r)||'Unknown', k=d+'||'+side;
   (cells[k] ||= []).push(r);
 });
 return cells;
}
function setCV(key,val){
 if(key==='family')cvFamilyF=val;if(key==='shell')cvShellF=val;if(key==='mz')cvManZoneF=val;
 if(key==='down')cvDownF=val;if(key==='dist')cvDistF=val;if(key==='field')cvFieldF=val;
 if(key==='hash')cvHashF=val;if(key==='pressure')cvPressureF=val;render();
}
function resetCV(){cvFamilyF=cvShellF=cvManZoneF=cvDownF=cvDistF=cvFieldF=cvHashF=cvPressureF='ALL';dndFilter='ALL';render()}
function coveragePage(){
 let all=cvPassRowsBase(),rows=cvRows(),s=cvMetrics(rows);
 let families=uniqueVals(all,cvFamily),shells=uniqueVals(all,cvShell),mzs=uniqueVals(all,cvManZone),downs=uniqueVals(all,pfDown),
     dists=uniqueVals(all,rdDistanceBucket),fields=uniqueVals(all,pfFieldZone),hashes=uniqueVals(all,cvHash),pressures=uniqueVals(all,cvPressure);
 let familyB=cvBreakdown(rows,cvFamily),shellB=cvBreakdown(rows,cvShell),mzB=cvBreakdown(rows,cvManZone),
     downB=addP10Breakdown(cvBreakdown(rows,pfDown),rows,cvMetrics),fieldB=cvBreakdown(rows,pfFieldZone),combo=cvComboRows(rows),heat=cvHeat(rows);
 let shell1=shellB.find(x=>/1 High/i.test(x.k)),shell2=shellB.find(x=>/2 High/i.test(x.k)),shell0=shellB.find(x=>/0 High/i.test(x.k));
 let depthOrder=['Deep 20+','Intermediate 10-19','Short 0-9','Behind LOS'], sideOrder=['Left','Middle','Right'];
 return `<div class="page-title"><h2>Coverage</h2><p>Coverage structure, shell, man/zone and passing results against ${activeOpponentName()}.</p></div>
 ${!all.length?`<div class="pf-empty"><b>No charted pass plays are loaded yet.</b><br>The Coverage workspace is built and will populate from the opponent-defense play feed.</div>`:''}

 

 <div class="cv-kpis">
   <div class="cv-kpi"><span>Pass Plays</span><b>${rows.length||'—'}</b></div>
   <div class="cv-kpi"><span>YPP Allowed</span><b>${rows.length?fmt(s.ypp,2):'—'}</b></div>
   <div class="cv-kpi"><span>Median YPP</span><b>${rows.length?fmt(s.med,1):'—'}</b></div>
   <div class="cv-kpi"><span>Completion %</span><b>${s.att?pctText(s.comp,s.att):'—'}</b></div>
   <div class="cv-kpi"><span>Explosive %</span><b>${rows.length?pctText(s.exp,s.n):'—'}</b></div>
   <div class="cv-kpi"><span>Negative %</span><b>${rows.length?pctText(s.neg,s.n):'—'}</b></div>
   <div class="cv-kpi"><span>TD</span><b>${rows.length?s.td:'—'}</b></div>
   <div class="cv-kpi"><span>INT</span><b>${rows.length?s.ints:'—'}</b></div>
   <div class="cv-kpi"><span>Sacks</span><b>${rows.length?s.sacks:'—'}</b></div>
 </div>

 <div class="cv-grid">
   <div class="cv-section cv-span-4">
     <h3>Shell Snapshot</h3><div class="cv-sub">Pre-snap / tagged shell distribution.</div>
     <div class="cv-shells">
       <div class="cv-shell"><span>0 High</span><div class="big">${shell0?shell0.n:'—'}</div><small>${shell0?pctText(shell0.n,rows.length):'—'}</small></div>
       <div class="cv-shell"><span>1 High</span><div class="big">${shell1?shell1.n:'—'}</div><small>${shell1?pctText(shell1.n,rows.length):'—'}</small></div>
       <div class="cv-shell"><span>2 High</span><div class="big">${shell2?shell2.n:'—'}</div><small>${shell2?pctText(shell2.n,rows.length):'—'}</small></div>
     </div>
   </div>

   <div class="cv-section cv-span-4">
     <h3>Man vs Zone</h3><div class="cv-sub">Frequency and efficiency by coverage type.</div>
     <div class="cv-table-wrap">${table(['Type','Plays','Usage','YPP','Median','Comp %','Expl %','TD','INT'],cvTable(mzB,rows.length))}</div>
   </div>

   <div class="cv-section cv-span-4">
     <h3>Coverage Family</h3><div class="cv-sub">Cover 0/1/2/3/4/6, two-man, quarters, etc. when tagged.</div>
     <div class="cv-table-wrap">${table(['Coverage','Plays','Usage','YPP','Median','Comp %','Expl %','TD','INT'],cvTable(familyB,rows.length))}</div>
   </div>


   <div class="cv-span-12">
     <div class="cv-filters-panel">
       <div class="cv-filters-head">Coverage Filters</div>
<div class="cv-toolbar">
   <label>Coverage Family<select onchange="setCV('family',this.value)"><option value="ALL">All Coverages</option>${families.map(v=>`<option ${cvFamilyF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Shell<select onchange="setCV('shell',this.value)"><option value="ALL">All Shells</option>${shells.map(v=>`<option ${cvShellF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Man / Zone<select onchange="setCV('mz',this.value)"><option value="ALL">All</option>${mzs.map(v=>`<option ${cvManZoneF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Down<select onchange="setCV('down',this.value)"><option value="ALL">All Downs</option>${downs.map(v=>`<option ${cvDownF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Distance<select onchange="setCV('dist',this.value)"><option value="ALL">All Distances</option>${dists.map(v=>`<option ${cvDistF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Field Zone<select onchange="setCV('field',this.value)"><option value="ALL">All Field Zones</option>${fields.map(v=>`<option ${cvFieldF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Hash<select onchange="setCV('hash',this.value)"><option value="ALL">All Hashes</option>${hashes.map(v=>`<option ${cvHashF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Pressure<select onchange="setCV('pressure',this.value)"><option value="ALL">All Pressure States</option>${pressures.map(v=>`<option ${cvPressureF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   ${dndSelect()}<div class="cv-reset"><button onclick="resetCV()">Reset Filters</button></div>
 </div>
     </div>
   </div>

   <div class="cv-section cv-span-12">
     <h3>Target Location</h3>
     <div class="cv-sub">20-zone offensive field. Every populated cell shows raw targets, target share, completion %, YPP and median YPP. Click any zone to expand. Click any zone to expand the full detail.</div>
     <div class="hash-quick">
       <button class="${cvHashF==='ALL'?'active':''}" onclick="setCV('hash','ALL')">All Hashes</button>
       <button class="${cvHashF==='L'?'active':''}" onclick="setCV('hash','L')">Left Hash</button>
       <button class="${cvHashF==='C'?'active':''}" onclick="setCV('hash','C')">Middle</button>
       <button class="${cvHashF==='R'?'active':''}" onclick="setCV('hash','R')">Right Hash</button>
     </div>
     ${spatialFieldHTML(rows,'targets')}
   </div>

   <div class="cv-section cv-span-6">
     <h3>By Shell</h3><div class="cv-sub">Passing results against each shell.</div>
     <div class="cv-table-wrap">${table(['Shell','Plays','Usage','YPP','Median','Comp %','Expl %','TD','INT'],cvTable(shellB,rows.length))}</div>
   </div>

   <div class="cv-section cv-span-6">
     <h3>By Down</h3><div class="cv-sub">Coverage results by down.</div>
     <div class="cv-table-wrap">${table(['Down','Plays','Usage','YPP','Median','Comp %','Expl %','TD','INT'],cvTable(downB,rows.length))}</div>
   </div>

   <div class="cv-section cv-span-6">
     <h3>By Field Zone</h3><div class="cv-sub">Coverage performance by field location.</div>
     <div class="cv-table-wrap">${table(['Zone','Plays','Usage','YPP','Median','Comp %','Expl %','TD','INT'],cvTable(fieldB,rows.length))}</div>
   </div>

   <div class="cv-section cv-span-6">
     <h3>Coverage × Shell × Man/Zone</h3><div class="cv-sub">Most common structural combinations.</div>
     ${combo.length?`<div class="cv-combo head"><div>Coverage</div><div>Shell</div><div>Type</div><div>Plays</div><div>YPP</div><div>Comp%</div><div>Expl%</div><div>INT</div></div>${combo.map(x=>`<div class="cv-combo"><div><b>${esc(x.family)}</b></div><div>${esc(x.shell)}</div><div>${esc(x.mz)}</div><div>${x.n}</div><div>${fmt(x.ypp,2)}</div><div>${x.att?pctText(x.comp,x.att):'—'}</div><div>${pctText(x.exp,x.n)}</div><div>${x.ints}</div></div>`).join('')}`:'<div class="empty">No combination data available.</div>'}
   </div>

   <div class="cv-section cv-span-12">
     <div class="sample-note">Coverage labels are taken from the charted data. The app will infer only broad shell/man-zone grouping from an explicit coverage name when a separate shell/type field is absent; it does not invent a specific coverage call.</div>
   </div>
 </div>`;
}



function stRunPass(r){
 let rp=String(firstField(r,['pff_RUNPASS','RUNPASS','run_pass','play_type'])||'').toUpperCase();
 if(rp==='R'||rp==='RUN')return'Run';
 if(rp==='P'||rp==='PASS')return'Pass';
 return '';
}
function stRows(){
 return dashboardPlayRows().filter(r=>
   (stDownF==='ALL'||pfDown(r)===stDownF) &&
   (stDistF==='ALL'||rdDistanceBucket(r)===stDistF) &&
   (stFieldF==='ALL'||pfFieldZone(r)===stFieldF) &&
   (stHashF==='ALL'||cvHash(r)===stHashF) &&
   (stRP==='ALL'||stRunPass(r)===stRP) &&
   (stPersonnelF==='ALL'||pfPersonnel(r)===stPersonnelF) &&
   (stFrontF==='ALL'||pfFront(r)===stFrontF) &&
   (stCoverageF==='ALL'||cvFamily(r)===stCoverageF) &&
   dndMatches(r)
 );
}
function stMetrics(rows){
 let s=dashboardStats(rows);
 let first=rows.filter(r=>{
   let gain=num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained']));
   let dist=num(firstField(r,['pff_DISTANCE','DISTANCE','distance']));
   return dist>0&&gain>=dist;
 }).length;
 return {...s,first};
}
function stBreakdown(rows,fn){
 let m={};rows.forEach(r=>{let k=fn(r)||'Unknown';(m[k] ||= []).push(r)});
 return Object.entries(m).map(([k,a])=>({k,...stMetrics(a)})).sort((a,b)=>b.n-a.n);
}
function stTable(arr,total){
 return arr.map(x=>[
   esc(x.k),x.n,pctText(x.n,total),fmt(x.ypp,2),fmt(x.median,1),
   pctText(x.expl,x.n),pctText(x.neg,x.n),pctText(x.first,x.n),`${x.runN}/${x.passN}`
 ]);
}
function stSpecialGroup(rows,label,fn){
 let a=rows.filter(fn),s=stMetrics(a);
 return {label,n:a.length,ypp:s.ypp,exp:s.expl,neg:s.neg}
}
function setST(key,val){
 if(key==='down')stDownF=val;if(key==='dist')stDistF=val;if(key==='field')stFieldF=val;if(key==='hash')stHashF=val;
 if(key==='rp')stRP=val;if(key==='personnel')stPersonnelF=val;if(key==='front')stFrontF=val;if(key==='coverage')stCoverageF=val;render();
}
function resetST(){stDownF=stDistF=stFieldF=stHashF=stRP=stPersonnelF=stFrontF=stCoverageF='ALL';dndFilter='ALL';render()}

const ST_FIELD_ZONE_ORDER=['Backed Up','Coming Out','Own 26-40','Midfield','+40 to +21','Red Zone','Goal-to-Go'];
function stZoneGeom(name){
 const map={'Backed Up':{left:5,width:8},'Coming Out':{left:13,width:17},'Own 26-40':{left:30,width:15},'Midfield':{left:45,width:15},'+40 to +21':{left:60,width:17},'Red Zone':{left:77,width:13},'Goal-to-Go':{left:90,width:5}};
 return map[name]||{left:45,width:10};
}
function stFieldVisual(fieldB,maxZone){
 let map={};fieldB.forEach(x=>map[x.k]=x);
 let boxes=ST_FIELD_ZONE_ORDER.filter(k=>map[k]).map(k=>{let x=map[k],g=stZoneGeom(k);return `<div class="st-field-zone-box ${x.n===maxZone?'hot':''}" style="left:${g.left}%;width:${g.width}%"><span>${esc(k)}</span><b>${x.n}</b><small>${fmt(x.ypp,1)} YPP<br>${pctText(x.neg,x.n)} Neg<br>${pctText(x.expl,x.n)} Expl</small></div>`}).join('');
 let nums=['10','20','30','40','50','40','30','20','10'];
 let cls=['n10l','n20l','n30l','n40l','n50','n40r','n30r','n20r','n10r'];
 let yardNums=nums.map((n,i)=>`<span class="top ${cls[i]}">${n}</span><span class="bottom ${cls[i]}">${n}</span>`).join('');
 return `<div class="st-field-visual"><div class="st-field-endzone left"></div><div class="st-field-endzone right"></div><div class="st-field-yardlines">${'<i></i>'.repeat(10)}</div><div class="st-field-yardnums">${yardNums}</div><div class="st-field-midline"></div>${boxes}<span class="st-field-label left">OWN GOAL</span><span class="st-field-label mid">50</span><span class="st-field-label right">OPP GOAL</span></div><div class="st-field-note">Zone widths approximate the yard-line ranges represented by the report buckets across the full field.</div>`;
}

function situationsPage(){
 let all=dashboardPlayRows(),rows=stRows(),s=stMetrics(rows);
 let downs=uniqueVals(all,pfDown),dists=uniqueVals(all,rdDistanceBucket),fields=uniqueVals(all,pfFieldZone),hashes=uniqueVals(all,cvHash),
     pers=uniqueVals(all,pfPersonnel),fronts=uniqueVals(all,pfFront),covs=uniqueVals(all,cvFamily);
 let downB=addP10Breakdown(stBreakdown(rows,pfDown),rows,stMetrics),distB=addP10Breakdown(stBreakdown(rows,rdDistanceBucket),rows,stMetrics),fieldB=stBreakdown(rows,pfFieldZone),hashB=stBreakdown(rows,cvHash);
 let specials=[
   stSpecialGroup(rows,'1st & 10',r=>pfDown(r)==='1'&&num(firstField(r,['pff_DISTANCE','DISTANCE','distance']))===10),
   stSpecialGroup(rows,'2nd & 1-3',r=>pfDown(r)==='2'&&num(firstField(r,['pff_DISTANCE','DISTANCE','distance']))<=3),
   stSpecialGroup(rows,'2nd & 7+',r=>pfDown(r)==='2'&&num(firstField(r,['pff_DISTANCE','DISTANCE','distance']))>=7),
   stSpecialGroup(rows,'3rd & 1-3',r=>pfDown(r)==='3'&&num(firstField(r,['pff_DISTANCE','DISTANCE','distance']))<=3),
   stSpecialGroup(rows,'3rd & 4-6',r=>pfDown(r)==='3'&&rdDistanceBucket(r)==='4-6'),
   stSpecialGroup(rows,'3rd & 7+',r=>pfDown(r)==='3'&&num(firstField(r,['pff_DISTANCE','DISTANCE','distance']))>=7),
   stSpecialGroup(rows,'Backed Up',r=>pfFieldZone(r)==='Backed Up'),
   stSpecialGroup(rows,'Coming Out',r=>pfFieldZone(r)==='Coming Out'),
   stSpecialGroup(rows,'Red Zone',r=>/Red Zone/i.test(pfFieldZone(r))),
   stSpecialGroup(rows,'Goal-to-Go',r=>/Goal-to-Go/i.test(pfFieldZone(r)))
 ];
 let maxZone=Math.max(...fieldB.map(x=>x.n),1);
 return `<div class="page-title"><h2>Situations</h2><p>Down, distance, field position and situational defensive performance for offensive game planning.</p></div>
 ${!all.length?`<div class="pf-empty"><b>No charted play data is loaded yet.</b><br>The Situations workspace is built and will populate from the opponent-defense play feed.</div>`:''}
 <div class="st-toolbar">
   <label>Down<select onchange="setST('down',this.value)"><option value="ALL">All Downs</option>${downs.map(v=>`<option ${stDownF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Distance<select onchange="setST('dist',this.value)"><option value="ALL">All Distances</option>${dists.map(v=>`<option ${stDistF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Field Zone<select onchange="setST('field',this.value)"><option value="ALL">All Field Zones</option>${fields.map(v=>`<option ${stFieldF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Hash<select onchange="setST('hash',this.value)"><option value="ALL">All Hashes</option>${hashes.map(v=>`<option ${stHashF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Run / Pass<select onchange="setST('rp',this.value)"><option value="ALL">Run + Pass</option><option ${stRP==='Run'?'selected':''}>Run</option><option ${stRP==='Pass'?'selected':''}>Pass</option></select></label>
   <label>Personnel<select onchange="setST('personnel',this.value)"><option value="ALL">All Personnel</option>${pers.map(v=>`<option ${stPersonnelF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Front<select onchange="setST('front',this.value)"><option value="ALL">All Fronts</option>${fronts.map(v=>`<option ${stFrontF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   <label>Coverage<select onchange="setST('coverage',this.value)"><option value="ALL">All Coverages</option>${covs.map(v=>`<option ${stCoverageF===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
   ${dndSelect()}<div class="st-reset"><button onclick="resetST()">Reset Filters</button></div>
 </div>
 <div class="st-kpis">
   <div class="st-kpi"><span>Plays</span><b>${rows.length||'—'}</b></div>
   <div class="st-kpi"><span>YPP</span><b>${rows.length?fmt(s.ypp,2):'—'}</b></div>
   <div class="st-kpi"><span>Median YPP</span><b>${rows.length?fmt(s.median,1):'—'}</b></div>
   <div class="st-kpi"><span>Explosive %</span><b>${rows.length?pctText(s.expl,s.n):'—'}</b></div>
   <div class="st-kpi"><span>Negative %</span><b>${rows.length?pctText(s.neg,s.n):'—'}</b></div>
   <div class="st-kpi"><span>1st Down %</span><b>${rows.length?pctText(s.first,s.n):'—'}</b></div>
   <div class="st-kpi"><span>Run Plays</span><b>${rows.length?s.runN:'—'}</b></div>
   <div class="st-kpi"><span>Pass Plays</span><b>${rows.length?s.passN:'—'}</b></div>
   <div class="st-kpi"><span>TD</span><b>${rows.length?s.td:'—'}</b></div>
 </div>
 <div class="st-grid">
   <div class="st-section st-span-12">
     <h3>Situation Cards</h3><div class="st-sub">Fast game-plan view of the situations that matter most.</div>
     <div class="st-cards">${specials.map(x=>`<div class="st-card"><span>${esc(x.label)}</span><b>${x.n||'—'}</b><small>${x.n?`${fmt(x.ypp,1)} YPP · ${pctText(x.neg,x.n)} Neg · ${pctText(x.exp,x.n)} Expl`:'No sample'}</small></div>`).join('')}</div>
   </div>
   <div class="st-section st-span-6">
     <h3>By Down</h3><div class="st-sub">Defensive results by down.</div>
     <div class="st-table-wrap">${table(['Down','Plays','Usage','YPP','Median','Expl %','Neg %','1D %','R/P'],stTable(downB,rows.length))}</div>
   </div>
   <div class="st-section st-span-6">
     <h3>By Distance</h3><div class="st-sub">1-2, 3, 4-6, 7-9, 10-12 and 13+.</div>
     <div class="st-table-wrap">${table(['Distance','Plays','Usage','YPP','Median','Expl %','Neg %','1D %','R/P'],stTable(distB,rows.length))}</div>
   </div>
   <div class="st-section st-span-12">
     <h3>Field Zone Field</h3><div class="st-sub">Where the defensive sample is concentrated and how it performs across the actual field.</div>
     ${fieldB.length?stFieldVisual(fieldB,maxZone):'<div class="empty">No field-zone data available.</div>'}
   </div>
   <div class="st-section st-span-6">
     <h3>By Field Zone</h3><div class="st-sub">Efficiency, explosives and negatives by field position.</div>
     <div class="st-table-wrap">${table(['Zone','Plays','Usage','YPP','Median','Expl %','Neg %','1D %','R/P'],stTable(fieldB,rows.length))}</div>
   </div>
   <div class="st-section st-span-6">
     <h3>By Hash</h3><div class="st-sub">How the defense performs from each hash when tagged.</div>
     <div class="st-table-wrap">${table(['Hash','Plays','Usage','YPP','Median','Expl %','Neg %','1D %','R/P'],stTable(hashB,rows.length))}</div>
   </div>
   <div class="st-section st-span-12"><div class="sample-note">Situation labels are derived only from explicit down, distance, field-position and hash data in the charted sample. Missing fields remain unclassified.</div></div>
 </div>`;
}


function prPassRowsBase(){return cvPassRowsBase()}
function prRushCount(r){return pffLeadingCount(firstField(r,['pff_PASSRUSHPLAYERS','pff_NUMBEROFPASSRUSHERS','RUSH_COUNT']))}
function prType(r){
 let blitz=pffBool(firstField(r,['pff_BLITZDOG'])), pressured=nonEmpty(firstField(r,['pff_QBPRESSURE']));
 if(blitz&&pressured)return'Blitz + Pressure'; if(blitz)return'Blitz, No Pressure';
 if(pressured)return'Non-Blitz Pressure'; return'No Blitz / No Pressure';
}
function prFormation(r){return srFormation(r)}
function prPersonnel(r){return pfPersonnel(r)}
function prCoverage(r){return cvFamily(r)}
function prRows(){
 return prPassRowsBase().filter(r=>
   (prTypeF==='ALL'||prType(r)===prTypeF) &&
   (prRushF==='ALL'||prRushCount(r)===prRushF) &&
   (prDownF==='ALL'||pfDown(r)===prDownF) &&
   (prDistF==='ALL'||rdDistanceBucket(r)===prDistF) &&
   (prFieldF==='ALL'||pfFieldZone(r)===prFieldF) &&
   (prHashF==='ALL'||reportHash(r)===prHashF) &&
   (prPersonnelF==='ALL'||prPersonnel(r)===prPersonnelF) &&
   (prFormationF==='ALL'||prFormation(r)===prFormationF) &&
   (prCoverageF==='ALL'||prCoverage(r)===prCoverageF) &&
   dndMatches(r)
 );
}
function prMetrics(rows){
 let gains=rows.map(r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained'])));
 let att=0,comp=0,sacks=0,ints=0,td=0,exp=0,neg=0,scr=0,tttRows=[];
 rows.forEach(r=>{
   let g=num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained']));if(g>=15)exp++;if(g<=0)neg++;
   let result=String(firstField(r,['pff_PASSRESULT','PASSRESULT','pass_result'])||'').toUpperCase();
   if(['COMPLETE','INCOMPLETE','INTERCEPTION','THROWN AWAY','HIT AS THREW','BATTED PASS'].includes(result))att++;
   if(result==='COMPLETE')comp++;
   if(result==='SACK'||nonEmpty(firstField(r,['pff_SACK'])))sacks++;
   if(result==='INTERCEPTION'||nonEmpty(firstField(r,['pff_INTERCEPTION'])))ints++;
   if(nonEmpty(firstField(r,['pff_TOUCHDOWN'])))td++;
   if(nonEmpty(firstField(r,['pff_QBSCRAMBLE'])))scr++;
   if(nonEmpty(firstField(r,['pff_TIMETOTHROW','TTT','time_to_throw'])))tttRows.push(r);
 });
 const gain=r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained'])),ttt=r=>num(firstField(r,['pff_TIMETOTHROW','TTT','time_to_throw']));
 return {n:rows.length,ypp:rows.length?balancedAvgRows(rows,gain):0,med:rows.length?balancedMedianRows(rows,gain):0,att,comp,sacks,ints,td,exp,neg,scr,ttt:tttRows.length?balancedAvgRows(tttRows,ttt):0};
}
function prBreakdown(rows,fn){
 let m={};rows.forEach(r=>{let k=fn(r)||'Unknown';(m[k] ||= []).push(r)});
 return Object.entries(m).map(([k,a])=>({k,...prMetrics(a)})).sort((a,b)=>b.n-a.n);
}
function prTable(arr,total){
 return arr.map(x=>[esc(x.k),x.n,pctText(x.n,total),fmt(x.ypp,2),fmt(x.med,1),x.att?pctText(x.comp,x.att):'—',x.sacks,pctText(x.exp,x.n),pctText(x.neg,x.n)]);
}
function prComboRows(rows){
 let m={};
 rows.forEach(r=>{
   let t=prType(r)||'Unknown',rush=prRushCount(r)||'Unknown',cov=prCoverage(r)||'Unknown';
   let k=t+'||'+rush+'||'+cov;(m[k] ||= []).push(r);
 });
 return Object.entries(m).map(([k,a])=>{let [type,rush,cov]=k.split('||');return {type,rush,cov,...prMetrics(a)}}).sort((a,b)=>b.n-a.n).slice(0,14);
}
function setPR(key,val){
 if(key==='type')prTypeF=val;if(key==='rush')prRushF=val;if(key==='down')prDownF=val;if(key==='dist')prDistF=val;
 if(key==='field')prFieldF=val;if(key==='hash')prHashF=val;if(key==='personnel')prPersonnelF=val;if(key==='formation')prFormationF=val;if(key==='coverage')prCoverageF=val;render();
}
function resetPR(){prTypeF=prRushF=prDownF=prDistF=prFieldF=prPersonnelF=prFormationF=prCoverageF=prHashF='ALL';dndFilter='ALL';render()}



function blitzRushers(r){
 let raw=String(firstField(r,['pff_PASSRUSHPLAYERS'])||'').trim();
 if(!raw)return[];
 let parts=raw.split(';').map(x=>x.trim());
 if(parts.length&&/^\d+$/.test(parts[0]))parts.shift();
 return parts.map(x=>{
   let m=x.match(new RegExp(defenseTeamCode()+' D(\\d{2}) \\(([^)]+)\\)'));
   return m?{num:m[1],role:m[2]}:null;
 }).filter(Boolean);
}
function blitzIsFrontRole(role){
 let s=String(role||'').toUpperCase();
 return /^(DLT|DRT|NT|NLT|NRT|LE|RE|LEO|REO|DE|DT)$/.test(s);
}
function blitzRoleGroup(role){
 let s=String(role||'').toUpperCase();
 if(/SCB|CB/.test(s))return'DB';
 if(/SS|FS|SAF/.test(s))return'Safety';
 if(/ILB|MLB|LLB|RLB/.test(s))return'ILB';
 if(/OLB/.test(s))return'OLB';
 if(/LEO|REO|LE|RE/.test(s))return'Edge';
 if(/DLT|DRT|NT|NLT|NRT|DT|DL/.test(s))return'DL';
 return'Other';
}
function blitzPlayerName(num){
 let r=(datasets.playerIntel||[]).find(x=>String(x['#']||'').padStart(2,'0')===String(num).padStart(2,'0'));
 return r?.Name||`#${num}`;
}
function blitzRowsBase(){
 return prPassRowsBase().filter(r=>pffBool(firstField(r,['pff_BLITZDOG']))&&blitzRushers(r).length);
}
function blitzFilteredRows(baseRows){
 let rows=(baseRows||prRows());
 return rows.filter(r=>pffBool(firstField(r,['pff_BLITZDOG']))&&blitzRushers(r).length);
}
function blitzSpecialRushers(r){return blitzRushers(r).filter(x=>!blitzIsFrontRole(x.role))}
function blitzPressurePlayers(r){
 let raw=String(firstField(r,['pff_QBPRESSURE'])||'');
 return new Set([...raw.matchAll(new RegExp(defenseTeamCode()+' D(\\d{2})','g'))].map(m=>m[1]));
}
function blitzSackPlayers(r){
 let raw=String(firstField(r,['pff_SACK'])||'');
 return new Set([...raw.matchAll(new RegExp(defenseTeamCode()+' D(\\d{2})','g'))].map(m=>m[1]));
}
function blitzPlayMetrics(rows){
 let gains=rows.map(r=>num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN'])));
 let press=rows.filter(r=>nonEmpty(firstField(r,['pff_QBPRESSURE']))).length;
 let sacks=rows.filter(r=>nonEmpty(firstField(r,['pff_SACK']))).length;
 let exp=gains.filter(x=>x>=15).length,neg=gains.filter(x=>x<=0).length;
 let att=0,comp=0;
 rows.forEach(r=>{
   let result=String(firstField(r,['pff_PASSRESULT','PASSRESULT','pass_result'])||'').toUpperCase();
   if(['COMPLETE','INCOMPLETE','INTERCEPTION','THROWN AWAY','HIT AS THREW','BATTED PASS'].includes(result))att++;
   if(result==='COMPLETE')comp++;
 });
 return {n:rows.length,ypp:rows.length?avg(gains):0,med:rows.length?calcMedian(gains):0,press,sacks,exp,neg,att,comp};
}
function blitzPlayerRows(rows){
 let map={};
 rows.forEach(r=>{
   blitzSpecialRushers(r).forEach(x=>{
     if(!map[x.num])map[x.num]={num:x.num,name:blitzPlayerName(x.num),roles:{},rows:[],playerPress:0,playerSacks:0};
     map[x.num].rows.push(r);map[x.num].roles[x.role]=(map[x.num].roles[x.role]||0)+1;
     if(blitzPressurePlayers(r).has(x.num))map[x.num].playerPress++;
     if(blitzSackPlayers(r).has(x.num))map[x.num].playerSacks++;
   });
 });
 return Object.values(map).map(x=>{
   let m=blitzPlayMetrics(x.rows),role=Object.entries(x.roles).sort((a,b)=>b[1]-a[1])[0]?.[0]||'';
   return {...x,role,...m};
 }).sort((a,b)=>b.n-a.n);
}
function blitzComboRows(rows){
 let map={};
 rows.forEach(r=>{
   let arr=blitzSpecialRushers(r);
   let names=arr.map(x=>`${blitzPlayerName(x.num)} (#${x.num}, ${x.role})`).sort();
   let key=names.length?names.join(' + '):'No second-level/DB rusher identified';
   (map[key] ||= []).push(r);
 });
 return Object.entries(map).map(([k,a])=>({k,...blitzPlayMetrics(a)})).sort((a,b)=>b.n-a.n);
}
function blitzPositionCombos(rows){
 let map={};
 rows.forEach(r=>{
   let groups=blitzSpecialRushers(r).map(x=>blitzRoleGroup(x.role)).sort();
   let key=groups.length?groups.join(' + '):'Front only';
   (map[key] ||= []).push(r);
 });
 return Object.entries(map).map(([k,a])=>({k,...blitzPlayMetrics(a)})).sort((a,b)=>b.n-a.n);
}


function blitzRoleSide(role){
 let s=String(role||'').toUpperCase();
 if(/^(LCB|SCBL|SCBOL|SCBIL|LOLB|LILB|LEO|LE|NLT|DLT)$/.test(s))return'LEFT';
 if(/^(RCB|SCBR|SCBOR|SCBIR|ROLB|RILB|REO|RE|DRT|NRT)$/.test(s))return'RIGHT';
 return'MID';
}
function blitzHashMap(hash){
 let h=String(hash||'').trim().toUpperCase();
 if(h==='L')return{left:'BOUNDARY',right:'FIELD',hash:'L'};
 if(h==='R')return{left:'FIELD',right:'BOUNDARY',hash:'R'};
 return{left:'LEFT',right:'RIGHT',hash:'C'};
}
const BLITZ_SLOT_META={
 'FC':{label:'FC',title:'Field Corner',x:8,y:16},
 'NICKEL':{label:'N',title:'Nickel / Star',x:27,y:22},
 'FS':{label:'FS',title:'Free Safety',x:43,y:10},
 'SS':{label:'SS',title:'Strong Safety',x:59,y:10},
 'BC':{label:'BC',title:'Boundary Corner',x:92,y:16},
 'SAM':{label:'SAM',title:'Sam · Field / Strong',x:30,y:42},
 'MIKE':{label:'MIKE',title:'Mike',x:50,y:38},
 'WILL':{label:'WILL',title:'Will · Boundary / Weak',x:70,y:42},
 'FDE':{label:'DE',title:'Field End',x:24,y:67},
 'NOSE':{label:'N',title:'Nose',x:50,y:69},
 'BDE':{label:'DE',title:'Boundary End',x:76,y:67}
};
const BLITZ_SLOT_ORDER=['FC','NICKEL','FS','SS','BC','SAM','MIKE','WILL','FDE','NOSE','BDE'];
function blitzRoleSlot(role,hash){
 let s=String(role||'').toUpperCase(),side=blitzRoleSide(s),hm=blitzHashMap(hash);
 const wide=side==='LEFT'?hm.left:side==='RIGHT'?hm.right:'';
 if(s==='LCB'||s==='RCB'){
   if(wide==='FIELD')return'FC';
   if(wide==='BOUNDARY')return'BC';
   return side==='LEFT'?'FC':'BC';
 }
 if(/^(SCBL|SCBOL|SCBIL|SCBR|SCBOR|SCBIR)$/.test(s))return'NICKEL';
 if(s==='FS')return'FS';
 if(s==='SS')return'SS';
 if(s==='MLB')return'MIKE';
 if(/^(LOLB|ROLB|LILB|RILB|LLB|RLB)$/.test(s)){
   if(wide==='FIELD')return'SAM';
   if(wide==='BOUNDARY')return'WILL';
   return side==='LEFT'?'SAM':'WILL';
 }
 if(/^(LEO|LE|NLT|DLT)$/.test(s)){
   if(wide==='FIELD')return'FDE';
   if(wide==='BOUNDARY')return'BDE';
   return side==='LEFT'?'FDE':'BDE';
 }
 if(/^(REO|RE|DRT|NRT)$/.test(s)){
   if(wide==='FIELD')return'FDE';
   if(wide==='BOUNDARY')return'BDE';
   return side==='RIGHT'?'BDE':'FDE';
 }
 if(s==='NT')return'NOSE';
 return'OTHER';
}
function blitzSlotSummaries(rows){
 let map={};
 BLITZ_SLOT_ORDER.forEach(slot=>map[slot]={slot,rows:[],roles:{},players:{},pressure:0,sacks:0,att:0,comp:0,exp:0,neg:0,gains:[]});
 rows.forEach(r=>{
   let gain=num(firstField(r,['pff_GAINLOSSNET','pff_GAINLOSS','GAIN','yards_gained'])),result=String(firstField(r,['pff_PASSRESULT','PASSRESULT','pass_result'])||'').toUpperCase();
   let pressSet=new Set([...String(firstField(r,['pff_QBPRESSURE'])||'').matchAll(new RegExp(defenseTeamCode()+' D(\\d{2})','g'))].map(m=>m[1]));
   let sackSet=new Set([...String(firstField(r,['pff_SACK'])||'').matchAll(new RegExp(defenseTeamCode()+' D(\\d{2})','g'))].map(m=>m[1]));
   let att=['COMPLETE','INCOMPLETE','INTERCEPTION','THROWN AWAY','HIT AS THREW','BATTED PASS'].includes(result)?1:0,comp=result==='COMPLETE'?1:0;
   let pressurePlay=nonEmpty(firstField(r,['pff_QBPRESSURE']))?1:0,sackPlay=(result==='SACK'||nonEmpty(firstField(r,['pff_SACK'])))?1:0;
   let hash=cvHash(r);
   let seen=new Set();
   blitzSpecialRushers(r).forEach(x=>{
     let slot=blitzRoleSlot(x.role,hash); if(!map[slot])return;
     let rec=map[slot],p=(rec.players[x.num] ||= {num:x.num,name:blitzPlayerName(x.num),n:0,pressure:0,sacks:0,roles:{}});
     p.n++;p.roles[x.role]=(p.roles[x.role]||0)+1;if(pressSet.has(x.num))p.pressure++;if(sackSet.has(x.num))p.sacks++;
     rec.roles[x.role]=(rec.roles[x.role]||0)+1;
     if(!seen.has(slot)){
       seen.add(slot);rec.rows.push(r);rec.gains.push(gain);if(gain>=15)rec.exp++;if(gain<=0)rec.neg++;if(pressurePlay)rec.pressure++;if(sackPlay)rec.sacks++;if(att)rec.att++;if(comp)rec.comp++;
     }
   });
 });
 return BLITZ_SLOT_ORDER.map(slot=>{
   let rec=map[slot],topPlayer=Object.values(rec.players).sort((a,b)=>b.n-a.n)[0]||null,topRole=Object.entries(rec.roles).sort((a,b)=>b[1]-a[1])[0]?.[0]||'';
   return {...rec,calls:rec.rows.length,ypp:rec.rows.length?avg(rec.gains):0,med:rec.rows.length?calcMedian(rec.gains):0,topPlayer,topRole};
 });
}

function blitzArrowHTML(meta){
 let top=meta.y+4,h=Math.max(7,76-top);
 return `<div class="blitz-arrow-clean" style="left:${meta.x}%;top:${top}%;height:${h}%"></div>`;
}

function blitzFieldHTML(slotRows,totalBlitzPlays){
 let bySlot={};slotRows.forEach(x=>bySlot[x.slot]=x);
 return `<div class="blitz-align-wrap clean">
   <div class="blitz-field-header"><h3>Blitz Alignment</h3><div class="sub">11-man 3-3-5 coaching view. Every PFF role is rolled into one of 11 defensive spots after field / boundary is resolved by hash. Gold = actual blitz origin in the filtered sample.</div></div>
   <div class="blitz-align-field clean">
     <div class="blitz-row-label secondary">SECONDARY</div>
     <div class="blitz-row-label lbs">LINEBACKERS</div>
     <div class="blitz-row-label front">FRONT</div>
     <div class="blitz-los-line"></div><div class="blitz-los-pill">LINE OF SCRIMMAGE</div>
     <div class="blitz-side blitz-side-left">FIELD / STRONG</div><div class="blitz-side blitz-side-right">BOUNDARY / WEAK</div>
     ${BLITZ_SLOT_ORDER.map(slot=>{
       let meta=BLITZ_SLOT_META[slot],s=bySlot[slot]||{calls:0},active=s.calls>0;
       let p=s.topPlayer?`${esc(s.topPlayer.name)} (#${s.topPlayer.num})`:'Base alignment';
       let share=active?pctText(s.calls,totalBlitzPlays):'';
       return `${active?blitzArrowHTML(meta):''}<div class="blitz-dot ${active?'active':'inactive'}" style="left:${meta.x}%;top:${meta.y}%" title="${esc(meta.title)}">
         <div class="bd-role">${esc(meta.label)}</div>
         <div class="bd-num">${active?s.calls:''}</div>
         <div class="bd-name">${esc(p)}</div>
         <div class="bd-share">${share}</div>
       </div>`;
     }).join('')}
   </div>
   <div class="blitz-field-key"><span><i class="key-dot base"></i> Base defensive spot</span><span><i class="key-dot hot"></i> Blitz origin</span><span>Exactly 11 defenders · counts = blitz calls from that coaching spot</span></div>
 </div>`;
}

