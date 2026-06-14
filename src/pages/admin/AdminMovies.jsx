import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Filter, X, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const AdminMovies = () => {
  const { showToast } = useToast();
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', poster: '', description: '', year: 2026, country: '', trailer: '', categories: '', actors: '', directors: '', partnerId: '', censorStatus: 'Chờ duyệt', status: 'Ẩn', hasAd: false, adId: ''
  });
  const [ads, setAds] = useState([]);
  const [activeCensorMenu, setActiveCensorMenu] = useState(null);
  const [activeStatusMenu, setActiveStatusMenu] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

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
    fetch('/api/admin/ads')
      .then(res => res.json())
      .then(data => setAds(Array.isArray(data) ? data : []))
      .catch(err => console.error('Lỗi fetch ads:', err));
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const catArray = formData.categories.split(',').map(c => c.trim()).filter(c => c);
      const actorArray = formData.actors ? formData.actors.split(',').map(a => a.trim()).filter(a => a) : [];
      const directorArray = formData.directors ? formData.directors.split(',').map(d => d.trim()).filter(d => d) : [];
      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode ? `/api/admin/movies/${editId}` : '/api/admin/movies';
      
      const res = await fetch(url, {
        method,
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
        setIsEditMode(false);
        setEditId(null);
        fetchMovies(); // Reload
        setFormData({ title: '', poster: '', description: '', year: 2026, country: '', trailer: '', categories: '', actors: '', directors: '', partnerId: '', censorStatus: 'Chờ duyệt', status: 'Ẩn' });
        showToast(isEditMode ? 'Cập nhật phim thành công!' : 'Thêm phim thành công!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.message || (isEditMode ? 'Có lỗi xảy ra khi cập nhật phim!' : 'Có lỗi xảy ra khi thêm phim!'), true);
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi hệ thống khi kết nối server!', true);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/movies/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMovies();
        showToast('Đã xóa phim thành công');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.message || 'Lỗi khi xóa phim', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi hệ thống khi kết nối server!', true);
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
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

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const filteredMovies = movies.filter(m => 
    (m.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
    (String(m.id) || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  ).sort((a, b) => {
    if (sortConfig.key) {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    }
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / ITEMS_PER_PAGE));
  const paginatedMovies = filteredMovies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
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
          <button 
            onClick={() => {
              setIsEditMode(false);
              setEditId(null);
              setFormData({ title: '', poster: '', description: '', year: 2026, country: '', trailer: '', categories: '', actors: '', directors: '', partnerId: '', censorStatus: 'Chờ duyệt', status: 'Ẩn' });
              setIsAddModalOpen(true);
            }} 
            className="admin-btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
          >
            <Plus size={18} /> Thêm Phim Mới
          </button>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Phim</th>
                <th>Tên Phim</th>
                <th onClick={() => handleSort('year')} style={{ cursor: 'pointer' }}>Năm SX {sortConfig.key === 'year' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('avgRating')} style={{ cursor: 'pointer' }}>Điểm TB {sortConfig.key === 'avgRating' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('episodes')} style={{ cursor: 'pointer' }}>Số tập {sortConfig.key === 'episodes' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('comments')} style={{ cursor: 'pointer' }}>Bình luận {sortConfig.key === 'comments' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('likes')} style={{ cursor: 'pointer' }}>Lượt Thích {sortConfig.key === 'likes' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th>Hiển thị</th>
                <th>Kiểm duyệt</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovies.map((movie) => (
                <tr key={movie.id}>
                  <td style={{ color: '#888', fontWeight: 600 }}>{movie.id}</td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img src={movie.poster || '/images/default_poster.jpg'} alt="" style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ fontWeight: 600, color: '#fff' }}>{movie.title}</div>
                  </td>
                  <td>{movie.year}</td>
                  <td style={{ color: '#ffa502', fontWeight: 600 }}>{movie.avgRating?.toFixed(1)} ⭐</td>
                  <td>{movie.episodes} tập</td>
                  <td>{movie.comments}</td>
                  <td>{movie.likes}</td>
                  <td>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <span 
                        className={`badge ${movie.status === 'Công khai' ? 'success' : movie.status === 'Sắp chiếu' ? 'warning' : 'danger'}`} 
                        onClick={() => { setActiveCensorMenu(null); setActiveStatusMenu(activeStatusMenu === movie.id ? null : movie.id); }}
                        style={{ cursor: 'pointer' }}
                        title="Nhấn để đổi trạng thái"
                      >
                        {movie.status || 'Ẩn'} <ChevronDown size={14} style={{ marginLeft: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                      </span>
                      {activeStatusMenu === movie.id && (
                        <div style={{
                          position: 'absolute', left: '0', top: '35px', background: '#252836',
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
                    </div>
                  </td>
                  <td>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <span 
                        className={`badge ${movie.censorStatus === 'Đã duyệt' ? 'success' : movie.censorStatus === 'Chờ duyệt' ? 'warning' : 'danger'}`} 
                        onClick={() => { setActiveStatusMenu(null); setActiveCensorMenu(activeCensorMenu === movie.id ? null : movie.id); }}
                        style={{ cursor: 'pointer' }}
                        title="Nhấn để đổi trạng thái kiểm duyệt"
                      >
                        {movie.censorStatus || 'Chờ duyệt'} <ChevronDown size={14} style={{ marginLeft: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                      </span>
                      {activeCensorMenu === movie.id && (
                        <div style={{
                          position: 'absolute', left: '0', top: '35px', background: '#252836',
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
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="admin-icon-btn" 
                      style={{ display: 'inline-flex', color: '#3498db', marginRight: '5px' }}
                      onClick={() => {
                        setIsEditMode(true);
                        setEditId(movie.id);
                        setFormData({
                          title: movie.title, poster: movie.poster, description: '', year: movie.year, country: '', trailer: '', categories: '', actors: '', directors: '', partnerId: '', censorStatus: movie.censorStatus, status: movie.status, hasAd: !!movie.adId, adId: movie.adId || ''
                        });
                        setIsAddModalOpen(true);
                      }}
                      title="Chỉnh sửa thông tin phim"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      className="admin-icon-btn" 
                      style={{ display: 'inline-flex', color: '#ff4757', marginRight: '5px' }}
                      onClick={() => handleDeleteClick(movie.id)}
                      title="Xóa/Ẩn phim"
                    >
                      <Trash2 size={18} />
                    </button>
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
          Hiển thị {paginatedMovies.length} / {filteredMovies.length} phim (Trang {currentPage}/{totalPages})
        </div>
      </div>
      </div>

      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1c23', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{isEditMode ? 'Chỉnh Sửa Phim' : 'Thêm Phim Mới'}</h3>
              <button onClick={() => { setIsAddModalOpen(false); setIsEditMode(false); setEditId(null); }} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><X size={24} /></button>
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
                {isEditMode && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '14px', cursor: 'pointer', marginBottom: formData.hasAd ? '15px' : '0' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.hasAd} 
                        onChange={e => setFormData({...formData, hasAd: e.target.checked, adId: ''})}
                        style={{ width: '16px', height: '16px', accentColor: '#3498db' }}
                      />
                      Có gắn quảng cáo
                    </label>
                    {formData.hasAd && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Chọn đối tác quảng cáo</label>
                        <select 
                          value={formData.adId} 
                          onChange={e => setFormData({...formData, adId: e.target.value})}
                          style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', appearance: 'auto' }}
                          required={formData.hasAd}
                        >
                          <option value="" style={{ background: '#1a1c23', color: '#fff' }}>-- Chọn mã đối tác --</option>
                          {ads.map(ad => (
                            <option key={ad.adId} value={ad.adId} style={{ background: '#1a1c23', color: '#fff' }}>
                              {ad.partnerName ? `${ad.partnerName} - Chiến dịch ${ad.adId}` : `Đối tác ${ad.partnerId} - QC ${ad.adId}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px' }}>
                  <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditMode(false); setEditId(null); }} className="admin-btn-secondary">
                    Hủy
                  </button>
                  <button type="submit" className="admin-btn-primary">
                    {isEditMode ? 'Cập nhật' : 'Lưu Phim Mới'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {isDeleteModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1c23', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#fff' }}>Xác nhận xóa phim</h3>
            <p style={{ color: '#a0a0a0', marginBottom: '25px', fontSize: '14px' }}>
              Bạn có chắc chắn muốn xóa/ẩn phim này khỏi hệ thống không? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button onClick={() => { setIsDeleteModalOpen(false); setDeleteId(null); }} className="admin-btn-secondary">
                Hủy
              </button>
              <button onClick={confirmDelete} className="admin-btn-primary" style={{ backgroundColor: '#ff4757' }}>
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminMovies;
