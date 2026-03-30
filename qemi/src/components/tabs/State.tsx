import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { useDebugger, DebuggerState } from '../../contexts/DebuggerContext';
import * as d3 from 'd3';
import {
  BG, CARD, BORDER, ACCENT, TEXT, DIM, DIM2, ERR, OK, WARN, MONO, SANS,
  TabShell, TabHeader, TabTitle, Section, SectionHead, SectionTitle, EmptyState,
} from './tabStyles';

// ── Types (unchanged) ─────────────────────────────────────────────────────────

interface Variable { name: string; value: string; values: string[]; type: string; color: string; }
interface StackFrame { function: string; line: number; file: string; }
interface Scope { name: string; variables: Array<{ name: string; value: string; }>; }
interface ExtendedDebuggerState extends DebuggerState { finalValue?: string; }

// ── Styled (QEMI design) ──────────────────────────────────────────────────────

const VarRow = styled.div`
  display:flex;align-items:center;padding:0.5rem 1rem;
  border-bottom:1px solid #161616;&:last-child{border-bottom:none;}
  &:hover{background:#131313;}
`;
const VarDot = styled.div<{color:string}>`
  width:6px;height:6px;border-radius:50%;background:${p=>p.color};flex-shrink:0;margin-right:0.75rem;
`;
const VarName = styled.span`font-family:${MONO};font-size:0.72rem;color:${ACCENT};width:22%;`;
const VarValue = styled.span`font-family:${MONO};font-size:0.72rem;color:${TEXT};width:50%;word-break:break-all;`;
const VarHistory = styled.span`font-family:${MONO};font-size:0.6rem;color:${DIM};margin-left:0.4rem;`;
const VarType = styled.span`font-family:${MONO};font-size:0.62rem;color:${DIM};margin-left:auto;text-align:right;`;

const FrameRow = styled.div`
  font-family:${MONO};font-size:0.7rem;color:${TEXT};
  padding:0.45rem 1rem;border-bottom:1px solid #161616;
  &:last-child{border-bottom:none;}&:hover{background:#131313;}
`;

const ScopeGroup = styled.div`margin-bottom:0.75rem;`;
const ScopeTitle = styled.div`
  font-family:${MONO};font-size:0.6rem;color:${DIM};letter-spacing:0.1em;text-transform:uppercase;
  padding:0.5rem 1rem;border-bottom:1px solid ${BORDER};
`;
const ScopeVar = styled.div`
  display:flex;gap:0.5rem;padding:0.4rem 1rem;font-family:${MONO};font-size:0.7rem;
  border-bottom:1px solid #161616;&:last-child{border-bottom:none;}&:hover{background:#131313;}
`;

const GraphWrap = styled.div`
  width:100%;height:220px;background:#131313;border-radius:4px;overflow:hidden;position:relative;
`;

const Legend = styled.div`display:flex;flex-wrap:wrap;gap:0.75rem;padding:0.65rem 1rem;`;
const LegendItem = styled.div`display:flex;align-items:center;gap:0.4rem;font-family:${MONO};font-size:0.62rem;color:${DIM};`;
const LegendDot = styled.div<{color:string}>`width:8px;height:8px;border-radius:50%;background:${p=>p.color};`;

const FinalBox = styled.div`
  padding:0.85rem 1rem;border-left:3px solid ${OK};background:#111;
`;
const FinalLabel = styled.div`font-family:${MONO};font-size:0.6rem;color:${OK};letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.4rem;`;
const FinalValue = styled.pre`font-family:${MONO};font-size:0.75rem;color:${TEXT};margin:0;white-space:pre-wrap;line-height:1.55;`;

// ── Component ─────────────────────────────────────────────────────────────────

const State: React.FC = () => {
  const { state: debugState } = useDebugger();
  const debuggerState = debugState as ExtendedDebuggerState;
  const [variables, setVariables] = useState<Variable[]>([]);
  const [callStack, setCallStack] = useState<StackFrame[]>([]);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [finalValue, setFinalValue] = useState<string>("");
  const graphRef = useRef<HTMLDivElement>(null);

  console.log("State component: debuggerState.finalValue =", debuggerState.finalValue);

  // ── All original data processing unchanged ───────────────────────────────────

  function getRandomColor(index: number): string {
    const palette = [
      "#6366f1","#4ade80","#f59e0b","#e05252","#38bdf8",
      "#a78bfa","#34d399","#fb923c","#f472b6","#60a5fa",
      "#facc15","#4ade80","#c084fc","#f87171","#2dd4bf",
    ];
    return palette[index % palette.length];
  }

  useEffect(() => {
    console.log("Processing debug data, finalValue =", debuggerState.finalValue);
    const processedVars = debuggerState.variables.map((v, index) => {
      const varValues = v.values || [v.value || ''];
      return { name: v.name, value: varValues[varValues.length - 1] || '', values: varValues, type: v.type || 'unknown', color: getRandomColor(index) } as Variable;
    });
    setVariables(processedVars);

    const processedStack = debuggerState.callStack.map(frame => ({
      function: frame.function || frame.name || 'unknown',
      line: frame.line || 0,
      file: frame.path || 'unknown'
    }));
    setCallStack(processedStack);

    if (debuggerState.additionalDebugData?.scopes) {
      setScopes(debuggerState.additionalDebugData.scopes);
    } else {
      setScopes([]);
    }

    if (debuggerState.finalValue) {
      setFinalValue(debuggerState.finalValue);
    } else if (debuggerState.additionalDebugData?.rawData?.finalValue) {
      setFinalValue(debuggerState.additionalDebugData.rawData.finalValue);
    } else {
      setFinalValue("");
    }
  }, [debuggerState]);

  // ── D3 graph unchanged ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!graphRef.current || variables.length === 0) return;
    d3.select(graphRef.current).selectAll("*").remove();
    const variablesWithHistory = variables.filter(v => v.values && v.values.length > 1);
    if (variablesWithHistory.length === 0) return;
    const width = graphRef.current.clientWidth;
    const height = graphRef.current.clientHeight;
    const margin = { top: 16, right: 20, bottom: 24, left: 36 };
    const gw = width - margin.left - margin.right;
    const gh = height - margin.top - margin.bottom;
    const svg = d3.select(graphRef.current).append("svg").attr("width", width).attr("height", height)
      .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(variablesWithHistory, v => v.values.length - 1) || 0]).range([0, gw]);
    const allValues = variablesWithHistory.flatMap(v => v.values.map(val => {
      if (val.toLowerCase() === 'true') return 1;
      if (val.toLowerCase() === 'false') return 0;
      const num = parseFloat(val); return isNaN(num) ? 0 : num;
    }));
    const yMin = d3.min(allValues) || 0;
    const yMax = d3.max(allValues) || 10;
    const padding = (yMax - yMin) * 0.1;
    const yScale = d3.scaleLinear().domain([yMin - padding, yMax + padding]).range([gh, 0]);

    svg.append("g").attr("transform", `translate(0,${gh})`).call(d3.axisBottom(xScale).ticks(Math.min(variablesWithHistory[0].values.length, 10)).tickFormat(d => `${d}`))
      .selectAll("text").attr("fill", "#555").attr("font-family", "'DM Mono',monospace").attr("font-size","10");
    svg.append("g").call(d3.axisLeft(yScale))
      .selectAll("text").attr("fill","#555").attr("font-family","'DM Mono',monospace").attr("font-size","10");
    svg.selectAll(".domain,.tick line").attr("stroke","#1e1e1e");

    const line = d3.line<[number, number]>().x(d => d[0]).y(d => d[1]).curve(d3.curveMonotoneX);
    variablesWithHistory.forEach(variable => {
      const points: [number, number][] = variable.values.map((val, i) => {
        let value: number;
        if (val.toLowerCase() === 'true') value = 1;
        else if (val.toLowerCase() === 'false') value = 0;
        else { const num = parseFloat(val); value = isNaN(num) ? 0 : num; }
        return [xScale(i), yScale(value)];
      });
      svg.append("path").datum(points).attr("fill","none").attr("stroke",variable.color).attr("stroke-width",1.5).attr("d",line);
      svg.selectAll(`.pt-${variable.name.replace(/[^a-zA-Z0-9]/g,'')}`)
        .data(points).enter().append("circle")
        .attr("cx",d=>d[0]).attr("cy",d=>d[1]).attr("r",3)
        .attr("fill",variable.color).attr("stroke","#0a0a0a").attr("stroke-width",1)
        .append("title").text((d,i)=>`${variable.name}: ${variable.values[i]}`);
    });
    svg.append("g").attr("class","grid").attr("transform",`translate(0,${gh})`).call(d3.axisBottom(xScale).tickSize(-gh).tickFormat(()=>'')).attr("color","rgba(255,255,255,0.04)").attr("stroke-dasharray","2,2");
    svg.append("g").attr("class","grid").call(d3.axisLeft(yScale).tickSize(-gw).tickFormat(()=>'')).attr("color","rgba(255,255,255,0.04)").attr("stroke-dasharray","2,2");
  }, [variables]);

  // ── Empty state ───────────────────────────────────────────────────────────────

  if (variables.length === 0 && callStack.length === 0) {
    return (
      <TabShell>
        <TabHeader><TabTitle>state</TabTitle></TabHeader>
        <EmptyState>
          no state information available<br />
          <span style={{ fontSize: '0.62rem', marginTop: '0.3rem', display: 'block' }}>
            select a file in sources and run debug to see state
          </span>
        </EmptyState>
      </TabShell>
    );
  }

  return (
    <TabShell>
      <TabHeader><TabTitle>state</TabTitle></TabHeader>

      {/* Variable State */}
      <Section style={{ marginBottom: '1rem' }}>
        <SectionHead><SectionTitle>variable state ({variables.length})</SectionTitle></SectionHead>
        {variables.length > 0 ? (
          <>
            {variables.map((v, i) => (
              <VarRow key={i}>
                <VarDot color={v.color} />
                <VarName>{v.name}</VarName>
                <VarValue>
                  {v.value}
                  {v.values.length > 1 && <VarHistory>(all: {v.values.join(' → ')})</VarHistory>}
                </VarValue>
                <VarType>{v.type}</VarType>
              </VarRow>
            ))}

            {/* D3 timeline graph if variables have history */}
            {variables.some(v => v.values.length > 1) && (
              <>
                <SectionHead style={{ borderTop: `1px solid ${BORDER}` }}>
                  <SectionTitle>variable changes over time</SectionTitle>
                </SectionHead>
                <GraphWrap ref={graphRef} />
                <Legend>
                  {variables.filter(v => v.values.length > 1).map((v, i) => (
                    <LegendItem key={i}><LegendDot color={v.color} />{v.name}</LegendItem>
                  ))}
                </Legend>
              </>
            )}

            {/* Final value */}
            {finalValue ? (
              <div style={{ padding: '0.75rem' }}>
                <FinalBox>
                  <FinalLabel>program output</FinalLabel>
                  <FinalValue>{finalValue}</FinalValue>
                </FinalBox>
              </div>
            ) : (
              <div style={{ padding: '0.75rem 1rem', fontFamily: MONO, fontSize: '0.65rem', color: DIM }}>
                no final output value available
              </div>
            )}
          </>
        ) : (
          <EmptyState>no variable data available</EmptyState>
        )}
      </Section>

      {/* Call Stack */}
      <Section style={{ marginBottom: '1rem' }}>
        <SectionHead><SectionTitle>call stack ({callStack.length})</SectionTitle></SectionHead>
        {callStack.length > 0
          ? callStack.map((frame, i) => (
              <FrameRow key={i}>
                <span style={{ color: ACCENT }}>#{i}</span>
                &nbsp;&nbsp;{frame.function}
                <span style={{ color: DIM }}>&nbsp;·&nbsp;line {frame.line}</span>
                {frame.file !== 'unknown' && <span style={{ color: DIM }}>&nbsp;in {frame.file}</span>}
              </FrameRow>
            ))
          : <EmptyState>no call stack data available</EmptyState>
        }
      </Section>

      {/* Scopes */}
      <Section>
        <SectionHead><SectionTitle>scopes ({scopes.length})</SectionTitle></SectionHead>
        {scopes.length > 0
          ? scopes.map((scope, i) => (
              <ScopeGroup key={i}>
                <ScopeTitle>{scope.name}</ScopeTitle>
                {scope.variables.map((v, vi) => (
                  <ScopeVar key={vi}>
                    <span style={{ color: ACCENT }}>{v.name}</span>
                    <span style={{ color: DIM }}>:</span>
                    <span style={{ color: TEXT }}>{v.value}</span>
                  </ScopeVar>
                ))}
              </ScopeGroup>
            ))
          : <EmptyState>no scope data available</EmptyState>
        }
      </Section>
    </TabShell>
  );
};

export default State;