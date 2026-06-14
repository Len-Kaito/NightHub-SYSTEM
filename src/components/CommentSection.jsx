import React, { useState, useRef, useEffect } from 'react';
import { useContent } from '../context/ContentContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import UserProfileModal from './UserProfileModal';
import UserHoverPopover from './UserHoverPopover';

import { reviewService } from '../services/api';

const DEFAULT_AVATAR = 'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/9rdo8k24_asset24x.webp';

const CommentSection = ({ movieId, limit }) => {
  const { profiles, activeProfileId } = useUser();
  const { showToast } = useToast();
  const currentUser = profiles?.find(p => p.id === activeProfileId) || profiles?.[0] || null;

  const [allComments, setAllComments] = useState([]);

  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(5);
  const [likedComments, setLikedComments] = useState(new Set());
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [profileModal, setProfileModal] = useState({ isOpen: false, authorName: '' });
  const [reportingTo, setReportingTo] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [hoveredUser, setHoveredUser] = useState(null);
  const menuRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const commentsList = limit ? allComments.slice(0, limit) : allComments;
  const totalCommentsCount = allComments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  // Fetch comments from backend
  const fetchComments = async () => {
    try {
      const data = await reviewService.getReviews(movieId);
      setAllComments(data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [movieId]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasRated = currentUser ? allComments.some(c => c.author === currentUser.name && c.rating != null) : false;

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser) {
      showToast('Vui lòng đăng nhập để bình luận');
      return;
    }
    try {
      const finalRating = hasRated ? null : rating;
      await reviewService.addReview(movieId, currentUser.id, commentText.trim(), finalRating);
      showToast('Đã đăng bình luận! (Nếu vi phạm tiêu chuẩn, bình luận có thể bị ẩn để chờ duyệt)');
      setCommentText('');
      setRating(5); // Reset đánh giá về 5
      fetchComments(); // Refresh danh sách sau khi đăng
    } catch (err) {
      showToast(err.message || 'Lỗi khi đăng bình luận');
    }
  };

  const handleLike = (commentId) => {
    setLikedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleReplySubmit = (commentId) => {
    const text = (replyTexts[commentId] || '').trim();
    if (!text) return;
    const newReply = {
      id: Date.now().toString(),
      author: currentUser?.name || 'Ẩn danh',
      avatar: currentUser?.avatarUrl || DEFAULT_AVATAR,
      text,
      time: 'Vừa xong',
      likes: 0,
    };
    addReply(movieId, commentId, newReply);
    setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
    setReplyingTo(null);
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) return showToast('Vui lòng đăng nhập.');
    try {
      await reviewService.deleteReview(movieId, commentId, currentUser.id);
      showToast('Đã xóa bình luận.');
      setOpenMenuId(null);
      fetchComments(); // Reload comments
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa bình luận.');
    }
  };

  const handleDeleteReply = (commentId, replyId) => {
    // deleteReply(movieId, commentId, replyId);
    setOpenMenuId(null);
    showToast('Tính năng xóa phản hồi đang được cập nhật.');
  };

  const handleReport = (commentId, authorName) => {
    setOpenMenuId(null);
    if (!currentUser) return showToast('Vui lòng đăng nhập.');
    setReportingTo({ id: commentId, author: authorName });
    setReportReason('');
  };

  const submitReport = async () => {
    if (!reportReason.trim() || !reportingTo) return;
    try {
      await reviewService.reportReview(movieId, reportingTo.id, currentUser.id, reportReason.trim());
      showToast(`Đã gửi báo cáo vi phạm bình luận của ${reportingTo.author}. Cảm ơn bạn!`);
      setReportingTo(null);
      setReportReason('');
    } catch (err) {
      showToast(err.message || 'Lỗi khi gửi báo cáo.');
    }
  };

  const isOwnComment = (authorName) => {
    return currentUser?.name === authorName;
  };

  const openProfile = (authorName) => {
    // Don't open profile for yourself
    if (isOwnComment(authorName)) return;
    setHoveredUser(null); // Hide popover when opening modal
    setProfileModal({ isOpen: true, authorName });
  };

  const handleMouseEnter = (e, authorName) => {
    if (isOwnComment(authorName)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + window.scrollX;
    const y = rect.bottom + window.scrollY + 5;
    
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredUser({ name: authorName, x, y });
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredUser(null);
    }, 200);
  };

  // Three-dot menu icon
  const MoreIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none">
      <circle cx="12" cy="5" r="2"></circle>
      <circle cx="12" cy="12" r="2"></circle>
      <circle cx="12" cy="19" r="2"></circle>
    </svg>
  );

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr === 'Vừa xong') return timeStr;
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      
      const now = new Date();
      const diffInSeconds = Math.floor((now - d) / 1000);
      
      if (diffInSeconds < 60) return 'Vừa xong';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
      
      return d.toLocaleDateString('vi-VN');
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="comment-box">
      <h3>Bình luận ({totalCommentsCount})</h3>
      
      <div className="comment-input-area">
        <img
          src={currentUser?.avatarUrl || DEFAULT_AVATAR}
          alt="Avatar"
          className="comment-avatar"
        />
        <div className="input-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!hasRated && (
            <div className="rating-selector" style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '4px' }}>
              <span style={{ fontSize: '0.9rem', color: '#ccc', marginRight: '8px' }}>Đánh giá của bạn:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <svg 
                  key={star}
                  onClick={() => setRating(star)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', fill: star <= rating ? '#FFD700' : '#444' }} 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <textarea
              className="comment-input"
              placeholder="Bạn nghĩ gì về phim này?"
              value={commentText}
              rows={2}
              style={{ flex: 1 }}
              onChange={e => setCommentText(e.target.value)}
            ></textarea>
            <button
              className="btn-submit"
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              style={{ alignSelf: 'flex-start' }}
            >Đăng</button>
          </div>
        </div>
      </div>

      <div className="comment-list">
        {commentsList.map((c) => {
          const isLiked = likedComments.has(c.id);
          const currentLikes = c.likes + (isLiked ? 1 : 0);
          const isOwn = isOwnComment(c.author);
          
          return (
            <div key={c.id} className="comment-item">
              <img
                src={c.avatar || DEFAULT_AVATAR}
                alt="Avatar"
                className={`comment-avatar ${!isOwn ? 'clickable' : ''}`}
                onClick={() => openProfile(c.author)}
                onMouseEnter={(e) => handleMouseEnter(e, c.author)}
                onMouseLeave={handleMouseLeave}
                title={!isOwn ? `Xem hồ sơ ${c.author}` : ''}
              />
              <div className="comment-content">
                <div className="comment-header">
                  <span
                    className={`comment-author ${!isOwn ? 'clickable' : ''}`}
                    onClick={() => openProfile(c.author)}
                    onMouseEnter={(e) => handleMouseEnter(e, c.author)}
                    onMouseLeave={handleMouseLeave}
                  >{c.author || c.user || c.name || 'Ẩn danh'}</span>
                  <div className="comment-header-right">
                    <span className="comment-time">{formatTime(c.time)}</span>
                    <div className="comment-menu-wrapper" ref={openMenuId === c.id ? menuRef : null}>
                      <button className="comment-menu-btn" onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}>
                        <MoreIcon />
                      </button>
                      {openMenuId === c.id && (
                        <div className="comment-menu-dropdown">
                          {isOwn ? (
                            <button className="btn-delete" onClick={() => handleDeleteComment(c.id)}>
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              Xóa bình luận
                            </button>
                          ) : (
                            <button className="btn-report" onClick={() => handleReport(c.id, c.author)}>
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                              Báo cáo vi phạm
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="comment-text">{c.text}</div>
                <div className="comment-actions">
                  <button
                    className={isLiked ? 'liked' : ''}
                    onClick={() => handleLike(c.id)}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14"
                      fill={isLiked ? 'currentColor' : 'none'}
                      stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                    {currentLikes}
                  </button>
                  <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    Phản hồi
                  </button>
                </div>

                {replyingTo === c.id && (
                  <div className="reply-input-area">
                    <img src={currentUser?.avatarUrl || DEFAULT_AVATAR} alt="avatar" className="reply-avatar" />
                    <div className="reply-wrapper">
                      <textarea
                        className="reply-input"
                        placeholder={`Phản hồi ${c.author || 'bình luận này'}...`}
                        value={replyTexts[c.id] || ''}
                        onChange={e => setReplyTexts(prev => ({...prev, [c.id]: e.target.value}))}
                        rows={2}
                      />
                      <div className="reply-actions">
                        <button className="btn-cancel" onClick={() => setReplyingTo(null)}>Hủy</button>
                        <button
                          className="btn-submit-reply"
                          disabled={!(replyTexts[c.id] || '').trim()}
                          onClick={() => handleReplySubmit(c.id)}
                        >Đăng bình luận</button>
                      </div>
                    </div>
                  </div>
                )}

                {reportingTo?.id === c.id && (
                  <div className="reply-input-area" style={{ marginTop: '10px' }}>
                    <img src={currentUser?.avatarUrl || DEFAULT_AVATAR} alt="avatar" className="reply-avatar" />
                    <div className="reply-wrapper" style={{ width: '100%' }}>
                      <textarea
                        className="reply-input"
                        placeholder={`Nhập lý do báo cáo bình luận của ${reportingTo.author}...`}
                        value={reportReason}
                        onChange={e => setReportReason(e.target.value)}
                        rows={2}
                        style={{ border: '1px solid #ff3b30' }}
                      />
                      <div className="reply-actions">
                        <button className="btn-cancel" onClick={() => setReportingTo(null)}>Hủy</button>
                        <button
                          className="btn-submit-reply"
                          style={{ background: '#ff3b30' }}
                          disabled={!reportReason.trim()}
                          onClick={submitReport}
                        >Gửi báo cáo</button>
                      </div>
                    </div>
                  </div>
                )}

                {(c.replies && c.replies.length > 0) && (
                  <div className="replies-list">
                    {c.replies.map((r) => {
                      const isOwnReply = isOwnComment(r.author);
                      return (
                        <React.Fragment key={r.id || Date.now() + Math.random()}>
                          <div className="reply-item">
                            <img
                              src={r.avatar || DEFAULT_AVATAR}
                              alt="avatar"
                              className={`reply-avatar ${!isOwnReply ? 'clickable' : ''}`}
                              onClick={() => openProfile(r.author)}
                              onMouseEnter={(e) => handleMouseEnter(e, r.author)}
                              onMouseLeave={handleMouseLeave}
                            />
                            <div className="reply-content">
                              <div className="reply-header">
                                <span
                                  className={`reply-author ${!isOwnReply ? 'clickable' : ''}`}
                                  onClick={() => openProfile(r.author)}
                                  onMouseEnter={(e) => handleMouseEnter(e, r.author)}
                                  onMouseLeave={handleMouseLeave}
                                >{r.author}</span>
                                <div className="comment-header-right">
                                  <span className="comment-time">{formatTime(r.time)}</span>
                                  <div className="comment-menu-wrapper" ref={openMenuId === `reply-${r.id}` ? menuRef : null}>
                                    <button className="comment-menu-btn" onClick={() => setOpenMenuId(openMenuId === `reply-${r.id}` ? null : `reply-${r.id}`)}>
                                      <MoreIcon />
                                    </button>
                                    {openMenuId === `reply-${r.id}` && (
                                      <div className="comment-menu-dropdown">
                                        {isOwnReply ? (
                                          <button className="btn-delete" onClick={() => handleDeleteReply(c.id, r.id)}>
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            Xóa phản hồi
                                          </button>
                                        ) : (
                                          <button className="btn-report" onClick={() => handleReport(r.id, r.author)}>
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                                            Báo cáo vi phạm
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="comment-text">{r.text}</div>
                            </div>
                          </div>
                          {reportingTo?.id === r.id && (
                            <div className="reply-input-area" style={{ marginTop: '5px', paddingLeft: '40px' }}>
                              <img src={currentUser?.avatarUrl || DEFAULT_AVATAR} alt="avatar" className="reply-avatar" style={{ width: '28px', height: '28px' }} />
                              <div className="reply-wrapper" style={{ width: '100%' }}>
                                <textarea
                                  className="reply-input"
                                  placeholder={`Nhập lý do báo cáo bình luận của ${reportingTo.author}...`}
                                  value={reportReason}
                                  onChange={e => setReportReason(e.target.value)}
                                  rows={2}
                                  style={{ border: '1px solid #ff3b30' }}
                                />
                                <div className="reply-actions">
                                  <button className="btn-cancel" onClick={() => setReportingTo(null)}>Hủy</button>
                                  <button
                                    className="btn-submit-reply"
                                    style={{ background: '#ff3b30' }}
                                    disabled={!reportReason.trim()}
                                    onClick={submitReport}
                                  >Gửi báo cáo</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <UserProfileModal
        isOpen={profileModal.isOpen}
        onClose={() => setProfileModal({ isOpen: false, authorName: '' })}
        authorName={profileModal.authorName}
      />

      {hoveredUser && (
        <UserHoverPopover 
          authorName={hoveredUser.name} 
          x={hoveredUser.x} 
          y={hoveredUser.y} 
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        />
      )}
    </div>
  );
};

export default CommentSection;
