import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFileAnalysis } from '../../contexts/FileAnalysisContext';
import {
  BG, CARD, BORDER, ACCENT, TEXT, DIM, DIM2, ERR, OK, WARN, MONO, SANS,
  TabShell, TabHeader, TabTitle, Section, SectionHead, SectionTitle, EmptyState, Badge,
} from './tabStyles';

const spin = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;

// ── Styled components (QEMI design) ──────────────────────────────────────────

const Spinner = styled.div`
  width:16px;height:16px;border:2px solid ${BORDER};border-top-color:${ACCENT};
  border-radius:50%;animation:${spin} 0.8s linear infinite;margin:1.5rem auto;
`;

const ErrorCard = styled(motion.div)<{isPotential:boolean}>`
  background:${CARD};border:1px solid ${BORDER};
  border-left:3px solid ${p=>p.isPotential?WARN:ERR};
  border-radius:6px;padding:1rem;margin-bottom:0.65rem;cursor:pointer;
  transition:border-color 0.15s;
  &:hover{border-color:${p=>p.isPotential?WARN:ERR};}
`;

const ErrHeader = styled.div`
  display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;
`;

const ErrType = styled.span<{isPotential:boolean}>`
  font-family:${MONO};font-size:0.75rem;font-weight:500;
  color:${p=>p.isPotential?WARN:ERR};letter-spacing:0.04em;
`;

const ErrLine = styled.span`
  font-family:${MONO};font-size:0.62rem;color:${DIM};
  background:#1a1a1a;padding:0.15rem 0.45rem;border-radius:2px;
`;

const ErrDesc = styled.div`
  font-family:${MONO};font-size:0.7rem;color:${DIM};line-height:1.6;
  white-space:pre-wrap;margin-bottom:0.5rem;
`;

const ErrFix = styled.div`
  font-family:${MONO};font-size:0.68rem;color:${TEXT};
  padding:0.55rem 0.75rem;background:#131313;border-left:2px solid ${ACCENT};
  border-radius:2px;line-height:1.55;
`;

const ErrSnippet = styled.pre`
  font-family:${MONO};font-size:0.68rem;background:#131313;
  padding:0.55rem 0.75rem;border-radius:3px;margin-bottom:0.5rem;
  color:${TEXT};overflow-x:auto;white-space:pre;
`;

const NoErrorsBox = styled.div`
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:2.5rem 1rem;text-align:center;gap:0.75rem;
`;
const NoErrorsMsg = styled.div`
  font-family:${MONO};font-size:0.78rem;color:${OK};letter-spacing:0.06em;
`;
const NoErrorsText = styled.div`
  font-family:${MONO};font-size:0.68rem;color:${DIM};line-height:1.65;
  max-width:620px;text-align:left;white-space:pre-wrap;
`;

const TagRow = styled.div`display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;`;

// ── Modal ─────────────────────────────────────────────────────────────────────

const Backdrop = styled(motion.div)`
  position:fixed;inset:0;background:rgba(0,0,0,0.75);
  display:flex;align-items:center;justify-content:center;z-index:1000;
`;
const ModalBox = styled(motion.div)`
  background:#0f0f0f;border:1px solid ${BORDER};border-radius:6px;
  padding:1.75rem;max-width:560px;width:90%;max-height:80vh;
  overflow-y:auto;position:relative;
`;
const ModalClose = styled.button`
  position:absolute;top:1rem;right:1rem;background:transparent;
  border:none;color:${DIM};cursor:pointer;font-size:1rem;line-height:1;
  &:hover{color:${TEXT};}
`;
const ModalHead = styled.div<{isPotential:boolean}>`
  font-family:${MONO};font-size:0.82rem;color:${p=>p.isPotential?WARN:ERR};
  margin-bottom:1rem;font-weight:500;letter-spacing:0.04em;
`;
const ModalSection = styled.div`margin-bottom:1.25rem;`;
const ModalLabel = styled.div`
  font-family:${MONO};font-size:0.6rem;color:${DIM};letter-spacing:0.1em;
  text-transform:uppercase;margin-bottom:0.35rem;
`;
const ModalContent = styled.div`
  font-family:${MONO};font-size:0.7rem;color:${TEXT};line-height:1.65;white-space:pre-wrap;
`;

// ── Types (unchanged from original) ──────────────────────────────────────────

interface ErrorInfo {
  line: string;
  type: string;
  description: string;
  isPotential: boolean;
  solution?: string;
  predictedFix?: string;
  predictedBehavior?: string;
  codeSnippet?: string;
  notInCode?: boolean;
  index?: number;
}

interface APIError {
  line?: number;
  type?: string;
  description?: string;
  solution?: string;
  isPotential?: boolean;
  index?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

const Errors: React.FC = () => {
  const { analysis, isModelLoaded, isLoading } = useFileAnalysis();
  const [selectedError, setSelectedError] = useState<number | null>(null);
  const [errorsList, setErrorsList] = useState<ErrorInfo[]>([]);
  const [noErrorsText, setNoErrorsText] = useState<string>("");

  // ── All original parsing logic exactly preserved ─────────────────────────────

  useEffect(() => {
    console.log("Analysis updated:", analysis);
    if (analysis?.errors && analysis.errors.length > 0) {
      console.log("Using errors directly from API response:", analysis.errors);
      const sortedErrors = [...analysis.errors].sort((a, b) => (a.line || 999999) - (b.line || 999999));
      const formattedErrors: ErrorInfo[] = [];
      for (let i = 0; i < sortedErrors.length; i++) {
        const err = sortedErrors[i];
        let errorType = err.type || "Error";
        let errorDesc = err.description || "";
        let errorSolution = err.solution || "";
        if (errorType.includes("Description")) {
          const parts = errorType.split(/\s*-\s*Description/);
          errorType = parts[0].trim();
          if (parts.length > 1) errorDesc = parts[1].trim() + (errorDesc ? " " + errorDesc : "");
        }
        if (errorDesc.includes("Fix:") || errorDesc.includes("Solution:")) {
          const fixParts = errorDesc.split(/\s*-\s*(?:Fix|Solution):/);
          if (fixParts.length > 1) { errorDesc = fixParts[0].trim(); errorSolution = fixParts[1].trim() + (errorSolution ? " " + errorSolution : ""); }
        }
        const isPotential = err.isPotential === true || errorType.toLowerCase().includes('potential') || errorType.toLowerCase().includes('warning');
        formattedErrors.push({ line: err.line ? err.line.toString() : "?", type: errorType, description: errorDesc, isPotential, solution: errorSolution, index: i });
      }
      setErrorsList(formattedErrors);
    } else if (analysis?.explanation && analysis.explanation.includes("### ERRORS")) {
      parseAnalysis(analysis.explanation);
    } else if (analysis?.explanation && (analysis.explanation.match(/\d+\.\s+Line\s+\d+:/) || analysis.explanation.match(/\(\s*Potential\s+error\s*\)\s+Line\s+\d+:/))) {
      const errors: ErrorInfo[] = [];
      const errorRegex = /(?:\d+\.\s+|\(\s*Potential\s+error\s*\)\s+)Line\s+(\d+):.*?(?=(?:\d+\.\s+|\(\s*Potential\s+error\s*\)\s+)Line\s+\d+:|$)/gs;
      let errorMatches; let index = 0;
      while ((errorMatches = errorRegex.exec(analysis.explanation)) !== null) {
        const errorBlock = errorMatches[0];
        const isPotential = errorBlock.toLowerCase().includes('potential error');
        const lineMatch = errorBlock.match(/Line\s+(\d+)/i);
        const lineNumber = lineMatch ? lineMatch[1] : "?";
        let errorType = "Error";
        const typeMatch = errorBlock.match(/Type\s+of\s+error:\s+([^\n]+)/i);
        if (typeMatch) errorType = typeMatch[1].trim();
        let description = "";
        const descMatch = errorBlock.match(/Description:\s+([^\n]+(?:\n\s+[^\n]+)*)/i);
        if (descMatch) description = descMatch[1].trim();
        let solution = "";
        const fixMatch = errorBlock.match(/Fix:\s+([^\n]+(?:\n\s+[^\n]+)*)/i);
        if (fixMatch) solution = fixMatch[1].trim();
        errors.push({ line: lineNumber, type: errorType, description, isPotential, solution, index: index++ });
      }
      if (errors.length > 0) setErrorsList(errors);
      else parseAnalysis(analysis.explanation);
    } else if (analysis?.explanation) {
      parseAnalysis(analysis.explanation);
    } else if (analysis) {
      setErrorsList([]);
      setNoErrorsText("No errors found in the code analysis.");
    }
  }, [analysis]);

  const parseAnalysis = (text: string) => {
    try {
      const errorsSection = extractErrorsSection(text);
      if (!errorsSection) { setErrorsList([]); setNoErrorsText("No errors found in the code analysis."); return; }
      if (errorsSection.toLowerCase().includes("there are no syntax errors") ||
          errorsSection.toLowerCase().includes("no errors found") ||
          errorsSection.toLowerCase().includes("code is correct")) {
        setErrorsList([]); setNoErrorsText(errorsSection); return;
      }
      let errors: ErrorInfo[] = parseNumberedErrors(errorsSection);
      if (errors.length === 0) errors = parseHyphenErrors(errorsSection);
      if (errors.length === 0) errors = parseAlternativeFormat(errorsSection);
      setErrorsList(errors);
      if (errors.length === 0) setNoErrorsText("The analysis found no specific errors to report.");
    } catch { setErrorsList([]); setNoErrorsText("Error parsing the code analysis response."); }
  };

  const extractErrorsSection = (text: string): string | null => {
    const standardMatch = text.match(/### ERRORS:\s*\n([\s\S]*?)(?=###|$)/);
    if (standardMatch?.[1]) return standardMatch[1].trim();
    const numberedMatch = text.match(/### 2\.\s*ERRORS:\s*\n([\s\S]*?)(?=###|$)/) ||
                         text.match(/###\s*2\.\s*ERRORS:\s*\n([\s\S]*?)(?=###|$)/);
    if (numberedMatch?.[1]) return numberedMatch[1].trim();
    const simpleMatch = text.match(/ERRORS[:\s]*\n([\s\S]*?)(?=\n\n[A-Z]|$)/i);
    if (simpleMatch?.[1]) return simpleMatch[1].trim();
    if (text.match(/\d+\.\s+Line\s+\d+:/) || text.match(/^-\s+Line\s+\d+:/m) || text.match(/\(\s*Potential\s+error\s*\)/i)) return text;
    return null;
  };

  const parseNumberedErrors = (text: string): ErrorInfo[] => {
    const errors: ErrorInfo[] = [];
    const blocks = text.split(/(?=\d+\.\s+(?:Line|\(Potential))/);
    for (const block of blocks) {
      if (!block.trim()) continue;
      const lineMatch = block.match(/Line\s+(\d+)/i);
      if (!lineMatch) continue;
      const lineNumber = lineMatch[1];
      let isPotential = block.toLowerCase().includes('potential') || block.toLowerCase().includes('possible') || block.toLowerCase().includes('warning');
      let errorType = "Error";
      const typeMatch = block.match(/Type(?:\s+of\s+error)?:\s+([^\n]+)(?:\s+-\s+(Potential|Warning))?/i);
      if (typeMatch) {
        errorType = typeMatch[1].trim();
        isPotential = isPotential || (typeMatch[2] ? typeMatch[2].toLowerCase().includes('potential') : false);
      }
      let description = "";
      const descMatch = block.match(/Description:\s+([^\n]+(?:\n\s+[^\n]+)*)/i) ||
                        block.match(/Problem:\s+([^\n]+(?:\n\s+[^\n]+)*)/i) ||
                        block.match(/Issue:\s+([^\n]+(?:\n\s+[^\n]+)*)/i);
      if (descMatch) { description = descMatch[1].trim(); }
      else {
        const lines = block.split('\n');
        if (lines.length > 1) {
          const remaining = lines.slice(1).filter(l => !l.match(/^\s*(Fix|Solution|Type|Line):/i));
          if (remaining.length > 0) description = remaining.join('\n').trim();
        }
      }
      let solution = "";
      const fixMatch = block.match(/Fix:\s+([^\n]+(?:\n\s+[^\n]+)*)/i) ||
                      block.match(/Solution:\s+([^\n]+(?:\n\s+[^\n]+)*)/i) ||
                      block.match(/How\s+to\s+fix:\s+([^\n]+(?:\n\s+[^\n]+)*)/i);
      if (fixMatch) solution = fixMatch[1].trim();
      const notInCode = block.toLowerCase().includes('not in the provided code') || block.toLowerCase().includes('not present in the code');
      errors.push({ line: lineNumber, type: errorType, description: description || "No description provided", isPotential, solution, notInCode });
    }
    return errors;
  };

  const parseHyphenErrors = (text: string): ErrorInfo[] => {
    const lines = text.split('\n');
    const errors: ErrorInfo[] = [];
    let currentError: Partial<ErrorInfo> | null = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const regularErrorMatch = line.match(/^-\s*Line\s+(\d+):\s*`?([^`]+)`?/i) || line.match(/^-\s*At\s+line\s+(\d+):\s*`?([^`]+)`?/i);
      const potentialErrorMatch = line.match(/^-\s*Potential\s+error\s*\(Line\s+(\d+)\):\s*`?([^`]+)`?/i) || line.match(/^-\s*Possible\s+error\s*\(Line\s+(\d+)\):\s*`?([^`]+)`?/i);
      if (regularErrorMatch || potentialErrorMatch) {
        if (currentError?.line && currentError?.type) errors.push({ line: currentError.line, type: currentError.type, description: currentError.description || "No description provided", isPotential: currentError.isPotential || false, solution: currentError.solution || "" });
        const [lineNumber, errorType, isPotential] = regularErrorMatch
          ? [regularErrorMatch[1], regularErrorMatch[2].trim(), false]
          : [potentialErrorMatch![1], potentialErrorMatch![2].trim(), true];
        currentError = { line: lineNumber, type: errorType, isPotential };
      } else if (line.match(/^\s*-\s*Description:/i) && currentError) {
        currentError.description = line.replace(/^\s*-\s*Description:\s*/i, '').trim();
      } else if (line.match(/^\s*-\s*(?:Fix|Solution):/i) && currentError) {
        currentError.solution = line.replace(/^\s*-\s*(?:Fix|Solution):\s*/i, '').trim();
      } else if (currentError?.type && !currentError.description) {
        currentError.description = (currentError.description || "") + line;
      }
    }
    if (currentError?.line && currentError?.type) errors.push({ line: currentError.line, type: currentError.type, description: currentError.description || "No description provided", isPotential: currentError.isPotential || false, solution: currentError.solution || "" });
    return errors;
  };

  const parseAlternativeFormat = (text: string): ErrorInfo[] => {
    const errors: ErrorInfo[] = [];
    const paragraphs = text.split(/\n\s*\n/);
    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue;
      let isPotential = paragraph.toLowerCase().includes('potential') || paragraph.toLowerCase().includes('possible') || paragraph.toLowerCase().includes('might be');
      let lineNumber = "?";
      const lineMatch = paragraph.match(/line\s+(\d+)/i) || paragraph.match(/line:\s*(\d+)/i) || paragraph.match(/at\s+line\s+(\d+)/i);
      if (lineMatch) lineNumber = lineMatch[1];
      let errorType = "Error";
      if (paragraph.toLowerCase().includes('syntax error')) errorType = "Syntax Error";
      else if (paragraph.toLowerCase().includes('runtime error')) errorType = "Runtime Error";
      else if (paragraph.toLowerCase().includes('logical error') || paragraph.toLowerCase().includes('logic error')) errorType = "Logical Error";
      else if (paragraph.toLowerCase().includes('type error')) errorType = "Type Error";
      else if (paragraph.toLowerCase().includes('reference error')) errorType = "Reference Error";
      else if (paragraph.toLowerCase().includes('import error') || paragraph.toLowerCase().includes('module not found')) errorType = "Import Error";
      let description = paragraph;
      const descMatch = paragraph.match(/description:\s+([^\n]+)/i) || paragraph.match(/issue:\s+([^\n]+)/i) || paragraph.match(/problem:\s+([^\n]+)/i);
      if (descMatch) description = descMatch[1].trim();
      let solution = "";
      const fixMatch = paragraph.match(/fix:\s+([^\n]+)/i) || paragraph.match(/solution:\s+([^\n]+)/i);
      if (fixMatch) solution = fixMatch[1].trim();
      const notInCode = paragraph.toLowerCase().includes('not in the provided code') || paragraph.toLowerCase().includes('not present in the code');
      errors.push({ line: lineNumber, type: errorType, description, isPotential, solution, notInCode });
    }
    return errors;
  };

  const handleErrorClick = (index: number) => setSelectedError(index);
  const handleCloseModal = () => setSelectedError(null);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <TabShell>
      <TabHeader><TabTitle>errors</TabTitle></TabHeader>

      {isLoading ? (
        <Section>
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <Spinner />
            <div style={{ fontFamily: MONO, fontSize: '0.65rem', color: DIM, marginTop: '0.5rem' }}>analyzing code...</div>
          </div>
        </Section>
      ) : !isModelLoaded ? (
        <Section>
          <div style={{ padding: '1rem' }}>
            <div style={{ fontFamily: MONO, fontSize: '0.7rem', color: WARN }}>
              Analysis model not loaded. Ensure the model file is in the correct location.
            </div>
          </div>
        </Section>
      ) : !analysis ? (
        <Section>
          <div style={{ padding: '1rem' }}>
            <div style={{ fontFamily: MONO, fontSize: '0.7rem', color: DIM }}>
              No file selected. Open a file in the Sources tab to see error analysis.
            </div>
          </div>
        </Section>
      ) : errorsList.length === 0 ? (
        <NoErrorsBox>
          <NoErrorsMsg>✓ no errors detected</NoErrorsMsg>
          {noErrorsText && <NoErrorsText>{noErrorsText}</NoErrorsText>}
        </NoErrorsBox>
      ) : (
        <>
          <div style={{ fontFamily: MONO, fontSize: '0.65rem', color: DIM, marginBottom: '1rem', letterSpacing: '0.06em' }}>
            {errorsList.length} {errorsList.length === 1 ? 'error' : 'errors'} found
          </div>
          {errorsList.map((error, index) => (
            <ErrorCard
              key={index}
              isPotential={error.isPotential}
              onClick={() => handleErrorClick(index)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileTap={{ scale: 0.99 }}
            >
              <ErrHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <ErrType isPotential={error.isPotential}>{error.type}</ErrType>
                  {error.isPotential && <Badge type="warn">potential</Badge>}
                  {error.notInCode && <Badge>not in code</Badge>}
                </div>
                <ErrLine>line {error.line}</ErrLine>
              </ErrHeader>
              {error.codeSnippet && <ErrSnippet>{error.codeSnippet}</ErrSnippet>}
              <ErrDesc>{error.description}</ErrDesc>
              {error.solution && <ErrFix>{error.solution}</ErrFix>}
            </ErrorCard>
          ))}
        </>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selectedError !== null && errorsList[selectedError] && (
          <Backdrop
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <ModalBox
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <ModalClose onClick={handleCloseModal}>×</ModalClose>
              <ModalHead isPotential={errorsList[selectedError].isPotential}>
                {errorsList[selectedError].type}
                {errorsList[selectedError].isPotential && <> · <span style={{ color: WARN }}>potential</span></>}
                {errorsList[selectedError].notInCode && <> · <span style={{ color: DIM }}>not in code</span></>}
              </ModalHead>

              <ModalSection>
                <ModalLabel>line number</ModalLabel>
                <ModalContent>Line {errorsList[selectedError].line}</ModalContent>
              </ModalSection>

              {errorsList[selectedError].codeSnippet && (
                <ModalSection>
                  <ModalLabel>code snippet</ModalLabel>
                  <ErrSnippet>{errorsList[selectedError].codeSnippet}</ErrSnippet>
                </ModalSection>
              )}

              <ModalSection>
                <ModalLabel>description</ModalLabel>
                <ModalContent>{errorsList[selectedError].description}</ModalContent>
              </ModalSection>

              {errorsList[selectedError].solution && (
                <ModalSection>
                  <ModalLabel>solution</ModalLabel>
                  <ModalContent>{errorsList[selectedError].solution}</ModalContent>
                </ModalSection>
              )}

              {errorsList[selectedError].predictedFix && (
                <ModalSection>
                  <ModalLabel>predicted fix</ModalLabel>
                  <ErrSnippet>{errorsList[selectedError].predictedFix}</ErrSnippet>
                </ModalSection>
              )}

              {errorsList[selectedError].predictedBehavior && (
                <ModalSection>
                  <ModalLabel>predicted behavior</ModalLabel>
                  <ModalContent>{errorsList[selectedError].predictedBehavior}</ModalContent>
                </ModalSection>
              )}
            </ModalBox>
          </Backdrop>
        )}
      </AnimatePresence>
    </TabShell>
  );
};

export default Errors;