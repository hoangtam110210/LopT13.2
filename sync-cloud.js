/* ==========================================================================
   MODULE ĐỒNG BỘ REALTIME T132 HUB (FIREBASE REALTIME DB - CHỐNG MẤT DỮ LIỆU)
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

// Khởi tạo Firebase Realtime Database
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const classDataRef = db.ref('T132_CLASS_DATA');

let isPushingLocal = false;

// Hàm lưu an toàn: Tự dọn bớt dữ liệu cũ nếu máy học sinh bị tràn bộ nhớ LocalStorage
function safeSetItem(key, value) {
    if (value === undefined || value === null) return false;
    let jsonStr = typeof value === 'string' ? value : JSON.stringify(value);

    try {
        localStorage.setItem(key, jsonStr);
        return true;
    } catch (e) {
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
   1. LẮNG NGHE SỰ THAY ĐỔI REALTIME TỪ FIREBASE TỨC THÌ (< 0.2s)
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

    // Đồng bộ đồng loạt các danh mục dữ liệu của lớp
    updateLocalKey('T132_USERS', cloudData.users || []);
    updateLocalKey('T132_LABOR_SCHEDULE', cloudData.laborSchedule || {});
    updateLocalKey('T132_LABOR_DUTY_STATUS', cloudData.laborDutyStatus || {});
    updateLocalKey('T132_LABOR_VIOLATIONS', cloudData.violations || []);
    updateLocalKey('T132_CURRENT_WEEK', cloudData.currentWeek || 1);
    updateLocalKey('T132_TASKS', cloudData.tasks || []);
    updateLocalKey('T132_FUND', cloudData.fund || {});
    updateLocalKey('T132_MEMORIES', cloudData.memories || []);
    updateLocalKey('T132_DOCUMENTS', cloudData.documents || []);
    updateLocalKey('T132_FEEDBACK', cloudData.feedback || []);

    let activeEl = document.activeElement;
    let isEditingText = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');

    if (hasRealChange && !isEditingText) {
        refreshActiveTabUI();
    }
});

/* --------------------------------------------------------------------------
   2. HÀM ĐẨY DỮ LIỆU TỚI MÁY CÁC BẠN KHÁC TRONG 0.1 GIÂY
   -------------------------------------------------------------------------- */
async function pushLocalDataToCloud() {
    isPushingLocal = true;

    let payload = {
        users: JSON.parse(localStorage.getItem('T132_USERS')) || [],
        laborSchedule: JSON.parse(localStorage.getItem('T132_LABOR_SCHEDULE')) || {},
        laborDutyStatus: JSON.parse(localStorage.getItem('T132_LABOR_DUTY_STATUS')) || {},
        violations: JSON.parse(localStorage.getItem('T132_LABOR_VIOLATIONS')) || [],
        currentWeek: parseInt(localStorage.getItem('T132_CURRENT_WEEK')) || 1,
        tasks: JSON.parse(localStorage.getItem('T132_TASKS')) || [],
        fund: JSON.parse(localStorage.getItem('T132_FUND')) || {},
        memories: JSON.parse(localStorage.getItem('T132_MEMORIES')) || [],
        documents: JSON.parse(localStorage.getItem('T132_DOCUMENTS')) || [],
        feedback: JSON.parse(localStorage.getItem('T132_FEEDBACK')) || [],
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
   3. CẬP NHẬT GIAO DIỆN MÀN HÌNH ĐANG MỞ KHI CÓ DỮ LIỆU MỚI TỪ LỚP
   -------------------------------------------------------------------------- */
function refreshActiveTabUI() {
    let activeTab = document.querySelector('.view-section.active');
    if (!activeTab) return;

    let tabId = activeTab.id;
    if (tabId === 'tab-home' && typeof renderDashboardCharts === 'function') renderDashboardCharts();
    if (tabId === 'tab-labor' && typeof renderDisciplineDutyTab === 'function') renderDisciplineDutyTab();
    if (tabId === 'tab-tasks' && typeof renderTasks === 'function') renderTasks();
    if (tabId === 'tab-fund' && typeof renderFundTab === 'function') renderFundTab();
    if (tabId === 'tab-memories') {
        if (typeof renderMemoriesTab === 'function') renderMemoriesTab();
        if (typeof refreshCurrentAlbumModal === 'function') refreshCurrentAlbumModal();
    }
    if (tabId === 'tab-docs') {
        if (typeof renderFeedbackList === 'function') renderFeedbackList();
        if (typeof renderDocumentsList === 'function') renderDocumentsList();
    }
    if (tabId === 'tab-random' && typeof renderRandomModule === 'function') renderRandomModule();
    if (tabId === 'tab-profile' && typeof renderUserProfile === 'function') renderUserProfile();
}

// Tự động đẩy dữ liệu lên Cloud mỗi khi người dùng tương tác nút bấm hoặc lựa chọn
window.addEventListener('load', () => {
    document.addEventListener('click', (e) => {
        let isActionButton = e.target.closest('button') || e.target.closest('input[type="checkbox"]') || e.target.closest('select');
        if (isActionButton) {
            setTimeout(pushLocalDataToCloud, 150);
        }
    });
});
