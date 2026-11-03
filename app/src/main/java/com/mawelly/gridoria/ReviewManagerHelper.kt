package com.mawelly.gridoria

import android.app.Activity
import android.util.Log
import com.google.android.play.core.review.ReviewInfo
import com.google.android.play.core.review.ReviewManager
import com.google.android.play.core.review.ReviewManagerFactory

/**
 * ⭐ Google Play In-App Review Helper
 * Prompts the native Google Play 5-star rating bottom sheet directly inside the game.
 * Massively boosts Google Play Store ranking, ASO visibility, and organic downloads.
 */
object ReviewManagerHelper {

    private const val TAG = "GridoriaReview"
    private var reviewManager: ReviewManager? = null
    private var preloadedReviewInfo: ReviewInfo? = null

    fun initialize(activity: Activity) {
        try {
            reviewManager = ReviewManagerFactory.create(activity)
            preloadReviewFlow()
        } catch (e: Exception) {
            Log.e(TAG, "ReviewManager init error: ${e.message}", e)
        }
    }

    private fun preloadReviewFlow() {
        val manager = reviewManager ?: return
        manager.requestReviewFlow().addOnCompleteListener { task ->
            if (task.isSuccessful) {
                preloadedReviewInfo = task.result
                Log.d(TAG, "In-App ReviewInfo preloaded successfully.")
            } else {
                Log.w(TAG, "In-App ReviewInfo preload failed: ${task.exception?.message}")
            }
        }
    }

    fun requestInAppReview(activity: Activity) {
        val manager = reviewManager ?: ReviewManagerFactory.create(activity).also { reviewManager = it }
        val cached = preloadedReviewInfo

        if (cached != null) {
            launchFlow(activity, manager, cached)
            preloadedReviewInfo = null
            preloadReviewFlow()
        } else {
            manager.requestReviewFlow().addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    val reviewInfo = task.result
                    launchFlow(activity, manager, reviewInfo)
                } else {
                    Log.w(TAG, "requestReviewFlow failed: ${task.exception?.message}")
                }
            }
        }
    }

    private fun launchFlow(activity: Activity, manager: ReviewManager, reviewInfo: ReviewInfo) {
        manager.launchReviewFlow(activity, reviewInfo).addOnCompleteListener {
            // The flow has finished. The API does not indicate whether the user
            // reviewed or not, or even whether the dialog was shown (rate-limiting is handled by Google).
            Log.d(TAG, "In-App Review flow finished.")
        }
    }
}

