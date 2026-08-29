import React from 'react';
import { CheckCircle2, Search, ArrowLeftRight, Ban, UserCheck } from 'lucide-react';

export default function ActionBadge({ action }) {
  const act = (action || 'APPROVE').toUpperCase();

  const configs = {
    APPROVE: {
      label: 'APPROVE',
      bg: 'rgba(59, 130, 246, 0.15)',
      border: '#3B82F6',
      text: '#60A5FA',
      icon: CheckCircle2,
    },
    INSPECT: {
      label: 'INSPECT',
      bg: 'rgba(168, 85, 247, 0.15)',
      border: '#A855F7',
      text: '#C084FC',
      icon: Search,
    },
    EXCHANGE: {
      label: 'EXCHANGE',
      bg: 'rgba(20, 184, 166, 0.15)',
      border: '#14B8A6',
      text: '#2DD4BF',
      icon: ArrowLeftRight,
    },
    RESTRICT: {
      label: 'RESTRICT',
      bg: 'rgba(244, 63, 94, 0.15)',
      border: '#F43F5E',
      text: '#FB7185',
      icon: Ban,
    },
    ESCALATE: {
      label: 'ESCALATE',
      bg: 'rgba(245, 158, 11, 0.15)',
      border: '#F59E0B',
      text: '#FCD34D',
      icon: UserCheck,
    },
  };

  const config = configs[act] || configs.APPROVE;
  const Icon = config.icon;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
      }}
    >
      <Icon size={14} />
      <span>{config.label}</span>
    </div>
  );
}
