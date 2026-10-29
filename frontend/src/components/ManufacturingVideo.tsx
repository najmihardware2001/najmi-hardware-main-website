import { useStorefrontCopy } from '../i18n/useStorefrontCopy';
import { useRef, useState } from 'react';

export default function ManufacturingVideo() {
  const copy = useStorefrontCopy();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(e => {
          console.error("Video play failed", e);
          setHasError(true);
        });
      } else {
        videoRef.current.pause();
      }
    }
  };

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
              poster="/uploads/client-corrections-20261026/ROP-003--closeup.webp"
              controls
              playsInline
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={() => setHasError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            > {copy("Your browser does not support the video tag.")} </video>
            
            {/* Custom Play Button Overlay (hides when playing natively) */}
            {!isPlaying && (
              <div 
                onClick={handlePlayPause}
                style={{ 
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.3)', cursor: 'pointer', pointerEvents: 'none'
                }}
              >
                <div style={{ 
                  width: 80, height: 80, borderRadius: '50%', background: 'var(--secondary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)', pointerEvents: 'auto', transition: 'transform 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--primary)', marginLeft: 4 }}>play_arrow</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Disclaimer */}
      <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', textAlign: 'right', fontStyle: 'italic', opacity: 0.8 }}> {copy("*Illustrative manufacturing visualisation")} </p>
    </div>
  );
}
