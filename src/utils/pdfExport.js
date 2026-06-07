import html2canvas from 'html2canvas';
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

export async function exportToNotion({ store, employees, schedules, weekDates, shiftTypes, currentWeek, currentYear, logoDataUrl }) {
  const schedKey = `${store.id}_${currentYear}_W${currentWeek}`;
  const sched = schedules[schedKey] || {};
  const storeColor = store.color || '#00C9B1';
  const workTypes = ['work','communication','meeting','school'];
  const stMap = {};
  shiftTypes.forEach(st => { stMap[st.id] = st; });

  const startDate = weekDates[0].date.toLocaleDateString('fr-FR',{day:'numeric',month:'long'});
  const endDate   = weekDates[6].date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});

  // Build rows
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

  // Build an off-screen styled DOM node
  const node = document.createElement('div');
  node.style.cssText = `position:fixed;left:-99999px;top:0;width:1280px;background:#fff;font-family:'Segoe UI',Arial,sans-serif;`;

  const cellInner = (cell) => {
    if (cell.empty) return `<div style="min-height:54px;border-radius:9px;border:1.5px dashed #E2EBF0;display:flex;align-items:center;justify-content:center;color:#D0DDE5;font-size:18px;background:${cell.isSun?'#FFF7F7':'#FAFCFC'}">—</div>`;
    const { sh, st, st2 } = cell;
    return `<div style="border-radius:9px;border:1.5px solid ${st.color}40;background:${st.bgColor};padding:8px 6px;min-height:54px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">
      <span style="font-weight:700;font-size:12px;color:${st.color}">${st.label}</span>
      ${sh.startTime?`<span style="font-size:11px;color:${st.color};opacity:.9">${sh.startTime}–${sh.endTime}</span>`:''}
      ${mainHours(sh)>0?`<span style="font-size:11px;color:${st.color};opacity:.7">${fmtH(mainHours(sh))}</span>`:''}
      ${st2&&sh.split?`<div style="width:60%;height:1px;background:${st.color};opacity:.3;margin:2px 0"></div>
        <span style="font-weight:700;font-size:10px;color:${st2.color}">${st2.label}</span>
        ${sh.split.startTime?`<span style="font-size:9px;color:${st2.color};opacity:.85">${sh.split.startTime}–${sh.split.endTime}</span>`:''}`:''}
    </div>`;
  };

  node.innerHTML = `
    <div style="border-radius:18px;overflow:hidden;border:1.5px solid #E2EBF0;box-shadow:0 8px 32px rgba(0,0,0,.08)">
      <div style="background:${storeColor};padding:24px 32px;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:16px;">
          ${logoDataUrl?`<div style="background:rgba(255,255,255,.2);border-radius:10px;padding:8px 12px;"><img src="${logoDataUrl}" style="height:40px;display:block;object-fit:contain"/></div>`:''}
          <div>
            <div style="font-size:24px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:-.3px;">${store.name}</div>
            <div style="font-size:14px;color:rgba(255,255,255,.85);margin-top:3px;">Planning des horaires · Semaine ${currentWeek} · ${currentYear}</div>
          </div>
        </div>
        <div style="text-align:right;color:#fff;">
          <div style="font-size:42px;font-weight:900;line-height:1;letter-spacing:-2px;">S${currentWeek}</div>
          <div style="font-size:12px;opacity:.85;margin-top:3px;">${startDate} → ${endDate}</div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;background:#fff;">
        <thead>
          <tr style="background:#F4F7F9;">
            <th style="padding:14px 18px;text-align:left;font-size:12px;font-weight:700;color:#607D8B;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #E2EBF0;width:180px;">Employé</th>
            ${weekDates.map(wd=>`<th style="padding:14px 6px;text-align:center;font-size:12px;font-weight:700;color:#607D8B;text-transform:uppercase;border-bottom:2px solid #E2EBF0;">
              <div style="font-size:14px;font-weight:800;color:${wd.date.getDay()===0?'#C8002B':'#1B2A3B'}">${wd.day.slice(0,3)}</div>
              <div style="font-size:11px;color:#9EBBCA;margin-top:2px;">${wd.date.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
            </th>`).join('')}
            <th style="padding:14px 10px;text-align:center;font-size:12px;font-weight:700;color:#607D8B;text-transform:uppercase;border-bottom:2px solid #E2EBF0;width:90px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(({emp,cells,totalH,diff},ei)=>`
            <tr style="background:${ei%2===0?'#fff':'#FAFCFC'};border-bottom:1px solid #F0F5F7;">
              <td style="padding:12px 18px;">
                <div style="display:flex;align-items:center;gap:11px;">
                  <div style="width:38px;height:38px;border-radius:50%;background:${emp.color||storeColor};display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:16px;flex-shrink:0;">${emp.name[0]}</div>
                  <div>
                    <div style="font-weight:700;font-size:15px;color:#1B2A3B;">${emp.name}</div>
                    <div style="font-size:12px;color:#9EBBCA;text-transform:capitalize;margin-top:1px;">${emp.role} · ${emp.contractHours}h</div>
                  </div>
                </div>
              </td>
              ${cells.map(cell=>`<td style="padding:5px 4px;${cell.isSun?'background:#FFF8F8;':''}">${cellInner(cell)}</td>`).join('')}
              <td style="padding:10px;text-align:center;">
                <div style="font-size:18px;font-weight:800;color:${Math.abs(diff)<0.1?'#00A896':diff>0?'#C8002B':'#9EBBCA'};font-variant-numeric:tabular-nums;">${fmtH(totalH)}</div>
                <div style="font-size:12px;font-weight:700;color:${Math.abs(diff)<0.1?'#00A896':diff>0?'#C8002B':'#1A8A42'};margin-top:2px;">${diff>0?'+':diff<0?'-':''}${fmtH(Math.abs(diff))}</div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div style="padding:14px 24px;background:#FAFCFC;border-top:1.5px solid #F0F5F7;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
        ${shiftTypes.map(st=>`<span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:${st.color};"><span style="width:9px;height:9px;border-radius:50%;background:${st.color};display:inline-block;"></span>${st.label}</span>`).join('')}
        <span style="margin-left:auto;font-size:11px;color:#9EBBCA;">Généré par Care Planning · ${new Date().toLocaleDateString('fr-FR')}</span>
      </div>
    </div>
  `;

  document.body.appendChild(node);

  try {
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true });
    document.body.removeChild(node);

    // Try to copy to clipboard as PNG image
    canvas.toBlob(async (blob) => {
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
          alert('✅ Image du planning copiée ! Collez-la dans Notion (Ctrl+V / Cmd+V)');
        } else {
          throw new Error('Clipboard image not supported');
        }
      } catch (err) {
        // Fallback: download the PNG
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planning-${store.name}-S${currentWeek}.png`;
        a.click();
        setTimeout(()=>URL.revokeObjectURL(url), 5000);
        alert('📥 Votre navigateur ne permet pas la copie d\'image. L\'image a été téléchargée — glissez-la dans Notion.');
      }
    }, 'image/png');
  } catch (err) {
    if (node.parentNode) document.body.removeChild(node);
    alert('Erreur génération image : ' + err.message);
  }
}
