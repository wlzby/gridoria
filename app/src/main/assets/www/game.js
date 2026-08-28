// Gridoria Core Game Engine v6 — Optimized, Robust & Crash-Proof Edition
class GridoriaGame {
    constructor() {
        this.COLS = 5;
        this.ROWS = 6;
        this.grid = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
        this.iceGrid = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));

        this.score = 0;
        this.highScore = 0;
        this.gems = 0;
        this.bestTile = 2048;
        this.comboMeter = 0;
        this.comboMultiplier = 1;
        this.mergedThisTurn = false;
        this.mergesThisTurn = 0;
        this.comboFireUntil = 0;
        this._feverInterval = null;
        this._feverSecsLeft = 0;

        this.missionProgress = { merges: 0, maxTile: 0, score: 0, claimed: [], notified: [] };
        this.unlockedThemes = ['obsidian', 'aurora', 'nebula', 'walnut', 'oak', 'cherry', 'ebony', 'forest', 'earth', 'clouds', 'ocean', 'puppy', 'cat'];
        this.currentTheme = 'obsidian';

        this.currentShooterVal = 2;
        this.nextShooterVal = 4;
        this.selectedCol = 2; // middle column default

        this.tilesSpawnedSinceLastFrozen = 0;
        this.nextFrozenSpawnInterval = 12 + Math.floor(Math.random() * 4);
        this.recentSpawnedVals = [];

        this.currentTargetGoal = parseInt(this.safeGet('gridoria_target_goal') || '256', 10);

        this.previousState = null;
        this.isAnimating = false;
        this.isGameOver = false;
        this.animSafetyTimer = null;
        this.hasSavedActiveGame = false;

        this.initDOM();
        if (typeof powerups !== 'undefined' && powerups.createBoardShield) {
            powerups.createBoardShield();
        }
        this.loadSavedData();
        this.initInitialBoard();
        this.bindEvents();
        this.updateUI();
        this.showMainMenu();
        this.updateUI();
        this.showMainMenu();
        this.setupLifecycleListeners();
    }

    // ── Safe LocalStorage Helpers ─────────────────────────────────────
    safeGet(key, fallback = null) {
        try {
            const val = localStorage.getItem(key);
            return val !== null ? val : fallback;
        } catch (e) {
            console.warn('LocalStorage get error:', e);
            return fallback;
        }
    }

    safeSet(key, value) {
        try {
            localStorage.setItem(key, String(value));
        } catch (e) {
            console.warn('LocalStorage set error:', e);
        }
    }

    safeRemove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('LocalStorage remove error:', e);
        }
    }

    initDOM() {
        this.gridBoardEl = document.getElementById('grid-board');
        this.columnIndicators = document.querySelectorAll('.col-indicator');
        this.currentShooterEl = document.getElementById('shooter-current');
        this.nextShooterValEl = document.getElementById('next-tile-val');

        this.scoreEl = document.getElementById('current-score');
        this.highScoreEl = document.getElementById('high-score');
        this.gemsEl = document.getElementById('diamond-count');
        this.comboBarEl = document.getElementById('combo-bar-fill');
        this.comboMultEl = document.getElementById('combo-multiplier');
        this.statusEl = document.getElementById('play-status-text');
        this.nextTileEl = document.getElementById('next-tile');

        // Create 35 cells inside grid board (7 rows x 5 cols)
        if (this.gridBoardEl) {
            this.gridBoardEl.innerHTML = '';
            for (let r = 0; r < this.ROWS; r++) {
                for (let c = 0; c < this.COLS; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'grid-cell';
                    cell.dataset.row = r;
                    cell.dataset.col = c;
                    this.gridBoardEl.appendChild(cell);
                }
            }
        }
    }

    loadSavedData() {
        const savedHigh = this.safeGet('gridoria_highscore');
        if (savedHigh) this.highScore = parseInt(savedHigh, 10) || 0;

        const savedGems = this.safeGet('gridoria_gems');
        this.gems = savedGems !== null ? Math.max(0, parseInt(savedGems, 10)) : 150;
        this.safeSet('gridoria_gems', String(this.gems));

        const savedBest = this.safeGet('gridoria_best_tile');
        this.bestTile = savedBest ? (parseInt(savedBest, 10) || 2048) : 2048;

        const today = new Date().toISOString().slice(0, 10);
        const savedMissions = this.safeGet('gridoria_missions');
        if (savedMissions) {
            try {
                this.missionProgress = JSON.parse(savedMissions);
            } catch (e) {
                this.missionProgress = { merges: 0, maxTile: 0, score: 0, claimed: [], notified: [] };
            }
        }
        if (this.missionProgress.day !== today) {
            this.missionProgress = { day: today, merges: 0, maxTile: 0, score: 0, claimed: [], notified: [] };
        }
        if (!Array.isArray(this.missionProgress.notified)) this.missionProgress.notified = [];
        if (!Array.isArray(this.missionProgress.claimed)) this.missionProgress.claimed = [];

        const savedUsername = this.safeGet('gridoria_username');
        if (!savedUsername) {
            const randomCode = Math.floor(1000 + Math.random() * 9000);
            this.username = `Misafir_${randomCode}`;
            this.safeSet('gridoria_username', this.username);
        } else {
            this.username = savedUsername;
        }

        const savedAvatar = this.safeGet('gridoria_avatar');
        this.userAvatar = savedAvatar || '🧙‍♂️';

        const savedHasSetup = this.safeGet('gridoria_has_setup_profile');
        this.hasSetupProfile = savedHasSetup === 'true';
        this.selectedAvatarTemp = this.userAvatar;

        const savedGameOverCount = this.safeGet('gridoria_gameover_count');
        this.gameOverCount = parseInt(savedGameOverCount || '0', 10);

        this.currentBgTheme = this.safeGet('gridoria_bg_theme') || this.safeGet('gridoria_theme') || 'obsidian';
        this.currentColorPalette = this.safeGet('gridoria_color_palette', 'default');
        document.body.dataset.bgTheme = this.currentBgTheme;
        document.body.dataset.theme = this.currentBgTheme;
        document.body.dataset.colorPalette = this.currentColorPalette;

        this.isVip = this.safeGet('gridoria_is_vip') === 'true';
        this.nextTilePeekUntil = parseInt(this.safeGet('gridoria_next_peek_until') || '0', 10);
        this.updateBannerVisibility();
        this.initSplashScreen();
        this.initMenuDemoAnimation();
        this.initPeekTimerLoop();

        const savedUnlocked = this.safeGet('gridoria_unlocked_bgs');
        if (savedUnlocked) {
            try {
                this.unlockedBgs = JSON.parse(savedUnlocked);
            } catch (e) {
                this.unlockedBgs = ['obsidian', 'walnut', 'wood', 'forest'];
            }
        } else {
            this.unlockedBgs = ['obsidian', 'walnut', 'wood', 'forest'];
        }

        if (this.currentBgTheme === 'custom') {
            this.applyCustomBgPhoto();
        }
        this.updateCustomBgCardPreview();
        this.updateThemeCardsUI();

        document.querySelectorAll('.palette-card, .color-card').forEach(card => {
            card.classList.toggle('active', card.dataset.color === this.currentColorPalette);
        });

        // Load active game state on startup so score & board tiles persist
        const savedActive = this.safeGet('gridoria_active_game');
        this.hasSavedActiveGame = false;
        if (savedActive) {
            try {
                const parsed = JSON.parse(savedActive);
                if (parsed && Array.isArray(parsed.grid) && parsed.grid.length === this.ROWS) {
                    let hasTiles = false;
                    for (let r = 0; r < this.ROWS; r++) {
                        if (Array.isArray(parsed.grid[r])) {
                            for (let c = 0; c < this.COLS; c++) {
                                if (parsed.grid[r][c] > 0) hasTiles = true;
                            }
                        }
                    }
                    if (hasTiles || (parsed.score && parsed.score > 0)) {
                        this.grid = parsed.grid.map(row => [...row]);
                        if (Array.isArray(parsed.iceGrid)) {
                            this.iceGrid = parsed.iceGrid.map(row => [...row]);
                        } else {
                            this.iceGrid = Array(this.ROWS).fill(null).map((_, r) =>
                                Array(this.COLS).fill(0).map((_, c) => (this.grid[r][c] < 0 ? 3 : 0))
                            );
                        }
                        this.score = Number(parsed.score || 0);
                        this.currentShooterVal = Number(parsed.currentShooterVal || 2);
                        this.nextShooterVal = Number(parsed.nextShooterVal || 4);
                        this.comboMeter = Number(parsed.comboMeter || 0);
                        this.comboMultiplier = Number(parsed.comboMultiplier || 1);
                        this.hasSavedActiveGame = true;
                    }
                }
            } catch (e) {
                console.warn('Failed to parse saved active game:', e);
            }
        }
    }

    updateBannerVisibility() {
        const gameView = document.getElementById('game-view');
        const isGameActive = gameView && !gameView.classList.contains('hidden');
        const isVip = this.isVip || (this.safeGet('gridoria_is_vip') === 'true');
        const shouldShow = isGameActive && !isVip;

        const bannerContainer = document.getElementById('banner-ad-container');
        if (bannerContainer) {
            bannerContainer.style.display = shouldShow ? 'flex' : 'none';
        }

        if (typeof NativeBridge !== 'undefined' && typeof NativeBridge.setBannerVisible === 'function') {
            NativeBridge.setBannerVisible(shouldShow);
        } else if (window.AndroidBridge && typeof window.AndroidBridge.setBannerVisible === 'function') {
            try {
                window.AndroidBridge.setBannerVisible(shouldShow);
            } catch (e) {
                console.warn('AndroidBridge banner toggle error:', e);
            }
        }
    }

    initSplashScreen() {
        const splash = document.getElementById('splash-screen');
        if (!splash) return;

        // Auto fade out splash screen after loading animation (2.0s)
        const hideTimeout = setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => {
                if (splash && splash.parentNode) splash.remove();
            }, 650);
        }, 2000);

        // Allow instant skip on user tap
        splash.addEventListener('click', () => {
            clearTimeout(hideTimeout);
            splash.classList.add('fade-out');
            setTimeout(() => {
                if (splash && splash.parentNode) splash.remove();
            }, 650);
        });
    }

    saveActiveGameState() {
        if (this.isGameOver) {
            this.clearActiveGameState();
            return;
        }
        const hasTiles = this.grid.some(row => row.some(val => val > 0));
        if (hasTiles || this.score > 0) {
            const maxOnBoard = this.getMaxTileOnBoard();
            const activeState = {
                grid: this.grid,
                iceGrid: this.iceGrid,
                score: this.score,
                currentShooterVal: this.currentShooterVal,
                nextShooterVal: this.nextShooterVal,
                comboMeter: this.comboMeter,
                comboMultiplier: this.comboMultiplier,
                maxTile: maxOnBoard
            };
            this.safeSet('gridoria_active_game', JSON.stringify(activeState));
        }
    }

    clearActiveGameState() {
        this.hasSavedActiveGame = false;
        this.safeRemove('gridoria_active_game');
    }

    getActiveGameState() {
        const saved = this.safeGet('gridoria_active_game');
        if (!saved) return null;
        try {
            return JSON.parse(saved);
        } catch (e) {
            return null;
        }
    }

    saveData() {
        this.safeSet('gridoria_highscore', this.highScore.toString());
        this.safeSet('gridoria_gems', this.gems.toString());
        this.safeSet('gridoria_best_tile', this.bestTile.toString());
        this.safeSet('gridoria_missions', JSON.stringify(this.missionProgress));
        this.safeSet('gridoria_themes', JSON.stringify(this.unlockedThemes));
        this.safeSet('gridoria_theme', this.currentTheme);
        this.saveActiveGameState();
    }

    setupLifecycleListeners() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveActiveGameState();
            }
        });
        window.addEventListener('pagehide', () => {
            this.saveActiveGameState();
        });
    }

    initInitialBoard() {
        if (!this.hasSavedActiveGame) {
            this.currentShooterVal = 2;
            this.nextShooterVal = 4;
        }

        this.renderGrid();
        this.updateShooterTiles();
        this.highlightColumn(this.selectedCol);
    }

    getCellElement(row, col) {
        if (!this.gridBoardEl) return null;
        return this.gridBoardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    renderGrid() {
        const maxBoardTile = this.getMaxTileOnBoard();

        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                const cell = this.getCellElement(r, c);
                if (!cell) continue;

                const rawVal = this.grid[r][c];
                cell.innerHTML = '';

                if (rawVal !== 0) {
                    const isFrozen = rawVal < 0;
                    const val = Math.abs(rawVal);
                    const isMaxCrownTile = val === maxBoardTile && val >= 16;
                    const hp = isFrozen ? (this.iceGrid[r][c] || 3) : 0;
                    const tile = document.createElement('div');
                    tile.className = `tile val-${val}${isFrozen ? ` is-frozen ice-hp-${hp}` : ''}${isMaxCrownTile ? ' is-king-crown' : ''}`;
                    const displayVal = this.formatTileVal(val);
                    if (isFrozen) {
                        const dots = '❄️'.repeat(hp);
                        tile.innerHTML = `
                            ${isMaxCrownTile ? '<span class="king-crown-badge">👑</span>' : ''}
                            <span class="tile-number">${displayVal}</span>
                            <span class="ice-hp-dots">${dots}</span>
                        `;
                    } else {
                        tile.innerHTML = `
                            ${isMaxCrownTile ? '<span class="king-crown-badge">👑</span>' : ''}
                            <span class="tile-number">${displayVal}</span>
                        `;
                    }
                    cell.appendChild(tile);
                }
            }
        }
    }

    highlightColumn(col) {
        this.selectedCol = col;

        // Bottom line indicators
        if (this.columnIndicators) {
            this.columnIndicators.forEach((ind, index) => {
                ind.classList.toggle('active', index === col);
            });
        }

        // Full Vertical Column Track Shaded Highlight
        if (this.gridBoardEl) {
            const allCells = this.gridBoardEl.querySelectorAll('.grid-cell');
            allCells.forEach(cell => {
                cell.classList.remove('landing-preview');
                const cellCol = parseInt(cell.dataset.col, 10);
                cell.classList.toggle('col-highlight', cellCol === col);
            });

            const landingRow = this.getLandingRow(col);
            if (landingRow !== -1) {
                const landingCell = this.getCellElement(landingRow, col);
                if (landingCell && this.grid[landingRow][col] === 0) {
                    landingCell.classList.add('landing-preview');
                }
            }
        }
    }

    getLandingRow(col) {
        for (let r = 0; r < this.ROWS; r++) {
            if (this.grid[r][col] === 0) return r;
        }
        return -1;
    }

    bindEvents() {
        let activeTouch = false;
        let suppressClickUntil = 0;

        const getColumnFromX = (clientX) => {
            const rect = this.gridBoardEl.getBoundingClientRect();
            const touchX = clientX - rect.left;
            const colWidth = rect.width / this.COLS;
            return Math.max(0, Math.min(this.COLS - 1, Math.floor(touchX / colWidth)));
        };

        const getCellFromPoint = (clientX, clientY) => {
            const rect = this.gridBoardEl.getBoundingClientRect();
            const col = getColumnFromX(clientX);
            const rowHeight = rect.height / this.ROWS;
            const row = Math.floor((clientY - rect.top) / rowHeight);
            if (clientY < rect.top || clientY > rect.bottom || row < 0 || row >= this.ROWS) return null;
            return { row, col };
        };

        const consumePowerupBoardEvent = (clientX, clientY, event) => {
            if (typeof powerups === 'undefined' || !powerups.activeMode) return false;
            const cell = getCellFromPoint(clientX, clientY);
            if (cell) powerups.handleTileClick(cell.row, cell.col);
            event.preventDefault();
            event.stopImmediatePropagation();
            return true;
        };

        const updateShooterDrag = (clientX, clientY) => {
            const col = getColumnFromX(clientX);
            this.highlightColumn(col);

            const shooterRect = this.currentShooterEl.getBoundingClientRect();
            if (!this.initialShooterCenterX) {
                this.initialShooterCenterX = shooterRect.left + shooterRect.width / 2;
                this.initialShooterCenterY = shooterRect.top + shooterRect.height / 2;
            }

            const moveX = clientX - this.initialShooterCenterX;
            const moveY = (clientY - 75) - this.initialShooterCenterY;

            this.currentShooterEl.classList.add('dragging');
            this.currentShooterEl.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.08)`;
            return col;
        };

        const resetShooter = () => {
            this.initialShooterCenterX = null;
            this.initialShooterCenterY = null;
            if (this.currentShooterEl) {
                this.currentShooterEl.classList.remove('dragging');
                this.currentShooterEl.style.transform = 'none';
            }
        };

        const handleFire = (clientX, clientY) => {
            resetShooter();
            if (this.isAnimating) return;

            const col = getColumnFromX(clientX);
            const cell = getCellFromPoint(clientX, clientY);
            if (typeof powerups !== 'undefined' && powerups.activeMode) {
                if (cell) powerups.handleTileClick(cell.row, cell.col);
                return;
            }
            this.highlightColumn(col);
            if (typeof sounds !== 'undefined' && sounds.init) sounds.init();
            this.shootCurrentTile(col);
        };

        const boardWrapper = document.querySelector('.grid-board-wrapper') || this.gridBoardEl;
        const activeShooterBox = document.querySelector('.active-shooter-box') || this.currentShooterEl;

        const isInteractiveControl = (target) => {
            if (!target) return false;
            return target.closest('#shooter-next, .shooter-next-box, .modal-overlay, .powerups-footer, .bottom-nav-bar, .icon-btn, button, input');
        };

        if (this.gridBoardEl) {
            this.gridBoardEl.addEventListener('touchend', (e) => {
                const touch = e.changedTouches[0];
                if (touch && consumePowerupBoardEvent(touch.clientX, touch.clientY, e)) {
                    activeTouch = false;
                    suppressClickUntil = Date.now() + 700;
                    resetShooter();
                }
            }, { capture: true, passive: false });
            this.gridBoardEl.addEventListener('click', (e) => {
                consumePowerupBoardEvent(e.clientX, e.clientY, e);
            }, true);
        }

        const onTouchStart = (e) => {
            if (this.isAnimating) return;
            if (isInteractiveControl(e.target)) return;
            if (typeof powerups !== 'undefined' && powerups.activeMode) {
                activeTouch = false;
                resetShooter();
                return;
            }
            activeTouch = true;
            const touch = e.touches[0];
            if (typeof sounds !== 'undefined' && sounds.init) sounds.init();
            updateShooterDrag(touch.clientX, touch.clientY);
        };

        const onTouchMove = (e) => {
            if (typeof powerups !== 'undefined' && powerups.activeMode) return;
            if (!activeTouch) return;
            const touch = e.touches[0];
            updateShooterDrag(touch.clientX, touch.clientY);
        };

        const onTouchEnd = (e) => {
            if (!activeTouch) return;
            activeTouch = false;
            suppressClickUntil = Date.now() + 700;
            const touch = e.changedTouches[0];
            handleFire(touch.clientX, touch.clientY);
        };

        if (boardWrapper) {
            boardWrapper.addEventListener('touchstart', onTouchStart, { passive: true });
            boardWrapper.addEventListener('touchmove', onTouchMove, { passive: true });
            boardWrapper.addEventListener('touchend', onTouchEnd, { passive: true });
            boardWrapper.addEventListener('click', (e) => {
                if (activeTouch || Date.now() < suppressClickUntil || isInteractiveControl(e.target)) return;
                handleFire(e.clientX, e.clientY);
            });
        }

        if (activeShooterBox) {
            activeShooterBox.addEventListener('touchstart', onTouchStart, { passive: true });
            activeShooterBox.addEventListener('touchmove', onTouchMove, { passive: true });
            activeShooterBox.addEventListener('touchend', onTouchEnd, { passive: true });
            activeShooterBox.addEventListener('click', (e) => {
                if (activeTouch || Date.now() < suppressClickUntil || isInteractiveControl(e.target)) return;
                handleFire(e.clientX, e.clientY);
            });
        }

        const listen = (id, event, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, fn);
        };

        // Audio Button
        listen('btn-audio', 'click', () => {
            if (typeof sounds !== 'undefined') {
                sounds.init();
                const isEnabled = sounds.toggleSound();
                const btn = document.getElementById('btn-audio');
                if (btn) btn.style.opacity = isEnabled ? '1' : '0.4';
            }
        });

        // 🛒 Full Screen Shop View & Interactive Handlers (Integrated with Bottom Nav Bar)
        const openShopModal = () => {
            closeAllModals();
            setActiveNavTab('shop');
            const navBar = document.getElementById('bottom-nav-bar');
            if (navBar) navBar.classList.remove('hidden');
            const modal = document.getElementById('modal-shop');
            const shopGemsVal = document.getElementById('shop-gems-val');
            if (shopGemsVal) shopGemsVal.innerText = this.gems.toLocaleString('tr-TR');
            if (modal) modal.classList.remove('hidden');
        };

        const closeShopModal = () => {
            closeAllModals();
            setActiveNavTab('home');
            this.showMainMenu();
        };

        listen('btn-open-shop', 'click', openShopModal);
        listen('btn-open-shop-top', 'click', openShopModal);
        listen('btn-close-shop', 'click', closeShopModal);

        // Gem Card Purchase Handlers
        document.querySelectorAll('.gem-card').forEach(card => {
            const gemsAmount = parseInt(card.dataset.gems, 10) || 0;
            const buyBtn = card.querySelector('.gem-buy-btn');
            if (buyBtn && gemsAmount > 0) {
                buyBtn.addEventListener('click', () => {
                    this.addGems(gemsAmount);
                    const shopGemsVal = document.getElementById('shop-gems-val');
                    if (shopGemsVal) shopGemsVal.innerText = this.gems.toLocaleString('tr-TR');
                    this.showToast(`${gemsAmount.toLocaleString('tr-TR')} Elmas Hesabınıza Eklenmiştir!`, '💎');
                });
            }
        });

        // Booster Card Purchase Handlers (Using Gems)
        document.querySelectorAll('.booster-card').forEach(card => {
            const boosterType = card.dataset.booster;
            const count = parseInt(card.dataset.count, 10) || 5;
            const cost = parseInt(card.dataset.cost, 10) || 0;
            const buyBtn = card.querySelector('.booster-buy-btn');

            if (buyBtn && cost > 0) {
                buyBtn.addEventListener('click', () => {
                    if (this.gems < cost) {
                        this.showToast(`Yetersiz Elmas! Bu joker paketi için ${cost} 💎 gerekiyor.`, '⚠️', 'YETERSIZ ELMAS');
                        return;
                    }
                    if (this.deductGems(cost)) {
                        const shopGemsVal = document.getElementById('shop-gems-val');
                        if (shopGemsVal) shopGemsVal.innerText = this.gems.toLocaleString('tr-TR');

                        if (typeof powerups !== 'undefined' && typeof powerups.addFreeCount === 'function') {
                            if (boosterType === 'mega') {
                                powerups.addFreeCount('hammer', 3);
                                powerups.addFreeCount('bomb', 3);
                                powerups.addFreeCount('swap', 3);
                                this.showToast('Süper Joker Paketi Eklendi! (3x Çekiç, 3x Bomba, 3x Değiştirici)', '⚡', 'PAKET KAZANILDI');
                            } else {
                                powerups.addFreeCount(boosterType, count);
                                const nameMap = { hammer: 'Çekiç', bomb: 'Bomba', swap: 'Değiştirici', shrink: 'Küçült' };
                                const iconMap = { hammer: '🔨', bomb: '💣', swap: '🔄', shrink: '🧪' };
                                this.showToast(`${count}x ${nameMap[boosterType] || boosterType} Envanterinize Eklendi!`, iconMap[boosterType] || '🎁', 'JOKER EKLENDİ');
                            }
                        }
                    }
                });
            }
        });

        // Starter Pack Handler
        listen('btn-buy-starter-pack', 'click', () => {
            this.addGems(500);
            if (typeof powerups !== 'undefined') {
                powerups.addFreeCount('hammer', 3);
                powerups.addFreeCount('bomb', 3);
            }
            const shopGemsVal = document.getElementById('shop-gems-val');
            if (shopGemsVal) shopGemsVal.innerText = this.gems.toLocaleString('tr-TR');
            this.showToast('Başlangıç Hoş Geldin Paketi Eklendi! (+500 💎, 3x Çekiç, 3x Bomba)', '📦', 'PAKET ALINDI');
        });

        // VIP Pack Handler
        listen('btn-buy-vip', 'click', () => {
            this.isVip = true;
            this.safeSet('gridoria_is_vip', 'true');
            this.addGems(1000);
            const shopGemsVal = document.getElementById('shop-gems-val');
            if (shopGemsVal) shopGemsVal.innerText = this.gems.toLocaleString('tr-TR');
            this.updateCustomBgCardPreview();
            this.showToast('VIP Üyelik Aktif Edildi! Sınırsız Fotoğraf Teması & +1,000 💎 Eklenmiştir!', '👑');
        });

        // Restart Game
        listen('btn-restart', 'click', () => {
            const modal = document.getElementById('modal-gameover');
            if (modal) modal.classList.add('hidden');
            this.requestInterstitialAd();
            this.resetGame();
        });

        // 🎁 AdMob Rewarded Actions
        listen('btn-rewarded-revive', 'click', () => this.requestRewardedAd('revive'));
        listen('btn-rewarded-double-gems', 'click', () => this.requestRewardedAd('double_gems'));
        listen('btn-rewarded-free-gems', 'click', () => this.requestRewardedAd('free_gems'));

        document.querySelectorAll('[data-mission]').forEach(button => {
            button.addEventListener('click', () => this.claimMission(button.dataset.mission));
        });
        listen('btn-claim-daily', 'click', () => this.claimDailyReward());
        listen('btn-themes', 'click', () => {
            const modal = document.getElementById('modal-themes');
            if (modal) modal.classList.remove('hidden');
        });
        listen('btn-close-themes', 'click', () => {
            const modal = document.getElementById('modal-themes');
            if (modal) modal.classList.add('hidden');
        });

        // Segmented Capsule Tab Switchers (Arka Planlar vs Renkler)
        listen('tab-btn-bg', 'click', () => {
            const btnBg = document.getElementById('tab-btn-bg');
            const btnColor = document.getElementById('tab-btn-color');
            const contentBg = document.getElementById('tab-content-bg');
            const contentColor = document.getElementById('tab-content-color');

            if (btnBg) btnBg.classList.add('active');
            if (btnColor) btnColor.classList.remove('active');
            if (contentBg) contentBg.classList.remove('hidden');
            if (contentColor) contentColor.classList.add('hidden');
        });

        listen('tab-btn-color', 'click', () => {
            const btnBg = document.getElementById('tab-btn-bg');
            const btnColor = document.getElementById('tab-btn-color');
            const contentBg = document.getElementById('tab-content-bg');
            const contentColor = document.getElementById('tab-content-color');

            if (btnColor) btnColor.classList.add('active');
            if (btnBg) btnBg.classList.remove('active');
            if (contentColor) contentColor.classList.remove('hidden');
            if (contentBg) contentBg.classList.add('hidden');
        });

        // Background card selection
        document.querySelectorAll('.bg-card').forEach(card => {
            card.addEventListener('click', () => {
                const bgKey = card.dataset.bg;
                const cost = Number(card.dataset.cost || 0);
                this.selectBgTheme(bgKey, cost);
            });
        });

        // Color Palette card selection
        document.querySelectorAll('.palette-card').forEach(card => {
            card.addEventListener('click', () => {
                const colorKey = card.dataset.color;
                this.selectColorPalette(colorKey);
            });
        });

        // 🧭 Bottom Navigation Bar & New Modals Event Handlers
        const setActiveNavTab = (tabName) => {
            document.querySelectorAll('.nav-tab-item').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.tab === tabName);
            });
        };

        const closeAllModals = () => {
            const modals = ['modal-shop', 'modal-themes', 'modal-missions', 'modal-daily', 'modal-main-menu', 'modal-profile', 'modal-leaderboard', 'modal-settings'];
            modals.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.add('hidden');
            });
        };

        // Tab 1: Mağaza (Shop)
        listen('nav-tab-shop', 'click', () => {
            closeAllModals();
            setActiveNavTab('shop');
            openShopModal();
        });

        // Tab 2: Liderlik Tablosu
        const openLeaderboardModal = () => {
            closeAllModals();
            setActiveNavTab('leaderboard');
            const navBar = document.getElementById('bottom-nav-bar');
            if (navBar) navBar.classList.remove('hidden');
            this.updateLeaderboardDisplay();
            const modal = document.getElementById('modal-leaderboard');
            if (modal) modal.classList.remove('hidden');
        };

        const closeLeaderboardModal = () => {
            closeAllModals();
            setActiveNavTab('home');
            this.showMainMenu();
        };

        listen('nav-tab-leaderboard', 'click', openLeaderboardModal);
        listen('btn-close-leaderboard', 'click', closeLeaderboardModal);

        document.querySelectorAll('.lb-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const mode = tab.dataset.lb || 'all';
                this.updateLeaderboardDisplay(mode);
            });
        });

        // 🎯 JS Mouse + Touch Drag Engine for Leaderboard List
        const lbList = document.getElementById('leaderboard-list');
        if (lbList) {
            let startY = 0;
            let startScrollTop = 0;
            let isDragging = false;

            const onStart = (clientY) => {
                startY = clientY;
                startScrollTop = lbList.scrollTop;
                isDragging = true;
            };

            const onMove = (clientY) => {
                if (!isDragging) return;
                const deltaY = startY - clientY;
                lbList.scrollTop = startScrollTop + deltaY;
            };

            const onEnd = () => {
                isDragging = false;
            };

            // Touch events
            lbList.addEventListener('touchstart', (e) => {
                if (e.touches && e.touches.length > 0) onStart(e.touches[0].pageY);
            }, { passive: true });

            lbList.addEventListener('touchmove', (e) => {
                if (e.touches && e.touches.length > 0) onMove(e.touches[0].pageY);
            }, { passive: true });

            lbList.addEventListener('touchend', onEnd, { passive: true });

            // Mouse drag events for PC / Emulator testing
            lbList.addEventListener('mousedown', (e) => onStart(e.pageY));
            window.addEventListener('mousemove', (e) => onMove(e.pageY));
            window.addEventListener('mouseup', onEnd);
        }

        // Tab 3: Ana Sayfa (Home)
        listen('nav-tab-home', 'click', () => {
            closeAllModals();
            setActiveNavTab('home');
            this.showMainMenu();
        });

        // Tab 4: Profil
        listen('nav-tab-profile', 'click', () => {
            closeAllModals();
            setActiveNavTab('profile');
            this.updateProfileModalStats();
            const modal = document.getElementById('modal-profile');
            if (modal) modal.classList.remove('hidden');
        });

        // Tab 5: Ayarlar
        listen('nav-tab-settings', 'click', () => {
            closeAllModals();
            setActiveNavTab('settings');
            const modal = document.getElementById('modal-settings');
            if (modal) modal.classList.remove('hidden');
        });

        // Top Bar Header Event Listeners
        listen('btn-open-profile-top', 'click', () => {
            closeAllModals();
            setActiveNavTab('profile');
            this.updateProfileModalStats();
            const modal = document.getElementById('modal-profile');
            if (modal) modal.classList.remove('hidden');
        });

        listen('menu-btn-daily-widget', 'click', () => {
            this.openDailyRewardModal();
        });

        listen('btn-close-daily', 'click', () => {
            const modal = document.getElementById('modal-daily');
            if (modal) modal.classList.add('hidden');
        });

        const dailyModalOverlay = document.getElementById('modal-daily');
        if (dailyModalOverlay) {
            dailyModalOverlay.addEventListener('click', (e) => {
                if (e.target === dailyModalOverlay) {
                    dailyModalOverlay.classList.add('hidden');
                }
            });
        }

        // Modal Close Buttons
        listen('btn-close-profile', 'click', () => {
            closeAllModals();
            setActiveNavTab('home');
            this.showMainMenu();
        });

        listen('btn-profile-themes', 'click', () => {
            closeAllModals();
            const modal = document.getElementById('modal-themes');
            if (modal) modal.classList.remove('hidden');
        });

        listen('btn-profile-shop', 'click', () => {
            closeAllModals();
            setActiveNavTab('shop');
            openShopModal();
        });

        // ✏️ Edit Profile & Custom Photo Avatar Event Listeners
        document.querySelectorAll('#avatar-select-grid .avatar-option').forEach(opt => {
            opt.addEventListener('click', () => {
                if (opt.id === 'btn-upload-avatar') {
                    const inputCustomAvatar = document.getElementById('input-custom-avatar');
                    if (inputCustomAvatar) inputCustomAvatar.click();
                    return;
                }
                document.querySelectorAll('#avatar-select-grid .avatar-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                this.selectedAvatarTemp = opt.dataset.avatar;
            });
        });

        const inputCustomAvatar = document.getElementById('input-custom-avatar');
        if (inputCustomAvatar) {
            inputCustomAvatar.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        this.openCropModal(evt.target.result, 'avatar');
                    };
                    reader.readAsDataURL(file);
                }
                inputCustomAvatar.value = '';
            });
        }
        // ✂️ Crop Modal Event Listeners (Zoom, Rotate, Reset, Apply)
        listen('btn-close-crop', 'click', () => {
            const modal = document.getElementById('modal-crop-photo');
            if (modal) modal.classList.add('hidden');
        });

        listen('btn-cancel-crop', 'click', () => {
            const modal = document.getElementById('modal-crop-photo');
            if (modal) modal.classList.add('hidden');
        });

        listen('crop-zoom-slider', 'input', (e) => {
            this.cropScale = parseFloat(e.target.value);
            this.updateCropTransform();
        });

        listen('btn-crop-rotate', 'click', () => {
            this.cropRotation = ((this.cropRotation || 0) + 90) % 360;
            this.updateCropTransform();
        });

        listen('btn-crop-reset', 'click', () => {
            this.cropScale = 1.0;
            this.cropRotation = 0;
            this.cropPosX = 0;
            this.cropPosY = 0;
            const slider = document.getElementById('crop-zoom-slider');
            if (slider) slider.value = 1.0;
            this.updateCropTransform();
        });

        listen('btn-apply-crop', 'click', () => {
            this.applyCroppedImage();
        });

        const cropViewport = document.getElementById('crop-viewport');
        if (cropViewport) {
            let isDragging = false;
            let startX = 0;
            let startY = 0;

            const onStart = (clientX, clientY) => {
                isDragging = true;
                startX = clientX - (this.cropPosX || 0);
                startY = clientY - (this.cropPosY || 0);
            };

            const onMove = (clientX, clientY) => {
                if (!isDragging) return;
                this.cropPosX = clientX - startX;
                this.cropPosY = clientY - startY;
                this.updateCropTransform();
            };

            const onEnd = () => {
                isDragging = false;
            };

            cropViewport.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
            window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
            window.addEventListener('mouseup', onEnd);

            cropViewport.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) onStart(e.touches[0].clientX, e.touches[0].clientY);
            }, { passive: true });
            window.addEventListener('touchmove', (e) => {
                if (isDragging && e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
            }, { passive: true });
            window.addEventListener('touchend', onEnd);
        }

        listen('btn-change-avatar', 'click', () => {
            this.openEditProfileModal(false);
        });

        listen('btn-profile-avatar-circle', 'click', () => {
            this.openEditProfileModal(false);
        });

        listen('btn-edit-username-pen', 'click', (e) => {
            if (e) e.stopPropagation();
            this.openEditProfileModal(false);
        });

        listen('btn-save-profile', 'click', () => {
            this.saveProfileData();
        });

        listen('btn-close-edit-profile', 'click', () => {
            const modal = document.getElementById('modal-edit-profile');
            if (modal) modal.classList.add('hidden');
        });

        listen('btn-sticky-edit-name', 'click', (e) => {
            if (e) e.stopPropagation();
            this.openEditProfileModal(false);
        });

        listen('lb-sticky-user-bar', 'click', (e) => {
            if (e) e.stopPropagation();
            this.openEditProfileModal(false);
        });

        listen('btn-close-leaderboard', 'click', () => {
            const modal = document.getElementById('modal-leaderboard');
            if (modal) modal.classList.add('hidden');
            setActiveNavTab('home');
        });

        listen('btn-close-settings', 'click', () => {
            closeAllModals();
            setActiveNavTab('home');
            this.showMainMenu();
        });

        listen('btn-settings-edit-profile', 'click', () => {
            this.openEditProfileModal(false);
        });

        // 🔊 Top 2 Quick Toggle Icon Cards (Audio & Haptics)
        listen('btn-toggle-sound-card', 'click', () => {
            if (typeof sounds !== 'undefined' && typeof sounds.toggleSound === 'function') {
                const isMuted = sounds.toggleSound();
                const card = document.getElementById('btn-toggle-sound-card');
                const icon = document.getElementById('icon-sound-state');
                const title = document.getElementById('text-sound-title');

                if (card) {
                    card.classList.toggle('active', !isMuted);
                    card.classList.toggle('off', isMuted);
                }
                if (icon) icon.innerText = isMuted ? '🔇' : '🔊';
                if (title) title.innerText = isMuted ? 'SES KAPALI' : 'SES AÇIK';
            }
        });

        listen('btn-toggle-vibe-card', 'click', () => {
            if (typeof effects !== 'undefined' && typeof effects.toggleVibration === 'function') {
                const isEnabled = effects.toggleVibration();
                const card = document.getElementById('btn-toggle-vibe-card');
                const icon = document.getElementById('icon-vibe-state');
                const title = document.getElementById('text-vibe-title');

                if (card) {
                    card.classList.toggle('active', isEnabled);
                    card.classList.toggle('off', !isEnabled);
                }
                if (icon) icon.innerText = isEnabled ? '📳' : '🔕';
                if (title) title.innerText = isEnabled ? 'TİTREŞİM AÇIK' : 'TİTREŞİM KAPALI';
            }
        });

        // 🪵 Segmented Tabs (Ahşap Temaları / Renk Paletleri)
        const tabThemesBtn = document.getElementById('tab-settings-themes');
        const tabColorsBtn = document.getElementById('tab-settings-colors');
        const panelThemes = document.getElementById('panel-settings-themes');
        const panelColors = document.getElementById('panel-settings-colors');

        if (tabThemesBtn && tabColorsBtn && panelThemes && panelColors) {
            tabThemesBtn.addEventListener('click', () => {
                tabThemesBtn.classList.add('active');
                tabColorsBtn.classList.remove('active');
                panelThemes.classList.add('active');
                panelThemes.classList.remove('hidden');
                panelColors.classList.remove('active');
                panelColors.classList.add('hidden');
            });

            tabColorsBtn.addEventListener('click', () => {
                tabColorsBtn.classList.add('active');
                tabThemesBtn.classList.remove('active');
                panelColors.classList.add('active');
                panelColors.classList.remove('hidden');
                panelThemes.classList.remove('active');
                panelThemes.classList.add('hidden');
            });
        }

        // 🪵 Wood & Background Theme Selection inside Settings
        document.querySelectorAll('#panel-settings-themes .bg-card, .bg-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e) e.stopPropagation();
                const bgKey = card.dataset.bg;
                const cost = parseInt(card.dataset.cost || '0', 10);
                if (bgKey === 'custom' && this.currentBgTheme === 'custom') {
                    const fileInput = document.getElementById('input-custom-bg');
                    if (fileInput) fileInput.click();
                    return;
                }
                if (bgKey) {
                    this.selectBgTheme(bgKey, cost);
                }
            });
        });

        // 🎨 Color Palette Selection inside Settings (Tile Colors)
        document.querySelectorAll('.color-card, .palette-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e) e.stopPropagation();
                const colorKey = card.dataset.color;
                if (colorKey) {
                    this.selectColorPalette(colorKey);
                    document.querySelectorAll('.color-card, .palette-card').forEach(c => {
                        c.classList.toggle('active', c.dataset.color === colorKey);
                    });
                }
            });
        });

        // 👁️ Sıradaki Taş Görünürlüğü (Peek Unlock) Listeners
        listen('shooter-next', 'click', (e) => {
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            suppressClickUntil = Date.now() + 1000;
            if (this.isNextTilePeekActive()) {
                const remSecs = this.getPeekTimeRemainingSecs();
                const timerStr = this.formatPeekTimer(remSecs);
                this.showToast(`Sıradaki Taş Görünürlüğü Aktif! (${timerStr} kaldı)`, '👁️', 'AKTİF ÖZELLİK');
            } else {
                const modal = document.getElementById('modal-peek-unlock');
                if (modal) modal.classList.remove('hidden');
            }
        });

        listen('btn-close-peek-modal', 'click', (e) => {
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            suppressClickUntil = Date.now() + 1000;
            const modal = document.getElementById('modal-peek-unlock');
            if (modal) modal.classList.add('hidden');
        });

        listen('btn-cancel-peek-unlock', 'click', (e) => {
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            suppressClickUntil = Date.now() + 1000;
            const modal = document.getElementById('modal-peek-unlock');
            if (modal) modal.classList.add('hidden');
        });

        listen('btn-confirm-peek-unlock', 'click', (e) => {
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            suppressClickUntil = Date.now() + 1000;
            this.unlockNextTilePeek();
        });

        listen('btn-ad-peek-unlock', 'click', (e) => {
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            suppressClickUntil = Date.now() + 1000;
            this.requestRewardedAd('peek_unlock');
        });

        // 💎 Custom BG Purchase Confirm Modal Listeners
        listen('btn-cancel-custom-bg', 'click', () => {
            const modal = document.getElementById('modal-custom-bg-confirm');
            if (modal) modal.classList.add('hidden');
        });

        listen('btn-buy-custom-bg', 'click', () => {
            const modal = document.getElementById('modal-custom-bg-confirm');
            const isVip = this.isVip || (this.safeGet('gridoria_is_vip') === 'true');

            if (isVip) {
                if (modal) modal.classList.add('hidden');
                const fileInput = document.getElementById('input-custom-bg');
                if (fileInput) fileInput.click();
                return;
            }

            if (this.gems < 500) {
                this.showToast('Yetersiz Mücevher! (Gerekli: 💎 500)', '⚠️');
                return;
            }
            if (this.deductGems(500)) {
                if (!Array.isArray(this.unlockedBgs)) this.unlockedBgs = ['walnut', 'wood'];
                if (!this.unlockedBgs.includes('custom')) {
                    this.unlockedBgs.push('custom');
                    this.safeSet('gridoria_unlocked_bgs', JSON.stringify(this.unlockedBgs));
                }
                if (modal) modal.classList.add('hidden');
                const fileInput = document.getElementById('input-custom-bg');
                if (fileInput) fileInput.click();
            }
        });

        // 📷 Custom Background Photo File Input Change Listener (Opens Crop Modal)
        const fileInputCustomBg = document.getElementById('input-custom-bg');
        if (fileInputCustomBg) {
            fileInputCustomBg.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        this.openCropModal(evt.target.result, 'bg');
                    };
                    reader.readAsDataURL(file);
                }
                fileInputCustomBg.value = '';
            });
        }

        // ✂️ Crop Modal Tool Listeners
        listen('btn-close-crop', 'click', () => {
            const modal = document.getElementById('modal-crop-photo');
            if (modal) modal.classList.add('hidden');
        });

        listen('btn-cancel-crop', 'click', () => {
            const modal = document.getElementById('modal-crop-photo');
            if (modal) modal.classList.add('hidden');
        });

        const zoomSlider = document.getElementById('crop-zoom-slider');
        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                this.cropZoom = parseFloat(e.target.value || '1');
                this.updateCropTransform();
            });
        }

        listen('btn-crop-rotate', 'click', () => {
            this.cropRotation = (this.cropRotation + 90) % 360;
            this.updateCropTransform();
        });

        listen('btn-crop-reset', 'click', () => {
            this.cropZoom = 1;
            this.cropRotation = 0;
            if (zoomSlider) zoomSlider.value = 1;
            this.updateCropTransform();
        });

        listen('btn-apply-crop', 'click', () => {
            this.applyCroppedImage();
        });

        listen('btn-reset-data', 'click', () => {
            this.showConfirmDialog({
                icon: '🔄',
                title: 'Oyun İlerlemesini Sıfırla',
                desc: 'Oyun ilerlemeniz ve tahtanız sıfırlansın mı? (Elmaslarınız korunacaktır)',
                okText: 'EVET, SIFIRLA',
                cancelText: 'İPTAL',
                okBtnBg: 'linear-gradient(135deg, #ef4444, #dc2626)',
                onConfirm: () => {
                    this.safeRemove('gridoria_highscore');
                    this.safeRemove('gridoria_best_tile');
                    this.clearActiveGameState();
                    this.highScore = 0;
                    this.bestTile = 2048;
                    this.resetGame();
                    this.updateUI();
                    this.updateMainMenuStats();
                    this.showToast('Oyun sıfırlandı! Elmaslarınız korundu 💎', '🔄', 'SIFIRLANDI');
                    const modal = document.getElementById('modal-settings');
                    if (modal) modal.classList.add('hidden');
                    setActiveNavTab('home');
                }
            });
        });

        // Main Menu Navigation Bindings
        listen('btn-start-game', 'click', () => this.startGameView());
        listen('btn-home-menu', 'click', () => this.showMainMenu());
        listen('btn-missions', 'click', () => this.showMainMenu());

        listen('btn-main-themes', 'click', () => {
            const modal = document.getElementById('modal-themes');
            if (modal) modal.classList.remove('hidden');
        });
        listen('btn-main-missions', 'click', () => {
            const modal = document.getElementById('modal-missions');
            if (modal) modal.classList.remove('hidden');
        });
        listen('btn-menu-missions', 'click', () => {
            const modal = document.getElementById('modal-missions');
            if (modal) modal.classList.remove('hidden');
        });
        listen('btn-main-shop', 'click', () => {
            const shopBtn = document.getElementById('btn-open-shop');
            if (shopBtn) shopBtn.click();
        });
        listen('menu-btn-shop', 'click', () => {
            const shopBtn = document.getElementById('btn-open-shop');
            if (shopBtn) shopBtn.click();
        });

        listen('btn-close-missions', 'click', () => {
            const modal = document.getElementById('modal-missions');
            if (modal) modal.classList.add('hidden');
        });

        // Escape Key Binding for Back Action
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleBackAction();
            }
        });

        setTimeout(() => this.showDailyRewardIfAvailable(), 350);
    }

    // ── Android Back Button & Escape Handler ──────────────────────────
    handleBackAction() {
        // 1. Cancel active powerup mode if open
        if (typeof powerups !== 'undefined' && powerups.activeMode) {
            powerups.clearActiveMode();
            return true;
        }

        // 2. Close any open modal overlay
        const modalIds = ['modal-confirm-dialog', 'modal-custom-bg-confirm', 'modal-shop', 'modal-themes', 'modal-missions', 'modal-daily', 'modal-main-menu', 'modal-profile', 'modal-leaderboard', 'modal-settings', 'modal-peek-unlock'];
        for (const id of modalIds) {
            const modal = document.getElementById(id);
            if (modal && !modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
                return true;
            }
        }

        const gameOverModal = document.getElementById('modal-gameover');
        if (gameOverModal && !gameOverModal.classList.contains('hidden')) {
            gameOverModal.classList.add('hidden');
            this.showMainMenu();
            return true;
        }

        // 3. If in gameplay view, return to main menu
        const gameView = document.getElementById('game-view');
        if (gameView && !gameView.classList.contains('hidden')) {
            this.showMainMenu();
            return true;
        }

        // 4. Already in main menu with no modals -> return false (allows OS exit)
        return false;
    }

    formatTileVal(val) {
        if (!val) return '2048';
        const absVal = Math.abs(val);
        if (absVal >= 1000000) return Math.floor(absVal / 1000000) + 'M';
        if (absVal >= 1000) return Math.floor(absVal / 1000) + 'K';
        return absVal.toString();
    }

    showMainMenu() {
        this.saveActiveGameState();
        this.updateMainMenuStats();
        const menuView = document.getElementById('main-menu-view');
        const gameView = document.getElementById('game-view');
        const navBar = document.getElementById('bottom-nav-bar');
        if (menuView) menuView.classList.remove('hidden');
        if (gameView) gameView.classList.add('hidden');
        if (navBar) navBar.classList.remove('hidden');
        this.updateBannerVisibility();
        this.initMenuDemoAnimation();
    }

    startGameView() {
        try {
            const activeState = this.getActiveGameState();
            let hasActive = false;
            if (activeState && Array.isArray(activeState.grid) && activeState.grid.length === this.ROWS) {
                for (let r = 0; r < this.ROWS; r++) {
                    if (Array.isArray(activeState.grid[r])) {
                        for (let c = 0; c < this.COLS; c++) {
                            if (activeState.grid[r][c] > 0) hasActive = true;
                        }
                    }
                }
                if (activeState.score && activeState.score > 0) hasActive = true;
            }

            if (hasActive) {
                // Restore exact saved game state
                this.grid = activeState.grid.map(row => [...row]);
                this.score = Number(activeState.score || 0);
                this.currentShooterVal = Number(activeState.currentShooterVal || 2);
                this.nextShooterVal = Number(activeState.nextShooterVal || 4);
                this.comboMeter = Number(activeState.comboMeter || 0);
                this.comboMultiplier = Number(activeState.comboMultiplier || 1);
                this.isGameOver = false;

                this.renderGrid();
                this.updateShooterTiles();
                this.updateScoreDisplay();
                this.setStatus('Kaldığınız yerden devam ediliyor!', 'normal');
            } else if (this.grid.some(row => row.some(val => val > 0)) || this.score > 0) {
                this.renderGrid();
                this.updateShooterTiles();
                this.updateScoreDisplay();
            } else {
                this.grid = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
                this.iceGrid = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
                this.score = 0;
                this.comboMeter = 0;
                this.comboMultiplier = 1;
                this.isGameOver = false;
                this.initInitialBoard();
                this.updateScoreDisplay();
            }
        } catch (err) {
            console.error('Game start error:', err);
            this.resetGame();
        }

        const menuView = document.getElementById('main-menu-view');
        const gameView = document.getElementById('game-view');
        const navBar = document.getElementById('bottom-nav-bar');
        if (menuView) menuView.classList.add('hidden');
        if (gameView) gameView.classList.remove('hidden');
        if (navBar) navBar.classList.add('hidden');
        this.updateBannerVisibility();
        if (typeof sounds !== 'undefined') sounds.playShoot();
    }

    updateMainMenuStats() {
        try {
            const menuHigh = document.getElementById('menu-high-score');
            const menuGems = document.getElementById('menu-gems-count');
            const menuTopGems = document.getElementById('menu-top-gems-val');
            const menuBestTile = document.getElementById('menu-best-tile-val');
            const heroTileBox = document.getElementById('menu-hero-tile-box');
            const heroLabel = document.querySelector('.hero-block-label');
            const playBtnText = document.querySelector('.play-btn-text');

            if (menuHigh) menuHigh.innerText = this.highScore.toLocaleString('tr-TR');
            if (menuGems) menuGems.innerText = this.gems.toLocaleString('tr-TR');
            if (menuTopGems) menuTopGems.innerText = this.gems.toLocaleString('tr-TR');
            const shopGemsVal = document.getElementById('shop-gems-val');
            if (shopGemsVal) shopGemsVal.innerText = this.gems.toLocaleString('tr-TR');

            const activeState = this.getActiveGameState();
            let hasActive = false;
            let activeMax = 2;
            let activeScore = 0;

            if (activeState && Array.isArray(activeState.grid)) {
                for (let r = 0; r < activeState.grid.length; r++) {
                    if (Array.isArray(activeState.grid[r])) {
                        for (let c = 0; c < activeState.grid[r].length; c++) {
                            const tileVal = activeState.grid[r][c];
                            if (tileVal > 0) {
                                hasActive = true;
                                if (tileVal > activeMax) activeMax = tileVal;
                            }
                        }
                    }
                }
                if (activeState.score && activeState.score > 0) {
                    hasActive = true;
                    activeScore = activeState.score;
                }
                if (activeState.maxTile && activeState.maxTile > activeMax) activeMax = activeState.maxTile;
            } else if (this.grid.some(row => row.some(val => val > 0)) || this.score > 0) {
                hasActive = true;
                activeMax = this.getMaxTileOnBoard();
                activeScore = this.score;
            }

            if (hasActive) {
                if (menuBestTile) menuBestTile.innerText = this.formatTileVal(activeMax);
                if (heroTileBox) {
                    heroTileBox.className = `hero-block-box val-${activeMax}`;
                }
                if (heroLabel) heroLabel.innerText = `KALDIĞINIZ TAŞ: ${activeMax} (SKOR: ${activeScore.toLocaleString('tr-TR')})`;
                if (playBtnText) playBtnText.innerText = 'OYNAYIN';
            } else {
                if (menuBestTile) menuBestTile.innerText = this.formatTileVal(this.bestTile);
                if (heroTileBox) {
                    heroTileBox.className = `hero-block-box val-${this.bestTile}`;
                }
                if (heroLabel) heroLabel.innerText = 'EN YÜKSEK BLOK';
                if (playBtnText) playBtnText.innerText = 'OYNAYIN';
            }
        } catch (e) {
            console.error('Menu stats error:', e);
        }
    }

    initMenuDemoAnimation() {
        if (this.demoInterval) clearInterval(this.demoInterval);
        
        const targetTile = document.getElementById('demo-target-tile');
        const targetVal = document.getElementById('demo-target-val');
        const placeholder = document.getElementById('demo-placeholder-icon');
        const launcherTile = document.getElementById('demo-launcher-tile');
        const launcherVal = document.getElementById('demo-launcher-val');
        const flyingTile = document.getElementById('demo-flying-tile');
        const flyingVal = document.getElementById('demo-flying-val');

        if (!targetTile || !launcherTile || !flyingTile) return;

        let currentTargetVal = 0;
        let isAnimating = false;

        const updateTileStyle = (el, val) => {
            if (el.id === 'demo-launcher-tile') el.className = `demo-launcher-tile tile val-${val}`;
            else if (el.id === 'demo-flying-tile') el.className = `demo-flying-tile tile val-${val}`;
            else el.className = `demo-target-tile tile val-${val}`;
        };

        const resetDemo = () => {
            currentTargetVal = 0;
            isAnimating = false;
            if (placeholder) placeholder.style.display = 'block';
            if (targetTile) targetTile.classList.add('hidden');
            if (flyingTile) {
                flyingTile.classList.add('hidden');
                flyingTile.classList.remove('anim-shoot');
            }
            if (launcherTile && launcherVal) {
                launcherVal.innerText = '2';
                updateTileStyle(launcherTile, 2);
            }
        };

        resetDemo();

        const runStep = () => {
            const menuView = document.getElementById('main-menu-view');
            if (!menuView || menuView.classList.contains('hidden')) return;
            if (isAnimating) return;

            isAnimating = true;

            if (currentTargetVal === 0) {
                // 1. İLK FIRLATMA: Hedef boş, fırlatılan 2 taşı yukarı yerleşiyor
                const shootVal = 2;
                if (flyingVal) flyingVal.innerText = shootVal.toString();
                updateTileStyle(flyingTile, shootVal);
                flyingTile.classList.remove('hidden', 'anim-shoot');
                void flyingTile.offsetWidth;
                flyingTile.classList.add('anim-shoot');

                setTimeout(() => {
                    flyingTile.classList.add('hidden');
                    flyingTile.classList.remove('anim-shoot');
                    if (placeholder) placeholder.style.display = 'none';
                    
                    currentTargetVal = shootVal;
                    if (targetVal) targetVal.innerText = currentTargetVal.toString();
                    updateTileStyle(targetTile, currentTargetVal);
                    targetTile.classList.remove('hidden');

                    if (launcherVal) launcherVal.innerText = currentTargetVal.toString();
                    updateTileStyle(launcherTile, currentTargetVal);
                    isAnimating = false;
                }, 520);

            } else if (currentTargetVal >= 2048) {
                // 2048'e ulaşıldı! Kutlama ve döngüyü sıfırlama
                targetTile.classList.add('merge-pop');
                setTimeout(() => {
                    resetDemo();
                }, 1000);

            } else {
                // SÜREKLİ KATLANMA (2->4->8->16->32->64->128->256->512->1024->2048)
                const shootVal = currentTargetVal;
                if (flyingVal) flyingVal.innerText = shootVal.toString();
                updateTileStyle(flyingTile, shootVal);
                flyingTile.classList.remove('hidden', 'anim-shoot');
                void flyingTile.offsetWidth;
                flyingTile.classList.add('anim-shoot');

                setTimeout(() => {
                    flyingTile.classList.add('hidden');
                    flyingTile.classList.remove('anim-shoot');
                    
                    // Katlanma birleşmesi (Örn: 8 + 8 = 16, 16 + 16 = 32...)
                    currentTargetVal = currentTargetVal * 2;
                    if (targetVal) targetVal.innerText = currentTargetVal.toString();
                    updateTileStyle(targetTile, currentTargetVal);
                    
                    // Birleşme efekti
                    targetTile.classList.remove('merge-pop');
                    void targetTile.offsetWidth;
                    targetTile.classList.add('merge-pop');
                    if (typeof effects !== 'undefined') effects.triggerHaptic(currentTargetVal >= 256 ? 'heavy' : 'medium');

                    // Bir sonraki fırlatıcı taşını güncelle
                    if (launcherVal) launcherVal.innerText = currentTargetVal.toString();
                    updateTileStyle(launcherTile, currentTargetVal);
                    isAnimating = false;
                }, 520);
            }
        };

        this.demoInterval = setInterval(runStep, 1700);
        setTimeout(runStep, 500);
    }

    renderAvatarElement(el, avatarVal) {
        if (!el) return;
        const savedCustomAvatar = this.safeGet('gridoria_custom_avatar');
        const isCustom = (avatarVal === 'custom' || (typeof avatarVal === 'string' && avatarVal.startsWith('data:')));
        const imgSrc = (typeof avatarVal === 'string' && avatarVal.startsWith('data:')) ? avatarVal : savedCustomAvatar;

        const circleContainer = el.classList.contains('profile-avatar-circle') ? el : el.closest('.profile-avatar-circle');

        if (isCustom && imgSrc) {
            if (circleContainer) {
                circleContainer.style.backgroundImage = `url("${imgSrc}")`;
                circleContainer.style.backgroundSize = 'cover';
                circleContainer.style.backgroundPosition = 'center';
                const emojiSpan = circleContainer.querySelector('.avatar-emoji');
                if (emojiSpan) emojiSpan.style.display = 'none';
            } else {
                el.innerText = '';
                el.style.backgroundImage = `url("${imgSrc}")`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                el.style.borderRadius = '50%';
                el.style.display = 'inline-block';
            }
        } else {
            if (circleContainer) {
                circleContainer.style.backgroundImage = 'none';
                const emojiSpan = circleContainer.querySelector('.avatar-emoji');
                if (emojiSpan) {
                    emojiSpan.style.display = 'inline';
                    emojiSpan.innerText = avatarVal || '🧙‍♂️';
                }
            } else {
                el.style.backgroundImage = 'none';
                el.innerText = avatarVal || '🧙‍♂️';
            }
        }
    }

    updateProfileModalStats() {
        try {
            const hsEl = document.getElementById('profile-stat-highscore');
            const btEl = document.getElementById('profile-stat-besttile');
            const mgEl = document.getElementById('profile-stat-merges');
            const gmEl = document.getElementById('profile-stat-gems');
            const topGemsEl = document.getElementById('profile-top-gems-val');
            const nameEl = document.getElementById('profile-display-name');
            const avatarCircle = document.querySelector('.profile-avatar-circle');

            if (hsEl) hsEl.innerText = this.highScore.toLocaleString('tr-TR');
            if (btEl) btEl.innerText = this.formatTileVal(this.bestTile);
            if (mgEl) mgEl.innerText = (this.missionProgress ? (this.missionProgress.merges || 0) : 0).toLocaleString('tr-TR');
            if (gmEl) gmEl.innerText = `${this.gems.toLocaleString('tr-TR')} 💎`;
            if (topGemsEl) topGemsEl.innerText = this.gems.toLocaleString('tr-TR');
            if (nameEl) {
                nameEl.innerHTML = `${this.username || 'wlzby'} <span style="font-size: 14px; cursor: pointer; opacity: 0.8;" id="btn-edit-username-pen" title="İsim ve Fotoğraf Değiştir">✏️</span>`;
                const penBtn = document.getElementById('btn-edit-username-pen');
                if (penBtn) {
                    penBtn.onclick = (e) => {
                        if (e) e.stopPropagation();
                        this.openEditProfileModal(false);
                    };
                }
            }
            if (avatarCircle) this.renderAvatarElement(avatarCircle, this.userAvatar);
        } catch (e) {
            console.error('Profile stats error:', e);
        }
    }

    openEditProfileModal(isFirstTime = false) {
        const modal = document.getElementById('modal-edit-profile');
        if (!modal) return;

        const inputUser = document.getElementById('input-username');
        if (inputUser) inputUser.value = this.username || 'wlzby';

        this.selectedAvatarTemp = this.userAvatar || '🧙‍♂️';
        const savedCustomAvatar = this.safeGet('gridoria_custom_avatar');
        const previewBox = document.getElementById('preview-custom-avatar');
        const iconEl = document.getElementById('icon-custom-avatar');
        if (savedCustomAvatar && previewBox) {
            previewBox.style.backgroundImage = `url(${savedCustomAvatar})`;
            previewBox.style.backgroundSize = 'cover';
            previewBox.style.backgroundPosition = 'center';
            if (iconEl) iconEl.style.display = 'none';
        }

        document.querySelectorAll('#avatar-select-grid .avatar-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.avatar === this.selectedAvatarTemp);
        });

        const banner = document.querySelector('.profile-reward-banner');
        if (banner) {
            banner.style.display = this.hasSetupProfile ? 'none' : 'flex';
        }

        modal.classList.remove('hidden');
    }

    openCropModal(imageSrc, targetType = 'bg') {
        this.cropTargetType = targetType;
        const modal = document.getElementById('modal-crop-photo');
        const imgTarget = document.getElementById('crop-image-target');
        const titleEl = document.getElementById('crop-modal-title');
        const frameEl = document.getElementById('crop-overlay-frame');
        const applyBtn = document.getElementById('btn-apply-crop');

        if (titleEl) {
            titleEl.innerText = targetType === 'avatar' ? '✂️ Profil Çemberini Ayarla' : '✂️ Arka Plan Fotoğrafını Ayarla';
        }
        if (applyBtn) {
            applyBtn.innerText = targetType === 'avatar' ? '✨ Profil Resmini Kaydet' : '✨ Arka Plan Temasını Uygula';
        }
        if (frameEl) {
            frameEl.classList.toggle('avatar-mode', targetType === 'avatar');
        }

        if (imgTarget) {
            imgTarget.onload = () => {
                this.cropScale = 1.0;
                this.cropRotation = 0;
                this.cropPosX = 0;
                this.cropPosY = 0;
                const slider = document.getElementById('crop-zoom-slider');
                if (slider) slider.value = 1.0;
                this.updateCropTransform();
            };
            imgTarget.src = imageSrc;
        }

        if (modal) modal.classList.remove('hidden');
    }

    updateCropTransform() {
        const imgTarget = document.getElementById('crop-image-target');
        if (imgTarget) {
            const scale = this.cropScale || 1.0;
            const rot = this.cropRotation || 0;
            const posX = this.cropPosX || 0;
            const posY = this.cropPosY || 0;
            imgTarget.style.transform = `translate(${posX}px, ${posY}px) scale(${scale}) rotate(${rot}deg)`;
        }
    }

    applyCroppedImage() {
        const imgTarget = document.getElementById('crop-image-target');
        if (!imgTarget || !imgTarget.src) return;

        const isAvatar = this.cropTargetType === 'avatar';
        const canvas = document.createElement('canvas');
        const targetWidth = isAvatar ? 512 : 1080;
        const targetHeight = isAvatar ? 512 : 1920;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        const scale = this.cropScale || 1.0;
        const rot = (this.cropRotation || 0) * (Math.PI / 180);
        const posX = this.cropPosX || 0;
        const posY = this.cropPosY || 0;

        ctx.save();
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        ctx.translate(targetWidth / 2, targetHeight / 2);
        ctx.rotate(rot);

        const imgNaturalW = imgTarget.naturalWidth || imgTarget.width || targetWidth;
        const imgNaturalH = imgTarget.naturalHeight || imgTarget.height || targetHeight;

        const scaleW = targetWidth / imgNaturalW;
        const scaleH = targetHeight / imgNaturalH;
        const coverScale = Math.max(scaleW, scaleH) * scale;

        const drawW = imgNaturalW * coverScale;
        const drawH = imgNaturalH * coverScale;

        ctx.drawImage(imgTarget, -drawW / 2 + posX, -drawH / 2 + posY, drawW, drawH);
        ctx.restore();

        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.90);

        if (isAvatar) {
            this.safeSet('gridoria_custom_avatar', croppedDataUrl);
            this.selectedAvatarTemp = 'custom';
            this.userAvatar = 'custom';
            this.safeSet('gridoria_avatar', 'custom');

            const previewBox = document.getElementById('preview-custom-avatar');
            const iconEl = document.getElementById('icon-custom-avatar');
            if (previewBox) {
                previewBox.style.backgroundImage = `url("${croppedDataUrl}")`;
                previewBox.style.backgroundSize = 'cover';
                previewBox.style.backgroundPosition = 'center';
            }
            if (iconEl) iconEl.style.display = 'none';

            document.querySelectorAll('#avatar-select-grid .avatar-option').forEach(o => {
                o.classList.toggle('active', o.dataset.avatar === 'custom');
            });

            this.saveProfileData();

            const modalCrop = document.getElementById('modal-crop-photo');
            if (modalCrop) modalCrop.classList.add('hidden');

            if (typeof sounds !== 'undefined') sounds.playPop();
            if (typeof effects !== 'undefined') {
                effects.triggerHaptic('heavy');
                effects.showConfetti();
            }
            this.setStatus('📸 Profil Fotoğrafınız Çerçeveye Göre Kaydedildi!', 'merge');
        } else {
            this.safeSet('gridoria_custom_bg', croppedDataUrl);
            this.currentBgTheme = 'custom';
            this.safeSet('gridoria_bg_theme', 'custom');
            document.body.dataset.bgTheme = 'custom';
            document.body.dataset.theme = 'custom';
            this.applyCustomBgPhoto();
            this.updateCustomBgCardPreview();

            const modalCrop = document.getElementById('modal-crop-photo');
            if (modalCrop) modalCrop.classList.add('hidden');
            const modalConfirm = document.getElementById('modal-custom-bg-confirm');
            if (modalConfirm) modalConfirm.classList.add('hidden');

            if (typeof sounds !== 'undefined') sounds.playLevelUp();
            this.setStatus('✨ Özel Fotoğraf Arka Planınız Başarıyla Uygulandı!', 'merge');
        }
    }

    selectBgTheme(bgKey, cost = 0) {
        if (bgKey === 'custom') {
            this.openCustomBgConfirmModal();
            return;
        }
        this.currentBgTheme = bgKey;
        this.safeSet('gridoria_bg_theme', bgKey);
        document.body.dataset.bgTheme = bgKey;
        document.body.dataset.theme = bgKey;
        document.body.style.backgroundImage = 'none';
        document.querySelectorAll('.bg-card').forEach(c => {
            c.classList.toggle('active', c.dataset.bg === bgKey);
        });
        if (typeof sounds !== 'undefined') sounds.playPop();
    }

    applyCustomBgPhoto() {
        const customBgData = this.safeGet('gridoria_custom_bg');
        if (customBgData && this.currentBgTheme === 'custom') {
            document.body.style.backgroundImage = `url("${customBgData}")`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.dataset.bgTheme = 'custom';
            document.body.dataset.theme = 'custom';
        } else {
            document.body.style.backgroundImage = 'none';
        }
    }

    updateCustomBgCardPreview() {
        const customBgData = this.safeGet('gridoria_custom_bg');
        const thumb = document.querySelector('#card-custom-bg .custom-bg-thumb');
        const icon = document.getElementById('icon-custom-bg-preview');
        const badge = document.getElementById('badge-custom-bg-price');

        if (customBgData && thumb) {
            thumb.style.backgroundImage = `url("${customBgData}")`;
            thumb.style.backgroundSize = 'cover';
            thumb.style.backgroundPosition = 'center';
            if (icon) icon.style.display = 'none';
            if (badge) {
                if (this.isVip) {
                    badge.innerHTML = 'DEĞİŞTİR 👑';
                } else {
                    badge.innerHTML = 'DEĞİŞTİR (💎500)';
                }
            }
        }
    }

    saveProfileData() {
        const inputUser = document.getElementById('input-username');
        let newName = inputUser ? inputUser.value.trim() : '';
        if (!newName) newName = `Oyuncu_${Math.floor(1000 + Math.random() * 9000)}`;

        this.username = newName;
        this.userAvatar = this.selectedAvatarTemp || '🧙‍♂️';

        this.safeSet('gridoria_username', this.username);
        this.safeSet('gridoria_avatar', this.userAvatar);

        const isFirstTimeReward = !this.hasSetupProfile;
        this.hasSetupProfile = true;
        this.safeSet('gridoria_has_setup_profile', 'true');

        const modal = document.getElementById('modal-edit-profile');
        if (modal) modal.classList.add('hidden');

        if (isFirstTimeReward) {
            this.addGems(50);
            if (typeof sounds !== 'undefined') sounds.playLevelUp();
            if (typeof effects !== 'undefined') {
                effects.triggerHaptic('heavy');
                effects.showConfetti();
            }
            this.setStatus('🎁 +50 💎 Profil Hediye Elması Hesabınıza Eklendi!', 'merge');
        } else {
            if (typeof sounds !== 'undefined') sounds.playPop();
            this.setStatus('✏️ Profil Bilgileriniz Başarıyla Güncellendi!', 'normal');
        }

        this.updateProfileModalStats();
        this.updateMainMenuStats();
        this.updateLeaderboardDisplay();
    }

    generateMockLeaderboardData(mode = 'all') {
        const names = [
            'EfsaneEjder', 'Bozkurt', 'AslanKral', 'Şimşek', 'KaraKartal', 
            'Kaplan99', 'ZirveTekniği', 'BulmacaUstadı', 'Gökbörü', 'NeonKnight', 
            'Rüzgar', 'Master2048', 'Fırtına', 'BıçakGibi', 'Karakalem', 
            'SiberKral', 'AltınPati', 'AlevKapanı', 'BombaÇocuğu', 'Matrix42', 
            'Akıncı', 'Göktürk', 'KuleAvcısı', 'Pusula', 'GizemliMimar', 
            'SonNinja', 'BüyükKaptan', 'KırmızıŞahin', 'GeceAvcısı', 'MistikKral', 
            'TacticPro', 'AlfaKurt', 'KayaGibi', 'ZaferYolu', 'LazerKral', 
            'YıldızTozu', 'MaviEjder', 'SonSamuray', 'FırtınaKuşu', 'TitanV', 
            'PusluDere', 'DerinKuyu', 'Sihirbaz', 'Vortex', 'GölgeKral', 
            'AtomKarınca', 'BüyükUsta', 'AteşFırtınası', 'ZirveŞampiyonu'
        ];

        const avatars = [
            '🐉', '🐺', '🦁', '⚡', '🦅', '🐯', '👑', '🎮', '🦊', '🚀', 
            '⚔️', '🔥', '🎯', '💎', '🌟', '🛡️', '🐱', '🐶', '🐻', '🦄', 
            '🤖', '👻', '👾', '🛸', '🏆', '🔮', '🎨', '💣', '🔨', '🐻‍❄️',
            '🐲', '⚔️', '🔱', '💎', '🏅', '🎖️', '🥇', '🔮', '🚀', '🔥',
            '🦁', '🐺', '🐉', '⚡', '👑', '🎯', '🌟', '🛡️', '🏆'
        ];

        let baseScore = mode === 'weekly' ? 120000 : 165000;
        const list = [];

        for (let i = 0; i < 49; i++) {
            baseScore -= Math.floor(i * 280 + Math.random() * 2000 + 1200);
            baseScore = Math.max(3200, baseScore);
            const tile = baseScore > 90000 ? 4096 : baseScore > 35000 ? 2048 : baseScore > 12000 ? 1024 : 512;
            list.push({
                name: names[i % names.length],
                avatar: avatars[i % avatars.length],
                score: baseScore,
                tile: tile,
                isUser: false
            });
        }

        // Add User Player
        const userScore = this.highScore > 0 ? this.highScore : 107244;
        const userTile = this.bestTile || 2048;
        list.push({
            name: this.username || 'Misafir_4982',
            avatar: this.userAvatar || '🧙‍♂️',
            score: userScore,
            tile: userTile,
            isUser: true
        });

        // Sort Descending
        list.sort((a, b) => b.score - a.score);

        list.forEach((item, index) => {
            item.rank = index + 1;
        });

        return list;
    }

    updateLeaderboardDisplay(mode = 'all') {
        try {
            const data = this.generateMockLeaderboardData(mode);
            const lbHeaderScore = document.getElementById('lb-header-high-score');
            const listEl = document.getElementById('leaderboard-list');
            const podiumContainer = document.querySelector('.podium-container');

            const userEntry = data.find(d => d.isUser) || { score: this.highScore, rank: 2 };
            const displayScore = userEntry.score.toLocaleString('tr-TR');
            if (lbHeaderScore) lbHeaderScore.innerText = displayScore;

            // Render Podium (Ranks 1, 2, 3)
            const top1 = data.find(d => d.rank === 1) || data[0];
            const top2 = data.find(d => d.rank === 2) || data[1];
            const top3 = data.find(d => d.rank === 3) || data[2];

            if (podiumContainer) {
                podiumContainer.innerHTML = `
                    <div class="podium-card rank-2-card">
                        <div class="podium-crown">🥈</div>
                        <div class="podium-avatar" id="podium-avatar-2"></div>
                        <div class="podium-name">${top2.name} ${top2.isUser ? '(Sen)' : ''}</div>
                        <div class="podium-score">${top2.score.toLocaleString('tr-TR')}</div>
                        <div class="podium-tile">${top2.tile}</div>
                        <div class="podium-base base-2">2</div>
                    </div>
                    <div class="podium-card rank-1-card">
                        <div class="podium-crown">👑</div>
                        <div class="podium-avatar" id="podium-avatar-1"></div>
                        <div class="podium-name">${top1.name} ${top1.isUser ? '(Sen)' : ''}</div>
                        <div class="podium-score">${top1.score.toLocaleString('tr-TR')}</div>
                        <div class="podium-tile">${top1.tile}</div>
                        <div class="podium-base base-1">1</div>
                    </div>
                    <div class="podium-card rank-3-card">
                        <div class="podium-crown">🥉</div>
                        <div class="podium-avatar" id="podium-avatar-3"></div>
                        <div class="podium-name">${top3.name} ${top3.isUser ? '(Sen)' : ''}</div>
                        <div class="podium-score">${top3.score.toLocaleString('tr-TR')}</div>
                        <div class="podium-tile">${top3.tile}</div>
                        <div class="podium-base base-3">3</div>
                    </div>
                `;
                this.renderAvatarElement(document.getElementById('podium-avatar-2'), top2.avatar);
                this.renderAvatarElement(document.getElementById('podium-avatar-1'), top1.avatar);
                this.renderAvatarElement(document.getElementById('podium-avatar-3'), top3.avatar);
            }

            // Render All 50 Rows
            if (listEl) {
                let html = '';
                data.forEach(item => {
                    const isTop1 = item.rank === 1;
                    const isTop2 = item.rank === 2;
                    const isTop3 = item.rank === 3;
                    const badgeClass = isTop1 ? 'rank-1-bg' : isTop2 ? 'rank-2-bg' : isTop3 ? 'rank-3-bg' : '';
                    const rowClass = item.isUser ? 'lb-row user-row' : 'lb-row';

                    html += `
                        <div class="${rowClass}">
                            <div class="lb-rank-badge ${badgeClass}">${item.rank}</div>
                            <span class="lb-avatar" data-user-avatar="${item.avatar}"></span>
                            <div class="lb-user-info">
                                <span class="lb-name">${item.name} ${item.isUser ? '<span class="user-tag">(Sen)</span> <span class="lb-edit-icon-badge btn-lb-row-edit" title="İsmi Değiştir">✏️</span>' : ''}</span>
                                <span class="lb-tile-tag">${item.tile} Blok</span>
                            </div>
                            <div class="lb-score-box">
                                <span class="lb-score-val">${item.score.toLocaleString('tr-TR')}</span>
                                <small>puan</small>
                            </div>
                        </div>
                    `;
                });
                listEl.innerHTML = html;

                listEl.querySelectorAll('.lb-avatar').forEach(avatarNode => {
                    const val = avatarNode.dataset.userAvatar;
                    this.renderAvatarElement(avatarNode, val);
                });

                // Attach click handlers to user edit pencils in list
                document.querySelectorAll('.btn-lb-row-edit').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.openEditProfileModal(false);
                    });
                });
            }

            // Update Sticky Bottom Player Rank Bar
            const stickyBar = document.getElementById('lb-sticky-user-bar');
            const stickyRank = document.getElementById('lb-sticky-rank-val');
            const stickyAvatar = document.getElementById('lb-sticky-avatar-val');
            const stickyName = document.getElementById('lb-sticky-name-val');
            const stickyScore = document.getElementById('lb-sticky-score-val');

            if (userEntry) {
                if (stickyRank) stickyRank.innerText = `#${userEntry.rank}`;
                if (stickyAvatar) this.renderAvatarElement(stickyAvatar, this.userAvatar);
                if (stickyName) stickyName.innerText = userEntry.name;
                if (stickyScore) stickyScore.innerText = userEntry.score.toLocaleString('tr-TR');

                if (stickyBar) {
                    if (userEntry.rank <= 5) {
                        // User is in top 5 ranks, hide sticky bottom bar
                        stickyBar.classList.add('hidden-sticky');
                        if (listEl) listEl.classList.remove('has-sticky-bar');
                    } else {
                        // User is rank > 5, show sticky bottom bar fixed above bottom nav bar
                        stickyBar.classList.remove('hidden-sticky');
                        if (listEl) listEl.classList.add('has-sticky-bar');
                    }
                }
            }
        } catch (e) {
            console.error('Leaderboard error:', e);
        }
    }

    updateScoreDisplay() {
        if (this.scoreEl) this.scoreEl.innerText = this.score.toLocaleString('tr-TR');
        if (this.highScoreEl) this.highScoreEl.innerText = this.highScore.toLocaleString('tr-TR');
    }

    savePreviousState() {
        this.previousState = {
            grid: this.grid.map(row => [...row]),
            iceGrid: this.iceGrid.map(row => [...row]),
            score: this.score,
            gems: this.gems,
            comboMeter: this.comboMeter,
            comboMultiplier: this.comboMultiplier,
            currentShooterVal: this.currentShooterVal,
            nextShooterVal: this.nextShooterVal
        };
    }

    restorePreviousState(preserveCurrentGems = false) {
        if (!this.previousState) return;
        const gemsAfterPurchase = this.gems;
        this.grid = this.previousState.grid.map(row => [...row]);
        this.iceGrid = this.previousState.iceGrid.map(row => [...row]);
        this.score = this.previousState.score;
        this.gems = preserveCurrentGems ? gemsAfterPurchase : this.previousState.gems;
        this.comboMeter = this.previousState.comboMeter;
        this.comboMultiplier = this.previousState.comboMultiplier;
        this.currentShooterVal = this.previousState.currentShooterVal;
        this.nextShooterVal = this.previousState.nextShooterVal;

        this.renderGrid();
        this.updateShooterTiles();
        this.updateUI();
    }

    shootCurrentTile(col) {
        if (this.isAnimating) return;

        clearTimeout(this.animSafetyTimer);
        this.animSafetyTimer = setTimeout(() => {
            this.isAnimating = false;
        }, 850);

        const targetRow = this.getLandingRow(col);

        // Column is completely full
        if (targetRow === -1) {
            if (typeof effects !== 'undefined') effects.triggerHaptic('heavy');
            this.checkGameOver();
            this.isAnimating = false;
            return;
        }

        this.savePreviousState();
        this.isAnimating = true;
        this.mergedThisTurn = false;
        this.mergesThisTurn = 0;
        this.setStatus(`Sütun ${col + 1} hedeflendi`, 'aiming');

        if (typeof sounds !== 'undefined') sounds.playShoot();
        if (typeof effects !== 'undefined') effects.triggerHaptic('light');

        const valToPlace = this.currentShooterVal;
        const color = this.getTileColorHex(Math.abs(valToPlace));
        this.grid[targetRow][col] = valToPlace;
        if (valToPlace < 0) {
            this.iceGrid[targetRow][col] = 3;
        }

        this.renderGrid();

        const targetCell = this.getCellElement(targetRow, col);
        if (targetCell) {
            const tileEl = targetCell.querySelector('.tile');
            if (tileEl) {
                tileEl.classList.add('tile-launching');
                const distanceY = (this.ROWS - targetRow) * 55 + 40;
                tileEl.style.transform = `translateY(${distanceY}px) scale(0.7)`;
                requestAnimationFrame(() => {
                    tileEl.style.transform = 'translateY(0) scale(1)';
                    tileEl.classList.remove('tile-launching');
                });
            }

            if (typeof effects !== 'undefined' && this.currentShooterEl) {
                const shooterRect = this.currentShooterEl.getBoundingClientRect();
                const targetRect = targetCell.getBoundingClientRect();
                const pc = document.getElementById('particles-container');
                const containerRect = pc ? pc.getBoundingClientRect() : { left: 0, top: 0 };

                const startX = shooterRect.left + shooterRect.width / 2 - containerRect.left;
                const startY = shooterRect.top + shooterRect.height / 2 - containerRect.top;
                const endX = targetRect.left + targetRect.width / 2 - containerRect.left;
                const endY = targetRect.top + targetRect.height / 2 - containerRect.top;

                effects.createMotionTrail(startX, startY, endX, endY, color);
            }
        }

        this.generateNewShooterTile();

        setTimeout(() => {
            if (targetCell) {
                const tileEl = targetCell.querySelector('.tile');
                if (tileEl) {
                    tileEl.classList.remove('flying', 'tile-launching');
                    tileEl.classList.add('tile-landed');
                    setTimeout(() => tileEl.classList.remove('tile-landed'), 240);
                }
            }
            this.applyCeilingGravityAndMerge(() => {
                this.isAnimating = false;
                clearTimeout(this.animSafetyTimer);
                if (!this.mergedThisTurn) {
                    this.comboMeter = Math.max(0, this.comboMeter - 12);
                    this.comboMultiplier = this.comboMeter >= 80 ? 3 : this.comboMeter >= 40 ? 2 : 1;
                    this.updateUI();
                }
                this.checkGameOver();
                if (!this.isAnimating) this.setStatus('Yeni hamle için bir sütuna dokun', 'ready');
            }, { r: targetRow, c: col });
        }, 260);
    }

    generateNewShooterTile() {
        this.currentShooterVal = this.nextShooterVal;
        this.nextShooterVal = this._getRandomTileValue();
        this.updateShooterTiles();
    }

    _getRandomTileValue() {
        const boardMax = this.getMaxTileOnBoard();
        if (!this.sessionMaxTile || boardMax > this.sessionMaxTile) {
            this.sessionMaxTile = boardMax;
        }
        const currentMax = Math.max(boardMax, this.sessionMaxTile || 2);

        let options;
        if (currentMax < 128) {
            // Başlangıç Seviyesi (< 128): 2, 4, 8
            options = [{ val: 2, w: 50 }, { val: 4, w: 35 }, { val: 8, w: 15 }];
        } else if (currentMax < 256) {
            // 128'e Ulaşıldığında: 2, 4, 8, 16
            options = [{ val: 2, w: 25 }, { val: 4, w: 40 }, { val: 8, w: 25 }, { val: 16, w: 10 }];
        } else if (currentMax < 512) {
            // 256'ya Ulaşıldığında: 2 ARTIK GELMEZ (En düşük taş: 4)
            options = [{ val: 4, w: 40 }, { val: 8, w: 35 }, { val: 16, w: 20 }, { val: 32, w: 5 }];
        } else if (currentMax < 1024) {
            // 512'ye Ulaşıldığında: En düşük taş: 4 / 8
            options = [{ val: 4, w: 20 }, { val: 8, w: 40 }, { val: 16, w: 25 }, { val: 32, w: 10 }, { val: 64, w: 5 }];
        } else if (currentMax < 2048) {
            // 1K (1024)'e Ulaşıldığında: 2 ve 4 ARTIK GELMEZ! EN DÜŞÜK TAŞ EN AZ 8!
            options = [{ val: 8, w: 35 }, { val: 16, w: 30 }, { val: 32, w: 20 }, { val: 64, w: 10 }, { val: 128, w: 5 }];
        } else if (currentMax < 4096) {
            // 2K (2048)'ye Ulaşıldığında: EN DÜŞÜK TAŞ EN AZ 16! (2, 4, 8 elenir)
            options = [{ val: 16, w: 35 }, { val: 32, w: 30 }, { val: 64, w: 20 }, { val: 128, w: 10 }, { val: 256, w: 5 }];
        } else {
            // 4K (4096+) ve Üzeri: EN DÜŞÜK TAŞ EN AZ 32! (2, 4, 8, 16 elenir)
            options = [{ val: 32, w: 35 }, { val: 64, w: 30 }, { val: 128, w: 20 }, { val: 256, w: 10 }, { val: 512, w: 5 }];
        }

        if (!Array.isArray(this.recentSpawnedVals)) this.recentSpawnedVals = [];

        const lastVal = this.recentSpawnedVals[this.recentSpawnedVals.length - 1];
        const prevVal = this.recentSpawnedVals[this.recentSpawnedVals.length - 2];

        let filteredOptions = options.filter(o => o.val !== lastVal);
        if (prevVal !== undefined) {
            const noPingPong = filteredOptions.filter(o => o.val !== prevVal);
            if (noPingPong.length > 0) filteredOptions = noPingPong;
        }
        if (filteredOptions.length === 0) filteredOptions = options;

        const total = filteredOptions.reduce((s, o) => s + o.w, 0);
        let rand = Math.random() * total;
        let selectedVal = filteredOptions[0].val;
        for (const item of filteredOptions) {
            if (rand < item.w) {
                selectedVal = item.val;
                break;
            }
            rand -= item.w;
        }

        this.recentSpawnedVals.push(selectedVal);
        if (this.recentSpawnedVals.length > 4) this.recentSpawnedVals.shift();

        this.tilesSpawnedSinceLastFrozen += 1;
        if (this.score >= 200 && this.tilesSpawnedSinceLastFrozen >= this.nextFrozenSpawnInterval) {
            this.tilesSpawnedSinceLastFrozen = 0;
            this.nextFrozenSpawnInterval = 12 + Math.floor(Math.random() * 4);
            return -selectedVal;
        }

        return selectedVal;
    }

    isNextTilePeekActive() {
        return Date.now() < (this.nextTilePeekUntil || 0);
    }

    getPeekTimeRemainingSecs() {
        if (!this.isNextTilePeekActive()) return 0;
        return Math.max(0, Math.ceil((this.nextTilePeekUntil - Date.now()) / 1000));
    }

    formatPeekTimer(totalSecs) {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    initPeekTimerLoop() {
        if (this.peekTimerInterval) clearInterval(this.peekTimerInterval);
        this.peekTimerInterval = setInterval(() => {
            if (this.isNextTilePeekActive()) {
                this.updateShooterTiles();
            } else if (this.wasPeekActiveLastTick) {
                this.wasPeekActiveLastTick = false;
                this.updateShooterTiles();
            }
        }, 1000);
    }

    unlockNextTilePeek() {
        const modal = document.getElementById('modal-peek-unlock');
        const UNLOCK_COST = 100;
        const DURATION_MS = 10 * 60 * 1000; // 10 minutes

        if (this.gems < UNLOCK_COST) {
            this.showToast(`Yetersiz Elmas! Bu özellik için ${UNLOCK_COST} 💎 gerekiyor.`, '⚠️', 'UYARI');
            if (modal) modal.classList.add('hidden');
            return;
        }

        if (this.deductGems(UNLOCK_COST)) {
            this.nextTilePeekUntil = Date.now() + DURATION_MS;
            this.safeSet('gridoria_next_peek_until', this.nextTilePeekUntil.toString());
            if (modal) modal.classList.add('hidden');
            this.updateShooterTiles();
            this.showToast('10 Dakika Sıradaki Taş Görünürlüğü Açıldı! 🔮', '🔮', 'ÖZELLİK AÇILDI');
            if (typeof sounds !== 'undefined') sounds.playLevelUp();
            if (typeof effects !== 'undefined') effects.triggerHaptic('heavy');
        }
    }

    unlockNextTilePeekFree() {
        const modal = document.getElementById('modal-peek-unlock');
        const DURATION_MS = 10 * 60 * 1000; // 10 minutes

        this.nextTilePeekUntil = Date.now() + DURATION_MS;
        this.safeSet('gridoria_next_peek_until', this.nextTilePeekUntil.toString());
        if (modal) modal.classList.add('hidden');
        this.updateShooterTiles();
        this.showToast('10 Dakika Sıradaki Taş Görünürlüğü ÜCRETSIZ Açıldı! 📺', '📺', 'REKLAM ÖDÜLÜ');
        if (typeof sounds !== 'undefined') sounds.playLevelUp();
        if (typeof effects !== 'undefined') effects.triggerHaptic('heavy');
    }

    updateShooterTiles() {
        if (!this.currentShooterEl) return;
        const curAbs = Math.abs(this.currentShooterVal);
        const curFrozen = this.currentShooterVal < 0;
        const curDisplay = this.formatTileVal(curAbs);
        this.currentShooterEl.className = `tile shooter-tile val-${curAbs}${curFrozen ? ' is-frozen ice-hp-3' : ''}`;
        if (curFrozen) {
            this.currentShooterEl.innerHTML = `
                <span class="tile-number">${curDisplay}</span>
                <span class="ice-hp-dots">❄️❄️❄️</span>
            `;
        } else {
            this.currentShooterEl.innerHTML = `<span class="tile-number">${curDisplay}</span>`;
        }

        if (this.nextTileEl) {
            const isPeekActive = this.isNextTilePeekActive();
            this.wasPeekActiveLastTick = isPeekActive;

            if (isPeekActive) {
                const nextAbs = Math.abs(this.nextShooterVal);
                const nextFrozen = this.nextShooterVal < 0;
                const nextDisplay = this.formatTileVal(nextAbs);
                const remSecs = this.getPeekTimeRemainingSecs();
                const timerStr = this.formatPeekTimer(remSecs);

                this.nextTileEl.className = `next-tile val-${nextAbs}${nextFrozen ? ' is-frozen ice-hp-3' : ''}`;
                if (nextFrozen) {
                    this.nextTileEl.innerHTML = `
                        <span class="tile-number">${nextDisplay}</span>
                        <span class="ice-hp-dots">❄️❄️❄️</span>
                        <span class="next-peek-timer" title="Sıradaki Taş Görünürlüğü">⏱️ ${timerStr}</span>
                    `;
                } else {
                    this.nextTileEl.innerHTML = `
                        <span class="tile-number">${nextDisplay}</span>
                        <span class="next-peek-timer" title="Sıradaki Taş Görünürlüğü">⏱️ ${timerStr}</span>
                    `;
                }
            } else {
                this.nextTileEl.className = `next-tile is-peek-locked`;
                this.nextTileEl.innerHTML = `
                    <div class="next-locked-wrapper" title="Sıradaki Taşı Gör (10 Dk) - 100 💎">
                        <span class="next-lock-icon">🔒</span>
                        <span class="next-lock-cost">100 💎</span>
                    </div>
                `;
            }
        }
    }

    getMaxTileOnBoard() {
        let max = 2;
        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                const absVal = Math.abs(this.grid[r][c]);
                if (absVal > max) max = absVal;
            }
        }
        return max;
    }

    recalculateTargetGoal() {
        const maxTile = this.getMaxTileOnBoard();
        let target = 256;
        while (maxTile >= target) {
            target *= 2;
        }
        this.currentTargetGoal = target;
        this.safeSet('gridoria_target_goal', this.currentTargetGoal.toString());
        const targetValEl = document.getElementById('target-goal-val');
        if (targetValEl) targetValEl.innerText = this.currentTargetGoal.toLocaleString('tr-TR');
    }

    applyCeilingGravityAndMerge(callback, activeCell = null) {
        let merged = false;
        let currentActive = activeCell ? { r: activeCell.r, c: activeCell.c } : null;

        // Shift blocks UPWARDS towards Ceiling (Row 0)
        for (let c = 0; c < this.COLS; c++) {
            for (let r = 0; r < this.ROWS; r++) {
                if (this.grid[r][c] === 0) {
                    for (let belowR = r + 1; belowR < this.ROWS; belowR++) {
                        if (this.grid[belowR][c] !== 0) {
                            if (currentActive && currentActive.r === belowR && currentActive.c === c) {
                                currentActive.r = r;
                            }
                            this.grid[r][c] = this.grid[belowR][c];
                            this.iceGrid[r][c] = this.iceGrid[belowR][c];
                            this.grid[belowR][c] = 0;
                            this.iceGrid[belowR][c] = 0;
                            break;
                        }
                    }
                }
            }
        }

        let mergeFound = false;
        let mergeTargetR = -1;
        let mergeTargetC = -1;
        let mergeSourceR = -1;
        let mergeSourceC = -1;

        // 1. Prioritize shot/active tile position as merge target for neighbors (ÜST/ÇARPIŞMA ilk sıradadır, sonra SOL, SAĞ ve ALT)
        if (currentActive && currentActive.r >= 0 && currentActive.r < this.ROWS && currentActive.c >= 0 && currentActive.c < this.COLS) {
            const ar = currentActive.r;
            const ac = currentActive.c;
            const activeVal = this.grid[ar][ac];

            if (activeVal > 0) {
                // Öncelik sırası:
                // 1. ÜST (ar - 1, ac): Atılan taşın doğrudan çarptığı blok!
                // 2. SOL (ar, ac - 1)
                // 3. SAĞ (ar, ac + 1)
                // 4. ALT (ar + 1, ac)
                const priorityNeighbors = [
                    { r: ar - 1, c: ac, isAbove: true },
                    { r: ar, c: ac - 1, isAbove: false },
                    { r: ar, c: ac + 1, isAbove: false },
                    { r: ar + 1, c: ac, isAbove: false }
                ];

                for (const n of priorityNeighbors) {
                    if (n.r >= 0 && n.r < this.ROWS && n.c >= 0 && n.c < this.COLS) {
                        if (this.grid[n.r][n.c] === activeVal) {
                            mergeFound = true;
                            if (n.isAbove) {
                                // Doğrudan çarptığı üstteki blok ile birleş (üstteki blok hedef, atılan taş kaynak)
                                mergeTargetR = n.r;
                                mergeTargetC = n.c;
                                mergeSourceR = ar;
                                mergeSourceC = ac;
                            } else {
                                // Yan veya alttaki komşuyu aktif bloğa çek
                                mergeTargetR = ar;
                                mergeTargetC = ac;
                                mergeSourceR = n.r;
                                mergeSourceC = n.c;
                            }
                            break;
                        }
                    }
                }
            }
        }

        // 2. Secondary scan if active tile has no matching neighbor
        if (!mergeFound) {
            for (let r = 0; r < this.ROWS; r++) {
                for (let c = 0; c < this.COLS; c++) {
                    const val = this.grid[r][c];
                    if (val <= 0) continue;

                    // Check below
                    if (r + 1 < this.ROWS && this.grid[r + 1][c] === val) {
                        mergeFound = true;
                        mergeTargetR = r;
                        mergeTargetC = c;
                        mergeSourceR = r + 1;
                        mergeSourceC = c;
                        break;
                    }
                    // Check right
                    if (c + 1 < this.COLS && this.grid[r][c + 1] === val) {
                        mergeFound = true;
                        mergeTargetR = r;
                        mergeTargetC = c;
                        mergeSourceR = r;
                        mergeSourceC = c + 1;
                        break;
                    }
                }
                if (mergeFound) break;
            }
        }

        if (mergeFound) {
            merged = true;
            this.executeMerge(mergeTargetR, mergeTargetC, mergeSourceR, mergeSourceC);
            const nextActiveCell = { r: mergeTargetR, c: mergeTargetC };
            setTimeout(() => {
                this.applyCeilingGravityAndMerge(callback, nextActiveCell);
            }, 420);
        } else {
            this.renderGrid();
            if (callback) callback();
        }
    }

    executeMerge(targetR, targetC, sourceR, sourceC) {
        this.mergedThisTurn = true;
        this.mergesThisTurn += 1;
        const sourceCell = this.getCellElement(sourceR, sourceC);
        const targetCell = this.getCellElement(targetR, targetC);

        const val = this.grid[targetR][targetC];
        const newVal = val * 2;

        if (sourceCell && targetCell) {
            const sourceTile = sourceCell.querySelector('.tile');
            if (sourceTile) {
                sourceTile.classList.add('sliding-merge');
                const tRect = targetCell.getBoundingClientRect();
                const sRect = sourceCell.getBoundingClientRect();
                const moveX = tRect.left - sRect.left;
                const moveY = tRect.top - sRect.top;
                sourceTile.style.transform = `translate(${moveX}px, ${moveY}px)`;
            }
        }

        setTimeout(() => {
            this.grid[targetR][targetC] = newVal;
            this.grid[sourceR][sourceC] = 0;

            const directNeighbors = [
                [targetR - 1, targetC],
                [targetR + 1, targetC],
                [targetR, targetC - 1],
                [targetR, targetC + 1]
            ];

            let unfrozenCount = 0;
            let crackedCount = 0;
            const processedKeys = new Set();

            for (const [nr, nc] of directNeighbors) {
                if (nr >= 0 && nr < this.ROWS && nc >= 0 && nc < this.COLS) {
                    const key = `${nr},${nc}`;
                    if (!processedKeys.has(key) && this.grid[nr][nc] < 0) {
                        processedKeys.add(key);
                        if (!this.iceGrid[nr][nc] || this.iceGrid[nr][nc] <= 0) this.iceGrid[nr][nc] = 3;
                        this.iceGrid[nr][nc] -= 1;

                        if (this.iceGrid[nr][nc] <= 0) {
                            this.grid[nr][nc] = Math.abs(this.grid[nr][nc]);
                            this.iceGrid[nr][nc] = 0;
                            unfrozenCount += 1;
                        } else {
                            crackedCount += 1;
                        }

                        const cellEl = this.getCellElement(nr, nc);
                        if (cellEl) {
                            const tileEl = cellEl.querySelector('.tile');
                            if (tileEl) {
                                tileEl.classList.remove('ice-shatter');
                                void tileEl.offsetWidth;
                                tileEl.classList.add('ice-shatter');
                            }
                        }
                    }
                }
            }

            if (unfrozenCount > 0) {
                this.setStatus('💥 BUZ TAMAMEN ÇÖZÜLDÜ!', 'merge');
                if (typeof sounds !== 'undefined') sounds.playLevelUp();
                if (typeof effects !== 'undefined') effects.triggerHaptic('heavy');
            } else if (crackedCount > 0) {
                this.setStatus('❄️ Buz Çatlıyor! (Komşu Birleşme)', 'merge');
                if (typeof sounds !== 'undefined') sounds.playMerge(1);
                if (typeof effects !== 'undefined') effects.triggerHaptic('medium');
            }

            const pointsGained = newVal;
            this.score += pointsGained;
            this.setStatus(`${newVal}! +${pointsGained} puan`, 'merge');
            this.missionProgress.merges += 1;
            this.missionProgress.maxTile = Math.max(this.missionProgress.maxTile, newVal);
            this.missionProgress.score = Math.max(this.missionProgress.score, this.score);
            if (newVal > this.bestTile) {
                this.bestTile = newVal;
                this.safeSet('gridoria_best_tile', this.bestTile.toString());
            }
            this.checkMissionCompletion();

            if (this.score > this.highScore) {
                this.highScore = this.score;
            }

            const gemReward = newVal >= 4096 ? 100 : newVal >= 2048 ? 50 : newVal >= 1024 ? 25 : newVal >= 512 ? 10 : newVal >= 256 ? 5 : newVal >= 128 ? 2 : newVal >= 64 ? 1 : 0;
            if (gemReward > 0) {
                this.gems += gemReward;
                this.setStatus(`+${gemReward} 💎 Harika Birleşme! (${newVal})`, 'ready');
            }

            // 🎯 Dynamic Milestone Goal Progression (256 ➔ 512 ➔ 1024 ➔ 2048...)
            if (newVal >= this.currentTargetGoal) {
                const reachedGoal = this.currentTargetGoal;
                const step = Math.max(0, Math.round(Math.log2(reachedGoal / 256)));
                const extraGems = 5 + (step * 2); // Her bir üst hedef aşamasında +2 elmas artar (5 💎 ➔ 7 💎 ➔ 9 💎 ➔ 11 💎...)

                this.gems += extraGems;
                this.recalculateTargetGoal();

                if (typeof sounds !== 'undefined') sounds.playLevelUp();
                if (typeof effects !== 'undefined') {
                    effects.triggerHaptic('heavy');
                    effects.showConfetti();
                }

                const targetBox = document.getElementById('target-goal-box');
                if (targetBox) {
                    targetBox.classList.add('target-achieved');
                    setTimeout(() => targetBox.classList.remove('target-achieved'), 900);
                }

                this.showToast(
                    `🎉 SÜPER GİDİYORSUN!\n${reachedGoal} Hedefine Ulaşıldı! (+${extraGems} 💎 Ekstra Ödül Kazandın)\nYeni Hedef: ${this.currentTargetGoal}!`, 
                    '🎯', 
                    'HEDEF ULAŞILDI!'
                );
            }

            if (typeof sounds !== 'undefined') sounds.playMerge(this.mergesThisTurn + (this.comboMultiplier > 1 ? 2 : 0));
            if (typeof effects !== 'undefined') effects.triggerHaptic('medium');

            const color = this.getTileColorHex(newVal);

            this.renderGrid();

            const updatedTargetCell = this.getCellElement(targetR, targetC);
            if (updatedTargetCell) {
                const tileEl = updatedTargetCell.querySelector('.tile');
                if (tileEl) {
                    tileEl.classList.remove('tile-water-drop', 'water-drop-merge');
                    void tileEl.offsetWidth;
                    tileEl.classList.add('tile-water-drop');
                    setTimeout(() => tileEl.classList.remove('tile-water-drop'), 480);
                }

                if (typeof effects !== 'undefined') {
                    const tRect = updatedTargetCell.getBoundingClientRect();
                    const pc = document.getElementById('particles-container');
                    const containerRect = pc ? pc.getBoundingClientRect() : { left: 0, top: 0 };
                    const rippleX = tRect.left + tRect.width / 2 - containerRect.left;
                    const rippleY = tRect.top + tRect.height / 2 - containerRect.top;

                    effects.showWaterRipple(rippleX, rippleY, color);
                    effects.showSparkles(rippleX, rippleY, color);

                    const scoreText = fireMultiplier > 1
                        ? `+${pointsGained} ATEŞ MODU x2!`
                        : this.comboMultiplier > 1 ? `+${pointsGained} x${this.comboMultiplier}!` : `+${pointsGained}`;
                    effects.showScorePopup(rippleX, rippleY, scoreText, fireMultiplier > 1);
                }
            }

            this.saveData();
            this.updateUI();
        }, 220);
    }

    getTileColorHex(val) {
        const colors = {
            2: '#0077f6',
            4: '#00ab9c',
            8: '#154cce',
            16: '#d61444',
            24: '#7614d9',
            32: '#e67300',
            64: '#8c14d9',
            128: '#4cb800',
            256: '#c20829',
            512: '#bf190c',
            1024: '#ff9900',
            2048: '#ffe000'
        };
        return colors[val] || '#00eed8';
    }

    deductGems(amount) {
        if (this.gems >= amount) {
            this.gems -= amount;
            this.saveData();
            this.updateUI();
            return true;
        }
        return false;
    }

    addGems(amount) {
        this.gems += amount;
        this.saveData();
        this.updateUI();
    }

    showToast(text, icon = '★', title = 'BİLGİ') {
        const toast = document.getElementById('mission-toast');
        const toastTitle = document.getElementById('mission-toast-title');
        const toastText = document.getElementById('mission-toast-text');
        const toastIcon = document.getElementById('mission-toast-icon') || document.querySelector('.mission-toast-icon');
        if (!toast) return;

        if (toastTitle) toastTitle.innerText = title;
        if (toastText) toastText.innerText = text;
        if (toastIcon) toastIcon.innerText = icon;

        toast.classList.remove('hidden');

        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 3500);
    }

    updateUI() {
        if (this.scoreEl) {
            if (this.lastDisplayedScore !== undefined && this.lastDisplayedScore !== this.score && this.score > 0) {
                this.bumpScoreDisplay();
            }
            this.lastDisplayedScore = this.score;
            this.scoreEl.innerText = this.score.toLocaleString('tr-TR');
        }
        if (this.highScoreEl) this.highScoreEl.innerText = this.highScore.toLocaleString('tr-TR');
        if (this.gemsEl) this.gemsEl.innerText = this.gems;
        const shopGemsVal = document.getElementById('shop-gems-val');
        if (shopGemsVal) shopGemsVal.innerText = this.gems.toLocaleString('tr-TR');

        this.recalculateTargetGoal();
        this.renderMetaProgress();
    }

    bumpScoreDisplay() {
        const scoreBox = document.getElementById('gridoria-score-box');
        if (!scoreBox) return;
        scoreBox.classList.remove('score-bump');
        void scoreBox.offsetWidth;
        scoreBox.classList.add('score-bump');
        setTimeout(() => scoreBox.classList.remove('score-bump'), 220);
    }

    renderMetaProgress() {
        const goals = {
            merges: [this.missionProgress.merges, 10, 5],
            tile: [this.missionProgress.maxTile, 128, 8],
            score: [this.missionProgress.score, 500, 8]
        };
        Object.entries(goals).forEach(([name, [value, target]]) => {
            const valueEl = document.getElementById(`mission-${name === 'tile' ? 'tile' : name}`);
            const button = document.querySelector(`[data-mission="${name}"]`);
            if (!valueEl || !button) return;
            valueEl.innerText = `${Math.min(value, target)}/${target}`;
            const claimed = this.missionProgress.claimed.includes(name);
            button.classList.toggle('ready', value >= target && !claimed);
            button.classList.toggle('claimed', claimed);
            button.innerText = claimed ? 'ALINDI' : `+${goals[name][2]}`;
        });
        const difficultyLabel = document.getElementById('difficulty-label');
        if (difficultyLabel) {
            const level = this.score >= 3500 ? 4 : this.score >= 1200 ? 3 : this.score >= 350 ? 2 : 1;
            difficultyLabel.innerText = `SEVİYE ${level}`;
        }
    }

    claimMission(name) {
        const goals = {
            merges: [this.missionProgress.merges, 10, 5, '10 Birleşme Yap'],
            tile: [this.missionProgress.maxTile, 128, 8, '128 Taşını Yap'],
            score: [this.missionProgress.score, 500, 8, '500 Skor Yap']
        };
        const [value, target, reward, label] = goals[name] || [0, 1, 0, name];
        if (value < target || this.missionProgress.claimed.includes(name)) return;
        this.missionProgress.claimed.push(name);
        this.addGems(reward);
        this.showToast(`${label} Ödülü Alındı! (+${reward} 💎)`, '💎', 'ÖDÜL ALINDI');
        this.setStatus(`Görev tamamlandı! +${reward} Elmas 💎`, 'ready');
        this.renderMetaProgress();
    }

    checkMissionCompletion() {
        const goals = {
            merges: [this.missionProgress.merges, 10, 5, '10 Birleşme Görevi'],
            tile: [this.missionProgress.maxTile, 128, 8, '128 Taşı Görevi'],
            score: [this.missionProgress.score, 500, 8, '500 Skor Görevi']
        };
        Object.entries(goals).forEach(([name, [value, target, reward, label]]) => {
            const claimed = this.missionProgress.claimed.includes(name);
            const notified = this.missionProgress.notified.includes(name);
            if (value >= target && !claimed && !notified) {
                this.missionProgress.notified.push(name);
                this.showToast(`${label} Tamamlandı! (+${reward} 💎 Ödül Hazır)`, '🎯', '🎯 GÖREV TAMAMLANDI!');
                this.setStatus(`🎯 Görev Hazır: +${reward} Elmas!`, 'ready');
                if (typeof sounds !== 'undefined') sounds.playLevelUp();
                if (typeof effects !== 'undefined') effects.triggerHaptic('success');
            }
        });
        this.renderMetaProgress();
    }

    getDailyRewardsConfig() {
        return [
            { day: 1, gems: 50, hammer: 0, bomb: 0, title: 'Gün 1', label: '50 💎', icon: '💎' },
            { day: 2, gems: 100, hammer: 1, bomb: 0, title: 'Gün 2', label: '100 💎 + 🔨', icon: '🔨' },
            { day: 3, gems: 150, hammer: 0, bomb: 0, title: 'Gün 3', label: '150 💎', icon: '💎' },
            { day: 4, gems: 200, hammer: 0, bomb: 1, title: 'Gün 4', label: '200 💎 + 💣', icon: '💣' },
            { day: 5, gems: 250, hammer: 1, bomb: 0, title: 'Gün 5', label: '250 💎 + 🔨', icon: '🔨' },
            { day: 6, gems: 280, hammer: 0, bomb: 1, title: 'Gün 6', label: '280 💎 + 💣', icon: '💣' },
            { day: 7, gems: 300, hammer: 1, bomb: 1, title: 'Gün 7+ SÜPER PAKET', label: '300 💎 + 🔨 + 💣', isMega: true }
        ];
    }

    getDailyRewardState() {
        const today = new Date().toISOString().slice(0, 10);
        const lastClaimDate = this.safeGet('gridoria_daily_last_claim_date') || this.safeGet('gridoria_daily_reward_claim') || '';
        let streak = parseInt(this.safeGet('gridoria_daily_streak') || '1', 10);

        const claimedToday = (lastClaimDate === today);

        if (!claimedToday && lastClaimDate) {
            const lastDate = new Date(lastClaimDate);
            const currentDate = new Date(today);
            const diffDays = Math.round((currentDate - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays > 1) {
                streak = 1;
            }
        }

        return {
            today,
            lastClaimDate,
            claimedToday,
            currentStreak: Math.min(Math.max(1, streak), 7)
        };
    }

    openDailyRewardModal() {
        const modal = document.getElementById('modal-daily');
        if (!modal) return;

        this.renderDailyRewardModal();
        modal.classList.remove('hidden');
        this.startDailyCountdownTimer();
    }

    renderDailyRewardModal() {
        const container = document.getElementById('daily-grid-container');
        const claimBtn = document.getElementById('btn-claim-daily');
        const subtitle = document.getElementById('daily-reward-subtitle');
        if (!container) return;

        const state = this.getDailyRewardState();
        const rewards = this.getDailyRewardsConfig();
        const activeDay = state.claimedToday ? state.currentStreak : (state.currentStreak > 7 ? 1 : state.currentStreak);

        container.innerHTML = '';

        rewards.forEach(r => {
            const card = document.createElement('div');
            const isClaimed = r.day < activeDay || (r.day === activeDay && state.claimedToday);
            const isActive = r.day === activeDay && !state.claimedToday;
            const isLocked = r.day > activeDay;

            card.className = `daily-card ${r.isMega ? 'mega-card' : ''} ${isClaimed ? 'claimed-day' : ''} ${isActive ? 'active-day' : ''} ${isLocked ? 'locked-day' : ''}`;

            if (r.isMega) {
                card.innerHTML = `
                    <div class="daily-card-header">${r.title}</div>
                    <div class="daily-card-body">
                        <div class="mega-rewards-row">
                            <div class="mega-reward-item"><span>💎</span> ${r.gems}</div>
                            <div class="mega-reward-item"><span>🔨</span> 1x</div>
                            <div class="mega-reward-item"><span>💣</span> 1x</div>
                        </div>
                    </div>
                    ${isClaimed ? '<div class="daily-card-checkmark">✓</div>' : ''}
                `;
            } else {
                card.innerHTML = `
                    <div class="daily-card-header">${r.title}</div>
                    <div class="daily-card-body">
                        <span class="daily-card-icon">${r.icon}</span>
                        <span class="daily-card-val">${r.label}</span>
                    </div>
                    ${isClaimed ? '<div class="daily-card-checkmark">✓</div>' : ''}
                `;
            }

            container.appendChild(card);
        });

        if (claimBtn) {
            if (state.claimedToday) {
                claimBtn.innerText = 'ZATEN ALINDI ✔';
                claimBtn.classList.add('disabled');
            } else {
                claimBtn.innerText = 'ÖDÜLÜ AL';
                claimBtn.classList.remove('disabled');
            }
        }

        if (subtitle) {
            subtitle.innerText = state.claimedToday 
                ? 'Bugünün ödülünü aldın! Sonraki ödül için sayacı takip et.' 
                : 'Progress kaybedilecek bir gün kaybolmamalıdır.';
        }
    }

    startDailyCountdownTimer() {
        if (this.dailyTimerInterval) clearInterval(this.dailyTimerInterval);

        const updateTimer = () => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);
            const diff = Math.max(0, midnight - now);

            const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
            const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
            const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

            const timerValEl = document.getElementById('daily-timer-val');
            if (timerValEl) {
                timerValEl.innerText = `${hours} : ${minutes} : ${seconds}`;
            }
        };

        updateTimer();
        this.dailyTimerInterval = setInterval(updateTimer, 1000);
    }

    showDailyRewardIfAvailable() {
        const state = this.getDailyRewardState();
        if (!state.claimedToday) {
            this.openDailyRewardModal();
        }
    }

    claimDailyReward() {
        const state = this.getDailyRewardState();
        const modal = document.getElementById('modal-daily');

        if (state.claimedToday) {
            if (modal) modal.classList.add('hidden');
            this.showToast('Bugünkü ödülünüzü zaten aldınız! 🎁', '✔');
            return;
        }

        const rewards = this.getDailyRewardsConfig();
        const currentReward = rewards.find(r => r.day === state.currentStreak) || rewards[0];

        // Save Claim Date & Advance Streak
        this.safeSet('gridoria_daily_last_claim_date', state.today);
        this.safeSet('gridoria_daily_reward_claim', state.today);

        const nextStreak = state.currentStreak >= 7 ? 1 : state.currentStreak + 1;
        this.safeSet('gridoria_daily_streak', nextStreak.toString());

        // Grant Rewards: Gems + Free Powerups
        if (currentReward.gems > 0) {
            this.addGems(currentReward.gems);
        }
        if (currentReward.hammer > 0 && typeof powerups !== 'undefined') {
            powerups.addFreeCount('hammer', currentReward.hammer);
        }
        if (currentReward.bomb > 0 && typeof powerups !== 'undefined') {
            powerups.addFreeCount('bomb', currentReward.bomb);
        }

        if (modal) modal.classList.add('hidden');
        if (typeof sounds !== 'undefined') sounds.playLevelUp();

        // Toast feedback message
        let rewardMsg = `Günlük Ödül Alındı! +${currentReward.gems} 💎`;
        if (currentReward.hammer > 0 && currentReward.bomb > 0) {
            rewardMsg = `EFSANEVİ ÖDÜL! +${currentReward.gems}💎 +1x🔨 +1x💣`;
        } else if (currentReward.hammer > 0) {
            rewardMsg = `Günlük Ödül! +${currentReward.gems}💎 ve 1x 🔨 Çekiç!`;
        } else if (currentReward.bomb > 0) {
            rewardMsg = `Günlük Ödül! +${currentReward.gems}💎 ve 1x 💣 Bomba!`;
        }

        this.showToast(rewardMsg, '🎁');

        const widgetCheck = document.querySelector('#menu-btn-daily-widget .check-icon');
        if (widgetCheck) widgetCheck.style.display = 'block';
    }

    applyCustomBgPhoto() {
        const savedCustomBg = this.safeGet('gridoria_custom_bg');
        if (savedCustomBg) {
            document.body.style.backgroundImage = `url(${savedCustomBg})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center center';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';

            const thumb = document.querySelector('#card-custom-bg .custom-bg-thumb');
            const icon = document.getElementById('icon-custom-bg-preview');
            const badge = document.getElementById('badge-custom-bg-price');
            if (thumb) {
                thumb.style.backgroundImage = `url(${savedCustomBg})`;
                thumb.style.backgroundSize = 'cover';
                thumb.style.backgroundPosition = 'center';
            }
            if (icon) icon.innerText = '📷';
            if (badge) badge.innerText = 'DEĞİŞTİR 📷';
        }
    }

    updateCustomBgCardPreview() {
        const savedCustomBg = this.safeGet('gridoria_custom_bg');
        const isVip = this.isVip || (this.safeGet('gridoria_is_vip') === 'true');
        const thumb = document.querySelector('#card-custom-bg .custom-bg-thumb');
        const icon = document.getElementById('icon-custom-bg-preview');
        const badge = document.getElementById('badge-custom-bg-price');

        if (savedCustomBg) {
            if (thumb) {
                thumb.style.backgroundImage = `url(${savedCustomBg})`;
                thumb.style.backgroundSize = 'cover';
                thumb.style.backgroundPosition = 'center';
            }
            if (icon) icon.innerText = '📷';
            if (badge) badge.innerText = isVip ? 'DEĞİŞTİR 👑' : 'DEĞİŞTİR (💎500)';
        } else {
            if (badge) badge.innerText = isVip ? 'FOTO SEÇ 👑' : '💎 500';
        }
    }

    openCustomBgConfirmModal() {
        const modal = document.getElementById('modal-custom-bg-confirm');
        const iconEl = document.getElementById('confirm-custom-bg-icon');
        const descEl = document.getElementById('confirm-custom-bg-desc');
        const labelEl = document.getElementById('confirm-custom-bg-price-label');
        const valEl = document.getElementById('confirm-custom-bg-price-val');
        const buyBtn = document.getElementById('btn-buy-custom-bg');

        const isVip = this.isVip || (this.safeGet('gridoria_is_vip') === 'true');

        if (isVip) {
            if (iconEl) iconEl.innerText = '👑';
            if (descEl) descEl.innerText = '👑 VIP Üyeliğiniz Aktif! Fotoğrafınızı istediğiniz kadar ücretsiz ve sınırsız değiştirebilirsiniz.';
            if (labelEl) labelEl.innerText = 'VIP Ayrıcalığı:';
            if (valEl) valEl.innerText = '👑 Sınırsız Ücretsiz';
            if (buyBtn) buyBtn.innerText = '✨ Fotoğraf Seç (Ücretsiz)';
        } else {
            if (iconEl) iconEl.innerText = '📸';
            if (descEl) descEl.innerText = 'Galerinizden yeni fotoğraf yüklemek veya değiştirmek için 500 Mücevher gereklidir. (VIP Üyeler sınırsız yükler).';
            if (labelEl) labelEl.innerText = 'Yükleme Ücreti:';
            if (valEl) valEl.innerText = '💎 500 Mücevher';
            if (buyBtn) buyBtn.innerText = '✨ 500 💎 Ver & Fotoğraf Seç';
        }

        if (modal) modal.classList.remove('hidden');
    }

    showConfirmDialog({ icon = '⚠️', title = 'Emin misiniz?', desc = '', okText = 'TAMAM', cancelText = 'İPTAL', okBtnBg = '', onConfirm = null } = {}) {
        const modal = document.getElementById('modal-confirm-dialog');
        const iconEl = document.getElementById('confirm-dialog-icon');
        const titleEl = document.getElementById('confirm-dialog-title');
        const descEl = document.getElementById('confirm-dialog-desc');
        const cancelBtn = document.getElementById('btn-confirm-dialog-cancel');
        const okBtn = document.getElementById('btn-confirm-dialog-ok');

        if (!modal || !okBtn || !cancelBtn) return;

        if (iconEl) iconEl.innerText = icon;
        if (titleEl) titleEl.innerText = title;
        if (descEl) descEl.innerText = desc;
        if (okBtn) {
            okBtn.innerText = okText;
            okBtn.style.background = okBtnBg || 'linear-gradient(135deg, #ef4444, #dc2626)';
        }
        if (cancelBtn) cancelBtn.innerText = cancelText;

        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);

        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        modal.classList.remove('hidden');

        newCancelBtn.addEventListener('click', (e) => {
            if (e) e.stopPropagation();
            modal.classList.add('hidden');
        });

        newOkBtn.addEventListener('click', (e) => {
            if (e) e.stopPropagation();
            modal.classList.add('hidden');
            if (typeof onConfirm === 'function') onConfirm();
        });
    }

    openCropModal(imageSrc, targetType = 'bg') {
        this.rawCropImageSrc = imageSrc;
        this.cropTargetType = targetType || 'bg';
        this.cropRotation = 0;
        this.cropZoom = 1;

        const cropModal = document.getElementById('modal-crop-photo');
        const cropImg = document.getElementById('crop-image-target');
        const zoomSlider = document.getElementById('crop-zoom-slider');

        if (cropImg) {
            cropImg.src = imageSrc;
            cropImg.style.transform = 'scale(1) rotate(0deg)';
        }
        if (zoomSlider) zoomSlider.value = 1;
        if (cropModal) cropModal.classList.remove('hidden');
    }

    updateCropTransform() {
        const cropImg = document.getElementById('crop-image-target');
        if (cropImg) {
            cropImg.style.transform = `scale(${this.cropZoom}) rotate(${this.cropRotation}deg)`;
        }
    }

    applyCroppedImage() {
        const cropImg = document.getElementById('crop-image-target');
        if (!cropImg || !this.rawCropImageSrc) return;

        const isAvatar = (this.cropTargetType === 'avatar');
        const canvas = document.createElement('canvas');
        canvas.width = isAvatar ? 512 : 1080;
        canvas.height = isAvatar ? 512 : 1920;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = '#070a12';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((this.cropRotation * Math.PI) / 180);

            const isRotated90 = (this.cropRotation % 180 !== 0);
            const targetW = isRotated90 ? canvas.height : canvas.width;
            const targetH = isRotated90 ? canvas.width : canvas.height;

            const scaleW = targetW / img.width;
            const scaleH = targetH / img.height;
            const baseScale = Math.max(scaleW, scaleH);
            const finalScale = baseScale * this.cropZoom;

            const drawW = img.width * finalScale;
            const drawH = img.height * finalScale;

            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();

            const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.90);

            if (isAvatar) {
                // 👤 PROFILE AVATAR PHOTO ONLY
                this.userAvatar = croppedDataUrl;
                this.selectedAvatarTemp = croppedDataUrl;
                this.safeSet('gridoria_user_avatar', croppedDataUrl);
                
                const profileImg = document.getElementById('user-avatar-img');
                const menuImg = document.getElementById('menu-avatar-img');
                const editPreviewImg = document.getElementById('edit-avatar-preview-img');
                if (profileImg) profileImg.src = croppedDataUrl;
                if (menuImg) menuImg.src = croppedDataUrl;
                if (editPreviewImg) editPreviewImg.src = croppedDataUrl;

                const cropModal = document.getElementById('modal-crop-photo');
                if (cropModal) cropModal.classList.add('hidden');

                this.showToast('Profil Fotoğrafı Güncellendi! 👤', '✨');
                return;
            }

            // 🎨 CUSTOM BACKGROUND THEME ONLY
            this.safeSet('gridoria_custom_bg', croppedDataUrl);

            if (!Array.isArray(this.unlockedBgs)) this.unlockedBgs = ['walnut', 'wood'];
            if (!this.unlockedBgs.includes('custom')) {
                this.unlockedBgs.push('custom');
                this.safeSet('gridoria_unlocked_bgs', JSON.stringify(this.unlockedBgs));
            }

            this.currentBgTheme = 'custom';
            document.body.dataset.bgTheme = 'custom';
            document.body.dataset.theme = 'custom';
            this.applyCustomBgPhoto();

            document.querySelectorAll('.bg-card').forEach(card => {
                card.classList.toggle('active', card.dataset.bg === 'custom');
            });
            this.safeSet('gridoria_bg_theme', 'custom');

            const cropModal = document.getElementById('modal-crop-photo');
            if (cropModal) cropModal.classList.add('hidden');

            this.showToast('Fotoğraf Teması Tam Oturtuldu! 📸', '🎨');
        };
        img.src = this.rawCropImageSrc;
    }

    selectBgTheme(bgKey, cost = 250) {
        if (!Array.isArray(this.unlockedBgs)) {
            const savedUnlocked = this.safeGet('gridoria_unlocked_bgs');
            if (savedUnlocked) {
                try {
                    this.unlockedBgs = JSON.parse(savedUnlocked);
                } catch (e) {
                    this.unlockedBgs = ['obsidian', 'walnut', 'wood', 'forest'];
                }
            } else {
                this.unlockedBgs = ['obsidian', 'walnut', 'wood', 'forest'];
            }
        }

        if (bgKey === 'custom') {
            const savedCustomBg = this.safeGet('gridoria_custom_bg');
            this.currentBgTheme = 'custom';
            this.currentTheme = 'custom';
            document.body.dataset.bgTheme = 'custom';
            document.body.dataset.theme = 'custom';

            if (savedCustomBg) {
                this.applyCustomBgPhoto();
            }
            this.openCustomBgConfirmModal();
            return;
        }

        // Check if theme is locked and requires gem purchase
        const isFree = cost === 0 || ['obsidian', 'walnut', 'wood', 'forest'].includes(bgKey);
        const isUnlocked = isFree || this.unlockedBgs.includes(bgKey);

        if (!isUnlocked) {
            const themeCost = cost > 0 ? cost : 250;
            if (this.gems < themeCost) {
                this.showToast(`Yetersiz Elmas! Bu tema için ${themeCost} 💎 gerekiyor.`, '⚠️', 'YETERSIZ ELMAS');
                if (typeof sounds !== 'undefined') sounds.playFeverEnd();
                return;
            }
            if (this.deductGems(themeCost)) {
                this.unlockedBgs.push(bgKey);
                this.safeSet('gridoria_unlocked_bgs', JSON.stringify(this.unlockedBgs));
                const shopGemsVal = document.getElementById('shop-gems-val');
                if (shopGemsVal) shopGemsVal.innerText = this.gems.toLocaleString('tr-TR');
                
                const themeNames = {
                    aurora: 'Kutup Işıkları', nebula: 'Kozmik Nebula', oak: 'Meşe Ahşap',
                    cherry: 'Kiraz Ahşap', ebony: 'Abanoz Ahşap', clouds: 'Altın Gökyüzü',
                    earth: 'Dünya & Uzay', ocean: 'Turkuaz Deniz', puppy: 'Sevimli Köpekler',
                    cat: 'Kara Kedi', lake: 'Gece Gölü', cyber: 'Siber Yarış'
                };
                this.showToast(`${themeNames[bgKey] || bgKey} Teması ${themeCost} 💎 Karşılığında Satın Alındı!`, '🎨', 'TEMA AÇILDI');
                if (typeof effects !== 'undefined') effects.triggerConfetti();
            } else {
                return;
            }
        }

        document.body.style.backgroundImage = '';
        this.currentBgTheme = bgKey;
        this.currentTheme = bgKey;
        document.body.dataset.bgTheme = bgKey;
        document.body.dataset.theme = bgKey;

        this.safeSet('gridoria_bg_theme', this.currentBgTheme);
        this.safeSet('gridoria_theme', this.currentBgTheme);
        this.safeSet('gridoria_unlocked_bgs', JSON.stringify(this.unlockedBgs));
        this.updateThemeCardsUI();
        this.updateCustomBgCardPreview();
        if (typeof sounds !== 'undefined') sounds.playReward();
    }

    updateThemeCardsUI() {
        if (!Array.isArray(this.unlockedBgs)) {
            const savedUnlocked = this.safeGet('gridoria_unlocked_bgs');
            if (savedUnlocked) {
                try {
                    this.unlockedBgs = JSON.parse(savedUnlocked);
                } catch (e) {
                    this.unlockedBgs = ['obsidian', 'walnut', 'wood', 'forest'];
                }
            } else {
                this.unlockedBgs = ['obsidian', 'walnut', 'wood', 'forest'];
            }
        }

        document.querySelectorAll('.bg-card').forEach(card => {
            const bgKey = card.dataset.bg;
            if (!bgKey) return;
            const isFree = card.dataset.cost === '0' || ['obsidian', 'walnut', 'wood', 'forest'].includes(bgKey);
            const isUnlocked = isFree || this.unlockedBgs.includes(bgKey);
            const isActive = bgKey === this.currentBgTheme;

            card.classList.toggle('active', isActive);
            card.classList.toggle('is-locked', !isUnlocked);

            let badge = card.querySelector('.bg-price-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'bg-price-badge';
                card.appendChild(badge);
            }

            if (isFree) {
                badge.className = 'bg-price-badge free-badge';
                badge.innerText = 'ÜCRETSİZ';
            } else if (isUnlocked) {
                badge.className = 'bg-price-badge unlocked-badge';
                badge.innerText = 'AÇILDI ✓';
            } else {
                const price = card.dataset.cost || '250';
                badge.className = 'bg-price-badge';
                badge.innerText = `🔒 ${price} 💎`;
            }
        });
    }

    selectColorPalette(colorKey) {
        this.currentColorPalette = colorKey;
        document.body.dataset.colorPalette = colorKey;
        document.querySelectorAll('.palette-card').forEach(card => {
            card.classList.toggle('active', card.dataset.color === colorKey);
        });
        this.safeSet('gridoria_color_palette', colorKey);
        if (typeof sounds !== 'undefined') sounds.playReward();
    }

    setStatus(text, state = 'ready') {
        if (!this.statusEl) return;
        this.statusEl.innerText = text;
        if (this.statusEl.parentElement) {
            this.statusEl.parentElement.dataset.state = state;
        }
    }

    isComboFireActive() {
        return false;
    }

    activateComboFire() {}

    _stopFeverMode() {
        clearInterval(this._feverInterval);
        this.comboFireUntil = 0;
        this.comboMeter = 0;
        this.comboMultiplier = 1;
    }

    checkGameOver() {
        if (this.isGameOver) return;
        let isFull = true;
        for (let c = 0; c < this.COLS; c++) {
            if (this.grid[this.ROWS - 1][c] === 0) {
                isFull = false;
                break;
            }
        }

        if (isFull) {
            this.isGameOver = true;
            this.clearActiveGameState();
            if (typeof sounds !== 'undefined') sounds.playGameOver();
            if (typeof effects !== 'undefined') effects.triggerHaptic('heavy');

            this.gamesPlayedCount = (this.gamesPlayedCount || 0) + 1;
            this.gameOverCount = (this.gameOverCount || 0) + 1;
            this.safeSet('gridoria_gameover_count', String(this.gameOverCount));

            if (this.gameOverCount >= 2 && !this.hasSetupProfile) {
                setTimeout(() => {
                    this.openEditProfileModal(true);
                }, 1000);
            }

            const finalScore = document.getElementById('final-score');
            const finalBest = document.getElementById('final-best');
            const finalGems = document.getElementById('final-gems');

            if (finalScore) finalScore.innerText = this.score.toLocaleString('tr-TR');
            if (finalBest) finalBest.innerText = this.highScore.toLocaleString('tr-TR');
            this.lastEarnedEndGems = this.calculateEndGameGems();
            if (finalGems) finalGems.innerText = `+${this.lastEarnedEndGems} 💎`;

            this.addGems(this.lastEarnedEndGems);

            const btnDouble = document.getElementById('btn-rewarded-double-gems');
            if (btnDouble) {
                btnDouble.disabled = false;
                btnDouble.style.opacity = '1';
                btnDouble.innerHTML = `🎁 2X ELMAS KAZAN (+${this.lastEarnedEndGems} 💎)`;
            }

            const modalGameOver = document.getElementById('modal-gameover');
            if (modalGameOver) modalGameOver.classList.remove('hidden');
        }
    }

    calculateEndGameGems() {
        const milestoneBonus = this.getMaxTileOnBoard() >= 128 ? 2 : 0;
        return Math.min(12, Math.floor(this.score / 250) + milestoneBonus);
    }

    resetGame() {
        this.clearActiveGameState();
        this.grid = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
        this.iceGrid = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
        this.score = 0;
        this.comboMeter = 0;
        this.comboMultiplier = 1;
        this.isGameOver = false;
        this.previousState = null;
        this.initInitialBoard();
        this.updateUI();
    }

    // ── 🎁 AdMob Rewarded & Interstitial Engine ───────────────────────
    requestRewardedAd(rewardType) {
        if (typeof sounds !== 'undefined' && sounds.playClick) sounds.playClick();
        
        let handled = false;
        if (typeof NativeBridge !== 'undefined' && typeof NativeBridge.showRewardedAd === 'function') {
            handled = NativeBridge.showRewardedAd(rewardType);
        } else if (typeof AndroidBridge !== 'undefined' && typeof AndroidBridge.showRewardedAd === 'function') {
            AndroidBridge.showRewardedAd(rewardType);
            handled = true;
        }

        if (!handled) {
            console.log('Browser simulation for Rewarded Ad:', rewardType);
            this.onRewardedAdReward(rewardType);
        }
    }

    onRewardedAdReward(rewardType) {
        if (rewardType === 'revive') {
            this.reviveFromRewardedAd();
        } else if (rewardType === 'double_gems') {
            this.doubleGemsFromRewardedAd();
        } else if (rewardType === 'free_gems') {
            this.claimFreeGemsFromRewardedAd();
        } else if (rewardType === 'peek_unlock') {
            this.unlockNextTilePeekFree();
        }
    }

    reviveFromRewardedAd() {
        const modalGameOver = document.getElementById('modal-gameover');
        if (modalGameOver) modalGameOver.classList.add('hidden');

        // Clear the bottom 2 rows to give breathing space
        for (let r = this.ROWS - 2; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                this.grid[r][c] = 0;
                this.iceGrid[r][c] = 0;
            }
        }
        // Melt ice on row above
        if (this.ROWS - 3 >= 0) {
            for (let c = 0; c < this.COLS; c++) {
                if (this.grid[this.ROWS - 3][c] < 0) {
                    this.grid[this.ROWS - 3][c] = Math.abs(this.grid[this.ROWS - 3][c]);
                    this.iceGrid[this.ROWS - 3][c] = 0;
                }
            }
        }

        this.isGameOver = false;
        this.renderGrid();
        this.updateUI();
        this.saveActiveGameState();

        if (typeof sounds !== 'undefined') sounds.playLevelUp();
        if (typeof effects !== 'undefined') {
            effects.triggerHaptic('heavy');
            effects.showConfetti();
        }
        this.setStatus('🛡️ Reklam izlendi! Canlandınız ve alt sıralar temizlendi.', 'merge');
    }

    doubleGemsFromRewardedAd() {
        const amount = this.lastEarnedEndGems > 0 ? this.lastEarnedEndGems : 10;
        this.addGems(amount);
        const btnDouble = document.getElementById('btn-rewarded-double-gems');
        if (btnDouble) {
            btnDouble.disabled = true;
            btnDouble.style.opacity = '0.5';
            btnDouble.innerText = `✅ +${amount} 💎 2X Elmas Alındı!`;
        }
        if (typeof sounds !== 'undefined') sounds.playLevelUp();
        if (typeof effects !== 'undefined') {
            effects.triggerHaptic('medium');
            effects.showConfetti();
        }
        this.setStatus(`🎁 +${amount} 💎 2X Elmas Hesabınıza Eklendi!`, 'merge');
    }

    claimFreeGemsFromRewardedAd() {
        const amount = 50;
        this.addGems(amount);
        if (typeof sounds !== 'undefined') sounds.playLevelUp();
        if (typeof effects !== 'undefined') {
            effects.triggerHaptic('heavy');
            effects.showConfetti();
        }
        this.setStatus(`🎁 +${amount} 💎 Ücretsiz Elmas Hesabınıza Eklendi!`, 'merge');
        const shopModal = document.getElementById('modal-shop');
        if (shopModal) shopModal.classList.add('hidden');
    }

    requestInterstitialAd() {
        if (this.gamesPlayedCount && this.gamesPlayedCount % 2 === 0) {
            if (typeof NativeBridge !== 'undefined' && typeof NativeBridge.showInterstitialAd === 'function') {
                NativeBridge.showInterstitialAd();
            } else if (typeof AndroidBridge !== 'undefined' && typeof AndroidBridge.showInterstitialAd === 'function') {
                AndroidBridge.showInterstitialAd();
            }
        }
    }
}

// ── Global JavaScript Bridges for Native Android Callbacks ─────────
window.onRewardedAdSuccess = function(rewardType) {
    if (window.game && typeof window.game.onRewardedAdReward === 'function') {
        window.game.onRewardedAdReward(rewardType);
    }
};

window.onRewardedAdFailed = function(rewardType, error) {
    console.warn('Rewarded ad failed:', rewardType, error);
    if (window.game && typeof window.game.setStatus === 'function') {
        window.game.setStatus('⚠️ Reklam yüklenemedi, lütfen tekrar deneyin.', 'normal');
    }
};

window.handleAndroidBack = function() {
    if (window.game && typeof window.game.handleBackAction === 'function') {
        return window.game.handleBackAction();
    }
    return false;
};

// Dynamic Viewport Height (--vh) for mobile browser toolbar and safe area resilience
function updateViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', updateViewportHeight, { passive: true });
window.addEventListener('orientationchange', () => {
    setTimeout(updateViewportHeight, 100);
}, { passive: true });
updateViewportHeight();

let game;
window.addEventListener('DOMContentLoaded', () => {
    updateViewportHeight();
    game = new GridoriaGame();
    window.game = game;
});


