const SA_BUNDLE=window.SA_BUNDLE;


// Only attach internal language when game, drive, quarter, play-in-drive,
// run/pass and yardage uniquely agree. Ambiguous rows retain PFF language.
function enrichSouthAlabamaLanguage(){
 const key=(opp,q,d,p,rp,g)=>[opp,num(q),num(d),num(p),rp,num(g)].join('|');
 const map=new Map();
 for(const r of datasets.internalLanguage||[]){
  const m=String(r.Name||'').match(/ALSO D vs ([A-Z]+)/);if(!m)continue;
  const k=key(m[1],r.Quarter,r['Drive #'],r['Drive Play #'],r['R/P'],r.Gain);
  map.set(k,map.has(k)?null:r);
 }
 for(const r of datasets.plays||[]){
  const x=map.get(key(r.pff_OFFTEAM,r.pff_QUARTER,r.pff_DRIVE,r.pff_DRIVEPLAY,r.pff_RUNPASS,r.pff_GAINLOSS));
  if(x&&x.Formation)r.ulmFormation=x.Formation;
 }
}

const bundledSources=new Set();
function isCurrentSeasonOpponent(){return activeOpponent==='SA'||activeOpponent==='FAU'}
function defenseTeamCode(){return {SA:'ALSO',FAU:'FLAT',SELA:'LASE',UAB:'ALBI',MSST:'MSST'}[activeOpponent]}
async function fetchOpponentResource(url,options={}){
 const name=decodeURIComponent(String(url).split('/').pop().split('?')[0]);
 const fallback=activeOpponent==='SA'?SA_BUNDLE[name]:undefined;
 if(localFileMode()&&fallback!==undefined){bundledSources.add(name);return new Response(fallback);}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 try{const r=await fetch(url,{...options,signal:controller.signal});if(r.ok)return r;if(fallback===undefined)return r;}
 catch(e){if(fallback===undefined)throw e;}
 finally{clearTimeout(timer)}
 {bundledSources.add(name);return new Response(fallback);}
}

const SUPABASE_BASE='https://hzrosmevuejjlxigdxmg.supabase.co/storage/v1/object/public';
const OPPONENTS={
 SA:{label:'South Alabama',pffBase:SUPABASE_BASE+'/Offensive%20Intelligence/South%20Alabama/Current/',roster:SUPABASE_BASE+'/Offensive%20Intelligence/South%20Alabama/Current/roster.json',notesTeam:'South Alabama'},
 MSST:{
   label:'Mississippi State',
   pffBase:SUPABASE_BASE+'/Offensive%20Intelligence/Mississippi%20State/Current/',
   roster:SUPABASE_BASE+'/Special%20Teams/Current/roster.json',
   notesTeam:'Mississippi State'
 },
 UAB:{
   label:'UAB',
   pffBase:SUPABASE_BASE+'/Offensive%20Intelligence/UAB/Current/',
   roster:SUPABASE_BASE+'/Offensive%20Intelligence/UAB/Current/roster.json',
   depth:SUPABASE_BASE+'/Offensive%20Intelligence/UAB/Current/depth-chart.json',
   historical:SUPABASE_BASE+'/Offensive%20Intelligence/UAB/Current/historical-roster-2025.json',
   notesTeam:'UAB'
 },
 SELA:{
   label:'Southeastern Louisiana',
   pffBase:SUPABASE_BASE+'/Offensive%20Intelligence/Current/Southeastern%20Louisiana/',
   roster:SUPABASE_BASE+'/Offensive%20Intelligence/Current/Southeastern%20Louisiana/roster.json',
   depth:SUPABASE_BASE+'/Offensive%20Intelligence/Current/Southeastern%20Louisiana/depth-chart.json',
   notesTeam:'Southeastern Louisiana'
 },
 FAU:{
   label:'Florida Atlantic',
   pffBase:SUPABASE_BASE+'/Offensive%20Intelligence/Florida%20Atlantic/Current/',
   roster:SUPABASE_BASE+'/Offensive%20Intelligence/Florida%20Atlantic/Current/roster.json',
   depth:SUPABASE_BASE+'/Offensive%20Intelligence/Florida%20Atlantic/Current/depth-chart.json',
   notesTeam:'Florida Atlantic'
 }
};
let activeOpponent=new URLSearchParams(location.search).get('opponent')||localStorage.getItem('ulmOffIntelOpponent')||'SA';
if(!OPPONENTS[activeOpponent])activeOpponent='MSST';
function opp(){return OPPONENTS[activeOpponent]}
function activeOpponentName(){return opp().label}

function localFileMode(){return location.protocol==='file:'}

function activePffBase(){
 if(activeOpponent==='UAB'&&discoveredUABBase)return discoveredUABBase;
 if(activeOpponent==='SELA'&&discoveredSELABase)return discoveredSELABase;
 if(activeOpponent==='FAU'&&discoveredFAUBase)return discoveredFAUBase;
 return opp().pffBase;
}
function activeRosterUrl(){
 if(activeOpponent==='UAB'&&discoveredUABBase)return discoveredUABBase+'roster.json';
 if(activeOpponent==='SELA'&&discoveredSELABase)return discoveredSELABase+'roster.json';
 if(activeOpponent==='FAU'&&discoveredFAUBase)return discoveredFAUBase+'roster.json';
 return opp().roster;
}
function notesTeam(){return opp().notesTeam}
function supportsSeasonSplit(){return activeOpponent==='UAB'||activeOpponent==='SELA'}
function uabBaseCandidates(){
 const root=SUPABASE_BASE+'/Offensive%20Intelligence/';
 return [
   root+'UAB/Current/',
   root+'Current/UAB/Current/',
   root+'Current/UAB/',
   root+'UAB/'
 ];
}
async function discoverUABBase(){
 if(!supportsSeasonSplit())return '';
 if(discoveredUABBase)return discoveredUABBase;
 for(const base of uabBaseCandidates()){
   try{
     let r=await fetch(base+'roster.json?v='+Date.now(),{cache:'no-store'});
     if(r.ok){discoveredUABBase=base;return base}
   }catch(e){}
 }
 return '';
}
function selaBaseCandidates(){
 const root=SUPABASE_BASE+'/Offensive%20Intelligence/';
 return [
   root+'Current/Southeastern%20Louisiana/',
   root+'Southeastern%20Louisiana/Current/',
   root+'Current/Southeastern%20Louisiana/Current/',
   root+'Southeastern%20Louisiana/'
 ];
}
async function discoverSELABase(){
 if(activeOpponent!=='SELA')return '';
 if(discoveredSELABase)return discoveredSELABase;
 for(const base of selaBaseCandidates()){
   try{
     let r=await fetch(base+'roster.json?v='+Date.now(),{cache:'no-store'});
     if(r.ok){discoveredSELABase=base;return base}
   }catch(e){}
 }
 return '';
}


function fauBaseCandidates(){
 const root=SUPABASE_BASE+'/Offensive%20Intelligence/';
 return [
   root+'Florida%20Atlantic/Current/',
   root+'Current/Florida%20Atlantic/',
   root+'Florida%20Atlantic/',
   root+'Current/Florida%20Atlantic/Current/'
 ];
}
async function discoverFAUBase(){
 if(activeOpponent!=='FAU')return '';
 if(discoveredFAUBase)return discoveredFAUBase;
 for(const base of fauBaseCandidates()){
   try{
     let r=await fetch(base+'play_feed%20(26).csv?v='+Date.now(),{cache:'no-store'});
     if(r.ok){discoveredFAUBase=base;return base}
   }catch(e){}
 }
 return '';
}

const SUPABASE_URL='https://hzrosmevuejjlxigdxmg.supabase.co';
const SUPABASE_KEY='sb_publishable_FtmUeN1QkLlkRIqCIdQ5gw_KDbEFy1H';
const NOTES_API=SUPABASE_URL+'/rest/v1/defensive_player_notes';

const NOTES_SEASON=2026;
let cloudNotes={}; let reportQueue=[]; let printProfilesPerPage=4; let customReportItems=[];
function activeFiles(){
 if(activeOpponent==='SA')return {"plays": ["play_feed.csv"], "internalLanguage": ["ALL_GAMES_COMBINED.csv"], "playerIntel": ["pff-data-205.csv"], "playerRush": ["pff-data-206.csv"], "playerRun": ["pff-data-207.csv"], "playerCoverage": ["pff-data-208.csv"], "tackling": ["pff-data-209.csv"], "coverageDistribution": ["pff-data-210.csv"], "runConcepts": ["pff-data-211.csv"], "coverage": ["pff-data-212.csv"], "pressure": ["pff-data-213.csv"], "personnel": ["pff-data-214.csv"], "coveragePressure": ["pff-data-215.csv"], "blitzOrigin": ["pff-data-216.csv"], "alignmentAll": ["pff-data-217.csv"], "alignmentDL": ["pff-data-218.csv"], "alignmentBox": ["pff-data-219.csv"], "alignmentSlot": ["pff-data-220.csv"], "alignmentCorner": ["pff-data-221.csv"], "alignmentSafety": ["pff-data-222.csv"]};
 if(activeOpponent==='UAB')return {
   plays:['play_feed (18).csv','play_feed.csv','plays.csv','current.csv'],
   playerIntel:['pff-data (32).csv'],
   coverage:['pff-data (39).csv'],
   pressure:['pff-data (40).csv'],
   fronts:['pff-data (48).csv'],
   personnel:['pff-data (38).csv'],
   tackling:['pff-data (49).csv']
 };
 if(activeOpponent==='SELA')return {
   plays:['play_feed (23).csv','play_feed.csv','plays.csv','current.csv'],
   playerIntel:['pff-data (50).csv'],
   coverage:['pff-data (57).csv'],
   pressure:['pff-data (58).csv','pff-data (59).csv'],
   fronts:['pff-data (59).csv'],
   personnel:['pff-data (59).csv'],
   tackling:['pff-data (54).csv'],
   playerRush:['pff-data (60).csv'],
   playerRun:['pff-data (61).csv'],
   playerCoverage:['pff-data (62).csv']
 };
 if(activeOpponent==='FAU')return {
   plays:['play_feed (26).csv','play_feed.csv','plays.csv','current.csv'],
   playerIntel:['pff-data (76).csv'],
   playerRush:['pff-data (77).csv'],
   playerRun:['pff-data (78).csv'],
   playerCoverage:['pff-data (79).csv'],
   tackling:['pff-data (80).csv'],
   coverage:['pff-data (83).csv','pff-data (81).csv'],
   runConcepts:['pff-data (82).csv'],
   pressure:['pff-data (84).csv','pff-data (85).csv'],
   fronts:['pff-data (85).csv'],
   personnel:['pff-data (85).csv'],
   zoneGoalLine:['pff-data (86).csv'],
   zoneLowRZ:['pff-data (87).csv'],
   zoneHighRZ:['pff-data (88).csv'],
   zoneFringe:['pff-data (89).csv'],
   zoneOpenField:['pff-data (90).csv'],
   zoneComingOut:['pff-data (91).csv'],
   zoneBackedUp:['pff-data (92).csv']
 };
 return {
   plays:['play_feed.csv','plays.csv','current.csv'],
   playerIntel:['player_intelligence.csv'],
   coverage:['coverage.csv','coverage_summary.csv'],
   pressure:['pressure.csv','pressure_summary.csv'],
   fronts:['fronts.csv','front_summary.csv'],
   personnel:['personnel.csv','personnel_summary.csv']
 };
}
let FILES=activeFiles();



































let printPlayerPos='ALL';
let depthChartData=null;
let historicalRoster=[];
let discoveredUABBase='';
let discoveredSELABase='';
let discoveredFAUBase='';
let roster=[],datasets={},loadState={},page='dashboard',group='ALL',selected=null,facet='overview',freqMode='raw',heatScope='all',heatMetric='attempts',heatCoverage='ALL',heatHash='ALL',heatQB='ALL',portalTab='overview',playerIntelSeason=localStorage.getItem('ulmPlayerIntelSeason')||'2026',analyticsSeasonMode=localStorage.getItem('ulmAnalyticsSeasonMode')||'WEIGHTED',routeFocus='ALL',runConceptFocus='ALL',runHashF='ALL',runRBSideF='ALL',runPersonnelF='ALL',runFormationF='ALL',dndFilter='ALL',dashHashF='ALL',passHashF='ALL',qbRunHashF='ALL',qbRunTypeF='ALL',pfPersonnelF='ALL',pfFrontF='ALL',pfDownF='ALL',pfFieldF='ALL',pfBoxF='ALL',pfHashF='ALL',rdFrontF='ALL',rdBoxF='ALL',rdPersonnelF='ALL',rdDownF='ALL',rdDistF='ALL',rdFieldF='ALL',rdDirF='ALL',rdGapF='ALL',rdHashF='ALL',cvFamilyF='ALL',cvShellF='ALL',cvManZoneF='ALL',cvDownF='ALL',cvDistF='ALL',cvFieldF='ALL',cvHashF='ALL',cvPressureF='ALL',prTypeF='ALL',prRushF='ALL',prDownF='ALL',prDistF='ALL',prFieldF='ALL',prPersonnelF='ALL',prFormationF='ALL',prCoverageF='ALL',prHashF='ALL',stDownF='ALL',stDistF='ALL',stFieldF='ALL',stHashF='ALL',stRP='ALL',stPersonnelF='ALL',stFrontF='ALL',stCoverageF='ALL',hmMetric='ypp',hmCoverageF='ALL',hmShellF='ALL',hmPressureF='ALL',hmDownF='ALL',hmHashF='ALL',hmFieldF='ALL',srFormationF='ALL',srPersonnelF='ALL',srMotionF='ALL',srStructureF='ALL',srDownF='ALL',srFieldF='ALL',srHashF='ALL',fmFormationF='ALL',fmPersonnelF='ALL',fmMotionF='ALL',fmDownF='ALL',fmFieldF='ALL',fmHashF='ALL',hmRelativeF='ALL',hmDepthF='ALL',hmLaneF='ALL',hrRPF='ALL',hrDownF='ALL',hrDistF='ALL',hrFieldF='ALL',hrPersonnelF='ALL';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const num=v=>{let n=parseFloat(String(v??'').replace(/[%,$]/g,''));return Number.isFinite(n)?n:0};
const pct=v=>{if(v===null||v===undefined||v==='')return '—';let s=String(v);return s.includes('%')?s:(num(v).toFixed(1)+'%')};
function parsePctValue(v){let n=parseFloat(String(v??'').replace('%','').trim());return Number.isFinite(n)?n:0}
const fmt=(v,d=1)=>Number.isFinite(+v)?(+v).toFixed(d):'—';
// Official roster lists Masey Lewis; the supplied PFF/depth chart uses Mase Lewis.
const cleanName=s=>{const name=String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');return activeOpponent==='SA'&&name==='maselewis'?'maseylewis':name};
function jerseyNum(v){let m=String(v??'').match(/\d+/);return m?String(parseInt(m[0],10)):''}
function tokenJersey(token){
 let s=String(token||'').toUpperCase();
 let m=s.match(/\b(?:MSST|ALBI|UAB|LASE|FLAT|ALSO)\s+D?(\d{1,2})\b/);
 if(!m)m=s.match(/\b(\d{1,2})\s*\((QB|HB|RB|WR|TE|FB|LWR|RWR|SRWR|SLWR)/);
 return m?String(parseInt(m[1],10)):'';
}
function hasNamedPFFIdentity(p){
 let pos=normPos(p.position);
 if(pos==='QB')return !!findPlayerRow('qb',p.name);
 if(['WR','TE','RB'].includes(pos))return !!findPlayerRow('receiving',p.name);
 if(pos==='OL')return !!findPlayerRow('passBlocking',p.name)||!!findPlayerRow('runBlocking',p.name);
 return false;
}
function playerTokenMatch(token,p,expectedPos=''){
 if(!token||!p)return false;
 if(cleanName(token)===cleanName(p.name))return true;
 if(!hasNamedPFFIdentity(p))return false;
 let pj=jerseyNum(p.number),tj=tokenJersey(token);
 if(!pj||!tj||pj!==tj)return false;
 let pos=normPos(p.position), t=String(token).toUpperCase();
 if(expectedPos==='QB'||pos==='QB') return t.includes('(QB)') || expectedPos==='QB';
 if(expectedPos==='TARGET' && ['WR','TE','RB'].includes(pos)) return true;
 if(expectedPos==='CARRIER' && ['RB','QB'].includes(pos)) return true;
 return true;
}
function resolvePlayer(value){
 if(typeof value==='object'&&value)return value;
 return roster.find(x=>cleanName(x.name)===cleanName(value))||null;
}

function normPos(pos){
 let p=String(pos||'').trim().toUpperCase();
 if(['DL','DE','DT','NT'].includes(p))return'DL';
 if(['LB','OLB','ILB','MLB','WLB','SLB','JACK','MONEY'].includes(p))return'LB';
 if(['DB','CB','S','FS','SS','NB','NICKEL'].includes(p))return'DB';
 return p||'OTHER';
}
function initials(n){return String(n||'?').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()}
function photo(p){
 if(!p.image)return `<div class="initials">${initials(p.name)}</div>`;
 let alt=p.officialImageSource||p.supabaseImageBackup||'';
 return `<img src="${esc(p.image)}" data-alt="${esc(alt)}" alt="${esc(p.name)}" referrerpolicy="no-referrer" loading="lazy" onerror="if(this.dataset.alt&&this.src!==this.dataset.alt){this.src=this.dataset.alt;this.dataset.alt=''}else{this.remove();this.parentElement.querySelector('.initials').style.display='flex'}"><div class="initials" style="display:none">${initials(p.name)}</div>`;
}
function value(x){return x===null||x===undefined||x===''?'—':x}
function nonEmpty(v){return v!==null&&v!==undefined&&String(v).trim()!==''&&String(v).trim().toLowerCase()!=='nan'}
function passResult(r){return String(r?.pff_PASSRESULT||'').trim().toUpperCase()}
function isInterception(r){return passResult(r)==='INTERCEPTION'||nonEmpty(r?.pff_INTERCEPTION)}
function isPassTouchdown(r){return String(r?.pff_RUNPASS||'').toUpperCase()==='P'&&passResult(r)==='COMPLETE'&&nonEmpty(r?.pff_TOUCHDOWN)&&!isInterception(r)}
function isRushTouchdown(r){return String(r?.pff_RUNPASS||'').toUpperCase()==='R'&&nonEmpty(r?.pff_TOUCHDOWN)}
function positionGroups(){return[['ALL','All Defense'],['DL','DL'],['LB','LB'],['DB','DB']]}
function offenseRoster(){return roster.filter(p=>['DL','LB','DB'].includes(normPos(p.position)))}
function filteredPlayers(){let q=($('playerSearch')?.value||'').toLowerCase().trim(),sort=$('playerSort')?.value||'number';let a=offenseRoster().filter(p=>(group==='ALL'||normPos(p.position)===group)&&(!q||[p.name,p.number,p.position,p.hometown,p.previousSchool].some(x=>String(x||'').toLowerCase().includes(q))));a.sort((a,b)=>sort==='name'?String(a.name).localeCompare(String(b.name)):sort==='position'?normPos(a.position).localeCompare(normPos(b.position))||(+a.number||999)-(+b.number||999):(+a.number||999)-(+b.number||999));return a}
function parseCSV(text){text=String(text).replace(/^\uFEFF/,'');let rows=[],row=[],cell='',q=false;for(let i=0;i<text.length;i++){let c=text[i],n=text[i+1];if(q){if(c==='"'&&n==='"'){cell+='"';i++;}else if(c==='"')q=false;else cell+=c}else if(c==='"')q=true;else if(c===','){row.push(cell);cell=''}else if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell=''}else cell+=c}if(cell.length||row.length){row.push(cell.replace(/\r$/,''));rows.push(row)}if(!rows.length)return[];let seen={};let headers=rows.shift().map(h=>{h=h.trim();let n=seen[h]||0;seen[h]=n+1;return n?h+'.'+n:h});return rows.filter(r=>r.some(x=>String(x).trim()!=='')).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])))}

async function fetchCSVFile(name){
 let r=await fetchOpponentResource(activePffBase()+encodeURIComponent(name)+'?v='+Date.now(),{cache:'no-store'});
 if(!r.ok)throw new Error(`${name}: HTTP ${r.status}`);
 return parseCSV(await r.text());
}
function mergeUABPlayerIntelRows(parts){
 const byName=new Map();
 const get=(name)=>{let k=cleanName(name);if(!byName.has(k))byName.set(k,{Name:name});return byName.get(k)};
 const copy=(dst,src,map)=>Object.entries(map).forEach(([out,inp])=>{if(nonEmpty(src[inp]))dst[out]=src[inp]});
 (parts.defense||[]).forEach(r=>{let x=get(r.Name);copy(x,r,{'Player Id':'Player Id','#':'#','POS':'POS','DEF':'DEF','DEF_GRD':'DEF','TKL':'TKL','AST':'AST','MT':'MT','STOP':'STOP','SK':'SK','HT':'HT','HU':'HU','TPR':'TPR','PBU':'PBU','INT':'INT','FF':'FF','CTGT':'CTGT'})});
 (parts.run||[]).forEach(r=>{let x=get(r.Name);copy(x,r,{'RUND_GRD':'RUND GRD','STOP':'STOP'})});
 (parts.coverage||[]).forEach(r=>{let x=get(r.Name);copy(x,r,{'COV_GRD':'COV','COV_SNAPS':'COV.1','CTGT':'CTGT','REC_ALLOWED':'REC ALL','COMP_PCT_ALLOWED':'COMP%','PASS_YDS_ALLOWED':'P YDS ALL','TD_ALLOWED':'TD','INT':'INT','PBU':'PBU','RTG_ALLOWED':'RTG'})});
 (parts.tackles||[]).forEach(r=>{let x=get(r.Name);copy(x,r,{'TKL':'TKL','AST':'AST','MT':'MT','STOP':'STOP','MT_PCT':'MT%'})});
 (parts.technique||[]).forEach(r=>{let x=get(r.Name);copy(x,r,{'PRSH':'PRSH','TPR':'TPR','PRESSURE_PCT':'PR%'})});
 return [...byName.values()].filter(r=>nonEmpty(r.Name));
}
async function fetchUABPlayerIntel(){
 await discoverUABBase();
 const files={defense:'pff-data (32).csv',run:'pff-data (34).csv',coverage:'pff-data (35).csv',tackles:'pff-data (49).csv',technique:'pff-data (48).csv'};
 const parts={},loaded=[];
 await Promise.all(Object.entries(files).map(async ([k,name])=>{
   try{parts[k]=await fetchCSVFile(name);loaded.push(name)}
   catch(e){parts[k]=[];console.warn(e)}
 }));
 let data=mergeUABPlayerIntelRows(parts);
 datasets.playerIntel=data;
 datasets.uabDefenseRaw=parts.defense||[];
 datasets.uabRunRaw=parts.run||[];
 datasets.uabCoverageRaw=parts.coverage||[];
 datasets.uabTacklesRaw=parts.tackles||[];
 datasets.uabTechniqueRaw=parts.technique||[];
 loadState.playerIntel={ok:data.length>0,n:data.length,file:loaded.join(' + ')};
 return data;
}

async function fetchCSV(key){
 if(activeOpponent==='UAB'&&key==='playerIntel')return fetchUABPlayerIntel();
 let candidates=Array.isArray(FILES[key])?FILES[key]:[FILES[key]];
 let lastErr='';
 for(const file of candidates){
   try{
     let url=activePffBase()+encodeURIComponent(file);
     let r=await fetchOpponentResource(url+'?v='+Date.now(),{cache:'no-store'});
     if(!r.ok){lastErr='HTTP '+r.status;continue}
     let data=parseCSV(await r.text());
     datasets[key]=data;
     loadState[key]={ok:true,n:data.length,file};
     return data
   }catch(e){lastErr=String(e)}
 }
 if(activeOpponent==='UAB'&&key==='tackling'&&UAB_TACKLING_FALLBACK.length){
   datasets[key]=UAB_TACKLING_FALLBACK;
   loadState[key]={ok:true,n:UAB_TACKLING_FALLBACK.length,file:'embedded fallback: pff-data (49).csv'};
   return datasets[key];
 }
 datasets[key]=[];
 loadState[key]={ok:false,n:0,error:lastErr||'not found'};
 return[]
}
function findPlayerRow(key,name){let n=cleanName(name);return (datasets[key]||[]).find(r=>cleanName(r.Name)===n)}
function findPlayerRows(key,name){let n=cleanName(name);return (datasets[key]||[]).filter(r=>cleanName(r.Name)===n)}
function playsForPlayer(value){
 let p=resolvePlayer(value);if(!p)return[];
 return (datasets.plays||[]).filter(r=>
   playerTokenMatch(r.pff_PASSER,p,'QB')||
   playerTokenMatch(r.pff_BALLCARRIER,p,'CARRIER')||
   playerTokenMatch(r.pff_PASSRECEIVERTARGET,p,'TARGET')
 );
}
function avg(arr){return arr.length?arr.reduce((a,b)=>a+num(b),0)/arr.length:0}
function dataStatus(){let labels={plays:'Play Feed',qb:'QB',receiving:'Receiving',routes:'Routes',dropbacks:'Dropbacks',passOverall:'Pass Overall',pressure:'Pressure',runConcepts:'Run Concepts',runDirections:'Point of Attack',runBlocking:'Run Block',passBlocking:'Pass Block',formations:'Formations',personnel:'Personnel',tackling:'Tackling'};return `<div class="data-status">${Object.entries(labels).map(([k,l])=>`<span class="data-chip ${loadState[k]?.ok?'ok':'bad'}">${loadState[k]?.ok?'✓':'×'} ${l}${loadState[k]?.ok?` · ${loadState[k].n}`:''}</span>`).join('')}</div>`}
function metric(label,val,sub=''){return `<div class="metric"><span>${esc(label)}</span><b>${esc(value(val))}</b>${sub?`<div class="subtle">${esc(sub)}</div>`:''}</div>`}
function detail(label,val){return `<div class="detail"><span>${label}</span><b>${esc(value(val))}</b></div>`}
function table(headers,rows){return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c??'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}

function freqToggle(){return `<div class="view-toggle"><button class="${freqMode==='raw'?'active':''}" onclick="setFreqMode('raw')">RAW</button><button class="${freqMode==='pct'?'active':''}" onclick="setFreqMode('pct')">%</button></div>`}
function freqVal(raw,percent,label='plays'){
 let r=num(raw),p=String(percent??'').trim(); if(p&&!p.includes('%'))p=p+'%'; if(!p)p='—';
 return freqMode==='raw'
   ? `<div class="freq-cell"><span class="primary-val">${esc(r)}</span> ${esc(label)}<small>${esc(p)}</small></div>`
   : `<div class="freq-cell"><span class="primary-val">${esc(p)}</span><small>${esc(r)} ${esc(label)}</small></div>`;
}
function countPctVal(total,percent,label='plays'){
 let t=num(total),pv=num(percent),raw=Math.round(t*pv/100),p=String(percent??'').trim();
 if(p&&!p.includes('%'))p=p+'%'; if(!p)p='—';
 return freqMode==='raw'
   ? `<div class="freq-cell"><span class="primary-val">${raw}</span> ${esc(label)}<small>${esc(p)}</small></div>`
   : `<div class="freq-cell"><span class="primary-val">${esc(p)}</span><small>${raw} ${esc(label)}</small></div>`;
}
function calcMedian(a){let x=a.map(num).filter(Number.isFinite).sort((a,b)=>a-b);if(!x.length)return 0;let m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2}

function dndDistanceBucket(dist){
 dist=num(dist);
 if(dist<=2)return'1-2';
 if(dist===3)return'3';
 if(dist<=6)return'4-6';
 if(dist<=9)return'7-9';
 if(dist<=12)return'10-12';
 return'13+';
}
function dndLabel(r){
 let dist=num(r?.pff_DISTANCE), down=Math.round(num(r?.pff_DOWN)), drivePlay=Math.round(num(r?.pff_DRIVEPLAY));
 // P & 10 = first offensive play of a possession/drive with 10 to go.
 if(drivePlay===1 && down===1 && dist===10)return'P & 10';
 if(down===1){
   if(dist>=15)return'1 & 15+';
   if(dist<=5)return'1 & 5';
   return'1 & 10';
 }
 if([2,3,4].includes(down))return `${down} & ${dndDistanceBucket(dist)}`;
 return'';
}
function dndOptions(){
 let a=[['ALL','All D&D'],['P & 10','P & 10'],['1 & 10','1 & 10'],['1 & 15+','1 & 15+'],['1 & 5','1 & 5']];
 [2,3,4].forEach(d=>['1-2','3','4-6','7-9','10-12','13+'].forEach(x=>a.push([`${d} & ${x}`,`${d} & ${x}`])));
 return a;
}
function dndSelect(onchange='setDndFilter(this.value)'){
 return `<label>Down & Distance<select onchange="${onchange}">${dndOptions().map(([v,l])=>`<option value="${v}" ${dndFilter===v?'selected':''}>${l}</option>`).join('')}</select></label>`;
}
function dndMatches(r){return dndFilter==='ALL'||dndLabel(r)===dndFilter}
function p10Rows(rows){return rows.filter(r=>dndLabel(r)==='P & 10')}
function addP10Breakdown(arr,rows,metricsFn){
 let a=p10Rows(rows);
 if(!a.length)return arr;
 return [{k:'P & 10',...metricsFn(a)},...arr.filter(x=>x.k!=='P & 10')];
}

function isManCov(c){c=String(c||'').toUpperCase();return c==='COVER 0'||c==='COVER 1'||c==='COVER 2 MAN'||c.includes('2 MAN')}
function throwRows(){return (datasets.plays||[]).filter(r=>r.pff_RUNPASS==='P' && r.pff_PASSER && (r.pff_PASSDEPTH!==''||r.pff_PASSWIDTH!==''||r.pff_PASSZONE))}

function heatQBOptions(){
 let rows=throwRows(), map=new Map();
 rows.forEach(r=>{
   let raw=String(r.pff_PASSER||'').trim();
   if(!raw)return;
   let m=raw.match(/^(.*?)(?:\s+(\d+))?(?:\s*\(QB\))?$/i);
   let name=(m?.[1]||raw).trim(),numbr=(m?.[2]||'').trim();
   let clean=name.replace(/\s*\(QB\)\s*/ig,'').trim();
   let key=raw;
   let label=clean;
   // Historical PFF often uses team code + jersey number. Try to match current roster by number when possible.
   if((!clean || /^[A-Z]{2,5}$/.test(clean)) && numbr){
     let rp=roster.find(p=>normPos(p.position)==='QB' && String(p.number||'').trim()===String(parseInt(numbr,10)));
     if(rp)label=`${rp.name} #${rp.number}`;
     else label=`${clean||'QB'} #${parseInt(numbr,10)}`;
   }else if(numbr){
     label=`${clean} #${parseInt(numbr,10)}`;
   }
   if(!map.has(key))map.set(key,label);
 });
 return [...map.entries()].sort((a,b)=>a[1].localeCompare(b[1]));
}
function heatQBMatches(r){
 if(heatQB==='ALL')return true;
 return String(r.pff_PASSER||'').trim()===heatQB;
}
function sideLabel(col){
 return ['Def Left Sideline','Def Left Hash','Middle','Def Right Hash','Def Right Sideline'][col];
}
function hashLabel(v){
 if(v==='L')return 'Def Right Hash';
 if(v==='R')return 'Def Left Hash';
 if(v==='C')return 'Middle';
 if(v==='ALL')return 'All Hashes';
 return 'Unknown';
}
function qbHeatLeft(){
 return heatHash==='R'?'25%':heatHash==='L'?'75%':'50%';
}

function qbLeftFromRows(rows){
 let counts={L:0,C:0,R:0};
 rows.forEach(r=>{let h=normHash(r.pff_HASH); if(h==='L'||h==='C'||h==='R')counts[h]++;});
 if(counts.R>=counts.L && counts.R>=counts.C && counts.R>0) return '25%';
 if(counts.L>=counts.R && counts.L>=counts.C && counts.L>0) return '75%';
 return '50%';
}

function heatFiltered(){
 let rows=throwRows();
 if(heatScope==='man')rows=rows.filter(r=>isManCov(r.pff_PASS_COVERAGE_BASIC));
 if(heatScope==='zone')rows=rows.filter(r=>r.pff_PASS_COVERAGE_BASIC&&!isManCov(r.pff_PASS_COVERAGE_BASIC));
 if(heatScope==='coverage'&&heatCoverage!=='ALL')rows=rows.filter(r=>r.pff_PASS_COVERAGE_BASIC===heatCoverage);
 if(heatHash!=='ALL')rows=rows.filter(r=>{
   let h=String(r.pff_HASH||'').trim().toUpperCase();
   let bucket=h.startsWith('L')?'L':h.startsWith('R')?'R':'C';
   return bucket===heatHash;
 });
 rows=rows.filter(dndMatches).filter(heatQBMatches);
 return rows;
}
function heatMetricHit(r){
 let result=passResult(r),gain=num(r.pff_GAINLOSSNET||r.pff_GAINLOSS);
 if(heatMetric==='completions')return result==='COMPLETE';
 if(heatMetric==='explosives')return gain>=15;
 if(heatMetric==='td')return isPassTouchdown(r);
 if(heatMetric==='int')return isInterception(r);
 if(heatMetric==='yards')return true;
 return ['COMPLETE','INCOMPLETE','INTERCEPTION','THROWN AWAY','HIT AS THREW','BATTED PASS'].includes(result)||result!=='';
}
function heatBin(r){
 let w=num(r.pff_PASSWIDTH),d=num(r.pff_PASSDEPTH);
 if(!Number.isFinite(w)||w===0){
   let dir=String(r.pff_PASSDIRECTION||'').toUpperCase();
   w=dir==='L'?8:dir==='R'?45:26.5;
 }
 let offCol=Math.max(0,Math.min(4,Math.floor((w/53.34)*5)));
 let col=4-offCol;
 let row=d<0?0:d<10?1:d<20?2:3;
 return [row,col];
}
function heatmapPage(){
 let base=heatFiltered(), attempts=base.filter(r=>heatMetricHit(r));
 let cells=Array.from({length:20},()=>({n:0,y:0,att:0,comp:0}));
 base.forEach(r=>{let [rr,cc]=heatBin(r),c=cells[rr*5+cc],res=String(r.pff_PASSRESULT||'').toUpperCase();c.att++;if(res==='COMPLETE')c.comp++;});
 attempts.forEach(r=>{let [rr,cc]=heatBin(r),c=cells[rr*5+cc];c.n++;c.y+=num(r.pff_GAINLOSSNET||r.pff_GAINLOSS)});
 let max=Math.max(1,...cells.map(c=>heatMetric==='yards'?c.y:c.n)),total=heatMetric==='yards'?cells.reduce((s,c)=>s+c.y,0):cells.reduce((s,c)=>s+c.n,0);
 let covs=[...new Set(throwRows().map(r=>r.pff_PASS_COVERAGE_BASIC).filter(Boolean))].sort();
 let att=base.filter(r=>['COMPLETE','INCOMPLETE','INTERCEPTION','THROWN AWAY','HIT AS THREW','BATTED PASS'].includes(String(r.pff_PASSRESULT||'').toUpperCase())).length;
 let comp=base.filter(r=>String(r.pff_PASSRESULT||'').toUpperCase()==='COMPLETE').length;
 let gains=base.map(r=>num(r.pff_GAINLOSSNET||r.pff_GAINLOSS)),expl=gains.filter(x=>x>=15).length,neg=gains.filter(x=>x<=0).length,td=base.filter(isPassTouchdown).length,ints=base.filter(isInterception).length;
 let labels=['Behind LOS','0–9','10–19','20+'];
 return `<div class="page-title"><h2>Passing Heat Maps</h2><p>${activeOpponentName()} target location by all throws, man/zone and every tagged coverage.</p></div>${dataStatus()}
 <div class="card">
   <div class="heat-controls">
    <div class="view-toggle">${[['all','ALL'],['man','MAN'],['zone','ZONE'],['coverage','COVERAGE']].map(([v,l])=>`<button class="${heatScope===v?'active':''}" onclick="setHeatScope('${v}')">${l}</button>`).join('')}</div>
    ${heatScope==='coverage'?`<select onchange="setHeatCoverage(this.value)"><option value="ALL">All coverages</option>${covs.map(c=>`<option ${heatCoverage===c?'selected':''}>${esc(c)}</option>`).join('')}</select>`:''}
    <select onchange="setHeatHash(this.value)"><option value="ALL" ${heatHash==='ALL'?'selected':''}>All Hashes</option><option value="R" ${heatHash==='R'?'selected':''}>Def Left Hash</option><option value="C" ${heatHash==='C'?'selected':''}>Middle</option><option value="L" ${heatHash==='L'?'selected':''}>Def Right Hash</option></select>
    <select onchange="setHeatQB(this.value)"><option value="ALL" ${heatQB==='ALL'?'selected':''}>All QBs</option>${heatQBOptions().map(([v,l])=>`<option value="${esc(v)}" ${heatQB===v?'selected':''}>${esc(l)}</option>`).join('')}</select>
    <select onchange="setHeatMetric(this.value)">${[['attempts','Attempts'],['completions','Completions'],['explosives','Explosives 15+'],['td','Touchdowns'],['int','Interceptions'],['yards','Yards']].map(([v,l])=>`<option value="${v}" ${heatMetric===v?'selected':''}>${l}</option>`).join('')}</select>
    ${dndSelect()}
    ${freqToggle()}
   </div>
   <div class="heat-summary">${metric('Attempts',att)}${metric('Completions',comp)}${metric('Comp %',pct(100*comp/Math.max(1,att)))}${metric('YPP',fmt(avg(gains),2))}${metric('Median YPP',fmt(calcMedian(gains),1))}${metric('Explosives',expl)}${metric('Pass TD',td)}${metric('INT',ints)}</div>
   <div class="heat-field">
     <div class="heat-los">
       <div class="heat-los-label">LOS</div>
       <div class="heat-qb-marker" style="left:${qbHeatLeft()}">QB</div>
     </div>
     <div class="heat-grid heat-grid-4">${cells.map((c,i)=>{let v=heatMetric==='yards'?c.y:c.n,p=100*v/Math.max(1,total),op=.08+.82*(v/max);return `<div class="heat-cell ${v?'':'zero'}" style="background:rgba(138,36,50,${op.toFixed(2)})"><b>${freqMode==='raw'?Math.round(v):fmt(p,1)+'%'}</b><span>${labels[Math.floor(i/5)]} · ${sideLabel(i%5)}</span><small>${freqMode==='raw'?fmt(p,1)+'%':Math.round(v)+' raw'}</small></div>`}).join('')}</div>
   </div>
   <div class="heat-axis"><span>DEF LEFT</span><span>DEFENSIVE VIEW</span><span>DEF RIGHT</span></div>
 </div>`;
}

function playerSummary(p){let pos=normPos(p.position),q=findPlayerRow('qb',p.name),rec=findPlayerRow('receiving',p.name),pb=findPlayerRow('passBlocking',p.name),rb=findPlayerRow('runBlocking',p.name);if(pos==='QB'&&q)return [[q['PASS GRD'],'Pass Grade'],[q['PASS YDS'],'Pass Yds'],[q['PASS TD'],'TD']];if((pos==='WR'||pos==='TE'||pos==='RB')&&rec)return [[rec['TGT'],'Targets'],[rec['REC YDS'],'Rec Yds'],[rec['REC TD'],'TD']];if(pos==='OL'&&pb)return [[pb['PBLK GRD'],'PB Grade'],[pb['PBLK'],'PB Snaps'],[pb['PR'],'Pressures']];if(pos==='OL'&&rb)return [[rb['RBLK GRD'],'RB Grade'],[rb['RBLK'],'RB Snaps'],[rb['DEFEATED RBLK'],'Defeated']];return [[p.number||'—','Number'],[pos,'Group'],[p.image?'✓':'—','Photo']]}

function playYear(r){return String(firstField(r,['pff_GAMEDATE'])||'').slice(0,4)}
function seasonPlayerToken(p,year){
 if(activeOpponent==='SA'){let r=piSummaryByVerifiedName(p);return r?'ALSO D'+jerseyNum(r['#']).padStart(2,'0'):'';}
 let j='',prefix=activeOpponent==='SA'?'ALSO':activeOpponent==='FAU'?'FLAT':activeOpponent==='MSST'?'MSST':activeOpponent==='SELA'?'LASE':'ALBI';
 if(String(year)==='2025'){
   if(activeOpponent==='SELA'){
     let hp=(historicalRoster||[]).find(x=>loosePlayerName(x.name)===loosePlayerName(p?.name));
     let row=selaDirectRow(SELA_PFF_50,p)||selaDirectRow(SELA_PFF_61,p)||selaDirectRow(SELA_PFF_62,p)||selaDirectRow(SELA_PFF_54,p);
     j=jerseyNum(hp?.number)||jerseyNum(row?.['#']);
   }else{
     let row=uabDirectRow(UAB_PFF_32,p)||uabDirectRow(UAB_PFF_34,p)||uabDirectRow(UAB_PFF_35,p)||uabDirectRow(UAB_PFF_49,p);
     j=jerseyNum(row?.['#']);
   }
 }else j=jerseyNum(p?.number);
 return j?`${prefix} D${String(parseInt(j,10)).padStart(2,'0')}`:'';
}
function seasonFieldMatches(v,p,year){
 if(!nonEmpty(v)||!p)return false;
 if(cleanName(v)===cleanName(p.name))return true;
 let tok=seasonPlayerToken(p,year);
 return !!(tok&&String(v).toUpperCase().includes(tok));
}
function seasonEventRows(p,year=playerIntelSeason){
 let fields=['pff_TACKLE','pff_TACKLEASSIST','pff_STOP','pff_SACK','pff_QBPRESSURE','pff_INTERCEPTION','pff_PASSBREAKUP','pff_FORCEDFUMBLE','pff_MISSEDTACKLE','pff_PASSCOVERAGEPLAYERS'];
 return dashboardPlayRows().filter(r=>playYear(r)===String(year)&&fields.some(k=>seasonFieldMatches(r?.[k],p,year)));
}
function seasonProductionStats(p,year=playerIntelSeason){
 let rows=seasonEventRows(p,year),s={rows:rows.length,tackles:0,assists:0,stops:0,sacks:0,pressures:0,ints:0,pbu:0,ff:0,mt:0,covSnaps:0};
 rows.forEach(r=>{
   if(seasonFieldMatches(r.pff_TACKLE,p,year))s.tackles++;
   if(seasonFieldMatches(r.pff_TACKLEASSIST,p,year))s.assists++;
   if(seasonFieldMatches(r.pff_STOP,p,year))s.stops++;
   if(seasonFieldMatches(r.pff_SACK,p,year))s.sacks++;
   if(seasonFieldMatches(r.pff_QBPRESSURE,p,year))s.pressures++;
   if(seasonFieldMatches(r.pff_INTERCEPTION,p,year))s.ints++;
   if(seasonFieldMatches(r.pff_PASSBREAKUP,p,year))s.pbu++;
   if(seasonFieldMatches(r.pff_FORCEDFUMBLE,p,year))s.ff++;
   if(seasonFieldMatches(r.pff_MISSEDTACKLE,p,year))s.mt++;
   if(seasonFieldMatches(r.pff_PASSCOVERAGEPLAYERS,p,year))s.covSnaps++;
 });
 return s;
}
function piSeasonStats(p){
 if(!supportsSeasonSplit()||playerIntelSeason==='2025')return piStats(p);
 let e=seasonProductionStats(p,'2026');
 return {
   rows:e.rows,tackles:e.tackles,assists:e.assists,stops:e.stops,sacks:e.sacks,pressures:e.pressures,
   targets:'—',comp:'—',ints:e.ints,td:'—',pbu:e.pbu,mt:e.mt,covSnaps:e.covSnaps,
   compPct:'—',passYds:'—',rating:'—',manPct:'—',zonePct:'—',runGrade:'—',rushGrade:'—',covGrade:'—',prWin:'—',prPct:'—',verified:true
 };
}
function piSeasonCardMetrics(p){
 let pos=normPos(p.position);
 if(!supportsSeasonSplit())return null;
 if(playerIntelSeason==='2025'){
   let s=piStats(p);
   if(!s.verified)return [['DEF SNAPS','—'],['TACKLES','—'],['STOPS','—'],['MISSED','—']];
   if(pos==='DL')return [['DEF SNAPS',s.rows],['TACKLES',s.tackles],['PRESS',s.pressures],['SACKS',s.sacks]];
   if(pos==='LB')return [['DEF SNAPS',s.rows],['TACKLES',s.tackles],['STOPS',s.stops],['MISSED',s.mt]];
   return [['DEF SNAPS',s.rows],['TARGETS',s.targets],['PBU',s.pbu],['INT',s.ints]];
 }
 let e=seasonProductionStats(p,'2026');
 if(pos==='DL')return [['TAGGED',e.rows],['TACKLES',e.tackles],['PRESS',e.pressures],['SACKS',e.sacks]];
 if(pos==='LB')return [['TAGGED',e.rows],['TACKLES',e.tackles],['STOPS',e.stops],['MISSED',e.mt]];
 return [['COV SNAPS',e.covSnaps],['TACKLES',e.tackles],['PBU',e.pbu],['INT',e.ints]];
}
