function calcH(s,e,b){
  try{const[sh,sm]=s.split(':').map(Number),[eh,em]=e.split(':').map(Number);
  const d=(eh*60+em)-(sh*60+sm);if(d<=0)return 0;
  return Math.max(0,parseFloat(((d-Math.round((b||0)*60))/60).toFixed(2)));}catch{return 0;}
}
function mainHours(sh){ if(!sh||!sh.startTime||!sh.endTime)return 0; return calcH(sh.startTime,sh.endTime,sh.breakH||0); }
function splitHours(sh){ if(!sh||!sh.split||!sh.split.startTime||!sh.split.endTime)return 0; return calcH(sh.split.startTime,sh.split.endTime,sh.split.breakH||0); }
function fmtH(decimalHours){
  if(decimalHours==null||isNaN(decimalHours)) return '0h';
  const totalMin=Math.round(decimalHours*60);
  const h=Math.floor(totalMin/60), m=totalMin%60;
  return m===0 ? `${h}h` : `${h}h${String(m).padStart(2,'0')}`;
}

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
      if (workTypes.includes(sh.type)) totalH += mainHours(sh);
      if (sh.split && workTypes.includes(sh.split.type)) totalH += splitHours(sh);
      return { sh, st, st2, isSun:wd.date.getDay()===0 };
    });
    const diff = totalH - (emp.contractHours||35);
    return { emp, cells, totalH, diff };
  });

  function cellHTML(cell) {
    if (cell.empty) {
      return `<td class="sc${cell.isSun?' sun':''}"><div class="empty">—</div></td>`;
    }
    const { sh, st, st2, isSun } = cell;
    return `<td class="sc${isSun?' sun':''}">
      <div class="pill" style="background:${st.bgColor};border-color:${st.color}44">
        <span class="lbl" style="color:${st.color}">${st.label}</span>
        ${sh.startTime ? `<span class="tm" style="color:${st.color}">${sh.startTime}–${sh.endTime}</span>` : ''}
        ${(sh.hours||0) > 0 ? `<span class="hr" style="color:${st.color}">${fmtH(mainHours(sh))}</span>` : ''}
        ${st2 ? `<div class="sep" style="background:${st.color}"></div>
          <span class="lbl" style="color:${st2.color};font-size:9px">${st2.label}</span>
          ${sh.split?.startTime ? `<span class="tm" style="color:${st2.color}">${sh.split.startTime}–${sh.split.endTime}</span>` : ''}
          ${(sh.split?.hours||0) > 0 ? `<span class="hr" style="color:${st2.color}">${fmtH(splitHours(sh))}</span>` : ''}` : ''}
      </div>
    </td>`;
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Planning ${store.name} S${currentWeek}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}

/* ════ SCREEN ════ */
html,body{
  width:100%;min-height:100vh;
  font-family:'Segoe UI',Arial,sans-serif;
  background:#DDE3E8;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}
body{
  display:flex;
  flex-direction:column;
  align-items:center;
  padding:20px;
  gap:14px;
}

/* Boutons */
.toolbar{
  display:flex;gap:10px;
  width:100%;max-width:1200px;
  justify-content:flex-end;
}
.btn{
  padding:10px 22px;border-radius:9px;border:none;cursor:pointer;
  font-size:14px;font-weight:700;font-family:inherit;
  display:inline-flex;align-items:center;gap:7px;
}
.b-print{background:#fff;color:#1B2A3B;border:1.5px solid #CBD5E0}
.b-pdf{background:${storeColor};color:#fff;box-shadow:0 3px 12px ${storeColor}55}

/* Carte PDF */
.page{
  width:100%;
  max-width:1200px;
  background:#fff;
  border-radius:14px;
  overflow:hidden;
  box-shadow:0 6px 32px rgba(0,0,0,.18);
  display:flex;
  flex-direction:column;
}

/* Header */
.hdr{
  background:${storeColor};
  padding:20px 28px;
  display:flex;align-items:center;justify-content:space-between;
  flex-shrink:0;
}
.hdr-left{display:flex;align-items:center;gap:16px}
.logo-box{background:rgba(255,255,255,.2);border-radius:9px;padding:6px 10px}
.logo-box img{height:36px;object-fit:contain;display:block}
.store-name{font-size:20px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:-.3px}
.store-sub{font-size:12px;color:rgba(255,255,255,.8);margin-top:2px}
.week-box{text-align:right;color:#fff}
.week-num{font-size:36px;font-weight:900;line-height:1;letter-spacing:-2px}
.week-dates{font-size:11px;opacity:.8;margin-top:2px}

/* Table */
.tbl-wrap{flex:1;overflow-x:auto}
table{width:100%;border-collapse:collapse;table-layout:fixed;min-width:700px}
thead th{
  background:#F4F7F9;
  padding:10px 5px;
  font-size:11px;font-weight:700;color:#607D8B;
  text-transform:uppercase;letter-spacing:.04em;
  border-bottom:2px solid #E2EBF0;
  text-align:center;
}
thead th.emp-th{text-align:left;padding-left:16px;width:160px}
thead th.tot-th{width:80px}
.dn{font-size:13px;font-weight:800;color:#1B2A3B}
.dd{font-size:10px;color:#9EBBCA;margin-top:1px}
thead th.sun-th .dn{color:#C8002B}

tbody tr{border-bottom:1px solid #F0F5F7}
tbody tr:nth-child(even) td{background:#FAFCFC}

/* Employee cell */
.ec{padding:10px 16px;vertical-align:middle}
.av{
  width:32px;height:32px;border-radius:50%;
  display:inline-flex;align-items:center;justify-content:center;
  font-weight:800;color:#fff;font-size:13px;flex-shrink:0;
  margin-right:9px;vertical-align:middle;
}
.en{font-weight:700;font-size:13px;color:#1B2A3B;vertical-align:middle}
.es{font-size:10px;color:#9EBBCA;text-transform:capitalize;display:block;margin-top:1px}

/* Shift cells */
.sc{padding:4px 3px;vertical-align:middle}
.sun{background:#FFF8F8!important}
.empty{
  min-height:50px;border-radius:7px;border:1.5px dashed #E2EBF0;
  display:flex;align-items:center;justify-content:center;
  color:#D0DDE5;font-size:14px;
}
.sun .empty{border-color:#FFCDD2}
.pill{
  border-radius:7px;border:1.5px solid transparent;
  padding:5px 3px;min-height:50px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
}
.lbl{font-weight:700;font-size:11px;text-align:center}
.tm{font-size:10px;opacity:.85;text-align:center}
.hr{font-size:10px;opacity:.7;text-align:center}
.sep{width:55%;height:1px;opacity:.3;margin:2px auto}

/* Total */
.tot{padding:8px 10px;text-align:center;vertical-align:middle}
.tot-h{font-size:16px;font-weight:800;line-height:1}
.tot-d{font-size:10px;font-weight:700;margin-top:2px}
.c-ok{color:#00A896}.c-over{color:#C8002B}.c-under{color:#9EBBCA}

/* Legend */
.leg{
  padding:10px 20px;border-top:1.5px solid #F0F5F7;
  display:flex;flex-wrap:wrap;gap:12px;
  background:#FAFCFC;
}
.li{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600}
.ld{width:8px;height:8px;border-radius:50%}

/* Footer */
.ftr{
  padding:8px 20px;border-top:1px solid #F0F5F7;
  display:flex;justify-content:space-between;
  font-size:10px;color:#9EBBCA;
}

/* ════ PRINT ════ */
@media print{
  body{
    display:block;
    background:#fff;
    padding:0;margin:0;
  }
  .toolbar{display:none!important}
  .page{
    width:100%;max-width:none;
    border-radius:0;box-shadow:none;
    height:100%;
  }
  @page{size:A4 landscape;margin:5mm}
}
</style>
</head>
<body>

<div class="toolbar">
  <button class="btn b-print" onclick="window.print()">🖨️ Imprimer / Sauvegarder PDF</button>
</div>

<div class="page">
  <div class="hdr">
    <div class="hdr-left">
      ${logoDataUrl ? `<div class="logo-box"><img src="${logoDataUrl}" alt=""/></div>` : ''}
      <div>
        <div class="store-name">${store.name}</div>
        <div class="store-sub">Planning des horaires · Semaine ${currentWeek} · ${currentYear}</div>
      </div>
    </div>
    <div class="week-box">
      <div class="week-num">S${currentWeek}</div>
      <div class="week-dates">${startDate}<br/>→ ${endDate}</div>
    </div>
  </div>

  <div class="tbl-wrap">
    <table>
      <thead>
        <tr>
          <th class="emp-th">Employé</th>
          ${weekDates.map(wd => `
            <th class="${wd.date.getDay()===0?'sun-th':''}">
              <div class="dn">${wd.day.slice(0,3)}</div>
              <div class="dd">${wd.date.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
            </th>`).join('')}
          <th class="tot-th">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(({emp,cells,totalH,diff}) => `
          <tr>
            <td class="ec">
              <span class="av" style="background:${emp.color||storeColor}">${emp.name[0]}</span>
              <span class="en">${emp.name}<span class="es">${emp.role} · ${emp.contractHours}h/Sem</span></span>
            </td>
            ${cells.map(c => cellHTML(c)).join('')}
            <td class="tot">
              <div class="tot-h ${Math.abs(diff)<0.2?'c-ok':diff>0?'c-over':'c-under'}">${fmtH(totalH)}</div>
              <div class="tot-d ${Math.abs(diff)<0.2?'c-ok':diff>0?'c-over':'c-under'}">${diff>0?'+':''}${diff.toFixed(1)}</div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="leg">
    ${shiftTypes.map(st => `
      <div class="li">
        <div class="ld" style="background:${st.color}"></div>
        <span style="color:${st.color}">${st.label}</span>
      </div>`).join('')}
  </div>

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
  setTimeout(() => URL.revokeObjectURL(url), 120000);
}

export function exportToNotion({ store, employees, schedules, weekDates, shiftTypes, currentWeek, currentYear }) {
  const key=`${store.id}_${currentYear}_W${currentWeek}`;
  const sched=schedules[key]||{};
  const workTypes=['work','communication','meeting','school'];
  const lines=[
    `# 📅 Planning — ${store.name}`,
    `**Semaine ${currentWeek}** | ${weekDates[0].date.toLocaleDateString('fr-FR')} – ${weekDates[6].date.toLocaleDateString('fr-FR')}`,
    '',
    `| Employé | ${weekDates.map(w=>w.day.slice(0,3)).join(' | ')} | Total |`,
    `| --- | ${weekDates.map(()=>'---').join(' | ')} | --- |`,
  ];
  employees.forEach(emp=>{
    let t=0;
    const cells=weekDates.map((_,i)=>{
      const sh=sched[`${emp.id}_${i}`]; if(!sh) return '—';
      const st=shiftTypes.find(s=>s.id===sh.type);
      if(workTypes.includes(sh.type)) t+=mainHours(sh); if(sh.split&&workTypes.includes(sh.split.type)) t+=splitHours(sh);
      return sh.startTime?`${st?.label||'?'} ${sh.startTime}-${sh.endTime}`:(st?.label||'—');
    });
    lines.push(`| **${emp.name}** | ${cells.join(' | ')} | **${fmtH(t)}** |`);
  });
  lines.push('\n---\n*Généré par Care Planning*');
  const text=lines.join('\n');
  navigator.clipboard.writeText(text)
    .then(()=>alert('✅ Copié ! Collez dans Notion (Ctrl+V)'))
    .catch(()=>{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);alert('✅ Copié !');});
}
