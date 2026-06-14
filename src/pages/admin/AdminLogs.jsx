import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, CheckCircle, Info, Search, Download, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

const inputStyle = {
  background: '#2a2d35',
  color: '#fff',
  border: '1px solid #3a3d45',
  borderRadius: '8px',
  padding: '8px 12px',
  outline: 'none',
  fontSize: '14px',
};

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const limit = 15;

  const fetchLogs = (currentPage = page) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', currentPage);
    params.set('limit', limit);
    if (actionFilter) params.set('action', actionFilter);
    if (searchText.trim()) params.set('search', searchText.trim());

    fetch(`/api/admin/logs?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        let filteredLogs = data.logs || [];

        // Client-side date filtering
        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= from);
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= to);
        }

        setLogs(filteredLogs);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      })
      .catch(err => console.error('Lỗi fetch logs:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchLogs(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleResetFilters = () => {
    setSearchText('');
    setActionFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    // Fetch with no filters
    setLoading(true);
    fetch(`/api/admin/logs?page=1&limit=${limit}`)
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      })
      .catch(err => console.error('Lỗi fetch logs:', err))
      .finally(() => setLoading(false));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchLogs(newPage);
  };

  const getActionIcon = (action) => {
    if (action.includes('Lỗi') || action.includes('Khóa')) return <ShieldAlert size={16} color="#ff4757" />;
    if (action.includes('Thêm') || action.includes('Mở')) return <CheckCircle size={16} color="#2ed573" />;
    return <Info size={16} color="#1e90ff" />;
  };

  const handleExportCSV = () => {
    const headers = ['Mã Log', 'Thời gian', 'Hành động', 'Đối tượng', 'Người thực hiện', 'Ghi chú'];
    const rows = logs.map(log => [
      log.id,
      new Date(log.timestamp).toLocaleString('vi-VN'),
      log.action,
      log.target || 'Hệ thống',
      log.adminId || 'AUTO',
      log.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nhat-ky-he-thong_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-logs animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontWeight: 600 }}>Nhật ký Hệ thống (System Logs)</h2>
        <button
          className="admin-btn-primary"
          onClick={handleExportCSV}
          style={{ background: '#2ed573', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
          disabled={logs.length === 0}
        >
          <Download size={16} /> Xuất CSV
        </button>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} /> Truy vết kiểm toán nội bộ
        </h3>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input
              type="text"
              placeholder="Tìm theo hành động, ghi chú, đối tượng..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ ...inputStyle, width: '100%', paddingLeft: '34px' }}
            />
          </div>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer', minWidth: '140px' }}
          >
            <option value="">Tất cả</option>
            <option value="Đăng nhập">Đăng nhập</option>
            <option value="Thêm">Thêm</option>
            <option value="Sửa">Sửa</option>
            <option value="Xóa">Xóa</option>
            <option value="Khóa">Khóa</option>
            <option value="Mở khóa">Mở khóa</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
            title="Từ ngày"
          />

          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
            title="Đến ngày"
          />

          <button
            className="admin-btn-primary"
            onClick={handleSearch}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}
          >
            <Search size={16} /> Tìm
          </button>

          <button
            className="admin-btn-secondary"
            onClick={handleResetFilters}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}
            title="Đặt lại bộ lọc"
          >
            <RotateCcw size={16} /> Đặt lại
          </button>
        </div>

        {/* Total count */}
        <div style={{ marginBottom: '12px', color: '#aaa', fontSize: '13px' }}>
          Tổng cộng: <span style={{ color: '#fff', fontWeight: 600 }}>{total}</span> bản ghi
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
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

        {/* Empty state */}
        {!loading && logs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            Không có nhật ký nào được ghi lại.
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
            <button
              className="admin-icon-btn"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              title="Trang trước"
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ color: '#ccc', fontSize: '14px' }}>
              Trang <span style={{ color: '#fff', fontWeight: 600 }}>{page}</span> / {totalPages}
            </span>
            <button
              className="admin-icon-btn"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              title="Trang sau"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
