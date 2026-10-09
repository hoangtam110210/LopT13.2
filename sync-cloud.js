/* ==========================================================================
   MODULE ĐỒNG BỘ REALTIME T132 HUB - TỰ ĐỘNG KHÔI PHỤC & BẢO VỆ KỶ NIỆM
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

// 1. LẮNG NGHE DỮ LIỆU CHUNG (Trừ Kỷ niệm)
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

// 2. LẮNG NGHE RIÊNG KỶ NIỆM (CÓ TỰ ĐỘNG KHÔI PHỤC DỮ LIỆU)
classDataRef.child('memories').on('value', (snapshot) => {
    let memoriesObj = snapshot.val();
    let memoriesArr = [];

    if (memoriesObj) {
        if (Array.isArray(memoriesObj)) {
            memoriesArr = memoriesObj.filter(item => item !== null && item !== undefined);
        } else if (typeof memoriesObj === 'object') {
            memoriesArr = Object.values(memoriesObj);
        }
    }

    // Lấy dữ liệu sao lưu cũ trên máy (nếu có)
    let localAlbums = [];
    try {
        localAlbums = JSON.parse(localStorage.getItem('T132_MEMORIES')) || JSON.parse(localStorage.getItem('T132_MEMORIES_BACKUP')) || [];
    } catch (e) {}

    // CƠ CHẾ TỰ KHÔI PHỤC: Nếu Cloud bị rỗng mà trên máy còn dữ liệu -> Tự đẩy khôi phục lại Cloud
    if (memoriesArr.length === 0 && localAlbums.length > 0) {
        console.warn("⚠️ Cloud bị trống Album! Đang tự động khôi phục dữ liệu từ bản sao lưu...");
        localAlbums.forEach(album => {
            if (album && album.id) {
                classDataRef.child('memories').child(album.id).set(album);
            }
        });
        return;
    }

    // Sắp xếp Album mới nhất lên đầu
    memoriesArr.sort((a, b) => (b.id || 0) - (a.id || 0));

    // Lưu vào bộ nhớ chính & Bản sao lưu dự phòng
    if (memoriesArr.length > 0) {
        window['T132_MEMORIES_TEMP'] = memoriesArr;
        try {
            localStorage.setItem('T132_MEMORIES', JSON.stringify(memoriesArr));
            localStorage.setItem('T132_MEMORIES_BACKUP', JSON.stringify(memoriesArr));
        } catch (e) {}
    }

    // Cập nhật giao diện màn hình Kỷ niệm
    let activeTab = document.querySelector('.view-section.active');
    if (activeTab && activeTab.id === 'tab-memories') {
        if (typeof renderMemoriesTab === 'function') renderMemoriesTab();
        if (typeof refreshCurrentAlbumModal === 'function') refreshCurrentAlbumModal();
    }
});

// 3. LƯU HOẶC XÓA TỪNG ALBUM RIÊNG LÊN CLOUD
async function saveAlbumToCloudNode(albumObj) {
    if (!albumObj || !albumObj.id) return;
    try {
        await classDataRef.child('memories').child(albumObj.id).set(albumObj);
        console.log(`✅ [Cloud] Đã lưu Album "${albumObj.title}"!`);
    } catch (err) {
        alert("❌ Lỗi đồng bộ Album: " + err.message);
    }
}

async function removeAlbumFromCloudNode(albumId) {
    if (!albumId) return;
    try {
        await classDataRef.child('memories').child(albumId).remove();
        console.log(`🗑️ [Cloud] Đã xóa Album ID ${albumId}`);
    } catch (err) {
        alert("❌ Lỗi xóa Album: " + err.message);
    }
}

// 4. ĐẨY DỮ LIỆU CHUNG
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
