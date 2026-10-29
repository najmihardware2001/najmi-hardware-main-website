import {useDiscovery} from '../../DiscoveryContext';
import AccessibleDialog from '../../components/AccessibleDialog';
import BrandedProductImage from '../../components/BrandedProductImage';
import ProductImageNotice from '../../components/ProductImageNotice';
import { useStorefrontCopy } from '../../i18n/useStorefrontCopy';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../StoreContext';
import { api, type ApiProductTemplate, type ApiProductVariant } from '../../services/api';
import MasterProductOptions from '../../components/MasterProductOptions';
import APlusProductContent from '../../components/APlusProductContent';
import { colourLabel } from '../../i18n/catalogueLabels';

export default function ProductPage() {
  const copy = useStorefrontCopy();
  const {visit,toggleCompare,compare,toggleSaved,saved}=useDiscovery();
  const [zoom,setZoom]=useState(false);

  const { t } = useTranslation(['common', 'navigation', 'products', 'checkout', 'wholesale', 'account']);
  const { i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useEffect(()=>{if(id)visit(id)},[id]);
  const { dispatch, showToast } = useStore();

  const [product, setProduct] = useState<ApiProductTemplate | null>(null);
  const [loading, setLoading] = useState(()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [colourImage, setColourImage] = useState<string|null>(null); const [colourImageGenerated,setColourImageGenerated]=useState<boolean|undefined>(undefined);
  const [galleryPlaying,setGalleryPlaying]=useState(()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches);


  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      if (!id) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await api.getStorefrontProductById(id);
        if (isMounted) {
          setProduct(data);
          setSelectedImageIndex(0);setColourImage(null);setGalleryPlaying(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
          setSelectedVariantId(null);
          if (data.variants && data.variants.length > 0) {
            setSelectedVariantId(data.variants[0].id);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          // Rule 14: Never silently fall back to fake mock demo data
          setErrorMsg(err.message || 'This product is currently unpublished or pending verification.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const variant = useMemo(() => {
    return product?.variants?.find(v => v.id === selectedVariantId) || product?.variants?.[0]
      || (product ? { id: '', sku: product.code, sellingUnit: '', pricingStatus: 'DRAFT', retailPrice: null } as ApiProductVariant : undefined);
  }, [product, selectedVariantId]);

  const mediaList = useMemo(()=>{
    const seen=new Set<string>();
    const priority:string[]=product?.metadata?.priorityGallery||[];
    return (product?.media||[]).filter(m=>{const url=m.webpUrl||m.originalUrl;if(!url||seen.has(url))return false;seen.add(url);return true}).sort((a,b)=>{const ai=priority.indexOf(a.webpUrl||a.originalUrl),bi=priority.indexOf(b.webpUrl||b.originalUrl);return (ai<0?9999:ai)-(bi<0?9999:bi)});
  },[product]);
  useEffect(()=>{if(colourImage){const index=mediaList.findIndex(m=>(m.webpUrl||m.originalUrl)===colourImage);if(index>=0)setSelectedImageIndex(index)}},[colourImage,mediaList]);
  const selectedMedia = mediaList[selectedImageIndex] || mediaList[0];
  const displayMainImg = colourImage || selectedMedia?.webpUrl || selectedMedia?.originalUrl || product?.imageUrl;
  const ar=i18n.language==='ar-KW';
  useEffect(()=>{
    if(!galleryPlaying||mediaList.length<2)return;
    const timer=setInterval(()=>{if(!document.hidden)setSelectedImageIndex(index=>(index+1)%mediaList.length)},5000);
    return()=>clearInterval(timer);
  },[galleryPlaying,mediaList.length,id,selectedImageIndex]);
  useEffect(()=>{const next=mediaList[(selectedImageIndex+1)%mediaList.length];if(next){const image=new Image();image.src=next.webpUrl||next.originalUrl}},[mediaList,selectedImageIndex]);
  const showPhoto=(index:number)=>{
    const safe=(index+mediaList.length)%mediaList.length;
    setSelectedImageIndex(safe);
    setColourImage(null);setGalleryPlaying(false);
  };
  const shortDescription = i18n.language === 'ar-KW' ? product?.descriptionAr : product?.description;
  const fullDescription = i18n.language === 'ar-KW' ? product?.detailsAr : product?.details;
  const detailedDescription = shortDescription && fullDescription?.startsWith(shortDescription)
    ? fullDescription.slice(shortDescription.length).trim() : fullDescription;

  const hasApprovedPrice = Boolean(
    variant &&
    variant.purchaseEligible && variant.availableStock != null && variant.availableStock > 0 &&
    variant.pricingStatus === 'APPROVED' &&
    variant.retailPrice !== null &&
    variant.retailPrice !== undefined &&
    Number(variant.retailPrice) > 0
  );

  const handleAddToCart = () => {
    if (!product || !variant) return;
    if (!hasApprovedPrice) {
      showToast('Price on request — added to RFQ basket', 'request_quote');
      return;
    }
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        productId: product.id,
        variantId: variant.id,
        quantity: qty,
        productName: product.name,
        productNameAr: product.nameAr || undefined,
        productCode: product.code,
        imageUrl: displayMainImg,
        variantSku: variant.sku,
        variantDiameter: variant.diameterMm ? `${variant.diameterMm}mm` : undefined,
        variantLength: variant.lengthValue ? `${variant.lengthValue} ${variant.lengthUnit || 'm'}` : undefined,
        variantColor: variant.color || undefined,
        sellingUnit: variant.sellingUnit || 'piece',
        price: Number(variant.retailPrice),
        isInStock: variant.isInStock,
      },
    });
    showToast(`Added ${qty} ${variant.sellingUnit || 'item'}(s) to Cart`);
  };

  const handleAddToRfq = () => {
    if (!product || !variant) return;
    // A simple listing has no variant ID to send to the variant RFQ basket.
    if (!variant.id) { navigate(`/contact?product=${encodeURIComponent(product.name)}`); return; }
    dispatch({
      type: 'ADD_TO_RFQ',
      payload: { productId: product.id, variantId: variant.id, quantity: qty, notes: '' },
    });
    showToast('Added to RFQ Basket', 'price_check');
  };

  // State 1: Loading
  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: 'center', minHeight: '60vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--primary)' }}>
          progress_activity
        </span>
        <p style={{ marginTop: 16, fontSize: 16, color: 'var(--outline)' }}> {copy("Loading verified product specifications...")} </p>
      </div>
    );
  }

  // State 2: Unavailable / Unpublished (Rule 14 & Rule 12)
  if (errorMsg || !product || !variant) {
    return (
      <div style={{ maxWidth: 640, margin: '80px auto', padding: 32, textAlign: 'center', background: 'var(--surface-container-low)', borderRadius: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 56, color: '#dc2626' }}>
          visibility_off
        </span>
        <h2 className="text-headline-sm" style={{ marginTop: 16, color: 'var(--primary)' }}> {copy("Product Unavailable")} </h2>
        <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 8 }}>
          {errorMsg || 'This product is currently unpublished or pending specification review by Najmi Hardware.'}
        </p>
        <p className="text-body-sm" style={{ color: 'var(--outline)', marginTop: 8 }}> {copy("Unverified manufacturer items remain unpublished until retail pricing and stock are confirmed.")} </p>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/shop" className="btn btn-primary" style={{ textDecoration: 'none' }}> {copy("Back to Catalog")} </Link>
          <Link to="/contact" className="btn btn-outline" style={{ textDecoration: 'none' }}> {copy("Contact Sales Team")} </Link>
        </div>
      </div>
    );
  }

  // State 3: Live Verified Product Page
  return (
    <div className="im-product-page" style={{ display: 'flex', flexDirection: 'column' }}>
      {zoom&&displayMainImg&&<AccessibleDialog title={ar?(product.nameAr||product.name):product.name} onClose={()=>setZoom(false)} className="v2-zoom"><img src={displayMainImg} alt={ar?(product.nameAr||product.name):product.name}/></AccessibleDialog>}
      <div className="im-wrap v2-product-tools"><button onClick={()=>toggleCompare(product.id)} aria-pressed={compare.includes(product.id)}>{ar?'مقارنة':'Compare'}</button><button onClick={()=>toggleSaved(product.id)} aria-pressed={saved.includes(product.id)}>{saved.includes(product.id)?(ar?'تم الحفظ':'Saved'):(ar?'حفظ المنتج':'Save product')}</button><Link to="/bulk-quote">{ar?'عرض سعر بالجملة':'Bulk quote'}</Link></div>
      <nav className="im-wrap im-breadcrumb" aria-label={ar?'مسار التنقل':'Breadcrumb'}><Link to="/shop">{ar?'المنتجات':'Products'}</Link><span aria-hidden="true">/</span><span>{ar?(product.nameAr||product.name):product.name}</span></nav>
      <div className="container-app product-overview" data-testid="product-overview">
        <div className="product-mobile-title">
          <p className="catalogue-eyebrow">{i18n.language === 'ar-KW' ? 'نجمي هاردوير' : 'Najmi Hardware'}</p>
          <h1>{i18n.language === 'ar-KW' && product.nameAr ? product.nameAr : product.name}</h1>
        </div>
        
        {/* Product Image Gallery with Original PDF Photos */}
        <div className="product-media-column">
          {/* Main Photo View */}
          <div className="product-main-photo" data-testid="product-main-photo" style={{
            background: '#fff', borderRadius: 12, aspectRatio: '1/1', padding: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden', position: 'relative'
          }}>
            <button className="v2-zoom-trigger" aria-label={ar?'تكبير الصورة':'Zoom image'} onClick={()=>{setGalleryPlaying(false);setZoom(true)}}>＋</button>
            {selectedMedia?.sourcePdfPage && (
              <span style={{
                position: 'absolute', top: 12, right: 12, background: 'rgba(240, 243, 246, 0.95)',
                padding: '4px 10px', borderRadius: 4, fontSize: '0.75rem', color: '#1e293b', fontWeight: 700
              }}> {copy("ORIGINAL SUPPLIER PHOTO (PAGE")} {selectedMedia.sourcePdfPage})
              </span>
            )}
            {displayMainImg ? (
              <BrandedProductImage
                key={displayMainImg}
                className="product-gallery-image"
                src={displayMainImg}
                fetchPriority="high"
                loading="eager"
                alt={product.metadata?.photoStatus === 'PENDING' ? (i18n.language === 'ar-KW' ? 'صورة المنتج قريباً' : 'Product photo coming soon') : product.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.3s ease' }}
              />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline)' }}>
                image
              </span>
            )}
          </div>

          {mediaList.length>1&&<div className="gallery-controls" aria-label={ar?'التحكم في الصور':'Image controls'}>
            <button type="button" aria-label={ar?'الصورة السابقة':'Previous image'} onClick={()=>showPhoto(selectedImageIndex-1)}><span aria-hidden="true">‹</span></button>
            <span>{colourImage?(ar?'اللون المختار':'Selected colour'):selectedMedia?.colour?colourLabel(selectedMedia.colour,ar):`${selectedImageIndex+1} / ${mediaList.length}`}</span>
            <button type="button" aria-label={galleryPlaying?(ar?'إيقاف عرض الصور':'Pause slideshow'):(ar?'تشغيل عرض الصور':'Play slideshow')} onClick={()=>{setColourImage(null);setGalleryPlaying(value=>!value)}}><span className="material-symbols-outlined" aria-hidden="true">{galleryPlaying?'pause':'play_arrow'}</span></button>
            <button type="button" aria-label={ar?'الصورة التالية':'Next image'} onClick={()=>showPhoto(selectedImageIndex+1)}><span aria-hidden="true">›</span></button>
          </div>}

          {mediaList.length>1&&<p className="catalogue-help gallery-selection-note">{ar?'تصفح الصور لا يغير مواصفات طلبك. اختر اللون من قائمة الخيارات.':'Browsing photos keeps your order options unchanged. Choose your colour in the selector.'}</p>}
          <ProductImageNotice generated={colourImage?colourImageGenerated:undefined} product={product} url={displayMainImg}/>
          {/* Gallery Thumbnails */}
          {mediaList.length > 1 && (
            <div className="product-thumbnails" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
              {mediaList.map((m, idx) => {
                const thumbUrl = m.thumbnailUrl || m.cardUrl || m.webpUrl || m.originalUrl;
                return (
                  <button 
                    key={m.id} 
                    onClick={() => showPhoto(idx)}
                    aria-label={m.colour?colourLabel(m.colour,ar):`${ar?'صورة':'Photo'} ${idx+1}`}
                    title={m.colour?colourLabel(m.colour,ar):undefined}
                    style={{ 
                      flex: '0 0 84px', 
                      height: 84, 
                      border: idx === selectedImageIndex ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
                      borderRadius: 8, 
                      background: '#fff', 
                      padding: 4,
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <BrandedProductImage
                      loading="lazy"
                      src={thumbUrl}
                      alt={`${product.name} photo ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    {m.sourcePdfPage && (
                      <span style={{
                        position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.7)',
                        color: '#fff', fontSize: 9, padding: '1px 3px', borderRadius: 2
                      }}> {copy("P")}{m.sourcePdfPage}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Specifications & Details */}
        <div className="product-details-column">
          
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {product.brand && (
              <span className="badge" style={{ background: 'var(--tertiary)', color: '#fff' }}>
                {product.brand.name}
              </span>
            )}
            {product.category && (
              <span className="badge" style={{ background: 'var(--surface-dim)', color: 'var(--on-surface-variant)' }}>
                {i18n.language === 'ar-KW' ? product.category.nameAr || product.category.name : product.category.name}
              </span>
            )}
            {product.countryOfOrigin && (
              <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}> {copy("Origin:")} {product.countryOfOrigin}
              </span>
            )}
          </div>

          <h1 className="text-headline-lg-mobile product-desktop-title" style={{ color: 'var(--primary)', fontWeight: 800 }}>
            {i18n.language === 'ar-KW' && product.nameAr ? product.nameAr : product.name}
          </h1>
          {product.metadata?.parentReference&&<p className="im-product-reference">{ar?'مرجع المنتج':'Product reference'} <bdi dir="ltr">{product.metadata.parentReference}</bdi></p>}
          {variant.id && <span className="text-label-sm" style={{ color: 'var(--outline)', textTransform: 'uppercase', marginTop: 8 }}> {copy("SKU:")} {variant.sku}
          </span>}

          {product.metadata?.master46 && <><ul className='catalogue-highlights'>{(product.metadata.listingContent?.[i18n.language === 'ar-KW' ? 'features_ar' : 'features_en'] || []).map((f:string)=><li key={f}>{f}</li>)}</ul><MasterProductOptions product={product} onImage={(url,generated,colour)=>{setColourImage(url);setColourImageGenerated(generated);if(url){const index=mediaList.findIndex(m=>(m.webpUrl||m.originalUrl)===url||m.colour===colour);if(index>=0){setSelectedImageIndex(index)}setGalleryPlaying(false)}}}/></>}
          {!product.metadata?.master46 && <>
          {/* Pricing Header */}
          <div style={{ marginTop: 24, paddingBottom: 20, borderBottom: '1px solid var(--outline-variant)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              {hasApprovedPrice ? (
                <>
                  <span className="text-display-sm" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                    {Number(variant.retailPrice).toFixed(3)}
                  </span>
                  <span className="text-label-lg" style={{ color: 'var(--primary)' }}>
                    {t('common:kwd')}
                  </span>
                  <span className="text-body-md" style={{ color: 'var(--on-surface-variant)' }}>
                    / {variant.sellingUnit || 'piece'}
                  </span>
                </>
              ) : (
                <span className="text-headline-sm" style={{ color: '#b45309', fontWeight: 700 }}>
                  {i18n.language === 'ar-KW' ? 'طلب عرض سعر' : 'Request Quote'}
                </span>
              )}
            </div>

            {/* Stock Availability Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: variant.availableStock == null ? '#94a3b8' : variant.isInStock ? '#16a34a' : '#dc2626',
                }}
              />
              <span className="text-label-md" style={{ color: variant.isInStock !== false ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                {variant.availableStock == null ? (i18n.language === 'ar-KW' ? 'يرجى الاستفسار عن التوفر' : 'Please enquire about availability') : variant.isInStock ? (i18n.language === 'ar-KW' ? 'متوفر' : 'In Stock') : (i18n.language === 'ar-KW' ? 'غير متوفر' : 'Out of Stock')}
              </span>
            </div>
          </div>

          {/* Interactive Variant Selection */}
          {product.variants && product.variants.length > 1 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="text-label-md" style={{ fontWeight: 700, color: 'var(--primary)' }}> {copy("Select Size / Diameter:")} </span>
                <span className="text-label-sm" style={{ color: 'var(--outline)' }}>
                  {product.variants.length} {copy("options available")} </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {product.variants.map((v) => {
                  const isSelected = v.id === variant.id;
                  const vPrice = v.retailPrice !== null && v.retailPrice !== undefined ? `${Number(v.retailPrice).toFixed(3)} KWD` : 'RFQ';
                  const label = v.diameterMm ? `${v.diameterMm}mm` : (v.lengthValue ? `${v.lengthValue} ${v.lengthUnit || 'm'}` : v.sku);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
                        background: isSelected ? 'var(--primary)' : '#fff',
                        color: isSelected ? '#fff' : 'var(--on-surface)',
                        cursor: 'pointer',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: 13,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{label}</span>
                      <span style={{ fontSize: 11, opacity: isSelected ? 0.9 : 0.7 }}>{vPrice}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          </>}
          {/* Specs Matrix */}
          {(product.metadata?.diameter_as_listed||variant.material||product.metadata?.packing_as_listed||product.metadata?.applications_as_listed)&&<div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 16,
              background: 'var(--surface-container-low)', padding: 16, borderRadius: 8
            }}>
              {product.metadata?.diameter_as_listed && (
                <div>
                  <span className="text-label-sm" style={{ color: 'var(--outline)' }}>{copy("Available Diameters:")}</span>
                  <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{product.metadata.diameter_as_listed}</p>
                </div>
              )}
              {variant.material && (
                <div>
                  <span className="text-label-sm" style={{ color: 'var(--outline)' }}>{copy("Material:")}</span>
                  <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{variant.material}</p>
                </div>
              )}
              {product.metadata?.packing_as_listed && (
                <div>
                  <span className="text-label-sm" style={{ color: 'var(--outline)' }}>{copy("Packaging Options:")}</span>
                  <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{product.metadata.packing_as_listed}</p>
                </div>
              )}
              {product.metadata?.applications_as_listed && (
                <div>
                  <span className="text-label-sm" style={{ color: 'var(--outline)' }}>{copy("Applications:")}</span>
                  <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{product.metadata.applications_as_listed}</p>
                </div>
              )}
            </div>
          </div>

          }
          {!product.metadata?.master46 && <>
          {/* Action Bar */}
          <div style={{ marginTop: 32, display: 'flex', gap: 16, background: 'var(--surface-bright)', padding: 24, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-container)', borderRadius: 8, padding: 4 }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">remove</span>
              </button>
              <span className="text-headline-sm" style={{ width: 40, textAlign: 'center' }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
            
            {hasApprovedPrice ? (
              <div style={{ flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleAddToCart}>
                  <span className="material-symbols-outlined">shopping_bag</span> {copy("Add to Cart |")} {(Number(variant.retailPrice) * qty).toFixed(3)} {copy("KWD")} </button>
                <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 16px' }} onClick={handleAddToRfq} title={copy("Request contractor or wholesale volume quotation")}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>request_quote</span> {copy("Request Quote")} </button>
              </div>
            ) : (
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddToRfq}>
                <span className="material-symbols-outlined">request_quote</span> {i18n.language === 'ar-KW' ? 'طلب عرض سعر' : 'Request Quotation'}
              </button>
            )}
          </div>

          </>}
          {/* Description Section */}
          {!product.metadata?.master46 && <div style={{ marginTop: 32 }}>
            <h2 className="text-headline-sm" style={{ color: 'var(--primary)', marginBottom: 12 }}>
              {t('products:productSpecifications')}
            </h2>
            <div style={{ padding: 20, background: 'var(--surface-container-low)', borderRadius: 8, lineHeight: 1.6 }}>
              <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                {i18n.language === 'ar-KW' && product.descriptionAr ? product.descriptionAr : product.description}
              </p>
              {detailedDescription && <p style={{ whiteSpace: 'pre-line' }}>{detailedDescription}</p>}
              <p style={{ whiteSpace: 'pre-line' }}>{i18n.language === 'ar-KW' ? product.howToUseAr : product.howToUse}</p>
              {product.metadata?.listingContent && (() => {
                const content = product.metadata.listingContent;
                const arabic = i18n.language === 'ar-KW';
                const features = arabic ? content.features_ar : content.features_en;
                const material = arabic ? content.material_ar : content.material_en;
                return <div data-testid="parent-listing-content">
                  <h3>{arabic ? 'المميزات' : 'Features'}</h3>
                  <ul>{(features || []).map((feature: string) => <li key={feature}>{feature}</li>)}</ul>
                  <h3>{arabic ? 'الاستخدامات الشائعة' : 'Common Uses'}</h3>
                  <p>{arabic ? content.applications_ar : content.applications_en}</p>
                  {material && <p><strong>{arabic ? 'الخامة: ' : 'Material: '}</strong>{material}</p>}
                  <p>{arabic ? 'المقاسات والأطوال والألوان والتعبئة في انتظار تأكيد العميل. تواصل معنا لتأكيد المواصفات المطلوبة.' : 'Dimensions, lengths, colours and packaging await client confirmation. Contact us to confirm the specifications you need.'}</p>
                </div>;
              })()}
            </div>
          </div>}

        </div>
      </div>
      {product.metadata?.master46 && <APlusProductContent product={product}/>} 
    </div>
  );
}
