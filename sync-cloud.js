/* ==========================================================================
   MODULE ĐỒNG BỘ REALTIME T132 HUB (CLOUD-FIRST - TỰ ĐỘNG XÓA RÁC CŨ)
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

/* --------------------------------------------------------------------------
   1. LẮNG NGHE CLOUD & ÉP NẠP TRỰC TIẾP LÊN MÁY LOCAL (TỰ ĐỘNG XÓA BÀI CŨ)
   -------------------------------------------------------------------------- */
classDataRef.on('value', (snapshot) => {
    // Nếu máy này vừa thực hiện thao tác Đăng/Xóa thì tạm bỏ qua nạp ngược
    if (isPushingLocal) return;

    let cloudData = snapshot.val();
    if (!cloudData) return;

    // Ép bộ nhớ máy Local phải hoàn toàn giống 100% với trên Firebase Cloud
    localStorage.setItem('T132_POSTS', JSON.stringify(cloudData.posts || []));
    localStorage.setItem('T132_DOCUMENTS', JSON.stringify(cloudData.documents || []));
    localStorage.setItem('T132_USERS', JSON.stringify(cloudData.users || []));
    localStorage.setItem('T132_LABOR_VIOLATIONS', JSON.stringify(cloudData.violations || []));
    localStorage.setItem('T132_LABOR_SCHEDULE', JSON.stringify(cloudData.laborSchedule || {}));
    localStorage.setItem('T132_LABOR_DUTY_STATUS', JSON.stringify(cloudData.laborDutyStatus || {}));
    localStorage.setItem('T132_TASKS', JSON.stringify(cloudData.tasks || []));
    localStorage.setItem('T132_CURRENT_WEEK', JSON.stringify(cloudData.currentWeek || 1));

    // Kiểm tra nếu người dùng không gõ văn bản thì cập nhật lại giao diện ngay
    let activeEl = document.activeElement;
    let isEditingText = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');

    if (!isEditingText) {
        refreshActiveTabUI();
    }
});

/* --------------------------------------------------------------------------
   2. HÀM ĐẨY DỮ LIỆU LÊN ĐÁM MÂY (CHỈ CHẠY KHI CÓ THAO TÁC RÕ RÀNG)
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
   3. CẬP NHẬT GIAO DIỆN TAB ĐANG MỞ
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
