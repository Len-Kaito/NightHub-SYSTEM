const oracledb = require('oracledb');

async function run() {
  const conn = await oracledb.getConnection({
    user: 'NIGHTHUB',
    password: '123456',
    connectString: 'localhost:1521/XEPDB1'
  });
  
  const sql = `
  CREATE OR REPLACE PROCEDURE sp_BinhLuanPhim (
      p_NoiDung IN NVARCHAR2,
      p_SoDiem IN NUMBER,
      p_MaHoSo IN VARCHAR2,
      p_MaPhim IN VARCHAR2
  ) AS
      v_mabl VARCHAR2(10);
      v_count_hs NUMBER;
      v_count_phim NUMBER;
      v_count_dup NUMBER;
  BEGIN
      SELECT COUNT(*) INTO v_count_hs FROM HO_SO WHERE MaHoSo = p_MaHoSo;
      IF v_count_hs = 0 THEN
          raise_application_error(-20001, 'Lỗi: Mã hồ sơ không tồn tại.');
      END IF;
  
      SELECT COUNT(*) INTO v_count_phim FROM PHIM WHERE MaPhim = p_MaPhim;
      IF v_count_phim = 0 THEN
          raise_application_error(-20002, 'Lỗi: Mã phim không tồn tại.');
      END IF;
  
      IF p_SoDiem NOT BETWEEN 1 AND 5 THEN
          raise_application_error(-20003, 'Lỗi: Điểm đánh giá phải từ 1 đến 5.');
      END IF;
  
      -- KIỂM TRA ĐÁNH GIÁ TRÙNG LẶP (1 HỒ SƠ CHỈ ĐƯỢC ĐÁNH GIÁ 1 PHIM 1 LẦN)
      SELECT COUNT(*) INTO v_count_dup FROM BINH_LUAN_DANH_GIA WHERE MaHoSo = p_MaHoSo AND MaPhim = p_MaPhim;
      IF v_count_dup > 0 THEN
          raise_application_error(-20004, 'Lỗi: Mỗi hồ sơ chỉ được đánh giá phim này 1 lần duy nhất!');
      END IF;
  
      SELECT 'BL' || LPAD(NVL(MAX(TO_NUMBER(SUBSTR(MaBL, 3))), 0) + 1, 3, '0')
      INTO v_mabl FROM BINH_LUAN_DANH_GIA;
  
      INSERT INTO BINH_LUAN_DANH_GIA (MaBL, NoiDung, SoDiem, NgayTao, TrangThai, MaHoSo, MaPhim)
      VALUES (v_mabl, p_NoiDung, p_SoDiem, CURRENT_TIMESTAMP, N'Hiển thị', p_MaHoSo, p_MaPhim);
  
      COMMIT;
  END;
  `;
  
  await conn.execute(sql);
  console.log('SP updated');
  await conn.close();
}

run().catch(console.error);
