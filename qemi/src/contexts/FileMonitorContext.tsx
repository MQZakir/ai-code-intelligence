import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface FileChange {
  type: 'file_created' | 'file_modified' | 'file_deleted';
  path: string;
  language: string;
  content: string;
  timestamp: number;
}

interface FileTreeNode {
  path: string;
  name: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
  isCollapsed?: boolean;
  content?: string;
  language?: string;
}

interface FileMonitorContextType {
  files: FileTreeNode[];
  isConnected: boolean;
  ws: WebSocket | null;
  connect: () => void;
  disconnect: () => void;
  removeFile: (file: FileTreeNode) => void;
  toggleFolder: (path: string) => void;
  searchFiles: (query: string) => void;
  filteredFiles: FileTreeNode[];
  // Debug info
  lastMessage: string;
  connectionError: string;
}

const FileMonitorContext = createContext<FileMonitorContextType>({
  files: [],
  isConnected: false,
  ws: null,
  connect: () => {},
  disconnect: () => {},
  removeFile: () => {},
  toggleFolder: () => {},
  searchFiles: () => {},
  filteredFiles: [],
  lastMessage: '',
  connectionError: ''
});

export const FileMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileTreeNode[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileTreeNode[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState('');
  const [connectionError, setConnectionError] = useState('');
  
  // Use ref to prevent duplicate connections
  const connectionAttempted = useRef(false);

  // Connect to file monitor on component mount
  useEffect(() => {
    // Only try to connect once on mount
    if (!connectionAttempted.current && !isConnected) {
      connect();
      connectionAttempted.current = true;
    }
    
    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const buildFileTree = useCallback((path: string, content?: string, language?: string): FileTreeNode => {
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    const isFile = name.includes('.');
    
    return {
      path,
      name,
      isDirectory: !isFile,
      children: [],
      isCollapsed: false,
      content,
      language
    };
  }, []);

  const updateFileTree = useCallback((change: FileChange) => {
    console.log("Updating file tree with change:", change);
    setLastMessage(`File changed: ${change.path} (${change.type})`);
    
    setFiles(prevFiles => {
      let newFiles = [...prevFiles];
      const pathParts = change.path.split('/').filter(part => part); // Filter empty parts
      const fileName = pathParts[pathParts.length - 1];
      
      // For deleted files, remove them from the tree
      if (change.type === 'file_deleted') {
        const removePath = (nodes: FileTreeNode[]): FileTreeNode[] => {
          return nodes.filter(node => {
            if (node.path === change.path) {
              return false;
            }
            if (node.children) {
              node.children = removePath(node.children);
            }
            return true;
          });
        };
        
        return removePath(newFiles);
      }
      
      // For created or modified files
      if (pathParts.length === 1) {
        // Top-level file
        const existingIndex = newFiles.findIndex(f => f.name === fileName);
        if (existingIndex !== -1) {
          // Update existing file
          const updatedFile = {
            ...newFiles[existingIndex],
            content: change.content,
            language: change.language
          };
          newFiles[existingIndex] = updatedFile;
        } else {
          // Add new file
          newFiles.push({
            path: change.path,
            name: fileName,
            isDirectory: false,
            content: change.content,
            language: change.language
          });
        }
      } else {
        // Nested file - build directory structure as needed
        let currentLevel = newFiles;
        let currentPath = '';
        
        // Create directory structure
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          
          let dirNode = currentLevel.find(n => n.name === part);
          if (!dirNode) {
            // Create directory if it doesn't exist
            dirNode = {
              path: currentPath,
              name: part,
              isDirectory: true,
              children: [],
              isCollapsed: false
            };
            currentLevel.push(dirNode);
            dirNode.children = [];
          } else if (!dirNode.children) {
            dirNode.children = [];
          }
          
          currentLevel = dirNode.children;
        }
        
        // Now add or update the file in its parent directory
        const fileIndex = currentLevel.findIndex(f => f.name === fileName);
        if (fileIndex !== -1) {
          // Update existing file
          currentLevel[fileIndex] = {
            ...currentLevel[fileIndex],
            content: change.content,
            language: change.language
          };
        } else {
          // Add new file
          currentLevel.push({
            path: change.path,
            name: fileName,
            isDirectory: false,
            content: change.content,
            language: change.language
          });
        }
      }
      
      console.log("Updated file tree:", newFiles);
      return newFiles;
    });
  }, []);

  const findNode = (nodes: FileTreeNode[], path: string): FileTreeNode | null => {
    for (const node of nodes) {
      if (node.path === path) {
        return node;
      }
      if (node.children) {
        const found = findNode(node.children, path);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  const connect = useCallback(() => {
    if (isConnected) {
      console.log("Already connected, not creating new connection");
      return;
    }
    
    setConnectionError('');
    console.log("Connecting to WebSocket server at ws://localhost:8765...");
    
    try {
      const websocket = new WebSocket('ws://localhost:8765');

      websocket.onopen = () => {
        console.log('Connected to file monitor');
        setIsConnected(true);
        setWs(websocket);
        setLastMessage('Connected to file monitor server');
        
        // Request initial file list
        websocket.send(JSON.stringify({
          command: 'list_files',
          path: '.'
        }));
      };

      websocket.onclose = () => {
        console.log('Disconnected from file monitor');
        setIsConnected(false);
        setWs(null);
        setLastMessage('Disconnected from file monitor server');
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setWs(null);
        setConnectionError('Failed to connect to file monitor server');
      };

      websocket.onmessage = (event) => {
        try {
          console.log("Received WebSocket message:", event.data);
          setLastMessage(`Received message: ${event.data.substring(0, 100)}...`);
          
          const data = JSON.parse(event.data);
          console.log("WebSocket message data:", data);
          
          // Determine message type and process accordingly
          if (data.event === 'file_change' || 
              data.event === 'file_created' || 
              data.event === 'file_deleted' || 
              data.event === 'file_modified' ||
              data.type === 'file_change') {
            
            // Process file changes
            console.log("Processing file change event:", data);
            
            const change: FileChange = {
              type: data.event === 'file_deleted' ? 'file_deleted' : 
                   data.event === 'file_created' ? 'file_created' : 'file_modified',
              path: data.path || data.file_path || data.filePath,
              language: data.language || detectLanguageFromPath(data.path || data.file_path || data.filePath),
              content: data.content || '',
              timestamp: data.timestamp || Date.now()
            };
            
            updateFileTree(change);
            
            // Force a state update to trigger a re-render
            setTimeout(() => {
              setFiles(prev => [...prev]);
            }, 100);
            
          } else if (data.event === 'directory_listing' || data.type === 'fileList') {
            // Handle directory listing
            const files = data.files || data.directories || [];
            console.log("Processing directory listing:", files);
            handleDirectoryListing(files);
          } else if (data.event === 'connected' || data.type === 'status') {
            // Handle connection confirmed
            console.log("Connection to file monitor confirmed:", data);
          } else if (data.type === 'fileContent') {
            // Handle file content
            console.log("Processing file content:", data);
            handleFileContent(data.path, data.content, data.language);
          } else {
            // Unknown message type, try to extract useful information
            console.log("Unknown message type:", data);
            if (data.path && (data.content !== undefined)) {
              // Looks like file content
              handleFileContent(data.path, data.content, detectLanguageFromPath(data.path));
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          setLastMessage(`Error parsing message: ${error}`);
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      setConnectionError(`Failed to create WebSocket: ${error}`);
    }
  }, [isConnected, updateFileTree]);

  // Detect language from file path
  const detectLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js': case 'jsx': return 'javascript';
      case 'ts': case 'tsx': return 'typescript';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'cs': return 'csharp';
      case 'html': case 'htm': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      default: return 'plaintext';
    }
  };

  // Handle directory listing
  const handleDirectoryListing = useCallback((filesList: any[]) => {
    console.log("Handling directory listing:", filesList);
    if (!Array.isArray(filesList)) return;
    
    const processedFiles = filesList.map(file => processFileNode(file));
    console.log("Processed files:", processedFiles);
    setFiles(processedFiles);
    setLastMessage(`Received file list with ${filesList.length} items`);
  }, []);

  // Process individual file node
  const processFileNode = (node: any): FileTreeNode => {
    return {
      path: node.path,
      name: node.name,
      isDirectory: node.isDirectory,
      children: node.isDirectory && node.children ? 
        node.children.map((child: any) => processFileNode(child)) : 
        (node.isDirectory ? [] : undefined),
      isCollapsed: !!node.isCollapsed,
      content: node.content,
      language: node.language || (node.path ? detectLanguageFromPath(node.path) : undefined)
    };
  };

  // Handle file content
  const handleFileContent = useCallback((path: string, content: string, language: string) => {
    console.log(`Handling file content for ${path}`);
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      const fileNode = findNode(newFiles, path);
      
      if (fileNode) {
        fileNode.content = content;
        fileNode.language = language || detectLanguageFromPath(path);
      } else {
        // File not found in tree, create it
        const change: FileChange = {
          type: 'file_modified',
          path,
          content,
          language: language || detectLanguageFromPath(path),
          timestamp: Date.now()
        };
        updateFileTree(change);
      }
      
      return newFiles;
    });
  }, [updateFileTree]);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
      setLastMessage('Manually disconnected from file monitor');
    }
  }, [ws]);

  const removeFile = useCallback((fileToRemove: FileTreeNode) => {
    setFiles(prevFiles => {
      const removeNode = (nodes: FileTreeNode[]): FileTreeNode[] => {
        return nodes.filter(node => {
          if (node.path === fileToRemove.path) {
            return false;
          }
          if (node.children) {
            node.children = removeNode(node.children);
          }
          return true;
        });
      };
      return removeNode(prevFiles);
    });
  }, []);

  const toggleFolder = useCallback((path: string) => {
    console.log(`Toggling folder: ${path}`);
    setFiles(prevFiles => {
      const toggleNode = (nodes: FileTreeNode[]): FileTreeNode[] => {
        return nodes.map(node => {
          if (node.path === path) {
            console.log(`Found node to toggle: ${node.path}, current isCollapsed: ${node.isCollapsed}`);
            return { ...node, isCollapsed: !node.isCollapsed };
          }
          if (node.children) {
            return { ...node, children: toggleNode(node.children) };
          }
          return node;
        });
      };
      return toggleNode(prevFiles);
    });
  }, []);

  const searchFiles = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredFiles(files);
      return;
    }

    const searchNode = (nodes: FileTreeNode[]): FileTreeNode[] => {
      return nodes.filter(node => {
        const matches = node.name.toLowerCase().includes(query.toLowerCase());
        if (node.children) {
          const childMatches = searchNode(node.children);
          if (childMatches.length > 0) {
            node.children = childMatches;
            return true;
          }
        }
        return matches;
      });
    };

    setFilteredFiles(searchNode([...files]));
  }, [files]);

  // Debug function to dump the entire file tree to console
  const debugDumpFiles = useCallback(() => {
    console.log("==== CURRENT FILE TREE ====");
    console.log(JSON.stringify(files, null, 2));
    console.log("==========================");
  }, [files]);

  useEffect(() => {
    // Log file tree changes for debugging
    console.log("File tree updated, now has", files.length, "root items");
    debugDumpFiles();
  }, [files, debugDumpFiles]);

  const contextValue: FileMonitorContextType = {
    files,
    filteredFiles: filteredFiles.length > 0 ? filteredFiles : files,
    isConnected,
    ws,
    connect,
    disconnect,
    removeFile,
    toggleFolder,
    searchFiles,
    lastMessage,
    connectionError
  };

  return (
    <FileMonitorContext.Provider value={contextValue}>
      {children}
    </FileMonitorContext.Provider>
  );
};

export const useFileMonitor = () => {
  const context = useContext(FileMonitorContext);
  if (!context) {
    throw new Error('useFileMonitor must be used within a FileMonitorProvider');
  }
  return context;
};

// Helper function to process file change data
const processFileChange = (data: any): FileTreeNode => {
  const path = data.path;
  const name = path.split('/').pop() || path;
  const isDirectory = data.type === 'directory';
  
  return {
    path,
    name,
    isDirectory,
    isCollapsed: false,
    content: data.content,
    language: data.language
  };
}; 