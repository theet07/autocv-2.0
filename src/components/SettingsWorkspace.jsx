import React, { useState, useRef, useEffect } from 'react';
import {
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Clock,
  Mail,
  Send,
  Download,
  Upload,
  Cpu,
} from 'lucide-react';
import { renderEmailPreview } from '../constants/pillars';

const TEMPLATE_VARS = [
  { token: '{company}', label: 'Empresa' },
  { token: '{role}', label: 'Cargo' },
  { token: '{name}', label: 'Seu Nome' },
  { token: '{tailored_pitch}', label: 'Pitch ATS' },
  { token: '{phone}', label: 'Telefone' },
  { token: '{email}', label: 'E-mail' },
  { token: '{linkedin}', label: 'LinkedIn' },
  { token: '{github}', label: 'GitHub' },
];

export default function SettingsWorkspace({
  settings,
  setSettings,
  profile,
  targets,
  onSaveSettings,
  onTestSmtp,
  testingEmail,
  emailTestResult,
  onReloadAllData,
  showToast,
}) {
  const [showPass, setShowPass] = useState(false);
  const [showGmailHelp, setShowGmailHelp] = useState(false);
  const [previewTargetId, setPreviewTargetId] = useState(targets[0]?.id || '');
  const [sendingSelfTest, setSendingSelfTest] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const bodyRef = useRef(null);
  const restoreInputRef = useRef(null);

  useEffect(() => {
    fetch('/api/ai/status')
      .then((r) => r.json())
      .then(setAiStatus)
      .catch(() => setAiStatus({ available: false, models: [] }));
  }, []);

  const previewTarget =
    targets.find((t) => t.id === previewTargetId) ||
    targets[0] || {
      company: 'TechSupport Soluções',
      role: 'Técnico de Suporte N1',
    };

  const renderedPreview = renderEmailPreview({
    settings,
    profile,
    target: previewTarget,
  });

  const insertVariableAtCursor = (token) => {
    const el = bodyRef.current;
    const current = settings.dispatch?.messageTemplate || '';
    if (!el) {
      setSettings({
        ...settings,
        dispatch: { ...settings.dispatch, messageTemplate: `${current} ${token}` },
      });
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    setSettings({
      ...settings,
      dispatch: { ...settings.dispatch, messageTemplate: next },
    });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const handleSendTestToSelf = async () => {
    setSendingSelfTest(true);
    try {
      const res = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
      } else {
        showToast(data.error || 'Falha ao enviar e-mail de teste.', 'error');
      }
    } catch {
      showToast('Erro de comunicação com o servidor.', 'error');
    } finally {
      setSendingSelfTest(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const data = await fetch('/api/backup/export').then((r) => r.json());
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AutoCV_2.0_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup completo exportado (sem expor sua senha SMTP).');
    } catch {
      showToast('Falha ao exportar backup.', 'error');
    }
  };

  const handleRestoreBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      if (res.ok) {
        await onReloadAllData();
        showToast('Backup restaurado com sucesso!');
      }
    } catch {
      showToast('Arquivo de backup inválido.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const inputCls =
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      {/* Coluna Esquerda: SMTP, Auto-Teste, Anti-Spam & Backup */}
      <div className="xl:col-span-6 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-ink-900">Conta de Envio SMTP</h2>
              <p className="text-xs text-ink-500">
                Armazenada localmente em <code className="font-mono text-ink-700">data/settings.json</code>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSaveSettings(settings)}
              className="px-3.5 py-2 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Configurações
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Provedor</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gmail', label: 'Gmail' },
                { id: 'outlook', label: 'Outlook / 365' },
                { id: 'custom', label: 'SMTP Próprio' },
              ].map((prov) => {
                const active = settings.email?.provider === prov.id;
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, provider: prov.id },
                      })
                    }
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-cobalt-50 border-cobalt-600 text-cobalt-700'
                        : 'bg-white border-slate-200 text-ink-600 hover:bg-slate-50'
                    }`}
                  >
                    {prov.label}
                  </button>
                );
              })}
            </div>
          </div>

          {settings.email?.provider === 'gmail' && (
            <div className="rounded-lg border border-cobalt-200 bg-cobalt-50/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowGmailHelp((v) => !v)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-cobalt-800"
              >
                <span>Como gerar a Senha de Aplicativo (16 letras) no Google</span>
                {showGmailHelp ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {showGmailHelp && (
                <ol className="px-4 pb-3 list-decimal list-inside space-y-1 text-[11px] text-ink-700 leading-relaxed">
                  <li>Acesse sua Conta Google → Segurança e ative a Verificação em duas etapas.</li>
                  <li>Pesquise por &quot;Senhas de app&quot; no topo da tela.</li>
                  <li>
                    Crie uma senha chamada <strong>AutoCV 2.0</strong> e cole as 16 letras abaixo (espaços são removidos automaticamente).
                  </li>
                </ol>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">E-mail remetente</label>
              <input
                type="email"
                value={settings.email?.user || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    email: { ...settings.email, user: e.target.value },
                  })
                }
                placeholder="voce@gmail.com"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">
                {settings.email?.provider === 'gmail' ? 'Senha de aplicativo' : 'Senha SMTP'}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={settings.email?.pass || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, pass: e.target.value },
                    })
                  }
                  placeholder="••••••••••••••••"
                  className={`${inputCls} font-mono pr-9`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2.5 top-2 text-ink-400 hover:text-ink-700"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-ink-700 mb-1">
                Nome exibido para o recrutador
              </label>
              <input
                type="text"
                value={settings.email?.fromName || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    email: { ...settings.email, fromName: e.target.value },
                  })
                }
                className={inputCls}
              />
            </div>

            {settings.email?.provider === 'custom' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Servidor SMTP</label>
                  <input
                    type="text"
                    value={settings.email?.smtpHost || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, smtpHost: e.target.value },
                      })
                    }
                    placeholder="smtp.seudominio.com"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Porta</label>
                  <input
                    type="number"
                    value={settings.email?.smtpPort || 587}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, smtpPort: Number(e.target.value) },
                      })
                    }
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-1 text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer text-ink-700 font-medium">
              <input
                type="checkbox"
                checked={settings.dispatch?.htmlFormat !== false}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    dispatch: { ...settings.dispatch, htmlFormat: e.target.checked },
                  })
                }
                className="rounded border-slate-300 text-cobalt-600"
              />
              Enviar em HTML Pessoal limpo + links clicáveis
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer text-ink-700 font-medium">
              <input
                type="checkbox"
                checked={settings.dispatch?.preventDuplicateSends !== false}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    dispatch: { ...settings.dispatch, preventDuplicateSends: e.target.checked },
                  })
                }
                className="rounded border-slate-300 text-cobalt-600"
              />
              Bloquear envios repetidos para o mesmo RH
            </label>
          </div>

          {/* Botões de Teste SMTP e Auto-Envio para o próprio E-mail */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onTestSmtp}
              disabled={testingEmail || !settings.email?.user || !settings.email?.pass}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-ink-800 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingEmail ? 'animate-spin' : ''}`} />
              <span>{testingEmail ? 'Autenticando...' : 'Testar Conexão SMTP'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendTestToSelf}
              disabled={sendingSelfTest || !settings.email?.user || !settings.email?.pass}
              className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {sendingSelfTest ? 'Enviando...' : 'Enviar E-mail de Teste para Mim (com PDF)'}
              </span>
            </button>

            {emailTestResult && (
              <span
                className={`text-xs font-medium inline-flex items-center gap-1.5 w-full pt-1 ${
                  emailTestResult.success ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {emailTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {emailTestResult.message || emailTestResult.error}
              </span>
            )}
          </div>
        </div>

        {/* Cadência Anti-Spam */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cobalt-600" />
              Intervalo Anti-Spam (Modo Real)
            </h3>
            <span className="font-mono text-xs font-semibold text-cobalt-700 tabular-nums">
              {settings.dispatch?.delaySecondsMin || 30}s – {settings.dispatch?.delaySecondsMax || 60}s
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-ink-600 mb-1">
                Mínimo: {settings.dispatch?.delaySecondsMin || 30}s
              </label>
              <input
                type="range"
                min={10}
                max={120}
                value={settings.dispatch?.delaySecondsMin || 30}
                onChange={(e) => {
                  const minVal = Number(e.target.value);
                  const maxVal = Math.max(minVal, settings.dispatch?.delaySecondsMax || 60);
                  setSettings({
                    ...settings,
                    dispatch: {
                      ...settings.dispatch,
                      delaySecondsMin: minVal,
                      delaySecondsMax: maxVal,
                    },
                  });
                }}
                className="w-full accent-cobalt-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink-600 mb-1">
                Máximo: {settings.dispatch?.delaySecondsMax || 60}s
              </label>
              <input
                type="range"
                min={15}
                max={180}
                value={settings.dispatch?.delaySecondsMax || 60}
                onChange={(e) => {
                  const maxVal = Number(e.target.value);
                  const minVal = Math.min(maxVal, settings.dispatch?.delaySecondsMin || 30);
                  setSettings({
                    ...settings,
                    dispatch: {
                      ...settings.dispatch,
                      delaySecondsMin: minVal,
                      delaySecondsMax: maxVal,
                    },
                  });
                }}
                className="w-full accent-cobalt-600"
              />
            </div>
          </div>
        </div>

        {/* IA Local Ollama & Backup JSON */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cobalt-600" />
              IA Local Opcional (Ollama) & Backup
            </h3>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                aiStatus?.available
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-ink-500 border-slate-200'
              }`}
            >
              {aiStatus?.available
                ? `Ollama Online (${aiStatus.models.length} modelos)`
                : 'Modo Offline Determinístico'}
            </span>
          </div>

          {aiStatus?.available && aiStatus.models.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">
                Modelo Ollama preferido para refino de carta
              </label>
              <select
                value={settings.ai?.model || aiStatus.models[0]}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    ai: { ...(settings.ai || {}), model: e.target.value },
                  })
                }
                className={inputCls}
              >
                {aiStatus.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-ink-800 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-cobalt-600" />
              Exportar Backup JSON
            </button>
            <input
              ref={restoreInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => restoreInputRef.current?.click()}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-ink-800 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-ink-600" />
              Restaurar Backup JSON
            </button>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Modelo de Mensagem + Simulação ao Vivo */}
      <div className="xl:col-span-6 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5">
          <div>
            <h2 className="text-base font-bold text-ink-900">Modelo da Mensagem de E-mail</h2>
            <p className="text-xs text-ink-500">
              Clique em uma variável dinâmica para inseri-la na posição do cursor.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Assunto do e-mail</label>
            <input
              type="text"
              value={settings.dispatch?.subjectTemplate || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  dispatch: { ...settings.dispatch, subjectTemplate: e.target.value },
                })
              }
              className={inputCls}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_VARS.map((v) => (
              <button
                key={v.token}
                type="button"
                onClick={() => insertVariableAtCursor(v.token)}
                className="px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-cobalt-50 hover:border-cobalt-300 hover:text-cobalt-700 text-[11px] font-mono text-ink-700 transition-colors"
                title={`Inserir ${v.label}`}
              >
                {v.token}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Corpo da mensagem</label>
            <textarea
              ref={bodyRef}
              rows={9}
              value={settings.dispatch?.messageTemplate || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  dispatch: { ...settings.dispatch, messageTemplate: e.target.value },
                })
              }
              className={`${inputCls} font-mono leading-relaxed`}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-ink-900 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cobalt-600" />
              Pré-visualização Final
            </h3>
            {targets.length > 0 && (
              <select
                value={previewTarget?.id || ''}
                onChange={(e) => setPreviewTargetId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-[11px] text-ink-700"
              >
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    Simular com: {t.company}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden text-xs">
            <div className="px-3.5 py-2 border-b border-slate-200 bg-white font-semibold text-ink-900">
              {renderedPreview.subject}
            </div>
            <pre className="p-3.5 text-[11px] text-ink-700 whitespace-pre-wrap font-sans leading-relaxed max-h-60 overflow-y-auto">
              {renderedPreview.body}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
