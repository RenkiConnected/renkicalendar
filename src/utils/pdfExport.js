export async function exportToPDF({ store, employees, schedules, weekDates, shiftTypes, currentWeek, currentYear, logoDataUrl }) {

  const schedKey = `${store.id}_${currentYear}_W${currentWeek}`;
  const sched = schedules[schedKey] || {};
  const storeColor = store.color || '#00C9B1';
  const startDate = weekDates[0].date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
  const endDate   = weekDates[6].date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});

  const stMap = {};
  shiftTypes.forEach(st => { stMap[st.id] = st; });

  const workTypes = ['work','communication','meeting','school'];

  const rows = employees.map(emp => {
    let totalH = 0;
    const cells = weekDates.map((wd, di) => {
      const sh = sched[`${emp.id}_${di}`];
      if (!sh) return { empty:true, isSun:wd.date.getDay()===0 };
      const st = stMap[sh.type] || { label:sh.type, color:'#6366F1', bgColor:'#EEF2FF' };
      const st2 = sh.split ? (stMap[sh.split.type]||{label:sh.split.type,color:'#F97316',bgColor:'#FFF3E0'}) : null;
      if (sh.hours && workTypes.includes(sh.type)) totalH += sh.hours;
      if (sh.split?.hours && workTypes.includes(sh.split.type)) totalH += sh.split.hours;
      return { sh, st, st2, isSun:wd.date.getDay()===0 };
    });
    const diff = totalH - (emp.contractHours||35);
    return { emp, cells, totalH, diff };
  });

  // Build cell HTML
  function cellHTML(cell) {
    if (cell.empty) {
      return `<td class="sc${cell.isSun?' sun':''}"><div class="empty">—</div></td>`;
    }
    const { sh, st, st2, isSun } = cell;
    const inner = `
      <span class="lbl" style="color:${st.color}">${st.label}</span>
      ${sh.startTime ? `<span class="tm" style="color:${st.color}">${sh.startTime}–${sh.endTime}</span>` : ''}
      ${sh.hours > 0 ? `<span class="hr" style="color:${st.color}">${sh.hours}h</span>` : ''}
      ${st2 ? `
        <div class="sep" style="background:${st.color}"></div>
        <span class="lbl" style="color:${st2.color};font-size:9px">${st2.label}</span>
        ${sh.split?.startTime ? `<span class="tm" style="color:${st2.color}">${sh.split.startTime}–${sh.split.endTime}</span>` : ''}
        ${(sh.split?.hours||0) > 0 ? `<span class="hr" style="color:${st2.color}">${sh.split.hours}h</span>` : ''}
      ` : ''}`;
    return `<td class="sc${isSun?' sun':''}">
      <div class="pill" style="background:${st.bgColor};border-color:${st.color}33">${inner}</div>
    </td>`;
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>Planning ${store.name} S${currentWeek}</title>
<style>
/* ── RESET ── */
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;font-family:'Segoe UI',Arial,sans-serif;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ── PAGE LAYOUT ── */
.page{
  width:100%;
  min-height:100vh;
  display:flex;
  flex-direction:column;
  padding:0;
}

/* ── HEADER ── */
.hdr{
  background:${storeColor};
  padding:18px 28px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  flex-shrink:0;
}
.hdr-left{display:flex;align-items:center;gap:16px}
.logo-box{background:rgba(255,255,255,0.2);border-radius:10px;padding:6px 10px;display:flex;align-items:center;justify-content:center}
.logo-box img{height:38px;object-fit:contain;display:block}
.store-title{font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px;text-transform:uppercase}
.store-sub{font-size:12px;color:rgba(255,255,255,.8);margin-top:2px}
.week-box{text-align:right;color:#fff}
.week-num{font-size:38px;font-weight:900;line-height:1;letter-spacing:-2px}
.week-dates{font-size:11px;opacity:.85;margin-top:2px}

/* ── TABLE WRAPPER ── */
.tbl-wrap{flex:1;overflow:hidden;padding:0}

/* ── TABLE ── */
table{width:100%;border-collapse:collapse;table-layout:fixed}
thead tr{background:#F0F5F7}
thead th{
  padding:10px 6px;
  font-size:11px;font-weight:700;
  color:#607D8B;text-transform:uppercase;letter-spacing:.05em;
  border-bottom:2px solid #E2EBF0;
  text-align:center;
}
thead th:first-child{text-align:left;padding-left:16px;width:160px}
thead th:last-child{width:80px}
.day-name{font-size:13px;font-weight:800;color:#1B2A3B}
.day-date{font-size:11px;color:#9EBBCA;margin-top:1px}
.sun .day-name{color:#C8002B}

tbody tr{border-bottom:1px solid #F0F5F7}
tbody tr:nth-child(even) td{background:#FAFCFC}
tbody tr:nth-child(odd) td{background:#fff}

/* Employee cell */
.ec{padding:10px 16px;vertical-align:middle}
.av{width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:14px;flex-shrink:0;margin-right:10px;vertical-align:middle}
.en{font-weight:700;font-size:14px;color:#1B2A3B;vertical-align:middle}
.es{font-size:11px;color:#9EBBCA;text-transform:capitalize;display:block;margin-top:1px}

/* Shift cells */
.sc{padding:5px 4px;vertical-align:middle}
.sun{background:#FFF8F8!important}
.empty{
  min-height:52px;border-radius:8px;border:1.5px dashed #E2EBF0;
  display:flex;align-items:center;justify-content:center;
  color:#D0DDE5;font-size:16px;
}
.sun .empty{border-color:#FFCDD2;background:#FFF5F5}

.pill{
  border-radius:8px;border:1.5px solid transparent;
  padding:6px 4px;min-height:52px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
}
.lbl{font-weight:700;font-size:11px;text-align:center}
.tm{font-size:10px;text-align:center;opacity:.85}
.hr{font-size:10px;text-align:center;opacity:.7}
.sep{width:60%;height:1px;opacity:.3;margin:2px auto}

/* Total */
.tot{padding:10px 12px;text-align:center;vertical-align:middle}
.tot-h{font-size:17px;font-weight:800;line-height:1}
.tot-d{font-size:11px;font-weight:700;margin-top:2px}
.ok{color:#00A896}.over{color:#C8002B}.under{color:#9EBBCA}

/* Legend */
.leg{
  padding:12px 20px;
  border-top:1.5px solid #F0F5F7;
  display:flex;flex-wrap:wrap;gap:12px;align-items:center;
  background:#FAFCFC;flex-shrink:0;
}
.leg-i{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600}
.leg-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}

/* Footer */
.ftr{
  padding:10px 20px;
  display:flex;justify-content:space-between;align-items:center;
  font-size:10px;color:#9EBBCA;
  border-top:1px solid #F0F5F7;flex-shrink:0;
}

/* ── PRINT ── */
@media print{
  html,body{width:297mm;height:210mm}
  .page{width:297mm;height:210mm;min-height:0}
  .no-print{display:none!important}
  @page{size:A4 landscape;margin:6mm}
  /* Fit table rows to page */
  tbody tr{page-break-inside:avoid}
}

/* ── SCREEN ONLY ── */
@media screen{
  body{background:#E8EDF0;display:flex;align-items:flex-start;justify-content:center;min-height:100vh;padding:20px}
  .page{
    width:297mm;
    box-shadow:0 8px 40px rgba(0,0,0,.2);
    border-radius:12px;
    overflow:hidden;
  }
  .toolbar{
    width:297mm;
    display:flex;gap:10px;justify-content:flex-end;
    margin-bottom:14px;
  }
  .btn{
    padding:10px 20px;border-radius:9px;border:none;cursor:pointer;
    font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:7px;
    font-family:inherit;
  }
  .btn-print{background:#fff;color:#1B2A3B;border:1.5px solid #E2EBF0}
  .btn-pdf{background:${storeColor};color:#fff;box-shadow:0 3px 12px ${storeColor}55}
}
</style>
</head>
<body>

<div class="toolbar no-print">
  <button class="btn btn-print" onclick="window.print()">🖨️ Imprimer</button>
  <button class="btn btn-pdf" onclick="window.print()">📥 Sauvegarder PDF</button>
</div>

<div class="page">
  <!-- HEADER -->
  <div class="hdr">
    <div class="hdr-left">
      ${logoDataUrl ? `<div class="logo-box"><img src="${logoDataUrl}" alt="Logo"/></div>` : ''}
      <div>
        <div class="store-title">${store.name}</div>
        <div class="store-sub">Planning des horaires · Semaine ${currentWeek} · ${currentYear}</div>
      </div>
    </div>
    <div class="week-box">
      <div class="week-num">S${currentWeek}</div>
      <div class="week-dates">${startDate}<br/>→ ${endDate}</div>
    </div>
  </div>

  <!-- TABLE -->
  <div class="tbl-wrap">
    <table>
      <thead>
        <tr>
          <th style="text-align:left;padding-left:16px">Employé</th>
          ${weekDates.map(wd=>`
            <th class="${wd.date.getDay()===0?'sun':''}">
              <div class="day-name">${wd.day.slice(0,3)}</div>
              <div class="day-date">${wd.date.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
            </th>`).join('')}
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(({emp,cells,totalH,diff})=>`
          <tr>
            <td class="ec">
              <span class="av" style="background:${emp.color||storeColor}">${emp.name[0]}</span>
              <span class="en">${emp.name}<span class="es">${emp.role} · ${emp.contractHours}h/Sem</span></span>
            </td>
            ${cells.map(c=>cellHTML(c)).join('')}
            <td class="tot">
              <div class="tot-h ${Math.abs(diff)<0.2?'ok':diff>0?'over':'under'}">${totalH.toFixed(1)}h</div>
              <div class="tot-d ${Math.abs(diff)<0.2?'ok':diff>0?'over':'under'}">${diff>0?'+':''}${diff.toFixed(1)}</div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- LEGEND -->
  <div class="leg">
    ${shiftTypes.map(st=>`
      <div class="leg-i">
        <div class="leg-dot" style="background:${st.color}"></div>
        <span style="color:${st.color}">${st.label}</span>
      </div>`).join('')}
  </div>

  <!-- FOOTER -->
  <div class="ftr">
    <span>Care Planning · ${store.name}</span>
    <span>Généré le ${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
  </div>
</div>

</body>
</html>`;

  const blob = new Blob([html], { type:'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(()=>URL.revokeObjectURL(url), 120000);
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
  const workTypes=['work','communication','meeting','school'];
  employees.forEach(emp=>{
    let t=0;
    const cells=weekDates.map((_,i)=>{
      const sh=sched[`${emp.id}_${i}`]; if(!sh) return '—';
      const st=shiftTypes.find(s=>s.id===sh.type);
      if(sh.hours&&workTypes.includes(sh.type)) t+=sh.hours;
      return sh.startTime?`${st?.label||'?'} ${sh.startTime}-${sh.endTime}`:(st?.label||'—');
    });
    lines.push(`| **${emp.name}** | ${cells.join(' | ')} | **${t.toFixed(1)}h** |`);
  });
  lines.push('\n---\n*Généré par Care Planning*');
  const text=lines.join('\n');
  navigator.clipboard.writeText(text).then(()=>alert('✅ Copié ! Collez dans Notion (Ctrl+V)')).catch(()=>{
    const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);alert('✅ Copié !');
  });
}
