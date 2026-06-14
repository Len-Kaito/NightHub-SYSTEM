import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { useUser } from '../context/UserContext';
import { usePlayMovie } from '../hooks/usePlayMovie';

const ageTooltips = {
  'K': 'Không giới hạn độ tuổi',
  'P': 'Phổ biến - Mọi lứa tuổi',
  'T13': 'Phim dành cho người từ 13 tuổi trở lên',
  'T16': 'Phim dành cho người từ 16 tuổi trở lên',
  'T18': 'Phim dành cho người từ 18 tuổi trở lên',
};

const HeroSlider = ({ images = [] }) => {
  const heroImages = images.length > 0 ? images : [{
    id: 'placeholder',
    title: 'Đang tải...',
    poster: '/images/default_poster.jpg',
    description: '',
    year: '2024'
  }];

  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const { addToMyList, removeFromMyList, isInMyList } = useContent();
  const playMovie = usePlayMovie();
  const { isLoggedIn } = useUser();

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [currentIndex, heroImages.length]);

  const goToSlide = (index) => setCurrentIndex(index);
  const goToPrev = () => setCurrentIndex((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));
  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % heroImages.length);

  const currentSlide = heroImages[currentIndex] || heroImages[0];
  const slideId = currentSlide.id;
  const isSaved = slideId ? isInMyList(slideId) : false;

  const handleToggleList = () => {
    if (isSaved) removeFromMyList(slideId);
    else addToMyList(slideId);
  };

  // Convert vertical poster to horizontal layout by using CSS tricks, since DB only has 1 poster URL
  const bgUrl = currentSlide.poster ? currentSlide.poster.replace('.jpg', ' _ ngang.jpg') : '';

  return (
    <section className="hero" style={{ backgroundImage: `url('${bgUrl}')`, transition: 'background-image 0.8s ease-in-out' }}>
      <div className="hero-overlay"></div>

      <div className="hero-content animate-fade-in" key={currentIndex}>
        <h1 className="hero-title" style={{ fontSize: '3rem', fontWeight: '800', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
          {currentSlide.title}
        </h1>
        
        <div className="hero-meta" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span className="meta-item" style={{ margin: 0 }}>{currentSlide.year || '2024'}</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '18px', lineHeight: 1 }}>•</span>
          <span className="meta-item" style={{ margin: 0 }}>
            {currentSlide.totalEpisodes ? `${currentSlide.totalEpisodes} Tập` : (currentSlide.duration || '0s')}
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '18px', lineHeight: 1 }}>•</span>
          <span className="meta-item" style={{ fontWeight: 700, margin: 0 }}>{currentSlide.quality || 'Full HD'}</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '18px', lineHeight: 1 }}>•</span>
          <span className="meta-item meta-rating" style={{ display: 'inline-flex', alignItems: 'center', margin: 0 }}>
            {Number(currentSlide.rating > 0 ? currentSlide.rating : 5).toFixed(1)}/5.0
            <svg className="star-icon" style={{ marginLeft: '4px', fill: '#FFD700' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
          </span>
        </div>

        <p className="hero-desc" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)', maxWidth: '600px' }}>
          {currentSlide.description || 'Theo dõi để không bỏ lỡ những tình tiết hấp dẫn.'}
        </p>
        
        {slideId !== 'placeholder' && (
          <div className="hero-buttons">
            <button onClick={() => playMovie(slideId)} className="btn btn-play">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Xem phim
            </button>
            {isLoggedIn && (
              <button className={`btn btn-info ${isSaved ? 'bookmarked' : ''}`} onClick={handleToggleList}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                {isSaved ? 'Đã lưu' : 'Thêm danh sách'}
              </button>
            )}
            <button onClick={() => isLoggedIn ? navigate(`/movie/${slideId}`) : navigate('/login')} className="btn btn-info">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              Chi tiết
            </button>
          </div>
        )}
      </div>

      {/* Hero Controls */}
      {heroImages.length > 1 && (
        <div className="hero-controls">
          <div className="hero-indicators">
            {heroImages.map((_, idx) => (
              <div key={idx} className={`indicator-dot ${idx === currentIndex ? 'active' : ''}`} onClick={() => goToSlide(idx)} />
            ))}
          </div>
          <div className="hero-nav-buttons">
            <button className="hero-nav-btn prev" onClick={goToPrev}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 8 8 12 12 16"></polyline><line x1="16" y1="12" x2="8" y2="12"></line></svg>
            </button>
            <button className="hero-nav-btn next" onClick={goToNext}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSlider;
