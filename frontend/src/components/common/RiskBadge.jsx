import React from 'react';
import { ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';

export default function RiskBadge({ category, score }) {
  const cat = (category || 'UNCERTAIN').toUpperCase();

  const configs = {
    LEGITIMATE: {
      label: 'Legitimate',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.3)',
      text: '#34D399',
      icon: ShieldCheck,
    },
    POTENTIAL_ABUSE: {
      label: 'Potential Abuse',
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#F87171',
      icon: AlertTriangle,
    },
    UNCERTAIN: {
      label: 'Uncertain',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#FBBF24',
      icon: HelpCircle,
    },
  };

  const config = configs[cat] || configs.UNCERTAIN;
  const Icon = config.icon;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
      }}
    >
      <Icon size={14} />
      <span>{config.label}</span>
      {score !== undefined && (
        <span style={{ opacity: 0.8, fontSize: '11px', marginLeft: '2px' }}>
          ({Math.round(score * 100)}%)
        </span>
      )}
    </div>
  );
}
