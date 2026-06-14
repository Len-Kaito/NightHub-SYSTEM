const db = require('../config/database');

// Chuyển giây sang "X giờ Y phút Z giây"
function formatDurationVN(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds)) return null;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  let parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || (h === 0 && m === 0)) parts.push(`${s}s`);
  return parts.join(' ');
}

// Lấy danh sách gợi ý phim theo Hồ sơ (dùng bảng GOI_Y_PHIM)
exports.getRecommendations = async (req, res) => {
  try {
    const { profileId } = req.params;

    const result = await db.execute(
      `SELECT gy.DiemSo,
              p.MaPhim, p.TenPhim, p.Poster, p.MoTa, p.NamSX, p.QuocGia,
              pl.DinhDang,
              pb.TongSoTap, pb.SoMua,
              (SELECT SUM(vp.ThoiLuong) FROM VIDEO_PHAT vp WHERE vp.MaPhim = p.MaPhim) AS TongThoiLuong
       FROM GOI_Y_PHIM gy
       JOIN PHIM p ON gy.MaPhim = p.MaPhim
       LEFT JOIN PHIM_LE pl ON p.MaPhim = pl.MaPhim
       LEFT JOIN PHIM_BO pb ON p.MaPhim = pb.MaPhim
       WHERE gy.MaHoSo = :profileId 
         AND p.TrangThaiHT = 'Công khai' 
         AND p.TrangThaiKD = 'Đã duyệt'
       ORDER BY gy.DiemSo DESC`,
      { profileId }
    );

    // Lấy tất cả tags cho các phim gợi ý
    const maPhimList = result.rows.map(r => r.MAPHIM);
    let tagMap = {};
    if (maPhimList.length > 0) {
      const tagResult = await db.execute(
        `SELECT pt.MaPhim, t.TenTag, t.MoTa
         FROM PHIM_TAG pt
         JOIN TAG t ON pt.MaTag = t.MaTag
         WHERE pt.MaPhim IN (${maPhimList.map((_, i) => `:p${i}`).join(',')})`,
        maPhimList.reduce((acc, id, i) => { acc[`p${i}`] = id; return acc; }, {})
      );
      tagResult.rows.forEach(r => {
        if (!tagMap[r.MAPHIM]) tagMap[r.MAPHIM] = [];
        tagMap[r.MAPHIM].push({ name: r.TENTAG, description: r.MOTA });
      });
    }

    const AGE_TAGS = ['K', 'P', 'T13', 'T16', 'T18'];

    const recommendations = result.rows.map(row => {
      const tags = tagMap[row.MAPHIM] || [];
      const ageTag = tags.find(t => AGE_TAGS.includes(t.name.toUpperCase())) || tags[0] || null;
      const isPhimBo = row.TONGSOTAP != null;

      return {
        id: 'm_' + row.MAPHIM,
        title: row.TENPHIM,
        poster: row.POSTER,
        description: row.MOTA,
        year: row.NAMSX,
        country: row.QUOCGIA,
        quality: row.DINHDANG || null,
        duration: isPhimBo
          ? `${row.TONGSOTAP} Tập`
          : formatDurationVN(row.TONGTHOILUONG),
        age: ageTag ? ageTag.name : 'K',
        tags: tags,
        matchScore: row.DIEMSO
      };
    });

    res.json(recommendations);
  } catch (err) {
    console.error('Lỗi getRecommendations:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy gợi ý phim' });
  }
};
