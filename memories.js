/* ==========================================================================
   MODULE ALBUM KỶ NIỆM - TẢI ẢNH NÉT HD & ĐỒNG BỘ NODE ĐỘC LẬP CHỐNG MẤT
   ========================================================================== */

let pendingAlbumImages = [];
let currentOpeningAlbumId = null;

function processHighQualityImage(file, callback) {
    if (!file) { callback(""); return; }

    if (file.size <= 800 * 1024) {
        let reader = new FileReader();
        reader.onload = function(e) { callback(e.target.result); };
        reader.onerror = function() { callback(""); };
        reader.readAsDataURL(file);
        return;
    }

    let reader = new FileReader();
    reader.onload = function(e) {
        let img = new Image();
        img.onload = function() {
            let canvas = document.createElement('canvas');
            let maxWidth = 1920;
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

            let highQualityDataUrl = canvas.toDataURL('image/jpeg', 0.88);
            callback(highQualityDataUrl);
        };
        img.onerror = function() { callback(""); };
        img.src = e.target.result;
    };
    reader.onerror = function() { callback(""); };
    reader.readAsDataURL(file);
}

function getStoredAlbums() {
    try {
        let albums = JSON.parse(localStorage.getItem('T132_MEMORIES')) || 
                     JSON.parse(localStorage.getItem('T132_MEMORIES_BACKUP')) || 
                     window['T132_MEMORIES_TEMP'] || [];
        return albums;
    } catch(e) {
        return window['T132_MEMORIES_TEMP'] || [];
    }
}

function isBCSMemberSafe() {
    if (typeof isBCSMember === 'function') return isBCSMember();
    if (typeof isSystemAdmin === 'function') return isSystemAdmin();
    return false;
}

function downloadAlbumPhoto(dataUrl, filename) {
    if (!dataUrl) return;
    let a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename || `Anh_Ky_Niem_T132_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function renderMemoriesTab() {
    let container = document.getElementById('memories-album-grid');
    if (!container) return;

    let albums = getStoredAlbums();
    let isBCS = isBCSMemberSafe();
    let defaultAvatar = typeof DEFAULT_AVATAR !== 'undefined' ? DEFAULT_AVATAR : '';

    let html = albums.map(a => `
        <div class="card" style="margin-bottom:12px;">
            <img src="${a.cover || defaultAvatar}" style="width:100%; height:180px; object-fit:cover; border-radius:12px; background:#e2e8f0;">
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

// 1. Tạo Album mới
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

    if (file) {
        processHighQualityImage(file, function(hdCover) {
            saveAlbumNode(title, date, hdCover);
        });
    } else {
        saveAlbumNode(title, date, "");
    }
}

function saveAlbumNode(title, date, coverData) {
    let newAlbum = {
        id: Date.now(),
        title: title,
        date: date || new Date().toLocaleDateString('vi-VN'),
        cover: coverData,
        photos: []
    };

    if (document.getElementById('album-title-input')) document.getElementById('album-title-input').value = "";
    if (document.getElementById('album-cover-file')) document.getElementById('album-cover-file').value = "";

    // Đẩy duy nhất Album này lên Node riêng trên Firebase
    if (typeof saveAlbumToCloudNode === 'function') {
        saveAlbumToCloudNode(newAlbum);
    }
}

// 2. Mở Modal Album
function viewAlbumPhotos(albumId) {
    let albums = getStoredAlbums();
    let album = albums.find(a => a.id === albumId);
    if (!album) return;

    currentOpeningAlbumId = albumId;
    pendingAlbumImages = [];

    let modal = document.getElementById('album-detail-modal');
    if (!modal) return;

    renderAlbumDetailModalContent(album);
    modal.style.display = 'block';
}

function refreshCurrentAlbumModal() {
    if (!currentOpeningAlbumId) return;
    let albums = getStoredAlbums();
    let album = albums.find(a => a.id === currentOpeningAlbumId);
    if (album) renderAlbumDetailModalContent(album);
}

function renderAlbumDetailModalContent(album) {
    let content = document.getElementById('album-detail-content');
    if (!content) return;

    let photosHtml = (album.photos || []).map((img, idx) => `
        <div style="display:inline-block; margin:6px; text-align:center; vertical-align:top; background:#ffffff; padding:6px; border-radius:8px; border:1px solid #e2e8f0; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
            <img src="${img}" style="width:100px; height:100px; object-fit:cover; border-radius:6px; border:1px solid #ccc; display:block;">
            <button type="button" onclick="downloadAlbumPhoto('${img}', '${album.title}_Anh_${idx + 1}.jpg')" class="btn btn-primary" style="font-size:10px; padding:4px 6px; margin-top:6px; width:100%;">📥 Tải về (Nét)</button>
        </div>
    `).join('');

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px dashed var(--border-color); padding-bottom:8px; margin-bottom:10px;">
            <h3 style="color:var(--text-color); margin:0;">📸 ${album.title}</h3>
            <button type="button" onclick="closeAlbumModal()" class="btn btn-danger" style="padding:4px 8px; font-size:11px;">✕ Đóng</button>
        </div>

        <p style="font-size:12px; color:#555;">📅 Ngày tạo: ${album.date}</p>

        <div style="margin-top:10px; background:#fafafa; padding:10px; border-radius:12px; border:1px dashed var(--border-color);">
            <label style="font-size:12px; font-weight:bold; color:var(--text-color);">➕ Chọn ảnh sắc nét để thêm vào Album này:</label>
            <input type="file" accept="image/*" onchange="addSingleAlbumImage(event, ${album.id})" class="form-control" style="font-size:11px; margin-top:4px;">
            
            <div id="album-photos-preview-box" style="margin-top:6px;"></div>

            <button type="button" onclick="uploadPhotosToAlbum(${album.id})" class="btn btn-primary btn-block" style="margin-top:8px; font-size:11px;">📤 Đăng (${pendingAlbumImages.length}) Ảnh Vào Album</button>
        </div>

        <h4 style="margin-top:14px; color:var(--text-color);">🖼️ Danh Sách Ảnh Trong Album (${(album.photos || []).length} ảnh):</h4>
        <div style="margin-top:8px; max-height:260px; overflow-y:auto; display:flex; flex-wrap:wrap; gap:4px;">
            ${photosHtml || "<p style='color:#888; font-size:12px; width:100%; text-align:center;'>Album này chưa have ảnh. Hãy chọn ảnh phía trên để thêm!</p>"}
        </div>
    `;

    renderAlbumPhotosPreview(album.id);
}

function closeAlbumModal() {
    currentOpeningAlbumId = null;
    let modal = document.getElementById('album-detail-modal');
    if (modal) modal.style.display = 'none';
}

function addSingleAlbumImage(event, albumId) {
    let file = event.target.files[0];
    if (!file) return;

    processHighQualityImage(file, function(hdImg) {
        if (hdImg) {
            pendingAlbumImages.push(hdImg);
            let albums = getStoredAlbums();
            let album = albums.find(a => a.id === albumId);
            if (album) renderAlbumDetailModalContent(album);
        }
    });

    event.target.value = '';
}

function removePendingAlbumImage(index, albumId) {
    pendingAlbumImages.splice(index, 1);
    let albums = getStoredAlbums();
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

// 4. Đăng ảnh vào Album & Đồng bộ Node Album đó
function uploadPhotosToAlbum(albumId) {
    if (pendingAlbumImages.length === 0) {
        alert("⚠️ Vui lòng chọn ít nhất 1 hình ảnh!");
        return;
    }

    let albums = getStoredAlbums();
    let album = albums.find(a => a.id === albumId);
    if (!album) return;

    if (!album.photos) album.photos = [];
    album.photos.unshift(...pendingAlbumImages);

    // Cập nhật duy nhất Node Album này trên Firebase
    if (typeof saveAlbumToCloudNode === 'function') {
        saveAlbumToCloudNode(album);
    }

    alert(`📸 Đã tải thêm ${pendingAlbumImages.length} ảnh nét! Đang đồng bộ...`);
    pendingAlbumImages = [];
}

function deleteAlbumToRecycle(albumId) {
    if (!confirm("Bạn có chắc chắn muốn xoá Album này?")) return;

    // Xóa duy nhất Node Album này khỏi Firebase
    if (typeof removeAlbumFromCloudNode === 'function') {
        removeAlbumFromCloudNode(albumId);
    }
}
