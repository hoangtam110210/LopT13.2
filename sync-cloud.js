/* ==========================================================================
   MODULE ĐỒNG BỘ REALTIME CHUẨN FACEBOOK / TIKTOK (FIREBASE REALTIME DB)
   ========================================================================== */

// Thông số cấu hình Firebase từ dự án t132-hub của bạn
const firebaseConfig = {
  apiKey: "AIzaSyD7MXRkTbqn-QqLjMSi9BkVkOlDaYsvbP8",
  authDomain: "t132-hub.firebaseapp.com",
  databaseURL: "https://t132-hub-default-rtdb.firebaseio.com",
  projectId: "t132-hub",
  storageBucket: "t132-hub.firebasestorage.app",
  messagingSenderId: "247212478029",
  appId: "1:247212478029:web:27b3e97fbf93208ef61604"
};

// Khởi tạo Firebase Realtime Database
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const classDataRef = db.ref('T132_CLASS_DATA');

let isPushingLocal = false;

/* --------------------------------------------------------------------------
   1. LẮNG NGHE SỰ THAY ĐỔI THEO THỜI GIAN THỰC (< 0.2 GIÂY)
   -------------------------------------------------------------------------- */
classDataRef.on('value', (snapshot) => {
    let cloudData = snapshot.val();
    if (!cloudData) return;

    if (isPushingLocal) return;

    let hasRealChange = false;

    function updateLocalIfChanged(key, cloudValue) {
        if (cloudValue === undefined || cloudValue === null) return;
        let currentStr = localStorage.getItem(key) || '';
        let newStr = JSON.stringify(cloudValue);

        if (currentStr !== newStr) {
            localStorage.setItem(key, newStr);
            hasRealChange = true;
        }
    }

    updateLocalIfChanged('T132_POSTS', cloudData.posts);
    updateLocalIfChanged('T132_DOCUMENTS', cloudData.documents);
    updateLocalIfChanged('T132_USERS', cloudData.users);
    updateLocalIfChanged('T132_LABOR_VIOLATIONS', cloudData.violations);
    updateLocalIfChanged('T132_LABOR_SCHEDULE', cloudData.laborSchedule);
    updateLocalIfChanged('T132_LABOR_DUTY_STATUS', cloudData.laborDutyStatus);
    updateLocalIfChanged('T132_TASKS', cloudData.tasks);
    updateLocalIfChanged('T132_CURRENT_WEEK', cloudData.currentWeek);

    let activeEl = document.activeElement;
    let isEditingText = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');

    if (hasRealChange && !isEditingText) {
        refreshActiveTabUI();
    }
});

/* --------------------------------------------------------------------------
   2. ĐẨY DỮ LIỆU TỚI BẮT KỲ MÁY NÀO KHÁC TRONG 0.1 GIÂY
   -------------------------------------------------------------------------- */
async function pushLocalDataToCloud() {
    isPushingLocal = true;

    let payload = {
        posts: JSON.parse(localStorage.getItem('T132_POSTS')) || [],
        documents: JSON.parse(localStorage.getItem('T132_DOCUMENTS')) || [],
        users: JSON.parse(localStorage.getItem('T132_USERS')) || [],
        violations: JSON.parse(localStorage.getItem('T132_LABOR_VIOLATIONS')) || [],
        laborSchedule: JSON.parse(localStorage.getItem('T132_LABOR_SCHEDULE')) || {},
        laborDutyStatus: JSON.parse(localStorage.getItem('T132_LABOR_DUTY_STATUS')) || {},
        tasks: JSON.parse(localStorage.getItem('T132_TASKS')) || [],
        currentWeek: parseInt(localStorage.getItem('T132_CURRENT_WEEK')) || 1,
        lastUpdated: Date.now()
    };

    try {
        await classDataRef.set(payload);
    } catch (e) {
        console.error("Lỗi đồng bộ Realtime:", e);
    } finally {
        setTimeout(() => { isPushingLocal = false; }, 300);
    }
}

/* --------------------------------------------------------------------------
   3. CẬP NHẬT GIAO DIỆN MÀN HÌNH ĐANG MỞ
   -------------------------------------------------------------------------- */
function refreshActiveTabUI() {
    let activeTab = document.querySelector('.view-section.active');
    if (!activeTab) return;

    let tabId = activeTab.id;
    if (tabId === 'tab-posts' && typeof renderPostsFeed === 'function') renderPostsFeed();
    if (tabId === 'tab-docs' && typeof renderDocumentsList === 'function') renderDocumentsList();
    if (tabId === 'tab-labor' && typeof renderDisciplineDutyTab === 'function') renderDisciplineDutyTab();
    if (tabId === 'tab-random' && typeof renderRandomModule === 'function') renderRandomModule();
    if (tabId === 'tab-tasks' && typeof renderTasks === 'function') renderTasks();
    if (tabId === 'tab-home' && typeof renderDashboardCharts === 'function') renderDashboardCharts();
}

window.addEventListener('load', () => {
    document.addEventListener('click', (e) => {
        let isActionButton = e.target.closest('button') || e.target.closest('input[type="checkbox"]') || e.target.closest('select');
        if (isActionButton) {
            setTimeout(pushLocalDataToCloud, 100);
        }
    });
});
