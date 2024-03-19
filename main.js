const { app, BrowserWindow, ipcMain, dialog } = require("electron");

try {
  require("electron-reloader")(module);
} catch (_) {}
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    backgroundColor: "#f0f0f0",
    width: 1600,
    height: 1200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadFile("index.html");
  // Assuming you have this in your main process
global.sharedState = {
  conversationState: null
};

ipcMain.on('save-conversation-state', (event, state) => {
  global.sharedState.conversationState = state;
});

ipcMain.on('request-conversation-state', (event) => {
  event.reply('response-conversation-state', global.sharedState.conversationState);
  console.log('Sent conversation state:', global.sharedState.conversationState);
});

  ipcMain.on("navigate-to-new-conversation", (event, page) => {
    console.log("navigate-to-test", page);

    mainWindow.loadFile(page);
  });
  ipcMain.on('navigate-back', (event) => {
    if (mainWindow.webContents.canGoBack()) {
        mainWindow.webContents.goBack();
    }
  });
  
  ipcMain.on('navigate-forward', (event) => {
    if (mainWindow.webContents.canGoForward()) {
        mainWindow.webContents.goForward();
    }
  });
  
  mainWindow.on("closed", function () {
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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
