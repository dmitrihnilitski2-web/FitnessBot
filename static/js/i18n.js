/* =========================================================
   FITNESS HUB PRO | ЛОКАЛІЗАЦІЯ (i18n.js)
   Містить словники та логіку перекладу інтерфейсу
   ========================================================= */

// 1. Визначаємо мову користувача
const supportedLanguages = ['uk', 'en', 'de', 'pl'];
let appLang = 'uk'; // Українська за замовчуванням (щоб не було проблем з базовими текстами)

if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
    const tgLang = window.Telegram.WebApp.initDataUnsafe.user.language_code;
    if (supportedLanguages.includes(tgLang)) {
        appLang = tgLang;
    }
}

// Глобальна змінна для доступу з інших скриптів (client.js, trainer.js, server.py)
window.appLanguage = appLang;

// 2. Словник перекладів інтерфейсу
const i18nDict = {
    'uk': {
        // --- КЛІЄНТСЬКА ЧАСТИНА ---
        'nav_profile': 'Профіль',
        'nav_plan': 'План',
        'nav_cycle': 'Цикл',
        'nav_food': 'Їжа',
        'nav_data': 'Дані',
        'nav_chat': 'Чат',
        'nav_ranks': 'Ранги',

        'title_plan': 'Ваш План',
        'title_nutrition': 'Щоденник Харчування',
        'title_analytics': 'Аналітика Тіла',
        'title_coach': 'Ваш Наставник',
        'title_cycle': 'Ваш Цикл',

        'btn_save': '💾 Зберегти зміни',
        'btn_cancel': 'Скасувати',
        'btn_close': 'Закрити',
        'btn_generate': '🚀 Згенерувати Програму',
        'btn_add_food': '➕ Записати їжу',
        'btn_add_exercise': '➕ Додати вправу',

        'card_measurements': '📏 Заміри тіла (см)',
        'card_water': '💧 Водний баланс',
        'card_macros': 'калорій спожито сьогодні',

        'alert_fill_fields': 'Будь ласка, заповніть всі обов\'язкові поля.',
        'alert_saved': 'Успішно збережено!',
        'alert_error': 'Виникла помилка. Спробуйте ще раз.',
        'loading_ai': 'ШІ думає...',
        'adapting_plan': 'Адаптація плану... ⏳',

        // --- ТРЕНЕРСЬКА ЧАСТИНА ---
        'trainer_panel_title': 'Панель Тренера',
        'tab_clients': 'Мої клієнти',
        'tab_invite': 'Запрошення',

        'ref_link_title': '🔗 Ваше реферальне посилання',
        'ref_link_desc': 'Надішліть це посилання клієнту. Коли він запустить бота, він автоматично потрапить у вашу команду.',
        'btn_copy_link': '📋 Копіювати посилання',
        'alert_copied': '✅ Посилання скопійовано! Надішліть його клієнту.',

        'client_goal': 'Ціль',
        'client_level': 'Рівень',
        'client_exp': 'Досвід',
        'client_no_clients': 'У вас ще немає клієнтів. Надішліть своє реферальне посилання, щоб додати їх!',

        'btn_back_to_list': '⬅️ Повернутися до списку',
        'client_competition': '🏆 Змагання',
        'client_cycle': '🌸 Жіночий цикл',
        'cycle_day': 'День',
        'cycle_phase': 'Фаза',

        'client_food_prefs': '⚠️ Харчові вподобання / Алергії',
        'client_write_diet': '🍏 Написати раціон харчування',
        'btn_save_diet': '💾 Надіслати раціон',
        'client_fatigue_map': 'Мапа втоми клієнта',

        // Переклад фаз для тренера
        'phase_menstruation': 'Менструація',
        'phase_follicular': 'Фолікулярна фаза',
        'phase_ovulation': 'Овуляція',
        'phase_luteal': 'Лютеїнова фаза'
    },
    'en': {
        // --- CLIENT SIDE ---
        'nav_profile': 'Profile',
        'nav_plan': 'Plan',
        'nav_cycle': 'Cycle',
        'nav_food': 'Food',
        'nav_data': 'Data',
        'nav_chat': 'Chat',
        'nav_ranks': 'Ranks',

        'title_plan': 'Your Plan',
        'title_nutrition': 'Food Diary',
        'title_analytics': 'Body Analytics',
        'title_coach': 'Your Coach',
        'title_cycle': 'Your Cycle',

        'btn_save': '💾 Save changes',
        'btn_cancel': 'Cancel',
        'btn_close': 'Close',
        'btn_generate': '🚀 Generate Plan',
        'btn_add_food': '➕ Add food',
        'btn_add_exercise': '➕ Add exercise',

        'card_measurements': '📏 Body Measurements (cm)',
        'card_water': '💧 Water Balance',
        'card_macros': 'calories consumed today',

        'alert_fill_fields': 'Please fill in all required fields.',
        'alert_saved': 'Saved successfully!',
        'alert_error': 'An error occurred. Please try again.',
        'loading_ai': 'AI is thinking...',
        'adapting_plan': 'Adapting plan... ⏳',

        // --- TRAINER SIDE ---
        'trainer_panel_title': 'Trainer Panel',
        'tab_clients': 'My Clients',
        'tab_invite': 'Invite',

        'ref_link_title': '🔗 Your referral link',
        'ref_link_desc': 'Send this link to a client. When they start the bot, they will automatically join your team.',
        'btn_copy_link': '📋 Copy link',
        'alert_copied': '✅ Link copied to clipboard!',

        'client_goal': 'Goal',
        'client_level': 'Level',
        'client_exp': 'EXP',
        'client_no_clients': 'You have no clients yet. Send your referral link to invite them!',

        'btn_back_to_list': '⬅️ Back to list',
        'client_competition': '🏆 Competition',
        'client_cycle': '🌸 Cycle',
        'cycle_day': 'Day',
        'cycle_phase': 'Phase',

        'client_food_prefs': '⚠️ Food Preferences / Allergies',
        'client_write_diet': '🍏 Write Nutrition Plan',
        'btn_save_diet': '💾 Send Plan',
        'client_fatigue_map': 'Client Fatigue Map',

        // Phases for trainer
        'phase_menstruation': 'Menstruation',
        'phase_follicular': 'Follicular phase',
        'phase_ovulation': 'Ovulation',
        'phase_luteal': 'Luteal phase'
    },
    'de': {
        // --- CLIENT SIDE ---
        'nav_profile': 'Profil',
        'nav_plan': 'Plan',
        'nav_cycle': 'Zyklus',
        'nav_food': 'Essen',
        'nav_data': 'Daten',
        'nav_chat': 'Chat',
        'nav_ranks': 'Ränge',

        'title_plan': 'Dein Plan',
        'title_nutrition': 'Ernährungstagebuch',
        'title_analytics': 'Körperanalyse',
        'title_coach': 'Dein Trainer',
        'title_cycle': 'Dein Zyklus',

        'btn_save': '💾 Speichern',
        'btn_cancel': 'Abbrechen',
        'btn_close': 'Schließen',
        'btn_generate': '🚀 Plan erstellen',
        'btn_add_food': '➕ Essen hinzufügen',
        'btn_add_exercise': '➕ Übung hinzufügen',

        'card_measurements': '📏 Körpermaße (cm)',
        'card_water': '💧 Wasserhaushalt',
        'card_macros': 'Kalorien heute verbraucht',

        'alert_fill_fields': 'Bitte füllen Sie alle Pflichtfelder aus.',
        'alert_saved': 'Erfolgreich gespeichert!',
        'alert_error': 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
        'loading_ai': 'KI denkt nach...',
        'adapting_plan': 'Plan anpassen... ⏳',

        // --- TRAINER SIDE ---
        'trainer_panel_title': 'Trainer-Panel',
        'tab_clients': 'Meine Kunden',
        'tab_invite': 'Einladen',

        'ref_link_title': '🔗 Dein Empfehlungslink',
        'ref_link_desc': 'Sende diesen Link an deinen Kunden. Er wird automatisch deinem Team hinzugefügt.',
        'btn_copy_link': '📋 Link kopieren',
        'alert_copied': '✅ Link in die Zwischenablage kopiert!',

        'client_goal': 'Ziel',
        'client_level': 'Level',
        'client_exp': 'EXP',
        'client_no_clients': 'Du hast noch keine Kunden. Sende deinen Link, um sie einzuladen!',

        'btn_back_to_list': '⬅️ Zurück zur Liste',
        'client_competition': '🏆 Wettkampf',
        'client_cycle': '🌸 Zyklus',
        'cycle_day': 'Tag',
        'cycle_phase': 'Phase',

        'client_food_prefs': '⚠️ Essensvorlieben / Allergien',
        'client_write_diet': '🍏 Ernährungsplan schreiben',
        'btn_save_diet': '💾 Plan senden',
        'client_fatigue_map': 'Ermüdungskarte des Kunden',

        // Phases for trainer
        'phase_menstruation': 'Menstruation',
        'phase_follicular': 'Follikelphase',
        'phase_ovulation': 'Eisprung',
        'phase_luteal': 'Lutealphase'
    },
    'pl': {
        // --- CLIENT SIDE ---
        'nav_profile': 'Profil',
        'nav_plan': 'Plan',
        'nav_cycle': 'Cykl',
        'nav_food': 'Dieta',
        'nav_data': 'Dane',
        'nav_chat': 'Czat',
        'nav_ranks': 'Rangi',

        'title_plan': 'Twój Plan',
        'title_nutrition': 'Dziennik żywieniowy',
        'title_analytics': 'Analiza ciała',
        'title_coach': 'Twój Trener',
        'title_cycle': 'Twój Cykl',

        'btn_save': '💾 Zapisz zmiany',
        'btn_cancel': 'Anuluj',
        'btn_close': 'Zamknij',
        'btn_generate': '🚀 Generuj Plan',
        'btn_add_food': '➕ Dodaj posiłek',
        'btn_add_exercise': '➕ Dodaj ćwiczenie',

        'card_measurements': '📏 Wymiary ciała (cm)',
        'card_water': '💧 Bilans wodny',
        'card_macros': 'kalorii spożytych dzisiaj',

        'alert_fill_fields': 'Proszę wypełnić wszystkie wymagane pola.',
        'alert_saved': 'Zapisano pomyślnie!',
        'alert_error': 'Wystąpił błąd. Spróbuj ponownie.',
        'loading_ai': 'AI myśli...',
        'adapting_plan': 'Dostosowywanie planu... ⏳',

        // --- TRAINER SIDE ---
        'trainer_panel_title': 'Panel Trenera',
        'tab_clients': 'Moi Klienci',
        'tab_invite': 'Zaproś',

        'ref_link_title': '🔗 Twój link polecający',
        'ref_link_desc': 'Wyślij ten link klientowi. Po uruchomieniu bota automatycznie dołączy do Twojego zespołu.',
        'btn_copy_link': '📋 Kopiuj link',
        'alert_copied': '✅ Link skopiowany do schowka!',

        'client_goal': 'Cel',
        'client_level': 'Poziom',
        'client_exp': 'EXP',
        'client_no_clients': 'Nie masz jeszcze klientów. Wyślij swój link, aby ich zaprosić!',

        'btn_back_to_list': '⬅️ Wróć do listy',
        'client_competition': '🏆 Zawody',
        'client_cycle': '🌸 Cykl',
        'cycle_day': 'Dzień',
        'cycle_phase': 'Faza',

        'client_food_prefs': '⚠️ Preferencje żywieniowe / Alergie',
        'client_write_diet': '🍏 Napisz plan diety',
        'btn_save_diet': '💾 Wyślij plan',
        'client_fatigue_map': 'Mapa zmęczenia klienta',

        // Phases for trainer
        'phase_menstruation': 'Menstruacja',
        'phase_follicular': 'Faza folikularna',
        'phase_ovulation': 'Owuacja',
        'phase_luteal': 'Faza lutealna'
    }
};

// 3. Зворотна сумісність: стара функція t()
function t(key) {
    const dict = i18nDict[appLang] || i18nDict['en'] || i18nDict['uk'];
    return dict[key] || key;
}

// 4. ГЛОБАЛЬНА ФУНКЦІЯ ЛОКАЛІЗАЦІЇ (працює скрізь)
window.loc = function(key, fallback) {
    const dict = i18nDict[appLang] || i18nDict['en'] || i18nDict['uk'];
    if (dict && dict[key]) {
        return dict[key];
    }
    return fallback !== undefined ? fallback : key;
};

// 5. Функція автоматичного перекладу всього HTML (для статичних елементів)
function applyLocalization() {
    const dict = i18nDict[appLang] || i18nDict['en'] || i18nDict['uk'];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.innerHTML = dict[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) {
            el.placeholder = dict[key];
        }
    });
}

document.addEventListener('DOMContentLoaded', applyLocalization);