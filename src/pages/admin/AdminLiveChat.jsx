import React, { useState, useEffect, useRef } from 'react';
import { MessageSquareText, Send, User, Bot, Headset, Clock, Search } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

import { useUser } from '../../context/UserContext';

const AdminLiveChat = () => {
  const { showToast } = useToast();
  const { user } = useUser();
  
  // Real Role & Staff ID from User Context
  const role = user?.role === 'CC' ? 'CC' : 'SYS_ADMIN'; 
  const staffId = user?.id || '';
  
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all chat sessions periodically
  const fetchSessions = () => {
    fetch(`/api/admin/chat-sessions?role=${role}&staffId=${staffId}`)
      .then(res => res.json())
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  // Fetch messages for active session periodically
  const fetchMessages = () => {
    if (!activeSession) return;
    fetch(`/api/admin/chat-sessions/${activeSession.sessionId}/messages`)
      .then(res => res.json())
      .then(data => setMessages(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  // Polling mechanism
  useEffect(() => {
    fetchSessions();
    const intervalId = setInterval(fetchSessions, 5000);
    return () => clearInterval(intervalId);
  }, [role, staffId]);

  useEffect(() => {
    if (activeSession) {
      fetchMessages();
      const intervalId = setInterval(fetchMessages, 3000);
      return () => clearInterval(intervalId);
    } else {
      setMessages([]);
    }
  }, [activeSession]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeSession) return;

    const content = inputMessage.trim();
    setInputMessage(''); // clear early for better UX

    // Optimistically add to UI
    const tempMsg = {
      messageId: Date.now(),
      content: content,
      sender: 'CC',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch(`/api/admin/chat-sessions/${activeSession.sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, staffId })
      });
      if (res.ok) {
        fetchMessages(); // Refresh to get correct ID and timestamp
      } else {
        showToast('Lỗi gửi tin nhắn', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi kết nối', true);
    }
  };

  const assignToMe = async () => {
    if (!activeSession) return;
    try {
      const res = await fetch(`/api/admin/chat-sessions/${activeSession.sessionId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId })
      });
      if (res.ok) {
        showToast('Đã nhận hỗ trợ phiên chat này!');
        fetchSessions();
        setActiveSession(prev => ({ ...prev, staffId: staffId }));
      } else {
        showToast('Không thể nhận phiên', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi kết nối', true);
    }
  };

  return (
    <div className="admin-chat animate-fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontWeight: 600, margin: 0 }}>Live Chat CSKH</h2>
        
        {/* Development tools: Removed */}
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar - Danh sách phiên chat */}
        <div className="admin-card" style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquareText size={18} color="#1e90ff" /> Phiên Chat
            </h3>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {sessions.map(session => (
              <div 
                key={session.sessionId}
                onClick={() => setActiveSession(session)}
                style={{ 
                  padding: '15px', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)', 
                  cursor: 'pointer',
                  background: activeSession?.sessionId === session.sessionId ? 'rgba(30, 144, 255, 0.1)' : 'transparent',
                  borderLeft: activeSession?.sessionId === session.sessionId ? '3px solid #1e90ff' : '3px solid transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <strong style={{ color: '#fff' }}>Hồ sơ: {session.profileId}</strong>
                  <span style={{ fontSize: '12px', color: '#888' }}>{new Date(session.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={12} /> {session.status}
                </div>
                {session.staffId && (
                  <div style={{ fontSize: '12px', color: '#1e90ff', marginTop: '5px', fontWeight: 600 }}>
                    Phụ trách: {session.staffId}
                  </div>
                )}
              </div>
            ))}
            {sessions.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
                Không có phiên chat nào
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="admin-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {activeSession ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <User size={18} /> Hồ sơ: {activeSession.profileName || activeSession.profileId}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#888' }}>
                    Mã phiên: {activeSession.sessionId} • Trạng thái: <span style={{ color: activeSession.status === 'Đang chat' ? '#2ed573' : '#ff4757' }}>{activeSession.status}</span>
                  </div>
                </div>
                
                {/* Assignment Controls */}
                {!activeSession.staffId && role === 'SYS_ADMIN' && (
                  <button onClick={assignToMe} className="admin-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Headset size={16} /> Nhận hỗ trợ
                  </button>
                )}
                {activeSession.staffId && activeSession.staffId !== staffId && role === 'SYS_ADMIN' && (
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '4px', fontSize: '13px' }}>
                    Đang được hỗ trợ bởi: {activeSession.staffId}
                  </span>
                )}
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', background: '#111216' }}>
                {messages.map((msg, index) => {
                  const isUser = msg.sender === 'USER';
                  const isCC = msg.sender === 'CC';
                  const isAI = msg.sender === 'AI';

                  return (
                    <div key={index} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-start' : 'flex-end',
                      maxWidth: '75%',
                      alignSelf: isUser ? 'flex-start' : 'flex-end'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '5px', 
                        marginBottom: '5px', 
                        color: '#888', 
                        fontSize: '12px',
                        flexDirection: isUser ? 'row' : 'row-reverse'
                      }}>
                        {isUser && <><User size={14} /> Khách hàng</>}
                        {isCC && <><Headset size={14} color="#1e90ff" /> CSKH</>}
                        {isAI && <><Bot size={14} color="#2ed573" /> AI Bot</>}
                        <span style={{ opacity: 0.5 }}>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        background: isUser ? '#2a2d3e' : (isCC ? '#1e90ff' : 'rgba(46, 213, 115, 0.2)'),
                        color: isUser ? '#fff' : (isCC ? '#fff' : '#2ed573'),
                        borderBottomLeftRadius: isUser ? '4px' : '12px',
                        borderBottomRightRadius: !isUser ? '4px' : '12px'
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', background: '#1a1c23' }}>
                {(!activeSession.staffId || activeSession.staffId === staffId || role === 'SYS_ADMIN') ? (
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Nhập tin nhắn phản hồi..."
                      style={{ flex: 1, background: '#111216', border: '1px solid #333', color: '#fff', padding: '12px 15px', borderRadius: '8px', outline: 'none' }}
                    />
                    <button 
                      type="submit" 
                      disabled={!inputMessage.trim()}
                      className="admin-btn-primary" 
                      style={{ padding: '0 20px', borderRadius: '8px', opacity: !inputMessage.trim() ? 0.5 : 1 }}
                    >
                      <Send size={18} />
                    </button>
                  </form>
                ) : (
                  <div style={{ textAlign: 'center', color: '#888', padding: '10px' }}>
                    Phiên chat này đang được phụ trách bởi nhân viên khác.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
              <Headset size={64} style={{ marginBottom: '20px', color: '#333' }} />
              <h3>Chọn một phiên chat</h3>
              <p>Vui lòng chọn một phiên chat bên trái để bắt đầu hỗ trợ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLiveChat;
