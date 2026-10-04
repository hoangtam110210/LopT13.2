/* ==========================================================================
   MODULE QUẢN LÝ CÔNG VIỆC - TỰ ĐỘNG NẠP DANH SÁCH HỌC SINH T13.2
   ========================================================================== */

// 1. Tự động kiểm tra và lấy danh sách học sinh từ localStorage hoặc khởi tạo danh sách
function getStudentListForTasks() {
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('T132_USERS')) || [];
    } catch (e) { users = []; }

    // Nếu chưa có dữ liệu trong localStorage, lấy dữ liệu từ data.js hoặc tạo danh sách mặc định
    if (!users || users.length === 0) {
        if (typeof CLASS_MEMBERS !== 'undefined' && Array.isArray(CLASS_MEMBERS)) {
            users = CLASS_MEMBERS;
        } else {
            users = [
                { stt: 1, name: "Nguyễn Văn A" },
                { stt: 2, name: "Trần Thị B" },
                { stt: 3, name: "Hoàng Ngọc Minh Tâm" }
            ];
        }
        localStorage.setItem('T132_USERS', JSON.stringify(users));
    }

    return users.filter(u => u.name);
}

// 2. Hàm render chính của Tab Công việc
function renderTasks() {
    renderTaskAssignCheckboxes();
    renderTaskList();
}

// 3. Hiển thị danh sách tích chọn học sinh phụ trách
function renderTaskAssignCheckboxes() {
    let container = document.getElementById('task-assign-student-checkboxes');
    if (!container) return;

    let students = getStudentListForTasks();

    let html = students.map((s, idx) => `
        <label style="display:inline-block; font-size:11px; margin:3px 5px; cursor:pointer; background:#f8f9fa; padding:4px 8px; border-radius:8px; border:1px solid #dee2e6;">
            <input type="checkbox" class="task-assign-cb" value="${s.name}"> ${s.stt ? s.stt + '. ' : ''}${s.name}
        </label>
    `).join('');

    container.innerHTML = html || "<p style='color:#777; font-size:11px;'>Chưa có danh sách học sinh.</p>";
}

// 4. Chọn tất cả / Bỏ chọn học sinh
function toggleSelectAllTaskStudents(selectAll) {
    let checkboxes = document.querySelectorAll('.task-assign-cb');
    checkboxes.forEach(cb => cb.checked = selectAll);
}

// 5. Tạo công việc mới và giao cho học sinh đã chọn
function createNewClassTask() {
    let titleInput = document.getElementById('task-title-input');
    let title = titleInput ? titleInput.value.trim() : "";

    let selectedCbs = document.querySelectorAll('.task-assign-cb:checked');
    let assignedToNames = Array.from(selectedCbs).map(cb => cb.value).join(', ');

    if (!title) {
        alert("⚠️ Vui lòng nhập Tên công việc!");
        return;
    }

    if (!assignedToNames) {
        alert("⚠️ Vui lòng tích chọn ít nhất 1 học sinh phụ trách!");
        return;
    }

    let tasks = JSON.parse(localStorage.getItem('T132_TASKS')) || [];
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};

    tasks.unshift({
        id: Date.now(),
        title: title,
        assignedTo: assignedToNames,
        createdBy: currentUser.name || "Ban cán sự",
        deadline: new Date().toLocaleDateString('vi-VN'),
        status: "IN_PROGRESS",
        proofs: []
    });

    localStorage.setItem('T132_TASKS', JSON.stringify(tasks));
    alert(`🚀 Đã tạo nhiệm vụ "${title}" và giao cho (${assignedToNames})!`);

    if (titleInput) titleInput.value = "";
    toggleSelectAllTaskStudents(false);
    renderTaskList();
}

// 6. Hiển thị danh sách các công việc đã giao
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
        let isDone = (t.status === 'DONE');
        let isAssignedToMe = t.assignedTo.includes(currentUser.name);

        return `
            <div class="card" style="margin-bottom:10px; border-left:4px solid ${isDone ? '#52b788' : '#fcc419'};">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <b style="font-size:13px; color:var(--text-color);">${t.title}</b>
                    <span class="badge" style="background:${isDone ? '#d8f3dc' : '#fff3bf'}; color:${isDone ? '#2b8a3e' : '#d9480f'}; font-size:10px;">
                        ${isDone ? '✅ Hoàn thành' : '⏳ Đang làm'}
                    </span>
                </div>

                <div style="font-size:11px; color:#555; margin-top:6px;">
                    <b>Người làm:</b> <span style="color:var(--primary-color); font-weight:bold;">${t.assignedTo}</span><br>
                    <small>Người giao: ${t.createdBy} | Ngày tạo: ${t.deadline}</small>
                </div>

                <div style="margin-top:8px; display:flex; gap:6px; align-items:center;">
                    ${(isAssignedToMe || isBCS) ? `
                        <button onclick="toggleTaskStatus(${t.id})" class="btn ${isDone ? 'btn-danger' : 'btn-primary'}" style="font-size:10px; padding:3px 8px;">
                            ${isDone ? '↩️ Đánh dấu Chưa xong' : '✅ Đánh dấu Hoàn thành'}
                        </button>
                    ` : ''}
                    ${isBCS ? `
                        <button onclick="deleteTaskItem(${t.id})" class="btn btn-danger" style="font-size:10px; padding:3px 8px; margin-left:auto;">🗑️ Xoá</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function toggleTaskStatus(taskId) {
    let tasks = JSON.parse(localStorage.getItem('T132_TASKS')) || [];
    let t = tasks.find(x => x.id === taskId);
    if (t) {
        t.status = (t.status === 'DONE') ? 'IN_PROGRESS' : 'DONE';
        localStorage.setItem('T132_TASKS', JSON.stringify(tasks));
        renderTaskList();
    }
}

function deleteTaskItem(taskId) {
    if (!confirm("Bạn có chắc chắn muốn xoá công việc này?")) return;
    let tasks = JSON.parse(localStorage.getItem('T132_TASKS')) || [];
    tasks = tasks.filter(t => t.id !== taskId);
    localStorage.setItem('T132_TASKS', JSON.stringify(tasks));
    renderTaskList();
}
