export async function exportToPDF({ store, employees, schedules, weekDates, shiftTypes, currentWeek, currentYear, logoDataUrl }) {
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default;
  await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210, M = 10;

  const hex = h => {
    const c = h.replace('#','');
    return [parseInt(c.slice(0,2),16)||0, parseInt(c.slice(2,4),16)||0, parseInt(c.slice(4,6),16)||0];
  };
  const sc = store.color||'#00C9B1';
  const [sr,sg,sb] = hex(sc);

  // White bg
  doc.setFillColor(255,255,255); doc.rect(0,0,W,H,'F');

  // Header bar
  doc.setFillColor(sr,sg,sb); doc.rect(0,0,W,22,'F');

  // Logo
  if(logoDataUrl){
    try { doc.addImage(logoDataUrl,'PNG',M,3,36,16,'','FAST'); } catch(ex){}
  }

  // Title in header
  const tx = logoDataUrl ? M+40 : M;
  doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(255,255,255);
  doc.text(store.name.toUpperCase(), tx, 10);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(255,255,255);
  doc.text('Planning des horaires', tx, 16);

  // Week info right
  const d0 = weekDates[0].date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
  const d6 = weekDates[6].date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(255,255,255);
  doc.text(`SEMAINE ${currentWeek}`, W-M, 9, {align:'right'});
  doc.setFont('helvetica','normal'); doc.setFontSize(8);
  doc.text(`${d0} – ${d6}`, W-M, 16, {align:'right'});

  // Table
  const colW = Math.floor((W - M*2 - 38 - 20) / 7);
  const headers = [
    {content:'Employé', styles:{halign:'left',cellWidth:38,fontStyle:'bold'}},
    ...weekDates.map(wd=>({content:`${wd.day.slice(0,3)}\n${wd.date.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}`, styles:{halign:'center',cellWidth:colW}})),
    {content:'Total', styles:{halign:'center',cellWidth:20,fontStyle:'bold'}},
  ];

  const rows = employees.map(emp=>{
    let total=0;
    const key=`${store.id}_${currentYear}_W${currentWeek}`;
    const cells = weekDates.map((_,i)=>{
      const sh=schedules[key]?.[`${emp.id}_${i}`];
      if(!sh) return {content:'', styles:{fillColor:[248,250,252]}};
      const st=shiftTypes.find(s=>s.id===sh.type)||{label:sh.type,color:'#6366F1',bgColor:'#EEF2FF'};
      if(sh.hours) total+=sh.hours;
      const [br,bg2,bb]=hex(st.bgColor.startsWith('#')?st.bgColor:'#EEF2FF');
      const [tr,tg,tb]=hex(st.color.startsWith('#')?st.color:'#6366F1');
      let txt=st.label;
      if(sh.startTime) txt+=`\n${sh.startTime}-${sh.endTime}`;
      if(sh.hours>0) txt+=`\n${sh.hours}h`;
      if(sh.breakH>0) txt+=` (-${sh.breakH}h)`;
      return {content:txt, styles:{fillColor:[br,bg2,bb],textColor:[tr,tg,tb],fontStyle:'bold',fontSize:7.5,halign:'center',valign:'middle'}};
    });
    const diff=total-(emp.contractHours||35);
    return [
      {content:`${emp.name}\n${emp.role} · ${emp.contractHours}h`, styles:{fontStyle:'bold',fontSize:9,halign:'left',textColor:[27,42,59]}},
      ...cells,
      {content:`${total.toFixed(1)}h\n${diff>=0?'+':''}${diff.toFixed(1)}`, styles:{fontStyle:'bold',halign:'center',fontSize:9,textColor:diff>2?[200,0,43]:diff<-2?[100,120,130]:[0,168,150]}},
    ];
  });

  doc.autoTable({
    head:[headers], body:rows,
    startY:26,
    margin:{left:M,right:M},
    styles:{fontSize:8,font:'helvetica',cellPadding:3.5,valign:'middle',lineColor:[220,230,235],lineWidth:0.3,textColor:[27,42,59],fillColor:[255,255,255]},
    headStyles:{fillColor:[sr,sg,sb],textColor:[255,255,255],fontStyle:'bold',fontSize:9,lineWidth:0,cellPadding:5},
    alternateRowStyles:{fillColor:[247,250,252]},
    didDrawCell:data=>{
      if(data.section==='head'){
        // Draw column separator
        doc.setDrawColor(255,255,255);
        doc.setLineWidth(0.5);
        doc.line(data.cell.x+data.cell.width, data.cell.y, data.cell.x+data.cell.width, data.cell.y+data.cell.height);
      }
    }
  });

  // Legend
  const fy = doc.lastAutoTable.finalY + 5;
  if(fy < H-14){
    let lx=M;
    doc.setFontSize(7);
    shiftTypes.forEach(st=>{
      const [br,bg2,bb]=hex(st.bgColor.startsWith('#')?st.bgColor:'#F0F0F0');
      const [tr,tg,tb]=hex(st.color.startsWith('#')?st.color:'#333');
      doc.setFillColor(br,bg2,bb); doc.roundedRect(lx,fy,3.5,3.5,.5,.5,'F');
      doc.setTextColor(tr,tg,tb); doc.text(st.label, lx+5.5, fy+2.8);
      lx += doc.getTextWidth(st.label)+13;
    });
  }

  // Footer
  doc.setFontSize(7.5); doc.setTextColor(180,195,200);
  doc.text(`Généré par Care Planning · ${new Date().toLocaleDateString('fr-FR')}`, W/2, H-5, {align:'center'});

  // Bottom bar
  doc.setFillColor(sr,sg,sb); doc.rect(0,H-2.5,W,2.5,'F');

  doc.save(`planning_${store.name.replace(/\s+/g,'_')}_S${currentWeek}.pdf`);
}

export function exportToNotion({ store, employees, schedules, weekDates, shiftTypes, currentWeek, currentYear }) {
  const lines=[];
  lines.push(`# 📅 Planning — ${store.name}`);
  lines.push(`**Semaine ${currentWeek}** | ${weekDates[0].date.toLocaleDateString('fr-FR')} – ${weekDates[6].date.toLocaleDateString('fr-FR')}`);
  lines.push('');
  lines.push(`| Employé | ${weekDates.map(w=>w.day.slice(0,3)).join(' | ')} | Total |`);
  lines.push(`| --- | ${weekDates.map(()=>'---').join(' | ')} | --- |`);
  employees.forEach(emp=>{
    let t=0;
    const key=`${store.id}_${currentYear}_W${currentWeek}`;
    const cells=weekDates.map((_,i)=>{
      const sh=schedules[key]?.[`${emp.id}_${i}`]; if(!sh) return '—';
      const st=shiftTypes.find(s=>s.id===sh.type);
      if(sh.hours) t+=sh.hours;
      return sh.startTime?`${st?.label||'?'} ${sh.startTime}-${sh.endTime}`:(st?.label||'—');
    });
    lines.push(`| **${emp.name}** | ${cells.join(' | ')} | **${t.toFixed(1)}h** |`);
  });
  lines.push('\n---\n*Généré par Care Planning*');
  const text=lines.join('\n');
  navigator.clipboard.writeText(text)
    .then(()=>alert('✅ Copié ! Collez dans Notion (Ctrl+V)'))
    .catch(()=>{ const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); alert('✅ Copié !'); });
}
