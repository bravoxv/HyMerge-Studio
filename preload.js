const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openDialog: (options) => ipcRenderer.invoke('dialog:open', options),
    compareFolders: (params) => ipcRenderer.invoke('folder:compare', params),
    readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
    openWithSystem: (filePath) => ipcRenderer.invoke('shell:openWith', filePath),
    showInFolder: (filePath) => ipcRenderer.invoke('shell:showInFolder', filePath),
    getMediaPreview: (filePath) => ipcRenderer.invoke('media:getPreview', filePath),
    onCompareProgress: (callback) => {
        const handler = (event, data) => callback(data);
        ipcRenderer.on('folder:compare-progress', handler);
        return () => ipcRenderer.removeListener('folder:compare-progress', handler);
    },
    // HyCreator 3D & Prefabs
    hycreatorGetInfo: () => ipcRenderer.invoke('hycreator:getInfo'),
    hycreatorGetCatalogItems: (params) => ipcRenderer.invoke('hycreator:getCatalogItems', params),
    hycreatorGetCatalogTree: (params) => ipcRenderer.invoke('hycreator:getCatalogTree', params),
    hycreatorReadAsset: (params) => ipcRenderer.invoke('hycreator:readAsset', params),
    hycreatorResolveModel: (params) => ipcRenderer.invoke('hycreator:resolveModel', params),
    hycreatorScanLocal: (params) => ipcRenderer.invoke('hycreator:scanLocal', params),
    writeClipboardImage: (dataUrl) => ipcRenderer.invoke('clipboard:writeImage', dataUrl),
    saveImageDialog: (params) => ipcRenderer.invoke('dialog:saveImage', params),
    compareGithub: (params) => ipcRenderer.invoke('github:compare', params),
    readGithubBlob: (params) => ipcRenderer.invoke('github:readBlob', params)
});
