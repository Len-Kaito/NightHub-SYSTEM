const db = require('../config/database');

// Lấy lịch sử xem theo Hồ sơ (dùng View V_LICH_SU_XEM_PHIM)
exports.getWatchHistory = async (req, res) => {
  try {
    const { profileId } = req.params;

    // Dùng View V_LICH_SU_XEM_PHIM đã có sẵn trong DB
    const result = await db.execute(
      `SELECT MaHoSo, MaPhim, TenPhim, Poster, TapPhim AS MaVP, 
              TongThoiLuong, ThoiGianDaXem, PhanTramDaXem, NgayXemGanNhat
       FROM V_LICH_SU_XEM_PHIM
       WHERE MaHoSo = :profileId
       ORDER BY NgayXemGanNhat DESC`,
      { profileId }
    );

    const history = result.rows.map(row => {
      const totalSec = row.TONGTHOILUONG || 0;
      const watchedSec = row.THOIGIANDAXEM || 0;
      const remainingSec = Math.max(totalSec - watchedSec, 0);
      
      let remaining = '';
      const h = Math.floor(remainingSec / 3600);
      const m = Math.floor((remainingSec % 3600) / 60);
      const s = Math.floor(remainingSec % 60);
      
      let parts = [];
      if (h > 0) parts.push(`${h}h`);
      if (m > 0) parts.push(`${m}m`);
      if (s > 0 || (h === 0 && m === 0)) parts.push(`${s}s`);
      remaining = parts.join(' ');

      return {
        maPhim: row.MAPHIM,
        title: row.TENPHIM,
        poster: row.POSTER,
        maVP: row.MAVP,
        totalDuration: totalSec,
        watchedDuration: watchedSec,
        progress: Math.min(Math.round(row.PHANTRAMDAXEM || 0), 100),
        remaining,
        lastWatched: row.NGAYXEMGANNHAT
      };
    });

    res.json(history);
  } catch (err) {
    console.error('Lỗi getWatchHistory:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử xem' });
  }
};

// Cập nhật tiến độ hoặc lưu lịch sử xem phim (Kích hoạt Trigger độ tuổi và VIP)
exports.updateWatchHistory = async (req, res) => {
  try {
    const { profileId, maVP, tienDo } = req.body;
    
    // Thử cập nhật nếu đã có lịch sử
    const updateResult = await db.execute(
      `UPDATE LICH_SU_XEM 
       SET TienDo = :tienDo, NgayTT = SYSDATE 
       WHERE MaHoSo = :profileId AND MaVP = :maVP`,
      { tienDo, profileId, maVP }
    );

    // Nếu chưa có lịch sử, thêm mới -> Trigger TRG_KIEMSOAT_DOTUOI_XEM và TRG_KIEM_QUYEN_XEM_PHIM sẽ kích hoạt tại đây!
    if (updateResult.rowsAffected === 0) {
      const idResult = await db.execute(`
        SELECT 'LSX' || LPAD(NVL(MAX(TO_NUMBER(SUBSTR(MaLSX, 4))), 0) + 1, 3, '0') AS NextID 
        FROM LICH_SU_XEM
      `);
      const maLSX = Object.values(idResult.rows[0])[0];
      await db.execute(
        `INSERT INTO LICH_SU_XEM (MaLSX, MaHoSo, MaVP, TienDo, NgayTT) 
         VALUES (:maLSX, :profileId, :maVP, :tienDo, SYSDATE)`,
        { maLSX, profileId, maVP, tienDo }
      );
    }
    
    res.json({ success: true, message: 'Đã lưu lịch sử xem' });
  } catch (err) {
    // Bắt các lỗi do Trigger (người dùng tự định nghĩa) bắt đầu bằng ORA-20
    let userMsg = 'Lỗi server khi lưu lịch sử xem';
    if (err.message.includes('ORA-20')) {
      const match = err.message.match(/ORA-20\d{3}:\s*(.*)$/m);
      if (match) {
        userMsg = match[1].trim();
      } else {
        userMsg = err.message.split('\\n')[0]; // fallback lấy dòng đầu tiên
      }
      return res.status(403).json({ message: userMsg, error: err.message });
    }
    
    console.error('Lỗi updateWatchHistory:', err.message);
    res.status(500).json({ message: userMsg, error: err.message });
  }
};
