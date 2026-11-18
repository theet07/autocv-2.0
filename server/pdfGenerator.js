/**
 * server/pdfGenerator.js
 * Motor Vetorial Multi-Template PDF 2.0 (PDFKit).
 * Suporta:
 *  - 3 Templates ATS-Safe: 'executive' (Clássico Executivo), 'modern' (Tech & Engenharia), 'compact' (Alta Densidade 1 Página)
 *  - 4 Paletas Editoriais: 'navy', 'graphite', 'emerald', 'cobalt'
 *  - Hyperlinks clicáveis reais no PDF (mailto:, WhatsApp wa.me, LinkedIn, GitHub, Website)
 *  - Experiências em bullets nítidos + Seção opcional de Projetos Relevantes
 *  - Ajuste inteligente One-Page Fit para evitar quebra órfã de 2-3 linhas na página 2
 *  - Gerador de Carta de Apresentação em PDF combinando com a identidade visual do currículo
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';

export const PDF_PALETTES = {
  navy: {
    primary: '#1A365D',
    accent: '#2B6CB0',
    text: '#1E293B',
    muted: '#64748B',
    rule: '#CBD5E1',
    softBg: '#F1F5F9',
  },
  graphite: {
    primary: '#18181B',
    accent: '#3F3F46',
    text: '#27272A',
    muted: '#71717A',
    rule: '#D4D4D8',
    softBg: '#F4F4F5',
  },
  emerald: {
    primary: '#064E3B',
    accent: '#047857',
    text: '#1E293B',
    muted: '#64748B',
    rule: '#CBD5E1',
    softBg: '#ECFDF5',
  },
  cobalt: {
    primary: '#1E3A8A',
    accent: '#1D4ED8',
    text: '#1F2937',
    muted: '#6B7280',
    rule: '#CBD5E1',
    softBg: '#EFF6FF',
  },
};

function cleanDisplayUrl(url = '') {
  return String(url)
    .trim()
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/\/+$/, '');
}

function ensureHref(url = '') {
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function phoneToWhatsAppHref(phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

function splitBullets(description = '') {
  return String(description || '')
    .split(/\r?\n/)
    .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean);
}

/**
 * Calcula escala tipográfica suave quando One-Page Fit está ativo e há muito conteúdo.
 */
function computeMetrics(profileData, style) {
  const template = style.template || 'executive';
  const density = style.density || 'comfortable';
  const onePageFit = style.onePageFit !== false;

  const skills =
    profileData.activeSkills ||
    profileData.pillars?.[profileData.selectedPillar || 'suporte']?.skills ||
    [];
  const expChars = (profileData.experiences || []).reduce(
    (acc, e) => acc + (e.description || '').length + 80,
    0
  );
  const projChars =
    style.showProjects !== false
      ? (profileData.projects || []).reduce((acc, p) => acc + (p.description || '').length + 60, 0)
      : 0;
  const totalWeight =
    (profileData.summary || '').length +
    skills.length * 42 +
    expChars +
    projChars +
    (profileData.certifications || []).length * 40;

  let scale = 1.0;
  if (template === 'compact' || density === 'compact') {
    scale = 0.91;
  } else if (density === 'spacious') {
    scale = 1.04;
  }

  if (onePageFit && totalWeight > 2150) {
    scale = Math.min(scale, 0.88);
  } else if (onePageFit && totalWeight > 1800) {
    scale = Math.min(scale, 0.93);
  }

  const marginV = Math.round(36 * scale);
  const marginH = template === 'compact' ? 40 : 44;

  return {
    template,
    scale,
    marginV,
    marginH,
    nameSize: +(21 * scale).toFixed(1),
    titleSize: +(10.8 * scale).toFixed(1),
    sectionSize: +(10.2 * scale).toFixed(1),
    bodySize: +(9.1 * scale).toFixed(1),
    smallSize: +(8.4 * scale).toFixed(1),
    sectionGap: +(9 * scale).toFixed(1),
    lineGap: +(1.6 * scale).toFixed(1),
  };
}

export async function generateResumePDF(profileData, outputPath, styleOverrides = {}) {
  return new Promise((resolve, reject) => {
    try {
      const style = { ...(profileData.resumeStyle || {}), ...styleOverrides };
      const palette = PDF_PALETTES[style.accent] || PDF_PALETTES.navy;
      const m = computeMetrics(profileData, style);
      const personal = profileData.personal || {};

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: m.marginV, bottom: m.marginV, left: m.marginH, right: m.marginH },
        info: {
          Title: `Currículo - ${personal.name || 'Candidato'}`,
          Author: personal.name || 'AutoCV 2.0',
          Subject: personal.title || 'Currículo Profissional',
          Keywords: (profileData.activeSkills || []).join(', '),
          Creator: 'AutoCV 2.0 ATS Studio',
        },
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      const startX = doc.page.margins.left;
      const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      // --- CABEÇALHO POR TEMPLATE ---
      if (m.template === 'modern') {
        const headerStartY = doc.y;
        const hx = startX + 13;
        doc
          .fillColor(palette.primary)
          .font('Helvetica-Bold')
          .fontSize(m.nameSize)
          .text((personal.name || 'SEU NOME').toUpperCase(), hx, headerStartY, {
            width: contentWidth - 13,
          });

        doc.moveDown(0.15);
        doc
          .fillColor(palette.accent)
          .font('Helvetica-Bold')
          .fontSize(m.titleSize)
          .text(personal.title || '', hx, doc.y, { width: contentWidth - 13 });

        doc.moveDown(0.25);
        renderContactBar(doc, personal, hx, contentWidth - 13, m.smallSize, palette);
        const headerEndY = doc.y;

        doc
          .save()
          .rect(startX, headerStartY + 1, 3.5, Math.max(24, headerEndY - headerStartY - 4))
          .fill(palette.accent)
          .restore();
      } else {
        // 'executive' e 'compact'
        const align = m.template === 'compact' ? 'left' : 'left';
        doc
          .fillColor(palette.primary)
          .font('Helvetica-Bold')
          .fontSize(m.nameSize)
          .text((personal.name || 'SEU NOME').toUpperCase(), startX, doc.y, {
            width: contentWidth,
            align,
          });

        doc.moveDown(0.15);
        doc
          .fillColor(palette.muted)
          .font('Helvetica-Bold')
          .fontSize(m.titleSize)
          .text(personal.title || '', startX, doc.y, { width: contentWidth, align });

        doc.moveDown(0.25);
        renderContactBar(doc, personal, startX, contentWidth, m.smallSize, palette);
      }

      doc.y += m.sectionGap * 0.7;
      drawRule(doc, palette.rule, m.template === 'modern' ? 1.1 : 0.8);
      doc.y += m.sectionGap * 0.75;

      // --- RESUMO PROFISSIONAL ---
      if (profileData.summary) {
        drawSectionHeading(doc, 'RESUMO PROFISSIONAL', palette, m);
        doc
          .fillColor(palette.text)
          .font('Helvetica')
          .fontSize(m.bodySize)
          .text(profileData.summary, startX, doc.y, {
            width: contentWidth,
            align: 'justify',
            lineGap: m.lineGap,
          });
        doc.y += m.sectionGap * 0.8;
        drawRule(doc, palette.rule, 0.6);
        doc.y += m.sectionGap * 0.75;
      }

      // --- COMPETÊNCIAS & HABILIDADES TÉCNICAS ---
      const skills =
        profileData.activeSkills ||
        profileData.pillars?.[profileData.selectedPillar || 'suporte']?.skills ||
        [];

      if (skills.length > 0) {
        drawSectionHeading(doc, 'COMPETÊNCIAS & HABILIDADES TÉCNICAS', palette, m);

        const gapX = 16;
        const colW = (contentWidth - gapX) / 2;
        const mid = Math.ceil(skills.length / 2);
        const leftCol = skills.slice(0, mid);
        const rightCol = skills.slice(mid);

        const gridStartY = doc.y;
        doc.font('Helvetica').fontSize(m.smallSize + 0.3).fillColor(palette.text);

        let leftY = gridStartY;
        for (const sk of leftCol) {
          doc.text(`•  ${sk}`, startX, leftY, { width: colW, lineGap: 1 });
          leftY = doc.y + 2 * m.scale;
        }

        let rightY = gridStartY;
        for (const sk of rightCol) {
          doc.text(`•  ${sk}`, startX + colW + gapX, rightY, { width: colW, lineGap: 1 });
          rightY = doc.y + 2 * m.scale;
        }

        doc.y = Math.max(leftY, rightY) + m.sectionGap * 0.5;
        drawRule(doc, palette.rule, 0.6);
        doc.y += m.sectionGap * 0.75;
      }

      // --- EXPERIÊNCIA PROFISSIONAL ---
      if (Array.isArray(profileData.experiences) && profileData.experiences.length > 0) {
        drawSectionHeading(doc, 'EXPERIÊNCIA PROFISSIONAL', palette, m);

        const useBullets = style.bulletExperiences !== false;

        for (let i = 0; i < profileData.experiences.length; i++) {
          const exp = profileData.experiences[i];
          const rowY = doc.y;

          doc
            .fillColor(palette.text)
            .font('Helvetica-Bold')
            .fontSize(m.bodySize + 0.6)
            .text(exp.role || '', startX, rowY, { width: contentWidth * 0.68 });

          const afterRoleY = doc.y;

          if (exp.period) {
            doc
              .fillColor(palette.muted)
              .font('Helvetica-Bold')
              .fontSize(m.smallSize)
              .text(exp.period, startX, rowY + 1, { width: contentWidth, align: 'right' });
          }

          doc.y = Math.max(afterRoleY, doc.y);
          doc
            .fillColor(palette.accent)
            .font('Helvetica-Oblique')
            .fontSize(m.smallSize + 0.4)
            .text(exp.company || '', startX, doc.y + 1, { width: contentWidth });

          doc.y += 3 * m.scale;

          const lines = splitBullets(exp.description);
          doc.fillColor(palette.text).font('Helvetica').fontSize(m.smallSize + 0.35);

          if (useBullets && lines.length > 1) {
            for (const bullet of lines) {
              doc.text(`•  ${bullet}`, startX + 2, doc.y, {
                width: contentWidth - 2,
                align: 'justify',
                lineGap: m.lineGap * 0.85,
              });
              doc.y += 1.8 * m.scale;
            }
          } else {
            doc.text(lines.join(' '), startX, doc.y, {
              width: contentWidth,
              align: 'justify',
              lineGap: m.lineGap,
            });
          }

          if (i < profileData.experiences.length - 1) {
            doc.y += m.sectionGap * 0.65;
          }
        }

        doc.y += m.sectionGap * 0.7;
        drawRule(doc, palette.rule, 0.6);
        doc.y += m.sectionGap * 0.75;
      }

      // --- PROJETOS TÉCNICOS EM DESTAQUE (OPCIONAL) ---
      if (
        style.showProjects !== false &&
        Array.isArray(profileData.projects) &&
        profileData.projects.length > 0
      ) {
        drawSectionHeading(doc, 'PROJETOS & PORTFÓLIO TÉCNICO', palette, m);

        for (let i = 0; i < profileData.projects.length; i++) {
          const proj = profileData.projects[i];
          const pY = doc.y;
          doc
            .fillColor(palette.text)
            .font('Helvetica-Bold')
            .fontSize(m.bodySize)
            .text(proj.name || '', startX, pY, { width: contentWidth * 0.68 });

          const afterNameY = doc.y;
          if (proj.tech) {
            doc
              .fillColor(palette.accent)
              .font('Helvetica-Bold')
              .fontSize(m.smallSize - 0.2)
              .text(proj.tech, startX, pY + 1, { width: contentWidth, align: 'right' });
          }
          doc.y = Math.max(afterNameY, doc.y) + 2;

          if (proj.description) {
            doc
              .fillColor(palette.text)
              .font('Helvetica')
              .fontSize(m.smallSize + 0.3)
              .text(proj.description, startX, doc.y, {
                width: contentWidth,
                align: 'justify',
                lineGap: m.lineGap * 0.85,
              });
          }
          if (i < profileData.projects.length - 1) {
            doc.y += m.sectionGap * 0.5;
          }
        }

        doc.y += m.sectionGap * 0.7;
        drawRule(doc, palette.rule, 0.6);
        doc.y += m.sectionGap * 0.75;
      }

      // --- FORMAÇÃO ACADÊMICA ---
      if (Array.isArray(profileData.education) && profileData.education.length > 0) {
        drawSectionHeading(doc, 'FORMAÇÃO ACADÊMICA', palette, m);

        for (const edu of profileData.education) {
          const eduY = doc.y;
          doc
            .fillColor(palette.text)
            .font('Helvetica-Bold')
            .fontSize(m.bodySize)
            .text(edu.course || '', startX, eduY, { width: contentWidth * 0.72 });

          const afterCourseY = doc.y;
          if (edu.period) {
            doc
              .fillColor(palette.muted)
              .font('Helvetica')
              .fontSize(m.smallSize)
              .text(edu.period, startX, eduY + 1, { width: contentWidth, align: 'right' });
          }
          doc.y = Math.max(afterCourseY, doc.y) + 1;
          doc
            .fillColor(palette.muted)
            .font('Helvetica')
            .fontSize(m.smallSize + 0.3)
            .text(edu.institution || '', startX, doc.y, { width: contentWidth });
          doc.y += m.sectionGap * 0.45;
        }
      }

      // --- CERTIFICAÇÕES & IDIOMAS ---
      const certs = profileData.certifications || [];
      const langs = profileData.languages || [];
      if (certs.length > 0 || langs.length > 0) {
        doc.y += m.sectionGap * 0.25;
        drawRule(doc, palette.rule, 0.6);
        doc.y += m.sectionGap * 0.7;

        drawSectionHeading(doc, 'QUALIFICAÇÕES COMPLEMENTARES & IDIOMAS', palette, m);

        doc.fillColor(palette.text).font('Helvetica').fontSize(m.smallSize + 0.25);

        for (const c of certs) {
          doc.text(`•  ${c}`, startX, doc.y, { width: contentWidth, lineGap: 1.2 });
        }
        if (langs.length > 0) {
          doc.y += 2;
          doc
            .font('Helvetica-Bold')
            .text('Idiomas: ', startX, doc.y, { continued: true })
            .font('Helvetica')
            .text(langs.join('  |  '));
        }
      }

      doc.end();
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Gera uma Carta de Apresentação formal em A4 PDF com o mesmo cabeçalho visual do currículo.
 */
export async function generateCoverLetterPDF({
  profileData,
  company = 'Empresa Contratante',
  role = 'Oportunidade em Aberto',
  bodyText = '',
  outputPath,
  styleOverrides = {},
}) {
  return new Promise((resolve, reject) => {
    try {
      const style = { ...(profileData.resumeStyle || {}), ...styleOverrides };
      const palette = PDF_PALETTES[style.accent] || PDF_PALETTES.navy;
      const personal = profileData.personal || {};

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 52, bottom: 52, left: 54, right: 54 },
        info: {
          Title: `Carta de Apresentação - ${personal.name || ''} - ${company}`,
          Author: personal.name || 'AutoCV 2.0',
        },
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      const startX = doc.page.margins.left;
      const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      doc
        .fillColor(palette.primary)
        .font('Helvetica-Bold')
        .fontSize(20)
        .text((personal.name || 'CANDIDATO').toUpperCase(), startX, doc.y);

      doc.moveDown(0.2);
      doc
        .fillColor(palette.accent)
        .font('Helvetica-Bold')
        .fontSize(10.5)
        .text(personal.title || '', startX, doc.y);

      doc.moveDown(0.3);
      renderContactBar(doc, personal, startX, contentWidth, 9, palette);

      doc.moveDown(0.8);
      drawRule(doc, palette.rule, 1);
      doc.moveDown(1.2);

      const todayStr = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      doc
        .fillColor(palette.muted)
        .font('Helvetica')
        .fontSize(9.5)
        .text(`${personal.city || 'São Paulo, Brasil'} — ${todayStr}`, startX, doc.y);

      doc.moveDown(1.2);
      doc
        .fillColor(palette.primary)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(`À Equipe de Recrutamento e Seleção — ${company}`, startX, doc.y);
      doc
        .fillColor(palette.muted)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(`Ref.: Candidatura à vaga de ${role}`, startX, doc.y + 2);

      doc.moveDown(1.3);
      doc
        .fillColor(palette.text)
        .font('Helvetica')
        .fontSize(10.5)
        .text(bodyText, startX, doc.y, {
          width: contentWidth,
          align: 'justify',
          lineGap: 4,
        });

      doc.end();
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

function renderContactBar(doc, personal, x, maxWidth, fontSize, palette) {
  const segments = [];
  if (personal.phone) {
    segments.push({ text: personal.phone, href: phoneToWhatsAppHref(personal.phone) });
  }
  if (personal.email) {
    segments.push({ text: personal.email, href: `mailto:${personal.email}` });
  }
  if (personal.city) {
    segments.push({ text: personal.city, href: '' });
  }
  if (personal.linkedin) {
    segments.push({
      text: cleanDisplayUrl(personal.linkedin),
      href: ensureHref(personal.linkedin),
    });
  }
  if (personal.github) {
    segments.push({
      text: cleanDisplayUrl(personal.github),
      href: ensureHref(personal.github),
    });
  }
  if (personal.website) {
    segments.push({
      text: cleanDisplayUrl(personal.website),
      href: ensureHref(personal.website),
    });
  }

  doc.font('Helvetica').fontSize(fontSize);

  let cursorX = x;
  let cursorY = doc.y;
  const lineHeight = fontSize + 3;

  const sep = '   •   ';
  const sepW = doc.widthOfString(sep);

  segments.forEach((seg) => {
    const segW = doc.widthOfString(seg.text);

    if (cursorX > x) {
      if (cursorX + sepW + segW <= x + maxWidth) {
        doc.fillColor(palette.muted).text(sep, cursorX, cursorY, { lineBreak: false });
        cursorX += sepW;
      } else {
        cursorX = x;
        cursorY += lineHeight;
      }
    }

    doc.fillColor(seg.href ? palette.primary : palette.text).text(seg.text, cursorX, cursorY, {
      lineBreak: false,
    });
    if (seg.href && segW > 0) {
      doc.link(cursorX, cursorY, segW, fontSize + 2, seg.href);
    }
    cursorX += segW;
  });

  doc.x = x;
  doc.y = cursorY + lineHeight;
}

function drawSectionHeading(doc, title, palette, m) {
  const startX = doc.page.margins.left;
  if (m.template === 'modern') {
    doc
      .fillColor(palette.primary)
      .font('Helvetica-Bold')
      .fontSize(m.sectionSize)
      .text(title, startX, doc.y, { characterSpacing: 0.6 });
    doc.y += 3 * m.scale;
  } else {
    doc
      .fillColor(palette.primary)
      .font('Helvetica-Bold')
      .fontSize(m.sectionSize)
      .text(title, startX, doc.y, { characterSpacing: 0.5 });
    doc.y += 3 * m.scale;
  }
}

function drawRule(doc, color, width = 0.8) {
  const y = doc.y;
  doc
    .save()
    .strokeColor(color)
    .lineWidth(width)
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .stroke()
    .restore();
  doc.y = y + 2;
}
