// ── HTML PDF: opens in browser, beautiful, printable ─────────────
export async function exportToPDF({ store, employees, schedules, weekDates, shiftTypes, currentWeek, currentYear, logoDataUrl }) {

  const hex = h => {
    const c = (h||'#888888').replace('#','');
    return `#${c.slice(0,6)}`;
  };

  const schedKey = `${store.id}_${currentYear}_W${currentWeek}`;
  const sched = schedules[schedKey] || {};

  const startDate = weekDates[0].date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
  const endDate   = weekDates[6].date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
  const storeColor = store.color || '#00C9B1';

  // Build shift type map
  const stMap = {};
  shiftTypes.forEach(st => { stMap[st.id] = st; });

  // Build rows
  const rows = employees.map(emp => {
    let totalH = 0;
    const cells = weekDates.map((wd, di) => {
      const sh = sched[`${emp.id}_${di}`];
      if (!sh) return { empty: true, isSun: wd.date.getDay()===0 };
      const st = stMap[sh.type] || { label: sh.type, color:'#6366F1', bgColor:'#EEF2FF' };
      const workTypes2 = ['work','communication','meeting','school'];
      if (sh.hours && workTypes2.includes(sh.type)) totalH += sh.hours;
      if (sh.split?.hours && workTypes2.includes(sh.split.type)) totalH += sh.split.hours;
      return { sh, st, isSun: wd.date.getDay()===0 };
    });
    const diff = totalH - (emp.contractHours||35);
    return { emp, cells, totalH, diff };
  });

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Planning ${store.name} — S${currentWeek}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #F0F5F7;
    min-height: 100vh;
    padding: 32px 20px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    max-width: 1100px;
    margin: 0 auto;
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 8px 48px rgba(0,0,0,.18);
  }

  /* HEADER */
  .header {
    background: ${storeColor};
    padding: 28px 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }
  .header-left { display: flex; align-items: center; gap: 20px; }
  .logo-wrap {
    background: white;
    border-radius: 12px;
    padding: 8px 12px;
    display: flex; align-items: center; justify-content: center;
  }
  .logo-wrap img { height: 44px; object-fit: contain; display: block; }
  .header-text h1 {
    font-family: 'Syne', sans-serif;
    font-size: 24px; font-weight: 800;
    color: white; letter-spacing: -.01em;
    text-transform: uppercase;
  }
  .header-text p { color: rgba(255,255,255,.75); font-size: 14px; margin-top: 3px; }
  .week-badge {
    text-align: right;
    color: white;
  }
  .week-badge .week-num {
    font-family: 'Syne', sans-serif;
    font-size: 40px; font-weight: 800; line-height: 1;
    letter-spacing: -.03em;
  }
  .week-badge .week-dates {
    font-size: 13px; opacity: .8; margin-top: 4px;
  }

  /* TABLE */
  .table-wrap { padding: 0; overflow-x: auto; }
  table {
    width: 100%; border-collapse: collapse;
    table-layout: fixed;
  }
  thead th {
    background: #F8FAFB;
    padding: 14px 10px;
    text-align: center;
    font-size: 13px; font-weight: 700;
    color: #607D8B;
    text-transform: uppercase;
    letter-spacing: .05em;
    border-bottom: 2px solid #E2EBF0;
  }
  thead th:first-child { text-align: left; padding-left: 24px; width: 180px; }
  thead th:last-child { width: 90px; }

  .day-th .day-name { font-size: 15px; font-weight: 800; color: #1B2A3B; text-transform: capitalize; }
  .day-th .day-date { font-size: 12px; color: #9EBBCA; font-weight: 500; margin-top: 2px; }
  .day-th.sun .day-name { color: #C8002B; }

  tbody tr { border-bottom: 1px solid #F0F5F7; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:nth-child(even) td { background: #FAFCFC; }

  .emp-cell {
    padding: 12px 24px;
    vertical-align: middle;
  }
  .emp-name { font-weight: 700; font-size: 16px; color: #1B2A3B; }
  .emp-sub { font-size: 12px; color: #9EBBCA; margin-top: 2px; text-transform: capitalize; }

  .shift-cell {
    padding: 7px 5px;
    text-align: center;
    vertical-align: middle;
  }
  .shift-pill {
    border-radius: 10px;
    padding: 9px 6px;
    min-height: 64px;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
  }
  .shift-label { font-weight: 700; font-size: 13px; }
  .shift-time  { font-size: 12px; opacity: .85; }
  .shift-hours { font-size: 11px; opacity: .7; }
  .empty-cell {
    min-height: 64px;
    border-radius: 10px;
    border: 1.5px dashed #E2EBF0;
    display: flex; align-items: center; justify-content: center;
    color: #D0DDE5; font-size: 18px;
  }
  .sun-cell .empty-cell { border-color: #FFCDD2; background: #FFF8F8; }

  .total-cell {
    padding: 12px 16px;
    text-align: center; vertical-align: middle;
  }
  .total-h { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; line-height: 1; }
  .total-diff { font-size: 12px; font-weight: 700; margin-top: 3px; }
  .over  { color: #C8002B; }
  .under { color: #9EBBCA; }
  .exact { color: #00A896; }

  /* LEGEND */
  .legend {
    padding: 18px 28px;
    border-top: 1.5px solid #F0F5F7;
    display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
    background: #FAFCFC;
  }
  .legend-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 600;
  }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

  /* FOOTER */
  .footer {
    padding: 14px 28px;
    border-top: 1.5px solid #F0F5F7;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 12px; color: #9EBBCA;
  }

  /* PRINT BUTTON */
  .print-bar {
    max-width: 1100px; margin: 0 auto 20px;
    display: flex; gap: 10px; justify-content: flex-end;
  }
  .btn-print, .btn-dl {
    padding: 10px 22px; border-radius: 10px; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
    display: flex; align-items: center; gap: 8px;
    text-decoration: none;
  }
  .btn-print { background: ${storeColor}; color: white; box-shadow: 0 3px 12px ${storeColor}55; }
  .btn-print:hover { filter: brightness(.92); }
  .btn-dl { background: white; color: #1B2A3B; border: 1.5px solid #E2EBF0; }

  @media print {
    body { background: white; padding: 0; }
    .page { box-shadow: none; border-radius: 0; max-width: 100%; }
    .print-bar { display: none; }
    @page { size: A4 landscape; margin: 10mm; }
  }
</style>
</head>
<body>

<div class="print-bar">
  <button class="btn-dl" onclick="window.print()">🖨️ Imprimer</button>
  <button class="btn-print" onclick="downloadPDF()">📥 Télécharger PDF</button>
</div>

<div class="page">
  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      ${logoDataUrl ? `<div class="logo-wrap"><img src="${logoDataUrl}" alt="Logo"/></div>` : ''}
      <div class="header-text">
        <h1>${store.name}</h1>
        <p>Planning des horaires · Semaine ${currentWeek} · ${currentYear}</p>
      </div>
    </div>
    <div class="week-badge">
      <div class="week-num">S${currentWeek}</div>
      <div class="week-dates">${startDate}<br/>→ ${endDate}</div>
    </div>
  </div>

  <!-- TABLE -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Employé</th>
          ${weekDates.map(wd => `
            <th class="day-th${wd.date.getDay()===0?' sun':''}">
              <div class="day-name">${wd.day.slice(0,3)}</div>
              <div class="day-date">${wd.date.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
            </th>
          `).join('')}
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(({emp, cells, totalH, diff}) => `
          <tr>
            <td class="emp-cell">
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:38px;height:38px;border-radius:50%;background:${emp.color||storeColor};display:flex;align-items:center;justify-content:center;font-weight:800;color:white;font-size:16px;flex-shrink:0;">${emp.name[0]}</div>
                <div>
                  <div class="emp-name">${emp.name}</div>
                  <div class="emp-sub">${emp.role} · ${emp.contractHours}h/sem</div>
                </div>
              </div>
            </td>
            ${cells.map(cell => {
              if (cell.empty) return `<td class="shift-cell${cell.isSun?' sun-cell':''}"><div class="empty-cell">—</div></td>`;
              const { sh, st, isSun } = cell;
              return `<td class="shift-cell${isSun?' sun-cell':''}">
                <div class="shift-pill" style="background:${st.bgColor};border:1.5px solid ${st.color}40;${st2?'padding-bottom:4px;':''}" >
                  <span class="shift-label" style="color:${st.color};">${st.label}</span>
                  ${sh.startTime ? `<span class="shift-time" style="color:${st.color};">${sh.startTime}–${sh.endTime}</span>` : ''}
                  ${sh.hours > 0 ? `<span class="shift-hours" style="color:${st.color};">${sh.hours}h</span>` : ''}
                  ${st2 ? `<div style="width:70%;height:1px;background:${st.color};opacity:.25;margin:3px auto;"></div>
                  <span class="shift-label" style="color:${st2.color};font-size:11px;">${st2.label}</span>
                  ${sh.split.startTime ? `<span class="shift-time" style="color:${st2.color};">${sh.split.startTime}–${sh.split.endTime}</span>` : ''}
                  ${(sh.split.hours||0) > 0 ? `<span class="shift-hours" style="color:${st2.color};">${sh.split.hours}h</span>` : ''}` : ''}
                </div>
              </td>`;
            }).join('')}
            <td class="total-cell">
              <div class="total-h ${diff>2?'over':diff<-2?'under':'exact'}">${totalH.toFixed(1)}h</div>
              <div class="total-diff ${diff>0?'over':diff<0?'under':'exact'}">${diff>0?'+':''}${diff.toFixed(1)}</div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- LEGEND -->
  <div class="legend">
    ${shiftTypes.map(st => `
      <div class="legend-item">
        <div class="legend-dot" style="background:${st.color};"></div>
        <span style="color:${st.color};">${st.label}</span>
      </div>
    `).join('')}
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <span>Care Planning · ${store.name}</span>
    <span>Généré le ${new Date().toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
  </div>
</div>

<script>
async function downloadPDF() {
  // Use browser print with PDF save dialog
  window.print();
}
</script>
</body>
</html>`;

  // Open in new tab
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Cleanup after a while
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function exportToNotion({ store, employees, schedules, weekDates, shiftTypes, currentWeek, currentYear }) {
  const key=`${store.id}_${currentYear}_W${currentWeek}`;
  const sched=schedules[key]||{};
  const lines=[];
  lines.push(`# 📅 Planning — ${store.name}`);
  lines.push(`**Semaine ${currentWeek}** | ${weekDates[0].date.toLocaleDateString('fr-FR')} – ${weekDates[6].date.toLocaleDateString('fr-FR')}`);
  lines.push('');
  lines.push(`| Employé | ${weekDates.map(w=>w.day.slice(0,3)).join(' | ')} | Total |`);
  lines.push(`| --- | ${weekDates.map(()=>'---').join(' | ')} | --- |`);
  employees.forEach(emp=>{
    let t=0;
    const cells=weekDates.map((_,i)=>{
      const sh=sched[`${emp.id}_${i}`]; if(!sh) return '—';
      const st=shiftTypes.find(s=>s.id===sh.type);
      if(sh.hours) t+=sh.hours;
      return sh.startTime?`${st?.label||'?'} ${sh.startTime}-${sh.endTime}`:(st?.label||'—');
    });
    lines.push(`| **${emp.name}** | ${cells.join(' | ')} | **${t.toFixed(1)}h** |`);
  });
  lines.push('\n---\n*Généré par Care Planning*');
  const text=lines.join('\n');
  navigator.clipboard.writeText(text).then(()=>alert('✅ Copié ! Collez dans Notion (Ctrl+V)')).catch(()=>{
    const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); alert('✅ Copié !');
  });
}
