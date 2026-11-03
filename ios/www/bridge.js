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
    },

    // ── 💎 In-App Purchases (StoreKit 2 / Google Play Billing) ──
    buyProduct(productId) {
        if (this.isIOS()) {
            return this.sendToNative('buyProduct', { productId });
        }
        if (this.isAndroid() && typeof window.AndroidBridge.buyProduct === 'function') {
            try {
                window.AndroidBridge.buyProduct(productId);
                return true;
            } catch (e) {
                console.warn('AndroidBridge buyProduct error:', e);
            }
        }
        console.log('NativeBridge.buyProduct called for:', productId);
        return false;
    },

    // ── 🔄 Restore Purchases (Apple / Google Play) ──
    restorePurchases() {
        if (this.isIOS()) {
            return this.sendToNative('restorePurchases');
        }
        if (this.isAndroid() && typeof window.AndroidBridge.restorePurchases === 'function') {
            try {
                window.AndroidBridge.restorePurchases();
                return true;
            } catch (e) {
                console.warn('AndroidBridge restorePurchases error:', e);
            }
        }
        console.log('NativeBridge.restorePurchases called');
        return false;
    },

    // ── ⭐ Google Play In-App Review (Rating & ASO Booster) ──
    requestInAppReview() {
        if (this.isIOS()) {
            this.sendToNative('requestReview');
            return true;
        }
        if (this.isAndroid() && typeof window.AndroidBridge.requestInAppReview === 'function') {
            try {
                window.AndroidBridge.requestInAppReview();
                return true;
            } catch (e) {
                console.warn('AndroidBridge requestInAppReview error:', e);
            }
        }
        return false;
    },

    // ── 🎮 Google Play Games / Game Center Leaderboards ──
    submitHighScore(score) {
        if (this.isIOS()) {
            this.sendToNative('submitScore', { score });
            return true;
        }
        if (this.isAndroid() && typeof window.AndroidBridge.submitHighScore === 'function') {
            try {
                window.AndroidBridge.submitHighScore(score);
                return true;
            } catch (e) {
                console.warn('AndroidBridge submitHighScore error:', e);
            }
        }
        return false;
    },

    showLeaderboard() {
        if (this.isIOS()) {
            this.sendToNative('showLeaderboard');
            return true;
        }
        if (this.isAndroid() && typeof window.AndroidBridge.showLeaderboard === 'function') {
            try {
                window.AndroidBridge.showLeaderboard();
                return true;
            } catch (e) {
                console.warn('AndroidBridge showLeaderboard error:', e);
            }
        }
        return false;
    },

    showAchievements() {
        if (this.isIOS()) {
            this.sendToNative('showAchievements');
            return true;
        }
        if (this.isAndroid() && typeof window.AndroidBridge.showAchievements === 'function') {
            try {
                window.AndroidBridge.showAchievements();
                return true;
            } catch (e) {
                console.warn('AndroidBridge showAchievements error:', e);
            }
        }
        return false;
    },

    unlockAchievement(achievementId) {
        if (this.isIOS()) {
            this.sendToNative('unlockAchievement', { achievementId });
            return true;
        }
        if (this.isAndroid() && typeof window.AndroidBridge.unlockAchievement === 'function') {
            try {
                window.AndroidBridge.unlockAchievement(achievementId);
                return true;
            } catch (e) {
                console.warn('AndroidBridge unlockAchievement error:', e);
            }
        }
        return false;
    },

    checkForUpdates() {
        if (this.isAndroid() && typeof window.AndroidBridge.checkForUpdates === 'function') {
            try {
                window.AndroidBridge.checkForUpdates();
                return true;
            } catch (e) {
                console.warn('AndroidBridge checkForUpdates error:', e);
            }
        }
        return false;
    },

    // ── 🔔 Schedule Daily Local Notifications (24h Cycle at 19:30) ──
    scheduleDailyNotification() {
        if (this.isIOS()) {
            this.sendToNative('scheduleNotification');
            return true;
        }
        if (this.isAndroid() && typeof window.AndroidBridge.scheduleDailyNotification === 'function') {
            try {
                window.AndroidBridge.scheduleDailyNotification();
                return true;
            } catch (e) {
                console.warn('AndroidBridge scheduleDailyNotification error:', e);
            }
        }
        return false;
    }
};

window.NativeBridge = NativeBridge;
