package com.mawelly.gridoria

import android.app.Activity
import android.content.Context
import android.util.Log
import android.view.View
import android.view.ViewGroup
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardItem
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

object AdManager {

    private const val TAG = "GridoriaAdManager"

    // 🔥 User's Real AdMob Rewarded Ad Unit ID (İzle Kazan +50 Elmas)
    const val REWARDED_AD_UNIT_ID = "ca-app-pub-7719335438184188/5117225143"

    // 👁️ User's Real AdMob Rewarded Ad Unit ID (Gizli Taşı Gör / Peek Unlock)
    const val PEEK_REWARDED_AD_UNIT_ID = "ca-app-pub-7719335438184188/1177980130"

    // 📢 User's Real AdMob Banner Ad Unit ID
    const val BANNER_AD_UNIT_ID = "ca-app-pub-7719335438184188/3570113254"

    // 📺 Interstitial Ad Unit ID (Test fallback until real ID provided)
    const val INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-3940256099942544/1033173712"

    private var rewardedAd: RewardedAd? = null
    private var isRewardedLoading = false

    private var peekRewardedAd: RewardedAd? = null
    private var isPeekRewardedLoading = false

    private var interstitialAd: InterstitialAd? = null
    private var isInterstitialLoading = false

    private var isInitialized = false

    fun initialize(context: Context) {
        if (isInitialized) return
        try {
            MobileAds.initialize(context) { initializationStatus ->
                Log.d(TAG, "AdMob initialized successfully: $initializationStatus")
                isInitialized = true
                preloadRewardedAd(context)
                preloadPeekRewardedAd(context)
                preloadInterstitialAd(context)
            }
        } catch (e: Exception) {
            Log.e(TAG, "AdMob init error: ${e.message}", e)
        }
    }

    fun preloadRewardedAd(context: Context) {
        if (rewardedAd != null || isRewardedLoading) return
        isRewardedLoading = true

        val adRequest = AdRequest.Builder().build()
        RewardedAd.load(
            context,
            REWARDED_AD_UNIT_ID,
            adRequest,
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    Log.d(TAG, "RewardedAd (+50 Gems) loaded successfully.")
                    rewardedAd = ad
                    isRewardedLoading = false
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    Log.e(TAG, "RewardedAd (+50 Gems) failed to load: ${error.message}")
                    rewardedAd = null
                    isRewardedLoading = false
                }
            }
        )
    }

    fun preloadPeekRewardedAd(context: Context) {
        if (peekRewardedAd != null || isPeekRewardedLoading) return
        isPeekRewardedLoading = true

        val adRequest = AdRequest.Builder().build()
        RewardedAd.load(
            context,
            PEEK_REWARDED_AD_UNIT_ID,
            adRequest,
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    Log.d(TAG, "PeekRewardedAd (Gizli Taşı Gör) loaded successfully.")
                    peekRewardedAd = ad
                    isPeekRewardedLoading = false
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    Log.e(TAG, "PeekRewardedAd (Gizli Taşı Gör) failed to load: ${error.message}")
                    peekRewardedAd = null
                    isPeekRewardedLoading = false
                }
            }
        )
    }

    fun isRewardedAdReady(): Boolean = (rewardedAd != null || peekRewardedAd != null)

    fun showRewardedAd(
        activity: Activity,
        rewardType: String = "",
        onRewardEarned: (RewardItem) -> Unit,
        onDismissed: () -> Unit,
        onFailed: (String) -> Unit
    ) {
        val isPeek = rewardType == "peek_unlock"
        val ad = if (isPeek) (peekRewardedAd ?: rewardedAd) else (rewardedAd ?: peekRewardedAd)

        if (ad != null) {
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdShowedFullScreenContent() {
                    Log.d(TAG, "RewardedAd ($rewardType) showed full screen content.")
                    if (ad == peekRewardedAd) peekRewardedAd = null else rewardedAd = null
                }

                override fun onAdDismissedFullScreenContent() {
                    Log.d(TAG, "RewardedAd ($rewardType) dismissed.")
                    if (isPeek) preloadPeekRewardedAd(activity) else preloadRewardedAd(activity)
                    activity.runOnUiThread { onDismissed() }
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    Log.e(TAG, "RewardedAd ($rewardType) failed to show: ${error.message}")
                    if (ad == peekRewardedAd) peekRewardedAd = null else rewardedAd = null
                    if (isPeek) preloadPeekRewardedAd(activity) else preloadRewardedAd(activity)
                    activity.runOnUiThread { onFailed(error.message) }
                }
            }

            ad.show(activity) { rewardItem ->
                Log.d(TAG, "User earned reward ($rewardType): ${rewardItem.amount} ${rewardItem.type}")
                activity.runOnUiThread { onRewardEarned(rewardItem) }
            }
        } else {
            Log.w(TAG, "RewardedAd ($rewardType) not ready when requested to show.")
            if (isPeek) preloadPeekRewardedAd(activity) else preloadRewardedAd(activity)
            activity.runOnUiThread { onFailed("Ad not ready") }
        }
    }

    fun preloadInterstitialAd(context: Context) {
        if (interstitialAd != null || isInterstitialLoading) return
        isInterstitialLoading = true

        val adRequest = AdRequest.Builder().build()
        InterstitialAd.load(
            context,
            INTERSTITIAL_AD_UNIT_ID,
            adRequest,
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    Log.d(TAG, "InterstitialAd loaded.")
                    interstitialAd = ad
                    isInterstitialLoading = false
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    Log.e(TAG, "InterstitialAd failed to load: ${error.message}")
                    interstitialAd = null
                    isInterstitialLoading = false
                }
            }
        )
    }

    fun showInterstitialAd(activity: Activity, onDismissed: () -> Unit = {}) {
        val ad = interstitialAd
        if (ad != null) {
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    interstitialAd = null
                    preloadInterstitialAd(activity)
                    activity.runOnUiThread { onDismissed() }
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    interstitialAd = null
                    preloadInterstitialAd(activity)
                    activity.runOnUiThread { onDismissed() }
                }
            }
            ad.show(activity)
        } else {
            preloadInterstitialAd(activity)
            onDismissed()
        }
    }

    fun loadBannerAd(context: Context, container: ViewGroup): AdView {
        container.removeAllViews()
        val adView = AdView(context).apply {
            setAdSize(AdSize.BANNER)
            adUnitId = BANNER_AD_UNIT_ID
            adListener = object : com.google.android.gms.ads.AdListener() {
                override fun onAdLoaded() {
                    Log.d(TAG, "Banner ad loaded successfully!")
                    val activity = context as? MainActivity
                    if (activity != null && activity.isBannerEnabled) {
                        container.visibility = View.VISIBLE
                    } else if (activity != null && !activity.isBannerEnabled) {
                        container.visibility = View.GONE
                    }
                }

                override fun onAdFailedToLoad(error: com.google.android.gms.ads.LoadAdError) {
                    Log.e(TAG, "Banner ad failed to load: ${error.message} (code ${error.code})")
                }
            }
        }
        container.addView(adView)
        val adRequest = AdRequest.Builder().build()
        adView.loadAd(adRequest)
        Log.d(TAG, "BannerAd loading started for unit: $BANNER_AD_UNIT_ID")
        return adView
    }
}
