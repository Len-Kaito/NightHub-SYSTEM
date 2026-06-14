import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { useUser } from '../context/UserContext';
import { movieService, watchHistoryService } from '../services/api';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FilterModal from '../components/FilterModal';
import MovieCardVertical from '../components/MovieCardVertical';
import CommentSection from '../components/CommentSection';
import { formatDurationVN } from '../utils/format';

// ─── SVG Icons ───────────────────────────────────────
const IconPlay = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const IconBookmark = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>;

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { movies, addToMyList, removeFromMyList, isInMyList } = useContent();
  const { isLoggedIn, activeProfileId } = useUser();
  const { showToast } = useToast();
  const [isFilterActive, setIsFilterActive] = useState(false);
  
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trailers');
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    
    const fetchDetail = async () => {
      try {
        const normalizedId = id.replace('m_', '');
        const dbMovie = await movieService.getMovieById(normalizedId);
        
        // Trộn với dữ liệu từ context (nếu có) để mượn các thuộc tính UI (badges...)
        const mockMatch = movies.find(m => m.id === id) || {};
        
        const mergedMovie = {
          ...mockMatch,
          ...dbMovie, // Dữ liệu từ DB ghi đè
          id: id,
          cast: dbMovie.cast || mockMatch.cast || [],
          director: dbMovie.director || mockMatch.director || 'Đang cập nhật',
          videos: dbMovie.videos && dbMovie.videos.length > 0 ? dbMovie.videos : mockMatch.videos,
          tags: dbMovie.tags && dbMovie.tags.length > 0 ? dbMovie.tags : mockMatch.tags,
          genres: dbMovie.genres && dbMovie.genres.length > 0 ? dbMovie.genres : mockMatch.genres
        };
        
        setMovie(mergedMovie);
        if (mergedMovie.type === 'tvShow' || (mergedMovie.videos && mergedMovie.videos.length > 1)) {
          setActiveTab('episodes');
        } else {
          setActiveTab('trailers');
        }
      } catch (err) {
        console.error('Lỗi khi lấy chi tiết phim:', err);
        // Fallback về dữ liệu context nếu API lỗi
        const mockMatch = movies.find(m => m.id === id);
        if (mockMatch) {
          setMovie(mockMatch);
          if (mockMatch.type === 'tvShow' || (mockMatch.videos && mockMatch.videos.length > 1)) {
            setActiveTab('episodes');
          } else {
            setActiveTab('trailers');
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Nếu movies đã có sẵn từ Context (như một bộ đệm), ta gọi API lấy chi tiết
    if (movies.length > 0) {
      fetchDetail();
    }
  }, [id, movies]);

  if (loading) {
    return (
      <>
        <Navbar onToggleFilter={() => setIsFilterActive(!isFilterActive)} />
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          Đang tải thông tin phim...
        </div>
        <Footer />
      </>
    );
  }

  if (!movie) {
    return (
      <>
        <Navbar onToggleFilter={() => setIsFilterActive(!isFilterActive)} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '150px 20px', textAlign: 'center', gap: '20px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', maxWidth: '480px', lineHeight: 1.4 }}>
            Rất tiếc, bộ phim bạn tìm kiếm không tồn tại hoặc đã bị gỡ.
          </h2>
          <button onClick={() => navigate('/')} className="btn btn-play" style={{ border: 'none' }}>Quay về Trang chủ</button>
        </div>
        <Footer />
      </>
    );
  }

  const isSaved = isInMyList(movie.id);
  const toggleBookmark = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (isSaved) removeFromMyList(movie.id);
    else addToMyList(movie.id);
  };

  const isMovieSeries = movie.type === 'tvShow' || (movie.videos && movie.videos.length > 1);

  const handleEpisodeClick = async (video) => {
    if (!isLoggedIn) return navigate('/login');
    // Nếu tập phim là VIP → gọi API recordPlay để kích hoạt Trigger kiểm tra quyền
    if (video.requiredPlan === 'VIP') {
      if (!activeProfileId) return showToast('Vui lòng chọn hồ sơ trước khi xem.');
      try {
        await watchHistoryService.recordPlay(activeProfileId, video.id, 0);
      } catch (err) {
        return showToast(err.message || 'Nội dung này yêu cầu gói VIP.');
      }
    }
    navigate(`/watch/${movie.id}?ep=${video.episodeNumber}`);
  };

  const handleMainPlayClick = async () => {
    if (!isLoggedIn) return navigate('/login');
    const firstVideo = movie.videos?.[0];
    // Phim bộ → luôn vào Tập 1
    if (isMovieSeries && firstVideo) {
      if (firstVideo.requiredPlan === 'VIP') {
        if (!activeProfileId) return showToast('Vui lòng chọn hồ sơ trước khi xem.');
        try {
          await watchHistoryService.recordPlay(activeProfileId, firstVideo.id, 0);
        } catch (err) {
          return showToast(err.message || 'Nội dung này yêu cầu gói VIP.');
        }
      }
      navigate(`/watch/${movie.id}?ep=1`);
    } else if (firstVideo) {
      // Phim lẻ
      if (firstVideo.requiredPlan === 'VIP') {
        if (!activeProfileId) return showToast('Vui lòng chọn hồ sơ trước khi xem.');
        try {
          await watchHistoryService.recordPlay(activeProfileId, firstVideo.id, 0);
        } catch (err) {
          return showToast(err.message || 'Nội dung này yêu cầu gói VIP.');
        }
      }
      navigate(`/watch/${movie.id}`);
    } else {
      navigate(`/watch/${movie.id}`);
    }
  };

  // Gợi ý phim liên quan
  const relatedMovies = movies
    .filter(m => m.id !== movie.id && (
      m.genres?.some(g => movie.genres?.includes(g))
    ))
    .slice(0, 5);

  const posterBg = movie.poster || '/images/poster_1.jpeg';

  return (
    <>
      <Navbar onToggleFilter={() => setIsFilterActive(!isFilterActive)} />
      <FilterModal isActive={isFilterActive} onToggle={() => setIsFilterActive(!isFilterActive)} />

      <div className="detail-wrapper horizontal-poster">
        <div className="detail-bg" style={{ backgroundImage: `url('${posterBg}')`, backgroundPosition: 'center 20%' }}></div>

        <div className="detail-content">
          <h1 className="detail-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {movie.title}
            {movie.videos?.[0]?.requiredPlan === 'VIP' && (
              <span style={{ 
                padding: '2px 8px', 
                background: 'linear-gradient(135deg, #FFD700, #FDB931)', 
                color: '#000', 
                fontSize: '14px', 
                borderRadius: '4px', 
                fontWeight: 'bold',
                textShadow: 'none',
                whiteSpace: 'nowrap'
              }}>VIP</span>
            )}
          </h1>

          <div className="detail-meta">
            {movie.year && <><span className="meta-item">{movie.year}</span><span className="meta-separator">&middot;</span></>}
            {movie.country && <><span className="meta-item">{movie.country}</span><span className="meta-separator">&middot;</span></>}
            {movie.format && <><span className="meta-item">{movie.format}</span><span className="meta-separator">&middot;</span></>}
            {movie.totalEpisodes && <><span className="meta-item">{movie.totalEpisodes} Tập</span><span className="meta-separator">&middot;</span></>}
            {movie.rating >= 0 && (
              <span className="meta-item meta-rating" style={{ display: 'inline-flex', alignItems: 'center' }}>
                {Number(movie.rating > 0 ? movie.rating : 5).toFixed(1)}/5.0
                <svg className="star-icon" style={{ marginLeft: '4px', fill: '#FFD700', width: '16px', height: '16px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
              </span>
            )}
          </div>

          <div className="hero-buttons" style={{ marginTop: '20px' }}>
            <button onClick={handleMainPlayClick} className="btn btn-play" style={{ border: 'none' }}>
              <IconPlay /> Xem phim
            </button>
            <button
              className={`btn btn-info ${isSaved ? 'bookmarked' : ''}`}
              title={isSaved ? 'Bỏ lưu' : 'Lưu phim'}
              onClick={toggleBookmark}
            >
              <IconBookmark /> {isSaved ? 'Đã lưu' : 'Lưu phim'}
            </button>
          </div>

          <p className="detail-desc">
            {movie.description || 'Chưa có mô tả cho bộ phim này.'}
          </p>

          <div className="detail-cast">
            {movie.tags?.filter(t => !['K', 'P', 'T13', 'T16', 'T18'].includes(t.name?.toUpperCase())).length > 0 && (
              <p><span>Thể loại:</span> {movie.tags.filter(t => !['K', 'P', 'T13', 'T16', 'T18'].includes(t.name?.toUpperCase())).map(t => t.name).join(', ')}</p>
            )}
            <p><span>Đạo diễn:</span> {movie.director || 'Đang cập nhật'}</p>
            <p><span>Diễn viên:</span> {movie.cast?.length > 0 ? movie.cast.join(', ') : 'Đang cập nhật'}</p>
          </div>

          {/* TABS */}
          <div className="tabs-wrapper">
            <div className="tab-headers">
              {isMovieSeries && (
                <button className={`tab-btn ${activeTab === 'episodes' ? 'active' : ''}`} onClick={() => setActiveTab('episodes')}>Tập phim</button>
              )}
              <button className={`tab-btn ${activeTab === 'trailers' ? 'active' : ''}`} onClick={() => setActiveTab('trailers')}>Trailer</button>
              <button className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>Bình luận</button>
            </div>

            <div className="tab-content">
              {/* TAB TẬP PHIM */}
              {isMovieSeries && activeTab === 'episodes' && (
                <div className="tab-pane active">
                  <div className="episode-list">
                    {movie.videos?.map((video) => (
                      <div key={video.id} className="episode-item" onClick={() => handleEpisodeClick(video)}>
                        <img src={posterBg} alt={`Ep ${video.episodeNumber}`} className="ep-img" onError={e => { e.target.src = '/images/poster_1.jpeg'; }} />
                        <div className="ep-info">
                          <div className="ep-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Tập {video.episodeNumber}
                            {video.requiredPlan === 'VIP' && (
                              <span style={{ 
                                padding: '2px 6px', 
                                background: 'linear-gradient(135deg, #FFD700, #FDB931)', 
                                color: '#000', 
                                fontSize: '10px', 
                                borderRadius: '3px', 
                                fontWeight: 'bold' 
                              }}>VIP</span>
                            )}
                          </div>
                          <div className="ep-duration">{formatDurationVN(video.duration)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB TRAILERS */}
              {activeTab === 'trailers' && (
                <div className="tab-pane active">
                  <div className="trailer-section" style={{ marginBottom: 0 }}>
                    <div className="trailer-list">
                      <div className="trailer-item" onClick={() => setIsTrailerOpen(true)} style={{ cursor: 'pointer' }}>
                        <img src={posterBg} alt="Trailer" onError={e => { e.target.src = '/images/poster_1.jpeg'; }} />
                        <div className="trailer-play">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB BÌNH LUẬN */}
              {activeTab === 'comments' && (
                <div className="tab-pane active">
                  <CommentSection movieId={movie.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="movie-sections">
        <h3 className="row-title">Phim liên quan</h3>
        <div className="slider-wrapper">
          <div className="card-grid">
            {relatedMovies.length > 0 ? relatedMovies.map((m) => (
              <MovieCardVertical key={m.id} movie={m} showMatch={true} />
            )) : (
              <p style={{ color: 'var(--text-muted)', padding: '20px 0' }}>Không có phim liên quan.</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
      
      {isTrailerOpen && (
        <div className="trailer-modal-overlay" onClick={() => setIsTrailerOpen(false)}>
          <div className="trailer-modal-content" onClick={e => e.stopPropagation()}>
            <button className="trailer-close-btn" onClick={() => setIsTrailerOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <video 
              src={"/video/videoplayback.mp4"} 
              controls 
              autoPlay 
              disablePictureInPicture
              controlsList="nodownload noplaybackrate"
              className="trailer-video-player"
            ></video>
          </div>
        </div>
      )}
    </>
  );
};

export default MovieDetail;
