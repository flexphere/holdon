const {ipcRenderer} = require('electron');
const {writable} = require('svelte/store');

window.holdon = {};

window.holdon.reset = writable(0);
window.holdon.history = writable([]);

window.holdon.paste = function(data) {
  ipcRenderer.invoke("pasteClip", data);
}

window.holdon.delete = function(data) {
  ipcRenderer.invoke("deleteClip", data);
}

window.holdon.close = function() {
  ipcRenderer.invoke("closeWindow");
}

ipcRenderer.on("clipboardHistoryUpdated", (_, message) => {
  window.holdon.history.set(message);
});

ipcRenderer.on("ResetSearch", (_, message) => {
  window.holdon.reset.set((new Date).getTime());
});

