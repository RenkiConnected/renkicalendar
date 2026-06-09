import emailjs from '@emailjs/browser';

const SERVICE_ID  = 'service_qbwxrfs';
const TEMPLATE_ID = 'template_fidobtf';
const PUBLIC_KEY  = 'aeWj_p7LQqxhj5fu3';

// Initialize once
emailjs.init(PUBLIC_KEY);

// Get notification emails from appSettings (stored in Firebase)
function getNotifEmails(appSettings) {
  return appSettings?.notificationEmails || '';
}

export async function sendLeaveRequestEmail({ employee, leaveType, dates, storeName, appSettings }) {
  const to = getNotifEmails(appSettings);
  if (!to) return; // no emails configured

  const typeLabel = leaveType === 'vacation' ? 'Congés payés'
    : leaveType === 'sick' ? 'Arrêt maladie'
    : leaveType === 'unpaid' ? 'Congé sans solde'
    : leaveType === 'rtt' ? 'RTT'
    : leaveType;

  await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    to_emails:     to,
    employee_name: employee,
    store_name:    storeName,
    leave_type:    typeLabel,
    leave_dates:   dates,
    subject:       `🌴 Nouvelle demande de congé — ${employee}`,
    message:       `${employee} (${storeName}) a posé une demande de congé.\n\nType : ${typeLabel}\nDates : ${dates}\n\nConnectez-vous sur Care Planning pour valider ou refuser.`,
  });
}

export async function sendConstraintRequestEmail({ employee, type, date, startTime, endTime, note, storeName, appSettings }) {
  const to = getNotifEmails(appSettings);
  if (!to) return;

  const typeLabel = type === 'constraint' ? '⏰ Contrainte horaire' : '🌟 Demande exceptionnelle';
  const timeInfo = startTime && endTime ? `${startTime} → ${endTime}` : startTime ? `Arrivée : ${startTime}` : endTime ? `Départ : ${endTime}` : '—';
  const dateStr = date ? new Date(date + 'T12:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : date;

  await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    to_emails:     to,
    employee_name: employee,
    store_name:    storeName,
    leave_type:    typeLabel,
    leave_dates:   dateStr,
    subject:       `${typeLabel} — ${employee}`,
    message:       `${employee} (${storeName}) a soumis une ${typeLabel}.\n\nDate : ${dateStr}\nHoraires : ${timeInfo}${note ? `\nRaison : ${note}` : ''}\n\nConnectez-vous sur Care Planning pour valider ou refuser.`,
  });
}
