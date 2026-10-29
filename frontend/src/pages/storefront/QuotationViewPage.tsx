import { useStorefrontCopy } from '../../i18n/useStorefrontCopy';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useStore } from '../../StoreContext';

export default function QuotationViewPage() {
  const copy = useStorefrontCopy();
  const { rfqNumber } = useParams<{ rfqNumber: string }>();
  const [searchParams] = useSearchParams();
  const { showToast } = useStore();

  const [accessKey, setAccessKey] = useState<string>(searchParams.get('key') || '');
  const [keyInput, setKeyInput] = useState<string>(searchParams.get('key') || '');
  const [loading, setLoading] = useState(false);
  const [rfqData, setRfqData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Response State (Accept/Reject)
  const [responding, setResponding] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchQuotation = async (keyToUse: string) => {
    if (!rfqNumber) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.viewRfq(rfqNumber, keyToUse);
      setRfqData(data);
      setAccessKey(keyToUse);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to load quotation. Please verify your access key.');
      setRfqData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessKey) {
      fetchQuotation(accessKey);
    }
  }, [rfqNumber]);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    fetchQuotation(keyInput.trim());
  };

  const handleRespond = async (action: 'ACCEPT' | 'REJECT') => {
    if (!rfqNumber || !accessKey) return;
    setResponding(true);
    try {
      const res = await api.respondToQuotation(rfqNumber, accessKey, action, feedback || undefined);
      showToast(res.message || (action === 'ACCEPT' ? 'Quotation accepted!' : 'Quotation declined'), 'done_all');
      setShowRejectModal(false);
      fetchQuotation(accessKey);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit response', 'error');
    } finally {
      setResponding(false);
    }
  };

  const latestQuote = rfqData?.quotations?.[0];

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', width: '100%', padding: 'var(--space-md) var(--margin-mobile)' }}>
      {/* Access Key Prompt if not authorized yet */}
      {!rfqData && !loading && (
        <div className="card" style={{ padding: 32, maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 44, color: 'var(--primary)' }}>vpn_key</span>
          <h2 className="text-headline-sm" style={{ marginTop: 12, color: 'var(--primary)' }}> {copy("Quotation Access Verification")} </h2>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}> {copy("For privacy and commercial confidentiality, please enter the access verification key provided with RFQ")} <strong>{rfqNumber}</strong>.
          </p>

          {errorMsg && (
            <div style={{ padding: 10, borderRadius: 6, background: '#fee2e2', color: '#991b1b', fontSize: 13, marginTop: 12 }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleKeySubmit} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text"
              className="input"
              placeholder={copy("e.g. key_XXXXX or access token")}
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              required
              style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '12px', fontWeight: 700 }}> {copy("Verify & View Quotation")} </button>
          </form>
        </div>
      )}

      {loading && (
        <div style={{ padding: 64, textAlign: 'center', color: 'var(--outline)' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 36 }}>progress_activity</span>
          <p style={{ marginTop: 12 }}>{copy("Loading official quotation from Najmi Hardware...")}</p>
        </div>
      )}

      {/* Branded Quotation View */}
      {rfqData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Link to="/wholesale" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span> {copy("Wholesale Services")} </Link>
            <button
              onClick={() => window.print()}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span> {copy("Print Quotation")} </button>
          </div>

          {/* Quotation Document Card */}
          <div className="card" style={{
            background: '#ffffff', color: '#0f172a', padding: '36px 32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 24
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1e3a8a', margin: 0 }}> {copy("NAJMI HARDWARE")} </h1>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a8a', direction: 'rtl' }}>
                  شركة النجمي للأدوات الصناعية
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}> {copy("Kuwait")} </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{copy("Official Quotation")}</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1e3a8a', fontFamily: 'monospace' }}>
                  {latestQuote ? latestQuote.quotationNumber : rfqData.rfqNumber}
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}> {copy("Date:")} {new Date(rfqData.createdAt).toLocaleDateString('en-GB')}
                </div>
                {latestQuote?.validUntil && (
                  <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}> {copy("Valid Until:")} {new Date(latestQuote.validUntil).toLocaleDateString('en-GB')}
                  </div>
                )}
                <div style={{ marginTop: 6 }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                    background: rfqData.status === 'ACCEPTED' ? '#dcfce7' : rfqData.status === 'REJECTED' ? '#fee2e2' : '#dbeafe',
                    color: rfqData.status === 'ACCEPTED' ? '#166534' : rfqData.status === 'REJECTED' ? '#991b1b' : '#1e40af'
                  }}>
                    {rfqData.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Client Destination Info */}
            <div style={{
              padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{copy("Client / Company")}</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{rfqData.companyName}</div>
                {rfqData.companyNameAr && <div style={{ fontSize: 13, direction: 'rtl', color: '#475569' }}>{rfqData.companyNameAr}</div>}
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{copy("Attn:")} {rfqData.contactPerson}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{copy("Delivery Destination (Kuwait)")}</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{rfqData.area}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>{rfqData.governorate} {copy("Governorate")}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{copy("Approved Payment Method")}</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}> {copy("💵 Cash on Delivery (COD)")} </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{copy("Collected upon physical handover")}</div>
              </div>
            </div>

            {/* Quotation Table */}
            {latestQuote ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#1e3a8a', color: '#ffffff' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>{copy("Product & Specifications")}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>{copy("Qty")}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>{copy("Unit Price (KWD)")}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>{copy("Total (KWD)")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestQuote.lines.map((line: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{line.productNameEn}</div>
                          {line.productNameAr && <div style={{ fontSize: 11, color: '#64748b', direction: 'rtl' }}>{line.productNameAr}</div>}
                          {line.specDetails && <div style={{ fontSize: 11, color: '#475569' }}>{copy("Specs:")} {line.specDetails}</div>}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{line.quantity}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>{Number(line.unitPrice).toFixed(3)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#1e3a8a' }}>
                          {Number(line.lineTotal).toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Financial Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                      <span>{copy("Subtotal:")}</span>
                      <span>{Number(latestQuote.subtotal).toFixed(3)} {copy("KWD")}</span>
                    </div>
                    {latestQuote.discountTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d' }}>
                        <span>{copy("Project Discount:")}</span>
                        <span>-{Number(latestQuote.discountTotal).toFixed(3)} {copy("KWD")}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                      <span>{copy("Kuwait Delivery Fee:")}</span>
                      <span>{Number(latestQuote.deliveryFee).toFixed(3)} {copy("KWD")}</span>
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', paddingTop: 8,
                      borderTop: '2px solid #0f172a', fontWeight: 900, fontSize: 18, color: '#1e3a8a'
                    }}>
                      <span>{copy("Total Amount:")}</span>
                      <span>{Number(latestQuote.grandTotal).toFixed(3)} {copy("KWD")}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 32, textAlign: 'center', background: '#f8fafc', borderRadius: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--outline)' }}>hourglass_top</span>
                <h3 style={{ fontSize: 16, marginTop: 8 }}>{copy("Pricing Under Review")}</h3>
                <p style={{ fontSize: 13, color: '#64748b' }}> {copy("Najmi staff will review your request and prepare a personalized quotation.")} </p>
              </div>
            )}

            {/* Terms & Conditions */}
            {latestQuote && (
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11, color: '#475569' }}>
                <div style={{ fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>{copy("Terms & Conditions:")}</div>
                <div>• {latestQuote.termsEn || 'Cash on Delivery strictly. Valid for the specified duration.'}</div>
                {latestQuote.termsAr && <div style={{ direction: 'rtl', marginTop: 2 }}>• {latestQuote.termsAr}</div>}
              </div>
            )}

            {/* Customer Response Actions */}
            {latestQuote && rfqData.status === 'QUOTED' && (
              <div style={{
                padding: 20, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e40af', fontSize: 15 }}>{copy("Ready to proceed with this quotation?")}</div>
                  <div style={{ fontSize: 12, color: '#2563eb' }}> {copy("Accepting records your response. Staff must confirm exact specifications and availability before arranging an order.")} </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={responding}
                    className="btn btn-secondary"
                    style={{ fontSize: 13, color: '#b91c1c' }}
                  > {copy("Decline / Revise")} </button>
                  <button
                    onClick={() => handleRespond('ACCEPT')}
                    disabled={responding}
                    className="btn btn-signal"
                    style={{ fontSize: 13, fontWeight: 700, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>thumb_up</span>
                    {responding ? 'Confirming...' : 'Accept Quotation'}
                  </button>
                </div>
              </div>
            )}

            {/* If Accepted */}
            {rfqData.status === 'ACCEPTED' && (
              <div style={{
                padding: 16, background: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#059669' }}>verified</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#065f46', fontSize: 15 }}>{copy("Quotation Accepted by Customer")}</div>
                  <div style={{ fontSize: 12, color: '#047857' }}> {copy("Your acceptance has been recorded. Najmi staff will confirm availability and the next steps.")} </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decline / Feedback Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="text-headline-sm" style={{ color: 'var(--primary)', margin: 0 }}> {copy("Decline or Request Revision")} </h3>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}> {copy("Please let our sales team know if the target budget or lead time did not meet your requirements.")} </p>
            <textarea
              className="input"
              rows={3}
              placeholder={copy("e.g. Budget target is 450 KWD, or delivery date needed earlier...")}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              style={{ height: 'auto', paddingTop: 8 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowRejectModal(false)} className="btn btn-secondary"> {copy("Cancel")} </button>
              <button
                onClick={() => handleRespond('REJECT')}
                disabled={responding}
                className="btn btn-signal"
                style={{ background: '#dc2626' }}
              >
                {responding ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
