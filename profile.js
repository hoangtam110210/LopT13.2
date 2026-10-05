/* ========================================================
   TRANG CÁ NHÂN - AVATAR, BIỆT DANH, GIỚI THIỆU & BÀI ĐĂNG ĐÃ THÍCH
   ======================================================== */

// Avatar mặc định phòng trường hợp DEFAULT_AVATAR chưa kịp nạp
const PROFILE_DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%2388c999'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='40'>🍀</text></svg>";

function renderUserProfile() {
    let currentUser = {};
    try {
        currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    } catch(e) {}

    let nameInput = document.getElementById('profile-name-input');
    let nicknameInput = document.getElementById('profile-nickname-input');
    let bioInput = document.getElementById('profile-bio-input');
    let avatarPreview = document.getElementById('profile-avatar-preview');

    let fallbackAvatar = (typeof DEFAULT_AVATAR !== 'undefined') ? DEFAULT_AVATAR : PROFILE_DEFAULT_AVATAR;

    if (nameInput) nameInput.value = currentUser.name || "";
    if (nicknameInput) nicknameInput.value = currentUser.nickname || "";
    if (bioInput) bioInput.value = currentUser.bio || "";
    if (avatarPreview) avatarPreview.src = currentUser.avatar || fallbackAvatar;

    renderLikedPostsPrivate();
}

function previewProfileAvatar(event) {
    let file = event.target.files ? event.target.files[0] : null;
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            let avatarPreview = document.getElementById('profile-avatar-preview');
            if (avatarPreview) avatarPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function saveUserProfileInfo() {
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    let users = JSON.parse(localStorage.getItem('T132_USERS')) || [];

    let nicknameInput = document.getElementById('profile-nickname-input');
    let bioInput = document.getElementById('profile-bio-input');
    let avatarPreview = document.getElementById('profile-avatar-preview');

    let fallbackAvatar = (typeof DEFAULT_AVATAR !== 'undefined') ? DEFAULT_AVATAR : PROFILE_DEFAULT_AVATAR;

    currentUser.nickname = nicknameInput ? nicknameInput.value.trim() : "";
    currentUser.bio = bioInput ? bioInput.value.trim() : "";
    currentUser.avatar = avatarPreview ? avatarPreview.src : (currentUser.avatar || fallbackAvatar);

    // Cập nhật lại vào danh sách 35 học sinh T132_USERS (Khớp tên linh hoạt)
    users = users.map(u => {
        if (!u || !u.name) return u;
        let isMatch = u.name === currentUser.name || 
                      (currentUser.name && u.name && currentUser.name.includes(u.name)) ||
                      (currentUser.name && u.name && u.name.includes(currentUser.name));

        if (isMatch) {
            u.nickname = currentUser.nickname;
            u.bio = currentUser.bio;
            u.avatar = currentUser.avatar;
        }
        return u;
    });

    localStorage.setItem('T132_CURRENT_USER', JSON.stringify(currentUser));
    localStorage.setItem('T132_USERS', JSON.stringify(users));

    // Cập nhật ngay thông tin trên thanh Header
    if (typeof updateHeaderUserInfo === 'function') {
        updateHeaderUserInfo();
    }

    // Đẩy ngay dữ liệu vừa thay đổi lên Firebase Realtime cho cả lớp
    if (typeof pushLocalDataToCloud === 'function') {
        pushLocalDataToCloud();
    }

    // Làm mới lại tab Random để nhận ngay Avatar mới
    if (typeof renderRandomModule === 'function') {
        renderRandomModule();
    }

    alert("💾 Đã lưu thông tin cá nhân và đồng bộ Avatar thành công!");
}

// Danh sách bài viết đã thích (Riêng tư)
function renderLikedPostsPrivate() {
    let box = document.getElementById('profile-liked-posts-box');
    if (!box) return;

    let posts = JSON.parse(localStorage.getItem('T132_POSTS')) || [];
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};

    let likedPosts = posts.filter(p => (p.likes || []).includes(currentUser.name));

    if (likedPosts.length === 0) {
        box.innerHTML = `<p style="color:#888; font-size:11px;">Bạn chưa thích bài viết nào.</p>`;
        return;
    }

    let html = likedPosts.map(p => `
        <div style="background:#fff; padding:6px 10px; border-radius:8px; margin-bottom:4px; border:1px solid #eee; font-size:12px;">
            <b>${p.authorName}:</b> "${p.text ? p.text.substring(0, 40) + '...' : 'Hình ảnh/Video'}"
        </div>
    `).join('');

    box.innerHTML = html;
}
