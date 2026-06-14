import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Filter, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const AdminMovies = () => {
  const { showToast } = useToast();
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', poster: '', description: '', year: 2024, country: '', trailer: '', categories: '', actors: '', directors: '', partnerId: ''
  });
  const [activeStatusMenu, setActiveStatusMenu] = useState(null);
  const [activeCensorMenu, setActiveCensorMenu] = useState(null);

  const fetchMovies = () => {
    fetch('/api/admin/movies')
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => setMovies(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Lỗi fetch phim:', err);
        setMovies([]);
      });
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const catArray = formData.categories.split(',').map(c => c.trim()).filter(c => c);
      const actorArray = formData.actors ? formData.actors.split(',').map(a => a.trim()).filter(a => a) : [];
      const directorArray = formData.directors ? formData.directors.split(',').map(d => d.trim()).filter(d => d) : [];
      
      const res = await fetch('/api/admin/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          categories: catArray,
          actors: actorArray,
          directors: directorArray
        })
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchMovies(); // Reload
        setFormData({ title: '', poster: '', description: '', year: 2024, country: '', trailer: '', categories: '', actors: '', directors: '', partnerId: '' });
        showToast('Thêm phim thành công!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.message || 'Có lỗi xảy ra khi thêm phim!', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi hệ thống khi kết nối server!', true);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`/api/admin/movies/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchMovies();
      setActiveStatusMenu(null);
      showToast(`Đã đổi trạng thái thành ${newStatus}`);
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi đổi trạng thái hiển thị', true);
    }
  };

  const updateCensorStatus = async (id, newStatus) => {
    try {
      await fetch(`/api/admin/movies/${id}/censor-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchMovies();
      setActiveCensorMenu(null);
      showToast(`Đã cập nhật kiểm duyệt thành ${newStatus}`);
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi đổi trạng thái kiểm duyệt', true);
    }
  };

  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-movies animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontWeight: 600 }}>Quản lý Kho Phim</h2>
      </div>

      <div className="admin-card">
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: '#888' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm phim theo tên, mã phim..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', padding: '10px 15px 10px 45px', 
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', color: '#fff', outline: 'none'
              }}
            />
          </div>

        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Phim</th>
                <th>Tên Phim</th>
                <th>Năm SX</th>
                <th>Lượt Thích</th>
                <th>Hiển thị</th>
                <th>Kiểm duyệt</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovies.map((movie) => (
                <tr key={movie.id}>
                  <td style={{ color: '#888', fontWeight: 600 }}>{movie.id}</td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img src={movie.poster || '/images/default_poster.jpg'} alt="" style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ fontWeight: 600, color: '#fff' }}>{movie.title}</div>
                  </td>
                  <td>{movie.year}</td>
                  <td>{movie.likes}</td>
                  <td>
                    <span 
                      className={`badge ${movie.status === 'Công khai' ? 'success' : movie.status === 'Sắp chiếu' ? 'warning' : 'danger'}`} 
                    >
                      {movie.status || 'Ẩn'}
                    </span>
                  </td>
                  <td>
                    <span 
                      className={`badge ${movie.censorStatus === 'Đã duyệt' ? 'success' : movie.censorStatus === 'Chờ duyệt' ? 'warning' : 'danger'}`} 
                    >
                      {movie.censorStatus || 'Chờ duyệt'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', position: 'relative' }}>
                    <button 
                      className="admin-icon-btn" 
                      style={{ display: 'inline-flex', color: '#1e90ff', marginRight: '5px' }}
                      onClick={() => { setActiveCensorMenu(null); setActiveStatusMenu(activeStatusMenu === movie.id ? null : movie.id); }}
                      title="Chỉnh sửa trạng thái hiển thị"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      className="admin-icon-btn" 
                      style={{ display: 'inline-flex', color: '#ffa502' }}
                      onClick={() => { setActiveStatusMenu(null); setActiveCensorMenu(activeCensorMenu === movie.id ? null : movie.id); }}
                      title="Chỉnh sửa kiểm duyệt"
                    >
                      <Edit size={18} />
                    </button>

                    {activeStatusMenu === movie.id && (
                      <div style={{
                        position: 'absolute', right: '40px', top: '35px', background: '#252836',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
                      }}>
                        {['Công khai', 'Ẩn', 'Sắp chiếu'].map(st => (
                          <button 
                            key={st}
                            onClick={() => updateStatus(movie.id, st)}
                            style={{
                              background: 'transparent', color: '#fff', border: 'none', padding: '10px 15px',
                              textAlign: 'left', cursor: 'pointer', fontSize: '13px', width: '120px',
                              borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}
                            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.target.style.background = 'transparent'}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeCensorMenu === movie.id && (
                      <div style={{
                        position: 'absolute', right: '10px', top: '35px', background: '#252836',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
                      }}>
                        {['Đã duyệt', 'Chờ duyệt', 'Từ chối'].map(st => (
                          <button 
                            key={st}
                            onClick={() => updateCensorStatus(movie.id, st)}
                            style={{
                              background: 'transparent', color: '#fff', border: 'none', padding: '10px 15px',
                              textAlign: 'left', cursor: 'pointer', fontSize: '13px', width: '120px',
                              borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}
                            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.target.style.background = 'transparent'}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredMovies.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            Không tìm thấy phim nào phù hợp.
          </div>
        )}
      </div>

      {/* Add Movie Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1c23', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Thêm Phim Mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Tên phim</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>URL Poster</label>
                  <input type="text" value={formData.poster} onChange={e => setFormData({...formData, poster: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Năm sản xuất</label>
                    <input type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Quốc gia</label>
                    <input type="text" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>URL Trailer</label>
                  <input type="text" value={formData.trailer} onChange={e => setFormData({...formData, trailer: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Danh mục (Nhập mã, cách nhau dấu phẩy: DM01, DM02)</label>
                  <input type="text" value={formData.categories} onChange={e => setFormData({...formData, categories: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Đạo diễn (Nhập mã DD01...)</label>
                    <input type="text" value={formData.directors} onChange={e => setFormData({...formData, directors: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Diễn viên (Nhập mã DV01...)</label>
                    <input type="text" value={formData.actors} onChange={e => setFormData({...formData, actors: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Đối tác cung cấp (Mã Đối tác)</label>
                  <input type="text" value={formData.partnerId} onChange={e => setFormData({...formData, partnerId: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Mô tả phim</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="4" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}></textarea>
                </div>
                <button type="submit" style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, marginTop: '10px' }}>
                  Lưu Phim Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMovies;
