import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Users, Package, Search, RefreshCw, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';

export default function EntityExplorer() {
  const [activeSubTab, setActiveSubTab] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cList, pList] = await Promise.all([api.getCustomers(), api.getProducts()]);
      setCustomers(cList);
      setProducts(pList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_ref.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.product_ref.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.batch_number && p.batch_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Customer & Product Entity Directory
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Inspect historical behavioral patterns, serial wardrobing indices, and manufacturing defect batches.
        </p>
      </div>

      {/* Sub-Tabs & Search */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveSubTab('customers')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'customers' ? 'var(--brand-primary)' : 'var(--bg-subtle)',
              color: activeSubTab === 'customers' ? '#FFFFFF' : 'var(--text-secondary)',
            }}
          >
            <Users size={16} />
            Customer Profiles ({customers.length})
          </button>

          <button
            onClick={() => setActiveSubTab('products')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'products' ? 'var(--brand-primary)' : 'var(--bg-subtle)',
              color: activeSubTab === 'products' ? '#FFFFFF' : 'var(--text-secondary)',
            }}
          >
            <Package size={16} />
            Product Catalog & Batches ({products.length})
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '280px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder={activeSubTab === 'customers' ? 'Search customers...' : 'Search products or batches...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: '8px',
              padding: '8px 12px 8px 36px',
              fontSize: '13px',
              color: 'var(--input-text)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Directory Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Loading entity database records...</p>
          </div>
        ) : activeSubTab === 'customers' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Customer Ref</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Name & Email</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Orders & Spend</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Return Velocity</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Wardrober Index</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>LTV Tier</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => {
                  return (
                    <tr key={cust.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px', fontFamily: 'JetBrains Mono', color: 'var(--brand-primary)', fontWeight: 600 }}>
                        {cust.customer_ref}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cust.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cust.email}</div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          ₹{cust.total_spend.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {cust.total_orders} lifetime orders
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            backgroundColor: cust.return_rate > 0.4 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: cust.return_rate > 0.4 ? '#EF4444' : '#10B981',
                          }}
                        >
                          {Math.round(cust.return_rate * 100)}% ({cust.total_returns} returns)
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontWeight: 700, color: cust.serial_wardrober_score > 0.6 ? '#EF4444' : 'var(--text-primary)' }}>
                          {cust.serial_wardrober_score.toFixed(2)}
                        </span>
                        {cust.wardrobing_flag_count > 0 && (
                          <span style={{ fontSize: '11px', color: '#EF4444', marginLeft: '6px' }}>
                            ({cust.wardrobing_flag_count} flags)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-subtle)',
                            color: cust.ltv_tier === 'VIP' ? '#F59E0B' : (cust.ltv_tier === 'AT_RISK' ? '#EF4444' : 'var(--brand-primary)'),
                          }}
                        >
                          {cust.ltv_tier}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Product Ref</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Title & Category</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Retail / Cost Price</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Batch Number</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Batch Defect Rate</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Expected Resale Salvage</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 18px', fontFamily: 'JetBrains Mono', color: 'var(--brand-primary)', fontWeight: 600 }}>
                      {prod.product_ref}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prod.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{prod.category}</div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{prod.price.toFixed(2)}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                        (₹{prod.cost_price.toFixed(2)} cost)
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)' }}>
                      {prod.batch_number || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          backgroundColor: prod.batch_defect_rate >= 0.06 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: prod.batch_defect_rate >= 0.06 ? '#EF4444' : '#10B981',
                        }}
                      >
                        {Math.round(prod.batch_defect_rate * 100)}%
                      </span>
                      {prod.batch_defect_rate >= 0.06 && (
                        <span style={{ fontSize: '11px', color: '#EF4444', marginLeft: '6px', fontWeight: 600 }}>
                          [Defect Cluster]
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--brand-primary)', fontWeight: 600 }}>
                      {Math.round(prod.expected_salvage_rate * 100)}% of Retail
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
