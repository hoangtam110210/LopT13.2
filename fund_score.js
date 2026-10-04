/* ========================================================
   MODULE QUẢN LÝ QUỸ LỚP - GIAO DIỆN LỊCH SỬ TỐI ƯU VISUAL
   ======================================================== */

let currentFundFilter = 'ALL'; // 'ALL', 'INCOME', 'EXPENSE'

// Hàm định dạng số tiền VND (VD: 50000 -> 50.000 VNĐ)
function formatMoneyVND(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + " VNĐ";
}

// Render chính cho Tab Quỹ Lớp
function renderFundTab() {
    let container = document.getElementById('fund-container-box');
    if (!container) return;

    let transactions = [];
    try {
        let saved = JSON.parse(localStorage.getItem('T132_FUND'));
        if (Array.isArray(saved)) transactions = saved;
    } catch (e) {}

    let isBCS = (typeof isBCSMember === 'function') ? isBCSMember() : true;

    // Tính toán số liệu thống kê
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
        let val = parseFloat(t.amount) || 0;
        if (t.type === 'INCOME') {
            totalIncome += val;
        } else {
            totalExpense += val;
        }
    });

    let currentBalance = totalIncome - totalExpense;

    // --- PHẦN 1: TỔNG QUAN SỐ DƯ & THỐNG KÊ ---
    let statsHtml = `
        <div style="background: linear-gradient(135deg, #d8f3dc 0%, #b7e4c7 100%); border: 2px solid #52b788; border-radius: 18px; padding: 14px; text-align: center; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(82,183,136,0.15);">
            <small style="color: #1b4332; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">💰 SỐ DƯ QUỸ LỚP HIỆN TẠI</small>
            <h2 style="color: #2b8a3e; font-size: 24px; font-weight: 900; margin: 4px 0 0 0;">${formatMoneyVND(currentBalance)}</h2>
        </div>

        <div class="grid-2" style="gap: 8px; margin-bottom: 14px;">
            <div style="background: #e6fcf5; border: 1px solid #63e6be; padding: 10px; border-radius: 14px; text-align: center;">
                <small style="color: #0ca678; font-size: 10px; font-weight: bold;">📈 TỔNG THU (+)</small>
                <div style="color: #099268; font-size: 14px; font-weight: 800; margin-top: 2px;">+${formatMoneyVND(totalIncome)}</div>
            </div>
            <div style="background: #fff5f5; border: 1px solid #ffc9c9; padding: 10px; border-radius: 14px; text-align: center;">
                <small style="color: #f03e3e; font-size: 10px; font-weight: bold;">📉 TỔNG CHI (-)</small>
                <div style="color: #e03131; font-size: 14px; font-weight: 800; margin-top: 2px;">-${formatMoneyVND(totalExpense)}</div>
            </div>
        </div>
    `;

    // --- PHẦN 2: FORM TẠO GIAO DỊCH (DÀNH CHO THỦ QUỸ / BAN CÁN SỰ) ---
    let formHtml = "";
    if (isBCS) {
        formHtml = `
            <div class="card" style="margin-bottom: 14px; background: #fff; border-top: 4px solid var(--primary-color);">
                <h3 style="color: var(--text-color); margin-bottom: 10px;">➕ Ban Cán Sự: Cập Nhật Thu / Chi Quỹ</h3>
                
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <label style="flex: 1; text-align: center; background: #e6fcf5; border: 1px solid #63e6be; padding: 8px; border-radius: 10px; cursor: pointer; font-size: 11px; font-weight: bold; color: #099268;">
                        <input type="radio" name="fund-type-radio" value="INCOME" checked> 💵 Thu Quỹ (+)
                    </label>
                    <label style="flex: 1; text-align: center; background: #fff5f5; border: 1px solid #ffc9c9; padding: 8px; border-radius: 10px; cursor: pointer; font-size: 11px; font-weight: bold; color: #e03131;">
                        <input type="radio" name="fund-type-radio" value="EXPENSE"> 💸 Chi Tiêu (-)
                    </label>
                </div>

                <div style="margin-bottom: 6px;">
                    <label style="font-size: 11px; font-weight: bold;">Số tiền (VNĐ):</label>
                    <input type="number" id="fund-amount-input" class="form-control" placeholder="VD: 50000" style="font-size: 12px;">
                </div>

                <div style="margin-bottom: 6px;">
                    <label style="font-size: 11px; font-weight: bold;">Nội dung / Lý do Thu Chi:</label>
                    <input type="text" id="fund-title-input" class="form-control" placeholder="VD: Thu quỹ tháng 10, Mua phấn lau bảng..." style="font-size: 12px;">
                </div>

                <div style="margin-bottom: 8px;">
                    <label style="font-size: 11px; font-weight: bold;">Ngày thực hiện:</label>
                    <input type="date" id="fund-date-input" class="form-control" value="${new Date().toISOString().split('T')[0]}" style="font-size: 11px;">
                </div>

                <button onclick="saveFundTransaction()" class="btn btn-primary btn-block" style="font-size: 12px; padding: 8px;">💾 Lưu Giao Dịch Vào Quỹ</button>
            </div>
        `;
    }

    // --- PHẦN 3: LỌC NGUỒN VÀ DANH SÁCH LỊCH SỬ TỐI ƯU ---
    let filteredList = transactions.filter(t => {
        if (currentFundFilter === 'INCOME') return t.type === 'INCOME';
        if (currentFundFilter === 'EXPENSE') return t.type === 'EXPENSE';
        return true;
    });

    let historyListHtml = "";
    if (filteredList.length === 0) {
        historyListHtml = `<p style="color:#888; font-size:12px; text-align:center; padding:12px 0;">Không có giao dịch nào trong danh mục này.</p>`;
    } else {
        historyListHtml = filteredList.map(t => {
            let isIncome = (t.type === 'INCOME');
            let badgeBg = isIncome ? '#d3f9d8' : '#ffe3e3';
            let badgeColor = isIncome ? '#2b8a3e' : '#e03131';
            let sign = isIncome ? '+' : '-';
            let borderLeft = isIncome ? '#40c057' : '#fa5252';

            return `
                <div style="background: #fff; border: 1px solid #e9ecef; border-left: 5px solid ${borderLeft}; border-radius: 12px; padding: 10px 12px; margin-bottom: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <span style="background: ${badgeBg}; color: ${badgeColor}; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 6px; text-transform: uppercase;">
                                ${isIncome ? '💵 THU QUỸ' : '💸 CHI TIÊU'}
                            </span>
                            <h4 style="margin: 4px 0 2px 0; font-size: 13px; color: #212529;">${t.title}</h4>
                            <small style="color: #868e96; font-size: 10px;">📅 Ngày: ${t.date} | Người cập nhật: <b>${t.createdBy || 'Thủ quỹ'}</b></small>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 14px; font-weight: 900; color: ${badgeColor};">
                                ${sign}${formatMoneyVND(t.amount)}
                            </div>
                            ${isBCS ? `
                                <button onclick="deleteFundTransaction(${t.id})" style="background: none; border: none; color: #fa5252; font-size: 11px; cursor: pointer; margin-top: 4px; padding: 2px 4px;">🗑️ Xoá</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    let filterButtonsHtml = `
        <div style="display: flex; gap: 6px; margin-bottom: 10px;">
            <button onclick="setFundFilter('ALL')" class="btn" style="flex:1; font-size:10px; padding:4px; background:${currentFundFilter === 'ALL' ? 'var(--primary-color)' : '#e9ecef'}; color:${currentFundFilter === 'ALL' ? '#fff' : '#495057'};">Tất Cả (${transactions.length})</button>
            <button onclick="setFundFilter('INCOME')" class="btn" style="flex:1; font-size:10px; padding:4px; background:${currentFundFilter === 'INCOME' ? '#2b8a3e' : '#e9ecef'}; color:${currentFundFilter === 'INCOME' ? '#fff' : '#495057'};">Chỉ Thu (+)</button>
            <button onclick="setFundFilter('EXPENSE')" class="btn" style="flex:1; font-size:10px; padding:4px; background:${currentFundFilter === 'EXPENSE' ? '#e03131' : '#e9ecef'}; color:${currentFundFilter === 'EXPENSE' ? '#fff' : '#495057'};">Chỉ Chi (-)</button>
        </div>
    `;

    container.innerHTML = `
        ${statsHtml}
        ${formHtml}
        <div class="card">
            <h3 style="color: var(--text-color); margin-bottom: 8px;">📜 Lịch Sử Thu - Chi Quỹ Lớp</h3>
            ${filterButtonsHtml}
            <div>${historyListHtml}</div>
        </div>
    `;
}

// Chuyển bộ lọc Thu / Chi
function setFundFilter(filterType) {
    currentFundFilter = filterType;
    renderFundTab();
}

// Lưu giao dịch mới
function saveFundTransaction() {
    let typeRadios = document.getElementsByName('fund-type-radio');
    let type = "INCOME";
    for (let r of typeRadios) {
        if (r.checked) type = r.value;
    }

    let amountInput = document.getElementById('fund-amount-input');
    let titleInput = document.getElementById('fund-title-input');
    let dateInput = document.getElementById('fund-date-input');

    let amount = parseFloat(amountInput ? amountInput.value : 0);
    let title = titleInput ? titleInput.value.trim() : "";
    let date = dateInput ? dateInput.value : "";

    if (!amount || amount <= 0) {
        alert("⚠️ Vui lòng nhập số tiền hợp lệ!");
        return;
    }

    if (!title) {
        alert("⚠️ Vui lòng nhập nội dung lý do Thu / Chi!");
        return;
    }

    let transactions = [];
    try {
        let saved = JSON.parse(localStorage.getItem('T132_FUND'));
        if (Array.isArray(saved)) transactions = saved;
    } catch (e) {}

    let currentUser = {};
    try { currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {}; } catch(e) {}

    transactions.unshift({
        id: Date.now(),
        type: type,
        amount: amount,
        title: title,
        date: date || new Date().toLocaleDateString('vi-VN'),
        createdBy: currentUser.name || "Thủ quỹ"
    });

    localStorage.setItem('T132_FUND', JSON.stringify(transactions));
    alert(`💰 Đã ghi nhận giao dịch ${type === 'INCOME' ? 'THU' : 'CHI'} (${formatMoneyVND(amount)}) thành công!`);

    if (amountInput) amountInput.value = "";
    if (titleInput) titleInput.value = "";
    renderFundTab();
}

// Xoá giao dịch
function deleteFundTransaction(id) {
    if (!confirm("Bạn có chắc chắn muốn xoá mục giao dịch quỹ này?")) return;

    let transactions = [];
    try {
        let saved = JSON.parse(localStorage.getItem('T132_FUND'));
        if (Array.isArray(saved)) transactions = saved;
    } catch (e) {}

    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('T132_FUND', JSON.stringify(transactions));
    renderFundTab();
}
