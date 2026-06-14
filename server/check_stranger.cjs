require('dotenv').config();
const db = require('./config/database');
(async () => {
  await db.initialize();
  const res = await db.execute("SELECT MaPhim, TenPhim, Poster FROM PHIM WHERE TenPhim LIKE '%Stranger Things%'");
  console.log(res.rows);
  await db.close();
})();
