/* ==========================================================================
   MODULE ĐỒNG BỘ REALTIME CHỐNG GHI ĐÈ DỮ LIỆU T132 HUB
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

// 1. LẮNG NGHE ĐỒNG BỘ REALTIME TỪ CLOUD VỀ MÁY
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
            try {
                localStorage.setItem(key, newStr);
                hasRealChange = true;
            } catch (e) {
                console.warn("Bộ nhớ máy đầy khi lưu key:", key);
            }
        }
    }

    // Cập nhật từng mục độc lập
    updateLocalKey('T132_USERS', cloudData.users);
    updateLocalKey('T132_LABOR_SCHEDULE', cloudData.laborSchedule);
    updateLocalKey('T132_LABOR_DUTY_STATUS', cloudData.laborDutyStatus);
    updateLocalKey('T132_LABOR_VIOLATIONS', cloudData.violations);
    updateLocalKey('T132_CURRENT_WEEK', cloudData.currentWeek);
    updateLocalKey('T132_TASKS', cloudData.tasks);
    updateLocalKey('T132_FUND', cloudData.fund);
    updateLocalKey('T132_MEMORIES', cloudData.memories); // Album kỷ niệm
    updateLocalKey('T132_DOCUMENTS', cloudData.documents);
    updateLocalKey('T132_FEEDBACK', cloudData.feedback);

    let activeEl = document.activeElement;
    let isEditingText = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');

    if (hasRealChange && !isEditingText) {
        refreshActiveTabUI();
    }
});

// 2. ĐẨY DỮ LIỆU ĐỘC LẬP TỪNG MỤC LÊN CLOUD (CHỐNG MẤT ALBUM)
async function pushLocalDataToCloud() {
    if (isPushingLocal) return;
    isPushingLocal = true;

    try {
        let memoriesData = JSON.parse(localStorage.getItem('T132_MEMORIES')) || [];
        
        // Đẩy riêng Kỷ niệm lên Firebase node 'memories'
        if (memoriesData.length > 0) {
            await classDataRef.child('memories').set(memoriesData);
        }

        // Đẩy các danh mục còn lại
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

        console.log("✅ Đã đồng bộ Realtime thành công lên Firebase!");
    } catch (e) {
        console.error("❌ Lỗi đồng bộ Realtime Firebase:", e);
    } finally {
        setTimeout(() => { isPushingLocal = false; }, 500);
    }
}

// 3. CẬP NHẬT GIAO DIỆN KHI CÓ BẠN HỌC ĐĂNG ẢNH MỚI
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
