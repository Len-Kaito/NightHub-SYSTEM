const db = require('./config/database');
async function test() {
  await db.initialize();
  try {
    await db.execute(
      `BEGIN 
           sp_BinhLuanPhim(
             p_NoiDung => :noidung, 
             p_SoDiem => 1, 
             p_MaHoSo => :hoSoId, 
             p_MaPhim => :phimId
           ); 
         END;`,
      {
        phimId: 'Phim001',
        hoSoId: 'HS001',
        noidung: 'Trang web rác rưởi, qua motphim hay phimmoi xem full hd miễn phí còn hơn!'
      },
      { autoCommit: true }
    );
    console.log('Insert success');
    
    // Check if it got flagged
    const res = await db.execute(`SELECT * FROM BINH_LUAN_KIEM_DUYET ORDER BY MaBLKD DESC FETCH FIRST 1 ROWS ONLY`, {}, { outFormat: db.OUT_FORMAT_OBJECT });
    console.log(res.rows);
  } catch (err) {
    console.error('Lỗi:', err);
  }
  await db.close();
}
test();
