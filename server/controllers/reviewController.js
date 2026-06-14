const db = require('../config/database');

// Lấy danh sách bình luận của phim
exports.getReviews = async (req, res) => {
  try {
    const { movieId } = req.params;
    const normalizedMovieId = movieId.replace('m_', '');
    
    // Chỉ lấy các bình luận đang hiển thị
    const result = await db.execute(`
      SELECT b.MaBL, b.NoiDung, b.SoDiem, b.NgayTao,
             h.TenHoSo AS TacGia, h.AnhDaiDien
      FROM BINH_LUAN_DANH_GIA b
      JOIN HO_SO h ON b.MaHoSo = h.MaHoSo
      WHERE b.MaPhim = :normalizedMovieId AND b.TrangThai = N'Hiển thị'
      ORDER BY b.NgayTao DESC
    `, { normalizedMovieId });

    const reviews = result.rows.map(row => ({
      id: row.MABL,
      author: row.TACGIA,
      avatar: row.ANHDAIDIEN === 'DEFAULT' ? null : row.ANHDAIDIEN,
      text: row.NOIDUNG,
      rating: row.SODIEM,
      time: row.NGAYTAO,
      likes: 0,
      replies: []
    }));

    res.json(reviews);
  } catch (err) {
    console.error('Lỗi getReviews:', err);
    res.status(500).json({ message: 'Lỗi lấy danh sách bình luận' });
  }
};

// Thêm bình luận (Sử dụng Procedure sp_BinhLuanPhim)
exports.addReview = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { profileId, text, rating } = req.body;

    if (!profileId || !text) {
      return res.status(400).json({ message: 'Thiếu thông tin bình luận.' });
    }

    const normalizedMovieId = movieId.replace('m_', '');

    // Gọi Procedure sp_BinhLuanPhim(p_NoiDung, p_SoDiem, p_MaHoSo, p_MaPhim)
    await db.execute(
      `BEGIN sp_BinhLuanPhim(:text, :rating, :profileId, :normalizedMovieId); END;`,
      {
        text,
        rating: rating !== undefined && rating !== null ? rating : null,
        profileId,
        normalizedMovieId
      }
    );

    res.json({ success: true, message: 'Đăng bình luận thành công' });
  } catch (err) {
    console.error('Lỗi addReview:', err.message);
    res.status(400).json({ message: err.message || 'Không thể đăng bình luận' });
  }
};

// Xóa bình luận
exports.deleteReview = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { profileId } = req.body;

    if (!profileId) return res.status(400).json({ message: 'Thiếu thông tin hồ sơ.' });

    await db.execute(`BEGIN sp_XoaBinhLuan(:commentId, :profileId); END;`, {
      commentId,
      profileId
    });

    res.json({ success: true, message: 'Đã xóa bình luận' });
  } catch (err) {
    console.error('Lỗi deleteReview:', err.message);
    res.status(400).json({ message: err.message || 'Không thể xóa bình luận' });
  }
};

// Báo cáo bình luận
exports.reportReview = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { profileId, reason } = req.body;

    if (!profileId || !reason) return res.status(400).json({ message: 'Thiếu thông tin báo cáo.' });

    await db.execute(`BEGIN sp_BaoCaoBinhLuan(:commentId, :profileId, :reason); END;`, {
      commentId,
      profileId,
      reason
    });

    res.json({ success: true, message: 'Đã gửi báo cáo' });
  } catch (err) {
    console.error('Lỗi reportReview:', err.message);
    res.status(400).json({ message: err.message || 'Không thể gửi báo cáo' });
  }
};

