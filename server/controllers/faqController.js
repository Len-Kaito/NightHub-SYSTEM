const db = require('../config/database');

const faqController = {
  // Lấy danh sách câu hỏi thường gặp
  getFAQ: async (req, res) => {
    try {
      const result = await db.execute(
        `SELECT MaFAQ, CauHoi, CauTraLoi, NhomChuDe FROM FAQ ORDER BY MaFAQ ASC`,
        {},
        { outFormat: db.OUT_FORMAT_OBJECT }
      );

      // Chuyển đổi tên cột thành camelCase cho dễ dùng ở frontend
      const faqs = result.rows.map(row => ({
        id: row.MAFAQ,
        question: row.CAUHOI,
        answer: row.CAUTRALOI,
        category: row.NHOMCHUDE
      }));

      res.json(faqs);
    } catch (error) {
      console.error('Lỗi khi lấy FAQ:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách FAQ' });
    }
  }
};

module.exports = faqController;
