const {ipcRenderer} = require('electron');
const {writable} = require('svelte/store');

window.holdon = {
    history: writable([]),
    paste: (data) => ipcRenderer.invoke("pasteClip", data),
    close: () => ipcRenderer.invoke("close")
};

ipcRenderer.on("clipboardHistoryUpdated", (_, message) => {
  window.holdon.history.set(message);
  // console.log('update')
  // console.log(message)
});

