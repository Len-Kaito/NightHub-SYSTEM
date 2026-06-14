-- 1. THÊM BÌNH LUẬN ĐÁNH GIÁ PHIM
CREATE OR REPLACE PROCEDURE sp_BinhLuanPhim (
    p_NoiDung IN NVARCHAR2,
    p_SoDiem IN NUMBER,
    p_MaHoSo IN VARCHAR2,
    p_MaPhim IN VARCHAR2
) AS
    v_mabl VARCHAR2(10);
    v_count_hs NUMBER;
    v_count_phim NUMBER;
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

    SELECT 'BL' || LPAD(NVL(MAX(TO_NUMBER(SUBSTR(MaBL, 3))), 0) + 1, 3, '0')
    INTO v_mabl FROM BINH_LUAN_DANH_GIA;

    INSERT INTO BINH_LUAN_DANH_GIA (MaBL, NoiDung, SoDiem, NgayTao, TrangThai, MaHoSo, MaPhim)
    VALUES (v_mabl, p_NoiDung, p_SoDiem, CURRENT_TIMESTAMP, N'Hiển thị', p_MaHoSo, p_MaPhim);

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đã thêm bình luận: ' || v_mabl);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Có lỗi xảy ra: ' || SQLERRM);
        RAISE;
END;
/

-- 2. THÊM PHIM VÀO DANH SÁCH CỦA TÔI
CREATE OR REPLACE PROCEDURE sp_ThemDanhSachCuaToi (
    p_MaHoSo IN VARCHAR2,
    p_MaPhim IN VARCHAR2
) AS
    v_count_hs NUMBER;
    v_count_phim NUMBER;
    v_count_duplicate NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count_hs FROM HO_SO WHERE MaHoSo = p_MaHoSo;
    IF v_count_hs = 0 THEN
        raise_application_error(-20001, 'Lỗi: Mã hồ sơ không tồn tại.');
    END IF;

    SELECT COUNT(*) INTO v_count_phim FROM PHIM WHERE MaPhim = p_MaPhim;
    IF v_count_phim = 0 THEN
        raise_application_error(-20002, 'Lỗi: Mã phim không tồn tại.');
    END IF;

    SELECT COUNT(*) INTO v_count_duplicate 
    FROM THEM_DANH_SACH_CUA_TOI 
    WHERE MaHoSo = p_MaHoSo AND MaPhim = p_MaPhim;

    IF v_count_duplicate > 0 THEN
        DBMS_OUTPUT.PUT_LINE('Phim đã có trong danh sách của tôi.');
        RETURN;
    END IF;

    INSERT INTO THEM_DANH_SACH_CUA_TOI (MaHoSo, MaPhim, NgayThem)
    VALUES (p_MaHoSo, p_MaPhim, SYSDATE);

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đã thêm phim ' || p_MaPhim || ' vào danh sách của tôi.');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Có lỗi xảy ra: ' || SQLERRM);
        RAISE;
END;
/

-- 3. ĐĂNG KÝ TÀI KHOẢN MỚI
CREATE OR REPLACE PROCEDURE sp_DangKyTaiKhoan (
    p_Email IN VARCHAR2,
    p_MatKhau IN VARCHAR2,
    p_TenHT IN NVARCHAR2,
    p_SoDienThoai IN VARCHAR2 DEFAULT NULL,
    p_NgaySinh IN DATE DEFAULT NULL,
    p_GioiTinh IN NVARCHAR2 DEFAULT NULL
) AS
    v_matk VARCHAR2(10);
    v_mahoso VARCHAR2(10);
    v_count_email NUMBER;
BEGIN
    IF p_Email NOT LIKE '%@%.%' THEN
        raise_application_error(-20001, 'Lỗi: Email không hợp lệ.');
    END IF;

    SELECT COUNT(*) INTO v_count_email FROM TAI_KHOAN WHERE Email = p_Email;
    IF v_count_email > 0 THEN
        raise_application_error(-20002, 'Lỗi: Email đã được đăng ký.');
    END IF;

    IF p_SoDienThoai IS NOT NULL AND NOT REGEXP_LIKE(p_SoDienThoai, '^0[0-9]{9}$') THEN
        raise_application_error(-20003, 'Lỗi: Số điện thoại không hợp lệ.');
    END IF;

    SELECT 'TK' || LPAD(NVL(MAX(TO_NUMBER(SUBSTR(MaTK, 3))), 0) + 1, 3, '0')
    INTO v_matk FROM TAI_KHOAN;

    INSERT INTO TAI_KHOAN (MaTK, Email, MatKhau, TenHT, NgayDK, TrangThai, MaVT)
    VALUES (v_matk, p_Email, p_MatKhau, p_TenHT, SYSDATE, N'Hoạt động', 'USER');

    INSERT INTO THANH_VIEN (MaTK, SoDienThoai, NgaySinh, GioiTinh, GoiHienTai)
    VALUES (v_matk, p_SoDienThoai, p_NgaySinh, p_GioiTinh, N'Miễn phí');

    SELECT 'HS' || LPAD(NVL(MAX(TO_NUMBER(SUBSTR(MaHoSo, 3))), 0) + 1, 3, '0')
    INTO v_mahoso FROM HO_SO;

    INSERT INTO HO_SO (MaHoSo, TenHoSo, AnhDaiDien, LoaiHoSo, MaPIN, MaTK_TV)
    VALUES (v_mahoso, p_TenHT, 'DEFAULT', N'Người lớn', NULL, v_matk);

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đăng ký tài khoản thành công: ' || v_matk);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Có lỗi xảy ra: ' || SQLERRM);
        RAISE;
END;
/

-- 4. TẠO MỚI HỒ SƠ XEM PHIM
CREATE OR REPLACE PROCEDURE sp_TaoHoSo (
    p_TenHoSo IN NVARCHAR2,
    p_AnhDaiDien IN VARCHAR2,
    p_LoaiHoSo IN NVARCHAR2,
    p_MaPIN IN VARCHAR2,
    p_MaTK_TV IN VARCHAR2
) AS
    v_mahoso VARCHAR2(10);
    v_count_tv NUMBER;
    v_profile_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count_tv FROM THANH_VIEN WHERE MaTK = p_MaTK_TV;
    IF v_count_tv = 0 THEN
        raise_application_error(-20001, 'Lỗi: Mã tài khoản thành viên không tồn tại.');
    END IF;

    IF p_LoaiHoSo NOT IN (N'Người lớn', N'Trẻ em') THEN
        raise_application_error(-20002, 'Lỗi: Loại hồ sơ phải là "Người lớn" hoặc "Trẻ em".');
    END IF;

    IF p_MaPIN IS NOT NULL AND NOT REGEXP_LIKE(p_MaPIN, '^[0-9]{4}$') THEN
        raise_application_error(-20003, 'Lỗi: Mã PIN bảo mật hồ sơ phải gồm 4 chữ số.');
    END IF;

    SELECT COUNT(*) INTO v_profile_count FROM HO_SO WHERE MaTK_TV = p_MaTK_TV;
    IF v_profile_count >= 5 THEN
        raise_application_error(-20004, 'Lỗi: Tài khoản đã đạt giới hạn tối đa 5 hồ sơ.');
    END IF;

    SELECT 'HS' || LPAD(NVL(MAX(TO_NUMBER(SUBSTR(MaHoSo, 3))), 0) + 1, 3, '0')
    INTO v_mahoso FROM HO_SO;

    INSERT INTO HO_SO (MaHoSo, TenHoSo, AnhDaiDien, LoaiHoSo, MaPIN, MaTK_TV)
    VALUES (v_mahoso, p_TenHoSo, NVL(p_AnhDaiDien, 'DEFAULT'), p_LoaiHoSo, p_MaPIN, p_MaTK_TV);

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đã tạo hồ sơ: ' || v_mahoso);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Có lỗi xảy ra: ' || SQLERRM);
        RAISE;
END;
/

-- 5. CẬP NHẬT THÔNG TIN NGƯỜI DÙNG
CREATE OR REPLACE PROCEDURE sp_CapNhatNguoiDung (
    p_MaTK IN VARCHAR2,
    p_TenHT IN NVARCHAR2,
    p_SoDienThoai IN VARCHAR2 DEFAULT NULL,
    p_NgaySinh IN DATE DEFAULT NULL,
    p_GioiTinh IN NVARCHAR2 DEFAULT NULL
) AS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM TAI_KHOAN WHERE MaTK = p_MaTK;
    IF v_count = 0 THEN
        raise_application_error(-20001, 'Lỗi: Tài khoản không tồn tại.');
    END IF;

    IF p_SoDienThoai IS NOT NULL AND NOT REGEXP_LIKE(p_SoDienThoai, '^0[0-9]{9}$') THEN
        raise_application_error(-20002, 'Lỗi: Số điện thoại không hợp lệ.');
    END IF;

    IF p_GioiTinh IS NOT NULL AND p_GioiTinh NOT IN (N'Nam', N'Nữ', N'Khác') THEN
        raise_application_error(-20003, 'Lỗi: Giới tính không hợp lệ.');
    END IF;

    UPDATE TAI_KHOAN
    SET TenHT = NVL(p_TenHT, TenHT)
    WHERE MaTK = p_MaTK;

    UPDATE THANH_VIEN
    SET SoDienThoai = NVL(p_SoDienThoai, SoDienThoai),
        NgaySinh = NVL(p_NgaySinh, NgaySinh),
        GioiTinh = NVL(p_GioiTinh, GioiTinh)
    WHERE MaTK = p_MaTK;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đã cập nhật thông tin tài khoản: ' || p_MaTK);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Có lỗi xảy ra: ' || SQLERRM);
        RAISE;
END;
/

-- 6. KHÓA / MỞ KHÓA TÀI KHOẢN NGƯỜI DÙNG
CREATE OR REPLACE PROCEDURE sp_KhoaMoTaiKhoan (
    p_MaTK IN VARCHAR2,
    p_TrangThaiMoi IN NVARCHAR2
) AS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM TAI_KHOAN WHERE MaTK = p_MaTK;
    IF v_count = 0 THEN
        raise_application_error(-20001, 'Lỗi: Tài khoản không tồn tại.');
    END IF;

    IF p_TrangThaiMoi NOT IN (N'Hoạt động', N'Bị khóa', N'Chưa xác thực') THEN
        raise_application_error(-20002, 'Lỗi: Trạng thái mới không hợp lệ.');
    END IF;

    UPDATE TAI_KHOAN
    SET TrangThai = p_TrangThaiMoi
    WHERE MaTK = p_MaTK;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đã cập nhật trạng thái tài khoản ' || p_MaTK || ' thành: ' || p_TrangThaiMoi);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Có lỗi xảy ra: ' || SQLERRM);
        RAISE;
END;
/

-- 7. THÊM PHIM MỚI
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
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Có lỗi xảy ra: ' || SQLERRM);
        RAISE;
END;
/

-- 8. CẬP NHẬT THÔNG TIN PHIM
CREATE OR REPLACE PROCEDURE sp_CapNhatPhim (
    p_MaPhim IN VARCHAR2,
    p_TenPhim IN NVARCHAR2 DEFAULT NULL,
    p_Poster IN VARCHAR2 DEFAULT NULL,
    p_MoTa IN NVARCHAR2 DEFAULT NULL,
    p_NamSX IN NUMBER DEFAULT NULL,
    p_QuocGia IN NVARCHAR2 DEFAULT NULL,
    p_URLTrailer IN VARCHAR2 DEFAULT NULL,
    p_TrangThaiKD IN NVARCHAR2 DEFAULT NULL,
    p_TrangThaiHT IN NVARCHAR2 DEFAULT NULL
) AS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM PHIM WHERE MaPhim = p_MaPhim;
    IF v_count = 0 THEN
        raise_application_error(-20001, 'Lỗi: Mã phim không tồn tại.');
    END IF;

    IF p_NamSX IS NOT NULL AND p_NamSX NOT BETWEEN 1888 AND 2031 THEN
        raise_application_error(-20002, 'Lỗi: Năm sản xuất không hợp lệ.');
    END IF;

    IF p_TrangThaiKD IS NOT NULL AND p_TrangThaiKD NOT IN (N'Chờ duyệt', N'Đã duyệt', N'Từ chối') THEN
        raise_application_error(-20003, 'Lỗi: Trạng thái kiểm duyệt không hợp lệ.');
    END IF;

    IF p_TrangThaiHT IS NOT NULL AND p_TrangThaiHT NOT IN (N'Công khai', N'Ẩn', N'Sắp chiếu') THEN
        raise_application_error(-20004, 'Lỗi: Trạng thái hiển thị không hợp lệ.');
    END IF;

    UPDATE PHIM
    SET TenPhim = NVL(p_TenPhim, TenPhim),
        Poster = NVL(p_Poster, Poster),
        MoTa = NVL(p_MoTa, MoTa),
        NamSX = NVL(p_NamSX, NamSX),
        QuocGia = NVL(p_QuocGia, QuocGia),
        URLTrailer = NVL(p_URLTrailer, URLTrailer),
        TrangThaiKD = NVL(p_TrangThaiKD, TrangThaiKD),
        TrangThaiHT = NVL(p_TrangThaiHT, TrangThaiHT)
    WHERE MaPhim = p_MaPhim;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đã cập nhật thông tin phim: ' || p_MaPhim);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Có lỗi xảy ra: ' || SQLERRM);
        RAISE;
END;
/

-- 9. TẠO CHIẾN DỊCH QUẢNG CÁO MỚI
CREATE OR REPLACE PROCEDURE sp_TaoQuangCao (
    p_SoLuotYeuCau IN NUMBER,
    p_DonGia IN NUMBER,
    p_URLVideo IN VARCHAR2,
    p_MaDT IN VARCHAR2
) AS
    v_maqc VARCHAR2(10);
    v_count_dt NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count_dt FROM DOI_TAC WHERE MaDT = p_MaDT;
    IF v_count_dt = 0 THEN
        raise_application_error(-20001, 'Lỗi: Mã đối tác không tồn tại.');
    END IF;

    IF p_SoLuotYeuCau <= 0 THEN
        raise_application_error(-20002, 'Lỗi: Số lượt yêu cầu phải lớn hơn 0.');
    END IF;

    IF p_DonGia <= 0 THEN
        raise_application_error(-20003, 'Lỗi: Đơn giá phải lớn hơn 0.');
    END IF;

    SELECT 'QC' || LPAD(NVL(MAX(TO_NUMBER(SUBSTR(MaQC, 3))), 0) + 1, 3, '0')
    INTO v_maqc FROM QUANG_CAO;

    INSERT INTO QUANG_CAO (MaQC, SoLuotYeuCau, SoLuotXem, DonGia, TrangThai, URLVideo, MaDT)
    VALUES (v_maqc, p_SoLuotYeuCau, 0, p_DonGia, N'Chờ duyệt', p_URLVideo, p_MaDT);

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đã tạo chiến dịch quảng cáo: ' || v_maqc);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Có lỗi xảy ra: ' || SQLERRM);
        RAISE;
END;
/

-- 10. TẠO PHIÊN CHAT HỖ TRỢ / TICKET
CREATE OR REPLACE PROCEDURE sp_TaoPhienChat (
    p_MaHoSo IN VARCHAR2,
    p_MaTK_CSKH IN VARCHAR2 DEFAULT NULL
) AS
    v_maphien VARCHAR2(15);
    v_count_hs NUMBER;
    v_count_cskh NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count_hs FROM HO_SO WHERE MaHoSo = p_MaHoSo;
    IF v_count_hs = 0 THEN
        raise_application_error(-20001, 'Lỗi: Mã hồ sơ không tồn tại.');
    END IF;

    IF p_MaTK_CSKH IS NOT NULL THEN
        SELECT COUNT(*) INTO v_count_cskh FROM CHAM_SOC_KHACH_HANG WHERE MaTK = p_MaTK_CSKH;
        IF v_count_cskh = 0 THEN
            raise_application_error(-20002, 'Lỗi: Mã nhân viên CSKH không tồn tại.');
        END IF;
    END IF;

    SELECT 'PC' || LPAD(NVL(MAX(TO_NUMBER(SUBSTR(MaPhien, 3))), 0) + 1, 3, '0')
    INTO v_maphien FROM PHIEN_CHAT_AI;

    INSERT INTO PHIEN_CHAT_AI (MaPhien, NgayTao, TrangThai, MaHoSo, MaTK_CSKH)
    VALUES (v_maphien, CURRENT_TIMESTAMP, N'Đang chat', p_MaHoSo, p_MaTK_CSKH);

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đã tạo phiên chat hỗ trợ: ' || v_maphien);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Có lỗi xảy ra: ' || SQLERRM);
        RAISE;
END;
/

-- 10. BÁO CÁO BÌNH LUẬN
CREATE OR REPLACE PROCEDURE sp_BaoCaoBinhLuan (
    p_MaBL IN VARCHAR2,
    p_MaHoSoGui IN VARCHAR2,
    p_LyDo IN NVARCHAR2
) AS
    v_mabc VARCHAR2(10);
    v_mablkd VARCHAR2(10);
    v_noidung NVARCHAR2(2000);
    v_count_bl NUMBER;
    v_count_hs NUMBER;
BEGIN
    -- 1. Kiểm tra bình luận tồn tại
    SELECT COUNT(*) INTO v_count_bl FROM BINH_LUAN_DANH_GIA WHERE MaBL = p_MaBL;
    IF v_count_bl = 0 THEN
        raise_application_error(-20001, 'Lỗi: Bình luận không tồn tại.');
    END IF;

    -- Lấy nội dung bình luận
    SELECT NoiDung INTO v_noidung FROM BINH_LUAN_DANH_GIA WHERE MaBL = p_MaBL;

    -- 2. Kiểm tra hồ sơ gửi báo cáo tồn tại
    SELECT COUNT(*) INTO v_count_hs FROM HO_SO WHERE MaHoSo = p_MaHoSoGui;
    IF v_count_hs = 0 THEN
        raise_application_error(-20002, 'Lỗi: Hồ sơ báo cáo không tồn tại.');
    END IF;

    -- 3. Khởi tạo mã Báo Cáo mới
    SELECT 'BC' || LPAD(NVL(MAX(TO_NUMBER(SUBSTR(MaBC, 3))), 0) + 1, 3, '0')
    INTO v_mabc FROM BAO_CAO_VI_PHAM;

    -- Khởi tạo mã Bình Luận Kiểm Duyệt mới
    SELECT 'BLKD' || LPAD(NVL(MAX(TO_NUMBER(SUBSTR(MaBLKD, 5))), 0) + 1, 3, '0')
    INTO v_mablkd FROM BINH_LUAN_KIEM_DUYET;

    -- 4. Thêm vào bảng BAO_CAO_VI_PHAM
    INSERT INTO BAO_CAO_VI_PHAM (MaBC, LyDo, NgayTao, MaBL, MaHoSoGui)
    VALUES (v_mabc, p_LyDo, CURRENT_TIMESTAMP, p_MaBL, p_MaHoSoGui);

    -- 5. Nối bình luận vào bảng BINH_LUAN_KIEM_DUYET cho Admin
    INSERT INTO BINH_LUAN_KIEM_DUYET (MaBLKD, NoiDung, TrangThaiXL, MaBC)
    VALUES (v_mablkd, v_noidung, 'Chờ xử lý', v_mabc);

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đã gửi báo cáo thành công: ' || v_mabc);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Có lỗi xảy ra: ' || SQLERRM);
        RAISE;
END;
/

-- 11. XÓA BÌNH LUẬN
CREATE OR REPLACE PROCEDURE sp_XoaBinhLuan (
    p_MaBL IN VARCHAR2,
    p_MaHoSo IN VARCHAR2
) AS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM BINH_LUAN_DANH_GIA WHERE MaBL = p_MaBL AND MaHoSo = p_MaHoSo;
    IF v_count = 0 THEN
        raise_application_error(-20001, 'Lỗi: Không tìm thấy bình luận hoặc bạn không có quyền xóa.');
    END IF;

    DELETE FROM BINH_LUAN_DANH_GIA WHERE MaBL = p_MaBL;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đã xóa bình luận thành công.');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Có lỗi xảy ra: ' || SQLERRM);
        RAISE;
END;
/


-- 12. MUA GÓI VIP (THANH TOÁN)
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
/
