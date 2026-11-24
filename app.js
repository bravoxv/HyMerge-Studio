/* ==========================================================================
   WINMERGE MODERN - LOGICA PROFESIONAL DE COMPARACION
   CON VISTA EN ARBOL JERARQUICO DE CARPETAS Y SUS HIJOS
   OPTIMIZADO PARA CARPETAS GIGANTES (+63,000 ARCHIVOS), SIN BLOQUEOS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    const isElectron = window.electronAPI !== undefined;

    // --- REFERENCIAS AL DOM ---
    const modeFilesBtn = document.getElementById('mode-files-btn');
    const modeFoldersBtn = document.getElementById('mode-folders-btn');
    const mode3dBtn = document.getElementById('mode-3d-btn');
    const filesViewport = document.getElementById('files-viewport');
    const foldersViewport = document.getElementById('folders-viewport');
    const models3dViewport = document.getElementById('models3d-viewport');

    const leftView = document.getElementById('left-diff-view');
    const rightView = document.getElementById('right-diff-view');
    const leftTextarea = document.getElementById('left-text-input');
    const rightTextarea = document.getElementById('right-text-input');

    const leftImageView = document.getElementById('left-image-view');
    const rightImageView = document.getElementById('right-image-view');
    const leftImageElem = document.getElementById('left-image-elem');
    const rightImageElem = document.getElementById('right-image-elem');
    const leftImageInfo = document.getElementById('left-image-info');
    const rightImageInfo = document.getElementById('right-image-info');

    const leftFileName = document.getElementById('left-file-name');
    const rightFileName = document.getElementById('right-file-name');

    const btnSwapSides = document.getElementById('btn-swap-sides');
    const btnRecompare = document.getElementById('btn-recompare');
    const btnPrevDiff = document.getElementById('btn-prev-diff');
    const btnNextDiff = document.getElementById('btn-next-diff');
    const btnBackToFolders = document.getElementById('btn-back-to-folders');
    const btnCloseFilesView = document.getElementById('btn-close-files-view');
    const diffCounterBadge = document.getElementById('diff-counter-badge');

    function updateDiffCounter() {
        if (!diffCounterBadge) return;
        if (diffLines.length === 0) {
            diffCounterBadge.textContent = '0/0';
            diffCounterBadge.style.opacity = '0.5';
        } else {
            const current = currentDiffIndex >= 0 ? currentDiffIndex + 1 : 0;
            diffCounterBadge.textContent = `${current}/${diffLines.length}`;
            diffCounterBadge.style.opacity = '1';
        }
    }

    // 2 Botones Rápidos Superiores (Abrir Original & Abrir Modificado)
    const btnOpenOriginal = document.getElementById('btn-open-original');
    const btnOpenModified = document.getElementById('btn-open-modified');
    const btnOpenOriginalMenu = document.getElementById('btn-open-original-menu');
    const btnOpenModifiedMenu = document.getElementById('btn-open-modified-menu');
    const menuDropdownOriginal = document.getElementById('menu-dropdown-original');
    const menuDropdownModified = document.getElementById('menu-dropdown-modified');
    const optOpenOriginalDefault = document.getElementById('opt-open-original-default');
    const optOpenOriginalExplorer = document.getElementById('opt-open-original-explorer');
    const optOpenOriginalDialog = document.getElementById('opt-open-original-dialog');
    const optOpenModifiedDefault = document.getElementById('opt-open-modified-default');
    const optOpenModifiedExplorer = document.getElementById('opt-open-modified-explorer');
    const optOpenModifiedDialog = document.getElementById('opt-open-modified-dialog');
    const labelOpenOriginal = document.getElementById('label-open-original');
    const labelOpenModified = document.getElementById('label-open-modified');

    const btnLoadLeft = document.getElementById('btn-load-left');
    const btnClearLeft = document.getElementById('btn-clear-left');
    const btnLoadRight = document.getElementById('btn-load-right');
    const btnClearRight = document.getElementById('btn-clear-right');

    const inputFileLeft = document.getElementById('input-file-left');
    const inputFileRight = document.getElementById('input-file-right');

    // Elementos de Carpetas
    const folderLeftNameLabel = document.getElementById('folder-left-name');
    const folderRightNameLabel = document.getElementById('folder-right-name');
    const folderLeftPathLabel = document.getElementById('folder-left-path');
    const folderRightPathLabel = document.getElementById('folder-right-path');
    const btnSelectLeftFolder = document.getElementById('btn-select-left-folder');
    const btnSelectRightFolder = document.getElementById('btn-select-right-folder');
    const btnSwapFoldersMini = document.getElementById('btn-swap-folders-mini');
    const boxFolderLeft = document.getElementById('box-folder-left');
    const boxFolderRight = document.getElementById('box-folder-right');

    const btnAnalyzeFolders = document.getElementById('btn-analyze-folders');
    const folderGridContainer = document.getElementById('folder-grid-container');
    const folderTableBody = document.getElementById('folder-table-body');
    const tableLoadMore = document.getElementById('table-load-more');
    const loadMoreText = document.getElementById('load-more-text');

    // Filtros por Píldoras y Búsqueda
    const folderSearchInput = document.getElementById('folder-search-input');
    const btnClearSearch = document.getElementById('btn-clear-search');
    const filterPills = document.querySelectorAll('.filter-pill');
    const countAll = document.getElementById('count-all');
    const countDiff = document.getElementById('count-diff');
    const countModified = document.getElementById('count-modified');
    const countLeftOnly = document.getElementById('count-left-only');
    const countRightOnly = document.getElementById('count-right-only');
    const countIdentical = document.getElementById('count-identical');

    // Controles de Vista en Árbol
    const btnViewTree = document.getElementById('btn-view-tree');
    const btnViewFlat = document.getElementById('btn-view-flat');
    const btnExpandAll = document.getElementById('btn-expand-all');
    const btnCollapseAll = document.getElementById('btn-collapse-all');

    // Hover Popover de Previsualización Multimedia
    const mediaPreviewPopover = document.getElementById('media-preview-popover');
    const popoverFilename = document.getElementById('popover-filename');
    const popoverBadge = document.getElementById('popover-badge');
    const popoverSubtitle = document.getElementById('popover-subtitle');
    const popoverContent = document.getElementById('popover-content');
    const popoverIcon = document.getElementById('popover-icon');

    // Menú Contextual (Clic derecho)
    const contextMenu = document.getElementById('custom-context-menu');
    const contextSideTitle = document.getElementById('context-side-title');
    const ctxOpenSystemOriginal = document.getElementById('ctx-open-system-original');
    const ctxOpenSystemModified = document.getElementById('ctx-open-system-modified');
    const ctxShowExplorer = document.getElementById('ctx-show-explorer');
    const ctxSubOriginal = document.getElementById('ctx-sub-original');
    const ctxSubModified = document.getElementById('ctx-sub-modified');
    const ctxOpenLeft = document.getElementById('ctx-open-left');
    const ctxOpenRight = document.getElementById('ctx-open-right');
    const ctxCopyToOther = document.getElementById('ctx-copy-to-other');
    const ctxCopyLabel = document.getElementById('ctx-copy-label');
    const ctxClearSide = document.getElementById('ctx-clear-side');

    // Barra de Estado Inferior
    const footerMessage = document.getElementById('footer-message');
    const footerModeLabel = document.getElementById('footer-mode-label');
    const footerStatsSummary = document.getElementById('footer-stats-summary');
    const statusDot = document.getElementById('status-dot');
    const diffMinimap = document.getElementById('diff-minimap');

    // --- ESTADO GLOBAL ---
    let currentAppMode = 'folders'; // Iniciar directamente en vista Carpetas
    let currentRightClickTarget = 'left';

    let leftFolderPath = null;
    let rightFolderPath = null;
    let folderItemsList = [];
    let folderTreeRoot = null;
    let currentVisibleRows = [];
    let selectedFolderItem = null;
    let currentFilterMode = 'all'; // 'all', 'diff', 'modified', 'left-only', 'right-only', 'identical'
    let currentSearchQuery = '';
    let isTreeView = true; // Por defecto: Vista en Árbol Jerárquico de Carpetas y sus Hijos

    // Parámetros de renderizado en lotes (Batch Rendering)
    const BATCH_SIZE = 100;
    let renderedCount = 0;
    let isRenderingBatch = false;

    let currentLeftFile = null;
    let currentRightFile = null;
    let diffLines = [];
    let currentDiffIndex = -1;

    // Extensiones reconocidas
    const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif']);
    const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg', 'mov', 'mkv']);

    function getExt(filename) {
        if (!filename) return '';
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
    }

    function isImage(filename) {
        return IMAGE_EXTENSIONS.has(getExt(filename));
    }

    function isVideo(filename) {
        return VIDEO_EXTENSIONS.has(getExt(filename));
    }

    function getFolderBaseName(folderPath) {
        if (!folderPath) return '';
        const clean = folderPath.replace(/[\\/]+$/, '');
        const parts = clean.split(/[\\/]/);
        return parts.pop() || folderPath;
    }

    function updateFolderLabels(side, fullPath) {
        const baseName = getFolderBaseName(fullPath);
        if (side === 'left') {
            if (folderLeftNameLabel) {
                folderLeftNameLabel.textContent = baseName || '(Sin carpeta seleccionada)';
                folderLeftNameLabel.title = fullPath || '';
            }
            if (folderLeftPathLabel) {
                folderLeftPathLabel.textContent = fullPath || 'Haz clic en Examinar para seleccionar...';
                folderLeftPathLabel.title = fullPath || '';
            }
        } else {
            if (folderRightNameLabel) {
                folderRightNameLabel.textContent = baseName || '(Sin carpeta seleccionada)';
                folderRightNameLabel.title = fullPath || '';
            }
            if (folderRightPathLabel) {
                folderRightPathLabel.textContent = fullPath || 'Haz clic en Examinar para seleccionar...';
                folderRightPathLabel.title = fullPath || '';
            }
        }
        checkAnalyzeButtonState();
    }

    // Iniciar de forma predeterminada en Modo Carpetas
    switchAppMode('folders');

    // --- CAMBIO DE MODO ARCHIVOS / CARPETAS / MODELOS 3D ---
    modeFilesBtn.addEventListener('click', () => switchAppMode('files'));
    modeFoldersBtn.addEventListener('click', () => switchAppMode('folders'));
    if (mode3dBtn) mode3dBtn.addEventListener('click', () => switchAppMode('models3d'));

    function switchAppMode(mode) {
        currentAppMode = mode;
        hideMediaPreviewPopover();
        closeAllDropdowns();

        // Limpiar estados activos de botones de modo
        modeFilesBtn.classList.remove('active');
        modeFoldersBtn.classList.remove('active');
        if (mode3dBtn) mode3dBtn.classList.remove('active');

        // Ocultar todos los viewports
        filesViewport.classList.add('hidden');
        foldersViewport.classList.add('hidden');
        if (models3dViewport) models3dViewport.classList.add('hidden');

        if (mode === 'files') {
            modeFilesBtn.classList.add('active');
            filesViewport.classList.remove('hidden');
            footerModeLabel.textContent = 'Modo: Archivos Lado a Lado';
            updateToolbarButtonsState();
        } else if (mode === 'models3d') {
            if (mode3dBtn) mode3dBtn.classList.add('active');
            if (models3dViewport) models3dViewport.classList.remove('hidden');
            footerModeLabel.textContent = 'Modo: Modelos 3D y Prefabs Hytale (HyCreator)';
            updateToolbarButtonsState();
            initHyCreatorModuleIfNeeded();
        } else {
            modeFoldersBtn.classList.add('active');
            foldersViewport.classList.remove('hidden');
            footerModeLabel.textContent = 'Modo: Estructura de Carpetas';
            checkAnalyzeButtonState();
            updateToolbarButtonsState();
        }
        if (window.lucide) lucide.createIcons();
    }

    // --- INTERCAMBIAR CARPETAS ---
    function swapFolders() {
        const tempPath = leftFolderPath;
        leftFolderPath = rightFolderPath;
        rightFolderPath = tempPath;

        updateFolderLabels('left', leftFolderPath);
        updateFolderLabels('right', rightFolderPath);

        if (folderItemsList.length > 0) {
            triggerFoldersComparison();
        }
    }

    if (btnSwapFoldersMini) {
        btnSwapFoldersMini.addEventListener('click', (e) => {
            e.stopPropagation();
            swapFolders();
        });
    }

    // --- GESTIÓN DE CARPETAS Y ANÁLISIS ---
    async function selectFolder(side) {
        if (isElectron) {
            const res = await window.electronAPI.openDialog({
                mode: 'folder',
                title: `Seleccionar Carpeta para Lado ${side === 'left' ? 'Original (Izquierdo)' : 'Modificado (Derecho)'}`
            });
            if (res && res.path) {
                if (side === 'left') {
                    leftFolderPath = res.path;
                    updateFolderLabels('left', leftFolderPath);
                } else {
                    rightFolderPath = res.path;
                    updateFolderLabels('right', rightFolderPath);
                }
            }
        } else {
            alert('Para examinar carpetas reales del sistema, ejecuta la aplicación WinMerge Modern.');
        }
    }

    function checkAnalyzeButtonState() {
        if (leftFolderPath && rightFolderPath) {
            btnAnalyzeFolders.classList.add('btn-analyze-ready');
            btnAnalyzeFolders.title = '¡2 Carpetas listas! Haz clic para iniciar la comparación.';
        } else {
            btnAnalyzeFolders.classList.remove('btn-analyze-ready');
            btnAnalyzeFolders.title = 'Selecciona ambas carpetas para comparar.';
        }
    }

    async function triggerFoldersComparison() {
        if (!leftFolderPath) {
            await selectFolder('left');
            if (!leftFolderPath) return;
        }
        if (!rightFolderPath) {
            await selectFolder('right');
            if (!rightFolderPath) return;
        }

        btnAnalyzeFolders.disabled = true;
        btnAnalyzeFolders.innerHTML = `<i data-lucide="loader" class="spin"></i> <span>Comparando...</span>`;
        if (window.lucide) lucide.createIcons();

        if (statusDot) statusDot.className = 'status-indicator busy';
        footerMessage.textContent = 'Analizando estructura de carpetas en segundo plano...';

        let unlisten = null;
        if (isElectron && window.electronAPI && window.electronAPI.onCompareProgress) {
            unlisten = window.electronAPI.onCompareProgress((data) => {
                if (data && data.message) {
                    footerMessage.textContent = data.message;
                }
            });
        }

        try {
            if (isElectron) {
                const items = await window.electronAPI.compareFolders({ leftFolderPath, rightFolderPath });
                if (Array.isArray(items)) {
                    folderItemsList = items;
                    folderTreeRoot = buildFolderTree(folderItemsList);
                    processComparisonResults(folderItemsList);
                } else if (items && items.error) {
                    alert('Error durante el análisis: ' + items.error);
                    footerMessage.textContent = 'Error: ' + items.error;
                }
            } else {
                folderTreeRoot = buildFolderTree(folderItemsList);
                processComparisonResults(folderItemsList);
            }
        } catch (err) {
            console.error('Error en comparación:', err);
            footerMessage.textContent = 'Error al comparar carpetas.';
        } finally {
            if (unlisten) unlisten();
            btnAnalyzeFolders.disabled = false;
            btnAnalyzeFolders.innerHTML = `<i data-lucide="git-compare"></i> <span>Comparar Carpetas</span>`;
            if (window.lucide) lucide.createIcons();
            if (statusDot) statusDot.className = 'status-indicator ready';
        }
    }

    // --- CONSTRUCCIÓN DEL ÁRBOL JERÁRQUICO DE CARPETAS ---
    function buildFolderTree(items) {
        const root = {
            name: '',
            path: '',
            isFolder: true,
            children: new Map(),
            files: [],
            statusCounts: { modified: 0, leftOnly: 0, rightOnly: 0, identical: 0 },
            expanded: true
        };

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const parts = item.relativePath.split(/[\\/]/);
            const fileName = parts.pop();
            let current = root;
            let currentPath = '';

            for (let j = 0; j < parts.length; j++) {
                const dir = parts[j];
                currentPath = currentPath ? `${currentPath}/${dir}` : dir;
                if (!current.children.has(dir)) {
                    current.children.set(dir, {
                        name: dir,
                        path: currentPath,
                        isFolder: true,
                        children: new Map(),
                        files: [],
                        statusCounts: { modified: 0, leftOnly: 0, rightOnly: 0, identical: 0 },
                        expanded: true // Expandido por defecto para que las carpetas con diferencias sean visibles
                    });
                }
                current = current.children.get(dir);
                if (item.status === 'modified') current.statusCounts.modified++;
                else if (item.status === 'left-only') current.statusCounts.leftOnly++;
                else if (item.status === 'right-only') current.statusCounts.rightOnly++;
                else if (item.status === 'identical') current.statusCounts.identical++;
            }

            current.files.push(item);
            if (item.status === 'modified') root.statusCounts.modified++;
            else if (item.status === 'left-only') root.statusCounts.leftOnly++;
            else if (item.status === 'right-only') root.statusCounts.rightOnly++;
            else if (item.status === 'identical') root.statusCounts.identical++;
        }

        return root;
    }

    // Expande o colapsa recursivamente todos los nodos del árbol
    function setTreeExpansion(node, expand) {
        if (!node) return;
        node.expanded = expand;
        for (const child of node.children.values()) {
            setTreeExpansion(child, expand);
        }
    }

    // Verifica si un nodo de carpeta contiene al menos un archivo que coincida con el filtro y búsqueda actual
    function nodeMatchesActiveFilters(node) {
        if (!node) return false;
        for (let i = 0; i < node.files.length; i++) {
            const file = node.files[i];
            if (currentFilterMode === 'diff' && file.status === 'identical') continue;
            if (currentFilterMode === 'modified' && file.status !== 'modified') continue;
            if (currentFilterMode === 'left-only' && file.status !== 'left-only') continue;
            if (currentFilterMode === 'right-only' && file.status !== 'right-only') continue;
            if (currentFilterMode === 'identical' && file.status !== 'identical') continue;
            if (!currentSearchQuery || matchesExactWordQuery(file.relativePath, file.ext, currentSearchQuery)) {
                return true;
            }
        }
        for (const child of node.children.values()) {
            if (nodeMatchesActiveFilters(child)) return true;
        }
        return false;
    }

    // Obtiene la lista aplanada de filas visibles según expansión y filtros
    function getVisibleTreeRows(node, level = 0, result = []) {
        if (!node) return result;

        // 1. Subcarpetas
        const subdirs = Array.from(node.children.values()).sort((a, b) => a.name.localeCompare(b.name));
        for (let i = 0; i < subdirs.length; i++) {
            const dir = subdirs[i];
            const diffs = dir.statusCounts.modified + dir.statusCounts.leftOnly + dir.statusCounts.rightOnly;

            // Filtro por píldora para carpetas
            if (currentFilterMode === 'diff' && diffs === 0) continue;
            if (currentFilterMode === 'modified' && dir.statusCounts.modified === 0) continue;
            if (currentFilterMode === 'left-only' && dir.statusCounts.leftOnly === 0) continue;
            if (currentFilterMode === 'right-only' && dir.statusCounts.rightOnly === 0) continue;
            if (currentFilterMode === 'identical' && dir.statusCounts.identical === 0) continue;

            if (currentSearchQuery && !nodeMatchesActiveFilters(dir)) {
                continue;
            }

            result.push({
                type: 'folder',
                node: dir,
                level
            });

            if (dir.expanded || currentSearchQuery) {
                getVisibleTreeRows(dir, level + 1, result);
            }
        }

        // 2. Archivos en este nivel
        const files = node.files.slice().sort((a, b) => a.name.localeCompare(b.name));
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Filtro por píldora para archivos
            if (currentFilterMode === 'diff' && file.status === 'identical') continue;
            if (currentFilterMode === 'modified' && file.status !== 'modified') continue;
            if (currentFilterMode === 'left-only' && file.status !== 'left-only') continue;
            if (currentFilterMode === 'right-only' && file.status !== 'right-only') continue;
            if (currentFilterMode === 'identical' && file.status !== 'identical') continue;

            // Filtro por texto de búsqueda
            if (currentSearchQuery) {
                const matches = matchesExactWordQuery(file.relativePath, file.ext, currentSearchQuery);
                if (!matches) continue;
            }

            result.push({
                type: 'file',
                item: file,
                level
            });
        }

        return result;
    }

    // Procesa y actualiza contadores de las píldoras de filtro
    function processComparisonResults(items) {
        let identical = 0, modified = 0, leftOnly = 0, rightOnly = 0;
        for (let i = 0; i < items.length; i++) {
            const st = items[i].status;
            if (st === 'identical') identical++;
            else if (st === 'modified') modified++;
            else if (st === 'left-only') leftOnly++;
            else if (st === 'right-only') rightOnly++;
        }

        const total = items.length;
        const diffCount = modified + leftOnly + rightOnly;

        if (countAll) countAll.textContent = total.toLocaleString();
        if (countDiff) countDiff.textContent = diffCount.toLocaleString();
        if (countModified) countModified.textContent = modified.toLocaleString();
        if (countLeftOnly) countLeftOnly.textContent = leftOnly.toLocaleString();
        if (countRightOnly) countRightOnly.textContent = rightOnly.toLocaleString();
        if (countIdentical) countIdentical.textContent = identical.toLocaleString();

        const matchPercent = total > 0 ? ((identical / total) * 100).toFixed(1) : 100;
        footerStatsSummary.textContent = `Coincidencia: ${matchPercent}% • Total: ${total.toLocaleString()} archivos`;
        footerMessage.textContent = `Análisis completado: ${diffCount.toLocaleString()} diferencias en ${total.toLocaleString()} archivos.`;

        // Si existen diferencias, por defecto activamos la vista de 'diff' para enfoque inmediato
        if (diffCount > 0 && currentFilterMode === 'all') {
            setFilterMode('diff');
        } else {
            applyFilterAndRender();
        }
    }

    function matchesExactWordQuery(relativePath, ext, query) {
        const tokens = (query || '').trim().toLowerCase().split(/[\s_]+/).filter(Boolean);
        if (tokens.length === 0) return true;
        const rawPath = relativePath || '';
        const pathLower = rawPath.toLowerCase();
        const extLower = (ext || '').toLowerCase();
        // Separar tanto por delimitadores como por CamelCase (ej. PlayerEntity -> player, entity, playerentity)
        const camelSplit = rawPath.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
        const words = new Set([
            ...pathLower.split(/[^a-z0-9]+/),
            ...camelSplit.split(/[^a-z0-9]+/)
        ].filter(Boolean));
        const wordList = Array.from(words);
        return tokens.every(tok => {
            if (/[^a-z0-9]/.test(tok)) {
                return pathLower.includes(tok) || extLower.includes(tok);
            }
            return words.has(tok) || wordList.some(w => w.startsWith(tok));
        });
    }

    // --- FILTRADO DE LA TABLA ---
    function setFilterMode(mode) {
        currentFilterMode = mode;
        filterPills.forEach(p => {
            if (p.dataset.filter === mode) p.classList.add('active');
            else p.classList.remove('active');
        });
        applyFilterAndRender();
    }

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            setFilterMode(pill.dataset.filter);
        });
    });

    // Controles de Vista en Árbol
    if (btnViewTree && btnViewFlat) {
        btnViewTree.addEventListener('click', () => {
            isTreeView = true;
            btnViewTree.classList.add('active');
            btnViewFlat.classList.remove('active');
            applyFilterAndRender();
        });

        btnViewFlat.addEventListener('click', () => {
            isTreeView = false;
            btnViewFlat.classList.add('active');
            btnViewTree.classList.remove('active');
            applyFilterAndRender();
        });
    }

    if (btnExpandAll) {
        btnExpandAll.addEventListener('click', () => {
            if (folderTreeRoot) {
                setTreeExpansion(folderTreeRoot, true);
                applyFilterAndRender();
            }
        });
    }

    if (btnCollapseAll) {
        btnCollapseAll.addEventListener('click', () => {
            if (folderTreeRoot) {
                setTreeExpansion(folderTreeRoot, false);
                folderTreeRoot.expanded = true; // La raíz se mantiene abierta
                applyFilterAndRender();
            }
        });
    }

    const btnExpandFilesTable = document.getElementById('btn-expand-files-table');
    if (btnExpandFilesTable && foldersViewport) {
        btnExpandFilesTable.addEventListener('click', () => {
            const isFull = foldersViewport.classList.toggle('table-fullscreen');
            btnExpandFilesTable.classList.toggle('active', isFull);
            btnExpandFilesTable.innerHTML = isFull
                ? '<i data-lucide="minimize-2" style="width:13px; height:13px;"></i><span>Restaurar</span>'
                : '<i data-lucide="maximize-2" style="width:13px; height:13px;"></i><span>Ampliar</span>';
            if (window.lucide) lucide.createIcons();
        });
    }

    // Búsqueda en tiempo real (con debounce)
    let searchTimeout = null;
    folderSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        currentSearchQuery = query;

        if (query) btnClearSearch.classList.remove('hidden');
        else btnClearSearch.classList.add('hidden');

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyFilterAndRender();
        }, 120);
    });

    btnClearSearch.addEventListener('click', () => {
        folderSearchInput.value = '';
        currentSearchQuery = '';
        btnClearSearch.classList.add('hidden');
        applyFilterAndRender();
        folderSearchInput.focus();
    });

    function applyFilterAndRender() {
        if (!folderItemsList || folderItemsList.length === 0) {
            renderEmptyState('Sin comparación activa', 'Selecciona la Carpeta Original y Carpeta Modificada, luego presiona Comparar Carpetas.');
            return;
        }

        if (isTreeView && folderTreeRoot) {
            // Modo Árbol Jerárquico
            currentVisibleRows = getVisibleTreeRows(folderTreeRoot, 0, []);
        } else {
            // Modo Lista Plana
            currentVisibleRows = folderItemsList.filter(item => {
                if (currentFilterMode === 'diff' && item.status === 'identical') return false;
                if (currentFilterMode === 'modified' && item.status !== 'modified') return false;
                if (currentFilterMode === 'left-only' && item.status !== 'left-only') return false;
                if (currentFilterMode === 'right-only' && item.status !== 'right-only') return false;
                if (currentFilterMode === 'identical' && item.status !== 'identical') return false;

                if (currentSearchQuery) {
                    return matchesExactWordQuery(item.relativePath, item.ext, currentSearchQuery);
                }
                return true;
            }).map(item => ({ type: 'file', item, level: 0 }));
        }

        // Iniciar renderizado desde cero
        folderTableBody.innerHTML = '';
        selectedFolderItem = null;
        updateToolbarButtonsState();
        renderedCount = 0;

        if (currentVisibleRows.length === 0) {
            renderEmptyState('Sin resultados', 'No se encontraron elementos que coincidan con el filtro seleccionado.');
            if (tableLoadMore) tableLoadMore.classList.add('hidden');
            return;
        }

        renderNextBatch();
    }

    function renderEmptyState(title, subtitle) {
        folderTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-folder-state">
                    <div class="empty-state-content">
                        <div class="empty-state-icon-wrap">
                            <i data-lucide="folder-search" class="empty-state-icon"></i>
                        </div>
                        <h3>${escapeHTML(title)}</h3>
                        <p>${escapeHTML(subtitle)}</p>
                    </div>
                </td>
            </tr>`;
        if (window.lucide) lucide.createIcons();
    }

    // --- RENDERIZADO EN LOTES DE ALTO RENDIMIENTO (BATCH RENDERING) ---
    function renderNextBatch() {
        if (isRenderingBatch) return;
        isRenderingBatch = true;

        const totalItems = currentVisibleRows.length;
        const endIndex = Math.min(renderedCount + BATCH_SIZE, totalItems);
        const fragment = document.createDocumentFragment();

        for (let i = renderedCount; i < endIndex; i++) {
            const rowData = currentVisibleRows[i];
            let rowElem;
            if (rowData.type === 'folder') {
                rowElem = createFolderRowElement(rowData.node, rowData.level, i);
            } else {
                rowElem = createFileRowElement(rowData.item, rowData.level, i);
            }
            fragment.appendChild(rowElem);
        }

        folderTableBody.appendChild(fragment);
        renderedCount = endIndex;
        isRenderingBatch = false;

        if (window.lucide) lucide.createIcons();

        // Actualizar barra informativa de scroll
        if (tableLoadMore && loadMoreText) {
            if (renderedCount < totalItems) {
                tableLoadMore.classList.remove('hidden');
                loadMoreText.textContent = `Mostrando ${renderedCount.toLocaleString()} de ${totalItems.toLocaleString()} elementos. Desplázate hacia abajo para ver más...`;
            } else {
                tableLoadMore.classList.add('hidden');
            }
        }
    }

    // Scroll Infinito: Cargar el siguiente lote de filas
    folderGridContainer.addEventListener('scroll', () => {
        if (renderedCount >= currentVisibleRows.length) return;
        const { scrollTop, scrollHeight, clientHeight } = folderGridContainer;
        if (scrollTop + clientHeight >= scrollHeight - 200) {
            renderNextBatch();
        }
    });

    // --- FILA DE CARPETA (NODO DEL ÁRBOL CON FLECHA EXPANDIBLE) ---
    function createFolderRowElement(node, level, index) {
        const tr = document.createElement('tr');
        tr.className = 'folder-row folder-row-dir';
        tr.dataset.path = node.path;

        const diffs = node.statusCounts.modified + node.statusCounts.leftOnly + node.statusCounts.rightOnly;
        const total = diffs + node.statusCounts.identical;

        // Celda 1: Índice
        const tdIdx = document.createElement('td');
        tdIdx.className = 'col-idx';
        tdIdx.textContent = (index + 1).toString();
        tr.appendChild(tdIdx);

        // Celda 2: Indicador de Tipo Carpeta
        const tdThumb = document.createElement('td');
        tdThumb.className = 'col-thumb';
        tdThumb.innerHTML = `<span class="badge-type-dir">DIR</span>`;
        tr.appendChild(tdThumb);

        // Celda 3: Flecha expandible y nombre con indentación jerárquica
        // Cada nivel de subcarpeta se desplaza 24px a la derecha para que la flecha quede escalonada
        const tdName = document.createElement('td');
        tdName.className = 'col-name';
        const indentPx = level * 24;
        tdName.innerHTML = `
            <div class="tree-cell-wrapper" style="padding-left: ${indentPx}px;">
                <button class="tree-arrow-btn ${node.expanded ? 'expanded' : ''}" title="${node.expanded ? 'Colapsar carpeta' : 'Mostrar hijos de la carpeta'}">
                    <i data-lucide="chevron-right" style="width:14px; height:14px;"></i>
                </button>
                <i data-lucide="${node.expanded ? 'folder-open' : 'folder'}" class="tree-folder-icon ${diffs > 0 ? 'has-diff' : ''}"></i>
                <span class="tree-folder-name">${escapeHTML(node.name)}/</span>
                <span class="tree-folder-badge ${diffs > 0 ? 'badge-tree-diff' : 'badge-tree-ok'}">
                    ${diffs > 0 ? `${diffs} ${diffs === 1 ? 'diferencia' : 'diferencias'}` : 'Idéntica'}
                </span>
            </div>
        `;
        tr.appendChild(tdName);

        // Celda 4: Estado
        const tdStatus = document.createElement('td');
        tdStatus.className = 'col-status';
        tdStatus.innerHTML = diffs > 0 ?
            `<span class="badge-status status-modified">Con Cambios</span>` :
            `<span class="badge-status status-identical">Idéntica</span>`;
        tr.appendChild(tdStatus);

        // Celda 5: Tamaño / Archivos
        const tdSizeL = document.createElement('td');
        tdSizeL.className = 'col-size';
        tdSizeL.textContent = `${total} ${total === 1 ? 'arch.' : 'archs.'}`;
        tr.appendChild(tdSizeL);

        // Celda 6: Diferencias dentro
        const tdSizeR = document.createElement('td');
        tdSizeR.className = 'col-size';
        tdSizeR.textContent = diffs > 0 ? `${diffs} dif.` : '0 dif.';
        tr.appendChild(tdSizeR);

        // Celda 7: Acción rápida
        const tdActions = document.createElement('td');
        tdActions.className = 'col-actions';
        tdActions.innerHTML = `
            <button class="btn-row-action" title="${node.expanded ? 'Colapsar' : 'Expandir'}">
                <span>${node.expanded ? 'Ocultar' : 'Mostrar'}</span>
            </button>
        `;
        tr.appendChild(tdActions);

        // Al hacer clic en la fila o en la flecha, se conmuta la visibilidad de los hijos
        tr.addEventListener('click', () => {
            node.expanded = !node.expanded;
            applyFilterAndRender();
        });

        return tr;
    }

    // --- FILA DE ARCHIVO (HIJO EN EL ÁRBOL) ---
    function createFileRowElement(item, level, index) {
        const isMediaItem = item.isMedia || item.isImage || item.isVideo || isImage(item.relativePath) || isVideo(item.relativePath);
        const isVid = item.isVideo || isVideo(item.relativePath);

        const badgeClass = item.status === 'identical' ? 'status-identical' :
            item.status === 'modified' ? 'status-modified' :
                item.status === 'left-only' ? 'status-left-only' : 'status-right-only';

        const badgeText = item.status === 'identical' ? 'Idéntico' :
            item.status === 'modified' ? 'Modificado' :
                item.status === 'left-only' ? 'Solo Original' : 'Nuevo';

        const tr = document.createElement('tr');
        tr.className = 'folder-row';
        tr.dataset.index = index;

        // Celda 1: Índice
        const tdIdx = document.createElement('td');
        tdIdx.className = 'col-idx';
        tdIdx.textContent = (index + 1).toString();
        tr.appendChild(tdIdx);

        // Celda 2: Previsualización o Icono de Tipo
        const tdThumb = document.createElement('td');
        tdThumb.className = 'col-thumb';

        if (isMediaItem) {
            const thumbBox = document.createElement('div');
            thumbBox.className = `file-media-thumbnail ${item.status === 'modified' ? 'thumb-modified' : ''}`;
            thumbBox.title = 'Pasa el cursor para ver comparación ampliada';

            const media = resolveMediaData(item);
            if (media && media.primaryUrl) {
                if (media.isVideo) {
                    const v = document.createElement('video');
                    v.src = media.primaryUrl;
                    v.muted = true;
                    v.preload = 'metadata';
                    v.playsInline = true;
                    thumbBox.appendChild(v);
                } else {
                    const img = document.createElement('img');
                    img.src = media.primaryUrl;
                    img.loading = 'lazy';
                    img.alt = item.name;
                    thumbBox.appendChild(img);
                }
            } else {
                thumbBox.innerHTML = `<i data-lucide="${isVid ? 'film' : 'image'}" style="width:16px;height:16px;"></i>`;
            }

            thumbBox.addEventListener('mouseenter', (e) => showMediaPreviewPopover(item, e));
            thumbBox.addEventListener('mousemove', (e) => positionMediaPreviewPopover(e));
            thumbBox.addEventListener('mouseleave', () => hideMediaPreviewPopover());
            tdThumb.appendChild(thumbBox);
        } else {
            const iconWrap = document.createElement('div');
            iconWrap.className = 'file-type-icon-box';
            iconWrap.innerHTML = `<i data-lucide="file-code-2" style="width:18px;height:18px;color:var(--text-dim);"></i>`;
            tdThumb.appendChild(iconWrap);
        }
        tr.appendChild(tdThumb);

        // Celda 3: Nombre de archivo con indentación alineada bajo su carpeta
        const tdName = document.createElement('td');
        tdName.className = 'col-name';
        const indentPx = isTreeView ? (level * 24 + 24) : 0;
        tdName.innerHTML = `
            <div class="file-cell-name" style="padding-left: ${indentPx}px;">
                ${isTreeView ? `<span class="tree-branch-line">└─</span>` : ''}
                <span class="file-main-name" title="${escapeHTML(item.relativePath)}">${escapeHTML(item.name || item.relativePath)}</span>
            </div>
        `;
        tr.appendChild(tdName);

        // Celda 4: Estado
        const tdStatus = document.createElement('td');
        tdStatus.className = 'col-status';
        tdStatus.innerHTML = `<span class="badge-status ${badgeClass}">${badgeText}</span>`;
        tr.appendChild(tdStatus);

        // Celda 5: Tamaño Izquierdo
        const tdSizeL = document.createElement('td');
        tdSizeL.className = 'col-size';
        tdSizeL.textContent = item.leftSize ? formatBytes(item.leftSize) : '—';
        tr.appendChild(tdSizeL);

        // Celda 6: Tamaño Derecho
        const tdSizeR = document.createElement('td');
        tdSizeR.className = 'col-size';
        tdSizeR.textContent = item.rightSize ? formatBytes(item.rightSize) : '—';
        tr.appendChild(tdSizeR);

        // Celda 7: Acciones Rápidas
        const tdActions = document.createElement('td');
        tdActions.className = 'col-actions';
        tdActions.innerHTML = `
            <div class="row-actions-group">
                <button class="btn-row-action btn-inspect" title="Comparar archivo en visor interno">
                    <i data-lucide="git-compare" style="width:13px;height:13px;"></i>
                    <span>Comparar</span>
                </button>
                ${item.leftPath ? `
                <button class="btn-row-action btn-row-orig" title="Abrir versión Original con app del sistema">
                    <span style="color:var(--accent-cyan); font-weight:700;">Orig</span>
                </button>` : ''}
                ${item.rightPath ? `
                <button class="btn-row-action btn-row-mod" title="Abrir versión Modificada con app del sistema">
                    <span style="color:var(--accent-violet); font-weight:700;">Mod</span>
                </button>` : ''}
            </div>
        `;
        tr.appendChild(tdActions);

        // Eventos de selección y doble clic
        tr.addEventListener('click', () => selectFolderItem(item, tr));
        tr.addEventListener('dblclick', () => inspectFolderFile(item));

        tr.querySelector('.btn-inspect').addEventListener('click', (e) => {
            e.stopPropagation();
            selectFolderItem(item, tr);
            inspectFolderFile(item);
        });

        const btnRowOrig = tr.querySelector('.btn-row-orig');
        if (btnRowOrig) {
            btnRowOrig.addEventListener('click', (e) => {
                e.stopPropagation();
                selectFolderItem(item, tr);
                openOriginalFileAction();
            });
        }

        const btnRowMod = tr.querySelector('.btn-row-mod');
        if (btnRowMod) {
            btnRowMod.addEventListener('click', (e) => {
                e.stopPropagation();
                selectFolderItem(item, tr);
                openModifiedFileAction();
            });
        }

        return tr;
    }

    // --- RESOLVER URL MULTIMEDIA ---
    function resolveMediaData(item) {
        if (!item) return null;
        const isImg = item.isImage || isImage(item.relativePath);
        const isVid = item.isVideo || isVideo(item.relativePath);
        if (!isImg && !isVid) return null;

        const leftUrl = item.leftUrl || (item.leftPath ? ('file:///' + item.leftPath.replace(/\\/g, '/')) : null);
        const rightUrl = item.rightUrl || (item.rightPath ? ('file:///' + item.rightPath.replace(/\\/g, '/')) : null);

        return {
            isImage: isImg,
            isVideo: isVid,
            leftUrl,
            rightUrl,
            primaryUrl: rightUrl || leftUrl
        };
    }

    // --- SELECCIÓN DE FILA EN LA TABLA ---
    function selectFolderItem(item, rowElem) {
        selectedFolderItem = item;
        document.querySelectorAll('.folder-row').forEach(r => r.classList.remove('selected-row'));
        if (rowElem) rowElem.classList.add('selected-row');

        updateToolbarButtonsState();
        footerMessage.textContent = `Seleccionado: ${item.relativePath} (${item.status})`;
    }

    // Actualiza los títulos y disponibilidad de los 2 botones extra de la barra superior
    function updateToolbarButtonsState() {
        if (currentAppMode === 'folders' && selectedFolderItem) {
            const hasOrig = Boolean(selectedFolderItem.leftPath);
            const hasMod = Boolean(selectedFolderItem.rightPath);

            btnOpenOriginal.title = hasOrig ? `Abrir Original: ${selectedFolderItem.name || selectedFolderItem.relativePath}` : 'No existe en lado original';
            btnOpenModified.title = hasMod ? `Abrir Modificado: ${selectedFolderItem.name || selectedFolderItem.relativePath}` : 'No existe en lado modificado';

            btnOpenOriginal.style.opacity = hasOrig ? '1' : '0.45';
            btnOpenModified.style.opacity = hasMod ? '1' : '0.45';
        } else if (currentAppMode === 'files') {
            const hasOrig = Boolean(currentLeftFile && (currentLeftFile.path || currentLeftFile.name));
            const hasMod = Boolean(currentRightFile && (currentRightFile.path || currentRightFile.name));

            btnOpenOriginal.title = hasOrig ? `Abrir Original: ${currentLeftFile.name}` : 'Abrir archivo Original';
            btnOpenModified.title = hasMod ? `Abrir Modificado: ${currentRightFile.name}` : 'Abrir archivo Modificado';

            btnOpenOriginal.style.opacity = '1';
            btnOpenModified.style.opacity = '1';
        } else {
            btnOpenOriginal.title = 'Abrir archivo Original (Lado Izquierdo)';
            btnOpenModified.title = 'Abrir archivo Modificado (Lado Derecho)';
            btnOpenOriginal.style.opacity = '0.7';
            btnOpenModified.style.opacity = '0.7';
        }
    }

    // --- POPOVER FLOTANTE DE PREVISUALIZACIÓN MULTIMEDIA (HOVER GRANDE) ---
    async function showMediaPreviewPopover(item, e) {
        if (!item) return;

        const isVid = item.isVideo || isVideo(item.relativePath);
        popoverFilename.textContent = item.name || item.relativePath;

        const badgeText = item.status === 'identical' ? 'Idéntico' :
            item.status === 'modified' ? 'Diferencia / Modificado' :
                item.status === 'left-only' ? 'Solo Original' : 'Nuevo';
        const badgeClass = item.status === 'identical' ? 'status-identical' :
            item.status === 'modified' ? 'status-modified' :
                item.status === 'left-only' ? 'status-left-only' : 'status-right-only';

        popoverBadge.className = `badge-status ${badgeClass}`;
        popoverBadge.textContent = badgeText;
        popoverSubtitle.textContent = isVid ? 'Previsualización de Video en Alta Definición' : 'Comparativa Visual de Imagen Ampliada';

        const media = resolveMediaData(item);
        popoverContent.innerHTML = '';

        if (!media || (!media.leftUrl && !media.rightUrl)) {
            popoverContent.innerHTML = `<div style="padding:24px; text-align:center; color:var(--text-dim);">No se pudo cargar la vista previa.</div>`;
            mediaPreviewPopover.classList.remove('hidden');
            positionMediaPreviewPopover(e);
            return;
        }

        // Si está modificado y existen ambos lados: Vista lado a lado ampliada
        if (item.status === 'modified' && media.leftUrl && media.rightUrl) {
            const compareGrid = document.createElement('div');
            compareGrid.className = 'popover-compare-grid';

            // Original
            const leftCard = document.createElement('div');
            leftCard.className = 'popover-side-card';
            leftCard.innerHTML = `
                <div class="popover-side-label label-original">
                    <i data-lucide="file-input" style="width:13px; height:13px;"></i>
                    <span>Original (Lado Izquierdo)</span>
                </div>
                <div class="popover-media-wrap">
                    ${media.isVideo ?
                    `<video src="${media.leftUrl}" autoplay loop muted playsinline></video>` :
                    `<img src="${media.leftUrl}" alt="Original" class="popover-img">`
                }
                </div>
                <div class="popover-media-meta">Tamaño: ${formatBytes(item.leftSize || 0)}</div>
            `;

            // Modificado
            const rightCard = document.createElement('div');
            rightCard.className = 'popover-side-card';
            rightCard.innerHTML = `
                <div class="popover-side-label label-modified">
                    <i data-lucide="file-output" style="width:13px; height:13px;"></i>
                    <span>Modificado (Lado Derecho)</span>
                </div>
                <div class="popover-media-wrap">
                    ${media.isVideo ?
                    `<video src="${media.rightUrl}" autoplay loop muted playsinline></video>` :
                    `<img src="${media.rightUrl}" alt="Modificado" class="popover-img">`
                }
                </div>
                <div class="popover-media-meta">Tamaño: ${formatBytes(item.rightSize || 0)}</div>
            `;

            compareGrid.appendChild(leftCard);
            compareGrid.appendChild(rightCard);
            popoverContent.appendChild(compareGrid);
        } else {
            // Un solo lado
            const singleWrap = document.createElement('div');
            singleWrap.className = 'popover-single-wrap';

            const activeUrl = media.rightUrl || media.leftUrl;
            const activeSize = item.rightSize || item.leftSize || 0;
            const sideLabel = item.status === 'left-only' ? 'Versión Original (Solo en carpeta izquierda)' :
                item.status === 'right-only' ? 'Versión Modificada (Solo en carpeta derecha)' : 'Versión Idéntica (Ambas carpetas)';

            singleWrap.innerHTML = `
                <div class="popover-side-label ${item.status === 'right-only' ? 'label-modified' : 'label-original'}">
                    <span>${sideLabel}</span>
                </div>
                <div class="popover-media-wrap">
                    ${media.isVideo ?
                    `<video src="${activeUrl}" autoplay loop muted playsinline controls></video>` :
                    `<img src="${activeUrl}" alt="Preview" class="popover-img">`
                }
                </div>
                <div class="popover-media-meta">Tamaño en disco: ${formatBytes(activeSize)}</div>
            `;
            popoverContent.appendChild(singleWrap);
        }

        if (window.lucide) lucide.createIcons();
        mediaPreviewPopover.classList.remove('hidden');
        positionMediaPreviewPopover(e);
    }

    function positionMediaPreviewPopover(e) {
        if (!mediaPreviewPopover || mediaPreviewPopover.classList.contains('hidden')) return;

        const popoverWidth = mediaPreviewPopover.offsetWidth || 560;
        const popoverHeight = mediaPreviewPopover.offsetHeight || 380;

        let left = e.clientX + 24;
        let top = e.clientY - 80;

        if (left + popoverWidth > window.innerWidth - 20) {
            left = e.clientX - popoverWidth - 24;
        }
        if (top + popoverHeight > window.innerHeight - 20) {
            top = window.innerHeight - popoverHeight - 20;
        }
        if (top < 20) top = 20;

        mediaPreviewPopover.style.left = `${Math.max(10, left)}px`;
        mediaPreviewPopover.style.top = `${Math.max(10, top)}px`;
    }

    function hideMediaPreviewPopover() {
        if (mediaPreviewPopover) {
            mediaPreviewPopover.classList.add('hidden');
        }
    }

    // --- INSPECCIÓN DETALLADA DE UN ARCHIVO DE CARPETA ---
    async function inspectFolderFile(item) {
        if (!item) return;
        selectedFolderItem = item;

        const isMediaItem = item.isMedia || item.isImage || isImage(item.relativePath);
        const ghToken = (document.getElementById('gh-token-input')?.value || localStorage.getItem('hycreator_gh_token') || '').trim();

        if (isMediaItem) {
            let leftUrl = null;
            let rightUrl = null;
            if (item.isGithub && isElectron && window.electronAPI.readGithubBlob) {
                footerMessage.textContent = `Descargando imagen desde GitHub: ${item.relativePath}...`;
                const [resL, resR] = await Promise.all([
                    item.leftGithub ? window.electronAPI.readGithubBlob({ ...item.leftGithub, name: item.name, token: ghToken }) : Promise.resolve(null),
                    item.rightGithub ? window.electronAPI.readGithubBlob({ ...item.rightGithub, name: item.name, token: ghToken }) : Promise.resolve(null)
                ]);
                leftUrl = resL?.dataUrl || null;
                rightUrl = resR?.dataUrl || null;
            } else {
                const media = resolveMediaData(item);
                leftUrl = media ? media.leftUrl : null;
                rightUrl = media ? media.rightUrl : null;
            }
            leftFileName.textContent = `${item.relativePath} (Original)`;
            rightFileName.textContent = `${item.relativePath} (Modificado)`;

            currentLeftFile = { name: item.name, path: item.leftPath, isMedia: true, dataUrl: leftUrl };
            currentRightFile = { name: item.name, path: item.rightPath, isMedia: true, dataUrl: rightUrl };

            const metaL = item.leftPath ? `Original: ${formatBytes(item.leftSize || 0)}` : '(No existe en original)';
            const metaR = item.rightPath ? `Modificado: ${formatBytes(item.rightSize || 0)}` : '(No existe en modificado)';

            showImageComparisonMode(leftUrl, rightUrl, metaL, metaR);
            switchAppMode('files');
            footerMessage.textContent = `Previsualizando diferencias de imagen para: ${item.relativePath}`;
        } else {
            showTextEditorMode();
            if (item.isGithub && isElectron && window.electronAPI.readGithubBlob) {
                footerMessage.textContent = `Descargando archivo desde GitHub: ${item.relativePath}...`;
                const [resL, resR] = await Promise.all([
                    item.leftGithub ? window.electronAPI.readGithubBlob({ ...item.leftGithub, name: item.name, token: ghToken }) : Promise.resolve({ content: '' }),
                    item.rightGithub ? window.electronAPI.readGithubBlob({ ...item.rightGithub, name: item.name, token: ghToken }) : Promise.resolve({ content: '' })
                ]);
                if (resL?.error || resR?.error) {
                    alert(`Error leyendo archivo de GitHub: ${resL?.error || resR?.error}`);
                }
                leftTextarea.value = resL?.content || '';
                rightTextarea.value = resR?.content || '';
                leftFileName.textContent = item.relativePath;
                rightFileName.textContent = item.relativePath;
                currentLeftFile = { name: item.name, path: item.leftPath, content: leftTextarea.value };
                currentRightFile = { name: item.name, path: item.rightPath, content: rightTextarea.value };
            } else if (isElectron && (item.leftPath || item.rightPath)) {
                const resL = item.leftPath ? await window.electronAPI.readFile(item.leftPath) : { content: '' };
                const resR = item.rightPath ? await window.electronAPI.readFile(item.rightPath) : { content: '' };

                leftTextarea.value = resL.content || '';
                rightTextarea.value = resR.content || '';
                leftFileName.textContent = item.relativePath;
                rightFileName.textContent = item.relativePath;

                currentLeftFile = { name: item.name, path: item.leftPath, content: resL.content };
                currentRightFile = { name: item.name, path: item.rightPath, content: resR.content };
            } else {
                leftTextarea.value = `// Contenido del archivo ${item.relativePath} (Lado Izquierdo - Original)`;
                rightTextarea.value = `// Contenido actualizado del archivo ${item.relativePath} (Lado Derecho - Modificado)`;
                leftFileName.textContent = item.relativePath;
                rightFileName.textContent = item.relativePath;
                currentLeftFile = { name: item.relativePath, path: null };
                currentRightFile = { name: item.relativePath, path: null };
            }

            switchAppMode('files');
            updateDiffView();
            footerMessage.textContent = `Diferencias de texto para: ${item.relativePath}`;
        }
    }

    function showTextEditorMode() {
        leftView.classList.remove('hidden');
        rightView.classList.remove('hidden');
        leftTextarea.classList.remove('hidden');
        rightTextarea.classList.remove('hidden');
        leftImageView.classList.add('hidden');
        rightImageView.classList.add('hidden');
    }

    function showImageComparisonMode(leftSrc, rightSrc, metaLeft = '', metaRight = '') {
        leftView.classList.add('hidden');
        rightView.classList.add('hidden');
        leftTextarea.classList.add('hidden');
        rightTextarea.classList.add('hidden');

        leftImageView.classList.remove('hidden');
        rightImageView.classList.remove('hidden');

        if (leftSrc) {
            leftImageElem.src = leftSrc;
            leftImageElem.style.display = 'block';
            leftImageInfo.textContent = metaLeft || 'Imagen Original';
        } else {
            leftImageElem.style.display = 'none';
            leftImageInfo.textContent = '(No existe en la carpeta original)';
        }

        if (rightSrc) {
            rightImageElem.src = rightSrc;
            rightImageElem.style.display = 'block';
            rightImageInfo.textContent = metaRight || 'Imagen Modificada';
        } else {
            rightImageElem.style.display = 'none';
            rightImageInfo.textContent = '(No existe en la carpeta modificada)';
        }
    }

    // --- ACCIONES DE LOS 2 BOTONES RÁPIDOS SUPERIORES ---
    btnOpenOriginal.addEventListener('click', openOriginalFileAction);
    btnOpenModified.addEventListener('click', openModifiedFileAction);

    async function openOriginalFileAction() {
        closeAllDropdowns();
        const pathTarget = (selectedFolderItem && selectedFolderItem.leftPath) ||
                           (currentLeftFile && currentLeftFile.path);

        if (pathTarget) {
            if (isElectron) {
                const ok = await window.electronAPI.openWithSystem(pathTarget);
                if (ok) {
                    footerMessage.textContent = `Abriendo archivo Original en programa predeterminado: ${pathTarget}`;
                } else {
                    alert(`No se pudo abrir el archivo original: ${pathTarget}`);
                }
            } else {
                alert(`Se abriría el archivo Original: ${pathTarget}`);
            }
        } else {
            openFileForSide('left');
        }
    }

    async function openModifiedFileAction() {
        closeAllDropdowns();
        const pathTarget = (selectedFolderItem && selectedFolderItem.rightPath) ||
                           (currentRightFile && currentRightFile.path);

        if (pathTarget) {
            if (isElectron) {
                const ok = await window.electronAPI.openWithSystem(pathTarget);
                if (ok) {
                    footerMessage.textContent = `Abriendo archivo Modificado en programa predeterminado: ${pathTarget}`;
                } else {
                    alert(`No se pudo abrir el archivo modificado: ${pathTarget}`);
                }
            } else {
                alert(`Se abriría el archivo Modificado: ${pathTarget}`);
            }
        } else {
            openFileForSide('right');
        }
    }

    // Desplegables de los botones rápidos
    btnOpenOriginalMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdownModified.classList.add('hidden');
        menuDropdownOriginal.classList.toggle('hidden');
    });

    btnOpenModifiedMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdownOriginal.classList.add('hidden');
        menuDropdownModified.classList.toggle('hidden');
    });

    function closeAllDropdowns() {
        if (menuDropdownOriginal) menuDropdownOriginal.classList.add('hidden');
        if (menuDropdownModified) menuDropdownModified.classList.add('hidden');
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-split-wrap')) {
            closeAllDropdowns();
        }
    });

    optOpenOriginalDefault.addEventListener('click', openOriginalFileAction);
    optOpenOriginalExplorer.addEventListener('click', async () => {
        closeAllDropdowns();
        const pathTarget = (selectedFolderItem && selectedFolderItem.leftPath) || (currentLeftFile && currentLeftFile.path);
        if (pathTarget && isElectron) {
            await window.electronAPI.showInFolder(pathTarget);
            footerMessage.textContent = `Mostrando archivo Original en el Explorador: ${pathTarget}`;
        } else {
            alert('No hay un archivo Original seleccionado para mostrar.');
        }
    });
    optOpenOriginalDialog.addEventListener('click', () => {
        closeAllDropdowns();
        openFileForSide('left');
    });

    optOpenModifiedDefault.addEventListener('click', openModifiedFileAction);
    optOpenModifiedExplorer.addEventListener('click', async () => {
        closeAllDropdowns();
        const pathTarget = (selectedFolderItem && selectedFolderItem.rightPath) || (currentRightFile && currentRightFile.path);
        if (pathTarget && isElectron) {
            await window.electronAPI.showInFolder(pathTarget);
            footerMessage.textContent = `Mostrando archivo Modificado en el Explorador: ${pathTarget}`;
        } else {
            alert('No hay un archivo Modificado seleccionado para mostrar.');
        }
    });
    optOpenModifiedDialog.addEventListener('click', () => {
        closeAllDropdowns();
        openFileForSide('right');
    });

    // --- ACCIONES DE ARCHIVOS INDIVIDUALES ---
    async function openFileForSide(side) {
        if (isElectron) {
            const res = await window.electronAPI.openDialog({
                mode: 'file',
                title: `WinMerge Modern - Abrir Archivo para Panel ${side === 'left' ? 'Original (Izquierdo)' : 'Modificado (Derecho)'}`
            });
            if (res && !res.error) {
                if (res.isMedia) {
                    if (side === 'left') {
                        currentLeftFile = res;
                        leftFileName.textContent = res.name;
                    } else {
                        currentRightFile = res;
                        rightFileName.textContent = res.name;
                    }
                    showImageComparisonMode(
                        currentLeftFile ? (currentLeftFile.dataUrl || currentLeftFile.fileUrl) : null,
                        currentRightFile ? (currentRightFile.dataUrl || currentRightFile.fileUrl) : null,
                        currentLeftFile ? currentLeftFile.name : '',
                        currentRightFile ? currentRightFile.name : ''
                    );
                } else {
                    showTextEditorMode();
                    if (side === 'left') {
                        leftTextarea.value = res.content || '';
                        leftFileName.textContent = res.name;
                        currentLeftFile = res;
                    } else {
                        rightTextarea.value = res.content || '';
                        rightFileName.textContent = res.name;
                        currentRightFile = res;
                    }
                    updateDiffView();
                }
                switchAppMode('files');
                updateToolbarButtonsState();
                footerMessage.textContent = `Cargado: ${res.name}`;
            }
        } else {
            if (side === 'left') inputFileLeft.click();
            else inputFileRight.click();
        }
    }

    if (btnLoadLeft) btnLoadLeft.addEventListener('click', () => openFileForSide('left'));
    if (btnLoadRight) btnLoadRight.addEventListener('click', () => openFileForSide('right'));

    if (btnClearLeft) {
        btnClearLeft.addEventListener('click', () => {
            leftTextarea.value = '';
            currentLeftFile = null;
            leftFileName.textContent = 'Archivo Izquierdo';
            updateDiffView();
        });
    }

    if (btnClearRight) {
        btnClearRight.addEventListener('click', () => {
            rightTextarea.value = '';
            currentRightFile = null;
            rightFileName.textContent = 'Archivo Derecho';
            updateDiffView();
        });
    }

    if (btnBackToFolders) {
        btnBackToFolders.addEventListener('click', () => switchAppMode('folders'));
    }

    // Cerrar vista de archivos y dejar todo en blanco
    function closeAndResetFilesView() {
        leftTextarea.value = '';
        rightTextarea.value = '';
        currentLeftFile = null;
        currentRightFile = null;
        selectedFolderItem = null;
        leftFileName.textContent = 'Archivo Izquierdo';
        rightFileName.textContent = 'Archivo Derecho';
        
        leftView.innerHTML = '';
        rightView.innerHTML = '';
        diffMinimap.innerHTML = '';
        diffLines = [];
        currentDiffIndex = -1;

        showTextEditorMode();
        updateToolbarButtonsState();
        footerMessage.textContent = 'Vista de archivos cerrada. Listo.';
    }

    if (btnCloseFilesView) {
        btnCloseFilesView.addEventListener('click', closeAndResetFilesView);
    }

    // Scroll sincronizado universal entre ambos paneles de archivos con scrollbar única
    const leftEditorWrapper = leftView ? leftView.closest('.editor-wrapper') : null;
    const rightEditorWrapper = rightView ? rightView.closest('.editor-wrapper') : null;
    const universalTrack = document.getElementById('universal-scrollbar-track');
    const universalThumb = document.getElementById('universal-scrollbar-thumb');
    let isSyncingScroll = false;
    let isDraggingThumb = false;
    let startY = 0;
    let startScrollTop = 0;

    function updateUniversalThumb() {
        if (!leftEditorWrapper || !universalTrack || !universalThumb) return;
        const scrollHeight = Math.max(leftEditorWrapper.scrollHeight, rightEditorWrapper ? rightEditorWrapper.scrollHeight : 0);
        const clientHeight = leftEditorWrapper.clientHeight;
        const trackHeight = universalTrack.clientHeight;

        // Actualizar slider del minimapa alineado 1:1 con el porcentaje real de scrollHeight
        const minimapSlider = document.getElementById('diff-minimap-viewport-slider');
        if (minimapSlider && diffMinimap) {
            const minimapHeight = diffMinimap.clientHeight;
            if (scrollHeight > 0 && minimapHeight > 0) {
                const rawTop = (leftEditorWrapper.scrollTop / scrollHeight) * minimapHeight;
                const rawHeight = Math.min(minimapHeight, (clientHeight / scrollHeight) * minimapHeight);
                const sliderHeight = Math.max(12, rawHeight);
                const maxSliderTop = Math.max(0, minimapHeight - sliderHeight);
                const sliderTop = Math.max(0, Math.min(maxSliderTop, rawTop + (rawHeight - sliderHeight) / 2));

                minimapSlider.style.height = `${sliderHeight}px`;
                minimapSlider.style.transform = `translateY(${sliderTop}px)`;
            }
        }

        if (scrollHeight <= clientHeight || clientHeight === 0) {
            universalThumb.style.display = 'none';
            return;
        }

        universalThumb.style.display = 'block';
        const thumbHeight = Math.max(28, (clientHeight / scrollHeight) * trackHeight);
        const maxScroll = scrollHeight - clientHeight;
        const maxTop = trackHeight - thumbHeight;
        const currentScroll = leftEditorWrapper.scrollTop;
        const thumbTop = maxScroll > 0 ? (currentScroll / maxScroll) * maxTop : 0;

        universalThumb.style.height = `${thumbHeight}px`;
        universalThumb.style.transform = `translateY(${thumbTop}px)`;
    }

    function syncScroll(sourceWrapper, targetWrapper) {
        if (!sourceWrapper || !targetWrapper) return;
        sourceWrapper.addEventListener('scroll', () => {
            updateUniversalThumb();
            if (isSyncingScroll) return;
            isSyncingScroll = true;
            targetWrapper.scrollTop = sourceWrapper.scrollTop;
            targetWrapper.scrollLeft = sourceWrapper.scrollLeft;
            requestAnimationFrame(() => {
                isSyncingScroll = false;
            });
        });
    }

    if (leftEditorWrapper && rightEditorWrapper) {
        syncScroll(leftEditorWrapper, rightEditorWrapper);
        syncScroll(rightEditorWrapper, leftEditorWrapper);

        // Bloquear desincronización por rueda del ratón y unificarla en ambos paneles
        const handleWheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY;
            leftEditorWrapper.scrollTop += delta;
            rightEditorWrapper.scrollTop = leftEditorWrapper.scrollTop;
            updateUniversalThumb();
        };

        leftEditorWrapper.addEventListener('wheel', handleWheel, { passive: false });
        rightEditorWrapper.addEventListener('wheel', handleWheel, { passive: false });

        // También sincronizar las textareas si están visibles
        if (leftTextarea && rightTextarea) {
            leftTextarea.addEventListener('wheel', handleWheel, { passive: false });
            rightTextarea.addEventListener('wheel', handleWheel, { passive: false });
            leftTextarea.addEventListener('scroll', () => {
                rightTextarea.scrollTop = leftTextarea.scrollTop;
                rightTextarea.scrollLeft = leftTextarea.scrollLeft;
            });
            rightTextarea.addEventListener('scroll', () => {
                leftTextarea.scrollTop = rightTextarea.scrollTop;
                leftTextarea.scrollLeft = rightTextarea.scrollLeft;
            });
        }

        // Control mediante arrastre del Thumb Universal
        if (universalThumb && universalTrack) {
            universalThumb.addEventListener('mousedown', (e) => {
                isDraggingThumb = true;
                startY = e.clientY;
                startScrollTop = leftEditorWrapper.scrollTop;
                document.body.style.userSelect = 'none';
                e.preventDefault();
            });

            window.addEventListener('mousemove', (e) => {
                if (!isDraggingThumb) return;
                const deltaY = e.clientY - startY;
                const scrollHeight = Math.max(leftEditorWrapper.scrollHeight, rightEditorWrapper.scrollHeight);
                const clientHeight = leftEditorWrapper.clientHeight;
                const trackHeight = universalTrack.clientHeight;
                const thumbHeight = universalThumb.offsetHeight;
                const maxTop = trackHeight - thumbHeight;
                const maxScroll = scrollHeight - clientHeight;

                if (maxTop > 0) {
                    const scrollDelta = (deltaY / maxTop) * maxScroll;
                    leftEditorWrapper.scrollTop = startScrollTop + scrollDelta;
                    rightEditorWrapper.scrollTop = startScrollTop + scrollDelta;
                }
            });

            window.addEventListener('mouseup', () => {
                if (isDraggingThumb) {
                    isDraggingThumb = false;
                    document.body.style.userSelect = '';
                }
            });

            universalTrack.addEventListener('click', (e) => {
                if (e.target === universalThumb) return;
                const rect = universalTrack.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const trackHeight = universalTrack.clientHeight;
                const scrollHeight = Math.max(leftEditorWrapper.scrollHeight, rightEditorWrapper.scrollHeight);
                const clientHeight = leftEditorWrapper.clientHeight;
                const targetScroll = (clickY / trackHeight) * (scrollHeight - clientHeight);
                leftEditorWrapper.scrollTo({ top: targetScroll, behavior: 'smooth' });
                rightEditorWrapper.scrollTo({ top: targetScroll, behavior: 'smooth' });
            });

            // Permitir clic en el Minimapa para saltar instantáneamente a esa sección del código
            if (diffMinimap) {
                diffMinimap.addEventListener('click', (e) => {
                    const rect = diffMinimap.getBoundingClientRect();
                    const clickY = e.clientY - rect.top;
                    const minimapHeight = diffMinimap.clientHeight;
                    const scrollHeight = Math.max(leftEditorWrapper.scrollHeight, rightEditorWrapper.scrollHeight);
                    const clientHeight = leftEditorWrapper.clientHeight;
                    const maxScroll = Math.max(0, scrollHeight - clientHeight);
                    const targetScroll = Math.max(0, Math.min(maxScroll, (clickY / Math.max(1, minimapHeight)) * scrollHeight - (clientHeight / 2)));
                    leftEditorWrapper.scrollTo({ top: targetScroll, behavior: 'smooth' });
                    rightEditorWrapper.scrollTo({ top: targetScroll, behavior: 'smooth' });
                });
            }
        }
    }

    // --- ALGORITMO DIFF PARA ARCHIVOS DE TEXTO (EXACTO Y OPTIMIZADO) ---
    function splitNormalizedLines(text) {
        return (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    }

    function computeDiff(text1, text2) {
        const lines1 = splitNormalizedLines(text1);
        const lines2 = splitNormalizedLines(text2);

        const total1 = lines1.length;
        const total2 = lines2.length;

        // Recortar prefijo y sufijo idénticos para reducir drásticamente la matriz LCS
        let prefix = 0;
        while (prefix < total1 && prefix < total2 && lines1[prefix] === lines2[prefix]) {
            prefix++;
        }

        let suffix = 0;
        while (
            suffix < (total1 - prefix) &&
            suffix < (total2 - prefix) &&
            lines1[total1 - 1 - suffix] === lines2[total2 - 1 - suffix]
        ) {
            suffix++;
        }

        const mid1 = lines1.slice(prefix, total1 - suffix);
        const mid2 = lines2.slice(prefix, total2 - suffix);
        const m = mid1.length;
        const n = mid2.length;

        const resultLeft = [];
        const resultRight = [];

        for (let p = 0; p < prefix; p++) {
            resultLeft.push({ type: 'same', text: lines1[p], lineNum: p + 1 });
            resultRight.push({ type: 'same', text: lines2[p], lineNum: p + 1 });
        }

        if (m === 0 && n === 0) {
            // Idénticos
        } else if (m * n > 4000000) {
            const fast = computeFastDiff(mid1, mid2, prefix, prefix);
            resultLeft.push(...fast.left);
            resultRight.push(...fast.right);
        } else {
            const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));

            for (let i = 1; i <= m; i++) {
                const row = dp[i];
                const prevRow = dp[i - 1];
                const l1 = mid1[i - 1];
                for (let j = 1; j <= n; j++) {
                    if (l1 === mid2[j - 1]) {
                        row[j] = prevRow[j - 1] + 1;
                    } else {
                        row[j] = prevRow[j] >= row[j - 1] ? prevRow[j] : row[j - 1];
                    }
                }
            }

            let i = m;
            let j = n;
            const midLeft = [];
            const midRight = [];

            while (i > 0 || j > 0) {
                if (i > 0 && j > 0 && mid1[i - 1] === mid2[j - 1]) {
                    midLeft.push({ type: 'same', text: mid1[i - 1], lineNum: prefix + i });
                    midRight.push({ type: 'same', text: mid2[j - 1], lineNum: prefix + j });
                    i--;
                    j--;
                } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                    midLeft.push({ type: 'empty', text: '', lineNum: '' });
                    midRight.push({ type: 'added', text: mid2[j - 1], lineNum: prefix + j });
                    j--;
                } else {
                    midLeft.push({ type: 'removed', text: mid1[i - 1], lineNum: prefix + i });
                    midRight.push({ type: 'empty', text: '', lineNum: '' });
                    i--;
                }
            }

            midLeft.reverse();
            midRight.reverse();

            for (let k = 0; k < midLeft.length; k++) {
                if (midLeft[k].type === 'removed' && midRight[k].type === 'added') {
                    midLeft[k].type = 'modified';
                    midRight[k].type = 'modified';
                }
            }

            resultLeft.push(...midLeft);
            resultRight.push(...midRight);
        }

        for (let s = 0; s < suffix; s++) {
            const idx1 = total1 - suffix + s;
            const idx2 = total2 - suffix + s;
            resultLeft.push({ type: 'same', text: lines1[idx1], lineNum: idx1 + 1 });
            resultRight.push({ type: 'same', text: lines2[idx2], lineNum: idx2 + 1 });
        }

        return { left: resultLeft, right: resultRight };
    }

    // Comparador rápido con índice de anclas para textos gigantes (> 2000x2000 líneas tras recorte)
    function computeFastDiff(lines1, lines2, offset1 = 0, offset2 = 0) {
        let i = 0;
        let j = 0;
        const resultLeft = [];
        const resultRight = [];
        const maxLook = 400;

        while (i < lines1.length || j < lines2.length) {
            if (i < lines1.length && j < lines2.length && lines1[i] === lines2[j]) {
                resultLeft.push({ type: 'same', text: lines1[i], lineNum: offset1 + i + 1 });
                resultRight.push({ type: 'same', text: lines2[j], lineNum: offset2 + j + 1 });
                i++;
                j++;
            } else {
                let bestRight = -1;
                let bestLeft = -1;
                const limitR = Math.min(maxLook, lines2.length - j);
                const limitL = Math.min(maxLook, lines1.length - i);

                if (i < lines1.length) {
                    for (let k = 1; k < limitR; k++) {
                        if (lines1[i] === lines2[j + k]) {
                            bestRight = k;
                            break;
                        }
                    }
                }
                if (j < lines2.length) {
                    for (let k = 1; k < limitL; k++) {
                        if (lines1[i + k] === lines2[j]) {
                            bestLeft = k;
                            break;
                        }
                    }
                }

                if (bestRight !== -1 && (bestLeft === -1 || bestRight <= bestLeft)) {
                    for (let k = 0; k < bestRight; k++) {
                        resultLeft.push({ type: 'empty', text: '', lineNum: '' });
                        resultRight.push({ type: 'added', text: lines2[j + k], lineNum: offset2 + j + k + 1 });
                    }
                    j += bestRight;
                } else if (bestLeft !== -1) {
                    for (let k = 0; k < bestLeft; k++) {
                        resultLeft.push({ type: 'removed', text: lines1[i + k], lineNum: offset1 + i + k + 1 });
                        resultRight.push({ type: 'empty', text: '', lineNum: '' });
                    }
                    i += bestLeft;
                } else {
                    if (i < lines1.length && j < lines2.length) {
                        resultLeft.push({ type: 'modified', text: lines1[i], lineNum: offset1 + i + 1 });
                        resultRight.push({ type: 'modified', text: lines2[j], lineNum: offset2 + j + 1 });
                        i++;
                        j++;
                    } else if (i < lines1.length) {
                        resultLeft.push({ type: 'removed', text: lines1[i], lineNum: offset1 + i + 1 });
                        resultRight.push({ type: 'empty', text: '', lineNum: '' });
                        i++;
                    } else if (j < lines2.length) {
                        resultLeft.push({ type: 'empty', text: '', lineNum: '' });
                        resultRight.push({ type: 'added', text: lines2[j], lineNum: offset2 + j + 1 });
                        j++;
                    }
                }
            }
        }

        return { left: resultLeft, right: resultRight };
    }

    function renderInlineDiffHtml(leftText, rightText) {
        const a = leftText || '';
        const b = rightText || '';
        let pre = 0;
        while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
        let suf = 0;
        while (suf < (a.length - pre) && suf < (b.length - pre) && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;

        const aMid = a.slice(pre, a.length - suf);
        const bMid = b.slice(pre, b.length - suf);
        const leftHtml = escapeHTML(a.slice(0, pre))
            + (aMid ? `<span class="diff-inline-del">${escapeHTML(aMid)}</span>` : '')
            + escapeHTML(a.slice(a.length - suf));
        const rightHtml = escapeHTML(b.slice(0, pre))
            + (bMid ? `<span class="diff-inline-add">${escapeHTML(bMid)}</span>` : '')
            + escapeHTML(b.slice(b.length - suf));
        return { leftHtml, rightHtml };
    }

    function updateDiffView() {
        const text1 = leftTextarea.value;
        const text2 = rightTextarea.value;

        const { left, right } = computeDiff(text1, text2);

        leftView.innerHTML = '';
        rightView.innerHTML = '';
        diffMinimap.innerHTML = '';

        diffLines = [];
        const totalRows = left.length;
        const fragL = document.createDocumentFragment();
        const fragR = document.createDocumentFragment();
        const fragMap = document.createDocumentFragment();

        left.forEach((lineL, idx) => {
            const lineR = right[idx];

            const statusCharL = lineL.type === 'added' ? '+' : lineL.type === 'removed' ? '-' : lineL.type === 'modified' ? '~' : ' ';
            const statusCharR = lineR.type === 'added' ? '+' : lineR.type === 'removed' ? '-' : lineR.type === 'modified' ? '~' : ' ';

            if (lineL.type !== 'same' || lineR.type !== 'same') {
                diffLines.push(idx);
            }

            let htmlL = escapeHTML(lineL.text);
            let htmlR = escapeHTML(lineR.text);
            if (lineL.type === 'modified' && lineR.type === 'modified') {
                const inline = renderInlineDiffHtml(lineL.text, lineR.text);
                htmlL = inline.leftHtml;
                htmlR = inline.rightHtml;
            }

            const rowL = document.createElement('div');
            rowL.className = `diff-line ${lineL.type}`;
            rowL.dataset.lineIndex = idx;
            if (lineL.lineNum !== '') rowL.dataset.lineNum = lineL.lineNum;
            rowL.innerHTML = `
                <div class="line-num">${lineL.lineNum}</div>
                <div class="line-status">${statusCharL}</div>
                <div class="line-content">${htmlL}</div>
            `;
            fragL.appendChild(rowL);

            const rowR = document.createElement('div');
            rowR.className = `diff-line ${lineR.type}`;
            rowR.dataset.lineIndex = idx;
            if (lineR.lineNum !== '') rowR.dataset.lineNum = lineR.lineNum;
            rowR.innerHTML = `
                <div class="line-num">${lineR.lineNum}</div>
                <div class="line-status">${statusCharR}</div>
                <div class="line-content">${htmlR}</div>
            `;
            fragR.appendChild(rowR);

            if (lineL.type !== 'same' || lineR.type !== 'same') {
                const mark = document.createElement('div');
                mark.className = 'diff-minimap-line';
                mark.style.top = `${(idx / Math.max(1, totalRows)) * 100}%`;
                mark.style.background = lineL.type === 'added' || lineR.type === 'added' ? 'var(--accent-emerald)' :
                    lineL.type === 'removed' || lineR.type === 'removed' ? 'var(--accent-red)' : 'var(--accent-violet)';
                fragMap.appendChild(mark);
            }
        });

        leftView.appendChild(fragL);
        rightView.appendChild(fragR);
        diffMinimap.appendChild(fragMap);

        // Ajustar marcas del minimapa a la posición real (offsetTop / scrollHeight) para encuadre exacto con líneas envueltas
        requestAnimationFrame(() => {
            const actualScrollH = leftEditorWrapper ? Math.max(leftEditorWrapper.scrollHeight, rightEditorWrapper ? rightEditorWrapper.scrollHeight : 0) : 0;
            if (actualScrollH > 0) {
                const marks = diffMinimap.querySelectorAll('.diff-minimap-line');
                marks.forEach((mark, mIdx) => {
                    const rowIdx = diffLines[mIdx];
                    if (rowIdx !== undefined) {
                        const rowEl = leftView.children[rowIdx] || rightView.children[rowIdx];
                        if (rowEl) {
                            mark.style.top = `${(rowEl.offsetTop / actualScrollH) * 100}%`;
                        }
                    }
                });
            }
            updateUniversalThumb();
        });

        // Crear recuadro de previsualización que indica en qué parte del código estamos
        const minimapViewportSlider = document.createElement('div');
        minimapViewportSlider.className = 'diff-minimap-viewport-slider';
        minimapViewportSlider.id = 'diff-minimap-viewport-slider';
        diffMinimap.appendChild(minimapViewportSlider);

        currentDiffIndex = -1;
        updateDiffCounter();
        setTimeout(updateUniversalThumb, 50);
    }

    // --- ACCIONES DE COMPARACION UNIFICADA ---
    btnAnalyzeFolders.addEventListener('click', triggerFoldersComparison);

    const btnToggleGithub = document.getElementById('btn-toggle-github-compare');
    const githubComparePanel = document.getElementById('github-compare-panel');
    const ghLeftUrlInput = document.getElementById('gh-left-url');
    const ghRightUrlInput = document.getElementById('gh-right-url');
    const ghTokenInput = document.getElementById('gh-token-input');
    const btnCompareGithub = document.getElementById('btn-compare-github');

    if (ghTokenInput) {
        const savedToken = localStorage.getItem('hycreator_gh_token');
        if (savedToken) ghTokenInput.value = savedToken;
        ghTokenInput.addEventListener('change', () => {
            localStorage.setItem('hycreator_gh_token', ghTokenInput.value.trim());
        });
    }

    if (btnToggleGithub && githubComparePanel) {
        btnToggleGithub.addEventListener('click', () => {
            githubComparePanel.classList.toggle('hidden');
        });
    }

    if (btnCompareGithub) {
        btnCompareGithub.addEventListener('click', async () => {
            const leftUrl = (ghLeftUrlInput?.value || '').trim();
            const rightUrl = (ghRightUrlInput?.value || '').trim();
            const token = (ghTokenInput?.value || '').trim();
            if (!leftUrl || !rightUrl) {
                alert('Ingresa los dos links de GitHub (Original y Modificado) para comparar.');
                return;
            }
            if (token) localStorage.setItem('hycreator_gh_token', token);
            if (!isElectron || !window.electronAPI.compareGithub) {
                alert('La comparación directa de GitHub solo está disponible en la app Electron.');
                return;
            }

            btnCompareGithub.disabled = true;
            btnCompareGithub.innerHTML = '<i data-lucide="loader-2" class="spin-icon"></i><span>Consultando...</span>';
            if (window.lucide) lucide.createIcons();
            if (statusDot) statusDot.className = 'status-indicator busy';
            footerMessage.textContent = 'Consultando árboles de archivos en GitHub...';

            let unlisten = null;
            if (window.electronAPI.onCompareProgress) {
                unlisten = window.electronAPI.onCompareProgress((data) => {
                    if (data && data.message) footerMessage.textContent = data.message;
                });
            }

            try {
                const result = await window.electronAPI.compareGithub({ leftUrl, rightUrl, token });
                if (result && result.error) {
                    alert(`Error de GitHub: ${result.error}`);
                    footerMessage.textContent = `Error: ${result.error}`;
                } else if (Array.isArray(result)) {
                    folderItemsList = result;
                    folderTreeRoot = buildFolderTree(folderItemsList);
                    if (folderLeftNameLabel) folderLeftNameLabel.textContent = `GitHub: ${leftUrl.split('/').slice(-2).join('/')}`;
                    if (folderLeftPathLabel) folderLeftPathLabel.textContent = leftUrl;
                    if (folderRightNameLabel) folderRightNameLabel.textContent = `GitHub: ${rightUrl.split('/').slice(-2).join('/')}`;
                    if (folderRightPathLabel) folderRightPathLabel.textContent = rightUrl;
                    processComparisonResults(folderItemsList);
                    footerMessage.textContent = `GitHub comparado: ${folderItemsList.length.toLocaleString()} archivos indexados.`;
                }
            } catch (err) {
                alert(`Error comparando GitHub: ${err.message}`);
            } finally {
                if (unlisten) unlisten();
                if (statusDot) statusDot.className = 'status-indicator ready';
                btnCompareGithub.disabled = false;
                btnCompareGithub.innerHTML = '<i data-lucide="git-compare"></i><span>Comparar GitHub</span>';
                if (window.lucide) lucide.createIcons();
            }
        });
    }
    btnSelectLeftFolder.addEventListener('click', () => selectFolder('left'));
    btnSelectRightFolder.addEventListener('click', () => selectFolder('right'));

    if (boxFolderLeft) {
        boxFolderLeft.addEventListener('click', (e) => {
            if (!e.target.closest('button')) selectFolder('left');
        });
    }
    if (boxFolderRight) {
        boxFolderRight.addEventListener('click', (e) => {
            if (!e.target.closest('button')) selectFolder('right');
        });
    }

    btnSwapSides.addEventListener('click', () => {
        if (currentAppMode === 'folders') {
            swapFolders();
        } else {
            const tempText = leftTextarea.value;
            const tempName = leftFileName.textContent;
            const tempFile = currentLeftFile;

            leftTextarea.value = rightTextarea.value;
            leftFileName.textContent = rightFileName.textContent;
            currentLeftFile = currentRightFile;

            rightTextarea.value = tempText;
            rightFileName.textContent = tempName;
            currentRightFile = tempFile;

            if (currentLeftFile && currentLeftFile.isMedia) {
                showImageComparisonMode(
                    currentLeftFile.dataUrl || currentLeftFile.fileUrl,
                    currentRightFile ? (currentRightFile.dataUrl || currentRightFile.fileUrl) : null
                );
            } else {
                updateDiffView();
            }
            updateToolbarButtonsState();
        }
    });

    btnRecompare.addEventListener('click', () => {
        if (currentAppMode === 'folders') triggerFoldersComparison();
        else updateDiffView();
    });

    // Navegación de Diferencias en Archivos
    function focusDiffLine(direction) {
        if (diffLines.length === 0) return;
        
        if (direction === 'next') {
            currentDiffIndex = (currentDiffIndex + 1) % diffLines.length;
        } else {
            currentDiffIndex = (currentDiffIndex - 1 + diffLines.length) % diffLines.length;
        }

        const lineIdx = diffLines[currentDiffIndex];
        const rowL = leftView.querySelector(`[data-line-index="${lineIdx}"]`);
        const rowR = rightView.querySelector(`[data-line-index="${lineIdx}"]`);

        // Remover foco previo
        document.querySelectorAll('.diff-line.active-diff-focus').forEach(el => el.classList.remove('active-diff-focus'));

        if (rowL) rowL.classList.add('active-diff-focus');
        if (rowR) rowR.classList.add('active-diff-focus');

        const targetRow = rowL || rowR;
        if (targetRow && leftEditorWrapper) {
            const rowTop = targetRow.offsetTop;
            const targetScroll = Math.max(0, rowTop - (leftEditorWrapper.clientHeight / 2));
            leftEditorWrapper.scrollTo({ top: targetScroll, behavior: 'smooth' });
            if (rightEditorWrapper) {
                rightEditorWrapper.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }
        }

        updateDiffCounter();
    }

    btnNextDiff.addEventListener('click', () => focusDiffLine('next'));
    btnPrevDiff.addEventListener('click', () => focusDiffLine('prev'));

    // Ir a la línea exacta de código en el comparador
    function goToExactLine(lineNum) {
        const target = parseInt(lineNum, 10);
        if (!Number.isFinite(target) || target < 1) return;

        const rowL = leftView.querySelector(`[data-line-num="${target}"]`);
        const rowR = rightView.querySelector(`[data-line-num="${target}"]`);
        const targetRow = rowL || rowR;
        if (!targetRow) return;

        const idx = targetRow.dataset.lineIndex;
        const matchedL = leftView.querySelector(`[data-line-index="${idx}"]`);
        const matchedR = rightView.querySelector(`[data-line-index="${idx}"]`);

        document.querySelectorAll('.diff-line.active-goto-focus').forEach(el => el.classList.remove('active-goto-focus'));
        if (matchedL) matchedL.classList.add('active-goto-focus');
        if (matchedR) matchedR.classList.add('active-goto-focus');

        if (leftEditorWrapper) {
            const targetScroll = Math.max(0, targetRow.offsetTop - (leftEditorWrapper.clientHeight / 2));
            leftEditorWrapper.scrollTo({ top: targetScroll, behavior: 'smooth' });
            if (rightEditorWrapper) {
                rightEditorWrapper.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }
        }
    }

    const gotoLineInput = document.getElementById('goto-line-input');
    const btnGotoLine = document.getElementById('btn-goto-line');
    if (btnGotoLine && gotoLineInput) {
        btnGotoLine.addEventListener('click', () => goToExactLine(gotoLineInput.value));
        gotoLineInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                goToExactLine(gotoLineInput.value);
            }
        });
    }
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g' && currentAppMode === 'files' && gotoLineInput) {
            e.preventDefault();
            gotoLineInput.focus();
            gotoLineInput.select();
        }
    });

    // --- MENÚ CONTEXTUAL (SOLO EN MODOS DE CARPETAS/ARCHIVOS, NO EN VISOR 3D) ---
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (currentAppMode === 'models3d' || e.target.closest('#models3d-viewport')) {
            return;
        }
        const side = e.clientX < window.innerWidth / 2 ? 'left' : 'right';
        openContextMenu(e.clientX, e.clientY, side);
    });

    function openContextMenu(x, y, side) {
        currentRightClickTarget = side;
        contextSideTitle.textContent = side === 'left' ? 'Panel Original (Izquierdo)' : 'Panel Modificado (Derecho)';
        ctxCopyLabel.textContent = side === 'left' ? 'Copiar a la derecha →' : '← Copiar a la izquierda';

        const targetPath = side === 'left' ?
            ((selectedFolderItem && selectedFolderItem.leftPath) || (currentLeftFile && currentLeftFile.path)) :
            ((selectedFolderItem && selectedFolderItem.rightPath) || (currentRightFile && currentRightFile.path));

        if (targetPath) {
            ctxSubOriginal.textContent = `Abrir: ${targetPath.split(/[\\/]/).pop()}`;
            ctxSubModified.textContent = `Abrir: ${targetPath.split(/[\\/]/).pop()}`;
        } else {
            ctxSubOriginal.textContent = 'Ejecutar archivo original externo';
            ctxSubModified.textContent = 'Ejecutar archivo modificado externo';
        }

        contextMenu.style.left = `${Math.min(x, window.innerWidth - 310)}px`;
        contextMenu.style.top = `${Math.min(y, window.innerHeight - 380)}px`;
        contextMenu.classList.remove('hidden');
    }

    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) contextMenu.classList.add('hidden');
    });

    ctxOpenSystemOriginal.addEventListener('click', () => {
        contextMenu.classList.add('hidden');
        openOriginalFileAction();
    });

    ctxOpenSystemModified.addEventListener('click', () => {
        contextMenu.classList.add('hidden');
        openModifiedFileAction();
    });

    ctxShowExplorer.addEventListener('click', async () => {
        contextMenu.classList.add('hidden');
        const targetPath = currentRightClickTarget === 'left' ?
            ((selectedFolderItem && selectedFolderItem.leftPath) || (currentLeftFile && currentLeftFile.path)) :
            ((selectedFolderItem && selectedFolderItem.rightPath) || (currentRightFile && currentRightFile.path));

        if (targetPath && isElectron) {
            await window.electronAPI.showInFolder(targetPath);
            footerMessage.textContent = `Mostrando en el Explorador: ${targetPath}`;
        } else {
            alert('No hay un archivo local seleccionado para mostrar en el Explorador.');
        }
    });

    ctxOpenLeft.addEventListener('click', () => {
        contextMenu.classList.add('hidden');
        if (currentAppMode === 'folders') selectFolder('left');
        else openFileForSide('left');
    });

    ctxOpenRight.addEventListener('click', () => {
        contextMenu.classList.add('hidden');
        if (currentAppMode === 'folders') selectFolder('right');
        else openFileForSide('right');
    });

    ctxCopyToOther.addEventListener('click', () => {
        contextMenu.classList.add('hidden');
        if (currentRightClickTarget === 'left') {
            rightTextarea.value = leftTextarea.value;
        } else {
            leftTextarea.value = rightTextarea.value;
        }
        updateDiffView();
    });

    ctxClearSide.addEventListener('click', () => {
        contextMenu.classList.add('hidden');
        if (currentRightClickTarget === 'left') leftTextarea.value = '';
        else rightTextarea.value = '';
        updateDiffView();
    });

    // --- UTILIDADES ---
    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ==========================================================================
    // MODULO DEL VISOR 3D Y PREFABS HYCREATOR (THREE.JS WEBGL ENGINE)
    // ==========================================================================
    let hycreatorModuleInitialized = false;

    // Estado del módulo 3D
    let hycreatorInfo = null;
    let hycreatorDataSource = 'hycreator'; // 'hycreator' vs 'local'
    let hycreatorActiveChannel = 'release'; // 'release' vs 'prerelease'
    let hycreatorActiveCategory = 'Prefabs';
    let hycreatorViewMode = 'tree'; // 'tree' vs 'list' (por defecto en árbol como pidió el usuario)
    let hycreatorSearchTerm = '';
    let hycreatorCurrentPage = 1;
    let hycreatorCatalogItems = [];
    let hycreatorTotalItems = 0;
    let hycreatorSelectedItem = null;
    let hycreatorActiveAsset = null;

    // Estado Three.js
    let threeScene = null;
    let threeCamera = null;
    let threeRenderer = null;
    let threeModelGroup = null;
    let threeGridHelper = null;
    let threeDistance = 35;
    let threeRotation = { theta: Math.PI / 4, phi: Math.PI / 4 };
    let threeCameraTarget = null;
    let threeIsDragging = false;
    let threePrevMouse = { x: 0, y: 0 };
    let threeAutoRotate = false;
    let threeWireframe = false;
    let threeShowGrid = true;
    let threeSceneBg = 'oled';
    let threeAnimFrameId = null;

    // Estado del motor de animaciones 3D (.blockyanim)
    let currentAnimationData = null;
    let isModelAnimPlaying = true;
    let modelAnimSpeed = 1.0;
    let modelAnimCurrentTime = 0;
    let modelAnimLastTimestamp = 0;
    const animatedBonesMap = new Map();

    function initHyCreatorModuleIfNeeded() {
        if (!hycreatorModuleInitialized) {
            hycreatorModuleInitialized = true;
            setupHyCreatorDOM();
            initThreeJsViewport();
            loadHyCreatorInfoAndCatalog();
        } else {
            // Re-render o re-encuadre al volver a la pestaña
            if (threeRenderer && threeCamera && threeScene) {
                const container = document.getElementById('threejs-container');
                if (container && container.clientWidth > 0 && container.clientHeight > 0) {
                    threeCamera.aspect = container.clientWidth / container.clientHeight;
                    threeCamera.updateProjectionMatrix();
                    threeRenderer.setSize(container.clientWidth, container.clientHeight);
                }
            }
        }
    }

    // Paleta de colores determinista para bloques de Hytale
    function getHytaleBlockColor(name) {
        if (!name) return 0x8a5a36;
        const lower = name.toLowerCase();

        // Maderas
        if (lower.includes('oak') || lower.includes('wood') || lower.includes('log') || lower.includes('plank')) {
            if (lower.includes('dark')) return 0x4a3219;
            if (lower.includes('birch')) return 0xd9cbb2;
            if (lower.includes('bark')) return 0x5a3e23;
            return 0x8a5a36;
        }
        // Rocas y piedras
        if (lower.includes('stone') || lower.includes('rock') || lower.includes('cobble') || lower.includes('slate')) {
            if (lower.includes('sandstone')) return 0xd6b77a;
            if (lower.includes('white')) return 0xe2ded4;
            if (lower.includes('black') || lower.includes('basalt')) return 0x22252a;
            if (lower.includes('granite')) return 0x9e6757;
            return 0x7a7e85;
        }
        // Vegetación, flores, fauna marina/terrestre y follaje
        if (lower.includes('flower') || lower.includes('rose') || lower.includes('tulip') || lower.includes('daisy') || lower.includes('blossom')) {
            if (lower.includes('blue')) return 0x4f8ef7;
            if (lower.includes('yellow') || lower.includes('sun') || lower.includes('dandelion')) return 0xf5d033;
            if (lower.includes('purple') || lower.includes('lavender') || lower.includes('lilac')) return 0xa855f7;
            if (lower.includes('white')) return 0xf1f5f9;
            return 0xe65c7a;
        }
        if (lower.includes('coral') || lower.includes('anemone')) {
            if (lower.includes('blue')) return 0x38bdf8;
            if (lower.includes('purple')) return 0xc084fc;
            if (lower.includes('yellow')) return 0xfacc15;
            return 0xf472b6;
        }
        if (lower.includes('mushroom') || lower.includes('fungi') || lower.includes('shroom')) {
            if (lower.includes('glow') || lower.includes('blue')) return 0x38bdf8;
            if (lower.includes('red')) return 0xd9463e;
            return 0xc29b6c;
        }
        if (lower.includes('leaf') || lower.includes('leaves') || lower.includes('foliage') || lower.includes('vine') ||
            lower.includes('grass') || lower.includes('plant') || lower.includes('fern') || lower.includes('bush') ||
            lower.includes('moss') || lower.includes('kelp') || lower.includes('seaweed') || lower.includes('reed') ||
            lower.includes('crop') || lower.includes('cact') || lower.includes('fauna')) {
            if (lower.includes('autumn') || lower.includes('orange')) return 0xd97724;
            if (lower.includes('red') || lower.includes('maple')) return 0xc2412d;
            if (lower.includes('yellow') || lower.includes('golden')) return 0xd4a72c;
            if (lower.includes('sakura') || lower.includes('pink')) return 0xf4a5c4;
            if (lower.includes('pine') || lower.includes('spruce') || lower.includes('fir')) return 0x2a5432;
            if (lower.includes('jungle') || lower.includes('fern') || lower.includes('vine')) return 0x3c8f3a;
            if (lower.includes('kelp') || lower.includes('seaweed')) return 0x2f7a57;
            if (lower.includes('dry') || lower.includes('savanna')) return 0x8f8a43;
            return 0x4d943c;
        }
        // Lana y tela
        if (lower.includes('cloth') || lower.includes('wool')) {
            if (lower.includes('white')) return 0xefede6;
            if (lower.includes('gray') || lower.includes('grey')) return 0x6e7379;
            if (lower.includes('black')) return 0x1f2022;
            if (lower.includes('red')) return 0xb02e26;
            if (lower.includes('blue')) return 0x3c44aa;
            if (lower.includes('green')) return 0x5e7c16;
            if (lower.includes('yellow')) return 0xfed83d;
            if (lower.includes('purple')) return 0x8932b8;
            if (lower.includes('cyan')) return 0x169c9c;
            if (lower.includes('orange')) return 0xf9801d;
            return 0xc7c3b9;
        }
        // Metales y minerales
        if (lower.includes('gold')) return 0xf4c430;
        if (lower.includes('iron') || lower.includes('steel') || lower.includes('metal')) return 0x9ea1a5;
        if (lower.includes('copper')) return 0xc16a44;
        if (lower.includes('diamond') || lower.includes('crystal') || lower.includes('gem')) return 0x4deeea;
        if (lower.includes('coal')) return 0x2b2b2b;
        // Líquidos y elementos
        if (lower.includes('water')) return 0x2e6fbb;
        if (lower.includes('lava') || lower.includes('fire')) return 0xd34714;
        if (lower.includes('ice') || lower.includes('snow')) return 0xe8f4f8;
        if (lower.includes('glass')) return 0xaad5df;
        if (lower.includes('sand') || lower.includes('dirt')) return 0xbf9b68;
        if (lower.includes('brick')) return 0x934b3e;

        // Hash determinista para colores consistentes
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return (hash & 0x00ffffff);
    }

    // Configurar listeners DOM de la sección 3D
    function setupHyCreatorDOM() {
        const btnSourceHycreator = document.getElementById('btn-source-hycreator');
        const btnSourceLocal = document.getElementById('btn-source-local');
        const searchInput = document.getElementById('models3d-search-input');
        const catPills = document.querySelectorAll('.cat-pill');
        const btnPagePrev = document.getElementById('btn-page-prev');
        const btnPageNext = document.getElementById('btn-page-next');

        const btn3dRotate = document.getElementById('btn-3d-rotate');
        const btn3dGrid = document.getElementById('btn-3d-grid');
        const btn3dWireframe = document.getElementById('btn-3d-wireframe');
        const btn3dResetCam = document.getElementById('btn-3d-reset-cam');

        const bgDots = document.querySelectorAll('.bg-dot');
        const btnViewJson = document.getElementById('btn-view-json');
        const btnCloseJsonModal = document.getElementById('btn-close-json-modal');
        const btnCopyJson = document.getElementById('btn-copy-json');
        const modalJson = document.getElementById('modal-json-viewer');

        // Selector de Fuente
        btnSourceHycreator.addEventListener('click', () => {
            btnSourceHycreator.classList.add('active');
            btnSourceLocal.classList.remove('active');
            hycreatorDataSource = 'hycreator';
            hycreatorCurrentPage = 1;
            fetchCatalogItems();
        });

        btnSourceLocal.addEventListener('click', () => {
            btnSourceLocal.classList.add('active');
            btnSourceHycreator.classList.remove('active');
            hycreatorDataSource = 'local';
            hycreatorCurrentPage = 1;
            fetchCatalogItems();
        });

        // Selector de Canales Vanilla (Release 0.7.5 vs Pre-release 0.8.0)
        const btnChannelRelease = document.getElementById('btn-channel-release');
        const btnChannelPrerelease = document.getElementById('btn-channel-prerelease');

        if (btnChannelRelease) {
            btnChannelRelease.addEventListener('click', () => {
                if (hycreatorActiveChannel === 'release') return;
                hycreatorActiveChannel = 'release';
                btnChannelRelease.classList.add('active');
                if (btnChannelPrerelease) btnChannelPrerelease.classList.remove('active');
                hycreatorCurrentPage = 1;
                fetchCatalogItems();
                showToast3D('Cargando modelos de Hytale Release (0.7.5) 🟢', true);
            });
        }

        if (btnChannelPrerelease) {
            btnChannelPrerelease.addEventListener('click', () => {
                if (hycreatorActiveChannel === 'prerelease') return;
                hycreatorActiveChannel = 'prerelease';
                btnChannelPrerelease.classList.add('active');
                if (btnChannelRelease) btnChannelRelease.classList.remove('active');
                hycreatorCurrentPage = 1;
                fetchCatalogItems();
                showToast3D('Cargando modelos de Hytale Pre-release (0.8.0) 🟣', true);
            });
        }

        // Buscador reactivo con debounce
        let searchTimeout = null;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                hycreatorSearchTerm = e.target.value.trim();
                hycreatorCurrentPage = 1;
                fetchCatalogItems();
            }, 300);
        });

        // Categorías
        catPills.forEach(pill => {
            pill.addEventListener('click', () => {
                catPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                hycreatorActiveCategory = pill.getAttribute('data-cat') || 'Todos';
                hycreatorCurrentPage = 1;
                fetchCatalogItems();
            });
        });

        // Alternar vista: Árbol de Carpetas vs Lista Plana
        const btn3dCollapseAll = document.getElementById('btn-3d-collapse-all');
        const btn3dViewTree = document.getElementById('btn-3d-view-tree');
        const btn3dViewList = document.getElementById('btn-3d-view-list');
        if (btn3dCollapseAll) {
            btn3dCollapseAll.addEventListener('click', () => {
                const listContainer = document.getElementById('models3d-item-list');
                if (!listContainer) return;
                listContainer.querySelectorAll('.tree-node-folder.expanded').forEach(el => el.classList.remove('expanded'));
                listContainer.querySelectorAll('.tree-children:not(.collapsed)').forEach(el => el.classList.add('collapsed'));
            });
        }
        if (btn3dViewTree && btn3dViewList) {
            btn3dViewTree.addEventListener('click', () => {
                if (hycreatorViewMode === 'tree') return;
                hycreatorViewMode = 'tree';
                btn3dViewTree.classList.add('active');
                btn3dViewList.classList.remove('active');
                if (btn3dCollapseAll) btn3dCollapseAll.classList.remove('hidden');
                fetchCatalogItems();
            });
            btn3dViewList.addEventListener('click', () => {
                if (hycreatorViewMode === 'list') return;
                hycreatorViewMode = 'list';
                btn3dViewList.classList.add('active');
                btn3dViewTree.classList.remove('active');
                if (btn3dCollapseAll) btn3dCollapseAll.classList.add('hidden');
                hycreatorCurrentPage = 1;
                fetchCatalogItems();
            });
        }

        // Paginación
        btnPagePrev.addEventListener('click', () => {
            if (hycreatorCurrentPage > 1) {
                hycreatorCurrentPage--;
                fetchCatalogItems();
            }
        });

        btnPageNext.addEventListener('click', () => {
            if (hycreatorCurrentPage * 40 < hycreatorTotalItems) {
                hycreatorCurrentPage++;
                fetchCatalogItems();
            }
        });

        // Controles de Viewport 3D
        btn3dRotate.addEventListener('click', () => {
            threeAutoRotate = !threeAutoRotate;
            btn3dRotate.classList.toggle('active', threeAutoRotate);
        });

        btn3dGrid.addEventListener('click', () => {
            threeShowGrid = !threeShowGrid;
            btn3dGrid.classList.toggle('active', threeShowGrid);
            if (threeGridHelper) threeGridHelper.visible = threeShowGrid;
        });

        btn3dWireframe.addEventListener('click', () => {
            threeWireframe = !threeWireframe;
            btn3dWireframe.classList.toggle('active', threeWireframe);
            updateWireframeInScene();
        });

        btn3dResetCam.addEventListener('click', () => {
            resetCameraView();
        });

        // Fondos
        bgDots.forEach(dot => {
            dot.addEventListener('click', () => {
                bgDots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                threeSceneBg = dot.getAttribute('data-bg') || 'oled';
                updateSceneBackground();
            });
        });

        // Botón superior: Copiar imagen SIN FONDO
        const btnCopyImg = document.getElementById('btn-3d-copy-image');
        if (btnCopyImg) {
            btnCopyImg.addEventListener('click', () => {
                copy3dImageWithoutBackground();
            });
        }

        // Botón superior: Guardar imagen PNG SIN FONDO
        const btnSaveImg = document.getElementById('btn-3d-save-image');
        if (btnSaveImg) {
            btnSaveImg.addEventListener('click', () => {
                save3dImageWithoutBackground();
            });
        }

        // Botón superior: Abrir archivo 3D manualmente desde disco
        const btnOpenCustom = document.getElementById('btn-open-custom-3d');
        const inputCustomFile = document.getElementById('input-custom-3d-file');
        if (btnOpenCustom) {
            btnOpenCustom.addEventListener('click', async () => {
                if (isElectron && window.electronAPI.openDialog) {
                    try {
                        const fileRes = await window.electronAPI.openDialog({
                            mode: 'file',
                            title: 'Seleccionar Modelo o Prefab 3D (.prefab.json, .blockymodel, .json)'
                        });
                        if (fileRes && fileRes.path) {
                            loadCustom3dFile(fileRes);
                        }
                    } catch (e) {
                        if (inputCustomFile) inputCustomFile.click();
                    }
                } else if (inputCustomFile) {
                    inputCustomFile.click();
                }
            });
        }

        if (inputCustomFile) {
            inputCustomFile.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        loadCustom3dFile({
                            name: file.name,
                            path: file.name,
                            content: event.target.result,
                            size: file.size
                        });
                    };
                    reader.readAsText(file);
                }
            });
        }

        // Controles de Reproducción de Animaciones 3D (.blockyanim)
        const btnAnimPlay = document.getElementById('btn-anim-play');
        const selectAnim = document.getElementById('select-model-anim');
        const btnAnimSpeed = document.getElementById('btn-anim-speed');

        if (btnAnimPlay) {
            btnAnimPlay.addEventListener('click', () => {
                isModelAnimPlaying = !isModelAnimPlaying;
                btnAnimPlay.classList.toggle('active', isModelAnimPlaying);
                btnAnimPlay.title = isModelAnimPlaying ? 'Pausar animación' : 'Reproducir animación';
                const icon = btnAnimPlay.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', isModelAnimPlaying ? 'pause' : 'play');
                    if (window.lucide) lucide.createIcons();
                }
            });
        }

        if (btnAnimSpeed) {
            btnAnimSpeed.addEventListener('click', () => {
                if (modelAnimSpeed === 1.0) modelAnimSpeed = 0.5;
                else if (modelAnimSpeed === 0.5) modelAnimSpeed = 2.0;
                else modelAnimSpeed = 1.0;
                btnAnimSpeed.textContent = `${modelAnimSpeed}x`;
            });
        }

        if (selectAnim) {
            selectAnim.addEventListener('change', async (e) => {
                const selectedPath = e.target.value;
                resetModelAnimationBones();
                if (!selectedPath) {
                    currentAnimationData = null;
                    return;
                }
                try {
                    const chObj = hycreatorInfo?.channels && hycreatorInfo.channels[hycreatorActiveChannel];
                    const workingDir = hycreatorDataSource === 'local' ? (leftFolderPath || rightFolderPath || '') : null;
                    const animData = await window.electronAPI.hycreatorReadAsset({
                        relPath: selectedPath,
                        channel: hycreatorActiveChannel,
                        assetsZipOverride: chObj ? chObj.zipPath : null,
                        workingFolder: workingDir
                    });
                    if (animData && animData.content) {
                        currentAnimationData = JSON.parse(animData.content);
                        modelAnimCurrentTime = 0;
                        modelAnimLastTimestamp = 0;
                        isModelAnimPlaying = true;
                        if (btnAnimPlay) {
                            btnAnimPlay.classList.add('active');
                            const icon = btnAnimPlay.querySelector('i');
                            if (icon) icon.setAttribute('data-lucide', 'pause');
                            if (window.lucide) lucide.createIcons();
                        }
                    }
                } catch (err) {
                    console.warn('[HyCreator] Error cargando animación seleccionada:', err);
                }
            });
        }

        // Menú Contextual 3D (Clic Derecho)
        const ctxMenu3d = document.getElementById('context-menu-3d');
        const ctxCopyTrans = document.getElementById('ctx-3d-copy-transparent');
        const ctxSaveTrans = document.getElementById('ctx-3d-save-transparent');
        const ctxResetCam = document.getElementById('ctx-3d-reset-camera');
        const ctxViewCode = document.getElementById('ctx-3d-view-code');

        if (ctxCopyTrans) {
            ctxCopyTrans.addEventListener('click', () => {
                if (ctxMenu3d) ctxMenu3d.classList.add('hidden');
                copy3dImageWithoutBackground();
            });
        }

        if (ctxSaveTrans) {
            ctxSaveTrans.addEventListener('click', () => {
                if (ctxMenu3d) ctxMenu3d.classList.add('hidden');
                save3dImageWithoutBackground();
            });
        }

        if (ctxResetCam) {
            ctxResetCam.addEventListener('click', () => {
                if (ctxMenu3d) ctxMenu3d.classList.add('hidden');
                resetCameraView();
            });
        }

        if (ctxViewCode) {
            ctxViewCode.addEventListener('click', () => {
                if (ctxMenu3d) ctxMenu3d.classList.add('hidden');
                if (btnViewJson) btnViewJson.click();
            });
        }

        // Cerrar menú contextual 3D al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (ctxMenu3d && !ctxMenu3d.contains(e.target)) {
                ctxMenu3d.classList.add('hidden');
            }
        });

        // Configurar Drag & Drop sobre el canvas 3D
        setup3dDragAndDrop();

        // Modal JSON
        if (btnViewJson) {
            btnViewJson.addEventListener('click', () => {
                if (!hycreatorActiveAsset) return;
                document.getElementById('modal-json-filename').textContent = hycreatorSelectedItem ? hycreatorSelectedItem.name : 'modelo.json';
                document.getElementById('modal-json-content').textContent = hycreatorActiveAsset.content;
                modalJson.classList.remove('hidden');
                if (window.lucide) lucide.createIcons();
            });
        }

        if (btnCloseJsonModal) {
            btnCloseJsonModal.addEventListener('click', () => {
                modalJson.classList.add('hidden');
            });
        }

        if (btnCopyJson) {
            btnCopyJson.addEventListener('click', async () => {
                if (!hycreatorActiveAsset) return;
                try {
                    await navigator.clipboard.writeText(hycreatorActiveAsset.content);
                    const label = document.getElementById('label-copy-json');
                    label.textContent = '¡Copiado!';
                    setTimeout(() => { label.textContent = 'Copiar'; }, 2000);
                } catch (e) {}
            });
        }
    }

    // Inicializar Three.js
    function initThreeJsViewport() {
        const container = document.getElementById('threejs-container');
        if (!container || !window.THREE) {
            console.warn('[HyCreator 3D] Three.js no está cargado todavía en window.THREE');
            return;
        }

        const width = container.clientWidth || 600;
        const height = container.clientHeight || 400;

        threeScene = new THREE.Scene();
        updateSceneBackground();

        threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
        threeCameraTarget = new THREE.Vector3(0, 0, 0);

        threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
        threeRenderer.setSize(width, height);
        threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        threeRenderer.shadowMap.enabled = true;

        container.appendChild(threeRenderer.domElement);

        // Iluminación
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        threeScene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight1.position.set(40, 60, 40);
        threeScene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0x7fb5ff, 0.5);
        dirLight2.position.set(-30, 20, -30);
        threeScene.add(dirLight2);

        // Grid
        threeGridHelper = new THREE.GridHelper(60, 60, 0x4f46e5, 0x1e293b);
        threeScene.add(threeGridHelper);

        // Grupo contenedor del objeto 3D activo
        threeModelGroup = new THREE.Group();
        threeScene.add(threeModelGroup);

        // Caja de resaltado para bloque seleccionado en prefabs
        const selFillGeo = new THREE.BoxGeometry(1.03, 1.03, 1.03);
        const selFillMat = new THREE.MeshBasicMaterial({
            color: 0x22d3ee,
            transparent: true,
            opacity: 0.18,
            depthWrite: false
        });
        const threeSelectionBox = new THREE.Mesh(selFillGeo, selFillMat);
        const selEdges = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(1.04, 1.04, 1.04)),
            new THREE.LineBasicMaterial({ color: 0x22d3ee })
        );
        threeSelectionBox.add(selEdges);
        threeSelectionBox.visible = false;
        threeSelectionBox.renderOrder = 999;
        threeScene.add(threeSelectionBox);
        window._hyThreeSelectionBox = threeSelectionBox;

        const selBadge = document.getElementById('selected-block-badge');
        const selBlockIdEl = document.getElementById('sel-block-id');
        const selBlockMetaEl = document.getElementById('sel-block-meta');
        const btnCopyBlockId = document.getElementById('btn-copy-block-id');
        const btnClearBlockSel = document.getElementById('btn-clear-block-sel');
        const cardSelectedBlock = document.getElementById('card-selected-block');
        const detSelBlockName = document.getElementById('det-sel-block-name');
        const detSelBlockId = document.getElementById('det-sel-block-id');
        const detSelBlockCoords = document.getElementById('det-sel-block-coords');
        const detSelBlockRot = document.getElementById('det-sel-block-rot');
        const btnDetCopyBlockId = document.getElementById('btn-det-copy-block-id');

        function clearBlockSelection() {
            threeSelectionBox.visible = false;
            if (selBadge) selBadge.classList.add('hidden');
            if (cardSelectedBlock) cardSelectedBlock.classList.add('hidden');
        }
        window._hyClearBlockSelection = clearBlockSelection;

        if (btnClearBlockSel) {
            btnClearBlockSel.addEventListener('click', (e) => {
                e.stopPropagation();
                clearBlockSelection();
            });
        }
        const copyBlockIdAction = async (e, btnEl) => {
            e.stopPropagation();
            const txt = (detSelBlockId && detSelBlockId.textContent !== '-' ? detSelBlockId.textContent : '') || (selBlockIdEl ? selBlockIdEl.textContent : '');
            if (!txt) return;
            try {
                await navigator.clipboard.writeText(txt);
                if (btnEl) {
                    btnEl.title = '¡Copiado!';
                    setTimeout(() => { btnEl.title = 'Copiar ID del bloque'; }, 1500);
                }
            } catch (_) {}
        };
        if (btnCopyBlockId) btnCopyBlockId.addEventListener('click', (e) => copyBlockIdAction(e, btnCopyBlockId));
        if (btnDetCopyBlockId) btnDetCopyBlockId.addEventListener('click', (e) => copyBlockIdAction(e, btnDetCopyBlockId));

        updateCameraPosition();

        // Control de mouse / drag
        const dom = threeRenderer.domElement;
        const raycaster = new THREE.Raycaster();
        const pointerNDC = new THREE.Vector2();

        let rightClickDownPos = { x: 0, y: 0 };
        let rightClickMoved = false;
        let leftClickDownPos = { x: 0, y: 0 };

        dom.addEventListener('mousedown', (e) => {
            threeIsDragging = true;
            threePrevMouse = { x: e.clientX, y: e.clientY };
            if (e.button === 0) {
                leftClickDownPos = { x: e.clientX, y: e.clientY };
            } else if (e.button === 2) {
                rightClickDownPos = { x: e.clientX, y: e.clientY };
                rightClickMoved = false;
            }
        });

        dom.addEventListener('mouseup', (e) => {
            if (e.button !== 0 || !threeModelGroup || threeModelGroup.children.length === 0) return;
            const moveDist = Math.hypot(e.clientX - leftClickDownPos.x, e.clientY - leftClickDownPos.y);
            if (moveDist > 5) return; // Fue un arrastre de cámara, no un clic de selección

            const rect = dom.getBoundingClientRect();
            pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(pointerNDC, threeCamera);
            const hits = raycaster.intersectObjects(threeModelGroup.children, true);

            let picked = null;
            for (const hit of hits) {
                const obj = hit.object;
                if (obj.isInstancedMesh && obj.userData && obj.userData.blockName && hit.instanceId !== undefined) {
                    const b = obj.userData.blockList[hit.instanceId];
                    if (b) {
                        picked = { blockName: obj.userData.blockName, block: b, center: obj.userData.prefabCenter };
                        break;
                    }
                }
                let cur = obj;
                while (cur && cur !== threeModelGroup) {
                    if (cur.userData && cur.userData.blockName && cur.userData.blockData) {
                        picked = { blockName: cur.userData.blockName, block: cur.userData.blockData, center: cur.userData.prefabCenter };
                        break;
                    }
                    cur = cur.parent;
                }
                if (picked) break;
            }

            if (picked && picked.center) {
                const { blockName, block: b, center } = picked;
                threeSelectionBox.position.set(b.x - center.centerX, b.y - center.baseY + 0.5, b.z - center.centerZ);
                threeSelectionBox.visible = true;
                const friendlyName = blockName.replace(/_/g, ' ');
                const rotVal = (typeof b.rotation === 'number') ? b.rotation : 0;
                if (selBlockIdEl) selBlockIdEl.textContent = `${friendlyName} (${blockName})`;
                if (selBlockMetaEl) {
                    const rotStr = rotVal !== 0 ? ` · Rot: ${rotVal}` : '';
                    selBlockMetaEl.textContent = `ID: ${blockName} · X: ${b.x}, Y: ${b.y}, Z: ${b.z}${rotStr}`;
                }
                if (selBadge) selBadge.classList.remove('hidden');

                if (detSelBlockName) detSelBlockName.textContent = friendlyName;
                if (detSelBlockId) detSelBlockId.textContent = blockName;
                if (detSelBlockCoords) detSelBlockCoords.textContent = `${b.x}, ${b.y}, ${b.z}`;
                if (detSelBlockRot) detSelBlockRot.textContent = String(rotVal);
                if (cardSelectedBlock) cardSelectedBlock.classList.remove('hidden');
            } else {
                clearBlockSelection();
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!threeIsDragging) return;
            const dx = e.clientX - threePrevMouse.x;
            const dy = e.clientY - threePrevMouse.y;
            threePrevMouse = { x: e.clientX, y: e.clientY };

            if (e.buttons === 1) {
                // Rotar
                threeRotation.theta -= dx * 0.008;
                threeRotation.phi = Math.max(0.05, Math.min(Math.PI - 0.05, threeRotation.phi - dy * 0.008));
                updateCameraPosition();
            } else if (e.buttons === 2 || e.shiftKey) {
                // Desplazar (Pan)
                const distFromDown = Math.hypot(e.clientX - rightClickDownPos.x, e.clientY - rightClickDownPos.y);
                if (distFromDown > 4) rightClickMoved = true;

                const panSpeed = threeDistance * 0.0015;
                const forward = new THREE.Vector3().subVectors(threeCameraTarget, threeCamera.position).normalize();
                const right = new THREE.Vector3().crossVectors(forward, threeCamera.up).normalize();
                const up = new THREE.Vector3().crossVectors(right, forward).normalize();

                threeCameraTarget.addScaledVector(right, -dx * panSpeed);
                threeCameraTarget.addScaledVector(up, dy * panSpeed);
                updateCameraPosition();
            }
        });

        window.addEventListener('mouseup', (e) => {
            threeIsDragging = false;
        });

        dom.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            // Si no se arrastró el ratón durante el clic derecho, abrir menú contextual
            if (!rightClickMoved) {
                show3dContextMenu(e.clientX, e.clientY);
            }
        });

        dom.addEventListener('wheel', (e) => {
            e.preventDefault();
            threeDistance = Math.max(2, Math.min(300, threeDistance + e.deltaY * 0.05));
            updateCameraPosition();
        }, { passive: false });

        
        // Resize Observer
        const resizeObs = new ResizeObserver(() => {
            if (!container || !threeCamera || !threeRenderer) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            if (w === 0 || h === 0) return;
            threeCamera.aspect = w / h;
            threeCamera.updateProjectionMatrix();
            threeRenderer.setSize(w, h);
        });
        resizeObs.observe(container);

        // Bucle de renderizado y animación
        function animate() {
            threeAnimFrameId = requestAnimationFrame(animate);
            if (threeAutoRotate && !threeIsDragging) {
                threeRotation.theta += 0.008;
                updateCameraPosition();
            }
            // Actualizar animación de huesos (.blockyanim) si está activa
            updateModelAnimation();
            threeRenderer.render(threeScene, threeCamera);
        }
        animate();
    }

    // --- MOTOR DE ANIMACIONES 3D HYTALE (.blockyanim) ---
    function sampleVectorKeyframes(keyframes, frame, duration, holdLast = false) {
        if (!keyframes || keyframes.length === 0) return null;
        if (keyframes.length === 1) return keyframes[0].delta || { x: 0, y: 0, z: 0 };

        const sorted = keyframes.slice().sort((a, b) => a.time - b.time);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        if (frame <= first.time) return first.delta || { x: 0, y: 0, z: 0 };
        if (frame >= last.time) {
            if (holdLast) return last.delta || { x: 0, y: 0, z: 0 };
            const t = (frame - last.time) / Math.max(0.001, (duration - last.time + first.time));
            const tSmooth = t * t * (3 - 2 * t);
            const d0 = last.delta || { x: 0, y: 0, z: 0 };
            const d1 = first.delta || { x: 0, y: 0, z: 0 };
            return {
                x: d0.x + (d1.x - d0.x) * tSmooth,
                y: d0.y + (d1.y - d0.y) * tSmooth,
                z: d0.z + (d1.z - d0.z) * tSmooth
            };
        }

        for (let i = 0; i < sorted.length - 1; i++) {
            const k0 = sorted[i];
            const k1 = sorted[i + 1];
            if (frame >= k0.time && frame <= k1.time) {
                const span = Math.max(0.001, k1.time - k0.time);
                let t = (frame - k0.time) / span;
                if (k0.interpolationType === 'smooth' || !k0.interpolationType) {
                    t = t * t * (3 - 2 * t);
                } else if (k0.interpolationType === 'step') {
                    t = 0;
                }
                const d0 = k0.delta || { x: 0, y: 0, z: 0 };
                const d1 = k1.delta || { x: 0, y: 0, z: 0 };
                return {
                    x: d0.x + (d1.x - d0.x) * t,
                    y: d0.y + (d1.y - d0.y) * t,
                    z: d0.z + (d1.z - d0.z) * t
                };
            }
        }
        return last.delta || { x: 0, y: 0, z: 0 };
    }

    function sampleQuaternionKeyframes(keyframes, frame, duration, holdLast = false) {
        if (!keyframes || keyframes.length === 0 || !window.THREE) return null;
        const toQuat = (d) => new THREE.Quaternion(d?.x || 0, d?.y || 0, d?.z || 0, d?.w !== undefined ? d.w : 1);

        if (keyframes.length === 1) return toQuat(keyframes[0].delta);

        const sorted = keyframes.slice().sort((a, b) => a.time - b.time);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        if (frame <= first.time) return toQuat(first.delta);
        if (frame >= last.time) {
            if (holdLast) return toQuat(last.delta);
            const q0 = toQuat(last.delta);
            const q1 = toQuat(first.delta);
            const t = (frame - last.time) / Math.max(0.001, (duration - last.time + first.time));
            const tSmooth = t * t * (3 - 2 * t);
            return q0.slerp(q1, tSmooth);
        }

        for (let i = 0; i < sorted.length - 1; i++) {
            const k0 = sorted[i];
            const k1 = sorted[i + 1];
            if (frame >= k0.time && frame <= k1.time) {
                const span = Math.max(0.001, k1.time - k0.time);
                let t = (frame - k0.time) / span;
                if (k0.interpolationType === 'smooth' || !k0.interpolationType) {
                    t = t * t * (3 - 2 * t);
                } else if (k0.interpolationType === 'step') {
                    t = 0;
                }
                const q0 = toQuat(k0.delta);
                const q1 = toQuat(k1.delta);
                return q0.slerp(q1, t);
            }
        }
        return toQuat(last.delta);
    }

    function updateModelAnimation() {
        if (!currentAnimationData || !window.THREE || animatedBonesMap.size === 0) return;
        const now = performance.now();
        if (!modelAnimLastTimestamp) modelAnimLastTimestamp = now;
        const deltaSeconds = (now - modelAnimLastTimestamp) / 1000;
        modelAnimLastTimestamp = now;

        if (!isModelAnimPlaying) return;

        const durationFrames = currentAnimationData.duration || 60;
        const animSpeed = (currentAnimationData.speed || 1.0) * modelAnimSpeed;
        modelAnimCurrentTime += deltaSeconds * animSpeed;

        const currentFrame = (modelAnimCurrentTime * 60) % durationFrames;
        const holdLast = currentAnimationData.holdLastKeyframe === true;

        const nodeAnims = currentAnimationData.nodeAnimations || currentAnimationData.bones || {};

        for (const [boneName, animNode] of Object.entries(nodeAnims)) {
            let boneObj = animatedBonesMap.get(boneName);
            if (!boneObj) {
                const boneLower = boneName.toLowerCase();
                for (const [k, v] of animatedBonesMap) {
                    if (k.toLowerCase() === boneLower) { boneObj = v; break; }
                }
            }
            if (!boneObj || !boneObj.userData) continue;

            const restPos = boneObj.userData.restPosition;
            const restQuat = boneObj.userData.restQuaternion;

            if (animNode.position && animNode.position.length > 0 && restPos) {
                const deltaPos = sampleVectorKeyframes(animNode.position, currentFrame, durationFrames, holdLast);
                if (deltaPos) {
                    boneObj.position.set(
                        restPos.x + deltaPos.x,
                        restPos.y + deltaPos.y,
                        restPos.z + deltaPos.z
                    );
                }
            }

            if (animNode.orientation && animNode.orientation.length > 0 && restQuat) {
                const deltaQuat = sampleQuaternionKeyframes(animNode.orientation, currentFrame, durationFrames, holdLast);
                if (deltaQuat) {
                    boneObj.quaternion.copy(restQuat).multiply(deltaQuat);
                }
            }
        }
    }

    function resetModelAnimationBones() {
        for (const boneObj of animatedBonesMap.values()) {
            if (boneObj && boneObj.userData) {
                if (boneObj.userData.restPosition) boneObj.position.copy(boneObj.userData.restPosition);
                if (boneObj.userData.restQuaternion) boneObj.quaternion.copy(boneObj.userData.restQuaternion);
            }
        }
    }

    function updateCameraPosition() {
        if (!threeCamera || !threeCameraTarget) return;
        const x = threeCameraTarget.x + threeDistance * Math.sin(threeRotation.phi) * Math.sin(threeRotation.theta);
        const y = threeCameraTarget.y + threeDistance * Math.cos(threeRotation.phi);
        const z = threeCameraTarget.z + threeDistance * Math.sin(threeRotation.phi) * Math.cos(threeRotation.theta);
        threeCamera.position.set(x, y, z);
        threeCamera.lookAt(threeCameraTarget);
    }

    function updateSceneBackground() {
        if (!threeScene || !window.THREE) return;
        switch (threeSceneBg) {
            case 'oled': threeScene.background = new THREE.Color(0x05070d); break;
            case 'studio': threeScene.background = new THREE.Color(0x131927); break;
            case 'sky': threeScene.background = new THREE.Color(0x7ca9d8); break;
            case 'grid': threeScene.background = new THREE.Color(0x0e1726); break;
        }
    }

    function updateWireframeInScene() {
        if (!threeModelGroup) return;
        threeModelGroup.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => { m.wireframe = threeWireframe; });
                } else {
                    child.material.wireframe = threeWireframe;
                }
            }
        });
    }

    function resetCameraView(sizeX = 10, sizeY = 10, sizeZ = 10) {
        if (!threeCameraTarget) return;
        const maxDim = Math.max(sizeX, sizeY, sizeZ, 4);
        threeDistance = maxDim * 1.8;
        threeRotation.theta = Math.PI / 4;
        threeRotation.phi = Math.PI / 3;
        threeCameraTarget.set(0, sizeY / 2, 0);
        updateCameraPosition();
    }

    function clearThreeGroup(group) {
        if (!group) return;
        if (window._hyClearBlockSelection) window._hyClearBlockSelection();
        animatedBonesMap.clear();
        currentAnimationData = null;
        group.traverse((child) => {
            if (child.isMesh) {
                child.geometry?.dispose();
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material?.dispose();
            }
        });
        while (group.children.length > 0) {
            group.remove(group.children[0]);
        }
    }

    // Cargar información inicial y catálogo
    async function loadHyCreatorInfoAndCatalog() {
        const spinner = document.getElementById('models3d-loading-spinner');
        if (spinner) spinner.classList.remove('hidden');

        try {
            if (isElectron && window.electronAPI.hycreatorGetInfo) {
                hycreatorInfo = await window.electronAPI.hycreatorGetInfo();
                if (hycreatorInfo && hycreatorInfo.active_channel) {
                    hycreatorActiveChannel = hycreatorInfo.active_channel;
                    const btnRel = document.getElementById('btn-channel-release');
                    const btnPre = document.getElementById('btn-channel-prerelease');
                    if (btnRel && btnPre) {
                        if (hycreatorActiveChannel === 'prerelease') {
                            btnPre.classList.add('active');
                            btnRel.classList.remove('active');
                        } else {
                            btnRel.classList.add('active');
                            btnPre.classList.remove('active');
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('[HyCreator] Error obteniendo info:', err);
        } finally {
            if (spinner) spinner.classList.add('hidden');
        }

        await fetchCatalogItems();
    }

    // Consultar items según filtros, origen y modo de visualización (Árbol vs Lista)
    async function fetchCatalogItems() {
        const spinner = document.getElementById('models3d-loading-spinner');
        const countLabel = document.getElementById('models3d-count-label');
        const itemList = document.getElementById('models3d-item-list');
        const pageIndicator = document.getElementById('models3d-page-indicator');
        const btnPrev = document.getElementById('btn-page-prev');
        const btnNext = document.getElementById('btn-page-next');
        const paginationWrap = document.querySelector('.models3d-pagination');

        if (spinner) spinner.classList.remove('hidden');

        try {
            if (hycreatorViewMode === 'tree' && hycreatorDataSource === 'hycreator' && isElectron && window.electronAPI.hycreatorGetCatalogTree) {
                // MODO ÁRBOL DE CARPETAS (Sin paginación, navegación jerárquica fluida)
                if (paginationWrap) paginationWrap.style.display = 'none';

                const kindParam = hycreatorActiveCategory === 'Todos' ? '' : hycreatorActiveCategory;
                const chObj = hycreatorInfo?.channels && hycreatorInfo.channels[hycreatorActiveChannel];
                const res = await window.electronAPI.hycreatorGetCatalogTree({
                    channel: hycreatorActiveChannel,
                    scanFile: chObj ? chObj.scanPath : (hycreatorInfo?.active_scan_path || null),
                    filterKind: kindParam || null,
                    searchTerm: hycreatorSearchTerm || null
                });

                hycreatorTotalItems = res.total || 0;
                countLabel.textContent = `${hycreatorTotalItems.toLocaleString()} elementos`;
                renderCatalogTree(itemList, res.tree || []);

                // Auto-seleccionar primer elemento si no hay ninguno seleccionado
                if (!hycreatorSelectedItem && res.tree && res.tree.length > 0) {
                    function findFirstFile(nodes) {
                        for (const n of nodes) {
                            if (!n.isFolder) return n;
                            if (n.children && n.children.length > 0) {
                                const found = findFirstFile(n.children);
                                if (found) return found;
                            }
                        }
                        return null;
                    }
                    const first = findFirstFile(res.tree);
                    if (first) selectItem(first);
                }

            } else {
                // MODO LISTA PLANA CON PAGINACIÓN
                if (paginationWrap) paginationWrap.style.display = 'flex';

                if (hycreatorDataSource === 'hycreator') {
                    if (isElectron && window.electronAPI.hycreatorGetCatalogItems) {
                        const kindParam = hycreatorActiveCategory === 'Todos' ? '' : hycreatorActiveCategory;
                        const chObj = hycreatorInfo?.channels && hycreatorInfo.channels[hycreatorActiveChannel];
                        const res = await window.electronAPI.hycreatorGetCatalogItems({
                            channel: hycreatorActiveChannel,
                            scanFile: chObj ? chObj.scanPath : (hycreatorInfo?.active_scan_path || null),
                            filterKind: kindParam || null,
                            searchTerm: hycreatorSearchTerm || null,
                            page: hycreatorCurrentPage,
                            pageSize: 40
                        });

                        hycreatorCatalogItems = res.items || [];
                        hycreatorTotalItems = res.total || 0;
                    }
                } else {
                    // Escanear carpeta local abierta en WinMerge (leftFolderPath o rightFolderPath)
                    const targetFolder = leftFolderPath || rightFolderPath || '';
                    if (targetFolder && isElectron && window.electronAPI.hycreatorScanLocal) {
                        const localItems = await window.electronAPI.hycreatorScanLocal({ folderPath: targetFolder });
                        const term = hycreatorSearchTerm.toLowerCase();
                        const kind = hycreatorActiveCategory.toLowerCase();

                        const filtered = localItems.filter(it => {
                            const matchTerm = !term || it.name.toLowerCase().includes(term);
                            const matchCat = kind === 'todos' || it.kind.toLowerCase() === kind;
                            return matchTerm && matchCat;
                        });

                        hycreatorTotalItems = filtered.length;
                        const start = (hycreatorCurrentPage - 1) * 40;
                        hycreatorCatalogItems = filtered.slice(start, start + 40);
                    } else {
                        hycreatorCatalogItems = [];
                        hycreatorTotalItems = 0;
                    }
                }

                // Renderizar lista en DOM
                renderCatalogList(itemList);

                // Actualizar Paginador y Contador
                const totalPages = Math.max(1, Math.ceil(hycreatorTotalItems / 40));
                countLabel.textContent = `${hycreatorTotalItems.toLocaleString()} elementos`;
                pageIndicator.textContent = `Pág. ${hycreatorCurrentPage} de ${totalPages}`;
                btnPrev.disabled = hycreatorCurrentPage <= 1;
                btnNext.disabled = hycreatorCurrentPage >= totalPages;

                // Auto-seleccionar primer elemento si no hay ninguno seleccionado
                if (!hycreatorSelectedItem && hycreatorCatalogItems.length > 0) {
                    selectItem(hycreatorCatalogItems[0]);
                }
            }
        } catch (err) {
            console.warn('[HyCreator] Error cargando catálogo:', err);
            itemList.innerHTML = '<div class="empty-list-msg">Error al cargar elementos del catálogo.</div>';
        } finally {
            if (spinner) spinner.classList.add('hidden');
            if (window.lucide) lucide.createIcons();
        }
    }

    // Renderizar árbol jerárquico de carpetas en la barra lateral
    function renderCatalogTree(container, treeNodes) {
        if (!container) return;
        if (!treeNodes || treeNodes.length === 0) {
            container.innerHTML = '<div class="empty-list-msg">No se encontraron carpetas ni modelos con ese filtro.</div>';
            return;
        }

        container.innerHTML = '';

        function createTreeNode(node, depth = 0) {
            const wrapper = document.createElement('div');
            wrapper.className = 'tree-node-wrapper';

            if (node.isFolder) {
                const folderDiv = document.createElement('div');
                // Auto-expandir el primer nivel o si hay búsqueda activa
                const autoExpand = depth === 0 || (hycreatorSearchTerm && depth < 3);
                folderDiv.className = `tree-node-folder ${autoExpand ? 'expanded' : ''}`;
                folderDiv.innerHTML = `
                    <i data-lucide="chevron-right" class="folder-arrow"></i>
                    <i data-lucide="folder" class="folder-icon"></i>
                    <span class="folder-name" title="${escapeHTML(node.name)}">${escapeHTML(node.name)}</span>
                    <span class="folder-count">${node.count}</span>
                `;

                const childrenDiv = document.createElement('div');
                childrenDiv.className = `tree-children ${autoExpand ? '' : 'collapsed'}`;

                // Clic para colapsar/expandir
                folderDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isExp = folderDiv.classList.toggle('expanded');
                    childrenDiv.classList.toggle('collapsed', !isExp);
                });

                wrapper.appendChild(folderDiv);

                // Subnodos (carpetas y archivos)
                if (node.children && Array.isArray(node.children)) {
                    for (const child of node.children) {
                        childrenDiv.appendChild(createTreeNode(child, depth + 1));
                    }
                }

                wrapper.appendChild(childrenDiv);
            } else {
                // Elemento archivo modelo/prefab
                const fileDiv = document.createElement('div');
                const isSelected = hycreatorSelectedItem && hycreatorSelectedItem.rel === node.rel;
                fileDiv.className = `tree-node-file ${isSelected ? 'active' : ''}`;

                let iconName = 'box';
                let iconClass = 'icon-violet';
                if (node.kind === 'Prefabs') {
                    iconName = 'layers';
                    iconClass = 'icon-cyan';
                } else if (node.kind === 'Creatures') {
                    iconName = 'sparkles';
                    iconClass = 'icon-emerald';
                } else if (node.kind === 'Item') {
                    iconName = 'sword';
                    iconClass = 'icon-amber';
                }

                fileDiv.innerHTML = `
                    <div class="item-left">
                        <i data-lucide="${iconName}" class="${iconClass}" style="width:13px; height:13px; flex-shrink:0;"></i>
                        <span class="item-name" title="${escapeHTML(node.name)}">${escapeHTML(node.name)}</span>
                    </div>
                `;

                fileDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectItem(node);
                    container.querySelectorAll('.tree-node-file').forEach(el => el.classList.remove('active'));
                    fileDiv.classList.add('active');
                });

                wrapper.appendChild(fileDiv);
            }

            return wrapper;
        }

        // Si hay una única carpeta contenedora (como 'Server' o 'Models'), desempaquetar sus hijos directamente
        let nodesToRender = treeNodes;
        if (treeNodes.length === 1 && treeNodes[0].isFolder && treeNodes[0].children?.length > 0) {
            // Si la única raíz es 'Server' y tiene una sola carpeta 'Prefabs', desempaquetar 'Prefabs'
            const single = treeNodes[0];
            if (single.children.length === 1 && single.children[0].isFolder) {
                nodesToRender = single.children[0].children;
            } else {
                nodesToRender = single.children;
            }
        }

        for (const rootNode of nodesToRender) {
            container.appendChild(createTreeNode(rootNode, 0));
        }

        if (window.lucide) lucide.createIcons();
    }

    // Renderizar la lista plana de elementos en la barra lateral (Modo Lista)
    function renderCatalogList(container) {
        if (!container) return;
        if (hycreatorCatalogItems.length === 0) {
            container.innerHTML = '<div class="empty-list-msg">No se encontraron modelos o prefabs con ese filtro.</div>';
            return;
        }

        container.innerHTML = '';
        hycreatorCatalogItems.forEach(item => {
            const div = document.createElement('div');
            const isSelected = hycreatorSelectedItem && hycreatorSelectedItem.rel === item.rel;
            div.className = `model-list-item ${isSelected ? 'active' : ''}`;

            let iconName = item.kind === 'Prefabs' ? 'layers' : (item.kind === 'blockymodel' ? 'box' : 'boxes');
            let iconClass = item.kind === 'Prefabs' ? 'icon-cyan' : 'icon-violet';
            if (item.kind === 'Creatures') {
                iconName = 'sparkles';
                iconClass = 'icon-emerald';
            } else if (item.kind === 'Item') {
                iconName = 'sword';
                iconClass = 'icon-amber';
            }

            div.innerHTML = `
                <div class="item-left">
                    <i data-lucide="${iconName}" class="${iconClass}" style="width:14px; height:14px; flex-shrink:0;"></i>
                    <span class="item-name" title="${escapeHTML(item.name)}">${escapeHTML(item.name)}</span>
                </div>
                <span class="item-tag">${item.kind === 'Prefabs' ? 'VOXEL' : (item.kind === 'blockymodel' ? 'MESH' : item.kind)}</span>
            `;

            div.addEventListener('click', () => {
                selectItem(item);
                // Actualizar clase activa en la lista
                container.querySelectorAll('.model-list-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
            });

            container.appendChild(div);
        });
    }

    // Seleccionar un modelo y cargarlo en el viewport 3D
    async function selectItem(item) {
        hycreatorSelectedItem = item;
        const nameChip = document.getElementById('active-model-name');
        const loader = document.getElementById('models3d-canvas-loader');

        if (nameChip) nameChip.textContent = item.name;
        if (loader) loader.classList.remove('hidden');

        // Llenar panel de detalles básico
        document.getElementById('det-name').textContent = item.name;
        document.getElementById('det-rel').textContent = item.rel;
        document.getElementById('det-format').textContent = item.kind;
        document.getElementById('det-size').textContent = 'Cargando...';

        try {
            let assetData = null;
            let resolved = null;
            if (isElectron && window.electronAPI.hycreatorResolveModel) {
                const workingDir = hycreatorDataSource === 'local' ? (leftFolderPath || rightFolderPath || '') : null;
                const chObj = hycreatorInfo?.channels && hycreatorInfo.channels[hycreatorActiveChannel];
                resolved = await window.electronAPI.hycreatorResolveModel({
                    relPath: item.rel,
                    channel: hycreatorActiveChannel,
                    assetsZipOverride: chObj ? chObj.zipPath : (hycreatorInfo?.assets_zip_path || null),
                    workingFolder: workingDir
                });
            } else if (isElectron && window.electronAPI.hycreatorReadAsset) {
                assetData = await window.electronAPI.hycreatorReadAsset({
                    relPath: item.rel,
                    channel: hycreatorActiveChannel
                });
            }

            hycreatorActiveAsset = resolved || assetData;
            if (resolved) {
                document.getElementById('det-size').textContent = formatBytes(resolved.size_bytes || 0);
                if (resolved.texturePath) {
                    document.getElementById('det-format').textContent = `${item.kind} (Textura: ${resolved.texturePath.split('/').pop()})`;
                }
                renderResolvedModelInThreeScene(resolved, item);
            } else if (assetData) {
                document.getElementById('det-size').textContent = formatBytes(assetData.size_bytes || 0);
                renderModelDataInThreeScene(assetData.content, item);
            }
        } catch (err) {
            console.warn('[HyCreator] Error leyendo asset:', err);
            document.getElementById('det-size').textContent = 'Error al leer';
            if (threeModelGroup) clearThreeGroup(threeModelGroup);
        } finally {
            if (loader) loader.classList.add('hidden');
        }
    }

    // Parsear el modelo resuelto y construir la escena 3D
    function renderResolvedModelInThreeScene(resolved, item) {
        if (!threeModelGroup || !window.THREE) return;
        clearThreeGroup(threeModelGroup);
        threeModelGroup.position.set(0, 0, 0);

        // Configurar barra de animaciones 3D (.blockyanim)
        const animControls = document.getElementById('models3d-anim-controls');
        const selectAnim = document.getElementById('select-model-anim');
        const btnAnimPlay = document.getElementById('btn-anim-play');

        if (animControls && selectAnim) {
            selectAnim.innerHTML = '';
            if (resolved && resolved.animations && resolved.animations.length > 0) {
                animControls.classList.remove('hidden');
                resolved.animations.forEach(anim => {
                    const opt = document.createElement('option');
                    opt.value = anim.path;
                    opt.textContent = anim.name;
                    if (anim.name === resolved.defaultAnimName || anim.name === 'Idle' || anim.name === 'idle') {
                        opt.selected = true;
                    }
                    selectAnim.appendChild(opt);
                });

                if (resolved.defaultAnimContent) {
                    try {
                        currentAnimationData = JSON.parse(resolved.defaultAnimContent);
                        modelAnimCurrentTime = 0;
                        isModelAnimPlaying = true;
                        if (btnAnimPlay) {
                            btnAnimPlay.classList.add('active');
                            const icon = btnAnimPlay.querySelector('i');
                            if (icon) icon.setAttribute('data-lucide', 'pause');
                            if (window.lucide) lucide.createIcons();
                        }
                    } catch (e) {
                        currentAnimationData = null;
                    }
                } else {
                    currentAnimationData = null;
                }
            } else {
                animControls.classList.add('hidden');
                currentAnimationData = null;
            }
        }

        try {
            if (resolved.kind === 'blockymodel' && resolved.modelContent) {
                const data = JSON.parse(resolved.modelContent);
                // Mostrar nombre real del modelo en el panel
                const modelBaseName = (resolved.referencedModelRel || resolved.rel_path || '').split('/').pop();
                if (modelBaseName) document.getElementById('det-format').textContent = `${item.kind} (${modelBaseName})`;
                renderBlockyModel(data, resolved.textureDataUrl, resolved.attachments || []);
            } else if (resolved.kind === 'prefab' && resolved.prefabContent) {
                const data = JSON.parse(resolved.prefabContent);
                renderPrefabVoxel(data, resolved.blockTextures);
            } else if (resolved.kind === 'item_icon' && resolved.iconDataUrl) {
                renderItemIcon3D(resolved.iconDataUrl, item.name);
            } else if (resolved.modelContent) {
                const data = JSON.parse(resolved.modelContent);
                if (data.blocks) renderPrefabVoxel(data, resolved.blockTextures);
                else if (data.nodes) renderBlockyModel(data, resolved.textureDataUrl);
                else renderGenericBox(item.name);
            } else if (resolved.kind === 'generic_json' && resolved.originalItem) {
                // Para JSON de animación u otros sin modelo directo,
                // mostrar icono si lo tiene, o indicar que es un archivo de datos
                const icon = resolved.originalItem.Icon || resolved.originalItem.icon;
                if (icon) {
                    renderIconAsFallback(icon, item, resolved.channel);
                } else {
                    showNoModelPlaceholder(item.name, resolved.kind);
                }
            } else {
                showNoModelPlaceholder(item.name, resolved.kind || '');
            }
        } catch (err) {
            console.warn('[HyCreator] Error renderizando modelo resuelto:', err);
            renderGenericBox(item.name);
        }
    }

    // Mostrar icono 2D cargado dinámicamente desde Assets.zip
    async function renderIconAsFallback(iconRel, item, channel) {
        try {
            const chObj = hycreatorInfo?.channels && hycreatorInfo.channels[hycreatorActiveChannel];
            const iconData = await window.electronAPI.hycreatorReadAsset({
                relPath: iconRel,
                channel: channel || hycreatorActiveChannel,
                assetsZipOverride: chObj ? chObj.zipPath : null
            });
            if (iconData && iconData.dataUrl) {
                renderItemIcon3D(iconData.dataUrl, item.name);
            } else {
                showNoModelPlaceholder(item.name, 'sin_modelo');
            }
        } catch (e) {
            showNoModelPlaceholder(item.name, 'sin_modelo');
        }
    }

    // Placeholder elegante cuando no hay modelo 3D disponible
    function showNoModelPlaceholder(name, kind) {
        clearThreeGroup(threeModelGroup);
        document.getElementById('det-dims').textContent = '—';
        document.getElementById('row-total-blocks').style.display = 'none';
        document.getElementById('row-node-count').style.display = 'none';
        document.getElementById('row-anchor').style.display = 'none';
        document.getElementById('card-block-breakdown').style.display = 'none';
        // Mostrar mensaje en el canvas via un sprite de texto
        showToast3D(`Sin modelo 3D para "${name}" (tipo: ${kind || 'desconocido'})`, false);
    }

    // Parsear el JSON y construir los objetos 3D (Fallback)
    function renderModelDataInThreeScene(jsonString, item) {
        if (!threeModelGroup || !window.THREE) return;
        clearThreeGroup(threeModelGroup);
        threeModelGroup.position.set(0, 0, 0);

        try {
            const data = JSON.parse(jsonString);

            if (data.blocks && Array.isArray(data.blocks)) {
                // CASO A: PREFAB DE BLOQUES VOXEL
                renderPrefabVoxel(data);
            } else if (data.nodes && Array.isArray(data.nodes)) {
                // CASO B: BLOCKYMODEL CON NODOS / HUESOS
                renderBlockyModel(data, null);
            } else if (data.elements && Array.isArray(data.elements)) {
                // CASO C: ELEMENTOS BLOCKBENCH
                renderBlockbench(data);
            } else {
                // CASO D: CUBO GENÉRICO PARA ITEMS
                renderGenericBox(item.name);
            }
        } catch (err) {
            console.warn('[HyCreator] No se pudo parsear el JSON:', err);
            renderGenericBox(item.name);
        }
    }

    // Renderizar Prefab Voxel con tamaño exacto (1.0 x 1.0 x 1.0) y texturas oficiales
    function renderPrefabVoxel(prefab, blockTextures = {}) {
        const blocks = prefab.blocks || [];
        if (blocks.length === 0) return;

        // Omitir bloques de aire o vacíos para que las habitaciones, interiores y ventanas sean visibles
        function isAirOrEmptyBlock(name) {
            if (!name) return true;
            const lower = name.toLowerCase().trim();
            return lower === 'air' || lower === 'empty' || lower === 'void' || lower === 'structure_void' ||
                   lower === 'cave_air' || lower === 'barrier' || lower === 'none' || lower === 'null' ||
                   lower.includes('_air') || lower.startsWith('air_') || lower.endsWith('_air') ||
                   lower === 'invisible' || lower === 'gas';
        }

        const visibleBlocks = blocks.filter(b => !isAirOrEmptyBlock(b.name));
        const activeBlocks = visibleBlocks.length > 0 ? visibleBlocks : blocks;

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        const countMap = new Map();
        const blocksByType = new Map();

        for (const b of activeBlocks) {
            if (b.x < minX) minX = b.x;
            if (b.x > maxX) maxX = b.x;
            if (b.y < minY) minY = b.y;
            if (b.y > maxY) maxY = b.y;
            if (b.z < minZ) minZ = b.z;
            if (b.z > maxZ) maxZ = b.z;

            countMap.set(b.name, (countMap.get(b.name) || 0) + 1);

            let list = blocksByType.get(b.name);
            if (!list) {
                list = [];
                blocksByType.set(b.name, list);
            }
            list.push(b);
        }

        const dimX = maxX - minX + 1;
        const dimY = maxY - minY + 1;
        const dimZ = maxZ - minZ + 1;

        // Actualizar métricas
        document.getElementById('det-dims').textContent = `${dimX} × ${dimY} × ${dimZ}`;
        document.getElementById('det-blocks').textContent = (visibleBlocks.length < blocks.length)
            ? `${activeBlocks.length.toLocaleString()} (sólidos)`
            : blocks.length.toLocaleString();
        document.getElementById('row-total-blocks').style.display = 'flex';
        document.getElementById('row-node-count').style.display = 'none';

        if (prefab.anchorX !== undefined) {
            document.getElementById('det-anchor').textContent = `(${prefab.anchorX}, ${prefab.anchorY || 0}, ${prefab.anchorZ || 0})`;
            document.getElementById('row-anchor').style.display = 'flex';
        } else {
            document.getElementById('row-anchor').style.display = 'none';
        }

        // Desglose de tipos de bloques
        const sortedTypes = Array.from(countMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        renderBlockBreakdown(sortedTypes);

        // Geometría con dimensión EXACTA de 1 bloque voxel (1.0 x 1.0 x 1.0)
        // Bloques contiguos encajan perfectamente sin grietas
        const cubeGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);

        // Geometría en cruz (dos planos a ±45°) para yerba, plantas, flores y fauna sin cubo sólido
        function createCrossedFoliageGeometry() {
            const geo = new THREE.BufferGeometry();
            const h = 0.48;
            const positions = new Float32Array([
                // Plano 1 (diagonal /)
                -h, -0.5, -h,   h, -0.5,  h,   h,  0.5,  h,
                -h, -0.5, -h,   h,  0.5,  h,  -h,  0.5, -h,
                // Plano 2 (diagonal \)
                -h, -0.5,  h,   h, -0.5, -h,   h,  0.5, -h,
                -h, -0.5,  h,   h,  0.5, -h,  -h,  0.5,  h
            ]);
            const uvs = new Float32Array([
                0, 0,  1, 0,  1, 1,
                0, 0,  1, 1,  0, 1,
                0, 0,  1, 0,  1, 1,
                0, 0,  1, 1,  0, 1
            ]);
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            geo.computeVertexNormals();
            return geo;
        }
        let crossGeo = null;

        function isCrossFoliageBlock(blockName, blockInfo) {
            if (blockInfo && blockInfo.drawType) {
                const dt = String(blockInfo.drawType).toLowerCase();
                if (dt === 'cross') return true;
            }
            const lower = (blockName || '').toLowerCase();
            // No convertir bloques sólidos de tierra con pasto (Soil_Grass, Dirt_Grass) en cruz
            if (lower.includes('soil') || lower.includes('dirt') || lower.includes('turf') || lower.includes('moss_block') || lower.includes('leaves') || lower.includes('leaf') || lower.includes('foliage')) {
                return false;
            }
            return (
                lower.includes('plant_') || lower.startsWith('grass') || lower.includes('_grass_') ||
                lower.includes('tallgrass') || lower.includes('flower') || lower.includes('fern') ||
                lower.includes('mushroom') || lower.includes('reed') || lower.includes('kelp') ||
                lower.includes('seaweed') || lower.includes('crop') || lower.includes('sapling') ||
                lower.includes('fauna') || lower.includes('coral') || lower.includes('bush')
            );
        }

        function isLeafOrFoliageCube(blockName) {
            const lower = (blockName || '').toLowerCase();
            return lower.includes('leaf') || lower.includes('leaves') || lower.includes('foliage') || lower.includes('vine');
        }

        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;
        const baseY = minY;

        const matrix = new THREE.Matrix4();

        // Caché de texturas Three.js para reutilizar entre bloques y prefabs
        if (!window._hyThreeTextureCache) window._hyThreeTextureCache = new Map();
        const texCache = window._hyThreeTextureCache;

        function getOrCreateTexture(dataUrl) {
            let tex = texCache.get(dataUrl);
            if (!tex) {
                const img = new Image();
                tex = new THREE.Texture(img);
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
                if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
                img.onload = () => { tex.needsUpdate = true; };
                img.src = dataUrl;
                texCache.set(dataUrl, tex);
            }
            return tex;
        }

        function parseTintColor(blockInfo) {
            const raw = (blockInfo && (blockInfo.tint || blockInfo.color)) || null;
            if (!raw || typeof raw !== 'string') return null;
            const parsedHex = parseInt(raw.replace('#', ''), 16);
            return !isNaN(parsedHex) ? parsedHex : null;
        }

        // Helper para construir un prototipo 3D de .blockymodel con UVs exactas (escala 1/32 = 1 bloque)
        function buildCustomModelPrototype(modelData, tex, texW, texH, customScale = 1.0, fallbackName = 'wood') {
            const proto = new THREE.Group();
            const unitScale = (1 / 32) * (customScale || 1.0);
            proto.scale.set(unitScale, unitScale, unitScale);

            const mat = tex
                ? new THREE.MeshStandardMaterial({
                    map: tex,
                    roughness: 0.65,
                    metalness: 0.1,
                    alphaTest: 0.1,
                    transparent: true,
                    side: THREE.DoubleSide,
                    wireframe: threeWireframe
                })
                : new THREE.MeshStandardMaterial({
                    color: getHytaleBlockColor(fallbackName),
                    roughness: 0.65,
                    metalness: 0.1,
                    wireframe: threeWireframe
                });

            function addNodes(nodes, parentGroup, parentOffset = { x: 0, y: 0, z: 0 }) {
                for (const node of nodes) {
                    const nodeObj = new THREE.Group();
                    nodeObj.position.set(
                        (node.position?.x || 0) + (parentOffset.x || 0),
                        (node.position?.y || 0) + (parentOffset.y || 0),
                        (node.position?.z || 0) + (parentOffset.z || 0)
                    );
                    if (node.orientation) {
                        nodeObj.quaternion.set(
                            node.orientation.x || 0,
                            node.orientation.y || 0,
                            node.orientation.z || 0,
                            node.orientation.w !== undefined ? node.orientation.w : 1
                        );
                    }

                    const sh = node.shape;
                    const thisOffset = sh?.offset
                        ? { x: sh.offset.x || 0, y: sh.offset.y || 0, z: sh.offset.z || 0 }
                        : { x: 0, y: 0, z: 0 };

                    if (sh && sh.visible !== false) {
                        if (sh.type === 'box') {
                            const szDef = (sh.settings && sh.settings.size) || sh.size || { x: 1, y: 1, z: 1 };
                            const stretch = sh.stretch || { x: 1, y: 1, z: 1 };
                            const sx = Math.max(0.01, Math.abs((szDef.x ?? 1) * (stretch.x ?? 1)));
                            const sy = Math.max(0.01, Math.abs((szDef.y ?? 1) * (stretch.y ?? 1)));
                            const szLen = Math.max(0.01, Math.abs((szDef.z ?? 1) * (stretch.z ?? 1)));

                            const geo = new THREE.BoxGeometry(sx, sy, szLen);
                            if (tex && sh.textureLayout && texW && texH) {
                                applyHytaleUVs(geo, sh.textureLayout, szDef, texW, texH);
                            }
                            const mesh = new THREE.Mesh(geo, mat);
                            mesh.position.set(thisOffset.x, thisOffset.y, thisOffset.z);
                            mesh.scale.set(
                                (stretch.x !== undefined && stretch.x < 0) ? -1 : 1,
                                (stretch.y !== undefined && stretch.y < 0) ? -1 : 1,
                                (stretch.z !== undefined && stretch.z < 0) ? -1 : 1
                            );
                            mesh.castShadow = true;
                            mesh.receiveShadow = true;
                            nodeObj.add(mesh);
                        } else if (sh.type === 'quad') {
                            const szDef = (sh.settings && sh.settings.size) || sh.size || { x: 1, y: 1 };
                            const stretch = sh.stretch || { x: 1, y: 1, z: 1 };
                            const normal = sh.settings?.normal || '+Z';
                            const frontLayout = sh.textureLayout?.front || sh.textureLayout?.top || sh.textureLayout?.back || (sh.textureLayout ? Object.values(sh.textureLayout)[0] : null);
                            let sx, sy, szLen, uvSizes, quadLayout = {};
                            if (normal.includes('X')) {
                                sx = 0.002;
                                sy = Math.max(0.01, Math.abs((szDef.y ?? 1) * (stretch.y ?? 1)));
                                szLen = Math.max(0.01, Math.abs((szDef.x ?? 1) * (stretch.x ?? 1)));
                                uvSizes = { x: szDef.x || 1, y: szDef.y || 1, z: szDef.x || 1 };
                                if (frontLayout) quadLayout[normal === '+X' ? 'right' : 'left'] = frontLayout;
                            } else if (normal.includes('Y')) {
                                sx = Math.max(0.01, Math.abs((szDef.x ?? 1) * (stretch.x ?? 1)));
                                sy = 0.002;
                                szLen = Math.max(0.01, Math.abs((szDef.y ?? 1) * (stretch.y ?? 1)));
                                uvSizes = { x: szDef.x || 1, y: szDef.y || 1, z: szDef.y || 1 };
                                if (frontLayout) quadLayout[normal === '+Y' ? 'top' : 'bottom'] = frontLayout;
                            } else {
                                sx = Math.max(0.01, Math.abs((szDef.x ?? 1) * (stretch.x ?? 1)));
                                sy = Math.max(0.01, Math.abs((szDef.y ?? 1) * (stretch.y ?? 1)));
                                szLen = 0.002;
                                uvSizes = { x: szDef.x || 1, y: szDef.y || 1, z: szDef.x || 1 };
                                if (frontLayout) quadLayout[normal === '+Z' ? 'front' : 'back'] = frontLayout;
                            }
                            const geo = new THREE.BoxGeometry(sx, sy, szLen);
                            if (tex && frontLayout && texW && texH) {
                                applyHytaleUVs(geo, quadLayout, uvSizes, texW, texH);
                            }
                            const mesh = new THREE.Mesh(geo, mat);
                            mesh.position.set(thisOffset.x, thisOffset.y, thisOffset.z);
                            mesh.scale.set(
                                (stretch.x !== undefined && stretch.x < 0) ? -1 : 1,
                                (stretch.y !== undefined && stretch.y < 0) ? -1 : 1,
                                (stretch.z !== undefined && stretch.z < 0) ? -1 : 1
                            );
                            nodeObj.add(mesh);
                        }
                    }

                    if (node.children && Array.isArray(node.children)) {
                        addNodes(node.children, nodeObj, thisOffset);
                    }
                    parentGroup.add(nodeObj);
                }
            }

            if (modelData && Array.isArray(modelData.nodes)) {
                addNodes(modelData.nodes, proto);
            }
            return proto;
        }

        // Renderizar por tipo de bloque con su textura, modelo 3D, caras múltiples o follaje orgánico
        blocksByType.forEach((blockList, blockName) => {
            const blockInfo = blockTextures && blockTextures[blockName];

            // Si el bloque tiene CustomModel (.blockymodel, ej. pila de libros, muebles, props),
            // renderizar su geometría real con UVs exactas y alineada a la base de su hitbox
            if (blockInfo && blockInfo.customModelContent) {
                try {
                    const modelData = JSON.parse(blockInfo.customModelContent);
                    if (modelData && Array.isArray(modelData.nodes)) {
                        const containerGroup = new THREE.Group();
                        threeModelGroup.add(containerGroup);

                        const placeInstances = (tex, texW, texH) => {
                            if (!containerGroup.parent) return; // El usuario cambió de prefab antes de terminar la carga
                            const proto = buildCustomModelPrototype(
                                modelData, tex, texW, texH,
                                blockInfo.customModelScale || 1.0,
                                blockName
                            );
                            const maxInstances = Math.min(blockList.length, 800);
                            for (let i = 0; i < maxInstances; i++) {
                                const b = blockList[i];
                                const inst = i === 0 ? proto : proto.clone();
                                inst.position.set(b.x - centerX, b.y - baseY, b.z - centerZ);
                                if (typeof b.rotation === 'number' && b.rotation !== 0) {
                                    inst.rotation.y = -(b.rotation * Math.PI) / 2;
                                }
                                inst.userData.blockName = blockName;
                                inst.userData.blockData = b;
                                inst.userData.prefabCenter = { centerX, baseY, centerZ };
                                containerGroup.add(inst);
                            }
                        };

                        if (blockInfo.dataUrl) {
                            const tex = getOrCreateTexture(blockInfo.dataUrl);
                            const img = tex.image;
                            if (img && img.complete && img.naturalWidth > 0) {
                                placeInstances(tex, img.naturalWidth, img.naturalHeight);
                            } else if (img) {
                                img.addEventListener('load', () => {
                                    placeInstances(tex, img.naturalWidth, img.naturalHeight);
                                }, { once: true });
                            } else {
                                placeInstances(null, 0, 0);
                            }
                        } else {
                            placeInstances(null, 0, 0);
                        }
                        return;
                    }
                } catch (e) {}
            }

            const useCross = isCrossFoliageBlock(blockName, blockInfo);
            const isLeaf = isLeafOrFoliageCube(blockName);
            let mat;

            if (!useCross && blockInfo && blockInfo.faces && blockInfo.faces.top && blockInfo.faces.sides) {
                const tintHex = parseTintColor(blockInfo);
                const topMat = new THREE.MeshStandardMaterial({
                    map: getOrCreateTexture(blockInfo.faces.top),
                    color: tintHex || 0xffffff,
                    roughness: 0.78,
                    metalness: 0.08,
                    transparent: true,
                    alphaTest: 0.1,
                    wireframe: threeWireframe
                });
                const sideMat = new THREE.MeshStandardMaterial({
                    map: getOrCreateTexture(blockInfo.faces.sides),
                    roughness: 0.78,
                    metalness: 0.08,
                    transparent: true,
                    alphaTest: 0.1,
                    wireframe: threeWireframe
                });
                const bottomMat = blockInfo.faces.bottom && blockInfo.faces.bottom !== blockInfo.faces.sides
                    ? new THREE.MeshStandardMaterial({
                        map: getOrCreateTexture(blockInfo.faces.bottom),
                        roughness: 0.8,
                        metalness: 0.05,
                        wireframe: threeWireframe
                    })
                    : sideMat;
                // Orden BoxGeometry: +X, -X, +Y (top), -Y (bottom), +Z, -Z
                mat = [sideMat, sideMat, topMat, bottomMat, sideMat, sideMat];
            } else if (blockInfo && blockInfo.dataUrl) {
                const tex = getOrCreateTexture(blockInfo.dataUrl);
                const tintHex = (isLeaf || useCross) ? parseTintColor(blockInfo) : null;
                mat = new THREE.MeshStandardMaterial({
                    map: tex,
                    color: tintHex || 0xffffff,
                    roughness: (isLeaf || useCross) ? 0.85 : 0.75,
                    metalness: 0.08,
                    transparent: true,
                    alphaTest: (isLeaf || useCross) ? 0.35 : 0.1,
                    depthWrite: true,
                    side: THREE.DoubleSide,
                    wireframe: threeWireframe
                });
            } else {
                let colorHex = getHytaleBlockColor(blockName);
                const parsedHex = parseTintColor(blockInfo);
                if (parsedHex !== null) colorHex = parsedHex;
                mat = new THREE.MeshStandardMaterial({
                    color: colorHex,
                    roughness: (isLeaf || useCross) ? 0.9 : 0.75,
                    metalness: 0.08,
                    transparent: isLeaf,
                    opacity: isLeaf ? 0.92 : 1.0,
                    side: useCross ? THREE.DoubleSide : THREE.FrontSide,
                    wireframe: threeWireframe
                });
            }

            let targetGeo = cubeGeo;
            if (useCross) {
                if (!crossGeo) crossGeo = createCrossedFoliageGeometry();
                targetGeo = crossGeo;
            }

            const instancedMesh = new THREE.InstancedMesh(targetGeo, mat, blockList.length);
            instancedMesh.castShadow = !useCross;
            instancedMesh.receiveShadow = true;
            instancedMesh.userData.blockName = blockName;
            instancedMesh.userData.blockList = blockList;
            instancedMesh.userData.prefabCenter = { centerX, baseY, centerZ };

            for (let i = 0; i < blockList.length; i++) {
                const b = blockList[i];
                matrix.setPosition(b.x - centerX, b.y - baseY + 0.5, b.z - centerZ);
                instancedMesh.setMatrixAt(i, matrix);
            }

            instancedMesh.instanceMatrix.needsUpdate = true;
            if (typeof instancedMesh.computeBoundingSphere === 'function') instancedMesh.computeBoundingSphere();
            if (typeof instancedMesh.computeBoundingBox === 'function') instancedMesh.computeBoundingBox();
            threeModelGroup.add(instancedMesh);
        });

        resetCameraView(dimX, dimY, dimZ);
    }

    // Aplicar UVs oficiales de Hytale a BoxGeometry eliminando caras no texturizadas
    function applyHytaleUVs(geometry, textureLayout, size, texW, texH) {
        if (!textureLayout || !geometry.attributes.uv || !texW || !texH) return;
        const uvs = geometry.attributes.uv;
        const indices = geometry.index ? geometry.index.array : null;

        // Three.js BoxGeometry face order y dimensiones de cada cara en la textura:
        // 0: right (+X), 1: left (-X), 2: top (+Y), 3: bottom (-Y), 4: front (+Z), 5: back (-Z)
        const faces = [
            { key: 'right',  fw: size.z, fh: size.y },
            { key: 'left',   fw: size.z, fh: size.y },
            { key: 'top',    fw: size.x, fh: size.z },
            { key: 'bottom', fw: size.x, fh: size.z },
            { key: 'front',  fw: size.x, fh: size.y },
            { key: 'back',   fw: size.x, fh: size.y }
        ];

        let indexModified = false;

        for (let f = 0; f < 6; f++) {
            const layout = textureLayout[faces[f].key];

            // Si la cara NO tiene layout definido en Hytale, es una cara oculta/no texturizada.
            // Para evitar que Three.js dibuje el atlas completo estirado, eliminamos sus triángulos
            // colapsando los 6 índices de la cara a 0 (triángulos degenerados que la GPU descarta).
            if (!layout || !layout.offset) {
                if (indices) {
                    for (let k = 0; k < 6; k++) {
                        indices[f * 6 + k] = 0;
                    }
                    indexModified = true;
                }
                for (let v = 0; v < 4; v++) {
                    uvs.setXY(f * 4 + v, 0, 0);
                }
                continue;
            }

            const ox = layout.offset.x;
            const oy = layout.offset.y;
            let uv_size = [ faces[f].fw, faces[f].fh ];
            let uv_mirror = [
                layout.mirror?.x ? -1 : 1,
                layout.mirror?.y ? -1 : 1
            ];
            let uv_rotation = layout.angle || 0;

            // Algoritmo oficial de Hytale (del plugin oficial de Blockbench)
            let result = [0, 0, 0, 0];
            switch (uv_rotation) {
                case 90: {
                    let t = uv_size[0]; uv_size[0] = uv_size[1]; uv_size[1] = t;
                    let tm = uv_mirror[0]; uv_mirror[0] = uv_mirror[1]; uv_mirror[1] = tm;
                    uv_mirror[0] *= -1;
                    result = [
                        ox,
                        oy + uv_size[1] * uv_mirror[1],
                        ox + uv_size[0] * uv_mirror[0],
                        oy
                    ];
                    break;
                }
                case 270: {
                    let t = uv_size[0]; uv_size[0] = uv_size[1]; uv_size[1] = t;
                    let tm = uv_mirror[0]; uv_mirror[0] = uv_mirror[1]; uv_mirror[1] = tm;
                    uv_mirror[1] *= -1;
                    result = [
                        ox + uv_size[0] * uv_mirror[0],
                        oy,
                        ox,
                        oy + uv_size[1] * uv_mirror[1]
                    ];
                    break;
                }
                case 180: {
                    uv_mirror[0] *= -1;
                    uv_mirror[1] *= -1;
                    result = [
                        ox + uv_size[0] * uv_mirror[0],
                        oy + uv_size[1] * uv_mirror[1],
                        ox,
                        oy
                    ];
                    break;
                }
                case 0:
                default: {
                    result = [
                        ox,
                        oy,
                        ox + uv_size[0] * uv_mirror[0],
                        oy + uv_size[1] * uv_mirror[1]
                    ];
                    break;
                }
            }

            // Algoritmo 1:1 de Blockbench para mapeo de vértices y rotación UV:
            // m[0]=TopLeft, m[1]=TopRight, m[2]=BottomLeft, m[3]=BottomRight
            let m = [
                [result[0] / texW, 1 - result[1] / texH],
                [result[2] / texW, 1 - result[1] / texH],
                [result[0] / texW, 1 - result[3] / texH],
                [result[2] / texW, 1 - result[3] / texH]
            ];

            let h = uv_rotation;
            while (h > 0) {
                let temp = m[0];
                m[0] = m[2];
                m[2] = m[3];
                m[3] = m[1];
                m[1] = temp;
                h -= 90;
            }

            uvs.setXY(f * 4 + 0, m[0][0], m[0][1]);
            uvs.setXY(f * 4 + 1, m[1][0], m[1][1]);
            uvs.setXY(f * 4 + 2, m[2][0], m[2][1]);
            uvs.setXY(f * 4 + 3, m[3][0], m[3][1]);
        }

        uvs.needsUpdate = true;
        if (indexModified && geometry.index) {
            geometry.index.needsUpdate = true;
        }
    }

    // Renderizar BlockyModel con nodos, cuaterniones, attachments y texturas oficiales
    function renderBlockyModel(data, textureDataUrl, attachments = []) {
        if (!data || !data.nodes) return;

        const buildWithTexture = (mainTex, mainTexW, mainTexH) => {
            let nodeCount = 0;
            let boxCount = 0;
            const nodeMap = new Map(); // Mapa de nodos principales para montaje de attachments

            function processNodes(nodes, parentGroup, parentOffset = { x: 0, y: 0, z: 0 }, isAttachmentPiece = false, tex = mainTex, texW = mainTexW, texH = mainTexH) {
                for (const node of nodes) {
                    nodeCount++;
                    const nodeObj = new THREE.Group();
                    nodeObj.name = node.name || `node_${nodeCount}`;
                    nodeMap.set(nodeObj.name, nodeObj);

                    // Si es el nodo raíz de un attachment acoplado a un hueso existente, su posición local en el hueso es (0, 0, 0)
                    if (!isAttachmentPiece) {
                        const posX = (node.position?.x || 0) + (parentOffset.x || 0);
                        const posY = (node.position?.y || 0) + (parentOffset.y || 0);
                        const posZ = (node.position?.z || 0) + (parentOffset.z || 0);
                        nodeObj.position.set(posX, posY, posZ);

                        if (node.orientation) {
                            nodeObj.quaternion.set(
                                node.orientation.x || 0,
                                node.orientation.y || 0,
                                node.orientation.z || 0,
                                node.orientation.w !== undefined ? node.orientation.w : 1
                            );
                        }
                    } else {
                        nodeObj.position.set(0, 0, 0);
                    }

                    const sh = node.shape;
                    const thisOffset = sh?.offset ? { x: sh.offset.x || 0, y: sh.offset.y || 0, z: sh.offset.z || 0 } : { x: 0, y: 0, z: 0 };

                    // Guardar transforms base para animación esqueletal (.blockyanim) y acoplamiento de attachments
                    nodeObj.userData = {
                        restPosition: nodeObj.position.clone(),
                        restQuaternion: nodeObj.quaternion.clone(),
                        boneName: nodeObj.name,
                        shapeOffset: thisOffset
                    };
                    animatedBonesMap.set(nodeObj.name, nodeObj);

                    // Renderizar solo nodos visibles con geometría real (box o quad)
                    if (sh && sh.visible !== false) {
                        if (sh.type === 'box') {
                            boxCount++;
                            const szDef = (sh.settings && sh.settings.size) || sh.size || { x: 1, y: 1, z: 1 };
                            const stretch = sh.stretch || { x: 1, y: 1, z: 1 };

                            // Escala real = size × stretch (Hytale usa sub-voxels)
                            const sx = Math.max(0.01, Math.abs((szDef.x !== undefined ? szDef.x : 1) * (stretch.x !== undefined ? stretch.x : 1)));
                            const sy = Math.max(0.01, Math.abs((szDef.y !== undefined ? szDef.y : 1) * (stretch.y !== undefined ? stretch.y : 1)));
                            const sz_len = Math.max(0.01, Math.abs((szDef.z !== undefined ? szDef.z : 1) * (stretch.z !== undefined ? stretch.z : 1)));

                            const geo = new THREE.BoxGeometry(sx, sy, sz_len);

                            if (tex && sh.textureLayout) {
                                applyHytaleUVs(geo, sh.textureLayout, szDef, texW, texH);
                            }

                            let mat;
                            if (tex) {
                                mat = new THREE.MeshStandardMaterial({
                                    map: tex,
                                    roughness: 0.65,
                                    metalness: 0.1,
                                    alphaTest: 0.1,
                                    transparent: true,
                                    side: THREE.DoubleSide,
                                    wireframe: threeWireframe
                                });
                            } else {
                                mat = new THREE.MeshStandardMaterial({
                                    color: getHytaleBlockColor(node.name || 'wood'),
                                    roughness: 0.55,
                                    metalness: 0.2,
                                    wireframe: threeWireframe
                                });
                            }

                            const mesh = new THREE.Mesh(geo, mat);
                            mesh.position.set(thisOffset.x, thisOffset.y, thisOffset.z);
                            // Simetría y espejo negativo de Hytale (ej. extremidades y orejas simétricas)
                            mesh.scale.set(
                                (stretch.x !== undefined && stretch.x < 0) ? -1 : 1,
                                (stretch.y !== undefined && stretch.y < 0) ? -1 : 1,
                                (stretch.z !== undefined && stretch.z < 0) ? -1 : 1
                            );
                            mesh.castShadow = true;
                            mesh.receiveShadow = true;
                            nodeObj.add(mesh);

                        } else if (sh.type === 'quad') {
                            // Quad: plano 2D según especificación oficial de Hytale en Blockbench.
                            // Se modela como una caja fina orientada según su normal (+X/-X, +Y/-Y, +Z/-Z)
                            // con mapeo UV oficial, rotación (0/90/180/270) y mirroring (X/Y).
                            boxCount++;
                            const szDef = (sh.settings && sh.settings.size) || sh.size || { x: 1, y: 1 };
                            const stretch = sh.stretch || { x: 1, y: 1, z: 1 };
                            const normal = sh.settings?.normal || "+Z";

                            let sx, sy, sz_len;
                            let uvSizes = { x: szDef.x || 1, y: szDef.y || 1, z: szDef.y || 1 };
                            let quadLayout = {};
                            const frontLayout = sh.textureLayout?.front || sh.textureLayout?.top || sh.textureLayout?.back || (sh.textureLayout ? Object.values(sh.textureLayout)[0] : null);

                            if (normal.includes('X')) {
                                sx = 0.002;
                                sy = Math.max(0.01, Math.abs((szDef.y !== undefined ? szDef.y : 1) * (stretch.y !== undefined ? stretch.y : 1)));
                                sz_len = Math.max(0.01, Math.abs((szDef.x !== undefined ? szDef.x : 1) * (stretch.x !== undefined ? stretch.x : 1)));
                                uvSizes = { x: szDef.x || 1, y: szDef.y || 1, z: szDef.x || 1 };
                                if (frontLayout) quadLayout[normal === '+X' ? 'right' : 'left'] = frontLayout;
                            } else if (normal.includes('Y')) {
                                sx = Math.max(0.01, Math.abs((szDef.x !== undefined ? szDef.x : 1) * (stretch.x !== undefined ? stretch.x : 1)));
                                sy = 0.002;
                                sz_len = Math.max(0.01, Math.abs((szDef.y !== undefined ? szDef.y : 1) * (stretch.y !== undefined ? stretch.y : 1)));
                                uvSizes = { x: szDef.x || 1, y: szDef.y || 1, z: szDef.y || 1 };
                                if (frontLayout) quadLayout[normal === '+Y' ? 'top' : 'bottom'] = frontLayout;
                            } else {
                                sx = Math.max(0.01, Math.abs((szDef.x !== undefined ? szDef.x : 1) * (stretch.x !== undefined ? stretch.x : 1)));
                                sy = Math.max(0.01, Math.abs((szDef.y !== undefined ? szDef.y : 1) * (stretch.y !== undefined ? stretch.y : 1)));
                                sz_len = 0.002;
                                uvSizes = { x: szDef.x || 1, y: szDef.y || 1, z: szDef.x || 1 };
                                if (frontLayout) quadLayout[normal === '+Z' ? 'front' : 'back'] = frontLayout;
                            }

                            const geo = new THREE.BoxGeometry(sx, sy, sz_len);
                            if (tex && frontLayout) {
                                applyHytaleUVs(geo, quadLayout, uvSizes, texW, texH);
                            }

                            let mat;
                            if (tex) {
                                mat = new THREE.MeshStandardMaterial({
                                    map: tex,
                                    roughness: 0.5,
                                    alphaTest: 0.1,
                                    transparent: true,
                                    depthWrite: true,
                                    polygonOffset: true,
                                    polygonOffsetFactor: -1,
                                    polygonOffsetUnits: -1,
                                    side: THREE.DoubleSide,
                                    wireframe: threeWireframe
                                });
                            } else {
                                mat = new THREE.MeshStandardMaterial({
                                    color: getHytaleBlockColor(node.name || 'blade'),
                                    roughness: 0.5,
                                    side: THREE.DoubleSide,
                                    wireframe: threeWireframe
                                });
                            }

                            const mesh = new THREE.Mesh(geo, mat);
                            mesh.position.set(thisOffset.x, thisOffset.y, thisOffset.z);
                            // Simetría y espejo negativo de Hytale para quads (ej. mechones de pelaje de los lados de la cabeza)
                            mesh.scale.set(
                                (stretch.x !== undefined && stretch.x < 0) ? -1 : 1,
                                (stretch.y !== undefined && stretch.y < 0) ? -1 : 1,
                                (stretch.z !== undefined && stretch.z < 0) ? -1 : 1
                            );
                            mesh.castShadow = true;
                            nodeObj.add(mesh);
                        }
                    }

                    if (node.children && Array.isArray(node.children)) {
                        processNodes(node.children, nodeObj, thisOffset, false, tex, texW, texH);
                    }

                    parentGroup.add(nodeObj);
                }
            }

            // 1. Construir el esqueleto y cuerpo principal de la criatura/modelo
            processNodes(data.nodes, threeModelGroup, { x: 0, y: 0, z: 0 }, false, mainTex, mainTexW, mainTexH);

            // 2. Acoplar Attachments de forma universal (armaduras, cascos, ojos, armas, escudos, variantes void)
            if (attachments && Array.isArray(attachments)) {
                for (const att of attachments) {
                    if (!att || !att.modelContent) continue;
                    try {
                        const attData = JSON.parse(att.modelContent);
                        if (!attData.nodes) continue;

                        const buildAttachment = (attTex, attW, attH) => {
                            function processAttachmentNodes(attNodes, currentParent, curParentOffset) {
                                for (const node of attNodes) {
                                    const isPiece = node.shape?.settings?.isPiece === true;
                                    let attachTarget = currentParent;
                                    let nodeIsPiece = false;

                                    if (isPiece && nodeMap.has(node.name)) {
                                        // Se acopla directamente al hueso base existente con el mismo nombre
                                        attachTarget = nodeMap.get(node.name);
                                        nodeIsPiece = true;
                                    }

                                    nodeCount++;
                                    const nodeObj = new THREE.Group();
                                    nodeObj.name = `att_${node.name || nodeCount}`;

                                    if (nodeIsPiece) {
                                        // La pieza de anclaje se alinea en el shapeOffset del hueso base de referencia según la especificación de Hytale
                                        const baseOffset = attachTarget?.userData?.shapeOffset || { x: 0, y: 0, z: 0 };
                                        nodeObj.position.set(baseOffset.x, baseOffset.y, baseOffset.z);
                                    } else {
                                        const posX = (node.position?.x || 0) + (curParentOffset.x || 0);
                                        const posY = (node.position?.y || 0) + (curParentOffset.y || 0);
                                        const posZ = (node.position?.z || 0) + (curParentOffset.z || 0);
                                        nodeObj.position.set(posX, posY, posZ);

                                        if (node.orientation) {
                                            nodeObj.quaternion.set(
                                                node.orientation.x || 0,
                                                node.orientation.y || 0,
                                                node.orientation.z || 0,
                                                node.orientation.w !== undefined ? node.orientation.w : 1
                                            );
                                        }
                                    }

                                    const sh = node.shape;
                                    const thisOffset = sh?.offset ? { x: sh.offset.x || 0, y: sh.offset.y || 0, z: sh.offset.z || 0 } : { x: 0, y: 0, z: 0 };

                                    if (sh && sh.visible !== false) {
                                        if (sh.type === 'box') {
                                            boxCount++;
                                            const szDef = (sh.settings && sh.settings.size) || sh.size || { x: 1, y: 1, z: 1 };
                                            const stretch = sh.stretch || { x: 1, y: 1, z: 1 };
                                            const sx = Math.max(0.01, Math.abs((szDef.x !== undefined ? szDef.x : 1) * (stretch.x !== undefined ? stretch.x : 1)));
                                            const sy = Math.max(0.01, Math.abs((szDef.y !== undefined ? szDef.y : 1) * (stretch.y !== undefined ? stretch.y : 1)));
                                            const sz_len = Math.max(0.01, Math.abs((szDef.z !== undefined ? szDef.z : 1) * (stretch.z !== undefined ? stretch.z : 1)));

                                            const geo = new THREE.BoxGeometry(sx, sy, sz_len);
                                            if (attTex && sh.textureLayout) {
                                                applyHytaleUVs(geo, sh.textureLayout, szDef, attW, attH);
                                            }

                                            let mat;
                                            if (attTex) {
                                                mat = new THREE.MeshStandardMaterial({
                                                    map: attTex,
                                                    roughness: 0.65,
                                                    metalness: 0.1,
                                                    alphaTest: 0.1,
                                                    transparent: true,
                                                    depthWrite: true,
                                                    polygonOffset: true,
                                                    polygonOffsetFactor: -1,
                                                    polygonOffsetUnits: -1,
                                                    side: THREE.DoubleSide,
                                                    wireframe: threeWireframe
                                                });
                                            } else {
                                                mat = new THREE.MeshStandardMaterial({
                                                    color: getHytaleBlockColor(node.name || 'att'),
                                                    roughness: 0.55,
                                                    metalness: 0.2,
                                                    wireframe: threeWireframe
                                                });
                                            }

                                            const mesh = new THREE.Mesh(geo, mat);
                                            mesh.position.set(thisOffset.x, thisOffset.y, thisOffset.z);
                                            mesh.scale.set(
                                                (stretch.x !== undefined && stretch.x < 0) ? -1 : 1,
                                                (stretch.y !== undefined && stretch.y < 0) ? -1 : 1,
                                                (stretch.z !== undefined && stretch.z < 0) ? -1 : 1
                                            );
                                            mesh.castShadow = true;
                                            mesh.receiveShadow = true;
                                            nodeObj.add(mesh);

                                        } else if (sh.type === 'quad') {
                                            boxCount++;
                                            const szDef = (sh.settings && sh.settings.size) || sh.size || { x: 1, y: 1 };
                                            const stretch = sh.stretch || { x: 1, y: 1, z: 1 };
                                            const normal = sh.settings?.normal || "+Z";

                                            let sx, sy, sz_len;
                                            let uvSizes = { x: szDef.x || 1, y: szDef.y || 1, z: szDef.y || 1 };
                                            let quadLayout = {};
                                            const frontLayout = sh.textureLayout?.front || sh.textureLayout?.top || sh.textureLayout?.back || (sh.textureLayout ? Object.values(sh.textureLayout)[0] : null);

                                            if (normal.includes('X')) {
                                                sx = 0.002;
                                                sy = Math.max(0.01, Math.abs((szDef.y !== undefined ? szDef.y : 1) * (stretch.y !== undefined ? stretch.y : 1)));
                                                sz_len = Math.max(0.01, Math.abs((szDef.x !== undefined ? szDef.x : 1) * (stretch.x !== undefined ? stretch.x : 1)));
                                                uvSizes = { x: szDef.x || 1, y: szDef.y || 1, z: szDef.x || 1 };
                                                if (frontLayout) quadLayout[normal === '+X' ? 'right' : 'left'] = frontLayout;
                                            } else if (normal.includes('Y')) {
                                                sx = Math.max(0.01, Math.abs((szDef.x !== undefined ? szDef.x : 1) * (stretch.x !== undefined ? stretch.x : 1)));
                                                sy = 0.002;
                                                sz_len = Math.max(0.01, Math.abs((szDef.y !== undefined ? szDef.y : 1) * (stretch.y !== undefined ? stretch.y : 1)));
                                                uvSizes = { x: szDef.x || 1, y: szDef.y || 1, z: szDef.y || 1 };
                                                if (frontLayout) quadLayout[normal === '+Y' ? 'top' : 'bottom'] = frontLayout;
                                            } else {
                                                sx = Math.max(0.01, Math.abs((szDef.x !== undefined ? szDef.x : 1) * (stretch.x !== undefined ? stretch.x : 1)));
                                                sy = Math.max(0.01, Math.abs((szDef.y !== undefined ? szDef.y : 1) * (stretch.y !== undefined ? stretch.y : 1)));
                                                sz_len = 0.002;
                                                uvSizes = { x: szDef.x || 1, y: szDef.y || 1, z: szDef.x || 1 };
                                                if (frontLayout) quadLayout[normal === '+Z' ? 'front' : 'back'] = frontLayout;
                                            }

                                            const geo = new THREE.BoxGeometry(sx, sy, sz_len);
                                            if (attTex && frontLayout) {
                                                applyHytaleUVs(geo, quadLayout, uvSizes, attW, attH);
                                            }

                                            let mat;
                                            if (attTex) {
                                                mat = new THREE.MeshStandardMaterial({
                                                    map: attTex,
                                                    roughness: 0.5,
                                                    alphaTest: 0.1,
                                                    transparent: true,
                                                    depthWrite: true,
                                                    polygonOffset: true,
                                                    polygonOffsetFactor: -1,
                                                    polygonOffsetUnits: -1,
                                                    side: THREE.DoubleSide,
                                                    wireframe: threeWireframe
                                                });
                                            } else {
                                                mat = new THREE.MeshStandardMaterial({
                                                    color: getHytaleBlockColor(node.name || 'att_blade'),
                                                    roughness: 0.5,
                                                    side: THREE.DoubleSide,
                                                    wireframe: threeWireframe
                                                });
                                            }

                                            const mesh = new THREE.Mesh(geo, mat);
                                            mesh.position.set(thisOffset.x, thisOffset.y, thisOffset.z);
                                            mesh.scale.set(
                                                (stretch.x !== undefined && stretch.x < 0) ? -1 : 1,
                                                (stretch.y !== undefined && stretch.y < 0) ? -1 : 1,
                                                (stretch.z !== undefined && stretch.z < 0) ? -1 : 1
                                            );
                                            mesh.castShadow = true;
                                            nodeObj.add(mesh);
                                        }
                                    }

                                    if (node.children && Array.isArray(node.children)) {
                                        // Según la especificación oficial de Hytale en Blockbench:
                                        // si es isPiece, los hijos no heredan el offset del hueso origen
                                        const nextOffset = nodeIsPiece ? { x: 0, y: 0, z: 0 } : thisOffset;
                                        processAttachmentNodes(node.children, nodeObj, nextOffset);
                                    }

                                    attachTarget.add(nodeObj);
                                }
                            }

                            processAttachmentNodes(attData.nodes, threeModelGroup, { x: 0, y: 0, z: 0 });
                        };

                        if (att.textureDataUrl) {
                            const attImg = new Image();
                            attImg.onload = () => {
                                const aTex = new THREE.Texture(attImg);
                                aTex.magFilter = THREE.NearestFilter;
                                aTex.minFilter = THREE.NearestFilter;
                                aTex.generateMipmaps = false;
                                aTex.needsUpdate = true;
                                buildAttachment(aTex, attImg.width || 64, attImg.height || 64);
                            };
                            attImg.src = att.textureDataUrl;
                        } else {
                            buildAttachment(null, 64, 64);
                        }
                    } catch (e) {
                        console.warn('[HyCreator] Error montando attachment:', e);
                    }
                }
            }

            const bbox = new THREE.Box3().setFromObject(threeModelGroup);
            const size = bbox.getSize(new THREE.Vector3());

            // Centrar geométricamente para rotación natural de la cámara
            const center = bbox.getCenter(new THREE.Vector3());
            threeModelGroup.position.set(-center.x, -bbox.min.y, -center.z);

            document.getElementById('det-dims').textContent = `${Math.round(size.x * 10) / 10} × ${Math.round(size.y * 10) / 10} × ${Math.round(size.z * 10) / 10}`;
            document.getElementById('det-nodes').textContent = `${nodeCount} (${boxCount} partes 3D)`;
            document.getElementById('row-node-count').style.display = 'flex';
            document.getElementById('row-total-blocks').style.display = 'none';
            document.getElementById('row-anchor').style.display = 'none';
            document.getElementById('card-block-breakdown').style.display = 'none';

            resetCameraView(Math.max(size.x, 2), Math.max(size.y, 2), Math.max(size.z, 2));
        };

        if (textureDataUrl) {
            const img = new Image();
            img.onload = () => {
                const tex = new THREE.Texture(img);
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
                tex.generateMipmaps = false;
                tex.needsUpdate = true;
                buildWithTexture(tex, img.width || 64, img.height || 64);
            };
            img.onerror = () => {
                buildWithTexture(null, 128, 128);
            };
            img.src = textureDataUrl;
        } else {
            buildWithTexture(null, 128, 128);
        }
    }

    // Renderizar Sprite 2D de Item en Espacio 3D
    function renderItemIcon3D(iconDataUrl, name) {
        const img = new Image();
        img.onload = () => {
            const tex = new THREE.Texture(img);
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            tex.needsUpdate = true;

            const geo = new THREE.PlaneGeometry(8, 8);
            const mat = new THREE.MeshStandardMaterial({
                map: tex,
                transparent: true,
                alphaTest: 0.05,
                side: THREE.DoubleSide,
                roughness: 0.3
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = 4;
            mesh.castShadow = true;
            threeModelGroup.add(mesh);

            document.getElementById('det-dims').textContent = `${img.width} × ${img.height} px`;
            document.getElementById('det-nodes').textContent = 'Sprite 2D en 3D';
            document.getElementById('row-node-count').style.display = 'flex';
            document.getElementById('row-total-blocks').style.display = 'none';
            document.getElementById('card-block-breakdown').style.display = 'none';

            resetCameraView(10, 10, 10);
        };
        img.src = iconDataUrl;
    }

    // Renderizar Elementos Blockbench
    function renderBlockbench(data) {
        const elements = data.elements || [];
        for (const el of elements) {
            const from = el.from || [0, 0, 0];
            const to = el.to || [1, 1, 1];
            const sx = Math.abs(to[0] - from[0]);
            const sy = Math.abs(to[1] - from[1]);
            const sz = Math.abs(to[2] - from[2]);

            const geo = new THREE.BoxGeometry(sx, sy, sz);
            const mat = new THREE.MeshStandardMaterial({
                color: getHytaleBlockColor(el.name || 'wood'),
                roughness: 0.6,
                wireframe: threeWireframe
            });

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2);
            threeModelGroup.add(mesh);
        }

        const bbox = new THREE.Box3().setFromObject(threeModelGroup);
        const size = bbox.getSize(new THREE.Vector3());

        document.getElementById('det-dims').textContent = `${Math.round(size.x * 10) / 10} × ${Math.round(size.y * 10) / 10} × ${Math.round(size.z * 10) / 10}`;
        document.getElementById('det-nodes').textContent = elements.length;
        document.getElementById('row-node-count').style.display = 'flex';
        document.getElementById('row-total-blocks').style.display = 'none';
        document.getElementById('card-block-breakdown').style.display = 'none';

        resetCameraView(size.x, size.y, size.z);
    }

    // Renderizar Cubo Genérico para Items
    function renderGenericBox(name) {
        const geo = new THREE.BoxGeometry(2, 2, 2);
        const mat = new THREE.MeshStandardMaterial({
            color: getHytaleBlockColor(name),
            roughness: 0.4,
            metalness: 0.3,
            wireframe: threeWireframe
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 1;
        threeModelGroup.add(mesh);

        document.getElementById('det-dims').textContent = '2 × 2 × 2';
        document.getElementById('row-total-blocks').style.display = 'none';
        document.getElementById('row-node-count').style.display = 'none';
        document.getElementById('row-anchor').style.display = 'none';
        document.getElementById('card-block-breakdown').style.display = 'none';

        resetCameraView(2, 2, 2);
    }

    // Renderizar desglose de materiales
    function renderBlockBreakdown(types) {
        const card = document.getElementById('card-block-breakdown');
        const list = document.getElementById('block-types-list');
        const title = document.getElementById('title-block-breakdown');
        if (!card || !list) return;

        card.style.display = 'flex';
        title.textContent = `Tipos de Bloques (${types.length})`;
        list.innerHTML = '';

        types.slice(0, 50).forEach(t => {
            const hex = getHytaleBlockColor(t.name).toString(16).padStart(6, '0');
            const row = document.createElement('div');
            row.className = 'block-type-row';
            row.innerHTML = `
                <div class="block-swatch-name">
                    <span class="block-color-swatch" style="background-color: #${hex}"></span>
                    <span class="block-name-txt" title="${escapeHTML(t.name)}">${escapeHTML(t.name)}</span>
                </div>
                <span class="block-count-txt">${t.count}</span>
            `;
            list.appendChild(row);
        });
    }

    // --- CAPTURAR IMAGEN DEL CANVAS 3D (SIN FONDO / PNG TRANSPARENTE) ---
    function captureSceneImage({ transparent = true } = {}) {
        if (!threeRenderer || !threeScene || !threeCamera) return null;

        const origBg = threeScene.background;
        const origGridVisible = threeGridHelper ? threeGridHelper.visible : false;

        // Remover fondo y ocultar grid para canal alfa limpio
        if (transparent) {
            threeScene.background = null;
            if (threeGridHelper) threeGridHelper.visible = false;
        }

        // Renderizar inmediatamente en el drawing buffer
        threeRenderer.render(threeScene, threeCamera);

        // Extraer DataURL PNG con transparencia
        const dataUrl = threeRenderer.domElement.toDataURL('image/png');

        // Restaurar estado
        threeScene.background = origBg;
        if (threeGridHelper) threeGridHelper.visible = origGridVisible;
        threeRenderer.render(threeScene, threeCamera);

        return dataUrl;
    }

    // Copiar al portapapeles sin fondo
    async function copy3dImageWithoutBackground() {
        const dataUrl = captureSceneImage({ transparent: true });
        if (!dataUrl) {
            showToast3D('No hay modelo cargado para capturar', false);
            return;
        }

        let copied = false;

        // Método 1: IPC Nativo de Electron (clipboard.writeImage)
        if (isElectron && window.electronAPI.writeClipboardImage) {
            try {
                copied = await window.electronAPI.writeClipboardImage(dataUrl);
            } catch (err) {
                console.warn('Error en IPC clipboard:', err);
            }
        }

        // Método 2: Web Clipboard API (ClipboardItem)
        if (!copied && window.ClipboardItem && navigator.clipboard) {
            try {
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                copied = true;
            } catch (err) {
                console.warn('Error en navigator.clipboard:', err);
            }
        }

        if (copied) {
            showToast3D('¡Imagen 3D sin fondo copiada al portapapeles! 📸', true);
        } else {
            showToast3D('Error al copiar la imagen al portapapeles', false);
        }
    }

    // Guardar archivo PNG sin fondo en disco
    async function save3dImageWithoutBackground() {
        const dataUrl = captureSceneImage({ transparent: true });
        if (!dataUrl) return;

        const defaultFileName = hycreatorSelectedItem ? (hycreatorSelectedItem.name.replace(/\.[^/.]+$/, '') + '_sin_fondo.png') : 'modelo_3d.png';

        if (isElectron && window.electronAPI.saveImageDialog) {
            const saved = await window.electronAPI.saveImageDialog({
                dataUrl,
                defaultName: defaultFileName
            });
            if (saved) {
                showToast3D('¡Imagen guardada exitosamente! 💾', true);
            }
        } else {
            // Fallback para navegador web estándar: trigger download
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = defaultFileName;
            a.click();
            showToast3D('¡Imagen descargada! 💾', true);
        }
    }

    // Mostrar menú contextual 3D
    function show3dContextMenu(clientX, clientY) {
        const ctxMenu = document.getElementById('context-menu-3d');
        if (!ctxMenu) return;

        const title = document.getElementById('ctx-3d-title');
        if (title && hycreatorSelectedItem) {
            title.textContent = hycreatorSelectedItem.name;
        }

        ctxMenu.style.left = `${clientX}px`;
        ctxMenu.style.top = `${clientY}px`;
        ctxMenu.classList.remove('hidden');

        // Prevenir que se desborde fuera de la ventana
        const rect = ctxMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            ctxMenu.style.left = `${window.innerWidth - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
            ctxMenu.style.top = `${window.innerHeight - rect.height - 10}px`;
        }

        if (window.lucide) lucide.createIcons();
    }

    // Toast flotante de notificación
    let toastTimeout = null;
    function showToast3D(message, isSuccess = true) {
        const toast = document.getElementById('toast-3d-notify');
        const msgEl = document.getElementById('toast-3d-message');
        if (!toast || !msgEl) return;

        msgEl.textContent = message;
        toast.style.borderColor = isSuccess ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
        toast.classList.remove('hidden');

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 2800);
    }

    // Cargar archivo 3D personalizado (manual o drag & drop)
    function loadCustom3dFile(fileObj) {
        if (!fileObj) return;

        let name = fileObj.name || 'modelo_personalizado.json';
        let rawContent = fileObj.content;

        const loadContentAndDisplay = (content, sizeBytes) => {
            hycreatorSelectedItem = {
                rel: fileObj.path || name,
                name: name,
                kind: name.includes('prefab') ? 'Prefabs' : (name.includes('blockymodel') ? 'blockymodel' : 'Custom 3D')
            };

            hycreatorActiveAsset = {
                rel_path: name,
                format: '.json',
                content,
                size_bytes: sizeBytes || content.length
            };

            const nameChip = document.getElementById('active-model-name');
            if (nameChip) nameChip.textContent = name;

            document.getElementById('det-name').textContent = name;
            document.getElementById('det-rel').textContent = fileObj.path || name;
            document.getElementById('det-format').textContent = hycreatorSelectedItem.kind;
            document.getElementById('det-size').textContent = formatBytes(hycreatorActiveAsset.size_bytes);

            renderModelDataInThreeScene(content, hycreatorSelectedItem);
            showToast3D(`¡Modelo '${name}' cargado con éxito! ✨`, true);
        };

        if (rawContent) {
            loadContentAndDisplay(rawContent, fileObj.size || rawContent.length);
        } else if (fileObj.path && isElectron && window.electronAPI.readFile) {
            window.electronAPI.readFile(fileObj.path).then(res => {
                if (res && res.content) {
                    loadContentAndDisplay(res.content, res.content.length);
                }
            });
        }
    }

    // Configurar Drag & Drop sobre el canvas 3D
    function setup3dDragAndDrop() {
        const container = document.getElementById('threejs-container');
        const dropZone = document.getElementById('models3d-drop-zone');
        if (!container || !dropZone) return;

        ['dragenter', 'dragover'].forEach(evt => {
            container.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('hidden');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            container.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('hidden');
            });
        });

        container.addEventListener('drop', (e) => {
            const files = e.dataTransfer && e.dataTransfer.files;
            if (files && files.length > 0) {
                const file = files[0];
                const reader = new FileReader();
                reader.onload = (readEvt) => {
                    loadCustom3dFile({
                        name: file.name,
                        path: file.path || file.name,
                        content: readEvt.target.result,
                        size: file.size
                    });
                };
                reader.readAsText(file);
            }
        });
    }
});
