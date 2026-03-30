import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useDebugger } from '../../contexts/DebuggerContext';
import {
  TabShell, TabHeader, TabTitle, Section, SectionHead, SectionTitle, SmallBtn,
  Table, Th, Td, Tr, Badge, EmptyState,
  MONO, TEXT, DIM, ACCENT, BORDER, CARD, OK, ERR, WARN,
} from './tabStyles';

// ── Filter chips ──────────────────────────────────────────────────────────────

const Chips = styled.div`display: flex; gap: 0.3rem;`;

const Chip = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? ACCENT : 'transparent'};
  border: 1px solid ${p => p.$active ? ACCENT : BORDER};
  border-radius: 3px; padding: 0.22rem 0.65rem;
  font-family: ${MONO}; font-size: 0.62rem;
  color: ${p => p.$active ? '#fff' : DIM};
  cursor: pointer; transition: all 0.12s;
  &:hover { border-color: ${p => p.$active ? ACCENT : '#333'}; color: ${p => p.$active ? '#fff' : TEXT}; }
`;

// ── Method badge colours (same logic as original) ─────────────────────────────

const methodColor = (m: string) => {
  switch (m) {
    case 'GET':    return '#38bdf8';
    case 'POST':   return '#4ade80';
    case 'PUT':    return WARN;
    case 'DELETE': return ERR;
    default:       return DIM;
  }
};

const statusBadgeType = (s: number): 'ok' | 'warn' | 'err' | 'info' =>
  s >= 500 ? 'err' : s >= 400 ? 'err' : s >= 300 ? 'warn' : 'ok';

// ── Component ─────────────────────────────────────────────────────────────────

const Network: React.FC = () => {
  const { state: debuggerState, clearNetworkRequests } = useDebugger();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Original filter logic preserved exactly
  const requests = debuggerState.networkRequests.map(req => ({
    method: req.method,
    url: req.url,
    status: req.status,
    time: `${req.time}ms`,
    type: req.type || 'xhr',
    contentType: req.contentType,
  }));

  const filteredRequests = activeFilter === 'all'
    ? requests
    : requests.filter(req => req.type.toLowerCase() === activeFilter.toLowerCase());

  return (
    <TabShell>
      <TabHeader>
        <TabTitle>network</TabTitle>
        <SmallBtn onClick={clearNetworkRequests}>clear</SmallBtn>
      </TabHeader>

      <Section>
        <SectionHead>
          <SectionTitle>requests ({filteredRequests.length})</SectionTitle>
          <Chips>
            {['all', 'xhr', 'fetch'].map(f => (
              <Chip key={f} $active={activeFilter === f} onClick={() => setActiveFilter(f)}>
                {f}
              </Chip>
            ))}
          </Chips>
        </SectionHead>

        {requests.length === 0 ? (
          <EmptyState>
            no network requests detected<br />
            <span style={{ fontSize: '0.62rem', display: 'block', marginTop: '0.3rem' }}>
              select a file in sources and start debugging to monitor requests
            </span>
          </EmptyState>
        ) : filteredRequests.length === 0 ? (
          <EmptyState>no {activeFilter} requests</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>method</Th>
                <Th>url</Th>
                <Th>status</Th>
                <Th>type</Th>
                <Th>time</Th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req, i) => (
                <Tr key={i}>
                  <Td>
                    <span style={{ fontFamily: MONO, fontSize: '0.72rem', fontWeight: 600, color: methodColor(req.method) }}>
                      {req.method}
                    </span>
                  </Td>
                  <Td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {req.url}
                  </Td>
                  <Td>
                    <Badge type={statusBadgeType(req.status)}>{req.status}</Badge>
                  </Td>
                  <Td style={{ color: DIM }}>{req.contentType || req.type}</Td>
                  <Td style={{ color: DIM }}>{req.time}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
    </TabShell>
  );
};

export default Network;