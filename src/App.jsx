import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import { ContentProvider } from './context/ContentContext';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import WatchMovie from './pages/WatchMovie';
import MyList from './pages/MyList';
import MovieCategory from './pages/MovieCategory';
import Movies from './pages/Movies';
import TVShows from './pages/TVShows';
import Anime from './pages/Anime';
import Documentaries from './pages/Documentaries';
import Profile from './pages/Profile';
import SwitchProfile from './pages/SwitchProfile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ChooseGenre from './pages/ChooseGenre';
import SearchResults from './pages/SearchResults';
import ChatBubble from './components/ui/ChatBubble';
import ScrollToTop from './components/ScrollToTop';
import './index.css';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMovies from './pages/admin/AdminMovies';
import AdminAds from './pages/admin/AdminAds';
import AdminModeration from './pages/admin/AdminModeration';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLiveChat from './pages/admin/AdminLiveChat';
import AdminLogs from './pages/admin/AdminLogs';
import { Navigate } from 'react-router-dom';

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <ContentProvider>
          <ToastProvider>
            <ChatProvider>
              <Router>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/movies" element={<Movies />} />
                  <Route path="/tv-shows" element={<TVShows />} />
                  <Route path="/anime" element={<Anime />} />
                  <Route path="/documentaries" element={<Documentaries />} />
                  <Route path="/movie/:id" element={<MovieDetail />} />
                  <Route path="/watch/:id" element={<WatchMovie />} />
                  <Route path="/my-list" element={<MyList />} />
                  <Route path="/category/:category" element={<MovieCategory />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/switch-profile" element={<SwitchProfile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/choose-genre" element={<ChooseGenre />} />
                  <Route path="/search" element={<SearchResults />} />
                  
                  {/* ADMIN ROUTES */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="movies" element={<AdminMovies />} />
                    <Route path="ads" element={<AdminAds />} />
                    <Route path="moderation" element={<AdminModeration />} />
                    <Route path="chat" element={<AdminLiveChat />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="logs" element={<AdminLogs />} />
                  </Route>

                  <Route path="*" element={<Home />} />
                </Routes>
                <ChatBubble />
              </Router>
            </ChatProvider>
          </ToastProvider>
        </ContentProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
