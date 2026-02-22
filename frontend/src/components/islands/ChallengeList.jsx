import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlayCircle,
  CheckCircle2,
  Lock,
  Star,
  Clock,
  Trophy,
  Zap,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { challengesAPI } from '../../services/api';

const ChallengeList = ({ sectionId, sectionName, userProgress = {}, onClose }) => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch challenges for this section
  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true);
      try {
        // Try to fetch from API
        const response = await challengesAPI.getAll();
        const allChallenges = response.data?.challenges || [];

        // Filter by section_id
        const sectionChallenges = allChallenges.filter(c =>
          c.section_id === sectionId || c.sectionId === sectionId
        );

        if (sectionChallenges.length > 0) {
          setChallenges(sectionChallenges);
        } else {
          // Fallback: create demo challenges
          setChallenges(createDemoChallenges(sectionId));
        }
      } catch (error) {
        console.error('Failed to load challenges:', error);
        // Fallback to demo data
        setChallenges(createDemoChallenges(sectionId));
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [sectionId]);

  // Helper to create demo challenges if API fails
  const createDemoChallenges = (sectionId) => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: `${sectionId}_${i + 1}`,
      title: `Challenge ${i + 1}`,
      difficulty: Math.min(3, Math.floor(i / 2) + 1),
      timeEstimate: 5 + i * 2,
      xpReward: 50 + i * 25,
      orderIndex: i + 1
    }));
  };

  const getChallengeStatus = (challengeId) => {
    const progress = userProgress[challengeId];
    if (!progress) return 'available';
    if (progress.completed) return 'completed';
    if (progress.attempts > 0) return 'attempted';
    return 'available';
  };

  const handleStartChallenge = (challengeId) => {
    if (onClose) onClose();
    navigate(`/challenge/${challengeId}`);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-400">Loading challenges...</p>
      </div>
    );
  }

  if (!challenges || challenges.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>No challenges found for this section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {challenges.map((challenge, index) => {
        const status = getChallengeStatus(challenge.id);
        const progress = userProgress[challenge.id];
        const isLocked = false; // For MVP, all challenges in a section are unlocked

        return (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${isLocked
                ? 'bg-slate-900/50 border-slate-800 opacity-60'
                : status === 'completed'
                  ? 'bg-emerald-900/20 border-emerald-700/50 hover:border-emerald-600'
                  : 'bg-slate-800/50 border-slate-700 hover:border-blue-500 cursor-pointer'
              }`}
            onClick={() => !isLocked && handleStartChallenge(challenge.id)}
          >
            {/* Hover Glow */}
            {!isLocked && status !== 'completed' && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}

            <div className="relative p-4 flex items-center gap-4">
              {/* Status Icon */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${isLocked
                  ? 'bg-slate-800 text-slate-600'
                  : status === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : status === 'attempted'
                      ? 'bg-yellow-600/80 text-white'
                      : 'bg-blue-600 text-white group-hover:bg-blue-500'
                }`}>
                {isLocked ? (
                  <Lock className="w-5 h-5" />
                ) : status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : status === 'attempted' ? (
                  <RotateCcw className="w-5 h-5" />
                ) : (
                  <PlayCircle className="w-6 h-6" />
                )}
              </div>

              {/* Challenge Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-slate-500">#{challenge.orderIndex || index + 1}</span>
                  <div className="flex gap-0.5">
                    {[...Array(challenge.difficulty || 1)].map((_, i) => (
                      <Zap key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </div>

                <h4 className={`font-semibold truncate ${isLocked ? 'text-slate-500' : 'text-white'
                  }`}>
                  {challenge.title}
                </h4>

                <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~{challenge.timeEstimate || challenge.time_estimate || 5} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    {challenge.xpReward || challenge.xp_reward || 50} XP
                  </span>
                </div>
              </div>

              {/* Score/Action */}
              <div className="flex-shrink-0 text-right">
                {status === 'completed' && progress ? (
                  <div>
                    <div className="text-lg font-bold text-emerald-400">
                      {progress.best_score || progress.bestScore || progress.score}
                    </div>
                    <div className="text-xs text-slate-500">Best Score</div>
                  </div>
                ) : status === 'attempted' && progress ? (
                  <div>
                    <div className="text-lg font-bold text-yellow-400">
                      {progress.attempts}
                    </div>
                    <div className="text-xs text-slate-500">Attempts</div>
                  </div>
                ) : !isLocked ? (
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                ) : null}
              </div>
            </div>

            {/* Progress Bar */}
            {status === 'completed' && (
              <div className="h-1 bg-emerald-600" />
            )}
            {status === 'attempted' && progress && (
              <div className="h-1 bg-slate-700">
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${Math.min(100, (progress.best_score || progress.bestScore || 0) / 2)}%` }}
                />
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Section Summary */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            {Object.keys(userProgress).filter(id =>
              userProgress[id]?.completed && id.startsWith(sectionId)
            ).length} / {challenges.length} Completed
          </span>
          <span className="flex items-center gap-1 text-yellow-500">
            <Trophy className="w-4 h-4" />
            {challenges.reduce((sum, c) => {
              const prog = userProgress[c.id];
              return sum + (prog?.completed ? (c.xpReward || c.xp_reward || 0) : 0);
            }, 0)} XP Earned
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChallengeList;
