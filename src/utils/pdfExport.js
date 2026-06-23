import html2canvas from 'html2canvas';
// Build a schedule for `store` that also includes home employees' shifts done in OTHER stores (déplacements)
function buildMergedSched(store, employees, schedules, currentYear, currentWeek, allStores) {
  const base = { ...(schedules[`${store.id}_${currentYear}_W${currentWeek}`] || {}) };
  const wt = ['work','communication','meeting','school'];
  const homeEmps = employees.filter(e => e.storeId === store.id);
  const stores = allStores || [];
  homeEmps.forEach(emp => {
    for (let di=0; di<7; di++) {
      const key = `${emp.id}_${di}`;
      const here = base[key];
      if (here && wt.includes(here.type)) continue; // already working here
      for (const s of stores) {
        if (s.id === store.id) continue;
        const other = schedules[`${s.id}_${currentYear}_W${currentWeek}`] || {};
        const sh = other[key];
        if (sh && wt.includes(sh.type)) { base[key] = { ...sh, _away:true, _awayStore:s.name, _awayColor:s.color }; break; }
      }
    }
  });
  return base;
}
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

export async function exportToPDF({ store, employees, schedules, weekDates, shiftTypes, currentWeek, currentYear, logoDataUrl, allStores }) {

  const sched = buildMergedSched(store, employees, schedules, currentYear, currentWeek, allStores);
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
        ${sh._away ? `<span style="display:inline-block;font-size:9px;font-weight:800;color:#fff;background:${sh._awayColor||st.color};border-radius:5px;padding:1px 6px;margin-bottom:2px;">✈ ${sh._awayStore}</span>` : ''}
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
        ${rows.map(({emp,cells,totalH,diff,isVisitor,homeStore}) => `
          <tr${isVisitor?' style="background:#FFFDF0;"':''}>
            <td class="ec">
              <span class="av" style="background:${emp.color||storeColor}">${emp.name[0]}</span>
              <span class="en">${emp.name}${isVisitor?`<span style="margin-left:6px;font-size:10px;font-weight:700;color:${homeStore?.color||'#B07D00'};background:${homeStore?.color||'#B07D00'}1A;border:1px solid ${homeStore?.color||'#B07D00'}55;border-radius:5px;padding:1px 6px;white-space:nowrap;">✈ ${homeStore?.name||'renfort'}</span>`:''}<span class="es">${emp.role} · ${emp.contractHours}h/Sem</span></span>
            </td>
            ${cells.map(c => cellHTML(c)).join('')}
            <td class="tot">
              <div class="tot-h ${Math.abs(diff)<0.2?'c-ok':diff>0?'c-over':'c-under'}">${fmtH(totalH)}</div>
              <div class="tot-d ${Math.abs(diff)<0.2?'c-ok':diff>0?'c-over':'c-under'}">${diff>0?'+':diff<0?'-':''}${fmtH(Math.abs(diff))}</div>
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

export async function exportToNotion({ store, employees, schedules, weekDates, shiftTypes, currentWeek, currentYear, logoDataUrl, allStores }) {
  const sched = buildMergedSched(store, employees, schedules, currentYear, currentWeek, allStores);
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
    const isVisitor = emp.storeId !== store.id;
    const homeStore = isVisitor && allStores ? allStores.find(s=>s.id===emp.storeId) : null;
    return { emp, cells, totalH, diff, isVisitor, homeStore };
  });

  // Build an off-screen styled DOM node
  const node = document.createElement('div');
  node.style.cssText = `position:fixed;left:-99999px;top:0;width:1280px;background:#fff;font-family:'Segoe UI',Arial,sans-serif;`;

  const cellInner = (cell) => {
    if (cell.empty) return `<div style="min-height:54px;border-radius:9px;border:1.5px dashed #E2EBF0;display:flex;align-items:center;justify-content:center;color:#D0DDE5;font-size:18px;background:${cell.isSun?'#FFF7F7':'#FAFCFC'}">—</div>`;
    const { sh, st, st2 } = cell;
    return `<div style="border-radius:9px;border:1.5px solid ${st.color}40;background:${st.bgColor};padding:8px 6px;min-height:54px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">
      ${sh._away?`<span style="font-size:9px;font-weight:800;color:#fff;background:${sh._awayColor||st.color};border-radius:5px;padding:1px 6px;margin-bottom:1px;">✈ ${sh._awayStore}</span>`:''}
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
          ${rows.map(({emp,cells,totalH,diff,isVisitor,homeStore},ei)=>`
            <tr style="background:${isVisitor?'#FFFDF0':(ei%2===0?'#fff':'#FAFCFC')};border-bottom:1px solid #F0F5F7;">
              <td style="padding:12px 18px;">
                <div style="display:flex;align-items:center;gap:11px;">
                  <div style="width:38px;height:38px;border-radius:50%;background:${emp.color||storeColor};display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:16px;flex-shrink:0;">${emp.name[0]}</div>
                  <div>
                    <div style="font-weight:700;font-size:15px;color:#1B2A3B;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">${emp.name}${isVisitor?`<span style="font-size:10px;font-weight:700;color:${homeStore?.color||'#B07D00'};background:${homeStore?.color||'#B07D00'}1A;border:1px solid ${homeStore?.color||'#B07D00'}55;border-radius:5px;padding:2px 7px;">✈ ${homeStore?.name||'renfort'}</span>`:''}</div>
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

// ════════════════════════════════════════════════════════
//  PRIMES EXPORT
// ════════════════════════════════════════════════════════
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const _eur = n => (Math.round((n+Number.EPSILON)*100)/100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
const _sum = arr => Array.isArray(arr) ? arr.reduce((t,x)=>t+(Number(x)||0),0) : (Number(arr)||0);
const _UNIT = { smartphone:5, box:5, forfait999:10, forfait699:5, forfaitEngage:10, accessoire:1, extLow:3, extMid:4, extHigh:5 };
const _ASS = [16.90,15.90,10.90,6.90,3.90];
const _ITEMK = ['smartphone','box','forfait999','forfait699','forfaitEngage','accessoire','extLow','extMid','extHigh'];
function _addRate(m){ if(m<=0)return 0; if(m<=500)return .10; if(m<=1500)return .15; return .20; }
function _vBase(v){ let t=0; _ITEMK.forEach(k=>t+=(Number(v[k])||0)*_UNIT[k]); _ASS.forEach((a,i)=>t+=(Number(v['ass'+i])||0)*a); const am=_sum(v.addEntries); t+=am*_addRate(am); return t; }

// Build the prime data per store for a given month
function _buildStorePrime(store, employees, sd, getOvertime, year, month) {
  const storeMargin = _sum(sd.marginEntries);
  const p1 = Number(sd.palier1)||0, p2 = Number(sd.palier2)||0;
  let pool=0, palier='Aucun palier';
  if(p2>0 && storeMargin>=p2){ pool=storeMargin*0.03; palier='Palier 2 (3 %)'; }
  else if(p1>0 && storeMargin>=p1){ pool=storeMargin*0.015; palier='Palier 1 (1,5 %)'; }
  const vendeurs = sd.vendeurs || {};
  const emps = employees.filter(e=>e.storeId===store.id && (e.role==='vendeur'||e.role==='manager'));
  const rows = emps.map(emp=>{
    const v = vendeurs[emp.id]||{};
    const base = _vBase(v);
    const share = pool*(Number(v.storeBonusPct)||0)/100;
    // Build detailed breakdown lines
    const detail = [];
    const itemLabels = { smartphone:'Smartphones', box:'Box', forfait999:'Forfaits 9,99', forfait699:'Forfaits 6,99', forfaitEngage:'Forfaits engagement', accessoire:'Accessoires', extLow:'Ext. < 500 €', extMid:'Ext. 500-1000 €', extHigh:'Ext. > 1000 €' };
    _ITEMK.forEach(k=>{ const q=Number(v[k])||0; if(q>0) detail.push({ label:itemLabels[k], qty:q, unit:_UNIT[k], sub:q*_UNIT[k] }); });
    _ASS.forEach((a,i)=>{ const q=Number(v['ass'+i])||0; if(q>0) detail.push({ label:'Assurance '+_eur(a), qty:q, unit:a, sub:q*a }); });
    const am=_sum(v.addEntries); if(am>0) detail.push({ label:'Ventes add. ('+(_addRate(am)*100)+'%)', qty:null, unit:null, sub:am*_addRate(am), note:_eur(am)+' de marge' });
    const autoOt = (getOvertime && year!=null && month!=null) ? getOvertime(emp.id, year, month) : 0;
    const overtime = parseFloat((autoOt + (Number(v.manualOvertime)||0)).toFixed(2));
    return { name:emp.name, role:emp.role, base, share, total:base+share, travel:Number(v.travel)||0, overtime, detail, sharePct:Number(v.storeBonusPct)||0 };
  });
  const totalPrimes = rows.reduce((t,r)=>t+r.total,0);
  const totalTravel = rows.reduce((t,r)=>t+r.travel,0);
  const totalOvertime = rows.reduce((t,r)=>t+(r.overtime||0),0);
  return { storeMargin, pool, palier, rows, totalPrimes, totalTravel, totalOvertime };
}
function _fmtHrs(h){ const m=Math.round(h*60); const H=Math.floor(m/60); const M=m%60; return M===0?`${H}`:`${H}h${String(M).padStart(2,'0')}`; }

function _storeTableHTML(store, data) {
  const color = store.color || '#00C9B1';
  return `
  <div style="margin-bottom:26px;border-radius:16px;overflow:hidden;border:1.5px solid #E2EBF0;page-break-inside:avoid;">
    <div style="background:${color};padding:15px 22px;display:flex;align-items:center;justify-content:space-between;">
      <div style="font-size:19px;font-weight:800;color:#fff;">${store.name}</div>
      <div style="font-size:12px;color:#fff;opacity:.95;">${data.palier} · Enveloppe ${_eur(data.pool)} · Marge ${_eur(data.storeMargin)}</div>
    </div>
    <div style="padding:6px 0;background:#fff;">
      ${data.rows.length===0 ? `<div style="padding:16px 22px;color:#9EBBCA;font-style:italic;">Aucun collaborateur</div>` : data.rows.map(r=>`
        <div style="padding:12px 22px;border-bottom:1px solid #EEF3F5;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${r.detail.length?'8px':'0'};">
            <div style="font-size:15px;font-weight:700;">${r.name} <span style="font-size:11px;color:#9EBBCA;font-weight:500;">${r.role==='manager'?'· Manager':'· Vendeur'}</span></div>
            <div style="font-size:16px;font-weight:800;color:${color};">${_eur(r.total)}</div>
          </div>
          ${r.detail.length ? `<table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
            ${r.detail.map(d=>`<tr>
              <td style="padding:3px 0;font-size:12px;color:#5A6B78;">${d.label}${d.note?` <span style="color:#9EBBCA;">(${d.note})</span>`:''}</td>
              <td style="padding:3px 8px;font-size:12px;color:#5A6B78;text-align:center;">${d.qty!=null?`${d.qty} × ${_eur(d.unit)}`:''}</td>
              <td style="padding:3px 0;font-size:12px;font-weight:600;text-align:right;">${_eur(d.sub)}</td>
            </tr>`).join('')}
          </table>` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#5A6B78;border-top:1px dashed #E2EBF0;padding-top:5px;">
            <span>Prime ventes ${_eur(r.base)} · Part magasin ${_eur(r.share)} (${r.sharePct}%)</span>
            <span style="font-size:16px;"><strong style="color:#1B2A3B;">Frais dépl. : ${_eur(r.travel)}</strong>${r.overtime>0?` · <strong style="color:#B05A00;">H. supp à payer : ${_fmtHrs(r.overtime)} h</strong>`:''}</span>
          </div>
        </div>`).join('')}
      <div style="padding:13px 22px;background:#F6FAFB;border-top:2px solid ${color}40;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:14px;font-weight:800;">TOTAL ${store.name}</span>
        <span style="font-size:13px;color:#5A6B78;"><strong style="font-size:16px;color:#1B2A3B;">Frais : ${_eur(data.totalTravel)}</strong>${data.totalOvertime>0?` · <strong style="font-size:16px;color:#B05A00;">H. supp : ${_fmtHrs(data.totalOvertime)} h</strong>`:''} · <strong style="font-size:17px;color:${color};">Primes ${_eur(data.totalPrimes)}</strong></span>
      </div>
    </div>
  </div>`;
}

export async function exportPrimesPDF({ storesData, month, year, scope, mode }) {
  const { default: jsPDF } = await import('jspdf');
  const title = scope === 'direction' ? 'Primes — Toutes les boutiques (Direction)' : `Primes — ${storesData[0]?.store.name||''}`;
  const grandTotal = storesData.reduce((t,sd)=>t+sd.data.totalPrimes,0);
  const grandTravel = storesData.reduce((t,sd)=>t+sd.data.totalTravel,0);
  const grandOvertime = storesData.reduce((t,sd)=>t+(sd.data.totalOvertime||0),0);

  const node = document.createElement('div');
  node.style.cssText = `position:fixed;left:-99999px;top:0;width:900px;background:#fff;font-family:'Segoe UI',Arial,sans-serif;padding:32px;color:#1B2A3B;`;
  node.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;">
      <div>
        <div style="font-size:25px;font-weight:800;">${title}</div>
        <div style="font-size:15px;color:#5A6B78;">${MONTHS_FR[month]} ${year}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px;color:#5A6B78;text-transform:uppercase;font-weight:700;">Total général primes</div>
        <div style="font-size:27px;font-weight:800;color:#00A896;">${_eur(grandTotal)}</div>
        <div style="font-size:13px;color:#5A6B78;"><strong style="font-size:16px;color:#1B2A3B;">Frais déplacement : ${_eur(grandTravel)}</strong>${grandOvertime>0?` · <strong style="font-size:16px;color:#B05A00;">H. supp à payer : ${_fmtHrs(grandOvertime)} h</strong>`:''}</div>
      </div>
    </div>
    ${storesData.map(sd=>_storeTableHTML(sd.store, sd.data)).join('')}
    <div style="margin-top:16px;text-align:right;font-size:11px;color:#9EBBCA;">Généré par Care Planning · ${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>`;
  document.body.appendChild(node);

  try {
    const canvas = await html2canvas(node, { scale: 2, backgroundColor:'#ffffff', logging:false, useCORS:true });
    document.body.removeChild(node);
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p','mm','a4');
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const imgW = pw - margin*2;
    const imgH = canvas.height * imgW / canvas.width;
    let heightLeft = imgH;
    let position = margin;
    pdf.addImage(img, 'PNG', margin, position, imgW, imgH);
    heightLeft -= (ph - margin*2);
    while (heightLeft > 0) {
      position = margin - (imgH - heightLeft);
      pdf.addPage();
      pdf.addImage(img, 'PNG', margin, position, imgW, imgH);
      heightLeft -= (ph - margin*2);
    }
    const fname = (scope==='direction'?'primes-direction':'primes-'+(storesData[0]?.store.name||'')).replace(/\s+/g,'-').toLowerCase();
    if (mode === 'preview') {
      // Open the PDF in a new browser tab instead of downloading
      const blobUrl = pdf.output('bloburl');
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        // Popup blocked → fall back to download
        pdf.save(`${fname}-${MONTHS_FR[month]}-${year}.pdf`);
      }
    } else {
      pdf.save(`${fname}-${MONTHS_FR[month]}-${year}.pdf`);
    }
  } catch(err) {
    if(node.parentNode) document.body.removeChild(node);
    alert('Erreur génération PDF : '+err.message);
  }
}

export async function exportPrimesNotion({ storesData, month, year, scope }) {
  const title = scope === 'direction' ? 'Primes — Toutes les boutiques' : `Primes — ${storesData[0]?.store.name||''}`;
  const grandTotal = storesData.reduce((t,sd)=>t+sd.data.totalPrimes,0);
  const node = document.createElement('div');
  node.style.cssText = `position:fixed;left:-99999px;top:0;width:1100px;background:#fff;font-family:'Segoe UI',Arial,sans-serif;padding:32px;`;
  node.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <div><div style="font-size:24px;font-weight:800;color:#1B2A3B;">${title}</div>
      <div style="font-size:14px;color:#5A6B78;">${MONTHS_FR[month]} ${year}</div></div>
      <div style="text-align:right;"><div style="font-size:12px;color:#5A6B78;text-transform:uppercase;font-weight:700;">Total général</div>
      <div style="font-size:26px;font-weight:800;color:#00A896;">${_eur(grandTotal)}</div></div>
    </div>
    ${storesData.map(sd=>_storeTableHTML(sd.store, sd.data)).join('')}
    <div style="margin-top:14px;text-align:right;font-size:11px;color:#9EBBCA;">Care Planning · ${new Date().toLocaleDateString('fr-FR')}</div>`;
  document.body.appendChild(node);
  try {
    const canvas = await html2canvas(node, { scale:2, backgroundColor:'#ffffff', logging:false, useCORS:true });
    document.body.removeChild(node);
    canvas.toBlob(async (blob)=>{
      try {
        if(navigator.clipboard && window.ClipboardItem){
          await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
          alert('✅ Image des primes copiée ! Collez-la dans Notion (Ctrl+V / Cmd+V)');
        } else throw new Error('no clipboard');
      } catch {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href=url; a.download=`primes-${MONTHS_FR[month]}-${year}.png`; a.click();
        setTimeout(()=>URL.revokeObjectURL(url),5000);
        alert('📥 Image téléchargée — glissez-la dans Notion.');
      }
    }, 'image/png');
  } catch(err){ if(node.parentNode) document.body.removeChild(node); alert('Erreur génération image : '+err.message); }
}

export { _buildStorePrime as buildStorePrime };
