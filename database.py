import aiosqlite
import json
from datetime import datetime

DB_NAME = "fitness_bot.db"


async def init_db():
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute('''CREATE TABLE IF NOT EXISTS users
                            (
                                user_id
                                INTEGER
                                PRIMARY
                                KEY,
                                name
                                TEXT,
                                gender
                                TEXT,
                                age
                                INTEGER,
                                height
                                INTEGER,
                                weight
                                REAL,
                                target_weight
                                REAL,
                                activity_level
                                TEXT,
                                primary_goal
                                TEXT,
                                custom_goal
                                TEXT,
                                notes
                                TEXT,
                                ai_risk_factors
                                TEXT,
                                ai_exercise_restrictions
                                TEXT,
                                ai_focus_areas
                                TEXT,
                                workout_plan
                                TEXT,
                                nutrition_goals
                                TEXT,
                                level
                                INTEGER
                                DEFAULT
                                1,
                                exp
                                INTEGER
                                DEFAULT
                                0,
                                role
                                TEXT
                                DEFAULT
                                'client',
                                trainer_id
                                INTEGER
                                DEFAULT
                                NULL,
                                food_preferences
                                TEXT
                                DEFAULT
                                '',
                                nutrition_plan
                                TEXT
                                DEFAULT
                                '',
                                username
                                TEXT
                                DEFAULT
                                '',
                                total_time_spent
                                INTEGER
                                DEFAULT
                                0,
                                last_active_date
                                TEXT
                                DEFAULT
                                '',
                                competition_sport
                                TEXT
                                DEFAULT
                                '',
                                competition_date
                                TEXT
                                DEFAULT
                                '',
                                cycle_start_date
                                TEXT
                                DEFAULT
                                '',
                                cycle_length
                                INTEGER
                                DEFAULT
                                28,
                                language
                                TEXT
                                DEFAULT
                                'uk'
                            )''')

        await db.execute('''CREATE TABLE IF NOT EXISTS workout_logs
                            (
                                id
                                INTEGER
                                PRIMARY
                                KEY
                                AUTOINCREMENT,
                                user_id
                                INTEGER,
                                date
                                TEXT,
                                exercise_name
                                TEXT,
                                set_number
                                INTEGER,
                                weight
                                REAL,
                                reps
                                INTEGER,
                                exercise_type
                                TEXT
                                DEFAULT
                                'strength',
                                duration
                                INTEGER
                                DEFAULT
                                0,
                                distance
                                REAL
                                DEFAULT
                                0.0,
                                plan_day
                                TEXT
                                DEFAULT
                                ''
                            )''')

        await db.execute('''CREATE TABLE IF NOT EXISTS nutrition_logs
                            (
                                id
                                INTEGER
                                PRIMARY
                                KEY
                                AUTOINCREMENT,
                                user_id
                                INTEGER,
                                date
                                TEXT,
                                dish_name
                                TEXT,
                                calories
                                INTEGER,
                                protein
                                INTEGER,
                                fats
                                INTEGER,
                                carbs
                                INTEGER,
                                weight_g
                                INTEGER
                                DEFAULT
                                0
                            )''')

        await db.execute('''CREATE TABLE IF NOT EXISTS daily_checkins
        (
            user_id
            INTEGER,
            date
            TEXT,
            sleep
            INTEGER,
            energy
            INTEGER,
            stress
            INTEGER,
            soreness
            INTEGER,
            adapted_plan
            TEXT,
            PRIMARY
            KEY
                            (
            user_id,
            date
                            )
            )''')

        await db.execute('''CREATE TABLE IF NOT EXISTS weight_logs
                            (
                                id
                                INTEGER
                                PRIMARY
                                KEY
                                AUTOINCREMENT,
                                user_id
                                INTEGER,
                                date
                                TEXT,
                                weight
                                REAL
                            )''')

        await db.execute('''CREATE TABLE IF NOT EXISTS exercise_library
                            (
                                name
                                TEXT
                                PRIMARY
                                KEY,
                                muscles
                                TEXT,
                                instruction
                                TEXT
                            )''')

        await db.execute('''CREATE TABLE IF NOT EXISTS water_logs
        (
            user_id
            INTEGER,
            date
            TEXT,
            amount
            INTEGER
            DEFAULT
            0,
            PRIMARY
            KEY
                            (
            user_id,
            date
                            )
            )''')

        await db.execute('''CREATE TABLE IF NOT EXISTS body_metrics
                            (
                                id
                                INTEGER
                                PRIMARY
                                KEY
                                AUTOINCREMENT,
                                user_id
                                INTEGER,
                                date
                                TEXT,
                                waist
                                REAL
                                DEFAULT
                                0.0,
                                hips
                                REAL
                                DEFAULT
                                0.0,
                                chest
                                REAL
                                DEFAULT
                                0.0,
                                biceps
                                REAL
                                DEFAULT
                                0.0
                            )''')

        await db.execute('''CREATE TABLE IF NOT EXISTS muscle_fatigue
        (
            user_id
            INTEGER,
            muscle
            TEXT,
            fatigue_level
            REAL
            DEFAULT
            0.0,
            last_updated
            TEXT,
            PRIMARY
            KEY
                            (
            user_id,
            muscle
                            )
            )''')

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
                            )
            )''')

        # РОЗУМНЕ ОНОВЛЕННЯ (Міграція для старих баз)
        migrations = [
            "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client'",
            "ALTER TABLE users ADD COLUMN trainer_id INTEGER DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN food_preferences TEXT DEFAULT ''",
            "ALTER TABLE users ADD COLUMN nutrition_plan TEXT DEFAULT ''",
            "ALTER TABLE users ADD COLUMN username TEXT DEFAULT ''",
            "ALTER TABLE users ADD COLUMN total_time_spent INTEGER DEFAULT 0",
            "ALTER TABLE users ADD COLUMN last_active_date TEXT DEFAULT ''",
            "ALTER TABLE users ADD COLUMN competition_sport TEXT DEFAULT ''",
            "ALTER TABLE users ADD COLUMN competition_date TEXT DEFAULT ''",
            "ALTER TABLE users ADD COLUMN cycle_start_date TEXT DEFAULT ''",
            "ALTER TABLE users ADD COLUMN cycle_length INTEGER DEFAULT 28",
            "ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'uk'",
            "ALTER TABLE workout_logs ADD COLUMN exercise_type TEXT DEFAULT 'strength'",
            "ALTER TABLE workout_logs ADD COLUMN duration INTEGER DEFAULT 0",
            "ALTER TABLE workout_logs ADD COLUMN distance REAL DEFAULT 0.0",
            "ALTER TABLE workout_logs ADD COLUMN plan_day TEXT DEFAULT ''",
            "ALTER TABLE nutrition_logs ADD COLUMN weight_g INTEGER DEFAULT 0"
        ]

        for mig in migrations:
            try:
                await db.execute(mig)
            except:
                pass

        await db.commit()


# --- ФУНКЦІЇ ДЛЯ АДМІНІСТРАТОРА ---

async def get_all_system_stats():
    async with aiosqlite.connect(DB_NAME) as db:
        total_users = (await (await db.execute('SELECT COUNT(*) FROM users')).fetchone())[0]
        total_trainers = (await (await db.execute('SELECT COUNT(*) FROM users WHERE role="trainer"')).fetchone())[0]
        total_clients = (await (await db.execute('SELECT COUNT(*) FROM users WHERE role="client"')).fetchone())[0]
        total_plans = (await (await db.execute(
            'SELECT COUNT(*) FROM users WHERE workout_plan IS NOT NULL AND workout_plan != ""')).fetchone())[0]
        total_time = (await (await db.execute('SELECT SUM(total_time_spent) FROM users')).fetchone())[0] or 0

        return {
            "total_users": total_users,
            "total_trainers": total_trainers,
            "total_clients": total_clients,
            "total_plans": total_plans,
            "total_time_hours": round(total_time / 60, 1)
        }


async def get_all_users_admin():
    async with aiosqlite.connect(DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
                'SELECT user_id, username, name, role, trainer_id, primary_goal, total_time_spent, last_active_date, level FROM users ORDER BY last_active_date DESC') as cursor:
            return [dict(row) for row in await cursor.fetchall()]


# ВИПРАВЛЕНО: Додано аргумент lang
async def update_user_activity(user_id: int, username: str = "", lang: str = None):
    today = datetime.now().strftime("%Y-%m-%d %H:%M")
    async with aiosqlite.connect(DB_NAME) as db:
        if lang:
            await db.execute('''UPDATE users
                                SET total_time_spent = total_time_spent + 1,
                                    last_active_date = ?,
                                    username         = CASE WHEN ? != "" THEN ? ELSE username END,
                                    language         = ?
                                WHERE user_id = ?''', (today, username, username, lang, user_id))
        else:
            await db.execute('''UPDATE users
                                SET total_time_spent = total_time_spent + 1,
                                    last_active_date = ?,
                                    username         = CASE WHEN ? != "" THEN ? ELSE username END
                                WHERE user_id = ?''', (today, username, username, user_id))
        await db.commit()


# --- ФУНКЦІЇ ДЛЯ ТРЕНЕРІВ ---

async def set_user_role(user_id: int, role: str):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute('INSERT INTO users (user_id, role) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET role = ?',
                         (user_id, role, role))
        await db.commit()


async def link_client_to_trainer(client_id: int, trainer_id: int):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute(
            'INSERT INTO users (user_id, role, trainer_id) VALUES (?, "client", ?) ON CONFLICT(user_id) DO UPDATE SET trainer_id = ?',
            (client_id, trainer_id, trainer_id))
        await db.commit()


async def get_trainer_clients(trainer_id: int):
    async with aiosqlite.connect(DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
                'SELECT user_id, name, level, exp, primary_goal FROM users WHERE trainer_id = ? AND role = "client"',
                (trainer_id,)) as cursor:
            return [dict(row) for row in await cursor.fetchall()]


async def check_user_role(user_id: int):
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute('SELECT role, trainer_id FROM users WHERE user_id = ?', (user_id,)) as cursor:
            row = await cursor.fetchone()
            if row: return {"role": row[0], "trainer_id": row[1]}
            return {"role": "client", "trainer_id": None}


async def update_food_prefs(user_id: int, prefs: str):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute('UPDATE users SET food_preferences = ? WHERE user_id = ?', (prefs, user_id))
        await db.commit()


async def update_nutrition_plan(user_id: int, plan: str):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute('UPDATE users SET nutrition_plan = ? WHERE user_id = ?', (plan, user_id))
        await db.commit()


# --- ПРОФІЛЬ ТА ПЛАН ---

async def save_user(user_id, raw_data, ai_data, nutrition_goals):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute('''INSERT INTO users
                            (user_id, name, gender, age, height, weight, target_weight, activity_level, primary_goal,
                             custom_goal, notes, ai_risk_factors, ai_exercise_restrictions, ai_focus_areas,
                             nutrition_goals, competition_sport, competition_date, cycle_start_date, cycle_length,
                             language)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id) DO
        UPDATE SET
            name=excluded.name, gender=excluded.gender, age=excluded.age, height=excluded.height,
            weight=excluded.weight, target_weight=excluded.target_weight, activity_level=excluded.activity_level,
            primary_goal=excluded.primary_goal, custom_goal=excluded.custom_goal, notes=excluded.notes,
            nutrition_goals=excluded.nutrition_goals, ai_risk_factors=excluded.ai_risk_factors,
            ai_exercise_restrictions=excluded.ai_exercise_restrictions, ai_focus_areas=excluded.ai_focus_areas,
            competition_sport=excluded.competition_sport, competition_date=excluded.competition_date,
            cycle_start_date=excluded.cycle_start_date, cycle_length=excluded.cycle_length, language =excluded.language''',
                         (user_id,
                          raw_data.get('name', 'Атлет'),
                          raw_data.get('gender', 'male'),
                          int(raw_data.get('age', 25)),
                          int(raw_data.get('height', 170)),
                          float(raw_data.get('weight', 70.0)),
                          float(raw_data.get('target_weight', 70.0)),
                          raw_data.get('activity_level', 'medium'),
                          raw_data.get('primary_goal', 'maintain'),
                          raw_data.get('custom_goal', ''),
                          raw_data.get('notes', ''),
                          json.dumps(ai_data.get('risk_factors', [])),
                          json.dumps(ai_data.get('exercise_restrictions', [])),
                          json.dumps(ai_data.get('focus_areas', [])),
                          json.dumps(nutrition_goals),
                          raw_data.get('competition_sport', ''),
                          raw_data.get('competition_date', ''),
                          raw_data.get('cycle_start_date', ''),
                          raw_data.get('cycle_length', 28),
                          raw_data.get('language', 'uk')
                          ))

        today = datetime.now().strftime("%Y-%m-%d")
        await db.execute('INSERT INTO weight_logs (user_id, date, weight) VALUES (?, ?, ?)',
                         (user_id, today, float(raw_data.get('weight', 70.0))))
        await db.commit()


async def update_user_profile_only(user_id, update_data, new_macros):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute('''UPDATE users
                            SET name=?,
                                age=?,
                                height=?,
                                weight=?,
                                target_weight=?,
                                activity_level=?,
                                primary_goal=?,
                                nutrition_goals=?,
                                competition_sport=?,
                                competition_date=?,
                                cycle_start_date=?,
                                cycle_length=?,
                                language=?
                            WHERE user_id = ?''',
                         (update_data.get('name'),
                          int(update_data.get('age')),
                          int(update_data.get('height')),
                          float(update_data.get('weight')),
                          float(update_data.get('target_weight')),
                          update_data.get('activity_level'),
                          update_data.get('primary_goal'),
                          json.dumps(new_macros),
                          update_data.get('competition_sport', ''),
                          update_data.get('competition_date', ''),
                          update_data.get('cycle_start_date', ''),
                          update_data.get('cycle_length', 28),
                          update_data.get('language', 'uk'),
                          user_id))

        today = datetime.now().strftime("%Y-%m-%d")
        await db.execute('INSERT INTO weight_logs (user_id, date, weight) VALUES (?, ?, ?)',
                         (user_id, today, float(update_data.get('weight'))))
        await db.commit()


async def update_user_ai_factors(user_id, ai_data):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute('''UPDATE users
                            SET ai_risk_factors=?,
                                ai_exercise_restrictions=?,
                                ai_focus_areas=?
                            WHERE user_id = ?''',
                         (json.dumps(ai_data.get('risk_factors', [])),
                          json.dumps(ai_data.get('exercise_restrictions', [])),
                          json.dumps(ai_data.get('focus_areas', [])),
                          user_id))
        await db.commit()


async def get_user(user_id):
    async with aiosqlite.connect(DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute('SELECT * FROM users WHERE user_id = ?', (user_id,)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def save_plan(user_id, plan_data):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute('UPDATE users SET workout_plan = ? WHERE user_id = ?', (json.dumps(plan_data), user_id))
        await db.commit()


# --- ТРЕНУВАННЯ ---

async def log_workout_set(user_id, exercise_name, set_number, weight, reps, exercise_type='strength', duration=0,
                          distance=0.0, plan_day=''):
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute(
            '''INSERT INTO workout_logs
               (user_id, date, exercise_name, set_number, weight, reps, exercise_type, duration, distance, plan_day)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (user_id, date_str, exercise_name, set_number, weight, reps, exercise_type, duration, distance, plan_day)
        )
        await db.execute('UPDATE users SET exp = exp + 10 WHERE user_id = ?', (user_id,))
        await db.commit()


async def get_today_completed_sets(user_id: int, date_prefix: str):
    async with aiosqlite.connect(DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
                'SELECT exercise_name, plan_day, COUNT(*) as sets_completed FROM workout_logs WHERE user_id = ? AND date LIKE ? GROUP BY exercise_name, plan_day',
                (user_id, f"{date_prefix}%")
        ) as cursor:
            rows = await cursor.fetchall()
            return {f"{row['plan_day']}_{row['exercise_name']}": row['sets_completed'] for row in rows}


async def save_daily_checkin(user_id: int, date: str, sleep: int, energy: int, stress: int, soreness: int):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute(
            'INSERT INTO daily_checkins (user_id, date, sleep, energy, stress, soreness) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, date) DO UPDATE SET sleep=excluded.sleep, energy=excluded.energy, stress=excluded.stress, soreness=excluded.soreness',
            (user_id, date, sleep, energy, stress, soreness))
        await db.execute('UPDATE users SET exp = exp + 5 WHERE user_id = ?', (user_id,))
        await db.commit()


async def get_daily_checkin(user_id: int, date: str):
    async with aiosqlite.connect(DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute('SELECT * FROM daily_checkins WHERE user_id = ? AND date = ?', (user_id, date)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def save_adapted_plan(user_id: int, date: str, adapted_plan: dict):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute('UPDATE daily_checkins SET adapted_plan = ? WHERE user_id = ? AND date = ?',
                         (json.dumps(adapted_plan), user_id, date))
        await db.commit()


# --- ХАРЧУВАННЯ ---

async def log_nutrition(user_id, date, calories, protein, fats, carbs, dish_name="Запис вручну", weight_g=0):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute(
            'INSERT INTO nutrition_logs (user_id, date, dish_name, calories, protein, fats, carbs, weight_g) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (user_id, date, dish_name, calories, protein, fats, carbs, weight_g))
        await db.execute('UPDATE users SET exp = exp + 5 WHERE user_id = ?', (user_id,))
        await db.commit()


async def log_nutrition_with_id(user_id, date, calories, protein, fats, carbs, dish_name="Прийом їжі (ШІ)", weight_g=0):
    async with aiosqlite.connect(DB_NAME) as db:
        cursor = await db.execute(
            'INSERT INTO nutrition_logs (user_id, date, dish_name, calories, protein, fats, carbs, weight_g) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (user_id, date, dish_name, calories, protein, fats, carbs, weight_g))
        log_id = cursor.lastrowid
        await db.execute('UPDATE users SET exp = exp + 5 WHERE user_id = ?', (user_id,))
        await db.commit()
        return log_id


async def update_nutrition_log(log_id, calories, protein, fats, carbs, dish_name=None, weight_g=0):
    async with aiosqlite.connect(DB_NAME) as db:
        if dish_name:
            await db.execute(
                'UPDATE nutrition_logs SET dish_name = ?, calories = ?, protein = ?, fats = ?, carbs = ?, weight_g = ? WHERE id = ?',
                (dish_name, calories, protein, fats, carbs, weight_g, log_id))
        else:
            await db.execute(
                'UPDATE nutrition_logs SET calories = ?, protein = ?, fats = ?, carbs = ?, weight_g = ? WHERE id = ?',
                (calories, protein, fats, carbs, weight_g, log_id))
        await db.commit()


async def get_today_nutrition(user_id, date):
    async with aiosqlite.connect(DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
                'SELECT SUM(calories) as cals, SUM(protein) as prot, SUM(fats) as fat, SUM(carbs) as carb FROM nutrition_logs WHERE user_id = ? AND date = ?',
                (user_id, date)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row and row['cals'] is not None else {"cals": 0, "prot": 0, "fat": 0, "carb": 0}


async def get_today_nutrition_logs(user_id, date):
    async with aiosqlite.connect(DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
                'SELECT id, dish_name, calories, protein, fats, carbs, weight_g FROM nutrition_logs WHERE user_id = ? AND date = ? ORDER BY id DESC',
                (user_id, date)) as cursor:
            return [dict(row) for row in await cursor.fetchall()]


async def delete_nutrition_log(log_id, user_id):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute('DELETE FROM nutrition_logs WHERE id = ? AND user_id = ?', (log_id, user_id))
        await db.commit()


# --- ВОДА ТА ЗАМІРИ ---

async def log_water(user_id: int, date: str, amount: int):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute('''INSERT INTO water_logs (user_id, date, amount)
                            VALUES (?, ?, ?) ON CONFLICT(user_id, date) DO
        UPDATE SET amount = amount + ?''',
                         (user_id, date, amount, amount))
        await db.commit()


async def get_today_water(user_id: int, date: str) -> int:
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute('SELECT amount FROM water_logs WHERE user_id = ? AND date = ?',
                              (user_id, date)) as cursor:
            row = await cursor.fetchone()
            return row[0] if row else 0


async def log_body_metrics(user_id: int, date: str, waist: float, hips: float, chest: float, biceps: float):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute('''INSERT INTO body_metrics (user_id, date, waist, hips, chest, biceps)
                            VALUES (?, ?, ?, ?, ?, ?)''',
                         (user_id, date, waist, hips, chest, biceps))
        await db.commit()


async def get_body_metrics_history(user_id: int):
    async with aiosqlite.connect(DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
                'SELECT date, waist, hips, chest, biceps FROM body_metrics WHERE user_id = ? ORDER BY date ASC',
                (user_id,)) as cursor:
            return [dict(row) for row in await cursor.fetchall()]


# --- М'ЯЗОВА ВТОМА (МАПА ТІЛА) ---

async def get_muscle_fatigue_state(user_id: int):
    async with aiosqlite.connect(DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute('SELECT muscle, fatigue_level, last_updated FROM muscle_fatigue WHERE user_id = ?',
                              (user_id,)) as cursor:
            return [dict(row) for row in await cursor.fetchall()]


async def update_muscle_fatigue_state(user_id: int, muscle: str, fatigue_level: float, update_time: str):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute('''INSERT INTO muscle_fatigue (user_id, muscle, fatigue_level, last_updated)
                            VALUES (?, ?, ?, ?) ON CONFLICT(user_id, muscle) DO
        UPDATE SET
            fatigue_level = ?, last_updated = ?''',
                         (user_id, muscle, fatigue_level, update_time, fatigue_level, update_time))
        await db.commit()


# --- СТАТИСТИКА ТА ДОСЯГНЕННЯ ---

async def get_progress_data(user_id):
    async with aiosqlite.connect(DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        weight_history = []
        async with db.execute('SELECT date, weight FROM weight_logs WHERE user_id = ? ORDER BY date ASC',
                              (user_id,)) as cursor:
            async for row in cursor: weight_history.append(dict(row))

        exercise_history = {}
        async with db.execute(
                'SELECT date(date) as log_date, exercise_name, MAX(weight) as max_weight FROM workout_logs WHERE user_id = ? GROUP BY date(date), exercise_name ORDER BY log_date ASC',
                (user_id,)) as cursor:
            async for row in cursor:
                ex_name = row['exercise_name']
                if ex_name not in exercise_history: exercise_history[ex_name] = []
                exercise_history[ex_name].append({"date": row['log_date'], "weight": row['max_weight']})

        body_metrics_history = await get_body_metrics_history(user_id)

        return {
            "body_weight": weight_history,
            "exercises": exercise_history,
            "body_metrics": body_metrics_history
        }


async def get_user_stats(user_id):
    async with aiosqlite.connect(DB_NAME) as db:
        c = await db.execute('SELECT COUNT(DISTINCT date(date)) FROM workout_logs WHERE user_id = ?', (user_id,))
        w = (await c.fetchone())[0] or 0
        c = await db.execute('SELECT COUNT(*) FROM workout_logs WHERE user_id = ?', (user_id,))
        s = (await c.fetchone())[0] or 0
        c = await db.execute('SELECT SUM(weight * reps) FROM workout_logs WHERE user_id = ?', (user_id,))
        v = (await c.fetchone())[0] or 0
        c = await db.execute('SELECT COUNT(*) FROM nutrition_logs WHERE user_id = ?', (user_id,))
        m = (await c.fetchone())[0] or 0
        c = await db.execute('SELECT COUNT(*) FROM daily_checkins WHERE user_id = ?', (user_id,))
        ch = (await c.fetchone())[0] or 0
        return {"workouts": w, "sets": s, "volume": int(v), "meals": m, "checkins": ch}


# --- РОЗУМНА БІБЛІОТЕКА ВПРАВ ---

async def get_exercise_info(name: str):
    async with aiosqlite.connect(DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute('SELECT * FROM exercise_library WHERE name = ?', (name.strip().lower(),)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def save_exercise_info(name: str, muscles: str, instruction: str):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute('''INSERT OR REPLACE INTO exercise_library (name, muscles, instruction)
                            VALUES (?, ?, ?)''', (name.strip().lower(), muscles, instruction))
        await db.commit()


# =========================================================
# PUSH-СПОВІЩЕННЯ ТА ФОНОВІ ЗАДАЧІ
# =========================================================

async def get_all_users_for_notifications():
    async with aiosqlite.connect(DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
                'SELECT user_id, name, workout_plan, nutrition_goals, language FROM users WHERE (role="client" OR role IS NULL) AND workout_plan IS NOT NULL AND workout_plan != ""') as cursor:
            return [dict(row) for row in await cursor.fetchall()]


async def get_user_daily_summary(user_id: int, date: str):
    async with aiosqlite.connect(DB_NAME) as db:
        c1 = await db.execute('SELECT COUNT(*) FROM daily_checkins WHERE user_id = ? AND date = ?', (user_id, date))
        has_checkin = (await c1.fetchone())[0] > 0

        c2 = await db.execute('SELECT amount FROM water_logs WHERE user_id = ? AND date = ?', (user_id, date))
        w_row = await c2.fetchone()
        water_ml = w_row[0] if w_row else 0

        c3 = await db.execute('SELECT COUNT(*) FROM workout_logs WHERE user_id = ? AND date LIKE ?',
                              (user_id, f"{date}%"))
        workout_sets = (await c3.fetchone())[0]

        c4 = await db.execute('SELECT COUNT(*) FROM nutrition_logs WHERE user_id = ? AND date = ?', (user_id, date))
        meals_logged = (await c4.fetchone())[0]

        return {
            "has_checkin": has_checkin,
            "water_ml": water_ml,
            "workout_sets": workout_sets,
            "meals_logged": meals_logged
        }