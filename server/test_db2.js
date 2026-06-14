const db = require('./config/database');
async function test() {
  try {
    await db.initialize();
    const count = await db.execute("SELECT COUNT(*) AS total FROM PHIM");
    console.log("Total movies: ", count.rows[0].TOTAL);
    const publicCount = await db.execute("SELECT COUNT(*) AS total FROM PHIM WHERE TrangThaiHT = 'Công khai'");
    console.log("Public movies: ", publicCount.rows[0].TOTAL);
    const movies = await db.execute("SELECT p.MaPhim, p.TenPhim, p.Poster FROM PHIM p FETCH FIRST 5 ROWS ONLY");
    console.log("Sample movies: ", movies.rows);
    const genres = await db.execute("SELECT d.TenDM FROM DANH_MUC d");
    console.log("Genres in DB: ", genres.rows.map(r=>r.TENDM));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
test();
