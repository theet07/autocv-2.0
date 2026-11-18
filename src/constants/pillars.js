import {
  Headphones,
  Network,
  FileSpreadsheet,
  FileCode,
  LayoutTemplate,
  Sparkles,
  Minimize2,
} from 'lucide-react';

export const PILLARS_META = [
  {
    id: 'suporte',
    label: 'Suporte TI',
    title: 'Suporte Técnico & Help Desk',
    desc: 'N1/N2, chamados, AD, Windows/Linux, M365',
    icon: Headphones,
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    id: 'redes',
    label: 'Redes & Infra',
    title: 'Redes & Infraestrutura',
    desc: 'VPN, proxies, TCP/IP, switches, cabeamento',
    icon: Network,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    id: 'administrativo',
    label: 'Administrativo',
    title: 'Administração & Operações',
    desc: 'Excel, relatórios, inventário, documentação',
    icon: FileSpreadsheet,
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  {
    id: 'analista',
    label: 'Dev & Sistemas',
    title: 'Sistemas, SQL & Automações',
    desc: 'React, Node.js, SQL, APIs, SLAs, IA',
    icon: FileCode,
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
];

export const TEMPLATES_META = [
  {
    id: 'executive',
    label: 'Executivo Clássico',
    short: 'Executivo',
    desc: 'Hierarquia tradicional de alta leitura ATS',
    icon: LayoutTemplate,
  },
  {
    id: 'modern',
    label: 'Tech & Engenharia',
    short: 'Tech',
    desc: 'Barra lateral de destaque no cabeçalho e foco técnico',
    icon: Sparkles,
  },
  {
    id: 'compact',
    label: 'Compacto 1 Página',
    short: 'Compacto',
    desc: 'Densidade calibrada para caber 100% em 1 folha A4',
    icon: Minimize2,
  },
];

export const PALETTES_META = [
  {
    id: 'navy',
    label: 'Marinho',
    primary: '#1A365D',
    accent: '#2B6CB0',
    text: '#1E293B',
    muted: '#64748B',
    rule: '#CBD5E1',
    swatch: '#1A365D',
  },
  {
    id: 'graphite',
    label: 'Grafite',
    primary: '#18181B',
    accent: '#3F3F46',
    text: '#27272A',
    muted: '#71717A',
    rule: '#D4D4D8',
    swatch: '#18181B',
  },
  {
    id: 'emerald',
    label: 'Esmeralda',
    primary: '#064E3B',
    accent: '#047857',
    text: '#1E293B',
    muted: '#64748B',
    rule: '#CBD5E1',
    swatch: '#065F46',
  },
  {
    id: 'cobalt',
    label: 'Cobalto',
    primary: '#1E3A8A',
    accent: '#1D4ED8',
    text: '#1F2937',
    muted: '#6B7280',
    rule: '#CBD5E1',
    swatch: '#1D4ED8',
  },
];

export const PITCH_TONES = [
  { id: 'direto', label: 'Direto & Objetivo', desc: 'Curto e certeiro para triagem rápida do RH' },
  { id: 'tecnico', label: 'Técnico & Resultados', desc: 'Enfatiza ferramentas, VPN/SQL e entregas' },
  { id: 'proativo', label: 'Jovem Talento / Aprendizado Ágil', desc: 'Valoriza formação técnica sólida + energia prática e evolução rápida' },
];

export const STATUS_META = {
  pending: {
    label: 'Pendente',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  simulated: {
    label: 'Simulado',
    dot: 'bg-sky-500',
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  sent: {
    label: 'Enviado',
    dot: 'bg-emerald-600',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  followup: {
    label: 'Follow-up',
    dot: 'bg-violet-600',
    badge: 'bg-violet-50 text-violet-800 border-violet-200',
  },
  interview: {
    label: 'Entrevista',
    dot: 'bg-cobalt-600',
    badge: 'bg-cobalt-50 text-cobalt-700 border-cobalt-200',
  },
  offer: {
    label: 'Proposta!',
    dot: 'bg-teal-600',
    badge: 'bg-teal-100 text-teal-900 border-teal-300',
  },
  rejected: {
    label: 'Encerrada',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  error: {
    label: 'Falha SMTP',
    dot: 'bg-rose-600',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export const PRIORITY_META = {
  alta: { label: 'Alta', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  media: { label: 'Média', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  baixa: { label: 'Baixa', cls: 'bg-slate-50 text-slate-500 border-slate-200' },
};

// Léxico cliente sincronizado com o motor ATS 2.0 (sinônimos + fronteira de palavra)
export const CLIENT_LEXICON = {
  suporte: [
    { canonical: 'Suporte Técnico', aliases: ['suporte técnico', 'suporte tecnico', 'suporte de ti', 'suporte ti', 'técnico de informática', 'auxiliar de ti', 'assistente de ti'] },
    { canonical: 'Help Desk', aliases: ['helpdesk', 'help desk', 'service desk'] },
    { canonical: 'Atendimento N1/N2', aliases: ['n1', 'n2', 'nível 1', 'nível 2', 'atendimento ao usuário', 'atendimento a usuarios', 'suporte ao usuário'] },
    { canonical: 'Gestão de Chamados', aliases: ['chamados', 'tickets', 'incidentes', 'requisições'] },
    { canonical: 'GLPI / Jira / Zendesk', aliases: ['glpi', 'jira', 'zendesk', 'freshdesk', 'movidesk', 'servicenow'] },
    { canonical: 'Active Directory', aliases: ['active directory', 'ad', 'azure ad', 'entra id', 'gpo'] },
    { canonical: 'Gestão de Acessos', aliases: ['gestão de acessos', 'controle de acesso', 'reset de senha', 'contas corporativas', 'provisionamento', 'bloqueios'] },
    { canonical: 'Windows 10/11', aliases: ['windows', 'windows 10', 'windows 11', 'windows server', 'formatação'] },
    { canonical: 'Linux', aliases: ['linux', 'ubuntu', 'debian'] },
    { canonical: 'Microsoft 365', aliases: ['office 365', 'microsoft 365', 'o365', 'm365', 'outlook', 'teams', 'pacote office'] },
    { canonical: 'Hardware & Manutenção', aliases: ['hardware', 'manutenção de computadores', 'manutenção preventiva', 'notebooks', 'desktops', 'ssd'] },
    { canonical: 'Impressoras & Periféricos', aliases: ['impressoras', 'periféricos', 'dispositivos móveis'] },
    { canonical: 'Acesso Remoto', aliases: ['acesso remoto', 'anydesk', 'teamviewer', 'rdp', 'suporte remoto', 'presencial e remoto'] },
    { canonical: 'Backup & Segurança', aliases: ['backup', 'antivírus', 'endpoint', 'segurança da informação'] },
    { canonical: 'Ambientes Virtuais', aliases: ['ambientes virtuais', 'máquinas virtuais', 'virtualização', 'vmware', 'hyper-v'] },
  ],
  redes: [
    { canonical: 'Redes & Conectividade', aliases: ['redes', 'rede local', 'lan', 'wan', 'infraestrutura de redes', 'conectividade'] },
    { canonical: 'TCP/IP', aliases: ['tcp/ip', 'endereçamento ip', 'ipv4'] },
    { canonical: 'DNS & DHCP', aliases: ['dns', 'dhcp', 'gateway'] },
    { canonical: 'VPN & Proxy', aliases: ['vpn', 'vpns', 'proxy', 'proxies', 'openvpn', 'forticlient'] },
    { canonical: 'Roteadores & Switches', aliases: ['roteador', 'roteadores', 'switch', 'switches', 'access point', 'unifi'] },
    { canonical: 'Wi-Fi Corporativo', aliases: ['wi-fi', 'wifi', 'wireless'] },
    { canonical: 'Cabeamento Estruturado', aliases: ['cabeamento', 'cat5e', 'cat6', 'patch panel', 'rj45', 'crimpagem', 'crimpage', 'pontos de rede'] },
    { canonical: 'Racks & Servidores', aliases: ['rack', 'racks', 'servidor', 'servidores', 'nobreak'] },
    { canonical: 'VLAN & Firewall', aliases: ['vlan', 'vlans', 'firewall', 'mikrotik', 'cisco', 'fortigate', 'pfsense'] },
    { canonical: 'Monitoramento de Links', aliases: ['latência', 'perda de pacotes', 'links de dados', 'links de internet', 'zabbix', 'telecom'] },
  ],
  administrativo: [
    { canonical: 'Rotinas Administrativas', aliases: ['rotinas administrativas', 'administrativo', 'administração', 'auxiliar administrativo', 'assistente administrativo', 'backoffice'] },
    { canonical: 'Microsoft Excel', aliases: ['excel', 'planilhas', 'planilha', 'procv', 'tabela dinâmica', 'conciliação'] },
    { canonical: 'Relatórios & Indicadores', aliases: ['relatórios', 'indicadores', 'kpi', 'produtividade', 'métricas'] },
    { canonical: 'Inventário & Ativos', aliases: ['inventário', 'estoque', 'patrimônio', 'ativos', 'almoxarifado'] },
    { canonical: 'Documentação & Arquivo', aliases: ['documentação', 'organização de arquivos', 'arquivo', 'procedimentos', 'manuais', 'cadastros'] },
    { canonical: 'Notas Fiscais & Faturamento', aliases: ['nota fiscal', 'notas fiscais', 'faturamento', 'compras', 'fornecedores', 'financeiro'] },
    { canonical: 'Sistemas ERP', aliases: ['erp', 'totvs', 'sap', 'omie', 'sistemas internos', 'sistemas corporativos'] },
    { canonical: 'Atendimento Telefônico', aliases: ['atendimento telefônico', 'comunicação clara', 'recepção'] },
  ],
  analista: [
    { canonical: 'Análise de Processos', aliases: ['analista', 'processos', 'melhoria contínua', 'otimização de processos'] },
    { canonical: 'SLA & Governança', aliases: ['sla', 'slas', 'itil', 'rastreabilidade', 'integridade', 'auditoria'] },
    { canonical: 'SQL & Banco de Dados', aliases: ['banco de dados', 'bancos de dados', 'sql', 'mysql', 'sql server', 'postgresql'] },
    { canonical: 'JavaScript & TypeScript', aliases: ['javascript', 'typescript'] },
    { canonical: 'React & Web', aliases: ['react', 'next.js', 'frontend', 'html', 'css', 'ui/ux'] },
    { canonical: 'Node.js & Java', aliases: ['node.js', 'nodejs', 'java', 'spring boot', 'backend', 'fullstack'] },
    { canonical: 'APIs REST', aliases: ['api', 'apis', 'rest', 'integração', 'homologação', 'implantação'] },
    { canonical: 'Git & GitHub', aliases: ['git', 'github', 'versionamento'] },
    { canonical: 'Automação & IA', aliases: ['automação', 'automações', 'inteligência artificial', 'ia', 'power bi', 'scripts'] },
  ],
};

export function hasWholeKeyword(text = '', kw = '') {
  if (!text || !kw) return false;
  const escaped = kw.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!escaped) return false;
  const regex = new RegExp(`(?<![a-zA-ZÀ-ÿ0-9])${escaped}(?![a-zA-ZÀ-ÿ0-9])`, 'i');
  return regex.test(text);
}

export function buildProfileBlob(profile) {
  if (!profile) return '';
  return [
    profile.summary,
    profile.personal?.title,
    ...(profile.experiences || []).map((e) => `${e.role} ${e.company} ${e.description}`),
    ...(profile.projects || []).map((p) => `${p.name} ${p.tech} ${p.description}`),
    ...Object.values(profile.pillars || {}).flatMap((p) => [p.title, p.highlight, ...(p.skills || [])]),
    ...(profile.certifications || []),
    ...(profile.languages || []),
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Calcula em tempo real no navegador o Radar ATS 2.0 (score 0-100, sub-scores, termos cobertos e faltantes).
 */
export function computeLiveAtsRadar(jobText = '', role = '', profile = null) {
  const combined = `${role} ${jobText}`.trim();
  const profileBlob = buildProfileBlob(profile);

  const scores = { suporte: 0, redes: 0, administrativo: 0, analista: 0 };
  const detected = [];
  const matchedAliases = [];
  const matchedInProfile = [];
  const missingInProfile = [];

  for (const [cat, items] of Object.entries(CLIENT_LEXICON)) {
    for (const entry of items) {
      const foundAlias = entry.aliases.find((a) => hasWholeKeyword(combined, a));
      if (foundAlias) {
        scores[cat] += 1;
        if (!detected.includes(entry.canonical)) {
          detected.push(entry.canonical);
          matchedAliases.push(foundAlias);
          const inProf =
            entry.aliases.some((a) => hasWholeKeyword(profileBlob, a)) ||
            hasWholeKeyword(profileBlob, entry.canonical);
          if (inProf) {
            matchedInProfile.push(entry.canonical);
          } else {
            missingInProfile.push(entry.canonical);
          }
        }
      }
    }
  }

  let topCategory = 'suporte';
  let maxVal = 0;
  for (const [cat, val] of Object.entries(scores)) {
    if (val > maxVal) {
      maxVal = val;
      topCategory = cat;
    }
  }

  const coveragePercent =
    detected.length === 0 ? null : Math.round((matchedInProfile.length / detected.length) * 100);

  // Score multidimensional 0-100
  const hardScore =
    detected.length > 0 ? Math.round((matchedInProfile.length / detected.length) * 40) : 30;
  const roleWords = String(role || '')
    .toLowerCase()
    .split(/[\s/|,-]+/)
    .filter((w) => w.length >= 3);
  const roleHits = roleWords.filter((w) => hasWholeKeyword(profileBlob, w)).length;
  const roleScore =
    roleWords.length > 0 ? Math.min(25, Math.round((roleHits / roleWords.length) * 20) + 5) : 18;

  let structureScore = 0;
  if (profile?.personal?.email && profile?.personal?.phone) structureScore += 5;
  if (profile?.personal?.linkedin || profile?.personal?.github) structureScore += 5;
  const sLen = (profile?.summary || '').length;
  if (sLen >= 250 && sLen <= 780) structureScore += 5;
  else if (sLen > 80) structureScore += 2;
  if ((profile?.experiences || []).length > 0 && (profile?.education || []).length > 0) {
    structureScore += 5;
  }

  const contextScore = 13;
  const totalScore = Math.min(100, hardScore + roleScore + structureScore + contextScore);

  return {
    topCategory,
    scores,
    detected,
    highlightTerms: Array.from(new Set([...matchedAliases, ...matchedInProfile])),
    matchedInProfile,
    missingInProfile,
    coveragePercent,
    atsScore: {
      total: totalScore,
      hardSkills: hardScore,
      roleAlignment: roleScore,
      structureHealth: structureScore,
      contextSoft: contextScore,
    },
  };
}

export function renderEmailPreview({ settings, profile, target, tailoredPitch = '' }) {
  const dispatch = settings?.dispatch || {};
  const personal = profile?.personal || {};
  const role = target?.role || 'Técnico de Suporte de TI';
  const company = target?.company || 'Empresa Alvo';
  const name = personal.name || 'Seu Nome';

  const pitch =
    tailoredPitch ||
    `Com relação à vaga de ${role}, trago experiência prática em suporte técnico, gestão de acessos, VPNs/proxies e resolução ágil de incidentes para contribuir desde o primeiro dia com a operação da ${company}.`;

  const subject = (dispatch.subjectTemplate || 'Candidatura para a vaga de {role} - {name}')
    .replace(/{role}/g, role)
    .replace(/{name}/g, name)
    .replace(/{company}/g, company);

  const body = (dispatch.messageTemplate || '')
    .replace(/{role}/g, role)
    .replace(/{name}/g, name)
    .replace(/{company}/g, company)
    .replace(/{tailored_pitch}/g, pitch)
    .replace(/{phone}/g, personal.phone || '')
    .replace(/{email}/g, personal.email || '')
    .replace(/{linkedin}/g, personal.linkedin || '')
    .replace(/{github}/g, personal.github || '');

  return { subject, body };
}

export function buildWhatsAppLink(phone = '', message = '') {
  const digits = String(phone || '').replace(/\D/g, '');
  const base = digits
    ? `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`
    : 'https://wa.me/';
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function exportTargetsToCsv(targets = []) {
  const headers = ['Empresa', 'Cargo', 'Email', 'Telefone', 'Categoria', 'Cidade', 'Salario', 'Status', 'Ultimo_Envio'];
  const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const rows = targets.map((t) =>
    [
      t.company,
      t.role,
      t.email,
      t.phone || '',
      t.category,
      t.city || '',
      t.salary || '',
      t.status,
      t.lastSent || '',
    ]
      .map(escapeCsv)
      .join(';')
  );
  const csvContent = `\uFEFF${[headers.join(';'), ...rows].join('\r\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AutoCV_Vagas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
