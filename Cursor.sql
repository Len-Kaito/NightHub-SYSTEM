-- 1. SINH DỮ LIỆU GỢI Ý NỘI DUNG (GOI_Y_PHIM) CHO TỪNG HỒ SƠ (HO_SO)
DECLARE
    CURSOR cursor_goiy IS
        SELECT DISTINCT hs.MaHoSo, p.MaPhim
        FROM HO_SO hs
        JOIN THANH_VIEN tv ON hs.MaTK_TV = tv.MaTK
        CROSS JOIN PHIM p
        WHERE NOT EXISTS (
            SELECT 1 FROM LICH_SU_XEM lsx 
            JOIN VIDEO_PHAT vp ON lsx.MaVP = vp.MaVP 
            WHERE lsx.MaHoSo = hs.MaHoSo AND vp.MaPhim = p.MaPhim
        )   
        AND EXISTS (
            SELECT 1 FROM BINH_LUAN_DANH_GIA bl
            JOIN PHIM_DANH_MUC pdm1 ON bl.MaPhim = pdm1.MaPhim
            JOIN PHIM_DANH_MUC pdm2 ON p.MaPhim = pdm2.MaPhim
            WHERE bl.MaHoSo = hs.MaHoSo 
              AND bl.SoDiem >= 4 
              AND pdm1.MaDM = pdm2.MaDM
        );
    
    v_magy VARCHAR2(10);
    v_diem NUMBER(5,2);
    v_id_counter NUMBER;
BEGIN
    SELECT NVL(MAX(TO_NUMBER(SUBSTR(MaGY, 3))), 0) INTO v_id_counter FROM GOI_Y_PHIM;

    FOR r IN cursor_goiy LOOP
        v_id_counter := v_id_counter + 1;
        v_magy := 'GY' || LPAD(v_id_counter, 5, '0');
        v_diem := ROUND(DBMS_RANDOM.VALUE(70, 100), 2);
        
        INSERT INTO GOI_Y_PHIM (MaGY, DiemSo, NgayTao, MaPhim, MaHoSo)
        VALUES (v_magy, v_diem, SYSDATE, r.MaPhim, r.MaHoSo);
    END LOOP;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đã sinh gợi ý phim.');
END;
/

-- 2. HẠ CẤP DỊCH VỤ VÀ GỬI THÔNG BÁO KHI THÀNH VIÊN HẾT HẠN
DECLARE
    CURSOR cursor_dvhethan IS
        SELECT tv.MaTK, tv.GoiHienTai
        FROM THANH_VIEN tv
        JOIN TAI_KHOAN tk ON tv.MaTK = tk.MaTK
        WHERE tv.GoiHienTai = 'VIP'
          AND (tk.NgayDK + NVL((SELECT SUM((gd.SoTien / 30) * 30) 
                                FROM GIAO_DICH gd 
                                WHERE gd.MaTK_TV = tv.MaTK 
                                  AND gd.TrangThai = N'Thành công'), 0)) < SYSDATE;
          
    v_matb VARCHAR2(10);
    v_id_counter NUMBER;
BEGIN
    SELECT NVL(MAX(TO_NUMBER(SUBSTR(MaTB, 3))), 0) INTO v_id_counter FROM THONG_BAO;

    FOR r IN cursor_dvhethan LOOP
        UPDATE THANH_VIEN 
        SET GoiHienTai = 'Miễn phí'
        WHERE MaTK = r.MaTK;
        
        FOR p IN (SELECT MaHoSo FROM HO_SO WHERE MaTK_TV = r.MaTK) LOOP
            v_id_counter := v_id_counter + 1;
            v_matb := 'TB' || LPAD(v_id_counter, 5, '0');
            INSERT INTO THONG_BAO (MaTB, TieuDe, NoiDung, NgayGui, MaHoSo)
            VALUES (v_matb, 
                    N'Dịch vụ hết hạn', 
                    N'Gói cước ' || r.GoiHienTai || N' của bạn đã hết hạn. Tài khoản của bạn đã được hạ cấp về gói Miễn phí.', 
                    CURRENT_TIMESTAMP, 
                    p.MaHoSo);
        END LOOP;
    END LOOP;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đã hạ cấp gói cước hết hạn.');
END;
/

-- 3. NHẮC NHỞ GIA HẠN DỊCH VỤ TRƯỚC HẾT HẠN 3 NGÀY
DECLARE
    CURSOR cursor_nhacnho IS
        SELECT tv.MaTK, tv.GoiHienTai,
               (tk.NgayDK + NVL((SELECT SUM((gd.SoTien / 30) * 30) 
                                 FROM GIAO_DICH gd 
                                 WHERE gd.MaTK_TV = tv.MaTK 
                                   AND gd.TrangThai = N'Thành công'), 0)) AS NgayHetHan
        FROM THANH_VIEN tv
        JOIN TAI_KHOAN tk ON tv.MaTK = tk.MaTK
        WHERE tv.GoiHienTai = 'VIP'
          AND TRUNC(tk.NgayDK + NVL((SELECT SUM((gd.SoTien / 30) * 30) 
                                     FROM GIAO_DICH gd 
                                     WHERE gd.MaTK_TV = tv.MaTK 
                                       AND gd.TrangThai = N'Thành công'), 0)) - TRUNC(SYSDATE) = 3;
          
    v_matb VARCHAR2(10);
    v_id_counter NUMBER;
BEGIN
    SELECT NVL(MAX(TO_NUMBER(SUBSTR(MaTB, 3))), 0) INTO v_id_counter FROM THONG_BAO;

    FOR r IN cursor_nhacnho LOOP
        FOR p IN (SELECT MaHoSo FROM HO_SO WHERE MaTK_TV = r.MaTK) LOOP
            v_id_counter := v_id_counter + 1;
            v_matb := 'TB' || LPAD(v_id_counter, 5, '0');
            INSERT INTO THONG_BAO (MaTB, TieuDe, NoiDung, NgayGui, MaHoSo)
            VALUES (v_matb, 
                    N'Nhắc nhở gia hạn', 
                    N'Gói ' || r.GoiHienTai || N' của bạn sẽ hết hạn vào ngày ' || TO_CHAR(r.NgayHetHan, 'DD/MM/YYYY') || N'. Hãy gia hạn để tiếp tục trải nghiệm trọn vẹn dịch vụ.', 
                    CURRENT_TIMESTAMP, 
                    p.MaHoSo);
        END LOOP;
    END LOOP;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đã gửi nhắc nhở gia hạn.');
END;
/

-- 4. TỰ ĐỘNG CHUYỂN TRẠNG THÁI HIỂN THỊ KHI CÓ VIDEO PHÁT
DECLARE
    CURSOR c_content IS
        SELECT p.MaPhim, p.TenPhim
        FROM PHIM p
        WHERE p.TrangThaiHT = 'Sắp chiếu'
          AND p.TrangThaiKD = 'Đã duyệt'
          AND EXISTS (
              SELECT 1 FROM VIDEO_PHAT vp 
              WHERE vp.MaPhim = p.MaPhim
          );
BEGIN
    FOR r IN c_content LOOP
        UPDATE PHIM 
        SET TrangThaiHT = 'Công khai' 
        WHERE MaPhim = r.MaPhim;
        
        DBMS_OUTPUT.PUT_LINE('Đã phát hành phim: ' || r.TenPhim);
    END LOOP;
    COMMIT;
END;
/

-- 5. TỰ ĐỘNG KHÓA BÌNH LUẬN TOXIC HÀ LOẠT
DECLARE
    CURSOR c_toxic IS
        SELECT bl.MaBL, bl.NoiDung, ht.MaHTDD, ht.LoaiDanhDau, ht.DoTinCay
        FROM BINH_LUAN_DANH_GIA bl
        JOIN HE_THONG_DANH_DAU ht ON bl.MaBL = ht.MaBL
        WHERE bl.TrangThai = 'Hiển thị'
          AND ht.LoaiDanhDau IN ('hate_speech', 'harrassment', 'nsfw', 'violence')
          AND ht.DoTinCay >= 80.0;
          
    v_blk_id VARCHAR2(10);
    v_id_counter NUMBER;
BEGIN
    SELECT NVL(MAX(TO_NUMBER(SUBSTR(MaBLKD, 5))), 0) INTO v_id_counter FROM BINH_LUAN_KIEM_DUYET;

    FOR r IN c_toxic LOOP
        UPDATE BINH_LUAN_DANH_GIA
        SET TrangThai = 'Bị ẩn hệ thống'
        WHERE MaBL = r.MaBL;
        
        v_id_counter := v_id_counter + 1;
        v_blk_id := 'BLKD' || LPAD(v_id_counter, 3, '0');
        INSERT INTO BINH_LUAN_KIEM_DUYET (MaBLKD, NoiDung, TrangThaiXL, MaHTDD, MaTK_KDV, MaBC)
        VALUES (v_blk_id, 
                N'Hệ thống AI phát hiện và tự động ẩn bình luận chứa nội dung ' || r.LoaiDanhDau || N' với độ tin cậy ' || r.DoTinCay || '%',
                N'Đã ẩn', 
                r.MaHTDD, 
                NULL, 
                NULL);
                
        DBMS_OUTPUT.PUT_LINE('Đã ẩn bình luận toxic: ' || r.MaBL);
    END LOOP;
    COMMIT;
END;
/

-- 6. SINH BẢNG XẾP HẠNG XU HƯỚNG PHIM (TOP TRENDING MOVIES)
DECLARE
    CURSOR c_trending IS
        SELECT p.MaPhim,
               p.TenPhim,
               ROUND(
                   COUNT(lsx.MaLSX) * 0.2 +
                   p.LuotThich * 0.5 +
                   COUNT(lsx.MaLSX) * 5,
                   1
               ) AS TrendingScore
        FROM PHIM p
        LEFT JOIN VIDEO_PHAT vp ON p.MaPhim = vp.MaPhim
        LEFT JOIN LICH_SU_XEM lsx ON vp.MaVP = lsx.MaVP
        GROUP BY p.MaPhim, p.TenPhim, p.LuotThich
        ORDER BY TrendingScore DESC;

    v_rank NUMBER := 1;
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== TOP TRENDING MOVIES ===');

    FOR r IN c_trending LOOP
        EXIT WHEN v_rank > 5;
        DBMS_OUTPUT.PUT_LINE(
            '#' || v_rank || ' | ' ||
            r.MaPhim || ' | ' ||
            r.TenPhim || ' | Score: ' ||
            r.TrendingScore
        );
        v_rank := v_rank + 1;
    END LOOP;
END;
/

-- 7. THỐNG KÊ QUẢNG CÁO CHƯA ĐẠT CHỈ TIÊU KPI
DECLARE
    CURSOR c_ads_kpi IS
        SELECT qc.MaQC,
               dt.TenDT,
               qc.SoLuotYeuCau,
               qc.SoLuotXem,
               ROUND(qc.SoLuotXem / qc.SoLuotYeuCau * 100, 1) AS PhanTram
        FROM QUANG_CAO qc
        JOIN DOI_TAC dt ON qc.MaDT = dt.MaDT
        WHERE qc.SoLuotXem < qc.SoLuotYeuCau
          AND qc.TrangThai IN (N'Hoạt động', N'Kết thúc')
        ORDER BY PhanTram ASC;
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== QUẢNG CÁO CHƯA ĐẠT KPI ===');

    FOR r IN c_ads_kpi LOOP
        DBMS_OUTPUT.PUT_LINE(
            r.MaQC || ' | ' ||
            r.TenDT || ' | ' ||
            r.SoLuotXem || '/' || r.SoLuotYeuCau || ' | ' ||
            r.PhanTram || '%'
        );
    END LOOP;
END;
/

-- 8. DANH SÁCH PHIM ĐANG XEM DỞ (CONTINUE WATCHING)
DECLARE
    CURSOR c_continue IS
        SELECT hs.TenHoSo,
               p.TenPhim,
               ROUND(lsx.TienDo / vp.ThoiLuong * 100, 1) AS PhanTram
        FROM LICH_SU_XEM lsx
        JOIN HO_SO hs ON lsx.MaHoSo = hs.MaHoSo
        JOIN VIDEO_PHAT vp ON lsx.MaVP = vp.MaVP
        JOIN PHIM p ON vp.MaPhim = p.MaPhim
        WHERE lsx.TienDo > 0
          AND vp.ThoiLuong IS NOT NULL
          AND vp.ThoiLuong > 0
          AND lsx.TienDo < vp.ThoiLuong * 0.95
        ORDER BY lsx.NgayTT DESC;
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== DANH SÁCH PHIM ĐANG XEM DỞ ===');

    FOR r IN c_continue LOOP
        DBMS_OUTPUT.PUT_LINE(
            r.TenHoSo || ' | ' ||
            r.TenPhim || ' | ' ||
            r.PhanTram || '%'
        );
    END LOOP;
END;
/

-- 9. PHIM ĂN KHÁCH NHẤT CỦA MỖI QUỐC GIA (TOP MOVIE BY COUNTRY)
DECLARE
    CURSOR c_top_by_country IS
        SELECT QuocGia, MaPhim, TenPhim, LuotXem
        FROM (
            SELECT p.QuocGia,
                   p.MaPhim,
                   p.TenPhim,
                   (SELECT COUNT(*) 
                    FROM LICH_SU_XEM lsx 
                    JOIN VIDEO_PHAT vp ON lsx.MaVP = vp.MaVP 
                    WHERE vp.MaPhim = p.MaPhim) AS LuotXem,
                   ROW_NUMBER() OVER (
                       PARTITION BY p.QuocGia
                       ORDER BY (SELECT COUNT(*) 
                                 FROM LICH_SU_XEM lsx 
                                 JOIN VIDEO_PHAT vp ON lsx.MaVP = vp.MaVP 
                                 WHERE vp.MaPhim = p.MaPhim) DESC
                   ) AS rn
            FROM PHIM p
            WHERE p.QuocGia IS NOT NULL
        )
        WHERE rn = 1;
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== TOP PHIM THEO QUỐC GIA ===');

    FOR r IN c_top_by_country LOOP
        DBMS_OUTPUT.PUT_LINE(
            r.QuocGia || ' | ' ||
            r.MaPhim || ' | ' ||
            r.TenPhim || ' | ' ||
            r.LuotXem || ' lượt xem'
        );
    END LOOP;
END;
/

-- 10. TỰ ĐỘNG SAO LƯU NHẬT KÝ HỆ THỐNG CŨ (AUTO BACKUP & PURGE LOG)
DECLARE
    CURSOR c_old_logs IS
        SELECT MaLog, NgayGio, HanhDong, DoiTuong, GhiChu, MaTK_NV
        FROM NHAT_KY_HE_THONG
        WHERE NgayGio < SYSDATE - 15;
        
    v_table_exists NUMBER;
    v_backup_count NUMBER := 0;
BEGIN
    SELECT COUNT(*) INTO v_table_exists 
    FROM user_tables 
    WHERE table_name = 'NHAT_KY_HE_THONG_ARCHIVE';
    
    IF v_table_exists = 0 THEN
        EXECUTE IMMEDIATE '
            CREATE TABLE NHAT_KY_HE_THONG_ARCHIVE (
                MaLog VARCHAR2(15) PRIMARY KEY,
                NgayGio TIMESTAMP,
                HanhDong VARCHAR2(20),
                DoiTuong VARCHAR2(50),
                GhiChu NVARCHAR2(500),
                MaTK_NV VARCHAR2(10)
            )
        ';
        DBMS_OUTPUT.PUT_LINE('Đã tạo bảng lưu trữ NHAT_KY_HE_THONG_ARCHIVE.');
    END IF;
    
    FOR r IN c_old_logs LOOP
        EXECUTE IMMEDIATE '
            INSERT INTO NHAT_KY_HE_THONG_ARCHIVE (MaLog, NgayGio, HanhDong, DoiTuong, GhiChu, MaTK_NV)
            VALUES (:1, :2, :3, :4, :5, :6)
        ' USING r.MaLog, r.NgayGio, r.HanhDong, r.DoiTuong, r.GhiChu, r.MaTK_NV;
        
        DELETE FROM NHAT_KY_HE_THONG
        WHERE MaLog = r.MaLog;
        
        v_backup_count := v_backup_count + 1;
    END LOOP;
    
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đã sao lưu ' || v_backup_count || ' nhật ký.');
END;
/
--Tính thống kê doanh thu theo tháng
DECLARE
    CURSOR cursor_doanhthu IS
        SELECT TO_CHAR(NgayGiaoDich, 'YYYY-MM') AS ThangNam,
               COUNT(MaGD) AS SoGiaoDich,
               SUM(SoTien) AS TongDoanhThu
        FROM GIAO_DICH
        WHERE TrangThai = N'Thành công'
        GROUP BY TO_CHAR(NgayGiaoDich, 'YYYY-MM')
        ORDER BY ThangNam DESC;
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== THỐNG KÊ DOANH THU THEO THÁNG ===');
    FOR r IN cursor_doanhthu LOOP
        DBMS_OUTPUT.PUT_LINE(
            'Tháng: ' || r.ThangNam || 
            ' | Số giao dịch: ' || r.SoGiaoDich || 
            ' | Tổng tiền: ' || TO_CHAR(r.TongDoanhThu, 'FM999,999,999,990') || ' VND'
        );
    END LOOP;
END;
/

--Quét quảng cáo hết hạn
DECLARE
    CURSOR cursor_qchethan IS
        SELECT MaQC, SoLuotYeuCau, SoLuotXem
        FROM QUANG_CAO
        WHERE TrangThai = N'Hoạt động'
          AND SoLuotXem >= SoLuotYeuCau;
          
    v_updated_count NUMBER := 0;
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== QUÉT QUẢNG CÁO HẾT HẠN ===');
    FOR r IN cursor_qchethan LOOP
        UPDATE QUANG_CAO
        SET TrangThai = N'Kết thúc'
        WHERE MaQC = r.MaQC;
        
        DBMS_OUTPUT.PUT_LINE('Quảng cáo ' || r.MaQC || ' đã kết thúc (Lượt xem: ' || r.SoLuotXem || '/' || r.SoLuotYeuCau || ')');
        v_updated_count := v_updated_count + 1;
    END LOOP;
    
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Đã quét và kết thúc ' || v_updated_count || ' chiến dịch quảng cáo.');
END;
/

--Kiểm tra các tài khoản không hoạt động lâu ngày
DECLARE
    CURSOR cursor_inactive IS
        SELECT tk.MaTK, tk.Email, tk.TenHT, tk.NgayDK
        FROM TAI_KHOAN tk
        JOIN THANH_VIEN tv ON tk.MaTK = tv.MaTK
        WHERE tk.TrangThai = N'Hoạt động'
          AND NOT EXISTS (
              SELECT 1 
              FROM HO_SO hs
              JOIN LICH_SU_XEM lsx ON hs.MaHoSo = lsx.MaHoSo
              WHERE hs.MaTK_TV = tk.MaTK
                AND lsx.NgayTT >= SYSDATE - 30
          );
          
    v_inactive_count NUMBER := 0;
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== TÀI KHOẢN KHÔNG HOẠT ĐỘNG TRONG 30 NGÀY QUA ===');
    FOR r IN cursor_inactive LOOP
        DBMS_OUTPUT.PUT_LINE(
            'Mã TK: ' || r.MaTK || 
            ' | Email: ' || r.Email || 
            ' | Tên: ' || r.TenHT || 
            ' | Ngày ĐK: ' || TO_CHAR(r.NgayDK, 'DD/MM/YYYY')
        );
        v_inactive_count := v_inactive_count + 1;
    END LOOP;
    DBMS_OUTPUT.PUT_LINE('Tổng số tài khoản không hoạt động: ' || v_inactive_count);
END;
/