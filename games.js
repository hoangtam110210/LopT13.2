/* ==========================================================================
   MODULE SẢNH MINIGAMES LỚP T13.2 HUB (BẮT BUỘC TẠO VÁN - ĐỦ NGƯỜI MỚI CHƠI)
   ========================================================================== */

function initMiniGamesData() {
    if (!localStorage.getItem('T132_GAME_ROOMS')) {
        localStorage.setItem('T132_GAME_ROOMS', JSON.stringify([])); 
    }
}
initMiniGamesData();

/* --------------------------------------------------------------------------
   0. QUẢN LÝ TRẠNG THÁI ONLINE & ĐIỀU PHỐI SẢNH
   -------------------------------------------------------------------------- */
function T132_getUsersWithOnlineStatus() {
    let users = [];
    try { users = JSON.parse(localStorage.getItem('T132_USERS')) || []; } catch(e) {}
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};

    users.forEach(u => {
        if (currentUser.name && u.name === currentUser.name) u.isOnline = true;
        else if (u.isOnline === undefined) u.isOnline = false;
    });
    localStorage.setItem('T132_USERS', JSON.stringify(users));
    return users;
}

function toggleStudentOnlineStatus(studentName) {
    let users = JSON.parse(localStorage.getItem('T132_USERS')) || [];
    let target = users.find(u => u.name === studentName);
    if (target) {
        target.isOnline = !target.isOnline;
        localStorage.setItem('T132_USERS', JSON.stringify(users));
        renderOnlinePresenceBar();
        if (wwState && wwState.inGame) renderWerewolfInGameUI();
    }
}

function renderOnlinePresenceBar() {
    let container = document.getElementById('online-presence-container');
    if (!container) return;

    let users = T132_getUsersWithOnlineStatus();
    let onlineCount = users.filter(u => u.isOnline).length;

    let listHtml = users.map(u => `
        <button onclick="toggleStudentOnlineStatus('${u.name}')" 
            style="background:${u.isOnline ? '#d8f3dc' : '#f1f3f5'}; color:${u.isOnline ? '#2b8a3e' : '#868e96'}; border:1px solid ${u.isOnline ? '#52b788' : '#ced4da'}; padding:3px 8px; border-radius:12px; font-size:10px; cursor:pointer; font-weight:bold;">
            ${u.isOnline ? '🟢' : '🔴'} ${u.name}
        </button>
    `).join('');

    container.innerHTML = `
        <div style="background:#fff; border:1px solid var(--border-color); padding:8px 12px; border-radius:12px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <b style="font-size:11px; color:var(--primary-color);">🟢 Danh sách Học sinh Online (${onlineCount}/${users.length}):</b>
                <small style="font-size:9px; color:#666;">(Bấm để Bật/Tắt khi test nhiều người)</small>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:4px; max-height:80px; overflow-y:auto;">${listHtml}</div>
        </div>
    `;
}

function openMiniGameSection(gameType) {
    let panelXO = document.getElementById('game-panel-xo');
    let panelChess = document.getElementById('game-panel-chess');
    let panelWerewolf = document.getElementById('game-panel-werewolf');

    if (panelXO) panelXO.style.display = (gameType === 'xo') ? 'block' : 'none';
    if (panelChess) panelChess.style.display = (gameType === 'chess') ? 'block' : 'none';
    if (panelWerewolf) panelWerewolf.style.display = (gameType === 'werewolf') ? 'block' : 'none';

    renderGameRoomsList(gameType);
}

function getGameFullName(gameKey) {
    if (gameKey === 'xo') return 'Cờ Caro XO (40x40)';
    if (gameKey === 'chess') return 'Cờ Vua Quốc Tế';
    if (gameKey === 'werewolf') return 'Ma Sói Realtime';
    return 'Trò chơi';
}

function getMaxPlayers(gameKey) {
    if (gameKey === 'xo') return 2;
    if (gameKey === 'chess') return 2;
    if (gameKey === 'werewolf') return 6; // Ma sói yêu cầu tối thiểu 6 người
    return 2;
}

/* --------------------------------------------------------------------------
   QUẢN LÝ PHÒNG CHƠI (TẠO VÁN - ĐỦ NGƯỜI MỚI CHƠI)
   -------------------------------------------------------------------------- */
function renderGameRoomsList(gameKey) {
    let panelId = `game-panel-${gameKey}`;
    let panelEl = document.getElementById(panelId);
    if (!panelEl) return;

    let gameFullName = getGameFullName(gameKey);
    let maxP = getMaxPlayers(gameKey);

    let rooms = [];
    try {
        rooms = JSON.parse(localStorage.getItem('T132_GAME_ROOMS')) || [];
    } catch(e) {}

    let gameRooms = rooms.filter(r => r.gameKey === gameKey);
    let currentUser = {};
    try { currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {}; } catch(e) {}

    let roomsHtml = "";
    if (gameRooms.length === 0) {
        roomsHtml = `<p style="color:#777; font-size:11px; padding:8px; text-align:center;">Chưa có ván nào được tạo. Hãy bấm "Tạo Ván Mới" bên dưới!</p>`;
    } else {
        roomsHtml = gameRooms.map(room => {
            let isHost = room.hostName === currentUser.name;
            let isJoined = room.players.includes(currentUser.name);
            let isFull = room.players.length >= room.maxPlayers;

            let playersBadge = `<span class="badge" style="background:${isFull ? '#2b8a3e' : '#f59e0b'}; color:#fff; font-size:10px;">${room.players.length}/${room.maxPlayers} người</span>`;
            let playerNamesList = room.players.map(p => `• ${p}`).join('<br>');

            let actionBtn = "";
            if (isJoined) {
                if (isHost) {
                    actionBtn = `
                        <button onclick="startCreatedGameRoom(${room.id})" class="btn btn-primary" style="font-size:10px; padding:4px 10px; margin-top:6px;" ${!isFull ? 'disabled style="background:#ccc; cursor:not-allowed;"' : ''}>
                            ${isFull ? '🚀 Bắt Đầu Ván Chơi' : '⏳ Đang chờ đủ người...'}
                        </button>
                    `;
                } else {
                    actionBtn = `<span style="color:#2b8a3e; font-size:10px; font-weight:bold; display:block; margin-top:6px;">✅ Đã vào phòng (Đang chờ chủ phòng bắt đầu)</span>`;
                }
            } else {
                if (!isFull) {
                    actionBtn = `<button onclick="joinGameRoom(${room.id})" class="btn btn-warning" style="font-size:10px; padding:4px 10px; margin-top:6px;">🚪 Vào Phòng</button>`;
                } else {
                    actionBtn = `<span style="color:#d90429; font-size:10px; font-weight:bold; display:block; margin-top:6px;">🔒 Phòng đã đầy</span>`;
                }
            }

            return `
                <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:10px; margin-bottom:8px; text-align:left; font-size:11px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <b>🏠 Ván của: ${room.hostName}</b>
                        ${playersBadge}
                    </div>
                    <div style="margin-top:6px; color:#333; font-size:10px; background:#fff; padding:6px; border-radius:4px; border:1px solid #e2e8f0;">
                        <b>Thành viên trong phòng:</b><br>${playerNamesList}
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
                        <div>${actionBtn}</div>
                        ${isHost ? `<button onclick="deleteGameRoom(${room.id})" class="btn btn-danger" style="font-size:9px; padding:2px 6px;">🗑️ Xoá ván</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    panelEl.innerHTML = `
        <div id="online-presence-container"></div>
        <h4 style="color:var(--text-color); margin-bottom:6px;">🎮 Sảnh ${gameFullName}</h4>
        <p style="font-size:10px; color:#666; margin-bottom:8px;">Muốn chơi buộc phải <b>Tạo Ván Mới</b>, đủ người trong phòng chủ phòng mới có thể bấm bắt đầu!</p>
        
        <div style="display:flex; gap:6px; margin-bottom:10px;">
            <button onclick="createNewGameRoom('${gameKey}')" class="btn btn-primary" style="flex:2; font-size:11px;">➕ Tạo Ván Mới (${maxP} Người)</button>
            <button onclick="openInvitePlayerModal('${gameFullName}')" class="btn btn-warning" style="flex:1; font-size:11px;">✉️ Mời Bạn Online</button>
        </div>

        <div style="border-top:1px solid #e2e8f0; padding-top:8px; max-height:260px; overflow-y:auto;">
            <b style="font-size:11px; color:#333; display:block; margin-bottom:6px;">📋 Danh Sách Phòng Đang Chờ:</b>
            ${roomsHtml}
        </div>
    `;

    renderOnlinePresenceBar();
}

function createNewGameRoom(gameKey) {
    let currentUser = {};
    try { currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {}; } catch(e) {}
    if (!currentUser.name) {
        alert("⚠️ Vui lòng đăng nhập trước khi tạo ván!");
        return;
    }

    let gameFullName = getGameFullName(gameKey);
    let maxP = getMaxPlayers(gameKey);

    let rooms = [];
    try {
        rooms = JSON.parse(localStorage.getItem('T132_GAME_ROOMS')) || [];
    } catch(e) {}

    let existingRoom = rooms.find(r => r.hostName === currentUser.name && r.gameKey === gameKey);
    if (existingRoom) {
        alert("⚠️ Bạn đã tạo một ván chơi đang chờ rồi!");
        return;
    }

    rooms.push({
        id: Date.now(),
        gameName: gameFullName,
        gameKey: gameKey,
        hostName: currentUser.name,
        maxPlayers: maxP,
        players: [currentUser.name],
        status: 'WAITING'
    });

    localStorage.setItem('T132_GAME_ROOMS', JSON.stringify(rooms));
    alert(`✨ Đã tạo ván ${gameFullName}! Hãy chờ đủ người tham gia...`);
    renderGameRoomsList(gameKey);
}

function joinGameRoom(roomId) {
    let currentUser = {};
    try { currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {}; } catch(e) {}
    if (!currentUser.name) {
        alert("⚠️ Vui lòng đăng nhập!");
        return;
    }

    let rooms = [];
    try {
        rooms = JSON.parse(localStorage.getItem('T132_GAME_ROOMS')) || [];
    } catch(e) {}

    let room = rooms.find(r => r.id === roomId);
    if (!room) {
        alert("⚠️ Phòng không tồn tại!");
        return;
    }

    if (room.players.length >= room.maxPlayers) {
        alert("⚠️ Phòng đã đủ người!");
        return;
    }

    if (room.players.includes(currentUser.name)) {
        alert("Bạn đã ở trong phòng này.");
        return;
    }

    room.players.push(currentUser.name);
    localStorage.setItem('T132_GAME_ROOMS', JSON.stringify(rooms));
    alert(`🚪 Đã vào phòng của ${room.hostName}!`);
    renderGameRoomsList(room.gameKey);
}

function startCreatedGameRoom(roomId) {
    let rooms = [];
    try {
        rooms = JSON.parse(localStorage.getItem('T132_GAME_ROOMS')) || [];
    } catch(e) {}

    let room = rooms.find(r => r.id === roomId);
    if (!room) return;

    if (room.players.length < room.maxPlayers) {
        alert(`⏳ Chưa đủ người (${room.players.length}/${room.maxPlayers}). Phải chờ đủ người mới được chơi!`);
        return;
    }

    alert(`🚀 Đủ người! Bắt đầu ván chơi ${room.gameName}!`);

    if (room.gameKey === 'xo') {
        initCaroGame(room);
    } else if (room.gameKey === 'chess') {
        initChessGame(room);
    } else if (room.gameKey === 'werewolf') {
        startWerewolfRealGame(room);
    }
}

function deleteGameRoom(roomId) {
    if (!confirm("Bạn có chắc chắn muốn giải tán ván chơi này?")) return;
    let rooms = [];
    try {
        rooms = JSON.parse(localStorage.getItem('T132_GAME_ROOMS')) || [];
    } catch(e) {}

    let room = rooms.find(r => r.id === roomId);
    let gameKey = room ? room.gameKey : 'xo';

    rooms = rooms.filter(r => r.id !== roomId);
    localStorage.setItem('T132_GAME_ROOMS', JSON.stringify(rooms));
    renderGameRoomsList(gameKey);
}


/* ==========================================================================
   1. GAME 1: CỜ CARO (XO) 40x40 - BÀN CHƠI THỰC TẾ
   ========================================================================== */
const CARO_SIZE = 40;
let caroBoard = [];
let caroTurn = 'X';
let caroGameOver = false;
let currentActiveCaroRoom = null;

function initCaroGame(room) {
    currentActiveCaroRoom = room || { players: ['Người 1', 'Người 2'] };
    caroBoard = Array(CARO_SIZE).fill(null).map(() => Array(CARO_SIZE).fill(''));
    caroTurn = 'X';
    caroGameOver = false;
    renderCaroBoardUI();
}

function renderCaroBoardUI() {
    let container = document.getElementById('game-panel-xo');
    if (!container) return;

    let p1 = currentActiveCaroRoom ? currentActiveCaroRoom.players[0] : 'Bên X';
    let p2 = currentActiveCaroRoom ? currentActiveCaroRoom.players[1] : 'Bên O';

    let gridHtml = '';
    for (let r = 0; r < CARO_SIZE; r++) {
        gridHtml += '<div style="display:flex;">';
        for (let c = 0; c < CARO_SIZE; c++) {
            let val = caroBoard[r][c];
            let color = val === 'X' ? '#d90429' : (val === 'O' ? '#0284c7' : '#333');
            
            gridHtml += `
                <button onclick="makeCaroMove(${r}, ${c})" 
                    style="width:32px; height:32px; min-width:32px; min-height:32px; border:1px solid #ced4da; background:${val ? '#f8f9fa' : '#fff'}; font-weight:bold; font-size:14px; color:${color}; padding:0; display:flex; align-items:center; justify-content:center; cursor:pointer;">
                    ${val}
                </button>
            `;
        }
        gridHtml += '</div>';
    }

    container.innerHTML = `
        <div id="online-presence-container"></div>
        <h4 style="color:var(--text-color); margin-bottom:6px;">❌⭕ Cờ Caro 40x40 - Ván Đấu: ${p1} (X) vs ${p2} (O)</h4>
        
        <div style="display:flex; justify-content:space-between; align-items:center; background:#e7f5ff; padding:8px 12px; border-radius:10px; margin-bottom:8px; font-size:12px;">
            <span>Lượt đi: <b style="color:${caroTurn === 'X' ? '#d90429' : '#0284c7'}; font-size:14px;">${caroTurn === 'X' ? p1 + ' (X)' : p2 + ' (O)'}</b></span>
            <button onclick="openMiniGameSection('xo')" class="btn btn-danger" style="font-size:10px; padding:3px 8px;">🚪 Rời Bàn Chơi</button>
        </div>

        <div style="max-width:100%; max-height:360px; overflow:auto; border:2px solid var(--primary-color); border-radius:10px; background:#e9ecef;">
            <div style="display:inline-block; padding:4px;">${gridHtml}</div>
        </div>
    `;
    renderOnlinePresenceBar();
}

function makeCaroMove(r, c) {
    if (caroGameOver || caroBoard[r][c] !== '') return;

    caroBoard[r][c] = caroTurn;

    if (checkCaroWin5(r, c, caroTurn)) {
        caroGameOver = true;
        renderCaroBoardUI();
        let winnerName = (caroTurn === 'X') ? (currentActiveCaroRoom?.players[0] || 'Quân X') : (currentActiveCaroRoom?.players[1] || 'Quân O');
        setTimeout(() => alert(`🎉 CHÚC MỪNG! [ ${winnerName} ] đạt 5 ô liên tiếp và ĐÃ THẮNG VÁN!`), 100);
        return;
    }

    caroTurn = (caroTurn === 'X') ? 'O' : 'X';
    renderCaroBoardUI();
}

function checkCaroWin5(row, col, symbol) {
    const directions = [[[0,1],[0,-1]], [[1,0],[-1,0]], [[1,1],[-1,-1]], [[1,-1],[1,-1]]];
    for (let axis of directions) {
        let count = 1;
        for (let [dr, dc] of axis) {
            let r = row + dr, c = col + dc;
            while (r >= 0 && r < CARO_SIZE && c >= 0 && c < CARO_SIZE && caroBoard[r][c] === symbol) {
                count++; r += dr; c += dc;
            }
        }
        if (count >= 5) return true;
    }
    return false;
}


/* ==========================================================================
   2. GAME 2: CỜ VUA QUỐC TẾ (8x8 STANDARD) - BÀN CHƠI THỰC TẾ
   ========================================================================== */
const CHESS_PIECES = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};

let chessBoard = [];
let chessTurn = 'W';
let selectedSquare = null;
let validMoves = [];
let chessMoveHistory = [];
let capturedByWhite = [];
let capturedByBlack = [];
let currentActiveChessRoom = null;

function initChessGame(room) {
    currentActiveChessRoom = room || { players: ['Trắng', 'Đen'] };
    chessBoard = [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R']
    ];
    chessTurn = 'W';
    selectedSquare = null;
    validMoves = [];
    chessMoveHistory = [];
    capturedByWhite = [];
    capturedByBlack = [];
    renderChessUI();
}

function renderChessUI() {
    let container = document.getElementById('game-panel-chess');
    if (!container) return;

    let pWhite = currentActiveChessRoom ? currentActiveChessRoom.players[0] : 'Trắng';
    let pBlack = currentActiveChessRoom ? currentActiveChessRoom.players[1] : 'Đen';

    let boardHtml = '';
    for (let r = 0; r < 8; r++) {
        boardHtml += '<div style="display:flex;">';
        for (let c = 0; c < 8; c++) {
            let isDark = (r + c) % 2 === 1;
            let bgColor = isDark ? '#b58863' : '#f0d9b5';
            let piece = chessBoard[r][c];

            let isSelected = selectedSquare && selectedSquare.r === r && selectedSquare.c === c;
            let isValidMove = validMoves.some(m => m.r === r && m.c === c);

            if (isSelected) bgColor = '#769656';
            if (isValidMove) bgColor = '#baca44';

            let pieceColor = (piece && piece === piece.toUpperCase()) ? '#ffffff' : '#000000';

            boardHtml += `
                <button onclick="handleChessSquareClick(${r}, ${c})" 
                    style="width:40px; height:40px; background:${bgColor}; border:none; font-size:24px; color:${pieceColor}; display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative;">
                    ${CHESS_PIECES[piece] || ''}
                    ${isValidMove && !piece ? `<span style="width:10px; height:10px; background:rgba(0,0,0,0.2); border-radius:50%;"></span>` : ''}
                </button>
            `;
        }
        boardHtml += '</div>';
    }

    let historyStr = chessMoveHistory.length > 0 ? chessMoveHistory.join(', ') : 'Chưa có nước đi.';
    let whiteCapStr = capturedByWhite.length > 0 ? capturedByWhite.join(' ') : 'Chưa ăn quân nào';
    let blackCapStr = capturedByBlack.length > 0 ? capturedByBlack.join(' ') : 'Chưa ăn quân nào';

    container.innerHTML = `
        <div id="online-presence-container"></div>
        <h4 style="color:var(--text-color); margin-bottom:6px;">♟ Cờ Vua Quốc Tế - Ván Đấu: ${pWhite} (Trắng) vs ${pBlack} (Đen)</h4>
        
        <div style="display:flex; justify-content:space-between; align-items:center; background:#e7f5ff; padding:8px 12px; border-radius:10px; margin-bottom:8px; font-size:12px;">
            <span>Lượt đi: <b style="color:${chessTurn === 'W' ? '#d97706' : '#1e293b'};">${chessTurn === 'W' ? '♔ Trắng (' + pWhite + ')' : '♚ Đen (' + pBlack + ')'}</b></span>
            <button onclick="openMiniGameSection('chess')" class="btn btn-danger" style="font-size:10px; padding:3px 8px;">🚪 Rời Bàn Chơi</button>
        </div>

        <div style="background:#f1f3f5; border:1px solid #dee2e6; padding:6px 10px; border-radius:8px; margin-bottom:6px; font-size:11px;">
            <b style="color:#2b8a3e;">♔ Bên Trắng (${pWhite}) đã ăn của Đen:</b> 
            <span style="font-size:16px; margin-left:6px; color:#000;">${whiteCapStr}</span>
        </div>

        <div style="display:flex; justify-content:center; margin-bottom:6px;">
            <div style="border:3px solid #795548; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                ${boardHtml}
            </div>
        </div>

        <div style="background:#f1f3f5; border:1px solid #dee2e6; padding:6px 10px; border-radius:8px; margin-bottom:8px; font-size:11px;">
            <b style="color:#d9480f;">♚ Bên Đen (${pBlack}) đã ăn của Trắng:</b> 
            <span style="font-size:16px; margin-left:6px; color:#fff; text-shadow:0 0 2px #000;">${blackCapStr}</span>
        </div>

        <div style="background:#f8f9fa; padding:8px; border-radius:8px; font-size:11px; margin-bottom:8px;">
            <b>📜 Lịch sử nước đi (SAN):</b>
            <div style="max-height:50px; overflow-y:auto; color:#555; margin-top:2px;">${historyStr}</div>
        </div>
    `;
    renderOnlinePresenceBar();
}

function handleChessSquareClick(r, c) {
    let piece = chessBoard[r][c];
    let isMyPiece = piece && ((chessTurn === 'W' && piece === piece.toUpperCase()) || (chessTurn === 'B' && piece === piece.toLowerCase()));

    if (selectedSquare) {
        let move = validMoves.find(m => m.r === r && m.c === c);
        if (move) {
            executeChessMove(selectedSquare.r, selectedSquare.c, r, c);
            selectedSquare = null;
            validMoves = [];
            return;
        }
    }

    if (isMyPiece) {
        selectedSquare = { r, c };
        validMoves = calculateValidChessMoves(r, c, piece);
        renderChessUI();
    } else {
        selectedSquare = null;
        validMoves = [];
        renderChessUI();
    }
}

function calculateValidChessMoves(r, c, piece) {
    let moves = [];
    let type = piece.toLowerCase();
    let isWhite = (piece === piece.toUpperCase());

    if (type === 'p') {
        let dir = isWhite ? -1 : 1, startRow = isWhite ? 6 : 1;
        if (r + dir >= 0 && r + dir < 8 && chessBoard[r + dir][c] === '') {
            moves.push({ r: r + dir, c: c });
            if (r === startRow && chessBoard[r + 2 * dir][c] === '') moves.push({ r: r + 2 * dir, c: c });
        }
        [-1, 1].forEach(dc => {
            if (c + dc >= 0 && c + dc < 8 && r + dir >= 0 && r + dir < 8) {
                let target = chessBoard[r + dir][c + dc];
                if (target !== '' && (isWhite ? target === target.toLowerCase() : target === target.toUpperCase())) moves.push({ r: r + dir, c: c + dc });
            }
        });
    }

    if (type === 'n') {
        let offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        offsets.forEach(([dr, dc]) => {
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                let target = chessBoard[nr][nc];
                if (target === '' || (isWhite ? target === target.toLowerCase() : target === target.toUpperCase())) moves.push({ r: nr, c: nc });
            }
        });
    }

    if (['r', 'b', 'q', 'k'].includes(type)) {
        let dirs = [];
        if (['r', 'q'].includes(type)) dirs.push([0,1],[0,-1],[1,0],[-1,0]);
        if (['b', 'q'].includes(type)) dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
        if (type === 'k') dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];

        dirs.forEach(([dr, dc]) => {
            let nr = r + dr, nc = c + dc;
            while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                let target = chessBoard[nr][nc];
                if (target === '') {
                    moves.push({ r: nr, c: nc });
                    if (type === 'k') break;
                } else {
                    if (isWhite ? target === target.toLowerCase() : target === target.toUpperCase()) moves.push({ r: nr, c: nc });
                    break;
                }
                nr += dr; nc += dc;
            }
        });
    }
    return moves;
}

function executeChessMove(fromR, fromC, toR, toC) {
    let piece = chessBoard[fromR][fromC];
    let targetPiece = chessBoard[toR][toC];

    if (targetPiece) {
        let symbol = CHESS_PIECES[targetPiece];
        if (targetPiece === targetPiece.toLowerCase()) {
            capturedByWhite.push(symbol);
        } else {
            capturedByBlack.push(symbol);
        }
    }

    chessBoard[toR][toC] = piece;
    chessBoard[fromR][fromC] = '';

    let colNames = ['a','b','c','d','e','f','g','h'];
    chessMoveHistory.push(`${piece.toUpperCase()}${colNames[fromC]}${8-fromR}→${colNames[toC]}${8-toC}`);

    chessTurn = (chessTurn === 'W') ? 'B' : 'W';
    renderChessUI();
}
/* ==========================================================================
   3. GAME 3: MA SÓI REAL-TIME FULL CHAT & TIMER
   ========================================================================== */

let wwState = {
    inGame: false,
    players: [],
    phase: 'LOBBY',
    nightRoleOrder: ['Tiên tri', 'Ma Sói', 'Bảo vệ', 'Phù thủy'],
    currentRoleTurnIndex: 0,
    isTurnLocked: true,
    dayNumber: 1,
    mayorIdx: null,
    timeRemaining: 0,
    timerInterval: null,
    logs: [],
    chatMessages: { LIVING: [], DEAD: [] },
    guardProtected: null,
    werewolfTarget: null,
    witchPoisonTarget: null
};

function startWerewolfRealGame(room) {
    let playerNames = room ? room.players : [];
    if (playerNames.length < 6 || playerNames.length > 20) {
        alert(`⚠ Ván đấu Ma Sói yêu cầu tổng cộng từ 6 đến 20 người chơi! (Hiện tại phòng có ${playerNames.length} người)`);
        return;
    }

    let allUsers = JSON.parse(localStorage.getItem('T132_USERS')) || [];
    let playerList = playerNames.map(name => {
        let u = allUsers.find(x => x.name === name) || {};
        return {
            name: name,
            isAlive: true,
            role: '',
            avatar: u.avatar || DEFAULT_AVATAR,
            isMayor: false
        };
    });

    let roles = allocateWerewolfRolesFull(playerList.length);
    roles.sort(() => Math.random() - 0.5);

    playerList.forEach((p, idx) => { p.role = roles[idx]; });

    wwState = {
        inGame: true,
        players: playerList,
        phase: 'NIGHT',
        nightRoleOrder: ['Tiên tri', 'Ma Sói', 'Bảo vệ', 'Phù thủy'],
        currentRoleTurnIndex: 0,
        isTurnLocked: true,
        dayNumber: 1,
        mayorIdx: null,
        timeRemaining: 30,
        timerInterval: null,
        logs: [`🌙 Đêm thứ 1 bắt đầu. Cả làng đi ngủ...`],
        chatMessages: { LIVING: [], DEAD: [] },
        guardProtected: null,
        werewolfTarget: null,
        witchPoisonTarget: null
    };

    startPhaseTimer(30);
    renderWerewolfInGameUI();
}

function allocateWerewolfRolesFull(count) {
    if (count === 6) return ['Ma Sói', 'Tiên tri', 'Bảo vệ', 'Dân thường', 'Dân thường', 'Dân thường'];
    if (count === 8) return ['Ma Sói', 'Ma Sói', 'Tiên tri', 'Bảo vệ', 'Phù thủy', 'Dân thường', 'Dân thường', 'Dân thường'];
    let roles = ['Ma Sói', 'Ma Sói', 'Tiên tri', 'Bảo vệ', 'Phù thủy', 'Kẻ chán đời'];
    while (roles.length < count) roles.push('Dân thường');
    return roles;
}

function startPhaseTimer(seconds) {
    if (wwState.timerInterval) clearInterval(wwState.timerInterval);
    wwState.timeRemaining = seconds;

    wwState.timerInterval = setInterval(() => {
        wwState.timeRemaining--;
        let timerEl = document.getElementById('ww-timer-display');
        if (timerEl) timerEl.innerText = `${wwState.timeRemaining}s`;

        if (wwState.timeRemaining <= 0) {
            clearInterval(wwState.timerInterval);
            handlePhaseTimeout();
        }
    }, 1000);
}

function handlePhaseTimeout() {
    if (wwState.phase === 'NIGHT') {
        finishNightTurnAndLockNext();
    } else if (wwState.phase === 'DAY_DISCUSSION') {
        wwState.phase = 'DAY_VOTING';
        wwState.logs.unshift(`⌛ Hết giờ thảo luận! Chuyển sang Phase Bỏ Phiếu Treo Cổ (30s).`);
        startPhaseTimer(30);
        renderWerewolfInGameUI();
    } else if (wwState.phase === 'DAY_VOTING') {
        wwState.logs.unshift(`⌛ Hết giờ bỏ phiếu! Không ai bị treo cổ trong lượt này.`);
        startNextNightPhase();
    }
}

function renderWerewolfInGameUI() {
    let container = document.getElementById('game-panel-werewolf');
    if (!container) return;

    if (wwState.phase === 'NIGHT' && wwState.isTurnLocked) {
        let currentRole = wwState.nightRoleOrder[wwState.currentRoleTurnIndex];
        let roleHolders = wwState.players.filter(p => p.isAlive && p.role === currentRole);

        if (roleHolders.length === 0) {
            wwState.currentRoleTurnIndex++;
            if (wwState.currentRoleTurnIndex >= wwState.nightRoleOrder.length) {
                resolveNightEventsAndStartDay();
            } else {
                renderWerewolfInGameUI();
            }
            return;
        }

        let namesStr = roleHolders.map(p => p.name).join(', ');

        container.innerHTML = `
            <div style="background:#0f172a; color:#f8fafc; padding:20px; border-radius:16px; border:2px solid #3b82f6; text-align:center;">
                <h3 style="color:#c084fc;">🌙 BAN ĐÊM THỨ ${wwState.dayNumber}</h3>
                <div style="font-size:36px; margin:14px 0;">🙈</div>
                <h4 style="color:#f6ad55;">LƯỢT THỨC DẬY: [ ${currentRole.toUpperCase()} ]</h4>
                <p style="font-size:11px; color:#94a3b8;">Đưa điện thoại cho người giữ vai trò này: <b>${namesStr}</b></p>
                <div style="font-size:16px; font-weight:bold; color:#e2e8f0; margin:10px 0;">⏱️️ Thời gian: <span id="ww-timer-display">${wwState.timeRemaining}s</span></div>
                <button onclick="unlockNightTurnSecret()" class="btn btn-warning btn-block" style="margin-top:10px; font-weight:bold; padding:10px;">🔓 Bấm Mở Mắt Đã Đến Lượt Tôi</button>
            </div>
        `;
        return;
    }

    let isNight = (wwState.phase === 'NIGHT');
    let currentActiveRole = isNight ? wwState.nightRoleOrder[wwState.currentRoleTurnIndex] : '';

    let playersHtml = wwState.players.map((p, idx) => `
        <div style="background:${p.isAlive ? '#2d3748' : '#1a202c'}; color:${p.isAlive ? '#fff' : '#718096'}; padding:8px; border-radius:10px; border:1px solid ${p.isAlive ? '#4a5568' : '#2d3748'}; text-align:center; font-size:11px; position:relative;">
            ${p.isMayor ? `<span style="position:absolute; top:2px; right:4px; font-size:12px;">🎖️</span>` : ''}
            <img src="${p.avatar}" style="width:36px; height:36px; border-radius:50%; filter:${p.isAlive ? 'none' : 'grayscale(100%)'};">
            <div style="font-weight:bold; margin-top:2px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${p.name}</div>
            <small style="font-size:9px; color:${p.isAlive ? '#68d391' : '#fc8181'};">${p.isAlive ? '🟢 Sống' : '☠ Chết'}</small>
            
            ${(isNight && p.isAlive) ? renderRoleSpecificActionButton(idx, currentActiveRole) : ''}
            ${(wwState.phase === 'DAY_ELECTION' && p.isAlive) ? `
                <button onclick="electMayor(${idx})" class="btn btn-warning" style="font-size:9px; padding:2px 4px; margin-top:4px;">🎖️ Bầu Cảnh Trưởng</button>
            ` : ''}
            ${(wwState.phase === 'DAY_VOTING' && p.isAlive) ? `
                <button onclick="voteToLynchPlayer(${idx})" class="btn btn-danger" style="font-size:9px; padding:2px 4px; margin-top:4px;">🗳 Bỏ phiếu</button>
            ` : ''}
        </div>
    `).join('');

    let logHtml = wwState.logs.map(l => `<div style="margin-bottom:3px; border-bottom:1px dashed #4a5568; padding-bottom:2px;">${l}</div>`).join('');
    let livingChatHtml = wwState.chatMessages.LIVING.map(m => `<div style="margin-bottom:2px;"><b>${m.sender}:</b> ${m.text}</div>`).join('');
    let deadChatHtml = wwState.chatMessages.DEAD.map(m => `<div style="margin-bottom:2px; color:#a7f3d0;"><b>👻 ${m.sender}:</b> ${m.text}</div>`).join('');

    container.innerHTML = `
        <div style="background:#0f172a; color:#f8fafc; padding:14px; border-radius:16px; border:2px solid #3b82f6;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; padding-bottom:8px; margin-bottom:10px;">
                <div>
                    <h4 style="margin:0; color:#c084fc;">
                        ${isNight ? '🌙 LƯỢT: ' + currentActiveRole.toUpperCase() : '☀️ BAN NGÀY THỨ ' + wwState.dayNumber}
                    </h4>
                    <small style="color:#f59e0b; font-size:11px;">⏱️ Còn lại: <b id="ww-timer-display">${wwState.timeRemaining}s</b></small>
                </div>
                <button onclick="stopGameAndReturnLobby()" class="btn btn-danger" style="font-size:10px; padding:2px 6px;">✕ Thoát Ván</button>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap:6px; max-height:200px; overflow-y:auto; margin-bottom:10px;">
                ${playersHtml}
            </div>

            <div style="background:#1e293b; padding:8px; border-radius:10px; font-size:10px; color:#94a3b8; max-height:70px; overflow-y:auto; margin-bottom:10px;">
                <b>📜 Nhật ký ván đấu:</b>
                <div style="margin-top:4px;">${logHtml}</div>
            </div>

            <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:10px;">
                <b style="font-size:11px; color:#38bdf8;">💬 Khung Chat Phân Kênh Ván Đấu:</b>
                
                <div style="display:flex; gap:6px; margin:6px 0;">
                    <button onclick="switchWerewolfChatTab('LIVING')" id="ww-btn-chat-living" class="btn" style="flex:1; font-size:10px; padding:3px; background:#3b82f6; color:#fff;">💬 Chat Làng (Người Sống)</button>
                    <button onclick="switchWerewolfChatTab('DEAD')" id="ww-btn-chat-dead" class="btn" style="flex:1; font-size:10px; padding:3px; background:#475569; color:#cbd5e1;">👻 Chat Khán Giả & Người Chết</button>
                </div>

                <div id="ww-chat-content-box" style="height:70px; overflow-y:auto; font-size:10px; background:#0f172a; padding:6px; border-radius:8px; margin-bottom:6px;">
                    ${livingChatHtml || '<i style="color:#64748b;">Chưa có tin nhắn...</i>'}
                </div>

                <div style="display:flex; gap:4px;">
                    <input type="text" id="ww-chat-input" class="form-control" placeholder="Nhập tin nhắn thảo luận..." style="font-size:10px; padding:4px;">
                    <button onclick="sendWerewolfChatMessage()" class="btn btn-primary" style="font-size:10px; padding:4px 10px;">Gửi</button>
                </div>
            </div>

            ${isNight ? `
                <button onclick="finishNightTurnAndLockNext()" class="btn btn-primary btn-block" style="margin-top:10px; font-size:11px;">🔒 Hoàn Thành Kỹ Năng & Đi Ngủ</button>
            ` : ''}
        </div>
    `;
}

let activeChatTab = 'LIVING';

function switchWerewolfChatTab(tab) {
    activeChatTab = tab;
    let btnLiving = document.getElementById('ww-btn-chat-living');
    let btnDead = document.getElementById('ww-btn-chat-dead');
    let box = document.getElementById('ww-chat-content-box');

    if (!btnLiving || !btnDead || !box) return;

    if (tab === 'LIVING') {
        btnLiving.style.background = '#3b82f6';
        btnLiving.style.color = '#fff';
        btnDead.style.background = '#475569';
        btnDead.style.color = '#cbd5e1';
        let html = wwState.chatMessages.LIVING.map(m => `<div style="margin-bottom:2px;"><b>${m.sender}:</b> ${m.text}</div>`).join('');
        box.innerHTML = html || '<i style="color:#64748b;">Chưa có tin nhắn...</i>';
    } else {
        btnDead.style.background = '#10b981';
        btnDead.style.color = '#fff';
        btnLiving.style.background = '#475569';
        btnLiving.style.color = '#cbd5e1';
        let html = wwState.chatMessages.DEAD.map(m => `<div style="margin-bottom:2px; color:#a7f3d0;"><b>👻 ${m.sender}:</b> ${m.text}</div>`).join('');
        box.innerHTML = html || '<i style="color:#64748b;">Kênh chat bí mật người chết...</i>';
    }
}

function sendWerewolfChatMessage() {
    let input = document.getElementById('ww-chat-input');
    let text = input ? input.value.trim() : '';
    if (!text) return;

    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || { name: 'Thành viên' };

    wwState.chatMessages[activeChatTab].push({
        sender: currentUser.name,
        text: text
    });

    if (input) input.value = '';
    switchWerewolfChatTab(activeChatTab);
}

function unlockNightTurnSecret() {
    wwState.isTurnLocked = false;
    renderWerewolfInGameUI();
}

function renderRoleSpecificActionButton(targetIdx, role) {
    if (role === 'Ma Sói') return `<button onclick="werewolfKillTarget(${targetIdx})" class="btn btn-danger" style="font-size:9px; padding:2px 4px; margin-top:2px;">🐺 Cắn</button>`;
    if (role === 'Bảo vệ') return `<button onclick="guardProtectTarget(${targetIdx})" class="btn btn-primary" style="font-size:9px; padding:2px 4px; margin-top:2px;">🛡️ Bảo Vệ</button>`;
    if (role === 'Tiên tri') return `<button onclick="seerInspectTarget(${targetIdx})" class="btn btn-warning" style="font-size:9px; padding:2px 4px; margin-top:2px;">🔮 Soi</button>`;
    if (role === 'Phù thủy') return `<button onclick="witchPoisonTarget(${targetIdx})" class="btn btn-danger" style="font-size:9px; padding:2px 4px; margin-top:2px;">🧪 Độc</button>`;
    return '';
}

function werewolfKillTarget(targetIdx) {
    wwState.werewolfTarget = targetIdx;
    alert(`🐺 Phe Ma Sói đã chọn cắn: [ ${wwState.players[targetIdx].name} ]`);
}

function guardProtectTarget(targetIdx) {
    wwState.guardProtected = targetIdx;
    alert(`🛡️ Bảo vệ đã chọn che chắn: [ ${wwState.players[targetIdx].name} ]`);
}

function seerInspectTarget(targetIdx) {
    let target = wwState.players[targetIdx];
    let isWolf = (target.role === 'Ma Sói');
    alert(`🔮 KẾT QUẢ SOI BÍ MẬT:\nNgười chơi [ ${target.name} ] ${isWolf ? 'THUỘC PHE MA SÓI! 🐺' : 'KHÔNG PHẢI Ma Sói. 🌾'}`);
}

function witchPoisonTarget(targetIdx) {
    wwState.witchPoisonTarget = targetIdx;
    alert(`🧪 Phù thủy dùng Thuốc Độc lên [ ${wwState.players[targetIdx].name} ]!`);
}

function finishNightTurnAndLockNext() {
    wwState.currentRoleTurnIndex++;
    wwState.isTurnLocked = true;

    if (wwState.currentRoleTurnIndex >= wwState.nightRoleOrder.length) {
        resolveNightEventsAndStartDay();
    } else {
        startPhaseTimer(30);
        renderWerewolfInGameUI();
    }
}

function resolveNightEventsAndStartDay() {
    let wolfKilled = wwState.werewolfTarget;
    let protectedIdx = wwState.guardProtected;
    let poisonedIdx = wwState.witchPoisonTarget;

    let deadThisNight = [];

    if (wolfKilled !== null && wolfKilled !== protectedIdx) {
        deadThisNight.push(wolfKilled);
    }
    if (poisonedIdx !== null && !deadThisNight.includes(poisonedIdx)) {
        deadThisNight.push(poisonedIdx);
    }

    deadThisNight.forEach(idx => { wwState.players[idx].isAlive = false; });

    if (wwState.dayNumber === 1) {
        wwState.phase = 'DAY_ELECTION';
        wwState.logs.unshift(`☀️ Sáng Ngày 1: Cả làng tiến hành Bầu Cảnh Trưởng! (30s)`);
        startPhaseTimer(30);
    } else {
        wwState.phase = 'DAY_DISCUSSION';
        if (deadThisNight.length > 0) {
            let names = deadThisNight.map(i => wwState.players[i].name).join(', ');
            wwState.logs.unshift(`☀️ Sáng hôm sau: Đêm qua người chơi [ ${names} ] đã hy sinh!`);
        } else {
            wwState.logs.unshift(`☀️ Sáng hôm sau: Một đêm bình yên, không ai qua đời!`);
        }
        startPhaseTimer(60);
    }

    if (checkWerewolfWinCondition()) return;
    renderWerewolfInGameUI();
}

function startNextNightPhase() {
    wwState.dayNumber++;
    wwState.phase = 'NIGHT';
    wwState.currentRoleTurnIndex = 0;
    wwState.isTurnLocked = true;
    wwState.werewolfTarget = null;
    wwState.guardProtected = null;
    wwState.witchPoisonTarget = null;
    wwState.logs.unshift(`🌙 Đêm thứ ${wwState.dayNumber} bắt đầu...`);
    startPhaseTimer(30);
    renderWerewolfInGameUI();
}

function electMayor(targetIdx) {
    wwState.players.forEach(p => p.isMayor = false);
    wwState.players[targetIdx].isMayor = true;
    wwState.mayorIdx = targetIdx;
    alert(`🎖️ Người chơi [ ${wwState.players[targetIdx].name} ] đã được bầu làm CẢNH TRƯỜNG!`);

    wwState.phase = 'DAY_VOTING';
    wwState.logs.unshift(`🗳️ Bỏ phiếu treo cổ! (Phiếu Cảnh Trưởng = x1.5)`);
    startPhaseTimer(30);
    renderWerewolfInGameUI();
}

function voteToLynchPlayer(targetIdx) {
    let target = wwState.players[targetIdx];
    if (!target.isAlive) return;

    if (confirm(`Bạn có chắc chắn muốn bỏ phiếu treo cổ [ ${target.name} ]?`)) {
        target.isAlive = false;
        wwState.logs.unshift(`⚖️ Dân làng đã biểu quyết treo cổ [ ${target.name} ]!`);
        
        if (target.role === 'Kẻ chán đời') {
            alert(`🎉 KẺ CHÁN ĐỜI (TANNER) [ ${target.name} ] BỊ TREO CỔ VÀ THẮNG VÁN ĐẤU NGAY LẬP TỨC!`);
            stopGameAndReturnLobby();
            return;
        }

        if (checkWerewolfWinCondition()) return;
        startNextNightPhase();
    }
}

function checkWerewolfWinCondition() {
    let aliveWolves = wwState.players.filter(p => p.isAlive && p.role === 'Ma Sói').length;
    let aliveVillagers = wwState.players.filter(p => p.isAlive && p.role !== 'Ma Sói' && p.role !== 'Kẻ chán đời').length;

    if (aliveWolves === 0) {
        alert("🎉 CHÚC MỪNG! PHE DÂN LÀNG ĐÃ TIÊU DIỆT HẾT MA SÓI VÀ ĐÃ THẮNG!");
        stopGameAndReturnLobby();
        return true;
    }

    if (aliveWolves >= aliveVillagers) {
        alert("🐺 PHE MA SÓI ĐÃ CHIẾM ĐA SỐ VÀ THẮNG VÁN ĐẤU!");
        stopGameAndReturnLobby();
        return true;
    }

    return false;
}

function stopGameAndReturnLobby() {
    if (wwState.timerInterval) clearInterval(wwState.timerInterval);
    wwState.inGame = false;
    openMiniGameSection('werewolf');
}


/* ==========================================================================
   4. TIỆN ÍCH MỜI ĐẤU (LOẠI TRỪ CHÍNH TÀI KHOẢN ĐANG DÙNG KHỎI LIST)
   ========================================================================== */
function openInvitePlayerModal(gameName) {
    let modal = document.getElementById('game-invite-modal');
    let container = document.getElementById('game-online-users-list');
    if (!modal || !container) return;

    let users = T132_getUsersWithOnlineStatus();
    let currentUser = JSON.parse(localStorage.getItem('T132_CURRENT_USER')) || {};
    
    // Loại trừ chính tài khoản hiện tại khỏi modal mời đấu
    let otherOnlineUsers = users.filter(u => u.isOnline && u.name !== currentUser.name);

    let html = otherOnlineUsers.map(u => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px; border-bottom:1px solid #eee; font-size:11px;">
            <span>🟢 ${u.name}</span>
            <button onclick="sendGameInvite('${u.name}', '${gameName}')" class="btn btn-primary" style="font-size:9px; padding:2px 6px;">✉️ Mời đấu</button>
        </div>
    `).join('');

    container.innerHTML = html || "<p style='font-size:11px; color:#888; padding:8px 0;'>Không có bạn học nào khác đang Online.</p>";
    modal.style.display = 'block';
}

function sendGameInvite(userName, gameName) {
    alert(`✉️ Đã gửi lời mời thách đấu ${gameName} tới ${userName}!`);
    document.getElementById('game-invite-modal').style.display = 'none';
}