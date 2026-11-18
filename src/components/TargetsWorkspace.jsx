import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  UploadCloud,
  Download,
  LayoutList,
  Columns3,
  Trash2,
  FileText,
  Send,
  X,
  RotateCcw,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Save,
  MapPin,
  Mail,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import {
  PILLARS_META,
  STATUS_META,
  PRIORITY_META,
  computeLiveAtsRadar,
  buildWhatsAppLink,
  exportTargetsToCsv,
} from '../constants/pillars';

export default function TargetsWorkspace({
  targets,
  profile,
  onSaveTargets,
  onDeleteTarget,
  onOpenAddModal,
  onOpenBulkModal,
  onTailorTarget,
  onDispatchSelected,
  showToast,
}) {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'board'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [drawerTarget, setDrawerTarget] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [copiedFollowup, setCopiedFollowup] = useState(false);

  useEffect(() => {
    if (drawerTarget) {
      const fresh = targets.find((t) => t.id === drawerTarget.id);
      if (!fresh) setDrawerTarget(null);
    }
  }, [targets]);

  // Calcula Score ATS ao vivo para cada vaga da lista
  const atsByTargetId = useMemo(() => {
    const map = {};
    for (const t of targets) {
      map[t.id] = computeLiveAtsRadar(
        t.customJobDescription || t.notes || '',
        t.role,
        profile
      ).atsScore.total;
    }
    return map;
  }, [targets, profile]);

  const counts = {
    all: targets.length,
    pending: targets.filter((t) => t.status === 'pending').length,
    sent: targets.filter((t) => t.status === 'sent' || t.status === 'simulated').length,
    followup: targets.filter((t) => t.status === 'followup').length,
    interview: targets.filter((t) => t.status === 'interview' || t.status === 'offer').length,
  };

  const filtered = targets.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (t.company || '').toLowerCase().includes(q) ||
      (t.role || '').toLowerCase().includes(q) ||
      (t.email || '').toLowerCase().includes(q) ||
      (t.city || '').toLowerCase().includes(q);
    const matchCat = filterCategory === 'all' || t.category === filterCategory;
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'sent'
        ? t.status === 'sent' || t.status === 'simulated'
        : filterStatus === 'interview'
        ? t.status === 'interview' || t.status === 'offer'
        : t.status === filterStatus);
    return matchSearch && matchCat && matchStatus;
  });

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filtered.map((t) => t.id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkStatusReset = async (newStatus) => {
    const updated = targets.map((t) =>
      selectedIds.includes(t.id) ? { ...t, status: newStatus } : t
    );
    await onSaveTargets(updated);
    showToast(`${selectedIds.length} vaga(s) movida(s) para "${STATUS_META[newStatus]?.label}".`);
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    const updated = targets.filter((t) => !selectedIds.includes(t.id));
    await onSaveTargets(updated);
    showToast(`${selectedIds.length} vaga(s) removida(s).`);
    setSelectedIds([]);
  };

  const handleSaveDrawer = async (e) => {
    e.preventDefault();
    if (!drawerTarget) return;
    const updated = targets.map((t) => (t.id === drawerTarget.id ? drawerTarget : t));
    await onSaveTargets(updated);
    showToast(`Dados de ${drawerTarget.company} salvos.`);
    setDrawerTarget(null);
  };

  const handleQuickStatusChange = async (id, newStatus) => {
    const updated = targets.map((t) => (t.id === id ? { ...t, status: newStatus } : t));
    await onSaveTargets(updated);
    showToast(`Status alterado para ${STATUS_META[newStatus]?.label}.`);
  };

  const copyFollowUpMessage = (target) => {
    const name = profile?.personal?.name || 'Candidato';
    const text = `Olá, equipe de RH da ${target.company}!\n\nEspero que estejam bem. Há alguns dias enviei meu currículo para a vaga de ${target.role} e gostaria de reforçar meu interesse em somar à equipe com minha experiência em TI e suporte operacional.\n\nFico à disposição caso precisem de informações adicionais ou para agendarmos uma conversa!\n\nAtenciosamente,\n${name}\n${profile?.personal?.phone || ''} | ${profile?.personal?.email || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedFollowup(true);
    showToast('Mensagem de Follow-up copiada!');
    setTimeout(() => setCopiedFollowup(false), 1800);
  };

  const getPillarMeta = (cat) => PILLARS_META.find((p) => p.id === cat) || PILLARS_META[0];

  const inputCls =
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15';

  return (
    <div className="space-y-4 relative">
      {/* Barra Superior de Pipeline + Ações */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'Todas', count: counts.all },
            { id: 'pending', label: 'Pendentes', count: counts.pending },
            { id: 'sent', label: 'Enviadas / Sim.', count: counts.sent },
            { id: 'followup', label: 'Follow-up', count: counts.followup },
            { id: 'interview', label: 'Entrevistas & Propostas', count: counts.interview },
          ].map((stat) => {
            const active = filterStatus === stat.id;
            return (
              <button
                key={stat.id}
                type="button"
                onClick={() => setFilterStatus(stat.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-2 transition-colors ${
                  active
                    ? 'bg-ink-900 text-white border-ink-900'
                    : 'bg-slate-50 text-ink-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{stat.label}</span>
                <span
                  className={`font-mono text-[11px] px-1.5 py-0.2 rounded tabular-nums ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-ink-700 border border-slate-200'
                  }`}
                >
                  {stat.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-well p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Tabela
            </button>
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1.5 ${
                viewMode === 'board'
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              Pipeline CRM
            </button>
          </div>

          <button
            type="button"
            onClick={() => exportTargetsToCsv(targets)}
            disabled={targets.length === 0}
            className="px-2.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-ink-700 text-xs font-medium inline-flex items-center gap-1.5"
            title="Exportar planilha CSV compatível com Excel"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>

          <button
            type="button"
            onClick={onOpenBulkModal}
            className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-ink-800 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Importar Lote
          </button>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-3.5 py-2 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Vaga
          </button>
        </div>
      </div>

      {/* Busca + Filtro por Área */}
      <div className="flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar empresa, cargo, cidade, e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-cobalt-600"
          />
        </div>

        <div className="flex flex-wrap gap-1 bg-white border border-slate-200 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium ${
              filterCategory === 'all'
                ? 'bg-cobalt-600 text-white'
                : 'text-ink-600 hover:bg-slate-100'
            }`}
          >
            Todas áreas
          </button>
          {PILLARS_META.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCategory(cat.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium ${
                filterCategory === cat.id
                  ? 'bg-cobalt-600 text-white'
                  : 'text-ink-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Barra de Ação em Lote */}
      {selectedIds.length > 0 && (
        <div className="bg-ink-900 text-white rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="font-mono bg-white/15 px-2 py-0.5 rounded tabular-nums">
              {selectedIds.length}
            </span>
            <span>vaga(s) selecionada(s)</span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-slate-300 hover:text-white underline ml-1"
            >
              limpar
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onDispatchSelected(selectedIds)}
              className="px-3 py-1.5 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Disparar Selecionadas
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatusReset('pending')}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Marcar Pendente
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>
          </div>
        </div>
      )}

      {/* MODO TABELA CRM */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-ink-500 font-semibold">
                <tr>
                  <th className="pl-4 pr-2 py-3 w-9">
                    <button
                      type="button"
                      onClick={toggleSelectAllVisible}
                      className="text-ink-500 hover:text-ink-900"
                    >
                      {filtered.length > 0 && filtered.every((t) => selectedIds.includes(t.id)) ? (
                        <CheckSquare className="w-4 h-4 text-cobalt-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-3">Empresa & Local</th>
                  <th className="px-3 py-3">Cargo & Salário</th>
                  <th className="px-3 py-3">Contato RH</th>
                  <th className="px-3 py-3">Área</th>
                  <th className="px-3 py-3">Match ATS</th>
                  <th className="px-3 py-3">Etapa CRM</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((target) => {
                  const isChecked = selectedIds.includes(target.id);
                  const pillarMeta = getPillarMeta(target.category);
                  const statusMeta = STATUS_META[target.status] || STATUS_META.pending;
                  const atsScore = atsByTargetId[target.id] || 80;

                  return (
                    <tr
                      key={target.id}
                      onClick={() => setDrawerTarget({ ...target })}
                      className={`cursor-pointer transition-colors ${
                        isChecked ? 'bg-cobalt-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td
                        className="pl-4 pr-2 py-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(target.id);
                        }}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-cobalt-600" />
                        ) : (
                          <Square className="w-4 h-4 text-ink-400 hover:text-ink-700" />
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-ink-900 flex items-center gap-1.5">
                          <span>{target.company}</span>
                          {target.priority === 'alta' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                              Prioridade
                            </span>
                          )}
                        </div>
                        {target.city && (
                          <div className="text-[11px] text-ink-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{target.city}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-ink-800 font-medium">{target.role}</div>
                        {target.salary && (
                          <div className="text-[11px] font-mono text-emerald-700 mt-0.5">
                            {target.salary}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-mono text-[11px] text-ink-600">
                          {target.email || '—'}
                        </div>
                        {target.phone && (
                          <div className="font-mono text-[10.5px] text-ink-400 mt-0.5">
                            {target.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded border text-[11px] font-medium ${pillarMeta.badgeClass}`}
                        >
                          {pillarMeta.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border tabular-nums ${
                            atsScore >= 80
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : atsScore >= 65
                              ? 'bg-cobalt-50 text-cobalt-700 border-cobalt-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {atsScore}%
                        </span>
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={target.status || 'pending'}
                          onChange={(e) => handleQuickStatusChange(target.id, e.target.value)}
                          className={`px-2 py-1 rounded border text-[11px] font-semibold cursor-pointer focus:outline-none ${statusMeta.badge}`}
                        >
                          {Object.entries(STATUS_META).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          {target.phone && (
                            <a
                              href={buildWhatsAppLink(
                                target.phone,
                                `Olá! Vi a vaga de ${target.role} na ${target.company} e gostaria de enviar meu currículo.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chamar RH no WhatsApp"
                              className="p-1.5 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => onTailorTarget(target)}
                            title="Especializar Currículo & Carta ATS"
                            className="px-2 py-1 rounded border border-slate-200 bg-white hover:border-cobalt-300 hover:text-cobalt-700 text-ink-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            ATS
                          </button>
                          <button
                            type="button"
                            onClick={() => setDrawerTarget({ ...target })}
                            title="Inspecionar e editar"
                            className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-ink-600"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {confirmDeleteId === target.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteTarget(target.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-semibold"
                            >
                              Confirmar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(target.id)}
                              title="Remover vaga"
                              className="p-1.5 rounded border border-slate-200 bg-white hover:border-rose-300 hover:text-rose-600 text-ink-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-ink-500">
                      Nenhuma vaga encontrada com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODO PIPELINE KANBAN 5 COLUNAS */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {[
            { id: 'pending', title: 'Fila Pendente', match: (s) => s === 'pending' },
            { id: 'simulated', title: 'Simuladas', match: (s) => s === 'simulated' },
            { id: 'sent', title: 'Currículo Enviado', match: (s) => s === 'sent' || s === 'error' },
            { id: 'followup', title: 'Follow-up', match: (s) => s === 'followup' },
            {
              id: 'interview',
              title: 'Entrevista & Proposta',
              match: (s) => s === 'interview' || s === 'offer',
            },
          ].map((col) => {
            const colItems = filtered.filter((t) => col.match(t.status || 'pending'));
            return (
              <div
                key={col.id}
                className="bg-well/80 border border-slate-200 rounded-xl p-3 space-y-2.5 min-h-[340px]"
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-ink-800">{col.title}</span>
                  <span className="font-mono text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded tabular-nums text-ink-600">
                    {colItems.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colItems.map((target) => {
                    const pillarMeta = getPillarMeta(target.category);
                    const atsScore = atsByTargetId[target.id] || 80;
                    return (
                      <div
                        key={target.id}
                        onClick={() => setDrawerTarget({ ...target })}
                        className="bg-white border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-cobalt-400 transition-colors space-y-2 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-ink-900 truncate">
                              {target.company}
                            </div>
                            <div className="text-[11px] text-ink-600 truncate">{target.role}</div>
                          </div>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex-shrink-0">
                            {atsScore}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1 text-[10.5px]">
                          <span
                            className={`px-1.5 py-0.2 rounded border font-medium ${pillarMeta.badgeClass}`}
                          >
                            {pillarMeta.label}
                          </span>
                          {target.salary && (
                            <span className="font-mono text-emerald-700 font-semibold">
                              {target.salary}
                            </span>
                          )}
                        </div>

                        {target.email && (
                          <div className="text-[10.5px] font-mono text-ink-500 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span>{target.email}</span>
                          </div>
                        )}

                        <div
                          className="flex items-center justify-between pt-1.5 border-t border-slate-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onTailorTarget(target)}
                            className="text-[11px] font-semibold text-cobalt-600 hover:text-cobalt-700"
                          >
                            Abrir ATS
                          </button>
                          <select
                            value={target.status || 'pending'}
                            onChange={(e) => handleQuickStatusChange(target.id, e.target.value)}
                            className="text-[10.5px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-ink-700"
                          >
                            {Object.entries(STATUS_META).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                  {colItems.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-ink-400 border border-dashed border-slate-300 rounded-lg">
                      Vazio
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SLIDE-OVER DRAWER DE INSPEÇÃO, FOLLOW-UP E EDIÇÃO */}
      {drawerTarget && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/35 backdrop-blur-[1px]">
          <div className="animate-drawer bg-white w-full max-w-lg h-full border-l border-slate-200 shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink-900">Ficha CRM da Vaga</h3>
                <p className="text-xs text-ink-500">{drawerTarget.company}</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerTarget(null)}
                className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDrawer} className="flex-1 overflow-y-auto p-5 space-y-3.5">
              {/* Barra rápida de Follow-up e WhatsApp */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-ink-700">Ações rápidas de contato:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => copyFollowUpMessage(drawerTarget)}
                    className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-semibold text-ink-800 inline-flex items-center gap-1"
                  >
                    {copiedFollowup ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    Copiar Follow-up
                  </button>
                  {drawerTarget.phone && (
                    <a
                      href={buildWhatsAppLink(
                        drawerTarget.phone,
                        `Olá! Me chamo ${profile?.personal?.name || 'Candidato'} e tenho interesse na vaga de ${drawerTarget.role} na ${drawerTarget.company}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp
                    </a>
                  )}
                  {drawerTarget.sourceUrl && (
                    <a
                      href={drawerTarget.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-medium text-cobalt-700 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Link
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Empresa</label>
                  <input
                    type="text"
                    required
                    value={drawerTarget.company || ''}
                    onChange={(e) => setDrawerTarget({ ...drawerTarget, company: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Etapa CRM</label>
                  <select
                    value={drawerTarget.status || 'pending'}
                    onChange={(e) => setDrawerTarget({ ...drawerTarget, status: e.target.value })}
                    className={inputCls}
                  >
                    {Object.entries(STATUS_META).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Cargo</label>
                  <input
                    type="text"
                    value={drawerTarget.role || ''}
                    onChange={(e) => setDrawerTarget({ ...drawerTarget, role: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">E-mail de RH</label>
                  <input
                    type="email"
                    value={drawerTarget.email || ''}
                    onChange={(e) => setDrawerTarget({ ...drawerTarget, email: e.target.value })}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={drawerTarget.phone || ''}
                    onChange={(e) => setDrawerTarget({ ...drawerTarget, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">
                    Faixa Salarial / Bolsa
                  </label>
                  <input
                    type="text"
                    value={drawerTarget.salary || ''}
                    onChange={(e) => setDrawerTarget({ ...drawerTarget, salary: e.target.value })}
                    placeholder="Ex: R$ 2.500,00"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Área / Pilar</label>
                  <select
                    value={drawerTarget.category || 'suporte'}
                    onChange={(e) => setDrawerTarget({ ...drawerTarget, category: e.target.value })}
                    className={inputCls}
                  >
                    <option value="suporte">Suporte TI</option>
                    <option value="redes">Redes & Infra</option>
                    <option value="administrativo">Administrativo</option>
                    <option value="analista">Dev & Sistemas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Prioridade</label>
                  <select
                    value={drawerTarget.priority || 'media'}
                    onChange={(e) => setDrawerTarget({ ...drawerTarget, priority: e.target.value })}
                    className={inputCls}
                  >
                    {Object.entries(PRIORITY_META).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Cidade / Modelo</label>
                  <input
                    type="text"
                    value={drawerTarget.city || ''}
                    onChange={(e) => setDrawerTarget({ ...drawerTarget, city: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">
                  Link da Vaga (LinkedIn / Gupy / Portal)
                </label>
                <input
                  type="text"
                  value={drawerTarget.sourceUrl || ''}
                  onChange={(e) =>
                    setDrawerTarget({ ...drawerTarget, sourceUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">
                  Anotações de Entrevista / Observações
                </label>
                <input
                  type="text"
                  value={drawerTarget.notes || ''}
                  onChange={(e) => setDrawerTarget({ ...drawerTarget, notes: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">
                  Descrição Completa & Requisitos da Vaga (Motor ATS)
                </label>
                <textarea
                  rows={6}
                  value={drawerTarget.customJobDescription || ''}
                  onChange={(e) =>
                    setDrawerTarget({ ...drawerTarget, customJobDescription: e.target.value })
                  }
                  placeholder="Cole os requisitos completos para elevar a precisão do motor ATS..."
                  className={`${inputCls} font-mono leading-relaxed`}
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onTailorTarget(drawerTarget);
                    setDrawerTarget(null);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-ink-800 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cobalt-600" />
                  Abrir no Estúdio ATS
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
