package com.example.ui.screens

import android.util.Base64
import org.json.JSONObject

fun decodeGoogleEmail(jwt: String): String {
    try {
        val parts = jwt.split(".")
        if (parts.size == 3) {
            val payload = String(Base64.decode(parts[1], Base64.URL_SAFE))
            return JSONObject(payload).optString("email", "")
        }
    } catch (e: Exception) {
        e.printStackTrace()
    }
    return ""
}
