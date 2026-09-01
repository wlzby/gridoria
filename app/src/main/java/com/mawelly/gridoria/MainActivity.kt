package com.mawelly.gridoria

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.core.view.WindowCompat

class MainActivity : Activity() {

    private lateinit var webView: WebView
    private var bannerContainer: android.widget.FrameLayout? = null
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private val FILE_CHOOSER_REQUEST_CODE = 1001
    @JvmField var isBannerEnabled: Boolean = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            // Initialize AdMob Engine
            AdManager.initialize(this)

            // Set modern blue splash background for window to eliminate white flash
            window.decorView.setBackgroundColor(Color.parseColor("#0b1536"))
            window.setFlags(
                android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
            )

            webView = WebView(this).apply {
                setBackgroundColor(Color.TRANSPARENT)
                setLayerType(View.LAYER_TYPE_HARDWARE, null)
                overScrollMode = View.OVER_SCROLL_NEVER
                isHapticFeedbackEnabled = true
                isVerticalScrollBarEnabled = false
                isHorizontalScrollBarEnabled = false
                isNestedScrollingEnabled = false

                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    allowFileAccess = true
                    allowContentAccess = true
                    loadsImagesAutomatically = true
                    mediaPlaybackRequiresUserGesture = false
                    cacheMode = WebSettings.LOAD_DEFAULT
                    useWideViewPort = true
                    loadWithOverviewMode = true
                    layoutAlgorithm = WebSettings.LayoutAlgorithm.NORMAL
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        offscreenPreRaster = true
                    }
                }

                // Add JavaScript Bridge Interface
                addJavascriptInterface(WebAppInterface(), "AndroidBridge")

                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        hideSystemUI()
                    }
                }

                webChromeClient = object : WebChromeClient() {
                    override fun onShowFileChooser(
                        webView: WebView?,
                        filePathCallback: ValueCallback<Array<Uri>>?,
                        fileChooserParams: FileChooserParams?
                    ): Boolean {
                        this@MainActivity.filePathCallback?.onReceiveValue(null)
                        this@MainActivity.filePathCallback = filePathCallback

                        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                            addCategory(Intent.CATEGORY_OPENABLE)
                            type = "image/*"
                        }
                        try {
                            startActivityForResult(Intent.createChooser(intent, "Fotoğraf Seç"), FILE_CHOOSER_REQUEST_CODE)
                        } catch (e: Exception) {
                            this@MainActivity.filePathCallback = null
                            return false
                        }
                        return true
                    }
                }
            }

            setContentView(webView)
            webView.loadUrl("file:///android_asset/www/index.html")

        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (filePathCallback == null) return
            val results: Array<Uri>? = if (resultCode == RESULT_OK && data != null) {
                data.data?.let { arrayOf(it) } ?: data.clipData?.let { clip ->
                    Array(clip.itemCount) { i -> clip.getItemAt(i).uri }
                }
            } else null
            filePathCallback?.onReceiveValue(results)
            filePathCallback = null
        }
    }

    inner class WebAppInterface {
        @Suppress("DEPRECATION")
        private val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator

        @JavascriptInterface
        fun setBannerVisible(visible: Boolean) {
            isBannerEnabled = false
        }

        @JavascriptInterface
        fun showRewardedAd(rewardType: String) {
            runOnUiThread {
                AdManager.showRewardedAd(
                    activity = this@MainActivity,
                    rewardType = rewardType,
                    onRewardEarned = {
                        webView.evaluateJavascript("if (typeof window.onRewardedAdSuccess === 'function') window.onRewardedAdSuccess('$rewardType');", null)
                    },
                    onDismissed = {
                        webView.evaluateJavascript("if (typeof window.onRewardedAdDismissed === 'function') window.onRewardedAdDismissed('$rewardType');", null)
                    },
                    onFailed = { error ->
                        webView.evaluateJavascript("if (typeof window.onRewardedAdFailed === 'function') window.onRewardedAdFailed('$rewardType', '$error');", null)
                    }
                )
            }
        }

        @JavascriptInterface
        fun showInterstitialAd() {
            runOnUiThread {
                AdManager.showInterstitialAd(this@MainActivity)
            }
        }

        @JavascriptInterface
        fun isRewardedAdReady(): Boolean = AdManager.isRewardedAdReady()

        @JavascriptInterface
        fun triggerHaptic(type: String) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val effect = when (type) {
                        "light" -> VibrationEffect.createOneShot(15, 80)
                        "medium" -> VibrationEffect.createOneShot(30, 150)
                        "heavy" -> VibrationEffect.createOneShot(55, 230)
                        else -> VibrationEffect.createOneShot(25, 120)
                    }
                    vibrator?.vibrate(effect)
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(30)
                }
            } catch (_: Exception) {}
        }
    }

    override fun onResume() {
        super.onResume()
        try {
            if (::webView.isInitialized) {
                webView.onResume()
                webView.resumeTimers()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        hideSystemUI()
    }

    override fun onPause() {
        try {
            if (::webView.isInitialized) {
                webView.onPause()
                webView.pauseTimers()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        super.onPause()
    }

    override fun onDestroy() {
        try {
            if (::webView.isInitialized) {
                (webView.parent as? ViewGroup)?.removeView(webView)
                webView.stopLoading()
                webView.loadUrl("about:blank")
                webView.clearHistory()
                webView.destroy()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        super.onDestroy()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUI()
        }
    }

    private fun hideSystemUI() {
        try {
            WindowCompat.setDecorFitsSystemWindows(window, false)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                window.insetsController?.let { controller ->
                    controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                    controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                }
            } else {
                @Suppress("DEPRECATION")
                window.decorView.systemUiVisibility = (
                    View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @Deprecated("Deprecated in Java")
    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (::webView.isInitialized) {
            webView.evaluateJavascript("typeof window.handleAndroidBack === 'function' ? window.handleAndroidBack() : false") { result ->
                val handled = result != null && (result == "true" || result == "\"true\"")
                if (!handled) {
                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        super.onBackPressed()
                    }
                }
            }
        } else {
            super.onBackPressed()
        }
    }
}