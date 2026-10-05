/* ==========================================================================
   MODULE ĐỒNG BỘ REALTIME CHUẨN FIREBASE (TỰ ĐỘNG RESET BỘ NHỚ RÁC V11)
   ========================================================================== */

const APP_VERSION = "v11_clean"; // Mã phiên bản làm sạch dữ liệu

// Tự động dọn dẹp bộ nhớ cũ trên máy học sinh khi lên phiên bản mới
if (localStorage.getItem('T132_VERSION_TAG') !== APP_VERSION) {
    localStorage.removeItem('T132_POSTS');
    localStorage.removeItem('T132_USERS');
    localStorage.removeItem('T132_LABOR_VIOLATIONS');
    localStorage.setItem('T132_VERSION_TAG', APP_VERSION);
}

const firebaseConfig = {
  apiKey: "AIzaSyD7MXRkTbqn-QqLjMSi9BkVkOlDaYsvbP8",
  authDomain: "t132-hub.firebaseapp.com",
  databaseURL: "https://t132-hub-default-rtdb.firebaseio.com",
  projectId: "t132-hub",
  storageBucket: "t132-hub.firebasestorage.app",
  messagingSenderId: "247212478029",
  appId: "1:247212478029:web:27b3e97fbf93208ef61604"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const classDataRef = db.ref('T132_CLASS_DATA');

let isPushingLocal = false;

/* --------------------------------------------------------------------------
   1. LẮNG NGHE REALTIME TỪ FIREBASE VỀ MÁY CÁ NHÂN
   -------------------------------------------------------------------------- */
classDataRef.on('value', (snapshot) => {
    if (isPushingLocal) return;

    let cloudData = snapshot.val();
    if (!cloudData) return;

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

    updateLocalIfChanged('T132_POSTS', cloudData.posts || []);
    updateLocalIfChanged('T132_DOCUMENTS', cloudData.documents || []);
    updateLocalIfChanged('T132_USERS', cloudData.users || []);
    updateLocalIfChanged('T132_LABOR_VIOLATIONS', cloudData.violations || []);
    updateLocalIfChanged('T132_LABOR_SCHEDULE', cloudData.laborSchedule || {});
    updateLocalIfChanged('T132_LABOR_DUTY_STATUS', cloudData.laborDutyStatus || {});
    updateLocalIfChanged('T132_TASKS', cloudData.tasks || []);
    updateLocalIfChanged('T132_CURRENT_WEEK', cloudData.currentWeek || 1);

    let activeEl = document.activeElement;
    let isEditingText = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');

    if (hasRealChange && !isEditingText) {
        refreshActiveTabUI();
    }
});

/* --------------------------------------------------------------------------
   2. HÀM ĐẨY DỮ LIỆU LÊN ĐÁM MÂY CHÍNH XÁC
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
        setTimeout(() => { isPushingLocal = false; }, 400);
    }
}

/* --------------------------------------------------------------------------
   3. CẬP NHẬT GIAO DIỆN HIỆN TẠI
   -------------------------------------------------------------------------- */
function refreshActiveTabUI() {
    let activeTab = document.querySelector('.view-section.active');
    if (!activeTab) return;

    let tabId = activeTab.id;
    if (tabId === 'tab-posts') {
        if (typeof renderPostsFeed === 'function') renderPostsFeed();
        else if (typeof renderPosts === 'function') renderPosts();
    }
    if (tabId === 'tab-docs' && typeof renderDocumentsList === 'function') renderDocumentsList();
    if (tabId === 'tab-labor' && typeof renderDisciplineDutyTab === 'function') renderDisciplineDutyTab();
    if (tabId === 'tab-random' && typeof renderRandomModule === 'function') renderRandomModule();
    if (tabId === 'tab-tasks' && typeof renderTasks === 'function') renderTasks();
    if (tabId === 'tab-home' && typeof renderDashboardCharts === 'function') renderDashboardCharts();
}
