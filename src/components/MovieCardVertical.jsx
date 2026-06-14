import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { useUser } from '../context/UserContext';
import { usePlayMovie } from '../hooks/usePlayMovie';

const ageBadgeLabels = ['K', 'T13', 'T16', 'T18', 'P'];
const ageTooltips = {
  'K': 'Không giới hạn độ tuổi',
  'P': 'Phổ biến - Mọi lứa tuổi',
  'T13': 'Phim dành cho người từ 13 tuổi trở lên',
  'T16': 'Phim dành cho người từ 16 tuổi trở lên',
  'T18': 'Phim dành cho người từ 18 tuổi trở lên',
};

const MovieCardVertical = ({ movie, index, isTop10, showMatch }) => {
  const navigate = useNavigate();
  const { addToMyList, removeFromMyList, isInMyList } = useContent();
  const { isLoggedIn } = useUser();
  const isSaved = isInMyList(movie.id);
  const playMovie = usePlayMovie();

  const handleToggleList = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) return navigate('/login');
    if (isSaved) removeFromMyList(movie.id);
    else addToMyList(movie.id);
  };

  const handlePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    playMovie(movie.id);
  };

  const handleInfo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) return navigate('/login');
    navigate(`/movie/${movie.id}`);
  };

  const TopNumberSVG = ({ number }) => (
    <svg viewBox="0 0 100 150" className="top-number-svg" preserveAspectRatio="xMinYMax meet">
      <text
        x="0"
        y="140"
        textAnchor="start"
        fontSize="140"
        fontWeight="900"
        fontStyle="italic"
        fontFamily="'Impact', 'Arial Black', sans-serif"
        fill="transparent"
        stroke="var(--accent-red, #E50914)"
        strokeWidth="4"
        strokeLinejoin="round"
        paintOrder="stroke fill"
        style={{ textShadow: '2px 2px 5px rgba(0,0,0,0.5)' }}
      >
        {number}
      </text>
    </svg>
  );

  const ageBadge = movie.age || (movie.badges && movie.badges.find(b => ageBadgeLabels.includes(b.label)))?.label;
  const primaryTag = movie.tags?.find(t => t.name?.toLowerCase() === ageBadge?.toLowerCase());
  const badgeTooltip = primaryTag?.description || primaryTag?.MoTa || ageTooltips[ageBadge] || ageBadge;

  const commonClasses = `movie-card has-info ${isTop10 ? 'top10-card' : 'movie-card-vertical'}`;

  const InnerContent = () => (
    <>
      <div className="image-wrapper">
        {ageBadge && (
          <div className="poster-age-badge" style={{ pointerEvents: 'auto' }} title={badgeTooltip || 'Không có mô tả'}>
            {ageBadge}
          </div>
        )}
        <img src={movie.poster || '/images/default_poster.jpg'} alt={movie.title} onError={e => { e.target.src = '/images/default_poster.jpg'; }} />
      </div>
      <div className="card-info">
        <div className="card-actions">
          {/* Thứ tự: Play - Lưu phim - Chi tiết (phải) */}
          <button className="action-btn play" title="Xem phim" onClick={handlePlay}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </button>
          {isLoggedIn && (
            <button className={`action-btn bookmark-btn ${isSaved ? 'bookmarked' : ''}`} title={isSaved ? "Bỏ lưu" : "Lưu phim"} onClick={handleToggleList}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </button>
          )}
          <button className="action-btn info-btn" title="Chi tiết" onClick={handleInfo} style={{ marginLeft: 'auto' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </button>
        </div>
        <div className="card-meta-info">
          {showMatch && movie.matchScore && <span className="card-meta-match">{Math.round(movie.matchScore)}% phù hợp</span>}
          {movie.quality && <span className="card-meta-quality">{movie.quality}</span>}
          {movie.duration && <span className="card-meta-duration">{movie.duration}</span>}
        </div>
        <h4 className="card-title">{movie.title}</h4>
        {movie.description && <p className="card-desc">{movie.description}</p>}
      </div>
    </>
  );

  if (isTop10) {
    return (
      <div className="top10-item" onClick={handlePlay} style={{ cursor: 'pointer' }}>
        <TopNumberSVG number={index + 1} />
        <div className={commonClasses}>
          <InnerContent />
        </div>
      </div>
    );
  }

  return (
    <div className={commonClasses} onClick={handlePlay} style={{ cursor: 'pointer' }}>
      <InnerContent />
    </div>
  );
};

export default MovieCardVertical;
