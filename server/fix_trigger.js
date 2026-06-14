const db = require('./config/database');

const triggerAgeSQL = `
CREATE OR REPLACE TRIGGER TRG_KIEMSOAT_DOTUOI_XEM
BEFORE INSERT OR UPDATE ON LICH_SU_XEM
FOR EACH ROW
DECLARE
    v_MaPhim VARCHAR2(10);
    v_KiemDuyet NUMBER(1);
    v_TuoiNguoiXem NUMBER(3);
BEGIN
    -- Lấy mã phim và trạng thái kiểm duyệt của Video
    SELECT p.MaPhim, p.KiemDuyet
    INTO v_MaPhim, v_KiemDuyet
    FROM VIDEO_PHAT vp
    JOIN PHIM p ON vp.MaPhim = p.MaPhim
    WHERE vp.MaVP = :NEW.MaVP;

    -- Nếu phim cần kiểm duyệt độ tuổi -> kiểm tra
    IF v_KiemDuyet = 1 THEN
        
        -- Tính tuổi người xem (Năm hiện tại - Năm sinh của Hồ sơ)
        SELECT (EXTRACT(YEAR FROM SYSDATE) - EXTRACT(YEAR FROM NgaySinh))
        INTO v_TuoiNguoiXem
        FROM HO_SO
        WHERE MaHoSo = :NEW.MaHoSo;

        -- Nếu độ tuổi < 18 -> Chặn
        IF v_TuoiNguoiXem < 18 THEN
            RAISE_APPLICATION_ERROR(-20008, 
                'Nội dung này yêu cầu người xem từ 18 tuổi trở lên. ' ||
                'Tuổi hiện tại của hồ sơ: ' || v_TuoiNguoiXem);
        END IF;
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20009, 'Không tìm thấy thông tin Video hoặc Hồ sơ.');
END;
`;

const triggerVIPSQL = `
CREATE OR REPLACE TRIGGER TRG_KIEM_QUYEN_XEM_PHIM
BEFORE INSERT OR UPDATE ON LICH_SU_XEM
FOR EACH ROW
DECLARE
    v_YeuCauGoiVP  NVARCHAR2(20);  -- Yeu cau goi cua VIDEO_PHAT
    v_GoiHienTai   NVARCHAR2(30);  -- Goi hien tai cua thanh vien
    v_MaTK_TV      VARCHAR2(10);
    v_MaPhim       VARCHAR2(10);
    v_STT          NUMBER(5);      -- So thu tu tap phim
BEGIN
    -- Lấy thông tin VIDEO_PHAT
    SELECT YeuCauGoi, MaPhim, STT
    INTO v_YeuCauGoiVP, v_MaPhim, v_STT
    FROM VIDEO_PHAT
    WHERE MaVP = :NEW.MaVP;

    -- Nếu video là VIP -> kiểm tra quyền người dùng
    IF v_YeuCauGoiVP = 'VIP' THEN

        -- Lấy gói hiện tại của thành viên
        SELECT MaTK_TV INTO v_MaTK_TV
        FROM HO_SO WHERE MaHoSo = :NEW.MaHoSo;

        SELECT GoiHienTai INTO v_GoiHienTai
        FROM THANH_VIEN WHERE MaTK = v_MaTK_TV;

        -- Nếu là thành viên VIP -> cho xem tất cả
        IF v_GoiHienTai = 'VIP' THEN
            RETURN;
        END IF;

        -- ĐIỀU KIỆN 2: Phim lẻ -> chặn luôn
        IF v_STT IS NULL THEN
            RAISE_APPLICATION_ERROR(-20011,
                'Phim lẻ này yêu cầu gói VIP. Vui lòng nâng cấp tài khoản.');
        END IF;

        -- ĐIỀU KIỆN 1: Phim bộ -> cho xem 2 tập đầu, chặn từ tập 3
        IF v_STT IS NOT NULL AND v_STT > 2 THEN
            RAISE_APPLICATION_ERROR(-20012,
                'Bạn đã xem hết 2 tập miễn phí. '  ||
                'Vui lòng nâng cấp gói VIP để xem tập ' || v_STT || ' trở đi.');
        END IF;

    END IF;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20014,
            'Không tìm thấy thông tin Video, Hồ sơ hoặc Thành viên.');
END;
`;

async function run() {
  try {
    await db.initialize();
    await db.execute(triggerAgeSQL);
    console.log('Trigger Age compiled successfully.');
    await db.execute(triggerVIPSQL);
    console.log('Trigger VIP compiled successfully.');
  } catch (err) {
    console.error('Error compiling trigger:', err);
  } finally {
    await db.close();
    process.exit();
  }
}

run();
