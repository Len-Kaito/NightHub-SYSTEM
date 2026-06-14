const db = require('../config/database');

// Lấy danh sách phim đã lưu của hồ sơ
const getMyList = async (req, res) => {
    try {
        const { profileId } = req.params;
        const result = await db.execute(
            `SELECT MaPhim FROM THEM_DANH_SACH_CUA_TOI WHERE MaHoSo = :profileId ORDER BY NgayThem DESC`,
            { profileId }
        );
        
        // Trả về mảng các ID dạng 'm_P001' để khớp với Frontend
        const list = result.rows.map(row => `m_${row.MAPHIM}`);
        res.json(list);
    } catch (err) {
        console.error('Lỗi lấy danh sách của tôi:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Thêm phim vào danh sách
const addToMyList = async (req, res) => {
    try {
        const { profileId } = req.params;
        let { movieId } = req.body;
        // Chuẩn hóa ID (bỏ tiền tố m_ nếu có)
        movieId = movieId.replace('m_', '');

        await db.execute(
            `BEGIN sp_ThemDanhSachCuaToi(:profileId, :movieId); END;`,
            { profileId, movieId },
            { autoCommit: true }
        );
        res.json({ message: 'Đã thêm vào danh sách' });
    } catch (err) {
        console.error('Lỗi thêm phim:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Xóa phim khỏi danh sách
const removeFromMyList = async (req, res) => {
    try {
        const { profileId, movieId } = req.params;
        const normalizedMovieId = movieId.replace('m_', '');

        await db.execute(
            `DELETE FROM THEM_DANH_SACH_CUA_TOI WHERE MaHoSo = :profileId AND MaPhim = :movieId`,
            { profileId, movieId: normalizedMovieId }
        );
        res.json({ message: 'Đã xóa khỏi danh sách' });
    } catch (err) {
        console.error('Lỗi xóa phim:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

module.exports = { getMyList, addToMyList, removeFromMyList };
