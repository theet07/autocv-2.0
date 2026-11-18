/**
 * server/tailorEngine.js
 * Motor ATS 2.0 — Análise semântica por sinônimos, Score multidimensional (0-100),
 * adaptação de currículo preservando a trajetória real do candidato, 3 tons de carta,
 * abordagem para WhatsApp/LinkedIn, Follow-up e Guia de Entrevista sob medida.
 */

import {
  ATS_LEXICON,
  SOFT_SKILLS_LEXICON,
  hasWholeTerm,
  detectJobMetadata,
} from './atsDictionary.js';

function buildProfileCorpus(profile = {}) {
  if (!profile) return '';
  const personal = profile.personal || {};
  const pillarSkills = Object.values(profile.pillars || {}).flatMap((p) => [
    p.title || '',
    p.highlight || '',
    ...(p.skills || []),
  ]);
  const expText = (profile.experiences || []).map(
    (e) => `${e.role || ''} ${e.company || ''} ${e.description || ''}`
  );
  const projText = (profile.projects || []).map(
    (p) => `${p.name || ''} ${p.tech || ''} ${p.description || ''}`
  );
  const eduText = (profile.education || []).map(
    (ed) => `${ed.course || ''} ${ed.institution || ''}`
  );
  return [
    personal.name,
    personal.title,
    profile.summary,
    ...pillarSkills,
    ...expText,
    ...projText,
    ...eduText,
    ...(profile.certifications || []),
    ...(profile.languages || []),
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Analisa texto da vaga + cargo contra o perfil do candidato (se fornecido).
 */
export function analyzeJobDescription(jobText = '', role = '', profile = null) {
  const combinedJob = `${role} ${jobText}`.trim();
  const profileCorpus = profile ? buildProfileCorpus(profile) : '';

  const scores = {
    suporte: 0,
    redes: 0,
    administrativo: 0,
    analista: 0,
  };

  const detectedItems = [];
  const detectedKeywords = [];

  for (const [category, entries] of Object.entries(ATS_LEXICON)) {
    for (const entry of entries) {
      const matchedAlias = entry.aliases.find((alias) => hasWholeTerm(combinedJob, alias));
      if (matchedAlias) {
        scores[category] += 1;
        if (!detectedKeywords.includes(entry.canonical)) {
          const presentInProfile = profile
            ? entry.aliases.some((alias) => hasWholeTerm(profileCorpus, alias)) ||
              hasWholeTerm(profileCorpus, entry.canonical)
            : false;

          detectedKeywords.push(entry.canonical);
          detectedItems.push({
            canonical: entry.canonical,
            matchedAlias,
            category,
            presentInProfile,
          });
        }
      }
    }
  }

  const detectedSoftSkills = [];
  for (const soft of SOFT_SKILLS_LEXICON) {
    if (soft.aliases.some((a) => hasWholeTerm(combinedJob, a))) {
      detectedSoftSkills.push(soft.canonical);
    }
  }

  // Categoria dominante
  let topCategory = 'suporte';
  let maxScore = -1;
  for (const [cat, sc] of Object.entries(scores)) {
    if (sc > maxScore) {
      maxScore = sc;
      topCategory = cat;
    }
  }

  const matchedInProfile = detectedItems.filter((i) => i.presentInProfile).map((i) => i.canonical);
  const missingInProfile = detectedItems.filter((i) => !i.presentInProfile).map((i) => i.canonical);

  // Cálculo do ATS Score Multidimensional (0-100)
  const hardRatio =
    detectedItems.length > 0 ? matchedInProfile.length / detectedItems.length : 0.75;
  const hardSkillsScore = Math.round(hardRatio * 40);

  // Alinhamento de cargo/pilar (0-25)
  const roleTokens = String(role || '')
    .toLowerCase()
    .split(/[\s/|,-]+/)
    .filter((w) => w.length >= 3 && !['para', 'com', 'vaga', 'junior', 'pleno'].includes(w));
  const matchedRoleTokens = roleTokens.filter((tok) => hasWholeTerm(profileCorpus, tok));
  const roleAlignmentScore =
    roleTokens.length > 0
      ? Math.min(25, Math.round((matchedRoleTokens.length / roleTokens.length) * 20) + 5)
      : 18;

  // Qualidade estrutural do currículo (0-20)
  let structureHealthScore = 0;
  const diagnostics = [];
  if (profile) {
    const p = profile.personal || {};
    if (p.email && p.phone) {
      structureHealthScore += 5;
      diagnostics.push({ status: 'ok', label: 'Contato direto (E-mail e WhatsApp) validado para triagem.' });
    } else {
      diagnostics.push({ status: 'warn', label: 'Preencha e-mail e telefone para leitura de contato ATS.' });
    }

    if (p.linkedin || p.github) {
      structureHealthScore += 5;
      diagnostics.push({
        status: 'ok',
        label: p.github
          ? 'Links verificáveis (LinkedIn + GitHub) presentes no cabeçalho.'
          : 'LinkedIn presente (adicione GitHub se aplicável).',
      });
    } else {
      diagnostics.push({ status: 'warn', label: 'Inclua URL do LinkedIn para elevar credibilidade no RH.' });
    }

    const summaryLen = (profile.summary || '').trim().length;
    if (summaryLen >= 250 && summaryLen <= 780) {
      structureHealthScore += 5;
      diagnostics.push({ status: 'ok', label: `Resumo profissional com extensão ideal (${summaryLen} caracteres).` });
    } else {
      structureHealthScore += 2;
      diagnostics.push({
        status: 'warn',
        label: `Resumo atual tem ${summaryLen} caracteres (ideal entre 280 e 700).`,
      });
    }

    if ((profile.experiences || []).length > 0 && (profile.education || []).length > 0) {
      structureHealthScore += 5;
      diagnostics.push({ status: 'ok', label: 'Histórico profissional e formação acadêmica estruturados.' });
    }
  } else {
    structureHealthScore = 16;
  }

  // Contexto & Soft skills (0-15)
  const contextSoftScore =
    detectedSoftSkills.length > 0 ? Math.min(15, 9 + detectedSoftSkills.length * 2) : 12;

  if (missingInProfile.length > 0) {
    diagnostics.push({
      status: 'action',
      label: `Injete até ${Math.min(3, missingInProfile.length)} termo(s) ausente(s) (${missingInProfile
        .slice(0, 3)
        .join(', ')}) caso tenha vivência neles.`,
    });
  } else if (detectedItems.length > 0) {
    diagnostics.push({
      status: 'ok',
      label: '100% dos requisitos técnicos detectados na vaga já constam no seu perfil!',
    });
  }

  const totalScore = Math.min(
    100,
    hardSkillsScore + roleAlignmentScore + structureHealthScore + contextSoftScore
  );

  const metadata = detectJobMetadata(jobText, role);

  return {
    topCategory,
    scores,
    detectedKeywords,
    detectedItems,
    detectedSoftSkills,
    matchedInProfile,
    missingInProfile,
    coveragePercent:
      detectedItems.length > 0
        ? Math.round((matchedInProfile.length / detectedItems.length) * 100)
        : null,
    atsScore: {
      total: totalScore,
      hardSkills: hardSkillsScore,
      roleAlignment: roleAlignmentScore,
      structureHealth: structureHealthScore,
      contextSoft: contextSoftScore,
    },
    diagnostics,
    metadata,
  };
}

/**
 * Reordena bullets de uma descrição de experiência priorizando frases que contenham termos da vaga.
 */
function prioritizeExperienceBullets(description = '', keywords = []) {
  const rawLines = String(description || '')
    .split(/\r?\n|(?<=\.)\s+(?=[A-ZÀ-Ÿ])/)
    .map((s) => s.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean);

  if (rawLines.length <= 1 || keywords.length === 0) {
    return rawLines.join('\n');
  }

  const scored = rawLines.map((line, index) => {
    let weight = 0;
    for (const kw of keywords) {
      const tokens = kw.toLowerCase().split(/[\s/&()]+/).filter((t) => t.length >= 3);
      for (const tok of tokens) {
        if (hasWholeTerm(line, tok)) weight += 2;
      }
    }
    return { line, weight, index };
  });

  scored.sort((a, b) => (b.weight !== a.weight ? b.weight - a.weight : a.index - b.index));
  return scored.map((s) => s.line).join('\n');
}

/**
 * Constrói resumo personalizado que valoriza a trajetória e formação do candidato
 * e conecta diretamente aos requisitos da vaga.
 */
function synthesizeContextSummary(baseProfile, role, company, dominantPillarKey, matchedKeywords) {
  const edu = baseProfile.education?.[0];
  const eduSnippet = (edu && edu.course && edu.institution)
    ? `Com formação em ${edu.course} (${edu.institution}) e`
    : (edu && edu.course)
    ? `Com formação em ${edu.course} e`
    : 'Profissional com sólida formação técnica e';

  const topTerms = matchedKeywords.slice(0, 4);
  const termsClause =
    topTerms.length > 0
      ? ` Domínio prático alinhado aos requisitos de ${topTerms.join(', ')}.`
      : '';

  if (dominantPillarKey === 'suporte') {
    return `${eduSnippet} experiência prática em Suporte de TI e atendimento N1/N2 a usuários corporativos. Vivência em diagnóstico de hardware e software, administração de acessos, ambientes operacionais, VPNs e resolução ágil de chamados.${termsClause} Perfil comunicativo, organizado e focado em manter a continuidade e a produtividade das operações na atuação como ${role}.`;
  }
  if (dominantPillarKey === 'redes') {
    return `${eduSnippet} sólida vivência prática em infraestrutura de TI, conectividade corporativa, gestão de VPNs, proxies e protocolos TCP/IP, DNS e DHCP. Experiência no suporte a ambientes de rede, configuração de roteadores/switches, diagnóstico de conectividade e segurança de acessos.${termsClause} Foco em alta disponibilidade, organização técnica e pronta resolução de incidentes para somar à equipe como ${role}.`;
  }
  if (dominantPillarKey === 'administrativo') {
    return `${eduSnippet} experiência prática na organização de bases de dados corporativas, controle de usuários e ativos, relatórios em planilhas e padronização de documentação operacional. Vivência real na otimização de fluxos internos, rastreabilidade de informações e atendimento claro a equipes e gestores.${termsClause} Combina disciplina administrativa com domínio tecnológico para agregar agilidade imediata na posição de ${role}.`;
  }
  return `${eduSnippet} vivência prática em suporte a sistemas corporativos, bancos de dados relacionais (SQL), desenvolvimento de software e automação de processos operacionais. Experiência na redução de tempo de execução de rotinas críticas, controle de integridade de dados e acompanhamento de indicadores.${termsClause} Perfil analítico e proativo para contribuir com entregas consistentes como ${role}.`;
}

/**
 * Gera 3 variações de pitch para e-mail/carta + mensagem curta de WhatsApp + nota LinkedIn + Follow-up + Guia de Entrevista.
 */
export function buildCommunicationKit({ baseProfile, role, company, dominantPillarKey, analysis }) {
  const name = baseProfile.personal?.name || 'Candidato';
  const firstName = name.split(' ')[0];
  const mainExp = baseProfile.experiences?.[0];
  const expRole = mainExp?.role || 'na área técnica';
  const expCompanyClause = mainExp?.company ? ` na ${mainExp.company}` : '';
  const edu = baseProfile.education?.[0];
  const eduClause = (edu && edu.course) ? ` somada à minha formação em ${edu.course}` : '';

  const topMatched =
    analysis.matchedInProfile.length > 0
      ? analysis.matchedInProfile.slice(0, 3).join(', ')
      : dominantPillarKey === 'redes'
      ? 'VPNs corporativas, TCP/IP e suporte de conectividade'
      : dominantPillarKey === 'administrativo'
      ? 'controle de planilhas, bases de dados e rotinas operacionais'
      : dominantPillarKey === 'analista'
      ? 'bancos de dados SQL, automação de processos e sistemas'
      : 'atendimento N1/N2, gestão de acessos e resolução ágil de incidentes';

  const pitches = {
    direto: `Com relação à oportunidade de ${role} na ${company}, trago experiência prática como ${expRole}${expCompanyClause} — atuando com ${topMatched}, suporte ágil a usuários e rotinas operacionais —${eduClause}. Tenho disponibilidade e foco total em contribuir desde o primeiro dia para a eficiência da operação.`,

    tecnico: `Analisando os requisitos técnicos da posição de ${role} na ${company}, destaco minha vivência prática com ${topMatched}, diagnóstico estruturado e foco em soluções eficientes. Na minha experiência como ${expRole}${expCompanyClause}, implementei melhorias que elevaram a agilidade e a qualidade dos processos — bagagem que desejo aplicar diretamente nos fluxos da ${company}.`,

    proativo: `Acompanho a atuação da ${company} e me identifico fortemente com os desafios da vaga de ${role}.${eduClause ? ` Com sólida formação em ${edu.course} e` : ' Com'} experiência prática em suporte e processos operacionais, uno base técnica atualizada, facilidade de comunicação e energia para aprender rápido os processos internos da equipe.`,
  };

  const whatsappMessage = `Olá! Tudo bem? Me chamo ${name}. Vi a oportunidade para *${role}* na *${company}* (com foco em ${topMatched}) e tenho grande interesse em participar do processo seletivo. Posso encaminhar meu currículo atualizado em PDF por aqui? Muito obrigado!`;

  const linkedinNote = `Olá! Sou ${firstName}. Vi a oportunidade de ${role} na ${company} (${topMatched}) e gostaria muito de me conectar e colocar meu perfil à disposição do time!`;

  const followUpEmail = {
    subject: `Acompanhamento de candidatura — ${role} | ${name}`,
    body: `Olá, equipe de Recrutamento da ${company}!\n\nEspero que estejam bem.\n\nHá alguns dias enviei meu currículo para a oportunidade de ${role} e gostaria de reforçar meu entusiasmo em colaborar com a equipe, contribuindo com minha vivência prática em ${topMatched} e suporte operacional.\n\nPermaneço à inteira disposição caso precisem de qualquer informação complementar ou para agendarmos uma conversa rápida.\n\nAtenciosamente,\n${name}\n${baseProfile.personal?.phone || ''} | ${baseProfile.personal?.email || ''}`,
  };

  const interviewPrep = [
    {
      question: `1. "Fale um pouco sobre sua experiência prática e como ela se conecta à vaga de ${role}."`,
      tip: `Destaque sua experiência prática como ${expRole}${expCompanyClause} e sua formação. Cite exemplos concretos de ${topMatched} e como você busca solucionar problemas com foco na satisfação do usuário e na produtividade da equipe.`,
    },
    {
      question:
        dominantPillarKey === 'redes'
          ? '2. "Como você diagnostica um usuário corporativo sem acesso ao sistema ou à rede?"'
          : dominantPillarKey === 'administrativo'
          ? '2. "Como você garante organização e zero retrabalho ao lidar com controles operacionais e dados críticos?"'
          : dominantPillarKey === 'analista'
          ? '2. "Conte um caso em que você usou tecnologia, dados ou automação para melhorar um processo."'
          : '2. "Quando chegam vários chamados urgentes ao mesmo tempo, como você prioriza o atendimento?"',
      tip:
        dominantPillarKey === 'redes'
          ? 'Explique o passo a passo estruturado: validação física/Wi-Fi, teste de IP/DNS/gateway (ping/tracert), verificação de credenciais/VPN e checagem de regras de firewall — comunicando o status com clareza ao usuário.'
          : dominantPillarKey === 'administrativo'
          ? 'Mostre seu método de organização: padronização de registros, conferência cruzada de integridade de dados, rastreabilidade de quem/quando alterou e documentação simples para a equipe.'
          : dominantPillarKey === 'analista'
          ? 'Cite exemplos práticos em que você identificou um gargalo repetitivo e utilizou automação, scripts ou organização de dados para reduzir tempo e erros manuais.'
          : 'Responda usando criticidade × urgência (SLA): incidentes que impactam múltiplos usuários ou a operação principal vêm primeiro, mantendo retorno rápido e transparente para todos os solicitantes.',
    },
    {
      question: `3. "Por que você quer trabalhar na ${company} neste momento da sua carreira?"`,
      tip: `Conecte sua bagagem e seus objetivos profissionais à cultura e aos desafios da ${company}, demonstrando vontade de somar no dia a dia, aprender novos processos e evoluir junto com o time.`,
    },
  ];

  return {
    pitches,
    whatsappMessage,
    linkedinNote,
    followUpEmail,
    interviewPrep,
  };
}

export function tailorProfile(baseProfile, jobTarget = {}, options = {}) {
  const role = (jobTarget.role || 'Analista / Técnico de Suporte de TI').trim();
  const company = (jobTarget.company || 'Empresa').trim();
  const jobDescription = jobTarget.customJobDescription || jobTarget.notes || '';
  const pitchTone = options.pitchTone || 'direto';

  const analysis = analyzeJobDescription(jobDescription, role, baseProfile);
  const dominantPillarKey =
    jobTarget.category && baseProfile.pillars?.[jobTarget.category]
      ? jobTarget.category
      : analysis.topCategory || 'suporte';

  const pillar = baseProfile.pillars?.[dominantPillarKey] || baseProfile.pillars?.suporte || {
    title: 'Tecnologia da Informação',
    skills: [],
  };

  const tailored = JSON.parse(JSON.stringify(baseProfile));

  // 1. Ajusta o título profissional alinhando o cargo exato da vaga + especialidade
  const cleanPillarTitle = pillar.title.replace(/\s*\(.*?\)\s*/g, '').trim();
  tailored.personal.title =
    role.toLowerCase().includes(cleanPillarTitle.toLowerCase().split(' ')[0])
      ? `${role} | ${cleanPillarTitle}`
      : `${role} · ${cleanPillarTitle}`;

  // 2. Gera resumo contextual preservando a trajetória e formação do candidato
  tailored.summary = synthesizeContextSummary(
    baseProfile,
    role,
    company,
    dominantPillarKey,
    analysis.matchedInProfile
  );

  // 3. Reordena habilidades priorizando aquelas que dão match direto na vaga
  const allCandidateSkills = [
    ...(pillar.skills || []),
    ...Object.entries(baseProfile.pillars || {})
      .filter(([k]) => k !== dominantPillarKey)
      .flatMap(([, p]) => (p.skills || []).slice(0, 2)),
  ];

  const uniqueSkills = [];
  for (const sk of allCandidateSkills) {
    if (sk && !uniqueSkills.includes(sk)) uniqueSkills.push(sk);
  }

  const scoredSkills = uniqueSkills.map((sk, idx) => {
    let relevance = idx < (pillar.skills || []).length ? 3 : 0;
    for (const kw of analysis.detectedKeywords) {
      const words = kw.split(/[\s/&()]+/).filter((w) => w.length >= 3);
      if (words.some((w) => hasWholeTerm(sk, w))) relevance += 5;
    }
    return { sk, relevance, idx };
  });

  scoredSkills.sort((a, b) => (b.relevance !== a.relevance ? b.relevance - a.relevance : a.idx - b.idx));
  tailored.activeSkills = scoredSkills.slice(0, 10).map((item) => item.sk);
  tailored.dominantPillar = dominantPillarKey;

  // 4. Reordena os bullets internos das experiências de acordo com as palavras da vaga
  if (Array.isArray(tailored.experiences)) {
    tailored.experiences = tailored.experiences.map((exp) => ({
      ...exp,
      description: prioritizeExperienceBullets(exp.description, analysis.detectedKeywords),
    }));
  }

  // 5. Recalcula o score ATS pós-adaptação para mostrar o ganho real!
  const postTailorAnalysis = analyzeJobDescription(jobDescription, role, tailored);

  // 6. Kit completo de comunicação (3 tons + WhatsApp + LinkedIn + Follow-up + Entrevista)
  const commKit = buildCommunicationKit({
    baseProfile: tailored,
    role,
    company,
    dominantPillarKey,
    analysis: postTailorAnalysis,
  });

  const tailoredPitch = commKit.pitches[pitchTone] || commKit.pitches.direto;

  return {
    tailoredProfile: tailored,
    tailoredPitch,
    pitches: commKit.pitches,
    whatsappMessage: commKit.whatsappMessage,
    linkedinNote: commKit.linkedinNote,
    followUpEmail: commKit.followUpEmail,
    interviewPrep: commKit.interviewPrep,
    analysis: postTailorAnalysis,
    beforeScore: analysis.atsScore.total,
    afterScore: postTailorAnalysis.atsScore.total,
  };
}
