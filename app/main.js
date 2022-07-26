// Modules to control application life and create native browser window
const {app, ipcMain, clipboard, nativeImage, Tray, Menu, shell, globalShortcut, BrowserWindow} = require('electron')

const path = require('path')

const {execFile} = require('child_process');
const {ArrayStore, ObjectStore} = require('./store.js');

const argv = process.argv.slice(2);
const production = !argv.find(_ => _ === '--dev');
const devTools = !!argv.find(_ => _ === '--devtools');

const CLIPBOARD_HISTORY_FILE = path.join(app.getPath('userData'), 'history.json');
const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');

const defaultSettings =  {
  shortCut: "CommandOrControl+Shift+V",
  pasteOnApply: true,
  preloadClipboard: false,
  historySize: 1000,
  watchInterval: 250,
  includeImages: true,
};

const settings = new ObjectStore(SETTINGS_FILE, defaultSettings);
const history = new ArrayStore(CLIPBOARD_HISTORY_FILE, settings.get('historySize'));

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
    skipTaskbar: true,
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

  if(devTools) {
    win.webContents.openDevTools();
  }
}

function hideWindow() {
  if (win) {
    win.webContents.send("ResetSearch");
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
  
  const type = clip.pasteOptions[clip.pasteAs];
  
  if (type == "text") {
    clipboard.writeText(clip.text);
  }

  if (type == "rtf") {
    clipboard.writeRTF(clip.rtf);
  }

  if (type == "image") {
    const image = nativeImage.createFromDataURL(clip.image);
    clipboard.writeImage(image);
  }

  if (settings.get('pasteOnApply') === true) {
    const pasteExec = production
                    ? path.join(process.resourcesPath, 'app/bin/crosspaster.exe')
                    : path.join(__dirname, 'bin/crosspaster.exe')

    execFile(pasteExec, function(err, data) {
      if(err){
        console.log(err)
      }
    });
  }
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
  globalShortcut.register(settings.get('shortCut'), () => {
    showWindow();
  });

  const contextMenu = Menu.buildFromTemplate([
    {label:'ClearAll', click(menuItem){ win.webContents.send("clipboardHistoryUpdated", history.clear()); }},
    { type: 'separator' },
    {label:'Settings', click(menuItem){ shell.openExternal(SETTINGS_FILE);}},
    { type: 'separator' },
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

  if (settings.get('preloadClipboard') === false) {
    clipboard.writeText('');
  }

  clipboardWatcher = setInterval(function(){
    const img = clipboard.readImage();

    const clip = {
      text: clipboard.readText(),
      rtf: clipboard.readRTF(),
      image: img.isEmpty() ? '' : img.toDataURL()
    }

    console.log(clip)

    if (clip.text === "" && clip.image === "") {
      return;
    }

    if (settings.get('includeImages') === false && !clip.text && clip.image) {
      return;
    }

    if (clip.text !== prevClip.text || clip.image !== prevClip.image) { 
      clip.pasteOptions = Object.keys(clip).filter(k=>clip[k] !== '');
      clip.pasteAs = clip.pasteOptions.length - 1;
      clip.time = (new Date()).getTime();
      prevClip = clip;
      history.push(clip);
      if (win) win.webContents.send("clipboardHistoryUpdated", history.data);
    }
  }, settings.get('watchInterval'));
})

app.on('window-all-closed', () => {
  // Do Nothing
});

app.on('before-quit', ()=>{
  history.save();
  settings.save();
})