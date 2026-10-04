/* ==========================================================================
   MODULE PHÂN CÔNG LAO ĐỘNG, ĐIỂM DANH & GHI NHẬN LỖI VI PHẠM (KẾT NỐI BIỂU ĐỒ CỘT)
   ========================================================================== */

function isLaborMonitor() {
    try {
        let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
        if (typeof isSystemAdmin === 'function' && isSystemAdmin()) return true;
        return currentUser.name === 'Hoàng Ngọc Minh Tâm' || 
               currentUser.role === 'LABOR_MONITOR' || 
               currentUser.position === 'Lớp phó lao động';
    } catch (e) {
        return false;
    }
}

function getStudentNameList() {
    try {
        let users = JSON.parse(localStorage.getItem('T132_USERS')) || [];
        if (users.length > 0) return users.map(u => u.name);
    } catch(e) {}
    
    if (typeof T132_STUDENT_DATABASE !== 'undefined') {
        return T132_STUDENT_DATABASE.map(s => s.name);
    }
    return [];
}

const LABOR_DAYS_MAP = [
    { key: "thu2", label: "Thứ 2" },
    { key: "thu3", label: "Thứ 3" },
    { key: "thu4", label: "Thứ 4" },
    { key: "thu5", label: "Thứ 5" },
    { key: "thu6", label: "Thứ 6" },
    { key: "thu7", label: "Thứ 7" }
];

// Danh sách lỗi chuẩn theo bảng quy định vi phạm
const DISCIPLINE_RULES_CATALOG = [
    { name: "Trừ 1-3 điểm tổng kết", days: 3 },
    { name: "Trừ 4-10 điểm tổng kết", days: 6 },
    { name: "Trừ 11-20 điểm tổng kết", days: 12 },
    { name: "Trừ 21-99 điểm tổng kết", days: 18 },
    { name: "Trừ từ 100 điểm trở lên", days: 24 },
    { name: "Tác phong / Đi học trễ", days: 1 },
    { name: "Ngủ gật trong lớp", days: 1 },
    { name: "Quên sách vở dụng cụ", days: 1 },
    { name: "Ăn uống trong lớp", days: 3 },
    { name: "Vi phạm bài tập / học bài", days: 3 },
    { name: "Thái độ không chuẩn mực", days: 3 },
    { name: "Làm việc riêng", days: 6 },
    { name: "Bị ghi vào sổ đầu bài", days: 6 },
    { name: "Không dọn bàn / ghế tự học", days: 6 },
    { name: "Xả rác / rác trong hộc bàn", days: 1 },
    { name: "Không lao động trực nhật", days: 3 },
    { name: "Làm lao động không sạch", days: 3 },
    { name: "Không đổ rác trước khi ra về", days: 2 },
    { name: "Không trực nhật (Nghỉ hẳn)", days: 6 },
    { name: "Dụng cụ lao động không gọn gàng", days: 6 },
    { name: "Bị bắt Điện thoại - Laptop", days: 12 },
    { name: "Chậm trễ công việc được giao", days: 12 }
];

function renderDisciplineDutyTab() {
    let container = document.getElementById('tab-labor');
    if (!container) return;

    let isLaborAdmin = isLaborMonitor();
    let studentNames = getStudentNameList();

    let defaultSchedule = {
        "Thứ 2": [], "Thứ 3": [], "Thứ 4": [],
        "Thứ 5": [], "Thứ 6": [], "Thứ 7": []
    };

    let schedule = defaultSchedule;
    try {
        let savedSched = JSON.parse(localStorage.getItem('T132_LABOR_SCHEDULE'));
        if (savedSched) schedule = Object.assign({}, defaultSchedule, savedSched);
    } catch (e) {}

    let dutyStatus = {};
    try {
        let savedStatus = JSON.parse(localStorage.getItem('T132_LABOR_DUTY_STATUS'));
        if (savedStatus) dutyStatus = savedStatus;
    } catch (e) {}

    let violations = [];
    try {
        let savedViolations = JSON.parse(localStorage.getItem('T132_LABOR_VIOLATIONS'));
        if (Array.isArray(savedViolations)) violations = savedViolations;
    } catch (e) {}

    let scheduleHtml = "";

    // 1. PHÂN CÔNG LAO ĐỘNG (T2 - T7)
    if (isLaborAdmin) {
        let inputsHtml = LABOR_DAYS_MAP.map(d => {
            let assignedList = schedule[d.label] || [];
            let checkboxesHtml = studentNames.map(name => {
                let isChecked = assignedList.includes(name) ? 'checked' : '';
                return `
                    <label style="display:inline-block; margin-right:8px; margin-bottom:4px; font-size:10px; background:#f1f5f9; padding:2px 6px; border-radius:4px; cursor:pointer;">
                        <input type="checkbox" class="sched-checkbox-${d.key}" value="${name}" ${isChecked}> ${name}
                    </label>
                `;
            }).join('');

            return `
                <div style="margin-bottom:10px; border-bottom:1px dashed #cbd5e1; padding-bottom:8px;">
                    <b style="font-size:11px; color:var(--primary-color); display:block; margin-bottom:4px;">📅 ${d.label}:</b>
                    <div style="max-height:90px; overflow-y:auto; border:1px solid #e2e8f0; padding:6px; border-radius:6px; background:#fff;">
                        ${checkboxesHtml}
                    </div>
                </div>
            `;
        }).join('');

        scheduleHtml = `
            <div class="card" style="margin-bottom:12px;">
                <h3 style="color:var(--text-color);">🧹 Lớp Phó Lao Động: Phân Công Theo Danh Sách Lớp</h3>
                <p style="font-size:10px; color:#666; margin-bottom:6px;">Tích chọn học sinh phụ trách trực nhật cho từng ngày trong tuần:</p>
                ${inputsHtml}
                <button onclick="saveLaborSchedule()" class="btn btn-primary btn-block" style="margin-top:6px; font-size:11px;">💾 Lưu Bảng Phân Công</button>
            </div>
        `;
    } else {
        let rowsHtml = LABOR_DAYS_MAP.map(d => {
            let list = schedule[d.label] || [];
            return `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:6px; font-weight:bold; color:var(--primary-color); font-size:11px; width:70px;">${d.label}</td>
                    <td style="padding:6px; font-size:11px; color:#333;">${list.length > 0 ? list.join(', ') : 'Chưa phân công'}</td>
                </tr>
            `;
        }).join('');

        scheduleHtml = `
            <div class="card" style="margin-bottom:12px;">
                <h3 style="color:var(--text-color);">📋 Lịch Trực Nhật Trong Tuần</h3>
                <table style="width:100%; border-collapse:collapse; text-align:left;">
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;
    }

    // 2. ĐIỂM DANH TRỰC NHẬT HÔM NAY
    let todayIndex = new Date().getDay(); 
    let dayMapName = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][todayIndex];
    let todayAssignedStudents = schedule[dayMapName] || [];

    let dutyRowsHtml = "";
    if (todayAssignedStudents.length === 0) {
        dutyRowsHtml = `<tr><td colspan="3" style="text-align:center; padding:10px; color:#777; font-size:11px;">Hôm nay (${dayMapName}) chưa có phân công trực nhật nào.</td></tr>`;
    } else {
        dutyRowsHtml = todayAssignedStudents.map((name, idx) => {
            let status = dutyStatus[name] || 'Chưa làm';
            return `
                <tr style="border-bottom:1px solid #eee; font-size:11px;">
                    <td style="padding:6px;">${idx + 1}</td>
                    <td style="padding:6px; font-weight:bold;">${name}</td>
                    <td style="padding:6px;">
                        <label style="cursor:pointer; color:${status === 'Đã làm' ? '#2b8a3e' : '#d90429'}; font-weight:bold;">
                            <input type="checkbox" ${status === 'Đã làm' ? 'checked' : ''} onchange="toggleDutyCompletion('${name}', this.checked)" style="transform:scale(1.2); margin-right:4px;">
                            ${status === 'Đã làm' ? '✅ Đã đi làm' : '❌ Chưa đi làm'}
                        </label>
                    </td>
                </tr>
            `;
        }).join('');
    }

    let dutyChecklistHtml = `
        <div class="card" style="margin-bottom:12px; border:2px dashed #3b82f6; background:#f8fafc;">
            <h3 style="color:var(--text-color);">✅ Điểm Danh Trực Nhật Hôm Nay (${dayMapName})</h3>
            <div style="max-height:180px; overflow-y:auto; margin-top:6px;">
                <table style="width:100%; border-collapse:collapse; background:#fff; border-radius:6px;">
                    <thead>
                        <tr style="background:#e2e8f0; font-size:11px; text-align:left;">
                            <th style="padding:6px;">STT</th>
                            <th style="padding:6px;">Học Sinh Phụ Trách</th>
                            <th style="padding:6px;">Trạng Thái Làm Việc</th>
                        </tr>
                    </thead>
                    <tbody>${dutyRowsHtml}</tbody>
                </table>
            </div>
        </div>
    `;

    // 3. GHI NHẬN LỖI VI PHẠM KỶ LUẬT (KẾT NỐI BIỂU ĐỒ CỘT)
    let logFormHtml = "";
    if (isLaborAdmin) {
        let studentOptions = studentNames.map(name => `<option value="${name}">${name}</option>`).join('');
        let ruleOptions = DISCIPLINE_RULES_CATALOG.map(r => `<option value="${r.name}" data-days="${r.days}">${r.name} (Phạt ${r.days} ngày LĐ)</option>`).join('');

        logFormHtml = `
            <div class="card" style="margin-bottom:12px; background:#fff5f5; border:1px solid #ffc9c9;">
                <h3 style="color:#d90429;">⚠️ Lớp Phó Lao Động: Ghi Nhận Lỗi Vi Phạm</h3>
                <div style="margin-top:6px;">
                    <label style="font-size:11px; font-weight:bold;">Học sinh vi phạm:</label>
                    <select id="violation-student-select" class="form-control" style="font-size:11px;">${studentOptions}</select>
                </div>
                <div style="margin-top:6px;">
                    <label style="font-size:11px; font-weight:bold;">Nội dung lỗi (Theo bảng quy định):</label>
                    <select id="violation-rule-select" class="form-control" style="font-size:11px;">${ruleOptions}</select>
                </div>
                <div style="margin-top:6px;">
                    <label style="font-size:11px; font-weight:bold;">Ghi chú chi tiết (Tùy chọn):</label>
                    <input type="text" id="violation-note-input" class="form-control" placeholder="VD: Tiết 2 môn Toán..." style="font-size:11px;">
                </div>
                <button onclick="logLaborViolation()" class="btn btn-danger btn-block" style="margin-top:8px; font-size:11px;">⚠️ Lưu Lỗi & Cập Nhật Biểu Đồ Cột</button>
            </div>
        `;
    }

    let violationsListHtml = violations.length === 0 ? 
        `<p style="color:#777; font-size:11px; text-align:center;">Lớp chưa có lỗi vi phạm nào.</p>` :
        violations.map((v, idx) => `
            <div style="background:#fff; border:1px solid var(--border-color); padding:8px 10px; border-radius:10px; margin-bottom:8px; font-size:11px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <b style="color:#d90429;">👤 ${v.studentName}</b> - <span style="color:#333;">${v.content}</span>
                    <div style="font-size:10px; color:#666; margin-top:2px;">📅 ${v.date} | Hình phạt: ${v.penaltyDays} ngày LĐ</div>
                </div>
                ${isLaborAdmin ? `<button onclick="deleteLaborViolation(${idx})" class="btn btn-danger" style="font-size:10px; padding:2px 6px;">✕ Xoá</button>` : ''}
            </div>
        `).join('');

    container.innerHTML = `
        ${scheduleHtml}
        ${dutyChecklistHtml}
        ${logFormHtml}
        <div class="card">
            <h3 style="color:var(--text-color);">📋 Danh Sách Lỗi Vi Phạm Đã Ghi Nhận</h3>
            <div style="max-height:200px; overflow-y:auto; margin-top:8px;">${violationsListHtml}</div>
        </div>
    `;

    if (typeof updateChartsData === 'function') updateChartsData();
}

function saveLaborSchedule() {
    let schedule = {};
    LABOR_DAYS_MAP.forEach(d => {
        let checkboxes = document.querySelectorAll(`.sched-checkbox-${d.key}:checked`);
        let selectedNames = Array.from(checkboxes).map(cb => cb.value);
        schedule[d.label] = selectedNames;
    });
    localStorage.setItem('T132_LABOR_SCHEDULE', JSON.stringify(schedule));
    alert("💾 Đã lưu bảng phân công lao động thành công!");
    renderDisciplineDutyTab();
}

function toggleDutyCompletion(studentName, isChecked) {
    let dutyStatus = JSON.parse(localStorage.getItem('T132_LABOR_DUTY_STATUS')) || {};
    dutyStatus[studentName] = isChecked ? 'Đã làm' : 'Chưa làm';
    localStorage.setItem('T132_LABOR_DUTY_STATUS', JSON.stringify(dutyStatus));
    if (typeof updateChartsData === 'function') updateChartsData();
}

function logLaborViolation() {
    let studentSelect = document.getElementById('violation-student-select');
    let ruleSelect = document.getElementById('violation-rule-select');
    let noteInput = document.getElementById('violation-note-input');

    let studentName = studentSelect ? studentSelect.value : "";
    let ruleName = ruleSelect ? ruleSelect.value : "";
    let penaltyDays = parseInt(ruleSelect.options[ruleSelect.selectedIndex].getAttribute('data-days')) || 1;
    let note = noteInput ? noteInput.value.trim() : "";

    if (!studentName || !ruleName) {
        alert("⚠️ Vui lòng chọn học sinh và lỗi vi phạm!");
        return;
    }

    let violations = [];
    try {
        let saved = JSON.parse(localStorage.getItem('T132_LABOR_VIOLATIONS'));
        if (Array.isArray(saved)) violations = saved;
    } catch(e) {}

    violations.unshift({
        studentName: studentName,
        content: ruleName + (note ? ` (${note})` : ''),
        penaltyDays: penaltyDays,
        date: new Date().toLocaleDateString('vi-VN')
    });

    localStorage.setItem('T132_LABOR_VIOLATIONS', JSON.stringify(violations));
    alert(`⚠️ Đã ghi nhận lỗi cho học sinh "${studentName}" thành công!`);

    if (noteInput) noteInput.value = "";
    renderDisciplineDutyTab();
    if (typeof updateChartsData === 'function') updateChartsData();
}

function deleteLaborViolation(index) {
    if (!confirm("Bạn có chắc chắn muốn xoá lỗi này?")) return;
    let violations = [];
    try {
        let saved = JSON.parse(localStorage.getItem('T132_LABOR_VIOLATIONS'));
        if (Array.isArray(saved)) violations = saved;
    } catch(e) {}

    violations.splice(index, 1);
    localStorage.setItem('T132_LABOR_VIOLATIONS', JSON.stringify(violations));
    renderDisciplineDutyTab();
    if (typeof updateChartsData === 'function') updateChartsData();
}

/* ==========================================================================
   KẾT NỐI BIỂU ĐỒ CỘT (TRỤC X: TÊN HỌC SINH VI PHẠM, TRỤC Y: SỐ LƯỢNG LỖI)
   ========================================================================== */
function updateChartsData() {
    let violations = JSON.parse(localStorage.getItem('T132_LABOR_VIOLATIONS')) || [];
    let violationCounts = {};

    violations.forEach(v => {
        violationCounts[v.studentName] = (violationCounts[v.studentName] || 0) + 1;
    });

    let topViolators = Object.keys(violationCounts).map(name => ({
        name: name,
        count: violationCounts[name]
    })).sort((a, b) => b.count - a.count).slice(0, 8); // Top 8 học sinh vi phạm nhiều nhất

    let labelsX = topViolators.map(v => v.name);
    let dataY = topViolators.map(v => v.count);

    if (window.barTasksChartInstance) {
        window.barTasksChartInstance.data.labels = labelsX.length > 0 ? labelsX : ['Chưa có vi phạm'];
        window.barTasksChartInstance.data.datasets[0].data = dataY.length > 0 ? dataY : [0];
        window.barTasksChartInstance.data.datasets[0].label = 'Số lượng lỗi vi phạm kỷ luật';
        window.barTasksChartInstance.update();
    }
}
