require('dotenv').config();
const db = require('./config/database');
(async () => {
  await db.initialize();
  const res = await db.execute("SELECT d.TenDM FROM PHIM_DANH_MUC pd JOIN DANH_MUC d ON pd.MaDM = d.MaDM WHERE pd.MaPhim = 'Phim154'");
  console.log('Genres:', res.rows);
  await db.close();
})();
