import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import MetricCard from '../components/common/MetricCard';
import {
  TrendingDown,
  DollarSign,
  ShieldAlert,
  Percent,
  RefreshCw,
  Layers,
  BarChart2,
  PieChart as PieIcon,
  Cpu,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAnalyticsOverview();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Aggregating ReturnWise Loss Prevention & Defect Trends...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#F87171' }}>
        <p>Error: {error}</p>
        <button
          onClick={fetchAnalytics}
          style={{
            marginTop: '12px',
            backgroundColor: '#1E293B',
            color: '#F8FAFC',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #334155',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Formatting for Recharts
  const actionData = Object.entries(data.actions_breakdown || {}).map(([name, count]) => ({
    name,
    count,
  }));

  const actionColors = {
    APPROVE: '#3B82F6',
    INSPECT: '#A855F7',
    EXCHANGE: '#14B8A6',
    RESTRICT: '#F43F5E',
    ESCALATE: '#F59E0B',
  };

  const baselineComparisonData = [
    {
      category: 'Financial Loss Comparison',
      'Naive Rule Baseline Loss': data.total_baseline_loss,
      'RETURNWISE Optimized Loss': data.total_returnwise_loss,
    },
  ];

  return (
    <div style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Loss Prevention & Decision Analytics
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Comprehensive overview of prevented financial losses, defect patterns, and AI action distributions.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Top 4 KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <MetricCard
          title="Total Loss Prevented"
          value={`₹${data.total_loss_prevented.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Direct bottom-line savings"
          icon={TrendingDown}
          color="emerald"
        />
        <MetricCard
          title="Loss Reduction Rate"
          value={`${data.expected_loss_reduction_pct}%`}
          subtitle="Saved vs standard baseline policy"
          icon={Percent}
          color="blue"
        />
        <MetricCard
          title="Returns Triaged"
          value={data.total_returns_processed}
          subtitle={`${data.potential_abuse_count} abuse &bull; ${data.legitimate_count} legit &bull; ${data.uncertain_count} uncertain`}
          icon={ShieldAlert}
          color="purple"
        />
        <MetricCard
          title="Total Baseline Cost"
          value={`₹${data.total_baseline_loss.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle={`Reduced to ₹${data.total_returnwise_loss.toFixed(2)}`}
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Main Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        
        {/* Chart 1: Prevented Loss / Baseline Comparison */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '22px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <BarChart2 size={18} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Baseline vs. RETURNWISE Expected Loss
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Comparing naive 30-day e-commerce return policy baseline against RETURNWISE optimization (₹ saved: ₹{data.total_loss_prevented.toFixed(2)})
          </p>

          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={baselineComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="category" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  formatter={(val) => [`₹${Number(val).toFixed(2)}`, '']}
                />
                <Legend />
                <Bar dataKey="Naive Rule Baseline Loss" fill="#EF4444" radius={[6, 6, 0, 0]} />
                <Bar dataKey="RETURNWISE Optimized Loss" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Action Distribution */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '22px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <PieIcon size={18} color="#8B5CF6" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recommended Action Breakdown
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Distribution of autonomous actions (APPROVE, INSPECT, EXCHANGE, RESTRICT, ESCALATE)
          </p>

          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={actionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {actionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={actionColors[entry.name] || '#3B82F6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Return Abuse & Defect Trends Timeline */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '22px', marginBottom: '28px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Layers size={18} color="#10B981" />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Timeline Returns & Abuse Trend
          </h2>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Daily volume of legitimate, abuse-flagged, and uncertain returns over time.
        </p>

        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer>
            <LineChart data={data.timeline_trends} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} />
              <Legend />
              <Line type="monotone" dataKey="legitimate_returns" name="Legitimate" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="abuse_returns" name="Potential Abuse" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="uncertain_returns" name="Uncertain" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Defect Heatmap & Category Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '22px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Cpu size={18} color="#F59E0B" />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Product Category Defect & Batch Anomaly Metrics
          </h2>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Real-time tracking of manufacturing defect clusters vs buyer remorse return rates.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Total Returns Processed</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Average Defect Rate</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>High Defect Batches</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Avg Product Retail Price</th>
              </tr>
            </thead>
            <tbody>
              {data.category_defect_stats.map((cat, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{cat.category}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{cat.total_returns}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        backgroundColor: cat.defect_rate >= 0.05 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: cat.defect_rate >= 0.05 ? '#EF4444' : '#10B981',
                      }}
                    >
                      {Math.round(cat.defect_rate * 100)}%
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {cat.high_defect_batches > 0 ? (
                      <span style={{ color: '#EF4444', fontWeight: 700 }}>
                        {cat.high_defect_batches} batch(es) flagged
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>0 (Normal)</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    ₹{cat.avg_price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
