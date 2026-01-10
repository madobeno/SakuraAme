package com.sakuraame.app

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsIntent
import android.net.Uri

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val url = "https://yourusername.github.io/SAKURA-AME/"
        val builder = CustomTabsIntent.Builder()
        builder.setShowTitle(true)
        builder.setToolbarColor(resources.getColor(android.R.color.black, theme))
        
        val customTabsIntent = builder.build()
        customTabsIntent.launchUrl(this, Uri.parse(url))
        
        finish()
    }
}
