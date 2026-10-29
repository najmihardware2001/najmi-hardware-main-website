import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useStore } from '../../StoreContext';

const specLabel=(key:string)=>({measurement_type:'Measurement type',size_value:'Measurement',size_unit:'Measurement unit',length_value:'Length',length_unit:'Length unit',sheet_dimensions:'Sheet dimensions',packaging:'Packaging',color:'Colour',requested_colour:'Requested colour',unknown_colour:'Colour confirmation needed',unit:'Supply unit',quantity:'Quantity'} as Record<string,string>)[key]||key.replaceAll('_',' ');
const specValue=(value:any):string=>value&&typeof value==='object'?(Array.isArray(value.values)?value.values.join(' × ')+(value.unit?' '+value.unit:' — unit to confirm'):JSON.stringify(value)):value==null?'To confirm':String(value);

interface RfqItem {
  id: string;
  templateId?: string;
  variantId?: string;
  productNameEn: string;
  productNameAr?: string;
  customSpecs?: any;
  quantity: number;
  unit?: string;
  estimatedRetailPrice?: number;
  notes?: string;
}

interface QuotationLine {
  id?: string;
  rfqLineId?: string;
  productNameEn: string;
  productNameAr?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  lineTotal: number;
  specDetails?: string;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  revisionNumber: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
  subtotal: number;
  discountTotal: number;
  deliveryFee: number;
  grandTotal: number;
  paymentTerms: string;
  validDays: number;
  validUntil: string;
  termsEn?: string;
  termsAr?: string;
  lines: QuotationLine[];
  createdBy?: { id: string; fullName: string };
  createdAt: string;
}

interface RfqDetail {
  id: string;
  rfqNumber: string;
  companyName: string;
  companyNameAr?: string;
  contactPerson: string;
  phone: string;
  email: string;
  civilIdOrCr?: string;
  governorate: string;
  area: string;
  projectDescription?: string;
  status: string;
  internalNotes?: string;
  createdAt: string;
  accessKey: string;
  assignedTo?: { id: string; fullName: string; email: string } | null;
  lines: RfqItem[];
  quotations: Quotation[];
}

export default function AdminRfqs() {
  const { showToast } = useStore();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected RFQ for Detail Drawer
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
  const [selectedRfq, setSelectedRfq] = useState<RfqDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Staff Assignment
  const [assigneeId, setAssigneeId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Internal Notes
  const [internalNotesInput, setInternalNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Quotation Builder Modal State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteLines, setQuoteLines] = useState<{
    rfqLineId?: string;
    productNameEn: string;
    productNameAr?: string;
    quantity: number;
    unitPrice: number | '';
    discountPercent: number;
    specDetails?: string;
  }[]>([]);
  const [quoteValidDays, setQuoteValidDays] = useState(14);
  const [quoteDeliveryFee, setQuoteDeliveryFee] = useState(0);
  const [quoteTermsEn, setQuoteTermsEn] = useState('Payment strictly Cash on Delivery (COD) upon physical handover in Kuwait. Prices valid for the specified period.');
  const [quoteTermsAr, setQuoteTermsAr] = useState('الدفع نقداً عند الاستلام (COD) حصراً عند التسليم الفعلي في الكويت. الأسعار سارية للمدة المحددة.');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // PDF Preview Modal
  const [pdfModalQuotation, setPdfModalQuotation] = useState<any | null>(null);

  // Converting to Order
  const [convertedOrderResult, setConvertedOrderResult] = useState<any | null>(null);

  // Available Staff
  const [staffList,setStaffList]=useState<{id:string;name:string}[]>([]);
  useEffect(()=>{api.catalogue('/admin/rfq/staff').then(rows=>setStaffList(rows.map((r:any)=>({...r,id:String(r.id)})))).catch(()=>setStaffList([]))},[]);

  const fetchRfqs = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminRfqs({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setRfqs(res.rfqs);
      setTotalCount(res.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load RFQs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, [statusFilter, search]);

  const loadRfqDetail = async (id: string) => {
    setSelectedRfqId(id);
    setDetailLoading(true);
    setConvertedOrderResult(null);
    try {
      const data = await api.getAdminRfqById(id);
      setSelectedRfq(data);
      setAssigneeId(data.assignedTo?.id || '');
      setInternalNotesInput(data.internalNotes || '');
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch RFQ details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedRfq || !assigneeId) return;
    setAssigning(true);
    try {
      await api.assignRfqStaff(selectedRfq.id, assigneeId);
      showToast('Staff assigned successfully', 'check_circle');
      loadRfqDetail(selectedRfq.id);
      fetchRfqs();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign staff', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedRfq) return;
    setSavingNotes(true);
    try {
      await api.addRfqNote(selectedRfq.id, internalNotesInput);
      showToast('Internal review notes saved', 'check_circle');
      loadRfqDetail(selectedRfq.id);
    } catch (err: any) {
      showToast(err.message || 'Failed to save notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const openQuoteBuilder = () => {
    if (!selectedRfq) return;
    // Prepopulate quotation lines from RFQ lines
    const initialLines = selectedRfq.lines.map(line => {
      let specStr = '';
      if (line.customSpecs) {
        const s = typeof line.customSpecs === 'string' ? JSON.parse(line.customSpecs) : line.customSpecs;
        specStr = Object.entries(s).map(([k, v]) => `${specLabel(k)}: ${specValue(v)}`).join(', ');
      }
      return {
        rfqLineId: line.id,
        productNameEn: line.productNameEn,
        productNameAr: line.productNameAr,
        quantity: line.quantity,
        unitPrice: '' as const,
        discountPercent: 0,
        specDetails: specStr,
      };
    });
    setQuoteLines(initialLines);
    setShowQuoteModal(true);
  };

  const calculateQuoteSubtotal = () => {
    return quoteLines.reduce((sum, line) => {
      const gross = line.quantity * Number(line.unitPrice);
      const discount = gross * ((line.discountPercent || 0) / 100);
      return sum + (gross - discount);
    }, 0);
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq) return;
    if(quoteLines.some(l=>l.unitPrice===''||Number(l.unitPrice)<=0)){showToast('Enter each personalized quotation price before submitting','warning');return;}
    setSubmittingQuote(true);
    try {
      const payload = {
        validDays: quoteValidDays,
        paymentTerms: 'CASH_ON_DELIVERY',
        deliveryFee: quoteDeliveryFee,
        estimatedDeliveryDays: 2,
        termsEn: quoteTermsEn,
        termsAr: quoteTermsAr,
        lines: quoteLines.map(l => ({
          rfqLineId: l.rfqLineId,
          productNameEn: l.productNameEn,
          productNameAr: l.productNameAr,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          discountPercent: Number(l.discountPercent || 0),
          specDetails: l.specDetails,
        })),
      };

      const res = await api.createQuotation(selectedRfq.id, payload);
      showToast(res.message || 'Official quotation created successfully', 'done_all');
      setShowQuoteModal(false);
      loadRfqDetail(selectedRfq.id);
      fetchRfqs();
    } catch (err: any) {
      showToast(err.message || 'Failed to create quotation', 'error');
    } finally {
      setSubmittingQuote(false);
    }
  };


  const openPdfPreview = async (quotationId: string) => {
    if (!selectedRfq) return;
    try {
      const pdfData = await api.getQuotationPdf(selectedRfq.id, quotationId);
      setPdfModalQuotation(pdfData);
    } catch (err: any) {
      showToast(err.message || 'Could not load quotation document', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; color: string; label: string }> = {
      PENDING: { bg: '#fef3c7', color: '#92400e', label: 'Pending Evaluation' },
      UNDER_EVALUATION: { bg: '#e0e7ff', color: '#3730a3', label: 'Under Review' },
      QUOTED: { bg: '#dbeafe', color: '#1e40af', label: 'Quotation Issued' },
      ACCEPTED: { bg: '#dcfce7', color: '#166534', label: 'Customer Accepted' },
      REJECTED: { bg: '#fee2e2', color: '#991b1b', label: 'Declined' },
      CONVERTED_TO_ORDER: { bg: '#d1fae5', color: '#065f46', label: 'Converted to COD Order' },
    };
    const c = config[status] || { bg: '#f3f4f6', color: '#4b5563', label: status };
    return (
      <span style={{
        padding: '3px 10px', borderRadius: 9999,
        background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, textTransform: 'uppercase'
      }}>
        {c.label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#fff' }}>request_quote</span>
          </div>
          <div>
            <h1 className="text-headline-md" style={{ color: 'var(--primary)', margin: 0, lineHeight: 1.2 }}>
              Wholesale RFQs & Quotations
            </h1>
            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
              Contractor and B2B Quotations — Strict Cash on Delivery Handover (Kuwait)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchRfqs} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid var(--primary)' }}>
          <span className="text-label-sm" style={{ color: 'var(--outline)' }}>Total Enquiries</span>
          <div className="text-headline-md" style={{ color: 'var(--primary)', marginTop: 4 }}>{totalCount}</div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
          <span className="text-label-sm" style={{ color: 'var(--outline)' }}>Awaiting Quote</span>
          <div className="text-headline-md" style={{ color: '#d97706', marginTop: 4 }}>
            {rfqs.filter(r => r.status === 'PENDING' || r.status === 'UNDER_EVALUATION').length}
          </div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #2563eb' }}>
          <span className="text-label-sm" style={{ color: 'var(--outline)' }}>Quoted / Sent</span>
          <div className="text-headline-md" style={{ color: '#2563eb', marginTop: 4 }}>
            {rfqs.filter(r => r.status === 'QUOTED').length}
          </div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #10b981' }}>
          <span className="text-label-sm" style={{ color: 'var(--outline)' }}>Accepted / Converted</span>
          <div className="text-headline-md" style={{ color: '#059669', marginTop: 4 }}>
            {rfqs.filter(r => r.status === 'ACCEPTED' || r.status === 'CONVERTED_TO_ORDER').length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <span className="material-symbols-outlined" style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--outline)', fontSize: 20
          }}>search</span>
          <input
            type="text"
            placeholder="Search by RFQ #, Company, Contact, Phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 40px', borderRadius: 8,
              border: '1px solid var(--outline-variant)', background: 'var(--surface)'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Status:</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 8,
              border: '1px solid var(--outline-variant)', background: 'var(--surface)'
            }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Evaluation</option>
            <option value="UNDER_EVALUATION">Under Review</option>
            <option value="QUOTED">Quotation Issued</option>
            <option value="ACCEPTED">Customer Accepted</option>
            <option value="REJECTED">Declined</option>
            <option value="CONVERTED_TO_ORDER">Converted to Order</option>
          </select>
        </div>
      </div>

      {/* RFQ List Table */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--outline)' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>progress_activity</span>
          <p style={{ marginTop: 8 }}>Loading RFQs from PostgreSQL...</p>
        </div>
      ) : rfqs.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline)' }}>inbox</span>
          <h3 className="text-headline-sm" style={{ marginTop: 12 }}>No Wholesale RFQs Found</h3>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
            Customer quotes submitted via storefront will appear here with live specifications.
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>RFQ Number & Date</th>
                <th>Company & Contact</th>
                <th>Location (Kuwait)</th>
                <th>Lines</th>
                <th>Assigned Staff</th>
                <th>Latest Quote</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map(rfq => (
                <tr key={rfq.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                        {rfq.rfqNumber}
                      </span>
                      <span className="text-label-sm" style={{ color: 'var(--outline)' }}>
                        {new Date(rfq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{rfq.companyName}</span>
                      <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                        👤 {rfq.contactPerson} • 📞 {rfq.phone}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="text-body-sm">{rfq.area}</span>
                      <span className="text-label-sm" style={{ color: 'var(--outline)' }}>{rfq.governorate}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{rfq.itemsCount} items</span>
                  </td>
                  <td>
                    {rfq.assignedTo ? (
                      <span className="text-body-sm" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                        {rfq.assignedTo.fullName}
                      </span>
                    ) : (
                      <span className="text-label-sm" style={{ color: 'var(--outline)' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    {rfq.latestQuotation ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          {Number(rfq.latestQuotation.grandTotal).toFixed(3)} KWD
                        </span>
                        <span className="text-label-sm" style={{ color: 'var(--outline)', fontFamily: 'monospace' }}>
                          {rfq.latestQuotation.quotationNumber}
                        </span>
                      </div>
                    ) : (
                      <span className="text-label-sm" style={{ color: 'var(--outline)' }}>Not quoted</span>
                    )}
                  </td>
                  <td>{getStatusBadge(rfq.status)}</td>
                  <td>
                    <button
                      onClick={() => loadRfqDetail(rfq.id)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span> View RFQ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RFQ Detail Modal / Drawer */}
      {selectedRfqId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            width: '100%', maxWidth: 780, background: 'var(--surface)', height: '100%',
            overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)'
          }}>
            {/* Drawer Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--outline-variant)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-container-low)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 className="text-headline-sm" style={{ margin: 0, color: 'var(--primary)', fontFamily: 'monospace' }}>
                    {selectedRfq?.rfqNumber || 'Loading...'}
                  </h2>
                  {selectedRfq && getStatusBadge(selectedRfq.status)}
                </div>
                <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  Enquiry Date: {selectedRfq ? new Date(selectedRfq.createdAt).toLocaleString() : ''}
                </span>
              </div>
              <button
                onClick={() => { setSelectedRfqId(null); setSelectedRfq(null); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--outline)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
              </button>
            </div>

            {/* Drawer Body */}
            {detailLoading || !selectedRfq ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--outline)' }}>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>progress_activity</span>
                <p style={{ marginTop: 8 }}>Loading RFQ details and quotation history...</p>
              </div>
            ) : (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Converted to Order Alert */}
                {convertedOrderResult && (
                  <div style={{
                    padding: 16, borderRadius: 8, background: '#ecfdf5', border: '1px solid #6ee7b7',
                    display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <span className="material-symbols-outlined" style={{ color: '#059669', fontSize: 28 }}>check_circle</span>
                    <div>
                      <div style={{ fontWeight: 700, color: '#065f46' }}>Successfully Converted to COD Order!</div>
                      <div style={{ fontSize: 13, color: '#047857' }}>
                        Official Order Number: <strong>{convertedOrderResult.order.orderNumber}</strong>. Status: Pending Collection.
                      </div>
                    </div>
                  </div>
                )}

                {/* Company & Client Card */}
                <div className="card" style={{ padding: 16 }}>
                  <h3 className="text-headline-sm" style={{ fontSize: 16, marginBottom: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>business</span> Business Client Profile
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div>
                      <span className="text-label-sm" style={{ color: 'var(--outline)' }}>Company Name</span>
                      <div style={{ fontWeight: 600 }}>{selectedRfq.companyName}</div>
                      {selectedRfq.companyNameAr && <div className="text-body-sm" style={{ direction: 'rtl' }}>{selectedRfq.companyNameAr}</div>}
                    </div>
                    <div>
                      <span className="text-label-sm" style={{ color: 'var(--outline)' }}>Contact Person</span>
                      <div style={{ fontWeight: 600 }}>{selectedRfq.contactPerson}</div>
                      <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>{selectedRfq.phone}</div>
                      <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>{selectedRfq.email}</div>
                    </div>
                    <div>
                      <span className="text-label-sm" style={{ color: 'var(--outline)' }}>Kuwait Delivery Area</span>
                      <div style={{ fontWeight: 600 }}>{selectedRfq.area}</div>
                      <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>{selectedRfq.governorate}</div>
                    </div>
                    <div>
                      <span className="text-label-sm" style={{ color: 'var(--outline)' }}>CR / Civil ID</span>
                      <div style={{ fontFamily: 'monospace' }}>{selectedRfq.civilIdOrCr || 'Not specified'}</div>
                    </div>
                  </div>
                  {selectedRfq.projectDescription && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--outline-variant)' }}>
                      <span className="text-label-sm" style={{ color: 'var(--outline)' }}>Project Scope & Notes:</span>
                      <p className="text-body-sm" style={{ marginTop: 4 }}>{selectedRfq.projectDescription}</p>
                    </div>
                  )}
                </div>

                {/* Staff Assignment & Internal Notes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Staff Assignment */}
                  <div className="card" style={{ padding: 16 }}>
                    <span className="text-label-sm" style={{ fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: 8 }}>
                      Assigned Wholesale Staff
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        value={assigneeId}
                        onChange={e => setAssigneeId(e.target.value)}
                        style={{
                          flex: 1, padding: '8px 10px', borderRadius: 6,
                          border: '1px solid var(--outline-variant)', background: 'var(--surface)'
                        }}
                      >
                        <option value="">-- Unassigned --</option>
                        {staffList.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssignStaff}
                        disabled={assigning || !assigneeId}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        {assigning ? '...' : 'Assign'}
                      </button>
                    </div>
                  </div>

                  {/* Internal Notes */}
                  <div className="card" style={{ padding: 16 }}>
                    <span className="text-label-sm" style={{ fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: 8 }}>
                      Internal Review Notes
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea
                        rows={2}
                        value={internalNotesInput}
                        onChange={e => setInternalNotesInput(e.target.value)}
                        placeholder="Private notes for wholesale sales desk..."
                        style={{
                          width: '100%', padding: 8, borderRadius: 6,
                          border: '1px solid var(--outline-variant)', background: 'var(--surface)', fontSize: 12
                        }}
                      />
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="btn btn-secondary"
                        style={{ alignSelf: 'flex-end', padding: '4px 12px', fontSize: 12 }}
                      >
                        {savingNotes ? 'Saving...' : 'Save Notes'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Requested Products & Custom Specs */}
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 className="text-headline-sm" style={{ fontSize: 16, margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_list_bulleted</span>
                      Enquiry Items ({selectedRfq.lines.length})
                    </h3>
                    <button
                      onClick={openQuoteBuilder}
                      className="btn btn-signal"
                      style={{ padding: '6px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>post_add</span>
                      {selectedRfq.quotations.length > 0 ? 'Create New Revision' : 'Generate Official Quotation'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedRfq.lines.map((line, idx) => {
                      let specs: any = null;
                      if (line.customSpecs) {
                        specs = typeof line.customSpecs === 'string' ? JSON.parse(line.customSpecs) : line.customSpecs;
                      }
                      return (
                        <div key={line.id || idx} style={{
                          padding: 12, borderRadius: 8, background: 'var(--surface-container-low)',
                          border: '1px solid var(--outline-variant)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{line.productNameEn}</div>
                              {line.productNameAr && <div className="text-label-sm" style={{ color: 'var(--outline)', direction: 'rtl' }}>{line.productNameAr}</div>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>
                                {line.quantity} {line.unit || 'units'}
                              </span>
                              {line.estimatedRetailPrice && (
                                <div className="text-label-sm" style={{ color: 'var(--outline)' }}>
                                  Est. Retail: {Number(line.estimatedRetailPrice).toFixed(3)} KWD
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Technical Specifications */}
                          {specs && (
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {Object.entries(specs).map(([key, val]) => (
                                <span key={key} style={{
                                  padding: '2px 8px', borderRadius: 4, background: 'var(--surface)',
                                  border: '1px solid var(--outline-variant)', fontSize: 11, fontFamily: 'monospace'
                                }}>
                                  <strong>{specLabel(key)}:</strong> {specValue(val)}
                                </span>
                              ))}
                            </div>
                          )}

                          {line.notes && (
                            <div className="text-body-sm" style={{ marginTop: 6, fontStyle: 'italic', color: 'var(--on-surface-variant)' }}>
                              Note: {line.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quotation History & Actions */}
                <div className="card" style={{ padding: 16 }}>
                  <h3 className="text-headline-sm" style={{ fontSize: 16, marginBottom: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>receipt_long</span>
                    Quotation Revisions ({selectedRfq.quotations.length})
                  </h3>

                  {selectedRfq.quotations.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--outline)' }}>
                      <p>No quotation has been issued yet for this enquiry.</p>
                      <button onClick={openQuoteBuilder} className="btn btn-primary" style={{ marginTop: 8 }}>
                        Draft Quotation Now
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {selectedRfq.quotations.map(q => (
                        <div key={q.id} style={{
                          padding: 16, borderRadius: 8, background: 'var(--surface-container-low)',
                          border: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column', gap: 12
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                                  {q.quotationNumber}
                                </span>
                                <span style={{
                                  padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                                  background: q.status === 'ACCEPTED' ? '#dcfce7' : q.status === 'REJECTED' ? '#fee2e2' : '#dbeafe',
                                  color: q.status === 'ACCEPTED' ? '#166534' : q.status === 'REJECTED' ? '#991b1b' : '#1e40af'
                                }}>
                                  {q.status}
                                </span>
                              </div>
                              <span className="text-label-sm" style={{ color: 'var(--outline)' }}>
                                Valid until: {new Date(q.validUntil).toLocaleDateString()} ({q.validDays} days) • Payment: Strictly COD
                              </span>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                                {Number(q.grandTotal).toFixed(3)} KWD
                              </div>
                              <span className="text-label-sm" style={{ color: 'var(--outline)' }}>
                                Subtotal: {Number(q.subtotal).toFixed(3)} | Del: {Number(q.deliveryFee).toFixed(3)} KWD
                              </span>
                            </div>
                          </div>

                          {/* Line Items Snapshot */}
                          <div style={{ padding: '8px 12px', background: 'var(--surface)', borderRadius: 6, fontSize: 12 }}>
                            {q.lines.map((ql, lIdx) => (
                              <div key={lIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                                <span>{ql.quantity}x {ql.productNameEn} {ql.specDetails ? `(${ql.specDetails})` : ''}</span>
                                <span style={{ fontWeight: 600 }}>{Number(ql.lineTotal).toFixed(3)} KWD ({Number(ql.unitPrice).toFixed(3)} ea)</span>
                              </div>
                            ))}
                          </div>

                          {/* Quotation Action Buttons */}
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => openPdfPreview(q.id)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span> View / Print Branded Sheet
                            </button>

                            {/* Convert to Order Button */}
                            <p className="text-body-sm">Create an order through COD checkout after exact specifications and stock are confirmed.</p>
                          </div>
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

      {/* Create / Revise Quotation Modal */}
      {showQuoteModal && selectedRfq && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', padding: 24,
            display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--outline-variant)', paddingBottom: 12 }}>
              <div>
                <h2 className="text-headline-sm" style={{ margin: 0, color: 'var(--primary)' }}>
                  Issue Official Quotation
                </h2>
                <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  RFQ: {selectedRfq.rfqNumber} • Client: {selectedRfq.companyName}
                </span>
              </div>
              <button onClick={() => setShowQuoteModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Payment Rule Notice */}
              <div style={{
                padding: '10px 14px', borderRadius: 8, background: '#eff6ff',
                border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: 20 }}>payments</span>
                <span className="text-label-sm" style={{ color: '#1e40af' }}>
                  <strong>Strict Payment Policy:</strong> Quotation payment terms are strictly <strong>Cash on Delivery (COD)</strong> upon delivery in Kuwait.
                </span>
              </div>

              {/* Line Items Pricing */}
              <div>
                <span className="text-label-sm" style={{ fontWeight: 700, display: 'block', marginBottom: 8 }}>
                  Item-Level Pricing (KWD)
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {quoteLines.map((line, idx) => (
                    <div key={idx} style={{
                      padding: 12, borderRadius: 8, background: 'var(--surface-container-low)',
                      border: '1px solid var(--outline-variant)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{line.productNameEn}</div>
                        {line.specDetails && <div style={{ fontSize: 11, color: 'var(--outline)' }}>{line.specDetails}</div>}
                      </div>
                      <div>
                        <label className="text-label-sm" style={{ fontSize: 11, color: 'var(--outline)' }}>Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={e => {
                            const newLines = [...quoteLines];
                            newLines[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                            setQuoteLines(newLines);
                          }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--outline-variant)' }}
                        />
                      </div>
                      <div>
                        <label className="text-label-sm" style={{ fontSize: 11, color: 'var(--outline)' }}>Unit Price (KWD)</label>
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={line.unitPrice}
                          onChange={e => {
                            const newLines = [...quoteLines];
                            newLines[idx].unitPrice = e.target.value===''?'':Number(e.target.value);
                            setQuoteLines(newLines);
                          }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--outline-variant)', fontWeight: 600 }}
                        />
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="text-label-sm" style={{ fontSize: 11, color: 'var(--outline)', display: 'block' }}>Line Total</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
                          {line.unitPrice===''?'Awaiting staff price':`${(line.quantity * Number(line.unitPrice)).toFixed(3)} KWD`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery & Validity Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="text-label-sm" style={{ fontWeight: 600 }}>Quotation Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={quoteValidDays}
                    onChange={e => setQuoteValidDays(parseInt(e.target.value) || 14)}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--outline-variant)', marginTop: 4 }}
                  />
                </div>
                <div>
                  <label className="text-label-sm" style={{ fontWeight: 600 }}>Delivery Fee (KWD)</label>
                  <input
                    type="number"
                    step="0.250"
                    min="0"
                    value={quoteDeliveryFee}
                    onChange={e => setQuoteDeliveryFee(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--outline-variant)', marginTop: 4 }}
                  />
                  <span style={{ fontSize: 10, color: 'var(--outline)' }}>* Sample fee for localhost testing</span>
                </div>
              </div>

              {/* Terms & Conditions (Bilingual) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="text-label-sm" style={{ fontWeight: 600 }}>Commercial Terms (English)</label>
                  <textarea
                    rows={2}
                    value={quoteTermsEn}
                    onChange={e => setQuoteTermsEn(e.target.value)}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--outline-variant)', fontSize: 11, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label className="text-label-sm" style={{ fontWeight: 600 }}>الشروط التجارية (عربي)</label>
                  <textarea
                    rows={2}
                    value={quoteTermsAr}
                    onChange={e => setQuoteTermsAr(e.target.value)}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--outline-variant)', fontSize: 11, marginTop: 4, direction: 'rtl' }}
                  />
                </div>
              </div>

              {/* Grand Total Summary */}
              <div style={{
                padding: 16, borderRadius: 8, background: 'var(--surface-container-high)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div className="text-label-sm" style={{ color: 'var(--outline)' }}>
                    Subtotal: {calculateQuoteSubtotal().toFixed(3)} KWD + Delivery: {quoteDeliveryFee.toFixed(3)} KWD
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                    Revision: {selectedRfq.quotations.length + 1}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="text-label-sm" style={{ color: 'var(--outline)' }}>Total Quoted Amount</span>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>
                    {(calculateQuoteSubtotal() + quoteDeliveryFee).toFixed(3)} KWD
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowQuoteModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingQuote} className="btn btn-signal" style={{ padding: '10px 24px', fontWeight: 700 }}>
                  {submittingQuote ? 'Submitting Quotation...' : 'Issue Official Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branded PDF Preview Modal */}
      {pdfModalQuotation && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 1200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: 760, maxHeight: '92vh', overflowY: 'auto',
            background: '#ffffff', color: '#111827', padding: 32, display: 'flex', flexDirection: 'column', gap: 20
          }}>
            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 1 }}>
                Najmi Hardware Branded Quotation Sheet
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => window.print()}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span> Print Document
                </button>
                <button
                  onClick={() => setPdfModalQuotation(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Document Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                  {pdfModalQuotation.store?.nameEn || 'NAJMI HARDWARE'}
                </h1>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e3a8a', direction: 'rtl' }}>
                  {pdfModalQuotation.store?.nameAr || 'شركة النجمي للأدوات الصناعية'}
                </div>
                <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>
                  {pdfModalQuotation.store?.addressEn || 'Shuwaikh Industrial Area 1, Kuwait'}
                </div>
                <div style={{ fontSize: 12, color: '#4b5563' }}>
                  Phone: {pdfModalQuotation.store?.phone || '+965 2484 2121'} • CR: {pdfModalQuotation.store?.crNumber || '104829'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1e3a8a', fontFamily: 'monospace' }}>
                  {pdfModalQuotation.quotation?.quotationNumber}
                </div>
                <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>
                  Date: {new Date(pdfModalQuotation.quotation?.createdAt || Date.now()).toLocaleDateString('en-GB')}
                </div>
                <div style={{ fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>
                  Valid Until: {new Date(pdfModalQuotation.quotation?.validUntil || Date.now()).toLocaleDateString('en-GB')}
                </div>
                <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>
                  Payment: Strictly Cash on Delivery (COD)
                </div>
              </div>
            </div>

            {/* Bill To / Client Info */}
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Customer / Company</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{pdfModalQuotation.client?.companyName}</div>
                <div style={{ fontSize: 12, color: '#334155' }}>Attn: {pdfModalQuotation.client?.contactPerson}</div>
                <div style={{ fontSize: 12, color: '#334155' }}>Phone: {pdfModalQuotation.client?.phone} • Email: {pdfModalQuotation.client?.email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Delivery Destination</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{pdfModalQuotation.client?.area}</div>
                <div style={{ fontSize: 12, color: '#334155' }}>{pdfModalQuotation.client?.governorate}, State of Kuwait</div>
              </div>
            </div>

            {/* Quotation Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#1e3a8a', color: '#ffffff' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Description & Specifications</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Unit Price (KWD)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (KWD)</th>
                </tr>
              </thead>
              <tbody>
                {pdfModalQuotation.lines?.map((line: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{line.productNameEn}</div>
                      {line.productNameAr && <div style={{ fontSize: 11, color: '#64748b', direction: 'rtl' }}>{line.productNameAr}</div>}
                      {line.specDetails && <div style={{ fontSize: 11, color: '#475569' }}>Specs: {line.specDetails}</div>}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>{line.quantity}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{Number(line.unitPrice).toFixed(3)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#1e3a8a' }}>
                      {Number(line.lineTotal).toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                  <span>Subtotal:</span>
                  <span>{Number(pdfModalQuotation.quotation?.subtotal || 0).toFixed(3)} KWD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                  <span>Kuwait Delivery Fee:</span>
                  <span>{Number(pdfModalQuotation.quotation?.deliveryFee || 0).toFixed(3)} KWD</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', paddingTop: 6,
                  borderTop: '2px solid #0f172a', fontWeight: 800, fontSize: 16, color: '#1e3a8a'
                }}>
                  <span>Grand Total:</span>
                  <span>{Number(pdfModalQuotation.quotation?.grandTotal || 0).toFixed(3)} KWD</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions Box */}
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, color: '#4b5563' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#1e3a8a' }}>Terms & Conditions / الشروط والأحكام:</div>
              <div>• {pdfModalQuotation.quotation?.termsEn}</div>
              <div style={{ direction: 'rtl', marginTop: 2 }}>• {pdfModalQuotation.quotation?.termsAr}</div>
            </div>

            {/* Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid #cbd5e1' }}>
              <div style={{ textAlign: 'center', width: 200 }}>
                <div style={{ height: 40 }}></div>
                <div style={{ borderTop: '1px dashed #64748b', paddingTop: 4, fontSize: 11, color: '#475569' }}>
                  Authorized Najmi Hardware Signature
                </div>
              </div>
              <div style={{ textAlign: 'center', width: 200 }}>
                <div style={{ height: 40 }}></div>
                <div style={{ borderTop: '1px dashed #64748b', paddingTop: 4, fontSize: 11, color: '#475569' }}>
                  Customer Acceptance & Stamp
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
