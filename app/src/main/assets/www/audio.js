// Gridoria WebAudio Engine v5 — Pro Sound System with Audio Limiter & Lifecycle Management
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.compressor = null;
        this.enabled = true;
        this._initialized = false;

        this._setupLifecycleHandlers();
    }

    _setupLifecycleHandlers() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.ctx && this.ctx.state === 'running') {
                    this.ctx.suspend().catch(() => {});
                }
            } else {
                if (this.ctx && this.ctx.state === 'suspended' && this.enabled) {
                    this.ctx.resume().catch(() => {});
                }
            }
        });

        // Initialize / resume audio on first user gesture
        const unlockAudio = () => {
            this.init();
            window.removeEventListener('touchstart', unlockAudio);
            window.removeEventListener('touchend', unlockAudio);
            window.removeEventListener('click', unlockAudio);
        };
        window.addEventListener('touchstart', unlockAudio, { passive: true });
        window.addEventListener('touchend', unlockAudio, { passive: true });
        window.addEventListener('click', unlockAudio, { passive: true });
    }

    init() {
        if (!this.ctx) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();

                    // Dynamics compressor to prevent audio clipping / distortion during combos
                    this.compressor = this.ctx.createDynamicsCompressor();
                    this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
                    this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
                    this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
                    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
                    this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

                    // Master gain
                    this.masterGain = this.ctx.createGain();
                    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

                    this.compressor.connect(this.masterGain);
                    this.masterGain.connect(this.ctx.destination);
                    this._initialized = true;
                    this._initWaterDropBuffer();
                }
            } catch (e) {
                console.warn('AudioContext initialization error:', e);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    _initWaterDropBuffer() {
        if (!this.ctx || this._waterDropBuffer) return;
        try {
            const sampleRate = this.ctx.sampleRate || 44100;
            const duration = 0.15;
            const numSamples = Math.floor(sampleRate * duration);
            const buffer = this.ctx.createBuffer(1, numSamples, sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < numSamples; i++) {
                const t = i / sampleRate;

                // Ultra Warm & Deep Water Pinch Physics (240 Hz ➔ 480 Hz - Extremely Low Treble)
                const f0 = 240;
                const k = 16;
                const phase = 2 * Math.PI * (f0 / k) * (Math.exp(k * t) - 1);
                const env1 = Math.exp(-t * 24);
                const drop1 = Math.sin(phase) * env1;

                // Warm Soft Secondary Splash Rebound (340 Hz)
                let drop2 = 0;
                if (t > 0.02) {
                    const t2 = t - 0.02;
                    const f02 = 340;
                    const k2 = 14;
                    const phase2 = 2 * Math.PI * (f02 / k2) * (Math.exp(k2 * t2) - 1);
                    const env2 = Math.exp(-t2 * 28);
                    drop2 = 0.32 * Math.sin(phase2) * env2;
                }

                data[i] = (drop1 + drop2) * 0.52;
            }
            this._waterDropBuffer = buffer;
        } catch (e) {
            console.warn('Water AudioBuffer generation error:', e);
        }
    }

    getDestination() {
        if (!this._initialized || !this.compressor) {
            return this.ctx ? this.ctx.destination : null;
        }
        return this.compressor;
    }

    toggleSound() {
        this.enabled = !this.enabled;
        if (!this.enabled && this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend().catch(() => {});
        } else if (this.enabled) {
            this.init();
        }
        return this.enabled;
    }

    // ── Core Synthesizer ──────────────────────────────────────────────
    _play(type, comboLevel = 1) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const dest = this.getDestination();
        if (!dest) return;

        try {
            // 💧 ÇOK YUMUŞAK VE TOK SU TAŞ FIRLATMA SESİ (Ultra Soft Low-Treble Water Touch)
            if (type === 'shoot') {
                if (!this._waterDropBuffer) this._initWaterDropBuffer();
                if (this._waterDropBuffer) {
                    const source = this.ctx.createBufferSource();
                    const gainNode = this.ctx.createGain();
                    const filterNode = this.ctx.createBiquadFilter();

                    source.buffer = this._waterDropBuffer;
                    filterNode.type = 'lowpass';
                    filterNode.frequency.setValueAtTime(460, now);

                    source.playbackRate.setValueAtTime(0.72, now);
                    gainNode.gain.setValueAtTime(0.24, now);

                    source.connect(filterNode);
                    filterNode.connect(gainNode);
                    gainNode.connect(dest);

                    source.start(now);
                }
            }

            // 💧 EXTRA DERİN VE SILKY TOK SU DAMLASI BİRLEŞME SESİ (Ultra Deep & Warm Soft Water Droplet)
            else if (type === 'merge') {
                if (!this._waterDropBuffer) this._initWaterDropBuffer();
                if (this._waterDropBuffer) {
                    const source = this.ctx.createBufferSource();
                    const gainNode = this.ctx.createGain();
                    const filterNode = this.ctx.createBiquadFilter();

                    source.buffer = this._waterDropBuffer;

                    // Deep lowpass filter (580 Hz Cutoff) wipes out all high treble
                    filterNode.type = 'lowpass';
                    filterNode.frequency.setValueAtTime(580, now);

                    const comboShift = Math.min(10, comboLevel - 1);
                    const pitchRatio = Math.pow(1.02, comboShift);
                    source.playbackRate.setValueAtTime(pitchRatio, now);

                    gainNode.gain.setValueAtTime(0.58, now);

                    source.connect(filterNode);
                    filterNode.connect(gainNode);
                    gainNode.connect(dest);

                    source.start(now);
                }
            }

            // ── FEVER / COMBO FIRE — triangle wave rising whoosh ─────────────
            else if (type === 'fever') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(780, now + 0.38);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
                osc.connect(gain);
                gain.connect(dest);
                osc.start(now);
                osc.stop(now + 0.39);
            }

            // ── FEVER END — falling triangle (fever mode over) ────────────────
            else if (type === 'feverEnd') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(140, now + 0.32);
                gain.gain.setValueAtTime(0.22, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
                osc.connect(gain);
                gain.connect(dest);
                osc.start(now);
                osc.stop(now + 0.33);
            }

            // ── REWARD / LEVEL UP — ascending sine arpeggio ───────────────────
            else if (type === 'reward' || type === 'levelUp') {
                const freqs = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 arpeggio
                freqs.forEach((f, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const noteStart = now + idx * 0.07;
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(f, noteStart);
                    gain.gain.setValueAtTime(0.24, noteStart);
                    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.22);
                    osc.connect(gain);
                    gain.connect(dest);
                    osc.start(noteStart);
                    osc.stop(noteStart + 0.23);
                });
            }

            // ── BOMB — Real Studio Cinematic Bomb Explosion (WaveShaper + Brownian Noise) ──
            else if (type === 'bomb') {
                const dur = 0.85;

                // Create a non-linear WaveShaper distortion node for crunchy realistic bomb detonation
                const distortion = this.ctx.createWaveShaper();
                const curve = new Float32Array(4096);
                const deg = Math.PI / 180;
                const k = 25; // Overdrive distortion level
                for (let i = 0; i < 4096; i++) {
                    const x = (i * 2) / 4096 - 1;
                    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
                }
                distortion.curve = curve;
                distortion.oversample = '4x';

                // 1. Initial Shockwave Compression Drop (The "KA-BOOM" impact)
                const impactOsc = this.ctx.createOscillator();
                const impactGain = this.ctx.createGain();
                impactOsc.type = 'sawtooth';
                impactOsc.frequency.setValueAtTime(320, now);
                impactOsc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
                impactGain.gain.setValueAtTime(0.9, now);
                impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
                impactOsc.connect(distortion);
                distortion.connect(impactGain);
                impactGain.connect(dest);
                impactOsc.start(now);
                impactOsc.stop(now + 0.15);

                // 2. Dual Sub-Bass Earth Rumble (65 Hz & 44 Hz beating)
                const sub1 = this.ctx.createOscillator();
                const sub2 = this.ctx.createOscillator();
                const subGain = this.ctx.createGain();
                sub1.type = 'sine';
                sub2.type = 'sine';
                sub1.frequency.setValueAtTime(65, now);
                sub1.frequency.exponentialRampToValueAtTime(22, now + dur);
                sub2.frequency.setValueAtTime(44, now);
                sub2.frequency.exponentialRampToValueAtTime(18, now + dur);
                subGain.gain.setValueAtTime(1.0, now);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                sub1.connect(subGain);
                sub2.connect(subGain);
                subGain.connect(dest);
                sub1.start(now);
                sub2.start(now);
                sub1.stop(now + dur + 0.02);
                sub2.stop(now + dur + 0.02);

                // 3. Crackling Debris & Fireball Brownian Noise Buffer
                const bufferSize = Math.floor(this.ctx.sampleRate * dur);
                const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = noiseBuffer.getChannelData(0);
                let lastOut = 0.0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    // Brownian noise synthesis for deep thunder/fire rumble
                    data[i] = (lastOut + 0.02 * white) / 1.02;
                    lastOut = data[i];
                    data[i] *= 3.5;
                    if (Math.random() < 0.03 && i < bufferSize * 0.4) {
                        data[i] += (Math.random() - 0.5) * 1.5;
                    }
                }
                const noiseSource = this.ctx.createBufferSource();
                noiseSource.buffer = noiseBuffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(550, now);
                filter.frequency.exponentialRampToValueAtTime(45, now + dur);

                const noiseGain = this.ctx.createGain();
                noiseGain.gain.setValueAtTime(0.85, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                noiseSource.connect(filter);
                filter.connect(noiseGain);
                noiseGain.connect(dest);
                noiseSource.start(now);
                noiseSource.stop(now + dur + 0.02);
            }

            // ── HAMMER — Heavy Sledgehammer Metal & Stone Shatter ─────────────
            else if (type === 'hammer') {
                const dur = 0.28;

                // 1. Hard Metal Clang & Stone Crack Transient
                const metalOsc = this.ctx.createOscillator();
                const metalGain = this.ctx.createGain();
                metalOsc.type = 'triangle';
                metalOsc.frequency.setValueAtTime(850, now);
                metalOsc.frequency.exponentialRampToValueAtTime(180, now + 0.05);
                metalGain.gain.setValueAtTime(0.75, now);
                metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                metalOsc.connect(metalGain);
                metalGain.connect(dest);
                metalOsc.start(now);
                metalOsc.stop(now + 0.07);

                // 2. Heavy Mallet Impact Thud
                const thudOsc = this.ctx.createOscillator();
                const thudGain = this.ctx.createGain();
                thudOsc.type = 'sine';
                thudOsc.frequency.setValueAtTime(190, now);
                thudOsc.frequency.exponentialRampToValueAtTime(35, now + 0.22);
                thudGain.gain.setValueAtTime(0.85, now);
                thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                thudOsc.connect(thudGain);
                thudGain.connect(dest);
                thudOsc.start(now);
                thudOsc.stop(now + 0.23);

                // 3. Crisp Stone Crumble & Shatter Noise
                const bufferSize = Math.floor(this.ctx.sampleRate * dur);
                const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = noiseBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.06));
                }
                const noiseSource = this.ctx.createBufferSource();
                noiseSource.buffer = noiseBuffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1800, now);
                filter.frequency.exponentialRampToValueAtTime(400, now + dur);
                filter.Q.value = 1.8;

                const noiseGain = this.ctx.createGain();
                noiseGain.gain.setValueAtTime(0.65, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                noiseSource.connect(filter);
                filter.connect(noiseGain);
                noiseGain.connect(dest);
                noiseSource.start(now);
                noiseSource.stop(now + dur + 0.01);
            }

            // ── GAME OVER — gentle descending minor notes ─────────────────────
            else if (type === 'gameOver') {
                const notes = [440, 370, 300, 220];
                notes.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const t = now + i * 0.16;
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, t);
                    osc.frequency.exponentialRampToValueAtTime(freq * 0.55, t + 0.32);
                    gain.gain.setValueAtTime(0.24, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                    osc.connect(gain);
                    gain.connect(dest);
                    osc.start(t);
                    osc.stop(t + 0.36);
                });
            }
        } catch (e) {
            console.warn('Sound play error:', e);
        }
    }

    // ── Public API ──────────────────────────────────────────────────
    playShoot()              { this._play('shoot'); }
    playMerge(comboLvl = 1) { this._play('merge', comboLvl); }
    playComboFire()          { this._play('fever'); }
    playComboEnd()           { this._play('feverEnd'); }
    playReward()             { this._play('reward'); }
    playLevelUp()            { this._play('levelUp'); }
    playBomb()               { this._play('bomb'); }
    playHammer()             { this._play('hammer'); }
    playGameOver()           { this._play('gameOver'); }
}

const sounds = new SoundEngine();
