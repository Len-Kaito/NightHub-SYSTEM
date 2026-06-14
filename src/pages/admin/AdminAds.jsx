import React, { useState, useEffect } from 'react';
import { Plus, X, MonitorPlay } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const AdminAds = () => {
  const { showToast } = useToast();
  const [ads, setAds] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    requestedViews: 0, price: 0, videoUrl: '', partnerId: ''
  });

  const fetchAds = () => {
    fetch('/api/admin/ads')
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => setAds(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Lỗi fetch ads:', err);
        setAds([]);
      });
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchAds();
        setFormData({ requestedViews: 0, price: 0, videoUrl: '', partnerId: '' });
        showToast('Tạo chiến dịch quảng cáo thành công');
      } else {
        const err = await res.json();
        showToast(err.message || 'Lỗi tạo quảng cáo', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi kết nối server', true);
    }
  };

  return (
    <>
      <div className="admin-ads animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ fontWeight: 600 }}>Quản lý Quảng Cáo & Đối Tác</h2>
        </div>

        <div className="admin-card">
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="admin-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} /> Tạo chiến dịch mới
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã QC</th>
                <th>Đối Tác</th>
                <th>Mục tiêu views</th>
                <th>Đã đạt</th>
                <th>Đơn giá (VNĐ)</th>
                <th>Doanh thu (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad, idx) => (
                <tr key={idx}>
                  <td style={{ color: '#888', fontWeight: 600 }}>{ad.adId}</td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{ad.partnerId}</td>
                  <td>{ad.requestedViews.toLocaleString()}</td>
                  <td>{ad.currentViews.toLocaleString()}</td>
                  <td>{ad.price.toLocaleString()}</td>
                  <td style={{ color: '#2ed573', fontWeight: 'bold' }}>{ad.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {ads.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            Chưa có chiến dịch quảng cáo nào đang chạy.
          </div>
        )}
      </div>

      </div>

      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1c23', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Tạo chiến dịch quảng cáo</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Mã đối tác (VD: DT001)</label>
                  <input type="text" value={formData.partnerId} onChange={e => setFormData({...formData, partnerId: e.target.value})} required style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Số lượt yêu cầu</label>
                  <input type="number" value={formData.requestedViews} onChange={e => setFormData({...formData, requestedViews: e.target.value === '' ? '' : Number(e.target.value)})} required style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Đơn giá trên 1 view (VNĐ)</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value === '' ? '' : Number(e.target.value)})} required style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>URL Video Quảng Cáo</label>
                  <input type="text" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="admin-btn-secondary">
                    Hủy
                  </button>
                  <button type="submit" className="admin-btn-primary">
                    Thêm Chiến Dịch
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminAds;
