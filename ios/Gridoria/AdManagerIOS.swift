import UIKit
import GoogleMobileAds
import AppTrackingTransparency
import AdSupport

class AdManagerIOS: NSObject, GADFullScreenContentDelegate {
    static let shared = AdManagerIOS()

    // MARK: - Ad Unit IDs
    let rewardedAdUnitID = "ca-app-pub-7719335438184188/5117225143"
    let peekRewardedAdUnitID = "ca-app-pub-7719335438184188/1177980130"
    let interstitialAdUnitID = "ca-app-pub-3940256099942544/1033173712"
    let bannerAdUnitID = "ca-app-pub-3940256099942544/2934735716"

    private var rewardedAd: GADRewardedAd?
    private var interstitialAd: GADInterstitialAd?
    private var bannerView: GADBannerView?

    private var isLoadingRewarded = false
    private var isLoadingInterstitial = false
    private var isInitialized = false

    private var pendingRewardCallback: (() -> Void)?
    private var pendingFailCallback: ((String) -> Void)?

    private override init() {
        super.init()
    }

    // MARK: - Safe Initialization (Main Thread)
    func initialize() {
        guard !isInitialized else { return }
        isInitialized = true

        DispatchQueue.main.async {
            // Request ATT on iOS 14.5+
            self.requestATT {
                // Initialize AdMob SDK
                GADMobileAds.sharedInstance().start { status in
                    print("✅ AdMob: Google Mobile Ads SDK initialized successfully.")
                    // Preload initial ads
                    self.loadRewardedAd()
                    self.loadInterstitialAd()
                }
            }
        }
    }

    // MARK: - App Tracking Transparency (ATT)
    private func requestATT(completion: @escaping () -> Void) {
        if #available(iOS 14.5, *) {
            ATTrackingManager.requestTrackingAuthorization { _ in
                DispatchQueue.main.async {
                    completion()
                }
            }
        } else {
            completion()
        }
    }

    // MARK: - Rewarded Ads
    func loadRewardedAd() {
        guard !isLoadingRewarded, rewardedAd == nil else { return }
        isLoadingRewarded = true

        let request = GADRequest()
        GADRewardedAd.load(withAdUnitID: rewardedAdUnitID, request: request) { [weak self] ad, error in
            guard let self = self else { return }
            self.isLoadingRewarded = false

            if let error = error {
                print("⚠️ AdMob: Rewarded ad failed to load: \(error.localizedDescription)")
                self.rewardedAd = nil
                return
            }

            self.rewardedAd = ad
            self.rewardedAd?.fullScreenContentDelegate = self
            print("✅ AdMob: Rewarded ad loaded and ready.")
        }
    }

    func showRewardedAd(
        from viewController: UIViewController,
        rewardType: String,
        onReward: @escaping () -> Void,
        onFail: @escaping (String) -> Void
    ) {
        DispatchQueue.main.async {
            guard let ad = self.rewardedAd else {
                print("ℹ️ AdMob: Rewarded ad not ready yet, loading now...")
                self.loadRewardedAd()
                onFail("Reklam yükleniyor, lütfen birkaç saniye sonra tekrar deneyin.")
                return
            }

            self.pendingRewardCallback = onReward
            self.pendingFailCallback = onFail

            ad.present(fromRootViewController: viewController) {
                print("🎉 AdMob: User earned reward for \(rewardType)")
                self.pendingRewardCallback?()
                self.pendingRewardCallback = nil
            }
        }
    }

    // MARK: - Interstitial Ads
    func loadInterstitialAd() {
        guard !isLoadingInterstitial, interstitialAd == nil else { return }
        isLoadingInterstitial = true

        let request = GADRequest()
        GADInterstitialAd.load(withAdUnitID: interstitialAdUnitID, request: request) { [weak self] ad, error in
            guard let self = self else { return }
            self.isLoadingInterstitial = false

            if let error = error {
                print("⚠️ AdMob: Interstitial ad failed to load: \(error.localizedDescription)")
                self.interstitialAd = nil
                return
            }

            self.interstitialAd = ad
            self.interstitialAd?.fullScreenContentDelegate = self
            print("✅ AdMob: Interstitial ad loaded.")
        }
    }

    func showInterstitialAd(from viewController: UIViewController) {
        DispatchQueue.main.async {
            if let ad = self.interstitialAd {
                ad.present(fromRootViewController: viewController)
            } else {
                print("ℹ️ AdMob: Interstitial ad not ready, requesting load.")
                self.loadInterstitialAd()
            }
        }
    }

    // MARK: - GADFullScreenContentDelegate
    func adDidDismissFullScreenContent(_ ad: GADFullScreenPresentingAd) {
        print("ℹ️ AdMob: Ad dismissed by user.")
        if ad is GADRewardedAd {
            rewardedAd = nil
            loadRewardedAd()
        } else if ad is GADInterstitialAd {
            interstitialAd = nil
            loadInterstitialAd()
        }
    }

    func ad(_ ad: GADFullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        print("❌ AdMob: Ad failed to present: \(error.localizedDescription)")
        if ad is GADRewardedAd {
            pendingFailCallback?(error.localizedDescription)
            pendingFailCallback = nil
            rewardedAd = nil
            loadRewardedAd()
        } else if ad is GADInterstitialAd {
            interstitialAd = nil
            loadInterstitialAd()
        }
    }
}
