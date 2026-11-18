import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  User,
  Building2,
  SlidersHorizontal,
  Send,
  Settings,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Mail,
  FileCheck2,
  Search,
  Plus,
  Download,
  Menu,
  X,
  Palette,
} from 'lucide-react';
import DashboardWorkspace from './components/DashboardWorkspace';
import ProfileWorkspace from './components/ProfileWorkspace';
import TargetsWorkspace from './components/TargetsWorkspace';
import TailorWorkspace from './components/TailorWorkspace';
import DispatchWorkspace from './components/DispatchWorkspace';
import SettingsWorkspace from './components/SettingsWorkspace';
import { AddTargetModal, BulkImportModal, CommandPalette } from './components/Modals';
import { TEMPLATES_META } from './constants/pillars';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Painel Estratégico', icon: LayoutDashboard, shortcut: '1' },
  { id: 'profile', label: 'Currículo & Templates', icon: User, shortcut: '2' },
  { id: 'targets', label: 'CRM de Vagas', icon: Building2, shortcut: '3' },
  { id: 'tailor', label: 'Estúdio ATS & Carta', icon: SlidersHorizontal, shortcut: '4' },
  { id: 'dispatch', label: 'Central de Disparo', icon: Send, shortcut: '5' },
  { id: 'settings', label: 'SMTP & Backup', icon: Settings, shortcut: '6' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [profile, setProfile] = useState(null);
  const [savedProfileSnapshot, setSavedProfileSnapshot] = useState('');
  const [targets, setTargets] = useState([]);
  const [settings, setSettings] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Estúdio ATS & PDFs
  const [selectedTargetForTailor, setSelectedTargetForTailor] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [customJobText, setCustomJobText] = useState('');
  const [tailorResult, setTailorResult] = useState(null);
  const [tailorLoading, setTailorLoading] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null);
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Disparo em Lote 2.0
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchPaused, setBatchPaused] = useState(false);
  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0,
    percent: 0,
    statusText: '',
    target: null,
  });
  const [liveEvents, setLiveEvents] = useState([]);
  const [delayCountdown, setDelayCountdown] = useState(0);
  const [simulationOverride, setSimulationOverride] = useState(true);
  const [queuedTargetIds, setQueuedTargetIds] = useState([]);

  // Modais & Command Palette
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTarget, setNewTarget] = useState({
    company: '',
    email: '',
    phone: '',
    role: 'Técnico de Suporte N1',
    category: 'suporte',
    city: 'Barueri - SP',
    salary: '',
    customJobDescription: '',
  });
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);

  // Teste SMTP
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState(null);

  const sseRef = useRef(null);
  const toastTimerRef = useRef(null);

  const pushLiveEvent = (text) => {
    const time = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLiveEvents((prev) => [{ time, text }, ...prev.slice(0, 25)]);
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setNotification(null), 4200);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [resProfile, resTargets, resSettings, resHistory] = await Promise.all([
        fetch('/api/profile').then((r) => r.json()),
        fetch('/api/targets').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
        fetch('/api/history').then((r) => r.json()),
      ]);

      setProfile(resProfile);
      setSavedProfileSnapshot(JSON.stringify(resProfile));
      setTargets(resTargets);
      setQueuedTargetIds(
        resTargets.filter((t) => t.status === 'pending' && t.email).map((t) => t.id)
      );
      setSettings(resSettings);
      setHistory(resHistory);
      if (resSettings?.dispatch) {
        setSimulationOverride(resSettings.dispatch.simulationMode);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      showToast('Não foi possível conectar ao servidor AutoCV 2.0 (porta 3002).', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    const eventSource = new EventSource('/api/dispatch/stream');
    sseRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'STATUS') {
          setBatchRunning(Boolean(data.isRunning));
          setBatchPaused(Boolean(data.isPaused));
        } else if (data.type === 'BATCH_START') {
          setBatchRunning(true);
          setBatchPaused(false);
          setBatchProgress({
            current: 0,
            total: data.total,
            percent: 0,
            statusText: 'Iniciando lote...',
            target: null,
          });
          pushLiveEvent(
            `Lote iniciado (${data.total} vagas · ${data.isSimulation ? 'Simulação' : 'Envio Real'})`
          );
        } else if (data.type === 'BATCH_PAUSED') {
          setBatchPaused(true);
          pushLiveEvent('Fila pausada pelo usuário.');
        } else if (data.type === 'BATCH_RESUMED') {
          setBatchPaused(false);
          pushLiveEvent('Fila retomada.');
        } else if (data.type === 'SENDING_ITEM') {
          setBatchProgress({
            current: data.index + 1,
            total: data.total,
            percent: data.progressPercent,
            statusText: `Especializando PDF e enviando para ${data.target.company}...`,
            target: data.target,
          });
          pushLiveEvent(`Processando ${data.target.company} (${data.target.email})`);
        } else if (data.type === 'ITEM_SUCCESS') {
          setBatchProgress((prev) => ({
            ...prev,
            current: data.index,
            percent: Math.round((data.index / data.total) * 100),
            statusText: `Enviado: ${data.logEntry.company}`,
          }));
          pushLiveEvent(`✓ Concluído: ${data.logEntry.company} (ATS ${data.logEntry.atsScore}%)`);
          fetch('/api/history').then((r) => r.json()).then(setHistory);
          fetch('/api/targets').then((r) => r.json()).then(setTargets);
        } else if (data.type === 'ITEM_SKIPPED') {
          pushLiveEvent(`↷ Ignorado (já enviado): ${data.target.company}`);
          fetch('/api/history').then((r) => r.json()).then(setHistory);
        } else if (data.type === 'ITEM_ERROR') {
          pushLiveEvent(`✕ Falha em ${data.target.company}: ${data.error}`);
          showToast(`Falha para ${data.target.company}: ${data.error}`, 'error');
        } else if (data.type === 'WAITING_DELAY') {
          setDelayCountdown(data.seconds);
        } else if (data.type === 'BATCH_FINISH' || data.type === 'BATCH_CANCELLED') {
          setBatchRunning(false);
          setBatchPaused(false);
          setDelayCountdown(0);
          pushLiveEvent(
            data.type === 'BATCH_FINISH'
              ? 'Lote finalizado com sucesso.'
              : 'Lote cancelado pelo usuário.'
          );
          showToast(
            data.type === 'BATCH_FINISH' ? 'Disparo em lote concluído!' : 'Disparo interrompido.',
            'info'
          );
          fetch('/api/history').then((r) => r.json()).then(setHistory);
          fetch('/api/targets').then((r) => r.json()).then(setTargets);
        }
      } catch (err) {
        console.error('Erro SSE:', err);
      }
    };

    return () => {
      eventSource.close();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (delayCountdown > 0 && !batchPaused) {
      const timer = setTimeout(() => setDelayCountdown((p) => p - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [delayCountdown, batchPaused]);

  // Atalhos de teclado: Ctrl+K, Ctrl+S e Alt+1..6
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((o) => !o);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (activeTab === 'profile' && profile) saveProfile();
        if (activeTab === 'settings' && settings) saveSettings(settings);
      } else if (e.altKey && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const item = NAV_ITEMS[Number(e.key) - 1];
        if (item) setActiveTab(item.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTab, profile, settings]);

  const saveProfile = async (overrideProfile = profile) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideProfile),
      });
      const data = await res.json();
      if (data.success) {
        setSavedProfileSnapshot(JSON.stringify(overrideProfile));
        showToast('Currículo Mestre salvo em disco.');
      }
    } catch {
      showToast('Erro ao salvar perfil.', 'error');
    }
  };

  const saveTargets = async (updatedTargets) => {
    try {
      await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTargets),
      });
      setTargets(updatedTargets);
    } catch {
      showToast('Erro ao atualizar CRM de vagas.', 'error');
    }
  };

  const saveSettings = async (customSettings = settings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customSettings),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Configurações salvas.');
      }
    } catch {
      showToast('Erro ao salvar configurações.', 'error');
    }
  };

  const handleAddTarget = async (e) => {
    e.preventDefault();
    if (!newTarget.company || !newTarget.role) {
      showToast('Informe a empresa e o cargo da vaga.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/targets/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTarget),
      });
      const data = await res.json();
      if (data.success) {
        setTargets((prev) => [data.target, ...prev]);
        if (data.target.email) {
          setQueuedTargetIds((prev) => [data.target.id, ...prev]);
        }
        setShowAddModal(false);
        setNewTarget({
          company: '',
          email: '',
          phone: '',
          role: 'Técnico de Suporte N1',
          category: 'suporte',
          city: 'Barueri - SP',
          salary: '',
          customJobDescription: '',
        });
        showToast(data.duplicateWarning || 'Nova vaga cadastrada no CRM.');
      }
    } catch {
      showToast('Erro ao cadastrar vaga.', 'error');
    }
  };

  const handleExtractAndSaveTarget = async (rawText) => {
    try {
      const parsedRes = await fetch('/api/jobs/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      }).then((r) => r.json());

      if (!parsedRes.success) throw new Error('Falha no extrator.');
      const p = parsedRes.parsed;

      const addRes = await fetch('/api/targets/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: p.company,
          role: p.role,
          email: p.email,
          phone: p.phone,
          city: p.city,
          salary: p.salary,
          category: p.category,
          customJobDescription: p.cleanDescription,
        }),
      }).then((r) => r.json());

      if (addRes.success) {
        setTargets((prev) => [addRes.target, ...prev]);
        if (addRes.target.email) {
          setQueuedTargetIds((prev) => [addRes.target.id, ...prev]);
        }
        showToast(
          addRes.duplicateWarning ||
            `Vaga "${addRes.target.role}" em "${addRes.target.company}" salva no CRM!`
        );
      }
    } catch {
      showToast('Erro ao extrair e salvar anúncio.', 'error');
    }
  };

  const handleBulkImport = async (validItems = []) => {
    if (validItems.length === 0) return;

    const newItems = validItems.map((item, idx) => ({
      id: `target-${Date.now()}-${idx}`,
      company: item.company,
      email: item.email,
      phone: '',
      role: item.role,
      category: item.category,
      city: 'Brasil',
      salary: '',
      priority: 'media',
      status: 'pending',
      notes: 'Importado em lote',
      customJobDescription: '',
      createdAt: new Date().toISOString(),
    }));

    const updated = [...newItems, ...targets];
    await saveTargets(updated);
    setQueuedTargetIds((prev) => [...newItems.map((n) => n.id), ...prev]);
    setShowBulkImportModal(false);
    setBulkImportText('');
    showToast(`${newItems.length} nova(s) empresa(s) importada(s)!`);
  };

  const handleDeleteTarget = async (id) => {
    try {
      await fetch(`/api/targets/${id}`, { method: 'DELETE' });
      setTargets((prev) => prev.filter((t) => t.id !== id));
      setQueuedTargetIds((prev) => prev.filter((x) => x !== id));
      showToast('Vaga removida.');
    } catch {
      showToast('Erro ao remover vaga.', 'error');
    }
  };

  const handleTestSmtp = async () => {
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: settings.email }),
      });
      const data = await res.json();
      setEmailTestResult(data);
      if (data.success) showToast('Conexão SMTP validada!');
      else showToast(data.error || 'Falha SMTP.', 'error');
    } catch (err) {
      setEmailTestResult({ success: false, error: err.message });
      showToast('Erro de comunicação com o servidor.', 'error');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTailorJob = async (overrideTarget = null, pitchTone = 'direto') => {
    setTailorLoading(true);
    try {
      let targetPayload = overrideTarget;
      if (!targetPayload) {
        if (selectedTargetForTailor) {
          targetPayload = {
            ...(targets.find((t) => t.id === selectedTargetForTailor) || {}),
            role: customRole || undefined,
            company: customCompany || undefined,
            customJobDescription: customJobText || undefined,
          };
        } else {
          targetPayload = {
            role: customRole || 'Técnico de Suporte de TI',
            company: customCompany || 'Empresa Alvo',
            customJobDescription: customJobText,
          };
        }
      }

      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, target: targetPayload, pitchTone }),
      });
      const data = await res.json();
      setTailorResult(data);
      showToast(`Currículo adaptado! Score ATS: ${data.afterScore}/100`);
    } catch {
      showToast('Erro ao especializar currículo.', 'error');
    } finally {
      setTailorLoading(false);
    }
  };

  const handleQuickPasteToTailor = async (rawAd) => {
    setSelectedTargetForTailor('');
    setCustomJobText(rawAd);
    setActiveTab('tailor');
    try {
      const res = await fetch('/api/jobs/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawAd }),
      }).then((r) => r.json());
      if (res.success && res.parsed) {
        setCustomRole(res.parsed.role || '');
        setCustomCompany(res.parsed.company || '');
        await handleTailorJob({
          role: res.parsed.role,
          company: res.parsed.company,
          category: res.parsed.category,
          customJobDescription: rawAd,
        });
      }
    } catch {
      await handleTailorJob({ customJobDescription: rawAd });
    }
  };

  const handleOpenTargetInTailor = (target) => {
    setSelectedTargetForTailor(target.id);
    setCustomRole(target.role || '');
    setCustomCompany(target.company || '');
    setCustomJobText(target.customJobDescription || target.notes || '');
    setActiveTab('tailor');
    handleTailorJob(target);
  };

  const handleDispatchSelectedTargets = (ids) => {
    setQueuedTargetIds(ids);
    setActiveTab('dispatch');
  };

  const handleGeneratePdf = async (
    overrideTarget = null,
    overrideProfile = null,
    alreadyTailored = false
  ) => {
    setPdfLoading(true);
    try {
      const targetPayload =
        overrideTarget !== undefined && overrideTarget !== null
          ? overrideTarget
          : activeTab === 'tailor'
          ? selectedTargetForTailor
            ? targets.find((t) => t.id === selectedTargetForTailor)
            : {
                role: customRole || 'Técnico de TI',
                company: customCompany || 'Geral',
                customJobDescription: customJobText,
              }
          : null;

      const res = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: overrideProfile || profile,
          target: targetPayload,
          alreadyTailored,
          styleOverrides: profile?.resumeStyle || {},
        }),
      });
      const data = await res.json();
      if (data.success) {
        const freshUrl = `${data.url}?t=${Date.now()}`;
        setGeneratedPdfUrl(freshUrl);
        showToast(`PDF gerado: ${data.fileName}`);
        return freshUrl;
      } else {
        showToast(`Erro ao gerar PDF: ${data.error}`, 'error');
      }
    } catch {
      showToast('Falha ao gerar PDF.', 'error');
    } finally {
      setPdfLoading(false);
    }
    return null;
  };

  const handleGeneratePillarPdf = async (pillarId) => {
    const pillarProfile = {
      ...profile,
      selectedPillar: pillarId,
      activeSkills: profile.pillars?.[pillarId]?.skills || [],
    };
    const url = await handleGeneratePdf(
      { company: pillarId.toUpperCase(), role: profile.pillars?.[pillarId]?.title || 'TI' },
      pillarProfile,
      true
    );
    if (url) window.open(url, '_blank');
  };

  const handleGenerateCoverPdf = async ({ company, role, bodyText }) => {
    setPdfLoading(true);
    try {
      const res = await fetch('/api/pdf/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          target: { company, role },
          bodyText,
          styleOverrides: profile?.resumeStyle || {},
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedCoverUrl(`${data.url}?t=${Date.now()}`);
        showToast('Carta de Apresentação em PDF gerada!');
      } else {
        showToast(data.error || 'Falha ao gerar Carta PDF.', 'error');
      }
    } catch {
      showToast('Erro ao gerar Carta PDF.', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleStartBatch = async ({
    targetIds,
    pitchTone,
    attachCoverLetter,
    allowResend,
  }) => {
    try {
      const res = await fetch('/api/dispatch/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetIds,
          simulationModeOverride: simulationOverride,
          pitchTone,
          attachCoverLetter,
          allowResend,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao iniciar disparo.', 'error');
      }
    } catch {
      showToast('Erro ao comunicar com o servidor de disparo.', 'error');
    }
  };

  const handlePauseBatch = async () => {
    await fetch('/api/dispatch/pause', { method: 'POST' });
  };

  const handleResumeBatch = async () => {
    await fetch('/api/dispatch/resume', { method: 'POST' });
  };

  const handleStopBatch = async () => {
    await fetch('/api/dispatch/stop', { method: 'POST' });
    showToast('Solicitando interrupção do lote...');
  };

  const handleClearHistory = async () => {
    await fetch('/api/history', { method: 'DELETE' });
    setHistory([]);
    showToast('Histórico limpo.');
  };

  if (loading || !profile || !settings) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas text-ink-900">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-slate-300 border-t-cobalt-600 animate-spin" />
          <p className="text-sm font-bold">Carregando AutoCV 2.0...</p>
          <p className="text-xs text-ink-500">Conectando ao motor local na porta 3002</p>
        </div>
      </div>
    );
  }

  const profileDirty = JSON.stringify(profile) !== savedProfileSnapshot;
  const pendingCount = targets.filter((t) => t.status === 'pending').length;

  const commandActions = [
    ...NAV_ITEMS.map((n) => ({
      id: `nav-${n.id}`,
      label: `Abrir ${n.label}`,
      group: 'Navegação (Alt+' + n.shortcut + ')',
      icon: n.icon,
      run: () => setActiveTab(n.id),
    })),
    ...TEMPLATES_META.map((tpl) => ({
      id: `tpl-${tpl.id}`,
      label: `Mudar Currículo para Template: ${tpl.label}`,
      group: 'Templates A4',
      icon: Palette,
      run: () => {
        setProfile({
          ...profile,
          resumeStyle: { ...(profile.resumeStyle || {}), template: tpl.id },
        });
        setActiveTab('profile');
        showToast(`Template alterado para ${tpl.label}`);
      },
    })),
    {
      id: 'new-target',
      label: 'Cadastrar nova vaga no CRM',
      group: 'Ações rápidas',
      icon: Plus,
      run: () => setShowAddModal(true),
    },
    {
      id: 'gen-pdf',
      label: 'Gerar currículo em PDF agora',
      group: 'Ações rápidas',
      icon: Download,
      run: () => handleGeneratePdf(null, profile),
    },
    {
      id: 'toggle-sim',
      label: simulationOverride
        ? 'Alternar para Modo Real de envio SMTP'
        : 'Alternar para Modo Simulação (100% seguro)',
      group: 'Segurança',
      icon: ShieldCheck,
      run: () => setSimulationOverride((v) => !v),
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-ink-900 flex items-center justify-center text-white shadow-sm">
            <FileCheck2 className="w-4 h-4 text-cobalt-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-ink-900 leading-none">
                AutoCV
              </span>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-cobalt-600 text-white leading-none">
                2.0
              </span>
            </div>
            <div className="text-[11px] text-ink-500 mt-0.5">ATS Studio & Job CRM</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileNavOpen(false)}
          className="lg:hidden p-1 text-ink-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-xs text-ink-500 flex items-center justify-between transition-colors"
        >
          <span className="inline-flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Comandos...</span>
          </span>
          <kbd className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-ink-500">
            Ctrl+K
          </kbd>
        </button>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setMobileNavOpen(false);
              }}
              className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                active
                  ? 'bg-cobalt-50 text-cobalt-700 border border-cobalt-200'
                  : 'text-ink-600 hover:bg-slate-100 hover:text-ink-900 border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${active ? 'text-cobalt-600' : 'text-ink-400'}`} />
                <span>{item.label}</span>
              </span>
              {item.id === 'targets' && pendingCount > 0 && (
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 tabular-nums">
                  {pendingCount}
                </span>
              )}
              {item.id === 'dispatch' && batchRunning && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              )}
              {item.id === 'profile' && profileDirty && (
                <span
                  className="w-2 h-2 rounded-full bg-amber-500"
                  title="Alterações não salvas"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50/70">
        <button
          type="button"
          onClick={() => setSimulationOverride((v) => !v)}
          className={`w-full px-3 py-2 rounded-lg border text-left text-xs transition-colors ${
            simulationOverride
              ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100/70'
              : 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100/70'
          }`}
        >
          <div className="font-semibold flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              {simulationOverride ? 'Simulação Ativa' : 'Envio Real Ativo'}
            </span>
            <span className="text-[10px] underline">trocar</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-left text-[11px] flex items-center gap-2 text-ink-600"
        >
          <Mail className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
          <span className="truncate font-mono">
            {settings.email?.user || 'Configurar e-mail'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink-900 flex">
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
            notification.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : notification.type === 'info'
              ? 'bg-ink-900 text-white border-ink-700'
              : 'bg-emerald-800 text-white border-emerald-700'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <aside className="hidden lg:block w-60 flex-shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 bg-white h-full border-r border-slate-200 shadow-xl">
            <SidebarContent />
          </div>
          <div
            className="flex-1 bg-ink-900/30"
            onClick={() => setMobileNavOpen(false)}
          />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="p-1.5 rounded-lg border border-slate-200 text-ink-700"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-ink-900">
            {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
          </span>
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="p-1.5 rounded-lg border border-slate-200 text-ink-700"
          >
            <Search className="w-4 h-4" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-5 max-w-[1640px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardWorkspace
              profile={profile}
              targets={targets}
              history={history}
              onNavigate={setActiveTab}
              onQuickPasteToTailor={handleQuickPasteToTailor}
              onQuickExtractAndSave={handleExtractAndSaveTarget}
              onGeneratePillarPdf={handleGeneratePillarPdf}
              pdfLoading={pdfLoading}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileWorkspace
              profile={profile}
              setProfile={setProfile}
              onSaveProfile={saveProfile}
              isDirty={profileDirty}
              onGeneratePdf={handleGeneratePdf}
              pdfLoading={pdfLoading}
              showToast={showToast}
            />
          )}

          {activeTab === 'targets' && (
            <TargetsWorkspace
              targets={targets}
              profile={profile}
              onSaveTargets={saveTargets}
              onDeleteTarget={handleDeleteTarget}
              onOpenAddModal={() => setShowAddModal(true)}
              onOpenBulkModal={() => setShowBulkImportModal(true)}
              onTailorTarget={handleOpenTargetInTailor}
              onDispatchSelected={handleDispatchSelectedTargets}
              showToast={showToast}
            />
          )}

          {activeTab === 'tailor' && (
            <TailorWorkspace
              profile={profile}
              setProfile={setProfile}
              onSaveProfile={saveProfile}
              targets={targets}
              settings={settings}
              selectedTargetId={selectedTargetForTailor}
              setSelectedTargetId={setSelectedTargetForTailor}
              customRole={customRole}
              setCustomRole={setCustomRole}
              customCompany={customCompany}
              setCustomCompany={setCustomCompany}
              customJobText={customJobText}
              setCustomJobText={setCustomJobText}
              tailorResult={tailorResult}
              setTailorResult={setTailorResult}
              tailorLoading={tailorLoading}
              onRunTailor={handleTailorJob}
              generatedPdfUrl={generatedPdfUrl}
              generatedCoverUrl={generatedCoverUrl}
              pdfLoading={pdfLoading}
              onGeneratePdf={handleGeneratePdf}
              onGenerateCoverPdf={handleGenerateCoverPdf}
              onExtractAndSaveTarget={handleExtractAndSaveTarget}
              showToast={showToast}
            />
          )}

          {activeTab === 'dispatch' && (
            <DispatchWorkspace
              targets={targets}
              profile={profile}
              settings={settings}
              history={history}
              batchRunning={batchRunning}
              batchPaused={batchPaused}
              batchProgress={batchProgress}
              liveEvents={liveEvents}
              delayCountdown={delayCountdown}
              simulationOverride={simulationOverride}
              setSimulationOverride={setSimulationOverride}
              queuedTargetIds={queuedTargetIds}
              setQueuedTargetIds={setQueuedTargetIds}
              onStartBatch={handleStartBatch}
              onPauseBatch={handlePauseBatch}
              onResumeBatch={handleResumeBatch}
              onStopBatch={handleStopBatch}
              onClearHistory={handleClearHistory}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsWorkspace
              settings={settings}
              setSettings={setSettings}
              profile={profile}
              targets={targets}
              onSaveSettings={saveSettings}
              onTestSmtp={handleTestSmtp}
              testingEmail={testingEmail}
              emailTestResult={emailTestResult}
              onReloadAllData={loadAllData}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      <AddTargetModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        newTarget={newTarget}
        setNewTarget={setNewTarget}
        onSubmit={handleAddTarget}
        showToast={showToast}
      />

      <BulkImportModal
        open={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        text={bulkImportText}
        setText={setBulkImportText}
        onImport={handleBulkImport}
        baseCount={targets.length}
        existingTargets={targets}
      />

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        actions={commandActions}
      />
    </div>
  );
}
