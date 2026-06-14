import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FilterModal from '../components/FilterModal';
import HeroSlider from '../components/HeroSlider';
import MovieRow from '../components/MovieRow';
import MovieCardVertical from '../components/MovieCardVertical';
import { useContent } from '../context/ContentContext';
import { animeRows, animeHero } from '../data/movieData';

const Anime = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { movies } = useContent();

  const heroImages = animeRows.length > 0 
    ? movies.filter(m => m.genres && m.genres.includes(animeRows[0].title)).slice(0, 5) 
    : [];

  return (
    <>
      <Navbar onToggleFilter={() => setIsFilterOpen(!isFilterOpen)} />
      <FilterModal isActive={isFilterOpen} onToggle={() => setIsFilterOpen(!isFilterOpen)} />
      
      {heroImages.length > 0 && <HeroSlider images={heroImages} />}

      <main className="movie-sections" style={{ marginTop: heroImages.length > 0 ? undefined : '80px' }}>
        {animeRows.map((row, index) => {
          const rowMovies = movies.filter(m => m.genres && m.genres.includes(row.title));
          if (!rowMovies || rowMovies.length === 0) return null;
          return (
            <MovieRow key={index} title={row.title}>
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

export default Anime;
