/* Direct PDF downloads also work in browsers without a print dialog. */
function pdfText(value){return String(value??'').replaceAll('–','-').replaceAll('—','-').replaceAll('−','-').replaceAll('’',"'").replaceAll('·',' / ')}
function buildHalftimePDF(side,kind='coach'){
 const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape',unit:'mm',format:'letter'}),old=mode;
 try{
 mode=side;const rows=halftimeRows(side),stats=summary(rows),w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();
 const header=subtitle=>{doc.setFillColor(255,255,255);doc.rect(0,0,w,h,'F');doc.setFillColor(117,39,60);doc.rect(0,0,w,24,'F');doc.setFillColor(231,181,83);doc.rect(0,24,w,1.3,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(22);doc.text('ULM',10,12);doc.setFontSize(8);doc.text('WARHAWKS FOOTBALL',10,19);doc.setFontSize(13);doc.text(pdfText(side.toUpperCase()+' / '+subtitle),65,11);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(pdfText((meta?.teams?.map(t=>t.abbr+' '+(t.score??'')).join(' / ')||state.event)+' / FIRST HALF / Q1-2'),65,18);doc.setTextColor(28,48,66)};
 const table=(title,heads,body,x,y,width,small=false)=>{doc.setFontSize(11);doc.setTextColor(28,48,66);doc.text(pdfText(title),x,y);doc.autoTable({head:[heads.map(pdfText)],body:body.map(r=>r.map(pdfText)),startY:y+3,margin:{left:x,right:w-x-width,bottom:12,top:26},tableWidth:width,styles:{fontSize:small?(side==='defense'?6:6.5):8,cellPadding:small?(side==='defense'?.75:1.2):1.8,overflow:'linebreak'},headStyles:{fillColor:[117,39,60]},alternateRowStyles:{fillColor:[241,245,248]},showHead:'everyPage'});return doc.lastAutoTable.finalY};
 const notes='Saved, attached Q1-2 plays only. Fourth downs included. Pending, no-plays and disputed links excluded from production. Unknown target locations are not inferred.';
 if(kind==='plays'){
 header('D&D PLAY LIST');let y=28;
 for(const [key,group] of orderedSituations(halftimeRows(side,{details:true}),side)){
 if(y>h-35){doc.addPage();header('D&D PLAY LIST');y=28}
 const valid=group.filter(p=>result(p)!=='No play'&&records[p.id]?.matchStatus!=='needs-review'),s=summary(valid);
 const body=group.map(p=>[p.reportPlayNumber,'Q'+p.quarter+' '+(p.clock||''),playDownCode(p)+' & '+(p.distance??'?'),filmFieldPosition(p),tag(p,'Personnel'),side==='offense'?(tag(p,'Call')||tag(p,'Tempo')||tag(p,'Formation')):(tag(p,'Front / Game / Blitz')||tag(p,'Called front')||tag(p,'Defensive call')),side==='offense'?tag(p,'Motion'):tag(p,'Called coverage'),tag(p,'Play family'),tag(p,'Play type'),[result(p),...playResults(p.tags),records[p.id]?.matchStatus==='needs-review'?'REVIEW':''].filter(Boolean).join(' / '),p.gain??'',receiverNumber(p)?'#'+receiverNumber(p):p.target||'']);
 y=table(key+' / '+group.length+' plays / Avg '+fmt(s.ypp)+' / Median '+fmt(s.median),['#','Q / Clock','D & D','Field','Pers',side==='offense'?'Call / Tempo / Formation':'Front / Game / Blitz',side==='offense'?'Motion':'Coverage','Family','Type','Result','Gain','Target'],body,10,y,w-20,true)+9;
 }
 if(!halftimeRows(side,{details:true}).length){doc.setFontSize(12);doc.text('No charted first-half plays for this side.',10,35)}
 }else{
 header('COACH SUMMARY');doc.setFontSize(10);doc.text('Snaps '+stats.n+'     Yards '+stats.yards+'     Avg YPP '+fmt(stats.ypp)+'     Median YPP '+fmt(stats.median)+'     Explosive '+fmt(stats.exp,0)+'%     Negative '+fmt(stats.neg,0)+'%',10,28);
 const production=(title,key,x,y)=>table(title,['Group','n','Yards','Avg','Median'],groupBy(rows,p=>tag(p,key)||'Untagged').sort((a,b)=>b[1].length-a[1].length).slice(0,6).map(([k,r])=>{const s=summary(r);return [k,s.n,s.yards,fmt(s.ypp),fmt(s.median)]}),x,y,124,true);

 if(side==='defense'){
 const pct=(n,d)=>n+(d?' ('+fmt(100*n/d,0)+'%)':'');
 const top=(r,key)=>{const g=groupBy(r,p=>defenseAttackKey(p,key)).sort((a,b)=>b[1].length-a[1].length);return g.length?g.filter(x=>x[1].length===g[0][1].length).map(([k,a])=>k+' '+pct(a.length,r.length)).join(' / '):'-'};
 const familyRows=defenseCoverageGroups(rows).map(([name,r])=>{const s=summary(r),a=r.filter(p=>['Complete','Incomplete','Interception'].includes(result(p))),c=a.filter(p=>result(p)==='Complete').length;return [name,pct(r.length,rows.length),fmt(s.ypp),fmt(s.median),c+'/'+a.length+(a.length?' ('+fmt(c/a.length*100,0)+'%)':''),s.td+'/'+s.int]});
 table('OUR CALLS / MAN & ZONE RESULTS',['Call type','n (%)','Avg','Median','Comp allowed','TD/INT'],familyRows,10,38,124,true);
 let mixX=10;for(const [label,group] of defenseCoverageGroups(rows)){const share=rows.length?group.length/rows.length:0,width=124*share;if(width){doc.setFillColor(...({Man:[231,181,83],Zone:[88,166,255],Unclassified:[126,137,151]}[label]));doc.rect(mixX,63,width,5,'F');mixX+=width}}doc.setFontSize(6);doc.setTextColor(28,48,66);doc.text('CALL MIX: MAN (GOLD) / ZONE (BLUE) / UNCLASSIFIED (GREY)',10,72);
 const groups=defenseTendencyGroups(rows,true,true);
 table('OUR CALLS BY DOWN & DISTANCE',['D & D','n','Man n (%)','Zone n (%)','Unclass. n (%)'],groups.map(([k,r])=>[k,r.length,...defenseCoverageGroups(r).map(([,a])=>pct(a.length,r.length))]),10,76,124,true);
 table('HOW THEY ATTACK BY DOWN & DISTANCE',['D & D','n','Run n (%)','Pass n (%)','Top personnel','Top play family','Avg','Med'],groups.map(([k,r])=>{const s=summary(r);return [k,r.length,pct(r.filter(p=>jesseRunPass(p)==='Run').length,r.length),pct(r.filter(p=>jesseRunPass(p)==='Pass').length,r.length),top(r,'Personnel'),top(r,'Play family'),fmt(s.ypp),fmt(s.median)]}),145,38,124,true);
 doc.setTextColor(28,48,66);doc.setFontSize(7);doc.text(doc.splitTextToSize('Counts (% within each situation). Top personnel/family = most-used tag; ties shown. Untagged remains visible. Unknown run/pass: '+rows.filter(p=>jesseRunPass(p)==='Unknown').length+'. Man/zone requires staff classification; call names are not guessed. Fourth downs included.',124),145,doc.lastAutoTable.finalY+6);
 }else{
 production('1. Production by '+(side==='offense'?'play family':'our call'),side==='offense'?'Play family':'Defensive call',10,38);
 const situationRows=situationKeys(side).map(key=>{const s=summary(rows.filter(p=>bucket(p,side)===key));return [key,s.n,fmt(s.ypp),fmt(s.median)]});
 for(const [key,r] of orderedSituations(rows.filter(p=>!situationKeys(side).includes(bucket(p,side))),side)){const s=summary(r);situationRows.push([key,s.n,fmt(s.ypp),fmt(s.median)])}
 // Compact D&D table stays on the summary sheet for both coordinator bucket sets.
 table('2. Down & distance',['Situation','n','Avg','Median'],situationRows,145,38,124,true);
 production('3. Play type production','Play type',10,102);
 production('4. '+(side==='offense'?'Call':'Coverage')+' production',side==='offense'?'Call':'Called coverage',10,150);

 }
 doc.setFontSize(7);doc.text(doc.splitTextToSize(notes,w-20),10,h-10);
 doc.addPage();header('PASS TARGET SCATTER');
 const left=85,top=34,fw=109,fh=145,px=x=>left+(x+26.7)/53.4*fw,py=y=>top+fh-(y+10)/70*fh;
 doc.setFillColor(23,75,62);doc.rect(left,top,fw,fh,'F');doc.setFontSize(8);
 for(const depth of [-10,0,10,20,30,40,50,60]){doc.setDrawColor(depth===0?240:140,depth===0?200:175,depth===0?80:160);doc.line(left,py(depth),left+fw,py(depth));doc.setTextColor(28,48,66);doc.text(depth===0?'LOS':String(depth),left-10,py(depth)+1)}
 const colors={Complete:[53,201,111],Incomplete:[255,152,47],TD:[88,166,255],INT:[255,69,69],Unknown:[206,215,223]},located=rows.filter(p=>knownNumber(p.tags?.['Throw lateral'])&&knownNumber(p.tags?.['Air yards']));
 for(const p of located){const type=throwOutcome(p),x=px(Number(p.tags['Throw lateral'])),y=py(Number(p.tags['Air yards'])),color=colors[type];doc.setFillColor(...color);doc.setDrawColor(...color);if(type==='Incomplete'){doc.line(x-1.5,y-1.5,x+1.5,y+1.5);doc.line(x-1.5,y+1.5,x+1.5,y-1.5)}else{doc.circle(x,y,1.8,'F');if(type==='TD'||type==='INT'){doc.setTextColor(...color);doc.text(type,x+3,y+1)}}const number=receiverNumber(p);if(number){doc.setTextColor(255,255,255);doc.text(number,x,y-3,{align:'center'})}}
 doc.setTextColor(28,48,66);doc.text('OFFENSE LEFT',left,top+fh+6);doc.text('OFFENSE RIGHT',left+fw-27,top+fh+6);doc.text(located.length+' located plays / '+(rows.length-located.length)+' without target coordinates',10,28);
 let legendY=45;for(const [key,color] of Object.entries(colors)){doc.setTextColor(...color);doc.text(key,210,legendY);legendY+=8}doc.setTextColor(28,48,66);doc.text(doc.splitTextToSize(notes,w-20),10,h-12);
 }
 const pages=doc.getNumberOfPages();for(let n=1;n<=pages;n++){doc.setPage(n);doc.setDrawColor(117,39,60);doc.line(10,h-7,w-10,h-7);doc.setFontSize(7);doc.setTextColor(90,90,90);doc.text('ULM FOOTBALL / STAFF GAME INTELLIGENCE',10,h-3);doc.text('Page '+n+' of '+pages,w-10,h-3,{align:'right'})}
 return doc;
 }finally{mode=old}
}
function printHalftime(side,kind){
 if(!state.event){$('halftimeDialog').close();return askConfirm('Connect a game or start a manual game before downloading reports.')}
 try{const doc=buildHalftimePDF(side,kind);doc.save('ULM-'+state.event+'-'+side+'-halftime-'+kind+'.pdf');$('halftimeDialog').close()}catch(error){notice('PDF export failed: '+error.message);askConfirm('PDF export failed: '+error.message+'. Your charted plays are still saved.')}
}
function printCatapultPDF(){try{const doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'letter'});doc.setFontSize(14);doc.text(pdfText($('catapultTitle').value.trim()||'ULM GAME BREAKDOWN'),10,15);doc.autoTable({head:[catapultColumns.map(pdfText)],body:catapultRows.map(r=>r.map(pdfText)),startY:22,margin:10,styles:{fontSize:8,cellPadding:2},headStyles:{fillColor:[117,39,60]}});doc.save('ULM-'+state.event+'-'+mode+'-Catapult.pdf');$('catapultDialog').close()}catch(error){askConfirm('PDF export failed: '+error.message)}}
