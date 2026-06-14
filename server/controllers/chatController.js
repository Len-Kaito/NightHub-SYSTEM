const db = require('../config/database');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Cấu hình Gemini
const apiKey = process.env.GEMINI_API_KEY || '';
let genAI = null;
let model = null;
try {
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }
} catch (e) {
  console.warn("Gemini API initialization failed:", e.message);
}

const chatController = {
  // Lấy lịch sử chat của một hồ sơ
  getChatHistory: async (req, res) => {
    try {
      const { profileId } = req.params;
      console.log(`[getChatHistory] called for profileId=${profileId}`);

      // 1. Tìm phiên chat đang hoạt động (TrangThai = 'Đang chat' hoặc mới nhất)
      const phienResult = await db.execute(
        `SELECT MaPhien FROM PHIEN_CHAT_AI 
         WHERE MaHoSo = :profileId 
         ORDER BY CASE WHEN TrangThai IN (N'Đang chat', N'Chuyển nhân viên') THEN 1 ELSE 2 END ASC, 
         NgayTao DESC FETCH FIRST 1 ROWS ONLY`,
        { profileId },
        { outFormat: db.OUT_FORMAT_OBJECT }
      );

      if (phienResult.rows.length === 0) {
        return res.json([]); // Chưa có chat
      }

      const maPhien = phienResult.rows[0].MAPHIEN;

      // 2. Lấy tin nhắn trong phiên đó
      const tnResult = await db.execute(
        `SELECT MaTN, NoiDung, NguoiGui, ThoiGian FROM TIN_NHAN_AI WHERE MaPhien = :maPhien ORDER BY ThoiGian ASC`,
        { maPhien },
        { outFormat: db.OUT_FORMAT_OBJECT }
      );

      // 3. Lấy phim gợi ý cho từng tin nhắn
      const tnIds = tnResult.rows.map(r => r.MATN);
      let suggestionsMap = {};
      
      if (tnIds.length > 0) {
        // Build in-list
        const inClause = tnIds.map(id => `'${id}'`).join(',');
        const gyResult = await db.execute(
          `SELECT G.MaTN, P.MaPhim, P.TenPhim, P.Poster, V.YeuCauGoi 
           FROM GOI_Y_KET_QUA G
           JOIN PHIM P ON G.MaPhim = P.MaPhim
           LEFT JOIN VIDEO_PHAT V ON V.MaPhim = P.MaPhim AND V.STT IS NULL
           WHERE G.MaTN IN (${inClause})`,
          {},
          { outFormat: db.OUT_FORMAT_OBJECT }
        );

        gyResult.rows.forEach(r => {
          if (!suggestionsMap[r.MATN]) suggestionsMap[r.MATN] = [];
          // Tránh duplicate nếu có nhiều VIDEO_PHAT (vd phim bộ)
          if (!suggestionsMap[r.MATN].find(p => p.id === r.MAPHIM)) {
            suggestionsMap[r.MATN].push({
              id: r.MAPHIM,
              title: r.TENPHIM,
              poster: r.POSTER,
              requiredPlan: r.YEUCAUGOI || 'Miễn phí'
            });
          }
        });
      }

      // Format lại output
      const messages = tnResult.rows.map(row => ({
        id: row.MATN,
        text: row.NOIDUNG,
        sender: row.NGUOIGUI === 'USER' ? 'user' : (row.NGUOIGUI === 'CC' ? 'cc' : 'ai'),
        timestamp: row.THOIGIAN,
        suggestions: suggestionsMap[row.MATN] || []
      }));

      res.json(messages);

    } catch (error) {
      console.error('Lỗi khi lấy lịch sử chat:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // Gửi tin nhắn mới và nhận phản hồi từ Gemini
  sendMessage: async (req, res) => {
    try {
      const { profileId, text } = req.body;
      if (!text || !profileId) return res.status(400).json({ message: 'Thiếu dữ liệu' });

      // 1. Tìm hoặc tạo phiên chat
      let maPhien;
      const phienResult = await db.execute(
        `SELECT MaPhien, MaTK_CSKH FROM PHIEN_CHAT_AI WHERE MaHoSo = :profileId AND TrangThai IN (N'Đang chat', N'Chuyển nhân viên') ORDER BY NgayTao DESC FETCH FIRST 1 ROWS ONLY`,
        { profileId },
        { outFormat: db.OUT_FORMAT_OBJECT }
      );

      if (phienResult.rows.length === 0) {
        maPhien = 'P' + Date.now().toString().slice(-14);
        await db.execute(
          `INSERT INTO PHIEN_CHAT_AI (MaPhien, NgayTao, TrangThai, MaHoSo) VALUES (:maPhien, CURRENT_TIMESTAMP, N'Đang chat', :profileId)`,
          { maPhien, profileId },
          { autoCommit: true }
        );
      } else {
        maPhien = phienResult.rows[0].MAPHIEN;
        const maCskh = phienResult.rows[0].MATK_CSKH;
        const trangThai = phienResult.rows[0].TRANGTHAI;

        // If session is waiting for CC or assigned to CC, do not let AI reply
        if (maCskh || trangThai === 'Chuyển nhân viên' || trangThai === 'Đang hỗ trợ') {
           const userMsgId = 'TN' + Date.now().toString().slice(-13);
           await db.execute(
             `INSERT INTO TIN_NHAN_AI (MaTN, NoiDung, NguoiGui, MaPhien) VALUES (:id, :txt, 'USER', :phien)`,
             { id: userMsgId, txt: text, phien: maPhien },
             { autoCommit: true }
           );
           return res.json({ success: true }); // Empty response, AI doesn't reply
        }
      }

      // 2. Lưu tin nhắn User
      const userMsgId = 'TN' + Date.now().toString().slice(-13);
      await db.execute(
        `INSERT INTO TIN_NHAN_AI (MaTN, NoiDung, NguoiGui, MaPhien) VALUES (:id, :txt, 'USER', :phien)`,
        { id: userMsgId, txt: text, phien: maPhien },
        { autoCommit: true }
      );

      // 3. Lấy FAQ làm Context
      const faqResult = await db.execute(`SELECT CauHoi, CauTraLoi FROM FAQ`);
      let faqText = faqResult.rows.map(r => `Q: ${r[0]}\nA: ${r[1]}`).join('\n\n');

      // 4. Lấy danh sách phim để AI có thể gợi ý (lấy top 50 phim thịnh hành hoặc ngẫu nhiên)
      const phimResult = await db.execute(
        `SELECT P.MaPhim, P.TenPhim, P.QuocGia, P.NamSX,
                LISTAGG(DISTINCT DM.TenDM, ', ') WITHIN GROUP (ORDER BY DM.TenDM) AS TheLoai,
                LISTAGG(DISTINCT DV.TenDV, ', ') WITHIN GROUP (ORDER BY DV.TenDV) AS DienVien,
                LISTAGG(DISTINCT DD.TenDD, ', ') WITHIN GROUP (ORDER BY DD.TenDD) AS DaoDien
         FROM PHIM P
         LEFT JOIN PHIM_DANH_MUC PDM ON P.MaPhim = PDM.MaPhim
         LEFT JOIN DANH_MUC DM ON PDM.MaDM = DM.MaDM
         LEFT JOIN PHIM_DIEN_VIEN PDV ON P.MaPhim = PDV.MaPhim
         LEFT JOIN DIEN_VIEN DV ON PDV.MaDV = DV.MaDV
         LEFT JOIN PHIM_DAO_DIEN PDD ON P.MaPhim = PDD.MaPhim
         LEFT JOIN DAO_DIEN DD ON PDD.MaDD = DD.MaDD
         WHERE P.TrangThaiHT = N'Công khai'
         GROUP BY P.MaPhim, P.TenPhim, P.QuocGia, P.NamSX
         FETCH FIRST 50 ROWS ONLY`,
        {},
        { outFormat: db.OUT_FORMAT_OBJECT }
      );
      let phimListText = phimResult.rows.map(r => 
        `- ${r.TENPHIM} (Mã: ${r.MAPHIM}) | Thể loại: ${r.THELOAI || 'N/A'} | Diễn viên: ${r.DIENVIEN || 'N/A'} | Đạo diễn: ${r.DAODIEN || 'N/A'} | ${r.QUOCGIA || ''} ${r.NAMSX || ''}`
      ).join('\n');

      // Predefined hardcoded responses to avoid Gemini API calls for quick suggestions
      const predefinedResponses = {
        'làm thế nào để thay đổi mật khẩu tài khoản?': 'Bạn có thể vào Cài đặt > Tài khoản > Đổi mật khẩu. Vui lòng nhập mật khẩu hiện tại và mật khẩu mới để xác nhận.',
        'gói vip có quyền lợi gì?': 'Xem phim không quảng cáo, chất lượng 4K và truy cập kho phim độc quyền.',
        'làm sao để xem phim trên màn hình tivi (smart tv)?': 'Ứng dụng Nighthub hiện đã hỗ trợ cài đặt trên các nền tảng WebOS, Tizen và Android TV. Hoặc bạn có thể sử dụng tính năng Cast từ điện thoại.'
      };

      const normalizedText = text.trim().toLowerCase();
      let aiResponseText = '';

      if (predefinedResponses[normalizedText]) {
        aiResponseText = predefinedResponses[normalizedText];
      } else if (!model || !apiKey) {
        aiResponseText = 'Xin lỗi, trợ lý AI hiện đang bảo trì (thiếu API Key). Vui lòng sử dụng tính năng "Chat với nhân viên" để được hỗ trợ.';
      } else {
        // 5. Chuẩn bị Prompt cho Gemini
        const systemPrompt = `Bạn là NightBot — trợ lý AI thông minh của nền tảng xem phim trực tuyến Nighthub.

## HƯỚNG DẪN CHUNG
- Trả lời ngắn gọn (tối đa 3-4 câu), thân thiện và chuyên nghiệp.
- Luôn trả lời bằng tiếng Việt.

## XỬ LÝ CÂU HỎI FAQ
Dưới đây là danh sách FAQ chính thức của Nighthub. Khi người dùng hỏi bất kỳ câu nào 
LIÊN QUAN về ý nghĩa (dù viết sai chính tả, thiếu dấu, đổi cách diễn đạt, dùng từ đồng nghĩa, 
hoặc viết tắt), hãy TỰ SUY LUẬN xem câu hỏi có khớp với FAQ nào không và trả lời dựa trên 
nội dung FAQ đó. ĐỪNG yêu cầu người dùng hỏi lại chính xác hơn.

Ví dụ: "lam sao doi mk" -> khớp FAQ "Làm thế nào để đổi mật khẩu?"
Ví dụ: "xem phim ko can vip duoc ko" -> khớp FAQ về gói VIP/miễn phí.

### FAQ:
${faqText}

## GỢI Ý PHIM
Dưới đây là danh sách phim trên hệ thống kèm thể loại. Khi người dùng hỏi tìm phim 
(theo thể loại, tên, diễn viên, đạo diễn, quốc gia...), hãy chọn phim phù hợp nhất.

### Danh sách phim:
${phimListText}

## ĐỊNH DẠNG GỢI Ý PHIM
Nếu gợi ý phim, CHÈN mã phim ở cuối câu theo đúng format:
[GỢI_Ý: MaPhim1, MaPhim2]
Ví dụ: "Mình gợi ý bạn xem Inside Out 2 nhé! [GỢI_Ý: Phim001]"
Nếu không gợi ý phim -> KHÔNG ghi thẻ [GỢI_Ý].

Bây giờ, hãy trả lời câu hỏi sau của người dùng:
User: ${text}`;

        try {
          // 6. Gọi Gemini
          const result = await model.generateContent(systemPrompt);
          aiResponseText = result.response.text();
        } catch (genError) {
          console.error("Gemini Generate Error:", genError);
          aiResponseText = 'Xin lỗi, trợ lý AI hiện đang bảo trì hoặc quá tải. Vui lòng thử lại sau hoặc "Chat với nhân viên".';
        }
      }

      // 7. Bóc tách [GỢI_Ý: ...]
      let suggestedMovieIds = [];
      const match = aiResponseText.match(/\[GỢI_Ý:\s*(.+?)\]/i);
      if (match) {
        // Lấy danh sách mã phim, xóa khoảng trắng
        suggestedMovieIds = match[1].split(',').map(id => id.trim());
        // Xóa phần thẻ [GỢI_Ý: ...] ra khỏi text hiển thị cho user
        aiResponseText = aiResponseText.replace(/\[GỢI_Ý:\s*(.+?)\]/i, '').trim();
      }

      // 8. Lưu tin nhắn AI
      // Chờ 10ms để ID không bị trùng nếu chạy quá nhanh
      await new Promise(resolve => setTimeout(resolve, 10));
      const aiMsgId = 'TN' + Date.now().toString().slice(-13);
      await db.execute(
        `INSERT INTO TIN_NHAN_AI (MaTN, NoiDung, NguoiGui, MaPhien) VALUES (:id, :txt, 'AI', :phien)`,
        { id: aiMsgId, txt: aiResponseText, phien: maPhien },
        { autoCommit: true }
      );

      // 9. Lưu gợi ý phim vào GOI_Y_KET_QUA và lấy thông tin phim trả về Frontend
      let suggestions = [];
      if (suggestedMovieIds.length > 0) {
        for (const maPhim of suggestedMovieIds) {
          // Kiểm tra phim có tồn tại không
          const checkPhim = await db.execute(
            `SELECT P.MaPhim, P.TenPhim, P.Poster, V.YeuCauGoi 
             FROM PHIM P
             LEFT JOIN VIDEO_PHAT V ON V.MaPhim = P.MaPhim AND V.STT IS NULL
             WHERE P.MaPhim = :maPhim`,
            { maPhim },
            { outFormat: db.OUT_FORMAT_OBJECT }
          );

          if (checkPhim.rows.length > 0) {
            const p = checkPhim.rows[0];
            
            // Lưu vào DB
            try {
              await db.execute(
                `INSERT INTO GOI_Y_KET_QUA (MaTN, MaPhim) VALUES (:msgId, :movieId)`,
                { msgId: aiMsgId, movieId: p.MAPHIM },
                { autoCommit: true }
              );
              
              suggestions.push({
                id: p.MAPHIM,
                title: p.TENPHIM,
                poster: p.POSTER,
                requiredPlan: p.YEUCAUGOI || 'Miễn phí'
              });
            } catch (err) {
              console.error('Lỗi khi lưu gợi ý:', err);
              // Bỏ qua lỗi duplicate PK (nếu có)
            }
          }
        }
      }

      res.json({
        id: aiMsgId,
        text: aiResponseText,
        sender: 'ai',
        suggestions: suggestions
      });

    } catch (error) {
      console.error('Lỗi gửi tin nhắn chatbot:', error);
      res.status(500).json({ message: 'Lỗi khi giao tiếp với AI' });
    }
  },

  // CSKH
  requestSupport: async (req, res) => {
    try {
      const { profileId } = req.body;
      if (!profileId) return res.status(400).json({ message: 'Thiếu dữ liệu' });

      // Find active chat session
      let maPhien;
      
      // Validate profileId exists
      const checkProfile = await db.execute(`SELECT 1 FROM HO_SO WHERE MaHoSo = :profileId`, { profileId }, { outFormat: db.OUT_FORMAT_OBJECT });
      if (checkProfile.rows.length === 0) {
        return res.status(400).json({ message: 'Hồ sơ không tồn tại hoặc phiên đăng nhập đã cũ. Vui lòng F5 hoặc đăng nhập lại.' });
      }

      const phienResult = await db.execute(
        `SELECT MaPhien FROM PHIEN_CHAT_AI WHERE MaHoSo = :profileId AND TrangThai = N'Đang chat' ORDER BY NgayTao DESC FETCH FIRST 1 ROWS ONLY`,
        { profileId }, { outFormat: db.OUT_FORMAT_OBJECT }
      );

      if (phienResult.rows.length > 0) {
        maPhien = phienResult.rows[0].MAPHIEN;
      } else {
        // Create new session if no active session
        maPhien = 'P' + Date.now().toString().slice(-14);
        await db.execute(
          `INSERT INTO PHIEN_CHAT_AI (MaPhien, NgayTao, TrangThai, MaHoSo) VALUES (:maPhien, CURRENT_TIMESTAMP, N'Đang chat', :profileId)`,
          { maPhien, profileId }, { autoCommit: true }
        );
      }

      // 1.5. Lưu tin nhắn của User ("Tôi muốn gặp nhân viên CSKH.") vào DB
      const userMsgId = 'TN' + Date.now().toString().slice(-13);
      await db.execute(
        `INSERT INTO TIN_NHAN_AI (MaTN, NoiDung, NguoiGui, ThoiGian, MaPhien) VALUES (:id, :txt, 'USER', CURRENT_TIMESTAMP, :phien)`,
        { id: userMsgId, txt: 'Tôi muốn gặp nhân viên CSKH.', phien: maPhien },
        { autoCommit: true }
      );

      // Assign to the least busy CSKH
      const cskhResult = await db.execute(`SELECT fn_LayCSKHRanhNhat() AS MACSKH FROM DUAL`, {}, { outFormat: db.OUT_FORMAT_OBJECT });
      const maCskh = cskhResult.rows[0].MACSKH;

      if (maCskh) {
        // Fetch staff name
        const staffRes = await db.execute(`SELECT TenHT FROM TAI_KHOAN WHERE MaTK = :maCskh`, { maCskh }, { outFormat: db.OUT_FORMAT_OBJECT });
        const tenCskh = staffRes.rows.length > 0 ? staffRes.rows[0].TENHT : maCskh;

        // Update session
        await db.execute(
          `UPDATE PHIEN_CHAT_AI SET MaTK_CSKH = :maCskh WHERE MaPhien = :maPhien`,
          { maCskh, maPhien }, { autoCommit: true }
        );

        // Update workload
        await db.execute(
          `UPDATE CHAM_SOC_KHACH_HANG SET SoPhienDangXuLy = SoPhienDangXuLy + 1 WHERE MaTK = :maCskh`,
          { maCskh }, { autoCommit: true }
        );
        
        // Add auto-message from system
        const maTN = 'TN' + Date.now().toString().slice(-13);
        
        await db.execute(
          `INSERT INTO TIN_NHAN_AI (MaTN, NoiDung, NguoiGui, ThoiGian, MaPhien)
           VALUES (:maTN, :content, 'CC', CURRENT_TIMESTAMP, :maPhien)`,
          { maTN, content: `Nhân viên hỗ trợ [${tenCskh}] đã kết nối. Bạn có thể bắt đầu chat ngay bây giờ!`, maPhien }, { autoCommit: true }
        );

        res.json({ message: 'Đã yêu cầu CSKH thành công', assignedTo: tenCskh });
      } else {
        // No CC available, mark as waiting
        await db.execute(
          `UPDATE PHIEN_CHAT_AI SET TrangThai = N'Chuyển nhân viên' WHERE MaPhien = :maPhien`,
          { maPhien }, { autoCommit: true }
        );
        
        const maTN = 'TN' + Date.now().toString().slice(-13);
        await db.execute(
          `INSERT INTO TIN_NHAN_AI (MaTN, NoiDung, NguoiGui, ThoiGian, MaPhien)
           VALUES (:maTN, :content, 'CC', CURRENT_TIMESTAMP, :maPhien)`,
          { maTN, content: 'Hiện tại tất cả nhân viên CSKH đều đang bận, yêu cầu của bạn đã được đưa vào hàng đợi. Vui lòng giữ máy...', maPhien }, { autoCommit: true }
        );
        
        res.json({ message: 'Hiện tại tất cả nhân viên CSKH đều đang bận, yêu cầu của bạn đã được đưa vào hàng đợi. Vui lòng giữ máy...' });
      }
    } catch (error) {
      console.error('Lỗi gọi CSKH:', error);
      res.status(500).json({ message: 'Lỗi server', details: error.message });
    }
  },

  endSession: async (req, res) => {
    try {
      const { profileId } = req.params;
      
      const phienResult = await db.execute(
        `SELECT MaPhien FROM PHIEN_CHAT_AI WHERE MaHoSo = :profileId AND TrangThai IN (N'Đang chat', N'Chuyển nhân viên', N'Đang hỗ trợ') ORDER BY NgayTao DESC FETCH FIRST 1 ROWS ONLY`,
        { profileId }, { outFormat: db.OUT_FORMAT_OBJECT }
      );

      if (phienResult.rows.length > 0) {
        const maPhien = phienResult.rows[0].MAPHIEN;
        await db.execute(
          `UPDATE PHIEN_CHAT_AI SET TrangThai = N'Kết thúc' WHERE MaPhien = :maPhien`,
          { maPhien }, { autoCommit: true }
        );
        res.json({ message: 'Đã kết thúc phiên chat' });
      } else {
        res.json({ message: 'Không có phiên chat nào đang hoạt động' });
      }
    } catch (error) {
      console.error('Lỗi kết thúc phiên chat:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
};

module.exports = chatController;
