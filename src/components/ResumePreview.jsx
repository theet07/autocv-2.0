import React, { useState, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Download,
  Highlighter,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { TEMPLATES_META, PALETTES_META } from '../constants/pillars';

function cleanUrl(url = '') {
  return String(url)
    .trim()
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/\/+$/, '');
}

function HighlightText({ text = '', keywords = [], enabled = false }) {
  if (!enabled || !keywords.length || !text) return <>{text}</>;
  const sorted = [...keywords]
    .filter((k) => k && k.trim().length >= 2)
    .sort((a, b) => b.length - a.length)
    .map((k) => k.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!sorted.length) return <>{text}</>;

  const regex = new RegExp(`((?<![a-zA-ZÀ-ÿ0-9])(?:${sorted.join('|')})(?![a-zA-ZÀ-ÿ0-9]))`, 'gi');
  const parts = String(text).split(regex);

  return (
    <>
      {parts.map((part, idx) => {
        const isMatch = keywords.some((k) => k.trim().toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <mark
            key={idx}
            className="bg-amber-200/85 text-slate-900 px-0.5 rounded-sm font-medium"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        );
      })}
    </>
  );
}

export default function ResumePreview({
  profile,
  onUpdateStyle = null,
  activeSection = null,
  onSectionClick = null,
  highlightKeywords = [],
  onGeneratePdf = null,
  pdfLoading = false,
  label = 'Folha A4 · Padrão ATS 2.0',
}) {
  const [zoom, setZoom] = useState(0.8);
  const [showHighlights, setShowHighlights] = useState(true);

  if (!profile) return null;

  const style = profile.resumeStyle || {
    template: 'executive',
    accent: 'navy',
    density: 'comfortable',
    onePageFit: true,
    showProjects: true,
    bulletExperiences: true,
  };

  const template = style.template || 'executive';
  const palette = PALETTES_META.find((p) => p.id === style.accent) || PALETTES_META[0];
  const isCompact = template === 'compact' || style.density === 'compact';

  const personal = profile.personal || {};
  const skills =
    profile.activeSkills ||
    profile.pillars?.[profile.selectedPillar || 'suporte']?.skills ||
    [];
  const mid = Math.ceil(skills.length / 2);
  const leftSkills = skills.slice(0, mid);
  const rightSkills = skills.slice(mid);
  const experiences = profile.experiences || [];
  const projects = style.showProjects !== false ? profile.projects || [] : [];
  const education = profile.education || [];
  const certifications = profile.certifications || [];
  const languages = profile.languages || [];

  const contactItems = [
    personal.phone,
    personal.email,
    personal.city,
    personal.linkedin ? cleanUrl(personal.linkedin) : '',
    personal.github ? cleanUrl(personal.github) : '',
    personal.website ? cleanUrl(personal.website) : '',
  ].filter(Boolean);

  // Medidor de ocupação estimada de 1 página A4
  const pageFillPercent = useMemo(() => {
    const expLen = experiences.reduce((s, e) => s + (e.description || '').length + 85, 0);
    const projLen = projects.reduce((s, p) => s + (p.description || '').length + 70, 0);
    const weight =
      180 +
      (profile.summary || '').length +
      skills.length * 42 +
      expLen +
      projLen +
      education.length * 90 +
      certifications.length * 42;
    const capacity = isCompact ? 2850 : 2450;
    return Math.min(125, Math.round((weight / capacity) * 100));
  }, [profile.summary, skills.length, experiences, projects, education.length, certifications.length, isCompact]);

  const sectionBox = (id) => {
    const interactive = Boolean(onSectionClick);
    const isFocused = activeSection === id;
    return [
      'rounded transition-all duration-150 -mx-2 px-2 py-1',
      interactive ? 'cursor-pointer hover:bg-cobalt-50/60 hover:ring-1 hover:ring-cobalt-200' : '',
      isFocused ? 'bg-cobalt-50/80 ring-1 ring-cobalt-400' : '',
    ].join(' ');
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      {/* Barra Superior da Prancheta A4 */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-white border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2 text-ink-800 font-semibold min-w-0">
          <FileCheck2 className="w-4 h-4 text-cobalt-600 flex-shrink-0" />
          <span className="truncate">{label}</span>

          {/* Indicador de Ocupação de 1 Página */}
          <span
            className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10.5px] border ${
              pageFillPercent <= 100
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
            title="Estimativa de ocupação na folha A4 única"
          >
            {pageFillPercent <= 100 ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertTriangle className="w-3 h-3" />
            )}
            <span>1 Pág ({pageFillPercent}%)</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Seletor Rápido de Template direto na barra se onUpdateStyle estiver disponível */}
          {onUpdateStyle && (
            <div className="hidden md:flex items-center bg-well p-0.5 rounded-md border border-slate-200">
              {TEMPLATES_META.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onUpdateStyle({ ...style, template: tpl.id })}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    template === tpl.id
                      ? 'bg-white text-ink-900 shadow-sm'
                      : 'text-ink-500 hover:text-ink-900'
                  }`}
                  title={tpl.desc}
                >
                  {tpl.short}
                </button>
              ))}
            </div>
          )}

          {/* Swatches rápidos de cor */}
          {onUpdateStyle && (
            <div className="hidden sm:flex items-center gap-1 px-1.5">
              {PALETTES_META.map((pal) => (
                <button
                  key={pal.id}
                  type="button"
                  onClick={() => onUpdateStyle({ ...style, accent: pal.id })}
                  title={`Cor ${pal.label}`}
                  style={{ backgroundColor: pal.swatch }}
                  className={`w-3.5 h-3.5 rounded-full transition-transform ${
                    style.accent === pal.id ? 'ring-2 ring-offset-1 ring-cobalt-600 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          )}

          {highlightKeywords.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHighlights((v) => !v)}
              className={`px-2 py-1 rounded border text-[11px] font-medium flex items-center gap-1 transition-colors ${
                showHighlights
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-ink-500 hover:bg-slate-50'
              }`}
              title="Destacar termos encontrados na vaga"
            >
              <Highlighter className="w-3 h-3" />
              <span>ATS ({highlightKeywords.length})</span>
            </button>
          )}

          <div className="flex items-center border border-slate-200 rounded bg-slate-50">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.55, +(z - 0.08).toFixed(2)))}
              className="p-1 text-ink-500 hover:text-ink-900 hover:bg-white rounded-l"
              title="Diminuir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] text-ink-700 tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.05, +(z + 0.08).toFixed(2)))}
              className="p-1 text-ink-500 hover:text-ink-900 hover:bg-white rounded-r"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {onGeneratePdf && (
            <button
              type="button"
              onClick={onGeneratePdf}
              disabled={pdfLoading}
              className="px-2.5 py-1 rounded bg-cobalt-600 hover:bg-cobalt-700 disabled:opacity-60 text-white font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{pdfLoading ? 'Gerando...' : 'PDF'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mesa Milimetrada com Folha A4 */}
      <div className="drafting-mat flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start">
        <div
          style={{
            width: `${794 * zoom}px`,
            minHeight: `${1123 * zoom}px`,
          }}
          className="transition-[width] duration-150 flex-shrink-0"
        >
          <div
            style={{
              width: '794px',
              minHeight: '1123px',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              color: palette.text,
            }}
            className={`a4-sheet bg-white font-sans ${
              isCompact ? 'px-[44px] py-[34px]' : 'px-[50px] py-[42px]'
            }`}
          >
            {/* CABEÇALHO (varia conforme Template) */}
            <div
              onClick={() => onSectionClick?.('personal')}
              className={sectionBox('personal')}
            >
              <div className={template === 'modern' ? 'pl-3.5 border-l-4' : ''} style={template === 'modern' ? { borderColor: palette.accent } : undefined}>
                <h1
                  style={{ color: palette.primary }}
                  className={`${
                    isCompact ? 'text-[21px]' : 'text-[23.5px]'
                  } font-extrabold tracking-tight uppercase leading-tight`}
                >
                  {personal.name || 'Seu Nome Completo'}
                </h1>
                <p
                  style={{ color: template === 'modern' ? palette.accent : palette.muted }}
                  className={`${isCompact ? 'text-[11.5px]' : 'text-[12.5px]'} font-semibold mt-0.5`}
                >
                  <HighlightText
                    text={personal.title || 'Título Profissional'}
                    keywords={highlightKeywords}
                    enabled={showHighlights}
                  />
                </p>
                {contactItems.length > 0 && (
                  <p className="text-[10.2px] mt-2 leading-snug break-words" style={{ color: palette.text }}>
                    {contactItems.join('   •   ')}
                  </p>
                )}
              </div>
            </div>

            <hr className={isCompact ? 'my-2.5' : 'my-3.5'} style={{ borderColor: palette.rule }} />

            {/* RESUMO PROFISSIONAL */}
            {profile.summary && (
              <>
                <div
                  onClick={() => onSectionClick?.('summary')}
                  className={sectionBox('summary')}
                >
                  <h2
                    style={{ color: palette.primary }}
                    className="text-[11.5px] font-bold tracking-[0.06em] uppercase mb-1"
                  >
                    Resumo Profissional
                  </h2>
                  <p className={`${isCompact ? 'text-[10.3px] leading-[1.45]' : 'text-[10.8px] leading-[1.52]'} text-justify`}>
                    <HighlightText
                      text={profile.summary}
                      keywords={highlightKeywords}
                      enabled={showHighlights}
                    />
                  </p>
                </div>
                <hr className={isCompact ? 'my-2.5' : 'my-3.5'} style={{ borderColor: palette.rule }} />
              </>
            )}

            {/* HABILIDADES TÉCNICAS */}
            <div
              onClick={() => onSectionClick?.('skills')}
              className={sectionBox('skills')}
            >
              <h2
                style={{ color: palette.primary }}
                className="text-[11.5px] font-bold tracking-[0.06em] uppercase mb-1.5"
              >
                Competências & Habilidades Técnicas
              </h2>
              <div className={`grid grid-cols-2 gap-x-6 ${isCompact ? 'gap-y-0.5 text-[10px]' : 'gap-y-1 text-[10.5px]'} leading-[1.38]`}>
                <ul className="space-y-0.5">
                  {leftSkills.map((sk, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span style={{ color: palette.primary }} className="font-bold">•</span>
                      <span>
                        <HighlightText
                          text={sk}
                          keywords={highlightKeywords}
                          enabled={showHighlights}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-0.5">
                  {rightSkills.map((sk, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span style={{ color: palette.primary }} className="font-bold">•</span>
                      <span>
                        <HighlightText
                          text={sk}
                          keywords={highlightKeywords}
                          enabled={showHighlights}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <hr className={isCompact ? 'my-2.5' : 'my-3.5'} style={{ borderColor: palette.rule }} />

            {/* EXPERIÊNCIA PROFISSIONAL */}
            <div
              onClick={() => onSectionClick?.('experiences')}
              className={sectionBox('experiences')}
            >
              <h2
                style={{ color: palette.primary }}
                className="text-[11.5px] font-bold tracking-[0.06em] uppercase mb-2"
              >
                Experiência Profissional
              </h2>
              <div className={isCompact ? 'space-y-2' : 'space-y-3'}>
                {experiences.map((exp, idx) => {
                  const lines = String(exp.description || '')
                    .split(/\r?\n/)
                    .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
                    .filter(Boolean);
                  const renderBullets = style.bulletExperiences !== false && lines.length > 1;

                  return (
                    <div key={exp.id || idx}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11.2px] font-bold" style={{ color: palette.text }}>
                          <HighlightText
                            text={exp.role}
                            keywords={highlightKeywords}
                            enabled={showHighlights}
                          />
                        </span>
                        <span className="text-[9.8px] font-semibold whitespace-nowrap" style={{ color: palette.muted }}>
                          {exp.period}
                        </span>
                      </div>
                      <div className="text-[10.3px] italic mb-1" style={{ color: palette.accent }}>
                        {exp.company}
                      </div>

                      {renderBullets ? (
                        <ul className="space-y-0.5 text-[10.2px] leading-[1.42] text-justify">
                          {lines.map((line, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-1.5">
                              <span style={{ color: palette.primary }} className="font-bold">•</span>
                              <span>
                                <HighlightText
                                  text={line}
                                  keywords={highlightKeywords}
                                  enabled={showHighlights}
                                />
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10.2px] leading-[1.44] text-justify">
                          <HighlightText
                            text={lines.join(' ')}
                            keywords={highlightKeywords}
                            enabled={showHighlights}
                          />
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PROJETOS TÉCNICOS (OPCIONAL) */}
            {projects.length > 0 && (
              <>
                <hr className={isCompact ? 'my-2.5' : 'my-3.5'} style={{ borderColor: palette.rule }} />
                <div
                  onClick={() => onSectionClick?.('projects')}
                  className={sectionBox('projects')}
                >
                  <h2
                    style={{ color: palette.primary }}
                    className="text-[11.5px] font-bold tracking-[0.06em] uppercase mb-1.5"
                  >
                    Projetos & Portfólio Técnico
                  </h2>
                  <div className="space-y-2">
                    {projects.map((proj, idx) => (
                      <div key={proj.id || idx}>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[10.8px] font-bold" style={{ color: palette.text }}>
                            {proj.name}
                          </span>
                          {proj.tech && (
                            <span className="text-[9.5px] font-semibold" style={{ color: palette.accent }}>
                              {proj.tech}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] leading-[1.4] text-justify mt-0.5">
                          <HighlightText
                            text={proj.description}
                            keywords={highlightKeywords}
                            enabled={showHighlights}
                          />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <hr className={isCompact ? 'my-2.5' : 'my-3.5'} style={{ borderColor: palette.rule }} />

            {/* FORMAÇÃO & CERTIFICAÇÕES */}
            <div
              onClick={() => onSectionClick?.('education')}
              className={sectionBox('education')}
            >
              <h2
                style={{ color: palette.primary }}
                className="text-[11.5px] font-bold tracking-[0.06em] uppercase mb-1.5"
              >
                Formação Acadêmica
              </h2>
              <div className="space-y-1.5">
                {education.map((edu, idx) => (
                  <div key={edu.id || idx}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[10.8px] font-bold" style={{ color: palette.text }}>
                        {edu.course}
                      </span>
                      <span className="text-[9.8px] whitespace-nowrap" style={{ color: palette.muted }}>
                        {edu.period}
                      </span>
                    </div>
                    <div className="text-[10px]" style={{ color: palette.muted }}>
                      {edu.institution}
                    </div>
                  </div>
                ))}
              </div>

              {(certifications.length > 0 || languages.length > 0) && (
                <>
                  <hr className={isCompact ? 'my-2.5' : 'my-3.5'} style={{ borderColor: palette.rule }} />
                  <h2
                    style={{ color: palette.primary }}
                    className="text-[11.5px] font-bold tracking-[0.06em] uppercase mb-1"
                  >
                    Qualificações Complementares & Idiomas
                  </h2>
                  <ul className="space-y-0.5 text-[10px] leading-[1.38]">
                    {certifications.map((c, i) => (
                      <li key={`c-${i}`}>• {c}</li>
                    ))}
                    {languages.length > 0 && (
                      <li className="pt-0.5">
                        <strong>Idiomas:</strong> {languages.join('  |  ')}
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
