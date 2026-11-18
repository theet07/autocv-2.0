import React, { useState, useRef } from 'react';
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Check,
  GraduationCap,
  Award,
  Languages,
  FolderGit2,
  Palette,
  ListChecks,
} from 'lucide-react';
import { PILLARS_META, TEMPLATES_META, PALETTES_META } from '../constants/pillars';
import ResumePreview from './ResumePreview';

export default function ProfileWorkspace({
  profile,
  setProfile,
  onSaveProfile,
  isDirty,
  onGeneratePdf,
  pdfLoading,
  showToast,
}) {
  const [activeSection, setActiveSection] = useState('personal');
  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState('');
  const [newLang, setNewLang] = useState('');
  const [saving, setSaving] = useState(false);

  const sectionRefs = {
    personal: useRef(null),
    summary: useRef(null),
    skills: useRef(null),
    experiences: useRef(null),
    projects: useRef(null),
    education: useRef(null),
  };

  const jumpToSection = (sectionId) => {
    setActiveSection(sectionId);
    const el = sectionRefs[sectionId]?.current;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSaveProfile();
    setSaving(false);
  };

  const style = profile.resumeStyle || {
    template: 'executive',
    accent: 'navy',
    density: 'comfortable',
    onePageFit: true,
    showProjects: true,
    bulletExperiences: true,
  };

  const updateStyle = (nextStyle) => {
    setProfile({ ...profile, resumeStyle: nextStyle });
  };

  const selectedPillarKey = profile.selectedPillar || 'suporte';
  const currentPillar = profile.pillars?.[selectedPillarKey] || {
    title: '',
    highlight: '',
    skills: [],
  };

  const moveSkill = (idx, dir) => {
    const skills = [...(currentPillar.skills || [])];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= skills.length) return;
    [skills[idx], skills[targetIdx]] = [skills[targetIdx], skills[idx]];
    setProfile({
      ...profile,
      pillars: {
        ...profile.pillars,
        [selectedPillarKey]: { ...currentPillar, skills },
      },
    });
  };

  const addSkill = () => {
    const val = newSkill.trim();
    if (!val) return;
    setProfile({
      ...profile,
      pillars: {
        ...profile.pillars,
        [selectedPillarKey]: {
          ...currentPillar,
          skills: [...(currentPillar.skills || []), val],
        },
      },
    });
    setNewSkill('');
  };

  const removeSkill = (idx) => {
    const skills = (currentPillar.skills || []).filter((_, i) => i !== idx);
    setProfile({
      ...profile,
      pillars: {
        ...profile.pillars,
        [selectedPillarKey]: { ...currentPillar, skills },
      },
    });
  };

  const moveExperience = (idx, dir) => {
    const list = [...(profile.experiences || [])];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    [list[idx], list[targetIdx]] = [list[targetIdx], list[idx]];
    setProfile({ ...profile, experiences: list });
  };

  const updateExperience = (idx, field, value) => {
    const list = [...(profile.experiences || [])];
    list[idx] = { ...list[idx], [field]: value };
    setProfile({ ...profile, experiences: list });
  };

  const splitDescriptionIntoBullets = (idx) => {
    const exp = profile.experiences?.[idx];
    if (!exp) return;
    const sentences = String(exp.description || '')
      .split(/\r?\n|(?<=\.)\s+(?=[A-ZÀ-Ÿ])/)
      .map((s) => s.replace(/^[•\-*]\s*/, '').trim())
      .filter(Boolean);
    updateExperience(idx, 'description', sentences.join('\n'));
    showToast('Descrição organizada em tópicos (1 por linha).');
  };

  const updateProject = (idx, field, value) => {
    const list = [...(profile.projects || [])];
    list[idx] = { ...list[idx], [field]: value };
    setProfile({ ...profile, projects: list });
  };

  const updateEducation = (idx, field, value) => {
    const list = [...(profile.education || [])];
    list[idx] = { ...list[idx], [field]: value };
    setProfile({ ...profile, education: list });
  };

  const inputCls =
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15 transition-shadow';

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Barra Superior do Editor */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-base font-bold text-ink-900">Currículo Mestre & Design A4</h2>
          <div className="hidden md:flex items-center gap-1 bg-well p-1 rounded-lg">
            {[
              { id: 'personal', label: 'Dados' },
              { id: 'summary', label: 'Resumo' },
              { id: 'skills', label: 'Competências' },
              { id: 'experiences', label: 'Experiência' },
              { id: 'projects', label: 'Projetos' },
              { id: 'education', label: 'Formação' },
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => jumpToSection(sec.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeSection === sec.id
                    ? 'bg-white text-ink-900 shadow-sm'
                    : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isDirty && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Não salvo
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? 'Salvando...' : 'Salvar Perfil'}</span>
            <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-cobalt-700/60 rounded">
              Ctrl+S
            </kbd>
          </button>
        </div>
      </div>

      {/* Área Split-Screen: Editor (Esquerda) + Prancheta A4 (Direita) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="xl:col-span-6 space-y-4 overflow-y-auto pr-1 pb-8">
          {/* Estúdio Visual de Template & Paleta */}
          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-cobalt-600" />
                Layout A4 & Identidade Visual (100% ATS-Safe)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TEMPLATES_META.map((tpl) => {
                const Icon = tpl.icon;
                const active = style.template === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => updateStyle({ ...style, template: tpl.id })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      active
                        ? 'bg-cobalt-50 border-cobalt-600 ring-1 ring-cobalt-600/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon className={`w-4 h-4 ${active ? 'text-cobalt-600' : 'text-ink-500'}`} />
                      {active && <Check className="w-3.5 h-3.5 text-cobalt-600" />}
                    </div>
                    <div className="text-xs font-bold text-ink-900">{tpl.label}</div>
                    <div className="text-[11px] text-ink-500 leading-tight mt-0.5">{tpl.desc}</div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-ink-600 font-medium">Paleta PDF:</span>
                {PALETTES_META.map((pal) => (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => updateStyle({ ...style, accent: pal.id })}
                    className={`px-2 py-1 rounded-md border inline-flex items-center gap-1.5 text-[11px] font-medium ${
                      style.accent === pal.id
                        ? 'border-cobalt-600 bg-cobalt-50 text-cobalt-800'
                        : 'border-slate-200 bg-white text-ink-600 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: pal.swatch }}
                    />
                    {pal.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-ink-700">
                  <input
                    type="checkbox"
                    checked={style.bulletExperiences !== false}
                    onChange={(e) =>
                      updateStyle({ ...style, bulletExperiences: e.target.checked })
                    }
                    className="rounded border-slate-300 text-cobalt-600"
                  />
                  Experiências em tópicos
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-ink-700">
                  <input
                    type="checkbox"
                    checked={style.showProjects !== false}
                    onChange={(e) => updateStyle({ ...style, showProjects: e.target.checked })}
                    className="rounded border-slate-300 text-cobalt-600"
                  />
                  Exibir Projetos
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-ink-700">
                  <input
                    type="checkbox"
                    checked={style.onePageFit !== false}
                    onChange={(e) => updateStyle({ ...style, onePageFit: e.target.checked })}
                    className="rounded border-slate-300 text-cobalt-600"
                  />
                  Ajuste 1 Página
                </label>
              </div>
            </div>
          </section>

          {/* Pilar em Foco */}
          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-ink-900">Pilar Profissional em Foco</h3>
              <p className="text-xs text-ink-500">
                Selecione qual conjunto de competências deve aparecer por padrão na folha A4:
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PILLARS_META.map((p) => {
                const Icon = p.icon;
                const selected = selectedPillarKey === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProfile({ ...profile, selectedPillar: p.id });
                      setActiveSection('skills');
                    }}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      selected
                        ? 'bg-cobalt-50 border-cobalt-600 ring-1 ring-cobalt-600/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon className={`w-4 h-4 ${selected ? 'text-cobalt-600' : 'text-ink-500'}`} />
                      {selected && <Check className="w-3.5 h-3.5 text-cobalt-600" />}
                    </div>
                    <div className="text-xs font-bold text-ink-900">{p.label}</div>
                    <div className="text-[11px] text-ink-500 leading-tight mt-0.5 line-clamp-2">
                      {p.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Dados Pessoais & Links Verificáveis (LinkedIn + GitHub + Site) */}
          <section
            ref={sectionRefs.personal}
            onFocus={() => setActiveSection('personal')}
            className={`bg-white border rounded-xl p-4 space-y-3 transition-colors ${
              activeSection === 'personal' ? 'border-cobalt-400' : 'border-slate-200'
            }`}
          >
            <h3 className="text-sm font-bold text-ink-900">Dados Pessoais & Links Clicáveis no PDF</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Nome completo</label>
                <input
                  type="text"
                  value={profile.personal?.name || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personal: { ...profile.personal, name: e.target.value },
                    })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Título profissional</label>
                <input
                  type="text"
                  value={profile.personal?.title || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personal: { ...profile.personal, title: e.target.value },
                    })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">E-mail de contato</label>
                <input
                  type="email"
                  value={profile.personal?.email || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personal: { ...profile.personal, email: e.target.value },
                    })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={profile.personal?.phone || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personal: { ...profile.personal, phone: e.target.value },
                    })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Cidade / Estado</label>
                <input
                  type="text"
                  value={profile.personal?.city || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personal: { ...profile.personal, city: e.target.value },
                    })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">LinkedIn</label>
                <input
                  type="text"
                  value={profile.personal?.linkedin || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personal: { ...profile.personal, linkedin: e.target.value },
                    })
                  }
                  placeholder="https://linkedin.com/in/..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">GitHub</label>
                <input
                  type="text"
                  value={profile.personal?.github || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personal: { ...profile.personal, github: e.target.value },
                    })
                  }
                  placeholder="https://github.com/..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">
                  Portfólio / Site (Opcional)
                </label>
                <input
                  type="text"
                  value={profile.personal?.website || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personal: { ...profile.personal, website: e.target.value },
                    })
                  }
                  placeholder="https://seuportfolio.dev"
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          {/* Resumo Profissional */}
          <section
            ref={sectionRefs.summary}
            onFocus={() => setActiveSection('summary')}
            className={`bg-white border rounded-xl p-4 space-y-3 transition-colors ${
              activeSection === 'summary' ? 'border-cobalt-400' : 'border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-ink-900">Resumo Profissional</h3>
              <button
                type="button"
                onClick={() => {
                  const pillar = profile.pillars?.[selectedPillarKey];
                  if (!pillar) return;
                  const edu = profile.education?.[0];
                  const eduStr = (edu && edu.course && edu.institution)
                    ? `Com formação em ${edu.course} (${edu.institution})`
                    : (edu && edu.course)
                    ? `Com formação em ${edu.course}`
                    : 'Profissional com sólida formação técnica';
                  setProfile({
                    ...profile,
                    summary: `${eduStr}, com sólida vivência prática em ${pillar.title}. Experiência corporativa em ${pillar.highlight.toLowerCase()} Perfil proativo, comunicativo e focado em agregar valor imediato às operações da empresa.`,
                  });
                  showToast('Resumo ajustado ao pilar selecionado!');
                }}
                className="text-xs text-cobalt-600 hover:text-cobalt-700 font-semibold inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Adaptar resumo ao pilar selecionado
              </button>
            </div>
            <textarea
              rows={4}
              value={profile.summary || ''}
              onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
              className={`${inputCls} leading-relaxed`}
            />
            <div className="flex justify-between text-[11px] text-ink-400 font-mono tabular-nums">
              <span>{(profile.summary || '').length} caracteres</span>
              <span>Faixa ideal ATS: 280–700 caracteres</span>
            </div>
          </section>

          {/* Competências do Pilar */}
          <section
            ref={sectionRefs.skills}
            onFocus={() => setActiveSection('skills')}
            className={`bg-white border rounded-xl p-4 space-y-3 transition-colors ${
              activeSection === 'skills' ? 'border-cobalt-400' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-ink-900">
                  Competências — {currentPillar.title || selectedPillarKey}
                </h3>
                <p className="text-xs text-ink-500">
                  Ordene os itens de maior impacto no topo da grade de 2 colunas.
                </p>
              </div>
              <span className="font-mono text-xs text-ink-500 tabular-nums">
                {(currentPillar.skills || []).length} itens
              </span>
            </div>

            <div className="space-y-1.5">
              {(currentPillar.skills || []).map((skill, idx) => (
                <div
                  key={`${skill}-${idx}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 group hover:border-slate-300"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-ink-400 w-5 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-ink-900 truncate">{skill}</span>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveSkill(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 rounded text-ink-400 hover:text-ink-900 hover:bg-white disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSkill(idx, 1)}
                      disabled={idx === currentPillar.skills.length - 1}
                      className="p-1 rounded text-ink-400 hover:text-ink-900 hover:bg-white disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSkill(idx)}
                      className="p-1 rounded text-ink-400 hover:text-rose-600 hover:bg-white ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Nova competência (ex: GLPI, Active Directory, VLANs, SQL Server)"
                className={inputCls}
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-3.5 py-2 rounded-lg bg-ink-900 hover:bg-ink-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Incluir
              </button>
            </div>
          </section>

          {/* Experiências Profissionais */}
          <section
            ref={sectionRefs.experiences}
            onFocus={() => setActiveSection('experiences')}
            className={`bg-white border rounded-xl p-4 space-y-3 transition-colors ${
              activeSection === 'experiences' ? 'border-cobalt-400' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-900">Experiências Profissionais</h3>
              <button
                type="button"
                onClick={() => {
                  const newExp = {
                    id: `exp-${Date.now()}`,
                    role: 'Novo Cargo',
                    company: 'Nome da Empresa',
                    period: '2025 - Atual',
                    description: 'Atuação direta em suporte e sistemas.\nOtimização de rotinas operacionais.',
                  };
                  setProfile({
                    ...profile,
                    experiences: [...(profile.experiences || []), newExp],
                  });
                }}
                className="text-xs font-semibold text-cobalt-600 hover:text-cobalt-700 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Nova experiência
              </button>
            </div>

            <div className="space-y-3">
              {(profile.experiences || []).map((exp, idx) => (
                <div
                  key={exp.id || idx}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-ink-500">
                      Experiência #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => splitDescriptionIntoBullets(idx)}
                        title="Separar frases em 1 tópico por linha"
                        className="px-2 py-0.5 rounded border border-slate-200 bg-white hover:border-cobalt-300 text-[11px] text-ink-600 inline-flex items-center gap-1 mr-1"
                      >
                        <ListChecks className="w-3 h-3 text-cobalt-600" />
                        Quebrar em tópicos
                      </button>
                      <button
                        type="button"
                        onClick={() => moveExperience(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 rounded text-ink-400 hover:text-ink-900 hover:bg-white disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveExperience(idx, 1)}
                        disabled={idx === (profile.experiences || []).length - 1}
                        className="p-1 rounded text-ink-400 hover:text-ink-900 hover:bg-white disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (profile.experiences || []).filter((_, i) => i !== idx);
                          setProfile({ ...profile, experiences: updated });
                        }}
                        className="p-1 rounded text-ink-400 hover:text-rose-600 hover:bg-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                      placeholder="Cargo"
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                      placeholder="Empresa"
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={exp.period}
                      onChange={(e) => updateExperience(idx, 'period', e.target.value)}
                      placeholder="Período"
                      className={inputCls}
                    />
                  </div>
                  <textarea
                    rows={4}
                    value={exp.description}
                    onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                    placeholder="Uma realização/responsabilidade por linha..."
                    className={`${inputCls} text-xs leading-relaxed`}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Projetos & Portfólio Técnico */}
          <section
            ref={sectionRefs.projects}
            onFocus={() => setActiveSection('projects')}
            className={`bg-white border rounded-xl p-4 space-y-3 transition-colors ${
              activeSection === 'projects' ? 'border-cobalt-400' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
                <FolderGit2 className="w-4 h-4 text-cobalt-600" />
                Projetos & Portfólio Técnico
              </h3>
              <button
                type="button"
                onClick={() => {
                  const list = [
                    ...(profile.projects || []),
                    {
                      id: `proj-${Date.now()}`,
                      name: 'Novo Projeto Técnico',
                      tech: 'React, Node.js, SQL',
                      description: 'Descreva o problema resolvido e as tecnologias empregadas.',
                    },
                  ];
                  setProfile({ ...profile, projects: list });
                }}
                className="text-xs font-semibold text-cobalt-600 hover:text-cobalt-700 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Novo projeto
              </button>
            </div>

            <div className="space-y-2.5">
              {(profile.projects || []).map((proj, idx) => (
                <div
                  key={proj.id || idx}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={proj.name}
                      onChange={(e) => updateProject(idx, 'name', e.target.value)}
                      placeholder="Nome do projeto"
                      className={inputCls}
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={proj.tech}
                        onChange={(e) => updateProject(idx, 'tech', e.target.value)}
                        placeholder="Stack / Tecnologias"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const list = (profile.projects || []).filter((_, i) => i !== idx);
                          setProfile({ ...profile, projects: list });
                        }}
                        className="p-2 text-ink-400 hover:text-rose-600 rounded-lg border border-slate-200 bg-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={proj.description}
                    onChange={(e) => updateProject(idx, 'description', e.target.value)}
                    className={`${inputCls} text-xs leading-relaxed`}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Formação, Certificações & Idiomas */}
          <section
            ref={sectionRefs.education}
            onFocus={() => setActiveSection('education')}
            className={`bg-white border rounded-xl p-4 space-y-4 transition-colors ${
              activeSection === 'education' ? 'border-cobalt-400' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-cobalt-600" />
                Formação Acadêmica
              </h3>
              <button
                type="button"
                onClick={() => {
                  const list = [
                    ...(profile.education || []),
                    { id: `edu-${Date.now()}`, course: '', institution: '', period: '' },
                  ];
                  setProfile({ ...profile, education: list });
                }}
                className="text-xs font-semibold text-cobalt-600 hover:text-cobalt-700 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar curso
              </button>
            </div>

            <div className="space-y-2.5">
              {(profile.education || []).map((edu, idx) => (
                <div
                  key={edu.id || idx}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={edu.course}
                      onChange={(e) => updateEducation(idx, 'course', e.target.value)}
                      placeholder="Curso / Formação"
                      className={`${inputCls} sm:col-span-2`}
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={edu.period}
                        onChange={(e) => updateEducation(idx, 'period', e.target.value)}
                        placeholder="Período"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const list = (profile.education || []).filter((_, i) => i !== idx);
                          setProfile({ ...profile, education: list });
                        }}
                        className="p-2 text-ink-400 hover:text-rose-600 rounded-lg border border-slate-200 bg-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                    placeholder="Instituição de ensino"
                    className={inputCls}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-ink-700 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-cobalt-600" />
                  Qualificações & Certificados
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.certifications || []).map((cert, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs text-ink-800"
                    >
                      <span>{cert}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setProfile({
                            ...profile,
                            certifications: (profile.certifications || []).filter(
                              (_, i) => i !== idx
                            ),
                          })
                        }
                        className="text-ink-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!newCert.trim()) return;
                        setProfile({
                          ...profile,
                          certifications: [...(profile.certifications || []), newCert.trim()],
                        });
                        setNewCert('');
                      }
                    }}
                    placeholder="Nova certificação"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newCert.trim()) return;
                      setProfile({
                        ...profile,
                        certifications: [...(profile.certifications || []), newCert.trim()],
                      });
                      setNewCert('');
                    }}
                    className="px-2.5 rounded-lg bg-ink-900 text-white text-xs font-medium"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-ink-700 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-cobalt-600" />
                  Idiomas
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.languages || []).map((lang, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs text-ink-800"
                    >
                      <span>{lang}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setProfile({
                            ...profile,
                            languages: (profile.languages || []).filter((_, i) => i !== idx),
                          })
                        }
                        className="text-ink-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!newLang.trim()) return;
                        setProfile({
                          ...profile,
                          languages: [...(profile.languages || []), newLang.trim()],
                        });
                        setNewLang('');
                      }
                    }}
                    placeholder="Ex: Inglês (Técnico)"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newLang.trim()) return;
                      setProfile({
                        ...profile,
                        languages: [...(profile.languages || []), newLang.trim()],
                      });
                      setNewLang('');
                    }}
                    className="px-2.5 rounded-lg bg-ink-900 text-white text-xs font-medium"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Coluna Direita: Folha A4 Interativa ao Vivo */}
        <div className="xl:col-span-6 min-h-[640px] xl:h-[calc(100vh-140px)] xl:sticky xl:top-4">
          <ResumePreview
            profile={profile}
            onUpdateStyle={updateStyle}
            activeSection={activeSection}
            onSectionClick={jumpToSection}
            onGeneratePdf={() => onGeneratePdf(null, profile)}
            pdfLoading={pdfLoading}
            label={`A4 · ${
              PILLARS_META.find((p) => p.id === selectedPillarKey)?.label || 'Suporte'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
