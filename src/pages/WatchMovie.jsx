import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FilterModal from '../components/FilterModal';
import { useContent } from '../context/ContentContext';
import { useUser } from '../context/UserContext';
import { movieService, watchHistoryService } from '../services/api';
import { homeRows } from '../data/movieData';
import MovieCardVertical from '../components/MovieCardVertical';
import CommentSection from '../components/CommentSection';
import { formatDurationVN } from '../utils/format';
import { useToast } from '../context/ToastContext';

const POSTER = '/images/poster_1.jpeg';
const DEFAULT_AVATAR = 'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/9rdo8k24_asset24x.webp';

const WatchMovie = () => {
  const { id } = useParams();
  const { movies, addToMyList, removeFromMyList, isInMyList, top10Movies } = useContent();
  const { profiles, activeProfileId, isLoggedIn, showSkipIntro, autoPlayNext, subtitleSize, setSubtitleSize } = useUser();
  const currentUser = profiles?.find(p => p.id === activeProfileId) || profiles?.[0] || null;

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    
    const fetchMovieDetail = async () => {
      try {
        const normalizedId = id.replace('m_', '');
        const dbMovie = await movieService.getMovieById(normalizedId);
        const contextMovie = movies.find(m => m.id === id) || {};
        
        setMovie({
          ...contextMovie,
          ...dbMovie,
          id: id,
          videos: dbMovie.videos && dbMovie.videos.length > 0 ? dbMovie.videos : contextMovie.videos,
          genres: dbMovie.genres && dbMovie.genres.length > 0 ? dbMovie.genres : contextMovie.genres,
          tags: dbMovie.tags && dbMovie.tags.length > 0 ? dbMovie.tags : contextMovie.tags,
        });
      } catch {
        // Fallback: dùng dữ liệu context
        const found = movies.find(m => m.id === id);
        if (found) setMovie(found);
      } finally {
        setLoading(false);
      }
    };

    if (movies.length > 0) {
      fetchMovieDetail();
    }
  }, [id, movies]);

  const isMovieSeries = movie ? (movie.type === 'tvShow' || (movie.videos && movie.videos.length > 1)) : false;

  const [isFilterActive, setIsFilterActive] = useState(false);
  const [activeEpisode, setActiveEpisode] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [totalDuration, setTotalDuration] = useState('00:00');
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsPanel, setActiveSettingsPanel] = useState('main');
  const [ccEnabled, setCcEnabled] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentTimeNum, setCurrentTimeNum] = useState(0);
  const [durationNum, setDurationNum] = useState(0);
  const [isAutoPlayCancelled, setIsAutoPlayCancelled] = useState(false);
  const [accessError, setAccessError] = useState(null);
  
  // Ad States
  const [hasPlayedAd, setHasPlayedAd] = useState(false);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const adVideoRef = useRef(null);
  
  const videoRef = useRef(null);
  const seekTimeout = useRef(null);

  const [seekIndicator, setSeekIndicator] = useState({ show: false, text: '' });
  const [volume, setVolume] = useState(1);
  const [subtitleMode, setSubtitleMode] = useState('Tắt');
  const [audioMode, setAudioMode] = useState('Tiếng Việt');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [qualityMode, setQualityMode] = useState('Tự động');
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef(null);

  useEffect(() => {
    const handleUserActivity = () => {
      setIsIdle(false);
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, 3000);
    };

    const playerEl = document.getElementById('playerWrapper');
    if (playerEl) {
      playerEl.addEventListener('mousemove', handleUserActivity);
      playerEl.addEventListener('mousedown', handleUserActivity);
      // Initiate timer
      handleUserActivity();
    }

    return () => {
      clearTimeout(idleTimerRef.current);
      if (playerEl) {
        playerEl.removeEventListener('mousemove', handleUserActivity);
        playerEl.removeEventListener('mousedown', handleUserActivity);
      }
    };
  }, []);

  // Kiểm tra quyền xem phim (Chỉ kiểm tra với tập VIP - Trigger Oracle sẽ bắt lỗi)
  useEffect(() => {
    if (!movie || !currentUser) return;
    const currentVideo = movie.videos?.[activeEpisode - 1];
    // Chỉ gọi API kiểm tra khi tập phim yêu cầu VIP
    if (currentVideo?.requiredPlan === 'VIP') {
      const checkAccess = async () => {
        try {
          await watchHistoryService.recordPlay(currentUser.id, currentVideo.id, 0);
          setAccessError(null);
        } catch (err) {
          setAccessError(err.message || 'Bạn không có quyền xem nội dung này.');
        }
      };
      checkAccess();
    } else {
      setAccessError(null);
    }
  
    // Reset ad when changing episode or movie
    setHasPlayedAd(false);
    setIsAdPlaying(false);
  }, [movie, activeEpisode, currentUser]);

  useEffect(() => {
    let interval;
    if (isAdPlaying && adCountdown > 0) {
      interval = setInterval(() => {
        setAdCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAdPlaying, adCountdown]);

  const handleSkipAd = () => {
    if (adCountdown > 0) return;
    setIsAdPlaying(false);
    if (adVideoRef.current) adVideoRef.current.pause();
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  const isBookmarked = movie ? isInMyList(movie.id) : false;
  const toggleBookmark = () => {
    if (!isLoggedIn) return navigate('/login');
    if (isBookmarked) {
      removeFromMyList(movie.id);
    } else {
      addToMyList(movie.id);
    }
  };

  const relatedMovies = movie ? movies.filter(m => 
    m.id !== movie.id && 
    (m.genres && movie.genres && m.genres.some(g => movie.genres.includes(g)))
  ).slice(0, 12) : [];



  const formatTime = (secs) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); } else { videoRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  const seek = (secs) => { 
    if (videoRef.current) videoRef.current.currentTime += secs; 
    setSeekIndicator({ show: true, text: secs > 0 ? `+${secs}s` : `${secs}s` });
    if (seekTimeout.current) clearTimeout(seekTimeout.current);
    seekTimeout.current = setTimeout(() => setSeekIndicator({ show: false, text: '' }), 600);
  };
  const toggleMute = () => { if (videoRef.current) videoRef.current.muted = !isMuted; setIsMuted(!isMuted); };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      
      switch(e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlay();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(10);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(-10);
          break;
      }
      
      // Wake up UI on key press
      setIsIdle(false);
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setIsIdle(true), 3000);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted]);
  
  const handleVolumeChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newVolume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(newVolume);
    if(videoRef.current) {
        videoRef.current.volume = newVolume;
        videoRef.current.muted = newVolume === 0;
    }
    setIsMuted(newVolume === 0);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if(videoRef.current) videoRef.current.playbackRate = speed;
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        videoRef.current.disablePictureInPicture = true;
      } else {
        videoRef.current.disablePictureInPicture = false;
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP failed', err);
    }
  };

  const toggleFullscreen = () => {
    const el = videoRef.current?.closest('.player-wrapper');
    if (!document.fullscreenElement) { el?.requestFullscreen(); } else { document.exitFullscreen(); }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentT = videoRef.current.currentTime;
    const durationT = videoRef.current.duration;
    
    const p = (currentT / durationT) * 100 || 0;
    setProgress(p);
    setCurrentTime(formatTime(currentT));
    setTotalDuration(formatTime(durationT));
    setCurrentTimeNum(currentT);
    setDurationNum(durationT || 0);

    // Kích hoạt quảng cáo ở giây thứ 70
    if (!hasPlayedAd && !isAdPlaying && currentT >= 70 && currentT < 72) {
      setIsAdPlaying(true);
      setHasPlayedAd(true);
      setAdCountdown(5);
      videoRef.current.pause();
      setIsPlaying(false);
      if (adVideoRef.current) {
        adVideoRef.current.currentTime = 0;
        adVideoRef.current.play();
      }
      return;
    }

    if (autoPlayNext && isMovieSeries && !isAutoPlayCancelled && durationT > 0 && (durationT - currentT) <= 0.5) {
      setActiveEpisode(prev => prev + 1);
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const handleProgressClick = (e) => {
    if (!videoRef.current) return;
    const bar = e.currentTarget;
    const ratio = (e.clientX - bar.getBoundingClientRect().left) / bar.offsetWidth;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    videoRef.current.currentTime = clampedRatio * videoRef.current.duration;
  };

  const episodes = movie?.videos || [];

  const ratingLabels = ['', 'Tệ', 'Tạm được', 'Bình thường', 'Hay', 'Tuyệt vời'];

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Đang tải thông tin phim...</div>;
  if (!movie) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Không tìm thấy phim.</div>;

  const currentVideo = episodes.find(ep => ep.episodeNumber === activeEpisode) || episodes[0];

  const handleSidebarEpisodeClick = async (ep) => {
    if (ep.requiredPlan === 'VIP' && currentUser) {
      try {
        await watchHistoryService.recordPlay(currentUser.id, ep.id, 0);
      } catch (err) {
        return showToast(err.message || 'Nội dung này yêu cầu gói VIP.');
      }
    }
    setActiveEpisode(ep.episodeNumber);
  };

  return (
    <>
      <Navbar onToggleFilter={() => setIsFilterActive(!isFilterActive)} />
      <FilterModal isActive={isFilterActive} onToggle={() => setIsFilterActive(!isFilterActive)} />

      <div className="watch-container">
        <div className="watch-layout">
          {/* ── CỘT TRÁI: VIDEO + INFO ── */}
          <div className="watch-main">

            {/* VIDEO PLAYER */}
            <div className={`player-wrapper ${isIdle ? 'is-idle' : ''}`} id="playerWrapper">
              {accessError && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '2rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Rất tiếc!</h2>
                  <p style={{ fontSize: '1.2rem', color: '#ccc', marginBottom: '2rem' }}>{accessError}</p>
                  <button onClick={() => window.history.back()} style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', backgroundColor: '#e50914', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Quay lại</button>
                </div>
              )}
              
              {isAdPlaying && (
                <div className="ad-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 50, backgroundColor: '#000' }}>
                  <video 
                    ref={adVideoRef} 
                    src="/video/qc.mp4" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onEnded={handleSkipAd}
                    autoPlay
                    disablePictureInPicture
                    disableRemotePlayback
                  />
                  <button 
                    className="btn-skip-intro" 
                    style={{ 
                      position: 'absolute', 
                      bottom: '80px', 
                      right: '25px', 
                      zIndex: 51, 
                      padding: '10px 20px', 
                      background: adCountdown > 0 ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.7)', 
                      color: adCountdown > 0 ? '#ccc' : '#fff', 
                      border: '1px solid rgba(255,255,255,0.3)', 
                      borderRadius: '4px', 
                      cursor: adCountdown > 0 ? 'not-allowed' : 'pointer', 
                      fontWeight: 'bold' 
                    }}
                    onClick={handleSkipAd}
                    disabled={adCountdown > 0}
                  >
                    Bỏ qua quảng cáo {adCountdown > 0 ? `(${adCountdown})` : ''}
                  </button>
                </div>
              )}

              <video
                ref={videoRef}
                className="main-video"
                src={"/video/videoplayback.mp4"}
                poster={movie.poster ? movie.poster.replace('.jpg', ' _ ngang.jpg') : POSTER}
                onTimeUpdate={handleTimeUpdate}
                disablePictureInPicture
                disableRemotePlayback
              />
              <div 
                className="video-click-overlay" 
                onClick={togglePlay} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2 }}
              />

              <div className={`seek-indicator ${seekIndicator.show ? 'show' : ''}`}>
                {seekIndicator.text}
              </div>

              {/* SUBTITLE OVERLAY */}
              <div className="subtitle-overlay" id="subtitleOverlay" style={{ display: subtitleMode !== 'Tắt' ? 'block' : 'none' }}>
                <span className="subtitle-text" style={{ fontSize: subtitleSize === 'small' ? '14px' : subtitleSize === 'large' ? '28px' : '20px' }}>
                  Đây là một đoạn phụ đề mẫu đang hiển thị...
                </span>
              </div>

              {/* BỎ QUA ĐOẠN GIỚI THIỆU */}
              {showSkipIntro && currentTimeNum >= 1 && currentTimeNum < 10 && (
                <button 
                  className="btn-skip-intro" 
                  style={{ position: 'absolute', bottom: '80px', right: '25px', zIndex: 10, padding: '10px 20px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={() => seek(60)}
                >
                  Bỏ qua đoạn giới thiệu
                </button>
              )}

              {/* TỰ ĐỘNG PHÁT TẬP TIẾP THEO */}
              {autoPlayNext && isMovieSeries && durationNum > 0 && (durationNum - currentTimeNum) <= 30 && !isAutoPlayCancelled && (
                <div 
                  className="auto-play-overlay" 
                  style={{ position: 'absolute', bottom: '80px', right: '20px', zIndex: 10, padding: '10px 20px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '15px' }}
                >
                  <div 
                    style={{ cursor: 'pointer', fontWeight: 'bold' }} 
                    onClick={() => { setActiveEpisode(prev => prev + 1); if(videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play(); } }}
                  >
                    Phát tập tiếp theo ({Math.max(0, Math.ceil(durationNum - currentTimeNum))}s)
                  </div>
                  <div 
                    style={{ cursor: 'pointer', color: '#ccc', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '15px', display: 'flex', alignItems: 'center' }} 
                    onClick={() => setIsAutoPlayCancelled(true)}
                    title="Hủy tự động phát"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </div>
                </div>
              )}

              {/* PLAYER CONTROLS */}
              <div className="player-bottom-overlay">
                {/* PROGRESS BAR */}
                <div className="progress-container" id="progressContainer" 
                     onPointerDown={handleProgressClick} 
                     onPointerMove={(e) => { if(e.buttons === 1) handleProgressClick(e); }}
                >
                  <div className="progress-filled" id="progressFilled" style={{ width: `${progress}%` }}></div>
                  <div className="progress-thumb" id="progressThumb" style={{ left: `${progress}%` }}></div>
                </div>

                <div className="player-controls-row">
                  {/* LEFT CONTROLS */}
                  <div className="player-left-ctrl">
                    <button className="vid-ctrl-btn" title="Tua lại 10s" onClick={() => seek(-10)}>
                      <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="11 19 2 12 11 5 11 19"></polygon><polygon points="22 19 13 12 22 5 22 19"></polygon></svg>
                    </button>
                    <button className="vid-ctrl-btn" onClick={togglePlay} style={{ transform: 'scale(1.2)' }}>
                      {isPlaying
                        ? <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                        : <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      }
                    </button>
                    <button className="vid-ctrl-btn" title="Tua tới 10s" onClick={() => seek(10)}>
                      <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="13 19 22 12 13 5 13 19"></polygon><polygon points="2 19 11 12 2 5 2 19"></polygon></svg>
                    </button>

                    {/* VOLUME */}
                    <div className="volume-container">
                      <button className="vid-ctrl-btn" title="Tắt tiếng" onClick={toggleMute}>
                        {isMuted
                          ? <svg height="26" viewBox="0 0 24 24" width="26">
                              <path d="M 11.60 2.08 L 11.48 2.14 L 3.91 6.68 C 3.02 7.21 2.28 7.97 1.77 8.87 C 1.26 9.77 1.00 10.79 1 11.83 V 12.16 L 1.01 12.56 C 1.07 13.52 1.37 14.46 1.87 15.29 C 2.38 16.12 3.08 16.81 3.91 17.31 L 11.48 21.85 C 11.63 21.94 11.80 21.99 11.98 21.99 C 12.16 22.00 12.33 21.95 12.49 21.87 C 12.64 21.78 12.77 21.65 12.86 21.50 C 12.95 21.35 13 21.17 13 21 V 3 C 12.99 2.83 12.95 2.67 12.87 2.52 C 12.80 2.37 12.68 2.25 12.54 2.16 C 12.41 2.07 12.25 2.01 12.08 2.00 C 11.92 1.98 11.75 2.01 11.60 2.08 Z" fill="currentColor"></path>
                              <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2"></line>
                              <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2"></line>
                            </svg>
                          : <svg height="26" viewBox="0 0 24 24" width="26">
                              <path d="M 11.60 2.08 L 11.48 2.14 L 3.91 6.68 C 3.02 7.21 2.28 7.97 1.77 8.87 C 1.26 9.77 1.00 10.79 1 11.83 V 12.16 L 1.01 12.56 C 1.07 13.52 1.37 14.46 1.87 15.29 C 2.38 16.12 3.08 16.81 3.91 17.31 L 11.48 21.85 C 11.63 21.94 11.80 21.99 11.98 21.99 C 12.16 22.00 12.33 21.95 12.49 21.87 C 12.64 21.78 12.77 21.65 12.86 21.50 C 12.95 21.35 13 21.17 13 21 V 3 C 12.99 2.83 12.95 2.67 12.87 2.52 C 12.80 2.37 12.68 2.25 12.54 2.16 C 12.41 2.07 12.25 2.01 12.08 2.00 C 11.92 1.98 11.75 2.01 11.60 2.08 Z" fill="currentColor"></path>
                              <path d=" M 15.53 7.05 C 15.35 7.22 15.25 7.45 15.24 7.70 C 15.23 7.95 15.31 8.19 15.46 8.38 L 15.53 8.46 L 15.70 8.64 C 16.09 9.06 16.39 9.55 16.61 10.08 L 16.70 10.31 C 16.90 10.85 17 11.42 17 12 L 16.99 12.24 C 16.96 12.73 16.87 13.22 16.70 13.68 L 16.61 13.91 C 16.36 14.51 15.99 15.07 15.53 15.53 C 15.35 15.72 15.25 15.97 15.26 16.23 C 15.26 16.49 15.37 16.74 15.55 16.92 C 15.73 17.11 15.98 17.21 16.24 17.22 C 16.50 17.22 16.76 17.12 16.95 16.95 C 17.6 16.29 18.11 15.52 18.46 14.67 L 18.59 14.35 C 18.82 13.71 18.95 13.03 18.99 12.34 L 19 12 C 18.99 11.19 18.86 10.39 18.59 9.64 L 18.46 9.32 C 18.15 8.57 17.72 7.89 17.18 7.3 L 16.95 7.05 L 16.87 6.98 C 16.68 6.82 16.43 6.74 16.19 6.75 C 15.94 6.77 15.71 6.87 15.53 7.05" fill="currentColor" transform="translate(18, 12) scale(1) translate(-18,-12)"></path>
                              <path d="M18.36 4.22C18.18 4.39 18.08 4.62 18.07 4.87C18.05 5.12 18.13 5.36 18.29 5.56L18.36 5.63L18.66 5.95C19.36 6.72 19.91 7.60 20.31 8.55L20.47 8.96C20.82 9.94 21 10.96 21 11.99L20.98 12.44C20.94 13.32 20.77 14.19 20.47 15.03L20.31 15.44C19.86 16.53 19.19 17.52 18.36 18.36C18.17 18.55 18.07 18.80 18.07 19.07C18.07 19.33 18.17 19.59 18.36 19.77C18.55 19.96 18.80 20.07 19.07 20.07C19.33 20.07 19.59 19.96 19.77 19.77C20.79 18.75 21.61 17.54 22.16 16.20L22.35 15.70C22.72 14.68 22.93 13.62 22.98 12.54L23 12C22.99 10.73 22.78 9.48 22.35 8.29L22.16 7.79C21.67 6.62 20.99 5.54 20.15 4.61L19.77 4.22L19.70 4.15C19.51 3.99 19.26 3.91 19.02 3.93C18.77 3.94 18.53 4.04 18.36 4.22 Z" fill="currentColor" transform="translate(22, 12) scale(1) translate(-22,-12)"></path>
                            </svg>
                        }
                      </button>
                      <div className="volume-slider-wrapper">
                        <div className="volume-slider" id="volumeSlider" onPointerDown={handleVolumeChange} onPointerMove={(e) => { if(e.buttons === 1) handleVolumeChange(e); }}>
                          <div className="volume-slider-progress" id="volumeProgress" style={{ width: `${volume * 100}%` }}></div>
                          <div className="volume-slider-thumb" id="volumeThumb" style={{ left: `${volume * 100}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <span className="time-display">{currentTime} / {totalDuration}</span>
                  </div>

                  {/* RIGHT CONTROLS */}
                  <div className="player-right-ctrl">
                    {/* CC */}
                    <button className={`vid-ctrl-btn ${ccEnabled ? 'active-cc' : ''}`} title="Bật/Tắt Phụ đề (C)" onClick={() => {
                      const newCC = !ccEnabled;
                      setCcEnabled(newCC);
                      setSubtitleMode(newCC ? 'Tiếng Việt' : 'Tắt');
                    }}>
                      <svg fill="none" height="26" viewBox="0 0 24 24" width="26">
                          <path d="M21.20 3.01L21 3H3L2.79 3.01C2.30 3.06 1.84 3.29 1.51 3.65C1.18 4.02 .99 4.50 1 5V19L1.01 19.20C1.05 19.66 1.26 20.08 1.58 20.41C1.91 20.73 2.33 20.94 2.79 20.99L3 21H21L21.20 20.98C21.66 20.94 22.08 20.73 22.41 20.41C22.73 20.08 22.96 19.66 22.99 19.20L23 19V5C23.00 4.50 22.81 4.02 22.48 3.65C22.15 3.29 21.69 3.06 21.20 3.01ZM3 19V5H21V19H3ZM8 11H6C5.73 11 5.48 11.10 5.29 11.29C5.10 11.48 5 11.73 5 12C5 12.26 5.10 12.51 5.29 12.70C5.48 12.89 5.73 13 6 13H8C8.26 13 8.51 12.89 8.70 12.70C8.89 12.51 9 12.26 9 12C9 11.73 8.89 11.48 8.70 11.29C8.51 11.10 8.26 11 8 11ZM18 11H12C11.73 11 11.48 11.10 11.29 11.29C11.10 11.48 11 11.73 11 12C11 12.26 11.10 12.51 11.29 12.70C11.48 12.89 11.73 13 12 13H18C18.26 13 18.51 12.89 18.70 12.70C18.89 12.51 19 12.26 19 12C19 11.73 18.89 11.48 18.70 11.29C18.51 11.10 18.26 11 18 11ZM18 15H16C15.73 15 15.48 15.10 15.29 15.29C15.10 15.48 15 15.73 15 16C15 16.26 15.10 16.51 15.29 16.70C15.48 16.89 15.73 17 16 17H18C18.26 17 18.51 16.89 18.70 16.70C18.89 16.51 19 16.26 19 16C19 15.73 18.89 15.48 18.70 15.29C18.51 15.10 18.26 15 18 15ZM12 15H6C5.73 15 5.48 15.10 5.29 15.29C5.10 15.48 5 15.73 5 16C5 16.26 5.10 16.51 5.29 16.70C5.48 16.89 5.73 17 6 17H12C12.26 17 12.51 16.89 12.70 16.70C12.89 16.51 13 16.26 13 16C13 15.73 12.89 15.48 12.70 15.29C12.51 15.10 12.26 15 12 15Z" fill="currentColor"></path>
                      </svg>
                    </button>

                    {/* SETTINGS */}
                    <div className="settings-wrapper">
                      <button className="vid-ctrl-btn stroke" onClick={() => {setShowSettings(!showSettings); setActiveSettingsPanel('main');}} title="Cài đặt video">
                        <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                      </button>
                      <div className={`settings-menu ${showSettings ? 'active' : ''}`} onClick={e => e.stopPropagation()}>
                        {/* MAIN PANEL */}
                        <div className={`menu-panel ${activeSettingsPanel === 'main' ? 'active' : ''}`}>
                          <div className="setting-item" onClick={() => setActiveSettingsPanel('subtitle')}>
                            <div className="setting-icon"><svg viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect><path d="M9 15H7a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2"></path><path d="M19 15h-2a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2"></path></svg></div>
                            <div className="setting-label">Phụ đề</div>
                            <div className="setting-value-group"><span>{subtitleMode}</span><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></div>
                          </div>
                          <div className="setting-item" onClick={() => setActiveSettingsPanel('audio')}>
                            <div className="setting-icon"><svg viewBox="0 0 40 40" stroke="currentColor"><path d="M24.2 35v-3.3c0-1.8-.5-3.5-1.4-4.7-.9-1.3-2.1-1.9-3.4-1.9H9.7c-1.3 0-2.5.7-3.4 1.9-.9 1.2-1.4 2.9-1.4 4.7V35M19.4 11.7c0 3.7-2.2 6.7-4.8 6.7-2.7 0-4.8-3-4.8-6.7 0-3.7 2.2-6.7 4.8-6.7 2.7 0 4.8 3 4.8 6.7z" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                            <div className="setting-label">Âm thanh</div>
                            <div className="setting-value-group"><span>{audioMode}</span><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></div>
                          </div>
                          <div className="setting-item" onClick={() => setActiveSettingsPanel('speed')}>
                            <div className="setting-icon"><svg viewBox="0 0 24 24" stroke="currentColor"><path d="M12 22A10 10 0 1 1 22 12"></path><circle cx="12" cy="12" r="2"></circle><line x1="12" y1="12" x2="17" y2="7"></line></svg></div>
                            <div className="setting-label">Tốc độ phát</div>
                            <div className="setting-value-group"><span>{playbackSpeed === 1 ? 'Chuẩn' : `${playbackSpeed}x`}</span><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></div>
                          </div>
                          <div className="setting-item" onClick={() => setActiveSettingsPanel('quality')}>
                            <div className="setting-icon"><svg viewBox="0 0 24 24" stroke="currentColor"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg></div>
                            <div className="setting-label">Chất lượng</div>
                            <div className="setting-value-group"><span>{qualityMode}</span><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></div>
                          </div>
                        </div>

                        {/* SUB-PANELS */}
                        <div className={`menu-panel ${activeSettingsPanel === 'subtitle' ? 'active' : ''}`}>
                          <div className="menu-back">
                            <span className="back-clickable" onClick={() => setActiveSettingsPanel('main')}>
                              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg> Phụ đề
                            </span>
                            <span 
                              style={{ position: 'absolute', right: '15px', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px', color: 'inherit' }}
                              onClick={(e) => { e.stopPropagation(); setActiveSettingsPanel('subtitle-size'); }}
                            >
                              Kích thước
                            </span>
                          </div>
                          {['Tiếng Việt', 'Tiếng Anh', 'Tắt'].map(opt => (
                            <div key={opt} className={`setting-option ${subtitleMode === opt ? 'selected' : ''}`} onClick={() => setSubtitleMode(opt)}>{opt}</div>
                          ))}
                        </div>
                        <div className={`menu-panel ${activeSettingsPanel === 'subtitle-size' ? 'active' : ''}`}>
                          <div className="menu-back">
                            <span className="back-clickable" onClick={() => setActiveSettingsPanel('subtitle')}>
                              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg> Kích thước phụ đề
                            </span>
                          </div>
                          {[
                            { label: 'Nhỏ', value: 'small' },
                            { label: 'Vừa', value: 'medium' },
                            { label: 'Lớn', value: 'large' }
                          ].map(opt => (
                            <div key={opt.value} className={`setting-option ${subtitleSize === opt.value ? 'selected' : ''}`} onClick={() => setSubtitleSize(opt.value)}>{opt.label}</div>
                          ))}
                        </div>
                        <div className={`menu-panel ${activeSettingsPanel === 'audio' ? 'active' : ''}`}>
                          <div className="menu-back">
                            <span className="back-clickable" onClick={() => setActiveSettingsPanel('main')}>
                              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg> Âm thanh
                            </span>
                          </div>
                          {['Tiếng Việt', 'Tiếng Anh'].map(opt => (
                            <div key={opt} className={`setting-option ${audioMode === opt ? 'selected' : ''}`} onClick={() => setAudioMode(opt)}>{opt}</div>
                          ))}
                        </div>
                        <div className={`menu-panel ${activeSettingsPanel === 'speed' ? 'active' : ''}`}>
                          <div className="menu-back">
                            <span className="back-clickable" onClick={() => setActiveSettingsPanel('main')}>
                              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg> Tốc độ phát
                            </span>
                          </div>
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(opt => (
                            <div key={opt} className={`setting-option ${playbackSpeed === opt ? 'selected' : ''}`} onClick={() => handleSpeedChange(opt)}>{opt === 1 ? 'Chuẩn' : `${opt}x`}</div>
                          ))}
                        </div>
                        <div className={`menu-panel ${activeSettingsPanel === 'quality' ? 'active' : ''}`}>
                          <div className="menu-back">
                            <span className="back-clickable" onClick={() => setActiveSettingsPanel('main')}>
                              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg> Chất lượng
                            </span>
                          </div>
                          {['2K Ultra HD', '1080p Premium', '1080p', '720p', '480p', '360p', 'Tự động'].map(opt => (
                            <div key={opt} className={`setting-option ${qualityMode === opt ? 'selected' : ''}`} onClick={() => setQualityMode(opt)}>{opt}</div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* PiP */}
                    <button className="vid-ctrl-btn stroke" title="Trình phát thu nhỏ " onClick={togglePiP}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect><rect x="12" y="11" width="7" height="6" rx="1" ry="1"></rect></svg>
                    </button>

                    {/* FULLSCREEN */}
                    <button className="vid-ctrl-btn stroke" title="Toàn màn hình (F)" onClick={toggleFullscreen}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* THÔNG TIN PHIM DƯỚI VIDEO */}
            <div className="movie-header">
              <div className="movie-info">
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {movie.title}
                  {currentVideo?.requiredPlan === 'VIP' && (
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
                
                <div className="detail-meta" style={{ marginTop: '10px' }}>
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
              </div>

              <div className="movie-actions">
                <button className="btn-action" onClick={toggleBookmark} style={{ color: isBookmarked ? 'var(--accent-color)' : 'inherit' }}>
                  <svg width="16" height="16" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  {isBookmarked ? 'Đã lưu' : 'Lưu phim'}
                </button>
                <button className="btn-action">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                  Chia sẻ
                </button>
                <button className="btn-action">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                  Báo cáo
                </button>
              </div>
            </div>

            {/* MÔ TẢ */}
            <div className="movie-desc">
              <p>{movie.description || 'Chưa có mô tả cho bộ phim này.'}</p>
            </div>

            {/* ĐÁNH GIÁ + PHIM LIÊN QUAN */}
            <div className="interaction-section">
                {/* PHIM CÓ THỂ BẠN SẼ THÍCH */}
                <div className="related-box">
                  <h3>Có thể bạn sẽ thích</h3>
                  <div className="slider-wrapper">
                    {canScrollLeft && (
                      <button className="slide-btn left-btn" onClick={() => {scrollRef.current.scrollBy({left: -200, behavior: 'smooth'})}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                      </button>
                    )}
                      <div className="related-card-grid" ref={scrollRef} onScroll={handleScroll}>
                        {relatedMovies.map((m, i) => (
                          <MovieCardVertical key={i} movie={m} showMatch />
                        ))}
                      </div>
                    {canScrollRight && (
                      <button className="slide-btn right-btn" onClick={() => {scrollRef.current.scrollBy({left: 200, behavior: 'smooth'})}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>
                    )}
                  </div>
                </div>

              {/* BÌNH LUẬN */}
              <CommentSection movieId={movie.id} limit={8} />
            </div>

          </div>

          {/* ── CỘT PHẢI: DANH SÁCH TẬP HOẶC TOP 10 PHIM LẺ ── */}
          <div className="watch-sidebar">
            {isMovieSeries ? (
              <>
                <div className="episode-header">
                  <span className="episode-title">Danh sách tập</span>
                </div>
                <div className="episode-list" style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
                  {episodes.map(ep => (
                    <div
                      key={ep.id}
                      className={`episode-item ${activeEpisode === ep.episodeNumber ? 'active' : ''}`}
                      onClick={() => handleSidebarEpisodeClick(ep)}
                    >
                      <img
                        src={movie.poster || POSTER}
                        alt={`Ep ${ep.episodeNumber}`}
                        className="ep-img"
                        onError={e => { e.target.src = POSTER; }}
                      />
                      <div className="ep-info">
                        <div className="ep-title">Tập {ep.episodeNumber} {activeEpisode === ep.episodeNumber && '(Đang xem)'}</div>
                        <div className="ep-duration">
                          {formatDurationVN(ep.duration)}
                          {ep.requiredPlan === 'VIP' && <span style={{ 
                      padding: '2px 8px', 
                      background: 'linear-gradient(135deg, #FFD700, #FDB931)', 
                      color: '#000', 
                      fontSize: '10px', 
                      borderRadius: '4px', 
                      fontWeight: 'bold',
                      textShadow: 'none',
                      whiteSpace: 'nowrap'
                    }}>VIP</span>}
                        </div>
                      </div>
                      {activeEpisode === ep.episodeNumber && (
                        <svg className="ep-playing-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="episode-header">
                  <span className="episode-title" style={{ fontSize: '18px', fontWeight: 'bold' }}>Top 10 phim thịnh hành</span>
                </div>
                <div className="episode-list" style={{ paddingRight: '5px', overflowY: 'auto', flex: 1 }}>
                  {top10Movies.map((m, index) => (
                    <a
                      href={`/watch/${m.id}`}
                      key={m.id}
                      className="episode-item"
                      style={{ textDecoration: 'none', alignItems: 'center', marginBottom: '12px' }}
                    >
                      <div style={{ position: 'relative', flexShrink: 0, marginRight: '15px' }}>
                        <img
                          src={m.posterHorizontal || POSTER}
                          alt={m.title}
                          className="ep-img"
                          style={{ width: '130px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                          onError={e => { e.target.src = POSTER; }}
                        />
                        <span style={{
                          position: 'absolute',
                          bottom: '-8px',
                          left: '0px',
                          fontSize: '56px',
                          fontWeight: '900',
                          color: '#fff',
                          fontStyle: 'italic',
                          lineHeight: 1,
                          textShadow: '2px 2px 5px rgba(0,0,0,0.8), -1px -1px 0 #333, 1px -1px 0 #333, -1px 1px 0 #333, 1px 1px 0 #333',
                          WebkitTextStroke: '1px rgba(255,255,255,0.5)',
                          fontFamily: 'Impact, sans-serif'
                        }}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="ep-info" style={{ flex: 1 }}>
                        <div className="ep-title" style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>
                          {m.title}
                        </div>
                        <div className="ep-duration" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {[m.year, m.age, m.duration, m.quality].filter(Boolean).join(' • ')}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default WatchMovie;

