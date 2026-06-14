const db = require('./server/config/database');
async function test() {
  await db.initialize();
  const res = await db.execute("SELECT * FROM PHIM_QUANG_CAO");
  console.log('PHIM_QUANG_CAO:', res.rows);
  const res2 = await db.execute("SELECT * FROM QUANG_CAO");
  console.log('QUANG_CAO:', res2.rows);
  await db.close();
}
test();
