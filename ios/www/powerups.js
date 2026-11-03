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
            if (bannerText) bannerText.innerText = window.i18n ? (window.i18n.t('powerup_select_tile') || '🛸 UFO AKTİF: Çekmek istediğin bloğa dokun!') : '🛸 UFO AKTİF: Çekmek istediğin bloğa dokun!';
            if (banner) banner.classList.remove('hidden');
        } else if (this.activeMode === 'bomb') {
            const bombBtn = document.getElementById('powerup-bomb');
            if (bombBtn) bombBtn.classList.add('active-mode');
            if (bannerText) bannerText.innerText = window.i18n ? (window.i18n.t('powerup_select_drone') || '🎯 DRON SALDIRISI: Vurmak istediğin 5 bloğun merkezine dokun!') : '🎯 DRON SALDIRISI: Vurmak istediğin 5 bloğun merkezine dokun!';
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
            game.isAnimating = true;
            if (typeof effects !== 'undefined' && typeof effects.playTimeRewindAnimation === 'function') {
                effects.playTimeRewindAnimation({
                    onRestore: () => {
                        game.restorePreviousState(true);
                        game.previousState = null;
                        game.saveData();
                    },
                    onComplete: () => {
                        game.isAnimating = false;
                    }
                });
            } else {
                if (typeof sounds !== 'undefined') sounds.playUndo();
                game.restorePreviousState(true);
                game.previousState = null;
                game.saveData();
                if (typeof effects !== 'undefined') effects.triggerHaptic('medium');
                game.isAnimating = false;
            }
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
            game.isAnimating = true;
            if (typeof effects !== 'undefined' && typeof effects.playShooterSwapAnimation === 'function') {
                effects.playShooterSwapAnimation({
                    onSwap: () => {
                        const temp = game.currentShooterVal;
                        game.currentShooterVal = game.nextShooterVal;
                        game.nextShooterVal = temp;
                        game.updateShooterTiles();
                    },
                    onComplete: () => {
                        game.isAnimating = false;
                    }
                });
            } else {
                const temp = game.currentShooterVal;
                game.currentShooterVal = game.nextShooterVal;
                game.nextShooterVal = temp;
                game.updateShooterTiles();
                if (typeof sounds !== 'undefined') sounds.playSwap();
                if (typeof effects !== 'undefined') effects.triggerHaptic('light');
                game.isAnimating = false;
            }
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
                const tileEl = cell ? cell.querySelector('.tile') : null;
                const isFrozen = (game.iceGrid && game.iceGrid[row][col] > 0) || (game.grid[row][col] < 0);
                const tileVal = Math.abs(game.grid[row][col]);

                this.clearActiveMode();
                game.isAnimating = true;

                if (typeof effects !== 'undefined' && typeof effects.playUfoAbduction === 'function') {
                    effects.playUfoAbduction({
                        cell: cell,
                        tileEl: tileEl,
                        row: row,
                        col: col,
                        val: tileVal,
                        isFrozen: isFrozen,
                        onAbduct: () => {
                            // Sound is triggered with precise timing inside effects.playUfoAbduction
                        },
                        onComplete: () => {
                            game.grid[row][col] = 0;
                            if (game.iceGrid) game.iceGrid[row][col] = 0;
                            game.renderGrid();
                            game.applyCeilingGravityAndMerge(() => {
                                game.isAnimating = false;
                                game.checkGameOver();
                            });
                        }
                    });
                } else {
                    game.grid[row][col] = 0;
                    if (game.iceGrid) game.iceGrid[row][col] = 0;
                    game.renderGrid();
                    if (typeof sounds !== 'undefined') sounds.playUfoAbduct();
                    game.applyCeilingGravityAndMerge(() => {
                        game.isAnimating = false;
                        game.checkGameOver();
                    });
                }
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
                        const cell = game.getCellElement(pos.r, pos.c);
                        const tileEl = cell ? cell.querySelector('.tile') : null;
                        const isFrozen = (game.iceGrid && game.iceGrid[pos.r][pos.c] > 0) || (game.grid[pos.r][pos.c] < 0);
                        const val = Math.abs(game.grid[pos.r][pos.c]);
                        validPositions.push({
                            r: pos.r,
                            c: pos.c,
                            cell: cell,
                            tileEl: tileEl,
                            isFrozen: isFrozen,
                            val: val
                        });
                    }
                }
            }

            if (validPositions.length === 0) return true;

            const usedFree = this.useFreeCount('bomb');
            if (usedFree || game.deductGems(this.costs.bomb)) {
                this.clearActiveMode();
                game.isAnimating = true;

                const centerCell = game.getCellElement(row, col);

                if (typeof effects !== 'undefined' && typeof effects.playDroneStrike === 'function') {
                    effects.playDroneStrike({
                        centerCell: centerCell,
                        targetPositions: validPositions,
                        onStrike: () => {
                            // Strike impact handled smoothly inside effects.playDroneStrike
                        },
                        onComplete: () => {
                            validPositions.forEach(pos => {
                                game.grid[pos.r][pos.c] = 0;
                                if (game.iceGrid) game.iceGrid[pos.r][pos.c] = 0;
                            });
                            game.renderGrid();
                            game.applyCeilingGravityAndMerge(() => {
                                game.isAnimating = false;
                                game.checkGameOver();
                            });
                        }
                    });
                } else if (typeof effects !== 'undefined' && typeof effects.playBlackHole === 'function') {
                    effects.playBlackHole({
                        centerCell: centerCell,
                        targetPositions: validPositions,
                        onCollapse: () => {
                            if (typeof sounds !== 'undefined' && typeof sounds.playBlackHoleCollapse === 'function') {
                                sounds.playBlackHoleCollapse();
                            }
                        },
                        onComplete: () => {
                            validPositions.forEach(pos => {
                                game.grid[pos.r][pos.c] = 0;
                                if (game.iceGrid) game.iceGrid[pos.r][pos.c] = 0;
                            });
                            game.renderGrid();
                            game.applyCeilingGravityAndMerge(() => {
                                game.isAnimating = false;
                                game.checkGameOver();
                            });
                        }
                    });
                } else if (typeof effects !== 'undefined' && typeof effects.playSpaceOctopus === 'function') {
                    effects.playSpaceOctopus({
                        centerCell: centerCell,
                        targetPositions: validPositions,
                        onSnatch: () => {
                            if (typeof sounds !== 'undefined' && typeof sounds.playBlackHoleCollapse === 'function') {
                                sounds.playBlackHoleCollapse();
                            }
                        },
                        onComplete: () => {
                            validPositions.forEach(pos => {
                                game.grid[pos.r][pos.c] = 0;
                                if (game.iceGrid) game.iceGrid[pos.r][pos.c] = 0;
                            });
                            game.renderGrid();
                            game.applyCeilingGravityAndMerge(() => {
                                game.isAnimating = false;
                                game.checkGameOver();
                            });
                        }
                    });
                } else if (typeof effects !== 'undefined' && typeof effects.playSpaceChomper === 'function') {
                    effects.playSpaceChomper({
                        centerCell: centerCell,
                        targetPositions: validPositions,
                        onChomp: () => {
                            if (typeof sounds !== 'undefined' && typeof sounds.playOctoSnatch === 'function') {
                                sounds.playOctoSnatch();
                            }
                        },
                        onComplete: () => {
                            validPositions.forEach(pos => {
                                game.grid[pos.r][pos.c] = 0;
                                if (game.iceGrid) game.iceGrid[pos.r][pos.c] = 0;
                            });
                            game.renderGrid();
                            game.applyCeilingGravityAndMerge(() => {
                                game.isAnimating = false;
                                game.checkGameOver();
                            });
                        }
                    });
                } else {
                    // Fallback
                    if (typeof sounds !== 'undefined') sounds.playBomb();
                    validPositions.forEach(pos => {
                        game.grid[pos.r][pos.c] = 0;
                        if (game.iceGrid) game.iceGrid[pos.r][pos.c] = 0;
                    });
                    game.renderGrid();
                    game.applyCeilingGravityAndMerge(() => {
                        game.isAnimating = false;
                        game.checkGameOver();
                    });
                }
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
