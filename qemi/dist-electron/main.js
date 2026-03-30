"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
let mainWindow = null;
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 900;
const MIN_WIDTH = 1000;
const MIN_HEIGHT = 700;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        minWidth: MIN_WIDTH,
        minHeight: MIN_HEIGHT,
        resizable: true,
        title: 'Ender',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path_1.default.join(__dirname, 'preload.js'),
        },
        backgroundColor: '#000000',
    });
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    mainWindow.on('resize', () => {
        if (mainWindow) {
            const [width, height] = mainWindow.getSize();
            mainWindow.webContents.send('window-resize', { width, height });
        }
    });
}
electron_1.ipcMain.handle('set-window-size', (_event, width, height) => {
    if (mainWindow) {
        mainWindow.setSize(width, height);
        return true;
    }
    return false;
});
electron_1.ipcMain.handle('lock-current-size-as-minimum', (_event) => {
    if (mainWindow) {
        const [width, height] = mainWindow.getSize();
        mainWindow.setMinimumSize(width, height);
        return { width, height };
    }
    return { width: MIN_WIDTH, height: MIN_HEIGHT };
});
electron_1.ipcMain.handle('reset-minimum-size', (_event) => {
    if (mainWindow) {
        mainWindow.setMinimumSize(MIN_WIDTH, MIN_HEIGHT);
        return true;
    }
    return false;
});
electron_1.ipcMain.handle('get-window-size', (_event) => {
    if (mainWindow) {
        const [width, height] = mainWindow.getSize();
        return { width, height };
    }
    return null;
});
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', () => {
    mainWindow = null;
});
