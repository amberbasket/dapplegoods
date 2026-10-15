// Sends plain-text order emails. Uses Resend's HTTP API when RESEND_API_KEY is
// set, otherwise SMTP when SMTP_URL is set. With neither, the email is only logged.
const money = (n) => '$' + Number(n).toFixed(2);

const ORDER_EMAIL = process.env.ORDER_EMAIL || 'hello@dapplegoods.ca';
const MAIL_FROM = process.env.MAIL_FROM || `Dapple Goods <${ORDER_EMAIL}>`;
const PROVIDER = process.env.RESEND_API_KEY ? 'resend' : process.env.SMTP_URL ? 'smtp' : null;

let smtp;
async function send({ to, subject, text, replyTo }) {
  if (PROVIDER === 'resend') {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, text, reply_to: replyTo }),
    });
    if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
    return true;
  }
  if (PROVIDER === 'smtp') {
    smtp ||= require('nodemailer').createTransport(process.env.SMTP_URL);
    await smtp.sendMail({ from: MAIL_FROM, to, subject, text, replyTo });
    return true;
  }
  console.log(`[email not configured] To: ${to}\nSubject: ${subject}\n\n${text}`);
  return false;
}

function orderText(o) {
  const c = o.customer;
  const lines = [
    `New order ${o.id}`,
    `Placed: ${new Date(o.createdAt).toLocaleString('en-CA', { timeZone: 'America/Vancouver' })} (Pacific)`,
    `Payment: ${o.status === 'paid' ? 'Paid online (Stripe)' : 'Not paid yet. Send the customer an invoice (add GST/HST and PST where they apply).'}`,
    '',
    'ITEMS',
    ...o.items.map((i) => `${i.qty} x ${i.name}${i.brand ? ` (${i.brand})` : ''} (item #${i.id}) @ ${money(i.price)} = ${money(i.price * i.qty)}`),
    '',
    `Subtotal: ${money(o.subtotal)}`,
    `Shipping: ${o.shipping ? money(o.shipping) : 'Free'}`,
    `Total:    ${money(o.total)} CAD, before tax`,
    '',
    'CUSTOMER',
    `${c.firstName} ${c.lastName}`,
    c.email,
    c.phone || null,
    '',
    'SHIP TO',
    `${c.firstName} ${c.lastName}`,
    c.address,
    c.address2 || null,
    `${c.city}, ${c.region}  ${c.postal}`,
    'Canada',
  ];
  if (c.giftNote) lines.push('', 'ORDER NOTE / GIFT MESSAGE', c.giftNote);
  return lines.filter((l) => l !== null).join('\n');
}

async function sendOrderEmail(o) {
  return send({ to: ORDER_EMAIL, replyTo: o.customer.email, subject: `New order ${o.id}: ${money(o.total)} from ${o.customer.firstName} ${o.customer.lastName}`, text: orderText(o) });
}

module.exports = { sendOrderEmail, orderText, ORDER_EMAIL, PROVIDER };
