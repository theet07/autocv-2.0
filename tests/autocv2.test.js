import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'autocv2-test-'));
const tmpData = path.join(tmpRoot, 'data');
const tmpOutput = path.join(tmpRoot, 'output');
fs.mkdirSync(tmpData, { recursive: true });
fs.mkdirSync(tmpOutput, { recursive: true });

process.env.NODE_ENV = 'test';
process.env.AUTOCV_DATA_DIR = tmpData;
process.env.AUTOCV_OUTPUT_DIR = tmpOutput;

const realProfilePath = path.resolve('data/profile.json');
const sampleProfile = JSON.parse(fs.readFileSync(realProfilePath, 'utf-8'));
fs.writeFileSync(path.join(tmpData, 'profile.json'), JSON.stringify(sampleProfile, null, 2));
fs.writeFileSync(path.join(tmpData, 'targets.json'), '[]');
fs.writeFileSync(path.join(tmpData, 'history.json'), '[]');
fs.writeFileSync(
  path.join(tmpData, 'settings.json'),
  JSON.stringify({
    email: { provider: 'gmail', user: 'teste@exemplo.com', pass: 'segredo1234567890' },
    dispatch: {
      simulationMode: true,
      subjectTemplate: 'Vaga {role} - {name}',
      messageTemplate: 'Olá {company},\n\n{tailored_pitch}\n\n{name} - {github}',
    },
  })
);

const { hasWholeTerm } = await import('../server/atsDictionary.js');
const { parseRawJobAd } = await import('../server/jobParser.js');
const { analyzeJobDescription, tailorProfile } = await import('../server/tailorEngine.js');
const { generateResumePDF, generateCoverLetterPDF } = await import('../server/pdfGenerator.js');
const { plainBodyToPersonalHtml, sendEmail } = await import('../server/emailSender.js');
const { computeLiveAtsRadar } = await import('../src/constants/pillars.js');
const { app } = await import('../server/server.js');

test('hasWholeTerm evita falsos positivos de substrings curtas ("ad" em "idade", "ip" em "equipe")', () => {
  assert.equal(hasWholeTerm('Atuação com responsabilidade e agilidade na equipe', 'ad'), false);
  assert.equal(hasWholeTerm('Trabalho em equipe multidisciplinar', 'ip'), false);
  assert.equal(hasWholeTerm('Experiência com AD, GPO e Windows 11', 'ad'), true);
  assert.equal(hasWholeTerm('Configuração de TCP/IP e DNS', 'tcp/ip'), true);
});

test('parseRawJobAd lida com entrada vazia e extrai campos completos de anúncios reais', () => {
  const empty = parseRawJobAd('   ');
  assert.equal(empty.email, '');
  assert.equal(empty.category, 'suporte');

  const raw = `
    Vaga: Analista de Suporte Técnico N1
    Empresa: AlphaCloud Sistemas
    Local: Barueri - SP (Modelo Híbrido)
    Salário: R$ 2.800,00
    Requisitos: Atendimento a chamados via GLPI, Active Directory, Office 365, VPN e Windows 11.
    Interessados enviar currículo para talentos@alphacloud.com.br ou WhatsApp (11) 98877-6655.
  `;
  const parsed = parseRawJobAd(raw);
  assert.equal(parsed.email, 'talentos@alphacloud.com.br');
  assert.match(parsed.phone, /98877-6655/);
  assert.match(parsed.company, /AlphaCloud/i);
  assert.match(parsed.role, /Analista de Suporte/i);
  assert.equal(parsed.modality, 'Híbrido');
  assert.match(parsed.salary, /R\$\s*2\.800/);
  assert.equal(parsed.category, 'suporte');
  assert.ok(parsed.detectedKeywords.includes('Active Directory'));
});

test('tailorProfile adapta resumo e gera 3 tons + WhatsApp + Guia de Entrevista', () => {
  const target = {
    company: 'NetCore Telecom',
    role: 'Assistente de Redes e Conectividade',
    category: 'redes',
    customJobDescription:
      'Atuar com VPN, proxies, roteadores, switches, cabeamento Cat6, TCP/IP, DNS e diagnóstico de links.',
  };

  const result = tailorProfile(sampleProfile, target, { pitchTone: 'tecnico' });
  assert.equal(result.tailoredProfile.dominantPillar, 'redes');
  assert.match(result.tailoredProfile.summary, /informática|técnica|redes/i);
  assert.ok(result.pitches.direto.length > 40);
  assert.ok(result.pitches.tecnico.length > 40);
  assert.ok(result.pitches.proativo.length > 40);
  assert.equal(result.tailoredPitch, result.pitches.tecnico);
  assert.match(result.whatsappMessage, /NetCore Telecom/);
  assert.ok(result.interviewPrep.length >= 3);
  assert.ok(result.afterScore >= 60 && result.afterScore <= 100);
});

test('computeLiveAtsRadar (frontend) mantém paridade sem falsos positivos e calcula score 0-100', () => {
  const radar = computeLiveAtsRadar(
    'Responsabilidade em equipe com Active Directory, VPN, SQL Server e React.',
    'Analista de Sistemas Júnior',
    sampleProfile
  );
  assert.ok(radar.matchedInProfile.includes('VPN & Proxy'));
  assert.ok(radar.matchedInProfile.includes('SQL & Banco de Dados'));
  assert.ok(radar.atsScore.total >= 65 && radar.atsScore.total <= 100);
});

test('generateResumePDF gera PDFs válidos nos 3 templates e 4 paletas + acentuação especial + Carta PDF', async () => {
  const palettes = ['navy', 'graphite', 'emerald', 'cobalt'];
  for (const [idx, template] of ['executive', 'modern', 'compact'].entries()) {
    const out = path.join(tmpOutput, `cv_${template}.pdf`);
    await generateResumePDF(sampleProfile, out, {
      template,
      accent: palettes[idx],
      onePageFit: true,
    });
    const buf = fs.readFileSync(out);
    assert.ok(buf.length > 2200, `PDF ${template} deve ter tamanho válido`);
    assert.equal(buf.subarray(0, 5).toString('ascii'), '%PDF-');
  }

  const coverOut = path.join(tmpOutput, 'carta_teste.pdf');
  await generateCoverLetterPDF({
    profileData: sampleProfile,
    company: 'São Paulo & Cia Soluções S/A',
    role: 'Técnico de Suporte Júnior',
    bodyText: 'Prezada equipe,\n\nApresento minha candidatura com entusiasmo.',
    outputPath: coverOut,
  });
  const coverBuf = fs.readFileSync(coverOut);
  assert.ok(coverBuf.length > 1500);
  assert.equal(coverBuf.subarray(0, 5).toString('ascii'), '%PDF-');
});

test('plainBodyToPersonalHtml escapa tags perigosas e linkifica URLs com segurança + simulação de envio', async () => {
  const html = plainBodyToPersonalHtml(
    'Olá <script>alert(1)</script>\n\nVeja https://github.com/exemplo'
  );
  assert.equal(html.includes('<script>'), false);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('href="https://github.com/exemplo"'));

  const sim = await sendEmail({
    to: 'rh@empresa.com',
    subject: 'Teste',
    body: 'Corpo',
    isSimulation: true,
  });
  assert.equal(sim.success, true);
  assert.equal(sim.simulated, true);
});

test('API REST completa: duplicidade, geração PDF com acentos, backup seguro (redige senha) e lote simulado', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  try {
    const health = await fetch(`${base}/api/health`).then((r) => r.json());
    assert.equal(health.version, '2.0.0');

    const r1 = await fetch(`${base}/api/targets/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: 'São Paulo Soluções TI',
        email: 'rh@sptec.com.br',
        role: 'Suporte N1',
      }),
    }).then((r) => r.json());
    assert.equal(r1.success, true);
    assert.equal(r1.duplicateWarning, null);

    // Duplicidade detectada
    const r2 = await fetch(`${base}/api/targets/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: 'SP Filial',
        email: 'RH@sptec.com.br',
        role: 'Suporte N2',
      }),
    }).then((r) => r.json());
    assert.match(r2.duplicateWarning, /já estava cadastrado/i);

    // Geração de PDF via HTTP com nome acentuado
    const pdfRes = await fetch(`${base}/api/pdf/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: r1.target,
        styleOverrides: { template: 'modern', accent: 'cobalt' },
      }),
    }).then((r) => r.json());
    assert.equal(pdfRes.success, true);
    assert.match(pdfRes.fileName, /Curriculo_.*Sao_Paulo_Solucoes_TI\.pdf/);

    // Backup export DEVE omitir a senha SMTP
    const backup = await fetch(`${base}/api/backup/export`).then((r) => r.json());
    assert.equal(backup.version, '2.0.0');
    assert.equal(backup.settings.email.pass, '');

    // Disparo em lote simulado + aguarda conclusão rápida
    const batchRes = await fetch(`${base}/api/dispatch/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetIds: [r1.target.id],
        simulationModeOverride: true,
        attachCoverLetter: true,
      }),
    }).then((r) => r.json());
    assert.equal(batchRes.success, true);

    await new Promise((r) => setTimeout(r, 450));
    const hist = await fetch(`${base}/api/history`).then((r) => r.json());
    assert.equal(hist.length, 1);
    assert.equal(hist[0].status, 'success');
    assert.equal(hist[0].simulated, true);
    assert.ok(hist[0].coverFileName);
  } finally {
    server.close();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
