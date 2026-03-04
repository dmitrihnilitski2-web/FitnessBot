/* =========================================================
   FITNESS HUB PRO | АНАТОМІЧНИЙ РУШІЙ (anatomy_mapper.js)
   Цей скрипт малює тіло та накладає кольори втоми.
   ========================================================= */

window.AnatomyMapper = {
    // Статичні частини тіла, які не беруть участі у тренуваннях
    staticParts: ['head', 'hair', 'neck', 'hands', 'knees', 'ankles', 'feet'],

    // Головна функція малювання SVG
    drawBodyMap: function(gender) {
        // Вибираємо масиви відповідно до статі
        const frontData = gender === 'female' ? window.bodyFemaleFront : window.bodyFront;
        const backData = gender === 'female' ? window.bodyFemaleBack : window.bodyBack;

        const frontContainer = document.getElementById('svg-body-front');
        const backContainer = document.getElementById('svg-body-back');

        if (!frontContainer || !backContainer) {
            console.warn("AnatomyMapper: SVG контейнери не знайдено.");
            return;
        }

        if (!frontData || !backData) {
            console.warn("AnatomyMapper: Дані анатомії ще не завантажені.");
            return;
        }

        // Встановлюємо правильний масштаб і координати (viewBox)
        // Для фронту координати зазвичай від 0 до 750
        frontContainer.setAttribute("viewBox", "0 0 750 1500");
        // Для спини координати у файлах зсунуті по X (приблизно 700-1400)
        backContainer.setAttribute("viewBox", "700 0 750 1500");

        // Генеруємо шляхи і вставляємо в HTML
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

            // Кольори під преміальний темний дизайн
            // Статичні деталі - їх рідний колір (або сірий), М'язи - глибокий темний #151515
            const baseColor = isStatic ? (part.color || '#2c2c2e') : '#151515';
            const strokeColor = isStatic ? '#111111' : '#2a2a2c';

            // Проходимось по лівій, правій та спільній частині
            ['common', 'left', 'right'].forEach(side => {
                if (part.path && part.path[side]) {
                    part.path[side].forEach(d => {
                        html += `<path 
                            d="${d}" 
                            class="muscle-path ${groupClass}" 
                            data-muscle="${part.slug}" 
                            fill="${baseColor}" 
                            stroke="${strokeColor}" 
                            stroke-width="1.5" 
                            style="transition: fill 0.5s cubic-bezier(0.16, 1, 0.3, 1);" 
                        />`;
                    });
                }
            });
        });

        return html;
    },

    // Функція розфарбовки м'язів на основі даних з сервера
    applyFatigue: function(fatigueData) {
        if (!fatigueData) return;

        // Визначаємо колір за рівнем втоми (0-100)
        const getFatigueColor = (val) => {
            if (val <= 20) return '#00ea66'; // Неоновий зелений (свіжий / відновився)
            if (val <= 60) return '#ffd60a'; // Жовтий (в процесі)
            return '#ff453a';                // Червоний (втомлений / після тренування)
        };

        // 1. Спочатку "скидаємо" всі робочі м'язи до базового темного кольору
        const dynamicPaths = document.querySelectorAll('.muscle-path:not(.svg-static)');
        dynamicPaths.forEach(el => {
            el.style.fill = '#151515';
        });

        // 2. Проходимось по кожному м'язу, який прийшов з сервера
        Object.keys(fatigueData).forEach(muscle => {
            const val = fatigueData[muscle];

            // Якщо є хоч якась втома — фарбуємо відповідну зону
            if (val > 0) {
                const elements = document.querySelectorAll(`.svg-muscle-${muscle}`);
                elements.forEach(el => {
                    el.style.fill = getFatigueColor(val);
                    el.style.opacity = "1"; // Робимо колір насиченим
                });
            }
        });
    }
};