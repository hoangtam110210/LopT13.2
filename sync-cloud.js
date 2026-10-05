/* ==========================================================================
   MODULE ĐỒNG BỘ REALTIME T132 HUB (CLOUD-FIRST - CHỐNG TRÀN BỘ NHỚ 100%)
   ========================================================================== */

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

// Hàm lưu an toàn: Tự động dọn bớt dữ liệu cũ nếu bộ nhớ máy nhận bị tràn (QuotaExceededError)
function safeSetItem(key, value) {
    if (value === undefined || value === null) return false;
    let jsonStr = typeof value === 'string' ? value : JSON.stringify(value);

    try {
        localStorage.setItem(key, jsonStr);
        return true;
    } catch (e) {
        // Nếu bộ nhớ máy bị đầy 5MB, tự động cắt bỏ bớt các mục cũ ở cuối để lưu dữ liệu mới nhất
        if (Array.isArray(value)) {
            let truncatedList = [...value];
            while (truncatedList.length > 1) {
                truncatedList.pop();
                try {
                    localStorage.setItem(key, JSON.stringify(truncatedList));
                    return true;
                } catch (err) {}
            }
        }
        return false;
    }
}

/* --------------------------------------------------------------------------
   1. LẮNG NGHE REALTIME TỪ FIREBASE VỀ MÁY CÁ NHÂN TỨC THÌ
   -------------------------------------------------------------------------- */
classDataRef.on('value', (snapshot) => {
    if (isPushingLocal) return;

    let cloudData = snapshot.val();
    if (!cloudData) return;

    let hasRealChange = false;

    function updateLocalKey(key, cloudValue) {
        if (cloudValue === undefined || cloudValue === null) return;
        let currentStr = localStorage.getItem(key) || '';
        let newStr = JSON.stringify(cloudValue);

        if (currentStr !== newStr) {
            let success = safeSetItem(key, cloudValue);
            if (success) hasRealChange = true;
        }
    }

    updateLocalKey('T132_POSTS', cloudData.posts || []);
    updateLocalKey('T132_DOCUMENTS', cloudData.documents || []);
    updateLocalKey('T132_USERS', cloudData.users || []);
    updateLocalKey('T132_LABOR_VIOLATIONS', cloudData.violations || []);
    updateLocalKey('T132_LABOR_SCHEDULE', cloudData.laborSchedule || {});
    updateLocalKey('T132_LABOR_DUTY_STATUS', cloudData.laborDutyStatus || {});
    updateLocalKey('T132_TASKS', cloudData.tasks || []);
    updateLocalKey('T132_CURRENT_WEEK', cloudData.currentWeek || 1);

    let activeEl = document.activeElement;
    let isEditingText = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');

    // Cập nhật ngay giao diện màn hình khi có dữ liệu mới
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
   3. CẬP NHẬT GIAO DIỆN MÀN HÌNH ĐANG MỞ
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
