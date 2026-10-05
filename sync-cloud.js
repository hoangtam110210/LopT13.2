/* ==========================================================================
   MODULE ĐỒNG BỘ REALTIME CHUẨN (TỰ ĐỘNG GỘP BÀI & DỮ LIỆU - KHÔNG XÓA ĐÈ)
   ========================================================================== */

// Thông số cấu hình Firebase từ dự án t132-hub
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
   2. HÀM ĐẨY DỮ LIỆU THÔNG MINH (ĐỌC CLOUD VỀ TRƯỚC RỒI GỘP THÀNH MỘT)
   -------------------------------------------------------------------------- */
async function pushLocalDataToCloud() {
    isPushingLocal = true;

    try {
        // Lấy dữ liệu mới nhất từ Firebase về trước để chống xóa đè
        let snapshot = await classDataRef.once('value');
        let cloudData = snapshot.val() || {};

        // A. Gộp Bài Viết (Posts)
        let localPosts = JSON.parse(localStorage.getItem('T132_POSTS')) || [];
        let cloudPosts = cloudData.posts || [];
        let mergedPostsMap = {};
        
        [...cloudPosts, ...localPosts].forEach(post => {
            if (post && (post.id || post.time)) {
                let key = post.id || (post.author + '_' + post.time);
                mergedPostsMap[key] = post;
            }
        });
        
        let finalPosts = Object.values(mergedPostsMap).sort((a, b) => (b.time || 0) - (a.time || 0));
        localStorage.setItem('T132_POSTS', JSON.stringify(finalPosts));

        // B. Gộp Vi Phạm Lao Động (Violations)
        let localViolations = JSON.parse(localStorage.getItem('T132_LABOR_VIOLATIONS')) || [];
        let cloudViolations = cloudData.violations || [];
        let mergedViolationsMap = {};
        
        [...cloudViolations, ...localViolations].forEach(v => {
            if (v && (v.id || v.timestamp || v.studentName)) {
                let key = v.id || (v.studentName + '_' + (v.timestamp || v.date));
                mergedViolationsMap[key] = v;
            }
        });
        
        let finalViolations = Object.values(mergedViolationsMap);
        localStorage.setItem('T132_LABOR_VIOLATIONS', JSON.stringify(finalViolations));

        // C. Đóng gói payload đầy đủ gửi lên Firebase
        let payload = {
            posts: finalPosts,
            documents: JSON.parse(localStorage.getItem('T132_DOCUMENTS')) || cloudData.documents || [],
            users: JSON.parse(localStorage.getItem('T132_USERS')) || cloudData.users || [],
            violations: finalViolations,
            laborSchedule: JSON.parse(localStorage.getItem('T132_LABOR_SCHEDULE')) || cloudData.laborSchedule || {},
            laborDutyStatus: JSON.parse(localStorage.getItem('T132_LABOR_DUTY_STATUS')) || cloudData.laborDutyStatus || {},
            tasks: JSON.parse(localStorage.getItem('T132_TASKS')) || cloudData.tasks || [],
            currentWeek: parseInt(localStorage.getItem('T132_CURRENT_WEEK')) || cloudData.currentWeek || 1,
            lastUpdated: Date.now()
        };

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

window.addEventListener('load', () => {
    document.addEventListener('click', (e) => {
        let isActionButton = e.target.closest('button') || e.target.closest('input[type="checkbox"]') || e.target.closest('select');
        if (isActionButton) {
            setTimeout(pushLocalDataToCloud, 400);
        }
    });
});
