Quản lý tài khoản và phân quyền 
VAI_TRO (MaVT, TenVT, MoTa)
Tân từ: Lưu trữ thông tin về các vai trò trong hệ thống để phục vụ phân quyền. Bao gồm thông tin: Mã vai trò (MaVT), tên vai trò (TenVT), mô tả chi tiết quyền hạn (MoTa).

TAI_KHOAN (MaTK, Email, MatKhau, TenHT, NgayDK, TrangThai, MaVT)
Tân từ: Lưu trữ thông tin cơ bản của mọi tài khoản truy cập vào nền tảng, đóng vai trò là thực thể cha. Các thông tin bao gồm: Mã tài khoản (MaTK), email (Email), mật khẩu (MatKhau), tên hiển thị (TenHT), ngày đăng ký (NgayDK), trạng thái tài khoản (TrangThai), mã vai trò (MaVT).

THANH_VIEN (MaTK, SoDienThoai, NgaySinh, GioiTinh, GoiHienTai, NgayHetHan)
Tân từ: Lưu trữ thông tin cá nhân và gói dịch vụ của khách hàng đăng ký thành viên. Bao gồm: Mã tài khoản (MaTK), số điện thoại (SoDienThoai), ngày sinh (NgaySinh), giới tính (GioiTinh), gói dịch vụ đang sử dụng (GoiHienTai), ngày hết hạn gói (NgayHetHan).

NHAN_VIEN (MaTK, NgayBatDauLam, TrangThaiLamViec)
Tân từ: Lưu trữ thông tin nội bộ của đội ngũ vận hành hệ thống. Bao gồm: Mã tài khoản (MaTK), ngày bắt đầu công tác (NgayBatDauLam), trạng thái làm việc (TrangThaiLamViec).

KIEM_DUYET_VIEN (MaTK, NhomPhuTrach)
Tân từ: Lưu trữ thông tin đặc thù của tài khoản kiểm duyệt: Mã tài khoản (MaTK), nhóm nội dung phụ trách (NhomPhuTrach).

QUAN_TRI_VIEN_NOI_DUNG (MaTK, PhamViQuanLy)
Tân từ: Lưu trữ thông tin đặc thù của tài khoản quản trị nội dung: Mã tài khoản (MaTK), phạm vi chuyên môn quản lý (PhamViQuanLy).

QUAN_TRI_VIEN_HE_THONG (MaTK, DiaChiIPChoPhep, NgaySaoLuuCuoi)
Tân từ: Lưu trữ các thiết lập bảo mật mạng và lịch sử vận hành cấp thấp của Quản trị viên hệ thống. Bao gồm: Mã tài khoản (MaTK), địa chỉ IP duy nhất được cấp phép để thực hiện đăng nhập nhằm chống truy cập trái phép từ bên ngoài (DiaChiIPChoPhep), và mốc thời gian gần nhất quản trị viên này thực hiện thao tác sao lưu (Backup) cơ sở dữ liệu hệ thống (NgaySaoLuuCuoi).

CHAM_SOC_KHACH_HANG (MaTK, TrangThai, SoPhienDangXuLy)
Tân từ: Lưu trữ thông tin vận hành của nhân viên chăm sóc khách hàng phụ trách tiếp nhận và xử lý các yêu cầu hỗ trợ từ người dùng. Bao gồm: Mã tài khoản (MaTK), trạng thái làm việc hiện tại — sẵn sàng hay bận (TrangThai), và số lượng phiên hỗ trợ mà nhân viên đang đồng thời xử lý (SoPhienDangXuLy). 

Hồ sơ và cá nhân hóa
HO_SO (MaHoSo, TenHoSo, AnhDaiDien, LoaiHoSo, MaPIN, MaTK_TV)
Tân từ: Lưu trữ thông tin chi tiết của các hồ sơ (Profile) độc lập trực thuộc một tài khoản thành viên nhằm phục vụ mục đích cá nhân hóa trải nghiệm. Các thông tin bao gồm: Mã định danh hồ sơ (MaHoSo), tên hiển thị do người dùng thiết lập (TenHoSo), đường dẫn lưu trữ hình ảnh đại diện (AnhDaiDien), phân loại cấu hình hồ sơ để thiết lập quyền hạn và kiểm soát nội dung (LoaiHoSo), mã bảo mật cá nhân dùng để kiểm soát truy cập hồ sơ (MaPIN) và mã thành viên sở hữu hồ sơ (MaTK_TV). 

LICH_SU_XEM (MaLSX, TienDo, NgayTT, MaHoSo, MaVP)
Tân từ: Ghi nhận tiến độ xem phim hoặc danh sách phim lưu trữ của thành viên. Bao gồm: Mã lưu trữ (MaLSX), tiến độ xem bằng giây (TienDo), ngày tương tác (NgayTT), mã hồ sơ (MaHoSo), mã video phát (MaVP).

THEM_DANH_SACH_YEU_THICH (MaHoSo, MaPhim, NgayThem)
Tân từ: Lưu trữ danh sách các bộ phim mà người dùng chủ động đánh dấu yêu thích hoặc lưu để xem sau. Bao gồm: Mã hồ sơ (MaHoSo), mã bộ phim (MaPhim) và ngày thực hiện thêm vào danh sách (NgayThem). Khóa chính là khóa kép (MaHoSo, MaPhim).

GOI_Y_PHIM (MaGY, DiemSo, NgayTao, MaPhim, MaHoSo)
Tân từ: Lưu trữ kết quả đề xuất phim vào các danh mục. Bao gồm: Mã gợi ý (MaGY), điểm số phù hợp (DiemSo), ngày tạo (NgayTao), mã phim đề xuất (MaPhim), mã hồ sơ nhận đề xuất cá nhân hóa (MaHoSo).

Nội dung phim
PHIM (MaPhim, TenPhim, Poster, MoTa, NamSX, QuocGia, URLTrailer, TrangThaiKD, TrangThaiHienThi, LuotXem, LuotThich, MaDT, MaTK_QTVND)
Tân từ: Lưu trữ thông tin cốt lõi và số liệu thống kê của phim. Bao gồm: Mã phim (MaPhim), tên phim (TenPhim), đường dẫn poster phim (Poster), mô tả (MoTa), năm sản xuất (NamSX), quốc gia sản xuất (QuocGia), đường dẫn trailer (URLTrailer), trạng thái kiểm duyệt (TrangThaiKD), trạng thái hiển thị trên web (TrangThaiHienThi), tổng lượt xem (LuotXem), tổng lượt thích (LuotThich) và mã đối tác (MaDT), quản trị viên nội dung quản lý (MaTK_QTVND).

PHIM_LE (MaPhim, DinhDang)
Tân từ: Lưu trữ thuộc tính chuyên biệt cho phim điện ảnh/phim lẻ. Bao gồm: Mã phim (MaPhim), định dạng công nghệ trình chiếu (DinhDang).

PHIM_BO (MaPhim, TongSoTap, SoMua, TrangThaiPhatSong, LichPhatSong)
Tân từ: Lưu trữ thuộc tính chuyên biệt cho phim bộ nhiều tập. Bao gồm: Mã phim (MaPhim), tổng số tập (TongSoTap), số mùa phát hành (SoMua), trạng thái phát sóng (TrangThaiPhatSong), lịch chiếu định kỳ (LichPhatSong).

VIDEO_PHAT (MaVP, YeuCauGoi, STT, TieuDe, URLGoc, ThoiLuong, MaPhim)
Tân từ: Quản lý thông tin chi tiết của các đơn vị video thực tế có thể phát của một bộ phim. Đối với phim bộ, đây là từng tập phim; đối với phim lẻ, đây là toàn bộ thời lượng phim. Bao gồm: Mã video phát (MaVP), yêu cầu phân hạng gói dịch vụ (YeuCauGoi), số thứ tự phát (STT), tiêu đề (TieuDe), đường dẫn tệp video gốc (URLGoc), thời lượng phát (ThoiLuong), mã bộ phim trực thuộc (MaPhim).

PHIEN_BAN_VIDEO (MaPB, YeuCauGoi, URLDoPhanGiai, DinhDangMaHoa, MaVP)
Tân từ: Lưu trữ thông tin các luồng phát video đã được mã hóa phục vụ công nghệ luồng phát thích ứng. Bao gồm: Mã phiên bản (MaPB), yêu cầu phân hạng gói dịch vụ (YeuCauGoi), đường dẫn tệp cấu hình phát của từng độ phân giải (URLDoPhanGiai), định dạng mã hóa video (DinhDangMaHoa), mã video phát tương ứng (MaVP).

DIEN_VIEN (MaDV, TenDV, NgaySinh, QuocTich)
Tân từ: Lưu trữ thông tin định danh của các diễn viên tham gia trong các bộ phim để phục vụ chức năng tìm kiếm và hiển thị hồ sơ nghệ sĩ. Các thông tin bao gồm: Mã diễn viên (MaDV), tên diễn viên (TenDV), ngày sinh (NgaySinh) và quốc tịch (QuocTich).

DAO_DIEN (MaDD, TenDD, NgaySinh, QuocTich)
Tân từ: Lưu trữ thông tin của các đạo diễn nhằm hỗ trợ khởi tạo hồ sơ phim chi tiết. Các thông tin bao gồm: Mã đạo diễn (MaDD), tên đạo diễn (TenDD), ngày sinh (NgaySinh) và quốc tịch (QuocTich).

TAG (MaTag, TenTag, MoTa)
Tân từ: Lưu trữ danh sách các nhãn dán đặc điểm, từ khóa hoặc các tiêu chí phân loại phụ (như "Xuyên không", "Zombies", "Phụ đề"). Bao gồm: Mã nhãn (MaTag) và tên nhãn (TenTag), Mô tả tag (MoTa).

PHIM_DIEN_VIEN (MaPhim, MaDV, VaiTro)
Tân từ: Bảng trung gian thể hiện mối quan hệ giữa phim và diễn viên. Lưu trữ thông tin một bộ phim có những diễn viên nào tham gia và vai trò của họ trong phim đó. Bao gồm: Mã phim (MaPhim), mã diễn viên (MaDV) và tên vai diễn/vai trò (VaiTro).

PHIM_DAO_DIEN (MaPhim, MaDD)
Tân từ: Bảng trung gian thể hiện mối quan hệ giữa phim và các đạo diễn. Một bộ phim có thể do một hoặc nhiều đạo diễn thực hiện, và một đạo diễn có thể thực hiện nhiều bộ phim. Bao gồm: Mã phim (MaPhim) và Mã đạo diễn (MaDD).


PHIM_TAG (MaPhim, MaTag)
Tân từ: Bảng trung gian thể hiện việc gắn các nhãn dán cho phim phục vụ bộ lọc tìm kiếm và thuật toán gợi ý. Bao gồm: Mã phim (MaPhim) và mã nhãn (MaTag).

DANH_MUC (MaDM, TenDM, MoTa)
Tân từ: Lưu trữ cấu trúc phân loại nội dung phim. Bao gồm: Mã danh mục (MaDM), tên danh mục (TenDM), mô tả danh mục (MoTa).

PHIM_DANH_MUC (MaPhim, MaDM)
Tân từ: Lưu trữ thông tin một bộ phim thuộc về các danh mục nào và ngược lại. Bao gồm: Mã phim (MaPhim), mã danh mục (MaDM).

Tương tác và kiểm duyệt 
BINH_LUAN_KIEM_DUYET (MaBLKD, NoiDung, TrangThaiXL, MaBC, MaHTDD, MaTK_KDV)
Tân từ: Lưu trữ thông tin về các phiếu yêu cầu kiểm duyệt hoặc báo cáo vi phạm đối với bình luận trên nền tảng. Bao gồm: mã bình luận kiểm duyệt (MaBLKD), nội dung chi tiết của báo cáo vi phạm do kiểm duyệt viên đánh giá(NoiDung), trạng thái xử lý hiện tại của phiếu (TrangThaiXL), mã báo cáo vi phạm từ người dùng (nếu có) (MaBC), mã hệ thống đánh dấu (MaHTDD), và mã kiểm duyệt viên trực tiếp phụ trách xử lý phiếu này (MaTK_KDV). 

HE_THONG_DANH_DAU (MaHTDD, DoTinCay, NgayDanhDau, LoaiDanhDau, MaBL) 
Mỗi hệ thống đánh dấu được xác định bởi một mã hệ thống đánh dấu duy nhất (MaHTDD), có một mức độ tin cậy phản ánh mức độ chính xác của đánh dấu (DoTinCay), được thực hiện vào một ngày cụ thể (NgayDanhDau), thuộc về một loại đánh dấu nhất định trong hệ thống phân loại (LoaiDanhDau), mã bình luận được gắn cờ (MaBL).

THONG_BAO (MaTB, TieuDe, NoiDung, NgayGui, MaHoSo)
Tân từ: Lưu trữ các thông báo, cảnh báo hoặc phản hồi từ hệ thống/kiểm duyệt viên gửi đến hòm thư cá nhân của người dùng. Bao gồm: Mã thông báo (MaTB), tiêu đề (TieuDe), nội dung (NoiDung), ngày gửi (NgayGui) và mã hồ sơ nhận (MaHoSo).

BINH_LUAN_DANH_GIA (MaBL, NoiDung, SoDiem, NgayTao, TrangThai, MaHoSo, MaPhim)
Tân từ: Mỗi bình luận đánh giá được xác định bởi một mã bình luận duy nhất (MaBL), có một nội dung nhận xét cụ thể do người dùng soạn thảo (NoiDung), kèm theo một số điểm đánh giá dành cho bộ phim (SoDiem), được tạo vào một ngày xác định (NgayTao), và đang ở trong một trạng thái kiểm duyệt nhất định (TrangThai). Mỗi bình luận đánh giá chỉ thuộc về một hồ sơ người dùng (MaHoSo), chỉ nhắm đến một bộ phim cụ thể (MaPhim)

BAO_CAO_VI_PHAM (MaBC, LyDo, NgayTao, MaBL, MaHoSoGui)
Tân từ: Báo cáo vi phạm được xác định bởi một mã báo cáo duy nhất (MaBC), người dùng nhập lý do báo cáo bình luận (LyDo), thời gian tạo báo cáo (NgayTao), mã bình luận bị báo cáo (MaBL), mã người dùng gửi báo cáo (MaHoSoGui)

AI và hỗ trợ khách hàng
PHIEN_CHAT_AI (MaPhien, NgayTao, TrangThai, MaHoSo, MaTK_CSKH)
Tân từ: Lưu trữ thông tin các phiên hội thoại được khởi tạo giữa người dùng và trợ lý AI trên nền tảng. Bao gồm: Mã định danh phiên hội thoại (MaPhien), thời điểm phiên được tạo (NgayTao), trạng thái hiện tại của phiên — đang hoạt động hay đã kết thúc (TrangThai), và mã hồ sơ người dùng đã khởi tạo phiên đó (MaHoSo), mã chăm sóc khách hàng tham gia vào phiên chat AI đó (MaTK_CSKH). 

TIN_NHAN_AI (MaTN, NoiDung, ThoiGian, NguoiGui, MaPhien)
Tân từ: Lưu trữ nội dung từng lượt tin nhắn được trao đổi trong một phiên hội thoại AI. Bao gồm: Mã định danh tin nhắn (MaTN), nội dung văn bản (NoiDung), thời điểm gửi (ThoiGian), vai trò của bên gửi tin — người dùng hoặc trợ lý AI (NguoiGui), và mã phiên hội thoại chứa tin nhắn đó (MaPhien).

FAQ (MaFAQ, CauHoi, CauTraLoi, NhomChuDe, MaTK_QTVHT)
Tân từ: Lưu trữ danh mục câu hỏi thường gặp cùng câu trả lời tương ứng, phục vụ chức năng hỗ trợ tự động và giảm tải cho đội ngũ chăm sóc khách hàng. Bao gồm: Mã câu hỏi (MaFAQ), nội dung câu hỏi (CauHoi), nội dung câu trả lời chuẩn (CauTraLoi), nhóm chủ đề phân loại để trợ lý AI tra cứu đúng ngữ cảnh (NhomChuDe) và mã quản trị viên hệ thống quản lý (MaTK_QTVHT) . 

GOI_Y_KET_QUA (MaTN, MaPhim)
Tân từ: Bảng trung gian lưu trữ danh sách các bộ phim được trợ lý AI đề xuất trong một tin nhắn phản hồi cụ thể. Bao gồm: Mã tin nhắn chứa kết quả gợi ý (MaTN) và mã bộ phim được đề xuất (MaPhim). Khóa chính là khóa kép (MaTN, MaPhim).

Đối tác và kinh doanh
DOI_TAC (MaDT, TenDT, PhanLoai, Email, SoDienThoai, ChietKhau)
Tân từ: Quản lý thông tin của các đối tác hợp tác với nền tảng. Bao gồm: Mã đối tác (MaDT), tên đối tác (TenDT), phân loại đối tác (PhanLoai), thông tin liên hệ gồm email (Email) và số điện thoại (SoDienThoai), mức chiết khấu áp dụng (ChietKhau).

GIAO_DICH (MaGD, SoTien, TrangThai, NgayGiaoDich, MaTK_TV, MaDT)
Tân từ: Lưu trữ lịch sử thanh toán đăng ký/gia hạn gói VIP. Bao gồm: Mã giao dịch (MaGD), số tiền (SoTien), trạng thái giao dịch (TrangThai), ngày thực hiện giao dịch (NgayGiaoDich), mã tài khoản của thành viên (MaTV), mã đối tác xử lý (MaDT).

QUANG_CAO (MaQC, SoLuotYeuCau, SoLuotXem, DonGia, TrangThai, URLVideo, MaDT)
Tân từ: Lưu trữ thông tin các chiến dịch quảng cáo từ đối tác. Bao gồm: Mã quảng cáo (MaQC), số lượt xem yêu cầu (SoLuongYeuCau), số lượt xem đã đạt (SoLuongXem), đơn giá trên một lượt xem (DonGia), đường dẫn video (URLVideo), mã đối tác cung cấp (MaDT), trạng thái của quảng cáo (TrangThai).

PHIM_QUANG_CAO (MaPhim, MaQC, ThoiDiemPhat)
Tân từ: Lưu trữ thông tin một quảng cáo được cấu hình để hiển thị trên những bộ phim nào. Bao gồm: Mã phim (MaPhim), mã quảng cáo (MaQC), Thời điểm phát quảng cáo (ThoiDiemPhat).

Quản trị hệ thống
NHAT_KY_HE_THONG (MaLog, NgayGio, HanhDong, DoiTuong, GhiChu, MaTK_NV)
Tân từ: Lưu trữ nhật ký hoạt động (System Log) của đội ngũ quản trị để phục vụ công tác truy vết và bảo mật. Bao gồm: Mã nhật ký (MaLog), thời điểm thực hiện (NgayGio), hành động cụ thể (HanhDong), đối tượng bị tác động (DoiTuong) và ghi chú chi tiết (GhiChu), mã tài khoản của nhân viên thực hiện (MaTK_NV).