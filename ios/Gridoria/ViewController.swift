import UIKit
import WebKit
import AudioToolbox

class ViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {

    private var webView: WKWebView!

    override var prefersStatusBarHidden: Bool { return true }
    override var prefersHomeIndicatorAutoHidden: Bool { return true }

    // MARK: - View Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 8/255, green: 20/255, blue: 12/255, alpha: 1.0)
        edgesForExtendedLayout = .all
        extendedLayoutIncludesOpaqueBars = true
        setupWebView()
        loadLocalGame()
    }

    // Inject REAL native safe area pixel values after layout is finalized
    override func viewSafeAreaInsetsDidChange() {
        super.viewSafeAreaInsetsDidChange()
        injectNativeSafeAreaInsets()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        injectNativeSafeAreaInsets()
    }

    // MARK: - Inject native safe area into CSS
    private func injectNativeSafeAreaInsets() {
        let top = view.safeAreaInsets.top
        let bottom = view.safeAreaInsets.bottom
        let left = view.safeAreaInsets.left
        let right = view.safeAreaInsets.right

        let js = """
            (function() {
                var r = document.documentElement;
                r.style.setProperty('--sat', '\(top)px');
                r.style.setProperty('--sab', '\(bottom)px');
                r.style.setProperty('--sal', '\(left)px');
                r.style.setProperty('--sar', '\(right)px');
                // Also update --vh based on real inner height
                var vh = window.innerHeight * 0.01;
                r.style.setProperty('--vh', vh + 'px');
            })();
        """
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    // MARK: - WKWebView Setup
    private func setupWebView() {
        let contentController = WKUserContentController()
        contentController.add(self, name: "iosBridge")

        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.defaultWebpagePreferences.allowsContentJavaScript = true

        // WKWebView must fill the ENTIRE screen including safe areas
        let wv = WKWebView(frame: UIScreen.main.bounds, configuration: config)
        if #available(iOS 16.4, *) { wv.isInspectable = true }
        wv.navigationDelegate = self
        wv.uiDelegate = self
        // Forest dark green matches the game background
        wv.backgroundColor = UIColor(red: 8/255, green: 20/255, blue: 12/255, alpha: 1.0)
        wv.isOpaque = true  // opaque so background color shows immediately
        wv.scrollView.bounces = false
        wv.scrollView.isScrollEnabled = false
        wv.scrollView.contentInsetAdjustmentBehavior = .never
        if #available(iOS 13.0, *) {
            wv.scrollView.automaticallyAdjustsScrollIndicatorInsets = false
        }
        wv.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(wv)
        // Pin to ROOT view edges — NOT safeAreaLayoutGuide
        // This makes the WebView extend behind notch and home indicator
        NSLayoutConstraint.activate([
            wv.topAnchor.constraint(equalTo: view.topAnchor),
            wv.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            wv.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            wv.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        self.webView = wv
    }

    // MARK: - Load Game HTML
    private func loadLocalGame() {
        let bundle = Bundle.main
        let fm = FileManager.default

        let candidates: [URL?] = [
            bundle.url(forResource: "index", withExtension: "html", subdirectory: "www"),
            bundle.url(forResource: "index", withExtension: "html"),
            bundle.resourceURL?.appendingPathComponent("www/index.html"),
            bundle.bundleURL.appendingPathComponent("www/index.html"),
            bundle.bundleURL.appendingPathComponent("index.html")
        ]

        var htmlURL: URL?
        for candidate in candidates {
            if let url = candidate, fm.fileExists(atPath: url.path) {
                htmlURL = url
                break
            }
        }

        if htmlURL == nil, let resourceURL = bundle.resourceURL {
            let enumerator = fm.enumerator(at: resourceURL, includingPropertiesForKeys: nil)
            while let file = enumerator?.nextObject() as? URL {
                if file.lastPathComponent == "index.html" {
                    htmlURL = file
                    break
                }
            }
        }

        guard let url = htmlURL else {
            print("❌ FATAL: index.html not found in bundle at \(bundle.bundlePath)")
            return
        }

        print("✅ Loading game from: \(url.path)")
        webView.loadFileURL(url, allowingReadAccessTo: bundle.bundleURL)
    }

    // MARK: - WKNavigationDelegate
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("✅ WebView loaded successfully")
        // Inject actual native safe area values now that page is ready
        injectNativeSafeAreaInsets()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("❌ WebView navigation failed: \(error)")
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("❌ WebView provisional navigation failed: \(error)")
    }

    // MARK: - JS Bridge
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "iosBridge",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else { return }

        switch action {
        case "haptic":
            triggerHaptic(type: body["type"] as? String ?? "medium")
        case "setBannerVisible":
            break
        case "showRewardedAd":
            let rewardType = body["rewardType"] as? String ?? "reward"
            webView.evaluateJavaScript(
                "if(typeof window.onRewardedAdFailed==='function') window.onRewardedAdFailed('\(rewardType)','Ads disabled');",
                completionHandler: nil)
        case "showInterstitialAd":
            break
        default:
            print("Bridge: unknown action '\(action)'")
        }
    }

    // MARK: - Haptic
    private func triggerHaptic(type: String) {
        switch type {
        case "light":   UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case "heavy":   UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        case "success": UINotificationFeedbackGenerator().notificationOccurred(.success)
        default:        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        }
    }
}
