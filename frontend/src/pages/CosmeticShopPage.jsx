import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag,
    Star,
    Check,
    Lock,
    Sparkles,
    Crown,
    Shield,
    Heart,
    Zap
} from 'lucide-react';
import { rewardsAPI } from '../services/api';

// Rarity colors
const RARITY_CONFIG = {
    common: { color: 'from-slate-500 to-slate-600', text: 'text-slate-400', bg: 'bg-slate-500/20' },
    uncommon: { color: 'from-emerald-500 to-teal-500', text: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    rare: { color: 'from-blue-500 to-cyan-500', text: 'text-blue-400', bg: 'bg-blue-500/20' },
    epic: { color: 'from-purple-500 to-pink-500', text: 'text-purple-400', bg: 'bg-purple-500/20' },
    legendary: { color: 'from-yellow-500 to-orange-500', text: 'text-yellow-400', bg: 'bg-yellow-500/20' }
};

// Type icons
const TYPE_ICONS = {
    border: Shield,
    background: Sparkles,
    badge: Crown,
    title: Star
};

const CosmeticShopPage = () => {
    const [cosmetics, setCosmetics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userXP, setUserXP] = useState(0);
    const [filter, setFilter] = useState('all');
    const [purchasing, setPurchasing] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        loadCosmetics();
        loadUserXP();
    }, []);

    const loadCosmetics = async () => {
        try {
            const response = await rewardsAPI.getCosmetics();
            setCosmetics(response.data || []);
        } catch (error) {
            console.error('Failed to load cosmetics:', error);
            // Demo data
            setCosmetics([
                { id: 1, name: 'Flame Border', cosmetic_type: 'border', rarity: 'rare', xp_cost: 1000, owned: false },
                { id: 2, name: 'Galaxy Background', cosmetic_type: 'background', rarity: 'epic', xp_cost: 2500, owned: false },
                { id: 3, name: 'SQL Master Badge', cosmetic_type: 'badge', rarity: 'legendary', xp_cost: 5000, owned: false },
                { id: 4, name: 'Apprentice Border', cosmetic_type: 'border', rarity: 'common', xp_cost: 250, owned: true },
                { id: 5, name: 'Query Knight', cosmetic_type: 'title', rarity: 'uncommon', xp_cost: 500, owned: false },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadUserXP = async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserXP(user.total_xp || 0);
    };

    const handlePurchase = async (cosmetic) => {
        if (cosmetic.owned || userXP < cosmetic.xp_cost) return;

        setPurchasing(cosmetic.id);
        try {
            await rewardsAPI.purchaseCosmetic(cosmetic.id);

            // Update local state
            setCosmetics(prev => prev.map(c =>
                c.id === cosmetic.id ? { ...c, owned: true } : c
            ));
            setUserXP(prev => prev - cosmetic.xp_cost);

            // Update localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.total_xp = (user.total_xp || 0) - cosmetic.xp_cost;
            localStorage.setItem('user', JSON.stringify(user));

            setNotification({ type: 'success', message: `Purchased ${cosmetic.name}!` });
        } catch (error) {
            setNotification({ type: 'error', message: error.message || 'Purchase failed' });
        } finally {
            setPurchasing(null);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const filteredCosmetics = filter === 'all'
        ? cosmetics
        : cosmetics.filter(c => c.cosmetic_type === filter);

    const filterButtons = [
        { id: 'all', label: 'All' },
        { id: 'border', label: 'Borders' },
        { id: 'background', label: 'Backgrounds' },
        { id: 'badge', label: 'Badges' },
        { id: 'title', label: 'Titles' }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg text-white p-6">
            {/* Header */}
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <ShoppingBag className="w-8 h-8 text-yellow-500" />
                            Cosmetic Shop
                        </h1>
                        <p className="text-slate-400 mt-1">Customize your profile with unique items</p>
                    </div>

                    {/* XP Balance */}
                    <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-xl px-6 py-3">
                        <div className="flex items-center gap-3">
                            <Star className="w-6 h-6 text-yellow-500" />
                            <div>
                                <div className="text-2xl font-bold text-yellow-400">{userXP.toLocaleString()}</div>
                                <div className="text-xs text-yellow-500/70">Available XP</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notification */}
                <AnimatePresence>
                    {notification && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`mb-6 p-4 rounded-lg border ${notification.type === 'success'
                                    ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400'
                                    : 'bg-red-900/30 border-red-500/30 text-red-400'
                                }`}
                        >
                            {notification.message}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filters */}
                <div className="flex gap-2 mb-8 flex-wrap">
                    {filterButtons.map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => setFilter(btn.id)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === btn.id
                                    ? 'bg-yellow-500 text-black'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>

                {/* Cosmetics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredCosmetics.map((cosmetic, index) => {
                        const rarity = RARITY_CONFIG[cosmetic.rarity] || RARITY_CONFIG.common;
                        const TypeIcon = TYPE_ICONS[cosmetic.cosmetic_type] || Star;
                        const canAfford = userXP >= cosmetic.xp_cost;

                        return (
                            <motion.div
                                key={cosmetic.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`relative bg-slate-800/50 rounded-xl border overflow-hidden ${cosmetic.owned
                                        ? 'border-emerald-500/30'
                                        : canAfford
                                            ? 'border-slate-700 hover:border-yellow-500/50'
                                            : 'border-slate-700 opacity-60'
                                    }`}
                            >
                                {/* Rarity Banner */}
                                <div className={`h-2 bg-gradient-to-r ${rarity.color}`} />

                                {/* Content */}
                                <div className="p-4">
                                    {/* Icon Preview */}
                                    <div className={`w-16 h-16 rounded-xl ${rarity.bg} flex items-center justify-center mb-4 mx-auto`}>
                                        <TypeIcon className={`w-8 h-8 ${rarity.text}`} />
                                    </div>

                                    {/* Info */}
                                    <div className="text-center mb-4">
                                        <h3 className="font-bold text-white mb-1">{cosmetic.name}</h3>
                                        <span className={`text-xs font-medium uppercase ${rarity.text}`}>
                                            {cosmetic.rarity}
                                        </span>
                                        <span className="text-xs text-slate-500 ml-2">
                                            • {cosmetic.cosmetic_type}
                                        </span>
                                    </div>

                                    {/* Price / Status */}
                                    {cosmetic.owned ? (
                                        <div className="flex items-center justify-center gap-2 py-2 bg-emerald-900/30 rounded-lg text-emerald-400">
                                            <Check className="w-4 h-4" />
                                            <span className="font-medium">Owned</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handlePurchase(cosmetic)}
                                            disabled={!canAfford || purchasing === cosmetic.id}
                                            className={`w-full py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${canAfford
                                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:shadow-lg hover:shadow-yellow-500/20'
                                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                }`}
                                        >
                                            {purchasing === cosmetic.id ? (
                                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            ) : !canAfford ? (
                                                <>
                                                    <Lock className="w-4 h-4" />
                                                    <span>{cosmetic.xp_cost.toLocaleString()} XP</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Star className="w-4 h-4" />
                                                    <span>{cosmetic.xp_cost.toLocaleString()} XP</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {filteredCosmetics.length === 0 && (
                    <div className="text-center py-16">
                        <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500">No cosmetics found in this category</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CosmeticShopPage;
