/* ==========================================================================
   MODULE ALBUM KỶ NIỆM - TẢI & NÉN ẢNH AN TOÀN CHỐNG TRÀN BỘ NHỚ
   ========================================================================== */

let pendingAlbumImages = [];

// Hàm nén ảnh tự động bằng Canvas (Chống tràn bộ nhớ LocalStorage 5MB)
function compressImage(file, maxWidth, quality, callback) {
    if (!file) {
        callback("");
        return;
    }
    let reader = new FileReader();
    reader.onload = function(e) {
        let img = new Image();
        img.onload = function() {
            let canvas = document.createElement('canvas');
            let w = img.width;
            let h = img.height;

            if (w > maxWidth) {
                h = Math.round((h * maxWidth) / w);
                w = maxWidth;
            }

            canvas.width = w;
            canvas.height = h;

            let ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);

            let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            callback(compressedDataUrl);
        };
        img.onerror = function() { callback(""); };
        img.src = e.target.result;
    };
    reader.onerror = function() { callback(""); };
    reader.readAsDataURL(file);
}

// Kiểm tra quyền Ban Cán Sự an toàn
function isBCSMemberSafe() {
    if (typeof isBCSMember === 'function') return isBCSMember();
    if (typeof isSystemAdmin === 'function') return isSystemAdmin();
    return false;
}

function renderMemoriesTab() {
    let container = document.getElementById('memories-album-grid');
    if (!container) return;

    let albums = JSON.parse(localStorage.getItem('T132_MEMORIES')) || [];
    let isBCS = isBCSMemberSafe();
    let defaultAvatar = typeof DEFAULT_AVATAR !== 'undefined' ? DEFAULT_AVATAR : '';

    let html = albums.map(a => `
        <div class="card" style="margin-bottom:12px;">
            <img src="${a.cover || defaultAvatar}" style="width:100%; height:160px; object-fit:cover; border-radius:12px; background:#e2e8f0;">
            <h4 style="margin-top:8px; color:var(--text-color);">📸 ${a.title}</h4>
            <small style="color:#777;">📅 Ngày tạo: ${a.date} | (${(a.photos || []).length} ảnh)</small>

            <div style="margin-top:8px; display:flex; gap:6px;">
                <button type="button" onclick="viewAlbumPhotos(${a.id})" class="btn btn-primary" style="font-size:11px; flex:1;">🔍 Xem & Tải Ảnh Vô Album</button>
                ${isBCS ? `<button type="button" onclick="deleteAlbumToRecycle(${a.id})" class="btn btn-danger" style="font-size:11px;">🗑️ Xoá</button>` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = html || "<p style='color:#777; font-size:12px;'>Chưa có Album kỷ niệm nào. Hãy điền tên và tạo Album đầu tiên!</p>";
}

// 1. Tạo Album mới (Có nén ảnh bìa)
function createNewAlbum() {
    let titleInput = document.getElementById('album-title-input');
    let dateInput = document.getElementById('album-date-input');
    let fileInput = document.getElementById('album-cover-file');

    let title = titleInput ? titleInput.value.trim() : "";
    let date = dateInput ? dateInput.value : "";
    let file = fileInput && fileInput.files[0];

    if (!title) {
        alert("⚠️ Vui lòng nhập Tên Album kỷ niệm!");
        return;
    }

    let albums = JSON.parse(localStorage.getItem('T132_MEMORIES')) || [];

    if (file) {
        // Nén ảnh bìa xuống tối đa 600px để tiết kiệm bộ nhớ
        compressImage(file, 600, 0.6, function(compressedCover) {
            saveAlbumToStorage(albums, title, date, compressedCover);
        });
    } else {
        saveAlbumToStorage(albums, title, date, "");
    }
}

function saveAlbumToStorage(albums, title, date, coverData) {
    albums.unshift({
        id: Date.now(),
        title: title,
        date: date || new Date().toLocaleDateString('vi-VN'),
        cover: coverData,
        photos: []
    });

    try {
        localStorage.setItem('T132_MEMORIES', JSON.stringify(albums));
        alert("✨ Đã tạo Album kỷ niệm mới thành công!");

        if (document.getElementById('album-title-input')) document.getElementById('album-title-input').value = "";
        if (document.getElementById('album-cover-file')) document.getElementById('album-cover-file').value = "";
        
        renderMemoriesTab();
        if (typeof pushLocalDataToCloud === 'function') pushLocalDataToCloud();
    } catch (e) {
        alert("⚠️ Bộ nhớ trình duyệt đã đầy! Vui lòng xoá bớt Album cũ.");
    }
}

// 2. Mở Modal Album
function viewAlbumPhotos(albumId) {
    let albums = JSON.parse(localStorage.getItem('T132_MEMORIES')) || [];
    let album = albums.find(a => a.id === albumId);
    if (!album) return;

    pendingAlbumImages = [];

    let modal = document.getElementById('album-detail-modal');
    if (!modal) return;

    renderAlbumDetailModalContent(album);
    modal.style.display = 'block';
}

function renderAlbumDetailModalContent(album) {
    let content = document.getElementById('album-detail-content');
    if (!content) return;

    let photosHtml = (album.photos || []).map((img) => `
        <div style="position:relative; display:inline-block; margin:4px;">
            <img src="${img}" style="width:85px; height:85px; object-fit:cover; border-radius:8px; border:1px solid #ccc;">
        </div>
    `).join('');

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px dashed var(--border-color); padding-bottom:8px; margin-bottom:10px;">
            <h3 style="color:var(--text-color); margin:0;">📸 ${album.title}</h3>
            <button type="button" onclick="document.getElementById('album-detail-modal').style.display='none'" class="btn btn-danger" style="padding:4px 8px; font-size:11px;">✕ Đóng</button>
        </div>

        <p style="font-size:12px; color:#555;">📅 Ngày tạo: ${album.date}</p>

        <div style="margin-top:10px; background:#fafafa; padding:10px; border-radius:12px; border:1px dashed var(--border-color);">
            <label style="font-size:12px; font-weight:bold; color:var(--text-color);">➕ Chọn từng ảnh để thêm vào Album này:</label>
            <input type="file" accept="image/*" onchange="addSingleAlbumImage(event, ${album.id})" class="form-control" style="font-size:11px; margin-top:4px;">
            
            <div id="album-photos-preview-box" style="margin-top:6px;"></div>

            <button type="button" onclick="uploadPhotosToAlbum(${album.id})" class="btn btn-primary btn-block" style="margin-top:8px; font-size:11px;">📤 Đăng (${pendingAlbumImages.length}) Ảnh Vào Album</button>
        </div>

        <h4 style="margin-top:14px; color:var(--text-color);">🖼️ Danh Sách Ảnh Trong Album (${(album.photos || []).length} ảnh):</h4>
        <div style="margin-top:8px; max-height:220px; overflow-y:auto;">
            ${photosHtml || "<p style='color:#888; font-size:12px;'>Album này chưa có ảnh. Hãy chọn ảnh phía trên để thêm!</p>"}
        </div>
    `;

    renderAlbumPhotosPreview(album.id);
}

// 3. Chọn từng ảnh một cho Album (Có nén tự động)
function addSingleAlbumImage(event, albumId) {
    let file = event.target.files[0];
    if (!file) return;

    // Nén ảnh chi tiết trong album xuống tối đa 700px
    compressImage(file, 700, 0.65, function(compressedImg) {
        if (compressedImg) {
            pendingAlbumImages.push(compressedImg);
            let albums = JSON.parse(localStorage.getItem('T132_MEMORIES')) || [];
            let album = albums.find(a => a.id === albumId);
            if (album) renderAlbumDetailModalContent(album);
        }
    });

    event.target.value = '';
}

function removePendingAlbumImage(index, albumId) {
    pendingAlbumImages.splice(index, 1);
    let albums = JSON.parse(localStorage.getItem('T132_MEMORIES')) || [];
    let album = albums.find(a => a.id === albumId);
    if (album) renderAlbumDetailModalContent(album);
}

function renderAlbumPhotosPreview(albumId) {
    let container = document.getElementById('album-photos-preview-box');
    if (!container) return;

    if (pendingAlbumImages.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '<div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">';
    pendingAlbumImages.forEach((img, idx) => {
        html += `
            <div style="position:relative; width:60px; height:60px;">
                <img src="${img}" style="width:100%; height:100%; object-fit:cover; border-radius:6px; border:1px solid var(--border-color);">
                <button type="button" onclick="removePendingAlbumImage(${idx}, ${albumId})" style="position:absolute; top:-4px; right:-4px; background:#ff6b6b; color:#fff; border:none; border-radius:50%; width:18px; height:18px; font-size:9px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center;">✕</button>
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

// 4. Lưu danh sách ảnh vào Album
function uploadPhotosToAlbum(albumId) {
    if (pendingAlbumImages.length === 0) {
        alert("⚠️ Vui lòng chọn ít nhất 1 hình ảnh!");
        return;
    }

    let albums = JSON.parse(localStorage.getItem('T132_MEMORIES')) || [];
    let album = albums.find(a => a.id === albumId);
    if (!album) return;

    if (!album.photos) album.photos = [];
    album.photos.unshift(...pendingAlbumImages);

    try {
        localStorage.setItem('T132_MEMORIES', JSON.stringify(albums));
        alert(`📸 Đã tải thêm ${pendingAlbumImages.length} ảnh vào Album thành công!`);

        pendingAlbumImages = [];
        viewAlbumPhotos(albumId);
        renderMemoriesTab();
        if (typeof pushLocalDataToCloud === 'function') pushLocalDataToCloud();
    } catch (e) {
        alert("⚠️ Bộ nhớ trình duyệt đã đầy! Hãy nén bớt hoặc xóa bớt ảnh cũ.");
    }
}

function deleteAlbumToRecycle(albumId) {
    if (!confirm("Bạn có chắc chắn muốn xoá Album này?")) return;
    let albums = JSON.parse(localStorage.getItem('T132_MEMORIES')) || [];
    albums = albums.filter(a => a.id !== albumId);
    
    try {
        localStorage.setItem('T132_MEMORIES', JSON.stringify(albums));
        renderMemoriesTab();
        if (typeof pushLocalDataToCloud === 'function') pushLocalDataToCloud();
    } catch (e) {}
}
