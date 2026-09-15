const SHEET_NAME = 'ScheduleCloud';

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1,1,1,3).setValues([['key','updated_at','json']]);
    sh.setFrozenRows(1);
  }
  return sh;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
function doGet(e) {
  try {
    const action=(e.parameter.action||'load').toLowerCase();
    if(action==='ping') return json_({ok:true,service:'college-schedule-cloud'});
    if(action!=='load') return json_({ok:false,error:'unsupported action'});
    const key=e.parameter.key||'college-main', sh=sheet_();
    const vals=sh.getDataRange().getValues();
    for(let i=vals.length-1;i>=1;i--){
      if(String(vals[i][0])===key)
        return json_({ok:true,key:key,updated_at:vals[i][1],data:vals[i][2]});
    }
    return json_({ok:true,key:key,data:null});
  } catch(err) { return json_({ok:false,error:String(err)}); }
}
function doPost(e) {
  try {
    const action=(e.parameter.action||'').toLowerCase();
    if(action!=='save') return json_({ok:false,error:'unsupported action'});
    const key=e.parameter.key||'college-main';
    const data=e.parameter.data||'';
    JSON.parse(data); // validate before storing
    const sh=sheet_(), vals=sh.getDataRange().getValues();
    let row=0;
    for(let i=1;i<vals.length;i++) if(String(vals[i][0])===key){row=i+1;break;}
    const now=new Date();
    if(row) sh.getRange(row,1,1,3).setValues([[key,now,data]]);
    else sh.appendRow([key,now,data]);
    return json_({ok:true,key:key,updated_at:now.toISOString()});
  } catch(err) { return json_({ok:false,error:String(err)}); }
}
