import UIKit
import WebKit
import AVFoundation
import AudioToolbox
import GoogleMobileAds

class ViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate, BannerViewDelegate, FullScreenContentDelegate {

    private var webView: WKWebView!
    private var bannerView: BannerView?
    private var bannerHeightConstraint: NSLayoutConstraint?
    private var interstitialAd: InterstitialAd?
    private var rewardedAd: RewardedAd?
    private var pendingRewardType: String = ""

    // ── AdMob Unit IDs (Replace with your live production AdMob iOS IDs) ──
    private let BANNER_AD_UNIT_ID = "ca-app-pub-3940256099942544/2934735716" // Test ID
    private let INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-3940256099942544/4411468910" // Test ID
    private let REWARDED_AD_UNIT_ID = "ca-app-pub-3940256099942544/1712485313" // Test ID

    override var prefersStatusBarHidden: Bool {
        return true
    }

    override var prefersHomeIndicatorAutoHidden: Bool {
        return true
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 11/255, green: 21/255, blue: 54/255, alpha: 1.0)

        setupWebView()
        setupBannerView()
        loadLocalGame()
        loadInterstitialAd()
        loadRewardedAd()
    }

    // MARK: - 🌐 Setup WKWebView
    private func setupWebView() {
        let contentController = WKUserContentController()
        contentController.add(self, name: "iosBridge")

        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.defaultWebpagePreferences.allowsContentJavaScript = true

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.backgroundColor = .clear
        webView.isOpaque = false
        webView.scrollView.bounces = false
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(webView)
    }

    // MARK: - 📢 Setup Banner View
    private func setupBannerView() {
        bannerView = BannerView(adSize: AdSizeBanner)
        guard let bannerView = bannerView else { return }

        bannerView.adUnitID = BANNER_AD_UNIT_ID
        bannerView.rootViewController = self
        bannerView.delegate = self
        bannerView.translatesAutoresizingMaskIntoConstraints = false
        bannerView.isHidden = true

        view.addSubview(bannerView)

        // Auto Layout
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: bannerView.topAnchor),

            bannerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            bannerView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            bannerView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor)
        ])

        bannerHeightConstraint = bannerView.heightAnchor.constraint(equalToConstant: 0)
        bannerHeightConstraint?.isActive = true

        bannerView.load(Request())
    }

    // MARK: - 📁 Load Game from Local Assets
    private func loadLocalGame() {
        let bundleURL = Bundle.main.bundleURL
        let resourceURL = Bundle.main.resourceURL ?? bundleURL
        
        var targetURL: URL?

        // 1. Check in 'www' subfolder
        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") {
            targetURL = url
        } else if let url = Bundle.main.url(forResource: "index", withExtension: "html") {
            targetURL = url
        } else {
            // Recursive scan
            let fileManager = FileManager.default
            if let enumerator = fileManager.enumerator(at: resourceURL, includingPropertiesForKeys: nil) {
                for case let fileURL as URL in enumerator {
                    if fileURL.lastPathComponent == "index.html" {
                        targetURL = fileURL
                        break
                    }
                }
            }
        }

        if let htmlURL = targetURL {
            print("🚀 Loading Gridoria HTML: \(htmlURL.path)")
            webView.loadFileURL(htmlURL, allowingReadAccessTo: resourceURL)
        } else {
            print("⚠️ Error: index.html could not be found in iOS bundle.")
        }
    }

    // MARK: - 🌐 WKNavigationDelegate
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("✅ Gridoria WKWebView finished loading successfully.")
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("❌ Gridoria WKWebView failed navigation: \(error.localizedDescription)")
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("❌ Gridoria WKWebView failed provisional navigation: \(error.localizedDescription)")
    }

    // MARK: - 🌉 WKScriptMessageHandler (Bridge with JavaScript)
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "iosBridge", let body = message.body as? [String: Any] else { return }
        let action = body["action"] as? String ?? ""

        switch action {
        case "haptic":
            let type = body["type"] as? String ?? "medium"
            triggerHaptic(type: type)

        case "setBannerVisible":
            let visible = body["visible"] as? Bool ?? false
            setBannerVisible(visible)

        case "showRewardedAd":
            let rewardType = body["rewardType"] as? String ?? "reward"
            showRewardedAd(rewardType: rewardType)

        case "showInterstitialAd":
            showInterstitialAd()

        default:
            print("Unknown bridge action: \(action)")
        }
    }

    // MARK: - 📳 Haptic Engine (Taptic Feedback)
    private func triggerHaptic(type: String) {
        DispatchQueue.main.async {
            switch type {
            case "light":
                let generator = UIImpactFeedbackGenerator(style: .light)
                generator.prepare()
                generator.impactOccurred()
            case "heavy":
                let generator = UIImpactFeedbackGenerator(style: .heavy)
                generator.prepare()
                generator.impactOccurred()
            case "success":
                let generator = UINotificationFeedbackGenerator()
                generator.prepare()
                generator.notificationOccurred(.success)
            default:
                let generator = UIImpactFeedbackGenerator(style: .medium)
                generator.prepare()
                generator.impactOccurred()
            }
        }
    }

    // MARK: - 📢 Banner Visibility Control
    private func setBannerVisible(_ visible: Bool) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let banner = self.bannerView else { return }
            banner.isHidden = !visible
            self.bannerHeightConstraint?.constant = visible ? 50 : 0
            self.view.layoutIfNeeded()
        }
    }

    // MARK: - 🎬 Interstitial Ads
    private func loadInterstitialAd() {
        let request = Request()
        InterstitialAd.load(with: INTERSTITIAL_AD_UNIT_ID, request: request) { [weak self] ad, error in
            if let error = error {
                print("Interstitial load failed: \(error.localizedDescription)")
                return
            }
            self?.interstitialAd = ad
            self?.interstitialAd?.fullScreenContentDelegate = self
        }
    }

    private func showInterstitialAd() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let interstitial = self.interstitialAd else {
                self?.loadInterstitialAd()
                return
            }
            interstitial.present(from: self)
        }
    }

    // MARK: - 🎁 Rewarded Ads
    private func loadRewardedAd() {
        let request = Request()
        RewardedAd.load(with: REWARDED_AD_UNIT_ID, request: request) { [weak self] ad, error in
            if let error = error {
                print("Rewarded ad load failed: \(error.localizedDescription)")
                return
            }
            self?.rewardedAd = ad
            self?.rewardedAd?.fullScreenContentDelegate = self
        }
    }

    private func showRewardedAd(rewardType: String) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let rewardedAd = self.rewardedAd else {
                self?.webView.evaluateJavaScript("if (typeof window.onRewardedAdFailed === 'function') window.onRewardedAdFailed('\(rewardType)', 'Ad not ready');", completionHandler: nil)
                self?.loadRewardedAd()
                return
            }

            self.pendingRewardType = rewardType
            rewardedAd.present(from: self) { [weak self] in
                guard let self = self else { return }
                let type = self.pendingRewardType
                self.webView.evaluateJavaScript("if (typeof window.onRewardedAdSuccess === 'function') window.onRewardedAdSuccess('\(type)');", completionHandler: nil)
            }
        }
    }

    // MARK: - 🔄 FullScreenContentDelegate
    func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        if ad is RewardedAd {
            let type = pendingRewardType
            webView.evaluateJavaScript("if (typeof window.onRewardedAdDismissed === 'function') window.onRewardedAdDismissed('\(type)');", completionHandler: nil)
            loadRewardedAd()
        } else if ad is InterstitialAd {
            loadInterstitialAd()
        }
    }

    func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        if ad is RewardedAd {
            let type = pendingRewardType
            webView.evaluateJavaScript("if (typeof window.onRewardedAdFailed === 'function') window.onRewardedAdFailed('\(type)', '\(error.localizedDescription)');", completionHandler: nil)
            loadRewardedAd()
        } else if ad is InterstitialAd {
            loadInterstitialAd()
        }
    }
}
