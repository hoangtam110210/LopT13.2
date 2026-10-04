/* ==========================================================================
   DỮ LIỆU CHÍNH THỨC CHI ĐOÀN 10T2 - TRƯỜNG THPT CHUYÊN BÌNH LONG
   ========================================================================== */

const T132_STUDENT_DATABASE = [
  { "stt": 1, "name": "Nguyễn Thị Kiều An", "dob": "12/03/2010", "hometown": "Đà Nẵng", "ethnicity": "Kinh", "phone": "968737103", "email": "kieuannguyen67@gmail.com" },
  { "stt": 2, "name": "Bùi Thị Bình An", "dob": "10/01/2010", "hometown": "TPHCM", "ethnicity": "Kinh", "phone": "848306079", "email": "binhanbp2010@gmail.com" },
  { "stt": 3, "name": "Cao Hoàng Quỳnh Anh", "dob": "03/07/2010", "hometown": "Thanh Hóa", "ethnicity": "Kinh", "phone": "979966854", "email": "chqa75@gmail.com" },
  { "stt": 4, "name": "Đinh Hà Kim Anh", "dob": "11/07/2010", "hometown": "Hà Tĩnh", "ethnicity": "Kinh", "phone": "985091060", "email": "dinhhakimanh7@gmail.com" },
  { "stt": 5, "name": "Lâm Hưng Thiên Ánh", "dob": "25/12/2010", "hometown": "Quảng Trị", "ethnicity": "Kinh", "phone": "367441266", "email": "thienanhlamhung12@gmail.com" },
  { "stt": 6, "name": "Nguyễn Hữu Gia Bảo", "dob": "19/08/2010", "hometown": "Thanh Hóa", "ethnicity": "Kinh", "phone": "968021737", "email": "nguyenhuugiabao810@gmail.com" },
  { "stt": 7, "name": "Nguyễn Khánh Chi", "dob": "10/01/2010", "hometown": "Ninh Bình", "ethnicity": "Kinh", "phone": "822579539", "email": "khanhchi1001210@gmail.com" },
  { "stt": 8, "name": "Trần Văn Doanh", "dob": "24/04/2010", "hometown": "Quảng Trị", "ethnicity": "Kinh", "phone": "813609279", "email": "tranvandoanh244@gmail.com" },
  { "stt": 9, "name": "Bùi Mạnh Dũng", "dob": "18/08/2010", "hometown": "Hưng Yên", "ethnicity": "Kinh", "phone": "813933284", "email": "dungxbenz@gmail.com" },
  { "stt": 10, "name": "Nguyễn Sỹ Anh Đức", "dob": "03/04/2010", "hometown": "Thanh Hóa", "ethnicity": "Kinh", "phone": "961464430", "email": "ducnguyen03042010@gmail.com" },
  { "stt": 11, "name": "Đoàn Hương Giang", "dob": "04/08/2010", "hometown": "Ninh Bình", "ethnicity": "Kinh", "phone": "818123079", "email": "giangdoan2010soc@gmail.com" },
  { "stt": 12, "name": "Lê Trần Ngọc Hà", "dob": "01/10/2010", "hometown": "Thanh Hóa", "ethnicity": "Kinh", "phone": "333644524", "email": "letranngocha2010@gmail.com" },
  { "stt": 13, "name": "Nguyễn Hoàng Hải", "dob": "12/06/2010", "hometown": "Đồng Nai", "ethnicity": "Kinh", "phone": "971829040", "email": "hoanghai12062010@gmail.com" },
  { "stt": 14, "name": "Nguyễn Công Nhật Huy", "dob": "14/03/2010", "hometown": "Đà Nẵng", "ethnicity": "Kinh", "phone": "974839610", "email": "nhathuyblbp2023@gmail.com" },
  { "stt": 15, "name": "Tạ Trung Kiên", "dob": "12/04/2010", "hometown": "Nghệ An", "ethnicity": "Kinh", "phone": "385113600", "email": "tatrungkien120410@gmail.com" },
  { "stt": 16, "name": "Trần Nguyễn Khánh Linh", "dob": "27/07/2010", "hometown": "Hà Tĩnh", "ethnicity": "Kinh", "phone": "909453979", "email": "Linhct8917@gmail.com" },
  { "stt": 17, "name": "Diệp Khải Luân", "dob": "18/06/2010", "hometown": "Quảng Ninh", "ethnicity": "Hoa", "phone": "369414287", "email": "Khailuan123tk@gmail.com" },
  { "stt": 18, "name": "Bùi Thảo My", "dob": "29/09/2010", "hometown": "Nghệ An", "ethnicity": "Kinh", "phone": "354898605", "email": "bthaomy10@gmail.com" },
  { "stt": 19, "name": "Nguyễn Trà My", "dob": "06/08/2010", "hometown": "Hà Tĩnh", "ethnicity": "Kinh", "phone": "394041718", "email": "tramymy6810@gmail.com" },
  { "stt": 20, "name": "Hồ Phuong Nam", "dob": "19/04/2010", "hometown": "Quảng Ninh", "ethnicity": "Kinh", "phone": "784379348", "email": "hophuongnam210@gmail.com" },
  { "stt": 21, "name": "Trần Vũ Thùy Ngân", "dob": "30/05/2010", "hometown": "Hưng Yên", "ethnicity": "Kinh", "phone": "384908874", "email": "ngannthuy0305@gmail.com" },
  { "stt": 22, "name": "Lê Bảo Ngọc", "dob": "22/06/2010", "hometown": "Quảng Trị", "ethnicity": "Kinh", "phone": "336719226", "email": "lebaongoc226210@gmail.com" },
  { "stt": 23, "name": "Lê Tạ Thảo Nguyên", "dob": "06/05/2010", "hometown": "Quảng Trị", "ethnicity": "Kinh", "phone": "343269112", "email": "thaonguyen.2010bp@gmail.com" },
  { "stt": 24, "name": "Bùi Thị Quỳnh Nhi", "dob": "27/02/2010", "hometown": "TPHCM", "ethnicity": "Kinh", "phone": "392680996", "email": "quynhnnhi2702210@gmail.com" },
  { "stt": 25, "name": "Nguyễn Vũ Phúc", "dob": "10/01/2010", "hometown": "Đồng Nai", "ethnicity": "Kinh", "phone": "866612282", "email": "nguyenvuphuc2010dx2@gmail.com" },
  { "stt": 26, "name": "Phạm Minh Phước", "dob": "03/09/2010", "hometown": "Hưng Yên", "ethnicity": "Kinh", "phone": "335437469", "email": "minhphuoc2010bp@gmail.com" },
  { "stt": 27, "name": "Tôn Nữ Như Quỳnh", "dob": "05/04/2010", "hometown": "Quảng Ngãi", "ethnicity": "Kinh", "phone": "984601762", "email": "tnnq05042010@gmail.com" },
  { "stt": 28, "name": "Hoàng Ngọc Minh Tâm", "dob": "11/02/2010", "hometown": "Thanh Hóa", "ethnicity": "Kinh", "phone": "963848541", "email": "hoangtam166112@gmail.com" },
  { "stt": 29, "name": "Nguyễn Chí Thành", "dob": "15/04/2010", "hometown": "Thanh Hóa", "ethnicity": "Kinh", "phone": "916326040", "email": "chithanh2010bp@gmail.com" },
  { "stt": 30, "name": "Nguyễn Thu Thảo", "dob": "11/04/2010", "hometown": "Hải Phòng", "ethnicity": "Kinh", "phone": "382454157", "email": "thuthaong1104.mcr@gmail.com" },
  { "stt": 31, "name": "Đỗ Minh Thư", "dob": "18/02/2010", "hometown": "Đồng Nai", "ethnicity": "Kinh", "phone": "383537680", "email": "minhthu180220101010@gmail.com" },
  { "stt": 32, "name": "Nguyễn Hữu Tú", "dob": "09/08/2010", "hometown": "Thanh Hóa", "ethnicity": "Kinh", "phone": "337710448", "email": "nguyenhuutu2010bp@gmail.com" },
  { "stt": 33, "name": "Cao Lê Uyên", "dob": "18/01/2010", "hometown": "Thanh Hóa", "ethnicity": "Kinh", "phone": "926222239", "email": "caoleuyen92@gmail.com" },
  { "stt": 34, "name": "Trần Nguyễn Tường Vy", "dob": "14/05/2010", "hometown": "Vĩnh Long", "ethnicity": "Kinh", "phone": "914604513", "email": "trngtuongvy1405@gmail.com" },
  { "stt": 35, "name": "Diệp Khải Vy", "dob": "25/01/2010", "hometown": "Quảng Ninh", "ethnicity": "Hoa", "phone": "357286250", "email": "diepkhaivy820@gmail.com" }
];

// TỰ ĐỘNG ĐỒNG BỘ TÊN VÀO LOCALSTORAGE CHO HỆ THỐNG
(function syncStudentUsersToLocalStorage() {
    let users = [];
    try { users = JSON.parse(localStorage.getItem('T132_USERS')) || []; } catch(e) {}

    // Đồng bộ chuẩn từ database
    let syncedUsers = T132_STUDENT_DATABASE.map(s => {
        let existing = users.find(u => u.name === s.name) || {};
        return {
            stt: s.stt,
            name: s.name,
            role: existing.role || (s.name === "Hoàng Ngọc Minh Tâm" ? "Admin" : "Thành viên"),
            avatar: existing.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            isOnline: existing.isOnline || false
        };
    });

    localStorage.setItem('T132_USERS', JSON.stringify(syncedUsers));
})();
