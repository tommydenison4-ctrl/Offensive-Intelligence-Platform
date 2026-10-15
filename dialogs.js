let actionBusy=false;
function askAction(message,textMode=false){if(actionBusy)return Promise.resolve(textMode?null:false);actionBusy=true;const d=$('actionDialog');$('actionMessage').textContent=message;$('actionInputWrap').hidden=!textMode;$('actionInput').value='';$('actionAccept').textContent=textMode?'Apply':'Confirm';d.returnValue='';return new Promise(resolve=>{d.addEventListener('close',()=>{actionBusy=false;resolve(d.returnValue==='accept'?(textMode?$('actionInput').value:true):textMode?null:false)},{once:true});d.showModal();if(textMode)$('actionInput').focus()})}
function askConfirm(message){return askAction(message,false)}
function askText(message){return askAction(message,true)}
