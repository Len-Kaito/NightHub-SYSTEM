CHƯƠNG 6: TRÌNH BÀY THÔNG TIN
6.1. Thiết kế giao diện dành cho Người dùng chính
6.1.1. Giao diện Xác thực và Quản lý Hồ sơ
Màn hình Đăng nhập/Đăng ký; Giao diện "Who's Watching?" chọn Hồ sơ và nhập mã PIN. (Ánh xạ bảng: TAI_KHOAN, THANH_VIEN, HO_SO)
6.1.2. Màn hình Trang chủ và Khám phá nội dung
Hero Banner giới thiệu phim hot/Quảng cáo; Các dải phim phân loại theo danh mục và gợi ý cá nhân hóa. (Ánh xạ bảng: QUANG_CAO, PHIM, DANH_MUC, PHIM_DANH_MUC, GOI_Y_PHIM)
6.1.3. Trình phát Video thích ứng và Quảng cáo nội tuyến
Player hỗ trợ Adaptive Streaming và chuyển đổi độ phân giải động; Hiển thị quảng cáo chèn ngang (In-stream Ads) kèm nút đếm ngược "Bỏ qua". (Ánh xạ bảng: VIDEO_PHAT, PHIEN_BAN_VIDEO, PHIM_QUANG_CAO, QUANG_CAO)
6.1.4. Màn hình Chi tiết Phim và Tương tác
Thông tin đạo diễn, diễn viên, tag; Giao diện chấm sao, viết bình luận, báo cáo vi phạm; Trang "Danh sách của tôi". (Ánh xạ bảng: DIEN_VIEN, DAO_DIEN, TAG, PHIM_DIEN_VIEN, PHIM_DAO_DIEN, PHIM_TAG, BINH_LUAN_DANH_GIA, BAO_CAO_VI_PHAM, LICH_SU_XEM, THEM_DANH_SACH_YEU_THICH)
6.1.5. Cửa sổ Trợ lý thông minh AI Chatbot và Trung tâm trợ giúp
Khung chat pop-up tương tác tự nhiên với AI; Trang tra cứu FAQ, hòm thư. (Ánh xạ bảng: PHIEN_CHAT_AI, TIN_NHAN_AI, GOI_Y_KET_QUA, FAQ, THONG_BAO)
6.2. Thiết kế giao diện dành cho Quản trị viên
6.2.1. Bảng điều khiển Báo cáo, Thống kê và Phân tích
Trực quan hóa dữ liệu doanh thu gói VIP, đo lường hiệu năng lượt xem phim và hiệu suất phân phối quảng cáo.
 (Ánh xạ bảng: GIAO_DICH, PHIM, QUANG_CAO)
6.2.2. Hệ thống Quản trị nội dung kho phim (CMS Phim)
Biểu mẫu nhập đặc tả phim, tải tệp video gốc, cấu hình định dạng phim lẻ/phim bộ dành cho Quản trị viên nội dung.
 (Ánh xạ bảng: PHIM, PHIM_LE, PHIM_BO, VIDEO_PHAT, PHIEN_BAN_VIDEO)
6.2.3. Trung tâm điều phối Quảng cáo và Đối tác
Giao diện cấu hình chiến dịch, theo dõi tiến độ lượt xem mục tiêu và quản lý thông tin đối tác thương mại.
 (Ánh xạ bảng: QUANG_CAO, DOI_TAC)
6.2.4. Hàng chờ xử lý vi phạm (Moderation Queue)
Giao diện Ticket dành cho Kiểm duyệt viên để xử lý các bình luận bị người dùng báo cáo hoặc được hệ thống AI tự động đánh dấu.
 (Ánh xạ bảng: BINH_LUAN_KIEM_DUYET, HE_THONG_DANH_DAU, BAO_CAO_VI_PHAM)
6.2.5. Khung làm việc Live Chat CSKH
Màn hình tiếp quản các phiên hội thoại được chuyển giao (Handoff) từ Trợ lý AI.
 (Ánh xạ bảng: CHAM_SOC_KHACH_HANG, PHIEN_CHAT_AI)
6.2.6. Quản lý phân quyền và kiểm soát truy cập
Giao diện thiết lập vai trò, bật/tắt trạng thái hoạt động của nhân viên và người dùng toàn hệ thống.
 (Ánh xạ bảng: NHAN_VIEN, TAI_KHOAN, VAI_TRO)
6.2.7. Giám sát truy vết kiểm toán nội bộ
Bảng tra cứu nhật ký hệ thống nhằm theo dõi thao tác của đội ngũ vận hành, phục vụ truy vết trách nhiệm và chống gian lận.
 (Ánh xạ bảng: NHAT_KY_HE_THONG)