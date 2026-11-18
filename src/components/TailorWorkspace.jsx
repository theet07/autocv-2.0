import React, { useState, useMemo, useEffect } from 'react';
import {
  SlidersHorizontal,
  FileText,
  Mail,
  Eye,
  Copy,
  Check,
  Plus,
  Download,
  RefreshCw,
  MessageCircle,
  Sparkles,
  GraduationCap,
  Wand2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  PILLARS_META,
  PITCH_TONES,
  computeLiveAtsRadar,
  renderEmailPreview,
  buildWhatsAppLink,
} from '../constants/pillars';
import ResumePreview from './ResumePreview';

export default function TailorWorkspace({
  profile,
  setProfile,
  onSaveProfile,
  targets,
  settings,
  selectedTargetId,
  setSelectedTargetId,
  customRole,
  setCustomRole,
  customCompany,
  setCustomCompany,
  customJobText,
  setCustomJobText,
  tailorResult,
  setTailorResult,
  tailorLoading,
  onRunTailor,
  generatedPdfUrl,
  generatedCoverUrl,
  pdfLoading,
  onGeneratePdf,
  onGenerateCoverPdf,
  onExtractAndSaveTarget,
  showToast,
}) {
  const [rightTab, setRightTab] = useState('resume'); // 'resume' | 'comms' | 'interview' | 'pdf'
  const [pitchTone, setPitchTone] = useState('direto');
  const [editablePitch, setEditablePitch] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [aiRefining, setAiRefining] = useState(false);
  const [pdfViewType, setPdfViewType] = useState('resume'); // 'resume' | 'cover'

  useEffect(() => {
    if (tailorResult?.pitches?.[pitchTone]) {
      setEditablePitch(tailorResult.pitches[pitchTone]);
    } else if (tailorResult?.tailoredPitch) {
      setEditablePitch(tailorResult.tailoredPitch);
    }
  }, [tailorResult, pitchTone]);

  const liveRadar = useMemo(
    () => computeLiveAtsRadar(customJobText, customRole, profile),
    [customJobText, customRole, profile]
  );

  const selectedTarget = targets.find((t) => t.id === selectedTargetId);

  const handleSelectTarget = (id) => {
    setSelectedTargetId(id);
    if (id) {
      const found = targets.find((t) => t.id === id);
      if (found) {
        setCustomRole(found.role || '');
        setCustomCompany(found.company || '');
        setCustomJobText(found.customJobDescription || found.notes || '');
      }
    }
  };

  const handleAutoExtractFields = async () => {
    if (!customJobText.trim()) {
      showToast('Cole o texto do anúncio primeiro.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/jobs/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: customJobText }),
      });
      const data = await res.json();
      if (data.success && data.parsed) {
        if (data.parsed.role) setCustomRole(data.parsed.role);
        if (data.parsed.company) setCustomCompany(data.parsed.company);
        showToast('Cargo e empresa extraídos do anúncio!');
      }
    } catch {
      showToast('Erro ao extrair dados do anúncio.', 'error');
    }
  };

  const handleInjectMissingKeyword = async (kw) => {
    const pillarKey = liveRadar.topCategory || profile.selectedPillar || 'suporte';
    const currentSkills = profile.pillars?.[pillarKey]?.skills || [];
    const updatedProfile = {
      ...profile,
      pillars: {
        ...profile.pillars,
        [pillarKey]: {
          ...profile.pillars[pillarKey],
          skills: [`Domínio prático em ${kw}`, ...currentSkills],
        },
      },
    };
    setProfile(updatedProfile);
    await onSaveProfile(updatedProfile);
    showToast(`"${kw}" incluído no topo das competências de ${pillarKey}!`);
  };

  const handleRefineWithOllama = async () => {
    setAiRefining(true);
    try {
      const res = await fetch('/api/ai/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          role: customRole || selectedTarget?.role || 'Suporte Técnico de TI',
          company: customCompany || selectedTarget?.company || 'Empresa',
          jobDescription: customJobText,
          currentPitch: editablePitch || emailPreview.body,
        }),
      });
      const data = await res.json();
      if (res.ok && data.refinedPitch) {
        setEditablePitch(data.refinedPitch);
        showToast(`Pitch refinado com ${data.modelUsed}!`);
      } else {
        showToast(data.error || 'Ollama local indisponível.', 'info');
      }
    } catch {
      showToast('Ollama não detectado em execução.', 'info');
    } finally {
      setAiRefining(false);
    }
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    showToast('Copiado para a área de transferência.');
    setTimeout(() => setCopiedField(null), 1800);
  };

  const emailPreview = renderEmailPreview({
    settings,
    profile,
    target: {
      role: customRole || selectedTarget?.role || 'Técnico de Suporte de TI',
      company: customCompany || selectedTarget?.company || 'Empresa Alvo',
    },
    tailoredPitch: editablePitch || tailorResult?.tailoredPitch || '',
  });

  const activePreviewProfile = tailorResult?.tailoredProfile
    ? { ...tailorResult.tailoredProfile, resumeStyle: profile.resumeStyle }
    : profile;

  const highlightKeywords =
    tailorResult?.analysis?.detectedKeywords?.length > 0
      ? [...tailorResult.analysis.detectedKeywords, ...liveRadar.highlightTerms]
      : liveRadar.highlightTerms;

  const atsScoreObj = tailorResult?.analysis?.atsScore || liveRadar.atsScore;
  const diagnostics = tailorResult?.analysis?.diagnostics || [];

  const inputCls =
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-full">
      {/* Coluna Esquerda: Entrada + Radar ATS Multidimensional (0-100) */}
      <div className="xl:col-span-5 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-ink-900">Estúdio ATS 2.0</h2>
              <p className="text-xs text-ink-500">
                Adapta título, resumo, ordem de competências, bullets de experiência, carta e roteiro de entrevista.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">
              Carregar vaga do CRM ou usar entrada livre
            </label>
            <select
              value={selectedTargetId}
              onChange={(e) => handleSelectTarget(e.target.value)}
              className={inputCls}
            >
              <option value="">Entrada livre (colar anúncio da web / WhatsApp)</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.company} — {t.role} ({t.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">Cargo da vaga</label>
              <input
                type="text"
                placeholder="Ex: Analista de Suporte N1"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">Empresa</label>
              <input
                type="text"
                placeholder="Ex: AlphaTech"
                value={customCompany}
                onChange={(e) => setCustomCompany(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-ink-700">
                Descrição e requisitos da vaga
              </label>
              <div className="flex items-center gap-2">
                {customJobText && (
                  <>
                    <button
                      type="button"
                      onClick={handleAutoExtractFields}
                      className="text-[11px] font-semibold text-cobalt-600 hover:text-cobalt-700 inline-flex items-center gap-1"
                    >
                      <Wand2 className="w-3 h-3" />
                      Auto-extrair cargo/empresa
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTargetId('');
                        setCustomJobText('');
                        setTailorResult(null);
                      }}
                      className="text-[11px] text-ink-400 hover:text-ink-900"
                    >
                      Limpar
                    </button>
                  </>
                )}
              </div>
            </div>
            <textarea
              rows={5}
              value={customJobText}
              onChange={(e) => setCustomJobText(e.target.value)}
              placeholder="Cole aqui os requisitos da vaga (LinkedIn, Gupy, Indeed, WhatsApp)..."
              className={`${inputCls} font-mono leading-relaxed`}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onRunTailor(null, pitchTone)}
              disabled={tailorLoading}
              className="flex-1 py-2.5 px-4 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              {tailorLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <SlidersHorizontal className="w-3.5 h-3.5" />
              )}
              <span>{tailorLoading ? 'Especializando...' : 'Especializar Currículo 2.0'}</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await onGeneratePdf();
                setPdfViewType('resume');
                setRightTab('pdf');
              }}
              disabled={pdfLoading}
              className="py-2.5 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{pdfLoading ? 'PDF...' : 'Gerar PDF'}</span>
            </button>

            {!selectedTargetId && customJobText.trim() && (
              <button
                type="button"
                onClick={() => onExtractAndSaveTarget(customJobText)}
                title="Extrair dados deste anúncio e salvar no Banco de Vagas CRM"
                className="py-2.5 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-ink-800 text-xs font-semibold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-cobalt-600" />
                Salvar CRM
              </button>
            )}
          </div>
        </div>

        {/* Score ATS Multidimensional 0-100 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink-900">Diagnóstico ATS 2.0 (0–100)</h3>
              <p className="text-[11px] text-ink-500">
                Pilar dominante:{' '}
                <strong className="text-ink-900">
                  {PILLARS_META.find((p) => p.id === liveRadar.topCategory)?.label}
                </strong>
                {tailorResult?.beforeScore !== undefined &&
                  tailorResult.afterScore > tailorResult.beforeScore && (
                    <span className="ml-1.5 text-emerald-700 font-semibold">
                      (+{tailorResult.afterScore - tailorResult.beforeScore} pts pós-adaptação)
                    </span>
                  )}
              </p>
            </div>
            <div className="text-right">
              <div
                className={`font-mono text-2xl font-extrabold tabular-nums ${
                  atsScoreObj.total >= 80
                    ? 'text-emerald-700'
                    : atsScoreObj.total >= 65
                    ? 'text-cobalt-600'
                    : 'text-amber-700'
                }`}
              >
                {atsScoreObj.total}
                <span className="text-xs font-normal text-ink-400">/100</span>
              </div>
              <div className="text-[10px] text-ink-400">score ATS global</div>
            </div>
          </div>

          {/* 4 Sub-barras de Pontuação */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {[
              { label: 'Hard Skills', val: atsScoreObj.hardSkills, max: 40 },
              { label: 'Cargo & Papel', val: atsScoreObj.roleAlignment, max: 25 },
              { label: 'Estrutura A4', val: atsScoreObj.structureHealth, max: 20 },
              { label: 'Contexto & Perfil', val: atsScoreObj.contextSoft, max: 15 },
            ].map((bar) => {
              const pct = Math.min(100, Math.round((bar.val / bar.max) * 100));
              return (
                <div
                  key={bar.label}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
                >
                  <div className="flex justify-between font-medium text-ink-700">
                    <span>{bar.label}</span>
                    <span className="font-mono tabular-nums">
                      {bar.val}/{bar.max}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-cobalt-600 rounded-full transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Termos Cobertos vs Ausentes */}
          {liveRadar.detected.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {liveRadar.matchedInProfile.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-emerald-800 mb-1">
                    Requisitos cobertos pelo seu perfil ({liveRadar.matchedInProfile.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {liveRadar.matchedInProfile.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px]"
                      >
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {liveRadar.missingInProfile.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-amber-900 mb-1">
                    Requisitos ausentes — clique para incluir no currículo (se dominar):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {liveRadar.missingInProfile.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => handleInjectMissingKeyword(kw)}
                        className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-mono text-[11px] inline-flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{kw}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-ink-400 py-1">
              Cole a descrição de uma vaga acima para mapear requisitos técnicos e sinônimos ATS.
            </div>
          )}

          {/* Checklist Diagnóstico */}
          {diagnostics.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              {diagnostics.map((d, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[11px] text-ink-600">
                  {d.status === 'ok' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Coluna Direita: 4 Abas (Currículo A4 | Carta, WhatsApp & LinkedIn | Guia de Entrevista | PDF) */}
      <div className="xl:col-span-7 flex flex-col gap-3 min-h-[650px] xl:h-[calc(100vh-116px)]">
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1 bg-well p-1 rounded-lg">
            {[
              { id: 'resume', label: 'Currículo A4', icon: FileText },
              { id: 'comms', label: 'Carta & WhatsApp', icon: Mail },
              { id: 'interview', label: 'Guia Entrevista', icon: GraduationCap },
              { id: 'pdf', label: 'PDF Vetorial', icon: Eye },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = rightTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRightTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                    active ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.id === 'pdf' && (generatedPdfUrl || generatedCoverUrl) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  )}
                </button>
              );
            })}
          </div>

          {tailorResult && (
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
              Especializado · {customCompany || selectedTarget?.company || 'Vaga'}
            </span>
          )}
        </div>

        <div className="flex-1 min-h-0">
          {rightTab === 'resume' && (
            <ResumePreview
              profile={activePreviewProfile}
              onUpdateStyle={(nextStyle) =>
                setProfile({ ...profile, resumeStyle: nextStyle })
              }
              highlightKeywords={highlightKeywords}
              onGeneratePdf={async () => {
                await onGeneratePdf(null, activePreviewProfile, Boolean(tailorResult));
                setPdfViewType('resume');
                setRightTab('pdf');
              }}
              pdfLoading={pdfLoading}
              label={
                tailorResult
                  ? `A4 Especializado · Pilar ${tailorResult.tailoredProfile.dominantPillar}`
                  : 'A4 Base (clique em Especializar Currículo 2.0)'
              }
            />
          )}

          {rightTab === 'comms' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 h-full overflow-y-auto space-y-4">
              {/* Seletor de Tom da Carta */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-ink-900">
                    Tom da Carta de Apresentação / Pitch
                  </label>
                  <button
                    type="button"
                    onClick={handleRefineWithOllama}
                    disabled={aiRefining}
                    className="px-2.5 py-1 rounded-md border border-cobalt-200 bg-cobalt-50 hover:bg-cobalt-100 text-cobalt-700 text-[11px] font-semibold inline-flex items-center gap-1"
                  >
                    <Sparkles className={`w-3 h-3 ${aiRefining ? 'animate-spin' : ''}`} />
                    {aiRefining ? 'Refinando no Ollama...' : 'Refinar com IA Local (Ollama)'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PITCH_TONES.map((t) => {
                    const active = pitchTone === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setPitchTone(t.id)}
                        className={`p-2.5 rounded-lg border text-left transition-colors ${
                          active
                            ? 'bg-cobalt-50 border-cobalt-600 text-cobalt-900'
                            : 'bg-slate-50 border-slate-200 text-ink-700 hover:bg-white'
                        }`}
                      >
                        <div className="text-xs font-bold">{t.label}</div>
                        <div className="text-[10.5px] text-ink-500 mt-0.5">{t.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-ink-700">
                    Parágrafo personalizado (editável)
                  </label>
                  <button
                    type="button"
                    onClick={() => copyText(editablePitch || emailPreview.body, 'pitch')}
                    className="text-xs font-semibold text-cobalt-600 hover:text-cobalt-700 inline-flex items-center gap-1"
                  >
                    {copiedField === 'pitch' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copiar pitch
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={editablePitch}
                  onChange={(e) => setEditablePitch(e.target.value)}
                  placeholder="Clique em Especializar Currículo 2.0 ao lado para gerar os 3 tons sob medida..."
                  className={`${inputCls} leading-relaxed`}
                />
              </div>

              {/* Prévia completa do E-mail + Gerar Carta PDF */}
              <div className="border-t border-slate-200 pt-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-ink-900">E-mail Completo ao RH</h4>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => copyText(emailPreview.subject, 'subj')}
                      className="px-2.5 py-1 rounded border border-slate-200 text-[11px] font-medium text-ink-700 hover:bg-slate-50 inline-flex items-center gap-1"
                    >
                      {copiedField === 'subj' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Assunto
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(emailPreview.body, 'body')}
                      className="px-2.5 py-1 rounded border border-slate-200 text-[11px] font-medium text-ink-700 hover:bg-slate-50 inline-flex items-center gap-1"
                    >
                      {copiedField === 'body' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Corpo
                    </button>
                    <button
                      type="button"
                      disabled={pdfLoading}
                      onClick={async () => {
                        await onGenerateCoverPdf({
                          company: customCompany || selectedTarget?.company || 'Empresa Contratante',
                          role: customRole || selectedTarget?.role || 'Suporte de TI',
                          bodyText: emailPreview.body,
                        });
                        setPdfViewType('cover');
                        setRightTab('pdf');
                      }}
                      className="px-2.5 py-1 rounded bg-ink-900 hover:bg-ink-800 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Carta em PDF
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                  <div className="px-3.5 py-2 border-b border-slate-200 bg-white text-xs">
                    <span className="text-ink-400 mr-1.5">Assunto:</span>
                    <span className="font-semibold text-ink-900">{emailPreview.subject}</span>
                  </div>
                  <pre className="p-3.5 text-xs text-ink-800 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                    {emailPreview.body}
                  </pre>
                </div>
              </div>

              {/* Abordagem WhatsApp & LinkedIn */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-200 pt-3.5">
                <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                      Mensagem para WhatsApp do RH
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            tailorResult?.whatsappMessage ||
                              `Olá! Me chamo ${profile.personal?.name}, vi a vaga de ${
                                customRole || 'TI'
                              } e gostaria de enviar meu currículo em PDF.`,
                            'wa'
                          )
                        }
                        className="px-2 py-0.5 rounded bg-white border border-emerald-200 text-[11px] font-semibold text-emerald-800"
                      >
                        {copiedField === 'wa' ? 'Copiado!' : 'Copiar'}
                      </button>
                      {selectedTarget?.phone && (
                        <a
                          href={buildWhatsAppLink(
                            selectedTarget.phone,
                            tailorResult?.whatsappMessage || ''
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[11px] font-semibold"
                        >
                          Abrir
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-ink-700 leading-relaxed">
                    {tailorResult?.whatsappMessage ||
                      'Clique em "Especializar Currículo 2.0" para gerar a mensagem pronta para abordagem via WhatsApp.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-cobalt-50/60 border border-cobalt-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cobalt-900">
                      Nota de Conexão LinkedIn (≤300 car.)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          tailorResult?.linkedinNote ||
                            `Olá! Sou ${profile.personal?.name}, vi a vaga de ${
                              customRole || 'TI'
                            } e gostaria de me conectar com o time!`,
                          'li'
                        )
                      }
                      className="px-2 py-0.5 rounded bg-white border border-cobalt-200 text-[11px] font-semibold text-cobalt-800"
                    >
                      {copiedField === 'li' ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <p className="text-[11px] text-ink-700 leading-relaxed">
                    {tailorResult?.linkedinNote ||
                      'Clique em "Especializar Currículo 2.0" para gerar a nota curta para recrutadores no LinkedIn.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {rightTab === 'interview' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 h-full overflow-y-auto space-y-4">
              <div>
                <h3 className="text-sm font-bold text-ink-900">
                  Roteiro de Preparação para Entrevista
                </h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  Perguntas prováveis para esta vaga e como responder conectando sua trajetória real, formação e projetos:
                </p>
              </div>

              {(tailorResult?.interviewPrep || []).length > 0 ? (
                <div className="space-y-3">
                  {tailorResult.interviewPrep.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="text-xs font-bold text-ink-900">{item.question}</div>
                      <div className="text-xs text-ink-700 leading-relaxed bg-white border border-slate-200 rounded-lg p-3">
                        <strong className="text-cobalt-700">Estratégia de resposta: </strong>
                        {item.tip}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-300 space-y-2">
                  <GraduationCap className="w-8 h-8 text-ink-400 mx-auto" />
                  <p className="text-xs text-ink-600 font-medium">
                    Clique em <strong>Especializar Currículo 2.0</strong> à esquerda para gerar seu roteiro personalizado de entrevista para a vaga.
                  </p>
                </div>
              )}
            </div>
          )}

          {rightTab === 'pdf' && (
            <div className="bg-white border border-slate-200 rounded-xl h-full flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1 bg-well p-0.5 rounded-md">
                  <button
                    type="button"
                    onClick={() => setPdfViewType('resume')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                      pdfViewType === 'resume' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'
                    }`}
                  >
                    Currículo PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfViewType('cover')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                      pdfViewType === 'cover' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'
                    }`}
                  >
                    Carta de Apresentação PDF
                  </button>
                </div>

                {(pdfViewType === 'resume' ? generatedPdfUrl : generatedCoverUrl) && (
                  <div className="flex items-center gap-2">
                    <a
                      href={pdfViewType === 'resume' ? generatedPdfUrl : generatedCoverUrl}
                      download
                      className="px-3 py-1.5 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white font-semibold inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar PDF
                    </a>
                    <a
                      href={pdfViewType === 'resume' ? generatedPdfUrl : generatedCoverUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-ink-700 hover:bg-slate-50 font-medium"
                    >
                      Nova aba
                    </a>
                  </div>
                )}
              </div>

              {(pdfViewType === 'resume' ? generatedPdfUrl : generatedCoverUrl) ? (
                <iframe
                  src={pdfViewType === 'resume' ? generatedPdfUrl : generatedCoverUrl}
                  title="Visualizador PDF AutoCV 2.0"
                  className="w-full flex-1 bg-slate-100"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <FileText className="w-10 h-10 text-ink-400" />
                  <div>
                    <h3 className="text-sm font-bold text-ink-900">
                      {pdfViewType === 'resume'
                        ? 'Currículo PDF ainda não gerado nesta sessão'
                        : 'Carta de Apresentação PDF ainda não gerada'}
                    </h3>
                    <p className="text-xs text-ink-500 max-w-sm mt-1">
                      Gere o arquivo PDF vetorial com links clicáveis para conferir antes do envio.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pdfLoading}
                    onClick={() =>
                      pdfViewType === 'resume'
                        ? onGeneratePdf(null, activePreviewProfile, Boolean(tailorResult))
                        : onGenerateCoverPdf({
                            company: customCompany || selectedTarget?.company || 'Empresa',
                            role: customRole || selectedTarget?.role || 'Suporte de TI',
                            bodyText: emailPreview.body,
                          })
                    }
                    className="px-4 py-2 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {pdfLoading ? 'Gerando...' : 'Gerar PDF Agora'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
