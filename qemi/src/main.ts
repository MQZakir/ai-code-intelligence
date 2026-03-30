import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        frame: false,
        backgroundColor: '#1A1A1A',
    });

    // In development, load from Vite dev server
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        // In production, load the built files
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Handle window size changes
ipcMain.on('set-window-size', (event, width, height) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
        window.setSize(width, height);
    }
}); 