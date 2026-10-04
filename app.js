/* ========================================================
   BỘ ĐIỀU PHỐI CHÍNH & CHUYỂN TAB
   ======================================================== */

let myBarChart = null;
const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%2388c999'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='40'>🍀</text></svg>";

document.addEventListener("DOMContentLoaded", () => {
    if (typeof initDefaultData === 'function') initDefaultData();
    applySavedTheme();
    startApp();
});

function startApp() {
    let user = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};

    let nameEl = document.getElementById('header-username');
    let roleEl = document.getElementById('user-role-badge');
    let avatarEl = document.getElementById('header-avatar');

    if (nameEl) nameEl.innerText = user.nickname ? `${user.name} (${user.nickname})` : user.name;
    if (roleEl) roleEl.innerText = user.role;
    if (avatarEl) avatarEl.src = user.avatar || DEFAULT_AVATAR;

    if (typeof renderAdminPanel === 'function') renderAdminPanel();
    if (typeof renderRandomModule === 'function') renderRandomModule();
    if (typeof renderDisciplineDutyTab === 'function') renderDisciplineDutyTab();
    if (typeof renderPostsFeed === 'function') renderPostsFeed();
    if (typeof renderTasks === 'function') renderTasks();
    if (typeof renderFundTab === 'function') renderFundTab();
    if (typeof renderMemoriesTab === 'function') renderMemoriesTab();
    if (typeof renderUserProfile === 'function') renderUserProfile();
    if (typeof renderFeedbackList === 'function') renderFeedbackList();
    if (typeof renderDocumentsList === 'function') renderDocumentsList();

    setTimeout(renderDashboardCharts, 150);
}

function switchTab(tabId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));

    let target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    }

    if (tabId === 'tab-home') renderDashboardCharts();
    if (tabId === 'tab-labor') renderDisciplineDutyTab();
    if (tabId === 'tab-posts') renderPostsFeed();
    if (tabId === 'tab-tasks') renderTasks();
    if (tabId === 'tab-fund') renderFundTab();
    if (tabId === 'tab-memories') renderMemoriesTab();
    if (tabId === 'tab-profile') renderUserProfile();
    if (tabId === 'tab-games') openMiniGameSection('xo');
}

/* Biểu đồ cột Trang chủ: Thống kê tổng số ngày lao động phạt (Mỗi cột một màu riêng) */
function renderDashboardCharts() {
    let canvasBar = document.getElementById('chartBarTasks');
    if (canvasBar && typeof Chart !== 'undefined') {
        let violations = [];
        try {
            violations = JSON.parse(localStorage.getItem('T132_LABOR_VIOLATIONS')) || [];
        } catch(e) {}

        let totalDaysByStudent = {};
        violations.forEach(v => {
            if (v && v.studentName) {
                let days = parseInt(v.penaltyDays) || 1;
                totalDaysByStudent[v.studentName] = (totalDaysByStudent[v.studentName] || 0) + days;
            }
        });

        let topViolators = Object.keys(totalDaysByStudent).map(name => ({
            name: name,
            totalDays: totalDaysByStudent[name]
        })).sort((a, b) => b.totalDays - a.totalDays).slice(0, 8);

        let labelsX = topViolators.map(v => v.name);
        let dataY = topViolators.map(v => v.totalDays);

        if (labelsX.length === 0) {
            labelsX = ['Chưa có vi phạm'];
            dataY = [0];
        }

        // Danh sách bảng màu pastel sinh động cho từng cột
        const pastelColors = [
            '#ff6b6b', '#fcc419', '#52b788', '#48cae4', 
            '#a855f7', '#ff758f', '#3b82f6', '#10b981'
        ];

        let backgroundColors = labelsX.map((_, index) => pastelColors[index % pastelColors.length]);

        if (myBarChart) { myBarChart.destroy(); }
        let ctx = canvasBar.getContext('2d');
        
        myBarChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labelsX,
                datasets: [{
                    label: 'Tổng số ngày lao động phạt',
                    data: dataY,
                    backgroundColor: backgroundColors,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { display: false } // Ẩn chú thích thừa vì mỗi cột đã có màu riêng biểu thị tên học sinh ở trục X
                }
            }
        });
        
        window.barTasksChartInstance = myBarChart;
    }
}

function changeUserTheme(themeName) {
    document.body.className = '';
    if (themeName !== 'default') document.body.classList.add(`theme-${themeName}`);
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    currentUser.theme = themeName;
    localStorage.setItem('T132_CURRENT_USER', JSON.stringify(currentUser));
    alert(`🎨 Đã đổi giao diện sang tông màu: ${themeName.toUpperCase()}`);
}

function applySavedTheme() {
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    if (currentUser.theme && currentUser.theme !== 'default') {
        document.body.className = '';
        document.body.classList.add(`theme-${currentUser.theme}`);
    }
}
