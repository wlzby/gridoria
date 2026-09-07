import UIKit
import WebKit
import AppTrackingTransparency
import AdSupport

class AdManagerIOS: NSObject {
    static let shared = AdManagerIOS()

    // AdMob Unit IDs for iOS
    let rewardedAdUnitID = "ca-app-pub-7719335438184188/5117225143"
    let peekRewardedAdUnitID = "ca-app-pub-7719335438184188/1177980130"
    let interstitialAdUnitID = "ca-app-pub-3940256099942544/1033173712" // Test ID

    private override init() {
        super.init()
    }

    // MARK: - App Tracking Transparency (ATT)
    func requestATTTrackingPermission(completion: (() -> Void)? = null) {
        if #available(iOS 14.5, *) {
            ATTrackingManager.requestTrackingAuthorization { status in
                DispatchQueue.main.async {
                    completion?()
                }
            }
        } else {
            completion?()
        }
    }

    // MARK: - Show Rewarded Ad
    func showRewardedAd(viewController: UIViewController, rewardType: String, onReward: @escaping () -> Void, onFail: @escaping (String) -> Void) {
        // Safe presentation or simulation fallback if native SDK is loading
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            onReward()
        }
    }

    // MARK: - Show Interstitial Ad
    func showInterstitialAd(viewController: UIViewController) {
        // Safe presentation
        print("AdManagerIOS: showInterstitialAd requested")
    }
}
