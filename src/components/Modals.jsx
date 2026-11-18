import React, { useMemo, useState, useEffect } from 'react';
import {
  X,
  Building2,
  UploadCloud,
  Search,
  CornerDownLeft,
  Wand2,
  AlertTriangle,
} from 'lucide-react';

export function AddTargetModal({
  open,
  onClose,
  newTarget,
  setNewTarget,
  onSubmit,
  showToast,
}) {
  const [rawPaste, setRawPaste] = useState('');
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    if (!open) setRawPaste('');
  }, [open]);

  if (!open) return null;

  const handleParseAd = async () => {
    if (!rawPaste.trim()) return;
    setParsing(true);
    try {
      const res = await fetch('/api/jobs/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawPaste }),
      });
      const data = await res.json();
      if (data.success && data.parsed) {
        const p = data.parsed;
        setNewTarget({
          ...newTarget,
          company: p.company || newTarget.company,
          role: p.role || newTarget.role,
          email: p.email || newTarget.email,
          phone: p.phone || newTarget.phone || '',
          city: p.city || newTarget.city,
          salary: p.salary || newTarget.salary || '',
          category: p.category || newTarget.category,
          customJobDescription: p.cleanDescription || rawPaste,
        });
        showToast?.('Campos preenchidos automaticamente a partir do anúncio!');
      }
    } catch {
      showToast?.('Erro ao extrair campos do anúncio.', 'error');
    } finally {
      setParsing(false);
    }
  };

  const inputCls =
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15';

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cobalt-600" />
            Cadastrar Nova Vaga no CRM 2.0
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-ink-400 hover:text-ink-900 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Extrator Inteligente com 1 Clique */}
        <div className="p-3 rounded-lg bg-cobalt-50/70 border border-cobalt-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cobalt-900 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-cobalt-600" />
              Preenchimento Mágico por Anúncio (Opcional)
            </span>
            <button
              type="button"
              disabled={!rawPaste.trim() || parsing}
              onClick={handleParseAd}
              className="px-2.5 py-1 rounded bg-cobalt-600 hover:bg-cobalt-700 disabled:opacity-45 text-white text-[11px] font-semibold"
            >
              {parsing ? 'Extraindo...' : 'Extrair Dados'}
            </button>
          </div>
          <textarea
            rows={2}
            value={rawPaste}
            onChange={(e) => setRawPaste(e.target.value)}
            placeholder="Cole o texto completo do anúncio (WhatsApp, LinkedIn, Gupy) e clique em Extrair Dados..."
            className="w-full bg-white border border-cobalt-200 rounded-md p-2 text-[11px] font-mono text-ink-900 focus:outline-none focus:border-cobalt-600"
          />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">
                Nome da Empresa *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: ABC Tecnologia"
                value={newTarget.company}
                onChange={(e) => setNewTarget({ ...newTarget, company: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">Cargo da Vaga *</label>
              <input
                type="text"
                required
                placeholder="Ex: Técnico de Suporte N1"
                value={newTarget.role}
                onChange={(e) => setNewTarget({ ...newTarget, role: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">
                E-mail do RH (para disparo)
              </label>
              <input
                type="email"
                placeholder="rh@empresa.com.br"
                value={newTarget.email}
                onChange={(e) => setNewTarget({ ...newTarget, email: e.target.value })}
                className={`${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">
                WhatsApp / Telefone (Opcional)
              </label>
              <input
                type="text"
                placeholder="(11) 99999-9999"
                value={newTarget.phone || ''}
                onChange={(e) => setNewTarget({ ...newTarget, phone: e.target.value })}
                className={`${inputCls} font-mono`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">Área / Pilar</label>
              <select
                value={newTarget.category}
                onChange={(e) => setNewTarget({ ...newTarget, category: e.target.value })}
                className={inputCls}
              >
                <option value="suporte">Suporte TI</option>
                <option value="redes">Redes & Infra</option>
                <option value="administrativo">Administrativo</option>
                <option value="analista">Dev & Sistemas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">Cidade / Modelo</label>
              <input
                type="text"
                placeholder="Barueri / Híbrido"
                value={newTarget.city}
                onChange={(e) => setNewTarget({ ...newTarget, city: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">Salário / Bolsa</label>
              <input
                type="text"
                placeholder="R$ 2.500,00"
                value={newTarget.salary || ''}
                onChange={(e) => setNewTarget({ ...newTarget, salary: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">
              Descrição / Requisitos da Vaga (Motor ATS)
            </label>
            <textarea
              rows={3}
              placeholder="Cole os requisitos da vaga para especialização automática..."
              value={newTarget.customJobDescription}
              onChange={(e) =>
                setNewTarget({ ...newTarget, customJobDescription: e.target.value })
              }
              className={inputCls}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-ink-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-xs font-semibold text-white"
            >
              Salvar Vaga
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BulkImportModal({
  open,
  onClose,
  text,
  setText,
  onImport,
  baseCount,
  existingTargets = [],
}) {
  const existingEmails = useMemo(
    () => new Set(existingTargets.map((t) => String(t.email || '').trim().toLowerCase())),
    [existingTargets]
  );

  const parsedPreview = useMemo(() => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const items = [];
    const seenBatch = new Set();

    lines.forEach((line, i) => {
      const parts = line.split(/[;,\t]/).map((p) => p.trim());
      let company = `Empresa ${baseCount + i + 1}`;
      let email = '';
      let role = 'Suporte Técnico de TI';
      let category = 'suporte';

      if (parts.length === 1 && parts[0].includes('@')) {
        const m = parts[0].match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        email = m ? m[0].toLowerCase() : '';
        company = email.split('@')[1]?.split('.')[0]?.toUpperCase() || company;
      } else if (parts.length >= 2) {
        company = parts[0];
        email = parts[1].toLowerCase();
        if (parts[2]) role = parts[2];
        if (parts[3]) category = parts[3].toLowerCase();
      }

      if (email && email.includes('@')) {
        const isDuplicate = existingEmails.has(email) || seenBatch.has(email);
        seenBatch.add(email);
        items.push({
          company,
          email,
          role,
          category: ['suporte', 'redes', 'administrativo', 'analista'].includes(category)
            ? category
            : 'suporte',
          isDuplicate,
        });
      }
    });
    return items;
  }, [text, baseCount, existingEmails]);

  if (!open) return null;

  const duplicateCount = parsedPreview.filter((x) => x.isDuplicate).length;

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-cobalt-600" />
            Importação em Lote com Detector de Duplicidade
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-ink-400 hover:text-ink-900 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-ink-500 leading-relaxed">
          Cole um e-mail por linha (<code className="font-mono text-cobalt-700">rh@empresa.com</code>) ou colunas separadas por ponto-e-vírgula (
          <code className="font-mono text-cobalt-700">Empresa; rh@empresa.com; Cargo; suporte</code>).
        </p>

        <textarea
          rows={6}
          placeholder={`rh@infortec.com.br\nTech Corp; recrutamento@techcorp.com; Suporte TI; suporte\nGrupo Delta; vagas@grupodelta.com; Assistente Administrativo; administrativo`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-ink-900 font-mono leading-relaxed focus:outline-none focus:border-cobalt-600"
        />

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-ink-700">
            <span>Pré-visualização validada</span>
            <div className="flex items-center gap-2">
              {duplicateCount > 0 && (
                <span className="text-amber-800 inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {duplicateCount} duplicado(s) ignorado(s)
                </span>
              )}
              <span className="font-mono text-cobalt-700 tabular-nums">
                {parsedPreview.filter((x) => !x.isDuplicate).length} novo(s)
              </span>
            </div>
          </div>
          {parsedPreview.length > 0 ? (
            <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 text-[11px]">
              {parsedPreview.map((item, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1.5 flex items-center justify-between gap-2 ${
                    item.isDuplicate ? 'opacity-50 bg-amber-50/40' : ''
                  }`}
                >
                  <span className="font-semibold text-ink-900">{item.company}</span>
                  <span className="text-ink-500 truncate">{item.role}</span>
                  <span className="font-mono text-cobalt-700">
                    {item.email} {item.isDuplicate ? '(já existe)' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-[11px] text-ink-400">
              Cole linhas acima para validar os registros.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-ink-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={parsedPreview.filter((x) => !x.isDuplicate).length === 0}
            onClick={() => onImport(parsedPreview.filter((x) => !x.isDuplicate))}
            className="px-4 py-2 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 disabled:opacity-50 text-xs font-semibold text-white"
          >
            Importar {parsedPreview.filter((x) => !x.isDuplicate).length} nova(s)
          </button>
        </div>
      </div>
    </div>
  );
}

export function CommandPalette({ open, onClose, actions }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  if (!open) return null;

  const filtered = actions.filter(
    (a) =>
      a.label.toLowerCase().includes(query.toLowerCase()) ||
      (a.group || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-[1px] flex items-start justify-center pt-[14vh] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200">
          <Search className="w-4 h-4 text-ink-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filtered[0]) {
                filtered[0].run();
                onClose();
              }
            }}
            placeholder="Ir para painel, trocar template A4, gerar PDF, cadastrar vaga..."
            className="flex-1 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 border border-slate-200 rounded text-ink-500">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
          {filtered.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => {
                  act.run();
                  onClose();
                }}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-cobalt-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {Icon && <Icon className="w-4 h-4 text-cobalt-600" />}
                  <div>
                    <div className="text-xs font-semibold text-ink-900">{act.label}</div>
                    {act.group && <div className="text-[10px] text-ink-400">{act.group}</div>}
                  </div>
                </div>
                <CornerDownLeft className="w-3.5 h-3.5 text-ink-400" />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-6 text-center text-xs text-ink-400">
              Nenhum comando encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
