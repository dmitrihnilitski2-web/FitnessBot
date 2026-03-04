/* =========================================================
   FITNESS HUB PRO | АНІМАЦІЇ ТА ЕФЕКТИ (animations.js)
   Містить: Кастомний курсор, плавна поява (Scroll Reveal), Каскадні анімації
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    initCustomCursor();
    initScrollReveal();
});

// --- 1. КАСТОМНИЙ КУРСОР (Для Desktop/Web) ---
function initCustomCursor() {
    const cursor = document.getElementById('custom-cursor');
    if (!cursor) return;

    // Перевіряємо, чи це тач-пристрій (телефон). Якщо так — вимикаємо курсор.
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    if (isTouchDevice) {
        cursor.style.display = 'none';
        return;
    }

    // Рух курсора за мишкою
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // Делегування подій для ефекту наведення (працює і для динамічно створених елементів)
    document.body.addEventListener('mouseover', (e) => {
        const target = e.target.closest('button, a, input, select, textarea, .nav-item, .day-tab, .symptom-chip, .ex-row, .card, .water-glass');
        if (target) {
            cursor.classList.add('hovered');
        }
    });

    document.body.addEventListener('mouseout', (e) => {
        const target = e.target.closest('button, a, input, select, textarea, .nav-item, .day-tab, .symptom-chip, .ex-row, .card, .water-glass');
        if (target) {
            cursor.classList.remove('hovered');
        }
    });
}

// --- 2. SCROLL REVEAL (Плавне випливання елементів) ---
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');

    // Налаштування обзервера
    const revealOptions = {
        threshold: 0.05, // Відсоток видимості елемента, при якому спрацює анімація
        rootMargin: "0px 0px -20px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                // Знімаємо клас, щоб елементи знову анімувались при скролі вгору/вниз
                entry.target.classList.remove('visible');
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });

    // --- КАСКАДНА АНІМАЦІЯ ПРИ ПЕРЕМИКАННІ ВКЛАДОК (SPA Stagger Effect) ---
    // Перехоплюємо нашу глобальну функцію showView з client.js
    if (typeof window.showView === 'function') {
        const originalShowView = window.showView;

        window.showView = function(viewId) {
            // Спочатку викликаємо оригінальну функцію перемикання екрану
            originalShowView(viewId);

            // Знаходимо новий активний екран
            const activeView = document.getElementById(viewId);
            if (activeView) {
                // Знаходимо всі елементи для анімації всередині нього
                const viewReveals = activeView.querySelectorAll('.reveal');

                viewReveals.forEach((el, index) => {
                    // Ховаємо їх
                    el.classList.remove('visible');

                    // Додаємо затримку (stagger). Кожен наступний елемент виїде на 60мс пізніше
                    setTimeout(() => {
                        el.classList.add('visible');
                    }, 60 * index);
                });
            }
        };
    }
}