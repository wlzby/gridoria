# 🍏 Apple App Store Review — Guideline 4.3(a) Spam İtiraz ve Çözüm Paketi
**Referans Başvuru Kimliği:** `a02ad994-4827-4e4b-9115-d81868b70a72`  
**İnceleme Cihazı:** `iPad Air 11 inç (M3)`  
**İncelenen Sürüm:** `1.0 (8)` ➔ **Yeni Sunulacak Sürüm:** `1.0 (9)` (veya `1.0.1 (9)`)  
**Yönerge:** `Yönerge 4.3(a) - Tasarım - Spam` (Design - Spam)

---

## 🎯 Apple'ın Reddetme Sebebi ve Uygulanan Kesin Çözümler

Apple inceleme ekibinin uygulamanızı 4.3(a) Spam olarak işaretlemesinin **2 temel teknik sebebi** tespit edildi ve kod tabanında tamamen çözüldü:

1. **iPad Air 11 inç (M3) Ekranında "Telefon Kutusu (Letterboxing)" Görünümü [DÜZELTİLDİ]:**
   - **Önceki Durum:** `style.css` içerisindeki eski tablet kuralı, ekran genişliği 481px'i geçtiğinde oyunu 480px genişliğinde, kenarları yuvarlatılmış, koyu arkaplanlı bir telefon çerçevesine hapsediyordu. Apple test uzmanı iPad Air 11" M3 üzerinde oyunu açtığında ekranda devasa boşluklar ve ortada yüzen küçük bir telefon gördü. Bu durum Apple'ın otomatik ve manuel denetimlerinde doğrudan *"re-packaged web template / unadapted phone spam"* uyarısını tetikler.
   - **Yapılan İyileştirme:** iPad ve tablet ekranları için özel responsive CSS mimarisi yazıldı. Kenar çerçeveleri, suni gölgeler ve telefon sınırlamaları kaldırıldı. Izgara tahtası (`grid-board`), nişangah ve joker kontrolleri iPad Air ekranını akıcı ve estetik bir şekilde dolduracak şekilde dinamik clamp ölçülerine kavuşturuldu.

2. **Apple Ekosistem Donanım ve Yazılım Entegrasyonunun Eksik Olması [EKLENDİ]:**
   - **Apple GameKit (Game Center):** `ViewController.swift` içerisine Apple Game Center tam entegre edildi. Oyun açıldığında ekranın üstünde Apple'ın resmi "Hoş Geldiniz" Game Center banner'ı ve sağ/sol üstte etkileşimli `GKAccessPoint` rozeti açılır. Yüksek skorlar Apple Game Center Liderlik Tablosuna (`GKLeaderboard`), başarılar `GKAchievement` sistemine otomatik işlenir.
   - **StoreKit 2:** Modern Swift async/await altyapısıyla 6 adet oyun içi satın alma ürünü (Elmas paketleri & VIP Başlangıç paketi) yerel olarak çalışır.
   - **Taptic Engine Dokunsal Geribildirim:** `UIImpactFeedbackGenerator` ve `UINotificationFeedbackGenerator` ile her hamle, kombo ve patlama fiziksel olarak hissedilir.
   - **SKStoreReviewController:** Oyuncu yüksek skorlara ulaştığında yerel iOS puanlama penceresi açılır.

---

## 📋 App Store Connect'te İzlenecek Adımlar

1. **Xcode veya CI/CD Üzerinden Sürüm Numarasını Arttırın:**
   - `CFBundleShortVersionString`: `1.0.1` (veya `1.0`)
   - `CFBundleVersion`: `9` (Reddedilen sürüm `8` idi, bu nedenle build numarası en az `9` olmalıdır).
2. **Yeni Build'i App Store Connect'e Gönderin.**
3. **App Store Connect Panelinde:**
   - **Resolution Center (Çözüm Merkezi)** sekmesine gidin.
   - İlgili 4.3(a) mesajının altındaki **"Reply to App Review" (İnceleme Ekibine Yanıt Ver)** kutusuna aşağıdaki **Bölüm 1: Resmi İngilizce İtiraz Mektubu** metnini yapıştırın.
4. **App Review Information (Uygulama İnceleme Bilgileri) ➔ Notes (Notlar)** alanına ise **Bölüm 2: İnceleme Notları** metnini ekleyin.
5. Yeni build'i (`1.0 (9)`) seçip **Submit for Review (İncelemeye Gönder)** butonuna tıklayın.

---

## ✉️ BÖLÜM 1: Resmi İngilizce İtiraz Mektubu (Resolution Center İçin)

> **Kullanım:** Aşağıdaki İngilizce metni App Store Connect Resolution Center yanıt kutusuna kopyalayıp gönderin.

```text
Dear Apple App Review Team,

Thank you for your review and feedback regarding Guideline 4.3(a) (Submission ID: a02ad994-4827-4e4b-9115-d81868b70a72). We hold Apple's high design and quality standards in the highest regard and have thoroughly investigated the concerns raised during testing on the iPad Air 11-inch (M3).

We respectfully clarify that Gridoria is NOT a repackaged template, NOT a cookie-cutter clone, and NOT spam. It is a completely bespoke, proprietary tactical puzzle game independently engineered from the ground up by Mawelly Studio, featuring custom tactical mechanics, a real-time procedural audio synthesis engine, and deep native Apple iOS/iPadOS hardware integrations.

In this new build (Version 1.0, Build 9), we have executed significant UI/UX overhauls and technical upgrades specifically addressing your observations:

1. NATIVE IPAD AIR 11" (M3) & TABLET RESPONSIVE OVERHAUL:
• In the previous build, an unoptimized viewport container created an unintentional boxed presentation on wide tablet screens.
• We have completely re-engineered our responsive CSS/layout pipeline. Gridoria now natively scales to fill the iPad Air 11" (M3) display seamlessly, eliminating all artificial phone borders, box shadows, and margins.
• Grid dimensions, touch targets, HUD components, and tactical booster docks now dynamically adapt to iPadOS screen ratios with crisp high-DPI Retina assets and optimized ergonomics.

2. NATIVE APPLE GAMEKIT (GAME CENTER) ECOSYSTEM INTEGRATION:
• Gridoria now features full native Apple GameKit integration (GKLocalPlayer authentication).
• Floating interactive GKAccessPoint badge appears directly upon launch, allowing players to view their Game Center profile, achievements, and ranks.
• Native Apple Game Center Leaderboards (GKLeaderboard) and Achievements (GKAchievement, e.g. "achievement_reach_2048") are fully connected to game milestones.
• Game Center controller delegate (GKGameCenterViewController) allows native in-game leaderboard browsing.

3. PROPRIETARY TACTICAL MECHANICS (DISTINCT FROM ANY TEMPLATE):
• Autonomous UCAV Combat Drone Strike: An original tactical booster featuring vector flight trajectories and surgical airstrikes across clustered blocks.
• Alien UFO Tractor Beam Abduction: A bespoke sci-fi extraction mechanic warping in a flying saucer with particle gravity beams to abduct obstructive blocks into space.
• Dynamic Frost Hazard Grid (iceGrid): A procedural frozen block system requiring double-layer tactical adjacent fusions to shatter and clear.
• Fever Rush Combo Cascades: Real-time combo multipliers (2x, 3x, 5x) with dynamic fiery border pulses and Apple Taptic Engine tactile responses.

4. REAL-TIME PROCEDURAL WEBAUDIO SYNTHESIZER:
• Gridoria does NOT use pre-recorded stock audio loops.
• Every block merge dynamically synthesizes harmonic musical chords in real time using a custom WebAudio oscillator and biquad filter graph, rewarding players with melodic feedback.

5. NATIVE STOREKIT 2 & SYSTEM FRAMEWORKS:
• In-App Purchases are driven natively by modern Apple StoreKit 2 (async/await) supporting 6 distinct product tiers and automatic receipt/transaction validation.
• Native Core Haptics (UIImpactFeedbackGenerator & UINotificationFeedbackGenerator) tuned for subtle and satisfying physical feedback.
• Native SKStoreReviewController integration prompts players for reviews at natural gameplay achievements.

HOW THE REVIEWER CAN VERIFY THESE IMPROVEMENTS ON IPAD AIR 11":
1. Launch the app on iPad Air 11" (M3) — observe the full-screen native edge-to-edge presentation and the Game Center authentication banner / GKAccessPoint.
2. Tap "Play" on the main menu to enter the tactical grid. Notice the beautifully scaled board and UI.
3. Tap the DRONE icon (UCAV Stealth Drone) on the bottom powerup dock, then tap any tile cluster to deploy the aerial strike.
4. Tap the UFO icon to deploy the alien tractor beam abduction.
5. Tap the CROWN icon in the header to launch the native Apple Game Center Leaderboard dashboard.

We have invested tremendous effort and technical craftsmanship into ensuring Gridoria is a distinguished, high-quality, and original addition to the App Store. We kindly request the Review Team to reconsider this submission.

Thank you very much for your time, patience, and dedication.

Sincerely,
Mawelly Studio Development Team
```

---

## 🇹🇷 BÖLÜM 1'İN TÜRKÇE ANLAMI (Bilgilendirme Amaçlı)

*(Apple'a gönderilmeyecektir, mektupta ne anlatıldığını bilmeniz içindir)*

> Sayın Apple Uygulama İnceleme Ekibi,  
> Yönerge 4.3(a) ile ilgili geri bildiriminiz için teşekkür ederiz. iPad Air 11 inç (M3) üzerinde yapılan testlerde belirtilen endişeleri detaylıca inceledik.  
> Gridoria'nın kesinlikle yeniden paketlenmiş bir şablon veya spam olmadığını; Mawelly Studio tarafından sıfırdan geliştirilmiş, özgün taktiksel mekaniklere, gerçek zamanlı prosedürel ses sentezleyicisine ve derin yerel Apple iOS/iPadOS entegrasyonlarına sahip bağımsız bir yapım olduğunu saygıyla belirtmek isteriz.  
> Yeni sürümde (1.0 Build 9):  
> 1. iPad Air 11" için ekranı tamamen dolduran akıcı responsive tasarım yapıldı; telefon kutusu görünümü ve çerçeveler tamamen kaldırıldı.  
> 2. Yerel Apple GameKit (Game Center) entegrasyonu tamamlandı: Hoş Geldiniz banner'ı, GKAccessPoint rozeti, Liderlik Tabloları ve Başarılar bağlandı.  
> 3. Cerrahi UCAV Dron Saldırısı, UFO Çekim Işını, Donmuş Buzlu Bloklar ve Ateş Modu gibi özgün mekanikler vurgulandı.  
> 4. Hazır ses paketleri yerine gerçek zamanlı WebAudio osilatör sentezleyicisi kullanıldığı belirtildi.  
> 5. StoreKit 2, Core Haptics titreşimleri ve SKStoreReviewController yerel fonksiyonları eklendi.  
> Uygulamanın yeniden değerlendirilmesini arz ederiz.

---

## 📝 BÖLÜM 2: App Review Information ➔ Notes Kutusu Metni

> **Kullanım:** App Store Connect'te sürüm detaylarındaki **"App Review Information" (Uygulama İnceleme Bilgileri) ➔ "Notes" (Notlar)** alanına yapıştırın.

```text
Dear Reviewer,

Thank you for testing Gridoria on iPad Air 11" (M3).

In this build (Version 1.0, Build 9), we have fully resolved the Guideline 4.3(a) feedback:
1. iPad Air 11" Native Presentation: The UI now natively adapts to iPad dimensions with edge-to-edge scaling (no letterboxing or phone borders).
2. Apple GameKit: Native Game Center is active upon launch (GKAccessPoint, GKLeaderboard, GKAchievement). Tap the Crown icon to inspect native Leaderboards.
3. Tactical Boosters: Tap the DRONE icon (UCAV Stealth Drone) or UFO icon on the bottom powerup dock to experience our original tactical mechanics.
4. Procedural Synthesizer: Block merges trigger real-time synthesized audio chords via WebAudio oscillators.
5. In-App Purchases: Powered natively by StoreKit 2 and can be tested in the Shop.

Thank you for your time and guidance!
```

