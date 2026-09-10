/**
 * Gridoria Multi-Language (i18n) Engine
 * Automatically detects device/OS language and localizes the game seamlessly.
 * Supported languages:
 *  - tr: Türkçe (Turkish)
 *  - en: English (Universal / Default Fallback)
 *  - es: Español (Spanish)
 *  - de: Deutsch (German)
 *  - fr: Français (French)
 *  - pt: Português (Portuguese)
 *  - it: Italiano (Italian)
 *  - ru: Русский (Russian)
 */

(function() {
    const SUPPORTED_LANGS = ['tr', 'en', 'es', 'de', 'fr', 'pt', 'it', 'ru'];

    const TRANSLATIONS = {
        // ── TÜRKÇE (TR) ────────────────────────────────────────────────
        tr: {
            // Ana Menü & Nav
            play: "OYNA",
            continue: "DEVAM ET",
            nav_home: "ANA SAYFA",
            nav_shop: "MAĞAZA",
            nav_themes: "TEMALAR",
            nav_missions: "GÖREVLER",
            nav_leaderboard: "LİDERLİK",
            nav_profile: "PROFİL",
            nav_settings: "AYARLAR",
            daily_tag: "DAILY",
            daily_reward_title: "Günlük Ödül",
            daily_reward_subtitle: "Her gün giriş yap, elmas ve joker ödüllerini topla!",
            claim_reward: "ÖDÜLÜ AL",
            claimed: "ALINDI",
            day: "GÜN",
            next_reward_in: "Sonraki ödül:",
            touch_merge: "DOKUN & BİRLEŞTİR",
            resumed_tile: "KALDIĞINIZ TAŞ",
            highest_block: "EN YÜKSEK BLOK",
            score: "SKOR",
            high_score: "EN YÜKSEK SKOR",
            target: "HEDEF:",
            status_ready: "Hedef sütunu seç ve taşı fırlat",
            status_resumed: "Kaldığınız yerden devam ediliyor!",

            // Jokerler / Güçlendiriciler
            booster_hammer: "Çekiç",
            booster_bomb: "Bomba",
            booster_swap: "Değiştir",
            booster_undo: "Geri Al",
            powerup_select_tile: "Yok etmek istediğin taşı seç",
            powerup_select_swap1: "Yerini değiştirmek istediğin 1. taşı seç",
            powerup_select_swap2: "Yerini değiştirmek istediğin 2. taşı seç",
            cancel: "İptal",

            // Oyun Bitti
            game_over: "OYUN BİTTİ",
            earned_gems: "Kazanılan Elmas:",
            btn_revive: "🛡️ REKLAM İZLE & CANLAN",
            btn_double_gems: "🎁 2X ELMAS KAZAN",
            restart: "YENİDEN BAŞLA",
            main_menu: "ANA MENÜ",

            // Mağaza
            shop_title: "MAĞAZA",
            tab_gems: "Elmaslar",
            tab_boosters: "Güçlendiriciler",
            free_gems: "Ücretsiz 💎",
            watch_ad: "Reklam İzle",
            buy: "Satın Al",
            vip_title: "VIP KULÜBÜ & REKLAMSIZ",
            vip_desc: "Kalıcı Ayrıcalıklı Deneyim",
            vip_f1: "Tüm Geçiş & Banner Reklamları Kalıcı Olarak Kaldırılır",
            vip_f2: "Sınırsız Özel Fotoğraf & Arka Plan Yükleme Hakkı",
            vip_f3: "Anında +1,000 Hediye Elmas Bakiyesi",
            vip_f4: "Profilinizde Özel VIP Altın Rozeti",
            vip_button: "👑 VIP OL",
            restore_purchases: "Satın Alımları Geri Yükle",
            restore_hint: "Daha önce satın aldığınız VIP üyeliğinizi bu cihaza aktarın.",

            // Temalar
            themes_title: "Tema",
            tab_backgrounds: "Arka Planlar",
            tab_colors: "Renkler",
            free: "ÜCRETSİZ",
            custom_photo: "Kendi Fotoğrafın",
            custom_photo_desc: "Galerinizden istediğiniz fotoğrafı seçip arka plan yapabilirsiniz.",
            upload_fee: "Yükleme Ücreti:",
            select_photo: "✨ 500 💎 Ver & Fotoğraf Seç",
            rotate_90: "🔄 Döndür (90°)",
            reset: "↺ Sıfırla",
            apply_photo: "✨ Fotoğrafı Uygula",
            zoom: "🔍 Yakınlaştır:",

            // Görevler
            missions_title: "GÜNLÜK GÖREVLER",
            missions_subtitle: "Görevlerini tamamla, ödülleri kap!",
            level: "SEVİYE",
            mission_completed: "GÖREV TAMAMLANDI!",
            mission_toast_desc: "Ödülünü Görevler menüsünden al.",
            mission_merges: "{count} birleştirme yap",
            mission_tile: "{tile} taşına ulaş",
            mission_score: "{score} skora ulaş",

            // Profil
            profile_title: "OYUNCU PROFİLİ",
            career_stats: "📊 KARİYER İSTATİSTİKLERİ",
            best_tile: "EN YÜKSEK BLOK",
            total_merges: "TOPLAM BİRLEŞTİRME",
            gem_balance: "ELMAS BAKİYESİ",
            achievements_title: "🏅 BAŞARIMLAR VE UNVANLAR",
            edit_profile_title: "✏️ PROFİL DÜZENLEME",
            enter_nickname: "BİR TAKMA AD GİRİN",
            choose_avatar: "BİR AVATAR SEÇİN",
            confirm_profile: "PROFİLİ ONAYLA",
            profile_bonus: "Profilini kaydet, anında +50 💎 hediye kazan.",

            // Liderlik
            leaderboard_title: "LİDERLİK TABLOSU",
            all_time: "🏆 TÜM ZAMANLAR",
            weekly: "🔥 HAFTALIK",
            points: "puan",

            // Ayarlar
            settings_title: "OYUN AYARLARI",
            sound_on: "SES AÇIK",
            sound_off: "SES KAPALI",
            sound_sub: "Oyun Efektleri",
            vibe_on: "TİTREŞİM AÇIK",
            vibe_off: "TİTREŞİM KAPALI",
            vibe_sub: "Dokunsal Haptik",
            reset_progress: "OYUN İLERLEMESİNİ SIFIRLA",
            reset_confirm_title: "Oyun İlerlemesini Sıfırla",
            reset_confirm_desc: "Oyun ilerlemeniz ve tahtanız sıfırlansın mı? (Elmaslarınız korunacaktır)",
            yes_reset: "EVET, SIFIRLA",

            // İpuçları ve Zihin Sözleri
            quotes: [
                "Günde 20 dakika oyna, hafızanı ve zihnini geliştir!",
                "Stratejini kur, büyük sayıları köşelere yerleştir.",
                "Kombo yaptıkça puan çarpanın ve skorun katlanır!",
                "Sıkıştığında çekici veya bombayı kullanarak alan aç.",
                "Düzenli oynamak odaklanmayı ve zekayı güçlendirir.",
                "Hedef 2048! Sabırlı ol ve hamlelerini önceden planla."
            ]
        },

        // ── ENGLISH (EN) - UNIVERSAL FALLBACK ─────────────────────────
        en: {
            play: "PLAY",
            continue: "CONTINUE",
            nav_home: "HOME",
            nav_shop: "SHOP",
            nav_themes: "THEMES",
            nav_missions: "MISSIONS",
            nav_leaderboard: "RANKS",
            nav_profile: "PROFILE",
            nav_settings: "SETTINGS",
            daily_tag: "DAILY",
            daily_reward_title: "Daily Reward",
            daily_reward_subtitle: "Log in every day to claim free gems and booster rewards!",
            claim_reward: "CLAIM REWARD",
            claimed: "CLAIMED",
            day: "DAY",
            next_reward_in: "Next reward:",
            touch_merge: "TAP & MERGE",
            resumed_tile: "CURRENT TILE",
            highest_block: "HIGHEST BLOCK",
            score: "SCORE",
            high_score: "HIGH SCORE",
            target: "GOAL:",
            status_ready: "Pick target column and launch tile",
            status_resumed: "Resuming your saved game!",

            booster_hammer: "Hammer",
            booster_bomb: "Bomb",
            booster_swap: "Swap",
            booster_undo: "Undo",
            powerup_select_tile: "Tap any tile you want to destroy",
            powerup_select_swap1: "Select the first tile to swap",
            powerup_select_swap2: "Select the second tile to swap",
            cancel: "Cancel",

            game_over: "GAME OVER",
            earned_gems: "Gems Earned:",
            btn_revive: "🛡️ WATCH AD & REVIVE",
            btn_double_gems: "🎁 2X GEMS REWARD",
            restart: "PLAY AGAIN",
            main_menu: "MAIN MENU",

            shop_title: "SHOP",
            tab_gems: "Gems",
            tab_boosters: "Boosters",
            free_gems: "Free 💎",
            watch_ad: "Watch Ad",
            buy: "Buy",
            vip_title: "VIP CLUB & AD-FREE",
            vip_desc: "Permanent Premium Experience",
            vip_f1: "All Interstitial & Banner Ads Permanently Removed",
            vip_f2: "Unlimited Custom Photo Background Uploads",
            vip_f3: "Instant +1,000 Bonus Diamonds Balance",
            vip_f4: "Exclusive VIP Golden Crown Badge on Profile",
            vip_button: "👑 GET VIP",
            restore_purchases: "Restore Purchases",
            restore_hint: "Restore previously purchased VIP membership to this device.",

            themes_title: "Theme",
            tab_backgrounds: "Backgrounds",
            tab_colors: "Colors",
            free: "FREE",
            custom_photo: "Custom Photo",
            custom_photo_desc: "Choose any photo from your gallery and set it as background.",
            upload_fee: "Upload Fee:",
            select_photo: "✨ Pay 500 💎 & Choose Photo",
            rotate_90: "🔄 Rotate (90°)",
            reset: "↺ Reset",
            apply_photo: "✨ Apply Photo",
            zoom: "🔍 Zoom:",

            missions_title: "DAILY MISSIONS",
            missions_subtitle: "Complete quests and claim diamond prizes!",
            level: "LEVEL",
            mission_completed: "MISSION COMPLETED!",
            mission_toast_desc: "Claim your reward in the Missions menu.",
            mission_merges: "Perform {count} merges",
            mission_tile: "Reach tile {tile}",
            mission_score: "Reach score {score}",

            profile_title: "PLAYER PROFILE",
            career_stats: "📊 CAREER STATS",
            best_tile: "HIGHEST TILE",
            total_merges: "TOTAL MERGES",
            gem_balance: "GEM BALANCE",
            achievements_title: "🏅 ACHIEVEMENTS & BADGES",
            edit_profile_title: "✏️ EDIT PROFILE",
            enter_nickname: "ENTER A NICKNAME",
            choose_avatar: "CHOOSE AN AVATAR",
            confirm_profile: "SAVE PROFILE",
            profile_bonus: "Save profile now to get +50 💎 instant reward.",

            leaderboard_title: "LEADERBOARD",
            all_time: "🏆 ALL TIME",
            weekly: "🔥 WEEKLY",
            points: "pts",

            settings_title: "GAME SETTINGS",
            sound_on: "SOUND ON",
            sound_off: "SOUND OFF",
            sound_sub: "Game Audio Effects",
            vibe_on: "VIBRATION ON",
            vibe_off: "VIBRATION OFF",
            vibe_sub: "Haptic Feedback",
            reset_progress: "RESET GAME PROGRESS",
            reset_confirm_title: "Reset Game Progress",
            reset_confirm_desc: "Are you sure you want to reset board & progress? (Gems will be kept)",
            yes_reset: "YES, RESET",

            quotes: [
                "Play 20 minutes a day to sharpen your focus and mind!",
                "Build your strategy: keep higher numbers near the corners.",
                "Keep your combo rolling to multiply your final score!",
                "When crowded, use the hammer or bomb to clear space.",
                "Daily puzzle training stimulates memory and fast thinking.",
                "Target 2048! Stay calm and plan your shots ahead."
            ]
        },

        // ── ESPAÑOL (ES) ──────────────────────────────────────────────
        es: {
            play: "JUGAR",
            continue: "CONTINUAR",
            nav_home: "INICIO",
            nav_shop: "TIENDA",
            nav_themes: "TEMAS",
            nav_missions: "MISIONES",
            nav_leaderboard: "RÁNKING",
            nav_profile: "PERFIL",
            nav_settings: "AJUSTES",
            daily_tag: "DIARIO",
            daily_reward_title: "Recompensa Diaria",
            daily_reward_subtitle: "¡Inicia sesión todos los días para ganar gemas y potenciadores!",
            claim_reward: "RECLAMAR",
            claimed: "RECLAMADO",
            day: "DÍA",
            next_reward_in: "Próxima recompensa:",
            touch_merge: "TOCA Y COMBINA",
            resumed_tile: "FICHA ACTUAL",
            highest_block: "BLOQUE MÁS ALTO",
            score: "PUNTOS",
            high_score: "RÉCORD",
            target: "OBJETIVO:",
            status_ready: "Elige una columna y dispara la ficha",
            status_resumed: "¡Continuando tu partida guardada!",

            booster_hammer: "Martillo",
            booster_bomb: "Bomba",
            booster_swap: "Cambiar",
            booster_undo: "Deshacer",
            powerup_select_tile: "Toca cualquier ficha para destruirla",
            powerup_select_swap1: "Elige la 1ª ficha para intercambiar",
            powerup_select_swap2: "Elige la 2ª ficha para intercambiar",
            cancel: "Cancelar",

            game_over: "FIN DEL JUEGO",
            earned_gems: "Gemas ganadas:",
            btn_revive: "🛡️ VER ANUNCIO Y REVIVIR",
            btn_double_gems: "🎁 2X GEMAS EXTRA",
            restart: "JUGAR DE NUEVO",
            main_menu: "MENÚ PRINCIPAL",

            shop_title: "TIENDA",
            tab_gems: "Gemas",
            tab_boosters: "Potenciadores",
            free_gems: "Gratis 💎",
            watch_ad: "Ver Anuncio",
            buy: "Comprar",
            vip_title: "CLUB VIP SIN ANUNCIOS",
            vip_desc: "Experiencia Premium Permanente",
            vip_f1: "Sin anuncios intersticiales ni banners para siempre",
            vip_f2: "Fotos de fondo personalizadas ilimitadas",
            vip_f3: "+1.000 Diamantes de regalo al instante",
            vip_f4: "Insignia dorada VIP exclusiva en tu perfil",
            vip_button: "👑 SER VIP",
            restore_purchases: "Restaurar Compras",
            restore_hint: "Restaura tu membresía VIP en este dispositivo.",

            themes_title: "Temas",
            tab_backgrounds: "Fondos",
            tab_colors: "Colores",
            free: "GRATIS",
            custom_photo: "Foto Propia",
            custom_photo_desc: "Elige cualquier foto de tu galería como fondo de pantalla.",
            upload_fee: "Coste de subida:",
            select_photo: "✨ Pagar 500 💎 y Elegir Foto",
            rotate_90: "🔄 Girar (90°)",
            reset: "↺ Reiniciar",
            apply_photo: "✨ Aplicar Foto",
            zoom: "🔍 Zoom:",

            missions_title: "MISIONES DIARIAS",
            missions_subtitle: "¡Completa misiones y consigue diamantes!",
            level: "NIVEL",
            mission_completed: "¡MISIÓN COMPLETADA!",
            mission_toast_desc: "Reclama tu premio en el menú de misiones.",
            mission_merges: "Haz {count} combinaciones",
            mission_tile: "Alcanza la ficha {tile}",
            mission_score: "Alcanza {score} puntos",

            profile_title: "PERFIL DE JUGADOR",
            career_stats: "📊 ESTADÍSTICAS",
            best_tile: "MEJOR FICHA",
            total_merges: "COMBINACIONES TOTALES",
            gem_balance: "SALDO DE GEMAS",
            achievements_title: "🏅 LOGROS E INSIGNIAS",
            edit_profile_title: "✏️ EDITAR PERFIL",
            enter_nickname: "ESCRIBE UN APODO",
            choose_avatar: "ELIGE UN AVATAR",
            confirm_profile: "GUARDAR PERFIL",
            profile_bonus: "Crea tu perfil y gana +50 💎 al instante.",

            leaderboard_title: "CLASIFICACIÓN",
            all_time: "🏆 HISTÓRICO",
            weekly: "🔥 SEMANAL",
            points: "pts",

            settings_title: "AJUSTES",
            sound_on: "SONIDO SÍ",
            sound_off: "SONIDO NO",
            sound_sub: "Efectos del Juego",
            vibe_on: "VIBRACIÓN SÍ",
            vibe_off: "VIBRACIÓN NO",
            vibe_sub: "Respuesta Háptica",
            reset_progress: "REINICIAR PROGRESO",
            reset_confirm_title: "Reiniciar Progreso",
            reset_confirm_desc: "¿Reiniciar tablero y progreso? (Tus gemas se conservarán)",
            yes_reset: "SÍ, REINICIAR",

            quotes: [
                "¡Juega 20 minutos al día para entrenar tu cerebro y agilidad!",
                "Construye tu estrategia: coloca los números altos en las esquinas.",
                "¡Mantén el combo activo para multiplicar tus puntos!",
                "Usa el martillo o la bomba para despejar espacio cuando lo necesites.",
                "El entrenamiento diario estimula la memoria y la concentración.",
                "¡Objetivo 2048! Mantén la calma y calcula cada disparo."
            ]
        },

        // ── DEUTSCH (DE) ──────────────────────────────────────────────
        de: {
            play: "SPIELEN",
            continue: "WEITER",
            nav_home: "START",
            nav_shop: "SHOP",
            nav_themes: "THEMEN",
            nav_missions: "MISSIONEN",
            nav_leaderboard: "RANGLISTE",
            nav_profile: "PROFIL",
            nav_settings: "OPTIONEN",
            daily_tag: "TÄGLICH",
            daily_reward_title: "Tägliche Belohnung",
            daily_reward_subtitle: "Logge dich täglich ein und sichere dir Edelsteine & Booster!",
            claim_reward: "EINFORDERN",
            claimed: "ERHALTEN",
            day: "TAG",
            next_reward_in: "Nächste Belohnung:",
            touch_merge: "TIPPEN & VERSCHMELZEN",
            resumed_tile: "AKTUELLES FELD",
            highest_block: "HÖCHSTER BLOCK",
            score: "PUNKTE",
            high_score: "REKORD",
            target: "ZIEL:",
            status_ready: "Spalte wählen und Stein abschießen",
            status_resumed: "Spiel wird fortgesetzt!",

            booster_hammer: "Hammer",
            booster_bomb: "Bombe",
            booster_swap: "Tauschen",
            booster_undo: "Zurück",
            powerup_select_tile: "Wähle einen Block zum Zerstören",
            powerup_select_swap1: "Wähle den 1. Stein zum Tauschen",
            powerup_select_swap2: "Wähle den 2. Stein zum Tauschen",
            cancel: "Abbrechen",

            game_over: "SPIEL VORBEI",
            earned_gems: "Gewonnene Edelsteine:",
            btn_revive: "🛡️ WERBUNG SEHEN & WEITERLEBEN",
            btn_double_gems: "🎁 2X EDELSTEINE BELOHNUNG",
            restart: "NEUSTART",
            main_menu: "HAUPTMENÜ",

            shop_title: "SHOP",
            tab_gems: "Edelsteine",
            tab_boosters: "Booster",
            free_gems: "Gratis 💎",
            watch_ad: "Werbung ansehen",
            buy: "Kaufen",
            vip_title: "VIP CLUB & WERBEFREI",
            vip_desc: "Dauerhaftes Premium-Erlebnis",
            vip_f1: "Alle Banner- & Vollbild-Werbungen dauerhaft entfernt",
            vip_f2: "Unbegrenzte eigene Hintergrund-Fotos hochladen",
            vip_f3: "Sofort +1.000 Bonus-Diamanten gutgeschrieben",
            vip_f4: "Exklusive goldene VIP-Krone im Profil",
            vip_button: "👑 VIP WERDEN",
            restore_purchases: "Käufe Wiederherstellen",
            restore_hint: "Stelle deine VIP-Mitgliedschaft auf diesem Gerät wieder her.",

            themes_title: "Thema",
            tab_backgrounds: "Hintergründe",
            tab_colors: "Farben",
            free: "GRATIS",
            custom_photo: "Eigenes Foto",
            custom_photo_desc: "Wähle ein beliebiges Foto aus deiner Galerie als Hintergrund.",
            upload_fee: "Kosten:",
            select_photo: "✨ 500 💎 zahlen & Foto wählen",
            rotate_90: "🔄 Drehen (90°)",
            reset: "↺ Reset",
            apply_photo: "✨ Foto anwenden",
            zoom: "🔍 Zoom:",

            missions_title: "TÄGLICHE MISSIONEN",
            missions_subtitle: "Erfülle Missionen und gewinne Belohnungen!",
            level: "STUFE",
            mission_completed: "MISSION ERFÜLLT!",
            mission_toast_desc: "Hole dir deine Belohnung im Missionsmenü ab.",
            mission_merges: "{count} Verschmelzungen durchführen",
            mission_tile: "Erreiche Stein {tile}",
            mission_score: "Erreiche {score} Punkte",

            profile_title: "SPIELERPROFIL",
            career_stats: "📊 KARRIERE-STATISTIK",
            best_tile: "BESTER STEIN",
            total_merges: "GESAMTE MERGES",
            gem_balance: "EDELSTEIN-GUTHABEN",
            achievements_title: "🏅 ERFOLGE & ABZEICHEN",
            edit_profile_title: "✏️ PROFIL BEARBEITEN",
            enter_nickname: "SPITZNAME EINGEBEN",
            choose_avatar: "AVATAR WÄHLEN",
            confirm_profile: "PROFIL SPEICHERN",
            profile_bonus: "Profil speichern und sofort +50 💎 erhalten.",

            leaderboard_title: "RANGLISTE",
            all_time: "🏆 EWIGE BESTE",
            weekly: "🔥 WOCHE",
            points: "Pkt",

            settings_title: "EINSTELLUNGEN",
            sound_on: "SOUND AN",
            sound_off: "SOUND AUS",
            sound_sub: "Soundeffekte",
            vibe_on: "VIBRATION AN",
            vibe_off: "VIBRATION AUS",
            vibe_sub: "Haptisches Feedback",
            reset_progress: "FORTSCHRITT ZURÜCKSETZEN",
            reset_confirm_title: "Fortschritt zurücksetzen",
            reset_confirm_desc: "Spielfeld und Punkte wirklich zurücksetzen? (Edelsteine bleiben erhalten)",
            yes_reset: "JA, RESET",

            quotes: [
                "20 Minuten täglich spielen fördert Konzentration und Denkschnelligkeit!",
                "Baue deine Strategie auf: Halte hohe Zahlen an den Rändern.",
                "Halte die Combo am Laufen, um deinen Multiplikator zu steigern!",
                "Nutze Hammer oder Bombe, wenn es auf dem Spielfeld eng wird.",
                "Tägliches Puzzeln schärft Gedächtnis und logisches Denken.",
                "Ziel 2048! Bleibe geduldig und plane deine nächsten Züge."
            ]
        },

        // ── FRANÇAIS (FR) ─────────────────────────────────────────────
        fr: {
            play: "JOUER",
            continue: "CONTINUER",
            nav_home: "ACCUEIL",
            nav_shop: "BOUTIQUE",
            nav_themes: "THÈMES",
            nav_missions: "MISSIONS",
            nav_leaderboard: "CLASSEMENT",
            nav_profile: "PROFIL",
            nav_settings: "OPTIONS",
            daily_tag: "JOURNALIER",
            daily_reward_title: "Récompense Quotidienne",
            daily_reward_subtitle: "Connectez-vous chaque jour pour gagner des gemmes gratuites !",
            claim_reward: "RÉCUPÉRER",
            claimed: "RÉCUPÉRÉ",
            day: "JOUR",
            next_reward_in: "Prochaine récompense :",
            touch_merge: "TOUCHER & FUSIONNER",
            resumed_tile: "TUILE ACTUELLE",
            highest_block: "MEILLEUR BLOC",
            score: "SCORE",
            high_score: "MEILLEUR SCORE",
            target: "OBJECTIF :",
            status_ready: "Choisissez une colonne et lancez la tuile",
            status_resumed: "Reprise de votre partie enregistrée !",

            booster_hammer: "Marteau",
            booster_bomb: "Bombe",
            booster_swap: "Échanger",
            booster_undo: "Annuler",
            powerup_select_tile: "Touchez une tuile pour la détruire",
            powerup_select_swap1: "Sélectionnez la 1ère tuile à échanger",
            powerup_select_swap2: "Sélectionnez la 2nde tuile à échanger",
            cancel: "Annuler",

            game_over: "PARTIE TERMINÉE",
            earned_gems: "Gemmes gagnées :",
            btn_revive: "🛡️ REGARDER PUB & REJOUER",
            btn_double_gems: "🎁 DOUBLER LES GEMMES (2X)",
            restart: "REJOUER",
            main_menu: "MENU PRINCIPAL",

            shop_title: "BOUTIQUE",
            tab_gems: "Gemmes",
            tab_boosters: "Boosters",
            free_gems: "Gratuit 💎",
            watch_ad: "Voir Pub",
            buy: "Acheter",
            vip_title: "CLUB VIP SANS PUBLICITÉ",
            vip_desc: "Expérience Premium Permanente",
            vip_f1: "Toutes les publicités interstitielles et bannières supprimées",
            vip_f2: "Téléversement illimité de fonds d'écran photo",
            vip_f3: "+1 000 diamants bonus offerts immédiatement",
            vip_f4: "Badge doré VIP exclusif sur votre profil",
            vip_button: "👑 DEVENIR VIP",
            restore_purchases: "Restaurer les achats",
            restore_hint: "Restaurez votre abonnement VIP sur cet appareil.",

            themes_title: "Thème",
            tab_backgrounds: "Arrière-plans",
            tab_colors: "Couleurs",
            free: "GRATUIT",
            custom_photo: "Photo perso",
            custom_photo_desc: "Choisissez une photo de votre galerie comme fond d'écran.",
            upload_fee: "Frais :",
            select_photo: "✨ Payer 500 💎 & Choisir",
            rotate_90: "🔄 Pivoter (90°)",
            reset: "↺ Réinitialiser",
            apply_photo: "✨ Appliquer la photo",
            zoom: "🔍 Zoom :",

            missions_title: "MISSIONS QUOTIDIENNES",
            missions_subtitle: "Accomplissez des défis et remportez des gemmes !",
            level: "NIVEAU",
            mission_completed: "MISSION RÉUSSIE !",
            mission_toast_desc: "Récupérez votre prix dans le menu des missions.",
            mission_merges: "Effectuer {count} fusions",
            mission_tile: "Atteindre la tuile {tile}",
            mission_score: "Atteindre {score} points",

            profile_title: "PROFIL DU JOUEUR",
            career_stats: "📊 STATISTIQUES",
            best_tile: "MEILLEURE TUILE",
            total_merges: "TOTAL DES FUSIONS",
            gem_balance: "SOLDE DE GEMMES",
            achievements_title: "🏅 SUCCÈS & TITRES",
            edit_profile_title: "✏️ MODIFIER LE PROFIL",
            enter_nickname: "ENTREZ UN PSEUDO",
            choose_avatar: "CHOISISSEZ UN AVATAR",
            confirm_profile: "ENREGISTRER",
            profile_bonus: "Complétez votre profil et gagnez +50 💎 immédiatement.",

            leaderboard_title: "CLASSEMENT",
            all_time: "🏆 TOUT TEMPS",
            weekly: "🔥 SEMAINE",
            points: "pts",

            settings_title: "PARAMÈTRES",
            sound_on: "SON ACTIVÉ",
            sound_off: "SON COUPÉ",
            sound_sub: "Effets sonores",
            vibe_on: "VIBRATION ACTIVÉE",
            vibe_off: "VIBRATION COUPÉE",
            vibe_sub: "Retour Haptique",
            reset_progress: "RÉINITIALISER LA PROGRESSION",
            reset_confirm_title: "Réinitialiser la partie",
            reset_confirm_desc: "Voulez-vous vraiment réinitialiser le plateau ? (Vos gemmes restent conservées)",
            yes_reset: "OUI, RÉINITIALISER",

            quotes: [
                "Jouer 20 minutes par jour stimule la concentration et l'agilité mentale !",
                "Développez votre stratégie : gardez les grands nombres dans les coins.",
                "Enchaînez les combos pour décupler votre score final !",
                "En cas de blocage, utilisez le marteau ou la bombe pour faire de la place.",
                "La pratique quotidienne entretient la mémoire et la vivacité d'esprit.",
                "Cap sur 2048 ! Restez serein et anticipez chaque tir."
            ]
        },

        // ── PORTUGUÊS (PT / BR) ───────────────────────────────────────
        pt: {
            play: "JOGAR",
            continue: "CONTINUAR",
            nav_home: "INÍCIO",
            nav_shop: "LOJA",
            nav_themes: "TEMAS",
            nav_missions: "MISSÕES",
            nav_leaderboard: "RANKING",
            nav_profile: "PERFIL",
            nav_settings: "AJUSTES",
            daily_tag: "DIÁRIO",
            daily_reward_title: "Recompensa Diária",
            daily_reward_subtitle: "Faça login todos os dias para resgatar diamantes e boosters!",
            claim_reward: "RESGATAR",
            claimed: "RESGATADO",
            day: "DIA",
            next_reward_in: "Próxima recompensa:",
            touch_merge: "TOQUE & COMBINE",
            resumed_tile: "PEÇA ATUAL",
            highest_block: "MAIOR BLOCO",
            score: "PONTOS",
            high_score: "RECORDE",
            target: "META:",
            status_ready: "Escolha uma coluna e lance a peça",
            status_resumed: "Continuando seu jogo salvo!",

            booster_hammer: "Martelo",
            booster_bomb: "Bomba",
            booster_swap: "Trocar",
            booster_undo: "Desfazer",
            powerup_select_tile: "Toque em qualquer peça para destruí-la",
            powerup_select_swap1: "Selecione a 1ª peça para trocar",
            powerup_select_swap2: "Selecione a 2ª peça para trocar",
            cancel: "Cancelar",

            game_over: "FIM DE JOGO",
            earned_gems: "Diamantes ganhos:",
            btn_revive: "🛡️ VER VÍDEO & REVIVER",
            btn_double_gems: "🎁 2X DIAMANTES EM DOBRO",
            restart: "JOGAR NOVAMENTE",
            main_menu: "MENU PRINCIPAL",

            shop_title: "LOJA",
            tab_gems: "Diamantes",
            tab_boosters: "Boosters",
            free_gems: "Grátis 💎",
            watch_ad: "Ver Anúncio",
            buy: "Comprar",
            vip_title: "CLUBE VIP SEM ANÚNCIOS",
            vip_desc: "Experiência Premium Permanente",
            vip_f1: "Todos os anúncios intersticiais e banners removidos",
            vip_f2: "Upload ilimitado de fotos personalizadas de fundo",
            vip_f3: "+1.000 diamantes de bônus instantâneo",
            vip_f4: "Insígnia dourada de VIP no perfil",
            vip_button: "👑 SER VIP",
            restore_purchases: "Restaurar Compras",
            restore_hint: "Restaure suas compras anteriores neste dispositivo.",

            themes_title: "Tema",
            tab_backgrounds: "Planos de Fundo",
            tab_colors: "Cores",
            free: "GRÁTIS",
            custom_photo: "Foto Própria",
            custom_photo_desc: "Escolha uma foto da sua galeria e use como plano de fundo.",
            upload_fee: "Taxa de Envio:",
            select_photo: "✨ Pagar 500 💎 & Escolher",
            rotate_90: "🔄 Girar (90°)",
            reset: "↺ Redefinir",
            apply_photo: "✨ Aplicar Foto",
            zoom: "🔍 Zoom:",

            missions_title: "MISSÕES DIÁRIAS",
            missions_subtitle: "Complete missões e ganhe prêmios em diamantes!",
            level: "NÍVEL",
            mission_completed: "MISSÃO CUMPRIDA!",
            mission_toast_desc: "Resgate seu prêmio no menu de Missões.",
            mission_merges: "Fazer {count} combinações",
            mission_tile: "Alcançar a peça {tile}",
            mission_score: "Alcançar {score} pontos",

            profile_title: "PERFIL DO JOGADOR",
            career_stats: "📊 ESTATÍSTICAS DE CARREIRA",
            best_tile: "MAIOR PEÇA",
            total_merges: "TOTAL DE COMBINAÇÕES",
            gem_balance: "SALDO DE DIAMANTES",
            achievements_title: "🏅 CONQUISTAS E TÍTULOS",
            edit_profile_title: "✏️ EDITAR PERFIL",
            enter_nickname: "DIGITE UM APELIDO",
            choose_avatar: "ESCOLHA UM AVATAR",
            confirm_profile: "SALVAR PERFIL",
            profile_bonus: "Salve seu perfil para ganhar +50 💎 na hora.",

            leaderboard_title: "CLASSIFICAÇÃO",
            all_time: "🏆 GERAL",
            weekly: "🔥 SEMANAL",
            points: "pts",

            settings_title: "CONFIGURAÇÕES",
            sound_on: "SOM ATIVADO",
            sound_off: "SOM DESATIVADO",
            sound_sub: "Efeitos Sonoros",
            vibe_on: "VIBRAÇÃO ATIVADA",
            vibe_off: "VIBRAÇÃO DESATIVADA",
            vibe_sub: "Retorno Tátil",
            reset_progress: "REDEFINIR PROGRESSO",
            reset_confirm_title: "Redefinir Progresso",
            reset_confirm_desc: "Deseja zerar seu tabuleiro e progresso? (Seus diamantes serão mantidos)",
            yes_reset: "SIM, REDEFINIR",

            quotes: [
                "Jogar 20 minutos por dia exercita a mente e a concentração!",
                "Monte sua tática: mantenha os números mais altos nos cantos.",
                "Faça combos seguidos para multiplicar sua pontuação máxima!",
                "Quando apertar, use o martelo ou a bomba para abrir espaço.",
                "O raciocínio diário melhora o foco e a tomada de decisões.",
                "Rumo ao 2048! Fique calmo e calcule bem seus disparos."
            ]
        },

        // ── ITALIANO (IT) ─────────────────────────────────────────────
        it: {
            play: "GIOCA",
            continue: "CONTINUA",
            nav_home: "HOME",
            nav_shop: "NEGOZIO",
            nav_themes: "TEMI",
            nav_missions: "MISSIONI",
            nav_leaderboard: "CLASSIFICA",
            nav_profile: "PROFILO",
            nav_settings: "OPZIONI",
            daily_tag: "GIORNALIERO",
            daily_reward_title: "Premio Giornaliero",
            daily_reward_subtitle: "Accedi ogni giorno per riscattare diamanti e potenziamenti gratuiti!",
            claim_reward: "RISCATTA",
            claimed: "RISCATTATO",
            day: "GIORNO",
            next_reward_in: "Prossimo premio:",
            touch_merge: "TOCCA & UNISCI",
            resumed_tile: "BLOCCO ATTUALE",
            highest_block: "BLOCCO PIÙ ALTO",
            score: "PUNTI",
            high_score: "RECORD",
            target: "OBIETTIVO:",
            status_ready: "Scegli una colonna e lancia il blocco",
            status_resumed: "Ripresa della tua partita salvata!",

            booster_hammer: "Martello",
            booster_bomb: "Bomba",
            booster_swap: "Scambia",
            booster_undo: "Annulla",
            powerup_select_tile: "Tocca un blocco da distruggere",
            powerup_select_swap1: "Scegli il 1° blocco da scambiare",
            powerup_select_swap2: "Scegli il 2° blocco da scambiare",
            cancel: "Annulla",

            game_over: "PARTITA FINITA",
            earned_gems: "Diamanti vinti:",
            btn_revive: "🛡️ GUARDA SPOT & RIVIVI",
            btn_double_gems: "🎁 RADDOPPIA DIAMANTI (2X)",
            restart: "GIOCA ANCORA",
            main_menu: "MENU PRINCIPALE",

            shop_title: "NEGOZIO",
            tab_gems: "Diamanti",
            tab_boosters: "Potenziamenti",
            free_gems: "Gratis 💎",
            watch_ad: "Guarda Spot",
            buy: "Acquista",
            vip_title: "CLUB VIP SENZA PUBBLICITÀ",
            vip_desc: "Esperienza Premium Permanente",
            vip_f1: "Tutti gli annunci banner e a schermo intero rimossi",
            vip_f2: "Caricamento illimitato di foto personalizzate di sfondo",
            vip_f3: "+1.000 diamanti bonus accreditati subito",
            vip_f4: "Stemma corona d'oro VIP esclusivo nel profilo",
            vip_button: "👑 DIVENTA VIP",
            restore_purchases: "Ripristina acquisti",
            restore_hint: "Ripristina il tuo abbonamento VIP su questo dispositivo.",

            themes_title: "Tema",
            tab_backgrounds: "Sfondi",
            tab_colors: "Colori",
            free: "GRATIS",
            custom_photo: "Foto Personale",
            custom_photo_desc: "Scegli una foto dalla tua galleria come sfondo di gioco.",
            upload_fee: "Costo:",
            select_photo: "✨ Paga 500 💎 e Scegli",
            rotate_90: "🔄 Ruota (90°)",
            reset: "↺ Reset",
            apply_photo: "✨ Applica Foto",
            zoom: "🔍 Zoom:",

            missions_title: "MISSIONI GIORNALIERE",
            missions_subtitle: "Completa gli obiettivi e ricevi diamanti!",
            level: "LIVELLO",
            mission_completed: "MISSIONE COMPLETATA!",
            mission_toast_desc: "Ritira il tuo premio nel menu Missioni.",
            mission_merges: "Esegui {count} unioni",
            mission_tile: "Raggiungi il blocco {tile}",
            mission_score: "Raggiungi {score} punti",

            profile_title: "PROFILO GIOCATORE",
            career_stats: "📊 STATISTICHE DI CARRIERA",
            best_tile: "MIGLIOR BLOCCO",
            total_merges: "UNIONI TOTALI",
            gem_balance: "SALDO DIAMANTI",
            achievements_title: "🏅 OBIETTIVI & TITOLI",
            edit_profile_title: "✏️ MODIFICA PROFILO",
            enter_nickname: "INSERISCI UN NICKNAME",
            choose_avatar: "SCEGLI UN AVATAR",
            confirm_profile: "SALVA PROFILO",
            profile_bonus: "Salva il profilo per ricevere subito +50 💎.",

            leaderboard_title: "CLASSIFICA",
            all_time: "🏆 DI SEMPRE",
            weekly: "🔥 SETTIMANA",
            points: "pt",

            settings_title: "IMPOSTAZIONI",
            sound_on: "AUDIO ON",
            sound_off: "AUDIO OFF",
            sound_sub: "Effetti Sonori",
            vibe_on: "VIBRAZIONE ON",
            vibe_off: "VIBRAZIONE OFF",
            vibe_sub: "Feedback Aptico",
            reset_progress: "AZZERA PROGRESSI",
            reset_confirm_title: "Azzera Progressi",
            reset_confirm_desc: "Vuoi davvero azzerare tabellone e progressi? (I diamanti saranno conservati)",
            yes_reset: "SÌ, AZZERA",

            quotes: [
                "Giocare 20 minuti al giorno allena concentrazione e memoria!",
                "Pianifica la strategia: posiziona i numeri più grandi negli angoli.",
                "Mantieni attiva la combo per moltiplicare il punteggio!",
                "Quando lo spazio scarseggia, usa il martello o la bomba.",
                "L'allenamento quotidiano mantiene la mente agile e reattiva.",
                "Traguardo 2048! Mantieni la calma e anticipa le tue mosse."
            ]
        },

        // ── РУССКИЙ (RU) ──────────────────────────────────────────────
        ru: {
            play: "ИГРАТЬ",
            continue: "ПРОДОЛЖИТЬ",
            nav_home: "ГЛАВНАЯ",
            nav_shop: "МАГАЗИН",
            nav_themes: "ТЕМЫ",
            nav_missions: "ЗАДАНИЯ",
            nav_leaderboard: "РЕЙТИНГ",
            nav_profile: "ПРОФИЛЬ",
            nav_settings: "НАСТРОЙКИ",
            daily_tag: "ЕЖЕДНЕВНО",
            daily_reward_title: "Ежедневная Награда",
            daily_reward_subtitle: "Заходите каждый день и получайте кристаллы и бонусы!",
            claim_reward: "ЗАБРАТЬ",
            claimed: "ПОЛУЧЕНО",
            day: "ДЕНЬ",
            next_reward_in: "Следующая награда:",
            touch_merge: "НАЖМИ И ОБЪЕДИНЯЙ",
            resumed_tile: "ТЕКУЩИЙ БЛОК",
            highest_block: "ЛУЧШИЙ БЛОК",
            score: "СЧЁТ",
            high_score: "РЕКОРД",
            target: "ЦЕЛЬ:",
            status_ready: "Выберите колонку и запустите блок",
            status_resumed: "Продолжаем сохранённую игру!",

            booster_hammer: "Молот",
            booster_bomb: "Бомба",
            booster_swap: "Поменять",
            booster_undo: "Назад",
            powerup_select_tile: "Нажмите на блок, чтобы разбить его",
            powerup_select_swap1: "Выберите 1-й блок для обмена",
            powerup_select_swap2: "Выберите 2-й блок для обмена",
            cancel: "Отмена",

            game_over: "ИГРА ОКОНЧЕНА",
            earned_gems: "Получено кристаллов:",
            btn_revive: "🛡️ СМОТРЕТЬ РЕКЛАМУ И ОЖИТЬ",
            btn_double_gems: "🎁 УДВОИТЬ КРИСТАЛЛЫ (2X)",
            restart: "ИГРАТЬ СНОВА",
            main_menu: "ГЛАВНОЕ МЕНЮ",

            shop_title: "МАГАЗИН",
            tab_gems: "Кристаллы",
            tab_boosters: "Усилители",
            free_gems: "Бесплатно 💎",
            watch_ad: "Смотреть рекламу",
            buy: "Купить",
            vip_title: "VIP КЛУБ БЕЗ РЕКЛАМЫ",
            vip_desc: "Постоянный Премиум Доступ",
            vip_f1: "Вся баннерная и межстраничная реклама отключена",
            vip_f2: "Неограниченная загрузка своих фото на фон",
            vip_f3: "+1 000 бонусных кристаллов на счёт сразу",
            vip_f4: "Золотой значок VIP-короны в профиле",
            vip_button: "👑 СТАТЬ VIP",
            restore_purchases: "Восстановить покупки",
            restore_hint: "Восстановите ранее купленный VIP на этом устройстве.",

            themes_title: "Тема",
            tab_backgrounds: "Фоны",
            tab_colors: "Цвета",
            free: "БЕСПЛАТНО",
            custom_photo: "Своё фото",
            custom_photo_desc: "Выберите любое фото из галереи в качестве фона.",
            upload_fee: "Стоимость:",
            select_photo: "✨ Отдать 500 💎 и Выбрать",
            rotate_90: "🔄 Поворот (90°)",
            reset: "↺ Сброс",
            apply_photo: "✨ Применить фото",
            zoom: "🔍 Масштаб:",

            missions_title: "ЕЖЕДНЕВНЫЕ ЗАДАНИЯ",
            missions_subtitle: "Выполняйте задания и забирайте награды!",
            level: "УРОВЕНЬ",
            mission_completed: "ЗАДАНИЕ ВЫПОЛНЕНО!",
            mission_toast_desc: "Заберите награду в меню заданий.",
            mission_merges: "Сделать {count} слияний",
            mission_tile: "Достичь блока {tile}",
            mission_score: "Набрать {score} очков",

            profile_title: "ПРОФИЛЬ ИГРОКА",
            career_stats: "📊 СТАТИСТИКА КАРЬЕРЫ",
            best_tile: "ЛУЧШИЙ БЛОК",
            total_merges: "ВСЕГО СЛИЯНИЙ",
            gem_balance: "БАЛАНС КРИСТАЛЛОВ",
            achievements_title: "🏅 ДОСТИЖЕНИЯ И ТИТУЛЫ",
            edit_profile_title: "✏️ РЕДАКТИРОВАНИЕ ПРОФИЛЯ",
            enter_nickname: "ВВЕДИТЕ НИКНЕЙМ",
            choose_avatar: "ВЫБЕРИТЕ АВАТАР",
            confirm_profile: "СОХРАНИТЬ",
            profile_bonus: "Сохраните профиль и получите +50 💎 сразу.",

            leaderboard_title: "ТАБЛИЦА ЛИДЕРОВ",
            all_time: "🏆 ЗА ВСЁ ВРЕМЯ",
            weekly: "🔥 ЗА НЕДЕЛЮ",
            points: "очк.",

            settings_title: "НАСТРОЙКИ",
            sound_on: "ЗВУК ВКЛ",
            sound_off: "ЗВУК ВЫКЛ",
            sound_sub: "Звуковые эффекты",
            vibe_on: "ВИБРАЦИЯ ВКЛ",
            vibe_off: "ВИБРАЦИЯ ВЫКЛ",
            vibe_sub: "Тактильный отклик",
            reset_progress: "СБРОСИТЬ ПРОГРЕСС",
            reset_confirm_title: "Сброс прогресса",
            reset_confirm_desc: "Сбросить игровое поле и прогресс? (Кристаллы сохранятся)",
            yes_reset: "ДА, СБРОСИТЬ",

            quotes: [
                "20 минут игры в день развивают концентрацию и память!",
                "Продумывайте стратегию: держите крупные числа по краям.",
                "Поддерживайте комбо, чтобы многократно увеличить итоговый счёт!",
                "Если на поле тесно, используйте молот или бомбу.",
                "Ежедневная тренировка держит ум в тонусе.",
                "Цель 2048! Сохраняйте спокойствие и планируйте выстрелы."
            ]
        }
    };

    let currentLang = 'en';

    function detectDeviceLanguage() {
        try {
            // 1. Injected by Native iOS (Swift) / Android (Kotlin) Bridge
            if (window.nativeSystemLanguage) {
                const code = String(window.nativeSystemLanguage).toLowerCase().split('-')[0].split('_')[0];
                if (SUPPORTED_LANGS.includes(code)) return code;
                return 'en';
            }

            // 2. Intl API (reflects active device system locale accurately in WebViews)
            if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
                const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
                if (intlLocale) {
                    const code = intlLocale.toLowerCase().split('-')[0].split('_')[0];
                    if (SUPPORTED_LANGS.includes(code)) return code;
                }
            }

            // 3. navigator.languages
            if (navigator.languages && navigator.languages.length > 0) {
                for (const l of navigator.languages) {
                    const code = String(l).toLowerCase().split('-')[0].split('_')[0];
                    if (SUPPORTED_LANGS.includes(code)) return code;
                }
            }

            // 4. navigator.language
            if (navigator.language) {
                const code = String(navigator.language).toLowerCase().split('-')[0].split('_')[0];
                if (SUPPORTED_LANGS.includes(code)) return code;
            }
        } catch (e) {
            console.warn('[i18n] Error detecting language:', e);
        }
        // Universal fallback for all other languages
        return 'en';
    }

    function t(key, params = {}) {
        const langPack = TRANSLATIONS[currentLang] || TRANSLATIONS['en'] || TRANSLATIONS['tr'];
        let text = langPack[key];

        if (text === undefined) {
            const fallbackPack = TRANSLATIONS['en'] || TRANSLATIONS['tr'];
            text = fallbackPack[key];
        }

        if (text === undefined) {
            return key;
        }

        if (typeof text === 'string' && params && typeof params === 'object') {
            for (const [pKey, pVal] of Object.entries(params)) {
                text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), pVal);
            }
        }

        return text;
    }

    function applyDOM(root = document) {
        if (!root) return;

        // 1. Text elements: data-i18n="key"
        const textElements = root.querySelectorAll('[data-i18n]');
        textElements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (!key) return;
            const translated = t(key);
            if (translated && translated !== key) {
                el.textContent = translated;
            }
        });

        // 2. HTML elements: data-i18n-html="key"
        const htmlElements = root.querySelectorAll('[data-i18n-html]');
        htmlElements.forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            if (!key) return;
            const translated = t(key);
            if (translated && translated !== key) {
                el.innerHTML = translated;
            }
        });

        // 3. Placeholders: data-i18n-placeholder="key"
        const placeholderElements = root.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (!key) return;
            const translated = t(key);
            if (translated && translated !== key) {
                el.setAttribute('placeholder', translated);
            }
        });

        // 4. Tooltip / title: data-i18n-title="key"
        const titleElements = root.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (!key) return;
            const translated = t(key);
            if (translated && translated !== key) {
                el.setAttribute('title', translated);
            }
        });
    }

    function init() {
        currentLang = detectDeviceLanguage();
        if (document.documentElement) {
            document.documentElement.lang = currentLang;
        }
        applyDOM(document);
    }

    function setLanguage(langCode) {
        if (SUPPORTED_LANGS.includes(langCode)) {
            currentLang = langCode;
            try {
                localStorage.setItem('gridoria_user_language', langCode);
            } catch (e) {}
            if (document.documentElement) {
                document.documentElement.lang = currentLang;
            }
            applyDOM(document);
            if (window.game && typeof window.game.updateMainMenuStats === 'function') {
                window.game.updateMainMenuStats();
            }
        }
    }

    function getQuotes() {
        const langPack = TRANSLATIONS[currentLang] || TRANSLATIONS['en'] || TRANSLATIONS['tr'];
        return langPack.quotes || TRANSLATIONS['en'].quotes;
    }

    // Expose global window.i18n
    window.i18n = {
        SUPPORTED_LANGS,
        init,
        t,
        applyDOM,
        getLang: () => currentLang,
        getLocale: () => currentLang === 'tr' ? 'tr-TR' : (currentLang === 'es' ? 'es-ES' : (currentLang === 'de' ? 'de-DE' : (currentLang === 'fr' ? 'fr-FR' : (currentLang === 'pt' ? 'pt-BR' : (currentLang === 'it' ? 'it-IT' : (currentLang === 'ru' ? 'ru-RU' : 'en-US')))))),
        setLanguage,
        getQuotes
    };

    // Auto run on DOMContentLoaded or immediate if already ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
