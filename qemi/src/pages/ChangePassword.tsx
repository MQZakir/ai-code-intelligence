import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import { theme } from '../theme';
import { FaArrowLeft } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';

const spin = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;

const BG = '#0a0a0a'; const CARD = '#111'; const BORDER = '#1e1e1e';
const ACCENT = '#6366f1'; const TEXT = '#e8e8e8'; const DIM = '#555';
const ERR = '#e05252'; const OK = '#4ade80'; const MONO = `'DM Mono', monospace`; const SANS = `'Instrument Sans', sans-serif`;

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
const Card = styled(motion.div)`width: 380px; display: flex; flex-direction: column; gap: 2rem;`;
const FormHead = styled.div`display: flex; flex-direction: column; gap: 0.3rem;`;
const Title = styled.h1`font-size: 1.5rem; font-weight: 600; color: ${TEXT}; font-family: ${SANS}; margin: 0;`;
const Sub = styled.p`font-size: 0.82rem; color: ${DIM}; margin: 0; font-family: ${MONO};`;
const Form = styled.form`display: flex; flex-direction: column; gap: 1rem;`;
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
const Btn = styled(motion.button)`
  background: ${ACCENT}; color: #fff; border: none; border-radius: 4px;
  padding: 0.75rem; font-size: 0.82rem; font-weight: 600; font-family: ${SANS};
  cursor: pointer; letter-spacing: 0.04em; margin-top: 0.25rem; transition: opacity 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  &:hover:not(:disabled) { opacity: 0.88; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;
const Spinner = styled.div`
  width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  border-radius: 50%; animation: ${spin} 0.7s linear infinite;
`;
const ErrMsg = styled.div`
  font-family: ${MONO}; font-size: 0.7rem; color: ${ERR};
  padding: 0.6rem 0.75rem; background: rgba(224,82,82,0.06); border-left: 2px solid ${ERR}; border-radius: 2px;
`;
const OkMsg = styled.div`
  font-family: ${MONO}; font-size: 0.7rem; color: ${OK};
  padding: 0.6rem 0.75rem; background: rgba(74,222,128,0.06); border-left: 2px solid ${OK}; border-radius: 2px;
`;

const ChangePassword = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(null);
    if (formData.newPassword !== formData.confirmPassword) { setError('Passwords do not match'); setIsLoading(false); return; }
    try {
      const { error } = await supabase.auth.updateUser({ password: formData.newPassword });
      if (error) throw error;
      setSuccess('Password updated successfully');
      setIsRedirecting(true);
      setTimeout(() => navigate('/debug'), 2000);
    } catch { setError('Failed to update password'); } finally { setIsLoading(false); }
  };

  return (
    <Page>
      <BackBtn onClick={() => navigate('/debug?tab=profile')}><FaArrowLeft size={12} /></BackBtn>
      <Card initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <FormHead>
          <Title>Change password</Title>
          <Sub>// update your credentials</Sub>
        </FormHead>
        <Form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="currentPassword">current password</Label>
            <Input type="password" id="currentPassword" name="currentPassword" value={formData.currentPassword} onChange={handleInputChange} placeholder="••••••••" required disabled={isLoading} />
          </Field>
          <Field>
            <Label htmlFor="newPassword">new password</Label>
            <Input type="password" id="newPassword" name="newPassword" value={formData.newPassword} onChange={handleInputChange} placeholder="••••••••" required disabled={isLoading} />
          </Field>
          <Field>
            <Label htmlFor="confirmPassword">confirm new password</Label>
            <Input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="••••••••" required disabled={isLoading} />
          </Field>
          {error && <ErrMsg>{error}</ErrMsg>}
          {success && <OkMsg>{success}</OkMsg>}
          <Btn type="submit" disabled={isLoading || isRedirecting} whileTap={{ scale: 0.99 }}>
            {isRedirecting ? <><Spinner />redirecting...</> : isLoading ? <><Spinner />updating...</> : 'Update password'}
          </Btn>
        </Form>
      </Card>
    </Page>
  );
};

export default ChangePassword;