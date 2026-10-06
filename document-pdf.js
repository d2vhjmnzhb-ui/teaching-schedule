/* Local-only PDF export. No document content is sent to a server. */
window.downloadCollegePdf=async function(subject){
 const button=document.getElementById('downloadDocumentPdf'),status=document.getElementById('printStatus');
 if(button.disabled)return;button.disabled=true;const old=button.textContent;button.textContent='กำลังสร้าง PDF…';
 try{
  if(!window.html2canvas||!window.PDFLib)throw new Error('ไม่พบไฟล์สร้าง PDF กรุณาอัปโหลดโฟลเดอร์ vendor ให้ครบ');
  await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,5000))]);
  await Promise.all([...document.images].map(i=>i.decode?i.decode().catch(()=>{}):Promise.resolve()));
  const pdf=await PDFLib.PDFDocument.create();pdf.setTitle(subject);pdf.setCreator('College Document System');
  const mm=72/25.4,px=96/25.4;
  const mobile=/iPad|iPhone|iPod|Android/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  for(const paper of document.querySelectorAll('.docPaper')){
   const css=getComputedStyle(paper),rect=paper.getBoundingClientRect(),top=parseFloat(css.paddingTop),bottom=parseFloat(css.paddingBottom),left=parseFloat(css.paddingLeft),right=parseFloat(css.paddingRight);
   const contentHeight=Math.max(1,paper.scrollHeight-top-bottom),contentWidth=paper.clientWidth-left-right,capacity=(297*px-top-bottom);
   // Avoid page breaks through a text line, table row or signature block.
   const forbidden=[];const add=r=>{if(r.height&&r.height<capacity)forbidden.push([r.top-rect.top-top,r.bottom-rect.top-top]);};
   paper.querySelectorAll('tr,.signature,.memoHead,.externalHead,.draftChecks').forEach(e=>add(e.getBoundingClientRect()));
   const walker=document.createTreeWalker(paper,NodeFilter.SHOW_TEXT);let node;
   while(node=walker.nextNode()){if(!node.textContent.trim()||node.parentElement.closest('svg'))continue;const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())add(r);}
   const scale=Math.min(mobile?2:3,Math.sqrt((mobile?7000000:12000000)/(paper.clientWidth*paper.scrollHeight)));
   const canvas=await html2canvas(paper,{scale,backgroundColor:'#ffffff',logging:false,useCORS:true,windowWidth:1100,scrollX:0,scrollY:0});
   let start=0;
   while(start<contentHeight-1){
    let end=Math.min(contentHeight,start+capacity);
    if(end<contentHeight){for(let attempts=0;attempts<100;attempts++){const overlaps=forbidden.filter(([a,b])=>a<end-.2&&b>end+.2);if(!overlaps.length)break;const cut=Math.min(...overlaps.map(r=>r[0]));if(cut<=start+1)break;end=cut;}}
    if(end<=start+1)end=Math.min(contentHeight,start+capacity);
    const slice=document.createElement('canvas');slice.width=Math.round(contentWidth*scale);slice.height=Math.max(1,Math.ceil((end-start)*scale));
    slice.getContext('2d').drawImage(canvas,left*scale,(top+start)*scale,contentWidth*scale,(end-start)*scale,0,0,slice.width,slice.height);
    const blob=await new Promise((ok,fail)=>slice.toBlob(b=>b?ok(b):fail(new Error('สร้างภาพหน้ากระดาษไม่สำเร็จ (หน่วยความจำไม่พอ)')),'image/png'));const png=await pdf.embedPng(new Uint8Array(await blob.arrayBuffer()));slice.width=slice.height=0;const page=pdf.addPage([210*mm,297*mm]);
    page.drawImage(png,{x:left*.75,y:297*mm-top*.75-(end-start)*.75,width:contentWidth*.75,height:(end-start)*.75});start=end;
   }
   canvas.width=canvas.height=0;
  }
  const bytes=await pdf.save(),blob=new Blob([bytes],{type:'application/pdf'}),url=URL.createObjectURL(blob),name=subject+'.pdf';
  const tools=document.querySelector('.printTools');tools.querySelectorAll('.pdfDownloadLink').forEach(x=>x.remove());
  const a=document.createElement('a');a.href=url;a.download=name;a.textContent='แตะเพื่อบันทึก '+name;a.className='pdfDownloadLink';a.style.cssText='display:block;margin:12px auto;padding:12px 20px;background:#176c72;color:#fff;border-radius:8px;text-decoration:none;max-width:420px';
  const open=document.createElement('a');open.href=url;open.target='_blank';open.rel='noopener';open.textContent='หรือเปิด PDF แล้วกดแชร์ → บันทึกลงไฟล์';open.className='pdfDownloadLink';open.style.cssText='display:block;margin:6px auto;color:#176c72';
  tools.append(a,open);
  let shared=false;
  try{const file=new File([blob],name,{type:'application/pdf'});if(mobile&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:subject});shared=true;}}catch(err){/* ยกเลิก/ไม่อนุญาต: ใช้ลิงก์ด้านล่างแทน */}
  if(!shared)try{a.click();}catch(err){}
  setTimeout(()=>URL.revokeObjectURL(url),600000);
  status.textContent='สร้าง '+name+' แล้ว '+(shared?'':'ถ้าไฟล์ยังไม่ถูกบันทึก ให้แตะปุ่มสีเขียวด้านล่าง');
 }catch(e){status.textContent='สร้าง PDF ไม่สำเร็จ: '+e.message+' — ยังสามารถใช้ปุ่มพิมพ์ / บันทึก PDF ได้';}
 finally{button.disabled=false;button.textContent=old;}
};
