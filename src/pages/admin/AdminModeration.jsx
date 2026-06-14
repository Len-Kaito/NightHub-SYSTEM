import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Trash2, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const AdminModeration = () => {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

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

  const handleActionClick = (reportId, commentId, profileId, action) => {
    setConfirmData({ reportId, commentId, profileId, action });
    setIsConfirmModalOpen(true);
  };

  const executeAction = async () => {
    if (!confirmData) return;
    try {
      const res = await fetch('/api/admin/reports/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmData)
      });
      if (res.ok) {
        fetchReports();
        showToast(`Đã ${confirmData.action === 'delete' ? 'xóa' : 'bỏ qua'} bình luận thành công!`);
      } else {
        showToast('Lỗi xử lý vi phạm', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi kết nối server', true);
    } finally {
      setIsConfirmModalOpen(false);
      setConfirmData(null);
    }
  };

  const handleScan = async () => {
    try {
      const res = await fetch('/api/admin/reports/scan', { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Đã quét xong!');
      fetchReports();
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi quét hệ thống', true);
    }
  };

  return (
    <>
      <div className="admin-moderation animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ fontWeight: 600 }}>Kiểm Duyệt Nội Dung</h2>
        </div>

        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#ff4757', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <ShieldAlert size={20} /> Hàng chờ xử lý
            </h3>
            <button 
              onClick={handleScan}
              className="admin-btn-primary"
              style={{ background: '#ff4757', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              Quét các bình luận đánh giá
            </button>
          </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {reports.map((report) => (
            <div key={report.reportId} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#888', fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  {report.reporter === 'Hệ thống tự động' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ background: 'rgba(255, 71, 87, 0.15)', color: '#ff4757', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, border: '1px solid rgba(255, 71, 87, 0.3)' }}>HỆ THỐNG ĐÁNH DẤU</span>
                      {report.confidence && <span style={{ color: '#ff4757', fontSize: '12px', fontWeight: 600 }}>{report.confidence}%</span>}
                    </span>
                  ) : (
                    <span>Người gửi: <strong>{report.reporter}</strong></span>
                  )}
                  <span>• Người bị báo cáo: <strong>{report.profileId}</strong></span>
                  <span>• Mã phiếu: {report.reportId}</span>
                  <span>• {new Date(report.createdAt).toLocaleString('vi-VN')}</span>
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
                  onClick={() => handleActionClick(report.reportId, report.commentId, report.profileId, 'ignore')}
                  style={{ background: 'rgba(46, 213, 115, 0.1)', color: '#2ed573', border: '1px solid rgba(46, 213, 115, 0.2)', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                >
                  <CheckCircle size={16} /> Bỏ qua (An toàn)
                </button>
                <button 
                  onClick={() => handleActionClick(report.reportId, report.commentId, report.profileId, 'delete')}
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

    {isConfirmModalOpen && confirmData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1c23', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#fff' }}>
              {confirmData.action === 'delete' ? 'Xác nhận Xóa Bình luận' : 'Xác nhận Bỏ qua Vi phạm'}
            </h3>
            <p style={{ color: '#a0a0a0', marginBottom: '25px', fontSize: '14px' }}>
              {confirmData.action === 'delete' 
                ? 'Bạn có chắc chắn muốn xóa bình luận này và cảnh cáo người dùng không? Hành động này không thể hoàn tác.' 
                : 'Bạn có chắc chắn bình luận này an toàn và muốn đánh dấu bỏ qua báo cáo vi phạm không?'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button onClick={() => { setIsConfirmModalOpen(false); setConfirmData(null); }} className="admin-btn-secondary">
                Hủy
              </button>
              <button 
                onClick={executeAction} 
                className="admin-btn-primary" 
                style={{ backgroundColor: confirmData.action === 'delete' ? '#ff4757' : '#2ed573' }}
              >
                {confirmData.action === 'delete' ? 'Xác nhận Xóa' : 'Xác nhận Bỏ qua'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminModeration;
