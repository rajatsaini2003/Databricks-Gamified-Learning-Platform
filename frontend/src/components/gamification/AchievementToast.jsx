import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Award, Database, Flame, Zap, Target, FileCode, Map, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

// Icon mapping for achievements
const ACHIEVEMENT_ICONS = {
    first_query: Target,
    sql_novice: Database,
    streak_5: Flame,
    streak_30: Flame,
    perfectionist: Award,
    speed_demon: Zap,
    island_master: Map,
    python_master: FileCode,
    xp_1000: Star,
    xp_5000: Trophy,
    default: Award
};

/**
 * AchievementToast - Toast notification for achievement unlocks
 */
const AchievementToast = ({ achievement, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    const Icon = ACHIEVEMENT_ICONS[achievement?.id] || ACHIEVEMENT_ICONS.default;

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, 4000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: 400, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 400, scale: 0.8 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed top-20 right-4 z-50 max-w-sm"
                >
                    <div className="bg-gradient-to-r from-yellow-900/90 via-amber-900/90 to-yellow-900/90 backdrop-blur-xl rounded-2xl border border-yellow-500/40 shadow-2xl shadow-yellow-500/20 overflow-hidden">

                        {/* Animated shine effect */}
                        <motion.div
                            initial={{ x: -200 }}
                            animate={{ x: 400 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="absolute inset-0 w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                        />

                        <div className="p-4 flex items-center gap-4 relative">
                            {/* Badge icon with glow */}
                            <motion.div
                                animate={{
                                    rotate: [0, 10, -10, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-yellow-500 rounded-xl blur-lg opacity-50" />
                                <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                            </motion.div>

                            {/* Text content */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Trophy className="w-4 h-4 text-yellow-400" />
                                    <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                                        Achievement Unlocked!
                                    </span>
                                </div>
                                <h3 className="text-white font-bold text-lg">{achievement?.name || 'Unknown'}</h3>
                                <p className="text-yellow-200/70 text-sm">{achievement?.description}</p>
                            </div>

                            {/* Close button */}
                            <button
                                onClick={() => setIsVisible(false)}
                                className="text-yellow-400/50 hover:text-yellow-400 transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        {/* Progress bar animation */}
                        <motion.div
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 4, ease: "linear" }}
                            className="h-1 bg-gradient-to-r from-yellow-500 to-orange-500"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/**
 * AchievementToastContainer - Manages multiple achievement toasts
 */
export const AchievementToastContainer = ({ achievements = [], onClear }) => {
    const [queue, setQueue] = useState([]);

    useEffect(() => {
        if (achievements.length > 0) {
            setQueue(achievements);
        }
    }, [achievements]);

    const handleClose = (index) => {
        setQueue(prev => prev.filter((_, i) => i !== index));
        if (queue.length === 1 && onClear) {
            onClear();
        }
    };

    return (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
            {queue.map((achievement, index) => (
                <AchievementToast
                    key={achievement.id || index}
                    achievement={achievement}
                    onClose={() => handleClose(index)}
                />
            ))}
        </div>
    );
};

export default AchievementToast;
