import type { ApiProductTemplate } from '../services/api';
export default function ProductImageNotice(_props:{product:ApiProductTemplate;url?:string|null;generated?:boolean}) {
  // Owner requested removing repeated storefront badges. Provenance stays in admin.
  return null;
}
