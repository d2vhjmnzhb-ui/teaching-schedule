/* v115: one final integration layer, loaded after legacy controllers. */
(()=>{
 const $=id=>document.getElementById(id),same=(a,b)=>String(a??'')===String(b??'');
 const entries=()=>Object.entries(state.lessons||{}).filter(([k])=>same(parseKey(k).pid,state.activePlanId));
 window.teacherTermEntries115=()=>Object.entries(state.lessons||{}).filter(([k])=>{const q=parseKey(k),active=plan(),lp=state.plans.find(x=>same(x.id,q.pid));return same(q.pid,state.activePlanId)||!!(lp&&String(lp.semester||lp.term)===String(active.semester||active.term)&&String(lp.academicYear||lp.term)===String(active.academicYear||active.term))});
 const joint=(a,b)=>same(a.subjectId,b.subjectId)&&same(a.teacherId,b.teacherId)&&same(a.roomId,b.roomId)&&!!a.teacherId&&!!a.roomId;
 window.teacherLessonAt=function(tid,d,p){
  const out=[];for(const [k,l] of teacherTermEntries115()){const q=parseKey(k);if(q.d!==d||q.p!==p||!same(l.teacherId,tid))continue;
   const found=out.find(x=>joint(x,l));if(found)found.groupIds.push(q.gid);else out.push({...l,groupId:q.gid,groupIds:[q.gid]});
  }return out;
 };
 lessonHtml=function(l,teacherMode=false){
  const s=subject(l.subjectId),r=room(l.roomId),gs=(l.groupIds||[l.groupId]).map(id=>state.groups.find(g=>same(g.id,id)));
  const lines=teacherMode?[s?.code||`ไม่พบวิชา ${l.subjectId}`,r?.name||'ไม่ระบุห้อง',gs.map(g=>groupShortName(g)||'ไม่พบกลุ่ม').join(', ')]:[s?.name||`ไม่พบวิชา ${l.subjectId}`,r?.name||'ไม่ระบุห้อง',teacherShortName(teacher(l.teacherId)?.name)];
  return `<div class="lesson ${teacherMode?'teacher':'student'}-lesson">${lines.map((v,i)=>`<span class="lesson-line">${i===0?'<b>':''}${esc(v)}${i===0?'</b>':''}</span>`).join('')}</div>`;
 };
 // Both screen and print consume the same combined lessons.
 makeTeacherCombinedTable=function(tid){let h='<table class="schedule-paper"><thead><tr><th>วัน / คาบ</th><th>กิจกรรม</th>'+periodTimes.map((v,i)=>`<th>${i+1}<div class="period-time">${v}</div></th>`).join('')+'</tr></thead><tbody>';
 days.forEach((day,d)=>{h+=`<tr><th class="day">${day}</th><td class="assembly assembly-vertical">กิจกรรมหน้าเสาธง</td>`;for(let p=1;p<=12;p++){const ls=teacherLessonAt(tid,d,p);h+=`<td class="slot ${ls.length>1?'conflict':''}">${ls.length?ls.map(l=>lessonHtml(l,true)).join('<hr>'):p===5?'พักกลางวัน':''}</td>`}h+='</tr>'});return h+'</tbody></table>'};
 // Reject a proposal unless the complete simulated result is valid for all changed cells.
 window.validateSmartProposal=function(plan,s,gid){
  if(!s?.teacherId||!s?.roomId||!teacher(s.teacherId)||!room(s.roomId))return false;
  const sim={...state.lessons},changed=new Set(),termPlans=new Set(teacherTermEntries115().map(([k])=>String(parseKey(k).pid)));termPlans.add(String(state.activePlanId));
  for(const b of plan.blocking){if(b.keys.some(k=>!sim[k]||!joint(sim[k],b.l)))return false;b.keys.forEach(k=>delete sim[k])}
  for(let i=0;i<plan.moves.length;i++){const b=plan.blocking[i];for(const k of plan.moves[i].dest){if(sim[k])return false;sim[k]={...b.l,groupId:parseKey(k).gid};changed.add(k)}}
  for(const k of plan.pl.parts.flatMap(x=>x.keys)){if(sim[k])return false;sim[k]={subjectId:s.id,teacherId:s.teacherId,roomId:s.roomId,planId:state.activePlanId,groupId:gid};changed.add(k)}
  for(const k of changed){const q=parseKey(k),l=sim[k];if(q.p===5||(!isActivitySubject(subject(l.subjectId))&&activitySlot(q.d,q.p)))return false;
   for(const [ok,ol] of Object.entries(sim)){if(ok===k)continue;const z=parseKey(ok);if(!termPlans.has(String(z.pid))||q.d!==z.d||q.p!==z.p)continue;if(same(q.gid,z.gid))return false;if((same(l.teacherId,ol.teacherId)||same(l.roomId,ol.roomId))&&!joint(l,ol))return false}
  }return true;
 };
 window.auditSchedule115=function(){
  const issues=[],es=teacherTermEntries115(),buckets=new Map();
  for(const [k,l] of es){const q=parseKey(k);if(!subject(l.subjectId)||!teacher(l.teacherId)||!room(l.roomId)||!state.groups.some(g=>same(g.id,q.gid)))issues.push(`ข้อมูลอ้างอิงไม่ครบ: ${k}`);
   if(q.p===5)issues.push(`มีคาบในเวลาพัก: ${k}`);if(activitySlot(q.d,q.p)&&!isActivitySubject(subject(l.subjectId)))issues.push(`วิชาทั่วไปทับคาบกิจกรรม: ${k}`);
   const slot=q.d+'|'+q.p;if(!buckets.has(slot))buckets.set(slot,[]);buckets.get(slot).push([k,l]);
  }
  for(const bucket of buckets.values())for(let i=0;i<bucket.length;i++)for(let j=i+1;j<bucket.length;j++){const [ka,a]=bucket[i],[kb,b]=bucket[j];if(joint(a,b))continue;if(a.teacherId&&same(a.teacherId,b.teacherId))issues.push(`ครูชน: ${teacher(a.teacherId)?.name||a.teacherId} (${ka} / ${kb})`);if(a.roomId&&same(a.roomId,b.roomId))issues.push(`ห้องชน: ${room(a.roomId)?.name||a.roomId} (${ka} / ${kb})`)}
  const missing=[],keep=state.currentGroupId;
  try{for(const g of groupsForPlan()){state.currentGroupId=g.id;for(const s of subjectsForCurrentGroup()){const need=Number(s.t||0)+Number(s.p||0),actual=es.filter(([k,l])=>same(parseKey(k).pid,state.activePlanId)&&same(parseKey(k).gid,g.id)&&same(l.subjectId,s.id)).length;if(actual<need)missing.push(`${g.name}: ${s.code} ขาด ${need-actual} คาบ`);if(actual>need)issues.push(`${g.name}: ${s.code} เกิน ${actual-need} คาบ`)}}}finally{state.currentGroupId=keep}
  return {issues,missing,lessons:es.length};
 };
 const analyze=window.runScheduleAnalysis;
 window.runScheduleAnalysis=function(){
  const a=auditSchedule115();let box=$('analysisAudit115');if(!box){box=document.createElement('div');box.id='analysisAudit115';$('smartOptimizerBox').insertBefore(box,$('smartOptimizerList'))}
  box.innerHTML=`<div class="notice ${a.issues.length?'warn':'good'}"><b>ตรวจ ${a.lessons} คาบ • พบข้อผิดพลาด ${a.issues.length} รายการ • ยังขาด ${a.missing.length} รายวิชา/กลุ่ม</b><p>วิเคราะห์ตามกฎและค้นหาแผนย้าย ไม่ใช่ AI สนทนา และไม่รับประกันคำตอบที่ดีที่สุด</p><details><summary>ดูรายละเอียดผลตรวจ</summary>${[...a.issues,...a.missing].map(x=>`<div>${esc(x)}</div>`).join('')||'ไม่พบข้อผิดพลาดจากกฎที่ตรวจ'}</details></div>`;
  if(a.issues.length){$('smartOptimizerList').style.display='block';$('smartOptimizerList').textContent='แก้ข้อมูลที่ผิดหรือคาบชนก่อนใช้แผนย้าย เพื่อไม่เพิ่มปัญหาเดิม';return}analyze();
 };
 // Make editing explicit above the horizontally scrollable timetable.
 const editor=document.createElement('div');editor.id='lessonEditor115';editor.className='card no-print';editor.innerHTML='<h2>แก้ไขคาบเรียน</h2><p class="muted">เลือกคาบที่ต้องการแก้ แล้วเลือกครูและห้อง กดบันทึกเพื่อแก้เฉพาะคาบนี้</p><div class="grid3"><label>คาบเรียน<select id="editSlot115"></select></label><label>ครูผู้สอน<select id="editTeacher115"></select></label><label>ห้องเรียน<select id="editRoom115"></select></label></div><div class="actions"><button class="btn primary" id="saveLesson115">บันทึกคาบนี้</button><span id="editStatus115" role="status"></span></div>';
 $('studentTable').before(editor);
 function fillEditor(){const old=$('editSlot115').value;const es=entries().filter(([k])=>same(parseKey(k).gid,state.currentGroupId));$('editSlot115').innerHTML='<option value="">เลือกคาบที่จะปรับแก้</option>'+es.map(([k,l])=>{const q=parseKey(k);return `<option value="${esc(k)}">${days[q.d]} คาบ ${q.p} • ${esc(subject(l.subjectId)?.name||l.subjectId)}</option>`}).join('');$('editSlot115').value=es.some(([k])=>k===old)?old:'';
 $('editTeacher115').innerHTML=state.teachers.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');$('editRoom115').innerHTML=state.rooms.map(r=>`<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('');syncEditor();
 }
 function syncEditor(){const l=state.lessons[$('editSlot115').value];$('saveLesson115').disabled=!l;if(l){$('editTeacher115').value=l.teacherId;$('editRoom115').value=l.roomId}}
 $('editSlot115').onchange=syncEditor;
 $('saveLesson115').onclick=()=>{const k=$('editSlot115').value,l=state.lessons[k];if(!l)return;const q=parseKey(k),trial={...l,teacherId:$('editTeacher115').value,roomId:$('editRoom115').value};if(!trial.teacherId||!trial.roomId)return;
 for(const [ok,other] of teacherTermEntries115()){const z=parseKey(ok);if(ok!==k&&q.d===z.d&&q.p===z.p&&(same(trial.teacherId,other.teacherId)||same(trial.roomId,other.roomId))&&!joint(trial,other)){$('editStatus115').textContent='บันทึกไม่ได้: ครูหรือห้องชนกับคาบอื่น';return}}
 state.lessons[k]=trial;save();renderAll();$('editStatus115').textContent='บันทึกคาบที่เลือกแล้ว';};
 document.addEventListener('click',e=>{const b=e.target.closest('.v114-edit');if(!b)return;e.preventDefault();e.stopImmediatePropagation();$('editSlot115').value=b.parentElement.dataset.key;syncEditor();editor.scrollIntoView({behavior:'smooth',block:'start'});$('editTeacher115').focus({preventScroll:true})},true);
 const base=renderAll;renderAll=function(){base();fillEditor()};
 const btn=$('runScheduleAnalysisBtn');if(btn)btn.onclick=()=>runScheduleAnalysis();
 // Refresh immediately before printing; keep the selected print teacher.
 window.addEventListener('beforeprint',()=>{if($('printPage').classList.contains('active'))renderPreview(window.previewMode||'student')});
 fillEditor();renderTeacher();renderPreview();
})();
