import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  FileCheck2,
  Send,
  CalendarClock,
  Award,
  Plus,
  Download,
  ArrowRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  Wand2,
} from 'lucide-react';
import { PILLARS_META, computeLiveAtsRadar } from '../constants/pillars';

export default function DashboardWorkspace({
  profile,
  targets,
  history,
  onNavigate,
  onQuickPasteToTailor,
  onQuickExtractAndSave,
  onGeneratePillarPdf,
  pdfLoading,
}) {
  const [quickAdText, setQuickAdText] = useState('');
  const [extracting, setExtracting] = useState(false);

  const stats = useMemo(() => {
    const pending = targets.filter((t) => t.status === 'pending').length;
    const sent = targets.filter((t) => t.status === 'sent' || t.status === 'followup').length;
    const interviews = targets.filter((t) => t.status === 'interview' || t.status === 'offer').length;
    const simulated = targets.filter((t) => t.status === 'simulated').length;

    // Detecta vagas enviadas há mais de 5 dias ou marcadas como follow-up
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const followUpDue = targets.filter((t) => {
      if (t.status === 'followup') return true;
      if (t.status === 'sent' && t.lastSent) {
        return now - new Date(t.lastSent).getTime() >= fiveDaysMs;
      }
      return false;
    });

    const avgAts =
      targets.length > 0
        ? Math.round(
            targets.reduce(
              (acc, t) =>
                acc +
                computeLiveAtsRadar(t.customJobDescription || t.notes || '', t.role, profile)
                  .atsScore.total,
              0
            ) / targets.length
          )
        : 90;

    return { pending, sent, interviews, simulated, followUpDue, avgAts };
  }, [targets, profile]);

  const handleExtractClick = async () => {
    if (!quickAdText.trim()) return;
    setExtracting(true);
    try {
      await onQuickExtractAndSave(quickAdText);
      setQuickAdText('');
    } finally {
      setExtracting(false);
    }
  };

  const firstName = (profile?.personal?.name || 'Candidato').split(' ')[0];

  return (
    <div className="space-y-4">
      {/* Faixa de Boas-Vindas & Ações Rápidas */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cobalt-50 border border-cobalt-200 text-cobalt-700 text-[11px] font-semibold">
            <span>AutoCV 2.0 · Estúdio ATS & CRM</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-ink-900 tracking-tight">
            Painel de Candidaturas de {firstName}
          </h1>
          <p className="text-xs text-ink-500 max-w-2xl">
            Currículo mestre conectado com 3 templates A4 vetoriais, extração inteligente de anúncios e acompanhamento completo de processos seletivos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-ink-800 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-cobalt-600" />
            Editar Currículo A4
          </button>
          <button
            type="button"
            onClick={() => onNavigate('dispatch')}
            className="px-4 py-2 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Ir para Central de Disparo
          </button>
        </div>
      </div>

      {/* Funil de Seletivas (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('targets')}
          className="text-left bg-white border border-slate-200 hover:border-cobalt-300 rounded-xl p-4 transition-colors"
        >
          <div className="flex items-center justify-between text-ink-500 text-xs font-medium">
            <span>Fila Pendente</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-mono text-2xl font-bold text-ink-900 mt-1.5 tabular-nums">
            {stats.pending}
          </div>
          <div className="text-[11px] text-ink-400 mt-0.5">
            +{stats.simulated} testada(s) em simulação
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('targets')}
          className="text-left bg-white border border-slate-200 hover:border-cobalt-300 rounded-xl p-4 transition-colors"
        >
          <div className="flex items-center justify-between text-ink-500 text-xs font-medium">
            <span>Currículos Enviados</span>
            <Send className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono text-2xl font-bold text-ink-900 mt-1.5 tabular-nums">
            {stats.sent}
          </div>
          <div className="text-[11px] text-ink-400 mt-0.5">
            {history.length} registro(s) totais no log
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('targets')}
          className="text-left bg-white border border-slate-200 hover:border-cobalt-300 rounded-xl p-4 transition-colors"
        >
          <div className="flex items-center justify-between text-ink-500 text-xs font-medium">
            <span>Entrevistas & Propostas</span>
            <Award className="w-4 h-4 text-cobalt-600" />
          </div>
          <div className="font-mono text-2xl font-bold text-cobalt-700 mt-1.5 tabular-nums">
            {stats.interviews}
          </div>
          <div className="text-[11px] text-ink-400 mt-0.5">
            Pipeline ativo no quadro CRM
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('tailor')}
          className="text-left bg-white border border-slate-200 hover:border-cobalt-300 rounded-xl p-4 transition-colors"
        >
          <div className="flex items-center justify-between text-ink-500 text-xs font-medium">
            <span>Score ATS Médio</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-700 mt-1.5 tabular-nums">
            {stats.avgAts}/100
          </div>
          <div className="text-[11px] text-ink-400 mt-0.5">
            Aderência média às suas vagas
          </div>
        </button>
      </div>

      {/* Área Principal: Captura Rápida de Anúncio + Exportação 1-Clique por Pilar */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Captura Instantânea de Anúncio (WhatsApp / LinkedIn / Gupy) */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-cobalt-600" />
                Captura Rápida de Vaga (LinkedIn, Gupy ou WhatsApp)
              </h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Cole qualquer texto de vaga abaixo: o AutoCV 2.0 extrai automaticamente empresa, cargo, e-mail, WhatsApp, salário e adapta seu currículo na hora.
              </p>
            </div>
          </div>

          <textarea
            rows={5}
            value={quickAdText}
            onChange={(e) => setQuickAdText(e.target.value)}
            placeholder={`Exemplo: Vaga Técnico de Suporte N1 - Empresa CloudSP - Barueri (Híbrido). Requisitos: Active Directory, Office 365, VPN e atendimento a chamados. Enviar CV para rh@cloudsp.com.br ou WhatsApp (11) 99999-0000.`}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-ink-900 font-mono leading-relaxed focus:bg-white focus:outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!quickAdText.trim()}
              onClick={() => {
                onQuickPasteToTailor(quickAdText);
                setQuickAdText('');
              }}
              className="px-4 py-2 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 disabled:opacity-45 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Especializar Currículo & Carta no Estúdio
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={!quickAdText.trim() || extracting}
              onClick={handleExtractClick}
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-45 text-ink-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-cobalt-600" />
              {extracting ? 'Extraindo...' : 'Extrair Dados & Cadastrar no CRM'}
            </button>
          </div>
        </div>

        {/* Download Rápido de PDF por Pilar */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink-900">
              Baixar Currículo Pronto por Área (1 Clique)
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">
              Precisa enviar um PDF imediatamente em um portal ou WhatsApp? Gere a versão focada em cada um dos seus 4 pilares:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PILLARS_META.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  disabled={pdfLoading}
                  onClick={() => onGeneratePillarPdf(pillar.id)}
                  className="p-3 rounded-lg border border-slate-200 hover:border-cobalt-400 hover:bg-cobalt-50/40 text-left transition-all flex items-start justify-between gap-2 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-ink-900">
                      <Icon className="w-3.5 h-3.5 text-cobalt-600 flex-shrink-0" />
                      <span className="truncate">{pillar.label}</span>
                    </div>
                    <div className="text-[11px] text-ink-500 truncate mt-0.5">{pillar.desc}</div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-ink-400 group-hover:text-cobalt-600 flex-shrink-0 mt-0.5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Radar de Follow-up + Últimas Atividades */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4 text-violet-600" />
              Radar de Retorno & Follow-up
            </h3>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-violet-50 text-violet-800 border border-violet-200">
              {stats.followUpDue.length} pendente(s)
            </span>
          </div>

          {stats.followUpDue.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.followUpDue.slice(0, 4).map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-ink-900 truncate">{t.company}</div>
                    <div className="text-[11px] text-ink-500 truncate">{t.role}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('targets')}
                    className="px-2.5 py-1 rounded border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-800 text-[11px] font-semibold flex-shrink-0"
                  >
                    Gerar Follow-up
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-ink-500">
              Nenhuma candidatura aguardando follow-up vencido (+5 dias sem resposta). Assim que enviar novos currículos, o lembrete aparecerá aqui automaticamente.
            </div>
          )}
        </div>

        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900">Últimos Currículos Gerados & Disparos</h3>
            <button
              type="button"
              onClick={() => onNavigate('dispatch')}
              className="text-xs font-semibold text-cobalt-600 hover:text-cobalt-700"
            >
              Ver histórico completo
            </button>
          </div>

          {history.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {history.slice(0, 4).map((h) => (
                <div key={h.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2
                      className={`w-4 h-4 flex-shrink-0 ${
                        h.status === 'error' ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-ink-900">{h.company}</span>
                      <span className="text-ink-400 mx-1.5">·</span>
                      <span className="text-ink-600 truncate">{h.role}</span>
                      {h.simulated && (
                        <span className="ml-2 px-1.5 py-0.2 rounded bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-semibold">
                          Simulado
                        </span>
                      )}
                    </div>
                  </div>
                  {h.pdfFileName && (
                    <a
                      href={`/output/${h.pdfFileName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-cobalt-600 hover:text-cobalt-700 inline-flex items-center gap-1 flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                      PDF
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-ink-500">
              Nenhum disparo registrado ainda nesta instância.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
