import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Star, Calendar, Flame, X, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { rewardsAPI } from '../../services/api';

/**
 * Daily Reward Modal - Shows when user logs in with unclaimed daily reward
 */
const DailyRewardModal = ({ isOpen, onClose, onClaim }) => {
    const [rewardStatus, setRewardStatus] = useState(null);
    const [claiming, setClaiming] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadRewardStatus();
        }
    }, [isOpen]);

    const loadRewardStatus = async () => {
        try {
            const response = await rewardsAPI.getDailyReward();
            setRewardStatus(response.data);
            setClaimed(response.data.claimed);
        } catch (error) {
            console.error('Failed to load daily reward:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async () => {
        if (claimed || claiming) return;

        setClaiming(true);
        try {
            const response = await rewardsAPI.claimDailyReward();
            setClaimed(true);
            if (onClaim) {
                onClaim(response.data.reward);
            }
            // Auto-close after 2 seconds
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Failed to claim reward:', error);
        } finally {
            setClaiming(false);
        }
    };

    // Calculate streak days for visual calendar
    const streakDays = [1, 2, 3, 4, 5, 6, 7];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-yellow-500/30 shadow-2xl w-full max-w-md overflow-hidden">

                            {/* Header with glow */}
                            <div className="relative bg-gradient-to-r from-yellow-600/20 via-orange-500/20 to-yellow-600/20 p-6 text-center">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 to-transparent" />

                                {/* Close button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Gift icon with animation */}
                                <motion.div
                                    animate={{
                                        rotate: [0, -10, 10, -10, 0],
                                        y: [0, -5, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatType: "reverse"
                                    }}
                                    className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 mb-4 shadow-lg shadow-yellow-500/30"
                                >
                                    <Gift className="w-10 h-10 text-white" />
                                </motion.div>

                                <h2 className="text-2xl font-bold text-white mb-1">Daily Reward</h2>
                                <p className="text-yellow-200/80 text-sm">
                                    {claimed ? "You've claimed today's reward!" : "Your daily treasure awaits!"}
                                </p>
                            </div>

                            {/* Streak Calendar */}
                            <div className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <Flame className="w-5 h-5 text-orange-500" />
                                    <span className="text-sm text-slate-300">Login Streak Bonus</span>
                                </div>

                                <div className="flex justify-center gap-2">
                                    {streakDays.map((day) => (
                                        <motion.div
                                            key={day}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: day * 0.1 }}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${day <= 3
                                                    ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400'
                                                    : 'bg-slate-800 border border-slate-700 text-slate-500'
                                                }`}
                                        >
                                            {day}
                                        </motion.div>
                                    ))}
                                </div>

                                <p className="text-center text-xs text-slate-500 mt-2">
                                    Day 7 bonus: Special cosmetic reward!
                                </p>
                            </div>

                            {/* Reward Display */}
                            <div className="px-6 pb-6">
                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto" />
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-2xl p-6 border border-yellow-500/20 mb-4"
                                    >
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <Sparkles className="w-5 h-5 text-yellow-400" />
                                                <span className="text-yellow-300 text-sm uppercase tracking-wider">Today's Reward</span>
                                                <Sparkles className="w-5 h-5 text-yellow-400" />
                                            </div>

                                            <div className="flex items-center justify-center gap-3">
                                                <Star className="w-8 h-8 text-yellow-500" />
                                                <span className="text-4xl font-bold text-white">
                                                    +{rewardStatus?.reward?.value || 50}
                                                </span>
                                                <span className="text-xl text-yellow-400">XP</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Claim Button */}
                                <motion.button
                                    whileHover={{ scale: claimed ? 1 : 1.02 }}
                                    whileTap={{ scale: claimed ? 1 : 0.98 }}
                                    onClick={handleClaim}
                                    disabled={claimed || claiming || loading}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${claimed
                                            ? 'bg-emerald-600 text-white cursor-default'
                                            : claiming
                                                ? 'bg-yellow-600/50 text-yellow-200 cursor-wait'
                                                : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-lg hover:shadow-yellow-500/30'
                                        }`}
                                >
                                    {claimed ? '✓ Claimed!' : claiming ? 'Claiming...' : 'Claim Reward'}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DailyRewardModal;
