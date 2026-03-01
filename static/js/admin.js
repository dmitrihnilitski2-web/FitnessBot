/* =========================================================
   FITNESS HUB PRO | ЛОГІКА АДМІНІСТРАТОРА (admin.js)
   ========================================================= */

// 1. Ініціалізація Telegram WebApp
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();
}

// 2. Константи та ідентифікація
const ADMIN_ID = 1100202114;
let currentUserId = null;

if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) {
    // Явно перетворюємо в число, щоб уникнути помилок порівняння
    currentUserId = Number(tg.initDataUnsafe.user.id);
} else {
    currentUserId = 1100202114; // Фолбек для локального тестування
}

// --- ГОЛОВНА ФУНКЦІЯ ---
async function initAdmin() {
    // Жорстка перевірка безпеки
    if (currentUserId !== ADMIN_ID) {
        // ВИПРАВЛЕНО: Перемикаємо через класи, а не через style.display
        document.getElementById('loading-view').classList.remove('active');
        document.getElementById('error-view').classList.add('active');
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
        return;
    }

    try {
        // 1. Завантаження глобальної статистики
        const statsRes = await fetch('/api/admin/stats/' + ADMIN_ID, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });

        if (!statsRes.ok) throw new Error("Помилка завантаження статистики");
        const statsData = await statsRes.json();

        if (statsData.status === 'success') {
            document.getElementById('stat-total-users').innerText = statsData.data.total_users;
            document.getElementById('stat-total-time').innerText = statsData.data.total_time_hours;
            document.getElementById('stat-trainers').innerText = statsData.data.total_trainers;
            document.getElementById('stat-clients').innerText = statsData.data.total_clients;
            document.getElementById('stat-plans').innerText = statsData.data.total_plans;
        }

        // 2. Завантаження списку всіх користувачів
        const usersRes = await fetch('/api/admin/users/' + ADMIN_ID, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const usersData = await usersRes.json();

        const listContainer = document.getElementById('users-list');
        listContainer.innerHTML = '';

        if (usersData.status === 'success' && usersData.data && usersData.data.length > 0) {
            usersData.data.forEach(function(u) {
                let roleClass = u.role === 'trainer' ? 'role-trainer' : 'role-client';
                let roleText = u.role === 'trainer' ? 'Тренер' : 'Клієнт';
                let usernameText = u.username ? `@${u.username}` : `Без юзернейму (ID: ${u.user_id})`;
                let lastActive = u.last_active_date || "Ніколи";

                let hours = Math.floor((u.total_time_spent || 0) / 60);
                let mins = (u.total_time_spent || 0) % 60;
                let timeSpent = `${hours} год ${mins} хв`;

                listContainer.innerHTML += `
                    <div class="admin-user-row">
                        <div class="admin-user-header">
                            <div style="font-weight: bold; color: var(--text-color);">${u.name}</div>
                            <div class="${roleClass} role-badge">${roleText}</div>
                        </div>
                        <div style="font-size: 13px; color: var(--client-blue);">${usernameText}</div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--hint-color); margin-top: 4px;">
                            <span>В онлайні: ${lastActive}</span>
                            <span>⏳ ${timeSpent}</span>
                        </div>
                    </div>
                `;
            });
        } else {
            listContainer.innerHTML = '<p style="color: var(--hint-color); text-align: center;">База порожня.</p>';
        }

        // 3. ВИПРАВЛЕНО: Показуємо адмінку через класи
        document.getElementById('loading-view').classList.remove('active');
        document.getElementById('admin-view').classList.add('active');

        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

    } catch (err) {
        console.error("Критична помилка в Адмін-панелі:", err);
        const loadingText = document.getElementById('loading-text');
        if (loadingText) loadingText.innerText = "Помилка зв'язку з сервером.";
    }
}

// Запуск логіки тільки після повного завантаження сторінки
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
} else {
    initAdmin();
}