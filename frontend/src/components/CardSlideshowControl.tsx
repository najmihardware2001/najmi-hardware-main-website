import { useTranslation } from 'react-i18next';
import { useCardSlideshow } from '../services/cardSlideshow';

export default function CardSlideshowControl() {
  const { i18n } = useTranslation(), ar = i18n.language === 'ar-KW';
  const { playing, toggle } = useCardSlideshow();
  return <button type="button" className="im-card-motion" data-testid="card-motion-control" aria-pressed={!playing} onClick={toggle}>
    <span className="material-symbols-outlined" aria-hidden="true">{playing ? 'pause' : 'play_arrow'}</span>
    {playing ? (ar ? 'إيقاف صور المنتجات' : 'Pause product photos') : (ar ? 'تشغيل صور المنتجات' : 'Play product photos')}
  </button>;
}
