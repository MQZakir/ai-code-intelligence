import styled from '@emotion/styled';

export const BG = '#0a0a0a';
export const CARD = '#111';
export const BORDER = '#1e1e1e';
export const ACCENT = '#6366f1';
export const TEXT = '#e8e8e8';
export const DIM = '#555';
export const DIM2 = '#333';
export const ERR = '#e05252';
export const OK = '#4ade80';
export const WARN = '#f59e0b';
export const MONO = `'DM Mono', monospace`;
export const SANS = `'Instrument Sans', sans-serif`;

export const TabShell = styled.div`
  width: 100%; height: 100%;
  background: ${BG}; overflow: auto; padding: 1.5rem;
  font-family: ${SANS};
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 2px; }
`;

export const TabHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.5rem;
`;

export const TabTitle = styled.div`
  font-family: ${MONO}; font-size: 0.7rem; color: ${DIM};
  letter-spacing: 0.12em; text-transform: uppercase;
`;

export const Grid = styled.div<{ cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${p => p.cols ?? 3}, 1fr);
  gap: 1px; background: ${BORDER};
  border: 1px solid ${BORDER}; border-radius: 6px; overflow: hidden;
`;

export const Panel = styled.div`
  background: ${CARD}; padding: 1.1rem; display: flex; flex-direction: column; gap: 0.5rem;
`;

export const PanelLabel = styled.div`
  font-family: ${MONO}; font-size: 0.6rem; color: ${DIM}; letter-spacing: 0.12em; text-transform: uppercase;
`;

export const PanelValue = styled.div<{ accent?: boolean; ok?: boolean; warn?: boolean; err?: boolean }>`
  font-family: ${MONO}; font-size: 1rem; font-weight: 500;
  color: ${p => p.accent ? ACCENT : p.ok ? OK : p.warn ? WARN : p.err ? ERR : TEXT};
`;

export const PanelSub = styled.div`
  font-family: ${MONO}; font-size: 0.62rem; color: ${DIM};
`;

export const Section = styled.div`
  background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 6px;
  overflow: hidden; margin-bottom: 1rem;
`;

export const SectionHead = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.65rem 1rem; border-bottom: 1px solid ${BORDER};
`;

export const SectionTitle = styled.div`
  font-family: ${MONO}; font-size: 0.65rem; color: ${DIM}; letter-spacing: 0.1em; text-transform: uppercase;
`;

export const SmallBtn = styled.button`
  background: transparent; border: 1px solid ${BORDER}; border-radius: 3px;
  color: ${DIM}; font-family: ${MONO}; font-size: 0.6rem;
  padding: 0.25rem 0.6rem; cursor: pointer; transition: all 0.12s; letter-spacing: 0.06em;
  &:hover { color: ${TEXT}; border-color: #333; }
`;

export const Table = styled.table`width: 100%; border-collapse: collapse;`;
export const Th = styled.th`
  text-align: left; padding: 0.55rem 1rem;
  font-family: ${MONO}; font-size: 0.6rem; color: ${DIM}; letter-spacing: 0.08em;
  font-weight: 400; border-bottom: 1px solid ${BORDER};
`;
export const Td = styled.td`
  padding: 0.5rem 1rem; font-family: ${MONO}; font-size: 0.72rem; color: ${TEXT};
  border-bottom: 1px solid #161616; vertical-align: middle;
`;
export const Tr = styled.tr`
  &:last-child td { border-bottom: none; }
  &:hover td { background: #131313; }
`;

export const Badge = styled.span<{ type?: 'ok' | 'err' | 'warn' | 'info' | 'accent' }>`
  display: inline-block; padding: 0.15rem 0.45rem; border-radius: 2px;
  font-family: ${MONO}; font-size: 0.6rem; font-weight: 500; letter-spacing: 0.04em;
  background: ${p =>
    p.type === 'ok'     ? 'rgba(74,222,128,0.1)' :
    p.type === 'err'    ? 'rgba(224,82,82,0.1)' :
    p.type === 'warn'   ? 'rgba(245,158,11,0.1)' :
    p.type === 'info'   ? 'rgba(99,102,241,0.1)' :
    p.type === 'accent' ? 'rgba(99,102,241,0.15)' : '#1a1a1a'};
  color: ${p =>
    p.type === 'ok'     ? OK :
    p.type === 'err'    ? ERR :
    p.type === 'warn'   ? WARN :
    p.type === 'info'   ? ACCENT :
    p.type === 'accent' ? ACCENT : DIM};
`;

export const EmptyState = styled.div`
  padding: 2.5rem 1rem; text-align: center;
  font-family: ${MONO}; font-size: 0.7rem; color: ${DIM2};
`;

export const MiniBar = styled.div<{ pct: number; color?: string }>`
  height: 3px; background: #1a1a1a; border-radius: 2px; overflow: hidden;
  &::after {
    content: ''; display: block; height: 100%;
    width: ${p => Math.min(100, p.pct)}%;
    background: ${p => p.color ?? ACCENT};
    transition: width 0.4s ease;
  }
`;