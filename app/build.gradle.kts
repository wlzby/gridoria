plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.mawelly.gridoria"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.mawelly.gridoria"
        minSdk = 24
        targetSdk = 36
        versionCode = 4
        versionName = "1.2.1"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)

    // 🔥 Google AdMob (Rewarded & Interstitial Ads)
    implementation("com.google.android.gms:play-services-ads:23.6.0")

    // 💎 Google Play In-App Billing (StoreKit / Play Billing Client 7)
    implementation("com.android.billingclient:billing-ktx:7.1.1")

    // 🎮 Google Play Games Services v2 (Leaderboards, Achievements, Play Profile)
    implementation("com.google.android.gms:play-services-games-v2:20.1.2")

    // ⭐ Google Play In-App Review API (In-app rating & ASO booster)
    implementation("com.google.android.play:review-ktx:2.0.2")

    // 🔄 Google Play In-App Update API (Seamless version updates)
    implementation("com.google.android.play:app-update-ktx:2.1.0")

    // 🛡️ Google User Messaging Platform (UMP / GDPR & AdMob CMP)
    implementation("com.google.android.ump:user-messaging-platform:3.1.0")

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
}