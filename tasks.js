/* ==========================================================================
   MODULE QUẢN LÝ CÔNG VIỆC LỚP & BAN CÁN SỰ (XEM ẢNH TRỰC TIẾP TRÊN MODAL)
   ========================================================================== */

const BCS_ROLES_LIST = ['Lớp trưởng', 'Lớp phó', 'Lớp phó lao động', 'Lớp phó học tập', 'Bí thư', 'Thủ quỹ', 'Cán sự'];

// 1. Lấy danh sách học sinh
function getStudentListForTasks() {
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('T132_USERS')) || [];
    } catch (e) { users = []; }

    if (!users || users.length === 0) {
        if (typeof CLASS_MEMBERS !== 'undefined' && Array.isArray(CLASS_MEMBERS)) {
            users = CLASS_MEMBERS;
        } else {
            users = [
                { stt: 1, name: "Nguyễn Văn A", role: "Học sinh" },
                { stt: 2, name: "Trần Thị B", role: "Học sinh" },
                { stt: 3, name: "Hoàng Ngọc Minh Tâm", role: "Lớp phó lao động" }
            ];
        }
        localStorage.setItem('T132_USERS', JSON.stringify(users));
    }

    return users.filter(u => u.name);
}

// 2. Render chính Tab Công việc
function renderTasks() {
    let containerBox = document.getElementById('task-assign-student-checkboxes');
    if (containerBox && containerBox.children.length === 0) {
        renderTaskAssignCheckboxes();
    }
    renderTaskList();
}

// 3. Hiển thị danh sách chọn học sinh
function renderTaskAssignCheckboxes() {
    let container = document.getElementById('task-assign-student-checkboxes');
    if (!container) return;

    let students = getStudentListForTasks();

    let html = students.map((s, idx) => `
        <label style="display:inline-block; font-size:10px; margin:3px; cursor:pointer; background:#f8f9fa; padding:4px 8px; border-radius:6px; border:1px solid #dee2e6;">
            <input type="checkbox" class="task-assign-cb" value="${s.name}" data-role="${s.role || ''}"> 
            ${s.stt ? s.stt + '. ' : (idx + 1) + '. '}${s.name} ${s.role && s.role !== 'Học sinh' ? `<b style="color:#2563eb;">(${s.role})</b>` : ''}
        </label>
    `).join('');

    container.innerHTML = html || "<p style='color:#777; font-size:11px;'>Chưa có danh sách học sinh.</p>";
}

function toggleSelectAllTaskStudents(selectAll) {
    let checkboxes = document.querySelectorAll('.task-assign-cb');
    checkboxes.forEach(cb => cb.checked = selectAll);
}

function selectOnlyBCSStudents() {
    let checkboxes = document.querySelectorAll('.task-assign-cb');
    checkboxes.forEach(cb => {
        let role = cb.getAttribute('data-role') || '';
        cb.checked = BCS_ROLES_LIST.includes(role) || (role !== '' && role !== 'Học sinh');
    });
}

function toggleTaskExpand(elementId) {
    let el = document.getElementById(elementId);
    if (el) {
        el.style.display = (el.style.display === 'none') ? 'block' : 'none';
    }
}

// 4. HỘP THOẠI XEM ẢNH MINH CHỨNG TRỰC TIẾP (KHÔNG BỊ LỖI BÀI MỞ THẺ MỚI)
function showProofModal(imageUrl) {
    let modal = document.getElementById('proof-image-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'proof-image-modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:none; align-items:center; justify-content:center; z-index:999999; padding:15px; box-sizing:border-box;';
        modal.innerHTML = `
            <div style="position:relative; max-width:95%; max-height:90vh; background:#fff; padding:10px; border-radius:12px; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.5);">
                <button onclick="document.getElementById('proof-image-modal').style.display='none'" style="position:absolute; top:-12px; right:-12px; background:#d90429; color:#fff; border:none; border-radius:50%; width:32px; height:32px; font-weight:bold; font-size:14px; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.3);">✕</button>
                <b style="display:block; margin-bottom:8px; font-size:12px; color:#333;">🖼️ Ảnh Minh Chứng Công Việc</b>
                <img id="proof-modal-img" src="" style="max-width:100%; max-height:70vh; border-radius:8px; object-fit:contain; border:1px solid #ddd;">
                <div style="margin-top:10px;">
                    <button onclick="document.getElementById('proof-image-modal').style.display='none'" class="btn btn-primary" style="font-size:11px; padding:4px 16px;">Đóng Xem Ảnh</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('proof-modal-img').src = imageUrl;
    modal.style.display = 'flex';
}

function viewStudentProof(taskId, studentName) {
    let tasks = JSON.parse(localStorage.getItem('T132_TASKS')) || [];
    let task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let student = (task.assignedStudents || []).find(s => s.name === studentName);
    if (student && student.proofUrl) {
        showProofModal(student.proofUrl);
    } else {
        alert("⚠️ Học sinh này chưa tải lên ảnh minh chứng!");
    }
}

// 5. Tạo công việc mới
function createNewClassTask() {
    let titleInput = document.getElementById('task-title-input');
    let title = titleInput ? titleInput.value.trim() : "";

    let selectedCbs = document.querySelectorAll('.task-assign-cb:checked');
    if (!title) return alert("⚠️ Vui lòng nhập Tên công việc!");
    if (selectedCbs.length === 0) return alert("⚠️ Vui lòng tích chọn ít nhất 1 học sinh phụ trách!");

    let assignedStudents = Array.from(selectedCbs).map(cb => ({
        name: cb.value,
        completed: false,
        proofUrl: ''
    }));

    let isBCSOnly = Array.from(selectedCbs).every(cb => {
        let role = cb.getAttribute('data-role') || '';
        return BCS_ROLES_LIST.includes(role) || (role !== '' && role !== 'Học sinh');
    });

    let tasks = JSON.parse(localStorage.getItem('T132_TASKS')) || [];
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};

    tasks.unshift({
        id: Date.now(),
        title: title,
        isBCSOnly: isBCSOnly,
        createdBy: currentUser.name || "Ban cán sự",
        deadline: new Date().toLocaleDateString('vi-VN'),
        assignedStudents: assignedStudents
    });

    localStorage.setItem('T132_TASKS', JSON.stringify(tasks));
    alert(`🚀 Đã tạo nhiệm vụ "${title}" thành công!`);

    if (titleInput) titleInput.value = "";
    toggleSelectAllTaskStudents(false);

    renderTaskList();
    if (typeof pushLocalDataToCloud === 'function') pushLocalDataToCloud();
}

// 6. Hiển thị danh sách công việc
function renderTaskList() {
    let container = document.getElementById('tasks-container');
    if (!container) return;

    let tasks = JSON.parse(localStorage.getItem('T132_TASKS')) || [];
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    let isBCS = (typeof isBCSMember === 'function') ? isBCSMember() : true;

    if (tasks.length === 0) {
        container.innerHTML = `<div class="card" style="text-align:center; color:#777; font-size:12px; margin-top:10px;">🎉 Chưa có công việc nào được giao!</div>`;
        return;
    }

    let html = tasks.map(t => {
        let assignedList = Array.isArray(t.assignedStudents) ? t.assignedStudents : 
                           (typeof t.assignedTo === 'string' ? t.assignedTo.split(', ').map(n => ({ name: n, completed: t.status === 'DONE', proofUrl: '' })) : []);

        let completedCount = assignedList.filter(s => s.completed).length;
        let totalCount = assignedList.length;
        let percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        let isAllDone = (percent === 100);

        let studentRowsHtml = assignedList.map((s, idx) => {
            let isMyTask = (s.name === currentUser.name);

            return `
                <tr style="border-bottom:1px solid #f1f5f9; font-size:11px;">
                    <td style="padding:6px; font-weight:bold;">${idx + 1}. ${s.name}</td>
                    
                    <!-- Ô MINH CHỨNG SỬ DỤNG MODAL TRỰC TIẾP -->
                    <td style="padding:6px; text-align:center;">
                        ${s.proofUrl ? `
                            <button onclick="viewStudentProof(${t.id}, '${s.name}')" class="btn btn-primary" style="font-size:9px; padding:2px 6px; font-weight:bold;">🖼️ Xem ảnh</button>
                        ` : '<span style="color:#94a3b8; font-size:10px;">Chưa nộp</span>'}
                        
                        ${isMyTask ? `
                            <label style="display:block; margin-top:3px; cursor:pointer; color:#059669; font-size:9px; text-decoration:underline;">
                                📤 Tải ảnh
                                <input type="file" accept="image/*" onchange="uploadStudentTaskProof(${t.id}, '${s.name}', event)" style="display:none;">
                            </label>
                        ` : ''}
                    </td>

                    <!-- Ô ĐÁNH DẤU HOÀN THÀNH -->
                    <td style="padding:6px; text-align:center;">
                        <label style="cursor:pointer; font-weight:bold; color:${s.completed ? '#166534' : '#dc2626'};">
                            <input type="checkbox" ${s.completed ? 'checked' : ''} onchange="toggleTaskStudentStatus(${t.id}, '${s.name}', this.checked)" style="transform:scale(1.2); margin-right:4px;">
                            ${s.completed ? '✅ Xong' : '⏳ Chưa'}
                        </label>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div class="card" style="margin-bottom:10px; border-left:4px solid ${t.isBCSOnly ? '#f59e0b' : (isAllDone ? '#10b981' : '#3b82f6')};">
                <div onclick="toggleTaskExpand('task-detail-${t.id}')" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <span class="badge" style="background:${t.isBCSOnly ? '#f59e0b' : '#3b82f6'}; color:#fff; font-size:9px; margin-bottom:4px;">
                            ${t.isBCSOnly ? '👔 VIỆC RIÊNG BAN CÁN SỰ' : '🌐 CÔNG VIỆC CHUNG'}
                        </span>
                        <h4 style="margin:2px 0; color:var(--text-color); font-size:13px;">📌 ${t.title}</h4>
                        <div style="font-size:10px; color:#666;">
                            Người giao: ${t.createdBy || 'Ban cán sự'} | Ngày giao: ${t.deadline} | Tiến độ: <b>${completedCount}/${totalCount}</b> (${percent}%)
                        </div>
                    </div>
                    <span style="font-size:11px; color:#666; font-weight:bold;">👇 Bấm xem chi tiết</span>
                </div>

                <div style="background:#e2e8f0; height:6px; border-radius:3px; margin-top:8px; overflow:hidden;">
                    <div style="background:${isAllDone ? '#10b981' : '#3b82f6'}; width:${percent}%; height:100%;"></div>
                </div>

                <div id="task-detail-${t.id}" style="display:none; margin-top:10px; padding-top:10px; border-top:1px dashed #cbd5e1;">
                    <b style="font-size:11px; color:#334155; display:block; margin-bottom:6px;">📋 Danh sách học sinh phụ trách & Minh chứng đính kèm:</b>
                    
                    <div style="max-height:200px; overflow-y:auto; border:1px solid #cbd5e1; border-radius:8px; background:#fff;">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="background:#f8fafc; font-size:10px; text-align:left; border-bottom:1px solid #e2e8f0;">
                                    <th style="padding:6px;">Học sinh</th>
                                    <th style="padding:6px; text-align:center;">Minh chứng</th>
                                    <th style="padding:6px; text-align:center;">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>${studentRowsHtml}</tbody>
                        </table>
                    </div>

                    ${isBCS ? `
                        <div style="margin-top:8px; text-align:right;">
                            <button onclick="deleteTaskItem(${t.id})" class="btn btn-danger" style="font-size:9px; padding:3px 8px;">🗑️ Xoá công việc này</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

// 7. Cập nhật trạng thái
function toggleTaskStudentStatus(taskId, studentName, isChecked) {
    let tasks = JSON.parse(localStorage.getItem('T132_TASKS')) || [];
    let task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (Array.isArray(task.assignedStudents)) {
        let target = task.assignedStudents.find(s => s.name === studentName);
        if (target) target.completed = isChecked;
    }

    localStorage.setItem('T132_TASKS', JSON.stringify(tasks));
    renderTaskList();
    if (typeof pushLocalDataToCloud === 'function') pushLocalDataToCloud();
}

// 8. Tải ảnh minh chứng
function uploadStudentTaskProof(taskId, studentName, event) {
    let file = event.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = function(e) {
        let base64Url = e.target.result;
        
        let tasks = JSON.parse(localStorage.getItem('T132_TASKS')) || [];
        let task = tasks.find(t => t.id === taskId);
        if (!task) return;

        if (Array.isArray(task.assignedStudents)) {
            let target = task.assignedStudents.find(s => s.name === studentName);
            if (target) {
                target.proofUrl = base64Url;
                target.completed = true;
            }
        }

        localStorage.setItem('T132_TASKS', JSON.stringify(tasks));
        alert("🖼️ Đã nộp minh chứng thành công!");
        renderTaskList();
        if (typeof pushLocalDataToCloud === 'function') pushLocalDataToCloud();
    };
    reader.readAsDataURL(file);
}

// 9. Xoá công việc
function deleteTaskItem(taskId) {
    if (!confirm("Bạn có chắc chắn muốn xoá công việc này?")) return;
    let tasks = JSON.parse(localStorage.getItem('T132_TASKS')) || [];
    tasks = tasks.filter(t => t.id !== taskId);
    localStorage.setItem('T132_TASKS', JSON.stringify(tasks));
    renderTaskList();
    if (typeof pushLocalDataToCloud === 'function') pushLocalDataToCloud();
}
