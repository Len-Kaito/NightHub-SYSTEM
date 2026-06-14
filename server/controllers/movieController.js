const db = require('../config/database');

const getAllMovies = async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT p.MaPhim, p.TenPhim, p.Poster, p.MoTa, p.NamSX, p.QuocGia, p.URLTrailer, p.LuotThich, p.TrangThaiHT,
                   pl.DinhDang, pb.TongSoTap,
                   (SELECT SUM(vp.ThoiLuong) FROM VIDEO_PHAT vp WHERE vp.MaPhim = p.MaPhim) AS TongThoiLuong,
                   fn_LaySaoTrungBinh(p.MaPhim) AS SaoTrungBinh
            FROM PHIM p
            LEFT JOIN PHIM_LE pl ON p.MaPhim = pl.MaPhim
            LEFT JOIN PHIM_BO pb ON p.MaPhim = pb.MaPhim
            WHERE p.TrangThaiHT = 'Công khai' AND p.TrangThaiKD = 'Đã duyệt'
        `);
        const genresResult = await db.execute(`
            SELECT pd.MaPhim, d.TenDM 
            FROM PHIM_DANH_MUC pd
            JOIN DANH_MUC d ON pd.MaDM = d.MaDM
        `);
        const movieGenres = {};
        genresResult.rows.forEach(r => {
            if (!movieGenres[r.MAPHIM]) movieGenres[r.MAPHIM] = [];
            movieGenres[r.MAPHIM].push(r.TENDM);
        });

        // Lấy tất cả tags
        const tagsResult = await db.execute(`
            SELECT pt.MaPhim, t.TenTag, t.MoTa 
            FROM PHIM_TAG pt
            JOIN TAG t ON pt.MaTag = t.MaTag
        `);
        const movieTags = {};
        tagsResult.rows.forEach(r => {
            if (!movieTags[r.MAPHIM]) movieTags[r.MAPHIM] = [];
            movieTags[r.MAPHIM].push({ name: r.TENTAG, description: r.MOTA });
        });

        // Tóm lược dữ liệu
        const AGE_TAGS = ['K', 'P', 'T13', 'T16', 'T18'];
        const movies = result.rows.map(row => {
            const tags = movieTags[row.MAPHIM] || [];
            const ageTag = tags.find(t => AGE_TAGS.includes(t.name.toUpperCase())) || tags[0] || null;
            const isPhimBo = row.TONGSOTAP != null;
            
            // Format duration
            let durationStr = null;
            if (row.TONGTHOILUONG) {
                const totalSeconds = row.TONGTHOILUONG;
                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const s = Math.floor(totalSeconds % 60);
                let parts = [];
                if (h > 0) parts.push(`${h}h`);
                if (m > 0) parts.push(`${m}m`);
                if (s > 0 || (h === 0 && m === 0)) parts.push(`${s}s`);
                durationStr = parts.join(' ');
            }

                const genresList = movieGenres[row.MAPHIM] || [];
                
                // Phân loại phim dựa vào cấu trúc thư mục DanhMuc (ví dụ: /DanhMuc/Phim truyền hình/...)
                let computedCategory = 'dien-anh'; // Mặc định
                const posterParts = (row.POSTER || '').split('/');
                if (posterParts.length > 2 && posterParts[1] === 'DanhMuc') {
                    const dirName = posterParts[2];
                    if (dirName === 'Hoạt hình') computedCategory = 'hoat-hinh';
                    else if (dirName === 'Phim truyền hình') computedCategory = 'truyen-hinh';
                    else if (dirName === 'Phim tài liệu') computedCategory = 'tai-lieu';
                    else if (dirName === 'Phim điện ảnh') computedCategory = 'dien-anh';
                    else if (dirName === 'Trang chủ') {
                        // Nếu phim nằm ở Trang chủ, ta tự đoán dựa vào số tập
                        computedCategory = row.TONGSOTAP ? 'truyen-hinh' : 'dien-anh';
                    }
                }

                return {
                    ...{
                        id: 'm_' + row.MAPHIM,
                        title: row.TENPHIM,
                        poster: row.POSTER || '/images/default_poster.jpg',
                        description: row.MOTA,
                        year: row.NAMSX,
                        country: row.QUOCGIA,
                        trailer: row.URLTRAILER,
                        likes: row.LUOTTHICH || 0,
                        quality: row.DINHDANG || null,
                        duration: durationStr,
                        totalEpisodes: row.TONGSOTAP || null,
                        age: ageTag ? ageTag.name : 'K',
                        rating: row.SAOTRUNGBINH || 0,
                        genres: genresList,
                        tags: tags,
                        category: computedCategory
                    }
                };
        });

        res.json(movies);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi lấy danh sách phim' });
    }
};

const getMovieById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.execute(`
            SELECT p.MaPhim, p.TenPhim, p.Poster, p.MoTa, p.NamSX, p.QuocGia, p.URLTrailer, p.LuotThich,
                   pl.DinhDang,
                   pb.TongSoTap, pb.SoMua, pb.TrangThaiPS
            FROM PHIM p
            LEFT JOIN PHIM_LE pl ON p.MaPhim = pl.MaPhim
            LEFT JOIN PHIM_BO pb ON p.MaPhim = pb.MaPhim
            WHERE p.MaPhim = :id 
              AND p.TrangThaiHT = 'Công khai' 
              AND p.TrangThaiKD = 'Đã duyệt'
        `, { id });

        if (result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy phim' });
        
        const row = result.rows[0];
        
        // Lấy danh sách diễn viên (chỉ tên)
        const actorsResult = await db.execute(`
            SELECT d.TenDV 
            FROM PHIM_DIEN_VIEN pd
            JOIN DIEN_VIEN d ON pd.MaDV = d.MaDV
            WHERE pd.MaPhim = :id
        `, { id });
        const cast = actorsResult.rows.map(r => r.TENDV);

        // Lấy danh sách đạo diễn (chỉ tên)
        const directorsResult = await db.execute(`
            SELECT d.TenDD 
            FROM PHIM_DAO_DIEN pd
            JOIN DAO_DIEN d ON pd.MaDD = d.MaDD
            WHERE pd.MaPhim = :id
        `, { id });
        const director = directorsResult.rows.map(r => r.TENDD).join(', ');

        // Lấy tags + mô tả dùng cho tooltip
        const tagsResult = await db.execute(`
            SELECT t.TenTag, t.MoTa
            FROM PHIM_TAG pt
            JOIN TAG t ON pt.MaTag = t.MaTag
            WHERE pt.MaPhim = :id
        `, { id });
        const tags = tagsResult.rows.map(r => ({ name: r.TENTAG, description: r.MOTA }));

        // Lấy danh mục
        const catResult = await db.execute(`
            SELECT d.TenDM 
            FROM PHIM_DANH_MUC pd
            JOIN DANH_MUC d ON pd.MaDM = d.MaDM
            WHERE pd.MaPhim = :id
        `, { id });
        const genres = catResult.rows.map(r => r.TENDM);
        
        // Lấy các video phát
        const videoResult = await db.execute(`
            SELECT MaVP, YeuCauGoi, STT, URLGoc, ThoiLuong 
            FROM VIDEO_PHAT 
            WHERE MaPhim = :id
            ORDER BY STT ASC
        `, { id });
        
        const videos = videoResult.rows.map(v => ({
            id: v.MAVP,
            episodeNumber: v.STT,
            requiredPlan: v.YEUCAUGOI, // 'VIP' or 'Miễn phí'
            duration: v.THOILUONG,
            url: v.URLGOC // Will map to fallback static video on frontend
        }));

        const isSeries = row.TONGSOTAP != null;

        res.json({
            id: row.MAPHIM,
            title: row.TENPHIM,
            poster: row.POSTER || '/images/default_poster.jpg',
            description: row.MOTA,
            year: row.NAMSX,
            country: row.QUOCGIA,
            trailer: row.URLTRAILER,
            likes: row.LUOTTHICH || 0,
            type: isSeries ? 'tvShow' : 'movie',
            format: row.DINHDANG || null,
            totalEpisodes: row.TONGSOTAP || null,
            seasons: row.SOMUA || null,
            broadcastStatus: row.TRANGTHAIPS || null,
            cast,
            director,
            tags,
            genres,
            videos
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const getCategories = async (req, res) => {
    try {
        const result = await db.execute(`SELECT MaDM, TenDM, MoTa FROM DANH_MUC`);
        res.json(result.rows.map(r => ({ id: r.MADM, name: r.TENDM, description: r.MOTA })));
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const getTags = async (req, res) => {
    try {
        const result = await db.execute(`SELECT MaTag, TenTag, MoTa FROM TAG`);
        res.json(result.rows.map(r => ({ id: r.MATAG, name: r.TENTAG, description: r.MOTA })));
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const getTop10Movies = async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT t.MaPhim, t.TenPhim, t.SoLuotTuongTac, p.Poster, p.MoTa, p.NamSX, p.QuocGia, pl.DinhDang, pb.TongSoTap,
            (SELECT SUM(vp.ThoiLuong) FROM VIDEO_PHAT vp WHERE vp.MaPhim = p.MaPhim) AS TongThoiLuong
            FROM V_TOP10_PHIM_THINH_HANH t
            JOIN PHIM p ON t.MaPhim = p.MaPhim
            LEFT JOIN PHIM_LE pl ON p.MaPhim = pl.MaPhim
            LEFT JOIN PHIM_BO pb ON p.MaPhim = pb.MaPhim
            ORDER BY t.SoLuotTuongTac DESC
        `);

        // Get tags for these movies
        const maPhimList = result.rows.map(r => r.MAPHIM);
        let tagMap = {};
        if (maPhimList.length > 0) {
            const tagsResult = await db.execute(`
                SELECT pt.MaPhim, t.TenTag, t.MoTa
                FROM PHIM_TAG pt
                JOIN TAG t ON pt.MaTag = t.MaTag
                WHERE pt.MaPhim IN (${maPhimList.map((_, i) => `:p${i}`).join(',')})
            `, maPhimList.reduce((acc, id, i) => { acc[`p${i}`] = id; return acc; }, {}));
            
            tagsResult.rows.forEach(r => {
                if (!tagMap[r.MAPHIM]) tagMap[r.MAPHIM] = [];
                tagMap[r.MAPHIM].push({ name: r.TENTAG, description: r.MOTA });
            });
        }

        const AGE_TAGS = ['K', 'P', 'T13', 'T16', 'T18'];

        const top10 = result.rows.map(row => {
            const tags = tagMap[row.MAPHIM] || [];
            const ageTag = tags.find(t => AGE_TAGS.includes(t.name.toUpperCase())) || tags[0] || null;
            const isPhimBo = row.TONGSOTAP != null;

            // Chuyển giây sang "X giờ Y phút Z giây" (tái sử dụng logic đơn giản hóa)
            let durationStr = null;
            if (row.TONGTHOILUONG) {
                const totalSeconds = row.TONGTHOILUONG;
                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const s = Math.floor(totalSeconds % 60);
                let parts = [];
                if (h > 0) parts.push(`${h}h`);
                if (m > 0) parts.push(`${m}m`);
                if (s > 0 || (h === 0 && m === 0)) parts.push(`${s}s`);
                durationStr = parts.join(' ');
            }

            return {
                id: 'm_' + row.MAPHIM,
                title: row.TENPHIM,
                poster: row.POSTER,
                posterHorizontal: row.POSTER ? row.POSTER.replace('.jpg', ' _ ngang.jpg') : null,
                description: row.MOTA,
                year: row.NAMSX,
                country: row.QUOCGIA,
                quality: row.DINHDANG || null,
                duration: isPhimBo ? `${row.TONGSOTAP} Tập` : durationStr,
                age: ageTag ? ageTag.name : 'K',
                tags: tags,
                matchScore: row.SOLUOTTUONGTAC
            };
        });

        res.json(top10);
    } catch (err) {
        console.error('Lỗi getTop10Movies:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy top 10' });
    }
};

module.exports = {
    getAllMovies,
    getMovieById,
    getCategories,
    getTags,
    getTop10Movies
};
