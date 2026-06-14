-- Tự động ghi nhật ký hệ thống khi đăng nhập
CREATE OR REPLACE TRIGGER TRG_GHI_LOG_DANGNHAP
AFTER UPDATE OF TRANGTHAILAMVIEC ON NHAN_VIEN
FOR EACH ROW
DECLARE
    -- Khai báo biến lưu trữ con số tiếp theo sẽ được cấp phát
    V_NEXTLOG NUMBER;
    V_GHICHU  NVARCHAR2(500);
    V_MAVT    VARCHAR2(20);
BEGIN
    IF :OLD.TRANGTHAILAMVIEC <> 'Đang làm việc' AND :NEW.TRANGTHAILAMVIEC = 'Đang làm việc' THEN
    BEGIN 
        SELECT MAVT INTO V_MAVT
	    FROM TAI_KHOAN 
	    WHERE MATK = :NEW.MATK;
        EXCEPTION -- Bẫy lỗi an toàn: Tránh sập hệ thống nếu mất đồng bộ dữ liệu 
            WHEN NO_DATA_FOUND THEN 
                V_MAVT := 'UNKNOWN'; 
    END; 

    CASE V_MAVT
        WHEN 'SYS_ADMIN'     THEN V_GHICHU := 'Admin hệ thống đăng nhập hệ thống';
        WHEN 'CONTENT_ADMIN' THEN V_GHICHU := 'Admin nội dung đăng nhập hệ thống';
        WHEN 'MOD'           THEN V_GHICHU := 'Mod đăng nhập hệ thống';
        WHEN 'CC'            THEN V_GHICHU := 'CC đăng nhập hệ thống';
        ELSE                      V_GHICHU := 'Nhân viên đăng nhập hệ thống'; 
        END CASE;

        -- Thuật toán tìm mã số lớn nhất hiện tại và cộng 1
        SELECT NVL(MAX(TO_NUMBER(SUBSTR(MaLog, 4))), 0) + 1 
        INTO V_NEXTLOG
        FROM NHAT_KY_HE_THONG;
        
        -- Chèn dữ liệu với mã Log mới
        INSERT INTO NHAT_KY_HE_THONG (MALOG, NGAYGIO, HANHDONG, DOITUONG, GHICHU, MATK_NV)
        VALUES (
            -- Ép số vừa tính được vào khuôn 3 chữ số và nối với chữ 'LOG'
            'Log' || LPAD(V_NEXTLOG, 3, '0'),
            SYSDATE,
            'LOGIN',
            'Hệ thống',
            V_GHICHU,
            :NEW.MATK
        );
    END IF;
END;
/
-- Tự động đánh dấu bình luận vi phạm
CREATE OR REPLACE TRIGGER TRG_DANHDAU_BINHLUAN_VIPHAM
AFTER INSERT ON BINH_LUAN_DANH_GIA
FOR EACH ROW
DECLARE
    v_NextHTDD    NUMBER;
    v_NextBLKD    NUMBER;
    v_MaHTDD      VARCHAR2(10); 
    v_LoaiDanhDau NVARCHAR2(50);
    v_GhiChu      NVARCHAR2(500);
    v_NoiDung     NVARCHAR2(2000); -- Khai báo thêm biến hứng nội dung để dễ thao tác
BEGIN
    -- Chuyển toàn bộ nội dung sang chữ thường để kiểm tra
    v_NoiDung := LOWER(:NEW.NoiDung);

    -- =========================================================================
    -- BƯỚC 1: RÀ SOÁT TỪ KHÓA BẰNG BIỂU THỨC CHÍNH QUY (REGULAR EXPRESSIONS)
    -- Thứ tự IF/ELSIF thể hiện mức độ ưu tiên xử lý vi phạm (từ nặng đến nhẹ)
    -- =========================================================================
    
    -- 1. Vi phạm bản quyền (Copyright)
    IF REGEXP_LIKE(v_NoiDung, 'phimmoi|motphim|link lậu|xem free|bản cam|full hd miễn phí') THEN
        v_LoaiDanhDau := 'copyright';
        v_GhiChu := 'Phát hiện chia sẻ liên kết lậu, vi phạm bản quyền nội dung số.';
        
    -- 2. Nội dung khiêu dâm, nhạy cảm (NSFW - Not Safe For Work)
    ELSIF REGEXP_LIKE(v_NoiDung, '18\+|sex|porn|phim heo|link sẽ|nude') THEN
        v_LoaiDanhDau := 'nsfw';
        v_GhiChu := 'Phát hiện ngôn từ chứa nội dung nhạy cảm, đồi trụy.';
        
    -- 3. Ngôn từ thù ghét, thô tục (Hate Speech)
    ELSIF REGEXP_LIKE(v_NoiDung, 'dm|đm|vcl|chó đẻ|ngu học|thằng l|con c') THEN
        v_LoaiDanhDau := 'hate_speech';
        v_GhiChu := 'Phát hiện ngôn từ thô tục, công kích và thù ghét cộng đồng.';
        
    -- 4. Bạo lực (Violence)
    ELSIF REGEXP_LIKE(v_NoiDung, 'giết|chém|bắn nát|đẫm máu|chặt xác') THEN
        v_LoaiDanhDau := 'violence';
        v_GhiChu := 'Phát hiện từ ngữ mang khuynh hướng kích động bạo lực vật lý.';
        
    -- 5. Tự hại (Self-harm)
    ELSIF REGEXP_LIKE(v_NoiDung, 'tự tử|tự sát|muốn chết|rạch tay|kết liễu') THEN
        v_LoaiDanhDau := 'self_harm';
        v_GhiChu := 'Phát hiện nội dung nhạy cảm liên quan đến hành vi tự hại.';
        
    -- 6. Quấy rối cá nhân (Harrassment)
    ELSIF REGEXP_LIKE(v_NoiDung, 'xấu xí|đĩ|phò|trán dô|đồ bỏ đi') THEN
        v_LoaiDanhDau := 'harrassment';
        v_GhiChu := 'Phát hiện hành vi miệt thị ngoại hình hoặc quấy rối cá nhân.';
        
    -- 7. Spam, lừa đảo quảng cáo (Spam/Scam)
    -- Dấu \. dùng để bắt chính xác dấu chấm trong tên miền (vd: .com)
    ELSIF REGEXP_LIKE(v_NoiDung, 'spam|scam|http|www\.|\.com|\.vn|mua nick|giá rẻ|inbox') THEN
        v_LoaiDanhDau := 'spam';
        v_GhiChu := 'Phát hiện từ khóa rác, quảng cáo thương mại hoặc liên kết ngoài.';
        
    -- 8. Thông tin sai lệch (Fake Info)
    ELSIF REGEXP_LIKE(v_NoiDung, 'tin giả|lừa đảo|dắt mũi|bịa đặt') THEN
        v_LoaiDanhDau := 'fake_info';
        v_GhiChu := 'Phát hiện nghi vấn phát tán thông tin sai lệch, gây hoang mang.';
    END IF;

    -- =========================================================================
    -- BƯỚC 2: TIẾN HÀNH ĐÁNH DẤU VÀ TẠO PHIẾU KIỂM DUYỆT (Nếu có vi phạm)
    -- =========================================================================
    IF v_LoaiDanhDau IS NOT NULL THEN
        
        -- Khởi tạo mã hệ thống đánh dấu (HTDD)
        SELECT NVL(MAX(TO_NUMBER(SUBSTR(MaHTDD, 5))), 0) + 1
        INTO v_NextHTDD
        FROM HE_THONG_DANH_DAU;

        v_MaHTDD := 'HTDD' || LPAD(v_NextHTDD, 3, '0');

        -- Chèn dữ liệu vào HE_THONG_DANH_DAU
        INSERT INTO HE_THONG_DANH_DAU (MaHTDD, DoTinCay, NgayDanhDau, LoaiDanhDau, GhiChu, MaBL)
        VALUES (
            v_MaHTDD,
            100, 
            SYSDATE, 
            v_LoaiDanhDau, 
            v_GhiChu,      
            :NEW.MaBL
        );

        -- Khởi tạo mã phiếu kiểm duyệt (BLKD)
        SELECT NVL(MAX(TO_NUMBER(SUBSTR(MaBLKD, 5))), 0) + 1
        INTO v_NextBLKD
        FROM BINH_LUAN_KIEM_DUYET;

        -- Chèn dữ liệu vào BINH_LUAN_KIEM_DUYET
        INSERT INTO BINH_LUAN_KIEM_DUYET (MaBLKD, NoiDung, TrangThaiXL, MaBC, MaHTDD, MaTK_KDV)
        VALUES (
            'BLKD' || LPAD(v_NextBLKD, 3, '0'),
            'Hệ thống rà soát từ khóa phát hiện vi phạm tự động.',
            'Chờ xử lý',
            NULL,       
            v_MaHTDD,   
            NULL        
        );
    END IF;
END;
/

-- Tự động xóa mềm dữ liệu

-- Tạo View cho ứng dụng tương tác
CREATE OR REPLACE VIEW V_TAI_KHOAN AS 
SELECT * FROM TAI_KHOAN;

-- Tạo Trigger xóa mềm trên View
CREATE OR REPLACE TRIGGER TRG_XOA_MEM_TAIKHOAN
INSTEAD OF DELETE ON V_TAI_KHOAN
FOR EACH ROW
BEGIN
    UPDATE TAI_KHOAN
    SET TrangThai = 'Bị khóa'
    WHERE MaTK = :OLD.MaTK;
END;
/
-- Tự động cập nhật trạng thái quảng cáo hết hạn
CREATE OR REPLACE TRIGGER TRG_CAPNHAT_QUANGCAO_HETHAN
BEFORE UPDATE OF SoLuotXem ON QUANG_CAO
FOR EACH ROW
BEGIN
    IF :NEW.SoLuotXem >= :NEW.SoLuotYeuCau THEN
        :NEW.TrangThai := 'Kết thúc';
    END IF;
END;
/

-- Tự động gửi thông báo khi bình luận bị xử lý vi phạm
CREATE OR REPLACE TRIGGER TRG_THONG_BAO_KHI_XOA_BINH_LUAN
AFTER UPDATE OF TrangThaiXL ON BINH_LUAN_KIEM_DUYET
FOR EACH ROW
DECLARE
    v_NextTB NUMBER;
    v_MaHoSo VARCHAR2(10);
BEGIN
    -- Chỉ kích hoạt khi trạng thái chuyển sang 'Bác bỏ', TrangThaiXL có default = Chờ xử lý
    IF :OLD.TrangThaiXL <> 'Bác bỏ' AND :NEW.TrangThaiXL = 'Bác bỏ' THEN
        
        -- Bước 1: Truy vết ngược để lấy mã hồ sơ người dùng
        SELECT bl.MaHoSo INTO v_MaHoSo
        FROM HE_THONG_DANH_DAU ht
        JOIN BINH_LUAN_DANH_GIA bl ON ht.MaBL = bl.MaBL
        WHERE ht.MaHTDD = :NEW.MaHTDD;

        -- Bước 2: Khởi tạo mã Thông báo mới (Chuỗi tự tăng bắt đầu từ ký tự thứ 3)
        SELECT NVL(MAX(TO_NUMBER(SUBSTR(MaTB, 3))), 0) + 1
        INTO v_NextTB
        FROM THONG_BAO;

        -- Bước 3: Gửi thông báo đến hòm thư người dùng
        INSERT INTO THONG_BAO (MaTB, TieuDe, NoiDung, NgayGui, MaHoSo)
        VALUES (
            'TB' || LPAD(v_NextTB, 4, '0'),
            'Cảnh báo vi phạm tiêu chuẩn cộng đồng',
            'Một bình luận của bạn đã bị gỡ bỏ do chứa nội dung vi phạm quy định nền tảng.',
            SYSDATE,
            v_MaHoSo
        );
    END IF;
EXCEPTION
    -- Xử lý ngoại lệ trong trường hợp dữ liệu lịch sử bị đứt gãy
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('Lỗi: Không tìm thấy hồ sơ người dùng để gửi thông báo.');
END;
/
-- Tự động đồng bộ trạng thái hiển thị phim theo kiểm duyệt
CREATE OR REPLACE TRIGGER TRG_DONGBO_TRANGTHAI_PHIM
BEFORE UPDATE OF TrangThaiKD ON PHIM
FOR EACH ROW
BEGIN
    -- Kiểm tra nếu trạng thái kiểm duyệt thay đổi thành trạng thái cấm
    IF :NEW.TrangThaiKD = 'Từ chối'  THEN :NEW.TrangThaiHT := 'Ẩn';       
    END IF;
END;
/
-- Tự động tính toán giá trị hóa đơn dựa trên chiết khấu đối tác
CREATE OR REPLACE TRIGGER TRG_TINH_GIATRI_GIAODICH
BEFORE INSERT ON GIAO_DICH
FOR EACH ROW
DECLARE
    v_ChietKhau NUMBER(5,2);
BEGIN
    -- Bước 1: Truy xuất mức chiết khấu hiện hành của đối tác thanh toán
    SELECT NVL(ChietKhau, 0) INTO v_ChietKhau
    FROM DOI_TAC
    WHERE MaDT = :NEW.MaDT;

    -- Bước 2: Áp dụng thuật toán tính giá trị thực nhận
    -- Giả định trường ChietKhau lưu giá trị phần trăm (Ví dụ: 5.0 tương đương 5%)
    -- Công thức: Tiền thực nhận = Tiền gốc - (Tiền gốc * Chiết khấu / 100)
    :NEW.SoTien := :NEW.SoTien - (:NEW.SoTien * (v_ChietKhau / 100));

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        -- Nếu mã đối tác không tồn tại, có thể thiết lập mức chiết khấu mặc định là 0
        -- hoặc đưa ra cảnh báo lỗi (Tùy thuộc vào Business Logic của hệ thống)
        DBMS_OUTPUT.PUT_LINE('Cảnh báo: Đối tác thanh toán không tồn tại.');
END;
/
-- Kiểm duyệt luồng xem theo độ tuổi (Parental Control)
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
/

-- Trigger về các thuộc tính ngày so với ngày hiện tại của hệ thống
CREATE OR REPLACE TRIGGER TRG_DIEN_VIEN
BEFORE INSERT OR UPDATE ON DIEN_VIEN
FOR EACH ROW
BEGIN
    IF :NEW.NgaySinh IS NOT NULL AND :NEW.NgaySinh > SYSDATE THEN
        RAISE_APPLICATION_ERROR(-20001, 'Ngay sinh dien vien khong duoc lon hon ngay hien tai.');
    END IF;
END;
/

CREATE OR REPLACE TRIGGER TRG_DAO_DIEN
BEFORE INSERT OR UPDATE ON DAO_DIEN
FOR EACH ROW
BEGIN
    IF :NEW.NgaySinh IS NOT NULL AND :NEW.NgaySinh > SYSDATE THEN
        RAISE_APPLICATION_ERROR(-20002, 'Ngay sinh dao dien khong duoc lon hon ngay hien tai.');
    END IF;
END;
/

CREATE OR REPLACE TRIGGER TRG_THANH_VIEN
BEFORE INSERT OR UPDATE ON THANH_VIEN
FOR EACH ROW
BEGIN
    IF :NEW.NgaySinh IS NOT NULL AND :NEW.NgaySinh > SYSDATE THEN
        RAISE_APPLICATION_ERROR(-20003, 'Ngay sinh thanh vien khong duoc lon hon ngay hien tai.');
    END IF;
END;
/

CREATE OR REPLACE TRIGGER TRG_NHAN_VIEN
BEFORE INSERT OR UPDATE ON NHAN_VIEN
FOR EACH ROW
BEGIN
    IF :NEW.NgayBatDauLam IS NOT NULL AND :NEW.NgayBatDauLam > SYSDATE THEN
        RAISE_APPLICATION_ERROR(-20004, 'Ngay vao lam khong duoc lon hon ngay hien tai.');
    END IF;
END;
/

CREATE OR REPLACE TRIGGER TRG_HE_THONG_DANH_DAU
BEFORE INSERT OR UPDATE ON HE_THONG_DANH_DAU
FOR EACH ROW
BEGIN
    IF :NEW.NgayDanhDau IS NOT NULL AND :NEW.NgayDanhDau > SYSDATE THEN
        RAISE_APPLICATION_ERROR(-20005, 'Ngay danh dau khong duoc lon hon ngay hien tai.');
    END IF;
END;
/

-- Chặn thành viên Miễn phí xem video VIP
CREATE OR REPLACE TRIGGER TRG_KIEM_QUYEN_XEM_PHIM
BEFORE INSERT OR UPDATE ON LICH_SU_XEM
FOR EACH ROW
DECLARE
    v_YeuCauGoiVP  NVARCHAR2(20);  -- Yêu cầu gói của VIDEO_PHAT
    v_GoiHienTai   NVARCHAR2(30);  -- Gói hiện tại của thành viên
    v_MaTK_TV      VARCHAR2(10);
    v_MaPhim       VARCHAR2(10);
    v_STT          NUMBER(5);      -- Số thứ tự tập phim
BEGIN
    -- ============================================================
    -- Lấy thông tin VIDEO_PHAT
    -- ============================================================
    SELECT YeuCauGoi, MaPhim, STT
    INTO v_YeuCauGoiVP, v_MaPhim, v_STT
    FROM VIDEO_PHAT
    WHERE MaVP = :NEW.MaVP;

    -- ============================================================
    -- Nếu video là VIP → kiểm tra quyền người dùng
    -- ============================================================
    IF v_YeuCauGoiVP = 'VIP' THEN

        -- Lấy gói hiện tại của thành viên
        SELECT MaTK_TV INTO v_MaTK_TV
        FROM HO_SO WHERE MaHoSo = :NEW.MaHoSo;

        SELECT GoiHienTai INTO v_GoiHienTai
        FROM THANH_VIEN WHERE MaTK = v_MaTK_TV;

        -- Nếu là thành viên VIP → cho xem tất cả
        IF v_GoiHienTai = 'VIP' THEN
            RETURN;
        END IF;

        -- ĐIỀU KIỆN 2: Phim lẻ → chặn luôn
        IF v_STT IS NULL THEN
            RAISE_APPLICATION_ERROR(-20011,
                'Phim lẻ này yêu cầu gói VIP. Vui lòng nâng cấp tài khoản.');
        END IF;

        -- ĐIỀU KIỆN 1: Phim bộ → cho xem 2 tập đầu, chặn từ tập 4
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
/

-- Giới hạn tối đa 5 hồ sơ trên 1 tài khoản 
CREATE OR REPLACE TRIGGER TRG_GIOI_HAN_HO_SO
BEFORE INSERT ON HO_SO
FOR EACH ROW
DECLARE
    v_SoHoSo NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_SoHoSo
    FROM HO_SO
    WHERE MaTK_TV = :NEW.MaTK_TV;

    IF v_SoHoSo >= 5 THEN
        RAISE_APPLICATION_ERROR(-20013,
            'Tài khoản đã đạt giới hạn tối đa 5 hồ sơ.');
    END IF;
END;
/