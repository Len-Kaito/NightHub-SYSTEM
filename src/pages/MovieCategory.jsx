import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FilterModal from '../components/FilterModal';
import HeroSlider from '../components/HeroSlider';
import MovieRow from '../components/MovieRow';
import MovieCardVertical from '../components/MovieCardVertical';
import { useContent } from '../context/ContentContext';
import { movieRows, tvShowRows, animeRows, docRows, movieHero, tvHero, animeHero, docHero } from '../data/movieData';

// Map slug → thông tin danh mục, dùng title của row để lọc phim đã được gán danh mục
const CATEGORY_MAP = {
  'dien-anh': { title: 'Phim Điện Ảnh', rows: movieRows, heroIds: movieHero },
  'truyen-hinh': { title: 'Phim Truyền Hình', rows: tvShowRows, heroIds: tvHero },
  'hoat-hinh': { title: 'Phim Hoạt Hình', rows: animeRows, heroIds: animeHero },
  'tai-lieu': { title: 'Phim Tài Liệu', rows: docRows, heroIds: docHero },
};

const MovieCategory = () => {
  const { category } = useParams();
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [filters, setFilters] = useState({ region: 'Tất cả', genre: 'Tất cả', year: 'Tất cả', sort: 'Phổ biến nhất' });
  const { movies } = useContent();

  const categoryId = category || 'dien-anh';
  const data = CATEGORY_MAP[categoryId] || CATEGORY_MAP['dien-anh'];

  // Lấy ngẫu nhiên 5 phim thuộc danh mục này làm Hero Slider
  const heroMovies = React.useMemo(() => {
    const categoryMovies = movies.filter(m => m.category === categoryId);
    // Xáo trộn ngẫu nhiên (Fisher-Yates hoặc sort) và lấy 5
    return [...categoryMovies].sort(() => 0.5 - Math.random()).slice(0, 5);
  }, [movies, categoryId]);

  return (
    <>
      <Navbar onToggleFilter={() => setIsFilterActive(!isFilterActive)} />
      <FilterModal isActive={isFilterActive} onToggle={() => setIsFilterActive(!isFilterActive)} />

      {heroMovies.length > 0 && <HeroSlider images={heroMovies} />}

      <main className="movie-sections" style={{ marginTop: heroMovies.length > 0 ? undefined : '80px' }}>
        <h1 className="section-title" style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px' }}>{data.title}</h1>

        <div className="quick-filters" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {[
            { key: 'region', label: 'Khu vực', options: ['Tất cả', 'Việt Nam', 'Âu Mỹ', 'Hàn Quốc', 'Nhật Bản', 'Trung Quốc'] },
            { key: 'genre', label: 'Thể loại', options: ['Tất cả', 'Hành động', 'Tình cảm', 'Kinh dị', 'Hài hước', 'Viễn tưởng'] },
            { key: 'year', label: 'Năm', options: ['Tất cả', '2025', '2024', '2023', '2022', 'Trước 2022'] },
            { key: 'sort', label: 'Sắp xếp', options: ['Phổ biến nhất', 'Mới cập nhật', 'Đánh giá cao', 'Nhiều lượt xem'] },
          ].map(f => (
            <select
              key={f.key}
              className="filter-select"
              style={{ width: 'auto', padding: '8px 32px 8px 12px', fontSize: '13px' }}
              value={filters[f.key]}
              onChange={e => setFilters({ ...filters, [f.key]: e.target.value })}
            >
              {f.options.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>

        {data.rows.map((row, i) => {
          // Lọc phim từ Context (chứa DB movies đã được map với danh mục gốc)
          const rowMovies = movies.filter(m => m.genres && m.genres.includes(row.title));
          if (!rowMovies || rowMovies.length === 0) return null;
          return (
            <MovieRow key={i} title={row.title}>
              {rowMovies.map((movie, idx) => (
                <MovieCardVertical key={`${row.title}-${idx}`} index={idx} movie={movie} />
              ))}
            </MovieRow>
          );
        })}
      </main>

      <Footer />
    </>
  );
};

export default MovieCategory;
