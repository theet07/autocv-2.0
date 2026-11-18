/**
 * server/server.js
 * Servidor Express e API REST do AutoCV 2.0.
 * Porta padrão: 3002 (isolada do AutoCV 1.0 na 3001).
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { tailorProfile, analyzeJobDescription } from './tailorEngine.js';
import { parseRawJobAd } from './jobParser.js';
import { generateResumePDF, generateCoverLetterPDF } from './pdfGenerator.js';
import { testSmtpConnection, sendEmail } from './emailSender.js';
import { checkLocalAiStatus, refinePitchWithLocalAi } from './aiEnhancer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = process.env.AUTOCV_DATA_DIR || path.join(ROOT_DIR, 'data');
const OUTPUT_DIR = process.env.AUTOCV_OUTPUT_DIR || path.join(ROOT_DIR, 'output');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

export const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/output', express.static(OUTPUT_DIR));

const distPath = path.join(ROOT_DIR, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Leitura e gravação atômica de JSON (protege contra corrupção de arquivo)
export function readJson(filename, defaultValue = {}) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      writeJson(filename, defaultValue);
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Erro ao ler ${filename}:`, err.message);
    return defaultValue;
  }
}

export function writeJson(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, filePath);
    return true;
  } catch (err) {
    if (fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        // ignore cleanup error
      }
    }
    console.error(`Erro ao salvar ${filename}:`, err.message);
    return false;
  }
}

function sanitizeFileSlug(text = 'Documento') {
  return (
    String(text)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'Documento'
  );
}

function renderEmailFromTemplates({ settings, profile, target, tailoredPitch }) {
  const dispatch = settings?.dispatch || {};
  const personal = profile?.personal || {};
  const role = target?.role || 'Analista / Suporte de TI';
  const company = target?.company || 'Empresa';
  const name = personal.name || 'Candidato';

  const subject = (dispatch.subjectTemplate || 'Candidatura para a vaga de {role} - {name}')
    .replace(/{role}/g, role)
    .replace(/{name}/g, name)
    .replace(/{company}/g, company);

  const body = (dispatch.messageTemplate || '')
    .replace(/{role}/g, role)
    .replace(/{name}/g, name)
    .replace(/{company}/g, company)
    .replace(/{tailored_pitch}/g, tailoredPitch || '')
    .replace(/{phone}/g, personal.phone || '')
    .replace(/{email}/g, personal.email || '')
    .replace(/{linkedin}/g, personal.linkedin || '')
    .replace(/{github}/g, personal.github || '');

  return { subject, body };
}

// --- HEALTHCHECK ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', port: PORT });
});

// --- PERFIL ---
app.get('/api/profile', (req, res) => {
  res.json(readJson('profile.json', {}));
});

app.post('/api/profile', (req, res) => {
  const updated = req.body;
  if (!updated || typeof updated !== 'object') {
    return res.status(400).json({ success: false, error: 'Payload de perfil inválido.' });
  }
  writeJson('profile.json', updated);
  res.json({ success: true, profile: updated });
});

// --- VAGAS / CRM DE ALVOS ---
app.get('/api/targets', (req, res) => {
  res.json(readJson('targets.json', []));
});

app.post('/api/targets', (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ success: false, error: 'A lista de vagas deve ser um array.' });
  }
  writeJson('targets.json', req.body);
  res.json({ success: true, count: req.body.length });
});

app.post('/api/targets/add', (req, res) => {
  const targets = readJson('targets.json', []);
  const emailNorm = String(req.body.email || '').trim().toLowerCase();
  const duplicate = emailNorm
    ? targets.find((t) => String(t.email || '').trim().toLowerCase() === emailNorm)
    : null;

  const newTarget = {
    id: `target-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    company: String(req.body.company || 'Nova Empresa').trim(),
    email: emailNorm,
    phone: String(req.body.phone || '').trim(),
    role: String(req.body.role || 'Suporte Técnico de TI').trim(),
    category: ['suporte', 'redes', 'administrativo', 'analista'].includes(req.body.category)
      ? req.body.category
      : 'suporte',
    city: String(req.body.city || '').trim(),
    salary: String(req.body.salary || '').trim(),
    sourceUrl: String(req.body.sourceUrl || '').trim(),
    priority: ['alta', 'media', 'baixa'].includes(req.body.priority) ? req.body.priority : 'media',
    status: req.body.status || 'pending',
    notes: String(req.body.notes || '').trim(),
    customJobDescription: String(req.body.customJobDescription || '').trim(),
    createdAt: new Date().toISOString(),
  };

  targets.unshift(newTarget);
  writeJson('targets.json', targets);
  res.json({
    success: true,
    target: newTarget,
    duplicateWarning: duplicate
      ? `Atenção: o e-mail ${emailNorm} já estava cadastrado em "${duplicate.company}".`
      : null,
  });
});

app.delete('/api/targets/:id', (req, res) => {
  const targets = readJson('targets.json', []);
  const filtered = targets.filter((t) => t.id !== req.params.id);
  writeJson('targets.json', filtered);
  res.json({ success: true });
});

// --- EXTRATOR INTELIGENTE DE ANÚNCIO ---
app.post('/api/jobs/parse', (req, res) => {
  try {
    const parsed = parseRawJobAd(req.body?.rawText || '');
    res.json({ success: true, parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- CONFIGURAÇÕES ---
app.get('/api/settings', (req, res) => {
  const settings = readJson('settings.json', {});
  const merged = {
    email: {
      provider: 'gmail',
      user: '',
      pass: '',
      fromName: 'Seu Nome Completo',
      smtpHost: '',
      smtpPort: 587,
      secure: false,
      ...(settings.email || {}),
    },
    dispatch: {
      delaySecondsMin: 30,
      delaySecondsMax: 60,
      simulationMode: true,
      attachPdf: true,
      attachCoverLetter: false,
      htmlFormat: true,
      preventDuplicateSends: true,
      defaultPitchTone: 'direto',
      subjectTemplate: 'Candidatura para a vaga de {role} - {name}',
      messageTemplate: '',
      ...(settings.dispatch || {}),
    },
    ai: {
      baseUrl: 'http://127.0.0.1:11434',
      model: '',
      ...(settings.ai || {}),
    },
  };
  res.json(merged);
});

app.post('/api/settings', (req, res) => {
  const updated = req.body;
  writeJson('settings.json', updated);
  res.json({ success: true, settings: updated });
});

// --- HISTÓRICO ---
app.get('/api/history', (req, res) => {
  res.json(readJson('history.json', []));
});

app.delete('/api/history', (req, res) => {
  writeJson('history.json', []);
  res.json({ success: true });
});

// --- BACKUP COMPLETO EXPORT / IMPORT ---
app.get('/api/backup/export', (req, res) => {
  const settings = readJson('settings.json', {});
  // Omite a senha SMTP no backup exportado por segurança
  const safeSettings = JSON.parse(JSON.stringify(settings));
  if (safeSettings.email) safeSettings.email.pass = '';

  res.json({
    exportedAt: new Date().toISOString(),
    version: '2.0.0',
    profile: readJson('profile.json', {}),
    targets: readJson('targets.json', []),
    history: readJson('history.json', []),
    settings: safeSettings,
  });
});

app.post('/api/backup/import', (req, res) => {
  const { profile, targets, history } = req.body || {};
  if (profile && typeof profile === 'object') writeJson('profile.json', profile);
  if (Array.isArray(targets)) writeJson('targets.json', targets);
  if (Array.isArray(history)) writeJson('history.json', history);
  res.json({ success: true });
});

// --- SMTP TESTE & AUTO-TESTE NA PRÓPRIA CAIXA DE ENTRADA ---
app.post('/api/test-email', async (req, res) => {
  try {
    const emailCfg = req.body?.email || readJson('settings.json', {}).email;
    const result = await testSmtpConnection(emailCfg);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/send-test-email', async (req, res) => {
  try {
    const settings = req.body?.settings || readJson('settings.json', {});
    const baseProfile = readJson('profile.json', {});
    const emailCfg = settings.email || {};

    if (!emailCfg.user || !emailCfg.pass) {
      return res.status(400).json({
        success: false,
        error: 'Preencha seu e-mail e Senha de Aplicativo antes de disparar o e-mail de teste.',
      });
    }

    const sampleTarget = {
      company: 'Empresa Exemplo (Teste AutoCV 2.0)',
      role: baseProfile.personal?.title?.split('|')[0]?.trim() || 'Suporte Técnico de TI',
      category: baseProfile.selectedPillar || 'suporte',
    };

    const { tailoredProfile, tailoredPitch } = tailorProfile(baseProfile, sampleTarget, {
      pitchTone: settings.dispatch?.defaultPitchTone || 'direto',
    });

    const slugName = sanitizeFileSlug(baseProfile.personal?.name || 'Curriculo');
    const pdfFileName = `Curriculo_${slugName}_Teste.pdf`;
    const pdfPath = path.join(OUTPUT_DIR, pdfFileName);
    await generateResumePDF(tailoredProfile, pdfPath);

    const { subject, body } = renderEmailFromTemplates({
      settings,
      profile: baseProfile,
      target: sampleTarget,
      tailoredPitch,
    });

    const result = await sendEmail({
      emailSettings: emailCfg,
      to: emailCfg.user,
      subject: `[TESTE AUTOCV 2.0] ${subject}`,
      body,
      htmlFormat: settings.dispatch?.htmlFormat !== false,
      attachmentPath: pdfPath,
      attachmentName: `Curriculo_${slugName}.pdf`,
      isSimulation: false,
    });

    res.json({
      success: true,
      message: `E-mail de teste com PDF enviado para ${emailCfg.user}! Verifique sua caixa de entrada.`,
      result,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- IA LOCAL OPCIONAL (OLLAMA) ---
app.get('/api/ai/status', async (req, res) => {
  const settings = readJson('settings.json', {});
  const status = await checkLocalAiStatus(settings.ai || {});
  res.json(status);
});

app.post('/api/ai/refine', async (req, res) => {
  try {
    const settings = readJson('settings.json', {});
    const profile = req.body?.profile || readJson('profile.json', {});
    const { role, company, jobDescription, currentPitch } = req.body || {};
    const out = await refinePitchWithLocalAi({
      aiSettings: settings.ai || {},
      profile,
      role,
      company,
      jobDescription,
      currentPitch,
    });
    res.json({ success: true, ...out });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- MOTOR ATS 2.0 & GERAÇÃO DE PDFs ---
app.post('/api/tailor', (req, res) => {
  try {
    const baseProfile = req.body?.profile || readJson('profile.json', {});
    const target = req.body?.target || {};
    const pitchTone = req.body?.pitchTone || 'direto';
    const result = tailorProfile(baseProfile, target, { pitchTone });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/analyze', (req, res) => {
  try {
    const baseProfile = req.body?.profile || readJson('profile.json', {});
    const { jobText = '', role = '' } = req.body || {};
    res.json(analyzeJobDescription(jobText, role, baseProfile));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pdf/generate', async (req, res) => {
  try {
    const baseProfile = req.body?.profile || readJson('profile.json', {});
    const target = req.body?.target || null;
    const styleOverrides = req.body?.styleOverrides || {};

    let finalProfile = baseProfile;
    const slugName = sanitizeFileSlug(baseProfile.personal?.name || 'Candidato');
    let fileName = `Curriculo_${slugName}.pdf`;

    if (target && (target.company || target.role || target.customJobDescription)) {
      if (req.body?.alreadyTailored) {
        finalProfile = baseProfile;
      } else {
        const { tailoredProfile } = tailorProfile(baseProfile, target);
        finalProfile = {
          ...tailoredProfile,
          resumeStyle: { ...(baseProfile.resumeStyle || {}), ...styleOverrides },
        };
      }
      const slugComp = sanitizeFileSlug(target.company || 'Empresa');
      fileName = `Curriculo_${slugName}_${slugComp}.pdf`;
    }

    const outputPath = path.join(OUTPUT_DIR, fileName);
    await generateResumePDF(finalProfile, outputPath, styleOverrides);

    res.json({
      success: true,
      fileName,
      url: `/output/${fileName}`,
      path: outputPath,
    });
  } catch (err) {
    console.error('Erro gerando PDF:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/pdf/cover-letter', async (req, res) => {
  try {
    const profileData = req.body?.profile || readJson('profile.json', {});
    const settings = readJson('settings.json', {});
    const target = req.body?.target || { company: 'Empresa Contratante', role: 'Suporte de TI' };
    const customBody = req.body?.bodyText;

    let bodyText = customBody;
    if (!bodyText) {
      const { tailoredPitch } = tailorProfile(profileData, target);
      bodyText = renderEmailFromTemplates({
        settings,
        profile: profileData,
        target,
        tailoredPitch,
      }).body;
    }

    const slugName = sanitizeFileSlug(profileData.personal?.name || 'Candidato');
    const slugComp = sanitizeFileSlug(target.company || 'Empresa');
    const fileName = `Carta_Apresentacao_${slugName}_${slugComp}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, fileName);

    await generateCoverLetterPDF({
      profileData,
      company: target.company || 'Empresa Contratante',
      role: target.role || 'Profissional de TI',
      bodyText,
      outputPath,
      styleOverrides: req.body?.styleOverrides || {},
    });

    res.json({
      success: true,
      fileName,
      url: `/output/${fileName}`,
      path: outputPath,
    });
  } catch (err) {
    console.error('Erro gerando Carta PDF:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- DISPARO EM LOTE 2.0 COM PAUSA / RETOMADA / ANTI-DUPLICIDADE (SSE) ---
const dispatchState = {
  isRunning: false,
  isPaused: false,
  shouldCancel: false,
};

const sseClients = new Set();

function broadcastSSE(payload) {
  const msg = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    client.write(msg);
  }
}

app.get('/api/dispatch/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));

  res.write(
    `data: ${JSON.stringify({
      type: 'STATUS',
      isRunning: dispatchState.isRunning,
      isPaused: dispatchState.isPaused,
    })}\n\n`
  );
});

app.post('/api/dispatch/pause', (req, res) => {
  if (!dispatchState.isRunning) {
    return res.json({ success: false, message: 'Nenhum lote em execução.' });
  }
  dispatchState.isPaused = true;
  broadcastSSE({ type: 'BATCH_PAUSED' });
  res.json({ success: true, isPaused: true });
});

app.post('/api/dispatch/resume', (req, res) => {
  if (!dispatchState.isRunning) {
    return res.json({ success: false, message: 'Nenhum lote em execução.' });
  }
  dispatchState.isPaused = false;
  broadcastSSE({ type: 'BATCH_RESUMED' });
  res.json({ success: true, isPaused: false });
});

app.post('/api/dispatch/stop', (req, res) => {
  if (dispatchState.isRunning) {
    dispatchState.shouldCancel = true;
    dispatchState.isPaused = false;
    res.json({ success: true, message: 'Interrupção solicitada.' });
  } else {
    res.json({ success: false, message: 'Nenhum disparo ativo.' });
  }
});

async function waitWhilePausedOrCancelled() {
  while (dispatchState.isPaused && !dispatchState.shouldCancel) {
    await new Promise((r) => setTimeout(r, 400));
  }
}

app.post('/api/dispatch/start', async (req, res) => {
  if (dispatchState.isRunning) {
    return res.status(400).json({ error: 'Já existe um lote em andamento.' });
  }

  const {
    targetIds,
    simulationModeOverride,
    allowResend = false,
    pitchTone,
    attachCoverLetter,
  } = req.body || {};

  const settings = readJson('settings.json', {});
  const baseProfile = readJson('profile.json', {});
  const targets = readJson('targets.json', []);
  const history = readJson('history.json', []);

  const selectedTargets = targets.filter((t) =>
    Array.isArray(targetIds) ? targetIds.includes(t.id) : t.status === 'pending'
  );

  if (selectedTargets.length === 0) {
    return res.status(400).json({ error: 'Selecione ao menos uma empresa para iniciar o disparo.' });
  }

  const isSimulation =
    simulationModeOverride !== undefined
      ? Boolean(simulationModeOverride)
      : Boolean(settings.dispatch?.simulationMode ?? true);

  if (!isSimulation && (!settings.email?.user || !settings.email?.pass)) {
    return res.status(400).json({
      error: 'Credenciais SMTP não configuradas. Configure seu e-mail e Senha de Aplicativo na aba SMTP & Backup ou ative o Modo Simulação.',
    });
  }

  const preventDuplicates =
    !allowResend && (settings.dispatch?.preventDuplicateSends !== false);

  dispatchState.isRunning = true;
  dispatchState.isPaused = false;
  dispatchState.shouldCancel = false;

  res.json({
    success: true,
    total: selectedTargets.length,
    isSimulation,
  });

  (async () => {
    const alreadyEmailedReal = new Set(
      history
        .filter((h) => h.status === 'success' && !h.simulated && h.email)
        .map((h) => String(h.email).toLowerCase())
    );

    broadcastSSE({
      type: 'BATCH_START',
      total: selectedTargets.length,
      isSimulation,
    });

    for (let i = 0; i < selectedTargets.length; i++) {
      await waitWhilePausedOrCancelled();
      if (dispatchState.shouldCancel) {
        broadcastSSE({ type: 'BATCH_CANCELLED', completed: i });
        break;
      }

      const target = selectedTargets[i];
      const emailKey = String(target.email || '').trim().toLowerCase();
      const progressPercent = Math.round((i / selectedTargets.length) * 100);

      // Trava anti-reenvio duplicado em modo real
      if (!isSimulation && preventDuplicates && alreadyEmailedReal.has(emailKey)) {
        const skipEntry = {
          id: `log-${Date.now()}-${i}`,
          timestamp: new Date().toISOString(),
          targetId: target.id,
          company: target.company,
          role: target.role,
          email: target.email,
          status: 'skipped',
          simulated: false,
          error: 'Envio duplicado bloqueado automaticamente (já enviado anteriormente).',
        };
        history.unshift(skipEntry);
        writeJson('history.json', history);
        broadcastSSE({
          type: 'ITEM_SKIPPED',
          index: i + 1,
          total: selectedTargets.length,
          target,
          reason: skipEntry.error,
        });
        continue;
      }

      broadcastSSE({
        type: 'SENDING_ITEM',
        index: i,
        total: selectedTargets.length,
        progressPercent,
        target,
      });

      try {
        const chosenTone = pitchTone || settings.dispatch?.defaultPitchTone || 'direto';
        const { tailoredProfile, tailoredPitch, afterScore } = tailorProfile(baseProfile, target, {
          pitchTone: chosenTone,
        });

        const slugName = sanitizeFileSlug(baseProfile.personal?.name || 'Candidato');
        const slugComp = sanitizeFileSlug(target.company || 'Empresa');
        const pdfFileName = `Curriculo_${slugName}_${slugComp}.pdf`;
        const pdfPath = path.join(OUTPUT_DIR, pdfFileName);

        await generateResumePDF(tailoredProfile, pdfPath);

        const { subject, body } = renderEmailFromTemplates({
          settings,
          profile: baseProfile,
          target,
          tailoredPitch,
        });

        const attachments = [
          {
            filename: `Curriculo_${slugName}.pdf`,
            path: pdfPath,
            contentType: 'application/pdf',
          },
        ];

        const includeCover =
          attachCoverLetter !== undefined
            ? Boolean(attachCoverLetter)
            : Boolean(settings.dispatch?.attachCoverLetter);

        let coverFileName = null;
        if (includeCover) {
          coverFileName = `Carta_${slugName}_${slugComp}.pdf`;
          const coverPath = path.join(OUTPUT_DIR, coverFileName);
          await generateCoverLetterPDF({
            profileData: tailoredProfile,
            company: target.company,
            role: target.role,
            bodyText: body,
            outputPath: coverPath,
          });
          attachments.push({
            filename: `Carta_Apresentacao_${slugName}.pdf`,
            path: coverPath,
            contentType: 'application/pdf',
          });
        }

        await sendEmail({
          emailSettings: settings.email,
          to: target.email,
          subject,
          body,
          htmlFormat: settings.dispatch?.htmlFormat !== false,
          attachments,
          isSimulation,
        });

        if (!isSimulation && emailKey) {
          alreadyEmailedReal.add(emailKey);
        }

        const logEntry = {
          id: `log-${Date.now()}-${i}`,
          timestamp: new Date().toISOString(),
          targetId: target.id,
          company: target.company,
          role: target.role,
          email: target.email,
          status: 'success',
          simulated: isSimulation,
          atsScore: afterScore,
          subject,
          pdfFileName,
          coverFileName,
        };

        history.unshift(logEntry);
        writeJson('history.json', history);

        const targetInList = targets.find((x) => x.id === target.id);
        if (targetInList) {
          if (isSimulation && targetInList.status === 'pending') {
            targetInList.status = 'simulated';
          } else if (!isSimulation) {
            targetInList.status = 'sent';
          }
          targetInList.lastSent = logEntry.timestamp;
          targetInList.lastAtsScore = afterScore;
          writeJson('targets.json', targets);
        }

        broadcastSSE({
          type: 'ITEM_SUCCESS',
          index: i + 1,
          total: selectedTargets.length,
          logEntry,
        });
      } catch (err) {
        console.error(`Falha ao enviar para ${target.company}:`, err.message);
        const logEntry = {
          id: `log-${Date.now()}-${i}`,
          timestamp: new Date().toISOString(),
          targetId: target.id,
          company: target.company,
          role: target.role,
          email: target.email,
          status: 'error',
          simulated: isSimulation,
          error: err.message,
        };
        history.unshift(logEntry);
        writeJson('history.json', history);

        const targetInList = targets.find((x) => x.id === target.id);
        if (targetInList && !isSimulation) {
          targetInList.status = 'error';
          writeJson('targets.json', targets);
        }

        broadcastSSE({
          type: 'ITEM_ERROR',
          index: i + 1,
          total: selectedTargets.length,
          target,
          error: err.message,
        });
      }

      if (i < selectedTargets.length - 1 && !dispatchState.shouldCancel) {
        const minSec = isSimulation ? 2 : Number(settings.dispatch?.delaySecondsMin) || 30;
        const maxSec = isSimulation ? 4 : Number(settings.dispatch?.delaySecondsMax) || 60;
        const delaySeconds = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;

        broadcastSSE({
          type: 'WAITING_DELAY',
          seconds: delaySeconds,
          nextIndex: i + 1,
        });

        for (let s = delaySeconds; s > 0; s--) {
          await waitWhilePausedOrCancelled();
          if (dispatchState.shouldCancel) break;
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }

    dispatchState.isRunning = false;
    dispatchState.isPaused = false;
    dispatchState.shouldCancel = false;

    broadcastSSE({
      type: 'BATCH_FINISH',
      total: selectedTargets.length,
    });
  })();
});

// Fallback SPA
app.get('*', (req, res) => {
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(200).send(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>AutoCV 2.0 API</title></head><body style="font-family:system-ui;padding:2rem;"><h2>AutoCV 2.0 Backend Online (Porta ${PORT})</h2><p>Execute <code>npm run build</code> ou acesse o Vite dev server.</p></body></html>`);
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('======================================================');
    console.log(`  AutoCV 2.0 Server ativo em http://localhost:${PORT}`);
    console.log(`  PDFs gerados em: ${OUTPUT_DIR}`);
    console.log('======================================================');
  });
}
