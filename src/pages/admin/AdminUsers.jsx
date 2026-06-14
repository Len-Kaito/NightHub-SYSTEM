import React, { useState, useEffect } from 'react';
import { Users, Lock, Unlock } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);

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

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Hoạt động' ? 'Bị khóa' : 'Hoạt động';
    if (!window.confirm(`Bạn có chắc muốn ${newStatus === 'Bị khóa' ? 'khóa' : 'mở khóa'} tài khoản ${id}?`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.message || 'Lỗi cập nhật trạng thái');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
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
              {users.map((user) => (
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
                      onClick={() => toggleStatus(user.id, user.status)}
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
  );
};

export default AdminUsers;
