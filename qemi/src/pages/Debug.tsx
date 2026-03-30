import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '../theme';
import {
  FaCog, FaUser, FaSignOutAlt, FaUserCircle, FaPuzzlePiece, FaSlidersH,
  FaPlay, FaStop, FaPause, FaStepForward, FaRedo, FaLevelDownAlt, FaLevelUpAlt
} from 'react-icons/fa';
import { FaSpinner } from 'react-icons/fa';
import Logo from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';
import { useDebugger } from '../contexts/DebuggerContext';
import { useFileAnalysis } from '../contexts/FileAnalysisContext';

import Overview from '../components/tabs/Overview';
import Network from '../components/tabs/Network';
import Performance from '../components/tabs/Performance';
import Errors from '../components/tabs/Errors';
import State from '../components/tabs/State';
import Sources from '../components/tabs/Sources';
import Extensions from '../components/tabs/Extensions';
import Settings from '../components/tabs/Settings';
import Profile from '../components/tabs/Profile';

// ── Tokens ─────────────────────────────────────────────────────────────────

const BG = '#0a0a0a'; const CARD = '#111'; const BORDER = '#1e1e1e';
const ACCENT = '#6366f1'; const TEXT = '#e8e8e8'; const DIM = '#444';
const ERR = '#e05252'; const OK = '#4ade80'; const WARN = '#f59e0b';
const MONO = `'DM Mono', monospace`; const SANS = `'Instrument Sans', sans-serif`;

const spin = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;

// ── Widget info (kept from original) ─────────────────────────────────────────

const widgetTypes = {
  memory:        { title: 'Memory Analysis',    details: 'Track memory usage patterns, identify potential memory leaks, and analyze garbage collection behavior. Shows heap snapshots and allocation timelines.', size: 'large' as const },
  coverage:      { title: 'Code Coverage',      details: "View which parts of your code are being executed and which aren't. Helps identify untested code paths and potential edge cases.", size: 'large' as const },
  security:      { title: 'Security',           details: 'Monitor for potential security issues, XSS attempts, CSRF attacks, and other security-related events.', size: 'medium' as const },
  dependencies:  { title: 'Dependencies',       details: 'Track third-party package versions, check for updates, and monitor dependency conflicts.', size: 'medium' as const },
  accessibility: { title: 'Accessibility',      details: 'Check for accessibility issues, ARIA violations, and screen reader compatibility.', size: 'medium' as const },
  compatibility: { title: 'Compatibility',      details: 'Monitor browser-specific issues, CSS compatibility, and JavaScript feature support.', size: 'small' as const },
  storage:       { title: 'Storage Inspector',  details: 'Inspect and modify browser storage mechanisms including cookies, localStorage, and sessionStorage.', size: 'small' as const },
  dom:           { title: 'DOM Inspector',      details: 'View and manipulate the DOM tree, inspect elements, and monitor DOM changes.', size: 'small' as const },
  events:        { title: 'Event Listeners',    details: 'Track all registered event listeners, monitor event firing, and debug event propagation issues.', size: 'small' as const },
};

// ── Layout ────────────────────────────────────────────────────────────────────

const Shell = styled.div`
  width: 100%; height: 100%; min-width: 1000px; min-height: 700px;
  display: flex; flex-direction: column; background: ${BG}; overflow: hidden;
  font-family: ${SANS};
`;

// ── Top bar ───────────────────────────────────────────────────────────────────

const TopBar = styled.div`
  height: 48px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1rem;
  border-bottom: 1px solid ${BORDER};
  background: ${BG};
  gap: 1rem;
`;

const BrandMark = styled.div`
  display: flex; align-items: center; gap: 0.55rem; flex-shrink: 0;
`;
const AppName = styled.div`
  font-family: ${MONO}; font-size: 0.85rem; font-weight: 500; color: ${TEXT}; letter-spacing: 0.14em;
`;

// ── Debug controls (step-in / step-out etc) ───────────────────────────────────

const Controls = styled.div`display: flex; align-items: center; gap: 0.35rem;`;

const CtrlBtn = styled.button<{ variant?: 'primary' | 'danger' | 'ghost' }>`
  background: ${p =>
    p.variant === 'primary' ? ACCENT :
    p.variant === 'danger'  ? 'rgba(224,82,82,0.1)' :
    'transparent'};
  color: ${p =>
    p.variant === 'primary' ? '#fff' :
    p.variant === 'danger'  ? ERR :
    DIM};
  border: 1px solid ${p =>
    p.variant === 'primary' ? ACCENT :
    p.variant === 'danger'  ? 'rgba(224,82,82,0.25)' :
    BORDER};
  border-radius: 3px;
  padding: 0 0.6rem; height: 28px;
  display: flex; align-items: center; gap: 0.35rem;
  font-family: ${MONO}; font-size: 0.65rem; letter-spacing: 0.06em;
  cursor: pointer; transition: all 0.15s; flex-shrink: 0; white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${p =>
      p.variant === 'primary' ? '#5254cc' :
      p.variant === 'danger'  ? 'rgba(224,82,82,0.18)' :
      '#1a1a1a'};
    color: ${p => p.variant === 'ghost' ? TEXT : undefined};
    border-color: ${p => p.variant === 'ghost' ? '#333' : undefined};
  }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const CtrlDivider = styled.div`width: 1px; height: 20px; background: ${BORDER}; margin: 0 0.1rem;`;

const StatusPill = styled.div<{ status: string }>`
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0 0.65rem; height: 24px; border-radius: 3px;
  border: 1px solid ${p =>
    p.status === 'running' ? 'rgba(74,222,128,0.3)' :
    p.status === 'paused'  ? 'rgba(245,158,11,0.3)' :
    p.status === 'stopped' ? 'rgba(224,82,82,0.3)' : BORDER};
  background: ${p =>
    p.status === 'running' ? 'rgba(74,222,128,0.06)' :
    p.status === 'paused'  ? 'rgba(245,158,11,0.06)' :
    p.status === 'stopped' ? 'rgba(224,82,82,0.06)' : 'transparent'};
  font-family: ${MONO}; font-size: 0.62rem; color: ${p =>
    p.status === 'running' ? OK :
    p.status === 'paused'  ? WARN :
    p.status === 'stopped' ? ERR : DIM};
  letter-spacing: 0.06em;
`;

const StatusDot = styled.div<{ status: string }>`
  width: 5px; height: 5px; border-radius: 50%;
  background: ${p =>
    p.status === 'running' ? OK : p.status === 'paused' ? WARN :
    p.status === 'stopped' ? ERR : DIM};
`;

const Spinner = styled(FaSpinner)`animation: ${spin} 0.8s linear infinite;`;

const FileLabel = styled.div`
  font-family: ${MONO}; font-size: 0.65rem; color: ${DIM};
  max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;

// ── Main content area ─────────────────────────────────────────────────────────

const Content = styled.div`flex: 1; overflow: hidden; position: relative;`;

// ── Bottom nav bar ────────────────────────────────────────────────────────────

const BottomBar = styled.div`
  height: 44px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1rem;
  border-top: 1px solid ${BORDER};
  background: ${BG};
`;

const NavTabs = styled.div`display: flex; align-items: center; gap: 0.1rem;`;

const NavTab = styled.button<{ active: boolean }>`
  background: ${p => p.active ? '#1a1a1a' : 'transparent'};
  border: none; border-radius: 3px;
  padding: 0 0.75rem; height: 28px;
  font-family: ${MONO}; font-size: 0.65rem; letter-spacing: 0.08em; text-transform: lowercase;
  color: ${p => p.active ? TEXT : DIM};
  cursor: pointer; transition: all 0.15s; white-space: nowrap; position: relative;

  &:hover { color: ${TEXT}; background: #151515; }

  ${p => p.active && `
    &::after {
      content: ''; position: absolute; bottom: 0; left: 25%; right: 25%; height: 1px;
      background: ${ACCENT};
    }
  `}
`;

const BarSide = styled.div`display: flex; align-items: center; gap: 0.35rem;`;

const IconBtn = styled.button`
  background: transparent; border: none;
  color: ${DIM}; width: 30px; height: 30px; border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s; flex-shrink: 0;
  &:hover { color: ${TEXT}; background: #1a1a1a; }
`;

// ── Dropdowns ─────────────────────────────────────────────────────────────────

const Dropdown = styled(motion.div)`
  position: absolute;
  background: #131313; border: 1px solid ${BORDER}; border-radius: 5px;
  padding: 0.35rem; min-width: 160px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5); z-index: 100;
`;
const SettingsDropdown = styled(Dropdown)`bottom: calc(100% + 6px); left: 0;`;
const ProfileDropdown  = styled(Dropdown)`bottom: calc(100% + 6px); right: 0;`;

const DropItem = styled.button<{ danger?: boolean }>`
  display: flex; align-items: center; gap: 0.6rem;
  width: 100%; padding: 0.5rem 0.65rem; border: none; background: transparent;
  border-radius: 3px; color: ${p => p.danger ? ERR : '#aaa'};
  font-family: ${MONO}; font-size: 0.72rem; cursor: pointer; transition: all 0.12s; text-align: left;
  &:hover { background: #1c1c1c; color: ${p => p.danger ? ERR : TEXT}; }
`;

const DropDivider = styled.div`height: 1px; background: ${BORDER}; margin: 0.25rem 0.4rem;`;

// ── Modal ──────────────────────────────────────────────────────────────────────

const Backdrop = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex;
  align-items: center; justify-content: center; z-index: 1000;
`;
const ModalBox = styled(motion.div)`
  background: #0f0f0f; border: 1px solid ${BORDER}; border-radius: 6px;
  padding: 1.75rem; max-width: 480px; width: 90%; position: relative;
`;
const ModalTitle = styled.div`
  font-family: ${MONO}; font-size: 0.8rem; color: ${TEXT}; margin-bottom: 0.75rem; letter-spacing: 0.06em;
`;
const ModalBody = styled.p`font-family: ${MONO}; font-size: 0.72rem; color: ${DIM}; line-height: 1.6; margin: 0;`;
const ModalClose = styled.button`
  position: absolute; top: 1rem; right: 1rem; background: transparent;
  border: none; color: ${DIM}; cursor: pointer; font-size: 1rem;
  &:hover { color: ${TEXT}; }
`;

// ── Component ─────────────────────────────────────────────────────────────────

const TABS = ['overview', 'network', 'errors', 'state', 'sources'] as const;

const Debug = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string>('');
  const [isDebugging, setIsDebugging] = useState(false);
  const [debuggingInProgress, setDebuggingInProgress] = useState(false);

  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef  = useRef<HTMLDivElement>(null);

  const { isDarkMode } = useTheme();
  const {
    debugCode, state: debuggerState, stop,
    stepInto, stepOut, stepOver, continue_, pause, restart,
  } = useDebugger();
  const { isLoading } = useFileAnalysis();

  // URL tab param
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Click-outside for dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) setShowSettingsMenu(false);
      if (profileMenuRef.current  && !profileMenuRef.current.contains(e.target as Node))  setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const widgets = [
    { id: 'memory', type: 'panel', gridArea: '1/1/2/3', isDragging: false },
    { id: 'coverage', type: 'panel', gridArea: '1/3/2/5', isDragging: false },
    { id: 'security', type: 'panel', gridArea: '2/1/3/3', isDragging: false },
    { id: 'dependencies', type: 'panel', gridArea: '2/3/3/5', isDragging: false },
    { id: 'storage', type: 'panel', gridArea: '3/1/4/2', isDragging: false },
    { id: 'dom', type: 'panel', gridArea: '3/2/4/3', isDragging: false },
    { id: 'events', type: 'panel', gridArea: '3/3/4/4', isDragging: false },
    { id: 'compatibility', type: 'panel', gridArea: '3/4/4/5', isDragging: false },
    { id: 'accessibility', type: 'panel', gridArea: '4/1/5/3', isDragging: false },
  ];

  const handleWidgetClick = (id: string) => { setSelectedWidget(id); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setSelectedWidget(null); };

  const handleFileSelect = (fileName: string, content: string) => {
    setSelectedFile(fileName);
    setSelectedFileContent(content);
  };

  const handleStartDebug = async () => {
    if (!selectedFile || !selectedFileContent || debuggingInProgress || isLoading) return;
    setDebuggingInProgress(true);
    try {
      const filename = selectedFile.split(/[\\/]/).pop() || selectedFile;
      await debugCode(selectedFileContent, filename);
      setIsDebugging(true);
      setActiveTab('overview');
    } catch (e) { console.error('Debug error:', e); }
    finally { setDebuggingInProgress(false); }
  };

  const handleStopDebug = async () => {
    try { await stop(); setIsDebugging(false); }
    catch (e) { console.error('Stop error:', e); }
  };

  // Step controls
  const handleStepInto  = () => stepInto();
  const handleStepOut   = () => stepOut();
  const handleStepOver  = () => stepOver();
  const handleContinue  = () => continue_();
  const handlePause     = () => pause();
  const handleRestart   = () => restart();

  const handleSettingsClick = (option: string) => {
    if (option === 'extensions') setActiveTab('extensions');
    if (option === 'settings')   setActiveTab('settings');
    setShowSettingsMenu(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':  return <Overview />;
      case 'network':   return <Network />;
      case 'performance': return <Performance />;
      case 'errors':    return <Errors />;
      case 'state':     return <State />;
      case 'sources':   return <Sources onFileSelect={handleFileSelect} selectedFile={selectedFile} selectedFileContent={selectedFileContent} />;
      case 'extensions': return <Extensions />;
      case 'settings':  return <Settings />;
      case 'profile':   return <Profile />;
      default:          return <Overview />;
    }
  };

  const isPaused  = debuggerState.status === 'paused';
  const isRunning = debuggerState.status === 'running';
  const isActive  = isDebugging && (isPaused || isRunning);

  return (
    <Shell>
      {/* ── Top bar ── */}
      <TopBar>
        {/* Brand */}
        <BrandMark>
          <Logo size={22} color="#6366f1" />
          <AppName>QEMI</AppName>
        </BrandMark>

        {/* Debug controls */}
        <Controls>
          {/* Start/Stop */}
          {!isDebugging ? (
            <CtrlBtn
              variant="primary"
              onClick={handleStartDebug}
              disabled={!selectedFile || debuggingInProgress || isLoading}
            >
              {debuggingInProgress || isLoading
                ? <><Spinner size={10} />&nbsp;analyzing</>
                : <><FaPlay size={9} />&nbsp;{selectedFile ? `run ${selectedFile.split(/[\\/]/).pop()}` : 'select a file'}</>
              }
            </CtrlBtn>
          ) : (
            <CtrlBtn variant="danger" onClick={handleStopDebug}>
              <FaStop size={9} />&nbsp;stop
            </CtrlBtn>
          )}

          <CtrlDivider />

          {/* Step controls — enabled only when paused */}
          <CtrlBtn variant="ghost" onClick={handleContinue} disabled={!isPaused} title="Continue (F8)">
            <FaPlay size={9} />
          </CtrlBtn>
          <CtrlBtn variant="ghost" onClick={handlePause} disabled={!isRunning} title="Pause">
            <FaPause size={9} />
          </CtrlBtn>
          <CtrlBtn variant="ghost" onClick={handleStepOver} disabled={!isPaused} title="Step Over (F10)">
            <FaStepForward size={9} />
          </CtrlBtn>
          <CtrlBtn variant="ghost" onClick={handleStepInto} disabled={!isPaused} title="Step Into (F11)">
            <FaLevelDownAlt size={9} />
          </CtrlBtn>
          <CtrlBtn variant="ghost" onClick={handleStepOut} disabled={!isPaused} title="Step Out (Shift+F11)">
            <FaLevelUpAlt size={9} />
          </CtrlBtn>
          <CtrlBtn variant="ghost" onClick={handleRestart} disabled={!isActive} title="Restart">
            <FaRedo size={9} />
          </CtrlBtn>

          <CtrlDivider />

          {/* Status */}
          {debuggerState.status !== 'disconnected' && (
            <StatusPill status={debuggerState.status}>
              <StatusDot status={debuggerState.status} />
              {debuggerState.status}
            </StatusPill>
          )}

          {/* Selected file indicator */}
          {selectedFile && (
            <FileLabel>{selectedFile.split(/[\\/]/).pop()}</FileLabel>
          )}
        </Controls>

        {/* Right spacer */}
        <div style={{ width: 80 }} />
      </TopBar>

      {/* ── Content ── */}
      <Content>{renderContent()}</Content>

      {/* ── Bottom nav ── */}
      <BottomBar>
        {/* Left — settings */}
        <BarSide style={{ position: 'relative' }} ref={settingsMenuRef as any}>
          <IconBtn onClick={() => setShowSettingsMenu(v => !v)} title="Settings">
            <FaSlidersH size={13} />
          </IconBtn>
          <AnimatePresence>
            {showSettingsMenu && (
              <SettingsDropdown
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.12 }}
              >
                <DropItem onClick={() => handleSettingsClick('settings')}>
                  <FaCog size={11} /> Settings
                </DropItem>
                <DropItem onClick={() => handleSettingsClick('extensions')}>
                  <FaPuzzlePiece size={11} /> Extensions
                </DropItem>
              </SettingsDropdown>
            )}
          </AnimatePresence>
        </BarSide>

        {/* Center — nav tabs */}
        <NavTabs>
          {TABS.map(tab => (
            <NavTab key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
              {tab}
            </NavTab>
          ))}
        </NavTabs>

        {/* Right — profile */}
        <BarSide style={{ position: 'relative' }} ref={profileMenuRef as any}>
          <IconBtn onClick={() => setShowProfileMenu(v => !v)} title="Profile">
            <FaUser size={13} />
          </IconBtn>
          <AnimatePresence>
            {showProfileMenu && (
              <ProfileDropdown
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.12 }}
              >
                <DropItem onClick={() => { setActiveTab('profile'); setShowProfileMenu(false); }}>
                  <FaUserCircle size={11} /> View profile
                </DropItem>
                <DropDivider />
                <DropItem danger onClick={() => navigate('/login')}>
                  <FaSignOutAlt size={11} /> Log out
                </DropItem>
              </ProfileDropdown>
            )}
          </AnimatePresence>
        </BarSide>
      </BottomBar>

      {/* ── Widget modal ── */}
      <AnimatePresence>
        {showModal && selectedWidget && (
          <Backdrop initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal}>
            <ModalBox
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()}
            >
              <ModalClose onClick={closeModal}>×</ModalClose>
              <ModalTitle>{widgetTypes[selectedWidget as keyof typeof widgetTypes]?.title}</ModalTitle>
              <ModalBody>{widgetTypes[selectedWidget as keyof typeof widgetTypes]?.details}</ModalBody>
            </ModalBox>
          </Backdrop>
        )}
      </AnimatePresence>
    </Shell>
  );
};

export default Debug;