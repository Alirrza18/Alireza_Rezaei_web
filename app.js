// ذخیره‌سازی
const S = k => JSON.parse(localStorage.getItem(k));
const W = (k,v) => localStorage.setItem(k, JSON.stringify(v));

let user     = S('user')     || null;
let users    = S('users')    || [];
let bookings = S('bookings') || [];
let selDate  = null, selTime = null;

// تقویم
function toJalali(gy,gm,gd){
  const g=[0,31,59,90,120,151,181,212,243,273,304,334];
  let y=gy-1600; gm--; gd--;
  let d=y*365+Math.floor((y+3)/4)-Math.floor((y+99)/100)+Math.floor((y+399)/400)+g[gm]+gd;
  if(gm>1&&((gy%4===0&&gy%100!==0)||gy%400===0))d++;
  let jd=d-79,np=Math.floor(jd/12053); jd%=12053;
  let jy=979+33*np+4*Math.floor(jd/1461); jd%=1461;
  if(jd>=366){jy+=Math.floor((jd-1)/365);jd=(jd-1)%365;}
  const j=[0,31,62,93,124,155,186,216,246,276,306,336];
  let jm=0; while(jm<11&&jd>=j[jm+1])jm++;
  return [jy,jm+1,jd-j[jm]+1];
}
function toGregorian(jy,jm,jd){
  jy+=1595; jm--;
  const j=[0,31,62,93,124,155,186,216,246,276,306,336];
  let d=-355779+365*jy+Math.floor(jy/33)*8+Math.floor((jy%33+3)/4)+j[jm]+jd;
  let gy=400*Math.floor(d/146097); d%=146097;
  if(d>36524){gy+=100*Math.floor(--d/36524);d%=36524;if(d>=365)d++;}
  gy+=4*Math.floor(d/1461); d%=1461;
  if(d>365){gy+=Math.floor((d-1)/365);d=(d-1)%365;}
  const s=[0,31,59,90,120,151,181,212,243,273,304,334,365];
  let m=0; while(m<12&&d>=s[m+1])m++;
  return [gy,m+1,d-s[m]+1];
}

const MN=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const jNow=()=>{ const n=new Date(); return toJalali(n.getFullYear(),n.getMonth()+1,n.getDate()); };
const jDays=(y,m)=>m<=6?31:m<=11?30:29;
const el=id=>document.getElementById(id);
const ds=(y,m,d)=>y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');

let [cY,cM]=jNow();

// ساعت‌های کاری
const AM=[],PM=[];
for(let h=8;h<14;h++){AM.push(h+':00',h+':30');}
for(let h=16;h<=21;h++){PM.push(h+':00');if(h<21)PM.push(h+':30');}

// پر کردن رندوم ساعت‌های اشغال
function seed(){
  if(S('s4'))return;
  let [y,m,d]=jNow();
  for(let i=0;i<10;i++){
    const date=ds(y,m,d);
    [...AM,...PM].sort(()=>Math.random()-.5).slice(0,4+Math.floor(Math.random()*4))
      .forEach(t=>bookings.push({id:Math.random(),user:'__',date,time:t}));
    if(++d>jDays(y,m)){d=1;if(++m>12){m=1;y++;}}
  }
  W('bookings',bookings); W('s4',1);
}

// ناوبری
function go(id){
  if(id==='booking'&&!user){go('auth');toast('ابتدا وارد حساب خود شوید');return;}
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  el(id).classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(id==='booking'){drawCal();drawMyList();}
}

// هدر
function drawHeader(){
  el('hbtn').innerHTML = user
    ? `<span style="color:var(--muted);font-size:.83rem">سلام ${user.name.split(' ')[0]}</span> <button class="btn-out" onclick="logout()">خروج</button>`
    : `<button class="btn" onclick="go('auth')">ورود / ثبت‌نام</button>`;
}

// تب‌های ورود
function tab(t){
  el('f-login').style.display = t==='login'?'':'none';
  el('f-reg').style.display   = t==='reg'  ?'':'none';
  el('t-login').className='tab'+(t==='login'?' on':'');
  el('t-reg').className  ='tab'+(t==='reg'  ?' on':'');
  el('l-err').textContent=el('r-err').textContent='';
}

// احراز هویت
function login(){
  const phone=el('l-phone').value.trim(), pass=el('l-pass').value;
  const u=users.find(u=>u.phone===phone&&u.pass===pass);
  if(!u)return el('l-err').textContent='شماره یا رمز اشتباه است';
  doLogin(u);
}
function register(){
  const name=el('r-name').value.trim(),phone=el('r-phone').value.trim(),pass=el('r-pass').value;
  const err=el('r-err');
  if(!name||!phone||!pass)           return err.textContent='همه فیلدها را پر کنید';
  if(!/^09\d{9}$/.test(phone))       return err.textContent='شماره موبایل صحیح نیست';
  if(pass.length<6)                  return err.textContent='رمز حداقل ۶ کاراکتر باشد';
  if(users.find(u=>u.phone===phone)) return err.textContent='این شماره قبلاً ثبت شده';
  const u={name,phone,pass}; users.push(u); W('users',users); doLogin(u);
}
function doLogin(u){user=u;W('user',u);drawHeader();go('booking');toast('خوش آمدید '+u.name.split(' ')[0]);}
function logout(){user=null;localStorage.removeItem('user');selDate=selTime=null;drawHeader();go('home');toast('خارج شدید');}

// تقویم
function drawCal(){
  const [ty,tm,td]=jNow(), total=jDays(cY,cM);
  const [gy1,gm1,gd1]=toGregorian(cY,cM,1);
  const offset=(new Date(gy1,gm1-1,gd1).getDay()+1)%7;
  el('cal-title').textContent=MN[cM-1]+' '+cY;
  const grid=el('cal-grid'); grid.innerHTML='';
  for(let i=0;i<offset;i++) grid.insertAdjacentHTML('beforeend','<div class="day empty"></div>');
  for(let d=1;d<=total;d++){
    const date=ds(cY,cM,d);
    const past=(cY<ty)||(cY===ty&&cM<tm)||(cY===ty&&cM===tm&&d<td);
    const cls=['day',past?'past':'',cY===ty&&cM===tm&&d===td?'today':'',date===selDate?'selected':''].join(' ').trim();
    const div=document.createElement('div'); div.className=cls; div.textContent=d;
    if(!past) div.onclick=()=>pickDate(date,d);
    grid.appendChild(div);
  }
}
function prevM(){if(--cM<1){cM=12;cY--;}reset();}
function nextM(){if(++cM>12){cM=1;cY++;}reset();}
function reset(){selDate=selTime=null;el('times').style.display=el('confirm').style.display='none';drawCal();}

function pickDate(date,day){
  selDate=date; selTime=null; drawCal();
  el('date-lbl').textContent=day+' '+MN[cM-1];
  fillSlots('slots-am',AM,date); fillSlots('slots-pm',PM,date);
  el('times').style.display=''; el('confirm').style.display='none';
  setTimeout(()=>el('times').scrollIntoView({behavior:'smooth',block:'nearest'}),50);
}

// ساعت‌ها
function fillSlots(id,hours,date){
  el(id).innerHTML='';
  hours.forEach(h=>{
    const s=document.createElement('div');
    s.className='slot'; s.textContent=h;
    if(bookings.some(b=>b.date===date&&b.time===h)) s.classList.add('taken');
    else s.onclick=()=>{
      document.querySelectorAll('.slot').forEach(x=>x.classList.remove('picked'));
      s.classList.add('picked'); selTime=h;
      const p=selDate.split('-');
      el('confirm-txt').textContent=`📅 ${+p[2]} ${MN[+p[1]-1]} ${p[0]}  ⏰ ${h}`;
      el('confirm').style.display='flex';
      setTimeout(()=>el('confirm').scrollIntoView({behavior:'smooth',block:'nearest'}),50);
    };
    el(id).appendChild(s);
  });
}

// رزرو
function doBook(){
  if(!selDate||!selTime)return;
  bookings.push({id:Date.now(),user:user.phone,date:selDate,time:selTime});
  W('bookings',bookings); toast('نوبت رزرو شد ✓');
  selDate=selTime=null; el('times').style.display=el('confirm').style.display='none';
  drawCal(); drawMyList();
}

// لیست رزروها
function drawMyList(){
  const list=bookings.filter(b=>b.user===user.phone).sort((a,b)=>a.date.localeCompare(b.date));
  el('my-list').innerHTML = list.length
    ? '<h3>رزروهای شما</h3>'+list.map(b=>{
        const p=b.date.split('-');
        return `<div class="b-item"><span>📅 ${+p[2]} ${MN[+p[1]-1]} — ساعت ${b.time}</span><button onclick="cancel(${b.id})">لغو</button></div>`;
      }).join('')
    : '';
}
function cancel(id){
  bookings=bookings.filter(b=>b.id!==id); W('bookings',bookings);
  drawMyList(); drawCal();
  if(selDate){const p=selDate.split('-');pickDate(selDate,+p[2]);}
  toast('نوبت لغو شد');
}
function toast(msg){el('toast').textContent=msg;el('toast').classList.add('show');setTimeout(()=>el('toast').classList.remove('show'),2600);}

// شروع
seed(); drawHeader();
user ? go('booking') : drawCal();
