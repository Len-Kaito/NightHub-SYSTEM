import React, { useState, useEffect } from 'react';
import { Users, Lock, Unlock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useUser } from '../../context/UserContext';

const AdminUsers = () => {
  const { showToast } = useToast();
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  const fetchUsers = () => {
    fetch('/api/admin/users')
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Lỗi fetch users:', err);
        setUsers([]);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatusClick = (id, currentStatus) => {
    const newStatus = currentStatus === 'Hoạt động' ? 'Bị khóa' : 'Hoạt động';
    setConfirmData({ id, newStatus });
    setIsConfirmModalOpen(true);
  };

  const executeToggleStatus = async () => {
    if (!confirmData) return;
    try {
      const res = await fetch(`/api/admin/users/${confirmData.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: confirmData.newStatus })
      });
      if (res.ok) {
        fetchUsers();
        showToast(`Đã ${confirmData.newStatus === 'Bị khóa' ? 'khóa' : 'mở khóa'} tài khoản thành công!`);
      } else {
        const err = await res.json();
        showToast(err.message || 'Lỗi cập nhật trạng thái', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi kết nối server', true);
    } finally {
      setIsConfirmModalOpen(false);
      setConfirmData(null);
    }
  };

  const filteredUsers = users.filter(u => u.id !== currentUser?.id);

  return (
    <>
      <div className="admin-users animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ fontWeight: 600 }}>Quản lý Tài khoản & Phân quyền</h2>
        </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} /> Danh sách người dùng
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã TK</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: 'right' }}>Khóa/Mở</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td style={{ color: '#888', fontWeight: 600 }}>{user.id}</td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <span className={`badge ${user.status === 'Hoạt động' ? 'success' : 'danger'}`}>
                      {user.status || 'Chưa xác thực'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => toggleStatusClick(user.id, user.status)}
                      className="admin-icon-btn" 
                      style={{ 
                        display: 'inline-flex', 
                        color: user.status === 'Hoạt động' ? '#ff4757' : '#2ed573' 
                      }}
                      title={user.status === 'Hoạt động' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                    >
                      {user.status === 'Hoạt động' ? <Lock size={18} /> : <Unlock size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {isConfirmModalOpen && confirmData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1c23', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#fff' }}>
              {confirmData.newStatus === 'Bị khóa' ? 'Xác nhận Khóa Tài khoản' : 'Xác nhận Mở khóa Tài khoản'}
            </h3>
            <p style={{ color: '#a0a0a0', marginBottom: '25px', fontSize: '14px' }}>
              Bạn có chắc chắn muốn {confirmData.newStatus === 'Bị khóa' ? 'khóa' : 'mở khóa'} tài khoản người dùng này không?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button onClick={() => { setIsConfirmModalOpen(false); setConfirmData(null); }} className="admin-btn-secondary">
                Hủy
              </button>
              <button 
                onClick={executeToggleStatus} 
                className="admin-btn-primary" 
                style={{ backgroundColor: confirmData.newStatus === 'Bị khóa' ? '#ff4757' : '#2ed573' }}
              >
                {confirmData.newStatus === 'Bị khóa' ? 'Khóa Tài khoản' : 'Mở khóa Tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUsers;
