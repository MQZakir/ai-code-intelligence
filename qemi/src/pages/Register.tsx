import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';

// ── Tokens ────────────────────────────────────────────────────────────────────
const BG     = '#0a0a0a';
const CARD   = '#111';
const BORDER = '#1e1e1e';
const ACCENT = '#6366f1';
const TEAL   = '#2dd4bf';
const TEXT   = '#e8e8e8';
const DIM    = '#555';
const DIM2   = '#333';
const ERR    = '#e05252';
const OK     = '#4ade80';
const MONO   = `'DM Mono', monospace`;
const SANS   = `'Instrument Sans', sans-serif`;

const pulse = keyframes`0%,100%{opacity:1}50%{opacity:0.35}`;
const ripple = keyframes`0%{transform:scale(0.85);opacity:0.5}100%{transform:scale(1.7);opacity:0}`;
const shake = keyframes`0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}`;

// ── Shared layout ─────────────────────────────────────────────────────────────

const Page = styled.div`
  width: 100%; height: 100%; background: ${BG};
  display: flex; align-items: center; justify-content: center;
  font-family: ${SANS};
`;

const Shell = styled(motion.div)`
  width: 420px;
  display: flex; flex-direction: column; gap: 2rem;
`;

const Brand = styled.div`display: flex; align-items: center; gap: 0.75rem;`;
const Wordmark = styled.div`
  font-family: ${MONO}; font-size: 1.3rem; font-weight: 500;
  color: ${TEXT}; letter-spacing: 0.12em;
`;

// ── Form primitives ───────────────────────────────────────────────────────────

const FormHead = styled.div`display: flex; flex-direction: column; gap: 0.3rem;`;
const Title = styled.h1`font-size: 1.5rem; font-weight: 600; color: ${TEXT}; font-family: ${SANS}; margin: 0;`;
const Sub = styled.p`font-size: 0.82rem; color: ${DIM}; margin: 0; font-family: ${MONO};`;

const Form = styled.form`display: flex; flex-direction: column; gap: 0.9rem;`;
const Row = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem;`;
const Field = styled.div`display: flex; flex-direction: column; gap: 0.35rem;`;
const Label = styled.label`
  font-family: ${MONO}; font-size: 0.65rem; color: ${DIM};
  letter-spacing: 0.12em; text-transform: uppercase;
`;
const Input = styled.input`
  background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 4px;
  padding: 0.7rem 0.85rem; font-size: 0.88rem; color: ${TEXT};
  font-family: ${MONO}; outline: none; transition: border-color 0.15s;
  width: 100%; box-sizing: border-box;
  &:focus { border-color: ${ACCENT}; }
  &::placeholder { color: ${DIM2}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const Btn = styled(motion.button)`
  background: ${ACCENT}; color: #fff; border: none; border-radius: 4px;
  padding: 0.75rem; font-size: 0.82rem; font-weight: 600; font-family: ${SANS};
  cursor: pointer; letter-spacing: 0.04em; margin-top: 0.25rem;
  transition: opacity 0.15s; width: 100%;
  &:hover:not(:disabled) { opacity: 0.88; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;

const GhostBtn = styled(motion.button)`
  background: transparent; color: ${DIM}; border: 1px solid ${BORDER}; border-radius: 4px;
  padding: 0.75rem; font-size: 0.82rem; font-family: ${SANS};
  cursor: pointer; letter-spacing: 0.03em; width: 100%;
  transition: all 0.15s;
  &:hover:not(:disabled) { border-color: #333; color: ${TEXT}; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;

const ErrMsg = styled.div`
  font-family: ${MONO}; font-size: 0.7rem; color: ${ERR};
  padding: 0.6rem 0.75rem; background: rgba(224,82,82,0.06);
  border-left: 2px solid ${ERR}; border-radius: 2px;
`;

const FooterLink = styled.button`
  background: none; border: none; color: ${DIM}; font-family: ${MONO};
  font-size: 0.7rem; cursor: pointer; padding: 0; text-align: left;
  transition: color 0.15s;
  &:hover { color: ${TEXT}; }
  span { color: ${ACCENT}; }
`;

// ── OTP screen ────────────────────────────────────────────────────────────────

const OtpCard = styled.div`
  background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 8px;
  padding: 2.5rem 2rem; display: flex; flex-direction: column;
  align-items: center; gap: 1.5rem; text-align: center;
`;

// Envelope icon with ripple
const EnvelopeWrap = styled.div`
  position: relative; width: 72px; height: 72px;
  display: flex; align-items: center; justify-content: center;
`;

const RippleRing = styled.div<{ $delay?: string }>`
  position: absolute; inset: 0; border-radius: 50%;
  border: 1px solid rgba(45,212,191,0.35);
  animation: ${ripple} 2.2s ease-out infinite;
  animation-delay: ${p => p.$delay ?? '0s'};
`;

const EnvelopeBg = styled.div`
  width: 72px; height: 72px; border-radius: 50%;
  background: rgba(45,212,191,0.07);
  border: 1px solid rgba(45,212,191,0.2);
  display: flex; align-items: center; justify-content: center;
  position: relative; z-index: 1;
`;

const EnvelopeIcon = () => (
  <svg width="30" height="24" viewBox="0 0 30 24" fill="none">
    <rect x="1" y="1" width="28" height="22" rx="3" stroke={TEAL} strokeWidth="1.5" />
    <path d="M1 5 L15 14 L29 5" stroke={TEAL} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M1 19 L10 12" stroke={TEAL} strokeWidth="1" strokeOpacity="0.35" strokeLinecap="round" />
    <path d="M29 19 L20 12" stroke={TEAL} strokeWidth="1" strokeOpacity="0.35" strokeLinecap="round" />
  </svg>
);

const OtpTitle = styled.div`font-family: ${SANS}; font-size: 1.3rem; font-weight: 600; color: ${TEXT};`;

const OtpEmail = styled.div`
  font-family: ${MONO}; font-size: 0.78rem; color: ${TEAL};
  background: rgba(45,212,191,0.06); border: 1px solid rgba(45,212,191,0.15);
  border-radius: 4px; padding: 0.45rem 1rem;
`;

const OtpDesc = styled.div`
  font-family: ${MONO}; font-size: 0.7rem; color: ${DIM};
  line-height: 1.7; max-width: 300px;
`;

const Divider = styled.div`width: 100%; height: 1px; background: ${BORDER};`;

// ── 6-box OTP input ───────────────────────────────────────────────────────────

const OtpBoxRow = styled.div<{ $shake: boolean }>`
  display: flex; gap: 0.5rem; justify-content: center;
  animation: ${p => p.$shake ? shake : 'none'} 0.4s ease;
`;

const OtpBox = styled.input<{ $filled: boolean; $err: boolean }>`
  width: 44px; height: 52px; border-radius: 5px; text-align: center;
  font-family: ${MONO}; font-size: 1.35rem; font-weight: 500;
  color: ${TEXT}; background: #0d0d0d; outline: none;
  border: 1px solid ${p => p.$err ? ERR : p.$filled ? ACCENT : BORDER};
  caret-color: ${ACCENT}; transition: border-color 0.15s;
  &:focus { border-color: ${ACCENT}; }
  &:disabled { opacity: 0.4; }
  /* Hide number arrows */
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
`;

const OtpActions = styled.div`display: flex; flex-direction: column; gap: 0.65rem; width: 100%;`;

const ResendRow = styled.div`
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
`;

const ResendBtn = styled.button<{ $disabled: boolean }>`
  background: none; border: none; cursor: ${p => p.$disabled ? 'default' : 'pointer'};
  font-family: ${MONO}; font-size: 0.68rem;
  color: ${p => p.$disabled ? DIM2 : ACCENT};
  transition: color 0.15s; padding: 0;
  &:hover { color: ${p => p.$disabled ? DIM2 : '#818cf8'}; }
`;

const ResendTimer = styled.span`
  font-family: ${MONO}; font-size: 0.65rem; color: ${DIM};
`;

const BlinkDot = styled.span`
  display: inline-block; width: 5px; height: 5px; border-radius: 50%;
  background: ${OK}; vertical-align: middle; margin-right: 0.4rem;
  animation: ${pulse} 1.6s ease-in-out infinite;
`;

const OtpMeta = styled.div`
  font-family: ${MONO}; font-size: 0.62rem; color: ${DIM2};
  text-align: center; line-height: 1.6;
`;

// ── Component ─────────────────────────────────────────────────────────────────

const DIGIT_COUNT = 6;

const Register = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError]         = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // OTP screen state
  const [showOtp, setShowOtp]           = useState(false);
  const [digits, setDigits]             = useState<string[]>(Array(DIGIT_COUNT).fill(''));
  const [verifying, setVerifying]       = useState(false);
  const [shakeOtp, setShakeOtp]         = useState(false);
  const [cooldown, setCooldown]         = useState(0);
  const [resending, setResending]       = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first OTP box when screen appears
  useEffect(() => {
    if (showOtp) setTimeout(() => inputRefs.current[0]?.focus(), 120);
  }, [showOtp]);

  // ── Form handlers ─────────────────────────────────────────────────────────

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
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match'); return;
      }
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        setError('Enter a valid email address'); return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters'); return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { name: formData.name } },
      });

      if (signUpError) { setError(signUpError.message); return; }

      if (data?.user) {
        await supabase.from('users').insert([{
          id: data.user.id,
          name: formData.name,
          email: formData.email,
        }]);
        // Switch to OTP screen + start 60s cooldown
        setShowOtp(true);
        startCooldown();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP handlers ──────────────────────────────────────────────────────────

  const startCooldown = () => {
    setCooldown(60);
    const iv = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(iv); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Digit input — paste or type
  const handleDigitChange = (index: number, value: string) => {
    // Handle paste of full code
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, DIGIT_COUNT);
      const next = [...digits];
      for (let i = 0; i < DIGIT_COUNT; i++) next[i] = pasted[i] ?? '';
      setDigits(next);
      setError(null);
      // Focus last filled or next empty
      const focusIdx = Math.min(pasted.length, DIGIT_COUNT - 1);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);

    if (digit && index < DIGIT_COUNT - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        // Clear current
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        // Move back
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < DIGIT_COUNT - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < DIGIT_COUNT) {
      triggerShake(); setError('Enter all 6 digits'); return;
    }

    setVerifying(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: code,
        type: 'signup',
      });

      if (verifyError) {
        triggerShake();
        setError('Invalid or expired code. Try again or resend.');
        setDigits(Array(DIGIT_COUNT).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        return;
      }

      navigate('/experience');
    } catch {
      triggerShake();
      setError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    setDigits(Array(DIGIT_COUNT).fill(''));

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      });
      if (resendError) throw resendError;
      startCooldown();
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const triggerShake = () => {
    setShakeOtp(true);
    setTimeout(() => setShakeOtp(false), 500);
  };

  // Allow pressing Enter to verify
  const handleOtpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Page>
      <AnimatePresence mode="wait">

        {/* Registration form */}
        {!showOtp && (
          <Shell
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Brand>
              <Logo size={28} color={ACCENT} />
              <Wordmark>QEMI</Wordmark>
            </Brand>

            <FormHead>
              <Title>Create account</Title>
              <Sub>// get started with qemi</Sub>
            </FormHead>

            <Form onSubmit={handleSubmit}>
              <Field>
                <Label htmlFor="name">name</Label>
                <Input
                  type="text" id="name" name="name"
                  value={formData.name} onChange={handleInputChange}
                  placeholder="Your name" required disabled={isLoading}
                />
              </Field>

              <Field>
                <Label htmlFor="email">email</Label>
                <Input
                  type="email" id="email" name="email"
                  value={formData.email} onChange={handleInputChange}
                  placeholder="you@domain.com" required disabled={isLoading}
                />
              </Field>

              <Row>
                <Field>
                  <Label htmlFor="password">password</Label>
                  <Input
                    type="password" id="password" name="password"
                    value={formData.password} onChange={handleInputChange}
                    placeholder="••••••••" required disabled={isLoading}
                  />
                </Field>
                <Field>
                  <Label htmlFor="confirmPassword">confirm</Label>
                  <Input
                    type="password" id="confirmPassword" name="confirmPassword"
                    value={formData.confirmPassword} onChange={handleInputChange}
                    placeholder="••••••••" required disabled={isLoading}
                  />
                </Field>
              </Row>

              {error && <ErrMsg>{error}</ErrMsg>}

              <Btn type="submit" disabled={isLoading} whileTap={{ scale: 0.99 }}>
                {isLoading ? 'creating account...' : 'Create account'}
              </Btn>
            </Form>

            <FooterLink onClick={() => navigate('/login')}>
              have an account? <span>sign in →</span>
            </FooterLink>
          </Shell>
        )}

        {/* OTP verification screen */}
        {showOtp && (
          <Shell
            key="otp"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ width: '440px' }}
          >
            <Brand>
              <Logo size={28} color={ACCENT} />
              <Wordmark>QEMI</Wordmark>
            </Brand>

            <OtpCard>
              {/* Envelope with ripple rings */}
              <EnvelopeWrap>
                <RippleRing />
                <RippleRing $delay="0.75s" />
                <EnvelopeBg>
                  <EnvelopeIcon />
                </EnvelopeBg>
              </EnvelopeWrap>

              <OtpTitle>Verify your email</OtpTitle>

              <OtpEmail>{formData.email}</OtpEmail>

              <OtpDesc>
                We sent a 6-digit code to that address. Enter it below to activate your account.
              </OtpDesc>

              <Divider />

              {/* 6-box OTP input */}
              <OtpBoxRow $shake={shakeOtp} onKeyDown={handleOtpKeyDown}>
                {digits.map((digit, i) => (
                  <OtpBox
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    $filled={!!digit}
                    $err={!!error && !digit}
                    disabled={verifying}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(i, e)}
                    onFocus={e => e.target.select()}
                  />
                ))}
              </OtpBoxRow>

              {error && <ErrMsg style={{ width: '100%', boxSizing: 'border-box' }}>{error}</ErrMsg>}

              <OtpActions>
                <Btn
                  as="button"
                  onClick={handleVerify}
                  disabled={verifying || digits.join('').length < DIGIT_COUNT}
                  whileTap={{ scale: 0.99 }}
                  style={{ margin: 0 }}
                >
                  {verifying ? 'verifying...' : 'Verify & continue →'}
                </Btn>
              </OtpActions>

              <Divider />

              <ResendRow>
                <OtpMeta>Didn't get a code?</OtpMeta>
                <ResendBtn
                  $disabled={cooldown > 0 || resending}
                  disabled={cooldown > 0 || resending}
                  onClick={handleResend}
                >
                  {resending ? 'sending...' : 'Resend'}
                </ResendBtn>
                {cooldown > 0 && <ResendTimer>in {cooldown}s</ResendTimer>}
              </ResendRow>

              <OtpMeta>
                <BlinkDot />
                check spam if you don't see it · code expires in 10 min
              </OtpMeta>
            </OtpCard>

            <FooterLink onClick={() => { setShowOtp(false); setError(null); setDigits(Array(DIGIT_COUNT).fill('')); }}>
              ← <span>back to registration</span>
            </FooterLink>
          </Shell>
        )}

      </AnimatePresence>
    </Page>
  );
};

export default Register;