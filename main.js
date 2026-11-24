const { app, BrowserWindow, ipcMain, dialog, shell, clipboard, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 960,
        minHeight: 640,
        title: 'HyMerge Studio — Hytale Asset & Diff Explorer',
        icon: path.join(__dirname, 'assets', 'logo.png'),
        backgroundColor: '#090c15',
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    // Pre-cargar el índice del ZIP en segundo plano para acelerar el primer modelo
    setTimeout(() => {
        const hycreatorSvc = require('./hycreator_service');
        if (hycreatorSvc.warmupZipIndex) {
            hycreatorSvc.warmupZipIndex('release').catch(() => {});
        }
    }, 2000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Extensiones multimedia reconocidas
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico', '.avif']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.ogg', '.mov', '.mkv']);

function isImageFile(filename) {
    if (!filename) return false;
    return IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

function isVideoFile(filename) {
    if (!filename) return false;
    return VIDEO_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

// Carpetas del sistema o dependencias a omitir durante el escaneo
const IGNORED_DIRS = new Set([
    'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'bin', 'obj',
    '.next', '.nuxt', '.cache', '.idea', '.vscode', '$recycle.bin', 'system volume information'
]);

// IPC Handler: Diálogo nativo para seleccionar Archivo o Carpeta
ipcMain.handle('dialog:open', async (event, options = {}) => {
    const { mode = 'file', title = 'Seleccionar' } = options;
    const properties = mode === 'folder' ? ['openDirectory'] : ['openFile'];

    const result = await dialog.showOpenDialog(mainWindow, {
        title,
        properties,
        filters: mode === 'file' ? [
            { name: 'Todos los Archivos', extensions: ['*'] },
            { name: 'Imágenes y Videos', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'mp4', 'webm', 'mov'] },
            { name: 'Código y Texto', extensions: ['js', 'json', 'py', 'txt', 'md', 'html', 'css', 'xml'] }
        ] : []
    });

    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }

    const selectedPath = result.filePaths[0];

    if (mode === 'folder') {
        return { path: selectedPath, name: path.basename(selectedPath), isFolder: true };
    } else {
        try {
            const isImg = isImageFile(selectedPath);
            const isVid = isVideoFile(selectedPath);
            let content = null;

            if (!isImg && !isVid) {
                // Leer texto solo si es un archivo de texto/código y menor a 20MB
                const stat = await fs.promises.stat(selectedPath);
                if (stat.size < 20 * 1024 * 1024) {
                    content = await fs.promises.readFile(selectedPath, 'utf-8');
                } else {
                    content = `// [Archivo grande: ${(stat.size / 1024 / 1024).toFixed(1)} MB - No se carga en memoria para prevenir bloqueo]`;
                }
            }

            const normalizedPath = selectedPath.replace(/\\/g, '/');
            const fileUrl = normalizedPath.startsWith('/') ? `file://${normalizedPath}` : `file:///${normalizedPath}`;

            return {
                path: selectedPath,
                name: path.basename(selectedPath),
                content,
                fileUrl,
                isFolder: false,
                isImage: isImg,
                isVideo: isVid,
                isMedia: isImg || isVid
            };
        } catch (err) {
            return { error: err.message };
        }
    }
});

// Función de comparación asincrónica por bloques (64KB Chunks)
// No satura la memoria RAM ni bloquea el hilo principal con archivos gigantes
async function compareFilesAsync(pathA, pathB, size) {
    if (size === 0) return true;

    const CHUNK_SIZE = 64 * 1024; // 64 KB
    let fdA, fdB;

    try {
        fdA = await fs.promises.open(pathA, 'r');
        fdB = await fs.promises.open(pathB, 'r');

        const bufA = Buffer.alloc(CHUNK_SIZE);
        const bufB = Buffer.alloc(CHUNK_SIZE);
        let bytesProcessed = 0;

        while (bytesProcessed < size) {
            const toRead = Math.min(CHUNK_SIZE, size - bytesProcessed);
            const { bytesRead: readA } = await fdA.read(bufA, 0, toRead, bytesProcessed);
            const { bytesRead: readB } = await fdB.read(bufB, 0, toRead, bytesProcessed);

            if (readA !== readB) return false;
            if (readA === 0) break;

            // Comparar el trozo actual
            if (!bufA.subarray(0, readA).equals(bufB.subarray(0, readB))) {
                return false; // Diferencia encontrada inmediatamente, terminar comparación
            }

            bytesProcessed += readA;

            // Ceder tiempo al bucle de eventos cada 2MB procesados
            if (bytesProcessed % (2 * 1024 * 1024) < CHUNK_SIZE) {
                await new Promise(resolve => setImmediate(resolve));
            }
        }

        return true;
    } catch (err) {
        return false;
    } finally {
        if (fdA) await fdA.close().catch(() => {});
        if (fdB) await fdB.close().catch(() => {});
    }
}

// Escaneo recursivo asincrónico optimizado (cola por índice + stat en lotes paralelos)
async function getFilesRecursivelyAsync(dirPath, baseDir = dirPath, onProgress = null) {
    const results = [];
    if (!fs.existsSync(dirPath)) return results;

    const queue = [dirPath];
    let head = 0;
    let fileCount = 0;
    const STAT_BATCH_SIZE = 32;

    while (head < queue.length) {
        const currentDir = queue[head++];

        let entries;
        try {
            entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
        } catch (e) {
            continue; // Permisos o error al leer carpeta
        }

        const pendingFiles = [];
        for (const entry of entries) {
            const entryNameLower = entry.name.toLowerCase();
            if (IGNORED_DIRS.has(entryNameLower) || entryNameLower.startsWith('.')) {
                continue;
            }

            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                queue.push(fullPath);
            } else if (entry.isFile() || entry.isSymbolicLink()) {
                pendingFiles.push({ entry, fullPath });
            }
        }

        for (let i = 0; i < pendingFiles.length; i += STAT_BATCH_SIZE) {
            const batch = pendingFiles.slice(i, i + STAT_BATCH_SIZE);
            const batchStats = await Promise.all(batch.map(async ({ entry, fullPath }) => {
                try {
                    const stat = await fs.promises.stat(fullPath);
                    return { entry, fullPath, stat };
                } catch (e) {
                    return null;
                }
            }));

            for (const item of batchStats) {
                if (!item) continue;
                results.push({
                    relativePath: path.relative(baseDir, item.fullPath),
                    fullPath: item.fullPath,
                    name: item.entry.name,
                    size: item.stat.size,
                    mtime: item.stat.mtime
                });
                fileCount++;
                if (fileCount % 200 === 0 && onProgress) {
                    onProgress(fileCount);
                }
            }

            if (fileCount % 200 < STAT_BATCH_SIZE) {
                await new Promise(resolve => setImmediate(resolve));
            }
        }
    }

    return results;
}

// IPC Handler: Comparación ultra optimizada y no bloqueante de Carpetas
ipcMain.handle('folder:compare', async (event, { leftFolderPath, rightFolderPath }) => {
    try {
        // Fase 1: Escanear carpeta izquierda
        event.sender.send('folder:compare-progress', {
            phase: 'scanning',
            side: 'left',
            message: 'Indexando archivos de la carpeta Original...'
        });

        const leftFiles = await getFilesRecursivelyAsync(leftFolderPath, leftFolderPath, (count) => {
            event.sender.send('folder:compare-progress', {
                phase: 'scanning',
                side: 'left',
                scanned: count,
                message: `Indexando Original: ${count} archivos encontrados...`
            });
        });

        // Fase 2: Escanear carpeta derecha
        event.sender.send('folder:compare-progress', {
            phase: 'scanning',
            side: 'right',
            message: 'Indexando archivos de la carpeta Modificada...'
        });

        const rightFiles = await getFilesRecursivelyAsync(rightFolderPath, rightFolderPath, (count) => {
            event.sender.send('folder:compare-progress', {
                phase: 'scanning',
                side: 'right',
                scanned: count,
                message: `Indexando Modificada: ${count} archivos encontrados...`
            });
        });

        // Fase 3: Crear mapa de coincidencias
        const fileMap = new Map();

        for (const f of leftFiles) {
            const isImg = isImageFile(f.name);
            const isVid = isVideoFile(f.name);
            const normalized = f.fullPath.replace(/\\/g, '/');

            fileMap.set(f.relativePath, {
                relativePath: f.relativePath,
                name: f.name,
                ext: path.extname(f.name).toLowerCase(),
                isImage: isImg,
                isVideo: isVid,
                isMedia: isImg || isVid,
                inLeft: true,
                leftPath: f.fullPath,
                leftUrl: normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`,
                leftSize: f.size,
                leftDate: f.mtime,
                inRight: false,
                rightPath: null,
                rightUrl: null,
                rightSize: null,
                rightDate: null,
                status: 'left-only'
            });
        }

        for (const f of rightFiles) {
            const isImg = isImageFile(f.name);
            const isVid = isVideoFile(f.name);
            const normalized = f.fullPath.replace(/\\/g, '/');

            if (fileMap.has(f.relativePath)) {
                const item = fileMap.get(f.relativePath);
                item.inRight = true;
                item.rightPath = f.fullPath;
                item.rightUrl = normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`;
                item.rightSize = f.size;
                item.rightDate = f.mtime;

                // Verificación rápida por tamaño
                if (item.leftSize !== item.rightSize) {
                    item.status = 'modified';
                } else if (item.leftSize === 0) {
                    item.status = 'identical';
                } else if (Math.abs(item.leftDate.getTime() - item.rightDate.getTime()) < 1000) {
                    // Mismo tamaño y fecha prácticamente idéntica
                    item.status = 'identical';
                } else {
                    // Marcado para verificación de contenido en Fase 4
                    item.status = 'pending-compare';
                }
            } else {
                fileMap.set(f.relativePath, {
                    relativePath: f.relativePath,
                    name: f.name,
                    ext: path.extname(f.name).toLowerCase(),
                    isImage: isImg,
                    isVideo: isVid,
                    isMedia: isImg || isVid,
                    inLeft: false,
                    leftPath: null,
                    leftUrl: null,
                    leftSize: null,
                    leftDate: null,
                    inRight: true,
                    rightPath: f.fullPath,
                    rightUrl: normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`,
                    rightSize: f.size,
                    rightDate: f.mtime,
                    status: 'right-only'
                });
            }
        }

        // Fase 4: Comparación asincrónica de contenido solo para archivos con mismo tamaño
        const pendingItems = Array.from(fileMap.values()).filter(i => i.status === 'pending-compare');
        const totalPending = pendingItems.length;

        for (let idx = 0; idx < totalPending; idx++) {
            const item = pendingItems[idx];

            if (idx % 10 === 0) {
                event.sender.send('folder:compare-progress', {
                    phase: 'comparing',
                    current: idx + 1,
                    total: totalPending,
                    file: item.name,
                    message: `Comparando contenido: (${idx + 1}/${totalPending}) ${item.name}`
                });
                await new Promise(resolve => setImmediate(resolve));
            }

            const areEqual = await compareFilesAsync(item.leftPath, item.rightPath, item.leftSize);
            item.status = areEqual ? 'identical' : 'modified';
        }

        event.sender.send('folder:compare-progress', {
            phase: 'done',
            message: 'Comparación completada con éxito.'
        });

        return Array.from(fileMap.values()).sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    } catch (err) {
        console.error('Error comparando carpetas:', err);
        return { error: err.message };
    }
});

// IPC Handler: Leer archivo específico
ipcMain.handle('file:read', async (event, filePath) => {
    try {
        if (!filePath || !fs.existsSync(filePath)) return { error: 'El archivo no existe' };
        const ext = path.extname(filePath).toLowerCase();
        const isImg = isImageFile(filePath);
        const isVid = isVideoFile(filePath);
        const stat = await fs.promises.stat(filePath);

        const normalizedPath = filePath.replace(/\\/g, '/');
        const fileUrl = normalizedPath.startsWith('/') ? `file://${normalizedPath}` : `file:///${normalizedPath}`;

        if (isImg || isVid) {
            return {
                name: path.basename(filePath),
                path: filePath,
                size: stat.size,
                isMedia: true,
                isImage: isImg,
                isVideo: isVid,
                fileUrl
            };
        }

        let content = '';
        if (stat.size < 20 * 1024 * 1024) {
            content = await fs.promises.readFile(filePath, 'utf-8');
        } else {
            content = `// [Archivo de gran tamaño: ${(stat.size / 1024 / 1024).toFixed(1)} MB - No cargado para proteger rendimiento]`;
        }

        return { content, name: path.basename(filePath), path: filePath, isMedia: false, fileUrl };
    } catch (err) {
        return { error: err.message };
    }
});

// IPC Handler: Previsualización multimedia rápida con URL directa
ipcMain.handle('media:getPreview', async (event, filePath) => {
    try {
        if (!filePath || !fs.existsSync(filePath)) return null;
        const ext = path.extname(filePath).toLowerCase();
        const stat = await fs.promises.stat(filePath);
        const isImg = isImageFile(filePath);
        const isVid = isVideoFile(filePath);

        if (!isImg && !isVid) return null;

        const normalizedPath = filePath.replace(/\\/g, '/');
        const fileUrl = normalizedPath.startsWith('/') ? `file://${normalizedPath}` : `file:///${normalizedPath}`;

        return {
            path: filePath,
            name: path.basename(filePath),
            ext,
            size: stat.size,
            mtime: stat.mtime,
            isImage: isImg,
            isVideo: isVid,
            fileUrl
        };
    } catch (err) {
        return null;
    }
});

// IPC Handler: Abrir con programa predeterminado del sistema
ipcMain.handle('shell:openWith', async (event, filePath) => {
    if (!filePath) return false;
    try {
        await shell.openPath(filePath);
        return true;
    } catch (err) {
        return false;
    }
});

// IPC Handler: Mostrar archivo en el Explorador de Windows
ipcMain.handle('shell:showInFolder', async (event, filePath) => {
    if (!filePath) return false;
    try {
        shell.showItemInFolder(filePath);
        return true;
    } catch (err) {
        return false;
    }
});

// --- HYCREATOR 3D / PREFABS SERVICE ---
const hycreator = require('./hycreator_service');

ipcMain.handle('hycreator:getInfo', async () => {
    return await hycreator.getHyCreatorInfo();
});

ipcMain.handle('hycreator:getCatalogItems', async (event, params) => {
    return await hycreator.getCatalogItems(params);
});

ipcMain.handle('hycreator:getCatalogTree', async (event, params) => {
    return await hycreator.getCatalogTree(params);
});

ipcMain.handle('hycreator:readAsset', async (event, params) => {
    return await hycreator.readAssetContent(params);
});

ipcMain.handle('hycreator:resolveModel', async (event, params) => {
    return await hycreator.resolveModelOrPrefab(params);
});

ipcMain.handle('hycreator:scanLocal', async (event, params) => {
    return await hycreator.scanLocalFolder(params);
});

// IPC Handler: Copiar imagen nativa al portapapeles de Windows (Soporta transparencia PNG)
ipcMain.handle('clipboard:writeImage', async (event, dataUrl) => {
    try {
        if (!dataUrl) return false;
        const img = nativeImage.createFromDataURL(dataUrl);
        clipboard.writeImage(img);
        return true;
    } catch (err) {
        console.error('Error escribiendo imagen en portapapeles:', err);
        return false;
    }
});

// IPC Handler: Diálogo nativo para guardar imagen PNG en disco
ipcMain.handle('dialog:saveImage', async (event, { dataUrl, defaultName = 'modelo_3d.png' }) => {
    try {
        if (!dataUrl) return false;
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Guardar Captura 3D sin fondo',
            defaultPath: defaultName,
            filters: [
                { name: 'Imagen PNG Transparente (*.png)', extensions: ['png'] }
            ]
        });

        if (result.canceled || !result.filePath) return false;
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        await fs.promises.writeFile(result.filePath, base64Data, 'base64');
        return true;
    } catch (err) {
        console.error('Error guardando imagen:', err);
        return false;
    }
});

// --- COMPARADOR DIRECTO DE GITHUB (COMMITS / RAMAS / CARPETAS SIN DESCARGAR) ---
function parseGithubUrl(rawUrl) {
    const cleaned = String(rawUrl || '').trim().replace(/\/+$/, '');
    let parsed;
    try {
        parsed = new URL(cleaned);
    } catch (_) {
        throw new Error(`URL de GitHub inválida: ${rawUrl}`);
    }
    if (!/^(www\.)?github\.com$/i.test(parsed.hostname)) {
        throw new Error(`La URL debe pertenecer a github.com: ${rawUrl}`);
    }
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) {
        throw new Error(`Falta usuario/repositorio en la URL: ${rawUrl}`);
    }
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, '');
    let ref = 'HEAD';
    let subpath = '';

    if (parts[2] === 'commit' && parts[3]) {
        ref = parts[3];
    } else if (parts[2] === 'tree' && parts[3]) {
        ref = parts[3];
        if (parts.length > 4) subpath = parts.slice(4).join('/');
    } else if (parts[2] === 'blob' && parts[3]) {
        ref = parts[3];
        if (parts.length > 4) subpath = parts.slice(4, -1).join('/');
    }

    return { owner, repo, ref, subpath };
}

function githubApiGet(apiPath, token) {
    return new Promise((resolve, reject) => {
        const headers = {
            'User-Agent': 'HyCreatorStudio-GitHubDiff',
            'Accept': 'application/vnd.github.v3+json'
        };
        if (token && token.trim()) {
            headers['Authorization'] = `Bearer ${token.trim()}`;
        }
        const req = https.request({
            hostname: 'api.github.com',
            path: apiPath,
            method: 'GET',
            headers,
            timeout: 20000
        }, (res) => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                const text = Buffer.concat(chunks).toString('utf8');
                let json = null;
                try { json = JSON.parse(text); } catch (_) {}
                if (res.statusCode === 200 && json) {
                    return resolve(json);
                }
                const msg = (json && json.message) ? json.message : `HTTP ${res.statusCode}`;
                if (res.statusCode === 404) {
                    return reject(new Error(`No encontrado o repositorio privado sin token válido (${msg})`));
                }
                if (res.statusCode === 401 || res.statusCode === 403) {
                    return reject(new Error(`Acceso denegado / límite de API GitHub (${msg})`));
                }
                reject(new Error(`GitHub API error: ${msg}`));
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Tiempo de espera agotado conectando con GitHub')); });
        req.end();
    });
}

async function fetchGithubTreeMap(parsed, token) {
    const { owner, repo, ref, subpath } = parsed;
    let treeSha = ref;

    // Si hay subcarpeta, intentar resolver primero el SHA del árbol de la subcarpeta para evitar truncamiento
    if (subpath) {
        try {
            const rootTree = await githubApiGet(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}`, token);
            const segments = subpath.split('/').filter(Boolean);
            let currentTree = rootTree;
            let resolvedSubSha = null;
            for (let s = 0; s < segments.length; s++) {
                const seg = segments[s];
                const match = (currentTree.tree || []).find(t => t.type === 'tree' && t.path === seg);
                if (!match) {
                    resolvedSubSha = null;
                    break;
                }
                if (s === segments.length - 1) {
                    resolvedSubSha = match.sha;
                } else {
                    currentTree = await githubApiGet(`/repos/${owner}/${repo}/git/trees/${match.sha}`, token);
                }
            }
            if (resolvedSubSha) {
                const subData = await githubApiGet(`/repos/${owner}/${repo}/git/trees/${resolvedSubSha}?recursive=1`, token);
                const map = new Map();
                for (const entry of (subData.tree || [])) {
                    if (entry.type === 'blob') {
                        map.set(entry.path, { path: `${subpath}/${entry.path}`, sha: entry.sha, size: entry.size || 0 });
                    }
                }
                return map;
            }
        } catch (_) {
            // Fallback al árbol recursivo completo
        }
    }

    const data = await githubApiGet(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(treeSha)}?recursive=1`, token);
    const map = new Map();
    const prefix = subpath ? `${subpath}/` : '';
    for (const entry of (data.tree || [])) {
        if (entry.type !== 'blob') continue;
        if (prefix) {
            if (!entry.path.startsWith(prefix)) continue;
            const rel = entry.path.slice(prefix.length);
            map.set(rel, { path: entry.path, sha: entry.sha, size: entry.size || 0 });
        } else {
            map.set(entry.path, { path: entry.path, sha: entry.sha, size: entry.size || 0 });
        }
    }
    return map;
}

ipcMain.handle('github:compare', async (event, { leftUrl, rightUrl, token }) => {
    try {
        const leftParsed = parseGithubUrl(leftUrl);
        const rightParsed = parseGithubUrl(rightUrl);

        event.sender.send('folder:compare-progress', {
            phase: 'scanning',
            side: 'left',
            message: `Consultando árbol de GitHub (${leftParsed.owner}/${leftParsed.repo} @ ${leftParsed.ref.slice(0, 7)})...`
        });

        const [leftMap, rightMap] = await Promise.all([
            fetchGithubTreeMap(leftParsed, token),
            fetchGithubTreeMap(rightParsed, token)
        ]);

        const resultMap = new Map();

        for (const [rel, f] of leftMap.entries()) {
            const name = path.posix.basename(rel);
            const isImg = isImageFile(name);
            const isVid = isVideoFile(name);
            resultMap.set(rel, {
                relativePath: rel,
                name,
                ext: path.posix.extname(name).toLowerCase(),
                isImage: isImg,
                isVideo: isVid,
                isMedia: isImg || isVid,
                isGithub: true,
                inLeft: true,
                leftPath: `gh://${leftParsed.owner}/${leftParsed.repo}/${leftParsed.ref}/${f.path}`,
                leftGithub: { owner: leftParsed.owner, repo: leftParsed.repo, sha: f.sha, path: f.path, ref: leftParsed.ref },
                leftSize: f.size,
                leftDate: null,
                inRight: false,
                rightPath: null,
                rightGithub: null,
                rightSize: null,
                rightDate: null,
                status: 'left-only'
            });
        }

        for (const [rel, f] of rightMap.entries()) {
            const name = path.posix.basename(rel);
            const isImg = isImageFile(name);
            const isVid = isVideoFile(name);
            if (resultMap.has(rel)) {
                const item = resultMap.get(rel);
                item.inRight = true;
                item.rightPath = `gh://${rightParsed.owner}/${rightParsed.repo}/${rightParsed.ref}/${f.path}`;
                item.rightGithub = { owner: rightParsed.owner, repo: rightParsed.repo, sha: f.sha, path: f.path, ref: rightParsed.ref };
                item.rightSize = f.size;
                item.status = (item.leftGithub.sha === f.sha) ? 'identical' : 'modified';
            } else {
                resultMap.set(rel, {
                    relativePath: rel,
                    name,
                    ext: path.posix.extname(name).toLowerCase(),
                    isImage: isImg,
                    isVideo: isVid,
                    isMedia: isImg || isVid,
                    isGithub: true,
                    inLeft: false,
                    leftPath: null,
                    leftGithub: null,
                    leftSize: null,
                    leftDate: null,
                    inRight: true,
                    rightPath: `gh://${rightParsed.owner}/${rightParsed.repo}/${rightParsed.ref}/${f.path}`,
                    rightGithub: { owner: rightParsed.owner, repo: rightParsed.repo, sha: f.sha, path: f.path, ref: rightParsed.ref },
                    rightSize: f.size,
                    rightDate: null,
                    status: 'right-only'
                });
            }
        }

        event.sender.send('folder:compare-progress', {
            phase: 'done',
            message: 'Comparación de GitHub completada.'
        });

        return Array.from(resultMap.values()).sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    } catch (err) {
        return { error: err.message };
    }
});

ipcMain.handle('github:readBlob', async (event, { owner, repo, sha, name, token }) => {
    try {
        const data = await githubApiGet(`/repos/${owner}/${repo}/git/blobs/${sha}`, token);
        const rawB64 = (data.content || '').replace(/\n/g, '');
        const ext = path.extname(name || '').toLowerCase();
        const isImg = isImageFile(name);

        if (isImg) {
            const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg';
            return {
                name,
                isMedia: true,
                isImage: true,
                isVideo: false,
                dataUrl: `data:${mime};base64,${rawB64}`
            };
        }

        const buf = Buffer.from(rawB64, 'base64');
        return {
            name,
            isMedia: false,
            content: buf.toString('utf8')
        };
    } catch (err) {
        return { error: err.message };
    }
});
