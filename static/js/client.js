/* =========================================================
   FITNESS HUB PRO | ЯДРО ДОДАТКУ (client.js)
   ========================================================= */

// --- 1. ГЛОБАЛЬНІ ЗМІННІ (Доступні у всіх файлах) ---
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.expand();
    tg.enableClosingConfirmation();
    tg.ready();
}

// Використовуємо var, щоб скрипти не конфліктували між собою
var loc = window.loc || function(key, fallback) { return fallback !== undefined ? fallback : key; };

let userId = 1100202114; // За замовчуванням (твій ID для тестування)
let userNameTg = "";

if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    if (tg.initDataUnsafe.user.id) userId = tg.initDataUnsafe.user.id;
    if (tg.initDataUnsafe.user.username) userNameTg = tg.initDataUnsafe.user.username;
}

// Змінні стану користувача
let userData = null;
let progressDataInfo = null;

// Графіки
let weightChartInstance = null;
let exerciseChartInstance = null;
let metricsChartInstance = null;

// Змінні для трекерів води та тренувань (використовуються в client_tracking.js)
let todayWater = 0;
const DAILY_WATER_GOAL_ML = 2000;
let currentExercise = '';
let currentExType = 'strength';
let currentExTotalSets = 1;
let currentExExpectedRepsStr = '';
let currentDayIndex = 0;
let globalActiveTab = null;
let currentPlanDay = '';
let timerInterval = null;
let currentTimerLeft = 0;
const REST_TIME_SECONDS = 90;

// Оновлені налаштування для Chart.js під преміум дизайн
try {
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#888888';
        Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
        Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';
    }
} catch (err) {}

// --- ДОПОМІЖНА ФУНКЦІЯ ДЛЯ МАРКДАУНУ (ЖИРНИЙ ШРИФТ ВІД ШІ) ---
window.formatMarkdown = function(text) {
    if (!text) return "";
    return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
};

// --- 2. СТАРТ ДОДАТКУ ---

function initApp() {
    refreshUserData().catch(function(e) {
        console.error("Помилка ініціалізації:", e);
        const loadingText = document.getElementById('loading-text');
        if (loadingText) loadingText.innerText = loc('alert_error', "Помилка зв'язку.");
    });

    sendPing();
    setInterval(sendPing, 60000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function sendPing() {
    fetch('/api/ping', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
        body: JSON.stringify({ user_id: userId, username: userNameTg, language: window.appLanguage || 'uk' })
    }).catch(function(e) {});
}

async function refreshUserData() {
    try {
        const res = await fetch('/api/user/' + userId, {
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
        });

        if (!res.ok) throw new Error("Сервер повернув помилку " + res.status);
        const data = await res.json();

        if (data.status === 'found' && data.workout_plan) {
            userData = data;
            renderApp();
        } else {
            showView('form-view');
        }
    } catch (e) {
        console.error(e);
        const loadingText = document.getElementById('loading-text');
        if (loadingText) loadingText.innerText = loc('alert_error', "Помилка зв'язку.");
    }
}

// --- 3. РЕНДЕР ІНТЕРФЕЙСУ ---

function getGoalName(goal) {
    const map = {
        'lose': loc('goal_lose', 'Схуднення / Сушка'),
        'maintain': loc('goal_maintain', 'Підтримка форми'),
        'gain': loc('goal_gain', 'Набір маси'),
        'strength': loc('goal_strength', 'Максимальна сила'),
        'endurance': loc('goal_endurance', 'Витривалість'),
        'custom': loc('goal_custom', 'Своя ціль'),
        'competition': loc('goal_competition', '🏆 Підготовка до змагань')
    };
    return map[goal] || goal;
}

function getActivityName(act) {
    const map = {
        'sedentary': loc('act_sedentary', 'Сидячий'),
        'light': loc('act_light', 'Легкий'),
        'medium': loc('act_medium', 'Середній'),
        'active': loc('act_active', 'Високий'),
        'very_active': loc('act_very_active', 'Дуже високий')
    };
    return map[act] || act;
}

function renderApp() {
    try {
        const nav = document.getElementById('bottom-nav');
        if (nav) nav.style.display = 'flex';

        const u = userData.user;

        const navCycleBtn = document.getElementById('nav-cycle-btn');
        if (navCycleBtn) {
            navCycleBtn.style.display = (u.gender === 'female') ? '' : 'none';
        }

        const adminPanelBtn = document.getElementById('btn-admin-panel');
        const becomeTrainerBtn = document.getElementById('btn-become-trainer');
        const switchBtn = document.getElementById('trainer-switch-container');

        if (userId === 1100202114) {
            if (adminPanelBtn) adminPanelBtn.style.display = 'block';
        } else {
            if (adminPanelBtn) adminPanelBtn.style.display = 'none';
        }

        if (u.role === 'trainer') {
            if (switchBtn) switchBtn.style.display = 'block';
            if (becomeTrainerBtn) becomeTrainerBtn.style.display = 'none';
        } else {
            if (switchBtn) switchBtn.style.display = 'none';
            if (becomeTrainerBtn) becomeTrainerBtn.style.display = 'block';
        }

        if(document.getElementById('prof-name')) document.getElementById('prof-name').innerText = u.name || loc('default_athlete', 'Атлет');
        if(document.getElementById('prof-mini-lvl')) document.getElementById('prof-mini-lvl').innerText = '(' + loc('level_short', 'Рв.') + ' ' + (u.level || 1) + ')';
        if(document.getElementById('prof-mini-streak')) document.getElementById('prof-mini-streak').innerText = '🔥 ' + (u.current_streak || 0);

        if(document.getElementById('prof-weight')) document.getElementById('prof-weight').innerText = u.weight + ' ' + loc('kg', 'кг');
        if(document.getElementById('prof-target')) document.getElementById('prof-target').innerText = u.target_weight + ' ' + loc('kg', 'кг');
        if(document.getElementById('prof-height')) document.getElementById('prof-height').innerText = u.height + ' ' + loc('cm', 'см');
        if(document.getElementById('prof-age')) document.getElementById('prof-age').innerText = u.age;
        if(document.getElementById('prof-goal')) document.getElementById('prof-goal').innerText = getGoalName(u.primary_goal);
        if(document.getElementById('prof-activity')) document.getElementById('prof-activity').innerText = getActivityName(u.activity_level);

        const prefsInput = document.getElementById('food-prefs-input');
        if (prefsInput) prefsInput.value = u.food_preferences || '';

        const coachNutriCard = document.getElementById('coach-nutrition-card');
        const coachNutriPlan = document.getElementById('coach-nutrition-plan');
        if (u.nutrition_plan && u.nutrition_plan.trim() !== '') {
            if (coachNutriPlan) coachNutriPlan.innerHTML = window.formatMarkdown(u.nutrition_plan);
            if (coachNutriCard) coachNutriCard.style.display = 'block';
        } else {
            if (coachNutriCard) coachNutriCard.style.display = 'none';
        }

        const trainerStatusEl = document.getElementById('prof-trainer-status');
        const coachTextEl = document.getElementById('coach-status-text');

        if (u.trainer_name) {
            if (trainerStatusEl) {
                trainerStatusEl.innerText = loc('in_team', 'В команді: ') + u.trainer_name;
                trainerStatusEl.style.display = 'inline-block';
            }
            if (coachTextEl) {
                coachTextEl.innerHTML = loc('coach_active_text', 'Ваш персональний тренер <b>{name}</b> завжди на зв\'язку.').replace('{name}', u.trainer_name);
            }
        } else {
            if (trainerStatusEl) trainerStatusEl.style.display = 'none';
            if (coachTextEl) coachTextEl.innerHTML = loc('coach_ai_text', 'У вас поки немає тренера. Ви працюєте з ШІ-наставником.');
        }

        const compActive = document.getElementById('comp-active-view');
        const compEmpty = document.getElementById('comp-empty-view');
        const dashCompBanner = document.getElementById('dashboard-comp-banner');

        if (u.primary_goal === 'competition' && u.competition_sport && u.competition_date) {
            const d = new Date(u.competition_date);
            const today = new Date();
            const diffTime = d - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let daysText = diffDays > 0 ? loc('comp_days_left', `⏳ Залишилось {days} днів!`).replace('{days}', diffDays) : (diffDays === 0 ? loc('comp_today', "🔥 Змагання СЬОГОДНІ!") : loc('comp_passed', "🏁 Змагання пройшли"));
            let daysColor = diffDays > 0 ? "var(--success)" : (diffDays === 0 ? "var(--danger)" : "var(--hint-color)");

            if(document.getElementById('comp-sport-display')) document.getElementById('comp-sport-display').innerText = u.competition_sport;
            if(document.getElementById('comp-date-display')) document.getElementById('comp-date-display').innerText = u.competition_date.split('-').reverse().join('.');
            if(document.getElementById('comp-countdown-display')) {
                document.getElementById('comp-countdown-display').innerText = daysText;
                document.getElementById('comp-countdown-display').style.color = daysColor;
            }

            if(compActive) compActive.style.display = 'block';
            if(compEmpty) compEmpty.style.display = 'none';

            if (dashCompBanner) {
                dashCompBanner.style.display = 'flex';
                if(document.getElementById('dash-comp-sport')) document.getElementById('dash-comp-sport').innerText = u.competition_sport;
                if(document.getElementById('dash-comp-days')) {
                    document.getElementById('dash-comp-days').innerText = daysText;
                    document.getElementById('dash-comp-days').style.color = daysColor;
                }
            }
        } else {
            if(compActive) compActive.style.display = 'none';
            if(compEmpty) compEmpty.style.display = 'block';
            if(dashCompBanner) dashCompBanner.style.display = 'none';
        }

        if (userData.workout_plan) {
            if(document.getElementById('plan-title')) document.getElementById('plan-title').innerText = userData.workout_plan.plan_name || loc('default_plan_name', "Персональна програма");

            if (userData.workout_plan.explanation) {
                if(document.getElementById('plan-explanation')) document.getElementById('plan-explanation').innerHTML = window.formatMarkdown(userData.workout_plan.explanation);
                if(document.getElementById('ai-insight-box')) document.getElementById('ai-insight-box').style.display = 'block';
            }

            if (userData.workout_plan.projections) {
                if(document.getElementById('plan-projections')) document.getElementById('plan-projections').innerHTML = window.formatMarkdown(userData.workout_plan.projections);
                if(document.getElementById('ai-projection-box')) document.getElementById('ai-projection-box').style.display = 'block';
            }

            const hasAdapted = userData.today_checkin && userData.today_checkin.adapted_plan;

            let tabToRender = (typeof globalActiveTab !== 'undefined' && globalActiveTab !== null) ? globalActiveTab : (hasAdapted ? 'adapted' : 0);
            if (tabToRender === 'adapted' && !hasAdapted) tabToRender = 0;

            if (typeof renderWorkoutDays === 'function') renderWorkoutDays(tabToRender);

            if(document.getElementById('finish-workout-wrapper')) document.getElementById('finish-workout-wrapper').style.display = 'block';
        }

        if (typeof loadNutrition === 'function') loadNutrition();

        if (!document.querySelector('.view.active:not(#loading-view)')) {
            showView('dashboard-view');
        } else {
            const loader = document.getElementById('loading-view');
            if (loader) {
                loader.style.display = 'none';
                loader.classList.remove('active');
            }
        }
    } catch (err) {
        console.error("Помилка відмальовування інтерфейсу:", err);
    }
}

// --- Реєстрація Тренера ---
async function registerAsTrainer() {
    if (!confirm(loc('confirm_become_trainer', "Ви впевнені, що хочете стати тренером? Це відкриє вам доступ до панелі наставника."))) return;

    const btn = document.getElementById('btn-become-trainer');
    if(btn) { btn.disabled = true; btn.innerText = "⏳..."; }

    try {
        const res = await fetch('/api/register_trainer', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
            body: JSON.stringify({ user_id: userId })
        });
        const data = await res.json();

        if (data.status === 'success') {
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            if (tg && tg.showAlert) tg.showAlert(loc('trainer_success_alert', "🎉 Вітаємо! Ви стали тренером. Відкрийте панель, щоб скопіювати своє посилання-запрошення."));
            await refreshUserData();
        }
    } catch (e) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_error', "Помилка."));
        if(btn) { btn.disabled = false; btn.innerText = "🎓 Стати Тренером"; }
    }
}

// --- 4. НАЛАШТУВАННЯ ПРОФІЛЮ ТА ЗМАГАНЬ ---

function openQuickCompModal() {
    const u = userData.user;
    if (u.competition_sport) document.getElementById('quick-comp-sport').value = u.competition_sport;
    if (u.competition_date) document.getElementById('quick-comp-date').value = u.competition_date;
    const modal = document.getElementById('quick-comp-modal');
    if (modal) modal.classList.add('active');
}

async function saveQuickComp() {
    const sport = document.getElementById('quick-comp-sport').value.trim();
    const date = document.getElementById('quick-comp-date').value;
    if (!sport || !date) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_fill_fields', "Заповніть всі поля"));
        return;
    }

    const btn = document.getElementById('btn-save-quick-comp');
    if(btn) { btn.disabled = true; btn.innerText = "⏳..."; }
    showLoading(loc('loading_ai', "ШІ працює..."));

    const u = userData.user;
    const payload = {
        user_id: userId, name: u.name, gender: u.gender, height: u.height, age: u.age, weight: u.weight, target_weight: u.target_weight, activity_level: u.activity_level,
        primary_goal: 'competition', competition_sport: sport, competition_date: date,
        language: window.appLanguage || 'uk'
    };

    try {
        await fetch('/api/edit_profile', { method: 'POST', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'}, body: JSON.stringify(payload) });
        await fetch('/api/generate_plan/' + userId, { method: 'POST', headers: { 'ngrok-skip-browser-warning': 'true' } });
        closeModal('quick-comp-modal');
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        await refreshUserData();
    } catch (e) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_error', "Помилка."));
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = "Зберегти"; }
    }
}

async function clearCompetition() {
    if (!confirm(loc('confirm_cancel_comp', "Скасувати підготовку до змагань?"))) return;
    showLoading(loc('loading_ai', "Оновлення..."));
    const u = userData.user;
    const payload = {
        user_id: userId, name: u.name, gender: u.gender, height: u.height, age: u.age, weight: u.weight, target_weight: u.target_weight, activity_level: u.activity_level,
        primary_goal: 'maintain', competition_sport: '', competition_date: '',
        language: window.appLanguage || 'uk'
    };
    try {
        await fetch('/api/edit_profile', { method: 'POST', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'}, body: JSON.stringify(payload) });
        await fetch('/api/generate_plan/' + userId, { method: 'POST', headers: { 'ngrok-skip-browser-warning': 'true' } });
        closeModal('quick-comp-modal');
        await refreshUserData();
    } catch(e) {}
}

async function saveFoodPrefs() {
    const prefsInput = document.getElementById('food-prefs-input');
    if (!prefsInput) return;
    try {
        await fetch('/api/user/food_prefs', {
            method: 'POST', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
            body: JSON.stringify({ user_id: userId, prefs: prefsInput.value })
        });
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        if (tg && tg.showAlert) tg.showAlert(loc('alert_saved', "Успішно збережено!"));
        refreshUserData();
    } catch(e) {}
}

function toggleCustomGoal(selectId, containerId, inputId) {
    const goalEl = document.getElementById(selectId);
    if(!goalEl) return;
    const goal = goalEl.value;
    const container = document.getElementById(containerId);
    const compContainer = document.getElementById(selectId === 'goal' ? 'competition-container' : 'edit-competition-container');
    if (container) {
        if (goal === 'custom' || goal === 'strength' || goal === 'endurance') { container.style.display = 'block'; }
        else { container.style.display = 'none'; if (document.getElementById(inputId)) document.getElementById(inputId).value = ''; }
    }
    if (compContainer) { if (goal === 'competition') { compContainer.style.display = 'block'; } else { compContainer.style.display = 'none'; } }
}

function toggleCycleContainer(genderSelectId, containerId) {
    const genderEl = document.getElementById(genderSelectId);
    if(!genderEl) return;
    const gender = genderEl.value;
    const container = document.getElementById(containerId);
    if (container) {
        if (gender === 'female') {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }
}

function openEditProfileModal() {
    const u = userData.user;
    if(document.getElementById('edit-height')) document.getElementById('edit-height').value = u.height;
    if(document.getElementById('edit-age')) document.getElementById('edit-age').value = u.age;
    if(document.getElementById('edit-weight')) document.getElementById('edit-weight').value = u.weight;
    if(document.getElementById('edit-target-weight')) document.getElementById('edit-target-weight').value = u.target_weight;
    if(document.getElementById('edit-activity')) document.getElementById('edit-activity').value = u.activity_level;

    if (u.competition_sport) {
        const compContainer = document.getElementById('edit-competition-container');
        if (compContainer) compContainer.style.display = 'block';
        if(document.getElementById('edit_comp_sport')) document.getElementById('edit_comp_sport').value = u.competition_sport;
        if(document.getElementById('edit_comp_date')) document.getElementById('edit_comp_date').value = u.competition_date;
    }

    const cycleContainer = document.getElementById('edit-cycle-container');
    if (u.gender === 'female') {
        if (cycleContainer) cycleContainer.style.display = 'block';
        if (u.cycle_start_date && document.getElementById('edit_cycle_start_date')) document.getElementById('edit_cycle_start_date').value = u.cycle_start_date;
        if (u.cycle_length && document.getElementById('edit_cycle_length')) document.getElementById('edit_cycle_length').value = u.cycle_length;
    } else {
        if (cycleContainer) cycleContainer.style.display = 'none';
    }

    const modal = document.getElementById('edit-profile-modal');
    if(modal) modal.classList.add('active');
}

async function smartRebuildPlan() {
    const textEl = document.getElementById('smart-rebuild-text');
    const text = textEl ? textEl.value.trim() : '';
    if (!text) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_fill_fields', "Опишіть, що змінилось."));
        return;
    }

    if (!confirm(loc('confirm_rebuild_plan', "Це перепише ваш поточний план. Продовжити?"))) return;

    const btn = document.getElementById('btn-smart-rebuild');
    if (btn) { btn.disabled = true; btn.innerText = "⏳..."; }
    showLoading(loc('loading_ai', "ШІ аналізує..."));

    try {
        const res = await fetch('/api/smart_rebuild_plan', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
            body: JSON.stringify({ user_id: userId, update_text: text })
        });
        const data = await res.json();
        if (data.status === 'success') {
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            if (textEl) textEl.value = '';
            await refreshUserData();
        } else throw new Error();
    } catch (e) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_error', "Помилка"));
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = "🔄 Перебудувати план"; }
        showView('dashboard-view');
    }
}

async function submitEditProfile() {
    const u = userData.user;
    const compSportEl = document.getElementById('edit_comp_sport');
    const compDateEl = document.getElementById('edit_comp_date');
    const cycleStartEl = document.getElementById('edit_cycle_start_date');
    const cycleLengthEl = document.getElementById('edit_cycle_length');

    const payload = {
        user_id: userId, name: u.name, gender: u.gender, primary_goal: u.primary_goal,
        height: parseInt(document.getElementById('edit-height').value), age: parseInt(document.getElementById('edit-age').value), weight: parseFloat(document.getElementById('edit-weight').value), target_weight: parseFloat(document.getElementById('edit-target-weight').value), activity_level: document.getElementById('edit-activity').value,
        competition_sport: compSportEl ? compSportEl.value.trim() : "",
        competition_date: compDateEl ? compDateEl.value : "",
        cycle_start_date: cycleStartEl && u.gender === 'female' ? cycleStartEl.value : "",
        cycle_length: cycleLengthEl && u.gender === 'female' ? parseInt(cycleLengthEl.value) || 28 : 28,
        language: window.appLanguage || 'uk'
    };
    closeModal('edit-profile-modal');
    showLoading(loc('loading_ai', "Оновлення..."));
    try {
        await fetch('/api/edit_profile', { method: 'POST', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'}, body: JSON.stringify(payload) });
        await refreshUserData();
    } catch (e) { renderApp(); }
}

async function submitProfile() {
    const btn = document.getElementById('submit-btn');
    const nameEl = document.getElementById('user_name');
    const ageEl = document.getElementById('age');
    const heightEl = document.getElementById('height');
    const weightEl = document.getElementById('weight');
    const targetWeightEl = document.getElementById('target_weight');

    if(!nameEl || !ageEl || !heightEl || !weightEl || !targetWeightEl) return;

    const name = nameEl.value.trim();
    const age = parseInt(ageEl.value);
    const height = parseInt(heightEl.value);
    const weight = parseFloat(weightEl.value);
    const targetWeight = parseFloat(targetWeightEl.value);
    const gender = document.getElementById('gender').value;

    if (!name || !age || !height || !weight || !targetWeight) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_fill_fields', "Заповніть всі поля."));
        return;
    }
    if(btn) btn.disabled = true;
    showLoading(loc('loading_ai', "Аналіз..."));

    const compSportEl = document.getElementById('comp_sport');
    const compDateEl = document.getElementById('comp_date');
    const cycleStartEl = document.getElementById('cycle_start_date');
    const cycleLengthEl = document.getElementById('cycle_length');

    const payload = {
        user_id: userId, name: name, gender: gender, age: age, height: height, weight: weight, target_weight: targetWeight, activity_level: document.getElementById('activity').value, primary_goal: document.getElementById('goal').value, custom_goal: document.getElementById('custom_goal') ? document.getElementById('custom_goal').value : "", notes: document.getElementById('notes').value,
        competition_sport: compSportEl && compSportEl.parentNode.style.display !== 'none' ? compSportEl.value.trim() : "",
        competition_date: compDateEl && compDateEl.parentNode.style.display !== 'none' ? compDateEl.value : "",
        cycle_start_date: cycleStartEl && gender === 'female' ? cycleStartEl.value : "",
        cycle_length: cycleLengthEl && gender === 'female' ? parseInt(cycleLengthEl.value) || 28 : 28,
        language: window.appLanguage || 'uk'
    };
    try {
        await fetch('/api/profile', { method: 'POST', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'}, body: JSON.stringify(payload) });
        const planRes = await fetch('/api/generate_plan/' + userId, { method: 'POST', headers: { 'ngrok-skip-browser-warning': 'true' } });
        const planData = await planRes.json();
        if (planData.status === 'success') {
            await refreshUserData();
        } else {
            if (tg && tg.showAlert) tg.showAlert(loc('alert_error', "Помилка"));
            showView('form-view'); if(btn) btn.disabled = false;
        }
    } catch (e) { showView('form-view'); if(btn) btn.disabled = false; }
}

// --- 5. ГЕЙМІФІКАЦІЯ ---

async function loadGamification() {
    try {
        const res = await fetch('/api/gamification/' + userId, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const data = await res.json();
        if (data.status === 'success') {
            if(document.getElementById('game-lvl')) document.getElementById('game-lvl').innerText = data.level;
            if(document.getElementById('game-exp')) document.getElementById('game-exp').innerText = data.exp_prog;
            if(document.getElementById('game-exp-need')) document.getElementById('game-exp-need').innerText = data.exp_need;
            let percent = (data.exp_prog / data.exp_need) * 100;
            const fill = document.getElementById('game-exp-fill');
            if(fill) fill.style.width = percent + '%';

            if (userData && userData.user) {
                if(document.getElementById('game-streak')) document.getElementById('game-streak').innerText = userData.user.current_streak || 0;
                if(document.getElementById('game-freezes')) document.getElementById('game-freezes').innerText = userData.user.streak_freezes || 0;
            }

            const cont = document.getElementById('achievements-container');
            if(cont) {
                cont.innerHTML = '';
                data.achievements.forEach(function(a) {
                    let isUnlocked = a.unlocked ? 'unlocked' : '';
                    let currentProg = a.cur > a.target ? a.target : a.cur;

                    let title = loc('achieve_' + a.id + '_title', a.title || a.id);
                    let desc = loc('achieve_' + a.id + '_desc', a.desc || '');
                    let doneText = loc('achieve_done', 'Виконано!');

                    let icon = '🏆';
                    if (a.id.startsWith('a')) icon = '🥇';
                    if (a.id.startsWith('m')) icon = '🍏';
                    if (a.id.startsWith('c')) icon = '❤️‍🔥';
                    if (a.id.startsWith('s')) icon = '🏋️';
                    if (a.id.startsWith('v')) icon = '🚚';
                    if (a.id.startsWith('l')) icon = '⭐';

                    let progressHTML = a.unlocked ? '<div class="achieve-progress-text">' + doneText + '</div>' : '<div class="achieve-progress-bg"><div class="achieve-progress-fill" style="width: ' + ((currentProg/a.target)*100) + '%"></div></div><div class="achieve-progress-text">' + currentProg + ' / ' + a.target + '</div>';
                    cont.innerHTML += '<div class="achieve-card ' + isUnlocked + '"><div class="achieve-icon">' + icon + '</div><div class="achieve-title">' + title + '</div><div class="achieve-desc">' + desc + '</div>' + progressHTML + '</div>';
                });
            }

            loadLeaderboard('global');
            loadDuels();
        }
    } catch(e) {}
}

// --- 6. ГРАФІКИ ТА НОВА АНАТОМІЧНА МАПА ВТОМИ ---

async function loadProgressCharts() {
    try {
        const res = await fetch('/api/progress/' + userId, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const responseData = await res.json();
        if (responseData.status === 'success') {
            progressDataInfo = responseData.data;
            renderWeightChart(progressDataInfo.body_weight);
            renderMetricsChart(progressDataInfo.body_metrics);

            const select = document.getElementById('exercise-select');
            if (select) {
                select.innerHTML = '<option value="">-- --</option>';
                Object.keys(progressDataInfo.exercises).forEach(function(ex) { select.innerHTML += '<option value="' + ex + '">' + ex + '</option>'; });
                if (Object.keys(progressDataInfo.exercises).length > 0) { select.selectedIndex = 1; renderExerciseChart(); }
            }
        }
    } catch(e) {}
}

async function loadFatigueData() {
    try {
        const res = await fetch('/api/muscle_fatigue/' + userId, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const data = await res.json();
        if (data.status === 'success' && window.AnatomyMapper) {
            const gender = (userData && userData.user && userData.user.gender === 'female') ? 'female' : 'male';
            window.AnatomyMapper.drawBodyMap(gender);
            window.AnatomyMapper.applyFatigue(data.data);
        }
    } catch(e) { console.error("Помилка завантаження мапи тіла:", e); }
}

async function submitBodyMetrics() {
    const waist = parseFloat(document.getElementById('metric-waist').value) || 0;
    const hips = parseFloat(document.getElementById('metric-hips').value) || 0;
    const chest = parseFloat(document.getElementById('metric-chest').value) || 0;
    const biceps = parseFloat(document.getElementById('metric-biceps').value) || 0;

    if (!waist && !hips && !chest && !biceps) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_fill_fields', "Введіть замір!"));
        return;
    }
    const btn = document.getElementById('btn-save-metrics');
    if(btn) { btn.disabled = true; btn.innerText = "⏳..."; }

    try {
        await fetch('/api/log_body_metrics', { method: 'POST', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'}, body: JSON.stringify({user_id: userId, waist: waist, hips: hips, chest: chest, biceps: biceps}) });
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        if (tg && tg.showAlert) tg.showAlert(loc('alert_saved', "Збережено!"));

        document.getElementById('metric-waist').value = ''; document.getElementById('metric-hips').value = ''; document.getElementById('metric-chest').value = ''; document.getElementById('metric-biceps').value = '';
        loadProgressCharts();
    } catch(e) { console.error(e); } finally { if(btn) { btn.disabled = false; btn.innerText = loc('btn_save_metrics', "Зберегти заміри"); } }
}

function renderWeightChart(data) {
    if (typeof Chart === 'undefined' || !document.getElementById('weightChart')) return;
    if (weightChartInstance) weightChartInstance.destroy();
    const canvas = document.getElementById('weightChart'); if (!canvas) return; const ctx = canvas.getContext('2d');
    if (!data || data.length === 0) return;
    const labels = data.map(function(d) { return d.date.split('-').slice(1).join('/'); }); const weights = data.map(function(d) { return d.weight; });
    weightChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: loc('chart_weight', 'Вага (кг)'),
                data: weights,
                borderColor: '#00ea66',
                backgroundColor: 'rgba(0, 234, 102, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#000000',
                pointBorderColor: '#00ea66',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { min: Math.min.apply(null, weights) - 2, max: Math.max.apply(null, weights) + 2, grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false } },
                x: { grid: { display: false, drawBorder: false } }
            }
        }
    });
}

function renderExerciseChart() {
    if (typeof Chart === 'undefined' || !document.getElementById('exerciseChart')) return;
    const select = document.getElementById('exercise-select'); if (!select) return; const exName = select.value;
    if (exerciseChartInstance) exerciseChartInstance.destroy(); if (!exName || !progressDataInfo || !progressDataInfo.exercises[exName]) return;
    const data = progressDataInfo.exercises[exName]; const ctx = document.getElementById('exerciseChart').getContext('2d');
    const labels = data.map(function(d) { return d.date.split('-').slice(1).join('/'); }); const weights = data.map(function(d) { return d.weight; });
    exerciseChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: loc('chart_work_weight', 'Робоча вага (кг)'),
                data: weights,
                backgroundColor: '#d4af37',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false } },
                x: { grid: { display: false, drawBorder: false } }
            }
        }
    });
}

function renderMetricsChart(data) {
    if (typeof Chart === 'undefined' || !document.getElementById('metricsChart')) return;
    if (metricsChartInstance) metricsChartInstance.destroy();
    const canvas = document.getElementById('metricsChart'); if (!canvas) return;
    if (!data || data.length === 0) return;
    const ctx = canvas.getContext('2d'); const labels = data.map(function(d) { return d.date.split('-').slice(1).join('/'); });
    const datasets = [
        { label: loc('chart_waist', 'Талія'), data: data.map(function(d) { return d.waist > 0 ? d.waist : null; }), borderColor: '#ffffff', tension: 0.4, spanGaps: true },
        { label: loc('chart_hips', 'Стегна'), data: data.map(function(d) { return d.hips > 0 ? d.hips : null; }), borderColor: '#00ea66', tension: 0.4, spanGaps: true },
        { label: loc('chart_chest', 'Груди'), data: data.map(function(d) { return d.chest > 0 ? d.chest : null; }), borderColor: '#d4af37', tension: 0.4, spanGaps: true },
        { label: loc('chart_biceps', 'Біцепс'), data: data.map(function(d) { return d.biceps > 0 ? d.biceps : null; }), borderColor: '#ff2d55', tension: 0.4, spanGaps: true }
    ];
    metricsChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, labels: { color: '#888888', boxWidth: 12 } } },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false } },
                x: { grid: { display: false, drawBorder: false } }
            }
        }
    });
}

// --- 7. УТИЛІТИ НАВІГАЦІЇ ТА МОДАЛОК ---

function showView(viewId) {
    document.querySelectorAll('.view').forEach(function(el) {
        el.classList.remove('active');
        el.style.display = 'none';
    });

    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }
    window.scrollTo(0, 0);
}

function navTo(viewId, el) {
    document.querySelectorAll('.nav-item').forEach(function(item) { item.classList.remove('active'); });
    if (el) el.classList.add('active');

    if (typeof window.showView === 'function') {
        window.showView(viewId);
    } else {
        showView(viewId);
    }

    if (tg && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();

    if (viewId === 'progress-view') {
        loadProgressCharts();
        loadFatigueData();
    }
    if (viewId === 'gamification-view') loadGamification();
    if (viewId === 'cycle-view') loadCycleDashboard();
}

function showLoading(text) {
    const loadingText = document.getElementById('loading-text');
    if (loadingText) loadingText.innerText = text;

    if (typeof window.showView === 'function') {
        window.showView('loading-view');
    } else {
        showView('loading-view');
    }

    const loader = document.getElementById('loading-view');
    if(loader) loader.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');

    if (modalId === 'workout-modal' && typeof currentTimerLeft !== 'undefined') {
        if (typeof timerInterval !== 'undefined' && timerInterval) clearInterval(timerInterval);
        const timerView = document.getElementById('timer-view');
        const logForm = document.getElementById('log-form');
        if (timerView) timerView.style.display = 'none';
        if (logForm) logForm.style.display = 'block';
        if (typeof REST_TIME_SECONDS !== 'undefined') currentTimerLeft = REST_TIME_SECONDS;
        if (typeof updateTimerText === 'function') updateTimerText(currentTimerLeft);
    }
}

// --- 8. ЖІНОЧИЙ ЦИКЛ (Flo-стайл) ---

async function loadCycleDashboard() {
    try {
        const res = await fetch('/api/cycle/dashboard/' + userId, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const data = await res.json();
        if (data.status === 'success') {
            updateCycleUI(data);
            loadCycleInsight();
        }
    } catch (e) { console.error(e); }
}

function updateCycleUI(data) {
    const startDateStr = data.cycle_start_date;
    const cycleLength = data.cycle_length || 28;

    const ringText = document.getElementById('cycle-ring-text');
    const ringCircle = document.getElementById('cycle-ring-circle');

    if (!startDateStr) {
        if (ringText) ringText.innerHTML = loc('cycle_day', 'День') + " 1";
        return;
    }

    const startDate = new Date(startDateStr);
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let currentDay = diffDays >= 0 ? (diffDays % cycleLength) + 1 : 1;

    let phase = ""; let color = "";

    if (currentDay >= 1 && currentDay <= 5) {
        phase = loc('phase_menstruation', 'Менструація'); color = "#ff2d55";
    } else if (currentDay >= 6 && currentDay <= 13) {
        phase = loc('phase_follicular', 'Фолікулярна фаза'); color = "#00ea66";
    } else if (currentDay >= 14 && currentDay <= 16) {
        phase = loc('phase_ovulation', 'Овуляція'); color = "#0a84ff";
    } else {
        phase = loc('phase_luteal', 'Лютеїнова фаза'); color = "#ffd60a";
    }

    if (ringText) {
        ringText.innerHTML = `<span style="font-size: 48px; font-weight: 900; color: ${color}; font-family: 'Space Grotesk', sans-serif;">${loc('cycle_day', 'День')} ${currentDay}</span><br><span style="font-size: 14px; color: var(--hint-color); text-transform: uppercase; letter-spacing: 0.05em;">${phase}</span>`;
    }
    if (ringCircle) {
        ringCircle.style.borderColor = color;
        ringCircle.style.boxShadow = `0 0 30px ${color}40`;
    }

    document.querySelectorAll('.symptom-chip').forEach(el => el.classList.remove('active'));
    if (data.today_symptoms) {
        if (data.today_symptoms.flow_level) setActiveChipUI('flow', data.today_symptoms.flow_level);
        if (data.today_symptoms.pain_level > 0) setActiveChipUI('pain', data.today_symptoms.pain_level.toString());
        if (data.today_symptoms.mood) setActiveChipUI('mood', data.today_symptoms.mood);
    }
}

async function loadCycleInsight() {
    const insightEl = document.getElementById('cycle-insight-text');
    if (!insightEl) return;
    insightEl.innerText = loc('loading_ai', "ШІ аналізує...");

    try {
        const res = await fetch('/api/cycle/insight/' + userId, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const data = await res.json();
        if (data.status === 'success' && data.data && data.data.insight) {
            insightEl.innerText = data.data.insight;
        }
    } catch (e) {
        insightEl.innerText = loc('cycle_insight_default', "Слухайте своє тіло сьогодні!");
    }
}

function setActiveChipUI(category, value) {
    const chip = document.querySelector(`.symptom-chip[data-category="${category}"][data-value="${value}"]`);
    if (chip) chip.classList.add('active');
}

async function toggleSymptom(element, category, value) {
    document.querySelectorAll(`.symptom-chip[data-category="${category}"]`).forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    if (tg && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();

    const flow = document.querySelector('.symptom-chip[data-category="flow"].active')?.dataset.value || "";
    const pain = document.querySelector('.symptom-chip[data-category="pain"].active')?.dataset.value || "0";
    const mood = document.querySelector('.symptom-chip[data-category="mood"].active')?.dataset.value || "";
    const todayStr = new Date().toISOString().split('T')[0];

    try {
        await fetch('/api/cycle/symptoms', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
            body: JSON.stringify({ user_id: userId, date: todayStr, flow_level: flow, pain_level: parseInt(pain), mood: mood, notes: "" })
        });
    } catch (e) { console.error("Помилка збереження", e); }
}

async function logPeriodStart() {
    if (!confirm(loc('confirm_new_cycle', "Розпочати новий цикл сьогодні?"))) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const btn = document.getElementById('btn-log-period');
    if (btn) { btn.disabled = true; btn.innerText = "⏳..."; }

    try {
        await fetch('/api/cycle/period', {
            method: 'POST', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
            body: JSON.stringify({ user_id: userId, start_date: todayStr, end_date: "" })
        });
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        await refreshUserData();
        loadCycleDashboard();
    } catch (e) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_error', "Помилка"));
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = loc('btn_log_period', "Відмітити початок циклу"); }
    }
}

// =========================================================
// --- 9. СОЦІАЛЬНИЙ РУШІЙ ТА ЗМАГАННЯ (СТРІКИ, РЕЙТИНГИ, ДУЕЛІ) ---
// =========================================================

async function buyFreeze() {
    if (!confirm("Купити заморозку вогника за 500 EXP? Вона автоматично врятує ваш стрік, якщо ви пропустите день.")) return;

    try {
        const res = await fetch('/api/store/buy_freeze', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
            body: JSON.stringify({ user_id: userId })
        });
        const data = await res.json();

        if (data.status === 'success') {
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            if (tg && tg.showAlert) tg.showAlert(data.message);
            await refreshUserData();
            loadGamification();
        } else {
            if (tg && tg.showAlert) tg.showAlert(data.message);
        }
    } catch (e) {
        console.error(e);
    }
}

async function switchLeaderboard(type) {
    const btnGlobal = document.getElementById('btn-tab-global');
    const btnTeam = document.getElementById('btn-tab-team');

    if (!btnGlobal || !btnTeam) return;

    if (type === 'global') {
        btnGlobal.style.background = 'var(--text-color)';
        btnGlobal.style.color = '#000';
        btnTeam.style.background = 'transparent';
        btnTeam.style.color = 'var(--text-color)';
    } else {
        btnTeam.style.background = 'var(--text-color)';
        btnTeam.style.color = '#000';
        btnGlobal.style.background = 'transparent';
        btnGlobal.style.color = 'var(--text-color)';
    }

    if (tg && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
    await loadLeaderboard(type);
}

async function loadLeaderboard(type) {
    const container = document.getElementById('leaderboard-container');
    if (!container) return;

    container.innerHTML = '<p style="text-align: center; color: var(--hint-color); font-size: 14px;">Завантаження рейтингу...</p>';

    try {
        let url = '/api/leaderboard/global';
        if (type === 'team') {
            if (userData && userData.user && userData.user.trainer_id) {
                url = '/api/leaderboard/team/' + userData.user.trainer_id;
            } else {
                container.innerHTML = '<p style="text-align: center; color: var(--hint-color); font-size: 14px; padding: 20px;">Ви поки не перебуваєте в команді жодного тренера. <br><br>Знайдіть наставника, щоб змагатися разом з іншими атлетами!</p>';
                return;
            }
        }

        const res = await fetch(url, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const data = await res.json();

        if (data.status === 'success' && data.data && data.data.length > 0) {
            let html = '';
            data.data.forEach((user, index) => {
                let rankMedal = `${index + 1}.`;
                if (index === 0) rankMedal = '🥇';
                if (index === 1) rankMedal = '🥈';
                if (index === 2) rankMedal = '🥉';

                let isMe = (user.user_id === userId) ? 'background: rgba(10, 132, 255, 0.1); border-color: var(--client-blue);' : 'background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05);';

                html += `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid transparent; ${isMe} border-radius: 12px; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="font-weight: 900; font-size: 18px; width: 30px; text-align: center; color: var(--hint-color);">${rankMedal}</div>
                        <div>
                            <div style="font-weight: 700; font-size: 15px; color: var(--text-color);">${user.name} <span style="font-size: 11px; color: var(--accent-gold); border: 1px solid var(--accent-gold); padding: 2px 6px; border-radius: 4px; margin-left: 6px;">Lvl ${user.level}</span></div>
                            <div style="font-size: 12px; color: var(--hint-color); margin-top: 4px;">Досвід: <b style="color: var(--text-color);">${user.exp} EXP</b></div>
                        </div>
                    </div>
                    <div style="font-size: 18px; font-weight: bold; color: #ff9500; display: flex; align-items: center; gap: 4px;">🔥 <span style="font-size: 16px;">${user.current_streak}</span></div>
                </div>`;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--hint-color); font-size: 14px;">Рейтинг порожній.</p>';
        }
    } catch (e) {
        container.innerHTML = '<p style="text-align: center; color: var(--danger); font-size: 14px;">Помилка завантаження.</p>';
    }
}

function openCreateDuelModal() {
    const modal = document.getElementById('create-duel-modal');
    if (modal) modal.classList.add('active');
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

async function submitDuel() {
    const type = document.getElementById('duel-type').value;
    const bet = parseInt(document.getElementById('duel-bet').value);
    const days = parseInt(document.getElementById('duel-days').value);

    if (userData && userData.user && userData.user.exp < bet) {
        if (tg && tg.showAlert) tg.showAlert("❌ У вас недостатньо EXP для такої ставки!");
        return;
    }

    try {
        const res = await fetch('/api/duels/create', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
            body: JSON.stringify({ initiator_id: userId, opponent_id: 0, bet_exp: bet, duel_type: type, days: days })
        });
        const data = await res.json();

        if (data.status === 'success') {
            closeModal('create-duel-modal');

            const botUsername = "coach_app_bot"; // Назва твого бота
            let typeText = "";
            if (type === "workouts") typeText = "хто зробить більше тренувань";
            if (type === "calories") typeText = "хто спалить більше калорій";
            if (type === "streak") typeText = "хто не втратить свій вогник";

            const duelText = `⚔️ Я викликаю тебе на фітнес-дуель: ${typeText}! Ставка: ${bet} EXP. Приймаєш виклик?`;

            // Формуємо глибоке посилання для шерінгу в Telegram
            const shareUrl = `https://t.me/share/url?url=https://t.me/${botUsername}?start=duel_${data.duel_id}&text=${encodeURIComponent(duelText)}`;

            if (tg && tg.openTelegramLink) {
                tg.openTelegramLink(shareUrl);
            } else {
                alert("Дуель створено! ID: " + data.duel_id);
            }

            loadDuels(); // Оновлюємо список дуелей
        }
    } catch (e) {
        console.error(e);
        if (tg && tg.showAlert) tg.showAlert("Помилка створення дуелі.");
    }
}

async function loadDuels() {
    const container = document.getElementById('duels-container');
    if (!container) return;

    try {
        const res = await fetch('/api/duels/' + userId, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const data = await res.json();

        if (data.status === 'success' && data.data && data.data.length > 0) {
            let html = '';
            data.data.forEach(duel => {
                let statusColor = duel.status === 'pending' ? 'var(--warning)' : (duel.status === 'active' ? 'var(--client-blue)' : 'var(--hint-color)');
                let statusText = duel.status === 'pending' ? 'Очікує прийняття' : (duel.status === 'active' ? 'Битва триває' : 'Завершено');

                let typeLabel = "Невідомо";
                if (duel.duel_type === "workouts") typeLabel = "Тренування 🏋️";
                if (duel.duel_type === "calories") typeLabel = "Калорії 🔥";
                if (duel.duel_type === "streak") typeLabel = "Виживання (Стрік) ❄️";

                html += `
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
                        <span style="font-size: 11px; color: ${statusColor}; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 8px; border: 1px solid ${statusColor}40; border-radius: 4px;">${statusText}</span>
                        <span style="font-size: 12px; color: var(--hint-color); font-weight: bold;">Ставка: <span style="color: var(--accent-gold);">${duel.bet_exp} EXP</span></span>
                    </div>
                    <div style="font-size: 16px; font-weight: bold; color: var(--text-color); margin-bottom: 6px;">${typeLabel}</div>
                    <div style="font-size: 12px; color: var(--hint-color); display: flex; justify-content: space-between;">
                        <span>Завершення:</span> <span style="color: var(--text-color);">${duel.end_date.split(' ')[0]}</span>
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--hint-color); font-size: 14px;">У вас немає активних викликів.</p>';
        }
    } catch(e) {}
}

// =========================================================
// --- 10. МАРКЕТИНГ ТА ВІРАЛЬНІСТЬ (ШЕРІНГ РЕЗУЛЬТАТІВ) ---
// =========================================================

async function openWorkoutSummary() {
    showLoading(loc('loading_ai', "Підбиваємо підсумки..."));

    try {
        // ВІДНОВЛЕННЯ СТАНУ МОДАЛКИ ПЕРЕД НОВИМ ЗАПУСКОМ
        const shareCard = document.getElementById('shareable-card');
        const imgPreview = document.getElementById('result-image-preview');
        const btnShare = document.getElementById('btn-share-instagram');

        if (shareCard) shareCard.style.display = 'block';
        if (imgPreview) imgPreview.style.display = 'none';

        if (btnShare) {
            btnShare.innerText = "📸 Поділитися результатом";
            btnShare.style.background = "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)";
            btnShare.style.boxShadow = "0 4px 15px rgba(220, 39, 67, 0.4)";
            btnShare.disabled = false;
            btnShare.onclick = shareWorkoutResult;
        }

        const res = await fetch('/api/workout_summary/' + userId, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const data = await res.json();

        if (data.status === 'success') {
            const s = data.data;

            document.getElementById('sum-volume').innerText = s.volume || 0;
            document.getElementById('sum-calories').innerText = s.calories || 0;
            document.getElementById('sum-time').innerText = s.sets || 0;
            document.getElementById('sum-streak').innerText = s.streak || 0;

            const qrContainer = document.getElementById('share-qr-code');
            qrContainer.innerHTML = '';

            const botUsername = "coach_app_bot";
            const refUrl = `https://t.me/${botUsername}?start=ref_${userId}`;

            if (typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: refUrl,
                    width: 64,
                    height: 64,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.L
                });
            }

            showView('dashboard-view');
            document.getElementById('workout-summary-modal').classList.add('active');

            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
             throw new Error("API returned error status");
        }
    } catch (e) {
        console.error("Помилка завантаження статистики", e);
        if (tg && tg.showAlert) tg.showAlert(loc('alert_error', "Помилка завантаження статистики"));
        showView('dashboard-view');
    } finally {
        const loader = document.getElementById('loading-view');
        if (loader) {
            loader.style.display = 'none';
            loader.classList.remove('active');
        }
    }
}

async function shareWorkoutResult() {
    const shareCard = document.getElementById('shareable-card');
    const imgPreview = document.getElementById('result-image-preview');
    const btnShare = document.getElementById('btn-share-instagram');

    const originalText = btnShare.innerText;
    btnShare.innerText = "⏳ Створюємо магію...";
    btnShare.disabled = true;

    try {
        // Прокручуємо наверх, щоб html2canvas не збивався з масштабом
        window.scrollTo(0, 0);

        const canvas = await html2canvas(shareCard, {
            scale: window.devicePixelRatio || 2, // Оптимальний масштаб
            backgroundColor: '#0f0f0f',
            useCORS: true,
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');

        canvas.toBlob(async function(blob) {
            const file = new File([blob], "workout_result.png", { type: "image/png" });

            // 1. Спроба викликати нативне меню (працює не на всіх версіях Telegram WebView)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Мій результат тренування 💪',
                        text: 'Приєднуйся до моєї команди у Fitness Hub! 🔥'
                    });
                    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

                    btnShare.innerText = originalText;
                    btnShare.disabled = false;
                    return; // Успішно поділилися
                } catch (err) {
                    console.log("Шерінг скасовано користувачем або виникла помилка", err);
                }
            }

            // 2. НАДІЙНИЙ ФОЛБЕК: Показуємо картинку і просимо затиснути
            shareCard.style.display = 'none'; // Ховаємо HTML-картку
            imgPreview.src = imgData; // Підставляємо згенеровану картинку
            imgPreview.style.display = 'block'; // Показуємо її

            // Змінюємо кнопку на інструкцію
            btnShare.innerText = "📸 Затисніть фото, щоб зберегти";
            btnShare.style.background = "var(--client-blue)";
            btnShare.style.boxShadow = "none";
            btnShare.onclick = null; // Вимикаємо клік
            btnShare.disabled = false;

            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

        }, 'image/png');

    } catch (e) {
        console.error("Помилка генерації картинки", e);
        btnShare.innerText = originalText;
        btnShare.disabled = false;
        if (tg && tg.showAlert) tg.showAlert("Не вдалося згенерувати картинку. Спробуйте ще раз.");
    }
}