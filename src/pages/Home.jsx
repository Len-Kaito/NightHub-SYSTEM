import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FilterModal from '../components/FilterModal';
import HeroSlider from '../components/HeroSlider';
import MovieRow from '../components/MovieRow';
import MovieCardHorizontal from '../components/MovieCardHorizontal';
import MovieCardVertical from '../components/MovieCardVertical';
import { useContent } from '../context/ContentContext';
import { useUser } from '../context/UserContext';

const Home = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { movies, continueWatching, recommendations, loadWatchHistory } = useContent();
  const { isLoggedIn, activeProfileId } = useUser();

  React.useEffect(() => {
    if (isLoggedIn && activeProfileId) {
      loadWatchHistory(activeProfileId);
    }
  }, [isLoggedIn, activeProfileId, loadWatchHistory]);

  // Lấy ngẫu nhiên 5 phim cho Hero Banner từ toàn bộ phim
  const heroMovies = React.useMemo(() => {
    return [...movies].sort(() => 0.5 - Math.random()).slice(0, 5);
  }, [movies]);


  // Sắp xếp các hàng phim chuẩn như thiết kế cũ / CSDL
  const rows = [
    { title: 'Top 5 phim đặc sắc hôm nay', category: 'Top 5', isTop10: true, limit: 5 },
    { title: 'Cả nhà cùng xem', category: 'Cả nhà cùng xem', isTop10: false },
    { title: 'Phim mới cập nhật', category: 'Phim mới cập nhật', isTop10: false },
    { title: 'Kinh dị Âu Mỹ', category: 'Kinh dị Âu Mỹ', isTop10: false },
    { title: 'Phim chiếu rạp Việt Nam', category: 'Phim chiếu rạp Việt Nam', isTop10: false },
    { title: 'Hành động và phiêu lưu', category: 'Hành động và phiêu lưu', isTop10: false },
    { title: 'Phim dành giải thưởng', category: 'Phim dành giải thưởng', isTop10: false },
    { title: 'Phim cũ mà chất', category: 'Phim cũ mà chất', isTop10: false },
    { title: 'Lãng mạn Hàn Quốc', category: 'Lãng mạn Hàn Quốc', isTop10: false },
    { title: 'Thịnh hành', category: 'Thịnh hành', isTop10: false }
  ];

  return (
    <>
      <Navbar onToggleFilter={() => setIsFilterOpen(!isFilterOpen)} />
      <FilterModal isActive={isFilterOpen} onToggle={() => setIsFilterOpen(!isFilterOpen)} />

      {/* HERO BANNER (Dynamic Carousel) */}
      <HeroSlider images={heroMovies} />

      <main className="movie-sections">
        {/* 1. TIẾP TỤC XEM - Dùng Poster Ngang */}
        {isLoggedIn && continueWatching.length > 0 && (
          <MovieRow title="Tiếp tục xem">
            {continueWatching.map((m, i) => (
              <MovieCardHorizontal key={i} movie={m} />
            ))}
          </MovieRow>
        )}

        {/* 2. ĐỀ XUẤT CHO BẠN - Từ bảng GOI_Y_PHIM */}
        {isLoggedIn && recommendations.length > 0 && (
          <MovieRow title="Đề xuất cho bạn">
            {recommendations.map((movie, idx) => (
              <MovieCardVertical key={`rec-${idx}`} index={idx} movie={movie} showMatch={true} />
            ))}
          </MovieRow>
        )}

        {/* Dynamic rows */}
        {rows.map((row, index) => {
          let rowMovies = movies.filter(m => m.genres && m.genres.includes(row.category));

          if (row.limit) rowMovies = rowMovies.slice(0, row.limit);
          if (!rowMovies || rowMovies.length === 0) return null;

          return (
            <MovieRow key={index} title={row.title} isTop10={row.isTop10}>
              {rowMovies.map((movie, idx) => (
                <MovieCardVertical key={`${row.title}-${idx}`} index={idx} movie={movie} isTop10={row.isTop10} />
              ))}
            </MovieRow>
          );
        })}
      </main>

      <Footer />
    </>
  );
};

export default Home;
