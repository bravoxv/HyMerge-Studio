const path = require('path');
const fs = require('fs');
let yauzl;
// Intentar cargar yauzl desde múltiples rutas posibles (compatibilidad con Electron empaquetado)
(function loadYauzl() {
    const candidates = [
        'yauzl',
        path.join(__dirname, 'node_modules', 'yauzl'),
        path.join(process.cwd(), 'node_modules', 'yauzl'),
        path.join(__dirname, '..', 'node_modules', 'yauzl'),
        'C:/Program Files/WinMerge/Miversion/resources/app/node_modules/yauzl',
        'C:/Program Files/WinMerge/Miversion/node_modules/yauzl'
    ];
    for (const c of candidates) {
        try { yauzl = require(c); return; } catch (e) {}
    }
    console.error('[HyCreator] No se pudo cargar yauzl desde ninguna ruta conocida.');
})();

// Rutas base por defecto de HyCreator y Hytale
const LOCAL_APP_DATA = process.env.LOCALAPPDATA || '';
const APP_DATA = process.env.APPDATA || '';

const HYCREATOR_DIR = path.join(LOCAL_APP_DATA, 'HyCreator');
const ZIP_SCAN_DIR = path.join(HYCREATOR_DIR, 'zip-scan');
const SETTINGS_FILE = path.join(HYCREATOR_DIR, 'settings.json');

// Caché en memoria para catálogos JSON escaneados
const scanCacheMap = new Map();

// Caché de índice del ZIP: zipPath → { index, basenameIndex, zipfile }
// Permite buscar entradas y sufijos en O(1) sin releer el ZIP completo
const zipIndexCache = new Map();
const zipIndexPromises = new Map();
const blockTextureCache = new Map();

/**
 * Construir o recuperar el índice completo de entradas de un ZIP.
 * Evita lecturas concurrentes duplicadas compartiendo la promesa en curso.
 */
function buildZipIndex(zipPath) {
    if (zipIndexCache.has(zipPath)) {
        return Promise.resolve(zipIndexCache.get(zipPath));
    }
    if (zipIndexPromises.has(zipPath)) {
        return zipIndexPromises.get(zipPath);
    }
    const promise = new Promise((resolve, reject) => {
        const index = new Map(); // lowerName → { entry, zipfile }
        const basenameIndex = new Map(); // basenameLower → Array<{ key, entry }>
        yauzl.open(zipPath, { lazyEntries: true, autoClose: false }, (err, zipfile) => {
            if (err) {
                zipIndexPromises.delete(zipPath);
                return reject(err);
            }
            zipfile.on('entry', (entry) => {
                const lower = entry.fileName.replace(/\\/g, '/').toLowerCase();
                index.set(lower, { entry, zipfile });
                const slashIdx = lower.lastIndexOf('/');
                const base = slashIdx >= 0 ? lower.slice(slashIdx + 1) : lower;
                if (base) {
                    let list = basenameIndex.get(base);
                    if (!list) {
                        list = [];
                        basenameIndex.set(base, list);
                    }
                    list.push({ key: lower, entry });
                }
                zipfile.readEntry();
            });
            zipfile.on('end', () => {
                const cached = { index, basenameIndex, zipfile };
                zipIndexCache.set(zipPath, cached);
                zipIndexPromises.delete(zipPath);
                resolve(cached);
            });
            zipfile.on('error', (zErr) => {
                zipIndexPromises.delete(zipPath);
                reject(zErr);
            });
            zipfile.readEntry();
        });
    });
    zipIndexPromises.set(zipPath, promise);
    return promise;
}

/**
 * Leer un archivo específico del ZIP usando el índice en memoria.
 * Mucho más rápido que releer el ZIP completo desde el inicio.
 */
function readEntryFromZip(zipfile, entry) {
    return new Promise((resolve, reject) => {
        zipfile.openReadStream(entry, (err, stream) => {
            if (err) return reject(err);
            const chunks = [];
            stream.on('data', c => chunks.push(c));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    });
}

/**
 * 1. Detectar instalación de HyCreator, leer settings.json y resolver canales (Release vs Pre-release)
 */
async function getHyCreatorInfo() {
    const isAvailable = fs.existsSync(HYCREATOR_DIR);

    const channels = {
        release: {
            id: 'release',
            name: 'Release',
            version: '0.7.5',
            zipPath: null,
            scanPath: null,
            totalFiles: 0,
            prefabsCount: 0
        },
        prerelease: {
            id: 'prerelease',
            name: 'Pre-release',
            version: '0.8.0-pre.4',
            zipPath: null,
            scanPath: null,
            totalFiles: 0,
            prefabsCount: 0
        }
    };

    let activeChannel = 'release';

    if (isAvailable) {
        // Leer settings.json de HyCreator
        if (fs.existsSync(SETTINGS_FILE)) {
            try {
                const raw = await fs.promises.readFile(SETTINGS_FILE, 'utf8');
                const settings = JSON.parse(raw);
                if (settings.sources) {
                    if (settings.sources.release) channels.release.zipPath = settings.sources.release;
                    if (settings.sources.prerelease) channels.prerelease.zipPath = settings.sources.prerelease;
                }
                if (settings.vanillaChannel) {
                    activeChannel = settings.vanillaChannel.toLowerCase().includes('pre') ? 'prerelease' : 'release';
                }
            } catch (err) {
                console.warn('[HyCreator] Error leyendo settings.json:', err.message);
            }
        }

        // Fallbacks estándar para rutas de Assets.zip en Hytale
        if (!channels.release.zipPath) {
            const hytaleRel = path.join(APP_DATA, 'Hytale', 'install', 'release', 'package', 'game', 'latest', 'Assets.zip');
            if (fs.existsSync(hytaleRel)) channels.release.zipPath = hytaleRel;
        }
        if (!channels.prerelease.zipPath) {
            const hytalePre = path.join(APP_DATA, 'Hytale', 'install', 'pre-release', 'package', 'game', 'latest', 'Assets.zip');
            if (fs.existsSync(hytalePre)) channels.prerelease.zipPath = hytalePre;
        }

        // Leer los escaneos en zip-scan para mapear cada versión por tamaño (len) o mtime
        if (fs.existsSync(ZIP_SCAN_DIR)) {
            try {
                const files = await fs.promises.readdir(ZIP_SCAN_DIR);
                const scans = [];

                for (const f of files) {
                    if (!f.endsWith('.json')) continue;
                    const full = path.join(ZIP_SCAN_DIR, f);
                    try {
                        const st = await fs.promises.stat(full);
                        const raw = await fs.promises.readFile(full, 'utf8');
                        const data = JSON.parse(raw);
                        scans.push({
                            path: full,
                            len: data.len,
                            mtime: data.mtime || st.mtimeMs,
                            filesCount: (data.result && data.result.files) ? data.result.files.length : 0
                        });
                    } catch (e) {}
                }

                // Obtener tamaños en bytes de los Assets.zip para match exacto
                let relSize = 0;
                let preSize = 0;
                if (channels.release.zipPath && fs.existsSync(channels.release.zipPath)) {
                    relSize = (await fs.promises.stat(channels.release.zipPath)).size;
                }
                if (channels.prerelease.zipPath && fs.existsSync(channels.prerelease.zipPath)) {
                    preSize = (await fs.promises.stat(channels.prerelease.zipPath)).size;
                }

                // Asociar scan por tamaño exacto o por orden cronológico
                for (const sc of scans) {
                    if (relSize > 0 && sc.len === relSize) {
                        channels.release.scanPath = sc.path;
                        channels.release.totalFiles = sc.filesCount;
                    }
                    if (preSize > 0 && sc.len === preSize) {
                        channels.prerelease.scanPath = sc.path;
                        channels.prerelease.totalFiles = sc.filesCount;
                    }
                }

                // Fallbacks si no hubo match exacto de tamaño
                if (!channels.release.scanPath && scans.length > 0) {
                    const sorted = [...scans].sort((a, b) => b.mtime - a.mtime);
                    channels.release.scanPath = sorted[0].path;
                    channels.release.totalFiles = sorted[0].filesCount;
                }
                if (!channels.prerelease.scanPath && scans.length > 1) {
                    const sorted = [...scans].sort((a, b) => b.mtime - a.mtime);
                    channels.prerelease.scanPath = sorted[1].path;
                    channels.prerelease.totalFiles = sorted[1].filesCount;
                }
            } catch (err) {
                console.warn('[HyCreator] Error leyendo escaneos:', err.message);
            }
        }
    }

    return {
        is_available: isAvailable,
        hycreator_dir: HYCREATOR_DIR,
        active_channel: activeChannel,
        channels
    };
}

/**
 * Cargar y cachear el catálogo JSON de un scanFile
 */
async function loadScanCatalog(scanPath) {
    if (scanCacheMap.has(scanPath)) {
        return scanCacheMap.get(scanPath);
    }

    const raw = await fs.promises.readFile(scanPath, 'utf8');
    const parsed = JSON.parse(raw);
    const files = parsed.files || (parsed.result && parsed.result.files) || [];

    const items = files.map(f => ({
        rel: f.rel || '',
        name: f.name || path.basename(f.rel || ''),
        kind: f.kind || 'Desconocido'
    }));

    scanCacheMap.set(scanPath, items);
    return items;
}

function matchesExactTokens(name, rel, query) {
    const tokens = (query || '').trim().toLowerCase().split(/[\s_]+/).filter(Boolean);
    if (tokens.length === 0) return true;
    const rawName = name || '';
    const rawRel = rel || '';
    const nameLower = rawName.toLowerCase();
    const relLower = rawRel.toLowerCase();
    const camelSplit = `${rawName} ${rawRel}`.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
    const words = new Set([
        ...`${nameLower} ${relLower}`.split(/[^a-z0-9]+/),
        ...camelSplit.split(/[^a-z0-9]+/)
    ].filter(Boolean));
    const wordList = Array.from(words);
    return tokens.every(tok => {
        if (/[^a-z0-9]/.test(tok)) {
            return nameLower.includes(tok) || relLower.includes(tok);
        }
        return words.has(tok) || wordList.some(w => w.startsWith(tok));
    });
}

/**
 * 2. Obtener items del catálogo según canal, filtro y paginación
 */
async function getCatalogItems(params = {}) {
    const { channel = 'release', scanFile, filterKind, searchTerm, page = 1, pageSize = 40 } = params;

    let targetScan = scanFile;
    if (!targetScan) {
        const info = await getHyCreatorInfo();
        const ch = info.channels[channel] || info.channels.release;
        targetScan = ch ? ch.scanPath : null;
    }

    if (!targetScan || !fs.existsSync(targetScan)) {
        return { total: 0, page: 1, page_size: pageSize, items: [], channel };
    }

    const allItems = await loadScanCatalog(targetScan);

    const term = (searchTerm || '').trim().toLowerCase();
    const kind = (filterKind || '').trim().toLowerCase();

    const filtered = allItems.filter(it => {
        if (term && !matchesExactTokens(it.name, it.rel, term)) {
            return false;
        }

        if (kind && kind !== 'todos') {
            const itKind = (it.kind || '').toLowerCase();
            const relLower = (it.rel || '').toLowerCase();
            if (kind === 'prefabs') {
                // Prefabs: solo archivos .prefab.json en carpeta Prefabs/
                if (!relLower.endsWith('.prefab.json') && !relLower.endsWith('.prefab')) return false;
            } else if (kind === 'blockymodel') {
                // Blockymodels: solo archivos .blockymodel
                if (!relLower.endsWith('.blockymodel')) return false;
            } else if (kind === 'item') {
                // Items: solo los archivos de Item/Items/** que son definiciones reales con Model/Texture/Icon
                // Excluir Item/Animations/, Item/Interactions/, Item/Block/, etc.
                if (itKind !== 'item') return false;
                if (!relLower.startsWith('item/items/')) return false;
            } else if (kind === 'creatures' || kind === 'criaturas' || kind === 'models') {
                // Criaturas y NPCs: modelos en Models/**
                if (!relLower.startsWith('models/') || !relLower.endsWith('.json')) return false;
            } else if (itKind !== kind) {
                return false;
            }
        }

        return true;
    });

    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return {
        total,
        page,
        page_size: pageSize,
        items: paginated,
        channel
    };
}

/**
 * 2b. Obtener items del catálogo organizados como árbol jerárquico de carpetas
 */
async function getCatalogTree(params = {}) {
    const { channel = 'release', scanFile, filterKind = 'Prefabs', searchTerm } = params;

    let targetScan = scanFile;
    if (!targetScan) {
        const info = await getHyCreatorInfo();
        const ch = info.channels[channel] || info.channels.release;
        targetScan = ch ? ch.scanPath : null;
    }

    if (!targetScan || !fs.existsSync(targetScan)) {
        return { total: 0, tree: [], channel };
    }

    const allItems = await loadScanCatalog(targetScan);
    const term = (searchTerm || '').trim().toLowerCase();
    const kind = (filterKind || '').trim().toLowerCase();

    const filtered = allItems.filter(it => {
        const rel = it.rel || '';
        const relLower = rel.toLowerCase();
        const nameLower = (it.name || '').toLowerCase();

        if (term && !matchesExactTokens(it.name, it.rel, term)) {
            return false;
        }

        if (kind && kind !== 'todos') {
            if (kind === 'prefabs') {
                return relLower.endsWith('.prefab.json') || relLower.endsWith('.prefab');
            } else if (kind === 'blockymodel') {
                return relLower.endsWith('.blockymodel');
            } else if (kind === 'creatures' || kind === 'criaturas' || kind === 'models') {
                return relLower.startsWith('models/') && relLower.endsWith('.json');
            } else if (kind === 'item') {
                return relLower.startsWith('item/items/') && relLower.endsWith('.json');
            } else if ((it.kind || '').toLowerCase() !== kind) {
                return false;
            }
        } else {
            // "Todos": incluir solo los elementos 3D relevantes
            return (
                relLower.endsWith('.prefab.json') ||
                relLower.endsWith('.prefab') ||
                relLower.endsWith('.blockymodel') ||
                (relLower.startsWith('models/') && relLower.endsWith('.json')) ||
                (relLower.startsWith('item/items/') && relLower.endsWith('.json'))
            );
        }

        return true;
    }).map(f => {
        let detectedKind = 'Item';
        const rl = f.rel.toLowerCase();
        if (rl.endsWith('.prefab.json') || rl.endsWith('.prefab')) detectedKind = 'Prefabs';
        else if (rl.endsWith('.blockymodel')) detectedKind = 'blockymodel';
        else if (rl.startsWith('models/')) detectedKind = 'Creatures';
        return {
            rel: f.rel,
            name: f.name || f.rel.split('/').pop(),
            kind: detectedKind
        };
    });

    // Construir el árbol a partir de las rutas 'rel'
    const root = { name: 'root', isFolder: true, children: {}, count: 0 };

    for (const item of filtered) {
        const parts = item.rel.split('/');
        let current = root;
        current.count++;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current.children[part]) {
                current.children[part] = {
                    name: part,
                    rel: parts.slice(0, i + 1).join('/'),
                    isFolder: true,
                    count: 0,
                    children: {}
                };
            }
            current = current.children[part];
            current.count++;
        }

        const fileName = parts[parts.length - 1];
        current.children[fileName] = {
            name: item.name || fileName,
            rel: item.rel,
            isFolder: false,
            kind: item.kind
        };
    }

    function toArray(node) {
        const folders = [];
        const files = [];
        for (const child of Object.values(node.children)) {
            if (child.isFolder) {
                child.children = toArray(child);
                folders.push(child);
            } else {
                files.push(child);
            }
        }
        folders.sort((a, b) => a.name.localeCompare(b.name));
        files.sort((a, b) => a.name.localeCompare(b.name));
        return [...folders, ...files];
    }

    const tree = toArray(root);

    return {
        total: filtered.length,
        tree,
        channel
    };
}

/**
 * 3. Extraer y leer un archivo desde Assets.zip o carpeta local
 */
async function readAssetContent(params = {}) {
    const { relPath, channel = 'release', assetsZipOverride, workingFolder } = params;

    if (!relPath) throw new Error('Se requiere relPath');

    // Opción A: Si se pasa workingFolder, buscar localmente
    if (workingFolder) {
        const localPath = path.isAbsolute(relPath) ? relPath : path.join(workingFolder, relPath);
        if (fs.existsSync(localPath)) {
            const stat = await fs.promises.stat(localPath);
            const ext = path.extname(localPath).toLowerCase();
            const isImage = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
            let content;
            let dataUrl = null;
            if (isImage) {
                const buffer = await fs.promises.readFile(localPath);
                dataUrl = `data:image/${ext === '.png' ? 'png' : 'jpeg'};base64,${buffer.toString('base64')}`;
                content = dataUrl;
            } else {
                content = await fs.promises.readFile(localPath, 'utf8');
            }
            return {
                rel_path: relPath,
                format: ext,
                content,
                dataUrl,
                size_bytes: stat.size
            };
        }
    }

    // Opción B: Leer desde Assets.zip usando yauzl con índice en caché
    let zipPath = assetsZipOverride;
    if (!zipPath || !fs.existsSync(zipPath)) {
        const info = await getHyCreatorInfo();
        const ch = info.channels[channel] || info.channels.release;
        zipPath = ch ? ch.zipPath : null;
    }

    if (!zipPath || !fs.existsSync(zipPath)) {
        throw new Error(`Assets.zip no encontrado para canal '${channel}': ${zipPath || 'no configurado'}`);
    }

    const normalizedTarget = relPath.replace(/\\/g, '/').replace(/^\.?\//, '').toLowerCase();

    // Usar índice en caché para acceso O(1) en lugar de leer el ZIP completo
    const { index, basenameIndex, zipfile } = await buildZipIndex(zipPath);

    // Buscar la entrada: exacta, con prefijo Common/, Server/, o como sufijo de ruta en O(1)
    let matchedEntry = null;
    if (index.has(normalizedTarget)) {
        matchedEntry = index.get(normalizedTarget).entry;
    } else if (index.has('common/' + normalizedTarget)) {
        matchedEntry = index.get('common/' + normalizedTarget).entry;
    } else if (index.has('server/' + normalizedTarget)) {
        matchedEntry = index.get('server/' + normalizedTarget).entry;
    } else if (basenameIndex) {
        const slashIdx = normalizedTarget.lastIndexOf('/');
        const base = slashIdx >= 0 ? normalizedTarget.slice(slashIdx + 1) : normalizedTarget;
        const candidates = basenameIndex.get(base) || [];
        const suffix = '/' + normalizedTarget;
        for (const cand of candidates) {
            if (cand.key.endsWith(suffix) || cand.key === normalizedTarget) {
                matchedEntry = cand.entry;
                break;
            }
        }
    }

    if (!matchedEntry) {
        throw new Error(`El archivo '${relPath}' no fue encontrado dentro de Assets.zip.`);
    }

    const buffer = await readEntryFromZip(zipfile, matchedEntry);
    const ext = path.extname(matchedEntry.fileName).toLowerCase();
    const isImage = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
    let content;
    let dataUrl = null;
    if (isImage) {
        dataUrl = `data:image/${ext === '.png' ? 'png' : 'jpeg'};base64,${buffer.toString('base64')}`;
        content = dataUrl;
    } else {
        content = buffer.toString('utf8');
    }
    return {
        rel_path: matchedEntry.fileName,
        format: ext,
        content,
        dataUrl,
        size_bytes: matchedEntry.uncompressedSize || buffer.length,
        channel
    };
}

/**
 * Buscar textura correspondiente a un modelo o item
 */
async function findTextureForModel(modelRel, channel, assetsZipOverride, workingFolder, explicitTex) {
    if (explicitTex) {
        const expClean = explicitTex.replace(/\\/g, '/');
        const expCandidates = expClean.startsWith('Common/') ? [expClean] : [expClean, `Common/${expClean}`];
        for (const ec of expCandidates) {
            try {
                const res = await readAssetContent({ relPath: ec, channel, assetsZipOverride, workingFolder });
                if (res && res.dataUrl) return res;
            } catch (e) {}
        }
    }
    const cleanRel = modelRel.replace(/\\/g, '/');
    const base = cleanRel.replace(/\.blockymodel$/i, '');
    const candidates = [
        base + '_Texture.png',
        base + '.png',
        base + '_texture.png',
        base + '_Active_Texture.png',
        base + '_Inactive_Texture.png'
    ];
    if (!cleanRel.startsWith('Common/')) {
        candidates.push(`Common/${base}_Texture.png`, `Common/${base}.png`);
    }
    const results = await Promise.all(
        candidates.map(cand => readAssetContent({ relPath: cand, channel, assetsZipOverride, workingFolder }).catch(() => null))
    );
    return results.find(res => res && res.dataUrl) || null;
}

/**
 * Buscar animaciones (.blockyanim) asociadas a un modelo en su carpeta de criatura/entidad dentro del ZIP
 */
async function findAnimationsForModel(modelRel, channel, assetsZipOverride, workingFolder) {
    try {
        let zipPath = assetsZipOverride;
        if (!zipPath || !fs.existsSync(zipPath)) {
            const info = await getHyCreatorInfo();
            const ch = info.channels[channel] || info.channels.release;
            zipPath = ch ? ch.zipPath : null;
        }
        if (!zipPath || !fs.existsSync(zipPath)) return { animationList: [], defaultAnimContent: null, defaultAnimName: null };

        const { index } = await buildZipIndex(zipPath);
        const clean = modelRel.replace(/\\/g, '/').replace(/^Common\//i, '').toLowerCase();
        const parts = clean.split('/').filter(Boolean);
        // Subir hasta la carpeta de la criatura (ej. npc/beast/wolf o models/beast/wolf)
        let searchPrefix = '';
        if (parts.length >= 3) {
            // Si termina en models/model.blockymodel, usar la carpeta padre de models/
            const modelsIdx = parts.lastIndexOf('models');
            const baseParts = modelsIdx > 0 ? parts.slice(0, modelsIdx) : parts.slice(0, -1);
            searchPrefix = 'common/' + baseParts.join('/') + '/';
        } else if (parts.length >= 2) {
            searchPrefix = 'common/' + parts.slice(0, -1).join('/') + '/';
        }
        if (!searchPrefix) return { animationList: [], defaultAnimContent: null, defaultAnimName: null };

        const animationList = [];
        for (const [key, val] of index) {
            if (key.startsWith(searchPrefix) && key.endsWith('.blockyanim')) {
                const fileName = path.posix.basename(val.entry.fileName, '.blockyanim');
                animationList.push({
                    name: fileName,
                    path: val.entry.fileName,
                    speed: 1
                });
                if (animationList.length >= 50) break;
            }
        }
        animationList.sort((a, b) => a.name.localeCompare(b.name));

        let defaultAnimContent = null;
        let defaultAnimName = null;
        const idleEntry = animationList.find(a => a.name.toLowerCase().includes('idle')) || animationList[0];
        if (idleEntry) {
            try {
                const animAsset = await readAssetContent({ relPath: idleEntry.path, channel, assetsZipOverride, workingFolder });
                if (animAsset && animAsset.content) {
                    defaultAnimContent = animAsset.content;
                    defaultAnimName = idleEntry.name;
                }
            } catch (e) {}
        }
        return { animationList, defaultAnimContent, defaultAnimName };
    } catch (e) {
        return { animationList: [], defaultAnimContent: null, defaultAnimName: null };
    }
}

/**
 * Resolver texturas y colores oficiales de los tipos de bloques usados en un prefab
 */
async function resolvePrefabBlockTextures(prefabJson, channel, assetsZipOverride, workingFolder) {
    if (!prefabJson || !prefabJson.blocks || !Array.isArray(prefabJson.blocks)) return {};

    // Ordenar bloques por frecuencia descendente para priorizar los más visibles (hasta 120 tipos únicos)
    const blockCounts = new Map();
    for (const b of prefabJson.blocks) {
        if (b && b.name) {
            blockCounts.set(b.name, (blockCounts.get(b.name) || 0) + 1);
        }
    }
    const topBlocks = Array.from(blockCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 120)
        .map(([name]) => name);

    const result = {};
    const info = await getHyCreatorInfo();
    const ch = info.channels[channel] || info.channels.release;
    const targetScan = ch ? ch.scanPath : null;

    let scanFiles = [];
    if (targetScan && fs.existsSync(targetScan)) {
        try {
            scanFiles = await loadScanCatalog(targetScan);
        } catch (e) {}
    }

    const scanItemMap = new Map();
    for (const f of scanFiles) {
        if (f.rel && f.rel.startsWith('Item/Items/') && f.rel.endsWith('.json')) {
            const base = (f.name || '').replace(/\.json$/i, '').toLowerCase();
            scanItemMap.set(base, f.rel);
        }
    }

    const cachePrefix = `${channel || 'release'}::${workingFolder || assetsZipOverride || 'zip'}::v3::`;

    async function tryReadTex(texPath) {
        if (!texPath || typeof texPath !== 'string') return null;
        const clean = texPath.replace(/\\/g, '/');
        const candidates = clean.startsWith('Common/') ? [clean] : [`Common/${clean}`, clean];
        for (const c of candidates) {
            try {
                const texAsset = await readAssetContent({ relPath: c, channel, assetsZipOverride, workingFolder });
                if (texAsset && texAsset.dataUrl) return texAsset.dataUrl;
            } catch (e) {}
        }
        return null;
    }

    await Promise.all(topBlocks.map(async (blockName) => {
        try {
            const cacheKey = cachePrefix + blockName;
            if (blockTextureCache.has(cacheKey)) {
                result[blockName] = blockTextureCache.get(cacheKey);
                return;
            }

            const lower = blockName.toLowerCase();
            let color = null;
            let tint = null;
            let drawType = null;
            let dataUrl = null;
            let faces = null;
            let customModelContent = null;
            let customModelScale = 1.0;

            // 1. Buscar JSON de definición del bloque en Item/Items/ (o su raíz base / Parent)
            let itemRel = scanItemMap.get(lower);
            if (!itemRel) {
                const parts = blockName.split('_');
                for (let len = Math.min(parts.length - 1, 3); len >= 2 && !itemRel; len--) {
                    itemRel = scanItemMap.get(parts.slice(0, len).join('_').toLowerCase());
                }
            }

            if (itemRel) {
                try {
                    const itemAsset = await readAssetContent({ relPath: itemRel, channel, assetsZipOverride, workingFolder });
                    const itemData = JSON.parse(itemAsset.content);
                    let bt = itemData.BlockType;

                    // Si hereda de un Parent y no tiene BlockType completo, intentar fusionar
                    if ((!bt || (!bt.Textures && !bt.CustomModelTexture && !bt.CustomModel)) && itemData.Parent) {
                        const parentRel = scanItemMap.get(String(itemData.Parent).replace(/\.json$/i, '').toLowerCase());
                        if (parentRel) {
                            try {
                                const pAsset = await readAssetContent({ relPath: parentRel, channel, assetsZipOverride, workingFolder });
                                const pData = JSON.parse(pAsset.content);
                                if (pData.BlockType) {
                                    bt = { ...pData.BlockType, ...(bt || {}) };
                                }
                            } catch (e) {}
                        }
                    }

                    if (bt) {
                        color = bt.TextureComputedColor || bt.ParticleColor || null;
                        drawType = bt.DrawType || null;

                        if (Array.isArray(bt.Tint) && bt.Tint[0]) tint = bt.Tint[0];
                        else if (typeof bt.Tint === 'string') tint = bt.Tint;
                        else if (Array.isArray(bt.TintUp) && bt.TintUp[0]) tint = bt.TintUp[0];
                        else if (typeof bt.TintUp === 'string') tint = bt.TintUp;

                        // Caso 1: CustomModelTexture (plantas, estalactitas, fauna, decoraciones)
                        if (bt.CustomModelTexture && Array.isArray(bt.CustomModelTexture) && bt.CustomModelTexture[0]?.Texture) {
                            dataUrl = await tryReadTex(bt.CustomModelTexture[0].Texture);
                        }

                        // Caso 2: CustomModel -> cargar geometría .blockymodel real y su textura si falta
                        if (bt.CustomModel && typeof bt.CustomModel === 'string') {
                            if (typeof bt.CustomModelScale === 'number' && bt.CustomModelScale > 0) {
                                customModelScale = bt.CustomModelScale;
                            }
                            const cmClean = bt.CustomModel.replace(/\\/g, '/');
                            const cmCandidates = cmClean.startsWith('Common/') ? [cmClean] : [`Common/${cmClean}`, cmClean];
                            for (const cmPath of cmCandidates) {
                                try {
                                    const cmAsset = await readAssetContent({ relPath: cmPath, channel, assetsZipOverride, workingFolder });
                                    if (cmAsset && cmAsset.content) {
                                        customModelContent = cmAsset.content;
                                        break;
                                    }
                                } catch (e) {}
                            }
                            if (!dataUrl) {
                                const modelTex = await findTextureForModel(bt.CustomModel, channel, assetsZipOverride, workingFolder);
                                if (modelTex && modelTex.dataUrl) dataUrl = modelTex.dataUrl;
                            }
                        }

                        // Caso 3: Textures estándar (All, Sides, UpDown, Top, Bottom)
                        if (!dataUrl && bt.Textures && Array.isArray(bt.Textures) && bt.Textures[0]) {
                            const t0 = bt.Textures[0];
                            const allPath = t0.All;
                            const topPath = t0.Top || t0.Up || t0.UpDown;
                            const bottomPath = t0.Bottom || t0.Down || t0.UpDown;
                            const sidesPath = t0.Sides || t0.Side || t0.North || t0.Front;

                            if (topPath && sidesPath && topPath !== sidesPath) {
                                const [topUrl, sidesUrl, bottomUrl] = await Promise.all([
                                    tryReadTex(topPath),
                                    tryReadTex(sidesPath),
                                    bottomPath ? tryReadTex(bottomPath) : Promise.resolve(null)
                                ]);
                                if (topUrl || sidesUrl) {
                                    dataUrl = sidesUrl || topUrl;
                                    faces = {
                                        top: topUrl || sidesUrl,
                                        sides: sidesUrl || topUrl,
                                        bottom: bottomUrl || sidesUrl || topUrl
                                    };
                                }
                            } else {
                                const texPath = allPath || sidesPath || topPath || bottomPath;
                                if (texPath) {
                                    dataUrl = await tryReadTex(texPath);
                                }
                            }
                        }
                    }
                } catch (e) {}
            }

            // 2. Fallback: buscar directamente en Common/BlockTextures/ o carpetas de plantas/follaje
            if (!dataUrl) {
                const directCandidates = [
                    `Common/BlockTextures/${blockName}.png`,
                    `Common/BlockTextures/${blockName}_Side.png`,
                    `Common/BlockTextures/${blockName}_All.png`,
                    `Common/Blocks/${blockName}.png`,
                    `Common/Plants/${blockName}.png`,
                    `Common/Foliage/${blockName}.png`
                ];
                const parts = blockName.split('_');
                if (parts.length > 2) {
                    const base = parts.slice(0, 2).join('_');
                    directCandidates.push(`Common/BlockTextures/${base}.png`);
                    directCandidates.push(`Common/BlockTextures/${base}_Side.png`);
                }
                for (const c of directCandidates) {
                    try {
                        const directTex = await readAssetContent({ relPath: c, channel, assetsZipOverride, workingFolder });
                        if (directTex && directTex.dataUrl) {
                            dataUrl = directTex.dataUrl;
                            break;
                        }
                    } catch (e) {}
                }
            }

            const resolvedEntry = { dataUrl, faces, color, tint, drawType, customModelContent, customModelScale };
            blockTextureCache.set(cacheKey, resolvedEntry);
            result[blockName] = resolvedEntry;
        } catch (e) {}
    }));

    return result;
}

/**
 * 4. Resolver un modelo 3D, prefab o item con todas sus referencias y texturas
 */
async function resolveModelOrPrefab(params = {}) {
    const { relPath, channel = 'release', assetsZipOverride, workingFolder } = params;
    if (!relPath) throw new Error('Se requiere relPath');

    const cleanRel = relPath.replace(/\\/g, '/');
    const lowerRel = cleanRel.toLowerCase();

    // 1. Caso directo: es un archivo .blockymodel
    if (lowerRel.endsWith('.blockymodel')) {
        // Cargar modelo, textura y animaciones en paralelo
        const [asset, tex, anims] = await Promise.all([
            readAssetContent({ relPath: cleanRel, channel, assetsZipOverride, workingFolder }),
            findTextureForModel(cleanRel, channel, assetsZipOverride, workingFolder),
            findAnimationsForModel(cleanRel, channel, assetsZipOverride, workingFolder)
        ]);
        return {
            kind: 'blockymodel',
            rel_path: cleanRel,
            modelContent: asset.content,
            textureDataUrl: tex ? tex.dataUrl : null,
            texturePath: tex ? tex.rel_path : null,
            animations: anims.animationList,
            defaultAnimContent: anims.defaultAnimContent,
            defaultAnimName: anims.defaultAnimName,
            size_bytes: asset.size_bytes
        };
    }

    // 2. Caso directo: es un archivo .prefab.json o .prefab
    if (lowerRel.endsWith('.prefab.json') || lowerRel.endsWith('.prefab')) {
        const asset = await readAssetContent({ relPath: cleanRel, channel, assetsZipOverride, workingFolder });
        let blockTextures = {};
        try {
            const parsed = JSON.parse(asset.content);
            blockTextures = await resolvePrefabBlockTextures(parsed, channel, assetsZipOverride, workingFolder);
        } catch (e) {}
        return {
            kind: 'prefab',
            rel_path: cleanRel,
            prefabContent: asset.content,
            blockTextures,
            size_bytes: asset.size_bytes
        };
    }

    // 3. Caso general: archivo .json (Item, NPC, Bloque, Ability, etc.)
    const asset = await readAssetContent({ relPath: cleanRel, channel, assetsZipOverride, workingFolder });
    let parsed = null;
    try {
        parsed = JSON.parse(asset.content);
    } catch (e) {
        return {
            kind: 'raw',
            rel_path: cleanRel,
            content: asset.content,
            size_bytes: asset.size_bytes
        };
    }

    // 3a. El JSON es en realidad un prefab
    if (parsed.blocks && Array.isArray(parsed.blocks)) {
        let blockTextures = {};
        try {
            blockTextures = await resolvePrefabBlockTextures(parsed, channel, assetsZipOverride, workingFolder);
        } catch (e) {}
        return {
            kind: 'prefab',
            rel_path: cleanRel,
            prefabContent: asset.content,
            blockTextures,
            size_bytes: asset.size_bytes
        };
    }

    // 3b. El JSON es un blockymodel
    if (parsed.nodes && Array.isArray(parsed.nodes)) {
        const tex = await findTextureForModel(cleanRel, channel, assetsZipOverride, workingFolder, parsed.Texture || parsed.texture);
        return {
            kind: 'blockymodel',
            rel_path: cleanRel,
            modelContent: asset.content,
            textureDataUrl: tex ? tex.dataUrl : null,
            texturePath: tex ? tex.rel_path : null,
            size_bytes: asset.size_bytes
        };
    }

    // 3b-2. Si el JSON hereda de un Parent (ej. variantes de criaturas en Models/** o items)
    const parentName = parsed.Parent || parsed.parent;
    if (parentName && typeof parentName === 'string') {
        try {
            const parentBase = parentName.replace(/\.json$/i, '');
            const currentDir = path.dirname(cleanRel);
            const candidatePaths = [
                `${currentDir}/${parentBase}.json`,
                `Models/${parentBase}.json`,
                `Models/Beast/${parentBase}.json`,
                `Item/Items/${parentBase}.json`
            ];
            for (const cand of candidatePaths) {
                try {
                    const parentAsset = await readAssetContent({ relPath: cand, channel, assetsZipOverride, workingFolder });
                    if (parentAsset && parentAsset.content) {
                        const parentParsed = JSON.parse(parentAsset.content);
                        if (!parsed.Model && !parsed.model && (parentParsed.Model || parentParsed.model)) {
                            parsed.Model = parentParsed.Model || parentParsed.model;
                        }
                        if (!parsed.Texture && !parsed.texture && (parentParsed.Texture || parentParsed.texture)) {
                            parsed.Texture = parentParsed.Texture || parentParsed.texture;
                        }
                        if (Array.isArray(parentParsed.DefaultAttachments) && (!parsed.DefaultAttachments || parsed.DefaultAttachments.length === 0)) {
                            parsed.DefaultAttachments = [...parentParsed.DefaultAttachments];
                        }
                        if (parentParsed.AnimationSets && (!parsed.AnimationSets || Object.keys(parsed.AnimationSets).length === 0)) {
                            parsed.AnimationSets = { ...parentParsed.AnimationSets };
                        }
                        break;
                    }
                } catch (e) {}
            }
        } catch (e) {}
    }

    // 3b-3. Si es un archivo de Rol/NPC o entidad que especifica una Appearance
    const appearance = parsed.Appearance || parsed.appearance || parsed.Parameters?.Appearance?.Value || parsed.Parameters?.appearance?.value || parsed.Modify?.Appearance || parsed.Modify?.appearance;
    if (appearance && typeof appearance === 'string' && !parsed.Model && !parsed.model) {
        try {
            const appClean = appearance.replace(/\.json$/i, '');
            const candidatePaths = [
                `Models/${appClean}.json`,
                `Models/Beast/${appClean}.json`,
                `Models/Void/${appClean}.json`,
                `Models/Humanoid/${appClean}.json`,
                `Models/Undead/${appClean}.json`,
                `Models/Critter/${appClean}.json`,
                `Models/Elemental/${appClean}.json`,
                `Models/Goblin/${appClean}.json`
            ];
            for (const cand of candidatePaths) {
                try {
                    const mRes = await resolveModelOrPrefab({ relPath: cand, channel, assetsZipOverride, workingFolder });
                    if (mRes && mRes.kind === 'blockymodel') {
                        return {
                            ...mRes,
                            roleRel: cleanRel,
                            roleItem: parsed
                        };
                    }
                } catch (e) {}
            }
        } catch (e) {}
    }

    // 3c. El JSON referencia un Model (.blockymodel)
    const modelRef = parsed.Model || parsed.model;
    if (modelRef && typeof modelRef === 'string') {
        try {
            const texRef = parsed.Texture || parsed.texture;
            // Cargar modelo y textura en paralelo
            const [modelAsset, tex] = await Promise.all([
                readAssetContent({ relPath: modelRef, channel, assetsZipOverride, workingFolder }),
                findTextureForModel(modelRef, channel, assetsZipOverride, workingFolder, texRef)
            ]);

            // Cargar attachments si existen (DefaultAttachments y/o RandomAttachmentSets)
            let attachmentsToLoad = [];
            if (Array.isArray(parsed.DefaultAttachments)) {
                for (const att of parsed.DefaultAttachments) {
                    if (att && att.Model) attachmentsToLoad.push(att);
                }
            }
            if (parsed.RandomAttachmentSets && typeof parsed.RandomAttachmentSets === 'object') {
                for (const [catName, catOptions] of Object.entries(parsed.RandomAttachmentSets)) {
                    if (catOptions && typeof catOptions === 'object') {
                        for (const [optName, optData] of Object.entries(catOptions)) {
                            if (optData && optData.Model) {
                                attachmentsToLoad.push(optData);
                                break;
                            }
                        }
                    }
                }
            }

            let loadedAttachments = [];
            if (attachmentsToLoad.length > 0) {
                loadedAttachments = (await Promise.all(attachmentsToLoad.map(async (att) => {
                    try {
                        const mPath = att.Model.startsWith('Common/') ? att.Model : ('Common/' + att.Model);
                        const [mAsset, tAsset] = await Promise.all([
                            readAssetContent({ relPath: mPath, channel, assetsZipOverride, workingFolder })
                                .catch(() => readAssetContent({ relPath: att.Model, channel, assetsZipOverride, workingFolder })),
                            att.Texture ? (
                                readAssetContent({ relPath: att.Texture.startsWith('Common/') ? att.Texture : ('Common/' + att.Texture), channel, assetsZipOverride, workingFolder })
                                    .catch(() => readAssetContent({ relPath: att.Texture, channel, assetsZipOverride, workingFolder }))
                            ) : findTextureForModel(att.Model, channel, assetsZipOverride, workingFolder)
                        ]);
                        if (mAsset && mAsset.content) {
                            return {
                                modelRel: att.Model,
                                modelContent: mAsset.content,
                                textureDataUrl: tAsset ? tAsset.dataUrl : null,
                                texturePath: att.Texture || null
                            };
                        }
                    } catch (e) {}
                    return null;
                }))).filter(Boolean);
            }

            // Extraer lista de animaciones (AnimationSets)
            const animationList = [];
            const animSets = parsed.AnimationSets || (parsed.originalItem && parsed.originalItem.AnimationSets);
            if (animSets && typeof animSets === 'object') {
                for (const [setName, setData] of Object.entries(animSets)) {
                    if (setData && Array.isArray(setData.Animations)) {
                        for (const animItem of setData.Animations) {
                            if (animItem && animItem.Animation) {
                                animationList.push({
                                    name: setName,
                                    path: animItem.Animation,
                                    speed: animItem.Speed || 1
                                });
                                break;
                            }
                        }
                    }
                }
            }

            let defaultAnimContent = null;
            let defaultAnimName = null;
            const idleEntry = animationList.find(a => a.name.toLowerCase() === 'idle') || animationList[0];
            if (idleEntry) {
                try {
                    const animRel = idleEntry.path.startsWith('Common/') ? idleEntry.path : ('Common/' + idleEntry.path);
                    const animAsset = await readAssetContent({ relPath: animRel, channel, assetsZipOverride, workingFolder })
                        .catch(() => readAssetContent({ relPath: idleEntry.path, channel, assetsZipOverride, workingFolder }));
                    if (animAsset && animAsset.content) {
                        defaultAnimContent = animAsset.content;
                        defaultAnimName = idleEntry.name;
                    }
                } catch (e) {}
            }

            if (animationList.length === 0) {
                const autoAnims = await findAnimationsForModel(modelRef, channel, assetsZipOverride, workingFolder);
                if (autoAnims.animationList.length > 0) {
                    animationList.push(...autoAnims.animationList);
                    defaultAnimContent = autoAnims.defaultAnimContent;
                    defaultAnimName = autoAnims.defaultAnimName;
                }
            }

            return {
                kind: 'blockymodel',
                rel_path: cleanRel,
                referencedModelRel: modelRef,
                modelContent: modelAsset.content,
                textureDataUrl: tex ? tex.dataUrl : null,
                texturePath: tex ? tex.rel_path : null,
                attachments: loadedAttachments,
                animations: animationList,
                defaultAnimContent,
                defaultAnimName,
                size_bytes: asset.size_bytes,
                originalItem: parsed
            };
        } catch (err) {
            console.warn('[HyCreator] Error cargando modelo referenciado:', modelRef, err);
        }
    }

    // 3d. El JSON referencia un Prefab
    const prefabRef = parsed.Prefab || parsed.prefab;
    if (prefabRef && typeof prefabRef === 'string') {
        try {
            const prefabAsset = await readAssetContent({ relPath: prefabRef, channel, assetsZipOverride, workingFolder });
            let blockTextures = {};
            try {
                const parsedPrefab = JSON.parse(prefabAsset.content);
                blockTextures = await resolvePrefabBlockTextures(parsedPrefab, channel, assetsZipOverride, workingFolder);
            } catch (e) {}
            return {
                kind: 'prefab',
                rel_path: cleanRel,
                referencedPrefabRel: prefabRef,
                prefabContent: prefabAsset.content,
                blockTextures,
                size_bytes: asset.size_bytes,
                originalItem: parsed
            };
        } catch (err) {
            console.warn('[HyCreator] Error cargando prefab referenciado:', prefabRef, err);
        }
    }

    // 3e. El JSON tiene un Icon de item
    const iconRef = parsed.Icon || parsed.icon;
    if (iconRef && typeof iconRef === 'string' && iconRef.endsWith('.png')) {
        try {
            const iconAsset = await readAssetContent({ relPath: iconRef, channel, assetsZipOverride, workingFolder });
            return {
                kind: 'item_icon',
                rel_path: cleanRel,
                iconDataUrl: iconAsset.dataUrl,
                iconPath: iconRef,
                size_bytes: asset.size_bytes,
                originalItem: parsed
            };
        } catch (err) {
            console.warn('[HyCreator] Error cargando icono de item:', iconRef, err);
        }
    }

    // Fallback: JSON genérico
    return {
        kind: 'generic_json',
        rel_path: cleanRel,
        content: asset.content,
        size_bytes: asset.size_bytes,
        originalItem: parsed
    };
}

/**
 * 4. Escanear carpeta local en busca de archivos de prefabs y modelos
 */
async function scanLocalFolder(params = {}) {
    const { folderPath } = params;
    if (!folderPath || !fs.existsSync(folderPath)) return [];

    const results = [];

    async function walk(dir) {
        try {
            const list = await fs.promises.readdir(dir, { withFileTypes: true });
            const subDirs = [];
            for (const dirent of list) {
                if (dirent.name.startsWith('.') || dirent.name === 'node_modules' || dirent.name === 'dist') continue;
                const fullPath = path.join(dir, dirent.name);

                if (dirent.isDirectory()) {
                    subDirs.push(fullPath);
                } else {
                    const lower = dirent.name.toLowerCase();
                    let kind = null;
                    if (lower.endsWith('.prefab.json') || lower.includes('prefab')) {
                        kind = 'Prefabs';
                    } else if (lower.endsWith('.blockymodel')) {
                        kind = 'blockymodel';
                    } else if (lower.endsWith('.model') || lower.endsWith('.bbmodel')) {
                        kind = 'Model';
                    } else if (lower.endsWith('.json') && (lower.includes('item') || lower.includes('entity'))) {
                        kind = 'Item';
                    }

                    if (kind) {
                        const rel = path.relative(folderPath, fullPath).replace(/\\/g, '/');
                        results.push({
                            rel,
                            name: dirent.name,
                            kind
                        });
                    }
                }
            }
            if (subDirs.length > 0) {
                await Promise.all(subDirs.map(walk));
            }
        } catch (err) {
            console.warn('[HyCreator] Error recorriendo carpeta:', err.message);
        }
    }

    await walk(folderPath);
    return results;
}

module.exports = {
    getHyCreatorInfo,
    getCatalogItems,
    getCatalogTree,
    readAssetContent,
    scanLocalFolder,
    resolveModelOrPrefab,
    findTextureForModel,
    /**
     * Pre-carga el índice del ZIP en memoria para el canal dado.
     * Llamar al iniciar la app para que el primer modelo cargue rápido.
     */
    async warmupZipIndex(channel = 'release') {
        try {
            const info = await getHyCreatorInfo();
            const ch = info.channels[channel] || info.channels.release;
            if (ch && ch.zipPath && fs.existsSync(ch.zipPath)) {
                await buildZipIndex(ch.zipPath);
                console.log(`[HyCreator] Índice ZIP precargado: ${(zipIndexCache.get(ch.zipPath)?.index?.size || 0).toLocaleString()} entradas`);
            }
        } catch (e) {
            console.warn('[HyCreator] warmup fallido (no crítico):', e.message);
        }
    }
};
