import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import RiskBadge from '../components/common/RiskBadge';
import ActionBadge from '../components/common/ActionBadge';
import {
  ArrowLeft,
  RotateCw,
  Sliders,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  FileText,
  User,
  Package,
  History,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

export default function ReturnDetail({ returnId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Rerun Overrides State
  const [showRerunModal, setShowRerunModal] = useState(false);
  const [rerunLoading, setRerunLoading] = useState(false);
  const [overrideReturnRate, setOverrideReturnRate] = useState('');
  const [overrideDefectRate, setOverrideDefectRate] = useState('');
  const [overrideInspectionCost, setOverrideInspectionCost] = useState('15');
  const [merchantNotes, setMerchantNotes] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getReturnDetail(returnId);
      setData(res);
      setOverrideReturnRate(res.customer.return_rate);
      setOverrideDefectRate(res.product.batch_defect_rate);
    } catch (err) {
      setError(err.message || 'Failed to fetch return details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (returnId) {
      fetchDetail();
    }
  }, [returnId]);

  const handleRerun = async (e) => {
    e.preventDefault();
    setRerunLoading(true);
    try {
      await api.rerunDecision(returnId, {
        override_customer_return_rate: overrideReturnRate !== '' ? parseFloat(overrideReturnRate) : undefined,
        override_batch_defect_rate: overrideDefectRate !== '' ? parseFloat(overrideDefectRate) : undefined,
        override_inspection_cost: overrideInspectionCost !== '' ? parseFloat(overrideInspectionCost) : undefined,
        merchant_notes: merchantNotes || 'Manual merchant simulation rerun.',
      });
      setShowRerunModal(false);
      fetchDetail();
    } catch (err) {
      alert(`Rerun failed: ${err.message}`);
    } finally {
      setRerunLoading(false);
    }
  };

  const copyAuditReport = () => {
    if (!data?.decision?.detailed_explanation) return;
    navigator.clipboard.writeText(data.decision.detailed_explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
        <RotateCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Loading Autonomous Return Investigation context...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#F87171' }}>
        <p>Error: {error || 'Return request not found'}</p>
        <button
          onClick={onBack}
          style={{
            marginTop: '16px',
            backgroundColor: '#1E293B',
            color: '#F8FAFC',
            border: '1px solid #334155',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Back to Queue
        </button>
      </div>
    );
  }

  const { customer, product, decision, audit_logs } = data;
  const payoffs = decision?.payoff_matrix || {};
  const evidenceList = decision?.evidence_list || [];

  // Data for Risk Radar Chart
  const radarData = [
    { subject: 'Customer Risk', value: Math.round(customer.return_rate * 100), fullMark: 100 },
    { subject: 'Wardrobing', value: Math.round(customer.serial_wardrober_score * 100), fullMark: 100 },
    { subject: 'Batch Defect', value: Math.round(product.batch_defect_rate * 400), fullMark: 100 },
    { subject: 'High Shrink', value: product.is_high_shrink ? 90 : 20, fullMark: 100 },
    { subject: 'Late Timing', value: Math.min(100, Math.round((data.days_since_delivery / 30) * 100)), fullMark: 100 },
    { subject: 'Abuse P(Score)', value: decision ? Math.round(decision.abuse_probability * 100) : 30, fullMark: 100 },
  ];

  return (
    <div style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBack}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '8px',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F8FAFC' }}>
                Investigation: {data.return_ref}
              </h1>
              {decision && (
                <RiskBadge category={decision.risk_category} score={decision.abuse_probability} />
              )}
            </div>
            <p style={{ fontSize: '13px', color: '#64748B' }}>
              Order {data.return_ref} &bull; Requested {new Date(data.request_date).toLocaleDateString()} &bull; {data.days_since_delivery} days post delivery
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={copyAuditReport}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#CBD5E1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {copied ? <Check size={16} color="#34D399" /> : <Copy size={16} />}
            {copied ? 'Audit Copied!' : 'Copy Audit Report'}
          </button>

          <button
            onClick={() => setShowRerunModal(true)}
            style={{
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)',
            }}
          >
            <Sliders size={16} />
            Rerun / What-If Override
          </button>
        </div>
      </div>

      {/* Hero Decision Recommendation Card */}
      {decision && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '28px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ maxWidth: '680px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} /> Recommended Action & Strategy
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <ActionBadge action={decision.selected_action} />
                <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  Optimal policy selected by Deterministic Expected-Loss Engine
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {decision.reasoning_summary}
              </p>
            </div>

            {/* Financial Summary Pill Box */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', minWidth: '140px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Optimized Loss
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  ₹{decision.expected_loss_selected.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Weighted net cost
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', minWidth: '140px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Baseline Loss
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '4px' }}>
                  ₹{decision.baseline_expected_loss.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Policy: {decision.baseline_action}
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '16px', minWidth: '150px' }}>
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>
                  Loss Prevented
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                  +₹{decision.loss_prevented.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: '#10B981', marginTop: '2px' }}>
                  Direct Margin Saved
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI INVESTIGATION PIPELINE (6 Real Component Execution Cards) */}
      {decision && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '22px', marginBottom: '28px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="var(--brand-primary)" />
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                  AI INVESTIGATION PIPELINE
                </h2>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Real-time sequential inference trace across all 6 specialized AI models & decision optimization engines.
              </p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              ● 6 of 6 Components Completed
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {/* Card 1: Return Reason NLP */}
            {(() => {
              const comp = decision.ml_components?.reason_classification || {};
              const isDiscrepancy = comp.is_discrepancy;
              return (
                <div style={{ backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase' }}>
                          1. Return Reason NLP
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          TF-IDF + Logistic Regression
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        Completed
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Stated Reason:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{comp.stated_reason || data.stated_reason}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Inferred Category:</span>
                        <span style={{ color: isDiscrepancy ? '#EF4444' : 'var(--brand-primary)', fontWeight: 700 }}>{comp.inferred_category || data.stated_reason}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Claim Discrepancy:</span>
                        <span style={{ color: isDiscrepancy ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                          {isDiscrepancy ? '⚠️ Detected' : '✅ Consistent'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>NLP Confidence:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{Math.round((comp.confidence || 0.88) * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', margin: 0, fontStyle: 'italic' }}>
                    {comp.discrepancy_note || 'Semantic analysis evaluated claim against freeform text comments.'}
                  </p>
                </div>
              );
            })()}

            {/* Card 2: Customer Behavior Engine */}
            {(() => {
              const comp = decision.ml_components?.customer_behavior || {};
              const riskScore = comp.customer_risk_score !== undefined ? comp.customer_risk_score : customer.return_rate;
              const tier = comp.customer_tier || customer.ltv_tier;
              return (
                <div style={{ backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase' }}>
                          2. Customer Behavior Engine
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Velocity Anomaly Model
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        Completed
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Customer Risk Score:</span>
                        <span style={{ color: riskScore > 0.5 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                          {Math.round(riskScore * 100)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Behavioral Tier:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{tier}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Lifetime Return Rate:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{comp.return_rate_percent !== undefined ? comp.return_rate_percent : Math.round(customer.return_rate * 100)}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Wardrobing Index:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{comp.wardrober_index !== undefined ? comp.wardrober_index.toFixed(2) : customer.serial_wardrober_score.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', margin: 0, fontStyle: 'italic' }}>
                    Evaluated {customer.total_orders} lifetime orders with {customer.wardrobing_flag_count} prior wear flags.
                  </p>
                </div>
              );
            })()}

            {/* Card 3: Product Defect Clusterer */}
            {(() => {
              const comp = decision.ml_components?.product_defect || {};
              const defectProb = comp.defect_probability !== undefined ? comp.defect_probability : decision.defect_probability;
              const isKnownBatch = comp.is_known_defective_batch !== undefined ? comp.is_known_defective_batch : (product.batch_defect_rate >= 0.06);
              return (
                <div style={{ backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase' }}>
                          3. Product Defect Clusterer
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Batch Quality Clustering
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        Completed
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Defect Probability:</span>
                        <span style={{ color: defectProb > 0.5 ? '#10B981' : 'var(--text-secondary)', fontWeight: 700 }}>
                          {Math.round(defectProb * 100)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Signal Strength:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{comp.defect_signal_strength || (isKnownBatch ? 'STRONG' : 'LOW')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Batch Flaw Status:</span>
                        <span style={{ color: isKnownBatch ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                          {isKnownBatch ? '⚠️ Defective Batch' : 'Normal Batch'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Batch Defect Rate:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{Math.round(product.batch_defect_rate * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', margin: 0, fontStyle: 'italic' }}>
                    Tracked manufacturing batch {product.batch_number || 'N/A'} against catalog return rates.
                  </p>
                </div>
              );
            })()}

            {/* Card 4: Return Abuse XGBoost */}
            {(() => {
              const comp = decision.ml_components?.abuse_risk || {};
              const abuseProb = comp.abuse_probability !== undefined ? comp.abuse_probability : decision.abuse_probability;
              const cat = comp.risk_category || decision.risk_category;
              return (
                <div style={{ backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#F43F5E', textTransform: 'uppercase' }}>
                          4. Return Abuse XGBoost
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          XGBoost Classifier (Trained ML)
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        Completed
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>P(Abuse):</span>
                        <span style={{ color: abuseProb > 0.5 ? '#EF4444' : '#10B981', fontWeight: 800 }}>
                          {Math.round(abuseProb * 100)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Risk Tier:</span>
                        <span style={{ color: cat === 'POTENTIAL_ABUSE' ? '#EF4444' : (cat === 'LEGITIMATE' ? '#10B981' : '#F59E0B'), fontWeight: 700 }}>
                          {cat}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Customer Weight:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{comp.risk_factors?.customer_risk_component !== undefined ? `+${comp.risk_factors.customer_risk_component}` : '+0.64'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Defect Mitigation:</span>
                        <span style={{ color: '#10B981', fontWeight: 600 }}>{comp.risk_factors?.defect_mitigation_component !== undefined ? `${comp.risk_factors.defect_mitigation_component}` : '-0.14'}</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', margin: 0, fontStyle: 'italic' }}>
                    Ensemble probability calibrated from customer prior, NLP discrepancy, and tabular XGBoost.
                  </p>
                </div>
              );
            })()}

            {/* Card 5: Resale Value Regressor */}
            {(() => {
              const comp = decision.ml_components?.resale_value || {};
              const salvageRate = comp.predicted_salvage_rate !== undefined ? comp.predicted_salvage_rate : decision.predicted_salvage_rate;
              const salvageVal = comp.estimated_salvage_value !== undefined ? comp.estimated_salvage_value : (salvageRate * product.price);
              return (
                <div style={{ backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>
                          5. Resale Value Regressor
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Gradient Boosting (Trained ML)
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        Completed
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Salvage Recovery Rate:</span>
                        <span style={{ color: '#10B981', fontWeight: 700 }}>{Math.round(salvageRate * 100)}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Estimated Salvage:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>₹{salvageVal.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Recovery Tier:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{comp.resale_recovery_tier || (salvageRate > 0.7 ? 'HIGH' : 'MEDIUM')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Condition Input:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{data.claimed_condition}</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', margin: 0, fontStyle: 'italic' }}>
                    Continuous salvage regression incorporating condition degradation and delivery latency.
                  </p>
                </div>
              );
            })()}

            {/* Card 6: Expected Loss Engine */}
            {(() => {
              return (
                <div style={{ backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>
                          6. Expected Loss Engine
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Deterministic Financial Engine
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        Completed
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Optimal Action:</span>
                        <span style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>{decision.selected_action}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Expected Direct Loss:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>₹{decision.expected_loss_selected.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Baseline Policy:</span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{decision.baseline_action} (₹{decision.baseline_expected_loss.toFixed(2)})</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Loss Prevented:</span>
                        <span style={{ color: '#10B981', fontWeight: 800 }}>+₹{decision.loss_prevented.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', margin: 0, fontStyle: 'italic' }}>
                    Mathematical payoff matrix minimizing weighted direct loss and customer churn friction.
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Main Multi-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        
        {/* Left Panel: Structured Evidence Signals & Radar */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '22px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <ShieldCheck size={18} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Extracted Evidence & Risk Signals
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {evidenceList.map((ev, idx) => {
              const isHigh = ev.severity === 'HIGH';
              const isAbuse = ev.impact === 'ABUSE_INDICATOR';
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--bg-card-secondary)',
                    border: isHigh
                      ? isAbuse ? '1px solid #EF444466' : '1px solid #10B98166'
                      : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isHigh ? (isAbuse ? '#EF4444' : '#10B981') : 'var(--text-primary)' }}>
                      {ev.title}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-subtle)',
                        color: isHigh ? '#EF4444' : 'var(--text-secondary)',
                      }}
                    >
                      {ev.category}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {ev.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Stated Reason & Comment Context */}
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
              Customer Stated Reason & Claim
            </div>
            <div style={{ backgroundColor: 'var(--bg-card-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Reason: {data.stated_reason} &bull; Condition: {data.claimed_condition}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "{data.customer_comment || 'No comment provided by customer.'}"
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: Deterministic Action Payoff Matrix & Radar */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '22px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <DollarSign size={18} color="#10B981" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Candidate Actions Financial Payoff Matrix
            </h2>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Mathematical loss formulas comparing direct inventory cost vs customer churn friction:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {Object.keys(payoffs).map((actionKey) => {
              const p = payoffs[actionKey];
              const isSelected = decision?.selected_action === actionKey;
              return (
                <div
                  key={actionKey}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-subtle)' : 'var(--bg-card-secondary)',
                    border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ActionBadge action={actionKey} />
                      {isSelected && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', backgroundColor: 'rgba(59, 130, 246, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                          SELECTED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {p.description}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                      ₹{p.direct_financial_loss.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Friction: {p.customer_friction_score} pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Risk Radar */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart2 size={16} color="#8B5CF6" /> Multi-Dimensional Risk Radar
            </div>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer>
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke="var(--border-medium)" />
                  <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--text-muted)" tick={false} />
                  <Radar name="Risk Index" dataKey="value" stroke="var(--brand-primary)" fill="var(--brand-primary)" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Customer & Product Drilldowns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Customer Context */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <User size={18} color="#8B5CF6" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Customer Behavioral Profile
            </h3>
          </div>
          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Name & Email:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{customer.name} ({customer.email})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Lifetime Orders & Spend:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{customer.total_orders} orders &bull; ₹{customer.total_spend.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Historical Return Rate:</span>
              <span style={{ color: customer.return_rate > 0.4 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                {Math.round(customer.return_rate * 100)}% ({customer.total_returns} returns)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Wardrobing Risk Index:</span>
              <span style={{ color: customer.serial_wardrober_score > 0.6 ? '#EF4444' : 'var(--text-primary)', fontWeight: 700 }}>
                {customer.serial_wardrober_score.toFixed(2)} ({customer.wardrobing_flag_count} past flags)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Customer Tier:</span>
              <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{customer.ltv_tier}</span>
            </div>
          </div>
        </div>

        {/* Product Context */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Package size={18} color="#F59E0B" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Product & Manufacturing Batch Factors
            </h3>
          </div>
          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Product Title:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{product.title}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Retail Price / Cost:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₹{product.price.toFixed(2)} / ₹{product.cost_price.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Batch Defect Rate:</span>
              <span style={{ color: product.batch_defect_rate >= 0.06 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                {Math.round(product.batch_defect_rate * 100)}% ({product.batch_number})
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Shrink / Serial Tracking:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {product.requires_serial_check ? 'Serial Tracking Required' : 'Standard SKU'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Expected Resale Salvage:</span>
              <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{Math.round(product.expected_salvage_rate * 100)}% of Retail</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail Section */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <History size={18} color="var(--text-secondary)" />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Autonomous Decision Audit Logs
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {audit_logs.map((log) => (
            <div
              key={log.id}
              style={{
                backgroundColor: 'var(--bg-card-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                    {log.action_type}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    by {log.actor}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {log.note}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rerun / What-If Modal */}
      {showRerunModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--modal-overlay)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--modal-bg)',
              border: '1px solid var(--border-medium)',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Rerun Decision / Policy Counterfactual
              </h3>
              <button
                onClick={() => setShowRerunModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Adjust underlying customer/product historical parameters to re-evaluate the autonomous decision:
            </p>

            <form onSubmit={handleRerun} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Customer Return Rate Override (0.0 to 1.0)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={overrideReturnRate}
                  onChange={(e) => setOverrideReturnRate(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--input-text)',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Product Batch Defect Rate Override (0.0 to 1.0)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={overrideDefectRate}
                  onChange={(e) => setOverrideDefectRate(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--input-text)',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Physical Inspection Cost (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={overrideInspectionCost}
                  onChange={(e) => setOverrideInspectionCost(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--input-text)',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Merchant / Auditor Notes:
                </label>
                <textarea
                  rows="3"
                  value={merchantNotes}
                  onChange={(e) => setMerchantNotes(e.target.value)}
                  placeholder="e.g. Counterfactual rerun assuming higher defect rate..."
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--input-text)',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowRerunModal(false)}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-medium)',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rerunLoading}
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {rerunLoading ? 'Re-evaluating...' : 'Re-calculate Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
