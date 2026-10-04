/* ========================================================
   TRANG CÁ NHÂN - AVATAR, BIỆT DANH, GIỚI THIỆU & BÀI ĐĂNG ĐÃ THÍCH
   ======================================================== */

function renderUserProfile() {
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};

    let nameInput = document.getElementById('profile-name-input');
    let nicknameInput = document.getElementById('profile-nickname-input');
    let bioInput = document.getElementById('profile-bio-input');
    let avatarPreview = document.getElementById('profile-avatar-preview');

    if (nameInput) nameInput.value = currentUser.name || "";
    if (nicknameInput) nicknameInput.value = currentUser.nickname || "";
    if (bioInput) bioInput.value = currentUser.bio || "";
    if (avatarPreview) avatarPreview.src = currentUser.avatar || DEFAULT_AVATAR;

    renderLikedPostsPrivate();
}

function previewProfileAvatar(event) {
    let file = event.target.files[0];
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

    currentUser.nickname = nicknameInput ? nicknameInput.value.trim() : "";
    currentUser.bio = bioInput ? bioInput.value.trim() : "";
    currentUser.avatar = avatarPreview ? avatarPreview.src : currentUser.avatar;

    // Cập nhật lại vào danh sách users chung
    let u = users.find(x => x.name === currentUser.name);
    if (u) {
        u.nickname = currentUser.nickname;
        u.bio = currentUser.bio;
        u.avatar = currentUser.avatar;
    }

    localStorage.setItem('T132_CURRENT_USER', JSON.stringify(currentUser));
    localStorage.setItem('T132_USERS', JSON.stringify(users));

    alert("💾 Đã lưu thông tin cá nhân thành công!");
    location.reload();
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
