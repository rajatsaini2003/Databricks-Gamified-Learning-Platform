import { motion, AnimatePresence } from 'framer-motion';
import { Star, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * XP Gain Animation - Floating +XP indicator
 * Shows when user earns XP from completing challenges
 */
const XPGainAnimation = ({ xp, onComplete }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            if (onComplete) {
                setTimeout(onComplete, 300); // Wait for exit animation
            }
        }, 2000); // Show for 2 seconds

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                    animate={{
                        opacity: [0, 1, 1, 0],
                        y: [-100, -150, -180, -220],
                        scale: [0.8, 1.2, 1, 0.8]
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{
                        duration: 2,
                        times: [0, 0.2, 0.8, 1],
                        ease: "easeOut"
                    }}
                    className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
                >
                    <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-2xl border-2 border-yellow-300">
                        <Zap className="w-6 h-6 text-white animate-pulse" />
                        <span className="text-2xl font-bold text-white">+{xp} XP</span>
                        <Star className="w-6 h-6 text-yellow-200 animate-spin" style={{ animationDuration: '2s' }} />
                    </div>

                    {/* Particle effects */}
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 1, scale: 1 }}
                            animate={{
                                opacity: 0,
                                x: Math.cos((i / 8) * Math.PI * 2) * 100,
                                y: Math.sin((i / 8) * Math.PI * 2) * 100,
                                scale: 0
                            }}
                            transition={{ duration: 1.5, delay: 0.2 }}
                            className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full"
                        />
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default XPGainAnimation;
