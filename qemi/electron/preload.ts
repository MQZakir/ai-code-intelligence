import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    setWindowSize: (width: number, height: number) => {
      return ipcRenderer.invoke('set-window-size', width, height);
    },
    onWindowResize: (callback: (width: number, height: number) => void) => {
      const newCallback = (_event: any, size: { width: number, height: number }) => 
        callback(size.width, size.height);
      
      ipcRenderer.on('window-resize', newCallback);
      
      // Return a function to clean up the event listener
      return () => {
        ipcRenderer.removeListener('window-resize', newCallback);
      };
    },
    lockCurrentSizeAsMinimum: () => {
      return ipcRenderer.invoke('lock-current-size-as-minimum');
    },
    resetMinimumSize: () => {
      return ipcRenderer.invoke('reset-minimum-size');
    },
    getWindowSize: () => {
      return ipcRenderer.invoke('get-window-size');
    }
  }
);

// Add types for TypeScript
declare global {
  interface Window {
    electron: {
      setWindowSize: (width: number, height: number) => Promise<boolean>;
      onWindowResize: (callback: (width: number, height: number) => void) => () => void;
      lockCurrentSizeAsMinimum: () => Promise<{ width: number, height: number }>;
      resetMinimumSize: () => Promise<boolean>;
      getWindowSize: () => Promise<{ width: number, height: number } | null>;
    }
  }
} 