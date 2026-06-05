export function exportToPDF({ store, employees, schedules, weekDates, shiftTypes, currentWeek, currentYear, logoDataUrl }) {
  import('jspdf').then(({ default: jsPDF }) => {
    import('jspdf-autotable').then(() => {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      // A4 landscape: 297 x 210 mm

      const hexRGB = (hex) => {
        const h = hex.replace('#','');
        return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
      };

      const [sr,sg,sb] = hexRGB(store.color||'#00C9B1');
      const PAGE_W = 297, PAGE_H = 210;
      const MARGIN = 12;

      // ── White background
      doc.setFillColor(255,255,255);
      doc.rect(0,0,PAGE_W,PAGE_H,'F');

      // ── Top header bar
      doc.setFillColor(sr,sg,sb);
      doc.rect(0,0,PAGE_W,24,'F');

      // Subtle pattern in header
      doc.setFillColor(255,255,255);
      doc.setGlobalAlpha(0.05);
      for(let x=0;x<PAGE_W;x+=8){ doc.rect(x,0,4,24,'F'); }
      doc.setGlobalAlpha(1);

      // ── Logo or icon in header
      if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, 'PNG', MARGIN, 4, 40, 16, '', 'FAST'); } catch(e){}
      } else {
        doc.setFillColor(255,255,255);
        doc.roundedRect(MARGIN, 5, 14, 14, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setTextColor(sr,sg,sb);
        doc.text('CARE', MARGIN+2, 14);
      }

      // Store name in header
      doc.setFont('helvetica','bold');
      doc.setFontSize(13);
      doc.setTextColor(255,255,255);
      const storeX = logoDataUrl ? MARGIN+46 : MARGIN+20;
      doc.text(store.name.toUpperCase(), storeX, 10);
      doc.setFontSize(8);
      doc.setFont('helvetica','normal');
      doc.text('Planning des horaires', storeX, 16);

      // Week info right
      const startD = weekDates[0].date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
      const endD   = weekDates[6].date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
      doc.setFont('helvetica','bold');
      doc.setFontSize(11);
      doc.setTextColor(255,255,255);
      doc.text(`SEMAINE ${currentWeek}`, PAGE_W-MARGIN, 9, {align:'right'});
      doc.setFont('helvetica','normal');
      doc.setFontSize(7.5);
      doc.text(`${startD} – ${endD}`, PAGE_W-MARGIN, 15, {align:'right'});

      // ── Table
      const headers = [
        { content:'Employé', styles:{halign:'left',cellWidth:34} },
        { content:'Contrat', styles:{halign:'center',cellWidth:16} },
        ...weekDates.map(wd=>({ content:`${wd.day.slice(0,3)}\n${wd.date.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}`, styles:{halign:'center'} })),
        { content:'Total\nheb.', styles:{halign:'center',cellWidth:18} },
      ];

      const rows = employees.map(emp => {
        let totalH=0;
        const schedKey = `${store.id}_${currentYear}_W${currentWeek}`;
        const dayCells = weekDates.map((_,i)=>{
          const shift=schedules[schedKey]?.[`${emp.id}_${i}`];
          if(!shift) return { content:'', styles:{} };
          const st=shiftTypes.find(s=>s.id===shift.type)||{label:shift.type,color:'#6366F1',bgColor:'#EEF2FF'};
          if(shift.hours) totalH+=shift.hours;
          const [tr,tg,tb]=hexRGB(st.color.startsWith('#')?st.color:'#6366F1');
          const [br,bg2,bb]=hexRGB(st.bgColor.startsWith('#')?st.bgColor:'#EEF2FF');
          let txt=st.label;
          if(shift.startTime) txt+=`\n${shift.startTime}-${shift.endTime}`;
          if(shift.hours>0) txt+=`\n${shift.hours}h`;
          if(shift.breakH>0) txt+=`\n-${shift.breakH}h pause`;
          return { content:txt, styles:{ fillColor:[br,bg2,bb], textColor:[tr,tg,tb], fontStyle:'bold', fontSize:7, halign:'center' } };
        });
        const contract=emp.contractHours||35;
        const diff=totalH-contract;
        return [
          { content:emp.name, styles:{ fontStyle:'bold', fontSize:9, textColor:[27,42,59] } },
          { content:`${contract}h`, styles:{ halign:'center', fontSize:8, textColor:[90,122,138] } },
          ...dayCells,
          { content:`${totalH.toFixed(1)}h\n${diff>=0?'+':''}${diff.toFixed(1)}`, styles:{ fontStyle:'bold', halign:'center', fontSize:8, textColor: diff>2?[200,0,43]:diff<-2?[90,122,138]:[0,168,150] } },
        ];
      });

      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 28,
        margin: { left:MARGIN, right:MARGIN },
        tableWidth: PAGE_W - MARGIN*2,
        styles: {
          fontSize: 8, font:'helvetica', cellPadding:3,
          valign:'middle', lineColor:[220,230,230], lineWidth:0.3,
          textColor:[27,42,59], fillColor:[255,255,255],
        },
        headStyles: {
          fillColor:[sr,sg,sb], textColor:[255,255,255],
          fontStyle:'bold', fontSize:8.5, lineWidth:0, cellPadding:4,
        },
        alternateRowStyles: { fillColor:[247,250,250] },
        columnStyles: {
          0:{ cellWidth:34, halign:'left' },
          1:{ cellWidth:16, halign:'center' },
          9:{ cellWidth:18, halign:'center' },
        },
      });

      // ── Legend bar
      const finalY = doc.lastAutoTable.finalY + 5;
      if(finalY < PAGE_H - 14) {
        let lx = MARGIN;
        doc.setFontSize(6.5);
        shiftTypes.forEach(st => {
          const [br,bg2,bb]=hexRGB(st.bgColor.startsWith('#')?st.bgColor:'#F0F0F0');
          const [tr,tg,tb]=hexRGB(st.color.startsWith('#')?st.color:'#333333');
          doc.setFillColor(br,bg2,bb);
          doc.roundedRect(lx, finalY, 3, 3, 0.5, 0.5, 'F');
          doc.setTextColor(tr,tg,tb);
          doc.text(st.label, lx+5, finalY+2.5);
          lx += doc.getTextWidth(st.label)+12;
        });
      }

      // ── Footer
      doc.setFontSize(7);
      doc.setTextColor(180,200,200);
      doc.text(`Généré par Care Planning · ${new Date().toLocaleDateString('fr-FR')}`, PAGE_W/2, PAGE_H-5, {align:'center'});

      // ── Bottom accent line
      doc.setFillColor(sr,sg,sb);
      doc.rect(0, PAGE_H-2, PAGE_W, 2, 'F');

      doc.save(`planning_${store.name.replace(/\s+/g,'_')}_S${currentWeek}_${currentYear}.pdf`);
    });
  });
}

export function exportToNotion({ store, employees, schedules, weekDates, shiftTypes, currentWeek, currentYear }) {
  const lines=[];
  lines.push(`# 📅 Planning — ${store.name}`);
  lines.push(`**Semaine ${currentWeek}** | ${weekDates[0].date.toLocaleDateString('fr-FR')} – ${weekDates[6].date.toLocaleDateString('fr-FR')}`);
  lines.push('');
  lines.push(`| Employé | Contrat | ${weekDates.map(w=>w.day.slice(0,3)).join(' | ')} | Total |`);
  lines.push(`| --- | --- | ${weekDates.map(()=>'---').join(' | ')} | --- |`);
  employees.forEach(emp=>{
    let t=0;
    const key=`${store.id}_${currentYear}_W${currentWeek}`;
    const cells=weekDates.map((_,i)=>{
      const sh=schedules[key]?.[`${emp.id}_${i}`];
      if(!sh) return '—';
      const st=shiftTypes.find(s=>s.id===sh.type);
      if(sh.hours) t+=sh.hours;
      return sh.startTime?`${st?.label} ${sh.startTime}-${sh.endTime} (${sh.hours}h)`:(st?.label||'—');
    });
    lines.push(`| **${emp.name}** | ${emp.contractHours}h | ${cells.join(' | ')} | **${t.toFixed(1)}h** |`);
  });
  lines.push('');
  lines.push('---');
  lines.push('*Généré par Care Planning*');
  const text=lines.join('\n');
  navigator.clipboard.writeText(text).then(()=>alert('✅ Copié ! Collez dans Notion (Ctrl+V)')).catch(()=>{
    const ta=document.createElement('textarea');
    ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    alert('✅ Copié dans le presse-papier !');
  });
}
