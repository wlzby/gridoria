import UIKit
import WebKit
import AudioToolbox

class ViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate, UIScrollViewDelegate {

    private var webView: WKWebView!
    private var bgImageView: UIImageView!

    override var prefersStatusBarHidden: Bool { return true }
    override var prefersHomeIndicatorAutoHidden: Bool { return true }
    override var preferredStatusBarUpdateAnimation: UIStatusBarAnimation { return .fade }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { return .all }

    // MARK: - View Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()

        // 1. Native full-screen background (fills BEHIND notch & home bar)
        setupNativeBackground()

        // 2. WKWebView on top (transparent background)
        setupWebView()

        // 3. Load game
        loadLocalGame()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        setNeedsStatusBarAppearanceUpdate()
        setNeedsUpdateOfHomeIndicatorAutoHidden()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        injectSafeAreaValues()
    }

    override func viewSafeAreaInsetsDidChange() {
        super.viewSafeAreaInsetsDidChange()
        injectSafeAreaValues()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        injectSafeAreaValues()
    }

    // MARK: - Native Background Layer
    private func setupNativeBackground() {
        // Dark forest green base — fills the entire view including behind notch/home bar
        view.backgroundColor = UIColor(red: 8/255, green: 20/255, blue: 12/255, alpha: 1.0)

        // Try to load forest background image from bundle
        let forestImageURL = Bundle.main.url(forResource: "forest_theme_bg", withExtension: "png", subdirectory: "www")
            ?? Bundle.main.url(forResource: "forest_theme_bg", withExtension: "jpg", subdirectory: "www")
            ?? Bundle.main.url(forResource: "forest_theme_bg", withExtension: "webp", subdirectory: "www")
            ?? Bundle.main.url(forResource: "forest_theme_bg", withExtension: "png")

        bgImageView = UIImageView(frame: view.bounds)
        bgImageView.contentMode = .scaleAspectFill
        bgImageView.clipsToBounds = true
        bgImageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        if let imgURL = forestImageURL, let img = UIImage(contentsOfFile: imgURL.path) {
            bgImageView.image = img
        } else {
            // Fallback gradient layer if image not found
            let gradient = CAGradientLayer()
            gradient.frame = view.bounds
            gradient.colors = [
                UIColor(red: 8/255, green: 20/255, blue: 12/255, alpha: 1.0).cgColor,
                UIColor(red: 5/255, green: 46/255, blue: 22/255, alpha: 1.0).cgColor,
                UIColor(red: 8/255, green: 20/255, blue: 12/255, alpha: 1.0).cgColor
            ]
            gradient.locations = [0.0, 0.5, 1.0]
            bgImageView.layer.addSublayer(gradient)
        }

        view.addSubview(bgImageView)
        // Stretch to ALL edges — not safe area — so it fills behind notch & home bar
        bgImageView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            bgImageView.topAnchor.constraint(equalTo: view.topAnchor),
            bgImageView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            bgImageView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            bgImageView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
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

        let wv = WKWebView(frame: view.bounds, configuration: config)
        if #available(iOS 16.4, *) { wv.isInspectable = true }
        wv.navigationDelegate = self
        wv.uiDelegate = self
        // Transparent — native bgImageView shows through
        wv.isOpaque = false
        wv.backgroundColor = .clear
        wv.scrollView.backgroundColor = .clear
        wv.scrollView.bounces = false
        wv.scrollView.isScrollEnabled = false
        wv.scrollView.panGestureRecognizer.isEnabled = false
        wv.scrollView.delegate = self
        wv.scrollView.minimumZoomScale = 1.0
        wv.scrollView.maximumZoomScale = 1.0
        wv.scrollView.bouncesZoom = false
        wv.scrollView.contentInsetAdjustmentBehavior = .never
        if #available(iOS 13.0, *) {
            wv.scrollView.automaticallyAdjustsScrollIndicatorInsets = false
        }
        for gesture in wv.scrollView.gestureRecognizers ?? [] {
            if let tap = gesture as? UITapGestureRecognizer, tap.numberOfTapsRequired == 2 {
                tap.isEnabled = false
            }
            if let pinch = gesture as? UIPinchGestureRecognizer {
                pinch.isEnabled = false
            }
        }
        wv.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(wv)
        // Fill the full view (not safeAreaLayoutGuide)
        NSLayoutConstraint.activate([
            wv.topAnchor.constraint(equalTo: view.topAnchor),
            wv.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            wv.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            wv.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        self.webView = wv
    }

    // MARK: - UIScrollViewDelegate (Block any zooming / scaling)
    func viewForZooming(in scrollView: UIScrollView) -> UIView? {
        return nil
    }

    // MARK: - Inject Native Safe Area Values
    private var lastInjectedInsets: UIEdgeInsets = .zero

    private func injectSafeAreaValues() {
        guard webView != nil else { return }
        let windowInsets = view.window?.safeAreaInsets ?? view.safeAreaInsets
        let top = max(windowInsets.top, view.safeAreaInsets.top)
        let bottom = max(windowInsets.bottom, view.safeAreaInsets.bottom)
        let left = max(windowInsets.left, view.safeAreaInsets.left)
        let right = max(windowInsets.right, view.safeAreaInsets.right)
        let currentInsets = UIEdgeInsets(top: top, left: left, bottom: bottom, right: right)
        guard currentInsets != lastInjectedInsets else { return }
        lastInjectedInsets = currentInsets

        let js = """
            (function() {
                var r = document.documentElement.style;
                r.setProperty('--sat', '\(top)px');
                r.setProperty('--sab', '\(bottom)px');
                r.setProperty('--sal', '\(left)px');
                r.setProperty('--sar', '\(right)px');
                var vh = window.innerHeight * 0.01;
                r.setProperty('--vh', vh + 'px');
            })();
        """
        webView.evaluateJavaScript(js, completionHandler: nil)
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
        injectSafeAreaValues()
        // Make HTML & body transparent so native bgImageView shows through
        let transparentJS = """
            document.documentElement.style.setProperty('background', 'transparent', 'important');
            document.body.style.setProperty('background', 'transparent', 'important');
        """
        webView.evaluateJavaScript(transparentJS, completionHandler: nil)
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
        case "setBannerVisible", "showInterstitialAd":
            break
        case "showRewardedAd":
            let rewardType = body["rewardType"] as? String ?? "reward"
            webView.evaluateJavaScript(
                "if(typeof window.onRewardedAdFailed==='function') window.onRewardedAdFailed('\(rewardType)','Ads disabled');",
                completionHandler: nil)
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
