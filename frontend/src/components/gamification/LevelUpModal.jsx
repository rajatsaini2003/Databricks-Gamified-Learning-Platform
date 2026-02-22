import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Star, Sparkles, ChevronUp, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

// Tier configurations with colors and next tier info
const TIERS = {
    'Data Apprentice': {
        color: 'from-emerald-500 to-teal-500',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/30',
        xpRequired: 0,
        next: 'Pipeline Builder'
    },
    'Pipeline Builder': {
        color: 'from-blue-500 to-cyan-500',
        textColor: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        xpRequired: 2000,
        next: 'Code Sorcerer'
    },
    'Code Sorcerer': {
        color: 'from-purple-500 to-pink-500',
        textColor: 'text-purple-400',
        bgColor: 'bg-purple-500/20',
        borderColor: 'border-purple-500/30',
        xpRequired: 5000,
        next: 'Data Master'
    },
    'Data Master': {
        color: 'from-yellow-500 to-orange-500',
        textColor: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        xpRequired: 10000,
        next: 'Legend'
    }
};

/**
 * LevelUpModal - Celebration modal when user advances to a new tier
 */
const LevelUpModal = ({ isOpen, onClose, newTier, oldTier }) => {
    const [showContent, setShowContent] = useState(false);

    const tierConfig = TIERS[newTier] || TIERS['Data Apprentice'];

    useEffect(() => {
        if (isOpen) {
            // Trigger confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            // Delayed content reveal
            setTimeout(() => setShowContent(true), 300);

            // More confetti bursts
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
            }, 500);

            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });
            }, 700);
        }

        return () => setShowContent(false);
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 100 }}
                        transition={{ type: "spring", damping: 20, stiffness: 200 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative w-full max-w-lg">

                            {/* Glow effect behind card */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${tierConfig.color} blur-3xl opacity-30 rounded-full`} />

                            {/* Main card */}
                            <motion.div
                                initial={{ rotateY: 180 }}
                                animate={{ rotateY: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
                            >
                                {/* Close button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                {/* Header with sparkles */}
                                <div className="relative pt-8 pb-4 text-center overflow-hidden">
                                    {/* Animated sparkles */}
                                    {[...Array(12)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{
                                                opacity: [0, 1, 0],
                                                scale: [0, 1, 0],
                                                x: Math.cos((i / 12) * Math.PI * 2) * 150,
                                                y: Math.sin((i / 12) * Math.PI * 2) * 150
                                            }}
                                            transition={{
                                                duration: 2,
                                                delay: i * 0.1,
                                                repeat: Infinity,
                                                repeatDelay: 1
                                            }}
                                            className="absolute top-1/2 left-1/2 w-2 h-2"
                                        >
                                            <Sparkles className={`w-4 h-4 ${tierConfig.textColor}`} />
                                        </motion.div>
                                    ))}

                                    <motion.div
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            rotate: [0, 5, -5, 0]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="relative z-10"
                                    >
                                        <ChevronUp className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                                    </motion.div>

                                    <h2 className="text-3xl font-bold text-white mb-2">LEVEL UP!</h2>
                                    <p className="text-slate-400">You've achieved a new rank!</p>
                                </div>

                                {/* Tier display */}
                                <AnimatePresence>
                                    {showContent && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="px-8 pb-8"
                                        >
                                            {/* Old tier */}
                                            <div className="text-center mb-4 opacity-50">
                                                <span className="text-sm text-slate-500">Previous Rank</span>
                                                <div className="text-lg text-slate-400 line-through">{oldTier}</div>
                                            </div>

                                            {/* Arrow */}
                                            <div className="flex justify-center my-4">
                                                <motion.div
                                                    animate={{ y: [0, -5, 0] }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                >
                                                    <ChevronUp className="w-8 h-8 text-yellow-400" />
                                                </motion.div>
                                            </div>

                                            {/* New tier showcase */}
                                            <motion.div
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.6, type: "spring" }}
                                                className={`p-6 rounded-2xl bg-gradient-to-r ${tierConfig.color} shadow-xl`}
                                            >
                                                <div className="flex items-center justify-center gap-4">
                                                    <Shield className="w-16 h-16 text-white" />
                                                    <div>
                                                        <div className="text-white/80 text-sm uppercase tracking-wider">New Rank</div>
                                                        <div className="text-3xl font-bold text-white">{newTier}</div>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Perks unlocked */}
                                            <div className="mt-6 space-y-3">
                                                <div className="text-sm text-slate-400 text-center">Perks Unlocked</div>
                                                <div className="flex flex-wrap justify-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${tierConfig.bgColor} ${tierConfig.textColor} border ${tierConfig.borderColor}`}>
                                                        +10% XP Bonus
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${tierConfig.bgColor} ${tierConfig.textColor} border ${tierConfig.borderColor}`}>
                                                        New Cosmetics
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${tierConfig.bgColor} ${tierConfig.textColor} border ${tierConfig.borderColor}`}>
                                                        Special Badge
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Continue button */}
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={onClose}
                                                className={`w-full mt-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r ${tierConfig.color} hover:shadow-lg transition-shadow`}
                                            >
                                                Continue Adventure
                                            </motion.button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default LevelUpModal;
