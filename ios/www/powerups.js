// Gridoria Power-ups Manager v3 — Safe execution & animation guard
class PowerUpManager {
    constructor() {
        this.activeMode = null; // 'hammer', 'bomb', 'shrink'
        this.costs = {
            hammer: 25,
            refresh: 10,
            undo: 15,
            bomb: 45,
            shrink: 30,
            swap: 20
        };

        this.initButtons();
        this.createBoardShield();

        if (!localStorage.getItem('gridoria_granted_test_boosters')) {
            localStorage.setItem('gridoria_granted_test_boosters', 'true');
            this.addFreeCount('hammer', 5);
            this.addFreeCount('bomb', 5);
        }

        this.updateFreeBadges();
    }

    getFreeCount(type) {
        return parseInt(localStorage.getItem(`gridoria_free_${type}`) || '0', 10);
    }

    addFreeCount(type, amount = 1) {
        const current = this.getFreeCount(type);
        localStorage.setItem(`gridoria_free_${type}`, (current + amount).toString());
        this.updateFreeBadges();
    }

    useFreeCount(type) {
        const current = this.getFreeCount(type);
        if (current > 0) {
            localStorage.setItem(`gridoria_free_${type}`, (current - 1).toString());
            this.updateFreeBadges();
            return true;
        }
        return false;
    }

    updateFreeBadges() {
        ['hammer', 'bomb', 'shrink', 'undo', 'swap', 'refresh'].forEach(type => {
            const btn = document.getElementById(`powerup-${type}`);
            if (!btn) return;
            const count = this.getFreeCount(type);
            let badge = btn.querySelector('.powerup-free-badge');
            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'powerup-free-badge';
                    btn.appendChild(badge);
                }
                badge.innerText = count.toString();
            } else if (badge) {
                badge.remove();
            }
        });
    }

    createBoardShield() {
        const board = document.getElementById('grid-board');
        if (!board) return;
        if (this.boardShield && this.boardShield.isConnected) return;

        this.boardShield = document.createElement('div');
        this.boardShield.className = 'powerup-board-shield';
        board.appendChild(this.boardShield);

        const usePowerupAt = (clientX, clientY, event) => {
            if (!this.activeMode || !game || game.isAnimating) return;
            const rect = board.getBoundingClientRect();
            const col = Math.max(0, Math.min(game.COLS - 1, Math.floor((clientX - rect.left) / (rect.width / game.COLS))));
            const row = Math.max(0, Math.min(game.ROWS - 1, Math.floor((clientY - rect.top) / (rect.height / game.ROWS))));
            this.handleTileClick(row, col);
            event.preventDefault();
            event.stopImmediatePropagation();
        };

        this.boardShield.addEventListener('touchend', (event) => {
            const touch = event.changedTouches[0];
            if (touch) usePowerupAt(touch.clientX, touch.clientY, event);
        }, { passive: false });

        this.boardShield.addEventListener('click', (event) => {
            usePowerupAt(event.clientX, event.clientY, event);
        });
    }

    initButtons() {
        const bind = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', fn);
        };
        bind('powerup-hammer', () => this.selectPowerup('hammer'));
        bind('powerup-refresh', () => this.triggerRefresh());
        bind('powerup-undo', () => this.triggerUndo());
        bind('powerup-bomb', () => this.selectPowerup('bomb'));
        bind('powerup-shrink', () => this.selectPowerup('shrink'));
        bind('powerup-swap', () => this.triggerSwap());
        bind('btn-cancel-powerup', () => this.clearActiveMode());
    }

    selectPowerup(type) {
        if (!game || game.isAnimating) return;

        const freeCount = this.getFreeCount(type);
        const cost = this.costs[type];
        if (freeCount <= 0 && game.gems < cost) {
            if (game && typeof game.showToast === 'function') {
                game.showToast(`Yetersiz Elmas! Bu joker için ${cost} 💎 gerekiyor.`, '⚠️', 'YETERSIZ ELMAS');
            }
            const shopBtn = document.getElementById('btn-open-shop');
            if (shopBtn) shopBtn.click();
            return;
        }

        if (this.activeMode === type) {
            this.clearActiveMode();
            return;
        }

        this.activeMode = type;
        this.updateUI();
    }

    clearActiveMode() {
        this.activeMode = null;
        this.updateUI();
    }

    updateUI() {
        const banner = document.getElementById('powerup-banner');
        const bannerText = document.getElementById('powerup-banner-text');

        document.querySelectorAll('.powerup-btn').forEach(btn => btn.classList.remove('active-mode'));

        if (this.activeMode === 'hammer') {
            const hammerBtn = document.getElementById('powerup-hammer');
            if (hammerBtn) hammerBtn.classList.add('active-mode');
            if (bannerText) bannerText.innerText = 'ÇEKİÇ AKTİF: Kırmak istediğiniz bloğa dokunun!';
            if (banner) banner.classList.remove('hidden');
        } else if (this.activeMode === 'bomb') {
            const bombBtn = document.getElementById('powerup-bomb');
            if (bombBtn) bombBtn.classList.add('active-mode');
            if (bannerText) bannerText.innerText = 'BOMBA AKTİF: Patlatmak istediğiniz taşa dokunun!';
            if (banner) banner.classList.remove('hidden');
        } else if (this.activeMode === 'shrink') {
            const shrinkBtn = document.getElementById('powerup-shrink');
            if (shrinkBtn) shrinkBtn.classList.add('active-mode');
            if (bannerText) bannerText.innerText = 'KÜÇÜLT AKTİF: Değerini azaltmak istediğiniz taşa dokunun!';
            if (banner) banner.classList.remove('hidden');
        } else {
            if (banner) banner.classList.add('hidden');
        }

        if (this.boardShield) {
            this.boardShield.classList.toggle('active', Boolean(this.activeMode));
        }
    }

    triggerRefresh() {
        if (!game || game.isAnimating) return;
        const usedFree = this.useFreeCount('refresh');
        const cost = this.costs.refresh;
        if (!usedFree && game.gems < cost) {
            if (game && typeof game.showToast === 'function') {
                game.showToast(`Yetersiz Elmas! Yenilemek için ${cost} 💎 gerekiyor.`, '⚠️', 'YETERSIZ ELMAS');
            }
            const shopBtn = document.getElementById('btn-open-shop');
            if (shopBtn) shopBtn.click();
            return;
        }

        if (usedFree || game.deductGems(cost)) {
            if (typeof sounds !== 'undefined') sounds.playMerge(3);
            game.generateNewShooterTile();
            if (typeof effects !== 'undefined') effects.triggerHaptic('medium');
        }
    }

    triggerUndo() {
        if (!game || game.isAnimating) return;
        if (!game.previousState) {
            if (game && typeof game.showToast === 'function') {
                game.showToast('Geri alınacak önceki hamle bulunmuyor!', 'ℹ️', 'BİLGİ');
            }
            return;
        }

        const usedFree = this.useFreeCount('undo');
        const cost = this.costs.undo;
        if (!usedFree && game.gems < cost) {
            if (game && typeof game.showToast === 'function') {
                game.showToast(`Yetersiz Elmas! Geri almak için ${cost} 💎 gerekiyor.`, '⚠️', 'YETERSIZ ELMAS');
            }
            const shopBtn = document.getElementById('btn-open-shop');
            if (shopBtn) shopBtn.click();
            return;
        }

        if (usedFree || game.deductGems(cost)) {
            if (typeof sounds !== 'undefined') sounds.playMerge(2);
            game.restorePreviousState(true);
            game.previousState = null;
            game.saveData();
            if (typeof effects !== 'undefined') effects.triggerHaptic('medium');
        }
    }

    triggerSwap() {
        if (!game || game.isAnimating) return;
        const usedFree = this.useFreeCount('swap');
        const cost = this.costs.swap;
        if (!usedFree && game.gems < cost) {
            if (game && typeof game.showToast === 'function') {
                game.showToast(`Yetersiz Elmas! Değiştirmek için ${cost} 💎 gerekiyor.`, '⚠️', 'YETERSIZ ELMAS');
            }
            const shopBtn = document.getElementById('btn-open-shop');
            if (shopBtn) shopBtn.click();
            return;
        }

        if (usedFree || game.deductGems(cost)) {
            const temp = game.currentShooterVal;
            game.currentShooterVal = game.nextShooterVal;
            game.nextShooterVal = temp;
            game.updateShooterTiles();
            if (typeof sounds !== 'undefined') sounds.playMerge(2);
            if (typeof effects !== 'undefined') effects.triggerHaptic('light');
        }
    }

    handleTileClick(row, col) {
        if (!this.activeMode || !game || game.isAnimating) return false;

        const showPowerupEffect = (cell, color) => {
            if (!cell || typeof effects === 'undefined') return;
            const rect = cell.getBoundingClientRect();
            const pc = document.getElementById('particles-container');
            const container = pc ? pc.getBoundingClientRect() : { left: 0, top: 0 };
            const x = rect.left + rect.width / 2 - container.left;
            const y = rect.top + rect.height / 2 - container.top;
            effects.showWaterRipple(x, y, color);
            effects.showSparkles(x, y, color);
            effects.triggerHaptic('medium');
        };

        if (this.activeMode === 'hammer') {
            if (game.grid[row][col] === 0) return true; // empty cell
            const usedFree = this.useFreeCount('hammer');
            if (usedFree || game.deductGems(this.costs.hammer)) {
                const cell = game.getCellElement(row, col);
                game.grid[row][col] = 0;
                game.iceGrid[row][col] = 0;
                game.renderGrid();
                if (typeof sounds !== 'undefined') sounds.playHammer();
                showPowerupEffect(cell, '#ff0844');
                game.applyCeilingGravityAndMerge();
                this.clearActiveMode();
            }
            return true;
        }

        if (this.activeMode === 'bomb') {
            const targetArea = [
                { r: row, c: col },         // Dokunulan merkez taş
                { r: row - 1, c: col },     // Yukarıdaki 1 taş
                { r: row + 1, c: col },     // Aşağıdaki 1 taş
                { r: row, c: col - 1 },     // Soldaki 1 taş
                { r: row, c: col + 1 }      // Sağdaki 1 taş
            ];

            const validPositions = [];
            for (const pos of targetArea) {
                if (pos.r >= 0 && pos.r < game.ROWS && pos.c >= 0 && pos.c < game.COLS) {
                    if (game.grid[pos.r][pos.c] !== 0) {
                        validPositions.push(pos);
                    }
                }
            }

            if (validPositions.length === 0) return true;

            const usedFree = this.useFreeCount('bomb');
            if (usedFree || game.deductGems(this.costs.bomb)) {
                game.isAnimating = true;

                // Play deep 3D explosion sound
                if (typeof sounds !== 'undefined') sounds.playBomb();

                // Trigger screen shake
                const appContainer = document.getElementById('app-container');
                if (appContainer) {
                    appContainer.classList.remove('screen-shake');
                    void appContainer.offsetWidth;
                    appContainer.classList.add('screen-shake');
                    setTimeout(() => appContainer.classList.remove('screen-shake'), 240);
                }

                // Stage 1: Trigger explosion animation & particle bursts on each exploding tile
                validPositions.forEach(pos => {
                    const cell = game.getCellElement(pos.r, pos.c);
                    if (cell) {
                        const tileEl = cell.querySelector('.tile');
                        if (tileEl) {
                            tileEl.classList.add('tile-exploding-shatter');
                        }
                        showPowerupEffect(cell, '#ff5500');
                    }
                });

                // Stage 2: Wait 360ms for disintegration animation before clearing grid & shifting gravity
                setTimeout(() => {
                    validPositions.forEach(pos => {
                        game.grid[pos.r][pos.c] = 0;
                        game.iceGrid[pos.r][pos.c] = 0;
                    });

                    game.renderGrid();
                    game.applyCeilingGravityAndMerge(() => {
                        game.isAnimating = false;
                        game.checkGameOver();
                    });
                    this.clearActiveMode();
                }, 360);
            }
            return true;
        }

        if (this.activeMode === 'shrink') {
            const rawValue = game.grid[row][col];
            const value = Math.abs(rawValue);
            if (value < 4) return true;
            if (game.deductGems(this.costs.shrink)) {
                const cell = game.getCellElement(row, col);
                const newVal = value / 2;
                game.grid[row][col] = rawValue < 0 ? -newVal : newVal;
                game.renderGrid();
                if (typeof sounds !== 'undefined') sounds.playMerge(1);
                showPowerupEffect(cell, '#00f2fe');
                game.applyCeilingGravityAndMerge();
                this.clearActiveMode();
            }
            return true;
        }

        return false;
    }
}

const powerups = new PowerUpManager();
