import UIKit
import WebKit
import AudioToolbox

// ──────────────────────────────────────────────
// Gridoria ViewController – Minimal, crash-safe
// AdMob removed to isolate iOS launch issues
// ──────────────────────────────────────────────
class ViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {

    private var webView: WKWebView!

    // MARK: - Status Bar / Home Indicator
    override var prefersStatusBarHidden: Bool { return true }
    override var prefersHomeIndicatorAutoHidden: Bool { return true }

    // MARK: - View Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 8/255, green: 20/255, blue: 12/255, alpha: 1.0)
        // Extend layout under status bar and home indicator
        edgesForExtendedLayout = .all
        extendedLayoutIncludesOpaqueBars = true
        setupWebView()
        loadLocalGame()
    }

    // MARK: - WKWebView Setup
    private func setupWebView() {
        let contentController = WKUserContentController()
        contentController.add(self, name: "iosBridge")

        // Inject real safe area values as CSS variables before page loads
        let safeAreaScript = """
            (function() {
                function updateSafeArea() {
                    var style = document.documentElement.style;
                    style.setProperty('--sat', 'env(safe-area-inset-top, 0px)');
                    style.setProperty('--sab', 'env(safe-area-inset-bottom, 0px)');
                    style.setProperty('--sal', 'env(safe-area-inset-left, 0px)');
                    style.setProperty('--sar', 'env(safe-area-inset-right, 0px)');
                }
                updateSafeArea();
                window.addEventListener('resize', updateSafeArea);
            })();
        """
        let userScript = WKUserScript(source: safeAreaScript,
                                      injectionTime: .atDocumentStart,
                                      forMainFrameOnly: true)
        contentController.addUserScript(userScript)

        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.defaultWebpagePreferences.allowsContentJavaScript = true

        let wv = WKWebView(frame: view.bounds, configuration: config)
        if #available(iOS 16.4, *) { wv.isInspectable = true }
        wv.navigationDelegate = self
        wv.uiDelegate = self
        wv.backgroundColor = UIColor(red: 8/255, green: 20/255, blue: 12/255, alpha: 1.0)
        wv.isOpaque = false
        wv.scrollView.bounces = false
        wv.scrollView.isScrollEnabled = false
        // Critical: never adjust insets so WebView fills under notch and home bar
        wv.scrollView.contentInsetAdjustmentBehavior = .never
        if #available(iOS 13.0, *) {
            wv.scrollView.automaticallyAdjustsScrollIndicatorInsets = false
        }
        wv.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(wv)
        // Pin to view edges (NOT safeAreaLayoutGuide) so it goes under notch & home bar
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

        // All possible locations for index.html
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

        // Fallback: scan entire bundle
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

        print("✅ Loading: \(url.path)")
        webView.loadFileURL(url, allowingReadAccessTo: bundle.bundleURL)
    }

    // MARK: - WKNavigationDelegate
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("✅ WebView loaded successfully")
        // Inject safe area values after load too (for CSS env() fallback)
        let js = """
            document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top, 0px)');
            document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom, 0px)');
            document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left, 0px)');
            document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right, 0px)');
        """
        webView.evaluateJavaScript(js, completionHandler: nil)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("❌ WebView navigation failed: \(error)")
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("❌ WebView provisional navigation failed: \(error)")
    }

    // MARK: - JS Bridge (WKScriptMessageHandler)
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "iosBridge",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else { return }

        switch action {
        case "haptic":
            triggerHaptic(type: body["type"] as? String ?? "medium")
        case "setBannerVisible":
            break // Ads disabled in this build
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
        case "light":
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case "heavy":
            UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        case "success":
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        default:
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        }
    }
}
