/**
 * Gridoria Cross-Platform Native Bridge v1.0
 * Unified Bridge for Android (AndroidBridge) and iOS (WKScriptMessageHandler)
 */
const NativeBridge = {
    isAndroid() {
        return typeof window.AndroidBridge !== 'undefined';
    },

    isIOS() {
        return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iosBridge);
    },

    sendToNative(action, payload = {}) {
        const msg = { action, ...payload };
        if (this.isIOS()) {
            try {
                window.webkit.messageHandlers.iosBridge.postMessage(msg);
                return true;
            } catch (e) {
                console.warn('iOS NativeBridge message error:', e);
            }
        }
        return false;
    },

    // ── 📳 Haptic Feedback (Android Vibrator + iOS Taptic Engine) ──
    triggerHaptic(type = 'medium') {
        // 1. iOS Native Haptic
        if (this.isIOS()) {
            this.sendToNative('haptic', { type });
            return;
        }

        // 2. Android Native Haptic
        if (this.isAndroid() && typeof window.AndroidBridge.triggerHaptic === 'function') {
            try {
                window.AndroidBridge.triggerHaptic(type);
                return;
            } catch (e) {
                console.warn('AndroidBridge triggerHaptic error:', e);
            }
        }

        // 3. Web / Fallback HTML5 Vibration API
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                if (type === 'heavy') navigator.vibrate(26);
                else if (type === 'medium') navigator.vibrate(16);
                else if (type === 'light') navigator.vibrate(8);
                else navigator.vibrate(12);
            } catch (e) {}
        }
    },

    // ── 📢 Banner Ad Visibility Toggle ──
    setBannerVisible(visible) {
        if (this.isIOS()) {
            this.sendToNative('setBannerVisible', { visible: !!visible });
            return;
        }
        if (this.isAndroid() && typeof window.AndroidBridge.setBannerVisible === 'function') {
            try {
                window.AndroidBridge.setBannerVisible(!!visible);
            } catch (e) {
                console.warn('AndroidBridge setBannerVisible error:', e);
            }
        }
    },

    // ── 🎁 Rewarded Ads (AdMob) ──
    showRewardedAd(rewardType) {
        if (this.isIOS()) {
            this.sendToNative('showRewardedAd', { rewardType });
            return true;
        }
        if (this.isAndroid() && typeof window.AndroidBridge.showRewardedAd === 'function') {
            try {
                window.AndroidBridge.showRewardedAd(rewardType);
                return true;
            } catch (e) {
                console.warn('AndroidBridge showRewardedAd error:', e);
            }
        }
        return false;
    },

    // ── 📺 Interstitial Ads (AdMob) ──
    showInterstitialAd() {
        if (this.isIOS()) {
            this.sendToNative('showInterstitialAd');
            return true;
        }
        if (this.isAndroid() && typeof window.AndroidBridge.showInterstitialAd === 'function') {
            try {
                window.AndroidBridge.showInterstitialAd();
                return true;
            } catch (e) {
                console.warn('AndroidBridge showInterstitialAd error:', e);
            }
        }
        return false;
    }
};

window.NativeBridge = NativeBridge;
