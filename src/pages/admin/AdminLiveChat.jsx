import React from 'react';
import { MessageSquareText } from 'lucide-react';

const AdminLiveChat = () => {
  return (
    <div className="admin-chat animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontWeight: 600 }}>Live Chat CSKH</h2>
      </div>

      <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#888' }}>
        <MessageSquareText size={64} style={{ marginBottom: '20px', color: '#1e90ff' }} />
        <h3>Khung làm việc Live Chat</h3>
        <p style={{ maxWidth: '400px', textAlign: 'center', marginTop: '10px' }}>
          Tính năng này dự kiến sẽ tích hợp WebSocket để nhân viên chăm sóc khách hàng (CSKH) 
          có thể chat trực tiếp với người dùng khi hệ thống AI Bot không thể trả lời.
        </p>
        <button style={{ marginTop: '20px', background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'not-allowed', opacity: 0.5 }}>
          Bắt đầu phiên trực
        </button>
      </div>
    </div>
  );
};

export default AdminLiveChat;
