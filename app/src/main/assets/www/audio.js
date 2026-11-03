// Gridoria WebAudio Engine v5 — Pro Sound System with Audio Limiter & Lifecycle Management
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.compressor = null;

        let saved = true;
        try {
            const fixedV2 = localStorage.getItem('gridoria_sound_fix_v2');
            if (!fixedV2) {
                saved = true;
                localStorage.setItem('gridoria_sound_enabled', 'true');
                localStorage.setItem('gridoria_sound_fix_v2', 'true');
            } else {
                const ls = localStorage.getItem('gridoria_sound_enabled');
                if (ls !== null) saved = ls === 'true';
            }
        } catch (e) {}
        this.enabled = saved;
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

        // Initialize / resume audio on first user gesture with capture: true
        const unlockAudio = () => {
            this.init();
            if (this.ctx) {
                if (this.ctx.state === 'suspended') {
                    this.ctx.resume().catch(() => {});
                }
                try {
                    const buf = this.ctx.createBuffer(1, 1, 22050);
                    const src = this.ctx.createBufferSource();
                    src.buffer = buf;
                    src.connect(this.ctx.destination);
                    src.start(0);
                } catch (e) {}
            }
            window.removeEventListener('touchstart', unlockAudio, true);
            window.removeEventListener('touchend', unlockAudio, true);
            window.removeEventListener('click', unlockAudio, true);
            window.removeEventListener('pointerdown', unlockAudio, true);
        };
        window.addEventListener('touchstart', unlockAudio, { passive: true, capture: true });
        window.addEventListener('touchend', unlockAudio, { passive: true, capture: true });
        window.addEventListener('click', unlockAudio, { passive: true, capture: true });
        window.addEventListener('pointerdown', unlockAudio, { passive: true, capture: true });
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
        try {
            localStorage.setItem('gridoria_sound_enabled', String(this.enabled));
        } catch (e) {}
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
            // 💧 ÇOK YUMUŞAK VE TOK SU TAŞ FIRLATMA SESİ
            if (type === 'shoot') {
                if (!this._waterDropBuffer) this._initWaterDropBuffer();
                if (this._waterDropBuffer) {
                    const source = this.ctx.createBufferSource();
                    const gainNode = this.ctx.createGain();
                    const filterNode = this.ctx.createBiquadFilter();

                    source.buffer = this._waterDropBuffer;
                    filterNode.type = 'lowpass';
                    filterNode.frequency.setValueAtTime(750, now);

                    source.playbackRate.setValueAtTime(1.05, now);
                    gainNode.gain.setValueAtTime(0.65, now);

                    source.connect(filterNode);
                    filterNode.connect(gainNode);
                    gainNode.connect(dest);

                    source.start(now);
                } else {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(380, now);
                    osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);
                    gain.gain.setValueAtTime(0.40, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
                    osc.connect(gain);
                    gain.connect(dest);
                    osc.start(now);
                    osc.stop(now + 0.11);
                }
            }

            // 💧 EXTRA DERİN VE TOK SU DAMLASI BİRLEŞME SESİ
            else if (type === 'merge') {
                if (!this._waterDropBuffer) this._initWaterDropBuffer();
                if (this._waterDropBuffer) {
                    const source = this.ctx.createBufferSource();
                    const gainNode = this.ctx.createGain();
                    const filterNode = this.ctx.createBiquadFilter();

                    source.buffer = this._waterDropBuffer;
                    filterNode.type = 'lowpass';
                    filterNode.frequency.setValueAtTime(900, now);

                    const comboShift = Math.min(10, comboLevel - 1);
                    const pitchRatio = Math.pow(1.05, comboShift) * 1.15;
                    source.playbackRate.setValueAtTime(pitchRatio, now);

                    gainNode.gain.setValueAtTime(0.80, now);

                    source.connect(filterNode);
                    filterNode.connect(gainNode);
                    gainNode.connect(dest);

                    source.start(now);
                } else {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    const baseFreq = 440 * Math.pow(1.06, Math.min(8, comboLevel - 1));
                    osc.frequency.setValueAtTime(baseFreq, now);
                    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);
                    gain.gain.setValueAtTime(0.45, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
                    osc.connect(gain);
                    gain.connect(dest);
                    osc.start(now);
                    osc.stop(now + 0.15);
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

            // ── BOMB — Cinematic Deep Bass Thunder Detonation (Clean, Punchy, No Harsh Distortion) ──
            else if (type === 'bomb') {
                const dur = 0.82;

                // 1. Heavy Punch Transient Thump (Pitch-dropped triangle 220 Hz -> 36 Hz)
                const punchOsc = this.ctx.createOscillator();
                const punchGain = this.ctx.createGain();
                punchOsc.type = 'triangle';
                punchOsc.frequency.setValueAtTime(220, now);
                punchOsc.frequency.exponentialRampToValueAtTime(36, now + 0.14);

                punchGain.gain.setValueAtTime(0.85, now);
                punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

                punchOsc.connect(punchGain);
                punchGain.connect(dest);
                punchOsc.start(now);
                punchOsc.stop(now + 0.17);

                // 2. Dual Sub-Bass Earthquake Rumble (58 Hz & 41 Hz harmonic resonance)
                const sub1 = this.ctx.createOscillator();
                const sub2 = this.ctx.createOscillator();
                const subGain = this.ctx.createGain();
                sub1.type = 'sine';
                sub2.type = 'sine';
                sub1.frequency.setValueAtTime(58, now);
                sub1.frequency.exponentialRampToValueAtTime(20, now + dur);
                sub2.frequency.setValueAtTime(41, now);
                sub2.frequency.exponentialRampToValueAtTime(16, now + dur);

                subGain.gain.setValueAtTime(0.9, now);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                sub1.connect(subGain);
                sub2.connect(subGain);
                subGain.connect(dest);
                sub1.start(now);
                sub2.start(now);
                sub1.stop(now + dur + 0.02);
                sub2.stop(now + dur + 0.02);

                // 3. Cinematic Rolling Thunder Fireball (Brownian Noise Buffer, strictly lowpassed)
                const bufferSize = Math.floor(this.ctx.sampleRate * dur);
                const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = noiseBuffer.getChannelData(0);
                let lastOut = 0.0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    data[i] = (lastOut + 0.03 * white) / 1.03;
                    lastOut = data[i];
                    data[i] *= 3.6;
                }
                const noiseSource = this.ctx.createBufferSource();
                noiseSource.buffer = noiseBuffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(460, now);
                filter.frequency.exponentialRampToValueAtTime(38, now + dur);

                const noiseGain = this.ctx.createGain();
                noiseGain.gain.setValueAtTime(0.75, now);
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

            // ── HAMMER WHOOSH — Swift Aerodynamic Wind Arc ───────────────────
            else if (type === 'hammerWhoosh') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(70, now + 0.16);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(700, now);
                filter.frequency.exponentialRampToValueAtTime(150, now + 0.16);

                gain.gain.setValueAtTime(0.38, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(dest);

                osc.start(now);
                osc.stop(now + 0.17);
            }

            // ── JET FLYBY — Ultra-Deep & Silky Cinematic Aero Pass (Zero Treble Static) ──
            // ── JET FLYBY — High-End Cinematic Fighter Jet Pass (Turbine Doppler + Smooth Aero Swoosh) ──
            else if (type === 'jetFlyby') {
                const dur = 0.65;
                const peakTime = now + 0.22;

                // 1. Dual Jet Turbine Doppler Whine (Smooth Sine Chorus: 520 Hz -> 190 Hz)
                const turb1 = this.ctx.createOscillator();
                const turb2 = this.ctx.createOscillator();
                const turbGain = this.ctx.createGain();
                const turbFilter = this.ctx.createBiquadFilter();

                turb1.type = 'sine';
                turb2.type = 'sine';
                turb1.frequency.setValueAtTime(520, now);
                turb1.frequency.exponentialRampToValueAtTime(190, now + dur);
                turb2.frequency.setValueAtTime(524, now); // +4 Hz detune for silky metallic chorus
                turb2.frequency.exponentialRampToValueAtTime(192, now + dur);

                turbFilter.type = 'lowpass';
                turbFilter.frequency.setValueAtTime(850, now);
                turbFilter.frequency.exponentialRampToValueAtTime(280, now + dur);

                turbGain.gain.setValueAtTime(0.01, now);
                turbGain.gain.linearRampToValueAtTime(0.28, peakTime);
                turbGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                turb1.connect(turbFilter);
                turb2.connect(turbFilter);
                turbFilter.connect(turbGain);
                turbGain.connect(dest);

                turb1.start(now);
                turb2.start(now);
                turb1.stop(now + dur + 0.02);
                turb2.stop(now + dur + 0.02);

                // 2. Heavy Aerodynamic Air Displacement Whoosh (Deep Brownian Noise)
                const bufferSize = Math.floor(this.ctx.sampleRate * dur);
                const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = noiseBuffer.getChannelData(0);
                let lastOut = 0.0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    data[i] = (lastOut + 0.035 * white) / 1.035;
                    lastOut = data[i];
                    data[i] *= 3.4;
                }
                const noiseSource = this.ctx.createBufferSource();
                noiseSource.buffer = noiseBuffer;

                const aeroFilter = this.ctx.createBiquadFilter();
                aeroFilter.type = 'lowpass';
                aeroFilter.frequency.setValueAtTime(520, now);
                aeroFilter.frequency.exponentialRampToValueAtTime(150, now + dur);

                const aeroGain = this.ctx.createGain();
                aeroGain.gain.setValueAtTime(0.01, now);
                aeroGain.gain.linearRampToValueAtTime(0.40, peakTime);
                aeroGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                noiseSource.connect(aeroFilter);
                aeroFilter.connect(aeroGain);
                aeroGain.connect(dest);

                noiseSource.start(now);
                noiseSource.stop(now + dur + 0.02);

                // 3. Sub-Bass Jet Exhaust Rumble (85 Hz -> 38 Hz)
                const sub = this.ctx.createOscillator();
                const subGain = this.ctx.createGain();
                sub.type = 'sine';
                sub.frequency.setValueAtTime(85, now);
                sub.frequency.exponentialRampToValueAtTime(38, now + dur);

                subGain.gain.setValueAtTime(0.01, now);
                subGain.gain.linearRampToValueAtTime(0.36, peakTime);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                sub.connect(subGain);
                subGain.connect(dest);

                sub.start(now);
                sub.stop(now + dur + 0.02);
            }

            // ── BOMB DROP — Smooth Aerodynamic Diving Flutter (Zero Screeching) ──
            else if (type === 'bombWhistle') {
                const dur = 0.27;

                // Warm falling aerodynamic glide (Triangle 380 Hz -> 85 Hz)
                const osc = this.ctx.createOscillator();
                const filter = this.ctx.createBiquadFilter();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(380, now);
                osc.frequency.exponentialRampToValueAtTime(85, now + dur);

                // Gentle lowpass to keep the drop warm and silky
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(480, now);
                filter.frequency.exponentialRampToValueAtTime(140, now + dur);

                gain.gain.setValueAtTime(0.02, now);
                gain.gain.linearRampToValueAtTime(0.30, now + dur * 0.55);
                gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(dest);

                osc.start(now);
                osc.stop(now + dur + 0.01);
            }

            // ── UFO BEAM — Hypnotic Anti-Gravity Resonance Drone (Warm & Velvety) ──
            else if (type === 'ufoBeam') {
                const dur = 0.42;

                // Dual warm sines in a pure fifth (196 Hz G3 & 293.6 Hz D4)
                const osc1 = this.ctx.createOscillator();
                const osc2 = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc1.type = 'sine';
                osc2.type = 'sine';
                osc1.frequency.setValueAtTime(196, now);
                osc2.frequency.setValueAtTime(293.66, now);

                // Subtle LFO amplitude modulation for hypnotic anti-gravity pulsing
                const lfo = this.ctx.createOscillator();
                const lfoGain = this.ctx.createGain();
                lfo.frequency.setValueAtTime(5.5, now); // 5.5 Hz gentle pulse
                lfoGain.gain.setValueAtTime(0.06, now);
                lfo.connect(lfoGain);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(340, now);

                gain.gain.setValueAtTime(0.01, now);
                gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                lfoGain.connect(gain.gain);

                osc1.connect(filter);
                osc2.connect(filter);
                filter.connect(gain);
                gain.connect(dest);

                osc1.start(now);
                osc2.start(now);
                lfo.start(now);
                osc1.stop(now + dur + 0.02);
                osc2.stop(now + dur + 0.02);
                lfo.stop(now + dur + 0.02);
            }

            // ── UFO ABDUCT — Juicy Cosmic Bubble Suction Pop & Starlight Chimes ────────
            else if (type === 'ufoAbduct') {
                // 1. Juicy Suction Bubble Pop (160 Hz -> 420 Hz in 80ms)
                const popOsc = this.ctx.createOscillator();
                const popGain = this.ctx.createGain();
                popOsc.type = 'sine';
                popOsc.frequency.setValueAtTime(160, now);
                popOsc.frequency.exponentialRampToValueAtTime(420, now + 0.08);
                popGain.gain.setValueAtTime(0.38, now);
                popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
                popOsc.connect(popGain);
                popGain.connect(dest);
                popOsc.start(now);
                popOsc.stop(now + 0.12);

                // 2. Sparkling Crystal Star Chimes (E6 1318 Hz & B6 1975 Hz)
                [1318.5, 1975.5].forEach((freq, idx) => {
                    const chimeOsc = this.ctx.createOscillator();
                    const chimeGain = this.ctx.createGain();
                    const t = now + 0.04 + idx * 0.04;
                    chimeOsc.type = 'sine';
                    chimeOsc.frequency.setValueAtTime(freq, t);
                    chimeGain.gain.setValueAtTime(0.18, t);
                    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                    chimeOsc.connect(chimeGain);
                    chimeGain.connect(dest);
                    chimeOsc.start(t);
                    chimeOsc.stop(t + 0.23);
                });
            }

            // ── UFO WARP (ARRIVAL) — Ethereal Sci-Fi Celestial Major 7th Chord ──
            else if (type === 'ufoWarp') {
                // Lush Ab Major 7th Portal Chord: Ab4 (415.3 Hz), C5 (523.2 Hz), Eb5 (622.2 Hz), G5 (784.0 Hz)
                const chord = [415.3, 523.25, 622.25, 783.99];
                chord.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const filter = this.ctx.createBiquadFilter();
                    const t = now + idx * 0.025;

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, t);

                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(600, t);
                    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.15);

                    gain.gain.setValueAtTime(0.01, t);
                    gain.gain.linearRampToValueAtTime(0.14, t + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(dest);

                    osc.start(t);
                    osc.stop(t + 0.33);
                });

                // Soft sub-space resonance pulse (130 Hz -> 220 Hz)
                const pulse = this.ctx.createOscillator();
                const pulseGain = this.ctx.createGain();
                pulse.type = 'sine';
                pulse.frequency.setValueAtTime(130, now);
                pulse.frequency.exponentialRampToValueAtTime(220, now + 0.18);
                pulseGain.gain.setValueAtTime(0.20, now);
                pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                pulse.connect(pulseGain);
                pulseGain.connect(dest);
                pulse.start(now);
                pulse.stop(now + 0.23);
            }

            // ── UFO WARP OUT (EXIT) — Swift Hyperspace Acceleration Whoosh ──
            else if (type === 'ufoWarpOut') {
                const dur = 0.22;
                // Hyperspace frequency launch (240 Hz -> 980 Hz)
                const warpOsc = this.ctx.createOscillator();
                const warpGain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                warpOsc.type = 'sine';
                warpOsc.frequency.setValueAtTime(240, now);
                warpOsc.frequency.exponentialRampToValueAtTime(980, now + dur);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1100, now);

                warpGain.gain.setValueAtTime(0.22, now);
                warpGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                warpOsc.connect(filter);
                filter.connect(warpGain);
                warpGain.connect(dest);

                warpOsc.start(now);
                warpOsc.stop(now + dur + 0.01);

                // Sparkling starlight flash chime
                const starOsc = this.ctx.createOscillator();
                const starGain = this.ctx.createGain();
                starOsc.type = 'sine';
                starOsc.frequency.setValueAtTime(1567.98, now + 0.05);
                starGain.gain.setValueAtTime(0.15, now + 0.05);
                starGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                starOsc.connect(starGain);
                starGain.connect(dest);
                starOsc.start(now + 0.05);
                starOsc.stop(now + 0.23);
            }

            // ── SWAP — Swift 3D Orbital Tile Swap (Magical Spatial Whoosh + Crystal Chime) ──
            else if (type === 'swap') {
                const dur = 0.26;

                // 1. Aerodynamic Spatial Whoosh (Triangle 260 Hz -> 520 Hz -> 340 Hz)
                const whoosh = this.ctx.createOscillator();
                const whooshGain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                whoosh.type = 'triangle';
                whoosh.frequency.setValueAtTime(260, now);
                whoosh.frequency.linearRampToValueAtTime(520, now + 0.12);
                whoosh.frequency.exponentialRampToValueAtTime(340, now + dur);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(650, now);

                whooshGain.gain.setValueAtTime(0.01, now);
                whooshGain.gain.linearRampToValueAtTime(0.24, now + 0.12);
                whooshGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                whoosh.connect(filter);
                filter.connect(whooshGain);
                whooshGain.connect(dest);

                whoosh.start(now);
                whoosh.stop(now + dur + 0.01);

                // 2. Twin Cosmic Glass Chimes (G5 784 Hz & D6 1175 Hz)
                [783.99, 1174.66].forEach((f, idx) => {
                    const chime = this.ctx.createOscillator();
                    const chimeGain = this.ctx.createGain();
                    const t = now + 0.08 + idx * 0.04;
                    chime.type = 'sine';
                    chime.frequency.setValueAtTime(f, t);
                    chimeGain.gain.setValueAtTime(0.18, t);
                    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
                    chime.connect(chimeGain);
                    chimeGain.connect(dest);
                    chime.start(t);
                    chime.stop(t + 0.21);
                });
            }

            // ── UNDO — Mystical Time-Rewind Chrono Warp (Reverse Swell + Cascading Triad) ──
            else if (type === 'undo') {
                const dur = 0.35;

                // 1. Reverse-time Temporal Swell (Sine glide with reverse envelope 180 Hz -> 440 Hz)
                const swell = this.ctx.createOscillator();
                const swellGain = this.ctx.createGain();
                swell.type = 'sine';
                swell.frequency.setValueAtTime(180, now);
                swell.frequency.exponentialRampToValueAtTime(440, now + 0.22);

                swellGain.gain.setValueAtTime(0.01, now);
                swellGain.gain.linearRampToValueAtTime(0.28, now + 0.20);
                swellGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                swell.connect(swellGain);
                swellGain.connect(dest);
                swell.start(now);
                swell.stop(now + dur + 0.01);

                // 2. Descending Golden Time Chimes (C6 1046 Hz -> G5 784 Hz -> E5 659 Hz)
                [1046.5, 783.99, 659.25].forEach((f, idx) => {
                    const chime = this.ctx.createOscillator();
                    const chimeGain = this.ctx.createGain();
                    const t = now + 0.14 + idx * 0.05;
                    chime.type = 'sine';
                    chime.frequency.setValueAtTime(f, t);
                    chimeGain.gain.setValueAtTime(0.16, t);
                    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                    chime.connect(chimeGain);
                    chimeGain.connect(dest);
                    chime.start(t);
                    chime.stop(t + 0.23);
                });
            }

            // ── BLACK HOLE OPEN — Sub-Space Gravitational Distortion Swell ────
            else if (type === 'blackHoleOpen') {
                const dur = 0.18;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(80, now);
                osc.frequency.exponentialRampToValueAtTime(320, now + dur);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(450, now);

                gain.gain.setValueAtTime(0.01, now);
                gain.gain.linearRampToValueAtTime(0.35, now + 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(dest);

                osc.start(now);
                osc.stop(now + dur + 0.01);
            }

            // ── BLACK HOLE COLLAPSE — Deep Singularity Implosion + Quantum Chime ──
            else if (type === 'blackHoleCollapse') {
                // 1. Deep Gravitational Vacuum Drop (160 Hz -> 28 Hz)
                const dropOsc = this.ctx.createOscillator();
                const dropGain = this.ctx.createGain();
                dropOsc.type = 'sine';
                dropOsc.frequency.setValueAtTime(160, now);
                dropOsc.frequency.exponentialRampToValueAtTime(28, now + 0.22);
                dropGain.gain.setValueAtTime(0.85, now);
                dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                dropOsc.connect(dropGain);
                dropGain.connect(dest);
                dropOsc.start(now);
                dropOsc.stop(now + 0.26);

                // 2. Crisp Quantum Implosion Snap (240 Hz -> 880 Hz in 45ms)
                const snapOsc = this.ctx.createOscillator();
                const snapGain = this.ctx.createGain();
                snapOsc.type = 'triangle';
                snapOsc.frequency.setValueAtTime(240, now);
                snapOsc.frequency.exponentialRampToValueAtTime(880, now + 0.045);
                snapGain.gain.setValueAtTime(0.42, now);
                snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
                snapOsc.connect(snapGain);
                snapGain.connect(dest);
                snapOsc.start(now);
                snapOsc.stop(now + 0.08);

                // 3. Ethereal Stardust Chimes (F6 1396 Hz & C7 2093 Hz)
                [1396.91, 2093.0].forEach((freq, idx) => {
                    const chimeOsc = this.ctx.createOscillator();
                    const chimeGain = this.ctx.createGain();
                    const t = now + 0.06 + idx * 0.04;
                    chimeOsc.type = 'sine';
                    chimeOsc.frequency.setValueAtTime(freq, t);
                    chimeGain.gain.setValueAtTime(0.20, t);
                    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                    chimeOsc.connect(chimeGain);
                    chimeGain.connect(dest);
                    chimeOsc.start(t);
                    chimeOsc.stop(t + 0.23);
                });
            }

            // ── DRONE LAUNCH — Heavy Tactical Stealth Jet Turbine & Ascent Ingress ────
            else if (type === 'droneLaunch') {
                const dur = 0.65;
                // Jet Turbine Spool (Sawtooth + Resonant Filter)
                const turbine = this.ctx.createOscillator();
                const turbineGain = this.ctx.createGain();
                const turbineFilter = this.ctx.createBiquadFilter();

                turbine.type = 'sawtooth';
                turbine.frequency.setValueAtTime(110, now);
                turbine.frequency.exponentialRampToValueAtTime(340, now + 0.28);
                turbine.frequency.exponentialRampToValueAtTime(260, now + dur);

                turbineFilter.type = 'lowpass';
                turbineFilter.Q.setValueAtTime(3.5, now);
                turbineFilter.frequency.setValueAtTime(280, now);
                turbineFilter.frequency.exponentialRampToValueAtTime(1200, now + 0.30);
                turbineFilter.frequency.exponentialRampToValueAtTime(500, now + dur);

                turbineGain.gain.setValueAtTime(0.01, now);
                turbineGain.gain.linearRampToValueAtTime(0.38, now + 0.18);
                turbineGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                turbine.connect(turbineFilter);
                turbineFilter.connect(turbineGain);
                turbineGain.connect(dest);

                turbine.start(now);
                turbine.stop(now + dur + 0.02);

                // Supersonic Air-Shear Noise Woosh
                const noiseBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
                const nData = noiseBuf.getChannelData(0);
                for (let i = 0; i < nData.length; i++) {
                    nData[i] = Math.random() * 2 - 1;
                }
                const nSource = this.ctx.createBufferSource();
                nSource.buffer = noiseBuf;
                const nFilter = this.ctx.createBiquadFilter();
                nFilter.type = 'bandpass';
                nFilter.Q.setValueAtTime(1.8, now);
                nFilter.frequency.setValueAtTime(350, now);
                nFilter.frequency.exponentialRampToValueAtTime(1600, now + 0.28);
                nFilter.frequency.exponentialRampToValueAtTime(550, now + dur);

                const nGain = this.ctx.createGain();
                nGain.gain.setValueAtTime(0.01, now);
                nGain.gain.linearRampToValueAtTime(0.28, now + 0.20);
                nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                nSource.connect(nFilter);
                nFilter.connect(nGain);
                nGain.connect(dest);

                nSource.start(now);
                nSource.stop(now + dur + 0.02);
            }

            // ── DRONE RETURN — Supersonic Descent & Deceleration Thruster Burn ───
            else if (type === 'droneReturn') {
                const dur = 0.62;
                const turbine = this.ctx.createOscillator();
                const turbineGain = this.ctx.createGain();
                const turbineFilter = this.ctx.createBiquadFilter();

                turbine.type = 'sawtooth';
                turbine.frequency.setValueAtTime(320, now);
                turbine.frequency.exponentialRampToValueAtTime(130, now + dur);

                turbineFilter.type = 'lowpass';
                turbineFilter.Q.setValueAtTime(3.0, now);
                turbineFilter.frequency.setValueAtTime(950, now);
                turbineFilter.frequency.exponentialRampToValueAtTime(260, now + dur);

                turbineGain.gain.setValueAtTime(0.01, now);
                turbineGain.gain.linearRampToValueAtTime(0.30, now + 0.12);
                turbineGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                turbine.connect(turbineFilter);
                turbineFilter.connect(turbineGain);
                turbineGain.connect(dest);

                turbine.start(now);
                turbine.stop(now + dur + 0.02);

                // Descent air shear
                const noiseBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
                const nData = noiseBuf.getChannelData(0);
                for (let i = 0; i < nData.length; i++) {
                    nData[i] = Math.random() * 2 - 1;
                }
                const nSource = this.ctx.createBufferSource();
                nSource.buffer = noiseBuf;
                const nFilter = this.ctx.createBiquadFilter();
                nFilter.type = 'bandpass';
                nFilter.Q.setValueAtTime(2.0, now);
                nFilter.frequency.setValueAtTime(1200, now);
                nFilter.frequency.exponentialRampToValueAtTime(320, now + dur);

                const nGain = this.ctx.createGain();
                nGain.gain.setValueAtTime(0.01, now);
                nGain.gain.linearRampToValueAtTime(0.25, now + 0.14);
                nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                nSource.connect(nFilter);
                nFilter.connect(nGain);
                nGain.connect(dest);

                nSource.start(now);
                nSource.stop(now + dur + 0.02);
            }

            // ── DRONE DOCK — Magnetic Hangar Latch & Docking Confirmation ──────────
            else if (type === 'droneDock') {
                // 1. Mechanical Latch Thud
                const latch = this.ctx.createOscillator();
                const latchGain = this.ctx.createGain();
                latch.type = 'triangle';
                latch.frequency.setValueAtTime(240, now);
                latch.frequency.exponentialRampToValueAtTime(60, now + 0.08);
                latchGain.gain.setValueAtTime(0.55, now);
                latchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
                latch.connect(latchGain);
                latchGain.connect(dest);
                latch.start(now);
                latch.stop(now + 0.11);

                // 2. High-Tech Cyber Magnetic Snap Chime
                [1760.0, 2637.02].forEach((freq, idx) => {
                    const chime = this.ctx.createOscillator();
                    const chimeGain = this.ctx.createGain();
                    const t = now + 0.03 + idx * 0.045;
                    chime.type = 'sine';
                    chime.frequency.setValueAtTime(freq, t);
                    chimeGain.gain.setValueAtTime(0.25, t);
                    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    chime.connect(chimeGain);
                    chimeGain.connect(dest);
                    chime.start(t);
                    chime.stop(t + 0.13);
                });
            }

            // ── DRONE LOCK — Tactical Avionics Multi-Target Acquisition Chirps ─────────
            else if (type === 'droneLock') {
                [2093.00, 2637.02, 3135.96].forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const t = now + idx * 0.045;
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, t);
                    gain.gain.setValueAtTime(0.28, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
                    osc.connect(gain);
                    gain.connect(dest);
                    osc.start(t);
                    osc.stop(t + 0.07);
                });
            }

            // ── DRONE ROCKET SALVO — High-Velocity Missile Salvo Ignitions & Thruster Roar ──
            else if (type === 'droneRocketSalvo') {
                const dur = 0.22;
                // High-pressure rocket motor ignition roar & whoosh
                const noiseBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
                const nData = noiseBuf.getChannelData(0);
                for (let i = 0; i < nData.length; i++) {
                    nData[i] = Math.random() * 2 - 1;
                }
                const nSource = this.ctx.createBufferSource();
                nSource.buffer = noiseBuf;
                const nFilter = this.ctx.createBiquadFilter();
                nFilter.type = 'bandpass';
                nFilter.Q.setValueAtTime(2.2, now);
                nFilter.frequency.setValueAtTime(650, now);
                nFilter.frequency.exponentialRampToValueAtTime(2800, now + 0.12);
                nFilter.frequency.exponentialRampToValueAtTime(800, now + dur);

                const nGain = this.ctx.createGain();
                nGain.gain.setValueAtTime(0.01, now);
                nGain.gain.linearRampToValueAtTime(0.35, now + 0.05);
                nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                nSource.connect(nFilter);
                nFilter.connect(nGain);
                nGain.connect(dest);
                nSource.start(now);
                nSource.stop(now + dur + 0.01);

                // Supersonic jet streak whistle (pure sine chirp)
                const streak = this.ctx.createOscillator();
                const streakGain = this.ctx.createGain();
                streak.type = 'sine';
                streak.frequency.setValueAtTime(440, now);
                streak.frequency.exponentialRampToValueAtTime(1480, now + 0.14);
                streakGain.gain.setValueAtTime(0.18, now);
                streakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                streak.connect(streakGain);
                streakGain.connect(dest);
                streak.start(now);
                streak.stop(now + 0.19);
            }

            // ── DRONE IMPACT — THUNDEROUS CINEMATIC MULTI-DETONATION ────────────────
            // (Rich, Satisfying, Deep Sub-Bass, Crisp Detonation Crack, No Harsh Buzzi-ness)
            else if (type === 'droneImpact') {
                const dur = 0.85;

                // 1. Crisp Ordnance Detonation Shockwave (High-energy explosive snap/crack)
                const crackBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.18), this.ctx.sampleRate);
                const cData = crackBuf.getChannelData(0);
                for (let i = 0; i < cData.length; i++) {
                    cData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
                }
                const cSource = this.ctx.createBufferSource();
                cSource.buffer = crackBuf;
                const cFilter = this.ctx.createBiquadFilter();
                cFilter.type = 'bandpass';
                cFilter.Q.setValueAtTime(1.8, now);
                cFilter.frequency.setValueAtTime(3200, now);
                cFilter.frequency.exponentialRampToValueAtTime(450, now + 0.15);

                const cGain = this.ctx.createGain();
                cGain.gain.setValueAtTime(0.55, now);
                cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

                cSource.connect(cFilter);
                cFilter.connect(cGain);
                cGain.connect(dest);
                cSource.start(now);
                cSource.stop(now + 0.18);

                // 2. Heavy Sub-Bass Kinetic Thump (Chest-shaking fundamental, 150 Hz -> 36 Hz)
                const subOsc = this.ctx.createOscillator();
                const subGain = this.ctx.createGain();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(150, now);
                subOsc.frequency.exponentialRampToValueAtTime(36, now + 0.22);
                subGain.gain.setValueAtTime(0.65, now);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

                subOsc.connect(subGain);
                subGain.connect(dest);
                subOsc.start(now);
                subOsc.stop(now + 0.40);

                // 3. Low-End Earthquake Rumble Body (Dual harmonic 52 Hz & 38 Hz rolling sustain)
                const rumble1 = this.ctx.createOscillator();
                const rumble2 = this.ctx.createOscillator();
                const rumbleGain = this.ctx.createGain();
                rumble1.type = 'triangle';
                rumble2.type = 'sine';
                rumble1.frequency.setValueAtTime(54, now);
                rumble1.frequency.exponentialRampToValueAtTime(22, now + dur);
                rumble2.frequency.setValueAtTime(38, now);
                rumble2.frequency.exponentialRampToValueAtTime(18, now + dur);

                rumbleGain.gain.setValueAtTime(0.48, now + 0.02);
                rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                rumble1.connect(rumbleGain);
                rumble2.connect(rumbleGain);
                rumbleGain.connect(dest);
                rumble1.start(now);
                rumble2.start(now);
                rumble1.stop(now + dur + 0.02);
                rumble2.stop(now + dur + 0.02);

                // 4. Staggered 5-Tile Shatter Mini-Burst Cluster (Rapid kinetic popcorn shatter)
                [0.0, 0.025, 0.055, 0.085, 0.115].forEach((offset, idx) => {
                    const pop = this.ctx.createOscillator();
                    const popGain = this.ctx.createGain();
                    const popFilter = this.ctx.createBiquadFilter();
                    const t = now + offset;

                    pop.type = 'triangle';
                    pop.frequency.setValueAtTime(190 - idx * 16, t);
                    pop.frequency.exponentialRampToValueAtTime(45, t + 0.06);

                    popFilter.type = 'lowpass';
                    popFilter.frequency.setValueAtTime(800, t);

                    popGain.gain.setValueAtTime(0.28, t);
                    popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

                    pop.connect(popFilter);
                    popFilter.connect(popGain);
                    popGain.connect(dest);
                    pop.start(t);
                    pop.stop(t + 0.08);
                });

                // 5. Crystalline Hot Shrapnel Sparkle Reverb (Juicy game satisfaction tone)
                [1864.66, 2349.32, 2959.96].forEach((freq, idx) => {
                    const spark = this.ctx.createOscillator();
                    const sparkGain = this.ctx.createGain();
                    const t = now + 0.04 + idx * 0.035;

                    spark.type = 'sine';
                    spark.frequency.setValueAtTime(freq, t);
                    sparkGain.gain.setValueAtTime(0.12, t);
                    sparkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

                    spark.connect(sparkGain);
                    sparkGain.connect(dest);
                    spark.start(t);
                    spark.stop(t + 0.24);
                });

                // 6. Deep Rolling Debris Tail (Warm, velvety lowpass filtered noise)
                const tailBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.65), this.ctx.sampleRate);
                const tData = tailBuf.getChannelData(0);
                let lastOut = 0.0;
                for (let i = 0; i < tData.length; i++) {
                    const w = Math.random() * 2 - 1;
                    lastOut = (lastOut + 0.04 * w) / 1.04;
                    tData[i] = lastOut * 3.5;
                }
                const tSource = this.ctx.createBufferSource();
                tSource.buffer = tailBuf;
                const tFilter = this.ctx.createBiquadFilter();
                tFilter.type = 'lowpass';
                tFilter.frequency.setValueAtTime(650, now);
                tFilter.frequency.exponentialRampToValueAtTime(90, now + 0.65);

                const tGain = this.ctx.createGain();
                tGain.gain.setValueAtTime(0.35, now + 0.04);
                tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

                tSource.connect(tFilter);
                tFilter.connect(tGain);
                tGain.connect(dest);
                tSource.start(now + 0.02);
                tSource.stop(now + 0.68);
            }

            // ── OCTOPUS SPAWN — Ethereal Bioluminescent Emergence ─────────────
            else if (type === 'octoSpawn') {
                const dur = 0.14;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(540, now + dur);
                gain.gain.setValueAtTime(0.01, now);
                gain.gain.linearRampToValueAtTime(0.28, now + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
                osc.connect(gain);
                gain.connect(dest);
                osc.start(now);
                osc.stop(now + dur + 0.01);
            }

            // ── OCTOPUS SNATCH — 5 Rapid Suction Snaps + Deep Cosmic Crunch ───
            else if (type === 'octoSnatch') {
                // 1. 5 Rapid High-Speed Suction Snaps ("thwip-thwip-thwip-thwip-thwip!")
                for (let i = 0; i < 5; i++) {
                    const snapTime = now + i * 0.018;
                    const snapOsc = this.ctx.createOscillator();
                    const snapGain = this.ctx.createGain();
                    snapOsc.type = 'sine';
                    snapOsc.frequency.setValueAtTime(320 + i * 40, snapTime);
                    snapOsc.frequency.exponentialRampToValueAtTime(750 + i * 60, snapTime + 0.04);
                    snapGain.gain.setValueAtTime(0.35, snapTime);
                    snapGain.gain.exponentialRampToValueAtTime(0.001, snapTime + 0.045);
                    snapOsc.connect(snapGain);
                    snapGain.connect(dest);
                    snapOsc.start(snapTime);
                    snapOsc.stop(snapTime + 0.05);
                }

                // 2. Heavy Sub-Bass Vortex Crunch (160 Hz -> 38 Hz)
                const crunchOsc = this.ctx.createOscillator();
                const crunchGain = this.ctx.createGain();
                crunchOsc.type = 'triangle';
                crunchOsc.frequency.setValueAtTime(160, now + 0.04);
                crunchOsc.frequency.exponentialRampToValueAtTime(38, now + 0.22);
                crunchGain.gain.setValueAtTime(0.85, now + 0.04);
                crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
                crunchOsc.connect(crunchGain);
                crunchGain.connect(dest);
                crunchOsc.start(now + 0.04);
                crunchOsc.stop(now + 0.25);

                // 3. Sparkling Bioluminescent Crystal Chimes
                [1480.0, 2217.46].forEach((f, idx) => {
                    const chime = this.ctx.createOscillator();
                    const chimeGain = this.ctx.createGain();
                    const t = now + 0.08 + idx * 0.04;
                    chime.type = 'sine';
                    chime.frequency.setValueAtTime(f, t);
                    chimeGain.gain.setValueAtTime(0.22, t);
                    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
                    chime.connect(chimeGain);
                    chimeGain.connect(dest);
                    chime.start(t);
                    chime.stop(t + 0.19);
                });
            }

            // ── OCTOPUS EXIT — Bubbly Cosmic Ink Jet Propulsion Whoosh ────────
            else if (type === 'octoExit') {
                const dur = 0.22;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(260, now);
                osc.frequency.exponentialRampToValueAtTime(980, now + dur);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
                osc.connect(gain);
                gain.connect(dest);
                osc.start(now);
                osc.stop(now + dur + 0.01);
            }

            // ── CHOMPER DROP — Cute Squishy Alien Land Pop (Boing) ────────────
            else if (type === 'chomperDrop') {
                const dur = 0.16;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(260, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
                osc.frequency.linearRampToValueAtTime(160, now + dur);

                gain.gain.setValueAtTime(0.36, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                osc.connect(gain);
                gain.connect(dest);
                osc.start(now);
                osc.stop(now + dur + 0.01);
            }

            // ── CHOMPER BITE — Ultra-Satisfying Juicy Big Bite (CHOMP!) ────────
            else if (type === 'chomperBite') {
                const dur = 0.28;

                // 1. Meaty Bass Impact Thump (180 Hz -> 42 Hz)
                const thud = this.ctx.createOscillator();
                const thudGain = this.ctx.createGain();
                thud.type = 'triangle';
                thud.frequency.setValueAtTime(180, now);
                thud.frequency.exponentialRampToValueAtTime(42, now + 0.12);
                thudGain.gain.setValueAtTime(0.85, now);
                thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                thud.connect(thudGain);
                thudGain.connect(dest);
                thud.start(now);
                thud.stop(now + 0.16);

                // 2. Snappy Bubble Suction Pop (220 Hz -> 580 Hz)
                const pop = this.ctx.createOscillator();
                const popGain = this.ctx.createGain();
                pop.type = 'sine';
                pop.frequency.setValueAtTime(220, now);
                pop.frequency.exponentialRampToValueAtTime(580, now + 0.07);
                popGain.gain.setValueAtTime(0.48, now);
                popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
                pop.connect(popGain);
                popGain.connect(dest);
                pop.start(now);
                pop.stop(now + 0.11);

                // 3. Satiated Sparkling Crystal Chimes (D6 1175 Hz & A6 1760 Hz)
                [1174.66, 1760.0].forEach((f, idx) => {
                    const chime = this.ctx.createOscillator();
                    const chimeGain = this.ctx.createGain();
                    const t = now + 0.06 + idx * 0.04;
                    chime.type = 'sine';
                    chime.frequency.setValueAtTime(f, t);
                    chimeGain.gain.setValueAtTime(0.20, t);
                    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
                    chime.connect(chimeGain);
                    chimeGain.connect(dest);
                    chime.start(t);
                    chime.stop(t + 0.19);
                });
            }

            // ── CHOMPER EXIT — Playful Rocket Spring Jump Out ─────────────────
            else if (type === 'chomperExit') {
                const dur = 0.20;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(920, now + dur);

                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                osc.connect(gain);
                gain.connect(dest);
                osc.start(now);
                osc.stop(now + dur + 0.01);
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

            // ── CLICK / POP — Crisp, Clean UI Touch Feedback ─────────────────
            else if (type === 'click' || type === 'pop') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(480, now);
                osc.frequency.exponentialRampToValueAtTime(720, now + 0.05);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                osc.connect(gain);
                gain.connect(dest);
                osc.start(now);
                osc.stop(now + 0.07);
            }
        } catch (e) {
            console.warn('Sound play error:', e);
        }
    }

    // ── Public API ──────────────────────────────────────────────────
    playShoot()              { /* Muted per user request: sound triggers only on block merge */ }
    playMerge(comboLvl = 1) { this._play('merge', comboLvl); }
    playClick()              { this._play('click'); }
    playPop()                { this._play('pop'); }
    playComboFire()          { this._play('fever'); }
    playComboEnd()           { this._play('feverEnd'); }
    playFeverEnd()           { this._play('feverEnd'); }
    playReward()             { this._play('reward'); }
    playLevelUp()            { this._play('levelUp'); }
    playBomb()               { this._play('bomb'); }
    playJetFlyby()           { this._play('jetFlyby'); }
    playBombWhistle()        { this._play('bombWhistle'); }
    playHammer()             { this._play('hammer'); }
    playHammerWhoosh()       { this._play('hammerWhoosh'); }
    playUfoBeam()            { this._play('ufoBeam'); }
    playUfoAbduct()          { this._play('ufoAbduct'); }
    playUfoWarp()            { this._play('ufoWarp'); }
    playUfoWarpOut()         { this._play('ufoWarpOut'); }
    playBlackHoleOpen()      { this._play('blackHoleOpen'); }
    playBlackHoleCollapse()  { this._play('blackHoleCollapse'); }
    playDroneLaunch()        { this._play('droneLaunch'); }
    playDroneLock()          { this._play('droneLock'); }
    playDroneRocketSalvo()   { this._play('droneRocketSalvo'); }
    playDroneImpact()        { this._play('droneImpact'); }
    playDroneReturn()        { this._play('droneReturn'); }
    playDroneDock()          { this._play('droneDock'); }
    playOctoSpawn()          { this._play('blackHoleOpen'); }
    playOctoSnatch()         { this._play('blackHoleCollapse'); }
    playOctoExit()           { /* alias */ }
    playChomperDrop()        { this._play('blackHoleOpen'); }
    playChomperBite()        { this._play('blackHoleCollapse'); }
    playChomperExit()        { /* alias */ }
    playSwap()               { this._play('swap'); }
    playUndo()               { this._play('undo'); }
    playGameOver()           { this._play('gameOver'); }
}

const sounds = new SoundEngine();
