const db = require('../config/database');

// Lấy danh sách hồ sơ của user hiện tại
const getProfiles = async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT MaHoSo, TenHoSo, AnhDaiDien, LoaiHoSo, MaPIN FROM HO_SO WHERE MaTK_TV = :userId`,
            { userId: req.user.id }
        );
        
        const profiles = result.rows.map(row => ({
            id: row.MAHOSO,
            name: row.TENHOSO,
            avatarUrl: row.ANHDAIDIEN === 'DEFAULT' ? 'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/9rdo8k24_asset24x.webp' : row.ANHDAIDIEN,
            isKids: row.LOAIHOSO === 'Trẻ em',
            pin: row.MAPIN
        }));

        res.json(profiles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi lấy danh sách hồ sơ' });
    }
};

// Tạo hồ sơ mới (sử dụng Procedure sp_TaoHoSo)
const createProfile = async (req, res) => {
    const { name, avatarUrl, isKids, pin } = req.body;
    try {
        await db.execute(
            `BEGIN sp_TaoHoSo(:name, :avatarUrl, :type, :pin, :userId); END;`,
            {
                name,
                avatarUrl: avatarUrl || 'DEFAULT',
                type: isKids ? 'Trẻ em' : 'Người lớn',
                pin: pin || null,
                userId: req.user.id
            },
            { autoCommit: true }
        );
        res.status(201).json({ message: 'Tạo hồ sơ thành công' });
    } catch (err) {
        console.error(err);
        if (err.message.includes('20013')) return res.status(400).json({ message: 'Tài khoản đã đạt giới hạn tối đa 5 hồ sơ' });
        res.status(500).json({ message: 'Lỗi tạo hồ sơ', error: err.message });
    }
};

// Sửa hồ sơ
const updateProfile = async (req, res) => {
    const { id } = req.params;
    const { name, avatarUrl, isKids, pin } = req.body;
    try {
        // Kiểm tra hồ sơ có thuộc user này không
        const check = await db.execute(`SELECT 1 FROM HO_SO WHERE MaHoSo = :id AND MaTK_TV = :userId`, { id, userId: req.user.id });
        if (check.rows.length === 0) return res.status(403).json({ message: 'Không có quyền sửa hồ sơ này' });

        await db.execute(
            `UPDATE HO_SO 
             SET TenHoSo = NVL(:name, TenHoSo),
                 AnhDaiDien = NVL(:avatarUrl, AnhDaiDien),
                 LoaiHoSo = NVL(:type, LoaiHoSo),
                 MaPIN = :pin
             WHERE MaHoSo = :id`,
            {
                name: name || null,
                avatarUrl: avatarUrl || null,
                type: isKids !== undefined ? (isKids ? 'Trẻ em' : 'Người lớn') : null,
                pin: pin || null,
                id
            },
            { autoCommit: true }
        );
        res.json({ message: 'Cập nhật hồ sơ thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi cập nhật hồ sơ' });
    }
};

// Xóa hồ sơ
const deleteProfile = async (req, res) => {
    const { id } = req.params;
    try {
        const check = await db.execute(`SELECT 1 FROM HO_SO WHERE MaHoSo = :id AND MaTK_TV = :userId`, { id, userId: req.user.id });
        if (check.rows.length === 0) return res.status(403).json({ message: 'Không có quyền xóa hồ sơ này' });

        await db.execute(`DELETE FROM HO_SO WHERE MaHoSo = :id`, { id }, { autoCommit: true });
        res.json({ message: 'Xóa hồ sơ thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi xóa hồ sơ' });
    }
};

const getVipStatus = async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT GoiHienTai, fn_TinhNgayHetHanVIP(:userId) AS NgayHetHan 
             FROM THANH_VIEN WHERE MaTK = :userId`,
            { userId: req.user.id }
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin thành viên' });
        }
        
        const row = result.rows[0];
        const isVip = row.GOIHIENTAI === 'VIP';
        
        if (!isVip) {
            return res.json({ isVip: false });
        }
        
        const ngayHetHan = new Date(row.NGAYHETHAN);
        const now = new Date();
        const diffTime = ngayHetHan - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) {
            // Đã hết hạn VIP, tự động hạ cấp xuống Miễn phí
            await db.execute(
                `UPDATE THANH_VIEN SET GoiHienTai = 'Miễn phí' WHERE MaTK = :userId`,
                { userId: req.user.id },
                { autoCommit: true }
            );
            return res.json({ isVip: false });
        }
        
        res.json({
            isVip: true,
            ngayHetHan: row.NGAYHETHAN,
            soNgayConLai: diffDays
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi lấy thông tin VIP', error: err.message });
    }
};

const upgradeVip = async (req, res) => {
    try {
        // Mặc định nạp gói 99k theo yêu cầu
        const amount = 99000;
        
        await db.execute(
            `BEGIN sp_MuaGoiVIP(:userId, :amount); END;`,
            { userId: req.user.id, amount },
            { autoCommit: true }
        );
        
        res.json({ message: 'Nâng cấp VIP thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi thanh toán VIP', error: err.message });
    }
};

module.exports = { getProfiles, createProfile, updateProfile, deleteProfile, getVipStatus, upgradeVip };
