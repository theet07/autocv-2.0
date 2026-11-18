/**
 * server/jobParser.js
 * Extrator inteligente de anúncios de vagas (LinkedIn, Gupy, Indeed, grupos de WhatsApp, e-mails).
 * Extrai empresa, cargo, e-mail de RH, WhatsApp, cidade/modalidade, faixa salarial e pilar recomendado.
 */

import { detectJobMetadata } from './atsDictionary.js';
import { analyzeJobDescription } from './tailorEngine.js';

const ROLE_PATTERNS = [
  /(?:vaga(?:\s+para|\s+de)?|cargo|oportunidade(?:\s+para|\s+de)?|posição|posicao|contratamos|estamos\s+contratando)\s*[:\-–]\s*([^\n\r|•]{4,70})/i,
  /^((?:estágio|estagio|estagiário|técnico|tecnico|analista|assistente|auxiliar|jovem aprendiz|suporte|desenvolvedor|operador)[^\n\r|•]{3,65})$/im,
];

const COMPANY_PATTERNS = [
  /(?:empresa|organização|cliente|contratante)\s*[:\-–]\s*([^\n\r|•]{2,60})/i,
  /(?:na\s+empresa|no\s+grupo|time\s+da)\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ0-9\s&.\-]{2,45})/,
];

const CITY_PATTERNS = [
  /(?:local(?:ização|idade)?|cidade|região|atuação|bairro)\s*[:\-–]\s*([^\n\r|•]{3,55})/i,
  /\b((?:Barueri|Alphaville|Osasco|Santana de Parnaíba|Carapicuíba|Jandira|Itapevi|Cotia|São Paulo|SP|Campinas|Guarulhos)(?:\s*[-/–]\s*(?:SP|Brasil|Presencial|Híbrido|Remoto))?)\b/i,
];

const SALARY_PATTERNS = [
  /(?:salário|salario|remuneração|bolsa(?:\s+auxílio)?)\s*[:\-–]?\s*(R\$\s?[\d.,]+(?:\s*(?:a|até|-)\s*R\$\s?[\d.,]+)?)/i,
  /(R\$\s?\d{1,2}\.?\d{3}(?:,\d{2})?)/i,
];

export function parseRawJobAd(rawText = '') {
  const clean = String(rawText || '').trim();
  if (!clean) {
    return {
      company: '',
      role: '',
      email: '',
      phone: '',
      city: '',
      salary: '',
      modality: '',
      seniority: '',
      category: 'suporte',
      cleanDescription: '',
    };
  }

  // 1. E-mail de recrutamento
  const emailMatch = clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0].toLowerCase() : '';

  // 2. Telefone / WhatsApp brasileiro
  const phoneMatch = clean.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})/);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';

  // 3. Cargo
  let role = '';
  for (const pat of ROLE_PATTERNS) {
    const m = clean.match(pat);
    if (m && m[1]) {
      role = m[1].trim().replace(/^[-:•*\s]+|[-:•*\s]+$/g, '');
      break;
    }
  }
  if (!role) {
    const firstLine = clean.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length >= 5 && l.length <= 75);
    if (firstLine && !firstLine.includes('@')) {
      role = firstLine.replace(/^[🔥🚀📢💼✨*\s]+/, '').trim();
    }
  }

  // 4. Empresa
  let company = '';
  for (const pat of COMPANY_PATTERNS) {
    const m = clean.match(pat);
    if (m && m[1]) {
      company = m[1].trim().replace(/[.,;]+$/, '');
      break;
    }
  }
  if (!company && email) {
    const domain = email.split('@')[1]?.split('.')[0] || '';
    const genericDomains = ['gmail', 'outlook', 'hotmail', 'yahoo', 'uol', 'bol', 'icloud', 'live'];
    if (domain && !genericDomains.includes(domain.toLowerCase())) {
      company = domain.charAt(0).toUpperCase() + domain.slice(1);
    }
  }

  // 5. Cidade & Modalidade
  const { modality, seniority } = detectJobMetadata(clean, role);
  let city = '';
  for (const pat of CITY_PATTERNS) {
    const m = clean.match(pat);
    if (m && m[1]) {
      city = m[1].trim();
      break;
    }
  }
  if (modality && city && !city.toLowerCase().includes(modality.toLowerCase())) {
    city = `${city} (${modality})`;
  } else if (modality && !city) {
    city = modality;
  }

  // 6. Salário / Bolsa
  let salary = '';
  for (const pat of SALARY_PATTERNS) {
    const m = clean.match(pat);
    if (m && m[1]) {
      salary = m[1].trim();
      break;
    }
  }

  // 7. Categoria ATS dominante
  const analysis = analyzeJobDescription(clean, role);

  return {
    company: company || 'Empresa Recrutadora',
    role: role || 'Suporte Técnico de TI',
    email,
    phone,
    city,
    salary,
    modality,
    seniority,
    category: analysis.topCategory || 'suporte',
    detectedKeywords: analysis.detectedKeywords,
    cleanDescription: clean,
  };
}
