import React, { useState, useEffect } from 'react';
import styled, { StyledComponent } from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { keyframes } from '@emotion/react';
import {
  FaMicrochip, FaMemory, FaBug, FaNetworkWired,
  FaLayerGroup, FaCode, FaCheckCircle, FaExclamationTriangle,
} from 'react-icons/fa';
import { useFileAnalysis } from '../../contexts/FileAnalysisContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDebugger, Variable, StackFrame } from '../../contexts/DebuggerContext';

// ── Tokens ────────────────────────────────────────────────────────────────────
const BG       = '#0a0a0a';
const CARD     = '#111';
const BORDER   = '#1e1e1e';
const ACCENT   = '#6366f1';   // indigo
const TEAL     = '#2dd4bf';   // teal
const ROSE     = '#fb7185';   // rose
const AMBER    = '#fbbf24';   // amber
const VIOLET   = '#a78bfa';   // violet
const TEXT     = '#e8e8e8';
const DIM      = '#555';
const DIM2     = '#333';
const ERR      = '#e05252';
const OK       = '#4ade80';
const WARN     = '#f59e0b';
const MONO     = `'DM Mono', monospace`;
const SANS     = `'Instrument Sans', sans-serif`;

const spin = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;
const pulse = keyframes`0%,100%{opacity:1}50%{opacity:0.4}`;

// ── Types (unchanged from original) ──────────────────────────────────────────
interface Scope {
  name: string;
  variables: Array<{ name: string; value: string; }>;
}

// ── Root layout ───────────────────────────────────────────────────────────────

const Shell = styled.div`
  width: 100%; height: 100%;
  background: ${BG}; overflow-y: auto; overflow-x: hidden;
  padding: 1.25rem 1.5rem;
  font-family: ${SANS};
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 2px; }
`;

// ── Top status bar ────────────────────────────────────────────────────────────

const StatusBar = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.25rem;
`;

const StatusLeft = styled.div`display: flex; align-items: center; gap: 0.75rem;`;

const PageLabel = styled.div`
  font-family: ${MONO}; font-size: 0.65rem; color: ${DIM};
  letter-spacing: 0.14em; text-transform: uppercase;
`;

const LiveDot = styled.div<{ $active: boolean }>`
  width: 6px; height: 6px; border-radius: 50%;
  background: ${p => p.$active ? OK : DIM};
  animation: ${p => p.$active ? pulse : 'none'} 1.8s ease-in-out infinite;
`;

const StatusPill = styled.div<{ $state: string }>`
  font-family: ${MONO}; font-size: 0.6rem; letter-spacing: 0.08em;
  padding: 0.2rem 0.65rem; border-radius: 20px;
  background: ${p =>
    p.$state === 'paused'  ? 'rgba(251,191,36,0.1)'  :
    p.$state === 'running' ? 'rgba(74,222,128,0.1)'   :
    p.$state === 'stopped' ? 'rgba(224,82,82,0.1)'    : 'rgba(85,85,85,0.1)'};
  color: ${p =>
    p.$state === 'paused'  ? AMBER :
    p.$state === 'running' ? OK    :
    p.$state === 'stopped' ? ERR   : DIM};
  border: 1px solid ${p =>
    p.$state === 'paused'  ? 'rgba(251,191,36,0.2)'  :
    p.$state === 'running' ? 'rgba(74,222,128,0.2)'   :
    p.$state === 'stopped' ? 'rgba(224,82,82,0.2)'    : BORDER};
`;

// ── Stat cards row ────────────────────────────────────────────────────────────

const StatRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: ${BORDER};
  border: 1px solid ${BORDER};
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1.25rem;
`;

const StatCard = styled.div<{ $color: string }>`
  background: ${CARD};
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: ${p => p.$color};
  }
`;

const StatIcon = styled.div<{ $color: string }>`
  color: ${p => p.$color};
  display: flex; align-items: center;
`;

const StatLabel = styled.div`
  font-family: ${MONO}; font-size: 0.58rem; color: ${DIM};
  letter-spacing: 0.12em; text-transform: uppercase;
`;

const StatValue = styled.div<{ $color?: string }>`
  font-family: ${MONO}; font-size: 1.45rem; font-weight: 500;
  color: ${p => p.$color ?? TEXT}; line-height: 1;
`;

const StatSub = styled.div`
  font-family: ${MONO}; font-size: 0.6rem; color: ${DIM};
`;

const TinyBar = styled.div<{ $pct: number; $color: string }>`
  height: 2px; background: #1a1a1a; border-radius: 2px; overflow: hidden; margin-top: 0.25rem;
  &::after {
    content: ''; display: block; height: 100%;
    width: ${p => Math.min(100, p.$pct)}%;
    background: ${p => p.$color};
    transition: width 0.4s ease;
  }
`;

// ── Main grid ─────────────────────────────────────────────────────────────────

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 1rem;
  margin-bottom: 1rem;
`;

// ── Reusable card ─────────────────────────────────────────────────────────────

const Card = styled.div<{ $span?: number }>`
  background: ${CARD};
  border: 1px solid ${BORDER};
  border-radius: 7px;
  overflow: hidden;
  grid-column: ${p => p.$span ? `span ${p.$span}` : 'span 1'};
`;

const CardHead = styled.div<{ $accent?: string }>`
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid ${BORDER};
  ${p => p.$accent ? `border-left: 2px solid ${p.$accent};` : ''}
`;

const CardTitle = styled.div`
  font-family: ${MONO}; font-size: 0.62rem; color: ${DIM};
  letter-spacing: 0.1em; text-transform: uppercase;
  display: flex; align-items: center; gap: 0.4rem;
`;

const CardCount = styled.div<{ $color?: string }>`
  font-family: ${MONO}; font-size: 0.65rem;
  color: ${p => p.$color ?? DIM};
`;

const CardBody = styled.div`padding: 0.75rem;`;

// ── Spark line (SVG mini chart) ───────────────────────────────────────────────

const SparkWrap = styled.div`
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  opacity: 0.08; pointer-events: none;
`;

// ── Variable rows ─────────────────────────────────────────────────────────────

const VarRow = styled.div`
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.38rem 0.5rem; border-radius: 3px;
  margin-bottom: 0.25rem;
  background: #131313;
  &:last-child { margin-bottom: 0; }
`;

const VarDot = styled.div<{ $color: string }>`
  width: 5px; height: 5px; border-radius: 50%;
  background: ${p => p.$color}; flex-shrink: 0;
`;

const VarName = styled.span`
  font-family: ${MONO}; font-size: 0.68rem; color: ${VIOLET}; min-width: 80px; flex-shrink: 0;
`;

const VarVal = styled.span`
  font-family: ${MONO}; font-size: 0.68rem; color: ${TEXT}; flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;

const VarType = styled.span`
  font-family: ${MONO}; font-size: 0.58rem; color: ${DIM};
`;

// ── Call stack rows ───────────────────────────────────────────────────────────

const FrameRow = styled.div<{ $top?: boolean }>`
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.38rem 0.5rem; border-radius: 3px; margin-bottom: 0.25rem;
  background: ${p => p.$top ? 'rgba(99,102,241,0.08)' : '#131313'};
  border-left: ${p => p.$top ? `2px solid ${ACCENT}` : '2px solid transparent'};
  &:last-child { margin-bottom: 0; }
`;

const FrameIdx = styled.span`
  font-family: ${MONO}; font-size: 0.6rem; color: ${DIM}; min-width: 14px;
`;

const FrameName = styled.span`
  font-family: ${MONO}; font-size: 0.68rem; color: ${TEXT}; flex: 1;
`;

const FrameLine = styled.span`
  font-family: ${MONO}; font-size: 0.6rem; color: ${TEAL};
`;

// ── Network rows ──────────────────────────────────────────────────────────────

const NetRow = styled.div`
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.38rem 0.5rem; border-radius: 3px; margin-bottom: 0.25rem;
  background: #131313; &:last-child { margin-bottom: 0; }
`;

const MethodBadge = styled.span<{ $method: string }>`
  font-family: ${MONO}; font-size: 0.58rem; font-weight: 600;
  padding: 0.1rem 0.35rem; border-radius: 2px; flex-shrink: 0;
  background: ${p =>
    p.$method === 'GET'    ? 'rgba(45,212,191,0.1)'  :
    p.$method === 'POST'   ? 'rgba(74,222,128,0.1)'  :
    p.$method === 'PUT'    ? 'rgba(251,191,36,0.1)'  :
    p.$method === 'DELETE' ? 'rgba(224,82,82,0.1)'   : 'rgba(85,85,85,0.1)'};
  color: ${p =>
    p.$method === 'GET'    ? TEAL  :
    p.$method === 'POST'   ? OK    :
    p.$method === 'PUT'    ? AMBER :
    p.$method === 'DELETE' ? ROSE  : DIM};
`;

const NetUrl = styled.span`
  font-family: ${MONO}; font-size: 0.65rem; color: ${DIM}; flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;

const NetStatus = styled.span<{ $status: number }>`
  font-family: ${MONO}; font-size: 0.62rem;
  color: ${p => p.$status >= 400 ? ROSE : p.$status >= 300 ? AMBER : TEAL};
`;

// ── Analysis panel ────────────────────────────────────────────────────────────

const AnalysisPanel = styled.div`
  background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 7px;
  overflow: hidden; margin-bottom: 1rem;
`;

const AnalysisBody = styled.div`
  padding: 1rem;
  font-family: ${MONO}; font-size: 0.7rem; color: ${DIM}; line-height: 1.75;
  white-space: pre-wrap; max-height: 240px; overflow-y: auto;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 2px; }
`;

// ── Error summary strip ───────────────────────────────────────────────────────

const ErrorStrip = styled.div`
  display: flex; gap: 0.5rem; flex-wrap: wrap; padding: 0.75rem;
`;

const ErrChip = styled.div<{ $potential: boolean }>`
  font-family: ${MONO}; font-size: 0.62rem;
  padding: 0.2rem 0.6rem; border-radius: 3px;
  background: ${p => p.$potential ? 'rgba(251,191,36,0.08)' : 'rgba(224,82,82,0.08)'};
  color: ${p => p.$potential ? AMBER : ROSE};
  border: 1px solid ${p => p.$potential ? 'rgba(251,191,36,0.2)' : 'rgba(224,82,82,0.2)'};
`;

// ── Empty / Loading ───────────────────────────────────────────────────────────

const Empty = styled.div`
  padding: 1.5rem; font-family: ${MONO}; font-size: 0.65rem; color: ${DIM2}; text-align: center;
`;

const Spinner = styled.div`
  width: 14px; height: 14px; border: 2px solid ${BORDER}; border-top-color: ${ACCENT};
  border-radius: 50%; animation: ${spin} 0.8s linear infinite; display: inline-block;
`;

// ── Color palette for variable dots ──────────────────────────────────────────
const VAR_COLORS = [ACCENT, TEAL, ROSE, AMBER, VIOLET, OK, '#f472b6', '#38bdf8'];

// ── Component ─────────────────────────────────────────────────────────────────
const Overview: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [cpuUsage, setCpuUsage] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<number[]>([]);
  const { analysis, isModelLoaded, isLoading } = useFileAnalysis();
  const { state: debuggerState } = useDebugger();

  // ── All original logic unchanged ──────────────────────────────────────────

  const getExplanationText = (text: string) => {
    try {
      const standardMatch = text.match(/### CODE EXPLANATION:\s*\n([\s\S]*?)(?=###|$)/);
      if (standardMatch && standardMatch[1]) return standardMatch[1].trim();
      const numberedMatch = text.match(/### 1\.\s*CODE EXPLANATION:\s*\n([\s\S]*?)(?=###|$)/) ||
                           text.match(/###\s*1\.\s*CODE EXPLANATION:\s*\n([\s\S]*?)(?=###|$)/);
      if (numberedMatch && numberedMatch[1]) return numberedMatch[1].trim();
      const simpleMatch = text.match(/CODE EXPLANATION[:\s]*\n([\s\S]*?)(?=\n\n[A-Z]|$)/i);
      if (simpleMatch && simpleMatch[1]) return simpleMatch[1].trim();
      const beforeErrors = text.split(/### ERRORS|### 2\.\s*ERRORS/)[0];
      if (beforeErrors && beforeErrors !== text) return beforeErrors.trim();
      if (!text.toLowerCase().includes("error:") &&
          !(text.toLowerCase().includes("line") && text.toLowerCase().includes("error"))) return text;
      return "No code explanation found in the analysis.";
    } catch { return "Error parsing the code explanation."; }
  };

  useEffect(() => {
    console.error('OVERVIEW - Analysis state changed:', {
      hasAnalysis: !!analysis, isModelLoaded,
      explanation: analysis?.explanation, errorCount: analysis?.errors?.length
    });
  }, [analysis, isModelLoaded]);

  // States data (original logic)
  const variables = debuggerState.variables.map((v, i) => ({
    name: v.name,
    value: v.values ? v.values[v.values.length - 1] : v.value,
    allValues: v.values,
    type: v.type,
    color: VAR_COLORS[i % VAR_COLORS.length],
  }));

  const callStack = debuggerState.callStack.map(frame => ({
    name: frame.function || frame.name,
    line: frame.line,
    file: frame.path || '',
  }));

  const scopes: Scope[] = debuggerState.additionalDebugData?.scopes ?? [];
  if (debuggerState.variables.length > 0 && scopes.length === 0) {
    scopes.push({ name: 'Global Scope', variables: [] });
  }

  useEffect(() => {
    const updateMetrics = async () => {
      try {
        const cpuResponse = await fetch('http://localhost:3001/api/system/cpu');
        const cpuData = await cpuResponse.json();
        setCpuUsage(cpuData.usage);
        setCpuHistory(cpuData.history);
        const memoryResponse = await fetch('http://localhost:3001/api/system/memory');
        const memoryData = await memoryResponse.json();
        setMemoryUsage(memoryData.usage);
        setMemoryHistory(memoryData.history);
      } catch { /* metrics API optional */ }
    };
    const interval = setInterval(updateMetrics, 1000);
    updateMetrics();
    return () => clearInterval(interval);
  }, []);

  const generatePath = (data: number[], w = 100, h = 40) => {
    if (data.length < 2) return '';
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / 100) * h;
      return `${x},${y}`;
    });
    return `M ${pts.join(' L ')}`;
  };

  // Derived counts for stat cards
  const errorCount   = analysis?.errors?.filter((e: any) => !e.isPotential)?.length ?? 0;
  const warningCount = analysis?.errors?.filter((e: any) => e.isPotential)?.length ?? 0;
  const netCount     = debuggerState.networkRequests.length;
  const varCount     = variables.length;
  const dbgStatus    = debuggerState.status ?? 'idle';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Shell>

      {/* ── Status bar ── */}
      <StatusBar>
        <StatusLeft>
          <LiveDot $active={dbgStatus === 'running' || dbgStatus === 'paused'} />
          <PageLabel>overview</PageLabel>
        </StatusLeft>
        <StatusPill $state={dbgStatus}>{dbgStatus}</StatusPill>
      </StatusBar>

      {/* ── 4-col stat cards ── */}
      <StatRow>
        {/* CPU */}
        <StatCard $color={ACCENT}>
          <StatIcon $color={ACCENT}><FaMicrochip size={11} /></StatIcon>
          <StatLabel>cpu</StatLabel>
          <StatValue $color={cpuUsage > 80 ? ROSE : cpuUsage > 60 ? AMBER : TEXT}>
            {cpuUsage.toFixed(1)}%
          </StatValue>
          <TinyBar $pct={cpuUsage} $color={cpuUsage > 80 ? ROSE : cpuUsage > 60 ? AMBER : ACCENT} />
          <StatSub>
            {/* sparkline */}
            {cpuHistory.length > 1 && (
              <svg width="100%" height="20" style={{ display: 'block', marginTop: 4 }}>
                <polyline
                  points={cpuHistory.map((v, i) =>
                    `${(i / (cpuHistory.length - 1)) * 100}%,${20 - (v / 100) * 18}`
                  ).join(' ')}
                  fill="none" stroke={ACCENT} strokeWidth="1" opacity="0.5"
                />
              </svg>
            )}
          </StatSub>
        </StatCard>

        {/* Memory */}
        <StatCard $color={TEAL}>
          <StatIcon $color={TEAL}><FaMemory size={11} /></StatIcon>
          <StatLabel>memory</StatLabel>
          <StatValue $color={memoryUsage > 80 ? ROSE : memoryUsage > 60 ? AMBER : TEXT}>
            {memoryUsage.toFixed(1)}%
          </StatValue>
          <TinyBar $pct={memoryUsage} $color={memoryUsage > 80 ? ROSE : memoryUsage > 60 ? AMBER : TEAL} />
          <StatSub>
            {memoryHistory.length > 1 && (
              <svg width="100%" height="20" style={{ display: 'block', marginTop: 4 }}>
                <polyline
                  points={memoryHistory.map((v, i) =>
                    `${(i / (memoryHistory.length - 1)) * 100}%,${20 - (v / 100) * 18}`
                  ).join(' ')}
                  fill="none" stroke={TEAL} strokeWidth="1" opacity="0.5"
                />
              </svg>
            )}
          </StatSub>
        </StatCard>

        {/* Errors */}
        <StatCard $color={ROSE}>
          <StatIcon $color={ROSE}><FaExclamationTriangle size={11} /></StatIcon>
          <StatLabel>errors</StatLabel>
          <StatValue $color={errorCount > 0 ? ROSE : TEXT}>{errorCount}</StatValue>
          <StatSub style={{ color: AMBER }}>
            {warningCount > 0 ? `+${warningCount} warnings` : 'no warnings'}
          </StatSub>
        </StatCard>

        {/* Variables */}
        <StatCard $color={VIOLET}>
          <StatIcon $color={VIOLET}><FaCode size={11} /></StatIcon>
          <StatLabel>variables</StatLabel>
          <StatValue $color={varCount > 0 ? VIOLET : TEXT}>{varCount}</StatValue>
          <StatSub>{callStack.length > 0 ? `${callStack.length} frames` : 'no stack'}</StatSub>
        </StatCard>
      </StatRow>

      {/* ── Main 3-col grid ── */}
      <MainGrid>

        {/* Variables card */}
        <Card>
          <CardHead $accent={VIOLET}>
            <CardTitle><FaCode size={9} color={VIOLET} />variables</CardTitle>
            <CardCount $color={VIOLET}>{varCount}</CardCount>
          </CardHead>
          <CardBody>
            {variables.length > 0 ? variables.map((v, i) => (
              <VarRow key={i}>
                <VarDot $color={v.color} />
                <VarName>{v.name}</VarName>
                <VarVal>{v.value}</VarVal>
                <VarType>{v.type}</VarType>
              </VarRow>
            )) : <Empty>no variables</Empty>}
          </CardBody>
        </Card>

        {/* Call stack card */}
        <Card>
          <CardHead $accent={ACCENT}>
            <CardTitle><FaLayerGroup size={9} color={ACCENT} />call stack</CardTitle>
            <CardCount $color={ACCENT}>{callStack.length}</CardCount>
          </CardHead>
          <CardBody>
            {callStack.length > 0 ? callStack.map((f, i) => (
              <FrameRow key={i} $top={i === 0}>
                <FrameIdx>#{i}</FrameIdx>
                <FrameName>{f.name}</FrameName>
                <FrameLine>:{f.line}</FrameLine>
              </FrameRow>
            )) : <Empty>no call stack</Empty>}
          </CardBody>
        </Card>

        {/* Network card */}
        <Card>
          <CardHead $accent={TEAL}>
            <CardTitle><FaNetworkWired size={9} color={TEAL} />network</CardTitle>
            <CardCount $color={TEAL}>{netCount}</CardCount>
          </CardHead>
          <CardBody>
            {debuggerState.networkRequests.length > 0
              ? debuggerState.networkRequests.slice(0, 8).map((req, i) => (
                  <NetRow key={i}>
                    <MethodBadge $method={req.method}>{req.method}</MethodBadge>
                    <NetUrl>{req.url}</NetUrl>
                    <NetStatus $status={req.status}>{req.status}</NetStatus>
                  </NetRow>
                ))
              : <Empty>no requests</Empty>
            }
          </CardBody>
        </Card>

        {/* Scopes card */}
        <Card>
          <CardHead $accent={AMBER}>
            <CardTitle><FaBug size={9} color={AMBER} />scopes</CardTitle>
            <CardCount $color={AMBER}>{scopes.length}</CardCount>
          </CardHead>
          <CardBody>
            {scopes.length > 0 ? scopes.map((scope, i) => (
              <div key={i}>
                <div style={{ fontFamily: MONO, fontSize: '0.6rem', color: AMBER, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  {scope.name}
                </div>
                {scope.variables.map((v, vi) => (
                  <VarRow key={vi}>
                    <VarName style={{ color: AMBER }}>{v.name}</VarName>
                    <VarVal>{v.value}</VarVal>
                  </VarRow>
                ))}
              </div>
            )) : <Empty>no scope data</Empty>}
          </CardBody>
        </Card>

        {/* Errors summary card */}
        <Card $span={2}>
          <CardHead $accent={ROSE}>
            <CardTitle><FaExclamationTriangle size={9} color={ROSE} />error summary</CardTitle>
            <CardCount $color={errorCount > 0 ? ROSE : OK}>
              {errorCount > 0 ? `${errorCount} errors` : '✓ clean'}
            </CardCount>
          </CardHead>
          {analysis?.errors && analysis.errors.length > 0 ? (
            <ErrorStrip>
              {analysis.errors.map((err: any, i: number) => (
                <ErrChip key={i} $potential={!!err.isPotential}>
                  {err.isPotential ? '⚠' : '✕'} {err.type || 'Error'} · line {err.line ?? '?'}
                </ErrChip>
              ))}
            </ErrorStrip>
          ) : (
            <Empty>
              {!analysis ? 'open a file in sources to see error analysis' : '✓ no errors detected'}
            </Empty>
          )}
        </Card>

      </MainGrid>

      {/* ── AI Analysis panel (full width) ── */}
      <AnalysisPanel>
        <CardHead $accent={ACCENT}>
          <CardTitle>
            <FaCheckCircle size={9} color={ACCENT} />
            ai code analysis
          </CardTitle>
          {isLoading && <Spinner />}
        </CardHead>
        <AnalysisBody>
          {isLoading ? (
            <span style={{ color: DIM }}>analyzing...</span>
          ) : !isModelLoaded ? (
            <span style={{ color: WARN }}>Analysis model not loaded. Ensure the model file is in the correct location.</span>
          ) : !analysis ? (
            <span>No file selected. Open a file in the Sources tab to see the analysis.</span>
          ) : analysis.explanation ? (
            getExplanationText(analysis.explanation)
          ) : (
            <span>No explanation available.</span>
          )}
        </AnalysisBody>
      </AnalysisPanel>

    </Shell>
  );
};

export default Overview;