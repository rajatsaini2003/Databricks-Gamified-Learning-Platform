import { motion } from 'framer-motion';
import { Flame, Calendar, Trophy, TrendingUp } from 'lucide-react';

/**
 * StreakDisplay - Shows current streak with fire animation
 * Can be used in navbar or profile
 */
const StreakDisplay = ({
    currentStreak = 0,
    longestStreak = 0,
    showDetails = false,
    size = 'default' // 'small' | 'default' | 'large'
}) => {
    const sizeConfig = {
        small: { icon: 'w-4 h-4', text: 'text-sm', container: 'px-2 py-1' },
        default: { icon: 'w-5 h-5', text: 'text-base', container: 'px-3 py-1.5' },
        large: { icon: 'w-8 h-8', text: 'text-2xl', container: 'px-4 py-3' }
    };

    const config = sizeConfig[size] || sizeConfig.default;

    // Determine streak color based on length
    const getStreakColor = () => {
        if (currentStreak >= 30) return 'from-purple-500 to-pink-500';
        if (currentStreak >= 14) return 'from-yellow-500 to-orange-500';
        if (currentStreak >= 7) return 'from-orange-500 to-red-500';
        if (currentStreak >= 3) return 'from-orange-400 to-orange-600';
        return 'from-slate-500 to-slate-600';
    };

    const getFireIntensity = () => {
        if (currentStreak >= 30) return 3;
        if (currentStreak >= 14) return 2;
        if (currentStreak >= 7) return 1.5;
        if (currentStreak >= 3) return 1;
        return 0.5;
    };

    return (
        <div className={`inline-flex items-center ${showDetails ? 'flex-col gap-2' : ''}`}>
            {/* Main streak badge */}
            <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-2 ${config.container} bg-gradient-to-r ${getStreakColor()} rounded-full shadow-lg`}
            >
                {/* Animated flame */}
                <motion.div
                    animate={{
                        scale: [1, 1.1 * getFireIntensity(), 1],
                        rotate: [-3, 3, -3]
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                >
                    <Flame className={`${config.icon} text-white drop-shadow-lg`} />
                </motion.div>

                <span className={`${config.text} font-bold text-white`}>
                    {currentStreak}
                </span>

                {size !== 'small' && (
                    <span className="text-xs text-white/80 hidden sm:inline">
                        day{currentStreak !== 1 ? 's' : ''}
                    </span>
                )}
            </motion.div>

            {/* Details section */}
            {showDetails && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 mt-2"
                >
                    {/* Current streak details */}
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400">Current:</span>
                        <span className="text-white font-semibold">{currentStreak} days</span>
                    </div>

                    {/* Best streak */}
                    <div className="flex items-center gap-2 text-sm">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="text-slate-400">Best:</span>
                        <span className="text-yellow-400 font-semibold">{longestStreak} days</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

/**
 * StreakCard - Larger streak display for profile/dashboard
 */
export const StreakCard = ({ currentStreak = 0, longestStreak = 0, bonusesClaimed = 0 }) => {
    const nextMilestone = [7, 14, 30, 60, 100].find(m => m > currentStreak) || 100;
    const progress = (currentStreak / nextMilestone) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-2xl border border-orange-500/20 p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Login Streak
                </h3>
                <StreakDisplay currentStreak={currentStreak} size="default" />
            </div>

            {/* Streak statistics */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-white">{currentStreak}</div>
                    <div className="text-xs text-slate-400">Current</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{longestStreak}</div>
                    <div className="text-xs text-slate-400">Best</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">{bonusesClaimed}</div>
                    <div className="text-xs text-slate-400">Bonuses</div>
                </div>
            </div>

            {/* Next milestone progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Next milestone</span>
                    <span className="text-orange-400">{nextMilestone} days</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                    />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{currentStreak} days</span>
                    <div className="flex items-center gap-1 text-orange-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>+{nextMilestone >= 30 ? 50 : nextMilestone >= 14 ? 30 : 20} XP at {nextMilestone}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StreakDisplay;
