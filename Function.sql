-- 1. Kiểm tra quyền xem phim (Chặn User xem chùa phim VIP)
CREATE OR REPLACE FUNCTION fn_KiemTraQuyenXem (
    p_MaTK IN VARCHAR2,
    p_MaPB IN VARCHAR2
) RETURN NUMBER IS
    v_GoiUser NVARCHAR2(30);
    v_YeuCauGoi NVARCHAR2(20);
BEGIN
    SELECT GoiHienTai INTO v_GoiUser FROM THANH_VIEN WHERE MaTK = p_MaTK;
    SELECT YeuCauGoi INTO v_YeuCauGoi FROM PHIEN_BAN_VIDEO WHERE MaPB = p_MaPB;
    
    IF v_YeuCauGoi = N'Miễn phí' THEN
        RETURN 1;
    ELSIF v_GoiUser = N'VIP' AND v_YeuCauGoi = N'VIP' THEN
        RETURN 1;
    ELSE
        RETURN 0; 
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN RETURN 0;
END;
/

-- 2. Check xem phim đã có trong "Danh sách của tôi" chưa 
CREATE OR REPLACE FUNCTION fn_CheckDanhSachCuaToi (
    p_MaHoSo IN VARCHAR2,
    p_MaPhim IN VARCHAR2
) RETURN NUMBER IS
    v_Check NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_Check 
    FROM THEM_DANH_SACH_CUA_TOI 
    WHERE MaHoSo = p_MaHoSo AND MaPhim = p_MaPhim;
    
    IF v_Check > 0 THEN 
        RETURN 1; -- Đã có trong danh sách
    ELSE 
        RETURN 0; -- Chưa có
    END IF;
END;
/
-- 3. Tính điểm đánh giá trung bình (Hiển thị số sao của bộ phim)
CREATE OR REPLACE FUNCTION fn_LaySaoTrungBinh (
    p_MaPhim IN VARCHAR2
) RETURN NUMBER IS
    v_DiemTB NUMBER(3,2);
BEGIN
    SELECT ROUND(AVG(SoDiem), 2) INTO v_DiemTB
    FROM BINH_LUAN_DANH_GIA
    WHERE MaPhim = p_MaPhim AND TrangThai = N'Hiển thị';
    
    RETURN NVL(v_DiemTB, 0.00);
END;
/

-- 4. Kiểm tra giới hạn độ tuổi người dùng 
CREATE OR REPLACE FUNCTION fn_CheckDoTuoiUser (
    p_MaTK IN VARCHAR2
) RETURN NUMBER IS
    v_Tuoi NUMBER;
    v_NgaySinh DATE;
BEGIN
    SELECT NgaySinh INTO v_NgaySinh FROM THANH_VIEN WHERE MaTK = p_MaTK;
    v_Tuoi := FLOOR(MONTHS_BETWEEN(SYSDATE, v_NgaySinh) / 12);
    
    IF v_Tuoi >= 18 THEN RETURN 1; 
    ELSE RETURN 0; 
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN RETURN 0;
END;
/

-- 5. Đếm số tập phim Bộ đã xem xong 
CREATE OR REPLACE FUNCTION fn_TinhTienDoPhimBo (
    p_MaHoSo IN VARCHAR2,
    p_MaPhim IN VARCHAR2
) RETURN NUMBER IS
    v_SoTapDaXong NUMBER;
BEGIN
    SELECT COUNT(DISTINCT ls.MaVP) INTO v_SoTapDaXong
    FROM LICH_SU_XEM ls
    JOIN VIDEO_PHAT vp ON ls.MaVP = vp.MaVP
    WHERE ls.MaHoSo = p_MaHoSo 
      AND vp.MaPhim = p_MaPhim
      AND ls.TienDo >= (vp.ThoiLuong * 0.9);
      
    RETURN v_SoTapDaXong;
END;
/

-- 6. Lấy thời điểm xem tiếp 
CREATE OR REPLACE FUNCTION fn_LayThoiDiemXemTiep (
    p_MaHoSo IN VARCHAR2,
    p_MaVP IN VARCHAR2
) RETURN NUMBER IS
    v_TienDo NUMBER;
BEGIN
    SELECT NVL(MAX(TienDo), 0) INTO v_TienDo
    FROM LICH_SU_XEM
    WHERE MaHoSo = p_MaHoSo AND MaVP = p_MaVP;
    RETURN v_TienDo;
END;
/

-- 7. Kiểm tra Hồ sơ cá nhân có cài mã PIN bảo mật không (Khóa trẻ em Profile)
CREATE OR REPLACE FUNCTION fn_CheckHoSoCoPin (
    p_MaHoSo IN VARCHAR2
) RETURN NUMBER IS
    v_MaPIN VARCHAR2(4);
BEGIN
    SELECT MaPIN INTO v_MaPIN FROM HO_SO WHERE MaHoSo = p_MaHoSo;
    IF v_MaPIN IS NOT NULL THEN
        RETURN 1; 
    ELSE
        RETURN 0; 
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN RETURN 0;
END;
/

-- 8. Đếm tổng số bình luận công khai của một bộ phim
CREATE OR REPLACE FUNCTION fn_DemBinhLuanPhim (
    p_MaPhim IN VARCHAR2
) RETURN NUMBER IS
    v_Count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_Count
    FROM BINH_LUAN_DANH_GIA
    WHERE MaPhim = p_MaPhim AND TrangThai = N'Hiển thị';
    RETURN v_Count;
END;
/

-- 9. Tìm nhân viên CSKH đang rảnh nhất (Ít ca nhất) để tự động điều phối chat
CREATE OR REPLACE FUNCTION fn_LayCSKHRanhNhat RETURN VARCHAR2 IS
    v_MaTK VARCHAR2(10);
BEGIN
    SELECT MaTK INTO v_MaTK
    FROM (
        SELECT MaTK FROM CHAM_SOC_KHACH_HANG
        WHERE TrangThai = N'Sẵn sàng'
        ORDER BY SoPhienDangXuLy ASC
    ) WHERE ROWNUM = 1;
    RETURN v_MaTK;
EXCEPTION
    WHEN NO_DATA_FOUND THEN RETURN NULL;
END;
/

-- 10. Tính tổng số tiền một người dùng đã nạp hệ thống (Tính năng Thăng hạng hội viên)
CREATE OR REPLACE FUNCTION fn_TinhTongTienNap (
    p_MaTK IN VARCHAR2
) RETURN NUMBER IS
    v_TongTien NUMBER;
BEGIN
    SELECT NVL(SUM(SoTien), 0) INTO v_TongTien
    FROM GIAO_DICH
    WHERE MaTK_TV = p_MaTK AND TrangThai = N'Thành công';
    RETURN v_TongTien;
END;
/

-- 11 Đếm số tập phim Bộ thực tế đã được cập nhật lên hệ thống
CREATE OR REPLACE FUNCTION fn_DemSoTapHienCo (
    p_MaPhim IN VARCHAR2
) RETURN NUMBER IS
    v_Count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_Count FROM VIDEO_PHAT WHERE MaPhim = p_MaPhim;
    RETURN v_Count;
END;
/

-- 12. Tính tổng doanh thu thu về từ một Chiến dịch Quảng cáo của Đối tác
CREATE OR REPLACE FUNCTION fn_DoanhThuChienDichQC (
    p_MaQC IN VARCHAR2
) RETURN NUMBER IS
    v_DoanhThu NUMBER;
BEGIN
    SELECT NVL(SoLuotXem * DonGia, 0) INTO v_DoanhThu
    FROM QUANG_CAO
    WHERE MaQC = p_MaQC;
    RETURN v_DoanhThu;
EXCEPTION
    WHEN NO_DATA_FOUND THEN RETURN 0;
END;
/

-- 13. Đếm số lượt báo cáo vi phạm của một bình luận (Đẩy dữ liệu lên trang duyệt Mod)
CREATE OR REPLACE FUNCTION fn_DemReportBinhLuan (
    p_MaBL IN VARCHAR2
) RETURN NUMBER IS
    v_Count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_Count FROM BAO_CAO_VI_PHAM WHERE MaBL = p_MaBL;
    RETURN v_Count;
END;
/
-- 14. T�nh ng�y h?t h?n VIP d?a tr�n t?ng ti?n n?p (99,000� = 30 ng�y)
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
    WHERE MaTK_TV = p_MaTK AND TrangThai = N'Th�nh c�ng';
    
    -- Quy �?i: M?i 99,000 VN� = 30 ng�y VIP
    v_NgayHetHan := v_NgayDK + (v_TongTien / 99000) * 30;
    
    RETURN v_NgayHetHan;
EXCEPTION
    WHEN NO_DATA_FOUND THEN RETURN SYSDATE;
END;
/


-- 14. Tính ngày hết hạn VIP dựa trên tổng tiền nạp (99,000đ = 30 ngày)
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
/
