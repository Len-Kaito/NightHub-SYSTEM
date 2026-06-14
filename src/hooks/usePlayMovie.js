import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { movieService, watchHistoryService } from '../services/api';

export const usePlayMovie = () => {
  const navigate = useNavigate();
  const { isLoggedIn, activeProfileId } = useUser();
  const { showToast } = useToast();

  const handlePlayMovie = async (movieId, maVP = null) => {
    if (!isLoggedIn) return navigate('/login');
    
    try {
      const normalizedId = movieId.replace('m_', '');
      const dbMovie = await movieService.getMovieById(normalizedId);
      const isMovieSeries = dbMovie.type === 'tvShow' || (dbMovie.videos && dbMovie.videos.length > 1);
      const targetVideo = maVP ? dbMovie.videos?.find(v => v.id === maVP || v.episodeNumber == maVP) : dbMovie.videos?.[0];
      const videoToCheck = targetVideo || dbMovie.videos?.[0];

      if (videoToCheck) {
        if (videoToCheck.requiredPlan === 'VIP') {
          if (!activeProfileId) return showToast('Vui lòng chọn hồ sơ trước khi xem.');
          await watchHistoryService.recordPlay(activeProfileId, videoToCheck.id, 0);
        }
        
        if (isMovieSeries) {
          navigate(`/watch/${movieId}?ep=${videoToCheck.episodeNumber}`);
        } else {
          navigate(`/watch/${movieId}`);
        }
      } else {
        navigate(`/watch/${movieId}`);
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi kiểm tra quyền xem.');
    }
  };

  return handlePlayMovie;
};
