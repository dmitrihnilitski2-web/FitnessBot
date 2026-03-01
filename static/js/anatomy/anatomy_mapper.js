/* =========================================================
   FITNESS HUB PRO | АНАТОМІЧНИЙ РУШІЙ (anatomy_mapper.js)
   Цей скрипт малює тіло та накладає кольори втоми.
   ========================================================= */

window.AnatomyMapper = {
    // Ці частини тіла ніколи не втомлюються, вони залишаються базового кольору
    staticParts: ['head', 'hair', 'neck', 'hands', 'knees', 'ankles', 'feet'],

    // Функція малювання SVG
    drawBodyMap: function(gender) {
        // Вибираємо масиви відповідно до статі
        const frontData = gender === 'female' ? window.bodyFemaleFront : window.bodyFront;
        const backData = gender === 'female' ? window.bodyFemaleBack : window.bodyBack;

        const frontContainer = document.getElementById('svg-body-front');
        const backContainer = document.getElementById('svg-body-back');

        if (!frontContainer || !backContainer) return;

        // Встановлюємо правильний масштаб і координати (viewBox)
        // Для фронту координати зазвичай від 0 до 750
        frontContainer.setAttribute("viewBox", "0 0 750 1500");
        // Для спини координати у файлах зсунуті по X (приблизно 700-1400)
        backContainer.setAttribute("viewBox", "700 0 750 1500");

        // Генеруємо шляхи
        frontContainer.innerHTML = this.generatePaths(frontData);
        backContainer.innerHTML = this.generatePaths(backData);
    },

    // Внутрішня функція створення <path>
    generatePaths: function(partsData) {
        if (!partsData) return '';
        let html = '';

        partsData.forEach(part => {
            const isStatic = this.staticParts.includes(part.slug);
            const groupClass = isStatic ? 'svg-static' : `svg-muscle-${part.slug}`;

            // Якщо це неробоча частина (голова, волосся) — беремо її рідний колір з масиву
            // Якщо це м'яз — робимо його спочатку темно-сірим (не тренованим)
            const baseColor = isStatic ? (part.color || '#3f3f3f') : '#2c2c2e';

            ['common', 'left', 'right'].forEach(side => {
                if (part.path && part.path[side]) {
                    part.path[side].forEach(d => {
                        html += `<path d="${d}" class="muscle-path ${groupClass}" data-muscle="${part.slug}" fill="${baseColor}" stroke="#1c1c1e" stroke-width="1.5" style="transition: fill 0.6s ease;" />`;
                    });
                }
            });
        });

        return html;
    },

    // Функція розфарбовки м'язів
    applyFatigue: function(fatigueData) {
        if (!fatigueData) return;

        // Визначаємо колір за рівнем втоми (0-100)
        const getFatigueColor = (val) => {
            if (val <= 20) return '#32d74b'; // Зелений (свіжий / відновився)
            if (val <= 60) return '#ffd60a'; // Жовтий (в процесі)
            return '#ff453a'; // Червоний (втомлений / після тренування)
        };

        // Спочатку "скидаємо" всі м'язи до базового темно-сірого кольору
        const dynamicPaths = document.querySelectorAll('.muscle-path:not(.svg-static)');
        dynamicPaths.forEach(el => {
            el.style.fill = '#2c2c2e';
        });

        // Проходимось по кожному м'язу, який прийшов з сервера
        Object.keys(fatigueData).forEach(muscle => {
            const val = fatigueData[muscle];

            // Якщо є хоч якась втома — фарбуємо відповідну зону
            if (val > 0) {
                const elements = document.querySelectorAll(`.svg-muscle-${muscle}`);
                elements.forEach(el => {
                    el.style.fill = getFatigueColor(val);
                    el.style.opacity = "0.9";
                });
            }
        });
    }
};