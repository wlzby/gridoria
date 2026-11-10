Add-Type -AssemblyName System.Drawing

$baseDir = "c:\Users\ozbayv\AndroidStudioProjects\gridoria"
$rawDir = "$baseDir\play_store_assets\raw_screens"
$outDirPhone = "$baseDir\play_store_assets\screenshots_1080x1920\tr_aaa"
$outDir7 = "$baseDir\play_store_assets\screenshots_tablet_7inch_tr"
$outDir10 = "$baseDir\play_store_assets\screenshots_tablet_10inch_tr"
$artifactDir = "C:\Users\ozbayv\.gemini\antigravity\brain\83d3b996-2418-443c-bbaa-dd847d544154"
$artDirPhone = "$artifactDir\phone_8"
$artDir7 = "$artifactDir\tablet_7inch_8"
$artDir10 = "$artifactDir\tablet_10inch_8"
$tempHtmlDir = "$artifactDir\temp_8_slides"
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$userDir = "$artifactDir\edge_profile_8"

# Ensure output dirs exist
@($outDirPhone, $outDir7, $outDir10, $artDirPhone, $artDir7, $artDir10, $tempHtmlDir) | ForEach-Object {
    if (-not (Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}

# Clean old files in target directories
Get-ChildItem $outDirPhone -Filter "*.png" | Remove-Item -Force
Get-ChildItem $outDir7 -Filter "*.png" | Remove-Item -Force
Get-ChildItem $outDir10 -Filter "*.png" | Remove-Item -Force

$slides = @(
    @{
        Id = "1_nisan_al_firlat"
        Pill = "🎯 YENİ NESİL BULMACA"
        Title = "NİŞAN AL & FIRLAT"
        Subtitle = "Aynı Sayıları Birleştir, Rekorlar Kır!"
        RawScreen = "$rawDir\screen_1_aim_shoot.png"
        PrimaryColor = "#00f2fe"
        SecondaryColor = "#3b82f6"
        GlowR = 0; GlowG = 242; GlowB = 254
    },
    @{
        Id = "2_zincirleme_kombo"
        Pill = "⚡ KATLANAN ÇARPANLAR"
        Title = "ZİNCİRLEME KOMBO"
        Subtitle = "Blokları Çarpıştır, Ateşli Fever Moduna Gir!"
        RawScreen = "$rawDir\screen_2_combos.png"
        PrimaryColor = "#f97316"
        SecondaryColor = "#eab308"
        GlowR = 249; GlowG = 115; GlowB = 22
    },
    @{
        Id = "3_muharebe_dronu"
        Pill = "🚁 HAVA DESTEK SİSTEMİ"
        Title = "MUHAREBE DRONU"
        Subtitle = "Sıkışan 5 Bloğu Cerrahi Vuruşla Yok Et!"
        RawScreen = "$rawDir\screen_3_combat_drone.png"
        PrimaryColor = "#ef4444"
        SecondaryColor = "#f97316"
        GlowR = 239; GlowG = 68; GlowB = 68
    },
    @{
        Id = "4_uzayli_ufo"
        Pill = "🛸 ÇEKİM IŞINI TEKNOLOJİSİ"
        Title = "UZAYLI UFO IŞINI"
        Subtitle = "İstediğin Bloğu Seç ve Uzaya Kaçır!"
        RawScreen = "$rawDir\screen_4_alien_ufo.png"
        PrimaryColor = "#10b981"
        SecondaryColor = "#06b6d4"
        GlowR = 16; GlowG = 185; GlowB = 129
    },
    @{
        Id = "5_hassas_cekic"
        Pill = "🔨 STRATEJİK JOKERLER"
        Title = "HASSAS ÇEKİÇ"
        Subtitle = "Tek Hamlede Bloğu Kır, Tahtayı Temizle!"
        RawScreen = "$rawDir\screen_5_hammer.png"
        PrimaryColor = "#ec4899"
        SecondaryColor = "#a855f7"
        GlowR = 236; GlowG = 72; GlowB = 153
    },
    @{
        Id = "6_ozel_temalar"
        Pill = "🎨 KİŞİSELLEŞTİRİLEBİLİR DENEYİM"
        Title = "13+ BÜYÜLEYİCİ TEMA"
        Subtitle = "Pofuduk Kürk, Masif Ahşap ve Gece Işıkları!"
        RawScreen = "$rawDir\screen_6_themes.png"
        PrimaryColor = "#a855f7"
        SecondaryColor = "#818cf8"
        GlowR = 168; GlowG = 85; GlowB = 247
    },
    @{
        Id = "7_dunya_ile_yaris"
        Pill = "👑 ŞAMPİYONLAR LİGİ"
        Title = "DÜNYA İLE YARIŞ"
        Subtitle = "Skorunu Göster, Liderlik Tablosuna Yerleş!"
        RawScreen = "$rawDir\screen_7_leaderboard.png"
        PrimaryColor = "#f59e0b"
        SecondaryColor = "#fbbf24"
        GlowR = 245; GlowG = 158; GlowB = 11
    },
    @{
        Id = "8_kariyer_basarilar"
        Pill = "🏆 OYUNCU PROFİLİ"
        Title = "KARİYER & BAŞARILAR"
        Subtitle = "Kendi Profilini Kur, Özel Rozetleri Topla!"
        RawScreen = "$rawDir\screen_8_profile.png"
        PrimaryColor = "#38bdf8"
        SecondaryColor = "#818cf8"
        GlowR = 56; GlowG = 189; GlowB = 248
    }
)

function Build-Html {
    param (
        [hashtable]$s,
        [int]$width,
        [int]$height,
        [int]$phoneWidth,
        [int]$phoneTop,
        [int]$pillFont,
        [string]$pillPad,
        [int]$titleFont,
        [int]$subFont,
        [int]$headPadTop,
        [int]$glowTopW,
        [int]$glowTopH,
        [int]$glowPhoneW,
        [int]$glowPhoneH,
        [int]$brandFont,
        [int]$brandBottom
    )

    $rawB64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($s.RawScreen))

    return @"
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=Space+Grotesk:wght@700;800&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    background: radial-gradient(130% 100% at 50% 0%, #0c1222 0%, #060913 60%, #03050a 100%);
    font-family: 'Outfit', sans-serif;
    position: relative;
    color: #ffffff;
}

.stars-overlay {
    position: absolute;
    inset: 0;
    background-image: 
        radial-gradient(1.5px 1.5px at 150px 240px, rgba(255,255,255,0.4), transparent),
        radial-gradient(1.5px 1.5px at 420px 150px, rgba(255,255,255,0.6), transparent),
        radial-gradient(2px 2px at 980px 300px, rgba(255,255,255,0.5), transparent),
        radial-gradient(1.5px 1.5px at 1080px 750px, rgba(255,255,255,0.3), transparent),
        radial-gradient(2px 2px at 180px 1100px, rgba(255,255,255,0.5), transparent),
        radial-gradient(1.5px 1.5px at 1020px 1450px, rgba(255,255,255,0.4), transparent);
    z-index: 1;
}

.ambient-glow-top {
    position: absolute;
    top: -160px;
    left: 50%;
    transform: translateX(-50%);
    width: ${glowTopW}px;
    height: ${glowTopH}px;
    background: radial-gradient(circle, rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.35) 0%, rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.12) 50%, transparent 75%);
    filter: blur(75px);
    z-index: 2;
}

.ambient-glow-phone {
    position: absolute;
    top: 480px;
    left: 50%;
    transform: translateX(-50%);
    width: ${glowPhoneW}px;
    height: ${glowPhoneH}px;
    background: radial-gradient(circle, rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.28) 0%, rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.08) 55%, transparent 80%);
    filter: blur(95px);
    z-index: 2;
}

.header-container {
    position: relative;
    z-index: 10;
    text-align: center;
    padding-top: ${headPadTop}px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.pill-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: ${pillPad};
    background: rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.15);
    border: 1.5px solid rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.5);
    border-radius: 50px;
    font-size: ${pillFont}px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #ffffff;
    box-shadow: 0 0 30px rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.4);
    margin-bottom: 15px;
}

.main-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: ${titleFont}px;
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
    font-size: ${subFont}px;
    font-weight: 600;
    color: #e2e8f0;
    letter-spacing: 0.4px;
    text-shadow: 0 3px 12px rgba(0, 0, 0, 0.9);
}

.phone-wrapper {
    position: absolute;
    top: ${phoneTop}px;
    left: 50%;
    transform: translateX(-50%);
    width: ${phoneWidth}px;
    z-index: 10;
    filter: drop-shadow(0 35px 70px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 55px rgba($($s.GlowR), $($s.GlowG), $($s.GlowB), 0.35));
}

.phone-wrapper img {
    width: 100%;
    height: auto;
    display: block;
}

.bottom-brand {
    position: absolute;
    bottom: ${brandBottom}px;
    left: 0;
    width: 100%;
    text-align: center;
    font-size: ${brandFont}px;
    font-weight: 800;
    letter-spacing: 5px;
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
}

# ─────────────────────────────────────────────────────────────
# 1. RENDER 8 PHONE SCREENSHOTS (1080 x 1920)
# ─────────────────────────────────────────────────────────────
Write-Host "=== Rendering 8 Phone Screenshots (1080 x 1920) ==="
foreach ($s in $slides) {
    Write-Host "Rendering Phone: $($s.Id)..."
    $html = Build-Html `
        -s $s `
        -width 1080 `
        -height 1920 `
        -phoneWidth 660 `
        -phoneTop 340 `
        -pillFont 22 `
        -pillPad "9px 26px" `
        -titleFont 70 `
        -subFont 28 `
        -headPadTop 72 `
        -glowTopW 950 `
        -glowTopH 650 `
        -glowPhoneW 820 `
        -glowPhoneH 1200 `
        -brandFont 20 `
        -brandBottom 28

    $slideHtmlPath = "$tempHtmlDir\$($s.Id)_phone.html"
    $slideOutPath = "$outDirPhone\$($s.Id).png"
    $artOutPath = "$artDirPhone\$($s.Id).png"
    $slideUserDir = "$userDir\p_$($s.Id)"

    [System.IO.File]::WriteAllText($slideHtmlPath, $html, [System.Text.Encoding]::UTF8)

    $edgeArgs = @(
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--user-data-dir=$slideUserDir",
        "--window-size=1080,1920",
        "--hide-scrollbars",
        "--screenshot=$slideOutPath",
        $slideHtmlPath
    )

    $proc = Start-Process -FilePath $edge -ArgumentList $edgeArgs -PassThru -Wait
    Start-Sleep -Milliseconds 500

    if (Test-Path $slideOutPath) {
        Copy-Item -Path $slideOutPath -Destination $artOutPath -Force
        # Also copy to root artifact dir for easy viewing
        Copy-Item -Path $slideOutPath -Destination "$artifactDir\$($s.Id).png" -Force
        Write-Host "Success Phone: $($s.Id).png"
    } else {
        Write-Host "Error Phone: $($s.Id).png"
    }
    Remove-Item $slideUserDir -Recurse -Force -ErrorAction SilentlyContinue
}

# ─────────────────────────────────────────────────────────────
# 2. RENDER 8 TABLET 7-INCH SCREENSHOTS (1200 x 1920)
# ─────────────────────────────────────────────────────────────
Write-Host "=== Rendering 8 Tablet 7-inch Screenshots (1200 x 1920) ==="
foreach ($s in $slides) {
    Write-Host "Rendering 7-inch: $($s.Id)..."
    $html = Build-Html `
        -s $s `
        -width 1200 `
        -height 1920 `
        -phoneWidth 700 `
        -phoneTop 345 `
        -pillFont 24 `
        -pillPad "10px 28px" `
        -titleFont 76 `
        -subFont 30 `
        -headPadTop 78 `
        -glowTopW 1050 `
        -glowTopH 650 `
        -glowPhoneW 900 `
        -glowPhoneH 1200 `
        -brandFont 21 `
        -brandBottom 28

    $slideHtmlPath = "$tempHtmlDir\$($s.Id)_7inch.html"
    $slideOutPath = "$outDir7\$($s.Id).png"
    $artOutPath = "$artDir7\$($s.Id).png"
    $slideUserDir = "$userDir\t7_$($s.Id)"

    [System.IO.File]::WriteAllText($slideHtmlPath, $html, [System.Text.Encoding]::UTF8)

    $edgeArgs = @(
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--user-data-dir=$slideUserDir",
        "--window-size=1200,1920",
        "--hide-scrollbars",
        "--screenshot=$slideOutPath",
        $slideHtmlPath
    )

    $proc = Start-Process -FilePath $edge -ArgumentList $edgeArgs -PassThru -Wait
    Start-Sleep -Milliseconds 500

    if (Test-Path $slideOutPath) {
        Copy-Item -Path $slideOutPath -Destination $artOutPath -Force
        Write-Host "Success 7-inch: $($s.Id).png"
    } else {
        Write-Host "Error 7-inch: $($s.Id).png"
    }
    Remove-Item $slideUserDir -Recurse -Force -ErrorAction SilentlyContinue
}

# ─────────────────────────────────────────────────────────────
# 3. RENDER 8 TABLET 10-INCH SCREENSHOTS (1600 x 2560)
# ─────────────────────────────────────────────────────────────
Write-Host "=== Rendering 8 Tablet 10-inch Screenshots (1600 x 2560) ==="
foreach ($s in $slides) {
    Write-Host "Rendering 10-inch: $($s.Id)..."
    $html = Build-Html `
        -s $s `
        -width 1600 `
        -height 2560 `
        -phoneWidth 935 `
        -phoneTop 460 `
        -pillFont 32 `
        -pillPad "14px 38px" `
        -titleFont 102 `
        -subFont 40 `
        -headPadTop 105 `
        -glowTopW 1400 `
        -glowTopH 850 `
        -glowPhoneW 1200 `
        -glowPhoneH 1600 `
        -brandFont 28 `
        -brandBottom 38

    $slideHtmlPath = "$tempHtmlDir\$($s.Id)_10inch.html"
    $slideOutPath = "$outDir10\$($s.Id).png"
    $artOutPath = "$artDir10\$($s.Id).png"
    $slideUserDir = "$userDir\t10_$($s.Id)"

    [System.IO.File]::WriteAllText($slideHtmlPath, $html, [System.Text.Encoding]::UTF8)

    $edgeArgs = @(
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--user-data-dir=$slideUserDir",
        "--window-size=1600,2560",
        "--hide-scrollbars",
        "--screenshot=$slideOutPath",
        $slideHtmlPath
    )

    $proc = Start-Process -FilePath $edge -ArgumentList $edgeArgs -PassThru -Wait
    Start-Sleep -Milliseconds 500

    if (Test-Path $slideOutPath) {
        Copy-Item -Path $slideOutPath -Destination $artOutPath -Force
        Write-Host "Success 10-inch: $($s.Id).png"
    } else {
        Write-Host "Error 10-inch: $($s.Id).png"
    }
    Remove-Item $slideUserDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "=== All 24 Screenshots (8 Phone, 8 7-inch Tablet, 8 10-inch Tablet) Rendered Successfully! ==="
