import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { rewardsAPI, achievementsAPI, usersAPI } from '../services/api';

const GamificationContext = createContext(null);

/**
 * GamificationProvider - Global state for gamification features
 * Manages XP animations, achievements, streak tracking, and daily rewards
 */
export const GamificationProvider = ({ children }) => {
    // User gamification state
    const [userXP, setUserXP] = useState(0);
    const [userRank, setUserRank] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [tier, setTier] = useState('Data Apprentice');

    // Animation states
    const [xpAnimation, setXpAnimation] = useState(null); // { amount: number }
    const [newAchievements, setNewAchievements] = useState([]);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [previousTier, setPreviousTier] = useState(null);

    // Daily reward state
    const [dailyRewardAvailable, setDailyRewardAvailable] = useState(false);
    const [showDailyReward, setShowDailyReward] = useState(false);

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Load initial user data
    const loadUserData = useCallback(async () => {
        try {
            const response = await usersAPI.getMe();
            const userData = response.data;

            setUserXP(userData.total_xp || 0);
            setUserRank(userData.rank || 0);
            setCurrentStreak(userData.streak?.currentStreak || 0);
            setLongestStreak(userData.streak?.longestStreak || 0);
            setTier(userData.tier || 'Data Apprentice');

            // Update localStorage for components that read directly
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({
                ...storedUser,
                total_xp: userData.total_xp,
                tier: userData.tier,
                rank: userData.rank
            }));
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }, []);

    // Check daily reward status
    const checkDailyReward = useCallback(async () => {
        try {
            const response = await rewardsAPI.getDailyReward();
            setDailyRewardAvailable(!response.data.claimed);

            // Auto-show modal if reward is available
            if (!response.data.claimed) {
                setShowDailyReward(true);
            }
        } catch (error) {
            console.error('Failed to check daily reward:', error);
        }
    }, []);

    // Load notifications
    const loadNotifications = useCallback(async () => {
        try {
            const response = await achievementsAPI.getNotifications();
            setNotifications(response.data || []);
            setUnreadCount(response.data.filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }, []);

    // Initial load
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadUserData();
            checkDailyReward();
            loadNotifications();
        }
    }, [loadUserData, checkDailyReward, loadNotifications]);

    // Trigger XP gain animation
    const showXPGain = useCallback((amount) => {
        setXpAnimation({ amount, id: Date.now() });

        // Update XP locally
        setUserXP(prev => {
            const newXP = prev + amount;

            // Check for tier change
            const newTier = calculateTier(newXP);
            if (newTier !== tier) {
                setPreviousTier(tier);
                setTier(newTier);
                setShowLevelUp(true);
            }

            return newXP;
        });

        // Clear animation after delay
        setTimeout(() => setXpAnimation(null), 3000);
    }, [tier]);

    // Add achievement notification
    const addAchievement = useCallback((achievement) => {
        setNewAchievements(prev => [...prev, achievement]);
    }, []);

    // Clear achievement from queue
    const clearAchievement = useCallback((achievementId) => {
        setNewAchievements(prev => prev.filter(a => a.id !== achievementId));
    }, []);

    // Claim daily reward
    const claimDailyReward = useCallback(async () => {
        try {
            const response = await rewardsAPI.claimDailyReward();
            setDailyRewardAvailable(false);

            // Show XP gain animation
            if (response.data.reward?.type === 'xp') {
                showXPGain(response.data.reward.value);
            }

            return response.data;
        } catch (error) {
            console.error('Failed to claim daily reward:', error);
            throw error;
        }
    }, [showXPGain]);

    // Mark notification as read
    const markNotificationRead = useCallback(async (notificationId) => {
        try {
            await achievementsAPI.markNotificationRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification read:', error);
        }
    }, []);

    // Calculate tier from XP
    const calculateTier = (xp) => {
        if (xp >= 10000) return 'Data Master';
        if (xp >= 5000) return 'Code Sorcerer';
        if (xp >= 2000) return 'Pipeline Builder';
        return 'Data Apprentice';
    };

    const value = {
        // User state
        userXP,
        userRank,
        currentStreak,
        longestStreak,
        tier,

        // Animation states
        xpAnimation,
        newAchievements,
        showLevelUp,
        previousTier,

        // Daily reward
        dailyRewardAvailable,
        showDailyReward,
        setShowDailyReward,

        // Notifications
        notifications,
        unreadCount,

        // Actions
        showXPGain,
        addAchievement,
        clearAchievement,
        claimDailyReward,
        markNotificationRead,
        loadUserData,
        setShowLevelUp
    };

    return (
        <GamificationContext.Provider value={value}>
            {children}
        </GamificationContext.Provider>
    );
};

// Hook to use gamification context
export const useGamification = () => {
    const context = useContext(GamificationContext);
    if (!context) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
};

export default GamificationContext;
