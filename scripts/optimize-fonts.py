# Optional maintenance: pip install fonttools brotli; python scripts/optimize-fonts.py
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset
import re
root=Path(__file__).resolve().parent.parent
source='\n'.join(p.read_text(encoding='utf-8') for p in (root/'frontend/src').rglob('*') if p.suffix in {'.ts','.tsx','.json'})
words=set(re.findall(r'[a-z][a-z0-9_]+',source))
for p in (root/'frontend/public/fonts').glob('*.ttf'):
 f=TTFont(p)
 if p.stem=='material-symbols-outlined':
  reverse={v:chr(k) for k,v in f.getBestCmap().items()}
  glyphs=set()
  for lookup in f['GSUB'].table.LookupList.Lookup:
   if lookup.LookupType not in {4,7}: continue
   for original in lookup.SubTable:
    sub=original.ExtSubTable if lookup.LookupType==7 else original
    if not hasattr(sub,'ligatures'): continue
    for first,ligs in sub.ligatures.items():
     for lig in ligs:
      word=''.join(reverse.get(g,'?') for g in [first]+lig.Component)
      if word in words: glyphs.add(lig.LigGlyph)
  assert len(glyphs)>30, 'Icon subset must retain used ligatures'
  opts=subset.Options();opts.layout_closure=False
  sub=subset.Subsetter(options=opts);sub.populate(unicodes=range(32,127),glyphs=glyphs);sub.subset(f)
  print('Icons retained:',len(glyphs))
 else:
  opts=subset.Options(); sub=subset.Subsetter(options=opts)
  chars=set(range(0,0x250))|set(range(0x600,0x700))|set(range(0x750,0x780))|set(range(0x8a0,0x900))|set(range(0xfb50,0xfe00))|set(range(0xfe70,0xff00))|set(range(0x2000,0x2070))|set(range(0x20a0,0x20d0))
  sub.populate(unicodes=chars);sub.subset(f)
 f.flavor='woff2'
 target=p.with_suffix('.woff2');f.save(target)
 print(p.name,p.stat().st_size,'->',target.stat().st_size)



