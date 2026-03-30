import React, { useState, useEffect, useCallback } from 'react';
import styled from '@emotion/styled';
import { useFileMonitor } from '../../contexts/FileMonitorContext';
import { useFileAnalysis } from '../../contexts/FileAnalysisContext';
import {
  TabShell, TabHeader, TabTitle, Section, SectionHead, SectionTitle,
  MONO, TEXT, DIM, ACCENT, BORDER, CARD, BG, ERR, OK,
} from './tabStyles';

interface SourcesProps {
  onFileSelect: (fileName: string, content: string) => void;
  selectedFile: string | null;
  selectedFileContent: string;
}

// ── Layout ────────────────────────────────────────────────────────────────────

const Layout = styled.div`
  display: grid; grid-template-columns: 260px 1fr;
  height: calc(100vh - 148px); border: 1px solid ${BORDER};
  border-radius: 6px; overflow: hidden;
`;

// ── File tree sidebar ─────────────────────────────────────────────────────────

const Sidebar = styled.div<{ $connected: boolean }>`
  background: ${CARD}; display: flex; flex-direction: column; overflow: hidden;
  border-right: 1px solid ${BORDER};
  border-top: 2px solid ${p => p.$connected ? OK : ERR};
`;

const SideHead = styled.div`
  padding: 0.6rem 0.85rem; border-bottom: 1px solid ${BORDER};
  font-family: ${MONO}; font-size: 0.6rem; color: ${DIM};
  letter-spacing: 0.1em; text-transform: uppercase;
  display: flex; align-items: center; justify-content: space-between;
`;

const ConnDot = styled.span<{ $connected: boolean }>`
  display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: ${p => p.$connected ? OK : ERR};
`;

const SearchInput = styled.input`
  margin: 0.5rem 0.75rem; padding: 0.4rem 0.6rem;
  background: #0f0f0f; border: 1px solid ${BORDER}; border-radius: 3px;
  font-family: ${MONO}; font-size: 0.68rem; color: ${TEXT}; outline: none;
  transition: border-color 0.15s;
  &:focus { border-color: ${ACCENT}; }
  &::placeholder { color: #333; }
`;

const FileList = styled.div`flex: 1; overflow-y: auto; padding: 0.25rem 0;`;

const FileItem = styled.div<{ $level: number; $selected?: boolean }>`
  display: flex; align-items: flex-start; gap: 0.5rem; cursor: pointer;
  padding: 0.38rem 0.85rem;
  padding-left: ${p => p.$level * 1.25 + 0.85}rem;
  background: ${p => p.$selected ? '#1a1a1a' : 'transparent'};
  transition: background 0.1s;
  word-break: break-word; white-space: normal; overflow-wrap: break-word;
  &:hover { background: #141414; }
`;

const FileIconSpan = styled.span<{ $collapsed?: boolean }>`
  font-size: 0.85rem; flex-shrink: 0; margin-top: 1px;
  display: inline-block;
  transition: transform 0.15s;
  transform: ${p => p.$collapsed === true ? 'rotate(-90deg)' : 'rotate(0deg)'};
`;

const FileName = styled.span`
  font-family: ${MONO}; font-size: 0.7rem; color: ${TEXT}; line-height: 1.4;
`;

const ConnControls = styled.div`
  display: flex; gap: 0.4rem; padding: 0.6rem 0.75rem;
  border-top: 1px solid ${BORDER}; background: ${CARD};
`;

const ConnBtn = styled.button<{ disabled?: boolean }>`
  flex: 1; padding: 0.45rem; border: 1px solid ${BORDER}; border-radius: 3px;
  font-family: ${MONO}; font-size: 0.62rem; cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  background: ${p => p.disabled ? 'transparent' : ACCENT};
  color: ${p => p.disabled ? '#333' : '#fff'}; border-color: ${p => p.disabled ? BORDER : ACCENT};
  transition: opacity 0.12s; opacity: ${p => p.disabled ? 0.4 : 1};
  &:hover:not(:disabled) { opacity: 0.85; }
`;

// ── Code viewer ───────────────────────────────────────────────────────────────

const CodePane = styled.div<{ $connected: boolean }>`
  background: ${BG}; display: flex; flex-direction: column; overflow: hidden;
  border-top: 2px solid ${p => p.$connected ? OK : ERR};
`;

const CodeToolbar = styled.div`
  padding: 0.55rem 1rem; border-bottom: 1px solid ${BORDER};
  font-family: ${MONO}; font-size: 0.65rem; color: ${DIM}; flex-shrink: 0;
  display: flex; align-items: center; gap: 0.5rem;
`;

const ActiveBadge = styled.span`
  font-family: ${MONO}; font-size: 0.58rem; color: ${OK};
  background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.2);
  padding: 0.1rem 0.4rem; border-radius: 2px;
`;

const CodeScroll = styled.div`flex: 1; overflow: auto;`;

const Pre = styled.pre`
  margin: 0; padding: 0.5rem 0;
  font-family: ${MONO}; font-size: 0.72rem; line-height: 1.7;
  color: ${TEXT}; background: transparent;
`;

const Line = styled.div`
  display: flex; align-items: flex-start; white-space: pre;
  &:hover { background: #111; }
`;

const LineNum = styled.span`
  font-family: ${MONO}; font-size: 0.65rem; color: ${DIM};
  padding: 0 0.85rem; min-width: 50px; text-align: right; user-select: none; flex-shrink: 0;
`;

const LineCode = styled.code`font-family: ${MONO}; font-size: 0.72rem; white-space: pre;`;

const FilePath = styled.div`
  font-family: ${MONO}; font-size: 0.65rem; color: ${DIM};
  padding: 0.5rem 1rem; background: #0d0d0d; border-bottom: 1px solid ${BORDER};
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;

const MonitorBadge = styled.div`
  font-family: ${MONO}; font-size: 0.62rem; color: ${OK};
  padding: 0.35rem 0.85rem; background: rgba(74,222,128,0.04);
  border-bottom: 1px solid ${BORDER};
`;

const NoFile = styled.div`
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-family: ${MONO}; font-size: 0.7rem; color: #2a2a2a;
`;

// ── Context menu ──────────────────────────────────────────────────────────────

const CtxMenu = styled.div<{ $x: number; $y: number }>`
  position: fixed; left: ${p => p.$x}px; top: ${p => p.$y}px;
  background: #131313; border: 1px solid ${BORDER}; border-radius: 4px;
  padding: 0.3rem; z-index: 1000; min-width: 110px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
`;

const CtxItem = styled.div`
  padding: 0.45rem 0.75rem; font-family: ${MONO}; font-size: 0.7rem;
  color: ${DIM}; cursor: pointer; border-radius: 3px; transition: all 0.1s;
  &:hover { background: #1e1e1e; color: ${TEXT}; }
`;

// ── File icon helper (original logic unchanged) ───────────────────────────────

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'py':   return '🐍';
    case 'js': case 'jsx': case 'ts': case 'tsx': return '📜';
    case 'html': return '🌐';
    case 'css': case 'scss': case 'sass': case 'less': return '🎨';
    case 'json': return '📦';
    case 'md':   return '📝';
    case 'java': return '☕';
    case 'cpp': case 'c': case 'h': case 'hpp': return '⚡';
    case 'php':  return '🐘';
    case 'rb':   return '💎';
    case 'go':   return '🚀';
    case 'rs':   return '🦀';
    case 'swift': return '🍎';
    case 'kt':   return '🤖';
    case 'sql':  return '🗄️';
    default:     return '📄';
  }
};

interface FileTreeNode {
  path: string; name: string; isDirectory: boolean;
  children?: FileTreeNode[]; isCollapsed?: boolean;
  content?: string; language?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

const Sources: React.FC<SourcesProps> = ({ onFileSelect, selectedFile, selectedFileContent }) => {
  const { analyzeCode } = useFileAnalysis();
  const { files, isConnected, connect, disconnect, toggleFolder, removeFile } = useFileMonitor();

  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean; item: any }>({
    x: 0, y: 0, visible: false, item: null,
  });

  // Original debug log preserved
  useEffect(() => { console.log("Current files in Sources:", files); }, [files]);

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setContextMenu(c => ({ ...c, visible: false }));
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Original findFileNode logic unchanged
  const findFileNode = useCallback((path: string, nodes: any[]): any => {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.children) {
        const found = findFileNode(path, node.children);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Original handleFileClick logic unchanged
  const handleFileClick = useCallback(async (filePath: string) => {
    console.error('File clicked:', filePath);
    const fileNode = findFileNode(filePath, files);
    console.error('Found file node:', fileNode);
    if (fileNode && fileNode.content) {
      console.error('Setting selected file:', filePath);
      onFileSelect(filePath, fileNode.content);
      console.error('Analyzing file:', filePath);
      try {
        if (fileNode.content.trim().length > 0) {
          console.error(`File has content (${fileNode.content.length} chars), analyzing...`);
          await analyzeCode(fileNode.content);
        } else {
          console.error('File is empty, skipping analysis');
        }
      } catch (error) { console.error('Error analyzing file:', error); }
    } else {
      console.error('No content found for file:', filePath);
      onFileSelect(filePath, '');
    }
  }, [files, findFileNode, onFileSelect, analyzeCode]);

  const handleFolderClick = useCallback((folderPath: string) => {
    toggleFolder(folderPath);
  }, [toggleFolder]);

  const handleRemoveFile = useCallback((fileNode: FileTreeNode) => {
    removeFile(fileNode);
    if (selectedFile === fileNode.path) onFileSelect(fileNode.path, '');
    if (fileNode.content) fileNode.content = '';
  }, [removeFile, selectedFile, onFileSelect]);

  // Original filter logic unchanged
  const filterFileTree = useCallback((node: FileTreeNode): FileTreeNode | null => {
    if (!searchQuery) return node;
    const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (node.isDirectory) {
      const filteredChildren = node.children?.map(child => filterFileTree(child)).filter(Boolean) as FileTreeNode[];
      if (filteredChildren?.length > 0 || matchesSearch) return { ...node, children: filteredChildren };
      return null;
    }
    return matchesSearch ? node : null;
  }, [searchQuery]);

  const renderFileTree = useCallback((nodes: FileTreeNode[], level = 0): React.ReactNode => {
    const filtered = nodes.map(n => filterFileTree(n)).filter(Boolean) as FileTreeNode[];
    return filtered.map(node => (
      <React.Fragment key={node.path}>
        <FileItem
          $level={level}
          $selected={selectedFile === node.path}
          onClick={() => { if (!node.isDirectory) handleFileClick(node.path); }}
          onContextMenu={e => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, visible: true, item: node });
          }}
        >
          {node.isDirectory ? (
            <FileIconSpan $collapsed={node.isCollapsed ?? false} onClick={e => { e.stopPropagation(); toggleFolder(node.path); }}>
              📁
            </FileIconSpan>
          ) : (
            <FileIconSpan>{getFileIcon(node.name)}</FileIconSpan>
          )}
          <FileName>{node.name}</FileName>
        </FileItem>
        {node.isDirectory && !(node.isCollapsed ?? false) && node.children && renderFileTree(node.children, level + 1)}
      </React.Fragment>
    ));
  }, [selectedFile, handleFileClick, toggleFolder, filterFileTree]);

  const renderFileContent = () => {
    if (!selectedFile) return <NoFile>select a file to view source</NoFile>;
    const lines = selectedFileContent.split('\n');
    return (
      <>
        <FilePath>{selectedFile}</FilePath>
        <MonitorBadge>file monitoring active</MonitorBadge>
        <CodeScroll>
          <Pre>
            {lines.map((line, i) => (
              <Line key={i + 1}>
                <LineNum>{i + 1}</LineNum>
                <LineCode>{line || ' '}</LineCode>
              </Line>
            ))}
          </Pre>
        </CodeScroll>
      </>
    );
  };

  return (
    <TabShell style={{ padding: '1rem' }}>
      <TabHeader><TabTitle>sources</TabTitle></TabHeader>

      <Layout>
        {/* File tree */}
        <Sidebar $connected={isConnected}>
          <SideHead>
            file tree
            <ConnDot $connected={isConnected} title={isConnected ? 'connected' : 'disconnected'} />
          </SideHead>
          <SearchInput
            type="text"
            placeholder="search files..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <FileList>{renderFileTree(files)}</FileList>
          <ConnControls>
            <ConnBtn onClick={connect} disabled={isConnected}>connect</ConnBtn>
            <ConnBtn onClick={disconnect} disabled={!isConnected}>disconnect</ConnBtn>
          </ConnControls>
        </Sidebar>

        {/* Code viewer */}
        <CodePane $connected={isConnected}>
          {selectedFile
            ? renderFileContent()
            : <NoFile>select a file to view source</NoFile>
          }
        </CodePane>
      </Layout>

      {/* Context menu */}
      {contextMenu.visible && (
        <CtxMenu $x={contextMenu.x} $y={contextMenu.y}>
          <CtxItem onClick={() => { if (contextMenu.item) handleFileClick(contextMenu.item.path); setContextMenu(c => ({ ...c, visible: false })); }}>
            open
          </CtxItem>
          <CtxItem onClick={() => { if (contextMenu.item) handleRemoveFile(contextMenu.item); setContextMenu(c => ({ ...c, visible: false })); }}>
            remove
          </CtxItem>
        </CtxMenu>
      )}
    </TabShell>
  );
};

export default Sources;