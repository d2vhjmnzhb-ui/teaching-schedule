/* Document drafts have a dedicated store; no timetable or textbook writes. */
(()=>{'use strict';
const KEY='college_document_drafts_v1', $=id=>document.getElementById(id), fields=['number','date','agency','phone','subject','recipient','reference','attachments','signer','position','body','notes','department','division','font','digits','closing','salutation','address','reviewer','reviewerPosition','deputy','deputyPosition','director','directorPosition','opinions','table','enclosures','fontSize','extraSigners','signatureAlign','signerLayout','positionShort','purpose','paragraphStyles','memoTemplate','planHead','planHeadPosition','planCurriculum','planCurriculumPosition','planDeputy','planDeputyPosition'];
let drafts=[],current=null,dirty=false,readFailed=false;
try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(raw))throw Error();drafts=raw;}catch(e){readFailed=true;alert('อ่านข้อมูลฉบับร่างไม่ได้ ระบบจะไม่เขียนทับข้อมูลเดิม กรุณาเก็บข้อมูลเบราว์เซอร์ไว้');}
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=t=>t==='internal'?'หนังสือภายใน':'หนังสือภายนอก';
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'doc'+Date.now()+Math.random().toString(36).slice(2);
function persist(next){if(readFailed){alert('ข้อมูลเดิมอ่านไม่ได้ จึงไม่สามารถบันทึกทับได้');return false;}try{localStorage.setItem(KEY,JSON.stringify(next));drafts=next;return true;}catch(e){alert('บันทึกไม่สำเร็จ พื้นที่จัดเก็บอาจเต็ม กรุณาสำรองข้อมูล');return false;}}
function render(){const q=$('docSearch').value.trim().toLowerCase(),type=$('docFilter').value;const rows=drafts.filter(d=>(type==='all'||d.type===type)&&[d.subject,d.number,d.recipient].join(' ').toLowerCase().includes(q)).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));$('docList').innerHTML=rows.length?'<table><thead><tr><th>ประเภท</th><th>เลขหนังสือ</th><th>เรื่อง / ผู้รับ</th><th>แก้ไขล่าสุด</th><th>จัดการ</th></tr></thead><tbody>'+rows.map(d=>`<tr><td>${label(d.type)}</td><td>${esc(d.number)||'—'}</td><td><b>${esc(d.subject)}</b><br>${esc(d.recipient)}</td><td>${esc(new Date(d.updatedAt).toLocaleString('th-TH'))}</td><td><button class="btn light" data-edit="${esc(d.id)}">เปิด / แก้ไข</button> <button class="btn light" data-copy="${esc(d.id)}">ทำสำเนา</button> <button class="btn light" data-delete="${esc(d.id)}">ลบ</button></td></tr>`).join('')+'</tbody></table>':'<p class="muted">ยังไม่มีฉบับร่างที่ตรงกับรายการนี้</p>';}
function leave(){return !dirty||confirm('มีข้อมูลที่ยังไม่ได้บันทึก ต้องการทิ้งการแก้ไขหรือไม่?');}
function open(d){if(!leave())return;if(!['TH Sarabun New','TH SarabunIT๙','TH SarabunPSK'].includes(d.font))d={...d,font:'TH Sarabun New',fontSize:'16'};d={...d,signatureAlign:'right',directorPosition:d.directorPosition||'ผู้อำนวยการวิทยาลัยเทคนิคปากช่อง',deputyPosition:d.deputyPosition||('รองผู้อำนวยการ'+(d.division||'ฝ่ายบริหารทรัพยากร'))};current={...d};fields.forEach(k=>{const el=$('doc_'+k);if(el)el.value=d[k]||({font:'TH Sarabun New',digits:'thai',enclosures:'[]',fontSize:'16',extraSigners:'[]',signatureAlign:'right',signerLayout:'stack',purpose:'approve'}[k]||'');});$('docEditorTitle').textContent=label(d.type)+' • ฉบับร่าง';$('docPrint').textContent=d.type==='external'?'พิมพ์ 3 ชุด / บันทึก PDF':'พิมพ์ / บันทึก PDF';if($('docPrintTop'))$('docPrintTop').textContent=$('docPrint').textContent;$('docEditor').hidden=false;$('docStatus').textContent='กรอกข้อมูลแล้วกดบันทึกฉบับร่าง';dirty=false;syncCollegeMemo();syncSimpleForm();renderExtraSigners();refreshPreview();$('docEditor').scrollIntoView({behavior:'smooth',block:'start'});}
function fresh(type){const now=new Date();open({id:uuid(),type,date:`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`,...defaults(),signatureAlign:'right',agency:'วิทยาลัยเทคนิคปากช่อง',recipient:type==='internal'?'ผู้อำนวยการวิทยาลัยเทคนิคปากช่อง':'',closing:type==='internal'?'จึงเรียนมาเพื่อโปรดพิจารณาอนุญาต':'จึงเรียนมาเพื่อโปรดพิจารณา',salutation:type==='external'?'ขอแสดงความนับถือ':''});}
$('docNewInternal').onclick=()=>fresh('internal');$('docNewExternal').onclick=()=>fresh('external');
$('docForm').oninput=event=>{if(event.target.dataset.format)return;if(event.target.id==='doc_body')renderParagraphControls();dirty=true;refreshPreview();$('docStatus').textContent='มีการแก้ไขที่ยังไม่ได้บันทึก';};
$('docForm').onsubmit=e=>{e.preventDefault();saveDraft();};
$('docClose').onclick=()=>{if(leave()){dirty=false;current=null;$('docEditor').hidden=true;}};
$('docSearch').oninput=render;$('docFilter').onchange=render;
$('docList').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.edit||b.dataset.copy||b.dataset.delete,d=drafts.find(x=>x.id===id);if(!d)return;if(b.dataset.edit)open(d);else if(b.dataset.copy)open({...d,id:uuid(),number:'',subject:d.subject+' (สำเนา)',createdAt:null});else if(confirm('ลบฉบับร่าง “'+d.subject+'” หรือไม่?')){if(current?.id===id&&!leave())return;if(persist(drafts.filter(x=>x.id!==id))){if(current?.id===id){dirty=false;current=null;$('docEditor').hidden=true;}render();}}};
$('docBackup').onclick=()=>{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify({format:KEY,drafts},null,2)],{type:'application/json'}));a.href=u;a.download='college-document-drafts.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
$('docRestore').onclick=()=>$('docImport').click();
$('docImport').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>10*1024*1024)throw Error();const data=JSON.parse(await f.text());if(data.format!==KEY||!Array.isArray(data.drafts)||data.drafts.some(d=>!d||!['internal','external'].includes(d.type)||typeof d.subject!=='string'||fields.some(k=>d[k]!=null&&typeof d[k]!=='string')))throw Error();if(!data.drafts.length){alert('ไฟล์นี้ไม่มีฉบับร่าง');return;}if(!confirm('นำเข้า '+data.drafts.length+' ฉบับเป็นสำเนาใหม่ โดยเก็บรายการเดิมไว้หรือไม่?'))return;const now=new Date().toISOString();const imported=data.drafts.map(d=>Object.assign(Object.fromEntries(fields.map(k=>[k,d[k]||''])),{id:uuid(),type:d.type,createdAt:now,updatedAt:now}));if(persist([...drafts,...imported])){render();alert('นำเข้าฉบับร่างเรียบร้อยแล้ว');}}catch(e){alert('นำเข้าไม่ได้ กรุณาเลือกไฟล์สำรองฉบับร่างที่ถูกต้อง ขนาดไม่เกิน 10 MB');}finally{$('docImport').value='';}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
document.getElementById('nav').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b&&document.getElementById('documentsPage').classList.contains('active')&&b.dataset.page!=='documentsPage'&&!leave()){e.preventDefault();e.stopImmediatePropagation();}},true);
const EXTRA=['department','division','font','digits','closing','salutation','address','reviewer','reviewerPosition','deputy','deputyPosition','director','directorPosition','opinions','table','enclosures','fontSize','extraSigners','signatureAlign','signerLayout','positionShort','purpose'];
function defaults(){let d={};try{d=JSON.parse(localStorage.getItem('college_doc_defaults_v68')||'{}')}catch{}return {...d,director:d.director||(typeof state!=='undefined'?state.signers?.director||'':''),deputyPosition:d.deputyPosition||'รองผู้อำนวยการฝ่ายบริหารทรัพยากร',directorPosition:d.directorPosition||'ผู้อำนวยการวิทยาลัยเทคนิคปากช่อง',font:['TH Sarabun New','TH SarabunIT๙','TH SarabunPSK'].includes(d.font)?d.font:'TH Sarabun New',digits:d.digits||'thai',enclosures:'[]',fontSize:d.font==='Sarabun'?'16':(d.fontSize||'16'),extraSigners:d.extraSigners||'[]',signatureAlign:'right',signerLayout:d.signerLayout||'stack',purpose:'approve'};}
function val(k){return $('doc_'+k)?.value||'';}
function collect(){return Object.fromEntries(fields.map(k=>[k,val(k)]));}
function input(k,t,area=false){return `<label>${t}<${area?'textarea':'input'} id="doc_${k}"${area?'':' type="text"'}>${area?'</textarea>':''}</label>`;}
const attachmentTemplates={minutes:{name:'รายงานการประชุม',text:'รายงานการประชุม [ชื่อคณะ/งาน]\nครั้งที่ [ครั้ง/ปี]\nเมื่อ [วัน เดือน ปี]\nณ [สถานที่]\n\nผู้มาประชุม\n[ชื่อ–ตำแหน่ง]\nผู้ไม่มาประชุม\n[ชื่อ–ตำแหน่ง–เหตุผล]\nผู้เข้าร่วมประชุม\n[ชื่อ–ตำแหน่ง]\nเริ่มประชุมเวลา [เวลา]\n\nระเบียบวาระที่ 1 เรื่องที่ประธานแจ้งให้ที่ประชุมทราบ\n[รายละเอียด]\nมติที่ประชุม [มติ]\n\nระเบียบวาระที่ 2 รับรองรายงานการประชุม\n[รายละเอียดและมติ]\n\nระเบียบวาระที่ 3 เรื่องสืบเนื่อง\n[รายละเอียดและมติ]\n\nระเบียบวาระที่ 4 เรื่องเสนอเพื่อพิจารณา\n[รายละเอียดและมติ]\n\nระเบียบวาระที่ 5 เรื่องอื่น ๆ\n[รายละเอียดและมติ]\n\nเลิกประชุมเวลา [เวลา]\n\nลงชื่อ ................................ ผู้จดรายงานการประชุม\n([ชื่อ])'},agenda:{name:'ระเบียบวาระการประชุม',text:'ระเบียบวาระการประชุม [ชื่อการประชุม]\nครั้งที่ [ครั้ง/ปี]\nวันที่ [วัน เดือน ปี] เวลา [เวลา]\nณ [สถานที่]\n\nระเบียบวาระที่ 1 เรื่องที่ประธานแจ้งให้ที่ประชุมทราบ\nระเบียบวาระที่ 2 รับรองรายงานการประชุม\nระเบียบวาระที่ 3 เรื่องสืบเนื่อง\nระเบียบวาระที่ 4 เรื่องเสนอเพื่อพิจารณา\nระเบียบวาระที่ 5 เรื่องอื่น ๆ'},attendance:{name:'บัญชีลงชื่อผู้เข้าร่วม',text:'บัญชีลงชื่อผู้เข้าร่วม [กิจกรรม]\nวันที่ [วัน เดือน ปี] ณ [สถานที่]',table:'ลำดับ | ชื่อ–สกุล | ตำแหน่ง/หน่วยงาน | ลายมือชื่อ\n1 | | |\n2 | | |\n3 | | |'},schedule:{name:'กำหนดการ',text:'กำหนดการ [กิจกรรม]\nวันที่ [วัน เดือน ปี]\nณ [สถานที่]',table:'เวลา | กิจกรรม | ผู้รับผิดชอบ\n[เวลา] | [กิจกรรม] | [ชื่อ]'},report:{name:'รายงานผลการดำเนินงาน',text:'รายงานผลการดำเนินงาน [ชื่อโครงการ]\n1. หลักการและเหตุผล\n[รายละเอียด]\n2. วัตถุประสงค์\n[รายละเอียด]\n3. วัน เวลา และสถานที่\n[รายละเอียด]\n4. ผลการดำเนินงาน\n[ผลที่เกิดขึ้นจริง]\n5. ปัญหาและข้อเสนอแนะ\n[รายละเอียด]',table:'ตัวชี้วัด | เป้าหมาย | ผลจริง\n[ตัวชี้วัด] | [เป้าหมาย] | [ผลจริง]'},budget:{name:'รายละเอียดค่าใช้จ่าย',text:'รายละเอียดค่าใช้จ่าย [กิจกรรม]\n[หน่วยงาน/วันที่]',table:'ลำดับ | รายการ | จำนวน | หน่วย | ราคาต่อหน่วย | รวม\n1 | [รายการ] | | | |\n | รวมทั้งสิ้น | | | |'}};
function initStudio(){
const top=$('documentsPage').firstElementChild;top.classList.add('studioHero');top.insertAdjacentHTML('afterbegin','<div class="eyebrow">PAK CHONG • DOCUMENT STUDIO</div>');
$('docForm').insertAdjacentHTML('afterbegin',`<div class="studioSteps">01 ข้อมูลหนังสือ <span>→</span> 02 เนื้อหาและเอกสารแนบ <span>→</span> 03 ตรวจและพิมพ์</div><div class="grid">${input('department','งาน / แผนก')}${input('division','ฝ่าย')}<label>ฟอนต์<select id="doc_font"><option>TH Sarabun New</option><option>TH SarabunPSK</option><option value="TH SarabunIT๙">TH SarabunIT๙</option></select></label><label>ขนาดตัวอักษร<select id="doc_fontSize"><option value="14">14 pt</option><option value="15">15 pt</option><option value="16">16 pt</option></select></label><label>ตัวเลข<select id="doc_digits"><option value="thai">เลขไทย ๑๒๓</option><option value="arabic">เลขอารบิก 123</option></select></label></div>`);
$('doc_number').placeholder='เว้นว่างสำหรับลงเลขภายหลัง';
$('doc_body').insertAdjacentHTML('beforebegin',`<div class="actions"><select id="doc_purpose"><option value="approve">ขออนุญาต / ขออนุมัติ</option><option value="inform">รายงานเพื่อทราบ</option><option value="invite">เชิญประชุม</option><option value="cooperate">ขอความอนุเคราะห์</option></select><button type="button" class="btn light" id="applyPurpose">ใส่โครงร่าง</button><button type="button" class="btn primary" id="docAI">คัดลอกคำสั่ง + เปิด AI</button></div><p class="muted">วางเฉพาะเนื้อหาหนังสือด้านล่าง แยกย่อหน้าด้วยบรรทัดว่าง • ไม่ต้องใส่หัวหนังสือหรือชื่อผู้ลงนามซ้ำ</p>`);
$('doc_body').parentElement.insertAdjacentHTML('afterend',`<div class="grid">${input('closing','ประโยคลงท้าย (แก้ได้ตามวัตถุประสงค์)')}${input('salutation','คำลงท้ายหนังสือภายนอก')}${input('address','ที่อยู่หน่วยงาน (หนังสือภายนอก)',true)}</div><details><summary>ตารางในหนังสือ</summary><p class="muted">คั่นคอลัมน์ด้วย | หรือวางตารางที่คัดลอกจาก Excel (แท็บ) • บรรทัดแรกเป็นหัวตาราง</p>${input('table','ข้อมูลตาราง',true)}<button type="button" class="btn light" id="sampleTable">ใส่ตารางตัวอย่าง</button></details><details><summary>ผู้ผ่านงานและความเห็นผู้บริหาร</summary><div class="grid">${input('reviewer','ผู้ผ่านงาน / หัวหน้างาน')}${input('reviewerPosition','ตำแหน่งผู้ผ่านงาน')}${input('deputy','ชื่อรองผู้อำนวยการ')}${input('deputyPosition','ตำแหน่งรองผู้อำนวยการ')}${input('director','ชื่อผู้อำนวยการ')}${input('directorPosition','ตำแหน่งผู้อำนวยการ')}<label>ช่องความเห็น<select id="doc_opinions"><option value="">ไม่แสดง</option><option value="yes">แสดงตามแบบวิทยาลัย</option></select></label></div></details><details><summary>เอกสารแนบท้าย • เลือกได้หลายฉบับ</summary><div class="actions"><select id="attachmentType">${Object.entries(attachmentTemplates).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('')}</select><button type="button" class="btn light" id="addAttachment">+ เพิ่มเอกสารแนบ</button></div><input id="doc_enclosures" type="hidden" value="[]"><div id="attachmentEditors"></div></details><div class="actions"><button type="button" class="btn light" id="saveDocDefaults">จำข้อมูลหน่วยงานและผู้ลงนาม</button><button type="button" class="btn ok" id="docPdf">บันทึก PDF</button><button type="button" class="btn primary" id="docPrint">พิมพ์</button></div><p class="muted">TH Sarabun New และ TH SarabunIT๙ แนบไฟล์ฟอนต์ไว้ในระบบ • ตรวจชื่อ ตำแหน่ง และคำลงท้ายก่อนออกหนังสือ</p>`);
$('docEditor').insertAdjacentHTML('beforeend','<h3>ตัวอย่างหน้าพิมพ์ A4</h3><div id="paperWarning" role="status"></div><div id="docPreview"></div><details><summary>แนวทางรูปแบบที่ใช้</summary><p>โครงสร้างหนังสือภายใน หนังสือภายนอก และรายงานการประชุมอิงระเบียบงานสารบรรณ ส่วนความเห็นผู้บริหารอิงตัวอย่างวิทยาลัย เทมเพลตเอกสารแนบอื่นเป็นแบบใช้งานที่ปรับได้</p><a href="https://prt.parliament.go.th/items/a2d8d8b1-3702-4fcb-afa1-c1729e6f2e11" target="_blank" rel="noopener">ระเบียบและแบบท้ายระเบียบ (รัฐสภา)</a></details>');
$('saveDocDefaults').onclick=()=>{const d=collect();const keys=['agency','phone','department','division','address','signer','position','reviewer','reviewerPosition','deputy','deputyPosition','director','directorPosition','opinions','font','digits','fontSize','extraSigners','signatureAlign','signerLayout','positionShort'];try{localStorage.setItem('college_doc_defaults_v68',JSON.stringify(Object.fromEntries(keys.map(k=>[k,d[k]]))));$('docStatus').textContent='จำข้อมูลสำหรับหนังสือฉบับใหม่แล้ว'}catch{alert('บันทึกค่าเริ่มต้นไม่สำเร็จ')}};
$('sampleTable').onclick=()=>{if(val('table')&&!confirm('แทนข้อมูลตารางเดิมหรือไม่?'))return;$('doc_table').value='ลำดับ | รายการ | จำนวน | หมายเหตุ\n1 | [รายการ] | [จำนวน] |';changed()};
$('applyPurpose').onclick=()=>{if(val('body')&&!confirm('แทนเนื้อหาเดิมด้วยโครงร่างหรือไม่?'))return;const p=$('doc_purpose').value;const closing={approve:'จึงเรียนมาเพื่อโปรดพิจารณาอนุญาต',inform:'จึงเรียนมาเพื่อโปรดทราบ',invite:'จึงเรียนมาเพื่อโปรดเข้าร่วมประชุมตามวัน เวลา และสถานที่ดังกล่าว',cooperate:'จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์'};$('doc_closing').value=closing[p];$('doc_body').value=p==='invite'?'ด้วย [หน่วยงาน] กำหนดจัดประชุม [เรื่อง] เพื่อ [วัตถุประสงค์]\n\nในการนี้ จึงขอเชิญท่านเข้าร่วมประชุมในวันที่ [วันที่] เวลา [เวลา] ณ [สถานที่] ตามระเบียบวาระการประชุมที่แนบมาพร้อมนี้':'ด้วย '+[val('department'),val('division'),val('agency')].filter(Boolean).join(' ')+' [ความเป็นมาและเหตุผล]\n\nในการนี้ [รายละเอียดการดำเนินงาน วัน เวลา สถานที่ และสิ่งที่เสนอ]';changed()};
$('addAttachment').onclick=()=>{const list=enclosures();const t=attachmentTemplates[$('attachmentType').value];list.push({title:t.name,body:t.text,table:t.table||''});$('doc_enclosures').value=JSON.stringify(list);changed()};
$('attachmentEditors').oninput=e=>{const i=+e.target.dataset.index,k=e.target.dataset.field;if(!k)return;const list=enclosures();list[i][k]=e.target.value;$('doc_enclosures').value=JSON.stringify(list);dirty=true;renderPaper();};
$('attachmentEditors').onclick=e=>{const b=e.target.closest('[data-remove]');if(!b)return;const list=enclosures();list.splice(+b.dataset.remove,1);$('doc_enclosures').value=JSON.stringify(list);changed()};
$('docAI').onclick=async()=>{const d=collect();const prompt=`ช่วยร่าง${label(current.type)}ของ${d.agency} เรื่อง ${d.subject||'[ระบุเรื่อง]'}\nเรียน ${d.recipient}\nงาน ${d.department} ฝ่าย ${d.division}\nข้อมูลที่มี: ${d.body}\nประโยคลงท้ายที่ต้องการ: ${d.closing}\nขอเฉพาะเนื้อหา 2–3 ย่อหน้า ไม่รวมส่วนหัว ประโยคลงท้าย และลายเซ็น ไม่แต่งข้อเท็จจริง ตัวเลข หรือข้อกฎหมายที่ไม่ได้ให้ ถ้าขาดข้อมูลใช้ [ระบุข้อมูล] ใช้ภาษาราชการเหมาะสม ไม่ใช้ Markdown ถ้ามีตารางคั่นด้วย | แยกไว้ท้ายคำตอบ เพื่อคัดลอกลงช่องตาราง`;const w=window.open('https://chatgpt.com/','_blank');try{await navigator.clipboard.writeText(prompt);$('docStatus').textContent='คัดลอกคำสั่งแล้ว ให้วางใน AI แล้วนำคำตอบมาวางในช่องเนื้อหา'+(!w?' • หากหน้าต่างไม่เปิด ให้เปิด chatgpt.com เอง':'')}catch{window.prompt('คัดลอกคำสั่งนี้ไปวางใน AI',prompt)}};
$('docPrint').onclick=printDocument; $('docPdf').onclick=printDocument;
let titleBeforePrint=null;
/* v94: โมดูลตารางเรียนมี @page แนวนอน/ขอบ 4-7 มม. ที่ทับหนังสือ ทำให้พิมพ์เป็นแนวนอนและเบราว์เซอร์พิมพ์ชื่อหน้า/วันที่
   จึงใส่ @page ของเอกสารไว้ท้ายสุดตอนพิมพ์ (ขอบกระดาษ 0 แล้วใช้ padding ของแผ่นแทน) */
const DOC_PRINT_CSS='@page{size:A4 portrait;margin:0}html,body.printing-doc{margin:0!important;padding:0!important;background:#fff!important}body.printing-doc #documentsPage,body.printing-doc #docEditor{margin:0!important;padding:0!important;min-height:0!important;height:auto!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#fff!important}body.printing-doc #docPreview{width:210mm!important;max-width:none!important;margin:0!important;padding:0!important;zoom:1!important;transform:none!important}body.printing-doc .docPaper{page:auto!important;width:210mm!important;min-height:297mm!important;margin:0!important;box-sizing:border-box!important;zoom:1!important;transform:none!important;box-shadow:none!important}body.printing-doc .docPaper.internalPaper{padding:25.01mm 22.47mm 25.40mm 27.52mm!important}body.printing-doc .docPaper.externalPaper{padding:15mm 20mm 20mm 30mm!important}body.printing-doc .docPaper.externalPaper{padding-top:15mm!important}body.printing-doc .docPaper.lessonPlanPaper{padding-top:12mm!important}body.printing-doc .docPaper.appendix{padding:25mm 20mm 20mm 30mm!important}';
window.addEventListener('beforeprint',()=>{if($('documentsPage').classList.contains('active')&&current){document.body.classList.add('printing-doc');document.getElementById('docPrintPageCss')?.remove();const st=document.createElement('style');st.id='docPrintPageCss';st.media='print';st.textContent=DOC_PRINT_CSS;document.documentElement.appendChild(st);if(titleBeforePrint===null){titleBeforePrint=document.title;document.title=fileTitle();}}});
window.addEventListener('afterprint',()=>{document.body.classList.remove('printing-doc');document.getElementById('docPrintPageCss')?.remove();if(titleBeforePrint!==null){document.title=titleBeforePrint;titleBeforePrint=null;}});
window.addEventListener('resize',()=>{fitLines($('docPreview'));fitPaper()});
if(document.fonts)document.fonts.addEventListener('loadingdone',()=>{fitLines($('docPreview'));fitPaper()});
if(document.fonts)document.fonts.ready.then(()=>{fitLines($('docPreview'));fitPaper()});
if(window.ResizeObserver)new ResizeObserver(fitPaper).observe($('docPreview'));
}
function fitPaper(){const preview=$('docPreview');if(!preview||!preview.clientWidth)return;const width=preview.clientWidth-32;const scale=Math.min(1,Math.max(.25,width/(210*96/25.4)));preview.querySelectorAll('.docPaper').forEach(p=>p.style.zoom=scale);}
function toast(msg,bad){
 let t=$('docToast');if(!t){t=document.createElement('div');t.id='docToast';t.setAttribute('role','status');document.body.appendChild(t);}
 t.textContent=msg;t.className=bad?'bad show':'show';clearTimeout(t._h);t._h=setTimeout(()=>{t.className=bad?'bad':'';},bad?7000:2800);
}
function flashSave(){
 document.querySelectorAll('#docForm button[type=submit],#docSaveTop').forEach(b=>{if(!b.dataset.t)b.dataset.t=b.textContent;b.textContent='บันทึกแล้ว ✓';clearTimeout(b._f);b._f=setTimeout(()=>{b.textContent=b.dataset.t;},2200);});
}
function saveFailed(msg,d){
 $('docStatus').textContent=msg;toast(msg,true);
 try{if(d){const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify({format:KEY,drafts:[d]},null,2)],{type:'application/json'}));a.href=u;a.download='draft-'+fileTitle()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}}catch(e){}
}
function saveDraft(){
 if(!current){toast('ยังไม่ได้เปิดแบบร่าง',true);return false;}
 let d=null;
 try{
  d={...current};fields.forEach(k=>{const el=$('doc_'+k);d[k]=el?String(el.value||'').trim():String(d[k]||'');});
  d.updatedAt=new Date().toISOString();d.createdAt=d.createdAt||d.updatedAt;
  if(!persist([...drafts.filter(x=>x.id!==d.id),d])){saveFailed('บันทึกไม่สำเร็จ ระบบดาวน์โหลดไฟล์สำรองของฉบับนี้ให้แล้ว',d);return false;}
  const back=JSON.parse(localStorage.getItem(KEY)||'[]');
  if(!back.some(x=>x.id===d.id&&x.updatedAt===d.updatedAt))throw new Error('อ่านกลับไม่พบข้อมูลที่เพิ่งบันทึก');
  current=d;dirty=false;
  try{render();}catch(e){console.error(e);}
  const time=new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
  $('docStatus').textContent='บันทึกฉบับร่างเรียบร้อยแล้ว';toast('บันทึกฉบับร่างเรียบร้อยแล้ว ✓ ('+time+')');flashSave();
  return true;
 }catch(error){console.error(error);saveFailed('บันทึกไม่สำเร็จ: '+(error&&error.message||error),d);return false;}
}
function initTopActions(){/* v100: removed duplicate Save/PDF/Print controls; one action set remains in the editor. */}
function fileTitle(){
 /* ชื่อไฟล์ PDF = ชื่อเรื่องของหนังสือ (ตัดอักขระที่ใช้เป็นชื่อไฟล์ไม่ได้) */
 const t=String(val('subject')||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/[\\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim().replace(/^\.+/,'').slice(0,120).trim();
 return t||'หนังสือราชการ';
}
function popupBoot(){
 /* ฟังก์ชันนี้ถูกฝังไปรันในหน้าต่างพิมพ์เอง ไม่พึ่งหน้าหลัก (iPad พักหน้าหลักไว้เบื้องหลังเมื่อเปิดแท็บใหม่) */
 var btn=document.getElementById('printReadyButton'),st=document.getElementById('printStatus');
 var download=document.getElementById('downloadDocumentPdf');if(download)download.onclick=function(){layout();window.downloadCollegePdf(document.title);};
 var ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 var inFrame=window.self!==window.top;
 function say(t){if(st)st.textContent=t;}
 function layout(){try{fitLines(document);ruleMemoLines(document);positionDraftChecks(document);}catch(e){console.error(e);}}
 function doPrint(){layout();try{window.focus();window.print();}catch(e){say('เปิดหน้าพิมพ์ไม่สำเร็จ: '+(e&&e.message||e));}}
 if(btn)btn.addEventListener('click',doPrint);
 window.addEventListener('beforeprint',layout);
 function wait(ms){return new Promise(function(r){setTimeout(r,ms);});}
 (async function(){
  var fontsOk=true;
  try{await Promise.race([ensurePaperFonts(document),wait(8000).then(function(){throw new Error('timeout');})]);}catch(e){fontsOk=false;}
  try{await Promise.race([Promise.all(Array.prototype.map.call(document.images,function(i){return i.decode?i.decode().catch(function(){}):Promise.resolve();})),wait(3000)]);}catch(e){}
  layout();
  say(fontsOk?(ios?'พร้อมแล้ว แตะปุ่มด้านบนเพื่อพิมพ์ / บันทึก PDF':'พร้อมพิมพ์'):'โหลดฟอนต์เอกสารไม่ครบ ตัวอักษรอาจไม่ตรงแบบ (ตรวจว่าอัปโหลดโฟลเดอร์ fonts ครบ) แตะปุ่มด้านบนหากต้องการพิมพ์ต่อ');
  if(btn)btn.disabled=false;
  if(fontsOk&&inFrame)setTimeout(doPrint,50);
 })();
}
function buildPrintHtml(title){
 const base=new URL('.',location.href).href,copy=$('docPreview').cloneNode(true);copy.querySelectorAll('.docPaper').forEach(p=>p.style.removeProperty('zoom'));
 if(current?.type==='external'){
  const pages=[...copy.children];copy.replaceChildren();
  ['working','original','copy'].forEach(kind=>{pages.forEach((page,index)=>{const clone=page.cloneNode(true);clone.dataset.printSet=kind;
   if(index===0&&kind==='working'){clone.classList.add('workingLetter');clone.insertAdjacentHTML('beforeend','<div class="draftChecks"><span>ร่าง................</span><span>พิมพ์................</span><span>ตรวจ................</span></div>')}
   if(index===0&&kind==='copy'){const head=clone.querySelector('.externalHead');if(head)head.innerHTML='<div class="copyHeading">สำเนา</div>'}
   copy.appendChild(clone);
  });});
 }
 const code=[fitSignatureDots,fitLines,ruleMemoLines,positionDraftChecks,ensurePaperFonts,popupBoot].map(f=>f.toString()).join('\n')+'\npopupBoot();';
 const hint='iPad: แตะปุ่ม → เลือก “พิมพ์” → บีบนิ้วขยายตัวอย่างหน้า → แตะปุ่มแชร์ → “บันทึกลงไฟล์”';
 return '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="'+esc(base)+'"><title>'+esc(title)+'</title><script src="vendor/html2canvas.min.js"></script><script src="vendor/pdf-lib.min.js"></script><script src="document-pdf.js?v=100"></script><link rel="stylesheet" href="document-paper.css?v=100"></head><body class="document-only"><div class="printTools"><button id="downloadDocumentPdf" type="button">ดาวน์โหลด PDF</button><button id="printReadyButton">พิมพ์ / บันทึก PDF</button><p id="printStatus" role="status">กำลังเตรียมฟอนต์…</p><p>เลือก A4 ขนาด 100% และปิดหัว/ท้ายของเบราว์เซอร์</p><p>ชื่อไฟล์ที่ใช้บันทึก: '+esc(title)+'.pdf</p><p>'+esc(hint)+'</p></div>'+copy.outerHTML+'<script>'+code.replace(/<\/script/gi,'<\\/script')+'<\/script></body></html>';
}
function printInFrame(html,title){
 /* ทางสำรองเมื่อเบราว์เซอร์บล็อกป๊อปอัป: พิมพ์จากเฟรมซ่อนในหน้าเดิม ชื่อไฟล์ใช้ชื่อหน้าเว็บชั่วคราว */
 const frame=document.createElement('iframe'),previous=document.title;
 frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0';
 document.body.appendChild(frame);
 const w=frame.contentWindow;w.document.open();w.document.write(html);w.document.close();
 document.title=title;
 const done=()=>{document.title=previous;frame.remove();};
 w.addEventListener('afterprint',done,{once:true});
 setTimeout(done,600000);
}
function printDocument(){
renderPaper();fitLines($('docPreview'));
const title=fileTitle(),html=buildPrintHtml(title),w=window.open('','_blank');
if(!w){printInFrame(html,title);return;}
w.document.open();w.document.write(html);w.document.close();
}
function positionDraftChecks(doc){doc.querySelectorAll('.draftChecks').forEach(footer=>{footer.style.marginTop='12mm';const paper=footer.closest('.docPaper'),win=doc.defaultView,style=win.getComputedStyle(paper),contentTop=paper.getBoundingClientRect().top+parseFloat(style.paddingTop),used=footer.getBoundingClientRect().top-contentTop,footerHeight=footer.getBoundingClientRect().height,area=262*96/25.4;if(used+footerHeight<area)footer.style.marginTop=(12*96/25.4+area-used-footerHeight-2)+'px';});}
function changed(){dirty=true;refreshPreview();$('docStatus').textContent='มีการแก้ไขที่ยังไม่ได้บันทึก'}
function enclosures(){try{const a=JSON.parse(val('enclosures')||'[]');return Array.isArray(a)?a.filter(x=>x&&typeof x==='object').map(x=>({title:String(x.title||''),body:String(x.body||''),table:String(x.table||'')})):[]}catch{return []}}
function refreshPreview(){if(!$('docPreview'))return;if(!$('paragraphControls')?.contains(document.activeElement))renderParagraphControls();const active=document.activeElement;if(!$('attachmentEditors').contains(active))$('attachmentEditors').innerHTML=enclosures().map((a,i)=>`<div class="attachmentCard"><div class="actions"><b>เอกสารแนบ ${i+1}</b><button type="button" class="btn light" data-remove="${i}">ลบ</button></div>${['title','body','table'].map((k)=>`<label>${{title:'ชื่อเอกสาร',body:'เนื้อหา',table:'ตาราง (ถ้ามี)'}[k]}<textarea data-index="${i}" data-field="${k}">${esc(a[k])}</textarea></label>`).join('')}</div>`).join('');renderPaper()}
function renderPaper(){
const d=collect(),thai=d.digits==='thai'||d.font==='TH SarabunIT๙',n=s=>String(s??'').replace(/[๐-๙]/g,c=>String('๐๑๒๓๔๕๖๗๘๙'.indexOf(c))).replace(/[0-9]/g,c=>thai?'๐๑๒๓๔๕๖๗๘๙'[+c]:c),e=s=>esc(n(s));
const paras=(s,flow=false,editable=false)=>String(s||'').replace(/\r\n?/g,'\n').split(editable?/\n+/:flow?/\n[ \t]*\n+/:/\n/).filter(x=>x.trim()).map((p,i)=>`<p${editable?paragraphStyle(i):''}>${e(flow?p.replace(/\n/g,' ').replace(/[ \t]+/g,' ').trim():p.trim())}</p>`).join('');
const table=s=>{if(!s.trim())return '';const rows=s.trim().split('\n').filter(x=>!/^\s*\|?\s*:?-{3}/.test(x)).map(x=>x.replace(/^\||\|$/g,'').split(/\t|\|/));return '<table class="paperTable"><thead><tr>'+rows[0].map(x=>'<th>'+e(x.trim())+'</th>').join('')+'</tr></thead><tbody>'+rows.slice(1).map(r=>'<tr>'+r.map(x=>'<td>'+e(x.trim())+'</td>').join('')+'</tr>').join('')+'</tbody></table>'};
let date='';if(d.date){const parts=d.date.split('-').map(Number);if(parts.length===3)date=`${parts[2]} ${['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'][parts[1]-1]} ${parts[0]+543}`;}
const signature=(name,pos,short='')=>`<div class="signature"><div class="signatureSpace">${signatureDots()}</div><div class="fitLine"><span>(${e(name)||signatureDots('signatureNameDots')})</span></div><div class="fitLine positionLine"><span>${e(short||pos)}</span></div></div>`;
let head=current?.type==='external'?`<div class="externalHead"><img src="garuda.png" alt="ตราครุฑ"></div><div class="letterRow"><span>ที่ ${e(d.number)||'........................'}</span><span>${e(d.agency)}<br>${e(d.address)}</span></div><p class="dateExternal">${e(date)}</p><p>เรื่อง ${e(d.subject)}</p>`:`<div class="memoHead"><img src="garuda.png" alt="ตราครุฑ"><h1>บันทึกข้อความ</h1></div><div class="memoLine agencyLine fitLine"><span><b>ส่วนราชการ</b> ${e(d.memoTemplate==='lessonPlan'?[d.agency,[d.department,d.division].filter(Boolean).length?'('+[d.department,d.division].filter(Boolean).join('  ')+')':''].filter(Boolean).join('   '):[d.agency,d.department,d.division].filter(Boolean).join(' / '))} ${d.phone?'โทร. '+e(d.phone):''}</span></div><div class="letterRow memoLine"><span><b>ที่</b> ${e(d.number)}</span><span><b>วันที่</b> ${e(date)}</span></div><div class="memoLine subjectLine"><span><b>เรื่อง</b> ${e(d.subject)}</span></div>`;
const at=enclosures();head+=`<p>เรียน ${e(d.recipient)}</p>`+(d.reference?`<p>อ้างถึง ${e(d.reference)}</p>`:'')+(d.attachments||at.length?`<p>สิ่งที่ส่งมาด้วย ${e(d.attachments||at.map((a,i)=>`${i+1}. ${a.title}`).join(' / '))}</p>`:'');
const opinions=d.memoTemplate==='lessonPlan'&&current?.type!=='external'?planOpinions(d,signature,e):d.opinions==='yes'&&current?.type!=='external'?`<div class="opinions"><div>ความเห็นของรองผู้อำนวยการ<br>□ เพื่อโปรดทราบ<br>□ เพื่อโปรดพิจารณา<br>................................................${signature(d.deputy,d.deputyPosition||'รองผู้อำนวยการ'+(d.division||'ฝ่ายบริหารทรัพยากร'))}</div><div>ความเห็นของผู้อำนวยการ<br>□ ทราบ / อนุญาต / อนุมัติ<br>□ ไม่อนุญาต / ไม่อนุมัติ<br>................................................${signature(d.director,d.directorPosition||'ผู้อำนวยการวิทยาลัยเทคนิคปากช่อง')}</div></div>`:'';
const font=['TH Sarabun New','TH SarabunIT๙','TH SarabunPSK'].includes(d.font)?d.font:'TH Sarabun New';
$('docPreview').style.setProperty('--paper-size','16pt');
$('docPreview').style.setProperty('--paper-font',current?.type==='internal'?'"TH SarabunPSK", sans-serif':`"${font==='TH Sarabun New'?'Document Sarabun New':font}", sans-serif`);
$('docPreview').innerHTML=`<article class="docPaper ${current?.type==='external'?'externalPaper':'internalPaper'+(d.memoTemplate==='lessonPlan'?' lessonPlanPaper':'')}">${head}<div class="bodyText">${paras(d.body,true,true)}</div>${table(d.table)}<div class="bodyText">${paras(d.closing,true)}</div>${current?.type==='external'?`<p class="salutation">${e(d.salutation)}</p>`:''}<div class="signerStack alignRight ${d.signerLayout==='pair'?'pairLayout':''}">${signature(d.signer,d.position,d.positionShort)}${d.memoTemplate!=='lessonPlan'&&d.reviewer?signature(d.reviewer,d.reviewerPosition):''}${extraSigners().map(a=>signature(a.name,a.position,a.short)).join('')}</div>${opinions}${current?.type==='external'?`<p>${e(d.department)}<br>${d.phone?'โทร. '+e(d.phone):''}</p>`:''}</article>`+at.map(a=>`<article class="docPaper appendix"><h2>${e(a.title)}</h2>${paras(a.body)}${table(a.table||'')}</article>`).join('');
requestAnimationFrame(()=>{fitLines($('docPreview'));fitPaper();const long=[...$('docPreview').children].some(p=>p.scrollHeight>1124);$('paperWarning').textContent=long?'เนื้อหาบางฉบับเกิน 1 หน้า ระบบพิมพ์จะต่อหน้าอัตโนมัติ กรุณาตรวจจุดแบ่งหน้าในหน้าต่างพิมพ์ (A4, ขนาด 100%, ปิดหัว/ท้ายของเบราว์เซอร์)':'พิมพ์บน A4 • ขนาด 100% • ปิดหัว/ท้ายของเบราว์เซอร์ • เอกสารแนบเริ่มหน้าใหม่';});
}

function extraSigners(){try{return JSON.parse(val('extraSigners')||'[]').filter(x=>x&&typeof x==='object').map(x=>({name:String(x.name||''),position:String(x.position||''),short:String(x.short||'')}))}catch{return []}}
function renderExtraSigners(){if(!$('extraSignerEditor'))return;$('extraSignerEditor').innerHTML=extraSigners().map((a,i)=>`<div class="attachmentCard"><b>ผู้ลงนามเพิ่ม ${i+1}</b><button type="button" class="btn light" data-signer-remove="${i}">ลบคนนี้</button>${['name','position','short'].map(k=>`<label>${{name:'ชื่อ–สกุล',position:'ตำแหน่งเต็ม',short:'ตำแหน่งย่อสำหรับแสดง (เว้นว่างใช้ชื่อเต็ม)'}[k]}<input data-signer-index="${i}" data-signer-field="${k}" value="${esc(a[k])}"></label>`).join('')}</div>`).join('')}
async function ensurePaperFonts(doc){
 const paper=doc.querySelector('.docPaper');if(!paper)return;
 const css=doc.defaultView.getComputedStyle(paper),family=css.fontFamily.split(',')[0],sample='.(ผู้ลงนาม) ๑๒๓';
 for(const weight of [400,700]){const faces=await doc.fonts.load(`${weight} ${css.fontSize} ${family}`,sample);if(!faces.length||faces.some(f=>f.status!=='loaded'))throw new Error('Document font unavailable');}
 await doc.fonts.ready;
}
// Outline copied from the period glyph shared by the three bundled Sarabun faces.
// Vector contours avoid font substitution and small-glyph grid fitting for signature guides.
function signatureDots(extra=''){
 const glyph='M115 28Q115 14 104.5 4Q94 -6 80 -6Q66 -6 56 4Q46 14 46 28Q46 42 56 52.5Q66 63 80 63Q94 63 104.5 52.5Q115 42 115 28Z';
 const paths=Array.from({length:110},(_,i)=>`<path transform="translate(${i*162+80} 28) scale(1.284) translate(-80 -28)" d="${glyph}"/>`).join('');
 return `<svg class="signatureDots ${extra}" xmlns="http://www.w3.org/2000/svg" aria-label="เส้นจุดสำหรับลงนาม" height="1em" width="60mm" viewBox="0 0 11000 1000" preserveAspectRatio="xMinYMid meet"><g fill="currentColor" transform="translate(0 850) scale(1 -1)">${paths}</g></svg>`;
}
function fitSignatureDots(root){
 root.querySelectorAll('svg.signatureDots').forEach(svg=>{
  const width=svg.clientWidth,size=parseFloat(svg.ownerDocument.defaultView.getComputedStyle(svg).fontSize);
  if(width&&size){svg.setAttribute('viewBox',`0 0 ${width/size*1000} 1000`);
   const dotScale=(.5*96/25.4)/(size*69/1000);
   svg.querySelectorAll('path').forEach((path,i)=>path.setAttribute('transform',`translate(${i*162+80} 28) scale(${dotScale}) translate(-80 -28)`));
  }
 });
}
function fitLines(root){if(!root)return;fitSignatureDots(root);ruleMemoLines(root);root.querySelectorAll('.fitLine').forEach(box=>{const span=box.querySelector('span');if(!span)return;span.style.transform='';span.style.display='inline-block';const width=box.clientWidth;if(width&&span.offsetWidth>width)span.style.transform=`scaleX(${width/span.offsetWidth})`;});}
function paragraphSettings(){try{return JSON.parse(val('paragraphStyles')||'{}')}catch{return {}}}
function paragraphStyle(i){const o=paragraphSettings()[i]||{},size=Number(o.size),line=Number(o.line),mode=o.align||'left',align=['left','center','right','justify'].includes(mode)?mode:'left';const word=o.wordSpace==null?(mode==='gentle'?.5:0):Math.min(4,Math.max(0,Number(o.wordSpace)||0)),letter=o.letterSpace==null?(mode==='gentle'?.1:0):Math.min(.5,Math.max(0,Number(o.letterSpace)||0));return ` style="text-align:${align};text-align-last:${align==='justify'?'left':align};word-spacing:${word}pt;letter-spacing:${letter}pt;${size>=12&&size<=24?'font-size:'+size+'pt;':''}line-height:${line>=1&&line<=2?line:1.15}"`;}

function renderParagraphControls(){const box=$('paragraphControls');if(!box)return;const settings=paragraphSettings(),parts=val('body').replace(/\r\n?/g,'\n').split(/\n+/).filter(x=>x.trim());box.innerHTML=parts.length?parts.map((p,i)=>{const o=settings[i]||{};return `<div class="paragraphControl"><strong>แถว / ย่อหน้า ${i+1}</strong><p>${esc(p.slice(0,90))}${p.length>90?'…':''}</p><div class="grid"><label>ขนาดตัวอักษร<select data-paragraph="${i}" data-format="size"><option value="">ตามเอกสาร</option>${[12,13,14,15,16,17,18,20,22,24].map(v=>`<option value="${v}" ${Number(o.size)===v?'selected':''}>${v} pt</option>`).join('')}</select></label><label>จัดแนว<select data-paragraph="${i}" data-format="align">${[['left','ชิดซ้าย'],['gentle','ถ่างเล็กน้อย / ปรับเอง'],['center','กึ่งกลาง'],['right','ชิดขวา'],['justify','เต็มบรรทัดอัตโนมัติ']].map(([v,t])=>`<option value="${v}" ${(o.align||'left')===v?'selected':''}>${t}</option>`).join('')}</select></label><label>ระยะบรรทัด<select data-paragraph="${i}" data-format="line">${[1,1.15,1.2,1.3,1.5,2].map(v=>`<option value="${v}" ${Number(o.line||1.15)===v?'selected':''}>${v} เท่า</option>`).join('')}</select></label><label>เพิ่มช่องว่างระหว่างคำ<select data-paragraph="${i}" data-format="wordSpace">${[0,.25,.5,.75,1,1.5,2,3,4].map(v=>`<option value="${v}" ${Number(o.wordSpace??(o.align==='gentle'?.5:0))===v?'selected':''}>${v===0?'ปกติ':v+' pt'}</option>`).join('')}</select></label><label>เพิ่มระยะระหว่างตัวอักษร<select data-paragraph="${i}" data-format="letterSpace">${[0,.05,.1,.15,.2,.3,.4,.5].map(v=>`<option value="${v}" ${Number(o.letterSpace??(o.align==='gentle'?.1:0))===v?'selected':''}>${v===0?'ปกติ':v+' pt'}</option>`).join('')}</select></label></div><small>โหมดถ่างเล็กน้อยควบคุมระยะได้ โดยไม่บังคับให้ข้อความสั้นยืดเต็มแถว ส่วนเต็มบรรทัดอัตโนมัติให้เบราว์เซอร์กระจายช่องว่าง</small></div>`}).join(''):'<p>ใส่เนื้อหาก่อน แล้วปรับแต่ละย่อหน้าได้ที่นี่</p>';}
function initParagraphControls(){
 $('doc_body').closest('label').insertAdjacentHTML('afterend','<input type="hidden" id="doc_paragraphStyles" value="{}"><details id="paragraphPanel"><summary>ปรับตัวอักษรและระยะบรรทัดแยกแถว</summary><p>กด Enter ในช่องเนื้อหาเพื่อแยกแถวที่ต้องการปรับ ข้อความยาวจะตัดบรรทัดต่อให้อัตโนมัติ</p><div id="paragraphControls"></div></details>');
 $('paragraphControls').onchange=e=>{const i=e.target.dataset.paragraph,k=e.target.dataset.format;if(i===undefined||!k)return;const o=paragraphSettings();o[i]={...(o[i]||{}),[k]:e.target.value};$('doc_paragraphStyles').value=JSON.stringify(o);renderParagraphControls();changed()};
 $('doc_body').addEventListener('change',renderParagraphControls);
}
function planOpinions(d,signature,e){
 const rows=[[d.planHead,d.planHeadPosition||'หัวหน้าแผนกวิชา'],[d.planCurriculum,d.planCurriculumPosition||'หัวหน้างานพัฒนาหลักสูตรการเรียนการสอน'],[d.planDeputy,d.planDeputyPosition||'รองผู้อำนวยการฝ่ายวิชาการ']];
 return '<div class="planOpinions">'+rows.map(([name,position],i)=>`<section class="planOpinion"><div class="opinionTitle">${e(String(i+1))}. ความเห็นของ${e(i===1&&position==='หัวหน้างานพัฒนาหลักสูตรการเรียนการสอน'?'หัวหน้างานพัฒนาหลักสูตรฯ':position)}</div><div class="opinionChoices">□ เห็นควรอนุญาต　□ เห็นควรปรับปรุง</div><div class="opinionRule"></div><div class="opinionRule"></div>${signature(name,position)}</section>`).join('')+'</div>';
}
function syncCollegeMemo(){const external=current?.type==='external';if($('collegeMemoOptions'))$('collegeMemoOptions').hidden=external||val('memoTemplate')!=='lessonPlan';if($('doc_memoTemplate'))$('doc_memoTemplate').closest('label').hidden=external;}
function initCollegeMemo(){/* v100: duplicate specialized memo entry removed. Use หนังสือภายใน (บันทึกข้อความ) as the single memo workflow. */}
function initV70(){
$('doc_position').parentElement.insertAdjacentHTML('afterend',input('positionShort','ตำแหน่งย่อที่ต้องการแสดง เช่น หัวหน้างานประกันคุณภาพฯ'));
$('docForm').insertAdjacentHTML('beforeend',`<details><summary>การจัดวางและผู้ลงนามเพิ่มเติม</summary><input type="hidden" id="doc_signatureAlign" value="right"><p class="muted">ผู้ลงนามหลักอยู่ในช่องด้านบน เพิ่มผู้ลงนามได้ตามจริง ส่วนผู้ผ่านงานและผู้บริหารเลือกแยกต่างหาก ตำแหน่งจะบีบแนวนอนให้อยู่บรรทัดเดียว ช่องข้อความย่อแก้เองได้โดยไม่เปลี่ยนชื่อตำแหน่งเต็ม</p><label>รูปแบบการวางผู้ลงนาม<select id="doc_signerLayout"><option value="stack">เรียงบน–ล่าง</option><option value="pair">วางคู่ซ้าย–ขวา (ตรงข้ามกัน)</option></select></label><input id="doc_extraSigners" type="hidden" value="[]"><div id="extraSignerEditor"></div><button type="button" class="btn light" id="addSigner">+ เพิ่มผู้ลงนาม</button></details><details id="aiPanel"><summary>คำสั่ง AI ตามเอกสารที่เลือก</summary><label>ต้องการร่างอะไร<select id="aiTarget"><option value="main">ตัวหนังสือหลัก</option>${Object.entries(attachmentTemplates).map(([k,t])=>`<option value="${k}">${t.name}</option>`).join('')}</select></label><label>รายละเอียดเพิ่มเติม เช่น วัน เวลา สถานที่ ข้อเท็จจริง<textarea id="aiFacts"></textarea></label><button type="button" class="btn light" id="buildPrompt">สร้าง / อัปเดตคำสั่ง</button><label>คำสั่งที่จะส่งให้ AI (แก้ไขได้)<textarea id="aiPrompt" style="min-height:260px"></textarea></label><div class="actions"><button type="button" class="btn light" id="copyPrompt">คัดลอกคำสั่ง</button><button type="button" class="btn primary" id="openPrompt">เปิด ChatGPT พร้อมคำสั่งนี้</button></div><p id="aiStatus" role="status">ถ้า ChatGPT ไม่เติมคำสั่งให้ ให้วางข้อความที่คัดลอกไว้ในช่องสนทนา</p></details>`);
$('doc_purpose').insertAdjacentHTML('beforeend','<option value="minutes">นำส่งรายงานการประชุม</option><option value="report">รายงานผลการดำเนินงาน</option>');
$('addSigner').onclick=()=>{const a=extraSigners();a.push({name:'',position:'',short:''});$('doc_extraSigners').value=JSON.stringify(a);renderExtraSigners();changed()};
$('extraSignerEditor').oninput=e=>{const k=e.target.dataset.signerField;if(!k)return;const a=extraSigners();a[+e.target.dataset.signerIndex][k]=e.target.value;$('doc_extraSigners').value=JSON.stringify(a);changed()};
$('extraSignerEditor').onclick=e=>{const b=e.target.closest('[data-signer-remove]');if(!b)return;const a=extraSigners();a.splice(+b.dataset.signerRemove,1);$('doc_extraSigners').value=JSON.stringify(a);renderExtraSigners();changed()};
$('doc_font').insertAdjacentHTML('afterend','<button type="button" class="btn light" id="officialFont">ใช้รูปแบบสารบรรณ TH Sarabun New 16 pt</button>');$('officialFont').onclick=()=>{$('doc_font').value='TH Sarabun New';$('doc_fontSize').value='16';changed()};
$('docAI').textContent='สร้างคำสั่ง AI ตามเรื่อง / ประเภท';$('docAI').onclick=()=>{$('aiPanel').open=true;buildPrompt();$('aiPanel').scrollIntoView({behavior:'smooth'})};
$('buildPrompt').onclick=buildPrompt;$('aiTarget').onchange=buildPrompt;
async function copyPrompt(){try{await navigator.clipboard.writeText($('aiPrompt').value);$('aiStatus').textContent='คัดลอกคำสั่งแล้ว'}catch{$('aiPrompt').focus();$('aiPrompt').select();$('aiStatus').textContent='แตะค้างในช่องคำสั่งแล้วเลือกคัดลอก'}}
$('copyPrompt').onclick=copyPrompt;$('openPrompt').onclick=()=>{if(!$('aiPrompt').value)buildPrompt();window.open('https://chatgpt.com/?q='+encodeURIComponent($('aiPrompt').value),'_blank');copyPrompt()};
const apply=$('applyPurpose').onclick;$('applyPurpose').onclick=()=>{const purpose=val('purpose');if(!['minutes','report'].includes(purpose)){apply();return}if(val('body')&&!confirm('แทนเนื้อหาเดิมด้วยโครงร่างหรือไม่?'))return;$('doc_body').value=purpose==='minutes'?'ตามที่ [หน่วยงาน] ได้จัดประชุม [ชื่อการประชุม] ครั้งที่ [ครั้ง/ปี] เมื่อวันที่ [วันที่] ณ [สถานที่] นั้น\n\nบัดนี้ ได้จัดทำรายงานการประชุมดังกล่าวเรียบร้อยแล้ว จึงขอเสนอรายงานการประชุมตามเอกสารที่แนบมาพร้อมนี้':'ตามที่ [หน่วยงาน] ได้ดำเนินการ [กิจกรรม/โครงการ] เมื่อวันที่ [วันที่] ณ [สถานที่] นั้น\n\nบัดนี้ การดำเนินงานเสร็จสิ้นแล้ว จึงขอรายงานผลตามเอกสารที่แนบมาพร้อมนี้';$('doc_closing').value='จึงเรียนมาเพื่อโปรดทราบ';changed()};
}
function buildPrompt(){const d=collect(),target=$('aiTarget').value,purpose=$('doc_purpose').selectedOptions[0]?.textContent||'',template=attachmentTemplates[target];$('aiPrompt').value=`โปรดร่าง${template?template.name:label(current?.type)} สำหรับ${d.agency}\nเรื่อง: ${d.subject||'[ยังไม่ได้ระบุเรื่อง]'}\nวัตถุประสงค์: ${purpose}\nเรียน: ${d.recipient}\nวันที่หนังสือ: ${d.date} (อย่าถือว่าเป็นวันจัดกิจกรรมหากไม่ได้ระบุ)\nงาน: ${d.department} ฝ่าย: ${d.division}\nข้อมูล/ร่างเดิม: ${d.body}\nข้อมูลเพิ่มเติม: ${$('aiFacts').value}\nเอกสารแนบที่มี: ${enclosures().map(x=>x.title).join(', ')}\n${template?'จัดเนื้อหาตามโครงนี้:\n'+template.text:'ขอเฉพาะเนื้อหา 2–3 ย่อหน้า ไม่ใส่หัวหนังสือ ไม่ใส่ชื่อผู้ลงนาม และไม่ใส่ประโยคลงท้าย เพราะระบบแยกช่องไว้แล้ว; ประโยคลงท้ายที่ใช้คือ '+d.closing}\nใช้ภาษาไทยราชการให้ตรงเรื่องและวัตถุประสงค์ แยกย่อหน้าด้วยบรรทัดว่าง ไม่ใช้ Markdown ไม่สมมติชื่อ วันเวลา จำนวนเงิน มติที่ประชุม หรือข้อกฎหมาย หากข้อมูลขาดให้ใช้ [ระบุข้อมูล] ถ้ามีตารางให้แยกท้ายคำตอบโดยคั่นคอลัมน์ด้วย | ไม่ใส่คำอธิบายนอกเหนือจากร่าง`;}

function ruleMemoLines(root){
 root.querySelectorAll('.subjectLine').forEach(box=>{
  box.querySelectorAll('.memoRule').forEach(n=>n.remove());
  const line=parseFloat(getComputedStyle(box).lineHeight)||28;
  const count=Math.max(1,Math.round(box.clientHeight/line));
  for(let i=1;i<=count;i++){const rule=document.createElement('i');rule.className='memoRule';rule.style.top=(i*line-1)+'px';box.appendChild(rule)}
 });
}
function syncSimpleForm(){
 const external=current?.type==='external';
 ['address','salutation','reference'].forEach(k=>{const l=$('doc_'+k)?.closest('label');if(l)l.hidden=!external});
 const opinions=$('doc_opinions')?.closest('details');if(opinions)opinions.hidden=external;
 $('doc_signatureAlign').value='right';if($('docPerson'))$('docPerson').value='';
 if($('docSimpleNote'))$('docSimpleNote').textContent=external?'หนังสือภายนอก • กรอกผู้รับ เรื่อง และเนื้อหา • พิมพ์ 3 ชุดอัตโนมัติ':'บันทึกข้อความ • เติมผู้รับและวันที่ให้แล้ว • กรอกเรื่องและเนื้อหา';
 for(const k of ['table','enclosures','extraSigners']){const e=$('doc_'+k),d=e?.closest('details');if(d&&e.value&&e.value!=='[]')d.open=true;}
}
function initSimpleForm(){
 const form=$('docForm');
 form.insertAdjacentHTML('afterbegin','<p class="notice" id="docSimpleNote"></p>');
 const profile=document.createElement('details');profile.id='docProfile';profile.innerHTML='<summary>ข้อมูลหน่วยงานและรูปแบบ • ตั้งครั้งเดียวใช้ซ้ำ</summary><div class="grid"></div>';form.appendChild(profile);
 ['agency','phone','department','division','address','font','fontSize','digits','number'].forEach(k=>profile.lastElementChild.appendChild($('doc_'+k).closest('label')));
 profile.appendChild($('saveDocDefaults'));
 const extra=document.createElement('details');extra.innerHTML='<summary>ข้อมูลเพิ่มเติม / ปรับคำลงท้าย</summary><div class="grid"></div>';form.appendChild(extra);
 ['reference','attachments','closing','salutation','notes','positionShort'].forEach(k=>extra.lastElementChild.appendChild($('doc_'+k).closest('label')));
 $('doc_signer').insertAdjacentHTML('beforebegin','<select id="docPerson"><option value="">เลือกจากรายชื่อในระบบ / พิมพ์เอง</option></select>');
 const people=typeof state!=='undefined'?state.teachers||[]:[];
 $('docPerson').innerHTML+=[...people.map(t=>({name:t.name,position:t.specialDuty||'ครู'})),...(typeof state!=='undefined'&&state.signers?.director?[{name:state.signers.director,position:'ผู้อำนวยการวิทยาลัยเทคนิคปากช่อง'}]:[])].map((t,i)=>`<option value="${i}" data-name="${esc(t.name)}" data-position="${esc(t.position)}">${esc(t.name)}</option>`).join('');
 $('docPerson').onchange=()=>{const o=$('docPerson').selectedOptions[0];if(!o?.dataset.name)return;$('doc_signer').value=o.dataset.name;$('doc_position').value=o.dataset.position;changed()};
 $('doc_font').onchange=()=>{if(val('font')==='TH SarabunIT๙')$('doc_digits').value='thai';changed()};
 $('doc_digits').onchange=()=>{if(val('digits')==='arabic'&&val('font')==='TH SarabunIT๙')$('doc_font').value='TH Sarabun New';changed()};
 $('doc_purpose').onchange=()=>{const lines={approve:'จึงเรียนมาเพื่อโปรดพิจารณาอนุญาต',inform:'จึงเรียนมาเพื่อโปรดทราบ',invite:'จึงเรียนมาเพื่อโปรดเข้าร่วมประชุมตามวัน เวลา และสถานที่ดังกล่าว',cooperate:'จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์',minutes:'จึงเรียนมาเพื่อโปรดทราบ',report:'จึงเรียนมาเพื่อโปรดทราบ'};$('doc_closing').value=lines[val('purpose')]||lines.approve;changed()};
 $('docForm').addEventListener('submit',()=>{if(current&&val('subject')){const msg=$('docStatus').textContent;$('saveDocDefaults').click();$('docStatus').textContent=msg;}});
}

initStudio();initV70();initSimpleForm();initTopActions();initParagraphControls();initCollegeMemo();
render();
})();
