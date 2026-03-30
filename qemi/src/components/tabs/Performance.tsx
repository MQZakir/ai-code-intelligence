import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { FaMicrochip, FaMemory } from 'react-icons/fa';
import {
  TabShell, TabHeader, TabTitle, Section, SectionHead, SectionTitle,
  MONO, TEXT, DIM, ACCENT, BORDER, CARD, ERR, WARN,
} from './tabStyles';

// ── Styled ────────────────────────────────────────────────────────────────────

const TwoCol = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;`;

const MetricCard = styled.div`
  background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 6px;
  padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;
`;

const MetricHead = styled.div`display: flex; align-items: center; gap: 0.5rem;`;

const MetricLabel = styled.div`
  font-family: ${MONO}; font-size: 0.6rem; color: ${DIM};
  letter-spacing: 0.12em; text-transform: uppercase;
`;

const MetricValue = styled.div<{ warn?: boolean; err?: boolean }>`
  font-family: ${MONO}; font-size: 2rem; font-weight: 500;
  color: ${p => p.err ? ERR : p.warn ? WARN : TEXT};
  line-height: 1;
`;

const MetricUnit = styled.span`
  font-family: ${MONO}; font-size: 1rem; color: ${DIM}; margin-left: 0.2rem;
`;

const BarTrack = styled.div`
  height: 3px; background: #1a1a1a; border-radius: 2px; overflow: hidden;
`;

const BarFill = styled.div<{ pct: number }>`
  height: 100%;
  width: ${p => Math.min(100, p.pct)}%;
  background: ${p => p.pct > 80 ? ERR : p.pct > 60 ? WARN : ACCENT};
  transition: width 0.35s ease;
`;

// ── Component ─────────────────────────────────────────────────────────────────

const Performance: React.FC = () => {
  const [cpuUsage, setCpuUsage] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);

  // Original simulation logic preserved exactly
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => Math.min(100, Math.max(0, prev + (Math.random() * 10 - 5))));
      setMemoryUsage(prev => Math.min(100, Math.max(0, prev + (Math.random() * 5 - 2.5))));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TabShell>
      <TabHeader><TabTitle>performance</TabTitle></TabHeader>

      <TwoCol>
        <MetricCard>
          <MetricHead>
            <FaMicrochip size={12} color={DIM} />
            <MetricLabel>cpu usage</MetricLabel>
          </MetricHead>
          <MetricValue warn={cpuUsage > 60} err={cpuUsage > 80}>
            {cpuUsage.toFixed(1)}<MetricUnit>%</MetricUnit>
          </MetricValue>
          <BarTrack><BarFill pct={cpuUsage} /></BarTrack>
        </MetricCard>

        <MetricCard>
          <MetricHead>
            <FaMemory size={12} color={DIM} />
            <MetricLabel>memory usage</MetricLabel>
          </MetricHead>
          <MetricValue warn={memoryUsage > 60} err={memoryUsage > 80}>
            {memoryUsage.toFixed(1)}<MetricUnit>%</MetricUnit>
          </MetricValue>
          <BarTrack><BarFill pct={memoryUsage} /></BarTrack>
        </MetricCard>
      </TwoCol>
    </TabShell>
  );
};

export default Performance;