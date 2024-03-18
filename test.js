const { ipcRenderer } = require('electron');

document.getElementById('go-back').addEventListener('click', () => {
    ipcRenderer.send('navigate-back');
});

document.getElementById('go-forward').addEventListener('click', () => {
    ipcRenderer.send('navigate-forward');
});