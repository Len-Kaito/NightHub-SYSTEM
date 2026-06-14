const db = require('../config/database');
const oracledb = require('oracledb');

const adminController = {
  getDashboardStats: async (req, res) => {
    try {
      // 1. Tổng doanh thu (từ VIEW_DOANH_THU)
      const revenueResult = await db.execute(
        `SELECT Doanh_thu_giao_dich, Doanh_thu_quang_cao, TongDoanhThu FROM VIEW_DOANH_THU`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      const revenue = revenueResult.rows[0] || { TONGDOANHTHU: 0 };

      // 2. Tổng số tài khoản (khách hàng)
      const userResult = await db.execute(
        `SELECT COUNT(*) as TotalUsers FROM TAI_KHOAN WHERE MaVT = 'USER'`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      const totalUsers = userResult.rows[0].TOTALUSERS;

      // 3. Tổng lượt xem từ bảng LICH_SU_XEM
      const viewsResult = await db.execute(
        `SELECT COUNT(*) as TotalViews FROM LICH_SU_XEM`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      const totalViews = viewsResult.rows[0].TOTALVIEWS;

      // 4. Phân tích lượt xem theo danh mục
      const categoryResult = await db.execute(
        `SELECT * FROM (SELECT TenDM, LuotXemDanhMuc FROM VIEW_LUOT_XEM_DANH_MUC WHERE LuotXemDanhMuc > 0 ORDER BY LuotXemDanhMuc DESC) WHERE ROWNUM <= 5`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      
      // Chuyển đổi dữ liệu cho chart
      // Recharts BarChart format: { name: 'Thể loại', value: 400 }
      const deviceData = categoryResult.rows.map(r => ({
        name: r.TENDM,
        value: Number(r.LUOTXEMDANHMUC) || 0
      }));

      const topMoviesResult = await db.execute(
        `SELECT * FROM (SELECT MaPhim, TenPhim, LuotXem, LuotThich, TongSoBinhLuan, SoLuotTuongTac 
         FROM MV_PHIM_THINH_HANH 
         ORDER BY SoLuotTuongTac DESC) WHERE ROWNUM <= 5`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      const topMovies = topMoviesResult.rows;

      const totalRevenueVal = Number(revenue.TONGDOANHTHU) || 0;
      const totalViewsVal = Number(totalViews) || 0;

      // Thống kê doanh thu và lượt xem 6 tháng qua
      const revDailyResult = await db.execute(
        `SELECT TO_CHAR(NgayGiaoDich, 'YYYY-MM') as Thang, SUM(SoTien) as DoanhThu 
         FROM GIAO_DICH 
         WHERE TrangThai = 'Thành công' AND NgayGiaoDich >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -5)
         GROUP BY TO_CHAR(NgayGiaoDich, 'YYYY-MM') ORDER BY Thang ASC`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      
      const viewsDailyResult = await db.execute(
        `SELECT TO_CHAR(NgayTT, 'YYYY-MM') as Thang, COUNT(*) as LuotXem 
         FROM LICH_SU_XEM 
         WHERE NgayTT >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -5)
         GROUP BY TO_CHAR(NgayTT, 'YYYY-MM') ORDER BY Thang ASC`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );

      // Tạo mảng 6 tháng qua để hiển thị
      const revenueData = [];
      for (let i = 5; i >= 0; i--) {
        let d = new Date();
        d.setMonth(d.getMonth() - i);
        let dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        let displayStr = `T${d.getMonth() + 1}`;
        
        const rDay = revDailyResult.rows.find(r => r.THANG === dateStr);
        const vDay = viewsDailyResult.rows.find(v => v.THANG === dateStr);
        
        revenueData.push({
          name: displayStr,
          revenue: rDay ? Number(rDay.DOANHTHU) : 0,
          views: vDay ? Number(vDay.LUOTXEM) : 0
        });
      }
      
      const revenueBreakdown = [
        { name: 'Khách mua VIP', value: Number(revenue.DOANH_THU_GIAO_DICH) || 0 },
        { name: 'Đối tác Quảng cáo', value: Number(revenue.DOANH_THU_QUANG_CAO) || 0 }
      ];

      res.json({
        totalRevenue: totalRevenueVal,
        totalUsers,
        totalViews: totalViewsVal,
        revenueData,
        revenueBreakdown,
        categoryData: deviceData,
        topMovies
      });

    } catch (error) {
      console.error('Lỗi lấy thống kê dashboard:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // ==================== CMS PHIM ====================
  getMovies: async (req, res) => {
    try {
      const result = await db.execute(
        `SELECT 
           p.MaPhim, p.TenPhim, p.NamSX, p.TrangThaiHT, p.TrangThaiKD, p.LuotThich, p.Poster,
           fn_LaySaoTrungBinh(p.MaPhim) as DiemTB,
           fn_DemSoTapHienCo(p.MaPhim) as SoTap,
           fn_DemBinhLuanPhim(p.MaPhim) as SoBinhLuan,
           (SELECT MAX(MaQC) FROM PHIM_QUANG_CAO WHERE MaPhim = p.MaPhim) as MaQC
         FROM PHIM p
         ORDER BY p.MaPhim DESC`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      res.json(result.rows.map(r => ({
        id: r.MAPHIM,
        title: r.TENPHIM,
        year: r.NAMSX,
        status: r.TRANGTHAIHT,
        censorStatus: r.TRANGTHAIKD,
        likes: r.LUOTTHICH,
        poster: r.POSTER,
        avgRating: Number(r.DIEMTB) || 0,
        episodes: Number(r.SOTAP) || 0,
        comments: Number(r.SOBINHLUAN) || 0,
        adId: r.MAQC || null
      })));
    } catch (error) {
      console.error('Lỗi lấy danh sách phim:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  addMovie: async (req, res) => {
    try {
      const { title, poster, description, year, country, trailer, partnerId, qtvId, categories, actors, directors } = req.body;
      
      // Gọi Procedure thêm phim cơ bản
      await db.execute(
        `BEGIN
           sp_ThemPhimMoi(:title, :poster, :description, :year, :country, :trailer, :partnerId, :qtvId);
         END;`,
        { 
          title: title || '', poster: poster || '', description: description || '', year: year || 2024, 
          country: country || '', trailer: trailer || '', partnerId: partnerId || '', qtvId: qtvId || ''
        },
        { autoCommit: true }
      );

      // Lấy mã phim vừa thêm (mới nhất)
      const maxPhimResult = await db.execute(`SELECT MaPhim FROM PHIM ORDER BY MaPhim DESC FETCH FIRST 1 ROWS ONLY`, {}, { outFormat: db.OUT_FORMAT_OBJECT });
      if (maxPhimResult.rows.length > 0) {
        const maPhim = maxPhimResult.rows[0].MAPHIM;

        // Thêm danh mục
        if (categories && Array.isArray(categories)) {
          for (let dm of categories) {
            await db.execute(`INSERT INTO PHIM_DANH_MUC (MaPhim, MaDM) VALUES (:maPhim, :dm)`, { maPhim, dm }, { autoCommit: true });
          }
        }
        // Thêm diễn viên
        if (actors && Array.isArray(actors)) {
          for (let dv of actors) {
            await db.execute(`INSERT INTO PHIM_DIEN_VIEN (MaPhim, MaDV) VALUES (:maPhim, :dv)`, { maPhim, dv }, { autoCommit: true });
          }
        }
        // Thêm đạo diễn
        if (directors && Array.isArray(directors)) {
          for (let dd of directors) {
            await db.execute(`INSERT INTO PHIM_DAO_DIEN (MaPhim, MaDD) VALUES (:maPhim, :dd)`, { maPhim, dd }, { autoCommit: true });
          }
        }
      }

      res.status(201).json({ message: 'Thêm phim thành công' });
    } catch (error) {
      console.error('Lỗi thêm phim:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  updateMovie: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, poster, description, year, country, trailer, censorStatus, status } = req.body;
      
      await db.execute(
        `BEGIN
           sp_CapNhatPhim(:id, :title, :poster, :description, :year, :country, :trailer, :censorStatus, :status);
         END;`,
        { 
          id,
          title: title || null,
          poster: poster || null,
          description: description || null,
          year: year || null,
          country: country || null,
          trailer: trailer || null,
          censorStatus: censorStatus || null,
          status: status || null
        },
        { autoCommit: true }
      );
      
      const { hasAd, adId } = req.body;
      if (hasAd && adId) {
        // Xóa quảng cáo cũ của phim (nếu có) và thêm mới
        await db.execute(`DELETE FROM PHIM_QUANG_CAO WHERE MaPhim = :id`, { id }, { autoCommit: true });
        await db.execute(`INSERT INTO PHIM_QUANG_CAO (MaPhim, MaQC, ThoiDiemPhat) VALUES (:id, :adId, 600)`, { id, adId }, { autoCommit: true });
      } else {
        // Xóa tất cả quảng cáo của phim
        await db.execute(`DELETE FROM PHIM_QUANG_CAO WHERE MaPhim = :id`, { id }, { autoCommit: true });
      }
      
      res.json({ message: 'Cập nhật phim thành công' });
    } catch (error) {
      console.error('Lỗi cập nhật phim:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  deleteMovie: async (req, res) => {
    try {
      const { id } = req.params;
      // Soft delete: chuyển trạng thái sang Ẩn
      await db.execute(
        `UPDATE PHIM SET TrangThaiHT = 'Ẩn' WHERE MaPhim = :id`,
        { id },
        { autoCommit: true }
      );
      res.json({ message: 'Đã ẩn phim (Soft delete) thành công' });
    } catch (error) {
      console.error('Lỗi ẩn phim:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  updateMovieStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      await db.execute(
        `UPDATE PHIM SET TrangThaiHT = :status WHERE MaPhim = :id`,
        { status, id },
        { autoCommit: true }
      );
      res.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
      console.error('Lỗi cập nhật phim:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  updateCensorStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      await db.execute(
        `UPDATE PHIM SET TrangThaiKD = :status WHERE MaPhim = :id`,
        { status, id },
        { autoCommit: true }
      );
      res.json({ message: 'Cập nhật trạng thái kiểm duyệt thành công' });
    } catch (error) {
      console.error('Lỗi cập nhật kiểm duyệt phim:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // ==================== QUẢNG CÁO ====================
  getAds: async (req, res) => {
    try {
      const result = await db.execute(
        `SELECT q.MADT, q.MAQC, q.SOLUOTYEUCAU, q.SOLUOTXEM, q.DONGIA, q.DOANHTHU, dt.TENDT 
         FROM VIEW_QUANG_CAO_DO q
         JOIN DOI_TAC dt ON q.MADT = dt.MADT
         WHERE dt.PhanLoai = N'Quảng cáo'`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      res.json(result.rows.map(r => ({
        partnerId: r.MADT,
        partnerName: r.TENDT,
        adId: r.MAQC,
        requestedViews: r.SOLUOTYEUCAU,
        currentViews: r.SOLUOTXEM,
        price: r.DONGIA,
        revenue: r.DOANHTHU
      })));
    } catch (error) {
      console.error('Lỗi lấy danh sách quảng cáo:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  createAd: async (req, res) => {
    try {
      const { requestedViews, price, videoUrl, partnerId } = req.body;
      
      await db.execute(
        `BEGIN
           sp_TaoQuangCao(:requestedViews, :price, :videoUrl, :partnerId);
         END;`,
        { 
          requestedViews: requestedViews || 0,
          price: price || 0,
          videoUrl: videoUrl || '',
          partnerId: partnerId || ''
        },
        { autoCommit: true }
      );

      res.status(201).json({ message: 'Tạo chiến dịch quảng cáo thành công' });
    } catch (error) {
      console.error('Lỗi tạo quảng cáo:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // ==================== KIỂM DUYỆT (MODERATION) ====================
  getReports: async (req, res) => {
    try {
      const result = await db.execute(
        `SELECT 
            kd.MaBLKD, 
            bl.NoiDung, 
            bl.MaHoSo, 
            bl.MaBL,
            bc.LyDo, 
            bc.MaHoSoGui,
            bc.NgayTao AS NgayBaoCao,
            ht.LoaiDanhDau, 
            ht.NgayDanhDau,
            ht.DoTinCay
         FROM BINH_LUAN_KIEM_DUYET kd
         LEFT JOIN BAO_CAO_VI_PHAM bc ON kd.MaBC = bc.MaBC
         LEFT JOIN HE_THONG_DANH_DAU ht ON kd.MaHTDD = ht.MaHTDD
         JOIN BINH_LUAN_DANH_GIA bl ON bl.MaBL = COALESCE(bc.MaBL, ht.MaBL)
         WHERE kd.TrangThaiXL = N'Chờ xử lý'`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      res.json(result.rows.map(r => ({
        reportId: r.MABLKD,
        commentId: r.MABL,
        content: r.NOIDUNG,
        reason: r.LYDO || (
          r.LOAIDANHDAU === 'hate_speech' ? 'Ngôn từ thù ghét' : 
          r.LOAIDANHDAU === 'copyright' ? 'Vi phạm bản quyền' : 
          r.LOAIDANHDAU === 'nsfw' ? 'Nội dung nhạy cảm' :
          r.LOAIDANHDAU === 'violence' ? 'Bạo lực' :
          r.LOAIDANHDAU === 'spam' ? 'Spam/Quảng cáo rác' :
          r.LOAIDANHDAU || 'Vi phạm tiêu chuẩn cộng đồng'
        ),
        createdAt: r.NGAYBAOCAO || r.NGAYDANHDAU,
        status: 'Chờ xử lý',
        profileId: r.MAHOSO,
        reporter: r.MAHOSOGUI || 'Hệ thống tự động',
        confidence: r.DOTINCAY
      })));
    } catch (error) {
      console.error('Lỗi lấy danh sách vi phạm:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  resolveReport: async (req, res) => {
    try {
      const { reportId, commentId, profileId, action } = req.body;
      
      if (action === 'delete') {
        // Đổi trạng thái bình luận sang Bị ẩn hệ thống
        await db.execute(
          `UPDATE BINH_LUAN_DANH_GIA SET TrangThai = N'Bị ẩn hệ thống' WHERE MaBL = :commentId`,
          { commentId },
          { autoCommit: true }
        );
        // Cập nhật trạng thái Kiểm Duyệt
        await db.execute(
          `UPDATE BINH_LUAN_KIEM_DUYET SET TrangThaiXL = N'Đã ẩn', NoiDung = N'Đã xóa bình luận vi phạm' WHERE MaBLKD = :reportId`,
          { reportId }, { autoCommit: true }
        );
      } else if (action === 'ignore') {
        // Bỏ qua vi phạm, hiển thị lại bình luận
        await db.execute(
          `UPDATE BINH_LUAN_DANH_GIA SET TRANGTHAI = N'Hiển thị' WHERE MaBL = :commentId`,
          { commentId },
          { autoCommit: true }
        );
        await db.execute(
          `UPDATE BINH_LUAN_KIEM_DUYET SET TrangThaiXL = N'Bác bỏ', NoiDung = N'Bình luận an toàn, báo cáo bị bác bỏ' WHERE MaBLKD = :reportId`,
          { reportId }, { autoCommit: true }
        );
      }

      res.json({ message: 'Xử lý thành công' });
    } catch (error) {
      console.error('Lỗi xử lý vi phạm:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  scanReports: async (req, res) => {
    try {
      // PL/SQL Block thực sự quét toàn bộ BINH_LUAN_DANH_GIA chưa bị đánh dấu
      const result = await db.execute(
        `DECLARE
            CURSOR c_unflagged IS
                SELECT MaBL, NoiDung
                FROM BINH_LUAN_DANH_GIA bl
                WHERE bl.TrangThai = N'Hiển thị'
                  AND NOT EXISTS (
                      SELECT 1 FROM HE_THONG_DANH_DAU ht WHERE ht.MaBL = bl.MaBL
                  );
                  
            v_LoaiDanhDau NVARCHAR2(50);
            v_GhiChu      NVARCHAR2(500);
            v_NoiDung     NVARCHAR2(2000);
            v_NextHTDD    NUMBER;
            v_NextBLKD    NUMBER;
            v_MaHTDD      VARCHAR2(10);
            v_Count       NUMBER := 0;
        BEGIN
            SELECT NVL(MAX(TO_NUMBER(SUBSTR(MaHTDD, 5))), 0) INTO v_NextHTDD FROM HE_THONG_DANH_DAU;
            SELECT NVL(MAX(TO_NUMBER(SUBSTR(MaBLKD, 5))), 0) INTO v_NextBLKD FROM BINH_LUAN_KIEM_DUYET;

            FOR r IN c_unflagged LOOP
                v_NoiDung := LOWER(r.NoiDung);
                v_LoaiDanhDau := NULL;

                IF REGEXP_LIKE(v_NoiDung, 'phimmoi|motphim|link lậu|xem free|bản cam|full hd miễn phí') THEN
                    v_LoaiDanhDau := 'copyright';
                    v_GhiChu := 'Phát hiện chia sẻ liên kết lậu, vi phạm bản quyền nội dung số.';
                ELSIF REGEXP_LIKE(v_NoiDung, '18\+|sex|porn|phim heo|link sẽ|nude') THEN
                    v_LoaiDanhDau := 'nsfw';
                    v_GhiChu := 'Phát hiện ngôn từ chứa nội dung nhạy cảm, đồi trụy.';
                ELSIF REGEXP_LIKE(v_NoiDung, 'dm|đm|vcl|chó đẻ|ngu học|thằng l|con c') THEN
                    v_LoaiDanhDau := 'hate_speech';
                    v_GhiChu := 'Phát hiện ngôn từ thô tục, công kích và thù ghét cộng đồng.';
                ELSIF REGEXP_LIKE(v_NoiDung, 'giết|chém|bắn nát|đẫm máu|chặt xác') THEN
                    v_LoaiDanhDau := 'violence';
                    v_GhiChu := 'Phát hiện từ ngữ mang khuynh hướng kích động bạo lực vật lý.';
                ELSIF REGEXP_LIKE(v_NoiDung, 'tự tử|tự sát|muốn chết|rạch tay|kết liễu') THEN
                    v_LoaiDanhDau := 'self_harm';
                    v_GhiChu := 'Phát hiện nội dung nhạy cảm liên quan đến hành vi tự hại.';
                ELSIF REGEXP_LIKE(v_NoiDung, 'xấu xí|đĩ|phò|trán dô|đồ bỏ đi') THEN
                    v_LoaiDanhDau := 'harrassment';
                    v_GhiChu := 'Phát hiện hành vi miệt thị ngoại hình hoặc quấy rối cá nhân.';
                ELSIF REGEXP_LIKE(v_NoiDung, 'spam|scam|http|www\\.|\\.com|\\.vn|mua nick|giá rẻ|inbox') THEN
                    v_LoaiDanhDau := 'spam';
                    v_GhiChu := 'Phát hiện từ khóa rác, quảng cáo thương mại hoặc liên kết ngoài.';
                ELSIF REGEXP_LIKE(v_NoiDung, 'tin giả|lừa đảo|dắt mũi|bịa đặt') THEN
                    v_LoaiDanhDau := 'fake_info';
                    v_GhiChu := 'Phát hiện nghi vấn phát tán thông tin sai lệch, gây hoang mang.';
                END IF;

                IF v_LoaiDanhDau IS NOT NULL THEN
                    v_NextHTDD := v_NextHTDD + 1;
                    v_MaHTDD := 'HTDD' || LPAD(v_NextHTDD, 3, '0');

                    INSERT INTO HE_THONG_DANH_DAU (MaHTDD, DoTinCay, NgayDanhDau, LoaiDanhDau, GhiChu, MaBL)
                    VALUES (v_MaHTDD, ROUND(DBMS_RANDOM.VALUE(90, 95), 1), SYSDATE, v_LoaiDanhDau, v_GhiChu, r.MaBL);

                    v_NextBLKD := v_NextBLKD + 1;
                    INSERT INTO BINH_LUAN_KIEM_DUYET (MaBLKD, NoiDung, TrangThaiXL, MaBC, MaHTDD, MaTK_KDV)
                    VALUES ('BLKD' || LPAD(v_NextBLKD, 3, '0'), N'Hệ thống rà soát từ khóa phát hiện vi phạm tự động.', N'Chờ xử lý', NULL, v_MaHTDD, NULL);
                    
                    v_Count := v_Count + 1;
                END IF;
            END LOOP;
            
            COMMIT;
            :outCount := v_Count;
        END;`,
        {
          outCount: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        { autoCommit: true }
      );
      
      const count = result.outBinds.outCount;
      res.json({ message: count > 0 ? `Quét hoàn tất! Phát hiện và đưa vào hàng chờ ${count} bình luận vi phạm mới.` : 'Quét hoàn tất! Hệ thống hiện tại sạch sẽ, không có vi phạm mới.' });
    } catch (error) {
      console.error('Lỗi quét vi phạm:', error);
      res.status(500).json({ message: 'Lỗi server khi quét' });
    }
  },

  // ==================== NGƯỜI DÙNG (USERS) ====================
  getUsers: async (req, res) => {
    try {
      const result = await db.execute(
        `SELECT MaTK, Email, NgayDK, TrangThai, MaVT FROM V_TAI_KHOAN`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      res.json(result.rows.map(r => ({
        id: r.MATK,
        email: r.EMAIL,
        createdAt: r.NGAYDK,
        status: r.TRANGTHAI,
        role: r.MAVT
      })));
    } catch (error) {
      console.error('Lỗi lấy danh sách tài khoản:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  toggleUserStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      await db.execute(
        `BEGIN sp_KhoaMoTaiKhoan(:id, :status); END;`,
        { id, status },
        { autoCommit: true }
      );

      res.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
      console.error('Lỗi cập nhật tài khoản:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // ==================== NHẬT KÝ (LOGS) ====================
  getLogs: async (req, res) => {
    try {
      const result = await db.execute(
        `SELECT MaLog, NgayGio, HanhDong, DoiTuong, GhiChu, MaTK_NV FROM NHAT_KY_HE_THONG ORDER BY NgayGio DESC FETCH FIRST 50 ROWS ONLY`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      res.json(result.rows.map(r => ({
        id: r.MALOG,
        timestamp: r.NGAYGIO,
        action: r.HANHDONG,
        target: r.DOITUONG,
        notes: r.GHICHU,
        adminId: r.MATK_NV
      })));
    } catch (error) {
      console.error('Lỗi lấy danh sách nhật ký:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
};

module.exports = adminController;
