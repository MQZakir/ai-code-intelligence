"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    setWindowSize: (width, height) => {
        return electron_1.ipcRenderer.invoke('set-window-size', width, height);
    },
    onWindowResize: (callback) => {
        const newCallback = (_event, size) => callback(size.width, size.height);
        electron_1.ipcRenderer.on('window-resize', newCallback);
        return () => {
            electron_1.ipcRenderer.removeListener('window-resize', newCallback);
        };
    },
    lockCurrentSizeAsMinimum: () => {
        return electron_1.ipcRenderer.invoke('lock-current-size-as-minimum');
    },
    resetMinimumSize: () => {
        return electron_1.ipcRenderer.invoke('reset-minimum-size');
    },
    getWindowSize: () => {
        return electron_1.ipcRenderer.invoke('get-window-size');
    }
});
