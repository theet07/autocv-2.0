/**
 * server/emailSender.js
 * Motor de envio SMTP 2.0 via Nodemailer.
 * Melhorias sobre a v1.0:
 *  - E-mails Multipart (Texto Puro + HTML limpo com cara de e-mail pessoal real, sem layout de marketing/spam)
 *  - Assinatura clicável opcional (WhatsApp, LinkedIn, GitHub)
 *  - TLS 1.2+ moderno (corrige falha SSLv3 do Node 24 no Outlook/Office365)
 *  - Suporte a múltiplos anexos (Currículo PDF + Carta de Apresentação opcional)
 */

import nodemailer from 'nodemailer';
import fs from 'fs';

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function plainBodyToPersonalHtml(plainText = '') {
  const paragraphs = String(plainText || '')
    .split(/\r?\n\r?\n/)
    .map((block) => {
      const escaped = escapeHtml(block).replace(/\r?\n/g, '<br/>');
      // Converte URLs visíveis em links clicáveis limpos
      const linked = escaped.replace(
        /(https?:\/\/[^\s<]+)/gi,
        '<a href="$1" style="color:#1D4ED8;text-decoration:underline;">$1</a>'
      );
      return `<p style="margin:0 0 12px 0;line-height:1.58;">${linked}</p>`;
    })
    .join('');

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;color:#1F2937;max-width:660px;">${paragraphs}</div>`;
}

export function createTransporter(emailSettings = {}) {
  const { provider, user, pass, smtpHost, smtpPort, secure } = emailSettings;

  if (provider === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: String(pass || '').replace(/\s+/g, '') },
    });
  }

  if (provider === 'outlook') {
    return nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
      tls: { minVersion: 'TLSv1.2' },
    });
  }

  return nodemailer.createTransport({
    host: smtpHost || 'localhost',
    port: parseInt(smtpPort, 10) || 587,
    secure: secure === true || secure === 'true' || Number(smtpPort) === 465,
    auth: { user, pass },
    tls: { minVersion: 'TLSv1.2' },
  });
}

export async function testSmtpConnection(emailSettings = {}) {
  if (!emailSettings?.user || !emailSettings?.pass) {
    throw new Error('Informe o e-mail remetente e a Senha de Aplicativo antes de testar.');
  }
  const transporter = createTransporter(emailSettings);
  await transporter.verify();
  return {
    success: true,
    message: `Conexão SMTP autenticada com sucesso para ${emailSettings.user}!`,
  };
}

export async function sendEmail({
  emailSettings = {},
  to,
  subject,
  body,
  htmlFormat = true,
  attachments = [],
  attachmentPath,
  attachmentName = 'Curriculo.pdf',
  isSimulation = false,
}) {
  const resolvedAttachments = [...attachments];
  if (attachmentPath && fs.existsSync(attachmentPath)) {
    resolvedAttachments.push({
      filename: attachmentName,
      path: attachmentPath,
      contentType: 'application/pdf',
    });
  }

  if (isSimulation) {
    return {
      success: true,
      simulated: true,
      to,
      subject,
      attachmentsCount: resolvedAttachments.length,
      message: `[SIMULAÇÃO SEGURA] Candidatura validada para ${to} (${resolvedAttachments.length} PDF anexo).`,
    };
  }

  if (!emailSettings?.user || !emailSettings?.pass) {
    throw new Error('Credenciais SMTP não configuradas. Acesse a aba SMTP & Backup.');
  }

  const transporter = createTransporter(emailSettings);
  const mailOptions = {
    from: `"${emailSettings.fromName || 'Candidato'}" <${emailSettings.user}>`,
    to,
    subject,
    text: body,
    ...(htmlFormat ? { html: plainBodyToPersonalHtml(body) } : {}),
    ...(resolvedAttachments.length > 0 ? { attachments: resolvedAttachments } : {}),
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    simulated: false,
    messageId: info.messageId,
    to,
    subject,
    attachmentsCount: resolvedAttachments.length,
  };
}
