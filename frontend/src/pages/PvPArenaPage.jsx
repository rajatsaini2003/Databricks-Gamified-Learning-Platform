import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Swords,
  Trophy,
  Clock,
  Zap,
  XCircle,
  AlertCircle,
  Play,
  Search,
  Crown,
  Shield,
  Target
} from 'lucide-react';
import { pvpAPI } from '../services/api';

const PvPArenaPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('arena'); // arena, matches, leaderboard
  const [matches, setMatches] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [findingMatch, setFindingMatch] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Poll for pending match status changes - when opponent joins, auto-navigate!
  useEffect(() => {
    // Find pending matches where current user is player1 (created match)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const myPendingMatches = matches.filter(m =>
      m.status === 'pending' &&
      (m.player1_id === user.id || m.player1_id === 'demo-user-001')
    );

    if (myPendingMatches.length === 0) return;

    console.log('Starting poll for pending matches:', myPendingMatches.map(m => m.id));

    // Store pending match IDs to check against
    const pendingIds = myPendingMatches.map(m => m.id);

    const pollInterval = setInterval(async () => {
      try {
        console.log('Polling for match updates...');
        const res = await pvpAPI.getMatches();
        const updatedMatches = res.data?.matches || [];

        // Check if any of our pending matches became active
        for (const pendingId of pendingIds) {
          const updated = updatedMatches.find(m => m.id === pendingId);
          console.log('Match status check:', pendingId, updated?.status);

          if (updated && updated.status === 'active') {
            console.log('🎮 Match became ACTIVE! Navigating to battle...', updated.id);
            clearInterval(pollInterval);
            navigate(`/pvp/battle/${updated.id}`);
            return;
          }
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      console.log('Cleaning up poll interval');
      clearInterval(pollInterval);
    };
  }, [matches.length, navigate]); // Only restart when matches count changes

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'arena') {
        const [matchesRes, challengesRes] = await Promise.all([
          pvpAPI.getMatches(), // Fetch ALL matches (active + pending) so we can poll pending ones
          pvpAPI.getChallenges()
        ]);
        // Filter to show active matches in UI, but keep pending for polling
        const allMatches = matchesRes.data?.matches || [];
        setMatches(allMatches);
        setChallenges(challengesRes.data?.challenges || []);
      } else if (activeTab === 'matches') {
        const res = await pvpAPI.getMatches();
        setMatches(res.data?.matches || []);
      } else if (activeTab === 'leaderboard') {
        const res = await pvpAPI.getLeaderboard(20);
        setLeaderboard(res.data?.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to fetch PvP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatch = async (challengeId) => {
    setFindingMatch(true);
    setSelectedChallenge(challengeId);
    try {
      const res = await pvpAPI.findMatch(challengeId);
      if (res.data?.match) {
        if (res.data.match.status === 'active') {
          navigate(`/pvp/battle/${res.data.match.id}`);
        } else {
          // Match created, waiting for opponent
          fetchData();
        }
      }
    } catch (error) {
      console.error('Failed to find match:', error);
    } finally {
      setFindingMatch(false);
      setSelectedChallenge(null);
    }
  };

  const handleCancelMatch = async (matchId) => {
    try {
      await pvpAPI.cancelMatch(matchId);
      fetchData();
    } catch (error) {
      console.error('Failed to cancel match:', error);
    }
  };

  const handleJoinBattle = (matchId) => {
    navigate(`/pvp/battle/${matchId}`);
  };

  const getMatchStatusBadge = (match) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isPlayer1 = match.player1_id === user.id || match.player1_id === 'demo-user-001';

    if (match.status === 'pending') {
      return (
        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" /> Waiting for opponent
        </span>
      );
    }
    if (match.status === 'active') {
      const yourTurn = isPlayer1 ? !match.player1_submitted : !match.player2_submitted;
      return yourTurn ? (
        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs flex items-center gap-1 animate-pulse">
          <Target className="w-3 h-3" /> Your turn!
        </span>
      ) : (
        <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" /> Waiting for opponent
        </span>
      );
    }
    if (match.status === 'completed') {
      const won = match.winner_id === user.id || match.winner_id === 'demo-user-001';
      const draw = !match.winner_id;
      return draw ? (
        <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded text-xs flex items-center gap-1">
          <Shield className="w-3 h-3" /> Draw
        </span>
      ) : won ? (
        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs flex items-center gap-1">
          <Crown className="w-3 h-3" /> Victory!
        </span>
      ) : (
        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs flex items-center gap-1">
          <XCircle className="w-3 h-3" /> Defeat
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-2">
            <Swords className="w-10 h-10 text-red-400" />
            PvP Arena
          </h1>
          <p className="text-slate-400">Challenge other data voyagers in async SQL battles!</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {[
            { id: 'arena', label: 'Find Battle', icon: Search },
            { id: 'matches', label: 'My Matches', icon: Swords },
            { id: 'leaderboard', label: 'Rankings', icon: Trophy }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {/* Arena Tab - Find Battle */}
            {activeTab === 'arena' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Active Matches */}
                {matches.filter(m => m.status === 'active' || m.status === 'pending').length > 0 && (
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                      Active Battles
                    </h2>
                    <div className="space-y-3">
                      {matches.filter(m => m.status === 'active' || m.status === 'pending').map(match => (
                        <div key={match.id} className="bg-slate-900/50 rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{match.challenge_title || 'SQL Challenge'}</h3>
                            <p className="text-sm text-slate-400">
                              vs {match.player2_username || match.player1_username || 'Waiting...'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {getMatchStatusBadge(match)}
                            {match.status === 'pending' ? (
                              <button
                                onClick={() => handleCancelMatch(match.id)}
                                className="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
                              >
                                Cancel
                              </button>
                            ) : (
                              <button
                                onClick={() => handleJoinBattle(match.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 flex items-center gap-1"
                              >
                                <Play className="w-4 h-4" /> Continue
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Challenge Selection */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-400" />
                    Choose Your Battle
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {challenges.map(challenge => (
                      <motion.div
                        key={challenge.id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-blue-500 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{challenge.title}</h3>
                          <div className="flex gap-0.5">
                            {[...Array(challenge.difficulty)].map((_, i) => (
                              <Zap key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">{challenge.description}</p>
                        <button
                          onClick={() => handleFindMatch(challenge.id)}
                          disabled={findingMatch}
                          className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${findingMatch && selectedChallenge === challenge.id
                            ? 'bg-blue-600/50 cursor-wait'
                            : 'bg-blue-600 hover:bg-blue-500'
                            }`}
                        >
                          {findingMatch && selectedChallenge === challenge.id ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Finding opponent...
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4" /> Find Match
                            </>
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Matches Tab */}
            {activeTab === 'matches' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
              >
                <h2 className="text-xl font-bold mb-4">Match History</h2>
                {matches.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Swords className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No battles yet. Start your first PvP match!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.map(match => (
                      <div
                        key={match.id}
                        onClick={() => match.status !== 'pending' && handleJoinBattle(match.id)}
                        className={`bg-slate-900/50 rounded-lg p-4 flex items-center justify-between transition-colors ${match.status !== 'pending' ? 'hover:bg-slate-900 cursor-pointer' : ''
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                            <Swords className="w-6 h-6 text-slate-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{match.challenge_title || 'SQL Challenge'}</h3>
                            <p className="text-sm text-slate-400">
                              {match.player1_username} vs {match.player2_username || '???'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {match.status === 'completed' && (
                            <div className="text-right">
                              <p className="text-sm font-mono">
                                <span className="text-blue-400">{match.player1_score || 0}</span>
                                {' - '}
                                <span className="text-red-400">{match.player2_score || 0}</span>
                              </p>
                            </div>
                          )}
                          {getMatchStatusBadge(match)}
                          {match.status === 'active' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinBattle(match.id);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500"
                            >
                              Continue
                            </button>
                          )}
                          {match.status === 'completed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinBattle(match.id);
                              }}
                              className="px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
              >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  PvP Rankings
                </h2>
                <div className="space-y-2">
                  {leaderboard.map((player, index) => {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    const isYou = player.id === user.id || player.id === 'demo-user-001';

                    return (
                      <div
                        key={player.id}
                        className={`flex items-center gap-4 p-3 rounded-lg ${isYou ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-slate-900/50'
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-slate-400 text-black' :
                            index === 2 ? 'bg-orange-600 text-white' :
                              'bg-slate-700 text-slate-300'
                          }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold flex items-center gap-2">
                            {player.username}
                            {isYou && <span className="text-xs text-blue-400">(You)</span>}
                          </p>
                          <p className="text-xs text-slate-400">{player.tier}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono">
                            <span className="text-emerald-400">{player.wins}W</span>
                            {' / '}
                            <span className="text-red-400">{player.losses}L</span>
                            {player.draws > 0 && <span className="text-slate-400"> / {player.draws}D</span>}
                          </p>
                          <p className="text-xs text-slate-400">
                            {player.wins + player.losses + (player.draws || 0)} matches
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PvPArenaPage;
