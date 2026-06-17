import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  DollarSign, 
  CreditCard, 
  Receipt, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  TrendingUp,
  X,
  Plus
} from 'lucide-react';

export default function AccountManagementPortal() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    grade: '9-A',
    amount: '',
    status: 'Pending',
    method: 'Stripe Pay'
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error('Error loading invoices list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Student name is required.';
    if (!formData.amount.trim()) errors.amount = 'Invoiced billing amount is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newInvoice = await res.json();
        setInvoices([newInvoice, ...invoices]);
        setShowAddModal(false);
        setFormData({
          name: '',
          grade: '9-A',
          amount: '',
          status: 'Pending',
          method: 'Stripe Pay'
        });
        setFormErrors({});
      }
    } catch (err) {
      console.error('Error creating invoice record:', err);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute dynamic stats
  const getDynamicStats = () => {
    const collected = invoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + parseInt(inv.amount.replace(/[^0-9]/g, '') || 0), 0);

    const outstanding = invoices
      .filter(inv => inv.status === 'Pending')
      .reduce((sum, inv) => sum + parseInt(inv.amount.replace(/[^0-9]/g, '') || 0), 0);

    return [
      { label: 'Term Revenue Collected', value: `$${collected.toLocaleString()}`, icon: DollarSign, color: 'rgb(var(--color-success-rgb))', bg: 'rgba(var(--color-success-rgb), 0.1)' },
      { label: 'Outstanding Balance', value: `$${outstanding.toLocaleString()}`, icon: AlertCircle, color: 'rgb(var(--color-warning-rgb))', bg: 'rgba(var(--color-warning-rgb), 0.1)' },
      { label: 'Operational Expenses', value: '$34,120', icon: CreditCard, color: 'hsl(var(--color-primary))', bg: 'rgba(hsl(var(--color-primary)), 0.1)' }
    ];
  };

  const stats = getDynamicStats();

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Metrics Row */}
      <div className="dashboard-grid">
        {stats.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={i} className="glass-panel stat-card" style={{ gridColumn: 'span 1' }}>
              <div className="stat-info">
                <span className="stat-label">{st.label}</span>
                <span className="stat-value">{st.value}</span>
                <span className="stat-trend up" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={12}/> Standard variance
                </span>
              </div>
              <div className="stat-icon-box" style={{ color: st.color, background: st.bg }}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Action header */}
      <div className="glass-panel directory-actions" style={{ padding: '16px 24px' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Fee Collections & Receipts</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generate invoice bills, print receipts, and track collection balances.</p>
        </div>

        <div className="filter-group">
          <input 
            type="text" 
            placeholder="Search invoice number, student..." 
            className="search-bar-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.value || e.target.value)}
            style={{ width: '220px' }}
          />

          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn-primary"
          >
            <Plus size={18} /> Record Invoice
          </button>
        </div>
      </div>

      {/* Invoicing Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Student Name</th>
                <th>Grade</th>
                <th>Total Bill</th>
                <th>Due / Collection Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.invoiceNo}>
                    <td style={{ fontWeight: 600 }}>{inv.invoiceNo}</td>
                    <td style={{ fontWeight: 500 }}>{inv.name}</td>
                    <td>{inv.grade}</td>
                    <td style={{ fontWeight: 700 }}>{inv.amount}</td>
                    <td>{inv.date}</td>
                    <td>
                      <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => setActiveInvoice(inv)}
                          className="btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', gap: '4px' }}
                        >
                          <Receipt size={14} /> Receipt
                        </button>
                        {inv.status === 'Paid' && (
                          <button 
                            onClick={() => alert(`Downloading Invoice PDF: ${inv.invoiceNo}`)}
                            className="btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '8px' }}
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No collections matching this criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Invoice Modal */}
      {showAddModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem' }}>Record Student Tuition Invoice</h2>
              <button onClick={() => setShowAddModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="form-group">
                  <label>Student Full Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    className="form-control"
                    placeholder="e.g. Leo Sanders"
                  />
                  {formErrors.name && <span style={{ color: 'rgb(var(--color-danger-rgb))', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><AlertCircle size={12}/>{formErrors.name}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Grade Division</label>
                    <select 
                      name="grade" 
                      value={formData.grade} 
                      onChange={handleInputChange} 
                      className="form-control"
                    >
                      <option value="9-A">Grade 9-A</option>
                      <option value="9-B">Grade 9-B</option>
                      <option value="10-A">Grade 10-A</option>
                      <option value="10-B">Grade 10-B</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tuition Bill Amount ($)</label>
                    <input 
                      type="number" 
                      name="amount" 
                      value={formData.amount} 
                      onChange={handleInputChange} 
                      className="form-control"
                      placeholder="e.g. 1450"
                    />
                    {formErrors.amount && <span style={{ color: 'rgb(var(--color-danger-rgb))', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><AlertCircle size={12}/>{formErrors.amount}</span>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Payment Status</label>
                    <select 
                      name="status" 
                      value={formData.status} 
                      onChange={handleInputChange} 
                      className="form-control"
                    >
                      <option value="Pending">Pending Collection</option>
                      <option value="Paid">Paid Fully</option>
                    </select>
                  </div>

                  {formData.status === 'Paid' && (
                    <div className="form-group">
                      <label>Payment Method</label>
                      <select 
                        name="method" 
                        value={formData.method} 
                        onChange={handleInputChange} 
                        className="form-control"
                      >
                        <option value="Stripe Pay">Stripe Pay</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Direct ACH">Direct ACH</option>
                        <option value="Cash / Cheque">Cash / Cheque</option>
                      </select>
                    </div>
                  )}
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Invoice Billing
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Receipt Drawer Overlays */}
      {activeInvoice && (
        <div className="drawer-overlay" onClick={() => setActiveInvoice(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={22} style={{ color: 'hsl(var(--color-primary))' }} /> Aether Receipt Drawer
              </h2>
              <button onClick={() => setActiveInvoice(null)} className="modal-close">
                <X size={22} />
              </button>
            </div>

            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Receipt Body mock */}
              <div className="receipt-box">
                <div className="receipt-header">
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>AETHER ACADEMY GROUP</h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>100 Skyline Blvd, Suite A | admin@aether.edu</span>
                </div>

                <div className="receipt-row">
                  <span>INVOICE NUMBER:</span>
                  <strong>{activeInvoice.invoiceNo}</strong>
                </div>
                <div className="receipt-row">
                  <span>DATE:</span>
                  <strong>{activeInvoice.date}</strong>
                </div>
                <div className="receipt-row">
                  <span>STUDENT COHORT:</span>
                  <strong>{activeInvoice.name} ({activeInvoice.grade})</strong>
                </div>
                <div className="receipt-row">
                  <span>PAYMENT MECHANISM:</span>
                  <strong>{activeInvoice.method}</strong>
                </div>

                <div style={{ margin: '16px 0', borderBottom: '1px dashed var(--border-glass)' }}></div>

                <div className="receipt-row" style={{ fontWeight: 700 }}>
                  <span>ITEM / DETAILS</span>
                  <span>SUBTOTAL</span>
                </div>
                
                <div className="receipt-row">
                  <span>Tuition Tuition (Term 2)</span>
                  <span>{activeInvoice.amount}</span>
                </div>

                <div className="receipt-row">
                  <span>Resource & Lab Fee</span>
                  <span>$0.00</span>
                </div>

                <div style={{ margin: '16px 0', borderBottom: '1px dashed var(--border-glass)' }}></div>

                <div className="receipt-row" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                  <span>NET TOTAL DUE:</span>
                  <span>{activeInvoice.amount}</span>
                </div>

                <div className="receipt-row" style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '12px' }}>
                  <span>BILL STATUS:</span>
                  <span style={{ color: activeInvoice.status === 'Paid' ? 'rgb(var(--color-success-rgb))' : 'rgb(var(--color-danger-rgb))' }}>
                    {activeInvoice.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Drawer actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                <button onClick={() => window.print()} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <Printer size={16} /> Print Receipt
                </button>
                <button onClick={() => setActiveInvoice(null)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Close Receipt
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
