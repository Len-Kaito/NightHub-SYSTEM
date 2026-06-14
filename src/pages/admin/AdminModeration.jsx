import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const AdminModeration = () => {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [violations, setViolations] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  // Pagination states
  const [currentPagePending, setCurrentPagePending] = useState(1);
  const [currentPageViolations, setCurrentPageViolations] = useState(1);
  const itemsPerPage = 10;

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

  const fetchViolations = () => {
    fetch('/api/admin/violations')
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => setViolations(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Lỗi fetch violations:', err);
        setViolations([]);
      });
  };

  useEffect(() => {
    fetchReports();
    fetchViolations();
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
        fetchViolations(); // Update violations list as well
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

  // Calculate pagination
  const indexOfLastPending = currentPagePending * itemsPerPage;
  const indexOfFirstPending = indexOfLastPending - itemsPerPage;
  const currentPending = reports.slice(indexOfFirstPending, indexOfLastPending);
  const totalPagesPending = Math.ceil(reports.length / itemsPerPage);

  const indexOfLastViolation = currentPageViolations * itemsPerPage;
  const indexOfFirstViolation = indexOfLastViolation - itemsPerPage;
  const currentViolations = violations.slice(indexOfFirstViolation, indexOfLastViolation);
  const totalPagesViolations = Math.ceil(violations.length / itemsPerPage);

  return (
    <>
      <div className="admin-moderation animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ fontWeight: 600 }}>Kiểm Duyệt Nội Dung</h2>
        </div>

        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button 
                onClick={() => { setActiveTab('pending'); setCurrentPagePending(1); }}
                style={{ 
                  background: 'none', border: 'none', color: activeTab === 'pending' ? '#ff4757' : '#888', 
                  fontSize: '16px', fontWeight: 600, cursor: 'pointer', padding: '10px 15px',
                  borderBottom: activeTab === 'pending' ? '2px solid #ff4757' : '2px solid transparent'
                }}>
                <ShieldAlert size={18} style={{ verticalAlign: 'text-bottom', marginRight: '5px' }} />
                Hàng chờ xử lý ({reports.length})
              </button>
              <button 
                onClick={() => { setActiveTab('violations'); setCurrentPageViolations(1); }}
                style={{ 
                  background: 'none', border: 'none', color: activeTab === 'violations' ? '#ff4757' : '#888', 
                  fontSize: '16px', fontWeight: 600, cursor: 'pointer', padding: '10px 15px',
                  borderBottom: activeTab === 'violations' ? '2px solid #ff4757' : '2px solid transparent'
                }}>
                Danh sách vi phạm đã ẩn ({violations.length})
              </button>
            </div>
            {activeTab === 'pending' && (
              <button 
                onClick={handleScan}
                className="admin-btn-primary"
                style={{ background: '#ff4757', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}
              >
                Quét vi phạm tự động
              </button>
            )}
          </div>

          {activeTab === 'pending' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {currentPending.map((report) => (
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

              {totalPagesPending > 1 && (
                <div className="admin-pagination" style={{ marginTop: '20px' }}>
                  <button 
                    disabled={currentPagePending === 1} 
                    onClick={() => setCurrentPagePending(p => p - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="page-info">Trang {currentPagePending} / {totalPagesPending}</span>
                  <button 
                    disabled={currentPagePending === totalPagesPending} 
                    onClick={() => setCurrentPagePending(p => p + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'violations' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {currentViolations.map((violation) => (
                  <div key={violation.commentId} style={{ background: 'rgba(255, 71, 87, 0.05)', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255, 71, 87, 0.2)' }}>
                    <div>
                      <div style={{ color: '#888', fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span>Mã bình luận: <strong>{violation.commentId}</strong></span>
                        <span>• Người đăng: <strong>{violation.profileId}</strong></span>
                        <span>• {new Date(violation.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: '#ff4757', margin: '10px 0', textDecoration: 'line-through' }}>
                        "{violation.content}"
                      </div>
                      <span className="badge error">Bị ẩn hệ thống</span>
                    </div>
                  </div>
                ))}
              </div>

              {violations.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  Chưa có bình luận nào bị xử lý vi phạm.
                </div>
              )}

              {totalPagesViolations > 1 && (
                <div className="admin-pagination" style={{ marginTop: '20px' }}>
                  <button 
                    disabled={currentPageViolations === 1} 
                    onClick={() => setCurrentPageViolations(p => p - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="page-info">Trang {currentPageViolations} / {totalPagesViolations}</span>
                  <button 
                    disabled={currentPageViolations === totalPagesViolations} 
                    onClick={() => setCurrentPageViolations(p => p + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isConfirmModalOpen && confirmData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1c23', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid #333' }}>
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
