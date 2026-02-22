import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Send,
  RotateCcw,
  ChevronRight,
  Clock,
  Lightbulb,
  Flag,
  Database,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  Coins,
  Zap,
  Sparkles,
  Table
} from 'lucide-react';
import CodeEditor from './CodeEditor';
import { sqlExecutor } from '../../services/sqlExecutor';
import { challengesAPI } from '../../services/api';
import { useGamification } from '../../store/GamificationContext';

// Check if we're in demo mode
const isDemoMode = () => {
  const user = localStorage.getItem('user');
  return user && JSON.parse(user).isDemo === true;
};

const ChallengeInterface = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Gamification context for XP animations
  let gamification = null;
  try {
    gamification = useGamification();
  } catch (e) {
    // Context not available (outside provider)
  }

  // Layout State
  const [leftPanelWidth, setLeftPanelWidth] = useState(38);
  const [isDragging, setIsDragging] = useState(false);

  // Challenge State
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results State
  const [activeTab, setActiveTab] = useState('output');
  const [executionResult, setExecutionResult] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Hints State
  const [unlockedHints, setUnlockedHints] = useState([]);
  const [coins, setCoins] = useState(100); // Mock coin balance

  // Table preview state
  const [selectedTable, setSelectedTable] = useState(null);

  const containerRef = useRef(null);

  // Load challenge from API or demo data
  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const response = await challengesAPI.getById(id);
        const challengeData = response.data;
        if (challengeData) {
          // Add fallback defaults for fields not in database
          setChallenge({
            ...challengeData,
            requirements: challengeData.requirements || [challengeData.description || 'Complete the challenge'],
            tables: challengeData.tables || ['ships', 'captains', 'crew', 'cargo'],
            storyContext: challengeData.storyContext || challengeData.story_context || '',
            starterCode: challengeData.starterCode || challengeData.starter_code || '-- Write your SQL query here\nSELECT ',
            hints: (typeof challengeData.hints === 'string' ? JSON.parse(challengeData.hints) : challengeData.hints) || [],
            orderIndex: challengeData.orderIndex || challengeData.order_index || 1,
            timeEstimate: challengeData.timeEstimate || challengeData.time_estimate || 10,
            expectedOutput: {
              type: 'any',
              validateFn: (result) => result.success && result.rowCount > 0
            }
          });
          setCode(challengeData.starterCode || challengeData.starter_code || '');
          setTimer(0);
          setExecutionResult(null);
          setValidationResult(null);
          setUnlockedHints([]);
          setShowSuccess(false);
        }
      } catch (error) {
        console.error('Failed to load challenge:', error);
        // Fallback for demo mode - create minimal challenge structure
        setChallenge({
          id,
          title: 'Demo Challenge',
          storyContext: 'Practice your SQL skills!',
          requirements: ['Write a valid SQL query'],
          tables: ['ships'],
          hints: [{ level: 1, text: 'Try SELECT * FROM ships', cost: 10 }],
          starterCode: '-- Write your SQL here\nSELECT ',
          difficulty: 1,
          timeEstimate: 5,
          expectedOutput: {
            type: 'any',
            validateFn: (result) => result.success && result.rowCount > 0
          }
        });
        setCode('-- Write your SQL here\nSELECT ');
      }
    };
    loadChallenge();
  }, [id]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [id]);

  // Resize Logic
  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth > 25 && newWidth < 60) {
        setLeftPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Execute SQL
  const handleRun = () => {
    setIsRunning(true);
    setActiveTab('output');

    setTimeout(() => {
      const result = sqlExecutor.execute(code);
      setExecutionResult(result);
      setIsRunning(false);
    }, 300);
  };

  // Submit and validate
  const handleSubmit = async () => {
    setIsSubmitting(true);

    // First run the code
    const result = sqlExecutor.execute(code);
    setExecutionResult(result);
    setActiveTab('output');

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!result.success) {
      setValidationResult({
        correct: false,
        score: 0,
        feedback: { correctness: 'Your query has syntax errors. Please fix them and try again.' }
      });
      setIsSubmitting(false);
      return;
    }

    // FOR REAL USERS: Send to backend for validation
    if (!isDemoMode()) {
      try {
        console.log('Submitting to backend for validation...');
        const response = await challengesAPI.submit(id, {
          code,
          output: result,
          timeSpent: timer
        });

        const backendResult = response.data;
        console.log('Backend validation result:', backendResult);
        console.log('Validation object:', backendResult.validation);
        console.log('Validation.correct:', backendResult.validation.correct);
        console.log('Validation.feedback:', backendResult.validation.feedback);
        console.log('Feedback type:', typeof backendResult.validation.feedback);
        console.log('Feedback.overall:', backendResult.validation.feedback?.overall);

        // Use backend validation result
        setValidationResult({
          correct: backendResult.validation.correct,
          score: backendResult.score,
          xpEarned: backendResult.xpEarned,
          breakdown: backendResult.validation.breakdown || {
            correctness: backendResult.validation.correctnessScore || 0,
            quality: backendResult.validation.qualityScore || 0,
            performance: backendResult.validation.performanceScore || 0,
            timeBonus: 0
          },
          feedback: {
            correctness: backendResult.validation.correct
              ? '✓ Your solution is correct!'
              : (backendResult.validation.feedback?.overall ||
                (typeof backendResult.validation.feedback === 'string' ? backendResult.validation.feedback : null) ||
                'Your solution doesn\'t match requirements.'),
            quality: (typeof backendResult.validation.feedback?.quality === 'string' ? backendResult.validation.feedback.quality : null) || backendResult.validation.qualityFeedback || '',
            performance: (typeof backendResult.validation.feedback?.performance === 'string' ? backendResult.validation.feedback.performance : null) || backendResult.validation.performanceFeedback || ''
          }
        });

        // Switch to validation tab so user can see results
        setActiveTab('validation');

        // Show success only if backend says correct
        if (backendResult.validation.correct) {
          setShowSuccess(true);

          // Trigger XP gain animation
          if (gamification?.showXPGain && backendResult.xpEarned > 0) {
            gamification.showXPGain(backendResult.xpEarned);
          }
        }

      } catch (error) {
        console.error('Backend validation failed:', error);
        setValidationResult({
          correct: false,
          score: 0,
          feedback: {
            correctness: '⚠️ Validation failed: ' + (error.response?.data?.error || error.message)
          }
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // FOR DEMO MODE: Client-side validation
    const isCorrect = challenge.expectedOutput.validateFn(result);

    let score = 0;
    let qualityScore = 0;
    let performanceScore = 0;
    let timeBonus = 0;

    if (isCorrect) {
      score = 100;

      if (code.includes(' AS ')) qualityScore += 10;
      if (code.toUpperCase().includes('SELECT') && !code.includes('*')) qualityScore += 10;
      if (code.split('\n').length > 1) qualityScore += 10;

      if (!code.includes('*') || challenge.expectedOutput.type === 'exact_match') performanceScore += 25;
      if (code.toUpperCase().includes('LIMIT')) performanceScore += 15;

      const expectedSeconds = (challenge.timeEstimate || 10) * 60;
      if (timer < expectedSeconds * 0.5) timeBonus = 20;
      else if (timer < expectedSeconds) timeBonus = 10;
    }

    const totalScore = Math.min(200, score + qualityScore + performanceScore + timeBonus);
    const xpEarned = Math.floor(totalScore * (1 + challenge.difficulty * 0.1));

    setValidationResult({
      correct: isCorrect,
      score: totalScore,
      xpEarned,
      breakdown: {
        correctness: score,
        quality: qualityScore,
        performance: performanceScore,
        timeBonus
      },
      feedback: {
        correctness: isCorrect
          ? '✓ Your solution produces the correct output!'
          : 'Your query runs but doesn\'t match the expected output. Check the requirements.',
        quality: qualityScore > 15
          ? 'Good code style! Using aliases and proper formatting.'
          : 'Consider using column aliases and proper formatting.',
        performance: performanceScore > 20
          ? 'Efficient query structure!'
          : 'Consider selecting only needed columns instead of SELECT *'
      }
    });

    if (isCorrect) {
      setShowSuccess(true);

      if (gamification?.showXPGain) {
        gamification.showXPGain(xpEarned);
      }

      // Save to localStorage for demo
      saveProgress(id, totalScore, xpEarned);
    }

    setIsSubmitting(false);
  };

  // Save progress to localStorage (demo) or backend (real user)
  const saveProgress = async (challengeId, score, xpEarned) => {
    console.log('saveProgress called:', { challengeId, score, xpEarned, isDemoMode: isDemoMode() });

    if (isDemoMode()) {
      // Demo mode: save to localStorage
      const savedProgress = JSON.parse(localStorage.getItem('demoProgress') || '{}');
      console.log('Before save - demoProgress:', savedProgress);

      const isNewCompletion = !savedProgress[challengeId]?.completed;

      savedProgress[challengeId] = {
        completed: true,
        score: score,
        best_score: Math.max(savedProgress[challengeId]?.best_score || 0, score),
        attempts: (savedProgress[challengeId]?.attempts || 0) + 1
      };
      localStorage.setItem('demoProgress', JSON.stringify(savedProgress));
      console.log('After save - demoProgress:', savedProgress);

      // Update user XP in localStorage
      if (isNewCompletion) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.total_xp = (user.total_xp || 0) + xpEarned;
        localStorage.setItem('user', JSON.stringify(user));
        console.log('Updated user XP:', user.total_xp);
      }
    } else {
      // Real user: send to backend
      try {
        await challengesAPI.submit(challengeId, {
          code,
          output: executionResult,
          timeSpent: timer
        });
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }
  };

  // Unlock hint
  const handleUnlockHint = (hint) => {
    if (coins >= hint.cost && !unlockedHints.includes(hint.level)) {
      setCoins(c => c - hint.cost);
      setUnlockedHints([...unlockedHints, hint.level]);
    }
  };

  // Reset code
  const handleReset = () => {
    setCode(challenge?.starterCode || '');
    setExecutionResult(null);
    setValidationResult(null);
  };

  // Navigate to next challenge
  const handleNextChallenge = async () => {
    try {
      // Try to get next challenge from API
      const response = await challengesAPI.getByIsland(challenge?.island_id || 'sql_shore');
      const challenges = response.data?.challenges || [];
      const currentIndex = challenges.findIndex(c => c.id === id);
      const next = challenges[currentIndex + 1];

      if (next) {
        navigate(`/challenge/${next.id}`);
      } else {
        navigate('/');
      }
    } catch (error) {
      // Fallback to home
      navigate('/');
    }
  };

  if (!challenge) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-slate-400 animate-pulse">Loading challenge...</div>
      </div>
    );
  }

  const tableInfo = sqlExecutor.getAllTables();

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-dark-bg text-slate-300 overflow-hidden">

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && validationResult?.correct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-8 max-w-md text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: 3, duration: 0.5 }}
              >
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              </motion.div>

              <h2 className="text-2xl font-bold text-white mb-2">Challenge Complete!</h2>
              <p className="text-slate-400 mb-6">{challenge.title}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="text-3xl font-bold text-emerald-400">{validationResult.score}</div>
                  <div className="text-xs text-slate-500">Total Score</div>
                </div>
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="text-3xl font-bold text-yellow-400">+{validationResult.xpEarned}</div>
                  <div className="text-xs text-slate-500">XP Earned</div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-left bg-slate-900/50 rounded-lg p-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">Correctness</span>
                  <span className="text-emerald-400">+{validationResult.breakdown.correctness}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Code Quality</span>
                  <span className="text-blue-400">+{validationResult.breakdown.quality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Performance</span>
                  <span className="text-purple-400">+{validationResult.breakdown.performance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time Bonus</span>
                  <span className="text-yellow-400">+{validationResult.breakdown.timeBonus}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSuccess(false)}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                >
                  Review Solution
                </button>
                <button
                  onClick={handleNextChallenge}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Next Challenge <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">

        {/* LEFT PANEL: Problem Statement */}
        <div
          style={{ width: `${leftPanelWidth}%` }}
          className="flex flex-col border-r border-dark-border bg-dark-card/30 min-w-[300px] overflow-hidden"
        >
          <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-blue-400">
                      Challenge #{challenge.orderIndex}
                    </span>
                    <div className="flex gap-0.5">
                      {[...Array(challenge.difficulty)].map((_, i) => (
                        <Zap key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                  </div>
                  <h1 className="text-xl font-bold text-white">{challenge.title}</h1>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 rounded-full px-3 py-1.5 border border-slate-700">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-xs font-mono text-white">{formatTime(timer)}</span>
                </div>
              </div>

              {/* Coin Balance */}
              <div className="flex items-center gap-2 text-sm mb-4">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-500 font-medium">{coins}</span>
                <span className="text-slate-500">coins</span>
              </div>

              {/* Story/Narrative */}
              <div className="bg-gradient-to-r from-blue-900/20 to-transparent border-l-2 border-blue-500 pl-4 py-3 mb-6">
                <p className="text-slate-300 text-sm italic leading-relaxed">
                  {challenge.storyContext}
                </p>
              </div>

              {/* Requirements */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-blue-400" /> Requirements
                </h3>
                <ul className="space-y-2">
                  {challenge.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-blue-400 mt-1">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Available Tables */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" /> Available Tables
                </h3>
                <div className="flex flex-wrap gap-2">
                  {challenge.tables.map(tableName => {
                    const table = tableInfo.find(t => t.name === tableName);
                    return (
                      <button
                        key={tableName}
                        onClick={() => setSelectedTable(selectedTable === tableName ? null : tableName)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${selectedTable === tableName
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                      >
                        <Table className="w-3 h-3 inline mr-1" />
                        {tableName} ({table?.rowCount || 0} rows)
                      </button>
                    );
                  })}
                </div>

                {/* Table Preview */}
                <AnimatePresence>
                  {selectedTable && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 overflow-hidden"
                    >
                      <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                        <div className="px-3 py-2 bg-slate-800 text-xs text-slate-400">
                          Schema: {tableInfo.find(t => t.name === selectedTable)?.columns.map(c => c.name).join(', ')}
                        </div>
                        <div className="overflow-x-auto max-h-32">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-800/50">
                              <tr>
                                {tableInfo.find(t => t.name === selectedTable)?.columns.map(col => (
                                  <th key={col.name} className="px-2 py-1 text-left text-slate-400 font-medium">
                                    {col.name}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {tableInfo.find(t => t.name === selectedTable)?.sampleData.map((row, i) => (
                                <tr key={i} className="border-t border-slate-800">
                                  {Object.values(row).map((val, j) => (
                                    <td key={j} className="px-2 py-1 text-slate-300 truncate max-w-[100px]">
                                      {String(val)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="px-3 py-1 bg-slate-800 text-xs text-slate-500 text-center">
                          Showing 3 of {tableInfo.find(t => t.name === selectedTable)?.rowCount} rows
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Hints Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" /> Hints
                </h3>
                {challenge.hints.map((hint) => (
                  <div key={hint.level} className="relative">
                    {unlockedHints.includes(hint.level) ? (
                      <div className="px-4 py-3 rounded-lg bg-yellow-900/20 border border-yellow-600/30 text-sm text-yellow-200">
                        <span className="text-yellow-500 font-medium">Hint {hint.level}:</span> {hint.text}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUnlockHint(hint)}
                        disabled={coins < hint.cost}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors flex justify-between items-center ${coins >= hint.cost
                          ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                          : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                          }`}
                      >
                        <span>Hint {hint.level}: {hint.level === 1 ? 'Basic guidance' : hint.level === 2 ? 'Specific direction' : 'Solution hint'}</span>
                        <span className={`text-xs font-bold flex items-center gap-1 ${coins >= hint.cost ? 'text-yellow-500' : 'text-slate-600'}`}>
                          <Coins className="w-3 h-3" /> {hint.cost}
                        </span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RESIZER HANDLE */}
        <div
          className={`w-1.5 cursor-col-resize hover:bg-blue-500 transition-colors z-10 flex flex-col justify-center items-center ${isDragging ? 'bg-blue-600' : 'bg-transparent'}`}
          onMouseDown={handleMouseDown}
        >
          <div className="h-12 w-1 bg-slate-600 rounded-full opacity-50" />
        </div>

        {/* RIGHT PANEL: Editor & Results */}
        <div className="flex-1 flex flex-col min-w-[400px] bg-[#1e1e1e]">

          {/* EDITOR HEADER */}
          <div className="h-12 bg-dark-bg border-b border-dark-border flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 rounded-md p-0.5 flex text-xs font-medium">
                <span className="px-3 py-1.5 rounded bg-blue-600 text-white">SQL</span>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isRunning ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                Run Code
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Submit
              </button>
            </div>
          </div>

          {/* CODE EDITOR AREA */}
          <div className="flex-1 relative overflow-hidden">
            <CodeEditor
              language="sql"
              value={code}
              onChange={setCode}
              onRun={handleRun}
            />
          </div>

          {/* RESULTS PANEL */}
          <div className="h-[40%] flex flex-col border-t border-dark-border bg-dark-bg">

            {/* Results Tabs */}
            <div className="flex items-center bg-dark-card border-b border-dark-border">
              <button
                onClick={() => setActiveTab('output')}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'output'
                  ? 'border-blue-500 text-white bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Terminal className="w-3 h-3" /> Output
                {executionResult && (
                  executionResult.success
                    ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    : <XCircle className="w-3 h-3 text-red-400" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('validation')}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'validation'
                  ? 'border-blue-500 text-white bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Sparkles className="w-3 h-3" /> Validation
              </button>
              <button
                onClick={() => setActiveTab('datasets')}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'datasets'
                  ? 'border-blue-500 text-white bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Database className="w-3 h-3" /> All Tables
              </button>
            </div>

            {/* Results Content */}
            <div className="flex-1 overflow-auto">
              {activeTab === 'output' && (
                <div className="p-4">
                  {!executionResult ? (
                    <div className="text-slate-500 text-sm flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      Run your code to see results here...
                    </div>
                  ) : executionResult.success ? (
                    <div>
                      <div className="flex items-center gap-3 mb-3 text-xs">
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Query executed successfully
                        </span>
                        <span className="text-slate-500">
                          {executionResult.rowCount} rows • {executionResult.executionTime}ms
                        </span>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-slate-700">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-800">
                            <tr>
                              {executionResult.columns.map(col => (
                                <th key={col} className="px-3 py-2 text-left text-slate-300 font-medium border-b border-slate-700">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="font-mono">
                            {executionResult.rows.slice(0, 50).map((row, i) => (
                              <tr key={i} className="hover:bg-slate-800/50 border-b border-slate-800 last:border-0">
                                {executionResult.columns.map(col => (
                                  <td key={col} className="px-3 py-1.5 text-slate-300">
                                    {row[col] === null ? <span className="text-slate-600 italic">NULL</span> : String(row[col])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {executionResult.rowCount > 50 && (
                          <div className="px-3 py-2 bg-slate-800 text-xs text-slate-500 text-center">
                            Showing 50 of {executionResult.rowCount} rows
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
                        <XCircle className="w-4 h-4" /> Error
                      </div>
                      <pre className="text-red-300 text-sm whitespace-pre-wrap font-mono">
                        {executionResult.error}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'validation' && (
                <div className="p-4">
                  {!validationResult ? (
                    <div className="text-slate-500 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Submit your solution to see validation results...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Result Header */}
                      <div className={`p-4 rounded-lg border ${validationResult.correct
                        ? 'bg-emerald-900/20 border-emerald-500/30'
                        : 'bg-red-900/20 border-red-500/30'
                        }`}>
                        <div className="flex items-center gap-3">
                          {validationResult.correct ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-400" />
                          )}
                          <div>
                            <div className={`font-bold ${validationResult.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                              {validationResult.correct ? 'Correct!' : 'Not Quite Right'}
                            </div>
                            <div className="text-sm text-slate-400">
                              Score: {validationResult.score} / 200
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Feedback */}
                      <div className="space-y-3">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-xs text-slate-500 mb-1">Correctness</div>
                          <div className="text-sm text-slate-300">{validationResult.feedback.correctness}</div>
                        </div>
                        {validationResult.correct && (
                          <>
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="text-xs text-slate-500 mb-1">Code Quality</div>
                              <div className="text-sm text-slate-300">{validationResult.feedback.quality}</div>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="text-xs text-slate-500 mb-1">Performance</div>
                              <div className="text-sm text-slate-300">{validationResult.feedback.performance}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'datasets' && (
                <div className="p-4 space-y-4">
                  {tableInfo.map(table => (
                    <div key={table.name} className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                      <div className="px-3 py-2 bg-slate-800 flex items-center justify-between">
                        <span className="font-mono text-sm text-white">{table.name}</span>
                        <span className="text-xs text-slate-500">{table.rowCount} rows</span>
                      </div>
                      <div className="px-3 py-2 text-xs text-slate-400">
                        Columns: {table.columns.map(c => c.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeInterface;
