import React, { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  Square,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Mail,
  FileText,
  CheckSquare,
  Square as SquareIcon,
  ExternalLink,
  Ban,
} from 'lucide-react';
import { STATUS_META, PITCH_TONES, renderEmailPreview } from '../constants/pillars';

export default function DispatchWorkspace({
  targets,
  profile,
  settings,
  history,
  batchRunning,
  batchPaused,
  batchProgress,
  liveEvents,
  delayCountdown,
  simulationOverride,
  setSimulationOverride,
  queuedTargetIds,
  setQueuedTargetIds,
  onStartBatch,
  onPauseBatch,
  onResumeBatch,
  onStopBatch,
  onClearHistory,
}) {
  const [inspectTargetId, setInspectTargetId] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);
  const [batchPitchTone, setBatchPitchTone] = useState(
    settings.dispatch?.defaultPitchTone || 'direto'
  );
  const [attachCoverInBatch, setAttachCoverInBatch] = useState(
    Boolean(settings.dispatch?.attachCoverLetter)
  );
  const [allowResend, setAllowResend] = useState(false);

  const alreadySentEmails = useMemo(() => {
    return new Set(
      history
        .filter((h) => h.status === 'success' && !h.simulated && h.email)
        .map((h) => String(h.email).toLowerCase())
    );
  }, [history]);

  const toggleQueueId = (id) => {
    setQueuedTargetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectPreset = (mode) => {
    if (mode === 'pending') {
      setQueuedTargetIds(targets.filter((t) => t.status === 'pending').map((t) => t.id));
    } else if (mode === 'pending_sim') {
      setQueuedTargetIds(
        targets
          .filter((t) => t.status === 'pending' || t.status === 'simulated')
          .map((t) => t.id)
      );
    } else if (mode === 'all') {
      setQueuedTargetIds(targets.filter((t) => Boolean(t.email)).map((t) => t.id));
    } else {
      setQueuedTargetIds([]);
    }
  };

  const inspectedTarget = useMemo(() => {
    return (
      targets.find((t) => t.id === inspectTargetId) ||
      targets.find((t) => queuedTargetIds.includes(t.id)) ||
      targets[0] ||
      null
    );
  }, [inspectTargetId, targets, queuedTargetIds]);

  const emailPreview = useMemo(() => {
    if (!inspectedTarget) return null;
    return renderEmailPreview({ settings, profile, target: inspectedTarget });
  }, [inspectedTarget, settings, profile]);

  const filteredHistory = history.filter((log) => {
    if (historyFilter === 'real') return log.status === 'success' && !log.simulated;
    if (historyFilter === 'simulated') return log.simulated;
    if (historyFilter === 'error') return log.status === 'error' || log.status === 'skipped';
    return true;
  });

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (batchProgress.percent / 100) * circumference;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Coluna Esquerda: Fila Interativa + Controles 2.0 */}
        <div className="xl:col-span-6 bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink-900">Central de Disparo 2.0</h2>
              <p className="text-xs text-ink-500">
                Gera um PDF especializado por empresa, aplica trava anti-duplicidade e permite pausar/retomar a fila a qualquer momento.
              </p>
            </div>
            <span className="font-mono text-xs font-bold bg-cobalt-50 text-cobalt-700 border border-cobalt-200 px-2.5 py-1 rounded-md tabular-nums whitespace-nowrap flex-shrink-0">
              {queuedTargetIds.length} na fila
            </span>
          </div>

          {/* Atalhos de Seleção */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => selectPreset('pending')}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-ink-700"
            >
              Pendentes ({targets.filter((t) => t.status === 'pending').length})
            </button>
            <button
              type="button"
              onClick={() => selectPreset('pending_sim')}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-ink-700"
            >
              Pendentes + Simuladas
            </button>
            <button
              type="button"
              onClick={() => selectPreset('all')}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-ink-700"
            >
              Todas com e-mail ({targets.filter((t) => Boolean(t.email)).length})
            </button>
            <button
              type="button"
              onClick={() => selectPreset('none')}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-ink-500"
            >
              Limpar
            </button>
          </div>

          {/* Lista da Fila */}
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {targets.map((t) => {
              const checked = queuedTargetIds.includes(t.id);
              const inspecting = inspectedTarget?.id === t.id;
              const st = STATUS_META[t.status] || STATUS_META.pending;
              const wasSentReal = alreadySentEmails.has(String(t.email || '').toLowerCase());

              return (
                <div
                  key={t.id}
                  onClick={() => setInspectTargetId(t.id)}
                  className={`flex items-center justify-between gap-2 px-3 py-2.5 text-xs cursor-pointer transition-colors ${
                    inspecting ? 'bg-cobalt-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleQueueId(t.id);
                      }}
                      className="text-ink-400 hover:text-cobalt-600 flex-shrink-0"
                    >
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-cobalt-600" />
                      ) : (
                        <SquareIcon className="w-4 h-4" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="font-semibold text-ink-900 truncate flex items-center gap-1.5">
                        <span>{t.company}</span>
                        {wasSentReal && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Já enviado
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-ink-500 truncate">
                        {t.role} · <span className="font-mono">{t.email || 'sem e-mail'}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] font-semibold flex-shrink-0 ${st.badge}`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
            {targets.length === 0 && (
              <div className="p-6 text-center text-xs text-ink-400">
                Nenhuma empresa cadastrada no CRM.
              </div>
            )}
          </div>

          {/* Opções de Personalização do Lote */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div>
              <label className="block text-[11px] font-semibold text-ink-700 mb-1">
                Tom do Pitch no E-mail
              </label>
              <select
                value={batchPitchTone}
                onChange={(e) => setBatchPitchTone(e.target.value)}
                disabled={batchRunning}
                className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-ink-900"
              >
                {PITCH_TONES.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-center gap-1.5 pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer text-[11px] font-medium text-ink-700">
                <input
                  type="checkbox"
                  checked={attachCoverInBatch}
                  onChange={(e) => setAttachCoverInBatch(e.target.checked)}
                  disabled={batchRunning}
                  className="rounded border-slate-300 text-cobalt-600"
                />
                Anexar Carta de Apresentação PDF extra
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer text-[11px] font-medium text-ink-700">
                <input
                  type="checkbox"
                  checked={allowResend}
                  onChange={(e) => setAllowResend(e.target.checked)}
                  disabled={batchRunning}
                  className="rounded border-slate-300 text-cobalt-600"
                />
                Permitir reenvio para e-mails já enviados
              </label>
            </div>
          </div>

          {/* Chave de Segurança: Simulação vs Envio Real */}
          <div
            onClick={() => !batchRunning && setSimulationOverride(!simulationOverride)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-colors flex items-start gap-3 ${
              simulationOverride
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <input
              type="checkbox"
              checked={simulationOverride}
              onChange={(e) => setSimulationOverride(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              disabled={batchRunning}
              className="mt-0.5 rounded border-slate-300 text-cobalt-600 focus:ring-0"
            />
            <div className="text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {simulationOverride
                    ? 'Modo Simulação Ativo (100% seguro · não dispara SMTP)'
                    : 'Modo Real Ativo — enviará e-mails reais ao RH'}
                </span>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                {simulationOverride
                  ? 'Gera todos os PDFs sob medida em /output e valida os e-mails em poucos segundos.'
                  : `Cadência anti-spam humanizada (${settings.dispatch?.delaySecondsMin || 30}s a ${
                      settings.dispatch?.delaySecondsMax || 60
                    }s) + formato ${settings.dispatch?.htmlFormat !== false ? 'HTML Pessoal' : 'Texto Puro'}.`}
              </p>
            </div>
          </div>

          {/* Botões de Controle: Iniciar / Pausar / Retomar / Parar */}
          {!batchRunning ? (
            <button
              type="button"
              onClick={() =>
                onStartBatch({
                  targetIds: queuedTargetIds,
                  pitchTone: batchPitchTone,
                  attachCoverLetter: attachCoverInBatch,
                  allowResend,
                })
              }
              disabled={queuedTargetIds.length === 0}
              className="w-full py-3 rounded-xl bg-cobalt-600 hover:bg-cobalt-700 disabled:bg-slate-200 disabled:text-ink-400 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {simulationOverride ? 'Simular Lote' : 'Disparar Lote Real'} ({queuedTargetIds.length}{' '}
                {queuedTargetIds.length === 1 ? 'vaga' : 'vagas'})
              </span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {batchPaused ? (
                <button
                  type="button"
                  onClick={onResumeBatch}
                  className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Retomar Fila
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPauseBatch}
                  className="py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Pausar Fila
                </button>
              )}
              <button
                type="button"
                onClick={onStopBatch}
                className="py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4 fill-current" />
                Cancelar Lote
              </button>
            </div>
          )}
        </div>

        {/* Coluna Direita: Telemetria SSE + Console ao Vivo + Prévia do E-mail */}
        <div className="xl:col-span-6 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink-900">Telemetria em Tempo Real</h3>
                <p className="text-xs text-ink-500">
                  {batchRunning
                    ? batchPaused
                      ? 'Fila pausada pelo usuário'
                      : 'Processando lote via Server-Sent Events'
                    : 'Aguardando início'}
                </p>
              </div>
              <span className="font-mono text-xs text-ink-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {settings.dispatch?.delaySecondsMin || 30}–{settings.dispatch?.delaySecondsMax || 60}s
              </span>
            </div>

            {batchRunning ? (
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-20 h-20 -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      stroke="#E2E8F0"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      stroke={batchPaused ? '#D97706' : '#1D4ED8'}
                      strokeWidth="6"
                      strokeLinecap="round"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <span className="absolute font-mono text-sm font-bold text-ink-900 tabular-nums">
                    {batchProgress.percent}%
                  </span>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="text-xs font-bold text-ink-900 truncate">
                    {batchPaused ? 'PAUSADO — clique em Retomar Fila' : batchProgress.statusText}
                  </div>
                  <div className="text-[11px] font-mono text-ink-500 tabular-nums">
                    Progresso: {batchProgress.current} de {batchProgress.total}
                  </div>
                  {delayCountdown > 0 && !batchPaused && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 text-amber-900 text-[11px] font-mono font-semibold tabular-nums">
                      <Clock className="w-3 h-3" />
                      Intervalo anti-spam: {delayCountdown}s
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-ink-500 flex items-center justify-between">
                <span>Clique em uma empresa na fila à esquerda para inspecionar o e-mail exato.</span>
                <span className="font-mono text-ink-700 font-semibold tabular-nums">
                  {history.length} logs
                </span>
              </div>
            )}

            {liveEvents.length > 0 && (
              <div className="rounded-lg bg-ink-950 text-slate-200 p-2.5 font-mono text-[11px] max-h-28 overflow-y-auto space-y-1">
                {liveEvents.slice(0, 8).map((ev, i) => (
                  <div key={i} className="truncate">
                    <span className="text-slate-500 mr-2">[{ev.time}]</span>
                    <span>{ev.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inspetor Pré-Envio */}
          {inspectedTarget && emailPreview && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex-1 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-ink-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cobalt-600" />
                  Inspeção Pré-Disparo: {inspectedTarget.company}
                </h3>
                <span className="text-[11px] font-mono text-ink-500 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {attachCoverInBatch ? 'CV + Carta PDF' : 'CV PDF anexo'}
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden text-xs">
                <div className="px-3 py-2 border-b border-slate-200 bg-white space-y-0.5">
                  <div>
                    <span className="text-ink-400">Para: </span>
                    <span className="font-mono text-ink-800">{inspectedTarget.email || '—'}</span>
                  </div>
                  <div>
                    <span className="text-ink-400">Assunto: </span>
                    <span className="font-semibold text-ink-900">{emailPreview.subject}</span>
                  </div>
                </div>
                <pre className="p-3 text-[11px] text-ink-700 whitespace-pre-wrap font-sans leading-relaxed max-h-52 overflow-y-auto">
                  {emailPreview.body}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Histórico Auditável de Disparos */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-ink-900">Histórico Auditável de Envios</h3>
            <div className="flex items-center gap-1 bg-well p-1 rounded-lg text-[11px]">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'real', label: 'Reais' },
                { id: 'simulated', label: 'Simulados' },
                { id: 'error', label: 'Falhas / Bloq.' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setHistoryFilter(f.id)}
                  className={`px-2 py-0.5 rounded font-medium ${
                    historyFilter === f.id
                      ? 'bg-white text-ink-900 shadow-sm'
                      : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div>
              {confirmClear ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-ink-600">Limpar histórico?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearHistory();
                      setConfirmClear(false);
                    }}
                    className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-1 rounded border border-slate-200 text-ink-600"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-xs font-medium text-ink-500 hover:text-rose-600 inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar histórico
                </button>
              )}
            </div>
          )}
        </div>

        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {filteredHistory.map((log) => (
            <div
              key={log.id}
              className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {log.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : log.status === 'skipped' ? (
                  <Ban className="w-4 h-4 text-amber-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-ink-900 flex items-center gap-2 flex-wrap">
                    <span>{log.company}</span>
                    <span className="font-mono text-[11px] font-normal text-ink-500">
                      {log.email}
                    </span>
                    {log.simulated && (
                      <span className="px-1.5 py-0.2 rounded bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-semibold">
                        Simulado
                      </span>
                    )}
                    {log.atsScore && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-semibold">
                        ATS {log.atsScore}%
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-500 truncate">
                    {log.role} —{' '}
                    {log.error ? (
                      <span className="text-rose-600">{log.error}</span>
                    ) : (
                      log.subject
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {log.pdfFileName && (
                  <a
                    href={`/output/${log.pdfFileName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-cobalt-600 hover:text-cobalt-700 inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Currículo
                  </a>
                )}
                {log.coverFileName && (
                  <a
                    href={`/output/${log.coverFileName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-ink-700 hover:text-ink-900 inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Carta
                  </a>
                )}
                <span className="font-mono text-[11px] text-ink-400 tabular-nums">
                  {new Date(log.timestamp).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
          {filteredHistory.length === 0 && (
            <div className="py-8 text-center text-xs text-ink-400">
              Nenhum registro para este filtro.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
