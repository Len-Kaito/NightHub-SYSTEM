import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Trash2 } from 'lucide-react';

const AdminModeration = () => {
  const [reports, setReports] = useState([]);

  const fetchReports = () => {
    fetch('/api/admin/reports')
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => setReports(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Lỗi fetch reports:', err);
        setReports([]);
      });
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (reportId, commentId, profileId, action) => {
    if (!window.confirm(`Bạn có chắc muốn ${action === 'delete' ? 'xóa' : 'bỏ qua'} bình luận này?`)) return;
    try {
      const res = await fetch('/api/admin/reports/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, commentId, profileId, action })
      });
      if (res.ok) {
        fetchReports();
      } else {
        alert('Lỗi xử lý vi phạm');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScan = async () => {
    try {
      const res = await fetch('/api/admin/reports/scan', { method: 'POST' });
      const data = await res.json();
      alert(data.message);
      fetchReports();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi quét hệ thống');
    }
  };

  return (
    <div className="admin-moderation animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontWeight: 600 }}>Kiểm Duyệt Nội Dung</h2>
        <button 
          onClick={handleScan}
          style={{ background: '#ff4757', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          Quét hệ thống đánh giá (Mô phỏng)
        </button>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: '20px', color: '#ff4757', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={20} /> Hàng chờ xử lý
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {reports.map((report) => (
            <div key={report.reportId} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#888', fontSize: '13px', marginBottom: '5px' }}>
                  Người gửi: <strong>{report.profileId}</strong> • Phiếu kiểm duyệt: {report.reportId} • {new Date(report.createdAt).toLocaleString()}
                </div>
                <div style={{ color: '#ff4757', fontSize: '14px', marginBottom: '10px' }}>
                  <strong>Lý do báo cáo:</strong> {report.reason}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 500, color: '#fff', margin: '10px 0' }}>
                  "{report.content}"
                </div>
                <span className="badge warning">{report.status}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleAction(report.reportId, report.commentId, report.profileId, 'ignore')}
                  style={{ background: 'rgba(46, 213, 115, 0.1)', color: '#2ed573', border: '1px solid rgba(46, 213, 115, 0.2)', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                >
                  <CheckCircle size={16} /> Bỏ qua (An toàn)
                </button>
                <button 
                  onClick={() => handleAction(report.reportId, report.commentId, report.profileId, 'delete')}
                  style={{ background: 'rgba(255, 71, 87, 0.1)', color: '#ff4757', border: '1px solid rgba(255, 71, 87, 0.2)', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                >
                  <Trash2 size={16} /> Xóa & Cảnh cáo
                </button>
              </div>
            </div>
          ))}
        </div>

        {reports.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            Tuyệt vời! Không có bình luận vi phạm nào chờ duyệt.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModeration;
