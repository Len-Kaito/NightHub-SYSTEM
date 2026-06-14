# NightHub - Hệ thống xem phim trực tuyến & Quản trị CMS

NightHub là một nền tảng website xem phim trực tuyến hiện đại với giao diện mượt mà và hệ thống quản trị (Admin Dashboard) mạnh mẽ. Dự án bao gồm Frontend (React.js + Vite) và Backend (Node.js + Oracle Database).

---

## 📌 Yêu Cầu Hệ Thống (Prerequisites)

Trước khi cài đặt, hãy đảm bảo máy tính của bạn đã cài đặt các phần mềm sau:
1. **Node.js**: (Phiên bản v18.0.0 trở lên). Tải tại: [https://nodejs.org/](https://nodejs.org/)
2. **Oracle Database**: (Phiên bản 19c hoặc 21c Express Edition). Yêu cầu đã thiết lập User có quyền DBA (ví dụ: `SYS` hoặc `SYSTEM`).
3. **Git**: Dùng để tải mã nguồn. Tải tại: [https://git-scm.com/](https://git-scm.com/)

---

## 🚀 Hướng Dẫn Chạy Dự Án (Local Development)

### Bước 1: Clone dự án về máy
Mở Terminal và chạy lệnh sau để tải mã nguồn về máy:
```bash
git clone <đường-link-github-của-bạn>
cd nighthub-react
```

### Bước 2: Thiết lập Cơ sở dữ liệu (Oracle Database)
Dự án sử dụng Oracle SQL. Bạn cần chạy các file SQL có sẵn trong thư mục gốc của dự án theo thứ tự sau để khởi tạo cấu trúc và dữ liệu mẫu:
1. Mở công cụ quản lý Oracle (SQL Developer hoặc SQL*Plus).
2. Kết nối bằng tài khoản quyền cao (`SYS` hoặc `SYSTEM`).
3. Chạy file `khoi_tao_user_va_role.sql` để tạo User `NIGHTHUB` và cấp quyền cơ bản.
4. Ngắt kết nối và **Đăng nhập lại bằng tài khoản `NIGHTHUB`** (Mật khẩu mặc định: `123456`).
5. Chạy tuần tự các file sau trong User `NIGHTHUB`:
   - Bạn có thể chạy file `build_database.sql` (Tạo bảng, nạp dữ liệu và cấu hình View/Function/Trigger).

*(Ngoài ra có thể sử dụng file `build_db.bat` nếu bạn dùng Windows và đã config biến môi trường SQL*Plus. Tránh tự động chạy trên các máy khác nhau nên file này sẽ nạp dữ liệu một lần duy nhất).*

> [!TIP]
> **Xóa và Nạp lại dữ liệu (Reset Database):**
> Nếu trong quá trình chấm bài giảng viên cần làm sạch Database để test lại từ đầu, giảng viên chỉ cần:
> 1. Chạy file `DeleteTable.sql` để xóa toàn bộ cấu trúc cũ.
> 2. Chạy lại file `build_database.sql` (hoặc `build_db.bat`) để nạp lại dữ liệu tươi mới.

### Bước 3: Cài đặt và Chạy Backend (Node.js)
Mở một cửa sổ Terminal mới:
```bash
# Di chuyển vào thư mục server
cd server

# Cài đặt các thư viện Node.js cần thiết
npm install

# Khởi chạy Backend Server (Mặc định sẽ chạy ở cổng 3001)
npm start
```
*Lưu ý: Nếu Oracle DB của bạn có Port hoặc Tên PDB khác mặc định (XEPDB1) hoặc mật khẩu khác, hãy sửa trực tiếp trong file `server/.env`.*

### Bước 4: Cài đặt và Chạy Frontend (React.js)
Mở một cửa sổ Terminal mới (để giữ Backend vẫn đang chạy ở cửa sổ kia):
```bash
# Ở thư mục gốc của dự án (nighthub-react)
npm install

# Khởi chạy giao diện Frontend
npm run dev
```

### Bước 5: Truy cập hệ thống
Sau khi chạy thành công, Terminal sẽ hiển thị đường dẫn cục bộ (thường là `http://localhost:5173/`).
- Mở trình duyệt và truy cập `http://localhost:5173/` để xem trang người dùng.
- Giao diện Admin quản trị có thể truy cập tại `http://localhost:5173/admin` (Hoặc theo phân quyền khi đăng nhập bằng tài khoản Quản trị).

---

## 🌟 Chức Năng Nổi Bật
- **Frontend UI/UX**: Thiết kế responsive, mượt mà, tối giản hóa trải nghiệm xem phim.
- **AI Chatbot**: Tích hợp Google Gemini AI hỗ trợ tư vấn phim qua dữ liệu SQL.
- **Admin Dashboard**:
  - Biểu đồ thống kê trực quan (Recharts) theo dữ liệu thật từ Database (Doanh thu theo tháng/ngày).
  - Hệ thống kiểm duyệt bình luận rác/vi phạm sử dụng Trigger tự động.
  - Form CMS đa năng cập nhật cấu trúc bảng liên kết (Phim - Đạo Diễn - Diễn Viên - Đối Tác).
- **PL/SQL Mạnh Mẽ**: Sử dụng hàng chục Stored Procedures, Functions, Cursors và Triggers để đảm bảo tính nhất quán dữ liệu và tự động hóa nghiệp vụ (Hạ cấp VIP, Xóa vi phạm...).
