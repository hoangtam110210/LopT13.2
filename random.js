/* ========================================================
   MODULE RANDOM NÂNG CẤP: BAY NHẢY LUNG TUNG & NẢY BẬT CỰC VUI
   ======================================================== */

let isSpinning = false;

// Tự động chèn các Keyframe Animation nảy bật và bay nhảy vào ứng dụng
(function injectRandomStyles() {
    if (document.getElementById('rand-dynamic-animations')) return;
    let style = document.createElement('style');
    style.id = 'rand-dynamic-animations';
    style.innerHTML = `
        @keyframes wildFlyCard {
            0% { transform: translate(0, 0) rotate(0deg) scale(1); }
            25% { transform: translate(45px, -35px) rotate(25deg) scale(1.15); }
            50% { transform: translate(-40px, 30px) rotate(-20deg) scale(0.85); }
            75% { transform: translate(35px, 20px) rotate(15deg) scale(1.1); }
            100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        }
        @keyframes elasticDrop {
            0% { transform: translateY(-50px) scale(0.3); opacity: 0; }
            60% { transform: translateY(15px) scale(1.25); opacity: 1; }
            80% { transform: translateY(-8px) scale(0.92); }
            100% { transform: translateY(0) scale(1); }
        }
        @keyframes slotReelRoll {
            0% { transform: translateY(-30px) scaleY(1.2); opacity: 0.6; }
            50% { transform: translateY(10px) scaleY(0.9); }
            100% { transform: translateY(0) scaleY(1); opacity: 1; }
        }
        @keyframes chaoticBubble {
            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
            25% { transform: translate(-25px, -20px) scale(1.15) rotate(12deg); }
            50% { transform: translate(30px, -15px) scale(0.88) rotate(-15deg); }
            75% { transform: translate(-15px, 25px) scale(1.1) rotate(8deg); }
            100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        }
        @keyframes winnerPop {
            0% { transform: scale(0.2) rotate(-15deg); opacity: 0; }
            70% { transform: scale(1.2) rotate(5deg); opacity: 1; }
            85% { transform: scale(0.95) rotate(-2deg); }
            100% { transform: scale(1) rotate(0deg); }
        }
    `;
    document.head.appendChild(style);
})();

// 1. Phân biệt tên trùng
function getUniqueDisplayName(fullName, pool) {
    if (!fullName) return "Học sinh";
    let parts = fullName.trim().split(/\s+/);
    let firstName = parts[parts.length - 1];

    let duplicates = pool.filter(p => {
        let pParts = p.name.trim().split(/\s+/);
        return pParts[pParts.length - 1].toLowerCase() === firstName.toLowerCase();
    });

    if (duplicates.length > 1 && parts.length > 1) {
        let middleName = parts[parts.length - 2];
        return `${middleName} ${firstName}`;
    }

    return firstName;
}

function renderRandomModule() {
    let container = document.getElementById('rand-exclusion-list');
    if (!container) return;

    let users = JSON.parse(localStorage.getItem('T132_USERS')) || [];
    let students = users.filter(u => u.stt > 0);

    let html = "";
    students.forEach(s => {
        let displayName = getUniqueDisplayName(s.name, students);
        html += `
            <label style="display:inline-block; font-size:11px; margin:3px 5px; cursor:pointer; background:#fff; padding:4px 8px; border-radius:10px; border:1px solid var(--border-color);">
                <input type="checkbox" class="rand-exclude-cb" value="${s.name}"> ${s.stt}. ${displayName}
            </label>
        `;
    });

    container.innerHTML = html;
}

async function executeCustomRandomSpin() {
    if (isSpinning) return;

    let purpose = document.getElementById('rand-purpose').value.trim();
    let count = parseInt(document.getElementById('rand-count').value || 1);
    let duration = parseInt(document.getElementById('rand-duration').value || 3) * 1000;
    let mode = document.getElementById('rand-mode-select') ? document.getElementById('rand-mode-select').value : 'slot';
    let winnerBox = document.getElementById('rand-winner-box');

    if (!purpose) {
        alert("⚠️ Vui lòng nhập Mục đích bốc thăm!");
        return;
    }

    let users = JSON.parse(localStorage.getItem('T132_USERS')) || [];
    let excludedBoxes = document.querySelectorAll('.rand-exclude-cb:checked');
    let excludedNames = Array.from(excludedBoxes).map(cb => cb.value);

    let pool = users.filter(u => u.stt > 0 && !excludedNames.includes(u.name));

    if (pool.length < count) {
        alert(`⚠️ Số lượng học sinh còn lại (${pool.length} người) ít hơn số người cần chọn (${count} người)!`);
        return;
    }

    isSpinning = true;
    winnerBox.style.display = 'block';

    let winners = [];
    let tempPool = [...pool];
    for (let i = 0; i < count; i++) {
        let idx = Math.floor(Math.random() * tempPool.length);
        winners.push(tempPool.splice(idx, 1)[0]);
    }

    if (mode === 'card') {
        await runCardShuffleAnimation(pool, winners, duration, winnerBox);
    } else if (mode === 'lottery') {
        await runLotteryBounceAnimation(pool, winners, duration, winnerBox);
    } else {
        await runSlotMachineAnimation(pool, winners, duration, winnerBox);
    }

    renderRandomResultActions(purpose, winners, winnerBox);
    isSpinning = false;
}

/* 🎰 1. VÒNG QUAY / SLOT MACHINE NẢY BẬT ĐÀN HỒI (ELASTIC BOUNCE) */
async function runSlotMachineAnimation(pool, winners, duration, container) {
    let startTime = Date.now();
    let delay = 40;
    let icons = ["🌟", "🎉", "💖", "💎", "🦄", "🌈", "👑", "🔥", "⚡"];

    while (Date.now() - startTime < duration) {
        let progress = (Date.now() - startTime) / duration;
        let randomIcon = icons[Math.floor(Math.random() * icons.length)];

        let slotsHtml = winners.map(() => {
            let temp = pool[Math.floor(Math.random() * pool.length)];
            let displayName = getUniqueDisplayName(temp.name, pool);
            return `
                <div style="display:inline-block; margin:6px; text-align:center; background:rgba(255,255,255,0.9); padding:8px 14px; border-radius:18px; border:3px solid #ff758f; box-shadow:0 6px 18px rgba(255,117,143,0.4); animation: slotReelRoll 0.1s ease-out;">
                    <div style="font-size:14px; margin-bottom:2px;">${randomIcon}</div>
                    <img src="${temp.avatar || DEFAULT_AVATAR}" style="width:55px; height:55px; border-radius:50%; object-fit:cover; border:3px solid #ffb703; box-shadow:0 0 12px #ffb703;">
                    <div style="font-size:11px; font-weight:800; color:#805ad5; margin-top:4px;">${displayName}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div style="background: linear-gradient(135deg, #ffccd5 0%, #ffb3c1 40%, #c8b6ff 100%); border: 3px solid #ff4d6d; padding: 18px; border-radius: 24px; text-align: center; box-shadow: 0 0 25px rgba(255,77,109,0.5);">
                <p style="color:#a4133c; font-size:13px; font-weight:900; letter-spacing:1px; text-shadow:0 0 8px #fff;">🎰 💖 VÒNG QUAY SLOT ĐANG NẢY TƯNG TƯNG (${winners.length} Ô) 💖 🎰</p>
                <div style="margin-top:10px; display:flex; justify-content:center; align-items:center; flex-wrap:wrap; gap:8px;">${slotsHtml}</div>
            </div>
        `;

        await new Promise(r => setTimeout(r, delay));
        // Giảm tốc độ quay dần về cuối để tạo cảm giác hãm phanh chuẩn vòng quay
        if (progress > 0.6) delay += 20;
        if (progress > 0.85) delay += 40;
    }
}

/* 🃏 2. HOẠT ẢNH XÁO BÀI BAY NHẢY LUNG TUNG 3D (WILD FLYING CARDS) */
async function runCardShuffleAnimation(pool, winners, duration, container) {
    let startTime = Date.now();
    let cardIcons = ["✨", "🦄", "🌈", "🎀", "💖", "🔮", "🍀"];

    // Giai đoạn 1: Bay nhảy tung tăng khắp nơi
    while (Date.now() - startTime < duration) {
        let cardsHtml = winners.map((_, i) => {
            let icon = cardIcons[(i + Math.floor(Math.random() * cardIcons.length)) % cardIcons.length];
            return `
                <div style="display:inline-block; margin:10px; perspective:1000px;">
                    <div style="width:80px; height:110px; background:linear-gradient(135deg, #7c3aed 0%, #c084fc 100%); border-radius:14px; border:3px solid #fff; box-shadow:0 8px 20px rgba(124,58,237,0.5); display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; animation: wildFlyCard 0.4s infinite ease-in-out alternate ${i * 0.1}s;">
                        <span style="font-size:28px;">${icon}</span>
                        <span style="font-size:10px; font-weight:900; margin-top:6px; letter-spacing:1px;">T13.2</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border: 3px dashed #a855f7; padding: 18px; border-radius: 24px; text-align: center; overflow:hidden;">
                <p style="color:#6b21a8; font-size:13px; font-weight:900;">🃏 🚀 CÁC LÁ BÀI ĐANG BAY NHẢY LUNG TUNG (${winners.length} LÁ)...</p>
                <div style="margin-top:12px; min-height:130px; display:flex; justify-content:center; align-items:center; flex-wrap:wrap;">
                    ${cardsHtml}
                </div>
            </div>
        `;

        await new Promise(r => setTimeout(r, 120));
    }

    // Giai đoạn 2: Gom bài lại & Lật 180° lấp lánh
    let readyCardsHtml = winners.map((_, i) => `
        <div id="flip-card-container-${i}" style="display:inline-block; margin:8px; perspective:1000px;">
            <div id="flip-card-inner-${i}" style="position:relative; width:85px; height:115px; text-align:center; transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-style: preserve-3d; cursor:pointer;">
                <div style="position:absolute; width:100%; height:100%; backface-visibility:hidden; background:linear-gradient(135deg, #6d28d9 0%, #a855f7 100%); border-radius:14px; border:3px solid #fff; box-shadow:0 6px 15px rgba(0,0,0,0.2); display:flex; align-items:center; justify-content:center; color:#fff; font-size:26px; font-weight:bold;">
                    ❓
                </div>
                <div style="position:absolute; width:100%; height:100%; backface-visibility:hidden; transform: rotateY(180deg); background:#fff; border-radius:14px; border:3px solid #f59e0b; box-shadow:0 8px 20px rgba(245,158,11,0.4); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:4px;">
                    <img src="${winners[i].avatar || DEFAULT_AVATAR}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2px solid #f59e0b;">
                    <div style="font-size:10px; font-weight:800; color:#2b8a3e; margin-top:4px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; width:100%;">
                        ${getUniqueDisplayName(winners[i].name, pool)}
                    </div>
                    <span style="font-size:9px; background:#fef3c7; color:#d97706; padding:1px 5px; border-radius:6px; margin-top:2px; font-weight:bold;">🏆 WIN</span>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border: 3px dashed #a855f7; padding: 18px; border-radius: 24px; text-align: center;">
            <p style="color:#6b21a8; font-size:13px; font-weight:900;">✨ CHUẨN BỊ LẬT BÀI BÍ MẬT...</p>
            <div style="margin-top:12px; display:flex; justify-content:center; align-items:center; flex-wrap:wrap;">
                ${readyCardsHtml}
            </div>
        </div>
    `;

    await new Promise(r => setTimeout(r, 300));
    for (let i = 0; i < winners.length; i++) {
        let cardInner = document.getElementById(`flip-card-inner-${i}`);
        if (cardInner) {
            cardInner.style.transform = 'rotateY(180deg)';
        }
        await new Promise(r => setTimeout(r, 350));
    }

    await new Promise(r => setTimeout(r, 500));
}

/* 🫧 3. LỒNG CẦU BONG BÓNG SIÊU QUẬY (CHAOTIC BUBBLE BOUNCE) */
async function runLotteryBounceAnimation(pool, winners, duration, container) {
    let startTime = Date.now();
    let seaEmojis = ["🐬", "🐙", "🐰", "🎈", "✨", "🐠", "🦄", "🌸", "⭐"];

    while (Date.now() - startTime < duration) {
        let tempBalls = winners.map((_, i) => {
            let temp = pool[Math.floor(Math.random() * pool.length)];
            let displayName = getUniqueDisplayName(temp.name, pool);
            let randomSeaIcon = seaEmojis[(i + Math.floor(Math.random() * seaEmojis.length)) % seaEmojis.length];

            return `
                <div style="position:relative; width:72px; height:72px; background:rgba(255,255,255,0.85); backdrop-filter:blur(6px); border-radius:50%; border:3px solid #a5f3fc; box-shadow:0 8px 22px rgba(56,189,248,0.5), inset 0 0 12px rgba(255,255,255,0.9); display:inline-flex; flex-direction:column; align-items:center; justify-content:center; margin:8px; animation: chaoticBubble 0.4s infinite ease-in-out alternate ${i * 0.12}s;">
                    <span style="position:absolute; top:-8px; right:-6px; font-size:16px;">${randomSeaIcon}</span>
                    <img src="${temp.avatar || DEFAULT_AVATAR}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:2px solid #38bdf8;">
                    <div style="font-size:9px; font-weight:800; color:#0284c7; margin-top:2px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:62px;">${displayName}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div style="background: linear-gradient(135deg, #a5f3fc 0%, #fbcfe8 50%, #c084fc 100%); border: 3px solid #38bdf8; padding: 18px; border-radius: 24px; text-align: center; box-shadow: 0 0 25px rgba(56,189,248,0.5);">
                <p style="color:#0369a1; font-size:13px; font-weight:900; letter-spacing:0.5px; text-shadow:0 0 6px #fff;">🫧 🐬 BONG BÓNG THỦY CUNG NẢY TƯNG TƯNG 🐬 🫧</p>
                <div style="margin-top:10px; display:flex; justify-content:center; align-items:center; flex-wrap:wrap;">${tempBalls}</div>
            </div>
        `;
        await new Promise(r => setTimeout(r, 70));
    }
}

/* HIỂN THỊ KẾT QUẢ VỚI HIỆU ỨNG POP NẢY BẬT */
function renderRandomResultActions(purpose, winners, container) {
    let users = JSON.parse(localStorage.getItem('T132_USERS')) || [];
    let winnersHtml = winners.map(w => {
        let displayName = getUniqueDisplayName(w.name, users);
        return `
            <div style="display:inline-block; margin:8px; text-align:center; animation: winnerPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;">
                <img src="${w.avatar || DEFAULT_AVATAR}" style="width:62px; height:62px; border-radius:50%; object-fit:cover; border:3px solid var(--primary-color); box-shadow: 0 6px 16px rgba(0,0,0,0.18);">
                <div style="font-size:12px; font-weight:bold; color:var(--text-color); margin-top:4px;">${displayName}</div>
            </div>
        `;
    }).join('');

    let winnersNamesStr = winners.map(w => w.name).join(', ');
    let isBCS = (typeof isBCSMember === 'function') ? isBCSMember() : true;

    container.innerHTML = `
        <div style="background: var(--primary-light); border: 2px solid var(--primary-color); padding: 18px; border-radius: 22px; text-align: center; box-shadow: 0 8px 22px rgba(0,0,0,0.1); margin-top:10px; animation: elasticDrop 0.5s ease;">
            <p style="color:var(--primary-color); font-size:13px; font-weight:900; letter-spacing:1px;">🎉 DANH SÁCH ĐƯỢC CHỌN (${purpose.toUpperCase()}):</p>
            <div style="margin: 10px 0;">${winnersHtml}</div>
            
            ${isBCS ? `
                <button onclick="pushRandomTaskToClass('${purpose}', '${winnersNamesStr}')" class="btn btn-primary" style="margin-top:6px; padding:8px 18px; font-size:12px;">🚀 Giao việc sang Tab Công Việc Ngay</button>
            ` : `
                <p style="font-size:11px; color:#777; margin-top:6px;"><i>(Học sinh có thể quay thử cho vui, chỉ Ban cán sự mới có thể bấm Giao việc)</i></p>
            `}
        </div>
    `;
}

function pushRandomTaskToClass(taskTitle, assignedUsersStr) {
    let tasks = JSON.parse(localStorage.getItem('T132_TASKS')) || [];
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};

    tasks.unshift({
        id: Date.now(),
        title: `[🎲 Bốc thăm] ${taskTitle}`,
        assignedTo: assignedUsersStr,
        createdBy: currentUser.name || "Ban cán sự",
        deadline: new Date().toLocaleDateString('vi-VN'),
        status: "IN_PROGRESS",
        proofs: []
    });

    localStorage.setItem('T132_TASKS', JSON.stringify(tasks));
    alert(`🚀 Đã tạo nhiệm vụ "${taskTitle}" và giao cho (${assignedUsersStr})!`);
}
