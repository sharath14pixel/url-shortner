import React, { useState } from 'react';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { StatsCard } from './components/StatsCard';
import { Link2, LayoutDashboard, Home as HomeIcon } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedStatsCode, setSelectedStatsCode] = useState(null);

  const handleOpenStats = (code) => {
    setSelectedStatsCode(code);
  };

  const handleCloseStats = () => {
    setSelectedStatsCode(null);
  };

  return (
    <div className="app-container">
      <header className="app-navbar">
        <a href="#" onClick={() => setActiveTab('home')} className="brand-logo">
          <span>ShortURL</span>
        </a>

        <nav className="nav-links">
          <button
            onClick={() => setActiveTab('home')}
            className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
            id="nav-home-btn"
          >
            <span>Shorten</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            id="nav-dashboard-btn"
          >
            <span>Stats</span>
          </button>
        </nav>
      </header>

      <main className="main-wrapper">
        {activeTab === 'home' ? (
          <Home onViewStats={handleOpenStats} />
        ) : (
          <Dashboard onViewStats={handleOpenStats} />
        )}
      </main>

      {selectedStatsCode && (
        <StatsCard
          shortCode={selectedStatsCode}
          onClose={handleCloseStats}
        />
      )}

      <footer className="app-footer">
        <p>SwiftURL • Modern High Performance Link Shortener</p>
      </footer>
    </div>
  );
}

export default App;
