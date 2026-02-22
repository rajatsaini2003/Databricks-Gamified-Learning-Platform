import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Play,
  Send,
  RotateCcw,
  Trophy,
  Crown,
  Shield,
  XCircle,
  User,
  CheckCircle2
} from 'lucide-react';
import CodeEditor from '../components/challenge/CodeEditor';
import { sqlExecutor } from '../services/sqlExecutor';
import { pvpAPI, challengesAPI } from '../services/api';

const PvPBattlePage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();

  // Match state
  const [match, setMatch] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  // Battle state
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Results
  const [executionResult, setExecutionResult] = useState(null);
  const [validationFeedback, setValidationFeedback] = useState(null); // Track if solution was correct
  const [battleResult, setBattleResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  // Timer
  useEffect(() => {
    if (match?.status === 'active' && !hasSubmitted) {
      const interval = setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [match?.status, hasSubmitted]);

  const fetchMatch = async () => {
    setLoading(true);
    try {
      const res = await pvpAPI.getMatch(matchId);
      const matchData = res.data?.match;
      setMatch(matchData);

      // Get challenge data from API
      try {
        const challengeRes = await challengesAPI.getById(matchData?.challenge_id);
        const challengeData = challengeRes.data;
        if (challengeData) {
          // Set up validation function for expected output
          const challengeWithValidation = {
            ...challengeData,
            expectedOutput: {
              type: 'any',
              validateFn: (result) => {
                console.log('[PvP Validation] Checking result:', result);

                // Simple validation: check if query ran successfully and returned rows
                if (!result.success) {
                  console.log('[PvP Validation] FAIL - Query did not succeed');
                  return false;
                }

                // Parse expected output if it's a string
                let expected = challengeData.expected_output;
                console.log('[PvP Validation] Expected output (raw):', expected);

                if (typeof expected === 'string') {
                  try {
                    expected = JSON.parse(expected);
                    console.log('[PvP Validation] Expected output (parsed):', expected);
                  } catch (e) {
                    // If can't parse, just check for successful execution
                    console.log('[PvP Validation] Cannot parse expected, using simple check');
                    return result.success && result.rowCount > 0;
                  }
                }

                // Check row count if specified
                if (expected?.rowCount && result.rowCount !== expected.rowCount) {
                  console.log(`[PvP Validation] FAIL - Row count mismatch: ${result.rowCount} !== ${expected.rowCount}`);
                  return false;
                }

                // Check minimum row count
                if (expected?.minRowCount && result.rowCount < expected.minRowCount) {
                  console.log(`[PvP Validation] FAIL - Below min rows: ${result.rowCount} < ${expected.minRowCount}`);
                  return false;
                }

                // Check required columns
                if (expected?.requiresColumns && Array.isArray(expected.requiresColumns)) {
                  const hasAllColumns = expected.requiresColumns.every(col =>
                    result.columns?.includes(col)
                  );
                  if (!hasAllColumns) {
                    console.log('[PvP Validation] FAIL - Missing required columns');
                    return false;
                  }
                }

                // Default: successful execution with rows
                console.log('[PvP Validation] PASS - Query valid!');
                return result.success && result.rowCount > 0;
              }
            }
          };

          setChallenge(challengeWithValidation);
          setCode(challengeData.starterCode || challengeData.starter_code || '-- Write your SQL query here\n');
        }
      } catch (err) {
        console.error('Failed to fetch challenge:', err);
        setCode('-- Write your SQL query here\n');
      }

      // Check if user already submitted
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isPlayer1 = matchData?.player1_id === user.id || matchData?.player1_id === 'demo-user-001';
      if (isPlayer1 && matchData?.player1_submitted) {
        setHasSubmitted(true);
      } else if (!isPlayer1 && matchData?.player2_submitted) {
        setHasSubmitted(true);
      }

      // Check if match is already complete
      if (matchData?.status === 'completed') {
        console.log('Match is completed!', matchData);
        setBattleResult({
          winnerId: matchData.winner_id,
          player1Score: matchData.player1_score,
          player2Score: matchData.player2_score
        });
        // Don't auto-show modal when viewing past matches - let users see the battle details
        // setShowResult(true);
      }

      console.log('Match status:', matchData?.status);
      console.log('Challenge data:', challengeData);
      console.log('Has hints?', !!challengeData?.hints);

    } catch (error) {
      console.error('Failed to fetch match:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      const result = sqlExecutor.execute(code);
      setExecutionResult(result);
      setIsRunning(false);
    }, 300);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // First run the code locally for immediate feedback
    const result = sqlExecutor.execute(code);
    setExecutionResult(result);

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));

    if (!result.success) {
      setValidationFeedback({
        correct: false,
        score: 0,
        message: '❌ Syntax error in your query'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Submit to backend for REAL validation (uses Gemini AI)
      console.log('Submitting to backend for AI validation...');
      const res = await pvpAPI.submitMatch(matchId, code, 0); // Score will be calculated by backend

      console.log('Backend validation response:', res.data);

      // Use backend validation result
      if (res.data?.validation) {
        const backendValidation = res.data.validation;
        setValidationFeedback({
          correct: backendValidation.correct,
          score: res.data.score || 0,
          message: backendValidation.correct
            ? `✅ Solution Correct! Score: ${res.data.score || 0}`
            : `❌ ${backendValidation.feedback?.overall || "Solution doesn't match expected output"}`,
          feedback: backendValidation.feedback
        });
      } else {
        // Fallback if no validation in response
        setValidationFeedback({
          correct: false,
          score: 0,
          message: '❌ Validation failed - no response from backend'
        });
      }

      setHasSubmitted(true);

      if (res.data?.matchComplete) {
        setBattleResult({
          winnerId: res.data.winnerId,
          player1Score: res.data.player1Score,
          player2Score: res.data.player2Score
        });
        setShowResult(true);
      }
    } catch (error) {
      console.error('Failed to submit:', error);
      setValidationFeedback({
        correct: false,
        score: 0,
        message: '❌ Submission failed - ' + (error.message || 'network error')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isPlayer1 = match?.player1_id === user.id || match?.player1_id === 'demo-user-001';
  const yourUsername = isPlayer1 ? match?.player1_username : match?.player2_username;
  const opponentUsername = isPlayer1 ? match?.player2_username : match?.player1_username;
  const won = battleResult?.winnerId === user.id || battleResult?.winnerId === 'demo-user-001';
  const draw = battleResult && !battleResult.winnerId;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Match Not Found</h2>
          <button onClick={() => navigate('/pvp')} className="text-blue-400 hover:underline">
            Back to Arena
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* Battle Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Player 1 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-blue-400">{yourUsername || 'You'}</p>
              <p className="text-xs text-slate-400">
                {hasSubmitted ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Submitted
                  </span>
                ) : (
                  'In progress...'
                )}
              </p>
            </div>
          </div>

          {/* VS / Timer */}
          <div className="text-center">
            <div className="flex items-center gap-4">
              <Swords className="w-8 h-8 text-red-400" />
              <div className="bg-slate-700 px-4 py-2 rounded-lg">
                <p className="text-xs text-slate-400">Time</p>
                <p className="font-mono text-xl">{formatTime(timer)}</p>
              </div>
            </div>
          </div>

          {/* Player 2 */}
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold text-red-400 text-right">{opponentUsername || 'Opponent'}</p>
              <p className="text-xs text-slate-400 text-right">
                {match.status === 'pending' ? 'Waiting to join...' :
                  (isPlayer1 ? match.player2_submitted : match.player1_submitted) ?
                    <span className="text-emerald-400">Submitted</span> : 'In progress...'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Battle Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Challenge */}
        <div className="w-2/5 border-r border-slate-700 overflow-y-auto p-6">
          <h2 className="text-2xl font-bold mb-4">{challenge?.title || 'SQL Challenge'}</h2>

          {challenge?.story_context && (
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
              <p className="text-slate-300 italic">{challenge.story_context}</p>
            </div>
          )}

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Challenge:</h3>
            <p className="text-slate-300">{challenge?.description || 'Complete the SQL challenge'}</p>
          </div>

          {challenge?.tables && challenge.tables.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Available Tables:</h3>
              <div className="flex flex-wrap gap-2">
                {(typeof challenge.tables === 'string' ? JSON.parse(challenge.tables) : challenge.tables).map((table, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-700 rounded-md text-sm font-mono text-blue-400">
                    {table}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Validation Feedback - Show after submission */}
          {validationFeedback && (
            <div className={`mb-4 p-4 rounded-lg border ${validationFeedback.correct
              ? 'bg-emerald-900/20 border-emerald-500/30'
              : 'bg-red-900/20 border-red-500/30'
              }`}>
              <p className={`font-semibold ${validationFeedback.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                {validationFeedback.message}
              </p>
            </div>
          )}

          {/* Execution Result */}
          {executionResult && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Output:</h3>
              <div className={`rounded-lg p-4 ${executionResult.success ? 'bg-slate-800' : 'bg-red-900/20 border border-red-500/30'}`}>
                {executionResult.success ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {executionResult.columns?.map(col => (
                            <th key={col} className="px-2 py-1 text-left text-slate-400">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {executionResult.rows?.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-b border-slate-700/50">
                            {executionResult.columns?.map(col => (
                              <td key={col} className="px-2 py-1">{String(row[col])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-slate-400 mt-2">{executionResult.rowCount} rows</p>
                  </div>
                ) : (
                  <p className="text-red-400">{executionResult.error}</p>
                )}
              </div>
            </div>
          )}

          {/* Show Hints ONLY for completed matches - for learning */}
          {match?.status === 'completed' && challenge?.hints && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2 text-emerald-400">💡 Solution Hints (Match Complete):</h3>
              <div className="rounded-lg p-4 bg-emerald-900/10 border border-emerald-500/30">
                <p className="text-xs text-slate-400 mb-3">
                  Since the match is over, here are the hints to help you learn:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2">
                  {(typeof challenge.hints === 'string' ? JSON.parse(challenge.hints) : challenge.hints).map((hint, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-semibold text-emerald-400">Level {hint.level || i + 1}:</span> {hint.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4">
            <CodeEditor
              value={code}
              onChange={setCode}
              language="sql"
              readOnly={hasSubmitted}
            />
          </div>

          {/* Action Bar */}
          <div className="bg-slate-800 border-t border-slate-700 px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => setCode(challenge?.starterCode || '')}
              disabled={hasSubmitted}
              className="px-4 py-2 bg-slate-700 rounded-lg flex items-center gap-2 hover:bg-slate-600 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>

            <div className="flex gap-3">
              {/* Show Results button for completed matches */}
              {match?.status === 'completed' && battleResult && (
                <button
                  onClick={() => setShowResult(true)}
                  className="px-4 py-2 bg-yellow-600 rounded-lg flex items-center gap-2 hover:bg-yellow-500"
                >
                  <Trophy className="w-4 h-4" /> Show Final Results
                </button>
              )}

              <button
                onClick={handleRun}
                disabled={isRunning || hasSubmitted}
                className="px-4 py-2 bg-slate-700 rounded-lg flex items-center gap-2 hover:bg-slate-600 disabled:opacity-50"
              >
                <Play className="w-4 h-4" /> {isRunning ? 'Running...' : 'Run'}
              </button>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || hasSubmitted}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 font-semibold ${hasSubmitted
                  ? 'bg-emerald-600/50 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500'
                  }`}
              >
                {hasSubmitted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Submitted
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Solution
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && battleResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center border border-slate-700"
            >
              {draw ? (
                <>
                  <Shield className="w-20 h-20 mx-auto mb-4 text-slate-400" />
                  <h2 className="text-3xl font-bold mb-2">It's a Draw!</h2>
                  <p className="text-slate-400 mb-6">Both players performed equally well.</p>
                </>
              ) : won ? (
                <>
                  <Crown className="w-20 h-20 mx-auto mb-4 text-yellow-400" />
                  <h2 className="text-3xl font-bold mb-2 text-emerald-400">Victory!</h2>
                  <p className="text-slate-400 mb-6">You outperformed your opponent!</p>
                </>
              ) : (
                <>
                  <XCircle className="w-20 h-20 mx-auto mb-4 text-red-400" />
                  <h2 className="text-3xl font-bold mb-2 text-red-400">Defeat</h2>
                  <p className="text-slate-400 mb-6">Better luck next time!</p>
                </>
              )}

              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <p className="text-sm text-slate-400">Your Score</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {isPlayer1 ? battleResult.player1Score : battleResult.player2Score}
                  </p>
                </div>
                <div className="text-3xl text-slate-600">vs</div>
                <div className="text-center">
                  <p className="text-sm text-slate-400">Opponent</p>
                  <p className="text-2xl font-bold text-red-400">
                    {isPlayer1 ? battleResult.player2Score : battleResult.player1Score}
                  </p>
                </div>
              </div>

              {won && (
                <div className="bg-emerald-900/30 rounded-lg p-3 mb-6 border border-emerald-500/30">
                  <p className="text-emerald-400 font-semibold flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5" /> +100 XP Bonus!
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate('/pvp')}
                  className="px-6 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
                >
                  Back to Arena
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500"
                >
                  World Map
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiting for opponent modal */}
      <AnimatePresence>
        {hasSubmitted && !showResult && match?.status === 'active' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center border border-slate-700"
            >
              <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-xl font-bold mb-2">Waiting for Opponent</h2>
              <p className="text-slate-400 mb-4">
                Your solution has been submitted. Waiting for your opponent to finish...
              </p>
              <p className="text-sm text-slate-500">
                You can leave and come back later. The match will be resolved asynchronously.
              </p>
              <button
                onClick={() => navigate('/pvp')}
                className="mt-6 px-6 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
              >
                Back to Arena
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PvPBattlePage;
