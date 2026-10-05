/* ========================================================
   BẢNG TIN - ĐỌC ĐƠN LẺ TỪNG ẢNH/VIDEO & ĐĂNG BÀI AN TOÀN
   ======================================================== */

// Khai báo Avatar mặc định an toàn chống đứng hàm đăng bài
const POST_DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%2388c999'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='40'>🍀</text></svg>";

let pendingPostImages = []; // Danh sách mảng ảnh chờ đăng

// 1. Đọc từng file một
function addSinglePostImage(event) {
    let file = event.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = function(e) {
        pendingPostImages.push({
            type: file.type.startsWith('video') ? 'video' : 'image',
            url: e.target.result
        });
        renderPostImagePreviews();
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

// 2. Xóa 1 ảnh xem trước khỏi danh sách chờ
function removePendingPostImage(index) {
    pendingPostImages.splice(index, 1);
    renderPostImagePreviews();
}

// 3. Hiển thị danh sách ảnh/video đã chọn
function renderPostImagePreviews() {
    let container = document.getElementById('post-images-preview-box');
    if (!container) return;

    if (pendingPostImages.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">';
    pendingPostImages.forEach((item, idx) => {
        html += `
            <div style="position:relative; width:75px; height:75px;">
                ${item.type === 'video' ? 
                    `<video src="${item.url}" style="width:100%; height:100%; object-fit:cover; border-radius:8px; border:1px solid var(--border-color);"></video>` : 
                    `<img src="${item.url}" style="width:100%; height:100%; object-fit:cover; border-radius:8px; border:1px solid var(--border-color);">`
                }
                <button onclick="removePendingPostImage(${idx})" style="position:absolute; top:-6px; right:-6px; background:#ff6b6b; color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:10px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center;">✕</button>
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

// 4. Đăng bài viết mới (ĐÃ SỬA LỖI ĐỨNG NÚT)
function submitNewPost() {
    let textInput = document.getElementById('post-text-input');
    let text = textInput ? textInput.value.trim() : "";

    if (!text && pendingPostImages.length === 0) {
        alert("⚠️ Vui lòng nhập nội dung văn bản hoặc chọn ít nhất 1 ảnh/video!");
        return;
    }

    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    let posts = JSON.parse(localStorage.getItem('T132_POSTS')) || [];

    let avatarUrl = currentUser.avatar || (typeof DEFAULT_AVATAR !== 'undefined' ? DEFAULT_AVATAR : POST_DEFAULT_AVATAR);

    let newPost = {
        id: Date.now(),
        authorName: currentUser.name || "Thành viên T132",
        authorAvatar: avatarUrl,
        text: text,
        media: [...pendingPostImages],
        time: new Date().toLocaleString('vi-VN'),
        likes: [],
        comments: []
    };

    posts.unshift(newPost);
    localStorage.setItem('T132_POSTS', JSON.stringify(posts));

    // Đẩy ngay lên Firebase Cloud
    if (typeof pushLocalDataToCloud === 'function') {
        pushLocalDataToCloud();
    }

    alert("📤 Đã đăng bài viết thành công!");

    pendingPostImages = [];
    renderPostImagePreviews();
    if (textInput) textInput.value = "";
    renderPostsFeed();
}

// 5. Hiển thị Bảng tin
function renderPostsFeed() {
    let container = document.getElementById('posts-feed-container');
    if (!container) return;

    let posts = JSON.parse(localStorage.getItem('T132_POSTS')) || [];
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    let isAdmin = (typeof isSystemAdmin === 'function') ? isSystemAdmin() : true;

    if (posts.length === 0) {
        container.innerHTML = `<p style="color:#777; text-align:center; font-size:12px; margin-top:14px;">Chưa có bài đăng nào. Hãy là người đầu tiên đăng bài!</p>`;
        return;
    }

    let html = "";
    posts.forEach(p => {
        let isLiked = (p.likes || []).includes(currentUser.name);
        let authorImg = p.authorAvatar || (typeof DEFAULT_AVATAR !== 'undefined' ? DEFAULT_AVATAR : POST_DEFAULT_AVATAR);

        let mediaHtml = (p.media || []).map(m => {
            if (m.type === 'video') {
                return `<video src="${m.url}" controls style="width:100%; max-height:220px; border-radius:12px; margin-top:6px;"></video>`;
            } else {
                return `<img src="${m.url}" style="width:100%; max-height:250px; object-fit:cover; border-radius:12px; margin-top:6px;">`;
            }
        }).join('');

        let commentsHtml = (p.comments || []).map(c => `
            <div style="background:#f8f9fa; padding:6px 10px; border-radius:10px; margin-top:4px; font-size:11px;">
                <b>${c.authorName}:</b> ${c.text}
                <small style="color:#888; display:block; margin-top:2px;">${c.time}</small>
            </div>
        `).join('');

        html += `
            <div class="card" style="margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <img src="${authorImg}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                        <div>
                            <b style="font-size:13px; color:var(--text-color);">${p.authorName}</b>
                            <small style="display:block; color:#888; font-size:10px;">${p.time}</small>
                        </div>
                    </div>
                    ${(isAdmin || p.authorName === currentUser.name) ? `
                        <button onclick="deletePostToTrash(${p.id})" class="btn btn-danger" style="font-size:10px; padding:2px 6px;">🗑️ Xoá bài</button>
                    ` : ''}
                </div>

                ${p.text ? `<p style="font-size:13px; color:#333; margin-top:8px;">${p.text}</p>` : ''}
                <div style="margin-top:6px;">${mediaHtml}</div>

                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #eee; border-bottom:1px dashed #eee; padding:6px 0; margin-top:10px;">
                    <button onclick="toggleLikePost(${p.id})" class="btn" style="background:${isLiked ? '#ffe3e3' : '#f0f0f0'}; color:${isLiked ? '#e03131' : '#555'}; font-size:11px; padding:4px 10px;">
                        ${isLiked ? '❤️ Đã thích' : '🤍 Thích'} (${(p.likes || []).length})
                    </button>
                    <small style="color:#777; font-size:11px;">💬 ${(p.comments || []).length} bình luận</small>
                </div>

                <div style="margin-top:8px;">
                    ${commentsHtml}
                    <div style="display:flex; gap:4px; margin-top:6px;">
                        <input type="text" id="comment-input-${p.id}" class="form-control" placeholder="Viết bình luận..." style="font-size:11px; margin:0;">
                        <button onclick="addPostComment(${p.id})" class="btn btn-primary" style="font-size:11px; padding:4px 8px;">Gửi</button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// 6. Thích bài viết
function toggleLikePost(postId) {
    let posts = JSON.parse(localStorage.getItem('T132_POSTS')) || [];
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    let p = posts.find(x => x.id === postId || x.id == postId);

    if (p) {
        if (!p.likes) p.likes = [];
        let idx = p.likes.indexOf(currentUser.name);
        if (idx > -1) {
            p.likes.splice(idx, 1);
        } else {
            p.likes.push(currentUser.name);
        }
        localStorage.setItem('T132_POSTS', JSON.stringify(posts));

        if (typeof pushLocalDataToCloud === 'function') {
            pushLocalDataToCloud();
        }

        renderPostsFeed();
    }
}

// 7. Thêm bình luận
function addPostComment(postId) {
    let input = document.getElementById(`comment-input-${postId}`);
    let text = input ? input.value.trim() : "";
    if (!text) return;

    let posts = JSON.parse(localStorage.getItem('T132_POSTS')) || [];
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    let p = posts.find(x => x.id === postId || x.id == postId);

    if (p) {
        if (!p.comments) p.comments = [];
        p.comments.push({
            authorName: currentUser.name,
            text: text,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        });
        localStorage.setItem('T132_POSTS', JSON.stringify(posts));

        if (typeof pushLocalDataToCloud === 'function') {
            pushLocalDataToCloud();
        }

        input.value = "";
        renderPostsFeed();
    }
}

// 8. Xoá bài viết
function deletePostToTrash(postId) {
    if (!confirm("Bạn có chắc muốn xoá bài viết này?")) return;

    let posts = JSON.parse(localStorage.getItem('T132_POSTS')) || [];
    let deletedPosts = JSON.parse(localStorage.getItem('T132_DELETED_POSTS')) || [];

    let idx = posts.findIndex(p => p.id === postId || p.id == postId);
    if (idx > -1) {
        deletedPosts.unshift(posts[idx]);
        posts.splice(idx, 1);

        localStorage.setItem('T132_POSTS', JSON.stringify(posts));
        localStorage.setItem('T132_DELETED_POSTS', JSON.stringify(deletedPosts));

        if (typeof pushLocalDataToCloud === 'function') {
            pushLocalDataToCloud();
        }

        alert("🗑️ Bài viết đã được chuyển vào Kho bài đã xoá!");
        renderPostsFeed();
    }
}
=========================
   MODULE ĐỒNG BỘ REALTIME CHUẨN FIREBASE
   ========================================================================== */

const APP_VERSION = "v12_clean"; // Tự làm sạch dữ liệu rác cũ khi lên v12

if (localStorage.getItem('T132_VERSION_TAG') !== APP_VERSION) {
    localStorage.removeItem('T132_POSTS');
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
