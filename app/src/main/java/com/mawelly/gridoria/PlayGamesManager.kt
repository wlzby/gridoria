package com.mawelly.gridoria

import android.app.Activity
import android.content.Context
import android.util.Log
import com.google.android.gms.games.PlayGames
import com.google.android.gms.games.PlayGamesSdk

/**
 * 🎮 Google Play Games Services (Play Games v2 SDK)
 * Connects Gridoria to Google Play Games for:
 * - Automatic background cloud sign-in
 * - Cloud Leaderboard rankings (Dünya Çapı Liderlik Sıralaması)
 * - Play Games Achievements (XP & Rozet Kazanımı)
 * - Player identity synchronization
 */
object PlayGamesManager {

    private const val TAG = "GridoriaPlayGames"
    private const val RC_LEADERBOARDS = 9002
    private const val RC_ACHIEVEMENTS = 9003

    private var isAuthenticated = false
    private var isInitialized = false

    fun initialize(context: Context) {
        if (isInitialized) return
        try {
            PlayGamesSdk.initialize(context)
            isInitialized = true
            Log.d(TAG, "PlayGamesSdk initialized successfully.")
        } catch (e: Exception) {
            Log.e(TAG, "PlayGamesSdk init error: ${e.message}", e)
        }
    }

    fun checkAuthentication(activity: Activity, onComplete: ((Boolean) -> Unit)? = null) {
        try {
            val signInClient = PlayGames.getGamesSignInClient(activity)
            signInClient.isAuthenticated.addOnCompleteListener { task ->
                val authenticated = task.isSuccessful && task.result?.isAuthenticated == true
                isAuthenticated = authenticated
                Log.d(TAG, "Play Games isAuthenticated: $authenticated")
                if (authenticated) {
                    fetchPlayerProfile(activity)
                }
                onComplete?.invoke(authenticated)
            }
        } catch (e: Exception) {
            Log.w(TAG, "checkAuthentication failed: ${e.message}")
            onComplete?.invoke(false)
        }
    }

    private fun fetchPlayerProfile(activity: Activity) {
        try {
            PlayGames.getPlayersClient(activity).currentPlayer.addOnSuccessListener { player ->
                Log.d(TAG, "Logged in as Play Games player: ${player.displayName} (ID: ${player.playerId})")
            }.addOnFailureListener { e ->
                Log.w(TAG, "fetchPlayerProfile failed: ${e.message}")
            }
        } catch (e: Exception) {
            Log.w(TAG, "fetchPlayerProfile error: ${e.message}")
        }
    }

    fun submitHighScore(activity: Activity, score: Long, leaderboardId: String? = null) {
        if (score <= 0) return
        try {
            val targetId = leaderboardId?.ifBlank { null }
            if (targetId != null) {
                PlayGames.getLeaderboardsClient(activity).submitScore(targetId, score)
                Log.d(TAG, "High score $score submitted to leaderboard $targetId")
            } else {
                Log.d(TAG, "Play Games score $score recorded (Leaderboard ID not configured yet in Play Console).")
            }
        } catch (e: Exception) {
            Log.w(TAG, "submitHighScore error: ${e.message}")
        }
    }

    fun showLeaderboards(activity: Activity, leaderboardId: String? = null) {
        try {
            val client = PlayGames.getLeaderboardsClient(activity)
            val intentTask = if (!leaderboardId.isNullOrBlank()) {
                client.getLeaderboardIntent(leaderboardId)
            } else {
                client.allLeaderboardsIntent
            }

            intentTask.addOnSuccessListener { intent ->
                activity.startActivityForResult(intent, RC_LEADERBOARDS)
            }.addOnFailureListener { e ->
                Log.w(TAG, "showLeaderboards failed: ${e.message}")
            }
        } catch (e: Exception) {
            Log.w(TAG, "showLeaderboards error: ${e.message}")
        }
    }

    fun unlockAchievement(activity: Activity, achievementId: String) {
        if (achievementId.isBlank()) return
        try {
            PlayGames.getAchievementsClient(activity).unlock(achievementId)
            Log.d(TAG, "Achievement $achievementId unlock requested.")
        } catch (e: Exception) {
            Log.w(TAG, "unlockAchievement error: ${e.message}")
        }
    }

    fun showAchievements(activity: Activity) {
        try {
            PlayGames.getAchievementsClient(activity).achievementsIntent.addOnSuccessListener { intent ->
                activity.startActivityForResult(intent, RC_ACHIEVEMENTS)
            }.addOnFailureListener { e ->
                Log.w(TAG, "showAchievements failed: ${e.message}")
            }
        } catch (e: Exception) {
            Log.w(TAG, "showAchievements error: ${e.message}")
        }
    }
}

