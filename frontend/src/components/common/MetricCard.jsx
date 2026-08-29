import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) {
  const colorMap = {
    blue: { text: '#60A5FA', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.25)' },
    emerald: { text: '#34D399', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' },
    rose: { text: '#F87171', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)' },
    amber: { text: '#FBBF24', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
    purple: { text: '#C084FC', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.25)' },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: scheme.bg,
              color: scheme.text,
              border: `1px solid ${scheme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginTop: '4px' }}>
        {value}
      </div>

      {subtitle && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {trend && (
            <span style={{ color: trend > 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </span>
          )}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}
