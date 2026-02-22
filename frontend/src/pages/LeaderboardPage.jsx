import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Crown,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Calendar,
  Search
} from 'lucide-react';
import { leaderboardAPI } from '../services/api';

const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const response = await leaderboardAPI.getGlobal({ limit: 50 });
        setLeaderboard(response.data.leaderboard || response.data);

        // Try to get user's rank
        try {
          const rankResponse = await leaderboardAPI.getMyRank();
          setUserRank(rankResponse.data.user?.rank || 0);
        } catch {
          // Set rank to 0 if unavailable
          setUserRank(0);
        }
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        // Don't use hardcoded fallback - show empty state
        setLeaderboard([]);
        setUserRank(0);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-slate-400 font-mono">{rank}</span>;
  };

  const getRankChange = (change) => {
    if (change > 0) return <span className="flex items-center gap-1 text-emerald-400 text-xs"><TrendingUp className="w-3 h-3" />+{change}</span>;
    if (change < 0) return <span className="flex items-center gap-1 text-red-400 text-xs"><TrendingDown className="w-3 h-3" />{change}</span>;
    return <span className="flex items-center gap-1 text-slate-500 text-xs"><Minus className="w-3 h-3" />0</span>;
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Data Master': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'Code Sorcerer': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'Pipeline Builder': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg py-8">
      <div className="max-w-4xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 mb-4"
          >
            <Trophy className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-slate-400">Compete with fellow Data Navigators</p>
        </div>

        {/* Your Rank Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-900/50 to-emerald-900/50 border border-blue-500/30 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                {currentUser.username?.charAt(0) || 'Y'}
              </div>
              <div>
                <div className="text-white font-semibold">{currentUser.username || 'You'}</div>
                <div className="text-sm text-slate-400">Your current position</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">#{userRank}</div>
              <div className="text-sm text-emerald-400 flex items-center gap-1 justify-end">
                <TrendingUp className="w-3 h-3" /> +5 this week
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs and Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">

          {/* Type Tabs */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            {[
              { id: 'global', label: 'Global', icon: Trophy },
              { id: 'tier', label: 'Your Tier', icon: Users },
              { id: 'weekly', label: 'Weekly', icon: Calendar }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48"
            />
          </div>
        </div>

        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-center gap-4 mb-8"
        >
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xl font-bold mb-2 ring-4 ring-slate-400/30">
              {leaderboard[1]?.username?.charAt(0) || 'Q'}
            </div>
            <div className="text-white font-semibold text-sm">{leaderboard[1]?.username}</div>
            <div className="text-slate-400 text-xs">{(leaderboard[1]?.total_xp || leaderboard[1]?.xp || 0).toLocaleString()} XP</div>
            <div className="mt-2 w-20 h-16 bg-slate-700 rounded-t-lg flex items-center justify-center">
              <Medal className="w-8 h-8 text-slate-300" />
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Crown className="w-8 h-8 text-yellow-400 mb-2" />
            </motion.div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold mb-2 ring-4 ring-yellow-400/30">
              {leaderboard[0]?.username?.charAt(0) || 'D'}
            </div>
            <div className="text-white font-bold">{leaderboard[0]?.username}</div>
            <div className="text-yellow-400 text-sm">{(leaderboard[0]?.total_xp || leaderboard[0]?.xp || 0).toLocaleString()} XP</div>
            <div className="mt-2 w-24 h-24 bg-yellow-600/30 rounded-t-lg flex items-center justify-center">
              <Trophy className="w-10 h-10 text-yellow-400" />
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white text-xl font-bold mb-2 ring-4 ring-amber-600/30">
              {leaderboard[2]?.username?.charAt(0) || 'S'}
            </div>
            <div className="text-white font-semibold text-sm">{leaderboard[2]?.username}</div>
            <div className="text-slate-400 text-xs">{(leaderboard[2]?.total_xp || leaderboard[2]?.xp || 0).toLocaleString()} XP</div>
            <div className="mt-2 w-20 h-12 bg-amber-900/30 rounded-t-lg flex items-center justify-center">
              <Medal className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </motion.div>

        {/* Leaderboard Table */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800 border-b border-slate-700 text-xs font-medium text-slate-400 uppercase">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-5">User</div>
            <div className="col-span-3">Tier</div>
            <div className="col-span-2 text-right">XP</div>
            <div className="col-span-1 text-right">Change</div>
          </div>

          {filteredLeaderboard.slice(3).map((entry, index) => (
            <motion.div
              key={entry.username || entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors"
            >
              <div className="col-span-1 text-center">
                {getRankIcon(entry.rank || index + 4)}
              </div>
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-white font-semibold">
                  {entry.username?.charAt(0) || '?'}
                </div>
                <span className="text-white font-medium">{entry.username}</span>
              </div>
              <div className="col-span-3">
                <span className={`px-2 py-1 rounded text-xs font-medium border ${getTierColor(entry.tier)}`}>
                  {entry.tier}
                </span>
              </div>
              <div className="col-span-2 text-right">
                <span className="text-white font-medium flex items-center justify-end gap-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className="text-emerald-400 font-mono font-bold">
                    {(entry.total_xp || entry.xp || 0).toLocaleString()}
                  </span>
                </span>
              </div>
              <div className="col-span-1 text-right">
                {getRankChange(entry.change || 0)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-6">
          <button className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm font-medium transition-colors">
            Load More
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
