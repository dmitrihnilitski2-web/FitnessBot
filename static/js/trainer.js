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

// Підключаємо глобальну функцію локалізації
const loc = window.loc || function(key, fallback) { return fallback !== undefined ? fallback : key; };

const botUsername = "coach_app_bot";

// 2. Отримання ID тренера
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

let clientWeightChartInstance = null;

const goalTranslate = {
    'lose': 'Схуднення / Сушка', 'maintain': 'Підтримка форми', 'gain': 'Набір маси',
    'strength': 'Максимальна сила', 'endurance': 'Витривалість', 'custom': 'Своя ціль',
    'competition': '🏆 Підготовка до змагань'
};

// --- СТАРТ ДОДАТКУ ---

function initTrainerApp() {
    const inviteInput = document.getElementById('invite-link');
    if (inviteInput) {
        inviteInput.value = 'https://t.me/' + botUsername + '?start=trainer_' + trainerId;
    }

    loadClients().catch(e => console.error("Помилка завантаження клієнтів:", e));
    loadTrainerLeaderboard().catch(e => console.error("Помилка лідерборду:", e));

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

// =========================================================
// --- СОЦІАЛЬНИЙ РУШІЙ ТА КОМАНДА ---
// =========================================================

async function loadTrainerLeaderboard() {
    const container = document.getElementById('trainer-leaderboard-container');
    if (!container) return;

    try {
        const res = await fetch('/api/leaderboard/team/' + trainerId, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const data = await res.json();

        if (data.status === 'success' && data.data && data.data.length > 0) {
            let html = '';
            data.data.forEach((user, index) => {
                let rankMedal = `${index + 1}.`;
                if (index === 0) rankMedal = '🥇';
                if (index === 1) rankMedal = '🥈';
                if (index === 2) rankMedal = '🥉';

                html += `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="font-weight: 900; font-size: 16px; width: 24px; text-align: center; color: var(--hint-color);">${rankMedal}</div>
                        <div>
                            <div style="font-weight: bold; font-size: 14px; color: var(--text-color);">${user.name} <span style="font-size: 10px; color: var(--accent-gold); border: 1px solid var(--accent-gold); padding: 2px 4px; border-radius: 4px; margin-left: 4px;">Lvl ${user.level}</span></div>
                            <div style="font-size: 11px; color: var(--hint-color); margin-top: 2px;">Досвід: <b style="color: var(--text-color);">${user.exp} EXP</b></div>
                        </div>
                    </div>
                    <div style="font-size: 16px; font-weight: bold; color: #ff9500; display: flex; align-items: center; gap: 4px;">🔥 <span style="font-size: 14px;">${user.current_streak}</span></div>
                </div>`;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--hint-color); font-size: 14px;">Ваша команда поки порожня або немає активності.</p>';
        }
    } catch (e) {
        container.innerHTML = '<p style="text-align: center; color: var(--danger); font-size: 14px;">Помилка завантаження рейтингу.</p>';
    }
}

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
                    <div class="client-name">${c.name}</div>
                    <div class="client-meta">${loc('client_goal', 'Ціль')}: ${displayGoal}</div>
                </div>
                <div style="font-size: 20px; opacity: 0.5;">›</div>
            </div>`;
    });
}

// =========================================================
// --- НАВІГАЦІЯ ТА КАРТКА КЛІЄНТА ---
// =========================================================

function switchClientTab(tabId, el) {
    document.querySelectorAll('.client-tab-content').forEach(function(e) { e.style.display = 'none'; });
    const tabsContainer = document.querySelector('#client-detail-view .day-tabs');
    if (tabsContainer) {
        tabsContainer.querySelectorAll('.day-tab').forEach(function(e) { e.classList.remove('active'); });
    }

    const target = document.getElementById('tab-' + tabId);
    if (target) target.style.display = 'block';

    if (el) el.classList.add('active');
}

async function openClient(clientId) {
    currentClientId = clientId;

    document.querySelectorAll('.nav-item').forEach(function(el) { el.classList.remove('active'); });
    showView('client-detail-view');

    // Скидаємо UI
    document.getElementById('client-name').innerText = loc('loading_ai', "Завантаження...");
    document.getElementById('client-goal').innerText = "...";
    document.getElementById('client-plan-container').innerHTML = '<div class="spinner" style="margin: 20px auto;"></div>';

    try {
        const res = await fetch('/api/user/' + clientId, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const data = await res.json();

        if (data.status === 'found') {
            currentClient = data;
            currentClientWorkout = data.workout_plan;
            currentClientCompletedSets = data.today_completed_sets || {};

            document.getElementById('client-name').innerText = data.user.name;
            document.getElementById('client-goal').innerText = "Ціль: " + (goalTranslate[data.user.primary_goal] || data.user.primary_goal);
            document.getElementById('client-level-badge').innerText = 'Lvl ' + (data.user.level || 1);

            document.getElementById('client-food-prefs-text').innerText = data.user.food_preferences || loc('client_food_prefs', "Клієнт ще не вказав алергії чи вподобання.");
            document.getElementById('client-nutrition-plan').value = data.user.nutrition_plan || "";

            // Мапа втоми
            loadClientFatigue(clientId, data.user.gender);
            // Прогрес ваги
            loadClientProgress(clientId);

            if (data.workout_plan) {
                globalActiveTab = null;
                const hasAdapted = data.today_checkin && data.today_checkin.adapted_plan;
                renderWorkoutDays(hasAdapted ? 'adapted' : 0);
            } else {
                document.getElementById('client-plan-container').innerHTML = `
                    <div class="card" style="text-align:center; padding: 30px 15px;">
                        <p style="color:var(--hint-color); margin-bottom:15px;">У клієнта немає активної програми.</p>
                        <button onclick="generatePlanForClient()">🤖 Згенерувати ШІ-План</button>
                        <button class="secondary" onclick="createManualPlan()">✍️ Створити порожній шаблон</button>
                    </div>`;
            }
        }

        // Завантаження харчування
        const nRes = await fetch('/api/nutrition/' + clientId, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const nData = await nRes.json();

        if (nData.consumed) {
            let targetCals = nData.goals ? nData.goals.calories : 0;
            document.getElementById('client-nutri-cal-main').innerHTML = `${nData.consumed.cals || 0} <span style="font-size: 18px; color: var(--hint-color);">/ ${targetCals}</span>`;
            document.getElementById('client-nutri-p').innerText = `${nData.consumed.prot || 0}г`;
            document.getElementById('client-nutri-f').innerText = `${nData.consumed.fat || 0}г`;
            document.getElementById('client-nutri-c').innerText = `${nData.consumed.carb || 0}г`;
        }
    } catch(e) {
        console.error(e);
    }
}

// =========================================================
// --- ГРАФІКИ ТА АНАТОМІЯ КЛІЄНТА ---
// =========================================================

async function loadClientFatigue(clientId, gender) {
    try {
        const res = await fetch('/api/muscle_fatigue/' + clientId, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const data = await res.json();
        if (data.status === 'success' && window.AnatomyMapper) {
            const mapGender = gender === 'female' ? 'female' : 'male';
            window.AnatomyMapper.drawBodyMap(mapGender);
            window.AnatomyMapper.applyFatigue(data.data);
        }
    } catch(e) {}
}

async function loadClientProgress(clientId) {
    try {
        const res = await fetch('/api/progress/' + clientId, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const responseData = await res.json();
        if (responseData.status === 'success') {
            const data = responseData.data.body_weight;
            if (typeof Chart === 'undefined' || !document.getElementById('clientWeightChart')) return;

            if (clientWeightChartInstance) clientWeightChartInstance.destroy();
            const canvas = document.getElementById('clientWeightChart');
            const ctx = canvas.getContext('2d');

            if (!data || data.length === 0) return;
            const labels = data.map(d => d.date.split('-').slice(1).join('/'));
            const weights = data.map(d => d.weight);

            clientWeightChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Вага (кг)', data: weights, borderColor: '#0a84ff', backgroundColor: 'rgba(10, 132, 255, 0.1)',
                        borderWidth: 3, tension: 0.4, fill: true, pointBackgroundColor: '#000', pointBorderColor: '#0a84ff'
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false } } }
            });
        }
    } catch(e) {}
}

// =========================================================
// --- РАЦІОН ТА ШІ АСИСТЕНТ ---
// =========================================================

async function saveClientNutrition() {
    const plan = document.getElementById('client-nutrition-plan').value;
    showLoading("Збереження...");
    try {
        await fetch('/api/trainer/nutrition_plan', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
            body: JSON.stringify({ user_id: currentClientId, plan: plan })
        });
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        if (tg && tg.showAlert) tg.showAlert("✅ Раціон успішно збережено!");
    } catch(e) {
    } finally {
        showView('client-detail-view');
    }
}

async function rebuildClientPlanAI() {
    const prompt = document.getElementById('ai-rebuild-prompt').value.trim();
    if (!prompt) {
        if (tg && tg.showAlert) tg.showAlert("Опишіть, що потрібно змінити в плані.");
        return;
    }

    const btn = document.getElementById('btn-ai-rebuild');
    btn.disabled = true; btn.innerText = "⏳ ШІ працює...";

    try {
        const res = await fetch('/api/smart_rebuild_plan', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
            body: JSON.stringify({ user_id: currentClientId, update_text: "Тренер просить змінити план: " + prompt })
        });
        const data = await res.json();
        if (data.status === 'success') {
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            document.getElementById('ai-rebuild-prompt').value = '';
            await openClient(currentClientId);
        }
    } catch (e) {
        if (tg && tg.showAlert) tg.showAlert("Помилка генерації.");
    } finally {
        btn.disabled = false; btn.innerText = "✨ Перебудувати план";
    }
}

async function generatePlanForClient() {
    if(!confirm("Згенерувати новий план через ШІ? Попередній буде видалено.")) return;
    showLoading("🧠 Генерація...");
    try {
        const res = await fetch('/api/generate_plan/' + currentClientId, { method: 'POST', headers: { 'ngrok-skip-browser-warning': 'true' } });
        const data = await res.json();
        if(data.status === 'success') {
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            openClient(currentClientId);
        }
    } catch(e) {
        showView('client-detail-view');
    }
}

async function createManualPlan() {
    if(!confirm("Створити новий порожній план для ручного заповнення?")) return;
    const emptyPlan = {
        plan_name: "Персональна програма",
        explanation: "Цей план складено вашим тренером.",
        projections: "Слідуйте вказівкам тренера для найкращого результату.",
        days: [ { day: 1, focus: "Тренування 1", exercises: [] }, { day: 2, focus: "Тренування 2", exercises: [] } ]
    };
    try {
        await fetch('/api/update_workout_plan', { method: 'POST', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'}, body: JSON.stringify({ user_id: currentClientId, plan: emptyPlan }) });
        openClient(currentClientId);
    } catch(e) {}
}

// =========================================================
// --- ВІДМАЛЬОВКА ТА РЕДАГУВАННЯ ТРЕНУВАНЬ ---
// =========================================================

function renderWorkoutDays(activeTabId) {
    if (!currentClient || !currentClient.workout_plan) return;

    globalActiveTab = activeTabId;
    const cont = document.getElementById('client-plan-container');
    if (!cont) return;

    // Створюємо структуру: таби + контент
    let html = `<div class="day-tabs" id="trainer-day-tabs" style="margin-bottom: 15px;"></div><div id="t-workout-list"></div>`;
    cont.innerHTML = html;

    const tabsContainer = document.getElementById('trainer-day-tabs');
    const listCont = document.getElementById('t-workout-list');

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
        tabsContainer.innerHTML += `<div class="day-tab ${activeClass}" onclick="renderWorkoutDays('all')">Всі</div>`;
    }

    if (activeTabId === 'adapted' && hasAdapted) {
        const adapted = currentClient.today_checkin.adapted_plan;
        let listHtml = '<div class="card" style="border: 1px solid var(--success);"><div style="color:var(--success); margin-bottom:15px; font-weight:bold;">⚡ ' + adapted.focus + '</div>';

        (adapted.exercises || []).forEach(function(e, i) {
            const safeName = e.name.replace(/'/g, "\\'");
            const expectedReps = String(e.reps).replace(/'/g, "\\'");
            listHtml += buildExerciseRow(e, i, 'adapted', safeName, expectedReps);
        });
        listHtml += `<button class="secondary" style="color: var(--client-blue); margin-top: 15px;" onclick="tOpenEditEx('adapted', -1, '', '', '')">➕ Додати вправу</button></div>`;
        listCont.innerHTML = listHtml;

    } else {
        let daysToRender = activeTabId === 'all' ? days : [days[currentDayIndex]];
        if (!daysToRender[0]) daysToRender = days;

        let listHtml = '';
        daysToRender.forEach(function(d) {
            if (!d) return;
            let actualDayIndex = days.indexOf(d);
            listHtml += `<div class="card"><div style="color:var(--text-color); margin-bottom:15px; font-weight:bold; font-size:16px;">ДЕНЬ ${d.day}: ${d.focus}</div>`;

            (d.exercises || []).forEach(function(e, i) {
                const safeName = e.name.replace(/'/g, "\\'");
                const expectedReps = String(e.reps).replace(/'/g, "\\'");
                listHtml += buildExerciseRow(e, i, actualDayIndex, safeName, expectedReps);
            });
            if (activeTabId !== 'all') {
                listHtml += `<button class="secondary" style="color: var(--client-blue); margin-top: 15px;" onclick="tOpenEditEx('${actualDayIndex}', -1, '', '', '')">➕ Додати вправу</button>`;
            }
            listHtml += `</div>`;
        });
        listCont.innerHTML = listHtml;
    }
}

function buildExerciseRow(e, i, dayId, safeName, expectedReps) {
    const key = dayId + '_' + e.name;
    const completedSets = currentClientCompletedSets[key] ? currentClientCompletedSets[key] : 0;
    const isCompleted = completedSets >= parseInt(e.sets);
    const rowClass = isCompleted ? "ex-row ex-completed" : "ex-row";
    const titleIcon = isCompleted ? "✅" : "🏋️";

    return `
        <div class="${rowClass}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div style="flex:1; padding-right:10px;">
                <div style="font-weight: bold; font-size: 15px;" class="ex-title-text">${titleIcon} ${e.name}</div>
                <div style="font-size: 13px; color: var(--hint-color); margin-top: 2px;" class="ex-sub-text">${e.sets} підходи × ${expectedReps}</div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
                <div style="background: rgba(10, 132, 255, 0.15); color: #0a84ff; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px;" onclick="showExerciseInfo('${safeName}')">ℹ️</div>
                <div style="background: rgba(255, 159, 10, 0.15); color: #ff9f0a; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px;" onclick="tOpenEditEx('${dayId}', ${i}, '${safeName}', '${e.sets}', '${expectedReps}')">✏️</div>
            </div>
        </div>`;
}

function tOpenEditEx(dayIndex, exIndex, name, sets, reps) {
    document.getElementById('edit-ex-day').value = dayIndex;
    document.getElementById('edit-ex-index').value = exIndex;
    document.getElementById('edit-ex-name').value = name;
    document.getElementById('edit-ex-sets').value = sets;
    document.getElementById('edit-ex-reps').value = reps;

    document.getElementById('edit-ex-title').innerText = (exIndex == -1) ? "Додати вправу" : "Редагувати вправу";
    document.getElementById('btn-delete-ex').style.display = (exIndex == -1) ? "none" : "block";
    document.getElementById('edit-exercise-modal').classList.add('active');
}

async function submitEditExercise() {
    const dayIndex = document.getElementById('edit-ex-day').value;
    const exIndex = parseInt(document.getElementById('edit-ex-index').value);
    const name = document.getElementById('edit-ex-name').value.trim();
    const sets = document.getElementById('edit-ex-sets').value.trim() || "1";
    const reps = document.getElementById('edit-ex-reps').value.trim() || "10";

    if (!name) return;

    let isAdapted = (dayIndex === 'adapted');

    if (isAdapted) {
        if (!currentClient.today_checkin.adapted_plan.exercises) currentClient.today_checkin.adapted_plan.exercises = [];
        if (exIndex == -1) currentClient.today_checkin.adapted_plan.exercises.push({name: name, sets: sets, reps: reps});
        else currentClient.today_checkin.adapted_plan.exercises[exIndex] = {name: name, sets: sets, reps: reps};
    } else {
        let dIdx = parseInt(dayIndex);
        if (!currentClientWorkout.days[dIdx].exercises) currentClientWorkout.days[dIdx].exercises = [];
        if (exIndex == -1) currentClientWorkout.days[dIdx].exercises.push({name: name, sets: sets, reps: reps});
        else currentClientWorkout.days[dIdx].exercises[exIndex] = {name: name, sets: sets, reps: reps};
    }

    closeModal('edit-exercise-modal');
    await saveClientPlanToServer(isAdapted);
    renderWorkoutDays(isAdapted ? 'adapted' : parseInt(dayIndex));
}

async function deleteExercise() {
    if (!confirm("Видалити цю вправу?")) return;
    const dayIndex = document.getElementById('edit-ex-day').value;
    const exIndex = parseInt(document.getElementById('edit-ex-index').value);
    let isAdapted = (dayIndex === 'adapted');

    if (isAdapted) currentClient.today_checkin.adapted_plan.exercises.splice(exIndex, 1);
    else currentClientWorkout.days[parseInt(dayIndex)].exercises.splice(exIndex, 1);

    closeModal('edit-exercise-modal');
    await saveClientPlanToServer(isAdapted);
    renderWorkoutDays(isAdapted ? 'adapted' : parseInt(dayIndex));
}

async function saveClientPlanToServer(isAdapted) {
    showLoading("Збереження...");
    try {
        if (isAdapted) {
            await fetch('/api/update_adapted_plan', { method: 'POST', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'}, body: JSON.stringify({ user_id: currentClientId, plan: currentClient.today_checkin.adapted_plan }) });
        } else {
            await fetch('/api/update_workout_plan', { method: 'POST', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'}, body: JSON.stringify({ user_id: currentClientId, plan: currentClientWorkout }) });
        }
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch(e) {} finally {
        showView('client-detail-view');
    }
}

// =========================================================
// --- ІНФО ВПРАВИ (ВІД ШІ) ---
// =========================================================

async function showExerciseInfo(name) {
    document.getElementById('info-modal-title').innerText = name;
    document.getElementById('info-modal-muscles').innerText = "Аналіз...";
    document.getElementById('info-modal-instruction').innerText = "ШІ аналізує біомеханіку вправи...";
    document.getElementById('btn-youtube-link').style.display = 'none';

    document.getElementById('exercise-info-modal').classList.add('active');
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

    try {
        const res = await fetch('/api/exercise_info/' + encodeURIComponent(name));
        const data = await res.json();
        if (data.status === 'success') {
            document.getElementById('info-modal-muscles').innerText = data.data.muscles;
            document.getElementById('info-modal-instruction').innerText = data.data.instruction;
            const ytBtn = document.getElementById('btn-youtube-link');
            ytBtn.href = `https://www.youtube.com/results?search_query=Як+робити+${encodeURIComponent(name)}+техніка+виконання`;
            ytBtn.style.display = 'flex';
        }
    } catch (e) {}
}

// =========================================================
// --- УТИЛІТИ ---
// =========================================================

function copyInviteLink() {
    const copyText = document.getElementById("invite-link");
    if (!copyText) return;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(copyText.value)
            .then(() => notifyCopySuccess())
            .catch(() => fallbackCopyText(copyText));
    } else {
        fallbackCopyText(copyText);
    }
}

function fallbackCopyText(inputElement) {
    inputElement.select();
    inputElement.setSelectionRange(0, 99999);
    try { document.execCommand("copy"); notifyCopySuccess(); } catch(err) {}
}

function notifyCopySuccess() {
    if (tg && tg.showAlert) tg.showAlert("✅ Посилання скопійовано! Надішліть його клієнту.");
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

function navTo(viewId, el) {
    document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
    if(el) el.classList.add('active');
    showView(viewId);
    if (tg && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
    if (viewId === 'team-view') {
        loadClients();
        loadTrainerLeaderboard();
    }
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(e => e.classList.remove('active'));
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
    if (loadingText) loadingText.innerText = text || "Завантаження...";
    // Для тренера у нас немає екрану завантаження як такого, тому пропускаємо або робимо кастомний alert
}