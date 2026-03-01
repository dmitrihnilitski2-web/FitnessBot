/* =========================================================
   FITNESS HUB PRO | ЛОГІКА ТРЕНЕРА (trainer.js)
   ========================================================= */

// 1. Безпечна ініціалізація Telegram WebApp
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.expand();
    tg.enableClosingConfirmation();
    tg.ready();
}

// Підключаємо глобальну функцію локалізації з i18n.js (захист від падінь)
const loc = window.loc || function(key, fallback) { return fallback !== undefined ? fallback : key; };

const botUsername = "coach_app_bot";

// 2. Бронебійне отримання ID тренера та Юзернейму
let trainerId = 1100202114;
let userNameTg = "";

if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    if (tg.initDataUnsafe.user.id) trainerId = tg.initDataUnsafe.user.id;
    if (tg.initDataUnsafe.user.username) userNameTg = tg.initDataUnsafe.user.username;
}

let currentClient = null;
let currentClientId = null;
let currentClientWorkout = null;
let currentClientCompletedSets = {};
let currentDayIndex = 0;
let globalActiveTab = null;

const goalTranslate = {
    'lose': 'Схуднення / Сушка', 'maintain': 'Підтримка форми', 'gain': 'Набір маси',
    'strength': 'Максимальна сила', 'endurance': 'Витривалість', 'custom': 'Своя ціль',
    'competition': '🏆 Підготовка до змагань'
};

// --- СТАРТ ДОДАТКУ ---

function initTrainerApp() {
    const inviteInput = document.getElementById('invite-link-input');
    if (inviteInput) {
        inviteInput.value = 'https://t.me/' + botUsername + '?start=trainer_' + trainerId;
    }

    loadClients().catch(function(e) {
        console.error("Помилка завантаження клієнтів:", e);
    });

    sendPing();
    setInterval(sendPing, 60000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrainerApp);
} else {
    initTrainerApp();
}

function sendPing() {
    fetch('/api/ping', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
        body: JSON.stringify({ user_id: trainerId, username: userNameTg })
    }).catch(function(e) {});
}

// --- РОБОТА З КОМАНДОЮ ---

async function loadClients() {
    const res = await fetch('/api/trainer/' + trainerId + '/clients', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
    });

    if (!res.ok) throw new Error("Net Error");
    const data = await res.json();

    const list = document.getElementById('clients-list');
    if (!list) return;

    list.innerHTML = '';

    if (!data.clients || data.clients.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding: 40px 20px;">
                <div style="font-size: 50px; margin-bottom: 15px; opacity: 0.5;">📭</div>
                <p style="color: var(--hint-color); font-size: 15px;">${loc('client_no_clients', 'У вас поки немає клієнтів. Надішліть своє реферальне посилання, щоб додати їх!')}</p>
            </div>`;
        return;
    }

    data.clients.forEach(function(c) {
        const displayGoal = goalTranslate[c.primary_goal] || c.primary_goal;
        list.innerHTML += `
            <div class="client-card" onclick="openClient(${c.user_id})">
                <div>
                    <div class="c-name">${c.name} <span style="color:var(--accent-gold); font-size:14px; font-weight: normal;">(Рв. ${c.level})</span></div>
                    <div class="c-info">${loc('client_goal', 'Ціль')}: ${displayGoal}</div>
                </div>
                <div style="font-size: 24px; opacity: 0.3;">›</div>
            </div>`;
    });
}

// --- НАВІГАЦІЯ ПО КАРТЦІ КЛІЄНТА ---

function switchClientTab(tabId) {
    document.querySelectorAll('.c-tab').forEach(function(el) { el.style.display = 'none'; });
    document.querySelectorAll('.day-tab').forEach(function(el) { el.classList.remove('active'); });

    const target = document.getElementById('c-tab-' + tabId);
    if (target) target.style.display = 'block';

    const btn = document.getElementById('tab-btn-' + tabId);
    if (btn) btn.classList.add('active');
}

async function openClient(clientId) {
    currentClientId = clientId;

    document.querySelectorAll('.nav-item').forEach(function(el) { el.classList.remove('active'); });
    showView('client-detail-view');
    switchClientTab('info');

    document.getElementById('cd-name').innerText = loc('loading_ai', "Завантаження...");
    document.getElementById('cd-goal').innerText = "...";
    document.getElementById('cd-plan-status').innerText = loc('loading_ai', "Очікуйте...");
    document.getElementById('t-workout-container').innerHTML = '';
    document.getElementById('t-food-logs').innerHTML = '<div class="spinner" style="margin: 20px auto;"></div>';

    try {
        const res = await fetch('/api/user/' + clientId, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const data = await res.json();

        if (data.status === 'found') {
            currentClient = data;
            currentClientWorkout = data.workout_plan;
            currentClientCompletedSets = data.today_completed_sets || {};

            document.getElementById('cd-name').innerText = data.user.name;
            document.getElementById('cd-goal').innerText = goalTranslate[data.user.primary_goal] || data.user.primary_goal;
            document.getElementById('cd-allergies').innerText = data.user.food_preferences || loc('client_food_prefs', "Клієнт ще не вказав алергії чи вподобання");
            document.getElementById('t-nutrition-input').value = data.user.nutrition_plan || "";

            if(document.getElementById('c-weight')) document.getElementById('c-weight').innerText = data.user.weight + ' кг';
            if(document.getElementById('c-target')) document.getElementById('c-target').innerText = data.user.target_weight + ' кг';
            if(document.getElementById('c-height')) document.getElementById('c-height').innerText = data.user.height + ' см';
            if(document.getElementById('c-age')) document.getElementById('c-age').innerText = data.user.age;

            const chkCard = document.getElementById('client-checkin-card');
            if (chkCard) {
                if (data.today_checkin) {
                    const chk = data.today_checkin;
                    document.getElementById('chk-val-sleep').innerText = chk.sleep + '/10';
                    document.getElementById('chk-val-energy').innerText = chk.energy + '/10';
                    document.getElementById('chk-val-stress').innerText = chk.stress + '/10';
                    document.getElementById('chk-val-soreness').innerText = chk.soreness + '/10';
                    chkCard.style.display = 'block';
                } else {
                    chkCard.style.display = 'none';
                }
            }

            if (data.workout_plan) {
                document.getElementById('cd-plan-status').innerText = data.workout_plan.plan_name || "Активний план";
                document.getElementById('cd-plan-status').style.color = "var(--success)";
                globalActiveTab = null;

                const hasAdapted = data.today_checkin && data.today_checkin.adapted_plan;
                renderWorkoutDays(hasAdapted ? 'adapted' : 0);
            } else {
                document.getElementById('cd-plan-status').innerText = loc('trainer_no_plan', "План відсутній");
                document.getElementById('cd-plan-status').style.color = "var(--danger)";
                document.getElementById('trainer-day-tabs').innerHTML = '';
            }
        }

        const nRes = await fetch('/api/nutrition/' + clientId, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const nData = await nRes.json();

        if (nData.consumed) {
            document.getElementById('t-cal-consumed').innerText = nData.consumed.cals || 0;
        }

        const logsContainer = document.getElementById('t-food-logs');
        logsContainer.innerHTML = '';

        if (nData.logs && nData.logs.length > 0) {
            nData.logs.forEach(function(l) {
                const weightText = l.weight_g ? `⚖️ ${l.weight_g}г | ` : '';
                logsContainer.innerHTML += `
                    <div style="padding: 10px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                        <b style="color: var(--text-color);">${l.dish_name}</b><br>
                        <span style="font-size:12px; color:var(--hint-color);">${weightText}🔥 ${l.calories} ккал | Б:${l.protein} Ж:${l.fats} В:${l.carbs}</span>
                    </div>`;
            });
        } else {
            logsContainer.innerHTML = `<p style="color:var(--hint-color); font-size:13px; text-align:center;">Ще немає записів за сьогодні.</p>`;
        }
    } catch(e) {
        console.error(e);
    }
}

// --- УПРАВЛІННЯ РАЦІОНОМ ---

async function saveNutritionPlan() {
    const plan = document.getElementById('t-nutrition-input').value;
    const btn = document.getElementById('btn-save-nutri');
    const originalText = btn ? btn.innerText : '';
    if(btn) { btn.disabled = true; btn.innerText = loc('loading_ai', "Збереження..."); }

    try {
        await fetch('/api/trainer/nutrition_plan', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
            body: JSON.stringify({ user_id: currentClientId, plan: plan })
        });

        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        if (tg && tg.showAlert) tg.showAlert(loc('alert_saved', "Успішно збережено!"));
    } catch(e) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_error', "Помилка збереження."));
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = originalText; }
    }
}

// --- УПРАВЛІННЯ ТРЕНУВАННЯМИ ---

async function generatePlanForClient() {
    if(!confirm("Згенерувати новий план через ШІ? Попередній буде видалено.")) return;

    if (tg && tg.showAlert) tg.showAlert(loc('loading_ai', "🧠 Генерація почалася. Це займе до 1 хвилини."));

    try {
        const res = await fetch('/api/generate_plan/' + currentClientId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
        });
        const data = await res.json();

        if(data.status === 'success') {
            if (tg && tg.showAlert) tg.showAlert(loc('alert_saved', "✅ ШІ успішно створив план!"));
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            openClient(currentClientId);
        }
    } catch(e) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_error', "Помилка генерації."));
    }
}

async function createManualPlan() {
    if(!confirm("Створити новий порожній план для ручного заповнення? Старий план зникне.")) return;

    const emptyPlan = {
        plan_name: "Персональна програма (Від тренера)",
        explanation: "Цей план складено вашим тренером вручну.",
        projections: "Слідуйте вказівкам тренера для найкращого результату.",
        days: [
            { day: 1, focus: "Тренування 1", exercises: [] },
            { day: 2, focus: "Тренування 2", exercises: [] },
            { day: 3, focus: "Тренування 3", exercises: [] }
        ]
    };

    try {
        await fetch('/api/update_workout_plan', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
            body: JSON.stringify({ user_id: currentClientId, plan: emptyPlan })
        });

        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        openClient(currentClientId);
    } catch(e) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_error', "Помилка створення плану."));
    }
}

// --- РОЗУМНА БІБЛІОТЕКА ВПРАВ ---
async function showExerciseInfo(name) {
    if (!document.getElementById('exercise-info-modal')) {
        if(tg && tg.showAlert) tg.showAlert(loc('loading_ai', "Зачекайте оновлення інтерфейсу."));
        return;
    }

    document.getElementById('info-modal-title').innerText = name;
    document.getElementById('info-modal-muscles').innerText = loc('loading_ai', "Завантаження...");
    document.getElementById('info-modal-instruction').innerText = loc('loading_ai', "ШІ аналізує біомеханіку вправи...");
    document.getElementById('btn-youtube-link').style.display = 'none';

    document.getElementById('exercise-info-modal').classList.add('active');
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

    try {
        const res = await fetch('/api/exercise_info/' + encodeURIComponent(name));
        const data = await res.json();

        if (data.status === 'success') {
            document.getElementById('info-modal-muscles').innerText = data.data.muscles;
            document.getElementById('info-modal-instruction').innerText = data.data.instruction;

            const ytUrl = `https://www.youtube.com/results?search_query=Як+робити+${encodeURIComponent(name)}+техніка+виконання`;
            const ytBtn = document.getElementById('btn-youtube-link');
            ytBtn.href = ytUrl;
            ytBtn.style.display = 'flex';

            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        } else {
            document.getElementById('info-modal-instruction').innerText = loc('alert_error', "Не вдалося завантажити інструкцію.");
        }
    } catch (e) {
        document.getElementById('info-modal-instruction').innerText = loc('alert_error', "Помилка зв'язку з сервером.");
    }
}

// --- ВІДМАЛЬОВКА ТРЕНУВАНЬ ---
function renderWorkoutDays(activeTabId) {
    if (!currentClient || !currentClient.workout_plan) return;

    globalActiveTab = activeTabId;
    const tabsContainer = document.getElementById('trainer-day-tabs');
    const cont = document.getElementById('t-workout-container');
    if(!tabsContainer || !cont) return;

    tabsContainer.innerHTML = '';
    cont.innerHTML = '';

    const days = currentClient.workout_plan.days || [];
    const hasAdapted = currentClient.today_checkin && currentClient.today_checkin.adapted_plan;

    if (typeof activeTabId === 'number') currentDayIndex = activeTabId;

    if (hasAdapted) {
        const activeClass = (activeTabId === 'adapted') ? 'active' : '';
        tabsContainer.innerHTML += `<div class="day-tab ${activeClass}" onclick="renderWorkoutDays('adapted')">⚡ Адаптовано</div>`;
    }

    days.forEach(function(d, index) {
        const activeClass = (activeTabId === index) ? 'active' : '';
        tabsContainer.innerHTML += `<div class="day-tab ${activeClass}" onclick="renderWorkoutDays(${index})">День ${d.day}</div>`;
    });

    if (days.length > 0) {
        const activeClass = (activeTabId === 'all') ? 'active' : '';
        tabsContainer.innerHTML += `<div class="day-tab ${activeClass}" onclick="renderWorkoutDays('all')">Весь план</div>`;
    }

    tabsContainer.style.display = 'flex';

    if (activeTabId === 'adapted' && hasAdapted) {
        const adapted = currentClient.today_checkin.adapted_plan;
        let html = '<div class="card" style="border: 1px solid var(--success);"><div style="color:var(--success); margin-bottom:15px; font-weight:bold;">⚡ АДАПТОВАНО: ' + adapted.focus + '</div>';

        (adapted.exercises || []).forEach(function(e, i) {
            const safeName = e.name.replace(/'/g, "\\'");
            const expectedReps = String(e.reps).replace(/'/g, "\\'");
            const key = 'adapted_' + e.name;
            const completedSets = currentClientCompletedSets[key] ? currentClientCompletedSets[key] : 0;
            const isCompleted = completedSets >= parseInt(e.sets);
            const rowClass = isCompleted ? "ex-row ex-completed" : "ex-row";
            const titleIcon = isCompleted ? "✅" : "🏋️";

            html += `
                <div class="${rowClass}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div style="flex:1; padding-right:10px;">
                        <div style="font-weight: bold; font-size: 15px;">${titleIcon} ${e.name}</div>
                        <div style="font-size: 13px; color: var(--hint-color); margin-top: 2px;">${e.sets} підходи × ${expectedReps}</div>
                        ${isCompleted ? `<div style="font-size:11px; color:var(--success); margin-top:2px;">Виконано сьогодні</div>` : ''}
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
                        <div style="background: rgba(10, 132, 255, 0.15); color: #0a84ff; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px;" onclick="showExerciseInfo('${safeName}')">ℹ️</div>
                        <div style="background: rgba(255, 159, 10, 0.15); color: #ff9f0a; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px;" onclick="tOpenEditEx('adapted', ${i}, '${safeName}', '${e.sets}', '${expectedReps}')">✏️</div>
                    </div>
                </div>`;
        });
        html += `<button class="secondary" style="color: var(--btn-color); margin-top: 15px;" onclick="tOpenEditEx('adapted', -1, '', '', '')">${loc('btn_add_exercise', '➕ Додати вправу')}</button></div>`;
        cont.innerHTML = html;

    } else {
        let daysToRender = activeTabId === 'all' ? days : [days[currentDayIndex]];
        if (!daysToRender[0]) daysToRender = days;

        daysToRender.forEach(function(d) {
            if (!d) return;
            let actualDayIndex = days.indexOf(d);
            let html = `<div class="card"><div style="color:var(--accent-gold); margin-bottom:15px; font-weight:bold; letter-spacing: 0.5px;">ДЕНЬ ${d.day}: ${d.focus}</div>`;

            (d.exercises || []).forEach(function(e, i) {
                const safeName = e.name.replace(/'/g, "\\'");
                const expectedReps = String(e.reps).replace(/'/g, "\\'");
                const key = actualDayIndex + '_' + e.name;
                const completedSets = currentClientCompletedSets[key] ? currentClientCompletedSets[key] : 0;
                const isCompleted = completedSets >= parseInt(e.sets);
                const rowClass = isCompleted ? "ex-row ex-completed" : "ex-row";
                const titleIcon = isCompleted ? "✅" : "🏋️";

                html += `
                    <div class="${rowClass}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <div style="flex:1; padding-right:10px;">
                            <div style="font-weight: bold; font-size: 15px;">${titleIcon} ${e.name}</div>
                            <div style="font-size: 13px; color: var(--hint-color); margin-top: 2px;">${e.sets} підходи × ${expectedReps}</div>
                            ${isCompleted ? `<div style="font-size:11px; color:var(--success); margin-top:2px;">Виконано сьогодні</div>` : ''}
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
                            <div style="background: rgba(10, 132, 255, 0.15); color: #0a84ff; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px;" onclick="showExerciseInfo('${safeName}')">ℹ️</div>
                            <div style="background: rgba(255, 159, 10, 0.15); color: #ff9f0a; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px;" onclick="tOpenEditEx('${actualDayIndex}', ${i}, '${safeName}', '${e.sets}', '${expectedReps}')">✏️</div>
                        </div>
                    </div>`;
            });
            if (activeTabId !== 'all') {
                html += `<button class="secondary" style="color: var(--btn-color); margin-top: 15px;" onclick="tOpenEditEx('${actualDayIndex}', -1, '', '', '')">${loc('btn_add_exercise', '➕ Додати вправу')}</button>`;
            }
            html += `</div>`;
            cont.innerHTML += html;
        });
    }
}

// --- РЕДАГУВАННЯ ВПРАВ ТРЕНЕРОМ ---

function tOpenEditEx(dayIndex, exIndex, name, sets, reps) {
    document.getElementById('t-edit-ex-day').value = dayIndex;
    document.getElementById('t-edit-ex-index').value = exIndex;
    document.getElementById('t-edit-ex-name').value = name;
    document.getElementById('t-edit-ex-sets').value = sets;
    document.getElementById('t-edit-ex-reps').value = reps;

    document.getElementById('t-edit-ex-title').innerText = (exIndex == -1) ? loc('btn_add_exercise', "Додати вправу") : "Редагувати вправу";
    document.getElementById('t-btn-delete-ex').style.display = (exIndex == -1) ? "none" : "block";
    document.getElementById('t-edit-exercise-modal').classList.add('active');
}

async function submitTrainerEditExercise() {
    const dayIndex = document.getElementById('t-edit-ex-day').value;
    const exIndex = parseInt(document.getElementById('t-edit-ex-index').value);
    const name = document.getElementById('t-edit-ex-name').value.trim();
    const sets = document.getElementById('t-edit-ex-sets').value.trim() || "1";
    const reps = document.getElementById('t-edit-ex-reps').value.trim() || "10";

    if (!name) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_fill_fields', "Введіть назву вправи"));
        return;
    }

    let isAdapted = (dayIndex === 'adapted');

    if (isAdapted) {
        if (!currentClient.today_checkin.adapted_plan.exercises) currentClient.today_checkin.adapted_plan.exercises = [];
        if (exIndex == -1) {
            currentClient.today_checkin.adapted_plan.exercises.push({name: name, sets: sets, reps: reps});
        } else {
            currentClient.today_checkin.adapted_plan.exercises[exIndex] = {name: name, sets: sets, reps: reps};
        }
    } else {
        let dIdx = parseInt(dayIndex);
        if (!currentClientWorkout.days[dIdx].exercises) currentClientWorkout.days[dIdx].exercises = [];
        if (exIndex == -1) {
            currentClientWorkout.days[dIdx].exercises.push({name: name, sets: sets, reps: reps});
        } else {
            currentClientWorkout.days[dIdx].exercises[exIndex] = {name: name, sets: sets, reps: reps};
        }
    }

    closeModal('t-edit-exercise-modal');
    await saveClientPlanToServer(isAdapted);
    renderWorkoutDays(isAdapted ? 'adapted' : parseInt(dayIndex));
}

async function deleteTrainerExercise() {
    if (!confirm("Видалити цю вправу?")) return;

    const dayIndex = document.getElementById('t-edit-ex-day').value;
    const exIndex = parseInt(document.getElementById('t-edit-ex-index').value);

    let isAdapted = (dayIndex === 'adapted');

    if (isAdapted) {
        currentClient.today_checkin.adapted_plan.exercises.splice(exIndex, 1);
    } else {
        currentClientWorkout.days[parseInt(dayIndex)].exercises.splice(exIndex, 1);
    }

    closeModal('t-edit-exercise-modal');
    await saveClientPlanToServer(isAdapted);
    renderWorkoutDays(isAdapted ? 'adapted' : parseInt(dayIndex));
}

async function saveClientPlanToServer(isAdapted) {
    showLoading(loc('loading_ai', "Збереження плану..."));
    try {
        if (isAdapted) {
            await fetch('/api/update_adapted_plan', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
                body: JSON.stringify({ user_id: currentClientId, plan: currentClient.today_checkin.adapted_plan })
            });
        } else {
            await fetch('/api/update_workout_plan', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
                body: JSON.stringify({ user_id: currentClientId, plan: currentClientWorkout })
            });
        }
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch(e) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_error', "Помилка збереження."));
    } finally {
        showView('client-detail-view');
    }
}

// --- УТИЛІТИ ---

function copyLink() {
    const copyText = document.getElementById("invite-link-input");
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(copyText.value)
            .then(function() { notifyCopySuccess(); })
            .catch(function(err) { fallbackCopyText(copyText); });
    } else {
        fallbackCopyText(copyText);
    }
}

function fallbackCopyText(inputElement) {
    inputElement.select();
    inputElement.setSelectionRange(0, 99999);
    try {
        document.execCommand("copy");
        notifyCopySuccess();
    } catch(err) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_error', "Помилка копіювання"));
    }
}

function notifyCopySuccess() {
    if (tg && tg.showAlert) tg.showAlert(loc('alert_copied', "✅ Посилання скопійовано! Надішліть його клієнту."));
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

function navTo(viewId, el) {
    document.querySelectorAll('.nav-item').forEach(function(el) { el.classList.remove('active'); });
    if(el) el.classList.add('active');
    showView(viewId);

    if (tg && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
    if (viewId === 'team-view') loadClients();
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(function(el) { el.classList.remove('active'); });
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');
    window.scrollTo(0, 0);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function showLoading(text) {
    const loadingText = document.getElementById('loading-text');
    if (loadingText) loadingText.innerText = text || loc('loading_ai', "Завантаження...");
    showView('loading-view');
}