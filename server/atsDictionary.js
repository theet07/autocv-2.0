/**
 * server/atsDictionary.js
 * Léxico curado para o mercado de trabalho brasileiro (Suporte TI, Redes, Administrativo e Desenvolvimento/Análise).
 * Inclui sinônimos normalizados para evitar falsos negativos (ex: "AD" <-> "Active Directory", "O365" <-> "Office 365")
 * e verificação estrita por fronteira de palavra Unicode para eliminar falsos positivos.
 */

export const ATS_LEXICON = {
  suporte: [
    { canonical: 'Suporte Técnico', aliases: ['suporte técnico', 'suporte tecnico', 'suporte de ti', 'suporte ti', 'técnico de informática', 'tecnico de informatica', 'auxiliar de ti', 'assistente de ti'] },
    { canonical: 'Help Desk', aliases: ['helpdesk', 'help desk', 'service desk', 'servicedesk'] },
    { canonical: 'Atendimento N1/N2', aliases: ['n1', 'n2', 'nível 1', 'nivel 1', 'nível 2', 'nivel 2', '1º nível', '2º nível', 'atendimento ao usuário', 'atendimento a usuarios', 'suporte ao usuário'] },
    { canonical: 'Gestão de Chamados', aliases: ['chamados', 'tickets', 'incidentes', 'requisições', 'fila de chamados', 'triagem de chamados'] },
    { canonical: 'ITSM (GLPI / Jira / Zendesk)', aliases: ['glpi', 'jira', 'zendesk', 'freshdesk', 'movidesk', 'otrs', 'servicenow', 'milvus', 'tomticket'] },
    { canonical: 'Active Directory', aliases: ['active directory', 'ad', 'azure ad', 'entra id', 'gpo', 'domínio windows', 'controlador de domínio'] },
    { canonical: 'Gestão de Acessos', aliases: ['gestão de acessos', 'gestao de acessos', 'controle de acesso', 'reset de senha', 'contas corporativas', 'provisionamento', 'onboarding de ti', 'bloqueio de contas'] },
    { canonical: 'Windows 10/11', aliases: ['windows', 'windows 10', 'windows 11', 'windows server', 'formatação', 'formatacao', 'imagem de sistema'] },
    { canonical: 'Linux', aliases: ['linux', 'ubuntu', 'debian', 'centos'] },
    { canonical: 'Microsoft 365', aliases: ['office 365', 'microsoft 365', 'o365', 'm365', 'outlook', 'teams', 'onedrive', 'sharepoint', 'pacote office'] },
    { canonical: 'Manutenção de Hardware', aliases: ['hardware', 'manutenção de computadores', 'manutenção preventiva', 'manutenção corretiva', 'notebooks', 'desktops', 'montagem e manutenção', 'upgrade', 'ssd', 'memória ram'] },
    { canonical: 'Impressoras & Periféricos', aliases: ['impressoras', 'impressora', 'periféricos', 'perifericos', 'toner', 'scanner', 'dispositivos móveis', 'coletores'] },
    { canonical: 'Acesso Remoto', aliases: ['acesso remoto', 'anydesk', 'teamviewer', 'rdp', 'área de trabalho remota', 'suporte remoto', 'suporte presencial'] },
    { canonical: 'Backup & Antivírus', aliases: ['backup', 'antivírus', 'antivirus', 'endpoint', 'bitlocker', 'segurança da informação', 'kaspersky', 'defender'] },
    { canonical: 'Ambientes Virtuais', aliases: ['ambientes virtuais', 'máquinas virtuais', 'virtualização', 'vmware', 'hyper-v', 'virtualbox'] }
  ],
  redes: [
    { canonical: 'Redes de Computadores', aliases: ['redes', 'rede local', 'lan', 'wan', 'wlan', 'infraestrutura de ti', 'infraestrutura de redes', 'conectividade'] },
    { canonical: 'TCP/IP', aliases: ['tcp/ip', 'tcp', 'udp', 'endereçamento ip', 'sub-rede', 'ipv4', 'ipv6'] },
    { canonical: 'DNS & DHCP', aliases: ['dns', 'dhcp', 'nat', 'gateway'] },
    { canonical: 'VPN & Proxy', aliases: ['vpn', 'vpns', 'proxy', 'proxies', 'openvpn', 'wireguard', 'forticlient', 'acesso seguro'] },
    { canonical: 'Roteadores & Switches', aliases: ['roteador', 'roteadores', 'switch', 'switches', 'access point', 'unifi', 'ubiquiti', 'tp-link'] },
    { canonical: 'Wi-Fi Corporativo', aliases: ['wi-fi', 'wifi', 'rede sem fio', 'wireless'] },
    { canonical: 'Cabeamento Estruturado', aliases: ['cabeamento', 'cabeamento estruturado', 'cat5e', 'cat6', 'patch panel', 'rj45', 'crimpagem', 'crimpage', 'pontos de rede'] },
    { canonical: 'Rack & Data Center', aliases: ['rack', 'racks', 'organização de rack', 'servidor', 'servidores', 'nobreak', 'ups'] },
    { canonical: 'VLAN & Firewall', aliases: ['vlan', 'vlans', 'firewall', 'fortigate', 'pfsense', 'mikrotik', 'cisco', 'segurança de rede'] },
    { canonical: 'Diagnóstico de Rede', aliases: ['ping', 'tracert', 'traceroute', 'latência', 'perda de pacotes', 'monitoramento de rede', 'zabbix', 'grafana', 'prtg', 'links de internet', 'telecom', 'voip', 'pabx'] }
  ],
  administrativo: [
    { canonical: 'Rotinas Administrativas', aliases: ['rotinas administrativas', 'administrativo', 'administração', 'apoio administrativo', 'auxiliar administrativo', 'assistente administrativo', 'backoffice', 'back office'] },
    { canonical: 'Microsoft Excel', aliases: ['excel', 'planilhas', 'planilha', 'procv', 'procx', 'tabela dinâmica', 'tabelas dinâmicas', 'google sheets'] },
    { canonical: 'Relatórios & Indicadores', aliases: ['relatórios', 'relatorios', 'indicadores', 'kpi', 'kpis', 'produtividade', 'monitoramento de produtividade', 'dashboards'] },
    { canonical: 'Controle de Inventário & Ativos', aliases: ['inventário', 'inventario', 'controle de estoque', 'estoque', 'patrimônio', 'ativos de ti', 'controle de ativos', 'almoxarifado'] },
    { canonical: 'Documentação & Arquivo', aliases: ['documentação', 'documentacao', 'organização de documentos', 'arquivo', 'procedimentos', 'pop', 'manuais', 'cadastros', 'atualização cadastral'] },
    { canonical: 'Faturamento & Notas Fiscais', aliases: ['nota fiscal', 'notas fiscais', 'nf-e', 'faturamento', 'compras', 'fornecedores', 'cotações', 'contas a pagar', 'contas a receber', 'financeiro'] },
    { canonical: 'Sistemas ERP', aliases: ['erp', 'totvs', 'protheus', 'sap', 'omie', 'bling', 'sankhya', 'sistema interno', 'sistemas corporativos'] },
    { canonical: 'Atendimento Corporativo', aliases: ['atendimento telefônico', 'recepção', 'comunicação escrita', 'atendimento ao cliente', 'relacionamento', 'e-mails corporativos', 'agendamento'] }
  ],
  analista: [
    { canonical: 'Análise de Sistemas & Processos', aliases: ['analista', 'análise de sistemas', 'analise de sistemas', 'processos', 'mapeamento de processos', 'melhoria contínua', 'otimização de processos'] },
    { canonical: 'Gestão de SLA & ITIL', aliases: ['sla', 'slas', 'itil', 'governança', 'qualidade', 'auditoria', 'lgpd', 'rastreabilidade', 'integridade de dados'] },
    { canonical: 'Banco de Dados & SQL', aliases: ['banco de dados', 'bancos de dados', 'sql', 'mysql', 'sql server', 'postgresql', 'postgres', 'queries', 'consultas sql', 'modelagem de dados'] },
    { canonical: 'JavaScript & TypeScript', aliases: ['javascript', 'typescript', 'js', 'ts', 'es6'] },
    { canonical: 'React & Frontend', aliases: ['react', 'reactjs', 'next.js', 'nextjs', 'html', 'css', 'tailwind', 'frontend', 'front-end', 'ui/ux'] },
    { canonical: 'Node.js & Backend', aliases: ['node.js', 'nodejs', 'node', 'express', 'java', 'spring boot', 'python', 'backend', 'back-end', 'fullstack', 'full stack'] },
    { canonical: 'APIs REST & Integrações', aliases: ['api', 'apis', 'rest', 'restful', 'json', 'webhook', 'integração de sistemas', 'homologação', 'implantação'] },
    { canonical: 'Git & Versionamento', aliases: ['git', 'github', 'gitlab', 'versionamento', 'deploy'] },
    { canonical: 'Automação & IA', aliases: ['automação', 'automacoes', 'inteligência artificial', 'ia', 'scripts', 'powershell', 'power bi'] }
  ]
};

export const SOFT_SKILLS_LEXICON = [
  { canonical: 'Proatividade', aliases: ['proativo', 'proatividade', 'iniciativa', 'autonomia'] },
  { canonical: 'Comunicação Clara', aliases: ['comunicação', 'comunicativo', 'boa comunicação', 'cordialidade', 'empatia'] },
  { canonical: 'Resolução de Problemas', aliases: ['resolução de problemas', 'solução de problemas', 'raciocínio lógico', 'analítico', 'diagnóstico rápido'] },
  { canonical: 'Trabalho em Equipe', aliases: ['trabalho em equipe', 'colaboração', 'espírito de equipe', 'relacionamento interpessoal'] },
  { canonical: 'Organização & Atenção a Detalhes', aliases: ['organização', 'organizado', 'atenção aos detalhes', 'pontualidade', 'disciplina', 'comprometimento'] },
  { canonical: 'Aprendizado Rápido', aliases: ['aprendizado rápido', 'vontade de aprender', 'fácil aprendizado', 'adaptabilidade'] }
];

/**
 * Testa se `term` ocorre como palavra/expressão inteira em `text`, respeitando acentuação Unicode.
 */
export function hasWholeTerm(text = '', term = '') {
  if (!text || !term) return false;
  const escaped = term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!escaped) return false;
  const regex = new RegExp(`(?<![a-zA-ZÀ-ÿ0-9])${escaped}(?![a-zA-ZÀ-ÿ0-9])`, 'i');
  return regex.test(text);
}

/**
 * Detecta modalidade e nível de senioridade a partir do texto da vaga.
 */
export function detectJobMetadata(text = '', role = '') {
  const combined = `${role} ${text}`.toLowerCase();

  let modality = '';
  if (hasWholeTerm(combined, 'remoto') || hasWholeTerm(combined, 'home office') || hasWholeTerm(combined, '100% remoto')) {
    modality = 'Remoto';
  } else if (hasWholeTerm(combined, 'híbrido') || hasWholeTerm(combined, 'hibrido')) {
    modality = 'Híbrido';
  } else if (hasWholeTerm(combined, 'presencial')) {
    modality = 'Presencial';
  }

  let seniority = 'Profissional';
  if (hasWholeTerm(combined, 'estágio') || hasWholeTerm(combined, 'estagio') || hasWholeTerm(combined, 'estagiário') || hasWholeTerm(combined, 'estagiario')) {
    seniority = 'Estágio';
  } else if (hasWholeTerm(combined, 'jovem aprendiz') || hasWholeTerm(combined, 'aprendiz')) {
    seniority = 'Jovem Aprendiz';
  } else if (hasWholeTerm(combined, 'júnior') || hasWholeTerm(combined, 'junior') || hasWholeTerm(combined, 'jr')) {
    seniority = 'Júnior';
  } else if (hasWholeTerm(combined, 'assistente') || hasWholeTerm(combined, 'auxiliar')) {
    seniority = 'Assistente / Auxiliar';
  } else if (hasWholeTerm(combined, 'pleno') || hasWholeTerm(combined, 'n2')) {
    seniority = 'Pleno / N2';
  }

  return { modality, seniority };
}
