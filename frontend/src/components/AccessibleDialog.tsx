import {useEffect,useId,useRef,type ReactNode} from 'react';
export default function AccessibleDialog({title,onClose,children,className=''}:{title:string;onClose:()=>void;children:ReactNode;className?:string}){
 const ref=useRef<HTMLDialogElement>(null),label=useId();
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;ref.current?.showModal();document.body.style.overflow='hidden';return()=>{ref.current?.close();document.body.style.overflow=overflow;previous?.focus()}},[]);
 return <dialog ref={ref} className={'v2-dialog '+className} aria-labelledby={label} onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className="v2-dialog-heading"><h2 id={label}>{title}</h2><button type="button" autoFocus onClick={onClose} aria-label={document.documentElement.dir==='rtl'?'إغلاق':'Close'}>×</button></div>{children}</dialog>;
}
