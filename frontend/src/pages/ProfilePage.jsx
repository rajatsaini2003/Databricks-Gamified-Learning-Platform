import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Star,
  Zap,
  Target,
  Clock,
  Award,
  TrendingUp,
  Database,
  FileCode,
  CheckCircle2,
  Medal,
  Flame,
  Shield,
  ShoppingBag
} from 'lucide-react';
import { usersAPI } from '../services/api';
import { StreakCard } from '../components/gamification/StreakDisplay';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Get comprehensive user data from API (includes stats, streak, rank, etc.)
        const response = await usersAPI.getMe();
        setUser(response.data);
        setStats(response.data.stats);
      } catch (error) {
        console.error('Failed to load profile:', error);
        // Fallback to localStorage only on error
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Use real data from API (no hardcoded fallbacks except for safety)
  const progressData = {
    totalXp: user?.total_xp || 0,
    tier: user?.tier || 'Data Apprentice',
    rank: user?.rank || 0, // Real rank from database query
    challengesCompleted: stats?.completed_challenges || 0,
    totalChallenges: 40,
    currentStreak: user?.streak?.currentStreak || 0,  // Real streak from DB
    longestStreak: user?.streak?.longestStreak || 0,  // Real streak from DB
    timeSpent: user?.timeSpent || '0h 0m',  // Real session time from DB
    islands: {
      sql_shore: { completed: stats?.completed_challenges || 0, total: 10, xp: user?.total_xp || 0 },
      python_peninsula: { completed: 0, total: 13, xp: 0 }
    },
    recentAchievements: user?.achievements?.slice(0, 3) || [],
    badges: []  // Will be populated from achievements API
  };

  const tierInfo = {
    current: progressData.tier,
    next: progressData.tier === 'Data Apprentice' ? 'Pipeline Builder' :
      progressData.tier === 'Pipeline Builder' ? 'Code Sorcerer' :
        progressData.tier === 'Code Sorcerer' ? 'Data Master' : 'Legend',
    xpForNext: progressData.tier === 'Data Apprentice' ? 2000 :
      progressData.tier === 'Pipeline Builder' ? 5000 :
        progressData.tier === 'Code Sorcerer' ? 10000 : 20000,
    progress: (progressData.totalXp / (progressData.tier === 'Data Apprentice' ? 2000 :
      progressData.tier === 'Pipeline Builder' ? 5000 :
        progressData.tier === 'Code Sorcerer' ? 10000 : 20000)) * 100
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-slate-400">Please log in to view your profile.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-12">

      {/* Header Banner */}
      <div className="h-48 bg-gradient-to-r from-blue-900 via-slate-900 to-emerald-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-dark-bg to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-24 relative">

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">

            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl">
                {user.username?.charAt(0).toUpperCase() || 'D'}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg">
                <Trophy className="w-4 h-4 text-yellow-900" />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">{user.username || 'DataNavigator'}</h1>
                <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-xs font-medium text-blue-400">
                  {progressData.tier}
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-4">{user.email}</p>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold text-white">{progressData.totalXp.toLocaleString()}</span>
                  <span className="text-slate-500 text-sm">XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold text-white">{progressData.challengesCompleted}</span>
                  <span className="text-slate-500 text-sm">Challenges</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span className="font-bold text-white">#{progressData.rank}</span>
                  <span className="text-slate-500 text-sm">Rank</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="font-bold text-white">{progressData.currentStreak}</span>
                  <span className="text-slate-500 text-sm">Day Streak</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tier Progress */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300">Progress to {tierInfo.next}</span>
              </div>
              <span className="text-sm text-slate-400">
                {progressData.totalXp} / {tierInfo.xpForNext} XP
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tierInfo.progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Content Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['overview', 'achievements', 'stats'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize whitespace-nowrap ${activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Island Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                Island Progress
              </h3>

              <div className="space-y-4">
                {/* SQL Shore */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300">SQL Shore</span>
                    <span className="text-sm text-slate-500">
                      {progressData.islands.sql_shore.completed}/{progressData.islands.sql_shore.total}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(progressData.islands.sql_shore.completed / progressData.islands.sql_shore.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-yellow-500 mt-1">
                    +{progressData.islands.sql_shore.xp} XP earned
                  </div>
                </div>

                {/* Python Peninsula */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300">Python Peninsula</span>
                    <span className="text-sm text-slate-500">
                      {progressData.islands.python_peninsula.completed}/{progressData.islands.python_peninsula.total}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(progressData.islands.python_peninsula.completed / progressData.islands.python_peninsula.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-yellow-500 mt-1">
                    +{progressData.islands.python_peninsula.xp} XP earned
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Streak Card - Real data from API */}
            <StreakCard
              currentStreak={progressData.currentStreak}
              longestStreak={progressData.longestStreak}
              bonusesClaimed={user?.streak?.bonusesClaimed || 0}
            />

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  to="/shop"
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-lg hover:border-yellow-500/50 transition-colors"
                >
                  <ShoppingBag className="w-5 h-5 text-yellow-500" />
                  <div className="flex-1">
                    <div className="text-white font-medium">Cosmetic Shop</div>
                    <div className="text-xs text-yellow-500/70">Spend your XP on exclusive items</div>
                  </div>
                </Link>
              </div>
            </motion.div>

            {/* Recent Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Medal className="w-5 h-5 text-yellow-400" />
                Recent Achievements
              </h3>

              <div className="space-y-3">
                {progressData.recentAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg"
                  >
                    <span className="text-2xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <div className="text-white font-medium">{achievement.name}</div>
                      <div className="text-xs text-slate-500">{achievement.date}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6">All Badges</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {progressData.badges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border text-center ${badge.unlocked
                      ? 'bg-gradient-to-br from-yellow-900/20 to-transparent border-yellow-600/30'
                      : 'bg-slate-900/50 border-slate-800 opacity-50'
                      }`}
                  >
                    <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2 ${badge.unlocked
                      ? 'bg-yellow-600 text-yellow-100'
                      : 'bg-slate-800 text-slate-600'
                      }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className={`text-sm font-medium ${badge.unlocked ? 'text-white' : 'text-slate-500'}`}>
                      {badge.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {badge.unlocked ? 'Unlocked' : 'Locked'}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'stats' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {[
              { label: 'Total XP', value: progressData.totalXp.toLocaleString(), icon: Star, color: 'yellow' },
              { label: 'Challenges Completed', value: progressData.challengesCompleted, icon: CheckCircle2, color: 'emerald' },
              { label: 'Global Rank', value: `#${progressData.rank}`, icon: TrendingUp, color: 'blue' },
              { label: 'Current Streak', value: `${progressData.currentStreak} days`, icon: Flame, color: 'orange' },
              { label: 'Best Streak', value: `${progressData.longestStreak} days`, icon: Award, color: 'purple' },
              { label: 'Time Spent', value: progressData.timeSpent, icon: Clock, color: 'cyan' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              const colorClasses = {
                yellow: 'text-yellow-500 bg-yellow-500/10',
                emerald: 'text-emerald-500 bg-emerald-500/10',
                blue: 'text-blue-500 bg-blue-500/10',
                orange: 'text-orange-500 bg-orange-500/10',
                purple: 'text-purple-500 bg-purple-500/10',
                cyan: 'text-cyan-500 bg-cyan-500/10'
              };

              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[stat.color]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-slate-500">{stat.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
