import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const progressFill = keyframes`
  0%   { width: 0%; }
  20%  { width: 15%; }
  40%  { width: 38%; }
  60%  { width: 61%; }
  80%  { width: 83%; }
  100% { width: 100%; }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
`;

// ── Layout ──────────────────────────────────────────────────────────────────

const Wrap = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3rem;
  width: 400px;
`;

// ── Logomark + wordmark ──────────────────────────────────────────────────────

const Brand = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Wordmark = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 2.2rem;
  font-weight: 500;
  color: #fff;
  letter-spacing: 0.15em;
`;

const Tagline = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 0.65rem;
  color: #444;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-top: 0.35rem;
`;

// ── Boot log ─────────────────────────────────────────────────────────────────

const Log = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border-left: 1px solid #1e1e1e;
  padding-left: 1rem;
`;

const LogLine = styled.div<{ accent?: boolean; dim?: boolean }>`
  font-family: 'DM Mono', monospace;
  font-size: 0.68rem;
  color: ${p => p.accent ? '#6366f1' : p.dim ? '#333' : '#555'};
  letter-spacing: 0.03em;
  animation: ${fadeIn} 0.3s ease forwards;
`;

const Cursor = styled.span`
  display: inline-block;
  width: 6px;
  height: 11px;
  background: #6366f1;
  margin-left: 3px;
  vertical-align: middle;
  animation: ${blink} 1s step-end infinite;
`;

// ── Progress ──────────────────────────────────────────────────────────────────

const ProgressSection = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const ProgressMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  color: #333;
  letter-spacing: 0.08em;
`;

const Track = styled.div`
  width: 100%;
  height: 1px;
  background: #1a1a1a;
  position: relative;
  overflow: hidden;
`;

const Fill = styled.div<{ dur: number }>`
  position: absolute;
  top: 0; left: 0; bottom: 0;
  background: #6366f1;
  animation: ${progressFill} ${p => p.dur}ms ease-in-out forwards;
`;

// ── Data ─────────────────────────────────────────────────────────────────────

const DURATION = 3800;

const LINES = [
  { text: 'initializing runtime...',       accent: false, delay: 300  },
  { text: 'ai engine › ready',             accent: true,  delay: 700  },
  { text: 'static analyzer › ready',       accent: true,  delay: 1100 },
  { text: 'stack inspector › ready',       accent: true,  delay: 1500 },
  { text: 'file monitor › watching',       accent: true,  delay: 1900 },
  { text: 'auth service › connected',      accent: true,  delay: 2300 },
  { text: 'launching interface...',        accent: false, delay: 2900 },
];

// ── Component ─────────────────────────────────────────────────────────────────

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [show, setShow] = useState(true);
  const [visible, setVisible] = useState<number[]>([]);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const timers = LINES.map((l, i) =>
      setTimeout(() => setVisible(prev => [...prev, i]), l.delay)
    );

    const start = Date.now();
    const tick = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - start) / DURATION) * 100));
      setPct(p);
      if (p >= 100) clearInterval(tick);
    }, 40);

    const exit = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 450);
    }, DURATION + 100);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(tick);
      clearTimeout(exit);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <Wrap
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Inner>
            {/* Brand */}
            <Brand
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <Logo size={42} animate />
              </motion.div>
              <div>
                <Wordmark>QEMI</Wordmark>
                <Tagline>AI Debug Platform</Tagline>
              </div>
            </Brand>

            {/* Log */}
            <Log
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              {LINES.map((l, i) =>
                visible.includes(i) ? (
                  <LogLine key={i} accent={l.accent}>{l.text}</LogLine>
                ) : null
              )}
              {visible.length < LINES.length && (
                <LogLine dim><Cursor /></LogLine>
              )}
            </Log>

            {/* Progress */}
            <ProgressSection
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <ProgressMeta>
                <span>loading</span>
                <span>{pct}%</span>
              </ProgressMeta>
              <Track>
                <Fill dur={DURATION} />
              </Track>
            </ProgressSection>
          </Inner>
        </Wrap>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;