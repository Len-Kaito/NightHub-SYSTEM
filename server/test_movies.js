const db = require('./config/database');
async function test() {
  await db.initialize();
  try {
    const phimResult = await db.execute(
      `SELECT P.MaPhim, P.TenPhim, P.QuocGia, P.NamSX,
              LISTAGG(DISTINCT DM.TenDM, ', ') WITHIN GROUP (ORDER BY DM.TenDM) AS TheLoai,
              LISTAGG(DISTINCT DV.TenDV, ', ') WITHIN GROUP (ORDER BY DV.TenDV) AS DienVien,
              LISTAGG(DISTINCT DD.TenDD, ', ') WITHIN GROUP (ORDER BY DD.TenDD) AS DaoDien
       FROM PHIM P
       LEFT JOIN PHIM_DANH_MUC PDM ON P.MaPhim = PDM.MaPhim
       LEFT JOIN DANH_MUC DM ON PDM.MaDM = DM.MaDM
       LEFT JOIN PHIM_DIEN_VIEN PDV ON P.MaPhim = PDV.MaPhim
       LEFT JOIN DIEN_VIEN DV ON PDV.MaDV = DV.MaDV
       LEFT JOIN PHIM_DAO_DIEN PDD ON P.MaPhim = PDD.MaPhim
       LEFT JOIN DAO_DIEN DD ON PDD.MaDD = DD.MaDD
       WHERE P.TrangThaiHT = N'Công khai'
       GROUP BY P.MaPhim, P.TenPhim, P.QuocGia, P.NamSX
       FETCH FIRST 50 ROWS ONLY`,
      {},
      { outFormat: db.OUT_FORMAT_OBJECT }
    );
    console.log('Query result count:', phimResult.rows.length);
  } catch (err) {
    console.error('Query error:', err);
  }
  await db.close();
}
test().catch(console.error);
