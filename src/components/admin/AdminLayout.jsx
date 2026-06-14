import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { 
  LayoutDashboard, Film, MonitorPlay, ShieldAlert, 
  MessageSquareText, Users, FileBarChart, LogOut, Settings, Home
} from 'lucide-react';
import './AdminLayout.css';

// Mapping role ID (maVt) to Role Name
const ROLE_NAMES = {
  'SYS_ADMIN': 'Quản trị hệ thống',
  'CONTENT_ADMIN': 'Quản lý nội dung',
  'MOD': 'Kiểm duyệt viên',
  'CC': 'Chăm sóc khách hàng',
  'USER': 'Khách hàng',
};

const AdminLayout = () => {
  const { user, profiles, activeProfileId, logout, isLoggedIn } = useUser();
  const currentProfile = profiles?.find(p => p.id === activeProfileId) || profiles?.[0];
  const navigate = useNavigate();

  // Handle unauthorized access gracefully
  if (!isLoggedIn || !user || user.role === 'USER') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1014', color: '#fff', flexDirection: 'column', gap: '20px' }}>
        <h2>Không có quyền truy cập</h2>
        <p style={{ color: '#888' }}>Bạn cần đăng nhập bằng tài khoản Quản trị viên hoặc Nhân viên.</p>
        <button onClick={() => navigate('/')} style={{ padding: '10px 20px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Quay về Trang chủ</button>
      </div>
    );
  }

  const roleId = user.role || 'SYS_ADMIN'; 
  const roleName = ROLE_NAMES[roleId] || 'Nhân viên';

  // Navigation Items filtered by Role
  const navItems = [
    { path: '/admin/dashboard', icon: <LayoutDashboard />, label: 'Thống kê & Phân tích', roles: ['SYS_ADMIN', 'CONTENT_ADMIN'] },
    { path: '/admin/movies', icon: <Film />, label: 'CMS Kho Phim', roles: ['SYS_ADMIN', 'CONTENT_ADMIN'] },
    { path: '/admin/ads', icon: <MonitorPlay />, label: 'Quảng cáo & Đối tác', roles: ['SYS_ADMIN', 'CONTENT_ADMIN'] },
    { path: '/admin/moderation', icon: <ShieldAlert />, label: 'Kiểm duyệt nội dung', roles: ['SYS_ADMIN', 'MOD'] },
    { path: '/admin/users', icon: <Users />, label: 'Tài khoản & Phân quyền', roles: ['SYS_ADMIN'] },
  ].filter(item => item.roles.includes(roleId));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <NavLink to="/admin" className="admin-logo">
            NIGHTHUB <span>WORKSPACE</span>
          </NavLink>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-profile" style={{ marginBottom: '15px' }}>
            <img src={currentProfile?.avatarUrl || 'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/9rdo8k24_asset24x.webp'} alt="Admin" className="admin-user-avatar" />
            <div className="admin-user-info">
              <div className="admin-user-name">{currentProfile?.name || user.name}</div>
              <div className="admin-user-role">{roleName}</div>
            </div>
          </div>
          
          <button 
            onClick={() => {
              logout();
              navigate('/login');
            }} 
            className="admin-nav-item" 
            style={{ width: '100%', background: 'transparent', border: 'none', color: '#ff4757', cursor: 'pointer', justifyContent: 'flex-start', marginTop: '5px' }}
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN LAYOUT */}
      <main className="admin-main">
        {/* HEADER */}
        <header className="admin-header">
          <div className="admin-header-title">Hệ thống Quản trị</div>
          <div className="admin-header-actions">
            <button className="admin-icon-btn" title="Cài đặt hệ thống"><Settings size={20} /></button>
            <button className="admin-icon-btn" title="Đăng xuất" onClick={handleLogout} style={{ color: '#ff4757' }}><LogOut size={20} /></button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
