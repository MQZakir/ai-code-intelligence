import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

// Keep a global reference to prevent garbage collection
let mainWindow: BrowserWindow | null = null;

// Default window dimensions
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 900;
const MIN_WIDTH = 1000;
const MIN_HEIGHT = 700;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        minWidth: MIN_WIDTH,
        minHeight: MIN_HEIGHT,
        resizable: true,
        title: 'Ender',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        backgroundColor: '#000000',
    });

    // In development, load from the Vite dev server
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        // Open DevTools in development mode
        mainWindow.webContents.openDevTools();
    } else {
        // In production, load the built files
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Handle window resize events
    mainWindow.on('resize', () => {
        if (mainWindow) {
            const [width, height] = mainWindow.getSize();
            mainWindow.webContents.send('window-resize', { width, height });
        }
    });
}

// IPC handlers
ipcMain.handle('set-window-size', (_event, width: number, height: number) => {
    if (mainWindow) {
        mainWindow.setSize(width, height);
        return true;
    }
    return false;
});

// Set the current window size as the minimum size
ipcMain.handle('lock-current-size-as-minimum', (_event) => {
    if (mainWindow) {
        const [width, height] = mainWindow.getSize();
        mainWindow.setMinimumSize(width, height);
        return { width, height };
    }
    return { width: MIN_WIDTH, height: MIN_HEIGHT };
});

// Reset to default minimum size
ipcMain.handle('reset-minimum-size', (_event) => {
    if (mainWindow) {
        mainWindow.setMinimumSize(MIN_WIDTH, MIN_HEIGHT);
        return true;
    }
    return false;
});

// Get current window size
ipcMain.handle('get-window-size', (_event) => {
    if (mainWindow) {
        const [width, height] = mainWindow.getSize();
        return { width, height };
    }
    return null;
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    mainWindow = null;
}); 