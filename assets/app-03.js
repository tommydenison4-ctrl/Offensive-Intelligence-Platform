function topGamesPanel(p){
 let all=relevantGameRows(p),games=[...all].sort((a,b)=>gameScore(p,b)-gameScore(p,a)).slice(0,3),pos=normPos(p.position);
 if(!games.length)return `${weeklyProductionChart(p)}<div class="card"><div class="empty">No game-by-game PFF plays matched ${esc(p.name)}.</div></div>`;
 return `${weeklyProductionChart(p)}<div class="card"><div class="section-head"><div><h3>Top 3 Performances</h3><small>Best three games from the matched 2025 Mississippi State sample.</small></div></div><div class="top-games">${games.map((g,i)=>`<div class="top-game"><div class="rank">#${i+1}</div><h4>vs ${esc(g.opp||'Opponent')}</h4><div class="subtle">${esc(g.date||'Game')}</div><div class="big">${pos==='QB'?`${g.passY+g.rushY} yds`:pos==='OL'?`${g.plays} snaps`:`${g.rushY+g.recY} yds`}</div><div class="line">${pos==='QB'?`${g.comp}/${g.att} · ${g.passY} pass · ${g.rushY} rush · ${g.passTD} TD · ${g.int} INT`:pos==='RB'?`${g.rush} rush · ${g.rushY} rush yds · ${g.rec}/${g.tgt} rec · ${g.recY} rec yds · ${g.td} TD`:['WR','TE'].includes(pos)?`${g.rec}/${g.tgt} rec · ${g.recY} yds · ${g.td} TD · ${g.expl} explosives`:`${g.plays} linked offensive snaps`}</div></div>`).join('')}</div></div>`;
}


const ROUTE_SHAPES={};
function canonicalRouteName(name, raw=''){
 let s=String(name||'').trim(), rawU=String(raw||'').trim().toUpperCase();
 if(!s){
   const fallback={
     '6R':'Hitch','9S':'Slant','9R':'Go','0R':'Out','OR':'Out','1R':'Flat','2R':'Slant','3R':'In',
     '4R':'Out','5R':'Comeback','6':'Hitch','7':'Corner','8':'Post','9':'Go','XR':'Go','SA':'Angle','GL':'Glance','H7':'Seam'
   };
   s=fallback[rawU]||'';
 }
 let u=s.toUpperCase().replace(/\s*ROUTE$/,'').replace(/\s+/g,' ').trim();
 if(!u || ['UNKNOWN','N/A','NA','OTHER'].includes(u)) return '';
 const groups=[
   [/SLUGGO|STUTTER|HITCH\s*&\s*GO|HITCH AND GO|OUT\s*&\s*UP|OUT AND UP|POST-GO|OUT-POST|CORNER-POST|SLUGGO SEAM/, 'Double Move'],
   [/WR SCREEN|RB SCREEN|BACKFIELD SCREEN|SCREEN/, 'Screen'],
   [/BUBBLE|NOW SCREEN|SMOKE/, 'Bubble'],
   [/JET/, 'Jet'],
   [/FLAT-HITCH/, 'Flat-Hitch'],
   [/BACKFIELD FLARE|FLARE|FLAT/, 'Flat'],
   [/PIVOT|WHIP/, 'Pivot'],
   [/ANGLE|TEXAS/, 'Angle'],
   [/WHEEL/, 'Wheel'],
   [/SEAM/, 'Seam'],
   [/GLANCE/, 'Glance'],
   [/SLANT/, 'Slant'],
   [/HITCH/, 'Hitch'],
   [/SKINNY POST|POST/, 'Post'],
   [/CORNER/, 'Corner'],
   [/COMEBACK/, 'Comeback'],
   [/^OUT$|OUT ROUTE|BACKFIELD OUT/, 'Out'],
   [/^IN$|IN ROUTE/, 'In'],
   [/CROSSING|CROSS ROUTE|CROSS/, 'Cross'],
   [/OVER/, 'Over'],
   [/UNDER|DRAG/, 'Under'],
   [/GO|FADE|VERTICAL|NUMBERS GO/, 'Go'],
   [/SIT|BEHIND LB|GHOST|BLOCK RUN THROUGH|SPOT/, 'Sit'],
   [/SCRAMBLE ADJUSTMENT|SCRAMBLE DRILL/, 'Scramble Drill']
 ];
 for(const [pat,label] of groups){if(pat.test(u)) return label;}
 return s;
}
function routeFamily(name){
 let s=String(name||'').toUpperCase();
 if(/DOUBLE MOVE/.test(s)) return 'Double Move';
 if(/SCREEN/.test(s)) return 'Screen';
 if(/BUBBLE/.test(s)) return 'Bubble';
 if(/JET/.test(s)) return 'Jet';
 if(/FLAT-HITCH/.test(s)) return 'Flat-Hitch';
 if(/FLAT/.test(s)) return 'Flat';
 if(/ANGLE/.test(s)) return 'Angle';
 if(/WHEEL/.test(s)) return 'Wheel';
 if(/PIVOT/.test(s)) return 'Pivot';
 if(/SEAM/.test(s)) return 'Seam';
 if(/SLANT/.test(s)) return 'Slant';
 if(/HITCH/.test(s)) return 'Hitch';
 if(/POST/.test(s)) return 'Post';
 if(/CORNER/.test(s)) return 'Corner';
 if(/COMEBACK/.test(s)) return 'Comeback';
 if(/^OUT$/.test(s)) return 'Out';
 if(/^IN$/.test(s)) return 'In';
 if(/CROSS/.test(s)) return 'Cross';
 if(/OVER/.test(s)) return 'Over';
 if(/UNDER/.test(s)) return 'Under';
 if(/GO/.test(s)) return 'Go';
 if(/SIT/.test(s)) return 'Sit';
 if(/GLANCE/.test(s)) return 'Glance';
 if(/SCRAMBLE/.test(s)) return 'Scramble Drill';
 return 'Go';
}
function depthToY(depth){
 let d=Math.max(-5,Math.min(22,num(depth)));
 return 450 - ((d+5)/27)*300;
}
function routePathFor(family, depth){
 let by=depthToY(depth), x=168, qbX=326;
 if(family==='Go' || family==='Seam') return `M${x} 450 L${x} 80`;
 if(family==='Hitch') return `M${x} 450 L${x} ${by} C ${x} ${by+12} ${x+34} ${by+12} ${x+44} ${by+38}`;
 if(family==='Slant') return `M${x} 450 L${x} ${by+28} L ${x+92} ${by}`;
 if(family==='Post') return `M${x} 450 L${x} ${by+34} L ${x+102} ${Math.max(90,by-58)}`;
 if(family==='Corner') return `M${x} 450 L${x} ${by+34} L ${x-96} ${Math.max(90,by-58)}`;
 if(family==='Comeback') return `M${x} 450 L${x} ${by-18} C ${x} ${by-2} ${x-48} ${by+8} ${x-58} ${by+30}`;
 if(family==='Out') return `M${x} 450 L${x} ${by} L ${x-98} ${by}`;
 if(family==='In') return `M${x} 450 L${x} ${by} L ${x+98} ${by}`;
 if(family==='Cross') return `M${x-92} 410 C ${x-42} 380 ${x+30} 324 ${x+118} ${by}`;
 if(family==='Over') return `M${x-98} 405 C ${x-30} 356 ${x+38} 298 ${x+122} ${by}`;
 if(family==='Under') return `M${x-98} 410 C ${x-30} 400 ${x+38} 360 ${x+122} ${by+58}`;
 if(family==='Flat') return `M${x} 450 Q ${x-30} 420 ${x-112} 396`;
 if(family==='Flat-Hitch') return `M${x} 450 Q ${x-32} 420 ${x-110} 398 L ${x-110} 332 C ${x-110} 344 ${x-84} 346 ${x-88} 370`;
 if(family==='Bubble') return `M${x} 450 C ${x-20} 440 ${x-62} 438 ${x-108} 430 S ${x-148} 384 ${x-166} 326`;
 if(family==='Screen') return `M${x} 450 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0`;
 if(family==='Jet') return `M${x} 450 Q ${x-38} 420 ${x-118} 392`;
 if(family==='Angle') return `M${x-38} 432 L ${x-12} 378 L ${x+62} ${by+40}`;
 if(family==='Wheel') return `M${x} 450 Q ${x-42} 420 ${x-112} 392 L ${x-112} ${Math.max(94,by-95)}`;
 if(family==='Pivot') return `M${x} 450 L ${x} ${by+38} Q ${x-36} ${by+16} ${x-50} ${by} Q ${x-32} ${by-10} ${x-6} ${by-2}`;
 if(family==='Sit') return `M${x} 450 L ${x} ${by+18}`;
 if(family==='Glance') return `M${x} 450 L ${x} ${by+28} L ${x+52} ${by}`;
 if(family==='Double Move') return `M${x} 450 L ${x} ${by+52} Q ${x} ${by+24} ${x-22} ${by+32} Q ${x+8} ${by+6} ${x+84} ${Math.max(92,by-74)}`;
 if(family==='Scramble Drill') return `M${x} 450 C ${x-12} 392 ${x+52} 296 ${x+104} ${by}`;
 return `M${x} 450 L${x} 80`;
}
function playerTargetRoutes(p){
 let pos=normPos(p.position),g={};
 let rows=(datasets.plays||[]).filter(r=>{
   if(pos==='QB') return playerTokenMatch(r.pff_PASSER,p,'QB')&&String(r.pff_RUNPASS||'').toUpperCase()==='P';
   if(['WR','TE','RB'].includes(pos)) return playerTokenMatch(r.pff_PASSRECEIVERTARGET,p,'TARGET');
   return false;
 });
 rows.forEach(r=>{
   let rawTag=String(r.pff_PASSROUTETARGETGROUP||r.pff_PASSROUTETARGET||'').trim();
   let name=canonicalRouteName(r.pff_ROUTE_THROWN, rawTag);
   if(!name) return;
   let family=routeFamily(name),
       x=g[name]||(g[name]={route:name,family:family,tgt:0,rec:0,yds:0,td:0,expl:0,neg:0,rawTags:new Set(),depths:[],breaks:[]});
   x.tgt++;
   if(nonEmpty(rawTag)) x.rawTags.add(rawTag);
   let gain=num(r.pff_GAINLOSSNET||r.pff_GAINLOSS),res=String(r.pff_PASSRESULT||'').toUpperCase(),depth=num(r.pff_PASSDEPTH);
   if(!isNaN(depth)) {x.depths.push(depth); if(depth>=0) x.breaks.push(depth)}
   if(res==='COMPLETE'){x.rec++;x.yds+=gain}
   if(gain>=15) x.expl++;
   if(gain<=0) x.neg++;
   if(isPassTouchdown(r)) x.td++;
  });
 return Object.values(g).map(x=>({...x,rawText:[...x.rawTags].filter(Boolean).join(', '),avgDepth:avg(x.depths),breakDepth:avg(x.breaks)})).sort((a,b)=>b.tgt-a.tgt||b.yds-a.yds);
}
function routeTableHTML(rs,focus){
 return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Route</th><th>Targets</th><th>Rec</th><th>Catch %</th><th>Avg Depth</th><th>Yards</th><th>Yds/Tgt</th><th>TD</th><th>Expl</th><th>Neg</th></tr></thead><tbody>${
   rs.map(r=>`<tr onclick='setRouteFocus(${JSON.stringify(r.route)})' style="cursor:pointer;${focus&&focus.route===r.route?'background:#f8f2e8;':''}">
     <td>${esc(r.route)}</td><td>${r.tgt}</td><td>${r.rec}</td><td>${pct(100*r.rec/Math.max(1,r.tgt))}</td><td>${fmt(r.avgDepth,1)}</td><td>${r.yds}</td><td>${fmt(r.yds/Math.max(1,r.tgt),1)}</td><td>${r.td}</td><td>${freqMode==='raw'?r.expl:pct(100*r.expl/Math.max(1,r.tgt))}</td><td>${freqMode==='raw'?r.neg:pct(100*r.neg/Math.max(1,r.tgt))}</td>
   </tr>`).join('')
 }</tbody></table></div>`;
}
function routeTreePanel(p){
 let pos=normPos(p.position),rs=playerTargetRoutes(p);
 if(!['QB','WR','TE','RB'].includes(pos)) return `<div class="card"><h3>Route Dashboard</h3><div class="empty">Route view applies to quarterbacks and skill players.</div></div>`;
 if(!rs.length) return `<div class="card"><h3>Route Dashboard</h3><div class="empty">No targeted route tags matched this player in the current play feed.</div></div>`;
 let focus=routeFocus==='ALL'?rs[0]:(rs.find(x=>x.route===routeFocus)||rs[0]);
 let breakDepth=isNaN(focus.breakDepth)?focus.avgDepth:focus.breakDepth;
 let breakY=depthToY(breakDepth), path=routePathFor(focus.family,breakDepth);
 let pills=`<div class="route-pill-wrap"><button class="${routeFocus==='ALL'?'primary':''}" onclick="setRouteFocus('ALL')">Top Route View</button>`+
   rs.map(r=>`<button class="${focus.route===r.route?'primary':''}" onclick='setRouteFocus(${JSON.stringify(r.route)})'>${esc(r.route)} (${r.tgt})</button>`).join('')+`</div>`;
 return `<div class="route-dashboard-v6">
   <div class="section-head"><div><h3>Route Dashboard</h3></div>${freqToggle()}</div>
   <div class="heat-controls">${pills}</div>
   <div class="route-stage-v6">
     <div class="route-tree-panel-v6">
       <svg class="route-tree-svg-v6" viewBox="0 0 360 500">
         <line x1="25" y1="450" x2="326" y2="450" stroke="#98a2b3" stroke-width="2"/>
         <line x1="168" y1="60" x2="168" y2="450" stroke="#eef1f4" stroke-width="2"/>
         <line x1="36" y1="${breakY}" x2="324" y2="${breakY}" stroke="#d0d5dd" stroke-dasharray="5 5" stroke-width="1.5"/>
         <text x="40" y="${breakY-6}" font-size="10" fill="#667085">~${fmt(breakDepth,1)} yds</text>
         <circle cx="168" cy="456" r="6" fill="#8A2432"/>
         <circle cx="326" cy="472" r="16" fill="#0f172a"/>
         <text x="326" y="476" text-anchor="middle" font-size="10" font-weight="900" fill="#fff">QB</text>
         <path d="${path}" onclick='setRouteFocus(${JSON.stringify(focus.route)})' style="cursor:pointer"/>
         <rect class="route-label-box" x="100" y="92" width="160" height="46" rx="8" onclick='setRouteFocus(${JSON.stringify(focus.route)})' style="cursor:pointer"/>
         <text x="180" y="110" text-anchor="middle" font-size="13" font-weight="800">${esc(focus.route)}</text>
         <text x="180" y="124" text-anchor="middle" font-size="9" fill="#667085">${focus.tgt} tgt · ${focus.rec} rec · ${fmt(focus.avgDepth,1)} avg depth</text>
         <text x="180" y="490" text-anchor="middle" font-size="10" fill="#667085">LINE OF SCRIMMAGE</text>
       </svg>
     </div>
     <div class="route-detail-v6">
       <h3>${esc(focus.route)}</h3>
       <div class="subtle">${focus.rawText?`PFF tag(s): ${esc(focus.rawText)}`:'Generic route view'}</div>
       <div class="route-detail-grid-v6">
         <div class="route-detail-stat-v6"><small>Targets</small><b>${focus.tgt}</b></div>
         <div class="route-detail-stat-v6"><small>Receptions</small><b>${focus.rec}</b></div>
         <div class="route-detail-stat-v6"><small>Catch %</small><b>${pct(100*focus.rec/Math.max(1,focus.tgt))}</b></div>
         <div class="route-detail-stat-v6"><small>Yards</small><b>${focus.yds}</b></div>
         <div class="route-detail-stat-v6"><small>Yards / Target</small><b>${fmt(focus.yds/Math.max(1,focus.tgt),1)}</b></div>
         <div class="route-detail-stat-v6"><small>TD</small><b>${focus.td}</b></div>
         <div class="route-detail-stat-v6"><small>Explosive</small><b>${freqMode==='raw'?focus.expl:pct(100*focus.expl/Math.max(1,focus.tgt))}</b></div>
         <div class="route-detail-stat-v6"><small>Negative</small><b>${freqMode==='raw'?focus.neg:pct(100*focus.neg/Math.max(1,focus.tgt))}</b></div>
         <div class="route-detail-stat-v6"><small>Avg Depth</small><b>${fmt(focus.avgDepth,1)}</b></div>
         <div class="route-detail-stat-v6"><small>Break Depth</small><b>${fmt(breakDepth,1)}</b></div>
       </div>
     </div>
   </div>
   <div class="route-table-wrap" style="margin-top:14px">${routeTableHTML(rs,focus)}</div>
 </div>`;
}
function targetsPanel(p){
 let rows=(datasets.plays||[]).filter(r=>playerTokenMatch(r.pff_PASSRECEIVERTARGET,p,'TARGET'));
 if(!rows.length) return `<div class="card"><h3>Targets</h3><div class="empty">No target locations matched.</div></div>`;
 let cells=Array.from({length:25},()=>({n:0,comp:0,y:0,td:0,expl:0}));
 rows.forEach(r=>{let [rr,cc]=heatBin(r),c=cells[rr*5+cc],res=String(r.pff_PASSRESULT||'').toUpperCase(),g=num(r.pff_GAINLOSSNET||r.pff_GAINLOSS);c.n++;if(res==='COMPLETE')c.comp++;c.y+=g;if(isPassTouchdown(r))c.td++;if(g>=15)c.expl++;});
 let total=cells.reduce((s,c)=>s+c.n,0),max=Math.max(1,...cells.map(c=>c.n));
 let comp=rows.filter(r=>String(r.pff_PASSRESULT||'').toUpperCase()==='COMPLETE').length;
 let gains=rows.map(r=>num(r.pff_GAINLOSSNET||r.pff_GAINLOSS));
 let labels=['Behind LOS','0–9','10–19','20+'];
 let qbLeft=qbLeftFromRows(rows);
 return `<div class="card">
   <div class="section-head"><div><h3>Targets</h3><small>Receiver target heat map by depth and width. Each square shows where this player is targeted most often.</small></div>${freqToggle()}</div>
   <div class="heat-summary">${metric('Targets',rows.length)}${metric('Catches',comp)}${metric('Catch %',pct(100*comp/Math.max(1,rows.length)))}${metric('Yards',gains.reduce((a,b)=>a+b,0))}${metric('YPP',fmt(avg(gains),2))}${metric(freqMode==='raw'?'Explosives':'Explosive %',freqMode==='raw'?gains.filter(x=>x>=15).length:pct(100*gains.filter(x=>x>=15).length/Math.max(1,rows.length)))}${metric('TD',rows.filter(isPassTouchdown).length)}</div>
   <div class="heat-field">
     <div class="heat-los">
       <div class="heat-los-label">LOS</div>
       <div class="heat-qb-marker" style="left:${qbLeft}">QB</div>
     </div>
     <div class="heat-grid">${cells.map((c,i)=>{let p=100*c.n/Math.max(1,total),op=.08+.82*(c.n/max);return `<div class="heat-cell ${c.n?'':'zero'}" style="background:rgba(138,36,50,${op.toFixed(2)})"><b>${freqMode==='raw'?c.n:fmt(p,1)+'%'}</b><span>${labels[Math.floor(i/5)]} · ${sideLabel(i%5)}</span><small>${c.comp} catches · ${c.y} yds</small></div>`}).join('')}</div>
   </div>
   <div class="heat-axis"><span>DEF LEFT</span><span>DEFENSIVE VIEW</span><span>DEF RIGHT</span></div>
 </div>`;
}
function coveragePlayerPanel(p,manZoneOnly=false){
 let pos=normPos(p.position),rows=(datasets.plays||[]).filter(r=>{if(r.pff_RUNPASS!=='P')return false;if(pos==='QB')return playerTokenMatch(r.pff_PASSER,p,'QB');if(['WR','TE','RB'].includes(pos))return playerTokenMatch(r.pff_PASSRECEIVERTARGET,p,'TARGET');return false}),g={};
 rows.forEach(r=>{let raw=r.pff_PASS_COVERAGE_BASIC||'Unknown',k=manZoneOnly?(isManCov(raw)?'MAN':'ZONE'):raw,x=g[k]||(g[k]={n:0,att:0,comp:0,y:0,td:0,int:0,expl:0});x.n++;let res=String(r.pff_PASSRESULT||'').toUpperCase(),gain=num(r.pff_GAINLOSSNET||r.pff_GAINLOSS);if(['COMPLETE','INCOMPLETE','INTERCEPTION','THROWN AWAY','HIT AS THREW','BATTED PASS'].includes(res))x.att++;if(res==='COMPLETE')x.comp++;if(isInterception(r))x.int++;x.y+=gain;if(gain>=15)x.expl++;if(isPassTouchdown(r))x.td++});
 return `<div class="card"><h3>${manZoneOnly?'Man / Zone':'Vs Coverage'}</h3><div class="coverage-grid-v6">${Object.entries(g).sort((a,b)=>b[1].n-a[1].n).map(([k,x])=>`<div class="coverage-card-v6"><h4>${esc(k)}</h4><div class="big">${x.n} plays</div><div class="metric-grid">${metric('C/A',`${x.comp}/${x.att}`)}${metric('YPP',fmt(x.y/Math.max(1,x.n),2))}${metric('Expl',x.expl)}${metric('TD / INT',`${x.td} / ${x.int}`)}</div></div>`).join('')||'<div class="empty">No coverage-linked data matched this player.</div>'}</div></div>`;
}
function passingPanel(p){
 if(normPos(p.position)!=='QB')return `<div class="card"><div class="empty">Passing view applies to quarterbacks.</div></div>`;
 let q=findPlayerRow('qb',p.name),pr=findPlayerRows('pressure',p.name);
 return `${q?`<div class="card"><h3>Passing</h3><div class="metric-grid">${playerSeasonStats(p).map(([l,v])=>metric(l,v)).join('')}</div></div>`:''}${pr.length?`<div class="card"><h3>Pressure Splits</h3>${table(['Look','DB','ATT','COMP%','YPA','TD','INT','BTT','TWP','SCR'],pr.map(r=>[r['PRESS PLAY'],r.DB,r.ATT,r['COMP%'],r['PASS YPA'],r['PASS TD'],r.INT,r.BTT,r.TWP,r.SCR]))}</div>`:''}`;
}

function isQBRunRow(r,p){
 if(normPos(p.position)!=='QB')return false;
 if(playerTokenMatch(r.pff_BALLCARRIER,p,'CARRIER')&&String(r.pff_RUNPASS||'').toUpperCase()==='R')return true;
 if(!playerTokenMatch(r.pff_PASSER,p,'QB'))return false;
 let qbs=String(r.pff_QBSCRAMBLE||'').trim().toUpperCase(), pr=passResult(r), rp=String(r.pff_RUNPASS||'').toUpperCase();
 if(nonEmpty(r.pff_QBSCRAMBLE)&&!['0','FALSE','N','NO'].includes(qbs))return true;
 if(pr==='RUN')return true;
 // PFF may retain the play as a pass/dropback while tagging the QB movement/run elsewhere.
 if(rp==='P' && nonEmpty(r.pff_QBMOVEDOFFSPOT) && pr==='')return true;
 return false;
}
function playerRushRows(p){
 let pos=normPos(p.position);
 if(pos==='QB')return (datasets.plays||[]).filter(r=>isQBRunRow(r,p));
 return (datasets.plays||[]).filter(r=>String(r.pff_RUNPASS||'').toUpperCase()==='R'&&playerTokenMatch(r.pff_BALLCARRIER,p,'CARRIER'));
}
function countPctMetric(label,count,total){
 return metric(label,freqMode==='raw'?count:pct(100*count/Math.max(1,total)),freqMode==='raw'?pct(100*count/Math.max(1,total)):`${count} plays`);
}

function rushingPanel(p){
 let rows=playerRushRows(p),gains=rows.map(r=>num(r.pff_GAINLOSSNET||r.pff_GAINLOSS));
 if(!rows.length)return `<div class="card"><div class="empty">No 2025 Mississippi State rushing sample matched ${esc(p.name)}.</div></div>`;
 let byConcept={};rows.forEach(r=>{let k=r.pff_RUNCONCEPTPRIMARY||((normPos(p.position)==='QB'&&(nonEmpty(r.pff_QBSCRAMBLE)||passResult(r)==='RUN'))?'Scramble / Off-Script':'Unknown'),x=byConcept[k]||(byConcept[k]={n:0,y:0,vals:[]});let gain=num(r.pff_GAINLOSSNET||r.pff_GAINLOSS);x.n++;x.y+=gain;x.vals.push(gain)});
 let expl=gains.filter(x=>x>=15).length,neg=gains.filter(x=>x<=0).length;
 return `<div class="card"><div class="section-head"><div><h3>Rushing</h3><small>${normPos(p.position)==='QB'?'Includes PFF QB scrambles / off-script runs plus tagged designed runs.':'Player rushing sample.'}</small></div>${freqToggle()}</div><div class="metric-grid">${metric('Runs',rows.length)}${metric('Yards',gains.reduce((a,b)=>a+b,0))}${metric('YPP',fmt(avg(gains),2))}${metric('Median',fmt(calcMedian(gains),1))}${countPctMetric('Explosive 15+',expl,rows.length)}${countPctMetric('Negative',neg,rows.length)}</div></div><div class="card"><h3>Run Type / Concept</h3>${table(['Concept','Runs','Yards','YPP','Median','Explosive','Negative'],Object.entries(byConcept).sort((a,b)=>b[1].n-a[1].n).map(([k,x])=>{let e=x.vals.filter(v=>v>=15).length,n=x.vals.filter(v=>v<=0).length;return[esc(k),x.n,x.y,fmt(x.y/Math.max(1,x.n),2),fmt(calcMedian(x.vals),1),freqMode==='raw'?e:pct(100*e/Math.max(1,x.n)),freqMode==='raw'?n:pct(100*n/Math.max(1,x.n))]}))}</div>`;
}
function overviewFAU(p){
 let stats=playerSeasonStats(p),named=hasNamedPFFIdentity(p);
 return `${!named?`<div class="no-sample-banner">This current roster player does not have a named 2025 Mississippi State PFF player row. Historical play-feed stats are not being attached by jersey number alone.</div>`:''}<div class="card"><h3>2025 Season Snapshot</h3><div class="metric-grid">${stats.map(([l,v])=>metric(l,v)).join('')}</div></div>${topGamesPanel(p)}`;
}
function gameLogFAU(p){
 let pos=normPos(p.position),games=relevantGameRows(p).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 return `<div class="card"><h3>Game Log</h3>${games.length?table(['Date','Opponent','Plays','Pass C/A','Pass Yds','Rush Yds','Rec/Tgt','Rec Yds','TD','Expl'],games.map(g=>[g.date,g.opp,g.plays,g.att?`${g.comp}/${g.att}`:'—',g.att?g.passY:'—',g.rush?g.rushY:'—',g.tgt?`${g.rec}/${g.tgt}`:'—',g.tgt?g.recY:'—',g.passTD+g.td,g.expl])):'<div class="empty">No game log matched.</div>'}</div>`;
}
function coachNotesFAU(p){
 setTimeout(()=>loadCoachNoteForPlayer(p),0);
 return cloudNoteMarkup(p,'');
}
function renderPortalTab(p){
 if(portalTab==='passing')return passingPanel(p);
 if(portalTab==='rushing')return rushingPanel(p);
 if(portalTab==='routes')return routeTreePanel(p);
 if(portalTab==='top')return topGamesPanel(p);
 if(portalTab==='targets')return targetsPanel(p);
 if(portalTab==='coverage')return coveragePlayerPanel(p,false);
 if(portalTab==='manzone')return coveragePlayerPanel(p,true);
 if(portalTab==='games')return gameLogFAU(p);
 if(portalTab==='notes')return coachNotesFAU(p);
 return overviewFAU(p);
}
function resolveRosterPlayer(value){
 if(typeof value==='number' && roster[value]) return roster[value];
 let raw=String(value??'');
 let exact=roster.find(x=>String(x.name||'')===raw);
 if(exact)return exact;
 let key=cleanName(raw);
 return roster.find(x=>cleanName(x.name)===key)||null;
}
function openPlayerIndex(idx){openFAUProfile(Number(idx))}
function openFAUProfile(value){
 let p=resolveRosterPlayer(value);
 if(!p){console.error('Player not found',value);return}
 selected=p.name;portalTab='overview';routeFocus='ALL';
 let overlay=$('profileOverlay'),drawer=$('fauDrawer'),body=$('fauDrawerBody');
 if(overlay)overlay.classList.add('open');
 if(drawer)drawer.classList.add('open');
 document.body.style.overflow='hidden';
 if(body)body.innerHTML=`<div class="drawer-top"><button class="back" onclick="closeFAUProfile()">← Back</button><div><div class="drawer-player">${esc(p.name)}</div><div class="drawer-pos">${esc(normPos(p.position))} · ${activeOpponentName()}</div></div></div><div class="fau-panel"><div class="card"><h3>Loading profile…</h3></div></div>`;
 try{renderFAUDrawer(p)}
 catch(err){
   console.error('Player profile render error',err);
   if(body)body.innerHTML=`<div class="drawer-top"><button class="back" onclick="closeFAUProfile()">← Back</button><div><div class="drawer-player">${esc(p.name)}</div><div class="drawer-pos">${esc(normPos(p.position))} · ${activeOpponentName()}</div></div></div><div class="fau-panel"><div class="card error-card"><h3>Profile opened, but one profile section failed</h3><div class="subtle">${esc(err?.message||String(err))}</div></div></div>`;
 }
}
function closeFAUProfile(){
 $('profileOverlay')?.classList.remove('open');
 $('fauDrawer')?.classList.remove('open');
 document.body.style.overflow='';
}

const PI_OPP_NAMES={
 'LASE':'Southeastern Louisiana','LATU':'Louisiana Tech','OHUN':'Ohio','KYUN':'Kentucky','MSSO':'Southern Miss','AZST':'Arizona State','MSAL':'Alcorn State','ILNO':'Northern Illinois',
 'TNUN':'Tennessee','TXAM':'Texas A&M','FLUN':'Florida','TXUN':'Texas','ARUN':'Arkansas',
 'GAUN':'Georgia','MOUN':'Missouri','MSUN':'Ole Miss','NCWF':'Wake Forest'
};
function piOppName(code){return PI_OPP_NAMES[String(code||'').toUpperCase()]||String(code||'Opponent')}
function piGameKey(r){return String(firstField(r,['pff_GAMEID'])||'')||`${firstField(r,['pff_GAMEDATE'])||''}-${firstField(r,['pff_OFFTEAM'])||''}`}
function piPlayerEventRows(p){
 let year=isCurrentSeasonOpponent()?'2026':(supportsSeasonSplit()?playerIntelSeason:'2025');
 return seasonEventRows(p,year).filter(r=>[
  'pff_TACKLE','pff_TACKLEASSIST','pff_STOP','pff_SACK','pff_QBPRESSURE',
  'pff_INTERCEPTION','pff_PASSBREAKUP','pff_FORCEDFUMBLE','pff_MISSEDTACKLE'
 ].some(k=>seasonFieldMatches(r?.[k],p,year)));
}
function piGameStats(p){
 if(!supportsSeasonSplit()&&!piHasVerifiedHistoricalIdentity(p))return [];
 if(supportsSeasonSplit()&&playerIntelSeason==='2025'&&!piStats(p).verified)return [];
 let pos=normPos(p.position),map={};
 piPlayerEventRows(p).forEach(r=>{
   let key=piGameKey(r);
   if(!map[key])map[key]={
     key,date:firstField(r,['pff_GAMEDATE'])||'',opp:piOppName(firstField(r,['pff_OFFTEAM'])),
     tagged:0,tkl:0,ast:0,stop:0,pressure:0,sack:0,int:0,pbu:0,ff:0,mt:0
   };
   let g=map[key];g.tagged++;
   if(piTagged(r,p,['pff_TACKLE']))g.tkl++;
   if(piTagged(r,p,['pff_TACKLEASSIST']))g.ast++;
   if(piTagged(r,p,['pff_STOP']))g.stop++;
   if(piTagged(r,p,['pff_QBPRESSURE']))g.pressure++;
   if(piTagged(r,p,['pff_SACK']))g.sack++;
   if(piTagged(r,p,['pff_INTERCEPTION']))g.int++;
   if(piTagged(r,p,['pff_PASSBREAKUP']))g.pbu++;
   if(piTagged(r,p,['pff_FORCEDFUMBLE']))g.ff++;
   if(piTagged(r,p,['pff_MISSEDTACKLE']))g.mt++;
 });
 return Object.values(map).map(g=>{
   let production=g.tkl+g.ast+g.stop+g.pressure+g.sack+g.int+g.pbu+g.ff;
   return {...g,production};
 }).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}
function piTopGames(p){return piGameStats(p).slice().sort((a,b)=>b.production-a.production||b.sack-a.sack||b.int-a.int||b.pbu-a.pbu||b.stop-a.stop).slice(0,3)}
function piGameCard(g,i){
 return `<div class="pi-game-card"><div class="rank">#${i+1} Top Game</div><h4>vs ${esc(g.opp)}</h4><div class="date">${esc(g.date)}</div>
 <div class="pi-game-score">${g.production} charted production events</div>
 <div class="pi-game-mini">
  <div><span>Tackles</span><b>${g.tkl}</b></div><div><span>Stops</span><b>${g.stop}</b></div><div><span>Pressures</span><b>${g.pressure}</b></div>
  <div><span>Sacks</span><b>${g.sack}</b></div><div><span>INT</span><b>${g.int}</b></div><div><span>PBU</span><b>${g.pbu}</b></div>
 </div></div>`;
}
function piTopGamesPanel(p){
 let games=piTopGames(p);
 return `<div class="card"><h3>Top 3 Games — Charted Production</h3>
  <div class="pi-profile-note">No custom score. These are the three games with the most explicit charted production events for the player. The actual football numbers are shown below.</div>
  <div class="pi-top-games">${games.length?games.map(piGameCard).join(''):'<div class="empty">No per-game defender events matched this player.</div>'}</div>
 </div>`;
}
function piGameLogPanel(p){
 let games=piGameStats(p).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 return `<div class="card"><h3>Game-by-Game Production</h3><div class="pi-game-log-wrap">${games.length?table(
  ['Date','Opponent','Tagged Events','Tkl','Ast','Stops','Press','Sacks','INT','PBU','FF','Missed'],
  games.map(g=>[esc(g.date),esc(g.opp),g.tagged,g.tkl,g.ast,g.stop,g.pressure,g.sack,g.int,g.pbu,g.ff,g.mt])
 ):'<div class="empty">No game log matched this player.</div>'}</div>
 <div class="pi-profile-note">“Tagged Events” is not snap count. It is the number of plays on which this player appears in one of the explicit defender-event fields available in the play feed.</div></div>`;
}
function piDeploymentPanel(p){
 if(activeOpponent==='SA'){
  let vals=[['alignmentDL','DL'],['alignmentBox','BOX'],['alignmentSlot','SCB'],['alignmentCorner','CB'],['alignmentSafety','SAF']].map(([key,col])=>[col,findPlayerRow(key,p.name)?.[col]]).filter(([,v])=>nonEmpty(v));
  let a=findPlayerRow('alignmentAll',p.name)||{};vals.push(['Pass Snaps',a.PASS],['Rush %',a['PRSH%']],['Coverage %',a['COV%']]);
  return `<div class="card"><h3>Deployment / Alignment</h3><div class="pi-role-grid">${vals.filter(([,v])=>nonEmpty(v)).map(([k,v])=>`<div class="pi-role-card"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div></div>`;
 }

 let s=piSummaryByVerifiedName(p);
 if(!s)return `<div class="card"><h3>Deployment / Alignment</h3><div class="empty">No PFF player-summary deployment row matched this player.</div></div>`;
 let vals=[
  ['DL',s.DL],['IDL',s.IDL],['EDGE',s.EDGE],['BOX',s.BOX],['ILB',s.ILB],['OLB',s.OLB],
  ['SS',s.SS],['FS',s.FS],['SCB',s.SCB],['CB',s.CB],
  ['Man %',s.MAN_PCT],['Zone %',s.ZONE_PCT],['Press %',s.PRESS_PCT],
  ['0 Tech',s.TECH_0],['1 Tech',s.TECH_1],['2/2i',num(s.TECH_2)+num(s.TECH_2I)],['3 Tech',s.TECH_3],
  ['4/4i',num(s.TECH_4)+num(s.TECH_4I)],['5 Tech',s.TECH_5],['6/6i',num(s.TECH_6)+num(s.TECH_6I)],['7 Tech',s.TECH_7],['9 Tech',s.TECH_9]
 ].filter(([l,v])=>nonEmpty(v)&&String(v)!=='0');
 return `<div class="card"><h3>Deployment / Alignment</h3><div class="pi-role-grid">${vals.length?vals.map(([l,v])=>`<div class="pi-role-card"><span>${esc(l)}</span><b>${esc(value(v))}</b></div>`).join(''):'<div class="empty">No alignment distribution was available.</div>'}</div></div>`;
}
function piSkillPanel(p){
 let pos=normPos(p.position),vals=[];
 if(supportsSeasonSplit()||isCurrentSeasonOpponent()){
   let s=piStats(p); if(!s.verified)return '';
   if(pos==='DL')vals=[['Run Grade',s.runGrade],['Rush Grade',s.rushGrade],['Pressures',s.pressures],['Sacks',s.sacks],['PR Win %',s.prWin],['Pressure %',s.prPct],['Stops',s.stops],['Missed Tkl',s.mt]];
   else if(pos==='LB')vals=[['Run Grade',s.runGrade],['Rush Grade',s.rushGrade],['Cov Grade',s.covGrade],['Pressures',s.pressures],['Sacks',s.sacks],['Stops',s.stops],['Targets',s.targets],['Yds Allowed',s.passYds],['Missed Tkl',s.mt]];
   else vals=[['Cov Grade',s.covGrade],['Coverage Snaps',s.covSnaps],['Targets',s.targets],['Completions',s.comp],['Comp %',s.compPct],['Yds Allowed',s.passYds],['TD Allowed',s.td],['INT',s.ints],['PBU',s.pbu],['Rating Allowed',s.rating],['Man %',s.manPct],['Zone %',s.zonePct],['Missed Tkl',s.mt]];
 }else{
   let s=piSummaryByVerifiedName(p); if(!s)return '';
   if(pos==='DL'||pos==='LB'){
     vals=[['DEF Grade',s.DEF_GRD],['Run Grade',s.RUND_GRD],['Rush Grade',s.PRSH_GRD],['Pressures',s.TPR],['Sacks',s.SK],['Hits',s.HT],['Hurries',s.HU],['PR Win %',s.PR_WIN_PCT],['Pressure %',s.PRESSURE_PCT],['Run Stops',s.STOP],['Missed Tkl',s.MT]];
     if(pos==='LB')vals.push(['Cov Grade',s.COV_GRD],['Targets',s.CTGT],['Yds Allowed',s.PASS_YDS_ALLOWED]);
   }else vals=[['Cov Grade',s.COV_GRD],['Targets',s.CTGT],['Completions',s.REC_ALLOWED],['Comp %',s.COMP_PCT_ALLOWED],['Yds Allowed',s.PASS_YDS_ALLOWED],['TD Allowed',s.TD_ALLOWED],['INT',s.INT],['PBU',s.PBU],['Rating Allowed',s.RTG_ALLOWED],['Man %',s.MAN_PCT],['Zone %',s.ZONE_PCT],['Missed Tkl',s.MT]];
 }
 vals=vals.filter(([l,v])=>nonEmpty(v));
 return `<div class="card"><h3>Season Skill Profile</h3><div class="detail-grid">${vals.map(([l,v])=>detail(l,v)).join('')}</div></div>`;
}
function piProfilePanel(p,tab){
 if(supportsSeasonSplit()&&playerIntelSeason==='2025'&&!piStats(p).verified&&tab!=='notes'){
   return `<div class="card"><h3>2025 Production</h3><div class="empty"><b>No verified 2025 ${activeOpponentName()} charted data for ${esc(p.name)}.</b></div></div>
   <div class="card"><h3>Roster Identity</h3><div class="detail-grid">${detail('Number',p.number)}${detail('Position',p.position)}${detail('Height',p.height)}${detail('Weight',p.weight?`${p.weight} lbs`:'')}${detail('Class',p.class)}${detail('Hometown',p.hometown)}${detail('Previous School',p.previousSchool)}</div></div>`;
 }
 if(!isCurrentSeasonOpponent()&&!supportsSeasonSplit()&&!piHasVerifiedHistoricalIdentity(p)&&tab!=='notes'){
   return `<div class="card"><h3>Historical Production</h3><div class="empty"><b>No verified 2025 charted data for ${esc(p.name)}.</b></div></div>`;
 }
 if(tab==='topgames')return piTopGamesPanel(p);
 if(tab==='gamelog')return piGameLogPanel(p);
 if(tab==='deployment')return piDeploymentPanel(p)+(supportsSeasonSplit()&&playerIntelSeason==='2026'?'':piSkillPanel(p));
 if(tab==='notes')return coachNotesFAU(p);
 let pos=normPos(p.position),s=(isCurrentSeasonOpponent()?piStats(p):piSeasonStats(p)),seasonLabel=isCurrentSeasonOpponent()?'2026':(supportsSeasonSplit()?playerIntelSeason:'2025');
 let prod = pos==='DL'
  ? [detail('Tagged Plays',s.rows),detail('Tackles',s.tackles),detail('Stops',s.stops),detail('Pressures',s.pressures),detail('Sacks',s.sacks),detail('Missed Tkl',s.mt),detail('Run Grade',s.runGrade||'—'),detail('Rush Grade',s.rushGrade||'—')]
  : pos==='LB'
  ? [detail('Tagged Plays',s.rows),detail('Tackles',s.tackles),detail('Assists',s.assists||0),detail('Stops',s.stops),detail('Pressures',s.pressures),detail('INT',s.ints),detail('Missed Tkl',s.mt),detail('Run Grade',s.runGrade||'—'),detail('Cov Grade',s.covGrade||'—')]
  : [detail('Tagged Plays',s.rows),detail('Coverage Snaps',s.covSnaps||0),detail('Tackles',s.tackles||0),detail('PBU',s.pbu||0),detail('INT',s.ints||0),detail('Missed Tkl',s.mt||0),detail('Targets',s.targets??'—'),detail('Completions',s.comp??'—'),detail('Completion %',s.compPct||'—'),detail('Yds Allowed',s.passYds??'—'),detail('Rating Allowed',s.rating||'—'),detail('Man / Zone',`${s.manPct||'—'} / ${s.zonePct||'—'}`)];
 return `<div class="card"><h3>${seasonLabel} Defensive Production</h3><div class="detail-grid">${prod.join('')}</div></div>
 ${piTopGamesPanel(p)}
 ${supportsSeasonSplit()&&playerIntelSeason==='2026'?'':piSkillPanel(p)}
 <div class="card"><h3>Roster Identity</h3><div class="detail-grid">${detail('Number',p.number)}${detail('Position',p.position)}${detail('Group',pos)}${detail('Height',p.height)}${detail('Weight',p.weight?`${p.weight} lbs`:'')}${detail('Class',p.class)}${detail('Hometown',p.hometown)}${detail('Previous School',p.previousSchool)}</div></div>
 <div class="card"><h3>Biography</h3><div class="bio">${esc(p.bio||'Biography has not been enriched in the shared roster yet.')}</div></div>`;
}
window.setPIProfileTab=id=>{portalTab=id;let p=roster.find(x=>x.name===selected);if(p)renderFAUDrawer(p)};

function renderFAUDrawer(p){
 let pos=normPos(p.position);
 $('fauDrawerBody').innerHTML=`<div class="drawer-top"><button class="back" onclick="closeFAUProfile()">← Back</button><div><div class="drawer-player">${esc(p.name)}</div><div class="drawer-pos">${esc(pos)} · ${activeOpponentName()}</div></div><div class="drawer-spacer"></div>${p.profile?`<button onclick='window.open(${JSON.stringify(p.profile)},"_blank")'>Official Bio ↗</button>`:''}</div>
 <div class="fau-hero"><div class="player-photo">${photo(p)}<div class="player-no">#${esc(p.number||'—')}</div></div><div class="fau-hero-info"><div class="kicker">OFFENSIVE INTELLIGENCE</div><div class="fau-hero-name">${esc(p.name)}</div><div class="fau-hero-pos">${esc(p.position||'')} · #${esc(p.number||'—')}</div><div class="fau-meta">${p.height?esc(p.height):''}${p.weight?` · ${esc(p.weight)} lbs`:''}${p.class?` · ${esc(p.class)}`:''}${p.hometown?`<br>${esc(p.hometown)}`:''}${p.previousSchool?`<br>Previous: ${esc(p.previousSchool)}`:''}</div></div></div>
 <div class="pi-drawer-season">${supportsSeasonSplit()?playerSeasonToggle():''}</div>
 <div class="pi-profile-tabs">
   <button class="${portalTab==='overview'?'active':''}" onclick="setPIProfileTab('overview')">Overview</button>
   <button class="${portalTab==='topgames'?'active':''}" onclick="setPIProfileTab('topgames')">Top 3 Games</button>
   <button class="${portalTab==='gamelog'?'active':''}" onclick="setPIProfileTab('gamelog')">Game Log</button>
   <button class="${portalTab==='deployment'?'active':''}" onclick="setPIProfileTab('deployment')">Deployment</button>
   <button class="${portalTab==='notes'?'active':''}" onclick="setPIProfileTab('notes')">Coach Notes</button>
 </div>
 <div id="fauPanel" class="fau-panel">${piProfilePanel(p,portalTab)}</div>`;
}
window.showSharedNotes=()=>{portalTab='notes';let p=roster.find(x=>x.name===selected);if(p)renderFAUDrawer(p)};
window.setPortalTab=id=>{portalTab=id;let p=roster.find(x=>x.name===selected);if(p)renderFAUDrawer(p)};
window.setRouteFocus=r=>{routeFocus=r;let p=roster.find(x=>x.name===selected);if(p)renderFAUDrawer(p)};
window.openFAUProfile=openFAUProfile;window.openPlayerIndex=openPlayerIndex;window.closeFAUProfile=closeFAUProfile;


