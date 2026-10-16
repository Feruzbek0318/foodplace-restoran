const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 650,
    title: "FoodPlace",
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: false
    },
    show: false
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadFile(path.join(__dirname, '../app/index.html'));

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    mainWindow.loadFile(path.join(__dirname, 'error.html'));
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process crashed:', details.reason);
    mainWindow.loadFile(path.join(__dirname, 'error.html'));
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.on('app-reload', () => {
  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, '../app/index.html'));
  }
});

ipcMain.on('app-quit', () => {
  app.quit();
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
