// Gridoria Effects Engine v6 — Ultra-Fast Zero-Lag Canvas FX with High-DPI Scaling
class EffectsManager {
    constructor() {
        this.container = document.getElementById('particles-container');
        this.appContainer = document.getElementById('app-container');
        this._particles = [];
        this._rafId = null;
        this._canvas = null;
        this._ctx = null;
        this._dpr = 1;
        this._animating = false;
        this.MAX_PARTICLES = 55;

        let savedVibe = true;
        try {
            const fixedV2 = localStorage.getItem('gridoria_vibe_fix_v2');
            if (!fixedV2) {
                savedVibe = true;
                localStorage.setItem('gridoria_vibration_enabled', 'true');
                localStorage.setItem('gridoria_vibe_fix_v2', 'true');
            } else {
                const ls = localStorage.getItem('gridoria_vibration_enabled');
                if (ls !== null) savedVibe = ls === 'true';
            }
        } catch (e) {}
        this.vibrationEnabled = savedVibe;
    }

    // ── Init canvas (called on first particle burst) ─────────────────
    _initCanvas() {
        if (this._canvas) return;
        const pc = this.container;
        if (!pc) return;

        const canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:40;';
        pc.appendChild(canvas);

        this._canvas = canvas;
        this._ctx = canvas.getContext('2d', { alpha: true });
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas(), { passive: true });
    }

    _resizeCanvas() {
        const pc = this.container;
        if (!this._canvas || !pc) return;
        const r = pc.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        this._dpr = dpr;

        const cssWidth = r.width || pc.offsetWidth || 400;
        const cssHeight = r.height || pc.offsetHeight || 800;

        this._canvas.width = Math.floor(cssWidth * dpr);
        this._canvas.height = Math.floor(cssHeight * dpr);
        this._canvas.style.width = `${cssWidth}px`;
        this._canvas.style.height = `${cssHeight}px`;

        if (this._ctx) {
            this._ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform before scaling
            this._ctx.scale(dpr, dpr);
        }
    }

    // ── Render loop (ONLY runs when particles exist, 0 CPU when idle) ──────
    _startLoop() {
        if (this._animating) return;
        this._animating = true;

        const loop = () => {
            if (!this._ctx || !this._canvas) {
                this._animating = false;
                return;
            }

            const width = this._canvas.width / this._dpr;
            const height = this._canvas.height / this._dpr;

            this._ctx.clearRect(0, 0, width, height);

            for (let i = this._particles.length - 1; i >= 0; i--) {
                const p = this._particles[i];
                p.update();
                p.draw(this._ctx);
                if (p.alpha <= 0) {
                    this._particles.splice(i, 1);
                }
            }

            if (this._particles.length > 0) {
                this._rafId = requestAnimationFrame(loop);
            } else {
                this._ctx.clearRect(0, 0, width, height);
                this._animating = false;
                this._rafId = null;
            }
        };

        loop();
    }

    // ── Particle burst (fire or water) ────────────────────────────────────
    createParticleBurst(x, y, color = '#00f2fe', count = 16) {
        this._initCanvas();
        for (let i = 0; i < count; i++) {
            this._particles.push(new BurstParticle(x, y, color));
        }
        // Cap maximum concurrent particles to prevent lag
        if (this._particles.length > this.MAX_PARTICLES) {
            this._particles.splice(0, this._particles.length - this.MAX_PARTICLES);
        }
        this._startLoop();
    }

    // ── Screen Shake ──────────────────────────────────────────────────────
    triggerScreenShake() {
        // Disabled per request for smooth stable gameplay
        return;
    }

    // ── Motion Trail ──────────────────────────────────────────────────────
    createMotionTrail(startX, startY, endX, endY, color = '#00f2fe') {
        if (!this.container) return;
        const steps = 3;
        for (let i = 0; i < steps; i++) {
            setTimeout(() => {
                const p = i / (steps - 1);
                const cx = startX + (endX - startX) * p;
                const cy = startY + (endY - startY) * p;
                const el = document.createElement('div');
                el.className = 'tile-ghost-trail';
                el.style.left = `${cx}px`;
                el.style.top = `${cy}px`;
                el.style.borderColor = color;
                el.style.background = `radial-gradient(circle, ${color}bb 0%, transparent 80%)`;
                this.container.appendChild(el);
                setTimeout(() => {
                    if (el.parentNode) el.remove();
                }, 160);
            }, i * 16);
        }
    }

    // ── Water Ripple ──────────────────────────────────────────────────────
    showWaterRipple(left, top, color = '#00f2fe') {
        if (!this.container) return;
        const el = document.createElement('div');
        el.className = 'water-ripple';
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.borderColor = color;
        el.style.background = `radial-gradient(circle, ${color}66 0%, transparent 70%)`;
        this.container.appendChild(el);
        setTimeout(() => {
            if (el.parentNode) el.remove();
        }, 320);
    }

    // ── Sparkles ──────────────────────────────────────────────────────────
    showSparkles(left, top, color = '#ffb703') {
        if (!this.container) return;
        const count = 4;
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'sparkle-star';
            star.style.left = `${left}px`;
            star.style.top = `${top}px`;
            star.style.setProperty('--sparkle-color', color);
            const angle = (i / count) * Math.PI * 2;
            const dist = 20 + Math.random() * 14;
            star.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
            star.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
            this.container.appendChild(star);
            setTimeout(() => {
                if (star.parentNode) star.remove();
            }, 300);
        }
    }

    // ── Score Popup ───────────────────────────────────────────────────────
    showScorePopup(left, top, text = '+64', isFever = false) {
        if (!this.container) return;
        const el = document.createElement('div');
        el.className = 'score-popup' + (isFever ? ' fever-popup' : '');
        el.innerText = text;
        el.style.left = `${left + 10}px`;
        el.style.top = `${top - 10}px`;
        this.container.appendChild(el);
        setTimeout(() => {
            if (el.parentNode) el.remove();
        }, 750);
    }

    // ── Haptic ────────────────────────────────────────────────────────────
    toggleVibration() {
        this.vibrationEnabled = !this.vibrationEnabled;
        try {
            localStorage.setItem('gridoria_vibration_enabled', String(this.vibrationEnabled));
        } catch (e) {}
        if (this.vibrationEnabled) {
            this.triggerHaptic('light');
        }
        return this.vibrationEnabled;
    }

    triggerHaptic(type = 'impact') {
        if (!this.vibrationEnabled) return;
        if (typeof window.AndroidBridge !== 'undefined' && typeof window.AndroidBridge.triggerHaptic === 'function') {
            try {
                window.AndroidBridge.triggerHaptic(type);
                return;
            } catch (e) {}
        }
        if (typeof NativeBridge !== 'undefined' && typeof NativeBridge.triggerHaptic === 'function') {
            try {
                NativeBridge.triggerHaptic(type);
                return;
            } catch (e) {}
        }
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                if (type === 'heavy') navigator.vibrate(45);
                else if (type === 'medium') navigator.vibrate(30);
                else navigator.vibrate(18);
            } catch (e) {}
        }
    }

    // ── 🛸 REAL 3D UFO TRACTOR BEAM ABDUCTION SYSTEM ──────────────────────
    playUfoAbduction({ cell, tileEl, row, col, val, isFrozen, onAbduct, onComplete }) {
        if (!this.container || !cell) {
            if (onAbduct) onAbduct();
            if (onComplete) onComplete();
            return;
        }

        const pcRect = this.container.getBoundingClientRect();
        const cellRect = cell.getBoundingClientRect();

        const targetX = cellRect.left + cellRect.width / 2 - pcRect.left;
        const targetY = cellRect.top + cellRect.height / 2 - pcRect.top;
        const tileSize = Math.max(cellRect.width, cellRect.height) || 60;

        // Capture tile visual styling for abducted entity
        let tileBg = '#475569';
        let tileBgImg = '';
        let tileColor = '#ffffff';
        let tileBorder = 'none';
        let tileShadow = '';
        let tileText = val ? val.toString() : '';

        if (tileEl) {
            const cs = window.getComputedStyle(tileEl);
            tileBg = cs.backgroundColor || '#475569';
            tileBgImg = cs.backgroundImage || '';
            tileColor = cs.color || '#ffffff';
            tileBorder = cs.border || 'none';
            tileShadow = cs.boxShadow || '';
            const numSpan = tileEl.querySelector('.tile-number');
            tileText = numSpan ? numSpan.innerText : (tileEl.innerText || '').trim();
        }

        // 1. Holographic Crop-Circle Target Reticle
        const reticle = document.createElement('div');
        reticle.className = 'ufo-target-reticle';
        reticle.style.left = `${targetX - tileSize / 2}px`;
        reticle.style.top = `${targetY - tileSize / 2}px`;
        reticle.style.width = `${tileSize}px`;
        reticle.style.height = `${tileSize}px`;
        this.container.appendChild(reticle);

        // 2. UFO Saucer Warps In and Hovers directly above the target cell (0ms - 200ms)
        const ufoY = Math.max(15, targetY - 130);
        const ufo = document.createElement('div');
        ufo.className = 'ufo-saucer';
        ufo.style.left = `${targetX - 70}px`;
        ufo.style.top = `${ufoY}px`;
        ufo.innerHTML = `
            <svg class="ufo-saucer-svg" viewBox="0 0 140 85" width="140" height="85">
                <defs>
                    <linearGradient id="ufo-hull-g" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ffffff"/>
                        <stop offset="25%" stop-color="#94a3b8"/>
                        <stop offset="60%" stop-color="#334155"/>
                        <stop offset="100%" stop-color="#0f172a"/>
                    </linearGradient>
                    <linearGradient id="ufo-dome-g" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#a7f3d0"/>
                        <stop offset="40%" stop-color="#10b981"/>
                        <stop offset="85%" stop-color="#047857"/>
                        <stop offset="100%" stop-color="#064e3b"/>
                    </linearGradient>
                    <filter id="ufo-glow-flt" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#00f2fe" flood-opacity="0.9"/>
                    </filter>
                    <filter id="ufo-core-flt" x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#10b981" flood-opacity="0.95"/>
                    </filter>
                </defs>
                <ellipse cx="70" cy="30" rx="30" ry="24" fill="url(#ufo-dome-g)" stroke="#6ee7b7" stroke-width="1.5"/>
                <ellipse cx="70" cy="28" rx="8" ry="11" fill="#064e3b"/>
                <ellipse cx="66" cy="26" rx="3.5" ry="5.5" fill="#a7f3d0" transform="rotate(-15 66 26)"/>
                <ellipse cx="74" cy="26" rx="3.5" ry="5.5" fill="#a7f3d0" transform="rotate(15 74 26)"/>
                <path d="M 52 24 Q 65 14 85 18" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.8"/>
                <ellipse cx="70" cy="46" rx="66" ry="18" fill="url(#ufo-hull-g)" stroke="#1e293b" stroke-width="1.8"/>
                <ellipse cx="70" cy="45" rx="64" ry="14" fill="none" stroke="#e2e8f0" stroke-width="1" opacity="0.6"/>
                <circle cx="16" cy="46" r="3.2" fill="#00f2fe"/>
                <circle cx="34" cy="53" r="3.5" fill="#a855f7"/>
                <circle cx="58" cy="57" r="4.0" fill="#10b981"/>
                <circle cx="82" cy="57" r="4.0" fill="#10b981"/>
                <circle cx="106" cy="53" r="3.5" fill="#a855f7"/>
                <circle cx="124" cy="46" r="3.2" fill="#00f2fe"/>
                <ellipse cx="70" cy="54" rx="22" ry="8" fill="#0f172a" stroke="#00f2fe" stroke-width="1.5"/>
                <ellipse cx="70" cy="54" rx="14" ry="5" fill="#10b981" filter="url(#ufo-core-flt)"/>
                <circle cx="70" cy="54" r="5" fill="#ffffff"/>
            </svg>
        `;
        this.container.appendChild(ufo);

        // Sound: UFO Warp / Hover Hum
        if (typeof sounds !== 'undefined' && typeof sounds.playUfoWarp === 'function') {
            sounds.playUfoWarp();
        }

        // 3. Tractor Beam Activates (at 200ms)
        let beam = null;
        setTimeout(() => {
            beam = document.createElement('div');
            beam.className = 'ufo-tractor-beam';
            beam.style.left = `${targetX - 55}px`;
            beam.style.top = `${ufoY + 54}px`;
            beam.style.width = '110px';
            beam.style.height = `${targetY + tileSize / 2 - (ufoY + 54)}px`;
            this.container.appendChild(beam);

            if (typeof sounds !== 'undefined' && typeof sounds.playUfoBeam === 'function') {
                sounds.playUfoBeam();
            }

            if (tileEl) {
                tileEl.classList.add('tile-abducting-glow');
            }
        }, 200);

        // 4. Tile Abduction Lift & Suction (at 380ms)
        let abductedTile = null;
        setTimeout(() => {
            if (reticle.parentNode) reticle.remove();

            // Clone tile into flying abducted entity
            abductedTile = document.createElement('div');
            abductedTile.className = 'ufo-abducted-tile';
            abductedTile.style.left = `${targetX - tileSize / 2}px`;
            abductedTile.style.top = `${targetY - tileSize / 2}px`;
            abductedTile.style.width = `${tileSize}px`;
            abductedTile.style.height = `${tileSize}px`;
            if (tileBgImg && tileBgImg !== 'none') {
                abductedTile.style.backgroundImage = tileBgImg;
                abductedTile.style.backgroundSize = `${tileSize}px ${tileSize}px`;
            } else {
                abductedTile.style.background = tileBg;
            }
            abductedTile.style.border = tileBorder !== 'none' ? tileBorder : '2px solid #10b981';
            abductedTile.style.boxShadow = '0 0 25px #10b981, inset 0 0 15px #00f2fe';
            abductedTile.style.color = tileColor;
            abductedTile.innerHTML = `<span class="tile-number">${tileText}</span>`;
            abductedTile.style.setProperty('--ufo-lift-distance', `${(targetY - (ufoY + 54))}px`);

            // Crucial: remove original tile immediately from grid board so no ghost remains!
            if (tileEl) {
                tileEl.remove();
            }

            this.container.appendChild(abductedTile);

            // Alien energy sparkles orbiting the ascending tile
            this.createParticleBurst(targetX, targetY, '#10b981', 16);
            this.createParticleBurst(targetX, targetY, '#00f2fe', 12);
        }, 380);

        // 5. Suction into UFO Hatch (at 580ms)
        setTimeout(() => {
            if (abductedTile && abductedTile.parentNode) abductedTile.remove();

            // Sound: Warp chirp suction & haptic
            if (typeof sounds !== 'undefined' && typeof sounds.playUfoAbduct === 'function') {
                sounds.playUfoAbduct();
            }
            if (onAbduct) onAbduct();
            this.triggerHaptic('medium');

            // Burst of emerald/cyan light at the emitter hatch
            this.createParticleBurst(targetX, ufoY + 54, '#10b981', 20);
            this.createParticleBurst(targetX, ufoY + 54, '#ffffff', 10);
            if (isFrozen) {
                this.createParticleBurst(targetX, ufoY + 54, '#00f2fe', 14);
            }
        }, 580);

        // 6. Tractor Beam Snaps Shut & UFO Warps Out at Lightspeed (at 640ms)
        setTimeout(() => {
            if (beam && beam.parentNode) beam.remove();
            ufo.classList.add('ufo-warp-out');

            if (typeof sounds !== 'undefined') {
                if (typeof sounds.playUfoWarpOut === 'function') {
                    sounds.playUfoWarpOut();
                } else if (typeof sounds.playUfoWarp === 'function') {
                    sounds.playUfoWarp();
                }
            }
        }, 640);

        // 7. Cleanup & Board Compaction (at 820ms)
        setTimeout(() => {
            if (ufo.parentNode) ufo.remove();
            if (onComplete) onComplete();
        }, 820);
    }

    // ── 🔨 REAL 3D HAMMER SMASH & TILE SHATTER SYSTEM ──────────────────────
    playHammerSmash({ cell, tileEl, row, col, val, isFrozen, onImpact, onComplete }) {
        if (!this.container || !cell) {
            if (onImpact) onImpact();
            if (onComplete) onComplete();
            return;
        }

        const pcRect = this.container.getBoundingClientRect();
        const cellRect = cell.getBoundingClientRect();

        // Exact center coordinates inside particles-container
        const targetX = cellRect.left + cellRect.width / 2 - pcRect.left;
        const targetY = cellRect.top + cellRect.height / 2 - pcRect.top;
        const tileSize = Math.max(cellRect.width, cellRect.height) || 60;

        // Capture tile visual styling for authentic shatter fragments
        let tileBg = '#475569';
        let tileBgImg = '';
        let tileColor = '#ffffff';
        let tileBorder = 'none';
        let tileShadow = '';
        let tileText = val ? val.toString() : '';

        if (tileEl) {
            const cs = window.getComputedStyle(tileEl);
            tileBg = cs.backgroundColor || '#475569';
            tileBgImg = cs.backgroundImage || '';
            tileColor = cs.color || '#ffffff';
            tileBorder = cs.border || 'none';
            tileShadow = cs.boxShadow || '';
            const numSpan = tileEl.querySelector('.tile-number');
            tileText = numSpan ? numSpan.innerText : (tileEl.innerText || '').trim();
        }

        // 1. Target Reticle & Anticipation Shake (0ms - 80ms)
        const reticle = document.createElement('div');
        reticle.className = 'hammer-target-reticle';
        reticle.style.left = `${targetX - tileSize / 2}px`;
        reticle.style.top = `${targetY - tileSize / 2}px`;
        reticle.style.width = `${tileSize}px`;
        reticle.style.height = `${tileSize}px`;
        this.container.appendChild(reticle);

        if (tileEl) {
            tileEl.classList.add('tile-target-anticipate');
        }

        // 2. Spawn Heavy 3D Warhammer & Motion Arc
        const hammerWrapper = document.createElement('div');
        hammerWrapper.className = 'hammer-weapon-fx';
        hammerWrapper.style.left = `${targetX - 28}px`;
        hammerWrapper.style.top = `${targetY - 42}px`;
        hammerWrapper.innerHTML = `
            <div class="hammer-swing-trail"></div>
            <svg class="hammer-svg" viewBox="0 0 140 180" width="140" height="180">
                <defs>
                    <linearGradient id="h-steel" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ffffff"/>
                        <stop offset="25%" stop-color="#cbd5e1"/>
                        <stop offset="50%" stop-color="#64748b"/>
                        <stop offset="85%" stop-color="#334155"/>
                        <stop offset="100%" stop-color="#0f172a"/>
                    </linearGradient>
                    <linearGradient id="h-bevel" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#94a3b8"/>
                        <stop offset="50%" stop-color="#f1f5f9"/>
                        <stop offset="100%" stop-color="#475569"/>
                    </linearGradient>
                    <linearGradient id="h-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#fffbeb"/>
                        <stop offset="30%" stop-color="#fbbf24"/>
                        <stop offset="70%" stop-color="#d97706"/>
                        <stop offset="100%" stop-color="#78350f"/>
                    </linearGradient>
                    <linearGradient id="h-handle" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#1c1917"/>
                        <stop offset="35%" stop-color="#443224"/>
                        <stop offset="65%" stop-color="#2d2118"/>
                        <stop offset="100%" stop-color="#14100c"/>
                    </linearGradient>
                    <filter id="h-glow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#00f2fe" flood-opacity="0.8"/>
                    </filter>
                    <filter id="h-shadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="12" stdDeviation="8" flood-color="#000000" flood-opacity="0.7"/>
                    </filter>
                </defs>
                <g filter="url(#h-shadow)">
                    <!-- Shaft / Handle -->
                    <path d="M 68 58 L 118 162" stroke="url(#h-handle)" stroke-width="12" stroke-linecap="round"/>
                    <line x1="72" y1="72" x2="80" y2="82" stroke="#d97706" stroke-width="2.5" opacity="0.85"/>
                    <line x1="81" y1="90" x2="89" y2="100" stroke="#d97706" stroke-width="2.5" opacity="0.85"/>
                    <line x1="90" y1="108" x2="98" y2="118" stroke="#d97706" stroke-width="2.5" opacity="0.85"/>
                    <line x1="99" y1="126" x2="107" y2="136" stroke="#d97706" stroke-width="2.5" opacity="0.85"/>
                    <line x1="108" y1="144" x2="116" y2="154" stroke="#d97706" stroke-width="2.5" opacity="0.85"/>
                    <!-- Pommel Counterweight -->
                    <circle cx="120" cy="166" r="8.5" fill="url(#h-gold)" stroke="#451a03" stroke-width="1.5"/>
                    <circle cx="120" cy="166" r="3.5" fill="#fef08a"/>
                    <!-- Reinforced Collar -->
                    <rect x="62" y="50" width="14" height="13" rx="2" fill="url(#h-gold)" stroke="#78350f" stroke-width="1.2" transform="rotate(-28 69 56)"/>
                    <!-- Sledge Head Main Body -->
                    <polygon points="26,30 84,10 98,38 40,58" fill="url(#h-bevel)" stroke="#1e293b" stroke-width="1.5"/>
                    <polygon points="18,34 32,16 88,3 74,21" fill="url(#h-steel)" stroke="#475569" stroke-width="1"/>
                    <polygon points="18,34 26,30 40,58 32,62" fill="url(#h-steel)" stroke="#0f172a" stroke-width="1.5"/>
                    <!-- Striking Face (The Business End) -->
                    <polygon points="12,38 28,18 36,24 20,44" fill="url(#h-bevel)" stroke="#ffffff" stroke-width="1.5"/>
                    <line x1="15" y1="36" x2="25" y2="24" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
                    <!-- Rear Mallet Counter-Spike -->
                    <polygon points="86,16 106,24 100,42 80,34" fill="url(#h-steel)" stroke="#0f172a" stroke-width="1.5"/>
                    <polygon points="106,24 116,28 100,42" fill="url(#h-bevel)"/>
                    <!-- Gold Reinforcement Band -->
                    <polygon points="46,24 64,18 72,40 54,46" fill="url(#h-gold)" stroke="#78350f" stroke-width="1.2"/>
                    <!-- Glowing Runic Energy Core -->
                    <circle cx="59" cy="32" r="5" fill="#00f2fe" filter="url(#h-glow)"/>
                    <polygon points="59,27 63,32 59,37 55,32" fill="#ffffff"/>
                    <!-- Rivets -->
                    <circle cx="49" cy="27" r="1.5" fill="#fef08a"/>
                    <circle cx="69" cy="21" r="1.5" fill="#fef08a"/>
                    <circle cx="51" cy="43" r="1.5" fill="#fef08a"/>
                    <circle cx="67" cy="37" r="1.5" fill="#fef08a"/>
                </g>
            </svg>
        `;
        this.container.appendChild(hammerWrapper);

        // Wind-up aerodynamic whoosh sound during downswing
        setTimeout(() => {
            if (typeof sounds !== 'undefined' && typeof sounds.playHammerWhoosh === 'function') {
                sounds.playHammerWhoosh();
            }
        }, 220);

        // 3. The Smash Impact (at 380ms)
        setTimeout(() => {
            if (reticle.parentNode) reticle.remove();

            // Trigger audio impact & haptic
            if (onImpact) onImpact();
            this.triggerHaptic('heavy');

            // Screen & Board Intense Shock Tremor
            if (this.appContainer) {
                this.appContainer.classList.remove('screen-shake-hammer');
                void this.appContainer.offsetWidth;
                this.appContainer.classList.add('screen-shake-hammer');
                setTimeout(() => {
                    if (this.appContainer) this.appContainer.classList.remove('screen-shake-hammer');
                }, 340);
            }

            // Central White-hot Impact Flash
            const flash = document.createElement('div');
            flash.className = 'hammer-impact-flash';
            flash.style.left = `${targetX}px`;
            flash.style.top = `${targetY}px`;
            this.container.appendChild(flash);
            setTimeout(() => { if (flash.parentNode) flash.remove(); }, 240);

            // Supersonic Shockwave Ring
            const shockwave = document.createElement('div');
            shockwave.className = 'hammer-shockwave-ring';
            shockwave.style.left = `${targetX}px`;
            shockwave.style.top = `${targetY}px`;
            this.container.appendChild(shockwave);
            setTimeout(() => { if (shockwave.parentNode) shockwave.remove(); }, 320);

            // Molten Spark Bursts (Canvas Particle Engine)
            this.createParticleBurst(targetX, targetY, '#ffb703', 22);
            this.createParticleBurst(targetX, targetY, '#ffffff', 14);
            if (isFrozen) {
                this.createParticleBurst(targetX, targetY, '#00f2fe', 16);
            }

            // Remove original smashed tile so only debris flies and no ghost cell remains
            if (tileEl) {
                tileEl.remove();
            }

            // 4. Spawn 3D Fragment Debris Shards & Billowing Dust
            this._spawnShatterDebris({
                targetX,
                targetY,
                tileSize,
                tileBg,
                tileBgImg,
                tileColor,
                tileBorder,
                tileShadow,
                tileText,
                isFrozen
            });

        }, 380);

        // 5. Cleanup hammer weapon & resolve callback
        setTimeout(() => {
            if (hammerWrapper.parentNode) hammerWrapper.remove();
            if (onComplete) onComplete();
        }, 760);
    }

    // ── 🛩️ TACTICAL CYBER-DRONE SORTIE & RETURN SYSTEM ──────────────────────
    playDroneStrike({ centerCell, targetPositions, onStrike, onComplete }) {
        if (!this.container || !centerCell) {
            if (onStrike) onStrike();
            if (onComplete) onComplete();
            return;
        }

        const pcRect = this.container.getBoundingClientRect();
        const centerRect = centerCell.getBoundingClientRect();
        const targetX = centerRect.left + centerRect.width / 2 - pcRect.left;
        const targetY = centerRect.top + centerRect.height / 2 - pcRect.top;

        // Retrieve the booster button position for takeoff and return to dock
        const bombBtn = document.getElementById('powerup-bomb');
        const iconBox = bombBtn ? (bombBtn.querySelector('.booster-icon-box') || bombBtn) : null;
        let startX = targetX;
        let startY = pcRect.height - 45;

        if (iconBox) {
            const bRect = iconBox.getBoundingClientRect();
            startX = bRect.left + bRect.width / 2 - pcRect.left;
            startY = bRect.top + bRect.height / 2 - pcRect.top;
        }

        // Target coordinates and pre-cached styles (All 5 target blocks in cross pattern)
        // CRITICAL PERFORMANCE FIX: Extract and cache all DOM metrics and styles ONCE right now at T=0.
        // Never call getBoundingClientRect() or getComputedStyle() during active animation ticks!
        const targets = targetPositions.map(pos => {
            const el = pos.tileEl || pos.cell;
            const r = el ? el.getBoundingClientRect() : centerRect;
            let bg = '#ef4444';
            let color = '#ffffff';
            let numText = '';
            if (pos.tileEl) {
                const cs = window.getComputedStyle(pos.tileEl);
                if (cs && cs.backgroundColor) bg = cs.backgroundColor;
                if (cs && cs.color) color = cs.color;
                const numSpan = pos.tileEl.querySelector('.tile-number');
                numText = numSpan ? numSpan.innerText : (pos.tileEl.innerText || '');
            }
            return {
                pos: pos,
                el: pos.tileEl,
                x: r.left + r.width / 2 - pcRect.left,
                y: r.top + r.height / 2 - pcRect.top,
                w: r.width || 60,
                h: r.height || 60,
                bg: bg,
                color: color,
                numText: numText
            };
        });

        // 1. Overlay Layer
        const overlay = document.createElement('div');
        overlay.className = 'drone-strike-overlay';
        this.container.appendChild(overlay);

        // Active Launch Pad Glow at Button Slot
        const launchGlow = document.createElement('div');
        launchGlow.className = 'drone-launch-pad-glow';
        launchGlow.style.left = `${startX}px`;
        launchGlow.style.top = `${startY}px`;
        overlay.appendChild(launchGlow);

        // 2. Heavy Stealth UCAV Drone Element
        const drone = document.createElement('div');
        drone.className = 'heavy-military-drone';
        const droneW = 92;
        const droneH = 78;
        const hoverX = targetX;
        const hoverY = Math.max(38, targetY - 65);

        // Base anchor placed exactly at the booster button
        drone.style.width = `${droneW}px`;
        drone.style.height = `${droneH}px`;
        drone.style.left = `${startX - droneW / 2}px`;
        drone.style.top = `${startY - droneH / 2}px`;

        // Initial state: sitting docked inside the booster button at small scale
        drone.style.transform = 'translate3d(0, 0, 0) scale(0.32) rotate(0deg)';
        drone.style.opacity = '1';

        drone.innerHTML = `
            <svg viewBox="0 0 92 78" width="100%" height="100%" fill="none" class="military-drone-svg">
                <defs>
                    <linearGradient id="md-body" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#1e293b"/>
                        <stop offset="45%" stop-color="#0f172a"/>
                        <stop offset="100%" stop-color="#020617"/>
                    </linearGradient>
                    <linearGradient id="md-wing-edge" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#38bdf8"/>
                        <stop offset="100%" stop-color="#00f2fe"/>
                    </linearGradient>
                    <radialGradient id="md-core" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#38bdf8" stop-opacity="1"/>
                        <stop offset="65%" stop-color="#00f2fe" stop-opacity="0.45"/>
                        <stop offset="100%" stop-color="transparent"/>
                    </radialGradient>
                    <filter id="md-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="b"/>
                        <feComposite in="SourceGraphic" in2="b" operator="over"/>
                    </filter>
                </defs>
                <!-- Heavy Delta Wing Chassis -->
                <path d="M46 4 L88 52 L72 68 L58 58 L46 62 L34 58 L20 68 L4 52 Z" fill="url(#md-body)" stroke="#334155" stroke-width="1.8"/>
                <!-- Faceted Stealth Armor Plates -->
                <path d="M46 6 L84 50 L70 54 L46 16 L22 54 L8 50 Z" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
                <!-- Cyber Neon Wing Trim -->
                <line x1="46" y1="6" x2="86" y2="51" stroke="url(#md-wing-edge)" stroke-width="2.2" filter="url(#md-glow)"/>
                <line x1="46" y1="6" x2="6" y2="51" stroke="url(#md-wing-edge)" stroke-width="2.2" filter="url(#md-glow)"/>
                <!-- Wingtip Angular Rudders -->
                <polygon points="88,52 82,65 76,62" fill="#0f172a" stroke="#00f2fe" stroke-width="1.2"/>
                <polygon points="4,52 10,65 16,62" fill="#0f172a" stroke="#00f2fe" stroke-width="1.2"/>
                <!-- Center Tactical Spine & Weapon Bays -->
                <polygon points="46,10 56,38 52,60 40,60 36,38" fill="#0b1120" stroke="#0284c7" stroke-width="1.4"/>
                <!-- Plasma Reactor Core -->
                <circle cx="46" cy="44" r="7.5" fill="#0369a1" stroke="#00f2fe" stroke-width="1.8"/>
                <circle cx="46" cy="44" r="4.5" fill="url(#md-core)" filter="url(#md-glow)"/>
                <!-- Forward FLIR Sensor / Targeting Turret -->
                <ellipse cx="46" cy="18" rx="4" ry="5.5" fill="#020617" stroke="#ef4444" stroke-width="1.4"/>
                <circle cx="46" cy="17" r="2.2" fill="#ef4444" class="m-drone-sensor-pulse"/>
                <!-- Dual Jet Exhaust Thrusters -->
                <rect x="37" y="60" width="6" height="5" rx="1.5" fill="#334155" stroke="#64748b"/>
                <rect x="49" y="60" width="6" height="5" rx="1.5" fill="#334155" stroke="#64748b"/>
                <!-- Twin Jet Thruster Flames -->
                <g class="m-drone-thruster-jets">
                    <polygon points="37,65 43,65 40,77" fill="#00f2fe" filter="url(#md-glow)"/>
                    <polygon points="49,65 55,65 52,77" fill="#00f2fe" filter="url(#md-glow)"/>
                    <polygon points="38.5,65 41.5,65 40,72" fill="#ffffff"/>
                    <polygon points="50.5,65 53.5,65 52,72" fill="#ffffff"/>
                </g>
            </svg>
            <div class="m-drone-afterburner-plume"></div>
        `;
        overlay.appendChild(drone);

        // Force browser layout reflow so the initial dock transform at (0, 0) scale(0.32) is fully registered
        void drone.offsetHeight;

        // Dim button icon to show the drone has dispatched from the dock
        if (bombBtn) {
            bombBtn.classList.add('drone-launching');
            bombBtn.classList.add('drone-in-flight');
            setTimeout(() => bombBtn.classList.remove('drone-launching'), 450);
        }

        // Flight vectors
        const dx = hoverX - startX;
        const dy = hoverY - startY;
        const bankAngle = Math.max(-20, Math.min(20, (dx / (pcRect.width || 400)) * 42));

        // Sound on takeoff & sustained jet spool
        if (typeof sounds !== 'undefined' && typeof sounds.playDroneLaunch === 'function') {
            sounds.playDroneLaunch();
        }
        this.triggerHaptic('medium');

        // Phase 1: Launch From Joker Button Dock & Fly Smoothly to Target (T = 30ms -> 680ms)
        // Duration: 0.65s (smooth, natural speed, clearly trackable, not too fast!)
        requestAnimationFrame(() => {
            drone.classList.add('m-drone-thrusters-active');
            drone.style.transition = 'transform 0.65s cubic-bezier(0.22, 0.15, 0.25, 1)';
            drone.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1) rotate(${bankAngle}deg)`;
        });

        // Phase 2: In-Flight Arrival, Leveling & Multi-Target Tactical Lock-On (T = 680ms -> 920ms)
        const activeReticles = [];
        const activeBeams = [];

        setTimeout(() => {
            // Level wings smoothly upon hovering above target
            drone.style.transition = 'transform 0.16s ease-out';
            drone.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1) rotate(0deg)`;

            if (typeof sounds !== 'undefined' && typeof sounds.playDroneLock === 'function') {
                sounds.playDroneLock();
            }

            // Spawn high-tech military HUD lock crosshairs on all 5 target blocks
            targets.forEach(t => {
                const reticle = document.createElement('div');
                reticle.className = 'military-hud-reticle';
                reticle.style.left = `${t.x}px`;
                reticle.style.top = `${t.y}px`;
                reticle.innerHTML = `
                    <div class="hud-corner hud-tl"></div>
                    <div class="hud-corner hud-tr"></div>
                    <div class="hud-corner hud-bl"></div>
                    <div class="hud-corner hud-br"></div>
                    <div class="hud-center-dot"></div>
                    <div class="hud-lock-label">LOCK</div>
                `;
                overlay.appendChild(reticle);
                activeReticles.push(reticle);

                // Laser targeting beam from drone nose pod to target
                const beam = document.createElement('div');
                beam.className = 'military-laser-beam';
                const bx = hoverX;
                const by = hoverY - 14;
                const bdx = t.x - bx;
                const bdy = t.y - by;
                const dist = Math.hypot(bdx, bdy);
                const angle = Math.atan2(bdy, bdx) * (180 / Math.PI);
                beam.style.left = `${bx}px`;
                beam.style.top = `${by}px`;
                beam.style.width = `${dist}px`;
                beam.style.transform = `rotate(${angle}deg)`;
                overlay.appendChild(beam);
                activeBeams.push(beam);
            });
        }, 680);

        // Phase 3: Salvo Heavy Plasma Missiles Fired (T = 900ms -> 1060ms)
        setTimeout(() => {
            // Recoil kick on the drone hovering over target
            drone.style.transition = 'transform 0.09s ease-out';
            drone.style.transform = `translate3d(${dx}px, ${dy - 10}px, 0) scale(1.04) rotate(0deg)`;
            setTimeout(() => {
                drone.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1) rotate(0deg)`;
            }, 90);

            // Play rocket motor ignition & whoosh sound
            if (typeof sounds !== 'undefined' && typeof sounds.playDroneRocketSalvo === 'function') {
                sounds.playDroneRocketSalvo();
            }

            // Dual wing hardpoint muzzle flashes
            [-18, 18].forEach(offX => {
                const muzzle = document.createElement('div');
                muzzle.className = 'military-drone-muzzle-flash';
                muzzle.style.left = `${hoverX + offX}px`;
                muzzle.style.top = `${hoverY + 12}px`;
                overlay.appendChild(muzzle);
                setTimeout(() => { if (muzzle.parentNode) muzzle.remove(); }, 140);
            });

            // Target tiles enter anticipation heat warning glow
            targets.forEach(t => {
                if (t.el) {
                    t.el.classList.add('tile-target-bomb-heat');
                }
            });

            // Fire 5 high-tech micro-missiles using 100% GPU translate3d hardware motion
            targets.forEach((t, i) => {
                const missile = document.createElement('div');
                missile.className = 'military-plasma-missile';
                const bayOffset = (i % 2 === 0 ? -16 : 16) + (Math.floor(i / 2) - 1) * 6;
                const bx = hoverX + bayOffset;
                const by = hoverY + 14;
                const mdx = t.x - bx;
                const mdy = t.y - by;
                const angle = Math.atan2(mdy, mdx) * (180 / Math.PI) + 90;

                missile.style.left = `${bx - 7}px`;
                missile.style.top = `${by - 19}px`;
                missile.style.transform = `translate3d(0, 0, 0) rotate(${angle}deg)`;

                missile.innerHTML = `
                    <svg class="plasma-missile-svg" viewBox="0 0 14 38" width="14" height="38" fill="none">
                        <defs>
                            <linearGradient id="m-body-${i}" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#334155"/>
                                <stop offset="50%" stop-color="#94a3b8"/>
                                <stop offset="100%" stop-color="#1e293b"/>
                            </linearGradient>
                        </defs>
                        <!-- Missile Sharp Nose Cone -->
                        <polygon points="7,2 12,12 2,12" fill="#ef4444" stroke="#f97316" stroke-width="0.8"/>
                        <!-- Cylindrical Metal Rocket Body -->
                        <rect x="3.5" y="12" width="7" height="15" fill="url(#m-body-${i})" stroke="#475569" stroke-width="0.6"/>
                        <!-- Ion Guidance Fins -->
                        <polygon points="2,20 3.5,22 3.5,27 1,27" fill="#0284c7"/>
                        <polygon points="12,20 10.5,22 10.5,27 13,27" fill="#0284c7"/>
                        <!-- Thruster Exhaust Jet Flame -->
                        <polygon points="4,27 10,27 7,37" fill="#00f2fe"/>
                        <polygon points="5,27 9,27 7,33" fill="#ffffff"/>
                    </svg>
                `;
                overlay.appendChild(missile);

                // Spawn smoke puff trail halfway through flight
                setTimeout(() => {
                    const puff = document.createElement('div');
                    puff.className = 'missile-smoke-puff';
                    puff.style.left = `${bx + mdx * 0.5}px`;
                    puff.style.top = `${by + mdy * 0.5}px`;
                    puff.style.width = '18px';
                    puff.style.height = '18px';
                    overlay.appendChild(puff);
                    setTimeout(() => { if (puff.parentNode) puff.remove(); }, 240);
                }, 75);

                requestAnimationFrame(() => {
                    missile.style.transition = 'transform 0.16s cubic-bezier(0.2, 0, 0.2, 1)';
                    missile.style.transform = `translate3d(${mdx}px, ${mdy}px, 0) rotate(${angle}deg)`;
                });

                setTimeout(() => {
                    if (missile.parentNode) missile.remove();
                }, 160);
            });
        }, 900);

        // Phase 4: MASSIVE IMPACT DETONATION & PHYSICAL BLOCK SHATTER (T = 1060ms)
        // 100% Silky-Smooth 60/120 FPS: ZERO layout reflows, ZERO synchronous queries!
        setTimeout(() => {
            activeBeams.forEach(b => { if (b.parentNode) b.remove(); });
            activeReticles.forEach(r => { if (r.parentNode) r.remove(); });

            // Trigger Thunderous Detonation Sound
            if (typeof sounds !== 'undefined' && typeof sounds.playDroneImpact === 'function') {
                sounds.playDroneImpact();
            } else if (typeof sounds !== 'undefined' && typeof sounds.playBomb === 'function') {
                sounds.playBomb();
            }
            this.triggerHaptic('heavy');
            setTimeout(() => this.triggerHaptic('heavy'), 80);

            // 1. Full Screen Atmospheric Blast Flash (Opacity only)
            const screenFlash = document.createElement('div');
            screenFlash.className = 'drone-strike-screen-flash';
            overlay.appendChild(screenFlash);
            setTimeout(() => { if (screenFlash.parentNode) screenFlash.remove(); }, 260);

            // 2. Heavy Board Camera Shake (No forced offsetWidth reflow!)
            const board = document.getElementById('grid-board');
            if (board) {
                board.classList.remove('board-drone-shake');
                requestAnimationFrame(() => {
                    board.classList.add('board-drone-shake');
                });
                setTimeout(() => board.classList.remove('board-drone-shake'), 380);
            }

            // 3. Central Kinetic Super Shockwave Ring
            const shockwave = document.createElement('div');
            shockwave.className = 'military-blast-shockwave';
            shockwave.style.left = `${targetX}px`;
            shockwave.style.top = `${targetY}px`;
            overlay.appendChild(shockwave);
            setTimeout(() => { if (shockwave.parentNode) shockwave.remove(); }, 340);

            // 4. Detonation on EACH Target Block using pre-cached metrics
            targets.forEach((t) => {
                // Individual block sonic shockwave ring
                const microShock = document.createElement('div');
                microShock.className = 'tile-micro-shockwave';
                microShock.style.left = `${t.x}px`;
                microShock.style.top = `${t.y}px`;
                overlay.appendChild(microShock);
                setTimeout(() => { if (microShock.parentNode) microShock.remove(); }, 320);

                // Volumetric Plasma Fireball
                const fireball = document.createElement('div');
                fireball.className = 'drone-tile-fireball';
                fireball.style.left = `${t.x}px`;
                fireball.style.top = `${t.y}px`;
                fireball.innerHTML = `<div class="drone-fireball-core"></div>`;
                overlay.appendChild(fireball);
                setTimeout(() => { if (fireball.parentNode) fireball.remove(); }, 380);

                // Physical Tile Shatter using pre-cached geometry
                if (t.el) {
                    // Hide original tile visually without removing DOM node (prevents layout thrashing)
                    t.el.style.opacity = '0';
                    t.el.style.pointerEvents = 'none';

                    const tw = t.w;
                    const th = t.h;
                    const shardW = tw * 0.48;
                    const shardH = th * 0.48;

                    // 4 Shattered Tile Quadrant Shards
                    const shardConfigs = [
                        { x: -1, y: -1, rot: -45, fx: -26, fy: -26 },
                        { x: 1, y: -1, rot: 45, fx: 26, fy: -26 },
                        { x: -1, y: 1, rot: -75, fx: -26, fy: 26 },
                        { x: 1, y: 1, rot: 75, fx: 26, fy: 26 }
                    ];

                    shardConfigs.forEach((cfg) => {
                        const shard = document.createElement('div');
                        shard.className = 'tile-shatter-fragment';
                        shard.style.left = `${t.x + (cfg.x * tw * 0.25) - shardW / 2}px`;
                        shard.style.top = `${t.y + (cfg.y * th * 0.25) - shardH / 2}px`;
                        shard.style.width = `${shardW}px`;
                        shard.style.height = `${shardH}px`;
                        shard.style.background = t.bg;
                        shard.style.color = t.color;
                        shard.style.setProperty('--frag-x', `${cfg.fx}px`);
                        shard.style.setProperty('--frag-y', `${cfg.fy}px`);
                        shard.style.setProperty('--frag-rot', `${cfg.rot}deg`);
                        if (t.numText) {
                            shard.innerHTML = `<span style="font-size:10px;font-weight:900;opacity:0.85;">${t.numText}</span>`;
                        }
                        overlay.appendChild(shard);
                        setTimeout(() => { if (shard.parentNode) shard.remove(); }, 380);
                    });
                }

                // High-velocity glowing sparks on canvas (fast, zero DOM overhead)
                this.createParticleBurst(t.x, t.y, '#f97316', 6);
                this.createParticleBurst(t.x, t.y, '#00f2fe', 4);
            });

            if (onStrike) onStrike();
        }, 1060);

        // Phase 5: Return Flight Back Down to Joker Booster Button (T = 1400ms -> 2050ms)
        // Duration: 0.65s (smooth, natural return flight straight back to its button slot!)
        setTimeout(() => {
            drone.classList.add('m-drone-afterburner-boost');
            if (typeof sounds !== 'undefined' && typeof sounds.playDroneReturn === 'function') {
                sounds.playDroneReturn();
            }

            // Calculate subtle descent bank angle towards button
            const returnBank = Math.max(-14, Math.min(14, -bankAngle * 0.45));
            drone.style.transition = 'transform 0.65s cubic-bezier(0.25, 0.1, 0.28, 1)';
            drone.style.transform = `translate3d(0, 0, 0) scale(0.32) rotate(${returnBank}deg)`;
        }, 1400);

        // Phase 6: Dock into Button Slot & Final Landing Lock (T = 2050ms -> 2200ms)
        setTimeout(() => {
            if (typeof sounds !== 'undefined' && typeof sounds.playDroneDock === 'function') {
                sounds.playDroneDock();
            }
            this.triggerHaptic('light');

            if (bombBtn) {
                bombBtn.classList.remove('drone-in-flight');
                bombBtn.classList.add('drone-docked-pulse');
                setTimeout(() => bombBtn.classList.remove('drone-docked-pulse'), 450);
            }
            if (launchGlow.parentNode) launchGlow.remove();
            if (drone.parentNode) drone.remove();
        }, 2050);

        // Phase 7: Complete and Settle Gravity (T = 2200ms)
        setTimeout(() => {
            if (overlay.parentNode) overlay.remove();
            if (onComplete) onComplete();
        }, 2200);
    }

    // ── 🌌 REAL SCI-FI BLACK HOLE (KARA DELİK / SINGULARITY) SYSTEM ──────────
    playBlackHole({ centerCell, targetPositions, onCollapse, onComplete }) {
        if (!this.container || !centerCell) {
            if (onCollapse) onCollapse();
            if (onComplete) onComplete();
            return;
        }

        const pcRect = this.container.getBoundingClientRect();
        const centerRect = centerCell.getBoundingClientRect();
        const targetX = centerRect.left + centerRect.width / 2 - pcRect.left;
        const targetY = centerRect.top + centerRect.height / 2 - pcRect.top;
        const bhSize = 220;

        // Sound: Sub-space gravitational horizon opening
        if (typeof sounds !== 'undefined' && typeof sounds.playBlackHoleOpen === 'function') {
            sounds.playBlackHoleOpen();
        }
        this.triggerHaptic('light');

        // Calculate relative vector to each target tile
        const targetVectors = targetPositions.map(pos => {
            let dx = 0;
            let dy = 0;
            if (pos.tileEl) {
                const r = pos.tileEl.getBoundingClientRect();
                dx = (r.left + r.width / 2) - (centerRect.left + centerRect.width / 2);
                dy = (r.top + r.height / 2) - (centerRect.top + centerRect.height / 2);
            } else if (pos.cell) {
                const r = pos.cell.getBoundingClientRect();
                dx = (r.left + r.width / 2) - (centerRect.left + centerRect.width / 2);
                dy = (r.top + r.height / 2) - (centerRect.top + centerRect.height / 2);
            }
            return { pos, dx, dy };
        });

        // 1. Create the Interstellar Black Hole Singularity Element
        const bhEl = document.createElement('div');
        bhEl.className = 'blackhole-singularity bh-enter';
        bhEl.style.left = `${targetX - bhSize / 2}px`;
        bhEl.style.top = `${targetY - bhSize / 2}px`;
        bhEl.style.width = `${bhSize}px`;
        bhEl.style.height = `${bhSize}px`;

        bhEl.innerHTML = `
            <svg class="blackhole-svg" viewBox="-110 -110 220 220" width="100%" height="100%">
                <defs>
                    <radialGradient id="bh-glow-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#000000" stop-opacity="1"/>
                        <stop offset="35%" stop-color="#4c1d95" stop-opacity="0.8"/>
                        <stop offset="70%" stop-color="#00f2fe" stop-opacity="0.45"/>
                        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
                    </radialGradient>
                    <linearGradient id="accretion-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#00f2fe"/>
                        <stop offset="30%" stop-color="#ec4899"/>
                        <stop offset="70%" stop-color="#a855f7"/>
                        <stop offset="100%" stop-color="#fbbf24"/>
                    </linearGradient>
                    <filter id="bh-neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#00f2fe"/>
                        <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#a855f7"/>
                    </filter>
                    <filter id="photon-ring-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="0" stdDeviation="3.5" flood-color="#ffffff"/>
                        <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#00f2fe"/>
                    </filter>
                </defs>

                <!-- Gravitational Lensing Distort Field -->
                <circle cx="0" cy="0" r="95" fill="url(#bh-glow-grad)"/>

                <!-- Revolving Luminous Accretion Disk Ring -->
                <g class="bh-accretion-disk">
                    <ellipse cx="0" cy="0" rx="88" ry="30" fill="none" stroke="url(#accretion-grad)" stroke-width="8" 
                             stroke-dasharray="140 18 60 12" filter="url(#bh-neon-glow)"/>
                    <ellipse cx="0" cy="0" rx="76" ry="23" fill="none" stroke="#00f2fe" stroke-width="3" 
                             stroke-dasharray="75 25 35 15" opacity="0.85"/>
                    <ellipse cx="0" cy="0" rx="64" ry="17" fill="none" stroke="#fbbf24" stroke-width="2" 
                             stroke-dasharray="45 25" opacity="0.9"/>
                </g>

                <!-- Blinding White Photon Sphere Ring -->
                <circle cx="0" cy="0" r="39" fill="none" stroke="#ffffff" stroke-width="3.5" filter="url(#photon-ring-glow)"/>
                <circle cx="0" cy="0" r="38" fill="none" stroke="#00f2fe" stroke-width="2" opacity="0.9"/>

                <!-- Event Horizon Core (Absolute Void) -->
                <circle cx="0" cy="0" r="36" fill="#000000"/>
            </svg>
        `;
        this.container.appendChild(bhEl);

        // 2. Gravitational Spiral Suction (at 80ms):
        setTimeout(() => {
            targetVectors.forEach(({ pos, dx, dy }) => {
                if (pos.tileEl) {
                    pos.tileEl.style.setProperty('--bh-pull-x', `${-dx}px`);
                    pos.tileEl.style.setProperty('--bh-pull-y', `${-dy}px`);
                    pos.tileEl.classList.add('tile-singularity-pull');
                }
            });
        }, 80);

        // 3. Singularity Implosion & Quantum Dissolve (at 230ms):
        setTimeout(() => {
            bhEl.classList.remove('bh-enter');
            bhEl.classList.add('bh-implode');

            // Play collapse sound & heavy haptic
            if (typeof sounds !== 'undefined' && typeof sounds.playBlackHoleCollapse === 'function') {
                sounds.playBlackHoleCollapse();
            }
            this.triggerHaptic('heavy');

            // Instantly delete target DOM elements
            targetPositions.forEach(p => {
                if (p.tileEl && p.tileEl.parentNode) {
                    p.tileEl.remove();
                }
            });

            // Trigger collapse callback to update logic
            if (onCollapse) onCollapse();

            // Quantum Flash Ring
            const ring = document.createElement('div');
            ring.className = 'singularity-quantum-ring';
            ring.style.left = `${targetX}px`;
            ring.style.top = `${targetY}px`;
            this.container.appendChild(ring);
            setTimeout(() => { if (ring.parentNode) ring.remove(); }, 240);

            // Stardust particle bursts: cyan, violet, white, starlight gold
            this.createParticleBurst(targetX, targetY, '#00f2fe', 16);
            this.createParticleBurst(targetX, targetY, '#a855f7', 14);
            this.createParticleBurst(targetX, targetY, '#ffffff', 12);
            this.createParticleBurst(targetX, targetY, '#fbbf24', 8);
        }, 230);

        // 4. CLEANUP & GRAVITY (at 390ms):
        setTimeout(() => {
            if (bhEl.parentNode) bhEl.remove();
            if (onComplete) onComplete();
        }, 390);
    }

    playSpaceOctopus(args) {
        return this.playBlackHole({
            centerCell: args.centerCell,
            targetPositions: args.targetPositions,
            onCollapse: args.onSnatch || args.onCollapse,
            onComplete: args.onComplete
        });
    }

    playSpaceChomper(args) {
        return this.playBlackHole({
            centerCell: args.centerCell,
            targetPositions: args.targetPositions,
            onCollapse: args.onChomp || args.onCollapse,
            onComplete: args.onComplete
        });
    }

    playAirstrikeBomb(args) {
        return this.playDroneStrike({
            centerCell: args.centerCell,
            targetPositions: args.targetPositions,
            onStrike: args.onImpact || args.onStrike,
            onComplete: args.onComplete
        });
    }

    _legacyAirstrikeBomb({ centerCell, targetPositions, onImpact, onComplete }) {
        if (!this.container || !centerCell) {
            if (onImpact) onImpact();
            if (onComplete) onComplete();
            return;
        }

        const pcRect = this.container.getBoundingClientRect();
        const centerRect = centerCell.getBoundingClientRect();

        const targetX = centerRect.left + centerRect.width / 2 - pcRect.left;
        const targetY = centerRect.top + centerRect.height / 2 - pcRect.top;
        const tileSize = Math.max(centerRect.width, centerRect.height) || 60;

        // 1. Tactical Radar Target Designator & Warning Reticles (0ms - 100ms)
        const targetMarkers = [];
        targetPositions.forEach(pos => {
            const cell = pos.cell;
            if (!cell) return;
            const cRect = cell.getBoundingClientRect();
            const cx = cRect.left + cRect.width / 2 - pcRect.left;
            const cy = cRect.top + cRect.height / 2 - pcRect.top;

            const isCenter = pos.r === parseInt(centerCell.dataset.row, 10) && pos.c === parseInt(centerCell.dataset.col, 10);
            const marker = document.createElement('div');
            marker.className = 'airstrike-target-marker' + (isCenter ? ' is-center' : '');
            marker.style.left = `${cx - tileSize / 2}px`;
            marker.style.top = `${cy - tileSize / 2}px`;
            marker.style.width = `${tileSize}px`;
            marker.style.height = `${tileSize}px`;
            this.container.appendChild(marker);
            targetMarkers.push(marker);

            if (pos.tileEl) {
                pos.tileEl.classList.add('tile-target-anticipate');
            }
        });

        // Center Tactical Laser Crosshair
        const crosshair = document.createElement('div');
        crosshair.className = 'airstrike-laser-crosshair';
        crosshair.style.left = `${targetX}px`;
        crosshair.style.top = `${targetY}px`;
        this.container.appendChild(crosshair);

        // 2. High-Speed Stealth Fighter Jet Flyby (80ms - 420ms)
        const jetY = Math.max(10, targetY - 145);
        const jet = document.createElement('div');
        jet.className = 'airstrike-jet';
        jet.style.top = `${jetY}px`;
        jet.innerHTML = `
            <div class="jet-contrail contrail-top"></div>
            <div class="jet-contrail contrail-bottom"></div>
            <svg class="airstrike-jet-svg" viewBox="0 0 160 100" width="160" height="100">
                <defs>
                    <linearGradient id="jet-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#475569"/>
                        <stop offset="35%" stop-color="#334155"/>
                        <stop offset="70%" stop-color="#1e293b"/>
                        <stop offset="100%" stop-color="#0f172a"/>
                    </linearGradient>
                    <linearGradient id="jet-wing-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#1e293b"/>
                        <stop offset="50%" stop-color="#334155"/>
                        <stop offset="100%" stop-color="#64748b"/>
                    </linearGradient>
                    <linearGradient id="jet-canopy-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#67e8f9"/>
                        <stop offset="50%" stop-color="#06b6d4"/>
                        <stop offset="100%" stop-color="#0e7490"/>
                    </linearGradient>
                    <linearGradient id="afterburner-grad" x1="0%" y1="50%" x2="100%" y2="50%">
                        <stop offset="0%" stop-color="#ff0055"/>
                        <stop offset="30%" stop-color="#ff7700"/>
                        <stop offset="70%" stop-color="#00f2fe"/>
                        <stop offset="100%" stop-color="#ffffff"/>
                    </linearGradient>
                    <filter id="thrust-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
                        <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <polygon points="8,44 -35,46 6,50" fill="url(#afterburner-grad)" filter="url(#thrust-glow)"/>
                <polygon points="8,50 -35,54 6,56" fill="url(#afterburner-grad)" filter="url(#thrust-glow)"/>
                <polygon points="50,42 95,45 35,12 25,14" fill="url(#jet-wing-grad)" stroke="#0f172a" stroke-width="1.2"/>
                <polygon points="25,14 35,12 30,8" fill="#475569"/>
                <polygon points="50,58 95,55 35,88 25,86" fill="url(#jet-wing-grad)" stroke="#0f172a" stroke-width="1.2"/>
                <polygon points="25,86 35,88 30,92" fill="#475569"/>
                <polygon points="18,42 38,44 14,26 6,28" fill="#334155" stroke="#0f172a" stroke-width="1"/>
                <polygon points="18,58 38,56 14,74 6,72" fill="#334155" stroke="#0f172a" stroke-width="1"/>
                <polygon points="152,50 110,41 45,43 14,46 14,54 45,57 110,59" fill="url(#jet-body-grad)" stroke="#0f172a" stroke-width="1.5"/>
                <polygon points="124,50 102,46 82,47 96,50 82,53 102,54" fill="url(#jet-canopy-grad)" filter="drop-shadow(0 0 3px rgba(6,182,212,0.8))"/>
                <line x1="108" y1="48" x2="98" y2="49" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="85" y1="44" x2="60" y2="44" stroke="#ff0844" stroke-width="1.5"/>
                <line x1="85" y1="56" x2="60" y2="56" stroke="#ff0844" stroke-width="1.5"/>
            </svg>
        `;
        this.container.appendChild(jet);

        // Sound: Jet Flyby Doppler Roar
        setTimeout(() => {
            if (typeof sounds !== 'undefined' && typeof sounds.playJetFlyby === 'function') {
                sounds.playJetFlyby();
            }
        }, 80);

        // 3. Bomb Release & Plunge (at 210ms when jet passes targetX)
        let bomb = null;
        setTimeout(() => {
            bomb = document.createElement('div');
            bomb.className = 'airstrike-bomb';
            bomb.style.left = `${targetX - 20}px`;
            bomb.style.top = `${jetY + 40}px`;
            bomb.style.setProperty('--target-drop-y', `${targetY - (jetY + 40)}px`);
            bomb.innerHTML = `
                <div class="bomb-smoke-trail"></div>
                <svg class="airstrike-bomb-svg" viewBox="0 0 40 75" width="40" height="75">
                    <defs>
                        <linearGradient id="bomb-skin-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#475569"/>
                            <stop offset="35%" stop-color="#1e293b"/>
                            <stop offset="70%" stop-color="#0f172a"/>
                            <stop offset="100%" stop-color="#334155"/>
                        </linearGradient>
                        <linearGradient id="bomb-fin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ffb703"/>
                            <stop offset="50%" stop-color="#d97706"/>
                            <stop offset="100%" stop-color="#b45309"/>
                        </linearGradient>
                    </defs>
                    <polygon points="12,18 0,4 6,2 17,14" fill="url(#bomb-fin-grad)" stroke="#78350f" stroke-width="0.8"/>
                    <polygon points="28,18 40,4 34,2 23,14" fill="url(#bomb-fin-grad)" stroke="#78350f" stroke-width="0.8"/>
                    <rect x="17" y="2" width="6" height="14" fill="#334155"/>
                    <path d="M 12 18 L 28 18 Q 34 35 28 55 Q 20 72 20 74 Q 20 72 12 55 Q 6 35 12 18 Z" fill="url(#bomb-skin-grad)" stroke="#0f172a" stroke-width="1.2"/>
                    <path d="M 10 32 L 30 32 L 29 38 L 11 38 Z" fill="#f59e0b"/>
                    <line x1="14" y1="32" x2="12" y2="38" stroke="#1e293b" stroke-width="2"/>
                    <line x1="20" y1="32" x2="18" y2="38" stroke="#1e293b" stroke-width="2"/>
                    <line x1="26" y1="32" x2="24" y2="38" stroke="#1e293b" stroke-width="2"/>
                    <circle cx="20" cy="71" r="3.2" fill="#ff0844" filter="drop-shadow(0 0 5px #ff0844)"/>
                    <circle cx="20" cy="71" r="1.3" fill="#ffffff"/>
                </svg>
            `;
            this.container.appendChild(bomb);

            if (typeof sounds !== 'undefined' && typeof sounds.playBombWhistle === 'function') {
                sounds.playBombWhistle();
            }
        }, 210);

        // 4. Cataclysmic Impact & 5-Tile Mega Detonation (at 480ms)
        setTimeout(() => {
            // Remove bomb, jet, and markers
            if (bomb && bomb.parentNode) bomb.remove();
            if (jet && jet.parentNode) jet.remove();
            if (crosshair.parentNode) crosshair.remove();
            targetMarkers.forEach(m => { if (m.parentNode) m.remove(); });

            // Trigger explosion audio & heavy haptic
            if (onImpact) onImpact();
            this.triggerHaptic('heavy');

            // Screen & Board Intense Violent Tremor
            if (this.appContainer) {
                this.appContainer.classList.remove('screen-shake-violent');
                void this.appContainer.offsetWidth;
                this.appContainer.classList.add('screen-shake-violent');
                setTimeout(() => {
                    if (this.appContainer) this.appContainer.classList.remove('screen-shake-violent');
                }, 400);
            }

            // Mega Fireball Detonation
            const fireball = document.createElement('div');
            fireball.className = 'bomb-fireball-epic';
            fireball.style.left = `${targetX}px`;
            fireball.style.top = `${targetY}px`;
            this.container.appendChild(fireball);
            setTimeout(() => { if (fireball.parentNode) fireball.remove(); }, 360);

            // Supersonic Expanding Shockwave Ring
            const shockwave = document.createElement('div');
            shockwave.className = 'bomb-shockwave-epic';
            shockwave.style.left = `${targetX}px`;
            shockwave.style.top = `${targetY}px`;
            this.container.appendChild(shockwave);
            setTimeout(() => { if (shockwave.parentNode) shockwave.remove(); }, 420);

            // Huge Sparks and Fire Particles Burst
            this.createParticleBurst(targetX, targetY, '#ff3b00', 36);
            this.createParticleBurst(targetX, targetY, '#ffb703', 28);
            this.createParticleBurst(targetX, targetY, '#ffffff', 18);

            // Destroy all targeted tiles & spawn their realistic 3D fragments
            targetPositions.forEach(pos => {
                const cell = pos.cell;
                if (!cell) return;
                const cRect = cell.getBoundingClientRect();
                const cx = cRect.left + cRect.width / 2 - pcRect.left;
                const cy = cRect.top + cRect.height / 2 - pcRect.top;

                let tileBg = '#475569';
                let tileBgImg = '';
                let tileColor = '#ffffff';
                let tileBorder = 'none';
                let tileShadow = '';
                let tileText = pos.val ? pos.val.toString() : '';

                if (pos.tileEl) {
                    const cs = window.getComputedStyle(pos.tileEl);
                    tileBg = cs.backgroundColor || '#475569';
                    tileBgImg = cs.backgroundImage || '';
                    tileColor = cs.color || '#ffffff';
                    tileBorder = cs.border || 'none';
                    tileShadow = cs.boxShadow || '';
                    const numSpan = pos.tileEl.querySelector('.tile-number');
                    tileText = numSpan ? numSpan.innerText : (pos.tileEl.innerText || '').trim();

                    // CRUCIAL: Remove immediately so no ghost cells remain!
                    pos.tileEl.remove();
                }

                // Spawn 3D debris shards for this tile
                this._spawnShatterDebris({
                    targetX: cx,
                    targetY: cy,
                    tileSize,
                    tileBg,
                    tileBgImg,
                    tileColor,
                    tileBorder,
                    tileShadow,
                    tileText,
                    isFrozen: pos.isFrozen
                });
            });

        }, 480);

        // 5. Cleanup & Callback to clear data & compact columns
        setTimeout(() => {
            if (onComplete) onComplete();
        }, 820);
    }

    _spawnShatterDebris({ targetX, targetY, tileSize, tileBg, tileBgImg, tileColor, tileBorder, tileShadow, tileText, isFrozen }) {
        const numShards = 14;
        const clipPolygons = [
            'polygon(0% 0%, 100% 20%, 80% 100%, 10% 90%)',
            'polygon(25% 0%, 100% 10%, 75% 100%, 0% 80%)',
            'polygon(10% 0%, 90% 0%, 100% 70%, 20% 100%)',
            'polygon(0% 15%, 85% 0%, 100% 85%, 15% 100%)',
            'polygon(40% 0%, 100% 35%, 60% 100%, 0% 70%)',
            'polygon(15% 0%, 100% 50%, 85% 100%, 0% 60%)',
            'polygon(0% 30%, 70% 0%, 100% 80%, 30% 100%)',
            'polygon(30% 0%, 100% 40%, 70% 100%, 0% 60%)',
            'polygon(0% 0%, 80% 15%, 100% 100%, 20% 90%)',
            'polygon(15% 20%, 90% 0%, 100% 80%, 0% 90%)',
            'polygon(50% 0%, 100% 60%, 50% 100%, 0% 40%)',
            'polygon(20% 0%, 85% 25%, 100% 85%, 5% 75%)'
        ];

        // 3D Shatter Debris Container
        const debrisContainer = document.createElement('div');
        debrisContainer.className = 'hammer-debris-container';
        debrisContainer.style.left = `${targetX}px`;
        debrisContainer.style.top = `${targetY}px`;
        this.container.appendChild(debrisContainer);

        for (let i = 0; i < numShards; i++) {
            const shard = document.createElement('div');
            shard.className = 'hammer-debris-shard';

            // Random angle and explosive outward/upward impulse
            const angle = (i / numShards) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const dist = (tileSize * 0.75) + Math.random() * (tileSize * 1.2);

            const vx = Math.cos(angle) * dist;
            const vyInitial = Math.sin(angle) * dist - (30 + Math.random() * 40); // upward blast
            const vyFinal = vyInitial + (110 + Math.random() * 120); // gravity drop

            const rotX = (Math.random() - 0.5) * 720;
            const rotY = (Math.random() - 0.5) * 720;
            const rotZ = (Math.random() - 0.5) * 540;

            const shardWidth = Math.max(14, tileSize * (0.28 + Math.random() * 0.22));
            const shardHeight = Math.max(14, tileSize * (0.28 + Math.random() * 0.22));

            shard.style.width = `${shardWidth}px`;
            shard.style.height = `${shardHeight}px`;
            shard.style.clipPath = clipPolygons[i % clipPolygons.length];
            shard.style.webkitClipPath = clipPolygons[i % clipPolygons.length];

            // Match tile background & textures
            if (tileBgImg && tileBgImg !== 'none') {
                shard.style.backgroundImage = tileBgImg;
                shard.style.backgroundSize = `${tileSize}px ${tileSize}px`;
                shard.style.backgroundPosition = `${(i % 3) * 33}% ${Math.floor(i / 3) * 33}%`;
            } else {
                shard.style.background = tileBg;
            }
            shard.style.boxShadow = tileShadow || 'inset 0 0 6px rgba(255,255,255,0.4)';
            shard.style.border = tileBorder !== 'none' ? tileBorder : '1px solid rgba(255,255,255,0.3)';

            shard.style.setProperty('--vx', `${vx}px`);
            shard.style.setProperty('--vy-peak', `${vyInitial}px`);
            shard.style.setProperty('--vy-final', `${vyFinal}px`);
            shard.style.setProperty('--rot-x', `${rotX}deg`);
            shard.style.setProperty('--rot-y', `${rotY}deg`);
            shard.style.setProperty('--rot-z', `${rotZ}deg`);
            shard.style.animationDelay = `${Math.random() * 40}ms`;

            // Number fragment on primary shards
            if (i === 0 || i === 1) {
                const numFrag = document.createElement('span');
                numFrag.className = 'shard-number-frag';
                numFrag.innerText = tileText;
                numFrag.style.color = tileColor;
                shard.appendChild(numFrag);
            }

            debrisContainer.appendChild(shard);
        }

        // Frozen ice crystals
        if (isFrozen) {
            for (let j = 0; j < 6; j++) {
                const iceShard = document.createElement('div');
                iceShard.className = 'hammer-debris-shard ice-crystal-shard';
                const angle = (j / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
                const dist = tileSize * (0.8 + Math.random() * 0.9);
                const vx = Math.cos(angle) * dist;
                const vyInitial = Math.sin(angle) * dist - 50;
                const vyFinal = vyInitial + 140;

                iceShard.style.width = `${tileSize * 0.28}px`;
                iceShard.style.height = `${tileSize * 0.28}px`;
                iceShard.style.clipPath = clipPolygons[(j + 4) % clipPolygons.length];
                iceShard.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(0,242,254,0.7))';
                iceShard.style.boxShadow = '0 0 10px #00f2fe, inset 0 0 4px #ffffff';
                iceShard.style.border = '1px solid #ffffff';

                iceShard.style.setProperty('--vx', `${vx}px`);
                iceShard.style.setProperty('--vy-peak', `${vyInitial}px`);
                iceShard.style.setProperty('--vy-final', `${vyFinal}px`);
                iceShard.style.setProperty('--rot-x', `${(Math.random() - 0.5) * 900}deg`);
                iceShard.style.setProperty('--rot-y', `${(Math.random() - 0.5) * 900}deg`);
                iceShard.style.setProperty('--rot-z', `${(Math.random() - 0.5) * 900}deg`);

                debrisContainer.appendChild(iceShard);
            }
        }

        // Billowing dust puffs
        for (let k = 0; k < 5; k++) {
            const puff = document.createElement('div');
            puff.className = 'hammer-dust-puff';
            const pAngle = (k / 5) * Math.PI * 2 + Math.random() * 0.4;
            const pDist = 20 + Math.random() * 25;
            puff.style.setProperty('--pdx', `${Math.cos(pAngle) * pDist}px`);
            puff.style.setProperty('--pdy', `${Math.sin(pAngle) * pDist}px`);
            debrisContainer.appendChild(puff);
        }

        // Clean up debris container after animations end
        setTimeout(() => {
            if (debrisContainer.parentNode) debrisContainer.remove();
        }, 650);
    }

    // ── ⇄ 3D COSMIC ORBITAL TILE SWAP ANIMATION ────────────────────────────
    playShooterSwapAnimation({ onSwap, onComplete }) {
        const currentEl = document.getElementById('shooter-current');
        const nextEl = document.getElementById('shooter-next');

        if (!currentEl || !nextEl) {
            if (onSwap) onSwap();
            if (onComplete) onComplete();
            return;
        }

        // Sound & haptic
        if (typeof sounds !== 'undefined' && typeof sounds.playSwap === 'function') {
            sounds.playSwap();
        } else if (typeof sounds !== 'undefined') {
            sounds.playMerge(2);
        }
        this.triggerHaptic('light');

        const rectCurr = currentEl.getBoundingClientRect();
        const rectNext = nextEl.getBoundingClientRect();
        const dx = (rectNext.left + rectNext.width / 2) - (rectCurr.left + rectCurr.width / 2);
        const dy = (rectNext.top + rectNext.height / 2) - (rectCurr.top + rectCurr.height / 2);

        // Apply orbital CSS dynamic variables and classes
        currentEl.style.setProperty('--swap-dx', `${dx}px`);
        currentEl.style.setProperty('--swap-dy', `${dy}px`);
        nextEl.style.setProperty('--swap-dx', `${-dx}px`);
        nextEl.style.setProperty('--swap-dy', `${-dy}px`);

        currentEl.classList.add('shooter-swap-orbit-out');
        nextEl.classList.add('shooter-swap-orbit-in');

        // Sparkle burst where the two tiles cross paths
        if (this.container) {
            const cRect = this.container.getBoundingClientRect();
            const midX = (rectCurr.left + rectNext.left + rectCurr.width) / 2 - cRect.left;
            const midY = (rectCurr.top + rectNext.top + rectCurr.height) / 2 - cRect.top;
            setTimeout(() => {
                this.createParticleBurst(midX, midY, '#f97316', 14);
                this.createParticleBurst(midX, midY, '#00f2fe', 10);
            }, 120);
        }

        // Midpoint swap at 140ms
        setTimeout(() => {
            if (onSwap) onSwap();
        }, 140);

        // Animation cleanup at 290ms
        setTimeout(() => {
            currentEl.classList.remove('shooter-swap-orbit-out');
            nextEl.classList.remove('shooter-swap-orbit-in');
            currentEl.style.removeProperty('--swap-dx');
            currentEl.style.removeProperty('--swap-dy');
            nextEl.style.removeProperty('--swap-dx');
            nextEl.style.removeProperty('--swap-dy');
            if (onComplete) onComplete();
        }, 290);
    }

    // ── ↩️ TIME REWIND CHRONO WARP ANIMATION ────────────────────────────────
    playTimeRewindAnimation({ onRestore, onComplete }) {
        const board = document.getElementById('grid-board');
        if (!board || !this.container) {
            if (onRestore) onRestore();
            if (onComplete) onComplete();
            return;
        }

        // Sound & haptic
        if (typeof sounds !== 'undefined' && typeof sounds.playUndo === 'function') {
            sounds.playUndo();
        } else if (typeof sounds !== 'undefined') {
            sounds.playMerge(2);
        }
        this.triggerHaptic('medium');

        const bRect = board.getBoundingClientRect();
        const cRect = this.container.getBoundingClientRect();
        const centerX = bRect.left + bRect.width / 2 - cRect.left;
        const centerY = bRect.top + bRect.height / 2 - cRect.top;

        // 1. Holographic Chrono Clock Overlay
        const chronoOverlay = document.createElement('div');
        chronoOverlay.className = 'chrono-warp-overlay';
        chronoOverlay.style.left = `${bRect.left - cRect.left}px`;
        chronoOverlay.style.top = `${bRect.top - cRect.top}px`;
        chronoOverlay.style.width = `${bRect.width}px`;
        chronoOverlay.style.height = `${bRect.height}px`;

        chronoOverlay.innerHTML = `
            <div class="chrono-ripple-wave"></div>
            <svg class="chrono-clock-svg" viewBox="0 0 200 200" width="200" height="200">
                <defs>
                    <linearGradient id="chrono-gold-g" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#fef08a"/>
                        <stop offset="50%" stop-color="#eab308"/>
                        <stop offset="100%" stop-color="#ca8a04"/>
                    </linearGradient>
                    <radialGradient id="chrono-glow-rg" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="rgba(168,85,247,0.4)"/>
                        <stop offset="60%" stop-color="rgba(234,179,8,0.2)"/>
                        <stop offset="100%" stop-color="transparent"/>
                    </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="90" fill="url(#chrono-glow-rg)"/>
                <circle cx="100" cy="100" r="82" fill="none" stroke="url(#chrono-gold-g)" stroke-width="2.5" stroke-dasharray="8 4" class="chrono-outer-ring"/>
                <circle cx="100" cy="100" r="68" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.2"/>
                <text x="100" y="32" text-anchor="middle" fill="#fef08a" font-size="13" font-weight="900" font-family="sans-serif">XII</text>
                <text x="172" y="105" text-anchor="middle" fill="#fef08a" font-size="13" font-weight="900" font-family="sans-serif">III</text>
                <text x="100" y="178" text-anchor="middle" fill="#fef08a" font-size="13" font-weight="900" font-family="sans-serif">VI</text>
                <text x="28" y="105" text-anchor="middle" fill="#fef08a" font-size="13" font-weight="900" font-family="sans-serif">IX</text>
                <g class="chrono-hands-rev">
                    <line x1="100" y1="100" x2="100" y2="44" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
                    <line x1="100" y1="100" x2="62" y2="100" stroke="#fef08a" stroke-width="4.5" stroke-linecap="round"/>
                    <circle cx="100" cy="100" r="5" fill="#ca8a04"/>
                    <circle cx="100" cy="100" r="2.5" fill="#ffffff"/>
                </g>
            </svg>
        `;
        this.container.appendChild(chronoOverlay);

        // Golden & violet reverse time sparkles
        this.createParticleBurst(centerX, centerY, '#eab308', 20);
        this.createParticleBurst(centerX, centerY, '#c084fc', 16);

        // Flash and board distortion
        board.classList.add('board-chrono-rewind');

        // Midpoint restore at 180ms
        setTimeout(() => {
            if (onRestore) onRestore();
        }, 180);

        // Cleanup at 440ms
        setTimeout(() => {
            if (chronoOverlay.parentNode) chronoOverlay.remove();
            board.classList.remove('board-chrono-rewind');
            if (onComplete) onComplete();
        }, 440);
    }
}

// ── Optimized Burst Particle ──────────────────────────────────────────────
class BurstParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 3.5 + 2;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5.0 + 1.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = Math.random() * 0.035 + 0.028;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.16; // gentle gravity
        this.vx *= 0.95;
        this.alpha -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

const effects = new EffectsManager();
