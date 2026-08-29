import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import ActionBadge from '../components/common/ActionBadge';
import RiskBadge from '../components/common/RiskBadge';
import { Cpu, Sliders, DollarSign, ArrowRight, Zap, RefreshCw } from 'lucide-react';

export default function WhatIfLab({ initialReturnId }) {
  const [returns, setReturns] = useState([]);
  const [selectedReturnId, setSelectedReturnId] = useState(initialReturnId || '');
  const [inspectionCost, setInspectionCost] = useState(15);
  const [frictionWeight, setFrictionWeight] = useState(0.4);
  const [hypoAbuse, setHypoAbuse] = useState(0.5);
  const [hypoDefect, setHypoDefect] = useState(0.1);
  const [hypoPrice, setHypoPrice] = useState(350);
  
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getReturns().then((list) => {
      setReturns(list);
      if (!selectedReturnId && list.length > 0) {
        setSelectedReturnId(list[0].id);
      }
    }).catch(console.error);
  }, []);

  const runSimulation = async () => {
    if (!selectedReturnId) return;
    setLoading(true);
    try {
      const res = await api.simulateScenario({
        return_id: parseInt(selectedReturnId),
        inspection_cost: parseFloat(inspectionCost),
        friction_weight: parseFloat(frictionWeight),
        hypothetical_p_abuse: parseFloat(hypoAbuse),
        hypothetical_p_defect: parseFloat(hypoDefect),
        hypothetical_price: parseFloat(hypoPrice),
      });
      setSimResult(res);
    } catch (err) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedReturnId) {
      // Find return item and sync sliders
      const selected = returns.find((r) => r.id === parseInt(selectedReturnId));
      if (selected) {
        if (selected.decision) {
          setHypoAbuse(selected.decision.abuse_probability);
          setHypoDefect(selected.decision.defect_probability);
        }
        setHypoPrice(selected.product.price);
      }
      runSimulation();
    }
  }, [selectedReturnId, returns]);

  return (
    <div style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
          What-If Counterfactual Simulation Lab
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Test sensitivity of autonomous decisions across warehouse inspection costs, customer friction penalties, and risk thresholds.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
        
        {/* Controls Column */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '22px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Sliders size={18} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Simulation Parameters
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Return Selector */}
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Select Return Case:
              </label>
              <select
                value={selectedReturnId}
                onChange={(e) => setSelectedReturnId(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: 'var(--input-text)',
                  outline: 'none',
                }}
              >
                {returns.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.return_ref} - {r.customer.name} ({r.product.title})
                  </option>
                ))}
              </select>
            </div>

            {/* Slider 1: P(Abuse) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Hypothetical P(Abuse):
                </label>
                <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: 700 }}>
                  {Math.round(hypoAbuse * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.99"
                step="0.01"
                value={hypoAbuse}
                onChange={(e) => setHypoAbuse(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#EF4444' }}
              />
            </div>

            {/* Slider 2: P(Defect) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Hypothetical P(Defect):
                </label>
                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 700 }}>
                  {Math.round(hypoDefect * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.99"
                step="0.01"
                value={hypoDefect}
                onChange={(e) => setHypoDefect(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#10B981' }}
              />
            </div>

            {/* Slider 3: Inspection Cost */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Physical Inspection Cost:
                </label>
                <span style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 700 }}>
                  ₹{inspectionCost}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={inspectionCost}
                onChange={(e) => setInspectionCost(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#3B82F6' }}
              />
            </div>

            {/* Slider 4: Customer Friction Weight */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Customer Friction Penalty Weight:
                </label>
                <span style={{ fontSize: '12px', color: '#8B5CF6', fontWeight: 700 }}>
                  {frictionWeight}x
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={frictionWeight}
                onChange={(e) => setFrictionWeight(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#8B5CF6' }}
              />
            </div>

            {/* Slider 5: Item Price */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Item Retail Price:
                </label>
                <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 700 }}>
                  ₹{hypoPrice}
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="1500"
                step="10"
                value={hypoPrice}
                onChange={(e) => setHypoPrice(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#F59E0B' }}
              />
            </div>

            <button
              onClick={runSimulation}
              disabled={loading}
              style={{
                backgroundColor: 'var(--brand-primary)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '10px',
              }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Recalculating Decision Engine...' : 'Run Simulation'}
            </button>
          </div>
        </div>

        {/* Output Column */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '22px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Zap size={18} color="#F59E0B" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Simulation Outcome & Action Shift
            </h2>
          </div>

          {simResult ? (
            <div>
              {/* Action Shift Banner */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card-secondary)',
                  border: simResult.recommendation_changed ? '1px solid #F59E0B66' : '1px solid #10B98166',
                  borderRadius: '12px',
                  padding: '18px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Original Action</div>
                    <ActionBadge action={simResult.original_action} />
                  </div>
                  <ArrowRight size={20} color="var(--text-secondary)" />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Simulated Action</div>
                    <ActionBadge action={simResult.simulated_action} />
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {simResult.scenario_notes}
                </p>
              </div>

              {/* Loss Metrics Comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: 'var(--bg-card-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Original Expected Loss</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '4px' }}>
                    ₹{simResult.original_expected_loss.toFixed(2)}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Simulated Expected Loss</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '4px' }}>
                    ₹{simResult.simulated_expected_loss.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Updated Payoff Matrix */}
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                Recalculated Payoff Matrix Under Simulation:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(simResult.payoff_matrix || {}).map(([act, p]) => {
                  const isSimSelected = simResult.simulated_action === act;
                  return (
                    <div
                      key={act}
                      style={{
                        backgroundColor: isSimSelected ? 'var(--bg-subtle)' : 'var(--bg-card-secondary)',
                        border: isSimSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ActionBadge action={act} />
                        {isSimSelected && (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                            [OPTIMAL]
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          ₹{p.direct_financial_loss.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          (Weighted: ₹{p.weighted_total_loss.toFixed(2)})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Select parameters and click Run Simulation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
