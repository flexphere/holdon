// Modules to control application life and create native browser window
const {app, ipcMain, clipboard, nativeImage, Tray, Menu, globalShortcut, BrowserWindow} = require('electron')
const path = require('path')

const spawn = require('child_process').spawn;
const {ArrayStore} = require('./store.js');

const CLIPBOARD_WATCH_INTERVAL = 250;
const CLIPBOARD_HISTORY_FILE = path.join(app.getPath('userData'), 'history.json');
const CLIPBOARD_HISTORY_MAX = 1000;

const history = new ArrayStore(CLIPBOARD_HISTORY_FILE, CLIPBOARD_HISTORY_MAX);

let win = null;
let prevClip = "";

function createWindow () {
  const winWidth = 800;
  const winHeight = 600;

  win = new BrowserWindow({
    minWidth: winWidth,
    minHeight: winHeight,
    width: winWidth,
    height: winHeight,
    // useContentSize: true,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    minimizable: true,
    maximizable: false,
    movable: false,
    fullscreenable: false,
    transparent: true,
    webPreferences: {
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  win.loadFile('app/index.html');
  // win.webContents.openDevTools()
  win.webContents.send("clipboardHistoryUpdated", history.data);

  win.on('blur', function(event){
    event.preventDefault();
    hideWindow();
  });

  win.on('close', function (event) {
    hideWindow();
  });

  win.on('closed', function(){
    win = null;
  });

  win.on('restore', function(){
    if (process.platform === 'win32') {
      win.setSize(winWidth, winHeight + 20);
    }
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

ipcMain.handle('pasteClip', async(event, clip) => {
  if (!history.data.length) {
    return;
  }

  hideWindow();

  if (clip.type == "text") {
    clipboard.writeText(clip.data);
  }

  if (clip.type == "image") {
    const image = nativeImage.createFromDataURL(clip.data);
    clipboard.writeImage(image);
  }

  spawn("powershell.exe",[`Add-Type -AssemblyName System.Windows.Forms \n[System.Windows.Forms.SendKeys]::SendWait("%n^{v}")`]);
});

ipcMain.handle('deleteClip', (event, clip) => {
  history.delete(clip);
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

  tray.on('click', ()=>{
    showWindow();
  });

  tray.on('right-click',()=>{
    tray.popUpContextMenu(contextMenu);
  });

  clipboardWatcher = setInterval(function(){
    const text = clipboard.readText();
    const img = clipboard.readImage();
    const clip = {
      type: img.isEmpty() ? 'text' : 'image',
      data: img.isEmpty() ?  text  : img.toDataURL(),
      time: (new Date()).getTime()
    }

    if (clip.data == "") {
      return;
    }

    if (clip.type != prevClip.type || clip.data !== prevClip.data) {
      prevClip = clip;
      history.push(clip);
      if (win) win.webContents.send("clipboardHistoryUpdated", history.data);
    }
  }, CLIPBOARD_WATCH_INTERVAL);
})

app.on('window-all-closed', () => {
  // Do Nothing
});