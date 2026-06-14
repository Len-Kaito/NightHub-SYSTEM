import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, profileService } from '../services/api';

export const AVATARS = [
  'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/9rdo8k24_asset24x.webp',
  'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/5k104vv9_asset34x.webp',
  'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/6qpy3mtk_asset44x.webp',
  'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/cy48bhoe_asset54x.webp',
  'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/7634rbqo_asset74x.webp',
  'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/qd2hhjm8_asset84x.webp',
  'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/9tn0n6qa_asset94x.webp'
];

const INITIAL_PROFILES = [
  { id: 1, name: "Nguyễn Văn A", avatarUrl: AVATARS[0], gender: "nam", isKids: false, pin: null }
];

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    // --- AUTHENTICATION STATE ---
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('nighthub_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('nighthub_jwt'));

    const login = (token, userData) => {
        localStorage.setItem('nighthub_jwt', token);
        localStorage.setItem('nighthub_user', JSON.stringify(userData));
        setUser(userData);
        setIsLoggedIn(true);
    };

    const logout = () => {
        localStorage.removeItem('nighthub_jwt');
        localStorage.removeItem('nighthub_user');
        setUser(null);
        setIsLoggedIn(false);
    };

    // --- PROFILES STATE (Phase 4) ---
    const [profiles, setProfiles] = useState([]);
    
    const [activeProfileId, setActiveProfileIdState] = useState(() => {
        return localStorage.getItem('nighthub_active_profile_id') || null;
    });

    const loadProfiles = async () => {
        try {
            const data = await profileService.getProfiles();
            setProfiles(data);
            if (data.length > 0) {
                const current = localStorage.getItem('nighthub_active_profile_id');
                if (!current || !data.find(p => p.id === current)) {
                    setActiveProfileIdState(data[0].id);
                }
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách hồ sơ:', err);
        }
    };

    // Validate token on initial load
    useEffect(() => {
        if (isLoggedIn) {
            authService.getMe()
                .then(data => {
                    setUser(data);
                    localStorage.setItem('nighthub_user', JSON.stringify(data));
                    loadProfiles(); // Tải profile ngay sau khi đăng nhập
                })
                .catch(err => {
                    console.error('Session expired or invalid token:', err);
                    logout();
                });
        } else {
            setProfiles([]);
            setActiveProfileIdState(null);
        }
    }, [isLoggedIn]);

    // --- PLAYER SETTINGS ---
    const [showSkipIntro, setShowSkipIntro] = useState(() => {
        const saved = localStorage.getItem('nighthub_skip_intro');
        return saved !== 'false';
    });

    const [autoPlayNext, setAutoPlayNext] = useState(() => {
        const saved = localStorage.getItem('nighthub_autoplay_next');
        return saved !== 'false';
    });

    const [subtitleSize, setSubtitleSize] = useState(() => {
        return localStorage.getItem('nighthub_subtitle_size') || 'medium';
    });

    // Backwards compatibility for avatar
    const [currentAvatar, setCurrentAvatarState] = useState('');

    useEffect(() => {
        if (activeProfileId) {
            localStorage.setItem('nighthub_active_profile_id', activeProfileId);
            const activeProfile = profiles.find(p => p.id === activeProfileId);
            if (activeProfile) {
                setCurrentAvatarState(activeProfile.avatarUrl);
                localStorage.setItem('nighthub_avatar', activeProfile.avatarUrl);
            }
        }
    }, [activeProfileId, profiles]);

    const setAvatar = async (url) => {
        if (activeProfileId) {
            await updateProfile(activeProfileId, { avatarUrl: url });
        }
    };

    useEffect(() => { localStorage.setItem('nighthub_skip_intro', showSkipIntro); }, [showSkipIntro]);
    useEffect(() => { localStorage.setItem('nighthub_autoplay_next', autoPlayNext); }, [autoPlayNext]);
    useEffect(() => { localStorage.setItem('nighthub_subtitle_size', subtitleSize); }, [subtitleSize]);

    const switchProfile = (id) => {
        const profile = profiles.find(p => p.id === id);
        if (profile) setActiveProfileIdState(id);
    };

    const addProfile = async (profileData) => {
        await profileService.createProfile(profileData);
        await loadProfiles();
    };

    const updateProfile = async (id, updatedData) => {
        await profileService.updateProfile(id, updatedData);
        await loadProfiles();
    };

    const deleteProfile = async (id) => {
        await profileService.deleteProfile(id);
        await loadProfiles();
    };

    return (
        <UserContext.Provider value={{ 
            user, isLoggedIn, login, logout,
            currentAvatar, setAvatar,
            profiles, activeProfileId, 
            switchProfile, addProfile, updateProfile, deleteProfile,
            showSkipIntro, setShowSkipIntro,
            autoPlayNext, setAutoPlayNext,
            subtitleSize, setSubtitleSize
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within a UserProvider');
    return context;
};
