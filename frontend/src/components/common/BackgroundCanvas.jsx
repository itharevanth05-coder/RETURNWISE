import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function BackgroundCanvas() {
  const { isDark } = useTheme();

  const gridLineColor = isDark ? 'rgba(59, 130, 246, 0.035)' : 'rgba(100, 116, 139, 0.04)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        userSelect: 'none',
      }}
      aria-hidden="true"
    >
      {/* 1. Subtle Decision Space Grid Mesh */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${gridLineColor} 1px, transparent 1px), linear-gradient(90deg, ${gridLineColor} 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          animation: 'gridMeshDrift 80s linear infinite',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 70% at 50% 25%, black 25%, transparent 80%)',
          maskImage: 'radial-gradient(ellipse 85% 70% at 50% 25%, black 25%, transparent 80%)',
          opacity: 0.85,
        }}
      />

      {/* 2. Top Horizon Glow Beam */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.35) 30%, rgba(139, 92, 246, 0.35) 70%, transparent 100%)',
          boxShadow: '0 0 16px rgba(59, 130, 246, 0.25)',
        }}
      />

      {/* 3. Atmospheric Aurora Orbs (Soft, Breathing, Non-Intrusive) */}
      {/* Orb 1: Decision Blue (Top-Left) */}
      <div
        className="bg-aurora-orb"
        style={{
          top: '-12%',
          left: '-8%',
          width: '620px',
          height: '620px',
          background: isDark
            ? 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0) 70%)'
            : 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0) 70%)',
          filter: 'blur(90px)',
          animation: 'orbFloat1 28s ease-in-out infinite',
        }}
      />

      {/* Orb 2: Risk Violet (Top-Right) */}
      <div
        className="bg-aurora-orb"
        style={{
          top: '-10%',
          right: '-10%',
          width: '580px',
          height: '580px',
          background: isDark
            ? 'radial-gradient(circle, rgba(139, 92, 246, 0.10) 0%, rgba(139, 92, 246, 0) 70%)'
            : 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0) 70%)',
          filter: 'blur(95px)',
          animation: 'orbFloat2 34s ease-in-out infinite',
        }}
      />

      {/* Orb 3: Financial Salvage Emerald (Bottom-Center) */}
      <div
        className="bg-aurora-orb"
        style={{
          bottom: '-15%',
          left: '25%',
          width: '560px',
          height: '560px',
          background: isDark
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0) 70%)'
            : 'radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0) 70%)',
          filter: 'blur(100px)',
          animation: 'orbFloat3 26s ease-in-out infinite',
        }}
      />

      {/* Orb 4: Telemetry Cyan (Center-Right) */}
      <div
        className="bg-aurora-orb"
        style={{
          top: '35%',
          right: '-5%',
          width: '450px',
          height: '450px',
          background: isDark
            ? 'radial-gradient(circle, rgba(6, 182, 212, 0.07) 0%, rgba(6, 182, 212, 0) 70%)'
            : 'radial-gradient(circle, rgba(6, 182, 212, 0.035) 0%, rgba(6, 182, 212, 0) 70%)',
          filter: 'blur(85px)',
          animation: 'orbFloat1 36s ease-in-out infinite reverse',
        }}
      />

      {/* 4. Peripheral Background Micro-Telemetry Nodes */}
      {/* Far Left Node 1 */}
      <div
        className="bg-data-node"
        style={{
          top: '18%',
          left: '24px',
          color: isDark ? 'rgba(96, 165, 250, 0.28)' : 'rgba(59, 130, 246, 0.35)',
          fontSize: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          animationDelay: '0s',
        }}
      >
        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#3B82F6', opacity: 0.5 }} />
        <span>⬡ LOSS-MATRIX</span>
      </div>

      {/* Far Left Node 2 */}
      <div
        className="bg-data-node"
        style={{
          top: '62%',
          left: '32px',
          color: isDark ? 'rgba(167, 139, 250, 0.25)' : 'rgba(139, 92, 246, 0.32)',
          fontSize: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          animationDelay: '2.5s',
        }}
      >
        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#8B5CF6', opacity: 0.5 }} />
        <span>⬡ RISK-NET.XGB</span>
      </div>

      {/* Far Right Node 1 */}
      <div
        className="bg-data-node"
        style={{
          top: '28%',
          right: '28px',
          color: isDark ? 'rgba(52, 211, 153, 0.26)' : 'rgba(16, 185, 129, 0.35)',
          fontSize: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          animationDelay: '1.2s',
        }}
      >
        <span>SALVAGE-EST ⬡</span>
        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#10B981', opacity: 0.5 }} />
      </div>

      {/* Far Right Node 2 */}
      <div
        className="bg-data-node"
        style={{
          top: '75%',
          right: '36px',
          color: isDark ? 'rgba(56, 189, 248, 0.24)' : 'rgba(6, 182, 212, 0.32)',
          fontSize: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          animationDelay: '3.8s',
        }}
      >
        <span>POLICY-SYNC ⬡</span>
        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#06B6D4', opacity: 0.5 }} />
      </div>

      {/* Bottom Subtle Tracer */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(100, 116, 139, 0.25)',
          fontSize: '9px',
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.08em',
        }}
      >
        <span>NEURAL DECISION PIPELINE ACTIVE</span>
        <span>•</span>
        <span>6 MODELS SYNCHRONIZED</span>
      </div>
    </div>
  );
}
