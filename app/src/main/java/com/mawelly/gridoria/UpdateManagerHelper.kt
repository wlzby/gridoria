package com.mawelly.gridoria

import android.app.Activity
import android.util.Log
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability

/**
 * 🔄 Google Play In-App Updates Helper
 * Automatically detects when a new version of Gridoria is published on Google Play
 * and prompts players to update smoothly without leaving the app.
 */
object UpdateManagerHelper {

    private const val TAG = "GridoriaUpdate"
    private const val UPDATE_REQUEST_CODE = 9001

    private var appUpdateManager: AppUpdateManager? = null
    private var installStateUpdatedListener: InstallStateUpdatedListener? = null

    fun initialize(activity: Activity) {
        try {
            val manager = AppUpdateManagerFactory.create(activity)
            appUpdateManager = manager

            installStateUpdatedListener = InstallStateUpdatedListener { state ->
                if (state.installStatus() == InstallStatus.DOWNLOADED) {
                    Log.d(TAG, "In-app update downloaded. Ready to complete.")
                    // When the flexible update download completes, prompt or complete
                    manager.completeUpdate()
                }
            }
            installStateUpdatedListener?.let { manager.registerListener(it) }

            checkForUpdates(activity)
        } catch (e: Exception) {
            Log.e(TAG, "UpdateManagerHelper init error: ${e.message}", e)
        }
    }

    fun checkForUpdates(activity: Activity) {
        val manager = appUpdateManager ?: return
        manager.appUpdateInfo.addOnSuccessListener { appUpdateInfo: AppUpdateInfo ->
            if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                && appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)
            ) {
                try {
                    manager.startUpdateFlowForResult(
                        appUpdateInfo,
                        AppUpdateType.FLEXIBLE,
                        activity,
                        UPDATE_REQUEST_CODE
                    )
                    Log.d(TAG, "Started Flexible in-app update flow.")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to start in-app update flow: ${e.message}", e)
                }
            }
        }.addOnFailureListener { e ->
            Log.d(TAG, "No update available or check failed: ${e.message}")
        }
    }

    fun onDestroy() {
        installStateUpdatedListener?.let { listener ->
            appUpdateManager?.unregisterListener(listener)
        }
    }
}

