package com.samanwaya.screenassistant

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import android.util.DisplayMetrics
import androidx.core.app.NotificationCompat
import androidx.core.content.getSystemService
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.cancel

class ScreenCaptureService : Service() {
    private val scope = CoroutineScope(Dispatchers.Default + Job())
    private var projection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var lastQuestion = ""
    private var ocrJob: Job? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
        if (projection == null) {
            val data = intent?.getParcelableExtraCompat<Intent>(EXTRA_RESULT_DATA)
            if (data == null) {
                stopSelf()
                return START_NOT_STICKY
            }
            startCapture(data)
        }
        return START_NOT_STICKY
    }

    private fun startCapture(resultData: Intent) {
        val manager = getSystemService<MediaProjectionManager>() ?: return
        projection = manager.getMediaProjection(Activity.RESULT_OK, resultData)
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        (getSystemService(WINDOW_SERVICE) as android.view.WindowManager)
            .defaultDisplay.getRealMetrics(metrics)

        imageReader = ImageReader.newInstance(
            metrics.widthPixels,
            metrics.heightPixels,
            android.graphics.PixelFormat.RGBA_8888,
            2
        )
        virtualDisplay = projection?.createVirtualDisplay(
            "ScreenQuestionAssistant",
            metrics.widthPixels,
            metrics.heightPixels,
            metrics.densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface,
            null,
            null
        )

        ocrJob = scope.launch {
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
            while (isActive) {
                imageReader?.acquireLatestImage()?.use { image ->
                    val bitmap = imageToBitmap(image)
                    val text = recognizer.process(InputImage.fromBitmap(bitmap, 0)).await().text
                    findQuestion(text)?.let { question ->
                        if (question != lastQuestion) {
                            lastQuestion = question
                            TelegramClient.sendQuestion(
                                getSharedPreferences(PREFS, MODE_PRIVATE)
                                    .getString(KEY_BOT_TOKEN, "").orEmpty(),
                                getSharedPreferences(PREFS, MODE_PRIVATE)
                                    .getString(KEY_CHAT_ID, "").orEmpty(),
                                question
                            )
                        }
                    }
                    bitmap.recycle()
                }
                delay(CAPTURE_INTERVAL_MS)
            }
            recognizer.close()
        }
    }

    private fun findQuestion(text: String): String? {
        val normalized = text.lines()
            .map(String::trim)
            .filter(String::isNotBlank)
            .joinToString(" ")
        if (normalized.length < MIN_QUESTION_LENGTH) return null
        val questionMark = normalized.indexOf('?')
        if (questionMark >= MIN_QUESTION_LENGTH - 1) {
            return normalized.substring(0, questionMark + 1).take(MAX_QUESTION_LENGTH)
        }
        val startsLikeQuestion = QUESTION_STARTERS.any {
            normalized.startsWith("$it ", ignoreCase = true)
        }
        return if (startsLikeQuestion) normalized.take(MAX_QUESTION_LENGTH) else null
    }

    private fun imageToBitmap(image: android.media.Image): Bitmap {
        val plane = image.planes[0]
        val buffer = plane.buffer
        val pixelStride = plane.pixelStride
        val rowStride = plane.rowStride
        val rowPadding = rowStride - pixelStride * image.width
        val bitmap = Bitmap.createBitmap(
            image.width + rowPadding / pixelStride,
            image.height,
            Bitmap.Config.ARGB_8888
        )
        bitmap.copyPixelsFromBuffer(buffer)
        return Bitmap.createBitmap(bitmap, 0, 0, image.width, image.height).also {
            bitmap.recycle()
        }
    }

    override fun onDestroy() {
        ocrJob?.cancel()
        virtualDisplay?.release()
        imageReader?.close()
        projection?.stop()
        scope.cancel()
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        val manager = getSystemService<NotificationManager>() ?: return
        if (Build.VERSION.SDK_INT >= 26) {
            manager.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "Screen monitoring", NotificationManager.IMPORTANCE_LOW)
            )
        }
    }

    private fun createNotification(): Notification {
        val openApp = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_view)
            .setContentTitle("Screen monitoring is active")
            .setContentText("Tap Stop monitoring in the app to end capture.")
            .setContentIntent(openApp)
            .setOngoing(true)
            .build()
    }

    companion object {
        const val EXTRA_RESULT_DATA = "result_data"
        const val KEY_BOT_TOKEN = "bot_token"
        const val KEY_CHAT_ID = "chat_id"
        const val PREFS = "assistant_preferences"
        private const val CHANNEL_ID = "screen_monitoring"
        private const val NOTIFICATION_ID = 1001
        private const val CAPTURE_INTERVAL_MS = 2_000L
        private const val MIN_QUESTION_LENGTH = 12
        private const val MAX_QUESTION_LENGTH = 800
        private val QUESTION_STARTERS = listOf(
            "what", "why", "how", "when", "where", "which", "who", "can", "is", "are", "do", "does"
        )
    }
}

private inline fun <reified T : android.os.Parcelable> Intent.getParcelableExtraCompat(key: String): T? =
    if (Build.VERSION.SDK_INT >= 33) getParcelableExtra(key, T::class.java)
    else @Suppress("DEPRECATION") getParcelableExtra(key)
