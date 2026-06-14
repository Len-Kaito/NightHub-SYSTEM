const db = require('../config/database');

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
        `SELECT TenDM, LuotXemDanhMuc FROM VIEW_LUOT_XEM_DANH_MUC WHERE LuotXemDanhMuc > 0 ORDER BY LuotXemDanhMuc DESC FETCH FIRST 5 ROWS ONLY`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      
      // Chuyển đổi dữ liệu cho chart
      // Recharts BarChart format: { name: 'Thể loại', value: 400 }
      const deviceData = categoryResult.rows.map(r => ({
        name: r.TENDM,
        value: Number(r.LUOTXEMDANHMUC) || 0
      }));

      const totalRevenueVal = Number(revenue.TONGDOANHTHU) || 0;
      const totalViewsVal = Number(totalViews) || 0;

      // Thống kê doanh thu theo tháng (giống code Cursor có sẵn)
      const revMonthlyResult = await db.execute(
        `SELECT TO_CHAR(NgayGiaoDich, 'YYYY-MM') as ThangNam, SUM(SoTien) as DoanhThu 
         FROM GIAO_DICH 
         WHERE TrangThai = 'Thành công'
         GROUP BY TO_CHAR(NgayGiaoDich, 'YYYY-MM') ORDER BY ThangNam ASC`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      
      const viewsMonthlyResult = await db.execute(
        `SELECT TO_CHAR(NgayTT, 'YYYY-MM') as ThangNam, COUNT(*) as LuotXem 
         FROM LICH_SU_XEM 
         GROUP BY TO_CHAR(NgayTT, 'YYYY-MM') ORDER BY ThangNam ASC`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );

      // Tạo mảng 6 tháng qua để hiển thị (cho đẹp biểu đồ)
      const revenueData = [];
      for (let i = 5; i >= 0; i--) {
        let d = new Date();
        d.setMonth(d.getMonth() - i);
        let monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        let displayStr = `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
        
        const rMonth = revMonthlyResult.rows.find(r => r.THANGNAM === monthStr);
        const vMonth = viewsMonthlyResult.rows.find(v => v.THANGNAM === monthStr);
        
        revenueData.push({
          name: displayStr,
          revenue: rMonth ? Number(rMonth.DOANHTHU) : 0,
          views: vMonth ? Number(vMonth.LUOTXEM) : 0
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
        revenueBreakdown
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
        `SELECT MaPhim, TenPhim, NamSX, TrangThaiHT, TrangThaiKD, LuotThich, Poster FROM PHIM ORDER BY MaPhim DESC`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      res.json(result.rows.map(r => ({
        id: r.MAPHIM,
        title: r.TENPHIM,
        year: r.NAMSX,
        status: r.TRANGTHAIHT,
        censorStatus: r.TRANGTHAIKD,
        likes: r.LUOTTHICH,
        poster: r.POSTER
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
        `SELECT MADT, MAQC, SOLUOTYEUCAU, SOLUOTXEM, DONGIA, DOANHTHU FROM VIEW_QUANG_CAO_DO`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      res.json(result.rows.map(r => ({
        partnerId: r.MADT,
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
        `SELECT kd.MaBLKD, bc.LyDo, bc.NgayTao, bl.NoiDung, bl.MaHoSo, bl.MaBL 
         FROM BINH_LUAN_KIEM_DUYET kd 
         JOIN BAO_CAO_VI_PHAM bc ON kd.MaBC = bc.MaBC 
         JOIN BINH_LUAN_DANH_GIA bl ON bc.MaBL = bl.MaBL 
         WHERE kd.TrangThaiXL = N'Chờ xử lý'`,
        {}, { outFormat: db.OUT_FORMAT_OBJECT }
      );
      res.json(result.rows.map(r => ({
        reportId: r.MABLKD,
        commentId: r.MABL,
        content: r.NOIDUNG,
        reason: r.LYDO,
        createdAt: r.NGAYTAO,
        status: 'Chờ xử lý',
        profileId: r.MAHOSO
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
        // Xóa bình luận
        await db.execute(
          `BEGIN sp_XoaBinhLuan(:commentId, :profileId); END;`,
          { commentId, profileId },
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
          `UPDATE BINH_LUAN_DANH_GIA SET TRANGTHAI = N'Bình thường' WHERE MaBL = :commentId`,
          { commentId },
          { autoCommit: true }
        );
        await db.execute(
          `UPDATE BINH_LUAN_KIEM_DUYET SET TrangThaiXL = N'Đã bỏ qua', NoiDung = N'Bình luận an toàn, không vi phạm' WHERE MaBLKD = :reportId`,
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
      const hsResult = await db.execute(`SELECT MaHoSo FROM HO_SO FETCH FIRST 1 ROWS ONLY`, {}, { outFormat: db.OUT_FORMAT_OBJECT });
      const phimResult = await db.execute(`SELECT MaPhim FROM PHIM FETCH FIRST 1 ROWS ONLY`, {}, { outFormat: db.OUT_FORMAT_OBJECT });
      
      const validHs = hsResult.rows.length > 0 ? hsResult.rows[0].MAHOSO : null;
      const validPhim = phimResult.rows.length > 0 ? phimResult.rows[0].MAPHIM : null;
      
      if (!validHs || !validPhim) {
        return res.status(500).json({ message: 'Không đủ dữ liệu mẫu (Cần ít nhất 1 Hồ sơ và 1 Phim) để test quét' });
      }

      // Chèn thử 1 bình luận chứa từ khóa vi phạm để Trigger TRG_DANHDAU_BINHLUAN_VIPHAM quét và đưa vào BINH_LUAN_KIEM_DUYET
      await db.execute(
        `BEGIN 
           sp_BinhLuanPhim(
             p_NoiDung => :noidung, 
             p_SoDiem => 1, 
             p_MaHoSo => :hoSoId, 
             p_MaPhim => :phimId
           ); 
         END;`,
        {
          phimId: validPhim,
          hoSoId: validHs,
          noidung: 'Trang web rác rưởi, qua motphim hay phimmoi xem full hd miễn phí còn hơn!'
        },
        { autoCommit: true }
      );
      res.json({ message: 'Quét thành công. Đã phát hiện và ngăn chặn tự động 1 bình luận chứa từ khóa vi phạm!' });
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
