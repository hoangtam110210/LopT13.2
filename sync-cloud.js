/* ==========================================================================
   MODULE ĐỒNG BỘ REALTIME T132 HUB - CHỐNG GHI ĐÈ KỶ NIỆM TRIỆT ĐỂ
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

// 1. LẮNG NGHE TOÀN BỘ DỮ LIỆU CHUNG (Trừ Kỷ niệm)
classDataRef.on('value', (snapshot) => {
    if (isPushingLocal) return;

    let cloudData = snapshot.val();
    if (!cloudData) return;

    function updateLocalKey(key, cloudValue) {
        if (cloudValue === undefined || cloudValue === null) return;
        try {
            localStorage.setItem(key, JSON.stringify(cloudValue));
        } catch (e) {}
    }

    updateLocalKey('T132_USERS', cloudData.users);
    updateLocalKey('T132_LABOR_SCHEDULE', cloudData.laborSchedule);
    updateLocalKey('T132_LABOR_DUTY_STATUS', cloudData.laborDutyStatus);
    updateLocalKey('T132_LABOR_VIOLATIONS', cloudData.violations);
    updateLocalKey('T132_CURRENT_WEEK', cloudData.currentWeek);
    updateLocalKey('T132_TASKS', cloudData.tasks);
    updateLocalKey('T132_FUND', cloudData.fund);
    updateLocalKey('T132_DOCUMENTS', cloudData.documents);
    updateLocalKey('T132_FEEDBACK', cloudData.feedback);

    refreshActiveTabUI();
});

// 2. LẮNG NGHE RIÊNG NHÁNH KỶ NIỆM (Tự động gộp tất cả Album từ mọi tài khoản)
classDataRef.child('memories').on('value', (snapshot) => {
    let memoriesObj = snapshot.val() || {};
    let memoriesArr = [];

    // Chuyển Object từ Firebase thành Array
    if (Array.isArray(memoriesObj)) {
        memoriesArr = memoriesObj.filter(item => item !== null && item !== undefined);
    } else if (typeof memoriesObj === 'object') {
        memoriesArr = Object.values(memoriesObj);
    }

    // Sắp xếp Album mới nhất lên đầu
    memoriesArr.sort((a, b) => (b.id || 0) - (a.id || 0));

    window['T132_MEMORIES_TEMP'] = memoriesArr;
    try {
        localStorage.setItem('T132_MEMORIES', JSON.stringify(memoriesArr));
    } catch (e) {}

    // Vẽ lại giao diện Tab Kỷ niệm ngay lập tức
    let activeTab = document.querySelector('.view-section.active');
    if (activeTab && activeTab.id === 'tab-memories') {
        if (typeof renderMemoriesTab === 'function') renderMemoriesTab();
        if (typeof refreshCurrentAlbumModal === 'function') refreshCurrentAlbumModal();
    }
});

// 3. HÀM CẬP NHẬT TỪNG ALBUM RIÊNG LÊN CLOUD (CHỐNG MẤT DỮ LIỆU)
async function saveAlbumToCloudNode(albumObj) {
    if (!albumObj || !albumObj.id) return;
    try {
        await classDataRef.child('memories').child(albumObj.id).set(albumObj);
        console.log(`✅ [Cloud] Đã lưu Album "${albumObj.title}" lên Firebase!`);
    } catch (err) {
        alert("❌ Lỗi đồng bộ Album: " + err.message);
    }
}

async function removeAlbumFromCloudNode(albumId) {
    if (!albumId) return;
    try {
        await classDataRef.child('memories').child(albumId).remove();
        console.log(`🗑️ [Cloud] Đã xóa Album ID ${albumId} trên Firebase!`);
    } catch (err) {
        alert("❌ Lỗi xóa Album: " + err.message);
    }
}

// 4. ĐẨY DỮ LIỆU CÁC TÍNH NĂNG KHÁC (Không chạm vào nhánh memories)
async function pushLocalDataToCloud() {
    if (isPushingLocal) return;
    isPushingLocal = true;

    try {
        await classDataRef.update({
            users: JSON.parse(localStorage.getItem('T132_USERS')) || [],
            laborSchedule: JSON.parse(localStorage.getItem('T132_LABOR_SCHEDULE')) || {},
            laborDutyStatus: JSON.parse(localStorage.getItem('T132_LABOR_DUTY_STATUS')) || {},
            violations: JSON.parse(localStorage.getItem('T132_LABOR_VIOLATIONS')) || [],
            currentWeek: parseInt(localStorage.getItem('T132_CURRENT_WEEK')) || 1,
            tasks: JSON.parse(localStorage.getItem('T132_TASKS')) || [],
            fund: JSON.parse(localStorage.getItem('T132_FUND')) || {},
            documents: JSON.parse(localStorage.getItem('T132_DOCUMENTS')) || [],
            feedback: JSON.parse(localStorage.getItem('T132_FEEDBACK')) || [],
            lastUpdated: Date.now()
        });
    } catch (e) {
        console.error("❌ Lỗi push cloud:", e);
    } finally {
        setTimeout(() => { isPushingLocal = false; }, 500);
    }
}

function refreshActiveTabUI() {
    let activeTab = document.querySelector('.view-section.active');
    if (!activeTab) return;

    let tabId = activeTab.id;
    if (tabId === 'tab-home' && typeof renderDashboardCharts === 'function') renderDashboardCharts();
    if (tabId === 'tab-labor' && typeof renderDisciplineDutyTab === 'function') renderDisciplineDutyTab();
    if (tabId === 'tab-tasks' && typeof renderTasks === 'function') renderTasks();
    if (tabId === 'tab-fund' && typeof renderFundTab === 'function') renderFundTab();
    if (tabId === 'tab-docs') {
        if (typeof renderFeedbackList === 'function') renderFeedbackList();
        if (typeof renderDocumentsList === 'function') renderDocumentsList();
    }
    if (tabId === 'tab-random' && typeof renderRandomModule === 'function') renderRandomModule();
    if (tabId === 'tab-profile' && typeof renderUserProfile === 'function') renderUserProfile();
}
