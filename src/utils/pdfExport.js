// PDF Export using jsPDF
export function exportToPDF({ store, employees, schedules, weekDates, shiftTypes, currentWeek, currentYear }) {
  // Dynamic import to avoid SSR issues
  import('jspdf').then(({ default: jsPDF }) => {
    import('jspdf-autotable').then(() => {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      const storeColor = store.color || '#00B8D4';
      const hexToRGB = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
      };

      const [sr, sg, sb] = hexToRGB(storeColor);

      // Header background
      doc.setFillColor(10, 15, 30);
      doc.rect(0, 0, 297, 297, 'F');

      // Colored header bar
      doc.setFillColor(sr, sg, sb);
      doc.rect(0, 0, 297, 22, 'F');

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(`CARE PLANNING — ${store.name.toUpperCase()}`, 10, 13);

      const startDate = weekDates[0].date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      const endDate = weekDates[6].date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255, 180);
      doc.text(`Semaine ${currentWeek} · ${startDate} au ${endDate}`, 10, 19);

      doc.setFontSize(11);
      doc.text(`S${currentWeek} / ${currentYear}`, 270, 13, { align: 'right' });

      // Table headers
      const headers = ['Employé', 'Contrat', ...weekDates.map(wd =>
        `${wd.day.slice(0, 3)}\n${wd.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`
      ), 'Total'];

      // Table rows
      const rows = employees.map(emp => {
        let totalH = 0;
        const row = [
          emp.name,
          `${emp.contractHours}h`,
          ...weekDates.map((_, i) => {
            const key = `${emp.id}_${i}`;
            const scheduleKey = `${store.id}_${currentYear}_W${currentWeek}`;
            const shift = schedules[scheduleKey]?.[key];
            if (!shift) return '';
            const st = shiftTypes.find(s => s.id === shift.type);
            if (shift.hours) totalH += shift.hours;
            const label = st?.label || shift.type;
            if (shift.startTime) return `${label}\n${shift.startTime}-${shift.endTime}\n${shift.hours || 0}h`;
            return label;
          }),
        ];
        row.push(`${totalH.toFixed(1)}h`);
        return row;
      });

      // Shift type colors for cells
      const getShiftColor = (cellText) => {
        if (!cellText) return null;
        for (const st of shiftTypes) {
          if (cellText.includes(st.label)) return st;
        }
        return null;
      };

      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 26,
        theme: 'grid',
        styles: {
          fontSize: 7.5,
          cellPadding: 3,
          font: 'helvetica',
          fillColor: [17, 24, 39],
          textColor: [249, 250, 251],
          lineColor: [31, 41, 55],
          lineWidth: 0.3,
          valign: 'middle',
          halign: 'center',
        },
        headStyles: {
          fillColor: [sr, sg, sb],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold', cellWidth: 28 },
          1: { cellWidth: 16 },
          9: { fontStyle: 'bold' },
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index >= 2 && data.column.index <= 8) {
            const text = data.cell.raw;
            if (!text) return;
            const st = getShiftColor(String(text));
            if (!st) return;
            const [r, g, b] = hexToRGB(st.bgColor.startsWith('#') ? st.bgColor : '#1E3A5F');
            doc.setFillColor(r, g, b);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            const [tr, tg, tb] = hexToRGB(st.color.startsWith('#') ? st.color : '#93C5FD');
            doc.setTextColor(tr, tg, tb);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text(String(text), data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { align: 'center', baseline: 'middle' });
          }
        },
      });

      // Legend at bottom
      const finalY = doc.lastAutoTable.finalY + 6;
      doc.setFontSize(7);
      let xPos = 10;
      shiftTypes.forEach(st => {
        const [r, g, b] = hexToRGB(st.bgColor.startsWith('#') ? st.bgColor : '#1E3A5F');
        doc.setFillColor(r, g, b);
        doc.roundedRect(xPos, finalY, 3, 3, 0.5, 0.5, 'F');
        const [tr, tg, tb] = hexToRGB(st.color.startsWith('#') ? st.color : '#FFFFFF');
        doc.setTextColor(tr, tg, tb);
        doc.text(st.label, xPos + 5, finalY + 2.5);
        xPos += doc.getTextWidth(st.label) + 12;
      });

      // Footer
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.text(`Généré par Care Planning · ${new Date().toLocaleDateString('fr-FR')}`, 148, 200, { align: 'center' });

      doc.save(`planning_${store.name.replace(/\s+/g, '_')}_S${currentWeek}_${currentYear}.pdf`);
    });
  });
}

// Notion export (copies markdown to clipboard)
export function exportToNotion({ store, employees, schedules, weekDates, shiftTypes, currentWeek, currentYear }) {
  const lines = [];
  lines.push(`# 📅 Planning — ${store.name}`);
  lines.push(`**Semaine ${currentWeek} | ${weekDates[0].date.toLocaleDateString('fr-FR')} – ${weekDates[6].date.toLocaleDateString('fr-FR')}**`);
  lines.push('');

  // Header row
  const header = ['Employé', ...weekDates.map(wd => wd.day.slice(0, 3)), 'Total'].join(' | ');
  lines.push(`| ${header} |`);
  lines.push(`| ${Array(weekDates.length + 2).fill('---').join(' | ')} |`);

  employees.forEach(emp => {
    let totalH = 0;
    const scheduleKey = `${store.id}_${currentYear}_W${currentWeek}`;
    const cells = weekDates.map((_, i) => {
      const shift = schedules[scheduleKey]?.[`${emp.id}_${i}`];
      if (!shift) return '—';
      const st = shiftTypes.find(s => s.id === shift.type);
      if (shift.hours) totalH += shift.hours;
      return shift.startTime ? `${st?.label} ${shift.startTime}-${shift.endTime}` : (st?.label || '—');
    });
    lines.push(`| **${emp.name}** | ${cells.join(' | ')} | **${totalH.toFixed(1)}h** |`);
  });

  lines.push('');
  lines.push('---');
  lines.push('*Généré par Care Planning*');

  const text = lines.join('\n');
  navigator.clipboard.writeText(text).then(() => {
    alert('✅ Planning copié ! Collez-le directement dans Notion (Cmd+V / Ctrl+V)');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('✅ Planning copié dans le presse-papier !');
  });
}
