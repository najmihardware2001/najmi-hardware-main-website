import { useState, useEffect } from 'react';
import { api, type ApiPartner } from '../../services/api';
import { useStore } from '../../StoreContext';

export default function AdminCustomers() {
  const { showToast } = useStore();
  const [loadError,setLoadError]=useState('');
  const [viewMode, setViewMode] = useState<'crm' | 'partners'>('crm');
  
  // CRM Customers State
  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  const [crmTotal, setCrmTotal] = useState<number>(0);
  const [crmLoading, setCrmLoading] = useState(false);
  const [crmSearch, setCrmSearch] = useState('');
  const [crmClassification, setCrmClassification] = useState('');

  // Selected Customer for CRM Drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ERP Partners State
  const [partners, setPartners] = useState<ApiPartner[]>([]);
  const [partnerTotal, setPartnerTotal] = useState<number>(0);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerTypeFilter, setPartnerTypeFilter] = useState('');
  const [partnerSearch, setPartnerSearch] = useState('');

  // ── Fetch CRM Customers ──
  const fetchCrmCustomers = async () => {
    setCrmLoading(true);setLoadError('');
    try {
      const res = await api.getAdminCustomers({
        search: crmSearch || undefined,
        classification: crmClassification || undefined,
      });
      setCrmCustomers(res.customers || []);
      setCrmTotal(res.total || 0);
    } catch (err: any) {
      setLoadError(err.message||'Unable to load customers');
    } finally {
      setCrmLoading(false);
    }
  };

  // ── Fetch ERP Partners ──
  const fetchPartners = async () => {
    setPartnerLoading(true);
    try {
      const res = await api.getPartners({
        type: partnerTypeFilter || undefined,
        search: partnerSearch || undefined,
      });
      setPartners(res.items);
      setPartnerTotal(res.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load ERP partners', 'error');
    } finally {
      setPartnerLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'crm') {
      fetchCrmCustomers();
    } else {
      fetchPartners();
    }
  }, [viewMode, crmSearch, crmClassification, partnerTypeFilter, partnerSearch]);

  const loadCustomerDetail = async (id: string) => {
    setSelectedCustomerId(id);
    setDetailLoading(true);
    try {
      const data = await api.getAdminCustomerById(id);
      setCustomerDetail(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch customer profile', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !newNote.trim()) return;
    setAddingNote(true);
    try {
      await api.addCustomerNote(selectedCustomerId, newNote.trim());
      showToast('Internal CRM note recorded', 'check_circle');
      setNewNote('');
      loadCustomerDetail(selectedCustomerId);
    } catch (err: any) {
      showToast(err.message || 'Failed to add note', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  const handleUpdateClassification = async (newClass: string) => {
    if (!selectedCustomerId) return;
    setUpdatingStatus(true);
    try {
      await api.updateCustomerStatus(selectedCustomerId, { customerClass: newClass });
      showToast(`Customer classification updated to ${newClass}`, 'check_circle');
      loadCustomerDetail(selectedCustomerId);
      fetchCrmCustomers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update classification', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedCustomerId) return;
    setUpdatingStatus(true);
    try {
      await api.updateCustomerStatus(selectedCustomerId, { status: newStatus });
      showToast(`Account status updated to ${newStatus}`, 'check_circle');
      loadCustomerDetail(selectedCustomerId);
      fetchCrmCustomers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getClassBadge = (cls?: string) => {
    const c = cls || 'REGULAR';
    const map: Record<string, { bg: string; color: string }> = {
      VIP: { bg: '#fef3c7', color: '#92400e' },
      WHOLESALE: { bg: '#dbeafe', color: '#1e40af' },
      CONTRACTOR: { bg: '#e0e7ff', color: '#3730a3' },
      REGULAR: { bg: '#f3f4f6', color: '#374151' },
      SUSPENDED: { bg: '#fee2e2', color: '#991b1b' },
    };
    const style = map[c] || map.REGULAR;
    return (
      <span style={{
        padding: '3px 8px', borderRadius: 4,
        background: style.bg, color: style.color, fontSize: 11, fontWeight: 700
      }}>
        {c}
      </span>
    );
  };

  const getStatusBadge = (st?: string) => {
    const s = st || 'ACTIVE';
    const isAct = s === 'ACTIVE';
    return (
      <span style={{
        padding: '3px 8px', borderRadius: 9999,
        background: isAct ? '#dcfce7' : '#fee2e2',
        color: isAct ? '#166534' : '#991b1b',
        fontSize: 11, fontWeight: 700
      }}>
        {s}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {loadError&&<p role="alert" className="admin-error">{loadError} <button onClick={fetchCrmCustomers}>Retry</button></p>}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#fff' }}>people</span>
          </div>
          <div>
            <h1 className="text-headline-md" style={{ color: 'var(--primary)', margin: 0, lineHeight: 1.2 }}>
              Customer Accounts & CRM
            </h1>
            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
              E-Commerce Client Profiles, Kuwait Addresses, COD Order History & Partner Masters
            </span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div style={{
          display: 'inline-flex', padding: 3, borderRadius: 8,
          background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)'
        }}>
          <button
            onClick={() => setViewMode('crm')}
            style={{
              padding: '6px 14px', borderRadius: 6, border: 'none',
              background: viewMode === 'crm' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'crm' ? '#fff' : 'var(--on-surface)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>account_circle</span>
            E-Commerce CRM ({crmTotal})
          </button>
          <button
            onClick={() => setViewMode('partners')}
            style={{
              padding: '6px 14px', borderRadius: 6, border: 'none',
              background: viewMode === 'partners' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'partners' ? '#fff' : 'var(--on-surface)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>account_balance</span>
            ERP Master & Ledger ({partnerTotal})
          </button>
        </div>
      </div>

      {/* CRM Customer Directory View */}
      {viewMode === 'crm' && (
        <>
          {/* Controls Bar */}
          <div className="card" style={{ padding: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--outline)', fontSize: 20
              }}>search</span>
              <input
                type="text"
                placeholder="Search by customer name, phone, email, civil ID / CR..."
                value={crmSearch}
                onChange={e => setCrmSearch(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 40px', borderRadius: 8,
                  border: '1px solid var(--outline-variant)', background: 'var(--surface)'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Classification:</label>
              <select
                value={crmClassification}
                onChange={e => setCrmClassification(e.target.value)}
                style={{
                  padding: '8px 12px', borderRadius: 8,
                  border: '1px solid var(--outline-variant)', background: 'var(--surface)'
                }}
              >
                <option value="">All Classes</option>
                <option value="REGULAR">Regular Retail</option>
                <option value="VIP">VIP Customer</option>
                <option value="CONTRACTOR">Contractor</option>
                <option value="WHOLESALE">Wholesale Client</option>
              </select>
            </div>

            <button onClick={fetchCrmCustomers} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span> Refresh
            </button>
          </div>

          {/* Table */}
          {crmLoading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--outline)' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>progress_activity</span>
              <p style={{ marginTop: 8 }}>Loading customer CRM records...</p>
            </div>
          ) : !loadError&&crmCustomers.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline)' }}>people_outline</span>
              <h3 className="text-headline-sm" style={{ marginTop: 12 }}>No Customers Found</h3>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                Registered customers and guests who place Cash on Delivery orders will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer & Company</th>
                    <th>Kuwait Contact</th>
                    <th>Classification</th>
                    <th>Status</th>
                    <th>COD Orders</th>
                    <th>Lifetime Spent</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {crmCustomers.map(cust => (
                    <tr key={cust.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{cust.name}</span>
                          {cust.nameAr && <span className="text-label-sm" style={{ color: 'var(--outline)', direction: 'rtl' }}>{cust.nameAr}</span>}
                          {cust.companyName && (
                            <span className="text-label-sm" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                              🏢 {cust.companyName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="text-body-sm" style={{ fontFamily: 'monospace' }}>{cust.phone}</span>
                          <span className="text-label-sm" style={{ color: 'var(--outline)' }}>{cust.email}</span>
                          {cust.civilIdOrCr && (
                            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', fontFamily: 'monospace' }}>
                              CR/ID: {cust.civilIdOrCr}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{getClassBadge(cust.customerClass)}</td>
                      <td>{getStatusBadge(cust.status)}</td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{cust.totalOrders}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          {Number(cust.totalSpendKwd || 0).toFixed(3)} KWD
                        </span>
                      </td>
                      <td>
                        <span className="text-label-sm" style={{ color: 'var(--outline)' }}>
                          {cust.lastLoginAt ? new Date(cust.lastLoginAt).toLocaleDateString() : new Date(cust.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => loadCustomerDetail(cust.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>manage_accounts</span> CRM Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ERP Ledger Partner View */}
      {viewMode === 'partners' && (
        <>
          <div className="card" style={{ padding: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--outline)', fontSize: 20
              }}>search</span>
              <input
                type="text"
                placeholder="Search partner code, company name, phone, civil ID / CR..."
                value={partnerSearch}
                onChange={e => setPartnerSearch(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 40px', borderRadius: 8,
                  border: '1px solid var(--outline-variant)', background: 'var(--surface)'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Type:</label>
              <select
                value={partnerTypeFilter}
                onChange={e => setPartnerTypeFilter(e.target.value)}
                style={{
                  padding: '8px 12px', borderRadius: 8,
                  border: '1px solid var(--outline-variant)', background: 'var(--surface)'
                }}
              >
                <option value="">All Partner Types</option>
                <option value="WHOLESALE_CUSTOMER">Wholesale Customer</option>
                <option value="RETAIL_CUSTOMER">Retail Customer</option>
                <option value="SUPPLIER">Supplier</option>
                <option value="SERVICE_PROVIDER">Service Provider</option>
              </select>
            </div>

            <button onClick={fetchPartners} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span> Refresh
            </button>
          </div>

          {/* Architecture Guard Notice */}
          <div style={{
            padding: '12px 16px', borderRadius: 8,
            background: 'rgba(38, 52, 71, 0.05)', border: '1px solid var(--outline-variant)',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 22 }}>shield</span>
            <span className="text-body-sm" style={{ color: 'var(--on-surface)' }}>
              <strong>Accounting Rule:</strong> Partner balances are authoritatively derived by the backend server from ledger movements and invoice allocations. Balances cannot be manually edited.
            </span>
          </div>

          {partnerLoading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--outline)' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>progress_activity</span>
              <p style={{ marginTop: 8 }}>Loading live partner accounts...</p>
            </div>
          ) : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code & Partner Name</th>
                    <th>Contact & Identifiers</th>
                    <th>Category</th>
                    <th>Credit Limit</th>
                    <th>Derived Balance (Owed)</th>
                    <th>Credit Available</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>
                            {p.code}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{p.name}</span>
                          {p.nameAr && <span className="text-label-sm" style={{ color: 'var(--outline)', direction: 'rtl' }}>{p.nameAr}</span>}
                          {p.companyName && (
                            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
                              🏢 {p.companyName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="text-body-sm">{p.phone}</span>
                          {p.email && <span className="text-label-sm" style={{ color: 'var(--outline)' }}>{p.email}</span>}
                          {p.civilIdOrCr && (
                            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', fontFamily: 'monospace' }}>
                              CR/ID: {p.civilIdOrCr}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: p.type === 'WHOLESALE_CUSTOMER' ? '#dbeafe' : p.type === 'SUPPLIER' ? '#fef3c7' : '#f3f4f6',
                          color: p.type === 'WHOLESALE_CUSTOMER' ? '#1e40af' : p.type === 'SUPPLIER' ? '#92400e' : '#374151',
                          fontSize: 11, fontWeight: 600, textTransform: 'uppercase'
                        }}>
                          {p.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {Number(p.creditLimit).toFixed(3)} KWD
                        </span>
                        <div className="text-label-sm" style={{ color: 'var(--outline)' }}>
                          Terms: {p.creditTermsDays} days
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          color: p.derivedOutstandingBalance > 0 ? '#b91c1c' : '#15803d'
                        }}>
                          {Number(p.derivedOutstandingBalance).toFixed(3)} KWD
                        </span>
                        <div className="text-label-sm" style={{ color: 'var(--outline)' }}>
                          Authoritative Ledger
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          color: p.creditAvailable < 0 ? '#b91c1c' : 'var(--primary)'
                        }}>
                          {Number(p.creditAvailable).toFixed(3)} KWD
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Customer CRM Drawer */}
      {selectedCustomerId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            width: '100%', maxWidth: 740, background: 'var(--surface)', height: '100%',
            overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)'
          }}>
            {/* Drawer Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--outline-variant)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-container-low)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 className="text-headline-sm" style={{ margin: 0, color: 'var(--primary)' }}>
                    {customerDetail?.name || 'Customer Details'}
                  </h2>
                  {customerDetail && getClassBadge(customerDetail.customerClass)}
                  {customerDetail && getStatusBadge(customerDetail.status)}
                </div>
                <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  Code: {customerDetail?.code} • Registered: {customerDetail ? new Date(customerDetail.createdAt).toLocaleDateString() : ''}
                </span>
              </div>
              <button
                onClick={() => { setSelectedCustomerId(null); setCustomerDetail(null); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--outline)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
              </button>
            </div>

            {/* Drawer Body */}
            {detailLoading || !customerDetail ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--outline)' }}>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>progress_activity</span>
                <p style={{ marginTop: 8 }}>Loading customer CRM profile & order history...</p>
              </div>
            ) : (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Profile Controls Card */}
                <div className="card" style={{ padding: 16 }}>
                  <h3 className="text-headline-sm" style={{ fontSize: 15, marginBottom: 12, color: 'var(--primary)' }}>
                    Account Governance & Classification
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label className="text-label-sm" style={{ color: 'var(--outline)' }}>Customer Classification</label>
                      <select
                        value={customerDetail.customerClass || 'REGULAR'}
                        onChange={e => handleUpdateClassification(e.target.value)}
                        disabled={updatingStatus}
                        style={{
                          width: '100%', padding: '8px 10px', borderRadius: 6,
                          border: '1px solid var(--outline-variant)', marginTop: 4, background: 'var(--surface)'
                        }}
                      >
                        <option value="REGULAR">Regular Retail</option>
                        <option value="VIP">VIP Customer</option>
                        <option value="CONTRACTOR">Contractor</option>
                        <option value="WHOLESALE">Wholesale Client</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-label-sm" style={{ color: 'var(--outline)' }}>Account Status</label>
                      <select
                        value={customerDetail.status || 'ACTIVE'}
                        onChange={e => handleUpdateStatus(e.target.value)}
                        disabled={updatingStatus}
                        style={{
                          width: '100%', padding: '8px 10px', borderRadius: 6,
                          border: '1px solid var(--outline-variant)', marginTop: 4, background: 'var(--surface)'
                        }}
                      >
                        <option value="ACTIVE">ACTIVE (Authorized Checkout)</option>
                        <option value="SUSPENDED">SUSPENDED (Blocked)</option>
                        <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact & Identifiers */}
                <div className="card" style={{ padding: 16 }}>
                  <h3 className="text-headline-sm" style={{ fontSize: 15, marginBottom: 12, color: 'var(--primary)' }}>
                    Contact & Legal Identifiers
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div>
                      <span className="text-label-sm" style={{ color: 'var(--outline)' }}>Phone (Kuwait)</span>
                      <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{customerDetail.phone}</div>
                    </div>
                    <div>
                      <span className="text-label-sm" style={{ color: 'var(--outline)' }}>Email Address</span>
                      <div style={{ fontWeight: 600 }}>{customerDetail.email || 'None'}</div>
                    </div>
                    <div>
                      <span className="text-label-sm" style={{ color: 'var(--outline)' }}>Company Name</span>
                      <div style={{ fontWeight: 600 }}>{customerDetail.companyName || 'Individual'}</div>
                    </div>
                    <div>
                      <span className="text-label-sm" style={{ color: 'var(--outline)' }}>Civil ID / CR</span>
                      <div style={{ fontFamily: 'monospace' }}>{customerDetail.civilIdOrCr || 'None'}</div>
                    </div>
                  </div>
                </div>

                {/* Kuwait Saved Addresses */}
                <div className="card" style={{ padding: 16 }}>
                  <h3 className="text-headline-sm" style={{ fontSize: 15, marginBottom: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>location_on</span>
                    Saved Kuwait Addresses ({customerDetail.addresses?.length || 0})
                  </h3>
                  {(!customerDetail.addresses || customerDetail.addresses.length === 0) ? (
                    <p className="text-body-sm" style={{ color: 'var(--outline)' }}>No saved addresses on file.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {customerDetail.addresses.map((addr: any) => (
                        <div key={addr.id} style={{
                          padding: 10, borderRadius: 6, background: 'var(--surface-container-low)',
                          border: '1px solid var(--outline-variant)', fontSize: 13
                        }}>
                          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {addr.label || 'Delivery Address'} {addr.isDefault && <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: 4 }}>Default</span>}
                          </div>
                          <div>
                            {addr.area}, {addr.governorate} Governorate
                          </div>
                          <div style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>
                            {addr.block ? `Block ${addr.block}` : ''} {addr.street ? `, Street ${addr.street}` : ''} {addr.building ? `, Building ${addr.building}` : ''} {addr.floor ? `, Floor ${addr.floor}` : ''} {addr.apartment ? `, Apt ${addr.apartment}` : ''}
                          </div>
                          {addr.specialInstructions && (
                            <div style={{ fontSize: 11, color: 'var(--outline)', marginTop: 2 }}>
                              Instructions: {addr.specialInstructions}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* COD Order History */}
                <div className="card" style={{ padding: 16 }}>
                  <h3 className="text-headline-sm" style={{ fontSize: 15, marginBottom: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>receipt</span>
                    Cash on Delivery Orders ({customerDetail.salesOrders?.length || 0})
                  </h3>
                  {(!customerDetail.salesOrders || customerDetail.salesOrders.length === 0) ? (
                    <p className="text-body-sm" style={{ color: 'var(--outline)' }}>No order history yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {customerDetail.salesOrders.map((ord: any) => (
                        <div key={ord.id} style={{
                          padding: 10, borderRadius: 6, background: 'var(--surface-container-low)',
                          border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <div>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                              {ord.orderNumber}
                            </span>
                            <div className="text-label-sm" style={{ color: 'var(--outline)' }}>
                              {new Date(ord.createdAt).toLocaleDateString()} • Status: <strong>{ord.orderStatus}</strong>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                              {Number(ord.totalAmount).toFixed(3)} KWD
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                              padding: '1px 6px', borderRadius: 4,
                              background: ord.paymentStatus === 'COLLECTED' ? '#dcfce7' : '#fef3c7',
                              color: ord.paymentStatus === 'COLLECTED' ? '#166534' : '#92400e'
                            }}>
                              {ord.paymentStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Internal CRM Notes Log */}
                <div className="card" style={{ padding: 16 }}>
                  <h3 className="text-headline-sm" style={{ fontSize: 15, marginBottom: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>note_alt</span>
                    Internal CRM Notes & Staff Log
                  </h3>

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    <textarea
                      rows={2}
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      placeholder="Enter internal note regarding customer preferences, site restrictions, or payment history..."
                      style={{
                        width: '100%', padding: 8, borderRadius: 6,
                        border: '1px solid var(--outline-variant)', background: 'var(--surface)', fontSize: 12
                      }}
                    />
                    <button
                      type="submit"
                      disabled={addingNote || !newNote.trim()}
                      className="btn btn-secondary"
                      style={{ alignSelf: 'flex-end', padding: '6px 14px', fontSize: 12 }}
                    >
                      {addingNote ? 'Saving...' : 'Add CRM Note'}
                    </button>
                  </form>

                  {/* Notes List */}
                  {(!customerDetail.customerNotes || customerDetail.customerNotes.length === 0) ? (
                    <p className="text-body-sm" style={{ color: 'var(--outline)' }}>No internal notes recorded yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {customerDetail.customerNotes.map((note: any) => (
                        <div key={note.id} style={{
                          padding: 10, borderRadius: 6, background: 'var(--surface-container-low)',
                          border: '1px solid var(--outline-variant)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--outline)', marginBottom: 4 }}>
                            <span><strong>{note.author?.fullName || 'Staff'}</strong></span>
                            <span>{new Date(note.createdAt).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--on-surface)' }}>{note.note}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
