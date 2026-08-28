# 🍎 Gridoria - iOS Kurulum & Dağıtım Rehberi

Bu dizin, **Gridoria** oyununun iOS (iPhone & iPad) üzerinde yerel (native) performansla çalışmasını sağlayan Swift / WKWebView / AdMob sarmalayıcısını içerir.

---

## 📁 Dosya Yapısı

- `Gridoria/AppDelegate.swift`: `AVAudioSession` sessiz mod ayarı ve AdMob başlangıç kodları.
- `Gridoria/SceneDelegate.swift`: Pencere ve görünüm denetleyicisi başlatıcı.
- `Gridoria/ViewController.swift`: `WKWebView`, JavaScript Köprüsü (`iosBridge`), Taptic Engine titreşimleri ve AdMob (Banner / Interstitial / Rewarded) yöneticisi.
- `Gridoria/Info.plist`: AdMob App ID, SKAdNetwork kimlikleri ve tam ekran ayarları.
- `Podfile`: AdMob iOS SDK bağımlılığı (`Google-Mobile-Ads-SDK`).

---

## 🚀 Xcode ile Çalıştırma Adımları

1. **Mac Bilgisayarınızda Xcode'u Açın**:
   - `Create a new Xcode Project` -> **iOS App** seçeneğini seçin.
   - Project Name: `Gridoria`
   - Organization Identifier: `com.mawelly` (veya kendi şirket kimliğiniz)
   - Interface: `Storyboard` (veya programmatic)
   - Language: `Swift`

2. **Web Varlıklarını (Assets) Ekleyin**:
   - Android projesindeki `app/src/main/assets/www` klasörünü Xcode projenize sürükleyin.
   - Karşınıza çıkan pencerede **"Create folder references"** (mavi klasör ikonu) seçeneğini işaretleyin.

3. **Kodları Projeye Dahil Edin**:
   - `AppDelegate.swift`, `SceneDelegate.swift`, `ViewController.swift` ve `Info.plist` dosyalarını projenizdeki dosyalarla değiştirin veya ekleyin.

4. **AdMob SDK Kurulumu**:
   - Proje ana dizininde terminal açıp `pod install` çalıştırın.
   - Oluşan `Gridoria.xcworkspace` dosyasını Xcode ile açın.
   *(Alternatif olarak Xcode -> File -> Add Package Dependencies menüsünden `https://github.com/googleads/swift-package-manager-google-mobile-ads.git` paketini ekleyebilirsiniz).*

5. **AdMob ID'lerini Canlıya Alma**:
   - `Info.plist` içindeki `GADApplicationIdentifier` değerini canlı iOS AdMob App ID'niz ile değiştirin.
   - `ViewController.swift` içindeki `BANNER_AD_UNIT_ID`, `INTERSTITIAL_AD_UNIT_ID` ve `REWARDED_AD_UNIT_ID` değerlerini canlı AdMob birim ID'lerinizle güncelleyin.

6. **Çalıştırın**:
   - iPhone simülatörü veya fiziksel iPhone cihazınızı seçip `Cmd + R` ile oyunu başlatın!

---

## ✨ Sağlanan Özellikler

* ✅ **Sessiz Mod Uyumluluğu:** iPhone'un yanındaki fiziksel ses kapatma anahtarı açıkken bile oyun sesleri pürüzsüz çalar.
* ✅ **Taptic Engine:** Tüm kombo, patlama ve hamlelerde Apple'ın `UIImpactFeedbackGenerator` donanımsal titreşim motoru devreye girer.
* ✅ **Çentik & Safe Area:** Dynamic Island, çentik ve alt bar (Home indicator) ile %100 uyumlu tam ekran deneyimi.
* ✅ **AdMob Ödüllü & Geçiş Reklamları:** Çift elmas kazanma, canlanma ve afiş reklamları iOS'ta yerel olarak çalışır.
