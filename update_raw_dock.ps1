Add-Type -AssemblyName System.Drawing

$rawDir = "c:\Users\ozbayv\AndroidStudioProjects\gridoria\play_store_assets\raw_screens"
$basePhone = New-Object System.Drawing.Bitmap("$rawDir\screen_bomb_gameplay.png")

function Build-PixelPerfect-Composite {
    param(
        [string]$scenePath,
        [string]$outputPath
    )
    $sceneImg = [System.Drawing.Image]::FromFile($scenePath)
    $comp = New-Object System.Drawing.Bitmap(468, 1024)
    $g = [System.Drawing.Graphics]::FromImage($comp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

    # 1. Screen inner rectangle with curved corners
    $screenRect = New-Object System.Drawing.Rectangle(16, 16, 436, 992)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $radius = 42
    $path.AddArc($screenRect.X, $screenRect.Y, $radius, $radius, 180, 90)
    $path.AddArc($screenRect.Right - $radius, $screenRect.Y, $radius, $radius, 270, 90)
    $path.AddArc($screenRect.Right - $radius, $screenRect.Bottom - $radius, $radius, $radius, 0, 90)
    $path.AddArc($screenRect.X, $screenRect.Bottom - $radius, $radius, $radius, 90, 90)
    $path.CloseFigure()

    $g.SetClip($path)
    $g.DrawImage($sceneImg, $screenRect)

    # 2. Authentic Drone & UFO Dock Pill from screen_bomb_gameplay
    # Exact stadium pill coordinates:
    $srcRect = New-Object System.Drawing.Rectangle(32, 896, 404, 96)
    $dstRect = New-Object System.Drawing.Rectangle(32, 898, 404, 104)

    $dockPill = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pr = 46
    $dockPill.AddArc($dstRect.X, $dstRect.Y, $pr, $pr, 180, 90)
    $dockPill.AddArc($dstRect.Right - $pr, $dstRect.Y, $pr, $pr, 270, 90)
    $dockPill.AddArc($dstRect.Right - $pr, $dstRect.Bottom - $pr, $pr, $pr, 0, 90)
    $dockPill.AddArc($dstRect.X, $dstRect.Bottom - $pr, $pr, $pr, 90, 90)
    $dockPill.CloseFigure()

    $g.SetClip($dockPill)
    $dockBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 20, 24, 33))
    $g.FillPath($dockBrush, $dockPill)
    $dockBrush.Dispose()

    $g.DrawImage($basePhone, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    $g.ResetClip()

    # 3. Outer phone chassis bezel
    for ($y = 0; $y -lt 1024; $y++) {
        for ($x = 0; $x -lt 468; $x++) {
            $p = $basePhone.GetPixel($x, $y)
            $isBezel = ($x -lt 16 -or $x -ge 452 -or $y -lt 16 -or $y -ge 1008)
            if ($isBezel) {
                $comp.SetPixel($x, $y, $p)
            }
        }
    }

    # 4. Clean solid black Dynamic Island
    $islandBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 0, 0))
    $islandPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $ix = 188; $iy = 36; $iw = 92; $ih = 28; $ir = 28
    $islandPath.AddArc($ix, $iy, $ir, $ir, 180, 90)
    $islandPath.AddArc($ix + $iw - $ir, $iy, $ir, $ir, 270, 90)
    $islandPath.AddArc($ix + $iw - $ir, $iy + $ih - $ir, $ir, $ir, 0, 90)
    $islandPath.AddArc($ix, $iy + $ih - $ir, $ir, $ir, 90, 90)
    $islandPath.CloseFigure()
    $g.FillPath($islandBrush, $islandPath)

    $lensBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 18, 24, 38))
    $g.FillEllipse($lensBrush, 202, 42, 16, 16)
    $lensBrush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 10, 14, 22))
    $g.FillEllipse($lensBrush2, 248, 43, 14, 14)

    $comp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $islandBrush.Dispose()
    $lensBrush.Dispose()
    $lensBrush2.Dispose()
    $g.Dispose()
    $comp.Dispose()
    $sceneImg.Dispose()
    Write-Host "Generated: $outputPath"
}

Build-PixelPerfect-Composite "c:\Users\ozbayv\AndroidStudioProjects\gridoria\ios\AppStore_Screenshots\raw_screens\scene_1_tr.png" "$rawDir\screen_1_aim_shoot.png"
Build-PixelPerfect-Composite "c:\Users\ozbayv\AndroidStudioProjects\gridoria\ios\AppStore_Screenshots\raw_screens\scene_2_tr.png" "$rawDir\screen_2_combos.png"
Build-PixelPerfect-Composite "c:\Users\ozbayv\AndroidStudioProjects\gridoria\ios\AppStore_Screenshots\raw_screens\scene_3_tr.png" "$rawDir\screen_5_hammer.png"

$basePhone.Dispose()
Write-Host "All 3 raw screens updated with pixel-perfect Drone & UFO booster dock!"
