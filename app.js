/* ========================================================
   BỘ ĐIỀU PHỐI CHÍNH & CHUYỂN TAB (T132 HUB - REALTIME READY)
   ======================================================== */

let myBarChart = null;
const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%2388c999'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='40'>🍀</text></svg>";

document.addEventListener("DOMContentLoaded", () => {
    if (typeof initDefaultData === 'function') initDefaultData();
    applySavedTheme();
    startApp();
});

/* --------------------------------------------------------------------------
   1. KHỞI CHẠY ỨNG DỤNG & CẬP NHẬT HEADER
   -------------------------------------------------------------------------- */
function startApp() {
    updateHeaderUserInfo();

    // Khởi tạo các Sub-module (kiểm tra an toàn tồn tại hàm)
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

// Cập nhật thông tin User trên thanh Header
function updateHeaderUserInfo() {
    let user = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};

    let nameEl = document.getElementById('header-username');
    let roleEl = document.getElementById('user-role-badge');
    let avatarEl = document.getElementById('header-avatar');

    let displayName = user.name || "Thành viên T132";
    if (user.nickname) {
        displayName += ` (${user.nickname})`;
    }

    if (nameEl) nameEl.innerText = displayName;
    if (roleEl) roleEl.innerText = user.role || "Thành viên";
    if (avatarEl) avatarEl.src = user.avatar || DEFAULT_AVATAR;
}

/* --------------------------------------------------------------------------
   2. XỬ LÝ CHUYỂN TAB MƯỢT MÀ & VẼ LAI GIAO DIỆN
   -------------------------------------------------------------------------- */
function switchTab(tabId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));

    let target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    if (window.event && window.event.target) {
        let btn = window.event.target.closest('button');
        if (btn) btn.classList.add('active');
    }

    // Trigger vẽ lại UI tương ứng theo tab
    if (tabId === 'tab-home') renderDashboardCharts();
    if (tabId === 'tab-labor' && typeof renderDisciplineDutyTab === 'function') renderDisciplineDutyTab();
    if (tabId === 'tab-posts' && typeof renderPostsFeed === 'function') renderPostsFeed();
    if (tabId === 'tab-tasks' && typeof renderTasks === 'function') renderTasks();
    if (tabId === 'tab-fund' && typeof renderFundTab === 'function') renderFundTab();
    if (tabId === 'tab-memories' && typeof renderMemoriesTab === 'function') renderMemoriesTab();
    if (tabId === 'tab-profile' && typeof renderUserProfile === 'function') renderUserProfile();
    if (tabId === 'tab-games' && typeof openMiniGameSection === 'function') openMiniGameSection('xo');
}

/* --------------------------------------------------------------------------
   3. BIỂU ĐỒ TRANG CHỦ: THỐNG KÊ NGÀY LAO ĐỘNG PHẠT
   -------------------------------------------------------------------------- */
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

        const pastelColors = [
            '#ff6b6b', '#fcc419', '#52b788', '#48cae4', 
            '#a855f7', '#ff758f', '#3b82f6', '#10b981'
        ];

        let backgroundColors = labelsX.map((_, index) => pastelColors[index % pastelColors.length]);

        // Hủy chart cũ trước khi vẽ chart mới để tránh đè Canvas
        if (myBarChart) { 
            myBarChart.destroy(); 
            myBarChart = null;
        }

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
                    legend: { display: false }
                }
            }
        });
        
        window.barTasksChartInstance = myBarChart;
    }
}

/* --------------------------------------------------------------------------
   4. CÀI ĐẶT GIAO DIỆN / THEME VÀ ĐỒNG BỘ NGUYÊN BẢN
   -------------------------------------------------------------------------- */
function changeUserTheme(themeName) {
    document.body.className = '';
    if (themeName !== 'default') document.body.classList.add(`theme-${themeName}`);
    
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    currentUser.theme = themeName;
    localStorage.setItem('T132_CURRENT_USER', JSON.stringify(currentUser));
    
    // Đẩy thông tin người dùng cập nhật lên Firebase Realtime
    if (typeof pushLocalDataToCloud === 'function') {
        pushLocalDataToCloud();
    }

    alert(`🎨 Đã đổi giao diện sang tông màu: ${themeName.toUpperCase()}`);
}

function applySavedTheme() {
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    if (currentUser.theme && currentUser.theme !== 'default') {
        document.body.className = '';
        document.body.classList.add(`theme-${currentUser.theme}`);
    }
}
