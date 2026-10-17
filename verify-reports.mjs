import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import os from 'node:os';import path from 'node:path';
// Reuse the app's regression fixture, then exercise PDF output with the real PDF libraries.
const original=fs.readFileSync('verify.mjs','utf8');
const fixture=original.slice(original.indexOf('const html='),original.indexOf('assert.equal(run("parseCSV'));
const require=createRequire(import.meta.url),temp=fs.mkdtempSync(path.join(os.tmpdir(),'intel-pdf-')),bundle=path.join(temp,'jspdf.cjs');fs.copyFileSync('vendor/jspdf.umd.min.js',bundle);const {jsPDF}=require(bundle);fs.rmSync(temp,{recursive:true});
const test=fixture+`
c.window=c;c.jspdf={jsPDF};
vm.runInContext(fs.readFileSync('vendor/jspdf.plugin.autotable.min.js','utf8'),c);
vm.runInContext(fs.readFileSync('pdf-export.js','utf8'),c);
run("state={event:'report-verification',team:'A'};meta=null;mode='offense';plays=[{id:'p',team:'A',quarter:1,clock:'14:00',down:1,distance:10,driveStart:true,gain:34,result:'Complete',scrimmage:true},{id:'f',team:'A',quarter:1,clock:'13:00',down:1,distance:10,gain:16,result:'Complete',scrimmage:true},{id:'g',team:'A',quarter:1,clock:'12:00',down:1,distance:2,goalToGo:true,gain:2,result:'Rush',scrimmage:true},{id:'d',team:'B',quarter:1,clock:'11:00',down:2,distance:3,gain:0,result:'Incomplete',scrimmage:true}];records={p:{saved:true,tags:{Call:'Call A','Play family':'RPO','Play type':'Pass','Throw lateral':-7,'Air yards':12}},f:{saved:true,tags:{Call:'Call B','Play family':'Dropback','Play type':'Pass'}},g:{saved:true,tags:{Call:'Goal run','Play type':'Run'}},d:{saved:true,tags:{'Defensive call':'Test front coverage','Play type':'Pass','Throw lateral':4,'Air yards':15}}};");
for(const side of ['offense','defense']){
 run('mode='+JSON.stringify(side));const chart=run('situationChart(ours())');
 assert(chart.includes('<th scope="col">P &amp; 10</th>'));assert(chart.includes('<th scope="col">1 &amp; 10</th>'));
 assert(chart.includes('rowspan="'+(side==='offense'?4:6)+'"'));
 if(side==='offense'){assert(chart.includes('1 &amp; Goal'));assert(chart.includes('P &amp; 10 · 1 snaps · Average 34.0'));assert(chart.includes('1 &amp; 10 · 1 snaps · Average 16.0'))}
 for(const kind of ['coach','plays']){const pdf=run('buildHalftimePDF('+JSON.stringify(side)+','+JSON.stringify(kind)+')');assert.equal(run('mode'),side);if(kind==='coach')assert.equal(pdf.getNumberOfPages(),2);const data=Buffer.from(pdf.output('arraybuffer'));assert.equal(data.subarray(0,5).toString(),'%PDF-');fs.mkdirSync('../pdf-qa',{recursive:true});fs.writeFileSync('../pdf-qa/'+side+'-'+kind+'.pdf',data)}
}
console.log('PASS: separate possession/first-down columns with correct counts, visible goal-to-go, offense/defense ranges, real two-page coach PDFs and grouped PDFs, and mode preservation.');
`;
// The fixture uses lexical bindings; evaluate it together with the assertions.
const runner=new Function('fs','vm','assert','jsPDF',test);runner(fs,vm,assert,jsPDF);