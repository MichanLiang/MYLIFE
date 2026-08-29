/* ============================================================
   utils.js — Utilities, State, Constants
   ============================================================ */

const LS = {
  user:'mylife_user', theme:'mylife_theme', order:'mylife_order',
  daily:'mylife_daily', money:'mylife_money', pockets:'mylife_pockets',
  items:'mylife_items', chores:'mylife_chores', articles:'mylife_articles',
  todos:'mylife_todos', budget:'mylife_budget', lists:'mylife_lists',
  dailyGoals:'mylife_dailyGoals', reviews:'mylife_reviews',
  calReviews:'mylife_calReviews', colors:'mylife_colors'
};

function load(key, fallback){ try{ const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; }catch(e){return fallback;} }
function save(key, val){ 
  localStorage.setItem(key, JSON.stringify(val));
  // Sync to Firebase if DB is ready
  if(typeof DB !== 'undefined' && DB.uid){
    DB.save(key, val);
  }
}
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function todayStr(){ return fmtDate(new Date()); }
function fmtDate(d){ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function niceDate(dstr){ const [y,m,d]=dstr.split('-'); return `${parseInt(m)}月${parseInt(d)}日`; }
function esc(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
const WD = ['日','一','二','三','四','五','六'];

function daysUntil(dateStr){
  if(!dateStr) return null;
  const d=new Date(dateStr+'T00:00:00');
  const t=new Date(todayStr()+'T00:00:00');
  return Math.round((d-t)/86400000);
}

function getWeekStart(date){
  const d=new Date(date);
  d.setDate(d.getDate()-d.getDay());
  return d;
}

function getMonthStart(date){
  const d=new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function dateRange(start, end){
  const dates=[];
  const d=new Date(start);
  while(d<=end){ dates.push(fmtDate(d)); d.setDate(d.getDate()+1); }
  return dates;
}

/* ---- Constants ---- */
const MOODS = [
  { key:'happy',   icon:'ph ph-smiley',      label:'開心', color:'#D4923A' },
  { key:'calm',    icon:'ph ph-sun-horizon',  label:'平靜', color:'#6F8F63' },
  { key:'sleepy',  icon:'ph ph-moon-stars',   label:'想睡', color:'#7B6BA3' },
  { key:'angry',   icon:'ph ph-fire',         label:'生氣', color:'#C25450' },
  { key:'sad',     icon:'ph ph-cloud-rain',   label:'難過', color:'#5B8FA8' },
  { key:'excited', icon:'ph ph-sparkle',      label:'興奮', color:'#D4783A' },
];

const MOOD_EMOJI_MAP = {
  '😊':'happy','😌':'calm','😴':'sleepy','😤':'angry',
  '😢':'sad','🤩':'excited'
};
function moodByKey(k){
  if(!k) return MOODS[0];
  if(MOODS.find(m=>m.key===k)) return MOODS.find(m=>m.key===k);
  const mapped = MOOD_EMOJI_MAP[k];
  return mapped ? MOODS.find(m=>m.key===mapped) : MOODS[0];
}
function moodIconHtml(key, size){
  const m = moodByKey(key);
  const sz = size || 20;
  return `<i class="${m.icon}" style="font-size:${sz}px; color:${m.color};"></i>`;
}

const DEFAULT_COLORS = {
  daily:'#6F8F63',
  money:'#4E6E8E',
  item:'#B8842E',
  note:'#8A5578',
  cal:'#a15a3e'
};

const COLOR_LABELS = {
  daily:'日常筆記',
  money:'記帳',
  item:'消耗品',
  note:'文章筆記',
  cal:'行事曆'
};

const TBLOCK_CATS = [
  {k:'work', label:'工作', color:'#4E6E8E'},
  {k:'school', label:'課業', color:'#5B8FA8'},
  {k:'grow', label:'自我提升', color:'#7B6BA3'},
  {k:'rest', label:'休息', color:'#6F8F63'},
  {k:'life', label:'生活瑣事', color:'#B8842E'},
  {k:'social', label:'社交', color:'#8A5578'},
  {k:'none', label:'未填', color:'#DFD5BE'},
];

const MONEY_CATS = [
  {k:'食', ic:'ph ph-fork-knife'},
  {k:'交通', ic:'ph ph-car'},
  {k:'住', ic:'ph ph-house'},
  {k:'生活用品', ic:'ph ph-flask'},
  {k:'服飾', ic:'ph ph-t-shirt'},
  {k:'娛樂', ic:'ph ph-game-controller'},
  {k:'學業', ic:'ph ph-book-open'},
  {k:'通訊', ic:'ph ph-device-mobile'},
  {k:'水電瓦斯', ic:'ph ph-lightning'},
  {k:'禮物', ic:'ph ph-gift'},
  {k:'醫療', ic:'ph ph-pill'},
  {k:'其他', ic:'ph ph-sparkle'}
];

function tblockHours(){ const arr=[]; for(let h=6;h<23;h++) arr.push(h); return arr; }

/* ---- State ---- */
const State = {
  user: load(LS.user, null),
  theme: load(LS.theme, 'default'),
  order: load(LS.order, ['home','calendar','daily','money','items','articles']),
  daily: load(LS.daily, []),
  pockets: load(LS.pockets, []),
  money: load(LS.money, []),
  items: load(LS.items, []),
  chores: load(LS.chores, []),
  articles: load(LS.articles, []),
  todos: load(LS.todos, {}),
  budget: load(LS.budget, { monthly: 0 }),
  lists: load(LS.lists, [{id:'default', name:'預設清單'}]),
  dailyGoals: load(LS.dailyGoals, {}),
  reviews: load(LS.reviews, {}),
  calReviews: load(LS.calReviews, {}),
  colors: load(LS.colors, {...DEFAULT_COLORS})
};

function initDefaultPockets(){
  if(State.pockets.length === 0){
    State.pockets = [
      {id:uid(), name:'錢包', balance:1500, icon:'ph ph-wallet'},
      {id:uid(), name:'銀行帳戶', balance:20000, icon:'ph ph-bank'}
    ];
    save('pockets', State.pockets);
  }
}

function saveState(key){ save(LS[key], State[key]); }
function pocketById(id){ return State.pockets.find(p=>p.id===id); }
function listById(id){ return State.lists.find(l=>l.id===id); }

function hexToRgb(hex){
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return {r,g,b};
}

function rgbToHex(r,g,b){
  return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
}

function lighten(hex, pct){
  const {r,g,b}=hexToRgb(hex);
  return rgbToHex(
    Math.round(r+(255-r)*pct),
    Math.round(g+(255-g)*pct),
    Math.round(b+(255-b)*pct)
  );
}

function applyModuleColors(){
  const c=State.colors;
  const root=document.documentElement;
  root.style.setProperty('--c-daily', c.daily);
  root.style.setProperty('--c-daily-bg', lighten(c.daily, 0.75));
  root.style.setProperty('--c-money', c.money);
  root.style.setProperty('--c-money-bg', lighten(c.money, 0.75));
  root.style.setProperty('--c-item', c.item);
  root.style.setProperty('--c-item-bg', lighten(c.item, 0.75));
  root.style.setProperty('--c-note', c.note);
  root.style.setProperty('--c-note-bg', lighten(c.note, 0.75));
  root.style.setProperty('--c-cal', c.cal);
  root.style.setProperty('--c-cal-bg', lighten(c.cal, 0.75));
}

/* ---- NAV ---- */
const NAV_META = {
  home:{icon:'ph ph-house', label:'首頁'},
  calendar:{icon:'ph ph-calendar', label:'行事曆'},
  daily:{icon:'ph ph-notebook', label:'日常筆記'},
  money:{icon:'ph ph-wallet', label:'記帳'},
  items:{icon:'ph ph-package', label:'消耗品'},
  articles:{icon:'ph ph-file-text', label:'筆記本'},
};

/* ---- Categories for items ---- */
const ITEM_CATEGORIES = ['保養品','食品','清潔用品','文具','日用品','其他'];
