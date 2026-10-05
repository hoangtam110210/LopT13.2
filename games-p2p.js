/* ==========================================================================
   MODULE P2P REALTIME TOÀN CẦU (ĐỒNG BỘ AVATAR, BẢNG TIN & RANDOM CHO CẢ LỚP)
   ========================================================================== */

const MAX_CLASS_PLAYERS = 35; 
const DEFAULT_AVATAR_P2P = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%2388c999'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='40'>🍀</text></svg>";

let peer = null;
let myRoomCode = "";
let isHost = false;

let hostConnections = []; 
let clientConn = null; 
let currentRoomPlayers = [];

/* --------------------------------------------------------------------------
   1. HÀM TỰ ĐỘNG ĐỒNG BỘ DỮ LIỆU CẢ ỨNG DỤNG (AVATAR + BẢNG TIN)
   -------------------------------------------------------------------------- */

// Cập nhật Avatar & Thông tin thành viên vào bộ nhớ máy (Dùng cho Random, Lao động...)
function syncUserToLocalDatabase(userObj) {
    if (!userObj || !userObj.name) return;

    let users = [];
    try { users = JSON.parse(localStorage.getItem('T132_USERS')) || []; } catch(e) {}

    let idx = users.findIndex(u => u.name === userObj.name);
    if (idx !== -1) {
        users[idx].avatar = userObj.avatar || users[idx].avatar;
        users[idx].nickname = userObj.nickname || users[idx].nickname;
    } else {
        users.push({
            name: userObj.name,
            nickname: userObj.nickname || '',
            avatar: userObj.avatar || DEFAULT_AVATAR_P2P,
            role: 'Học sinh'
        });
    }

    localStorage.setItem('T132_USERS', JSON.stringify(users));
}

// Hợp nhất Bài viết Bảng tin giữa các máy
function mergePostsToLocalDatabase(remotePosts) {
    if (!Array.isArray(remotePosts) || remotePosts.length === 0) return;

    let localPosts = [];
    try { localPosts = JSON.parse(localStorage.getItem('T132_POSTS')) || []; } catch(e) {}

    let postMap = new Map();
    localPosts.forEach(p => postMap.set(p.id || (p.author + p.time), p));
    remotePosts.forEach(p => postMap.set(p.id || (p.author + p.time), p));

    let merged = Array.from(postMap.values());
    localStorage.setItem('T132_POSTS', JSON.stringify(merged));

    // Làm mới giao diện Bảng tin ngay lập tức
    if (typeof renderPostsFeed === 'function') renderPostsFeed();
}

// Làm mới toàn bộ giao diện sau khi đồng bộ
function refreshAllAppUI() {
    if (typeof renderRandomModule === 'function') renderRandomModule();
    if (typeof renderPostsFeed === 'function') renderPostsFeed();
    if (typeof renderDisciplineDutyTab === 'function') renderDisciplineDutyTab();
}

function getMyUserInfo() {
    let currentUser = {};
    try { currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {}; } catch(e) {}
    return {
        name: currentUser.name || "Học sinh",
        nickname: currentUser.nickname || "",
        avatar: currentUser.avatar || DEFAULT_AVATAR_P2P
    };
}

/* --------------------------------------------------------------------------
   2. KHỞI TẠO KẾT NỐI P2P REALTIME
   -------------------------------------------------------------------------- */
function initP2PConnection() {
    if (peer) return;

    let myUser = getMyUserInfo();
    syncUserToLocalDatabase(myUser);

    let randomNum = Math.floor(1000 + Math.random() * 9000);
    myRoomCode = "T132-" + randomNum;

    peer = new Peer(myRoomCode);

    peer.on('open', (id) => {
        myRoomCode = id;
        isHost = true;
        currentRoomPlayers = [myUser]; 
        renderP2PStatusHeader();
    });

    peer.on('connection', (conn) => {
        if (!isHost) return;

        if (hostConnections.length >= MAX_CLASS_PLAYERS - 1) {
            conn.send({ type: 'ROOM_FULL', msg: 'Phòng đã đủ 35 người!' });
            setTimeout(() => conn.close(), 500);
            return;
        }

        hostConnections.push(conn);

        conn.on('data', (data) => {
            handleHostReceivedData(conn, data);
        });

        conn.on('close', () => {
            hostConnections = hostConnections.filter(c => c !== conn);
            if (conn.playerInfo) {
                currentRoomPlayers = currentRoomPlayers.filter(p => p.name !== conn.playerInfo.name);
                broadcastRoomStateToAll();
            }
            renderP2PStatusHeader();
        });
    });

    peer.on('error', (err) => {
        console.error("Lỗi P2P:", err);
    });
}

// CHỦ PHÒNG PHÁT SỐNG DANH SÁCH THÀNH VIÊN VÀ BẢNG TIN CHO TẤT CẢ 35 MÁY
function broadcastRoomStateToAll() {
    let localPosts = [];
    try { localPosts = JSON.parse(localStorage.getItem('T132_POSTS')) || []; } catch(e) {}

    let payload = {
        type: 'SYNC_ROOM',
        players: currentRoomPlayers,
        posts: localPosts,
        count: currentRoomPlayers.length,
        max: MAX_CLASS_PLAYERS
    };

    hostConnections.forEach(conn => {
        if (conn.open) conn.send(payload);
    });

    renderP2PStatusHeader();
}

function handleHostReceivedData(conn, data) {
    if (data.type === 'JOIN_ROOM') {
        conn.playerInfo = data.playerInfo;
        
        // 1. Đồng bộ Avatar học sinh vừa vào
        syncUserToLocalDatabase(data.playerInfo);

        // 2. Đồng bộ bài viết Bảng tin từ học sinh vừa vào
        if (data.posts) mergePostsToLocalDatabase(data.posts);

        let existingIdx = currentRoomPlayers.findIndex(p => p.name === data.playerInfo.name);
        if (existingIdx !== -1) {
            currentRoomPlayers[existingIdx] = data.playerInfo;
        } else {
            currentRoomPlayers.push(data.playerInfo);
        }
        
        broadcastRoomStateToAll();
        refreshAllAppUI();
    } else if (data.type === 'CHAT_ALL') {
        hostConnections.forEach(c => { if (c.open) c.send(data); });
        alert(`💬 [${data.sender}]: ${data.text}`);
    }
}

/* --------------------------------------------------------------------------
   3. GIAO DIỆN HIỂN THỊ PHÒNG CHƠI
   -------------------------------------------------------------------------- */
function renderP2PStatusHeader() {
    let container = document.getElementById('p2p-status-box');
    if (!container) return;

    let count = currentRoomPlayers.length;
    let playersListHtml = currentRoomPlayers.map(p => `
        <div style="display:inline-flex; align-items:center; gap:4px; background:#e2e8f0; padding:3px 8px; border-radius:12px; margin:2px; font-size:10px;">
            <img src="${p.avatar || DEFAULT_AVATAR_P2P}" style="width:20px; height:20px; border-radius:50%; object-fit:cover; border:1px solid #94a3b8;">
            <b>${p.name}</b>
        </div>
    `).join('');

    container.innerHTML = `
        <div style="background:#fff; border:1px solid #cbd5e1; padding:10px; border-radius:12px; margin-bottom:10px; font-size:11px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <b>🏠 Mã Phòng: <span style="color:#d90429; font-size:14px; font-weight:bold;">${myRoomCode || 'Đang tạo...'}</span></b>
                <span class="badge" style="background:${count >= MAX_CLASS_PLAYERS ? '#d90429' : '#2b8a3e'}; color:#fff; font-size:10px;">
                    👥 Sĩ số: ${count}/${MAX_CLASS_PLAYERS} người
                </span>
            </div>
            <div style="margin-top:6px; background:#f8fafc; padding:6px; border-radius:6px; border:1px solid #e2e8f0;">
                <b style="font-size:10px; color:#475569;">Thành viên trong phòng (Đã đồng bộ Avatar & Bảng tin):</b><br>
                <div style="max-height:80px; overflow-y:auto; margin-top:4px; display:flex; flex-wrap:wrap; gap:4px;">${playersListHtml}</div>
            </div>
        </div>
    `;
}

function openMiniGameSection(gameKey) {
    let panels = ['xo', 'chess', 'werewolf'];
    panels.forEach(p => {
        let el = document.getElementById(`game-panel-${p}`);
        if (el) el.style.display = 'none';
    });

    let target = document.getElementById(`game-panel-${gameKey}`);
    if (target) target.style.display = 'block';

    initP2PConnection();
    renderGameLobbyUI(gameKey);
}

function renderGameLobbyUI(gameKey) {
    let panelEl = document.getElementById(`game-panel-${gameKey}`);
    if (!panelEl) return;

    let gameName = gameKey === 'xo' ? 'Cờ Caro' : (gameKey === 'chess' ? 'Cờ Vua' : 'Ma Sói (35 Người)');

    panelEl.innerHTML = `
        <div id="p2p-status-box"></div>
        <h4 style="color:var(--text-color); margin-bottom:6px;">🎮 Sảnh Realtime - ${gameName}</h4>
        
        <div class="card" style="background:#f8fafc; border:1px solid #cbd5e1; padding:10px; margin-bottom:10px;">
            <b style="font-size:11px; display:block; margin-bottom:6px;">🚪 Nhập Mã Phòng để đồng bộ Avatar, Bảng tin & chơi game:</b>
            <div style="display:flex; gap:6px;">
                <input type="text" id="target-room-code-input" class="form-control" placeholder="VD: T132-4829..." style="font-size:11px;">
                <button onclick="joinRoomByCode()" class="btn btn-primary" style="font-size:11px; white-space:nowrap;">🔌 Vào Phòng</button>
            </div>
        </div>

        <button onclick="sendTestChatMessage()" class="btn btn-warning btn-block" style="font-size:11px;">💬 Gửi Tin Nhắn Cho Cả Phòng</button>
    `;

    renderP2PStatusHeader();
}

/* --------------------------------------------------------------------------
   4. KẾT NỐI VÀ ĐỒNG BỘ HAI CHIỀU
   -------------------------------------------------------------------------- */
function joinRoomByCode() {
    let input = document.getElementById('target-room-code-input');
    let targetCode = input ? input.value.trim() : "";

    if (!targetCode) return alert("⚠️ Vui lòng nhập Mã Phòng!");
    if (targetCode === myRoomCode) return alert("⚠️ Bạn đang là Chủ phòng của mã này!");

    let myUser = getMyUserInfo();
    let localPosts = [];
    try { localPosts = JSON.parse(localStorage.getItem('T132_POSTS')) || []; } catch(e) {}

    if (!peer) initP2PConnection();

    clientConn = peer.connect(targetCode);
    isHost = false;

    clientConn.on('open', () => {
        alert(`✅ Đã vào phòng [ ${targetCode} ]! Dữ liệu Bảng tin & Avatar đang được đồng bộ...`);
        // Gửi thông tin cá nhân + toàn bộ bài viết trên máy mình sang Chủ phòng
        clientConn.send({ 
            type: 'JOIN_ROOM', 
            playerInfo: myUser,
            posts: localPosts
        });
    });

    clientConn.on('data', (data) => {
        if (data.type === 'SYNC_ROOM') {
            currentRoomPlayers = data.players;
            
            // 1. Cập nhật Avatar của tất cả bạn học vào bộ nhớ máy
            currentRoomPlayers.forEach(p => syncUserToLocalDatabase(p));
            
            // 2. Cập nhật tất cả bài viết Bảng tin vào máy
            if (data.posts) mergePostsToLocalDatabase(data.posts);

            renderP2PStatusHeader();
            refreshAllAppUI();
        } else if (data.type === 'ROOM_FULL') {
            alert("🔒 Phòng đã đủ 35 người!");
        } else if (data.type === 'CHAT_ALL') {
            alert(`💬 [${data.sender}]: ${data.text}`);
        }
    });

    clientConn.on('close', () => {
        alert("❌ Chủ phòng đã giải tán phòng!");
        currentRoomPlayers = [];
        renderP2PStatusHeader();
    });
}

function sendTestChatMessage() {
    let myUser = getMyUserInfo();
    let msgData = { type: 'CHAT_ALL', sender: myUser.name, text: 'Chào cả lớp! Bảng tin & Avatar của mình đã đồng bộ sang máy mọi người chưa? 🚀' };

    if (isHost) handleHostReceivedData(null, msgData);
    else if (clientConn && clientConn.open) clientConn.send(msgData);
    else alert("⚠️ Bạn chưa tham gia vào phòng nào!");
}
