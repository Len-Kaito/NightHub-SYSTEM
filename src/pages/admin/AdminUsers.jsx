import React, { useState, useEffect } from 'react';
import { Users, Lock, Unlock, Search, Shield, ChevronLeft, ChevronRight, UserCog } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useUser } from '../../context/UserContext';

const ITEMS_PER_PAGE = 10;

const AdminUsers = () => {
  const { showToast } = useToast();
  const { user: currentUser } = useUser();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, activeTab]);

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



  // Get unique roles from users
  const uniqueRoles = [...new Set(users.map(u => u.role).filter(Boolean))];

  // Split users by role
  const userList = users.filter(u => u.id !== currentUser?.id && u.role === 'USER');
  const staffList = users.filter(u => u.id !== currentUser?.id && u.role && u.role !== 'USER');

  // Apply search/filter based on active tab
  const baseList = activeTab === 'users' ? userList : staffList;
  const filteredUsers = baseList
    .filter(u => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (u.email && u.email.toLowerCase().includes(term)) || (u.id && String(u.id).toLowerCase().includes(term));
    })
    .filter(u => {
      if (roleFilter === 'all') return true;
      return u.role === roleFilter;
    })
    .filter(u => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'Chưa xác thực') return !u.status;
      return u.status === statusFilter;
    });

  // Unique roles for current tab
  const tabRoles = [...new Set(baseList.map(u => u.role).filter(Boolean))];

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getStatusBadgeClass = (status) => {
    if (status === 'Hoạt động') return 'success';
    if (status === 'Bị khóa') return 'danger';
    return 'warning';
  };



  const tabStyle = (tabName) => ({
    padding: '10px 24px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    borderBottom: activeTab === tabName ? '2px solid var(--accent-color, #e50914)' : '2px solid transparent',
    color: activeTab === tabName ? '#fff' : '#888',
    fontWeight: activeTab === tabName ? 600 : 400,
    fontSize: '15px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  });



  return (
    <>
      <div className="admin-users animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ fontWeight: 600 }}>Quản lý Tài khoản & Phân quyền</h2>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #333', marginBottom: '20px' }}>
          <button style={tabStyle('users')} onClick={() => setActiveTab('users')}>
            <Users size={18} /> Người dùng
          </button>
          <button style={tabStyle('staff')} onClick={() => setActiveTab('staff')}>
            <UserCog size={18} /> Nhân viên
          </button>
        </div>

        {/* TAB: Content shared for both tabs */}
        <div className="admin-card">
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activeTab === 'users' ? <><Shield size={20} /> Danh sách người dùng</> : <><UserCog size={20} /> Danh sách nhân viên</>}
            </h3>

            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 250px', minWidth: '200px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input
                  type="text"
                  placeholder="Tìm theo Email hoặc Mã TK..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    background: '#0f1014',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="admin-select" style={{ minWidth: '150px' }}>
                <option value="all">Tất cả vai trò</option>
                {tabRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-select" style={{ minWidth: '150px' }}>
                <option value="all">Tất cả trạng thái</option>
                <option value="Hoạt động">Hoạt động</option>
                <option value="Bị khóa">Bị khóa</option>
                <option value="Chưa xác thực">Chưa xác thực</option>
              </select>
            </div>

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
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: '30px' }}>
                        Không tìm thấy người dùng nào
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr key={user.id}>
                        <td style={{ color: '#888', fontWeight: 600 }}>{user.id}</td>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{user.email}</td>
                        <td>
                          <span style={{ fontWeight: 500 }}>{user.role || '—'}</span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                            {user.status || 'Chưa xác thực'}
                          </span>
                        </td>
                        <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="admin-pagination">
                <button className="admin-pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft size={16} /> Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} className={`admin-pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>
                    {page}
                  </button>
                ))}
                <button className="admin-pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  Sau <ChevronRight size={16} />
                </button>
              </div>
            )}
            <div className="admin-pagination-info">
              Hiển thị {paginatedUsers.length} / {filteredUsers.length} {activeTab === 'users' ? 'người dùng' : 'nhân viên'} (Trang {currentPage}/{totalPages})
            </div>
          </div>
      </div>

      {/* Confirm Modal */}
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
