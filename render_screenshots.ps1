Add-Type -AssemblyName System.Drawing

$baseDir = "c:\Users\ozbayv\AndroidStudioProjects\gridoria"
$rawDir = "$baseDir\play_store_assets\raw_screens"
$outDir = "$baseDir\play_store_assets\screenshots_1080x1920\tr_aaa"
$artifactDir = "C:\Users\ozbayv\.gemini\antigravity\brain\83d3b996-2418-443c-bbaa-dd847d544154"
$tempHtmlDir = "$artifactDir\temp_slides"
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$userDir = "$artifactDir\edge_profile"

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
if (-not (Test-Path $tempHtmlDir)) { New-Item -ItemType Directory -Path $tempHtmlDir -Force | Out-Null }

$slides = @(
    @{
        Id = "1_nisan_al_firlat"
        Pill = "✨ YENİ NESİL BULMACA"
        Title = "NİŞAN AL & FIRLAT"
        Subtitle = "Aynı Sayıları Birleştir, Rekorlar Kır!"
        RawScreen = "$rawDir\screen_ufo_gameplay.png"
        PrimaryColor = "#00f2fe"
        SecondaryColor = "#3b82f6"
        GlowR = 0; GlowG = 242; GlowB = 254
    },
    @{
        Id = "2_muharebe_dronu"
        Pill = "🚁 CERRAHİ HAVA DESTEĞİ"
        Title = "MUHAREBE DRONU"
        Subtitle = "Sıkışan 5 Bloğu Cerrahi Vuruşla Yok Et!"
        RawScreen = "$rawDir\screen_bomb_gameplay.png"
        PrimaryColor = "#ef4444"
        SecondaryColor = "#f97316"
        GlowR = 239; GlowG = 68; GlowB = 68
    },
    @{
        Id = "3_uzayli_ufo"
        Pill = "🛸 ÇEKİM IŞINI TEKNOLOJİSİ"
        Title = "UZAYLI UFO IŞINI"
        Subtitle = "İstediğin Bloğu Seç ve Uzaya Kaçır!"
        RawScreen = "$rawDir\screen_ufo_gameplay.png"
        PrimaryColor = "#10b981"
        SecondaryColor = "#06b6d4"
        GlowR = 16; GlowG = 185; GlowB = 129
    },
    @{
        Id = "4_ozel_temalar"
        Pill = "🎨 KİŞİSELLEŞTİRİLEBİLİR DENEYİM"
        Title = "13+ BÜYÜLEYİCİ TEMA"
        Subtitle = "Pofuduk Kürk, Masif Ahşap ve Gece Işıkları!"
        RawScreen = "$rawDir\screen_settings.png"
        PrimaryColor = "#a855f7"
        SecondaryColor = "#ec4899"
        GlowR = 168; GlowG = 85; GlowB = 247
    },
    @{
        Id = "5_dunya_ile_yaris"
        Pill = "👑 ŞAMPİYONLAR LİGİ"
        Title = "DÜNYA İLE YARIŞ"
        Subtitle = "Skorunu Göster, Liderlik Tablosuna Yerleş!"
        RawScreen = "$rawDir\screen_leaderboard.png"
        PrimaryColor = "#f59e0b"
        SecondaryColor = "#fbbf24"
        GlowR = 245; GlowG = 158; GlowB = 11
    },
    @{
        Id = "6_kariyer_basarilar"
        Pill = "🏆 OYUNCU PROFİLİ"
        Title = "KARİYER & BAŞARILAR"
        Subtitle = "Kendi Profilini Kur, Özel Rozetleri Topla!"
        RawScreen = "$rawDir\screen_profile.png"
        PrimaryColor = "#38bdf8"
        SecondaryColor = "#818cf8"
        GlowR = 56; GlowG = 189; GlowB = 248
    }
)

foreach ($s in $slides) {
    Write-Host "Rendering Slide: $($s.Id)..."
    $rawB64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($s.RawScreen))
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=Space+Grotesk:wght@700;800&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    width: 1080px;
    height: 1920px;
    overflow: hidden;
    background: radial-gradient(130% 100% at 50% 0%, #0c1222 0%, #060913 60%, #03050a 100%);
    font-family: 'Outfit', sans-serif;
    position: relative;
    color: #ffffff;
}

/* Background Stars Grid */
.stars-overlay {
    position: absolute;
    inset: 0;
    background-image: 
        radial-gradient(1.5px 1.5px at 120px 240px, rgba(255,255,255,0.4), transparent),
        radial-gradient(1.5px 1.5px at 380px 150px, rgba(255,255,255,0.6), transparent),
        radial-gradient(2px 2px at 850px 300px, rgba(255,255,255,0.5), transparent),
        radial-gradient(1.5px 1.5px at 950px 750px, rgba(255,255,255,0.3), transparent),
        radial-gradient(2px 2px at 150px 1100px, rgba(255,255,255,0.5), transparent),
        radial-gradient(1.5px 1.5px at 920px 1450px, rgba(255,255,255,0.4), transparent);
    z-index: 1;
}

/* Ambient Deep Cyber Glows */
.ambient-glow-top {
    position: absolute;
    top: -160px;
    left: 50%;
    transform: translateX(-50%);
    width: 950px;
    height: 650px;
    background: radial-gradient(circle, rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.35) 0%, rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.12) 50%, transparent 75%);
    filter: blur(65px);
    z-index: 2;
}

.ambient-glow-phone {
    position: absolute;
    top: 480px;
    left: 50%;
    transform: translateX(-50%);
    width: 820px;
    height: 1200px;
    background: radial-gradient(circle, rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.28) 0%, rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.08) 55%, transparent 80%);
    filter: blur(85px);
    z-index: 2;
}

/* Header Container */
.header-container {
    position: relative;
    z-index: 10;
    text-align: center;
    padding-top: 75px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.pill-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 26px;
    background: rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.15);
    border: 1.5px solid rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.5);
    border-radius: 40px;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #ffffff;
    box-shadow: 0 0 30px rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.4);
    margin-bottom: 16px;
}

.main-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 72px;
    font-weight: 900;
    letter-spacing: -1.5px;
    text-transform: uppercase;
    background: linear-gradient(180deg, #ffffff 15%, $($s.PrimaryColor) 85%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 35px rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.6));
    line-height: 1.1;
    margin-bottom: 12px;
}

.sub-title {
    font-size: 29px;
    font-weight: 600;
    color: #e2e8f0;
    letter-spacing: 0.4px;
    text-shadow: 0 3px 12px rgba(0, 0, 0, 0.9);
}

/* Phone Mockup */
.phone-wrapper {
    position: absolute;
    top: 345px;
    left: 50%;
    transform: translateX(-50%);
    width: 660px;
    z-index: 10;
    filter: drop-shadow(0 35px 70px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 50px rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.35));
}

.phone-wrapper img {
    width: 100%;
    height: auto;
    display: block;
}

/* Bottom Brand Bar */
.bottom-brand {
    position: absolute;
    bottom: 28px;
    left: 0;
    width: 100%;
    text-align: center;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 4.5px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.45);
    text-shadow: 0 2px 8px rgba(0,0,0,0.8);
    z-index: 10;
}
</style>
</head>
<body>
    <div class="stars-overlay"></div>
    <div class="ambient-glow-top"></div>
    <div class="ambient-glow-phone"></div>

    <div class="header-container">
        <div class="pill-badge">$($s.Pill)</div>
        <h1 class="main-title">$($s.Title)</h1>
        <p class="sub-title">$($s.Subtitle)</p>
    </div>

    <div class="phone-wrapper">
        <img src="data:image/png;base64,$rawB64" alt="$($s.Id)">
    </div>

    <div class="bottom-brand">👑 GRIDORIA • GOOGLE PLAY</div>
</body>
</html>
"@
    
    $slideHtmlPath = "$tempHtmlDir\$($s.Id).html"
    $slideOutPath = "$outDir\$($s.Id).png"
    $artifactOutPath = "$artifactDir\$($s.Id).png"
    
    [System.IO.File]::WriteAllText($slideHtmlPath, $html, [System.Text.Encoding]::UTF8)
    
    & $edge --headless --no-sandbox --disable-gpu --user-data-dir="$userDir" --window-size=1080,1920 --hide-scrollbars --screenshot="$slideOutPath" "$slideHtmlPath" | Out-Null
    
    # Also copy to artifacts dir for easy viewing
    if (Test-Path $slideOutPath) {
        Copy-Item -Path $slideOutPath -Destination $artifactOutPath -Force
        Write-Host "Success: $($s.Id).png rendered!"
    } else {
        Write-Host "Error rendering: $($s.Id).png"
    }
}

Write-Host "All 6 AAA Screenshots successfully generated!"
