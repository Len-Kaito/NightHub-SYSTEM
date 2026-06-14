import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { useUser } from '../context/UserContext';
import { usePlayMovie } from '../hooks/usePlayMovie';
const MovieCardHorizontal = ({ movie }) => {
  const navigate = useNavigate();
  const { addToMyList, removeFromMyList, isInMyList } = useContent();
  const { isLoggedIn } = useUser();
  const isSaved = isInMyList(movie.id);
  const playMovie = usePlayMovie();

  const handlePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    playMovie(movie.id, movie.maVP);
  };

  const handleInfo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) return navigate('/login');
    navigate(`/movie/${movie.id}`);
  };

  const handleToggleList = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) return navigate('/login');
    if (isSaved) removeFromMyList(movie.id);
    else addToMyList(movie.id);
  };

  return (
    <div onClick={handlePlay} className="movie-card movie-card-horizontal has-info" style={{ cursor: 'pointer' }}>
      <div className="image-wrapper">
        <img src={movie.poster ? movie.poster.replace('.jpg', ' _ ngang.jpg') : '/images/default_poster.jpg'} alt={movie.title} onError={e => { e.target.src = '/images/default_poster.jpg'; }} />
      </div>

      <div className="card-info">
        <div className="card-actions">
          {/* Thứ tự: Play - Lưu phim - Chi tiết (phải) */}
          <button className="action-btn play" title="Xem tiếp" onClick={handlePlay}>
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
        <h4 className="card-title">{movie.title}</h4>
        
        {movie.maVP && (
          <p className="card-episode">Tập {movie.maVP}</p>
        )}

        {(movie.progress !== undefined || movie.remaining) && (
          <div className="card-cw-row">
            {movie.progress !== undefined && (
              <div className="card-cw-progress">
                <div className="card-cw-fill" style={{ width: `${movie.progress}%` }}></div>
              </div>
            )}
            {movie.remaining && <span className="card-cw-time">Còn {movie.remaining}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieCardHorizontal;
