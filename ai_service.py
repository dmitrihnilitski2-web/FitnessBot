import google.generativeai as genai
import json
import re
import logging
import asyncio
import io
from PIL import Image
import config

# Налаштування API ключа
genai.configure(api_key=config.GEMINI_API_KEY)

# Моделі для фолбеку (flash 2.5 та 2.0 є найшвидшими та найкращими для JSON)
MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]


def extract_json(text: str) -> dict:
    """Надійно витягує JSON з тексту, ігноруючи будь-який маркдаун."""
    try:
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
        return json.loads(text)
    except Exception as e:
        logging.error(f"Failed to parse JSON: {e}\nRaw text: {text}")
        return None


async def get_model_response(prompt: str, image=None):
    """Глобальний обробник для запитів до ШІ з фолбеками та автоматичним парсингом JSON."""
    for model_name in MODELS_TO_TRY:
        try:
            model = genai.GenerativeModel(model_name)
            content = [prompt, image] if image else prompt
            response = await asyncio.to_thread(model.generate_content, content)
            parsed = extract_json(response.text)
            if parsed:
                return parsed
        except Exception as e:
            logging.warning(f"Model {model_name} failed: {e}")
            continue
    return None


# =========================================================
# БАЗОВІ ФУНКЦІЇ ПРОФІЛЮ ТА АНАЛІЗУ
# =========================================================

async def analyze_user_profile(user_data: dict) -> dict:
    """Аналізує профіль користувача на наявність ризиків та травм при реєстрації."""
    prompt = f"""
    Ти фітнес-лікар та реабілітолог. Проаналізуй дані клієнта:
    Вік: {user_data.get('age')}, Вага: {user_data.get('weight')} кг, Зріст: {user_data.get('height')} см.
    Ціль: {user_data.get('primary_goal')}. Активність: {user_data.get('activity_level')}.
    Травми/Особливості: {user_data.get('notes', 'Немає')}

    ПОВЕРНИ ВИКЛЮЧНО ВАЛІДНИЙ JSON:
    {{
        "risk_factors": ["ризик 1", "ризик 2"],
        "exercise_restrictions": ["вправа 1", "вправа 2"],
        "focus_areas": ["зона 1", "зона 2"]
    }}
    Якщо ризиків немає, залиш масиви порожніми.
    """
    res = await get_model_response(prompt)
    return res if res else {"risk_factors": [], "exercise_restrictions": [], "focus_areas": []}


async def analyze_profile_update(update_text: str, current_factors: dict) -> dict:
    """Швидка адаптація профілю (якщо людина травмувалася або щось змінила)."""
    prompt = f"""
    Ти спортивний лікар. Клієнт надіслав апдейт свого стану/цілей: "{update_text}".
    Ось його поточні фактори: {json.dumps(current_factors, ensure_ascii=False)}.

    Онови ці масиви з урахуванням нових даних.
    ПОВЕРНИ ВИКЛЮЧНО JSON:
    {{
        "risk_factors": ["..."],
        "exercise_restrictions": ["..."],
        "focus_areas": ["..."]
    }}
    """
    res = await get_model_response(prompt)
    return res if res else current_factors


# =========================================================
# ГЕНЕРАЦІЯ ТА АДАПТАЦІЯ ТРЕНУВАНЬ (З FEMTECH ТА I18N)
# =========================================================

async def generate_workout_plan(user_data: dict, ai_data: dict, cycle_phase: str = "") -> dict:
    """Генерує персоналізований тренувальний план."""
    lang = user_data.get('language', 'uk')

    femtech_prompt = ""
    if cycle_phase and cycle_phase in ['menstruation', 'luteal']:
        femtech_prompt = f"""
        УВАГА (FemTech): У клієнтки зараз фаза '{cycle_phase}'. 
        ОБОВ'ЯЗКОВО: Знизь інтенсивність (RPE) та тренувальний об'єм. Уникай важких базових на поперек/таз (заміни на тренажери/ізоляцію).
        """

    prompt = f"""
    Ти професійний фітнес-тренер та реабілітолог. Створи детальний мікроцикл на 1 тиждень.
    ДАНІ:
    - Ціль: {user_data.get('primary_goal')}
    - Детальна ціль: {user_data.get('custom_goal')}
    - Змагання: {user_data.get('competition_sport')}
    - Вік: {user_data.get('age')}, Вага: {user_data.get('weight')} кг
    {femtech_prompt}
    ОБМЕЖЕННЯ (ШІ): {ai_data.get('exercise_restrictions', [])}

    ВІДПОВІДАЙ ВИКЛЮЧНО ЦІЄЮ МОВОЮ: {lang}.

    ПОВЕРНИ ВИКЛЮЧНО ВАЛІДНИЙ JSON:
    {{
        "plan_name": "Назва плану",
        "explanation": "Коротке пояснення логіки (2-3 речення)",
        "projections": "Прогноз результатів за 4 тижні (2-3 речення)",
        "days": [
            {{
                "day": 1,
                "focus": "Спина та Біцепс",
                "exercises": [ {{"name": "Підтягування", "sets": "4", "reps": "8-10 @ RPE 8"}} ]
            }}
        ]
    }}
    """
    return await get_model_response(prompt)


async def adapt_daily_workout(user_data: dict, checkin_data: dict, cycle_phase: str = "") -> dict:
    """Адаптує тренування під поточний стан (енергія, сон, стрес, втома)."""
    lang = user_data.get('language', 'uk')

    femtech_prompt = ""
    if cycle_phase and cycle_phase in ['menstruation', 'luteal']:
        femtech_prompt = f"Зверни увагу: клієнтка у фазі '{cycle_phase}'. Знизь ваги, додай більше розтяжки."

    prompt = f"""
    Ти професійний тренер. Адаптуй сьогоднішнє тренування клієнта.
    ПЛАН: {json.dumps(checkin_data.get('current_day_plan', {}), ensure_ascii=False)}
    СТАН СЬОГОДНІ (1-10): Сон {checkin_data.get('sleep')}, Енергія {checkin_data.get('energy')}, Стрес {checkin_data.get('stress')}, Біль {checkin_data.get('soreness')}
    {femtech_prompt}

    Якщо стан поганий - зменш підходи/RPE, заміни на кардіо або розтяжку.
    ВІДПОВІДАЙ ВИКЛЮЧНО ЦІЄЮ МОВОЮ: {lang}.

    ПОВЕРНИ ВИКЛЮЧНО ВАЛІДНИЙ JSON:
    {{
        "coach_message": "Повідомлення від тренера (1-2 речення)",
        "focus": "Новий фокус (напр. 'Легке відновлення')",
        "exercises": [ {{"name": "Назва вправи", "sets": "3", "reps": "12"}} ]
    }}
    """
    return await get_model_response(prompt)


# =========================================================
# АНАЛІЗ ЇЖІ ТА ВПРАВ
# =========================================================

async def analyze_food_photo(image_bytes: bytes, lang: str = "uk") -> dict:
    """Аналізує фото їжі та повертає БЖВ."""
    prompt = f"""
    Ти експерт з нутриціології. Проаналізуй страву на фото.
    Визнач назву, приблизну вагу та БЖВ. Відповідай мовою: {lang}.
    ПОВЕРНИ ВИНЯТКОВО JSON:
    {{
        "dish_name": "Назва страви",
        "estimated_weight_g": 250,
        "calories": 450,
        "protein": 30,
        "fats": 20,
        "carbs": 40
    }}
    """
    try:
        image_obj = Image.open(io.BytesIO(image_bytes))
        res = await get_model_response(prompt, image_obj)
        return res if res else {"error": "Fail"}
    except Exception as e:
        logging.error(f"Error analyzing food photo: {e}")
        return {"error": str(e)}


async def reanalyze_food_text_webapp(current_data: dict, correction: str) -> dict:
    """Перераховує страву за текстовим коментарем користувача (ШІ-Перерахунок)."""
    prompt = f"""
    Оригінальні дані страви: {json.dumps(current_data, ensure_ascii=False)}
    Правка від клієнта: "{correction}"

    Перерахуй калорії та БЖВ з урахуванням цієї правки.
    ПОВЕРНИ ВИНЯТКОВО JSON:
    {{
        "dish_name": "Нова або поточна назва",
        "weight_g": 200,
        "calories": 400,
        "protein": 30,
        "fats": 20,
        "carbs": 40
    }}
    """
    res = await get_model_response(prompt)
    return res if res else {"error": "Fail"}


async def identify_muscle_group(exercise_name: str) -> str:
    """
    НОВА АНАТОМІЯ 2.0: Визначає одну з 17 детальних м'язових груп для мапи тіла.
    """
    valid_muscles = [
        'chest', 'obliques', 'abs', 'biceps', 'triceps', 'forearm',
        'trapezius', 'deltoids', 'upper-back', 'lower-back',
        'gluteal', 'quadriceps', 'hamstring', 'adductors', 'calves', 'tibialis', 'neck'
    ]

    prompt = f"""
    До якої ОДНІЄЇ головної детальної групи м'язів найбільше відноситься вправа "{exercise_name}"?
    Обери ТІЛЬКИ ОДИН варіант із цього списку: {valid_muscles}.
    Поверни лише одне слово (або словосполучення через дефіс) англійською з цього списку.
    """
    for model_name in MODELS_TO_TRY:
        try:
            model = genai.GenerativeModel(model_name)
            res = await asyncio.to_thread(model.generate_content, prompt)
            muscle = res.text.strip().lower()
            for valid in valid_muscles:
                if valid in muscle: return valid
            return 'abs'  # Дефолтний фолбек
        except:
            continue
    return 'abs'


async def generate_exercise_instruction(exercise_name: str, lang: str = "uk") -> dict:
    """Генерує інструкцію до вправи для модального вікна."""
    prompt = f"""
    Ти професійний тренер. Дай коротку інструкцію для вправи: "{exercise_name}".
    Відповідай мовою: {lang}.
    ПОВЕРНИ ВИКЛЮЧНО JSON:
    {{
        "muscles": "Основні цільові м'язи",
        "instruction": "Покрокова інструкція (3-4 пункти)"
    }}
    """
    res = await get_model_response(prompt)
    return res if res else {"muscles": "Не визначено", "instruction": "Інструкція недоступна."}


# =========================================================
# ШІ-ХОЛОДИЛЬНИК (Генератор рецептів під залишок БЖВ)
# =========================================================

async def generate_recipe_from_ingredients(ingredients_text: str, cals_left: int, prot_left: int, fats_left: int,
                                           carbs_left: int) -> dict:
    """Генерує рецепт з наявних продуктів, максимально підганяючи під залишок макросів клієнта."""
    prompt = f"""
    Ти професійний фітнес-кухар. Клієнт має такі продукти: "{ingredients_text}".

    Йому ЗАЛИШИЛОСЯ з'їсти сьогодні:
    - Калорії: ~{cals_left} ккал
    - Білки: ~{prot_left} г
    - Жири: ~{fats_left} г
    - Вуглеводи: ~{carbs_left} г

    Придумай страву або перекус із вказаних продуктів, щоб максимально вписатися в ці залишки. 
    Можна додавати базові інгредієнти (сіль, олія, спеції).

    ПОВЕРНИ ВИНЯТКОВО JSON:
    {{
        "dish_name": "Смачна назва страви",
        "calories": 400,
        "protein": 30,
        "fats": 15,
        "carbs": 40,
        "recipe_text": "1. Крок 1\\n2. Крок 2\\n3. Крок 3"
    }}
    """
    return await get_model_response(prompt)