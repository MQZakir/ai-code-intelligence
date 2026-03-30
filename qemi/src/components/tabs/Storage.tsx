import React, { useState } from 'react';
import styled from '@emotion/styled';
import {
  TabShell, TabHeader, TabTitle, Section, SectionHead, SectionTitle,
  Table, Th, Td, Tr,
  MONO, TEXT, DIM, ACCENT, BORDER, CARD,
} from './tabStyles';

// ── Types (unchanged from original) ──────────────────────────────────────────

type StorageType = 'cookies' | 'localStorage' | 'sessionStorage' | 'indexedDB';

// ── Styled ────────────────────────────────────────────────────────────────────

const Chips = styled.div`display: flex; gap: 0.3rem; flex-wrap: wrap;`;

const Chip = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? ACCENT : 'transparent'};
  border: 1px solid ${p => p.$active ? ACCENT : BORDER}; border-radius: 3px;
  padding: 0.22rem 0.65rem; font-family: ${MONO}; font-size: 0.62rem;
  color: ${p => p.$active ? '#fff' : DIM}; cursor: pointer; transition: all 0.12s;
  &:hover { border-color: ${p => p.$active ? ACCENT : '#333'}; color: ${p => p.$active ? '#fff' : TEXT}; }
`;

// ── Component ─────────────────────────────────────────────────────────────────

// Original static demo data preserved exactly
const DEMO_ROWS = [
  { name: 'authToken', value: 'eyJhbGciOiJ...', domain: 'example.com', expires: 'Session', size: '2.1 KB' },
  { name: 'userId',   value: 'u12345',          domain: 'example.com', expires: '1 month', size: '12 B' },
  { name: 'theme',    value: 'dark',             domain: 'example.com', expires: '1 year',  size: '4 B' },
  { name: 'lastVisit', value: '2023-05-10T13:45:22Z', domain: 'example.com', expires: 'Session', size: '24 B' },
];

const Storage: React.FC = () => {
  const [activeStorage, setActiveStorage] = useState<StorageType>('cookies');

  const tabs: { id: StorageType; label: string }[] = [
    { id: 'cookies',        label: 'Cookies' },
    { id: 'localStorage',   label: 'Local Storage' },
    { id: 'sessionStorage', label: 'Session Storage' },
    { id: 'indexedDB',      label: 'IndexedDB' },
  ];

  return (
    <TabShell>
      <TabHeader>
        <TabTitle>storage</TabTitle>
      </TabHeader>

      <Section>
        <SectionHead>
          <SectionTitle>{tabs.find(t => t.id === activeStorage)?.label.toLowerCase()}</SectionTitle>
          <Chips>
            {tabs.map(t => (
              <Chip key={t.id} $active={activeStorage === t.id} onClick={() => setActiveStorage(t.id)}>
                {t.label}
              </Chip>
            ))}
          </Chips>
        </SectionHead>

        <Table>
          <thead>
            <tr>
              <Th>name</Th>
              <Th>value</Th>
              <Th>domain</Th>
              <Th>expires</Th>
              <Th>size</Th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ROWS.map((row, i) => (
              <Tr key={i}>
                <Td style={{ color: ACCENT }}>{row.name}</Td>
                <Td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.value}
                </Td>
                <Td style={{ color: DIM }}>{row.domain}</Td>
                <Td style={{ color: DIM }}>{row.expires}</Td>
                <Td style={{ color: DIM }}>{row.size}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Section>
    </TabShell>
  );
};

export default Storage;