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
import { useState } from 'react';

function TopNav() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { to: '/', label: 'SEARCH' },
    { to: '/history', label: 'HISTORY' },
    { to: '/watchlist', label: 'WATCHLIST' },
    { to: '/favorites', label: 'FAVORITES' },
    { to: '/statistics', label: 'STATS' },
  ];

  return (
    <nav className="fixed top-4 left-4 right-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="font-display text-2xl text-black hover:translate-x-1 transition-transform"
        >
          T.
        </button>

        {/* Pill Navigation */}
        <div className="pill-nav px-2 py-2 hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className={`pill-link ${isActive ? 'active' : ''}`}
              >
                {label}
              </NavLink>
            );
          })}
        </div>

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          className="font-mono-custom text-xs text-black uppercase hover:translate-x-1 transition-transform"
        >
          {t('nav.settings')}
        </button>
      </div>

      {/* Mobile Pill Nav */}
      <div className="md:hidden mt-2 flex justify-center">
        <div className="pill-nav px-2 py-1 flex items-center gap-1 overflow-x-auto max-w-full">
          {links.map(({ to, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className={`pill-link whitespace-nowrap text-[10px] px-3 py-1 ${isActive ? 'active' : ''}`}
              >
                {label}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-[#FF4D00]">
      <TopNav />
      <main>
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
