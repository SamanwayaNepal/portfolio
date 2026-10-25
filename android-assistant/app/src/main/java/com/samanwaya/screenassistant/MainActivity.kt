package com.samanwaya.screenassistant

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.samanwaya.screenassistant.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val projectionRequest = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode != Activity.RESULT_OK || result.data == null) {
            binding.statusText.text = "Screen capture permission was not granted."
            return@registerForActivityResult
        }
        startCaptureService(result.data!!)
    }

    private val notificationPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.startButton.setOnClickListener { requestCapture() }
        binding.stopButton.setOnClickListener {
            stopService(Intent(this, ScreenCaptureService::class.java))
            setMonitoringState(false)
        }
    }

    private fun requestCapture() {
        val token = binding.botTokenInput.text?.toString()?.trim().orEmpty()
        val chatId = binding.chatIdInput.text?.toString()?.trim().orEmpty()
        if (token.isBlank() || chatId.isBlank()) {
            Toast.makeText(this, "Enter the Telegram bot token and chat ID.", Toast.LENGTH_LONG).show()
            return
        }

        getSharedPreferences(ScreenCaptureService.PREFS, MODE_PRIVATE).edit()
            .putString(ScreenCaptureService.KEY_BOT_TOKEN, token)
            .putString(ScreenCaptureService.KEY_CHAT_ID, chatId)
            .apply()

        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }

        val manager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        projectionRequest.launch(manager.createScreenCaptureIntent())
    }

    private fun startCaptureService(data: Intent) {
        val serviceIntent = Intent(this, ScreenCaptureService::class.java).apply {
            putExtra(ScreenCaptureService.EXTRA_RESULT_DATA, data)
        }
        ContextCompat.startForegroundService(this, serviceIntent)
        setMonitoringState(true)
    }

    private fun setMonitoringState(running: Boolean) {
        binding.startButton.isEnabled = !running
        binding.stopButton.isEnabled = running
        binding.statusText.text = if (running) {
            "Monitoring is active. Use Stop monitoring to end capture."
        } else {
            "Not monitoring"
        }
    }
}
