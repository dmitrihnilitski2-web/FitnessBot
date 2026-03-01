from fastapi import FastAPI, Request, HTTPException, File, Form, UploadFile
from fastapi.responses import Response
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uvicorn
import json
import math
from datetime import datetime, timedelta
import asyncio
import urllib.request
import aiosqlite

import ai_service
import database

app = FastAPI()

# Підключаємо роздачу статичних файлів
app.mount("/static", StaticFiles(directory="static"), name="static")

# Підключаємо папку з HTML-шаблонами
templates = Jinja2Templates(directory="templates")

# ТВІЙ ID ЯК ГОЛОВНОГО АДМІНІСТРАТОРА СИСТЕМИ
ADMIN_ID = 1100202114


# --- АВТОМАТИЧНА МІГРАЦІЯ БАЗИ ---
@app.on_event("startup")
async def startup_event():
    async with aiosqlite.connect(database.DB_NAME) as db:
        await db.execute('''CREATE TABLE IF NOT EXISTS cycle_symptoms
        (
            user_id
            INTEGER,
            date
            TEXT,
            flow_level
            TEXT,
            pain_level
            INTEGER,
            mood
            TEXT,
            notes
            TEXT,
            PRIMARY
            KEY
                            (
            user_id,
            date
                            ))''')
        try:
            await db.execute("ALTER TABLE users ADD COLUMN cycle_start_date TEXT DEFAULT ''")
        except:
            pass
        try:
            await db.execute("ALTER TABLE users ADD COLUMN cycle_length INTEGER DEFAULT 28")
        except:
            pass
        try:
            await db.execute("ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'uk'")
        except:
            pass
        await db.commit()


# --- МОДЕЛІ ДАНИХ (Pydantic) ---

class UserData(BaseModel):
    user_id: int
    name: str
    gender: str
    age: int
    height: int
    weight: float
    target_weight: float
    activity_level: str
    primary_goal: str
    custom_goal: Optional[str] = ""
    notes: Optional[str] = ""
    competition_sport: Optional[str] = ""
    competition_date: Optional[str] = ""
    cycle_start_date: Optional[str] = ""
    cycle_length: Optional[int] = 28
    language: Optional[str] = "uk"


class SetLog(BaseModel):
    user_id: int
    exercise_name: str
    set_number: int
    weight: float
    reps: int
    exercise_type: Optional[str] = "strength"
    duration: Optional[int] = 0
    distance: Optional[float] = 0.0
    plan_day: Optional[str] = ""


class NutritionEntry(BaseModel):
    user_id: int
    calories: int
    protein: int
    fats: int
    carbs: int
    dish_name: Optional[str] = "Запис вручну"
    weight_g: Optional[int] = 0


class FoodCorrection(BaseModel):
    user_id: int
    log_id: int
    current_data: Dict[str, Any]
    correction: str


class RecipeRequest(BaseModel):
    user_id: int
    ingredients: str


class CheckinData(BaseModel):
    user_id: int
    sleep: int
    energy: int
    stress: int
    soreness: int
    current_day_plan: Dict[str, Any]


class WorkoutPlanUpdate(BaseModel):
    user_id: int
    plan: Any


class AdaptedPlanUpdate(BaseModel):
    user_id: int
    plan: Dict[str, Any]


class FoodPrefs(BaseModel):
    user_id: int
    prefs: str


class NutritionPlanUpdate(BaseModel):
    user_id: int
    plan: str


class PingData(BaseModel):
    user_id: int
    username: Optional[str] = ""
    language: Optional[str] = "uk"


class ProfileUpdateText(BaseModel):
    user_id: int
    update_text: str


class WaterEntry(BaseModel):
    user_id: int
    amount: int


class BodyMetricsEntry(BaseModel):
    user_id: int
    waist: float
    hips: float
    chest: float
    biceps: float


class CyclePeriodEntry(BaseModel):
    user_id: int
    start_date: str
    end_date: Optional[str] = ""


class CycleSymptomEntry(BaseModel):
    user_id: int
    date: str
    flow_level: str
    pain_level: int
    mood: str
    notes: Optional[str] = ""


class RegisterTrainerRequest(BaseModel):
    user_id: int


# --- ДОПОМІЖНІ ФУНКЦІЇ ---

def calculate_macros(weight, height, age, gender, activity_level, primary_goal):
    if gender == 'male':
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    else:
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161

    activity_multipliers = {
        'sedentary': 1.2, 'light': 1.375, 'medium': 1.55, 'active': 1.725, 'very_active': 1.9
    }
    tdee = bmr * activity_multipliers.get(activity_level, 1.2)

    if primary_goal == 'lose':
        target_cals = tdee - 500
        protein_per_kg = 2.2
    elif primary_goal in ['gain', 'strength', 'competition']:
        target_cals = tdee + 400
        protein_per_kg = 2.0
    elif primary_goal == 'endurance':
        target_cals = tdee + 200
        protein_per_kg = 1.6
    else:
        target_cals = tdee
        protein_per_kg = 1.8

    protein = weight * protein_per_kg
    fats = weight * 1.0
    carbs = max((target_cals - (protein * 4) - (fats * 9)) / 4, 50)

    return {
        "calories": int(target_cals),
        "protein": int(protein),
        "fats": int(fats),
        "carbs": int(carbs)
    }


def get_level_info(exp):
    level = int(math.floor(math.sqrt(exp / 100))) + 1
    current_level_base = (level - 1) ** 2 * 100
    next_level_base = level ** 2 * 100
    exp_progress = exp - current_level_base
    exp_needed = next_level_base - current_level_base
    return level, exp_progress, exp_needed


def safe_int(value):
    try:
        return int(float(value))
    except:
        return 0


def get_cycle_phase(user_dict):
    if not user_dict or user_dict.get('gender') != 'female':
        return ""
    start_date = user_dict.get('cycle_start_date')
    if not start_date:
        return ""
    try:
        length = user_dict.get('cycle_length') or 28
        start = datetime.strptime(start_date, "%Y-%m-%d")
        diff = (datetime.now() - start).days
        day = (diff % length) + 1
        if 1 <= day <= 5:
            return "menstruation"
        elif 6 <= day <= 13:
            return "follicular"
        elif 14 <= day <= 16:
            return "ovulation"
        else:
            return "luteal"
    except:
        return ""


# --- РОУТИНГ СТОРІНОК ---

@app.get("/favicon.ico", include_in_schema=False)
async def favicon(): return Response(content="", media_type="image/x-icon")


@app.get("/")
async def serve_app(request: Request): return templates.TemplateResponse("index.html", {"request": request})


@app.get("/trainer")
async def serve_trainer_app(request: Request): return templates.TemplateResponse("trainer.html", {"request": request})


@app.get("/admin")
async def serve_admin_app(request: Request): return templates.TemplateResponse("admin.html", {"request": request})


# --- API ДЛЯ АДМІНІСТРАТОРА ТА АНАЛІТИКИ ---

@app.post("/api/ping")
async def process_ping(data: PingData):
    await database.update_user_activity(data.user_id, data.username, data.language)
    return {"status": "success"}


@app.get("/api/admin/stats/{admin_id}")
async def get_admin_stats(admin_id: int):
    if admin_id != ADMIN_ID: raise HTTPException(status_code=403, detail="Доступ заборонено")
    stats = await database.get_all_system_stats()
    return {"status": "success", "data": stats}


@app.get("/api/admin/users/{admin_id}")
async def get_admin_users(admin_id: int):
    if admin_id != ADMIN_ID: raise HTTPException(status_code=403, detail="Доступ заборонено")
    users = await database.get_all_users_admin()
    return {"status": "success", "data": users}


# --- API ЕНДПОІНТИ (ГОЛОВНІ) ---

@app.get("/api/user/{user_id}")
async def get_user_endpoint(user_id: int):
    user = await database.get_user(user_id)
    if not user: return {"status": "not_found"}

    role_info = await database.check_user_role(user_id)
    trainer_name = None
    if role_info.get("trainer_id"):
        trainer_data = await database.get_user(role_info["trainer_id"])
        if trainer_data: trainer_name = trainer_data.get("name", "Ваш Тренер")

    today = datetime.now().strftime("%Y-%m-%d")
    checkin = await database.get_daily_checkin(user_id, today)
    checkin_data = dict(checkin) if checkin else None

    if checkin_data and checkin_data.get('adapted_plan'):
        try:
            checkin_data['adapted_plan'] = json.loads(checkin_data['adapted_plan'])
        except:
            pass

    workout_plan = json.loads(user['workout_plan']) if user.get('workout_plan') else None
    nutrition_goals = json.loads(user['nutrition_goals']) if user.get('nutrition_goals') else None
    today_completed_sets = await database.get_today_completed_sets(user_id, today)

    exp = user.get('exp', 0)
    lvl, exp_prog, exp_need = get_level_info(exp)

    return {
        "status": "found",
        "user": {
            "user_id": user['user_id'],
            "name": user.get('name') or "Атлет",
            "gender": user.get('gender') or "male",
            "age": user.get('age') or 25,
            "height": user.get('height') or 170,
            "weight": user.get('weight') or 70.0,
            "target_weight": user.get('target_weight') or 70.0,
            "activity_level": user.get('activity_level') or "medium",
            "primary_goal": user.get('primary_goal') or "maintain",
            "custom_goal": user.get('custom_goal') or "",
            "competition_sport": user.get('competition_sport') or "",
            "competition_date": user.get('competition_date') or "",
            "cycle_start_date": user.get('cycle_start_date') or "",
            "cycle_length": user.get('cycle_length') or 28,
            "language": user.get('language') or "uk",
            "level": lvl, "exp": exp,
            "role": role_info.get("role", "client"),
            "trainer_id": role_info.get("trainer_id"),
            "trainer_name": trainer_name,
            "food_preferences": user.get('food_preferences') or "",
            "nutrition_plan": user.get('nutrition_plan') or ""
        },
        "workout_plan": workout_plan,
        "nutrition_goals": nutrition_goals,
        "today_checkin": checkin_data,
        "today_completed_sets": today_completed_sets
    }


# --- API ДЛЯ ТРЕНЕРІВ ---

@app.post("/api/register_trainer")
async def api_register_trainer(data: RegisterTrainerRequest):
    await database.set_user_role(data.user_id, "trainer")
    return {"status": "success"}


@app.get("/api/trainer/{trainer_id}/clients")
async def api_get_clients(trainer_id: int):
    clients = await database.get_trainer_clients(trainer_id)
    return {"status": "success", "clients": clients}


@app.post("/api/user/food_prefs")
async def save_food_prefs(data: FoodPrefs):
    await database.update_food_prefs(data.user_id, data.prefs)
    return {"status": "success"}


@app.post("/api/trainer/nutrition_plan")
async def save_nutrition_plan(data: NutritionPlanUpdate):
    await database.update_nutrition_plan(data.user_id, data.plan)
    return {"status": "success"}


# --- РЕЄСТРАЦІЯ ТА ПЛАНУВАННЯ ---

@app.post("/api/profile")
async def save_profile(data: UserData):
    raw_data = data.model_dump()
    macros = calculate_macros(data.weight, data.height, data.age, data.gender, data.activity_level, data.primary_goal)
    ai_analysis = await ai_service.analyze_user_profile(raw_data)
    await database.save_user(data.user_id, raw_data, ai_analysis, macros)

    async with aiosqlite.connect(database.DB_NAME) as db:
        await db.execute('''UPDATE users
                            SET cycle_start_date=?,
                                cycle_length=?,
                                language=?
                            WHERE user_id = ?''',
                         (data.cycle_start_date, data.cycle_length, data.language, data.user_id))
        await db.commit()
    return {"status": "success"}


@app.post("/api/edit_profile")
async def edit_profile(data: UserData):
    raw_data = data.model_dump()
    macros = calculate_macros(data.weight, data.height, data.age, data.gender, data.activity_level, data.primary_goal)
    await database.update_user_profile_only(data.user_id, raw_data, macros)

    async with aiosqlite.connect(database.DB_NAME) as db:
        await db.execute('''UPDATE users
                            SET cycle_start_date=?,
                                cycle_length=?,
                                language=?
                            WHERE user_id = ?''',
                         (data.cycle_start_date, data.cycle_length, data.language, data.user_id))
        await db.commit()
    return {"status": "success"}


@app.post("/api/generate_plan/{user_id}")
async def create_plan(user_id: int):
    user = await database.get_user(user_id)
    if not user: return {"status": "error"}

    ai_data = {
        "risk_factors": json.loads(user.get("ai_risk_factors") or "[]"),
        "exercise_restrictions": json.loads(user.get("ai_exercise_restrictions") or "[]"),
        "focus_areas": json.loads(user.get("ai_focus_areas") or "[]")
    }
    phase = get_cycle_phase(user)

    plan = await ai_service.generate_workout_plan(user, ai_data, phase)
    await database.save_plan(user_id, plan)
    return {"status": "success", "plan": plan}


@app.post("/api/smart_rebuild_plan")
async def smart_rebuild_plan(data: ProfileUpdateText):
    user = await database.get_user(data.user_id)
    if not user: return {"status": "error"}

    current_factors = {
        "risk_factors": json.loads(user.get("ai_risk_factors") or "[]"),
        "exercise_restrictions": json.loads(user.get("ai_exercise_restrictions") or "[]"),
        "focus_areas": json.loads(user.get("ai_focus_areas") or "[]")
    }
    new_plan = await ai_service.generate_workout_plan(user, current_factors, get_cycle_phase(user))
    await database.save_plan(data.user_id, new_plan)
    return {"status": "success", "plan": new_plan}


@app.post("/api/update_workout_plan")
async def update_workout_plan(data: WorkoutPlanUpdate):
    await database.save_plan(data.user_id, data.plan)
    return {"status": "success"}


@app.post("/api/update_adapted_plan")
async def update_adapted_plan(data: AdaptedPlanUpdate):
    today = datetime.now().strftime("%Y-%m-%d")
    await database.save_adapted_plan(data.user_id, today, data.plan)
    return {"status": "success"}


# --- ТРЕНУВАННЯ ТА МАПА ВТОМИ ---

@app.post("/api/checkin")
async def process_checkin(data: CheckinData):
    today = datetime.now().strftime("%Y-%m-%d")
    await database.save_daily_checkin(data.user_id, today, data.sleep, data.energy, data.stress, data.soreness)
    readiness = {
        "sleep": data.sleep, "energy": data.energy, "stress": data.stress, "soreness": data.soreness,
        "current_day_plan": data.current_day_plan
    }
    user = await database.get_user(data.user_id)
    phase = get_cycle_phase(user)

    adapted_plan = await ai_service.adapt_daily_workout(user, readiness, phase)
    await database.save_adapted_plan(data.user_id, today, adapted_plan)
    return {"status": "success", "adapted_plan": adapted_plan}


@app.post("/api/log_set")
async def save_set_log(data: SetLog):
    await database.log_workout_set(data.user_id, data.exercise_name, data.set_number, data.weight, data.reps,
                                   data.exercise_type, data.duration, data.distance, data.plan_day)

    if data.exercise_type == 'strength':
        muscle_id = await ai_service.identify_muscle_group(data.exercise_name)
        if muscle_id:
            state = await database.get_muscle_fatigue_state(data.user_id)
            old_fatigue = 0.0
            now = datetime.now()
            for row in state:
                if row['muscle'] == muscle_id:
                    try:
                        last_update = datetime.strptime(row['last_updated'], "%Y-%m-%d %H:%M:%S")
                        hours_passed = (now - last_update).total_seconds() / 3600.0
                        old_fatigue = max(0.0, row['fatigue_level'] - (hours_passed * 1.5))
                    except:
                        pass
                    break

            added_fatigue = 10.0 + (data.reps * 0.5)
            new_fatigue = min(100.0, old_fatigue + added_fatigue)
            await database.update_muscle_fatigue_state(data.user_id, muscle_id, new_fatigue,
                                                       now.strftime("%Y-%m-%d %H:%M:%S"))

    return {"status": "success"}


@app.get("/api/muscle_fatigue/{user_id}")
async def get_fatigue_data(user_id: int):
    state = await database.get_muscle_fatigue_state(user_id)

    # НОВИЙ СПИСОК 17 ДЕТАЛЬНИХ М'ЯЗІВ ДЛЯ АНАТОМІЇ 2.0
    valid_muscles = [
        'chest', 'obliques', 'abs', 'biceps', 'triceps', 'forearm',
        'trapezius', 'deltoids', 'upper-back', 'lower-back',
        'gluteal', 'quadriceps', 'hamstring', 'adductors', 'calves', 'tibialis', 'neck'
    ]
    result = {m: 0.0 for m in valid_muscles}
    now = datetime.now()

    for row in state:
        m = row['muscle']
        if m in result:
            try:
                last_update = datetime.strptime(row['last_updated'], "%Y-%m-%d %H:%M:%S")
                hours_passed = (now - last_update).total_seconds() / 3600.0
                current_f = max(0.0, row['fatigue_level'] - (hours_passed * 1.5))
                result[m] = round(current_f, 1)
                await database.update_muscle_fatigue_state(user_id, m, current_f, now.strftime("%Y-%m-%d %H:%M:%S"))
            except:
                pass

    return {"status": "success", "data": result}


# Захист від слешів у назвах
@app.get("/api/exercise_info/{exercise_name:path}")
async def get_exercise_information(exercise_name: str):
    cached_info = await database.get_exercise_info(exercise_name)
    if cached_info:
        return {"status": "success", "data": {"name": cached_info["name"].title(), "muscles": cached_info["muscles"],
                                              "instruction": cached_info["instruction"]}}

    ai_info = await ai_service.generate_exercise_instruction(exercise_name)
    if ai_info and not ai_info.get("error"):
        muscles = ai_info.get("muscles", "Не вказано")
        instruction = ai_info.get("instruction", "Інструкція відсутня.")

        # Захист від списків (щоб БД не падала з sqlite3.ProgrammingError)
        if isinstance(muscles, list):
            muscles = ", ".join([str(m) for m in muscles])
        if isinstance(instruction, list):
            instruction = "\n".join([f"• {str(i)}" for i in instruction])

        muscles = str(muscles)
        instruction = str(instruction)

        await database.save_exercise_info(exercise_name, muscles, instruction)
        return {"status": "success",
                "data": {"name": exercise_name.title(), "muscles": muscles, "instruction": instruction}}

    return {"status": "error"}


# --- ХАРЧУВАННЯ, ФОТО, ШТРИХ-КОДИ ТА ШІ-ХОЛОДИЛЬНИК ---

@app.get("/api/nutrition/{user_id}")
async def get_nutrition_stats(user_id: int):
    user = await database.get_user(user_id)
    goals = json.loads(user['nutrition_goals']) if user and user.get('nutrition_goals') else None
    today = datetime.now().strftime("%Y-%m-%d")
    consumed = await database.get_today_nutrition(user_id, today)
    logs = await database.get_today_nutrition_logs(user_id, today)
    water_amount = await database.get_today_water(user_id, today)
    return {"goals": goals, "consumed": consumed, "logs": logs, "water": water_amount}


@app.post("/api/log_nutrition")
async def add_nutrition_log(data: NutritionEntry):
    today = datetime.now().strftime("%Y-%m-%d")
    await database.log_nutrition(data.user_id, today, data.calories, data.protein, data.fats, data.carbs,
                                 data.dish_name, data.weight_g)
    return {"status": "success"}


@app.put("/api/nutrition_log/{user_id}/{log_id}")
async def edit_nutrition_log(user_id: int, log_id: int, data: NutritionEntry):
    await database.update_nutrition_log(log_id, data.calories, data.protein, data.fats, data.carbs, data.dish_name,
                                        data.weight_g)
    return {"status": "success"}


@app.delete("/api/nutrition_log/{user_id}/{log_id}")
async def remove_nutrition_log(user_id: int, log_id: int):
    await database.delete_nutrition_log(log_id, user_id)
    return {"status": "success"}


@app.post("/api/analyze_food")
async def analyze_food(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        result = await ai_service.analyze_food_photo(image_bytes)
        if result and not result.get("error"): return {"status": "success", "data": result}
        return {"status": "error"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/generate_recipe")
async def api_generate_recipe(data: RecipeRequest):
    user = await database.get_user(data.user_id)
    if not user or not user.get('nutrition_goals'):
        return {"status": "error", "message": "Nutrition goals not set"}

    goals = json.loads(user['nutrition_goals'])
    today = datetime.now().strftime("%Y-%m-%d")
    consumed = await database.get_today_nutrition(data.user_id, today)

    cals_left = max(0, int(goals.get('calories', 2000)) - (consumed.get('cals') or 0))
    prot_left = max(0, int(goals.get('protein', 150)) - (consumed.get('prot') or 0))
    fats_left = max(0, int(goals.get('fats', 70)) - (consumed.get('fat') or 0))
    carbs_left = max(0, int(goals.get('carbs', 200)) - (consumed.get('carb') or 0))

    if cals_left < 50:
        cals_left, prot_left, fats_left, carbs_left = 150, 10, 5, 10

    recipe_data = await ai_service.generate_recipe_from_ingredients(data.ingredients, cals_left, prot_left, fats_left,
                                                                    carbs_left)

    if recipe_data: return {"status": "success", "data": recipe_data}
    return {"status": "error"}


@app.get("/api/scan_barcode/{barcode}")
async def scan_barcode_endpoint(barcode: str):
    def fetch_data():
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        req = urllib.request.Request(url, headers={'User-Agent': 'FitnessHubPro/1.0'})
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                if data.get("status") == 1:
                    product = data.get("product", {})
                    nutriments = product.get("nutriments", {})
                    name = product.get("product_name_uk") or product.get("product_name_en") or product.get(
                        "product_name") or "Продукт"
                    return {
                        "status": "success",
                        "data": {
                            "dish_name": name,
                            "calories": safe_int(nutriments.get("energy-kcal_100g", 0)),
                            "protein": safe_int(nutriments.get("proteins_100g", 0)),
                            "fats": safe_int(nutriments.get("fat_100g", 0)),
                            "carbs": safe_int(nutriments.get("carbohydrates_100g", 0)),
                            "weight_g": 100
                        }
                    }
                return {"status": "error"}
        except:
            return {"status": "error"}

    return await asyncio.to_thread(fetch_data)


@app.post("/api/log_water")
async def log_water_endpoint(data: WaterEntry):
    today = datetime.now().strftime("%Y-%m-%d")
    await database.log_water(data.user_id, today, data.amount)
    return {"status": "success"}


# --- FEMTECH: ЖІНОЧИЙ ЦИКЛ ---

@app.post("/api/cycle/period")
async def update_period(data: CyclePeriodEntry):
    async with aiosqlite.connect(database.DB_NAME) as db:
        await db.execute("UPDATE users SET cycle_start_date = ? WHERE user_id = ?", (data.start_date, data.user_id))
        await db.commit()
    return {"status": "success"}


@app.post("/api/cycle/symptoms")
async def update_symptoms(data: CycleSymptomEntry):
    async with aiosqlite.connect(database.DB_NAME) as db:
        await db.execute('''INSERT INTO cycle_symptoms (user_id, date, flow_level, pain_level, mood, notes)
                            VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, date) DO
        UPDATE SET
            flow_level=excluded.flow_level, pain_level=excluded.pain_level, mood=excluded.mood''',
                         (data.user_id, data.date, data.flow_level, data.pain_level, data.mood, data.notes))
        await db.commit()
    return {"status": "success"}


@app.get("/api/cycle/dashboard/{user_id}")
async def cycle_dashboard(user_id: int):
    user = await database.get_user(user_id)
    if not user: return {"status": "error"}
    today = datetime.now().strftime("%Y-%m-%d")
    symptoms = {}
    async with aiosqlite.connect(database.DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute('SELECT * FROM cycle_symptoms WHERE user_id = ? AND date = ?',
                              (user_id, today)) as cursor:
            row = await cursor.fetchone()
            if row: symptoms = dict(row)

    return {
        "status": "success",
        "cycle_start_date": user.get('cycle_start_date'),
        "cycle_length": user.get('cycle_length', 28),
        "today_symptoms": symptoms
    }


@app.get("/api/cycle/insight/{user_id}")
async def cycle_insight(user_id: int):
    user = await database.get_user(user_id)
    start_date = user.get('cycle_start_date')
    if not start_date:
        return {"status": "success", "data": {"insight": "Відмітьте початок циклу, щоб ШІ міг адаптувати тренування."}}

    cycle_length = user.get('cycle_length', 28)
    start = datetime.strptime(start_date, "%Y-%m-%d")
    diff_days = (datetime.now() - start).days
    current_day = (diff_days % cycle_length) + 1
    lang = user.get('language', 'uk')

    if 1 <= current_day <= 5:
        phase = "Менструація"
    elif 6 <= current_day <= 13:
        phase = "Фолікулярна фаза"
    elif 14 <= current_day <= 16:
        phase = "Овуляція"
    else:
        phase = "Лютеїнова фаза"

    prompt = f"Клієнтка на {current_day} дні циклу (Фаза: {phase}). Дай коротку пораду (1-2 речення) щодо фітнесу та відновлення. Мова відповіді: {lang}."

    from ai_service import genai, MODELS_TO_TRY
    insight = "Слухайте своє тіло сьогодні!"
    try:
        for model_name in MODELS_TO_TRY:
            try:
                model = genai.GenerativeModel(model_name)
                res = await asyncio.to_thread(model.generate_content, prompt)
                if res and res.text:
                    insight = res.text
                    break
            except:
                continue
    except:
        pass

    return {"status": "success", "data": {"insight": insight}}


# --- СТАТИСТИКА ТА ДОСЯГНЕННЯ ---

@app.get("/api/progress/{user_id}")
async def get_progress(user_id: int):
    data = await database.get_progress_data(user_id)
    return {"status": "success", "data": data}


@app.post("/api/log_body_metrics")
async def log_body_metrics_endpoint(data: BodyMetricsEntry):
    today = datetime.now().strftime("%Y-%m-%d")
    await database.log_body_metrics(data.user_id, today, data.waist, data.hips, data.chest, data.biceps)
    return {"status": "success"}


@app.get("/api/gamification/{user_id}")
async def get_gamification(user_id: int):
    user = await database.get_user(user_id)
    if not user: return {"status": "error"}

    stats = await database.get_user_stats(user_id)
    exp = user.get('exp', 0)
    lvl, exp_prog, exp_need = get_level_info(exp)

    achievements = [
        {"id": "s1", "title": "Шлях самурая", "desc": "1 тренування", "target": 1, "cur": stats['workouts']},
        {"id": "s2", "title": "Новачок", "desc": "10 тренувань", "target": 10, "cur": stats['workouts']},
        {"id": "m1", "title": "Перший укус", "desc": "1 запис їжі", "target": 1, "cur": stats['meals']},
        {"id": "m2", "title": "Свідомий", "desc": "10 записів їжі", "target": 10, "cur": stats['meals']},
        {"id": "c1", "title": "Пульс", "desc": "Перший чек-ін", "target": 1, "cur": stats['checkins']},
        {"id": "l1", "title": "Новий рівень", "desc": "Досягнути 5 рв.", "target": 5, "cur": lvl}
    ]

    for a in achievements: a['unlocked'] = a['cur'] >= a['target']

    return {"status": "success", "level": lvl, "exp": exp, "exp_prog": exp_prog, "exp_need": exp_need,
            "achievements": achievements}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)