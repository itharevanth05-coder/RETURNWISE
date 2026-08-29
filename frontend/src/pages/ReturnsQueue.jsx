import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import RiskBadge from '../components/common/RiskBadge';
import ActionBadge from '../components/common/ActionBadge';
import MetricCard from '../components/common/MetricCard';
import {
  Search,
  Filter,
  ShieldAlert,
  DollarSign,
  TrendingDown,
  Eye,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function ReturnsQueue({ onSelectReturn }) {
  const [returns, setReturns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [error, setError] = useState(null);

  // New Return Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [modalMode, setModalMode] = useState('preset'); // 'preset' or 'custom'
  
  // Preset Mode State
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  
  // Custom Idea Mode State
  const [customCustName, setCustomCustName] = useState('Rajesh Malhotra');
  const [customReturnRate, setCustomReturnRate] = useState(0.20);
  const [customWardrobeScore, setCustomWardrobeScore] = useState(0.15);
  const [customProdTitle, setCustomProdTitle] = useState('Wireless ANC Gaming Headset Pro');
  const [customProdCategory, setCustomProdCategory] = useState('Electronics');
  const [customProdPrice, setCustomProdPrice] = useState('349.99');
  const [customBatchDefectRate, setCustomBatchDefectRate] = useState(0.03);

  // Return Context State
  const [statedReason, setStatedReason] = useState('DEFECTIVE');
  const [customerComment, setCustomerComment] = useState('');
  const [claimedCondition, setClaimedCondition] = useState('OPENED_LIKE_NEW');
  const [daysSinceDelivery, setDaysSinceDelivery] = useState(3);
  const [photosProvided, setPhotosProvided] = useState(false);

  const fetchReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReturns({
        search: search || undefined,
        risk_category: riskFilter || undefined,
        action: actionFilter || undefined,
      });
      setReturns(data);
    } catch (err) {
      setError(err.message || 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
    // Preload entities for create modal
    Promise.all([api.getCustomers(), api.getProducts()]).then(([cList, pList]) => {
      setCustomers(cList);
      setProducts(pList);
      if (cList.length > 0) setSelectedCustomer(cList[0].id);
      if (pList.length > 0) setSelectedProduct(pList[0].id);
    }).catch(console.error);
  }, [search, riskFilter, actionFilter]);

  // Preset Scenario loader for quick demo
  const loadPreset = (presetType) => {
    setModalMode('preset');
    if (presetType === 'wardrobing') {
      const wardCust = customers.find((c) => c.serial_wardrober_score > 0.6) || customers[0];
      const dressProd = products.find((p) => p.category.includes('Luxury')) || products[0];
      if (wardCust) setSelectedCustomer(wardCust.id);
      if (dressProd) setSelectedProduct(dressProd.id);
      setStatedReason('DEFECTIVE');
      setCustomerComment('Wore to wedding dinner Saturday night, zipper felt slightly loose and no longer need it.');
      setClaimedCondition('USED');
      setDaysSinceDelivery(4);
      setPhotosProvided(false);
    } else if (presetType === 'defect') {
      const vipCust = customers.find((c) => c.ltv_tier === 'VIP') || customers[0];
      const defectProd = products.find((p) => p.batch_defect_rate >= 0.06) || products[0];
      if (vipCust) setSelectedCustomer(vipCust.id);
      if (defectProd) setSelectedProduct(defectProd.id);
      setStatedReason('DEFECTIVE');
      setCustomerComment('Screen flickers with green lines continuously out of the box.');
      setClaimedCondition('OPENED_LIKE_NEW');
      setDaysSinceDelivery(2);
      setPhotosProvided(true);
    } else if (presetType === 'sizing') {
      const legitCust = customers.find((c) => c.return_rate < 0.15) || customers[0];
      const shoeProd = products.find((p) => p.category.includes('Footwear') || p.category.includes('Apparel')) || products[0];
      if (legitCust) setSelectedCustomer(legitCust.id);
      if (shoeProd) setSelectedProduct(shoeProd.id);
      setStatedReason('DOES_NOT_FIT');
      setCustomerComment('Fits slightly smaller than standard size, need exchange if available.');
      setClaimedCondition('UNOPENED');
      setDaysSinceDelivery(1);
      setPhotosProvided(true);
    } else if (presetType === 'custom') {
      setModalMode('custom');
      setStatedReason('DEFECTIVE');
      setCustomerComment('Left earpiece crackles and disconnects after 5 minutes of listening.');
      setClaimedCondition('OPENED_LIKE_NEW');
      setDaysSinceDelivery(3);
      setPhotosProvided(true);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const payload = modalMode === 'custom' ? {
        stated_reason: statedReason,
        customer_comment: customerComment,
        claimed_condition: claimedCondition,
        days_since_delivery: parseInt(daysSinceDelivery),
        photos_provided: photosProvided,
        custom_customer_name: customCustName || 'Custom Shopper',
        custom_customer_return_rate: parseFloat(customReturnRate),
        custom_wardrober_score: parseFloat(customWardrobeScore),
        custom_product_title: customProdTitle || 'Custom Product Claim',
        custom_product_category: customProdCategory,
        custom_product_price: parseFloat(customProdPrice) || 199.0,
        custom_batch_defect_rate: parseFloat(customBatchDefectRate),
      } : {
        customer_id: parseInt(selectedCustomer),
        product_id: parseInt(selectedProduct),
        stated_reason: statedReason,
        customer_comment: customerComment,
        claimed_condition: claimedCondition,
        days_since_delivery: parseInt(daysSinceDelivery),
        photos_provided: photosProvided,
      };

      const res = await api.createReturnRequest(payload);
      setShowCreateModal(false);
      await fetchReturns();
      if (res.return_id) {
        onSelectReturn(res.return_id);
      }
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  // Aggregate stats
  const total = returns.length;
  const abuseCount = returns.filter((r) => r.decision?.risk_category === 'POTENTIAL_ABUSE').length;
  const totalSaved = returns.reduce((acc, r) => acc + (r.decision?.loss_prevented || 0), 0);

  return (
    <div style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Banner & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Returns Triage & Investigation Queue
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Autonomous real-time risk assessment, financial expected loss scoring, and action optimization.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)',
          }}
        >
          <PlusCircle size={16} />
          Simulate New Return Claim
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <MetricCard
          title="Active Returns"
          value={total}
          subtitle="Triaged by AI Investigator"
          icon={ShieldAlert}
          color="blue"
        />
        <MetricCard
          title="Potential Abuse Flagged"
          value={abuseCount}
          subtitle={`${total > 0 ? Math.round((abuseCount / total) * 100) : 0}% of incoming returns`}
          icon={AlertCircle}
          color="rose"
        />
        <MetricCard
          title="Loss Prevented (ROI)"
          value={`₹${totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Saved vs standard approval baseline"
          icon={TrendingDown}
          color="emerald"
        />
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '280px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              placeholder="Search by customer, return ID, or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '8px',
                padding: '10px 12px 10px 36px',
                fontSize: '13px',
                color: 'var(--input-text)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Risk Category Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '13px',
              color: 'var(--input-text)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All Risk Tiers</option>
            <option value="LEGITIMATE">Legitimate</option>
            <option value="POTENTIAL_ABUSE">Potential Abuse</option>
            <option value="UNCERTAIN">Uncertain</option>
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '13px',
              color: 'var(--input-text)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All Actions</option>
            <option value="APPROVE">APPROVE</option>
            <option value="INSPECT">INSPECT</option>
            <option value="EXCHANGE">EXCHANGE</option>
            <option value="RESTRICT">RESTRICT</option>
            <option value="ESCALATE">ESCALATE</option>
          </select>

          <button
            onClick={fetchReturns}
            style={{
              backgroundColor: 'var(--bg-subtle)',
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
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Triage Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Evaluating returns with AI Decision Engine...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>
            <p>Error: {error}</p>
          </div>
        ) : returns.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No return requests match your criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Return Ref</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Product & Price</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Stated Reason</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>AI Risk Level</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Recommended Action</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Expected Loss</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Loss Prevented</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'center' }}>Investigate</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((item) => {
                  const decision = item.decision;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--table-row-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 18px', fontFamily: 'JetBrains Mono', color: 'var(--brand-primary)', fontWeight: 600 }}>
                        {item.return_ref}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.customer.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Ret Rate: {Math.round(item.customer.return_rate * 100)}% ({item.customer.total_returns}/{item.customer.total_orders})
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.product.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          ₹{item.product.price.toFixed(2)} &bull; {item.product.category}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-primary)',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {item.stated_reason.replace('_', ' ')}
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {item.days_since_delivery} days post-delivery
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {decision ? (
                          <RiskBadge category={decision.risk_category} score={decision.abuse_probability} />
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Pending</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {decision ? (
                          <ActionBadge action={decision.selected_action} />
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Pending</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{decision ? decision.expected_loss_selected.toFixed(2) : '-'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {decision && decision.loss_prevented > 0 ? (
                          <span style={{ color: '#10B981', fontWeight: 700 }}>
                            +₹{decision.loss_prevented.toFixed(2)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>₹0.00</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <button
                          onClick={() => onSelectReturn(item.id)}
                          style={{
                            backgroundColor: 'var(--brand-primary)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Eye size={14} />
                          Investigate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Return Submission & Simulation Modal */}
      {showCreateModal && (
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
              maxWidth: '600px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Simulate New Return Claim
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}
              >
                &times;
              </button>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', backgroundColor: 'var(--bg-subtle)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setModalMode('preset')}
                style={{
                  flex: 1,
                  backgroundColor: modalMode === 'preset' ? 'var(--bg-card)' : 'transparent',
                  color: modalMode === 'preset' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  border: modalMode === 'preset' ? '1px solid var(--border-medium)' : 'none',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: modalMode === 'preset' ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none',
                }}
              >
                <Zap size={14} /> Catalog & Presets
              </button>
              <button
                type="button"
                onClick={() => setModalMode('custom')}
                style={{
                  flex: 1,
                  backgroundColor: modalMode === 'custom' ? 'var(--bg-card)' : 'transparent',
                  color: modalMode === 'custom' ? '#10B981' : 'var(--text-secondary)',
                  border: modalMode === 'custom' ? '1px solid var(--border-medium)' : 'none',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: modalMode === 'custom' ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none',
                }}
              >
                <Sparkles size={14} /> ✍️ Custom Return Idea
              </button>
            </div>

            {/* Demo Presets Quick Buttons */}
            {modalMode === 'preset' && (
              <div style={{ marginBottom: '18px', backgroundColor: 'var(--bg-card-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Quick Demo Presets:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => loadPreset('wardrobing')}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid #EF444455',
                      color: '#EF4444',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    👠 Serial Wardrober Claim
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('defect')}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid #10B98155',
                      color: '#10B981',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    🖥️ Defective Batch Victim
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('sizing')}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid #3B82F655',
                      color: '#3B82F6',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    👟 Genuine Sizing Misfit
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('custom')}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid #10B98155',
                      color: '#10B981',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ✍️ Create Custom Idea
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {modalMode === 'preset' ? (
                <>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Select Customer:
                    </label>
                    <select
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      style={{ width: '100%', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--input-text)' }}
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} - {c.ltv_tier} (Ret: {Math.round(c.return_rate * 100)}%, Wardrobe: {c.serial_wardrober_score.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Select Product:
                    </label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      style={{ width: '100%', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--input-text)' }}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} (₹{p.price}) - Defect: {Math.round(p.batch_defect_rate * 100)}%
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                /* Custom Idea Inputs */
                <div style={{ backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', marginBottom: '2px' }}>
                    1. Custom Customer Persona
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Customer Name:</label>
                      <input
                        type="text"
                        value={customCustName}
                        onChange={(e) => setCustomCustName(e.target.value)}
                        placeholder="e.g. Vikram Sharma"
                        style={{ width: '100%', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--input-text)', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Return Rate: {Math.round(customReturnRate * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.0"
                        max="0.95"
                        step="0.05"
                        value={customReturnRate}
                        onChange={(e) => setCustomReturnRate(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#3B82F6' }}
                      />
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', marginTop: '6px', marginBottom: '2px' }}>
                    2. Custom Product Details
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Product Title:</label>
                    <input
                      type="text"
                      value={customProdTitle}
                      onChange={(e) => setCustomProdTitle(e.target.value)}
                      placeholder="e.g. 4K Pro Video Drone with Stabilizer"
                      style={{ width: '100%', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--input-text)', fontSize: '12px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category:</label>
                      <select
                        value={customProdCategory}
                        onChange={(e) => setCustomProdCategory(e.target.value)}
                        style={{ width: '100%', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', padding: '6px 8px', color: 'var(--input-text)', fontSize: '12px' }}
                      >
                        <option value="Electronics">Electronics</option>
                        <option value="Luxury Apparel">Luxury Apparel</option>
                        <option value="Footwear">Footwear</option>
                        <option value="Designer Handbags">Designer Handbags</option>
                        <option value="Apparel">Apparel</option>
                        <option value="Home & Kitchen">Home & Kitchen</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Price (₹):</label>
                      <input
                        type="number"
                        min="10"
                        max="10000"
                        value={customProdPrice}
                        onChange={(e) => setCustomProdPrice(e.target.value)}
                        style={{ width: '100%', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', padding: '6px 8px', color: 'var(--input-text)', fontSize: '12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Defect: {Math.round(customBatchDefectRate * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.01"
                        max="0.25"
                        step="0.01"
                        value={customBatchDefectRate}
                        onChange={(e) => setCustomBatchDefectRate(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#0284C7' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Stated Reason:
                  </label>
                  <select
                    value={statedReason}
                    onChange={(e) => setStatedReason(e.target.value)}
                    style={{ width: '100%', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--input-text)' }}
                  >
                    <option value="DEFECTIVE">DEFECTIVE</option>
                    <option value="DOES_NOT_FIT">DOES_NOT_FIT</option>
                    <option value="CHANGED_MIND">CHANGED_MIND</option>
                    <option value="NOT_AS_DESCRIBED">NOT_AS_DESCRIBED</option>
                    <option value="WRONG_ITEM">WRONG_ITEM</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Claimed Condition:
                  </label>
                  <select
                    value={claimedCondition}
                    onChange={(e) => setClaimedCondition(e.target.value)}
                    style={{ width: '100%', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--input-text)' }}
                  >
                    <option value="UNOPENED">UNOPENED</option>
                    <option value="OPENED_LIKE_NEW">OPENED_LIKE_NEW</option>
                    <option value="USED">USED</option>
                    <option value="DAMAGED">DAMAGED</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Customer Freeform Comment / Claim Story:
                </label>
                <textarea
                  rows="2"
                  value={customerComment}
                  onChange={(e) => setCustomerComment(e.target.value)}
                  placeholder="e.g. Wore once for event, or screen stopped working, or battery drains instantly..."
                  style={{ width: '100%', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--input-text)', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Days Since Delivery:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="45"
                    value={daysSinceDelivery}
                    onChange={(e) => setDaysSinceDelivery(e.target.value)}
                    style={{ width: '100%', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--input-text)' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '18px' }}>
                  <input
                    type="checkbox"
                    id="photosCheck"
                    checked={photosProvided}
                    onChange={(e) => setPhotosProvided(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#3B82F6' }}
                  />
                  <label htmlFor="photosCheck" style={{ fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Supporting Photos Attached
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-medium)', padding: '8px 14px', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{ backgroundColor: 'var(--brand-primary)', border: 'none', padding: '8px 20px', borderRadius: '6px', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  {createLoading ? 'Investigating...' : 'Submit & Trigger AI Investigation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
