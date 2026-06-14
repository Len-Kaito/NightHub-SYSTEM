const db = require('./config/database');

const triggerAgeSQL = `
CREATE OR REPLACE TRIGGER TRG_KIEMSOAT_DOTUOI_XEM
BEFORE INSERT OR UPDATE ON LICH_SU_XEM
FOR EACH ROW
DECLARE
    v_TuoiNguoiDung   NUMBER;
    v_GioiHanTuoiPhim NUMBER := 0;
    v_MaPhim          VARCHAR2(10);
    v_MaTK_TV         VARCHAR2(10);
    v_NgaySinh        DATE;
    v_TenTag          VARCHAR2(10);
BEGIN
    -- Bước 1: Lấy MaPhim từ VIDEO_PHAT
    SELECT MaPhim INTO v_MaPhim
    FROM VIDEO_PHAT
    WHERE MaVP = :NEW.MaVP;

    -- Bước 2: Lấy tag độ tuổi của phim (K, P, T13, T16, T18)
    BEGIN
        SELECT t.TenTag INTO v_TenTag
        FROM PHIM_TAG pt
        JOIN TAG t ON pt.MaTag = t.MaTag
        WHERE pt.MaPhim = v_MaPhim
          AND t.TenTag IN ('K', 'P', 'T13', 'T16', 'T18')
          AND ROWNUM = 1;

        -- Quy đổi tag → số tuổi
        v_GioiHanTuoiPhim := CASE v_TenTag
            WHEN 'K'   THEN 0
            WHEN 'P'   THEN 0
            WHEN 'T13' THEN 13
            WHEN 'T16' THEN 16
            WHEN 'T18' THEN 18
            ELSE 0
        END;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_GioiHanTuoiPhim := 0; -- Không có tag tuổi → không giới hạn
    END;

    -- Bước 3: Lấy MaTK_TV từ HO_SO
    SELECT MaTK_TV INTO v_MaTK_TV
    FROM HO_SO
    WHERE MaHoSo = :NEW.MaHoSo;

    -- Bước 4: Lấy NgaySinh từ THANH_VIEN
    SELECT NgaySinh INTO v_NgaySinh
    FROM THANH_VIEN
    WHERE MaTK = v_MaTK_TV;

    -- Bước 5: Tính tuổi
    v_TuoiNguoiDung := TRUNC(MONTHS_BETWEEN(SYSDATE, v_NgaySinh) / 12);

    -- Bước 6: Chặn nếu chưa đủ tuổi
    IF v_TuoiNguoiDung < v_GioiHanTuoiPhim THEN
        RAISE_APPLICATION_ERROR(-20008,
            'Nội dung ' || v_TenTag || 
            ' yêu cầu từ ' || v_GioiHanTuoiPhim || 
            ' tuổi. Hồ sơ này không đủ điều kiện để xem.');
    END IF;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20009,
            'Không tìm thấy thông tin Video, Hồ sơ hoặc Thành viên.');
END;
`;

async function run() {
  try {
    await db.initialize();
    await db.execute(triggerAgeSQL);
    console.log('Trigger Age compiled successfully.');
  } catch (err) {
    console.error('Error compiling trigger:', err);
  } finally {
    await db.close();
    process.exit();
  }
}

run();
