/* ==========================================================================
   MODULE QUẢN TRỊ ADMIN & XÁC THỰC ĐĂNG NHẬP / ĐĂNG XUẤT CHI ĐOÀN 10T2
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. BỘ CHUẨN HÓA DỮ LIỆU THÔNG MINH
   -------------------------------------------------------------------------- */
function cleanStr(str) {
    if (!str) return "";
    let s = str.toString().trim().toLowerCase();
    try { s = s.normalize('NFC'); } catch(e) {}
    const vnToneMap = {
        'oá': 'óa', 'oà': 'òa', 'oả': 'ỏa', 'oã': 'õa', 'oạ': 'ọa',
        'oé': 'óe', 'oè': 'òe', 'oẻ': 'ỏe', 'oẽ': 'õe', 'oẹ': 'ọe',
        'uý': 'úy', 'uỳ': 'ùy', 'uỷ': 'ủy', 'uỹ': 'ũy', 'uỵ': 'ụy'
    };
    for (let key in vnToneMap) {
        s = s.split(key).join(vnToneMap[key]);
    }
    return s;
}

function cleanPhone(str) {
    let p = (str || "").toString().replace(/\D/g, '');
    if (p.startsWith('0')) p = p.substring(1);
    return p;
}


/* --------------------------------------------------------------------------
   2. KHU VỰC PHÂN QUYỀN & QUẢN TRỊ ADMIN (BAN CÁN SỰ)
   -------------------------------------------------------------------------- */
function isSystemAdmin() {
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    return currentUser.name === "Hoàng Ngọc Minh Tâm" || currentUser.isAdmin === true;
}

function isBCSMember() {
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    if (isSystemAdmin()) return true;
    let users = JSON.parse(localStorage.getItem('T132_USERS')) || [];
    let u = users.find(x => x.name === currentUser.name);
    let role = u ? u.role : currentUser.role;
    let bcsRoles = ["Cô chủ nhiệm", "Lớp trưởng", "Lớp phó học tập", "Lớp phó lao động", "Bí thư", "Phó bí thư", "Ủy viên", "Thủ quỹ", "Lớp phó văn thể mỹ"];
    return bcsRoles.includes(role);
}

function renderAdminPanel() {
    let container = document.getElementById('admin-role-manager-box');
    if (!container || !isSystemAdmin()) {
        if (container) container.innerHTML = '';
        return;
    }

    let users = JSON.parse(localStorage.getItem('T132_USERS')) || [];
    let gvcn = users.find(u => u.stt === 0 || u.role === "Cô chủ nhiệm");

    let studentOptions = users.filter(u => u.stt > 0).map(u => 
        `<option value="${u.name}">${u.stt}. ${u.name} (${u.role || 'Thành viên'})</option>`
    ).join('');

    container.innerHTML = `
        <div class="card" style="border:2px dashed #f72585; background:#fff5f8; margin-bottom:12px;">
            <h3 style="color:#d90429; margin-top:0;">👑 Bảng Quản Trị Admin (Hoàng Ngọc Minh Tâm)</h3>
            <p style="font-size:12px; color:#555; margin-top:4px;">👤 <b>GVCN Lớp:</b> ${gvcn ? gvcn.name + " (" + (gvcn.email || 'gvcn.t132@gmail.com') + ")" : "Cô Chủ Nhiệm T13.2"}</p>
            
            <div style="margin-top:10px;">
                <label style="font-size:11px; font-weight:bold;">Chỉ định Chức vụ Ban Cán Sự:</label>
                <select id="admin-target-user" class="form-control" style="font-size:12px; margin-top:4px;">${studentOptions}</select>
                
                <label style="font-size:11px; font-weight:bold; margin-top:6px; display:block;">Chọn Chức vụ Mới:</label>
                <select id="admin-target-role" class="form-control" style="font-size:12px; margin-top:4px;">
                    <option value="Thành viên">Thành viên</option>
                    <option value="Lớp trưởng">Lớp trưởng</option>
                    <option value="Lớp phó học tập">Lớp phó học tập</option>
                    <option value="Lớp phó lao động">Lớp phó lao động</option>
                    <option value="Bí thư">Bí thư</option>
                    <option value="Phó bí thư">Phó bí thư</option>
                    <option value="Ủy viên">Ủy viên</option>
                    <option value="Thủ quỹ">Thủ quỹ</option>
                    <option value="Lớp phó văn thể mỹ">Lớp phó văn thể mỹ</option>
                </select>
                <button onclick="adminAssignRole()" class="btn btn-primary btn-block" style="margin-top:8px;">⚡ Cập Nhật Chức Vụ</button>
            </div>
        </div>
    `;
}

function adminAssignRole() {
    let targetName = document.getElementById('admin-target-user').value;
    let newRole = document.getElementById('admin-target-role').value;

    let users = JSON.parse(localStorage.getItem('T132_USERS')) || [];
    let u = users.find(x => x.name === targetName);
    if (u) {
        u.role = newRole;
        localStorage.setItem('T132_USERS', JSON.stringify(users));
        alert(`⚡ Đã chỉ định ${targetName} làm "${newRole}"!`);
        window.location.reload();
    }
}


/* --------------------------------------------------------------------------
   3. TÍNH NĂNG ĐĂNG XUẤT TÀI KHOẢN
   -------------------------------------------------------------------------- */
function logoutUser() {
    if (confirm("🚪 Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?")) {
        let currentUser = null;
        try { currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')); } catch(e){}

        if (currentUser && currentUser.name) {
            let users = JSON.parse(localStorage.getItem('T132_USERS')) || [];
            let u = users.find(x => x.name === currentUser.name);
            if (u) u.isOnline = false;
            localStorage.setItem('T132_USERS', JSON.stringify(users));
        }

        // Xóa hoàn toàn tài khoản hiện tại
        localStorage.removeItem('T132_CURRENT_USER');
        window.location.reload();
    }
}


/* --------------------------------------------------------------------------
   4. BẢO MẬT KHÓA TRANG WEB & XÁC THỰC TÀI KHOẢN (5 THÔNG TIN / MẬT KHẨU)
   -------------------------------------------------------------------------- */
function getAuthAccountMap() {
    try {
        return JSON.parse(localStorage.getItem('T132_AUTH_ACCOUNTS')) || {};
    } catch(e) {
        return {};
    }
}

function saveAuthAccountMap(map) {
    localStorage.setItem('T132_AUTH_ACCOUNTS', JSON.stringify(map));
}

function getNextMidnightTimestamp() {
    let now = new Date();
    let midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return midnight.getTime();
}

function checkAuthStatusAndLockUI() {
    let currentUser = null;
    try { currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')); } catch(e){}

    let header = document.querySelector('header');
    let mainApp = document.getElementById('main-app');
    let nav = document.querySelector('nav');
    let authModal = document.getElementById('auth-modal-body');

    if (!currentUser || !currentUser.name) {
        // CHƯA ĐĂNG NHẬP -> ẨN TOÀN BỘ TRANG WEB
        if (header) header.style.display = 'none';
        if (mainApp) mainApp.style.display = 'none';
        if (nav) nav.style.display = 'none';

        if (authModal) {
            authModal.style.display = 'flex';
            authModal.style.position = 'fixed';
            authModal.style.top = '0';
            authModal.style.left = '0';
            authModal.style.width = '100vw';
            authModal.style.height = '100vh';
            authModal.style.background = '#f1f5f9';
            authModal.style.zIndex = '999999';
            authModal.style.alignItems = 'center';
            authModal.style.justifyContent = 'center';
            authModal.style.padding = '16px';
            authModal.style.boxSizing = 'border-box';
            authModal.style.overflowY = 'auto';

            renderAuthLoginForm();
        }
    } else {
        // ĐÃ ĐĂNG NHẬP -> HIỆN TRANG WEB & CẬP NHẬT HEADER
        if (header) header.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'block';
        if (nav) nav.style.display = 'flex';
        if (authModal) authModal.style.display = 'none';

        let users = JSON.parse(localStorage.getItem('T132_USERS')) || [];
        let u = users.find(x => x.name === currentUser.name) || {};
        let userRole = u.role || (currentUser.name === "Hoàng Ngọc Minh Tâm" ? "Admin" : "Học sinh");

        let usernameEl = document.getElementById('header-username');
        let avatarEl = document.getElementById('header-avatar');
        let badgeEl = document.getElementById('user-role-badge');

        if (usernameEl) usernameEl.innerText = currentUser.name;
        if (avatarEl) avatarEl.src = currentUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        if (badgeEl) badgeEl.innerText = userRole;

        // TỰ ĐỘNG THÊM NÚT ĐĂNG XUẤT NẾU CHƯA CÓ
        if (header && !document.getElementById('header-logout-btn')) {
            let rightHeaderBox = header.querySelector('div[style*="align-items:center"]') || header;
            let logoutBtn = document.createElement('button');
            logoutBtn.id = 'header-logout-btn';
            logoutBtn.onclick = logoutUser;
            logoutBtn.className = 'btn btn-danger';
            logoutBtn.style.cssText = 'font-size:10px; padding:3px 8px; margin-left:8px; font-weight:bold; cursor:pointer;';
            logoutBtn.innerHTML = '🚪 Đăng xuất';
            rightHeaderBox.appendChild(logoutBtn);
        }

        renderAdminPanel();
    }
}

function renderAuthLoginForm() {
    let container = document.getElementById('auth-modal-body');
    if (!container) return;

    let db = (typeof T132_STUDENT_DATABASE !== 'undefined') ? T132_STUDENT_DATABASE : [];

    let optionsHtml = db.map(s => 
        `<option value="${s.name}">${s.stt}. ${s.name}</option>`
    ).join('');

    container.innerHTML = `
        <div style="background:#fff; padding:20px; border-radius:18px; width:100%; max-width:380px; box-shadow:0 10px 30px rgba(0,0,0,0.15); border:2px solid #2563eb;">
            <h3 style="text-align:center; color:#2563eb; margin-top:0; font-size:17px;">🔐 CỔNG ĐĂNG NHẬP CHI ĐOÀN 10T2</h3>

            <div style="margin-bottom:12px;">
                <label style="font-size:11px; font-weight:bold; color:#334155;">👤 Chọn Tên Học Sinh:</label>
                <select id="auth-select-name" onchange="onStudentSelectChange()" class="form-control" style="font-size:12px; margin-top:4px;">
                    <option value="">-- Chọn tên của bạn --</option>
                    ${optionsHtml}
                </select>
            </div>

            <div id="auth-dynamic-form-box" style="display:none;"></div>

            <div style="margin-top:14px; text-align:center; border-top:1px dashed #cbd5e1; padding-top:8px;">
                <button onclick="promptAdminUnlockAccount()" style="background:none; border:none; color:#dc2626; font-size:10px; cursor:pointer; text-decoration:underline;">
                    🔑 Bị khóa tài khoản? Nhờ Quản trị viên mở khóa ngay
                </button>
            </div>
        </div>
    `;
}

function onStudentSelectChange() {
    let selectedName = document.getElementById('auth-select-name').value;
    let box = document.getElementById('auth-dynamic-form-box');

    if (!selectedName) {
        box.style.display = 'none';
        return;
    }

    box.style.display = 'block';
    let authMap = getAuthAccountMap();
    let account = authMap[selectedName] || { failedCount: 0, lockedUntil: 0, password: null };
    let now = Date.now();

    if (account.lockedUntil && now < account.lockedUntil) {
        box.innerHTML = `
            <div style="background:#fee2e2; border:1px solid #f87171; color:#991b1b; padding:12px; border-radius:10px; font-size:11px; text-align:center;">
                <b>🛑 TÀI KHOẢN ĐÃ BỊ KHÓA!</b><br>
                Bạn đã nhập sai quá 5 lần.<br>
                Tài khoản tự mở lại lúc <b>00:00 ngày hôm sau</b>.<br>
                <i>(Hoặc nhờ Admin Hoàng Ngọc Minh Tâm mở khóa)</i>
            </div>
        `;
        return;
    }

    if (!account.password) {
        box.innerHTML = `
            <div style="background:#eff6ff; border:1px solid #bfdbfe; padding:10px; border-radius:10px; margin-bottom:10px; font-size:11px; color:#1e40af;">
                💡 <b>Đăng nhập lần đầu:</b> Vui lòng nhập đúng 5 thông tin hồ sơ để tạo mật khẩu!
            </div>

            <div style="display:flex; flex-direction:column; gap:6px; font-size:11px;">
                <div>
                    <label><b>1. Số điện thoại:</b></label>
                    <input type="tel" id="auth-input-phone" class="form-control" placeholder="VD: 968737103">
                </div>
                <div>
                    <label><b>2. Quê quán (Tỉnh/TP):</b></label>
                    <input type="text" id="auth-input-hometown" class="form-control" placeholder="VD: Thanh Hóa, TPHCM, Đà Nẵng...">
                </div>
                <div>
                    <label><b>3. Dân tộc:</b></label>
                    <input type="text" id="auth-input-ethnicity" class="form-control" placeholder="VD: Kinh, Hoa...">
                </div>
                <div>
                    <label><b>4. Sinh nhật (Ngày/Tháng/Năm):</b></label>
                    <input type="text" id="auth-input-dob" class="form-control" placeholder="VD: 11/02/2010">
                </div>
                <div>
                    <label><b>5. Gmail cá nhân:</b></label>
                    <input type="email" id="auth-input-email" class="form-control" placeholder="VD: email@gmail.com">
                </div>

                <div id="auth-error-msg" style="color:#dc2626; font-weight:bold; font-size:10px; min-height:14px;"></div>

                <button onclick="verifyFirstTimeLogin()" class="btn btn-primary btn-block" style="margin-top:4px; font-size:12px; padding:8px;">
                    🛡️ Xác Minh Hồ Sơ & Tạo Mật Khẩu
                </button>
            </div>
        `;
    } else {
        box.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:8px; font-size:11px;">
                <div style="background:#f0fdf4; border:1px solid #86efac; padding:8px; border-radius:8px; color:#166534;">
                    🔑 Nhập mật khẩu cá nhân để vào Sảnh.
                </div>

                <div>
                    <label><b>Mật Khẩu Cá Nhân:</b></label>
                    <input type="password" id="auth-input-password" class="form-control" placeholder="Nhập mật khẩu..." style="font-size:12px;">
                </div>

                <div id="auth-error-msg" style="color:#dc2626; font-weight:bold; font-size:10px; min-height:14px;"></div>

                <button onclick="loginWithPassword()" class="btn btn-primary btn-block" style="font-size:12px; padding:8px;">
                    🚀 Đăng Nhập Ngay
                </button>
            </div>
        `;
    }
}

function verifyFirstTimeLogin() {
    let name = document.getElementById('auth-select-name').value;
    let phone = cleanPhone(document.getElementById('auth-input-phone').value);
    let hometown = cleanStr(document.getElementById('auth-input-hometown').value);
    let ethnicity = cleanStr(document.getElementById('auth-input-ethnicity').value);
    let dob = cleanStr(document.getElementById('auth-input-dob').value);
    let email = cleanStr(document.getElementById('auth-input-email').value);

    let errBox = document.getElementById('auth-error-msg');
    let studentRecord = (typeof T132_STUDENT_DATABASE !== 'undefined') ? T132_STUDENT_DATABASE.find(s => s.name === name) : null;

    if (!studentRecord) return;

    let matchPhone = (cleanPhone(studentRecord.phone) === phone);
    let matchHometown = (cleanStr(studentRecord.hometown) === hometown);
    let matchEthnicity = (cleanStr(studentRecord.ethnicity) === ethnicity);
    let matchDob = (cleanStr(studentRecord.dob) === dob);
    let matchEmail = (cleanStr(studentRecord.email) === email);

    let isAllCorrect = matchPhone && matchHometown && matchEthnicity && matchDob && matchEmail;

    let authMap = getAuthAccountMap();
    if (!authMap[name]) authMap[name] = { failedCount: 0, lockedUntil: 0, password: null };

    if (isAllCorrect) {
        let newPassword = prompt(`🎉 Xác minh thành công!\nHãy tạo Mật Khẩu mới cho tài khoản [ ${name} ]:`);
        if (!newPassword || newPassword.trim().length < 3) {
            alert("⚠️ Mật khẩu phải có ít nhất 3 ký tự!");
            return;
        }

        authMap[name].password = newPassword.trim();
        authMap[name].failedCount = 0;
        saveAuthAccountMap(authMap);

        alert(`✅ Đã thiết lập mật khẩu thành công!`);
        loginSuccess(studentRecord);
    } else {
        authMap[name].failedCount = (authMap[name].failedCount || 0) + 1;
        let leftAttempts = 5 - authMap[name].failedCount;

        if (authMap[name].failedCount >= 5) {
            authMap[name].lockedUntil = getNextMidnightTimestamp();
            saveAuthAccountMap(authMap);
            alert(`🛑 Nhập sai 5 lần! Tài khoản [ ${name} ] bị khóa đến 00:00 ngày hôm sau.`);
            onStudentSelectChange();
        } else {
            saveAuthAccountMap(authMap);
            if (errBox) errBox.innerText = `⚠️ Thông tin chưa chính xác! (Còn ${leftAttempts}/5 lần thử)`;
        }
    }
}

function loginWithPassword() {
    let name = document.getElementById('auth-select-name').value;
    let pwdInput = document.getElementById('auth-input-password').value.trim();
    let errBox = document.getElementById('auth-error-msg');

    let authMap = getAuthAccountMap();
    let account = authMap[name];
    let studentRecord = (typeof T132_STUDENT_DATABASE !== 'undefined') ? T132_STUDENT_DATABASE.find(s => s.name === name) : null;

    if (account && account.password === pwdInput) {
        account.failedCount = 0;
        saveAuthAccountMap(authMap);
        loginSuccess(studentRecord);
    } else {
        if (account) {
            account.failedCount = (account.failedCount || 0) + 1;
            let leftAttempts = 5 - account.failedCount;

            if (account.failedCount >= 5) {
                account.lockedUntil = getNextMidnightTimestamp();
                saveAuthAccountMap(authMap);
                alert(`🛑 Nhập sai 5 lần! Tài khoản [ ${name} ] bị khóa đến 00:00 ngày hôm sau.`);
                onStudentSelectChange();
            } else {
                saveAuthAccountMap(authMap);
                if (errBox) errBox.innerText = `⚠️ Mật khẩu sai! (Còn ${leftAttempts}/5 lần thử)`;
            }
        }
    }
}

function loginSuccess(student) {
    let name = student ? student.name : "Thành viên";
    let stt = student ? student.stt : 0;

    let users = JSON.parse(localStorage.getItem('T132_USERS')) || [];
    let existingUser = users.find(x => x.name === name) || {};

    let currentUserObj = {
        name: name,
        stt: stt,
        role: existingUser.role || (name === "Hoàng Ngọc Minh Tâm" ? "Admin" : "Thành viên"),
        avatar: existingUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
    };

    localStorage.setItem('T132_CURRENT_USER', JSON.stringify(currentUserObj));

    let u = users.find(x => x.name === name);
    if (u) u.isOnline = true;
    localStorage.setItem('T132_USERS', JSON.stringify(users));

    alert(`🎉 Chúc mừng ${name} đã đăng nhập thành công!`);
    checkAuthStatusAndLockUI();
    window.location.reload();
}

function promptAdminUnlockAccount() {
    let adminPass = prompt("🔑 Nhập Mật Mã Quản Trị Viên (Ban Cán Sự):");
    if (adminPass === "10T2" || adminPass === "admin123") {
        let name = prompt("Nhập đầy đủ Họ và Tên học sinh cần mở khóa:");
        if (name) {
            let authMap = getAuthAccountMap();
            if (authMap[name]) {
                authMap[name].failedCount = 0;
                authMap[name].lockedUntil = 0;
                saveAuthAccountMap(authMap);
                alert(`✅ Đã khôi phục mở khóa cho học sinh [ ${name} ]!`);
                onStudentSelectChange();
            } else {
                alert("⚠️ Không tìm thấy tên học sinh này.");
            }
        }
    } else if (adminPass !== null) {
        alert("⚠️ Mật mã Quản trị viên không đúng!");
    }
}

document.addEventListener("DOMContentLoaded", function() {
    checkAuthStatusAndLockUI();
});
