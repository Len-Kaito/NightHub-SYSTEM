import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { useUser } from '../../context/UserContext';

const ChatBubble = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isChatOpen, setIsChatOpen, isBubbleEnabled } = useChat();
    const { isLoggedIn, activeProfileId } = useUser();
    
    // Hide on specific routes
    const hiddenRoutes = ['/login', '/register', '/switch-profile', '/choose-genre', '/forgot-password', '/admin'];
    const isHidden = hiddenRoutes.some(route => location.pathname.includes(route));

    // Chat state
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    // Drag state
    const [position, setPosition] = useState({ x: window.innerWidth - 90, y: window.innerHeight - 90 });
    const [isDragging, setIsDragging] = useState(false); // chỉ dùng cho cursor style
    const hasDraggedRef = useRef(false); // ref để đọc đồng bộ trong event listener
    const dragRef = useRef({ startX: 0, startY: 0, currentX: window.innerWidth - 90, currentY: window.innerHeight - 90 });
    const wrapperRef = useRef(null);
    const windowRef = useRef(null);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => {
                const newX = Math.min(prev.x, window.innerWidth - 60);
                const newY = Math.min(prev.y, window.innerHeight - 60);
                dragRef.current.currentX = newX;
                dragRef.current.currentY = newY;
                return { x: newX, y: newY };
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isChatOpen) {
            scrollToBottom();
        }
    }, [messages, isChatOpen]);

    const [isTyping, setIsTyping] = useState(false);
    const [suggestions, setSuggestions] = useState([
        'Tìm phim hành động', 'Cách hủy gói VIP', 'Chi tiết về hỗ trợ kỹ thuật'
    ]);

    // Fetch chat history
    useEffect(() => {
        if (isLoggedIn && activeProfileId) {
            fetch(`/api/chat/${activeProfileId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.length === 0) {
                        setMessages([{ text: 'Xin chào! 👋 Mình là trợ lý ảo của Nighthub. Mình có thể giúp gì cho bạn hôm nay?', sender: 'bot' }]);
                    } else {
                        setMessages(data);
                    }
                })
                .catch(err => console.error('Lỗi khi lấy lịch sử chat:', err));
        }
    }, [isLoggedIn, activeProfileId]);

    const handleSend = async (textToSend) => {
        const text = typeof textToSend === 'string' ? textToSend : inputValue;
        if (!text.trim() || !activeProfileId) return;
        
        const newMessages = [...messages, { text, sender: 'user' }];
        setMessages(newMessages);
        setInputValue('');
        setSuggestions([]);
        setIsTyping(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId: activeProfileId, text })
            });
            const data = await res.json();
            setMessages(prev => [...prev, data]);
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
            setMessages(prev => [...prev, { text: 'Xin lỗi, đã có lỗi kết nối xảy ra.', sender: 'bot' }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Drag handlers
    const handlePointerDown = (e) => {
        // Don't drag if clicking inside chat window, only FAB
        if (isChatOpen && e.target.closest('.chat-window')) return;
        
        // Reset drag tracking mỗi lần nhấn
        hasDraggedRef.current = false;
        setIsDragging(false);
        dragRef.current.startX = e.clientX - dragRef.current.currentX;
        dragRef.current.startY = e.clientY - dragRef.current.currentY;
        
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
    };

    const handlePointerMove = (e) => {
        // Đánh dấu đã kéo bằng ref (đọc được đồng bộ trong handlePointerUp)
        hasDraggedRef.current = true;
        setIsDragging(true); // chỉ dùng cho cursor style

        let newX = e.clientX - dragRef.current.startX;
        let newY = e.clientY - dragRef.current.startY;

        // Boundary check
        newX = Math.max(0, Math.min(newX, window.innerWidth - 60));
        newY = Math.max(0, Math.min(newY, window.innerHeight - 60));

        dragRef.current.currentX = newX;
        dragRef.current.currentY = newY;
        setPosition({ x: newX, y: newY });

        // Calculate dynamic origin for chat window based on position
        if (windowRef.current) {
            if (newX < 320) {
                windowRef.current.style.right = 'auto';
                windowRef.current.style.left = '0';
                windowRef.current.style.transformOrigin = 'bottom left';
            } else {
                windowRef.current.style.right = '0';
                windowRef.current.style.left = 'auto';
                windowRef.current.style.transformOrigin = 'bottom right';
            }

            if (newY < window.innerHeight / 3) {
                windowRef.current.style.bottom = 'auto';
                windowRef.current.style.top = '75px';
                if (windowRef.current.style.transformOrigin.includes('left')) {
                    windowRef.current.style.transformOrigin = 'top left';
                } else {
                    windowRef.current.style.transformOrigin = 'top right';
                }
            } else {
                windowRef.current.style.bottom = '75px';
                windowRef.current.style.top = 'auto';
            }
        }
    };

    const handlePointerUp = (e) => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        
        // Đọc ref thay vì state — luôn có giá trị mới nhất
        const wasDragging = hasDraggedRef.current;
        hasDraggedRef.current = false;
        setIsDragging(false);

        // Chỉ toggle chat nếu là click thuần (không kéo)
        if (!wasDragging && !e.target.closest('.chat-window')) {
            setIsChatOpen(prev => !prev);
        }
    };

    const renderBotText = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            // Bold: **text**
            let parsed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Italic: *text*
            parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
            // Bullet: - item or * item
            if (/^[\-\*]\s/.test(parsed)) {
                parsed = '• ' + parsed.slice(2);
            }
            return <p key={i} dangerouslySetInnerHTML={{ __html: parsed }} />;
        });
    };

    if (isHidden || !isBubbleEnabled || !isLoggedIn) return null;

    return (
        <div 
            className="chat-widget-wrapper" 
            ref={wrapperRef}
            style={{ 
                left: position.x, 
                top: position.y,
                bottom: 'auto',
                right: 'auto',
                cursor: isDragging ? 'grabbing' : 'auto'
            }}
        >
            <div 
                className={`chat-window ${isChatOpen ? 'active' : ''}`} 
                ref={windowRef}
                onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when interacting with window
            >
                <div className="chat-header">
                    <h4>
                        <img src="/images/chatbot.png" alt="Bot" className="chat-header-avatar" />
                        NightBot
                    </h4>
                    <button className="close-chat-btn" onClick={() => setIsChatOpen(false)}>✖</button>
                </div>
                <div className="chat-body">
                    {messages.map((msg, idx) => (
                        <div key={msg.id || idx} className={`chat-msg-wrapper ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                            <div className={`chat-msg ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                                {msg.sender === 'bot' ? renderBotText(msg.text) : msg.text}
                                
                                {msg.suggestions && msg.suggestions.length > 0 && (
                                    <div className="chat-movie-suggestions">
                                        {msg.suggestions.map((s, i) => (
                                            <div key={i} className="chat-movie-card" onClick={() => navigate(`/movie/${s.id}`)}>
                                                <img src={s.poster || '/images/default_poster.jpg'} alt={s.title} />
                                                <div className="chat-movie-info">
                                                    <span className="chat-movie-title">{s.title}</span>
                                                    <span className="chat-movie-badge">
                                                        {s.requiredPlan === 'VIP' ? 'VIP' : 'Miễn phí'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="chat-msg-wrapper bot">
                            <div className="chat-msg bot typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                {suggestions.length > 0 && (
                    <div className="chat-suggestions">
                        {suggestions.map((sug, idx) => (
                            <button key={idx} className="suggestion-chip" onClick={() => handleSend(sug)}>
                                {sug}
                            </button>
                        ))}
                    </div>
                )}

                <div className="chat-input-wrapper">
                    <div className="chat-input-area">
                        <input 
                            type="text" 
                            placeholder="Nhập tin nhắn..." 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && inputValue.trim() && handleSend()}
                        />
                        <button className="chat-send-btn" onClick={handleSend} disabled={!inputValue.trim()}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                        </button>
                    </div>
                    <div className="chat-disclaimer">NightBot là AI và có thể mắc sai sót.</div>
                </div>
            </div>

            <div 
                className="chat-fab" 
                title="Hỗ trợ trực tuyến"
                onPointerDown={handlePointerDown}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                <img src="/images/chatbot.png" alt="Chatbot Icon" draggable={false} />
            </div>
        </div>
    );
};

export default ChatBubble;
