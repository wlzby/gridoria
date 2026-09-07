package com.mawelly.gridoria

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import java.util.Calendar

class NotificationReceiver : BroadcastReceiver() {

    companion object {
        const val CHANNEL_ID = "gridoria_daily_channel"
        const val CHANNEL_NAME = "Gridoria Günlük Bildirimler"
        const val ACTION_DAILY_NOTIFICATION = "com.mawelly.gridoria.ACTION_DAILY_NOTIFICATION"
        const val REQUEST_CODE = 2048

        private val MESSAGES = listOf(
            "🎁 Günlük 100 Elmas hediyen hazır! Hemen gir ve ödülünü topla!",
            "🔥 Yeni bir rekor kırabilir misin? Bugün 2048 taşını patlatma sırası sende!",
            "🧠 Günde 20 dakika Gridoria oyna, zihnini ve hafızanı zinde tut!",
            "⚡ Ateş Modu (Fever Mode) hazır! Hemen oyuna gir ve komboları patlat!"
        )

        fun scheduleNextNotification(context: Context) {
            try {
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
                val intent = Intent(context, NotificationReceiver::class.java).apply {
                    action = ACTION_DAILY_NOTIFICATION
                }

                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                } else {
                    PendingIntent.FLAG_UPDATE_CURRENT
                }

                val pendingIntent = PendingIntent.getBroadcast(context, REQUEST_CODE, intent, flags)

                // Schedule for 19:30 every day
                val calendar = Calendar.getInstance().apply {
                    set(Calendar.HOUR_OF_DAY, 19)
                    set(Calendar.MINUTE, 30)
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                    if (timeInMillis <= System.currentTimeMillis()) {
                        add(Calendar.DAY_OF_YEAR, 1)
                    }
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, calendar.timeInMillis, pendingIntent)
                } else {
                    alarmManager.setInexactRepeating(
                        AlarmManager.RTC_WAKEUP,
                        calendar.timeInMillis,
                        AlarmManager.INTERVAL_DAY,
                        pendingIntent
                    )
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            scheduleNextNotification(context)
            return
        }

        showNotification(context)
        scheduleNextNotification(context)
    }

    private fun showNotification(context: Context) {
        try {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Gridoria günlük hatırlatma ve ödül bildirimleri"
                    enableVibration(true)
                }
                notificationManager.createNotificationChannel(channel)
            }

            val launchIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            val pendingIntent = PendingIntent.getActivity(context, 0, launchIntent, flags)

            // Select rotating message based on day of year
            val dayIndex = Calendar.getInstance().get(Calendar.DAY_OF_YEAR) % MESSAGES.size
            val bodyText = MESSAGES[dayIndex]

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("Gridoria 2048 🌲")
                .setContentText(bodyText)
                .setStyle(NotificationCompat.BigTextStyle().bigText(bodyText))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .build()

            notificationManager.notify(REQUEST_CODE, notification)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
