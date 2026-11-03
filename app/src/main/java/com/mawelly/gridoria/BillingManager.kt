package com.mawelly.gridoria

import android.app.Activity
import android.content.Context
import android.util.Log
import android.webkit.WebView
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.ConsumeParams
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import java.lang.ref.WeakReference
import java.util.concurrent.ConcurrentHashMap

/**
 * 💎 Google Play Billing Manager (Play Billing Library 7.x)
 * Handles in-app purchases for diamonds, booster packs, and VIP membership.
 */
object BillingManager : PurchasesUpdatedListener {

    private const val TAG = "GridoriaBilling"

    // Product IDs (Must match Google Play Console In-App Products exactly)
    const val PRODUCT_GEMS_100 = "com.mawelly.gridoria.gems100"
    const val PRODUCT_GEMS_500 = "com.mawelly.gridoria.gems500"
    const val PRODUCT_GEMS_1200 = "com.mawelly.gridoria.gems1200"
    const val PRODUCT_GEMS_3000 = "com.mawelly.gridoria.gems3000"
    const val PRODUCT_STARTER_PACK = "com.mawelly.gridoria.starterpack"
    const val PRODUCT_VIP = "com.mawelly.gridoria.vip"

    val ALL_IN_APP_PRODUCTS = listOf(
        PRODUCT_GEMS_100,
        PRODUCT_GEMS_500,
        PRODUCT_GEMS_1200,
        PRODUCT_GEMS_3000,
        PRODUCT_STARTER_PACK,
        PRODUCT_VIP
    )

    private val CONSUMABLE_PRODUCTS = setOf(
        PRODUCT_GEMS_100,
        PRODUCT_GEMS_500,
        PRODUCT_GEMS_1200,
        PRODUCT_GEMS_3000,
        PRODUCT_STARTER_PACK
    )

    private var billingClient: BillingClient? = null
    private var webViewRef: WeakReference<WebView>? = null
    private val cachedProductDetails = ConcurrentHashMap<String, ProductDetails>()
    private var isConnecting = false
    private var isConnected = false
    private var pendingPurchaseProductId: String? = null

    fun initialize(context: Context, webView: WebView) {
        this.webViewRef = WeakReference(webView)

        if (billingClient != null && isConnected) {
            queryProductDetails()
            queryExistingPurchases()
            return
        }

        val pendingPurchasesParams = PendingPurchasesParams.newBuilder()
            .enableOneTimeProducts()
            .build()

        billingClient = BillingClient.newBuilder(context.applicationContext)
            .setListener(this)
            .enablePendingPurchases(pendingPurchasesParams)
            .build()

        connectToGooglePlay()
    }

    private fun connectToGooglePlay() {
        if (isConnecting || isConnected) return
        isConnecting = true

        billingClient?.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                isConnecting = false
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    isConnected = true
                    Log.d(TAG, "Google Play Billing setup successful.")
                    queryProductDetails()
                    queryExistingPurchases()
                } else {
                    isConnected = false
                    Log.e(TAG, "Google Play Billing setup failed: ${billingResult.responseCode} - ${billingResult.debugMessage}")
                }
            }

            override fun onBillingServiceDisconnected() {
                isConnecting = false
                isConnected = false
                Log.w(TAG, "Google Play Billing disconnected. Will retry on next purchase attempt.")
            }
        })
    }

    fun queryProductDetails() {
        val client = billingClient ?: return
        if (!isConnected) {
            connectToGooglePlay()
            return
        }

        val productList = ALL_IN_APP_PRODUCTS.map { id ->
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(id)
                .setProductType(BillingClient.ProductType.INAPP)
                .build()
        }

        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build()

        client.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                Log.d(TAG, "Queried ${productDetailsList.size} products from Google Play.")
                for (details in productDetailsList) {
                    cachedProductDetails[details.productId] = details
                    Log.d(TAG, "Cached product: ${details.productId} -> ${details.oneTimePurchaseOfferDetails?.formattedPrice}")
                }
            } else {
                Log.e(TAG, "queryProductDetailsAsync failed: ${billingResult.responseCode} - ${billingResult.debugMessage}")
            }
        }
    }

    fun buyProduct(activity: Activity, productId: String) {
        val client = billingClient
        if (client == null || !isConnected) {
            connectToGooglePlay()
            notifyPurchaseFailed(productId, "Google Play bağlantısı kuruluyor, lütfen birkaç saniye sonra tekrar deneyin.")
            return
        }

        val details = cachedProductDetails[productId]
        if (details == null) {
            Log.w(TAG, "ProductDetails not cached for $productId, querying again...")
            queryProductDetails()
            notifyPurchaseFailed(productId, "Ürün bilgileri Google Play'den henüz alınamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.")
            return
        }

        pendingPurchaseProductId = productId

        val productDetailsParamsList = listOf(
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(details)
                .build()
        )

        val flowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(productDetailsParamsList)
            .build()

        val response = client.launchBillingFlow(activity, flowParams)
        if (response.responseCode != BillingClient.BillingResponseCode.OK) {
            Log.e(TAG, "launchBillingFlow failed with responseCode: ${response.responseCode}")
            notifyPurchaseFailed(productId, "Satın alma ekranı açılamadı (${response.responseCode}).")
            pendingPurchaseProductId = null
        }
    }

    override fun onPurchasesUpdated(billingResult: BillingResult, purchases: MutableList<Purchase>?) {
        val productId = pendingPurchaseProductId ?: ""
        pendingPurchaseProductId = null

        when (billingResult.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                if (!purchases.isNullOrEmpty()) {
                    for (purchase in purchases) {
                        handlePurchase(purchase, isRestore = false)
                    }
                } else {
                    Log.w(TAG, "PurchasesUpdated OK but list is null or empty.")
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                Log.i(TAG, "User canceled purchase: $productId")
                notifyPurchaseFailed(productId, "Satın alma işlemi iptal edildi.")
            }
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> {
                Log.i(TAG, "Item already owned: $productId. Restoring entitlement...")
                queryExistingPurchases()
                notifyPurchaseSuccess(productId)
            }
            else -> {
                Log.e(TAG, "Purchase failed: ${billingResult.responseCode} - ${billingResult.debugMessage}")
                notifyPurchaseFailed(productId, billingResult.debugMessage.ifBlank { "Satın alma tamamlanamadı." })
            }
        }
    }

    private fun handlePurchase(purchase: Purchase, isRestore: Boolean) {
        if (purchase.purchaseState != Purchase.PurchaseState.PURCHASED) {
            Log.w(TAG, "Purchase state is not PURCHASED: ${purchase.purchaseState}")
            return
        }

        val client = billingClient ?: return

        for (productId in purchase.products) {
            if (CONSUMABLE_PRODUCTS.contains(productId)) {
                // Consume consumable purchases so they can be bought again
                val consumeParams = ConsumeParams.newBuilder()
                    .setPurchaseToken(purchase.purchaseToken)
                    .build()

                client.consumeAsync(consumeParams) { billingResult, _ ->
                    if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                        Log.d(TAG, "Consumable purchase consumed successfully: $productId")
                        notifyPurchaseSuccess(productId)
                    } else {
                        Log.e(TAG, "Failed to consume purchase $productId: ${billingResult.debugMessage}")
                        // Still grant items if consumed failed, or notify error
                        notifyPurchaseSuccess(productId)
                    }
                }
            } else {
                // Non-consumable (e.g. VIP)
                if (!purchase.isAcknowledged) {
                    val ackParams = AcknowledgePurchaseParams.newBuilder()
                        .setPurchaseToken(purchase.purchaseToken)
                        .build()

                    client.acknowledgePurchase(ackParams) { billingResult ->
                        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                            Log.d(TAG, "Non-consumable acknowledged successfully: $productId")
                            notifyPurchaseSuccess(productId)
                        } else {
                            Log.e(TAG, "Failed to acknowledge $productId: ${billingResult.debugMessage}")
                            notifyPurchaseSuccess(productId)
                        }
                    }
                } else {
                    Log.d(TAG, "Non-consumable already acknowledged: $productId")
                    notifyPurchaseSuccess(productId)
                }
            }
        }
    }

    fun restorePurchases() {
        val client = billingClient
        if (client == null || !isConnected) {
            connectToGooglePlay()
            notifyPurchasesRestored(emptyList())
            return
        }

        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.INAPP)
            .build()

        client.queryPurchasesAsync(params) { billingResult, purchasesList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                val restoredProductIds = mutableListOf<String>()
                for (purchase in purchasesList) {
                    if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                        restoredProductIds.addAll(purchase.products)
                        handlePurchase(purchase, isRestore = true)
                    }
                }
                Log.d(TAG, "Restored active purchases: $restoredProductIds")
                notifyPurchasesRestored(restoredProductIds)
            } else {
                Log.e(TAG, "restorePurchases query failed: ${billingResult.responseCode}")
                notifyPurchasesRestored(emptyList())
            }
        }
    }

    private fun queryExistingPurchases() {
        val client = billingClient ?: return
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.INAPP)
            .build()

        client.queryPurchasesAsync(params) { billingResult, purchasesList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                for (purchase in purchasesList) {
                    if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                        handlePurchase(purchase, isRestore = true)
                    }
                }
            }
        }
    }

    private fun notifyPurchaseSuccess(productId: String) {
        val webView = webViewRef?.get() ?: return
        webView.post {
            val js = "if (typeof game !== 'undefined' && typeof game.onPurchaseSuccess === 'function') { game.onPurchaseSuccess('$productId'); }"
            webView.evaluateJavascript(js, null)
        }
    }

    private fun notifyPurchaseFailed(productId: String, error: String) {
        val webView = webViewRef?.get() ?: return
        webView.post {
            val safeError = error.replace("'", "\\'").replace("\n", " ")
            val js = "if (typeof game !== 'undefined' && typeof game.onPurchaseFailed === 'function') { game.onPurchaseFailed('$productId', '$safeError'); }"
            webView.evaluateJavascript(js, null)
        }
    }

    private fun notifyPurchasesRestored(productIds: List<String>) {
        val webView = webViewRef?.get() ?: return
        webView.post {
            val itemsJson = productIds.joinToString(prefix = "['", separator = "','", postfix = "']")
            val js = "if (typeof game !== 'undefined' && typeof game.onPurchasesRestored === 'function') { game.onPurchasesRestored($itemsJson); }"
            webView.evaluateJavascript(js, null)
        }
    }
}

