import React from 'react';
import { ShieldCheck, Cpu, RefreshCw, Layers, Users, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar({ activeTab, onSelectTab }) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => onSelectTab('queue')}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
          }}
        >
          <ShieldCheck size={22} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              RETURNWISE
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--brand-primary)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border-medium)',
              }}
            >
              AI INVESTIGATOR
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Autonomous Returns Decision Support Engine
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[
          { id: 'queue', label: 'Returns Queue', icon: Layers },
          { id: 'analytics', label: 'Analytics & ROI', icon: RefreshCw },
          { id: 'simulator', label: 'What-If Lab', icon: Cpu },
          { id: 'entities', label: 'Entity Explorer', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: isActive ? 'var(--bg-subtle)' : 'transparent',
                color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System Status Pill & Theme Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            padding: '6px 12px',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {isDark ? (
            <>
              <Sun size={15} color="#FBBF24" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon size={15} color="#6366F1" />
              <span>Dark</span>
            </>
          )}
        </button>

        {/* System Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '11px',
            fontWeight: 600,
            color: '#10B981',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 6px #10B981',
            }}
          />
          ML Engine Online
        </div>
      </div>
    </header>
  );
}
