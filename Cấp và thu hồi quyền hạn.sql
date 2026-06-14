CREATE ROLE C##ROLE_USER;
CREATE ROLE C##ROLE_CC;
CREATE ROLE C##ROLE_MOD;
CREATE ROLE C##ROLE_CONTENT_ADMIN;

-- Tạo user
CREATE USER C##usr_sysadmin IDENTIFIED BY "Admin@123";
CREATE USER C##usr_content  IDENTIFIED BY "Content@123";
CREATE USER C##usr_mod      IDENTIFIED BY "Mod@123";
CREATE USER C##usr_member   IDENTIFIED BY "Member@123";
CREATE USER C##usr_cskh     IDENTIFIED BY "Cskh@123";

-- Cấp quyền đăng nhập
GRANT CREATE SESSION TO C##usr_sysadmin, C##usr_content, 
                        C##usr_mod, C##usr_member, C##usr_cskh;

-- Gán role cho user
GRANT DBA                  TO C##usr_sysadmin;
GRANT C##ROLE_CONTENT_ADMIN TO C##usr_content;
GRANT C##ROLE_MOD           TO C##usr_mod;
GRANT C##ROLE_USER          TO C##usr_member;
GRANT C##ROLE_CC            TO C##usr_cskh;


-- Grant bảng cho sysadmin
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.NHAT_KY_HE_THONG  TO C##usr_sysadmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.FAQ               TO C##usr_sysadmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.TAI_KHOAN         TO C##usr_sysadmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.VAI_TRO           TO C##usr_sysadmin;
GRANT SELECT                         ON C##DO_AN103.GIAO_DICH         TO C##usr_sysadmin;
GRANT SELECT                         ON C##DO_AN103.THANH_VIEN        TO C##usr_sysadmin;
GRANT SELECT                         ON C##DO_AN103.NHAN_VIEN         TO C##usr_sysadmin;
GRANT SELECT                         ON C##DO_AN103.PHIM              TO C##usr_sysadmin;
GRANT SELECT                         ON C##DO_AN103.QUANG_CAO         TO C##usr_sysadmin;

-- Grant bảng cho content admin
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.PHIM            TO C##usr_content;
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.PHIM_LE         TO C##usr_content;
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.PHIM_BO         TO C##usr_content;
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.VIDEO_PHAT      TO C##usr_content;
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.PHIEN_BAN_VIDEO TO C##usr_content;
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.DANH_MUC        TO C##usr_content;
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.TAG             TO C##usr_content;
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.DIEN_VIEN       TO C##usr_content;
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.DAO_DIEN        TO C##usr_content;
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.PHIM_DIEN_VIEN  TO C##usr_content;
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.PHIM_DAO_DIEN   TO C##usr_content;
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.PHIM_TAG        TO C##usr_content;
GRANT SELECT, INSERT, UPDATE, DELETE ON C##DO_AN103.PHIM_DANH_MUC   TO C##usr_content;
GRANT SELECT                         ON C##DO_AN103.DOI_TAC         TO C##usr_content;

-- Grant bảng cho mod
GRANT SELECT, UPDATE         ON C##DO_AN103.BINH_LUAN_DANH_GIA   TO C##usr_mod;
GRANT SELECT, INSERT, UPDATE ON C##DO_AN103.BINH_LUAN_KIEM_DUYET TO C##usr_mod;
GRANT SELECT, INSERT         ON C##DO_AN103.HE_THONG_DANH_DAU    TO C##usr_mod;
GRANT SELECT                 ON C##DO_AN103.BAO_CAO_VI_PHAM      TO C##usr_mod;
GRANT SELECT, INSERT         ON C##DO_AN103.THONG_BAO            TO C##usr_mod;
GRANT SELECT                 ON C##DO_AN103.HO_SO                TO C##usr_mod;
GRANT SELECT                 ON C##DO_AN103.TAI_KHOAN            TO C##usr_mod;

-- Grant bảng cho member
GRANT SELECT                 ON C##DO_AN103.PHIM                     TO C##usr_member;
GRANT SELECT                 ON C##DO_AN103.PHIM_LE                  TO C##usr_member;
GRANT SELECT                 ON C##DO_AN103.PHIM_BO                  TO C##usr_member;
GRANT SELECT                 ON C##DO_AN103.VIDEO_PHAT               TO C##usr_member;
GRANT SELECT                 ON C##DO_AN103.DANH_MUC                 TO C##usr_member;
GRANT SELECT                 ON C##DO_AN103.TAG                      TO C##usr_member;
GRANT SELECT                 ON C##DO_AN103.DIEN_VIEN                TO C##usr_member;
GRANT SELECT                 ON C##DO_AN103.DAO_DIEN                 TO C##usr_member;
GRANT SELECT, INSERT, UPDATE ON C##DO_AN103.HO_SO                    TO C##usr_member;
GRANT SELECT, INSERT         ON C##DO_AN103.LICH_SU_XEM              TO C##usr_member;
GRANT SELECT, INSERT, DELETE ON C##DO_AN103.THEM_DANH_SACH_YEU_THICH TO C##usr_member;
GRANT SELECT, INSERT         ON C##DO_AN103.BINH_LUAN_DANH_GIA       TO C##usr_member;
GRANT SELECT, INSERT         ON C##DO_AN103.BAO_CAO_VI_PHAM          TO C##usr_member;
GRANT SELECT                 ON C##DO_AN103.THONG_BAO                TO C##usr_member;
GRANT SELECT                 ON C##DO_AN103.GOI_Y_PHIM               TO C##usr_member;
GRANT SELECT, INSERT         ON C##DO_AN103.PHIEN_CHAT_AI            TO C##usr_member;
GRANT SELECT, INSERT         ON C##DO_AN103.TIN_NHAN_AI              TO C##usr_member;
GRANT SELECT, INSERT         ON C##DO_AN103.GIAO_DICH                TO C##usr_member;

-- Grant bảng cho cskh
GRANT SELECT         ON C##DO_AN103.TAI_KHOAN     TO C##usr_cskh;
GRANT SELECT         ON C##DO_AN103.THANH_VIEN    TO C##usr_cskh;
GRANT SELECT         ON C##DO_AN103.HO_SO         TO C##usr_cskh;
GRANT SELECT, UPDATE ON C##DO_AN103.PHIEN_CHAT_AI TO C##usr_cskh;
GRANT SELECT, INSERT ON C##DO_AN103.TIN_NHAN_AI   TO C##usr_cskh;
GRANT SELECT         ON C##DO_AN103.FAQ           TO C##usr_cskh;
GRANT SELECT         ON C##DO_AN103.GIAO_DICH     TO C##usr_cskh;
GRANT SELECT, INSERT ON C##DO_AN103.THONG_BAO     TO C##usr_cskh;

-- Tình huống 1: Thu hồi quyền DELETE của MOD
REVOKE DELETE ON C##DO_AN103.BINH_LUAN_DANH_GIA FROM C##USR_MOD;

-- Tình huống 2: Thu hồi quyền xem giao dịch của CSKH
REVOKE SELECT ON C##DO_AN103.GIAO_DICH FROM C##USR_CSKH;

-- Tình huống 3: Thu hồi quyền trên bảng của Content Admin
REVOKE ALL PRIVILEGES ON C##DO_AN103.PHIM       FROM C##USR_CONTENT;
REVOKE ALL PRIVILEGES ON C##DO_AN103.VIDEO_PHAT FROM C##USR_CONTENT;



DROP USER C##USR_CONTENT CASCADE;


-- Xem quyền của USR_MOD
SELECT GRANTEE, TABLE_NAME, PRIVILEGE
FROM DBA_TAB_PRIVS
WHERE GRANTEE = 'C##USR_MOD'
ORDER BY TABLE_NAME;

-- Xem ai có quyền trên bảng PHIM
SELECT GRANTEE, PRIVILEGE
FROM DBA_TAB_PRIVS
WHERE TABLE_NAME = 'PHIM'
  AND OWNER = 'C##DO_AN103'
ORDER BY GRANTEE;




-- 1.1. Thủ tục dành cho Kiểm duyệt viên (MOD): Duyệt bình luận vi phạm
CREATE OR REPLACE PROCEDURE Proc_Mod_XuLyBinhLuan (
    p_MaBLKD IN VARCHAR2,
    p_MaTK_KDV IN VARCHAR2,
    p_TrangThaiMoi IN NVARCHAR2,
    p_NoiDungPhanHoi IN NVARCHAR2
)
AS
BEGIN
    IF p_TrangThaiMoi NOT IN ('Đã ẩn', 'Bác bỏ') THEN
        RAISE_APPLICATION_ERROR(-20001, 'Trạng thái xử lý không hợp lệ.');
    END IF;

    UPDATE BINH_LUAN_KIEM_DUYET
    SET TrangThaiXL = p_TrangThaiMoi,
        MaTK_KDV = p_MaTK_KDV,
        NoiDung = NoiDung || ' - Phản hồi từ MOD: ' || p_NoiDungPhanHoi
    WHERE MaBLKD = p_MaBLKD;

    IF p_TrangThaiMoi = 'Đã ẩn' THEN
        UPDATE BINH_LUAN_DANH_GIA
        SET TrangThai = 'Bị ẩn hệ thống'
        WHERE MaBL IN (
            SELECT h.MaBL FROM HE_THONG_DANH_DAU h
            JOIN BINH_LUAN_KIEM_DUYET k ON h.MaHTDD = k.MaHTDD
            WHERE k.MaBLKD = p_MaBLKD
        );
    END IF;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20002, 'Lỗi hệ thống khi xử lý bình luận: ' || SQLERRM);
END;
/
-- 1.2. Thủ tục dành cho Người dùng (MEMBER): Thêm phim vào danh sách yêu thích
CREATE OR REPLACE PROCEDURE Proc_Member_ThemYeuThich (
    p_MaHoSo IN VARCHAR2,
    p_MaPhim IN VARCHAR2
)
AS
    v_Count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_Count
    FROM THEM_DANH_SACH_YEU_THICH
    WHERE MaHoSo = p_MaHoSo AND MaPhim = p_MaPhim;

    IF v_Count = 0 THEN
        INSERT INTO THEM_DANH_SACH_YEU_THICH (MaHoSo, MaPhim, NgayThem)
        VALUES (p_MaHoSo, p_MaPhim, SYSDATE);
        COMMIT;
    ELSE
        RAISE_APPLICATION_ERROR(-20003, 'Phim này đã có trong danh sách yêu thích.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20004, 'Lỗi khi thêm vào danh sách yêu thích: ' || SQLERRM);
END;
/
-- 1.3. Thủ tục dành cho Quản trị nội dung (CONTENT_ADMIN): Đăng phim mới
CREATE OR REPLACE PROCEDURE Proc_ContentAdmin_DangPhim (
    p_MaPhim IN VARCHAR2,
    p_TenPhim IN NVARCHAR2,
    p_NamSX IN NUMBER,
    p_MaDT IN VARCHAR2,
    p_MaTK_QTVND IN VARCHAR2
)
AS
BEGIN
    INSERT INTO PHIM (MaPhim, TenPhim, NamSX, MaDT, MaTK_QTVND, TrangThaiKD, TrangThaiHT)
    VALUES (p_MaPhim, p_TenPhim, p_NamSX, p_MaDT, p_MaTK_QTVND, 'Đã duyệt', 'Công khai');
    COMMIT;
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20005, 'Mã phim đã tồn tại trong hệ thống.');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20006, 'Lỗi thao tác đăng phim: ' || SQLERRM);
END;
/


-- GRANT EXECUTE
GRANT EXECUTE ON C##DO_AN103.Proc_Mod_XuLyBinhLuan     TO C##USR_MOD;
GRANT EXECUTE ON C##DO_AN103.Proc_Member_ThemYeuThich  TO C##USR_MEMBER;
GRANT EXECUTE ON C##DO_AN103.Proc_ContentAdmin_DangPhim TO C##USR_CONTENT;

-- REVOKE EXECUTE
REVOKE EXECUTE ON C##DO_AN103.Proc_ContentAdmin_DangPhim FROM C##USR_CONTENT;
REVOKE EXECUTE ON C##DO_AN103.Proc_Member_ThemYeuThich   FROM C##USR_MEMBER;


-- Kiểm tra quyền EXECUTE còn lại
SELECT GRANTEE, TABLE_NAME AS PROCEDURE_NAME, PRIVILEGE
FROM DBA_TAB_PRIVS
WHERE PRIVILEGE = 'EXECUTE'
  AND OWNER = 'C##DO_AN103'
ORDER BY GRANTEE;