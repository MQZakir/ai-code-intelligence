import React from 'react';
import styled from '@emotion/styled';
import { FaTools } from 'react-icons/fa';
import {
  TabShell, TabHeader, TabTitle, Section, SectionHead, SectionTitle,
  MONO, TEXT, DIM, ACCENT, WARN, BORDER,
} from './tabStyles';

// ── Styled ────────────────────────────────────────────────────────────────────

const IconMark = styled.div`
  width: 36px; height: 36px; border-radius: 4px;
  background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`;

const HeadRow = styled.div`
  display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;
`;

const PageTitle = styled.div`
  font-family: ${MONO}; font-size: 0.8rem; color: ${TEXT}; letter-spacing: 0.08em;
`;

const Banner = styled.div`
  background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.2);
  border-radius: 5px; padding: 0.85rem 1rem;
  font-family: ${MONO}; font-size: 0.7rem; color: ${WARN};
  letter-spacing: 0.04em; line-height: 1.5;
`;

// ── Component ─────────────────────────────────────────────────────────────────

// Original component — Installation Guide with "coming soon" banner
const Extensions: React.FC = () => {
  return (
    <TabShell>
      <TabHeader><TabTitle>extensions</TabTitle></TabHeader>

      <HeadRow>
        <IconMark>
          <FaTools size={14} color={ACCENT} />
        </IconMark>
        <PageTitle>Installation Guide</PageTitle>
      </HeadRow>

      <Banner>
        Support for more programming languages coming soon!
      </Banner>
    </TabShell>
  );
};

export default Extensions;