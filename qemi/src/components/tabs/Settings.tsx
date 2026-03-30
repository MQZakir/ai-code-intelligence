import React from 'react';
import styled from '@emotion/styled';
import { Dropdown } from '../common/Dropdown';
import { useFontSize } from '../../contexts/FontSizeContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  TabShell, TabHeader, TabTitle, Section, SectionHead, SectionTitle,
  MONO, TEXT, DIM, ACCENT, BORDER, CARD,
} from './tabStyles';

// ── Styled ────────────────────────────────────────────────────────────────────

const SettingRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.75rem 1rem; border-bottom: 1px solid #161616;
  transition: background 0.12s;
  &:last-child { border-bottom: none; }
  &:hover { background: #131313; }
`;

const RowLabel = styled.div`display: flex; flex-direction: column; gap: 0.2rem;`;

const RowTitle = styled.div`
  font-family: ${MONO}; font-size: 0.72rem; color: ${TEXT}; letter-spacing: 0.03em;
`;

const RowDesc = styled.div`
  font-family: ${MONO}; font-size: 0.62rem; color: ${DIM};
`;

// ── QEMI-styled toggle switch (same behaviour as original) ────────────────────

const ToggleSwitch = styled.label`
  position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0;

  input {
    opacity: 0; width: 0; height: 0;
    &:checked + span { background: ${ACCENT}; }
    &:checked + span::before { transform: translateX(16px); }
  }

  span {
    position: absolute; cursor: pointer; inset: 0;
    background: #1e1e1e; border-radius: 20px; transition: background 0.2s;
    border: 1px solid #2a2a2a;

    &::before {
      content: ''; position: absolute;
      height: 12px; width: 12px; left: 3px; bottom: 3px;
      background: #555; border-radius: 50%; transition: transform 0.2s, background 0.2s;
    }
  }

  input:checked + span::before { background: #fff; }
`;

// ── Component ─────────────────────────────────────────────────────────────────

const Settings: React.FC = () => {
  const { fontSize, setFontSize } = useFontSize();
  const { theme: currentTheme, setTheme } = useTheme();

  return (
    <TabShell>
      <TabHeader><TabTitle>settings</TabTitle></TabHeader>

      {/* Preferences */}
      <Section style={{ marginBottom: '1rem' }}>
        <SectionHead><SectionTitle>preferences</SectionTitle></SectionHead>

        <SettingRow>
          <RowLabel>
            <RowTitle>Theme</RowTitle>
            <RowDesc>Choose between light and dark themes</RowDesc>
          </RowLabel>
          <Dropdown
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
            value={currentTheme}
            onChange={(value: string) => setTheme(value as 'light' | 'dark' | 'system')}
          />
        </SettingRow>

        <SettingRow>
          <RowLabel>
            <RowTitle>Font Size</RowTitle>
            <RowDesc>Adjust the text size throughout the app</RowDesc>
          </RowLabel>
          <Dropdown
            options={[
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' },
            ]}
            value={fontSize}
            onChange={(value: string) => setFontSize(value as 'small' | 'medium' | 'large')}
          />
        </SettingRow>
      </Section>

      {/* Debugging */}
      <Section style={{ marginBottom: '1rem' }}>
        <SectionHead><SectionTitle>debugging</SectionTitle></SectionHead>

        <SettingRow>
          <RowLabel>
            <RowTitle>Network Logging</RowTitle>
            <RowDesc>Record all network requests automatically</RowDesc>
          </RowLabel>
          <ToggleSwitch>
            <input type="checkbox" defaultChecked />
            <span />
          </ToggleSwitch>
        </SettingRow>

        <SettingRow>
          <RowLabel>
            <RowTitle>Performance Monitoring</RowTitle>
            <RowDesc>Track CPU and memory usage in real-time</RowDesc>
          </RowLabel>
          <ToggleSwitch>
            <input type="checkbox" defaultChecked />
            <span />
          </ToggleSwitch>
        </SettingRow>
      </Section>

      {/* Notifications */}
      <Section style={{ marginBottom: '1rem' }}>
        <SectionHead><SectionTitle>notifications</SectionTitle></SectionHead>

        <SettingRow>
          <RowLabel>
            <RowTitle>Error Alerts</RowTitle>
            <RowDesc>Get notified about new errors</RowDesc>
          </RowLabel>
          <ToggleSwitch>
            <input type="checkbox" defaultChecked />
            <span />
          </ToggleSwitch>
        </SettingRow>

        <SettingRow>
          <RowLabel>
            <RowTitle>Performance Warnings</RowTitle>
            <RowDesc>Alert when performance metrics exceed thresholds</RowDesc>
          </RowLabel>
          <ToggleSwitch>
            <input type="checkbox" defaultChecked />
            <span />
          </ToggleSwitch>
        </SettingRow>
      </Section>

      {/* Advanced */}
      <Section>
        <SectionHead><SectionTitle>advanced</SectionTitle></SectionHead>

        <SettingRow>
          <RowLabel>
            <RowTitle>Source Maps</RowTitle>
            <RowDesc>Enable source map support for minified code</RowDesc>
          </RowLabel>
          <ToggleSwitch>
            <input type="checkbox" defaultChecked />
            <span />
          </ToggleSwitch>
        </SettingRow>

        <SettingRow>
          <RowLabel>
            <RowTitle>Debug Protocol</RowTitle>
            <RowDesc>Choose the debugging protocol version</RowDesc>
          </RowLabel>
          <Dropdown
            options={[
              { value: 'v1', label: 'Version 1' },
              { value: 'v2', label: 'Version 2' },
            ]}
            defaultValue="v2"
            onChange={(value: string) => console.log('Protocol version changed to:', value)}
          />
        </SettingRow>

        <SettingRow>
          <RowLabel>
            <RowTitle>Memory Profiling</RowTitle>
            <RowDesc>Enable detailed memory usage tracking</RowDesc>
          </RowLabel>
          <ToggleSwitch>
            <input type="checkbox" />
            <span />
          </ToggleSwitch>
        </SettingRow>
      </Section>
    </TabShell>
  );
};

export default Settings;