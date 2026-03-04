/* =========================================================
   FITNESS HUB PRO | ТРЕКЕРИ ТА РУТИНА (client_tracking.js)
   Містить: Тренування, Їжу, Воду, Сканери, Таймер, Чек-іни, Холодильник
   ========================================================= */

// Використовуємо var для захисту від конфлікту оголошення змінних
var loc = window.loc || function(key, fallback) { return fallback !== undefined ? fallback : key; };

// --- 1. РОЗУМНІ ТРЕНУВАННЯ ---

function detectExerciseType(name) {
    const n = name.toLowerCase();

    // ДОДАНО: маркери для дихальних вправ, медитації, МФР, сканування тіла та йоги
    if (n.includes('розминка') || n.includes('заминка') || n.includes('розтяжка') ||
        n.includes('суглоб') || n.includes('warmup') || n.includes('stretch') ||
        n.includes('дихан') || n.includes('медитац') || n.includes('сканування') ||
        n.includes('йога') || n.includes('мфр') || n.includes('yoga') || n.includes('релакс')) {
        return 'warmup';
    }

    // Кардіо
    if (n.includes('біг') || n.includes('доріжк') || n.includes('вело') ||
        n.includes('еліпс') || n.includes('орбітрек') || n.includes('ходьба') ||
        n.includes('кардіо') || n.includes('run') || n.includes('cardio') ||
        n.includes('bike')) {
        return 'cardio';
    }

    // За замовчуванням - силові
    return 'strength';
}

function renderWorkoutDays(activeTabId) {
    if (!userData || !userData.workout_plan) return;

    globalActiveTab = activeTabId;
    const tabsContainer = document.getElementById('day-tabs-container');
    const cont = document.getElementById('workout-container');
    if(!tabsContainer || !cont) return;

    tabsContainer.innerHTML = ''; cont.innerHTML = '';

    const days = userData.workout_plan.days || [];
    const hasAdapted = userData.today_checkin && userData.today_checkin.adapted_plan;

    if (typeof activeTabId === 'number') {
        currentDayIndex = activeTabId;
    }

    if (hasAdapted) {
        const activeClass = (activeTabId === 'adapted') ? 'active' : '';
        tabsContainer.innerHTML += `<div class="day-tab ${activeClass}" onclick="renderWorkoutDays('adapted')">${loc('tab_today_adapted', '⚡ Сьогодні')}</div>`;
    }

    days.forEach(function(d, index) {
        const activeClass = (activeTabId === index) ? 'active' : '';
        tabsContainer.innerHTML += `<div class="day-tab ${activeClass}" onclick="renderWorkoutDays(${index})">${loc('cycle_day', 'День')} ${d.day}</div>`;
    });

    if (days.length > 0) {
        const activeClass = (activeTabId === 'all') ? 'active' : '';
        tabsContainer.innerHTML += `<div class="day-tab ${activeClass}" onclick="renderWorkoutDays('all')">${loc('tab_all_plan', 'Весь план')}</div>`;
    }

    tabsContainer.style.display = 'flex';

    if (activeTabId === 'adapted' && hasAdapted) {
        document.getElementById('checkin-card').style.display = 'none';
        const adapted = userData.today_checkin.adapted_plan;

        if (adapted.coach_message) {
            document.getElementById('coach-message-text').innerHTML = window.formatMarkdown ? window.formatMarkdown(adapted.coach_message) : adapted.coach_message;
            document.getElementById('coach-message-box').style.display = 'block';
        } else {
            document.getElementById('coach-message-box').style.display = 'none';
        }

        let html = `<div class="card" style="border: 1px solid var(--success);"><div style="color:var(--success); margin-bottom:15px; font-weight:bold;">${loc('adapted_focus', '⚡ АДАПТОВАНО:')} ${adapted.focus}</div>`;

        (adapted.exercises || []).forEach(function(e, i) {
            const safeName = e.name.replace(/'/g, "\\'");
            const expectedReps = String(e.reps).replace(/'/g, "\\'");
            const key = 'adapted_' + e.name;
            const completedSets = (userData.today_completed_sets && userData.today_completed_sets[key]) ? userData.today_completed_sets[key] : 0;
            const isCompleted = completedSets >= parseInt(e.sets);
            const rowClass = isCompleted ? "ex-row ex-completed" : "ex-row";
            const titleIcon = isCompleted ? "✅" : "<span style='color:var(--btn-color);'>⚡</span>";

            html += `
                <div class="${rowClass}">
                    <div style="flex:1; padding-right:10px;" onclick="openExerciseModal('${safeName}', '${e.sets}', '${expectedReps}', 'adapted')">
                        <div style="font-weight: bold; font-size: 15px;" class="ex-title-text">${titleIcon} ${e.name}</div>
                        <div style="font-size: 13px; color: var(--hint-color); margin-top: 2px;" class="ex-sub-text">${e.sets} ${loc('text_sets_x', 'підходи ×')} ${expectedReps}</div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
                        <div style="background: rgba(10, 132, 255, 0.15); color: #0a84ff; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px;" onclick="if(typeof showExerciseInfo === 'function') showExerciseInfo('${safeName}')">ℹ️</div>
                        <div style="background: rgba(255, 159, 10, 0.15); color: #ff9f0a; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px;" onclick="openEditExModal('adapted', ${i}, '${safeName}', '${e.sets}', '${expectedReps}')">✏️</div>
                        <div style="opacity:0.2; font-size: 24px; padding-left: 5px; cursor: pointer;" onclick="openExerciseModal('${safeName}', '${e.sets}', '${expectedReps}', 'adapted')">›</div>
                    </div>
                </div>`;
        });
        html += `<button class="secondary" style="color: var(--btn-color); margin-top: 15px;" onclick="openEditExModal('adapted', -1, '', '', '')">${loc('btn_add_exercise', '➕ Додати вправу')}</button></div>`;
        cont.innerHTML = html;

    } else {
        document.getElementById('coach-message-box').style.display = 'none';

        if (!hasAdapted && (activeTabId !== 'all')) {
            document.getElementById('checkin-card').style.display = 'block';
            const chkP = document.querySelector('#checkin-card p');
            if (chkP && days[currentDayIndex]) {
                chkP.innerHTML = `${loc('text_adaptation', 'Адаптація: <b>День')} ${days[currentDayIndex].day} (${days[currentDayIndex].focus})</b> ${loc('text_adaptation_end', 'під ваш поточний стан.')}`;
            }
        } else {
            document.getElementById('checkin-card').style.display = 'none';
        }

        let daysToRender = activeTabId === 'all' ? days : [days[currentDayIndex]];
        if (!daysToRender[0]) daysToRender = days;

        daysToRender.forEach(function(d) {
            if (!d) return;
            let actualDayIndex = days.indexOf(d);
            let html = `<div class="card"><div style="color:var(--accent-gold); margin-bottom:15px; font-weight:bold; letter-spacing: 0.5px;">${loc('cycle_day', 'День').toUpperCase()} ${d.day}: ${d.focus}</div>`;

            (d.exercises || []).forEach(function(e, i) {
                const safeName = e.name.replace(/'/g, "\\'");
                const expectedReps = String(e.reps).replace(/'/g, "\\'");
                const key = actualDayIndex + '_' + e.name;
                const completedSets = (userData.today_completed_sets && userData.today_completed_sets[key]) ? userData.today_completed_sets[key] : 0;
                const isCompleted = completedSets >= parseInt(e.sets);
                const rowClass = isCompleted ? "ex-row ex-completed" : "ex-row";
                const titleIcon = isCompleted ? "✅" : "<span style='color:var(--btn-color);'>⚡</span>";

                html += `
                    <div class="${rowClass}">
                        <div style="flex:1; padding-right:10px;" onclick="openExerciseModal('${safeName}', '${e.sets}', '${expectedReps}', '${actualDayIndex}')">
                            <div style="font-weight: bold; font-size: 15px;" class="ex-title-text">${titleIcon} ${e.name}</div>
                            <div style="font-size: 13px; color: var(--hint-color); margin-top: 2px;" class="ex-sub-text">${e.sets} ${loc('text_sets_x', 'підходи ×')} ${expectedReps}</div>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
                            <div style="background: rgba(10, 132, 255, 0.15); color: #0a84ff; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px;" onclick="if(typeof showExerciseInfo === 'function') showExerciseInfo('${safeName}')">ℹ️</div>
                            <div style="background: rgba(255, 159, 10, 0.15); color: #ff9f0a; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px;" onclick="openEditExModal('${actualDayIndex}', ${i}, '${safeName}', '${e.sets}', '${expectedReps}')">✏️</div>
                            <div style="opacity:0.2; font-size: 24px; padding-left: 5px; cursor: pointer;" onclick="openExerciseModal('${safeName}', '${e.sets}', '${expectedReps}', '${actualDayIndex}')">›</div>
                        </div>
                    </div>`;
            });
            if (activeTabId !== 'all') {
                html += `<button class="secondary" style="color: var(--btn-color); margin-top: 15px;" onclick="openEditExModal('${actualDayIndex}', -1, '', '', '')">${loc('btn_add_exercise', '➕ Додати вправу')}</button>`;
            }
            html += `</div>`;
            cont.innerHTML += html;
        });
    }
}

async function showExerciseInfo(name) {
    if (!document.getElementById('exercise-info-modal')) {
        if(tg && tg.showAlert) tg.showAlert(loc('loading_ai', "Зачекайте оновлення інтерфейсу.")); return;
    }
    document.getElementById('info-modal-title').innerText = name;
    document.getElementById('info-modal-muscles').innerText = loc('loading_ai', "Завантаження...");
    document.getElementById('info-modal-instruction').innerText = loc('analyzing_biomechanics', "ШІ аналізує біомеханіку вправи...");
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

// --- 2. ВІКНО ЛОГУВАННЯ ТА ТАЙМЕР ---

function openExerciseModal(name, sets, expectedReps, planDay) {
    currentExercise = name;
    currentExTotalSets = parseInt(sets) || 1;
    currentExExpectedRepsStr = expectedReps;
    currentExType = detectExerciseType(name);
    currentPlanDay = planDay;

    const key = planDay + '_' + name;
    const completed = (userData.today_completed_sets && userData.today_completed_sets[key]) ? userData.today_completed_sets[key] : 0;

    if (completed >= currentExTotalSets) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_sets_done', "✅ Ви вже виконали всі заплановані підходи для цієї вправи! Відпочивайте."));
        else alert(loc('alert_sets_done_short', "✅ Ви вже виконали всі заплановані підходи для цієї вправи!"));
        return;
    }

    document.getElementById('modal-title').innerText = name;
    document.getElementById('modal-target').innerText = expectedReps;

    const progEl = document.getElementById('modal-progress');
    progEl.style.display = 'block';
    progEl.innerText = `${loc('text_set_progress', 'Підхід:')} ${completed + 1}/${currentExTotalSets}`;

    document.getElementById('set-weight').value = '';
    document.getElementById('set-reps').value = '';
    document.getElementById('set-duration').value = '';
    document.getElementById('set-distance').value = '';

    document.getElementById('input-strength').style.display = 'none';
    document.getElementById('input-cardio').style.display = 'none';
    document.getElementById('input-warmup').style.display = 'none';

    if (currentExType === 'warmup') {
        document.getElementById('input-warmup').style.display = 'block';
    } else if (currentExType === 'cardio') {
        document.getElementById('input-cardio').style.display = 'block';
    } else {
        document.getElementById('input-strength').style.display = 'block';
        const strengthLabels = document.querySelectorAll('#input-strength label');
        if (strengthLabels.length >= 2) {
            strengthLabels[0].innerText = loc('label_weight_kg', "Вага (кг)");
            strengthLabels[1].innerText = loc('label_reps', "Кількість повторень");
        }
        document.getElementById('set-reps').placeholder = loc('placeholder_reps', "Скільки зробили?");
    }

    document.getElementById('timer-view').style.display = 'none';
    document.getElementById('log-form').style.display = 'block';

    currentTimerLeft = REST_TIME_SECONDS;
    updateTimerText(currentTimerLeft);

    document.getElementById('workout-modal').classList.add('active');
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

function saveSet() {
    let weight = 0, reps = 0, duration = 0, distance = 0.0;
    if (currentExType === 'strength') {
        weight = parseFloat(document.getElementById('set-weight').value) || 0;
        reps = parseInt(document.getElementById('set-reps').value) || 0;

        let maxExpected = 0;
        if (currentExExpectedRepsStr) {
            const matches = String(currentExExpectedRepsStr).match(/\d+/g);
            if (matches) maxExpected = Math.max(...matches.map(Number));
        }
        if (maxExpected > 0 && reps > maxExpected) {
            let warnMsg = loc('alert_reps_adjusted', `⚠️ Ви ввели {reps} повторень, але план передбачає максимум {maxExpected}. Задля уникнення перетренування значення скориговано.`);
            warnMsg = warnMsg.replace('{reps}', reps).replace('{maxExpected}', maxExpected);
            if (tg && tg.showAlert) tg.showAlert(warnMsg); else alert(warnMsg);
            document.getElementById('set-reps').value = maxExpected;
            return;
        }
        if (reps === 0) { if (tg && tg.showAlert) tg.showAlert(loc('alert_enter_reps', "Вкажіть кількість повторень або час.")); return; }
    } else if (currentExType === 'cardio') {
        let mins = parseFloat(document.getElementById('set-duration').value) || 0;
        duration = Math.floor(mins * 60);
        distance = parseFloat(document.getElementById('set-distance').value) || 0;
        if (duration === 0) { if (tg && tg.showAlert) tg.showAlert(loc('alert_enter_time', "Вкажіть час виконання (хвилини).")); return; }
        reps = 1;
    } else if (currentExType === 'warmup') {
        reps = 1;
    }

    fetch('/api/log_set', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
        body: JSON.stringify({
            user_id: userId, exercise_name: currentExercise, set_number: 1,
            weight: weight, reps: reps, exercise_type: currentExType,
            duration: duration, distance: distance, plan_day: String(currentPlanDay)
        })
    }).then(function() {
        refreshUserData();
        if(typeof loadGamification === 'function') loadGamification();

        const progView = document.getElementById('progress-view');
        if (progView && progView.classList.contains('active') && typeof loadFatigueData === 'function') {
            loadFatigueData();
        }
    }).catch(console.error);

    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    startTimer(REST_TIME_SECONDS);
}

function startTimer(seconds) {
    document.getElementById('log-form').style.display = 'none';
    document.getElementById('timer-view').style.display = 'block';
    currentTimerLeft = seconds;
    updateTimerText(currentTimerLeft);
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(function() {
        currentTimerLeft--; updateTimerText(currentTimerLeft);
        if (currentTimerLeft <= 0) { clearInterval(timerInterval); finishTimer(); }
    }, 1000);
}

function adjustTimer(secs) {
    currentTimerLeft += secs;
    if (currentTimerLeft < 0) currentTimerLeft = 0;
    updateTimerText(currentTimerLeft);
    if (tg && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function updateTimerText(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    document.getElementById('timer-text').innerText = m + ':' + s;
}

function skipTimer() {
    if (timerInterval) clearInterval(timerInterval);
    finishTimer();
}

function finishTimer() {
    if(typeof closeModal === 'function') closeModal('workout-modal');
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

// --- 3. ХАРЧУВАННЯ ТА ВОДА ---

async function loadNutrition() {
    try {
        const res = await fetch('/api/nutrition/' + userId, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        if (!res.ok) return;
        const data = await res.json();
        const goals = data.goals || {calories: 2000, protein: 150, fats: 70, carbs: 200};
        const consumed = data.consumed || {cals: 0, prot: 0, fat: 0, carb: 0};
        const logs = data.logs || [];
        const cals = consumed.cals || 0;

        todayWater = data.water || 0;
        updateWaterUI();

        const calMain = document.getElementById('cal-main');
        if (calMain) calMain.innerHTML = cals + ' <span style="font-size: 24px; color: var(--hint-color); font-weight: normal;">/ ' + goals.calories + '</span>';

        const statusEl = document.getElementById('cal-status');
        if (statusEl) {
            if (cals < goals.calories * 0.85) { statusEl.innerText = loc('nutri_status_low', "🟡 Потрібно більше енергії"); statusEl.style.color = 'var(--warning)'; statusEl.style.background = 'rgba(255, 159, 10, 0.1)'; }
            else if (cals <= goals.calories * 1.1) { statusEl.innerText = loc('nutri_status_perfect', "🟢 Ідеальний баланс"); statusEl.style.color = 'var(--success)'; statusEl.style.background = 'rgba(0, 234, 102, 0.1)'; }
            else { statusEl.innerText = loc('nutri_status_over', "🔴 Перебір калорій"); statusEl.style.color = 'var(--danger)'; statusEl.style.background = 'rgba(255, 45, 85, 0.1)'; }
        }

        updateMacroUI('p', consumed.prot || 0, goals.protein); updateMacroUI('f', consumed.fat || 0, goals.fats); updateMacroUI('c', consumed.carb || 0, goals.carbs);

        const logsContainer = document.getElementById('food-logs-container');
        if (!logsContainer) return;
        logsContainer.innerHTML = '';
        if (logs.length === 0) { logsContainer.innerHTML = `<p style="color: var(--hint-color); font-size: 14px; text-align: center; padding: 20px 0;">${loc('nutri_no_logs', 'Ще немає записів за сьогодні.')}</p>`; }
        else {
            logs.forEach(function(log) {
                const safeName = log.dish_name.replace(/'/g, "\\'");
                const weightText = log.weight_g ? `⚖️ ${log.weight_g}г | ` : '';
                logsContainer.innerHTML += `<div class="food-log-item" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 16px; border-radius: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div class="food-log-info">
                        <div class="food-log-title" style="font-weight: bold; font-size: 15px; margin-bottom: 4px;">${log.dish_name}</div>
                        <div class="food-log-macros" style="font-size: 12px; color: var(--hint-color);">${weightText}🔥 ${log.calories} ккал | Б: ${log.protein} | Ж: ${log.fats} | В: ${log.carbs}</div>
                    </div>
                    <div style="display:flex; gap: 8px;">
                        <button class="action-btn edit" style="background: rgba(255, 214, 10, 0.1); color: var(--warning); border: none; border-radius: 8px; padding: 8px 12px; font-size: 14px;" onclick="openEditFood(${log.id}, '${safeName}', ${log.calories}, ${log.protein}, ${log.fats}, ${log.carbs}, ${log.weight_g || 0})">✏️</button>
                        <button class="action-btn delete" style="background: rgba(255, 45, 85, 0.1); color: var(--danger); border: none; border-radius: 8px; padding: 8px 12px; font-size: 14px;" onclick="deleteFoodLog(${log.id})">🗑️</button>
                    </div>
                </div>`;
            });
        }
    } catch (e) {}
}

function updateMacroUI(prefix, current, target) {
    const valEl = document.getElementById(prefix + '-val');
    if (valEl) valEl.innerText = current + ' / ' + target + ' г';
    let percent = Math.min((current / target) * 100, 100);
    const bar = document.getElementById(prefix + '-bar');
    if (bar) { bar.style.width = percent + '%'; if (current > target * 1.1) { bar.style.background = 'var(--danger)'; } else { bar.style.background = ''; } }
}

function updateWaterUI() {
    const waterVal = document.getElementById('water-val');
    if (waterVal) waterVal.innerText = todayWater + ' мл';
    for(let i = 1; i <= 8; i++) {
        let glass = document.getElementById('glass-' + i);
        if (glass) {
            if (todayWater >= i * 250) { glass.classList.add('filled'); }
            else { glass.classList.remove('filled'); }
        }
    }
}

async function addWater(amount_ml) {
    try {
        await fetch('/api/log_water', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
            body: JSON.stringify({user_id: userId, amount: amount_ml})
        });
        todayWater += amount_ml;
        updateWaterUI();
        if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    } catch(e) {}
}

// --- 4. СКАНЕРИ ШТРИХ-КОДІВ ТА ШІ ЇЖІ ---

let html5QrCode = null;

function startWebScanner() {
    const readerDiv = document.getElementById('reader');
    const btnStart = document.getElementById('btn-start-scan');
    const btnStop = document.getElementById('btn-stop-scan');
    const btnManual = document.getElementById('btn-manual-barcode');

    if (!readerDiv) return;

    readerDiv.style.display = 'block';
    btnStart.style.display = 'none';
    btnStop.style.display = 'block';
    btnManual.style.display = 'block';

    if (typeof Html5Qrcode === 'undefined') {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_scanner_loading', "Бібліотека сканера ще не завантажилась. Спробуйте через пару секунд."));
        stopWebScanner();
        return;
    }

    html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText, decodedResult) => {
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            stopWebScanner();
            processBarcode(decodedText);
        },
        (errorMessage) => { }
    ).catch((err) => {
        console.error("Помилка камери:", err);
        stopWebScanner();
        if (tg && tg.showAlert) tg.showAlert(loc('alert_camera_error', "Не вдалося отримати доступ до камери. Перевірте дозволи."));
    });
}

function stopWebScanner() {
    const readerDiv = document.getElementById('reader');
    const btnStart = document.getElementById('btn-start-scan');
    const btnStop = document.getElementById('btn-stop-scan');
    const btnManual = document.getElementById('btn-manual-barcode');

    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            html5QrCode = null;
        }).catch(err => console.error("Failed to stop scanner", err));
    }

    if(readerDiv) readerDiv.style.display = 'none';
    if(btnStart) btnStart.style.display = 'block';
    if(btnStop) btnStop.style.display = 'none';
    if(btnManual) btnManual.style.display = 'none';
}

function manualBarcodePrompt() {
    stopWebScanner();
    let code = prompt(loc('prompt_barcode', "Введіть цифри під штрих-кодом:"));
    if (code && code.trim().length > 5) {
        processBarcode(code.trim());
    }
}

async function processBarcode(barcode) {
    if(typeof showLoading === 'function') showLoading(loc('loading_food_search', "Шукаємо продукт у базі... 🌍"));
    try {
        const res = await fetch('/api/scan_barcode/' + encodeURIComponent(barcode), {
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const data = await res.json();

        if (data.status === 'success' && data.data) {
            await fetch('/api/log_nutrition', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
                body: JSON.stringify({
                    user_id: userId,
                    dish_name: data.data.dish_name + ' 🍫',
                    calories: data.data.calories,
                    protein: data.data.protein,
                    fats: data.data.fats,
                    carbs: data.data.carbs,
                    weight_g: 100
                })
            });

            loadNutrition();
            if(typeof loadGamification === 'function') loadGamification();
            if(typeof showView === 'function') showView('nutrition-view');

            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            if (tg && tg.showAlert) {
                let successMsg = loc('alert_food_found', `✅ Знайдено: "{name}"!\n\nПродукт додано (порція 100г). Змініть вагу через ✏️.`);
                tg.showAlert(successMsg.replace('{name}', data.data.dish_name));
            }
        } else {
            if(typeof showView === 'function') showView('nutrition-view');
            if (tg && tg.showAlert) tg.showAlert(data.message || loc('alert_food_not_found', "Продукт не знайдено."));
        }
    } catch (e) {
        if(typeof showView === 'function') showView('nutrition-view');
        if (tg && tg.showAlert) tg.showAlert(loc('alert_error', "Помилка зв'язку з сервером."));
    }
}

async function analyzeFoodImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const btn = document.getElementById('btn-analyze-food');
    const labelText = document.getElementById('food-upload-label');

    if (labelText) labelText.innerText = loc('loading_ai_food', "⏳ Нейромережа аналізує...");
    if (btn) btn.disabled = true;

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch('/api/analyze_food', {
            method: 'POST',
            body: formData
        });
        const responseData = await res.json();

        if (responseData.status === 'success' && responseData.data) {

            await fetch('/api/log_nutrition', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
                body: JSON.stringify({
                    user_id: userId,
                    dish_name: responseData.data.dish_name + ' ✨',
                    calories: responseData.data.calories || 0,
                    protein: responseData.data.protein || 0,
                    fats: responseData.data.fats || 0,
                    carbs: responseData.data.carbs || 0,
                    weight_g: responseData.data.estimated_weight_g || 0
                })
            });

            loadNutrition();
            if(typeof loadGamification === 'function') loadGamification();

            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            if (tg && tg.showAlert) {
                let aiMsg = loc('alert_food_ai_success', `✅ "{name}" розпізнано та додано в щоденник!\n\nВи можете змінити вагу, натиснувши ✏️.`);
                tg.showAlert(aiMsg.replace('{name}', responseData.data.dish_name));
            }

        } else {
            if (tg && tg.showAlert) tg.showAlert(loc('alert_food_ai_fail', "Не вдалося розпізнати їжу. Спробуйте інше фото."));
        }
    } catch (e) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_error', "Помилка відправки фото."));
    } finally {
        if (labelText) labelText.innerText = loc('btn_photo_food', "📸 Аналіз по фото");
        if (btn) btn.disabled = false;
        event.target.value = '';
    }
}

// --- 5. АВТОМАТИЧНИЙ ПЕРЕРАХУНОК БЖВ ПРИ ЗМІНІ ВАГИ ---

let baseMacros = { w: 0, cal: 0, p: 0, f: 0, c: 0 };

function openEditFood(id, name, cal, p, f, c, w) {
    document.getElementById('edit-food-id').value = id;
    document.getElementById('edit-food-name').value = name;
    document.getElementById('edit-food-cal').value = cal;
    document.getElementById('edit-food-prot').value = p;
    document.getElementById('edit-food-fat').value = f;
    document.getElementById('edit-food-carb').value = c;
    document.getElementById('edit-food-weight').value = w || 0;
    if(document.getElementById('edit-food-correction')) document.getElementById('edit-food-correction').value = '';

    baseMacros = {
        w: w || 100,
        cal: cal || 0,
        p: p || 0,
        f: f || 0,
        c: c || 0
    };

    document.getElementById('edit-food-modal').classList.add('active');
}

function autoScaleMacros() {
    const newWeight = parseInt(document.getElementById('edit-food-weight').value) || 0;

    if (baseMacros.w > 0 && newWeight > 0) {
        const ratio = newWeight / baseMacros.w;
        document.getElementById('edit-food-cal').value = Math.round(baseMacros.cal * ratio);
        document.getElementById('edit-food-prot').value = Math.round(baseMacros.p * ratio);
        document.getElementById('edit-food-fat').value = Math.round(baseMacros.f * ratio);
        document.getElementById('edit-food-carb').value = Math.round(baseMacros.c * ratio);
    } else if (newWeight === 0) {
        document.getElementById('edit-food-cal').value = 0;
        document.getElementById('edit-food-prot').value = 0;
        document.getElementById('edit-food-fat').value = 0;
        document.getElementById('edit-food-carb').value = 0;
    }
}

const weightInputEl = document.getElementById('edit-food-weight');
if (weightInputEl) {
    weightInputEl.addEventListener('input', autoScaleMacros);
}

async function recalculateFoodAI() {
    const logId = document.getElementById('edit-food-id').value;
    const correctionText = document.getElementById('edit-food-correction').value.trim();

    if (!correctionText) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_describe_change', "Опишіть, що потрібно змінити."));
        return;
    }

    const btn = document.getElementById('btn-recalc-food');
    if (btn) { btn.disabled = true; btn.innerText = loc('loading_ai_recalc', "⏳ Перерахунок..."); }

    const currentData = {
        dish_name: document.getElementById('edit-food-name').value,
        calories: parseInt(document.getElementById('edit-food-cal').value) || 0,
        protein: parseInt(document.getElementById('edit-food-prot').value) || 0,
        fats: parseInt(document.getElementById('edit-food-fat').value) || 0,
        carbs: parseInt(document.getElementById('edit-food-carb').value) || 0,
        weight_g: parseInt(document.getElementById('edit-food-weight').value) || 0
    };

    try {
        const res = await fetch('/api/reanalyze_food', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
            body: JSON.stringify({
                user_id: userId,
                log_id: parseInt(logId),
                current_data: currentData,
                correction: correctionText
            })
        });

        const data = await res.json();

        if (data.status === 'success' && data.data) {
            document.getElementById('edit-food-name').value = data.data.dish_name;
            document.getElementById('edit-food-cal').value = data.data.calories;
            document.getElementById('edit-food-prot').value = data.data.protein;
            document.getElementById('edit-food-fat').value = data.data.fats;
            document.getElementById('edit-food-carb').value = data.data.carbs;
            document.getElementById('edit-food-weight').value = data.data.weight_g || 0;

            baseMacros = {
                w: data.data.weight_g || 100,
                cal: data.data.calories || 0,
                p: data.data.protein || 0,
                f: data.data.fats || 0,
                c: data.data.carbs || 0
            };

            document.getElementById('edit-food-correction').value = '';

            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            if (tg && tg.showAlert) tg.showAlert(loc('alert_recalc_success', "✅ Успішно перераховано!"));
        } else {
            if (tg && tg.showAlert) tg.showAlert(loc('alert_recalc_fail', "Не вдалося перерахувати страву."));
        }
    } catch (e) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_error', "Помилка зв'язку з ШІ."));
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = loc('btn_recalc_ai', "✨ Перерахувати"); }
    }
}

async function submitEditFood() {
    const id = document.getElementById('edit-food-id').value;
    const name = document.getElementById('edit-food-name').value.trim() || loc('default_dish_name', 'Страва');
    const cal = parseInt(document.getElementById('edit-food-cal').value) || 0;
    const p = parseInt(document.getElementById('edit-food-prot').value) || 0;
    const f = parseInt(document.getElementById('edit-food-fat').value) || 0;
    const c = parseInt(document.getElementById('edit-food-carb').value) || 0;
    const w = parseInt(document.getElementById('edit-food-weight').value) || 0;

    await fetch('/api/nutrition_log/' + userId + '/' + id, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
        body: JSON.stringify({ user_id: userId, dish_name: name, calories: cal, protein: p, fats: f, carbs: c, weight_g: w })
    });

    if(typeof closeModal === 'function') closeModal('edit-food-modal');
    loadNutrition();
    if(typeof loadGamification === 'function') loadGamification();
}

async function deleteFoodLog(logId) {
    if (confirm(loc('confirm_delete_food', "Видалити цей прийом їжі?"))) {
        try {
            await fetch('/api/nutrition_log/' + userId + '/' + logId, { method: 'DELETE', headers: { 'ngrok-skip-browser-warning': 'true' } });
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            loadNutrition();
            if(typeof loadGamification === 'function') loadGamification();
        } catch(e) {}
    }
}

async function addManualFood() {
    const name = document.getElementById('food-name').value.trim() || loc('default_manual_log', 'Запис вручну');
    const cals = parseInt(document.getElementById('food-cal').value) || 0;
    const prot = parseInt(document.getElementById('food-prot').value) || 0;
    const fat = parseInt(document.getElementById('food-fat').value) || 0;
    const carb = parseInt(document.getElementById('food-carb').value) || 0;
    const weight = parseInt(document.getElementById('food-weight').value) || 0;

    if (cals === 0) {
        if (tg && tg.showAlert) tg.showAlert(loc('alert_enter_calories', "Введіть калорійність."));
        return;
    }

    document.getElementById('food-name').value = '';
    document.getElementById('food-cal').value = '';
    document.getElementById('food-prot').value = '';
    document.getElementById('food-fat').value = '';
    document.getElementById('food-carb').value = '';
    document.getElementById('food-weight').value = '';

    await fetch('/api/log_nutrition', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
        body: JSON.stringify({ user_id: userId, dish_name: name, calories: cals, protein: prot, fats: fat, carbs: carb, weight_g: weight })
    });

    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    loadNutrition();
    if(typeof loadGamification === 'function') loadGamification();
}

// --- 6. РЕДАГУВАННЯ ПЛАНУ ТА ЧЕК-ІН ---

function openEditExModal(dayIndex, exIndex, name, sets, reps) {
    document.getElementById('edit-ex-day').value = dayIndex;
    document.getElementById('edit-ex-index').value = exIndex;
    document.getElementById('edit-ex-name').value = name;
    document.getElementById('edit-ex-sets').value = sets;
    document.getElementById('edit-ex-reps').value = reps;
    document.getElementById('edit-ex-title').innerText = (exIndex == -1) ? loc('btn_add_exercise', "Додати вправу") : loc('title_edit_exercise', "Редагувати вправу");
    document.getElementById('btn-delete-ex').style.display = (exIndex == -1) ? "none" : "block";
    document.getElementById('edit-exercise-modal').classList.add('active');
}

async function submitEditExercise() {
    const dayIndex = document.getElementById('edit-ex-day').value;
    const exIndex = parseInt(document.getElementById('edit-ex-index').value);
    const name = document.getElementById('edit-ex-name').value.trim();
    const sets = document.getElementById('edit-ex-sets').value.trim() || "1";
    const reps = document.getElementById('edit-ex-reps').value.trim() || "10";

    if (!name) { if (tg && tg.showAlert) tg.showAlert(loc('alert_enter_ex_name', "Введіть назву вправи!")); return; }

    let isAdapted = (dayIndex === 'adapted');
    let targetArray = [];

    if (isAdapted) {
        if (!userData.today_checkin.adapted_plan.exercises) userData.today_checkin.adapted_plan.exercises = [];
        targetArray = userData.today_checkin.adapted_plan.exercises;
    } else {
        let dIdx = parseInt(dayIndex);
        if (!userData.workout_plan.days[dIdx].exercises) userData.workout_plan.days[dIdx].exercises = [];
        targetArray = userData.workout_plan.days[dIdx].exercises;
    }

    if (exIndex == -1) { targetArray.push({name: name, sets: sets, reps: reps}); }
    else { targetArray[exIndex] = {name: name, sets: sets, reps: reps}; }

    if(typeof closeModal === 'function') closeModal('edit-exercise-modal');
    await savePlanToServer(isAdapted);
    renderWorkoutDays(isAdapted ? 'adapted' : parseInt(dayIndex));
}

async function deleteExercise() {
    if (!confirm(loc('confirm_delete_ex', "Видалити цю вправу?"))) return;
    const dayIndex = document.getElementById('edit-ex-day').value;
    const exIndex = parseInt(document.getElementById('edit-ex-index').value);
    let isAdapted = (dayIndex === 'adapted');
    if (isAdapted) { userData.today_checkin.adapted_plan.exercises.splice(exIndex, 1); }
    else { userData.workout_plan.days[parseInt(dayIndex)].exercises.splice(exIndex, 1); }
    if(typeof closeModal === 'function') closeModal('edit-exercise-modal');
    await savePlanToServer(isAdapted);
    renderWorkoutDays(isAdapted ? 'adapted' : parseInt(dayIndex));
}

async function savePlanToServer(isAdapted) {
    if (isAdapted) {
        await fetch('/api/update_adapted_plan', { method: 'POST', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'}, body: JSON.stringify({ user_id: userId, plan: userData.today_checkin.adapted_plan }) });
    } else {
        await fetch('/api/update_workout_plan', { method: 'POST', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'}, body: JSON.stringify({ user_id: userId, plan: userData.workout_plan }) });
    }
}

async function submitCheckin() {
    const btn = document.getElementById('btn-checkin');
    btn.disabled = true;
    btn.innerText = loc('adapting_plan', "Адаптація плану... ⏳");

    const currentDayPlan = userData.workout_plan.days[currentDayIndex];
    const payload = {
        user_id: userId,
        sleep: parseInt(document.getElementById('chk-sleep').value),
        energy: parseInt(document.getElementById('chk-energy').value),
        stress: parseInt(document.getElementById('chk-stress').value),
        soreness: parseInt(document.getElementById('chk-soreness').value),
        current_day_plan: currentDayPlan
    };

    try {
        const res = await fetch('/api/checkin', { method: 'POST', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'}, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.status === 'success') {
            globalActiveTab = 'adapted';
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            await refreshUserData();
        } else throw new Error();
    } catch (e) {
        btn.disabled = false; btn.innerText = loc('btn_adapt_workout', "Адаптувати тренування");
    }
}