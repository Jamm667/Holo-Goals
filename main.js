/* Electron 主进程 —— HOLO//GOALS exe
   直接复用现有前端三件套，无需改动业务代码 */
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

let win;

// 单实例：避免多开导致 localStorage 数据互相覆盖
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, 'logo.ico');
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 640,
    title: 'HOLO//GOALS · 全息长期目标矩阵',
    backgroundColor: '#04060e',
    ...(require('fs').existsSync(iconPath) ? { icon: iconPath } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
      devTools: false
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  // exe 中外链用系统浏览器打开
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 阻止页面内导航到外部地址
  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) return;
    event.preventDefault();
    shell.openExternal(url);
  });

  // 屏蔽会打断使用的快捷键
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') event.preventDefault();
    if (input.control && input.shift && ['I', 'J', 'C'].includes(input.key.toUpperCase())) event.preventDefault();
    if (input.control && input.key.toLowerCase() === 'r') event.preventDefault();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
