const db = require('./config/database');
async function test() {
  try {
    await db.initialize();
    // Check which movies belong to which genres
    const result = await db.execute(`
      SELECT d.TenDM, COUNT(pd.MaPhim) as SoPhim
      FROM DANH_MUC d
      LEFT JOIN PHIM_DANH_MUC pd ON d.MaDM = pd.MaDM
      GROUP BY d.TenDM
      ORDER BY COUNT(pd.MaPhim) DESC
    `);
    console.log("Categories & movie count:");
    result.rows.forEach(r => console.log(`  ${r.TENDM}: ${r.SOPHIM} phim`));

    // Check what tags exist 
    const tags = await db.execute(`
      SELECT t.TenTag, COUNT(pt.MaPhim) as SoPhim
      FROM TAG t
      LEFT JOIN PHIM_TAG pt ON t.MaTag = pt.MaTag
      GROUP BY t.TenTag
      ORDER BY COUNT(pt.MaPhim) DESC
    `);
    console.log("\nTags & movie count:");
    tags.rows.forEach(r => console.log(`  ${r.TENTAG}: ${r.SOPHIM} phim`));

  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
test();
