import BrandedProductImage from '../../components/BrandedProductImage';
import { useStorefrontCopy } from '../../i18n/useStorefrontCopy';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../StoreContext';
import { getProduct, getVariant } from '../../store';
import { colourLabel, measurementLabel, unitLabel } from '../../i18n/catalogueLabels';


export default function CartPage() {
  const copy = useStorefrontCopy();
  const { t } = useTranslation(['common', 'navigation', 'products', 'checkout', 'wholesale', 'account']);
  const { i18n } = useTranslation();
  const { state, dispatch, showToast } = useStore();
  const navigate = useNavigate();
  const { cart } = state;

  const handleUpdateQty = (productId: string, variantId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemove(productId, variantId);
      return;
    }
    dispatch({ type: 'UPDATE_CART_QTY', payload: { productId, variantId, quantity } });
  };

  const handleRemove = (productId: string, variantId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { productId, variantId } });
    showToast('Item removed from cart', 'delete');
  };

  const handleCheckout = () => {
    if (hasUnpricedItems) {
      showToast('Please remove or quote unpriced items before checkout', 'warning');
      return;
    }
    navigate('/checkout');
  };

  const handleMoveToRfq = () => {
    cart.forEach(item => {
      dispatch({ type: 'ADD_TO_RFQ', payload: { ...item, notes: '' } });
    });
    dispatch({ type: 'CLEAR_CART' });
    navigate('/rfq-basket');
  };

  const getItemPrice = (item: typeof cart[0]): number | null => {
    if (typeof item.price === 'number' && !isNaN(item.price)) {
      return item.price;
    }
    const product = getProduct(state, item.productId);
    const variant = product ? getVariant(product, item.variantId) : null;
    return variant?.retailPrice ?? null;
  };

  const subtotal = cart.reduce((acc, item) => {
    const price = getItemPrice(item);
    return acc + (price !== null && price > 0 ? price * item.quantity : 0);
  }, 0);

  const hasUnpricedItems = cart.some(item => {
    const price = getItemPrice(item);
    return price === null || price <= 0;
  });



  return (
    <div className="im-cart-page" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <section style={{ padding: 'var(--space-md) var(--margin-mobile)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="text-headline-lg-mobile" style={{ color: 'var(--primary)', fontWeight: 800 }}>
            {t('checkout:cart', { defaultValue: 'Shopping Cart' })}
            <span style={{ color: 'var(--secondary)', marginLeft: 8, fontSize: '1rem', fontWeight: 600 }}>
              ({cart.reduce((sum, i) => sum + i.quantity, 0)} {copy("items)")} </span>
          </h1>
          <p className="text-body-sm" style={{ color: 'var(--outline)', marginTop: 4 }}> {copy("Direct fulfillment from Shuwaikh Industrial Showroom & Warehouse.")} </p>
        </div>
      </section>

      {state.rfqBasket.length>0&&<div className="im-wrap v2-quote-cart-note"><p>{i18n.language==='ar-KW'?'منتجات طلب عرض السعر محفوظة في سلة منفصلة.':'Your enquiry items are saved separately in the quote basket.'}</p><Link className="btn btn-outline" to="/rfq-basket">{i18n.language==='ar-KW'?'عرض طلب السعر':'View Quote Basket'} ({state.rfqBasket.length})</Link></div>}
      {/* Main Cart Area */}
      <section style={{ padding: '0 var(--margin-mobile)', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        {cart.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center', background: 'var(--surface-container-low)', borderRadius: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--outline)' }}>production_quantity_limits</span>
            <h3 className="text-headline-sm" style={{ marginTop: 16, color: 'var(--primary)' }}>
              {t('checkout:emptyCart', { defaultValue: 'Your Shopping Cart is Empty' })}
            </h3>
            <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', maxWidth: 440, margin: '8px auto 0' }}> {copy("Browse our verified rope, cordage and hardware inventory directly from Najmi Hardware.")} </p>
            <Link to="/shop" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined">storefront</span> {copy("Browse Catalog")} </Link>
          </div>
        ) : (
          <>
            {/* Warning if unpriced items exist (Rule 4) */}
            {hasUnpricedItems && (
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
                padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12
              }}>
                <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: 24 }}>error_outline</span>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#92400e' }}> {copy("Unpriced Items in Cart")} </h4>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#b45309', lineHeight: 1.5 }}> {copy("In accordance with Najmi Hardware pricing governance, products without verified selling prices cannot be purchased via direct checkout. Please move them to a Wholesale RFQ or remove them.")} </p>
                  <div style={{ marginTop: 10 }}>
                    <button className="btn btn-sm btn-outline" style={{ borderColor: '#d97706', color: '#b45309' }} onClick={handleMoveToRfq}> {copy("Move All to RFQ Basket")} </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cart Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cart.map(item => {
                const product = getProduct(state, item.productId);
                const itemImg = item.imageUrl || product?.images?.[0] || '';
                const title = (i18n.language === 'ar-KW' && item.productNameAr)
                  ? item.productNameAr
                  : (item.productName || (product ? (i18n.language === 'ar-KW' ? product.nameAr : product.name) : 'Hardware Product'));
                const price = getItemPrice(item);
                const hasValidPrice = price !== null && price > 0;
                const ar=i18n.language==='ar-KW',measurement=item.variantMeasurement;
                const specParts = [
                  measurement ? `${measurementLabel(measurement.type,ar)}: ${measurement.value} ${unitLabel(measurement.unit,ar)}` : item.variantDiameter ? `Ø ${item.variantDiameter}` : null,
                  measurement?.lengthValue ? `${measurement.lengthValue} ${unitLabel(measurement.lengthUnit||'',ar)}` : item.variantLength ? item.variantLength : null,
                  measurement?.colour ? colourLabel(measurement.colour,ar) : item.variantColor ? colourLabel(item.variantColor,ar) : null,
                  item.sellingUnit ? `${ar?'لكل':'Per'} ${unitLabel(item.sellingUnit,ar)}` : null,
                  item.variantSku ? `SKU: ${item.variantSku}` : null,
                ].filter(Boolean);

                return (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="card"
                    style={{
                      padding: 16,
                      background: '#fff',
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 16,
                      alignItems: 'center',
                      borderRadius: 12,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    {/* Item Thumbnail */}
                    <div style={{
                      width: 88,
                      height: 88,
                      borderRadius: 8,
                      background: '#f8fafc',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 6,
                      border: '1px solid var(--outline-variant)',
                    }}>
                      {itemImg ? (
                        <BrandedProductImage
                          src={itemImg}
                          alt={title}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }}
                        />
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--outline)' }}>
                          inventory_2
                        </span>
                      )}
                    </div>

                    {/* Item Details */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <Link to={`/product/${item.productId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <h3 className="text-headline-sm" style={{ fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
                            {title}
                          </h3>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.productId, item.variantId)}
                          style={{
                            color: 'var(--outline)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 4,
                          }}
                          title={copy("Remove item")}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete_outline</span>
                        </button>
                      </div>

                      {/* Specs */}
                      {specParts.length > 0 && (
                        <span className="text-label-sm" style={{ color: 'var(--outline)' }}>
                          {specParts.join(' • ')}
                        </span>
                      )}

                      {/* Pricing and Qty Controls Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 12 }}>
                        {/* Qty Counter */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: 'var(--surface-container-low)',
                          borderRadius: 8,
                          border: '1px solid var(--outline-variant)',
                        }}>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.productId, item.variantId, item.quantity - 1)}
                            style={{ padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            aria-label={copy("Decrease quantity")}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
                          </button>
                          <span className="text-label-md" style={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.productId, item.variantId, item.quantity + 1)}
                            style={{ padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            aria-label={copy("Increase quantity")}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                          </button>
                        </div>

                        {/* Price Display */}
                        <div style={{ textAlign: 'right' }}>
                          {hasValidPrice ? (
                            <>
                              <div className="text-headline-sm" style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 16 }}>
                                {(price * item.quantity).toFixed(3)} {copy("KWD")} </div>
                              <span className="text-label-sm" style={{ color: 'var(--outline)', fontSize: 12 }}>
                                {price.toFixed(3)} {copy("KWD /")} {item.sellingUnit || 'piece'}
                              </span>
                            </>
                          ) : (
                            <span style={{ color: '#b45309', fontWeight: 700, fontSize: 13 }}> {copy("Price on Request")} </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Wholesale RFQ Notice Banner */}
            <div className="card" style={{ padding: 20, background: 'var(--primary-container)', color: 'var(--pure-white)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>engineering</span>
                    <span className="text-label-md" style={{ fontWeight: 700, fontSize: 15 }}>{copy("Ordering 20+ coils or commercial project lots?")}</span>
                  </div>
                  <p className="text-body-sm" style={{ color: 'var(--on-primary-container)', margin: '4px 0 0' }}> {copy("Wholesale pricing tiers, tax invoices, and B2B credit terms are available via official RFQ submission.")} </p>
                </div>
                <button
                  type="button"
                  className="btn btn-signal"
                  style={{ whiteSpace: 'nowrap' }}
                  onClick={handleMoveToRfq}
                > {copy("Move to Wholesale RFQ")} </button>
              </div>
            </div>

            {/* Order Summary Box */}
            <div className="card" style={{ padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <h3 className="text-headline-sm" style={{ fontSize: 18, marginBottom: 16, fontWeight: 700, color: 'var(--primary)' }}>
                {t('checkout:orderSummary', { defaultValue: 'Order Summary' })}
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }} className="text-body-md">
                <span style={{ color: 'var(--on-surface-variant)' }}>{copy("Items Subtotal")}</span>
                <span style={{ fontWeight: 700 }}>{subtotal.toFixed(3)} {copy("KWD")}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }} className="text-body-md">
                <span style={{ color: 'var(--on-surface-variant)' }}>{copy("Standard Kuwait Delivery")}</span>
                <span style={{ fontWeight: 600 }}>{copy("Calculated at checkout")}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px 0',
                borderTop: '1px solid var(--outline-variant)',
                borderBottom: '1px solid var(--outline-variant)',
                marginBottom: 20,
              }} className="text-headline-sm">
                <span style={{ fontWeight: 800 }}>{copy("Products Total")}</span>
                <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 20 }}>
                  {subtotal.toFixed(3)} {copy("KWD")} </span>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: 16,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                disabled={cart.length === 0 || hasUnpricedItems}
                onClick={handleCheckout}
              >
                <span className="material-symbols-outlined">lock</span> {copy("Proceed to Checkout")} </button>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <span className="text-label-sm" style={{ color: 'var(--outline)' }}> {copy("🔒 Secure local checkout • Shuwaikh branch fulfillment")} </span>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
