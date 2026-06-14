const db = require('./server/config/database');

async function fixTrigger() {
  await db.initialize();
  try {
    await db.execute(`
      CREATE OR REPLACE TRIGGER TRG_THONG_BAO_KHI_XOA_BINH_LUAN
      AFTER UPDATE OF TrangThaiXL ON BINH_LUAN_KIEM_DUYET
      FOR EACH ROW
      DECLARE
          v_NextTB NUMBER;
          v_MaHoSo VARCHAR2(10);
      BEGIN
          -- Đổi điều kiện kích hoạt từ 'Bác bỏ' sang 'Đã ẩn' (Xóa comment)
          IF :OLD.TrangThaiXL <> 'Đã ẩn' AND :NEW.TrangThaiXL = 'Đã ẩn' THEN
              
              -- Lấy hồ sơ người dùng
              BEGIN
                  SELECT bl.MaHoSo INTO v_MaHoSo
                  FROM HE_THONG_DANH_DAU ht
                  JOIN BINH_LUAN_DANH_GIA bl ON ht.MaBL = bl.MaBL
                  WHERE ht.MaHTDD = :NEW.MaHTDD;
              EXCEPTION
                  WHEN NO_DATA_FOUND THEN
                      BEGIN
                          SELECT bl.MaHoSo INTO v_MaHoSo
                          FROM BAO_CAO_VI_PHAM bc
                          JOIN BINH_LUAN_DANH_GIA bl ON bc.MaBL = bl.MaBL
                          WHERE bc.MaBC = :NEW.MaBC;
                      EXCEPTION
                          WHEN NO_DATA_FOUND THEN
                              v_MaHoSo := NULL;
                      END;
              END;

              IF v_MaHoSo IS NOT NULL THEN
                  SELECT NVL(MAX(TO_NUMBER(SUBSTR(MaTB, 3))), 0) + 1
                  INTO v_NextTB
                  FROM THONG_BAO;

                  INSERT INTO THONG_BAO (MaTB, TieuDe, NoiDung, NgayGui, MaHoSo)
                  VALUES (
                      'TB' || LPAD(v_NextTB, 4, '0'),
                      'Cảnh báo vi phạm tiêu chuẩn cộng đồng',
                      'Một bình luận của bạn đã bị gỡ bỏ do chứa nội dung vi phạm quy định nền tảng.',
                      SYSDATE,
                      v_MaHoSo
                  );
              END IF;
          END IF;
      END;
    `);
    console.log('Trigger updated successfully.');
  } catch(e) {
    console.error('Lỗi khi chạy script SQL:', e);
  } finally {
    await db.close();
  }
}
fixTrigger();
