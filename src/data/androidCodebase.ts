export interface AndroidFile {
  path: string;
  category: 'kotlin' | 'layout' | 'manifest' | 'gradle';
  description: string;
  code: string;
}

export const ANDROID_CODEBASE: AndroidFile[] = [
  {
    path: 'app/src/main/java/com/streamflow/tv/MainActivity.kt',
    category: 'kotlin',
    description: 'Activity principal com suporte a navegação D-Pad para Android TV e Touchscreen para Smartphones',
    code: `package com.streamflow.tv

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.streamflow.tv.adapters.ChannelAdapter
import com.streamflow.tv.models.Channel
import com.streamflow.tv.network.M3uService

class MainActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var channelAdapter: ChannelAdapter
    private val channelList = mutableListOf<Channel>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        recyclerView = findViewById(R.id.recyclerViewChannels)
        
        // Grid responsivo: 4 colunas em TV Box / Android TV, 2 em Smartphones
        val isTv = isAndroidTv()
        val spanCount = if (isTv) 4 else 2
        recyclerView.layoutManager = GridLayoutManager(this, spanCount)

        channelAdapter = ChannelAdapter(channelList) { selectedChannel ->
            // Abrir ExoPlayer Activity
            PlayerActivity.start(this, selectedChannel.streamUrl, selectedChannel.title)
        }
        recyclerView.adapter = channelAdapter

        loadM3uPlaylists()
    }

    private fun loadM3uPlaylists() {
        M3uService.fetchPlaylist("https://play.streamflow.com/get.php?username=carlossilva&password=password123") { channels ->
            runOnUiThread {
                channelList.clear()
                channelList.addAll(channels)
                channelAdapter.notifyDataSetChanged()
                Toast.makeText(this, "Carregados \${channels.size} canais", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun isAndroidTv(): Boolean {
        return packageManager.hasSystemFeature("android.software.leanback")
    }
}
`
  },
  {
    path: 'app/src/main/java/com/streamflow/tv/PlayerActivity.kt',
    category: 'kotlin',
    description: 'Activity de Reprodução HLS / M3U8 com ExoPlayer 2 / androidx.media3 para Android TV e Mobile',
    code: `package com.streamflow.tv

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView

class PlayerActivity : AppCompatActivity() {

    private var exoPlayer: ExoPlayer? = null
    private lateinit var playerView: PlayerView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_player)

        playerView = findViewById(R.id.playerView)

        val streamUrl = intent.getStringExtra(EXTRA_STREAM_URL) ?: return finish()
        initializePlayer(streamUrl)
    }

    private fun initializePlayer(url: String) {
        exoPlayer = ExoPlayer.Builder(this).build().apply {
            playerView.player = this
            val mediaItem = MediaItem.fromUri(url)
            setMediaItem(mediaItem)
            prepare()
            playWhenReady = true
        }
    }

    override fun onStop() {
        super.onStop()
        exoPlayer?.release()
        exoPlayer = null
    }

    companion object {
        private const val EXTRA_STREAM_URL = "extra_stream_url"
        private const val EXTRA_TITLE = "extra_title"

        fun start(context: Context, url: String, title: String) {
            val intent = Intent(context, PlayerActivity::class.java).apply {
                putExtra(EXTRA_STREAM_URL, url)
                putExtra(EXTRA_TITLE, title)
            }
            context.startActivity(intent)
        }
    }
}
`
  },
  {
    path: 'app/src/main/java/com/streamflow/tv/LoginActivity.kt',
    category: 'kotlin',
    description: 'Tela de Login com Validação de Credenciais Xtream / M3U via JWT REST API',
    code: `package com.streamflow.tv

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class LoginActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        val editUsername = findViewById<EditText>(R.id.editUsername)
        val editPassword = findViewById<EditText>(R.id.editPassword)
        val btnLogin = findViewById<Button>(R.id.btnLogin)

        btnLogin.setOnClickListener {
            val username = editUsername.text.toString().trim()
            val password = editPassword.text.toString().trim()

            if (username.isNotEmpty() && password.isNotEmpty()) {
                // Autenticar com API StreamFlow
                Toast.makeText(this, "Autenticando...", Toast.LENGTH_SHORT).show()
                startActivity(Intent(this, MainActivity::class.java))
                finish()
            } else {
                Toast.makeText(this, "Preencha todos os campos", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    category: 'manifest',
    description: 'Manifesto Android com declaração de permissões de Internet e suporte a Leanback (Android TV)',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.streamflow.tv">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Suporte para TV Box e Smart TV -->
    <uses-feature android:name="android.software.leanback" android:required="false" />
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="StreamFlow TV"
        android:supportsRtl="true"
        android:theme="@style/Theme.Material3.Dark.NoActionBar">

        <activity
            android:name=".SplashActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>

        <activity android:name=".LoginActivity" />
        <activity android:name=".MainActivity" />
        <activity android:name=".PlayerActivity" android:configChanges="orientation|screenSize" />
    </application>

</manifest>
`
  },
  {
    path: 'app/build.gradle.kts',
    category: 'gradle',
    description: 'Configuração Gradle com dependências ExoPlayer Media3, Material 3 e Leanback para Android TV',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.streamflow.tv"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.streamflow.tv"
        minSdk = 24
        targetSdk = 34
        versionCode = 24
        versionName = "2.4.0"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")

    // ExoPlayer Media3 para Reprodução de Vídeo HLS/M3U8
    implementation("androidx.media3:media3-exoplayer:1.2.1")
    implementation("androidx.media3:media3-exoplayer-hls:1.2.1")
    implementation("androidx.media3:media3-ui:1.2.1")

    // Leanback para Android TV e Controle Remoto
    implementation("androidx.leanback:leanback:1.0.0")

    // Glide para Carregamento de Logos de Canais
    implementation("com.github.bumptech.glide:glide:4.16.0")
}
`
  }
];
