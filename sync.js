/* One charting browser publishes; private view links receive saved snapshots. */
let shareStarting=false;
function revealSharing(){document.body.classList.add('sharing-open');$('sharedPanel').scrollIntoView({behavior:'smooth',block:'center'})}
function hideSharing(){document.body.classList.remove('sharing-open')}
let sharedWriter=null,sharedViewer=null,syncSending=false,syncQueued=false,syncLast='',watchBusy=false,watchVersion=0,syncConflict=false;
function syncStatus(text){$('sharedStatus').textContent=text}
function sessionSnapshot(){return {event:state.event,team:state.team,plays,records,seen,meta}}
async function sessionRequest(body,token='',staffCode=''){const r=await fetch('/api/session'+(body.id?'?id='+encodeURIComponent(body.id):''),{method:body.action?'POST':'GET',headers:{...(body.action?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...(staffCode?{'X-Staff-Code':staffCode}:{})},credentials:'same-origin',cache:'no-store',signal:typeof AbortSignal!=='undefined'?AbortSignal.timeout(15000):undefined,...(body.action?{body:JSON.stringify(body)}:{})});const j=await r.json();if(!r.ok){const e=Error(j.error||'Sharing request failed');e.status=r.status;throw e}return j}
function saveSharedWriter(){if(sharedWriter)localStorage.setItem('ulm-shared-writer-'+sharedWriter.event,JSON.stringify(sharedWriter))}
function showShareLink(){if(!sharedWriter)return;const url=location.origin+'/?side='+mode+'#watch='+sharedWriter.id+'.'+sharedWriter.readToken;$('sharedLink').value=url;$('sharedLinkRow').classList.remove('hidden');$('stopSharing').classList.remove('hidden')}
async function startSharing(){
 revealSharing();
 if(sharedViewer)return syncStatus('This screen is viewing a shared game. Chart on the sharing device.');
 if(!state.event)return syncStatus('Connect a game or start a manual game before sharing.');
 if(shareStarting)return;
 if(sharedWriter?.event===state.event){showShareLink();return}
 shareStarting=true;syncStatus('Connecting live sharing…');
 try{
 if(dirty){await save();if(dirty)throw Error('Save your charting changes before sharing.')}
 const snapshot=structuredClone(sessionSnapshot());let j;
 try{j=await sessionRequest({action:'create',snapshot})}catch(e){
 if(e.status!==401)throw e;
 const code=await askText('Enter the same staff code used for Jesse’s call sheet');
 if(!code){syncStatus('Sharing cancelled. Tap Share live dashboard to try again.');return}
 syncStatus('Connecting live sharing…');j=await sessionRequest({action:'create',snapshot},'',code)
 }
 sharedWriter={...j,event:snapshot.event};syncConflict=false;syncLast=JSON.stringify(snapshot);saveSharedWriter();showShareLink();syncStatus('Sharing · chart on this device · other screens update about every 5 seconds');if(state.event===snapshot.event)queueSharedSave();
 }catch(e){syncStatus('Not sharing · '+e.message)}finally{shareStarting=false}
}
async function copySharedLink(){showShareLink();if(!sharedWriter)return;try{await navigator.clipboard.writeText($('sharedLink').value);syncStatus('Viewing link copied. Open it on the other iPads or computers.')}catch{$('sharedLink').focus();$('sharedLink').select();syncStatus('Select and copy the viewing link shown above.')}}
function queueSharedSave(){if(!sharedWriter||sharedViewer||sharedWriter.event!==state.event||syncConflict)return;syncQueued=true;flushSharedSave()}
async function flushSharedSave(){if(syncSending||!syncQueued||!sharedWriter||syncConflict)return;const w=sharedWriter;if(w.event!==state.event)return;syncSending=true;syncQueued=false;const snapshot=structuredClone(sessionSnapshot()),serialized=JSON.stringify(snapshot);try{if(serialized!==syncLast){const j=await sessionRequest({action:'update',id:w.id,version:w.version,snapshot},w.writeToken);w.version=j.version;syncLast=serialized;saveSharedWriter()}syncStatus('Sharing · cloud saved '+new Date().toLocaleTimeString()+' · viewers refresh every 5 sec')}catch(e){syncQueued=true;if([409,410].includes(e.status)){syncConflict=true;syncStatus('Sharing paused · '+e.message)}else syncStatus('Sharing delayed · local tags are saved · retrying automatically')}finally{syncSending=false;if(syncQueued&&!syncConflict)setTimeout(flushSharedSave,1500)}}
async function stopSharing(){if(!sharedWriter)return;const w=sharedWriter;if(!await askConfirm('Stop live updates to this viewing link? The final shared snapshot will remain available. Your charting and call sheets stay saved.'))return;await endSharedSession(w)}
async function endSharedSession(w){try{if(syncSending){syncStatus('Cloud save in progress. Try stopping again in a moment.');return false}if(w.event===state.event&&!syncConflict){syncQueued=true;await flushSharedSave();if(syncQueued)throw Error('Finish cloud saving before stopping')}await sessionRequest({action:'end',id:w.id,version:w.version},w.writeToken);localStorage.removeItem('ulm-shared-writer-'+w.event);sharedWriter=null;syncQueued=false;$('sharedLinkRow').classList.add('hidden');$('stopSharing').classList.add('hidden');syncStatus('Sharing ended · viewers retain the final snapshot');return true}catch(e){syncStatus('Could not stop sharing · '+e.message);return false}}
async function pollSharedView(){if(!sharedViewer||watchBusy)return;watchBusy=true;try{const j=await sessionRequest({id:sharedViewer.id},sharedViewer.token);if(j.version!==watchVersion){watchVersion=j.version;const s=j.snapshot;state={event:s.event,team:s.team};plays=s.plays;records=s.records;seen=s.seen||{};meta=s.meta;selected=null;draft={};overrides={};dirty=false;baselineReady=true;$('score').textContent=meta?.teams?.map(t=>t.abbr+' '+t.score).join(' — ')||'Shared game';$('clock').textContent=meta?.status||'';render();tab('dashboard')}const age=Math.max(0,Math.round((Date.now()-Date.parse(j.updatedAt))/1000));syncStatus((j.ended?'Sharing ended · final snapshot':'VIEW ONLY · last charting update '+age+' seconds ago')+' · '+new Date(j.updatedAt).toLocaleTimeString());$('feed').textContent='Shared dashboard · refresh every 5 sec'}catch(e){syncStatus('Viewer disconnected · '+e.message+' · retrying')}finally{watchBusy=false}}
function leaveSharedView(){sessionStorage.removeItem('ulm-shared-viewer');location.href=location.pathname+'?side='+mode}
function initSharing(){const match=location.hash.match(/^#watch=([a-f0-9-]{36})\.([a-f0-9]{64})$/);if(match){sharedViewer={id:match[1],token:match[2]};sessionStorage.setItem('ulm-shared-viewer',JSON.stringify(sharedViewer));history.replaceState(null,'',location.pathname+location.search)}else{try{sharedViewer=JSON.parse(sessionStorage.getItem('ulm-shared-viewer')||'null')}catch{}}if(sharedViewer){document.body.classList.add('shared-viewer');$('leaveSharedView').classList.remove('hidden');syncStatus('Connecting to shared dashboard…');tab('dashboard');pollSharedView()}else if(state.event){try{sharedWriter=JSON.parse(localStorage.getItem('ulm-shared-writer-'+state.event)||'null')}catch{}if(sharedWriter){showShareLink();syncStatus('Resuming sharing…');queueSharedSave()}}}
// Keep local writes authoritative; viewers never write into the charting browser's storage.
const localPersist=persist;persist=async function(...args){if(sharedViewer)return;await localPersist(...args);queueSharedSave()};
const localRefresh=refresh;refresh=async function(...args){if(sharedViewer)return;await localRefresh(...args);queueSharedSave()};
for(const name of ['save','newSnap','applyCall','manualGame','connect','deleteCurrentGame','restoreGame','setTeam']){const original=window[name];if(typeof original==='function')window[name]=async function(...args){if(sharedViewer)return notice('This is a view-only screen. Chart on the sharing device.');if(['manualGame','connect','deleteCurrentGame','restoreGame','setTeam'].includes(name)&&sharedWriter)return notice('Stop sharing before changing or deleting the game or selected team.');return original(...args)}}
const localTab=tab;tab=function(v){return localTab(sharedViewer&&['chart','calls','reconcile','setup'].includes(v)?'dashboard':v)};
initSharing();setInterval(()=>{if(document.hidden)return;if(sharedViewer)pollSharedView();else queueSharedSave()},5000);