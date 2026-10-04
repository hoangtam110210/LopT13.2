/* ========================================================
   THƯ GÓP Ý ẨN DANH & KHO TÀI LIỆU (CÓ TÍNH NĂNG XOÁ TÀI LIỆU)
   ======================================================== */

// --------------------------------------------------------
// 1. THƯ GÓP Ý ẨN DANH
// --------------------------------------------------------
function sendAnonymousFeedback() {
    let input = document.getElementById('anonymous-text-input');
    let text = input ? input.value.trim() : "";

    if (!text) {
        alert("⚠️ Vui lòng nhập nội dung góp ý!");
        return;
    }

    let feedbacks = JSON.parse(localStorage.getItem('T132_FEEDBACKS')) || [];
    feedbacks.unshift({
        id: Date.now(),
        text: text,
        time: new Date().toLocaleString('vi-VN')
    });

    localStorage.setItem('T132_FEEDBACKS', JSON.stringify(feedbacks));
    alert("🔒 Góp ý ẩn danh của bạn đã được gửi thành công!");
    
    if (input) input.value = "";
    renderFeedbackList();
}

function renderFeedbackList() {
    let container = document.getElementById('feedback-list-box');
    if (!container) return;

    let feedbacks = JSON.parse(localStorage.getItem('T132_FEEDBACKS')) || [];
    let isBCS = isBCSMember();

    if (feedbacks.length === 0) {
        container.innerHTML = `<p style="color:#777; font-size:11px; text-align:center;">Chưa có góp ý nào.</p>`;
        return;
    }

    let html = feedbacks.map(f => `
        <div style="background:#f8f9fa; border-left:3px solid var(--primary-color); padding:8px; border-radius:6px; margin-bottom:6px; font-size:11px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#555; font-size:10px;">🕒 ${f.time}</span>
                ${isBCS ? `<button onclick="deleteFeedbackItem(${f.id})" class="btn btn-danger" style="font-size:9px; padding:1px 5px;">🗑️ Xoá</button>` : ''}
            </div>
            <div style="color:#333; margin-top:4px;">${f.text}</div>
        </div>
    `).join('');

    container.innerHTML = html;
}

function deleteFeedbackItem(id) {
    if (!confirm("Bạn có chắc chắn muốn xoá thư góp ý này?")) return;
    let feedbacks = JSON.parse(localStorage.getItem('T132_FEEDBACKS')) || [];
    feedbacks = feedbacks.filter(f => f.id !== id);
    localStorage.setItem('T132_FEEDBACKS', JSON.stringify(feedbacks));
    renderFeedbackList();
}

// --------------------------------------------------------
// 2. KHO TÀI LIỆU HỌC TẬP (CÓ TÍNH NĂNG XOÁ TÀI LIỆU)
// --------------------------------------------------------

// Tải tài liệu mới lên kho
function uploadDocumentFile() {
    let folderInput = document.getElementById('doc-folder-custom-input');
    let fileInput = document.getElementById('doc-file-input');

    let folderName = folderInput ? folderInput.value.trim() : "Tài liệu chung";
    let file = fileInput && fileInput.files[0];

    if (!file) {
        alert("⚠️ Vui lòng chọn tệp tài liệu để tải lên!");
        return;
    }

    if (!folderName) folderName = "Tài liệu chung";

    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    let docs = JSON.parse(localStorage.getItem('T132_DOCUMENTS')) || [];

    let reader = new FileReader();
    reader.onload = function(e) {
        let newDoc = {
            id: Date.now(),
            folder: folderName,
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(1) + " KB",
            fileData: e.target.result,
            uploadedBy: currentUser.name || "Thành viên",
            uploadTime: new Date().toLocaleDateString('vi-VN')
        };

        docs.unshift(newDoc);
        try {
            localStorage.setItem('T132_DOCUMENTS', JSON.stringify(docs));
            alert(`📤 Tải tệp "${file.name}" vào môn/thư mục "${folderName}" thành công!`);
            
            if (fileInput) fileInput.value = '';
            renderDocumentsList();
        } catch (err) {
            alert("⚠️ Dung lượng bộ nhớ đầy, không thể lưu thêm tệp lớn này!");
        }
    };

    reader.readAsDataURL(file);
}

// Hiển thị danh sách tài liệu nhóm theo thư mục / môn học kèm nút XOÁ
function renderDocumentsList() {
    let container = document.getElementById('documents-folder-box');
    if (!container) return;

    let docs = JSON.parse(localStorage.getItem('T132_DOCUMENTS')) || [];
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    let isBCS = isBCSMember();

    if (docs.length === 0) {
        container.innerHTML = `<p style="color:#777; font-size:11px; text-align:center;">Kho tài liệu đang trống.</p>`;
        return;
    }

    // Nhóm tài liệu theo Thư mục/Môn
    let groupedDocs = {};
    docs.forEach(doc => {
        let folder = doc.folder || "Tài liệu chung";
        if (!groupedDocs[folder]) groupedDocs[folder] = [];
        groupedDocs[folder].push(doc);
    });

    let html = "";
    for (let folder in groupedDocs) {
        let itemsHtml = groupedDocs[folder].map(d => {
            let canDelete = isBCS || (d.uploadedBy === currentUser.name);

            return `
                <div style="background:#fff; border:1px solid var(--border-color); padding:8px 10px; border-radius:8px; margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="overflow:hidden; padding-right:8px;">
                        <a href="${d.fileData}" download="${d.fileName}" style="font-size:12px; font-weight:bold; color:var(--primary-color); text-decoration:none; display:block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
                            📄 ${d.fileName}
                        </a>
                        <small style="color:#888; font-size:10px;">
                            ${d.fileSize} | Người đăng: <b>${d.uploadedBy}</b> (${d.uploadTime})
                        </small>
                    </div>
                    <div style="display:flex; gap:4px; flex-shrink:0;">
                        <a href="${d.fileData}" download="${d.fileName}" class="btn btn-primary" style="font-size:10px; padding:3px 8px; text-decoration:none;">⬇️ Tải</a>
                        ${canDelete ? `
                            <button onclick="deleteDocumentFile(${d.id})" class="btn btn-danger" style="font-size:10px; padding:3px 8px;">🗑️ Xoá</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        html += `
            <div style="background:#f8f9fa; border:1px solid #e9ecef; border-radius:10px; padding:10px; margin-bottom:10px;">
                <b style="font-size:12px; color:var(--text-color);">📁 Môn / Thư mục: <span style="color:var(--primary-color);">${folder}</span> (${groupedDocs[folder].length} tệp)</b>
                <div style="margin-top:4px;">${itemsHtml}</div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Xoá tài liệu khỏi Kho
function deleteDocumentFile(docId) {
    let docs = JSON.parse(localStorage.getItem('T132_DOCUMENTS')) || [];
    let targetDoc = docs.find(d => d.id === docId);

    if (!targetDoc) return;

    if (confirm(`Bạn có chắc chắn muốn xoá tài liệu "${targetDoc.fileName}"?`)) {
        docs = docs.filter(d => d.id !== docId);
        localStorage.setItem('T132_DOCUMENTS', JSON.stringify(docs));
        alert("🗑️ Đã xoá tài liệu thành công!");
        renderDocumentsList();
    }
}
