import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { theme } from '../theme';
import { FaArrowLeft } from 'react-icons/fa';
import Logo from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

const BG = '#0a0a0a'; const CARD = '#111'; const BORDER = '#1e1e1e';
const ACCENT = '#6366f1'; const TEXT = '#e8e8e8'; const DIM = '#555';
const ERR = '#e05252'; const MONO = `'DM Mono', monospace`; const SANS = `'Instrument Sans', sans-serif`;

const Page = styled.div`
  width: 100%; height: 100%; background: ${BG};
  display: flex; align-items: center; justify-content: center; font-family: ${SANS}; position: relative;
`;
const BackBtn = styled.button`
  position: absolute; top: 1.25rem; left: 1.25rem;
  background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 4px;
  color: ${DIM}; width: 32px; height: 32px; display: flex; align-items: center;
  justify-content: center; cursor: pointer; transition: all 0.15s;
  &:hover { color: ${TEXT}; border-color: #333; }
`;
const Card = styled(motion.div)`width: 400px; display: flex; flex-direction: column; gap: 2rem;`;
const FormHead = styled.div`display: flex; flex-direction: column; gap: 0.3rem;`;
const Title = styled.h1`font-size: 1.5rem; font-weight: 600; color: ${TEXT}; font-family: ${SANS}; margin: 0;`;
const Sub = styled.p`font-size: 0.82rem; color: ${DIM}; margin: 0; font-family: ${MONO};`;
const Form = styled.form`display: flex; flex-direction: column; gap: 1.1rem;`;
const Field = styled.div`display: flex; flex-direction: column; gap: 0.35rem;`;
const Label = styled.label`font-family: ${MONO}; font-size: 0.65rem; color: ${DIM}; letter-spacing: 0.12em; text-transform: uppercase;`;
const Input = styled.input`
  background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 4px;
  padding: 0.7rem 0.85rem; font-size: 0.88rem; color: ${TEXT}; font-family: ${MONO};
  outline: none; transition: border-color 0.15s; width: 100%; box-sizing: border-box;
  &:focus { border-color: ${ACCENT}; }
  &::placeholder { color: #333; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;
const SectionLabel = styled.div`
  font-family: ${MONO}; font-size: 0.65rem; color: ${DIM}; letter-spacing: 0.12em; text-transform: uppercase;
`;
const LevelList = styled.div`display: flex; flex-direction: column; gap: 0.4rem;`;
const LevelOption = styled.button<{ selected: boolean }>`
  background: ${p => p.selected ? 'rgba(99,102,241,0.08)' : 'transparent'};
  border: 1px solid ${p => p.selected ? ACCENT : BORDER};
  border-radius: 4px; padding: 0.65rem 0.85rem;
  display: flex; align-items: center; gap: 0.65rem; cursor: pointer;
  transition: all 0.15s; text-align: left;
  &:hover { border-color: ${p => p.selected ? ACCENT : '#333'}; }
`;
const LevelDot = styled.div<{ selected: boolean }>`
  width: 6px; height: 6px; border-radius: 50%;
  background: ${p => p.selected ? ACCENT : '#333'};
  flex-shrink: 0; transition: background 0.15s;
`;
const LevelText = styled.div<{ selected: boolean }>`
  font-family: ${MONO}; font-size: 0.78rem;
  color: ${p => p.selected ? TEXT : DIM}; letter-spacing: 0.04em;
`;
const Btn = styled(motion.button)`
  background: ${ACCENT}; color: #fff; border: none; border-radius: 4px;
  padding: 0.75rem; font-size: 0.82rem; font-weight: 600; font-family: ${SANS};
  cursor: pointer; letter-spacing: 0.04em; transition: opacity 0.15s; margin-top: 0.25rem;
  &:hover:not(:disabled) { opacity: 0.88; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;
const ErrMsg = styled.div`
  font-family: ${MONO}; font-size: 0.7rem; color: ${ERR};
  padding: 0.6rem 0.75rem; background: rgba(224,82,82,0.06); border-left: 2px solid ${ERR}; border-radius: 2px;
`;

const levels = [
  { value: 'beginner',     label: 'Beginner',     icon: '○' },
  { value: 'intermediate', label: 'Intermediate', icon: '◐' },
  { value: 'expert',       label: 'Expert',       icon: '●' },
];

const EditProfile = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({ name: '', experience_level: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) throw new Error('No user found');
        const { data: profileData, error: profileError } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (profileError) throw profileError;
        setFormData({ name: profileData.name, experience_level: profileData.experience_level });
      } catch { setError('Failed to load profile data'); }
    };
    fetchUserProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleExperienceSelect = (experience: string) => {
    setFormData(prev => ({ ...prev, experience_level: experience }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(null);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('No user found');
      const { error: updateError } = await supabase.from('users').update({ name: formData.name, experience_level: formData.experience_level }).eq('id', user.id);
      if (updateError) throw updateError;
      navigate('/debug');
    } catch { setError('Failed to update profile'); } finally { setIsLoading(false); }
  };

  return (
    <Page>
      <BackBtn onClick={() => navigate('/debug?tab=profile')}><FaArrowLeft size={12} /></BackBtn>
      <Card initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <FormHead>
          <Title>Edit profile</Title>
          <Sub>// update your information</Sub>
        </FormHead>
        <Form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="name">name</Label>
            <Input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required disabled={isLoading} placeholder="Your name" />
          </Field>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <SectionLabel>experience level</SectionLabel>
            <LevelList>
              {levels.map(l => (
                <LevelOption key={l.value} selected={formData.experience_level === l.value} onClick={() => handleExperienceSelect(l.value)} type="button">
                  <LevelDot selected={formData.experience_level === l.value} />
                  <LevelText selected={formData.experience_level === l.value}>{l.icon}&nbsp;&nbsp;{l.label}</LevelText>
                </LevelOption>
              ))}
            </LevelList>
          </div>
          {error && <ErrMsg>{error}</ErrMsg>}
          <Btn type="submit" disabled={isLoading || !formData.name || !formData.experience_level} whileTap={{ scale: 0.99 }}>
            {isLoading ? 'saving...' : 'Save changes'}
          </Btn>
        </Form>
      </Card>
    </Page>
  );
};

export default EditProfile;