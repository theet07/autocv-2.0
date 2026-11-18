/**
 * server/aiEnhancer.js
 * Integração opcional com IA Local (Ollama em http://127.0.0.1:11434) ou endpoint compatível OpenAI.
 * Se não estiver ativo, o sistema opera 100% offline pelo Motor Determinístico ATS 2.0 sem latência.
 */

export async function checkLocalAiStatus(aiSettings = {}) {
  const baseUrl = (aiSettings.baseUrl || 'http://127.0.0.1:11434').replace(/\/+$/, '');
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    const res = await fetch(`${baseUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      return { available: false, models: [], baseUrl };
    }
    const data = await res.json();
    const models = (data.models || []).map((m) => m.name);
    return { available: true, models, baseUrl };
  } catch {
    return { available: false, models: [], baseUrl };
  }
}

export async function refinePitchWithLocalAi({
  aiSettings = {},
  profile,
  role,
  company,
  jobDescription,
  currentPitch,
}) {
  const status = await checkLocalAiStatus(aiSettings);
  if (!status.available || status.models.length === 0) {
    throw new Error(
      'Servidor Ollama local não detectado em execução (porta 11434). O pitch determinístico ATS 2.0 já está pronto para uso!'
    );
  }

  const chosenModel =
    aiSettings.model && status.models.includes(aiSettings.model)
      ? aiSettings.model
      : status.models[0];

  const prompt = `Você é um especialista brasileiro em recrutamento de TI e RH.
Reescreva o parágrafo de apresentação abaixo em Português do Brasil, mantendo 100% de fidelidade aos fatos reais do candidato (NÃO invente empresas nem cursos), deixando-o natural, direto, persuasivo e com no máximo 95 palavras.

Candidato: ${profile.personal?.name}
Formação real: ${profile.education?.[0]?.course || ''} (${profile.education?.[0]?.institution || ''})
Vaga alvo: ${role} na empresa ${company}
Requisitos da vaga: ${String(jobDescription || '').slice(0, 600)}
Rascunho base: ${currentPitch}

Responda APENAS com o parágrafo final pronto para ir no corpo do e-mail, sem aspas e sem introduções.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  const res = await fetch(`${status.baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      model: chosenModel,
      prompt,
      stream: false,
      options: { temperature: 0.35 },
    }),
  });
  clearTimeout(timer);

  if (!res.ok) {
    throw new Error(`Falha ao consultar modelo ${chosenModel} no Ollama.`);
  }
  const data = await res.json();
  return {
    refinedPitch: String(data.response || currentPitch).trim(),
    modelUsed: chosenModel,
  };
}
