package com.samanwaya.screenassistant

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.FormBody
import okhttp3.OkHttpClient
import okhttp3.Request

object TelegramClient {
    private val client = OkHttpClient()

    suspend fun sendQuestion(token: String, chatId: String, question: String) {
        if (token.isBlank() || chatId.isBlank()) return
        withContext(Dispatchers.IO) {
            val body = FormBody.Builder()
                .add("chat_id", chatId)
                .add("text", question)
                .build()
            val request = Request.Builder()
                .url("https://api.telegram.org/bot$token/sendMessage")
                .post(body)
                .build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    throw IllegalStateException("Telegram request failed: HTTP ${response.code}")
                }
            }
        }
    }
}
