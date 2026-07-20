// Se dispara automáticamente en CADA envío de Netlify Forms (evento "submission-created").
// 1) Envía el lead a Ground Wind (info@groundwind.eu).
// 2) Envía una autorespuesta de confirmación a quien rellena el formulario.
// Usa SMTP del buzón info@ vía Nodemailer.
//
// Variables de entorno necesarias en Netlify:
//   SMTP_HOST, SMTP_PORT (465 o 587), SMTP_USER, SMTP_PASS
// Opcionales (con valores por defecto):
//   MAIL_FROM     -> "Ground Wind Holding <info@groundwind.eu>"
//   MAIL_TO       -> "info@groundwind.eu"   (destinatario interno del lead)
//   MAIL_REPLY_TO -> "info@groundwind.eu"   (reply-to de la autorespuesta)

const nodemailer = require('nodemailer');

const COPY = {
  es: {
    subject: 'Hemos recibido tu solicitud — Ground Wind Holding',
    lines: [
      'Hemos recibido correctamente tu solicitud a través de la web de Ground Wind Holding.',
      'Muchas gracias por ponerte en contacto con nosotros. Revisaremos tu mensaje y nos pondremos en contacto contigo a la mayor brevedad posible.',
      'Un cordial saludo,',
      'Equipo de Ground Wind Holding'
    ]
  },
  en: {
    subject: 'We have received your enquiry — Ground Wind Holding',
    lines: [
      'We have successfully received your enquiry through the Ground Wind Holding website.',
      'Thank you very much for getting in touch. We will review your message and get back to you as soon as possible.',
      'Kind regards,',
      'The Ground Wind Holding team'
    ]
  }
};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function autoReplyHtml(lines) {
  const body = lines.map(function (l) { return '<p style="margin:0 0 16px;">' + esc(l) + '</p>'; }).join('');
  return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#171D15;">' +
    body +
    '<hr style="border:none;border-top:1px solid #DDDACC;margin:28px 0 16px;" />' +
    '<p style="margin:0;font-size:12px;color:#7c8478;">Ground Wind Holding, S.L. · Palma de Mallorca · groundwind.eu</p>' +
    '</div>';
}

function leadHtml(fields) {
  const rows = fields.map(function (f) {
    return '<tr>' +
      '<td style="padding:6px 14px 6px 0;color:#7c8478;font-size:13px;white-space:nowrap;vertical-align:top;">' + esc(f[0]) + '</td>' +
      '<td style="padding:6px 0;color:#171D15;font-size:14px;">' + esc(f[1] || '—') + '</td>' +
      '</tr>';
  }).join('');
  return '<div style="font-family:Arial,Helvetica,sans-serif;color:#171D15;">' +
    '<h2 style="font-size:18px;margin:0 0 14px;">Nueva solicitud desde la web</h2>' +
    '<table style="border-collapse:collapse;">' + rows + '</table>' +
    '</div>';
}

exports.handler = async function (event) {
  try {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      console.log('SMTP no configurado (faltan SMTP_HOST/SMTP_USER/SMTP_PASS); se omite el envío.');
      return { statusCode: 200, body: 'skipped' };
    }

    const outer = JSON.parse(event.body || '{}');
    const payload = outer.payload || {};
    const data = payload.data || {};
    const formName = payload.form_name || payload.formName || '';
    const lang = formName.endsWith('-en') ? 'en' : 'es';

    const name = (data.nombre || data.name || '').trim();
    const company = (data.empresa || data.company || '').trim();
    const email = String(data.email || '').trim();
    const sector = (data.sector || '').trim();
    const project = (data.proyecto || data.project || '').trim();

    const port = Number(process.env.SMTP_PORT || 587);
    const from = process.env.MAIL_FROM || 'Ground Wind Holding <info@groundwind.eu>';
    const internalTo = process.env.MAIL_TO || 'info@groundwind.eu';
    const replyTo = process.env.MAIL_REPLY_TO || 'info@groundwind.eu';

    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465,
      auth: { user: user, pass: pass }
    });

    // 1) Lead interno para Ground Wind.
    const leadFields = [
      ['Nombre', name],
      ['Empresa', company],
      ['Email', email],
      ['Sector', sector],
      ['Proyecto', project],
      ['Formulario', formName || ('groundwind-' + lang)]
    ];
    const internalP = transporter.sendMail({
      from: from,
      to: internalTo,
      replyTo: email || replyTo,
      subject: 'Nueva solicitud web — ' + (name || 'sin nombre') + (company ? ' (' + company + ')' : ''),
      html: leadHtml(leadFields),
      text: leadFields.map(function (f) { return f[0] + ': ' + (f[1] || '—'); }).join('\n')
    }).catch(function (e) { console.log('Error enviando lead interno:', e && e.message); });

    // 2) Autorespuesta al remitente.
    let autoP = Promise.resolve();
    if (email) {
      const copy = COPY[lang];
      autoP = transporter.sendMail({
        from: from,
        to: email,
        replyTo: replyTo,
        subject: copy.subject,
        html: autoReplyHtml(copy.lines),
        text: copy.lines.join('\n\n')
      }).catch(function (e) { console.log('Error enviando autorespuesta:', e && e.message); });
    }

    await Promise.all([internalP, autoP]);
    console.log('Envíos procesados para', email || '(sin email)', '· idioma', lang);
    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.log('submission-created error:', err && err.message);
    return { statusCode: 200, body: 'error' };
  }
};
