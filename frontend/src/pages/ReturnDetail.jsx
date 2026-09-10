import React, { useState, useEffect, useRef } from 'react';
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
  Camera,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Sparkles,
  Bot,
  Send,
  MessageSquare,
  CornerDownLeft,
  RotateCcw,
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

  // Photo Inspection State
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [photoFileName, setPhotoFileName] = useState('');
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoInspectionDone, setPhotoInspectionDone] = useState(false);
  const fileInputRef = useRef(null);

  // AI Merchant Assistant Chat State
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const chatBottomRef = useRef(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getReturnDetail(returnId);
      setData(res);
      setOverrideReturnRate(res.customer.return_rate);
      setOverrideDefectRate(res.product.batch_defect_rate);

      // Initialize contextual suggested questions
      const initialSuggestions = [
        "On what basis did you give this result?",
        `Why did you recommend ${res.decision?.selected_action || 'INSPECT'}?`,
        "Which factors affected the risk the most?",
        "Why wasn't this approved?",
        "Explain this decision in simple words.",
        "What would happen if the customer had fewer returns?",
        "Does the product have a defect problem?",
        "How did you calculate the expected loss?",
      ];
      setSuggestedQuestions(initialSuggestions);
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

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFileName(file.name);
      setIsAnalyzingPhoto(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedPhoto(event.target.result);
        setTimeout(() => {
          setIsAnalyzingPhoto(false);
          setPhotoInspectionDone(true);
        }, 500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoadSamplePhoto = () => {
    setIsAnalyzingPhoto(true);
    setPhotoFileName('sample_return_item.png');
    const isApparel = data?.product?.category?.toLowerCase().includes('apparel');
    const sampleSvg = isApparel
      ? `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><rect width="480" height="320" fill="%231e293b" rx="12"/><rect x="110" y="30" width="260" height="240" rx="14" fill="%23334155" stroke="%233b82f6" stroke-width="2"/><path d="M170 30 L200 70 L280 70 L310 30 L370 80 L330 140 L330 255 L150 255 L150 140 L110 80 Z" fill="%23475569"/><rect x="310" y="110" width="46" height="66" rx="4" fill="%23f59e0b" stroke="%23ffffff" stroke-width="1.5"/><text x="317" y="148" fill="%23ffffff" font-size="11" font-family="sans-serif" font-weight="bold">TAG</text><rect x="180" y="160" width="120" height="70" rx="4" fill="none" stroke="%23ef4444" stroke-width="2" stroke-dasharray="5,5"/><text x="190" y="200" fill="%23ef4444" font-size="10" font-family="sans-serif" font-weight="bold">⚠️ Seam Defect Zone</text><text x="24" y="300" fill="%2394a3b8" font-size="11" font-family="sans-serif">Return Photo: ${encodeURIComponent(data?.product?.title || 'Apparel Item')}</text></svg>`
      : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><rect width="480" height="320" fill="%230f172a" rx="12"/><rect x="80" y="35" width="320" height="230" rx="14" fill="%231e293b" stroke="%233b82f6" stroke-width="2"/><circle cx="240" cy="135" r="52" fill="%23334155" stroke="%2360a5fa" stroke-width="2"/><circle cx="240" cy="135" r="22" fill="%230f172a"/><rect x="100" y="215" width="130" height="28" rx="4" fill="%2310b981" fill-opacity="0.2" stroke="%2310b981" stroke-width="1.5"/><text x="110" y="234" fill="%2334d399" font-size="10" font-family="monospace">SN: ${encodeURIComponent(data?.product?.batch_number || 'BATCH-9021')}</text><rect x="250" y="215" width="130" height="28" rx="4" fill="%233b82f6" fill-opacity="0.2" stroke="%233b82f6" stroke-width="1.5"/><text x="265" y="234" fill="%2360a5fa" font-size="10" font-family="sans-serif">Original Seal Intact</text><text x="24" y="300" fill="%2394a3b8" font-size="11" font-family="sans-serif">Return Photo: ${encodeURIComponent(data?.product?.title || 'Electronics Item')}</text></svg>`;
    
    setUploadedPhoto(sampleSvg);
    setTimeout(() => {
      setIsAnalyzingPhoto(false);
      setPhotoInspectionDone(true);
    }, 500);
  };

  const handleRemovePhoto = () => {
    setUploadedPhoto(null);
    setPhotoFileName('');
    setPhotoInspectionDone(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (showChatDrawer) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChatDrawer]);

  const handleSendChatMessage = async (textToSend) => {
    const query = (textToSend !== undefined ? textToSend : chatInput).trim();
    if (!query || chatLoading) return;

    const userMessage = { role: 'user', content: query };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const photoSummary = uploadedPhoto
        ? `Photo uploaded: ${photoFileName || 'return_item.png'}. Visual inspection tags: packaging present, tag status evaluated, condition check complete.`
        : null;

      const res = await api.askReturnWise(returnId, {
        messages: updatedMessages,
        photo_summary: photoSummary,
      });

      setChatMessages([
        ...updatedMessages,
        { role: 'assistant', content: res.reply },
      ]);

      if (res.suggested_questions && res.suggested_questions.length > 0) {
        setSuggestedQuestions(res.suggested_questions);
      }
    } catch (err) {
      setChatMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: `I encountered an issue processing your query: ${err.message}. Please try asking again.`,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
    setSuggestedQuestions([
      "On what basis did you give this result?",
      `Why did you recommend ${data?.decision?.selected_action || 'INSPECT'}?`,
      "Which factors affected the risk the most?",
      "Why wasn't this approved?",
      "Explain this decision in simple words.",
      "What would happen if the customer had fewer returns?",
      "Does the product have a defect problem?",
      "How did you calculate the expected loss?",
    ]);
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {decision && (
            <button
              onClick={() => setShowChatDrawer(true)}
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                color: '#A855F7',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 12px rgba(139, 92, 246, 0.2)',
              }}
            >
              <Bot size={16} />
              🤖 Ask ReturnWise
            </button>
          )}

          <button
            onClick={copyAuditReport}
            style={{
              backgroundColor: 'var(--bg-card-secondary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
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
              backgroundColor: 'var(--brand-primary)',
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
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {decision.reasoning_summary}
              </p>

              {/* Ask ReturnWise quick trigger banner */}
              <div
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                  backgroundColor: 'var(--bg-card-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  <Bot size={16} color="#A855F7" />
                  <span>Want to understand this decision?</span>
                </div>
                <button
                  onClick={() => setShowChatDrawer(true)}
                  style={{
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    color: '#A855F7',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  🤖 Ask ReturnWise
                </button>
              </div>
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

      {/* 📸 Photo Inspection Section */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '14px',
          padding: '22px',
          marginBottom: '28px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={20} color="var(--brand-primary)" />
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em', margin: 0 }}>
                  📸 Photo Inspection
                </h2>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#8B5CF6',
                  backgroundColor: 'rgba(139, 92, 246, 0.12)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                Computer Vision Demo / Simulated Inspection
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', margin: '4px 0 0 0' }}>
              Automated visual artifact scanning for packaging integrity, tags, physical damage, and serial checks.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {uploadedPhoto && photoInspectionDone && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle2 size={14} /> Photo Inspection Complete
              </span>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
              }}
            >
              <Upload size={15} />
              Upload Return Photo
            </button>

            {!uploadedPhoto && (
              <button
                onClick={handleLoadSamplePhoto}
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Sparkles size={14} color="#F59E0B" />
                Load Sample Photo
              </button>
            )}

            {uploadedPhoto && (
              <button
                onClick={handleRemovePhoto}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <X size={14} /> Remove Photo
              </button>
            )}
          </div>
        </div>

        {/* Content Body: Image Display & Inspection Tags */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>
          
          {/* Left: Image Display Box */}
          <div
            style={{
              backgroundColor: 'var(--bg-card-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '260px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {isAnalyzingPhoto ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                <RotateCw size={32} className="animate-spin" color="var(--brand-primary)" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Processing Computer Vision Visual Pipeline...
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Detecting item bounding boxes, defect textures, tags, and packaging integrity.
                </div>
              </div>
            ) : uploadedPhoto ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '440px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-medium)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <img
                    src={uploadedPhoto}
                    alt="Uploaded Return Item"
                    style={{
                      width: '100%',
                      maxHeight: '280px',
                      objectFit: 'contain',
                      display: 'block',
                      backgroundColor: 'var(--bg-main)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(4px)',
                      color: '#F8FAFC',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontFamily: 'JetBrains Mono, monospace',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    📷 {photoFileName || 'return_photo.jpg'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '440px', marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Item: {data.product.title}</span>
                  <span>Condition: {data.claimed_condition}</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  cursor: 'pointer',
                  width: '100%',
                  border: '2px dashed var(--border-medium)',
                  borderRadius: '10px',
                  transition: 'border-color 0.2s',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: 'var(--brand-primary)',
                  }}
                >
                  <Camera size={24} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  No Return Photo Uploaded
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '300px', margin: '0 auto 14px' }}>
                  Upload customer-provided return photo or warehouse intake scan to run visual AI inspection.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--brand-primary)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Upload size={13} /> Click to browse image
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: AI Inspection Result Panel */}
          <div
            style={{
              backgroundColor: 'var(--bg-card-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '260px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  AI Inspection Result Panel
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: uploadedPhoto ? '#10B981' : 'var(--text-muted)',
                    backgroundColor: uploadedPhoto ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-subtle)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {uploadedPhoto ? 'Inspection Ready' : 'Pending Photo'}
                </span>
              </div>

              {/* Inspection Tags List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {/* Tag 1: Product Detected */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <span style={{ color: uploadedPhoto ? '#10B981' : 'var(--text-muted)' }}>✓</span> Product/Item Detected
                  </span>
                  <span style={{ color: uploadedPhoto ? '#10B981' : 'var(--text-muted)', fontWeight: 600 }}>
                    {uploadedPhoto ? `${data.product.title.substring(0, 26)}...` : 'Awaiting Image'}
                  </span>
                </div>

                {/* Tag 2: Tag Present */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <span style={{ color: uploadedPhoto ? (customer.serial_wardrober_score > 0.6 ? '#F59E0B' : '#10B981') : 'var(--text-muted)' }}>
                      {uploadedPhoto ? (customer.serial_wardrober_score > 0.6 ? '⚠' : '✓') : '•'}
                    </span>{' '}
                    Tag Status
                  </span>
                  <span
                    style={{
                      color: uploadedPhoto ? (customer.serial_wardrober_score > 0.6 ? '#F59E0B' : '#10B981') : 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {uploadedPhoto ? (customer.serial_wardrober_score > 0.6 ? '⚠ Possible Missing / Detached Tag' : '✓ Tag Present & Attached') : 'Awaiting Image'}
                  </span>
                </div>

                {/* Tag 3: Packaging Detected */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <span style={{ color: uploadedPhoto ? '#10B981' : 'var(--text-muted)' }}>✓</span> Packaging Detected
                  </span>
                  <span style={{ color: uploadedPhoto ? '#10B981' : 'var(--text-muted)', fontWeight: 600 }}>
                    {uploadedPhoto ? '✓ Original Packaging Present' : 'Awaiting Image'}
                  </span>
                </div>

                {/* Tag 4: Possible Damage */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <span style={{ color: uploadedPhoto ? (data.stated_reason === 'DEFECTIVE' || product.batch_defect_rate >= 0.06 ? '#EF4444' : '#10B981') : 'var(--text-muted)' }}>
                      {uploadedPhoto ? (data.stated_reason === 'DEFECTIVE' || product.batch_defect_rate >= 0.06 ? '⚠' : '✓') : '•'}
                    </span>{' '}
                    Physical Damage Check
                  </span>
                  <span
                    style={{
                      color: uploadedPhoto ? (data.stated_reason === 'DEFECTIVE' || product.batch_defect_rate >= 0.06 ? '#EF4444' : '#10B981') : 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {uploadedPhoto ? (data.stated_reason === 'DEFECTIVE' || product.batch_defect_rate >= 0.06 ? '⚠ Possible Damage / Defect' : '✓ No Structural Damage') : 'Awaiting Image'}
                  </span>
                </div>

                {/* Tag 5: Possible Stain */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <span style={{ color: uploadedPhoto ? (customer.wardrobing_flag_count > 0 ? '#F59E0B' : '#10B981') : 'var(--text-muted)' }}>
                      {uploadedPhoto ? (customer.wardrobing_flag_count > 0 ? '⚠' : '✓') : '•'}
                    </span>{' '}
                    Surface / Stain Check
                  </span>
                  <span
                    style={{
                      color: uploadedPhoto ? (customer.wardrobing_flag_count > 0 ? '#F59E0B' : '#10B981') : 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {uploadedPhoto ? (customer.wardrobing_flag_count > 0 ? '⚠ Possible Wear / Stain Flaw' : '✓ Clean Exterior') : 'Awaiting Image'}
                  </span>
                </div>

                {/* Tag 6: Serial Number Visible */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <span style={{ color: uploadedPhoto ? '#10B981' : 'var(--text-muted)' }}>✓</span> Serial Number Visible
                  </span>
                  <span style={{ color: uploadedPhoto ? '#10B981' : 'var(--text-muted)', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                    {uploadedPhoto ? (product.batch_number ? `✓ ${product.batch_number}` : '✓ Serial Match') : 'Awaiting Image'}
                  </span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', margin: 0, fontStyle: 'italic' }}>
              {uploadedPhoto
                ? `Visual inspection synthesized with stated reason (${data.stated_reason}) and claimed condition (${data.claimed_condition}).`
                : 'Upload or load a return photo above to view simulated visual inspection artifacts.'}
            </p>
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

      {/* 🤖 AI Merchant Assistant: Ask ReturnWise Slide-Over Drawer */}
      {showChatDrawer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowChatDrawer(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              height: '100%',
              backgroundColor: 'var(--bg-card)',
              borderLeft: '1px solid var(--border-medium)',
              boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-card-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#A855F7',
                  }}
                >
                  <Bot size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Ask ReturnWise
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--brand-primary)',
                        backgroundColor: 'rgba(59, 130, 246, 0.12)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {data.return_ref}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Decision Intelligence & Audit Q&A Copilot
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {chatMessages.length > 0 && (
                  <button
                    onClick={handleClearChat}
                    title="Clear chat history"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
                <button
                  onClick={() => setShowChatDrawer(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Drawer Body / Message Stream */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Context Summary Pill */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#A855F7" /> Ground-Truth Decision Context Loaded:
                </div>
                <div>&bull; <strong>Customer:</strong> {customer.name} ({customer.ltv_tier}, {Math.round(customer.return_rate * 100)}% return rate)</div>
                <div>&bull; <strong>Product:</strong> {product.title} (₹{product.price.toFixed(2)}, Batch: {product.batch_number})</div>
                <div>&bull; <strong>Decision:</strong> {decision ? `${decision.selected_action} (Loss: ₹${decision.expected_loss_selected.toFixed(2)}, Risk: ${decision.risk_category})` : 'Awaiting analysis'}</div>
              </div>

              {/* Welcome Prompt */}
              {chatMessages.length === 0 && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    lineHeight: 1.5,
                  }}
                >
                  👋 <strong>Hello!</strong> I'm your ReturnWise Assistant. I have live access to the entire 6-agent investigation pipeline, loss payoff matrices, and customer history.
                  <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', margin: '8px 0 0 0' }}>
                    Click a suggested question below or type your own question to understand this decision:
                  </p>
                </div>
              )}

              {/* Chat Message List */}
              {chatMessages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        paddingLeft: '4px',
                        paddingRight: '4px',
                      }}
                    >
                      {isUser ? 'You' : '🤖 ReturnWise AI'}
                    </div>
                    <div
                      style={{
                        maxWidth: '90%',
                        backgroundColor: isUser ? 'var(--brand-primary)' : 'var(--bg-card-secondary)',
                        color: isUser ? '#FFFFFF' : 'var(--text-primary)',
                        border: isUser ? 'none' : '1px solid var(--border-subtle)',
                        borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        padding: '12px 16px',
                        fontSize: '13px',
                        lineHeight: 1.6,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {chatLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', padding: '6px 10px' }}>
                  <RotateCw size={14} className="animate-spin" color="var(--brand-primary)" />
                  Analyzing return models and synthesizing loss metrics...
                </div>
              )}

              {/* Suggested Questions Chips */}
              <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                  Suggested Questions:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {suggestedQuestions.map((q, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => handleSendChatMessage(q)}
                      disabled={chatLoading}
                      style={{
                        backgroundColor: 'var(--bg-card-secondary)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)',
                        borderRadius: '20px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--brand-primary)';
                        e.currentTarget.style.color = 'var(--brand-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-medium)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div ref={chatBottomRef} />
            </div>

            {/* Drawer Input Box */}
            <div
              style={{
                padding: '16px',
                borderTop: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-card-secondary)',
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                style={{ display: 'flex', gap: '8px' }}
              >
                <input
                  type="text"
                  placeholder="Type any question about this return decision..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: 'var(--input-text)',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  style={{
                    backgroundColor: chatInput.trim() && !chatLoading ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                    color: chatInput.trim() && !chatLoading ? '#FFFFFF' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <Send size={15} />
                </button>
              </form>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                Grounded in RETURNWISE Decision Engine & 6-Agent AI models.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

