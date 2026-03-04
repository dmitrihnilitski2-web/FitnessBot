import asyncio
import logging
import io
from datetime import datetime
from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import Command
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
import aiosqlite

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
        'alert_meals': "🍏 Твій щоденник харчування порожній.",

        # --- ДУЕЛІ ---
        'duel_own': "Ви не можете прийняти власний виклик! Чекайте на суперника. ⏳",
        'duel_no_exp': "❌ У вас недостатньо досвіду (EXP) для цієї дуелі. Потрібно: {bet} EXP.",
        'duel_accepted': "⚔️ <b>Ви прийняли виклик!</b> Дуель почалась. Ставка: {bet} EXP.",
        'duel_started_initiator': "🔥 <b>{name}</b> прийняв ваш виклик! Дуель на {bet} EXP почалась. Хай переможе найсильніший!",
        'duel_active': "Ця дуель вже активна! ⚔️",
        'duel_finished': "Ця дуель вже завершена! 🏁",
        'duel_win': "🏆 <b>ВІТАЮ З ПЕРЕМОГОЮ!</b>\n\nВи виграли дуель! Ваш результат: {score_w}, у суперника: {score_l}.\nВи отримуєте <b>+{bet} EXP</b>!",
        'duel_lose': "💀 <b>ДУЕЛЬ ПРОГРАНО</b>\n\nВаш результат: {score_l}, у переможця: {score_w}. Тренуйтесь краще і спробуйте знову!",
        'duel_draw': "🤝 <b>НІЧИЯ!</b>\n\nДуель завершилась з рівним результатом. Обидва гравці залишаються при своєму досвіді."
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
        'alert_meals': "🍏 Your food diary is empty.",

        'duel_own': "You cannot accept your own challenge! Wait for an opponent. ⏳",
        'duel_no_exp': "❌ Not enough EXP for this duel. Required: {bet} EXP.",
        'duel_accepted': "⚔️ <b>Challenge accepted!</b> The duel begins. Bet: {bet} EXP.",
        'duel_started_initiator': "🔥 <b>{name}</b> accepted your challenge! The {bet} EXP duel begins!",
        'duel_active': "This duel is already active! ⚔️",
        'duel_finished': "This duel is already finished! 🏁",
        'duel_win': "🏆 <b>YOU WON!</b>\n\nYou won the duel! Your score: {score_w}, opponent: {score_l}.\nYou receive <b>+{bet} EXP</b>!",
        'duel_lose': "💀 <b>YOU LOST</b>\n\nYour score: {score_l}, winner: {score_w}. Train harder and try again!",
        'duel_draw': "🤝 <b>DRAW!</b>\n\nThe duel ended in a tie. No EXP was lost."
    }
}

# Для німецької та польської робимо fallback на англійську для повідомлень бота (щоб не роздувати код),
# але якщо захочеш - можеш скопіювати туди ключі з англійської.
for lang in ['de', 'pl']:
    BOT_DICT[lang] = BOT_DICT['en'].copy()


def get_t(lang: str, key: str, **kwargs):
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

    # Кнопка для СУПЕР АДМІНА
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
    full_name = message.from_user.full_name or "Атлет"

    user = await database.get_user(user_id)
    if not user:
        await database.save_user(user_id, {"name": full_name, "username": username}, {}, {})
        user = await database.get_user(user_id)
    else:
        await database.update_user_activity(user_id, username, lang)

    # 1. ОБРОБКА DEEP-LINKS (ЗАПРОШЕННЯ НА ДУЕЛЬ)
    args = message.text.split()
    if len(args) > 1 and args[1].startswith('duel_'):
        duel_id_str = args[1].replace('duel_', '')
        if duel_id_str.isdigit():
            duel_id = int(duel_id_str)
            duel = await database.get_duel(duel_id)

            if duel and duel['status'] == 'pending':
                if duel['initiator_id'] == user_id:
                    await message.answer(get_t(lang, 'duel_own'))
                else:
                    if user and user.get('exp', 0) < duel['bet_exp']:
                        await message.answer(get_t(lang, 'duel_no_exp', bet=duel['bet_exp']))
                    else:
                        # Приймаємо дуель
                        async with aiosqlite.connect(database.DB_NAME) as db:
                            await db.execute("UPDATE duels SET status='active', opponent_id=? WHERE id=?",
                                             (user_id, duel_id))
                            await db.commit()

                        await message.answer(get_t(lang, 'duel_accepted', bet=duel['bet_exp']), parse_mode="HTML")

                        initiator = await database.get_user(duel['initiator_id'])
                        if initiator:
                            init_lang = initiator.get('language', 'uk')
                            try:
                                await bot.send_message(
                                    duel['initiator_id'],
                                    get_t(init_lang, 'duel_started_initiator', name=full_name, bet=duel['bet_exp']),
                                    parse_mode="HTML"
                                )
                            except Exception as e:
                                logging.error(f"Error notifying initiator: {e}")
            elif duel and duel['status'] == 'active':
                await message.answer(get_t(lang, 'duel_active'))
            elif duel and duel['status'] in ['completed', 'finished']:
                await message.answer(get_t(lang, 'duel_finished'))

    # 2. ОБРОБКА РЕФЕРАЛЬНОГО ПОСИЛАННЯ ТРЕНЕРА
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
    await database.set_user_role(user_id, "trainer")
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
# ШІ-СУДДЯ (Підбиття підсумків дуелей)
# =========================================================
async def judge_active_duels():
    """Шукає дуелі, час яких минув, визначає переможця та нараховує EXP."""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    async with aiosqlite.connect(database.DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        # Знаходимо всі активні дуелі, в яких end_date вже в минулому
        cursor = await db.execute("SELECT * FROM duels WHERE status = 'active' AND end_date <= ?", (now_str,))
        duels_to_judge = await cursor.fetchall()

        for duel in duels_to_judge:
            duel_id = duel['id']
            p1 = duel['initiator_id']
            p2 = duel['opponent_id']
            d_type = duel['duel_type']
            bet = duel['bet_exp']
            s_date = duel['start_date']
            e_date = duel['end_date']

            # Допоміжна функція для розрахунку балів гравця
            async def get_score(u_id):
                score = 0
                if d_type == 'workouts':
                    c = await db.execute(
                        "SELECT COUNT(*) FROM workout_logs WHERE user_id = ? AND date >= ? AND date <= ?",
                        (u_id, s_date, e_date))
                    score = (await c.fetchone())[0] or 0
                elif d_type == 'calories':
                    # Збираємо суму калорій
                    c = await db.execute(
                        "SELECT SUM(calories) FROM nutrition_logs WHERE user_id = ? AND date >= ? AND date <= ?",
                        (u_id, s_date[:10], e_date[:10]))
                    score = (await c.fetchone())[0] or 0
                elif d_type == 'streak':
                    # Перевіряємо поточний вогник
                    c = await db.execute("SELECT current_streak FROM users WHERE user_id = ?", (u_id,))
                    row = await c.fetchone()
                    score = row[0] if row else 0
                return score

            score1 = await get_score(p1)
            score2 = await get_score(p2)

            winner_id = None
            loser_id = None
            is_draw = False

            if score1 > score2:
                winner_id, loser_id = p1, p2
            elif score2 > score1:
                winner_id, loser_id = p2, p1
            else:
                is_draw = True

            # Оновлюємо статус дуелі
            await db.execute("UPDATE duels SET status = 'completed', winner_id = ? WHERE id = ?", (winner_id, duel_id))

            # Нараховуємо виграш переможцю (Ставка просто видається системою як бонус)
            if winner_id:
                await db.execute("UPDATE users SET exp = exp + ? WHERE user_id = ?", (bet, winner_id))

            await db.commit()

            # Надсилаємо сповіщення гравцям
            u1_data = await database.get_user(p1)
            u2_data = await database.get_user(p2)
            l1 = u1_data.get('language', 'uk') if u1_data else 'uk'
            l2 = u2_data.get('language', 'uk') if u2_data else 'uk'

            if is_draw:
                msg1 = get_t(l1, 'duel_draw')
                msg2 = get_t(l2, 'duel_draw')
                try:
                    await bot.send_message(p1, msg1, parse_mode="HTML")
                except:
                    pass
                try:
                    await bot.send_message(p2, msg2, parse_mode="HTML")
                except:
                    pass
            else:
                score_w = max(score1, score2)
                score_l = min(score1, score2)

                msg_win = get_t(l1 if winner_id == p1 else l2, 'duel_win', bet=bet, score_w=score_w, score_l=score_l)
                msg_lose = get_t(l2 if loser_id == p2 else l1, 'duel_lose', score_w=score_w, score_l=score_l)

                try:
                    await bot.send_message(winner_id, msg_win, parse_mode="HTML")
                except:
                    pass
                try:
                    await bot.send_message(loser_id, msg_lose, parse_mode="HTML")
                except:
                    pass


# =========================================================
# ФОНОВІ ЗАДАЧІ ТА PUSH-СПОВІЩЕННЯ
# =========================================================

async def run_notifications(current_hour: int):
    today = datetime.now().strftime("%Y-%m-%d")
    users = await database.get_all_users_for_notifications()

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
    logging.info("Фоновий планувальник (Суддя дуелей + Push) запущено.")
    last_hour_notified = -1

    while True:
        now = datetime.now()

        # 1. Перевірка дуелей (Кожні 30 секунд)
        try:
            await judge_active_duels()
        except Exception as e:
            logging.error(f"Помилка в Судді дуелей: {e}")

        # 2. Перевірка на push-сповіщення (Раз на годину у рівно 00 хвилин)
        hour = now.hour
        if now.minute == 0 and hour != last_hour_notified:
            if hour in [10, 15, 20]:
                await run_notifications(hour)
            last_hour_notified = hour

        # Засинаємо на 30 секунд, щоб не навантажувати сервер, але і не пропустити завершення дуелі
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