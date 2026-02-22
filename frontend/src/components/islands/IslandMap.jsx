import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Database, FileCode, Lock, Trophy, Skull, Map as MapIcon } from 'lucide-react';
import { usersAPI, challengesAPI } from '../../services/api';

// Check if we're in demo mode
const isDemoMode = () => {
  const user = localStorage.getItem('user');
  return user && JSON.parse(user).isDemo === true;
};

// Base island definitions (structure without progress data)
const BASE_ISLANDS = [
  {
    id: 'sql_shore',
    name: 'SQL Shore',
    description: 'Master the tides of data manipulation and queries.',
    theme: 'sql',
    icon: Database,
    gradient: 'from-blue-400 to-cyan-600',
    requiredXP: 0 // Always unlocked
  },
  {
    id: 'python_peninsula',
    name: 'Python Peninsula',
    description: 'Navigate the winding paths of PySpark and algorithms.',
    theme: 'python',
    icon: FileCode,
    gradient: 'from-emerald-400 to-teal-600',
    requiredXP: 500 // Requires 500 XP to unlock
  }
];

const IslandMap = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Track route changes
  const [islands, setIslands] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIslandProgress = useCallback(async () => {
    setLoading(true);
    console.log('fetchIslandProgress called, isDemoMode:', isDemoMode());

    try {
      // Get user's total XP
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Fetch island data from API (includes challenge counts)
      let islandData = [];
      try {
        const islandsResponse = await challengesAPI.getIslands();
        islandData = islandsResponse.data || [];
      } catch (apiError) {
        console.warn('Failed to fetch islands from API, using defaults');
      }

      if (isDemoMode()) {
        // Demo mode: use demo progress from localStorage
        const savedProgress = JSON.parse(localStorage.getItem('demoProgress') || '{}');
        console.log('IslandMap - demoProgress from localStorage:', savedProgress);

        const islandsWithProgress = BASE_ISLANDS.map(island => {
          // Get challenge count from API or default
          const apiIsland = islandData.find(i => i.id === island.id);
          const totalChallenges = apiIsland?.totalChallenges || 10;

          // Calculate progress from saved demo progress
          let completed = 0;
          let xpEarned = 0;

          Object.entries(savedProgress).forEach(([challengeId, progress]) => {
            if (challengeId.startsWith(island.id)) {
              if (progress?.completed) {
                completed++;
                xpEarned += progress.best_score || 0;
              }
            }
          });

          return {
            ...island,
            totalChallenges,
            completed,
            xpEarned,
            status: (user.total_xp || 0) >= island.requiredXP ? 'unlocked' : 'locked',
            bossAvailable: completed >= 15
          };
        });

        setIslands(islandsWithProgress);
      } else {
        // Real user: fetch progress from API
        const response = await usersAPI.getProgress();
        const progressData = response.data?.byIsland || {};

        const islandsWithProgress = BASE_ISLANDS.map(island => {
          // Get challenge count from API or default
          const apiIsland = islandData.find(i => i.id === island.id);
          const totalChallenges = apiIsland?.totalChallenges || 10;

          const islandProgress = progressData[island.id] || { completed: 0, challenges: [] };

          // Calculate XP from completed challenges
          let xpEarned = 0;
          if (islandProgress.challenges) {
            islandProgress.challenges.forEach(p => {
              if (p.completed) {
                xpEarned += p.best_score || 0;
              }
            });
          }

          return {
            ...island,
            totalChallenges,
            completed: islandProgress.completed || 0,
            xpEarned,
            status: (user.total_xp || 0) >= island.requiredXP ? 'unlocked' : 'locked',
            bossAvailable: (islandProgress.completed || 0) >= 15
          };
        });

        setIslands(islandsWithProgress);
      }
    } catch (error) {
      console.error('Failed to fetch island progress:', error);
      // Fallback: show islands with default progress
      const islandsWithProgress = BASE_ISLANDS.map(island => ({
        ...island,
        totalChallenges: 10,
        completed: 0,
        xpEarned: 0,
        status: 'unlocked',
        bossAvailable: false
      }));
      setIslands(islandsWithProgress);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh when component mounts or when navigating back to this page
  useEffect(() => {
    fetchIslandProgress();
  }, [location.key, fetchIslandProgress]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-8 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">

      {/* Background Ambience (Water effect) */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-slate-900"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight flex items-center justify-center gap-3">
          <MapIcon className="w-10 h-10 text-blue-400" />
          World Map
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Choose your path, Data Voyager. Conquer challenges to unlock new territories and defeat the guardians.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 z-10 w-full max-w-5xl">
        {islands.map((island, index) => (
          <IslandCard
            key={island.id}
            island={island}
            index={index}
            onClick={() => navigate(`/island/${island.id}`)}
          />
        ))}
      </div>
    </div>
  );
};

const IslandCard = ({ island, index, onClick }) => {
  const isLocked = island.status === 'locked';
  const progressPercent = (island.completed / island.totalChallenges) * 100;
  const isComplete = island.completed === island.totalChallenges;
  const Icon = island.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.2 }}
      whileHover={!isLocked ? { y: -10, scale: 1.02 } : {}}
      onClick={!isLocked ? onClick : undefined}
      className={`relative group cursor-pointer rounded-3xl p-1 ${isLocked ? 'grayscale opacity-70' : ''}`}
    >
      {/* Glow Effect */}
      {!isLocked && (
        <div className={`absolute inset-0 bg-gradient-to-br ${island.gradient} opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-500 rounded-3xl`} />
      )}

      {/* Card Content */}
      <div className="relative h-full bg-slate-900/80 backdrop-blur-md border border-white/10 p-8 rounded-[22px] overflow-hidden">

        {/* Island Illustration / Icon Background */}
        <div className={`absolute -right-6 -bottom-6 w-48 h-48 bg-gradient-to-br ${island.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-all duration-500`} />

        <div className="flex items-start justify-between mb-6">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${island.gradient} shadow-lg`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col items-end">
            {isComplete ? (
              <span className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
                <Trophy className="w-4 h-4" /> Completed
              </span>
            ) : (
              <span className="text-slate-400 font-mono text-sm">
                {island.completed}/{island.totalChallenges} Completed
              </span>
            )}
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
          {island.name}
        </h3>
        <p className="text-slate-400 mb-8 h-12">
          {island.description}
        </p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
            <span>Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${island.gradient}`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
            <span className="text-yellow-500">★</span> {island.xpEarned.toLocaleString()} XP Earned
          </div>

          {/* Boss Indicator */}
          {island.completed >= 15 && (
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-center gap-1 text-red-400 text-xs font-bold uppercase tracking-wider bg-red-500/10 px-2 py-1 rounded border border-red-500/20"
            >
              <Skull className="w-3 h-3" /> Boss Active
            </motion.div>
          )}
        </div>

        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-20">
            <Lock className="w-12 h-12 text-slate-400 mb-2" />
            <h3 className="text-xl font-bold text-slate-200">Locked</h3>
            <p className="text-sm text-slate-400">Complete previous islands to unlock</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default IslandMap;
