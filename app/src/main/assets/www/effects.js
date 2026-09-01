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
    triggerHaptic(type = 'impact') {
        if (typeof NativeBridge !== 'undefined' && typeof NativeBridge.triggerHaptic === 'function') {
            NativeBridge.triggerHaptic(type);
        } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                if (type === 'heavy') navigator.vibrate(26);
                else if (type === 'medium') navigator.vibrate(16);
                else navigator.vibrate(8);
            } catch (e) {}
        }
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
