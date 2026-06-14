import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, PlayCircle, DollarSign } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = React.useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalViews: 0,
    revenueData: [],
    revenueBreakdown: []
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/admin/dashboard-stats')
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => {
        if (data.totalRevenue !== undefined) {
          setStats(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching dashboard stats:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ color: '#fff', padding: '20px' }}>Đang tải dữ liệu...</div>;

  return (
    <div className="admin-dashboard animate-fade-in">
      <h2 style={{ marginBottom: '25px', fontWeight: 600 }}>Tổng quan Hệ thống</h2>
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '15px', background: 'rgba(229, 9, 20, 0.1)', borderRadius: '12px', color: 'var(--accent-color)' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <div style={{ color: '#888', fontSize: '13px', marginBottom: '5px' }}>Tổng doanh thu</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.totalRevenue.toLocaleString()} VNĐ</div>
            <div style={{ fontSize: '12px', color: '#2ed573', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={14} /> Dữ liệu thực từ DB
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '15px', background: 'rgba(30, 144, 255, 0.1)', borderRadius: '12px', color: '#1e90ff' }}>
            <PlayCircle size={28} />
          </div>
          <div>
            <div style={{ color: '#888', fontSize: '13px', marginBottom: '5px' }}>Tổng lượt xem</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.totalViews.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: '#2ed573', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={14} /> Toàn hệ thống
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '15px', background: 'rgba(46, 213, 115, 0.1)', borderRadius: '12px', color: '#2ed573' }}>
            <Users size={28} />
          </div>
          <div>
            <div style={{ color: '#888', fontSize: '13px', marginBottom: '5px' }}>Khách hàng</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.totalUsers.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: '#2ed573', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={14} /> Tổng số tài khoản
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="admin-card">
          <div className="admin-card-title">Biểu đồ Lượt xem & Doanh thu 6 tháng qua</div>
          <div style={{ width: '100%', height: 300, overflowX: 'auto', overflowY: 'hidden' }}>
            {stats.revenueData && stats.revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#888" tick={{fill: '#888'}} />
                  <YAxis yAxisId="left" stroke="#888" tick={{fill: '#888'}} />
                  <YAxis yAxisId="right" orientation="right" stroke="#888" tick={{fill: '#888'}} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1c23', border: 'none', borderRadius: '8px' }} />
                  <Line isAnimationActive={false} yAxisId="left" type="monotone" dataKey="views" name="Lượt xem" stroke="#1e90ff" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="revenue" name="Doanh thu (VNĐ)" stroke="#e50914" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
                Đang tải dữ liệu biểu đồ...
              </div>
            )}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Cơ cấu doanh thu</div>
          <div style={{ width: '100%', height: 300, overflowX: 'auto', overflowY: 'hidden' }}>
            {stats.revenueBreakdown && stats.revenueBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={stats.revenueBreakdown} 
                    cx="50%" cy="50%" 
                    innerRadius={60} outerRadius={100} 
                    paddingAngle={5} dataKey="value"
                    isAnimationActive={false}
                  >
                    {stats.revenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#2ed573', '#1e90ff', '#ffa502', '#ff4757', '#a4b0be'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1c23', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#888' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
                Đang tải dữ liệu biểu đồ...
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
