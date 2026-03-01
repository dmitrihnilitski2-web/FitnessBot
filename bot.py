import asyncio
import logging
import io
from datetime import datetime
from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import Command
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton

import config
import database
import ai_service

# Налаштування логування
logging.basicConfig(level=logging.INFO)

bot = Bot(token=config.BOT_TOKEN)
dp = Dispatcher()

# ТВІЙ ID ЯК ГОЛОВНОГО АДМІНІСТРАТОРА СИСТЕМИ
ADMIN_ID = 1100202114

# =========================================================
# СЛОВНИКИ ЛОКАЛІЗАЦІЇ (i18n для Бота)
# =========================================================
BOT_DICT = {
    'uk': {
        'btn_hub': "🚀 Відкрити Fitness Hub",
        'btn_trainer': "🎓 Я Тренер (Створити команду)",
        'btn_admin': "⚙️ Супер Адмін Панель",
        'btn_trainer_panel': "👨‍🏫 Відкрити панель Тренера",
        'btn_my_profile': "👤 Мій власний профіль",
        'welcome': "Привіт, {name}! 👋\n\nЯ твій персональний ШІ-наставник. Можеш спілкуватися зі мною тут, або відкрити свій Хаб для доступу до всіх інструментів (програма, їжа, аналітика).\n\n👇 Натискай кнопку нижче!",
        'welcome_joined': "✅ Вітаю! Ви успішно приєдналися до команди вашого тренера.\n\nВідкрийте Fitness Hub, щоб заповнити свої дані та отримати план тренувань!",
        'trainer_success': "🎉 Вітаю! Ваш акаунт успішно переведено в статус <b>Тренера</b>.\n\nТепер ви маєте доступ до спеціальної панелі, де можете:\n• Бачити всіх своїх клієнтів.\n• Писати їм персональні плани харчування.\n• Копіювати реферальне посилання.",
        'photo_wait': "📸 Бачу фото! Відправляю його на ШІ-аналіз калорійності...",
        'photo_success': "✅ **{dish_name}** розпізнано!\n\n⚖️ Вага: ~{weight}г\n🔥 Калорії: {cal} ккал\n🥩 Білки: {prot}г | 🧈 Жири: {fats}г | 🍞 Вугл: {carb}г\n\nЗапис успішно додано до вашого щоденника в Хабі!",
        'photo_fail': "На жаль, не зміг розпізнати страву. Спробуйте сфотографувати ближче або скористайтеся сканером всередині додатка.",
        'video_wait': "📹 Я отримав ваше відео виконання вправи!\n\nНаразі функція відео-аналітики техніки ШІ знаходиться на стадії тестування. Продовжуйте працювати за планом 💪",
        'error': "Щось пішло не так. Відкрийте Хаб для перегляду вашого плану!",
        'push_morning': "☀️ Доброго ранку, {name}!\n\n📊 Як ти сьогодні почуваєшся? Не забудь зайти в Хаб і заповнити чек-ін, щоб я міг адаптувати твоє тренування під поточний стан.",
        'push_water': "💧 Гей, {name}, твій водний баланс страждає!\n\nТи випив лише {water} мл з початку дня. Організм потребує гідратації. Випий склянку води просто зараз!",
        'push_evening': "🌙 Вечір близько, {name}!\n\n{alerts}\n\nЗайди в Хаб та заповни свої результати, щоб не втратити прогрес!",
        'alert_sets': "🏋️ Ти сьогодні ще не заніс жодного підходу.",
        'alert_meals': "🍏 Твій щоденник харчування порожній."
    },
    'en': {
        'btn_hub': "🚀 Open Fitness Hub",
        'btn_trainer': "🎓 I am a Trainer",
        'btn_admin': "⚙️ Super Admin Panel",
        'btn_trainer_panel': "👨‍🏫 Open Trainer Panel",
        'btn_my_profile': "👤 My Profile",
        'welcome': "Hello, {name}! 👋\n\nI am your personal AI mentor. Chat with me here, or open your Hub to access all tools.\n\n👇 Click the button below!",
        'welcome_joined': "✅ Welcome! You successfully joined your trainer's team.\n\nOpen the Fitness Hub to get your plan!",
        'trainer_success': "🎉 Congratulations! Your account is now a <b>Trainer</b> account.\n\nYou now have access to a special panel to manage clients.",
        'photo_wait': "📸 I see the photo! Sending it to AI...",
        'photo_success': "✅ **{dish_name}** recognized!\n\n⚖️ Weight: ~{weight}g\n🔥 Calories: {cal} kcal\n🥩 Protein: {prot}g | 🧈 Fats: {fats}g | 🍞 Carbs: {carb}g",
        'photo_fail': "Couldn't recognize the dish. Try again.",
        'video_wait': "📹 Video received!\n\nThe AI technique analysis is in beta testing. Keep training! 💪",
        'error': "Something went wrong.",
        'push_morning': "☀️ Good morning, {name}!\n\n📊 How are you feeling today? Fill out your check-in in the Hub.",
        'push_water': "💧 Hey {name}, you've only drunk {water} ml today. Drink some water!",
        'push_evening': "🌙 Evening is near, {name}!\n\n{alerts}",
        'alert_sets': "🏋️ You haven't logged any workout sets today.",
        'alert_meals': "🍏 Your food diary is empty."
    },
    'de': {
        'btn_hub': "🚀 Fitness Hub öffnen",
        'btn_trainer': "🎓 Ich bin Trainer",
        'btn_admin': "⚙️ Admin-Panel",
        'btn_trainer_panel': "👨‍🏫 Trainer-Panel öffnen",
        'btn_my_profile': "👤 Mein Profil",
        'welcome': "Hallo, {name}! 👋\n\nIch bin dein KI-Mentor. Chatte hier mit mir oder öffne deinen Hub für alle Tools.\n\n👇 Klicke unten!",
        'welcome_joined': "✅ Willkommen! Du bist dem Team deines Trainers beigetreten.\n\nÖffne den Fitness Hub, um deinen Trainingsplan zu erhalten!",
        'trainer_success': "🎉 Glückwunsch! Dein Konto ist jetzt ein <b>Trainer</b>-Konto.",
        'photo_wait': "📸 Foto erkannt! Sende es zur KI-Analyse...",
        'photo_success': "✅ **{dish_name}** erkannt!\n\n⚖️ Gewicht: ~{weight}g\n🔥 Kalorien: {cal} kcal\n🥩 Protein: {prot}g | 🧈 Fett: {fats}g | 🍞 Kohlenhydrate: {carb}g",
        'photo_fail': "Gericht konnte nicht erkannt werden. Bitte versuche es erneut.",
        'video_wait': "📹 Video erhalten!\n\nDie KI-Technikanalyse ist in der Beta-Phase. Bleib dran! 💪",
        'error': "Etwas ist schiefgelaufen. Bitte öffne deinen Hub.",
        'push_morning': "☀️ Guten Morgen, {name}!\n\n📊 Wie fühlst du dich heute? Vergiss nicht, deinen Check-in im Hub auszufüllen.",
        'push_water': "💧 Hey {name}, du hast heute erst {water} ml getrunken. Trinke jetzt ein Glas Wasser!",
        'push_evening': "🌙 Der Abend naht, {name}!\n\n{alerts}",
        'alert_sets': "🏋️ Du hast heute noch keine Übungen eingetragen.",
        'alert_meals': "🍏 Dein Ernährungstagebuch ist leer."
    },
    'pl': {
        'btn_hub': "🚀 Otwórz Fitness Hub",
        'btn_trainer': "🎓 Jestem Trenerem",
        'btn_admin': "⚙️ Panel Administratora",
        'btn_trainer_panel': "👨‍🏫 Panel Trenera",
        'btn_my_profile': "👤 Mój profil",
        'welcome': "Cześć, {name}! 👋\n\nJestem twoim mentorem AI. Możesz pisać do mnie tutaj lub otworzyć Hub, aby uzyskać dostęp do narzędzi.\n\n👇 Kliknij poniżej!",
        'welcome_joined': "✅ Witaj! Pomyślnie dołączyłeś do zespołu trenera.\n\nOtwórz Fitness Hub, aby otrzymać plan!",
        'trainer_success': "🎉 Gratulacje! Twoje konto ma teraz status <b>Trenera</b>.",
        'photo_wait': "📸 Widzę zdjęcie! Wysyłam do analizy AI...",
        'photo_success': "✅ Rozpoznano: **{dish_name}**!\n\n⚖️ Waga: ~{weight}g\n🔥 Kalorie: {cal} kcal\n🥩 Białko: {prot}g | 🧈 Tłuszcze: {fats}g | 🍞 Węglowodany: {carb}g",
        'photo_fail': "Niestety nie udało się rozpoznać dania. Zrób wyraźniejsze zdjęcie.",
        'video_wait': "📹 Otrzymałem wideo!\n\nAnaliza techniki AI jest w fazie testów. Trenuj dalej! 💪",
        'error': "Coś poszło nie tak. Otwórz Hub!",
        'push_morning': "☀️ Dzień dobry, {name}!\n\n📊 Jak się dzisiaj czujesz? Nie zapomnij wypełnić check-inu w Hubie.",
        'push_water': "💧 Hej {name}, wypiłeś dziś tylko {water} ml wody. Napij się teraz!",
        'push_evening': "🌙 Zbliża się wieczór, {name}!\n\n{alerts}",
        'alert_sets': "🏋️ Nie zapisałeś dziś żadnych ćwiczeń.",
        'alert_meals': "🍏 Twój dziennik diety jest pusty."
    }
}


def get_t(lang: str, key: str, **kwargs):
    """Отримує переклад по ключу. Fallback на англійську."""
    if lang not in BOT_DICT:
        lang = 'en'
    text = BOT_DICT[lang].get(key, BOT_DICT['en'].get(key, key))
    if kwargs:
        return text.format(**kwargs)
    return text


# =========================================================
# ДИНАМІЧНА КЛАВІАТУРА (Перевіряє ролі та адміна)
# =========================================================

async def get_dynamic_keyboard(user_id: int, lang: str):
    role_info = await database.check_user_role(user_id)
    role = role_info.get("role", "client")

    keyboard = []

    # Кнопки для ТРЕНЕРА
    if role == "trainer":
        keyboard.append([InlineKeyboardButton(text=get_t(lang, 'btn_trainer_panel'),
                                              web_app=WebAppInfo(url=config.WEBAPP_URL + "/trainer"))])
        keyboard.append(
            [InlineKeyboardButton(text=get_t(lang, 'btn_my_profile'), web_app=WebAppInfo(url=config.WEBAPP_URL))])
    # Кнопки для звичайного КЛІЄНТА
    else:
        keyboard.append([InlineKeyboardButton(text=get_t(lang, 'btn_hub'), web_app=WebAppInfo(url=config.WEBAPP_URL))])
        keyboard.append([InlineKeyboardButton(text=get_t(lang, 'btn_trainer'), callback_data="register_trainer")])

    # Кнопка для СУПЕР АДМІНА (додається завжди, якщо ID співпадає)
    if user_id == ADMIN_ID:
        keyboard.append(
            [InlineKeyboardButton(text=get_t(lang, 'btn_admin'), web_app=WebAppInfo(url=config.WEBAPP_URL + "/admin"))])

    return InlineKeyboardMarkup(inline_keyboard=keyboard)


# --- БАЗОВІ КОМАНДИ ---

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    user_id = message.from_user.id
    username = message.from_user.username or ""
    lang = message.from_user.language_code or "en"

    # Зберігаємо мову в БД одразу при старті
    await database.update_user_activity(user_id, username, lang)

    # ОБРОБКА РЕФЕРАЛЬНОГО ПОСИЛАННЯ ТРЕНЕРА
    args = message.text.split()
    if len(args) > 1 and args[1].startswith("trainer_"):
        try:
            trainer_id = int(args[1].split("_")[1])
            await database.link_client_to_trainer(user_id, trainer_id)
            kb = await get_dynamic_keyboard(user_id, lang)
            await message.answer(get_t(lang, 'welcome_joined'), reply_markup=kb)
            return
        except Exception as e:
            logging.error(f"Помилка реф-лінка: {e}")

    kb = await get_dynamic_keyboard(user_id, lang)
    await message.answer(get_t(lang, 'welcome', name=message.from_user.first_name), reply_markup=kb)


@dp.message(Command("admin"))
async def cmd_admin(message: types.Message):
    user_id = message.from_user.id
    lang = message.from_user.language_code or "en"

    if user_id == ADMIN_ID:
        kb = await get_dynamic_keyboard(user_id, lang)
        await message.answer("⚙️ Доступ до Супер Адмін Панелі відкрито:", reply_markup=kb)
    else:
        await message.answer(get_t(lang, 'error'))


@dp.callback_query(F.data == "register_trainer")
async def process_trainer_registration(callback: types.CallbackQuery):
    user_id = callback.from_user.id
    lang = callback.from_user.language_code or "en"

    # Оновлюємо роль в БД
    await database.set_user_role(user_id, "trainer")

    # Отримуємо оновлену клавіатуру (тепер там будуть тренерські кнопки)
    kb = await get_dynamic_keyboard(user_id, lang)
    await callback.message.edit_text(get_t(lang, 'trainer_success'), reply_markup=kb, parse_mode="HTML")
    await callback.answer()


# --- ОБРОБКА ПОВІДОМЛЕНЬ (ЧАТ З ШІ) ---

@dp.message(F.text)
async def handle_text(message: types.Message):
    user_id = message.from_user.id
    username = message.from_user.username or ""
    lang = message.from_user.language_code or "en"
    await database.update_user_activity(user_id, username, lang)

    await bot.send_chat_action(chat_id=message.chat.id, action="typing")

    prompt = f"""
    Ти професійний фітнес-тренер та нутриціолог. 
    Користувач задає тобі питання у Telegram: "{message.text}"
    Дай коротку, дружню, професійну та мотивуючу відповідь (до 150 слів).
    КРИТИЧНО ВАЖЛИВО: Відповідай виключно цією мовою (код): {lang}.
    """

    try:
        from ai_service import genai, MODELS_TO_TRY
        response_text = get_t(lang, 'error')

        for model_name in MODELS_TO_TRY:
            try:
                model = genai.GenerativeModel(model_name)
                res = await asyncio.to_thread(model.generate_content, prompt)
                if res and res.text:
                    response_text = res.text
                    break
            except Exception:
                continue

        kb = await get_dynamic_keyboard(user_id, lang)
        await message.answer(response_text, reply_markup=kb)
    except Exception as e:
        logging.error(f"Text error: {e}")
        kb = await get_dynamic_keyboard(user_id, lang)
        await message.answer(get_t(lang, 'error'), reply_markup=kb)


@dp.message(F.photo)
async def handle_photo(message: types.Message):
    user_id = message.from_user.id
    lang = message.from_user.language_code or "en"
    await database.update_user_activity(user_id, message.from_user.username or "", lang)

    await message.answer(get_t(lang, 'photo_wait'))

    try:
        photo = message.photo[-1]
        file = await bot.get_file(photo.file_id)
        photo_bytes = io.BytesIO()
        await bot.download_file(file.file_path, photo_bytes)
        photo_bytes = photo_bytes.getvalue()

        # Відправляємо мову в ШІ для коректної назви страви
        result = await ai_service.analyze_food_photo(photo_bytes, lang=lang)

        if result and not result.get("error"):
            today = datetime.now().strftime("%Y-%m-%d")
            dish_name = result.get('dish_name', 'Dish')
            cal = result.get('calories', 0)
            prot = result.get('protein', 0)
            fats = result.get('fats', 0)
            carb = result.get('carbs', 0)
            weight = result.get('estimated_weight_g', 0)

            await database.log_nutrition(user_id, today, cal, prot, fats, carb, dish_name, weight)
            reply = get_t(lang, 'photo_success', dish_name=dish_name, weight=weight, cal=cal, prot=prot, fats=fats,
                          carb=carb)
            kb = await get_dynamic_keyboard(user_id, lang)
            await message.answer(reply, parse_mode="Markdown", reply_markup=kb)
        else:
            kb = await get_dynamic_keyboard(user_id, lang)
            await message.answer(get_t(lang, 'photo_fail'), reply_markup=kb)
    except Exception as e:
        logging.error(f"Photo error: {e}")
        kb = await get_dynamic_keyboard(user_id, lang)
        await message.answer(get_t(lang, 'error'), reply_markup=kb)


@dp.message(F.video | F.animation)
async def handle_video(message: types.Message):
    user_id = message.from_user.id
    lang = message.from_user.language_code or "en"
    await database.update_user_activity(user_id, message.from_user.username or "", lang)
    kb = await get_dynamic_keyboard(user_id, lang)
    await message.answer(get_t(lang, 'video_wait'), reply_markup=kb)


# =========================================================
# ФОНОВІ ЗАДАЧІ ТА PUSH-СПОВІЩЕННЯ
# =========================================================

async def run_notifications(current_hour: int):
    today = datetime.now().strftime("%Y-%m-%d")
    users = await database.get_all_users_for_notifications()

    logging.info(f"[{current_hour}:00] Push scan. Users found: {len(users)}")

    for user in users:
        user_id = user['user_id']
        name = user.get('name', 'Athlete')
        lang = user.get('language', 'en')

        try:
            summary = await database.get_user_daily_summary(user_id, today)
            kb = await get_dynamic_keyboard(user_id, lang)

            # 1. РАНКОВИЙ ЧЕК-ІН (10:00)
            if current_hour == 10 and not summary['has_checkin']:
                msg = get_t(lang, 'push_morning', name=name)
                await bot.send_message(user_id, msg, reply_markup=kb)
                await asyncio.sleep(0.5)

            # 2. ДЕННА ПЕРЕВІРКА ВОДИ (15:00)
            elif current_hour == 15 and summary['water_ml'] < 1000:
                msg = get_t(lang, 'push_water', name=name, water=summary['water_ml'])
                await bot.send_message(user_id, msg, reply_markup=kb)
                await asyncio.sleep(0.5)

            # 3. ВЕЧІРНЯ МОТИВАЦІЯ ТА ЇЖА (20:00)
            elif current_hour == 20:
                alerts_list = []
                if summary['workout_sets'] == 0:
                    alerts_list.append(get_t(lang, 'alert_sets'))
                if summary['meals_logged'] == 0:
                    alerts_list.append(get_t(lang, 'alert_meals'))

                if alerts_list:
                    alerts_text = "\n".join(alerts_list)
                    msg = get_t(lang, 'push_evening', name=name, alerts=alerts_text)
                    await bot.send_message(user_id, msg, reply_markup=kb)
                    await asyncio.sleep(0.5)

        except Exception as e:
            logging.error(f"Push error user {user_id}: {e}")


async def scheduler_task():
    logging.info("Фоновий планувальник сповіщень запущено.")
    while True:
        now = datetime.now()
        if now.minute == 0:
            hour = now.hour
            if hour in [10, 15, 20]:
                await run_notifications(hour)
            await asyncio.sleep(61)
        else:
            await asyncio.sleep(30)


# --- ЗАПУСК БОТА ---

async def main():
    await database.init_db()
    asyncio.create_task(scheduler_task())
    logging.info("Бот запущений і готовий до роботи!")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logging.info("Бота зупинено.")