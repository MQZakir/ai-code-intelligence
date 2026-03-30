import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { theme } from '../theme';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';

// ── Shared tokens ─────────────────────────────────────────────────────────────

const BG      = '#0a0a0a';
const CARD    = '#111';
const BORDER  = '#1e1e1e';
const ACCENT  = '#6366f1';
const TEXT    = '#e8e8e8';
const DIM     = '#555';
const ERR     = '#e05252';
const MONO    = `'DM Mono', monospace`;
const SANS    = `'Instrument Sans', sans-serif`;

// ── Layout ────────────────────────────────────────────────────────────────────

const Page = styled.div`
  width: 100%;
  height: 100%;
  background: ${BG};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${SANS};
`;

const Card = styled(motion.div)`
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

// ── Brand ─────────────────────────────────────────────────────────────────────

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Wordmark = styled.div`
  font-family: ${MONO};
  font-size: 1.3rem;
  font-weight: 500;
  color: ${TEXT};
  letter-spacing: 0.12em;
`;

// ── Form section ──────────────────────────────────────────────────────────────

const FormHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${TEXT};
  font-family: ${SANS};
  margin: 0;
`;

const Sub = styled.p`
  font-size: 0.82rem;
  color: ${DIM};
  margin: 0;
  font-family: ${MONO};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const Label = styled.label`
  font-family: ${MONO};
  font-size: 0.65rem;
  color: ${DIM};
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const Input = styled.input`
  background: ${CARD};
  border: 1px solid ${BORDER};
  border-radius: 4px;
  padding: 0.7rem 0.85rem;
  font-size: 0.88rem;
  color: ${TEXT};
  font-family: ${MONO};
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    border-color: ${ACCENT};
  }

  &::placeholder { color: #333; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const Btn = styled(motion.button)`
  background: ${ACCENT};
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.82rem;
  font-weight: 600;
  font-family: ${SANS};
  cursor: pointer;
  letter-spacing: 0.04em;
  margin-top: 0.25rem;
  transition: opacity 0.15s;

  &:hover:not(:disabled) { opacity: 0.88; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;

const ErrMsg = styled.div`
  font-family: ${MONO};
  font-size: 0.7rem;
  color: ${ERR};
  padding: 0.6rem 0.75rem;
  background: rgba(224, 82, 82, 0.06);
  border-left: 2px solid ${ERR};
  border-radius: 2px;
`;

const FooterLink = styled.button`
  background: none;
  border: none;
  color: ${DIM};
  font-family: ${MONO};
  font-size: 0.7rem;
  cursor: pointer;
  padding: 0;
  text-align: left;
  transition: color 0.15s;

  &:hover { color: ${TEXT}; }

  span { color: ${ACCENT}; }
`;

// ── Component ─────────────────────────────────────────────────────────────────

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) { setError('Enter a valid email address'); return; }
      if (formData.password.length < 6)     { setError('Password must be at least 6 characters'); return; }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email, password: formData.password,
      });
      if (error) { setError(error.message || 'Sign in failed'); return; }
      if (data?.user) navigate('/debug');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page>
      <Card
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Brand>
          <Logo size={28} color="#6366f1" />
          <Wordmark>QEMI</Wordmark>
        </Brand>

        <FormHead>
          <Title>Sign in</Title>
          <Sub>// ai-powered debug platform</Sub>
        </FormHead>

        <Form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="email">email</Label>
            <Input
              type="email" id="email" name="email"
              value={formData.email} onChange={handleInputChange}
              placeholder="you@domain.com" required disabled={isLoading}
            />
          </Field>
          <Field>
            <Label htmlFor="password">password</Label>
            <Input
              type="password" id="password" name="password"
              value={formData.password} onChange={handleInputChange}
              placeholder="••••••••" required disabled={isLoading}
            />
          </Field>
          {error && <ErrMsg>{error}</ErrMsg>}
          <Btn type="submit" disabled={isLoading} whileTap={{ scale: 0.99 }}>
            {isLoading ? 'signing in...' : 'Continue'}
          </Btn>
        </Form>

        <FooterLink onClick={() => navigate('/register')}>
          no account? <span>create one →</span>
        </FooterLink>
      </Card>
    </Page>
  );
};

export default Login;