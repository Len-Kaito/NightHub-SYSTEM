const db = require('../config/database');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.execute(
            `SELECT MaTK, Email, TenHT, MaVT, TrangThai, MatKhau FROM TAI_KHOAN WHERE Email = :email`,
            { email: email }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        const user = result.rows[0];

        if (user.TRANGTHAI && user.TRANGTHAI.toLowerCase().includes('khóa')) {
            return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
        }

        // Compare plain text password (as stored in the mock data)
        if (password !== user.MATKHAU) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        const token = jwt.sign(
            { id: user.MATK, email: user.EMAIL, name: user.TENHT, maVt: user.MAVT },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.MATK,
                email: user.EMAIL,
                name: user.TENHT,
                role: user.MAVT
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Đăng nhập nhanh qua mạng xã hội (giả lập) - bỏ qua kiểm tra mật khẩu
const socialLogin = async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT MaTK, Email, TenHT, MaVT, TrangThai FROM TAI_KHOAN WHERE Email = :email`,
            { email: 'user.vip01@gmail.com' }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản TK013' });
        }

        const user = result.rows[0];

        if (user.TRANGTHAI && user.TRANGTHAI.toLowerCase().includes('khóa')) {
            return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
        }

        const token = jwt.sign(
            { id: user.MATK, email: user.EMAIL, name: user.TENHT, maVt: user.MAVT },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.MATK,
                email: user.EMAIL,
                name: user.TENHT,
                role: user.MAVT
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const register = async (req, res) => {
    const { email, password, name, phone, dob, gender } = req.body;
    try {
        // Calls the stored procedure sp_DangKyTaiKhoan
        await db.execute(
            `BEGIN sp_DangKyTaiKhoan(:email, :password, :name, :phone, TO_DATE(:dob, 'YYYY-MM-DD'), :gender); END;`,
            {
                email,
                password,
                name,
                phone: phone || null,
                dob: dob || null,
                gender: gender || null
            },
            { autoCommit: true }
        );
        
        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (err) {
        console.error(err);
        if (err.message.includes('20001')) return res.status(400).json({ message: 'Email không hợp lệ' });
        if (err.message.includes('20002')) return res.status(400).json({ message: 'Email đã được đăng ký' });
        if (err.message.includes('20003')) return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
        res.status(500).json({ message: 'Lỗi server khi đăng ký' });
    }
};

const forgotPassword = async (req, res) => {
    // Demo OTP
    res.json({ message: 'Mã OTP đã được gửi' });
};

const verifyOtp = async (req, res) => {
    // Demo OTP accepts anything
    res.json({ message: 'Xác thực OTP thành công' });
};

const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        await db.execute(
            `UPDATE TAI_KHOAN SET MatKhau = :newPassword WHERE Email = :email`,
            { newPassword, email },
            { autoCommit: true }
        );
        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const getMe = async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT MaTK, Email, TenHT, MaVT, TrangThai FROM TAI_KHOAN WHERE MaTK = :id`,
            { id: req.user.id }
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy user' });
        
        const user = result.rows[0];
        res.json({
            id: user.MATK,
            email: user.EMAIL,
            name: user.TENHT,
            role: user.MAVT,
            status: user.TRANGTHAI
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

module.exports = { login, socialLogin, register, forgotPassword, verifyOtp, resetPassword, getMe };
