// Modules to control application life and create native browser window
const {app, ipcMain, clipboard, Tray, Menu, globalShortcut, BrowserWindow} = require('electron')
const path = require('path')
const { keyboard, Key } = require("@nut-tree/nut-js");
const ks = require('node-key-sender');
const {Store} = require('./store.js');

const CLIPBOARD_WATCH_INTERVAL = 250;
const CLIPBOARD_HISTORY_FILE = __dirname + '/history.json';

const history = new Store(CLIPBOARD_HISTORY_FILE);
let win = null;

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    // width: 400,
    // height: 600,
    // minWidth: 400,
    // minHeight: 600,
    // maxWidth: 400,
    // maxHeight: 600,
    useContentSize: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    movable: false,
    fullscreenable: false,
    webPreferences: {
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  win.loadFile('app/index.html')
  win.webContents.openDevTools()
  win.webContents.send("clipboardHistoryUpdated", history.data);

  win.on('blur', function() {
    win.close();
  });

  win.on('closed', function() {
    win = null;
  });
}

ipcMain.handle('pasteClip', async(event, message) => {
  if (!history.data.length) return;
  if (win) win.close();
  try {
    console.log('Paste')
    clipboard.writeText(message);
    await keyboard.pressKey(Key.LeftControl);
    await keyboard.pressKey(Key.V);
    await keyboard.releaseKey(Key.LeftControl);
    await keyboard.releaseKey(Key.V);
    // const x = await ks.sendCombination(['control', 'v']);
    // console.log(x)
    // setTimeout(()=>{ ks.sendCombination(['enter']); }, 100);
  } catch (e) {
    console.log(e)
  }
});


ipcMain.handle('close', (event, message) => {
  if (win) win.close();
});


app.whenReady().then(() => {
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    createWindow();
  });

  const contextMenu = Menu.buildFromTemplate([
    {label:'Exit', click(menuItem){ app.quit(); }}
  ]);

  tray = new Tray(__dirname + '/holdon.ico')
  tray.setToolTip("HoldOn");
  tray.on('right-click',() =>{
    tray.popUpContextMenu(contextMenu);
  });

  clipboardWatcher = setInterval(function(){
    const clip = clipboard.readText();
    if (clip.trim() !== "" && history.data.length && clip !== history.data[0]) {
      clipboardCache = clip;
      history.push(clip);
      history.save();
      console.log(history.data)
      if (win) win.webContents.send("clipboardHistoryUpdated", history.data);
    }
  }, CLIPBOARD_WATCH_INTERVAL);
})

app.on('window-all-closed', () => {
  // Do Nothing
});
