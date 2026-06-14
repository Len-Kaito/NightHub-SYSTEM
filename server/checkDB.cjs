require('dotenv').config();
const db = require('./config/database');
(async () => {
  try {
    await db.initialize();
    const result = await db.execute("SELECT * FROM PHIM_DANH_MUC WHERE ROWNUM <= 5");
    console.log("Samples:", result.rows);
    process.exit(0);
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
})();
