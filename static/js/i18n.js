/* =========================================================
   FITNESS HUB PRO | ЛОКАЛІЗАЦІЯ (i18n.js)
   Повний словник перекладу екосистеми (Клієнт + Тренер)
   ========================================================= */

// 1. Визначаємо мову користувача
const supportedLanguages = ['uk', 'en', 'de', 'pl'];
let appLang = 'uk'; // Українська за замовчуванням

if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
    const tgLang = window.Telegram.WebApp.initDataUnsafe.user.language_code;
    if (supportedLanguages.includes(tgLang)) {
        appLang = tgLang;
    }
}

// Глобальна змінна для доступу з інших скриптів
window.appLanguage = appLang;

// 2. Повний словник перекладів
const i18nDict = {
    'uk': {
        // --- НАВІГАЦІЯ ---
        'nav_profile': 'Профіль', 'nav_plan': 'План', 'nav_cycle': 'Цикл', 'nav_food': 'Їжа', 'nav_data': 'Дані', 'nav_chat': 'Чат', 'nav_ranks': 'Ранги',
        'trainer_nav_team': 'Моя Команда', 'trainer_nav_exit': 'Вийти в Хаб',

        // --- ЗАГАЛЬНІ ЕЛЕМЕНТИ / КНОПКИ ---
        'btn_save': '💾 Зберегти', 'btn_cancel': 'Скасувати', 'btn_close': 'Закрити', 'btn_generate': '🚀 Згенерувати Програму',
        'btn_add_food': '➕ Записати', 'btn_add_exercise': '➕ Додати вправу', 'btn_admin': '⚙️ Супер Адмін Панель',
        'btn_trainer_panel': '👨‍🏫 Відкрити панель Тренера', 'btn_trainer': '🎓 Стати Тренером', 'btn_edit_data': 'Дані',
        'btn_settings': 'Налаштувати', 'btn_rebuild_plan': '🔄 Перебудувати план', 'btn_save_for_coach': 'Зберегти для тренера',
        'btn_adapt_workout': 'Адаптувати тренування', 'btn_photo_food': '📸 Аналіз по фото', 'btn_scan_barcode': '🔍 Сканувати штрих-код',
        'btn_close_scanner': 'Закрити сканер', 'btn_manual_barcode': 'Ввести цифри вручну', 'btn_save_metrics': 'Зберегти заміри',
        'btn_ask_question': 'Задати питання', 'btn_send_video': 'Надіслати відео на розбір', 'btn_save_set': 'Записати і Відпочити',
        'btn_skip_timer': 'Пропустити таймер', 'btn_cancel_comp': 'Скасувати підготовку', 'btn_eat_recipe': 'Записати в щоденник',

        'loading_ai': 'Завантаження...', 'adapting_plan': 'Адаптація плану... ⏳', 'alert_fill_fields': 'Будь ласка, заповніть всі поля.',
        'alert_saved': 'Успішно збережено!', 'alert_error': 'Виникла помилка. Спробуйте ще раз.', 'alert_copied': '✅ Посилання скопійовано!',

        // --- СТВОРЕННЯ ПРОФІЛЮ ТА ЦІЛІ ---
        'title_create_profile': 'Створити Профіль', 'desc_create_profile': 'Система індивідуально розрахує персональний макро- та мікроцикл.',
        'label_name': 'Ім\'я', 'placeholder_name': 'Як до вас звертатися?', 'label_gender': 'Стать', 'gender_male': 'Чоловіча', 'gender_female': 'Жіноча',
        'label_age': 'Вік', 'placeholder_age': 'Років', 'label_height': 'Зріст (см)', 'label_weight': 'Вага (кг)', 'label_target_weight': 'Цільова вага (кг)',
        'label_goal': 'Ваша головна ціль', 'goal_lose': 'Схуднення / Сушка 🔥', 'goal_maintain': 'Підтримка форми ⚖️', 'goal_gain': 'Набір маси 💪',
        'goal_strength': 'Максимальна сила 🏋️', 'goal_endurance': 'Витривалість 🏃', 'goal_competition': '🏆 Підготовка до змагань', 'goal_custom': 'Своя специфічна ціль 🎯',
        'label_custom_goal': 'Опишіть вашу ціль', 'comp_sport_label': 'Ваш вид спорту', 'comp_date_label': 'Дата змагань (Пік форми)',
        'label_activity': 'Рівень активності', 'act_sedentary': 'Сидячий (офіс)', 'act_light': 'Легкий (1-3 р/тиж)', 'act_medium': 'Середній (3-5 р/тиж)',
        'act_active': 'Високий (6-7 р/тиж)', 'act_very_active': 'Дуже високий', 'label_notes': 'Особливості (травми, побажання)',

        // --- ПРОФІЛЬ / ДАШБОРД ---
        'greeting': 'Привіт', 'default_athlete': 'Атлет', 'level_short': 'Рв.', 'kg': 'кг', 'cm': 'см', 'in_team': 'В команді: ',
        'coach_active_text': 'Ваш персональний тренер <b>{name}</b> завжди на зв\'язку.', 'coach_ai_text': 'У вас поки немає тренера. Ви працюєте з ШІ-наставником.',
        'title_my_comp': '🏆 Мої змагання', 'comp_date_short': 'Дата:', 'comp_empty_desc': 'Ви не готуєтесь до змагань. Бажаєте побудувати макроцикл?',
        'title_phys_data': 'Фізичні дані', 'stat_cur_weight': 'Поточна вага', 'stat_target_weight': 'Цільова вага', 'stat_height': 'Зріст', 'stat_age': 'Вік',
        'stat_cur_goal': 'Поточна ціль:', 'stat_activity': 'Активність:', 'title_ai_adapt': 'ШІ-Адаптація', 'desc_ai_adapt': 'Отримали травму? Змінився графік? Напишіть сюди.',
        'client_food_prefs': 'Вподобання та Алергії', 'desc_allergies': 'Опишіть, що ви не їсте, щоб тренер склав ідеальний раціон.',
        'dash_comp_prep': 'Підготовка до:', 'comp_days_left': '⏳ Залишилось {days} днів!', 'comp_today': '🔥 Змагання СЬОГОДНІ!', 'comp_passed': '🏁 Змагання пройшли',

        // --- ГЕЙМІФІКАЦІЯ (Ранги) ---
        'level_word': 'РІВЕНЬ', 'how_to_earn_exp': 'Як заробляти досвід?', 'exp_rule_1': 'Виконаний підхід', 'exp_rule_2': 'Запис їжі', 'exp_rule_3': 'Чек-ін',
        'title_team_leaderboard': 'Рейтинг команди', 'label_by_exp': 'за EXP', 'title_achievements': 'Ваші Досягнення', 'achieve_done': 'Виконано!',

        // --- ТРЕНУВАННЯ ---
        'title_plan': 'Ваш План', 'ai_insight_title': 'Тренувальний цикл', 'ai_proj_title': 'Розрахунковий прогноз',
        'chk_title': 'Як ви себе почуваєте?', 'chk_sleep': 'Сон (1 - жахливо, 10 - ідеально)', 'chk_energy': 'Енергія (1 - розбитий, 10 - повен сил)',
        'chk_stress': 'Стрес (1 - дуже низький, 10 - паніка)', 'chk_soreness': 'Біль (1 - нічого, 10 - все болить)', 'msg_from_coach': 'Повідомлення Тренера',
        'title_edit_profile': 'Редагувати дані', 'title_edit_food': 'Редагувати запис', 'label_ex_name': 'Назва вправи', 'label_sets': 'Підходи',
        'label_reps_time': 'Повторення', 'target_muscles': 'Цільові м`язи:', 'instruction': 'Інструкція:', 'title_comp_settings': 'Налаштування',
        'timer_title': 'Час відновлення',

        // --- ХАРЧУВАННЯ ---
        'title_nutrition': 'Харчування', 'title_coach_diet': 'Раціон від тренера', 'card_water': 'Водний баланс', 'card_macros': 'калорій спожито',
        'macro_protein': 'Білки', 'macro_fats': 'Жири', 'macro_carbs': 'Вуглеводи', 'title_ai_fridge': 'ШІ-Кухар', 'desc_ai_fridge': 'Напишіть, що є в холодильнику.',
        'placeholder_fridge': 'Що є в холодильнику?', 'btn_fridge_gen': 'Придумати рецепт', 'title_add_food_manual': 'Додати вручну', 'label_dish_name': 'Назва страви',
        'label_weight_g': 'Вага (г)', 'label_cals': 'Калорії', 'label_p': 'Білки', 'label_f': 'Жири', 'label_c': 'Вугл.', 'title_history_today': 'Історія за сьогодні',

        // --- АНАЛІТИКА ---
        'title_analytics': 'Аналітика Тіла', 'title_muscle_recovery': 'Відновлення м\'язів', 'map_front': 'ПЕРЕД', 'map_back': 'ЗАД',
        'map_legend_fresh': 'Свіжі', 'map_legend_process': 'В процесі', 'map_legend_tired': 'Втомлені', 'title_weight_chart': 'Динаміка ваги',
        'card_measurements': 'Заміри тіла (см)', 'title_metrics_chart': 'Прогрес об\'ємів', 'title_work_weight_chart': 'Прогрес робочих ваг',

        // --- ЦИКЛ ---
        'title_cycle': 'Ваш Цикл', 'btn_log_period': 'Відмітити початок циклу', 'title_symptoms': 'Симптоми сьогодні', 'symp_flow': 'Виділення',
        'symp_light': 'Легкі', 'symp_medium': 'Середні', 'symp_heavy': 'Рясні', 'symp_pain': 'Біль / Спазми', 'symp_none': 'Немає', 'symp_mild': 'Легкий',
        'symp_severe': 'Сильний', 'symp_mood': 'Настрій', 'symp_calm': 'Спокійний', 'symp_sad': 'Сумний', 'symp_irritated': 'Дратівливий',
        'title_ai_cycle': 'Аналіз циклу', 'cycle_start_label': 'Перший день циклу', 'cycle_length_label': 'Тривалість (днів)', 'cycle_day': 'День',
        'phase_menstruation': 'Менструація', 'phase_follicular': 'Фолікулярна фаза', 'phase_ovulation': 'Овуляція', 'phase_luteal': 'Лютеїнова фаза',

        // --- ПАНЕЛЬ ТРЕНЕРА ---
        'trainer_panel_title': 'Панель Тренера', 'trainer_title_my_team': 'Моя Команда', 'trainer_invite_link_title': 'Запросити клієнта',
        'trainer_invite_desc': 'Надішліть це посилання новому клієнту. Він автоматично додасться до команди.', 'trainer_btn_copy': '📋 Скопіювати посилання',
        'trainer_title_client_list': 'Список клієнтів', 'tab_progress': 'Прогрес', 'tab_training_plan': 'Програма', 'tab_nutrition': 'Харчування',
        'trainer_ai_assist': 'ШІ-Асистент', 'trainer_ai_desc': 'Напишіть, що змінити в плані, і ШІ перепише його.', 'trainer_diet_plan': 'Персональний раціон',
        'trainer_diet_desc': 'Напишіть рекомендації по харчуванню.', 'trainer_btn_save_diet': '💾 Зберегти раціон', 'trainer_today_nutrition': 'Спожито сьогодні',
        'client_fatigue_map': 'Мапа втоми клієнта', 'client_goal': 'Ціль', 'client_no_clients': 'У вас поки немає клієнтів.'
    },

    'en': {
        'nav_profile': 'Profile', 'nav_plan': 'Plan', 'nav_cycle': 'Cycle', 'nav_food': 'Food', 'nav_data': 'Data', 'nav_chat': 'Chat', 'nav_ranks': 'Ranks',
        'trainer_nav_team': 'My Team', 'trainer_nav_exit': 'Exit to Hub',

        'btn_save': '💾 Save', 'btn_cancel': 'Cancel', 'btn_close': 'Close', 'btn_generate': '🚀 Generate Plan',
        'btn_add_food': '➕ Add', 'btn_add_exercise': '➕ Add exercise', 'btn_admin': '⚙️ Super Admin Panel',
        'btn_trainer_panel': '👨‍🏫 Open Trainer Panel', 'btn_trainer': '🎓 Become a Trainer', 'btn_edit_data': 'Data',
        'btn_settings': 'Settings', 'btn_rebuild_plan': '🔄 Rebuild plan', 'btn_save_for_coach': 'Save for coach',
        'btn_adapt_workout': 'Adapt workout', 'btn_photo_food': '📸 Photo Analysis', 'btn_scan_barcode': '🔍 Scan Barcode',
        'btn_close_scanner': 'Close scanner', 'btn_manual_barcode': 'Enter numbers manually', 'btn_save_metrics': 'Save metrics',
        'btn_ask_question': 'Ask a question', 'btn_send_video': 'Send video for review', 'btn_save_set': 'Log and Rest',
        'btn_skip_timer': 'Skip timer', 'btn_cancel_comp': 'Cancel preparation', 'btn_eat_recipe': 'Log to diary',

        'loading_ai': 'Loading...', 'adapting_plan': 'Adapting plan... ⏳', 'alert_fill_fields': 'Please fill in all fields.',
        'alert_saved': 'Saved successfully!', 'alert_error': 'An error occurred. Try again.', 'alert_copied': '✅ Link copied!',

        'title_create_profile': 'Create Profile', 'desc_create_profile': 'The system will calculate your macro and microcycle.',
        'label_name': 'Name', 'placeholder_name': 'How should we call you?', 'label_gender': 'Gender', 'gender_male': 'Male', 'gender_female': 'Female',
        'label_age': 'Age', 'placeholder_age': 'Years', 'label_height': 'Height (cm)', 'label_weight': 'Weight (kg)', 'label_target_weight': 'Target weight (kg)',
        'label_goal': 'Your main goal', 'goal_lose': 'Weight Loss 🔥', 'goal_maintain': 'Maintain Weight ⚖️', 'goal_gain': 'Muscle Gain 💪',
        'goal_strength': 'Maximum Strength 🏋️', 'goal_endurance': 'Endurance 🏃', 'goal_competition': '🏆 Competition Prep', 'goal_custom': 'Custom Goal 🎯',
        'label_custom_goal': 'Describe your goal', 'comp_sport_label': 'Your sport', 'comp_date_label': 'Competition date',
        'label_activity': 'Activity Level', 'act_sedentary': 'Sedentary', 'act_light': 'Light (1-3 d/wk)', 'act_medium': 'Medium (3-5 d/wk)',
        'act_active': 'Active (6-7 d/wk)', 'act_very_active': 'Very Active', 'label_notes': 'Notes (injuries, wishes)',

        'greeting': 'Hello', 'default_athlete': 'Athlete', 'level_short': 'Lvl', 'kg': 'kg', 'cm': 'cm', 'in_team': 'In team: ',
        'coach_active_text': 'Your personal coach <b>{name}</b> is always in touch.', 'coach_ai_text': 'You have an AI-coach for now.',
        'title_my_comp': '🏆 My Competitions', 'comp_date_short': 'Date:', 'comp_empty_desc': 'You are not preparing for a competition.',
        'title_phys_data': 'Physical Data', 'stat_cur_weight': 'Current weight', 'stat_target_weight': 'Target weight', 'stat_height': 'Height', 'stat_age': 'Age',
        'stat_cur_goal': 'Current goal:', 'stat_activity': 'Activity:', 'title_ai_adapt': 'AI Adaptation', 'desc_ai_adapt': 'Got injured? Schedule changed? Write here.',
        'client_food_prefs': 'Preferences & Allergies', 'desc_allergies': 'Describe what you do not eat.',
        'dash_comp_prep': 'Prep for:', 'comp_days_left': '⏳ {days} days left!', 'comp_today': '🔥 Competition is TODAY!', 'comp_passed': '🏁 Competition passed',

        'level_word': 'LEVEL', 'how_to_earn_exp': 'How to earn EXP?', 'exp_rule_1': 'Completed set', 'exp_rule_2': 'Food log', 'exp_rule_3': 'Check-in',
        'title_team_leaderboard': 'Team Leaderboard', 'label_by_exp': 'by EXP', 'title_achievements': 'Your Achievements', 'achieve_done': 'Completed!',

        'title_plan': 'Your Plan', 'ai_insight_title': 'Training Cycle', 'ai_proj_title': 'Calculated Projection',
        'chk_title': 'How are you feeling?', 'chk_sleep': 'Sleep', 'chk_energy': 'Energy', 'chk_stress': 'Stress', 'chk_soreness': 'Soreness', 'msg_from_coach': 'Message from Coach',
        'title_edit_profile': 'Edit data', 'title_edit_food': 'Edit record', 'label_ex_name': 'Exercise name', 'label_sets': 'Sets',
        'label_reps_time': 'Reps', 'target_muscles': 'Target muscles:', 'instruction': 'Instruction:', 'title_comp_settings': 'Settings', 'timer_title': 'Recovery time',

        'title_nutrition': 'Nutrition', 'title_coach_diet': 'Diet from coach', 'card_water': 'Water Balance', 'card_macros': 'calories consumed',
        'macro_protein': 'Protein', 'macro_fats': 'Fats', 'macro_carbs': 'Carbs', 'title_ai_fridge': 'AI Chef', 'desc_ai_fridge': 'Write what products you have.',
        'placeholder_fridge': 'What is in the fridge?', 'btn_fridge_gen': 'Generate recipe', 'title_add_food_manual': 'Add manually', 'label_dish_name': 'Dish name',
        'label_weight_g': 'Weight (g)', 'label_cals': 'Calories', 'label_p': 'Protein', 'label_f': 'Fats', 'label_c': 'Carbs', 'title_history_today': 'History for today',

        'title_analytics': 'Body Analytics', 'title_muscle_recovery': 'Muscle recovery', 'map_front': 'FRONT', 'map_back': 'BACK',
        'map_legend_fresh': 'Fresh', 'map_legend_process': 'In process', 'map_legend_tired': 'Tired', 'title_weight_chart': 'Weight dynamics',
        'card_measurements': 'Body Measurements (cm)', 'title_metrics_chart': 'Volume progress', 'title_work_weight_chart': 'Working weight progress',

        'title_cycle': 'Your Cycle', 'btn_log_period': 'Log period start', 'title_symptoms': 'Symptoms today', 'symp_flow': 'Flow',
        'symp_light': 'Light', 'symp_medium': 'Medium', 'symp_heavy': 'Heavy', 'symp_pain': 'Pain', 'symp_none': 'None', 'symp_mild': 'Mild',
        'symp_severe': 'Severe', 'symp_mood': 'Mood', 'symp_calm': 'Calm', 'symp_sad': 'Sad', 'symp_irritated': 'Irritated',
        'title_ai_cycle': 'Cycle Analysis', 'cycle_start_label': 'First day of cycle', 'cycle_length_label': 'Length (days)', 'cycle_day': 'Day',
        'phase_menstruation': 'Menstruation', 'phase_follicular': 'Follicular phase', 'phase_ovulation': 'Ovulation', 'phase_luteal': 'Luteal phase',

        'trainer_panel_title': 'Trainer Panel', 'trainer_title_my_team': 'My Team', 'trainer_invite_link_title': 'Invite a client',
        'trainer_invite_desc': 'Send this link to a new client. They will join your team.', 'trainer_btn_copy': '📋 Copy Link',
        'trainer_title_client_list': 'Client List', 'tab_progress': 'Progress', 'tab_training_plan': 'Plan', 'tab_nutrition': 'Nutrition',
        'trainer_ai_assist': 'AI Assistant', 'trainer_ai_desc': 'Write what to change in the plan, and AI will rewrite it.', 'trainer_diet_plan': 'Personal Diet',
        'trainer_diet_desc': 'Write nutrition recommendations.', 'trainer_btn_save_diet': '💾 Save Diet', 'trainer_today_nutrition': 'Consumed Today',
        'client_fatigue_map': 'Client Fatigue Map', 'client_goal': 'Goal', 'client_no_clients': 'You have no clients yet.'
    },

    'de': {
        'nav_profile': 'Profil', 'nav_plan': 'Plan', 'nav_cycle': 'Zyklus', 'nav_food': 'Essen', 'nav_data': 'Daten', 'nav_chat': 'Chat', 'nav_ranks': 'Ränge',
        'trainer_nav_team': 'Mein Team', 'trainer_nav_exit': 'Zum Hub',

        'btn_save': '💾 Speichern', 'btn_cancel': 'Abbrechen', 'btn_close': 'Schließen', 'btn_generate': '🚀 Plan erstellen',
        'btn_add_food': '➕ Hinzufügen', 'btn_add_exercise': '➕ Übung hinzufügen', 'btn_admin': '⚙️ Admin-Panel',
        'btn_trainer_panel': '👨‍🏫 Trainer-Panel', 'btn_trainer': '🎓 Trainer werden', 'btn_edit_data': 'Daten',
        'btn_settings': 'Einstellungen', 'btn_rebuild_plan': '🔄 Plan neu erstellen', 'btn_save_for_coach': 'Für Trainer speichern',
        'btn_adapt_workout': 'Training anpassen', 'btn_photo_food': '📸 Foto-Analyse', 'btn_scan_barcode': '🔍 Barcode scannen',
        'btn_close_scanner': 'Scanner schließen', 'btn_manual_barcode': 'Zahlen manuell eingeben', 'btn_save_metrics': 'Maße speichern',
        'btn_ask_question': 'Frage stellen', 'btn_send_video': 'Video senden', 'btn_save_set': 'Eintragen und Ausruhen',
        'btn_skip_timer': 'Timer überspringen', 'btn_cancel_comp': 'Vorbereitung abbrechen', 'btn_eat_recipe': 'Ins Tagebuch eintragen',

        'loading_ai': 'Lädt...', 'adapting_plan': 'Plan anpassen... ⏳', 'alert_fill_fields': 'Bitte alle Felder ausfüllen.',
        'alert_saved': 'Erfolgreich gespeichert!', 'alert_error': 'Ein Fehler ist aufgetreten.', 'alert_copied': '✅ Link kopiert!',

        'title_create_profile': 'Profil erstellen', 'desc_create_profile': 'Das System berechnet deinen Zyklus.',
        'label_name': 'Name', 'placeholder_name': 'Wie dürfen wir dich nennen?', 'label_gender': 'Geschlecht', 'gender_male': 'Männlich', 'gender_female': 'Weiblich',
        'label_age': 'Alter', 'placeholder_age': 'Jahre', 'label_height': 'Größe (cm)', 'label_weight': 'Gewicht (kg)', 'label_target_weight': 'Zielgewicht (kg)',
        'label_goal': 'Dein Ziel', 'goal_lose': 'Abnehmen 🔥', 'goal_maintain': 'Gewicht halten ⚖️', 'goal_gain': 'Muskelaufbau 💪',
        'goal_strength': 'Maximalkraft 🏋️', 'goal_endurance': 'Ausdauer 🏃', 'goal_competition': '🏆 Wettkampfvorbereitung', 'goal_custom': 'Eigenes Ziel 🎯',
        'label_custom_goal': 'Beschreibe dein Ziel', 'comp_sport_label': 'Deine Sportart', 'comp_date_label': 'Wettkampfdatum',
        'label_activity': 'Aktivität', 'act_sedentary': 'Sitzend', 'act_light': 'Leicht', 'act_medium': 'Mittel', 'act_active': 'Aktiv', 'act_very_active': 'Sehr Aktiv',
        'label_notes': 'Notizen (Verletzungen)',

        'greeting': 'Hallo', 'default_athlete': 'Athlet', 'level_short': 'Lvl', 'kg': 'kg', 'cm': 'cm', 'in_team': 'Im Team: ',
        'coach_active_text': 'Dein Trainer <b>{name}</b> ist immer erreichbar.', 'coach_ai_text': 'Du hast vorerst einen KI-Trainer.',
        'title_my_comp': '🏆 Meine Wettkämpfe', 'comp_date_short': 'Datum:', 'comp_empty_desc': 'Du bereitest dich auf keinen Wettkampf vor.',
        'title_phys_data': 'Physische Daten', 'stat_cur_weight': 'Aktuelles Gewicht', 'stat_target_weight': 'Zielgewicht', 'stat_height': 'Größe', 'stat_age': 'Alter',
        'stat_cur_goal': 'Aktuelles Ziel:', 'stat_activity': 'Aktivität:', 'title_ai_adapt': 'KI-Anpassung', 'desc_ai_adapt': 'Verletzt? Zeitplan geändert? Schreib hier.',
        'client_food_prefs': 'Vorlieben & Allergien', 'desc_allergies': 'Beschreibe, was du nicht isst.',
        'dash_comp_prep': 'Vorbereitung auf:', 'comp_days_left': '⏳ Noch {days} Tage!', 'comp_today': '🔥 Wettkampf ist HEUTE!', 'comp_passed': '🏁 Wettkampf vorbei',

        'level_word': 'LEVEL', 'how_to_earn_exp': 'Wie sammelt man EXP?', 'exp_rule_1': 'Absolvierter Satz', 'exp_rule_2': 'Essen eintragen', 'exp_rule_3': 'Check-in',
        'title_team_leaderboard': 'Team-Rangliste', 'label_by_exp': 'nach EXP', 'title_achievements': 'Deine Erfolge', 'achieve_done': 'Erledigt!',

        'title_plan': 'Dein Plan', 'ai_insight_title': 'Trainingszyklus', 'ai_proj_title': 'Prognose',
        'chk_title': 'Wie fühlst du dich?', 'chk_sleep': 'Schlaf', 'chk_energy': 'Energie', 'chk_stress': 'Stress', 'chk_soreness': 'Muskelkater', 'msg_from_coach': 'Nachricht vom Trainer',
        'title_edit_profile': 'Daten bearbeiten', 'title_edit_food': 'Eintrag bearbeiten', 'label_ex_name': 'Übungsname', 'label_sets': 'Sätze',
        'label_reps_time': 'Wiederholungen', 'target_muscles': 'Zielmuskeln:', 'instruction': 'Anleitung:', 'title_comp_settings': 'Einstellungen', 'timer_title': 'Erholungszeit',

        'title_nutrition': 'Ernährung', 'title_coach_diet': 'Ernährung vom Trainer', 'card_water': 'Wasserhaushalt', 'card_macros': 'Kalorien verbraucht',
        'macro_protein': 'Protein', 'macro_fats': 'Fette', 'macro_carbs': 'Kohlenhydrate', 'title_ai_fridge': 'KI-Koch', 'desc_ai_fridge': 'Schreibe, welche Produkte du hast.',
        'placeholder_fridge': 'Was ist im Kühlschrank?', 'btn_fridge_gen': 'Rezept generieren', 'title_add_food_manual': 'Manuell hinzufügen', 'label_dish_name': 'Gerichtsname',
        'label_weight_g': 'Gewicht (g)', 'label_cals': 'Kalorien', 'label_p': 'Protein', 'label_f': 'Fette', 'label_c': 'Kohlenhydrate', 'title_history_today': 'Verlauf für heute',

        'title_analytics': 'Körperanalyse', 'title_muscle_recovery': 'Muskelregeneration', 'map_front': 'VORNE', 'map_back': 'HINTEN',
        'map_legend_fresh': 'Frisch', 'map_legend_process': 'Im Prozess', 'map_legend_tired': 'Müde', 'title_weight_chart': 'Gewichtsdynamik',
        'card_measurements': 'Körpermaße (cm)', 'title_metrics_chart': 'Umfang-Fortschritt', 'title_work_weight_chart': 'Arbeitsgewicht-Fortschritt',

        'title_cycle': 'Dein Zyklus', 'btn_log_period': 'Zyklusstart eintragen', 'title_symptoms': 'Symptome heute', 'symp_flow': 'Blutung',
        'symp_light': 'Leicht', 'symp_medium': 'Mittel', 'symp_heavy': 'Stark', 'symp_pain': 'Schmerz', 'symp_none': 'Keine', 'symp_mild': 'Leicht',
        'symp_severe': 'Stark', 'symp_mood': 'Stimmung', 'symp_calm': 'Ruhig', 'symp_sad': 'Traurig', 'symp_irritated': 'Gereizt',
        'title_ai_cycle': 'Zyklusanalyse', 'cycle_start_label': 'Erster Tag des Zyklus', 'cycle_length_label': 'Länge (Tage)', 'cycle_day': 'Tag',
        'phase_menstruation': 'Menstruation', 'phase_follicular': 'Follikelphase', 'phase_ovulation': 'Eisprung', 'phase_luteal': 'Lutealphase',

        'trainer_panel_title': 'Trainer-Panel', 'trainer_title_my_team': 'Mein Team', 'trainer_invite_link_title': 'Kunde einladen',
        'trainer_invite_desc': 'Senden Sie diesen Link an einen neuen Kunden.', 'trainer_btn_copy': '📋 Link kopieren',
        'trainer_title_client_list': 'Kundenliste', 'tab_progress': 'Fortschritt', 'tab_training_plan': 'Plan', 'tab_nutrition': 'Ernährung',
        'trainer_ai_assist': 'KI-Assistent', 'trainer_ai_desc': 'Schreiben Sie, was im Plan geändert werden soll.', 'trainer_diet_plan': 'Persönlicher Ernährungsplan',
        'trainer_diet_desc': 'Schreiben Sie Ernährungsempfehlungen.', 'trainer_btn_save_diet': '💾 Diät speichern', 'trainer_today_nutrition': 'Heute verbraucht',
        'client_fatigue_map': 'Ermüdungskarte', 'client_goal': 'Ziel', 'client_no_clients': 'Du hast noch keine Kunden.'
    },

    'pl': {
        'nav_profile': 'Profil', 'nav_plan': 'Plan', 'nav_cycle': 'Cykl', 'nav_food': 'Dieta', 'nav_data': 'Dane', 'nav_chat': 'Czat', 'nav_ranks': 'Rangi',
        'trainer_nav_team': 'Mój Zespół', 'trainer_nav_exit': 'Wyjdź do Hubu',

        'btn_save': '💾 Zapisz', 'btn_cancel': 'Anuluj', 'btn_close': 'Zamknij', 'btn_generate': '🚀 Generuj Plan',
        'btn_add_food': '➕ Dodaj', 'btn_add_exercise': '➕ Dodaj ćwiczenie', 'btn_admin': '⚙️ Panel Admina',
        'btn_trainer_panel': '👨‍🏫 Panel Trenera', 'btn_trainer': '🎓 Zostań Trenerem', 'btn_edit_data': 'Dane',
        'btn_settings': 'Ustawienia', 'btn_rebuild_plan': '🔄 Przebuduj plan', 'btn_save_for_coach': 'Zapisz dla trenera',
        'btn_adapt_workout': 'Dostosuj trening', 'btn_photo_food': '📸 Analiza ze zdjęcia', 'btn_scan_barcode': '🔍 Skanuj kod',
        'btn_close_scanner': 'Zamknij skaner', 'btn_manual_barcode': 'Wpisz cyfry ręcznie', 'btn_save_metrics': 'Zapisz wymiary',
        'btn_ask_question': 'Zadaj pytanie', 'btn_send_video': 'Wyślij wideo', 'btn_save_set': 'Zapisz i odpocznij',
        'btn_skip_timer': 'Pomiń stoper', 'btn_cancel_comp': 'Anuluj przygotowania', 'btn_eat_recipe': 'Zapisz do dziennika',

        'loading_ai': 'Ładowanie...', 'adapting_plan': 'Dostosowywanie... ⏳', 'alert_fill_fields': 'Proszę wypełnić wszystkie pola.',
        'alert_saved': 'Zapisano pomyślnie!', 'alert_error': 'Wystąpił błąd.', 'alert_copied': '✅ Link skopiowany!',

        'title_create_profile': 'Utwórz Profil', 'desc_create_profile': 'System obliczy Twój makro i mikrocykl.',
        'label_name': 'Imię', 'placeholder_name': 'Jak się do Ciebie zwracać?', 'label_gender': 'Płeć', 'gender_male': 'Mężczyzna', 'gender_female': 'Kobieta',
        'label_age': 'Wiek', 'placeholder_age': 'Lata', 'label_height': 'Wzrost (cm)', 'label_weight': 'Waga (kg)', 'label_target_weight': 'Docelowa waga (kg)',
        'label_goal': 'Twój cel', 'goal_lose': 'Odchudzanie 🔥', 'goal_maintain': 'Utrzymanie wagi ⚖️', 'goal_gain': 'Budowa masy 💪',
        'goal_strength': 'Maksymalna siła 🏋️', 'goal_endurance': 'Wytrzymałość 🏃', 'goal_competition': '🏆 Zawody', 'goal_custom': 'Własny cel 🎯',
        'label_custom_goal': 'Opisz swój cel', 'comp_sport_label': 'Twój sport', 'comp_date_label': 'Data zawodów',
        'label_activity': 'Aktywność', 'act_sedentary': 'Siedzący', 'act_light': 'Lekki', 'act_medium': 'Średni', 'act_active': 'Aktywny', 'act_very_active': 'Bardzo aktywny',
        'label_notes': 'Notatki (kontuzje)',

        'greeting': 'Cześć', 'default_athlete': 'Sportowiec', 'level_short': 'Poz.', 'kg': 'kg', 'cm': 'cm', 'in_team': 'W zespole: ',
        'coach_active_text': 'Twój trener <b>{name}</b> jest w stałym kontakcie.', 'coach_ai_text': 'Na razie masz trenera AI.',
        'title_my_comp': '🏆 Moje zawody', 'comp_date_short': 'Data:', 'comp_empty_desc': 'Nie przygotowujesz się do zawodów.',
        'title_phys_data': 'Dane fizyczne', 'stat_cur_weight': 'Obecna waga', 'stat_target_weight': 'Docelowa waga', 'stat_height': 'Wzrost', 'stat_age': 'Wiek',
        'stat_cur_goal': 'Obecny cel:', 'stat_activity': 'Aktywność:', 'title_ai_adapt': 'Adaptacja AI', 'desc_ai_adapt': 'Kontuzja? Zmiana planów? Napisz tutaj.',
        'client_food_prefs': 'Preferencje i Alergie', 'desc_allergies': 'Opisz, czego nie jesz.',
        'dash_comp_prep': 'Przygotowanie do:', 'comp_days_left': '⏳ Zostało {days} dni!', 'comp_today': '🔥 Zawody są DZIŚ!', 'comp_passed': '🏁 Zawody minęły',

        'level_word': 'POZIOM', 'how_to_earn_exp': 'Jak zdobywać EXP?', 'exp_rule_1': 'Ukończona seria', 'exp_rule_2': 'Zapis posiłku', 'exp_rule_3': 'Check-in',
        'title_team_leaderboard': 'Ranking zespołu', 'label_by_exp': 'według EXP', 'title_achievements': 'Twoje Osiągnięcia', 'achieve_done': 'Ukończono!',

        'title_plan': 'Twój Plan', 'ai_insight_title': 'Cykl treningowy', 'ai_proj_title': 'Prognoza',
        'chk_title': 'Jak się czujesz?', 'chk_sleep': 'Sen', 'chk_energy': 'Energia', 'chk_stress': 'Stres', 'chk_soreness': 'Ból mięśni', 'msg_from_coach': 'Wiadomość od Trenera',
        'title_edit_profile': 'Edytuj dane', 'title_edit_food': 'Edytuj wpis', 'label_ex_name': 'Nazwa ćwiczenia', 'label_sets': 'Serie',
        'label_reps_time': 'Powtórzenia', 'target_muscles': 'Mięśnie docelowe:', 'instruction': 'Instrukcja:', 'title_comp_settings': 'Ustawienia', 'timer_title': 'Czas odpoczynku',

        'title_nutrition': 'Odżywianie', 'title_coach_diet': 'Dieta od trenera', 'card_water': 'Bilans wodny', 'card_macros': 'spożyte kalorie',
        'macro_protein': 'Białko', 'macro_fats': 'Tłuszcze', 'macro_carbs': 'Węglowodany', 'title_ai_fridge': 'AI Kucharz', 'desc_ai_fridge': 'Napisz, jakie masz produkty.',
        'placeholder_fridge': 'Co masz w lodówce?', 'btn_fridge_gen': 'Wymyśl przepis', 'title_add_food_manual': 'Dodaj ręcznie', 'label_dish_name': 'Nazwa dania',
        'label_weight_g': 'Waga (g)', 'label_cals': 'Kalorie', 'label_p': 'Białko', 'label_f': 'Tłuszcze', 'label_c': 'Węglowodany', 'title_history_today': 'Historia z dzisiaj',

        'title_analytics': 'Analiza Ciała', 'title_muscle_recovery': 'Regeneracja mięśni', 'map_front': 'PRZÓD', 'map_back': 'TYŁ',
        'map_legend_fresh': 'Świeże', 'map_legend_process': 'W trakcie', 'map_legend_tired': 'Zmęczone', 'title_weight_chart': 'Dynamika wagi',
        'card_measurements': 'Wymiary ciała (cm)', 'title_metrics_chart': 'Postęp wymiarów', 'title_work_weight_chart': 'Postęp ciężarów',

        'title_cycle': 'Twój Cykl', 'btn_log_period': 'Zapisz początek cyklu', 'title_symptoms': 'Objawy dzisiaj', 'symp_flow': 'Krwawienie',
        'symp_light': 'Lekkie', 'symp_medium': 'Średnie', 'symp_heavy': 'Obfite', 'symp_pain': 'Ból', 'symp_none': 'Brak', 'symp_mild': 'Lekki',
        'symp_severe': 'Silny', 'symp_mood': 'Nastrój', 'symp_calm': 'Spokojny', 'symp_sad': 'Smutny', 'symp_irritated': 'Zirytowany',
        'title_ai_cycle': 'Analiza cyklu', 'cycle_start_label': 'Pierwszy dzień cyklu', 'cycle_length_label': 'Długość (dni)', 'cycle_day': 'Dzień',
        'phase_menstruation': 'Menstruacja', 'phase_follicular': 'Faza folikularna', 'phase_ovulation': 'Owuacja', 'phase_luteal': 'Faza lutealna',

        'trainer_panel_title': 'Panel Trenera', 'trainer_title_my_team': 'Mój Zespół', 'trainer_invite_link_title': 'Zaproś klienta',
        'trainer_invite_desc': 'Wyślij ten link nowemu klientowi. Dołączy do zespołu.', 'trainer_btn_copy': '📋 Kopiuj link',
        'trainer_title_client_list': 'Lista klientów', 'tab_progress': 'Postęp', 'tab_training_plan': 'Plan', 'tab_nutrition': 'Dieta',
        'trainer_ai_assist': 'Asystent AI', 'trainer_ai_desc': 'Napisz, co zmienić w planie, a AI to przepisze.', 'trainer_diet_plan': 'Osobista dieta',
        'trainer_diet_desc': 'Napisz zalecenia żywieniowe.', 'trainer_btn_save_diet': '💾 Zapisz dietę', 'trainer_today_nutrition': 'Spożyte dzisiaj',
        'client_fatigue_map': 'Mapa zmęczenia', 'client_goal': 'Cel', 'client_no_clients': 'Nie masz jeszcze klientów.'
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

    // Переклад текстового вмісту (враховує вкладені HTML теги всередині елемента, якщо він їх не мав)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.innerHTML = dict[key];
        }
    });

    // Переклад плейсхолдерів
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) {
            el.placeholder = dict[key];
        }
    });
}

// Запускаємо переклад після повного завантаження DOM
document.addEventListener('DOMContentLoaded', applyLocalization);