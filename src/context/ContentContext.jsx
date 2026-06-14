import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { movieService, watchHistoryService, myListService, recommendService } from '../services/api';
import { AVATARS, useUser } from './UserContext';
import mockMoviesData, { homeRows, movieRows, tvShowRows, animeRows, docRows } from '../data/movieData'; 

const ContentContext = createContext(null);

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

// --- DEMO USER PROFILES (for comment avatar click) ---
export const DEMO_USERS = {
  'Mê xem phim': {
    name: 'Mê xem phim',
    avatar: AVATARS[2],
    bio: 'Mê phim từ nhỏ, review phim mỗi ngày 🎬',
    joined: 'Tháng 3, 2024',
    favorites: ['Hành động', 'Kinh dị', 'Hoạt hình'],
    totalComments: 148,
    showActivity: true,  
  },
  'TranBao99': {
    name: 'TranBao99',
    avatar: AVATARS[5],
    bio: '',
    joined: 'Tháng 8, 2024',
    favorites: ['Tâm lý', 'Khoa học viễn tưởng'],
    totalComments: 52,
    showActivity: false,  
  },
};



const mockInitialComments = {
  '1': [
    { id: 'c1', author: 'Mê xem phim', time: '2 giờ trước', text: 'Phim quá đỉnh, phần kỹ xảo làm cực kỳ mãn nhãn. Kịch bản có chiều sâu hơn mình kỳ vọng! Rất đáng xem lại lần 2.', likes: 245, avatar: AVATARS[2], replies: [] },
    { id: 'c2', author: 'TranBao99', time: '5 giờ trước', text: 'Đoạn cuối hơi rush một xíu nhưng tổng thể thì đạo diễn vẫn quá xuất sắc.', likes: 120, avatar: AVATARS[5], replies: [] }
  ]
};

export const ContentProvider = ({ children }) => {
  const [movies, setMovies] = useState([]);
  const { activeProfileId, isLoggedIn, profiles } = useUser();

  
  useEffect(() => {
    // Tạo map các danh mục của phim mock từ các hàng (rows)
    const mockGenresMap = {};
    const allRows = [...homeRows, ...movieRows, ...tvShowRows, ...animeRows, ...docRows];
    allRows.forEach(row => {
      row.movies.forEach(id => {
        if (!mockGenresMap[id]) mockGenresMap[id] = [];
        if (!mockGenresMap[id].includes(row.title)) {
          mockGenresMap[id].push(row.title);
        }
      });
    });

    // Lấy phim hoàn toàn từ API thật (Oracle Database)
    movieService.getAllMovies()
      .then(dbMovies => {
        const enrichedDbMovies = dbMovies.map(m => {
           // Tự động nội suy đường dẫn ảnh ngang
           const posterExt = m.poster.lastIndexOf('.');
           let posterHoriz = m.poster;
           if (posterExt !== -1) {
             const base = m.poster.substring(0, posterExt);
             const ext = m.poster.substring(posterExt);
             posterHoriz = `${base} _ ngang${ext}`;
           }

           return { 
             ...m,
             posterVertical: m.poster,
             posterHorizontal: posterHoriz,
             backdropUrl: posterHoriz
           };
        });

        // Chỉ sử dụng phim từ Database để đảm bảo dữ liệu chuẩn xác
        setMovies(enrichedDbMovies);
      })
      .catch(err => {
        console.error("Failed to load movies from API:", err);
        setMovies([]); // Fallback an toàn, không dùng mock data nữa
      });
  }, []);
  
  const [top10Movies, setTop10Movies] = useState([]);
  useEffect(() => {
    const fetchTop10 = async () => {
      try {
        const data = await movieService.getTop10Movies();
        setTop10Movies(data);
      } catch (err) {
        console.error("Lỗi khi fetch Top 10 movies:", err);
      }
    };
    fetchTop10();
  }, []);

  const [myList, setMyList] = useState([]);
  const [comments, setComments] = useState(mockInitialComments);

  const loadMyList = useCallback(async (profileId) => {
    if (!profileId) {
      setMyList([]);
      return;
    }
    try {
      const list = await myListService.getMyList(profileId);
      setMyList(list);
    } catch (err) {
      console.error('Lỗi khi tải danh sách của tôi:', err);
      setMyList([]);
    }
  }, []);

  const addToMyList = async (movieId) => {
    if (!myList.includes(movieId)) {
      setMyList(prev => [...prev, movieId]);
      if (activeProfileId) {
        try {
          await myListService.addToMyList(activeProfileId, movieId);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const removeFromMyList = async (movieId) => {
    setMyList(prev => prev.filter(id => id !== movieId));
    if (activeProfileId) {
      try {
        await myListService.removeFromMyList(activeProfileId, movieId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const isInMyList = (movieId) => {
    return myList.includes(movieId);
  };

  // Helper selectors
  const getMoviesByCategory = (category) => movies.filter(m => m.genres?.includes(category));
  const getMoviesByTag = (tag) => movies.filter(m => m.tags?.includes(tag));
  const getMovieById = (id) => movies.find(m => m.id === id) || null;
  
  // --- CONTINUE WATCHING (tải từ Database theo activeProfileId) ---
  const [continueWatchingRaw, setContinueWatchingRaw] = useState([]);

  const loadWatchHistory = useCallback(async (profileId) => {
    if (!profileId) {
      setContinueWatchingRaw([]);
      return;
    }
    try {
      const data = await watchHistoryService.getWatchHistory(profileId);
      setContinueWatchingRaw(data);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử xem:', err);
      setContinueWatchingRaw([]);
    }
  }, []);

  // --- GỢI Ý PHIM (tải từ bảng GOI_Y_PHIM theo activeProfileId) ---
  const [recommendations, setRecommendations] = useState([]);

  const loadRecommendations = useCallback(async (profileId) => {
    if (!profileId) {
      setRecommendations([]);
      return;
    }
    try {
      const data = await recommendService.getRecommendations(profileId);
      setRecommendations(data);
    } catch (err) {
      console.error('Lỗi khi tải gợi ý phim:', err);
      setRecommendations([]);
    }
  }, []);

  // Tự động tải lịch sử xem, danh sách của tôi, và gợi ý phim khi đổi Hồ sơ
  useEffect(() => {
    if (isLoggedIn && activeProfileId && profiles.length > 0) {
      loadWatchHistory(activeProfileId);
      loadMyList(activeProfileId);
      loadRecommendations(activeProfileId);
    } else {
      setContinueWatchingRaw([]);
      setMyList([]);
      setRecommendations([]);
    }
  }, [isLoggedIn, activeProfileId, profiles.length, loadWatchHistory, loadMyList, loadRecommendations]);

  // Merge dữ liệu lịch sử xem từ DB với danh sách phim (movies) để có đầy đủ metadata (poster, title,...)
  const continueWatchingList = React.useMemo(() => {
    if (continueWatchingRaw.length === 0 || movies.length === 0) return [];
    return continueWatchingRaw.map(cw => {
      // Tìm phim trong danh sách movies đã merge (có cả DB + mock metadata)
      const movieMatch = movies.find(m => {
        // So sánh bằng MaPhim (dạng m_P001)
        const normalizedId = m.id?.replace('m_', '');
        return normalizedId === cw.maPhim;
      });
      if (!movieMatch) return null;
      return {
        ...movieMatch,
        maVP: cw.maVP,
        progress: cw.progress,
        remaining: cw.remaining,
        lastWatched: cw.lastWatched
      };
    }).filter(Boolean);
  }, [continueWatchingRaw, movies]);

  const getMyListMovies = () =>
    [...myList]
      .reverse()
      .map(id => movies.find(m => m.id === id))
      .filter(Boolean);

  const getCommentsForMovie = (movieId) => {
    return comments[movieId] || mockInitialComments['1'] || [];
  };

  const addComment = (movieId, commentObj) => {
    setComments(prev => ({
      ...prev,
      [movieId]: [{ ...commentObj, replies: commentObj.replies || [] }, ...(prev[movieId] || getCommentsForMovie(movieId))]
    }));
  };

  const addReply = (movieId, commentId, replyObj) => {
    setComments(prev => {
      const movieComments = prev[movieId] || getCommentsForMovie(movieId);
      const updatedComments = movieComments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), replyObj]
          };
        }
        return comment;
      });
      return { ...prev, [movieId]: updatedComments };
    });
  };

  const deleteComment = (movieId, commentId) => {
    setComments(prev => {
      const movieComments = prev[movieId] || [];
      return { ...prev, [movieId]: movieComments.filter(c => c.id !== commentId) };
    });
  };

  const deleteReply = (movieId, commentId, replyId) => {
    setComments(prev => {
      const movieComments = prev[movieId] || [];
      const updatedComments = movieComments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: (comment.replies || []).filter(r => r.id !== replyId)
          };
        }
        return comment;
      });
      return { ...prev, [movieId]: updatedComments };
    });
  };

  return (
    <ContentContext.Provider value={{
      movies,
      myList,
      continueWatching: continueWatchingList,
      recommendations,
      top10Movies,
      loadWatchHistory,
      addToMyList,
      removeFromMyList,
      isInMyList,
      getMoviesByCategory,
      getMoviesByTag,
      getMovieById,
      getMyListMovies,
      getCommentsForMovie,
      addComment,
      addReply,
      deleteComment,
      deleteReply
    }}>
      {children}
    </ContentContext.Provider>
  );
};
