// Maps material to a list of photos
const materialPhotos: Record<string, string[]> = {
  'Nylon': ['001', '002', '003', '004', '005', '006', '007'],
  'Polypropylene': ['008', '009', '010', '011', '012', '013', '014'],
  'Cotton': ['016', '017', '018', '019', '020', '021'],
  'HDPE': ['022', '023', '024', '025', '026', '027', '028'],
  'Polyester': ['029', '030', '031', '032', '033', '034', '035', '036'],
};

export function getProductImage(material: string, index: number): string {
  const photos = materialPhotos[material] || materialPhotos['Nylon'];
  const photoId = photos[index % photos.length];
  return `/images/products/rope_photo_${photoId}.png`;
}

export function getGalleryImages(material: string, index: number): string[] {
  const photos = materialPhotos[material] || materialPhotos['Nylon'];
  const photo1 = photos[index % photos.length];
  const photo2 = photos[(index + 1) % photos.length];
  const photo3 = photos[(index + 2) % photos.length];
  return [
    `/images/products/rope_photo_${photo1}.png`,
    `/images/products/rope_photo_${photo2}.png`,
    `/images/products/rope_photo_${photo3}.png`
  ];
}
