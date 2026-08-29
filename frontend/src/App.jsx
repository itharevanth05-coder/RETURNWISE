import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import ReturnsQueue from './pages/ReturnsQueue';
import ReturnDetail from './pages/ReturnDetail';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import WhatIfLab from './pages/WhatIfLab';
import EntityExplorer from './pages/EntityExplorer';

function AppContent() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'analytics', 'simulator', 'entities'
  const [selectedReturnId, setSelectedReturnId] = useState(null);

  const handleSelectReturn = (id) => {
    setSelectedReturnId(id);
  };

  const handleBackToQueue = () => {
    setSelectedReturnId(null);
  };

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    setSelectedReturnId(null);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', transition: 'background-color 0.2s ease, color 0.2s ease' }}>
      <Navbar activeTab={activeTab} onSelectTab={handleSelectTab} />

      <main>
        {selectedReturnId ? (
          <ReturnDetail returnId={selectedReturnId} onBack={handleBackToQueue} />
        ) : activeTab === 'queue' ? (
          <ReturnsQueue onSelectReturn={handleSelectReturn} />
        ) : activeTab === 'analytics' ? (
          <AnalyticsDashboard />
        ) : activeTab === 'simulator' ? (
          <WhatIfLab />
        ) : activeTab === 'entities' ? (
          <EntityExplorer />
        ) : null}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
