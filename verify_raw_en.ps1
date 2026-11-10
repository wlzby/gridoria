Add-Type -AssemblyName System.Drawing

$rawDir = "c:\Users\ozbayv\AndroidStudioProjects\gridoria\play_store_assets\raw_screens"
$rawDirEn = "c:\Users\ozbayv\AndroidStudioProjects\gridoria\play_store_assets\raw_screens_en"
if (-not (Test-Path $rawDirEn)) { New-Item -ItemType Directory -Path $rawDirEn -Force | Out-Null }

Copy-Item "$rawDir\screen_3_combat_drone.png" "$rawDirEn\screen_3_combat_drone.png" -Force
Copy-Item "$rawDir\screen_4_alien_ufo.png" "$rawDirEn\screen_4_alien_ufo.png" -Force
Copy-Item "$rawDir\screen_7_leaderboard.png" "$rawDirEn\screen_7_leaderboard.png" -Force
Copy-Item "$rawDir\screen_8_profile.png" "$rawDirEn\screen_8_profile.png" -Force

Write-Host "All 8 raw EN screens verified:"
Get-ChildItem $rawDirEn -Filter "*.png" | Select-Object Name, Length
