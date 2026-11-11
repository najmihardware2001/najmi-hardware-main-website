import fs from 'node:fs';

// Editorial updates use supplied product references; selector data supplies dimensions.
const file = new URL('../catalogue/public-catalogue.json', import.meta.url);
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const updates = {
  7906: {
    description: ['Nylon twine on spools, with five diameter options and three roll lengths for specifying tying and line requirements.', 'خيط نايلون على بكرات، بخمسة خيارات للقطر وثلاثة أطوال للفة لتحديد متطلبات الربط والخيوط.'],
    details: ['Choose 1, 1.5, 2, 2.5 or 3 mm and a 100, 200 or 300 m roll. The supplied Star Rope sample is white, marked 1.5 mm × 300 m. Use the size and roll selectors to describe the exact combination you require.', 'اختر قطر 1 أو 1.5 أو 2 أو 2.5 أو 3 مم ولفة بطول 100 أو 200 أو 300 متر. عينة ستار روب المرسلة بيضاء وموضح عليها 1.5 مم × 300 متر. استخدم خيارات المقاس والطول لتحديد التركيبة المطلوبة.'],
    applications: ['General tying, bundle organisation and nylon-line replacement enquiries. Match diameter, length and the intended use before supply.', 'استفسارات الربط العام وتنظيم الحزم واستبدال خيوط النايلون. طابق القطر والطول مع الاستخدام المقصود قبل التوريد.'],
    selection: ['Select the diameter first, then the required roll length. Include the number of rolls and any colour preference in your quotation request.', 'اختر القطر أولاً، ثم طول اللفة المطلوب. أضف عدد اللفات وأي لون مفضل إلى طلب عرض السعر.'],
    usage: ['Unwind from the spool without pulling loose loops across one another. Measure the required length before cutting and check that the selected twine suits the fastening method.', 'اسحب الخيط من البكرة دون تشابك الحلقات الحرة. قس الطول المطلوب قبل القص وتأكد من ملاءمة الخيط لطريقة الربط.'],
    care: ['Store on its spool, dry and away from direct sunlight, sharp edges and heat. Check for cuts or damaged sections before use.', 'يحفظ على بكرته في مكان جاف بعيداً عن الشمس المباشرة والحواف الحادة والحرارة. افحص الخيط بحثاً عن القطوع أو التلف قبل الاستخدام.'],
    question: ['Is every spool shown a 300 m roll?', 'هل كل بكرة معروضة بطول 300 متر؟'],
    answer: ['The photograph shows a 1.5 mm × 300 m sample. Other listed choices are 100 and 200 m; your selected option determines the requested roll length.', 'تُظهر الصورة عينة 1.5 مم × 300 متر. تشمل الخيارات المدرجة أيضاً 100 و200 متر؛ ويحدد الخيار المختار طول اللفة المطلوبة.']
  },
  7907: {
    description: ['Clear nylon twine on a spool, listed in a 100 m roll for clear-line and tying enquiries.', 'خيط نايلون شفاف على بكرة، مدرج بلفة طولها 100 متر لاستفسارات الخيوط الشفافة والربط.'],
    details: ['The reference shows clear nylon line on a blue-flanged spool. Roll length is 100 m. A diameter was not supplied for this listing, so include your required thickness and intended use when requesting a quote.', 'يُظهر المرجع خيط نايلون شفافاً على بكرة ذات حواف زرقاء. طول اللفة 100 متر. لم يحدد قطر لهذا المنتج؛ لذا أضف السماكة المطلوبة والاستخدام المقصود عند طلب السعر.'],
    applications: ['Clear-line tying, display and craft enquiries where line thickness and attachment compatibility can be checked against a sample.', 'استفسارات الربط بالخيوط الشفافة والعرض والأعمال الحرفية مع مطابقة سماكة الخيط وطريقة تثبيته مع عينة.'],
    selection: ['Choose the 100 m roll and state the required diameter in your request. For a measured fishing-line option, compare the separate Monofilament Fishing Twine listing.', 'اختر لفة 100 متر واذكر القطر المطلوب في طلبك. لخيار خيط صيد محدد القطر، قارن منتج خيط الصيد الأحادي المنفصل.'],
    usage: ['Keep the clear line visible against a contrasting surface while measuring and cutting. Confirm the fixing method for the item being tied or displayed.', 'ضع الخيط الشفاف على سطح بلون متباين أثناء القياس والقص لتسهيل رؤيته. تأكد من ملاءمة طريقة التثبيت للقطعة المراد ربطها أو عرضها.'],
    care: ['Keep the line on its spool to reduce tangling. Store dry, away from heat and direct sunlight, and inspect for abrasion before use.', 'يحفظ الخيط على بكرته لتقليل التشابك، في مكان جاف بعيداً عن الحرارة والشمس المباشرة. افحصه بحثاً عن التآكل قبل الاستخدام.'],
    question: ['What diameter does this clear twine have?', 'ما قطر هذا الخيط الشفاف؟'],
    answer: ['The confirmed roll length is 100 m; the diameter is not specified. Add your required diameter to the enquiry so the team can identify the correct item.', 'طول اللفة المحدد هو 100 متر؛ أما القطر فغير محدد. أضف القطر المطلوب إلى الاستفسار ليحدد الفريق الصنف المناسب.']
  },
  7908: {
    description: ['Nylon monofilament fishing twine in 100 m rolls, with diameter choices from 0.40 to 0.90 mm.', 'خيط صيد نايلون أحادي بلفات طولها 100 متر وخيارات قطر من 0.40 إلى 0.90 مم.'],
    details: ['Compare 0.40, 0.50, 0.60, 0.70, 0.80 and 0.90 mm diameters. The green-spool reference is labelled Nylon Monofilament Fishing Line and shows a 0.50 mm sample. Each listed option uses the 100 m roll length.', 'قارن أقطار 0.40 و0.50 و0.60 و0.70 و0.80 و0.90 مم. يوضح ملصق البكرة الخضراء خيط صيد نايلون أحادياً وعينة بقطر 0.50 مم. طول اللفة لكل خيار مدرج هو 100 متر.'],
    applications: ['Fishing-line replacement and tackle enquiries where the required line diameter is known. Confirm compatibility with your reel, rig and intended use.', 'استفسارات استبدال خيوط الصيد ومستلزماته عند معرفة القطر المطلوب. تأكد من التوافق مع بكرة الصيد والتجهيز والاستخدام المقصود.'],
    selection: ['Match the diameter to your equipment specification and choose the number of 100 m rolls. Diameter alone does not establish breaking strength; request exact-item information if needed.', 'طابق القطر مع مواصفات معداتك وحدد عدد لفات 100 متر. القطر وحده لا يحدد قوة القطع؛ اطلب بيانات الصنف المحدد عند الحاجة.'],
    usage: ['Unwind evenly and avoid tight bends or kinks when measuring. Inspect the line and check your knots and connections before use.', 'اسحب الخيط بانتظام وتجنب الثنيات الحادة والالتواءات أثناء القياس. افحص الخيط والعقد والوصلات قبل الاستخدام.'],
    care: ['Keep on the original spool, protected from sunlight and heat. Clean and dry used line before storage, and replace sections that show abrasion.', 'يحفظ على بكرته الأصلية بعيداً عن الشمس والحرارة. نظف الخيط المستخدم وجففه قبل التخزين واستبدل الأجزاء المتآكلة.'],
    question: ['Does a thicker line have a published breaking strength here?', 'هل يوضح المنتج قوة قطع معتمدة لكل قطر؟'],
    answer: ['No breaking-strength value is supplied for these options. Ask for the exact line documentation before selecting it for a particular load or fishing setup.', 'لم ترد قيمة لقوة القطع لهذه الخيارات. اطلب بيانات الخيط المحدد قبل اختياره لحمولة أو تجهيز صيد معين.']
  },
  7909: {
    description: ['Fishing twine supplied by the 1 kg roll, with six diameter options from 0.35 to 0.70 mm.', 'خيط صيد بلفات وزنها 1 كجم، بستة خيارات للقطر من 0.35 إلى 0.70 مم.'],
    details: ['Clear fishing twine on a dark-flanged spool, ordered by package weight. Select 0.35, 0.40, 0.45, 0.50, 0.60 or 0.70 mm. The 1 kg package does not specify a fixed line length; confirm the length for the chosen diameter when needed.', 'خيط صيد شفاف على بكرة ذات حواف داكنة، يطلب حسب وزن العبوة. اختر 0.35 أو 0.40 أو 0.45 أو 0.50 أو 0.60 أو 0.70 مم. عبوة 1 كجم لا تحدد طولاً ثابتاً للخيط؛ أكد الطول للقطر المختار عند الحاجة.'],
    applications: ['Fishing-twine supply and repeat-use line enquiries where the requirement is specified by diameter and roll weight.', 'توريد خيوط الصيد واستفسارات الخيوط للاستخدام المتكرر عند تحديد المتطلب بالقطر ووزن اللفة.'],
    selection: ['Choose the diameter and requested number of 1 kg rolls. State a required metre length separately so the quotation can confirm the corresponding package.', 'اختر القطر وعدد لفات 1 كجم المطلوبة. اذكر الطول المطلوب بالمتر بشكل منفصل ليؤكد عرض السعر العبوة المناسبة.'],
    usage: ['Unwind steadily from the spool and measure before cutting. Match the line and connections to your equipment requirements.', 'اسحب الخيط بانتظام من البكرة وقسه قبل القص. طابق الخيط ووصلاته مع متطلبات معداتك.'],
    care: ['Store the spool dry and away from heat and direct sunlight. Protect the fine line from sharp edges and check for kinks or abrasion.', 'تحفظ البكرة جافة بعيداً عن الحرارة والشمس المباشرة. احم الخيط الدقيق من الحواف الحادة وافحص الالتواءات والتآكل.'],
    question: ['How many metres are in a 1 kg roll?', 'كم متراً تحتوي لفة 1 كجم؟'],
    answer: ['A metre length is not supplied for this weight-based listing. It must be confirmed for the selected diameter rather than assumed to be the same for every option.', 'لم يحدد طول بالمتر لهذا المنتج المدرج بالوزن. يجب تأكيد الطول للقطر المختار بدلاً من افتراض تساويه لجميع الخيارات.']
  },
  7910: {
    description: ['White nylon line twine with seven ply-count choices, from 15 to 60 ply, for specifying line and tying requirements.', 'خيط نايلون أبيض بسبعة خيارات لعدد الطبقات من 15 إلى 60 طبقة لتحديد متطلبات الخيوط والربط.'],
    details: ['Choose 15, 18, 21, 24, 30, 45 or 60 ply. The photographed Star Rope sample is labelled White Nylon Twine, 210D/24 ply. The sample label describes that spool; it does not establish a denier or roll length for every ply option.', 'اختر 15 أو 18 أو 21 أو 24 أو 30 أو 45 أو 60 طبقة. عينة ستار روب المصورة تحمل وصف خيط نايلون أبيض 210D/24 طبقة. يخص ملصق العينة تلك البكرة ولا يحدد الدنيير أو طول اللفة لكل خيار.'],
    applications: ['White tying line, nylon-twine replacement and craft supply enquiries where ply count is part of the requirement.', 'استفسارات خيوط الربط البيضاء واستبدال خيوط النايلون ومستلزمات الحرف عند تحديد عدد الطبقات ضمن المتطلبات.'],
    selection: ['Choose the required ply count, state the roll length you need and add the number of spools. Ply count is not a diameter measurement.', 'اختر عدد الطبقات المطلوب واذكر طول اللفة وعدد البكرات. عدد الطبقات ليس قياساً للقطر.'],
    usage: ['Unwind only the length required, keep loose strands from tangling and check the chosen tying or fastening method with a sample.', 'اسحب الطول المطلوب فقط وتجنب تشابك الخيوط الحرة وجرب طريقة الربط أو التثبيت المختارة باستخدام عينة.'],
    care: ['Store covered on the spool to keep the white finish clean. Keep dry and away from heat, direct sunlight and sharp edges.', 'يحفظ مغطى على بكرته للحفاظ على نظافة اللون الأبيض، وفي مكان جاف بعيداً عن الحرارة والشمس المباشرة والحواف الحادة.'],
    question: ['Is 24 ply the only option shown by the listing?', 'هل 24 طبقة هو الخيار الوحيد لهذا المنتج؟'],
    answer: ['The photograph is a 24-ply sample. The listed choices are 15, 18, 21, 24, 30, 45 and 60 ply; select the required count and confirm roll length in the enquiry.', 'الصورة لعينة من 24 طبقة. الخيارات المدرجة هي 15 و18 و21 و24 و30 و45 و60 طبقة؛ اختر العدد المطلوب وأكد طول اللفة في الاستفسار.']
  },
  7911: {
    description: ['Assorted-colour nylon line twine in a 15-ply option, pictured in green, blue, red, yellow and black.', 'خيط نايلون متعدد الألوان بخيار 15 طبقة، وتظهر صورته بالأخضر والأزرق والأحمر والأصفر والأسود.'],
    details: ['A colour assortment of nylon-twine spools for coordinated tying and line requirements. The supplied specification is 15 ply. The photograph shows the reference assortment; exact shades, colour quantities and roll length are confirmed in the quotation.', 'مجموعة ألوان من بكرات خيوط النايلون لمتطلبات الربط والخيوط المتناسقة. المواصفة المرسلة هي 15 طبقة. توضح الصورة المجموعة المرجعية، وتؤكد الدرجات وكميات الألوان وطول اللفة في عرض السعر.'],
    applications: ['Colour-coordinated tying, craft work and organising bundles where a preferred colour or mixed assortment is required.', 'الربط بألوان متناسقة والأعمال الحرفية وتنظيم الحزم عند طلب لون مفضل أو مجموعة ألوان متنوعة.'],
    selection: ['Choose 15 ply and include your preferred colours, quantity per colour and required roll length. State whether a mixed assortment is acceptable.', 'اختر 15 طبقة وأضف الألوان المفضلة والكمية لكل لون وطول اللفة المطلوب. وضح ما إذا كانت مجموعة ألوان مختلطة مناسبة.'],
    usage: ['Separate spools by colour before measuring and cutting. Keep each loose end with its spool so shades remain easy to identify.', 'افصل البكرات حسب اللون قبل القياس والقص، واحتفظ بالطرف الحر مع بكرته لتسهيل تحديد الدرجات.'],
    care: ['Store covered in a dry place away from sunlight and heat. Keep different colours labelled when matching repeat orders.', 'تحفظ مغطاة في مكان جاف بعيداً عن الشمس والحرارة. ضع علامات على الألوان المختلفة عند مطابقة الطلبات المتكررة.'],
    question: ['Can I request a specific colour instead of a mixed assortment?', 'هل يمكنني طلب لون معين بدلاً من مجموعة مختلطة؟'],
    answer: ['Include the preferred colour and number of spools in the quote request. The team will confirm the exact shade and available assortment before supply.', 'أضف اللون المفضل وعدد البكرات إلى طلب عرض السعر. سيؤكد الفريق الدرجة المحددة والمجموعة المتاحة قبل التوريد.']
  },
  7912: {
    description: ['Cotton sash cord in 100 ft rolls, with 6, 8, 10 and 12 mm diameter options.', 'حبل ساش قطني بلفات طولها 100 قدم، وخيارات قطر 6 و8 و10 و12 مم.'],
    details: ['Compare four cotton sash-cord diameters in the confirmed 100 ft roll format. The supplied off-white Star Rope reference shows a 6 mm sample. Choose the diameter to match your required fit and order the number of rolls for your project.', 'قارن أربعة أقطار لحبل الساش القطني بطول اللفة المحدد 100 قدم. يوضح مرجع ستار روب الأبيض المائل للكريمي عينة بقطر 6 مم. اختر القطر المناسب للمقاس المطلوب وحدد عدد اللفات لمشروعك.'],
    applications: ['Sash-cord replacement enquiries, decorative cord work and general cotton-cord projects. Check pulley, channel or fitting compatibility for replacement work.', 'استفسارات استبدال حبال الساش والأعمال الزخرفية ومشروعات الحبال القطنية العامة. تحقق من توافق البكرات والمجاري والوصلات عند الاستبدال.'],
    selection: ['Choose 6, 8, 10 or 12 mm. All four listed options use a 100 ft roll. Check the original cord diameter and fitting clearance before requesting replacement cord.', 'اختر 6 أو 8 أو 10 أو 12 مم. طول اللفة لجميع الخيارات الأربعة 100 قدم. تحقق من قطر الحبل الأصلي ومساحة الوصلات قبل طلب حبل بديل.'],
    usage: ['Measure the required run before cutting. Check that cord passes freely through the intended guides and fittings, and confirm the attachment method for the application.', 'قس المسار المطلوب قبل القص. تحقق من مرور الحبل بحرية عبر الأدلة والوصلات المقصودة وأكد طريقة التثبيت المناسبة للاستخدام.'],
    care: ['Keep cotton cord clean and dry. Let damp cord dry fully before storage, and inspect areas that rub against guides or fittings.', 'يحفظ الحبل القطني نظيفاً وجافاً. اترك الحبل الرطب يجف تماماً قبل التخزين وافحص مناطق الاحتكاك بالأدلة أو الوصلات.'],
    question: ['What is the roll length for each diameter?', 'ما طول اللفة لكل قطر؟'],
    answer: ['The confirmed listing is 100 ft per roll for 6, 8, 10 and 12 mm. The supplied 6 mm sample photograph carries a 30 m label, approximately 98.4 ft.', 'الطول المحدد في المنتج هو 100 قدم للفة لكل من 6 و8 و10 و12 مم. تحمل صورة عينة 6 مم ملصق 30 متراً، أي نحو 98.4 قدم.']
  }
};
const unitAr = {mm:'مم',cm:'سم',m:'متر',ft:'قدم',yard:'ياردة',in:'بوصة',g:'غرام',kg:'كغ',ply:'طبقة'};
const names = {diameter:['Diameter','القطر'],width:['Width','العرض'],thickness:['Thickness','السماكة'],size:['Size','المقاس'],weight:['Package weight','وزن العبوة'],ply:['Ply count','عدد الطبقات'],enquiry:['Specification','المواصفات']};
const formatted=(v,u,ar)=>`${v}${u?' '+(ar?(unitAr[u]||u):u):''}`;
for (const p of data.products) {
  const c=p.listing_content, conf=data.configurations[p.id];
  if(!c) throw new Error(`Missing product content: ${p.id}`);
  for(const lang of ['en','ar'])c[`description_${lang}`]=p[`short_description_${lang}`]||c[`description_${lang}`]||c[`details_${lang}`];
  const update=updates[p.id];
  if(update) {
    for(const key of ['description','details','applications','selection','usage','care']) for(const [i,lang] of ['en','ar'].entries()) c[`${key}_${lang}`]=update[key][i];
    c.features_en=[update.description[0],update.selection[0],update.applications[0]];
    c.features_ar=[update.description[1],update.selection[1],update.applications[1]];
    c.faq_en=[{q:update.question[0],a:update.answer[0]}];
    c.faq_ar=[{q:update.question[1],a:update.answer[1]}];
    c.specifications=c.specifications.map(s=>s.key==='length'&&p.id===7912?{key:'length',en:'100 ft per roll',ar:'100 قدم للفة'}:s);
  }
  // Mirror selectable size/length combinations in the A+ table, without creating variants.
  const groups=new Map();
  for(const s of conf?.specifications||[]) {
    const m=s.measurements;if(m.size_value==null)continue;
    const key=JSON.stringify([s.measurement_type,m.size_value,m.size_unit]);
    if(!groups.has(key)) groups.set(key,{type:s.measurement_type,m,lengths:[]});
    if(m.length_value!=null){const v=[m.length_value,m.length_unit];if(!groups.get(key).lengths.some(l=>JSON.stringify(l)===JSON.stringify(v)))groups.get(key).lengths.push(v);}
  }
  const grouped=new Map();
  for(const g of groups.values()){const key=JSON.stringify([g.type,g.m.size_unit,g.lengths]);if(!grouped.has(key))grouped.set(key,{...g,sizes:[]});grouped.get(key).sizes.push(g.m.size_value);}
  const rows=[...grouped.values()].map((g,i)=>({key:`option_${g.type}_${i}`,en:`${(names[g.type]||names.size)[0]}: ${g.sizes.map(v=>formatted(v,g.m.size_unit,false)).join(', ')}${g.lengths.length?' · '+g.lengths.map(([v,u])=>formatted(v,u,false)).join(' / '):''}`,ar:`${(names[g.type]||names.size)[1]}: ${g.sizes.map(v=>formatted(v,g.m.size_unit,true)).join('، ')}${g.lengths.length?' · '+g.lengths.map(([v,u])=>formatted(v,u,true)).join(' / '):''}`}));
  c.specifications=c.specifications.filter(s=>!s.key.startsWith('option_'));
  c.specifications.push(...rows);
  for(const [i,lang] of ['en','ar'].entries()) {
    const specAnswer=rows.map(r=>r[lang]).join(i?'؛ ': '; ')||c.specifications.filter(s=>!['reference','family'].includes(s.key)).map(s=>s[lang]).join(i?'؛ ': '; ');
    const faq=c[`faq_${lang}`]||[];
    const q=i?'ما المواصفات المدرجة لهذا المنتج؟':'Which specifications are listed for this product?';
    const extra=[{q,a:specAnswer},{q:i?'ما المعلومات اللازمة لطلب عرض سعر؟':'What should I include in my quote request?',a:i?`حدد ${p.name_ar} والمقاس والكمية ووحدة البيع المطلوبة، وأضف اللون أو الطول إذا كانا جزءاً من طلبك. سيؤكد الفريق السعر والتوفر.`:`Specify ${p.name_en}, your measurement, quantity and selling unit. Include colour or length when relevant. The team will confirm the price and availability.`}];
    c[`faq_${lang}`]=[...faq.filter(f=>!extra.some(e=>e.q===f.q)),...extra];
    const features=c[`features_${lang}`]||[];
    if(features.length<3&&rows.length)features.push(rows[0][lang]);
    if(features.length<3)features.push(i?'ترد الخيارات والمواصفات المدرجة في الجدول أدناه.':'Compare the listed options in the specification table below.');
    c[`features_${lang}`]=features;
    // Keep the API, A+ module, cards and server-rendered page in agreement.
    p[`short_description_${lang}`]=c[`description_${lang}`]||p[`short_description_${lang}`];
    p[`details_${lang}`]=c[`details_${lang}`];
    p[`how_to_use_${lang}`]=c[`usage_${lang}`];
    p.content_sections??={};p.content_sections[lang]={description:p[`short_description_${lang}`],details:p[`details_${lang}`],how_to_use:p[`how_to_use_${lang}`],has_directions:true};
    if(update){c[`card_description_${lang}`]=update.description[i];p[`card_description_${lang}`]=update.description[i];p[`seo_description_${lang}`]=update.description[i]+(i?' اطلب عرض سعر من نجمي هاردوير في الكويت.':' Request a quote from Najmi Hardware Kuwait.');}
  }
  c.version='A_PLUS_COMPLETE_20261111';
}
fs.writeFileSync(file,JSON.stringify(data));
console.log(`Completed bilingual A+ content for ${data.products.length} products.`);
