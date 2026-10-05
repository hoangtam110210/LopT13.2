/* ========================================================
   BẢNG TIN - QUẢN LÝ BÀI ĐĂNG (CHỮ, ÁNH, VIDEO), LIKES, BÌNH LUẬN & XÓA BÀI
   ======================================================== */

// Ảnh đại diện dự phòng an toàn chống ngắt hàm
const SAFE_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%2388c999'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='40'>🍀</text></svg>";

let pendingPostImages = []; // Danh sách mảng ảnh/video chờ đăng

// 1. Đọc từng file ảnh/video đính kèm
function addSinglePostImage(event) {
    let file = event.target.files ? event.target.files[0] : null;
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

// 3. Hiển thị danh sách ảnh/video xem trước
function renderPostImagePreviews() {
    let container = document.getElementById('post-images-preview-box');
    if (!container) return;

    if (!pendingPostImages || pendingPostImages.length === 0) {
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
                <button type="button" onclick="removePendingPostImage(${idx})" style="position:absolute; top:-6px; right:-6px; background:#ff6b6b; color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:10px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center;">✕</button>
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

// 4. ĐĂNG BÀI VIẾT MỚI (CHỐNG LỖI VĂN BẢN VÀ LỖI CÚ PHÁP)
function submitNewPost(e) {
    if (e && e.preventDefault) e.preventDefault();

    try {
        let textInput = document.getElementById('post-text-input');
        let text = textInput ? textInput.value.trim() : "";

        if (!text && (!pendingPostImages || pendingPostImages.length === 0)) {
            alert("⚠️ Vui lòng nhập nội dung văn bản hoặc chọn ít nhất 1 ảnh/video!");
            return;
        }

        let currentUser = {};
        try {
            currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
        } catch(err) {}

        let posts = [];
        try {
            posts = JSON.parse(localStorage.getItem('T132_POSTS')) || [];
        } catch(err) {}

        let authorAvatar = currentUser.avatar || (typeof DEFAULT_AVATAR !== 'undefined' ? DEFAULT_AVATAR : SAFE_AVATAR);
        let authorName = currentUser.name || "Thành viên T132";

        let newPost = {
            id: Date.now(),
            authorName: authorName,
            authorAvatar: authorAvatar,
            text: text,
            media: [...(pendingPostImages || [])],
            time: new Date().toLocaleString('vi-VN'),
            likes: [],
            comments: []
        };

        // Thêm bài viết mới vào đầu danh sách local
        posts.unshift(newPost);
        localStorage.setItem('T132_POSTS', JSON.stringify(posts));

        // Dọn dẹp ô nhập văn bản và ảnh chờ
        pendingPostImages = [];
        renderPostImagePreviews();
        if (textInput) textInput.value = "";

        // Vẽ lại giao diện Bảng tin ngay lập tức
        renderPostsFeed();

        // Đẩy bài mới lên Firebase Cloud Realtime
        if (typeof pushLocalDataToCloud === 'function') {
            pushLocalDataToCloud();
        }

        alert("📤 Đã đăng bài viết thành công!");

    } catch (error) {
        alert("❌ Lỗi khi đăng bài: " + error.message);
        console.error("Lỗi submitNewPost:", error);
    }
}

// 5. HIỂN THỊ DẠNG THẺ BÀI ĐĂNG
function renderPostsFeed() {
    let container = document.getElementById('posts-feed-container');
    if (!container) return;

    let posts = [];
    try {
        posts = JSON.parse(localStorage.getItem('T132_POSTS')) || [];
    } catch(e) {}

    let currentUser = {};
    try {
        currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    } catch(e) {}

    let isAdmin = (typeof isSystemAdmin === 'function') ? isSystemAdmin() : true;

    if (posts.length === 0) {
        container.innerHTML = `<p style="color:#777; text-align:center; font-size:12px; margin-top:14px;">Chưa có bài đăng nào. Hãy là người đầu tiên đăng bài!</p>`;
        return;
    }

    let html = "";
    posts.forEach(p => {
        let isLiked = (p.likes || []).includes(currentUser.name);
        let avatarSrc = p.authorAvatar || SAFE_AVATAR;

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
                        <img src="${avatarSrc}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                        <div>
                            <b style="font-size:13px; color:var(--text-color);">${p.authorName}</b>
                            <small style="display:block; color:#888; font-size:10px;">${p.time}</small>
                        </div>
                    </div>
                    ${(isAdmin || p.authorName === currentUser.name) ? `
                        <button type="button" onclick="deletePostToTrash(${p.id})" class="btn btn-danger" style="font-size:10px; padding:2px 6px;">🗑️ Xoá bài</button>
                    ` : ''}
                </div>

                ${p.text ? `<p style="font-size:13px; color:#333; margin-top:8px;">${p.text}</p>` : ''}
                <div style="margin-top:6px;">${mediaHtml}</div>

                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #eee; border-bottom:1px dashed #eee; padding:6px 0; margin-top:10px;">
                    <button type="button" onclick="toggleLikePost(${p.id})" class="btn" style="background:${isLiked ? '#ffe3e3' : '#f0f0f0'}; color:${isLiked ? '#e03131' : '#555'}; font-size:11px; padding:4px 10px;">
                        ${isLiked ? '❤️ Đã thích' : '🤍 Thích'} (${(p.likes || []).length})
                    </button>
                    <small style="color:#777; font-size:11px;">💬 ${(p.comments || []).length} bình luận</small>
                </div>

                <div style="margin-top:8px;">
                    ${commentsHtml}
                    <div style="display:flex; gap:4px; margin-top:6px;">
                        <input type="text" id="comment-input-${p.id}" class="form-control" placeholder="Viết bình luận..." style="font-size:11px; margin:0;">
                        <button type="button" onclick="addPostComment(${p.id})" class="btn btn-primary" style="font-size:11px; padding:4px 8px;">Gửi</button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// 6. THÍCH BÀI VIẾT
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
        renderPostsFeed();

        if (typeof pushLocalDataToCloud === 'function') {
            pushLocalDataToCloud();
        }
    }
}

// 7. THÊM BÌNH LUẬN
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
            authorName: currentUser.name || "Thành viên",
            text: text,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        });
        localStorage.setItem('T132_POSTS', JSON.stringify(posts));
        input.value = "";
        renderPostsFeed();

        if (typeof pushLocalDataToCloud === 'function') {
            pushLocalDataToCloud();
        }
    }
}

// 8. XÓA BÀI VIẾT
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

        renderPostsFeed();

        if (typeof pushLocalDataToCloud === 'function') {
            pushLocalDataToCloud();
        }

        alert("🗑️ Bài viết đã được chuyển vào Kho bài đã xoá!");
    }
}
