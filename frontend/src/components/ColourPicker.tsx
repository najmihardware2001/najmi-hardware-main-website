import { useEffect, useLayoutEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { colourLabel } from '../i18n/catalogueLabels';
import BrandedProductImage from './BrandedProductImage';
import './colour-picker.css';

// Display swatches are shade guides; product photographs remain the visual reference.
const shades: Record<string, string> = {
  White:'#ffffff',Black:'#17191c',Red:'#ce2637',Blue:'#2265bd',Green:'#24844c',Yellow:'#f6dc29',Pink:'#eb8eb5',Orange:'#f47b24',Gold:'#cba64f',Silver:'#bbc1c9',Brown:'#67412f',Natural:'#cbb78d',Beige:'#d9c9aa',Coffee:'#593f31',Khaki:'#aaa17a',Maroon:'#6e2138',Grey:'#8e9299',Purple:'#7d4099',
  'Navy Blue':'#182d52','Royal Blue':'#2250b8',Peach:'#f3b38e','Sea Green':'#71b9b0',Magenta:'#bd237e',Cream:'#f3ead2','Off White':'#f2f0e7','Dark Green':'#174e39',Copper:'#b76c48',Lilac:'#bb9bd1','Light Blue':'#a2d2e7','Light Pink':'#f5bfd2','Sage Green':'#a6b68c','Mint Green':'#a2dcc2',Olive:'#6e7c37','Teal Green':'#148e80','Teal Blue':'#247d92','Yellow Gold':'#e2b82e','Hot Pink':'#e8388b',Fuchsia:'#c72784','Sky Blue':'#88cdeb','Cornflower Blue':'#6996dc','Neon Green':'#a6f12d','Neon Orange':'#ff6926','Light Yellow':'#f4eaa3','Light Green':'#b6d3ad',
  'Coral Pink':'#ed8f9f','French Blue':'#88a7ce',Wisteria:'#9ba9dd',Wine:'#782c46',Seamist:'#c7d4bc',Aqua:'#9edcd8',Buttermilk:'#e9d8ab','Smoke Blue':'#667e9f',Burgundy:'#672332',Mint:'#b4dfce',Turquoise:'#40b6c7',Toffee:'#bd956a',Candlelight:'#f2e8d9','Lilac Mist':'#d7d1e2',Celadon:'#a7cdb7','Ocean Blue':'#279bb2',Vanilla:'#efe5d9',Ivory:'#f1eadb','Rosy Mauve':'#be91a5','Light Peach':'#f1c8ae',Cobalt:'#254aa1',Orchid:'#c6a7cd','Apple Green':'#a8cf58',Jade:'#388d7c',Taupe:'#a89889',Nude:'#dcc6b8','Antique Mauve':'#a77f8b','Light Navy':'#3b5478',Iris:'#aaa6da',Emerald:'#20875d','Shell Grey':'#cbc9ca','Old Gold':'#b28c45','White Rose':'#f1e6e3','Baby Maize':'#eee4ac',Coral:'#ec8277',Grape:'#9270ac',Hunter:'#285b4c',Cocoa:'#936c53',Thistle:'#b3a1bd',Charcoal:'#56565c','Golden Yellow':'#ebc13d','Burnt Orange':'#ce622a',Scarlet:'#c62a38',Plum:'#542a52',Amethyst:'#88568e',Rust:'#a85138',
  'Forest Green':'#245e43',Navy:'#182d52',Tan:'#bf976f',Teal:'#247f80','Mustard Yellow':'#bea02e','Light Grey':'#c8cbd0','Lime Green':'#b6e82c','Dark Brown':'#432e29',
};
export function swatch(colour: string) {
  if (colour === '__unknown') return 'repeating-linear-gradient(135deg,#fff 0 5px,#d7dde3 5px 7px)';
  if (/mixed|multicolour/i.test(colour)) return 'conic-gradient(#e5759e,#e5ce67,#7ebf9a,#6baed0,#b997cc,#e5759e)';
  const parts = colour.replace(/ Glitter$/,'').split(/\s*[,+]\s*/).map(name=>shades[name] || '#c2c7cd');
  const base = parts.length === 1 ? parts[0] : `repeating-linear-gradient(135deg,${parts.flatMap((shade,i)=>[`${shade} ${i*8}px`,`${shade} ${(i+1)*8}px`]).join(',')})`;
  return colour.endsWith(' Glitter') ? `radial-gradient(circle at 25% 35%,#fff9 0 1px,transparent 2px),${base}` : base;
}

type Choice = { value: string; name: string; enquiry: boolean };
export default function ColourPicker({ value, options, preferences, disabled, ar, onChange, previewImage, productName }: {
  value: string; options: string[]; preferences: string[]; disabled: boolean; ar: boolean; onChange: (value: string)=>void; previewImage?: string; productName: string;
}) {
  const [open,setOpen] = useState(false), root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null), [placement,setPlacement] = useState<CSSProperties>({});
  const id = useId(), listId = `${id}-list`, labelId = `${id}-label`;
  const choices: Choice[] = [...options.map(name=>({value:name,name,enquiry:false})),...preferences.map(name=>({value:`pref:${name}`,name,enquiry:true}))];
  const selected = choices.find(choice=>choice.value===value);
  useLayoutEffect(()=>{
    if(!open)return;
    const place = ()=>{
      if(!trigger.current||!menu.current)return;
      const rect = trigger.current.getBoundingClientRect(), width = Math.min(Math.max(rect.width,270),window.innerWidth-32);
      const bottom = window.visualViewport ? window.visualViewport.offsetTop+window.visualViewport.height : window.innerHeight;
      if(window.innerWidth<768){
        const space=Math.max(260,Math.min(610,bottom-222)), panelWidth=Math.min(window.innerWidth-32,440);
        setPlacement({left:(window.innerWidth-panelWidth)/2,top:Math.max(16,bottom-space-138),width:panelWidth,'--colour-list-space':`${Math.max(80,space-222)}px`} as CSSProperties);
        return;
      }
      const available = Math.max(260,bottom-32), height = Math.min(560,available);
      const panelWidth=Math.min(Math.max(width,320),window.innerWidth-32);
      const top=Math.max(16,Math.min(rect.bottom+6,bottom-height-16));
      setPlacement({left:Math.max(16,Math.min(ar?rect.left:rect.right-panelWidth,window.innerWidth-panelWidth-16)),top,width:panelWidth,'--colour-list-space':`${Math.max(80,height-222)}px`} as CSSProperties);
    };
    place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true);window.visualViewport?.addEventListener('resize',place);
    return ()=>{window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);window.visualViewport?.removeEventListener('resize',place)};
  },[open,ar,choices.length]);
  useEffect(()=>{
    if (!open) return;
    const outside = (e: PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false)};
    document.addEventListener('pointerdown',outside);
    return ()=>document.removeEventListener('pointerdown',outside);
  },[open]);
  useEffect(()=>{if(disabled)setOpen(false)},[disabled]);
  function focusOption(index: number) {
    requestAnimationFrame(()=>{
      const option = root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')[index];
      option?.focus({preventScroll:true});
      option?.scrollIntoView({block:'nearest',inline:'nearest'});
    });
  }
  function keys(e: KeyboardEvent, index: number) {
    if(e.key==='Escape'){e.preventDefault();setOpen(false);trigger.current?.focus();return}
    let next: number | undefined;
    if(e.key==='ArrowDown')next=(index+1)%choices.length;
    else if(e.key==='ArrowUp')next=(index-1+choices.length)%choices.length;
    else if(e.key==='Home')next=0;
    else if(e.key==='End')next=choices.length-1;
    if(next!==undefined){e.preventDefault();focusOption(next)}
  }
  return <div className="colour-picker" ref={root} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)}}>
    <span id={labelId} className="colour-picker-label">{ar?'اللون / النقشة':'Colour / pattern'}</span>
    <button ref={trigger} type="button" role="combobox" aria-labelledby={labelId} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?listId:undefined} disabled={disabled} className="colour-picker-trigger" data-testid="option-colour" data-value={value}
      onClick={()=>setOpen(v=>!v)} onKeyDown={e=>{if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();setOpen(true);focusOption(e.key==='End'||e.key==='ArrowUp'?choices.length-1:Math.max(0,choices.findIndex(c=>c.value===value)))}else if(e.key==='Escape')setOpen(false)}}>
      {selected&&<span className="colour-picker-swatch" aria-hidden="true" style={{background:swatch(selected.name)}}/>}
      <span className="colour-picker-value">{selected?colourLabel(selected.name,ar):ar?'اختر':'Select'}</span><span className="colour-picker-chevron" aria-hidden="true">⌄</span>
    </button>
    {open&&<div ref={menu} className="colour-picker-menu" style={placement}>
      <div className="colour-picker-menu-heading"><span>{ar?'اختر لوناً لمعاينة الصورة':'Select a colour to preview'}</span><button type="button" aria-label={ar?'إغلاق الألوان':'Close colours'} onClick={()=>{setOpen(false);trigger.current?.focus()}}>×</button></div>
      <div className="colour-picker-preview" data-testid="colour-picker-preview">
        <BrandedProductImage src={previewImage} alt={`${productName}${selected?' — '+colourLabel(selected.name,ar):''}`} style={{height:140,objectFit:'contain'}}/>
        <div><strong>{productName}</strong><p aria-live="polite">{selected?colourLabel(selected.name,ar):ar?'اختر لوناً أدناه':'Choose a colour below'}</p><small>{ar?'تتغير الصورة مع اختيار اللون':'The image updates as you choose'}</small></div>
      </div>
      <div role="listbox" id={listId} aria-labelledby={labelId} className="colour-picker-list">
        {choices.map((choice,index)=><button type="button" role="option" aria-selected={choice.value===value} tabIndex={choice.value===value||(!value&&index===0)?0:-1} key={choice.value} data-colour-value={choice.value} className="colour-picker-option" onKeyDown={e=>keys(e,index)} onClick={()=>onChange(choice.value)}>
          <span className="colour-picker-swatch" aria-hidden="true" style={{background:swatch(choice.name)}}/><span>{colourLabel(choice.name,ar)}{choice.enquiry&&<small>{ar?'حسب الطلب':'On enquiry'}</small>}</span><span className="colour-picker-check" aria-hidden="true">{choice.value===value?'✓':''}</span>
        </button>)}
      </div>
    </div>}
  </div>;
}
