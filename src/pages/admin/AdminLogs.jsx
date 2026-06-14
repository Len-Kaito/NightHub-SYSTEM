import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, CheckCircle, Info } from 'lucide-react';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);

  const fetchLogs = () => {
    fetch('/api/admin/logs')
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(err => console.error('Lỗi fetch logs:', err));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action) => {
    if (action.includes('Lỗi') || action.includes('Khóa')) return <ShieldAlert size={16} color="#ff4757" />;
    if (action.includes('Thêm') || action.includes('Mở')) return <CheckCircle size={16} color="#2ed573" />;
    return <Info size={16} color="#1e90ff" />;
  };

  return (
    <div className="admin-logs animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontWeight: 600 }}>Nhật ký Hệ thống (System Logs)</h2>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} /> Truy vết thao tác (50 bản ghi gần nhất)
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Log</th>
                <th>Thời gian</th>
                <th>Hành động</th>
                <th>Đối tượng thao tác</th>
                <th>Người thực hiện</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: '#888', fontWeight: 600 }}>{log.id}</td>
                  <td>{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                    {getActionIcon(log.action)} {log.action}
                  </td>
                  <td>{log.target || 'Hệ thống'}</td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{log.adminId || 'AUTO'}</td>
                  <td style={{ color: '#aaa', fontSize: '13px' }}>{log.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {logs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            Không có nhật ký nào được ghi lại.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
