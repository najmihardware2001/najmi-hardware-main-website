import { useStore } from '../../StoreContext';

export default function AdminBanners() {
  const { state, showToast } = useStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--primary)' }}>view_carousel</span>
          <h1 className="text-headline-md" style={{ color: 'var(--primary)' }}>Home Banners</h1>
        </div>
        <button className="btn btn-primary" onClick={() => showToast('Feature disabled in prototype')}>Add Banner</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {state.banners.map(banner => (
          <div key={banner.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 160, background: 'var(--surface-container-low)', position: 'relative' }}>
              {banner.imageUrl ? (
                <img src={banner.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline)' }}>image</span>
                </div>
              )}
              <div style={{ position: 'absolute', top: 8, right: 8 }}>
                <span className="text-label-sm" style={{ padding: '2px 8px', borderRadius: 4, background: banner.isActive ? '#e6f4ea' : 'var(--surface-container-high)', color: banner.isActive ? '#1e7e34' : 'var(--on-surface-variant)' }}>
                  {banner.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <h3 className="text-headline-sm" style={{ fontSize: 16 }}>{banner.title}</h3>
              <p className="text-body-sm truncate-2" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>{banner.subtitle}</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button className="btn btn-outline btn-sm" onClick={() => showToast('Feature disabled')}>Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
