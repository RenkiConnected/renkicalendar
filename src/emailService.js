import emailjs from '@emailjs/browser';

const SERVICE_ID  = 'service_qbwxrfs';
const TEMPLATE_ID = 'template_fidobtf';
const PUBLIC_KEY  = 'aeWj_p7LQqxhj5fu3';

emailjs.init(PUBLIC_KEY);

export async function sendLeaveRequestEmail({ employee, leaveType, dates, weeks, storeName, toEmails, appSettings }) {
  // Accept toEmails directly, or fall back to appSettings
  const to = (toEmails || appSettings?.notificationEmails || '').trim();

  console.log('[EmailJS] sendLeaveRequestEmail → recipients:', to);

  if (!to) {
    console.warn('[EmailJS] Aucune adresse email configurée — envoi ignoré. Allez dans Paramètres → Emails de la Direction.');
    return;
  }

  const typeLabel = leaveType === 'vacation' ? 'Congés payés'
    : leaveType === 'sick'   ? 'Arrêt maladie'
    : leaveType === 'unpaid' ? 'Congé sans solde'
    : leaveType === 'rtt'    ? 'RTT'
    : leaveType || 'Congé';

  const params = {
    to_emails:     to,
    employee_name: employee || '—',
    store_name:    storeName || '—',
    leave_type:    typeLabel,
    leave_dates:   dates || '—',
    subject:       `🌴 Demande de congé — ${employee} · ${weeks||dates||''}`,
    message:       `Bonjour,\n\n${employee} (${storeName}) a posé une demande de congé.\n\n📋 Type    : ${typeLabel}\n📅 Dates   : ${dates}\n🗓️ Semaine : ${weeks||'—'}\n\nConnectez-vous sur Care Planning pour valider ou refuser.\n\nhttps://renkicalendar.vercel.app`,
  };

  console.log('[EmailJS] Sending with params:', params);

  try {
    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, params);
    console.log('[EmailJS] ✅ Email sent successfully:', result.status, result.text);
  } catch (err) {
    console.error('[EmailJS] ❌ Send failed:', err);
    throw err; // re-throw so AppContext catches it
  }
}
