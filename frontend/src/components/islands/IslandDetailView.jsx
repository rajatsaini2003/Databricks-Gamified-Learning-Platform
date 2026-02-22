import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  Star,
  Skull,
  Code2,      // For Python theme
  Anchor,     // Section 1 Icon
  Combine,    // Section 2 Icon
  Sigma,      // Section 3 Icon
  Zap,        // Section 4 Icon
  X
} from 'lucide-react';
import ChallengeList from './ChallengeList';
import { usersAPI, challengesAPI } from '../../services/api';

// Check if we're in demo mode
const isDemoMode = () => {
  const user = localStorage.getItem('user');
  return user && JSON.parse(user).isDemo === true;
};

// Base island data structure
const ISLAND_DATA = {
  'sql_shore': {
    name: 'SQL Shore',
    theme: 'blue',
    description: 'Master the tides of data manipulation.',
    sections: [
      {
        id: 'shores_of_selection',
        name: 'Shores of Selection',
        icon: Anchor,
        description: 'Learn the basics of SELECT and filtering.',
        difficulty: 1,
        status: 'unlocked'
      },
      {
        id: 'join_junction',
        name: 'Join Junction',
        icon: Combine,
        description: 'Connect tables to reveal deeper truths.',
        difficulty: 2,
        status: 'unlocked'
      },
      {
        id: 'aggregation_atoll',
        name: 'Aggregation Atoll',
        icon: Sigma,
        description: 'Summarize data to find patterns.',
        difficulty: 3,
        status: 'unlocked'
      },
      {
        id: 'optimization_outcrop',
        name: 'Optimization Outcrop',
        icon: Zap,
        description: 'Tune your queries for speed.',
        difficulty: 4,
        status: 'locked'
      }
    ],
    boss: {
      name: 'The Query Keeper',
      required: 15
    }
  },
  'python_peninsula': {
    name: 'Python Peninsula',
    theme: 'emerald',
    description: 'Navigate the winding paths of PySpark.',
    sections: [
      { id: 'dataframe_dunes', name: 'DataFrame Dunes', icon: Code2, difficulty: 1, status: 'unlocked', description: 'Create and manipulate DataFrames.' },
      { id: 'transformation_trail', name: 'Transformation Trail', icon: Combine, difficulty: 2, status: 'locked', description: 'Transform data with PySpark.' },
      { id: 'action_archipelago', name: 'Action Archipelago', icon: Sigma, difficulty: 3, status: 'locked', description: 'Execute actions on your data.' },
      { id: 'performance_peak', name: 'Performance Peak', icon: Zap, difficulty: 4, status: 'locked', description: 'Optimize for performance.' }
    ],
    boss: {
      name: 'The Serpent of Scale',
      required: 15
    }
  }
};

const IslandDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Track navigation changes
  const [island, setIsland] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch user progress
  const fetchProgress = useCallback(async () => {
    setLoading(true);

    try {
      if (isDemoMode()) {
        // Demo mode: get progress from localStorage
        const savedProgress = JSON.parse(localStorage.getItem('demoProgress') || '{}');
        setUserProgress(savedProgress);
      } else {
        // Real user: fetch from API
        const response = await usersAPI.getProgress();
        const progressMap = {};

        if (response.data?.progress || response.data?.all) {
          const progressArray = response.data.progress || response.data.all || [];
          progressArray.forEach(p => {
            progressMap[p.challenge_id] = {
              completed: p.completed,
              score: p.score,
              best_score: p.best_score,
              attempts: p.attempts,
              section_id: p.section_id,  // Include section_id for matching
              island_id: p.island_id     // Include island_id for potential future use
            };
          });
        }
        setUserProgress(progressMap);
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
      setUserProgress({});
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh when component mounts or when navigating back
  useEffect(() => {
    fetchProgress();
  }, [location.key, fetchProgress]);

  // Calculate section progress from userProgress
  // The userProgress is keyed by challenge_id and the API also returns section_id for each progress entry
  const calculateSectionProgress = (sectionId) => {
    // Count completed challenges for this section from userProgress
    let completed = 0;
    let xp = 0;
    let total = 5; // Default challenges per section

    // The userProgress is a map of challenge_id -> progress
    // We need to check the section_id that was stored when fetching progress
    Object.entries(userProgress).forEach(([challengeId, progress]) => {
      // Check if this challenge belongs to the current section
      // The progress object includes section_id from the API
      if (progress?.section_id === sectionId) {
        total = Math.max(total, 1); // At least 1 challenge exists
        if (progress?.completed) {
          completed++;
          xp += progress.best_score || progress.score || 0;
        }
      }
    });

    return { completed, xp, total };
  };

  // Build island data with progress
  useEffect(() => {
    const baseData = ISLAND_DATA[id];
    if (!baseData) {
      setIsland(null);
      return;
    }

    // Update sections with real progress
    const updatedSections = baseData.sections.map(section => {
      const { completed, xp, total } = calculateSectionProgress(section.id);
      return {
        ...section,
        completed,
        xp,
        total: total || 5 // Default to 5 if no challenges found
      };
    });

    setIsland({ ...baseData, sections: updatedSections });
  }, [id, userProgress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading island data...</p>
        </div>
      </div>
    );
  }

  if (!island) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-xl mb-4">Island not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
          >
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  const totalCompleted = island.sections.reduce((acc, sec) => acc + (sec.completed || 0), 0);
  const totalChallenges = island.sections.reduce((acc, sec) => acc + (sec.total || 5), 0);
  const themeColor = island.theme === 'blue' ? 'text-blue-400' : 'text-emerald-400';
  const gradient = island.theme === 'blue' ? 'from-blue-500 to-cyan-500' : 'from-emerald-500 to-teal-500';

  return (
    <div className="min-h-screen bg-slate-900 text-white relative overflow-hidden">

      {/* Background Elements */}
      <div className={`absolute top-0 left-0 w-full h-96 bg-gradient-to-b ${gradient} opacity-10 blur-3xl`} />

      {/* Header */}
      <div className="relative z-10 px-6 py-6 max-w-5xl mx-auto flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Map
        </button>

        <div className="flex flex-col items-end">
          <h1 className="text-2xl font-bold">{island.name}</h1>
          <div className="text-sm text-slate-400 flex items-center gap-2">
            Progress: <span className={themeColor}>{totalCompleted}/{totalChallenges}</span>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${gradient}`}
                style={{ width: `${(totalCompleted / totalChallenges) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Path Container */}
      <div className="relative z-10 max-w-4xl mx-auto py-12 px-4">

        {/* Connecting Line (SVG) */}
        <div className="absolute left-1/2 top-20 bottom-20 w-1 -translate-x-1/2 z-0 hidden md:block">
          <svg className="h-full w-full overflow-visible">
            <motion.path
              d={`M 0 0 V 800`}
              stroke="url(#lineGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="10 10"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2 }}
            />
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="space-y-16 relative z-10">
          {island.sections.map((section, index) => (
            <SectionNode
              key={section.id}
              section={section}
              index={index}
              isRight={index % 2 !== 0}
              onSelect={() => setSelectedSection(section)}
              theme={island.theme}
            />
          ))}

          {/* Boss Node */}
          <BossNode
            boss={island.boss}
            totalCompleted={totalCompleted}
            theme={island.theme}
          />
        </div>
      </div>

      {/* Challenge List Modal */}
      <AnimatePresence>
        {selectedSection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl p-6 relative"
            >
              <button
                onClick={() => setSelectedSection(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-2xl font-bold text-white mb-2">{selectedSection.name}</h2>
              <p className="text-slate-400 mb-6">{selectedSection.description}</p>

              <ChallengeList
                sectionId={selectedSection.id}
                sectionName={selectedSection.name}
                userProgress={userProgress}
                onClose={() => setSelectedSection(null)}
                islandId={id}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

const SectionNode = ({ section, index, isRight, onSelect, theme }) => {
  const isLocked = section.status === 'locked';
  const Icon = section.icon;
  const colorClass = theme === 'blue' ? 'bg-blue-500' : 'bg-emerald-500';
  const glowClass = theme === 'blue' ? 'shadow-blue-500/20' : 'shadow-emerald-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, x: 0, y: 50 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`flex items-center ${isRight ? 'md:flex-row-reverse' : ''} justify-center md:justify-between gap-8 w-full`}
    >
      {/* Node Visual */}
      <div className="relative group cursor-pointer" onClick={!isLocked ? onSelect : undefined}>
        {/* Ping animation for unlocked current level */}
        {section.status === 'unlocked' && (
          <div className={`absolute -inset-4 rounded-full ${colorClass} opacity-20 animate-ping`} />
        )}

        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all duration-300 transform group-hover:scale-110 border-2 ${isLocked ? 'bg-slate-800 border-slate-700' : `${colorClass} border-white/20 ${glowClass}`}`}>
          {isLocked ? <Lock className="w-8 h-8 text-slate-500" /> : <Icon className="w-9 h-9" />}
        </div>

        {/* Progress Badge */}
        {!isLocked && (
          <div className="absolute -top-2 -right-2 bg-slate-900 text-xs font-bold px-2 py-1 rounded-full border border-slate-700 flex items-center gap-1">
            {section.completed === section.total ? (
              <CheckCircle2 className="w-3 h-3 text-green-400" />
            ) : (
              <span className="text-slate-300">{section.completed}/{section.total}</span>
            )}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className={`bg-slate-800/50 backdrop-blur-md border border-slate-700 p-5 rounded-xl flex-1 max-w-sm hover:bg-slate-800 transition-colors cursor-pointer ${isLocked ? 'opacity-50' : ''}`} onClick={!isLocked ? onSelect : undefined}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg">{section.name}</h3>
          <div className="flex gap-0.5">
            {[...Array(section.difficulty)].map((_, i) => (
              <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            ))}
          </div>
        </div>
        <p className="text-sm text-slate-400">{section.description}</p>
        {!isLocked && (
          <div className="mt-3 flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="bg-slate-900 px-2 py-1 rounded">XP: {section.xp}</span>
            {section.status === 'unlocked' && <span className="text-blue-400 animate-pulse">● Available</span>}
          </div>
        )}
      </div>

      {/* Spacer for centering in desktop layout */}
      <div className="hidden md:block flex-1 max-w-sm" />

    </motion.div>
  );
};

const BossNode = ({ boss, totalCompleted, theme }) => {
  const isLocked = totalCompleted < boss.required;
  const colorClass = theme === 'blue' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-purple-500/10 border-purple-500/50 text-purple-400';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="flex flex-col items-center justify-center mt-8 pb-12"
    >
      <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center mb-4 relative ${isLocked ? 'border-slate-700 bg-slate-800' : `${colorClass} shadow-2xl animate-pulse`}`}>
        {isLocked ? (
          <Skull className="w-10 h-10 text-slate-600" />
        ) : (
          <Skull className="w-12 h-12" />
        )}

        {/* Boss unlock progress ring could go here */}
      </div>

      <h3 className={`text-xl font-bold mb-1 ${isLocked ? 'text-slate-500' : 'text-white'}`}>
        {boss.name}
      </h3>

      {isLocked ? (
        <span className="text-sm text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
          Unlocks at {boss.required} Completed Challenges
        </span>
      ) : (
        <button className="mt-2 btn-primary bg-red-600 hover:bg-red-700 animate-bounce-slow">
          Enter Boss Battle
        </button>
      )}
    </motion.div>
  );
};

export default IslandDetailView;
