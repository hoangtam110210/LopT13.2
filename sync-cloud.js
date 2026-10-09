/* ==========================================================================
   MODULE ĐỒNG BỘ REALTIME CHỐNG GHI ĐÈ & HỖ TRỢ ẢNH FULL HD (SYNC-CLOUD.JS)
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

// 1. LẮNG NGHE DỮ LIỆU TỪ CLOUD VỀ MÁY
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
            } catch (e) {
                // Nếu LocalStorage máy bị đầy ảnh HD, vẫn giữ dữ liệu trong bộ nhớ đệm
                window[key + '_TEMP'] = cloudValue;
            }
            hasRealChange = true;
        }
    }

    updateLocalKey('T132_USERS', cloudData.users);
    updateLocalKey('T132_LABOR_SCHEDULE', cloudData.laborSchedule);
    updateLocalKey('T132_LABOR_DUTY_STATUS', cloudData.laborDutyStatus);
    updateLocalKey('T132_LABOR_VIOLATIONS', cloudData.violations);
    updateLocalKey('T132_CURRENT_WEEK', cloudData.currentWeek);
    updateLocalKey('T132_TASKS', cloudData.tasks);
    updateLocalKey('T132_FUND', cloudData.fund);
    updateLocalKey('T132_MEMORIES', cloudData.memories); // Album Kỷ niệm
    updateLocalKey('T132_DOCUMENTS', cloudData.documents);
    updateLocalKey('T132_FEEDBACK', cloudData.feedback);

    if (hasRealChange) {
        refreshActiveTabUI();
    }
});

// 2. HÀM ĐẨY RIÊNG ALBUM KỶ NIỆM THẲNG LÊN FIREBASE (KHÔNG PHỤ THUỘ LOCALSTORAGE)
async function syncMemoriesDirectlyToCloud(memoriesData) {
    isPushingLocal = true;
    try {
        await classDataRef.child('memories').set(memoriesData);
        console.log("✅ [Firebase] Đã đồng bộ Album Kỷ niệm thành công!");
    } catch (err) {
        alert("❌ Lỗi đồng bộ Firebase: " + err.message);
    } finally {
        setTimeout(() => { isPushingLocal = false; }, 600);
    }
}

// 3. ĐẨY DỮ LIỆU TỔNG THỂ
async function pushLocalDataToCloud() {
    if (isPushingLocal) return;
    isPushingLocal = true;

    try {
        let memoriesData = JSON.parse(localStorage.getItem('T132_MEMORIES')) || window['T132_MEMORIES_TEMP'] || [];

        await classDataRef.update({
            users: JSON.parse(localStorage.getItem('T132_USERS')) || [],
            laborSchedule: JSON.parse(localStorage.getItem('T132_LABOR_SCHEDULE')) || {},
            laborDutyStatus: JSON.parse(localStorage.getItem('T132_LABOR_DUTY_STATUS')) || {},
            violations: JSON.parse(localStorage.getItem('T132_LABOR_VIOLATIONS')) || [],
            currentWeek: parseInt(localStorage.getItem('T132_CURRENT_WEEK')) || 1,
            tasks: JSON.parse(localStorage.getItem('T132_TASKS')) || [],
            fund: JSON.parse(localStorage.getItem('T132_FUND')) || {},
            memories: memoriesData,
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
