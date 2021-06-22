// Modules to control application life and create native browser window
const {app, ipcMain, clipboard, Tray, Menu, globalShortcut, BrowserWindow} = require('electron')
const path = require('path')
const spawn = require('child_process').spawn;
const {ArrayStore} = require('./store.js');

const CLIPBOARD_WATCH_INTERVAL = 250;
const CLIPBOARD_HISTORY_FILE = __dirname + '/history.json';
const CLIPBOARD_HISTORY_MAX = 1000;

const history = new ArrayStore(CLIPBOARD_HISTORY_FILE, CLIPBOARD_HISTORY_MAX);

let win = null;
let clipboardCache = "";

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    // useContentSize: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    minimizable: true,
    maximizable: false,
    movable: false,
    fullscreenable: false,
    // transparent: true,
    webPreferences: {
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  win.loadFile('app/index.html');
  // win.webContents.openDevTools()
  win.webContents.send("clipboardHistoryUpdated", history.data);

  win.on('blur', function(event){
    console.log("blur")
    event.preventDefault();
    hideWindow();
  });

  win.on('close', function (event) {
    console.log("close")
    if(!app.isQuiting){
        event.preventDefault();
        hideWindow();
    }
    return false;
  });

  win.on('closed', function(){
    win = null;
  });
}

function hideWindow() {
  if (win) {
    win.minimize();
    win.hide();
  }
}


function showWindow() {
  if (win) {
    win.restore();
    win.show();
  } else {
    createWindow();
  }
}

ipcMain.handle('pasteClip', async(event, message) => {
  if (!history.data.length) {
    return;
  }

  hideWindow();
  clipboard.writeText(message);
  spawn("powershell.exe",[`Add-Type -AssemblyName System.Windows.Forms \n[System.Windows.Forms.SendKeys]::SendWait("%n^{v}")`]);
});

ipcMain.handle('deleteClip', (event, message) => {
  history.delete(message); 
  if (win) {
    win.webContents.send("clipboardHistoryUpdated", history.data);
  }
});

ipcMain.handle('closeWindow', (event, message) => {
  hideWindow();
});


app.whenReady().then(() => {
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    showWindow();
  });

  const contextMenu = Menu.buildFromTemplate([
    {label:'Exit', click(menuItem){ app.quit(); }}
  ]);

  tray = new Tray(__dirname + '/holdon.ico');
  tray.setToolTip("HoldOn");
  tray.on('right-click',() =>{
    tray.popUpContextMenu(contextMenu);
  });

  clipboardWatcher = setInterval(function(){
    const img = clipboard.readImage();
    if (img) {
      console.log(img.isEmpty());
    }
    const clip = clipboard.readText();
    if (clip.trim() !== "" && clip !== clipboardCache) {
      clipboardCache = clip;
      history.push(clip);
      if (win) win.webContents.send("clipboardHistoryUpdated", history.data);
    }
  }, CLIPBOARD_WATCH_INTERVAL);
})

app.on('window-all-closed', () => {
  // Do Nothing
});