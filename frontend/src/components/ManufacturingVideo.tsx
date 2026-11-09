import { useStorefrontCopy } from '../i18n/useStorefrontCopy';
import { useRef, useState } from 'react';
import {responsiveImage} from '../services/responsiveImages';

export default function ManufacturingVideo() {
  const copy = useStorefrontCopy();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      <div 
        style={{ 
          position: 'relative', 
          borderRadius: 12, 
          overflow: 'hidden', 
          aspectRatio: '16/9', 
          background: 'var(--primary-container)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)'
        }}
      >
        {hasError ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333', color: '#fff', textAlign: 'center', padding: 24 }}>
            <p>{copy("Video playback error. Please try again later.")}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={`${import.meta.env.BASE_URL}videos/star-rope-manufacturing.mp4`}
              poster={responsiveImage('/uploads/client-corrections-20261026/ROP-003--closeup.webp').src}
              controls
              playsInline
              preload="none"
              onError={() => setHasError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            > {copy("Your browser does not support the video tag.")} </video>
            
          </>
        )}
      </div>
      
    </div>
  );
}
