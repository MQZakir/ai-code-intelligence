interface ElectronAPI {
    setWindowSize: (width: number, height: number) => void;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export { }; 