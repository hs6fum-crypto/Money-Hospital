(function(){
'use strict';
var STORE_KEY='phrompirham-money-dashboard-v1';
var COLORS={personnel:'#ed8298',operating:'#54b991',investment:'#8296ec',support:'#e9b34c',central:'#ad8be0'};
var QUARTERS=[
 {id:1,label:'ไตรมาส 1',months:'ต.ค.–ธ.ค.'},
 {id:2,label:'ไตรมาส 2',months:'ม.ค.–มี.ค.'},
 {id:3,label:'ไตรมาส 3',months:'เม.ย.–มิ.ย.'},
 {id:4,label:'ไตรมาส 4',months:'ก.ค.–ก.ย.'}
];
var EXPENSE_CATEGORIES=[
 {id:'personnel',name:'รายจ่ายบุคลากร',short:'บุคลากร'},
 {id:'operating',name:'รายจ่ายจากการดำเนินงาน',short:'ดำเนินงาน'},
 {id:'investment',name:'รายจ่ายลงทุน',short:'ลงทุน'},
 {id:'support',name:'รายจ่ายสนับสนุน',short:'สนับสนุน'},
 {id:'central',name:'งบกลาง',short:'งบกลาง'}
];
var INCOME_CATEGORIES=[
 {id:'service',name:'รายรับจากการดำเนินงาน',short:'ดำเนินงาน'},
 {id:'other',name:'รายรับอื่น',short:'รายรับอื่น'}
];
var BASELINE={
 '2570':{
  plan:{
   income:{service:118290801.9,other:2550000},
   expense:{personnel:20743354,operating:91052290.7,investment:3200500,support:14637729,central:500000}
  },
  entries:[
   {id:'source-2570-q1-01',year:'2570',quarter:1,type:'expense',categoryId:'operating',description:'ค่าใช้สอย · ยอดไตรมาส 1 จากไฟล์ต้นทาง',amount:380360.32,note:'นำเข้าจากแท็บรายจ่าย (สรุป) ปีงบประมาณ 2570'},
   {id:'source-2570-q1-02',year:'2570',quarter:1,type:'expense',categoryId:'operating',description:'ค่าวัสดุ · ยอดไตรมาส 1 จากไฟล์ต้นทาง',amount:352329.8,note:'นำเข้าจากแท็บรายจ่าย (สรุป) ปีงบประมาณ 2570'},
   {id:'source-2570-q1-03',year:'2570',quarter:1,type:'expense',categoryId:'operating',description:'ค่าสาธารณูปโภค · ยอดไตรมาส 1 จากไฟล์ต้นทาง',amount:449230.33,note:'นำเข้าจากแท็บรายจ่าย (สรุป) ปีงบประมาณ 2570'}
  ]
 }
};
var storeData=loadData();
var activeYear=storeData.activeYear||'2570';
var registerCategory='operating';
var toastTimer=null;
var compareYears=null;
var compareKnownYears=[];
var columnFilters={};
function clone(obj){return JSON.parse(JSON.stringify(obj))}
function emptyYear(){return{plan:{income:{service:0,other:0},expense:{personnel:0,operating:0,investment:0,support:0,central:0}},entries:[]}}
function loadData(){
 try{
  var raw=localStorage.getItem(STORE_KEY);
  if(raw){var parsed=JSON.parse(raw);if(parsed&&parsed.years)return parsed}
 }catch(e){}
 return{activeYear:'2570',years:clone(BASELINE)}
}
function hydrateHistoricalYears(){
 var seed=window.HISTORICAL_SEED;if(!seed||!seed.years)return;
 var changed=false;
 Object.keys(seed.years).forEach(function(year){
  var source=seed.years[year],d=storeData.years[year]||emptyYear();
  if(Number(d.historicalSeedVersion||0)>=Number(seed.version||1))return;
  d.plan=clone(source.plan);
  d.sourceSummary={incomeActual:clone(source.actual.income),expenseActual:clone(source.actual.expense),source:clone(source.source)};
  d.historicalSeedVersion=Number(seed.version)||1;
  storeData.years[year]=d;changed=true
 });
 if(changed)persist()
}
function persist(){
 storeData.activeYear=activeYear;
 try{localStorage.setItem(STORE_KEY,JSON.stringify(storeData));setSaveState('บันทึกล่าสุด '+new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}))}
 catch(e){setSaveState('เบราว์เซอร์ไม่อนุญาตให้บันทึกข้อมูล')}
}
function setSaveState(text){var el=document.getElementById('saveState');if(el)el.textContent=text}
function currentData(){if(!storeData.years[activeYear])storeData.years[activeYear]=emptyYear();var d=storeData.years[activeYear];if(!d.plan)d.plan=emptyYear().plan;if(!d.entries)d.entries=[];return d}
function normalizeYear(value){var s=String(value==null?'':value).trim();return/^[1-9][0-9]*$/.test(s)?s:null}
function sortedYears(){return Object.keys(storeData.years).sort(function(a,b){var x=BigInt(a),y=BigInt(b);return x<y?-1:x>y?1:0})}
function fmt(value){var n=Number(value)||0;return new Intl.NumberFormat('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)}
function pct(value){return (Number(value)||0).toLocaleString('th-TH',{minimumFractionDigits:1,maximumFractionDigits:1})+'%'}
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function planTotal(map){return Object.keys(map||{}).reduce(function(s,k){return s+(Number(map[k])||0)},0)}
function entriesFor(type){return currentData().entries.filter(function(x){return x.year===activeYear&&(!type||x.type===type)})}
function totalActual(type){return entriesFor(type).reduce(function(s,x){return s+(Number(x.amount)||0)},0)}
function actualByQuarter(type,quarter,categoryId){return entriesFor(type).filter(function(x){return Number(x.quarter)===Number(quarter)&&(!categoryId||x.categoryId===categoryId)}).reduce(function(s,x){return s+(Number(x.amount)||0)},0)}
function actualByCategory(type,categoryId){return entriesFor(type).filter(function(x){return x.categoryId===categoryId}).reduce(function(s,x){return s+(Number(x.amount)||0)},0)}
function categoryFor(type,id){var list=type==='income'?INCOME_CATEGORIES:EXPENSE_CATEGORIES;return list.find(function(x){return x.id===id})||{name:'ไม่ระบุหมวด',short:'ไม่ระบุ'}}
function showToast(message){var el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(function(){el.classList.remove('show')},2800)}
function yearOptions(){var select=document.getElementById('yearSelect');select.innerHTML=sortedYears().map(function(y){return'<option value="'+esc(y)+'">พ.ศ. '+esc(y)+'</option>'}).join('');select.value=activeYear}
function render(){
 yearOptions();
 document.getElementById('yearSelect').value=activeYear;
 document.getElementById('headingYear').textContent=activeYear;
 renderMetrics();renderChart();renderCategoryCards();renderCategoryTable();renderRevenueTable();renderRegisterTabs();renderRecords();renderComparison();
}
function renderMetrics(){
 var d=currentData(),incomePlan=planTotal(d.plan.income),expensePlan=planTotal(d.plan.expense),income=totalActual('income'),expense=totalActual('expense'),remaining=expensePlan-expense,rate=expensePlan>0?expense/expensePlan*100:0;
 document.getElementById('incomePlanTotal').textContent=fmt(incomePlan);
 document.getElementById('incomeActualTotal').textContent=fmt(income)+' บาท';
 document.getElementById('expensePlanTotal').textContent=fmt(expensePlan);
 document.getElementById('expenseActualTotal').textContent=fmt(expense)+' บาท';
 document.getElementById('expenseRemaining').textContent=fmt(remaining);
 document.getElementById('expenseRate').textContent=expensePlan>0?pct(rate):'ยังไม่ระบุแผน';
 document.getElementById('netActual').textContent=fmt(income-expense);
 document.getElementById('recordCountLabel').textContent=entriesFor().length.toLocaleString('th-TH')+' รายการบันทึก';
 document.getElementById('ringRate').textContent=expensePlan>0?pct(rate):'0%';
 document.getElementById('progressRing').style.background='conic-gradient(#68ae94 '+Math.max(0,Math.min(rate,100))*3.6+'deg,#edf2f0 0deg)';
 var status=document.getElementById('executionStatus'),detail=document.getElementById('executionDetail');
 if(expensePlan<=0){status.textContent='ยังไม่มีข้อมูลแผน';detail.textContent='กรอกแผนรายจ่ายสำหรับปีนี้เพื่อคำนวณอัตราใช้จ่าย'}
 else if(rate>=75){status.textContent='ใช้จ่ายถึงเกณฑ์ 75%';detail.textContent='ยอดใช้จ่ายอยู่ในระดับตามเกณฑ์ที่กำหนดในแบบสรุป'}
 else if(rate>=50){status.textContent='อยู่ระหว่างเร่งรัด';detail.textContent='อัตราการใช้จ่ายอยู่ระหว่าง 50%–74% ของแผน'}
 else{status.textContent='ควรติดตามการใช้จ่าย';detail.textContent='อัตราการใช้จ่ายต่ำกว่า 50% ของแผน'}
 var rank=EXPENSE_CATEGORIES.map(function(c){return{id:c.id,name:c.name,total:actualByCategory('expense',c.id)}}).sort(function(a,b){return b.total-a.total});
 document.getElementById('largestCategory').textContent=rank.length&&rank[0].total>0?rank[0].name:'ยังไม่มียอดใช้จ่าย';
 var qrank=QUARTERS.map(function(q){return{id:q.id,total:actualByQuarter('expense',q.id)}}).sort(function(a,b){return b.total-a.total});
 document.getElementById('largestQuarter').textContent=qrank.length&&qrank[0].total>0?'ไตรมาส '+qrank[0].id+' · '+fmt(qrank[0].total)+' บาท':'ยังไม่มียอดใช้จ่าย';
 var source=currentData().sourceSummary;
 document.getElementById('noticeText').textContent=source?'ปี พ.ศ. '+activeYear+' · นำเข้ายอดรายปีจาก '+(source.source.files||[]).join(', ')+' · '+(source.source.quartersAvailable?'มีข้อมูลรายไตรมาส':'ยอดจริงจากต้นฉบับเป็นยอดรวมทั้งปี'):'ปี พ.ศ. '+activeYear+' · ข้อมูลแผนและรายการใช้จ่ายแยกตามปี ไม่ปะปนกับปีอื่น';
}
function renderChart(){
 var qTotals=QUARTERS.map(function(q){return actualByQuarter('expense',q.id)}),max=Math.max.apply(Math,qTotals.concat([1]));
 document.getElementById('quarterChart').innerHTML=QUARTERS.map(function(q){
  var total=qTotals[q.id-1],segments=EXPENSE_CATEGORIES.map(function(c){var v=actualByQuarter('expense',q.id,c.id),w=total>0?v/max*100:0;return v>0?'<span style="width:'+w+'%;background:'+COLORS[c.id]+'" title="'+esc(c.name)+' '+fmt(v)+' บาท"></span>':''}).join('');
  return'<div class="quarter-row" data-quarter="'+q.id+'" role="button" tabindex="0" aria-label="กรองรายการไตรมาส '+q.id+'"><div class="quarter-name"><strong>ไตรมาส '+q.id+'</strong><small>'+q.months+'</small></div><div class="quarter-track">'+segments+'</div><div class="quarter-value">'+fmt(total)+' ฿</div></div>'
 }).join('');
 document.getElementById('categoryLegend').innerHTML=EXPENSE_CATEGORIES.map(function(c){return'<span class="legend-item"><i class="legend-swatch" style="background:'+COLORS[c.id]+'"></i>'+esc(c.short)+'</span>'}).join('');
 var source=currentData().sourceSummary;
 var foot=document.getElementById('quarterFootnote');
 if(foot)foot.textContent=source&&!source.source.quartersAvailable?'ยอดใช้จริงจากไฟล์ '+(source.source.expenseSheet||'ชีตสรุป')+' เป็นยอดรวมรายปี ไม่มีรายละเอียดไตรมาสนำเข้า; ยอดที่บันทึกเพิ่มในระบบจะแสดงตามไตรมาส':'ไตรมาส 1 ต.ค.–ธ.ค. · ไตรมาส 2 ม.ค.–มี.ค. · ไตรมาส 3 เม.ย.–มิ.ย. · ไตรมาส 4 ก.ค.–ก.ย.';
}
function rateClass(rate){return rate>=75?'rate-good':rate>=50?'rate-mid':'rate-low'}
function renderCategoryCards(){
 var d=currentData();
 document.getElementById('categoryCards').innerHTML=EXPENSE_CATEGORIES.map(function(c){
  var plan=Number(d.plan.expense[c.id])||0,actual=actualByCategory('expense',c.id),rate=plan>0?actual/plan*100:0,remain=plan-actual;
  return'<article class="category-card"><div class="category-card-top"><i class="category-dot" style="background:'+COLORS[c.id]+'"></i><h4>'+esc(c.name)+'</h4></div><strong>'+fmt(actual)+' บาท</strong><small>แผน '+fmt(plan)+' · คงเหลือ '+fmt(remain)+'</small><div class="mini-progress"><span style="width:'+Math.min(Math.max(rate,0),100)+'%;background:'+COLORS[c.id]+'"></span></div></article>'
 }).join('');
}
function renderCategoryTable(){
 var d=currentData(),sumPlan=0,sumActual=0,quarterTotals=[0,0,0,0];
 var rows=EXPENSE_CATEGORIES.map(function(c){
  var plan=Number(d.plan.expense[c.id])||0,vals=QUARTERS.map(function(q){var x=actualByQuarter('expense',q.id,c.id);quarterTotals[q.id-1]+=x;return x}),actual=actualByCategory('expense',c.id),remain=plan-actual,rate=plan>0?actual/plan*100:0;
  sumPlan+=plan;sumActual+=actual;
  return'<tr><td><span class="cat-name"><i class="category-dot small" style="background:'+COLORS[c.id]+'"></i>'+esc(c.name)+'</span></td><td class="numeric">'+fmt(plan)+'</td>'+vals.map(function(v){return'<td class="numeric">'+fmt(v)+'</td>'}).join('')+'<td class="numeric">'+fmt(actual)+'</td><td class="numeric">'+fmt(remain)+'</td><td class="rate-cell"><div class="rate-label"><span class="'+rateClass(rate)+'">'+pct(rate)+'</span><span></span></div><div class="rate-line"><span style="width:'+Math.min(Math.max(rate,0),100)+'%;background:'+COLORS[c.id]+'"></span></div></td></tr>'
 }).join('');
 document.getElementById('categoryTableBody').innerHTML=rows||'<tr><td colspan="9" class="empty-row">ยังไม่มีข้อมูล</td></tr>';
 sumActual=totalActual('expense');
 document.getElementById('categoryTableFoot').innerHTML='<tr><td>รวมรายจ่าย</td><td class="numeric">'+fmt(sumPlan)+'</td>'+quarterTotals.map(function(x){return'<td class="numeric">'+fmt(x)+'</td>'}).join('')+'<td class="numeric">'+fmt(sumActual)+'</td><td class="numeric">'+fmt(sumPlan-sumActual)+'</td><td class="rate-cell">'+(sumPlan>0?pct(sumActual/sumPlan*100):'—')+'</td></tr>';
 var note=document.getElementById('categoryQuarterNote'),source=d.sourceSummary;
 if(note)note.textContent=source&&!source.source.quartersAvailable?'ยอดใช้จริงรายหมวดนำเข้าจากชีตสรุปทั้งปี; ช่องรายไตรมาสแสดงเฉพาะรายการที่บันทึกแยกไตรมาสในระบบ':'ยอดรายไตรมาสแสดงจากรายการที่บันทึกในแต่ละไตรมาส';
}
function renderRevenueTable(){
 var d=currentData(),sPlan=0,sActual=0,qs=[0,0,0,0];
 var importedBreakdown=!d.sourceSummary||!!d.sourceSummary.incomeActual.byCategory;
 var rows=INCOME_CATEGORIES.map(function(c){
  var plan=Number(d.plan.income[c.id])||0,vals=QUARTERS.map(function(q){var a=actualByQuarter('income',q.id,c.id);qs[q.id-1]+=a;return a}),actual=actualByCategory('income',c.id);
  sPlan+=plan;sActual+=actual;
  return'<tr><td><span class="cat-name"><i class="category-dot small" style="background:'+(c.id==='service'?'#81bca5':'#b3a1cf')+'"></i>'+esc(c.name)+'</span></td><td class="numeric">'+fmt(plan)+'</td>'+vals.map(function(v){return'<td class="numeric">'+fmt(v)+'</td>'}).join('')+'<td class="numeric">'+(importedBreakdown?fmt(actual):'—')+'</td></tr>'
 }).join('');
 sActual=totalActual('income');
 document.getElementById('revenueTableBody').innerHTML=rows;
 document.getElementById('revenueTableFoot').innerHTML='<tr><td>รวมรายรับ</td><td class="numeric">'+fmt(sPlan)+'</td>'+qs.map(function(v){return'<td class="numeric">'+fmt(v)+'</td>'}).join('')+'<td class="numeric">'+fmt(sActual)+'</td></tr>';
 var note=document.getElementById('revenueTableNote');
 if(note)note.textContent=d.sourceSummary&&!importedBreakdown?'ยอดรายรับจริงรวมมาจากชีตสรุป; ต้นฉบับไม่มียอดจริงที่แยกตามหมวดซึ่งสอดคล้องกัน':'รายละเอียดรับเงินจริงสามารถบันทึกจากเมนู “ทะเบียนรายการ” แล้วเลือกประเภทรายรับและไตรมาส';
}
function renderRegisterTabs(){
 var tabs=EXPENSE_CATEGORIES.map(function(c,index){
  var count=entriesFor('expense').filter(function(x){return x.categoryId===c.id}).length;
  var active=registerCategory===c.id?' active':'';
  return'<button type="button" class="register-tab'+active+'" data-register-category="'+c.id+'" style="--register-color:'+COLORS[c.id]+'"><span class="register-index">'+String(index+1).padStart(2,'0')+'</span><span class="register-tab-name">'+esc(c.name)+'</span><span class="register-count">'+count.toLocaleString('th-TH')+'</span></button>'
 }).join('');
 var incomeCount=entriesFor('income').length;
 var incomeActive=registerCategory==='income'?' active':'';
 document.getElementById('registerCategoryTabs').innerHTML='<div class="register-expense-group"><span class="register-group-caption">ทะเบียนรายจ่าย · 5 หมวด</span><div class="register-tab-list">'+tabs+'</div></div><div class="register-income-group"><span class="register-group-caption">ทะเบียนรายรับ</span><button type="button" class="register-tab income-register-tab'+incomeActive+'" data-register-category="income"><span class="register-income-icon">฿</span><span class="register-tab-name">รายรับทั้งหมด</span><span class="register-count">'+incomeCount.toLocaleString('th-TH')+'</span></button></div>'
}
function renderRecords(){
 var isIncome=registerCategory==='income',type=isIncome?'income':'expense',selected=registerCategory;
 var query=document.getElementById('searchRecords').value.trim().toLocaleLowerCase('th-TH'),q=document.getElementById('quarterFilter').value;
 var category=isIncome?null:categoryFor('expense',selected),d=currentData();
 var rows=entriesFor(type).filter(function(x){
  if(!isIncome&&x.categoryId!==selected)return false;
  var cat=categoryFor(x.type,x.categoryId).name,text=[x.description,x.note,cat].join(' ').toLocaleLowerCase('th-TH');
  return(!query||text.indexOf(query)>=0)&&(q==='all'||String(x.quarter)===q)
 }).sort(function(a,b){return Number(b.quarter)-Number(a.quarter)||String(a.description).localeCompare(String(b.description),'th')});
 var plan=isIncome?planTotal(d.plan.income):(Number(d.plan.expense[selected])||0),actual=isIncome?totalActual('income'):actualByCategory('expense',selected),remaining=plan-actual;
 var title=isIncome?'รายรับทั้งหมด':category.name;
 document.getElementById('registerKind').textContent=isIncome?'ทะเบียนรายรับ':'ทะเบียนรายจ่าย · หมวด '+(EXPENSE_CATEGORIES.findIndex(function(c){return c.id===selected})+1);
 document.getElementById('registerCategoryTitle').textContent=title;
 document.getElementById('registerCategorySubtitle').textContent=isIncome?'รวมรายรับจากการดำเนินงานและรายรับอื่นในปีงบประมาณที่เลือก':'รายการย่อยในหมวดนี้ของปีงบประมาณ '+activeYear;
 document.getElementById('addCategoryEntryBtn').innerHTML='<span class="plus">＋</span> เพิ่มรายการใน'+(isIncome?'ทะเบียนรายรับ':'หมวดนี้');
 document.getElementById('registerStats').innerHTML='<div class="register-stat"><span>แผนทั้งปี</span><strong>'+fmt(plan)+' <small>บาท</small></strong></div><div class="register-stat"><span>'+(isIncome?'รับจริงสะสม':'ใช้จริงสะสม')+'</span><strong>'+fmt(actual)+' <small>บาท</small></strong></div><div class="register-stat"><span>'+(isIncome?'ส่วนต่างจากแผน':'งบคงเหลือ')+'</span><strong>'+fmt(remaining)+' <small>บาท</small></strong></div><div class="register-stat"><span>รายการในหมวด</span><strong>'+rows.length.toLocaleString('th-TH')+' <small>รายการ</small></strong></div>';
 document.querySelectorAll('[data-register-category]').forEach(function(btn){btn.classList.toggle('active',btn.dataset.registerCategory===registerCategory)});
 var body=document.getElementById('recordsBody');
 if(!rows.length)body.innerHTML='<tr><td colspan="7" class="empty-row">ยังไม่มีรายการในหมวดนี้ กด “เพิ่มรายการในหมวดนี้” เพื่อบันทึกข้อมูล</td></tr>';
 else body.innerHTML=rows.map(function(x){
  var cat=categoryFor(x.type,x.categoryId),kind=x.type==='income'?'รายรับ':'รายจ่าย';
  return'<tr><td>ไตรมาส '+Number(x.quarter)+'</td><td><span class="type-badge '+x.type+'">'+kind+'</span></td><td><span class="record-category">'+esc(cat.name)+'</span></td><td class="record-name">'+esc(x.description)+'</td><td class="numeric">'+fmt(x.amount)+' ฿</td><td>'+esc(x.note||'—')+'</td><td><div class="row-actions"><button class="row-action" type="button" data-edit="'+esc(x.id)+'">แก้ไข</button><button class="row-action delete" type="button" data-delete="'+esc(x.id)+'">ลบ</button></div></td></tr>'
 }).join('');
 document.getElementById('recordsCount').textContent=rows.length.toLocaleString('th-TH')+' รายการ';
}
function openSelectedEntry(){if(registerCategory==='income')openEntry(null,'income','service');else openEntry(null,'expense',registerCategory)}
function openView(name){
 document.querySelectorAll('.content-view').forEach(function(el){el.classList.toggle('active',el.id==='view-'+name);el.hidden=el.id!=='view-'+name});
 document.querySelectorAll('[data-view]').forEach(function(el){el.classList.toggle('active',el.getAttribute('data-view')===name)});
 if(name==='records')renderRecords();
}
function setCategoryChoices(type,selected){
 var list=type==='income'?INCOME_CATEGORIES:EXPENSE_CATEGORIES,sel=document.getElementById('entryCategory');
 sel.innerHTML=list.map(function(c){return'<option value="'+c.id+'">'+esc(c.name)+'</option>'}).join('');
 if(selected&&list.some(function(x){return x.id===selected}))sel.value=selected;
}
function openEntry(entry,presetType,presetCategory){
 var form=document.getElementById('entryForm');form.reset();
 var initialType=entry?entry.type:(presetType||'expense');
 document.getElementById('entryId').value=entry?entry.id:'';
 document.getElementById('entryDialogTitle').textContent=entry?'แก้ไขรายการ':'บันทึกรายการใหม่';
 document.getElementById('entryType').value=initialType;
 document.getElementById('entryQuarter').value=entry?String(entry.quarter):'1';
 setCategoryChoices(initialType,entry?entry.categoryId:presetCategory);
 document.getElementById('entryDescription').value=entry?entry.description:'';
 document.getElementById('entryAmount').value=entry?entry.amount:'';
 document.getElementById('entryNote').value=entry?entry.note||'':'';
 document.getElementById('entryDialog').showModal();
}
function openPlan(){
 var d=currentData();document.getElementById('planYearLabel').textContent=activeYear;
 document.getElementById('incomePlanFields').innerHTML=INCOME_CATEGORIES.map(function(c){return'<label class="plan-field">'+esc(c.name)+' (บาท)<input type="number" min="0" step="0.01" data-income-plan="'+c.id+'" value="'+(Number(d.plan.income[c.id])||0)+'"></label>'}).join('');
 document.getElementById('expensePlanFields').innerHTML=EXPENSE_CATEGORIES.map(function(c){return'<label class="plan-field">'+esc(c.name)+' (บาท)<input type="number" min="0" step="0.01" data-expense-plan="'+c.id+'" value="'+(Number(d.plan.expense[c.id])||0)+'"></label>'}).join('');
 document.getElementById('planDialog').showModal();
}
function newId(){return'entry-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function saveEntry(e){
 e.preventDefault();
 var id=document.getElementById('entryId').value,type=document.getElementById('entryType').value,qValue=document.getElementById('entryQuarter').value,q=qValue?Number(qValue):null,categoryId=document.getElementById('entryCategory').value,description=document.getElementById('entryDescription').value.trim(),amount=Number(document.getElementById('entryAmount').value),note=document.getElementById('entryNote').value.trim();
 if(!description||!Number.isFinite(amount)||amount<0){showToast('ตรวจสอบชื่อรายการและจำนวนเงิน');return}
 var d=currentData(),idx=d.entries.findIndex(function(x){return x.id===id});
 var existing=idx>=0?d.entries[idx]:null;
 var item=Object.assign({},existing||{},{id:id||newId(),year:activeYear,quarter:q,type:type,categoryId:categoryId,description:description,amount:amount,note:note});
 if(existing&&existing.genericImport){item.genericImport=true;if(type==='expense'){item.schemaId=genericExpenseSchema(categoryId);item.formData=genericFormData(categoryId,description)}else{delete item.schemaId;delete item.formData}}
 if(idx>=0)d.entries[idx]=item;else d.entries.push(item);
 registerCategory=type==='income'?'income':categoryId;
 persist();document.getElementById('entryDialog').close();render();showToast(idx>=0?'แก้ไขรายการแล้ว':'เพิ่มรายการแล้ว');
}
function savePlan(e){
 e.preventDefault();var d=currentData(),bad=false;
 document.querySelectorAll('[data-income-plan]').forEach(function(input){var n=Number(input.value);if(!Number.isFinite(n)||n<0){bad=true;return}d.plan.income[input.dataset.incomePlan]=n});
 document.querySelectorAll('[data-expense-plan]').forEach(function(input){var n=Number(input.value);if(!Number.isFinite(n)||n<0){bad=true;return}d.plan.expense[input.dataset.expensePlan]=n});
 if(bad){showToast('ยอดแผนต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป');return}
 persist();document.getElementById('planDialog').close();render();showToast('บันทึกแผนปี '+activeYear+' แล้ว');
}
function chooseYear(){
 var input=document.getElementById('yearInput'),year=normalizeYear(input.value);
 if(!year){showToast('กรอกปี พ.ศ. เป็นตัวเลขจำนวนเต็มที่มากกว่า 0');input.focus();return}
 var isNew=!storeData.years[year];if(isNew)storeData.years[year]=emptyYear();
 activeYear=year;input.value='';persist();render();showToast(isNew?'เพิ่มปี พ.ศ. '+year+' แล้ว':'เปิดข้อมูลปี พ.ศ. '+year+' แล้ว');
}
function deleteEntry(id){
 var d=currentData(),item=d.entries.find(function(x){return x.id===id});if(!item)return;
 if(!window.confirm('ต้องการลบรายการ “'+item.description+'” ใช่หรือไม่?'))return;
 d.entries=d.entries.filter(function(x){return x.id!==id});persist();render();showToast('ลบรายการแล้ว');
}
function csvCell(value){return'"'+String(value==null?'':value).replace(/"/g,'""')+'"'}
function exportCsv(){
 var exportRows=registerCategory==='income'?entriesFor('income'):entriesFor('expense').filter(function(x){return x.categoryId===registerCategory});
 var rows=exportRows.map(function(x){return[activeYear,x.quarter==null?'':'ไตรมาส '+x.quarter,x.type==='income'?'รายรับ':'รายจ่าย',categoryFor(x.type,x.categoryId).name,x.description,x.amount,x.note||'']});
 var content='ปีงบประมาณ,ไตรมาส,ประเภท,หมวดหมู่,รายการ,จำนวนเงิน (บาท),หมายเหตุ\r\n'+rows.map(function(r){return r.map(csvCell).join(',')}).join('\r\n');
 download('ทะเบียนเงินบำรุง-'+activeYear+'.csv','\ufeff'+content,'text/csv;charset=utf-8');
}
function exportBackup(){
 download('สำรองข้อมูลเงินบำรุง-'+activeYear+'.json',JSON.stringify({application:'Phrompiram Hospital Maintenance Fund Dashboard',version:1,activeYear:activeYear,yearData:currentData()},null,2),'application/json;charset=utf-8');
}
function download(name,text,type){
 var blob=new Blob([text],{type:type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000);showToast('ดาวน์โหลดไฟล์แล้ว');
}
function init(){
 document.querySelectorAll('[data-view]').forEach(function(btn){btn.addEventListener('click',function(){openView(btn.getAttribute('data-view'))})});
 document.querySelectorAll('[data-open-view]').forEach(function(btn){btn.addEventListener('click',function(){openView(btn.getAttribute('data-open-view'))})});
 document.getElementById('useYearBtn').addEventListener('click',chooseYear);
 document.getElementById('yearInput').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();chooseYear()}});
 document.getElementById('addEntryBtn').addEventListener('click',openSelectedEntry);
 document.getElementById('addEntryBtn2').addEventListener('click',openSelectedEntry);
 document.getElementById('addCategoryEntryBtn').addEventListener('click',openSelectedEntry);
 document.getElementById('registerCategoryTabs').addEventListener('click',function(e){var button=e.target.closest('[data-register-category]');if(!button)return;registerCategory=button.dataset.registerCategory;renderRecords()});
 document.getElementById('managePlanBtn').addEventListener('click',openPlan);
 document.getElementById('managePlanBtn2').addEventListener('click',openPlan);
 document.getElementById('entryType').addEventListener('change',function(){setCategoryChoices(this.value)});
 document.getElementById('entryForm').addEventListener('submit',saveEntry);
 document.getElementById('planForm').addEventListener('submit',savePlan);
 document.getElementById('searchRecords').addEventListener('input',renderRecords);
 document.getElementById('quarterFilter').addEventListener('change',renderRecords);
 document.getElementById('recordsHead').addEventListener('input',handleColumnFilterInput);
 document.getElementById('clearFiltersBtn').addEventListener('click',function(){document.getElementById('searchRecords').value='';document.getElementById('quarterFilter').value='all';columnFilters[activeSheetId]={};renderRecords()});
 document.getElementById('exportCsvBtn').addEventListener('click',exportCsv);
 document.getElementById('exportBtn').addEventListener('click',exportBackup);
 document.getElementById('recordsBody').addEventListener('click',function(e){
  var edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');
  if(edit){var item=currentData().entries.find(function(x){return x.id===edit.dataset.edit});if(item)openEntry(item)}
  if(del)deleteEntry(del.dataset.delete);
 });
 document.getElementById('quarterChart').addEventListener('click',function(e){var row=e.target.closest('[data-quarter]');if(row){openView('records');document.getElementById('quarterFilter').value=row.dataset.quarter;renderRecords()}});
 document.getElementById('quarterChart').addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-quarter]')){e.preventDefault();openView('records');document.getElementById('quarterFilter').value=e.target.dataset.quarter;renderRecords()}});
 document.querySelectorAll('[data-close-dialog]').forEach(function(btn){btn.addEventListener('click',function(){document.getElementById(btn.dataset.closeDialog).close()})});
 render();
}

var FISCAL_MONTHS=['ต.ค.','พ.ย.','ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.'];
var QUARTER_MONTHS={1:[0,1,2],2:[3,4,5],3:[6,7,8],4:[9,10,11]};
var SHEET_FORMS={
 personnel:[
  {id:'personnel-summary',title:'1. บุคลากร',workbook:'1.บุคลากร',categoryId:'personnel',months:true,rollupPlan:true,fields:[
   {key:'sequence',label:'ลำดับ / รหัสรายการ',type:'text'},
   {key:'item',label:'รายการค่าใช้จ่ายบุคลากร',type:'text',required:true},
   {key:'responsible',label:'ผู้บันทึก / ผู้รับผิดชอบ',type:'text'},
   {key:'headcount',label:'จำนวนอัตรา',type:'number'},
   {key:'planAmount',label:'จำนวนเงินทั้งสิ้นตามแผน (บาท)',type:'number',required:true}
  ],tableColumns:[['sequence','ลำดับ'],['item','รายการ'],['responsible','ผู้รับผิดชอบ'],['headcount','จำนวนอัตรา'],['plan','แผน (บาท)'],['actual','ใช้แล้ว (บาท)'],['balance','คงเหลือ (บาท)'],['rate','ใช้แผน']]},
  {id:'personnel-detail',title:'รายละเอียดบุคลากร',workbook:'รายละเอียดบุคลากร',collection:'employees',categoryId:'personnel',months:false,fields:[
   {key:'sequence',label:'ลำดับ / รหัสรายการ',type:'text'},
   {key:'employmentType',label:'ประเภทบุคลากร / กลุ่ม',type:'text'},
   {key:'employeeName',label:'ชื่อ–สกุล',type:'text',required:true},
   {key:'position',label:'ตำแหน่ง',type:'text',required:true},
   {key:'salaryMonthly',label:'ค่าจ้างต่อเดือน (บาท)',type:'number'},
   {key:'salaryYearly',label:'ค่าจ้างต่อปี (บาท)',type:'number'},
   {key:'socialSecurityMonthly',label:'ประกันสังคมต่อเดือน (บาท)',type:'number'},
   {key:'socialSecurityYearly',label:'ประกันสังคมต่อปี (บาท)',type:'number'},
   {key:'retirementMonthly',label:'กองทุนสำรองเลี้ยงชีพต่อเดือน (บาท)',type:'number'},
   {key:'retirementYearly',label:'กองทุนสำรองเลี้ยงชีพต่อปี (บาท)',type:'number'},
   {key:'compensationMonthly',label:'กองทุนทดแทนต่อเดือน (บาท)',type:'number'},
   {key:'compensationYearly',label:'กองทุนทดแทนต่อปี (บาท)',type:'number'}
  ],tableColumns:[['sequence','ลำดับ'],['employmentType','ประเภทบุคลากร / กลุ่ม'],['employeeName','ชื่อ–สกุล'],['position','ตำแหน่ง'],['salaryYearly','ค่าจ้างต่อปี'],['socialSecurityYearly','ประกันสังคมต่อปี'],['retirementYearly','กองทุนสำรองต่อปี'],['compensationYearly','กองทุนทดแทนต่อปี']]},
 ],
 operating:[
  {id:'compensation',title:'2.1 ค่าตอบแทน',workbook:'2.1ค่าตอบแทน',categoryId:'operating',months:true,rollupPlan:true,fields:[
   {key:'sequence',label:'ลำดับ / รหัสรายการ',type:'text'},
   {key:'item',label:'รายการค่าตอบแทน',type:'text',required:true},
   {key:'responsible',label:'ผู้รับผิดชอบ',type:'text'},
   {key:'planAmount',label:'จำนวนเงินทั้งสิ้นตามแผน (บาท)',type:'number',required:true}
  ],tableColumns:[['sequence','ลำดับ'],['item','รายการ'],['responsible','ผู้รับผิดชอบ'],['plan','จำนวนเงินทั้งสิ้น'],['actual','รวมงบที่ใช้'],['balance','งบที่เหลือ'],['rate','ร้อยละการใช้']]},
  {id:'expense-items',title:'2.2 ค่าใช้สอย',workbook:'2.2(สรุป)ค่าใช้สอย',categoryId:'operating',months:true,rollupPlan:true,fields:[
   {key:'sequence',label:'ลำดับ / รหัสรายการ',type:'text'},
   {key:'item',label:'รายการค่าใช้สอย',type:'text',required:true},
   {key:'groupName',label:'กลุ่มงาน / หน่วยงาน',type:'text'},
   {key:'recorder',label:'ผู้บันทึก',type:'text'},
   {key:'planAmount',label:'จำนวนเงินทั้งสิ้นตามแผน (บาท)',type:'number',required:true}
  ],tableColumns:[['sequence','ลำดับ'],['item','รายการ'],['groupName','กลุ่มงาน / หน่วยงาน'],['recorder','ผู้บันทึก'],['plan','จำนวนทั้งสิ้น'],['actual','รวมงบที่ใช้'],['balance','งบที่เหลือ'],['rate','ร้อยละการใช้']]},
  {id:'materials',title:'2.3 ค่าวัสดุ',workbook:'2.3ค่าวัสดุ',categoryId:'operating',months:true,rollupPlan:true,fields:[
   {key:'sequence',label:'ลำดับ / รหัสรายการ',type:'text'},
   {key:'item',label:'ประเภทวัสดุ',type:'text',required:true},
   {key:'detail',label:'รายการย่อย / กลุ่มงาน',type:'text'},
   {key:'responsible',label:'ผู้รับผิดชอบ',type:'text'},
   {key:'planAmount',label:'จำนวนเงินทั้งสิ้นตามแผน (บาท)',type:'number',required:true}
  ],tableColumns:[['sequence','ลำดับ'],['item','ประเภทวัสดุ'],['detail','รายการย่อย / กลุ่มงาน'],['responsible','ผู้รับผิดชอบ'],['plan','จำนวนเงินทั้งสิ้น'],['actual','รวมงบประมาณที่ใช้'],['balance','งบประมาณที่เหลือ'],['rate','ร้อยละการใช้']]},
  {id:'utilities',title:'2.4 ค่าสาธารณูปโภค',workbook:'2.4ค่าสาธารณูปโภค',categoryId:'operating',months:true,rollupPlan:true,fields:[
   {key:'sequence',label:'ลำดับ / รหัสรายการ',type:'text'},
   {key:'item',label:'รายการสาธารณูปโภค',type:'select',required:true,options:['ค่าไฟฟ้า','ค่าประปา','ค่าบริการโทรศัพท์','ค่าบริการไปรษณีย์','ค่าอินเตอร์เน็ต','ค่าสาธารณูปโภคอื่น']},
   {key:'provider',label:'ผู้ให้บริการ / รายละเอียด',type:'text'},
   {key:'responsible',label:'ผู้รับผิดชอบ',type:'text'},
   {key:'planAmount',label:'จำนวนเงินทั้งสิ้นตามแผน (บาท)',type:'number',required:true}
  ],tableColumns:[['sequence','ลำดับ'],['item','รายการ'],['provider','ผู้ให้บริการ / รายละเอียด'],['responsible','ผู้รับผิดชอบ'],['plan','จำนวนเงินทั้งสิ้น'],['actual','รวมงบประมาณที่ใช้'],['balance','งบประมาณที่เหลือ'],['rate','ร้อยละการใช้']]},
  {id:'operation-projects',title:'2.5 งบดำเนินงานอื่น',workbook:'2.5 งบดำเนินงาน',categoryId:'operating',months:true,rollupPlan:true,fields:[
   {key:'sequence',label:'ลำดับ / รหัสรายการ',type:'text'},
   {key:'project',label:'โครงการ / รายการ',type:'text',required:true},
   {key:'workType',label:'ประเภทงาน (5E / งานประจำ / อื่น ๆ)',type:'text'},
   {key:'responsible',label:'ผู้รับผิดชอบ',type:'text'},
   {key:'subdistrictFund',label:'งบโอนจากกองทุนตำบล (บาท)',type:'number'},
   {key:'maintenanceFund',label:'เงินบำรุงโรงพยาบาล (บาท)',type:'number'}
  ],tableColumns:[['sequence','ลำดับ'],['project','โครงการ / รายการ'],['workType','ประเภทงาน'],['responsible','ผู้รับผิดชอบ'],['plan','รวมงบประมาณ'],['actual','ใช้จริง'],['balance','คงเหลือ'],['rate','ร้อยละการใช้']]},
 ],
 investment:[
  {id:'investment',title:'3. งบลงทุน',workbook:'3.งบลงทุน',categoryId:'investment',months:true,rollupPlan:true,fields:[
   {key:'sequence',label:'ลำดับ / รหัสรายการ',type:'text'},
   {key:'item',label:'รายการครุภัณฑ์ / สิ่งก่อสร้าง',type:'text',required:true},
   {key:'department',label:'กลุ่มงาน',type:'text'},
   {key:'recorder',label:'ผู้บันทึก',type:'text'},
   {key:'unitPrice',label:'ราคาต่อหน่วย (บาท)',type:'number',required:true},
   {key:'quantity',label:'จำนวน',type:'number',required:true},
   {key:'unit',label:'หน่วยนับ',type:'text'},
   {key:'fundSource',label:'แหล่งเงิน',type:'select',options:['งบค่าเสื่อม','งบบริจาค','เงินบำรุง','กองทุนตำบล','อื่น ๆ']},
   {key:'budgetType',label:'ประเภทงบ',type:'select',options:['ครุภัณฑ์','สิ่งก่อสร้าง']},
   {key:'requestType',label:'คำขอ',type:'select',options:['ขอใหม่','ทดแทน']},
   {key:'replacementCode',label:'รหัสครุภัณฑ์กรณีทดแทน',type:'text'},
   {key:'note',label:'หมายเหตุ',type:'textarea',wide:true},
   {key:'policyAlignment',label:'สอดคล้องนโยบายด้านใด',type:'text',wide:true}
  ],tableColumns:[['sequence','ลำดับ'],['item','รายการ'],['department','กลุ่มงาน'],['unitPrice','ราคาต่อหน่วย'],['quantity','จำนวน'],['unit','หน่วย'],['plan','รวมเป็นเงิน'],['fundSource','แหล่งเงิน'],['budgetType','ประเภทงบ'],['actual','ใช้จริง'],['balance','คงเหลือ']]},
 ],
 support:[
  {id:'support',title:'4. รายจ่ายสนับสนุน',workbook:'4.รายจ่ายสนับสนุน',categoryId:'support',months:true,rollupPlan:true,fields:[
   {key:'sequence',label:'ลำดับ / รหัสรายการ',type:'text'},
   {key:'item',label:'รายการสนับสนุน',type:'text',required:true},
   {key:'parentItem',label:'รายการ / หมวดหลัก',type:'text'},
   {key:'responsible',label:'ผู้รับผิดชอบ',type:'text'},
   {key:'necessity',label:'เหตุผลความจำเป็น',type:'textarea',wide:true},
   {key:'planAmount',label:'จำนวนเงินทั้งสิ้นตามแผน (บาท)',type:'number',required:true}
  ],tableColumns:[['sequence','ลำดับ'],['item','รายการ'],['parentItem','รายการ / หมวดหลัก'],['responsible','ผู้รับผิดชอบ'],['necessity','เหตุผลความจำเป็น'],['plan','จำนวนเงินทั้งสิ้น'],['actual','รวมงบประมาณที่ใช้'],['balance','งบประมาณที่เหลือ'],['rate','ร้อยละการใช้']]},
 ],
 central:[
  {id:'central',title:'5. งบกลาง',workbook:'5.งบกลาง',categoryId:'central',months:true,rollupPlan:true,fields:[
   {key:'sequence',label:'ลำดับ / รหัสรายการ',type:'text'},
   {key:'item',label:'รายการงบกลาง',type:'text',required:true},
   {key:'responsible',label:'ผู้รับผิดชอบ',type:'text'},
   {key:'necessity',label:'เหตุผลความจำเป็น',type:'textarea',wide:true},
   {key:'planAmount',label:'จำนวนเงินทั้งสิ้นตามแผน (บาท)',type:'number',required:true}
  ],tableColumns:[['sequence','ลำดับ'],['item','รายการ'],['responsible','ผู้รับผิดชอบ'],['necessity','เหตุผลความจำเป็น'],['plan','จำนวนเงินทั้งสิ้น'],['actual','รวมงบประมาณที่ใช้'],['balance','งบประมาณที่เหลือ'],['rate','ร้อยละการใช้']]},
 ],
 income:[
  {id:'unallocated-funds',title:'เงินกองทุนรอจัดสรร',workbook:'เงินกองทุนรอจัดสรร',collection:'funds',categoryId:'income',months:false,fields:[
   {key:'source',label:'แหล่งเงินกองทุน',type:'select',required:true,options:['เงินกองทุนหลักประกันสุขภาพถ้วนหน้า UC','เงินกองทุนประกันสังคม','เงินกองทุนแรงงานต่างด้าว','กองทุนอื่น']},
   {key:'allocationYear',label:'ปี พ.ศ. ของยอดเงิน',type:'text',required:true},
   {key:'amount',label:'จำนวนเงิน (บาท)',type:'number',required:true},
   {key:'reason',label:'คำชี้แจงและเหตุผล',type:'textarea',wide:true}
  ],tableColumns:[['source','รายการกองทุน'],['allocationYear','ปี พ.ศ.'],['amount','จำนวนเงิน'],['reason','คำชี้แจงและเหตุผล']]}
 ]
};
var activeSheetId='expense-items';
var SHEET_BY_ID={};
Object.keys(SHEET_FORMS).forEach(function(category){SHEET_FORMS[category].forEach(function(spec){SHEET_BY_ID[spec.id]=spec})});
function sheetsForCategory(category){if(category==='income')return[{id:'income-transactions',title:'รายการรับเงินจริง',workbook:'DB / แผนรายรับรายจ่าย',mode:'income'}].concat(SHEET_FORMS.income);return SHEET_FORMS[category]||[]}
function sheetSpec(id){if(id==='income-transactions')return{id:id,title:'รายการรับเงินจริง',workbook:'DB / แผนรายรับรายจ่าย',mode:'income'};return SHEET_BY_ID[id]||null}
function emptyYear(){return{schemaVersion:3,plan:{income:{service:0,other:0},expense:{personnel:0,operating:0,investment:0,support:0,central:0}},entries:[],employees:[],funds:[]}}
function migrateYear(d,year){
 if(!d.plan)d.plan=emptyYear().plan;
 if(!d.plan.income)d.plan.income={service:0,other:0};
 if(!d.plan.expense)d.plan.expense=emptyYear().plan.expense;
 if(!d.entries)d.entries=[];
 if(!d.employees)d.employees=[];
 if(!d.funds)d.funds=[];
 d.entries.forEach(function(x){
  if(x.year===undefined||x.year===null)x.year=year;
  if(x.type!=='expense'||x.schemaId)return;
  var title=String(x.description||'');
  if(title.indexOf('ค่าใช้สอย')===0){x.schemaId='expense-items';x.formData={item:title,groupName:'',recorder:'',planAmount:0};x.months=[258193.66,122166.66,0,0,0,0,0,0,0,0,0,0]}
  else if(title.indexOf('ค่าวัสดุ')===0){x.schemaId='materials';x.formData={item:title,detail:'',responsible:'',planAmount:0};x.months=[287879.8,64450,0,0,0,0,0,0,0,0,0,0]}
  else if(title.indexOf('ค่าสาธารณูปโภค')===0){x.schemaId='utilities';x.formData={item:'ค่าสาธารณูปโภคอื่น',provider:title,responsible:'',planAmount:0};x.months=[449230.33,0,0,0,0,0,0,0,0,0,0,0]}
 });
 var workbookSeed=window.WORKBOOK_SEED;
 if(workbookSeed&&String(workbookSeed.year)===String(year)&&Number(d.workbookSeedVersion||0)<Number(workbookSeed.version||1)){
  d.entries=d.entries.filter(function(x){return!String(x.id||'').startsWith('source-2570-q1-')&&x.sourceSeed!=='workbook-2570-v1'});
  workbookSeed.records.forEach(function(x){if(d.entries.some(function(existing){return existing.id===x.id}))return;var imported=clone(x);imported.year=String(year);d.entries.push(imported)});
  d.workbookSeedVersion=Number(workbookSeed.version)||1;
 }
 d.schemaVersion=4;
 return d
}
function currentData(){
 if(!storeData.years[activeYear])storeData.years[activeYear]=emptyYear();
 var before=storeData.years[activeYear],beforeVersion=Number(before.workbookSeedVersion||0);
 var d=migrateYear(before,activeYear);storeData.years[activeYear]=d;
 if(beforeVersion<Number(d.workbookSeedVersion||0))persist();
 return d
}
function entryActual(x){if(Array.isArray(x.months))return x.months.reduce(function(a,v){return a+(v===null||v===''||v===undefined?0:(Number(v)||0))},0);return Number(x.amount)||0}
function actualByQuarter(type,quarter,categoryId){
 var months=QUARTER_MONTHS[Number(quarter)]||[];
 return entriesFor(type).filter(function(x){return!categoryId||x.categoryId===categoryId}).reduce(function(sum,x){
  if(Array.isArray(x.months))return sum+months.reduce(function(a,i){var v=x.months[i];return a+(v===null||v===''||v===undefined?0:(Number(v)||0))},0);
  return sum+(Number(x.quarter)===Number(quarter)?(Number(x.amount)||0):0)
 },0)
}
function totalActual(type){
 var d=currentData(),summary=d.sourceSummary&&(type==='income'?d.sourceSummary.incomeActual:d.sourceSummary.expenseActual),baseline=summary&&Number.isFinite(Number(summary.total))?Number(summary.total):0;
 return baseline+entriesFor(type).reduce(function(s,x){return s+entryActual(x)},0)
}
function actualByCategory(type,categoryId){
 var d=currentData(),summary=d.sourceSummary&&(type==='income'?d.sourceSummary.incomeActual:d.sourceSummary.expenseActual),byCategory=summary&&summary.byCategory;
 var baseline=byCategory&&Number.isFinite(Number(byCategory[categoryId]))?Number(byCategory[categoryId]):0;
 return baseline+entriesFor(type).filter(function(x){return x.categoryId===categoryId}).reduce(function(s,x){return s+entryActual(x)},0)
}
function comparisonData(year){
 var d=storeData.years[year]||emptyYear();d=migrateYear(d,year);storeData.years[year]=d;
 var entries=d.entries||[],summary=d.sourceSummary||null;
 function annual(type){
  var imported=summary&&(type==='income'?summary.incomeActual:summary.expenseActual),value=imported&&Number.isFinite(Number(imported.total))?Number(imported.total):0;
  return value+entries.filter(function(x){return x.type===type}).reduce(function(s,x){return s+entryActual(x)},0)
 }
 function categoryActual(type,id){
  var imported=summary&&(type==='income'?summary.incomeActual:summary.expenseActual),byCat=imported&&imported.byCategory,value=byCat&&Number.isFinite(Number(byCat[id]))?Number(byCat[id]):0;
  return value+entries.filter(function(x){return x.type===type&&x.categoryId===id}).reduce(function(s,x){return s+entryActual(x)},0)
 }
 return{data:d,plan:d.plan||emptyYear().plan,incomeActual:annual('income'),expenseActual:annual('expense'),incomeByCategory:categoryActual,expenseByCategory:categoryActual}
}
function renderComparison(){
 var host=document.getElementById('compareYearOptions');if(!host)return;
 var available=sortedYears();
 if(!compareYears){compareYears=available.slice();compareKnownYears=available.slice()}
 compareYears=compareYears.filter(function(y){return available.indexOf(y)>=0});
 available.forEach(function(y){if(compareKnownYears.indexOf(y)<0){compareYears.push(y);compareKnownYears.push(y)}});
 host.innerHTML=available.map(function(y){return'<label class="compare-year-option"><input type="checkbox" data-compare-year="'+esc(y)+'"'+(compareYears.indexOf(y)>=0?' checked':'')+'><span>พ.ศ. '+esc(y)+'</span></label>'}).join('')+'<button type="button" class="compare-select-all" data-compare-all>เลือกทุกปี</button>';
 var years=compareYears.slice().sort(function(a,b){return BigInt(a)<BigInt(b)?-1:BigInt(a)>BigInt(b)?1:0});
 var metrics=years.map(function(y){return{year:y,view:comparisonData(y)}}),rows=[
  {label:'รายรับรวม',type:'income',category:null},
  {label:'รายจ่ายบุคลากร',type:'expense',category:'personnel'},
  {label:'รายจ่ายจากการดำเนินงาน',type:'expense',category:'operating'},
  {label:'รายจ่ายลงทุน',type:'expense',category:'investment'},
  {label:'รายจ่ายสนับสนุน',type:'expense',category:'support'},
  {label:'งบกลาง',type:'expense',category:'central'},
  {label:'รวมรายจ่าย 5 หมวด',type:'expense',category:null,total:true},
  {label:'รายรับสุทธิหลังหักรายจ่าย',type:'net',category:null,total:true}
 ];
 var table=document.getElementById('compareTable');
 var head='<thead><tr><th rowspan="2">รายการ</th>'+metrics.map(function(m){return'<th class="compare-year-head" colspan="3">พ.ศ. '+esc(m.year)+'</th>'}).join('')+'</tr><tr>'+metrics.map(function(){return'<th class="numeric">แผน</th><th class="numeric">จริง</th><th class="numeric">ผลต่าง</th>'}).join('')+'</tr></thead>';
 var body='<tbody>'+rows.map(function(row){var cls=row.total?' class="compare-total-row"':'';return'<tr'+cls+'><td>'+esc(row.label)+'</td>'+metrics.map(function(m){var v=m.view,plan=0,actual=0;if(row.type==='net'){plan=planTotal(v.plan.income)-planTotal(v.plan.expense);actual=v.incomeActual-v.expenseActual}else if(row.type==='income'){plan=planTotal(v.plan.income);actual=v.incomeActual}else if(row.category){plan=Number(v.plan.expense[row.category])||0;actual=v.expenseByCategory('expense',row.category)}else{plan=planTotal(v.plan.expense);actual=v.expenseActual}return'<td class="numeric">'+fmt(plan)+'</td><td class="numeric">'+fmt(actual)+'</td><td class="numeric compare-delta '+(actual-plan>0?'over-plan':actual-plan<0?'under-plan':'')+'">'+fmt(actual-plan)+'</td>'}).join('')+'</tr>'}).join('')+'</tbody>';
 table.innerHTML=head+body;
 var max=Math.max(1,...metrics.map(function(m){return m.view.expenseActual}));
 document.getElementById('compareExpenseChart').innerHTML=metrics.length?metrics.map(function(m){var total=m.view.expenseActual,percent=Math.max(0,total/max*100);return'<div class="compare-bar-row"><span class="compare-bar-year">พ.ศ. '+esc(m.year)+'</span><div class="compare-bar-track"><span style="width:'+percent+'%"></span></div><strong>'+fmt(total)+' บาท</strong></div>'}).join(''):'<p class="empty-row">เลือกปีอย่างน้อยหนึ่งปี</p>';
 document.getElementById('compareSourceNotes').innerHTML=metrics.length?metrics.map(function(m){var source=m.view.data.sourceSummary,files=source&&source.source.files||[],notes=source&&source.source.notes||[];if(!source)return'<section class="source-year-note"><h4>พ.ศ. '+esc(m.year)+'</h4><p>ข้อมูลจากรายการที่บันทึกใน dashboard'+(m.year==='2570'?' และรายการที่นำเข้าจากไฟล์แผน 2570':'')+'; ยอดจริงรวม '+fmt(m.view.incomeActual+m.view.expenseActual)+' บาท</p></section>';return'<section class="source-year-note"><h4>พ.ศ. '+esc(m.year)+'</h4><p><strong>ไฟล์:</strong> '+esc(files.join(', '))+'</p><p><strong>ชีตรายรับ:</strong> '+esc(source.source.incomeSheet||'—')+' · <strong>ชีตรายจ่าย:</strong> '+esc(source.source.expenseSheet||'—')+'</p><p><strong>ความละเอียด:</strong> '+(source.source.quartersAvailable?'มีข้อมูลรายไตรมาส':'นำเข้ายอดจริงรวมทั้งปี ไม่มีการกระจายยอดลงไตรมาส')+'</p>'+(notes.length?'<ul>'+notes.map(function(note){return'<li>'+esc(note)+'</li>'}).join('')+'</ul>':'')+'</section>'}).join(''):'<p class="empty-row">เลือกปีอย่างน้อยหนึ่งปีเพื่อดูแหล่งข้อมูล</p>';
}
function exportComparisonCsv(){
 var years=(compareYears||sortedYears()).slice().sort(function(a,b){return BigInt(a)<BigInt(b)?-1:BigInt(a)>BigInt(b)?1:0});
 var rows=[['ปี พ.ศ.','รายการ','แผน (บาท)','จริง (บาท)','ผลต่าง (บาท)']];
 years.forEach(function(year){var v=comparisonData(year),items=[['รายรับรวม',planTotal(v.plan.income),v.incomeActual],['รายจ่ายบุคลากร',v.plan.expense.personnel,v.expenseByCategory('expense','personnel')],['รายจ่ายจากการดำเนินงาน',v.plan.expense.operating,v.expenseByCategory('expense','operating')],['รายจ่ายลงทุน',v.plan.expense.investment,v.expenseByCategory('expense','investment')],['รายจ่ายสนับสนุน',v.plan.expense.support,v.expenseByCategory('expense','support')],['งบกลาง',v.plan.expense.central,v.expenseByCategory('expense','central')],['รวมรายจ่าย 5 หมวด',planTotal(v.plan.expense),v.expenseActual],['รายรับสุทธิหลังหักรายจ่าย',planTotal(v.plan.income)-planTotal(v.plan.expense),v.incomeActual-v.expenseActual]];items.forEach(function(item){rows.push([year,item[0],item[1],item[2],item[2]-item[1]])})});
 var content=rows.map(function(row){return row.map(csvCell).join(',')}).join('\r\n');download('เปรียบเทียบเงินบำรุง-'+years.join('_')+'.csv','\ufeff'+content,'text/csv;charset=utf-8')
}
function excelColumn(index){var name='';for(index++;index>0;index=Math.floor((index-1)/26))name=String.fromCharCode(65+(index-1)%26)+name;return name}
function xmlEscape(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function sheetXml(rows){
 var width=Math.max(1,...rows.map(function(row){return row.length})),last=excelColumn(width-1)+(rows.length||1);
 var cols='<cols>'+Array.from({length:width},function(_,i){var longest=0;rows.forEach(function(row){longest=Math.max(longest,String(row[i]==null?'':row[i]).length)});return'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+Math.max(12,Math.min(38,longest+2))+'" customWidth="1"/>'}).join('')+'</cols>';
 var body=rows.map(function(row,r){var cells=row.map(function(value,c){var ref=excelColumn(c)+(r+1),style=r===0?' s="1"':'';if(typeof value==='number'&&Number.isFinite(value))return'<c r="'+ref+'"'+style+'><v>'+value+'</v></c>';return'<c r="'+ref+'" t="inlineStr"'+style+'><is><t xml:space="preserve">'+xmlEscape(value)+'</t></is></c>'}).join('');return'<row r="'+(r+1)+'">'+cells+'</row>'}).join('');
 return'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:'+last+'"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="19"/>'+cols+'<sheetData>'+body+'</sheetData><autoFilter ref="A1:'+last+'"/></worksheet>'
}
function crc32(bytes){var crc=0xffffffff;for(var i=0;i<bytes.length;i++){crc^=bytes[i];for(var j=0;j<8;j++)crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1}return(crc^0xffffffff)>>>0}
function setZip16(bytes,offset,value){new DataView(bytes.buffer).setUint16(offset,value,true)}
function setZip32(bytes,offset,value){new DataView(bytes.buffer).setUint32(offset,value>>>0,true)}
function joinBytes(parts){var total=parts.reduce(function(sum,part){return sum+part.length},0),output=new Uint8Array(total),offset=0;parts.forEach(function(part){output.set(part,offset);offset+=part.length});return output}
function zipStored(files){
 var encoder=new TextEncoder(),locals=[],centrals=[],offset=0;
 files.forEach(function(file){var name=encoder.encode(file.name),data=encoder.encode(file.text),crc=crc32(data),local=new Uint8Array(30+name.length+data.length);setZip32(local,0,0x04034b50);setZip16(local,4,20);setZip16(local,6,0x0800);setZip16(local,8,0);setZip16(local,10,0);setZip16(local,12,33);setZip32(local,14,crc);setZip32(local,18,data.length);setZip32(local,22,data.length);setZip16(local,26,name.length);setZip16(local,28,0);local.set(name,30);local.set(data,30+name.length);locals.push(local);
  var central=new Uint8Array(46+name.length);setZip32(central,0,0x02014b50);setZip16(central,4,20);setZip16(central,6,20);setZip16(central,8,0x0800);setZip16(central,10,0);setZip16(central,12,0);setZip16(central,14,33);setZip32(central,16,crc);setZip32(central,20,data.length);setZip32(central,24,data.length);setZip16(central,28,name.length);setZip16(central,30,0);setZip16(central,32,0);setZip16(central,34,0);setZip16(central,36,0);setZip32(central,38,0);setZip32(central,42,offset);central.set(name,46);centrals.push(central);offset+=local.length;
 });
 var directory=joinBytes(centrals),end=new Uint8Array(22);setZip32(end,0,0x06054b50);setZip16(end,4,0);setZip16(end,6,0);setZip16(end,8,files.length);setZip16(end,10,files.length);setZip32(end,12,directory.length);setZip32(end,16,offset);setZip16(end,20,0);return joinBytes(locals.concat([directory,end]))
}
function xlsxStyles(){return'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF49A985"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'}
function xlsxPackage(sheets){
 var files=[],sheetOverrides=sheets.map(function(_,i){return'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'}).join('');
 files.push({name:'[Content_Types].xml',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheetOverrides+'</Types>'});
 files.push({name:'_rels/.rels',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'});
 files.push({name:'xl/workbook.xml',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map(function(s,i){return'<sheet name="'+xmlEscape(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>'}).join('')+'</sheets></workbook>'});
 files.push({name:'xl/_rels/workbook.xml.rels',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map(function(_,i){return'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>'}).join('')+'<Relationship Id="rId'+(sheets.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'});
 files.push({name:'xl/styles.xml',text:xlsxStyles()});sheets.forEach(function(s,i){files.push({name:'xl/worksheets/sheet'+(i+1)+'.xml',text:sheetXml(s.rows)})});return zipStored(files)
}
function downloadExcel(){
 var years=sortedYears(),overview=[['ปี พ.ศ.','แผนรายรับ','รับจริง','บุคลากร · แผน','บุคลากร · จริง','ดำเนินงาน · แผน','ดำเนินงาน · จริง','ลงทุน · แผน','ลงทุน · จริง','สนับสนุน · แผน','สนับสนุน · จริง','งบกลาง · แผน','งบกลาง · จริง','รวมแผนรายจ่าย','รวมจ่ายจริง','งบคงเหลือ']],comparison=[['ปี พ.ศ.','หมวดรายการ','แผน (บาท)','จริง (บาท)','ผลต่าง (บาท)']],registry=[['ปี พ.ศ.','ประเภท','หมวดหมู่','ไตรมาส','รายการ','จำนวนเงิน (บาท)','หมายเหตุ','รหัสแบบฟอร์ม','ข้อมูลแบบฟอร์ม JSON','ยอดรายเดือน JSON']],employees=[['ปี พ.ศ.','ข้อมูลบุคลากร JSON']],funds=[['ปี พ.ศ.','ข้อมูลกองทุน JSON']],backup=[['ปี พ.ศ.','ชนิดข้อมูล','ข้อมูล JSON']];
 years.forEach(function(year){var v=comparisonData(year),p=v.plan.expense,a=v.expenseByCategory;overview.push([Number(year),planTotal(v.plan.income),v.incomeActual,p.personnel,a('expense','personnel'),p.operating,a('expense','operating'),p.investment,a('expense','investment'),p.support,a('expense','support'),p.central,a('expense','central'),planTotal(p),v.expenseActual,planTotal(p)-v.expenseActual]);
  var summaryRows=[['รายรับรวม',planTotal(v.plan.income),v.incomeActual],['รายจ่ายบุคลากร',p.personnel,a('expense','personnel')],['รายจ่ายจากการดำเนินงาน',p.operating,a('expense','operating')],['รายจ่ายลงทุน',p.investment,a('expense','investment')],['รายจ่ายสนับสนุน',p.support,a('expense','support')],['งบกลาง',p.central,a('expense','central')],['รวมรายจ่าย 5 หมวด',planTotal(p),v.expenseActual],['รายรับสุทธิหลังหักรายจ่าย',planTotal(v.plan.income)-planTotal(p),v.incomeActual-v.expenseActual]];summaryRows.forEach(function(r){comparison.push([Number(year),r[0],r[1],r[2],r[2]-r[1]])});
  var d=v.data,meta=clone(d);delete meta.entries;delete meta.employees;delete meta.funds;backup.push([Number(year),'meta',JSON.stringify(meta)]);
  (d.entries||[]).forEach(function(x){registry.push([Number(year),x.type==='income'?'รายรับ':'รายจ่าย',categoryFor(x.type,x.categoryId).name,x.quarter==null?'':Number(x.quarter),x.description,x.amount,x.note||'',x.schemaId||'',JSON.stringify(x.formData||{}),JSON.stringify(x.months||null)]);backup.push([Number(year),'entry',JSON.stringify(x)])});
  (d.employees||[]).forEach(function(x){employees.push([Number(year),JSON.stringify(x)]);backup.push([Number(year),'employee',JSON.stringify(x)])});
  (d.funds||[]).forEach(function(x){funds.push([Number(year),JSON.stringify(x)]);backup.push([Number(year),'fund',JSON.stringify(x)])});
 });
 var bytes=xlsxPackage([{name:'ภาพรวม',rows:overview},{name:'เปรียบเทียบ',rows:comparison},{name:'ทะเบียน',rows:registry},{name:'บุคลากร',rows:employees},{name:'กองทุน',rows:funds},{name:'Dashboard Backup',rows:backup}]);
 var blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='dashboard-เงินบำรุง-ทุกปี.xlsx';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1500);showToast('ส่งออกไฟล์ Excel ทุกปีแล้ว')
}
async function inflateXlsx(bytes){
 if(!window.DecompressionStream)throw new Error('เบราว์เซอร์นี้ยังไม่รองรับการอ่านไฟล์ Excel ที่บีบอัด');
 var stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
 return new Uint8Array(await new Response(stream).arrayBuffer())
}
async function unzipXlsx(buffer){
 var bytes=new Uint8Array(buffer),view=new DataView(buffer),end=-1,start=Math.max(0,bytes.length-65558);
 for(var i=bytes.length-22;i>=start;i--){if(view.getUint32(i,true)===0x06054b50){end=i;break}}
 if(end<0)throw new Error('ไม่พบโครงสร้างไฟล์ .xlsx');
 var count=view.getUint16(end+10,true),offset=view.getUint32(end+16,true),files=new Map(),decoder=new TextDecoder();
 for(var n=0;n<count;n++){
  if(view.getUint32(offset,true)!==0x02014b50)throw new Error('ไฟล์ Excel มีโครงสร้าง ZIP ไม่ถูกต้อง');
  var method=view.getUint16(offset+10,true),compressed=view.getUint32(offset+20,true),nameLength=view.getUint16(offset+28,true),extraLength=view.getUint16(offset+30,true),commentLength=view.getUint16(offset+32,true),localOffset=view.getUint32(offset+42,true),name=decoder.decode(bytes.subarray(offset+46,offset+46+nameLength));
  var localNameLength=view.getUint16(localOffset+26,true),localExtraLength=view.getUint16(localOffset+28,true),dataStart=localOffset+30+localNameLength+localExtraLength,compressedBytes=bytes.subarray(dataStart,dataStart+compressed),content;
  if(method===0)content=compressedBytes;else if(method===8)content=await inflateXlsx(compressedBytes);else throw new Error('ไม่รองรับวิธีบีบอัดในไฟล์ Excel');
  files.set(name,decoder.decode(content));offset+=46+nameLength+extraLength+commentLength
 }
 return files
}
function parseXml(text){var doc=new DOMParser().parseFromString(text,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw new Error('อ่านโครงสร้าง XML ในไฟล์ Excel ไม่สำเร็จ');return doc}
function xmlNodes(node,name){return Array.from(node.getElementsByTagNameNS('*',name))}
function parseXlsxSheets(files){
 var workbookText=files.get('xl/workbook.xml'),relsText=files.get('xl/_rels/workbook.xml.rels');if(!workbookText||!relsText)throw new Error('ไฟล์นี้ไม่มีสมุดงาน Excel ที่อ่านได้');
 var workbook=parseXml(workbookText),rels=parseXml(relsText),relationshipMap={};
 xmlNodes(rels,'Relationship').forEach(function(r){relationshipMap[r.getAttribute('Id')]=r.getAttribute('Target')});
 var shared=[],sharedText=files.get('xl/sharedStrings.xml');
 if(sharedText)xmlNodes(parseXml(sharedText),'si').forEach(function(si){shared.push(xmlNodes(si,'t').map(function(t){return t.textContent}).join(''))});
 return xmlNodes(workbook,'sheet').map(function(sheet){
  var target=relationshipMap[sheet.getAttribute('r:id')];if(!target) return{name:sheet.getAttribute('name'),rows:[]};
  target=target.replace(/^\//,'');if(target.indexOf('xl/')!==0)target='xl/'+target;
  var xml=files.get(target);if(!xml)return{name:sheet.getAttribute('name'),rows:[]};
  var doc=parseXml(xml),rows=xmlNodes(doc,'row').map(function(row){
   var values=[];
   values._rowNumber=Number(row.getAttribute('r'))||0;
   xmlNodes(row,'c').forEach(function(cell){var ref=cell.getAttribute('r')||'',match=ref.match(/^([A-Z]+)/),column=0;if(match){for(var k=0;k<match[1].length;k++)column=column*26+match[1].charCodeAt(k)-64;column--}
    var type=cell.getAttribute('t'),value='';
    if(type==='inlineStr')value=xmlNodes(cell,'t').map(function(t){return t.textContent}).join('');
    else{var v=xmlNodes(cell,'v')[0];value=v?v.textContent:'';if(type==='s')value=shared[Number(value)]||''}
    values[column]=value
   });return values
  });
  return{name:sheet.getAttribute('name'),rows:rows}
 })
}
function normHeader(value){return String(value||'').toLocaleLowerCase('th-TH').replace(/[\s._()\-\/]+/g,'')}
function columnByAliases(headers,aliases){return headers.findIndex(function(header){var h=normHeader(header);return aliases.some(function(a){return h.indexOf(normHeader(a))>=0})})}
function genericExpenseSchema(category){
 return{personnel:'personnel-summary',operating:'expense-items',investment:'investment',support:'support',central:'central'}[category]||'expense-items'
}
function genericFormData(category,description){
 if(category==='investment')return{sequence:'',item:description,department:'',recorder:'',unitPrice:0,quantity:0,unit:'',fundSource:'',budgetType:'',requestType:'',replacementCode:'',note:'',policyAlignment:''};
 if(category==='personnel')return{sequence:'',item:description,responsible:'',headcount:null,planAmount:0};
 if(category==='support')return{sequence:'',item:description,parentItem:'',responsible:'',necessity:'',planAmount:0};
 if(category==='central')return{sequence:'',item:description,responsible:'',necessity:'',planAmount:0};
 return{sequence:'',item:description,groupName:'นำเข้าจาก Excel',recorder:'',planAmount:0}
}
function importedCategory(type,value){
 var v=String(value||'').toLocaleLowerCase('th-TH');
 if(type==='income'){if(v==='service'||v.indexOf('ดำเนินงาน')>=0||v.indexOf('บริการ')>=0)return'service';return'other'}
 if(v==='personnel'||v.indexOf('บุคลากร')>=0||v.indexOf('ค่าจ้าง')>=0)return'personnel';
 if(v==='investment'||v.indexOf('ลงทุน')>=0||v.indexOf('ครุภัณฑ์')>=0)return'investment';
 if(v==='support'||v.indexOf('สนับสนุน')>=0)return'support';
 if(v==='central'||v.indexOf('งบกลาง')>=0)return'central';
 return'operating'
}
function importDashboardBackup(rows){
 var grouped={};rows.slice(1).forEach(function(row){var year=normalizeYear(row[0]),kind=String(row[1]||''),payload=String(row[2]||'');if(!year||!kind||!payload)return;grouped[year]=grouped[year]||{entries:[],employees:[],funds:[]};var target=grouped[year];if(kind==='meta')Object.assign(target,JSON.parse(payload));else if(kind==='entry')target.entries.push(JSON.parse(payload));else if(kind==='employee')target.employees.push(JSON.parse(payload));else if(kind==='fund')target.funds.push(JSON.parse(payload))});
 var years=Object.keys(grouped);if(!years.length)throw new Error('ไม่พบข้อมูลสำรองในชีต Dashboard Backup');
 if(!window.confirm('นำเข้าข้อมูล '+years.length+' ปี พ.ศ. ใช่หรือไม่? ปีที่ซ้ำจะถูกแทนที่ด้วยข้อมูลในไฟล์นี้'))return 0;
 years.forEach(function(year){var d=grouped[year];if(!d.plan)d.plan=emptyYear().plan;if(!Array.isArray(d.entries))d.entries=[];if(!Array.isArray(d.employees))d.employees=[];if(!Array.isArray(d.funds))d.funds=[];storeData.years[year]=d});
 return years.length
}
var PHROMPIRAM_SOURCE_SCHEMAS={
 'personnel-summary':{sheets:['1.บุคลากร'],fields:{sequence:{column:0},item:{column:1},responsible:{column:2},headcount:{column:3,number:true,blank:null},planAmount:{column:4,number:true}},monthStart:8},
 compensation:{sheets:['2.1ค่าตอบแทน'],fields:{sequence:{column:0},item:{column:1},responsible:{column:2},planAmount:{column:3,number:true}},monthStart:7},
 'expense-items':{sheets:['2.2(สรุป)ค่าใช้สอย','2.2ค่าใช้สอย'],fields:{recorder:{column:3},planAmount:{column:4,number:true}},monthStart:8},
 materials:{sheets:['2.3ค่าวัสดุ'],fields:{sequence:{column:1},item:{column:2},detail:{parent:true},responsible:{column:4},planAmount:{column:5,number:true}},monthStart:9},
 utilities:{sheets:['2.4ค่าสาธารณูปโภค'],fields:{sequence:{column:0},item:{column:1},responsible:{column:2},planAmount:{column:3,number:true}},monthStart:7},
 'operation-projects':{sheets:['2.5งบดำเนินงาน'],fields:{sequence:{column:0},project:{column:1},workType:{column:2},responsible:{column:3},subdistrictFund:{column:4,number:true},maintenanceFund:{column:5,number:true}},monthStart:9},
 investment:{sheets:['3.งบลงทุน'],fields:{sequence:{column:0},item:{column:3},department:{column:4},recorder:{column:5},unitPrice:{column:6,number:true},quantity:{column:7,number:true},unit:{column:8},fundSource:{column:10},budgetType:{column:11},replacementCode:{column:14},note:{column:15},policyAlignment:{column:16}},monthStart:20},
 support:{sheets:['4.รายจ่ายสนับสนุน'],fields:{sequence:{column:0},item:{column:1},responsible:{column:4},necessity:{column:5},planAmount:{column:6,number:true}},monthStart:10},
 central:{sheets:['5.งบกลาง'],fields:{sequence:{column:0},item:{column:1},responsible:{column:2},necessity:{column:3},planAmount:{column:4,number:true}},monthStart:8}
};
function workbookSheetByName(sheets,names){var keys=names.map(normHeader);return sheets.find(function(sheet){return keys.indexOf(normHeader(sheet.name))>=0})||null}
function workbookRow(sheet,rowNumber){if(!sheet)return null;return sheet.rows.find(function(row){return Number(row._rowNumber)===Number(rowNumber)})||null}
function workbookCell(sheet,rowNumber,column){var row=workbookRow(sheet,rowNumber);return row&&row[column]!=null?row[column]:''}
function importCellText(value){return String(value==null?'':value).trim()}
function importCellNumber(value){var text=importCellText(value);if(!text||text==='-'||text==='—'||text.indexOf('ยังไม่ลงข้อมูล')>=0)return null;var number=Number(text.replace(/[฿,\s]/g,''));return Number.isFinite(number)?number:null}
function nearestGroupedLabel(sheet,rowNumber,fallback){
 for(var row=rowNumber-1;row>0;row--){var label=importCellText(workbookCell(sheet,row,1)),detail=importCellText(workbookCell(sheet,row,2));if(label&&!detail&&!/^\d+(?:\.\d+)*$/.test(label)){var split=splitSequenceLabel(label);return split.label||label}}
 return fallback||''
}
function splitSequenceLabel(value){var text=importCellText(value),match=text.match(/^([0-9]+(?:\.[0-9]+)*)\s*\.?\s*(.*)$/);return match?{sequence:match[1],label:match[2].trim()}:{sequence:'',label:text}}
function refreshExpenseItemFields(form,sheet,rowNumber){
 var sequence=importCellText(workbookCell(sheet,rowNumber,0)),first=importCellText(workbookCell(sheet,rowNumber,1)),second=importCellText(workbookCell(sheet,rowNumber,2));
 if(sequence){form.sequence=sequence;if(first)form.item=first;if(second)form.groupName=second;return}
 if(second){form.sequence=first||form.sequence||'';form.item=second;form.groupName=nearestGroupedLabel(sheet,rowNumber,form.groupName);return}
 if(first){var split=splitSequenceLabel(first);if(split.sequence)form.sequence=split.sequence;if(split.label)form.item=split.label;else if(!form.item)form.item=first;form.groupName=nearestGroupedLabel(sheet,rowNumber,form.groupName)}
}
function refreshSourceWorkbookRecord(record,sourceSheets){
 var config=PHROMPIRAM_SOURCE_SCHEMAS[record.schemaId];if(!config)return record;
 var sheet=sourceSheets[record.schemaId],sourceRow=Number(record.sourceSheetRow),form=clone(record.formData||{});
 if(!sheet||!sourceRow||!workbookRow(sheet,sourceRow))throw new Error('อ่านแถวต้นทางของรายการ '+(record.description||record.id)+' ไม่ได้');
 Object.keys(config.fields).forEach(function(key){var field=config.fields[key],value;
  if(field.parent)value=nearestGroupedLabel(sheet,sourceRow,form[key]);
  else if(field.number){value=importCellNumber(workbookCell(sheet,sourceRow,field.column));if(value==null)value=field.blank===null?null:0}
  else{value=importCellText(workbookCell(sheet,sourceRow,field.column));if(!value)value=form[key]||''}
  form[key]=value
 });
 if(record.schemaId==='expense-items')refreshExpenseItemFields(form,sheet,sourceRow);
 if(record.schemaId==='support'&&!importCellText(workbookCell(sheet,sourceRow,0))){var supportItem=splitSequenceLabel(workbookCell(sheet,sourceRow,1));if(supportItem.sequence)form.sequence=supportItem.sequence;if(supportItem.label)form.item=supportItem.label}
 if(record.schemaId==='central'&&normHeader(importCellText(workbookCell(sheet,sourceRow,0))).indexOf(normHeader('รวมรายจ่ายงบกลาง'))===0)form.sequence='รวม';
 if(record.schemaId==='investment'){
  var isNew=importCellText(workbookCell(sheet,sourceRow,12)),isReplacement=importCellText(workbookCell(sheet,sourceRow,13));
  form.requestType=isNew?'ขอใหม่':isReplacement?'ทดแทน':''
 }
 var months=Array.from({length:12},function(_,index){return importCellNumber(workbookCell(sheet,sourceRow,config.monthStart+index))});
 record.formData=form;record.months=months;record.description=String(form.item||form.project||record.description||'').trim();
 record.amount=months.reduce(function(sum,value){return sum+(Number(value)||0)},0);
 return record
}
function importPhrompiramWorkbook(sheets,filename){
 var dashboard=workbookSheetByName(sheets,['Dashboard 2570']),incomeSheet=workbookSheetByName(sheets,['แผนรายรับรายจ่ายประจำปี']);
 if(!dashboard||!incomeSheet)return null;
 var seed=window.WORKBOOK_SEED;if(!seed||!Array.isArray(seed.records))throw new Error('ไฟล์มีรูปแบบแผนเงินบำรุงปี 2570 แต่ dashboard รุ่นนี้ไม่มีชุดโครงสร้างทะเบียนสำหรับนำเข้า');
 var expensePlan={},categoryNames=[
  ['personnel',['รายจ่ายบุคลากร']],['operating',['รายจ่ายจากการดำเนินงาน']],['investment',['รายจ่ายลงทุน']],['support',['รายจ่ายสนับสนุน']],['central',['งบกลาง']]
 ],foundCategories={};
 dashboard.rows.forEach(function(row){var label=importCellText(row[0]),normalized=normHeader(label);categoryNames.forEach(function(item){if(item[1].some(function(name){return normalized===normHeader(name)})){var amount=importCellNumber(row[1]);if(amount==null)throw new Error('ไม่พบยอดแผนของ'+label+'ในชีต Dashboard 2570');expensePlan[item[0]]=amount;foundCategories[item[0]]=true}})});
 if(categoryNames.some(function(item){return!foundCategories[item[0]]}))throw new Error('ชีต Dashboard 2570 ต้องมีแผนรายจ่ายครบทั้ง 5 หมวด');
 function incomeValue(label,column){var row=incomeSheet.rows.find(function(candidate){return normHeader(importCellText(candidate[4]))===normHeader(label)});if(!row)throw new Error('ไม่พบแถว '+label+' ในชีต '+incomeSheet.name);var value=importCellNumber(row[column]);if(value==null)throw new Error('ไม่พบยอด '+label+' ในชีต '+incomeSheet.name);return value}
 var incomePlan={service:incomeValue('รายรับจากการดำเนินงาน',12),other:incomeValue('รายรับอื่น',12)};
 var sourceSheets={};Object.keys(PHROMPIRAM_SOURCE_SCHEMAS).forEach(function(schemaId){var config=PHROMPIRAM_SOURCE_SCHEMAS[schemaId],sheet=workbookSheetByName(sheets,config.sheets);if(!sheet)throw new Error('ไม่พบชีต '+config.sheets[0]+' ในไฟล์ Excel');sourceSheets[schemaId]=sheet});
 var entries=seed.records.filter(function(record){return record.type==='expense'&&record.schemaId&&record.sourceSheetRow!=null}).map(function(record){return refreshSourceWorkbookRecord(clone(record),sourceSheets)});
 var incomeActual=[['service','รายรับจากการดำเนินงาน',incomeValue('รายรับจากการดำเนินงาน',13)],['other','รายรับอื่น',incomeValue('รายรับอื่น',13)]];
 incomeActual.forEach(function(item){if(item[2]>0)entries.push({id:newId(),year:'2570',type:'income',categoryId:item[0],description:item[1]+' · ยอดจริงจากไฟล์ต้นทาง',amount:item[2],quarter:null,note:'ยอดรวมรายปีจาก '+incomeSheet.name})});
 var previous=storeData.years['2570']||emptyYear(),imported=emptyYear();
 imported.plan={income:incomePlan,expense:expensePlan};imported.entries=entries;imported.employees=Array.isArray(previous.employees)?clone(previous.employees):[];imported.funds=Array.isArray(previous.funds)?clone(previous.funds):[];
 imported.workbookSeedVersion=Number(seed.version)||1;imported.sourceSummary={incomeActual:{total:0,byCategory:{service:0,other:0},byQuarter:[0,0,0,0]},expenseActual:{total:0,byCategory:{personnel:0,operating:0,investment:0,support:0,central:0},byQuarter:[0,0,0,0]},source:{files:[filename],incomeSheet:incomeSheet.name,expenseSheet:dashboard.name,quartersAvailable:true,notes:['ข้อมูลรายชื่อบุคลากรจากชีต “รายละเอียดบุคลากร” ไม่ได้นำเข้า']}};
 if(!window.confirm('นำเข้าแผนเงินบำรุงปี 2570 จำนวน '+entries.length+' รายการ และแทนที่แผนกับรายการปี 2570 ที่มีอยู่หรือไม่? รายชื่อบุคลากรในชีตต้นฉบับจะไม่ถูกนำเข้า และข้อมูลรายชื่อที่บันทึกไว้ใน dashboard จะคงเดิม'))return 0;
 storeData.years['2570']=imported;activeYear='2570';registerCategory='operating';activeSheetId='expense-items';return entries.length
}
function importGenericRows(sheets,filename){
 var selected=null,headerRow=-1,indices=null;
 sheets.some(function(sheet){for(var r=0;r<Math.min(sheet.rows.length,12);r++){var h=sheet.rows[r]||[],candidate={year:columnByAliases(h,['ปี พ.ศ.','ปีงบประมาณ','fiscal year','year']),type:columnByAliases(h,['ประเภท','type']),category:columnByAliases(h,['หมวดหมู่','หมวด','category']),quarter:columnByAliases(h,['ไตรมาส','quarter']),description:columnByAliases(h,['รายการ','รายละเอียด','ชื่อรายการ','description','item']),amount:columnByAliases(h,['จำนวนเงิน','ยอดเงิน','amount']),note:columnByAliases(h,['หมายเหตุ','note'])};if(candidate.description>=0&&candidate.amount>=0&&candidate.category>=0){selected=sheet;headerRow=r;indices=candidate;return true}}return false});
 if(!selected)throw new Error('ไม่พบตารางรายการ ใช้หัวคอลัมน์ ปี พ.ศ., ประเภท, หมวดหมู่, ไตรมาส, รายการ, จำนวนเงิน, หมายเหตุ');
 var parsed=[];selected.rows.slice(headerRow+1).forEach(function(row){var desc=String(row[indices.description]||'').trim(),amountText=String(row[indices.amount]||'').replace(/[,฿\s]/g,''),amount=Number(amountText),categoryText=String(row[indices.category]||'');if(!desc||amountText===''||!Number.isFinite(amount)||amount<0)return;
  var typeText=String(indices.type>=0?row[indices.type]||'':'').toLocaleLowerCase('th-TH'),categoryNormalized=categoryText.toLocaleLowerCase('th-TH'),isIncome=typeText.indexOf('income')>=0||typeText.indexOf('รายรับ')>=0||typeText==='รับ'||(!typeText&&(categoryNormalized.indexOf('รายรับ')>=0||categoryNormalized==='service'||categoryNormalized==='other')),type=isIncome?'income':'expense',year=normalizeYear(indices.year>=0?row[indices.year]:activeYear)||activeYear,category=importedCategory(type,categoryText),qText=String(indices.quarter>=0?row[indices.quarter]||'':''),qMatch=qText.match(/[1-4]/),quarter=qMatch?Number(qMatch[0]):null,note=indices.note>=0?String(row[indices.note]||''):'',record={id:newId(),year:year,type:type,categoryId:category,description:desc,amount:amount,quarter:quarter,note:note,genericImport:true,sourceImport:filename};
  if(type==='expense'){record.schemaId=genericExpenseSchema(category);record.formData=genericFormData(category,desc)}
  parsed.push(record)
 });
 if(!parsed.length)throw new Error('ไม่พบแถวที่มีชื่อรายการและจำนวนเงินถูกต้อง');
 var years=Array.from(new Set(parsed.map(function(x){return x.year})));if(!window.confirm('นำเข้า '+parsed.length+' รายการ ใน '+years.length+' ปี พ.ศ. ใช่หรือไม่? ระบบจะเพิ่มรายการในปีเหล่านั้น'))return 0;
 parsed.forEach(function(item){var d=storeData.years[item.year]||(storeData.years[item.year]=emptyYear());if(!Array.isArray(d.entries))d.entries=[];d.entries.push(item)});
 activeYear=parsed[0].year;registerCategory=parsed[0].type==='income'?'income':parsed[0].categoryId;activeSheetId=parsed[0].type==='income'?'income-transactions':parsed[0].schemaId;
 return parsed.length
}
async function importExcelFile(file){
 if(!file)return;
 try{
  var files=await unzipXlsx(await file.arrayBuffer()),sheets=parseXlsxSheets(files),backupSheet=sheets.find(function(s){return normHeader(s.name)==='dashboardbackup'}),count;
  if(backupSheet)count=importDashboardBackup(backupSheet.rows);
  else{var sourceWorkbookCount=importPhrompiramWorkbook(sheets,file.name);count=sourceWorkbookCount===null?importGenericRows(sheets,file.name):sourceWorkbookCount}
  if(count){if(!storeData.years[activeYear])activeYear=sortedYears().slice(-1)[0]||activeYear;persist();render();showToast('นำเข้าข้อมูล Excel แล้ว · '+count+' '+(backupSheet?'ปี':'รายการ'))}
 }catch(error){window.alert(error.message||'อ่านไฟล์ Excel ไม่สำเร็จ')}
 finally{document.getElementById('excelImportInput').value=''}
}
function recordFormData(record){return record&&record.formData?record.formData:{}}
function recordPlan(record,spec){
 var f=recordFormData(record);
 if(spec.id==='investment')return(Math.max(0,Number(f.unitPrice)||0)*Math.max(0,Number(f.quantity)||0));
 if(spec.id==='operation-projects')return(Math.max(0,Number(f.subdistrictFund)||0)+Math.max(0,Number(f.maintenanceFund)||0));
 return Math.max(0,Number(f.planAmount)||0)
}
function recordTitle(record,spec){
 var f=recordFormData(record);
 return f.item||f.project||f.employeeName||f.source||record.description||'(ไม่ระบุรายการ)'
}
function rowsForSheet(spec){
 var d=currentData();
 if(spec.collection==='employees')return d.employees.filter(function(x){return x.schemaId===spec.id});
 if(spec.collection==='funds')return d.funds.filter(function(x){return x.schemaId===spec.id});
 return d.entries.filter(function(x){return x.type==='expense'&&x.schemaId===spec.id&&x.year===activeYear})
}
function sheetSpendInQuarter(record,q){
 if(Array.isArray(record.months)){return(QUARTER_MONTHS[q]||[]).reduce(function(a,i){var v=record.months[i];return a+(v===null||v===''||v===undefined?0:(Number(v)||0))},0)}
 return Number(record.quarter)===Number(q)?(Number(record.amount)||0):0
}
function renderSheetTabs(){
 var host=document.getElementById('registerSheetTabs');if(!host)return;
 var list=sheetsForCategory(registerCategory);
 if(!list.some(function(s){return s.id===activeSheetId}))activeSheetId=list[0].id;
 host.innerHTML=list.map(function(s){
  var count=s.mode==='income'?entriesFor('income').length:rowsForSheet(s).length;
  return'<button type="button" class="sheet-tab'+(s.id===activeSheetId?' active':'')+'" data-sheet-tab="'+esc(s.id)+'"><span>'+esc(s.title)+'</span><small>'+esc(s.workbook||'')+'</small><b>'+count.toLocaleString('th-TH')+'</b></button>'
 }).join('');
}
function renderRegisterTabs(){
 var tabs=EXPENSE_CATEGORIES.map(function(c,index){
  var count=entriesFor('expense').filter(function(x){return x.categoryId===c.id}).length;
  if(c.id==='personnel')count+=currentData().employees.length;
  var active=registerCategory===c.id?' active':'';
  return'<button type="button" class="register-tab'+active+'" data-register-category="'+c.id+'" style="--register-color:'+COLORS[c.id]+'"><span class="register-index">'+String(index+1).padStart(2,'0')+'</span><span class="register-tab-name">'+esc(c.name)+'</span><span class="register-count">'+count.toLocaleString('th-TH')+'</span></button>'
 }).join('');
 var incomeCount=entriesFor('income').length+currentData().funds.length;
 var incomeActive=registerCategory==='income'?' active':'';
 document.getElementById('registerCategoryTabs').innerHTML='<div class="register-expense-group"><span class="register-group-caption">ทะเบียนรายจ่าย · 5 หมวด</span><div class="register-tab-list">'+tabs+'</div></div><div class="register-income-group"><span class="register-group-caption">ทะเบียนรายรับและเงินรอจัดสรร</span><button type="button" class="register-tab income-register-tab'+incomeActive+'" data-register-category="income"><span class="register-income-icon">฿</span><span class="register-tab-name">รายรับ / กองทุนรอจัดสรร</span><span class="register-count">'+incomeCount.toLocaleString('th-TH')+'</span></button></div>';
 renderSheetTabs()
}
function renderRegistryStats(spec,rows){
 var d=currentData(),html='';
 if(spec&&spec.mode==='income'){
  html='<div class="register-stat"><span>แผนรายรับทั้งปี</span><strong>'+fmt(planTotal(d.plan.income))+' <small>บาท</small></strong></div><div class="register-stat"><span>รับจริงสะสม</span><strong>'+fmt(totalActual('income'))+' <small>บาท</small></strong></div><div class="register-stat"><span>รายการรับจริง</span><strong>'+entriesFor('income').length.toLocaleString('th-TH')+' <small>รายการ</small></strong></div><div class="register-stat"><span>ปีงบประมาณ</span><strong>พ.ศ. '+esc(activeYear)+'</strong></div>'
 }else if(spec&&spec.collection==='funds'){
  var total=rows.reduce(function(s,x){return s+(Number(recordFormData(x).amount)||0)},0);
  html='<div class="register-stat"><span>รายการกองทุนรอจัดสรร</span><strong>'+rows.length.toLocaleString('th-TH')+' <small>รายการ</small></strong></div><div class="register-stat"><span>ยอดเงินรวม</span><strong>'+fmt(total)+' <small>บาท</small></strong></div><div class="register-stat"><span>ชีตต้นฉบับ</span><strong>เงินกองทุนรอจัดสรร</strong></div><div class="register-stat"><span>ปีงบประมาณ</span><strong>พ.ศ. '+esc(activeYear)+'</strong></div>'
 }else if(spec&&spec.collection==='employees'){
  var salary=rows.reduce(function(s,x){return s+(Number(recordFormData(x).salaryYearly)||0)},0);
  html='<div class="register-stat"><span>จำนวนบุคลากรในทะเบียน</span><strong>'+rows.length.toLocaleString('th-TH')+' <small>ราย</small></strong></div><div class="register-stat"><span>ค่าจ้างต่อปีตามทะเบียน</span><strong>'+fmt(salary)+' <small>บาท</small></strong></div><div class="register-stat"><span>ข้อมูลบุคคล</span><strong>เก็บในเครื่องนี้</strong></div><div class="register-stat"><span>ชีตต้นฉบับ</span><strong>รายละเอียดบุคลากร</strong></div>'
 }else{
  var categoryPlan=spec?(Number(d.plan.expense[spec.categoryId])||0):0,detailPlan=spec?rows.reduce(function(s,x){return s+recordPlan(x,spec)},0):0,actual=spec?rows.reduce(function(s,x){return s+entryActual(x)},0):0;
  html='<div class="register-stat"><span>แผนรายจ่ายหมวดนี้ทั้งปี</span><strong>'+fmt(categoryPlan)+' <small>บาท</small></strong></div><div class="register-stat"><span>แผนรวมในชีตนี้</span><strong>'+fmt(detailPlan)+' <small>บาท</small></strong></div><div class="register-stat"><span>ใช้จริงในชีตนี้</span><strong>'+fmt(actual)+' <small>บาท</small></strong></div><div class="register-stat"><span>จำนวนรายการในชีต</span><strong>'+rows.length.toLocaleString('th-TH')+' <small>รายการ</small></strong></div>'
 }
 document.getElementById('registerStats').innerHTML=html
}
function activeColumnFilters(){if(!columnFilters[activeSheetId])columnFilters[activeSheetId]={};return columnFilters[activeSheetId]}
function isNumericFilter(spec,key){
 var numericKeys=['plan','actual','balance','rate','amount','unitPrice','quantity','salaryYearly','socialSecurityYearly','retirementYearly','compensationYearly','headcount','salaryMonthly','socialSecurityMonthly','retirementMonthly','compensationMonthly'];
 return numericKeys.indexOf(key)>=0||!!(spec&&spec.fields&&spec.fields.some(function(field){return field.key===key&&field.type==='number'}))
}
function filterRawValue(record,spec,key){
 var f=recordFormData(record);
 if(key==='item')return recordTitle(record,spec);
 if(key==='plan')return recordPlan(record,spec);
 if(key==='actual')return entryActual(record);
 if(key==='balance')return recordPlan(record,spec)-entryActual(record);
 if(key==='rate'){var plan=recordPlan(record,spec);return plan?entryActual(record)/plan*100:0}
 if(key==='salaryAnnualTotal')return Number(f.salaryYearly)||0;
 if(key==='amount')return spec&&spec.mode==='income'?record.amount:(f.amount!==undefined?f.amount:record.amount);
 if(key==='quarter')return record.quarter;
 if(key==='type')return record.type==='income'?'รายรับ':'รายจ่าย';
 if(key==='categoryId')return categoryFor(record.type,record.categoryId).name;
 if(key==='description')return record.description;
 if(key==='note')return record.note;
 if(key==='allocationYear')return f.allocationYear||activeYear;
 return f[key]!==undefined?f[key]:record[key]
}
function matchesColumnFilters(record,spec){
 var filters=activeColumnFilters();
 return Object.keys(filters).every(function(key){
  var state=filters[key]||{},raw=filterRawValue(record,spec,key);
  if(isNumericFilter(spec,key)){
   var min=state.min==null?'':String(state.min),max=state.max==null?'':String(state.max);
   var value=raw==null||raw===''?null:Number(String(raw).replace(/,/g,''));
   if(value===null||!Number.isFinite(value))return min===''&&max==='';
   return(min===''||value>=Number(min))&&(max===''||value<=Number(max))
  }
  var query=String(state.text||'').trim().toLocaleLowerCase('th-TH');
  return!query||String(raw==null?'':raw).toLocaleLowerCase('th-TH').indexOf(query)>=0
 })
}
function columnFilterControl(key,spec){
 var state=activeColumnFilters()[key]||{},safeKey=esc(key);
 if(isNumericFilter(spec,key))return'<span class="column-filter-range"><input type="number" step="any" data-column-min="'+safeKey+'" value="'+esc(state.min||'')+'" aria-label="ค่าต่ำสุด '+safeKey+'" placeholder="จาก"><input type="number" step="any" data-column-max="'+safeKey+'" value="'+esc(state.max||'')+'" aria-label="ค่าสูงสุด '+safeKey+'" placeholder="ถึง"></span>';
 return'<input class="column-filter-input" type="search" data-column-filter="'+safeKey+'" value="'+esc(state.text||'')+'" aria-label="กรอง '+safeKey+'" placeholder="กรอง">';
}
function columnFilterRow(columns,spec,actionLabel){
 return'<tr class="column-filter-row">'+columns.map(function(column){var key=column[0];return'<th>'+columnFilterControl(key,spec)+'</th>'}).join('')+'<th class="action-cell" aria-label="'+esc(actionLabel||'จัดการ')+'"></th></tr>'
}
function handleColumnFilterInput(event){
 var input=event.target.closest('[data-column-filter],[data-column-min],[data-column-max]');if(!input)return;
 var textKey=input.dataset.columnFilter,numericKey=input.dataset.columnMin||input.dataset.columnMax,key=textKey||numericKey,state=activeColumnFilters()[key]||(activeColumnFilters()[key]={});
 if(textKey)state.text=input.value;else if(input.dataset.columnMin)state.min=input.value;else state.max=input.value;
 var selection=null;try{selection=input.selectionStart}catch(ignore){}
 renderRecords();
 var replacement=Array.from(document.querySelectorAll('[data-column-filter],[data-column-min],[data-column-max]')).find(function(el){return(textKey&&el.dataset.columnFilter===textKey)||(input.dataset.columnMin&&el.dataset.columnMin===numericKey)||(input.dataset.columnMax&&el.dataset.columnMax===numericKey)});
 if(replacement){replacement.focus({preventScroll:true});if(selection!==null&&replacement.type==='search'){try{replacement.setSelectionRange(selection,selection)}catch(ignore){}}}
}
function tableValue(record,spec,key){
 var f=recordFormData(record),v=f[key];
 if(key==='item')v=recordTitle(record,spec);
 if(key==='plan')v=recordPlan(record,spec);
 if(key==='actual')v=entryActual(record);
 if(key==='balance')v=recordPlan(record,spec)-entryActual(record);
 if(key==='rate'){var p=recordPlan(record,spec);v=p?entryActual(record)/p*100:0}
 if(key==='salaryAnnualTotal')v=Number(f.salaryYearly)||0;
 if(key==='amount')v=Number(f.amount)||0;
 if(key==='allocationYear')v=f.allocationYear||activeYear;
 if(v===undefined||v===null||v==='')return'<span class="cell-muted">—</span>';
 if(['plan','actual','balance','rate','salaryYearly','socialSecurityYearly','retirementYearly','compensationYearly','amount','unitPrice'].indexOf(key)>=0){
  return key==='rate'?'<span class="'+rateClass(Number(v))+'">'+pct(v)+'</span>':fmt(v)
 }
 return esc(v)
}
function filteredIncomeRows(){
 var query=document.getElementById('searchRecords').value.trim().toLocaleLowerCase('th-TH'),q=document.getElementById('quarterFilter').value,spec=sheetSpec(activeSheetId);
 return entriesFor('income').filter(function(x){var c=categoryFor('income',x.categoryId).name,txt=[x.description,x.note,c].join(' ').toLocaleLowerCase('th-TH');return(!query||txt.indexOf(query)>=0)&&(q==='all'||String(x.quarter)===q)&&matchesColumnFilters(x,spec)}).sort(function(a,b){return Number(b.quarter)-Number(a.quarter)})
}
function quarterMatchesRecord(record,q){
 if(q==='all')return true;
 if(Array.isArray(record.months)){var inds=QUARTER_MONTHS[Number(q)]||[];return inds.some(function(i){return record.months[i]!==null&&record.months[i]!==undefined&&record.months[i]!==''})}
 return String(record.quarter)===String(q)
}
function renderIncomeRecords(){
 var rows=filteredIncomeRows(),spec=sheetSpec(activeSheetId),cols=[['quarter','ไตรมาส'],['type','ประเภท'],['categoryId','หมวดรายรับ'],['description','รายการ'],['amount','จำนวนเงิน'] ,['note','หมายเหตุ']],head='<tr>'+cols.map(function(c){return'<th'+(c[0]==='amount'?' class="numeric"':'')+'>'+esc(c[1])+'</th>'}).join('')+'<th class="action-cell">จัดการ</th></tr>';
 document.getElementById('recordsHead').innerHTML=head+columnFilterRow(cols,spec);
 var annualOnly=currentData().sourceSummary&&!rows.length;
 document.getElementById('recordsBody').innerHTML=rows.length?rows.map(function(x){var cat=categoryFor('income',x.categoryId);return'<tr><td>'+(x.quarter?'ไตรมาส '+Number(x.quarter):'—')+'</td><td><span class="type-badge income">รายรับ</span></td><td>'+esc(cat.name)+'</td><td class="record-name">'+esc(x.description)+'</td><td class="numeric">'+fmt(x.amount)+' ฿</td><td>'+esc(x.note||'—')+'</td><td><div class="row-actions"><button class="row-action" type="button" data-edit="'+esc(x.id)+'">แก้ไข</button><button class="row-action delete" type="button" data-delete="'+esc(x.id)+'">ลบ</button></div></td></tr>'}).join(''):'<tr><td colspan="7" class="empty-row">'+(annualOnly?'ไฟล์ต้นฉบับนำเข้ายอดสรุปรายปี แต่ไม่มีรายการรับรายตัวในทะเบียนนี้':'ยังไม่มีรายการรับจริง กด “บันทึกรายการ” เพื่อเพิ่มข้อมูล')+'</td></tr>';
 document.getElementById('recordsCount').textContent=rows.length.toLocaleString('th-TH')+' รายการ'
}
function renderFundRecords(spec){
 var rows=rowsForSheet(spec).filter(function(x){var f=recordFormData(x),query=document.getElementById('searchRecords').value.trim().toLocaleLowerCase('th-TH');return(!query||[f.source,f.reason,f.allocationYear].join(' ').toLocaleLowerCase('th-TH').indexOf(query)>=0)&&matchesColumnFilters(x,spec)});
 var cols=spec.tableColumns;
 document.getElementById('recordsHead').innerHTML='<tr>'+cols.map(function(c){return'<th'+(['amount'].indexOf(c[0])>=0?' class="numeric"':'')+'>'+esc(c[1])+'</th>'}).join('')+'<th class="action-cell">จัดการ</th></tr>'+columnFilterRow(cols,spec);
 document.getElementById('recordsBody').innerHTML=rows.length?rows.map(function(x){return'<tr>'+cols.map(function(c){return'<td'+(['amount'].indexOf(c[0])>=0?' class="numeric"':'')+'>'+tableValue(x,spec,c[0])+'</td>'}).join('')+'<td><div class="row-actions"><button class="row-action" type="button" data-edit-sheet="'+esc(x.id)+'">แก้ไข</button><button class="row-action delete" type="button" data-delete-sheet="'+esc(x.id)+'">ลบ</button></div></td></tr>'}).join(''):'<tr><td colspan="'+(cols.length+1)+'" class="empty-row">ยังไม่มีข้อมูล กด “เพิ่มรายการในหมวดนี้” เพื่อบันทึกรายการ</td></tr>';
 document.getElementById('recordsCount').textContent=rows.length.toLocaleString('th-TH')+' รายการ'
}
function renderSheetRecords(spec){
 var query=document.getElementById('searchRecords').value.trim().toLocaleLowerCase('th-TH'),q=document.getElementById('quarterFilter').value;
 var rows=rowsForSheet(spec).filter(function(x){var f=recordFormData(x),txt=spec.fields.map(function(field){return f[field.key]}).concat([x.description]).join(' ').toLocaleLowerCase('th-TH');return(!query||txt.indexOf(query)>=0)&&quarterMatchesRecord(x,q)&&matchesColumnFilters(x,spec)}).sort(function(a,b){return recordTitle(a,spec).localeCompare(recordTitle(b,spec),'th')});
 var cols=spec.tableColumns;
 document.getElementById('recordsHead').innerHTML='<tr>'+cols.map(function(c){return'<th'+(['plan','actual','balance','rate','unitPrice','quantity','salaryYearly','socialSecurityYearly','retirementYearly','compensationYearly'].indexOf(c[0])>=0?' class="numeric"':'')+'>'+esc(c[1])+'</th>'}).join('')+'<th class="action-cell">จัดการ</th></tr>'+columnFilterRow(cols,spec);
 var annualOnly=currentData().sourceSummary&&!rows.length;
 document.getElementById('recordsBody').innerHTML=rows.length?rows.map(function(x){return'<tr>'+cols.map(function(c){return'<td'+(['plan','actual','balance','rate','unitPrice','quantity','salaryYearly','socialSecurityYearly','retirementYearly','compensationYearly'].indexOf(c[0])>=0?' class="numeric"':'')+'>'+tableValue(x,spec,c[0])+'</td>'}).join('')+'<td><div class="row-actions"><button class="row-action" type="button" data-edit-sheet="'+esc(x.id)+'">แก้ไข</button><button class="row-action delete" type="button" data-delete-sheet="'+esc(x.id)+'">ลบ</button></div></td></tr>'}).join(''):'<tr><td colspan="'+(cols.length+1)+'" class="empty-row">'+(annualOnly?'ไฟล์ปีนี้นำเข้ายอดสรุปรายปี ไม่มีรายการย่อยของชีตนี้ในทะเบียน':'ยังไม่มีรายการในชีตนี้ กด “เพิ่มรายการในหมวดนี้” เพื่อเริ่มบันทึก')+'</td></tr>';
 document.getElementById('recordsCount').textContent=rows.length.toLocaleString('th-TH')+' รายการ'
}
function renderRecords(){
 var spec=sheetSpec(activeSheetId);
 if(!spec)spec=sheetSpec('income-transactions');
 var historicalOnly=!!currentData().sourceSummary;
 document.getElementById('registerKind').textContent=spec.mode==='income'?'ทะเบียนรายรับ':(spec.collection==='funds'?'ทะเบียนเงินกองทุนรอจัดสรร':'ชีตต้นฉบับ: '+spec.workbook);
 document.getElementById('registerCategoryTitle').textContent=spec.title;
 document.getElementById('registerCategorySubtitle').textContent=(spec.mode==='income'?'รายการรับเงินจริงในปีงบประมาณ '+activeYear:spec.collection==='employees'?'ทะเบียนค่าจ้างและเงินสมทบตามแท็บรายละเอียดบุคลากร':'รายการตามโครงสร้างชีตต้นฉบับ · ปีงบประมาณ '+activeYear)+(historicalOnly?' · นำเข้ายอดสรุปรายปีแล้ว; รายการย่อยของปีนี้ไม่ได้อยู่ในทะเบียน':'');
 document.getElementById('addCategoryEntryBtn').innerHTML='<span class="plus">＋</span> เพิ่มรายการใน'+(spec.mode==='income'?'ทะเบียนรายรับ':'ชีตนี้');
 document.querySelectorAll('[data-sheet-tab]').forEach(function(btn){btn.classList.toggle('active',btn.dataset.sheetTab===activeSheetId)});
 if(spec.mode==='income'){renderIncomeRecords();renderRegistryStats(spec,[]);return}
 var rows=rowsForSheet(spec);
 renderRegistryStats(spec,rows);
 if(spec.collection==='funds')renderFundRecords(spec);else renderSheetRecords(spec)
}
function openSelectedEntry(){
 if(registerCategory==='income'){
  if(activeSheetId==='unallocated-funds'){openSheetEntry('unallocated-funds');return}
  openEntry(null,'income','service');return
 }
 openSheetEntry(activeSheetId)
}
function sheetFieldMarkup(field,value){
 var val=value==null?'':String(value),required=field.required?' required':'',wide=field.wide?' sheet-field-wide':'',control='';
 if(field.type==='textarea')control='<textarea data-sheet-field="'+field.key+'" rows="3"'+required+' placeholder="'+esc(field.placeholder||'')+'">'+esc(val)+'</textarea>';
 else if(field.type==='select')control='<select data-sheet-field="'+field.key+'"'+required+'><option value="">เลือก'+esc(field.label)+'</option>'+(field.options||[]).map(function(o){return'<option value="'+esc(o)+'"'+(val===o?' selected':'')+'>'+esc(o)+'</option>'}).join('')+'</select>';
 else control='<input data-sheet-field="'+field.key+'" type="'+(field.type==='number'?'number':'text')+'"'+(field.type==='number'?' min="0" step="0.01"':'')+required+' value="'+esc(val)+'" placeholder="'+esc(field.placeholder||'')+'">';
 return'<label class="sheet-form-field'+wide+'"><span>'+esc(field.label)+'</span>'+control+'</label>'
}
function openSheetEntry(sheetId,recordId){
 var spec=sheetSpec(sheetId);if(!spec||spec.mode==='income')return;
 var record=null;
 if(recordId)record=rowsForSheet(spec).find(function(x){return x.id===recordId})||null;
 var f=recordFormData(record),host=document.getElementById('sheetFormFields');
 document.getElementById('sheetForm').reset();
 document.getElementById('sheetRecordId').value=record?record.id:'';
 document.getElementById('sheetEyebrow').textContent='ชีตต้นฉบับ: '+spec.workbook;
 document.getElementById('sheetDialogTitle').textContent=record?'แก้ไข '+spec.title:'เพิ่มรายการ · '+spec.title;
 document.getElementById('sheetFormFields').innerHTML=spec.fields.map(function(field){return sheetFieldMarkup(field,f[field.key])}).join('');
 var monthSection=document.getElementById('sheetMonthSection'),monthHost=document.getElementById('sheetMonthFields'),months=record&&Array.isArray(record.months)?record.months:[];
 if(spec.months){
  monthSection.hidden=false;
  monthHost.innerHTML=FISCAL_MONTHS.map(function(name,index){var v=months[index];return'<label class="month-input"><span>'+name+'</span><input type="number" min="0" step="0.01" inputmode="decimal" data-month-index="'+index+'" value="'+(v===null||v===undefined?'':esc(v))+'" placeholder="ไม่ระบุ"></label>'}).join('');
 }else{monthSection.hidden=true;monthHost.innerHTML=''}
 document.getElementById('employeePrivacyNote').hidden=spec.collection!=='employees';
 document.getElementById('sheetCalculation').hidden=spec.collection==='employees'||spec.collection==='funds';
 document.getElementById('sheetDialog').showModal();
 updateSheetCalculation();
}
function getSheetFormValues(spec){
 var values={};
 document.querySelectorAll('[data-sheet-field]').forEach(function(el){var field=spec.fields.find(function(x){return x.key===el.dataset.sheetField});if(field&&field.type==='number')values[field.key]=el.value===''?null:Number(el.value);else values[el.dataset.sheetField]=el.value.trim()});
 return values
}
function valuesRecord(spec,values,months){
 return{schemaId:spec.id,type:'expense',categoryId:spec.categoryId,formData:values,months:spec.months?months:null,description:values.item||values.project||'',amount:spec.months?months.reduce(function(a,v){return a+(v==null?0:Number(v)||0)},0):0,year:activeYear}
}
function updateSheetCalculation(){
 var spec=sheetSpec(activeSheetId);
 if(!spec||!spec.months||spec.collection==='employees'||spec.collection==='funds')return;
 var values=getSheetFormValues(spec),months=Array.from(document.querySelectorAll('[data-month-index]')).map(function(el){return el.value===''?null:Number(el.value)}),record=valuesRecord(spec,values,months),plan=recordPlan(record,spec),actual=entryActual(record),balance=plan-actual,rate=plan?actual/plan*100:0;
 var cards='<div class="calc-chip"><span>แผนรายการ</span><strong>'+fmt(plan)+' บาท</strong></div><div class="calc-chip"><span>ใช้จริงรายเดือน</span><strong>'+fmt(actual)+' บาท</strong></div><div class="calc-chip"><span>คงเหลือ</span><strong>'+fmt(balance)+' บาท</strong></div><div class="calc-chip"><span>ร้อยละการใช้</span><strong>'+pct(rate)+'</strong></div>';
 document.getElementById('sheetCalculation').innerHTML=cards
}
function saveSheetRecord(e){
 e.preventDefault();
 var spec=sheetSpec(activeSheetId);if(!spec||spec.mode==='income')return;
 var id=document.getElementById('sheetRecordId').value,values=getSheetFormValues(spec),months=spec.months?Array.from(document.querySelectorAll('[data-month-index]')).map(function(el){return el.value===''?null:Number(el.value)}):null;
 if(spec.fields.some(function(field){return field.required&&(values[field.key]===null||values[field.key]==='')})){showToast('กรอกข้อมูลในช่องที่จำเป็นให้ครบ');return}
 var d=currentData(),collection=spec.collection==='employees'?d.employees:spec.collection==='funds'?d.funds:d.entries,oldIndex=collection.findIndex(function(x){return x.id===id}),old=oldIndex>=0?collection[oldIndex]:null;
 var record=valuesRecord(spec,values,months);record.id=id||newId();record.year=activeYear;
 if(spec.collection==='funds'){record.type='fund';record.formData=values;record.amount=Number(values.amount)||0}
 if(spec.collection==='employees'){record.type='employee';record.formData=values}
 if(spec.rollupPlan){
  var delta=recordPlan(record,spec)-(old?recordPlan(old,spec):0);
  d.plan.expense[spec.categoryId]=Math.max(0,(Number(d.plan.expense[spec.categoryId])||0)+delta)
 }
 if(oldIndex>=0)collection[oldIndex]=record;else collection.push(record);
 persist();document.getElementById('sheetDialog').close();render();showToast(old?'แก้ไขรายการแล้ว':'เพิ่มรายการแล้ว')
}
function deleteSheetRecord(id){
 var spec=sheetSpec(activeSheetId);if(!spec)return;
 var d=currentData(),collection=spec.collection==='employees'?d.employees:spec.collection==='funds'?d.funds:d.entries,old=collection.find(function(x){return x.id===id});if(!old)return;
 if(!window.confirm('ต้องการลบรายการ “'+recordTitle(old,spec)+'” ใช่หรือไม่?'))return;
 if(spec.rollupPlan)d.plan.expense[spec.categoryId]=Math.max(0,(Number(d.plan.expense[spec.categoryId])||0)-recordPlan(old,spec));
 if(spec.collection==='employees')d.employees=d.employees.filter(function(x){return x.id!==id});
 else if(spec.collection==='funds')d.funds=d.funds.filter(function(x){return x.id!==id});
 else d.entries=d.entries.filter(function(x){return x.id!==id});
 persist();render();showToast('ลบรายการแล้ว')
}
function exportCsv(){
 var spec=sheetSpec(activeSheetId),rows=[],filename='';
 if(spec&&spec.mode==='income'){rows=filteredIncomeRows().map(function(x){return[activeYear,'ไตรมาส '+x.quarter,'รายรับ',categoryFor('income',x.categoryId).name,x.description,x.amount,x.note||'']});filename='ทะเบียนรายรับ-'+activeYear+'.csv'}
 else if(spec&&spec.collection==='funds'){rows=rowsForSheet(spec).map(function(x){var f=recordFormData(x);return[activeYear,f.source,f.allocationYear,f.amount,f.reason||'']});filename='เงินกองทุนรอจัดสรร-'+activeYear+'.csv'}
 else if(spec){
  rows=rowsForSheet(spec).map(function(x){var f=recordFormData(x);return[activeYear,spec.workbook].concat(spec.fields.map(function(field){return f[field.key]}),spec.months?FISCAL_MONTHS.map(function(m,i){return x.months&&x.months[i]!=null?x.months[i]:''}):[])});
  filename=(spec.workbook||spec.title).replace(/[\\/:*?"<>|]/g,'-')+'-'+activeYear+'.csv'
 }
 var header=spec&&spec.mode==='income'?['ปี พ.ศ.','ไตรมาส','ประเภท','หมวด','รายการ','จำนวนเงิน','หมายเหตุ']:spec&&spec.collection==='funds'?['ปีงบประมาณ','แหล่งเงิน','ปี พ.ศ.','จำนวนเงิน','เหตุผล']:spec?['ปีงบประมาณ','ชีตต้นฉบับ'].concat(spec.fields.map(function(f){return f.label}),spec.months?FISCAL_MONTHS:[]):[];
 var content=[header].concat(rows).map(function(r){return r.map(csvCell).join(',')}).join('\r\n');
 download(filename||'ทะเบียนเงินบำรุง-'+activeYear+'.csv','\ufeff'+content,'text/csv;charset=utf-8')
}
function openEntry(entry,presetType,presetCategory){
 if(entry&&entry.schemaId&&!entry.genericImport){openSheetEntry(entry.schemaId,entry.id);return}
 if(presetType==='expense'){openSheetEntry(activeSheetId);return}
 var form=document.getElementById('entryForm');form.reset();
 document.getElementById('entryId').value=entry?entry.id:'';
 document.getElementById('entryDialogTitle').textContent=entry?'แก้ไขรายการรับเงินจริง':'บันทึกรายการรับเงินจริง';
 document.getElementById('entryType').value=entry?entry.type:(presetType||'income');
 document.getElementById('entryQuarter').value=entry?String(entry.quarter):'1';
 setCategoryChoices(entry?entry.type:'income',entry?entry.categoryId:(presetCategory||'service'));
 document.getElementById('entryDescription').value=entry?entry.description:'';
 document.getElementById('entryAmount').value=entry?entry.amount:'';
 document.getElementById('entryNote').value=entry?entry.note||'':'';
 document.getElementById('entryDialog').showModal()
}
function openView(name){
 document.querySelectorAll('.content-view').forEach(function(el){el.classList.toggle('active',el.id==='view-'+name);el.hidden=el.id!=='view-'+name});
 document.querySelectorAll('[data-view]').forEach(function(el){el.classList.toggle('active',el.getAttribute('data-view')===name)});
 if(name==='records'){renderRegisterTabs();renderRecords()}
 if(name==='compare')renderComparison()
}
function init(){
 hydrateHistoricalYears();
 document.querySelectorAll('[data-view]').forEach(function(btn){btn.addEventListener('click',function(){openView(btn.getAttribute('data-view'))})});
 document.querySelectorAll('[data-open-view]').forEach(function(btn){btn.addEventListener('click',function(){openView(btn.getAttribute('data-open-view'))})});
 document.getElementById('useYearBtn').addEventListener('click',chooseYear);
 document.getElementById('yearInput').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();chooseYear()}});
 document.getElementById('yearSelect').addEventListener('change',function(){var year=normalizeYear(this.value);if(!year)return;activeYear=year;persist();render()});
 document.getElementById('addEntryBtn').addEventListener('click',openSelectedEntry);
 document.getElementById('addEntryBtn2').addEventListener('click',openSelectedEntry);
 document.getElementById('addCategoryEntryBtn').addEventListener('click',openSelectedEntry);
 document.getElementById('registerCategoryTabs').addEventListener('click',function(e){
  var button=e.target.closest('[data-register-category]');if(!button)return;
  registerCategory=button.dataset.registerCategory;
  var list=sheetsForCategory(registerCategory);activeSheetId=list[0].id;
  document.getElementById('searchRecords').value='';document.getElementById('quarterFilter').value='all';
  renderRegisterTabs();renderRecords()
 });
 document.getElementById('registerSheetTabs').addEventListener('click',function(e){
  var button=e.target.closest('[data-sheet-tab]');if(!button)return;
  activeSheetId=button.dataset.sheetTab;document.getElementById('searchRecords').value='';document.getElementById('quarterFilter').value='all';
  renderSheetTabs();renderRecords()
 });
 document.getElementById('sheetForm').addEventListener('submit',saveSheetRecord);
 document.getElementById('sheetForm').addEventListener('input',updateSheetCalculation);
 document.getElementById('sheetForm').addEventListener('change',updateSheetCalculation);
 document.getElementById('entryType').addEventListener('change',function(){setCategoryChoices(this.value)});
 document.getElementById('entryForm').addEventListener('submit',saveEntry);
 document.getElementById('planForm').addEventListener('submit',savePlan);
 document.getElementById('searchRecords').addEventListener('input',renderRecords);
 document.getElementById('quarterFilter').addEventListener('change',renderRecords);
 document.getElementById('recordsHead').addEventListener('input',handleColumnFilterInput);
 document.getElementById('clearFiltersBtn').addEventListener('click',function(){document.getElementById('searchRecords').value='';document.getElementById('quarterFilter').value='all';columnFilters[activeSheetId]={};renderRecords()});
 document.getElementById('exportCsvBtn').addEventListener('click',exportCsv);
 document.getElementById('importExcelBtn').addEventListener('click',function(){document.getElementById('excelImportInput').click()});
 document.getElementById('excelImportInput').addEventListener('change',function(){importExcelFile(this.files&&this.files[0])});
 document.getElementById('exportExcelBtn').addEventListener('click',downloadExcel);
 document.getElementById('exportCompareBtn').addEventListener('click',exportComparisonCsv);
 document.getElementById('compareYearOptions').addEventListener('change',function(e){var input=e.target.closest('[data-compare-year]');if(!input)return;compareYears=Array.from(document.querySelectorAll('[data-compare-year]:checked')).map(function(x){return x.dataset.compareYear});renderComparison()});
 document.getElementById('compareYearOptions').addEventListener('click',function(e){if(!e.target.closest('[data-compare-all]'))return;compareYears=sortedYears();compareKnownYears=sortedYears();renderComparison()});
 document.getElementById('exportBtn').addEventListener('click',exportBackup);
 document.getElementById('managePlanBtn').addEventListener('click',openPlan);
 document.getElementById('managePlanBtn2').addEventListener('click',openPlan);
 document.getElementById('addEntryBtn2').addEventListener('click',openSelectedEntry);
 document.getElementById('recordsBody').addEventListener('click',function(e){
  var editSheet=e.target.closest('[data-edit-sheet]'),deleteSheet=e.target.closest('[data-delete-sheet]'),edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');
  if(editSheet){var sheetItem=currentData().entries.find(function(x){return x.id===editSheet.dataset.editSheet});if(sheetItem&&sheetItem.genericImport)openEntry(sheetItem);else openSheetEntry(activeSheetId,editSheet.dataset.editSheet);return}
  if(deleteSheet){deleteSheetRecord(deleteSheet.dataset.deleteSheet);return}
  if(edit){var item=currentData().entries.find(function(x){return x.id===edit.dataset.edit});if(item)openEntry(item);return}
  if(del)deleteEntry(del.dataset.delete)
 });
 document.getElementById('quarterChart').addEventListener('click',function(e){var row=e.target.closest('[data-quarter]');if(row){registerCategory='operating';activeSheetId='expense-items';openView('records');document.getElementById('quarterFilter').value=row.dataset.quarter;renderRecords()}});
 document.getElementById('quarterChart').addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-quarter]')){e.preventDefault();registerCategory='operating';activeSheetId='expense-items';openView('records');document.getElementById('quarterFilter').value=e.target.dataset.quarter;renderRecords()}});
 document.querySelectorAll('[data-close-dialog]').forEach(function(btn){btn.addEventListener('click',function(){document.getElementById(btn.dataset.closeDialog).close()})});
 render()
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
