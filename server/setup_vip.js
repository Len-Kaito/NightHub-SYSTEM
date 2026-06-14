const db = require('./config/database');

const fnSQL = `
CREATE OR REPLACE FUNCTION fn_TinhNgayHetHanVIP (
    p_MaTK IN VARCHAR2
) RETURN DATE IS
    v_NgayHetHan DATE;
    v_NgayDK DATE;
    v_TongTien NUMBER;
BEGIN
    SELECT NgayDK INTO v_NgayDK FROM TAI_KHOAN WHERE MaTK = p_MaTK;
    
    SELECT NVL(SUM(SoTien), 0) INTO v_TongTien 
    FROM GIAO_DICH 
    WHERE MaTK_TV = p_MaTK AND TrangThai = N'Thành công';
    
    -- Quy đổi: Mỗi 99,000 VNĐ = 30 ngày VIP
    v_NgayHetHan := v_NgayDK + (v_TongTien / 99000) * 30;
    
    RETURN v_NgayHetHan;
EXCEPTION
    WHEN NO_DATA_FOUND THEN RETURN SYSDATE;
END;
`;

const procSQL = `
CREATE OR REPLACE PROCEDURE sp_MuaGoiVIP (
    p_MaTK IN VARCHAR2,
    p_SoTien IN NUMBER,
    p_MaDT IN VARCHAR2 DEFAULT NULL
) AS
    v_MaGD VARCHAR2(15);
    v_CheckTV NUMBER;
BEGIN
    -- Kiểm tra thành viên có tồn tại không
    SELECT COUNT(*) INTO v_CheckTV FROM THANH_VIEN WHERE MaTK = p_MaTK;
    IF v_CheckTV = 0 THEN
        RAISE_APPLICATION_ERROR(-20021, 'Lỗi: Thành viên không tồn tại.');
    END IF;

    -- Tự sinh mã giao dịch: GD + số tăng dần
    SELECT 'GD' || LPAD(NVL(MAX(TO_NUMBER(SUBSTR(MaGD, 3))), 0) + 1, 3, '0')
    INTO v_MaGD FROM GIAO_DICH;

    -- Thêm giao dịch Thành công
    INSERT INTO GIAO_DICH (MaGD, SoTien, TrangThai, NgayGiaoDich, MaTK_TV, MaDT)
    VALUES (v_MaGD, p_SoTien, N'Thành công', SYSDATE, p_MaTK, p_MaDT);

    -- Cập nhật gói thành viên thành VIP
    UPDATE THANH_VIEN
    SET GoiHienTai = 'VIP'
    WHERE MaTK = p_MaTK;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Thanh toán thành công. Đã nâng cấp VIP cho user ' || p_MaTK);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
`;

async function run() {
  try {
    await db.initialize();
    await db.execute(fnSQL);
    console.log('Function fn_TinhNgayHetHanVIP compiled.');
    
    await db.execute(procSQL);
    console.log('Procedure sp_MuaGoiVIP compiled.');
  } catch (err) {
    console.error('Database setup error:', err);
  } finally {
    await db.close();
    process.exit(0);
  }
}

run();
