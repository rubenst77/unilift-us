function inquiryLabel(type) {
  return {
    quote: 'Request a Quote',
    datasheet: 'Get Datasheet',
    distributor: 'Become a US Distributor'
  }[type] || type || 'Inquiry';
}

function formatLeadMessage(payload) {
  const label = inquiryLabel(payload.inquiry);
  const lines = [
    `Source: ${payload.source || 'website'}`,
    `Name: ${payload.name || '—'}`,
    `Company: ${payload.company || '—'}`,
    `Email: ${payload.email || '—'}`,
    `Phone: ${payload.phone || '—'}`,
    `Model: ${payload.model || '—'}`,
    `Inquiry: ${label}`,
    `Page: ${payload.page || '—'}`,
    ''
  ];
  if (payload.message) lines.push(payload.message);
  if (payload.intent) lines.push(`Chat intent: ${payload.intent}`);
  if (payload.text) lines.push(`Chat message: ${payload.text}`);
  return lines.join('\n');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const payload = req.body || {};
  const to = process.env.LEAD_TO_EMAIL || 'ruben.dacosta@fas-technology.com';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ ok: false, error: 'Email service not configured' });
  }

  const label = inquiryLabel(payload.inquiry || payload.intent);
  const subjectName = payload.company || payload.name || 'Website lead';
  const subject = `UNILIFT Lead: ${label} — ${subjectName}`;
  const text = formatLeadMessage(payload);
  const html = text
    .split('\n')
    .map((line) => `<p>${escapeHtml(line || '&nbsp;')}</p>`)
    .join('');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'UNILIFT US <onboarding@resend.dev>',
        to: [to],
        reply_to: payload.email || undefined,
        subject,
        html
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[lead] Resend error:', errText);
      return res.status(500).json({ ok: false, error: 'Send failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[lead] Send failed:', err);
    return res.status(500).json({ ok: false, error: 'Send failed' });
  }
}
