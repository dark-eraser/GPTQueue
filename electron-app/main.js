const { app, BrowserWindow, ipcMain, dialog } = require('electron');
try {
  require('electron-reloader')(module)
} catch (_) {}
function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 1200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
      enableRemoteModule: true
    }
  });

  // Load the index.html of the app.
  mainWindow.loadFile('index.html');
  ipcMain.on('navigate-to-new-conversation', (event, page) => {
    console.log('navigate-to-new-conversation', page);
    mainWindow.loadFile(page);
});

mainWindow.on('closed', function () {
    mainWindow = null;
});
}


// ipcMain.on('show-input-dialog', async (event, arg) => {
//   const result = await dialog.showMessageBox({
//     type: 'none',
//     buttons: ['OK', 'Cancel'],
//     title: 'Continue Conversation',
//     message: 'Enter your next message:',
//     detail: 'Your message goes here.',
//     inputType: 'text', // This isn't a valid option for showMessageBox, it's just illustrative
//     // You might need to implement a custom dialog for text input
//   });
//   event.sender.send('input-dialog-response', result.response);
// });
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
