const oracledb = require('oracledb');

async function run() {
  const conn = await oracledb.getConnection({
    user: 'NIGHTHUB',
    password: '123456',
    connectString: 'localhost:1521/XEPDB1'
  });

  const sql = `
  CREATE OR REPLACE PROCEDURE sp_ThemPhimMoi (
      p_TenPhim IN NVARCHAR2,
      p_Poster IN VARCHAR2,
      p_MoTa IN NVARCHAR2,
      p_NamSX IN NUMBER,
      p_QuocGia IN NVARCHAR2,
      p_URLTrailer IN VARCHAR2,
      p_MaDT IN VARCHAR2,
      p_MaTK_QTVND IN VARCHAR2
  ) AS
      v_maphim VARCHAR2(10);
      v_count_dt NUMBER;
      v_count_qtv NUMBER;
  BEGIN
      IF p_NamSX NOT BETWEEN 1888 AND 2031 THEN
          raise_application_error(-20001, 'Lỗi: Năm sản xuất không hợp lệ.');
      END IF;
  
      IF p_MaDT IS NOT NULL THEN
          SELECT COUNT(*) INTO v_count_dt FROM DOI_TAC WHERE MaDT = p_MaDT;
          IF v_count_dt = 0 THEN
              raise_application_error(-20002, 'Lỗi: Mã đối tác không tồn tại.');
          END IF;
      END IF;
  
      IF p_MaTK_QTVND IS NOT NULL THEN
          SELECT COUNT(*) INTO v_count_qtv FROM QUAN_TRI_VIEN_NOI_DUNG WHERE MaTK = p_MaTK_QTVND;
          IF v_count_qtv = 0 THEN
              raise_application_error(-20003, 'Lỗi: Mã quản trị viên nội dung không tồn tại.');
          END IF;
      END IF;
  
      SELECT 'Phim' || LPAD(NVL(MAX(TO_NUMBER(SUBSTR(MaPhim, 5))), 0) + 1, 3, '0')
      INTO v_maphim FROM PHIM;
  
      INSERT INTO PHIM (MaPhim, TenPhim, Poster, MoTa, NamSX, QuocGia, URLTrailer, TrangThaiKD, TrangThaiHT, LuotThich, MaDT, MaTK_QTVND)
      VALUES (v_maphim, p_TenPhim, p_Poster, p_MoTa, p_NamSX, p_QuocGia, p_URLTrailer, N'Chờ duyệt', N'Ẩn', 0, p_MaDT, p_MaTK_QTVND);
  
      COMMIT;
      DBMS_OUTPUT.PUT_LINE('Đã thêm phim mới: ' || v_maphim);
  END;
  `;

  await conn.execute(sql);
  await conn.close();
  console.log('Fixed SP successfully');
}

run().catch(console.error);
