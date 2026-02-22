import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Map,
  User,
  Trophy,
  LogOut,
  Menu,
  X,
  Compass,
  Star,
  ChevronDown,
  Swords,
  Flame
} from 'lucide-react';

// Page Imports
import IslandMap from './components/islands/IslandMap';
import IslandDetailView from './components/islands/IslandDetailView';
import ChallengeInterface from './components/challenge/ChallengeInterface';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import PvPArenaPage from './pages/PvPArenaPage';
import PvPBattlePage from './pages/PvPBattlePage';
import CosmeticShopPage from './pages/CosmeticShopPage';

// Gamification Components
import { GamificationProvider, useGamification } from './store/GamificationContext';
import XPGainAnimation from './components/gamification/XPGainAnimation';
import DailyRewardModal from './components/gamification/DailyRewardModal';
import LevelUpModal from './components/gamification/LevelUpModal';
import { AchievementToastContainer } from './components/gamification/AchievementToast';

// Auth Guard Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Navigation Component
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'World Map', icon: Map },
    { to: '/pvp', label: 'PvP Arena', icon: Swords },
    { to: '/shop', label: 'Shop', icon: Star },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/profile', label: 'Profile', icon: User }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="h-16 border-b border-dark-border bg-dark-card/80 backdrop-blur-xl flex items-center px-6 sticky top-0 z-50">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
          <Compass className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent hidden sm:block">
          Learning Quest
        </span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-1 ml-8">
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.to)
              ? 'bg-blue-600/20 text-blue-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        ))}
      </div>

      {/* Right Side */}
      <div className="ml-auto flex items-center gap-4">
        {/* XP Display */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-500 text-sm font-medium">
              {(user.total_xp || user.totalXp || 0).toLocaleString()} XP
            </span>
          </div>
        )}

        {/* User Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:block text-sm text-white font-medium">
                {user.username}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <div className="text-sm text-white font-medium">{user.username}</div>
                    <div className="text-xs text-slate-400">{user.tier || 'Data Apprentice'}</div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-dark-card border-b border-dark-border p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(link.to)
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-300 hover:bg-slate-800'
                  }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

// Layout Component
const Layout = ({ children, showNav = true }) => {
  return (
    <div className="min-h-screen flex flex-col bg-dark-bg">
      {showNav && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

// Gamification Overlay - Shows XP animations, achievements, daily rewards, level ups
const GamificationOverlay = () => {
  const {
    xpAnimation,
    newAchievements,
    clearAchievement,
    showDailyReward,
    setShowDailyReward,
    showLevelUp,
    setShowLevelUp,
    tier,
    previousTier
  } = useGamification();

  return (
    <>
      {/* XP Gain Animation */}
      {xpAnimation && (
        <XPGainAnimation xp={xpAnimation.amount} />
      )}

      {/* Achievement Toasts */}
      <AchievementToastContainer
        achievements={newAchievements}
        onClear={() => { }}
      />

      {/* Daily Reward Modal */}
      <DailyRewardModal
        isOpen={showDailyReward}
        onClose={() => setShowDailyReward(false)}
      />

      {/* Level Up Modal */}
      <LevelUpModal
        isOpen={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        newTier={tier}
        oldTier={previousTier}
      />
    </>
  );
};

function App() {
  return (
    <GamificationProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <IslandMap />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/island/:id" element={
            <ProtectedRoute>
              <Layout>
                <IslandDetailView />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/challenge/:id" element={
            <ProtectedRoute>
              <Layout>
                <ChallengeInterface />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <Layout>
                <LeaderboardPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/pvp" element={
            <ProtectedRoute>
              <Layout>
                <PvPArenaPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/pvp/battle/:matchId" element={
            <ProtectedRoute>
              <Layout>
                <PvPBattlePage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/shop" element={
            <ProtectedRoute>
              <Layout>
                <CosmeticShopPage />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Gamification Overlays */}
        <GamificationOverlay />
      </Router>
    </GamificationProvider>
  );
}

export default App;
