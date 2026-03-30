import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { theme } from '../theme';
import Logo from '../components/Logo';

const BG = '#0a0a0a'; const CARD = '#111'; const BORDER = '#1e1e1e';
const ACCENT = '#6366f1'; const TEXT = '#e8e8e8'; const DIM = '#555';
const MONO = `'DM Mono', monospace`; const SANS = `'Instrument Sans', sans-serif`;

const Page = styled.div`
  width: 100%; height: 100%; background: ${BG};
  display: flex; align-items: center; justify-content: center; font-family: ${SANS};
`;
const Card = styled(motion.div)`width: 420px; display: flex; flex-direction: column; gap: 2rem;`;
const Brand = styled.div`display: flex; align-items: center; gap: 0.75rem;`;
const Wordmark = styled.div`font-family: ${MONO}; font-size: 1.3rem; font-weight: 500; color: ${TEXT}; letter-spacing: 0.12em;`;
const FormHead = styled.div`display: flex; flex-direction: column; gap: 0.3rem;`;
const Title = styled.h1`font-size: 1.5rem; font-weight: 600; color: ${TEXT}; font-family: ${SANS}; margin: 0;`;
const Sub = styled.p`font-size: 0.82rem; color: ${DIM}; margin: 0; font-family: ${MONO};`;
const Grid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;`;

const LevelCard = styled(motion.button)<{ selected: boolean }>`
  background: ${p => p.selected ? 'rgba(99,102,241,0.1)' : CARD};
  border: 1px solid ${p => p.selected ? ACCENT : BORDER};
  border-radius: 6px;
  padding: 1.1rem 1rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
  display: flex; flex-direction: column; gap: 0.4rem;

  &:hover { border-color: ${p => p.selected ? ACCENT : '#333'}; }
`;

const LevelIcon = styled.div`font-size: 1.2rem;`;
const LevelName = styled.div<{ selected: boolean }>`
  font-family: ${MONO}; font-size: 0.78rem; font-weight: 500;
  color: ${p => p.selected ? ACCENT : TEXT}; letter-spacing: 0.06em;
`;
const LevelDesc = styled.div`font-family: ${MONO}; font-size: 0.62rem; color: ${DIM};`;

const SkillBar = styled.div<{ width: string; active: boolean }>`
  height: 2px; background: #1a1a1a; border-radius: 1px; overflow: hidden; margin-top: 0.3rem;
  &::after {
    content: ''; display: block; height: 100%;
    width: ${p => p.active ? p.width : '0%'};
    background: ${ACCENT}; transition: width 0.4s ease;
  }
`;

const Btn = styled(motion.button)`
  background: ${ACCENT}; color: #fff; border: none; border-radius: 4px;
  padding: 0.75rem; font-size: 0.82rem; font-weight: 600; font-family: ${SANS};
  cursor: pointer; letter-spacing: 0.04em; transition: opacity 0.15s;
  &:hover:not(:disabled) { opacity: 0.88; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const levels = [
  { id: 'beginner',     icon: '○', name: 'Beginner',     desc: 'Learning the ropes',  skill: '20%' },
  { id: 'intermediate', icon: '◐', name: 'Intermediate', desc: 'Solid foundations',   skill: '55%' },
  { id: 'advanced',     icon: '◑', name: 'Advanced',     desc: 'Complex systems',     skill: '80%' },
  { id: 'expert',       icon: '●', name: 'Expert',       desc: 'Master debugger',     skill: '100%' },
];

const ExperienceSelection = () => {
  const navigate = useNavigate();
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);

  const handleExperienceSelect = (experience: string) => setSelectedExperience(experience);
  const handleContinue = () => {
    if (selectedExperience) {
      console.log('Selected experience:', selectedExperience);
      navigate('/debug');
    }
  };

  return (
    <Page>
      <Card initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
        <Brand>
          <Logo size={28} color="#6366f1" />
          <Wordmark>QEMI</Wordmark>
        </Brand>
        <FormHead>
          <Title>Set experience level</Title>
          <Sub>// personalise your debug environment</Sub>
        </FormHead>
        <Grid>
          {levels.map((l, i) => (
            <LevelCard
              key={l.id}
              selected={selectedExperience === l.id}
              onClick={() => handleExperienceSelect(l.id)}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <LevelIcon>{l.icon}</LevelIcon>
              <LevelName selected={selectedExperience === l.id}>{l.name}</LevelName>
              <LevelDesc>{l.desc}</LevelDesc>
              <SkillBar width={l.skill} active={selectedExperience === l.id} />
            </LevelCard>
          ))}
        </Grid>
        <Btn onClick={handleContinue} disabled={!selectedExperience} whileTap={{ scale: 0.99 }}>
          Sign up
        </Btn>
      </Card>
    </Page>
  );
};

export default ExperienceSelection;