import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { I18nProvider, useI18n } from './lib/i18n';
import { Home } from './pages/Home';
import { History } from './pages/History';
import { Watchlist } from './pages/Watchlist';
import { Favorites } from './pages/Favorites';
import { Settings } from './pages/Settings';
import { About } from './pages/About';
import { Statistics } from './pages/Statistics';
import {
  Home as HomeIcon,
  Clock,
  List,
  Heart,
  BarChart3,
  Settings as SettingsIcon,
  Upload,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

function TopNav() {
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: '/', label: t('nav.home'), icon: HomeIcon },
    { to: '/history', label: t('nav.history'), icon: Clock },
    { to: '/watchlist', label: t('nav.watchlist'), icon: List },
    { to: '/favorites', label: t('nav.favorites'), icon: Heart },
    { to: '/statistics', label: t('nav.statistics'), icon: BarChart3 },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => navigate('/')} className="text-white font-bold text-xl tracking-tight-custom">
            T<span className="text-[#FF6B50]">.</span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                    isActive ? 'text-white bg-white/10' : 'text-[#888] hover:text-white'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `p-2 rounded-full transition-colors ${isActive ? 'text-white bg-white/10' : 'text-[#888] hover:text-white'}`
              }
            >
              <SettingsIcon size={18} />
            </NavLink>
            <button
              onClick={() => navigate('/')}
              className="bg-[#FF6B50] hover:bg-[#E55A40] text-black font-medium px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {t('nav.startSearching')}
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-[#888] hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass-nav border-t border-white/10">
          <div className="px-4 py-3 space-y-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                    isActive ? 'text-white bg-white/10' : 'text-[#888] hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            <NavLink
              to="/settings"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive ? 'text-white bg-white/10' : 'text-[#888] hover:text-white'
                }`
              }
            >
              <SettingsIcon size={18} />
              {t('nav.settings')}
            </NavLink>
            <NavLink
              to="/about"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive ? 'text-white bg-white/10' : 'text-[#888] hover:text-white'
                }`
              }
            >
              <HomeIcon size={18} />
              {t('nav.about')}
            </NavLink>
          </div>
        </div>
      )}
    </nav>
  );
}

function BottomNav() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { to: '/', label: t('nav.home'), icon: HomeIcon },
    { to: '/history', label: t('nav.history'), icon: Clock },
    { to: '/watchlist', label: t('nav.watchlist'), icon: List },
    { to: '/favorites', label: t('nav.favorites'), icon: Heart },
  ];

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 glass-nav rounded-2xl">
      <div className="flex items-center justify-around py-2">
        {items.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                isActive ? 'text-white' : 'text-[#666]'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px]">{label}</span>
            </button>
          );
        })}
        <button
          onClick={() => navigate('/')}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-[#FF6B50] text-black"
        >
          <Upload size={20} />
          <span className="text-[10px] font-medium">Upload</span>
        </button>
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-[#050505]">
      <TopNav />
      <main className="pt-16 pb-24 md:pb-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </BrowserRouter>
  );
}
