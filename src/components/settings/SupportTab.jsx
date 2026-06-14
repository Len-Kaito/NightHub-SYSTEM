import React, { useState, useRef } from 'react';
import { useChat } from '../../context/ChatContext';

const SupportTab = ({ isActive }) => {
    const [openIndex, setOpenIndex] = useState(null);
    const [faqs, setFaqs] = useState([]);
    const [showAll, setShowAll] = useState(false);
    const { setIsChatOpen, toggleBubbleEnabled } = useChat();

    // Lấy dữ liệu FAQ từ API
    React.useEffect(() => {
        if (isActive && faqs.length === 0) {
            fetch('/api/faq')
                .then(res => res.json())
                .then(data => setFaqs(data))
                .catch(err => console.error('Lỗi khi lấy FAQ:', err));
        }
    }, [isActive, faqs.length]);

    const toggleFaq = (idx) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    const displayedFaqs = showAll ? faqs : faqs.slice(0, 5);

    return (
        <div className={`tab-pane ${isActive ? 'active' : ''}`}>
            <div className="tab-header">
                <h2 className="tab-title">Hỗ Trợ & Thông Tin</h2>
                <p className="tab-desc">Tìm câu trả lời, liên hệ CSKH và xem thông tin hệ thống.</p>
            </div>

            <div className="setting-card">
                <h3>CÂU HỎI THƯỜNG GẶP</h3>
                {displayedFaqs.map((faq, idx) => {
                    const isOpen = openIndex === idx;
                    return (
                        <div key={faq.id || idx} className="setting-row faq-row" style={{ flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer', borderBottom: idx === displayedFaqs.length - 1 ? 'none' : '1px solid var(--border-color)', padding: '15px 0' }} onClick={() => toggleFaq(idx)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <div className="setting-row-info">
                                    <h5 style={{ margin: 0 }}>{faq.question}</h5>
                                </div>
                                <div className="faq-arrow-icon" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </div>
                            </div>
                            <div 
                                style={{ 
                                    width: '100%', 
                                    maxHeight: isOpen ? '200px' : '0', 
                                    opacity: isOpen ? 1 : 0, 
                                    overflow: 'hidden', 
                                    transition: 'max-height 0.3s ease, opacity 0.3s ease',
                                    marginTop: isOpen ? '10px' : '0'
                                }}
                            >
                                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                    {faq.answer}
                                </p>
                            </div>
                        </div>
                    );
                })}
                {faqs.length > 5 && (
                    <button 
                        onClick={() => setShowAll(!showAll)}
                        style={{
                            marginTop: '15px',
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            width: '100%'
                        }}
                    >
                        {showAll ? 'Thu gọn' : 'Xem tất cả'}
                    </button>
                )}
            </div>

            <div className="setting-card">
                <h3>LIÊN HỆ</h3>
                <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                    <div onClick={() => { toggleBubbleEnabled(true); setIsChatOpen(true); }} style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
                        <img src="/images/chatbot.png" alt="Chatbot" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        <div>
                            <h5 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>Chat với bot của Nighthub</h5>
                            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>Phục vụ trực tuyến 24/7</p>
                        </div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
                        <svg viewBox="0 0 24 24" width="22" height="22" stroke="var(--text-muted)" fill="none" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        <div>
                            <h5 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>Gửi Email hỗ trợ</h5>
                            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>support@nighthub.com</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="setting-card">
                <h3>THÔNG TIN ỨNG DỤNG</h3>
                <div className="setting-row">
                    <div className="setting-row-info"><h5>Phiên bản ứng dụng hiện tại</h5></div><p style={{ color: 'var(--text-muted)' }}>v2.5.0</p>
                </div>
                <div className="setting-row">
                    <div className="setting-row-info"><h5>Điều khoản sử dụng (TOS)</h5></div><span style={{ color: 'var(--accent-color)', cursor: 'pointer' }}>Đọc điều khoản</span>
                </div>
                <div className="setting-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    <div className="setting-row-info"><h5>Chính sách bảo mật</h5></div><span style={{ color: 'var(--accent-color)', cursor: 'pointer' }}>Đọc chính sách</span>
                </div>
            </div>
        </div>
    );
};

export default SupportTab;
