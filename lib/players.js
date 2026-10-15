// Extract only explicitly identified participants; preserve source wording.
export function playersFromText(description,result){
 const text=String(description||'').split(/\(Original Play:/i)[0];
 const named='#\\d+\\s+[A-Z][\\w.\u2019\u0027-]*(?:\\s+(?:Jr\\.?|Sr\\.?|III|IV|II|V))?';
 const before=verb=>text.match(new RegExp('('+named+')\\s+'+verb,'i'))?.[1]||'';
 const passer=['Complete','Incomplete','Interception','Sack'].includes(result)?before('(?:pass(?:es|ed)?|sacked|sack)\\b'):'';
 const carrier=['Rush','Scramble'].includes(result)?before('(?:rush(?:es|ed)?|run(?:s)?|scrambl(?:e|es|ed))\\b')||text.match(new RegExp('Kneel down by\\s+('+named+')','i'))?.[1]||'':'';
 const target=['Complete','Incomplete','Interception'].includes(result)?text.match(new RegExp('(?:\\bto|intended for)\\s+('+named+')','i'))?.[1]||'':'';
 let tacklers=[];
 if(['Rush','Scramble','Complete','Sack'].includes(result)){
  const block=text.match(/\((#[^)]+)\)/)?.[1];
  if(block)tacklers=block.match(new RegExp(named,'g'))||[];
 }
 return {passer,ballCarrier:carrier,target,tackler:tacklers.join('; ')};
}
