require('dotenv').config();
const db = require('./config/database');

(async () => {
  try {
    await db.initialize();
    await db.execute(
      "UPDATE PHIM SET TenPhim = N'Stranger Things 5: Cậu Bé Mất Tích', Poster = N'/DanhMuc/Trang chủ/Top 5/Stranger Things 5-Cậu Bé Mất Tích.jpg' WHERE MaPhim = 'Phim154'",
      [],
      { autoCommit: true }
    );
    console.log('Update Stranger Things OK');
  } catch (err) {
    console.error(err);
  } finally {
    await db.close();
  }
})();
